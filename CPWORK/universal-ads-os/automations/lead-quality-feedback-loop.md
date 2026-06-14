# Lead Quality Feedback Loop — AdPilot OS

**Purpose:** Close the gap between cheap leads and good leads. Sales outcomes (won/lost, sale value, close time) flow back from the CRM to update each lead's `lead_quality_score` in the Lead Quality tab, enabling true CPA and ROAS calculations that account for lead quality — not just lead volume.

---

## Safety Rules (mandatory)

- `live_edit_block: true` — this loop reads from CRM and writes to the Lead Quality tab only. No ad platform writes occur.
- `use_paused_duplicates_only: true` — any ad-level action recommended by this loop is a paused proposal only.
- No API keys, tokens, or PII (full email, phone) are written to the Sheet. Use email_hash and lead_id as identifiers.
- Revenue and sale values written to Sheets are numeric only — no client names, invoice details, or personal data.
- CRM integration uses least-privilege API scopes: read contacts + deals + deal stage. No CRM write scopes needed for this loop (reads only from CRM; writes to Sheets only).

---

## The Problem This Loop Solves

Standard ad reporting shows **cost per lead** — but a AUD 5 lead that never closes is worth less than a AUD 80 lead that converts to a AUD 3,000 sale.

Without the feedback loop, the optimization signal is:
> "Meta Campaign A has CPL AUD 42 → better than Campaign B at CPL AUD 78."

With the feedback loop, the optimization signal becomes:
> "Meta Campaign A has CPL AUD 42, close rate 8%, true CPA AUD 525.  
> Meta Campaign B has CPL AUD 78, close rate 35%, true CPA AUD 223.  
> Campaign B is 2.4x more profitable despite higher CPL."

This is the difference between optimising for cheap leads and optimising for profitable customers.

---

## Data Flow

```
[Ad Platform: Meta / TikTok]
    ↓ lead form submission
[Lead Capture Webhook / Zapier / Make / n8n]
    ↓ write to
[CRM: {{client.crm}}]       [Lead Quality Tab: Google Sheets]
    |                                 ↑
    | deal progresses                 |
    | stage changes                   |
    | deal closed (won/lost)          |
    ↓                                 |
[CRM Status Change Webhook]           |
    ↓ read deal: value, stage, date   |
[Lead Quality Update Workflow]  ──────┘
    ↓ update
[Lead Quality Tab: lead_quality_score, sale_value, status, closed_date]
    ↓ aggregated by
[skills: dana / riley]
    ↓ outputs
[True CPA by Campaign, True ROAS by Campaign, Lead Quality Score by Ad]
```

---

## Lead Quality Score (LQS) Definition

`lead_quality_score` is a 0–10 integer score assigned to each lead after CRM outcome is known.

### Scoring Model

| Outcome | Base Score | Modifier |
|---|---|---|
| Closed Won | 7 | +1 if sale_value > avg_sale_value; -1 if sale_value < 50% avg |
| Closed Won (fast — under 7 days) | 8 | +1 if sale_value > avg_sale_value |
| Proposal Sent / In Progress | 4 | Updated if deal closes later |
| Not Qualified | 2 | Lead entered CRM but disqualified by sales |
| No Response (ghost) | 1 | Lead never responded to contact |
| Closed Lost | 2 | Lost to competitor or pricing |
| Refund / Chargeback | 0 | Forced return of sale |
| Not yet resolved (default) | null | Not scored until outcome known |

Score is capped at 10. Score is an integer.

**Example calculation:**
- Sale value AUD 3,200; avg sale value AUD 2,100; outcome = Closed Won (8 days)
- Base: 7 (Closed Won). Modifier: +1 (sale_value > avg). Fast close: no (>7 days). Score = 8.

### When to Score

- Score is populated when `status` changes to a terminal state: `closed_won`, `closed_lost`, `not_qualified`, `no_response`
- Score is UPDATED (not locked) if status changes again (e.g., lost deal is re-opened and won)
- Score remains `null` for leads still in pipeline (do not score active deals)

---

## True CPA Calculation

True CPA differs from reported CPA:

```
reported_cpa = spend / leads                   -- what the platform shows
true_cpa     = spend / qualified_leads         -- using only LQS >= 5
best_cpa     = spend / closed_won_leads        -- using only won deals

true_cpa_revenue_weighted = spend / (closed_won_leads * avg_sale_value / avg_sale_value)
```

Fields computed in the Lead Quality aggregation:
- `qualified_leads` = COUNT(leads WHERE lead_quality_score >= 5)
- `won_leads` = COUNT(leads WHERE status = 'closed_won')
- `total_won_revenue` = SUM(sale_value WHERE status = 'closed_won')
- `true_cpa` = spend / won_leads
- `true_roas` = total_won_revenue / spend
- `avg_lqs` = AVG(lead_quality_score) WHERE lead_quality_score IS NOT NULL
- `close_rate` = won_leads / total_leads * 100

These are computed in the Lead Quality tab using SUMIF/COUNTIF formulas grouped by `campaign_id` and `ad_id`.

---

## Lead Quality Tab Schema

One row per lead. Columns:

