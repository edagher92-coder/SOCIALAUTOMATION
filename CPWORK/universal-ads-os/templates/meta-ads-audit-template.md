# AdPilot OS — Meta Ads Audit Template

> **Safety:** This audit produces proposals and paused duplicates only. No live ads are edited. No deletions.
> `live_edit_block: true` | `use_paused_duplicates_only: true`

**Business:** {{client.business_name}}
**Audit Date:** ____________________
**Audit Period:** ____________________ to ____________________
**Prepared By:** ____________________
**Ad Account Reviewed:** _(reference only — no IDs stored here)_

---

## Section 1 — Campaign Structure

### 1.1 Objective
| | |
|---|---|
| **Status** | [ ] OK [ ] Watch [ ] Fix |
| **Expected** | Objective matches {{client.primary_goal}} (e.g. Leads, Purchases, Traffic) |
| **Observed** | ____________________ |
| **Notes** | ____________________ |

### 1.2 Campaign Naming Convention
| | |
|---|---|
| **Status** | [ ] OK [ ] Watch [ ] Fix |
| **Standard** | `{business}_{offer}_{objective}_{location}_{YYYYMMDD}` |
| **Observed** | ____________________ |
| **Notes** | ____________________ |

### 1.3 Ad Set Naming Convention
| | |
|---|---|
| **Status** | [ ] OK [ ] Watch [ ] Fix |
| **Standard** | `{audience_type}_{age}_{placement}_{YYYYMMDD}` |
| **Observed** | ____________________ |
| **Notes** | ____________________ |

### 1.4 Ad Naming Convention
| | |
|---|---|
| **Status** | [ ] OK [ ] Watch [ ] Fix |
| **Standard** | `{creative_angle}_{format}_{version}` |
| **Observed** | ____________________ |
| **Notes** | ____________________ |

---

## Section 2 — Budget & Bidding

### 2.1 Budget Setup (CBO vs ABO)
| | |
|---|---|
| **Status** | [ ] OK [ ] Watch [ ] Fix |
| **Monthly Budget** | {{client.monthly_budget}} |
| **Current Setup** | ____________________ |
| **Pacing** | On track [ ] / Over [ ] / Under [ ] |
| **Notes** | ____________________ |

### 2.2 Bid Strategy
| | |
|---|---|
| **Status** | [ ] OK [ ] Watch [ ] Fix |
| **Observed** | ____________________ |
| **Notes** | ____________________ |

---

## Section 3 — Targeting

### 3.1 Audience Definition
| | |
|---|---|
| **Status** | [ ] OK [ ] Watch [ ] Fix |
| **Target Audience** | {{client.target_audience}} |
| **Audience Size** | ____________________ |
| **Overlap Issues** | Yes [ ] / No [ ] |
| **Notes** | ____________________ |

### 3.2 Placements
| | |
|---|---|
| **Status** | [ ] OK [ ] Watch [ ] Fix |
| **Setup** | Advantage+ [ ] / Manual [ ] |
| **Placements Active** | ____________________ |
| **Notes** | ____________________ |

### 3.3 Optimisation Event
| | |
|---|---|
| **Status** | [ ] OK [ ] Watch [ ] Fix |
| **Expected** | {{client.conversion_events}} |
| **Observed** | ____________________ |
| **Sufficient Signal (50+ events/week)** | Yes [ ] / No [ ] |
| **Notes** | ____________________ |

---

## Section 4 — Creative

### 4.1 Creative Format Mix
| | |
|---|---|
| **Status** | [ ] OK [ ] Watch [ ] Fix |
| **Formats Present** | Image [ ] Video [ ] Carousel [ ] Collection [ ] |
| **Notes** | ____________________ |

### 4.2 Ad Copy
| | |
|---|---|
| **Status** | [ ] OK [ ] Watch [ ] Fix |
| **Brand Voice Match** | {{client.brand_voice}} — Yes [ ] / No [ ] |
| **Primary Text Hooks** | ____________________ |
| **Notes** | ____________________ |

### 4.3 Call to Action (CTA)
| | |
|---|---|
| **Status** | [ ] OK [ ] Watch [ ] Fix |
| **CTA Used** | ____________________ |
| **Matches Offer** | Yes [ ] / No [ ] |
| **Notes** | ____________________ |

