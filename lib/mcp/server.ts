import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createServerClient } from "@/lib/db/server";
import { generateUniqueSlug } from "@/lib/utils/slug";
import { markdownToSections } from "@/lib/utils/markdown-to-sections";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

const SYSTEM_PROMPT = `You are a senior AI consultant at Agentic Arc AI, a Charlotte, NC firm that helps SMB and mid-market B2B companies adopt practical AI through the ARC Methodology (Assess, Reveal, Chart).

Your job is to write a full proposal in markdown format for a client engagement. The proposal should feel like a calm, premium consulting document: clear, confident, direct. No hype, no vaporware, no AI clichés.

Writing rules:
- Sentence case for all headings and body text
- Active voice, short sentences, one idea per sentence
- Concrete and specific: real numbers, real timelines, real deliverables
- No exclamation points
- No em dashes (use commas or colons instead)
- "You / your business" when addressing the client; "Agentic Arc AI" or "Ben" for the firm
- No filler words like "leverage", "synergy", "cutting-edge", "revolutionary", "supercharge"

Structure your response as markdown with ## headings for each section. Include these sections (adapt names to fit the engagement):

## Overview
## The challenge
## Our approach
## Scope of work
## Timeline
## Investment
## Why Agentic Arc AI
## Next steps

Keep each section to 150-300 words. The Investment section should have a simple markdown table with line items and a total.

Return ONLY the markdown. No preamble, no meta-commentary, no trailing notes.`;

type TextContent = { type: "text"; text: string };
type ToolResult = { content: TextContent[]; isError?: boolean };

