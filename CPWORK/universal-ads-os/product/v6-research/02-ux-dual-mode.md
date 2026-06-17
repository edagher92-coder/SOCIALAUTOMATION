# V6 UX Research — Dual-Mode (Simple vs Advanced) & Navigation De-Clutter

**Doc:** 02-ux-dual-mode
**Author:** Product Design lead (V6), with senior SaaS UX pairing
**Date:** 2026-06-16
**Scope:** Read-only IA/UX study of `adpilot-v2`. No code edited. Recommends a Simple view, an Advanced view, a navigation redesign, and an implementation approach that reuses the existing `mode` provider + entitlements.
**Web research:** Available (egress worked). Grounded against published progressive-disclosure / dashboard-layering guidance (sources at end). One source (pixxen) returned 403; substituted with UXPin/IxDF/Lollypop and first-principles expertise.

---

## 0. TL;DR for the owner

- The clutter is real and measurable: **24 nav items in 4 groups**, every item carrying an emoji + a one-line description, all shown to everyone at all times regardless of plan or experience. That is the single biggest source of "very cluttered."
- There is **already a Simple/Advanced toggle** (`mode.tsx` → `beginner | advanced`), but it is **almost entirely inert** — today it only hides one card on Canva Creator and one factor-table on Ads Health. It is a label, not a mode.
- **Simple view** should be the *10-second answer*: one screen — Health Score, money impact (wasted spend / break-even gap), top 3 fixes, one primary CTA ("Review & approve"). Nav collapses to ~5 items. Nothing else visible.
- **Advanced view** should *turn progressive disclosure off*: per-factor drill-down, saved views/checkpoints, customisable dashboard layout, bulk CSV upload + export, the full 12-specialist team, automation controls, and a Cmd-K command palette.
- The mode is the right primitive; it just needs to actually drive (a) which nav items render and (b) the density of each page. Combine `mode` (experience) with `plan` (entitlement) — they are orthogonal and must both be respected.

---

## 1. Clutter diagnosis — the current IA

### 1.1 The raw inventory (from `components/AppShell.tsx`)

24 destinations across 4 groups, each with icon + label + description:

| Group | Items | Count |
|---|---|---|
| (ungrouped) | Command Center | 1 |
| **Workspace** | Proposals, Ads Health, Connect & Sync, UTM Builder, Content Studio, Messenger Setup, Ad Actions, Reports | 8 |
| **AI Team** | AI Specialists, Policy Check, Canva Creator, Creative Library, Bobby — Business, Aria — Courses, CRM Maintenance, Build a Dashboard | 8 |
| **Account** | Billing, Notifications, Portfolio, White-label, Settings, Claude API, User Manual | 7 |

### 1.2 Why it reads as cluttered (root causes, in priority order)

1. **No demand-based filtering.** Every item renders for every user. A Free/CSV user with no AI team and no API still sees AI Specialists, Messenger Setup (Expert-only), Ad Actions (Expert-only), Portfolio (Pro+), White-label (Expert-only), Claude API, Build a Dashboard. ~9 of 24 items are inert or locked for a typical SMB on a lower tier — pure noise.
2. **Every row is double-height.** Icon + bold label + a full descriptive sub-line on *all 24 rows*. That is 24 paragraphs of marketing copy permanently in the peripheral vision. Best-in-class nav (Linear, Vercel, Stripe) uses single-line labels and reserves descriptions for hover/empty-states/onboarding.
3. **The "AI Team" group is a grab-bag.** It mixes a genuinely core feature (AI Specialists, Policy Check) with adjacent-product tools that are arguably separate jobs-to-be-done: Aria (course creation), Bobby (general business help), CRM Maintenance, Build a Dashboard, Canva Creator. These dilute the core "audit my ads" loop and inflate the count.
4. **Verb/noun inconsistency & overlap.** "Ads Health" (a CSV scoring tool) vs "Command Center" (the dashboard) vs "Reports" (history) vs "Proposals" (the action list) are four different surfaces for what the user thinks of as one thing: *"how are my ads and what do I do."* The user has to learn the product's internal model instead of their own.
5. **Account group carries operator/dev concerns.** Claude API (paste a key), Build a Dashboard (spec docs), User Manual, White-label — these are setup/power/operator tasks sitting at the same visual weight as Billing.
6. **The mode toggle promises a simplification it does not deliver.** It says "Simple view — guided, plain English" but the nav and 22 of 24 pages are identical in both modes. This trains users to ignore the toggle.

