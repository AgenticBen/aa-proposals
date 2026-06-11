export default function ProposalLoading() {
  return (
    <>
      {/* Title band */}
      <div className="bg-navy">
        <div className="mx-auto max-w-3xl px-6 py-8 animate-pulse">
          <div className="h-3 w-16 bg-white/20 rounded mb-3" />
          <div className="h-8 w-64 bg-white/20 rounded-lg" />
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-6 py-8 animate-pulse space-y-6">
        {/* Version bar placeholder */}
        <div className="h-4 w-48 bg-gray-200 rounded" />

        {/* Section cards */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 sm:px-8 py-6 sm:py-7 space-y-3"
          >
            <div className="h-7 w-48 bg-gray-200 rounded-lg" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-100 rounded" />
              <div className="h-4 w-5/6 bg-gray-100 rounded" />
              <div className="h-4 w-4/5 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
