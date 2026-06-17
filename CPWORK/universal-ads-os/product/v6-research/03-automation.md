# AdPilot OS V6 — Automation Roadmap (03-automation)

> Owner: Automation lead (Milo + senior RevOps). Status: research + roadmap, owner-gated.
> Read-only invariant is sacred: AdPilot OS **proposes; the human approves**. No item below
> may edit, pause, create, or spend on a live ad without an explicit typed-YES, Expert tier,
> and `ADS_WRITE_ENABLED=1`. Every item is tagged for that risk.
> Last updated: 2026-06-16. Web research: **AVAILABLE** (WebSearch worked; some WebFetch
> vendor pages 403-blocked — vendor detail is from search snippets + RevOps expertise, flagged).

---

## 0. TL;DR

AdPilot OS already runs a respectable "set-and-forget" loop: cadence-driven auto-sync →
re-score → refresh proposals → fixed-rule alerts → email. The V6 leap is to turn the
**hard-coded alert library into a user-configurable rules engine**, add **multi-channel
delivery** (Slack/WhatsApp/webhook beyond email), open a **two-way integration surface**
(Sheets/Looker/Make/Zapier/n8n, inbound + outbound), and formalise an **"autopilot with
guardrails"** boundary so the product can safely sit one notch closer to execution than
today — without ever crossing the read-only line. The competitive market splits into
*auto-execute* (Madgicx, Revealbot rules, Smartly PBA) vs *proposal/approval* (AdEspresso).
AdPilot OS is the proposal end **taken further**, and there is a documented market gap for
compliance-bound advertisers who must approve every change. That gap is the moat.

---

## 1. What exists today (baseline — verified in code)

| Surface | File | What it does | Read-only? |
|---|---|---|---|
| Cadence auto-sync | `app/api/cron/auto-sync/route.ts` | Hourly cron; per-org pulls only when `sync_interval_hours` is due (0/1/24/168/custom), slack window for jitter, advances `last_synced_at` only on success (partial-failure safe), marks account disconnected only on auth-shaped errors. Plan-gated `auto_sync` (pro+). | Yes — read scopes only |
| Read-only pull | `lib/sync/pull.ts` | Ad-level Meta (`ads_read,read_insights`) + TikTok (`ads.read`) → upsert `campaign_snapshots`. Idempotent: clears rolling 30d API window then inserts; never touches CSV rows. | Yes |
| Daily scoring | `app/api/cron/auto-analysis/route.ts` + `lib/cron/score.ts` | Every org scored daily (covers CSV-only). `analyse()` → health + decisions + pacing + lead-quality factor → writes `health_scores`, `reports`, refreshes Proposals queue, evaluates alert rules, emails criticals. Per-org isolation. | Yes |
| Alert rule library | `lib/cron/alerts.ts` | **4 fixed rules**: frequency warn≥4/crit≥6, zero-conv-spend ($20 + 0 leads + 0 purchases), low CTR (<0.8% on ≥500 impr). Pure + dedup'd per (rule, campaign). | Yes — informs only |
| Alert log | `0019_alerts.sql` (`alert_events`) | Open/resolved hit log, unique on `(org, dedupe_key)`. RLS read; service-role write. | Yes |
| Proposals queue | `lib/proposals.ts` | Engine decisions → actionable verdicts only (scale/kill/reduce/refresh/fix-tracking), platform-aware dedupe, insert-then-clear safety so a failed insert never empties the queue. | Yes |
| Weekly digest | `app/api/cron/weekly-digest/route.ts` | Emails latest health score to orgs with `weekly_digest` on. | Yes |
| Inbound CRM webhook | `app/api/webhooks/crm/route.ts` | HMAC-SHA256 over raw body (constant-time), fail-closed 403, idempotent upsert on `(org, event_id)`, PII stored only as salted SHA-256 hash. Handles `sale.recorded` / `lead.status_changed`. | Yes — ingest only, never calls a platform |
| Content publish cron | `app/api/cron/publish/route.ts` | Publishes **own organic** scheduled posts that already passed human approval. Plan-gated `content_publish`. | N/A — own channels, not paid ads |
| Guarded ad-write | `lib/actions/execute.ts` + `app/api/actions/*` | The ONLY live-write path. Quadruple-gated: Expert tier → `ADS_WRITE_ENABLED=1` → typed-YES confirm phrase → write-scope token. Captures prior state for revert. Meta only; TikTok intentionally throws. | **Gated write** |
| Notification prefs | `0002_phase3.sql` (`notification_rules`) | Per-org `email`, `weekly_digest`, `critical_alerts` booleans only. | Yes |
| Delivery | `lib/email/resend.ts` | Resend transactional email (fetch, no SDK), degrades when unconfigured. **Email is the only channel today.** | Yes |
| Entitlements | `lib/entitlements.ts` | `auto_sync`/`api_connect`/`ai_team`/`lead_quality_loop`/`multi_client` = pro+; `threshold_alerts` = starter+; `ad_write`/`white_label`/`messenger_automation`/`expert_plugins` = expert. | — |

