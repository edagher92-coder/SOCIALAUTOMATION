# AdPilot OS — V4 Integration & Optimisation Plan (Convergence Synthesis)

**Status:** DRAFT for PM review · **Date:** 2026-06-16 · **Branch:** `claude/kind-volta-7jk71z`
**Method:** A 10-specialist parallel mapping pass (read-only) over `CPWORK/universal-ads-os/*` (the markdown framework) vs `adpilot-v2/*` (the live Next.js + Supabase + Stripe product). This document synthesises all 10 specs into one v4 plan. Four expert PMs (engineering-delivery, product/launch, security/compliance, commercial/brand) review and converge this into the final approved cut before implementation.

**Baseline verified:** `tsc --noEmit` clean · `vitest` 232/232 · migrations `0001→0011` · `package.json` 2.0.0. PR #21 hardening (constant-time cron secret, AES-256-GCM token vault, OAuth state→user binding, Stripe plan validation, RLS everywhere, `/api/health`) holds under re-audit — **no new P0 security/sell-blockers**.

---

## 1. The headline: the team & stack are already wired

All 12 specialists already live in `lib/agents/registry.ts`, grounded by `lib/agents/knowledge.ts` (which already bakes in the Snowflow CTWA facts), surfaced via `/ai-specialists`, `/command`, `/api/agents/run`. The health engine already implements the canonical 13-factor score with identical weights and bands. So v4 is **fill-the-gaps + optimise + harden + de-leak + version + memorialise**, not a rebuild.

---

## 2. Workstreams (condensed from the 10 specs)

Each: finding → proposed build → key files → gating → **call** (IN v4 / DEFER / OWNER-gated).

### WS1 — Skills → product features (Skills mapper)
~9 of 24 skills already built into engine/personas; ~8 are real new features; ~8 are reference/private. Top first-wave features:
- **B5 UTM builder** (`lib/utm.ts` + `app/(app)/utm-builder/page.tsx`) — pure, free, no AI/DB. **IN.**
- **B1 Policy checker** (`app/api/policy/check/route.ts` + `policy-check/page.tsx`, backed by Paige + knowledge.policy). Gate `ai_team`. **IN.**
- **B3 Narrative report generator** (see WS3 — same work). **IN.**
- **B2 Budget-pacing factor** (`lib/engine/pacing.ts`; replace hard-coded `budget_pacing=85` in `audit.ts`). Needs a monthly-budget field. **IN (engine) / budget field DEFER to WS schema.**
- **B4 Lead-quality analyser** (`lib/engine/leadquality.ts` + page) — overlaps WS5 lead loop. **DEFER to WS5.**
- Private packs `profit-minute-au-context`, `snowflow-business-context` → **do NOT ship into core** (WS2).

### WS2 — Grounding & operating rules (Grounding mapper)
- **Harden shared `GUARDRAILS`** in `registry.ts`: add AUD-by-default, AU frameworks (GST/ATO/ACCC/super/PAYG), explicit **no-personal-email** privacy clause, anti-hype/no-absolute/no-earnings, honour-active-context-pack-can-only-tighten. Pure string change, propagates to all 12. **IN.**
- **Add `finance_content` knowledge domain** (resale-safe, generic finance-education compliance discipline), defined-but-unmapped so sellable build is byte-identical. **IN.**
- **Context-pack loader** (`lib/agents/context-pack.ts`, env-gated `ADPILOT_CONTEXT_PACK`, non-committed source) so private packs load at runtime, never ship. **IN (loader) — small.**
- **DE-LEAK (P1):** Snowflow $-economics hardcoded in `knowledge.ts` `meta` block; "Sam"/rent-to-own in `MessengerSetup.tsx`; `edagher92`/Snowflow in docs. Move private figures into the pack; genericise component + docs. **IN.**

