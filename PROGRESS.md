# PROGRESS.md — Session Log

---

## 2026-06-11 — Design implementation + Claude generation

**What was built:**

Design system implementation (from Claude Design handoff bundle):
- `app/layout.tsx` — removed the generic `<header>` (conflicted with client page cover band; admin has its own)
- `lib/data/documents.ts` — `getDocumentBySlug` now joins `clients` table, returns `DocumentWithClient` for cover band "Prepared for {org}" line
- `app/(client)/p/[slug]/page.tsx` — full redesign: navy cover band with SVG arc texture, cyan "PROPOSAL" eyebrow, Playfair clamp title, status strip with VersionBar, editorial `space-y-[60px]` section layout (no cards), signed banner (cyan tint), navy footer
- `_components/ActionsCluster.tsx` (new) — sticky PDF download button: fixed bottom-right on desktop, inline on mobile; white card with navy border and shadow
- `_components/SectionList.tsx` — editorial redesign: removed card wrappers, hover-reveal comment icon via CSS `data-comment-trigger` attribute, Playfair section headings, single open CommentBox at a time, CommentBox is the only card element
- `_components/VisitorPopup.tsx` — navy scrim modal with cyan "WELCOME" eyebrow, Playfair heading, cyan "Continue →" button
- `_components/SignSection.tsx` — navy gradient band + centered white card; consent checkbox gates signature pad; 2-col name/email grid; ink picker with sky ring; ✕/✓ buttons appear after first stroke; completion popup with cyan check circle
- `_components/VersionBar.tsx` — redesigned as status strip: version + date left, clock dropdown right, no navigation (dropdown only)
- `app/(client)/p/[slug]/not-found.tsx` — navy full-page with arc texture, wordmark, Playfair "This link isn't active.", icy email link
- `app/(client)/p/[slug]/loading.tsx` — updated skeleton to match cover band (navy gradient, icy shimmer) + editorial section placeholders (was old card-style skeleton)
- `lib/pdf/DraftProposal.tsx` — upgraded: `parseMarkdown()` for bullet rendering, cover band in PDF, section divider lines, icy bullet dots, "DRAFT — NOT EXECUTED" red footer
- `app/api/client/[slug]/pdf/route.ts` — passes client org to `renderDraftPDF`

Claude generation:
- `app/api/admin/documents/[id]/generate/route.ts` (new) — POST endpoint; calls `generateText` via `@ai-sdk/anthropic`; system prompt enforces Agentic Arc voice (no em dashes, sentence case, no hype, 8 standard sections); returns `{ markdown: string }`; protected by `requireAdmin()`; 409 on signed/archived
- `app/(admin)/admin/d/[id]/_components/SectionEditor.tsx` — "Generate with AI" toolbar button + collapsible panel (description, services, budget); flow: generate → auto-populate import textarea → admin reviews → "Parse and replace sections"; loading spinner state
- `.env.example` — added `ANTHROPIC_API_KEY` entry

**Bug fixes:**
- AI SDK v6 renamed `maxTokens` → `maxOutputTokens`; updated generate route
- ESLint unescaped apostrophe in SignSection (`You'll` → `You&apos;ll`)
- `@ai-sdk/anthropic` model IDs use hyphens (`claude-sonnet-4-6`), not dots; dots are only for the AI Gateway gateway string format

**Verification:**
- `npm run typecheck` clean, `npm run lint` clean, `npm run test` 66/66
- Curl check on live proposal page: cover band, "Prepared for Northfield", PROPOSAL eyebrow, ActionsCluster — all present
- `ANTHROPIC_API_KEY` must be set in `.env` before testing "Generate with AI" end-to-end

**Pending:**
- Test "Generate with AI" end-to-end in the browser (requires `ANTHROPIC_API_KEY` in `.env`)
- Ben's production smoke test (full signing flow on `https://proposals.agenticarc.ai`, verify emails via Resend domain)
- `git tag v1.0.0 && git push --tags` after smoke test passes

**Next step:** Ben adds `ANTHROPIC_API_KEY` to `.env`, then tests Generate with AI in the admin editor at `/admin/d/[id]`. After that, production smoke test and tag.

---

