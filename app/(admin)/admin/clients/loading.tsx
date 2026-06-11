export default function ClientsLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-24 bg-gray-200 rounded-lg mb-6" />
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="h-5 w-36 bg-gray-200 rounded mb-4" />
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-xl" />
          ))}
        </div>
        <div className="mt-4 h-10 w-32 bg-gray-200 rounded-xl" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border-b border-gray-50 px-4 py-4 flex items-center gap-4">
            <div className="h-4 w-32 bg-gray-100 rounded" />
            <div className="h-4 w-24 bg-gray-100 rounded" />
            <div className="h-4 w-40 bg-gray-100 rounded" />
            <div className="ml-auto h-4 w-24 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