function ok(data: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function err(msg: string): ToolResult {
  return { content: [{ type: "text", text: msg }], isError: true };
}

export function createProposalMcpServer(appUrl: string): McpServer {
  const server = new McpServer({
    name: "agentic-arc-proposals",
    version: "1.0.0",
  });

  // ── list_clients ────────────────────────────────────────────────────────────
  server.registerTool(
    "list_clients",
    { description: "List all clients in the Agentic Arc proposal system." },
    async () => {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, organization, email")
        .order("name");
      if (error) return err(error.message);
      return ok(data);
    }
  );

  // ── create_client ───────────────────────────────────────────────────────────
  server.registerTool(
    "create_client",
    {
      description: "Create a new client record.",
      inputSchema: {
        name: z.string().describe("Contact full name"),
        organization: z.string().optional().describe("Company or organization name"),
        email: z.string().optional().describe("Contact email address"),
      },
    },
    async ({ name, organization, email }) => {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from("clients")
        .insert({ name, organization: organization ?? null, email: email ?? null })
        .select("id, name, organization, email")
        .single();
      if (error) return err(error.message);
      return ok(data);
    }
  );

  // ── list_proposals ──────────────────────────────────────────────────────────
  server.registerTool(
    "list_proposals",
    { description: "List all proposals with their current status and shareable client links." },
    async () => {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from("documents")
        .select("id, title, slug, status, created_at, clients(name, organization)")
        .order("created_at", { ascending: false });
      if (error) return err(error.message);
      const result = (data ?? []).map((d) => ({
        id: d.id,
        title: d.title,
        status: d.status,
        client: d.clients,
        client_link: `${appUrl}/p/${d.slug}`,
        created_at: d.created_at,
      }));
      return ok(result);
    }
  );

  // ── create_proposal ─────────────────────────────────────────────────────────
  server.registerTool(
    "create_proposal",
    {
      description:
        "Create a new proposal draft for a client. Returns the proposal ID and shareable link. Use generate_proposal next to fill it with content.",
      inputSchema: {
        client_id: z.string().describe("Client UUID — get this from list_clients"),
        title: z
          .string()
          .describe(
            "Proposal title, e.g. 'AI strategy engagement — Northfield Digital'"
          ),
        signer_name: z
          .string()
          .optional()
          .describe("Pre-fill the expected signer's name"),
        signer_email: z
          .string()
          .optional()
          .describe("Pre-fill the signer's email (receives executed PDF)"),
      },
    },
    async ({ client_id, title, signer_name, signer_email }) => {
      const supabase = createServerClient();
      const slug = await generateUniqueSlug(title, async (s) => {
        const { data } = await supabase
          .from("documents")
          .select("id")
          .eq("slug", s)
          .maybeSingle();
        return !!data;
      });
      const { data, error } = await supabase
        .from("documents")
        .insert({
          client_id,
          title,
          slug,
          status: "draft",
          signer_name_expected: signer_name ?? null,
          signer_email: signer_email ?? null,
        })
        .select("id, title, slug, status")
        .single();
      if (error) return err(error.message);
      return ok({
        id: data.id,
        title: data.title,
        status: data.status,
        client_link: `${appUrl}/p/${data.slug}`,
        admin_link: `${appUrl}/admin/d/${data.id}`,
        next_step: "Call generate_proposal with this document ID to fill it with content.",
      });
    }
  );

  // ── generate_proposal ───────────────────────────────────────────────────────
  server.registerTool(
    "generate_proposal",
    {
      description:
        "Generate full proposal content with Claude AI and save it as a new version. By default the version is saved as a draft (not visible to client) so you can review before publishing.",
      inputSchema: {
        document_id: z
          .string()
          .describe(
            "Proposal ID — from list_proposals or create_proposal"
          ),
        description: z
          .string()
          .describe(
            "What problem are we solving? Describe the engagement in plain language."
          ),
        services: z
          .string()
          .optional()
          .describe(
            "Services or focus areas, e.g. 'Workflow automation, AI agents'"
          ),
        budget_range: z
          .string()
          .optional()
          .describe("Approximate budget, e.g. '$8,000–$12,000'"),
        make_visible: z
          .boolean()
          .optional()
          .describe(
            "If true, publish this version to the client immediately. Default false — review first."
          ),
      },
    },
    async ({ document_id, description, services, budget_range, make_visible }) => {
      const supabase = createServerClient();

      const { data: doc, error: docErr } = await supabase
        .from("documents")
        .select("*, clients(name, organization)")
        .eq("id", document_id)
        .maybeSingle();
      if (docErr || !doc) return err("Document not found.");
      if (doc.status === "signed" || doc.status === "archived") {
        return err("Document is locked and cannot be modified.");
      }

      const client = doc.clients as { name?: string; organization?: string } | null;
      const clientOrg = client?.organization ?? client?.name ?? "the client";
      const clientName = client?.name ?? "";

      const userPrompt = [
        `Client: ${clientOrg}${clientName && clientName !== clientOrg ? ` (${clientName})` : ""}`,
        `Proposal title: ${doc.title}`,
        `Engagement description: ${description}`,
        services ? `Services / focus areas: ${services}` : null,
        budget_range ? `Approximate budget range: ${budget_range}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      const { text } = await generateText({
        model: anthropic("claude-sonnet-4-6"),
        system: SYSTEM_PROMPT,
        prompt: userPrompt,
        maxOutputTokens: 4096,
      });

      const sections = markdownToSections(text);

      const { data: latest } = await supabase
        .from("versions")
        .select("version_number")
        .eq("document_id", document_id)
        .order("version_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextVersion = (latest?.version_number ?? 0) + 1;

      const { data: version, error: versionErr } = await supabase
        .from("versions")
        .insert({
          document_id,
          version_number: nextVersion,
          sections,
          note: "Generated by Claude via MCP",
          visible_to_client: make_visible ?? false,
        })
        .select("id, version_number")
        .single();

      if (versionErr) return err(`Failed to save version: ${versionErr.message}`);

      await supabase
        .from("documents")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", document_id);

      const visibleToClient = make_visible ?? false;
      return ok({
        version_number: version.version_number,
        section_count: sections.length,
        visible_to_client: visibleToClient,
        message: visibleToClient
          ? `Version ${version.version_number} generated and published to the client.`
          : `Version ${version.version_number} saved as draft. Call publish_proposal to make it visible to the client.`,
      });
    }
  );

  // ── import_proposal_content ─────────────────────────────────────────────────
  server.registerTool(
    "import_proposal_content",
    {
      description:
        "Push markdown content you just wrote in this conversation directly into the app as a new proposal version. Use this INSTEAD of generate_proposal when you want to write the proposal here first and then send it to the app. The markdown is parsed on ## headings into sections.",
      inputSchema: {
        document_id: z
          .string()
          .describe(
            "Proposal ID — create the record first with create_proposal if it doesn't exist yet"
          ),
        markdown: z
          .string()
          .describe(
            "The full proposal markdown. Use ## headings for each section (e.g. ## Overview, ## Scope of work, ## Investment). Content before the first ## heading is ignored."
          ),
        make_visible: z
          .boolean()
          .optional()
          .describe(
            "If true, publish this version to the client immediately. Default false — the admin can review first."
          ),
        version_note: z
          .string()
          .optional()
          .describe("Optional note for this version, e.g. 'Initial draft — AI Academy'"),
      },
    },
    async ({ document_id, markdown, make_visible, version_note }) => {
      const supabase = createServerClient();

      const { data: doc, error: docErr } = await supabase
        .from("documents")
        .select("status, title, slug")
        .eq("id", document_id)
        .maybeSingle();
      if (docErr || !doc) return err("Document not found.");
      if (doc.status === "signed" || doc.status === "archived") {
        return err("Document is locked and cannot be modified.");
      }

      const sections = markdownToSections(markdown);
      if (sections.length === 0) {
        return err(
          "No sections found. Make sure the markdown has ## headings (e.g. ## Overview, ## Scope of work)."
        );
      }

      const { data: latest } = await supabase
        .from("versions")
        .select("version_number")
        .eq("document_id", document_id)
        .order("version_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextVersion = (latest?.version_number ?? 0) + 1;

      const { data: version, error: versionErr } = await supabase
        .from("versions")
        .insert({
          document_id,
          version_number: nextVersion,
          sections,
          note: version_note?.trim() || "Imported via MCP",
          visible_to_client: make_visible ?? false,
        })
        .select("id, version_number")
        .single();

      if (versionErr) return err(`Failed to save: ${versionErr.message}`);

      await supabase
        .from("documents")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", document_id);

      const visibleToClient = make_visible ?? false;
      return ok({
        version_number: version.version_number,
        section_count: sections.length,
        sections: sections.map((s) => s.heading),
        visible_to_client: visibleToClient,
        client_link: visibleToClient ? `${appUrl}/p/${doc.slug}` : null,
        message: visibleToClient
          ? `Version ${version.version_number} pushed and published. Client link: ${appUrl}/p/${doc.slug}`
          : `Version ${version.version_number} saved as draft. Call publish_proposal to make it live.`,
      });
    }
  );

  // ── publish_proposal ────────────────────────────────────────────────────────
  server.registerTool(
    "publish_proposal",
    {
      description:
        "Toggle a proposal between live (visible to client) and draft. Also makes the latest version visible to the client when publishing.",
      inputSchema: {
        document_id: z.string().describe("Proposal ID"),
        live: z
          .boolean()
          .describe(
            "true = publish to client, false = revert to draft (client link deactivated)"
          ),
      },
    },
    async ({ document_id, live }) => {
      const supabase = createServerClient();
      const { data: doc, error: docErr } = await supabase
        .from("documents")
        .select("status, title, slug")
        .eq("id", document_id)
        .maybeSingle();
      if (docErr || !doc) return err("Document not found.");
      if (doc.status === "signed" || doc.status === "archived") {
        return err("Document is locked — cannot change status.");
      }

      const newStatus = live ? "live" : "draft";
      const { error: updateErr } = await supabase
        .from("documents")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", document_id);
      if (updateErr) return err(updateErr.message);

      if (live) {
        // Make the latest version visible to client if none are yet
        const { data: visibleCheck } = await supabase
          .from("versions")
          .select("id")
          .eq("document_id", document_id)
          .eq("visible_to_client", true)
          .limit(1)
          .maybeSingle();

        if (!visibleCheck) {
          const { data: latest } = await supabase
            .from("versions")
            .select("id")
            .eq("document_id", document_id)
            .order("version_number", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (latest) {
            await supabase
              .from("versions")
              .update({ visible_to_client: true })
              .eq("id", latest.id);
          }
        }
      }

      return ok({
        status: newStatus,
        client_link: live ? `${appUrl}/p/${doc.slug}` : null,
        message: live
          ? `"${doc.title}" is live. Share this link with the client: ${appUrl}/p/${doc.slug}`
          : `"${doc.title}" set to draft. The client link is now inactive.`,
      });
    }
  );

  return server;
}
