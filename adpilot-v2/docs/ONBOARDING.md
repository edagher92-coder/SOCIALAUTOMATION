# AdPilot OS — Production Onboarding

> The owner-only credential steps that unblock a first paying customer. For the full
> infrastructure runbook (Supabase project, migrations, Vercel env, domains, crons, smoke
> test), see **`docs/DEPLOY.md`** — this doc drills into the two credentials owners most often
> get stuck on, plus the launch checklist.

## 1. Stripe AUD price IDs (launch blocker)
The app ships display prices (Starter $49 / Pro $149 / Expert $399 AUD) in `lib/plans.ts`, but
checkout needs the matching **price IDs**. Until these are set, checkout fails closed.

1. Stripe Dashboard → **Products** → create three products: *Starter*, *Pro*, *Expert*.
2. On each, add a **recurring price** in **AUD**, monthly (add an annual price later if wanted).
3. Copy each price's id (`price_…`) into Vercel env (Production):
   - `NEXT_PUBLIC_STRIPE_PRICE_STARTER`
   - `NEXT_PUBLIC_STRIPE_PRICE_PRO`
   - `NEXT_PUBLIC_STRIPE_PRICE_EXPERT`
4. Use a **live** secret key for production: `STRIPE_SECRET_KEY` (`sk_live_…`).
5. **Developers → Webhooks** → add endpoint `https://<your-domain>/api/stripe/webhook`
   (events `checkout.session.completed`, `customer.subscription.*`) → copy the signing secret →
   `STRIPE_WEBHOOK_SECRET`.

> Price IDs are public by design (`NEXT_PUBLIC_*`); the secret + webhook keys stay server-side.

## 2. Meta System User token (non-expiring — for live audits)
The live ad audit needs a Meta token that won't expire mid-month. A **System User** token is
the durable option.

1. **Meta Business Suite → Business Settings → Users → System Users → Add.**
   Create a System User (e.g. *AdPilot Audit*), role **Employee** (or Admin if required).
2. **Assign assets:** give the System User access to the relevant **Ad Account(s)** with at
   least **read** permissions (`ads_read`, `read_insights`).
3. **Generate token** → select the App → scopes: `ads_read`, `read_insights` (read-only audit).
   For organic publishing/audience demographics, additionally `pages_read_engagement`,
   `pages_manage_posts`, `instagram_basic`, `instagram_manage_insights`,
   `instagram_content_publish` (these need Meta App Review for production).
4. Choose **no expiry** (System User tokens can be non-expiring) and copy the token.
5. Paste it in the app's **Connect** flow (encrypted at rest with AES-256-GCM via
   `TOKEN_ENCRYPTION_KEY`), or set the relevant publishing env var (see `.env.example`).

> Set `META_GRAPH_API_VERSION` (default `v21.0`) once; bump it centrally when Meta increments.

> **Current release default:** `v23.0`. All Meta surfaces now share this single setting; validate it with a real-account smoke test before changing it.

## 3. Required env (minimum viable launch)
Set in Vercel **Production** (full per-variable docs in `.env.example`):

`NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` · `SUPABASE_SERVICE_ROLE_KEY` ·
`STRIPE_SECRET_KEY` · `STRIPE_WEBHOOK_SECRET` · `NEXT_PUBLIC_STRIPE_PRICE_{STARTER,PRO,EXPERT}` ·
`TOKEN_ENCRYPTION_KEY` · `PII_PEPPER` · `CRON_SECRET` · `ANTHROPIC_API_KEY` ·
`NEXT_PUBLIC_APP_URL` · `OAUTH_REDIRECT_BASE` · `SUPPORT_EMAIL` (a public business address).

Feature-gated (optional): `GEMINI_API_KEY` / Firefly (Creative Studio) · `RESEND_API_KEY`
(email) · Meta/TikTok app keys (live connect) · publishing tokens · `META_GRAPH_API_VERSION`.
Keep **`ADS_WRITE_ENABLED` unset** for launch (read-only).

## 4. First-deploy verification
> **Release baseline:** run every migration in numeric order through
> `0031_access_hardening.sql`; the `0001…0025` line below is a pre-release
> checklist and is no longer sufficient.

1. Run migrations `0001…0025` on the prod Supabase (`supabase db push`, or paste in order).
2. `curl https://<your-domain>/api/health` → presence booleans look right.
3. Cron auth: `curl -H "Authorization: Bearer $CRON_SECRET" https://<domain>/api/cron/auto-sync`
   returns 200 (and 401 without the header).
4. Sign up → paste the sample CSV on Ads Health → a 0–100 score renders.
5. Start a Stripe checkout → confirm the webhook marks the subscription active.

See `docs/DEPLOY.md` for the complete go-live runbook and the owner-gated launch blockers.
