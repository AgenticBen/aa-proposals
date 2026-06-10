# CLAUDE.md — Agentic Arc Proposals App

You are building a proposal viewing, commenting, and e-signing web app for Agentic Arc AI (Ben Dudley, solo consultant). Read `docs/SPEC.md` for what to build, `docs/PLAN.md` for the order, and `PROGRESS.md` for where the last session left off. These three files are the source of truth. If anything here conflicts with your instincts, these files win.

## Stack (fixed, do not substitute)

- Next.js (App Router, TypeScript) deployed on Vercel
- Supabase: Postgres, Auth (admin only), Storage (signature images, executed PDFs)
- Tailwind CSS using the brand tokens below
- `signature_pad` for the signature canvas
- `@react-pdf/renderer` for PDF generation (server-side)
- Resend for transactional email
- `marked` or `react-markdown` with sanitization for rendering proposal sections

## Non-Negotiables (legal integrity of the product)

1. **Snapshot on sign.** The instant a signature is confirmed, freeze the exact section content, compute a SHA-256 hash of it, and store hash + content + signer name/email + IP + user agent + timestamp + consent text + signature image. The executed PDF is generated ONLY from this frozen snapshot, never from live content.
2. **Total lockout after signing.** Once status = `signed`, every mutation route must reject changes to that document's content, versions, and tokens. This includes the admin. Enforce server-side (route handlers + Postgres RLS), not just by hiding buttons.
3. **Consent checkbox before signing.** The signer must check the electronic-signature consent statement before the signature pad activates. Store the exact consent text shown, with the signature record.
4. **Tokens are the security boundary.** Document links must be unguessable (slug + random suffix, >= 64 bits of entropy in the random part). A document with `live = false` returns a polite "this link is not active" page, never content. Never enumerate or leak slugs.
5. **Secrets discipline.** `.env` is in `.gitignore` from the first commit. Never print secret values into chat output, logs, or committed files. `SUPABASE_SERVICE_ROLE_KEY` is server-only; it must never appear in any client component or browser bundle.
6. **Both parties get the executed PDF** by email immediately after signing (signer email + `ADMIN_EMAIL`).

## Working With Ben

- Ben is mildly technical: comfortable pasting commands and values, not comfortable wiring backend plumbing. When you need a value from him (API key, email, domain), ask for it explicitly and one at a time, then place it yourself. Never tell him to "configure X" without exact steps.
- Prefer doing work through tools you have (file edits, bash, Supabase MCP if available) over asking Ben to click around dashboards. Only route to Ben what genuinely requires his accounts.
- Keep explanations short. One paragraph of plain language per decision, max.

## Definition of Done (every task, every phase)

A task is not done until ALL of these pass:

1. `npm run typecheck` clean
2. `npm run lint` clean
3. `npm run test` clean (critical-logic tests live in `/tests`)
4. The feature works against seed data in `npm run dev`, verified by you actually exercising the route/flow (curl or a headless check), not by assuming
5. `PROGRESS.md` updated: what was built, decisions made, anything deferred
6. Relevant checkbox(es) ticked in `docs/PLAN.md`

If you cannot verify something yourself, say so explicitly in PROGRESS.md rather than marking it done.

## Session Protocol

- One phase per session. Finish the phase's verification block before stopping.
- Before ending: update `PROGRESS.md` (append, never overwrite history) and commit with a descriptive message.
- Never start a phase whose prerequisites are unchecked in `docs/PLAN.md`.
- Keep context lean: do not re-read files you have not modified; trust PROGRESS.md.

## Brand System (from the agentic-arc-brand skill; full skill at `.claude/skills/agentic-arc-brand/SKILL.md` if present)

Identity: premium editorial. Consultant-grade authority, human warmth. No cyberpunk, no glow, no AI clichés.

Tailwind theme tokens (define in config):

```
navy:      #002139   /* foundation: headers, hero fills, headlines */
sky:       #51ADDF   /* supporting: links, underlines, calm accents */
cyan:      #2CCBE6   /* THE accent: one emphasis per view, never a fill/body color */
icy:       #9DE2F2   /* soft accents, oversized numerals on navy */
ivory:     #E6E3E2   /* warm alternative canvas */
charcoal:  #495050   /* body text */
```

- Fonts: Playfair Display (display/headings) + Inter (body/UI), via `next/font/google`.
- Headlines left-aligned. White or ivory canvas, navy for header bars and dramatic sections. Generous negative space.
- Cards allowed: white fill, 12 to 16px radius, soft shadow or 1px border.
- Eyebrow labels: Inter, uppercase, bold, +3px letter-spacing, cyan.
- Buttons: primary = cyan or sky fill with navy/white text, 12px radius; secondary = navy fill or thin outline.
- Functional status colors (success/error/warning) are permitted in UI; no other off-brand decorative color.
- Logo (if provided in `public/brand/`) is never recolored. It keeps its original `#172F5B` navy + `#51ADDF` sky even though the app foundation navy is `#002139`.
- The proposal pages a client sees are the brand experience. They should feel like a calm, premium magazine page, not a SaaS dashboard.

## Conventions

- App Router with route groups: `(admin)` and `(client)`. Admin lives under `/admin`, client views under `/p/[slug]`.
- Server components by default; client components only where interactivity demands (signature pad, comment boxes, popups).
- All database access through a thin data layer in `lib/db/`. No raw Supabase calls scattered in components.
- Markdown sections are stored as structured JSON (`{ id, heading, body_md, order }[]`), rendered with sanitized markdown. Never `dangerouslySetInnerHTML` on unsanitized content.
- Dates in UTC in the database, formatted for display in `America/New_York`.
- Plain, readable code over clever code. This app will be maintained by Ben + future Claude sessions.
