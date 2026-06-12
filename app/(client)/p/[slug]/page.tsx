import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getDocumentBySlug } from "@/lib/data/documents";
import { getVisibleVersionsByDocumentId } from "@/lib/data/versions";
import { getCommentsByVersionId } from "@/lib/data/comments";
import { getSignatureByDocumentId } from "@/lib/data/signatures";
import { AccessLogger } from "./_components/AccessLogger";
import { VisitorPopup } from "./_components/VisitorPopup";
import { VersionBar } from "./_components/VersionBar";
import { SectionList } from "./_components/SectionList";
import { SignSection } from "./_components/SignSection";
import { SignedSummary } from "./_components/SignedSummary";
import { ActionsCluster } from "./_components/ActionsCluster";
import { CONSENT_TEXT } from "@/lib/consent";
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

function formatPreparedDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "America/New_York",
  });
}

export default async function ProposalPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ v?: string; preview?: string }>;
}) {
  const { slug } = await params;
  const { v, preview } = await searchParams;
  const isAdminPreview = preview === "1";

  // ── Gating ──────────────────────────────────────────────────────────────
  const doc = await getDocumentBySlug(slug);
  if (!doc || (doc.status !== "live" && doc.status !== "signed")) {
    notFound();
  }

  const visibleVersions = await getVisibleVersionsByDocumentId(doc.id);
  if (visibleVersions.length === 0) {
    notFound();
  }

  // ── Version resolution ───────────────────────────────────────────────────
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
  const isSigned = doc.status === "signed";

  const [comments, signature] = await Promise.all([
    getCommentsByVersionId(currentVersion.id),
    isSigned ? getSignatureByDocumentId(doc.id) : Promise.resolve(null),
  ]);

  const cookieStore = await cookies();
  const visitorName = cookieStore.get("aa_visitor_name")?.value ?? null;

  const clientOrg = doc.clients?.organization ?? doc.clients?.name ?? "";

  return (
    <div className="bg-white min-h-screen font-body">
      {/* ── Admin preview banner ── */}
      {isAdminPreview && (
        <div className="sticky top-0 z-50 bg-navy border-b border-white/10 px-6 py-2 flex items-center justify-between gap-4">
          <p className="font-body text-xs text-white/75">
            Admin preview — this is how your client sees this proposal
          </p>
          <a
            href="javascript:window.close()"
            className="font-body text-xs text-white/50 hover:text-white transition-colors"
          >
            Close ✕
          </a>
        </div>
      )}

      {/* ── Visitor management — skip entirely in admin preview ── */}
      {!isAdminPreview && (
        visitorName ? (
          <AccessLogger documentId={doc.id} name={visitorName} />
        ) : (
          <VisitorPopup documentId={doc.id} />
        )
      )}

      {/* ── Cover band ── */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#013a5e 0%,#002139 70%)" }}
      >
        {/* Icy arc line — lower right, never behind title */}
        <svg
          aria-hidden="true"
          viewBox="0 0 600 320"
          preserveAspectRatio="xMaxYMax slice"
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ opacity: 0.17 }}
        >
          <path
            d="M420 320 Q 560 200 600 60"
            fill="none"
            stroke="#9DE2F2"
            strokeWidth="1.5"
          />
          <path
            d="M360 320 Q 530 180 600 20"
            fill="none"
            stroke="#9DE2F2"
            strokeWidth="1"
          />
          <path
            d="M480 320 Q 590 220 600 100"
            fill="none"
            stroke="#9DE2F2"
            strokeWidth="1"
          />
        </svg>

        <div
          className="relative mx-auto flex flex-col px-6 pt-8 pb-10"
          style={{ maxWidth: 720, minHeight: 320 }}
        >
          {/* Wordmark */}
          <div className="flex items-center gap-2">
            <span style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "#51ADDF", fontWeight: 600 }}>
              Agentic
            </span>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "#ffffff", fontWeight: 600 }}>
              Arc
            </span>
          </div>

          {/* Title block — pushed to bottom */}
          <div className="mt-auto pt-11">
            <p
              className="font-body font-bold uppercase mb-4"
              style={{ fontSize: 11, letterSpacing: "0.22em", color: "#2CCBE6" }}
            >
              Proposal
            </p>
            <h1
              className="cover-title font-display text-white"
              style={{
                fontSize: "clamp(36px, 5vw, 56px)",
                fontWeight: 600,
                lineHeight: 1.05,
                letterSpacing: "-0.01em",
                maxWidth: "16ch",
              }}
            >
              {doc.title}
            </h1>
            <p
              className="font-body mt-5"
              style={{ fontSize: 15, color: "rgba(255,255,255,0.72)" }}
            >
              {clientOrg ? `Prepared for ${clientOrg} · ` : ""}{formatPreparedDate(doc.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Status strip ── */}
      <div
        className="bg-white"
        style={{ borderBottom: "1px solid rgba(0,33,57,0.08)" }}
      >
        <div className="mx-auto px-6" style={{ maxWidth: 720 }}>
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
        </div>
      </div>

      {/* ── Document body ── */}
      <div
        className="mx-auto px-6 pt-11 pb-16"
        style={{ maxWidth: 720 }}
      >
        {/* Signed banner */}
        {isSigned && signature && (
          <div
            className="flex items-center gap-3 rounded-xl px-5 py-4 mb-10"
            style={{
              background: "rgba(44,203,230,0.08)",
              border: "1px solid rgba(44,203,230,0.25)",
            }}
          >
            <svg className="w-5 h-5 shrink-0" style={{ color: "#2CCBE6" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-body text-sm font-medium" style={{ color: "#002139" }}>
              Signed by {signature.signer_name} on{" "}
              {new Intl.DateTimeFormat("en-US", {
                timeZone: "America/New_York",
                dateStyle: "long",
              }).format(new Date(signature.signed_at))}
              . This proposal is now read-only.
            </p>
          </div>
        )}

        {/* Old version banner */}
        {isViewingOldVersion && (
          <div
            className="flex items-center gap-3 rounded-xl px-5 py-4 mb-10"
            style={{
              background: "rgba(230,227,226,0.7)",
              border: "1px solid rgba(0,33,57,0.1)",
            }}
          >
            <svg className="w-5 h-5 shrink-0 text-charcoal/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-body text-sm text-charcoal/70">
              You are viewing an earlier version.{" "}
              <a href={`/p/${slug}`} className="font-semibold text-charcoal underline underline-offset-2">
                Switch to current version
              </a>{" "}
              to leave comments.
            </p>
          </div>
        )}

        {/* Editorial sections */}
        <SectionList
          sections={viewedVersion.sections as Section[]}
          documentId={doc.id}
          versionId={currentVersion.id}
          comments={comments}
          visitorName={visitorName ?? ""}
          isReadOnly={isViewingOldVersion || isSigned}
        />
      </div>

      {/* ── Sign ceremony — only on current version of a live doc with known visitor; never in preview ── */}
      {doc.status === "live" && !isViewingOldVersion && visitorName && !isAdminPreview && (
        <SignSection
          documentId={doc.id}
          consentText={CONSENT_TEXT}
          prefillName={visitorName}
          prefillEmail={doc.signer_email ?? ""}
        />
      )}

      {/* ── Post-sign: executed signature block ── */}
      {isSigned && signature && <SignedSummary signature={signature} slug={slug} />}

      {/* ── Actions cluster (sticky desktop / inline mobile above footer) ── */}
      <ActionsCluster slug={slug} isSigned={isSigned} />

      {/* ── Footer ── */}
      <footer className="bg-navy">
        <div
          className="mx-auto px-6 py-5 flex items-center justify-between gap-4 flex-wrap"
          style={{ maxWidth: 720 }}
        >
          <div className="flex items-center gap-1.5">
            <span className="font-display text-sm font-semibold" style={{ color: "#51ADDF" }}>Agentic</span>
            <span className="font-display text-sm font-semibold text-white">Arc</span>
          </div>
          <span className="font-body text-sm" style={{ color: "rgba(255,255,255,0.62)" }}>
            Questions?{" "}
            <a href="mailto:ben@agenticarc.ai" style={{ color: "#9DE2F2" }}>
              ben@agenticarc.ai
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
