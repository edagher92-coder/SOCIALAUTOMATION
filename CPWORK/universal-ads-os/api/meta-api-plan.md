# Meta Marketing API Integration Plan — AdPilot OS

**Reference implementation:** `tools/meta_ads_api.py` — uses `urllib` only, no third-party dependencies, token from env/file never hardcoded.

---

## Safety Model (mandatory — repeat in all implementations)

- `live_edit_block: true` — the API integration may READ insights and PAUSE/ACTIVATE ads (reversible). It may NOT edit live ad creative, copy, or targeting.
- `use_paused_duplicates_only: true` — any new ad created via API must be created with `status: PAUSED`. No live ad is published automatically.
- No deletion of campaigns, ad sets, or ads. Archive via status change (`status: ARCHIVED`) only, and only after human YES.
- Budget changes require a human typed YES confirmation before execution. See `tools/meta_ads_api.py` `budget` command for the enforcement pattern.
- Tokens and account IDs are stored in environment variables or a git-ignored secrets file — never hardcoded in source files or documentation.
- Scope principle: request least privilege. Start with `ads_read` + `read_insights`. Add `ads_management` only for the human-gated approver flow.
- Prefer this API over browser automation of Ads Manager (which is high-risk, fragile, and violates Meta ToS).

---

## App Setup

### 1. Create a Meta App

1. Go to `developers.facebook.com` → My Apps → Create App
2. App type: **Business**
3. App name: `AdPilot OS — {{client.business_name}}` (or agency-level app for multi-client)
4. Business Account: link to the Meta Business Manager for this client

### 2. Add Products

Required products:
- **Marketing API** — for ad account access
- **Webhooks** — for lead notification (if using Meta Lead Ads)

### 3. App Review and Permissions

Standard Access (no review required for dev/testing):
- `ads_read` — read campaigns, ad sets, ads, ad accounts
- `read_insights` — read performance insights

Advanced Access (requires Meta App Review for production):
- `ads_management` — pause/activate/create ads (required for write operations)
- `leads_retrieval` — retrieve lead form submissions

### 4. Token Types

| Token Type | Use | Lifetime |
|---|---|---|
| User Access Token | Development and testing | 1–60 days |
| System User Token (recommended) | Production automation | Long-lived (never expires unless revoked) |
| Page Access Token | Webhook verification | Not needed for Marketing API |

**Production setup: System User Token**
1. Business Manager → System Users → Add System User
2. Assign role: Employee (not Admin)
3. Generate Token → select scopes: `ads_read`, `read_insights` (add `ads_management` if approver flow needed)
4. Store token: `export META_TOKEN="..."` or write to `secrets/meta_token.txt` (git-ignored)

**Token storage rule (from `tools/meta_ads_api.py`):**
```python
def token() -> str:
    tok = os.environ.get("META_TOKEN", "").strip()
    if tok:
        return tok
    # Fallback: git-ignored token file
    tok_file = os.environ.get("META_TOKEN_FILE", "secrets/meta_token.txt")
    try:
        return Path(tok_file).read_text().strip()
    except FileNotFoundError:
        sys.exit("META_TOKEN not set and secrets/meta_token.txt not found. Never hardcode tokens.")
```

---

## OAuth Concept

AdPilot OS does not implement end-user OAuth flows. Instead:

1. **Agency/Operator:** Generates a System User Token in Business Manager (one-time setup).
2. **Token:** Stored securely in env/secrets. Used by all API calls for this client.
3. **Multi-client:** Each client has a separate `META_AD_ACCOUNT` env var. One System User can access multiple ad accounts if granted access in Business Manager.

For white-label reselling: the operator manages the System User Token. The end-client never sees the token.

---

## API Version

All calls use: `https://graph.facebook.com/v21.0/`

The version is set via env var: `META_API_VERSION=v21.0` (default in `tools/meta_ads_api.py`).

When Meta releases a new stable version, update `META_API_VERSION`. Test before changing in production. Meta deprecates old versions ~2 years after release.

---

## Core Endpoints

### Ad Account

```
GET https://graph.facebook.com/v21.0/{{ad_account_id}}
  ?fields=name,account_status,currency,timezone_name,spend_cap,amount_spent
  &access_token={{token}}
```

Note: `{{ad_account_id}}` format is `act_XXXXXXXXX`. Never hardcode the number — use `{{env.META_ACCOUNT_ID}}`.

### Campaigns (READ ONLY)

