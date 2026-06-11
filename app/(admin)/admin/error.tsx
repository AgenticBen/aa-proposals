"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
      <p className="font-body text-charcoal/60 mb-4">
        Something went wrong loading this page.
      </p>
      <p className="font-mono text-xs text-charcoal/40 mb-6 max-w-sm break-all">
        {error.digest ?? error.message}
      </p>
      <button
        onClick={reset}
        className="bg-navy text-white font-body text-sm px-5 py-2.5 rounded-xl hover:bg-navy/90 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
