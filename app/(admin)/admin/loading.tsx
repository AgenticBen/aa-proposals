export default function AdminLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-9 w-40 bg-gray-200 rounded-lg" />
        <div className="h-9 w-36 bg-gray-200 rounded-xl" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-100 px-4 py-3 flex gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-4 w-20 bg-gray-100 rounded" />
          ))}
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border-b border-gray-50 px-4 py-4 flex gap-4 items-center">
            <div className="h-4 w-44 bg-gray-100 rounded" />
            <div className="h-4 w-28 bg-gray-100 rounded" />
            <div className="h-5 w-16 bg-gray-100 rounded-full" />
            <div className="h-4 w-8 bg-gray-100 rounded" />
            <div className="h-4 w-8 bg-gray-100 rounded" />
            <div className="h-4 w-20 bg-gray-100 rounded" />
            <div className="h-4 w-16 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
