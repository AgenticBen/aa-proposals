import Link from "next/link";
import { getAllDocuments } from "@/lib/data/documents";
import { DocCardActions } from "./_components/DocCardActions";
import { requireAdminPage } from "@/lib/auth/require-admin-page";
import type { DocumentWithClient } from "@/lib/types";

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    live: "bg-green-100 text-green-700",
    signed: "bg-blue-100 text-blue-700",
    archived: "bg-orange-100 text-orange-600",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium font-body ${styles[status] ?? "bg-gray-100 text-gray-600"}`}
    >
      {status}
    </span>
  );
}

function formatLastVisit(iso: string | null | undefined) {
  if (!iso) return null;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default async function AdminDashboard() {
  await requireAdminPage();
  const documents = await getAllDocuments();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl text-navy">Documents</h1>
        <Link
          href="/admin/clients"
          className="bg-cyan text-navy font-body font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-cyan/90 transition-colors"
        >
          + New Document
        </Link>
      </div>

      {documents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <p className="font-body text-charcoal/60 mb-4">No documents yet.</p>
          <Link
            href="/admin/clients"
            className="inline-flex items-center gap-1 font-body text-sm bg-navy text-white px-5 py-2.5 rounded-xl hover:bg-navy/90 transition-colors"
          >
            Create your first document →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {documents.map((doc: DocumentWithClient) => {
            const lastVisit = formatLastVisit(doc.last_visit);
            const commentCount = doc.unresolved_comment_count ?? 0;

            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col"
              >
                {/* Top: status + client + title */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="font-body text-xs uppercase tracking-[0.15em] font-bold text-charcoal/40 mb-1 truncate">
                      {doc.clients?.organization ?? doc.clients?.name ?? "—"}
                    </p>
                    <h3 className="font-display text-base text-navy leading-snug">
                      {doc.title}
                    </h3>
                  </div>
                  <StatusPill status={doc.status} />
                </div>

                {/* Meta row */}
                <div className="flex items-center gap-3 font-body text-xs text-charcoal/45 mb-4 flex-wrap">
                  {lastVisit ? (
                    <span>Last visit: {lastVisit}</span>
                  ) : (
                    <span>Not yet viewed</span>
                  )}
                  {commentCount > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold">
                        {commentCount}
                      </span>
                      {commentCount === 1 ? "comment" : "comments"}
                    </span>
                  )}
                  {doc.latest_version != null && (
                    <span className="text-charcoal/30">v{doc.latest_version}</span>
                  )}
                </div>

                {/* Actions — pushed to bottom */}
                <div className="mt-auto">
                  <DocCardActions documentId={doc.id} slug={doc.slug} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
