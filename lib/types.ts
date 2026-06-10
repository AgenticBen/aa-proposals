/**
 * TypeScript types mirroring the Supabase Postgres schema.
 * Keep in sync with any schema migrations.
 */

export type DocumentStatus = "draft" | "live" | "signed" | "archived";
export type InkColor = "black" | "blue" | "red";

export interface Client {
  id: string;
  created_at: string;
  name: string;
  organization: string | null;
  email: string;
  notes: string | null;
}

export interface Document {
  id: string;
  created_at: string;
  updated_at: string;
  client_id: string;
  title: string;
  slug: string;
  status: DocumentStatus;
  signer_name_expected: string | null;
  signer_email: string | null;
}

export interface Version {
  id: string;
  created_at: string;
  document_id: string;
  version_number: number;
  sections: Section[];
  visible_to_client: boolean;
  note: string | null;
}

export interface Section {
  id: string;
  heading: string;
  body_md: string;
  order: number;
}

export interface Comment {
  id: string;
  created_at: string;
  updated_at: string;
  document_id: string;
  version_id: string;
  section_id: string;
  author_name: string;
  body: string;
  resolved: boolean;
}

export interface Signature {
  id: string;
  created_at: string;
  document_id: string;
  version_id: string;
  signer_name: string;
  signer_email: string;
  signature_png: string;
  ink_color: InkColor;
  consent_text: string;
  content_hash: string;
  ip: string | null;
  user_agent: string | null;
  signed_at: string;
  executed_pdf: string | null;
}

export interface AccessLogEntry {
  id: string;
  created_at: string;
  document_id: string;
  name_entered: string;
  ip: string | null;
  user_agent: string | null;
  visited_at: string;
}

// ---------------------------------------------------------------------------
// Enriched/joined types used in the admin UI
// ---------------------------------------------------------------------------

export interface DocumentWithClient extends Document {
  clients: Pick<Client, "name" | "organization" | "email">;
  /** Latest visible version number, or null */
  latest_version?: number | null;
  /** Count of unresolved comments */
  unresolved_comment_count?: number;
  /** Most recent access_log entry */
  last_visit?: string | null;
}