```
GET https://graph.facebook.com/v21.0/{{ad_account_id}}/campaigns
  ?fields=id,name,objective,status,effective_status,daily_budget,lifetime_budget,
          start_time,stop_time,created_time,updated_time
  &limit=500
  &access_token={{token}}
```

**Pagination:** If `paging.cursors.after` is present in response, request next page:
```
&after={{paging.cursors.after}}
```

### Ad Sets (READ ONLY)

```
GET https://graph.facebook.com/v21.0/{{ad_account_id}}/adsets
  ?fields=id,name,campaign_id,status,effective_status,targeting,
          daily_budget,lifetime_budget,bid_strategy,bid_amount,
          optimization_goal,billing_event,start_time,end_time,
          frequency_control_specs
  &limit=500
  &access_token={{token}}
```

### Ads (READ ONLY)

```
GET https://graph.facebook.com/v21.0/{{ad_account_id}}/ads
  ?fields=id,name,adset_id,campaign_id,status,effective_status,
          creative,tracking_specs,conversion_specs,created_time,updated_time
  &limit=500
  &access_token={{token}}
```

### Ad Insights — Daily at Ad Level (READ ONLY)

This is the primary data pull endpoint. Feeds the universal schema.

```
GET https://graph.facebook.com/v21.0/{{ad_account_id}}/insights
  ?level=ad
  &time_range={"since":"{{date_from}}","until":"{{date_to}}"}
  &time_increment=1
  &fields=campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,
          spend,impressions,reach,frequency,clicks,ctr,cpc,cpm,
          actions,action_values,video_play_actions,video_avg_percent_watched_actions,
          website_ctr,landing_page_views,
          outbound_clicks,outbound_clicks_ctr,
          cost_per_action_type,cost_per_unique_action_type
  &action_breakdowns=action_type
  &limit=500
  &access_token={{token}}
```

**Parsing `actions` for leads and purchases:**
```python
def parse_actions(actions_list, action_type):
    for a in (actions_list or []):
        if a.get('action_type') == action_type:
            return float(a.get('value', 0))
    return 0.0

leads     = parse_actions(row.get('actions', []), 'lead')
purchases = parse_actions(row.get('actions', []), 'purchase')
revenue   = parse_actions(row.get('action_values', []), 'purchase')
```

**Parsing video metrics:**
```python
video_play_actions = row.get('video_play_actions', [])
video_views    = parse_actions(video_play_actions, 'video_view')
three_sec      = parse_actions(video_play_actions, 'video_play_actions_3s')
thruplays      = parse_actions(video_play_actions, 'video_thruplay_watched')
```

---

## Insights Fields → Universal Schema Mapping

| Meta Insights Field | Universal Schema Field | Notes |
|---|---|---|
| campaign_id | campaign_id | |
| campaign_name | campaign_name | |
| adset_id | adset_id | |
| adset_name | adset_name | |
| ad_id | ad_id | |
| ad_name | ad_name | |
| spend | spend | AUD (if account currency = AUD) |
| impressions | impressions | |
| reach | reach | |
| frequency | frequency | |
| clicks (link clicks) | clicks | |
| ctr (link CTR) | ctr | Meta returns as %; divide by 100 → decimal |
| cpc (cost per link click) | cpc | AUD |
| cpm | cpm | AUD |
| landing_page_views | landing_page_views | |
| actions[lead] | leads | |
| action_values[purchase] | revenue | AUD |
| actions[purchase] | purchases | |
| video_play_actions[video_view] | video_views | |
| video_play_actions[3s] | three_second_views | |
| video_play_actions[thruplay] | thruplays | |
| — (computed) | hook_rate | three_second_views / impressions |
| — (computed) | hold_rate | thruplays / three_second_views |
| — (computed) | cost_per_lead | spend / leads |
| — (computed) | cost_per_purchase | spend / purchases |
| — (computed) | roas | revenue / spend |
| — (added) | platform | "meta" |
| — (added) | ad_account_id | env.META_ACCOUNT_ID |
| date_start | date | Use date_start as the row date |

Note: `six_second_views` is not a standard Meta insights field. Leave blank or derive from a custom video metric if available in the ad account.

---

## Pause / Activate Operations

See `tools/meta_ads_api.py` for the reference implementation. Summary:

**Pause a campaign (reversible):**
```
POST https://graph.facebook.com/v21.0/{{campaign_id}}
Content-Type: application/x-www-form-urlencoded

status=PAUSED&access_token={{token}}
```

**Activate a campaign:**
```
POST https://graph.facebook.com/v21.0/{{campaign_id}}

status=ACTIVE&access_token={{token}}
```

