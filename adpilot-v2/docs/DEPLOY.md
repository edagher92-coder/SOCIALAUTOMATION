# AdPilot OS — Production Go‑Live Runbook

> The exact, ordered steps to take AdPilot OS V2 from green CI to a live production deploy.
> Hosting model: **Vercel** (Next.js 16 app + serverless + cron) · **Supabase** (Postgres + Auth + RLS) · **Stripe** (billing).
> Last verified: `tsc` clean · **500 tests** · `next build` clean (76 routes) · resale‑clean guard passes.

## 0. Current state (what's already done)
- ✅ App code is production‑ready (CI gate green: typecheck + tests + build + resale guard — `.github/workflows/adpilot-v2-ci.yml`).
- ✅ **Vercel is already connected** via its native GitHub integration (it's what builds the PR preview deploys). **Merging to `main` auto‑deploys production** — no extra pipeline needed. (`deploy-vercel.yml` is an optional CLI fallback that only runs if `VERCEL_TOKEN`/`VERCEL_ORG_ID`/`VERCEL_PROJECT_ID` repo secrets are set.)
- ✅ Security headers (CSP etc.) in `next.config.mjs`; every table is RLS‑scoped (`is_org_member`).
- ⏳ Remaining work is **configuration in the Vercel / Supabase / Stripe dashboards** + the owner‑gated blockers below.

## 1. Owner‑gated launch blockers (decide/obtain first)
| Blocker | Action |
|---|---|
| **Stripe price IDs** | Create the 3 recurring AUD products (Step 3) → paste the `price_…` IDs into Vercel env |
| **Non‑expiring Meta token** | A System User token (`ads_read`,`read_insights`) — see `/connect/guide` in‑app + `docs/SETUP-CONNECT-PLATFORMS.md` |
| **Legal sign‑off** | Admitted‑solicitor review of the DRAFT Terms/Privacy (`CPWORK/.../legal/`) before public launch |
| **Approved execution** | Leave `AD_WRITE_EXECUTION_ENABLED` unset for a read-only launch. Expert live changes also require a separate `ads_management` token, manager approval, and budget guardrails. |
| **Vercel plan** | The hourly + 15‑min crons (Step 5) require **Vercel Pro** (Hobby = daily‑only) |

---

## 2. Step 1 — Supabase (database + auth)
1. Create a **new Supabase project** (production). Region close to your users (e.g. Sydney).
2. Run the migrations **in numeric order** (gaps 0012–0015 are intentional — do not backfill):
   - **Option A (CLI):** `supabase link --project-ref <ref>` then `supabase db push` (applies `supabase/migrations/0001…0023`).
   - **Option B (Dashboard):** SQL Editor → paste each `supabase/migrations/00XX_*.sql` in order (0001 → 0023) and run.
3. Enable **Email auth** (Authentication → Providers). Set the Site URL + redirect URLs to your production domain (Step 6).
4. Copy from **Project Settings → API**: `Project URL`, `anon` key, `service_role` key → these become the three Supabase env vars.

## 3. Step 2 — Stripe (billing)
1. In **Stripe → Products**, create three products with **monthly recurring AUD** prices:
   - **Starter** — $49/mo · **Pro** — $149/mo · **Expert** — $399/mo. (Add annual prices later if wanted.)
2. Copy each price's `price_…` id → `NEXT_PUBLIC_STRIPE_PRICE_STARTER` / `_PRO` / `_EXPERT`.
3. **Developers → API keys** → `STRIPE_SECRET_KEY` (use a **live** key for production).
4. **Developers → Webhooks** → add endpoint `https://<your-domain>/api/stripe/webhook` (subscribe to `checkout.session.completed`, `customer.subscription.*`) → copy the signing secret → `STRIPE_WEBHOOK_SECRET`.

## 4. Step 3 — Generate the server secrets
```bash
# Token encryption (OAuth tokens at rest, AES‑256‑GCM) — 32 bytes base64
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"   # TOKEN_ENCRYPTION_KEY
openssl rand -base64 32   # PII_PEPPER   (REQUIRED in prod — hashing fails closed without it)
openssl rand -hex 32      # CRON_SECRET  (protects all 5 crons)
openssl rand -hex 32      # CRM_WEBHOOK_SECRET (only if using the lead‑quality webhook)
openssl rand -hex 24      # INGEST_API_KEY / MESSENGER_VERIFY_TOKEN (optional features)
```

## 5. Step 4 — Vercel environment variables
In **Vercel → Project → Settings → Environment Variables**, add to **Production** (and Preview where useful). Do **not** prefix server secrets with `NEXT_PUBLIC_`.

**Required (minimum viable launch — audit · score · auth · billing):**
`NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` · `SUPABASE_SERVICE_ROLE_KEY` · `STRIPE_SECRET_KEY` · `STRIPE_WEBHOOK_SECRET` · `NEXT_PUBLIC_STRIPE_PRICE_STARTER` · `NEXT_PUBLIC_STRIPE_PRICE_PRO` · `NEXT_PUBLIC_STRIPE_PRICE_EXPERT` · `TOKEN_ENCRYPTION_KEY` · `PII_PEPPER` · `CRON_SECRET` · `ANTHROPIC_API_KEY` · `NEXT_PUBLIC_APP_URL` · `OAUTH_REDIRECT_BASE` · `SUPPORT_EMAIL`

**For live Meta/TikTok connect (Pro feature):** `META_APP_ID` · `META_APP_SECRET` · (`TIKTOK_APP_ID` · `TIKTOK_APP_SECRET` if offering TikTok).

**For the AI Creative Studio:** `GEMINI_API_KEY` (recommended, verified) — or `FIREFLY_CLIENT_ID` + `FIREFLY_CLIENT_SECRET`.

**Optional / feature‑gated (safe to leave unset):** `RESEND_API_KEY` + `EMAIL_FROM` (email digests/alerts) · `CRM_WEBHOOK_SECRET` (lead loop) · publishing set `META_PAGE_ACCESS_TOKEN`/`META_PAGE_ID`/`IG_USER_ID`/`TIKTOK_PUBLISH_TOKEN`/`MESSENGER_VERIFY_TOKEN` · `INGEST_API_KEY` · `ADPILOT_CONTEXT_PACK_JSON` (leave UNSET for the clean build) · `ANTHROPIC_MODEL` / `GEMINI_IMAGE_MODEL` / `GEMINI_EDIT_MODEL` (defaults are fine) · approved execution: `AD_WRITE_EXECUTION_ENABLED`, `AD_WRITE_MAX_DAILY_BUDGET`, and `AD_WRITE_MAX_BUDGET_CHANGE_PCT`.

> Full per‑variable documentation lives in `adpilot-v2/.env.example`.

## 6. Step 5 — Crons (Vercel)
`vercel.json` schedules 5 jobs, all Bearer‑auth'd by `CRON_SECRET` (`lib/cron-auth.ts`):
`auto-sync` (hourly) · `publish` (every 15 min) · `auto-analysis` (daily 21:00) · `weekly-digest` (Fri 23:00) · `refresh-knowledge` (Mon 08:00).
- These activate automatically on a production deploy. **Requires Vercel Pro** for the sub‑daily schedules.
- Verify after deploy: `curl -H "Authorization: Bearer $CRON_SECRET" https://<domain>/api/cron/auto-sync` returns 200 (and 401 without the header).

## 7. Step 6 — Domain + OAuth/redirects
1. **Vercel → Domains** → add your custom domain; follow DNS instructions.
2. Set `NEXT_PUBLIC_APP_URL` and `OAUTH_REDIRECT_BASE` to `https://<your-domain>`.
3. Update redirect/callback URLs to the domain in: **Meta app** (`/api/oauth/meta/callback`), **TikTok app** (`/api/oauth/tiktok/callback`), **Stripe webhook** (Step 3.4), and **Supabase Auth** redirect URLs (Step 2.3).

## 8. Step 7 — Deploy
- **Merge the release PR to `main`** → Vercel's GitHub integration auto‑builds & promotes Production.
- Or **Vercel → Deployments → Promote** an existing build to Production.

## 9. Step 8 — Post‑deploy smoke test
1. Sign up / log in (Supabase auth works on the domain).
2. **Ads Health** → paste the sample CSV → a 0–100 score renders (engine + AI specialists respond → `ANTHROPIC_API_KEY` good).
3. **Connect** → paste a Meta token → Sync pulls rows (token encrypt/decrypt → `TOKEN_ENCRYPTION_KEY` good).
4. **Billing** → start a checkout (Stripe price IDs + secret good); confirm the webhook marks the subscription active.
5. **Creative Studio** (Pro) → generate an image (`GEMINI_API_KEY` good).
6. Cron auth check (Step 6).

---

### Quick reference
- Env docs: `adpilot-v2/.env.example` · Platform‑connect help: `docs/SETUP-CONNECT-PLATFORMS.md` + in‑app `/connect/guide`
- Migrations: `supabase/migrations/0001…0023` · Crons: `vercel.json` · CI: `.github/workflows/adpilot-v2-ci.yml`
- Invariant: **controlled by default — AdPilot proposes and the human approves.** Keep `AD_WRITE_EXECUTION_ENABLED` unset for launch; enabling it requires Expert-manager approval, a separate write token, typed confirmation, and budget guardrails.
