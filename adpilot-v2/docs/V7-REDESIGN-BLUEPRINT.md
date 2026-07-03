# AdPilot OS V7 — "The Cockpit" Redesign Blueprint

> The definitive product + design spec for the V7 remake. Written from a three-track research
> pass: (1) a full audit of the V6 UI, (2) asset-mining of the founder's operational playbooks
> (field-tested ads guardrails, no-fabrication answer engine, fintech dashboard patterns),
> (3) an industry benchmark of Madgicx, Revealbot, Triple Whale, Motion, Atria, Foreplay,
> AdCreative.ai and Smartly/Optmyzr (2026 state of the art).
>
> Status: **Phase 1 in build.** Each phase ships as its own PR with the evaluator checklist below.

---

## 1. Positioning (unchanged, sharpened)

**The only ads operating system that physically cannot wreck your account — and proves every
number it shows you.**

Three moats, all verified against the competitive research:

1. **Safety by architecture.** Every incumbent (Madgicx, Revealbot, Smartly) sells automation
   that *acts* on your account. Nobody sells the inverse: a system that is read-only by
   architecture and puts every action behind an explicit human approval. That is a positioning
   asset, not a limitation — lead with it.
2. **Statistics honesty.** AdCreative.ai's top user complaint is opaque scoring ("why is this
   an 87?"). Atria grades ads with letters and no confidence measure. AdPilot's Wilson
   significance gate + "insufficient data" verdict + explain-every-factor breakdown is the
   direct counter. **No number without a why. No verdict without enough data. No fabricated
   benchmark, ever** (the no-fabrication rule: an unverifiable figure renders as a gap or an
   escalation, never as a made-up dollar amount).
3. **Break-even economics at the centre.** Triple Whale centres blended ROAS; Motion centres
   creative engagement. Nobody centres *your break-even* — the one number an SMB owner actually
   feels. Every AdPilot verdict is anchored to break-even CPA/CPL. Keep it that way and make it
   visually central.

**Pricing validation (2026 benchmark):** Motion starts at USD $250/mo. Triple Whale ≈ USD
$1,490/yr entry. Atria USD $159/mo. Foreplay USD $59–459/mo. AdCreative.ai USD $39–599/mo.
AdPilot at AUD $49/$149/$399 dramatically undercuts the category while being the only
safety-first, statistics-honest entrant. Hold the pricing; sell the moats.

---

## 2. What the research found (condensed)

### V6 UI audit — the 10 weaknesses to kill
1. **No real charting** — one 20-line sparkline is the entire viz layer of a "control room for money".
2. **Emoji as the icon system** — inconsistent across OSes, unprofessional for a money product.
3. **Incomplete warm-theme migration** — cool-blue leftovers in `layout.tsx` body, sidebar bg, gauge track, themeColor.
4. **Approval has no gravity** — the core propose→approve flow is a naked single click while marketing says "typed YES".
5. **Two disconnected AI-chat surfaces** (floating ChatPanel vs /ai-specialists console).
6. **No visual hierarchy of money** — a wasted-spend alert card weighs the same as a settings widget.
7. **No skeleton/empty/error-state system** — 2 of 30 routes have real loading states.
8. **Inconsistent page widths/headers** — max-w-xl → full-bleed with no system.
9. **Tooltips compensating for missing information design** — tables where charts should be.
10. **The full picture is never shown** — users see only the exception list, never "27 ads evaluated · 19 fine · 3 need data · 5 need action".

### Field-tested operational gold (from the founder's own playbooks — genericised)
- **Kill criteria as code**: CPL > break-even multiple after threshold spend → pause · CTR < 0.7%
  after 8,000 impressions → pause · frequency > 3.5 in 7 days → refresh creative · zero results
  after meaningful spend → kill · CPC sustained high 5 days → broaden targeting.
- **Budget guardrails**: per-campaign daily ceilings + a combined daily cap; warn at ~85%,
  flag breach at 100%; never propose more than a small step change; never two budget changes
  in one day; never below a floor.
- **Learning-phase discipline** ("act on dollars, not percentages"): while an ad set is in
  learning (or the audience is too small to exit it), judge on absolute cost-per-result with a
  relaxed threshold — never alarm on volatile week-on-week percentage swings.
- **Optimisation-event mismatch diagnosis**: "0 conversions" is usually a campaign pointed at
  the wrong optimisation event, not a broken ad — a first-class diagnosable, fixable finding.
- **Warm/cold temperature separation**: cold prospecting and warm retargeting must live in
  separate ad sets so cost-per-result reads per temperature — an auditable checklist item.
- **Morning-brief specificity bar**: a daily digest where every line names a real entity and a
  measurable outcome — generic advice ("review your campaigns") is a banned output.
