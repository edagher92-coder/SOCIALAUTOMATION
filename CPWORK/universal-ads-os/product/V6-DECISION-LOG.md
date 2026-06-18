# AdPilot OS — V6 Decision & Stage Log

Running log of every stage + decision in the V6 effort (newest at bottom). Owner-gated items are
collected in V6-MASTER-PLAN.md → "Owner decision queue" and surfaced just before upload.

> **CURRENT STATE (2026-06-17) — read this first, then skip to the bottom for live detail**
> - **V6 shipped & merged** to `main` via PR #22 (merge `c8617eb`).
> - **484 tests** green; every commit verified `tsc` + `vitest` + `next build`; CI now also runs
>   a typecheck step + a resale-clean guard (lockfile is gitignored, so CI uses `npm install`).
> - **Delivered:** dual-mode UX, tier differentiation + wired AUD pricing, engine upgrades (Wilson
>   significance gate, break-even-CPL split, diagnostics modules), AI cost routing (caching + Haiku),
>   Next 16/React 19 migration, right-to-erasure, connect trust chips + one-click first audit,
>   DRAFT legal frameworks (two-partner reviewed), render-quality sales mockups, board skills review.
> - **Top open items (owner-gated):** Stripe price IDs · solicitor legal sign-off · non-expiring Meta
>   token · `ADS_WRITE_ENABLED` stays OFF for launch · prod Vercel env + Supabase migrations 0001–0023.
> - **Log hygiene rule:** when this file passes ~500 lines or a new major version starts, roll closed
>   phases into `V6-DECISION-LOG-ARCHIVE.md` and keep only open/recent here.

---

## 2026-06-16 — V6 mandate received
- Owner confirmed: AdPilot is for sale / revenue-making. Keep course, **triple down**. Goal = best
  in the world at automating/evaluating/diagnosing; take the best of comparable apps; add
  revenue-driving features; fix clutter via Simple + Advanced views; "generations ahead"; phased;
  log everything; brief after each major phase; defer costings/owner-input to just before upload.
- Decision: adopt the **V6** label (leap from the just-shipped v4 to signal generational scope).
- Decision: prior plan stays valid — v4 (PR #22) is the base; V6 builds on it.

## 2026-06-16 — Phase 0 kicked off (deep-research council)
- Launched the expanded research team (specialist + industry-expert pairings) on 8 workstreams,
  full autonomy, persisting findings to `product/v6-research/*.md`.
- Next: management (PMs) converge the streams into the V6 phase roadmap; owner gets the Phase-0 brief.

## 2026-06-16 — Phase 0 COMPLETE (council + management convergence)
- All 8 research streams delivered (web research was available; live 2026 sources cited). Files
  committed under `product/v6-research/01–08`.
- Management converged into **7 sequenced phases** → `V6-PHASE-ROADMAP.md` (also summarised in the
  master plan). Recommended Phase 1 = **Foundations** (cron-queue silent-failure fix + trend tables).
- Cross-cutting decisions recorded: migrations resume at **0021** (0012–0015 never created — left as
  an intentional gap, not backfilled); **LQS** canonical source = the outcome/lead_events table;
  **split `break_even_cpa`→`break_even_cpl`** (+ CTR÷100 guard) scheduled in P3; **eval harness**
  ships in P4 before the AI changes it guards; trend data model lands in P1.
- Owner Decision Queue: ~23 items (all deferred to pre-upload). Top 3: base AUD prices + hybrid
  model allowances; green-light (or not) the auto-execute "controlled middle" (typed-YES queued
  proposals only); non-expiring Meta System User token for the real-account audit/unattended jobs.

## 2026-06-16 — Phase 1 (Foundations) STARTED
- Beginning with the #1 scale risk: the auto-sync cron fan-out (sequential, unqueued, >60s at ~10
  orgs, fails silently). Implemented on the live branch (has all Wave A/B work), not a worktree
  (worktree base predates Wave A/B and would clobber score.ts/auto-sync).
- ✅ DONE — cron fan-out fix: bounded org concurrency (4) + per-org parallel platform pulls + 50s
  time-budget guard that DEFERS the remainder and reports `deferred/truncated/durationMs` (+ loud
  console.error). All cadence/partial-failure/auth-disconnect semantics preserved. 432 tests green.
  Decision: worktree agents branch from pre-Wave-A `main`, so V6 phases touching already-modified
  files (score.ts, cron, engine) are done on-branch, not via worktree, to avoid clobbering.
