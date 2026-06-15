# AdPilot OS v3 — Go-Live Runbook

The fastest path from this repo to a live instance you can connect Snowflow to.
~30–45 min. You do the clicks (accounts + secrets are yours); everything else is built.

## 0. What you need
- A GitHub login (this repo), a **Vercel** account, a **Supabase** account.
- Optional now: an **Anthropic API key** (AI team) and a **Stripe** account (paid plans).
- For data: either a Meta **read-only access token** (fastest) or a Meta dev-app for OAuth.

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
   CRON_SECRET=<any long random string>
   ANTHROPIC_API_KEY=sk-ant-...          # optional: enables the AI team
   ANTHROPIC_MODEL=claude-sonnet-4-6     # or claude-opus-4-8 for deepest output
   ```
   (Stripe + Resend keys are optional — add when you turn on billing/email.)
3. Deploy. Crons in `vercel.json` register automatically. **Hourly auto-sync needs the Vercel Pro plan** (Hobby runs crons once/day).

## 4. Create your workspace + unlock the tier
1. Open the app → sign up → confirm email → sign in. You land on the **Command Center**.
2. API connect + auto-sync + AI team are **Pro/Expert** features. To unlock for a trial without Stripe, insert a subscription row in Supabase (SQL Editor), using your org id (Table editor → `organisations` → copy `id`):
   ```sql
   insert into billing_subscriptions (organisation_id, plan, status)
   values ('<YOUR_ORG_ID>', 'expert', 'active');
   ```
   (With Stripe configured, the Billing page does this automatically on checkout.)

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

## Security recap
Read-only scopes · tokens encrypted at rest (AES-256-GCM), never sent to the browser · RLS isolates every org · all secrets server-side · the app never edits, pauses, or creates ads.