### 4.4 Destination URL
| | |
|---|---|
| **Status** | [ ] OK [ ] Watch [ ] Fix |
| **URL Loads** | Yes [ ] / No [ ] |
| **Mobile-Friendly** | Yes [ ] / No [ ] |
| **Notes** | ____________________ |

### 4.5 UTM Tracking
| | |
|---|---|
| **Status** | [ ] OK [ ] Watch [ ] Fix |
| **UTMs Present** | Yes [ ] / No [ ] |
| **Format Correct** | Yes [ ] / No [ ] |
| **Notes** | ____________________ |

---

## Section 5 — Pixel & Events

### 5.1 Pixel / Conversions API Status
| | |
|---|---|
| **Status** | [ ] OK [ ] Watch [ ] Fix |
| **Pixel Firing** | Yes [ ] / No [ ] |
| **CAPI Active** | Yes [ ] / No [ ] |
| **Event Match Quality Score** | ____________________ / 10 |
| **Notes** | ____________________ |

### 5.2 Conversion Event Quality
| | |
|---|---|
| **Status** | [ ] OK [ ] Watch [ ] Fix |
| **Events Firing Correctly** | ____________________ |
| **Duplicate Events** | Yes [ ] / No [ ] |
| **Notes** | ____________________ |

---

## Section 6 — Performance Metrics

> Formulas: CTR = clicks/impressions | CPC = spend/clicks | CPM = spend/impressions×1000 | CPL = spend/leads | CPA = spend/purchases | ROAS = revenue/spend | Break-even CPA = {{client.average_sale_value}} × {{client.gross_margin}} | Break-even ROAS = 1/{{client.gross_margin}}

### 6.1 Spend
| Metric | Value | Benchmark | Status |
|--------|-------|-----------|--------|
| Total Spend (period) | $____ | Budget: {{client.monthly_budget}} | [ ] OK [ ] Watch [ ] Fix |
| Daily Average Spend | $____ | ____ | [ ] OK [ ] Watch [ ] Fix |

### 6.2 Reach & Frequency
| Metric | Value | Benchmark | Status |
|--------|-------|-----------|--------|
| Reach | ____ | — | — |
| Impressions | ____ | — | — |
| Frequency | ____ | < 3.5 ideally | [ ] OK [ ] Watch [ ] Fix |

### 6.3 Click Metrics
| Metric | Value | Benchmark | Status |
|--------|-------|-----------|--------|
| Clicks | ____ | — | — |
| CTR | ____% | > 1% (cold) | [ ] OK [ ] Watch [ ] Fix |
| CPC | $____ | < $____ | [ ] OK [ ] Watch [ ] Fix |
| CPM | $____ | ____ | [ ] OK [ ] Watch [ ] Fix |
| Landing Page Views | ____ | — | — |

### 6.4 Conversion Metrics
| Metric | Value | Benchmark | Status |
|--------|-------|-----------|--------|
| Leads | ____ | — | — |
| CPL | $____ | Break-even: $____ | [ ] OK [ ] Watch [ ] Fix |
| Purchases | ____ | — | — |
| CPA | $____ | Break-even: $____ | [ ] OK [ ] Watch [ ] Fix |
| Revenue | $____ | — | — |
| ROAS | ____ | Break-even: ____ | [ ] OK [ ] Watch [ ] Fix |

### 6.5 Lead Quality
| Metric | Value | Notes |
|--------|-------|-------|
| Lead Quality Score (avg) | ____ / 100 | From lead-quality-scorecard |
| Contactable Rate | ____% | ____________________ |
| Qualified Rate | ____% | ____________________ |
| Lead-to-Sale Rate | ____% | ____________________ |

---

## Section 7 — Recommendations

> All recommendations below are **proposals only**. Changes ship as paused duplicates. Nothing goes live without approval.

### Priority 1 — Fix Now
1. ____________________
2. ____________________
3. ____________________

### Priority 2 — Improve This Week
1. ____________________
2. ____________________
3. ____________________

### Priority 3 — Test & Optimise
1. ____________________
2. ____________________

---

## Summary

**Overall Account Health:** [ ] Green (80–100) [ ] Yellow (60–79) [ ] Orange (40–59) [ ] Red (0–39)
**Health Score:** ____ / 100
**Top Win:** ____________________
**Top Problem:** ____________________
**One Thing to Fix First:** ____________________

---

_Prepared using AdPilot OS. No account credentials stored in this document._
