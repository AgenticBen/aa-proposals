"use client";

import { useState, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import type { Section, Comment } from "@/lib/types";

// ---------------------------------------------------------------------------
// Markdown overrides — editorial prose style (Inter 17px, Playfair headings)
// ---------------------------------------------------------------------------

const MD_COMPONENTS: React.ComponentProps<typeof ReactMarkdown>["components"] = {
  h1: ({ children }) => (
    <h1 className="font-display text-2xl text-navy mt-6 mb-3" style={{ fontWeight: 600 }}>{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-display text-xl text-navy mt-5 mb-2" style={{ fontWeight: 600 }}>{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-body font-semibold text-navy text-base mt-4 mb-1">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="mb-[18px] last:mb-0" style={{ lineHeight: 1.65 }}>{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-outside pl-5 mb-[18px] space-y-2">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-outside pl-5 mb-[18px] space-y-2">{children}</ol>
  ),
  li: ({ children }) => <li style={{ lineHeight: 1.65 }}>{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-navy">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote
      className="border-l-2 pl-5 italic my-5"
      style={{ borderColor: "#51ADDF", color: "rgba(73,80,80,0.8)" }}
    >
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="bg-ivory px-1.5 py-0.5 rounded text-sm font-mono text-navy">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="bg-ivory rounded-xl p-4 overflow-x-auto text-sm font-mono mb-4">{children}</pre>
  ),
  hr: () => <hr className="my-6" style={{ borderColor: "rgba(0,33,57,0.08)" }} />,
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
// CommentBox — the ONE card-styled element in the editorial body
// ---------------------------------------------------------------------------

type SaveStatus = "idle" | "saving" | "saved" | "error";

function CommentBox({
  documentId,
  versionId,
  sectionId,
  visitorName,
  existingComment,
  onClose,
}: {
  documentId: string;
  versionId: string;
  sectionId: string;
  visitorName: string;
  existingComment: Comment | null;
  onClose: () => void;
}) {
  const [text, setText] = useState(existingComment?.body ?? "");
  const [commentId, setCommentId] = useState<string | null>(existingComment?.id ?? null);
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

  return (
    <div
      className="mt-6"
      style={{
        background: "#fff",
        border: "1px solid rgba(0,33,57,0.1)",
        borderRadius: 16,
        padding: "20px 22px",
        boxShadow: "0 2px 16px rgba(0,33,57,0.06)",
        animation: "expandDown 0.15s ease-out",
      }}
    >
      <style>{`@keyframes expandDown { from { transform: translateY(-6px); opacity: 0.6; } to { transform: none; opacity: 1; } }`}</style>
      <div className="flex items-center justify-between mb-3">
        <span
          className="font-body font-bold uppercase"
          style={{ fontSize: 11, letterSpacing: "0.14em", color: "#51ADDF" }}
        >
          Comments
        </span>
        <button
          onClick={onClose}
          aria-label="Close comments"
          className="text-charcoal/40 hover:text-charcoal transition-colors p-1 -mr-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {existingComment && (
        <div
          className="mb-4 pb-4"
          style={{ borderBottom: "1px solid rgba(0,33,57,0.08)" }}
        >
          <p className="font-body text-xs font-semibold text-navy mb-1">{existingComment.author_name}</p>
          <p className="font-body text-sm text-charcoal" style={{ lineHeight: 1.55 }}>
            {existingComment.body}
          </p>
        </div>
      )}

      <textarea
        className="w-full rounded-xl px-3 py-2.5 font-body text-sm text-charcoal placeholder:text-charcoal/35 resize-none focus:outline-none transition-colors"
        style={{
          border: "1px solid rgba(0,33,57,0.12)",
          lineHeight: 1.6,
        }}
        rows={3}
        placeholder="What would you like changed in this section?"
        value={text}
        onChange={(e) => handleTextChange(e.target.value)}
        aria-label="Section comment"
        onFocus={(e) => { e.currentTarget.style.borderColor = "#51ADDF"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(0,33,57,0.12)"; }}
      />
      <div className="mt-1.5 h-4 flex items-center">
        {saveStatus === "saving" && (
          <span className="font-body text-xs" style={{ color: "rgba(73,80,80,0.5)" }}>Saving…</span>
        )}
        {saveStatus === "saved" && (
          <span className="font-body text-xs text-sky">Saved</span>
        )}
        {saveStatus === "error" && (
          <span className="font-body text-xs text-red-500">Could not save — please try again.</span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SectionList (exported) — editorial prose, no card wrapper
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
  const [openSection, setOpenSection] = useState<string | null>(null);

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
    <div className="space-y-[60px]">
      {sorted.map((section) => {
        const existingComment = latestBySectionId[section.id] ?? null;
        const hasComment = Boolean(existingComment?.body);
        const isOpen = openSection === section.id;
        const showTrigger = !isReadOnly && visitorName;

        return (
          <section key={section.id} className="group">
            {/* Section heading row — Playfair + hover-reveal comment icon */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <h2
                className="font-display text-navy"
                style={{ fontWeight: 600, fontSize: "clamp(24px, 3vw, 28px)", lineHeight: 1.15 }}
              >
                {section.heading}
              </h2>

              {showTrigger && (
                <button
                  onClick={() => setOpenSection(isOpen ? null : section.id)}
                  aria-label={isOpen ? "Close comments" : "Add comment on this section"}
                  aria-expanded={isOpen}
                  className="flex-none transition-opacity"
                  style={{
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#51ADDF",
                    position: "relative",
                    opacity: isOpen || hasComment ? 1 : 0,
                  }}
                  // show on hover via the group class (handled by CSS below)
                  data-comment-trigger="true"
                >
                  {hasComment ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  )}
                  {hasComment && (
                    <span
                      className="absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full text-navy font-body font-bold"
                      style={{
                        minWidth: 16,
                        height: 16,
                        fontSize: 10,
                        background: "#2CCBE6",
                        padding: "0 3px",
                        lineHeight: 1,
                      }}
                    >
                      1
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Editorial prose body */}
            <div
              className="font-body text-charcoal"
              style={{ fontSize: 17, lineHeight: 1.65 }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
                components={MD_COMPONENTS}
              >
                {section.body_md}
              </ReactMarkdown>
            </div>

            {/* Read-only: show existing comment as a quiet aside */}
            {isReadOnly && existingComment && (
              <div
                className="mt-5 rounded-xl px-4 py-3"
                style={{ background: "rgba(230,227,226,0.5)" }}
              >
                <p className="font-body text-xs font-semibold text-navy/60 mb-1">{existingComment.author_name}</p>
                <p className="font-body text-sm text-charcoal" style={{ lineHeight: 1.55 }}>{existingComment.body}</p>
              </div>
            )}

            {/* Interactive comment box (the ONE card element in the body) */}
            {isOpen && !isReadOnly && visitorName && (
              <CommentBox
                documentId={documentId}
                versionId={versionId}
                sectionId={section.id}
                visitorName={visitorName}
                existingComment={existingComment}
                onClose={() => setOpenSection(null)}
              />
            )}
          </section>
        );
      })}

      {/* Hover-reveal style for desktop */}
      <style>{`
        @media (hover: hover) and (min-width: 760px) {
          section.group [data-comment-trigger="true"] { opacity: 0; }
          section.group:hover [data-comment-trigger="true"],
          section.group [data-comment-trigger="true"][aria-expanded="true"],
          section.group [data-comment-trigger="true"].has-count { opacity: 1 !important; }
        }
      `}</style>
    </div>
  );
}
