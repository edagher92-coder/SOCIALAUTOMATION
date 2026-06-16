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
