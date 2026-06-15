# AdPilot OS v3 — Go-Live Runbook

The fastest path from this repo to a live instance you can connect Snowflow to.
~30–45 min. You do the clicks (accounts + secrets are yours); everything else is built.

_Last updated: 2026-06-15._

## 0. What you need
- A GitHub login (this repo), a **Vercel** account, a **Supabase** account.
- Optional now: an **Anthropic API key** (AI team + weekly knowledge auto-refresh) and a **Stripe** account (paid plans).
- For data: either a Meta **read-only access token** (fastest) or a Meta dev-app for OAuth.
- Optional for **Content Studio publishing**: write-scope Page/IG/TikTok tokens (organic posts only — see §7).
- Optional for **Messenger automation** (Expert): a Meta app with a verify token + app secret (see §8).

## 1. Supabase (database + auth)
1. Create a new Supabase project. Note the **Project URL**, **anon key**, **service_role key** (Settings → API).
2. SQL Editor → run the migrations in order from `adpilot-v2/supabase/migrations/`:
   `0001_init.sql` → `0002_phase3.sql` → `0003_phase4.sql` → `0004_hardening.sql` → `0005_auto_sync.sql`.
3. Auth → Providers → keep **Email** on (password sign-in is wired).

## 2. Generate the token-encryption key
```
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
Copy the output → `TOKEN_ENCRYPTION_KEY`.

## 3. Vercel (deploy)
1. New Project → import this repo → **Root Directory: `adpilot-v2`** (important).
2. Add Environment Variables (Production):
   ```
   NEXT_PUBLIC_SUPABASE_URL=...          NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...         TOKEN_ENCRYPTION_KEY=...
   NEXT_PUBLIC_APP_URL=https://<your>.vercel.app
   OAUTH_REDIRECT_BASE=https://<your>.vercel.app
   CRON_SECRET=<any long random string>  # protects ALL crons (auto-sync, publish, digest, knowledge refresh)
   ANTHROPIC_API_KEY=sk-ant-...          # optional: enables the AI team + weekly knowledge auto-refresh
   ANTHROPIC_MODEL=claude-sonnet-4-6     # or claude-opus-4-8 for deepest output
   ```
   Optional, add only when you turn on the matching feature (all blanks keep it disabled):
   ```
   # Content Studio — organic publishing (write scopes; SEPARATE from read-only ad tokens)
   META_PAGE_ACCESS_TOKEN=...   # Page token: pages_manage_posts / instagram_content_publish
   META_PAGE_ID=...             # Facebook Page id (FB posts)
   IG_USER_ID=...               # Instagram Business account id (IG posts/reels)
   TIKTOK_PUBLISH_TOKEN=...     # TikTok Content Posting API (audited app needed for PUBLIC posts)

   # Messenger automation (Expert) — multi-channel webhook bot
   MESSENGER_VERIFY_TOKEN=...   # any random string; Meta webhook handshake
   META_APP_SECRET=...          # signs inbound webhook payloads (already set if you use Meta OAuth)
   ```
   (Stripe + Resend keys are optional — add when you turn on billing/email.)
3. Deploy. Crons in `vercel.json` register automatically. **Hourly auto-sync needs the Vercel Pro plan** (Hobby runs crons once/day). Active crons:
   - `/api/cron/auto-sync` — hourly (data pulls)
   - `/api/cron/publish` — **every 15 min** (sends scheduled organic posts; see §7)
   - `/api/cron/auto-analysis` — daily
   - `/api/cron/weekly-digest` — weekly (Fri)
   - `/api/cron/refresh-knowledge` — **weekly (Mon)** (AI knowledge auto-refresh; see §9)

## 4. Create your workspace + unlock the tier
1. Open the app → sign up → confirm email → sign in. You land on the **Command Center**.
2. Features are gated by plan in `lib/entitlements.ts` (single source of truth):
   - **Starter+**: Saved reports, **Content Studio** (upload → approve → publish/schedule organic posts).
   - **Pro+**: API/dev-link connect, automated sync (cadence), AI specialist team, AI Creative Studio, multi-client workspaces.
   - **Expert**: **Messenger automation** (multi-channel bot), white-label reports, expert plugins.
   To unlock a tier for a trial without Stripe, insert a subscription row in Supabase (SQL Editor), using your org id (Table editor → `organisations` → copy `id`):
   ```sql
   insert into billing_subscriptions (organisation_id, plan, status)
   values ('<YOUR_ORG_ID>', 'expert', 'active');
   ```
   (Use `'starter'` or `'pro'` to test a lower tier. With Stripe configured, the Billing page does this automatically on checkout.)

## 5. Connect Snowflow (fastest = dev token)
- **Connect & Sync → Advanced — connect with an access token.**
  - Meta: paste a token with `ads_read` (Graph API Explorer or a Business System User). Leave Account ID blank for all accounts, or paste `act_<id>`.
  - TikTok: paste a long-lived token **and** the `advertiser_id`.
- On connect it pulls immediately. Then **Settings → Auto-sync** → pick a cadence (Hourly/Daily/Weekly/custom). Done — it now runs itself.
- Prefer OAuth? Set `META_APP_ID`/`META_APP_SECRET` (+ TikTok) and add the redirect `https://<your>.vercel.app/api/oauth/meta/callback` in the Meta app, then use **Connect Meta**.