### WS3 — Templates → Reports (Reports mapper)
- New `lib/reports/templates.ts` (section skeletons + `{{client.*}}`→data map + safety header/footer constants) and `lib/reports/format.ts` (pure: payload→deterministic markdown tables; Riley writes prose only — numbers never hallucinated) + tests.
- Additive `payload.summary` enrichment in `lib/engine/index.ts` (surface impressions/clicks/reach/ctr/cpc/cpm/frequency/conv_rate/cpl already computed). Backward-compatible.
- Riley prompt extension + report path in `app/api/agents/run/route.ts`; render upgrade on `reports/[id]/page.tsx` (+ branded PDF via existing PrintButton). **IN.**

### WS4 — Product/marketing/onboarding (Product mapper)
- **OWNER DECISION (blocks pricing copy):** markdown sells a one-time product (Starter/Pro/Agency/Done-With-You); landing shows one-time ranges; **app runs recurring Stripe subscriptions** (free/starter/pro/expert). A buyer reading "$497–1,497" then hitting recurring checkout is a pricing-transparency problem. Need: confirm recurring-SaaS + actual AUD prices + keep `agency`→`expert` alias + DWY stays off-app. **OWNER-gated.**
- Unblocked now: SOPs + support-docs → `docs/USER-MANUAL.md` ↔ `manual/page.tsx` (glossary, thresholds, troubleshooting, FAQ); white-label in-app help; onboarding-flow → `demo-guide` rewritten to in-app actions. **IN.**
- Consolidate plan facts to a single `PLANS` constant read by landing + UpgradeButtons + billing (they currently disagree). **IN (after pricing decision).**

### WS5 — Automations (Automations mapper)
Core loop already native. Extend:
- **Threshold-alert rule library** (`lib/cron/alerts.ts` + `alert_thresholds`/`alert_events`), folded into existing crons. **IN.**
- **Inbound lead/CRM webhook** (`app/api/webhooks/crm/route.ts`, HMAC, hashed PII, `lead_events`) → finally populates `lead_quality_score`. Highest-value missing loop. **IN.**
- CSV/Sheets export (`app/api/export/sheet/route.ts`) — overlaps WS9. **IN (CSV).**
- Weekly-digest upgrade (white-label + WoW). **IN.**
- Offline-conversion upload → **REFERENCE ONLY** (needs write scope; breaks read-only). **DEFER/never.**
- New gates: `threshold_alerts:starter`, `sheet_export:starter`, `lead_quality_loop:pro`, `outbound_webhooks:pro`.

### WS6 — Legal/compliance/safety (Legal mapper)
- **P0 (blocks payment AND Meta/TikTok App Review):** no Terms/Privacy/Limitations pages; signup + Stripe checkout take accounts/money with no acceptance; no footer legal links; no data-deletion endpoint.
- **Scaffold in code (IN):** `app/(marketing)/{terms,privacy,limitations}/page.tsx` placeholder pages with a visible "DRAFT — solicitor review required" banner; signup acceptance checkbox + `legal_acceptances` store; Stripe `consent_collection`; footer links; `app/api/data-deletion/route.ts`.
- **Legal TEXT is OWNER/solicitor-only — do NOT ship AI-written Terms/Privacy as final.** ACL s64A non-excludable-guarantees notice, liability cap, GST treatment, ABN/governing law = owner facts.
- Safety model verified real in code (kill-switch off by default, least-privilege scopes, exact typed-YES, reversible capture). No safety defects.

### WS7 — QA/tests (QA mapper)
TS engine ships only 5 tests vs Python oracle's 44; `registry.ts` has **zero** coverage. Add ~90–110 assertions:
- `metrics.parity.test.ts` + `metrics.edge.test.ts` (MC-01..14, EC-01..04) — surfaces missing `effectiveQualifiedCpl`.
- `health.parity.test.ts` (bands + N/A redistribution).
- `registry.test.ts` + `decisions.safety.test.ts` (the safety invariants — highest risk; `decide().safe===true` always; kill=pause-never-delete; scale-gating).
- `ingest.test.ts` + band fixtures + `parity.contract.test.ts` (Python↔TS drift alarm). **IN.**
- 4 doc-vs-code reconciliation findings (Dataset-2 band conflict; decision-floor 20/5 vs 50/15; missing `effectiveQualifiedCpl`; band-label drift) → **OWNER/doc fix.**

