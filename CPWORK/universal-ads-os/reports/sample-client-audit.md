# AdPilot OS — Account Audit Report
**Business:** Example Co | **Audit Date:** 14 June 2026 | **Currency:** AUD
**Platforms audited:** Meta Ads Manager + TikTok Ads Manager
**Audit period:** Last 90 days (16 March – 14 June 2026)
**Auditor:** AdPilot OS Account Audit Agent

---

## Audit Purpose

This audit provides a structured assessment of Example Co's Meta and TikTok paid ad accounts across 13 health dimensions. The output is a scored health block and a prioritised list of fixes. No live changes have been made. All recommended fixes are proposals.

---

## 1. Tracking & Attribution

### Meta

| Check | Status | Detail |
|-------|--------|--------|
| Meta Pixel installed | ✓ Active | Pixel ID referenced via `{{client.meta_pixel_ref}}` — active |
| Purchase event firing | ✓ Verified | Test event fired successfully post-fix (22 May) |
| Lead event firing | ✓ Verified | Lead form submissions tracking correctly |
| Landing page view event | ✓ Active | |
| View Content event | ✓ Active | |
| Conversions API (CAPI) | ⚠ Partial | CAPI connected but event deduplication not verified — potential overcounting |
| UTM parameters on all ads | ✓ Consistent | All ads use `utm_source=meta&utm_medium=paid_social&utm_campaign=[campaign_id]&utm_content=[ad_id]` |
| Google Analytics 4 match | ⚠ Partial | GA4 records ~18% fewer conversions than Meta reports. Investigate |
| 7-day click / 1-day view attribution | ✓ Set | Standard window — appropriate for this offer type |

**Meta tracking score: 72/100** — CAPI deduplication and GA4 discrepancy need resolution.

### TikTok

| Check | Status | Detail |
|-------|--------|--------|
| TikTok Pixel installed | ✓ Active | |
| Purchase event firing | ✓ Fixed (22 May) | Was broken March–May. Fixed via TikTok Events API |
| Lead event firing | ✓ Verified | Lead form completions tracking |
| Events API connected | ✓ Active | Connected post-fix |
| UTM parameters | ✓ Consistent | |
| Attribution window | ✓ 7-day click | Standard |
| Historical purchase data (pre-22 May) | ✗ Lost | ~55 days of purchase conversion data unrecoverable for TikTok. Significant data gap. |

**TikTok tracking score: 65/100** — Fixed but historical gap means 90-day data is unreliable for TikTok purchase analysis. Use post-22 May data only for CPA/ROAS decisions on TikTok.

**Tracking overall score: 68/100**

---

## 2. Account Structure

### Meta Account Structure

```
Ad Account: Example Co ({{client.meta_account_ref}})
│
├── Campaign: Retargeting — Warm Audiences (ACTIVE)
│   ├── Adset: Website Visitors — Last 180 days
│   │   ├── Ad: META_CONV_RemarketingHS_FreeConsult_240501
│   │   └── Ad: META_CONV_RemarketingHS_Testimonial_240501
│   └── Adset: Lead Form Engagers — Last 90 days
│       ├── Ad: META_CONV_RemarketingLF_FreeConsult_240501
│       └── Ad: META_CONV_RemarketingCS_Testimonial_240501
│
├── Campaign: Lead Gen — Lookalike 1–3% (ACTIVE)
│   ├── Adset: Lookalike 1% — Customer List
│   │   ├── Ad: META_LEAD_LL1_ProblemAware_240512
│   │   └── Ad: META_LEAD_LL1_SolutionHook_240501
│   └── Adset: Lookalike 1–3% — Broad
│       └── Ad: META_LEAD_LL3_Generic_240501
│
└── Campaign: Lead Gen — Broad Interest (PAUSED 28 May)
    └── Adset: Interests — Home Improvement
        └── Ad: META_LEAD_BROAD_Generic_240501
```

**Structure observations:**
- ✓ Clean separation between retargeting and cold traffic campaigns
- ✓ Naming convention followed (mostly) — some older ads pre-date convention
- ⚠ Only 1 active ad in the LL1–3% Broad adset — low creative variety
- ✗ No Advantage+ Shopping or Advantage+ Audience campaigns tested — missed opportunity for algorithm optimisation
- ⚠ Retargeting audience window is 180 days — may be too broad for a high-intent offer. Test 30 and 60 day windows.

