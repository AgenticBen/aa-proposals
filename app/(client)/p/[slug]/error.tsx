"use client";

export default function ProposalError({ reset }: { reset: () => void }) {
  return (
    <>
      <div className="bg-navy">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <h1 className="font-display text-2xl text-white">Something went wrong</h1>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-6 py-12 text-center">
        <p className="font-body text-charcoal/60 mb-6">
          There was a problem loading this proposal. Please try again.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center bg-navy text-white font-body text-sm px-5 py-2.5 rounded-xl hover:bg-navy/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </>
  );
}
