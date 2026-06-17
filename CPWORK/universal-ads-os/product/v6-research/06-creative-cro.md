# V6 Research — Creative & Offer / CRO Roadmap

> Lead: Stella (Creative) + Titan (Offer & Funnel), paired as a senior direct-response creative + CRO expert.
> Scope: maximise the levers that drive **client** revenue — creative quality, hooks, offer strength, funnel/landing conversion.
> Constraint: read-only on code; everything stays propose-only, AUD/AU-English, anti-hype, Paige-gated for compliance.
> Web research: **available** (egress not blocked). Benchmarks below are cross-checked against 2025–26 industry sources (see Appendix A).
> Date: 2026-06-16.

---

## 0. Executive summary

AdPilot today scores 13 health factors, but the four factors that most directly move *client* revenue are the weakest in the engine:

- `creative_freshness` is a **proxy** — it is derived purely from account-level frequency (`impressions/reach`), not from real per-creative hook/hold/CTR-decay signals. It cannot tell you *which* creative or angle is winning, and it cannot *predict* fatigue.
- `offer_strength` = **NEUTRAL 70** (hard-coded placeholder, weight 5).
- `landing_page_alignment` = **NEUTRAL 70** (hard-coded placeholder, weight 4).
- The Stella and Titan personas are smart, but they only produce *prose* on demand in the AI console — there is no structured scorer, no diagnostic intake, no "what to test next" engine feeding them.

This is the single biggest gap between AdPilot and best-in-class creative-analytics tools (Motion, Atria, Segwise, Marpipe). Those tools win on exactly the thing AdPilot leaves neutral: **creative-level scoring + fatigue prediction + offer/landing diagnostics**. Meta's Andromeda ranking system has compressed average creative lifespan from ~6 weeks to ~10 days (30–50% CTR drop by days 8–10), so *creative velocity is now the dominant performance lever* — and AdPilot currently can't see it.

**The biggest client-revenue lever:** activating a real **creative-performance scorer + fatigue predictor** (Feature A) tied to a **"what to test next" recommender** (Feature E) and **AI angle/UGC generation** (Feature C). Together these turn AdPilot from "diagnose the account" into "tell me which creative is winning, when it will die, and produce the next three winners" — which is where 60–80% of paid-social profit variance actually lives.

The cheapest high-leverage win is **activating `offer_strength` + `landing_page_alignment`** (Feature B): the engine already reserves 9% of the health score for them but feeds NEUTRAL, so the two factors that most often explain "CPL is fine but sales are zero" are invisible. A structured intake (offer-review-template + landing-page-review-template already exist as markdown) converts them from placeholder to real signal with low effort.

---

## 1. Where we are today (verified against code)

### Engine (`lib/engine/audit.ts`, `health.ts`)
- 13 factors, weights sum to 100. Creative/offer/funnel relevant ones:
  - `creative_freshness` — **weight 8**. `freshnessScore(freq)` only: freq ≤2 → 90, ≤3 → 65, ≤4 → 35, else 12. Account-level frequency only. No per-creative data, no CTR decay, no hold rate, no creative age.
  - `offer_strength` — **weight 5**. `factors.offer_strength = NEUTRAL` (70). Placeholder.
  - `landing_page_alignment` — **weight 4**. `factors.landing_page_alignment = NEUTRAL` (70). Placeholder.
  - `ctr` (8), `conversion_rate` (10), `cpc` (7) — exist but account/aggregate-level only.
- Findings engine fires a `creative_freshness` HIGH only when `freq ≥ 4`. N/A factors get an INFO line: "offer/landing review needs human input."
- Per-ad `decide()` verdicts include `refresh` and `fix-tracking`; `decide().safe` always true.