### TikTok Account Structure

```
Ad Account: Example Co TikTok ({{client.tiktok_account_ref}})
│
├── Campaign: TikTok Lead Gen — Cold (ACTIVE)
│   ├── Adgroup: Cold — Broad 18–45 AU
│   │   ├── Ad: TT_LEAD_ColdInterest_FreeConsult_240515 (STALE)
│   │   └── Ad: TT_LEAD_ColdProblemHook_240603 (NEW — active)
│   └── Adgroup: Cold — Home Interest 25–54 AU
│       └── Ad: TT_LEAD_ColdInterest_HomeOwner_240528
│
└── Campaign: TikTok Retargeting (ACTIVE)
    └── Adgroup: Website Visitors — 30 Days
        └── Ad: TT_RETARG_WarmCS_240515
```

**Structure observations:**
- ✓ Clear cold/retargeting split
- ✓ Naming convention followed
- ⚠ Only 1 retargeting ad active on TikTok — insufficient creative variety
- ✗ No Spark Ads (boosting organic content) — missed format opportunity
- ✗ No Lead Generation objective campaign — currently using website traffic for all TikTok. TikTok native lead forms not tested.

---

## 3. Naming Convention Compliance

**Convention standard:** `{business}_{offer}_{objective}_{location}_{YYYYMMDD}` (AdPilot OS canonical)

| Asset | Naming | Compliant |
|-------|--------|-----------|
| META_CONV_RemarketingHS_FreeConsult_240501 | Meta_Conv_RemarkHS_FreeConsult_240501 | ✓ |
| META_CONV_RemarketingCS_Testimonial_240501 | As above | ✓ |
| META_LEAD_LL1_ProblemAware_240512 | As above | ✓ |
| META_LEAD_LL1_SolutionHook_240501 | As above | ✓ |
| META_LEAD_BROAD_Generic_240501 | As above | ✓ |
| TT_LEAD_ColdInterest_FreeConsult_240515 | As above | ✓ |
| TT_LEAD_ColdProblemHook_240603 | As above | ✓ |
| TT_RETARG_WarmCS_240515 | As above | ✓ |
| Lead Gen — Lookalike 1–3% (campaign) | Missing platform prefix | ⚠ |
| Retargeting — Warm Audiences (campaign) | Missing platform prefix | ⚠ |
| TikTok Lead Gen — Cold (campaign) | Acceptable TikTok convention | ✓ |

**Naming score: 80/100** — Ads are named well. Campaign names are not following convention — add platform prefix to Meta campaign names.

---

## 4. Creative Assessment

### Hook Rate Analysis (TikTok & Meta Video)

| Ad | Platform | Hook Rate | Hold Rate | Benchmark | Status |
|----|----------|-----------|-----------|-----------|--------|
| TT_LEAD_ColdInterest_FreeConsult_240515 | TikTok | 14% | 28% | Hook >20%, Hold >30% | RED — Both below floor |
| TT_LEAD_ColdProblemHook_240603 | TikTok | 31% | 47% | Hook >20%, Hold >30% | GREEN — Strong |
| TT_LEAD_ColdInterest_HomeOwner_240528 | TikTok | 22% | 34% | | YELLOW — Acceptable |
| TT_RETARG_WarmCS_240515 | TikTok | 28% | 41% | | YELLOW — OK for warm |

**Meta creative hook/hold data not available** — Meta does not report 3-second video views at the same granularity. Proxy metrics used: CTR (click-through as scroll-stop signal).

### Creative Age

| Ad | Launch Date | Days Running | Status |
|----|-------------|-------------|--------|
| META_CONV_RemarketingHS_FreeConsult_240501 | 1 May 2026 | 44 days | ⚠ STALE |
| META_CONV_RemarketingCS_Testimonial_240501 | 1 May 2026 | 44 days | ⚠ STALE — but strong ROAS |
| META_LEAD_LL1_ProblemAware_240512 | 12 May 2026 | 33 days | ⚠ STALE |
| META_LEAD_LL1_SolutionHook_240501 | 1 May 2026 | 44 days | ⚠ STALE — weaker performance |
| TT_LEAD_ColdInterest_FreeConsult_240515 | 15 May 2026 | 30 days | RED — fatigue confirmed |
| TT_LEAD_ColdProblemHook_240603 | 3 June 2026 | 11 days | GREEN — Fresh |
| TT_LEAD_ColdInterest_HomeOwner_240528 | 28 May 2026 | 17 days | GREEN |
| TT_RETARG_WarmCS_240515 | 15 May 2026 | 30 days | ⚠ Watch |

