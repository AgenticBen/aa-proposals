import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { Document as DocType, Version, Section } from "@/lib/types";

// ---------------------------------------------------------------------------
// Design tokens matching the in-app look
// ---------------------------------------------------------------------------

const NAVY = "#002139";
const CHARCOAL = "#495050";
const ICY = "#9DE2F2";
const WHITE = "#FFFFFF";
const LINE = "rgba(0,33,57,0.1)";

const S = StyleSheet.create({
  page: {
    paddingTop: 0,
    paddingHorizontal: 0,
    paddingBottom: 56,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: CHARCOAL,
    backgroundColor: WHITE,
  },

  // ── Cover band ──────────────────────────────────────────────────────────
  coverBand: {
    backgroundColor: NAVY,
    paddingHorizontal: 56,
    paddingTop: 40,
    paddingBottom: 36,
    minHeight: 160,
  },
  coverWordmark: {
    fontSize: 9,
    color: "#51ADDF",
    fontFamily: "Helvetica",
    marginBottom: 28,
    letterSpacing: 0.5,
  },
  coverEyebrow: {
    color: "#2CCBE6",
    fontSize: 7,
    letterSpacing: 2.5,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  coverTitle: {
    color: WHITE,
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    lineHeight: 1.1,
    maxWidth: 380,
  },
  coverMeta: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    marginTop: 14,
  },

  // ── Body ─────────────────────────────────────────────────────────────────
  bodyArea: {
    paddingHorizontal: 56,
    paddingTop: 32,
  },
  sectionContainer: {
    marginBottom: 28,
  },
  sectionHeading: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    marginBottom: 8,
  },
  sectionDivider: {
    borderBottomColor: LINE,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 10.5,
    lineHeight: 1.65,
    color: CHARCOAL,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  bulletDot: {
    fontSize: 10.5,
    color: ICY,
    width: 14,
    marginTop: 0,
  },
  bulletText: {
    fontSize: 10.5,
    lineHeight: 1.6,
    color: CHARCOAL,
    flex: 1,
  },

  // ── Footer ───────────────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 18,
    left: 56,
    right: 56,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopColor: LINE,
    borderTopWidth: 1,
    paddingTop: 8,
  },
  footerBrand: {
    fontSize: 7.5,
    color: "rgba(73,80,80,0.6)",
  },
  footerDraft: {
    fontSize: 7.5,
    color: "#CC4444",
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
  },
  footerPage: {
    fontSize: 7.5,
    color: "rgba(73,80,80,0.6)",
  },
});

// ---------------------------------------------------------------------------
// Markdown → structured plain text with basic bullet parsing
// ---------------------------------------------------------------------------

interface TextBlock {
  type: "paragraph" | "bullet";
  text: string;
}

function parseMarkdown(md: string): TextBlock[] {
  const blocks: TextBlock[] = [];
  const lines = md
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`(.+?)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/~~(.+?)~~/g, "$1")
    .replace(/^\s*>\s+/gm, "")
    .replace(/^---+$/gm, "")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .split("\n");

  let para = "";

  const flushPara = () => {
    const t = para.trim();
    if (t) blocks.push({ type: "paragraph", text: t });
    para = "";
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const bulletMatch = line.match(/^\s*[-*+]\s+(.*)/);
    if (bulletMatch) {
      flushPara();
      blocks.push({ type: "bullet", text: bulletMatch[1].trim() });
    } else if (line === "") {
      flushPara();
    } else {
      para += (para ? " " : "") + line.trim();
    }
  }
  flushPara();
  return blocks;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function DraftProposalDocument({
  doc,
  version,
  clientOrg,
}: {
  doc: DocType;
  version: Version;
  clientOrg?: string;
}) {
  const sorted = [...(version.sections as Section[])].sort(
    (a, b) => a.order - b.order
  );

  const preparedDate = new Date(doc.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <Document>
      <Page size="LETTER" style={S.page}>
        {/* ── Cover band ── */}
        <View style={S.coverBand}>
          <Text style={S.coverWordmark}>AGENTIC ARC</Text>
          <Text style={S.coverEyebrow}>PROPOSAL</Text>
          <Text style={S.coverTitle}>{doc.title}</Text>
          <Text style={S.coverMeta}>
            {clientOrg ? `Prepared for ${clientOrg} · ` : ""}{preparedDate}
          </Text>
        </View>

        {/* ── Section content ── */}
        <View style={S.bodyArea}>
          {sorted.map((section) => {
            const blocks = parseMarkdown(section.body_md);
            return (
              <View key={section.id} style={S.sectionContainer} wrap={false}>
                <Text style={S.sectionHeading}>{section.heading}</Text>
                <View style={S.sectionDivider} />
                {blocks.map((block, i) =>
                  block.type === "bullet" ? (
                    <View key={i} style={S.bulletRow}>
                      <Text style={S.bulletDot}>·</Text>
                      <Text style={S.bulletText}>{block.text}</Text>
                    </View>
                  ) : (
                    <Text key={i} style={[S.sectionBody, { marginBottom: 6 }]}>
                      {block.text}
                    </Text>
                  )
                )}
              </View>
            );
          })}
        </View>

        {/* ── Footer — fixed on every page ── */}
        <View style={S.footer} fixed>
          <Text style={S.footerBrand}>Agentic Arc — Proposals</Text>
          <Text style={S.footerDraft}>DRAFT — NOT EXECUTED</Text>
          <Text
            style={S.footerPage}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}

// ---------------------------------------------------------------------------
// Server-side render helper
// ---------------------------------------------------------------------------

export async function renderDraftPDF(
  doc: DocType,
  version: Version,
  clientOrg?: string
): Promise<Buffer> {
  return renderToBuffer(
    <DraftProposalDocument doc={doc} version={version} clientOrg={clientOrg} />
  );
}
