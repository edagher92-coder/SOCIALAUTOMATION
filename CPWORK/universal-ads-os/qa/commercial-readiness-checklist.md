# Commercial Readiness Checklist — AdPilot OS

**Version:** 1.0.0
**Last updated:** 2026-06-14
**Purpose:** Confirm the product is sellable. Every item must be PASS before the first transaction. No partial passes. No "we'll fix it after launch."

**Status key:** PASS / FAIL / NOT APPLICABLE / IN PROGRESS

---

## Section 1: Security and Privacy

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 1.1 | No real API keys in any file (grep all files for `sk-`, `EAA`, `Bearer`, `access_token=`) | | |
| 1.2 | No real Meta account IDs (format: numeric string 10–16 digits) in any file | | |
| 1.3 | No real TikTok advertiser IDs in any file | | |
| 1.4 | No real client names, business names, or email addresses in any template or skill | | |
| 1.5 | No real Ad Account names in any example, SOP, or demo data | | |
| 1.6 | All client references use `{{client.*}}` config variable format | | |
| 1.7 | No personal data (names, emails, phone numbers) in any sample dataset | | |
| 1.8 | Sample datasets use clearly fabricated business names (e.g. "Clean Ecom Co", not a real business name) | | |
| 1.9 | No Stripe keys, Anthropic keys, or third-party platform credentials embedded anywhere | | |
| 1.10 | SECURITY.md reviewed and confirmed current (no new secrets added since last review) | | |

**Section 1 result:** PASS / FAIL (all must be PASS)

---

## Section 2: Configuration System

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 2.1 | `client-config.yaml` exists and contains only `{{client.*}}` placeholders (no real values) | | |
| 2.2 | `universal-defaults.yaml` exists and contains safe, generic defaults | | |
| 2.3 | `config-guide.md` exists and documents every field in both config files | | |
| 2.4 | Config guide explains what to set for each `business_type` (ecom, lead_gen, local, saas) | | |
| 2.5 | A non-technical user can complete the config in under 5 minutes (verified by usability test) | | |
| 2.6 | All skills reference config variables correctly (no hardcoded values in any skill prompt) | | |
| 2.7 | Multi-client config structure documented for Agency tier | | |

**Section 2 result:** PASS / FAIL

---

## Section 3: Product Completeness — Starter Tier

| # | Deliverable | Status | Notes |
|---|-------------|--------|-------|
| 3.1 | `meta-ads-audit` skill: SKILL.md exists, prompt complete, tested on Dataset 1 and Dataset 2 | | |
| 3.2 | `tiktok-ads-audit` skill: SKILL.md exists, prompt complete, tested on Dataset 4 | | |
| 3.3 | `campaign-health-monitor` skill: health score (0–100) working, all components weighted | | |
| 3.4 | `ads-reporting-builder` skill: generates complete report structure from audit output | | |
| 3.5 | `utm-naming-builder` skill: generates correct UTM strings | | |
| 3.6 | Google Sheets dashboard: all formulas correct (verified against metric-calculation-tests.md) | | |
| 3.7 | Google Sheets dashboard: CSV Import tab works with both Meta and TikTok column formats | | |
| 3.8 | Google Sheets dashboard: Audit Summary tab generates clean output for Claude | | |
| 3.9 | Client report template (Google Doc): all sections present, branded placeholder ready | | |
| 3.10 | Creative matrix tracker (Sheets tab): 5×5 grid present, functional | | |
| 3.11 | Lead/conversion tracker (Sheets tab): CPL and lead-to-sale rate calculated | | |
| 3.12 | SOP-01: Meta CSV export guide (complete, screenshots or written steps) | | |
| 3.13 | SOP-02: TikTok CSV export guide (complete) | | |
| 3.14 | SOP-03: Dashboard import guide (complete) | | |
| 3.15 | SOP-04: Audit execution guide (complete) | | |
| 3.16 | SOP-05: Report generation guide (complete) | | |
| 3.17 | Onboarding checklist (buyer-facing): complete, accurate, tested | | |
| 3.18 | `config-guide.md`: all fields documented | | |
| 3.19 | `README-FIRST.md` inside ZIP: first file visible, links all work | | |

**Section 3 result:** PASS / FAIL

---

## Section 4: Product Completeness — Pro Tier

| # | Deliverable | Status | Notes |
|---|-------------|--------|-------|
| 4.1 | Make (Integromat) automation blueprint: exists, tested with test trigger | | |
| 4.2 | Zapier automation blueprint: exists, tested | | |
| 4.3 | n8n automation blueprint: exists, tested (or documented as self-hosted-only, untested) | | |
| 4.4 | Weekly report automation: documented and tested | | |
| 4.5 | Alerting system: CPA spike, creative fatigue, budget pacing, tracking failure alerts documented | | |
| 4.6 | Alert delivery: at least one delivery channel (email or Slack) tested end-to-end | | |
| 4.7 | `budget-pacing-monitor` skill: exists and tested | | |
| 4.8 | `creative-fatigue-detector` skill: exists and tested | | |
| 4.9 | `lead-quality-analyser` skill: exists and tested | | |
| 4.10 | Multi-client Sheets dashboard (up to 5 clients): template exists | | |
| 4.11 | SOP-06: Make setup guide | | |
| 4.12 | SOP-07: Zapier setup guide | | |
| 4.13 | Priority email support address configured and tested (test email received by support inbox) | | |

