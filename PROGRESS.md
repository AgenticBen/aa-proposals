# PROGRESS.md — Session Log

Append-only. Every session ends by adding an entry: date, phase, what was built, key decisions, deferrals, exact next step. Newest entry at the top.

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
