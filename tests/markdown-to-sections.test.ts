import { describe, it, expect } from "vitest";
import { markdownToSections } from "@/lib/utils/markdown-to-sections";

describe("markdownToSections", () => {
  it("splits a typical proposal into sections", () => {
    const md = `
# Title (discarded)

## Section One
Body of section one.

## Section Two
Body of section two.
    `.trim();

    const sections = markdownToSections(md);
    expect(sections).toHaveLength(2);
    expect(sections[0].heading).toBe("Section One");
    expect(sections[0].body_md).toContain("Body of section one.");
    expect(sections[0].order).toBe(0);
    expect(sections[1].heading).toBe("Section Two");
    expect(sections[1].order).toBe(1);
  });

  it("discards content before the first ## heading", () => {
    const md = `
Some preamble text here.

More preamble.

## First Section
Content here.
    `.trim();

    const sections = markdownToSections(md);
    expect(sections).toHaveLength(1);
    expect(sections[0].heading).toBe("First Section");
  });

  it("gives each section a unique UUID id", () => {
    const md = `
## A
body a

## B
body b
    `.trim();

    const sections = markdownToSections(md);
    expect(sections[0].id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
    expect(sections[0].id).not.toBe(sections[1].id);
  });

  it("handles empty body sections", () => {
    const md = `
## Empty Section

## Next Section
Has content.
    `.trim();

    const sections = markdownToSections(md);
    expect(sections).toHaveLength(2);
    expect(sections[0].body_md).toBe("");
  });

  it("trims leading and trailing whitespace from section body", () => {
    const md = `
## Padded


Content with surrounding blank lines.


    `.trim();

    const sections = markdownToSections(md);
    expect(sections[0].body_md).toBe("Content with surrounding blank lines.");
  });

  it("returns empty array for markdown with no ## headings", () => {
    const sections = markdownToSections("# Just a title\nSome text.");
    expect(sections).toHaveLength(0);
  });

  it("returns empty array for empty string", () => {
    expect(markdownToSections("")).toHaveLength(0);
  });

  it("assigns sequential order values starting at 0", () => {
    const md = `
## One
a
## Two
b
## Three
c
    `.trim();

    const sections = markdownToSections(md);
    expect(sections.map((s) => s.order)).toEqual([0, 1, 2]);
  });

  it("parses the sample proposal correctly", async () => {
    const { readFileSync } = await import("fs");
    const { join } = await import("path");
    const sampleMd = readFileSync(
      join(process.cwd(), "seed/sample-proposal.md"),
      "utf8"
    );
    const sections = markdownToSections(sampleMd);
    // The sample proposal has multiple ## sections
    expect(sections.length).toBeGreaterThanOrEqual(5);
    expect(sections.every((s) => s.heading.length > 0)).toBe(true);
    expect(sections.every((s) => typeof s.id === "string")).toBe(true);
  });
});
