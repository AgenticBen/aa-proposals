import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createServerClient } from "@/lib/db/server";
import { markdownToSections } from "@/lib/utils/markdown-to-sections";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await req.json();
  const { markdown } = body;

  if (typeof markdown !== "string" || !markdown.trim()) {
    return NextResponse.json({ error: "markdown is required" }, { status: 400 });
  }

  const supabase = createServerClient();

  // Check document is not locked
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

  const sections = markdownToSections(markdown);
  return NextResponse.json({ sections });
}
