import { getCompletedDocuments } from "@/lib/data/documents";
import type { DocumentWithClient } from "@/lib/types";

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
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

interface CompletedDoc extends DocumentWithClient {
  signatures?: Array<{
    signer_name: string;
    signer_email: string;
    signed_at: string;
    content_hash: string;
    executed_pdf: string | null;
  }>;
}

export default async function CompletedPage() {
  const documents = (await getCompletedDocuments()) as CompletedDoc[];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl text-navy">Completed Contracts</h1>
        <p className="font-body text-sm text-charcoal/60 mt-1">
          Signed and archived documents. Content is locked.
        </p>
      </div>

      {documents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <p className="font-body text-charcoal/60">No completed contracts yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 font-body text-xs uppercase tracking-wide text-charcoal/50 font-semibold">
                  Document
                </th>
                <th className="px-4 py-3 font-body text-xs uppercase tracking-wide text-charcoal/50 font-semibold">
                  Client
                </th>
                <th className="px-4 py-3 font-body text-xs uppercase tracking-wide text-charcoal/50 font-semibold">
                  Status
                </th>
                <th className="px-4 py-3 font-body text-xs uppercase tracking-wide text-charcoal/50 font-semibold">
                  Signed by
                </th>
                <th className="px-4 py-3 font-body text-xs uppercase tracking-wide text-charcoal/50 font-semibold">
                  Signed
                </th>
                <th className="px-4 py-3 font-body text-xs uppercase tracking-wide text-charcoal/50 font-semibold">
                  Hash (first 12)
                </th>
                <th className="px-4 py-3 font-body text-xs uppercase tracking-wide text-charcoal/50 font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc: CompletedDoc) => {
                const sig = doc.signatures?.[0];
                return (
                  <tr key={doc.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="font-body text-sm font-medium text-navy">{doc.title}</p>
                      <p className="font-body text-xs text-charcoal/40 font-mono">{doc.slug}</p>
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
                      {sig ? (
                        <>
                          <span className="font-medium">{sig.signer_name}</span>
                          <span className="block text-xs text-charcoal/50">{sig.signer_email}</span>
                        </>
                      ) : (
                        <span className="text-charcoal/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-charcoal/60">
                      {sig ? formatDate(sig.signed_at) : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-charcoal/40">
                      {sig ? sig.content_hash.slice(0, 12) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {sig?.executed_pdf ? (
                          <a
                            href={`/api/admin/documents/${doc.id}/executed-pdf`}
                            className="font-body text-xs text-sky hover:underline"
                          >
                            Download PDF
                          </a>
                        ) : (
                          <span className="font-body text-xs text-charcoal/30">No PDF</span>
                        )}
                        {/* Invoice stub — Phase v2 */}
                        <button
                          type="button"
                          disabled
                          className="font-body text-xs text-charcoal/30 cursor-not-allowed"
                          title="Invoice feature coming in v2"
                        >
                          Invoice (v2)
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
