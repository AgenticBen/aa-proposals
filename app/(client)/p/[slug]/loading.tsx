export default function ProposalLoading() {
  return (
    <>
      {/* Cover band skeleton */}
      <div
        className="relative overflow-hidden animate-pulse"
        style={{ background: "linear-gradient(135deg,#013a5e 0%,#002139 70%)", minHeight: 280 }}
      >
        <div className="relative mx-auto px-6 py-16" style={{ maxWidth: 720 }}>
          {/* Wordmark line */}
          <div className="flex items-center gap-2 mb-6">
            <div className="h-4 w-20 rounded" style={{ background: "rgba(81,173,223,0.3)" }} />
            <div className="h-4 w-8 rounded" style={{ background: "rgba(255,255,255,0.2)" }} />
          </div>
          {/* Eyebrow */}
          <div className="h-3 w-16 rounded mb-4" style={{ background: "rgba(44,203,230,0.4)" }} />
          {/* Title */}
          <div className="h-10 w-80 rounded-lg mb-4" style={{ background: "rgba(255,255,255,0.15)" }} />
          {/* Meta line */}
          <div className="h-3 w-52 rounded" style={{ background: "rgba(255,255,255,0.1)" }} />
        </div>
      </div>

      {/* Status strip skeleton */}
      <div
        className="animate-pulse"
        style={{ borderBottom: "1px solid rgba(0,33,57,0.08)" }}
      >
        <div className="mx-auto px-6 py-3 flex justify-between items-center" style={{ maxWidth: 720 }}>
          <div className="h-3 w-36 bg-gray-200 rounded" />
          <div className="h-3 w-24 bg-gray-200 rounded" />
        </div>
      </div>

      {/* Editorial sections skeleton */}
      <div
        className="mx-auto px-6 animate-pulse"
        style={{ maxWidth: 720, paddingTop: 56, paddingBottom: 80 }}
      >
        <div className="space-y-[60px]">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-4">
              {/* Section heading */}
              <div
                className="h-7 rounded-lg"
                style={{ width: i % 2 === 0 ? 200 : 160, background: "rgba(0,33,57,0.1)" }}
              />
              {/* Body lines */}
              <div className="space-y-2.5">
                <div className="h-4 w-full bg-gray-100 rounded" />
                <div className="h-4 w-11/12 bg-gray-100 rounded" />
                <div className="h-4 w-4/5 bg-gray-100 rounded" />
                {i < 2 && <div className="h-4 w-10/12 bg-gray-100 rounded" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
