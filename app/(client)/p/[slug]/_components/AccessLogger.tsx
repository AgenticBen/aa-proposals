"use client";

import { useEffect } from "react";

/**
 * Silently logs a returning visitor's access on mount.
 * Renders nothing — fires a single POST and disappears.
 */
export function AccessLogger({
  documentId,
  name,
}: {
  documentId: string;
  name: string;
}) {
  useEffect(() => {
    fetch("/api/client/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document_id: documentId, name }),
    }).catch(() => {
      // Best-effort — access logging failure is non-fatal
    });
  }, [documentId, name]);

  return null;
}
