import { randomUUID } from "crypto";
import type { Section } from "./hash";

/**
 * Parse a markdown string into an array of Section objects by splitting on
 * level-2 headings (`## Heading`).
 *
 * Rules:
 * - Content before the first `##` is discarded (it's typically the doc title).
 * - Each `##` starts a new section. The heading text is trimmed.
 * - The body is the trimmed text between this heading and the next one.
 * - Empty sections (blank body after trim) are kept; callers may filter.
 * - IDs are generated as UUIDs so each import is independent.
 * - `order` is 0-indexed, incrementing per section.
 */
export function markdownToSections(markdown: string): Section[] {
  const lines = markdown.split("\n");
  const sections: Section[] = [];
  let currentHeading: string | null = null;
  let bodyLines: string[] = [];

  function flush(order: number) {
    if (currentHeading === null) return;
    sections.push({
      id: randomUUID(),
      heading: currentHeading,
      body_md: bodyLines.join("\n").trim(),
      order,
    });
  }

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+)$/);
    if (headingMatch) {
      flush(sections.length);
      currentHeading = headingMatch[1].trim();
      bodyLines = [];
    } else if (currentHeading !== null) {
      bodyLines.push(line);
    }
    // Lines before the first ## are silently discarded
  }

  // Flush the last section
  flush(sections.length);

  return sections;
}