### 1.3 What is genuinely core (the 80% loop)

From the demo script and command page, the product's spine is a tight loop:
**Connect/import → score (Health) → see what's wrong (Proposals) → act (approve / report).**
Everything else is supporting cast. The Simple view should *be* this loop and nothing else.

---

## 2. The existing `mode` provider — assessment

`components/mode.tsx`:
- `Mode = "beginner" | "advanced"`, persisted to `localStorage` under `adpilot_mode`, defaulting to `beginner`.
- Clean, dependency-free, already wraps the whole app (`<ModeProvider>` in `AppShell`).

**Verdict: keep it, it's the right primitive — but it currently does almost nothing.** A repo-wide audit found `useMode()` consumed in only:
- `components/AppShell.tsx` — renders the toggle.
- `app/(app)/canva-creator/page.tsx` — hides one "Canva search terms" card unless advanced.
- `components/AnalyzeClient.tsx` — hides the 13-factor "Why this score?" breakdown table unless advanced.

So the toggle does not touch navigation, layout, copy, density, or which features appear. It is a read-only preference. **The V6 work is to make `mode` actually govern (a) nav composition and (b) per-page density**, while leaving `plan` to govern entitlement. Two recommended refinements:
- Rename the UI labels to **"Simple"** and **"Advanced"** (the values can stay `beginner`/`advanced` internally to avoid a migration; map at the edge). The owner uses the words "Simple" and "Advanced" — match them.
- Persist mode per-user server-side eventually (so it follows them across devices and so the server can render the right nav without a flash). Short term, localStorage is fine; add an SSR-safe default to avoid hydration flicker.

---

## 3. Simple-view spec — the 10-second answer

**Design principle:** an SMB owner who opens AdPilot should, within ~10 seconds and without scrolling, know (1) how healthy their ads are, (2) how much money is at stake, (3) the top 3 things to do, and (4) have exactly one button to press. Anything that doesn't serve that is hidden.

This is the *glance layer* of the three-layer dashboard model (glance → detail → configure). Simple mode shows only the glance layer.

### 3.1 The single Simple screen (replaces Command Center in Simple mode)

A one-column, calm layout. Top to bottom:

1. **Health hero** — the 0–100 score, the band word (Green/Yellow/Orange/Red), and one plain-English sentence: *"Your ads are in the Orange band — there's money being wasted, and it's fixable this week."* (No verdict pill row, no sync-cadence jargon.)
2. **Money impact strip** — the number that makes them care. One or two figures only:
   - *"~$980/mo going to ads that aren't working"* (sum of estimated wasted spend on kill/reduce/refresh verdicts), and/or
   - *"You're $19 over your break-even cost per lead."*
   This reuses the economics already in `settings` (avg sale, margin → break-even CPA/ROAS) and the per-ad decisions in the engine. No new data needed.
3. **Top 3 fixes** — exactly three cards, the highest-rank proposals (the engine already ranks verdicts: fix-tracking → kill → reduce → refresh → scale). Each card: a plain-English title, the entity name, and the *expected impact* ("could recover ~$340/mo"). No reason/technical detail inline — that's the detail layer.
4. **One CTA** — a single primary button: **"Review & approve fixes →"** (goes to Proposals). Secondary, quiet text-link: "See full breakdown" (switches to Advanced, or opens the detail layer in place).
5. **Get-started state** (no data yet) — instead of the above, one card: *"Add your ads to get your first score"* with two buttons: **Upload CSV** (free path) and **Connect Meta/TikTok** (gated; if locked, show a soft "Upgrade to auto-connect" line, never a dead button).

### 3.2 What Simple mode hides / simplifies

