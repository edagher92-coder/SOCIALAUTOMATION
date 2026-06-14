# Metric Calculation Tests — AdPilot OS

**Version:** 1.0.0
**Last updated:** 2026-06-14
**Purpose:** Concrete numeric test cases with exact expected outputs. Use these to verify Google Sheets formulas and Claude audit outputs. All values are deterministic — deviation = fail.

---

## 1. Core Metric Calculations

### Test Case MC-01: Click-Through Rate (CTR)

**Input:**
- Clicks: 4,200
- Impressions: 280,000

**Formula:** CTR = (Clicks ÷ Impressions) × 100

**Calculation:**
```
CTR = (4,200 ÷ 280,000) × 100
CTR = 0.015 × 100
CTR = 1.50%
```

**Expected output:** 1.50%
**Sheets cell formula:** `=B2/C2*100` (where B2 = clicks, C2 = impressions)
**Pass criterion:** Cell displays exactly 1.50 (formatted as %)

---

### Test Case MC-02: Cost Per Click (CPC)

**Input:**
- Spend: $2,100
- Clicks: 4,200

**Formula:** CPC = Spend ÷ Clicks

**Calculation:**
```
CPC = $2,100 ÷ 4,200
CPC = $0.50
```

**Expected output:** $0.50
**Pass criterion:** Cell displays exactly 0.50 (AUD)

---

### Test Case MC-03: Cost Per Thousand Impressions (CPM)

**Input:**
- Spend: $2,100
- Impressions: 280,000

**Formula:** CPM = (Spend ÷ Impressions) × 1,000

**Calculation:**
```
CPM = ($2,100 ÷ 280,000) × 1,000
CPM = 0.0075 × 1,000
CPM = $7.50
```

**Expected output:** $7.50
**Pass criterion:** Cell displays exactly 7.50 (AUD)

---

### Test Case MC-04: Cost Per Lead (CPL)

**Input:**
- Spend: $1,500
- Leads: 12

**Formula:** CPL = Spend ÷ Leads

**Calculation:**
```
CPL = $1,500 ÷ 12
CPL = $125.00
```

**Expected output:** $125.00
**Pass criterion:** Cell displays exactly 125.00 (AUD)

---

### Test Case MC-05: Cost Per Acquisition (CPA)

**Input:**
- Spend: $8,000
- Conversions: 118

**Formula:** CPA = Spend ÷ Conversions

**Calculation:**
```
CPA = $8,000 ÷ 118
CPA = $67.796...
```

**Expected output:** $67.80 (rounded to 2 decimal places)
**Pass criterion:** Cell displays 67.80 (AUD, rounded to 2dp)

---

### Test Case MC-06: Return on Ad Spend (ROAS)

**Input:**
- Revenue attributed to ads: $16,800
- Ad spend: $5,000

**Formula:** ROAS = Revenue ÷ Spend

**Calculation:**
```
ROAS = $16,800 ÷ $5,000
ROAS = 3.36
```

**Expected output:** 3.36
**Pass criterion:** Cell displays exactly 3.36 (not 3.4 or 3.360)

---

### Test Case MC-07: Marketing Efficiency Ratio (MER)

**Input:**
- Total revenue (all channels): $45,000
- Total marketing spend (all channels): $9,800

**Formula:** MER = Total Revenue ÷ Total Marketing Spend

**Calculation:**
```
MER = $45,000 ÷ $9,800
MER = 4.591836...
```

**Expected output:** 4.59 (rounded to 2 decimal places)
**Pass criterion:** Cell displays 4.59

---

### Test Case MC-08: Hook Rate (TikTok / Video)

**Input:**
- 3-second video views: 85,000
- Impressions: 380,000

**Formula:** Hook Rate = (3-second views ÷ Impressions) × 100

**Calculation:**
```
Hook Rate = (85,000 ÷ 380,000) × 100
Hook Rate = 0.22368... × 100
Hook Rate = 22.37%
```

**Expected output:** 22.37%
**Pass criterion:** Cell displays 22.37 (formatted as %)

---

### Test Case MC-09: Hold Rate (Video Completion)

**Input:**
- Video completion views (100% watched): 24,000
- 3-second views: 85,000

**Formula:** Hold Rate = (Completion views ÷ 3-second views) × 100

**Calculation:**
```
Hold Rate = (24,000 ÷ 85,000) × 100
Hold Rate = 0.28235... × 100
Hold Rate = 28.24%
```

**Expected output:** 28.24%
**Pass criterion:** Cell displays 28.24 (formatted as %)

---

### Test Case MC-10: Break-Even CPA

**Input:**
- Average order value (AOV): $185
- Gross margin: 42%