**Creative freshness score: 55/100** — Multiple creatives crossing the 30-day mark. Retargeting ads remain profitable despite age, but cold audience creative refresh is overdue.

---

## 5. Campaign Performance Analysis

### 90-Day Campaign Summary

| Campaign | Platform | 90-Day Spend | Leads | CPL | Purchases | CPA | ROAS | Health |
|----------|----------|-------------|-------|-----|-----------|-----|------|--------|
| Retargeting — Warm Audiences | Meta | $4,820 | 162 | $29.75 | 47 | $102.55 | 22.3 | GREEN |
| Lead Gen — Lookalike 1–3% | Meta | $6,108 | 89 | $68.63 | 12 | $509.00 | 6.2 | YELLOW |
| Lead Gen — Broad Interest | Meta | $2,847 | 18 | $158.17 | 0 | — | 0.0 | RED (Paused) |
| TikTok Lead Gen — Cold | TikTok | $4,212 | 88 | $47.86 | 3* | $1,404* | 1.7* | YELLOW* |
| TikTok Retargeting | TikTok | $2,108 | 44 | $47.91 | 2* | $1,054* | 2.0* | YELLOW* |

*TikTok purchase data unreliable pre-22 May due to tracking issue.

**Total 90-day spend:** $20,095 | **Total leads:** 401 | **Overall CPL:** $50.11 | **Total attributed purchases:** 62+ | **Overall CPA (Meta only, reliable):** $190.64

### Funnel Drop-off Analysis (90 days)

| Stage | Count | Conversion Rate | Drop % |
|-------|-------|----------------|--------|
| Impressions | 2,218,400 | — | — |
| Clicks | 16,284 | 0.73% | — |
| Landing Page Views | 13,428 | 82.5% of clicks | 17.5% lost |
| Leads | 401 | 2.99% of LPV | 97% drop |
| Purchases (Meta, reliable) | 59 | 14.7% of leads | 85.3% drop |

**Key funnel issues:**
1. Click-to-landing page drop: 17.5% — typical, but worth monitoring. Could be slow page load speed.
2. LPV-to-lead: 3% conversion. Low. If landing page could convert at 5%, leads would increase by 67% at same spend.
3. Lead-to-purchase: 14.7%. Healthy for this offer type. Sales team performance is adequate.

---

## 6. Budget & Spend Efficiency

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Monthly budget | $8,000 | $8,000 | On budget |
| 90-day total spend | $20,095 | $24,000 | Underspent 16% — partially due to Broad Interest pause |
| Meta spend % | 66% | — | Reflects Meta's stronger conversion performance |
| TikTok spend % | 34% | — | |
| Spend on campaigns above break-even (CPA) | $4,820 (24%) | >50% | ⚠ — significant spend in underperforming campaigns |
| Cost per $1 of gross profit generated | $0.18 | <$0.35 | ✓ |

---

## 7. Audience & Targeting Review

### Meta Audiences

| Audience | Type | Size | Used In | Status |
|----------|------|------|---------|--------|
| Website Visitors 180 days | Custom | ~4,200 | Retargeting | ✓ Active |
| Lead Form Engagers 90 days | Custom | ~1,800 | Retargeting | ✓ Active |
| Customer List (uploaded) | Custom | ~420 | Seed for Lookalike | ✓ Active — update monthly |
| Lookalike 1% AU | Lookalike | ~180,000 | Lookalike 1–3% | ✓ Active |
| Lookalike 1–3% AU | Lookalike | ~540,000 | Lookalike 1–3% | ✓ Active |
| Broad + Home Interest AU | Interest | ~2.1M | Broad Interest | Paused (campaign paused) |

