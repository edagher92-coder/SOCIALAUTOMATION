# TikTok Marketing API Integration Plan — AdPilot OS

---

## Safety Model (mandatory)

- `live_edit_block: true` — this integration may READ campaign/ad data and ALERT only. No ad platform writes occur automatically.
- `use_paused_duplicates_only: true` — any new ad created via API must have `operation_status: DISABLE` (TikTok's equivalent of paused). No live ad is published automatically.
- No deletion of campaigns, ad groups, or ads. Status change to `DELETED` is not permitted. `DISABLE` (pause) is the only reversible status action.
- Budget changes require a human typed YES before execution — same guard pattern as Meta (see meta-api-plan.md).
- Tokens and account IDs stored in environment variables only. Never hardcoded. Use `{{env.TIKTOK_ACCESS_TOKEN}}` and `{{env.TIKTOK_ACCOUNT_ID}}` as references.
- Least-privilege scopes: `report:read` first. `campaign:read`, `adgroup:read`, `ad:read` for management data. `campaign:write`, `adgroup:write`, `ad:write` only if pause/create flow is needed by the human approver.
- Prefer this official API over browser automation of TikTok Ads Manager.

---

## App / Developer Setup

### 1. Create a TikTok for Business App

1. Go to `ads.tiktok.com/marketing_api/apps` (requires a TikTok for Business account)
2. Create App → Select: **Standard Access** for most use cases
3. App name: `AdPilot OS — {{agency_name}}`
4. Category: `Marketing Technology`
5. Note the `App ID` and `App Secret` — store as env vars, never hardcode

### 2. Request Scopes

| Scope | Permission | When Needed |
|---|---|---|
| `report:read` | Pull reporting data | Always (primary analytics scope) |
| `campaign:read` | Read campaigns | Always |
| `adgroup:read` | Read ad groups | Always |
| `ad:read` | Read ads | Always |
| `campaign:write` | Pause/activate campaigns | Approver flow only |
| `adgroup:write` | Pause/activate ad groups | Approver flow only |
| `ad:write` | Pause/activate ads | Approver flow only |
| `offline_data:write` | Upload offline conversions | [PROPOSAL] only — see crm-api-plan.md |

**Principle:** Request only `report:read`, `campaign:read`, `adgroup:read`, `ad:read` in the initial integration. Add write scopes only when the human approver flow is fully built and tested.

### 3. Token Generation

TikTok uses OAuth 2.0 Authorization Code flow for user-facing integrations. For server-side automation, use:

**Option A: Auth Code Flow (standard)**
1. Redirect operator to: `https://ads.tiktok.com/marketing_api/auth?app_id={{APP_ID}}&state={{random}}&redirect_uri={{REDIRECT_URI}}&scope={{scopes}}`
2. Operator authorises → TikTok redirects back with `auth_code`
3. Exchange for access token:
```
POST https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/
Content-Type: application/json

{
  "app_id": "{{env.TIKTOK_APP_ID}}",
  "secret": "{{env.TIKTOK_APP_SECRET}}",
  "auth_code": "{{auth_code}}"
}
```
Response includes: `access_token`, `refresh_token`, `expires_in`, `refresh_token_expires_in`

**Option B: Long-Lived Token (Business Account)**
- TikTok Business Center supports long-lived tokens for automated server use
- Access via Business Center → Integrations → API → Generate Token
- Store: `export TIKTOK_ACCESS_TOKEN="..."`

---

## Core Endpoints

All TikTok Marketing API endpoints use:
- Base URL: `https://business-api.tiktok.com/open_api/v1.3/`
- Auth header: `Access-Token: {{env.TIKTOK_ACCESS_TOKEN}}`
- Content-Type: `application/json`
- Method: Most endpoints use GET; Reporting uses POST

### Advertiser (Account) Info

```
GET https://business-api.tiktok.com/open_api/v1.3/advertiser/info/
  ?advertiser_ids=["{{env.TIKTOK_ACCOUNT_ID}}"]
  &fields=["advertiser_id","advertiser_name","currency","timezone","status"]
Headers:
  Access-Token: {{env.TIKTOK_ACCESS_TOKEN}}
```

### Campaigns (READ ONLY)

```
GET https://business-api.tiktok.com/open_api/v1.3/campaign/get/
  ?advertiser_id={{env.TIKTOK_ACCOUNT_ID}}
  &fields=["campaign_id","campaign_name","objective_type","status","budget_mode","budget","create_time","modify_time"]
  &page=1&page_size=1000
Headers:
  Access-Token: {{env.TIKTOK_ACCESS_TOKEN}}
```

`objective_type` values: `TRAFFIC`, `CONVERSIONS`, `APP_PROMOTION`, `LEAD_GENERATION`, `ENGAGEMENT`, `REACH`, `VIDEO_VIEWS`

### Ad Groups (READ ONLY)

```
GET https://business-api.tiktok.com/open_api/v1.3/adgroup/get/
  ?advertiser_id={{env.TIKTOK_ACCOUNT_ID}}
  &fields=["adgroup_id","adgroup_name","campaign_id","status","budget_mode","budget",
           "bid_type","bid","optimization_goal","billing_event","targeting"]
  &page=1&page_size=1000
Headers:
  Access-Token: {{env.TIKTOK_ACCESS_TOKEN}}
```

Note: TikTok "Ad Group" = Meta "Ad Set". Map `adgroup_id` → `adset_id` in schema.

### Ads (READ ONLY)

```
GET https://business-api.tiktok.com/open_api/v1.3/ad/get/
  ?advertiser_id={{env.TIKTOK_ACCOUNT_ID}}
  &fields=["ad_id","ad_name","adgroup_id","campaign_id","status","operation_status",
           "creatives","tracking_pixel_id","ad_format"]
  &page=1&page_size=1000
Headers:
  Access-Token: {{env.TIKTOK_ACCESS_TOKEN}}
```

### Reporting — Ad Level Daily (PRIMARY DATA PULL)

TikTok's reporting endpoint uses POST:

```
POST https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/
Headers:
  Access-Token: {{env.TIKTOK_ACCESS_TOKEN}}
  Content-Type: application/json

Body:
{
  "advertiser_id": "{{env.TIKTOK_ACCOUNT_ID}}",
  "report_type": "BASIC",
  "dimensions": ["ad_id", "stat_time_day"],
  "metrics": [
    "spend",
    "impressions",
    "reach",
    "frequency",
    "clicks",
    "ctr",
    "cpc",
    "cpm",
    "conversion",
    "cost_per_conversion",
    "real_time_conversion",
    "video_play_actions",
    "video_watched_2s",
    "video_watched_6s",
    "video_views_p25",
    "video_views_p50",
    "video_views_p75",
    "video_views_p100",
    "comments",
    "shares",
    "likes",
    "profile_visits"
  ],
  "start_date": "{{date_from}}",
  "end_date": "{{date_to}}",
  "data_level": "AUCTION_AD",
  "page": 1,
  "page_size": 1000,
  "order_field": "spend",
  "order_type": "DESC"
}
```

Note: `dimensions` must include `ad_id` for ad-level data. Adding `campaign_id` and `adgroup_id` to dimensions gives the full hierarchy in one call but may not always be supported — test for your account.

---

## Reporting Metrics → Universal Schema Mapping

| TikTok Metric | Universal Schema Field | Notes |
|---|---|---|
| spend | spend | AUD if account currency is AUD |
| impressions | impressions | |
| reach | reach | |
| frequency | frequency | |
| clicks | clicks | TikTok "clicks" = all clicks (use for CTR denominator) |
| ctr | ctr | TikTok returns as decimal fraction (e.g. 0.021) — confirm; if %, divide by 100 |
| cpc | cpc | AUD |
| cpm | cpm | AUD |
| conversion (lead event) | leads | Filter by conversion event type if account has multiple; see note below |
| conversion (purchase event) | purchases | Same note |
| cost_per_conversion | cost_per_purchase | AUD (for purchase event) |
| video_play_actions | video_views | Total video plays (any duration) |
| video_watched_2s | three_second_views | Closest proxy to Meta's 3s; note in schema `notes` column |
| video_watched_6s | six_second_views | |
| video_views_p100 | thruplays | Watched 100% — closest proxy to Meta ThruPlay |
| likes | saves | TikTok "likes" = closest proxy to Meta "saves" — note in schema |
| comments | comments | |
| shares | shares | |
| — (dimension) | campaign_id | from `dimensions.campaign_id` (if included) or join from ad → adgroup → campaign |
| — (dimension) | campaign_name | same |
| — (dimension) | adset_id | from `dimensions.adgroup_id` |
| — (dimension) | adset_name | from adgroup lookup |
| — (dimension) | ad_id | from `dimensions.ad_id` |
| — (dimension) | ad_name | from ad lookup |
| — (dimension) | date | from `dimensions.stat_time_day` |
| — (computed) | hook_rate | three_second_views / impressions |
| — (computed) | hold_rate | thruplays / three_second_views |
| — (computed) | roas | revenue / spend |
| — (added) | platform | "tiktok" |
| — (added) | ad_account_id | env.TIKTOK_ACCOUNT_ID |

### Hook Rate and Hold Rate Proxies

TikTok does not have exact equivalents of Meta's 3-second video views and ThruPlay. Use:
- `hook_rate` = `video_watched_2s / video_play_actions` (2s proxy for 3s)
- `hold_rate` = `video_views_p100 / video_watched_2s`

Always note in the schema `notes` column: `"three_second_views proxied from TikTok 2s views; thruplays proxied from 100% views"`.

Benchmark: TikTok hook rates tend to be lower than Meta due to shorter content context. Treat benchmarks separately by platform; do not directly compare Meta hook_rate with TikTok hook_rate.

### Conversion Event Disambiguation

TikTok's `conversion` metric aggregates all conversion events for the ad group's optimisation goal. If an ad group targets Lead events, `conversion` = leads. If it targets Purchase events, `conversion` = purchases.

To split by event type, use the `AUDIENCE_TYPE` or event-specific metrics (available in custom report dimensions). Alternatively, use separate ad groups per conversion event type.

For now:
- If objective_type = `LEAD_GENERATION` → map `conversion` to `leads`
- If objective_type = `CONVERSIONS` and goal is purchase → map `conversion` to `purchases`
- Store `objective_type` in the `objective` schema field to enable this logic

---

## Spark Ads Notes

Spark Ads are TikTok native ads that boost existing organic TikTok posts. Key differences:

- **Ad ID:** Spark Ad `ad_id` links to a TikTok post (video) rather than a self-created creative
- **Performance reporting:** Same metrics as standard ads via the reporting endpoint
- **Creative management:** The underlying post is managed on the TikTok creator/brand account, not in Ads Manager
- **Safety implication:** Pausing a Spark Ad stops the boost but does NOT remove or alter the organic post
- **Universal schema:** Spark Ads are treated identically in the schema — no special field needed (use `notes` = "spark_ad" if useful for filtering)

---

## Pagination

TikTok API uses page-based pagination (not cursor-based like Meta):

```python
def fetch_all_pages(url: str, payload: dict, headers: dict) -> list:
    results = []
    page = 1
    while True:
        payload['page'] = page
        import json, urllib.request, urllib.parse
        data = json.dumps(payload).encode()
        req = urllib.request.Request(url, data=data, headers=headers, method='POST')
        with urllib.request.urlopen(req, timeout=30) as r:
            resp = json.loads(r.read())
        items = resp.get('data', {}).get('list', [])
        results.extend(items)
        page_info = resp.get('data', {}).get('page_info', {})
        if page >= page_info.get('total_page', 1):
            break
        page += 1
    return results
```

---

## Rate Limits

TikTok Marketing API rate limits vary by endpoint and account tier:

| Endpoint Category | Limit (approx.) | Window |
|---|---|---|
| Reporting | 20 requests/sec | Per app |
| Campaign/Ad reads | 40 requests/sec | Per app |
| Ad writes (if enabled) | 10 requests/sec | Per app |

**Response headers to monitor:**
- `X-RateLimit-Remaining` — calls remaining in current window
- `Retry-After` — seconds to wait if rate limited

**Handling rate limits:**
```python
import time, urllib.error

def post_with_retry(url, payload, headers, max_retries=3):
    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode(),
                headers={**headers, 'Content-Type': 'application/json'},
                method='POST'
            )
            with urllib.request.urlopen(req, timeout=30) as r:
                resp = json.loads(r.read())
            if resp.get('code') == 40100:  # Rate limit code
                wait = 60 * (attempt + 1)
                print(f"TikTok rate limit. Waiting {wait}s...")
                time.sleep(wait)
                continue
            return resp
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(60 * (attempt + 1))
            else:
                raise
    raise RuntimeError("TikTok API max retries exceeded")
```

---

## Token Refresh

TikTok access tokens expire. Refresh before expiry:

```
POST https://business-api.tiktok.com/open_api/v1.3/oauth2/refresh_access_token/
Content-Type: application/json

{
  "app_id": "{{env.TIKTOK_APP_ID}}",
  "secret": "{{env.TIKTOK_APP_SECRET}}",
  "refresh_token": "{{env.TIKTOK_REFRESH_TOKEN}}"
}
```

- Access token lifetime: typically 24 hours (check `expires_in` in token response)
- Refresh token lifetime: 365 days
- Automation: schedule a daily token refresh job that runs before the metrics pull (WF-1)
- On refresh failure: alert operator immediately — `[AdPilot OS] TikTok API token expired — {{client.business_name}}`
- Store refreshed token: update `TIKTOK_ACCESS_TOKEN` env var or secrets file

---

## Pause / Activate Operations

If write scopes are enabled (human approver flow only):

**Pause an Ad:**
```
POST https://business-api.tiktok.com/open_api/v1.3/ad/status/update/
Content-Type: application/json

{
  "advertiser_id": "{{env.TIKTOK_ACCOUNT_ID}}",
  "ad_ids": ["{{ad_id}}"],
  "opt_status": "DISABLE"
}
```

`opt_status` values: `ENABLE` (active) | `DISABLE` (paused). Use `DISABLE` only. No deletion.

Same human YES guard as meta-api-plan.md must be applied before any `ENABLE` or status write.

---

## Error Codes Reference

| TikTok Code | Meaning | Action |
|---|---|---|
| 0 | Success | Continue |
| 40100 | Rate limit | Backoff, retry |
| 40101 | Invalid access token | Alert operator — token expired |
| 40102 | Token scope insufficient | Add required scope, re-auth |
| 40200 | Advertiser not found | Check TIKTOK_ACCOUNT_ID |
| 40300 | Permission denied | Check Business Center access |
| 50001 | Internal server error | Retry 3x, then alert |

Error response format:
```json
{
  "code": 40101,
  "message": "Access token is invalid",
  "request_id": "..."
}
```

---

## Implementation Checklist

- [ ] TikTok for Business account created
- [ ] App registered in Marketing API portal
- [ ] Scopes requested: `report:read`, `campaign:read`, `adgroup:read`, `ad:read`
- [ ] Access token and refresh token obtained and stored in env vars
- [ ] `TIKTOK_ACCOUNT_ID` env var set (numeric advertiser ID, no `act_` prefix)
- [ ] Reporting endpoint tested: POST to `/report/integrated/get/` for yesterday
- [ ] Pagination verified for accounts with >1000 ad rows
- [ ] Token refresh job scheduled (daily, before metrics pull)
- [ ] Token expiry alert wired up
- [ ] Metric proxies documented in schema `notes` column (2s→3s, 100%→thruplay, likes→saves)
- [ ] Spark Ads confirmed working in reporting (same endpoint)
- [ ] Write scopes (`ad:write` etc.) added ONLY if pause flow is needed
- [ ] Budget guard (human YES) implemented before any budget write