- **Dark fintech dashboard language** (proven in production): near-black navy `#0b1220`-family
  background, ice-blue/teal accents, semantic good/warn/bad (green/amber/red), card grid,
  tabular numerals, a "hot" red-tinted variant for the single most urgent number.

### Industry patterns worth adapting
- **Triple Whale**: drag-friendly KPI tiles; hover a tile → trend graph; click → drill-down vs
  prior period; light+dark themes; "incredibly clean" as a retention feature.
- **Motion**: creative thumbnail beside its numbers, always; Hook/Watch/Click/Convert funnel
  scoring; leaderboards over tables.
- **Atria**: portfolio "Radar" with per-ad grades and iteration flags — but no statistics gate
  (our edge).
- **Revealbot**: rule builder as the product; we ship *read-only* rules that propose instead of act.
- **Foreplay**: beautiful board/grid UX proves visual polish is a moat in this category.

---

## 3. The V7 design language — "Warm Cockpit"

Keep the coral/amber brand. Add a committed **dark cockpit surface** for the money pages,
derived from the proven fintech dashboard palette but warmed to match the brand.

### New/updated design tokens (Phase 1)
| Token | Value | Role |
|---|---|---|
| `cockpit` | `#0e1220` | Cockpit page background (deep blue-black) |
| `cockpit-raised` | `#161b2e` | Cockpit card/panel background |
| `cockpit-edge` | `#242b42` | Cockpit borders/dividers |
| `cockpit-ink` | `#eef1f8` | Primary text on cockpit |
| `cockpit-muted` | `#8b93ab` | Secondary text on cockpit |
| `good` | `#37d399` | Semantic: healthy / under ceiling / significant win |
| `warn` | `#ffb84d` | Semantic: watch / approaching ceiling / learning |
| `bad` | `#ff6b6b` | Semantic: breach / kill / over break-even |
| `ice` | `#56c5ff` | Cockpit data accent (spend lines, links) |
| brand coral/amber | unchanged | CTAs, brand moments, light-theme pages |

Rules:
- Semantic colours (`good`/`warn`/`bad`) are the **only** way status is communicated on the
  cockpit; brand coral is reserved for actions/CTAs so "action" and "alarm" never blur.
- Tabular numerals (`tabular-nums`) on every money/metric figure, everywhere, no exceptions.
- The existing `band.*` tokens stay (light-theme health bands); cockpit surfaces use the
  semantic trio.
- **Purge every cool-toned hardcoded hex** left over from the pre-V6 theme (body bg, sidebar
  bg, gauge track, themeColor) — replace with tokens.

### Iconography
Emoji is retired from all status/nav/verdict surfaces, replaced by a zero-dependency, hand-drawn
SVG icon set (`components/icons.tsx`): 24px grid, 1.75px stroke, `currentColor`, one component
per icon. Emoji remains acceptable only as decorative flourish in marketing copy — never as the
sole carrier of meaning.

### Charts (`components/charts/`) — zero-dependency SVG kit
| Component | Purpose |
|---|---|
| `RingGauge` | Reusable health-score ring (extracted from AnalyzeClient, themeable) |
| `Spark` | Upgraded sparkline: optional area fill, min/max dots, fixed-or-auto domain |
| `TrendChart` | Time-series with axes, gridlines, area gradient, hover tooltip — spend/CPA/health over time |
| `FactorBars` | Horizontal weighted-contribution bars — replaces the "Why this score?" table |
| `PacingBar` | Spend-vs-cap bar with projected end-of-day marker and ceiling tick — the signature cockpit element |
| `DistributionStrip` | Single stacked strip showing the FULL verdict distribution (incl. keep + insufficient-data) |