### WS8 — API/data-schema parity (API mapper)
- **Correctness (high impact):** `pull.ts` syncs at **campaign grain and writes zero conversions** → every API-synced account looks like "spend, no results" → **false CRITICAL** tracking finding. Switch to **ad-level** pull with `actions`/`action_values` + video metrics (read-only scopes unchanged). **IN — keystone.**
- Schema parity migration: add ad-grain ids, video (`six_second_views`), `utm_content`/`utm_term`, budgets, `sales_count`/`gross_profit`, normalise `tracking_status` vocab. **IN.**
- CTWA/messaging attribution: parse `referral.source_id`/`ctwa_clid`, subscribe `messaging_referrals`, store attribution-only (hashed). **IN (read-only).**

### WS9 — Dashboards (Dashboards mapper)
- `/build-dashboard` is static → make actionable: external template links + per-org universal-schema **CSV export** (`app/api/dashboards/export/route.ts`). **IN.**
- Close `/command` + `reports/[id]` parity gaps: MTD KPI row, 13-factor breakdown (data exists: `health_scores.breakdown` + engine `weakest`), 7-day health trend, campaigns/top-creatives tables — pure presentation. **IN.**
- Multi-client **portfolio roll-up** (`app/(app)/portfolio/page.tsx`) for agency tier. **DEFER (larger; agency).**
- **BUG (P1 security):** `app/api/white-label/route.ts` POST does not check `can(plan,"white_label")` — any plan can save branding. **IN — fix.**

### WS10 — Readiness re-audit (Readiness mapper)
P1s: docs read-only claim vs Ad-Actions writer; GO-LIVE mistitled "v3" + "Snowflow"; Stripe webhook partial-index empty-subscription edge → guard `if(!s.subscription)`; `ensureOrg` check-then-insert race. P2s: Ad-Actions richer empty state; 2 a11y labels (agency colour-picker `aria-label`, decorative img); dedicated OAuth-callback test; non-blocking ESLint config; `multi_client` not enforced on org-switch. **IN (P1s) / IN-cheap (P2 a11y, ESLint, OAuth test).**

---

## 3. Cross-cutting decisions

### 3.1 Migration numbering (resolve collisions)
Several specs proposed colliding `0012/0013`. Canonical order for v4:
- `0012_schema_parity.sql` (WS8: ad-grain ids, video, UTMs, budgets, sales/profit, tracking_status vocab)
- `0013_messaging_attribution.sql` (WS8: CTWA/messaging leads, hashed)
- `0014_alerts.sql` (WS5: alert_thresholds + alert_events)
- `0015_lead_quality.sql` (WS5: lead_events / CRM webhook)
- `0016_legal_acceptances.sql` (WS6: terms acceptance audit trail)
- `0017_report_config.sql` (WS3 optional: monthly_budget/reporting_frequency/platform_focus) — only if WS3 budget pacing lands.

### 3.2 Version label
Codebase is `2.0.0`/"V2"; docs say "v3"; user wants "a whole new version." **Proposal:** standardise EVERY surface to one label and bump `package.json` + `/api/health` version. Recommend **v4.0.0** as the release name (optimisation + completion), kill all "V2/V3" drift in one pass. (Commercial PM to confirm the exact number.)

### 3.3 Private-pack separation (the resale guarantee)
GUARDRAILS hardening + `finance_content` (resale-safe) ship in core; ALL brand/business specifics (Snowflow figures, Profit Minute voice, "Sam", personal handle) load only via the env-gated context-pack loader and are `.gitignore`d. Sellable build contains zero private data.

---

## 4. OWNER-gated items (cannot be done by the team)
1. **Pricing model + AUD prices (WS4)** — recurring-SaaS confirm + the actual numbers. Blocks pricing copy only.
2. **Legal text (WS6)** — Terms/Privacy/ACL wording from an AU solicitor; team ships placeholders + wiring.
3. **Real Snowflow audit (Phase 2)** — needs a non-expiring System User token pasted; team verifies the pipeline is one-step-ready.
4. **Doc reconciliations (WS7)** — pick the canonical band thresholds / decision-floor numbers.

---

## 5. Proposed v4 cut line (for PM approval)

