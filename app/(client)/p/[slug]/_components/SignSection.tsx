"use client";

import { useEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";
import type { InkColor } from "@/lib/types";

const INK_HEX: Record<InkColor, string> = {
  black: "#1a1a1a",
  blue: "#1e40af",
  red: "#b91c1c",
};

interface Props {
  documentId: string;
  consentText: string;
  prefillName: string;
  prefillEmail: string;
}

/**
 * The signing block at the bottom of a live proposal (SPEC §5.5).
 * Consent checkbox gates the pad; ✕/✓ appear once drawing has begun;
 * ✓ posts the signing transaction and shows the completion popup.
 */
export function SignSection({ documentId, consentText, prefillName, prefillEmail }: Props) {
  const [consented, setConsented] = useState(false);
  const [ink, setInk] = useState<InkColor>("black");
  const [hasDrawn, setHasDrawn] = useState(false);
  const [name, setName] = useState(prefillName);
  const [email, setEmail] = useState(prefillEmail);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ email: string; emailSent: boolean } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const padRef = useRef<SignaturePad | null>(null);
  // Latest ink for pad (re)creation — consent can be toggled off and back on
  // after an ink was chosen, and the new pad must keep that choice
  const inkRef = useRef(ink);

  // Create the pad when consent reveals the canvas; destroy when hidden
  useEffect(() => {
    if (!consented || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const pad = new SignaturePad(canvas, { penColor: INK_HEX[inkRef.current] });
    padRef.current = pad;

    const resize = () => {
      // Keep the drawing buffer in sync with CSS size and pixel density.
      // Resizing clears the canvas — acceptable; the signer redraws.
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext("2d")?.scale(ratio, ratio);
      pad.clear();
      setHasDrawn(false);
    };
    resize();

    const onEndStroke = () => setHasDrawn(true);
    pad.addEventListener("endStroke", onEndStroke);
    window.addEventListener("resize", resize);

    return () => {
      pad.removeEventListener("endStroke", onEndStroke);
      window.removeEventListener("resize", resize);
      pad.off();
      padRef.current = null;
    };
  }, [consented]);

  // Ink change applies to subsequent strokes
  useEffect(() => {
    inkRef.current = ink;
    if (padRef.current) padRef.current.penColor = INK_HEX[ink];
  }, [ink]);

  function handleClear() {
    padRef.current?.clear();
    setHasDrawn(false);
    setError(null);
  }

  async function handleConfirm() {
    const pad = padRef.current;
    if (!pad || pad.isEmpty()) return;
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/client/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_id: documentId,
          signer_name: name.trim(),
          signer_email: email.trim(),
          ink_color: ink,
          consent: true,
          consent_text: consentText,
          signature_png: pad.toDataURL("image/png"),
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        email_sent?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setError(
          res.status === 409
            ? data.error ?? "This document is no longer available for signing."
            : data.error ?? "Signing failed — please try again."
        );
        setSubmitting(false);
        return;
      }
      setDone({ email: email.trim(), emailSent: data.email_sent ?? false });
    } catch {
      setError("Signing failed — please check your connection and try again.");
      setSubmitting(false);
    }
  }

  // ── Completion popup ───────────────────────────────────────────────────
  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 px-6">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full px-8 py-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-display text-2xl text-navy mb-2">Thanks for signing!</h2>
          <p className="text-sm text-charcoal leading-relaxed">
            {done.emailSent
              ? `A copy of the executed proposal has been sent to ${done.email}.`
              : `Your signature has been recorded. The executed copy will be emailed to ${done.email} shortly.`}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex items-center bg-cyan text-navy px-6 py-2.5 rounded-xl text-sm font-body font-semibold hover:bg-cyan/85 transition-colors"
          >
            View the executed proposal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12 bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-7">
      <p className="font-body text-xs uppercase tracking-widest font-bold text-cyan mb-2">
        Ready to proceed
      </p>
      <h2 className="font-display text-2xl text-navy mb-5">Sign this proposal</h2>

      {/* Consent — gates everything below */}
      <label className="flex items-start gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={consented}
          onChange={(e) => setConsented(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[#51ADDF] shrink-0"
        />
        <span className="text-sm text-charcoal leading-relaxed">{consentText}</span>
      </label>

      {consented && (
        <div className="mt-6">
          {/* Name + email */}
          <div className="grid gap-4 sm:grid-cols-2 mb-5">
            <div>
              <label htmlFor="signer-name" className="block text-xs font-medium text-charcoal/60 mb-1">
                Your full name
              </label>
              <input
                id="signer-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-sky/30 focus:border-sky"
              />
            </div>
            <div>
              <label htmlFor="signer-email" className="block text-xs font-medium text-charcoal/60 mb-1">
                Your email (receives the executed copy)
              </label>
              <input
                id="signer-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-sky/30 focus:border-sky"
              />
            </div>
          </div>

          {/* Ink picker */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-medium text-charcoal/60">Ink</span>
            {(Object.keys(INK_HEX) as InkColor[]).map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setInk(color)}
                aria-label={`${color} ink`}
                aria-pressed={ink === color}
                className={`h-6 w-6 rounded-full border-2 transition-transform ${
                  ink === color ? "border-sky scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: INK_HEX[color] }}
              />
            ))}
          </div>

          {/* Pad */}
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="w-full h-40 rounded-xl border border-dashed border-gray-300 bg-ivory/40 touch-none"
              aria-label="Signature pad — draw your signature"
            />
            {!hasDrawn && (
              <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-xs text-charcoal/35">
                Draw your signature here
              </p>
            )}
            {/* ✕ / ✓ — only once drawing has begun */}
            {hasDrawn && (
              <div className="absolute right-3 top-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={submitting}
                  aria-label="Clear signature"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-gray-200 text-charcoal shadow-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  ✕
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={submitting}
                  aria-label="Confirm and sign"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan text-navy font-bold shadow-sm hover:bg-cyan/85 disabled:opacity-50"
                >
                  {submitting ? "…" : "✓"}
                </button>
              </div>
            )}
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          {hasDrawn && !error && (
            <p className="mt-3 text-xs text-charcoal/50">
              ✓ confirms and signs · ✕ clears the pad
            </p>
          )}
        </div>
      )}
    </div>
  );
}
