"use client";

import { useState, useTransition } from "react";
import type { DocumentStatus } from "@/lib/types";

interface Props {
  documentId: string;
  initialStatus: DocumentStatus;
  slug: string;
}

export function StatusToggle({ documentId, initialStatus, slug }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const locked = status === "signed" || status === "archived";

  async function handleToggle() {
    const nextStatus = status === "live" ? "draft" : "live";
    startTransition(async () => {
      const res = await fetch(`/api/admin/documents/${documentId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.status === 409) {
        alert("Cannot change status of a signed document.");
        return;
      }
      if (!res.ok) return;
      setStatus(nextStatus);
    });
  }

  async function handleCopyLink() {
    const url = `${window.location.origin}/p/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const pillStyles: Record<DocumentStatus, string> = {
    draft: "bg-gray-100 text-gray-600",
    live: "bg-green-100 text-green-700",
    signed: "bg-blue-100 text-blue-700",
    archived: "bg-orange-100 text-orange-600",
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span
        className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium font-body ${pillStyles[status]}`}
      >
        {status}
      </span>

      {!locked && (
        <button
          type="button"
          onClick={handleToggle}
          disabled={isPending}
          className="font-body text-sm font-medium bg-navy text-white px-4 py-2 rounded-xl hover:bg-navy/90 disabled:opacity-50 transition-colors"
        >
          {status === "live" ? "Make draft" : "Go live"}
        </button>
      )}

      <button
        type="button"
        onClick={handleCopyLink}
        className="font-body text-sm font-medium border border-navy text-navy px-4 py-2 rounded-xl hover:bg-navy/5 transition-colors"
      >
        {copied ? "Copied!" : "Copy client link"}
      </button>

      <a
        href={`/p/${slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-body text-sm font-medium border border-gray-200 text-charcoal px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
      >
        Preview ↗
      </a>
    </div>
  );
}
