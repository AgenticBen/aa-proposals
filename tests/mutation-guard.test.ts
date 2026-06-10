/**
 * Mutation guard tests — every write route that touches a document must
 * return HTTP 409 when that document has status = "signed".
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Hoisted mock primitives — must run before vi.mock factories
// ---------------------------------------------------------------------------
const { mockMaybeSingle } = vi.hoisted(() => {
  return { mockMaybeSingle: vi.fn() };
});

// Always authenticate as the admin
vi.mock("@/lib/auth/require-admin", () => ({
  requireAdmin: async () => ({ userId: "admin-test" }),
}));

// Return a signed document for every DB lookup
vi.mock("@/lib/db/server", () => ({
  createServerClient: () => {
    const c: Record<string, unknown> = {};
    for (const method of ["select", "eq", "order", "limit", "insert", "update", "in"]) {
      c[method] = () => c;
    }
    c.maybeSingle = mockMaybeSingle;
    c.single = vi.fn().mockResolvedValue({ data: null, error: null });
    return { from: () => c };
  },
}));

// ---------------------------------------------------------------------------
// Import handlers (after mocks are registered)
// ---------------------------------------------------------------------------
import { PATCH as patchDocStatus } from "@/app/api/admin/documents/[id]/status/route";
import { POST as postVersion } from "@/app/api/admin/documents/[id]/versions/route";
import { POST as postImportMd } from "@/app/api/admin/documents/[id]/import-md/route";
import { PATCH as patchVersionVisibility } from "@/app/api/admin/versions/[id]/route";
import { PATCH as patchComment } from "@/app/api/admin/comments/[id]/route";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeReq(body: unknown, method = "POST"): NextRequest {
  return new NextRequest("http://localhost/api/test", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeCtx(id: string) {
  return { params: Promise.resolve({ id }) };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("Mutation guard — signed document returns 409", () => {
  beforeEach(() => {
    // Every maybeSingle() call resolves to a signed document row.
    // The document_id field satisfies the comments route (which reads comment
    // first, then looks up the parent document).
    mockMaybeSingle.mockResolvedValue({
      data: { status: "signed", document_id: "doc-signed" },
      error: null,
    });
  });

  it("PATCH /documents/[id]/status → 409 on signed doc", async () => {
    const res = await patchDocStatus(
      makeReq({ status: "draft" }, "PATCH"),
      makeCtx("doc-signed")
    );
    expect(res.status).toBe(409);
  });

  it("POST /documents/[id]/versions → 409 on signed doc", async () => {
    const res = await postVersion(
      makeReq({ sections: [], note: "", visible_to_client: false }),
      makeCtx("doc-signed")
    );
    expect(res.status).toBe(409);
  });

  it("POST /documents/[id]/import-md → 409 on signed doc", async () => {
    const res = await postImportMd(
      makeReq({ markdown: "## Section\nBody text" }),
      makeCtx("doc-signed")
    );
    expect(res.status).toBe(409);
  });

  it("PATCH /versions/[id] → 409 on signed parent doc", async () => {
    const res = await patchVersionVisibility(
      makeReq({ visible_to_client: true, document_id: "doc-signed" }, "PATCH"),
      makeCtx("version-id")
    );
    expect(res.status).toBe(409);
  });

  it("PATCH /comments/[id] → 409 on signed parent doc", async () => {
    const res = await patchComment(
      makeReq({ resolved: true }, "PATCH"),
      makeCtx("comment-id")
    );
    expect(res.status).toBe(409);
  });
});
