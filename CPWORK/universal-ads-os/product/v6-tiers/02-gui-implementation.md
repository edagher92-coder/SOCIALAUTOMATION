# V6 Tiers — GUI / UX Implementation Spec (per-feature, per-tier)

**Doc:** 02-gui-implementation
**Author:** GUI/UX implementation lead (V6), paired with senior SaaS UX
**Date:** 2026-06-16
**Status:** Spec only — read-only on code. Defines HOW each per-tier feature (new + existing) shows up in the GUI, building on what V6 already shipped.
**Scope:** `adpilot-v2`. Owner priority this round: "nail the GUI and user experience."

---

## 0. North-star (one sentence)

**Simple mode is the 10-second answer — score, money at stake, top 3 fixes, one button — and everything else (depth, controls, the locked tiers above you) reveals only in Advanced, where locks are an invitation, never a wall.**

The discipline: **mode controls visibility/density; plan controls capability.** They are orthogonal and both must pass (`(advanced || !item.advanced) && (advanced || !isLocked)` in `Sidebar`). Simple stays calm because every locked or power surface is hard-hidden; Advanced is allowed to be dense because that audience asked for it.

---

## 1. What V6 already shipped (the primitives we build on)

These exist and are the load-bearing GUI vocabulary. Every feature below reuses them — we add almost no new infrastructure.

| Primitive | File | What it does | How we reuse it |
|---|---|---|---|
| **Mode provider + toggle** | `components/mode.tsx`, `components/AppShell.tsx` | `beginner \| advanced`, localStorage, top-of-rail toggle relabelled "Simple / Advanced" | Drives nav composition + per-page density everywhere |
| **`<ModeAware only=…>`** | `components/ModeAware.tsx` | Render children only in `simple` or `advanced`; `fallback` prop | Wrap every Advanced-only panel / dense layer |
| **Mode+plan nav** | `components/AppShell.tsx` `Sidebar` | `NavItem` carries `advanced?` + `feature?`; `visible()` filters | Add new features as `NavItem`s with the right flags; nothing else to wire |
| **Visible-but-locked nav row** | `Sidebar` `isLocked()` branch | Locked item → routes to `/billing`, shows `🔒 {PLAN_LABEL[need]}` pill, `requiredPlan()` derived | The canonical lock treatment — copy it, never invent a second style |
| **`PlanMatrix`** | `components/PlanMatrix.tsx` | Feature × tier grid, `✓`/`—`, emphasises the unlock tier (`New in {tier}`) | The full differentiation surface on `/billing` + landing |
| **`PageHeader`** | `components/PageHeader.tsx` | `eyebrow + title + subtitle + action` | Top of every page; `action` slot holds Export / mode-specific CTAs |
| **Page upgrade card** | e.g. `app/(app)/portfolio/page.tsx` | `can(plan, feature)` false → `PageHeader` + gradient card + "Upgrade to enable" → `/billing` | The canonical full-page lock; extract to a shared component (see §6) |
| **Entitlement truth** | `lib/entitlements.ts` | `can`, `requiredPlan`, `FEATURE_LABEL`, `PLAN_LABEL`, `featuresFor` | Single gate source; UI reads it, never hardcodes tiers |
| **Pricing truth** | `lib/plans.ts` | `PLANS`, `planPriceLabel`, `headlineFeatures` | Drives matrix + upgrade-card price chips |
| **Simple/Advanced Command Center** | `app/(app)/command/page.tsx` | Hero score + verdict pills + attention queue; right rail wrapped in `<ModeAware only="advanced">` | Reference implementation of dual-density; extend per §3 |

**Three rules every feature below obeys:**
1. **One lock language.** The `🔒 {tier}` pill (nav), the matrix `✓`/unlock emphasis, and the gradient upgrade card are the *only three* upsell surfaces. No bespoke modals, no dead buttons, no greyed controls that do nothing.
2. **Never a dead button.** A locked action renders as either a hidden nav row (Simple) or a lock-pilled row / soft nudge line (Advanced) — it always *goes somewhere* (`/billing`).
3. **Plain English in Simple, jargon allowed in Advanced.** "Fixes" not "Proposals"; "how often we check" not "cadence"; "what's pulling your score down" not "factor weighting".

