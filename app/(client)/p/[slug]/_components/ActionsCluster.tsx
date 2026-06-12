"use client";

interface Props {
  slug: string;
  isSigned: boolean;
}

export function ActionsCluster({ slug, isSigned }: Props) {
  return (
    <>
      {/* Desktop: fixed bottom-right */}
      <div className="hidden sm:block fixed bottom-7 right-7 z-40">
        <div
          className="bg-white rounded-2xl px-4 py-3.5"
          style={{
            border: "1px solid rgba(0,33,57,0.1)",
            boxShadow: "0 4px 24px rgba(0,33,57,0.12)",
            minWidth: 260,
          }}
        >
          <DownloadLink slug={slug} isSigned={isSigned} />
        </div>
      </div>

      {/* Mobile: inline above footer */}
      <div
        className="sm:hidden mx-auto px-6 pb-8 pt-2"
        style={{ maxWidth: 720 }}
      >
        <div
          className="bg-white rounded-2xl px-4 py-3.5"
          style={{
            border: "1px solid rgba(0,33,57,0.1)",
            boxShadow: "0 2px 12px rgba(0,33,57,0.08)",
          }}
        >
          <DownloadLink slug={slug} isSigned={isSigned} />
        </div>
      </div>
    </>
  );
}

function DownloadLink({ slug, isSigned }: Props) {
  return (
    <>
      <a
        href={`/api/client/${slug}/pdf`}
        className="flex items-center justify-center gap-2 w-full rounded-xl font-body font-medium text-sm transition-colors"
        style={{
          background: "none",
          border: "1px solid #002139",
          color: "#002139",
          padding: "9px 16px",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.background = "rgba(0,33,57,0.05)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.background = "none";
        }}
      >
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {isSigned ? "Download executed PDF" : "Download PDF"}
      </a>
      <p
        className="font-body text-center mt-2"
        style={{ fontSize: 12, color: "rgba(73,80,80,0.5)", lineHeight: 1.5 }}
      >
        {isSigned
          ? "Includes the signature and audit record."
          : "Drafts are watermarked until signed."}
      </p>
    </>
  );
}