## 2026-06-11 — Phase 5: Polish & Security (in progress)

**What was built:**

Vercel / deploy:
- Project already existed (`prj_eaNdkCow9TnOlrGGNlkTwQpKVgdv`) with all 8 env vars set. `APP_URL` was blank — updated to `https://proposals.agenticarc.ai`
- `proposals.agenticarc.ai` DNS was already pointing to Vercel (CNAME → `cb42da2940dbabe2.vercel-dns-017.com`), SSL green, 200 OK
- `.vercel/project.json` written locally to link CLI

Loading / error states:
- `app/(admin)/admin/loading.tsx` — table row skeletons
- `app/(admin)/admin/error.tsx` — error boundary with Try Again
- `app/(admin)/admin/d/[id]/loading.tsx` — document page skeleton
- `app/(admin)/admin/clients/loading.tsx` — clients page skeleton
- `app/(admin)/admin/completed/loading.tsx` — completed page skeleton
- `app/(client)/p/[slug]/loading.tsx` — proposal page skeleton (navy band + section cards)
- `app/(client)/p/[slug]/error.tsx` — branded error boundary

Mobile pass:
- Section cards and SignSection: `px-8 py-7` → `px-4 sm:px-8 py-6 sm:py-7` so 320–375px phones have adequate padding

Security review ran against `docs/REVIEW.md` (all A–F items):

| Item | Result |
|------|--------|
| A1–A3, A5 | PASS |
| A4 | **FIXED** — `requireAdminPage()` added to admin dashboard, completed, and doc-detail server page components (was proxy-only) |
| B1–B6 | PASS |
| C1, C3 | PASS |
| C2 | **FIXED** — Postgres triggers `trg_signed_document_lockout` (documents), `trg_version_signed_lockout` (versions), `trg_comment_signed_lockout` (comments) block mutations to signed docs at the DB level via migration `signed_document_lockout_triggers` |
| D1–D3 | PASS |
| E1, E3 | PASS |
| E2 | **FIXED** — `author_name` ≤100, comment body ≤5000, `signer_name` ≤200 added to visit, comments POST, comments PATCH, and sign routes |
| F1 | NOTED (Medium) — no rate limiting; no Vercel WAF rule or Upstash package added; acceptable for v1 with single-client usage |
| F2, F3 | PASS |
| F4 | N/A — requires Supabase dashboard; Ben must verify PITR is enabled |

**Deferrals:**
- F1 rate limiting — medium severity; acceptable at v1 scale (single consultant, known clients)
- F4 backup verification — Ben checks Supabase dashboard → Settings → Backups
- Observability/logging on route handlers — deferred from Phase 4, still deferred; Vercel function logs cover basic debugging

**Verification so far:**
- `npm run typecheck` clean, `npm run lint` clean, `npm run test` 66/66
- Phase 5 commit pushed to main; Vercel auto-deploy in progress

**Next step:** Wait for Vercel production deployment to finish, then Ben's production smoke test (full signing end-to-end on `https://proposals.agenticarc.ai`). Then `git tag v1.0.0 && git push --tags`.



Append-only. Every session ends by adding an entry: date, phase, what was built, key decisions, deferrals, exact next step. Newest entry at the top.

---

## 2026-06-10 — Phase 4: Signing

**What was built:**

Packages installed: `signature_pad` ^5.1, `resend` ^6.12.

Schema (migration `add_signature_email_status` via Supabase MCP):
- `signatures.email_sent_at timestamptz`, `signatures.email_error text` — records executed-email outcome so a failure can be retried from admin (SPEC §6.6 had no storage for this)

