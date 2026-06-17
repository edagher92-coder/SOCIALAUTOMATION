# AdPilot OS V6 — Operator-Value & Back-End Efficiency Plan (03-ops-value)

> Owner: Back-end / operator-value lead — Milo (automation) + Dana (data), paired with an
> agency-operations expert.
> Posture: **READ-ONLY audit.** No code changed, no git, no installs. This is the only output file.
> Date: 2026-06-16.
> Scope: features that **reduce operator toil and scale agency work** — the owner/operator/agency
> running many accounts — while staying true to the product's read-only, propose-don't-execute nature.
> Invariant preserved by every item: AdPilot OS **proposes; the human approves.** Nothing here edits,
> pauses, creates, or spends on a live ad. The only live-write path stays the existing quadruple-gate
> (Expert tier → `ADS_WRITE_ENABLED=1` → typed-YES → write-scope token); `decide().safe` stays true.

---

## 0. TL;DR — the operator's day, and where the time goes

The product already runs a clean "set-and-forget" loop for **one** account: connect → cadence sync
(`auto-sync`) → re-score (`scoreAndAlertOrg`) → refresh the Proposals queue → fire fixed alerts →
email criticals. The V6 operator-value leap is **across accounts**: turn "I have 40 clients and must
open 40 dashboards to find out who's bleeding money today" into **one triage screen, one report run,
one set of saved rules reused everywhere.** Every lever below removes a repeated manual step the
operator does today — and does it without ever leaving the read-only line, because all of it is
*aggregation, routing, scheduling, templating, and proposal-surfacing* over data we already compute.

The single highest-leverage move: **the Agency Triage Queue** — "which of my N clients need attention
today," ranked, with why, in one read. It already has 80% of its substrate (`portfolio/page.tsx`,
`health_scores`, `account_daily_metrics`, `alert_events`, `recommendations`). It is the screen the
operator opens first every morning, so it compounds with every other feature here.

What's live today (verified in code):
- `app/(app)/portfolio/page.tsx` — cross-client roll-up (health, MTD spend, ROAS, "needs attention"
  list). Gated `multi_client` (pro+). **Read-only, thin** — no per-client deltas, no triage ranking,
  no last-synced/staleness, no assignment, no bulk action, no drill row.
- `app/(app)/agency/page.tsx` + `app/api/white-label/route.ts` — white-label **branding form**
  (brand/logo/colour/support email) wired into `lib/reports/format.ts` (`whiteLabel.name`). Expert.
- `lib/proposals.ts` — `refreshOpenRecommendations()` rebuilds the **open** Proposals queue per org
  (actionable verdicts only, platform-aware dedupe, insert-then-clear safety).
- `lib/cron/score.ts` — daily/cadence scoring; now also upserts `account_daily_metrics` (per-org
  per-day rollup) and `alert_events`, and emails criticals via `notification_rules`.
- `lib/cron/alerts.ts` — 4 fixed threshold rules (frequency, zero-conv-spend, low CTR). Hard-coded.
- `app/api/cron/auto-sync/route.ts` — V6-P1 fan-out fix already landed: bounded concurrency (4) +
  per-org parallel platform pulls + 50s time-budget guard that **defers** rather than truncates.
- `lib/engine/{timeseries,stats,fatigue}.ts` — new pure modules (rolling/WoW/anomaly, Wilson/CI,
  predictive fatigue). **Computed but not yet surfaced cross-client.**
- Email is the **only** delivery channel. Cadence is one global `sync_interval_hours` per org.

Tier reality (from `lib/entitlements.ts`): `multi_client`, `auto_sync`, `ai_team`, `lead_quality_loop`
= **pro+**; `threshold_alerts` = **starter+**; `white_label`, `expert_plugins`, `ad_write`,
`messenger_automation` = **expert**. So the agency-grade ops features below land naturally at **Pro**
(multi-client, alerts, automated reporting) and **Expert** (white-label, portfolio-scale, plugins).

---

## 1. The toil inventory (what the operator repeats today)

