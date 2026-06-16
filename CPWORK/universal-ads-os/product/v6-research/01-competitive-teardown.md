# AdPilot OS V6 — Competitive Teardown (Stream 1)

**Authors:** Piper (productisation) + senior ad-tech product strategist (ex Triple Whale / Motion / Northbeam class).
**Date:** 2026-06-16 · **Status:** Phase 0 research deliverable for `V6-MASTER-PLAN.md`.
**Web access:** AVAILABLE this session (US-only WebSearch). Multiple live 2026 sources cited inline. One source (`triplewhale.com/ai-org-chart`) returned HTTP 403 and was substituted with search-snippet evidence. Where a claim rests on domain knowledge rather than a fetched source it is tagged *(domain knowledge)*.

---

## 0. How to read this document

The field splits into **five archetypes**. AdPilot competes against all of them but *is* none of them — that is the wedge.

| Archetype | What they sell | Representative tools |
|---|---|---|
| **Attribution / blended analytics** | "Where did revenue really come from?" | Triple Whale, Northbeam, Hyros, Polar Analytics |
| **Creative analytics** | "Which creative is winning and what to make next" | Motion, Madgicx (creative side) |
| **Rule/AI automation (autopilot)** | "Change the account for me" | Revealbot, Madgicx (automation side), Smartly.io |
| **Data pipeline / reporting** | "Get the numbers into my warehouse / dashboard" | Funnel.io, Supermetrics, AdEspresso (legacy), Shopify/Birch reporting |
| **Native platform AI** | Free, in-platform black-box optimisation | Meta Advantage+, TikTok Smart+ |

AdPilot is a **sixth thing**: a *safe-by-construction diagnostic + advisory + (gated) execution OS* that **proposes, explains, and verifies** — across Meta+TikTok, AU/SMB-first, white-labellable. Nobody listed above occupies that square cleanly. The whole strategy below is: **steal the polished surfaces of the analytics/creative/automation leaders, keep our safety+explainability+AU moat, and serve the SMB/agency segment the incumbents have priced or complexity-walled out.**

---

## 1. Capability matrix — top 12 tools

Legend: ●=strong / first-class · ◐=partial / paid add-on / shallow · ○=absent or not a focus. AdPilot column reflects the **live v4.0.0 app** (see app inventory, §1a) — *not* aspirations.

