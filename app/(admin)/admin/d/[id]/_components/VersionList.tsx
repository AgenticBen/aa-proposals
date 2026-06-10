"use client";

import { useState, useTransition } from "react";
import type { Version } from "@/lib/types";

interface Props {
  documentId: string;
  documentStatus: string;
  versions: Version[];
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

export function VersionList({ documentId, documentStatus, versions }: Props) {
  const [localVersions, setLocalVersions] = useState(versions);
  const [isPending, startTransition] = useTransition();
  const locked = documentStatus === "signed" || documentStatus === "archived";

  async function toggleVisibility(versionId: string, current: boolean) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/versions/${versionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible_to_client: !current, document_id: documentId }),
      });
      if (res.status === 409) {
        alert("Document is signed — cannot change version visibility.");
        return;
      }
      if (!res.ok) return;
      setLocalVersions((prev) =>
        prev.map((v) =>
          v.id === versionId ? { ...v, visible_to_client: !current } : v
        )
      );
    });
  }

  return (
    <div className="space-y-2">
      {localVersions.map((v) => (
        <div
          key={v.id}
          className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3"
        >
          <div>
            <p className="font-body text-sm font-medium text-navy">
              v{v.version_number}
              {v.note && (
                <span className="ml-2 font-normal text-charcoal/60">{v.note}</span>
              )}
            </p>
            <p className="font-body text-xs text-charcoal/50">{formatDate(v.created_at)}</p>
          </div>
          <div className="flex items-center gap-3">
            {v.visible_to_client && (
              <span className="font-body text-xs text-green-600 font-medium">Client visible</span>
            )}
            {!locked && (
              <button
                type="button"
                onClick={() => toggleVisibility(v.id, v.visible_to_client)}
                disabled={isPending}
                className="font-body text-xs text-sky hover:underline disabled:opacity-50"
              >
                {v.visible_to_client ? "Hide from client" : "Show to client"}
              </button>
            )}
          </div>
        </div>
      ))}
      {localVersions.length === 0 && (
        <p className="font-body text-sm text-charcoal/50">No versions yet.</p>
      )}
    </div>
  );
}
