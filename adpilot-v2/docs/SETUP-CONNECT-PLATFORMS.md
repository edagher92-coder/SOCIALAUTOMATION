# Connect Meta & TikTok to AdPilot OS (Social AU)

Three ways to bring ad data in. Pick what suits you — you can mix them. All paths are **read-only**.

## Benefits / drawbacks

| Method | Best for | Benefits | Drawbacks |
|---|---|---|---|
| **CSV upload** | Anyone, instant | Zero setup, no permissions, fully private (browser/CSV), works offline | Manual; a point-in-time snapshot, not live |
| **API token (OAuth)** | Most users / auto-sync | One-click connect, scheduled auto-sync + scoring + alerts, least-privilege read scopes, token encrypted at rest | Requires a platform app (App ID/secret) configured once; tokens expire & need refresh; platform app review for production |
| **MCP server** | Power users / Claude-driven automation | Drive it from Claude/agents, scriptable, great for multi-tool orchestration | More moving parts; you host/run the MCP; less turnkey for non-technical users |

**Recommendation:** API token (OAuth) for daily auto-sync, CSV as the always-available fallback, MCP if you already orchestrate via Claude.

---

## Option A — CSV (no setup)
Export at **ad level**, daily breakdown, from Meta Ads Manager / TikTok Ads Manager → paste or upload on the **Ads Health** page. Columns auto-map.

---

## Option B — API token (OAuth) — recommended

### Server env keys (set once, in Vercel/Supabase env)
```
# Meta
META_APP_ID=...
META_APP_SECRET=...
# TikTok
TIKTOK_APP_ID=...
TIKTOK_APP_SECRET=...
# shared
OAUTH_REDIRECT_BASE=https://your-app.vercel.app   # no trailing slash
TOKEN_ENCRYPTION_KEY=...   # node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Meta (Facebook/Instagram) — create the app
1. developers.facebook.com → **Create App** → type **Business** → add **Marketing API**.
2. App settings → Basic: copy **App ID** + **App secret** → `META_APP_ID` / `META_APP_SECRET`.
3. Facebook Login → Settings → **Valid OAuth redirect URIs**: add
   `https://your-app.vercel.app/api/oauth/meta/callback`.
4. Permissions/scopes: **`ads_read`**, **`read_insights`** (request these in App Review for production; dev mode works for your own accounts).
5. In AdPilot: **Connect Accounts → Connect Meta** → approve → ad accounts appear → **Sync now**.

### TikTok Ads — create the app
1. business-api.tiktok.com → **My Apps** → create an app; enable **Reporting / Ads (read)**.
2. Copy **App ID** + **Secret** → `TIKTOK_APP_ID` / `TIKTOK_APP_SECRET`.
3. Redirect URI: `https://your-app.vercel.app/api/oauth/tiktok/callback`.
4. Scope: **`ads.read`**.
5. In AdPilot: **Connect Accounts → Connect TikTok** → approve → **Sync now**.

> Tokens are encrypted (AES-256-GCM) before storage and never sent to the browser. Scheduled sync/scoring runs via the daily cron once connected.

---

## Option C — MCP server (Claude-driven)
If you run Meta/TikTok via an MCP server (e.g., in Claude), keep using AdPilot's **CSV import** for the analysis layer: have your MCP/agent export insights to CSV (or the universal schema) and drop them into the Ads Health page or the API. This gives you the flexibility of MCP orchestration with AdPilot's scoring/reporting. A direct MCP ingestion endpoint can be added later (`POST /api/ingest` with the universal schema) — the schema is documented in the repo.

---

## After connecting
- **Settings:** set average sale value + gross margin (defines break-even).
- **Notifications:** turn on weekly digest + critical alerts.
- **White-label:** brand client reports.
- **Crons** (Vercel, in `vercel.json`): daily auto-analysis + Friday weekly digest. Protect with `CRON_SECRET`.

## Security
Read-only scopes only · encrypted tokens · row-level security per client · all secrets server-side · the app never edits, pauses, or creates ads.