| Capability | Triple Whale | Northbeam | Motion | Madgicx | Revealbot | Smartly.io | Hyros | Polar Analytics | Funnel.io | Supermetrics | Meta/TikTok native | **AdPilot (today)** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Meta + TikTok coverage | ● | ● | ● | ◐ Meta-led | ● | ● | ● | ● | ● | ● | ● (own) | ● |
| Multi-touch / blended attribution | ● | ●● best-in-class | ◐ via NB | ◐ | ◐ | ○ | ● long-cycle/LTV | ● | ○ | ○ | ◐ in-platform only | ○ |
| First-party pixel / server-side tracking | ● | ● | ○ | ◐ | ○ | ○ | ●● | ● | ○ | ○ | ◐ | ○ (relies on platform actions) |
| Creative-level analytics (hook/hold/thumb-stop) | ● Moby | ◐ | ●● best-in-class | ● | ◐ | ◐ | ○ | ◐ | ○ | ○ | ◐ | ◐ (TikTok hook/hold in reports) |
| Creative *vision* analysis (read the actual asset) | ◐ | ○ | ● tagging | ● | ○ | ● DCO | ○ | ○ | ○ | ○ | ◐ | ○ |
| Automated budget reallocation / autopilot | ◐ | ○ | ○ | ●● | ●● rules | ●● | ○ | ○ | ○ | ○ | ●● black-box | ○ (proposal-only by design) |
| Rule builder (custom thresholds → actions) | ◐ | ○ | ○ | ● | ●● best-in-class | ● | ○ | ○ | ○ | ○ | ◐ | ◐ (threshold *alerts*, no actions) |
| Health/score-style single number | ◐ | ○ | ◐ creative score | ◐ | ○ | ○ | ○ | ◐ | ○ | ○ | ○ | ●● 13-factor, explainable |
| Explainability of recommendations | ◐ | ◐ | ◐ | ◐ | ○ (rules are explicit) | ○ | ◐ | ◐ | n/a | n/a | ○●● opaque | ●● "what/why/impact/confidence/reverse" |
| AI agent / copilot ("teammate") | ●● Moby 2 | ◐ | ◐ | ● AI Marketer | ○ | ◐ | ○ | ● AI agents | ○ | ○ | ◐ | ●● 12-persona team |
| Forecasting / spend simulation | ◐ | ◐ | ○ | ◐ | ○ | ◐ | ● revenue projection | ◐ | ○ | ○ | ○ | ○ |
| LTV / payback modelling | ● | ● | ○ | ◐ | ○ | ○ | ●● | ● | ○ | ○ | ○ | ○ |
| Ad-library / competitor research | ◐ | ○ | ◐ inspiration | ● | ○ | ○ | ○ | ○ | ○ | ○ | ◐ ad library | ○ |
| Data pipeline to warehouse/Sheets | ◐ | ◐ | ○ | ○ | ○ | ○ | ◐ | ● Snowflake | ●● | ●● best-in-class | ◐ export | ◐ CSV/UTM |
| White-label / agency portfolio | ◐ | ◐ | ◐ | ◐ | ● | ● | ○ | ◐ | ● | ● | ○ | ●● gated tier |
| Policy / compliance copy check | ○ | ○ | ○ | ○ | ○ | ◐ | ○ | ○ | ○ | ○ | ◐ rejection only | ●● Paige + checker |
| Read-only safety guarantee | ○ | n/a | n/a | ○ | ○ | ○ | n/a | n/a | n/a | n/a | ○ | ●● cannot edit/delete by construction |
| SMB pricing (<$100/mo entry) | ○ ($129+→ scales hard) | ○ (enterprise) | ◐ | ● (<$50 entry) | ◐ ($99+spend) | ○ (enterprise) | ○ ($230+) | ○ ($400+) | ○ | ◐ | ● free | ● ($97 entry / SaaS tiers) |
| AU/AUD/GST/ACCC localisation | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ◐ | ●● native |

**Reading the matrix:** the right-hand columns (explainability, read-only safety, health score, policy check, AU localisation, SMB price) are an almost-empty field for everyone else and a near-solid column for AdPilot. The left-hand columns (attribution, LTV, creative vision, forecasting, autopilot) are where incumbents are ● and AdPilot is ○. **V6 strategy = close the high-value left-side gaps without surrendering the right-side moat.**

### 1a. What AdPilot actually ships today (live app inventory)
Confirmed from `adpilot-v2/`: 13-factor explainable health score + 6 per-ad verdicts (keep/scale/reduce/kill/refresh/fix-tracking + insufficient-data) in `lib/engine/`; **12-persona AI specialist team** + hardened GUARDRAILS in `lib/agents/registry.ts` grounded by `lib/agents/knowledge.ts`; Meta+TikTok **read-only** sync (30-day window) in `lib/sync/pull.ts`; report templates (daily/weekly/monthly/audit) in `lib/reports/`; threshold **alerting** (no actions) in `lib/cron/alerts.ts`; UTM builder (`lib/utm.ts`); policy checker (`/api/policy/check`); organic content publishing (separate write scope); rule-based Messenger bot; Stripe billing + 4-tier entitlements (`lib/plans.ts`/`lib/entitlements.ts`); CRM lead webhook with hashed PII → lead-quality factor.
**Confirmed absent today:** multi-touch attribution, LTV/payback, forecasting/spend simulation, creative-vision analysis, ad-library/competitor research, budget automation, DCO, seasonality adjustment, cross-platform spend orchestration.

---

## 2. Best aspects of each tool worth stealing

For each: the *one or two things they are genuinely best at* and a note on how AdPilot should adapt it (never auto-execute; always explainable; AU-aware).

