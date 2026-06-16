# 04 — Back-end efficiency audit (DB load, compute, latency)

> Read-only analysis. **No behaviour change** in any recommendation here — every fix
> returns identical data/HTML. Scope: `adpilot-v2/` (Next.js 14 App Router + Supabase).
> Date: 2026-06-16. Auditor: back-end performance lead.

## How to read this
- **% saving** is per the stated assumption (queries avoided, rows/bytes reduced, ms faster).
- **SAFE-AUTOMATIC** = mechanical, no behaviour risk, no schema/data migration of existing rows
  (new indexes are `create index concurrently`-able and additive).
- **NEEDS-REVIEW** = touches a schema column, a write path, or a caching contract that an
  owner should eyeball before merge.
- Assumed baseline for sizing: ~50 active orgs, ~30-day rolling window of campaign_snapshots
  (a few hundred to a few thousand rows/org), `reports.payload` jsonb ~20–200 KB each.

---

## A. Confirmed index gaps (biggest structural win)

Verified directly against `supabase/migrations/*.sql`. Existing relevant indexes:
- `campaign_snapshots (organisation_id, date)` and `(organisation_id, platform, ad_id, date)` — 0001
- `health_scores (organisation_id, created_at desc)` — **only added in 0021**
- `account_daily_metrics (organisation_id, date desc)` + PK — 0021
- `alert_events (organisation_id, created_at desc)` + unique `(org, dedupe_key)` — 0019
- `lead_events` unique `(organisation_id, event_id)` — 0018
- `recommendations` — **PK on `id` only. No org/status/created_at index.**
- `reports` — **PK on `id` only. No org/created_at index.**
- `connected_ad_accounts` — PK on `id` only.

### A1. `recommendations (organisation_id, status, created_at desc)` — MISSING — **HIGH**
- **Files hit:** `app/(app)/proposals/page.tsx:32` (`.eq(org).eq(status,'open').order(created_at).limit(200)`),
  `app/(app)/command/page.tsx:47` (same, limit 100), `app/api/agents/run/route.ts`,
  plus `refreshOpenRecommendations` (delete-by-org+status on every score/sync).
- **Today:** seq-scan + filter + sort of the org's entire rec history on a page every user loads.
- **Fix:** `create index concurrently on recommendations (organisation_id, status, created_at desc);`
- **Saving:** turns an O(rows-per-org) scan+sort into an index range read. On a 2k-rec org,
  ~**80–95% fewer rows examined** per query and the sort disappears; ~**5–30 ms** off two of the
  most-loaded authenticated pages. Also speeds the cron `delete … where status='open'`.
- **SAFE-AUTOMATIC.**

### A2. `reports (organisation_id, created_at desc)` — MISSING — **HIGH**
- **Files hit:** `app/(app)/reports/page.tsx:12` (limit 50), `command/page.tsx:49` (limit 5),
  `app/api/agents/run/route.ts`, `app/api/content/draft/route.ts`, `app/api/cron/weekly-digest/route.ts:24`
  — all `.eq(org).order(created_at desc).limit(n)`.
- **Today:** scan all of an org's reports to find the newest N. Worsens as report history grows
  (one report inserted per score + per CSV run, forever).
- **Fix:** `create index concurrently on reports (organisation_id, created_at desc);`
- **Saving:** index range scan returns the N newest directly. ~**70–90% fewer rows examined**;
  compounds with B-series payload trimming on the same queries.
- **SAFE-AUTOMATIC.**

### A3. `campaign_snapshots (organisation_id, platform, source, date)` — MISSING — **MEDIUM/HIGH**
- **File hit:** `lib/sync/pull.ts:166` idempotent rolling delete
  `.eq(org).eq(platform).eq(source,'<p>_api').gte(date, -30d)` runs on **every** sync.
- **Today:** the `(org, date)` index helps the range but `platform`+`source` are residual filters;
  with auto-sync hourly × N orgs × 2 platforms this delete is the hottest write-path query.
- **Fix:** `create index concurrently on campaign_snapshots (organisation_id, platform, source, date);`
- **Saving:** ~**40–70% fewer heap fetches** on each rolling delete; meaningful as the table grows
  (see §F). **SAFE-AUTOMATIC.** (Lower priority than A1/A2 — `(org,date)` already bounds it.)