### Personas (`lib/agents/registry.ts`)
- **Stella** — direct-response creative: hooks, primary text, headlines, CTAs, UGC/script briefs tied to "winning angles." Prose only.
- **Titan** — offer & funnel: diagnoses leaks (offer, landing page, qualification, proof, CTA), especially "CPL fine, sales zero."
- **Travis** (TikTok) already references hook rate (3s) + hold rate (ThruPlay) + fatigue in his system prompt — but there is **no structured metric feeding him**; he reasons from whatever prose context exists.
- **Paige** — final say on copy; pass/flag/fix + compliant rewrites. This is the compliance gate every generated asset must pass.
- Shared `GUARDRAILS`: propose-only, numbers-first, AUD/AU-English, no personal email, structure = What I found · Why it matters · Safe proposal · Risk & how to reverse.

### App surface (already shipped)
- `/creative` — asset library (link/upload image/video/audio, link to campaign). Storage only, no scoring.
- `/canva-creator` — Stella brief generator (5 hooks, primary text, headline, CTA, visual concept, Canva search terms). Meta/TikTok aware. Calls `POST /api/ai/generate` task="canva".
- `/content` — organic studio (draft → approve → schedule → publish IG/FB/TikTok). AI Studio (Pro/Expert) drafts caption/hooks/shotlist.
- `/policy-check` — Paige compliance review (pass/flag/fix + rewrites).
- `/ai-specialists` — 12-agent console grounded in latest report. Stella/Titan reachable here but only as chat.
- **Gaps:** no creative-level performance view, no fatigue prediction, no offer scorer UI, no landing diagnostic UI, no UGC/script brief builder, no competitor research, no "what to test next."

### Skills/templates (markdown framework, not wired into the app)
- `creative-testing-lab/SKILL.md` — hypothesis format, ICE/PIE prioritisation, sample-size (break-even CPA × 15 conv, or ≥50 clicks), 7–14 day windows, paused-duplicate setup, `creative-testing-matrix.csv`.
- `creative-fatigue-detector/SKILL.md` — frequency ≥3 warning / ≥4 action; CTR drop ≥25% fatigued, 15–24% at-risk; CPM/CPA +20% WoW; TikTok hook <25% / hold <20%; creative age ≥30 at-risk / ≥60 fatigued; per-ad verdict + refresh/rotate/broaden recommendations.
- `offer-funnel-review/SKILL.md` — 11-step funnel audit, offer clarity score 1–10, ad↔page message match pass/partial/fail.
- `templates/offer-review-template.md` — **10 dimensions × 1–10 = /100** (Who-for, Core promise, Price clarity, Risk reversal, Urgency, Proof, Bonuses/value stack, CTA, Objections, Uniqueness). Verdict bands: Strong 80–100 / Moderate 60–79 / Weak <60.
- `templates/landing-page-review-template.md` — 10 sections × OK/Watch/Fix (above fold, message match, hero, proof, offer clarity, form/CTA friction, load speed, mobile, trust, tracking) + conversion-rate estimate vs benchmark + prioritised fixes. Note: "every 1s load costs ~7% mobile CVR."

**The headline insight:** the framework already contains a full, battle-tested scoring system for creative fatigue, offer strength and landing pages. V6 is largely about **porting those markdown rules into the deterministic engine and wiring structured intakes into the app** — not inventing new methodology.

---

## 2. External best-in-class benchmarks (web-validated)

| Signal | Best-in-class threshold | AdPilot today | Source |
|---|---|---|---|
| **Hook rate** (3s views ÷ impressions) | Target 30–40%; elite 35–45%; <25% = fix-it zone | Not measured | Billo, GreatMarketing.ai, Segwise |
| **Hold rate** (ThruPlay/25%+ ÷ impressions) | 25%+ to lift clicks; >50% strong; 40–50% average | Not measured | Meta guidelines via AdLibrary.com |
| **Creative lifespan (Andromeda era)** | ~10 days avg; 30–50% CTR drop by days 8–10 | Only freq≥4 flag | Segwise 2026 |
| **UGC vs polished** | UGC +31% hook rate, +33% CTR — score separately | Not segmented | Segwise 2026 |
| **CTR decay velocity** | Predictive fatigue = velocity of CTR decay + CPA creep | Not tracked | Atria, Motion |
| **Offer value equation** | (Dream outcome × Perceived likelihood) ÷ (Time delay + Effort) | NEUTRAL placeholder | Hormozi $100M Offers |
| **Long-running competitor ads** | 30/60/90+ days active ≈ profitable → mine for angles | No competitor data | Marpipe, AdLibrary.com |
| **Meta Ad Library API** | Graph API v21, ~$0.005/ad, no SaaS seat | Not integrated | Primores, Apify |
| **Core Web Vitals (landing)** | LCP <2.5s, INP <200ms, CLS <0.1 (2025 quality model) | Not measured | Apexure, NetPartners |
| **Message match** | Fastest single CRO fix; #1 cause of "below average" LP | Titan prose only | Apexure, NetPartners |