**Section 4 result:** PASS / FAIL / NOT APPLICABLE (if Pro tier not yet launched)

---

## Section 5: Product Completeness — Agency Tier

| # | Deliverable | Status | Notes |
|---|-------------|--------|-------|
| 5.1 | White-label licence (Agency tier): reviewed by solicitor or marked clearly as DRAFT | | |
| 5.2 | Rebrand guide: complete, tested (someone has rebranded the templates following the guide) | | |
| 5.3 | Branded report template: all AdPilot OS references replaceable; placeholder slots present | | |
| 5.4 | Multi-client master index sheet: template exists with all required columns | | |
| 5.5 | Client onboarding questionnaire: exists, auto-populates client-config.yaml | | |
| 5.6 | Client explainer deck: exists (Canva or PowerPoint), all AdPilot OS branding replaceable | | |
| 5.7 | Agency SOPs (team delegation guide): exists | | |
| 5.8 | Sales support pack: exists (objection handling, pricing guidance for agency clients) | | |
| 5.9 | `agency-white-label-pack` skill: exists and tested with multi-client scenario | | |
| 5.10 | Onboarding call process documented and calendar tool configured | | |

**Section 5 result:** PASS / FAIL / NOT APPLICABLE

---

## Section 6: Documentation and Support

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 6.1 | `support-docs.md` complete (all 8 articles present and reviewed) | | |
| 6.2 | Getting Started article: accurately reflects the current onboarding process | | |
| 6.3 | Troubleshooting article: covers the top 5 failure points identified in usability tests | | |
| 6.4 | FAQ: covers all questions from usability test post-interview | | |
| 6.5 | Glossary: all metrics in the health score and audit output are defined | | |
| 6.6 | Support email address: exists and is monitored (or auto-responder configured for Starter) | | |
| 6.7 | Response time commitment: documented (Starter: FAQ self-service; Pro: 1 business day) | | |

**Section 6 result:** PASS / FAIL

---

## Section 7: Commercial Assets

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 7.1 | `sales-page.md` exists and is complete | | |
| 7.2 | Sales page CTA matches actual product price and delivery mechanism | | |
| 7.3 | `pricing-tiers.md` complete with all four tiers documented | | |
| 7.4 | Pricing on the sales page matches pricing in pricing-tiers.md (no discrepancy) | | |
| 7.5 | `demo-script.md` complete; demo can be recorded without preparation | | |
| 7.6 | `onboarding-flow.md` complete for all tiers | | |
| 7.7 | `licence-draft.md` exists; clearly marked as DRAFT; solicitor review recommended note present | | |
| 7.8 | `product-name-options.md` complete; AdPilot OS confirmed as working name | | |

**Section 7 result:** PASS / FAIL

---

## Section 8: QA Completion

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 8.1 | All metric calculation test cases in `metric-calculation-tests.md` pass | | |
| 8.2 | Health score HS-01 worked example produces 44 ± 5 (Orange band) | | |
| 8.3 | All 5 sample datasets audited; results match expected analysis in `sample-data-tests.md` | | |
| 8.4 | All standard prompt tests (PT-R-*, PT-A-*, PT-S-*) pass | | |
| 8.5 | All 8 adversarial prompt tests (PT-ADV-*) pass (zero live edits proposed or performed) | | |
| 8.6 | Usability test completed with a non-technical user; core loop completed in ≤45 minutes | | |
| 8.7 | Usability test post-interview clarity rating: ≥4/5 | | |
| 8.8 | Repeatability test: same dataset audited twice; health score within ±5 | | |
| 8.9 | No Critical or High defects from test-plan.md remain open | | |
| 8.10 | All test run logs completed and signed off by QA tester | | |

**Section 8 result:** PASS / FAIL

---

## Section 9: Packaging and Delivery

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 9.1 | ZIP file created and named: `AdPilot-OS-Starter-v1.0.0.zip` (or relevant tier) | | |
| 9.2 | ZIP tested on a fresh Windows machine (never had AdPilot OS before) | | |
| 9.3 | ZIP tested on a fresh macOS machine | | |
| 9.4 | All Google Sheets templates: "Anyone with link can make a copy" permission set | | |
| 9.5 | All Google Doc templates: "Anyone with link can make a copy" permission set | | |
| 9.6 | All links in README-FIRST.md are live and working | | |
| 9.7 | File count in ZIP matches the documented file list in README-FIRST.md | | |
| 9.8 | No temp files, build artifacts, or `.DS_Store` / `Thumbs.db` files in ZIP | | |
| 9.9 | Delivery platform tested end-to-end: purchase → confirmation email → download link → ZIP opens | | |
| 9.10 | Confirmation email contains all required info: download link, support contact, onboarding link | | |

**Section 9 result:** PASS / FAIL

---

## Final Sign-Off

**Starter tier commercially ready:** YES / NO

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | | | |
| QA Tester | | | |
| Release Manager | | | |

**Launch approved when:** All Sections marked PASS, all three sign-offs present, and no open defects with severity Critical or High.

---

## Escalation Path

If any Section FAILS:

1. Log the specific failed item(s) as defects in the defect log
2. Assign severity (Critical / High / Medium / Low)
3. Fix and re-test the failed items only
4. Re-run the full section that failed
5. Do NOT re-run sections that already passed (unless the fix could affect them — use judgment)
6. Repeat until all sections PASS
