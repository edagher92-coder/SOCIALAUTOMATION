# CPWORK_AD_SYSTEM_CURRENT_STATE.md
**Current-state audit of Elie Dagher's existing ads / agent workspace**
Prepared: 2026-06-14 · Author: Senior AI Systems Architect (Claude)
Scope: the uploaded `Meta Skills` ZIP + the shared Google Drive "Claude HQ" workspace.

---

## 0. TL;DR

There is a **real, working Meta Ads automation skill** (direct Marketing API, no
browser) and a **mature multi-agent business operating system** for Elie's
companies (Snowflow NSW, Slushieco, Complete Compliance Sydney, ReGen Labs,
DISPATCHIQ). None of it is yet **universal, productised, or sellable** — it is
hardcoded to one ad account and one set of businesses, and it has **no TikTok
side, no reporting layer, no data schema, no health scoring, and no config
system**.

This document inventories what exists, grades it, separates business-specific
from universal, and recommends the new folder structure (built in this repo as
`CPWORK/universal-ads-os/`).

> ⚠️ **CRITICAL SECURITY FINDING (act today):** the shared Drive folder contains
> two live secrets in plain text — an **Anthropic API key** (`New Text
> Document.txt`, value begins `sk-ant-api03-…`) and a **Stripe backup code**
> (`stripe_backup_code.txt`). **Rotate both immediately** and delete the files.
> They were **not** copied into this repo. See `SECURITY.md`.

---

## 1. What exists now (full inventory)

### 1.1 Source A — uploaded ZIP `Meta Skills`
| File | What it is | Notes |
|---|---|---|
| `meta-ads-manager/SKILL.md` | Claude skill: manage Meta ads via Marketing API | Strong. Real guardrails, token handling, history. |
| `meta-ads-manager/meta_ads_api.py` | Python toolkit (urllib, no deps) | `status`, `insights`, `pause`, `activate`, `budget` (guarded). |
| `meta-ads-manager.skill` / `skill-package.skill` / `zizcA6FF.zip` | 3 identical zip copies of the skill | Duplicate packaging only. |
| `snowflow-ads.skill` | Same skill, renamed `snowflow-ads` | Identical bar the `name:` field. |

**Net unique content from the ZIP: ONE skill** (Meta Ads Manager) + its Python
toolkit, repackaged four ways.

