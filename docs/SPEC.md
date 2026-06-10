# SPEC.md — Agentic Arc Proposals App (v1)

Every product decision is recorded here. Do not guess at behavior; if something is genuinely unspecified, choose the simplest option consistent with the Non-Negotiables in CLAUDE.md and record the choice in PROGRESS.md.

## 1. Purpose

A single place where Ben sends clients a secure link to view a proposal, collect section-level feedback, revise, and capture a legally enforceable electronic signature, with a permanent frozen record of what was signed. Replaces scattered docx/PDF/email workflows. v1 is proposals end to end. Invoices (v2) and time tracking (v3) get database tables now but no UI.

## 2. Roles

- **Admin (Ben, exactly one account).** Supabase Auth email + password login at `/admin`. Sees everything, manages everything, until a document is signed.
- **Client signer (no account).** Accesses one document via its secret link. One signer per document in v1 (schema supports more later).

## 3. Data Model (Supabase Postgres)

All tables get `id uuid pk default gen_random_uuid()`, `created_at timestamptz default now()`. RLS enabled on every table; the anon key gets access only through narrowly scoped policies / server routes.

- **clients**: `name`, `organization`, `email`, `notes`
- **documents**: `client_id fk`, `title`, `slug` (unique; see §4), `status` enum `draft | live | signed | archived`, `signer_name_expected`, `signer_email`, `updated_at`
  - `live` is represented by `status = 'live'`; the admin toggle flips draft/live.
- **versions**: `document_id fk`, `version_number int`, `sections jsonb` (array of `{ id, heading, body_md, order }`), `visible_to_client bool default false`, `note` (admin label like "post-pricing-call edit")
  - A new version row is created on every admin save. Latest version with `visible_to_client = true` is what the client sees as current.
- **comments**: `document_id fk`, `version_id fk`, `section_id text`, `author_name`, `body`, `resolved bool default false`, `updated_at`
- **signatures**: `document_id fk`, `version_id fk` (the frozen version), `signer_name`, `signer_email`, `signature_png` (Storage path), `ink_color` enum `black | blue | red`, `consent_text`, `content_hash` (SHA-256 hex of canonical JSON of frozen sections), `ip`, `user_agent`, `signed_at`, `executed_pdf` (Storage path)
- **access_log**: `document_id fk`, `name_entered`, `ip`, `user_agent`, `visited_at`
- **invoices** (v2, empty): `client_id fk`, `document_id fk nullable`, `invoice_number`, `status`, `content jsonb`, `issued_at`
- **time_entries** (v3, empty): `client_id fk`, `description`, `hours numeric`, `rate numeric`, `worked_on date`

Seed script (`npm run seed`) creates: 2 clients, 3 documents (one draft, one live, one signed with full snapshot) from `seed/sample-proposal.md` so every feature is testable immediately.

## 4. Links and Access

- Slug format: kebab-cased title + `-` + 12-char random base62 suffix, e.g. `healing-hands-ai-academy-x7K2mQ9rT4bn`. The suffix is the secret; the readable part is cosmetic. Slug never changes after creation.
- Client URL: `https://APP_URL/p/[slug]`.
- Access rule: serve content only when `status` is `live` or `signed`. `draft`/`archived` (or unknown slug) renders a branded "This link isn't active. Contact ben@agenticarc.ai." page with HTTP 404 semantics. Never reveal whether the slug exists.
- **First-visit name popup** (informal log, NOT auth): modal asks "Before you dive in, what's your name?" Single text field, brand-styled, cannot be dismissed without entry. On submit: write `access_log` row, set cookie `aa_visitor_name` (1 year, httpOnly not required, SameSite=Lax). Subsequent visits skip the popup and still write an `access_log` row using the cookie name. No cookie + popup completed = every page load logs.
- Signed documents remain viewable at the same link (read-only, with executed banner).

## 5. Client View (`/p/[slug]`)

Layout: branded magazine-style page. Navy header bar with Agentic Arc logo/wordmark and document title; white/ivory canvas; sections rendered from the current visible version.

Components, top to bottom:

