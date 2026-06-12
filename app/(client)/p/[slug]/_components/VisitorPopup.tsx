"use client";

import { useState, useRef, useEffect } from "react";

export function VisitorPopup({ documentId }: { documentId: string }) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your name to continue.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/client/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: documentId, name: trimmed }),
      });

      if (!res.ok) throw new Error("Failed to log visit");

      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 1);
      document.cookie = `aa_visitor_name=${encodeURIComponent(trimmed)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;

      window.location.reload();
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: "rgba(0,33,57,0.78)", backdropFilter: "blur(3px)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-heading"
    >
      <div
        className="w-full"
        style={{
          background: "#fff",
          borderRadius: 20,
          boxShadow: "0 24px 80px rgba(0,33,57,0.35)",
          maxWidth: 440,
          padding: "36px 38px",
        }}
      >
        <p
          className="font-body font-bold uppercase mb-2.5"
          style={{ fontSize: 11, letterSpacing: "0.18em", color: "#2CCBE6" }}
        >
          Welcome
        </p>
        <h2
          id="popup-heading"
          className="font-display text-navy"
          style={{ fontWeight: 600, fontSize: 27, lineHeight: 1.12, marginBottom: 18 }}
        >
          Before you dive in, what&apos;s your name?
        </h2>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Maya Chen"
            disabled={submitting}
            aria-required="true"
            className="w-full font-body text-sm text-charcoal placeholder:text-charcoal/35 rounded-xl transition-colors"
            style={{
              border: "1px solid rgba(0,33,57,0.15)",
              padding: "12px 14px",
              outline: "none",
              marginBottom: 6,
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "#51ADDF"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(81,173,223,0.18)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(0,33,57,0.15)"; e.currentTarget.style.boxShadow = "none"; }}
          />

          {error && (
            <p className="font-body text-xs text-red-500 mb-3" role="alert">{error}</p>
          )}

          <div style={{ marginTop: 22 }}>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="w-full font-body font-semibold text-sm rounded-xl transition-colors"
              style={{
                background: submitting || !name.trim() ? "rgba(44,203,230,0.5)" : "#2CCBE6",
                color: "#002139",
                padding: "13px 24px",
                border: "none",
                cursor: submitting || !name.trim() ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Just a moment…" : "Continue →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
