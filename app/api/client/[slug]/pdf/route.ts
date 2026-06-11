import { NextRequest, NextResponse } from "next/server";
import { getDocumentBySlug } from "@/lib/data/documents";
import { getCurrentVisibleVersion } from "@/lib/data/versions";
import { renderDraftPDF } from "@/lib/pdf/DraftProposal";
import { getOrCreateExecutedPdf } from "@/lib/pdf/executed-pdf";

export const dynamic = "force-dynamic";

/**
 * GET /api/client/[slug]/pdf
 * Live documents: draft PDF of the current visible version (DRAFT watermark).
 * Signed documents: the executed PDF (frozen snapshot + audit block).
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

  const safeName = slug.replace(/[^a-z0-9-]/gi, "-");

  if (doc.status === "signed") {
    const executed = await getOrCreateExecutedPdf(doc);
    if (!executed) {
      return new NextResponse("Not found", { status: 404 });
    }
    return new NextResponse(new Uint8Array(executed.pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName}-executed.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const version = await getCurrentVisibleVersion(doc.id);
  if (!version) {
    return new NextResponse("No visible version", { status: 404 });
  }

  const buffer = await renderDraftPDF(doc, version);

  // NextResponse accepts Uint8Array; Buffer extends Uint8Array so this is safe
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName}-draft.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