**Framework docs already specify (not yet built):** a 13-rule alert engine (ALT-001…013),
Make/n8n/Zapier blueprints, a Google Sheets 10-tab hub, an outbound-webhook spec, a Lead
Quality Score (LQS 0–10) loop, offline-conversion-upload *proposals*, and a Slack/WhatsApp
severity→channel matrix. See `automations/*` and `skills/no-code-automation-builder`.

### Gaps the framework already documents but the app hasn't shipped
1. Configurable / expanded alert rules (only 4 of the 13 documented exist; all hard-coded).
2. Multi-channel delivery (Slack `#adpilot-alerts` Block Kit, WhatsApp via Twilio/Meta for High/Critical) — email-only today.
3. Inbound lead webhook receivers beyond CRM sale/status (`lead.created`, payments).
4. **Outbound** webhooks (`alert.fired`, `report.ready`) with signing + retry/backoff.
5. Budget-pacing alerts (ALT-001/002/011) — pacing is a *score factor* but not an *alert*.
6. Scheduled report **delivery** pipeline (engine exists; generate→PDF→email/Drive on a schedule does not).
7. MER + week-on-week business signal (ALT-013).
8. Sheets / Looker / Make / Zapier / n8n integration surface (docs only).

---

## 2. Competitive landscape (web-sourced)

| Tool | Stance | Trigger conditions | Actions | Scheduling | Guardrails / preview | Alerting |
|---|---|---|---|---|---|---|
| **Revealbot ("Birch")** | Auto-execute rules | Spend/CPA/ROAS/CTR/freq/impr/conv over time-windows; AND/OR nesting, optional conditions, rule chaining (15+ conds) | Start, Pause, Budget +/-/set (flat or %), bid-cap, duplicate ad set, **Notify (no-op)** | Every **15 min** (Meta floor) → 72h, 15-min steps | Preview/simulate; detailed automation logs | Slack (multi-channel/DM), email (multi), Telegram |
| **Smartly.io** | Predictive auto-execute | Forecast-driven (not just reactive) | Predictive Budget Allocation across ad sets/campaigns toward best performers at target CPA | **Once/day, just after midnight** — by design, to avoid learning-phase reset | The once-daily cadence *is* the anti-thrash guardrail | — |
| **Madgicx** | Agentic auto-execute | AI judgment + conditional rules | Autonomous budget/audience/creative; pause-below-CTR, raise-on-ROAS | Continuous | Reviews flag it **unsuitable for approval/compliance-bound advertisers** | Slack anomaly alerts |
| **AdEspresso** | Proposal / approval | — | Campaign build, A/B test, reporting | — | **Approval workflows — human in loop** | — |
| **AdPilot OS** | **Proposal, taken further** | Engine 13-factor + fixed alert rules | Proposals only; gated Meta pause/resume/set_budget behind typed-YES + env flag | Cadence (1h–168h) + daily score | typed-YES, `ADS_WRITE_ENABLED` off by default, revert-state capture, `decide().safe` always true | Email only (today) |

