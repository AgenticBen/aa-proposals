export default function NotFound() {
  return (
    <div
      className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden"
      style={{ background: "linear-gradient(135deg,#013a5e 0%,#002139 70%)" }}
    >
      {/* Arc texture */}
      <svg
        aria-hidden="true"
        viewBox="0 0 600 400"
        preserveAspectRatio="xMaxYMax slice"
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ opacity: 0.16 }}
      >
        <path d="M300 400 Q 500 250 600 80" fill="none" stroke="#9DE2F2" strokeWidth="1.5" />
        <path d="M240 400 Q 470 220 600 30" fill="none" stroke="#9DE2F2" strokeWidth="1" />
        <path d="M360 400 Q 540 280 600 130" fill="none" stroke="#9DE2F2" strokeWidth="1" />
      </svg>

      <div className="relative text-center" style={{ maxWidth: 440 }}>
        {/* Wordmark */}
        <div className="flex items-center justify-center gap-1.5 mb-8">
          <span className="font-display text-base font-semibold" style={{ color: "#51ADDF" }}>Agentic</span>
          <span className="font-display text-base font-semibold text-white">Arc</span>
        </div>

        <h1
          className="font-display text-white mb-4"
          style={{ fontWeight: 600, fontSize: "clamp(32px, 5vw, 40px)", lineHeight: 1.1 }}
        >
          This link isn&apos;t active.
        </h1>
        <p
          className="font-body"
          style={{ fontSize: 16, lineHeight: 1.6, color: "rgba(255,255,255,0.72)" }}
        >
          If you were expecting a proposal here, contact{" "}
          <a
            href="mailto:ben@agenticarc.ai"
            style={{ color: "#9DE2F2", textDecoration: "underline", textUnderlineOffset: 2 }}
          >
            ben@agenticarc.ai
          </a>
          .
        </p>
      </div>
    </div>
  );
}
