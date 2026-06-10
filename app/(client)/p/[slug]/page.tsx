import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getDocumentBySlug } from "@/lib/data/documents";
import { getVisibleVersionsByDocumentId } from "@/lib/data/versions";
import { getCommentsByVersionId } from "@/lib/data/comments";
import { AccessLogger } from "./_components/AccessLogger";
import { VisitorPopup } from "./_components/VisitorPopup";
import { VersionBar } from "./_components/VersionBar";
import { SectionList } from "./_components/SectionList";
import type { Section } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = await getDocumentBySlug(slug);
  if (!doc || (doc.status !== "live" && doc.status !== "signed")) {
    return { title: "Proposal — Agentic Arc" };
  }
  return { title: `${doc.title} — Agentic Arc` };
}

export default async function ProposalPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const { slug } = await params;
  const { v } = await searchParams;

  // ── Gating ──────────────────────────────────────────────────────────────
  const doc = await getDocumentBySlug(slug);
  if (!doc || (doc.status !== "live" && doc.status !== "signed")) {
    notFound();
  }

  const visibleVersions = await getVisibleVersionsByDocumentId(doc.id);
  if (visibleVersions.length === 0) {
    // Live/signed doc with no visible version — shouldn't happen in practice
    notFound();
  }

  // ── Version resolution ───────────────────────────────────────────────────
  // visibleVersions is sorted newest-first
  const currentVersion = visibleVersions[0];

  let viewedVersion = currentVersion;
  let isViewingOldVersion = false;

  if (v) {
    const requested = parseInt(v, 10);
    const found = visibleVersions.find(
      (ver) => ver.version_number === requested
    );
    if (found && found.id !== currentVersion.id) {
      viewedVersion = found;
      isViewingOldVersion = true;
    }
  }

  // ── Data ─────────────────────────────────────────────────────────────────
  // Comments always belong to the current version (not the viewed old one)
  const comments = await getCommentsByVersionId(currentVersion.id);

  const cookieStore = await cookies();
  const visitorName = cookieStore.get("aa_visitor_name")?.value ?? null;

  const isSigned = doc.status === "signed";

  return (
    <>
      {/* ── Visitor management ── */}
      {visitorName ? (
        <AccessLogger documentId={doc.id} name={visitorName} />
      ) : (
        <VisitorPopup documentId={doc.id} />
      )}

      {/* ── Document title band ── */}
      <div className="bg-navy">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <p className="font-body text-xs uppercase tracking-widest font-bold text-icy mb-2">
            Proposal
          </p>
          <h1 className="font-display text-3xl text-white leading-snug">
            {doc.title}
          </h1>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="mx-auto max-w-3xl px-6 py-8">

        {/* Signed banner */}
        {isSigned && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4 mb-6">
            <svg
              className="w-5 h-5 text-green-600 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-green-800 font-medium">
              This proposal has been signed. It is now read-only.
            </p>
          </div>
        )}

        {/* Old version banner */}
        {isViewingOldVersion && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-6">
            <svg
              className="w-5 h-5 text-amber-600 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-amber-800">
              You are viewing an earlier version.{" "}
              <a href={`/p/${slug}`} className="font-medium underline underline-offset-2">
                Switch to current version
              </a>{" "}
              to leave comments.
            </p>
          </div>
        )}

        {/* Version bar */}
        <VersionBar
          versions={visibleVersions.map((ver) => ({
            id: ver.id,
            version_number: ver.version_number,
            created_at: ver.created_at,
            note: ver.note,
          }))}
          currentVersionId={currentVersion.id}
          viewedVersionId={viewedVersion.id}
          slug={slug}
        />

        {/* Sections */}
        <SectionList
          sections={viewedVersion.sections as Section[]}
          documentId={doc.id}
          versionId={currentVersion.id}
          comments={comments}
          visitorName={visitorName ?? ""}
          isReadOnly={isViewingOldVersion || isSigned}
        />

        {/* Download PDF */}
        <div className="mt-10 pt-6 border-t border-gray-100">
          <a
            href={`/api/client/${slug}/pdf`}
            className="inline-flex items-center gap-2 bg-navy text-white px-5 py-2.5 rounded-xl text-sm font-body font-medium hover:bg-navy/90 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
            </svg>
            Download PDF
          </a>
          {!isSigned && (
            <p className="mt-2 text-xs text-charcoal/50">
              This draft PDF carries a &ldquo;DRAFT — not executed&rdquo;
              watermark.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
