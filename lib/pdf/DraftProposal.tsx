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
// Styles
// ---------------------------------------------------------------------------

const S = StyleSheet.create({
  page: {
    paddingTop: 0,
    paddingHorizontal: 0,
    paddingBottom: 64,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#495050",
  },
  headerBand: {
    backgroundColor: "#002139",
    paddingHorizontal: 56,
    paddingTop: 36,
    paddingBottom: 28,
  },
  eyebrow: {
    color: "#9DE2F2",
    fontSize: 7,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  docTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
  },
  bodyArea: {
    paddingHorizontal: 56,
    paddingTop: 28,
  },
  sectionContainer: {
    marginBottom: 22,
  },
  sectionHeading: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#002139",
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomColor: "#E6E3E2",
    borderBottomWidth: 1,
  },
  sectionBody: {
    fontSize: 10,
    lineHeight: 1.65,
    color: "#495050",
  },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 56,
    right: 56,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopColor: "#E6E3E2",
    borderTopWidth: 1,
    paddingTop: 8,
  },
  footerBrand: {
    fontSize: 8,
    color: "#495050",
  },
  footerDraft: {
    fontSize: 8,
    color: "#CC3333",
    fontFamily: "Helvetica-Bold",
  },
  footerPage: {
    fontSize: 8,
    color: "#495050",
  },
});

// ---------------------------------------------------------------------------
// Markdown → plain text for PDF rendering
// ---------------------------------------------------------------------------

function stripMarkdown(md: string): string {
  return md
    .replace(/^```[\s\S]*?^```/gm, "")   // fenced code blocks
    .replace(/`(.+?)`/g, "$1")            // inline code
    .replace(/^#{1,6}\s+/gm, "")          // headings
    .replace(/\*\*(.+?)\*\*/g, "$1")      // bold
    .replace(/\*(.+?)\*/g, "$1")          // italic
    .replace(/~~(.+?)~~/g, "$1")          // strikethrough
    .replace(/^\s*[-*+]\s+/gm, "\u2022 ") // unordered list → bullet
    .replace(/^\s*>\s+/gm, "")            // blockquotes
    .replace(/^---+$/gm, "")              // horizontal rules
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")   // links
    .replace(/\n{3,}/g, "\n\n")           // collapse excess blank lines
    .trim();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function DraftProposalDocument({
  doc,
  version,
}: {
  doc: DocType;
  version: Version;
}) {
  const sorted = [...(version.sections as Section[])].sort(
    (a, b) => a.order - b.order
  );

  return (
    <Document>
      <Page size="LETTER" style={S.page}>
        {/* Navy header band */}
        <View style={S.headerBand}>
          <Text style={S.eyebrow}>Agentic Arc — Proposal</Text>
          <Text style={S.docTitle}>{doc.title}</Text>
        </View>

        {/* Section content */}
        <View style={S.bodyArea}>
          {sorted.map((section) => (
            <View key={section.id} style={S.sectionContainer} wrap={false}>
              <Text style={S.sectionHeading}>{section.heading}</Text>
              <Text style={S.sectionBody}>{stripMarkdown(section.body_md)}</Text>
            </View>
          ))}
        </View>

        {/* Footer — fixed on every page */}
        <View style={S.footer} fixed>
          <Text style={S.footerBrand}>Agentic Arc — Proposals</Text>
          <Text style={S.footerDraft}>DRAFT — not executed</Text>
          <Text
            style={S.footerPage}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

// ---------------------------------------------------------------------------
// Server-side render helper (called from route handler)
// ---------------------------------------------------------------------------

export async function renderDraftPDF(
  doc: DocType,
  version: Version
): Promise<Buffer> {
  return renderToBuffer(
    <DraftProposalDocument doc={doc} version={version} />
  );
}
