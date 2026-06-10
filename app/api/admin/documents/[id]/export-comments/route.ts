import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createServerClient } from "@/lib/db/server";
import type { Comment, Version } from "@/lib/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const supabase = createServerClient();

  // Load document title
  const { data: doc } = await supabase
    .from("documents")
    .select("title")
    .eq("id", id)
    .maybeSingle();

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Load unresolved comments
  const { data: comments } = await supabase
    .from("comments")
    .select("*")
    .eq("document_id", id)
    .eq("resolved", false)
    .order("created_at", { ascending: true });

  if (!comments || comments.length === 0) {
    return new NextResponse("No unresolved comments.", {
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `attachment; filename="comments-${id}.txt"`,
      },
    });
  }

  // Load the latest version to get section headings
  const { data: latestVersion } = await supabase
    .from("versions")
    .select("sections")
    .eq("document_id", id)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sectionMap: Record<string, string> = {};
  if (latestVersion) {
    const v = latestVersion as Pick<Version, "sections">;
    for (const s of v.sections ?? []) {
      sectionMap[s.id] = s.heading;
    }
  }

  // Group comments by section
  const grouped: Record<string, Comment[]> = {};
  for (const c of comments as Comment[]) {
    if (!grouped[c.section_id]) grouped[c.section_id] = [];
    grouped[c.section_id].push(c);
  }

  // Build markdown output
  const lines: string[] = [
    `# Disputed Sections — ${doc.title}`,
    ``,
    `Exported: ${new Date().toISOString()}`,
    ``,
  ];

  for (const [sectionId, sectionComments] of Object.entries(grouped)) {
    const heading = sectionMap[sectionId] ?? "Unknown Section";
    lines.push(`## ${heading}`, ``);
    for (const c of sectionComments) {
      lines.push(
        `**${c.author_name}** — ${new Date(c.created_at).toLocaleString("en-US", { timeZone: "America/New_York" })}`,
        ``,
        c.body,
        ``
      );
    }
    lines.push(`---`, ``);
  }

  const filename = `disputed-sections-${doc.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.md`;

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
