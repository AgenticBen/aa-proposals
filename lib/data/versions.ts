import { createServerClient } from "@/lib/db/server";
import type { Version } from "@/lib/types";

/** All versions for a document, ordered by version_number desc. */
export async function getVersionsByDocumentId(documentId: string): Promise<Version[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("versions")
    .select("*")
    .eq("document_id", documentId)
    .order("version_number", { ascending: false });

  if (error) throw new Error(`getVersionsByDocumentId: ${error.message}`);
  return (data ?? []) as Version[];
}

/** The current visible version (highest version_number where visible_to_client = true). */
export async function getCurrentVisibleVersion(documentId: string): Promise<Version | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("versions")
    .select("*")
    .eq("document_id", documentId)
    .eq("visible_to_client", true)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`getCurrentVisibleVersion: ${error.message}`);
  return data as Version | null;
}

/** Latest version (regardless of visibility) — used for the admin editor. */
export async function getLatestVersion(documentId: string): Promise<Version | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("versions")
    .select("*")
    .eq("document_id", documentId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`getLatestVersion: ${error.message}`);
  return data as Version | null;
}