Core signing:
- `lib/consent.ts`: canonical `CONSENT_TEXT` constant — rendered in the UI, echoed back by the client, compared server-side (mismatch = 400), and stored verbatim on the signature row
- `POST /api/client/sign` (`app/api/client/sign/route.ts`): the atomic transaction per SPEC §6. Payload carries signature data only (name, email, ink, consent echo, PNG data URL) — never content. Steps: validate → re-verify live+unsigned → **atomic claim** (`UPDATE documents SET status='signed' WHERE id=? AND status='live'`; zero rows = lost the race = 409) → freeze current visible version from DB → SHA-256 via `hashSections` → upload PNG to `signatures` bucket → insert signatures row → executed PDF → Resend emails → 201
- Failure semantics: any failure before the signatures row persists reverts status to `live` (compensating update) and returns 500. After the row exists, nothing undoes the signature: PDF/email failures are recorded in `email_error` for admin retry
- `lib/pdf/ExecutedProposal.tsx`: executed PDF — navy band, frozen sections, EXECUTED footer, final page with signature image (ink color) + audit block (signer name/email, signed_at ET, IP, SHA-256 hash, slug, consent text)
- `lib/pdf/executed-pdf.ts`: `getOrCreateExecutedPdf()` — serves the stored PDF, or regenerates it from the frozen snapshot (`signature.version_id` + stored PNG) if missing/unreadable; used by client PDF route, admin download, and email retry (self-heals a failed generation)
- `lib/email/executed.ts`: `sendExecutedEmails()` — one Resend send to `[signer_email, ADMIN_EMAIL]`, subject "Executed: {title} — Agentic Arc", PDF attached; never throws, returns outcome for `updateSignatureEmailStatus()`
- `lib/data/signatures.ts`: `getSignatureByDocumentId()`, `updateSignatureEmailStatus()`

Client view:
- `_components/SignSection.tsx`: consent checkbox gates the pad (SPEC §5.5); signature_pad canvas with devicePixelRatio-aware sizing; ink picker black/blue/red; ✕ clear and ✓ confirm appear only after the first stroke (`endStroke` event); name (cookie) + email (`documents.signer_email`) prefilled and editable; completion popup "Thanks for signing! A copy … sent to {email}" → reload into signed state
- `_components/SignedSummary.tsx`: post-sign signature image + audit summary (date ET, ink, full hash, consent text)
- `GET /api/client/[slug]/signature`: streams the signature PNG from private storage (slug is the access token, signed docs only)
- `GET /api/client/[slug]/pdf`: now serves the executed PDF on signed docs (`-executed.pdf` filename); draft PDF with watermark unchanged for live docs
- Signed banner upgraded to "Signed by {name} on {date}"

Admin:
- `GET /api/admin/documents/[id]/executed-pdf`: download (was a dead link from Phase 2)
- `POST /api/admin/documents/[id]/retry-email`: regenerates PDF if needed, resends, updates email status
- Completed page: "Retry email" button shown when `email_sent_at` is null

Tests (8 new, 66 total): draft doc → 409; already-signed → 409; no consent → 400 (and no claim attempted); tampered consent text → 400; **double-submit race** (claim matches 0 rows) → 409 with no signature insert; happy path asserts `content_hash === hashSections(DB snapshot)`, canonical consent text, both uploads, email status recorded; email failure → 201 with signature standing and error recorded; pre-persistence failure → 500 with status reverted to live.

**Key decisions:**
- The conditional status UPDATE is the concurrency lock (Supabase JS has no transactions). Snapshot is read AFTER winning the claim: once status=signed, every content-mutation route 409s, so the freeze is race-free against admin edits
- Executed PDF generation failure does not fail the signing — recorded in `email_error`, and `getOrCreateExecutedPdf` regenerates from the frozen snapshot on next download/retry
- One Resend send with both recipients in `to:` (same content, single failure to track/retry)
- Consent text lives in `lib/consent.ts`; server stores its own constant, never the client's string (client echo is only an integrity check)
- Fixed latent Phase 1 seed bug: `documents.client_id` FK is ON DELETE RESTRICT (not cascade as the cleanup assumed) and delete errors were unchecked — prior seed runs accumulated orphan duplicate docs/clients (3 "live" docs existed). Cleanup now deletes signatures → documents → client explicitly, checks every error, and handles duplicate seed clients. Stale rows purged from the DB

**Deferrals:**
- **Resend domain: `agenticarc.ai` is NOT yet verified in Resend** — sends from `proposals@agenticarc.ai` fail with a validation error (observed live, correctly recorded in `email_error`, retried successfully). Ben must add the DNS records at resend.com/domains before production (Phase 5 walks through IONOS DNS anyway). Email path proven end-to-end with the `onboarding@resend.dev` sandbox sender via the admin retry button
- Storage bucket RLS tightening, observability/logging — Phase 5