Net: the methodology AdPilot needs is well-established and quantified. V6 should **codify these thresholds** (with AUD/AU-English framing and propose-only safety) rather than re-derive them.

---

## 3. V6 roadmap — five features

Each feature: what it is, the data/inputs, the deterministic logic, how it ties to Stella/Titan/Paige, **Impact (client $)** and **Dev effort**. Impact scale: ⭐–⭐⭐⭐⭐⭐. Effort: S / M / L / XL.

---

### Feature A — Real creative-performance scorer + fatigue predictor
**Impact: ⭐⭐⭐⭐⭐ · Effort: L**

Replace the frequency-only `creative_freshness` proxy with a true per-creative scorer that answers three questions clients pay for: *which creative/angle is winning, which is dying, and when will it die.*

**New inputs (per-ad, read-only sync — already on the Wave B ad-level sync rewrite):**
- daily impressions, reach, 3s video views, ThruPlays / 25%+ views, clicks, spend, CPM, leads, purchases (last 14–30 days)
- creative launch date (→ creative age in days)
- creative metadata: format (image/video/carousel), UGC vs polished flag, angle tag, hook text

**Deterministic per-creative metrics (port from fatigue + testing-lab skills, validated above):**
- `hook_rate = 3s_views / impressions` → score band: ≥35% = 95, 30–35% = 80, 25–30% = 55, <25% = 25.
- `hold_rate = thruplays / impressions` → ≥50% = 95, 40–50% = 70, 25–40% = 50, <25% = 25.
- `ctr_decay_pct = (peak_7d_ctr − current_ctr) / peak_7d_ctr` → ≥25% fatigued, 15–24% at-risk.
- `frequency` (≥3 warn, ≥4 action), `cpm_wow` and `cpa_wow` (+20% flags), `creative_age` (≥30 at-risk, ≥60 fatigued).

**Two new engine outputs:**
1. **Creative score (0–100)** per ad = weighted blend of hook, hold (video), CTR, CTR-decay, frequency, age. Becomes the *real* input for `creative_freshness` (account factor = spend-weighted avg of per-creative scores) — finally using its full weight 8.
2. **Fatigue verdict** (Fatigued / At-risk / Healthy) + **days-to-fatigue forecast**: linear/EWMA projection of CTR-decay velocity vs the ~10-day Andromeda lifespan → "this winner is ~3 days from the refresh threshold; brief a replacement now." This is the predictive piece Atria/Motion charge for.