**Triple Whale** — *the "AI teammate that already knows your business" framing (Moby 2 / AI org-chart).* They turned analytics into a colleague you ask questions of, and a teammate that drafts work (segments, landing pages, Klaviyo campaigns, catches creative fatigue). **Steal:** the *teammate* narrative and a single conversational entry point that routes to specialists and *does the work* (drafts a report, a test plan, a creative brief) — AdPilot already has the 12-persona engine; it lacks the "one teammate who orchestrates them and produces an artefact." Also steal **blended/MER-led dashboards** as the default top-line, not a buried metric.

**Northbeam** — *best-in-class multi-touch attribution with server-side ingestion across many channels.* **Steal:** a credible, *explained* attribution view (even a transparent last-click vs platform-reported reconciliation) so AdPilot can answer "your platform says 40 sales, blended reality is ~28" — the #1 trust gap SMBs have. Keep it explainable: show the model, don't hide it.

**Motion** — *the creative-performance visual story (hook rate, hold rate, thumb-stop, side-by-side creative comparison) that media buyers screenshot straight into client decks.* **Steal:** a **Creative Scorecard** view — rank creatives by hook/hold/spend/ROAS, group by concept/format/angle, and surface "what's fatiguing / what to make more of." This is the single most *demoable* feature in the category and AdPilot only half has it (TikTok hook/hold in reports, no dedicated creative view).

**Madgicx** — *all-in-one Meta autopilot: AI Marketer agent + automated bidding/budgets + creative insights + audience discovery, at a <$50 entry.* **Steal:** the **AI Marketer "do it for me" packaging** and **audience-discovery insights**, but render every action as a *proposal* with one-tap approval — AdPilot's safety model turns Madgicx's biggest liability (autopilot wrecking accounts) into a differentiator.

**Revealbot** — *the best granular rule builder; users build ~23 rules/account automating ~73% of routine ops.* **Steal:** a **visual rule/automation builder** ("if frequency ≥ 4 and CTR drops 25%, propose refresh") — but our rules *fire proposals/alerts*, optionally gated auto-execute behind typed-YES + `ADS_WRITE_ENABLED`. AdPilot has threshold alerts but no user-facing rule builder; this is a clean upgrade.

**Smartly.io** — *enterprise dynamic creative optimisation: thousands of variants, localisation across markets.* **Steal (lightly):** the *concept* of programmatic creative variant generation and localisation — for AU SMBs this becomes "generate 5 on-brand variants + AU-localised copy" via Stella/Creative, not enterprise DCO. Don't chase their scale; chase their *idea*.

**Hyros** — *long-cycle / high-ticket attribution + revenue projection from historical tracking; trusted by info-product/coaching advertisers.* **Steal:** **revenue projection / forecasting** ("at current trajectory, this campaign returns ~$X over 30 days, ±confidence") and **long-window conversion handling** for lead-gen/high-ticket AU clients (coaches, trades, services) — a segment Shopify-centric tools serve poorly.

**Polar Analytics** — *full-stack: attribution + BI + warehouse + 45+ connectors + AI agents in one.* **Steal:** the **"one place" consolidation** narrative and a **library of pre-built insight cards/agents** the user can pin. Don't build a warehouse; do build the *feeling* of a complete cockpit.

**Funnel.io** — *clean, governed marketing data pipeline with strong data normalisation/transformation.* **Steal:** **data-quality/normalisation rigor** and the trust that comes from "your numbers are governed" — AdPilot's self-verifying engine is adjacent; surface a *data-health/confidence* panel prominently (we have data_confidence as a factor; promote it to a first-class trust signal).

**Supermetrics** — *frictionless export to Sheets/Looker/BigQuery where teams already work; cheap for small teams.* **Steal:** **"send my AdPilot health + verdicts to Google Sheets/Looker on a schedule"** — meet agencies in their existing reporting surface instead of forcing them into ours. Low effort, high stickiness.

**AdEspresso (legacy)** — *was loved for dead-simple split-testing UX and approachable reporting for SMBs.* **Steal:** the **SMB-friendly simplicity** ethos — this directly validates V6's "Simple view." Their decline (feature-stagnation under Hootsuite) is also a warning: simple ≠ shallow.

