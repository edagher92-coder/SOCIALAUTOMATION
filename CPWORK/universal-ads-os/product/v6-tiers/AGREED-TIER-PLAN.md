# AdPilot OS V6 — AGREED Tier Plan (management convergence)

> **Panel:** 4 PMs — (1) Engineering-Delivery, (2) Product/Launch, (3) Security/Compliance,
> (4) Commercial/Brand. Convened to converge the four V6-tiers council outputs into ONE agreed
> plan. **Read-only on code; this is the single file written. No git, no installs.**
> **Date:** 2026-06-16 · **Status:** CONSENSUS reached (see §6).
> **Inputs converged:** `v6-tiers/01-tier-architecture.md`, `02-gui-implementation.md`,
> `03-ops-value.md`, `04-data-consent.md`; live truth `adpilot-v2/lib/entitlements.ts` +
> `lib/plans.ts` + `lib/plans.test.ts` (drift alarm); `V6-PHASE-ROADMAP.md`.

---

## 0. The bar the panel held the proposals to

The councils are strong, but the panel applied **hard scrutiny** to the three bold moves and did
**not** rubber-stamp them. The governing rules:

1. **Don't delete working features.** `messenger_automation` is BUILT and SHIPPED (live `/messenger`
   page, gate at `expert`, listed in Expert's `headlineFeatures` *and* `blurb`). The only defensible
   move is to **UNLIST it from marketing**, not remove the code or the gate.
2. **Don't loosen a cost/abuse surface without a cap.** Live `api_connect` is the gateway to OAuth /
   System-User tokens, Meta/TikTok **rate limits**, the cron fan-out (roadmap P1.1/P1.2 are explicitly
   about scale/silent-failure risk), and stored credentials. Moving it to the cheapest paid tier
   multiplies token count and rate-limit exposure. **Default = do NOT loosen** unless there is a hard,
   safe cap — and even then it touches operational risk, so it is owner-gated.
3. **Any change to an EXISTING customer's entitlement is a migration/comms event.** A *downgrade*
   (removing capability a paying tier has today) cannot be silently flipped. Flagged, never auto-applied.
4. **The drift alarm and the exhaustive maps stay green.** Every new `Feature` key is added to the
   `Feature` union **and** `FEATURE_MIN_PLAN` **and** `FEATURE_LABEL` together (the file's three
   parallel `Record<Feature,…>` maps), and every `headlineFeatures` entry must `can()` at its tier
   (`plans.test.ts`). Prices stay `null` / "See pricing".

**Net effect on existing customers:** the agreed *shippable* set is **100% safe-additive** — no live
gate moves, no downgrades. The contested moves (api_connect, content_publish, messenger relisting) are
all routed to the Owner-Gated list (§5), not applied. New keys only widen the surface; they never
remove access anyone already paid for.

---

## 1. AGREED per-tier feature map

Tags: **KEEP** (gate unchanged) · **NEW** (new V6 `Feature` key, safe-additive) · **MOVE** (changes an
existing gate — **owner-gated**, touches existing customers) · **REMOVE/UNLIST** (drop from marketing
only, code + gate retained). "Safe" column = safe-additive (ship now) vs owner-decision (hold).

### 1.1 Existing live keys — disposition

