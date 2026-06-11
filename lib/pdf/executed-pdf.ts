import { createServerClient } from "@/lib/db/server";
import { getSignatureByDocumentId } from "@/lib/data/signatures";
import { getVersionById } from "@/lib/data/versions";
import { renderExecutedPDF } from "@/lib/pdf/ExecutedProposal";
import type { Document, Section, Signature } from "@/lib/types";

/**
 * Fetch the stored executed PDF for a signed document, regenerating it from
 * the frozen snapshot (signature.version_id) if it is missing — e.g. when
 * PDF generation failed during the signing transaction.
 *
 * Regeneration is deterministic-by-source: it only ever reads the frozen
 * version and the stored signature PNG, never live content.
 */
export async function getOrCreateExecutedPdf(
  doc: Document
): Promise<{ pdf: Buffer; signature: Signature } | null> {
  const signature = await getSignatureByDocumentId(doc.id);
  if (!signature) return null;

  const supabase = createServerClient();

  if (signature.executed_pdf) {
    const { data, error } = await supabase.storage
      .from("executed-pdfs")
      .download(signature.executed_pdf);
    if (!error && data) {
      return { pdf: Buffer.from(await data.arrayBuffer()), signature };
    }
    // Stored file unreadable — fall through and regenerate from the snapshot
  }

  const frozenVersion = await getVersionById(signature.version_id);
  if (!frozenVersion) {
    throw new Error("Frozen version missing for signed document");
  }

  const { data: pngBlob, error: pngError } = await supabase.storage
    .from("signatures")
    .download(signature.signature_png);
  if (pngError || !pngBlob) {
    throw new Error(`Signature PNG missing: ${pngError?.message}`);
  }
  const pngBuffer = Buffer.from(await pngBlob.arrayBuffer());

  const pdf = await renderExecutedPDF(
    doc,
    frozenVersion.sections as Section[],
    signature,
    pngBuffer
  );

  const executedPdfPath = `${doc.id}/executed.pdf`;
  const { error: uploadError } = await supabase.storage
    .from("executed-pdfs")
    .upload(executedPdfPath, pdf, { contentType: "application/pdf", upsert: true });
  if (uploadError) {
    throw new Error(`Executed PDF upload failed: ${uploadError.message}`);
  }
  const { error: pathError } = await supabase
    .from("signatures")
    .update({ executed_pdf: executedPdfPath })
    .eq("id", signature.id);
  if (pathError) {
    throw new Error(`Executed PDF path update failed: ${pathError.message}`);
  }

  return { pdf, signature: { ...signature, executed_pdf: executedPdfPath } };
}