**Key web takeaways for V6:**
- **Anomaly detection should be rolling-baseline, not static thresholds** — 7/14-day or 4-week baselines auto-scale with seasonality. Z-score `|x−μ|/σ > 2.5–3` or robust MAD `|x−median|/(1.4826·MAD) > 3`; percentage bands with an absolute floor to suppress small-number noise; "collective" anomalies (≥2 correlated metrics moving) are highest-signal. (Improvado, Madgicx, 2POINT, growth-onomics.)
- **The learning-phase trap** — new campaigns have no baseline; naïve systems false-fire on every fluctuation. Mitigation = minimum-baseline window + minimum-volume gate. This is *exactly* AdPilot's Wave-B "false-CRITICAL zero-conversions" problem; `insufficient-data` verdict is the right answer.
- **Guardrails (numbers):** max-change clamp 5–10% per scale step, ≤30% hard ceiling (bigger resets Meta learning); 24–72h per-entity cooldown; spend caps (daily/lifetime/account); rate ceilings (max changes/entity/day); dry-run/preview; minimum-data gates (≥~50 conversions before kill/scale); **do-not-touch / label allowlists**. (adamigo, AnyTrack, controlclick, DevOps.com.)
- **Canonical reporting pipeline:** Schedule trigger → Graph Insights (async report-run + poll for big pulls) → flatten/derive KPIs → Sheets/DB → Looker Studio. Long-lived System User token for unattended jobs. (n8n templates, Zapier, eesel.)
- **Market gap = us.** Madgicx reviews explicitly say there's no good option for compliance-bound advertisers who must approve each change. AdPilot's typed-YES + flag-gated model fills it.

---

## 3. V6 Roadmap

Impact legend — **Client $** (value to the advertiser), **Owner $** (revenue/retention lever),
**Dev** (effort: S/M/L/XL). **RO-RISK** = does it risk the read-only invariant? (None / Low /
Contained = touches the gated write path but stays behind all existing gates).

### (a) Configurable Rules Engine — user-defined triggers → proposed actions (all gated)

The headline of V6. Replace the 4 hard-coded rules in `lib/cron/alerts.ts` with a
data-driven rules engine: users compose rules in the UI; the cron evaluates them; matches
become **alert events and/or proposals** — never live writes (except via the existing
quadruple-gated `ad_actions` path, opt-in).

**A1. Rule schema + evaluator (foundation).** New `alert_rules` table per org: `metric`,
`operator` (>, <, >=, <=, %change, crosses), `window_days`, `min_volume_gate`, `severity`,
`scope` (account/campaign/adset/ad), optional `platform` filter, `enabled`, `cooldown_hours`.
A pure evaluator (mirror the testability of `alerts.ts`) takes snapshots + rules → hits.
Ship the 13 documented ALT-001…013 as **seed/preset rules** so users start with best-practice
defaults, then customise. Keep the existing 4 as built-in fallbacks for free tier.
*Client $: High · Owner $: High (the defensible "rules engine" feature; pro/expert gate) · Dev: L · RO-RISK: None (emits alerts/proposals only).*

**A2. AND/OR condition groups + rule chaining.** Match Revealbot's stackable conditions and
"collective anomaly" signal (≥2 metrics moving). E.g. `freq ≥ 4 AND ctr_drop ≥ 25% → refresh proposal`.
*Client $: High · Owner $: Med · Dev: M · RO-RISK: None.*

**A3. Rolling-baseline / anomaly rules.** Add baseline-relative operators: `metric vs 7/14d
rolling mean ± z-score`, `metric vs 7-day peak × factor` (ALT-006 CTR-drop), `%change WoW`
(ALT-013 MER). Always paired with `min_volume_gate` (≥N impressions/conversions) and a
minimum-baseline-window so new/learning campaigns can't false-fire. This is the principled
fix for the Wave-B false-CRITICAL problem.
*Client $: High · Owner $: Med · Dev: M · RO-RISK: None.*

