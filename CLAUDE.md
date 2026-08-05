# CLAUDE.md — Apprentio

A standalone web product: sixth-form students track and get help applying to degree apprenticeships. This is a separate codebase from agenticOS — it will get its own git repo and deploy independently. agenticOS's `careers` agent is Archie's *personal* apprenticeship assistant inside his own Life OS; this app is the *product* other students use. Archie is user #1 (dogfooding), not the only user.

Full plan: `PLAN.md` in this folder. Read it before making architectural decisions — this file is the quick-reference; PLAN.md is the source of truth.

## What this is

- Aggregates UK degree apprenticeship vacancies (gov.uk Find an Apprenticeship API + a hand-curated employer list) and matches them to a student's subjects, grades, sector interest, and commute radius.
- Drafts a tailored CV and cover letter per vacancy from the student's base documents.
- **Never auto-submits.** Every application needs an explicit human approval before anything goes to an employer. See PLAN.md § Application Workflow.
- Multi-user from the start: real accounts, per-user data isolation, and the students are minors (16–18) — GDPR handling matters. See PLAN.md § Data Protection.

## Stack (decided — don't re-litigate without checking PLAN.md § Open Questions first)

- **Runtime/tooling:** bun always, never npm/npx. TypeScript always.
- **Framework:** Next.js (App Router), deployed on Vercel.
- **Data:** Supabase — Postgres + Auth + Storage, EU region (data residency for UK/EU minors' data).
- **AI drafting:** `@anthropic-ai/sdk` called server-side with the product's own API key. (The PAI `TOOLS/Inference.ts` wrapper is Archie's personal infra — it isn't available to other users of this product, so don't route through it here.)
- **Vacancy ingestion:** scheduled job (Vercel Cron) pulling the Find an Apprenticeship API, merged with a curated `employer_sources` table seeded from `seed-data/employer-sources-seed.md` (copied from Archie's own research in the agenticos vault).
- **Billing:** Stripe (Checkout + Customer Portal + webhooks). Free tier = discovery, saving, manual tracking. Premium tier = unlocks AI drafting (and later, portal-assist). See PLAN.md § Subscription model.

## Rules specific to this project

1. **Approval gate is non-negotiable.** No code path submits an application without an explicit user action on that specific application. Don't build a "batch auto-submit" feature even if asked for convenience later — flag it back to Archie instead. This applies to every tier — approval is a safety rule, not a premium feature.
2. **Subscription gating happens server-side only.** Check `profiles.subscription_tier` (sourced from Stripe webhooks) in the route handler before calling Claude — never trust a client-side flag, and never let a free-tier request reach the Anthropic API.
3. **Don't automate employer portals in the MVP.** Generate ready-to-paste tailored content + a direct link, and let the student mark "submitted" themselves. Per-employer Playwright autofill is a post-MVP, per-employer opt-in — see PLAN.md § Phase 4.
4. **Minors' data is not a toy.** Don't store more than the matching/drafting features need. Anything touching the privacy policy or ToS wording gets flagged to Archie as "needs a human/legal read," not shipped silently.
5. **Reuse Archie's existing research.** `seed-data/employer-sources-seed.md` already has 16–20 verified L6 employers with notes — seed `employer_sources` from it rather than re-researching from scratch. It's a snapshot copied in from the agenticos vault, not a live link — if it goes stale, re-copy from the vault rather than editing it out of sync.
6. **This repo is not agenticOS.** Don't import agenticOS conventions that don't apply here (the graph/memory/event-log system, the agent roster, PAI's Inference tool). It's a normal product codebase.

## Session-start

1. Read `PLAN.md` in full if this is a fresh session or the plan has changed since you last read it.
2. Check `PLAN.md` § Roadmap for the current phase and work within its scope — don't jump ahead to later-phase features.
3. If a decision in PLAN.md § Open Questions blocks the next step, ask Archie. Don't assume.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