**Verification passed:**
- `npm run typecheck` clean, `npm run lint` clean, `npm run test` 66/66
- Live walkthrough on dev server against seed data: sign section + consent text render for named visitor; POST sign → 201, signatures row complete (hash, IP, UA, paths); double-submit → 409; signed page shows banner with name/date + signature image + audit summary; signature PNG streams (image/png); executed PDF downloads (3 pages; decoded text contains signer, SHA-256 hash, EXECUTED footer, consent language); client comment on signed doc → 409; admin status PATCH unauthenticated → 401; admin executed-pdf download (authenticated) → 200; **stored content_hash matches hash recomputed from the frozen DB snapshot**; retry-email route (authenticated, sandbox sender) → 200, `email_sent_at` set, `email_error` cleared, email received
- Seed re-run twice — idempotent, no orphans; fresh live doc ready for Ben's manual check
- NOT yet done: Ben's 🧑 manual check (sign end-to-end in a browser, receive both emails, confirm admin lockout) — blocked partly on Resend domain verification for real-address sends

**Next step:** Ben's Phase 4 manual check (15 min) + verify `agenticarc.ai` in Resend. Then Phase 5 — polish, security review, deploy (return to `opusplan`).

---

## 2026-06-10 — Phase 3: Client View

**What was built:**

Packages installed: `react-markdown` ^10, `rehype-sanitize` ^6, `remark-gfm` ^4, `@react-pdf/renderer` ^4.5.

Data layer additions:
- `lib/data/access-log.ts`: `createAccessLogEntry()`
- `lib/data/comments.ts`: `getCommentsByVersionId()`, `createComment()`, `updateComment()`
- `lib/data/versions.ts`: `getVisibleVersionsByDocumentId()`, `getVersionById()`

Client-facing API routes (no auth required):
- `POST /api/client/visit` — writes access_log row; rejects if doc is not live/signed
- `POST /api/client/comments` — creates comment; rejects with 409 if doc is not live
- `PATCH /api/client/comments/[id]` — updates comment body; rejects with 409 if doc not live
- `GET /api/client/[slug]/pdf` — generates and streams draft PDF via `@react-pdf/renderer`; force-dynamic

Client view:
- `app/(client)/p/[slug]/page.tsx`: server component; gates on live/signed; resolves `?v=N` for old versions; reads `aa_visitor_name` cookie
- `app/(client)/p/[slug]/not-found.tsx`: branded "This link isn't active" page (HTTP 404)
- `_components/VisitorPopup.tsx`: fixed overlay modal; cannot dismiss without entering name; POSTs visit + sets 1yr SameSite=Lax cookie; reloads page
- `_components/AccessLogger.tsx`: invisible client component; fires silent POST on mount for returning visitors
- `_components/VersionBar.tsx`: shows current version date/note; dropdown navigates to `?v=N` for prior versions
- `_components/SectionList.tsx`: renders all sections with `react-markdown` + `rehype-sanitize` + `remark-gfm`; `CommentBox` per section with 800ms debounce autosave; "Saved" microcopy; shows comment indicator dot when a comment exists

PDF:
- `lib/pdf/DraftProposal.tsx`: React PDF component (navy header band, section content, DRAFT footer on every page); `stripMarkdown()` util for plain-text PDF body; exports `renderDraftPDF(doc, version): Promise<Buffer>`

**Key decisions:**
- `proxy.ts` function renamed from `middleware` to `proxy` (Next.js 16 requires the named export to be `proxy` or a default export)
- `@react-pdf/renderer` added to `serverExternalPackages` in `next.config.ts` so Turbopack doesn't attempt to bundle it client-side
- `Buffer → new Uint8Array(buffer)` in the PDF route handler (Next.js `NextResponse` accepts `BodyInit`, which includes `Uint8Array` but not `Buffer` directly)
- Cookie is set client-side (SameSite=Lax, 1yr, no HttpOnly) so CommentBox components can read the visitor name without a server round-trip
- After popup submission, `window.location.reload()` is used; on next render the server reads the cookie and switches from `VisitorPopup` to `AccessLogger`
- Comments are always associated with the current visible version's ID, even when the user is viewing an older version (comment UI is hidden on old versions and signed docs)
- `getCommentsByVersionId` loads all comments (not just unresolved); client sees their complete feedback thread
- The debounce creates a new comment on first save; subsequent saves PATCH the same comment ID held in component state