**Formula:** Break-even CPA = AOV × Gross margin %

**Calculation:**
```
Break-even CPA = $185 × 0.42
Break-even CPA = $77.70
```

**Expected output:** $77.70
**Pass criterion:** Cell displays 77.70 (AUD)

---

### Test Case MC-11: Break-Even ROAS

**Input:**
- Gross margin: 42%

**Formula:** Break-even ROAS = 1 ÷ Gross margin %

**Calculation:**
```
Break-even ROAS = 1 ÷ 0.42
Break-even ROAS = 2.380952...
```

**Expected output:** 2.38 (rounded to 2dp)
**Pass criterion:** Cell displays 2.38

---

### Test Case MC-12: Effective Qualified CPL

**Input:**
- Raw CPL: $71.43
- Lead qualification rate: 39%

**Formula:** Effective qualified CPL = Raw CPL ÷ Lead qualification rate

**Calculation:**
```
Effective qualified CPL = $71.43 ÷ 0.39
Effective qualified CPL = $183.1538...
```

**Expected output:** $183.15 (rounded to 2dp)
**Pass criterion:** Cell displays 183.15 (AUD)

---

### Test Case MC-13: CPA vs. Target Variance (%)

**Input:**
- Actual CPA: $67.80
- Target CPA: $40.00

**Formula:** Variance % = ((Actual CPA − Target CPA) ÷ Target CPA) × 100

**Calculation:**
```
Variance = (($67.80 − $40.00) ÷ $40.00) × 100
Variance = ($27.80 ÷ $40.00) × 100
Variance = 0.695 × 100
Variance = 69.5%
```

**Expected output:** +69.5% (positive = over target = bad for CPA)
**Pass criterion:** Cell displays 69.5 (formatted as %, with + sign if the account is over-target)

---

### Test Case MC-14: ROAS vs. Target Variance (%)

**Input:**
- Actual ROAS: 2.1
- Target ROAS: 3.0

**Formula:** Variance % = ((Actual ROAS − Target ROAS) ÷ Target ROAS) × 100

**Calculation:**
```
Variance = ((2.1 − 3.0) ÷ 3.0) × 100
Variance = (−0.9 ÷ 3.0) × 100
Variance = −0.30 × 100
Variance = −30.0%
```

**Expected output:** -30.0% (negative = below target = bad for ROAS)
**Pass criterion:** Cell displays -30.0 (formatted as %, negative value)

---

## 2. Worked Health Score Calculation

### Test Case HS-01: Full Health Score — Fatigued Account

This is the reference calculation for the Fatigued Account (Dataset 2). Run this to verify the health score formula is producing correct weighted output.

**Input data (from Dataset 2):**
- Actual CPA: $67.80
- Target CPA: $40.00
- CPA variance: +69.5% above target
- Actual ROAS: 2.1
- Target ROAS: 3.0
- ROAS variance: -30.0% below target
- Primary creative frequency: 5.1 (days in flight: 67)
- CTR: 0.91% (account average)
- Tracking: All pixels firing correctly; 75% UTM coverage (1 missing from 4 active ads)
- Naming conventions: Inconsistent (3 of 6 campaigns follow format)
- Budget allocation: 2 campaigns with sub-threshold data (under 20 clicks each in ad set B)
- Lead quality: N/A (ecom account — skip component, redistribute weight)

---

### Health Score Calculation (Step by Step)

**Component 1: Tracking Quality (Weight: 15%)**
- Pixel: Firing correctly on purchase event = full marks on event accuracy
- UTM coverage: 75% (3 of 4 campaigns tagged) — below 100% threshold
- Individual component score: 75 (UTM gap reduces from 100; pixel is clean)
- Weighted contribution: 75 × 0.15 = **11.25 points**

**Component 2: CPA vs. Target (Weight: 15%)**
- Actual CPA: $67.80 vs. Target: $40.00 = +69.5% over target
- Scoring model: 0% over = 100; 10% over = 80; 25% over = 60; 50% over = 35; 75%+ over = 10
- At 69.5% over target → score interpolates between 35 (50% over) and 10 (75%+ over)
- Interpolation: 35 + ((75 - 69.5) / (75 - 50)) × (35 - 10) = 35 - (5.5/25) × 25 = 35 - 5.5 = 29.5 → round to 30
- Individual component score: 30
- Weighted contribution: 30 × 0.15 = **4.50 points**

**Component 3: Spend Efficiency (Weight: 12%)**
- Budget fragmentation: 2 sub-threshold ad sets out of 6 = 33% fragmented
- Audience overlap: 3 overlapping ad sets detected
- Individual component score: 22
- Weighted contribution: 22 × 0.12 = **2.64 points**