| Repeated manual task | Frequency | Time/instance | Where it bites |
|---|---|---|---|
| Open each client's dashboard to check health | daily × N clients | 2–4 min | no single "who needs me today" view with *why* |
| Re-read each Proposals queue, decide, act per client | daily/weekly × N | 5–15 min | proposals are per-org; no cross-client batch review |
| Build & send each client their monthly/weekly report | monthly × N | 15–30 min | reports engine exists; **scheduled branded delivery does not** |
| Re-create the same alert thresholds per new client | per onboard | 5–10 min | rules are hard-coded; no per-client config, no reuse |
| Onboard a new client (connect, set economics, baseline) | per onboard | 20–45 min | no guided fast-path / no "first audit in one screen" |
| Chase "is this client's data fresh?" | ad hoc | 2–5 min | no staleness/last-synced surfacing across the book |
| Re-explain "why did the score move?" to a client | ad hoc | 5–10 min | health history exists in data, not as a saved snapshot diff |
| Route the right alert to the right person/channel | ad hoc | — | email-only, single recipient, no per-client routing |

Every feature in §2 attacks one or more rows of this table. **Impact is scored in operator time
saved across a book of clients**, which is the owner's stated priority.

---

## 2. Operator-efficiency features (ranked, the V6 ops backlog)

Legend — **Tier**: minimum plan. **Impact**: operator time saved (book-wide). **Effort**: S/M/L/XL.
**RO/safe**: how it preserves the read-only invariant. **GUI-pair**: ✅ = naturally ships with the
GUI/dual-mode builds (it is primarily a new screen/view over data we already have).

### OPS-1 — Agency Triage Queue ("who needs me today") · Tier: Pro · Impact: VERY HIGH · Effort: M · GUI-pair: ✅
**The headline.** Upgrade `portfolio/page.tsx` from a flat roll-up into a **ranked triage list**: every
client workspace scored on a composite urgency = (band weight) + (open CRITICAL alert count) +
(WoW health delta, from `account_daily_metrics`) + (data-staleness penalty from `last_synced_at`).
Each row shows: client · health + Δ7d sparkline · MTD spend/ROAS · open-critical count · top proposal ·
last synced · "Open →". Default sort: most-urgent first; the operator works top-down and stops when
green. One screen replaces opening N dashboards.
- **RO/safe:** pure aggregation over `health_scores`, `account_daily_metrics`, `alert_events`,
  `recommendations`. No writes. Already `multi_client`-gated and RLS-scoped (`is_org_member`).
- **Why now:** all four source tables exist; `account_daily_metrics` (added in `score.ts`) gives the
  deltas/sparklines cheaply without re-running `analyse()`. This is the morning-open screen.