| Feature (live key) | Free | Starter | Pro | Expert | Tag | Safe? | Panel rationale |
|---|:--:|:--:|:--:|:--:|---|---|---|
| `csv_import` | ● | ● | ● | ● | KEEP | ✅ | The free aha. Unchanged. |
| `health_score` | ● | ● | ● | ● | KEEP | ✅ | 13-factor core identity; free forever. Unchanged. |
| `reports` | ◐¹ | ● | ● | ● | KEEP | ✅ | Gate stays `starter`. Free = 1 watermarked (report-route cap, **not** a gate key). |
| `threshold_alerts` | ○ | ● | ● | ● | KEEP | ✅ | Stays `starter`. Basic CRITICAL email stays free. |
| `api_connect` | ○ | ○ | ● | ● | **KEEP (not MOVE)** | ✅ | **Panel overrides council 01's pro→starter MOVE.** Live connect = token/rate-limit/cron cost surface (councils 03+04). Gate stays `pro`. A capped Starter-lite variant is **owner-gated** (§5), not shipped. |
| `auto_sync` | ○ | ○ | ● | ● | KEEP | ✅ | Cadence pulls define the Pro habit. Unchanged. |
| `ai_team` | ○ | ○ | ● | ● | KEEP | ✅ | 12-persona team; Pro headline. Unchanged. |
| `creative_studio` | ○ | ○ | ● | ● | KEEP | ✅ | AI creative; now fed by P6.3. Unchanged. |
| `content_publish` | ○ | ●² | ● | ● | **KEEP at starter (NOT moved)** | ✅ | **Panel does NOT apply council 01's starter→pro MOVE.** It is in Starter's live `blurb` today; moving it = a **downgrade** for current Starter customers (comms/migration). Hold at `starter`; the cleanup is owner-gated (§5). |
| `lead_quality_loop` | ○ | ○ | ● | ● | KEEP | ✅ | CRM/lead webhook → lead score. AU lead-gen wedge. Unchanged. |
| `multi_client` | ○ | ○ | ● | ● | KEEP | ✅ | Pro+. Metering is a separate P7 mechanism (owner-gated allowances). Gate unchanged. |
| `white_label` | ○ | ○ | ○ | ● | KEEP | ✅ | Expert-only resale identity. Unchanged. (Drift test asserts this.) |
| `ad_write` | ○ | ○ | ○ | ● | KEEP | ✅ | Quadruple-gated (Expert + `ADS_WRITE_ENABLED` + typed-YES + write-scope). Unchanged. |
| `expert_plugins` | ○ | ○ | ○ | ● | KEEP | ✅ | Ecosystem hook. Unchanged. |
| `messenger_automation` | ○ | ○ | ○ | ● | **UNLIST (code+gate KEPT)** | ✅³ | **Panel rejects council 01's REMOVE-the-feature framing.** It is BUILT/SHIPPED. Keep the code, keep the `/messenger` page, **keep the gate at `expert`** (no existing Expert customer loses it). Only change: drop it from `plans.ts` `headlineFeatures` + `blurb`, replaced by `portfolio_cockpit` (a stronger Expert headline). Zero entitlement change → safe-additive. |

¹ Free `reports` = **1 watermarked report**, enforced in the report route, not `FEATURE_MIN_PLAN`. Gate stays `starter`.
² `content_publish` lives at `starter` today and is advertised in Starter's blurb — see §5 for the proposed cleanup (owner-gated).
³ Unlisting is a `plans.ts`-only edit. The `messenger_automation` *gate* and *type* are untouched, so it is not an entitlement change — it is a marketing-surface change. Safe-additive.

### 1.2 NEW keys — where each lands (all safe-additive)

These are **new gates that only widen** what a tier can do (or are gated at `pro`/`expert` where they
were never available before). No existing customer loses anything. All ride the V6 value surfaces the
roadmap already sequences (P3/P5/P6/P7).

