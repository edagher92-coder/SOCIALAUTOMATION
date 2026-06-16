# AdPilot OS — V6 Decision & Stage Log

Running log of every stage + decision in the V6 effort (newest at bottom). Owner-gated items are
collected in V6-MASTER-PLAN.md → "Owner decision queue" and surfaced just before upload.

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