**WAVE A — ship in the v4 PR (high value, low risk, conflict-free, owner-unblocked):**
- WS2 GUARDRAILS hardening + `finance_content` + context-pack loader + de-leak (Snowflow figures, MessengerSetup, docs).
- WS1 UTM builder + Policy checker.
- WS3 Reports (templates + format module + summary enrichment + Riley path + render upgrade).
- WS7 the full test expansion (parity, edge, health, registry-safety, decisions-safety, ingest, drift alarm).
- WS9 `/command` + report presentation parity (breakdown, trend, MTD, campaigns) + white-label gate fix + CSV export.
- WS10 all P1s + cheap P2s (a11y, ESLint, OAuth-callback test).
- WS6 legal SCAFFOLD (placeholder pages + banner + signup/checkout acceptance + footer + data-deletion endpoint + `legal_acceptances`). Text = owner/solicitor.
- Version standardisation to v4 + CHANGELOG + memory artifact + GitHub/Drive distribution.

**WAVE B — fast-follow PR(s) (bigger / owner-gated / needs new data):**
- WS8 ad-level pull rewrite + schema-parity migration + CTWA attribution (keystone but large; touches sync + migrations + messenger — sequence carefully).
- WS5 threshold-alert engine + inbound lead/CRM webhook + lead-quality factor.
- WS1 B2 budget-pacing factor (needs monthly_budget) + B4 lead-quality analyser (needs WS5).
- WS9 portfolio roll-up (agency).
- WS4 pricing copy (after owner pricing decision); SOP/manual content port can land in Wave A or B.

**Rationale for the cut:** Wave A is almost entirely additive, conflict-free, and independently verifiable (`tsc`+`vitest`+`build`), and it captures the safety, de-leak, test-parity, and presentation wins that make v4 genuinely "complete + optimised + sellable-shaped." Wave B carries the changes that touch the live data pipeline (sync grain, new migrations, inbound webhooks) and the owner-gated pricing — worth isolating so a regression there can't hold back Wave A.

---

## 6. Conflict-free file ownership (Wave A)
- `registry.ts` (WS2) and `knowledge.ts` (WS2) — single owner, do first (GUARDRAILS + finance_content + de-leak).
- `lib/engine/index.ts` summary enrichment (WS3) — coordinate with nothing else in Wave A.
- New modules only (no contention): `lib/utm.ts`, `lib/reports/*`, `lib/agents/context-pack.ts`, `app/(marketing)/*`, `app/api/policy/*`, `app/api/dashboards/export`, `app/api/data-deletion`, test files.
- `app/(app)/command/page.tsx` + `reports/[id]/page.tsx` (WS9 presentation) — single owner.
- `app/api/white-label/route.ts` (WS9 gate fix), `app/login/page.tsx` + `app/api/stripe/checkout/route.ts` (WS6 acceptance), `docs/GO-LIVE.md` (WS10) — disjoint, safe in parallel.

---

## 7. Memory & distribution (post-build)
- **Memory:** author `adpilot-v2/MEMORY.md` (or repo-root context file) describing shipped v4: architecture, agent/skill stack, what integrated, decisions + deliberate skips, operating rules (AUD/AU-English/$325/read-only/no-personal-email), live state — read-first by future sessions.
- **GitHub:** keep the curated docs version-controlled + a repo-root pointer.
- **Google Drive:** push the curated set + memory into `08 - AdPilot OS (Live Demo)` (folder id `1SRTnxW_w4RM0TpFIDOtDwN2APejKZAaE`), mirroring the Claude HQ `00 - Claude Context` pattern. Only the PM-determined worthwhile set.

---

## 8. What the PMs must decide
1. Approve / amend the **Wave A vs Wave B cut**.
2. Confirm the **version label** (v4.0.0?) and that all V2/V3 surfaces standardise to it.
3. Confirm the **legal scaffold-not-text** boundary and the placeholder banner wording.
4. Confirm **migration numbering** 0012→0016.
5. Flag anything in Wave A that should drop to Wave B (risk) or rise from Wave B (value).
6. Sign off the **owner-gated list** as genuinely owner-only (not faked).