---

## 2. Feature × tier × GUI map (the deliverable)

Format per feature: **WHERE** (route/section) · **SIMPLE vs ADVANCED** · **UPSELL when locked** · **KEY INTERACTION** · **COMPONENT notes**.

Feature keys reference `lib/entitlements.ts`. `(NEW)` = surface not yet built; `(EXISTS)` = wire/refine an existing surface.

### 2.1 Free (everyone — the on-ramp)

**CSV import + Health Score** — `csv_import`, `health_score` (EXISTS)
- **WHERE:** `/dashboard` (Ads Health) + the Command Center empty/update state. In Simple these *merge* — the user sees "your score and your fixes," with CSV upload living inside Home's empty-state and a small "Update data" control (not a separate concept).
- **SIMPLE:** Empty-state Home = one card: *"Add your ads to get your first score"* → **Upload CSV** (primary) + **Connect Meta/TikTok** (gated; soft nudge if locked, never dead). After scoring → the 10-second hero (§3).
- **ADVANCED:** Full `/dashboard` paste/upload surface + the 13-factor "Why this score?" breakdown (already `mode === "advanced"`-gated in `AnalyzeClient`).
- **UPSELL:** none — this is the free hook. The *Connect* button inside the empty-state is the first upsell touch (soft line → `/billing`).
- **INTERACTION:** paste/upload CSV; column-mapping helper flags missing headers in-app (the demo's "yellow headers" idea). Re-score on update.
- **COMPONENT:** keep `AnalyzeClient` density split; add the empty-state card to `command/page.tsx` Simple branch.

### 2.2 Starter (the DIY operator)

**Saved reports** — `reports` (EXISTS; nav `feature:"reports"`)
- **WHERE:** `/reports` (history) + `/reports/[id]`. Nav item in both modes (it's spine).
- **SIMPLE:** flat reverse-chron list, title + date + open. No bulk, no export controls.
- **ADVANCED:** adds **Export** (`PageHeader` action: CSV / PDF), checkpoint tagging (see §3.4), density toggle.
- **UPSELL (Free user):** nav row shows `🔒 Starter` → `/billing` in Advanced; hidden in Simple. Page itself, if reached, renders the gradient upgrade card.
- **INTERACTION:** open report; (Advanced) export download; (Pro+) brand via white-label.
- **COMPONENT:** wrap export + tag controls in `<ModeAware only="advanced">`.

**Content upload & publishing** — `content_publish` (EXISTS; `/content`, currently `advanced:true`)
- **WHERE:** `/content` Content Studio, under the **Create** group (Advanced, collapsed by default per dual-mode §5.2).
- **SIMPLE:** not shown (off the core audit loop).
- **ADVANCED:** full studio — compose, schedule, publish; upload media.
- **UPSELL (Free):** `🔒 Starter` nav pill → `/billing`; page gradient card.
- **INTERACTION:** upload/download media, schedule calendar.
- **COMPONENT:** stays `advanced:true` + `feature:"content_publish"` — already correct.

**Threshold alerts** — `threshold_alerts` (NEW surface; gate exists)
- **WHERE:** `/settings` → **Automation** section (Advanced), and rule chips surfaced on `/notifications`.
- **SIMPLE:** invisible — basic CRITICAL email stays on for free; no rule UI. (Simple users get protection without configuration.)
- **ADVANCED:** a rule library — add/edit rules (frequency cap, zero-conv, CTR floor), each a card with a plain trigger sentence + threshold input + on/off.
- **UPSELL (Free):** the Automation section renders a single inline soft nudge row (`🔒 Threshold alerts — Starter` → `/billing`) in place of the rule list — *not* a full-page block, since Settings is shared.
- **INTERACTION:** create rule → pick metric → set threshold → save (saved-view-like).
- **COMPONENT:** new `RuleCard`; section gated by `<ModeAware only="advanced">` + per-section `<FeatureGate feature="threshold_alerts">` (see §6).

### 2.3 Pro (the live, AI, multi-client tier — "Most popular")

**Live connect + auto-sync** — `api_connect`, `auto_sync` (EXISTS; `/connect`, `/settings`)
- **WHERE:** `/connect` (Connect & Sync) spine item; cadence control in `/settings` → Automation.
- **SIMPLE:** Connect appears only as a button inside Home's empty-state; cadence hidden.
- **ADVANCED:** full connect cards (Meta/TikTok status, last pull, reconnect) + cadence selector incl. custom hours.
- **UPSELL (Free/Starter):** Command Center hero already does this well — `apiEnabled` false shows *"CSV mode on {plan}. Upgrade to auto-sync Meta & TikTok live."* Keep that exact pattern; `/connect` page shows the gradient upgrade card.
- **INTERACTION:** OAuth/dev-token connect; sync now; set cadence.
- **COMPONENT:** reuse the Command Center `apiEnabled` conditional copy.

**AI specialist team** — `ai_team` (EXISTS; `/ai-specialists`, `/policy-check`, Bobby/Aria)
- **WHERE:** `/ai-specialists` (Advanced, AI Team group). Other specialists reachable *inside* AI Specialists, not as separate rows (dual-mode §5.2). Bobby/Aria/CRM → palette/"More".
- **SIMPLE:** AI is **invisible-but-working** — represented by outcomes (the fixes on Home), never a roster to pick from. This is the key UX move: beginners get AI value without a 12-agent decision.
- **ADVANCED:** full roster (Mira, Travis, Dana, Atlas, Paige, Riley…), each grounded, gated.
- **UPSELL (Free/Starter):** Command Center right-rail "AI team" card already shows the canonical soft nudge: *"🔒 The AI specialist team is a Pro & Expert feature. Upgrade."* Nav shows `🔒 Pro`. Reuse verbatim.
- **INTERACTION:** open specialist → chat grounded in live numbers (proposals only).
- **COMPONENT:** reuse the existing rail card; ensure the locked-line copy reads from `requiredPlan("ai_team")` so it never drifts.

**AI Creative Studio** — `creative_studio` (EXISTS; `/canva-creator`, `/creative`)
- **WHERE:** **Create** group (Advanced, collapsed). `canva-creator` already hides one card unless advanced — keep.
- **SIMPLE:** not shown.
- **ADVANCED:** creative briefs/prompts, Canva/Adobe, link/upload library.
- **UPSELL (Starter):** `🔒 Pro` nav pill; page gradient card.
- **INTERACTION:** generate brief; upload/link assets.

**Multi-client portfolio** — `multi_client` (EXISTS; `/portfolio`)
- **WHERE:** `/portfolio`, Account group (Advanced, Pro+).
- **SIMPLE:** not shown.
- **ADVANCED:** cross-client roll-up table (health, MTD spend, ROAS, needs-attention).
- **UPSELL (Free/Starter):** the **canonical full-page upgrade card already lives here** (`portfolio/page.tsx`) — this is the reference to extract (§6).
- **INTERACTION:** sort by health; drill into a client → `/command` in that org context (pairs with `OrgSwitcher`).
- **COMPONENT:** keep; refactor its lock card into the shared `<UpgradeCard>`.

**Lead-quality / CRM loop** — `lead_quality_loop` (NEW surface; gate exists)
- **WHERE:** `/settings` → Automation (webhook config) + a "Lead quality" signal on the Health hero / factor breakdown.
- **SIMPLE:** invisible config; if a score is affected, the Home sentence just reflects it in plain English.
- **ADVANCED:** webhook setup card (copy URL, secret, test ping, last-event timestamp) + lead-quality factor drill-down.
- **UPSELL (Starter):** soft nudge row in Automation (`🔒 Pro`).
- **INTERACTION:** copy webhook URL (one-click), test event, view ingestion log.
- **COMPONENT:** new `WebhookCard`; reuse the copy-to-clipboard + status-dot idiom from the Connect rail.

### 2.4 Expert (white-label, automation, guarded writes)

**White-label reports** — `white_label` (EXISTS; `/agency`)
- **WHERE:** `/agency`, Account group (Advanced, Expert).
- **SIMPLE:** not shown.
- **ADVANCED:** brand setup (logo, colours, agency name) applied to report exports.
- **UPSELL (Pro):** `🔒 Expert` nav pill; page gradient card.
- **INTERACTION:** upload logo, set palette, preview branded PDF.

**Messenger automation** — `messenger_automation` (EXISTS; `/messenger`, `advanced:true`)
- **WHERE:** `/messenger`, hidden behind Advanced + Expert (niche).
- **SIMPLE:** never.
- **ADVANCED (Expert):** greeting, ice breakers, menu setup.
- **UPSELL:** `🔒 Expert` nav pill; page gradient card.

**Guarded ad actions** — `ad_write` (EXISTS; `/actions`, double-gated)
- **WHERE:** `/actions`, Advanced + Expert + `ADS_WRITE_ENABLED` env gate.
- **SIMPLE:** never — the read-only promise is sacred; the amber "Read-only" notice stays in both modes.
- **ADVANCED (Expert + env):** guarded panel with **typed-YES** confirm flow.
- **UPSELL (≤Pro):** `🔒 Expert` nav pill. Critically: **Advanced mode never relaxes a gate.** Mode reveals the row; plan + env + typed-YES still all required.
- **INTERACTION:** select proposed change → typed-YES → execute (only when env-enabled).
- **COMPONENT:** preserve all three gates; mode is purely visibility.

**Expert plugins** — `expert_plugins` (NEW/placeholder; gate exists)
- **WHERE:** palette/"More" + Account; Expert only.
- **SIMPLE:** never.
- **ADVANCED (Expert):** team-built extras list.
- **UPSELL:** matrix row + `🔒 Expert`.

### 2.5 Cross-cutting Advanced surfaces (dual-mode §4)

| Surface | WHERE | Simple | Advanced | Notes |
|---|---|---|---|---|
| **Customisable Command Center widgets** | `/command` | single-column hero (10-sec) | show/hide/reorder widget grid | persist via same localStorage idiom as `mode`; new `useDashboardLayout()` |
| **Saved views & checkpoints** | `/command` + `/proposals` + `/reports` | hidden | named filter chips; checkpoint = tagged `reports` row, compare now-vs-snapshot | new `useSavedViews()`; checkpoint = `label`/`is_checkpoint` flag |
| **Bulk upload + universal export** | every data surface | hidden | `PageHeader` `action` = Export; multi-file import on `/dashboard` | one mental model: "Advanced = move data in/out" |
| **Cmd-K command palette** | global | hidden | jump-to-page, run-action, switch-org/view; absorbs demoted long-tail (Bobby/Aria/CRM/Build-a-Dashboard) | lets visible nav stay short as capability grows |

---

## 3. Page-density playbook (how Simple vs Advanced render the same route)

The pattern is proven (`AnalyzeClient`, `canva-creator`, `command`). Apply consistently:

1. **Command Center (`/command`)** — Simple: hero score + money strip + top-3 fixes + one CTA, single column (right rail already `<ModeAware only="advanced">`). Add the **money-impact strip** (sum of wasted spend on kill/reduce/refresh, break-even gap) — reuses settings economics + engine decisions, no new data. Advanced: full widget grid.
2. **Settings (`/settings`)** — Simple: 3 fields (avg sale, gross margin, monthly budget). Advanced: + Automation (cadence/custom hours, threshold rules, lead webhook, Claude API key moved here from its own nav row).
3. **Health/Import (`/dashboard`)** — Simple: merged into Home empty/update state. Advanced: full paste/upload + 13-factor "Why this score?".
4. **Reports (`/reports`)** — Simple: list. Advanced: + Export + Checkpoints + compare.

---

## 4. Upsell consistency contract (the only three surfaces)

1. **Nav lock row** (Advanced only) — `🔒 {PLAN_LABEL[requiredPlan(feature)]}` pill, routes to `/billing`, `aria-label` "…locked — upgrade to {tier}". Source: `Sidebar.isLocked`.
2. **PlanMatrix** (`/billing`, landing) — `✓`/`—`, unlock tier emphasised (`New in {tier}`), prices via `planPriceLabel`.
3. **Full-page / section upgrade card** — gradient panel, feature label, "Your plan ({plan}) … Upgrade to enable" → `/billing`. Section variant = a single soft nudge row inside a shared page (Settings Automation). Source: `portfolio/page.tsx` → extract `<UpgradeCard>`.

**Banned:** dead/greyed controls, bespoke upsell modals, hardcoded tier names (always derive via `requiredPlan` + `PLAN_LABEL`), any upsell that doesn't link to `/billing`.

---

## 5. Priority — the 3–5 GUI builds to do FIRST (max UX impact)

Ranked for the "clean, uncluttered, best-in-field" bar. Each is low-risk (presentation-layer, reuses primitives).

1. **Make Simple mode real on Command Center — the 10-second answer.** Add the **money-impact strip** + **top-3 fixes** cards + single primary CTA to the Simple branch of `command/page.tsx` (right rail already gated). This is the single highest-leverage build: it turns the mode toggle from a label into the product's spine and is what an SMB owner sees first. *Impact: defines the whole "calm" promise.*
2. **Ship the Simple-mode 5-item nav + relabel + drop description sub-lines.** The nav already filters by mode/plan; tighten Simple to the spine (Home/Fixes/Reports/Settings/Help), keep single-line labels in Simple (descriptions already Advanced-only via the `advanced &&` block). *Impact: removes ~80% of perceived clutter — the owner's #1 complaint.*
3. **Extract `<UpgradeCard>` + `<FeatureGate>` and standardise every lock.** One component for the full-page gradient card (from portfolio) and one render-or-nudge gate. Apply across all gated pages so the lock language is identical everywhere. *Impact: makes upsell feel intentional and trustworthy, not patchwork.*
4. **Universal Export affordance via `PageHeader` `action` slot (Advanced).** A consistent top-right Export on Reports, Proposals, Portfolio, factor breakdown — wrapped in `<ModeAware only="advanced">`. *Impact: the owner's "download flows" ask, delivered uniformly; signals depth to power users.*
5. **Settings split (Simple 3-field / Advanced full + Automation).** Fold threshold rules, lead webhook, and the Claude API key into one Advanced "Automation" section; Simple shows only the three economics fields. *Impact: removes three nav rows (Notifications/Claude API config noise) and gives new tier features a clean home.*

*(Cmd-K palette and checkpoints are high-value but Phase 2 — they depend on the nav/density foundation above.)*

---

## 6. Reusable primitives worth extracting

| Primitive | Source today | Why extract |
|---|---|---|
| **`<UpgradeCard feature=…>`** | inline in `portfolio/page.tsx` | Repeated gradient lock card on ~10 pages; one component reads `requiredPlan`+`PLAN_LABEL`+`planPriceLabel` so copy/price never drift. Props: `feature`, optional `compact` (section-row variant). |
| **`<FeatureGate feature=… mode?=…>`** | implicit `can()` checks + `ModeAware` | Render children if entitled, else a soft nudge (never a dead control). Composes `ModeAware` + `can`. Formalises the "never a dead button" rule. |
| **`<MoneyImpactStrip>`** | new (Command Center) | Wasted-spend + break-even-gap line; reused on Home and report headers. |
| **`useDashboardLayout()` / `useSavedViews()`** | new | localStorage-then-settings, same idiom as `mode.tsx`; back checkpoints with a `reports.is_checkpoint` flag (Phase 2/3). |
| **`<ExportAction kind=…>`** | scattered export buttons | Slots into `PageHeader.action`; one CSV/PDF affordance, white-label-aware. |
| **`<NavLockPill feature=…>`** | inline in `Sidebar` | Already the canonical lock badge; extract so the page-card and matrix can share the exact tier-pill render. |

**Guardrails preserved throughout:** read-only safety notice in both modes; `ad_write` stays Expert + `ADS_WRITE_ENABLED` + typed-YES (mode never relaxes a gate); resale-clean (presentation-layer only, no private data); Australian English, AUD, numbers-first, anti-hype copy.
