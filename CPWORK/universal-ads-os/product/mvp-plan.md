# MVP Plan — AdPilot OS V1 No-Code Starter

**Version:** 1.0.0
**Date:** 2026-06-14
**Target tier:** Starter — DIY Template ($97–$297 AUD)
**Tagline:** Audit your ad account, generate a professional report, know exactly what to fix next.

---

## What Is the MVP?

The MVP is a V1 no-code product: a prompt pack + Claude skill pack + Google Sheets dashboard + manual CSV import + audit/report templates.

The core loop is:

```
Export CSV from Meta/TikTok → Paste into Google Sheets → Run the audit skill in Claude → Read the health score → Get a prioritised action list → Generate a client report
```

No API keys. No automations. No code. Just a business owner (or their freelancer) who can export a CSV and type a prompt.

---

## Core Loop: "Audit My Account → Report"

### Step 1 — Export
- User exports the last 30 days of campaign data from Meta Ads Manager or TikTok Ads Manager as a CSV (columns defined in the import template)
- Instructions provided in the onboarding SOP (SOP-01)

### Step 2 — Import
- Paste the CSV into the AdPilot OS Google Sheets Dashboard (pre-built template)
- Sheets auto-calculates: CTR, CPC, CPM, CPA, ROAS, hook rate, hold rate, creative fatigue score
- No formulas to build — all pre-loaded

### Step 3 — Audit
- User opens Claude (claude.ai or Claude for Work) and loads the `meta-ads-audit` or `tiktok-ads-audit` skill
- Pastes their Sheets summary (copy-paste friendly output from a named range) into Claude
- Claude runs the audit, scores the health (0–100), returns prioritised findings

### Step 4 — Report
- User runs the `ads-reporting-builder` skill to generate a structured plain-English report
- Report populates into the pre-built report template (Google Docs or Sheets tab)
- Report covers: account overview, health score, top 3 issues, top 3 wins, recommended actions this week

---

## In-Scope Feature List (MVP)

| # | Feature | Format | Notes |
|---|---------|--------|-------|
| 1 | `meta-ads-audit` skill | Prompt/Claude skill | Reads pasted CSV summary; outputs findings |
| 2 | `tiktok-ads-audit` skill | Prompt/Claude skill | Same structure, TikTok metrics |
| 3 | Campaign health score (0–100) | Calculated in Sheets + interpreted by Claude | Weighted scoring model |
| 4 | Google Sheets dashboard | Template (.xlsx / Sheets link) | Pre-built formulas; copy-paste CSV import |
| 5 | Manual CSV import SOP | SOP document (SOP-01) | Step-by-step export instructions for Meta + TikTok |
| 6 | `ads-reporting-builder` skill | Prompt/Claude skill | Turns audit output into a formatted report |
| 7 | Client report template | Google Doc / Sheets tab | Pre-formatted; fills from audit output |
| 8 | UTM naming builder | Prompt/Claude skill | Generates consistent UTM parameters |
| 9 | Creative matrix | Template (Sheets tab) | Log creative tests, fatigue flags |
| 10 | Lead/conversion tracker | Sheets tab | Manual entry; calculates CPL, CPA trends |
| 11 | SOP library (SOP-01 to SOP-05) | Markdown/PDF | Export, import, audit, report, UTM process |
| 12 | Onboarding checklist | Markdown/PDF | Self-guided setup; no human support required |
| 13 | `client-config.yaml` setup guide | Markdown | How to fill in the config; no code required |
| 14 | Glossary of metrics | Embedded in support docs | Plain-English definitions for non-technical users |

---

## Out of Scope for MVP

The following are explicitly excluded from V1 Starter to keep scope tight:

| Feature | Why Excluded | Version |
|---------|-------------|---------|
| API connections (Meta/TikTok) | Requires developer setup; defeats no-code promise | V3 |
| Make / Zapier automations | Adds complexity and monthly SaaS cost for Starter users | V2 |
| Automated alerts / notifications | Requires automation layer | V2 |
| CRM feedback loop | Requires API or Zapier | V2 |
| Multi-client management | Requires Agency tier setup | Agency tier |
| White-label branded reports | Agency tier feature | Agency tier |
| AI-generated ad copy / creative | Out of scope for an auditing OS | Future roadmap |
| Historical trend analysis beyond 30 days | Manageable in V1 with manual date ranges | V2+ |
| Real-time data | Requires API | V3 |
| Webhook integrations | V2/V3 feature | V2+ |

---

## Success Criteria

### Product Success (can ship when all are true)
- [ ] Audit skill runs end-to-end on a pasted CSV summary without error
- [ ] Health score produces a number 0–100 with a readable explanation
- [ ] Report template is fully pre-formatted and requires only copy-paste to populate
- [ ] A non-technical business owner can complete the full loop (export → report) in under 45 minutes without support
- [ ] All metrics calculated in Sheets match the metric-calculation-tests.md test cases
- [ ] No API keys, real account IDs, or private data anywhere in the deliverable package
- [ ] All `{{client.*}}` variables are present and documented in the config guide
- [ ] At least 5 sample datasets tested and outputs validated (see qa/sample-data-tests.md)

### Commercial Success (can launch when all are true)
- [ ] Sales page live
- [ ] Pricing set ($97–$297; recommend $197 launch price)
- [ ] Gumroad / Lemon Squeezy / Stripe product page created
- [ ] Onboarding email sequence written (minimum 3 emails: welcome, quick-start, first audit)
- [ ] Support doc minimum published (getting started, FAQ, troubleshooting)
- [ ] Licence attached to product
- [ ] Demo video or demo script completed

---

## Build Effort Estimate

| Component | Est. Hours | Owner |
|-----------|-----------|-------|
| Audit skills (Meta + TikTok) | Done — exists in skills/ | — |
| Sheets dashboard (formulas, layout, import tab) | 4–6 hrs | Operator / VA |
| Report template (Google Doc format) | 2–3 hrs | Operator / VA |
| SOP library (5 SOPs) | 3–4 hrs | Operator |
| Onboarding checklist + config guide | 1–2 hrs | Operator |
| Testing (5 sample datasets) | 3–4 hrs | QA |
| Sales page | 2–4 hrs | Operator / Copywriter |
| Packaging + zip + delivery setup | 1–2 hrs | Operator |
| **Total** | **16–25 hrs** | |

---

## What to Charge First

**Recommended launch price: $197 AUD**

**Rationale:**
- Below the "impulse threshold" ($200) for a business owner spending $1,000+/month on ads
- Anchored against the cost of one wasted campaign ($500–$1,000 common for SMBs)
- Sets up an upsell to Pro ($497–$1,497) once the buyer has used the audit tool and wants automation
- Matches the value of one hour of a good freelancer's time for doing this manually ($150–$250/hr)
- $97 is viable for early launch / beta pricing; $297 is viable once social proof is established

**Price ladder:**
- Beta / launch: $97 (first 20 buyers, no support)
- Standard: $197 (full product, email support FAQ)
- Upgraded: $297 (adds 30-min setup call or async Loom review)

**GST note:** If registered for GST in Australia, add 10% GST on top of all prices for Australian buyers. Platform (Gumroad/Lemon Squeezy) may handle this automatically — verify before launch.

---

## North Star Metric

> A business owner who has never run a formal ad audit can export their CSV, run the audit, and have a health score + action list in their hands within 45 minutes of opening the product.

If that is true, the MVP is shipped.
