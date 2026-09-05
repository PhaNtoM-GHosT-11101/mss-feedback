<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# MSS Feedback App — Handoff Notes (Sep 5, 2026)

Per-college **public suggestion box** (replaced the old committee/mess/praise/stats app). Next.js 16 (App Router, server-rendered, Turbopack), Supabase (project `gmkzcxvgbhhvznbkxlae`), deployed on Vercel: **https://mss-feedback.vercel.app**. Commit `2219187` was the last pre-refactor commit; the "public suggestion box" refactor is the current working tree.

## Current state (all working, verified)

- **QA suite passes 28/28** vs prod: `QA_AUTH_BYPASS=1 node scripts/qa.mjs` (needs `.env.local`; uses perftest111@gmail.com / PerfTest@123). Do not run against prod without bypass — `/admin` behavior differs.
- **Product is now a simple, per-college suggestion box.** Reading is OPEN — the proxy has no login wall; signing in only names the poster/voter/commenter. Mess/praise/stats/onboard modules, committee roles, admin subpages, ratings, flags and ban UI were all **stripped from app code**. The DB is intentionally untouched — `status`, `resolution_note`, `closed_by`, `admin_members`, `is_banned`, praise/rating/menu tables still exist with data preserved; the app just stops using them.
- **Routing** (`proxy.ts` at repo root, Next 16 — middleware convention removed): `/{slug}` always rewrites to the board with `INST_HEADER` (no session required); bare `/` injects `INST_HEADER` from `inst_slug` cookie when present → returns to your last college's board, else the picker; legacy `/mess`, `/praise`, `/stats`, `/onboard` redirect to `/` (top-level) or `/{slug}` (slug-scoped). Legacy names stay in `RESERVED` so they're not mistaken for college slugs (fixed during refactor).
- **Home (`/`)** = per-college "Community board": category chips (🍽 = mess categories), sort "Most upvoted / Newest" (`?sort=`), complaint cards (upvotes, title, pinned, meal session, relative time, photo count) — **no status badges**. Data via `getBoard()` wrapped in `unstable_cache` tags `["complaint"]`, `revalidate 30`; board + detail both filter `is_flagged = false`.
- **Complaint detail**: upvote/downvote toggle, comments (React-escaped), delete-own → `router.push("/")`. No status/resolution/close/flag. Documented API contract (RLS): self-vote 403, dup 409, else 201, unvote 204.
- **New complaint**: logged-out → sign-in prompt banner; meal-session picker only when the selected category `is_mess`; photos ≤2 / ≤10MB / compressed; **3/day limit** via `complaints_left_today` RPC (blocked insert = 403). Post lands back on `/`.
- **Profile**: name + editable roll + "My complaints" (no statuses) + sign out. Logged-out → inline sign-in card (no redirect).
- **Super admin**: ONLY user `61aef4a7-a744-4e99-b6f4-284254cc457f` (Aditya). `lib/admin-guard.ts` exports `getSuperAdmin()`/`SUPER_ADMIN_USER_ID`; `/admin` = "Site control" (colleges + per-college `is_mess` categories, add/edit/delete/active toggles via `app/admin/actions.ts`, all super-admin-gated). `NEXT_PUBLIC_AUTH_BYPASS=1` lets it render for testing. Removed admin subroutes return 404/redirect.
- **Column privacy (kept from the audit)**: `user_id` columns hidden from `authenticated` (select 403); author names via `complaint_author`/`comment_author` fill triggers; ownership via `is_my_*()` security-definer helpers — app code must NOT filter/select `user_id`. `service_role` (and super-admin server code) sees everything.
- Migration history: 1..15 applied to prod (mess-categories migration seeded 336 rows across institutions; migrations 012-015 = upvote/flag/delete fixes, profile-read restriction, Asia/Kolkata day limit). Apply new SQL via `node scripts/sqlinline.mjs "<sql>"` (Management API; PAT/`SUPABASE_ACCESS_TOKEN` is a local env var, never commit it).

## Environment

- `.env.local` has `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Typecheck: `npx tsc --noEmit` (stale `.next/*/types/validator.ts` errors referencing deleted routes = regenerate with `rm -rf .next && npx next build`). Build: `npx next build`. Lint: `npx eslint`.

## Chat backups / fresh-session handoff

If the user opens a **new chat window** (context reset) and wants continuity instead of the agent guessing from memory:

- **Full history**: `bash ~/bin/opencode-chat-backup.sh` — dumps every opencode session to `~/chat-backups/<timestamp>/` (markdown transcripts in `sessions/`, lossless JSONL in `raw/`, `index.md` lists all sessions newest-first). Point the new session at the latest folder.
- **Most relevant project session**: `ses_00e78ff9affeNbZeBX6B3pm45i` (this project, through the latest fixes) and `ses_012c037ebffe6cENP2H8zXGSBO` (earlier mss-feedback work). If uncertain, grep `index.md`.
- **Anti-hallucination rule for a fresh session**: read THIS file first; verify any fact it can't confirm (DB via `scripts/check-*.mjs` or service-role curl, schema via Supabase tooling, deploy state via `vercel ls`), don't invent. Re-run `node scripts/qa.mjs` after changes.

## Deploy

- **No GitHub webhook** — pushing to `main` does NOT auto-deploy (repo has zero webhooks; only CLI deploys work).
- Deploy with: `vercel deploy --prod --yes` (CLI is logged in as `adityaonwindows10-6386` via `vercel login`; token in `~/.vercel/auth.json`).
- The Vercel MCP OAuth token expires every hour and mcp-remote can't refresh it (no refresh_token stored) — MCP calls fail with timeouts/"Not authorized" once expired. If that happens, ask the user to re-run `npx vercel login` in a terminal; CLI deploy works regardless.
- Always re-run QA after DB/app changes.

## Chat backups / fresh-session handoff

If the user opens a **new chat window** (context reset) and wants continuity instead of the agent guessing from memory:

- **Full history**: `bash ~/bin/opencode-chat-backup.sh` — dumps every opencode session to `~/chat-backups/<timestamp>/` (markdown transcripts in `sessions/`, lossless JSONL in `raw/`, `index.md` lists all sessions newest-first). Point the new session at the latest folder.
- **Most relevant project session**: `ses_00e78ff9affeNbZeBX6B3pm45i` (this project, through the latest fixes) and `ses_012c037ebffe6cENP2H8zXGSBO` (earlier mss-feedback work). If uncertain, grep `index.md`.
- **Anti-hallucination rule for a fresh session**: read THIS file first; verify any fact it can't confirm (DB via `scripts/check-*.mjs` or service-role curl, schema via Supabase tooling, deploy state via `vercel ls`), don't invent. Re-run `node scripts/qa.mjs` after changes.

## Deploy

- **No GitHub webhook** — pushing to `main` does NOT auto-deploy (repo has zero webhooks; only CLI deploys work).
- Deploy with: `vercel deploy --prod --yes` (CLI is logged in as `adityaonwindows10-6386` via `vercel login`; token in `~/.vercel/auth.json`).
- The Vercel MCP OAuth token expires every hour and mcp-remote can't refresh it (no refresh_token stored) — MCP calls fail with timeouts/"Not authorized" once expired. If that happens, ask the user to re-run `npx vercel login` in a terminal; CLI deploy works regardless.
- Always re-run QA after DB/app changes.
