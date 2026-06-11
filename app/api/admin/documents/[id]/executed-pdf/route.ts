import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getDocumentById } from "@/lib/data/documents";
import { getOrCreateExecutedPdf } from "@/lib/pdf/executed-pdf";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/documents/[id]/executed-pdf
 * Downloads the executed PDF for a signed/archived document.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const doc = await getDocumentById(id);
  if (!doc || (doc.status !== "signed" && doc.status !== "archived")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const executed = await getOrCreateExecutedPdf(doc);
  if (!executed) {
    return new NextResponse("No signature on record", { status: 404 });
  }

  const safeName = doc.slug.replace(/[^a-z0-9-]/gi, "-");
  return new NextResponse(new Uint8Array(executed.pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName}-executed.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