1. **Version bar**: "Version N, updated {date}" plus a dropdown of prior versions where `visible_to_client = true`. Selecting one renders it read-only with a "viewing an earlier version" banner. Comments and signing are only available on the current version.
2. **Sections**: each `## heading` block renders as a card-like section with generous spacing. Each section has a subtle comment icon (top right of section, sky blue).
3. **Section comments**: clicking the icon opens an inline comment box under the section. Autosaves on a 800ms debounce after typing pauses ("Saved" microcopy). Client sees their own comments threaded under the section; comments persist across visits (matched by document, shown to everyone with the link, which in v1 is one signer). No delete in v1; admin can mark resolved.
4. **Download PDF** button (always available): generates a PDF of the currently viewed version. If the document is not yet signed, every page carries a footer watermark: "DRAFT — not executed". The executed version (post-signing) has the audit block instead (see §7).
5. **Sign section** (bottom, only on current version of a `live` document):
   - Consent checkbox with exact text: "I agree to conduct this transaction electronically, and I intend the signature below to be the legal equivalent of my handwritten signature." (Ben may replace wording later; store whatever was displayed.)
   - Signature pad: appears only after consent is checked. Canvas (signature_pad), ink color picker (black default, blue, red), an ✕ button (clear canvas) and a ✓ button (confirm). ✕/✓ appear only once drawing has begun.
   - Name + email fields prefilled: name from cookie, email from `documents.signer_email`; both editable (whoever actually signs records their real identity).
   - Confirm (✓) triggers the signing transaction (§6).
6. **Post-sign state**: green-checked banner "Signed by {name} on {date}". Popup on completion: "Thanks for signing! A copy of the executed proposal has been sent to {email}." Sign section replaced by the signature image + audit summary. Comments become read-only.

## 6. Signing Transaction (server-side, atomic)

On confirm, a single server route:

1. Re-verify: document exists, `status = 'live'`, no existing signature. Reject otherwise (handles double-click, stale tabs, link races).
2. Freeze: take the current visible version's sections, canonicalize JSON, compute SHA-256.
3. Persist: upload signature PNG to Storage; insert `signatures` row with all audit fields; set `documents.status = 'signed'`.
4. Generate executed PDF from the frozen snapshot (§7) and store it.
5. Email executed PDF via Resend to signer email and `ADMIN_EMAIL`, subject "Executed: {title} — Agentic Arc".
6. Return success to the client view; if email fails, the signature still stands and the failure is logged for admin retry.

After this, all content mutation routes return 409 for this document, for everyone, including admin. Allowed post-sign admin actions: archive (moves to Completed list; link stays viewable), download executed PDF, retry failed email.

## 7. PDFs

- Brand layout: navy header band with wordmark + title, Playfair headings, Inter body, charcoal text, footer with page numbers.
- Draft PDF: current sections + "DRAFT — not executed" footer watermark.
- Executed PDF: frozen sections + signature image with ink color + audit block on final page: signer name, signer email, signed_at (ET), IP, content hash, document slug, consent text. This file is immutable in Storage.

## 8. Admin (`/admin`, Supabase Auth protected)

1. **Dashboard**: table of all documents: title, client, status pill, current version, unresolved-comment count badge, last client visit, actions (open, copy link, live toggle).
2. **Document page** (`/admin/d/[id]`):
   - Live/draft toggle. Copy-link button.
   - Section editor: edit headings/body (markdown), reorder, add/remove sections. "Save as new version" with optional note + "visible to client" checkbox. Import button: paste markdown, app splits on `##` into sections (this is also the MCP insertion path later).
   - Version list with per-version `visible_to_client` toggles.
   - Comments panel: all comments grouped by section, resolve toggle, and **Export disputed sections** button: downloads a markdown file of each commented section's heading + current text + its comments (Ben feeds this to Claude for edits manually in v1).
   - Access log table: name, time, IP.
3. **Completed contracts** (`/admin/completed`): all `signed`/`archived` docs: signer, signed date, hash, executed PDF download. (A "Generate invoice" button slot is stubbed here, disabled, labeled "v2".)
4. **Clients** (`/admin/clients`): minimal CRUD.
5. **New document flow**: pick/create client, title, signer email, paste markdown, creates draft + version 1.

## 9. Out of Scope for v1 (explicitly)

Multi-signer routing/reminders, auto-emailing links (Ben copies the link into his own email), text-level highlights (section comments only), invoice UI, time tracking UI, MCP connector itself (the import-markdown endpoint is the seam it will use), client editing of document text, payment, notifications beyond the two executed-PDF emails.

## 10. Edge Cases (decided)

- Client opens an old visible version and tries to sign: signing UI absent on old versions.
- Admin saves a new visible version while client has page open: client signs what their confirm-time *current visible version* is on the server; the freeze step reads from the database, not the client payload. The client payload contains only signature data, never content.
- Cookie cleared / new device: name popup again; both names appear in access log. Fine, it is an informal log.
- `live` toggled off mid-visit: next navigation/action returns the inactive page; an in-flight signing attempt fails step 1.
- Two signers needed someday: `signatures` is already a separate table; do not build the routing.
