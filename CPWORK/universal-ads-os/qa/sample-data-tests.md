# Sample Data Tests — AdPilot OS

**Version:** 1.0.0
**Last updated:** 2026-06-14
**Purpose:** Define 5 fabricated test datasets. Use these to validate audit outputs, health scores, and decision rules. All figures are fabricated — no real account data.

---

## How to Use These Datasets

1. Open the AdPilot OS Google Sheets Dashboard → CSV Import tab
2. Manually enter the data from the relevant dataset below (or use the pre-built CSV test files in qa/test-data/)
3. Run the audit skill with the relevant config (each dataset has a config snippet)
4. Compare the output against the Expected Analysis section
5. Health score must be within ±5 of Expected Score; top 3 findings must match

---

## Dataset 1: The Clean Account

**Scenario:** A well-structured e-commerce account running within all benchmarks. Health should score Green.

**Config (client-config.yaml excerpt):**
```yaml
client:
  name: "Clean Ecom Co"
  currency: "AUD"
  monthly_budget_aud: 5000
  primary_platform: "meta"
  business_type: "ecom"
  target_cpa_aud: 35
  target_roas: 3.5
kpis:
  primary: "roas"
```

**Campaign data (last 30 days, 3 campaigns):**

| Campaign | Ad Sets | Spend | Impressions | Clicks | CTR | CPC | CPM | Conversions | CPA | ROAS | Frequency |
|----------|---------|-------|-------------|--------|-----|-----|-----|-------------|-----|------|-----------|
| Prospecting — Broad | 2 | $2,100 | 280,000 | 4,200 | 1.50% | $0.50 | $7.50 | 65 | $32.31 | 4.1 | 1.8 |
| Retargeting — 30d | 1 | $1,500 | 42,000 | 1,260 | 3.00% | $1.19 | $35.71 | 55 | $27.27 | 5.2 | 3.2 |
| Retargeting — 7d | 1 | $1,400 | 28,000 | 980 | 3.50% | $1.43 | $50.00 | 48 | $29.17 | 4.8 | 2.9 |

**Account totals:** Spend $5,000 / Impressions 350,000 / Clicks 6,440 / CTR 1.84% / CPC $0.78 / CPM $14.29 / Conversions 168 / CPA $29.76 / Blended ROAS 4.5

**UTMs:** Present on all ads. GA4 receiving attributed traffic.
**Pixel:** Fires on purchase event correctly.
**Naming convention:** Follows `[Business]_[Offer]_[Objective]_[Audience]_[Date]` format.

### Expected Analysis

**Expected health score:** 82–88 (Green band)

**Expected findings — in priority order:**

1. (Low) Retargeting 30d frequency at 3.2 — approaching fatigue threshold. Monitor weekly. Not yet critical.
2. (Low) Prospecting ad set count is 2 — consider splitting into 3 for A/B creative variation if budget allows.
3. (Positive finding) CPA of $29.76 is 15% below target of $35 — account is performing above KPI. ROAS of 4.5 is 29% above target of 3.5.

**Expected decision rules triggered:**
- "Account performing above KPI — eligible to consider scaling prospecting budget by 15–20%"
- "Retargeting 30d frequency monitor — schedule creative refresh within 7 days if frequency exceeds 4.0"

**Expected report headline:** "Account healthy — performing above targets. One creative refresh approaching; two weeks to act."

**QA pass criterion:** Score 82–92 (within ±5 of 87). No critical or high findings. Retargeting frequency flagged as low-priority. Report reflects positive account status.

---

## Dataset 2: The Fatigued Account

**Scenario:** An account where creative has been running too long, frequency is high, CTR is declining, and CPA is rising. Health should score Orange.

**Config:**
```yaml
client:
  name: "Fatigued Store"
  currency: "AUD"
  monthly_budget_aud: 8000
  primary_platform: "meta"
  business_type: "ecom"
  target_cpa_aud: 40
  target_roas: 3.0
kpis:
  primary: "roas"
```

**Campaign data (last 30 days):**

| Campaign | Ad Sets | Spend | Impressions | Clicks | CTR | CPC | CPM | Conversions | CPA | ROAS | Frequency | Days in flight |
|----------|---------|-------|-------------|--------|-----|-----|-----|-------------|-----|------|-----------|----------------|
| Prospecting — Video A | 3 | $3,800 | 410,000 | 3,280 | 0.80% | $1.16 | $9.27 | 58 | $65.52 | 1.8 | 5.1 | 67 |
| Prospecting — Video B | 2 | $2,600 | 200,000 | 1,600 | 0.80% | $1.63 | $13.00 | 31 | $83.87 | 1.4 | 4.8 | 54 |
| Retargeting | 1 | $1,600 | 38,000 | 988 | 2.60% | $1.62 | $42.11 | 29 | $55.17 | 2.6 | 4.1 | 31 |

