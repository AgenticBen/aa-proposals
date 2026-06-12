"use client";

import { useState } from "react";
import Link from "next/link";

interface Props {
  documentId: string;
  slug: string;
}

export function DocCardActions({ documentId, slug }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}/p/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handlePreview() {
    window.open(`/p/${slug}`, "_blank");
  }

  return (
    <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
      <Link
        href={`/admin/d/${documentId}`}
        className="flex-1 text-center font-body text-sm font-medium bg-navy text-white px-3 py-2.5 rounded-xl hover:bg-navy/90 transition-colors"
      >
        Open Editor
      </Link>
      <button
        type="button"
        onClick={handleCopy}
        className="flex-1 text-center font-body text-sm font-medium border border-navy text-navy px-3 py-2.5 rounded-xl hover:bg-navy/5 transition-colors"
      >
        {copied ? "Copied!" : "Copy Link"}
      </button>
      <button
        type="button"
        onClick={handlePreview}
        className="flex-1 text-center font-body text-sm font-medium border border-gray-200 text-charcoal px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
      >
        Preview ↗
      </button>
    </div>
  );
}
