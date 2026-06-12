import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getDocumentById } from "@/lib/data/documents";

export const dynamic = "force-dynamic";

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

/**
 * POST /api/admin/documents/[id]/generate
 * Body: { description?: string; services?: string; budget_range?: string }
 * Returns: { markdown: string }
 *
 * Generates a full proposal draft via Claude. The admin reviews
 * the output and uses the Import Markdown panel to push it into sections.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const doc = await getDocumentById(id);
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  if (doc.status === "signed" || doc.status === "archived") {
    return NextResponse.json({ error: "Document is locked" }, { status: 409 });
  }

  const body = (await request.json()) as {
    description?: string;
    services?: string;
    budget_range?: string;
  };

  const clientOrg = doc.clients?.organization ?? doc.clients?.name ?? "the client";
  const clientName = doc.clients?.name ?? "";

  const userPrompt = [
    `Client: ${clientOrg}${clientName && clientName !== clientOrg ? ` (${clientName})` : ""}`,
    `Proposal title: ${doc.title}`,
    body.description ? `Engagement description: ${body.description}` : null,
    body.services ? `Services / focus areas: ${body.services}` : null,
    body.budget_range ? `Approximate budget range: ${body.budget_range}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-6"),
    system: SYSTEM_PROMPT,
    prompt: userPrompt,
    maxOutputTokens: 4096,
  });

  return NextResponse.json({ markdown: text });
}