### 1.2 Source B — Google Drive "Claude HQ"
| File / Folder | What it does |
|---|---|
| `00 - Claude Context/CLAUDE.md` | **Master context** — Elie, the 5 businesses, operating rules, folder map. Read-first file. |
| `06 - Agents & Playbooks/AGENTS.md` | **Master operating manual v2.0** — governs 4 agents. |
| `marketing-content-agent.md` | Mixed-channel growth/content strategist. Channel→voice mapping. **"King Kong direct-response" voice for Meta paid ads.** |
| `business-consulting-agent.md` | Virtual-CFO + Andrew Griffiths advisory voice. |
| `daily-sales-engine.md` | 5 NSW prospects + cold email every weekday morning. |
| `sales-hunter.md` | Bulk prospecting → ranked CSV (scoring model). |
| `README-REBUILD-NOTES.md` | Notes that these are v2.0 rebuilds; flags a missing DISPATCHIQ brief. |
| `CLAUDE.md` (Sam) + `README.md` | **Sam** — Snow Flow reception/intake bot, with `.claude/skills/{reception,info,enquiry-intake}`. |
| `MACHINES.md` | Snow Flow product catalogue + pricing. |
| `ENQUIRIES.md` / `TASKS.md` | Lead log + task list (Sam's working files). |
| `reference/technical-knowledge-base.md` | Full machine specs / FAQ / warranty / finance. |
| `triage-agent-mvp.jsx` / `snowflow-dispatch-v2.jsx` | React MVPs for **DISPATCHIQ** (HVAC triage/booking SaaS). Not ads. |
| Business folders `01–07`, `99` | Snowflow, Slushieco, Complete Compliance, ReGen Labs, DISPATCHIQ, Agents, Outputs, Archive. |
| Sales artefacts | CAB Skyline partnership email, Urbanista maintenance quote. |
| `New Text Document.txt`, `stripe_backup_code.txt` | **Exposed secrets — see warning above.** |

---

## 2. What each strong asset does (and why it matters)

- **`meta_ads_api.py`** — the crown jewel. It proves the hard part is solved:
  direct Graph API access (v21.0) for read + status + budget, with a *typed-YES*
  guardrail on money moves and a *never-delete, archive-only* rule. This is the
  seed of the entire API-connected product version.
- **`marketing-content-agent.md`** — already encodes a **paid-ads creative voice**
  ("King Kong: hook / agitate / offer / proof / CTA + 3 headline variants"). That
  is reusable creative IP for `stella-social-creative-strategist`.
- **`business-consulting-agent.md`** — the **break-even / margin / unit-economics**
  discipline (CFO focus areas) maps directly onto the ads-data analyst's
  break-even CPA / ROAS / MER logic.
- **`AGENTS.md` + `CLAUDE.md`** — proven router-and-context pattern: a master
  manual every agent reads first, plus locked operating rules. This is exactly the
  architecture the universal product needs, just generalised.
- **Sam (`reception` / `info` / `enquiry-intake`)** — proves the
  one-folder-per-skill `SKILL.md` packaging pattern and the inform-vs-act
  separation (a safety mindset we carry into "never edit live ads").

---

## 3. Reusable vs business-specific vs missing

### 3.1 ✅ Reusable (convert to universal)
- Meta Marketing API toolkit pattern (`meta_ads_api.py`) → `tools/` + `api/meta-api-plan.md`.
- Guardrail philosophy (ask before money, never delete, archive/pause only) → **system-wide safety rules**.
- King Kong creative framework → `stella` agent + `creative-testing-lab` skill.
- CFO break-even discipline → `dana` agent + `paid-ads-data-analysis` skill.
- Router + read-first manual pattern → `start-ads-command-centre` + `AGENTS.md`.
- One-folder-per-skill `SKILL.md` packaging → all 25 skills.
- Numbers-first / AUD-first / Australian-English / anti-hype tone → universal defaults.

### 3.2 🔒 Too business-specific (quarantine into context packs)
- Ad account `act_179081790`, Meta app ID `614890192017160`, system-user ID, business-portfolio ID → **must become config variables**, never hardcoded.
- Snow Flow / Slushieco specifics ($325 call-out, 35 LGAs, delivery rules, model catalogue, Therese/Sam/Elie names, contact emails/phone) → `business-context/snowflow/`.
- DISPATCHIQ (HVAC triage SaaS) → out of scope for the ads OS; leave in its own lane.
- Sam reception bot → adjacent product, not part of the ads OS.

### 3.3 ❌ Missing (must build)
- **Entire TikTok Ads side** (strategist, audit, Spark Ads, hook/hold-rate logic).
- **Unified data schema** across Meta + TikTok + CRM + sheets.
- **Reporting layer** (daily/weekly/monthly/client/exec).
- **Campaign health score (0–100)** and decision rules engine.
- **Tracking/attribution review** (pixels, events, UTMs, offline conversions).
- **Universal config system** (`client-config.yaml`).
- **Productisation**: pricing tiers, sales page, onboarding, white-label, roadmap.
- **QA layer**: metric-calc tests, prompt tests, release checklist.
- **No-code / low-code automation** specs (Make / Zapier / n8n / Sheets).
- **Dashboards** (Sheets / Looker / Airtable / Notion).

---

## 4. Strong / weak / first-to-productise

| Verdict | Items |
|---|---|
| **Already strong** | Meta API toolkit; guardrail philosophy; creative voice; CFO numbers discipline; router/manual pattern. |
| **Weak / thin** | Single ad account hardcoded; no TikTok; no reporting; no health scoring; duplicated skill packaging; secrets in plain text. |
| **Productise FIRST** | (1) `meta-ads-audit` + `paid-ads-data-analysis` + `campaign-health-monitor` (the "audit my account" wedge), (2) `client-report-generator` (the recurring-value hook), (3) `universal-business-onboarding` + `config/client-config.yaml` (makes it multi-client). |

---

## 5. What to split into separate context packs
- `business-context/snowflow/` — anonymisable Snowflow/Slushieco patterns + private specifics kept separate from the product.
- `business-context/profit-minute-au/` — numbers-first, AUD-first, anti-hype content brand voice.
- `business-context/universal/` — neutral example business used in demos/templates so the core ships with **zero** private data.

---

## 6. Recommended new folder structure
Built in this repo at **`CPWORK/universal-ads-os/`** — see the live tree there.
Top level: `config/`, `skills/` (25), `agents/` (12), `templates/`, `dashboards/`,
`automations/`, `api/`, `reports/`, `product/`, `qa/`, `business-context/`,
`tools/`, plus `README.md`, `AGENTS.md`, `SYSTEM_OVERVIEW.md`,
`PRODUCT_ROADMAP.md`, `CHANGELOG.md`, `SECURITY.md`.

---

## 7. Decisions carried into the build
1. Working product name: **AdPilot OS** (alternatives in `product/product-name-options.md`).
2. **No secrets, no client IDs, no ad-account IDs** in any universal file — only `{{client.*}}` variables.
3. Existing Meta skill is **preserved and generalised**, not rebuilt from scratch.
4. Snowflow stays in its own lane; reusable patterns anonymised.
5. Profit Minute AU examples remain numbers-first, AUD-first, anti-hype.
6. **Live-edit block is on by default** everywhere (`live_edit_block: true`, `use_paused_duplicates_only: true`).

---

*End of current-state audit. Build proceeds in 10 stages; see `CHANGELOG.md`.*