**Audience gaps identified:**
- No video view custom audience — users who watched >50% of an ad
- No Instagram engager audience
- No Advantage+ audience test
- Customer list is 420 records — small. Expand by uploading leads list as well

### TikTok Audiences

| Audience | Type | Status |
|----------|------|--------|
| Website Visitors 30 days | Custom | ✓ Active |
| Lead form engagers | Custom | ✗ Not set up |
| Lookalike from website visitors | Lookalike | ✗ Not tested |
| Broad AU 18–45 | Broad | ✓ Active |

**TikTok audience gaps:** No Lookalike audiences tested, no lead form engager retargeting pool.

---

## 8. Offer & Landing Page Alignment

**Offer:** Free Consultation — {{client.main_offer}}
**Landing page:** (assessed without URL — assessment based on CPL and lead quality patterns)

| Check | Status | Evidence |
|-------|--------|---------|
| Ad-to-LP message match | ⚠ Partial | Lead quality score for cold traffic (61/100) lower than retargeting (81/100) — suggests LP may not match cold audience expectations |
| CTA consistency | ⚠ Unknown | Cannot verify LP CTA without URL access |
| Mobile optimisation | ⚠ Unknown | 17.5% click-to-LPV drop could indicate mobile load issues |
| Page load speed | ⚠ Unknown | Recommend Google PageSpeed test |
| Trust signals | ⚠ Unknown | |

**Recommendation:** Conduct LP audit session. Test a dedicated cold-traffic landing page vs existing LP.

---

## Campaign Health Score Block

### Score by Campaign — 14 June 2026

| Campaign | Platform | Tracking | CPA | Spend Eff | CVR | CTR | Lead Q | Creative | CPC | Naming | Offer | LP | Pacing | Data Conf | **TOTAL** | **BAND** |
|----------|----------|----------|-----|-----------|-----|-----|--------|----------|-----|--------|-------|----|--------|-----------|-----------|----------|
| Retargeting — Warm | Meta | 72 | 100 | 100 | 90 | 78 | 81 | 55 | 92 | 85 | 80 | 75 | 95 | 100 | **85.8** | **GREEN** |
| Lead Gen — LL 1–3% | Meta | 72 | 65 | 78 | 58 | 72 | 72 | 52 | 88 | 80 | 75 | 65 | 90 | 100 | **70.7** | **YELLOW** |
| Broad Interest | Meta | 72 | 0 | 0 | 0 | 40 | 44 | 60 | 88 | 80 | 40 | 40 | 0 | 100 | **31.2** | **RED** |
| TikTok Lead Gen Cold | TikTok | 65 | 50* | 50* | 45 | 38 | 61 | 62 | 85 | 85 | 70 | 60 | 88 | 80 | **60.2** | **YELLOW** |
| TikTok Retargeting | TikTok | 65 | 50* | 50* | 55 | 50 | 68 | 65 | 82 | 85 | 70 | 65 | 88 | 80 | **63.1** | **YELLOW** |
| **Account Overall** | | **70** | **64** | **66** | **55** | **59** | **68** | **58** | **87** | **83** | **72** | **61** | **79** | **93** | **67.2** | **YELLOW** |

*TikTok CPA/spend efficiency scores estimated at 50 pending post-fix attribution data

**Health Weights applied:** Tracking 15%, CPA 15%, Spend Eff 12%, CVR 10%, CTR 8%, Lead Q 8%, Creative 8%, CPC 7%, Naming 5%, Offer 5%, LP 4%, Pacing 2%, Data 1%

---

## Prioritised Fixes

### P1 — CRITICAL: Resolve Meta Conversions API Deduplication
**Current state:** CAPI connected but event deduplication not verified. Risk of reported conversion inflation.
**Fix:** In Meta Events Manager → check deduplication parameters. Ensure `event_id` is being passed with both pixel and CAPI events. Verify with test purchase.
**Impact on score:** Tracking score 72 → 90+ if resolved. Overall account health +2–3 points.
**Effort:** Low (1–2 hours)
**Priority:** Complete before increasing any budgets.

### P2 — HIGH: Pause Stale TikTok Cold Creative
**Current state:** `TT_LEAD_ColdInterest_FreeConsult_240515` — 30 days old, hook rate 14%, hold rate 28%. New creative outperforming.
**Fix:** Pause old creative (not delete). New creative `TT_LEAD_ColdProblemHook_240603` takes full TikTok cold budget.
**Requires:** YES — Example Co — [date]
**Impact:** CPL expected to drop from $52 to $42–45 for TikTok cold traffic.
**Effort:** 5 minutes (pause only)