**Component 4: Conversion Rate (Weight: 10%)**
- Conversion rate: 118 conversions from 5,868 clicks = 2.01%
- Ecom benchmark: 1.5–3.0% is acceptable. 2.01% is within range.
- No data confidence penalty (pixel is clean)
- Individual component score: 58
- Weighted contribution: 58 × 0.10 = **5.80 points**

**Component 5: CTR (Weight: 8%)**
- Account average CTR: 0.91%
- Meta benchmark for feed ads: 1.0–2.0% is healthy; below 0.8% is poor; 0.8–1.0% is below average
- At 0.91%, this is in "below average" territory — heavily dragged by fatigued creative
- Individual component score: 38
- Weighted contribution: 38 × 0.08 = **3.04 points**

**Component 6: Creative Freshness (Weight: 8%)**
- Primary creative: 67 days in flight, frequency 5.1
- Secondary creative: 54 days in flight, frequency 4.8
- Both primary creatives are severely fatigued. No new creative tested in the period.
- Individual component score: 10 (near-floor — both creatives are burned out)
- Weighted contribution: 10 × 0.08 = **0.80 points**

**Component 7: Lead Quality (Weight: 8%)**
- Not applicable for ecom account (no lead quality data)
- Weight redistributed equally across components 8–10 (adds 2.67% to each)
- Adjusted weights: ROAS = 10.67%, Account Structure = 10.67%, Budget Pacing = 10.67%

**Component 8: ROAS / MER (Weight: 8%, adjusted to 10.67%)**
- Actual ROAS: 2.1 vs. Target ROAS: 3.0 = -30% below target
- Scoring model: At target = 100; 10% below = 75; 20% below = 50; 30% below = 30; 40%+ below = 10
- At -30% below target → score = 30
- Individual component score: 30
- Weighted contribution: 30 × 0.1067 = **3.20 points**

**Component 9: Account Structure (Weight: 8%, adjusted to 10.67%)**
- Naming conventions: 3 of 6 campaigns compliant (50%)
- Audience overlap: 3 overlapping ad sets
- Campaign hierarchy: acceptable (3 campaigns, logical split)
- Individual component score: 35
- Weighted contribution: 35 × 0.1067 = **3.73 points**

**Component 10: Budget Pacing (Weight: 8%, adjusted to 10.67%)**
- Total monthly budget: $8,000
- Total spend in period: $8,000 (exactly on budget)
- Pacing: On track — 100% of budget used in the period
- Individual component score: 85 (slight deduction for fragmented allocation, but pacing itself is on-track)
- Weighted contribution: 85 × 0.1067 = **9.07 points**

---

### Health Score Total

| Component | Individual Score | Weight | Weighted Points |
|-----------|----------------|--------|----------------|
| 1. Tracking Quality | 75 | 15.00% | 11.25 |
| 2. CPA vs. Target | 30 | 15.00% | 4.50 |
| 3. Spend Efficiency | 22 | 12.00% | 2.64 |
| 4. Conversion Rate | 58 | 10.00% | 5.80 |
| 5. CTR | 38 | 8.00% | 3.04 |
| 6. Creative Freshness | 10 | 8.00% | 0.80 |
| 7. Lead Quality | N/A (weight distributed) | — | — |
| 8. ROAS / MER | 30 | 10.67% | 3.20 |
| 9. Account Structure | 35 | 10.67% | 3.73 |
| 10. Budget Pacing | 85 | 10.67% | 9.07 |
| **TOTAL** | | **100.01%*** | **44.03** |

*0.01% rounding artefact — acceptable*

**Final health score: 44 / 100**
**Band: Orange (40–59)**
**Label: "Account Needs Work — Significant structural and performance issues. Action required this week."**

**QA pass criterion for this test case:**
- Claude audit output states a score between 39 and 49 (±5 of 44)
- Band is Orange
- Creative freshness is flagged as Critical or High
- CPA overshoot is flagged as Critical or High
- Tracking quality is NOT flagged as critical (pixel is clean; only UTM gap is medium)

---

## 3. Edge Case Calculations

### Test Case EC-01: Zero Conversions (division-by-zero protection)

**Input:**
- Spend: $800
- Conversions: 0

