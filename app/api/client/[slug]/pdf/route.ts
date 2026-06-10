import { NextRequest, NextResponse } from "next/server";
import { getDocumentBySlug } from "@/lib/data/documents";
import { getCurrentVisibleVersion } from "@/lib/data/versions";
import { renderDraftPDF } from "@/lib/pdf/DraftProposal";

export const dynamic = "force-dynamic";

/**
 * GET /api/client/[slug]/pdf
 * Returns a draft PDF of the current visible version.
 * Available for live and signed documents.
 * Signed documents will still use this route in Phase 3; Phase 4 adds the executed PDF.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const doc = await getDocumentBySlug(slug);
  if (!doc || (doc.status !== "live" && doc.status !== "signed")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const version = await getCurrentVisibleVersion(doc.id);
  if (!version) {
    return new NextResponse("No visible version", { status: 404 });
  }

  const buffer = await renderDraftPDF(doc, version);

  const safeName = slug.replace(/[^a-z0-9-]/gi, "-");
  // NextResponse accepts Uint8Array; Buffer extends Uint8Array so this is safe
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName}-draft.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
