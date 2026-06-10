# PLAN.md — Build Order

Rules: one phase per session. A phase is complete only when every checkbox is ticked AND its Verification block passes AND Ben's manual check (marked 🧑) is confirmed. Do not start a phase with unchecked prerequisites. Update PROGRESS.md before ending any session.

Model note: run sessions on `opusplan`. Before starting Phase 4, Ben types `/model fable` (fallback: `/model opus`) for that session, then returns to `opusplan` for Phase 5.

---

## Phase 0 — Scaffold & Environment

- [ ] Initialize Next.js (TypeScript, App Router, Tailwind) in repo root; first commit includes `.gitignore` with `.env*` (except `.env.example`)
- [ ] Generate `.env.example`; interview Ben for each value one at a time; write `.env` locally; confirm secrets never echoed
- [ ] Tailwind theme with brand tokens; load Playfair Display + Inter via next/font; base layout (navy header bar, white canvas) renders
- [ ] Supabase client wiring (`lib/db/`): server client (service role) + anon client; connection smoke test
- [ ] `npm run typecheck`, `lint`, `test` scripts exist and pass (test runner installed with one placeholder test)
- [ ] Copy `seed/sample-proposal.md` check: file exists; if missing, ask Ben for it now

**Verification**: dev server boots; branded empty homepage renders; secrets absent from git (`git log -p | grep -c SUPABASE` returns 0 matches for values).
🧑 Ben: open localhost:3000, confirm fonts/colors look like the brand.

---

## Phase 1 — Schema & Seed

- [ ] Migrations for all tables in SPEC §3 (clients, documents, versions, comments, signatures, access_log, invoices, time_entries) with RLS enabled and policies: anon role has NO direct table access except where SPEC requires; all client-facing reads/writes go through server routes using scoped queries
- [ ] Slug generator util (kebab title + 12-char base62 suffix) with collision retry + unit tests
- [ ] Section canonicalization + SHA-256 hash util with unit tests (stable ordering, stable serialization)
- [ ] Markdown-to-sections importer (`##` splitting) with unit tests
- [ ] Seed script per SPEC §3 (2 clients, 3 documents incl. one fully signed with snapshot, hash, fake signature PNG, fake executed PDF)

**Verification**: `npm run seed` idempotent; unit tests pass; querying as anon key directly returns nothing from any table.
🧑 Ben: none required.

---

## Phase 2 — Admin

- [ ] Supabase Auth: single admin login at `/admin/login`; all `/admin` routes protected server-side
- [ ] Dashboard table per SPEC §8.1 (status pills, comment badges, last visit, copy link, live/draft toggle)
- [ ] Document page per SPEC §8.2: section editor, markdown import, save-as-new-version with note + client-visibility checkbox, version list with visibility toggles, access log table
- [ ] Comments panel + resolve toggle + Export disputed sections (markdown download)
- [ ] Clients CRUD + New document flow per SPEC §8.4 to 8.5
- [ ] Completed contracts page per SPEC §8.3 with disabled v2 invoice button stub
- [ ] Mutation guard: every write route rejects with 409 when document status = signed (tests for each route)

**Verification**: typecheck/lint/tests; full admin walkthrough against seed data via dev server (create client, create doc, import markdown, save version, toggle live, see seeded signed doc locked).
🧑 Ben: log in, create a fake document from a real proposal, toggle it live, copy the link. 5 minutes.

---

## Phase 3 — Client View

- [ ] `/p/[slug]` route per SPEC §5: live/signed gating, branded inactive page for everything else
- [ ] First-visit name popup + cookie + access_log writes on every visit (tests: no cookie → popup; cookie → logged silently)
- [ ] Section rendering (sanitized markdown) in brand layout
- [ ] Version bar + read-only prior-version viewing (only `visible_to_client` versions; banner on old versions; no comments/sign UI there)
- [ ] Section comments with 800ms-debounce autosave + "Saved" microcopy; visible in admin panel immediately
- [ ] Draft PDF download with DRAFT watermark (brand layout per SPEC §7)

**Verification**: typecheck/lint/tests; scripted walkthrough: fresh browser context → popup → name logged → comment autosaves → appears in admin → old version read-only → PDF downloads with watermark → dead/draft slug shows inactive page.
🧑 Ben: open the live link in a private browser window, do the popup, leave a comment, download the PDF, check the access log shows your name. 10 minutes.

---

## Phase 4 — Signing (HIGH STAKES — run on Fable/Opus)

- [ ] Consent checkbox gating the pad; exact consent text stored
- [ ] Signature pad: signature_pad canvas, ink colors (black/blue/red), ✕ clear and ✓ confirm appearing after first stroke; name/email fields prefilled + editable
- [ ] Atomic signing route per SPEC §6 (re-verify → freeze from DB → hash → store PNG → signatures row → status=signed → executed PDF → Resend emails → success). Client payload carries signature data only, never content
- [ ] Executed PDF per SPEC §7 with audit block; stored immutably
- [ ] Post-sign client state (banner, popup with "copy sent to {email}", read-only comments, signature + audit summary displayed)
- [ ] Lockout proven: every admin and client mutation route returns 409 on signed docs (tests), Completed page lists the doc, executed PDF downloadable
- [ ] Email failure path: signature stands, failure logged, admin retry button works
- [ ] Tests: double-submit race (second confirm gets 409), signing a draft fails, hash matches recomputed hash of stored snapshot

**Verification**: typecheck/lint/tests; full end-to-end signing against seed data with Resend in test mode or real send to Ben's own email.
🧑 Ben: sign a fake proposal end to end yourself: consent, draw, pick blue ink, clear with ✕, redraw, confirm with ✓, receive both emails, open the executed PDF, then try to edit the doc in admin and confirm you are locked out. 15 minutes. This is the most important manual check in the project.

---

## Phase 5 — Polish, Review, Deploy

- [ ] Loading/empty/error states across admin + client; mobile pass on `/p/[slug]` (clients will open links on phones)
- [ ] Run the `security-reviewer` subagent against `docs/REVIEW.md`; fix every Critical and High finding; record findings + fixes in PROGRESS.md
- [ ] Vercel: create project from repo, set production env vars (walk Ben through pasting values into Vercel dashboard), `APP_URL=https://proposals.agenticarc.ai`
- [ ] Walk Ben through the IONOS CNAME for `proposals` → Vercel; confirm domain green
- [ ] Production smoke test: seed a real-looking doc, full client flow + signing on the production URL with Ben's email
- [ ] Tag `v1.0.0`

**Verification**: REVIEW.md rubric fully green; production signing flow completed once.
🧑 Ben: the production dry run above, plus send the signing screenshots/consent text to the lawyer friend for the real review.
