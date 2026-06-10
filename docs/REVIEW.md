# REVIEW.md — Security & Integrity Rubric

Run by the `security-reviewer` subagent (fresh context, read-only + bash) before any real client link is sent, and after any future change touching auth, signing, or document routes. For each item: PASS / FAIL / N/A with one line of evidence (file:line or command output). Severity: Critical = blocks launch. High = fix before first real client. Medium = fix within v1.x.

## A. Token & Access (Critical)

- [ ] A1. Slug random suffix >= 12 chars base62 (>= 64 bits entropy), generated with a CSPRNG, collision-checked
- [ ] A2. Draft/archived/unknown slugs all return the same inactive page; response does not differ in a way that reveals slug existence
- [ ] A3. No route, sitemap, API response, or error message enumerates slugs or document IDs to unauthenticated users
- [ ] A4. All `/admin` routes verified server-side (middleware AND route-level), not just hidden in UI
- [ ] A5. Cookie (`aa_visitor_name`) grants no authorization anywhere; deleting it changes nothing except re-showing the popup

## B. Signing Integrity (Critical)

- [ ] B1. Signing route re-reads current visible content from the database; client payload cannot supply or alter content
- [ ] B2. Double-submit / race: two concurrent confirms produce exactly one signature (DB constraint or transaction proves it)
- [ ] B3. Signing rejected unless status = live, with tests
- [ ] B4. Stored content_hash recomputes correctly from the stored snapshot (run the check)
- [ ] B5. Consent text stored verbatim with the signature record
- [ ] B6. Executed PDF generated only from the frozen snapshot; regenerating it after content tampering attempt still reflects the snapshot

## C. Lockout (Critical)

- [ ] C1. Every content/version/token mutation route returns 409 for signed documents, verified by tests hitting each route directly with the admin session
- [ ] C2. RLS or DB triggers provide a second enforcement layer beneath route handlers (defense in depth)
- [ ] C3. Storage objects for signature PNG and executed PDF are not publicly listable and are served via signed URLs or authenticated routes only

## D. Secrets & Transport (Critical)

- [ ] D1. `git log -p` contains no secret values; `.env` ignored from first commit
- [ ] D2. `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY` appear in zero client components; production browser bundle grep confirms
- [ ] D3. Anon Supabase key has no direct table read/write that bypasses server routes (attempt direct PostgREST queries with anon key against every table)

## E. Input & Rendering (High)

- [ ] E1. Markdown rendering sanitized; a section containing `<script>` and `<img onerror>` payloads renders inert (test with hostile seed section)
- [ ] E2. Comment bodies and name-popup input sanitized on render; length-limited server-side (names <= 100 chars, comments <= 5000)
- [ ] E3. Signing route validates ink_color enum, email format, PNG size cap

## F. Abuse & Operations (Medium)

- [ ] F1. Basic rate limiting or sane caps on the public endpoints (name popup submit, comment autosave, sign attempt) so a script cannot flood tables
- [ ] F2. Access_log writes cannot be spoofed into other documents (document binding comes from the slug route, not the payload)
- [ ] F3. Email failure path logged and surfaced in admin with retry, signature unaffected
- [ ] F4. Backups: confirm Supabase point-in-time/daily backups enabled on the project

## Output Format

Produce a table of every item with PASS/FAIL/N/A + evidence, then a prioritized fix list. Do not fix anything yourself; report only. The main session implements fixes and re-runs this rubric until A through D are fully PASS.