**A4. Rule → proposal mapping (not just alert).** Each rule can target an **alert** (notify),
a **proposal** (write a row to the Proposals queue with verdict + rationale + numbers), or both.
Proposals remain inert until a human acts; on Expert + `ADS_WRITE_ENABLED`, a proposal can be
*converted to* an `ad_action` (still typed-YES). The rule never executes directly.
*Client $: High · Owner $: High · Dev: M · RO-RISK: Low (proposals are inert; only the existing gated path can execute, and only on explicit conversion).*

**A5. Dry-run / preview + automation log.** Before enabling a rule, show "this rule would have
fired N times over the last 14 days against these campaigns" (Revealbot's productized preview).
Every fire writes to the `alert_events` log (already exists) extended with `rule_id` linkage.
*Client $: Med · Owner $: Med · Dev: M · RO-RISK: None (read-only simulation over historical snapshots).*

### (b) Richer scheduling/cadence + multi-channel delivery

**B1. Multi-channel delivery abstraction.** Generalise `lib/email/resend.ts` into a
`deliver(channel, severity, payload)` dispatcher. Channels: **email** (exists), **Slack**
(incoming webhook / Block Kit, `#adpilot-alerts`), **WhatsApp** (Twilio or Meta WhatsApp Cloud
API — note it's a *separate* webhook shape per GOTCHAS), **generic webhook** (signed outbound).
Severity→channel matrix from the docs: Med/Low = email+Slack; High/Critical = email+Slack+WhatsApp.
Extend `notification_rules` with `slack_webhook_url`, `whatsapp_to`, `outbound_webhook_url`,
per-channel severity floors.
*Client $: High · Owner $: High (Slack alone is a top-asked SMB feature) · Dev: M · RO-RISK: None.*

**B2. Outbound webhooks (`alert.fired`, `report.ready`).** Sign with HMAC-SHA256 (reuse the
constant-time primitive already in the CRM webhook), retry with backoff (30s/2m/10m per docs),
no retry on 410, idempotency via `event_id`, strip raw PII. This is what wires AdPilot *into*
Make/Zapier/n8n as a trigger source.
*Client $: Med · Owner $: High (integration moat) · Dev: M · RO-RISK: None (outbound notification only).*

**B3. Per-rule + per-report cadence and quiet hours.** Today cadence is one global
`sync_interval_hours`. Add: per-rule check frequency (hourly→daily), report schedules
(daily digest, Monday 09:00 weekly, 1st-of-month monthly — AEST/owner TZ), and **quiet hours /
digest batching** so a noisy account doesn't page at 3am (batch into an 08:00 digest unless
Critical). Mirrors the docs' 08:00/13:00/20:00 run pattern.
*Client $: Med · Owner $: Med · Dev: M · RO-RISK: None.*

**B4. Alert dedup, escalation, and "resolved" notices.** Already dedup'd per (rule, campaign)
per run; add the documented escalation: recurring 2 days = ESCALATION, 5 consecutive days =
auto-bump one severity level, and emit an "ALERT RESOLVED" notice when a condition clears.
Reduces alert fatigue — the #1 reason alerting products get muted.
*Client $: Med · Owner $: Med · Dev: S · RO-RISK: None.*

**B5. Scheduled report delivery pipeline.** Wire the existing reports engine to a schedule:
generate → render (HTML/PDF) → white-label (strip internal thresholds/margins, rename engine
personas when `client_facing`) → deliver via B1 channels → archive. Closes the "engine exists,
delivery doesn't" gap.
*Client $: High · Owner $: High (agency retention) · Dev: M · RO-RISK: None.*

### (c) Integration surface (inbound + outbound)

**C1. Google Sheets connector (outbound + inbound).** Outbound: push `campaign_snapshots` /
report rows to a user's Sheet (append-only, the docs' universal 50-col schema) so they can build
their own pivots / feed Looker Studio. Inbound: a "Sheets import" that reads a tab back (V1
parity for non-API users). Service account, least-privilege, append-never-overwrite.
*Client $: High · Owner $: Med · Dev: M · RO-RISK: None.*

