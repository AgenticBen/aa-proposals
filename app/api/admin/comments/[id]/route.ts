import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createServerClient } from "@/lib/db/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await req.json();
  const { resolved } = body;

  if (typeof resolved !== "boolean") {
    return NextResponse.json({ error: "resolved must be a boolean" }, { status: 400 });
  }

  const supabase = createServerClient();

  // Look up the comment to get document_id
  const { data: comment, error: readError } = await supabase
    .from("comments")
    .select("document_id")
    .eq("id", id)
    .maybeSingle();

  if (readError || !comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  // Check parent document is not locked
  const { data: doc } = await supabase
    .from("documents")
    .select("status")
    .eq("id", comment.document_id)
    .maybeSingle();

  if (doc?.status === "signed" || doc?.status === "archived") {
    return NextResponse.json(
      { error: "Document is locked and cannot be modified" },
      { status: 409 }
    );
  }

  const { error } = await supabase
    .from("comments")
    .update({ resolved, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ resolved });
}