- NEXT in P1: trend data model (index health_scores for time-series; add account_daily_metrics) +
  the missing indexes the architecture stream flagged (migration 0021).
- ✅ DONE — trend data foundation: migration `0021_trend_data` (health_scores time-series index +
  `account_daily_metrics` rollup, RLS-read/service-write) + score.ts upserts the daily rollup
  (additive, best-effort). 432 tests green.

## 2026-06-16 — Phase 1 (Foundations) COMPLETE
- Shipped: cron fan-out fix (no more silent truncation) + trend data model/indexes + daily rollup.
- Telemetry partially delivered (cron now returns deferred/truncated/durationMs). Deferred to a
  later pass (non-blocking): a hard vitest coverage-threshold gate (risks CI friction now) and the
  full Sentry/queue (QStash/Inngest) — scheduled for when org volume grows.
- All P1 work on-branch (PR #22), green, pushed. NEXT: **Phase 2 — Dual-mode UX** (owner's #1 ask).

## 2026-06-16 — Phase 2 (Dual-mode UX) STARTED
- ✅ DONE — mode+plan-aware nav (the core de-clutter): nav items carry optional `advanced`/`feature`
  metadata; Sidebar filters by mode (Simple hides advanced items + drops descriptions) AND plan
  (locked items hidden); empty groups collapse; plan flows layout→AppShell→Sidebar. Reused the
  existing mode toggle + `can(plan,feature)`. 432 tests, build green (65 pages).
- NEXT in P2: Simple 10-second Home (score + money-impact + 3 fixes + 1 CTA), formalised
  `<ModeAware>`/`<FeatureGate>` primitives, lite Settings, optional Cmd-K palette for the long tail.
- ✅ DONE — `<ModeAware>` primitive (components/ModeAware.tsx) + mode toggle relabelled Simple/Advanced.
- ✅ DONE — Simple-mode Command Center: hero (score+band+verdicts) + "Needs your attention" stay;
  detail right-rail wrapped in `<ModeAware only="advanced">`. 432 tests, build green.

## 2026-06-16 — Phase 2 (Dual-mode UX) CORE COMPLETE
- Shipped: mode+plan-aware nav declutter (24→~6 in Simple, plan-filtered); ModeAware primitive +
  Simple/Advanced labels; Simple-mode Command Center (10-second answer). The owner's #1 ask is met.
- Deferred P2 polish (non-blocking, later increment): Cmd-K command palette for the long tail;
  lite Settings; a live "wasted-spend found" headline figure on Simple; full-width attention column
  in Simple. NEXT PHASE: **P3 — Diagnostics** (timeseries.ts/stats.ts on the new account_daily_metrics,
  significance-gated verdicts, predictive creative fatigue; split break_even_cpa→break_even_cpl).

## 2026-06-16 — Phase 3 (Diagnostics) IN PROGRESS — engine foundations shipped
- lib/engine/timeseries.ts (+7 tests): mean/median/MAD, slope, moving avg, WoW delta, robust
  anomaly detection (median +/- MAD), trend, summariseSeries — over the daily series.
- lib/engine/stats.ts (+5 tests): Wilson intervals + confidentlyAbove/Below + rateConfidence —
  for significance-gated verdicts (scale only when lower bound beats target; kill only when upper
  bound below; else hold).
- lib/engine/fatigue.ts (+5 tests): predictFatigue -> healthy/watch/fatigued + days-to-fatigue;
  leading signal = hold-rate decaying while CTR still holds. 449 tests total, green.
- NEXT in P3 (careful, touches existing-tested code): wire significance into decisions.ts kill/scale
  gating; split break_even_cpa -> break_even_cpl (+ CTR/100 guard); surface trend + fatigue on the UI.

## 2026-06-16 — Tier differentiation: visible-but-locked (owner ask, PM-approved)
- Owner: clearly differentiate the 3 paid tiers; show features LOCKED (not hidden) to entice upgrades.
- PM panel APPROVED-WITH-CHANGES; reconciled with the P2 declutter: mode-gate = hard hide (Simple
  stays calm); plan-gate = show-but-locked in ADVANCED only.
- Implemented: AppShell renders locked nav items muted with a 🔒 + required-tier badge linking to
  /billing; new PlanMatrix (Free/Starter/Pro/Expert × features, driven by PLANS+entitlements) on
  /billing + landing; featuresFor() helper + coherence test. Prices stay owner-gated. 453 tests green.

## 2026-06-16 — Council round: per-tier features + GUI + data-training consent
- Owner: team + management debate features for each of the 3 paid tiers (Starter/Pro/Expert) —
  new / upgrade / remove; only genuinely useful, app-true features that ease BOTH back-end (us) and
  client work. GUI implementation is the priority ("nail the GUI/UX"). Loop to consensus. Use the
  competitor scans + v6-research. ALSO: add a Terms clause permitting use of client data to improve
  + train the model (more efficient/effective) — privacy-sensitive, compliance-led, placeholder+solicitor.
- Launched 4 council streams (write to product/v6-tiers/*.md) → management converges to an agreed
  per-tier plan + GUI roadmap; then implement (data-consent clause first, it's discrete).

## 2026-06-16 — Security/Privacy + Efficiency hardening pass (recruited cyber + privacy officers)
- Owner: scan for efficiency savings (tokens/credits/back-end resources), refine all code, report %
  savings (efficiency/speed/security/privacy). Data-breach prevention is KEY. Recruit safety &
  compliance + cyber-security experts (not properly staffed before). Loop until concluded AND executed.
- Note: repo Dependabot flagged 15 vulns (1 critical/5 high/7 moderate/2 low) at session start — this
  pass quantifies + remediates. Launched 4-expert audit fleet (cyber, privacy/breach, AI-token-cost,
  back-end-resource); read-only analysis → findings files; management converges → I execute safe wins.

## 2026-06-16 — Connect/automation council DONE + hardening-pass true state (honest checkpoint)
- Connect council (both streams in, committed): front = 4-step guided wizard, read-only-forward,
  first-score payoff card, ModeAware Simple/Advanced; back = token-lifecycle (refresh short->long,
  use the existing-but-unused platform_tokens.expires_at), retry/backoff fetch wrapper, incremental
  pull window (upsert vs delete+reinsert), and HMAC-signed OAuth state (top safety hardening; state
  is currently plaintext base64 compared with !==). Front-end clarity fix already SHIPPED (connect page).
- CORRECTION to the privacy audit: its "PII_PEPPER P0" is a FALSE POSITIVE — lib/pii.ts already
  fails closed in production (pepper() throws when empty; sha256Hex calls pepper(), not the raw
  default). Verified in code. NO change made. (Verify findings before acting.)
- Also: earlier in-chat I misstated that a "hardening batch" was live — it was NOT; only audit
  FINDINGS were committed. No hardening code has been executed yet. Correcting the record here.
- Security/efficiency audits: AI-cost + privacy IN; cyber-security (the 15 Dependabot vulns + attack
  surface) + back-end-efficiency STILL RUNNING.

### Planned execution sprint (verified-safe first; each its own tested commit)
SAFE-AUTOMATIC: sync retry/backoff wrapper (lib/sync/fetch.ts) · incremental pull window ·
maxTokens right-size · non-breaking dependency bumps (pending cyber audit list) · connect
read-only/auto-sync UI chips + first-score card.
NEEDS-CARE (own commits, tested): prompt caching (claude.ts) ~25-30% token cut · HMAC-signed OAuth
state · right-to-erasure deletion job (the REAL privacy P0) · tier feature keys + data-consent clause.
OWNER-GATED: prices · auto-execute green-light · Meta System User token · solicitor legal text.

## 2026-06-16 — Dependency-vuln triage (executed: npm audit; honest result)
- Ran `npm audit`: 10 vulns (1 critical / 6 high / 3 moderate) — ALL in Next.js 14 (+ its postcss dep):
  CSP-nonce XSS, RSC cache poisoning, beforeInteractive XSS, image-optimization DoS, WebSocket-upgrade
  SSRF, Pages-Router i18n middleware bypass. The ONLY remediation is `npm audit fix --force` ->
  next@16 (MAJOR breaking change). NO safe non-breaking fix. Did NOT run --force (would break the app).
- Applicability triage (real exposure < raw severity): no next/image (image-DoS N/A); App Router +
  no i18n config (Pages-Router bypass N/A); no CSP nonces (nonce-XSS N/A — only a crypto nonce in
  data-deletion). Residual: RSC cache poisoning + WebSocket-upgrade SSRF + beforeInteractive XSS — limited.
- DECISION: remediate via a PLANNED, fully-tested Next 14->16 migration (own dedicated effort; App
  Router API changes + re-test 65 routes). Top dependency-security item. NOT rushed at depth.

## 2026-06-16 — EXECUTED: Next.js 14->16 + React 19 security migration (owner chose this first)
- Upgraded next 14.2.35 -> 16.2.9, react 18 -> 19, eslint 8 -> 9. Used @next/codemod
  next-async-request-api (8 page files). Fixed cookies() async (supabase/server kept sync via async
  cookie callbacks; lib/org awaited) + 2 route tests (params -> Promise.resolve).
- RESULT: production audit 10 vulns (1 crit/6 high/3 mod) -> 2 MODERATE (build-time postcss only).
  ALL critical + high PRODUCTION vulns eliminated. Remaining dev-only (vitest/vite/esbuild).
- Verified: tsc clean, 455 tests, next build green (65 routes). Committed 9c0434f, pushed.
- WATCH: first Vercel build on Next 16 (a framework major can differ from local build).
- Note: Next 16 renames the middleware label to "Proxy" in build output (cosmetic).

## 2026-06-16 — EXECUTED: prompt caching (AI efficiency) + Next 16 build hygiene
- claude.ts cacheSystem option (cache_control:ephemeral on the system block); agents/run moves the
  static prefix (persona + knowledge + context pack) into the cached system, volatile grounding +
  question stay in the user message. Repeat same-specialist calls reuse the prefix at ~10% input
  cost — audit est. ~25-30% blended token/credit saving on the AI specialist team.
- (app)/layout force-dynamic: Next 16 was erroring on static prerender of cookie-reading pages
  (non-fatal fallback, but noisy/wasteful) — one segment-level line fixed all of them.
- Verified: tsc clean, 455 tests, next build clean (0 dynamic-server errors). Pushed.
- Still queued: right-to-erasure deletion job (privacy P0, destructive — awaiting owner go-ahead);
  Haiku routing for light assistants; dev-dep audit cleanup (vitest v3); tier features + data-consent.

## 2026-06-16 — EXECUTED: right-to-erasure job + data-use/training consent clause
- Right-to-erasure (privacy P0 #2): lib/erasure.ts eraseUserData(admin,userId) scoped to caller's
  own data — sole-member orgs deleted (FK cascade), shared orgs preserved (membership-only removal),
  user rows + auth identity removed. POST /api/account/erase (session-auth + typed confirm, scrubbed
  errors). 3 scoping tests. 458 tests green, build clean.
- Data-use/model-training consent: Terms §7 + Privacy §7 placeholder clauses (DRAFT banner intact)
  encoding the guardrails (de-identified/aggregated only, tenant-isolated, lead PII excluded, opt-out,
  erasure honoured). Fulfils the owner's earlier T&C ask. Solicitor finalises the binding text.
- STATUS: both privacy P0s closed (Next 16 + erasure); efficiency (prompt caching) done; data-consent
  done. REMAINING V6 build (specced/agreed, queued): tier feature keys + their features/GUI; diagnostics
  UI wiring (significance into decisions, trend/fatigue cards, break_even_cpl split); connect wizard
  builds; Simple-Home money strip; Haiku routing; dev-dep audit cleanup (vitest v3).

## 2026-06-17 — EXECUTED: build-tail batch (Simple-Home money, connect chips, AI cost routing)
- Simple-Home money-at-stake: command/page hero now shows the latest audit's spend + CPA vs
  break-even straight from the saved report payload summary (honest figures only — no fabricated
  "wasted spend"); coloured chip flags CPA above / at-or-below break-even; hidden until a report exists.
- Connect-wizard trust + onboarding: reusable ReadOnlyBadge ("never edits your ads") + AutoSyncStatus
  (cadence + last-pull age) chips on Connect; first-score onboarding card (run-a-sync CTA or
  view-your-score link once a healthy account is connected). Connect data fetch parallelised.
- AI back-end cost routing: MODELS (light/standard/deep) + modelFor() with ANTHROPIC_MODEL pin
  override; ai/generate + content/draft (light templated creative) routed to Haiku; messenger bot
  AI_MODEL now references the shared constant. Grounded specialists + policy checker stay on Sonnet.
  +3 routing tests. Est. light-route token cost down ~60-75% vs Sonnet at similar quality for these tasks.
- Verified each: tsc clean, 461 tests green, next build clean. Pushed (PR #22).
- REMAINING tail: tier feature keys + their features/GUI; diagnostics surfacing (significance/fatigue
  into decisions, break_even_cpl split); dev-dep audit cleanup (vitest v3). Owner-gated: AUD prices,
  auto-execute green-light, solicitor legal text, non-expiring Meta token.

## 2026-06-17 — EXECUTED: owner-authorised engine changes (significance gate + break-even-CPL split)
- (a) Wilson significance gate (decisions.ts): scale/kill now also require statistical confidence in
  the purchase rate vs the break-even rate (cpc/be). Scale needs a confident WIN, else softens to
  keep; kill (>1.5x be) needs a confident LOSS, else softens to reduce. Strictly conservative — only
  ever makes a proposal safer; point-estimate verdicts + decide().safe unchanged. Existing safety
  fixtures (winner->scale, blown->kill) verified intact by hand and in tests. +4 tests.
- (b) Break-even-CPL split (metrics/types/audit/index/decisions + migration 0023): optional org
  lead->sale close rate unlocks beCpl = avg x margin x closeRate. Lead-only accounts get a
  CPL-vs-break-even read (reduce when CPL >1.5x beCpl; keep/verify when <=beCpl; keep/lead-quality
  when modestly above). NEVER kills on CPL. No close rate => existing lead-quality routing unchanged
  (inert-safe). Threaded through score/ingest/auto-sync/auto-analysis cfg, settings UI (live beCpl
  readout) + report KPI table. +6 tests.
- Verified each: tsc clean, 472 tests green, next build clean (66 routes). Pushed (PR #22).
- REMAINING tail: dev-dep audit reconciliation (vitest pinned ^2 in package.json but 4.1.9 resolved
  locally — align to ^4 to clear the esbuild/vite dev-chain advisories). Owner-gated: AUD prices,
  auto-execute green-light, solicitor legal text, non-expiring Meta token, and a UX home for the
  lead-close-rate input discoverability (currently in Settings).

## 2026-06-17 — EXECUTED: pricing answer, legal framework + reviews, governance memo, token flow
- PRICING (research loop, 2 parallel agents — competitor scan + AU willingness-to-pay): CONVERGED on
  Starter $49 / Pro $149 / Expert $399 AUD/mo (annual ≈2 months free, ~17%), matching the in-code anchor.
  Owner CONFIRMED → wired into lib/plans.ts display (+ planAnnualLabel, PlanMatrix annual note). Stripe
  annual price objects remain owner-gated.
- LEGAL FRAMEWORK (drafting team + 2 senior-partner review loop): DRAFT Terms (17 clauses) + Privacy
  (15 APP sections) written; Partner A approved Terms subject to conditions; Partner B held Privacy
  (5 blocking, led by lead-hash-likely-personal-info). Consolidated in legal/LEGAL-FRAMEWORK-STATUS.md.
  Owner chose to soften the live /terms /privacy §7 wording now → removed the "hash = de-identified"
  overclaim (training uses de-identified/aggregated only; identifiable + hashed lead data treated as
  personal info; not used to train). DRAFT banners intact; admitted solicitor still finalises.
- LIVE-WRITE GOVERNANCE: memo (product/v6-governance/) recommends ADS_WRITE_ENABLED stays OFF for launch;
  only ever ship as phased opt-in Expert beta behind hard guardrails. No code change (already OFF).
- TOKEN / REAL-ACCOUNT AUDIT: one-click "Run my first audit" (read-only /api/audit/run reusing the cron
  sync+score path) + hardened Meta token validation (scope probe before store, precise errors). Read-only
  invariant intact.
- Verified each: tsc clean, 484 tests green, next build clean. All pushed (PR #22). Copilot review requested.
