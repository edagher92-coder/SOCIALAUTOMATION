# CHANGELOG — AdPilot OS

All notable changes to the AdPilot OS package. Format: reverse-chronological.

---

## [1.0.0] — 2026-06-14 — Initial universal build
Built from the current-state audit (`/CPWORK_AD_SYSTEM_CURRENT_STATE.md`) of
Elie Dagher's existing Meta Ads skill + multi-agent workspace.

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