- Hides: verdict-count pill row, connection cadence details, the AI-team rail, recent-reports rail, and the right-hand sidebar entirely (single column).
- The 13-factor breakdown stays collapsed/absent (it already gates on `mode === "advanced"` in `AnalyzeClient` — keep that).
- Ads Health (CSV) and Command Center **merge into one concept** in Simple mode: the user sees "your score and your fixes," and the CSV upload lives inside the empty-state and behind a small "Update data" control — not as a separate nav item.
- Settings is reduced to the three numbers that change the answer (avg sale value, gross margin, monthly budget) with the cadence/custom-hours control hidden until Advanced.
- Copy is plain English throughout — no "verdict", "cadence", "entity", "factor weighting". Use "fix", "how often we check", "ad/campaign", "what's pulling your score down".

### 3.3 Simple-mode navigation (≤5 items — see §5)

Home (the screen above) · Fixes (Proposals) · Reports · Help · Settings (lightweight). That's it.

---

## 4. Advanced-view spec — power users who've learned the tool

**Design principle:** Advanced *turns progressive disclosure off* (the documented power-user pattern). Density, control, and customisation are features, not clutter, for this audience. Advanced is the union of detail + configure layers.

### 4.1 Customisable dashboard / layouts
- **Configurable Command Center** built from widgets the user can show/hide/reorder: Health gauge, Verdict breakdown, Needs-attention queue, Connections, AI team, Recent reports, Budget pacing, Spend trend, Factor radar. Layout persisted per-user (extend the same `localStorage`/settings mechanism the mode uses).
- **Density toggle** within Advanced (comfortable / compact tables) for portfolio and proposal lists.

### 4.2 Saved views & checkpoints (the owner's "multiple checkpoints")
- **Saved views**: a named filter+layout combination — e.g. "Tracking issues only", "This week's kills", "Client A — last 30d". Surfaced as quick chips at the top of Command Center / Proposals.
- **Checkpoints**: a *named snapshot of the account at a moment* — score + findings + proposals frozen with a label and date ("Pre-refresh baseline", "After Q2 cleanup"). Lets power users compare *now vs a checkpoint* to prove movement. Maps naturally onto the existing `reports` + `health_scores` tables (a checkpoint = a tagged report row); no schema upheaval, just a `label`/`is_checkpoint` flag and a compare view.

### 4.3 Per-factor drill-down
- The full **13-factor breakdown** (score · weight · weighted contribution), already built in `AnalyzeClient` behind `mode === "advanced"` — promote it to a first-class **"Why this score?"** surface with per-factor expanders that show the underlying ads/findings driving each factor, and the band thresholds. This is the detail layer for the Health hero.