**Shopify / Birch native reporting** — *zero-setup, in-context commerce reporting where the merchant already is.* **Steal:** **zero-config first value** — a merchant connects and sees something useful in <60s. AdPilot's onboarding should hit an "aha" before any config.

**Meta Advantage+ / TikTok Smart+** — *free, native, increasingly good black-box automation; TikTok Smart+ (Oct 2025) added module-by-module control after advertisers revolted over the lack of visibility/control.* **Steal — the most important strategic lesson in this doc:** the market's loudest complaint about native AI is **"no visibility or control."** TikTok's fix (let me lock bidding, hand creative to the machine, per-module) is *exactly* AdPilot's native posture. **Position AdPilot as the explainability/visibility layer over the black boxes** — "the platforms optimise; AdPilot tells you *why*, *whether to trust it*, and *what they got wrong.*"

---

## 3. Where AdPilot can leapfrog (gaps nobody serves well)

These are whitespace squares — high willingness-to-pay, weak/absent in every incumbent.

**L1. Safe-by-construction execution (the unkillable autopilot).**
Every autopilot (Madgicx, Revealbot, Smartly, native) can silently raise budgets or pause winners — and advertisers fear it (TikTok Smart+ backlash proves it). AdPilot's `decide().safe = true`, no-delete, no-edit-by-construction core means it can offer **"autopilot you can't be hurt by": proposals + gated, reversible, typed-YES execution with a full audit log.** No competitor can truthfully claim "physically cannot wreck your account." This is the headline.

**L2. Explainability + self-verifying maths as a *product surface*, not a footnote.**
Incumbents show numbers; almost none show *why* a recommendation exists, *how confident* it is, and *how to reverse* it — and native AI shows nothing. AdPilot already structures every output as **what/why/impact/confidence/reverse** and can run `selftest` to prove its formulas. Make this visible: a **"Why this verdict?" panel + "Prove the maths" button** on every recommendation. This is the trust wedge that converts skeptical SMBs and de-risks agency resale.

**L3. AU/SMB-native, lead-gen-aware (not Shopify-DTC-only).**
The entire attribution/analytics top tier (Triple Whale, Northbeam, Polar, Hyros-DTC) is **US, USD, Shopify-DTC-centric**. Nobody is native AUD/GST/ACCC, and few handle **lead-gen / high-ticket services** (trades, coaches, clinics, local services) well — which is the bulk of AU SMB ad spend. AdPilot already does AUD/GST/ACCC + a lead-quality CRM loop. Leapfrog by owning **"the ads OS built for Australian small business and services, not US Shopify stores."**

**L4. Agency white-label cockpit with safety + explainability baked in.**
Agencies resell trust. A white-labelled portfolio view where *every* recommendation is explainable and *no* action is irreversible is a uniquely defensible agency product — Revealbot/Smartly white-label the automation but not the safety/explainability story. AdPilot has the gated white-label tier; V6 should make it a **multi-client portfolio cockpit** (rank clients by health, flag the worst, generate branded reports in bulk).

**L5. Cross-platform, break-even-led decisioning (Meta *and* TikTok in one verdict).**
Most tools are Meta-first with TikTok bolted on (Madgicx) or are platform-agnostic pipes (Funnel/Supermetrics) that don't *decide*. AdPilot already runs one universal schema and decides on **break-even CPA/ROAS + MER** across both. Leapfrog: a **cross-platform spend-shift proposal** ("move $X from fatiguing Meta set to TikTok winner; here's the expected effect, here's how to reverse").

**L6. Compliance/policy-safe creative + copy (Paige).**
No analytics competitor checks whether your copy will get *rejected* or breach ACCC. AdPilot has Paige + a policy checker. Leapfrog: bundle **"will this ad get approved + is it ACCC-clean"** into the creative workflow — a genuine SMB pain (rejections, account flags) nobody else solves.

---

## 4. Ranked V6 feature backlog (highest impact first)

Each tagged: **Client $** (revenue impact for the user's ad account) · **Owner $** (AdPilot's monetisation/upsell leverage) · **Dev effort** (S/M/L/XL). Ranking = (Client$ × Owner$) ÷ Effort, weighted by moat-fit.

