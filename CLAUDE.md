# CLAUDE.md — AdPilot OS project memory (read first)

> Standing context for any Claude session in this repo. Read this before acting.
> Last updated: 2026-06-16 (v4.0.0).

## What AdPilot OS is
A **read-only** Meta/TikTok paid-ads operating system: it audits ad accounts, scores a
0–100 Campaign Health Score (13 weighted factors; bands Green ≥80 / Yellow ≥60 / Orange ≥40 /
Red), and proposes safe, numbers-first fixes. It **never edits, pauses, creates, or spends on a
live ad** without an explicit typed-YES (and the live-write path is Expert-only + env-gated by
`ADS_WRITE_ENABLED`, off by default). The product **proposes; the human approves**.

## Two trees
- **`adpilot-v2/`** — the live product: Next.js 14 App Router + Supabase (RLS) + Stripe.
  Warm coral `#f9603f` / amber `#ffb224` theme.
- **`CPWORK/universal-ads-os/`** — the original markdown framework (agent playbooks, skills,
  templates, business context, product/QA docs) the app was built from. **Not deployed.**

## Architecture (live app)
- Engine: `lib/engine/*` — `analyse()` → summary, 13-factor health, findings, per-ad decisions
  (verdicts: keep/kill/reduce/refresh/scale/fix-tracking/insufficient-data; `decide().safe` is
  always true). Parity-tested against the Python oracle.
- AI specialists: `lib/agents/registry.ts` (12 personas, all share hardened `GUARDRAILS`),
  grounded by `lib/agents/knowledge.ts` (+ env-gated private packs via `lib/agents/context-pack.ts`).
- Reports: `lib/reports/{templates,format}.ts` (deterministic tables; Riley writes prose only).
- Entitlements: `lib/entitlements.ts` (gate truth) ↔ `lib/plans.ts` (pricing display truth),
  kept in sync by a drift-alarm test. Tiers: free / starter / pro / expert (`agency`→`expert`).
- Billing: Stripe (recurring subscriptions). Crons: constant-time `CRON_SECRET` (`lib/cron-auth.ts`).
- Migrations: `supabase/migrations/0001…0016`. Every table is RLS-scoped (`is_org_member`).

## Operating rules (apply to all work + all AI output)
- **Australian English, AUD by default**; AU frameworks (GST/ATO/ACCC/super/PAYG). Numbers-first,
  anti-hype: no guarantees, no absolute/earnings claims, no financial/legal/medical/tax advice.
- **Never expose a personal email**; only public business channels.
- **Resale-clean:** no private business data in the shippable tree. A grep guard
  (`snowflow|edagher`) gates distribution; private context loads only via
  `ADPILOT_CONTEXT_PACK_JSON` at runtime.
- Don't touch production data; ask before deleting/overwriting.

## Current state (v4.0.0)
Wave A shipped (guardrails + de-leak, context-pack loader, reports engine, UTM builder, policy
checker, PLANS constant, legal scaffold, ~130 tests, white-label gate + Stripe webhook fixes,
version standardisation). Verify with `tsc --noEmit` + `vitest` + `next build`. Dev branch:
`claude/kind-volta-7jk71z` (PR #22).

## What's next / owner-gated
- **Wave B** (fast-follow): ad-level sync rewrite (fixes false-CRITICAL "zero conversions" on
  API-synced accounts), lead/CRM webhook + alert engine, budget-pacing, agency portfolio.
- **Owner-only:** confirm recurring AUD prices; solicitor Terms/Privacy text (placeholders only
  shipped); paste a non-expiring Meta System User token to run the real-account audit.
- Full detail: `CPWORK/universal-ads-os/product/V4-INTEGRATION-PLAN.md` and `adpilot-v2/CHANGELOG.md`.
