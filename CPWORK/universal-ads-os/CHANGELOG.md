# CHANGELOG — AdPilot OS

All notable changes to the AdPilot OS package. Format: reverse-chronological.

---

## [1.3.0] — 2026-06-14 — Web app
- `tools/webapp/server.py` — dependency-free (stdlib `http.server`) UI + JSON API over
  the engine. Paste/upload a Meta/TikTok/universal CSV → Campaign Health Score,
  findings, headline metrics, and **safe per-ad decisions**. Read-only; never edits a live ad.
- Endpoints: `/`, `/health`, `/api/selftest`, `/api/sample/{clean|fatigued|broken}`,
  `POST /api/analyze`. Verified live: health ok, self-test 54/54, analyze returns
  correct results (fatigued sample → 51.5 Orange).
- Deploy artifacts: `Dockerfile`, `Procfile`, `render.yaml`, `webapp/README.md`
  (one-step deploy — no build, stdlib only).

## [1.2.0] — 2026-06-14 — Auto-audit engine
- `tools/adpilot/audit.py` — derives all 13 health factors + findings **directly from a
  CSV** (no manual factor entry); wired into `analyze` and `report`.
- 3 documented fixture accounts (clean/fatigued/broken) + asserts they land in the
  expected bands: **clean 89.4 Green · fatigued 51.5 Orange · broken 33.2 Red**.
- Self-test grew to **54/54**. `ingest.parse_csv_text()` added for the web API.
- Fixed `prompt-tests.md` PT-R-05 routing (scaling → dana, not titan).

## [1.1.1] — 2026-06-14 — Verification pass + resale hardening
Independent multi-agent verification, then fixes and resale mechanics.

**Verified (three independent reviewers)**
- Functional QA: PASS, 0 defects (structure, frontmatter, JSON/CSV, engine 44/44, safety).
- Consistency: **all 16 found issues fixed**, re-verified ALL RESOLVED.
- Security/Resale: no secrets/real IDs; RESALE-MECHANICS COMPLETE.

**Fixed (16 consistency defects from the parallel build)**
- `hook_rate` formula corrected to `three_second_views / impressions` in 6 automation
  files + `api/data-schema.md`, `meta-api-plan.md`, `tiktok-api-plan.md`.
- UTM values corrected to `utm_source=meta` / `utm_medium=paid_social` in templates,
  `support-docs.md`, `white-label-agency-offer.md`, `airtable` spec, `sample-client-audit.md`.
- Campaign naming aligned to canonical in 2 dashboards + 1 report; Sheets platform
  dropdown set to `meta, tiktok`.

**Added (resale + buyer deliverables)**
- `tools/package_release.sh` — self-verifying resale packager (strips private packs,
  secret-scans, runs the self-test, zips). Produces a 23-skill universal build.
- `README-FIRST.md`, `config/config-guide.md`, `product/sops/SOP-01..05`, `qa/test-run-log.md`.
- Genericised owner-name references in the universal core; flagged the root audit doc
  as operator-internal / do-not-distribute.

**Honest open items (human/owner only — not faked):** solicitor licence review, real
testimonials, live support inbox, delivery platform + test purchase, non-technical
usability sign-off, live dashboard template builds. Tracked in `qa/test-run-log.md`.

## [1.1.0] — 2026-06-14 — Executable engine + reconciliation
Added the differentiating, hard-to-replicate layer: a working, tested engine.

**New — executable engine (`tools/adpilot/`, stdlib only)**
- `metrics.py` (all formulas, zero-division safe), `health.py` (canonical 13-factor
  score + bands + N/A redistribution), `schema.py` (universal schema + Meta/TikTok
  column mapping), `decisions.py` (safe verdict engine — proposals only, no live
  edits, no delete), `ingest.py`, `report.py`, CLI (`analyze` / `health` / `selftest`).
- **Self-verifying QA:** `python3 -m adpilot selftest` runs the documented
  `qa/metric-calculation-tests.md` cases against the live engine — **44/44 checks pass.**
- `tools/tiktok_ads_api.py` — read-only TikTok reporting client (token from env).
- `automations/blueprints/make-daily-pull.blueprint.json` — importable, read-only Make scenario.
- `product/competitive-moat.md` — the demonstrable differentiators.

**Reconciled**
- Health score: the **13-factor** model (`universal-defaults.yaml` + `health.py`) is
  now the **single source of truth**. Added a reconciliation note to
  `qa/metric-calculation-tests.md` (its illustrative 10-factor worked example may
  differ by a few points; the engine is authoritative).

## [1.0.0] — 2026-06-14 — Initial universal build
Built from the current-state audit (`/CPWORK_AD_SYSTEM_CURRENT_STATE.md`) of
the operator's existing Meta Ads skill + multi-agent workspace.

**Stage 1 — Current-state audit**
- Inventoried the `Meta Skills` ZIP (one real skill, repackaged 4×) and the Drive
  "Claude HQ" (master context, 4 business agents, Sam bot, DISPATCHIQ, business
  folders).
- Flagged exposed secrets (Anthropic key + Stripe backup code) — see `SECURITY.md`.

**Stage 2 — System overview**
- `README.md`, `AGENTS.md`, `SYSTEM_OVERVIEW.md`, `SECURITY.md`,
  `PRODUCT_ROADMAP.md`, this file.
- Config system: `config/client-config.yaml`, `config/universal-defaults.yaml`.

**Stage 3 — Agents** — 12 agent playbooks in `agents/`.

**Stage 4 — Skills** — 25 skills in `skills/<name>/SKILL.md`.

**Stage 5 — Templates** — onboarding, audits, trackers, reports, scorecards in `templates/`.

**Stage 6 — Dashboards** — Sheets / Looker / Airtable / Notion / agency specs in `dashboards/`.

**Stage 7 — Automations** — manual, Make, Zapier, n8n, alerts, loops, webhook in `automations/`.

**Stage 8 — API plans** — Meta / TikTok / CRM / messaging + webhook + data schema in `api/`.

**Stage 9 — Productisation** — names, MVP, pricing, sales page, onboarding, demo,
  support, white-label, roadmap in `product/`; sample reports in `reports/`.

**Stage 10 — QA & release** — test plans, metric/prompt/usability tests, commercial
  readiness + release checklist in `qa/`.

**Preserved & generalised**
- Meta Marketing API toolkit → `tools/meta_ads_api.py` (account ID now read from
  config/env, never hardcoded).
- Guardrail philosophy, King Kong creative voice, CFO break-even discipline.

**Added (was missing)**
- Entire TikTok side, unified schema, reporting layer, health score, decision-rule
  engine, tracking/attribution review, universal config, productisation, QA.
