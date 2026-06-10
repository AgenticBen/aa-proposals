# PROGRESS.md — Session Log

Append-only. Every session ends by adding an entry: date, phase, what was built, key decisions, deferrals, exact next step. Newest entry at the top.

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