| New key | Free | Starter | Pro | Expert | Roadmap | Panel rationale |
|---|:--:|:--:|:--:|:--:|---|---|
| `diagnostics_pro` | ○ | ○ | ● | ● | P3.1/3.4/3.5 | Timeseries trends, anomaly, run-rate, MER/blended. One key at `pro`; Starter sees only the static report sparkline (no new key needed for the lite slice). |
| `creative_intel` | ○ | ○ | ● | ● | P3.3/P6.2 | Per-ad fatigue + **2–3-day predictive early-warning** + hook/hold + Creative Scorecard. The most demoable diagnostic; sells Pro. |
| `forecasting` | ○ | ○ | ● | ● | P3.5 | CPA/ROAS + budget-pacing run-rate with confidence band. |
| `rule_builder` | ○ | ○ | ● | ● | P5.2 | Visual if-this-then-**PROPOSE** automation (inert proposals only). Pairs with `ad_write` at Expert for *optional, still-gated* execute. |
| `data_export` | ○ | ● | ● | ● | P5.4 | Scheduled push to Sheets/Looker/BigQuery. Cheap, low-risk Starter sweetener + Pro/Expert table-stakes. **Only new key that reaches Starter.** |
| `crm_attribution` | ○ | ○ | ● | ● | P3.4/P5.5 | Platform-vs-CRM gap >20% + true-CPA/ROAS. AU lead-gen trust wedge. Uses `lead_events`. |
| `vertical_benchmarks` | ○ | ○ | ● | ● | P6.5 | Percentile rank vs vertical/objective. |
| `portfolio_cockpit` | ○ | ○ | ● | ● | P7.3 (+ OPS-1) | Multi-client triage/rollup: rank clients by health, flag worst, bulk branded reports. **This is the OPS-1 "Agency Triage Queue" (council 03's headline) and the new Expert marketing headline.** Read-only rollup at Pro; branded/login/re-bill depth rides existing `white_label` (Expert). |
| `marketplace` | ○ | ○ | ○ | ● | P7.5 | Templates/layouts/rule-packs, rev-share. Expert/ecosystem. |
| `reseller_program` | ○ | ○ | ○ | ● | P7.5 | Sub-account re-billing, partner dashboard, referral attribution. Expert. |

**Deliberately NOT new keys** (panel agrees with council 01 §5): `confidence_engine` and `wasted_spend`
are **core engine/display behaviour, visible from Free** — adding gates would (a) over-key the surface
and (b) wrongly imply the moat is paywalled. Ship as default engine output; add no entitlement.
`offer_landing_review` (P6.1) is **folded into `creative_studio`/`ai_team` (Pro)** — no new key — unless
the owner specifically wants a DIY-Starter intake form (owner-gated, §5).

### 1.3 Exact `entitlements.ts` changes (safe-additive set only)

**Add 10 keys to the `Feature` union** (after `expert_plugins`), and the **same 10** to both
`FEATURE_MIN_PLAN` and `FEATURE_LABEL`. **No existing line in `FEATURE_MIN_PLAN` is changed** (the
api_connect / content_publish MOVEs are owner-gated and NOT in this set). `messenger_automation` stays
exactly as-is in `entitlements.ts`.

```ts
// Feature union — append:
  | "diagnostics_pro"
  | "creative_intel"
  | "forecasting"
  | "rule_builder"
  | "data_export"
  | "crm_attribution"
  | "vertical_benchmarks"
  | "portfolio_cockpit"
  | "marketplace"
  | "reseller_program";

// FEATURE_MIN_PLAN — append (existing rows UNCHANGED):
  diagnostics_pro: "pro",
  creative_intel: "pro",
  forecasting: "pro",
  rule_builder: "pro",
  data_export: "starter",      // the only new key that reaches Starter
  crm_attribution: "pro",
  vertical_benchmarks: "pro",
  portfolio_cockpit: "pro",
  marketplace: "expert",
  reseller_program: "expert",

// FEATURE_LABEL — append:
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

**Safe-additive proof:** `can()` is monotone in `PLAN_RANK`; adding keys gated at `pro`/`expert`/`starter`
never reduces any existing plan's `featuresFor()` for the *current* keys. No current customer's access
changes. `tsc` stays clean because all three `Record<Feature,…>` maps remain exhaustive.

### 1.4 `plans.ts` `headlineFeatures` changes (drift-alarm-safe)

Only the additions whose gate is at-or-below the tier (verified against `FEATURE_MIN_PLAN` above):

- **Free:** `["csv_import", "health_score"]` — *unchanged.*
- **Starter:** `["reports", "threshold_alerts", "data_export"]` — adds `data_export` (gate `starter` ✅)
  and surfaces `threshold_alerts` (gate `starter` ✅). **`content_publish` is retained in the gate and
  may stay in the blurb until the owner decides §5-B**; the panel's recommended headline set drops it
  for clarity but this is a display choice, not an entitlement change. *(If `content_publish` is kept
  as a headline, it still passes the drift alarm — gate is `starter`.)*
- **Pro:** `["api_connect", "auto_sync", "ai_team", "creative_intel", "crm_attribution", "multi_client"]`
  — swaps the generic `creative_studio` headline for the demoable `creative_intel` (gate `pro` ✅), adds
  `crm_attribution` (gate `pro` ✅). All ≤ pro.
- **Expert:** `["white_label", "portfolio_cockpit", "ad_write", "expert_plugins"]` — **replaces
  `messenger_automation` with `portfolio_cockpit`** (gate `pro` ≤ expert ✅). `white_label` retained
  (drift test asserts it is Expert-only). All ≤ expert.

> **Drift-alarm contract re-checked against `plans.test.ts`:** 4 tiers in `["free","starter","pro",
> "expert"]` order ✅; every headline `can()` at its tier ✅; `pro` price still `null`→"See pricing" ✅;
> `white_label` present in Expert headlines and absent elsewhere ✅. Run `vitest plans.test.ts` after
> the edit. Update Expert's `blurb` (remove "Messenger automation", add "agency portfolio") and Pro's
> blurb (mention creative intelligence) — copy only, no number.

---

## 2. AGREED GUI build order (the "nail the GUI" bar)

The panel adopts council 02's discipline verbatim: **mode controls visibility/density; plan controls
capability** — orthogonal, both must pass. Reuse the shipped primitives (`mode.tsx`, `ModeAware`,
`Sidebar` lock row, `PlanMatrix`, `PageHeader`, the portfolio upgrade card). **Only three upsell
surfaces** allowed: nav lock pill, `PlanMatrix`, gradient upgrade card. Never a dead button.

**Prioritised build order (all presentation-layer, low-risk):**

1. **Simple-mode Command Center = the 10-second answer** (P2.2). Money-impact strip + top-3 fixes +
   single CTA in the Simple branch of `command/page.tsx` (right rail already `<ModeAware advanced>`).
   *Highest leverage: turns the toggle into the product spine.*
2. **Simple 5-item nav + relabel + drop sub-lines** (P2.1). Tighten Simple to Home/Fixes/Reports/
   Settings/Help; single-line labels; nav already filters by mode/plan. *Removes ~80% of felt clutter.*
3. **Extract `<UpgradeCard feature=…>` + `<FeatureGate feature=…>`** (P2.3). One full-page gradient
   card (from `portfolio/page.tsx`) + one render-or-soft-nudge gate, reading `requiredPlan` +
   `PLAN_LABEL` + `planPriceLabel` so copy/price never drift. Apply across all gated pages.
4. **Universal Export via `PageHeader.action` (Advanced)** (P2/P5.3 config). Consistent top-right
   Export on Reports/Proposals/Portfolio/factor-breakdown, wrapped in `<ModeAware advanced>`.
5. **Settings split (Simple 3-field / Advanced + Automation)** (P2.4). Fold threshold rules, lead
   webhook, Claude API key into one Advanced "Automation" section; Simple = avg sale / margin / budget.
   *Gives every new tier feature a clean home; removes two noisy nav rows.*
6. **Agency Triage Queue UI = `portfolio_cockpit` at Pro** (OPS-1 / P7.3). Upgrade `portfolio/page.tsx`
   from flat rollup to a ranked triage list (urgency = band + open criticals + WoW delta + staleness),
   reusing `health_scores` / `account_daily_metrics` / `alert_events` / `recommendations`. Read-only.
7. *(Phase 2 GUI)* Cmd-K palette + saved views + checkpoints — depend on the nav/density foundation
   above; build after 1–6.

---

## 3. AGREED data-consent implementation

The panel adopts council 04's **two-tier consent** in full (it is the lowest-risk, APP-defensible
posture) and confirms a **migration IS needed** for a discrete, auditable opt-in record.

**The split:**
- **De-identified / aggregated training → bundled disclosure** (the existing Terms + Privacy
  acceptance). Default and primary basis. A reasonable expectation; no separate consent.
- **Identifiable client data for training → separate, express, UNBUNDLED, unticked opt-in** (signup
  toggle + settings toggle), withdrawable any time. Never pre-checked, never blocks account creation.

**Exact files to touch (relative to `adpilot-v2/`):**

| Where | File | Action | Migration? |
|---|---|---|---|
| Terms — new section | `app/(marketing)/terms/page.tsx` | Insert §1 clause as a new numbered section before "Liability & governing law"; keep DRAFT banner; **placeholder prose only** (solicitor finalises). | No |
| Privacy — §1 + new sub-section | `app/(marketing)/privacy/page.tsx` | Expand §1 collection notice + add "How we use your information — model improvement"; reinforce Anthropic sub-processor + overseas (APP 8); keep banner. | No |
| Privacy — §5 deletion | `app/(marketing)/privacy/page.tsx` | One line: deletion requests honoured in the training pipeline. | No |
| Signup consent | `app/login/page.tsx` | Add bundled-acknowledgement line under the existing checkbox; add a **separate unticked optional toggle** for identifiable-data training. Bump `LEGAL_VERSION` (`"v4-draft"`→`"v6-draft"`) + recompute `LEGAL_HASH`. | No (schema is version-agnostic) |
| Settings toggle | settings/automation surface | Opt-out / withdraw toggle to make the consent real and withdrawable. | No |
| **Discrete consent record** | **new** `supabase/migrations/00XX_data_training_consent.sql` | **YES — migration required.** The `legal_acceptances.document` CHECK currently allows only `('terms','privacy')`. Add `'data_training'` to the CHECK (or a dedicated `consents` table) and POST a third acceptance row on opt-in so consent **and** withdrawal are auditable. RLS-scoped (`is_org_member`), additive only. | **YES** |

**Engineering guardrails the build must honour (binding):** train/eval on de-identified or aggregated
data by default (eval fixtures stay synthetic — existing rule); never use plaintext lead PII (already
hashed in `lib/pii.ts`) for general training; tenant isolation via RLS in every training/inference
path; propagate deletion into future training sets; honour opt-out via a per-org flag checked by the
data-builder; verify the Anthropic API tier does not train on our data; resale-clean grep guard stays.
**All §1–§3 prose is PLACEHOLDER — a qualified AU solicitor must finalise the consent mechanism,
secondary-use basis, and sub-processor/overseas disclosure before launch.**

**Migration numbering note:** the roadmap reserves `0021`–`0029` for V6 phases (X1: gap 0012–0015 is
intentional; number contiguously from 0021). The consent migration should take the **next free contiguous
number** after the P1–P7 migrations it ships alongside (it pairs naturally with P7 monetisation/legal or
ships standalone) — pick the next unused `00XX`, do not collide with `0021_trend_tables`…`0029_marketplace`.

---

## 4. BUILD SEQUENCE (first → last)

| # | Item | Tier surface | Safe-additive vs owner-decision |
|---|---|---|---|
| 1 | **Add the 10 new `Feature` keys** (union + both maps) + update `plans.ts` headlines/blurbs; run drift alarm | all | **Safe-additive** (no existing gate moves; `tsc` + `plans.test` green) |
| 2 | **Unlist `messenger_automation`** from `plans.ts` headlines+blurb; swap in `portfolio_cockpit` | Expert marketing | **Safe-additive** (code+gate retained; marketing-only) |
| 3 | **GUI builds 1–5** (Simple Command Center, 5-item nav, `<UpgradeCard>`/`<FeatureGate>`, universal Export, Settings split) | all (UX) | **Safe-additive** (presentation-layer; reuses primitives) |
| 4 | **`portfolio_cockpit` UI = Agency Triage Queue** (OPS-1) over existing tables | Pro | **Safe-additive** (read-only aggregation, RLS-scoped) |
| 5 | **Data-consent: marketing pages + signup toggle + `LEGAL_VERSION` bump** (placeholder prose) | cross-cutting | **Safe-additive** (no migration yet); solicitor sign-off **needs-owner-decision** before launch |
| 6 | **`data_training` consent migration** + settings toggle + per-org training flag | cross-cutting | **Safe-additive** schema (additive, RLS) — but the *opt-in-vs-opt-out boundary* is **needs-owner-decision** (solicitor) |
| 7 | **Wire new keys to real value surfaces** as the roadmap phases land: `diagnostics_pro`/`creative_intel`/`crm_attribution`/`forecasting`/`vertical_benchmarks` (P3/P6), `rule_builder`/`data_export` (P5), `marketplace`/`reseller_program` (P7) | Pro/Expert | **Safe-additive** (gated additions; ship behind the gate as each phase delivers the engine) |
| 8 | **api_connect Starter-lite, content_publish cleanup, auto-execute** | gate moves | **Needs-owner-decision** (see §5) — NOT built without sign-off |

---

## 5. CONTESTED / OWNER-GATED list (panel recommendation each)

| # | Item | Touches existing customers? | Panel recommendation |
|---|---|---|---|
| A | **`api_connect` Pro→Starter** (council 01) | No (would *widen* Starter) but adds cost/abuse risk | **DO NOT loosen for v6 ship.** Keep gate at `pro`. If the owner wants the activation lever, ship a **new** `live_connect_lite` key at `starter` with a **hard 1 read-only account cap + NO `auto_sync`** — a discrete owner decision with rate-limit/cost review, not a silent gate move. Default = no change. |
| B | **`content_publish` Starter→Pro** (council 01) | **Yes — DOWNGRADE** (it's in Starter's live blurb) | **DO NOT auto-apply.** Removing capability from current Starter customers is a migration/comms event. Hold at `starter`. If the owner approves the "clean DIY story", grandfather existing Starter subs and apply only to new signups, with notice. |
| C | **`messenger_automation` removal** (council 01) | No (gate+code retained) | **UNLIST only** (panel's resolution). Keep code, keep `/messenger`, keep `expert` gate; drop from marketing headlines/blurb in favour of `portfolio_cockpit`. Optionally env-flag the page as legacy. **Recommend: approve unlisting; do not delete.** |
| D | **Auto-execute "controlled middle"** (council 03 OPS-2 executing variant; roadmap Owner-Q18) | No (Expert-only, off by default) | **Owner green-light only.** Keep "propose; human approves" as the product. If ever built, the only safe shape = auto-**queue** a fully-formed `ad_action` that **still requires typed-YES**, behind all four gates + validators (≤10–30% clamp, 24–72h cooldown, spend caps, do-not-touch allowlist, `ADS_WRITE_ENABLED` kill-switch). **No bulk auto-execute, ever.** |
| E | **All pricing numbers + metering allowances + reverse-trial length** (roadmap Owner Queue A) | Yes (billing) | **Stay `null`/"See pricing".** Owner confirms recurring AUD anchors ($49/$149/$399 placeholders), annual discount, allowances, trial length. A test asserts no hardcoded AUD number ships. |
| F | **Consent opt-in vs opt-out boundary + solicitor sign-off** (council 04) | Yes (re-acceptance) | **Owner + solicitor.** Recommend the two-tier split (bundled de-identified / express opt-in identifiable). Existing users re-prompted to accept the bumped `LEGAL_VERSION` on next login (audit-trail intent of `0016`). |
| G | **`offer_landing_review` as a Starter key** (council 01 note ⁷) | No | **Fold into `creative_studio`/`ai_team` (Pro)** — no new key — to keep the surface minimal. Add a `starter` key only if the owner wants DIY-Starter to improve its own score via an intake form. |

---

## 6. Verdict per PM + consensus

| PM | Verdict | Note |
|---|---|---|
| **(1) Engineering-Delivery** | **APPROVE** | The shippable set is purely additive: 10 new keys keep all three `Record<Feature,…>` maps exhaustive (`tsc` clean), the drift alarm stays green, and no migration is forced except the additive, RLS-scoped `data_training` consent table. File ownership matches the roadmap's conflict-free phase boundaries. |
| **(2) Product/Launch** | **APPROVE-WITH-CHANGES** | Approve the additive map, the GUI build order, and unlisting messenger. **Change:** the `content_publish` and `api_connect` MOVEs are pulled OUT of the ship set into Owner-Gated — launch cannot silently downgrade or loosen. The new Expert headline (`portfolio_cockpit`) is a stronger story than the bot. |
| **(3) Security/Compliance** | **APPROVE-WITH-CHANGES** | Approve only because `api_connect` is **kept at `pro`** (no loosening of the token/rate-limit/cron surface) and the consent split is express-opt-in for identifiable data with an auditable record. Auto-execute stays owner-gated and quadruple-gated. Resale-clean + RLS invariants preserved. |
| **(4) Commercial/Brand** | **APPROVE** | The ladder headlines are sharper (creative intelligence + CRM truth at Pro; portfolio + reversible actions at Expert), ARPU expansion comes from capability + metering (owner-gated numbers) not from hiding the dual-mode UX, and no built feature is thrown away. Prices stay honest (`null`/"See pricing"). |

**CONSENSUS STATEMENT.** The panel converges on a **safe-additive V6 tier expansion**: add 10 new
`Feature` keys (one at Starter — `data_export`; the rest at Pro/Expert), keep `confidence_engine` and
`wasted_spend` as ungated core, **unlist (not delete) `messenger_automation`** and promote
`portfolio_cockpit` as the Expert headline, ship the dual-mode GUI in the agreed order, and implement
the two-tier consent with an additive `data_training` migration. **The three bold proposals are not
rubber-stamped:** `api_connect` stays at Pro (no loosening), `content_publish` stays at Starter (no
downgrade), and messenger is unlisted, not removed — all three, plus pricing, auto-execute, and the
consent boundary, are routed to the Owner-Gated list with explicit recommendations. **No existing
customer's entitlements change in the shippable set.** Drift alarm, oracle parity, RLS, and resale-clean
guards all stay green.

---

### Verification before sign-off
`tsc --noEmit` clean · `vitest run` green (incl. `plans.test.ts` drift alarm) · `next build` succeeds ·
resale-clean grep guard (`snowflow|edagher`) passes · prices remain `null`/"See pricing".
