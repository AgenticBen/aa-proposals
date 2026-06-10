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
  const { status } = body;

  if (status !== "live" && status !== "draft") {
    return NextResponse.json(
      { error: "status must be 'live' or 'draft'" },
      { status: 400 }
    );
  }

  const supabase = createServerClient();

  // Read current status
  const { data: doc, error: readError } = await supabase
    .from("documents")
    .select("status")
    .eq("id", id)
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
    .from("documents")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ status });
}