### A4. `connected_ad_accounts (organisation_id, status, platform)` — MISSING — **LOW/MEDIUM**
- **Files hit:** `cron/auto-sync/route.ts:57` (per org, every sweep), `lib/sync/pull.ts:147`, portfolio/billing.
- **Fix:** `create index concurrently on connected_ad_accounts (organisation_id, status, platform);`
- **Saving:** small per-row table per org, but it's queried per-org inside the cron loop; index makes
  it a point lookup. ~**negligible latency now, scales linearly** with orgs. **SAFE-AUTOMATIC.**

### A5. `lead_events (organisation_id, created_at desc)` — MISSING — **LOW**
- **File hit:** `lib/cron/score.ts:35` 30-day lead-quality pull (`limit 10000`). Unique
  `(org,event_id)` index doesn't serve the `created_at` range. **SAFE-AUTOMATIC.**

---

## B. `reports.payload` jsonb over-fetch (rows look small, bytes are not)

`reports.payload` is the full `analyse()` result (summary + 13-factor breakdown + findings +
per-ad decisions) — easily tens to hundreds of KB. Three hot paths fetch the **entire** payload
to read **two scalars** (`health.total`, `health.band`).

### B1. `app/api/cron/weekly-digest/route.ts:24` — **HIGH**
- `select("title,payload")` per digest-org, uses only `payload.health.{total,band}`.
- **Fix (no behaviour change):** select the scalars without dragging the whole blob:
  `select("title, payload->health->>total, payload->health->>band")` (Postgres JSON path projection
  via PostgREST — returns the same two values, transfers ~bytes not ~KB). Behaviour identical.
- **Saving:** ~**95–99% fewer bytes** transferred per digest email; on a 100 KB payload that's
  ~99 KB → ~0.1 KB per org. **SAFE-AUTOMATIC** (read-only projection, same values).

### B2. `app/api/content/draft/route.ts` (~:37) — **HIGH**
- `select("payload")` then reads only `payload.health.{total,band}` for AI grounding. Same JSON-path
  projection fix. Per user request. **SAFE-AUTOMATIC.**

### B3. `app/api/agents/run/route.ts` (~:38) — **NEEDS-REVIEW**
- `select("payload")` then `buildGrounding(payload, recs)` — here the grounding **may** legitimately
  use summary + findings, not just two scalars. Verify what `buildGrounding` actually reads; if it's
  only summary+health, project those JSON sub-objects (`payload->summary`, `payload->health`) instead
  of the whole blob (drops the large `decisions[]`/`breakdown`). **NEEDS-REVIEW** (confirm fields).

### B4. `app/(app)/reports/[id]/page.tsx:26` — keep as-is
- The report detail page genuinely renders health + summary + findings + decisions, so it needs the
  payload. **No change** — flagged only to show it was checked.

---

## C. Per-request org/plan resolution hits the DB 2–4× per page — **HIGH**

`getActiveOrgId` (`lib/org.ts:38`) runs a `memberships` query; `planForOrg` (`:7`) runs a
`billing_subscriptions` query; each opens a fresh `createAdminClient()`.

- **The layout already pays for both:** `app/(app)/layout.tsx:11` calls
  `getActiveOrgId(...).then(planForOrg)`. Then **every page re-runs `getActiveOrgId`** (command,
  proposals, reports, portfolio, content, actions, billing, ai-specialists, messenger) and several
  re-run `planForOrg` — so a single navigation does the membership lookup **2×** and the
  subscription lookup up to **2×**, on top of `supabase.auth.getUser()`.

### C1. Request-memoise `getActiveOrgId` + `planForOrg` — **SAFE-AUTOMATIC**
- **Fix:** wrap both in React `cache()` (per-request memoisation; identical inputs → one DB hit
  per request). `getActiveOrgId(userId,email)` and `planForOrg(orgId)` are pure reads keyed by their
  args — `import { cache } from "react"; export const planForOrg = cache(async (orgId) => {…})`.
  Cookie read inside `getActiveOrgId` is per-request-stable, so memoising by `userId` is safe.
