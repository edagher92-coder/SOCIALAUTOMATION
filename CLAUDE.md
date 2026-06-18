# CLAUDE.md — AdPilot OS project memory (read first)

> Standing context for any Claude session in this repo. Read this before acting.
> Last updated: 2026-06-17 (v6.0.0).

## What AdPilot OS is
A **read-only** Meta/TikTok paid-ads operating system: it audits ad accounts, scores a
0–100 Campaign Health Score (13 weighted factors; bands Green ≥80 / Yellow ≥60 / Orange ≥40 /
Red), and proposes safe, numbers-first fixes. It **never edits, pauses, creates, or spends on a
live ad** without an explicit typed-YES (and the live-write path is Expert-only + env-gated by
`ADS_WRITE_ENABLED`, off by default). The product **proposes; the human approves**.

## Two trees
- **`adpilot-v2/`** — the live product: Next.js 16 App Router + React 19 + Supabase (RLS) + Stripe.
  Warm coral `#f9603f` / amber `#ffb224` theme. Dual-mode UX (Simple/Advanced via `useMode`).
- **`CPWORK/universal-ads-os/`** — the original markdown framework (agent playbooks, skills,
  templates, business context, product/QA docs) the app was built from. **Not deployed.**

## Architecture (live app)
- Engine: `lib/engine/*` — `analyse()` → summary, 13-factor health, findings, per-ad decisions
  (verdicts: keep/kill/reduce/refresh/scale/fix-tracking/insufficient-data; `decide().safe` is
  always true). Parity-tested against the Python oracle. V6 added: a **Wilson significance gate**
  on scale/kill (`stats.ts`), `timeseries.ts`/`fatigue.ts`/`pacing.ts` diagnostics, and a
  **break-even-CPL split** for lead-gen (`break_even_cpl`, opt-in `lead_close_rate`).
- AI specialists: `lib/agents/registry.ts` (12 personas, all share hardened `GUARDRAILS`),
  grounded by `lib/agents/knowledge.ts` (+ env-gated private packs via `lib/agents/context-pack.ts`).
  Efficiency: system prefix is prompt-cached (`cacheSystem`); light creative routes to Haiku via
  `MODELS`/`modelFor` (`lib/ai/claude.ts`); router persona carries no benchmark knowledge.
- Reports: `lib/reports/{templates,format}.ts` (deterministic tables; Riley writes prose only).
- Entitlements: `lib/entitlements.ts` (gate truth + `FEATURE_DESC` benefit lines) ↔ `lib/plans.ts`
  (pricing display truth), kept in sync by a drift-alarm test. Tiers: free / starter / pro / expert
  (`agency`→`expert`). `PlanMatrix` surfaces the differentiation on billing + landing.
- Billing: Stripe (recurring subscriptions). Crons: constant-time `CRON_SECRET` (`lib/cron-auth.ts`).
- Migrations: `supabase/migrations/0001…0023` (intentional gaps; never backfill). Every table is RLS-scoped (`is_org_member`).

## Operating rules (apply to all work + all AI output)
- **Australian English, AUD by default**; AU frameworks (GST/ATO/ACCC/super/PAYG). Numbers-first,
  anti-hype: no guarantees, no absolute/earnings claims, no financial/legal/medical/tax advice.
- **Never expose a personal email**; only public business channels.
- **Resale-clean:** no private business data in the shippable tree. A grep guard
  (`snowflow|edagher`) gates distribution; private context loads only via
  `ADPILOT_CONTEXT_PACK_JSON` at runtime.
- Don't touch production data; ask before deleting/overwriting.

## Current state (v6.0.0 — shipped & merged)
V6 shipped and merged to `main` via PR #22 (merge `c8617eb`): dual-mode UX, tier differentiation
+ wired AUD pricing, the engine upgrades above, AI cost routing (prompt caching + Haiku tiers),
Next 16 / React 19 security migration, scoped right-to-erasure, connect trust chips + one-click
"Run my first audit", and DRAFT legal frameworks (two-partner reviewed). **484 tests** green;
verify discipline = `tsc --noEmit` + `vitest run` + `next build` (also enforced in CI, which now
runs a typecheck step + a resale-clean guard). Note: `package-lock.json` is gitignored, so CI uses
`npm install` (not `npm ci`). Continue new work on a fresh branch off `main`.

## What's next / owner-gated
- **Build roadmap (board-reviewed, not owner-gated):** see `CPWORK/.../product/v6-skills-board/`
  — integration big bets (Adobe Firefly creative in the Studio; Zapier as Milo's engine + no-code
  CRM bridge; real PDF reports + Drive/Gmail delivery), a CRO/funnel + lead-gen knowledge domain,
  and harness adoptions (SessionStart verify hook, pre-PR code/security review).
- **Owner-only (the launch blockers):** AUD prices wired for display (Starter $49 / Pro $149 /
  Expert $399, annual ≈2 months free) — still need the matching **Stripe price IDs**;
  admitted-solicitor sign-off of the DRAFT Terms/Privacy frameworks (`CPWORK/.../legal/` — key open
  issue: lead-hash likely personal info); paste a **non-expiring Meta System User token** to run the
  real-account audit. Live-write: board recommends `ADS_WRITE_ENABLED` stays **OFF** for launch
  (memo in `product/v6-governance/`). Production deploy needs Vercel env + Supabase migrations 0001–0023.
- Full detail: `adpilot-v2/CHANGELOG.md` and `CPWORK/universal-ads-os/product/V6-*.md`.