**Deferrals:**
- Signing UI (consent checkbox, signature pad, confirm flow) — Phase 4
- Executed PDF (post-signing) — Phase 4; draft PDF download is available on signed docs for now
- Observability/logging on route handlers — Phase 5

**Verification passed:**
- `npm run typecheck` clean
- `npm run lint` clean
- `npm run test` 58/58 pass (41 existing + 17 new)
- `/p/nonexistent` → 404 ✓
- `/p/draft-slug` → 404 ✓
- `/p/live-slug` → 200 (popup shown without cookie) ✓
- `/p/live-slug` with cookie → 200 (AccessLogger renders, no popup) ✓
- `/p/signed-slug` → 200 (signed banner shown) ✓
- `POST /api/client/visit` → `{ok:true}` + row in access_log ✓
- `POST /api/client/comments` → `{id:...}` 201 + row in comments ✓
- `PATCH /api/client/comments/[id]` → `{ok:true}` 200 + body updated ✓
- `POST /api/client/comments` on draft doc → 409 ✓
- `GET /api/client/[slug]/pdf` → 200 + `application/pdf` ✓
- `GET /api/client/draft-slug/pdf` → 404 ✓
- `/p/live-slug?v=1` → 200 (old version banner shown) ✓

**Next step:** Phase 4 — Signing. Consent checkbox, `signature_pad` canvas, atomic signing route, executed PDF, Resend emails. Run on Fable/Opus per PLAN.md.

---

## 2026-06-10 — Phase 2: Admin

**What was built:**

Auth & routing:
- `proxy.ts` (Next.js 16 middleware replacement): protects all `/admin/*` routes; redirects unauthenticated requests to `/admin/login?next=<path>`; cookie-aware using `@supabase/ssr`
- `app/(admin)/admin/login/page.tsx`: client-side login form using `supabase.auth.signInWithPassword()`; redirects to `next` param after success
- `app/(admin)/admin/layout.tsx`: navy header with nav (Dashboard / Clients / Completed); server component reads session
- `app/api/admin/auth/logout/route.ts`: POST signOut + redirect to login

Admin pages:
- `app/(admin)/admin/page.tsx`: dashboard table — document list with status pills, comment badge (orange count bubble), last visit, copy-link, link to document
- `app/(admin)/admin/d/[id]/page.tsx`: document detail page — status toggle, section editor, version list, comments panel, access log table
- `app/(admin)/admin/d/[id]/_components/SectionEditor.tsx`: markdown import (splits on `##`), add/remove/reorder sections, save-as-new-version with note + visibility checkbox
- `app/(admin)/admin/d/[id]/_components/VersionList.tsx`: per-version visibility toggle (show/hide from client)
- `app/(admin)/admin/d/[id]/_components/CommentsPanel.tsx`: grouped by section, resolve toggle, export disputed sections button
- `app/(admin)/admin/d/[id]/_components/StatusToggle.tsx`: live ↔ draft toggle + copy client link
- `app/(admin)/admin/clients/page.tsx`: new document form + clients table with inline edit/delete
- `app/(admin)/admin/clients/_components/NewDocumentForm.tsx`: auto-fills signer name/email from selected client
- `app/(admin)/admin/clients/_components/ClientsManager.tsx`: full CRUD table with inline edit rows
- `app/(admin)/admin/completed/page.tsx`: signed/archived docs with signer info, hash prefix, PDF download link, disabled v2 invoice stub

