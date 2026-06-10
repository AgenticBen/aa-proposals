import { NextRequest, NextResponse } from "next/server";
import { createComment } from "@/lib/data/comments";
import { getDocumentById } from "@/lib/data/documents";
import { getVersionById } from "@/lib/data/versions";

/**
 * POST /api/client/comments
 * Creates a new section comment. Only allowed on live documents.
 */
export async function POST(request: NextRequest) {
  let body: {
    document_id?: unknown;
    version_id?: unknown;
    section_id?: unknown;
    author_name?: unknown;
    body?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { document_id, version_id, section_id, author_name, body: commentBody } = body;

  if (
    typeof document_id !== "string" ||
    typeof version_id !== "string" ||
    typeof section_id !== "string" ||
    typeof author_name !== "string" ||
    typeof commentBody !== "string" ||
    !commentBody.trim()
  ) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  // Verify document exists and is live (comments not allowed on signed/draft)
  const doc = await getDocumentById(document_id);
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (doc.status !== "live") {
    return NextResponse.json(
      { error: "Comments cannot be added to this document" },
      { status: 409 }
    );
  }

  // Verify version belongs to this document
  const version = await getVersionById(version_id);
  if (!version || version.document_id !== document_id) {
    return NextResponse.json({ error: "Invalid version" }, { status: 400 });
  }

  const comment = await createComment({
    document_id,
    version_id,
    section_id,
    author_name: author_name.trim(),
    body: commentBody.trim(),
  });

  return NextResponse.json({ id: comment.id }, { status: 201 });
}
