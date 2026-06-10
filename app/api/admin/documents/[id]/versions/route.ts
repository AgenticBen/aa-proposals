import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createServerClient } from "@/lib/db/server";
import type { Section } from "@/lib/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await req.json();
  const { sections, note, visible_to_client } = body;

  if (!Array.isArray(sections)) {
    return NextResponse.json({ error: "sections must be an array" }, { status: 400 });
  }

  const supabase = createServerClient();

  // Check document exists and is not locked
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

  // Get the current max version_number
  const { data: latest } = await supabase
    .from("versions")
    .select("version_number")
    .eq("document_id", id)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersionNumber = (latest?.version_number ?? 0) + 1;

  // Normalize section order to match array index
  const normalizedSections: Section[] = sections.map(
    (s: Section, i: number) => ({ ...s, order: i })
  );

  const { data, error } = await supabase
    .from("versions")
    .insert({
      document_id: id,
      version_number: nextVersionNumber,
      sections: normalizedSections,
      note: note?.trim() || null,
      visible_to_client: visible_to_client ?? false,
    })
    .select("id, version_number")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Touch updated_at on the document
  await supabase
    .from("documents")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", id);

  return NextResponse.json(
    { id: data.id, version_number: data.version_number },
    { status: 201 }
  );
}
