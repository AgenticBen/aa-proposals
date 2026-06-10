"use client";

import { useState, useRef, useEffect } from "react";

/**
 * First-visit modal that asks for the visitor's name.
 * Cannot be dismissed without submitting.
 * On success: sets the aa_visitor_name cookie and reloads the page
 * so the server picks up the cookie for subsequent access logging.
 */
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

      // 1 year, SameSite=Lax — readable by client JS for comment author_name
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
    /* Fixed overlay — blocks all interaction until name is entered */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-heading"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-8">
        <p className="font-body text-xs uppercase tracking-widest font-bold text-cyan mb-3">
          Agentic Arc
        </p>
        <h2
          id="popup-heading"
          className="font-display text-2xl text-navy mb-2"
        >
          Before you dive in…
        </h2>
        <p className="text-charcoal/70 text-sm mb-6 leading-relaxed">
          What&apos;s your name? We&apos;ll use it to log your feedback on this
          proposal.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            disabled={submitting}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:ring-2 focus:ring-sky/30 focus:border-sky transition-colors mb-2"
            aria-required="true"
          />

          {error && (
            <p className="text-red-500 text-xs mb-3" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="w-full bg-navy text-white rounded-xl px-4 py-3 text-sm font-body font-medium hover:bg-navy/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Just a moment…" : "Continue to proposal"}
          </button>
        </form>
      </div>
    </div>
  );
}
