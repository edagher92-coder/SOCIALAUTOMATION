# AdPilot OS V6 — Tier Architecture & Per-Tier Feature Map

> **Owners:** Piper (productisation) + competitive-intelligence strategist.
> **Date:** 2026-06-16 · **Status:** Phase-0 packaging deliverable. Read-only on code; this is the
> only file written. **No prices set** — all AUD numbers stay owner-gated (`null` / "See pricing").
> **Inputs (read in full):** `v6-research/01-competitive-teardown.md`, `04-diagnostics.md`,
> `07-monetisation.md`; `V6-PHASE-ROADMAP.md`; live truth `adpilot-v2/lib/entitlements.ts` +
> `lib/plans.ts`.
> **Mandate:** decide the per-tier feature map for the paid tiers (Starter / Pro / Expert; Free = entry)
> — what's NEW, what should MOVE, what to REMOVE. Only features genuinely *true to the app* (a
> read-only Meta/TikTok audit + safe-proposal OS) that help **both** the back-end (owner / operator /
> agency) **and** clients. No bloat.

---

## 0. Design principles (the rules every tier decision obeys)

1. **The safety wedge is never gated.** "Physically cannot wreck your account" + "proves its own maths"
   (`decide().safe === true`, explainability) powers PLG word-of-mouth and de-risks resale. It lives at
   **Free** and rises with every tier. (Teardown L1/L2; monetisation §2.)
2. **Free must deliver the *aha*, withhold the *habit*.** Free = a real Health Score on your own data.
   The recurring habit — live sync, automation, the AI team, multi-client — is paid. Activation drives
   60–75% of conversion (monetisation §2), so Free has to be genuinely useful, not a teaser.
3. **Gate *capability*, meter *usage*; never paywall *UX*.** Simple vs Advanced view is a UX toggle, not
   a tier (roadmap P2). ARPU expansion comes from capability tiers + usage allowances (ad accounts /
   AI actions), not from hiding the dual-mode view. (Monetisation §2 packaging rules.)
4. **Each new feature must help client AND back-end.** A feature that only flatters a demo (pure
   "owner $") or only helps the operator with no client value is bloat. Every row below is justified on
   both axes or it is cut.
5. **The diagnostic ladder is the natural tier spine.** Free = *snapshot* score; Starter = *report + watch*;
   Pro = *live, predictive, multi-account intelligence*; Expert = *resell it under your brand, with gated
   reversible execution*. Capability deepens; safety/explainability is constant.
6. **Owner-gated stays owner-gated.** Prices, the auto-execute "controlled middle", reverse-trial length,
   metering allowances — mechanisms only here; numbers in the Owner Queue (roadmap §Owner Decision Queue).

---

## 1. Tier headlines (the one-line promise per tier)

| Tier | One-line promise | Who it's for |
|---|---|---|
| **Free** | "Paste your numbers, get an explainable Health Score and your wasted-spend figure — in 60 seconds, no card." | First-touch / DIY / evaluator. The aha. |
| **Starter** | "Your DIY ad cockpit: unwatermarked reports, scheduled exports, and a configurable watch-tower that emails you before things break." | Solo operator / one business owner running their own ads. |
| **Pro** | "Live Meta+TikTok intelligence: auto-sync, the 12-agent team, predictive creative-fatigue + significance-gated verdicts, MER/CRM truth, and up to N client accounts." | Freelancer / in-house operator / small agency. The workhorse. **Most popular.** |
| **Expert / Agency** | "Resell it as your own: deep white-label cockpit, portfolio rollup, client logins, reseller/marketplace plumbing — plus gated, reversible, audit-logged ad actions." | Agencies + power resellers. Highest ARPU + resale leverage. |

---

## 2. Tier × Feature map (the full matrix)

Legend: **●** included · **○** not in this tier · tag in the feature cell.
Tags: **KEEP** (stays where it is) · **NEW** (new V6 `Feature` key) · **MOVE(from→to)** (changes tier) ·
**REMOVE** (cut as a gate). "Helps" = **C**lient / **B**ack-end (owner/operator/agency).

### 2.1 Existing features (live `Feature` union) — KEEP / MOVE / REMOVE