**Scope required:** `ads_management`  
**Safety:** Only pause is allowed without explicit confirmation. Activate requires confirmation in the approver flow.  
**No live creative edits:** Only status changes (ACTIVE/PAUSED) are allowed via automation.

---

## Budget Guard (Human YES Required)

From `tools/meta_ads_api.py` — the budget command pattern:

```python
def budget_change(obj_id: str, new_daily_budget_cents: int):
    print(f"\n⚠  BUDGET CHANGE REQUEST")
    print(f"   Object ID:   {obj_id}")
    print(f"   New Budget:  AUD {new_daily_budget_cents / 100:.2f} / day")
    print(f"\n   This will modify a LIVE ad account budget.")
    answer = input("   Type YES to confirm: ")
    if answer.strip().upper() != "YES":
        print("   Aborted.")
        return
    # Only executes if human types YES
    _post(f"/{obj_id}", {"daily_budget": new_daily_budget_cents})
```

This pattern must be replicated in any automation that touches budgets.

---

## Rate Limits

Meta Marketing API uses two rate limit systems:

### System User Rate Limits (Business API tier)

- **Calls per hour:** Varies by app tier (Standard: 200/hr; Development: lower)
- **Insights requests:** Score-based — complex queries with many fields consume more quota
- **Response header:** `X-Business-Use-Case-Usage` — parse to monitor remaining quota

### Handling Rate Limits

```python
import json, urllib.error

def get_with_retry(url: str, max_retries: int = 3) -> dict:
    for attempt in range(max_retries):
        try:
            with urllib.request.urlopen(url, timeout=30) as r:
                return json.loads(r.read())
        except urllib.error.HTTPError as e:
            if e.code == 80000 or e.code == 429:
                wait = 60 * (attempt + 1)
                print(f"Rate limited. Waiting {wait}s before retry {attempt+1}/{max_retries}")
                import time; time.sleep(wait)
            else:
                raise
    raise RuntimeError(f"Max retries exceeded for {url}")
```

Meta error code 80000 = API rate limit. Also check for `"code": 4` (app-level) and `"code": 17` (user-level) in the error JSON body.

---

## Token Refresh / Expiry

- **System User Tokens:** Do not expire unless explicitly revoked. No refresh needed.
- **User Access Tokens:** Expire in 60 days. Extend using `GET /oauth/access_token?grant_type=fb_exchange_token`.
- **Monitoring:** Catch `{"error": {"code": 190, "subcode": 463}}` (token expired) and alert operator — do not auto-refresh with a stored refresh token (security risk).

Alert email on token expiry: subject `[AdPilot OS] Meta API token expired — {{client.business_name}} — action required`.

---

## Error Handling Reference

| HTTP Code | Meta Error Code | Meaning | Action |
|---|---|---|---|
| 400 | 100 | Invalid parameter | Log, skip row, alert |
| 400 | 190 | Invalid token | Alert operator, stop |
| 400 | 200 | Permission error | Alert operator — check scopes |
| 429 | 80000 | Rate limit | Exponential backoff, retry |
| 500 | — | Server error | Retry 3x, then alert |
| 503 | — | Meta API down | Alert, try again in 30 min |

---

## Pagination Pattern

All list endpoints paginate. Full fetch:

```python
def fetch_all_pages(url: str) -> list:
    results = []
    while url:
        data = get_with_retry(url)
        results.extend(data.get('data', []))
        url = data.get('paging', {}).get('next')  # None when last page
    return results
```

---

## Multi-Account Setup

For agencies managing multiple clients:

1. One Meta App (agency-level) with one System User
2. Each client's ad account grants the System User access in their Business Manager
3. Use `{{env.META_ACCOUNT_ID}}` per-client (set differently per execution context)
4. Never mix client data — one Sheet, one set of env vars, one execution per client

---

## Implementation Checklist

- [ ] Meta App created and linked to Business Manager
- [ ] System User created with Employee role
- [ ] Token generated with `ads_read`, `read_insights` scopes
- [ ] Token stored in `META_TOKEN` env var (not in any committed file)
- [ ] `META_AD_ACCOUNT` env var set to `act_XXXXXXXXX`
- [ ] `tools/meta_ads_api.py` tested: `python3 tools/meta_ads_api.py status`
- [ ] Insights pull tested: `python3 tools/meta_ads_api.py insights 7`
- [ ] Rate limit handling verified
- [ ] Token expiry alert wired up
- [ ] Pagination verified for accounts with >500 ads
- [ ] `ads_management` scope added ONLY if pause/create flow is needed
- [ ] Budget guard (human YES) tested before any budget change
