import { createServerClient } from "@/lib/db/server";
import type { Comment } from "@/lib/types";

/** All comments for a version, ordered by created_at asc. */
export async function getCommentsByVersionId(versionId: string): Promise<Comment[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("version_id", versionId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`getCommentsByVersionId: ${error.message}`);
  return (data ?? []) as Comment[];
}

/** Create a new comment. Returns the inserted row. */
export async function createComment(fields: {
  document_id: string;
  version_id: string;
  section_id: string;
  author_name: string;
  body: string;
}): Promise<Comment> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("comments")
    .insert(fields)
    .select()
    .single();

  if (error) throw new Error(`createComment: ${error.message}`);
  return data as Comment;
}

/** Update the body of an existing comment. */
export async function updateComment(id: string, body: string): Promise<void> {
  const supabase = createServerClient();
  const { error } = await supabase
    .from("comments")
    .update({ body })
    .eq("id", id);

  if (error) throw new Error(`updateComment: ${error.message}`);
}

/** All comments for a document, ordered by created_at asc. */
export async function getCommentsByDocumentId(documentId: string): Promise<Comment[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("document_id", documentId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`getCommentsByDocumentId: ${error.message}`);
  return (data ?? []) as Comment[];
}