**C2. Looker Studio / BI handoff.** Document + template a Looker Studio dashboard built on the
Sheet (or a read replica view). Lowest-effort, highest-perceived-value reporting for agencies.
*Client $: Med · Owner $: Med · Dev: S (mostly template + docs) · RO-RISK: None.*

**C3. Inbound automation triggers (Make/Zapier/n8n → AdPilot).** Expose signed inbound
endpoints beyond CRM: `lead.created`, `payment.received`, plus a generic "trigger analysis /
fetch latest health" endpoint so external scenarios can pull AdPilot state. Reuse the CRM
webhook's HMAC + fail-closed + idempotency pattern verbatim.
*Client $: Med · Owner $: Med · Dev: M · RO-RISK: None (ingest/read only — never calls a platform).*

**C4. Outbound to Make/Zapier/n8n (AdPilot → automation).** B2's signed outbound webhooks +
publish official Make blueprint / Zapier app / n8n template (the framework already drafted
`make-daily-pull.blueprint.json` and the Zap/n8n specs). A "Connect to Zapier" button that
hands over an outbound webhook URL + signing secret.
*Client $: High · Owner $: High (distribution / ecosystem) · Dev: M (blueprints exist) · RO-RISK: None.*

**C5. CRM connectors (HubSpot/Pipedrive/GHL) + Lead Quality Score loop.** Build on the existing
`lead_events` table + CRM webhook. Add the documented LQS 0–10 model and true-CPA/ROAS
(`spend / won_leads`, `revenue / spend`). **Pick ONE canonical LQS formula** — the docs contain
two divergent ones (the outcome-table in `lead-quality-feedback-loop.md` vs the
`min(round(base × size_multiplier), 10)` in `zapier-zaps.md`). Recommend the outcome-table as canonical.
*Client $: High · Owner $: High (closes the volume→quality gap; pro+ gate exists) · Dev: L · RO-RISK: None (ingest only).*

### (d) "Autopilot with guardrails" — safe-to-automate vs always-proposal

The governing principle: **automation can sense, decide, and propose freely; it may only *act*
through the one existing gated path, and only when the human has explicitly opted that entity in.**

#### ALWAYS-PROPOSAL (never auto-executed, regardless of tier)
- Anything that **spends, pauses, kills, or changes budget/bid** on a live paid ad.
- Anything irreversible or without captured revert state.
- Any action on an entity below the minimum-data gate (surface `insufficient-data`, not a verdict).
- Offline conversion uploads (PII to Meta/TikTok) — proposal + privacy review + typed-YES.

#### SAFE TO AUTOMATE (no live-ad write — already our model)
- Data sync (read scopes), scoring, proposal generation, alert evaluation, notifications,
  report generation + delivery, Sheets/CRM appends, **own organic** content publishing
  (already shipped, separate from paid ads).

#### THE CONTROLLED MIDDLE (Expert-only, opt-in, behind every existing gate)
If/when the owner ever wants to inch toward execution, the *only* safe shape is:
auto-**queue** a fully-formed `ad_action` proposal (with revert state captured) that **still
requires typed-YES**. Even then, layer the web-confirmed guardrails BEFORE any such action can
be confirmed:

| Guardrail | Mechanism | Source |
|---|---|---|
| Max-change clamp | `new_budget = min(old × 1.10, account_cap)` on scale; `× 0.80–0.90` on reduce; ≤30% hard ceiling | adamigo / AnyTrack |
| Per-entity cooldown | Track `last_action_at`; suppress 24–72h after any change (Meta learning window) | adamigo |
| Spend caps | Daily/lifetime/account ceilings enforced before confirm | controlclick |
| Rate ceiling | Max changes/entity/day, max actions/hour | DevOps.com |
| Do-not-touch list | Label allowlist; automation only ever proposes on opted-in entities | EXPERT |
| Min-data gate | ≥~50 conversions (or `decide().safe` evidence) before kill/scale | EXPERT / Wave B |
| Dry-run default | `ADS_WRITE_ENABLED` off by default = global kill-switch | existing |

