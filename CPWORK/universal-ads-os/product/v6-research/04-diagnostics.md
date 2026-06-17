# V6 Diagnostics Roadmap — Evaluating & Diagnosing Ad Accounts

> Owner: Diagnostics lead (Dana + Atlas + senior measurement DS).
> Scope: **READ-ONLY / analytical** upgrades only. Nothing here edits, pauses, creates, or
> spends on a live ad. Every output remains a numbers-first *proposal*; the human approves.
> Date: 2026-06-16. Web research: **available** (Meta/MMM/A-B-testing sources cited inline).
> AU English, AUD-default, anti-hype, decision-floor discipline retained throughout.

---

## 0. Where we are today (engine reality check)

What the live engine actually computes (verified against source):

- **Metrics** (`lib/engine/metrics.ts`): pure ratio formulas (CTR/CPC/CPM/CPL/CPA/ROAS/MER,
  frequency, hook/hold, conv-rate, break-even CPA/ROAS, blended CPA), zero-division → `null`.
  One anomaly guard only: `ROAS_ANOMALY_THRESHOLD = 20` (flags implausibly high ROAS as tracking).
- **Health** (`lib/engine/health.ts` + `audit.ts`): 13 weighted factors, N/A weight redistribution,
  band thresholds 80/60/40. Factors derived from a **single flat aggregate** of the window.
  `creative_freshness` is a proxy off **frequency only** (no CTR-decay, no creative age, no per-ad).
  `offer_strength` and `landing_page_alignment` are hardcoded `NEUTRAL = 70` placeholders.
- **Decisions** (`lib/engine/decisions.ts`): per-ad verdicts. Decision floor = `clicks ≥ 50 OR
  (purchases|leads) ≥ 15`. CTR-fatigue path exists but `ctrPeak` is **passed in by the caller**,
  not computed from history. `decide().safe` always true.
- **Pacing** (`lib/engine/pacing.ts`): pro-rata target, variance%, projected month-end, recommended
  daily delta. Bands ±10% Green / ±25% Amber / else Red. Solid, already time-aware (linear pro-rata).
- **Benchmarks** (`lib/agents/knowledge.ts`): prose ranges, **not** structured/queryable, **not**
  vertical-segmented numerically, **no percentiles**.

**The single structural fact that unlocks V6:** `campaign_snapshots` (migration 0001, extended by
0017) stores **one row per ad per day** — a genuine daily time series, ~30-day rolling from API
sync + arbitrary CSV history. **Today nothing reads it as a series.** `lib/cron/score.ts` collapses
the last 14 days into one aggregate; alerts aggregate by campaign with `max(frequency)`. Every
trend/forecast/anomaly capability below is *latent in data we already store* — it is an analytics
problem, not a data-collection problem. That is why the impact-to-effort ratio of V6 is unusually high.

V4 also added the *fields* fatigue/attribution work needs: `six_second_views`, `hook_rate`,
`hold_rate`, `comments/shares/saves`, `sales_count`, `gross_profit`, `ad_id`, budgets, full UTMs.
And `lead_events` (0018) + `org.monthly_budget` (0020) + `alert_events` (0019) give us the CRM,
budget, and alert substrate.

**Gap between docs and engine:** the markdown skills (`paid-ads-data-analysis`,
`creative-fatigue-detector`, `tracking-attribution-review`, `campaign-health-monitor`) already
*specify* the richer methods — 7-day CTR-peak refresh trigger, WoW CPM/CPA deltas, creative age
buckets, hook/hold thresholds, platform-vs-CRM gap ≤20%, scale gate (ROAS > BE×1.5 AND CPA < BE×0.7
AND health ≥70). **V6 is largely the act of teaching the engine what the playbooks already say.**

---

## (a) Time-series: trend / forecast / anomaly (now possible since daily snapshots exist)

The snapshot table is `(org, platform, ad_id, date)`-indexed. That index makes per-ad daily series
cheap to pull. New, **pure + testable** module proposed: `lib/engine/timeseries.ts` (mirrors the
zero-throw, null-safe style of `metrics.ts`/`pacing.ts`).

### Feasible now (ship in V6)

