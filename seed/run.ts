/**
 * Seed script — creates deterministic dev/test data.
 * Run with: npm run seed
 *
 * Idempotent: deletes seed clients (by known email) first, then recreates.
 * The cascade delete removes all child rows automatically.
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";
import { markdownToSections } from "../lib/utils/markdown-to-sections";
import { hashSections } from "../lib/utils/hash";
import { generateSlug } from "../lib/utils/slug";

// ---------------------------------------------------------------------------
// Supabase service-role client (bypasses RLS)
// ---------------------------------------------------------------------------
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ---------------------------------------------------------------------------
// Tiny assets used for the "signed" document
// ---------------------------------------------------------------------------

// 1×1 transparent PNG
const FAKE_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQ" +
    "AABjkB6QAAAABJRU5ErkJggg==",
  "base64"
);

// Minimal valid PDF (single blank page)
const FAKE_PDF = Buffer.from(
  "%PDF-1.1\n" +
    "1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n" +
    "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n" +
    "3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\n" +
    "xref\n0 4\n" +
    "0000000000 65535 f \n" +
    "0000000009 00000 n \n" +
    "0000000052 00000 n \n" +
    "0000000101 00000 n \n" +
    "trailer<</Size 4/Root 1 0 R>>\n" +
    "startxref\n170\n%%EOF\n",
  "utf8"
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(msg: string) {
  process.stdout.write(`[seed] ${msg}\n`);
}

async function uploadOrReplace(
  bucket: string,
  path: string,
  data: Buffer,
  contentType: string
) {
  // Remove first (upsert not available for all bucket types)
  await supabase.storage.from(bucket).remove([path]);
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, data, { contentType });
  if (error) throw new Error(`Storage upload failed (${bucket}/${path}): ${error.message}`);
}

// ---------------------------------------------------------------------------
// Seed data definitions
// ---------------------------------------------------------------------------

const SEED_CLIENTS = [
  {
    name: "Elena Rodriguez",
    organization: "Healing Hands Wellness Studio",
    email: "elena@healinghands-seed.local",
    notes: "Wellness studio owner; interested in scheduling + intake AI.",
  },
  {
    name: "Marcus Chen",
    organization: "Northfield Digital Agency",
    email: "marcus@northfield-seed.local",
    notes: "Digital agency; looking for AI content workflow automation.",
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  log("Starting seed run...");

  // 1. Idempotency: delete existing seed clients (cascades to all child rows)
  log("Cleaning up previous seed data...");
  for (const c of SEED_CLIENTS) {
    const { data: existing } = await supabase
      .from("clients")
      .select("id")
      .eq("email", c.email)
      .maybeSingle();

    if (existing) {
      // Delete documents manually first (FK restrict on signatures prevents cascade)
      const { data: docs } = await supabase
        .from("documents")
        .select("id")
        .eq("client_id", existing.id);

      for (const doc of docs ?? []) {
        // Delete signatures first (references documents with ON DELETE RESTRICT)
        await supabase.from("signatures").delete().eq("document_id", doc.id);
      }

      // Now delete client (cascades to documents → versions, comments, access_log)
      await supabase.from("clients").delete().eq("id", existing.id);
      log(`  Deleted existing seed client: ${c.email}`);
    }
  }

  // 2. Create clients
  log("Creating clients...");
  const { data: clients, error: clientErr } = await supabase
    .from("clients")
    .insert(SEED_CLIENTS)
    .select("id, email");
  if (clientErr || !clients) throw new Error(`Client insert failed: ${clientErr?.message}`);

  const elena = clients.find((c) => c.email === "elena@healinghands-seed.local")!;
  const marcus = clients.find((c) => c.email === "marcus@northfield-seed.local")!;

  // 3. Load sample proposal sections
  const sampleMd = readFileSync(join(process.cwd(), "seed/sample-proposal.md"), "utf8");
  const sampleSections = markdownToSections(sampleMd);
  log(`  Parsed ${sampleSections.length} sections from sample proposal`);

  // 4. Document A — DRAFT (Elena, Healing Hands)
  log("Creating DRAFT document...");
  const slugDraft = generateSlug("AI Strategy Healing Hands DRAFT");
  const { data: docDraft, error: ddErr } = await supabase
    .from("documents")
    .insert({
      client_id: elena.id,
      title: "AI Strategy & Implementation — Healing Hands Wellness Studio",
      slug: slugDraft,
      status: "draft",
      signer_name_expected: "Elena Rodriguez",
      signer_email: "elena@healinghands-seed.local",
    })
    .select("id")
    .single();
  if (ddErr || !docDraft) throw new Error(`Draft doc insert failed: ${ddErr?.message}`);

  await supabase.from("versions").insert({
    document_id: docDraft.id,
    version_number: 1,
    sections: sampleSections,
    visible_to_client: false,
    note: "Initial draft",
  });
  log(`  Draft doc ID: ${docDraft.id} | slug: ${slugDraft}`);

  // 5. Document B — LIVE (Marcus, Northfield)
  log("Creating LIVE document...");
  const slugLive = generateSlug("AI Customer Journey Northfield Digital");
  const { data: docLive, error: dlErr } = await supabase
    .from("documents")
    .insert({
      client_id: marcus.id,
      title: "AI-Powered Customer Journey Mapping — Northfield Digital Agency",
      slug: slugLive,
      status: "live",
      signer_name_expected: "Marcus Chen",
      signer_email: "marcus@northfield-seed.local",
    })
    .select("id")
    .single();
  if (dlErr || !docLive) throw new Error(`Live doc insert failed: ${dlErr?.message}`);

  await supabase.from("versions").insert([
    {
      document_id: docLive.id,
      version_number: 1,
      sections: sampleSections,
      visible_to_client: false,
      note: "Initial draft",
    },
    {
      document_id: docLive.id,
      version_number: 2,
      sections: sampleSections,
      visible_to_client: true,
      note: "Post-discovery revisions",
    },
  ]);

  // Seed a comment on the live doc
  const { data: liveVersions } = await supabase
    .from("versions")
    .select("id")
    .eq("document_id", docLive.id)
    .eq("version_number", 2)
    .single();

  if (liveVersions && sampleSections.length > 0) {
    await supabase.from("comments").insert({
      document_id: docLive.id,
      version_id: liveVersions.id,
      section_id: sampleSections[1]?.id ?? sampleSections[0].id,
      author_name: "Marcus Chen",
      body: "Can we expand on the timeline for Workstream 2? My team needs at least 3 weeks of runway.",
      resolved: false,
    });
  }

  // Seed an access log entry
  await supabase.from("access_log").insert({
    document_id: docLive.id,
    name_entered: "Marcus Chen",
    ip: "203.0.113.42",
    user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Seed/1.0",
    visited_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  });

  log(`  Live doc ID: ${docLive.id} | slug: ${slugLive}`);

  // 6. Document C — SIGNED (Elena, second engagement)
  log("Creating SIGNED document...");
  const slugSigned = generateSlug("Signed AI Implementation Healing Hands");

  // The frozen section snapshot
  const frozenSections = sampleSections.map((s, i) => ({
    ...s,
    // Simulate that this version was signed on a slightly older copy
    body_md: i === 0 ? s.body_md + "\n\n*[Signed version — no further edits permitted.]*" : s.body_md,
  }));
  const contentHash = hashSections(frozenSections);

  const { data: docSigned, error: dsErr } = await supabase
    .from("documents")
    .insert({
      client_id: elena.id,
      title: "AI Workflow Automation — Healing Hands Phase 2",
      slug: slugSigned,
      status: "signed",
      signer_name_expected: "Elena Rodriguez",
      signer_email: "elena@healinghands-seed.local",
    })
    .select("id")
    .single();
  if (dsErr || !docSigned) throw new Error(`Signed doc insert failed: ${dsErr?.message}`);

  const { data: signedVersion, error: svErr } = await supabase
    .from("versions")
    .insert({
      document_id: docSigned.id,
      version_number: 1,
      sections: frozenSections,
      visible_to_client: true,
      note: "Final signed version",
    })
    .select("id")
    .single();
  if (svErr || !signedVersion) throw new Error(`Signed version insert failed: ${svErr?.message}`);

  // Upload fake signature PNG
  const sigPngPath = `${docSigned.id}/signature.png`;
  await uploadOrReplace("signatures", sigPngPath, FAKE_PNG, "image/png");
  log("  Uploaded fake signature PNG");

  // Upload fake executed PDF
  const pdfPath = `${docSigned.id}/executed.pdf`;
  await uploadOrReplace("executed-pdfs", pdfPath, FAKE_PDF, "application/pdf");
  log("  Uploaded fake executed PDF");

  // Insert signature row
  const signedAt = new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(); // 3 days ago
  await supabase.from("signatures").insert({
    document_id: docSigned.id,
    version_id: signedVersion.id,
    signer_name: "Elena Rodriguez",
    signer_email: "elena@healinghands-seed.local",
    signature_png: sigPngPath,
    ink_color: "blue",
    consent_text:
      "I agree to conduct this transaction electronically, and I intend the signature below to be the legal equivalent of my handwritten signature.",
    content_hash: contentHash,
    ip: "198.51.100.17",
    user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Seed/1.0",
    signed_at: signedAt,
    executed_pdf: pdfPath,
  });

  // Seed a resolved comment on the signed doc
  await supabase.from("comments").insert({
    document_id: docSigned.id,
    version_id: signedVersion.id,
    section_id: sampleSections[2]?.id ?? sampleSections[0].id,
    author_name: "Elena Rodriguez",
    body: "The investment section looks correct. Confirming the 50/50 payment split is fine.",
    resolved: true,
  });

  // Seed an access log entry
  await supabase.from("access_log").insert([
    {
      document_id: docSigned.id,
      name_entered: "Elena Rodriguez",
      ip: "198.51.100.17",
      user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Seed/1.0",
      visited_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    },
    {
      document_id: docSigned.id,
      name_entered: "Elena Rodriguez",
      ip: "198.51.100.18",
      user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Seed/1.0",
      visited_at: signedAt,
    },
  ]);

  log(`  Signed doc ID: ${docSigned.id} | slug: ${slugSigned}`);
  log(`  Content hash: ${contentHash}`);

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  log("\nSeed complete!");
  log(`  Clients: ${SEED_CLIENTS.length}`);
  log("  Documents:");
  log(`    DRAFT  → /p/${slugDraft}`);
  log(`    LIVE   → /p/${slugLive}`);
  log(`    SIGNED → /p/${slugSigned}`);
  log("\nRun 'npm run seed' again at any time to reset to this state.\n");
}

main().catch((err) => {
  console.error("[seed] FATAL:", err.message);
  process.exit(1);
});
