export default function DocumentLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-3 w-28 bg-gray-200 rounded mb-3" />
        <div className="h-8 w-64 bg-gray-200 rounded-lg mb-2" />
        <div className="h-4 w-40 bg-gray-100 rounded" />
      </div>

      {/* Status + editor card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="h-5 w-32 bg-gray-200 rounded" />
        <div className="h-10 w-full bg-gray-100 rounded-xl" />
        <div className="h-10 w-full bg-gray-100 rounded-xl" />
        <div className="h-32 w-full bg-gray-100 rounded-xl" />
      </div>

      {/* Versions + comments row */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="h-5 w-24 bg-gray-200 rounded mb-4" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-lg mb-2" />
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="h-5 w-24 bg-gray-200 rounded mb-4" />
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg mb-2" />
          ))}
        </div>
      </div>
    </div>
  );
}
