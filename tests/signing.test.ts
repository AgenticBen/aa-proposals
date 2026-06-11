/**
 * Signing transaction tests (SPEC §6, PLAN Phase 4):
 * - signing a draft document fails
 * - double-submit race: the second confirm gets 409
 * - the stored content_hash matches a recomputed hash of the DB snapshot
 *   (content comes from the database, never the client payload)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { hashSections } from "@/lib/utils/hash";
import { CONSENT_TEXT } from "@/lib/consent";

// ---------------------------------------------------------------------------
// Hoisted mock primitives
// ---------------------------------------------------------------------------
const h = vi.hoisted(() => {
  return {
    mockGetDocumentById: vi.fn(),
    mockGetCurrentVisibleVersion: vi.fn(),
    mockGetSignatureByDocumentId: vi.fn(),
    mockUpdateSignatureEmailStatus: vi.fn(async () => {}),
    mockUpload: vi.fn(async () => ({ error: null })),
    mockSendExecutedEmails: vi.fn(async () => ({ sent: true as const })),
    // FIFO of resolvers for awaited supabase.from() chains, in call order
    chainResults: [] as Array<(chain: { _insert?: unknown; _update?: unknown }) => { data?: unknown; error?: unknown }>,
    inserts: [] as Array<Record<string, unknown>>,
    updates: [] as Array<Record<string, unknown>>,
  };
});

vi.mock("@/lib/data/documents", () => ({
  getDocumentById: h.mockGetDocumentById,
}));
vi.mock("@/lib/data/versions", () => ({
  getCurrentVisibleVersion: h.mockGetCurrentVisibleVersion,
}));
vi.mock("@/lib/data/signatures", () => ({
  getSignatureByDocumentId: h.mockGetSignatureByDocumentId,
  updateSignatureEmailStatus: h.mockUpdateSignatureEmailStatus,
}));
vi.mock("@/lib/pdf/ExecutedProposal", () => ({
  renderExecutedPDF: vi.fn(async () => Buffer.from("%PDF-fake")),
}));
vi.mock("@/lib/email/executed", () => ({
  sendExecutedEmails: h.mockSendExecutedEmails,
}));

vi.mock("@/lib/db/server", () => ({
  createServerClient: () => ({
    from: () => {
      const chain: Record<string, unknown> & { _insert?: unknown; _update?: unknown } = {};
      for (const m of ["select", "eq", "order", "limit", "in", "single", "maybeSingle"]) {
        chain[m] = () => chain;
      }
      chain.insert = (payload: Record<string, unknown>) => {
        chain._insert = payload;
        h.inserts.push(payload);
        return chain;
      };
      chain.update = (payload: Record<string, unknown>) => {
        chain._update = payload;
        h.updates.push(payload);
        return chain;
      };
      // Awaiting the chain resolves the next queued result (default: empty ok)
      (chain as { then?: unknown }).then = (
        resolve: (v: unknown) => unknown,
        reject: (e: unknown) => unknown
      ) => {
        const handler = h.chainResults.shift() ?? (() => ({ data: null, error: null }));
        return Promise.resolve()
          .then(() => handler(chain))
          .then(resolve, reject);
      };
      return chain;
    },
    storage: { from: () => ({ upload: h.mockUpload }) },
  }),
}));

import { POST as postSign } from "@/app/api/client/sign/route";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const SECTIONS = [
  { id: "s2", heading: "Investment", body_md: "Total: $18,000", order: 2 },
  { id: "s1", heading: "Overview", body_md: "A *great* proposal.", order: 1 },
];

const LIVE_DOC = {
  id: "doc-1",
  slug: "test-proposal-abc123def456",
  title: "Test Proposal",
  status: "live",
  signer_email: "client@example.com",
};

const PNG_DATA_URL =
  "data:image/png;base64," +
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).toString("base64");

function makeSignReq(overrides: Record<string, unknown> = {}): NextRequest {
  return new NextRequest("http://localhost/api/client/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      document_id: "doc-1",
      signer_name: "Marcus Chen",
      signer_email: "marcus@example.com",
      ink_color: "blue",
      consent: true,
      consent_text: CONSENT_TEXT,
      signature_png: PNG_DATA_URL,
      ...overrides,
    }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  h.chainResults.length = 0;
  h.inserts.length = 0;
  h.updates.length = 0;
  h.mockGetSignatureByDocumentId.mockResolvedValue(null);
  h.mockGetCurrentVisibleVersion.mockResolvedValue({
    id: "version-1",
    document_id: "doc-1",
    version_number: 2,
    sections: SECTIONS,
  });
  h.mockSendExecutedEmails.mockResolvedValue({ sent: true });
  h.mockUpload.mockResolvedValue({ error: null });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("POST /api/client/sign", () => {
  it("rejects signing a draft document with 409", async () => {
    h.mockGetDocumentById.mockResolvedValue({ ...LIVE_DOC, status: "draft" });
    const res = await postSign(makeSignReq());
    expect(res.status).toBe(409);
  });

  it("rejects an already-signed document with 409", async () => {
    h.mockGetDocumentById.mockResolvedValue(LIVE_DOC);
    h.mockGetSignatureByDocumentId.mockResolvedValue({ id: "sig-existing" });
    const res = await postSign(makeSignReq());
    expect(res.status).toBe(409);
  });

  it("rejects without consent (400) and never claims the document", async () => {
    h.mockGetDocumentById.mockResolvedValue(LIVE_DOC);
    const res = await postSign(makeSignReq({ consent: false }));
    expect(res.status).toBe(400);
    expect(h.updates).toHaveLength(0);
  });

  it("rejects a tampered consent text with 400", async () => {
    h.mockGetDocumentById.mockResolvedValue(LIVE_DOC);
    const res = await postSign(makeSignReq({ consent_text: "I agree to whatever" }));
    expect(res.status).toBe(400);
  });

  it("double-submit race: losing the atomic claim returns 409", async () => {
    h.mockGetDocumentById.mockResolvedValue(LIVE_DOC);
    // The conditional UPDATE ... WHERE status='live' matches zero rows
    h.chainResults.push(() => ({ data: [], error: null }));
    const res = await postSign(makeSignReq());
    expect(res.status).toBe(409);
    expect(h.inserts).toHaveLength(0); // no signature row was written
  });

  it("signs successfully: hash is computed from the DB snapshot, consent text is the canonical one", async () => {
    h.mockGetDocumentById.mockResolvedValue(LIVE_DOC);
    h.chainResults.push(
      // 1. atomic claim wins
      () => ({ data: [{ id: "doc-1" }], error: null }),
      // 2. signatures insert returns the inserted row
      (chain) => ({
        data: { ...(chain._insert as Record<string, unknown>), id: "sig-1", created_at: "now", executed_pdf: null },
        error: null,
      }),
      // 3. executed_pdf path update
      () => ({ data: null, error: null })
    );

    const res = await postSign(makeSignReq());
    expect(res.status).toBe(201);
    const body = (await res.json()) as { ok: boolean; email_sent: boolean };
    expect(body.ok).toBe(true);
    expect(body.email_sent).toBe(true);

    const sigInsert = h.inserts.find((p) => "content_hash" in p)!;
    expect(sigInsert).toBeDefined();
    // Non-Negotiable #1: hash recomputed from the stored snapshot must match
    expect(sigInsert.content_hash).toBe(hashSections(SECTIONS));
    expect(sigInsert.version_id).toBe("version-1");
    expect(sigInsert.consent_text).toBe(CONSENT_TEXT);
    expect(sigInsert.ink_color).toBe("blue");

    // Both storage uploads happened: signature PNG + executed PDF
    expect(h.mockUpload).toHaveBeenCalledTimes(2);
    // Both parties were emailed
    expect(h.mockSendExecutedEmails).toHaveBeenCalledTimes(1);
    expect(h.mockUpdateSignatureEmailStatus).toHaveBeenCalledWith("sig-1", { sent: true });
  });

  it("email failure: signature stands, failure recorded, response still ok", async () => {
    h.mockGetDocumentById.mockResolvedValue(LIVE_DOC);
    h.mockSendExecutedEmails.mockResolvedValue({ sent: false, error: "SMTP down" });
    h.chainResults.push(
      () => ({ data: [{ id: "doc-1" }], error: null }),
      (chain) => ({
        data: { ...(chain._insert as Record<string, unknown>), id: "sig-1", created_at: "now", executed_pdf: null },
        error: null,
      }),
      () => ({ data: null, error: null })
    );

    const res = await postSign(makeSignReq());
    expect(res.status).toBe(201);
    const body = (await res.json()) as { ok: boolean; email_sent: boolean };
    expect(body.ok).toBe(true);
    expect(body.email_sent).toBe(false);
    expect(h.mockUpdateSignatureEmailStatus).toHaveBeenCalledWith("sig-1", {
      sent: false,
      error: "SMTP down",
    });
    // The claim was never reverted — document stays signed
    const reverts = h.updates.filter((u) => u.status === "live");
    expect(reverts).toHaveLength(0);
  });

  it("failure before the signature row persists reverts the claim to live", async () => {
    h.mockGetDocumentById.mockResolvedValue(LIVE_DOC);
    h.mockUpload.mockResolvedValueOnce({ error: { message: "bucket unavailable" } });
    h.chainResults.push(
      // 1. claim wins
      () => ({ data: [{ id: "doc-1" }], error: null }),
      // 2. revert update (await resolves default ok)
      () => ({ data: null, error: null })
    );

    const res = await postSign(makeSignReq());
    expect(res.status).toBe(500);
    // Compensating update set status back to live
    const reverts = h.updates.filter((u) => u.status === "live");
    expect(reverts).toHaveLength(1);
    expect(h.inserts).toHaveLength(0);
  });
});
