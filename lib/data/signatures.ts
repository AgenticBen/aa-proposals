import { createServerClient } from "@/lib/db/server";
import type { Signature } from "@/lib/types";

/** The signature for a document, or null if unsigned (one signer in v1). */
export async function getSignatureByDocumentId(
  documentId: string
): Promise<Signature | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("signatures")
    .select("*")
    .eq("document_id", documentId)
    .maybeSingle();

  if (error) throw new Error(`getSignatureByDocumentId: ${error.message}`);
  return data as Signature | null;
}

/** Record the outcome of an executed-PDF email attempt on the signature row. */
export async function updateSignatureEmailStatus(
  signatureId: string,
  outcome: { sent: true } | { sent: false; error: string }
): Promise<void> {
  const supabase = createServerClient();
  const { error } = await supabase
    .from("signatures")
    .update(
      outcome.sent
        ? { email_sent_at: new Date().toISOString(), email_error: null }
        : { email_error: outcome.error }
    )
    .eq("id", signatureId);

  if (error) throw new Error(`updateSignatureEmailStatus: ${error.message}`);
}