**Angle/winner analysis:** group ads by `angle` tag, rank by efficiency (CPA vs break-even, ROAS), surface **winning angle** + **losing angle** with confidence gated by the decision floor (≥50 clicks / ≥15 conversions). UGC vs polished scored *separately* (UGC benchmark is higher — don't penalise polished against UGC hook rates).

**Persona tie-in:** feeds Travis (TikTok hook/hold), Mira (Meta), and hands the winning angle + dying creatives straight to Stella (Feature C) and the recommender (Feature E).

**Why ⭐⭐⭐⭐⭐:** in the Andromeda era, creative is the dominant profit lever and refresh timing decides whether spend stays profitable. Catching fatigue 3 days early on a $15k/mo account routinely saves a multiple of the subscription. **Dependency:** needs Wave B ad-level sync (per-ad rows + video metrics) — sequence A right after Wave B lands.

---

### Feature B — Activate `offer_strength` + `landing_page_alignment` (structured diagnostic)
**Impact: ⭐⭐⭐⭐ · Effort: M (offer) + M/L (landing)**

Turn the two NEUTRAL placeholders into real, deterministic scores driven by structured intake. The methodology already exists in the two markdown templates; V6 wires them into the app + engine.

**B1 — Offer strength (port `offer-review-template.md`):**
- New `/offer-review` intake: 10 dimensions (Who-for, Core promise, Price clarity, Risk reversal, Urgency, Proof, Bonuses, CTA, Objections, Uniqueness), each scored 1–10 → **/100**.
- Mix of structured fields (Yes/No, dropdowns) + free text. Deterministic total maps straight to `offer_strength` (no AI needed for the score): Strong ≥80, Moderate 60–79, Weak <60.
- Optional **Titan AI assist**: from the free-text answers, Titan suggests scores + the Hormozi value-equation lens (lift Dream outcome × Likelihood; cut Time delay + Effort) and the "top 3 fixes before running ads." Paige gates any rewritten offer copy for claims/guarantee compliance (ACCC + platform).
- Engine: `factors.offer_strength = offerReviewTotal ?? NEUTRAL` (only override placeholder when a review exists; weight 5 already reserved). Fires a finding when <60 ("rebuild offer before scaling spend").

**B2 — Landing-page alignment (port `landing-page-review-template.md`):**
- New `/landing-review` intake: 10 sections (above-fold, message match, hero, proof, offer clarity, form/CTA friction, load speed, mobile, trust, tracking), each OK/Watch/Fix → numeric.
- **Semi-automatable signals** (read-only, no live edits): pull **PageSpeed Insights / Core Web Vitals** for the URL (LCP/INP/CLS vs <2.5s / <200ms / <0.1) and a **message-match check** (Titan/Stella compares ad headline+hook text to the LP `<title>`/H1 via WebFetch — read-only) → pass/partial/fail. These two are the highest-leverage CRO signals per the research and can be scored without manual entry.
- Engine: `factors.landing_page_alignment = lpReviewScore ?? NEUTRAL` (weight 4). Conversion-rate estimate vs AU industry benchmark surfaced in findings.

**Persona tie-in:** Titan owns both intakes; Paige gates offer/guarantee copy. Both scores flow into the existing health gauge — closing the "CPL is fine but sales are zero" blind spot the Titan persona was built for.

**Why ⭐⭐⭐⭐ at M effort:** the engine *already reserves 9% of the score* for these factors and currently wastes it on NEUTRAL. This is the highest impact-per-dev-hour item — the methodology is written, the weights exist, and it directly diagnoses the most common "good leads, no sales" failure mode.

---

### Feature C — AI creative generation + UGC briefs tied to winning angles (Paige-gated)
**Impact: ⭐⭐⭐⭐ · Effort: M**

Upgrade Stella from "generate copy from a blank form" to "generate the next round of winners *from the angle that's actually working*."

- **Angle-aware generation:** Stella's `/canva-creator` (and a new **UGC/script brief builder**) pre-fills from Feature A's *winning angle* + the dying creatives flagged by the fatigue predictor — closing the loop the system prompt already promises ("tied to the account's winning angles").
- **Creative matrix output:** given a winning angle, produce a structured test matrix — N hooks × M formats × CTA variants — each row labelled with the single variable changed (per creative-testing-lab: one variable per test) and a suggested hypothesis. Exports as the `creative-testing-matrix.csv` schema the skill already defines.
- **UGC brief builder:** structured brief (talent profile, hook line, shot list, b-roll, on-screen text, CTA, do/don't list, duration, aspect ratio) generated against the winning angle and platform (Travis-style for TikTok, Mira-style for Meta). Output is copy-paste-ready for a creator.
- **Compliance is mandatory, not optional:** every generated hook/script/offer line passes through **Paige** (`/api/policy/check` already exists) before display — pass/flag/fix + compliant rewrite. No earnings/absolute/guarantee claims; AUD/AU-English; honour the client context-pack's banned words.

**Why ⭐⭐⭐⭐:** this is the production engine that turns the scorer's diagnosis into client deliverables. Tying generation to *proven* angles (not guesses) is what lifts hit-rate; UGC briefs unlock the +31% hook / +33% CTR UGC advantage. Effort is M because Stella, the generate endpoint, and Paige already exist — this is mostly prompt/IO plumbing + the matrix/brief schemas.

---

### Feature D — Competitor / ad-library research
**Impact: ⭐⭐⭐ · Effort: M/L**

Give clients an "inspiration + angle-mining" surface using the **Meta Ad Library** (public, read-only, compliant).

- **Lookup by competitor page / keyword / category**, AU region. Surface **long-running ads** (active 30/60/90+ days ≈ proven winners) — the single strongest free performance signal.
- **Angle deconstruction:** Stella/Travis break each competitor ad into **hook · value prop · CTA · format · UGC-vs-polished**, then cluster recurring patterns across ~30–50 ads to reveal the category's dominant angles and pressure points (urgency/scarcity language frequency).
- **Gap analysis:** "angles competitors run that you don't" → feed directly into Feature E (what to test) and Feature C (generate them).
- **Access path:** Meta Ad Library API (Graph v21, ~$0.005/ad) for systematic pulls, or owner-supplied lookups. Strictly read-only and inspiration-only — guardrail: *never* instruct copying; propose original angles inspired by patterns. Note the library's limitation (inactive non-political ads vanish) so we don't over-promise historical depth.

**Why ⭐⭐⭐ / M-L:** high client-perceived value and great for sales demos, but it's *adjacent* to the owned-account revenue loop (A/B/C) and carries an external-API integration + cost/rate-limit + compliance-framing cost. Sequence after A/B/C.

---

### Feature E — "What to test next" recommender
**Impact: ⭐⭐⭐⭐ · Effort: M**

The connective tissue: a deterministic recommender that turns every other signal into a **prioritised, propose-only test backlog** — the question every paid-social operator asks Monday morning.

- **Inputs:** Feature A (winning/dying creatives, fatigue forecast, weak hook vs hold vs CTR), Feature B (weakest offer dimension, worst landing section), Feature D (untested competitor angles), plus account health weak factors.
- **Logic (port creative-testing-lab):** generate candidate tests, each as a one-variable hypothesis ("changing [hook] from X to Y will lift [hook_rate] by ≥[t]% because [reason]"), then **rank by ICE** (Impact × Confidence × Ease, 1–10 each). Confidence is data-gated by the decision floor (≥50 clicks / ≥15 conversions) and by which factor is weakest × its health weight, so the top recommendation is mathematically the biggest expected health/$ lift.
- **Output:** ranked backlog with, per test: hypothesis, variable, control, primary metric + threshold, required budget (break-even CPA × 15 conv) and 7–14 day read-out date, and a **paused-duplicate setup proposal** (never a live edit; requires typed-YES, Expert + `ADS_WRITE_ENABLED`).
- **Closes the loop:** "scale the winner / archive the rest" decision rule writes back to the creative-testing-matrix and re-prioritises next cycle.

**Why ⭐⭐⭐⭐:** converts diagnosis into a never-empty, ranked action queue — the retention and outcome driver. Effort M because it's deterministic orchestration over A/B/D outputs using rules the skill already specifies; Stella/Titan only narrate the top picks.

---

## 4. Prioritised sequencing (impact-per-effort)

1. **B — Activate offer_strength + landing_page_alignment** (M, ⭐⭐⭐⭐). Cheapest real win; reclaims 9% of the score wasted on NEUTRAL; methodology already written. Ship first.
2. **A — Creative scorer + fatigue predictor** (L, ⭐⭐⭐⭐⭐). The biggest revenue lever; gated on Wave B ad-level sync. Sequence immediately after Wave B.
3. **E — What-to-test recommender** (M, ⭐⭐⭐⭐). Thin orchestration layer once A + B emit structured outputs.
4. **C — Angle-aware generation + UGC briefs** (M, ⭐⭐⭐⭐). Turns diagnosis into deliverables; Paige-gated.
5. **D — Competitor/ad-library research** (M/L, ⭐⭐⭐). High demo value, external dependency; sequence last.

---

## 5. Guardrails & compliance (non-negotiable, applies to every feature)
- **Read-only / propose-only.** No live creative/offer/page is edited. Test setups are paused-duplicate *proposals*; any live write stays Expert-only + `ADS_WRITE_ENABLED` + typed-YES.
- **Paige is the mandatory gate** on all generated copy/offers/scripts — no earnings/absolute/guarantee claims; ACCC + Meta/TikTok policy; client context-pack banned words may only tighten.
- **AUD, Australian English, numbers-first, anti-hype.** No invented figures — if hook/hold/age data is missing, say so and say what to collect (decision floor respected before any keep/kill/scale).
- **Privacy / resale-clean.** Public business channels only; no personal email; no client URLs/form data stored beyond what's needed; competitor data is inspiration-only, never "copy this."

---

## Appendix A — Sources (web research, 2025–26)
- Segwise — Creative Effectiveness scoring 2026; Andromeda ~10-day lifespan; UGC +31% hook / +33% CTR: https://segwise.ai/blog/creative-effectiveness-scoring-guide-2026
- Billo — Hook rate → hold rate video metrics: https://billo.app/blog/hook-rate-to-hold-rate/
- GreatMarketing.ai — Hook/hold rate formula + benchmarks: https://www.greatmarketing.ai/blog/the-ultimate-guide-to-hook-rate-and-hold-rate-meta-ads
- AdLibrary.com — Hold rate benchmarks (>50% strong); Meta Ad Library competitor research: https://adlibrary.com/posts/hold-rate · https://adlibrary.com/meta-ads-library
- Atria — AI ad tools; predictive CTR-decay / CPA-creep fatigue: https://www.tryatria.com/blog/best-ai-ad-tools-for-creative-analysis
- Segwise — Motion alternatives (creative analytics landscape): https://segwise.ai/blog/motion-app-alternative-ad-creative-analytics
- Hormozi $100M Offers — Value equation (Dream outcome × Likelihood) ÷ (Time delay + Effort): https://github.com/Wh0FF24/grand-slam-offer-generator
- Marpipe — Facebook Ad Library + 2025 benchmarks: https://www.marpipe.com/blog/mastering-the-facebook-ad-library
- Primores — Meta Ad Library API (Graph v21, ~$0.005/ad): https://primores.org/blog/meta-ad-library-api/
- Apexure — Landing page CRO benchmarks + Core Web Vitals (LCP/INP/CLS): https://www.apexure.com/blog/how-to-improve-your-landing-page-quality-score
- NetPartners — 18-point CRO checklist (message match, speed, proof): https://netpartners.marketing/landing-page-optimization-tactics-2026-cro-conversion-checklist/

## Appendix B — Internal sources verified
- `adpilot-v2/lib/engine/audit.ts` (offer_strength/landing_page_alignment = NEUTRAL; freshnessScore = frequency-only), `lib/engine/health.ts` (weights), `lib/engine/types.ts`.
- `adpilot-v2/lib/agents/registry.ts` (Stella, Titan, Travis, Paige + GUARDRAILS).
- App routes: `/creative`, `/canva-creator`, `/content`, `/policy-check`, `/ai-specialists`; APIs `/api/ai/generate`, `/api/content/draft`, `/api/agents/run`, `/api/policy/check`.
- Skills: `creative-testing-lab`, `creative-fatigue-detector`, `offer-funnel-review`; templates `offer-review-template.md`, `landing-page-review-template.md`.
