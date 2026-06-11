import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/require-admin-page";
import { getDocumentById } from "@/lib/data/documents";
import { getVersionsByDocumentId, getLatestVersion } from "@/lib/data/versions";
import { getCommentsByDocumentId } from "@/lib/data/comments";
import { getAccessLogByDocumentId } from "@/lib/data/access-log";
import { SectionEditor } from "./_components/SectionEditor";
import { VersionList } from "./_components/VersionList";
import { CommentsPanel } from "./_components/CommentsPanel";
import { StatusToggle } from "./_components/StatusToggle";

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdminPage();

  const [doc, versions, comments, accessLog, latestVersion] = await Promise.all([
    getDocumentById(id),
    getVersionsByDocumentId(id),
    getCommentsByDocumentId(id),
    getAccessLogByDocumentId(id),
    getLatestVersion(id),
  ]);

  if (!doc) notFound();

  const latestSections = latestVersion?.sections ?? [];
  const latestVersionNumber = latestVersion?.version_number ?? 0;

  // Build section list from all versions for the comments panel heading lookup
  const allSections = latestSections;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/admin"
          className="font-body text-xs text-sky hover:underline inline-block mb-2"
        >
          ← All documents
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-2xl text-navy">{doc.title}</h1>
            <p className="font-body text-sm text-charcoal/60 mt-1">
              {doc.clients.name}
              {doc.clients.organization && ` · ${doc.clients.organization}`}
              {" · "}
              <span className="font-mono text-xs">{doc.slug}</span>
            </p>
          </div>
          <StatusToggle
            documentId={doc.id}
            initialStatus={doc.status}
            slug={doc.slug}
          />
        </div>
      </div>

      {/* Signer info */}
      {(doc.signer_name_expected || doc.signer_email) && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 px-4 py-3 font-body text-sm text-charcoal/70">
          Expected signer:{" "}
          <span className="font-medium text-charcoal">
            {doc.signer_name_expected ?? "—"}
          </span>
          {doc.signer_email && (
            <span className="ml-2 text-charcoal/50">({doc.signer_email})</span>
          )}
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Section editor — 2/3 width */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-display text-lg text-navy mb-4">Content</h2>
          <SectionEditor
            documentId={doc.id}
            documentStatus={doc.status}
            initialSections={latestSections}
            latestVersionNumber={latestVersionNumber}
          />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Version list */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-display text-lg text-navy mb-4">Versions</h2>
            <VersionList
              documentId={doc.id}
              documentStatus={doc.status}
              versions={versions}
            />
          </div>

          {/* Comments panel */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-display text-lg text-navy mb-4">Comments</h2>
            <CommentsPanel
              documentId={doc.id}
              documentStatus={doc.status}
              comments={comments}
              sections={allSections}
            />
          </div>
        </div>
      </div>

      {/* Access log */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-display text-lg text-navy mb-4">Access Log</h2>
        {accessLog.length === 0 ? (
          <p className="font-body text-sm text-charcoal/50">No visits yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-body">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-3 py-2 text-xs uppercase tracking-wide text-charcoal/50 font-semibold">
                    Name
                  </th>
                  <th className="px-3 py-2 text-xs uppercase tracking-wide text-charcoal/50 font-semibold">
                    Time
                  </th>
                  <th className="px-3 py-2 text-xs uppercase tracking-wide text-charcoal/50 font-semibold">
                    IP
                  </th>
                </tr>
              </thead>
              <tbody>
                {accessLog.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50"
                  >
                    <td className="px-3 py-2 text-charcoal font-medium">
                      {entry.name_entered}
                    </td>
                    <td className="px-3 py-2 text-charcoal/60">
                      {formatDate(entry.visited_at)}
                    </td>
                    <td className="px-3 py-2 text-charcoal/40 font-mono text-xs">
                      {entry.ip ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
