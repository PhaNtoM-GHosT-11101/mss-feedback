<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# MSS Feedback App — Handoff Notes (Aug 11, 2026)

Hostel mess feedback app. Next.js 16 (App Router, server-rendered), Supabase (project `gmkzcxvgbhhvznbkxlae`), deployed on Vercel: **https://mss-feedback.vercel.app**. All work is committed to `main` (latest `84e9234`).

## Current state (all working, verified)

- **QA suite passes 30/30**: `node scripts/qa.mjs` (needs `.env.local`; uses perftest111@gmail.com / PerfTest@123)
- **Upvote/flag/delete bugs fixed** (migrations 012, 013 + `app/complaints/[id]/detail-actions.tsx`): upvote 201, unvote 204, duplicate 409, self-upvote 403; own comment/complaint delete 204. App unvote must NOT filter on `user_id` (not SELECT-granted) — ownership enforced by `is_my_upvote()`/`is_my_complaint()`/`is_my_comment()` security-definer helpers.
- **Column privacy design** (migrations 009, 010): `user_id` columns hidden from `authenticated`; author names stored in `complaint_author`, `comment_author`, `praise_author` (filled by `fill_*` triggers). Admin/service_role see everything.
- **Migration 011**: `grant all on all tables in schema public to service_role` applied live.
- Admin: only Aditya Priyadarshi (`61aef4a7-a744-4e99-b6f4-284254cc457f`, role `admin`). Admin membership in `admin_members` (PK `user_id`, NO `id` column — delete by `user_id`). Manage at `/admin/users`.
- **Privilege separation (audit fix, commit `a13d5c8`)**: user/role management server actions (`setUserBanned`, `deleteUser`, `updateUserProfile`, `addCommitteeMember`, `removeCommitteeMember`) require `isAdmin` — committee members are blocked. Complaint moderation stays committee-level. Profile reads restricted to own row (migration 014); daily complaint limit counts Asia/Kolkata day (migration 015).
- All 15 migrations (`supabase/migrations/202608110001..015`) applied to production. Apply new SQL via Management API: `curl -H "Authorization: Bearer $SUPABASE_PAT" -H "Content-Type: application/json" -d @payload.json "https://api.supabase.com/v1/projects/gmkzcxvgbhhvznbkxlae/database/query"` (build JSON payload with `node -e "console.log(JSON.stringify({query: process.argv[1]}))"`). The PAT is a local env var only — never commit it. (Push protection blocked it once in `cb5edac`; history rewritten.)

## Environment

- `.env.local` has `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Vercel MCP is now OAuth-authorized (token at `~/.mcp-auth/mcp-remote-0.1.37/`) — `vercel_*` tools work in sessions started after 21:17 Aug 11
- Lint: `npx eslint` (0 errors). QA: `node scripts/qa.mjs`

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
