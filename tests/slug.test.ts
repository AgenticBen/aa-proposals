import { describe, it, expect } from "vitest";
import { randomBase62, kebabify, generateSlug, generateUniqueSlug } from "@/lib/utils/slug";

describe("randomBase62", () => {
  it("returns the requested length", () => {
    expect(randomBase62(12)).toHaveLength(12);
    expect(randomBase62(1)).toHaveLength(1);
    expect(randomBase62(24)).toHaveLength(24);
  });

  it("only contains base62 characters", () => {
    const result = randomBase62(200);
    expect(result).toMatch(/^[A-Za-z0-9]+$/);
  });

  it("produces different values on successive calls", () => {
    const a = randomBase62(12);
    const b = randomBase62(12);
    // Probability of collision at 71 bits is negligible
    expect(a).not.toBe(b);
  });
});

describe("kebabify", () => {
  it("lowercases and replaces spaces with dashes", () => {
    expect(kebabify("Hello World")).toBe("hello-world");
  });

  it("strips special characters", () => {
    expect(kebabify("Healing Hands AI Academy")).toBe("healing-hands-ai-academy");
  });

  it("collapses multiple non-alphanumeric chars to a single dash", () => {
    expect(kebabify("A -- B")).toBe("a-b");
  });

  it("strips accented characters", () => {
    expect(kebabify("Café au Lait")).toBe("cafe-au-lait");
  });

  it("trims leading and trailing dashes", () => {
    expect(kebabify("--hello--")).toBe("hello");
  });

  it("caps at 60 characters", () => {
    const long = "a".repeat(100);
    expect(kebabify(long).length).toBeLessThanOrEqual(60);
  });

  it("falls through to empty string on all-symbol input", () => {
    expect(kebabify("!!!")).toBe("");
  });
});

describe("generateSlug", () => {
  it("returns a string with kebab prefix and 12-char suffix separated by dash", () => {
    const slug = generateSlug("Healing Hands AI Academy");
    // prefix-XXXXXXXXXXXX
    expect(slug).toMatch(/^[a-z0-9-]+-[A-Za-z0-9]{12}$/);
  });

  it("two calls produce different slugs", () => {
    const a = generateSlug("Same Title");
    const b = generateSlug("Same Title");
    expect(a).not.toBe(b);
  });

  it("uses 'proposal' as prefix fallback for symbol-only titles", () => {
    const slug = generateSlug("!!!");
    expect(slug).toMatch(/^proposal-[A-Za-z0-9]{12}$/);
  });
});

describe("generateUniqueSlug", () => {
  it("returns a slug immediately when not taken", async () => {
    const slug = await generateUniqueSlug("Test Title", async () => false);
    expect(slug).toMatch(/^[a-z0-9-]+-[A-Za-z0-9]{12}$/);
  });

  it("retries when first slug is taken", async () => {
    let calls = 0;
    const isSlugTaken = async () => {
      calls++;
      return calls < 3; // taken for the first 2 attempts
    };
    const slug = await generateUniqueSlug("Retry Test", isSlugTaken);
    expect(slug).toBeTruthy();
    expect(calls).toBe(3);
  });

  it("throws after maxAttempts exhausted", async () => {
    await expect(
      generateUniqueSlug("Always Taken", async () => true, 3)
    ).rejects.toThrow("Failed to generate a unique slug after 3 attempts");
  });
});