1. **Multi-window rolling aggregates & deltas.** For each metric (CTR, CPC, CPM, CVR, CPA, ROAS,
   frequency, spend) compute 1/3/7/14-day moving averages + the **WoW delta** (last-7 vs prior-7).
   This is exactly what 2026 fatigue tooling does — platforms "calculate moving averages and variance
   for CTR, CPC, and conversion rate over 1, 3, 7, and 14-day windows"
   ([Hawky AI](https://hawky.ai/blog/identify-fix-creative-fatigue-ads)). Directly powers the
   skill-documented but unimplemented "≥20% WoW CPM/CPA rise" and "CTR drop from 7-day peak" triggers.
   - *Impact: Very High. Effort: Low.* (pure reducers over rows we already pull.)

2. **Trend direction + slope (consecutive-day runs).** Flag "CTR falling N consecutive days while
   frequency climbing" — the canonical early fatigue signal: *"If CTR falls for five consecutive days
   while frequency climbs, creative fatigue is the likely cause"*
   ([Atria](https://www.tryatria.com/blog/meta-creative-fatigue-diagnose-and-fix-2026)). Implement as
   a sign-run counter + simple OLS slope (or Theil–Sen for robustness to spikes). No library needed.
   - *Impact: High. Effort: Low.*

3. **Anomaly detection (statistical, not just the single ROAS>20 guard).** Per ad/metric: rolling
   mean ± k·σ (robust variant: median ± k·MAD, k≈3) over the trailing window; flag points outside
   the band as spend spikes, CPA blowouts, tracking dropouts, or data-gap days. Generalises the lone
   `ROAS_ANOMALY_THRESHOLD` into a principled, per-metric, per-account-baseline detector. Also detects
   **missing days** (sync gaps) which currently silently distort the 14-day aggregate.
   - *Impact: High. Effort: Low–Medium.*

4. **Period-over-period account report ("vs last 7/30 days").** Sparkline arrays (last N values) +
   delta% for the dashboard and Riley's prose. Pure read.
   - *Impact: High (perceived product quality). Effort: Low.*

5. **Spend/spend-end forecast beyond pacing.** Pacing already projects month-end linearly. Add a
   trailing-7-day run-rate projection (already half-built in `score.ts`) and surface a confidence
   band from observed daily variance. Optionally Holt linear (double-exp smoothing) for trended spend.
   - *Impact: Medium. Effort: Low (run-rate) / Medium (Holt).*

### Research-grade (V6.5+, gate carefully)

6. **CPA/ROAS forecast with uncertainty (e.g. Holt-Winters / lightweight Bayesian state-space).**
   Useful but small accounts have too few daily conversions for stable seasonality; risk of
   false precision. Ship only with wide, honestly-labelled intervals. *Impact: Medium. Effort: High.*

> **Design note:** keep all of this deterministic and unit-testable against fixtures, like the
> existing parity tests. No ML model files in the shippable tree. Seasonality (weekday effects) can
> be handled by always comparing 7-day windows (same weekday composition) rather than fitting a model.

---

## (b) Creative-fatigue prediction + hook/hold analytics

Today: `creative_freshness` = a frequency lookup; per-ad `decide()` needs a caller-supplied `ctrPeak`.
The data to do this *properly per ad over time* is all present (`ad_id`+`date`, `three_second_views`,
`six_second_views`, `hook_rate`, `hold_rate`, `frequency`, `ctr`).

### Feasible now

7. **Per-ad fatigue score (0–100) from a weighted signal stack**, computed from the ad's own daily
   series — implementing the `creative-fatigue-detector` skill verbatim:
   - frequency: ≥3.0 at-risk, ≥4.0 fatigued (web confirms: decline above weekly freq **2.5**, cliff
     past **4.0**, and a Meta study shows **45% CTR drop after 4 repetitions**
     ([Atria](https://www.tryatria.com/blog/meta-creative-fatigue-diagnose-and-fix-2026))).
   - CTR drop ≥25% from trailing 7-day peak (now computable internally → kill the `ctrPeak` hack).
   - WoW CPM rise ≥20% with no audience change; WoW CPA rise ≥20% + rising frequency.
   - creative age buckets: <14d fresh / 14–30 watch / 30–60 at-risk / ≥60 fatigued-regardless.
     (Derive "age" from first `date` we see the `ad_id`, or first non-zero impressions day.)
   - *Impact: Very High. Effort: Medium.*

8. **Hook/hold analytics as first-class diagnostics** (currently formulas exist, never scored).
   - Hook rate (3s ÷ impressions): TikTok target ~35%; doc band <0.15 weak / 0.15–0.30 avg / >0.30
     strong. Hold rate (6s ÷ 3s) target ~45%.
   - **Diagnostic decomposition:** low hook → first ~1.7s problem (thumb-stop/sound-off design);
     good hook + low hold → body/pacing problem; good hook+hold + low CTR → CTA/offer problem;
     good through-funnel + low CVR → landing-page problem. This turns one CTR number into a
     *located* failure — a genuine best-in-class diagnostic the engine doesn't yet do.
   - *Impact: Very High. Effort: Medium.*

9. **Early-warning fatigue prediction (2–3 day lead).** The strongest 2026 signal: *"A video ad
   maintaining 4% CTR but losing 30% average view duration indicates creative fatigue before CTR
   begins declining, providing 2-3 days advance warning"*
   ([Hawky AI](https://hawky.ai/blog/identify-fix-creative-fatigue-ads)). We can approximate
   view-duration decay via **falling hold_rate while CTR still flat** + rising frequency → "fatigue
   predicted in ~2–3 days, queue refresh now". Predictive, not just reactive.
   - *Impact: Very High (this is the headline diagnostic). Effort: Medium.*

10. **Refresh-cadence recommender.** Given daily spend + audience size, propose new-creative cadence
    (skill: ~1 new creative / 10–14 days at scale; TikTok 7–14d; faster than Meta). Output is a
    paused-duplicate proposal — stays read-only. *Impact: Medium. Effort: Low.*

> All proposals route through the existing `refresh` verdict → "build 3–5 fresh variants as PAUSED
> duplicates; original untouched." No behaviour change to the safety contract.

---

## (c) Statistical rigor — confidence on keep / kill / scale

Today there's a single hard floor (`clicks ≥ 50 OR conv ≥ 15`) and binary `insufficient-data`.
Best-in-class diagnosis quantifies *how sure* we are and **never recommends a kill/scale on noise.**

### Feasible now

11. **Confidence intervals on rate metrics.** Wilson score interval for CTR and CVR (binomial,
    correct at low counts where the normal approximation fails — exactly our small-account regime).
    For CPA/ROAS, report a range via the conversion-count CI propagated to cost-per. Surface as
    "CPA $42 (likely $34–$58)". *Impact: High. Effort: Low–Medium.*

12. **Significance-gated kill/scale verdicts.** Before `kill` (CPA > 1.5×BE) or `scale`, require the
    estimate's CI to clear break-even, not just the point estimate. Prevents the classic error of
    killing a winner on a noisy fortnight. Bayesian framing is more honest and supports the continuous
    daily monitoring we now have: express as **"83% probability this ad's true CPA is above
    break-even"** — *"Bayesian testing allows continuous monitoring; frequentist requires fixed sample
    sizes"* and *"stopping tests early can inflate false positive rates from 5% to 30%"*
    ([Convertize](https://www.convertize.com/ab-testing-statistics/)). This is the right guard against
    early-stop bias when crons evaluate daily.
    - *Impact: Very High (accuracy + trust). Effort: Medium.*

13. **A/B significance for creative tests.** Beta-binomial posterior P(B>A) for CTR/CVR between two
    ads/creatives in the same adset; report "need ~N more conversions to call it." Implements the
    `creative-testing-lab` intent with real maths. *Impact: High. Effort: Medium.*

14. **Data-confidence as a continuum, not a step.** Replace the 3-tier `dataConfScore` with a
    smooth function of CI width / observed conversions, feeding both the health factor and a visible
    "diagnosis confidence" badge on every verdict. *Impact: Medium. Effort: Low.*

> Library-light: Wilson, Beta-binomial, and normal-approx CIs are ~30 lines of pure TS each; keep
> them in `lib/engine/stats.ts`, parity-tested like the rest. No runtime ML dependency.

---

## (d) Attribution / incrementality-lite + MER / blended views

`mer()` exists in metrics but **isn't surfaced** in `analyse()` summary beyond a raw ratio, and there's
no blended/cross-platform or platform-vs-CRM reconciliation. `lead_events` now gives us backend truth.

### Feasible now

15. **MER & blended ROAS panel (account + portfolio).** MER = total revenue ÷ total ad spend across
    all platforms; blended ROAS for the ad-attributed portion. Track MER **weekly** as the north-star
    sanity check on platform-reported ROAS (*"Blended ROAS: the ratio every operator should track
    weekly"* — [adlibrary](https://adlibrary.com/posts/blended-roas)). Note the MER-vs-blended-ROAS
    distinction (email/SMS revenue sits in MER numerator but outside blended ROAS). *Impact: High. Effort: Low.*

16. **Platform-vs-CRM reconciliation gap.** Compare platform `purchases`/`revenue` to `lead_events`
    sale outcomes for the same window; flag **>20% gap** either direction (the
    `tracking-attribution-review` threshold). A widening gap is the single most actionable tracking
    diagnostic and directly feeds `tracking_quality`. *Impact: Very High. Effort: Medium.*

17. **Attribution-model sensitivity note (read-only).** We can't run true multi-touch, but we *can*
    show "platform claims X conversions on 7-day-click/1-day-view; your CRM recorded Y" and label the
    attribution windows (Meta 7d-click/1d-view, TikTok 7d-click). Honest, no false MTA precision.
    *Impact: Medium. Effort: Low.*

### Research-grade (label clearly; expert-tier)

18. **Incrementality-lite via geo holdout.** Geo holdouts work from **$5–10k/month** and give
    directional lift even without formal lift studies
    ([Adligator](https://adligator.com/blog/incrementality-testing-media-mix-modeling-facebook-ads)).
    V6 can *design + read* a holdout (split regions, compare conversion rates, report observed lift +
    CI) without ever touching spend allocation autonomously. *Impact: High (for expert tier). Effort: High.*

19. **MMM-lite (marginal contribution by channel).** Regression of conversions on per-channel spend
    with adstock/diminishing-returns terms; 2026 consensus is **pure regression must be calibrated by
    a geo-lift "ground truth"** or it misleads
    ([SegmentStream](https://segmentstream.com/blog/articles/best-mmm-software-tools)). Most AdPilot
    accounts are single-to-few channel and under the data volume MMM needs — **recommend NOT shipping
    full MMM**; offer only "diminishing-returns / saturation curve per campaign" as a lighter,
    defensible proxy. *Impact: Medium. Effort: Very High / research-grade.*

---

## (e) Vertical benchmark percentiles

Today benchmarks are prose ranges in `knowledge.ts`, not queryable, not percentile-based, not
numerically segmented by vertical/objective. Best-in-class diagnosis says "your 1.1% CTR is **34th
percentile for finance lead-gen on Meta**," not "CTR is a bit low."

### Feasible now

20. **Structured benchmark table** `lib/engine/benchmarks.ts`: `{platform, vertical, objective,
    metric} → {p10,p25,p50,p75,p90}` for CTR/CPC/CPM/CPA/CVR/ROAS. Seed from 2026 data:
    all-industry Meta CPM ~$14.19, CPC ~$0.78, CPA ~$38.19; CTR median ~1.55%, CVR ~8.2%; CPC range
    **$0.45 apparel → $3.77 finance**; lead-gen CTR ~2.59%; sales CPM $20–30, ROAS ~2.79; ecommerce
    CPM ~$16.80 ([get-ryze](https://www.get-ryze.ai/blog/meta-ads-cost-benchmarks-by-industry-2026),
    [AdAmigo](https://www.adamigo.ai/blog/meta-ads-conversion-rate-benchmarks-industry-2026)). TikTok:
    CPM ~$5–9, in-feed CTR ~0.6–0.85%, CVR ~0.5–1.9% (existing knowledge baseline).
    *Impact: High. Effort: Medium (mostly data curation).*

21. **Percentile rank in findings + health factors.** Re-anchor `ctrScore`/`convRateScore` to the
    *vertical* percentile instead of fixed global cutoffs, so a "good" finance CTR isn't punished
    against an ecommerce yardstick. Surface percentile in every relevant finding. *Impact: High. Effort: Medium.*

22. **Self-benchmarking (account-relative percentiles).** As history accumulates, rank each ad against
    the account's *own* distribution — robust when no public vertical match exists, and immune to
    benchmark staleness. *Impact: Medium. Effort: Low.*

> AU caveat: published benchmarks are US-skewed; label them as ranges, prefer self-benchmarking for
> AUD accounts, and keep the anti-hype "these vary by geo/season" framing already in `knowledge.ts`.

---

## (f) Feasible-now vs research-grade — verdict

| # | Upgrade | Impact | Dev effort | Class |
|---|---|---|---|---|
| 1 | Rolling windows + WoW deltas (`timeseries.ts`) | Very High | Low | **Ship** |
| 2 | Trend slope + consecutive-day runs | High | Low | **Ship** |
| 3 | Statistical anomaly (median±MAD, gaps) | High | Low–Med | **Ship** |
| 4 | Period-over-period sparklines | High | Low | **Ship** |
| 5 | Run-rate spend forecast + variance band | Medium | Low | **Ship** |
| 6 | Holt-Winters CPA/ROAS forecast | Medium | High | Research |
| 7 | Per-ad fatigue score (signal stack) | Very High | Medium | **Ship** |
| 8 | Hook/hold funnel decomposition | Very High | Medium | **Ship** |
| 9 | Early-warning fatigue (hold-decay, 2–3d lead) | Very High | Medium | **Ship (headline)** |
| 10 | Refresh-cadence recommender | Medium | Low | **Ship** |
| 11 | Wilson CIs on CTR/CVR; ranges on CPA/ROAS | High | Low–Med | **Ship** |
| 12 | Significance-gated kill/scale (Bayesian prob) | Very High | Medium | **Ship** |
| 13 | Beta-binomial creative A/B significance | High | Medium | **Ship** |
| 14 | Continuous data-confidence | Medium | Low | **Ship** |
| 15 | MER + blended ROAS panel | High | Low | **Ship** |
| 16 | Platform-vs-CRM gap (>20%) | Very High | Medium | **Ship** |
| 17 | Attribution-window sensitivity note | Medium | Low | **Ship** |
| 18 | Incrementality-lite geo holdout | High | High | Research / Expert |
| 19 | MMM-lite marginal contribution | Medium | Very High | **Don't ship full** (saturation-curve proxy only) |
| 20 | Vertical benchmark percentile table | High | Medium | **Ship** |
| 21 | Percentile-anchored health factors | High | Medium | **Ship** |
| 22 | Account-relative self-benchmarking | Medium | Low | **Ship** |

**Principles to preserve:** read-only/proposal-only; `decide().safe` stays true; null-safe pure
functions; parity-tested against fixtures; honest uncertainty (intervals + confidence badges, never
false precision); AU English / AUD; anti-hype; benchmarks labelled as ranges; no ML files in the
shippable tree; no private business data.

**Sequencing:** (1) build `timeseries.ts` + `stats.ts` foundations → (2) per-ad fatigue + hook/hold
+ early-warning (the differentiator) → (3) significance-gated verdicts + CRM gap (the accuracy fixes)
→ (4) benchmark percentiles → (5) gate incrementality/MMM behind expert tier + explicit research flag.

---

## The single biggest accuracy win

**Read `campaign_snapshots` as a per-ad daily time series and gate every kill/scale/refresh verdict
on it.** Two compounding effects:

1. It eliminates the most damaging current error class — verdicts made on a **flat 14-day aggregate**
   that hides trend, fatigue, and statistical noise (e.g. killing an ad on a bad week, scaling one
   that's already decaying, or refreshing too late). Replacing the caller-supplied `ctrPeak` hack
   with a real trailing-7-day peak, plus significance-gated (Bayesian-probability) kill/scale, is the
   accuracy upgrade with the highest impact-to-effort ratio in the whole roadmap.
2. The data already exists and is indexed for it (`(org, platform, ad_id, date)`), so this is pure
   analytics — no new ingestion, no schema change, no live-write risk.

The headline *product* differentiator riding on the same foundation is **predictive creative fatigue
(item 9): falling hold-rate while CTR is still flat ⇒ "fatigue in ~2–3 days, queue a refresh now"** —
catching decay before it shows up in CTR, which is what best-in-class 2026 tooling does.

---

### Sources
- Atria — Meta creative fatigue diagnose & fix 2026: https://www.tryatria.com/blog/meta-creative-fatigue-diagnose-and-fix-2026
- Hawky AI — identify/fix creative fatigue: https://hawky.ai/blog/identify-fix-creative-fatigue-ads
- Convertize — practical guide to A/B testing statistics 2026: https://www.convertize.com/ab-testing-statistics/
- adlibrary — blended ROAS 2026: https://adlibrary.com/posts/blended-roas
- Adligator — incrementality testing & MMM for Facebook ads 2026: https://adligator.com/blog/incrementality-testing-media-mix-modeling-facebook-ads
- SegmentStream — best MMM software/tools 2026: https://segmentstream.com/blog/articles/best-mmm-software-tools
- get-ryze — Meta ads cost benchmarks by industry 2026: https://www.get-ryze.ai/blog/meta-ads-cost-benchmarks-by-industry-2026
- AdAmigo — Meta conversion-rate benchmarks by industry 2026: https://www.adamigo.ai/blog/meta-ads-conversion-rate-benchmarks-industry-2026
- Measured — platform ROAS to true incrementality: https://www.measured.com/faq/leveling-up-media-measurement-the-performance-marketers-journey-from-platform-roas-to-true-incrementality/

*Internal sources: `adpilot-v2/lib/engine/{metrics,health,audit,decisions,pacing,schema,types}.ts`;
`lib/agents/knowledge.ts`; `supabase/migrations/{0001,0017,0018,0019,0020}`;
`CPWORK/universal-ads-os/api/data-schema.md`; skills `paid-ads-data-analysis`,
`creative-fatigue-detector`, `tracking-attribution-review`, `budget-pacing-monitor`,
`campaign-health-monitor`.*
