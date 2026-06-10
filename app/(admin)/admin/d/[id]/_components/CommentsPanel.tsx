"use client";

import { useState, useTransition } from "react";
import type { Comment, Section } from "@/lib/types";

interface Props {
  documentId: string;
  documentStatus: string;
  comments: Comment[];
  sections: Section[];
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function CommentsPanel({ documentId, documentStatus, comments: initialComments, sections }: Props) {
  const [comments, setComments] = useState(initialComments);
  const [isPending, startTransition] = useTransition();
  const locked = documentStatus === "signed" || documentStatus === "archived";

  const sectionMap = Object.fromEntries(sections.map((s) => [s.id, s.heading]));

  // Group comments by section_id
  const grouped = comments.reduce<Record<string, Comment[]>>((acc, c) => {
    if (!acc[c.section_id]) acc[c.section_id] = [];
    acc[c.section_id].push(c);
    return acc;
  }, {});

  async function toggleResolve(commentId: string, current: boolean) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolved: !current }),
      });
      if (!res.ok) return;
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, resolved: !current } : c))
      );
    });
  }

  async function handleExport() {
    window.open(`/api/admin/documents/${documentId}/export-comments`, "_blank");
  }

  const unresolvedCount = comments.filter((c) => !c.resolved).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-body text-sm text-charcoal/60">
          {comments.length === 0
            ? "No comments yet."
            : `${unresolvedCount} unresolved · ${comments.length - unresolvedCount} resolved`}
        </p>
        {comments.some((c) => !c.resolved) && (
          <button
            type="button"
            onClick={handleExport}
            className="font-body text-xs text-sky hover:underline"
          >
            Export disputed sections ↓
          </button>
        )}
      </div>

      {Object.entries(grouped).map(([sectionId, sectionComments]) => (
        <div key={sectionId} className="space-y-2">
          <p className="font-body text-xs font-bold uppercase tracking-wide text-charcoal/50">
            {sectionMap[sectionId] ?? "Unknown section"}
          </p>
          {sectionComments.map((comment) => (
            <div
              key={comment.id}
              className={`border rounded-xl px-4 py-3 ${
                comment.resolved
                  ? "bg-gray-50 border-gray-100 opacity-60"
                  : "bg-white border-orange-200"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-body text-sm font-medium text-charcoal">
                    {comment.author_name}
                    <span className="ml-2 font-normal text-xs text-charcoal/50">
                      {formatDate(comment.created_at)}
                    </span>
                  </p>
                  <p className="font-body text-sm text-charcoal mt-1 whitespace-pre-wrap">
                    {comment.body}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleResolve(comment.id, comment.resolved)}
                  disabled={isPending || locked}
                  className="shrink-0 font-body text-xs text-sky hover:underline disabled:opacity-40"
                >
                  {comment.resolved ? "Unresolve" : "Resolve"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}

      {comments.length === 0 && (
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-6 text-center">
          <p className="font-body text-sm text-charcoal/50">No comments yet.</p>
        </div>
      )}
    </div>
  );
}
