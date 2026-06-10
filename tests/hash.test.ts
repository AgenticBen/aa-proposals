import { describe, it, expect } from "vitest";
import { canonicalizeSections, hashSections } from "@/lib/utils/hash";
import type { Section } from "@/lib/utils/hash";

const SECTION_A: Section = {
  id: "sec-001",
  heading: "Engagement Overview",
  body_md: "Thank you for the opportunity.",
  order: 0,
};

const SECTION_B: Section = {
  id: "sec-002",
  heading: "Scope of Work",
  body_md: "Three workstreams.",
  order: 1,
};

describe("canonicalizeSections", () => {
  it("produces a valid JSON string", () => {
    const result = canonicalizeSections([SECTION_A]);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it("is stable regardless of input array order", () => {
    const a = canonicalizeSections([SECTION_A, SECTION_B]);
    const b = canonicalizeSections([SECTION_B, SECTION_A]);
    expect(a).toBe(b);
  });

  it("serializes section keys in alphabetical order", () => {
    const result = canonicalizeSections([SECTION_A]);
    const parsed = JSON.parse(result);
    const keys = Object.keys(parsed[0]);
    expect(keys).toEqual(["body_md", "heading", "id", "order"]);
  });

  it("changes when body content changes", () => {
    const modified = { ...SECTION_A, body_md: "Different content." };
    const original = canonicalizeSections([SECTION_A]);
    const changed = canonicalizeSections([modified]);
    expect(original).not.toBe(changed);
  });

  it("handles empty array", () => {
    expect(canonicalizeSections([])).toBe("[]");
  });
});

describe("hashSections", () => {
  it("returns a 64-character hex string (SHA-256)", () => {
    const hash = hashSections([SECTION_A]);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic for the same input", () => {
    expect(hashSections([SECTION_A, SECTION_B])).toBe(
      hashSections([SECTION_A, SECTION_B])
    );
  });

  it("is order-invariant (same as canonicalization)", () => {
    expect(hashSections([SECTION_A, SECTION_B])).toBe(
      hashSections([SECTION_B, SECTION_A])
    );
  });

  it("produces different hashes for different content", () => {
    const modified = { ...SECTION_A, body_md: "Completely different." };
    expect(hashSections([SECTION_A])).not.toBe(hashSections([modified]));
  });

  it("produces different hashes for different headings", () => {
    const modified = { ...SECTION_A, heading: "Different Heading" };
    expect(hashSections([SECTION_A])).not.toBe(hashSections([modified]));
  });
});
