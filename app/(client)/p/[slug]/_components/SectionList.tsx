"use client";

import { useState, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import type { Section, Comment } from "@/lib/types";

// ---------------------------------------------------------------------------
// Markdown component overrides — no tailwind/typography plugin needed
// ---------------------------------------------------------------------------

const MD_COMPONENTS: React.ComponentProps<typeof ReactMarkdown>["components"] = {
  h1: ({ children }) => (
    <h1 className="font-display text-xl text-navy mt-4 mb-2">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-display text-lg text-navy mt-4 mb-2">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-body font-semibold text-navy mt-3 mb-1">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="mb-3 leading-relaxed last:mb-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-outside pl-5 mb-3 space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-outside pl-5 mb-3 space-y-1">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-navy">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-sky pl-4 italic my-3 text-charcoal/70">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="bg-ivory px-1.5 py-0.5 rounded text-sm font-mono text-navy">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="bg-ivory rounded-lg p-4 overflow-x-auto text-sm font-mono mb-3">
      {children}
    </pre>
  ),
  hr: () => <hr className="border-gray-200 my-4" />,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sky underline underline-offset-2 hover:text-sky/80"
    >
      {children}
    </a>
  ),
};

// ---------------------------------------------------------------------------
// CommentBox
// ---------------------------------------------------------------------------

type SaveStatus = "idle" | "saving" | "saved" | "error";

function CommentBox({
  documentId,
  versionId,
  sectionId,
  visitorName,
  existingComment,
}: {
  documentId: string;
  versionId: string;
  sectionId: string;
  visitorName: string;
  existingComment: Comment | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState(existingComment?.body ?? "");
  const [commentId, setCommentId] = useState<string | null>(
    existingComment?.id ?? null
  );
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSave = useCallback(
    async (body: string) => {
      if (!body.trim() || !visitorName) return;
      setSaveStatus("saving");
      try {
        if (commentId) {
          const res = await fetch(`/api/client/comments/${commentId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ body }),
          });
          if (!res.ok) throw new Error("update failed");
        } else {
          const res = await fetch("/api/client/comments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              document_id: documentId,
              version_id: versionId,
              section_id: sectionId,
              author_name: visitorName,
              body,
            }),
          });
          if (!res.ok) throw new Error("create failed");
          const data = (await res.json()) as { id: string };
          setCommentId(data.id);
        }
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2500);
      } catch {
        setSaveStatus("error");
      }
    },
    [commentId, documentId, versionId, sectionId, visitorName]
  );

  function handleTextChange(value: string) {
    setText(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (value.trim()) {
      timerRef.current = setTimeout(() => doSave(value), 800);
    }
  }

  const hasExistingComment = Boolean(existingComment?.body);

  return (
    <div className="mt-4">
      {/* Toggle button */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsOpen((o) => !o)}
          className="flex items-center gap-1.5 text-xs text-sky hover:text-sky/70 transition-colors"
          aria-expanded={isOpen}
        >
          {/* Chat bubble icon */}
          <svg
            className="w-4 h-4 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          {isOpen ? (
            <span>Close</span>
          ) : hasExistingComment ? (
            <span className="font-medium">View / edit comment</span>
          ) : (
            <span>Add comment</span>
          )}
          {/* Indicator dot when there's a comment and box is closed */}
          {hasExistingComment && !isOpen && (
            <span className="w-1.5 h-1.5 rounded-full bg-cyan inline-block" />
          )}
        </button>
      </div>

      {/* Expandable textarea */}
      {isOpen && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <textarea
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:ring-2 focus:ring-sky/30 focus:border-sky resize-none transition-colors"
            rows={3}
            placeholder="Leave a note on this section…"
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            aria-label="Section comment"
          />
          <div className="mt-1 h-4 flex items-center">
            {saveStatus === "saving" && (
              <span className="text-xs text-charcoal/40">Saving…</span>
            )}
            {saveStatus === "saved" && (
              <span className="text-xs text-sky">Saved</span>
            )}
            {saveStatus === "error" && (
              <span className="text-xs text-red-500">
                Couldn&apos;t save — please try again.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SectionList (exported)
// ---------------------------------------------------------------------------

interface Props {
  sections: Section[];
  documentId: string;
  versionId: string;
  comments: Comment[];
  visitorName: string;
  isReadOnly: boolean;
}

export function SectionList({
  sections,
  documentId,
  versionId,
  comments,
  visitorName,
  isReadOnly,
}: Props) {
  const sorted = [...sections].sort((a, b) => a.order - b.order);

  // Index the most recent comment per section_id
  const latestBySectionId = comments.reduce<Record<string, Comment>>(
    (acc, c) => {
      const existing = acc[c.section_id];
      if (!existing || c.created_at > existing.created_at) {
        acc[c.section_id] = c;
      }
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6">
      {sorted.map((section) => {
        const existingComment = latestBySectionId[section.id] ?? null;

        return (
          <div
            key={section.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-7"
          >
            <h2 className="font-display text-2xl text-navy mb-4">
              {section.heading}
            </h2>

            <div className="text-charcoal text-[15px] leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
                components={MD_COMPONENTS}
              >
                {section.body_md}
              </ReactMarkdown>
            </div>

            {/* Read-only: show existing comment as a bubble */}
            {isReadOnly && existingComment && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="bg-ivory rounded-xl px-4 py-3">
                  <p className="text-xs font-medium text-charcoal/50 mb-1">
                    {existingComment.author_name}
                  </p>
                  <p className="text-sm text-charcoal">{existingComment.body}</p>
                </div>
              </div>
            )}

            {/* Interactive comment box — live docs only, visitor must have a name */}
            {!isReadOnly && visitorName && (
              <CommentBox
                documentId={documentId}
                versionId={versionId}
                sectionId={section.id}
                visitorName={visitorName}
                existingComment={existingComment}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