### P3 — HIGH: Rename Meta Campaigns to Follow Convention
**Current state:** Campaign names "Retargeting — Warm Audiences" and "Lead Gen — Lookalike 1–3%" lack platform prefix.
**Fix:** Rename to `META_CONV_Retargeting_WarmAudiences_240501` and `META_LEAD_Lookalike1-3_FreeConsult_240501`.
**Note:** Meta campaign renames do not affect delivery. Safe to rename live campaigns.
**Impact on score:** Naming score 83 → 100. Overall health +1 point.
**Effort:** 5 minutes

### P4 — HIGH: Build TikTok Lead Form Engager Retargeting Audience
**Current state:** TikTok retargeting only uses website visitors. No lead form engager audience built.
**Fix:** In TikTok Ads Manager → Audience → Create Custom Audience → Lead Generation → Lead Form Completers (last 90 days). Apply to TikTok Retargeting adgroup as additional audience.
**Impact:** Expands TikTok retargeting pool, likely to improve ROAS on TikTok retargeting campaign.
**Effort:** 30 minutes

### P5 — MEDIUM: Conduct Landing Page Speed Audit
**Current state:** 17.5% click-to-landing-page-view drop. Unknown cause — could be slow load, redirect, or bot traffic.
**Fix:** Run Google PageSpeed Insights on LP URL. Target: mobile score >70, load time <3 seconds. If failing, flag to web team.
**Impact on score:** LP alignment score 61 → 80+ if resolved. Overall health +1 point.
**Effort:** 30 minutes (audit) + web team time if fixes needed

### P6 — MEDIUM: Upload Lead List to Meta as Custom Audience
**Current state:** Customer list has 420 records. Consider uploading leads (who haven't converted) as a separate custom audience to build a larger lookalike seed.
**Fix:** Export leads from CRM → hash email/phone as per Meta requirements → upload to Custom Audience.
**Impact:** Larger seed audience → better Lookalike quality. Expected improvement in Lookalike campaign CPL and CVR.
**Effort:** 1–2 hours

### P7 — MEDIUM: Test Meta Advantage+ Audience
**Current state:** All Meta campaigns use manual audience targeting. Advantage+ audience not tested.
**Fix:** Duplicate Lookalike 1–3% campaign → switch to Advantage+ audience → run as 50/50 budget split for 2 weeks.
**Requires:** YES — Example Co — [date]
**Impact:** May reduce CPL and improve CPA through Meta's automated targeting.
**Effort:** 30 minutes setup, 2 weeks test

### P8 — LOW: Add Video View Retargeting Audience (Meta)
**Current state:** No custom audience built from video viewers.
**Fix:** In Meta Audiences → Create → Video → select ads from Retargeting campaign → viewers of 50%+ → last 90 days.
**Impact:** Expands retargeting pool, adds warm video viewer segment.
**Effort:** 20 minutes

---

## Summary: What's Working, What's Not

**Working well:**
- Meta retargeting — strongest CPA ($102.55 over 90 days), highest ROAS (22.3), strong lead quality
- TikTok cost efficiency — CPL competitive with Meta despite tracking gaps
- Budget pacing — account has been on-budget throughout
- Naming convention — ads well-named, campaigns need update
- Overall CPA — 78% below break-even. Business is profitable on paid advertising.

**Not working:**
- Meta Broad Interest campaign — high CPL, low lead quality, 0 purchases. Correctly paused.
- TikTok purchase tracking — 55-day data gap due to pixel error. Data unreliable for CPA/ROAS analysis.
- Creative freshness — multiple creatives at 30+ days. Cold traffic creatives showing fatigue signals.
- Landing page — likely contributing to lower cold traffic conversion. Unverified.
- CAPI deduplication — unknown risk of inflated Meta conversion reporting.

---

*AdPilot OS | Example Co | AUD | Audit period: 16 March – 14 June 2026*
*No live changes have been made. All P1–P8 items are proposals. P2 and P7 require written YES to execute.*