### 4.4 Bulk upload / export (the owner's "upload/download flows")
- **Bulk CSV upload**: multi-file / multi-account import in one pass (today Ads Health is single-paste). Column-mapping helper that flags missing headers (the demo's "headers in yellow" idea, in-app).
- **Export everywhere**: proposals → CSV, reports → PDF/branded PDF (ties to white-label), portfolio → CSV roll-up, factor breakdown → CSV. A consistent "Export" affordance in the top-right of every data surface in Advanced mode.
- This also rationalises today's scattered upload/download surfaces (Creative Library uploads, Content Studio media, manual PDF, build-dashboard specs) under one mental model: *Advanced = you can move data in and out.*

### 4.5 Full specialist team + automation controls
- The **12 AI specialists** surface fully in Advanced (Mira, Travis, Dana, Atlas, Paige, Riley, etc.), each grounded and gated by `ai_team` entitlement. In Simple mode the AI team is represented by *outcomes* (the fixes), not by a roster of agents to pick from.
- **Automation controls**: auto-sync cadence (incl. custom hours), threshold-alert rules, weekly-digest scheduling, lead/CRM webhook config, and — for Expert + `ADS_WRITE_ENABLED` — the guarded Ad Actions panel with its typed-YES flow. All of these live under Advanced and remain plan-gated.

### 4.6 Command palette (Cmd-K)
- Advanced adds a **command palette** (the Linear/Superhuman/Vercel pattern) for jump-to-page, run-action, switch-org, switch-view. This is *the* power-user accelerator and lets the visible nav stay short even as capability grows — the palette absorbs the long tail so the sidebar doesn't have to.

---

## 5. Navigation redesign — collapsing the 24

**Strategy:** Filter by **plan** first (never show a fully-locked-and-irrelevant destination as a peer; show locked-but-relevant ones with a lock affordance), then by **mode** (Simple shows the spine; Advanced reveals the rest), then **group by job-to-be-done**, then **demote the long tail to a command palette / "More" menu**. Drop per-item descriptions from the rail (move to hover/empty-state).

### 5.1 Simple mode — 5 items

| Item | Maps to | Notes |
|---|---|---|
| **Home** | `/command` (Simple layout) | The 10-second answer screen (§3) |
| **Fixes** | `/proposals` | Renamed from "Proposals" — plainer |
| **Reports** | `/reports` | History; export lives here |
| **Settings** | `/settings` (3-field lite) | Economics only |
| **Help** | `/manual` | Renamed "User Manual" |

CSV upload + Connect live inside Home's empty/update states, not as nav items. AI is invisible-but-working (it produces the fixes).

### 5.2 Advanced mode — grouped, ~12 visible + palette for the rest

Reorganised around jobs, not internal modules:

- **(no header)** — Command Center *(customisable)*
- **Analyse** — Health & Import (merges Ads Health + bulk upload), Proposals, Reports & Checkpoints
- **Connect** — Connect & Sync, Settings & Automation (cadence, alerts, pacing)
- **AI Team** — AI Specialists, Policy Check *(other specialists reachable from inside AI Specialists, not as separate rows)*
- **Create** *(collapsible, collapsed by default)* — Content Studio, Creative Library, Canva Creator, UTM Builder
- **Account** — Billing, Notifications, Portfolio *(Pro+)*, White-label *(Expert)*

### 5.3 Promote / demote / hide-behind-advanced / demote-to-palette

| Item | Decision | Rationale |
|---|---|---|
| Command Center | **Promote** (Home) | The spine; customisable in Advanced |
| Proposals → "Fixes" | **Promote** | The money action; rename for clarity |
| Ads Health → "Health & Import" | **Merge** into Home/Analyse | One concept, not two surfaces |
| Reports | **Keep**, add Checkpoints | Core history + power-user compare |
| Connect & Sync | **Keep**, Advanced-forward | Setup-heavy; surface in Home empty-state for Simple |
| Settings | **Split**: lite (Simple) / full (Advanced) | Economics simple; cadence+alerts advanced |
| AI Specialists | **Keep** (Advanced); represented by outcomes in Simple | Core capability, complex surface |
| Policy Check | **Keep** under AI Team | Genuine ads job |
| UTM Builder | **Demote** to Create (collapsed) | Useful but not daily |
| Content Studio | **Demote** to Create | Adjacent job |
| Creative Library | **Demote** to Create | Adjacent job |
| Canva Creator | **Demote** to Create | Adjacent job |
| Messenger Setup | **Hide behind Advanced + Expert** | Expert-only; niche |
| Ad Actions | **Hide behind Advanced + Expert + env gate** | Already double-gated; never in Simple |
| Bobby — Business | **Demote to palette / "More"** | Off the core ads loop |
| Aria — Courses | **Demote to palette / "More"** | Off the core ads loop |
| CRM Maintenance | **Demote to palette / "More"** | Off the core ads loop |
| Build a Dashboard | **Demote to palette / "More"** | Reference/operator content |
| Claude API | **Move to Settings → Advanced** | Setup/dev task, not a peer destination |
| Notifications | **Move under Account/Settings** | Config, not a daily destination |
| Portfolio | **Keep (Advanced, Pro+)** | Power/agency surface |
| White-label | **Keep (Advanced, Expert)** | Power/agency surface |
| User Manual → "Help" | **Keep**, both modes | Support |

Net effect: Simple = **5**; Advanced = **~12 visible** (with two collapsible groups) instead of a flat 24; the off-loop tools (Bobby/Aria/CRM/Build-a-Dashboard) move to a "More"/palette surface where they're findable but not noise.

### 5.4 Rail styling fixes (both modes)
- Single-line labels; drop the permanent per-item description sub-line (show on hover or in the page header instead).
- Reduce emoji or standardise to a single muted icon style — 24 multicoloured emoji is itself visual noise.
- The Simple/Advanced toggle stays top of rail, relabelled "Simple / Advanced", with the explanatory line shown only on first use.

---

## 6. Implementation approach (reusing `mode` + entitlements)

**No new infrastructure required for phase 1.** The two primitives already exist (`useMode()` and `can(plan, feature)`); the work is wiring.

### 6.1 Make nav mode- and plan-aware
- Add metadata to each `NAV_GROUPS` item: `minMode?: "advanced"`, `feature?: Feature` (for the entitlement gate), `collapsed?: boolean`, and `paletteOnly?: boolean`.
- In `Sidebar`, read `useMode()` + the server-passed `plan` and filter:
  - Simple mode → render only the 5 spine items.
  - Advanced mode → render grouped items; hide `paletteOnly`; show `feature`-gated items with a lock badge when `!can(plan, feature)` (relevant-but-locked) and omit entirely when irrelevant to the tier.
- `plan` already reaches the shell server-side (Command Center fetches it); pass it into `AppShell`/`Sidebar` as a prop to avoid a client round-trip and hydration flash.

### 6.2 Make pages mode-aware (density)
- Pattern already proven in `AnalyzeClient` and `canva-creator`: `const { mode } = useMode();` then conditionally render the dense/configure layer. Extend to Command Center (Simple single-column hero vs Advanced widget grid) and Settings (3-field vs full).
- Where a page is server-rendered (Command Center, Proposals), either (a) render both layers and toggle visibility client-side via a small `<ModeGate mode="advanced">` wrapper, or (b) read a mode cookie server-side. Recommend a tiny `mode` cookie mirrored from localStorage so SSR picks the right layout without flicker.

### 6.3 Reusable building blocks to add
- `<ModeGate mode="advanced">…</ModeGate>` — render-children-only-in-advanced helper (DRY for the many density conditionals).
- `<FeatureGate feature="ai_team">` — already implicit via `can()`; formalise as a component that renders a soft upgrade nudge instead of a dead control.
- A `useSavedViews()` / `useDashboardLayout()` hook backed by the same localStorage-then-settings approach as mode (phase 2 for checkpoints persisted to `reports`).

### 6.4 Sequencing
1. **Phase 1 (high impact, low risk):** mode+plan-aware nav filtering; relabel toggle; drop per-item descriptions; Simple Home layout; lite Settings. This alone removes ~80% of perceived clutter.
2. **Phase 2:** customisable Command Center widgets; per-factor drill-down promotion; bulk upload + universal export; Cmd-K palette (absorbs the demoted long tail).
3. **Phase 3:** saved views + checkpoints (compare-to-snapshot); full automation control surface.

### 6.5 Guardrails to preserve
- Read-only safety notice stays in both modes. Ad Actions remains Expert + `ADS_WRITE_ENABLED` + typed-YES — Advanced mode never relaxes a gate; mode controls *visibility/density*, plan controls *capability*. The two axes are independent and must both pass.
- Resale-clean: no private data introduced; all changes are presentation-layer.

---

## 7. Sources (web available)

- UXPin — *What Is Progressive Disclosure in UX?*: https://www.uxpin.com/studio/blog/what-is-progressive-disclosure/
- Interaction Design Foundation — *What is Progressive Disclosure?* (2026): https://ixdf.org/literature/topics/progressive-disclosure
- Lollypop Design — *The Power of Progressive Disclosure in SaaS UX*: https://lollypop.design/blog/2025/may/progressive-disclosure/
- Medium / L. Ghazaryan — *Progressive Disclosure in SaaS UX*: https://medium.com/@liana.ghazaryan1995/progressive-disclosure-in-saas-ux-designing-for-clarity-and-control-672643fccfbd
- Superhuman Blog — *How to build a remarkable command palette*: https://blog.superhuman.com/how-to-build-a-remarkable-command-palette/
- Retool — *Designing Retool's Command Palette*: https://retool.com/blog/designing-the-command-palette
- (pixxen.com progressive-disclosure playbook returned HTTP 403; not used.)

**Key external patterns applied:** three-layer dashboard model (glance → detail → configure); "power-user mode turns progressive disclosure off"; command palette as the long-tail accelerator that keeps visible nav short; saved/named views for repeat workflows.
