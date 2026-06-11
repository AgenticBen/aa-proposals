import { Resend } from "resend";
import type { Document, Signature } from "@/lib/types";

/**
 * Email the executed PDF to both parties (Non-Negotiable #6):
 * the signer and ADMIN_EMAIL, immediately after signing.
 *
 * Never throws — the signature must stand even if email fails (SPEC §6.6).
 * Returns { sent: true } or { sent: false, error } for the caller to record
 * on the signature row so the admin can retry.
 */
export async function sendExecutedEmails(
  doc: Document,
  signature: Signature,
  executedPdf: Buffer
): Promise<{ sent: true } | { sent: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!apiKey || !from || !adminEmail) {
    return {
      sent: false,
      error: "RESEND_API_KEY, EMAIL_FROM, and ADMIN_EMAIL must be set in .env",
    };
  }

  const resend = new Resend(apiKey);
  const signedDate = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    dateStyle: "long",
  }).format(new Date(signature.signed_at));

  const safeName = doc.slug.replace(/[^a-z0-9-]/gi, "-");
  const attachment = {
    filename: `${safeName}-executed.pdf`,
    content: executedPdf,
  };

  const text = [
    `${signature.signer_name} signed "${doc.title}" on ${signedDate}.`,
    "",
    "The fully executed proposal is attached as a PDF. It includes the",
    "signature and a complete audit record (signer identity, timestamp,",
    "and content fingerprint).",
    "",
    "This document is now locked — no further changes can be made to it.",
    "",
    "Agentic Arc AI",
  ].join("\n");

  // One send, both parties as recipients — both addresses see the same
  // executed document, and a single failure is simpler to retry.
  try {
    const { error } = await resend.emails.send({
      from,
      to: [signature.signer_email, adminEmail],
      subject: `Executed: ${doc.title} — Agentic Arc`,
      text,
      attachments: [attachment],
    });
    if (error) {
      return { sent: false, error: `${error.name}: ${error.message}` };
    }
    return { sent: true };
  } catch (err) {
    return {
      sent: false,
      error: err instanceof Error ? err.message : "Unknown email failure",
    };
  }
}