## 6. Verify
- Command Center shows a Health Score, proposals appear in **Proposals**, and **Connections** shows a live status.
- Ask a specialist on **AI Specialists** (needs `ANTHROPIC_API_KEY`).
- Trigger a sync manually any time with **Sync now** on Connect.

## 7. Content Studio — organic publishing (Starter+)
**Content Studio** (`/content`) lets a client upload reels/posts, approve them, then publish or schedule to Facebook / Instagram / TikTok. This is **organic content the user created and approved** — it is deliberately separate from the read-only ad layer; the app still never edits, pauses, or creates ads.

- **Flow:** upload (or AI-draft on Pro+) → **approve** → **publish now** or **schedule**. Only an explicitly approved/scheduled post is ever sent.
- **Gating:** `content_publish` = **Starter+**. The AI Creative Studio drafter (`creative_studio`) is **Pro+** and needs `ANTHROPIC_API_KEY`.
- **Write-scope env (separate from ad tokens):**
  - `META_PAGE_ACCESS_TOKEN` + `META_PAGE_ID` → Facebook Page posts (needs `pages_manage_posts`).
  - `META_PAGE_ACCESS_TOKEN` + `IG_USER_ID` → Instagram posts/reels (needs `instagram_content_publish`; the IG account must be a Business/Creator account linked to the Page).
  - `TIKTOK_PUBLISH_TOKEN` → TikTok video (Content Posting API).
- **Scheduling:** the `/api/cron/publish` cron runs **every 15 min** and sends any scheduled post whose time has come (re-checking the plan gate before each send).
- **Honest limits:** leave a token blank to keep that platform disabled — composing/scheduling still works but a publish attempt reports "not configured" instead of failing silently. **TikTok defaults to `SELF_ONLY` (private)** until your TikTok app is **audited/approved for content posting** — only then can it post publicly.

## 8. Messenger automation — multi-channel bot (Expert)
**Messenger Setup** (`/messenger`) has two parts, both Expert-only (`messenger_automation`):
1. **Entry experience** — set a Page's greeting, ice breakers, Get Started, and persistent menu through the Graph API with **no browser and no "Allow" prompts** (idempotent, multi-client). Uses `META_PAGE_ACCESS_TOKEN` or a pasted Page token.
2. **Auto-reply webhook bot** — a public webhook (`<app>/api/messenger/webhook`) answers **Messenger, Instagram DMs, and WhatsApp** with keyword/payload/welcome/away/default rules, hours-aware.

Setup:
- Set `MESSENGER_VERIFY_TOKEN` (any random string) and `META_APP_SECRET` (already set if you use Meta OAuth — it signs every inbound payload).
- In the app, **Connect a channel** (paste a Page token, or a WhatsApp token + phone-number ID), set business hours, then add rules. Tokens are encrypted per org at rest.
- In the **Meta App Dashboard**: add the callback URL `<app>/api/messenger/webhook` + your verify token, then **Subscribe webhook** for the Page (button in-app for Messenger/IG; WhatsApp subscribes in the dashboard).
- **App Review is per-app, not per-page** — one approved app covers all client pages. Replying to the public requires advanced access for `pages_messaging` / `instagram_manage_messages` / `whatsapp_business_messaging`. WhatsApp free-form replies only work inside the 24-hour customer-service window; outside it you need approved templates.

See `docs/MESSENGER.md` for the full operator runbook.

## 9. AI knowledge auto-refresh (Pro+ AI team)
The AI specialists are grounded on dated, sourced domain knowledge. A weekly cron (`/api/cron/refresh-knowledge`, **Mondays**) uses Anthropic's server-side `web_search` to re-pull current benchmarks and overwrite the per-domain docs.
- Needs `ANTHROPIC_API_KEY`. Without it the cron is a no-op and the specialists **fall back to the committed baseline** in `lib/agents/knowledge.ts` (last researched 2026-06-15) — so the AI team still works, just not auto-updated.
- Secured by `CRON_SECRET`, same as every other cron.

## Security recap
Read-only **ad** scopes · all tokens (ad, publishing, Messenger) encrypted at rest (AES-256-GCM, `TOKEN_ENCRYPTION_KEY`), never sent to the browser · RLS isolates every org · all secrets server-side · every cron gated by `CRON_SECRET`. Write scopes exist only for **organic publishing** and **Messenger profile setup** — both deliberately separate from the ad layer, and the app never edits, pauses, or creates ads.