- **Saving:** removes the duplicate membership + subscription queries → **~2 DB round-trips per
  page navigation eliminated** (≈ **30–40% of the small-query count** on a typical authenticated
  page that otherwise issues 5–7 queries). ~**10–25 ms** off every page (two fewer serial
  round-trips to Supabase). Behaviour identical (same org, same plan).

### C2. Layout → page hand-off without re-query — **NEEDS-REVIEW**
- Bigger win but riskier: the layout already resolves `{orgId, plan}` — passing them down avoids the
  page re-resolving at all. App Router doesn't pass props layout→page, so this needs a request-scoped
  store (e.g. the `cache()` from C1 covers ~all of it; a context/header approach is the only way to
  go further). **C1 captures most of the benefit at zero risk** — prefer it. **NEEDS-REVIEW** only if
  going beyond C1.

---

## D. Portfolio N+1 per-org loop — **MEDIUM** (agency/Pro+Expert only)

`app/(app)/portfolio/page.tsx:38` — `Promise.all(orgs.map(...))` fires **2 queries per client**
(latest `health_scores` + a `campaign_snapshots` scan with `limit 5000`).

- **Today:** 1 agency with 20 clients = **40 queries** + up to 20×5000 snapshot rows pulled to the
  app just to sum `spend`/`revenue` in JS. Parallel (good) but still O(clients) queries and heavy
  row transfer.
