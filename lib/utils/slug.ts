/**
 * Slug generator for documents.
 *
 * Format: kebab-cased-title-XXXXXXXXXXXX
 * where XXXXXXXXXXXX is a 12-character base62 random suffix (~71 bits of entropy).
 *
 * The suffix is the security boundary. The readable prefix is cosmetic.
 */

const BASE62_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/** Generate a random base62 string of exactly `length` characters. */
export function randomBase62(length: number): string {
  const bytes = new Uint8Array(length * 2); // oversample to reject bias
  crypto.getRandomValues(bytes);
  let result = "";
  for (const byte of bytes) {
    // 256 / 62 = ~4.1; values 0–247 map uniformly to 0–61; 248–255 are rejected
    if (byte < 248) {
      result += BASE62_CHARS[byte % 62];
      if (result.length === length) break;
    }
  }
  // Fallback: if we somehow ran out (extremely unlikely), refill
  while (result.length < length) {
    const extra = new Uint8Array(length);
    crypto.getRandomValues(extra);
    for (const byte of extra) {
      if (byte < 248 && result.length < length) {
        result += BASE62_CHARS[byte % 62];
      }
    }
  }
  return result;
}

/** Convert a document title into a URL-safe kebab-case prefix. */
export function kebabify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, "-")     // non-alphanumerics → dash
    .replace(/^-+|-+$/g, "")          // trim leading/trailing dashes
    .slice(0, 60);                    // cap prefix length
}

/** Generate a slug from a document title. Does NOT check for collisions. */
export function generateSlug(title: string): string {
  const prefix = kebabify(title) || "proposal";
  const suffix = randomBase62(12);
  return `${prefix}-${suffix}`;
}

/**
 * Generate a slug guaranteed to be unique given a collision-check function.
 * Retries up to `maxAttempts` times (practically, collisions are negligible
 * at 71 bits of entropy, but we handle it for correctness).
 */
export async function generateUniqueSlug(
  title: string,
  isSlugTaken: (slug: string) => Promise<boolean>,
  maxAttempts = 5
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const slug = generateSlug(title);
    if (!(await isSlugTaken(slug))) return slug;
  }
  throw new Error(
    `Failed to generate a unique slug after ${maxAttempts} attempts`
  );
}