**Account totals:** Spend $8,000 / Impressions 648,000 / Clicks 5,868 / CTR 0.91% / CPC $1.36 / Conversions 118 / CPA $67.80 / Blended ROAS 2.1

**UTMs:** Present on 75% of ads.
**Pixel:** Firing correctly on purchase event.

### Expected Analysis

**Expected health score:** 28–38 (Red band)

**Expected findings — in priority order:**

1. (Critical) CPA of $67.80 is 70% above target of $40. Account is loss-making on every conversion at this CPA level. Immediate budget review required.
2. (Critical) ROAS of 2.1 is 30% below target of 3.0 and below break-even ROAS (break-even at 33% margin = 3.0). Account is destroying margin.
3. (Critical) Primary creative (Video A, 67 days in flight, frequency 5.1) is severely fatigued. CTR of 0.80% indicates audience saturation. Estimated wasted spend on fatigued creative: $1,900–$2,500/month.
4. (High) Video B also fatigued (54 days, frequency 4.8, CTR 0.80%). Both prospecting creatives require immediate replacement.
5. (High) 25% of active ads missing UTMs. Attribution is partial.
6. (Medium) Retargeting CPA ($55.17) also above target — indicates the issue extends beyond just prospecting.

**Expected decision rules triggered:**
- "STOP: Do not increase spend. Account is below break-even ROAS and above break-even CPA."
- "Creative emergency: both primary prospecting creatives are fatigued. Brief 3 new angles immediately."
- "Partial UTM coverage: complete UTM tagging before the next reporting period."

**Expected report headline:** "Account in decline — creative fatigue is costing approximately $2,000+/month in wasted spend. Act this week."

**QA pass criterion:** Score 24–42 (Red or Orange). Critical findings include CPA overshoot, ROAS below target, and creative fatigue. Decision rules must include stop-scale instruction.

---

## Dataset 3: The Broken-Tracking Account

**Scenario:** An account where the pixel is firing on page load (not purchase), UTMs are missing on most ads, and reported conversion numbers are unreliable. Health score should be Red, primarily driven by tracking quality.

**Config:**
```yaml
client:
  name: "Tracking Disaster Co"
  currency: "AUD"
  monthly_budget_aud: 4000
  primary_platform: "meta"
  business_type: "ecom"
  target_cpa_aud: 50
  target_roas: 2.5
kpis:
  primary: "roas"
```

**Campaign data (last 30 days):**

| Campaign | Spend | Impressions | Clicks | CTR | CPC | Reported Conversions | Reported CPA | Reported ROAS | Frequency |
|----------|-------|-------------|--------|-----|-----|---------------------|-------------|---------------|-----------|
| Broad prospecting | $2,200 | 180,000 | 1,620 | 0.90% | $1.36 | 312 | $7.05 | 8.2 | 2.4 |
| Retargeting | $1,800 | 40,000 | 1,000 | 2.50% | $1.80 | 198 | $9.09 | 6.7 | 3.0 |

**Reported totals (as seen in Ads Manager):** Spend $4,000 / Conversions 510 / CPA $7.84 / ROAS 7.2

**GA4 reality (from GA4 export, if available):** Sessions from paid social = 2,620. Goal completions (purchase) = 31. GA4 ROAS = 0.8. GA4 CPA = $129.

**UTM coverage:** 30% of active ads have UTMs. 70% are untagged.

**Pixel audit finding:** Conversion event is firing on page load, not on the purchase confirmation page. Every landing page visit is reported as a conversion. Real conversion count is estimated at 28–35 (vs. 510 reported).

### Expected Analysis

**Expected health score:** 15–25 (Red band, tracking-driven)

**Expected findings — in priority order:**