Route Handlers (all protected by `requireAdmin()`):
- `POST /api/admin/documents` — create document (generates unique slug)
- `PATCH /api/admin/documents/[id]/status` — toggle live/draft; 409 on signed
- `POST /api/admin/documents/[id]/versions` — save new version; 409 on signed
- `POST /api/admin/documents/[id]/import-md` — parse markdown → sections; 409 on signed
- `GET /api/admin/documents/[id]/export-comments` — download unresolved comments as .md
- `PATCH /api/admin/versions/[id]` — toggle client visibility; 409 on signed parent doc
- `PATCH /api/admin/comments/[id]` — resolve/unresolve comment; 409 on signed parent doc
- `POST /api/admin/clients` — create client
- `PATCH /api/admin/clients/[id]` — update client
- `DELETE /api/admin/clients/[id]` — delete client (409 if client has documents via FK)

Data layer additions:
- `lib/data/access-log.ts`: `getAccessLogByDocumentId()`

Scripts:
- `scripts/create-admin.ts`: one-time script to upsert the admin Supabase Auth user

**Key decisions:**
- Admin Auth uses Supabase email/password — single account (`ADMIN_EMAIL` / `ADMIN_PASSWORD`); credentials stored in `.env` only
- `proxy.ts` (not `middleware.ts`) per Next.js 16; placed at repo root (same level as `app/`)
- All mutation routes check `doc.status === "signed" || doc.status === "archived"` and return 409 — enforced server-side independent of UI
- Comment resolve toggle also returns 409 on signed docs for consistency with the blanket mutation guard
- `DELETE /api/admin/clients/[id]` returns 409 (not 500) on FK violation code `23503` — client has documents attached
- `export-comments` returns plain text if there are no unresolved comments; a `.md` attachment if there are
- `StatusToggle` is a client component; document page server component passes initial status and re-renders on `window.location.reload()` after version save

**Deferrals:**
- `GET /api/admin/documents/[id]/executed-pdf` — referenced in completed page but not implemented yet (Phase 4: signing stores the PDF in storage, Phase 4 adds the download route)
- Observability/logging on route handlers — Phase 5

**Verification passed:**
- `npm run typecheck` clean
- `npm run lint` clean
- `npm run test` 41/41 pass (36 existing + 5 new mutation-guard tests)
- Admin user created in Supabase Auth: `ben@agenticarc.ai` (id: `5424e5e4-67c6-4e76-be28-2cdec1a9d9eb`)

**Next step:** Phase 3 — Client View. `/p/[slug]` route, first-visit popup, section rendering, version bar, comments with autosave, draft PDF download.

---

## 2026-06-10 — Phase 1: Schema & Seed

**What was built:**
- SQL migrations via Supabase MCP:
  - `create_enums_and_tables`: `document_status` enum (draft/live/signed/archived), `ink_color` enum (black/blue/red), all 8 tables with FKs, unique constraints, indexes, and `set_updated_at` triggers
  - `enable_rls_deny_anon`: RLS enabled + `FORCE ROW LEVEL SECURITY` on all tables; no anon policies = deny all by default; service_role bypasses RLS
  - `create_storage_buckets`: `signatures` bucket (5MB, PNG only) + `executed-pdfs` bucket (50MB, PDF only), both private
- `lib/utils/slug.ts`: `randomBase62(n)` with rejection sampling (no modulo bias), `kebabify()`, `generateSlug()`, `generateUniqueSlug()` with collision retry
- `lib/utils/hash.ts`: `canonicalizeSections()` (sorted by order+id, alphabetical key order) + `hashSections()` (SHA-256 via Node `crypto`)
- `lib/utils/markdown-to-sections.ts`: splits on `## ` headings, assigns UUIDs, discards pre-`##` content
- Tests: 36 tests across 4 files — all pass
- `seed/run.ts`: 2 clients (Elena/Healing Hands, Marcus/Northfield), 3 documents (draft/live/signed), fake 1×1 PNG + minimal PDF in storage, comment and access_log entries per doc; idempotent (cascades deletes on re-run)

**Key decisions:**
- `FORCE ROW LEVEL SECURITY` added alongside `ENABLE` — prevents table owner from bypassing RLS accidentally
- `signatures` table uses `ON DELETE RESTRICT` (not cascade) so you can never accidentally delete a signed document's record; must explicitly delete signature first
- `invoices.document_id` is nullable (`SET NULL` on doc delete) — a v2 invoice may exist after the proposal is archived
- Slug suffix: 12-char base62 = 71 bits entropy (well above the 64-bit requirement in CLAUDE.md)
- Section IDs in `markdownToSections` are UUIDs generated at import time — they will be stable for a given version's sections but change on re-import (which is correct; a new import = new version)
- Seed client emails use `.local` TLD suffix to distinguish them from real addresses
- `dotenv` loaded via `import "dotenv/config"` at top of seed script — works without `--env-file` flag