### OPS-2 — Cross-client Proposals review + one-click "apply the safe proposals" · Tier: Pro (review) / Expert (apply) · Impact: VERY HIGH · Effort: M (review) / L (apply) · GUI-pair: ✅
A **portfolio-wide Proposals inbox**: all open `recommendations` across the book in one list,
filterable by verdict (scale/kill/reduce/refresh/fix-tracking), client, platform, severity. Operator
triages everyone's proposals in one pass instead of N queues.
- **"Apply safe proposals" — and what "safe" means here:** the *default and only* action for Pro is
  **Accept / Dismiss / Snooze the proposal record** (status transitions on `recommendations`) and,
  for refresh, **generate the paused-duplicate brief** — none of which touch a live ad. This is the
  read-only "apply": it advances the *workflow*, not the *ad account*. Bulk-accept ("mark these 12
  refresh proposals as actioned / export as a task list / push to the brief generator") is the
  toil-killer and is 100% read-only.
- **The genuinely-executing variant is Expert-only and stays fully gated:** a proposal may be
  *converted to* an `ad_action` (pause/resume/set_budget, Meta only) — but only via the existing
  `lib/actions/execute.ts` path: Expert tier → `ADS_WRITE_ENABLED=1` → **typed-YES per action** →
  write-scope token, with prior-state captured for revert. **No bulk auto-execute.** Even at Expert,
  "one-click" means one-click-to-*queue-a-typed-YES-confirm*, never one-click-to-spend. The default
  build (Pro) ships the read-only bulk-review; the executing layer is owner-gated.
- **RO/safe:** status changes on the proposals table are inert; the live-write path is unchanged and
  unbypassable. The bulk surface only ever batches the *inert* operations.

### OPS-3 — Scheduled, branded client reporting · Tier: Pro (scheduled) / Expert (white-label) · Impact: HIGH · Effort: M · GUI-pair: partial (config screen ✅; delivery is back-end)
Close the documented "engine exists, delivery doesn't" gap. New cron + `report_schedules` table:
per-client schedule (weekly Mon 09:00 / monthly 1st, AEST) → render the existing
`lib/reports/{templates,format}.ts` output → apply white-label (`whiteLabel.name`, strip internal
thresholds/margins, rename engine personas when `client_facing`) → deliver (email today; Slack/PDF/
Drive via OPS-7) → archive a `reports` row. Eliminates the 15–30-min × N monthly report build.
- **RO/safe:** report generation + delivery is already in the "safe to automate" set — it reads and
  formats, never calls a platform. White-label strip logic already exists in `format.ts`.
- **Note:** the *branding form* is live (`agency/page.tsx`); only the **schedule + delivery pipeline**
  is new. Scheduling is Pro; the white-label brand on the output stays Expert (per `entitlements`).

### OPS-4 — Configurable alert rules + per-client templates & reuse · Tier: Starter (rules) / Pro (templates) · Impact: HIGH · Effort: L · GUI-pair: ✅ (rule builder is a GUI surface)
Replace the 4 hard-coded rules in `lib/cron/alerts.ts` with a data-driven `alert_rules` table (metric,
operator, window, min-volume gate, severity, scope, platform, cooldown, enabled). Seed best-practice
defaults so a new client starts configured. **The operator lever:** a rule **template** ("my standard
e-comm rule set", "my lead-gen set") that **applies to many clients at once** and re-applies on
onboard — the per-client 5–10-min setup becomes one click. Pure evaluator (mirror the testability of
the current `evaluateAlertRules`); rules emit `alert_events` and/or `recommendations` only.
- **RO/safe:** rules produce alerts and proposals; they never execute. Min-volume gate + rolling
  baseline (from `lib/engine/timeseries.ts`) fixes the false-CRITICAL noise that wastes operator time.

### OPS-5 — Onboarding / first-audit fast-path · Tier: Pro · Impact: HIGH · Effort: M · GUI-pair: ✅
A guided "add a client" flow: connect (OAuth/dev-token) → set economics (avg sale value, margin,
monthly budget) → pick a cadence + apply an alert-rule template (OPS-4) → trigger an **immediate
first sync + score** so the operator sees a health number and the first proposals **in one sitting**,
not "wait for tomorrow's cron." Collapses the 20–45-min ad-hoc onboard into a checklist. Optionally
clone settings from an existing client ("same setup as Client X").
- **RO/safe:** uses the existing read-only sync + `analyse()` + proposal refresh; just runs them
  on-demand for one org. No new write surface.

### OPS-6 — Saved views, checkpoints & "why did it move?" diffs · Tier: Pro · Impact: MEDIUM-HIGH · Effort: M · GUI-pair: ✅
Two operator wins on the same substrate. **(a) Saved views:** persisted filters/sorts on the triage
queue and proposals inbox ("Red ecomm clients", "anything with a kill proposal") so the operator
doesn't rebuild the same filter daily — `saved_views` table (org/user-scoped, JSON filter spec). **(b)
Checkpoints / history diffs:** there is **no append-only daily health-score history** today
(`health_scores` is effectively latest-state — confirmed in 08-architecture-qa §1.2). Add
`health_score_snapshots` (append-only daily) so the operator can pin a checkpoint and show a client
"score moved 72→61 because frequency + CPA factors fell" — the question they re-explain manually now.
- **RO/safe:** both are pure reads/UI state + an additive append-only table written from
  `scoreAndAlertOrg`. The engine contract is untouched (08-arch §2.1).

### OPS-7 — Multi-channel alert routing (Slack + webhook) · Tier: Pro (Slack) / Expert (webhook) · Impact: MEDIUM-HIGH · Effort: M · GUI-pair: partial (routing config ✅)
Generalise `lib/email/resend.ts` into `deliver(channel, severity, payload)`. Add **Slack** (incoming
webhook / Block Kit → `#client-alerts`) and **signed outbound webhook** (reuse the CRM webhook's
constant-time HMAC). **The operator lever is *routing*:** per-client channel + severity floor in an
extended `notification_rules` (e.g. low/med → batched 08:00 digest; high/critical → Slack now), plus
escalation (recurring 2d, severity bump at 5d) and "resolved" notices. Kills alert fatigue and the
"which client was that about" context-switch. Webhook also wires AdPilot *into* Make/Zapier/n8n.
- **RO/safe:** outbound notification only; strips raw PII; never calls an ad platform.

### OPS-8 — Bulk operations across clients · Tier: Pro · Impact: MEDIUM · Effort: M · GUI-pair: ✅
Multi-select on the triage queue → batch the **inert** operator actions: re-run sync+score now,
generate/refresh reports, apply an alert template, snooze/accept proposals, export a combined
client-status CSV. The "do this thing I do per-client, for 15 clients at once" surface. Explicitly
**excludes** any live-ad write — bulk is only ever over the read-only/inert operations of OPS-2/3/4/5.
- **RO/safe:** every batched action is itself read-only or an inert status change. A hard rule:
  `ad_action` is **never** a bulk target — it requires per-action typed-YES by design.

### OPS-9 — Portfolio-scale automation hardening (queue + telemetry + audit) · Tier: Pro (benefits all) · Impact: MEDIUM (enabling) · Effort: M · GUI-pair: ✗ (back-end only)
The triage/report/alert features only stay trustworthy at 40+ clients if the back end keeps up. The
`auto-sync` fan-out fix (concurrency + time-budget defer) is in; V6 adds the **fan-out queue**
(dispatcher → per-org jobs via QStash/Inngest, idempotent, retried — 08-arch §2.2) so no client is
silently skipped, plus an **automation audit log** (`automation_runs`: every cron run, rule fire,
delivery attempt, webhook in/out — status, retries, duration). This is what lets the operator *trust*
"everyone got synced, scored, alerted, reported" without spot-checking — removing the
"is-it-actually-running" anxiety-tax. Add a cron SLO ("every due org synced within its cadence
window; alert if deferred>0").
- **RO/safe:** infrastructure only — reads, scores, logs. No new write surface; preserves per-org
  isolation already in `scoreAndAlertOrg`/`processOrg`.

### OPS-10 — Client roles, assignment & shareable read-only client view · Tier: Expert · Impact: MEDIUM · Effort: M-L · GUI-pair: ✅
For a multi-seat agency: assign clients to team members (an `assignee` on the org/membership), so the
triage queue filters to "my clients," and a **read-only client-facing share link** (white-labelled
health + report, no internal proposals/margins) the operator sends instead of building a deck. Scales
the *people* side of the agency, not just the data side.
- **RO/safe:** assignment is metadata; the share view is a white-labelled read of existing reports
  with internal fields stripped (the `client_facing` path already in `format.ts`). RLS preserved.

---

## 3. Ranking & sequencing

| # | Feature | Tier | Operator impact | Effort | GUI-pair | Read-only? |
|---|---|---|---|---|---|---|
| OPS-1 | Agency Triage Queue | Pro | Very High | M | ✅ | Yes (aggregation) |
| OPS-2 | Cross-client Proposals review + bulk "apply" | Pro / Expert | Very High | M / L | ✅ | Yes (inert); execute path stays gated |
| OPS-3 | Scheduled branded client reporting | Pro / Expert | High | M | partial | Yes (read+format+deliver) |
| OPS-4 | Configurable alert rules + templates/reuse | Starter / Pro | High | L | ✅ | Yes (emits alerts/proposals) |
| OPS-5 | Onboarding / first-audit fast-path | Pro | High | M | ✅ | Yes (on-demand read sync) |
| OPS-6 | Saved views + checkpoints/score-diff | Pro | Med-High | M | ✅ | Yes (reads + append-only table) |
| OPS-7 | Multi-channel alert routing | Pro / Expert | Med-High | M | partial | Yes (outbound notify only) |
| OPS-8 | Bulk operations across clients | Pro | Medium | M | ✅ | Yes (inert ops only; never ad_action) |
| OPS-9 | Portfolio-scale automation hardening | Pro | Medium (enabling) | M | ✗ | Yes (infra/reads) |
| OPS-10 | Client roles / assignment / share link | Expert | Medium | M-L | ✅ | Yes (metadata + stripped read) |

**Suggested waves** (each independently shippable; layers around the parity-tested engine):
1. **Ops Wave 1 — the triage spine:** OPS-1 (triage queue) + OPS-6a (saved views) + OPS-9 (audit log
   first, queue later). Gives the morning-open screen + trust. Highest ratio.
2. **Ops Wave 2 — the work batching:** OPS-2 (cross-client proposals, **read-only review/bulk only**)
   + OPS-8 (bulk ops) + OPS-4 (rule templates). Removes the per-client repetition.
3. **Ops Wave 3 — the client-facing output:** OPS-3 (scheduled reporting) + OPS-7 (routing) + OPS-5
   (onboarding fast-path) + OPS-10 (assignment/share).
4. **Owner-gated (do not build without sign-off):** OPS-2's *executing* variant (proposal→`ad_action`),
   any auto-execute, offline-conversion uploads. These stay behind the full quadruple-gate.

---

## 4. GUI pairings (flag for the GUI/dual-mode build)

These are primarily **new screens/views over data we already compute**, so they ship hand-in-hand with
the dual-mode UI work (08-arch §2.4 — shared primitives + `<ModeAware>` + mode-filtered nav):
- **OPS-1** Triage Queue — the operator's home screen; advanced-mode default landing.
- **OPS-2** Cross-client Proposals inbox — a table + filter + batch-action bar.
- **OPS-4** Alert-rule builder + template manager — a form/config surface.
- **OPS-5** Onboarding wizard — a guided multi-step flow (beginner-mode friendly).
- **OPS-6** Saved views + checkpoint diff — UI state + a small history panel.
- **OPS-8** Bulk-action toolbar — multi-select affordance on OPS-1/OPS-2.
- **OPS-10** Assignment filter + share-link config.

Mostly back-end (build alongside infra, **not** the GUI): **OPS-9** (queue/telemetry/audit) and the
delivery half of **OPS-3** / **OPS-7** (cron + channel adapters). Their *config* screens are GUI;
their *engines* are server-side.

---

## 5. Read-only / safety invariants (the line every item holds)

1. **No live-ad mutation anywhere in this plan** except OPS-2's explicitly owner-gated executing
   variant, which uses the *unchanged* `lib/actions/execute.ts` path — Expert + `ADS_WRITE_ENABLED=1`
   + typed-YES per action + write-scope token + revert-state capture. **No bulk auto-execute, ever.**
2. **"Apply the safe proposals" = advance the workflow, not the ad account.** Accept/dismiss/snooze
   are inert status changes on `recommendations`; refresh produces a *paused-duplicate brief*. Bulk is
   only ever over these inert operations (OPS-8 hard rule: `ad_action` is never a bulk target).
3. **All cross-client aggregation is RLS-scoped** (`is_org_member`) and runs on the service role only
   in crons — the same posture as today's `portfolio/page.tsx` and `score.ts`.
4. **Reporting strips internal data** (thresholds, margins, fees, engine-persona names) on any
   client-facing output via the existing `client_facing`/`whiteLabel` path — and the resale-clean grep
   guard (`snowflow|edagher`) stays in CI.
5. **New history/audit tables are additive and append-only** (`health_score_snapshots`,
   `automation_runs`); the parity-tested `analyse()` core and the entitlements↔plans drift alarm stay
   green and unchanged (08-arch §4 golden rule).
6. **Tiering matches `lib/entitlements.ts`** — agency-grade ops land at Pro (`multi_client`,
   `threshold_alerts` from Starter, `auto_sync`, `lead_quality_loop`) and Expert (`white_label`,
   `expert_plugins`, `ad_write`). No gate is loosened by anything here.

---

## 6. The single biggest operator win

**Build OPS-1 (the Agency Triage Queue) first.** It is the screen the operator opens before anything
else, it answers "which of my 40 clients need me today" in one read, and it sits entirely on data we
already compute (`health_scores`, `account_daily_metrics`, `alert_events`, `recommendations`) behind
the existing `multi_client` gate and RLS. It is pure aggregation — zero read-only risk — and it is the
hub every other ops feature plugs into (proposals open from it, reports schedule from it, alerts route
from it, onboarding adds to it). Highest impact-to-effort and zero safety cost: it turns N dashboard
opens into one prioritised list, and makes the whole "run many accounts" workflow legible at a glance.

---

### Sources
*Internal (verified):* `adpilot-v2/app/(app)/portfolio/page.tsx`, `app/(app)/agency/page.tsx`,
`app/api/white-label/route.ts`, `lib/proposals.ts`, `lib/cron/{score,alerts}.ts`,
`app/api/cron/{auto-sync,auto-analysis,weekly-digest,publish}/route.ts`,
`lib/engine/{timeseries,stats,fatigue}.ts`, `lib/reports/{templates,format}.ts`,
`lib/entitlements.ts`, `lib/actions/execute.ts`, `app/api/actions/*`, `CLAUDE.md`.
*Companion research:* `CPWORK/universal-ads-os/product/v6-research/03-automation.md`,
`04-diagnostics.md`, `08-architecture-qa.md`.
