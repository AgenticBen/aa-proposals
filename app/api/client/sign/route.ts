import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/server";
import { getDocumentById } from "@/lib/data/documents";
import { getCurrentVisibleVersion } from "@/lib/data/versions";
import {
  getSignatureByDocumentId,
  updateSignatureEmailStatus,
} from "@/lib/data/signatures";
import { hashSections } from "@/lib/utils/hash";
import { renderExecutedPDF } from "@/lib/pdf/ExecutedProposal";
import { sendExecutedEmails } from "@/lib/email/executed";
import { CONSENT_TEXT } from "@/lib/consent";
import type { InkColor, Section, Signature } from "@/lib/types";

export const dynamic = "force-dynamic";

const INK_COLORS: InkColor[] = ["black", "blue", "red"];
const PNG_DATA_URL_PREFIX = "data:image/png;base64,";
const MAX_SIGNATURE_BYTES = 2 * 1024 * 1024; // generous; signature_pad PNGs are ~10-50KB

/**
 * POST /api/client/sign — the atomic signing transaction (SPEC §6).
 *
 * The payload carries signature data ONLY (name, email, ink, consent echo,
 * PNG). Content is never accepted from the client: the frozen snapshot is
 * read from the database after the status claim succeeds.
 *
 * Concurrency: the conditional UPDATE documents SET status='signed' WHERE
 * status='live' is the race lock. Exactly one request can win it; a second
 * confirm (double-click, stale tab) matches zero rows and gets 409. Because
 * every content-mutation route already rejects signed documents, reading the
 * snapshot AFTER winning the claim guarantees we freeze exactly what the
 * confirm-time current visible version is.
 */
