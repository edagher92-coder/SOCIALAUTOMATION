# AdPilot OS
**A universal, router-led paid-ads operating system for Meta Ads & TikTok Ads —
built to run your own accounts and to be resold as code, a Claude skill pack, and
a white-label agency OS.**

> Working name: **AdPilot OS**. Alternatives under review in
> [`product/product-name-options.md`](product/product-name-options.md).

---

## What it does
- **Automates** Meta + TikTok ads workflows (audits, tracking, reporting, recommendations) — safely.
- **Tracks** performance across both platforms on one schema.
- **Standardises** reporting (daily / weekly / monthly / client / executive).
- **Audits** accounts and produces a **Campaign Health Score (0–100)**.
- **Protects live campaigns**: never edits a live ad — proposes paused duplicates / drafts only.
- Ships in **three versions**: no-code, low-code automation, and API-connected.

## Who it's for
Business owners · local service businesses · e-commerce brands · B2B lead-gen ·
franchises / multi-location · agencies (multi-account) · content brands running
Meta + TikTok together.

## The golden rule
**Never push a change to a live, spending ad.** Every change ships as a **paused
duplicate, draft, or written proposal** and money moves require a human "YES".
See [`AGENTS.md`](AGENTS.md) §1 and [`SECURITY.md`](SECURITY.md).

---

## Quick start
1. **Configure** — copy `config/client-config.yaml`, fill it in for your business.
   (Leave `meta_account_id` / `tiktok_account_id` blank in any shared copy.)
2. **Onboard** — run the `universal-business-onboarding` skill (or fill
   `templates/business-onboarding-form.md`).
3. **Audit** — run `meta-ads-audit` and/or `tiktok-ads-audit`.
4. **Analyse** — run `paid-ads-data-analysis` on an export → get keep/kill/scale calls.
5. **Score** — run `campaign-health-monitor` for the 0–100 health score.
6. **Report** — run `client-report-generator` for a plain-English report.

No keys required for the no-code path — start with CSV exports.

### Or run the engine directly (proves the numbers)
```bash
cd CPWORK/universal-ads-os/tools
python3 -m adpilot selftest                                   # 44/44 QA checks pass
python3 -m adpilot analyze adpilot/tests/fixtures/universal_sample.csv \
        --business "Example Co" --avg-sale 200 --margin 0.6   # metrics + health + safe proposals
```
The engine (`tools/adpilot/`) is dependency-free and **self-verifying** — see
[`tools/README.md`](tools/README.md) and [`product/competitive-moat.md`](product/competitive-moat.md).

## Repository map
```
universal-ads-os/
  config/         client-config.yaml · universal-defaults.yaml
  agents/         12 specialist agents (router + 11 specialists)
  skills/         25 Claude skills, one folder each (SKILL.md)
  templates/      onboarding, audits, trackers, report templates, scorecards
  dashboards/     Sheets / Looker / Airtable / Notion / agency specs
  automations/    manual, Make, Zapier, n8n, alerts, feedback loops, webhooks
  api/            Meta / TikTok / CRM / messaging plans, webhook + data schema
  reports/        sample daily / weekly / monthly / audit / exec reports
  product/        names, MVP, pricing, sales page, onboarding, demo, white-label
  qa/             test plans, metric tests, prompt tests, release checklist
  business-context/  snowflow/ · profit-minute-au/ · universal/
  tools/          reusable code (e.g. Meta API toolkit)
```

## The agents
Router **start-ads-command-centre** delegates to: **mira** (Meta), **travis**
(TikTok), **dana** (data), **stella** (creative), **titan** (offer/funnel),
**milo** (automation), **atlas** (tracking), **riley** (reporting), **paige**
(policy/safety), **piper** (productisation), **quinn** (QA). See [`AGENTS.md`](AGENTS.md).

## Product versions
- **V1 — No-code template**: prompts + skills + Sheets dashboard + CSV import.
- **V2 — Low-code automation**: Make / Zapier / n8n + alerts + auto-reports + CRM loop.
- **V3 — API-connected**: Meta + TikTok API imports + white-label agency mode + SaaS direction.

## Commercial tiers
Starter (DIY) · Pro (Automation) · Agency (White-label) · Done-With-You setup.
See [`product/pricing-tiers.md`](product/pricing-tiers.md).

## Docs
[`SYSTEM_OVERVIEW.md`](SYSTEM_OVERVIEW.md) ·
[`PRODUCT_ROADMAP.md`](PRODUCT_ROADMAP.md) ·
[`SECURITY.md`](SECURITY.md) ·
[`CHANGELOG.md`](CHANGELOG.md)
