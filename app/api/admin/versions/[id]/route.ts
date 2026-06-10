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
  const { visible_to_client, document_id } = body;

  if (typeof visible_to_client !== "boolean") {
    return NextResponse.json(
      { error: "visible_to_client must be a boolean" },
      { status: 400 }
    );
  }

  if (!document_id) {
    return NextResponse.json({ error: "document_id is required" }, { status: 400 });
  }

  const supabase = createServerClient();

  // Check the parent document is not locked
  const { data: doc, error: readError } = await supabase
    .from("documents")
    .select("status")
    .eq("id", document_id)
    .maybeSingle();

  if (readError || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (doc.status === "signed" || doc.status === "archived") {
    return NextResponse.json(
      { error: "Document is locked and cannot be modified" },
      { status: 409 }
    );
  }

  const { error } = await supabase
    .from("versions")
    .update({ visible_to_client })
    .eq("id", id)
    .eq("document_id", document_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ visible_to_client });
}
