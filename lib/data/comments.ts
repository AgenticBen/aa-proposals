import { createServerClient } from "@/lib/db/server";
import type { Comment } from "@/lib/types";

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
