# V6 Architecture & QA Technical-Readiness Plan

**Author:** Architecture & QA lead (paired with Quinn, QA)
**Date:** 2026-06-16
**Scope:** Can the `adpilot-v2/` architecture support a generations-ahead V6 (dual-mode UX, deeper diagnostics, automation, more AI) without regressions or scaling pain — and what is the testing/reliability bar?
**Posture:** Read-only audit. No code changed, no git, no installs.
**Web research:** AVAILABLE. External sources (Supabase RLS perf, Vercel cron limits, TimescaleDB, LLM cost/caching, QStash/Inngest) corroborated the internal findings and are cited inline.

---

## 0. Executive read

The v4 architecture is **fundamentally sound and unusually disciplined** — a pure, synchronous, in-memory scoring engine (O(n), parity-tested), strict entitlement gating, fail-closed crons, RLS on every table, hashed PII, and a numbers-first AI layer with hardened guardrails. None of that needs a rewrite for V6.

The strain is not in *correctness*; it is in **shape**. V6 adds three things the current shape was never designed for: (1) **history** (trend charts need append-only daily snapshots, but `health_scores`/`reports` are effectively latest-state); (2) **fan-out work** (more orgs × more AI × more sync, against a sequential single-invocation cron model capped at Vercel's 60s); and (3) **surface area** (26 pages / 24 nav items already, with a dual-mode toggle wired but used on only one page, and zero shared design-system primitives). Each is a *scaling-shape* problem, not a bug.

The single biggest scale risk is the **hourly `auto-sync` cron**: it loops orgs and platforms **sequentially in one 60s invocation** with no queue. It is already tight at ~10 due orgs and will silently start dropping/truncating syncs well before V6's growth lands. This is the one item that breaks *quietly* (partial syncs look like "low activity," not an error), so it tops the priority list.

---

## 1. Where the current architecture will strain under V6

Each item tagged **Risk** (likelihood × blast radius) and **Effort** to fix.

### 1.1 Cron fan-out vs Vercel limits — *the headline risk*
- **Today:** `vercel.json` defines 5 crons. `auto-sync` runs hourly (`0 * * * *`) with `maxDuration=60`. Inside, it loads all due orgs and, per org, calls `syncOrgPlatform()` for Meta then TikTok **sequentially** (`lib/sync/pull.ts`), each ~2–7s, then re-scores. The subagent estimate: ~10 due orgs ≈ 70–100s — **already over the 60s ceiling**. `publish` (every 15m, cap 50 posts) and `auto-analysis` (daily, all orgs, no plan gate) share the same single-invocation-loop shape.
- **Why it strains at V6:** more orgs + more frequent sync + deeper per-org diagnostics all multiply wall-clock in a model that has **no queue and no concurrency** (Vercel cron fires once; there is no built-in fan-out or retry — confirmed against Vercel limits docs). Failures are *silent*: a timeout truncates the org list, leaving later orgs un-synced with no error surfaced.
- **Risk: CRITICAL** · **Effort: M** (parallelise pulls now; queue later).

### 1.2 No time-series history for trends — *the V6-feature blocker*
- **Today:** `campaign_snapshots` IS a proper append-only daily time-series (one row per ad per day, indexed `(org_id, date)` and `(org_id, platform, ad_id, date)`). But the **derived** layer is latest-state: `scoreAndAlertOrg` inserts into `health_scores` and `reports` on each run, and there is **no guaranteed append-only daily health-score history**, no pre-aggregated account/campaign daily rollup, and `health_scores.breakdown` (jsonb) and `reports.payload` (jsonb) are **unindexed**. There is no index on `health_scores(date)`.
- **Why it strains at V6:** "deeper diagnostics" and dual-mode dashboards both depend on *trend* lines — health score over 90 days, CPA drift, factor-by-factor change. Reconstructing trends from `campaign_snapshots` on every page load means re-running `analyse()` over raw rows for every requested period — expensive and duplicative. Postgres row performance "drops precipitously around 50M rows" for time-series (TimescaleDB benchmark) — a multi-year ad-level snapshot table will get there.
- **Risk: HIGH** · **Effort: M** (new snapshot tables) → **L** (partitioning later).

### 1.3 RLS subquery cost at scale
- **Today:** `is_org_member(org)` is a `security definer stable` function doing `select exists(... from memberships where org=$1 and user_id=auth.uid())`, applied via `for all using (is_org_member(organisation_id))` across the org-scoped tables. `memberships` has a unique `(organisation_id, user_id)` constraint but **no explicit index tuned for the RLS lookup**, and several tables lack indexes on the RLS-filtered column path.
- **Why it strains at V6:** Supabase's own RLS guidance is explicit — a subquery-in-policy runs *per candidate row*; on large tables this is a hidden N+1, and **indexing the policy columns can be a >100x win**. `STABLE` + `security definer` already lets Postgres hoist the call, which is the right pattern, but it only pays off with the supporting index and with the policy wrapped so the function evaluates once per query, not once per row. Large `campaign_snapshots` reads under RLS are where this bites.
- **Risk: MEDIUM** (mitigated by good base pattern; rises with table size) · **Effort: S** (indexes) → **M** (policy-shape audit + `EXPLAIN ANALYZE`).

### 1.4 AI cost & latency are unmetered and uncached
- **Today:** AI is a raw `fetch` to `api.anthropic.com/v1/messages` (`lib/ai/claude.ts`). Models: `claude-sonnet-4-6` default (specialists, `maxTokens=1200`), `claude-opus-4-8` for knowledge refresh (`maxTokens=2000`, web_search tool, capped at ~4 pause-turn loops). **No prompt caching, no batching, no streaming, no retry/backoff, no token/cost logging, no per-org rate limit.** 12 personas each prepend knowledge packs + grounding + context-pack (~2–5KB stable prefix).
- **Why it strains at V6:** "more AI" + dual-mode (AI surfaced to beginners too) multiplies call volume. The system prompts are a **large, stable prefix** — exactly the shape Anthropic prompt caching rewards (cache reads ~$0.30/M vs $3.00/M; industry reports 45–90% cost and 13–85% latency reduction for cached prefixes). Today every call pays full price and there is no spend telemetry to forecast or cap. No backoff means a 429 burst fails user-facing requests.
- **Risk: HIGH** (cost/latency, not correctness) · **Effort: M**.

### 1.5 UI / nav sprawl & dual-mode debt
- **Today:** 26 pages across `(app)`/`(marketing)`; `components/AppShell.tsx` defines **24 nav items** in 4 groups (Command / Workspace / AI Team / Account). `components/mode.tsx` provides a `ModeProvider` + `useMode()` (beginner|advanced, localStorage) and a sidebar toggle — but **only `/canva-creator` actually branches on mode**. There are **no shared design-system primitives** (no `Button`/`Card`/`Table`/`Input`); markup + Tailwind is duplicated per page across ~16 feature components.
- **Why it strains at V6:** "dual-mode UX" means *every* page needs a beginner and an expert view. With no primitives, that's 26 bespoke dual implementations — high duplication, high regression surface, untestable consistency. The 24-item nav is already past the point where beginners can self-navigate; dual-mode must also *filter the nav*, not just page bodies.
- **Risk: MEDIUM** (delivery cost & UX, not outage) · **Effort: L**.

### 1.6 Sync robustness gaps
- **Today (`lib/sync/pull.ts`):** Meta pull is `date_preset=last_30d`, single request, **no pagination loop**. TikTok pull is `page_size=1000`, **no page cursor loop** — accounts with >1000 ad-days/window silently truncate. Idempotent via delete-then-insert of `source='{platform}_api'` rows in the rolling window (CSV preserved). No 429/5xx backoff. The CLAUDE.md "Wave B ad-level sync rewrite" item (fixes false-CRITICAL zero-conversions on API-synced accounts) lands here.
- **Risk: MEDIUM** (silent data loss at large accounts) · **Effort: S–M**.

### 1.7 Observability / missing indexes / migration hygiene
- **Today:** No Sentry/APM, no structured error tracking, no cron-duration or AI-token telemetry. `audit_logs` has **no `(organisation_id, created_at)` index** (append-only, grows unbounded). `health_scores`, `recommendations` lack date indexes. Migration numbering **jumps 0011 → 0016** (0012–0015 absent) — a parity/hygiene smell worth confirming before stacking V6 migrations.
- **Risk: MEDIUM** · **Effort: S**.

---

## 2. Refactors needed for V6

### 2.1 Data model for trends (do first — unblocks the feature)
- **Add `health_score_snapshots`** — append-only daily: `(org_id, scope, entity_key, date, total numeric, band text, breakdown jsonb, data_confidence)`, index `(org_id, scope, date)`, optional GIN on `breakdown` only if factor-level filtering is needed. Write one row/scope/day from `scoreAndAlertOrg`; never overwrite. This is the literal table V6 trend charts read.
- **Add `account_daily_metrics`** — pre-aggregated `(org_id, platform, date, spend, impressions, leads, purchases, revenue, roas, cpa, health_score)`, index `(org_id, date)`. Lets dashboards render trends without re-running `analyse()` over raw `campaign_snapshots`.
- **Keep `analyse()` exactly as-is** — it stays the pure, parity-tested core. Snapshotting is a *write-side* concern layered around it; the engine contract does not change. This is the key to "no regressions": the oracle-parity surface is untouched.
- **Plan partitioning** for `campaign_snapshots` (range by `date`, optionally sub-partition by tenant) **before** ~50M rows; evaluate TimescaleDB hypertables / native declarative partitioning as a later, reversible step. Tag: defer until volume justifies — premature partitioning adds ops cost.
- **Risk-down effect: HIGH** · **Effort: M.**

### 2.2 Job/queue strategy (do first — removes the silent-failure risk)
- **Phase 1 (cheap, now):** inside each cron, replace the sequential per-platform loop with `Promise.all([metaPull, tiktokPull])`; add per-org try/catch (already isolated) + exponential backoff on 429/5xx. Add a hard time-budget guard that records "deferred" orgs rather than truncating silently.
- **Phase 2 (V6):** move to a **fan-out queue**. The cron becomes a *dispatcher* that enqueues one job per org (or per org×platform); workers process with retries, idempotency keys, and visibility into duration. Both leading serverless options keep code on Vercel: **QStash** (publish-and-forget, retries/scheduling/fan-out, ~$1/100K msgs — right default under ~1M/day) or **Inngest** (step functions, durable, code stays in-repo). Recommend QStash for sync fan-out (simple, cheap) and Inngest if multi-step durable workflows (sync → score → alert → digest) are wanted as one orchestrated function.
- **Risk-down effect: CRITICAL** · **Effort: M.**

### 2.3 Caching & AI cost control
- **Prompt caching:** mark the stable prefix (GUARDRAILS + persona system prompt + knowledge packs) as a cache breakpoint; put dynamic grounding/user question last. Expected 45–90% cost / meaningful latency reduction on the repeated persona prefixes.
- **Response cache:** short-TTL (e.g. 1h) keyed on (agent, org, normalised question + grounding hash) to kill duplicate calls — back with Supabase or a small KV.
- **Telemetry:** log `input_tokens`/`output_tokens`/`cache_read`/cost per call to an `ai_usage` table; this is the prerequisite for per-tier spend caps and forecasting.
- **Backoff + concurrency cap** per org/tier on the Anthropic call path.
- **Risk-down effect: HIGH** · **Effort: M.**

### 2.4 Shared UI primitives for dual-mode
- Extract a small design system (`Button`, `Card`, `Table`, `Stat`, `Field`, `PageHeader` already exists) and a **`<ModeAware beginner=… advanced=…>`** wrapper so each page declares both views once. Make the **nav itself mode-filtered** (tag each of the 24 items `beginner|advanced|both`) so beginners see a curated subset.
- Sequence: primitives → nav filter → migrate high-value pages first (Dashboard/Ads-Health, Content Studio, Actions), then the long tail. This bounds the regression surface and gives e2e something stable to assert against.
- **Risk-down effect: MEDIUM** · **Effort: L.**

### 2.5 Indexes & hygiene (quick wins)
- Add `audit_logs(organisation_id, created_at desc)`, `health_scores(organisation_id, period_end desc)`, `recommendations(organisation_id, created_at desc)`, and confirm a `memberships(user_id, organisation_id)` index supports the RLS path. Run `EXPLAIN ANALYZE` on the heaviest RLS reads.
- Resolve the **0012–0015 migration gap** (confirm intentional vs lost) before adding V6 migrations.
- **Effort: S.**

---

## 3. Testing & reliability bar for V6

The current suite is a genuine strength: **41 test files / ~431 cases** (`vitest run`), including engine **parity vs the Python oracle** (`lib/engine/parity.contract.test.ts` pins the 13 weights summing to 100 and `ROAS_ANOMALY_THRESHOLD=20`), the **entitlements↔plans drift alarm** (`lib/plans.test.ts`), decision-safety (`decide().safe` always true), cron fail-closed posture, crypto/PII, and an integration suite. Gaps: **no e2e, no coverage thresholds, no monitoring/error budgets**, and the `CPWORK/.../qa/*` docs (`test-plan.md`, `release-checklist.md`) describe the *markdown-ZIP* era (25 skills, ZIP delivery, ±5 repeatability) — they do **not** cover the live SaaS. The QA framework must be ported to the app.

**The V6 bar:**

| Dimension | Target |
|---|---|
| Unit/parity coverage | Keep oracle parity green as a **release gate**; line coverage **≥80% on `lib/engine`, `lib/agents`, `lib/entitlements`, `lib/sync`, `lib/cron`** (add `vitest` coverage thresholds — none today). |
| Drift alarms | Keep entitlements↔plans + parity-contract; **add** a snapshot-schema parity test and an AI-prompt-prefix hash test (so caching breakpoints don't silently move). |
| E2E (new) | Playwright: auth → connect → sync → score → report, the typed-YES `ad_write` safety path, and **dual-mode toggle on every migrated page** (mode persists, correct nav subset, no data divergence between views). |
| Safety | Adversarial "edit my live ad" suite ported from `qa/prompt-tests.md` into automated app tests; assert `ADS_WRITE_ENABLED`-off + typed-YES is unbypassable. |
| Reliability / monitoring | Sentry (errors) + cron-duration metric + AI-token/cost metric. **Error budget: 99.5%** on user-facing API; **cron SLO: every due org synced within its cadence window** (alert if deferred>0 or duration>45s). |
| Repeatability | Health score variance ≤±5 across reruns on fixed data (carry forward from `test-plan.md`). |
| Load | Synthetic test: 100 orgs × 1–5k ads through the sync→score→snapshot path under the new queue; assert no truncation, p95 cron-job < worker timeout. |
| Release gate | CI must run `tsc --noEmit` + `vitest run` (coverage gate) + `next build` + e2e smoke before deploy; port the manual `release-checklist.md` Phase 1 secret-scan (`snowflow|edagher`, `sk-ant-`, `EAA`, Stripe keys) into CI. |

---

## 4. Migration / sequencing risk map (don't break v4)

Ordered so each phase is independently shippable and reversible. **Golden rule: the parity-tested `analyse()` core and the entitlements gate are invariants — never change their contracts; layer V6 around them.**

| Phase | Work | Breaks v4 if… | Mitigation | Risk · Effort |
|---|---|---|---|---|
| **0. Quick wins** | Indexes (audit_logs, health_scores, memberships RLS); `Promise.all` sync pulls + 429 backoff; resolve 0012–0015 gap; add vitest coverage thresholds. | A new index locks a big table on deploy; backoff masks a real auth error. | `CREATE INDEX CONCURRENTLY`; keep auth-failure classification distinct from transient. | LOW · S |
| **1. Telemetry** | Sentry + cron-duration + `ai_usage` token logging. Additive only. | Logging path throws and breaks the request. | Best-effort/try-catch around all telemetry writes (matches existing email pattern). | LOW · S |
| **2. Trend data model** | `health_score_snapshots` + `account_daily_metrics`; write from `scoreAndAlertOrg`. | Double-writing slows the cron; backfill blocks. | New tables additive (no change to existing reads); backfill offline/batched; engine contract untouched. | LOW–MED · M |
| **3. AI caching** | Prefix cache breakpoints + response cache + concurrency cap. | Cache breakpoint placed mid-dynamic-content → wrong cached answer. | Prefix-hash test; cache only the proven-stable persona+knowledge prefix; TTL short. | MED · M |
| **4. Queue/fan-out** | Cron → dispatcher; QStash/Inngest workers. | In-flight jobs double-run or drop during cutover. | Idempotency keys (already delete-then-insert); run new queue in shadow alongside old cron before flipping the schedule. | MED · M |
| **5. Dual-mode UI** | Primitives + `<ModeAware>` + mode-filtered nav; migrate pages. | A shared primitive regresses many pages at once. | Ship primitives behind existing markup first; e2e per migrated page; migrate high-value pages before the long tail. | MED · L |
| **6. Partitioning** | Partition/Timescale `campaign_snapshots`. | Repartitioning a live multi-GB table; RLS interaction with partitions. | Defer until ~tens of millions of rows; do as a planned, reversible migration with verified RLS-on-partition behaviour. | MED-HIGH · L |

**Cross-cutting invariants for every phase:** RLS stays on every table; `decide().safe` stays true; `ADS_WRITE_ENABLED`-off + typed-YES stays unbypassable; entitlements↔plans drift alarm and oracle parity stay green; resale-clean grep guard (`snowflow|edagher`) stays in CI.

---

## 5. Top 5 technical priorities (ranked)

1. **Queue the cron fan-out** (sync/score/publish) — removes the silent-truncation CRITICAL risk; start with `Promise.all` + time-budget guard, then QStash/Inngest.
2. **Add trend data model** (`health_score_snapshots`, `account_daily_metrics`) — unblocks deeper diagnostics & dual-mode dashboards without touching the parity-tested engine.
3. **AI prompt caching + token telemetry + backoff** — cuts cost/latency 45–90% on stable persona prefixes and makes spend forecastable/cappable for "more AI."
4. **Testing/reliability bar** — vitest coverage thresholds (≥80% on core libs), Playwright e2e (incl. dual-mode + typed-YES safety), Sentry + cron SLO/error budget; port the SaaS-era QA from the ZIP-era docs.
5. **Dual-mode UI foundation** — shared primitives + `<ModeAware>` + mode-filtered nav so 26 pages / 24 nav items become maintainable in two modes.

**Biggest scale risk:** the hourly `auto-sync` cron's **sequential, single-invocation, unqueued** org×platform loop (already >60s at ~10 orgs, Vercel-capped, fails silently). Fix it first.

---

*Internal sources:* `adpilot-v2/vercel.json`, `next.config.mjs`, `vitest.config.ts`, `package.json`, `lib/engine/{index,health,decisions}.ts`, `lib/agents/{registry,knowledge,context-pack}.ts`, `lib/ai/claude.ts`, `lib/sync/pull.ts`, `lib/cron/score.ts` + `app/api/cron/*`, `components/{AppShell,mode}.tsx`, `supabase/migrations/0001–0020`, `CPWORK/universal-ads-os/qa/{test-plan,release-checklist}.md`.
*External (web available):* Supabase RLS performance & best-practices docs; Vercel limits docs; TimescaleDB-vs-Postgres time-series benchmarks; Anthropic/industry prompt-caching cost-latency reports; QStash & Inngest serverless background-job guidance.