1. (Critical) Pixel is firing on page load. Reported conversions (510) are not real conversions. Actual estimated purchases are 28–35. This invalidates all CPA, ROAS, and conversion-based decisions.
2. (Critical) Reported ROAS of 7.2 is fictitious. GA4 data indicates actual ROAS closer to 0.8 — account is almost certainly loss-making.
3. (Critical) 70% of ads are missing UTMs. Cross-platform attribution is impossible.
4. (High) The optimisation signal fed to Meta's algorithm is corrupted — Meta is optimising for page loads, not purchases. The algorithm has been trained on the wrong signal for the entire period.
5. (High) All budget decisions based on Ads Manager data for this period are unreliable. Do not use these conversion figures for any decisions.

**Expected decision rules triggered:**
- "HALT: Do not make any budget or scaling decisions based on current Ads Manager data. Tracking must be fixed first."
- "Emergency fix: correct pixel event (page load → purchase event) before running any further spend."
- "Complete UTM tagging on all active ads immediately."
- "After fixing pixel: pause all campaigns for 7 days to allow Meta algorithm to reset, then relaunch with correct optimisation signal."

**Expected report headline:** "TRACKING CRITICAL — all reported conversion data is unreliable. Fix pixel before making any ad decisions."

**QA pass criterion:** Score 12–28 (Red). Tracking quality component scores ≤10/100. All critical findings relate to pixel and UTM issues. Decision rules include halt instruction and pixel fix.

---

## Dataset 4: The Profitable Ecommerce Account

**Scenario:** A well-run ecom account that is profitable and has room to scale. Health should be Green-to-Yellow. The test here is that AdPilot OS correctly identifies the scaling opportunity rather than surfacing non-issues as critical problems.

**Config:**
```yaml
client:
  name: "Profitable Ecom"
  currency: "AUD"
  monthly_budget_aud: 12000
  primary_platform: "both"
  business_type: "ecom"
  target_cpa_aud: 38
  target_roas: 4.0
kpis:
  primary: "roas"
```

**Meta campaign data (last 30 days):**

| Campaign | Spend | Impressions | Clicks | CTR | CPC | Conversions | CPA | ROAS | Frequency |
|----------|-------|-------------|--------|-----|-----|-------------|-----|------|-----------|
| Meta — Prospecting | $5,000 | 420,000 | 6,300 | 1.50% | $0.79 | 148 | $33.78 | 5.2 | 1.9 |
| Meta — Retargeting | $2,500 | 52,000 | 1,820 | 3.50% | $1.37 | 75 | $33.33 | 5.8 | 2.8 |

**TikTok campaign data (last 30 days):**

| Campaign | Spend | Impressions | Clicks | CTR | CPC | Conversions | CPA | ROAS | Thumb Stop Rate | Hold Rate |
|----------|-------|-------------|--------|-----|-----|-------------|-----|------|----------------|-----------|
| TikTok — Spark Ads | $3,000 | 380,000 | 4,560 | 1.20% | $0.66 | 89 | $33.71 | 4.7 | 28% | 31% |
| TikTok — In-Feed | $1,500 | 210,000 | 2,520 | 1.20% | $0.60 | 41 | $36.59 | 3.9 | 22% | 26% |

**Combined totals:** Spend $12,000 / Total conversions 353 / Blended CPA $33.99 / Blended ROAS 4.9 / MER (if provided) est. 4.2

**UTMs:** 100% coverage.
**Pixel:** Purchase event firing correctly on both platforms.
**Creative freshness:** 4 active creatives, all under 30 days, all above 1.0% CTR / 0.8% thumb stop rate.

### Expected Analysis

**Expected health score:** 78–88 (Yellow to Green)

**Expected findings — in priority order:**

1. (Medium) TikTok In-Feed thumb stop rate is 22% — below the 25% benchmark for TikTok In-Feed. Consider testing a stronger hook variant.
2. (Medium) TikTok In-Feed ROAS of 3.9 is just below target of 4.0. Monitor — may warrant budget reallocation from In-Feed to Spark Ads if trend continues.
3. (Low) Meta retargeting frequency at 2.8 — approaching watch zone. Still fine for now; revisit in 10 days.
4. (Opportunity) Combined ROAS of 4.9 is 22.5% above target. CPA of $33.99 is 10.5% below target. Prospecting campaign on Meta shows strong efficiency (CPA $33.78, freq 1.9). Scaling prospecting by 20–30% is warranted — estimated budget increase from $5,000 to $6,000–$6,500.

**Expected decision rules triggered:**
- "Scale eligible: Meta prospecting is performing 11% below target CPA with frequency at 1.9. Recommend 20% budget increase to $6,000 as a paused duplicate test."
- "TikTok In-Feed hook test: brief a new hook variant for the lowest-performing In-Feed ad."