**Recommendation:** V6 ships (a)–(c) fully and the **always-proposal + safe-to-automate**
halves of (d). The controlled middle is documented and **owner-gated** — build the guardrail
primitives (cooldown table, max-change clamp, do-not-touch labels) as *validators on the
existing `ad_actions` path*, NOT as an autopilot. The product stays "propose; human approves."
This is the moat, not a limitation.

### (e) Cross-cutting / enabling

**E1. Wave-B ad-level sync correctness** (already in `pull.ts` — verify min-volume gating so
API-synced accounts never trip false-CRITICAL). *Client $: High · Owner $: High · Dev: S · RO-RISK: None.*

**E2. Long-lived System User token support** for unattended jobs (web: user tokens expire ~60d;
async report-run + poll for large pulls). *Client $: Med · Owner $: Med · Dev: M · RO-RISK: None.*

**E3. Automation audit log** (`automation_runs` / extend `alert_events`): every cron run, rule
fire, delivery attempt, and webhook in/out — status, retry_count, http_status. Trust + debugging.
*Client $: Low · Owner $: Med (support burden) · Dev: S · RO-RISK: None.*

---

## 4. Sequencing (suggested)

1. **Wave B-1 (correctness + foundation):** E1 min-volume gate, A1 rule schema + evaluator (seed ALT-001…013), A3 rolling-baseline operators, B4 escalation/resolved. → kills false-CRITICALs, ships the rules engine core.
2. **Wave B-2 (delivery + reach):** B1 multi-channel (Slack first, then WhatsApp), B5 scheduled report delivery, B3 cadence/quiet-hours, E3 audit log.
3. **Wave B-3 (ecosystem):** B2 outbound webhooks, C1 Sheets, C4 Make/Zapier/n8n blueprints + connect button, C2 Looker template.
4. **Wave B-4 (loops):** C5 CRM connectors + canonical LQS, C3 inbound triggers, A4/A5 rule→proposal + preview.
5. **Owner-gated (do not build without explicit sign-off):** controlled-middle guardrail validators (4d), offline-conversion-upload proposals, E2 System User token for the real-account audit.

## 5. Consistency flags to resolve before building
- **Two divergent LQS formulas** — pick the outcome-table as canonical (§C5).
- **`break_even_cpa` overloaded** for both CPA and CPL thresholds — split into `break_even_cpl`.
- **Meta CTR units** — must be ÷100 (% → decimal); Validation guard `ctr > 1`.
- **TikTok metric proxies are lossy** (three_second_views ← 2s, thruplays ← p100, saves ← likes) — any cross-platform rule must account for it.
- All framework docs and the live code uniformly assert `live_edit_block: true` +
  `use_paused_duplicates_only: true` + typed-YES for money-moving actions. **This is the
  non-negotiable invariant every V6 item above preserves.**

---

## 6. Sources

**Internal:** `adpilot-v2/lib/cron/{alerts,score}.ts`, `app/api/cron/{auto-sync,auto-analysis,weekly-digest,publish}/route.ts`,
`lib/sync/pull.ts`, `lib/proposals.ts`, `lib/email/resend.ts`, `lib/actions/execute.ts`, `app/api/actions/route.ts`,
`lib/entitlements.ts`, `supabase/migrations/{0002,0005,0018,0019}*.sql`,
`CPWORK/universal-ads-os/automations/*` (11 docs), `skills/no-code-automation-builder/SKILL.md`, `CLAUDE.md`.

**Web (research available):** Revealbot/Birch — pipiads, bir.ch (features / first-rule), Slack Marketplace, adlibrary,
get-ryze. Smartly.io PBA — smartly.io product/resources/support, cometly. Madgicx vs AdEspresso — admanage.ai,
adlibrary, adstellar. Anomaly detection — improvado.io, madgicx.com, 2pointagency, growth-onomics, Medium/Hansaria.
Integrations/reporting — n8n.io templates (6328/11499/2714), eesel.ai, zapier.com, Zapier community. Guardrails —
adamigo.ai (×2), anytrack.io, controlclick.co, devops.com. (Some vendor pages 403-blocked to the fetcher; detail
from search snippets + RevOps expertise, flagged inline.)
```
