import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { Document as DocType, Section, Signature } from "@/lib/types";

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
  // ── Execution page ──
  executionArea: {
    paddingHorizontal: 56,
    paddingTop: 36,
  },
  executionHeading: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#002139",
    marginBottom: 18,
  },
  signatureBox: {
    borderColor: "#E6E3E2",
    borderWidth: 1,
    borderRadius: 6,
    padding: 18,
    marginBottom: 24,
  },
  signatureImage: {
    width: 220,
    height: 88,
    objectFit: "contain",
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  signatureRule: {
    borderTopColor: "#495050",
    borderTopWidth: 1,
    width: 260,
    marginBottom: 6,
  },
  signerLine: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#002139",
  },
  signerSub: {
    fontSize: 9,
    color: "#495050",
    marginTop: 2,
  },
  auditHeading: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#002139",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  auditTable: {
    borderColor: "#E6E3E2",
    borderWidth: 1,
    borderRadius: 6,
    padding: 14,
  },
  auditRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  auditLabel: {
    width: 110,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#495050",
    textTransform: "uppercase",
  },
  auditValue: {
    flex: 1,
    fontSize: 8.5,
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
  footerExecuted: {
    fontSize: 8,
    color: "#002139",
    fontFamily: "Helvetica-Bold",
  },
  footerPage: {
    fontSize: 8,
    color: "#495050",
  },
});

// ---------------------------------------------------------------------------
// Markdown → plain text (same rules as DraftProposal)
// ---------------------------------------------------------------------------

function stripMarkdown(md: string): string {
  return md
    .replace(/^```[\s\S]*?^```/gm, "")   // fenced code blocks
    .replace(/`(.+?)`/g, "$1")            // inline code
    .replace(/^#{1,6}\s+/gm, "")          // headings
    .replace(/\*\*(.+?)\*\*/g, "$1")      // bold
    .replace(/\*(.+?)\*/g, "$1")          // italic
    .replace(/~~(.+?)~~/g, "$1")          // strikethrough
    .replace(/^\s*[-*+]\s+/gm, "• ") // unordered list → bullet
    .replace(/^\s*>\s+/gm, "")            // blockquotes
    .replace(/^---+$/gm, "")              // horizontal rules
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")   // links
    .replace(/\n{3,}/g, "\n\n")           // collapse excess blank lines
    .trim();
}

function formatEasternTime(iso: string): string {
  return (
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date(iso)) + " ET"
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const INK_LABEL: Record<string, string> = {
  black: "Black ink",
  blue: "Blue ink",
  red: "Red ink",
};

function ExecutedProposalDocument({
  doc,
  frozenSections,
  signature,
  signaturePngDataUrl,
}: {
  doc: DocType;
  frozenSections: Section[];
  signature: Signature;
  signaturePngDataUrl: string;
}) {
  const sorted = [...frozenSections].sort((a, b) => a.order - b.order);

  return (
    <Document>
      <Page size="LETTER" style={S.page}>
        {/* Navy header band */}
        <View style={S.headerBand}>
          <Text style={S.eyebrow}>Agentic Arc — Executed Proposal</Text>
          <Text style={S.docTitle}>{doc.title}</Text>
        </View>

        {/* Frozen section content */}
        <View style={S.bodyArea}>
          {sorted.map((section) => (
            <View key={section.id} style={S.sectionContainer} wrap={false}>
              <Text style={S.sectionHeading}>{section.heading}</Text>
              <Text style={S.sectionBody}>{stripMarkdown(section.body_md)}</Text>
            </View>
          ))}
        </View>

        {/* Execution + audit block — always starts on its own final page */}
        <View style={S.executionArea} break>
          <Text style={S.executionHeading}>Execution</Text>

          <View style={S.signatureBox}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf Image has no alt prop */}
            <Image style={S.signatureImage} src={signaturePngDataUrl} />
            <View style={S.signatureRule} />
            <Text style={S.signerLine}>{signature.signer_name}</Text>
            <Text style={S.signerSub}>
              {signature.signer_email} · Signed {formatEasternTime(signature.signed_at)} ·{" "}
              {INK_LABEL[signature.ink_color] ?? signature.ink_color}
            </Text>
          </View>

          <Text style={S.auditHeading}>Audit Record</Text>
          <View style={S.auditTable}>
            <View style={S.auditRow}>
              <Text style={S.auditLabel}>Signer name</Text>
              <Text style={S.auditValue}>{signature.signer_name}</Text>
            </View>
            <View style={S.auditRow}>
              <Text style={S.auditLabel}>Signer email</Text>
              <Text style={S.auditValue}>{signature.signer_email}</Text>
            </View>
            <View style={S.auditRow}>
              <Text style={S.auditLabel}>Signed at</Text>
              <Text style={S.auditValue}>{formatEasternTime(signature.signed_at)}</Text>
            </View>
            <View style={S.auditRow}>
              <Text style={S.auditLabel}>IP address</Text>
              <Text style={S.auditValue}>{signature.ip ?? "Not recorded"}</Text>
            </View>
            <View style={S.auditRow}>
              <Text style={S.auditLabel}>Content hash</Text>
              <Text style={S.auditValue}>SHA-256: {signature.content_hash}</Text>
            </View>
            <View style={S.auditRow}>
              <Text style={S.auditLabel}>Document</Text>
              <Text style={S.auditValue}>{doc.slug}</Text>
            </View>
            <View style={S.auditRow}>
              <Text style={S.auditLabel}>Consent</Text>
              <Text style={S.auditValue}>&ldquo;{signature.consent_text}&rdquo;</Text>
            </View>
          </View>
        </View>

        {/* Footer — fixed on every page */}
        <View style={S.footer} fixed>
          <Text style={S.footerBrand}>Agentic Arc — Proposals</Text>
          <Text style={S.footerExecuted}>EXECUTED</Text>
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
// Server-side render helper
// ---------------------------------------------------------------------------

/**
 * Render the executed PDF from the FROZEN snapshot only (Non-Negotiable #1).
 * Callers must pass the sections of the version referenced by
 * signature.version_id — never live/current content.
 */
export async function renderExecutedPDF(
  doc: DocType,
  frozenSections: Section[],
  signature: Signature,
  signaturePng: Buffer
): Promise<Buffer> {
  const signaturePngDataUrl = `data:image/png;base64,${signaturePng.toString("base64")}`;
  return renderToBuffer(
    <ExecutedProposalDocument
      doc={doc}
      frozenSections={frozenSections}
      signature={signature}
      signaturePngDataUrl={signaturePngDataUrl}
    />
  );
}
