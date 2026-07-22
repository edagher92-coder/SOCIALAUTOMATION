# AdPilot OS — production deploy runbook

> Practical, numbers-first checklist for taking the live app (`adpilot-v2/`) to production on Vercel +
> Supabase. Read-only posture by default — live ad writes stay **OFF** for launch. AU English, AUD.
> Source of truth for env names is the code (`process.env.*`) and `.env.example`; this runbook mirrors them.

## 0. Owner-gated prerequisites (cannot launch without these)

These are human/business steps — no code change unblocks them:

- [ ] **Stripe price IDs** for the wired plans (Starter $49 / Pro $149 / Expert $399, annual ≈ 2 months free)
      → set `NEXT_PUBLIC_STRIPE_PRICE_STARTER` / `_PRO` / `_EXPERT`.
- [ ] **Admitted-solicitor sign-off** of the DRAFT Terms/Privacy frameworks (`CPWORK/.../legal/`).
      Key open issue: lead-hash is likely personal information.
- [ ] **Meta System User token** (non-expiring) to run the real-account audit, plus Meta **App Review**
      for any live read/publish scopes (organic insights need `pages_read_engagement` +
      `instagram_manage_insights`).
      - Role must be **Analyst** (read-only); scopes required: `ads_read` + `read_insights`.
      - In Business Manager, **assign each target ad account explicitly** to the System User.
        Documented trap: leaving the Account ID field blank can silently re-add unreadable
        portfolio accounts — always set the numeric `act_<account_id>` value.

## 1. Supabase (database + RLS)

Run migrations **in order** against the production project:

```
adpilot-v2/supabase/migrations/0001 … 0032
```

- Intentional gaps **0012–0015** — these numbers do not exist; **never backfill**.
- Every table is RLS-scoped via `is_org_member`. Do not disable RLS.
- `0026_organic_posts.sql` is idempotent (`CREATE TABLE IF NOT EXISTS`, policy guard) — safe to re-run.
- `0027_ingestion_runs.sql` adds the RLS-scoped `ingestion_runs` audit table (records every pull:
  status, rows written, window, graph version — **no token column**) and a unique constraint on
  `connected_ad_accounts (organisation_id, platform, external_account_id)`.
- Apply via the Supabase SQL editor (paste each file) or the Supabase CLI (`supabase db push`).

## 2. Vercel environment variables

### 2a. Required — the app is "degraded" (HTTP 503 on `/api/health`) without these

| Var | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; never exposed to the browser |
| `TOKEN_ENCRYPTION_KEY` | 32-byte key (hex or base64) — `/api/health` validates the length |
| `NEXT_PUBLIC_APP_URL` | Public site URL (e.g. `https://app.example.com`) |
| `CRON_SECRET` | Protects **all** crons (Vercel Cron Bearer) |
| `PII_PEPPER` | **Required in prod** — salt for one-way lead email/phone hashing (no plaintext stored) |

> `PII_PEPPER` is required by `lib/pii.ts` (CRM/lead hashing) but is **not** in the `/api/health`
> required list, so health can read "ok" without it. Set it before accepting any lead/CRM traffic.

### 2b. Billing (owner-gated values from §0)

`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PRICE_STARTER`,
`NEXT_PUBLIC_STRIPE_PRICE_PRO`, `NEXT_PUBLIC_STRIPE_PRICE_EXPERT`.

### 2c. AI

- `ANTHROPIC_API_KEY` — powers the AI specialists / explainers (server only).
- `ANTHROPIC_MODEL` — optional; defaults to `claude-sonnet-4-6` (set `claude-opus-4-8` for deepest output).

### 2d. Feature-gated (set only what you switch on)

| Feature | Vars |
|---|---|
| Meta/TikTok ad connect (OAuth) | `META_APP_ID`, `META_APP_SECRET`, `TIKTOK_APP_ID`, `TIKTOK_APP_SECRET`, `OAUTH_REDIRECT_BASE`, `META_GRAPH_API_VERSION` (see note below) |
| Content publishing (organic posts/reels) | `META_PAGE_ACCESS_TOKEN`, `META_PAGE_ID`, `IG_USER_ID`, `TIKTOK_PUBLISH_TOKEN`, `MESSENGER_VERIFY_TOKEN` |
| Live organic-insights sync | `ORGANIC_SYNC_ORG_ID` (+ the Page token + Page/IG ids above; needs App Review read scopes) |
| Email digests/alerts (Resend) | `RESEND_API_KEY`, `EMAIL_FROM` |
| Creative Studio (image gen) | `FIREFLY_CLIENT_ID`, `FIREFLY_CLIENT_SECRET`, and/or `GEMINI_API_KEY` |
| Lead/CRM webhook | `CRM_WEBHOOK_SECRET` (+ `PII_PEPPER`) |
| Private context pack | `ADPILOT_CONTEXT_PACK_JSON` — **leave UNSET** for the resale-clean build |
| Automation ingest | `INGEST_API_KEY` — optional |
| Support / privacy contact | `SUPPORT_EMAIL` — shown in the manual **and used as the data-deletion contact**; set a real address |

