"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface VersionSummary {
  id: string;
  version_number: number;
  created_at: string;
  note: string | null;
}

interface Props {
  versions: VersionSummary[];
  currentVersionId: string;
  viewedVersionId: string;
  slug: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  });
}

export function VersionBar({ versions, currentVersionId, viewedVersionId, slug }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const current = versions.find((v) => v.id === currentVersionId);
  const viewed = versions.find((v) => v.id === viewedVersionId);

  if (!current || !viewed) return null;

  function navigate(ver: VersionSummary) {
    setOpen(false);
    if (ver.id === currentVersionId) {
      router.push(`/p/${slug}`);
    } else {
      router.push(`/p/${slug}?v=${ver.version_number}`);
    }
  }

  return (
    <div
      className="flex items-center justify-between gap-3 py-3 relative"
      style={{ minHeight: 44 }}
    >
      {/* Left: version + date */}
      <span
        className="font-body"
        style={{ fontSize: 13, color: "rgba(73,80,80,0.7)" }}
      >
        Version {viewed.version_number} · Updated {formatDate(viewed.created_at)}
        {viewed.note && (
          <span style={{ color: "rgba(73,80,80,0.5)" }}> — {viewed.note}</span>
        )}
      </span>

      {/* Right: prior versions dropdown */}
      {versions.length > 1 && (
        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1.5 font-body transition-colors"
            style={{
              fontSize: 13,
              color: "rgba(73,80,80,0.7)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px 0",
            }}
            aria-expanded={open}
            aria-haspopup="listbox"
          >
            {/* Clock icon */}
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Prior versions
            {/* Chevron */}
            <svg
              className="w-3 h-3 shrink-0 transition-transform"
              style={{ transform: open ? "rotate(180deg)" : "none" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {open && (
            <div
              className="absolute right-0 z-20 overflow-hidden"
              style={{
                top: "calc(100% + 6px)",
                background: "#fff",
                border: "1px solid rgba(0,33,57,0.1)",
                borderRadius: 12,
                boxShadow: "0 8px 32px rgba(0,33,57,0.14)",
                minWidth: 240,
              }}
              role="listbox"
            >
              {versions.map((ver) => (
                <button
                  key={ver.id}
                  role="option"
                  aria-selected={ver.id === viewedVersionId}
                  onClick={() => navigate(ver)}
                  className="block w-full text-left transition-colors"
                  style={{
                    padding: "10px 14px",
                    background: ver.id === viewedVersionId ? "rgba(0,33,57,0.04)" : "#fff",
                    border: "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,33,57,0.04)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = ver.id === viewedVersionId ? "rgba(0,33,57,0.04)" : "#fff"; }}
                >
                  <span className="font-body font-semibold text-navy block" style={{ fontSize: 13 }}>
                    Version {ver.version_number}
                    {ver.id === currentVersionId ? " · current" : ""}
                  </span>
                  <span className="font-body block mt-0.5" style={{ fontSize: 12, color: "rgba(73,80,80,0.6)" }}>
                    {formatDate(ver.created_at)}{ver.note ? ` · ${ver.note}` : ""}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
