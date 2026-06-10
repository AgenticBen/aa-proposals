import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Gating logic
// ---------------------------------------------------------------------------

function isDocAccessible(status: string | null): boolean {
  return status === "live" || status === "signed";
}

describe("client view gating", () => {
  it("allows live documents", () => {
    expect(isDocAccessible("live")).toBe(true);
  });
  it("allows signed documents (read-only view)", () => {
    expect(isDocAccessible("signed")).toBe(true);
  });
  it("blocks draft documents", () => {
    expect(isDocAccessible("draft")).toBe(false);
  });
  it("blocks archived documents", () => {
    expect(isDocAccessible("archived")).toBe(false);
  });
  it("blocks null (unknown slug)", () => {
    expect(isDocAccessible(null)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Version resolution
// ---------------------------------------------------------------------------

interface VersionStub {
  id: string;
  version_number: number;
}

function resolveVersion(
  versions: VersionStub[],
  vParam: string | undefined
): { viewed: VersionStub; isOld: boolean } {
  // versions sorted newest-first
  const current = versions[0];
  if (!vParam) return { viewed: current, isOld: false };
  const requested = parseInt(vParam, 10);
  const found = versions.find((v) => v.version_number === requested);
  if (!found || found.id === current.id) return { viewed: current, isOld: false };
  return { viewed: found, isOld: true };
}

describe("version resolution", () => {
  const versions: VersionStub[] = [
    { id: "v3", version_number: 3 },
    { id: "v2", version_number: 2 },
    { id: "v1", version_number: 1 },
  ];

  it("returns current version when no param", () => {
    const { viewed, isOld } = resolveVersion(versions, undefined);
    expect(viewed.id).toBe("v3");
    expect(isOld).toBe(false);
  });

  it("returns current version when param matches current", () => {
    const { viewed, isOld } = resolveVersion(versions, "3");
    expect(viewed.id).toBe("v3");
    expect(isOld).toBe(false);
  });

  it("returns old version when param is older visible version", () => {
    const { viewed, isOld } = resolveVersion(versions, "2");
    expect(viewed.id).toBe("v2");
    expect(isOld).toBe(true);
  });

  it("falls back to current for non-existent version param", () => {
    const { viewed, isOld } = resolveVersion(versions, "99");
    expect(viewed.id).toBe("v3");
    expect(isOld).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Comment autosave debounce logic (pure timer logic, no network)
// ---------------------------------------------------------------------------

function makeDebouncer(delayMs: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const calls: string[] = [];

  return {
    trigger(value: string) {
      if (timer) clearTimeout(timer);
      if (value.trim()) {
        timer = setTimeout(() => {
          calls.push(value);
          timer = null;
        }, delayMs);
      }
    },
    getCalls() {
      return [...calls];
    },
  };
}

describe("comment autosave debounce", () => {
  it("does not fire immediately on keystroke", () => {
    const d = makeDebouncer(800);
    d.trigger("hello");
    expect(d.getCalls()).toHaveLength(0);
  });

  it("fires once after quiet period when multiple keystrokes happen", async () => {
    const d = makeDebouncer(50); // short delay for testing
    d.trigger("h");
    d.trigger("he");
    d.trigger("hel");
    await new Promise((r) => setTimeout(r, 100));
    expect(d.getCalls()).toHaveLength(1);
    expect(d.getCalls()[0]).toBe("hel");
  });

  it("does not fire for blank/whitespace-only input", async () => {
    const d = makeDebouncer(50);
    d.trigger("   ");
    await new Promise((r) => setTimeout(r, 100));
    expect(d.getCalls()).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Markdown strip (used in PDF generation)
// ---------------------------------------------------------------------------

function stripMarkdown(md: string): string {
  return md
    .replace(/^```[\s\S]*?^```/gm, "")
    .replace(/`(.+?)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/~~(.+?)~~/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "\u2022 ")
    .replace(/^\s*>\s+/gm, "")
    .replace(/^---+$/gm, "")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

describe("PDF markdown strip", () => {
  it("removes heading markers", () => {
    expect(stripMarkdown("## Scope of Work")).toBe("Scope of Work");
  });
  it("removes bold markers", () => {
    expect(stripMarkdown("This is **important**")).toBe("This is important");
  });
  it("converts unordered list to bullet", () => {
    expect(stripMarkdown("- item one")).toBe("\u2022 item one");
  });
  it("strips links, keeping text", () => {
    expect(stripMarkdown("[Google](https://google.com)")).toBe("Google");
  });
  it("strips blockquote marker", () => {
    expect(stripMarkdown("> a quote")).toBe("a quote");
  });
});
