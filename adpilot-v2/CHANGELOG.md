# Changelog — AdPilot OS

## v6.0.0 — Dual-mode, tiering, engine upgrades & hardening (2026-06-17)

Shipped & merged via PR #22. Built by a parallel multi-specialist effort under PM/board governance.

- **Dual-mode UX:** Simple (10-second answer) vs Advanced (`useMode`/`<ModeAware>`); Command Center
  health-trend + money-at-stake line; nav lock badges for plan-gated features.
- **Tiering & pricing:** `PLANS` ↔ `entitlements` single source + `FEATURE_DESC` benefit lines;
  `PlanMatrix` on billing + landing; AUD prices wired for display (Starter $49 / Pro $149 / Expert $399).
- **Engine:** Wilson **significance gate** on scale/kill (conservative — only ever softens);
  **break-even-CPL split** for lead-gen (`break_even_cpl`, opt-in `lead_close_rate`, migration 0023);
  new `timeseries`/`stats`/`fatigue`/`pacing` diagnostics. Read-only invariant + Python parity intact.
- **AI efficiency:** prompt caching on the static system prefix; `MODELS`/`modelFor` route light
  creative to Haiku; router persona de-grounded; orphaned `finance_content` domain wired to Paige + cron.
- **Security/privacy:** Next.js 14→16 + React 19 (cleared all critical/high production advisories);
  scoped right-to-erasure endpoint; Terms/Privacy §7 data-use/model-training DRAFT clauses.
- **Connect:** reusable read-only trust chips + one-click "Run my first audit" + hardened token validation.
- **Ops:** CI now runs `npm ci` + typecheck + a resale-clean guard with dependency caching. 484 tests.

## v4.0.0 — Integration & Optimisation (2026-06-16)

The convergence release: a 10-specialist parallel mapping pass over the markdown framework
(`CPWORK/universal-ads-os/`) + the live app, reviewed and signed off by 4 expert PMs
(engineering-delivery, product/launch, security/compliance, commercial/brand), then shipped
in a conflict-free order. Wave A below; Wave B is the dated fast-follow.

### Added
- **AI specialist grounding** — env-gated private context-pack loader (`lib/agents/context-pack.ts`)
  so business packs load at runtime and never ship in the sellable build; resale-safe
  `finance_content` knowledge domain.
- **Client-ready reports** — `lib/reports/{templates,format}.ts`: deterministic, AU-English report
  markdown built straight from the saved analysis (numbers never invented), with Riley writing
  the prose; rendered + printable on the report detail page.
- **UTM builder** (`/utm-builder`, free) — names + tagged URLs + validation to the naming standard.
- **Policy checker** (`/policy-check`, Pro) — Paige-backed Meta/TikTok/ACCC compliance check on copy.
- **Single pricing source of truth** (`lib/plans.ts`) feeding the landing, UpgradeButtons and billing,
  with a coherence drift-alarm test.
- **Legal scaffold** — `/terms`, `/privacy`, `/limitations` placeholder pages (clearly marked DRAFT,
  pending solicitor review), signup + Stripe checkout consent, `/api/data-deletion`,
  `legal_acceptances` (versioned audit trail).
- **Test coverage** 5 → ~130 engine/agent tests: metric parity, edge/divide-by-zero, health bands
  + N/A redistribution, ingest mapping, the **read-only safety invariant**, registry guardrails,
  Python↔TS drift alarm.

### Changed
- Hardened the shared specialist guardrails: AUD-by-default, AU frameworks, explicit
  no-personal-email privacy clause, anti-hype/no-earnings, honour-context-pack (tighten-only).
- Standardised every surface to **v4.0.0** (package.json, `/api/health`, landing badge); removed
  the stale "V2/V3" drift.
- Landing pricing now matches the recurring Stripe checkout (no more one-time-looking ranges).

### Fixed
- **Security:** white-label `POST` now enforces the Expert gate (was a paywall bypass on an
  RLS-bypassing admin write).
- **Billing:** Stripe webhook no longer silently drops a paid subscription when the subscription
  id is empty (partial-index `ON CONFLICT` edge).
- **Privacy/resale:** removed private business data from the shippable tree (6 locations); a
  grep-clean guard over the known private-data tokens gates distribution (enforced in CI).
- a11y labels (agency colour pickers, brand-logo alt); non-blocking ESLint config.

### Wave B (fast-follow — tracked in CPWORK/universal-ads-os/product/V4-INTEGRATION-PLAN.md)
- Ad-level sync rewrite (fixes the false-CRITICAL "zero conversions" on API-synced accounts).
- Inbound lead/CRM webhook + threshold-alert engine + lead-quality factor.
- Budget-pacing factor, agency portfolio roll-up, schema-parity migrations.

### Owner-gated (not done by the team — by design)
- Confirm recurring-SaaS AUD prices (anchors proposed: Free $0 / Starter $49 / Pro $149 / Expert $399).
- Solicitor-authored Terms/Privacy text (placeholders shipped; never AI-written as final).
- Paste a non-expiring Meta System User token to run the real-account audit.
