import { NextRequest, NextResponse } from "next/server";
import { updateComment } from "@/lib/data/comments";
import { getDocumentById } from "@/lib/data/documents";
import { createServerClient } from "@/lib/db/server";

/**
 * PATCH /api/client/comments/[id]
 * Updates the body of an existing comment. Only allowed on live documents.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: { body?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { body: commentBody } = body;
  if (typeof commentBody !== "string" || !commentBody.trim() || commentBody.trim().length > 5000) {
    return NextResponse.json({ error: "body is required (max 5000 chars)" }, { status: 400 });
  }

  // Fetch the comment to get its document_id
  const supabase = createServerClient();
  const { data: comment, error } = await supabase
    .from("comments")
    .select("id, document_id")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Verify document is still live
  const doc = await getDocumentById(comment.document_id);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (doc.status !== "live") {
    return NextResponse.json(
      { error: "Comments cannot be edited on this document" },
      { status: 409 }
    );
  }

  await updateComment(id, commentBody.trim());
  return NextResponse.json({ ok: true });
}
