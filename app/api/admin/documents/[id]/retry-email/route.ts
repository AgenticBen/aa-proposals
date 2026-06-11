import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getDocumentById } from "@/lib/data/documents";
import { updateSignatureEmailStatus } from "@/lib/data/signatures";
import { getOrCreateExecutedPdf } from "@/lib/pdf/executed-pdf";
import { sendExecutedEmails } from "@/lib/email/executed";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/documents/[id]/retry-email
 * Re-sends the executed-PDF emails after a failure (SPEC §6.6).
 * Regenerates the executed PDF from the frozen snapshot if it is missing.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const doc = await getDocumentById(id);
  if (!doc || (doc.status !== "signed" && doc.status !== "archived")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let executed;
  try {
    executed = await getOrCreateExecutedPdf(doc);
  } catch (err) {
    return NextResponse.json(
      { error: `Could not produce executed PDF: ${err instanceof Error ? err.message : err}` },
      { status: 500 }
    );
  }
  if (!executed) {
    return NextResponse.json({ error: "No signature on record" }, { status: 404 });
  }

  const outcome = await sendExecutedEmails(doc, executed.signature, executed.pdf);
  await updateSignatureEmailStatus(executed.signature.id, outcome);

  if (!outcome.sent) {
    return NextResponse.json({ error: outcome.error }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
