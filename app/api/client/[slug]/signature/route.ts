import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/server";
import { getDocumentBySlug } from "@/lib/data/documents";
import { getSignatureByDocumentId } from "@/lib/data/signatures";

export const dynamic = "force-dynamic";

/**
 * GET /api/client/[slug]/signature
 * Streams the signature PNG from private storage for a signed document.
 * The slug is the access token, same as the page itself.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const doc = await getDocumentBySlug(slug);
  if (!doc || doc.status !== "signed") {
    return new NextResponse("Not found", { status: 404 });
  }

  const signature = await getSignatureByDocumentId(doc.id);
  if (!signature) {
    return new NextResponse("Not found", { status: 404 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase.storage
    .from("signatures")
    .download(signature.signature_png);
  if (error || !data) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(new Uint8Array(await data.arrayBuffer()), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
    },
  });
}
