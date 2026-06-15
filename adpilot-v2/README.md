# AdPilot OS — multi-tenant ads + content SaaS

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind · Supabase (Auth + Postgres + RLS) · Stripe (billing) · Anthropic (AI specialists + knowledge auto-refresh).

A read-only ad-analysis engine plus organic content publishing and a multi-channel chat bot — all multi-tenant, with per-org isolation via RLS. The ad engine **analyses and proposes**; it never edits, pauses, or creates ads.

_Last updated: 2026-06-15._

## Features

- **Health Score & analysis** — the 13-factor engine (`lib/engine`), CSV import, and saved reports.
- **API / dev-link connect** — read-only Meta/TikTok connection (OAuth or pasted access token).
- **Automated sync** — cadence-based pulls (Hourly/Daily/Weekly/custom) on a cron.
- **AI specialist team** — Anthropic-backed specialists grounded on dated, sourced domain knowledge, **auto-refreshed weekly** via Anthropic web search (falls back to the committed baseline in `lib/agents/knowledge.ts` when `ANTHROPIC_API_KEY` is absent).
- **Content Studio** — upload reels/posts → approve → **publish now or schedule** to Facebook / Instagram / TikTok (organic only; write scopes separate from the read-only ad layer). Scheduled posts go out via `/api/cron/publish` (every 15 min).
- **AI Creative Studio** — AI-drafted platform-native posts/reels as a starting point.
- **Messenger automation** — no-prompt entry setup (greeting, ice breakers, menu) **plus** a multi-channel webhook bot answering **Messenger, Instagram DMs, and WhatsApp** with keyword/payload/welcome/away/default rules, hours-aware.
- **Multi-client workspaces**, **white-label reports**, and **expert plugins**.

## Plans & feature matrix

Gating lives in `lib/entitlements.ts` (single source of truth). Each feature unlocks at its minimum plan and stays unlocked above it.

| Feature | Free | Starter | Pro | Expert |
|---|:--:|:--:|:--:|:--:|
| CSV import | ✓ | ✓ | ✓ | ✓ |
| Health Score | ✓ | ✓ | ✓ | ✓ |
| Saved reports | | ✓ | ✓ | ✓ |
| Content upload & publishing | | ✓ | ✓ | ✓ |
| API / dev-link connect | | | ✓ | ✓ |
| Automated sync (cadence) | | | ✓ | ✓ |
| AI specialist team | | | ✓ | ✓ |
| AI Creative Studio | | | ✓ | ✓ |
| Multi-client workspaces | | | ✓ | ✓ |
| Messenger automation | | | | ✓ |
| White-label reports | | | | ✓ |
| Expert plugins | | | | ✓ |

(`agency`/`enterprise` are aliases for **Expert**.)

## Run locally

```bash
cd adpilot-v2
cp .env.example .env.local      # fill in Supabase keys (+ optional Stripe / Anthropic / publishing / Messenger)
npm install
# create the DB: run supabase/migrations/*.sql in order in the SQL editor (or supabase db push)
npm run test                    # engine parity (vitest)
npm run typecheck
npm run dev                     # http://localhost:3000
```

Optional env unlocks features when set (all blank = disabled): `ANTHROPIC_API_KEY` (AI team + knowledge refresh), `META_PAGE_ACCESS_TOKEN`/`META_PAGE_ID`/`IG_USER_ID`/`TIKTOK_PUBLISH_TOKEN` (Content Studio publishing), `MESSENGER_VERIFY_TOKEN`/`META_APP_SECRET` (Messenger bot), `CRON_SECRET` (protects all crons), `TOKEN_ENCRYPTION_KEY` (token encryption at rest). See `.env.example` for the full list.

## Deploy

**Vercel** (app, Root Directory `adpilot-v2`) + **Supabase** (DB/Auth). Crons in `vercel.json` register on deploy: auto-sync (hourly), publish (every 15 min), auto-analysis (daily), weekly digest, and knowledge refresh (weekly). Hourly cadence needs the Vercel Pro plan (Hobby runs crons once/day). Security headers ship via `next.config.mjs`.

See **[docs/GO-LIVE.md](docs/GO-LIVE.md)** for the full go-live runbook, **[docs/MESSENGER.md](docs/MESSENGER.md)** for the Messenger bot operator guide, and **[docs/PER-CLIENT-ONBOARDING.md](docs/PER-CLIENT-ONBOARDING.md)** for onboarding a new client.

## Engine = single source of truth

`lib/engine` is a faithful TypeScript port of the canonical 13-factor health model; `engine.test.ts` keeps the port honest.

## Safety

The ad layer is **read-only** — it analyses and **proposes**; it never edits, pauses, or creates ads. Write scopes exist only for **organic publishing** and **Messenger profile setup**, both deliberately separate from the ad layer and limited to content/config the user approves. RLS isolates every org; all tokens (ad, publishing, Messenger) are encrypted at rest (AES-256-GCM) and never sent to the browser; all secrets stay server-side.
