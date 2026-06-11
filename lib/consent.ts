/**
 * The electronic-signature consent statement (SPEC §5.5).
 *
 * This exact text is rendered above the signature pad and stored verbatim
 * on the signatures row at signing time. The signing route compares the
 * text the client says it displayed against this constant and rejects on
 * mismatch, so a stale tab from before a wording change cannot record the
 * wrong consent text.
 */
export const CONSENT_TEXT =
  "I agree to conduct this transaction electronically, and I intend the signature below to be the legal equivalent of my handwritten signature.";