**Deferrals:**
- Supabase Auth (admin account) deferred to Phase 2
- Storage bucket RLS policies (server uses service role; no policies needed now) — Phase 5 security review may tighten

**Verification passed:**
- `npm run seed` runs twice with identical success (idempotent)
- All 36 tests pass
- Anon key blocked on all 8 tables (0 rows returned, no policies = deny all)
- `npm run typecheck` clean, `npm run lint` clean

**Next step:** Phase 2 — Admin. Supabase Auth login at `/admin`, dashboard, document editor, comments panel, clients CRUD, mutation guard.

---

## 2026-06-10 — Phase 0: Scaffold & Environment

**What was built:**
- Next.js 16.2.9 scaffolded manually (create-next-app refused to run in non-empty dir)
- Tailwind CSS v4 with Agentic Arc brand tokens in `app/globals.css` via `@theme` directive: navy, sky, cyan, icy, ivory, charcoal; Playfair Display + Inter loaded via `next/font/google`
- Root layout (`app/layout.tsx`): navy header bar, white canvas, both font variables applied
- Branded homepage (`app/page.tsx`): cyan eyebrow, Playfair h1 in navy, Inter body
- Supabase clients: `lib/db/server.ts` (service role) + `lib/db/client.ts` (anon); smoke test confirmed connectivity
- Tooling: `npm run typecheck` (tsc), `npm run lint` (eslint flat config), `npm run test` (Vitest) — all pass clean
- `seed/sample-proposal.md` — realistic AI consulting proposal placeholder created (Healing Hands Wellness Studio, 10-week engagement, $18K)
- `.env` written locally with all 5 secrets; `.gitignore` covers `.env*` (except `.env.example`)

**Key decisions:**
- Tailwind v4 `@theme` (CSS-first) instead of `tailwind.config.ts` for brand tokens — v4 auto-detects files, no `content` array needed
- `@tailwindcss/postcss` required for Tailwind v4 (not `tailwindcss` directly as PostCSS plugin)
- ESLint 9 required (not 10) — `eslint-config-next@16.x` bundled `eslint-plugin-react` breaks on ESLint 10's removed `getFilename` API; ESLint 9 works fine
- Next.js 16 removed `next lint` CLI command entirely; switched to standalone `eslint` with flat config (`eslint.config.mjs`)
- Turbopack root set in `next.config.ts` to suppress workspace-root-detection warning
- Test files excluded from main `tsconfig.json` (added `tests/tsconfig.json` extending root) to prevent missing-type errors
- `SUPABASE_URL` is `NEXT_PUBLIC_SUPABASE_URL` — the URL is not secret, same var used by server and browser clients
- Logo placeholder deferred to Phase 5 (`public/brand/logo.svg`); `onError` handler removed from Server Component layout

**Deferrals:**
- Logo SVG (`public/brand/logo.svg`) — Phase 5
- APP_URL in `.env` set to `http://localhost:3000` for dev; production URL (`https://proposals.agenticarc.ai`) goes in Vercel env vars at Phase 5

**Verification passed:**
- `npm run dev` boots at 437ms; `localhost:3000` returns HTTP 200
- Rendered HTML confirms: `bg-navy` header, Playfair + Inter font variables, `text-cyan` eyebrow, `font-display text-navy` headline
- `npm run typecheck` clean, `npm run lint` clean, `npm run test` 1/1 pass
- Supabase smoke test: service role JWT accepted, PostgREST responding
- `.env` is gitignored; secrets will not appear in commit history

**Next step:** Phase 1 — Schema & Seed. Run migrations for all tables in SPEC §3, slug generator util, SHA-256 hash util, markdown importer, and seed script.

---

## (no sessions yet — superseded above)

Next step: Ben runs `/build-phase` to start Phase 0.