export async function POST(request: NextRequest) {
  // ── 0. Parse + validate signature payload ────────────────────────────────
  let body: {
    document_id?: unknown;
    signer_name?: unknown;
    signer_email?: unknown;
    ink_color?: unknown;
    consent?: unknown;
    consent_text?: unknown;
    signature_png?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { document_id, signer_name, signer_email, ink_color, consent, consent_text, signature_png } = body;

  if (
    typeof document_id !== "string" ||
    typeof signer_name !== "string" ||
    !signer_name.trim() ||
    signer_name.trim().length > 200 ||
    typeof signer_email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signer_email.trim())
  ) {
    return NextResponse.json(
      { error: "document_id, signer_name (max 200 chars), and a valid signer_email are required" },
      { status: 400 }
    );
  }

  if (typeof ink_color !== "string" || !INK_COLORS.includes(ink_color as InkColor)) {
    return NextResponse.json({ error: "ink_color must be black, blue, or red" }, { status: 400 });
  }

  if (consent !== true || consent_text !== CONSENT_TEXT) {
    return NextResponse.json(
      { error: "Electronic-signature consent is required before signing" },
      { status: 400 }
    );
  }

  if (typeof signature_png !== "string" || !signature_png.startsWith(PNG_DATA_URL_PREFIX)) {
    return NextResponse.json({ error: "signature_png must be a PNG data URL" }, { status: 400 });
  }

  let pngBuffer: Buffer;
  try {
    pngBuffer = Buffer.from(signature_png.slice(PNG_DATA_URL_PREFIX.length), "base64");
  } catch {
    return NextResponse.json({ error: "signature_png is not valid base64" }, { status: 400 });
  }
  if (pngBuffer.length === 0 || pngBuffer.length > MAX_SIGNATURE_BYTES) {
    return NextResponse.json({ error: "Signature image is empty or too large" }, { status: 400 });
  }

  // ── 1. Re-verify: exists, live, unsigned ─────────────────────────────────
  const doc = await getDocumentById(document_id);
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (doc.status !== "live") {
    return NextResponse.json(
      { error: "This document is not available for signing" },
      { status: 409 }
    );
  }
  const existingSignature = await getSignatureByDocumentId(doc.id);
  if (existingSignature) {
    return NextResponse.json(
      { error: "This document has already been signed" },
      { status: 409 }
    );
  }

  const supabase = createServerClient();

  // ── 2. Atomic claim: live → signed (the race lock) ───────────────────────
  const { data: claimed, error: claimError } = await supabase
    .from("documents")
    .update({ status: "signed" })
    .eq("id", doc.id)
    .eq("status", "live")
    .select("id");

  if (claimError) {
    return NextResponse.json({ error: "Signing failed, please try again" }, { status: 500 });
  }
  if (!claimed || claimed.length === 0) {
    // Someone else won the race, or the doc was toggled off mid-flight
    return NextResponse.json(
      { error: "This document is not available for signing" },
      { status: 409 }
    );
  }

  // From here the document is claimed. If we fail before the signature row
  // exists, revert to live so the client can try again.
  const revertClaim = async () => {
    await supabase.from("documents").update({ status: "live" }).eq("id", doc.id);
  };

  // ── 3. Freeze from the database + hash ───────────────────────────────────
  let signatureRow: Signature;
  let frozenSections: Section[];
  try {
    const version = await getCurrentVisibleVersion(doc.id);
    if (!version) {
      throw new Error("No client-visible version to sign");
    }
    frozenSections = version.sections as Section[];
    const contentHash = hashSections(frozenSections);

    // ── 4. Persist signature PNG + signatures row ──────────────────────────
    const signaturePngPath = `${doc.id}/signature.png`;
    const { error: uploadError } = await supabase.storage
      .from("signatures")
      .upload(signaturePngPath, pngBuffer, { contentType: "image/png", upsert: true });
    if (uploadError) {
      throw new Error(`Signature upload failed: ${uploadError.message}`);
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      null;
    const userAgent = request.headers.get("user-agent") ?? null;

    const { data: inserted, error: insertError } = await supabase
      .from("signatures")
      .insert({
        document_id: doc.id,
        version_id: version.id,
        signer_name: signer_name.trim(),
        signer_email: signer_email.trim(),
        signature_png: signaturePngPath,
        ink_color,
        consent_text: CONSENT_TEXT,
        content_hash: contentHash,
        ip,
        user_agent: userAgent,
        signed_at: new Date().toISOString(),
      })
      .select("*")
      .single();
    if (insertError || !inserted) {
      throw new Error(`Signature insert failed: ${insertError?.message}`);
    }
    signatureRow = inserted as Signature;
  } catch (err) {
    await revertClaim();
    console.error("[sign] transaction failed before signature persisted:", err);
    return NextResponse.json({ error: "Signing failed, please try again" }, { status: 500 });
  }

  // ── The signature now stands. Nothing below may undo it. ─────────────────

  // ── 5. Executed PDF from the frozen snapshot ─────────────────────────────
  let executedPdf: Buffer | null = null;
  try {
    executedPdf = await renderExecutedPDF(doc, frozenSections, signatureRow, pngBuffer);
    const executedPdfPath = `${doc.id}/executed.pdf`;
    const { error: pdfUploadError } = await supabase.storage
      .from("executed-pdfs")
      .upload(executedPdfPath, executedPdf, { contentType: "application/pdf", upsert: true });
    if (pdfUploadError) {
      throw new Error(`Executed PDF upload failed: ${pdfUploadError.message}`);
    }
    const { error: pathError } = await supabase
      .from("signatures")
      .update({ executed_pdf: executedPdfPath })
      .eq("id", signatureRow.id);
    if (pathError) {
      throw new Error(`Executed PDF path update failed: ${pathError.message}`);
    }
  } catch (err) {
    // Signature stands; record the failure so the admin retry can regenerate
    console.error("[sign] executed PDF failed:", err);
    await updateSignatureEmailStatus(signatureRow.id, {
      sent: false,
      error: `Executed PDF generation failed: ${err instanceof Error ? err.message : err}`,
    }).catch(() => {});
    return NextResponse.json(
      {
        ok: true,
        signed_at: signatureRow.signed_at,
        signer_name: signatureRow.signer_name,
        signer_email: signatureRow.signer_email,
        email_sent: false,
      },
      { status: 201 }
    );
  }

  // ── 6. Email both parties; failure never undoes the signature ────────────
  const emailOutcome = await sendExecutedEmails(doc, signatureRow, executedPdf);
  await updateSignatureEmailStatus(signatureRow.id, emailOutcome).catch((err) => {
    console.error("[sign] failed to record email status:", err);
  });
  if (!emailOutcome.sent) {
    console.error("[sign] executed email failed:", emailOutcome.error);
  }

  return NextResponse.json(
    {
      ok: true,
      signed_at: signatureRow.signed_at,
      signer_name: signatureRow.signer_name,
      signer_email: signatureRow.signer_email,
      email_sent: emailOutcome.sent,
    },
    { status: 201 }
  );
}