- **Fix D1 (rows, NEEDS-REVIEW):** read MTD spend/revenue from `account_daily_metrics` (added 0021,
  already upserted daily per org) instead of summing raw `campaign_snapshots` — drops thousands of
  rows to ~30/org and the JS reduce shrinks. Behaviour: identical numbers if the rollup is current
  (it's written every score). **NEEDS-REVIEW** (confirm rollup freshness vs. raw for the live month).
- **Fix D2 (queries, NEEDS-REVIEW):** replace the per-org health/spend pair with **two** set-based
  queries over `organisation_id IN (ids)` (one grouped spend/revenue, one latest-score-per-org via a
  lateral/distinct-on), folding 2N queries → 2. Needs a small SQL RPC/view. **NEEDS-REVIEW.**
- **Saving:** D1 alone ~**90%+ fewer rows** transferred on this page; D1+D2 ~**(2N−2)/2N queries
  avoided** (e.g. 40 → 2 = **95% fewer queries**) and a large latency drop for big agencies.

---

## E. Cron sweep compute — **MEDIUM**

### E1. `auto-analysis` sweep is sequential — **SAFE-AUTOMATIC**
- `app/api/cron/auto-analysis/route.ts:24` scores **every org one-at-a-time**. `auto-sync` already
  uses bounded `CONCURRENCY=4` + a time budget; auto-analysis does not, so a large tenant base makes
  this the long pole (and risks the platform timeout that auto-sync was hardened against).
- **Fix:** reuse the same batched-concurrency + time-budget pattern from `auto-sync` (lift it to a
  shared helper). Behaviour identical (same scoring, per-org isolation preserved).
- **Saving:** wall-clock ~**÷4** at concurrency 4 (e.g. 50 orgs × 200 ms → ~10 s → ~2.5 s); removes a
  silent-truncation timeout risk. No change to DB load, just latency/reliability.

### E2. `scoreAndAlertOrg` column list on the 14-day pull — already lean — keep
- `lib/cron/score.ts:22` selects an explicit 16-column list (not `*`) with `limit 5000`. Good.
  Minor: the same per-org pull happens in both crons when an org is both due-to-sync and daily-scored
  — acceptable (different cadences); flagged only as checked. The month-to-date spend pull
  (`:34`, `limit 10000`) could read from `account_daily_metrics` for closed days, but the current-month
  partial makes that fiddly — **leave** (low value, behaviour-sensitive).

---

## F. `campaign_snapshots` growth — **NOTE / NEEDS-REVIEW**
- The table is the largest and append-heavy: CSV imports persist forever; API rows are refreshed in a
  rolling 30-day window (`lib/sync/pull.ts` delete+insert), so API rows self-bound but **CSV rows grow
  unbounded**. The cron 14-day and MTD reads (`limit 5000`/`10000`) cap the blast radius, but full-table
  operations (the §A3 delete) degrade as CSV history accumulates.
- **Suggestion (NEEDS-REVIEW, owner-gated):** a retention/partition policy or a `date` BRIN index for
  very large historical CSV sets. Not urgent at current scale; the §A indexes + `account_daily_metrics`
  rollup (already shipped 0021) are the right near-term answer. No behaviour change implied.

## G. Serverless cold-start — **NOTE**
- Each helper calls `createAdminClient()` fresh (`lib/org.ts`); client construction is cheap, but the
  C1 memoisation also reduces redundant client creation per request. Routes correctly pin
  `runtime = "nodejs"` and `maxDuration` where needed. No standalone action beyond C1.

---

## Prioritised punch-list (biggest wins first)

| # | Finding | File(s) | Fix | Est. saving | Class |
|---|---------|---------|-----|-------------|-------|
| 1 | No `recommendations(org,status,created_at)` index | proposals/command pages, agents/run, refreshOpenRecommendations | add index | 80–95% rows examined on 2 hottest pages; −5–30 ms | SAFE-AUTO |
| 2 | No `reports(org,created_at)` index | reports/command pages, weekly-digest, agents/run, content/draft | add index | 70–90% rows examined; compounds with #4 | SAFE-AUTO |
| 3 | Org/plan re-queried per page (2–4× DB) | `lib/org.ts` + all `(app)` pages/layout | `cache()` both fns | ~2 round-trips/page removed (~30–40% of page query count); −10–25 ms | SAFE-AUTO |
| 4 | Full `reports.payload` fetched for 2 scalars | weekly-digest, content/draft | JSON-path projection | 95–99% fewer bytes/query | SAFE-AUTO |
| 5 | Portfolio N+1 (2 queries + 5k rows per client) | portfolio/page.tsx | read `account_daily_metrics`; set-based IN query | up to 95% fewer queries + ~90% fewer rows (agencies) | NEEDS-REVIEW |
| 6 | `auto-analysis` sequential sweep | cron/auto-analysis | batched concurrency (reuse auto-sync) | wall-clock ÷4; removes timeout risk | SAFE-AUTO |
| 7 | No `campaign_snapshots(org,platform,source,date)` | lib/sync/pull.ts delete | add index | 40–70% fewer heap fetches on rolling delete | SAFE-AUTO |
| 8 | `agents/run` payload over-fetch | agents/run | project summary/health sub-objects | likely 70–90% fewer bytes (verify fields) | NEEDS-REVIEW |
| 9 | `connected_ad_accounts(org,status,platform)` + `lead_events(org,created_at)` indexes | cron paths | add indexes | scales with org count | SAFE-AUTO |
| 10 | `actions/[id]` `select("*")` over jsonb | actions/[id]/route.ts:39 | explicit columns | fewer bytes on revert path | SAFE-AUTO |

## Aggregate estimate
- **DB-call reduction:** on a typical authenticated page, items #1–#3 cut a 5–7 query / 2–4
  duplicate-round-trip load to ~3–4 unique indexed reads — roughly a **35–45% reduction in DB
  calls/round-trips per page**, and a **70–95% reduction in rows scanned** on the proposals,
  command and reports pages. Portfolio (#5) cuts agency-page queries by up to **95%**.
- **Bytes over the wire:** #4/#8/#10 remove the dominant jsonb transfer on those paths
  (**~95%+ fewer bytes** on digest/draft).
- **Speed:** combined ~**40–120 ms faster** on the hot authenticated pages (index range reads +
  two fewer serial Supabase round-trips), and **~4× faster** `auto-analysis` wall-clock (#6).
- **All of items #1, #2, #3, #4, #6, #7, #9, #10 are SAFE-AUTOMATIC** (additive indexes,
  per-request memoisation, read-only column/JSON projection, cron parallelism) with **zero
  behaviour change**. Items #5 and #8 are NEEDS-REVIEW (rollup freshness / grounding fields).

> Note: indexes are additive and `create index concurrently`-safe; none rewrite or delete existing
> rows. Memoisation and projections return byte-for-byte identical results to callers.