> **`META_GRAPH_API_VERSION`** — defaults to `v23.0` (centralised in `lib/meta/graph-version.ts`).
> Setting this env var moves **all** Meta API callers (insights pull, token probe, account discovery)
> together. After changing the version, run the real-account smoke test (§5 below) — v21→v23 is a
> behaviour change worth verifying end-to-end.

> **`SUPPORT_EMAIL`** is the documented name and is now honoured by `/api/data-deletion`
> (with `NEXT_PUBLIC_SUPPORT_EMAIL` accepted as a fallback). If neither is set, the endpoint
> falls back to a placeholder — not acceptable for a live privacy contact.

### 2e. Paid-ad change boundary

- V7 does not contain a live paid-ad writer and has no environment switch that can enable one.
- Expert workspaces can prepare approval-ready change drafts. An owner/admin reviews the evidence
  and applies an accepted change in the advertising platform.
- Do not request or store `ads_management` solely for AdPilot V7. Read-only advertising scopes are
  sufficient for paid-ad analysis and proposals.

## 3. Crons (already declared in `adpilot-v2/vercel.json`)

| Path | Schedule (UTC) |
|---|---|
| `/api/cron/auto-sync` | hourly (`0 * * * *`) |
| `/api/cron/publish` | every 15 min (`*/15 * * * *`) |
| `/api/cron/auto-analysis` | daily 21:00 (`0 21 * * *`) |
| `/api/cron/weekly-digest` | Fri 23:00 (`0 23 * * 5`) |
| `/api/cron/refresh-knowledge` | Mon 08:00 (`0 8 * * 1`) |
| `/api/cron/organic-sync` | daily 07:00 (`0 7 * * *`) — inert until §2d organic vars are set |

All crons are gated by constant-time `CRON_SECRET` auth. Set `CRON_SECRET` in Vercel; the platform
sends it as the Cron Bearer automatically.

## 4. Verify before deploy (mirrors CI — `.github/workflows/adpilot-v2-ci.yml`)

From `adpilot-v2/`:

```bash
npm install --no-audit --no-fund          # package-lock.json is gitignored — npm install, not npm ci
# resale-clean guard — the token list is defined once in the CI workflow above (not duplicated
# here, so this doc can't trip its own guard); must find nothing:
grep -rInE "$(awk -F'\"' '/grep -rInE/{print $2; exit}' ../.github/workflows/adpilot-v2-ci.yml)" . \
  --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git \
  && echo "RESALE-CLEAN FAIL" || echo "resale-clean OK"
npm run typecheck                          # tsc --noEmit
npm test                                   # vitest run — engine + app tests must pass
npm run build                              # production build (typechecks pages + app)
```

CI runs this on every push/PR touching `adpilot-v2/**`. Do not merge to `main` red.

## 5. Deploy + post-deploy smoke test

1. Deploy from `main` on Vercel (root: `adpilot-v2/`).
2. Hit the readiness probe — it returns **presence booleans only** (never secret values):

   ```bash
   curl -s https://<your-domain>/api/health | jq
   ```

   Expect:
   ```json
   { "status": "ok", "missingRequired": [], "tokenKeyValid": true, "features": { … } }
   ```
   - `status: "degraded"` + HTTP **503** → read `missingRequired` and set those vars.
   - `tokenKeyValid: false` → `TOKEN_ENCRYPTION_KEY` is missing or not a valid 32-byte key.
   - `features` shows which optional capabilities are wired (billing, ai_team, meta_oauth, …).

3. Confirm a cron fires (Vercel → Deployments → Cron logs) and that `/api/cron/organic-sync`
   returns `{configured:false}` until the organic vars are set (expected, inert).

4. **After any `META_GRAPH_API_VERSION` change** (e.g. v21→v23), run the real-account smoke test:

   ```bash
   # trigger a Meta data pull, then score the result
   curl -X POST https://<your-domain>/api/sync/meta  -H "x-api-key: $INGEST_API_KEY"
   curl -X POST https://<your-domain>/api/audit/run  -H "x-api-key: $INGEST_API_KEY"
   ```

   Confirm both return HTTP 200 and that a fresh row appears in `ingestion_runs` with
   `status = 'ok'` and the expected `graph_version` value.

## 6. Launch posture

- **Human-controlled spend**: the product audits, watches and prepares proposals. V7 cannot change
  a live paid ad; accepted drafts are applied by a human in the advertising platform.
- **Resale-clean**: no private business data in the shippable tree (CI grep guard — pattern defined in `.github/workflows/adpilot-v2-ci.yml`).
- **AU defaults**: Australian English, AUD; anti-hype (no guarantees / earnings / financial-legal-tax advice).
