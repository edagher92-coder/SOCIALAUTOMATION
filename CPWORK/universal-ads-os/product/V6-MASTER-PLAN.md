# AdPilot OS — V6 Master Plan ("generations ahead")

> The owner's mandate (2026-06-16): AdPilot is **for sale / revenue-making**. Keep the current
> course and **triple down**. Make it the **best in the world** at automating, evaluating,
> diagnosing — everything it sets out to do. Take the best of every comparable app and combine
> it. Add features that bring real impact + financial gain to clients, the owner, and developers.
> Fix the cluttered UI: a **Simple view** (straightforward, but still fully featured) and an
> **Advanced view** (checkpoints, layouts, customisation, upload/download for power users).
> This is **V6** — meant to feel true generations ahead of the field. It may take time; do it right.

## Operating rules for this effort
1. **Extended team autonomy.** Specialists + paired industry experts decide and act on everything
   EXCEPT the most important / high-level decisions, which escalate to the owner.
2. **Owner-gated, deferred to the end:** all costings/pricing and anything needing the owner's
   input are collected and put to the owner **just before upload**, not mid-flight.
3. **Phase-gated delivery.** Build in phases; every change verified (`tsc` + `vitest` + `next build`)
   and PM-signed-off before the next. After every MAJOR implementation, post the owner a brief:
   **what was done · why it helped · what it became · what could be better (or leave as-is).**
4. **Log everything.** Every stage + decision recorded in `V6-DECISION-LOG.md`.
5. **Back up + memory** before upload (memory file + decision log + GitHub/Drive).
6. **Read-only product invariant stays absolute** — never edits a live ad without typed-YES;
   resale-clean (grep guard); AU English/AUD; no faked legal/pricing.

## North star
"The single tool an operator or agency opens to know — in 10 seconds on Simple, or in
forensic depth on Advanced — exactly what their ads are doing to their money, what to do next,
and to have the safe work proposed/automated for them. Best-in-class at diagnostics, automation,
and explainability; generations ahead on UX and AI."

## Phase 0 — Research & Council (IN PROGRESS)
Expanded team (each specialist paired with an industry-expert lens), full autonomy, deep research
(web + internal `CPWORK/universal-ads-os/*` skills/MD + the live codebase). Each writes findings to
`product/v6-research/<stream>.md`. Workstreams:
1. Competitive intelligence & feature teardown (steal the best; find leapfrogs).
2. UX / dual-mode (Simple vs Advanced) — de-clutter, progressive disclosure, power-user surface.
3. Automation & orchestration depth.
4. Diagnostics & data science (anomaly/trend/forecast/attribution/creative-fatigue).
5. AI intelligence & evals (specialist team quality, orchestration, guardrail evals).
6. Creative & offer/CRO (client-revenue drivers).
7. Monetisation & packaging (impact + financial gain; numbers flagged for owner).
8. Architecture, scale & QA (support V6 without regressions).
Then **management (PMs)** converge the streams into the V6 phase roadmap below.

## Phase roadmap (converged 2026-06-16 — full detail in `V6-PHASE-ROADMAP.md`)
1. **P1 Foundations** — cron fan-out fix (parallelise + time-budget guard; stop the silent
   truncation), trend tables (`health_score_snapshots` + `account_daily_metrics`, migration 0021),
   telemetry, indexes, coverage gate. _Unblocks everything downstream._ ← **building first**
2. **P2 Dual-mode UX** — mode+plan-aware nav (5 Simple / ~12 Advanced), 10-second Simple Home,
   shared primitives + `<ModeAware>`, live "wasted-spend found". _(owner's #1 ask)_
3. **P3 Diagnostics** — `timeseries.ts` + `stats.ts`, significance-gated kill/scale, predictive
   creative fatigue (2–3 day lead), hook/hold decomposition, platform-vs-CRM gap; split
   `break_even_cpa`→`break_even_cpl` + CTR÷100 guard.
4. **P4 AI** — eval harness FIRST, then Command-Centre orchestration (Paige-gated), engine tool-use,
   structured grounding, model routing + prompt caching.
5. **P5 Automation** — configurable rules engine (rolling-baseline fixes false-CRITICAL),
   multi-channel delivery, two-way integrations, canonical LQS.
6. **P6 Creative/CRO** — activate offer/landing factors, Creative Scorecard, angle-aware
   generation, "what-to-test" recommender, benchmark percentiles.
7. **P7 Monetisation** — reverse-trial + annual, usage metering, deep white-label, add-ons,
   marketplace/partner program.

Cross-cutting (resolved): migrations number from **0021** (0012–0015 intentional gap); LQS canonical
= outcome table; eval harness ships before the AI it protects; trend data model in P1.

## Owner decision queue (collected; surfaced just before upload)
- Pricing/costings (AUD numbers per tier; any new paid features' prices).
- Solicitor Terms/Privacy text.
- Non-expiring Meta System User token for the real-account audit.
- _(append as they arise)_
