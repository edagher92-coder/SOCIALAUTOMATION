# PRODUCT_ROADMAP.md — AdPilot OS

Where the product goes, in order of commercial leverage. Detailed phasing also in
`product/roadmap.md`; this is the executive view.

---

## Now (v1.0 — shipped in this build)
- 12 agents, 25 skills, universal config, schema, health score, decision rules.
- Templates, dashboards specs, automation specs, API plans, sample reports.
- Product pack (names, pricing, sales page, onboarding, demo, white-label).
- QA + release checklist. Example + private (operator) context packs.

## Next (v1.1 — productise the wedge, ~2 weeks)
- Ship **V1 No-code** as the Starter SKU: Sheets dashboard built from
  `dashboards/google-sheets-dashboard-spec.md` + CSV importer.
- Polish the "audit my account" flow (`meta-ads-audit` → `paid-ads-data-analysis`
  → `campaign-health-monitor` → `client-report-generator`) into a one-command demo.
- Record the demo (`product/demo-script.md`).

## Soon (v1.2 — automation, ~4–6 weeks)
- Build the **V2 Low-code** Pro SKU: Make/Zapier/n8n scenarios from `automations/`.
- Daily alerts + weekly auto-report.
- CRM feedback loop (lead → sale → back into lead-quality scoring).

## Later (v2.0 — API + agency, ~1 quarter)
- **V3 API-connected**: implement `api/meta-api-plan.md` + `api/tiktok-api-plan.md`
  read-only ingestion, then guarded proposals.
- **Agency white-label**: multi-client config switching, branded reports,
  client dashboard (`dashboards/agency-client-dashboard-spec.md`).

## Horizon (v3.0 — SaaS direction)
- Hosted multi-tenant ingestion + scheduled audits + alerting.
- Self-serve onboarding, billing (Stripe), role-based access.
- Optional "auto-improve" loop: proposals → human approval → measured → learned.

---

## Sequencing principle
Sell the **audit + report** value first (fastest to cash, lowest build), then
**automation** (recurring value), then **API/agency** (scale). Don't build SaaS
infra before the no-code version has paying users.
