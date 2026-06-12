import { createServerClient } from "@/lib/db/server";
import type { Document, DocumentWithClient, DocumentStatus } from "@/lib/types";

/** All documents with client info, ordered by updated_at desc. */
export async function getAllDocuments(): Promise<DocumentWithClient[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("documents")
    .select(
      `*, clients(name, organization, email),
       versions(version_number, visible_to_client),
       comments(resolved),
       access_log(visited_at)`
    )
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`getAllDocuments: ${error.message}`);

  return (data ?? []).map((row) => {
    const visibleVersions = (row.versions as { version_number: number; visible_to_client: boolean }[])
      .filter((v) => v.visible_to_client);
    const latestVisible =
      visibleVersions.length > 0
        ? Math.max(...visibleVersions.map((v) => v.version_number))
        : null;

    const unresolvedCount = (row.comments as { resolved: boolean }[]).filter(
      (c) => !c.resolved
    ).length;

    const visits = (row.access_log as { visited_at: string }[]);
    const lastVisit =
      visits.length > 0
        ? visits.reduce((latest, v) =>
            v.visited_at > latest.visited_at ? v : latest
          ).visited_at
        : null;

    return {
      id: row.id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      client_id: row.client_id,
      title: row.title,
      slug: row.slug,
      status: row.status as DocumentStatus,
      signer_name_expected: row.signer_name_expected,
      signer_email: row.signer_email,
      clients: row.clients as DocumentWithClient["clients"],
      latest_version: latestVisible,
      unresolved_comment_count: unresolvedCount,
      last_visit: lastVisit,
    };
  });
}

/** Single document with client info by ID. */
export async function getDocumentById(id: string): Promise<DocumentWithClient | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("documents")
    .select(`*, clients(name, organization, email)`)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`getDocumentById: ${error.message}`);
  if (!data) return null;

  return {
    ...data,
    status: data.status as DocumentStatus,
    clients: data.clients as DocumentWithClient["clients"],
  };
}

/** Single document with client info by slug (for client proposal view). */
export async function getDocumentBySlug(slug: string): Promise<DocumentWithClient | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("documents")
    .select("*, clients(name, organization, email)")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`getDocumentBySlug: ${error.message}`);
  if (!data) return null;
  return {
    ...data,
    status: data.status as DocumentStatus,
    clients: data.clients as DocumentWithClient["clients"],
  };
}

/** Completed documents (signed or archived) for the Completed Contracts page. */
export async function getCompletedDocuments(): Promise<DocumentWithClient[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("documents")
    .select(`*, clients(name, organization, email), signatures(signer_name, signer_email, signed_at, content_hash, executed_pdf, email_sent_at, email_error)`)
    .in("status", ["signed", "archived"])
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`getCompletedDocuments: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    client_id: row.client_id,
    title: row.title,
    slug: row.slug,
    status: row.status as DocumentStatus,
    signer_name_expected: row.signer_name_expected,
    signer_email: row.signer_email,
    clients: row.clients as DocumentWithClient["clients"],
    signatures: row.signatures,
  }));
}
