# AdPilot OS — V6 Phase Roadmap (build-ready, sequenced)

> **Owner:** V6 lead PM/architect (management convergence of the 8 Phase-0 research streams).
> **Date:** 2026-06-16 · **Status:** Converged roadmap, ready to build.
> **Inputs:** `V6-MASTER-PLAN.md`, `V6-DECISION-LOG.md`, and `product/v6-research/01..08`.
> **Base:** v4.0.0 (PR #22). Branch base: `claude/kind-volta-7jk71z`.
>
> This document sequences every shippable V6 item into **7 phases** (P1–P7), each independently
> shippable and verifiable. Owner-gated items (pricing, the auto-execute "controlled middle", etc.)
> are **deferred to just before upload** and tracked in the **Owner Decision Queue** (§ end).

---

## 0. How this roadmap was converged (the management view)

The owner's weighted priorities drive sequencing:

1. **Cluttered UI → Simple + Advanced views is the #1 felt pain** → dual-mode (stream 02) is an
   **early, visible** phase (P2), riding a thin foundation (P1) so it doesn't get blocked.
2. **Best-in-world at automation / evaluation / diagnostics** → these are the substance phases
   (P3 diagnostics, P4 AI evals/orchestration, P5 automation, P6 creative/CRO) and they all
   depend on two foundational unlocks shipped first.
3. **Revenue-driving features (client $ / owner $ / dev $)** → monetisation (stream 07) is woven
   through (reverse-trial + "wasted-spend found" early; white-label depth + marketplace later, P7),
   because it depends on diagnostics value surfaces existing first.
4. **"Generations ahead"** → the differentiators (predictive creative fatigue, significance-gated
   verdicts, safe-by-construction auto-execute, explainability "prove the maths") are explicitly
   scheduled, not aspirational.

**The two foundational unlocks that gate almost everything else** (so they go in P1):
- **The cron fan-out fix** (stream 08, §1.1 — the single biggest *silent-failure* scale risk;
  already >60s at ~10 orgs, Vercel-capped, fails silently by truncating the org list).
- **The trend data model** (streams 04 + 08 — `campaign_snapshots` is already a per-ad daily
  series but *nothing reads it as a series*; every trend/forecast/fatigue/anomaly capability is
  latent in data we already store). Without append-only health-score history + a daily rollup,
  diagnostics (P3) and dual-mode dashboards (P2) have nothing to chart.

### Cross-cutting decisions resolved up front (so no phase re-litigates them)

| # | Cross-cutting item | Resolution | Where it lands |
|---|---|---|---|
| X1 | **Migration numbering** | Next migration is **`0021`**. Migrations **0012–0015 were never created** (the live tree goes 0011 → 0016 → … → 0020); this is an intentional/known gap, **not** lost work. **Do not** attempt to "backfill" 0012–0015 — leave the gap, document it here, and number all V6 migrations from 0021 upward, contiguously. (stream 08 §1.7/§2.5) | P1 (note + first V6 migration is 0021) |
| X2 | **Divergent LQS formulas** | Two formulas exist in framework docs (outcome-table in `lead-quality-feedback-loop.md` vs `min(round(base × size_multiplier),10)` in `zapier-zaps.md`). **Canonical = the outcome-table model.** Implement once, in one place, parity-tested. (stream 03 §C5, §5) | P5 (LQS loop) |
| X3 | **`break_even_cpa` overloaded for CPL** | Split into **`break_even_cpl`** (cost-per-lead) vs `break_even_cpa` (cost-per-acquisition/purchase). Touches `lib/engine/metrics.ts` + every consumer; do it **inside the diagnostics foundation** so downstream fatigue/CRO/significance work builds on the corrected names. (stream 03 §5, stream 04 §0) | P3 (diagnostics foundation) |
| X4 | **Trend data model** | `health_score_snapshots` (append-only daily) + `account_daily_metrics` (pre-aggregated daily rollup). Written from `scoreAndAlertOrg`; **`analyse()` contract untouched** (snapshotting is write-side only — the key to "no regressions"). (streams 04 §0, 08 §2.1) | P1 |
| X5 | **AI eval harness** | Tier-1 deterministic guards on 100% of outputs + Tier-2 Opus LLM-as-judge; encode the 125-case `qa/prompt-tests.md` (incl. 8 zero-tolerance adversarial) as executable vitest fixtures. **Ship the eval net BEFORE the orchestration/tool-use changes it must protect.** (stream 05 §3, §7) | P4 (first item in the phase) |
| X6 | **Meta CTR units** | Guard `ctr > 1` → ÷100 (% → decimal). Fold into the metrics correction alongside X3. (stream 03 §5) | P3 |
| X7 | **TikTok metric proxies are lossy** | `three_second_views ← 2s`, `thruplays ← p100`, `saves ← likes`. Any cross-platform rule/fatigue score must account for this; label proxied fields. (stream 03 §5, stream 04) | P3 + P6 (creative scorer) |
| X8 | **One-time vs recurring pricing conflict** | Recurring-SaaS is **canonical** for the app; treat the legacy `pricing-tiers.md` one-time $97–$4,997 figures as DWY/services only. (stream 07 §1) | P7 + Owner Queue |

**Invariants protected in every phase (non-negotiable):**
read-only / `decide().safe === true`; `ADS_WRITE_ENABLED`-off + typed-YES unbypassable; RLS on every
table (`is_org_member`); resale-clean grep guard (`snowflow|edagher`, `sk-ant-`, `EAA`); AU English /
AUD; no faked pricing/legal; **the 41-file / ~431-case suite never regresses** and oracle-parity +
entitlements↔plans drift alarm stay green as release gates.

**Universal verification gate (applies to EVERY phase before sign-off):**
`tsc --noEmit` clean · `vitest run` green (≥431 cases, no regressions; new tests added per phase) ·
`next build` succeeds · resale-clean grep guard passes · parity + drift alarms green.
Phase-specific gates are listed per phase below.

**Impact tags:** **Client $** (advertiser revenue/value) · **Owner $** (AdPilot monetisation/retention) ·
**Dev** (effort S/M/L/XL). **RO-RISK** = read-only-invariant risk (None / Low / Contained-behind-existing-gates).

---

## Phase 1 — Foundations: queue the cron, build the trend tables, telemetry & hygiene

**Goal:** Remove the silent-failure scale risk and lay the data substrate that unblocks diagnostics
and dual-mode dashboards — without touching the parity-tested engine contract. This is the
lowest-glory, highest-leverage phase: nothing visible ships to clients, but P2–P6 are impossible
without it. Everything here is additive/structural.

**Items (cited):**
- **P1.1 Cron fan-out fix — Phase-1 shape** (stream 08 §1.1, §2.2 Phase-1; stream 03 E1).
  Inside `auto-sync` / `auto-analysis` / `publish`: replace the sequential per-platform loop with
  `Promise.all([metaPull, tiktokPull])`; per-org try/catch (already isolated); exponential backoff
  on 429/5xx; a **hard time-budget guard that records "deferred" orgs rather than truncating
  silently**. *(Full QStash/Inngest queue is P1.2-deferred → see note; the cheap parallelise+guard
  removes the CRITICAL silent-truncation now.)* — **Client $: Med · Owner $: High · Dev: M · RO-RISK: None.**
- **P1.2 Sync robustness** (stream 08 §1.6): add Meta pagination loop + TikTok page-cursor loop
  (today both silently truncate >1000 ad-days / single request); 429/5xx backoff. Pairs with the
  Wave-B correctness work (min-volume gate lands in P3). — **Client $: High · Owner $: Med · Dev: S–M · RO-RISK: None.**
- **P1.3 Trend data model** (X4; streams 04 §0, 08 §2.1): migration **`0021`** adds
  `health_score_snapshots` (append-only daily: `org_id, scope, entity_key, date, total, band,
  breakdown jsonb, data_confidence`; index `(org_id, scope, date)`) and `account_daily_metrics`
  (`org_id, platform, date, spend, impressions, leads, purchases, revenue, roas, cpa, health_score`;
  index `(org_id, date)`). Write one row/scope/day from `scoreAndAlertOrg`; **never overwrite;
  `analyse()` untouched.** Backfill offline/batched. — **Client $: Med (enables) · Owner $: High · Dev: M · RO-RISK: None.**
- **P1.4 Telemetry** (stream 08 §2.3, §4 Phase-1): `ai_usage` table (input/output/cache_read tokens +
  cost per call), cron-duration metric, Sentry errors — all best-effort/try-catch wrapped (matches
  the existing email-degradation pattern so logging can never break a request). — **Client $: Low · Owner $: Med · Dev: S · RO-RISK: None.**
- **P1.5 Indexes & migration hygiene** (X1; stream 08 §1.7, §2.5): add
  `audit_logs(organisation_id, created_at desc)`, `health_scores(organisation_id, period_end desc)`,
  `recommendations(organisation_id, created_at desc)`, confirm a `memberships(user_id, organisation_id)`
  index for the RLS path; `CREATE INDEX CONCURRENTLY`. **Document the 0012–0015 gap as intentional;
  number from 0021.** — **Client $: Low · Owner $: Med · Dev: S · RO-RISK: None.**
- **P1.6 vitest coverage thresholds** (stream 08 §3): add coverage gates (≥80% on `lib/engine`,
  `lib/agents`, `lib/entitlements`, `lib/sync`, `lib/cron`) so later phases can't silently erode the net.

**Dependencies:** none (this is the base). Must merge before P2/P3.

**File ownership (conflict-free):**
`adpilot-v2/app/api/cron/{auto-sync,auto-analysis,publish}/route.ts`, `lib/sync/pull.ts`,
`lib/cron/score.ts` (write-side snapshot calls only), **new** `supabase/migrations/0021_trend_tables.sql`
+ `0022_indexes_telemetry.sql`, **new** `lib/telemetry/*` (`ai_usage`, cron-duration), `vitest.config.ts`,
`vercel.json` (cron config only). *No engine `analyse/decide/metrics/health/audit` files touched here.*

**Verification gate:** universal gate **+** new snapshot-schema parity test (asserts the two new tables'
shape) · cron-duration recorded & `deferred>0` surfaces (no silent truncation) · backfill is reversible ·
index migrations apply with `CONCURRENTLY` (no table-lock on deploy).

**Impact (phase): Client $ Med · Owner $ High · Dev M.** *Foundational — unblocks P2/P3.*

> **Deferred within this stream → P5/owner:** the full **QStash/Inngest fan-out queue** (stream 08
> §2.2 Phase-2) is sequenced into P5 (automation, where job volume actually multiplies) and run in
> shadow before flipping the schedule. P1 ships only the cheap parallelise+time-budget guard, which
> is sufficient to clear the CRITICAL risk at current scale.

---

## Phase 2 — Dual-mode UX: Simple + Advanced (the owner's #1 ask)

**Goal:** Kill the "very cluttered" pain. Make the existing-but-inert `mode` provider actually
govern **(a) which nav items render** and **(b) per-page density**, ship the **Simple 10-second
answer** screen and a **lite Settings**, and lay the shared-primitive + `<ModeAware>` foundation so
every later page can declare both views once. Early and *visible* per the owner mandate.

**Items (cited):**
- **P2.1 Mode-and-plan-aware nav** (stream 02 §5, §6.1; stream 08 §2.4): add metadata to nav items
  (`minMode?: "advanced"`, `feature?: Feature`, `collapsed?`, `paletteOnly?`); Simple = **5 spine
  items** (Home, Fixes, Reports, Settings, Help); Advanced = **~12 grouped** + palette for the long
  tail. `plan` passed server-side into the shell (no hydration flash). Relabel toggle **"Simple /
  Advanced"**; drop per-item description sub-lines; standardise icons. — **Client $: Med (UX) · Owner $: High (activation/retention) · Dev: M · RO-RISK: None.**
- **P2.2 Simple Home — the 10-second answer** (stream 02 §3): one-column Health hero + plain-English
  sentence + **money-impact strip** ("~$980/mo going to ads that aren't working" / "$19 over your
  break-even cost per lead") + **top-3 fixes** + one CTA ("Review & approve fixes →"). Reuses
  existing economics + per-ad decisions; **no new data**. Get-started empty-state with Upload-CSV
  (free) + Connect (gated, soft-nudge never dead button). — **Client $: Med · Owner $: High · Dev: M · RO-RISK: None.**
- **P2.3 Shared UI primitives + `<ModeAware>` / `<FeatureGate>`** (stream 02 §6.3; stream 08 §2.4):
  extract `Button`/`Card`/`Table`/`Stat`/`Field` (PageHeader exists); `<ModeAware beginner=… advanced=…>`
  and `<FeatureGate feature=…>` (soft upgrade nudge, never a dead control). Bounds the dual-mode
  regression surface for all later phases. — **Client $: Low · Owner $: Med · Dev: L · RO-RISK: None.**
- **P2.4 Lite Settings + density** (stream 02 §3.2, §6.2): Simple Settings = the 3 numbers that change
  the answer (avg sale, gross margin, monthly budget); cadence/custom-hours/alerts hidden until
  Advanced. Mode cookie mirrored from localStorage for SSR (no flicker). Move Claude API key into
  Settings → Advanced; Notifications under Account/Settings. — **Client $: Low · Owner $: Med · Dev: S–M · RO-RISK: None.**
- **P2.5 "Wasted-spend found" surface** (stream 07 §5.1): make the money-impact figure a *live
  computed* hero metric (dashboard + reports), not a sales line — the strongest renewal justification
  for a read-only tool. (Reuses P2.2 economics; appears in both modes.) — **Client $: Med · Owner $: High (retention) · Dev: S · RO-RISK: None.**

**Dependencies:** P1 (mode cookie/SSR uses shell wiring; "wasted-spend" reads existing engine output;
trend sparklines on Advanced Home are wired in P3 but the layout slots are reserved here).

**File ownership (conflict-free):**
`adpilot-v2/components/{AppShell,mode}.tsx`, **new** `components/ui/*` (primitives), **new**
`components/ModeAware.tsx` + `FeatureGate.tsx`, `app/(app)/command/*` (Simple Home layout),
`app/(app)/settings/*` (lite vs full), `app/(app)/proposals/*` (rename surface "Fixes"),
`components/AnalyzeClient.tsx` (already mode-branches — keep). *No engine, no migration, no cron files.*

**Verification gate:** universal gate **+** Playwright dual-mode smoke (mode persists; Simple renders
5 nav items; Advanced renders the grouped set; **no data divergence between the two views of the same
page**) · `ModeAware`/`FeatureGate` unit tests · no locked-but-irrelevant nav item shown as a peer ·
Ad Actions never appears in Simple (mode controls visibility, plan controls capability — both must pass).

**Impact (phase): Client $ Med · Owner $ High · Dev L.** *The flagship visible win.*

---

## Phase 3 — Diagnostics foundation + the headline differentiators

**Goal:** Be best-in-world at *diagnosing*. Teach the engine to read `campaign_snapshots` as a
per-ad daily time series (the single biggest accuracy unlock), correct the two consistency flags,
and ship the differentiators: **predictive creative fatigue (2–3 day lead)**, **hook/hold funnel
decomposition**, **significance-gated kill/scale verdicts**, and **platform-vs-CRM reconciliation**.
All read-only / proposal-only; deterministic, library-light, parity-tested.

**Items (cited — all from stream 04 unless noted):**
- **P3.0 Consistency-flag corrections (do first in-phase)** (X3, X6; stream 03 §5): split
  `break_even_cpa` → add **`break_even_cpl`**; add CTR `>1` ÷100 guard; label lossy TikTok proxies
  (X7). These rename/clean the metric layer the rest of the phase builds on. — **Dev: S · RO-RISK: None.**
- **P3.1 `lib/engine/timeseries.ts`** (items 1–4): multi-window rolling aggregates (1/3/7/14d) + WoW
  deltas; trend slope + consecutive-day runs; statistical anomaly (median±k·MAD, k≈3) incl.
  missing-day/sync-gap detection; period-over-period sparklines. Pure reducers over rows we already
  pull. — **Client $: High · Owner $: Med · Dev: Low–Med · RO-RISK: None.**
- **P3.2 `lib/engine/stats.ts` + significance-gated verdicts** (items 11–14): Wilson CIs on CTR/CVR;
  CPA/ROAS ranges; **require the CI to clear break-even before kill/scale** (Bayesian-probability
  framing: "83% probability true CPA is above break-even"); continuous data-confidence. **This is the
  highest accuracy-to-effort item** — stops killing winners on a noisy fortnight. — **Client $: Very High · Owner $: High · Dev: Med · RO-RISK: None.**
- **P3.3 Per-ad creative-fatigue scorer + early-warning** (items 7–9; also stream 06 Feature A):
  per-ad fatigue score (0–100) from a weighted signal stack (frequency / CTR-decay from a *real*
  trailing-7d peak — kills the caller-supplied `ctrPeak` hack / WoW CPM&CPA / creative-age buckets);
  **hook/hold funnel decomposition** (located failure: low hook = first 1.7s; good hook + low hold =
  body/pacing; good through-funnel + low CVR = landing page); **early-warning (item 9, the headline):
  falling hold-rate while CTR still flat ⇒ "fatigue in ~2–3 days, queue a refresh now."** — **Client $: Very High · Owner $: High · Dev: Med · RO-RISK: None.**
- **P3.4 MER/blended panel + platform-vs-CRM reconciliation** (items 15–17): surface MER & blended
  ROAS (account + portfolio); **flag platform-vs-CRM gap >20%** (uses `lead_events`, feeds
  `tracking_quality`); attribution-window sensitivity note (honest, no false MTA precision). — **Client $: Very High · Owner $: Med · Dev: Low–Med · RO-RISK: None.**
- **P3.5 Run-rate spend forecast + variance band** (item 5): trailing-7d run-rate projection beyond
  the existing linear pacing, with a confidence band from observed daily variance. — **Client $: Med · Owner $: High (upsell) · Dev: Low · RO-RISK: None.**
- **P3.6 Advanced-view trend surfaces** (stream 02 §4.3, §4.2): promote the 13-factor "Why this
  score?" drill-down; wire P3.1 sparklines/trends into the Advanced Command Center widget slots
  reserved in P2; checkpoints (named report snapshots → compare) onto the existing `reports` table. — **Client $: Med · Owner $: Med · Dev: M · RO-RISK: None.**

**Dependencies:** P1 (trend tables + corrected sync), P2 (Advanced surfaces to render into).

**File ownership (conflict-free):**
**new** `lib/engine/timeseries.ts`, **new** `lib/engine/stats.ts`, `lib/engine/metrics.ts` (X3/X6
corrections), `lib/engine/decisions.ts` (significance gate), `lib/engine/audit.ts`/`health.ts`
(consume fatigue/percentile signals — *weights unchanged, parity preserved*), `lib/engine/index.ts`
(surface MER/decisions to grounding). UI: Advanced Command Center widgets + "Why this score?" surface
(distinct components from P2's Simple Home). *Engine factor weights and `analyse()` I/O contract stay
parity-stable — new outputs are additive fields.*

**Verification gate:** universal gate **+** parity tests stay green (13 weights sum 100;
`ROAS_ANOMALY_THRESHOLD=20`) · new fixtures for `timeseries`/`stats` (deterministic, null-safe,
no ML files) · `decide().safe` still always true · no kill/scale fires below the decision floor or
without CI clearing break-even · CTR-unit guard test · `break_even_cpl` vs `break_even_cpa` covered.

**Impact (phase): Client $ Very High · Owner $ High · Dev L.** *The "best at diagnostics" phase.*

> **Vertical benchmark percentiles** (items 20–22) are valuable but a separate data-curation effort;
> sequenced into **P6** alongside creative scoring (they re-anchor `ctrScore`/`convRateScore`).
> **Incrementality-lite geo holdout (item 18)** and **saturation-curve proxy (item 19, NOT full MMM)**
> are Expert-tier, research-flagged → **Owner Queue / V6.5**.

---

## Phase 4 — AI: eval harness first, then orchestration, tool-use, grounding, routing

**Goal:** Be best-in-world at *evaluating*. Ship the **eval net before** the AI behaviour changes it
must protect, then deliver real orchestration (the CPWORK playbook the personas already promise),
engine tool-use (kills numeric drift), richer grounding, and model-routing/caching (pure margin).
All strictly read-only / additive plumbing around the existing engine.

**Items (cited — all from stream 05 unless noted):**
- **P4.1 EVAL harness (X5 — ship FIRST in this phase)** (§3): encode `qa/prompt-tests.md` (125 cases)
  as vitest fixtures seeded from *real* `analyse()` outputs; **Tier-1 deterministic guards on 100% of
  outputs** (never-edits-a-live-ad, no "delete", AUD-not-USD, **no-hallucinated-figures**, no-personal-
  email, no-absolutes/guarantees, decision-floor honoured, 4-part structure); **Tier-2 Opus
  LLM-as-judge** (faithfulness/data_match/actionability + safety_flags) nightly; **8 zero-tolerance
  adversarial cases** (PT-ADV-01..08) — any pass-through = CI failure. Tier-1 runs offline (no API
  key needed in CI, gated like the cron). — **Client $: Med · Owner $: High · Dev: M · RO-RISK: None (strengthens safety).**
- **P4.2 Grounding/retrieval upgrade** (§4): `buildGrounding` returns a *structured* object (back-compat
  string retained) — per-ad decisions (top winners/losers with names + verdicts), campaign breakdown,
  **"what changed" delta** vs previous report, severity-ranked, token-capped; inject only the
  router-selected agent's knowledge domains. — **Client $: Med · Owner $: Med · Dev: S–M · RO-RISK: None.**
- **P4.3 Tool-use** (§5): switch `callClaude` to a bounded tool loop (mirror the existing
  `researchWithWebSearch` 4-iteration cap); read-only engine tools (`get_account_summary`,
  `get_ad_decisions`, `get_health_breakdown`, `get_campaign_breakdown`, `compute_metric`,
  `check_policy`). **No tool mutates an ad** — the model reads the same numbers the engine computed.
  Ship to Dana/Mira/Travis first behind a flag. — **Client $: High · Owner $: Med · Dev: M · RO-RISK: None (read-only by construction).**
- **P4.4 Orchestration: auto-route + chain + Paige-final-gate** (§2): `command` becomes a real router
  (cheap Haiku structured-output plan) + `lib/agents/orchestrator.ts` chaining executor (topological,
  parallel independent steps, ≤4 steps, token-capped); **Paige is the non-negotiable final gate on any
  copy**; `fix-tracking`/zero-results forces Atlas before any media/scale step; deterministic fallback
  to single-agent on router error. New `POST /api/agents/command`. — **Client $: High · Owner $: High · Dev: M–L · RO-RISK: None.**
- **P4.5 Model routing + prompt caching** (§6): per-persona model/effort map (Haiku router/Paige →
  Sonnet analysis/prose → Opus hard-audit/judge); `cache_control` on the stable GUARDRAILS+persona+
  knowledge prefix; verify `cache_read_input_tokens > 0`; prefix-hash test so breakpoints can't
  silently move. ~40–60% cost cut at equal-or-better quality. — **Client $: Low · Owner $: High (margin) · Dev: S · RO-RISK: None.**

**Dependencies:** P1 (telemetry `ai_usage` for cost tracking; trend tables feed "what changed").
**P4.1 must merge before P4.2–P4.5** (the eval net guards every subsequent AI change).

**File ownership (conflict-free):**
**new** `lib/agents/evals/{fixtures,guards,judge}.ts` + `lib/agents/evals/output.safety.eval.test.ts`,
`lib/agents/grounding.ts`, **new** `lib/agents/orchestrator.ts`, `app/api/agents/run/route.ts` +
**new** `app/api/agents/command/route.ts`, `lib/ai/claude.ts` (tool loop + routing + caching),
`lib/agents/registry.ts` (router/Paige sequencing only — personas/GUARDRAILS text preserved).
*No engine files; reuses the read-only engine via tools.*

**Verification gate:** universal gate **+** all 125 eval fixtures pass Tier-1 · 8 adversarial cases
refuse (zero tolerance) · orchestrator never returns un-gated copy · router only emits roster ids ·
prefix-hash test green · `usage.cache_read_input_tokens > 0` on repeat calls · existing
`registry.test.ts`/`knowledge*.test.ts`/`context-pack.test.ts` stay green · a context-pack that *tries*
to allow USD must still fail the USD guard.

**Impact (phase): Client $ High · Owner $ High · Dev L.** *The "best at evaluation" phase + the AI quality leap.*

---

## Phase 5 — Automation: configurable rules engine, multi-channel delivery, integrations, LQS, queue

**Goal:** Be best-in-world at *automating* — within the read-only invariant. Replace the 4 hard-coded
alert rules with a user-configurable rules engine (with the principled rolling-baseline fix for the
false-CRITICAL problem), open multi-channel delivery + outbound/inbound webhooks + Sheets/Zapier, ship
the canonical LQS loop, and move the cron to a real fan-out queue now that job volume multiplies.

**Items (cited — all from stream 03 unless noted):**
- **P5.1 Wave-B min-volume gate** (E1; stream 04): finish the correctness fix so API-synced accounts
  never trip false-CRITICAL "zero conversions" (`insufficient-data` is the right answer below the
  gate). Pairs with P3.2's significance gating. — **Client $: High · Owner $: High · Dev: S · RO-RISK: None.**
- **P5.2 Configurable rules engine** (A1–A5): migration adds `alert_rules` (metric/operator/window/
  min_volume_gate/severity/scope/platform/enabled/cooldown); pure evaluator (mirrors `alerts.ts`
  testability); **seed the 13 documented ALT-001..013 as preset rules**; AND/OR groups + chaining
  ("collective anomaly" ≥2 metrics); **rolling-baseline operators (z-score / MAD vs 7/14d, %change
  WoW) always paired with min_volume_gate** = the principled false-CRITICAL fix; rule → alert and/or
  **proposal** (inert until human acts); dry-run preview ("would have fired N times in 14d") +
  `rule_id`-linked `alert_events`. Keep the 4 built-in rules as free-tier fallback. — **Client $: High · Owner $: High · Dev: L · RO-RISK: None (emits alerts/proposals only).**
- **P5.3 Multi-channel delivery + scheduling** (B1–B5): generalise `lib/email/resend.ts` into
  `deliver(channel, severity, payload)` — email (exists), **Slack** (Block Kit), **WhatsApp**
  (Twilio/Meta Cloud — separate webhook shape), signed generic webhook; severity→channel matrix;
  per-rule cadence + **quiet hours / digest batching** (no 3am page unless Critical);
  escalation/auto-bump + "ALERT RESOLVED" notices; **scheduled report delivery pipeline** (generate →
  render/PDF → white-label strip → deliver → archive). — **Client $: High · Owner $: High · Dev: M · RO-RISK: None.**
- **P5.4 Integration surface** (B2, C1–C4): outbound webhooks (`alert.fired`/`report.ready`, HMAC
  reusing the CRM constant-time primitive, retry/backoff, no-retry-on-410); **Google Sheets** connector
  (append-never-overwrite) + Looker template; **Make/Zapier/n8n** blueprints (already drafted) + a
  "Connect to Zapier" button handing over URL+secret; signed **inbound** triggers (`lead.created`,
  `payment.received`, fetch-latest-health) reusing the CRM webhook pattern. — **Client $: High · Owner $: High (ecosystem/distribution) · Dev: M · RO-RISK: None (ingest/notify only).**
- **P5.5 CRM connectors + canonical LQS loop** (C5; X2): HubSpot/Pipedrive/GHL on the existing
  `lead_events` table; implement the **outcome-table LQS (0–10) as canonical** (X2 — the divergent
  formula resolved) + true-CPA/ROAS (`spend/won_leads`, `revenue/spend`). — **Client $: High · Owner $: High · Dev: L · RO-RISK: None (ingest only).**
- **P5.6 Cron fan-out queue (Phase-2)** (stream 08 §2.2 Phase-2): cron → dispatcher enqueuing one job
  per org×platform; QStash (default) workers with retries/idempotency/visibility; **run in shadow
  alongside the old cron before flipping the schedule**. Now justified because P5.2/P5.3 multiply job
  volume. — **Client $: Med · Owner $: High · Dev: M · RO-RISK: None.**
- **P5.7 Automation audit log** (E3): `automation_runs` / extend `alert_events` — every cron run, rule
  fire, delivery attempt, webhook in/out with status/retry/http_status. — **Client $: Low · Owner $: Med · Dev: S · RO-RISK: None.**

**Dependencies:** P1 (telemetry, parallelised cron base), P3 (rolling-baseline + significance feed
the rules engine; corrected metrics). P4 not required but orchestrator can narrate rule rationale.

**File ownership (conflict-free):**
`lib/cron/{alerts,score}.ts`, **new** `lib/rules/{schema,evaluator,presets}.ts`, **new**
`lib/delivery/*` (channel dispatcher, Slack/WhatsApp/webhook), `lib/email/resend.ts` (folded into
dispatcher), **new** `lib/integrations/{sheets,zapier,inbound}.ts`, **new** `lib/lead/lqs.ts`,
**new** `lib/queue/*` + dispatcher route, **new** migrations `0023_alert_rules.sql`,
`0024_automation_runs.sql`, `0025_crm_connectors.sql`. UI: Advanced rule-builder + delivery settings
(under the Advanced "Connect/Automation" group from P2). *No engine `analyse/decide` files.*

**Verification gate:** universal gate **+** rules evaluator unit tests (incl. min-volume-gate suppresses
learning-phase false-fires) · LQS parity test pins the canonical outcome-table formula · outbound
webhook signing/idempotency/retry tests · shadow-queue parity (new queue produces identical sync
results before cutover) · `live_edit_block`/typed-YES assertions stay green (rules NEVER execute; only
the existing quadruple-gated path can, on explicit conversion).

**Impact (phase): Client $ High · Owner $ High · Dev L.** *The "best at automation" phase.*

> **The auto-execute "controlled middle" (stream 03 §4d) is OWNER-GATED — NOT built in P5.** P5 ships
> the always-proposal + safe-to-automate halves only. The guardrail *primitives* (cooldown table,
> max-change clamp, do-not-touch labels) may be built **as validators on the existing `ad_actions`
> path** (not an autopilot) only if the owner green-lights — see Owner Queue.

---

## Phase 6 — Creative & CRO: activate the dead factors, scorer-fed generation, benchmarks

**Goal:** Drive *client* revenue. Reclaim the 9% of the health score wasted on NEUTRAL placeholders,
turn the P3 creative-fatigue engine into client deliverables (angle-aware generation, UGC briefs, a
"what to test next" recommender), and anchor health factors to real vertical percentiles.

**Items (cited — stream 06 unless noted):**
- **P6.1 Activate `offer_strength` + `landing_page_alignment`** (Feature B — *ship first, cheapest real
  win*): structured `/offer-review` intake (10 dims ×1–10 → /100, deterministic → factor; Titan AI
  assist + Hormozi value-equation lens, Paige-gated copy); `/landing-review` intake (10 sections) +
  **semi-automatable signals** (PageSpeed/Core Web Vitals via API; message-match via read-only
  WebFetch of LP title/H1 vs ad hook). `factors.* = reviewScore ?? NEUTRAL` (override only when a
  review exists; weights 5+4 already reserved). — **Client $: High · Owner $: Med · Dev: M (+M/L landing) · RO-RISK: None.**
- **P6.2 Creative Scorecard UI + angle/winner analysis** (Feature A UI; stream 01 #1 — most demoable):
  surface the P3.3 per-ad scorer as a ranked Scorecard (hook/hold/CTR/decay/fatigue verdict +
  days-to-fatigue), group by angle/format, **UGC vs polished scored separately**; winning/losing angle
  gated by the decision floor. — **Client $: High · Owner $: High · Dev: M · RO-RISK: None.**
- **P6.3 Angle-aware generation + UGC/script brief builder** (Feature C): Stella's generation pre-fills
  from the *winning* angle + dying creatives; creative test-matrix output (one variable/row, exports
  `creative-testing-matrix.csv`); structured UGC briefs; **every generated line Paige-gated.** — **Client $: High · Owner $: Med · Dev: M · RO-RISK: None.**
- **P6.4 "What to test next" recommender** (Feature E): deterministic ICE-ranked, propose-only test
  backlog from A/B/(D) outputs + weak health factors; each test = one-variable hypothesis + primary
  metric/threshold + required budget (break-even CPA ×15 conv) + 7–14d read-out + paused-duplicate
  setup proposal. — **Client $: High · Owner $: Med · Dev: M · RO-RISK: None.**
- **P6.5 Vertical benchmark percentiles** (stream 04 items 20–22): `lib/engine/benchmarks.ts`
  `{platform,vertical,objective,metric}→{p10..p90}`; re-anchor `ctrScore`/`convRateScore` to vertical
  percentile; account-relative self-benchmarking; AU-caveat labelling. — **Client $: High · Owner $: Med · Dev: M · RO-RISK: None.**
- **P6.6 Competitor / Meta Ad Library research** (Feature D — *last, external dependency*): lookup
  long-running ads (30/60/90d ≈ winners), angle deconstruction, gap analysis; inspiration-only
  guardrail (never "copy this"). — **Client $: Med · Owner $: Med · Dev: M/L · RO-RISK: None.**

**Dependencies:** P3 (the per-ad fatigue/hook-hold engine + timeseries), P4 (Paige-gate via
orchestrator; generation grounded), P2 (Advanced surfaces). P6.6 adds an external API (owner cost note).

**File ownership (conflict-free):**
`lib/engine/audit.ts` (offer/landing factor wiring — *weights unchanged*), **new**
`lib/engine/benchmarks.ts`, **new** `lib/creative/{scorecard,recommender,brief}.ts`,
`app/(app)/{offer-review,landing-review,creative,canva-creator}/*`, `app/api/{ai/generate,policy/check}`
(reuse), **new** migration `0026_creative_reviews.sql` (offer/landing review storage). *Reuses P3 engine
outputs; no change to `decide`/`analyse` contracts.*

**Verification gate:** universal gate **+** offer/landing factor only overrides NEUTRAL when a review
exists (parity weights intact) · UGC-vs-polished scored on separate benchmarks · every generated asset
passes Paige in tests · percentile re-anchoring keeps the 13 weights summing to 100 · paused-duplicate
proposals never live-edit (typed-YES path untouched).

**Impact (phase): Client $ Very High · Owner $ High · Dev L.** *The client-revenue phase.*

---

## Phase 7 — Monetisation depth & resale leverage

**Goal:** Convert the V6 value surfaces into ARPU and resale leverage. Reverse-trial + "wasted-spend
found" already landed (P2); this phase adds the hybrid metering foundation, deep white-label, add-ons,
and the marketplace/partner ecosystem. **All pricing NUMBERS are owner-gated** — this phase builds the
*mechanism*, not the prices.

**Items (cited — all from stream 07 unless noted):**
- **P7.1 Annual billing + reverse-trial mechanism** (§4.6, §0.2): Stripe annual price keys + UI toggle;
  14-day full-Pro reverse trial → auto-downgrade to Free. *(Discount % + trial length owner-gated.)* — **Client $: Med · Owner $: High · Dev: S · RO-RISK: None.**
- **P7.2 Usage-metering foundation** (§4.1): `usage_events` + counters (ad-accounts, AI-actions,
  audit-runs); live "X of Y included" meter + soft-cap upgrade nudge; Stripe metered/graduated prices;
  extend Stripe beyond `mode:"subscription"` to `mode:"payment"` for add-ons. Make `multi_client`
  **metered** (allowance + overage) vs today's binary flag. *(Allowances/overage owner-gated.)* — **Client $: Med · Owner $: High (ARPU) · Dev: L · RO-RISK: None.**
- **P7.3 White-label depth** (§4.2): parent-org → child-workspace tree (RLS extends `is_org_member`);
  branded client logins (CNAME/subdomain); live portfolio rollup (clients ranked by health — the
  agency cockpit, stream 01 #8); markup re-billing (wholesale→retail). Phased: sub-accounts → logins →
  rollup → re-billing. *(Retail/wholesale numbers owner-gated.)* — **Client $: High · Owner $: High · Dev: L · RO-RISK: None.**
- **P7.4 Add-ons** (§4.3): DWY/onboarding-audit (one-time), premium niche context packs (reuse the
  env-gated `ADPILOT_CONTEXT_PACK_JSON` loader — sold as paid unlocks, **resale-clean preserved**),
  extra account/AI-action blocks, custom-domain. *(All prices owner-gated.)* — **Client $: Med · Owner $: Med · Dev: M · RO-RISK: None.**
- **P7.5 Template/Dashboard Marketplace + Partner/Reseller program** (§4.4, §4.5): sell report
  templates, Advanced-view layouts/checkpoints, alert-rule packs (first-party = margin; third-party =
  rev-share); reseller commission + partner dashboard; open `expert_plugins` to third-party devs;
  affiliate/referral attribution. *(Rev-share splits + commission owner-gated.)* — **Client $: Med · Owner $: High · Dev: M–L · RO-RISK: None.**

**Dependencies:** P2 (reverse-trial defaults to Simple; layouts/checkpoints become marketplace units),
P3/P6 (the value surfaces that justify price at renewal), entitlements↔plans drift alarm (must stay green).

**File ownership (conflict-free):**
`lib/entitlements.ts` + `lib/plans.ts` (kept drift-aligned; **no committed prices** — `null`/"See
pricing" until owner sets them), `app/api/stripe/{checkout,webhook}/*` (annual + `mode:payment` +
metered), **new** `lib/usage/*`, **new** `lib/whitelabel/*`, `app/(app)/{agency,billing,portfolio}/*`,
**new** migrations `0027_usage_events.sql`, `0028_workspaces.sql`, `0029_marketplace.sql`.

**Verification gate:** universal gate **+** entitlements↔plans drift alarm green · Stripe price→plan map
stays allow-listed & fails closed · prices remain `null`/"See pricing" until owner sets them (a test
asserts no hardcoded AUD number ships) · RLS holds on the new workspace tree (child workspaces isolated) ·
resale-clean grep guard passes on context-pack add-ons.

**Impact (phase): Client $ Med · Owner $ Very High · Dev L.** *The ARPU/resale phase.*

---

## Phase dependency graph (one glance)

```
P1 Foundations (cron + trend tables + telemetry)
 ├─→ P2 Dual-mode UX (Simple/Advanced)         [owner #1 ask — early/visible]
 ├─→ P3 Diagnostics (timeseries/stats/fatigue) ──┐
 │     └─ needs P2 surfaces for Advanced charts  │
 ├─→ P4 AI (evals→orchestration→tools→routing)   │ (P4.1 evals gate the rest of P4)
 │                                               │
 └─→ P5 Automation (rules/delivery/LQS/queue) ←──┘ (needs P3 baselines + corrected metrics)
        │
        └─→ P6 Creative & CRO (needs P3 engine + P4 Paige-gate + P2 surfaces)
                 │
                 └─→ P7 Monetisation (needs P2 trial + P3/P6 value surfaces)
```

**Each phase ships and verifies independently.** P2 can ship before P3/P4 are fully done (it only needs
P1). P3 and P4 can proceed in parallel after P1 (different file ownership; P4.1 evals first within P4).

---

## Owner Decision Queue (deferred to just-before-upload — tracked, not blocking)

> Per the V6 mandate, **all costings/pricing and the highest-level calls are collected and put to the
> owner just before upload, not mid-flight.** Headline count: **~23 items** (17 from stream 07 +
> 6 cross-stream). The build proceeds with the *mechanisms* in place and the *numbers/decisions* left
> as `null`/flags until the owner answers.

**A. Pricing & packaging numbers (stream 07 §8 — all 17):**
1. Base monthly AUD for Starter/Pro/Expert (anchors $49/$149/$399 are placeholders only).
2. Annual discount (≈2 months free / ~17%, or other).
3. Adopt the hybrid model? If yes: included allowances (ad accounts/workspaces, AI actions, audit runs)
   + overage prices + agency spend-band thresholds/multipliers.
4. Seats per tier + extra-seat price.
5. GST / merchant-of-record (Stripe Tax inc-GST vs Lemon Squeezy MoR — confirm with accountant).
6. Currency: AUD primary confirmed; also offer USD? (don't auto-FX.)
7. DWY/onboarding-audit one-time price(s) (old doc $1,500–$5,000 — confirm/revise).
8. Premium context-pack prices (one-time vs recurring) per niche.
9. Marketplace rev-share split with third-party creators (e.g. 70/30).
10. Custom-domain / white-label add-on price.
11. Reseller commission structure & %.
12. Affiliate/referral reward (credit vs cash; amount).
13. Open `expert_plugins` to third-party devs? (+ rev-share if yes.)
14. Approve making `multi_client` a metered allowance (vs binary Pro flag)?
15. Approve the 14-day full-Pro reverse trial? (confirm length.)
16. Keep legacy one-time $97–$4,997 tiers as DWY/services only + recurring-SaaS canonical? *(X8 — recommended.)*
17. Free-tier caps: confirm "1 watermarked report + Health Score + CSV import" as the ceiling.

**B. The auto-execute "controlled middle" (stream 03 §4d — owner-gated, NOT built without sign-off):**
18. Does the owner ever want to inch toward execution? If yes, the *only* safe shape is auto-**queue** a
    fully-formed `ad_action` proposal (revert state captured) that **still requires typed-YES**, behind
    every existing gate + the web-confirmed guardrails (max-change clamp ≤10%/≤30% ceiling, 24–72h
    cooldown, spend caps, rate ceiling, do-not-touch allowlist, min-data gate, `ADS_WRITE_ENABLED`
    kill-switch). Recommendation: build the guardrail *validators* on the existing path only on explicit
    green-light; keep "propose; human approves" as the product.
19. Offline-conversion-upload *proposals* (PII to Meta/TikTok) — build the proposal flow? (privacy review + typed-YES.)

**C. Access / legal / cost-bearing (cross-stream, restated):**
20. Non-expiring Meta **System User token** for the real-account audit + unattended jobs (streams 03 E2, 08).
21. Solicitor **Terms/Privacy** text (placeholders only ship today).
22. **Meta Ad Library API** spend approval (~$0.005/ad) for competitor research (P6.6, stream 06 Feature D).
23. Research-grade diagnostics: green-light **incrementality-lite geo holdout** and **saturation-curve
    proxy** (NOT full MMM) as Expert-tier, research-flagged features for V6.5? (stream 04 items 18–19.)

---

## Appendix — research stream → phase map (traceability)

| Stream | Lands primarily in |
|---|---|
| 01 Competitive teardown | P3/P6 (Scorecard, explainability), P5 (rule builder), P7 (agency cockpit) — strategy threads all phases |
| 02 UX dual-mode | **P2** (+ Advanced surfaces in P3/P5/P6) |
| 03 Automation | **P5** (+ E1 in P5.1, queue Phase-2 in P5.6; controlled-middle → Owner Queue) |
| 04 Diagnostics | **P3** (+ benchmarks/percentiles in P6.5; geo-holdout/MMM → Owner Queue) |
| 05 AI evals | **P4** |
| 06 Creative/CRO | **P6** (Feature A engine shared with P3.3) |
| 07 Monetisation | **P7** (+ reverse-trial/"wasted-spend" early in P2; all numbers → Owner Queue) |
| 08 Architecture/QA | **P1** (foundations + queue Phase-2 in P5.6 + partitioning → V6.5; QA bar threads all phases) |
```