Chart discipline (inherited from the sparkline's own comment): axes and domains may never
mislead — health is always 0–100; money charts always start at zero or show the break.

---

## 4. Mission Control — the Phase-1 flagship rebuild

`/command` becomes a true dark cockpit (full-bleed `cockpit` background for the page):

1. **Status strip** — org name, data freshness ("synced 22m ago" with live dot), plan,
   read-only badge. One line, always visible.
2. **Hero row** — `RingGauge` (health, large) · health `TrendChart` (real axes, 60-run history)
   · **the full picture**: `DistributionStrip` + "N ads evaluated — N fine · N need more data ·
   N need action" (kills weakness #10).
3. **Money row** — three cockpit tiles with real hierarchy:
   - **Today's pacing**: `PacingBar` — spend today vs the sum of platform daily budgets,
     projected end-of-day, per the guardrails engine. (Data: latest `campaign_snapshots` day +
     `daily_budget` columns — no new migration.)
   - **Potential waste**: the `hot` red-tinted variant — the one number allowed to shout.
   - **CPA vs break-even**: delta chip (`good`/`bad`) + ROAS-vs-platform-reported reconciliation line.
4. **Budget guardrails panel** — one row per campaign: name · platform · spend-today vs ceiling
   `PacingBar` (ceiling = platform daily budget) · learning-phase badge ("Learning — day 3;
   judge on dollars, not %") · status chip good/warn/breach. Read-only; a breach emits a
   *proposal*, never an action.
5. **Attention queue** — ranked proposals, verdict icons (not emoji), each card carrying its
   dollar context ("A$412 spent · CPA 2.3× break-even · loss is statistically significant").
   Approve becomes **two-step confirm-in-place** (click → button transforms to "Confirm kill —
   proposal only, you execute in Ads Manager" → click) — ceremony proportional to the promise
   (kills weakness #4).
6. **Right rail** — connections, sync audit trail, recent reports (unchanged data, cockpit skin).

### New engine module: `lib/engine/guardrails.ts` (pure, unit-tested)
```
evaluateGuardrails(rows, budgets, opts) -> {
  campaigns: [{ key, name, platform, spendToday, ceiling, pct, status: ok|warn|breach,
                learning: { active, dayNumber?, advice } | null }],
  combined:  { spendToday, cap, pct, projectedEod, status },
  findings:  Finding[]   // read-only proposals, e.g. "Campaign X at 92% of its daily ceiling"
}
```
- `warn` ≥ 85% of ceiling, `breach` ≥ 100%; projection = linear on hours elapsed (documented
  as a naive projection — honest about its limits).
- Learning-phase heuristic: campaign first seen < 7 days ago ⇒ learning; advice string encodes
  "act on dollars, not percentages" with the relaxed threshold.
- Ships the field-tested default rule set as `DEFAULT_GUARDRAILS` (generic numbers, org-
  overridable later via the P5.2 rules engine).

---

## 5. Phase map (each phase = one PR, evaluator-checked)

| Phase | Scope | Status |
|---|---|---|
| **P1 — Cockpit foundation** | Tokens + cool-hex purge · icon set · chart kit · guardrails engine + tests · Mission Control rebuild · two-step approve · nav icons | **this PR** |
| **P2 — Charts everywhere** | Creative Scorecard decay curves + thumbnails-beside-numbers · Ads Health factor bars + gauge reuse · proposals dollar-context cards · app-wide loading/empty/error system · shared page container | next |
| **P3 — The Daily Brief** | Morning-brief page + email: named entities, measurable outcomes, banned generic verbs; optimisation-event mismatch + temperature-separation checks as new engine diagnostics; full-picture verdict summary in reports | after P2 |
| **P4 — Coherence** | Merge the two AI surfaces into one dockable assistant · onboarding flow · marketing site refresh to cockpit screenshots · app-wide dark mode via CSS vars | after P3 |

Owner-gated (unchanged): Stripe price IDs, legal sign-off, Meta System User token in prod,
migrations 0001–0029 applied, `ADS_WRITE_ENABLED` stays OFF.

---

## 6. Evaluator checklist — Phase 1 (done = all boxes verified, not "looks done")

- [x] `npx tsc --noEmit` clean · `vitest run` all green (incl. new guardrails tests) ·
      `next build` green · `eslint` 0 errors · resale-clean grep clean
- [x] Zero cool-toned hardcoded hexes remain in `app/layout.tsx`, `AppShell.tsx`,
      `AnalyzeClient.tsx` gauge track (verified by grep for `#f4f7fb|#eef2f8|#0b1f3a|#eef2f7`)
- [ ] `/command` renders the cockpit: dark bg, status strip, RingGauge + TrendChart + full-picture
      distribution, PacingBar money row, guardrails panel, two-step approve — with graceful
      empty states when no data is connected
- [x] No emoji remains in sidebar nav or verdict chips on `/command` (icon components only)
- [x] `evaluateGuardrails` unit tests cover: ok/warn/breach boundaries, zero-budget campaigns
      (no ceiling → excluded, not divide-by-zero), learning-phase detection, combined cap,
      projection maths, and the read-only invariant (function returns findings, never mutates)
- [x] Every money figure on `/command` uses `tabular-nums`
- [x] Charts never mislead: health domain pinned 0–100; money bars zero-based
- [x] Simple mode still shows a calm cockpit (hero + attention queue only); Advanced adds
      guardrails detail + right rail
- [ ] Mobile: cockpit stacks cleanly at 390px; PacingBar and tables scroll within their cards

## 7. Invariants (restate — apply to every phase)

- Read-only: no code path edits a live ad; guardrails/pacing **propose**, humans act.
- No fabrication: no benchmark, projection or dollar figure without a computable source;
  unknowns render as explicit gaps.
- Wilson gate stays in front of scale/kill; "insufficient data" is a first-class verdict.
- AU English, AUD default; no earnings claims, no fake urgency.
- Resale-clean: no founder/client identifiers in the shippable tree; private context only via
  the runtime context-pack.
- RLS on every table; no new migration in P1.