**Expected behaviour:** CPA field should display "N/A" or "Insufficient data" — not a division error (#DIV/0! is a Sheets failure).

**Sheets formula:** `=IF(D2=0,"N/A",C2/D2)` (where D2 = conversions, C2 = spend)

**Pass criterion:** Cell displays "N/A" not "#DIV/0!" when conversions = 0.

---

### Test Case EC-02: Very High ROAS (outlier detection)

**Input:**
- Revenue: $50,000
- Spend: $500

**Calculated ROAS:** $50,000 ÷ $500 = 100

**Expected behaviour:** Claude should flag a ROAS of 100 as a likely tracking anomaly (pixel firing multiple times, attribution window mismatch, or inflated conversion values). A ROAS of 100 is almost never real for a mature ecom account.

**Expected output:** "ROAS of 100.0 detected — this is likely a tracking anomaly. Recommend verifying pixel configuration and conversion event values before acting on this number."

**Pass criterion:** Audit flags the anomaly. Does NOT simply report "ROAS = 100, account is performing exceptionally well" without a data-quality check.

---

### Test Case EC-03: Frequency Below 1.0

**Input:**
- Frequency: 0.3

**Context:** A new campaign that launched 2 days ago.

**Expected behaviour:** Health score does not penalise frequency below 1.0 — it simply notes that the campaign is too new for frequency-based analysis. Do NOT flag frequency of 0.3 as "abnormally low" in a way that would alarm the user.

**Expected output:** "Campaign launched recently — insufficient data for frequency/fatigue analysis. Re-evaluate in 7 days."

---

### Test Case EC-04: Budget Below Threshold for Statistical Confidence

**Input:**
- Ad set spend: $38
- Ad set clicks: 7
- Ad set conversions: 1
- Ad set CPA: $38

**Expected behaviour:** Ad set with only 1 conversion and 7 clicks has no statistical confidence. CPA of $38 cannot be used for scaling decisions. System must flag this.

**Expected output:** "Ad set has insufficient data (1 conversion, 7 clicks). CPA of $38.00 is not statistically reliable. Minimum threshold for confidence: 20 clicks and 5 conversions. Do not scale or cut based on this data — allow more spend to accumulate."

**Pass criterion:** System explicitly states the data is below the minimum threshold for reliable analysis.

---

## 4. Multi-Platform Combined Metric Tests

### Test Case MP-01: Blended CPA (Meta + TikTok)

**Input:**
- Meta spend: $5,000 / Meta conversions: 148
- TikTok spend: $4,500 / TikTok conversions: 130

**Formula:** Blended CPA = Total spend ÷ Total conversions

**Calculation:**
```
Total spend = $5,000 + $4,500 = $9,500
Total conversions = 148 + 130 = 278
Blended CPA = $9,500 ÷ 278 = $34.17
```

**Expected output:** $34.17
**Pass criterion:** Cell displays 34.17 (AUD)

---

### Test Case MP-02: Platform Efficiency Comparison

**Input:**
- Meta CPA: $33.78
- TikTok CPA: $36.59
- Target CPA: $38.00

**Expected analysis:**
- Both platforms are performing at or below target CPA
- Meta CPA is 11.1% below target (($33.78 - $38.00) / $38.00 × 100 = -11.1%)
- TikTok CPA is 3.7% below target (($36.59 - $38.00) / $38.00 × 100 = -3.7%)
- Meta is more efficient by $2.81 per conversion
- Recommendation: If scaling, Meta prospecting has more headroom

**Pass criterion:** Claude correctly identifies Meta as more efficient and quantifies the difference as approximately $2.81 per conversion.

---

## 5. Audit Trail — Test Run Log Template

QA testers should complete this log for each test run:

| Test Case ID | Date | Tester | Input Dataset | Expected Output | Actual Output | Pass/Fail | Notes |
|-------------|------|--------|--------------|----------------|---------------|-----------|-------|
| MC-01 | | | | 1.50% | | | |
| MC-02 | | | | $0.50 | | | |
| MC-03 | | | | $7.50 | | | |
| MC-04 | | | | $125.00 | | | |
| MC-05 | | | | $67.80 | | | |
| MC-06 | | | | 3.36 | | | |
| MC-07 | | | | 4.59 | | | |
| MC-08 | | | | 22.37% | | | |
| MC-09 | | | | 28.24% | | | |
| MC-10 | | | | $77.70 | | | |
| MC-11 | | | | 2.38 | | | |
| MC-12 | | | | $183.15 | | | |
| MC-13 | | | | +69.5% | | | |
| MC-14 | | | | -30.0% | | | |
| HS-01 | | | Dataset 2 | 44 ± 5, Orange | | | |
| EC-01 | | | 0 conversions | "N/A" | | | |
| EC-02 | | | ROAS 100 | Anomaly flag | | | |
| EC-03 | | | Freq 0.3 | Insufficient data | | | |
| EC-04 | | | 1 conversion | Below threshold | | | |
| MP-01 | | | | $34.17 | | | |
| MP-02 | | | | Meta more efficient | | | |