| Feature (live key) | Tag | Free | Starter | Pro | Expert | True-to-app + who it helps |
|---|---|:--:|:--:|:--:|:--:|---|
| `csv_import` | KEEP | ● | ● | ● | ● | The free aha; paste a CSV → score. **C** (instant value) **B** (zero-friction top-of-funnel). |
| `health_score` | KEEP | ● | ● | ● | ● | The 13-factor explainable core — the product's identity; must be free. **C/B**. |
| `reports` | KEEP (Free gets 1 watermarked) | ◐¹ | ● | ● | ● | Deterministic report tables; the Starter habit. **C** (deliverable) **B** (saves spreadsheet hours). |
| `threshold_alerts` | KEEP | ○ | ● | ● | ● | Configurable watch-tower (rules engine P5). The Starter "set & forget". **C** (catches problems) **B** (no manual monitoring). |
| `content_publish` | **MOVE (starter→pro)** | ○ | ○ | ● | ● | Organic publishing is a *write scope* peripheral to the core audit; few solo users need it and it muddies Starter's "diagnose" story. Belongs with the live-connected Pro tier. **C** (modest) **B** (operator convenience). |
| `creative_studio` | KEEP | ○ | ○ | ● | ● | AI-drafted creative + Canva/Adobe; now *fed by* the Pro fatigue scorer (P6.3). **C** (better ads) **B** (faster production). |
| `api_connect` | **MOVE (pro→starter)**² | ○ | ●² | ● | ● | OAuth/dev-link is the live-data on-ramp; **read-only connect** is safe and is the single biggest activation/retention lever. Let Starter *connect one account* (read-only); reserve **multi-account + auto-sync cadence** for Pro. **C** (live truth) **B** (retention moat). |
| `auto_sync` | KEEP | ○ | ○ | ● | ● | Cadence-based automated pulls — the recurring habit that defines Pro. **C** (always-fresh) **B** (the retention engine). |
| `ai_team` | KEEP | ○ | ○ | ● | ● | 12-persona specialist team — Pro's headline. **C** (expert advice) **B** (the "teammate" moat). |
| `multi_client` | KEEP (→ metered in P7) | ○ | ○ | ● | ● | Client workspaces; Pro = banded allowance, Expert = banded-high. **C** (n/a) **B** (the agency/freelancer multiplier). |
| `lead_quality_loop` | KEEP | ○ | ○ | ● | ● | CRM/lead webhook → lead-quality score; the AU lead-gen wedge (teardown L3). **C** (cheap vs *good* leads) **B** (revenue attribution = anti-churn). |
| `white_label` | KEEP | ○ | ○ | ○ | ● | Brand-it-as-yours; the resale tier identity (deepened in P7). **C** (branded delivery) **B/Reseller** (69–99% margin). |
| `messenger_automation` | **REMOVE (as a tier feature)** | ○ | ○ | ○ | ○ | See §4 — cut from the gated ladder; off-thesis (organic chat bot, not ad-audit). |
| `ad_write` | KEEP | ○ | ○ | ○ | ● | Guarded, reversible, typed-YES + `ADS_WRITE_ENABLED` live actions — Expert-only, double-gated. The "autopilot you can't be hurt by" headline (teardown L1). **C** (one-tap fixes) **B** (premium capability). |
| `expert_plugins` | KEEP | ○ | ○ | ○ | ● | Team-/third-party-built extras; the ecosystem hook (P7.5 marketplace). **B/Reseller** (margin + lock-in). |

¹ **Free `reports`:** Free gets **1 watermarked report** (monetisation §2; roadmap owner-Q17). This is a
*cap on an existing feature*, not a new gate key — enforced in the report route, not `FEATURE_MIN_PLAN`.
The `reports` *gate* stays `starter` (unwatermarked, unlimited). See §5 note.

² **`api_connect` at Starter is read-only single-account connect.** The gate key moves to `starter`, but
the **cadence/automation** (`auto_sync`) and **multiple accounts** (`multi_client`) stay Pro. This is the
"zero-config first value in <60s" steal (teardown — Shopify/Birch) without giving away the automation
habit. If the owner prefers to keep all live connect at Pro for simplicity, this is the one MOVE to
revert — flagged in §6.

### 2.2 NEW features (proposed V6 `Feature` keys) — where each lands

