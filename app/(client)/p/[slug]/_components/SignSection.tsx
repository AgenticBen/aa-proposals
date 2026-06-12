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
  const inkRef = useRef(ink);

  useEffect(() => {
    if (!consented || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const pad = new SignaturePad(canvas, { penColor: INK_HEX[inkRef.current] });
    padRef.current = pad;

    const resize = () => {
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
    if (!name.trim()) { setError("Please enter your name."); return; }
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
      const data = (await res.json()) as { ok?: boolean; email_sent?: boolean; error?: string };
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

  // ── Completion popup ──────────────────────────────────────────────────────
  if (done) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center px-6"
        style={{ background: "rgba(0,33,57,0.72)", backdropFilter: "blur(3px)" }}
      >
        <div
          className="w-full text-center"
          style={{
            background: "#fff",
            borderRadius: 20,
            boxShadow: "0 24px 80px rgba(0,33,57,0.35)",
            maxWidth: 440,
            padding: "38px 38px 32px",
          }}
        >
          <div
            className="flex items-center justify-center mx-auto mb-5"
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "rgba(44,203,230,0.12)",
              color: "#2CCBE6",
            }}
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-display text-navy mb-2.5" style={{ fontWeight: 600, fontSize: 26 }}>
            Thanks for signing!
          </h2>
          <p className="font-body text-charcoal mb-6" style={{ fontSize: 15, lineHeight: 1.6 }}>
            {done.emailSent
              ? `A copy of the executed proposal has been sent to ${done.email}.`
              : `Your signature has been recorded. The executed copy will be emailed to ${done.email} shortly.`}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full font-body font-semibold text-sm rounded-xl transition-colors"
            style={{ background: "#2CCBE6", color: "#002139", padding: "13px 24px", border: "none", cursor: "pointer" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#51ADDF"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#2CCBE6"; }}
          >
            View the executed proposal
          </button>
        </div>
      </div>
    );
  }

  // ── Sign ceremony — full-width navy band with centered 560px card ─────────
  return (
    <div
      className="relative overflow-hidden"
      style={{ background: "linear-gradient(135deg,#013a5e 0%,#002139 70%)" }}
    >
      {/* Arc texture */}
      <svg
        aria-hidden="true"
        viewBox="0 0 600 320"
        preserveAspectRatio="xMaxYMax slice"
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ opacity: 0.14 }}
      >
        <path d="M420 320 Q 560 200 600 60" fill="none" stroke="#9DE2F2" strokeWidth="1.5" />
        <path d="M360 320 Q 530 180 600 20" fill="none" stroke="#9DE2F2" strokeWidth="1" />
      </svg>

      <div className="relative mx-auto px-6 py-16 flex justify-center" style={{ maxWidth: 720 }}>
        <div
          className="w-full"
          style={{
            background: "#fff",
            borderRadius: 20,
            boxShadow: "0 24px 80px rgba(0,33,57,0.3)",
            maxWidth: 560,
            padding: "34px 38px",
          }}
        >
          {/* Eyebrow */}
          <p
            className="font-body font-bold uppercase mb-2"
            style={{ fontSize: 11, letterSpacing: "0.22em", color: "#2CCBE6" }}
          >
            Signature
          </p>
          <h2 className="font-display text-navy mb-6" style={{ fontWeight: 600, fontSize: 24, lineHeight: 1.1 }}>
            Sign this proposal
          </h2>

          {/* Consent gate */}
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={consented}
              onChange={(e) => setConsented(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded"
              style={{ accentColor: "#51ADDF" }}
            />
            <span className="font-body text-sm text-charcoal" style={{ lineHeight: 1.65 }}>
              {consentText}
            </span>
          </label>

          {consented && (
            <div
              className="mt-6"
              style={{ animation: "expandDown 0.15s ease-out" }}
            >
              <style>{`@keyframes expandDown { from { transform: translateY(-8px); opacity: 0.5; } to { transform: none; opacity: 1; } }`}</style>

              {/* Name + Email */}
              <div className="grid gap-4 sm:grid-cols-2 mb-5">
                {[
                  { id: "signer-name", label: "Your full name", value: name, setter: setName, type: "text" },
                  { id: "signer-email", label: "Email (receives the executed copy)", value: email, setter: setEmail, type: "email" },
                ].map(({ id, label, value, setter, type }) => (
                  <div key={id}>
                    <label htmlFor={id} className="block font-body font-medium text-charcoal/60 mb-1" style={{ fontSize: 12 }}>
                      {label}
                    </label>
                    <input
                      id={id}
                      type={type}
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      className="w-full font-body text-sm text-charcoal rounded-xl transition-colors"
                      style={{ border: "1px solid rgba(0,33,57,0.15)", padding: "10px 12px", outline: "none" }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "#51ADDF"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(81,173,223,0.15)"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(0,33,57,0.15)"; e.currentTarget.style.boxShadow = "none"; }}
                    />
                  </div>
                ))}
              </div>

              {/* Ink picker */}
              <div className="flex items-center gap-3 mb-4">
                <span className="font-body font-medium text-charcoal/60" style={{ fontSize: 12 }}>Ink</span>
                {(Object.keys(INK_HEX) as InkColor[]).map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setInk(color)}
                    aria-label={`${color} ink`}
                    aria-pressed={ink === color}
                    className="h-5 w-5 rounded-full transition-transform"
                    style={{
                      backgroundColor: INK_HEX[color],
                      border: ink === color ? "2px solid #51ADDF" : "2px solid transparent",
                      boxShadow: ink === color ? "0 0 0 2px rgba(81,173,223,0.35)" : "none",
                      transform: ink === color ? "scale(1.15)" : "none",
                    }}
                  />
                ))}
              </div>

              {/* Signature canvas */}
              <div className="relative">
                {/* Baseline rule */}
                <div className="absolute bottom-8 left-0 right-0" style={{ height: 1, background: "rgba(0,33,57,0.15)", zIndex: 1 }} />
                <canvas
                  ref={canvasRef}
                  className="w-full touch-none rounded-xl"
                  style={{
                    height: 150,
                    background: "rgba(230,227,226,0.2)",
                    border: `1px dashed rgba(0,33,57,0.18)`,
                    display: "block",
                  }}
                  aria-label="Signature pad — draw your signature"
                />
                {!hasDrawn && (
                  <p
                    className="pointer-events-none absolute inset-x-0 font-body"
                    style={{ bottom: 22, textAlign: "center", fontSize: 12, color: "rgba(73,80,80,0.35)", zIndex: 2 }}
                  >
                    Draw your signature here
                  </p>
                )}
                {/* ✕ / ✓ buttons — appear after first stroke, top-right of canvas */}
                {hasDrawn && (
                  <div className="absolute right-3 top-3 flex gap-2" style={{ zIndex: 3 }}>
                    <button
                      type="button"
                      onClick={handleClear}
                      disabled={submitting}
                      aria-label="Clear signature"
                      className="flex items-center justify-center rounded-full font-body font-bold transition-colors disabled:opacity-50"
                      style={{
                        width: 36, height: 36,
                        background: "#fff",
                        border: "1px solid rgba(0,33,57,0.18)",
                        color: "#002139",
                        boxShadow: "0 1px 4px rgba(0,33,57,0.1)",
                        cursor: "pointer",
                        fontSize: 15,
                      }}
                    >
                      ✕
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirm}
                      disabled={submitting}
                      aria-label="Confirm and sign"
                      className="flex items-center justify-center rounded-full font-body font-bold transition-colors disabled:opacity-50"
                      style={{
                        width: 36, height: 36,
                        background: "#2CCBE6",
                        border: "none",
                        color: "#002139",
                        boxShadow: "0 1px 4px rgba(44,203,230,0.3)",
                        cursor: submitting ? "wait" : "pointer",
                        fontSize: 15,
                      }}
                    >
                      {submitting ? "…" : "✓"}
                    </button>
                  </div>
                )}
              </div>

              {error && <p className="font-body text-sm text-red-600 mt-3">{error}</p>}

              <p
                className="font-body mt-4"
                style={{ fontSize: 13, color: "rgba(73,80,80,0.55)", lineHeight: 1.5 }}
              >
                Signing locks this document for both parties. You&apos;ll both receive the executed PDF by email.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
