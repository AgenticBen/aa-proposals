import { createHash } from "crypto";

/** One section as stored in versions.sections JSONB */
export interface Section {
  id: string;
  heading: string;
  body_md: string;
  order: number;
}

/**
 * Produce a stable canonical JSON string of a sections array.
 *
 * Rules:
 * 1. Sort sections by `order` (ascending), then by `id` as tiebreaker.
 * 2. Each section object is serialized with keys in alphabetical order:
 *    body_md, heading, id, order.
 * 3. No trailing whitespace, no pretty-printing.
 *
 * This string is what gets hashed — it must be recomputable from the stored
 * data at any future point in time.
 */
export function canonicalizeSections(sections: Section[]): string {
  const sorted = [...sections].sort((a, b) =>
    a.order !== b.order ? a.order - b.order : a.id.localeCompare(b.id)
  );

  const normalized = sorted.map((s) => ({
    body_md: s.body_md,
    heading: s.heading,
    id: s.id,
    order: s.order,
  }));

  return JSON.stringify(normalized);
}

/**
 * Compute the SHA-256 hex digest of the canonical sections JSON.
 * This is what is stored in signatures.content_hash.
 */
export function hashSections(sections: Section[]): string {
  const canonical = canonicalizeSections(sections);
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}
