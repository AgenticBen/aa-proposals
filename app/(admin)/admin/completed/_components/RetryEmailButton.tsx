"use client";

import { useState } from "react";

/**
 * Shown on the Completed page when the executed-PDF email failed.
 * Retries the send; on success the page reloads and the warning clears.
 */
export function RetryEmailButton({ documentId }: { documentId: string }) {
  const [state, setState] = useState<"idle" | "sending" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function retry() {
    setState("sending");
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/documents/${documentId}/retry-email`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }
      window.location.reload();
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Retry failed");
    }
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={retry}
        disabled={state === "sending"}
        className="font-body text-xs text-amber-600 hover:underline disabled:opacity-50"
      >
        {state === "sending" ? "Sending…" : "Retry email"}
      </button>
      {state === "error" && message && (
        <span className="font-body text-xs text-red-500" title={message}>
          failed
        </span>
      )}
    </span>
  );
}
