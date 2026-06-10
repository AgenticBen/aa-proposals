import { createServerClient } from "@/lib/db/server";
import type { AccessLogEntry } from "@/lib/types";

/** Access log entries for a document, most recent first. */
export async function getAccessLogByDocumentId(
  documentId: string,
  limit = 50
): Promise<AccessLogEntry[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("access_log")
    .select("*")
    .eq("document_id", documentId)
    .order("visited_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`getAccessLogByDocumentId: ${error.message}`);
  return (data ?? []) as AccessLogEntry[];
}