| # | Feature | Steals from | Client $ | Owner $ | Dev effort | Why it ranks here |
|---|---|---|---|---|---|---|
| 1 | **Creative Scorecard** (hook/hold/thumb-stop, rank by concept/angle/format, fatigue flags, "make more of this") | Motion, Triple Whale | High | High | M | Most *demoable* feature in the category; we half-have the data already; sells the upgrade and screenshots into client decks. |
| 2 | **Explainability + "Prove the maths" panel** on every verdict (what/why/impact/confidence/reverse + one-click selftest) | (leapfrog L2; native AI's gap) | Med | High | S–M | Cheap, pure moat, converts skeptics, de-risks agency resale. Foundation for trusting everything else. |
| 3 | **Gated, reversible auto-execute** ("autopilot you can't be hurt by": rules → typed-YES → audit-logged, env-gated) | Madgicx, Revealbot, native | High | High | L | The headline differentiator (L1). Turns our safety constraint into the marquee feature. Must stay behind `ADS_WRITE_ENABLED` + Expert tier. |
| 4 | **Visual rule/automation builder** (if-this-then-propose; optionally then-execute) | Revealbot | High | Med | M | Power-user surface for the Advanced view; pairs with #3; agencies live in rules. |
| 5 | **Blended/MER top-line + transparent attribution reconciliation** (platform-reported vs blended; show the model) | Northbeam, Triple Whale | High | Med | L | Closes the biggest analytics gap; the "your platform is lying to you by ~30%" reveal drives retention. Keep it explainable, not a black box. |
| 6 | **Revenue/spend forecasting + simulation** ("spend $X → expect $Y ±confidence; pacing to budget") | Hyros, Triple Whale | Med | High | M–L | High perceived value, strong upsell, differentiates from pure dashboards; reuses engine maths. |
| 7 | **Conversational "teammate" orchestrator** (one entry that routes to the 12 specialists and *produces an artefact*) | Triple Whale Moby 2 | Med | High | M | We have the agents; we lack the single front door that does work. Big UX leap for Simple view; strong retention. |
| 8 | **Agency portfolio cockpit + bulk branded reports** (rank clients by health, flag worst, white-label export) | Revealbot/Smartly white-label; Polar consolidation | Med | High | M | Directly grows the highest-ARPU tier; pure owner-$ play; moat-aligned (safe + explainable resale). |
| 9 | **Creative vision analysis** (read the actual image/video: hook in first 3s, text density, brand coherence, format fit) | Motion, Madgicx, Smartly | High | Med | L–XL | Big client value but heavy (vision models, cost, eval); sequence after Scorecard so we have the surface to land it in. |
| 10 | **Scheduled export to Google Sheets / Looker / BigQuery** (health + verdicts on a cron) | Supermetrics, Funnel.io | Low–Med | Med | S–M | Cheap stickiness; meets agencies where they already report; low risk. |
| 11 | **Audience-discovery + competitor/ad-library insights** | Madgicx, Meta Ad Library | Med | Med | L | Useful but lower trust/differentiation; can lean on public Ad Library; sequence later. |
| 12 | **LTV / payback-period modelling** (esp. lead-gen/high-ticket AU services) | Hyros, Northbeam, Polar | Med | Med | L | High value for the AU services niche (L3) but needs CRM-revenue depth; gate to Expert; sequence with #5/#6. |
| 13 | **Cross-platform spend-shift proposals** (Meta↔TikTok, reversible) | (leapfrog L5) | Med | Med | M | Distinctive and moat-fit, but depends on #3/#4/#5 being solid first. |
| 14 | **Policy/ACCC pre-flight on creative** (will it get approved + is it compliant) | (leapfrog L6) | Low–Med | Med | S–M | Cheap, unique, reduces real SMB pain (rejections); bundle into creative workflow. |

**Sequencing recommendation for PM convergence:** Wave 1 = #2, #1, #4, #10 (cheap moat + the most demoable surface + low-risk stickiness). Wave 2 = #5, #7, #8 (the analytics + UX + agency leaps). Wave 3 = #3, #6, #9, #13 (the heavy/gated execution + intelligence). #11/#12/#14 are opportunistic. Everything that touches the account stays **proposal-first, reversible, audit-logged, env-gated** — the invariant is the product.

---

## 5. One-paragraph strategic verdict

The analytics/attribution leaders (Triple Whale, Northbeam, Polar, Hyros) are **US/USD/Shopify-DTC** and *show* truth; the automation tools (Madgicx, Revealbot, Smartly) and native AI (Advantage+, Smart+) *change* accounts and are **feared for opacity**; the pipes (Funnel, Supermetrics) just *move data*. The empty centre of the board is a tool that **decides safely, explains itself, proves its own maths, serves AU SMBs and agencies, and only acts with reversible, audited consent** — which is precisely AdPilot. V6 should steal the *creative scorecard* (Motion), the *AI teammate framing* (Triple Whale), the *rule builder* (Revealbot), and *forecasting* (Hyros), while making **explainability and safe-execution the marquee features no incumbent can honestly match.** Win condition: be the explainability + safe-execution layer over the black boxes, for the segment the giants priced out.

---

## Sources (web, June 2026)
- Stormy AI — Triple Whale vs Northbeam ecommerce ad spend optimization: https://stormy.ai/blog/triple-whale-vs-northbeam-ecommerce-ad-spend-optimization
- Improvado — Northbeam vs Triple Whale: https://improvado.io/blog/northbeam-vs-triple-whale
- Blocksentient — Motion 2026 review: https://blocksentient.com/review/motion/
- adlibrary.com — Triple Whale vs Northbeam 2026: https://adlibrary.com/posts/triple-whale-vs-northbeam
- adlibrary.com — AI ad tools for media buyers (2026 stack): https://adlibrary.com/posts/ai-ad-tools-for-media-buyers
- get-ryze.ai — Madgicx review 2026 / alternatives: https://www.get-ryze.ai/blog/madgicx-review-2026-meta-ads-alternatives
- get-ryze.ai — Revealbot review 2026: https://www.get-ryze.ai/blog/revealbot-review-2026-facebook-ads-automation
- get-ryze.ai — Top AI tools for Meta Ads 2026: https://www.get-ryze.ai/blog/top-ai-tools-meta-ads-management-2026
- adstellar.ai — Meta ads automation software pricing 2026: https://www.adstellar.ai/blog/meta-ads-automation-software-pricing
- saasworthy.com — Madgicx features/pricing (Apr 2026): https://www.saasworthy.com/product/madgicx
- polaranalytics.com — Hyros vs Polar (2026): https://www.polaranalytics.com/alternatives/hyros
- cometly.com — Hyros vs other attribution tools (2026): https://www.cometly.com/post/hyros-vs-other-attribution-tools
- profitableads.com — Hyros review 2026: https://www.profitableads.com/hyros-review/
- improvado.io — Funnel.io alternatives 2026: https://improvado.io/blog/funnel-io-alternatives-and-competitors
- easyappsecom.com — Supermetrics Shopify analytics guide 2026: https://easyappsecom.com/guides/shopify-supermetrics-guide
- datascale.de — Funnel.io vs Supermetrics vs Fivetran 2026: https://datascale.de/blog/funnel-io-praxistest/
- lunio.ai — TikTok Smart+ campaigns: https://www.lunio.ai/blog/tiktok-smart-plus-campaigns
- ppc.land — TikTok Smart+ automation usability update: https://ppc.land/tiktok-just-made-its-smart-automation-actually-usable-for-advertisers/
- TikTok for Business — Smart+ AI performance solution: https://ads.tiktok.com/business/en-US/blog/smart-plus-ai-performance-solution
- segwise.ai — Top 10 AI tools for Meta Ads 2026: https://segwise.ai/blog/top-10-ai-tools-meta-ads-management-2026-v2
- dexteragent.ai — Triple Whale profile/AI strategy 2026: https://dexteragent.ai/companies/triple-whale-1771298132
- ai-cmo.net — Madgicx review 2026: https://ai-cmo.net/tools/madgicx
- triplewhale.com (AI org chart — attempted, HTTP 403, snippet-substituted): https://www.triplewhale.com/ai-org-chart
