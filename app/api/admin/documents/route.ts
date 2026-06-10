import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createServerClient } from "@/lib/db/server";
import { generateUniqueSlug } from "@/lib/utils/slug";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const { client_id, title, signer_name_expected, signer_email } = body;

  if (!client_id || !title?.trim()) {
    return NextResponse.json({ error: "client_id and title are required" }, { status: 400 });
  }

  const supabase = createServerClient();

  // Verify client exists
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("id", client_id)
    .maybeSingle();

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const slug = await generateUniqueSlug(title.trim(), async (candidate) => {
    const { data } = await supabase
      .from("documents")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    return data !== null;
  });

  const { data, error } = await supabase
    .from("documents")
    .insert({
      client_id,
      title: title.trim(),
      slug,
      status: "draft",
      signer_name_expected: signer_name_expected ?? null,
      signer_email: signer_email ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
