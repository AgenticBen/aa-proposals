import type { Signature } from "@/lib/types";

function formatEasternTime(iso: string): string {
  return (
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date(iso)) + " ET"
  );
}

const INK_LABEL: Record<string, string> = {
  black: "Black ink",
  blue: "Blue ink",
  red: "Red ink",
};

/**
 * Replaces the sign section once a document is signed (SPEC §5.6):
 * the signature image plus an audit summary. Server component.
 */
export function SignedSummary({ signature, slug }: { signature: Signature; slug: string }) {
  return (
    <div className="mt-12 bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-7">
      <p className="font-body text-xs uppercase tracking-widest font-bold text-cyan mb-2">
        Executed
      </p>
      <h2 className="font-display text-2xl text-navy mb-5">Signature on record</h2>

      <div className="rounded-xl border border-gray-200 bg-ivory/40 px-6 py-5 inline-block">
        {/* Served by our own route from private storage; plain img is fine here */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/client/${slug}/signature`}
          alt={`Signature of ${signature.signer_name}`}
          className="h-20 w-auto max-w-full"
        />
        <div className="mt-2 border-t border-charcoal/40 pt-2">
          <p className="text-sm font-semibold text-navy">{signature.signer_name}</p>
          <p className="text-xs text-charcoal/60">{signature.signer_email}</p>
        </div>
      </div>

      <dl className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2 text-sm">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-charcoal/50">Signed</dt>
          <dd className="text-charcoal mt-0.5">{formatEasternTime(signature.signed_at)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-charcoal/50">Ink</dt>
          <dd className="text-charcoal mt-0.5">{INK_LABEL[signature.ink_color] ?? signature.ink_color}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-charcoal/50">
            Content fingerprint (SHA-256)
          </dt>
          <dd className="text-charcoal mt-0.5 font-mono text-xs break-all">
            {signature.content_hash}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-charcoal/50">Consent</dt>
          <dd className="text-charcoal/70 mt-0.5 text-xs italic leading-relaxed">
            &ldquo;{signature.consent_text}&rdquo;
          </dd>
        </div>
      </dl>
    </div>
  );
}