| New feature (proposed key) | Free | Starter | Pro | Expert | Backing source | True-to-app + who it helps |
|---|:--:|:--:|:--:|:--:|---|---|
| `wasted_spend` (live "wasted-spend found" hero metric) | ●³ | ● | ● | ● | mon §5.1; road P2.5 | Quantifies the ROI of the subscription on the user's own data. **C** (sees the saving) **B** (the #1 renewal justification for a read-only tool). |
| `diagnostics_pro` (timeseries trends, anomaly, run-rate forecast, MER/blended, sparklines) | ○ | ◐⁴ | ● | ● | diag (a),(d); road P3.1/3.4/3.5 | Reads the daily snapshot series we already store. **C** (catches drift early) **B** (the "best at diagnostics" upsell). |
| `creative_intel` (per-ad fatigue score + **predictive 2–3-day early-warning** + hook/hold funnel decomposition + Creative Scorecard) | ○ | ○ | ● | ● | diag (b) items 7–9; teardown #1; road P3.3/P6.2 | The single most demoable, highest-client-value diagnostic. **C** (fix fatigue before CTR drops) **B** (the screenshot-into-the-deck feature that sells Pro). |
| `confidence_engine` (Wilson CIs + significance-gated kill/scale + "Prove the maths" explainability panel) | ●⁵ | ● | ● | ● | diag (c) 11–14; teardown L2 #2; road P3.2/P4.1 | Pure moat; stops killing winners on a noisy fortnight; converts skeptics. **C** (trustworthy verdicts) **B** (de-risks resale; cheap). Surfaced at every tier; *deepened* (CI-gated verdicts) where verdicts are acted on. |
| `forecasting` (CPA/ROAS + budget-pacing run-rate with confidence band) | ○ | ○ | ● | ● | diag (a) item 5; teardown #6 (Hyros); road P3.5 | High perceived value; reuses engine maths. **C** ("on track to spend $X → ~$Y") **B** (strong upsell, differentiates from dashboards). |
| `rule_builder` (visual if-this-then-PROPOSE automation builder; inert proposals only) | ○ | ○ | ● | ● | teardown #4 (Revealbot); road P5.2 | Power-user surface; rules *fire proposals/alerts*, never execute. **C** (automates routine ops) **B** (agencies live in rules). Pairs with `ad_write` at Expert for optional gated execute. |
| `data_export` (scheduled push to Google Sheets / Looker / BigQuery on a cron) | ○ | ● | ● | ● | teardown #10 (Supermetrics); road P5.4 | Meets agencies in their existing reporting surface. **C** (works where they already report) **B** (cheap, high stickiness, low risk). |
| `portfolio_cockpit` (multi-client rollup: rank clients by health, flag worst, bulk branded reports) | ○ | ○ | ◐⁶ | ● | teardown L4 #8; mon §4.2; road P7.3 | "Open one tool, see the whole book." **C** (n/a) **B/Reseller** (grows the highest-ARPU tier; the agency north-star). |
| `crm_attribution` (platform-vs-CRM reconciliation gap >20% + true-CPA/ROAS) | ○ | ○ | ● | ● | diag (d) item 16; mon §5.5; road P3.4/P5.5 | "Your platform says 40 sales; your CRM recorded 28." The AU lead-gen trust wedge (L3). **C** (real revenue truth) **B** (revenue-attributed clients don't churn). |
| `vertical_benchmarks` (percentile rank vs vertical/objective: "34th percentile for finance lead-gen") | ○ | ○ | ● | ● | diag (e) 20–22; road P6.5 | Turns "CTR is a bit low" into a located, ranked verdict. **C** (context for every number) **B** (perceived authority). |
| `offer_landing_review` (activate the two NEUTRAL health factors via structured intake + LP signals) | ○ | ◐⁷ | ● | ● | road P6.1 (stream 06) | Reclaims the 9% of the score wasted on placeholders. **C** (a fuller, fairer score) **B** (more accurate engine = more trust). |
| `marketplace` (sell/buy report templates, dashboard layouts, alert-rule packs; rev-share) | ○ | ○ | ○ | ● | mon §4.4; road P7.5 | Turns the moat into an ecosystem. **B/Reseller** (margin + lock-in; creators earn). |
| `reseller_program` (sub-account re-billing, partner dashboard, referral attribution) | ○ | ○ | ○ | ● | mon §4.5; road P7.5 | CAC-light growth loop. **B/Reseller** (recurring commission). |

³ `wasted_spend` is computed from the same economics Free already runs — it's a *surface*, not a new
capability; making it free maximises the PLG hook. Could be a display-only flag rather than a hard gate
(see §5).
⁴ **Starter `diagnostics_pro` = lite:** period-over-period + sparklines + run-rate on *imported/connected
single-account* data (no auto-refresh). Full multi-window/anomaly/MER lives at Pro. Implementable as a
single `diagnostics_pro` key gated at `pro`, with the *lite* slice riding the always-on engine output Free
already gets — i.e. don't over-key it. **Recommendation: one key at `pro`; Starter sees only the static
sparkline already in the report.**
⁵ `confidence_engine` (the explainability "Prove the maths" panel + honest CIs) is surfaced from **Free**
because it *is* the moat and costs nothing to show; the *significance-gated kill/scale* logic only matters
where verdicts are produced (Free already shows verdicts, so it applies everywhere). Treat as
display+engine, gate at `free`. (See §5 — likely **not** a `FEATURE_MIN_PLAN` key at all; it's core engine
behaviour. Listed for completeness, recommended NOT to add as a gate.)
⁶ **Pro gets a *read-only* portfolio list** (rank your N connected accounts by health); Expert gets the
*branded, client-login, bulk-report, re-billing* cockpit. Implement as `portfolio_cockpit` at `pro` for the
list view + the deeper white-label pieces riding existing `white_label`/`multi_client` at Expert. **If
kept simple: one `portfolio_cockpit` key at `pro`; the branded/login/re-bill depth gates on `white_label`
(expert).**
⁷ **Starter `offer_landing_review` = the intake form only** (improves *their own* single account's score);
the AI-assisted offer/landing copywriting rides `creative_studio`/`ai_team` (Pro). Gate the review-storage
key at `starter` so a DIY operator gets a fuller score; the AI assist stays Pro. *(Optional — if minimising
new keys, fold into Pro.)*

---

## 3. The 5–8 highest-leverage NEW features to build (ranked)

Ranked by (Client × Back-end × Revenue) ÷ effort, weighted by moat-fit. Each tagged Impact axes + rough
effort + the v6-research source that backs it.

| # | Feature | Impact | Effort | Backed by | Why it's top-leverage |
|---|---|---|---|---|---|
| **1** | **Predictive creative-fatigue + Creative Scorecard** (`creative_intel`) — per-ad fatigue score, **2–3-day early-warning** (falling hold-rate while CTR still flat), hook/hold funnel decomposition, ranked scorecard by angle/format | **Client ●●** (revenue) · **Back-end ●●** (the demo that sells Pro) · Revenue ● | **M** | diag (b) 7–9 (headline); teardown #1; road P3.3/P6.2 | Most demoable feature in the category; data already stored; catches decay *before* CTR drops — best-in-class 2026 behaviour. Sells the Pro upgrade and screenshots into client decks. |
| **2** | **Significance-gated verdicts + "Prove the maths" panel** (`confidence_engine`) — Wilson CIs, "83% probability true CPA is above break-even", one-click selftest on every verdict | **Client ●** · **Back-end ●●** (pure moat, de-risks resale) · Revenue ◐ | **S–M** | diag (c) 11–14; teardown L2; road P3.2 | Cheap, foundational, converts skeptics, stops killing winners on noise. The trust layer everything else rides on. *(Likely core-engine, not a paid gate — see §5.)* |
| **3** | **Configurable rule builder → proposals** (`rule_builder`) — visual if-this-then-PROPOSE; inert proposals/alerts only; dry-run preview | **Client ●** · **Back-end ●●** (agencies live in rules) · Revenue ● | **M** | teardown #4 (Revealbot); road P5.2 | Replaces 4 hard-coded alerts with a user-configurable watch-tower; the power-user surface that defines Pro/Expert and pairs with gated `ad_write`. |
| **4** | **Platform-vs-CRM attribution reconciliation** (`crm_attribution`) — flag >20% gap, true-CPA/ROAS from `lead_events` | **Client ●●** (revenue truth) · **Back-end ●** (anti-churn) · Revenue ● | **M** | diag (d) 16; mon §5.5; road P3.4/P5.5 | "Your platform is lying by ~30%" is the #1 SMB trust gap; the AU lead-gen wedge (L3); revenue-attributed clients don't churn. |
| **5** | **Live "wasted-spend found" hero metric** (`wasted_spend`) | **Client ●** (sees the saving) · **Back-end ●●** (renewal justification) · Revenue ●● | **S** | mon §5.1; road P2.5 | The strongest renewal argument for a *read-only* tool — a live computed number, not a sales line. Cheapest, fastest ARPU/retention lift. |
| **6** | **Agency portfolio cockpit + bulk branded reports** (`portfolio_cockpit`) — rank clients by health, flag worst, white-label export | **Client ◐** · **Back-end ●●** (highest-ARPU tier) · Revenue ●● | **M–L** | teardown L4 #8; mon §4.2; road P7.3 | Directly grows the top tier; "see the whole book in one tool"; pure owner/reseller-$ play, moat-aligned (safe + explainable resale). |
| **7** | **Gated, reversible auto-execute** (deepen `ad_write`) — rules → typed-YES → audit-logged, env-gated; "autopilot you can't be hurt by" | **Client ●●** (one-tap fixes) · **Back-end ●** · Revenue ● | **L** | teardown L1 #3; road P5 note + Owner-Q18 | The marquee differentiator no competitor can honestly claim. **Owner-gated** (the "controlled middle") — build validators only on green-light; stays Expert + double-gated. |
| **8** | **Scheduled export to Sheets / Looker / BigQuery** (`data_export`) | **Client ●** (works where they report) · **Back-end ●** (stickiness) · Revenue ◐ | **S–M** | teardown #10 (Supermetrics); road P5.4 | Cheap, low-risk stickiness; meets agencies in their existing surface instead of forcing ours. Good Starter sweetener + Pro/Expert table-stakes. |

**Build order alignment with the converged roadmap:** #2 (P3.2) + #5 (P2.5) are cheapest/earliest;
#1 + #4 (P3.3/P3.4) are the diagnostics headline; #3 + #8 (P5.2/P5.4) are automation; #6 (P7.3) and #7
(owner-gated) are last. This matches `V6-PHASE-ROADMAP.md` exactly — no re-sequencing needed.

---

## 4. Features to CUT (and why)

| Feature | Action | Reason |
|---|---|---|
| **`messenger_automation`** (live key, Expert) | **REMOVE from the tier ladder** | **Off-thesis.** It is a rule-based *organic Messenger chat bot* set up via Graph API — not part of a read-only Meta/TikTok **ad audit + safe-proposal** OS. It helps neither the audit's accuracy nor a client's *ad* outcomes; it's a different product (conversational marketing) bolted onto the premium tier to pad it. Keeping it: (a) dilutes the Expert "resell the audit under your brand" story, (b) carries a write-scope/Graph-permission surface that contradicts the read-only wedge, (c) is bloat by the mandate's own test (must help the *audit* for both client and back-end — it does neither). **Disposition:** drop the gate from `FEATURE_MIN_PLAN` and the Expert `headlineFeatures`; if any user depends on the existing bot, keep the code path behind an env flag as a *legacy/unlisted* capability, not a sold tier feature. Expert's headline is far stronger as **white-label + portfolio + reversible ad actions** without it. |
| **`content_publish` at Starter** | **MOVE to Pro** (not a full cut) | Organic publishing is a peripheral write scope; on Starter it muddies the clean "diagnose + report + watch" DIY story and few solo users need it. It belongs with the live-connected Pro tier. (Listed in §2.1.) |

**Nothing else is cut.** Every other live key earns its place (see §2.1 justifications). The temptation to
add attribution/LTV/MMM/forecasting-heavy features is resisted per diagnostics §(f): full MMM is
*don't-ship*; geo-holdout/LTV are Expert-tier *research-flagged* (Owner Queue), **not** core tier features
— they would be bloat at the SMB tiers and false precision at small data volumes.

---

## 5. Note: not everything belongs in `FEATURE_MIN_PLAN`

Two proposed items are **engine/display behaviour, not paid gates** — adding them as `Feature` keys would
be over-keying and would (worse) imply the moat is paywalled:

- **`confidence_engine` / "Prove the maths"** — this *is* the product's core (explainable, self-verifying).
  It must be visible from **Free**. **Recommendation: do NOT add a gate key**; ship it as default engine
  output. (Listed in §2.2 for completeness with a `free` tag, but the cleanest implementation adds no
  entitlement.)
- **`wasted_spend`** — computed from economics Free already runs. Could be a display flag. **Recommendation:
  if a gate is wanted for marketing symmetry, gate at `free` (i.e. effectively ungated); otherwise add no
  key.** A watermark/cap on the *report* (Free = 1 watermarked) is enforced in the report route, not via a
  new gate.

This keeps the entitlement surface minimal (the §6 changes), honouring the live file's "adding a feature =
one line" discipline and the entitlements↔plans drift-alarm.

---

## 6. Exact `entitlements.ts` changes implied

Below is the precise diff intent for `adpilot-v2/lib/entitlements.ts`. **Add the new keys to the `Feature`
union, `FEATURE_MIN_PLAN`, and `FEATURE_LABEL` together** (the file's three parallel maps), and update the
two MOVE/REMOVE rows. Keep `plans.ts` `headlineFeatures` in sync (drift-alarm test must stay green).

### 6.1 `Feature` union — add 8 new keys, keep `messenger_automation` type but drop its gate

```ts
export type Feature =
  | "csv_import"
  | "health_score"
  | "reports"
  | "api_connect"
  | "auto_sync"
  | "ai_team"
  | "content_publish"
  | "creative_studio"
  | "messenger_automation" // legacy: kept in type for back-compat; NO LONGER a sold tier gate (see note)
  | "ad_write"
  | "lead_quality_loop"
  | "threshold_alerts"
  | "multi_client"
  | "white_label"
  | "expert_plugins"
  // ── V6 new keys ──
  | "diagnostics_pro"     // timeseries trends, anomaly, run-rate forecast, MER/blended panel
  | "creative_intel"      // per-ad fatigue + predictive early-warning + hook/hold + Creative Scorecard
  | "forecasting"         // CPA/ROAS + budget-pacing run-rate w/ confidence band
  | "rule_builder"        // visual if-this-then-PROPOSE automation builder (inert proposals only)
  | "data_export"         // scheduled push to Sheets / Looker / BigQuery
  | "crm_attribution"     // platform-vs-CRM reconciliation gap + true-CPA/ROAS
  | "vertical_benchmarks" // percentile rank vs vertical/objective
  | "portfolio_cockpit"   // multi-client rollup: rank by health, flag worst, bulk branded reports
  | "marketplace"         // templates/layouts/rule-packs (rev-share)
  | "reseller_program";   // sub-account re-billing, partner dashboard, referral attribution
```

> **Deliberately NOT added as keys:** `confidence_engine` and `wasted_spend` (core engine/display — see §5).
> **`offer_landing_review`** is optional — recommend folding into `creative_studio`/`ai_team` (Pro) rather
> than a new key, to keep the surface minimal; add a `offer_landing_review: "starter"` key only if the owner
> wants DIY-Starter to improve its own score via the intake form.

### 6.2 `FEATURE_MIN_PLAN` — gates (the changes)

```ts
export const FEATURE_MIN_PLAN: Record<Feature, Plan> = {
  csv_import: "free",
  health_score: "free",
  reports: "starter",
  api_connect: "starter",        // ← MOVE pro→starter (read-only single-account connect; see §2.1 note ²)
  auto_sync: "pro",              // (unchanged — cadence stays Pro)
  ai_team: "pro",
  content_publish: "pro",        // ← MOVE starter→pro (peripheral write scope; §4)
  creative_studio: "pro",
  messenger_automation: "expert",// ← REMOVE from sold ladder: drop from headlineFeatures; flag-gate code.
                                 //    (Type kept; can be left at "expert" but is no longer advertised,
                                 //    or routed to an env flag. Recommend: leave gate, remove from plans.ts.)
  ad_write: "expert",
  lead_quality_loop: "pro",
  threshold_alerts: "starter",
  multi_client: "pro",           // (→ metered allowance in P7; gate unchanged)
  white_label: "expert",
  expert_plugins: "expert",
  // ── V6 new gates ──
  diagnostics_pro: "pro",        // full timeseries/anomaly/MER (Starter sees only static report sparklines)
  creative_intel: "pro",         // the headline diagnostic — Pro
  forecasting: "pro",
  rule_builder: "pro",           // proposals only; pairs w/ ad_write at Expert for optional gated execute
  data_export: "starter",        // cheap stickiness; Starter sweetener + Pro/Expert table-stakes
  crm_attribution: "pro",        // uses lead_events; the AU lead-gen wedge
  vertical_benchmarks: "pro",
  portfolio_cockpit: "pro",      // read-only rollup at Pro; branded/login/re-bill depth rides white_label
  marketplace: "expert",
  reseller_program: "expert",
};
```

### 6.3 `FEATURE_LABEL` — add labels for the new keys

```ts
  diagnostics_pro: "Pro diagnostics (trends, anomalies, MER)",
  creative_intel: "Creative intelligence (fatigue early-warning + Scorecard)",
  forecasting: "Spend & ROAS forecasting",
  rule_builder: "Automation rule builder (proposals)",
  data_export: "Scheduled data export (Sheets/Looker/BigQuery)",
  crm_attribution: "CRM attribution reconciliation",
  vertical_benchmarks: "Vertical benchmark percentiles",
  portfolio_cockpit: "Agency portfolio cockpit",
  marketplace: "Template & dashboard marketplace",
  reseller_program: "Partner / reseller program",
```

### 6.4 `plans.ts` `headlineFeatures` — keep display in sync (no prices)

- **Free:** `["csv_import", "health_score"]` *(unchanged)*.
- **Starter:** `["reports", "api_connect", "threshold_alerts", "data_export"]`
  *(was `["reports","content_publish"]` — content_publish moved out; api_connect + data_export in;
  alerts surfaced)*.
- **Pro:** `["api_connect", "auto_sync", "ai_team", "creative_intel", "crm_attribution", "multi_client"]`
  *(swap the generic `creative_studio` headline for the demoable `creative_intel`; add `crm_attribution`)*.
- **Expert:** `["white_label", "portfolio_cockpit", "ad_write", "expert_plugins"]`
  *(replace `messenger_automation` with `portfolio_cockpit` — the real Expert headline; drop the bot)*.

> **Drift-alarm contract:** every `headlineFeatures` entry must be gated at-or-below its plan in
> `FEATURE_MIN_PLAN`. Verified above: Starter headlines are all ≤ starter; Pro all ≤ pro; Expert all ≤ expert.
> Run `vitest plans.test.ts` after the edit. Prices stay `null` / "See pricing".

---

## 7. Summary table — the V6 ladder at a glance

| | **Free** | **Starter** | **Pro** | **Expert** |
|---|---|---|---|---|
| **Promise** | Score + wasted-spend, free | DIY cockpit: reports, alerts, export, 1 connected account | Live intelligence: auto-sync, AI team, creative early-warning, CRM truth, N accounts | Resell it: white-label, portfolio, reversible ad actions, marketplace |
| **Core** | csv_import, health_score, 1 watermarked report, wasted-spend, "prove the maths" | + reports, threshold_alerts, api_connect (read-only, 1 acct), data_export | + auto_sync, ai_team, creative_studio, content_publish, multi_client, lead_quality_loop | + white_label, ad_write, expert_plugins |
| **V6 new** | (moat surfaces, ungated) | data_export | diagnostics_pro, creative_intel, forecasting, rule_builder, crm_attribution, vertical_benchmarks, portfolio_cockpit | marketplace, reseller_program, deep portfolio_cockpit |
| **Cut** | — | content_publish moved up | — | messenger_automation dropped |

---

## 8. Open items left to the owner (do not decide here)

1. **`api_connect` → Starter (read-only single-account):** approve, or keep all live connect at Pro? (The
   one MOVE worth a second look; §2.1 note ².)
2. **`messenger_automation` disposition:** fully retire, or keep as an unlisted env-flagged legacy path?
3. **`offer_landing_review` keying:** new `starter` key, or fold into Pro `creative_studio`/`ai_team`?
4. **All pricing numbers + metering allowances + reverse-trial length** — per `V6-PHASE-ROADMAP.md`
   Owner Decision Queue (unchanged; not a tier-architecture call).
5. **Auto-execute "controlled middle"** (deepen `ad_write` toward gated auto-queue) — owner green-light
   only (roadmap Owner-Q18).
```
