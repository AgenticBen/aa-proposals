import Link from "next/link";
import { getAllDocuments } from "@/lib/data/documents";
import { CopyLinkButton } from "./_components/CopyLinkButton";
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
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium font-body ${styles[status] ?? "bg-gray-100 text-gray-600"}`}
    >
      {status}
    </span>
  );
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
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
          className="bg-cyan text-navy font-body font-medium text-sm px-4 py-2 rounded-xl hover:bg-cyan/90 transition-colors"
        >
          + New Document
        </Link>
      </div>

      {documents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <p className="font-body text-charcoal/60">No documents yet.</p>
          <Link
            href="/admin/clients"
            className="mt-4 inline-block font-body text-sm text-sky hover:underline"
          >
            Create your first document →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 font-body text-xs uppercase tracking-wide text-charcoal/50 font-semibold">
                  Title
                </th>
                <th className="px-4 py-3 font-body text-xs uppercase tracking-wide text-charcoal/50 font-semibold">
                  Client
                </th>
                <th className="px-4 py-3 font-body text-xs uppercase tracking-wide text-charcoal/50 font-semibold">
                  Status
                </th>
                <th className="px-4 py-3 font-body text-xs uppercase tracking-wide text-charcoal/50 font-semibold">
                  Version
                </th>
                <th className="px-4 py-3 font-body text-xs uppercase tracking-wide text-charcoal/50 font-semibold">
                  Comments
                </th>
                <th className="px-4 py-3 font-body text-xs uppercase tracking-wide text-charcoal/50 font-semibold">
                  Last Visit
                </th>
                <th className="px-4 py-3 font-body text-xs uppercase tracking-wide text-charcoal/50 font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc: DocumentWithClient) => (
                <tr key={doc.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/d/${doc.id}`}
                      className="font-body text-sm font-medium text-navy hover:text-sky transition-colors"
                    >
                      {doc.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-charcoal">
                    {doc.clients?.name}
                    {doc.clients?.organization && (
                      <span className="block text-xs text-charcoal/50">
                        {doc.clients.organization}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={doc.status} />
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-charcoal">
                    {doc.latest_version != null ? `v${doc.latest_version}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {(doc.unresolved_comment_count ?? 0) > 0 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs font-bold font-body">
                        {doc.unresolved_comment_count}
                      </span>
                    ) : (
                      <span className="font-body text-sm text-charcoal/40">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-charcoal/60">
                    {formatDate(doc.last_visit)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/d/${doc.id}`}
                        className="font-body text-xs text-sky hover:underline"
                      >
                        Open
                      </Link>
                      <CopyLinkButton slug={doc.slug} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

