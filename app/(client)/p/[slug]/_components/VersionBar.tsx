"use client";

import { useRouter } from "next/navigation";

interface VersionSummary {
  id: string;
  version_number: number;
  created_at: string;
  note: string | null;
}

interface Props {
  versions: VersionSummary[]; // sorted newest first
  currentVersionId: string;   // highest visible version
  viewedVersionId: string;    // may differ when browsing old versions
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

export function VersionBar({
  versions,
  currentVersionId,
  viewedVersionId,
  slug,
}: Props) {
  const router = useRouter();
  const current = versions.find((v) => v.id === currentVersionId);
  const viewed = versions.find((v) => v.id === viewedVersionId);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const selectedId = e.target.value;
    if (selectedId === currentVersionId) {
      router.push(`/p/${slug}`);
    } else {
      const v = versions.find((ver) => ver.id === selectedId);
      if (v) router.push(`/p/${slug}?v=${v.version_number}`);
    }
  }

  if (!current || !viewed) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
      <p className="text-sm text-charcoal/60">
        <span className="font-medium text-charcoal">
          Version {viewed.version_number}
        </span>
        {" · "}updated {formatDate(viewed.created_at)}
        {viewed.note && (
          <span className="ml-1 text-charcoal/50">— {viewed.note}</span>
        )}
      </p>

      {versions.length > 1 && (
        <div className="flex items-center gap-2">
          <label htmlFor="version-select" className="text-xs text-charcoal/50">
            View version:
          </label>
          <select
            id="version-select"
            value={viewedVersionId}
            onChange={handleChange}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-sky/30"
          >
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                v{v.version_number}
                {v.id === currentVersionId ? " (current)" : ""}
                {v.note ? ` — ${v.note}` : ""}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