| Column | Type | Source | Notes |
|---|---|---|---|
| timestamp | datetime | webhook | When lead was received |
| lead_id | string | platform | Meta lead_id or TikTok lead_id |
| business_id | string | config | |
| platform | string | webhook | meta / tiktok |
| campaign_id | string | webhook | |
| adset_id | string | webhook | |
| ad_id | string | webhook | |
| form_id | string | webhook | |
| first_name | string | webhook | Not hashed; visible to operator |
| email_hash | string | webhook | SHA-256(email) — no raw email in Sheet |
| phone_hash | string | webhook | SHA-256(phone) |
| crm_contact_id | string | CRM | Set after CRM write; used for status lookup |
| crm_deal_id | string | CRM | Set after deal created in CRM |
| lead_quality_score | integer 0–10 | computed | Null until resolved |
| status | string | CRM | new / contacted / proposal / closed_won / closed_lost / not_qualified / no_response |
| sale_value_aud | decimal | CRM | AUD; 0 if no sale |
| gross_profit_aud | decimal | computed | sale_value * gross_margin |
| closed_date | date | CRM | |
| days_to_close | integer | computed | closed_date - timestamp |
| attribution_window_days | integer | config | e.g. 7 or 28 |
| notes | string | operator | |

---

## CRM Status Sync Workflow

### Trigger Options

1. **CRM Webhook (preferred):** CRM sends a webhook to AdPilot OS on every deal stage change
2. **Scheduled CRM Poll (fallback):** Query CRM API daily for deals changed in last 24 hours
3. **Manual CRM Export + CSV Upload:** Operator exports CRM deal list weekly, uploads to Lead Quality tab

### Webhook-Based Sync (Option 1)

When the CRM fires a deal stage change webhook:

```
[CRM Webhook: deal.stage_changed]
    → [Parse: extract crm_deal_id, new_stage, deal_value, contact_id]
    → [Lookup: find matching row in Lead Quality tab by crm_deal_id]
    → [IF: stage is terminal (closed_won / closed_lost / not_qualified)]
        → [Compute: lead_quality_score using scoring model above]
        → [Google Sheets: Update row — status, sale_value_aud, closed_date, days_to_close, lead_quality_score]
    → [IF: stage is in-progress]
        → [Google Sheets: Update row — status only]
```

### Scheduled Poll (Option 2 — HubSpot example)

```javascript
// n8n Function node: Query HubSpot for deals updated in last 24 hours
// Scope: crm.objects.deals.read — read only
// No write access to HubSpot required from this side

const since = new Date(Date.now() - 24*60*60*1000).toISOString();
const url = `https://api.hubapi.com/crm/v3/objects/deals/search`;
const body = {
  filterGroups: [{
    filters: [{ propertyName: 'hs_lastmodifieddate', operator: 'GTE', value: since }]
  }],
  properties: ['dealname', 'dealstage', 'amount', 'closedate', 'hs_deal_stage_probability',
                'hubspot_owner_id', 'associations'],
  limit: 100
};
// Returns updated deals → match to Lead Quality tab by crm_deal_id → update score
```

---

## Aggregation for Reporting

The Lead Quality tab feeds summary computations for reporting. These are computed by QUERY/SUMIF in the Lead Quality tab itself, and read by dana/riley:

### By Campaign (SUMIF aggregation)

| Metric | Formula |
|---|---|
| total_leads | COUNTIF(campaign_id = X) |
| won_leads | COUNTIFS(campaign_id = X, status = "closed_won") |
| close_rate_pct | won_leads / total_leads * 100 |
| avg_lqs | AVERAGEIFS(lqs, campaign_id = X, lqs <> "") |
| total_won_revenue | SUMIFS(sale_value, campaign_id = X, status = "closed_won") |
| spend | (from Raw Data SUMIF by campaign_id) |
| true_cpa | spend / won_leads |
| true_roas | total_won_revenue / spend |

### By Ad

Same aggregation at `ad_id` level. Allows dana to compare ads not just on reported CPL but on true close rate and LQS.

---

## Attribution Window Consideration

Leads take time to close. A lead from Campaign A today may close in 60 days. Consider:

- Default attribution window for quality scoring: 30 days
- If a lead is still open at 30 days: score it as `in_progress` (LQS = 4) for interim reporting
- Re-score when it closes
- This means weekly reports show "preliminary" true CPA for recent leads, updated as deals close

In the report, include:
```
Note: True CPA figures are based on leads with a known outcome. 
{{pct_unresolved}}% of leads in this period are still in pipeline 
and will update the true CPA figure as deals close.
```

---

## Feedback into Ad Optimisation

The lead quality data feeds back into ad optimisation in the following ways (all as proposals):

1. **Audience proposal:** "Ad Set X generates LQS avg 7.2 vs Ad Set Y LQS avg 3.1 — propose testing Ad Set X's audience structure on Ad Set Y's creative. [PROPOSAL]"

2. **Creative proposal:** "Video ad 'Testimonial V2' drives 3.2x higher close rate than 'Product Demo V1' despite 40% higher CPL. Propose shifting budget toward Testimonial V2. [PROPOSAL]"

3. **Offline conversion upload (proposal):** "Upload won deal data as offline conversion events to Meta and TikTok to train the algorithm on high-LQS customers. See crm-api-plan.md. [PROPOSAL — requires review of data privacy obligations before implementation]"

---

## Data Privacy Notes

- Full email and phone are never written to Google Sheets — SHA-256 hashes only
- Raw PII stays in the CRM system only
- `sale_value_aud` and outcome data are written as numeric values — no personal identifiers alongside sale amounts
- If the client operates under Australian Privacy Act or other legislation, review with legal before logging deal values in Sheets, even without direct PII
- Offline conversion uploads to Meta/TikTok using hashed email/phone are subject to Meta's data sharing terms and TikTok's privacy policy — operator must confirm compliance before enabling