**QA pass criterion:** Score 75–90 (Yellow or Green). Scaling opportunity identified. No false critical findings. TikTok hook rate flagged as medium. No stop-scale instructions.

---

## Dataset 5: The Lead-Gen Local Service Account

**Scenario:** A local plumbing/trades business running lead-gen ads. Metrics are CPL-focused, not ROAS. Volume is lower, budgets are smaller, geographic targeting is narrow. Health should be Orange — common issues in local service accounts.

**Config:**
```yaml
client:
  name: "Metro Plumbing Sydney"
  currency: "AUD"
  monthly_budget_aud: 1500
  primary_platform: "meta"
  business_type: "lead_gen"
  target_cpa_aud: 45   # target CPL
  target_roas: 0       # not applicable for lead gen
kpis:
  primary: "cpl"
  secondary: "lead_quality_rate"
```

**Campaign data (last 30 days):**

| Campaign | Spend | Impressions | Clicks | CTR | CPC | Leads | CPL | Lead-to-quote rate | Quote-to-sale rate | Frequency |
|----------|-------|-------------|--------|-----|-----|-------|-----|-------------------|-------------------|-----------|
| Emergency — Plumbing | $600 | 22,000 | 308 | 1.40% | $1.95 | 12 | $50.00 | 50% | 30% | 2.1 |
| General Plumbing | $500 | 18,000 | 198 | 1.10% | $2.53 | 6 | $83.33 | 25% | 20% | 2.6 |
| Hot Water Systems | $400 | 12,000 | 108 | 0.90% | $3.70 | 3 | $133.33 | 33% | 40% | 3.1 |

**Account totals:** Spend $1,500 / Leads 21 / Blended CPL $71.43 / Avg lead-to-quote rate 39% / Avg quote-to-sale rate 28%

**Qualified lead rate (from CRM):** 39% of leads are qualified (real plumbing need, in service area, can afford the job). Effective CPL (qualified only) = $71.43 ÷ 0.39 = $183.15.

**UTMs:** Missing on all ads.
**Geographic targeting:** Set to "Sydney" — not radius-based. Including suburbs the plumber does not service.

### Expected Analysis

**Expected health score:** 38–48 (Red to Orange boundary)

**Expected findings — in priority order:**

1. (Critical) UTMs missing on all ads. Cannot track lead source in CRM or GA4. All attribution is guesswork.
2. (Critical) Hot Water Systems CPL of $133.33 is 196% above target CPL of $45. This campaign is destroying budget relative to result. Pause recommended immediately.
3. (High) Effective qualified CPL of $183.15 (adjusted for 39% lead quality rate) is 307% above target. The raw CPL is misleading — need to improve lead quality or reduce CPL significantly to make economics work.
4. (High) Geographic targeting set to "Sydney" rather than a service radius from the business address. Ads are likely reaching suburbs outside the service area — generating low-quality or unserviceable leads.
5. (Medium) General Plumbing CPL of $83.33 is 85% above target. Review the offer, the landing page, and the audience.
6. (Low) Emergency Plumbing is the best performer (CPL $50, closest to target) but still 11% above. This is the campaign to focus on.

**Expected decision rules triggered:**
- "PAUSE: Hot Water Systems campaign immediately. CPL is 196% above target."
- "Fix geographic targeting: switch from 'Sydney' to a 20–30km radius from the service address."
- "Complete UTM tagging before next reporting period."
- "Focus budget: consolidate to Emergency Plumbing campaign only until CPL reaches target."
- "Lead quality intervention: add pre-qualification question to lead form (suburb, urgency, job type) to improve qualified lead rate."

**Expected report headline:** "Account needs restructuring — geographic targeting and CPL issues are compounding. Pause Hot Water campaign and fix geo first."

**QA pass criterion:** Score 35–50 (Red or Orange). Hot Water Systems flagged as critical. Geographic targeting issue identified. Effective qualified CPL calculated correctly at $183.15 (±$5). UTMs flagged as critical.

---

## Using These Datasets for Regression Testing

After any change to the audit skill or health score formula, re-run all 5 datasets and confirm:
1. Each score is within ±5 of the expected range
2. The band (Green/Yellow/Orange/Red) matches
3. The top 3 findings match expected findings for that dataset
4. The key calculated values (CPL, ROAS, effective CPL) match expected values exactly

If a dataset produces a different band or different critical findings, treat it as a High severity defect and investigate before releasing.
