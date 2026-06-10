/**
 * Branded inactive-link page.
 * Shown for unknown slugs, draft docs, and archived docs.
 * HTTP 404 semantics — never reveals whether the slug exists.
 */
export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <p className="font-body text-xs uppercase tracking-widest font-bold text-cyan mb-4">
          Agentic Arc
        </p>
        <h1 className="font-display text-3xl text-navy mb-4">
          This link isn&apos;t active.
        </h1>
        <p className="text-charcoal/70 leading-relaxed">
          If you received this link from Ben, it may not be live yet or may
          have been deactivated. Reach out directly at{" "}
          <a
            href="mailto:ben@agenticarc.ai"
            className="text-sky underline underline-offset-2 hover:text-sky/80"
          >
            ben@agenticarc.ai
          </a>
          .
        </p>
      </div>
    </div>
  );
}
