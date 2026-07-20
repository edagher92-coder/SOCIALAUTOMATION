# AdPilot OS v3 — Implementation Specification

_Single comprehensive engineering reference. Dated 2026-06-15. Branch: `claude/content-studio`._
_Repo root for this spec: `adpilot-v2/`. All paths below are relative to that directory unless noted absolute._

This document describes **what is actually in the repository today** plus one clearly-marked **PLANNED** section (§6, LLM-grounded auto-replies). It is written to be precise enough to implement against: it names files, routes, tables, columns, env vars, and the exact control flow that ties them together.

---

## Table of contents

1. Product overview & the read-only-ads safety invariant
2. Stack & architecture (server/client boundaries, admin vs RLS client)
3. Subscription tiers & entitlements (`lib/entitlements.ts`)
4. Data model (migrations `0001`–`0009`) + RLS posture
5. Feature modules (routes/files)
6. PLANNED — LLM-grounded Messenger auto-replies
7. Cron schedule (`vercel.json`) + required env vars
8. Security model
9. App-review / go-live prerequisites
10. Phased roadmap (shipped vs next)

---

## 1. Product overview & the read-only-ads safety invariant

AdPilot OS is a multi-tenant SaaS that connects to a business's Meta (Facebook/Instagram) and TikTok **ad accounts read-only**, pulls campaign performance, scores account health on a 13-factor model, and produces **safe, human-approved proposals**. It layers on an AI specialist team, an organic Content Studio, and (premium) Messenger/Instagram/WhatsApp automation.

### The safety invariant (non-negotiable)

> **The product analyses and *proposes*. It never edits, pauses, scales, or creates ads.**

This invariant is enforced in several places and must be preserved by any change:

- **Read-only OAuth scopes only** for ad data: Meta `ads_read,read_insights`, TikTok `ads.read` (`lib/oauth/config.ts`, `app/api/connect/token/route.ts`).
- **Proposals are intent records, not actions.** `app/api/recommendations/[id]/route.ts` lets a user set a recommendation `status` to `open|approved|dismissed|done`; the route comment is explicit: _"'approve' records intent; it never edits a live ad."_
- **Agent guardrails.** Every AI specialist system prompt (`lib/agents/registry.ts`, `GUARDRAILS`) carries: _"Propose only. Never instruct to directly edit, pause, scale, or spend without an explicit human 'YES'. Frame every change as a reversible step."_
- **Engine output** carries a literal safety string: `"Read-only analysis. No live ad was changed. Budget moves need a typed YES."` (`lib/engine/index.ts`, `analyse()`).

### Organic messaging/content is a *separate* layer

Two write-capable subsystems exist, and both are deliberately walled off from the ad layer:

- **Content Studio** (`content_posts`, `lib/publish/providers.ts`) publishes only **organic** posts/reels the user uploaded and explicitly approved. It uses **write-scope** Page/IG/TikTok credentials kept in distinct env vars, never the read-only ad tokens. UI banner (`app/(app)/content/page.tsx`): _"This publishes organic content you approve — it's separate from the read-only ad analysis. We still never edit, pause, or create ads."_
- **Messenger automation** (`messenger_pages`, webhook bot) writes only **conversational replies** through the Send/Cloud APIs using per-page write-scope Page tokens, again separate from ad tokens. UI banner (`app/(app)/messenger/page.tsx`): _"separate from the read-only ad layer (we never edit, pause, or create ads)."_

Any future ad-write capability must be gated behind explicit, per-action human approval and is out of scope here.

---

## 2. Stack & architecture

**Stack** (`package.json`): Next.js `^14.2.35` (App Router) · React 18 · TypeScript · Tailwind · Supabase (`@supabase/ssr`, `@supabase/supabase-js`) · Stripe `^16` · Zod `^3`. Tests: Vitest. Node `>=18.18`. There is **no Anthropic SDK dependency** — Claude is called via raw `fetch` against the Messages API (see `lib/ai/claude.ts`).

### Server vs client boundaries

- **Server-only modules** are marked with `import "server-only"` and must never be imported into a client component: `lib/crypto.ts`, `lib/sync/pull.ts`, `lib/agents/*`, `lib/ai/claude.ts`, `lib/messenger/*`, `lib/publish/providers.ts`, `lib/org.ts`, `lib/cron/score.ts`, `lib/oauth/config.ts`, `lib/supabase/admin.ts`, `lib/supabase/server.ts`.
- **API route handlers** (`app/api/**/route.ts`) declare `export const runtime = "nodejs"` (required for `crypto`, service-role client, etc.). Long-running routes set `maxDuration` (webhook `60`, refresh-knowledge `300`).
- **Client components** (`"use client"`) live in `components/*` and only talk to the server through `fetch` to `/api/*`. Example: `components/MessengerBot.tsx`, `components/ContentStudio.tsx`.
- **Server components / pages** (`app/(app)/**/page.tsx`) read auth + plan server-side and pass minimal props to client components. Most app pages set `export const dynamic = "force-dynamic"`.

### Three Supabase client surfaces

| Client | File | Key | Use |
|---|---|---|---|
| Browser | `lib/supabase/client.ts` (`createBrowserClient`) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client components; RLS-enforced. |
| Server (RLS) | `lib/supabase/server.ts` (`createServerClient` + cookies) | anon key, user session via cookies | Reads scoped to the signed-in user; RLS enforced. Used for `auth.getUser()` and member-scoped reads (e.g. `GET /api/content`, `GET /api/messenger/pages`). |
| Admin (service role) | `lib/supabase/admin.ts` (`createAdminClient`) | `SUPABASE_SERVICE_ROLE_KEY` | **Bypasses RLS.** Server-only. Used for org bootstrap, persistence, webhook upserts, token decrypt reads, cron sweeps. Comment: _"NEVER import this into a client component."_ |

**Pattern in mutating routes:** authenticate via the RLS server client (`auth.getUser()`), resolve `orgId` + plan, gate the feature, then perform the write via the **admin** client but **always scoped with `.eq("organisation_id", orgId)`** (and `.eq("id", ...)` where relevant) so the service role can't cross org boundaries. See `app/api/recommendations/[id]/route.ts`, `app/api/content/[id]/route.ts`.

**Middleware** (`middleware.ts`) refreshes the Supabase session on every request and redirects unauthenticated users away from the app routes (`/command`, `/proposals`, `/content`, `/messenger`, `/dashboard`, `/ai-specialists`, `/reports`, `/billing`, `/connect`, `/notifications`, `/agency`, `/creative`, `/settings`, `/manual`, and several creator pages). The matcher excludes `_next/*` and static assets.

### Org model & multi-client (`lib/org.ts`)

- `ensureOrg(userId, email)` — on first use, creates a personal organisation (`"<emailprefix>'s workspace"`) + an `owner` membership.
- `getActiveOrgId(userId, email)` — returns the org from the `active_org` cookie if the user is a member of it, else the first membership, else bootstraps one. This drives multi-client workspace switching (`/api/org/switch`, `components/OrgSwitcher.tsx`).
- `planForOrg(orgId)` — latest `billing_subscriptions` row with `status = 'active'`, normalised; defaults to `"free"`.

---

## 3. Subscription tiers & entitlements (`lib/entitlements.ts`)

A pure module (no DB, no `server-only`) so both UI and API routes import it. **It is the single source of truth for feature gating.**

### Plans

`type Plan = "free" | "starter" | "pro" | "expert"`. Ladder via `PLAN_RANK`: `free 0 < starter 1 < pro 2 < expert 3`. `normalisePlan()` maps `"agency"` and `"enterprise"` → `"expert"`; unknown → `"free"`.

### Feature → minimum-plan matrix (`FEATURE_MIN_PLAN`)

| Feature (key) | Min plan | Meaning |
|---|---|---|
| `csv_import` | free | CSV upload + analysis |
| `health_score` | free | 13-factor health scoring |
| `reports` | **starter** | Saved reports |
| `content_publish` | **starter** | Upload + schedule/publish own organic content |
| `api_connect` | **pro** | OAuth + dev-token connection |
| `auto_sync` | **pro** | Cadence-based automated pulls |
| `ai_team` | **pro** | AI specialist layer |
| `creative_studio` | **pro** | AI-drafted creative (Stella) + Canva/Adobe |
| `multi_client` | **pro** | Multi-client workspaces |
| `messenger_automation` | **expert** | No-prompt Messenger setup + webhook bot |
| `white_label` | **expert** | White-label reports |
| `expert_plugins` | **expert** | Team-built extras |

Helpers: `can(plan, feature)` returns `PLAN_RANK[plan] >= PLAN_RANK[FEATURE_MIN_PLAN[feature]]`; `requiredPlan(feature)` returns the smallest plan that unlocks it (used for upgrade prompts). `PLAN_LABEL` / `FEATURE_LABEL` provide UI strings.

**Gate pattern in routes:** every protected route calls `can(await planForOrg(orgId), <feature>)` and returns **HTTP 402** with `{ error, upgrade: true }` when denied (e.g. `app/api/agents/run/route.ts`, `app/api/content/route.ts`, `app/api/messenger/*`). Pages render an upgrade card instead of the feature.

---

## 4. Data model (migrations `0001`–`0009`)

Migrations are applied in order from `supabase/migrations/`. Tenant isolation is by `organisation_id` on every business table, with a `SECURITY DEFINER` helper:

```sql
create function is_org_member(org uuid) returns boolean ... as $$
  select exists (select 1 from memberships m
    where m.organisation_id = org and m.user_id = auth.uid());
$$;
```

The generic policy `"org members rw" ... for all using (is_org_member(organisation_id)) with check (is_org_member(organisation_id))` is applied to most business tables.

### `0001_init.sql` — identity, ad data, billing, audit

| Table | Key columns | RLS posture |
|---|---|---|
| `organisations` | `id, name, currency('AUD')`, `created_at` (+ columns added in 0003/0005) | RLS on; `"org read"` SELECT via `is_org_member(id)`. |
| `profiles` | `id` (= `auth.users.id`), `email, full_name` | RLS on; `"own profile"` (`id = auth.uid()`). |
| `memberships` | `organisation_id, user_id, role(member_role enum: owner/admin/member/viewer)`, unique `(org,user)` | RLS on; `"membership read"` SELECT via `is_org_member`. |
| `connected_ad_accounts` | `organisation_id, platform('meta'|'tiktok'), external_account_id, display_name, status('connected')` | generic org-members rw. |
| `platform_tokens` | `organisation_id, ad_account_id, platform, encrypted_token bytea (legacy, made nullable in 0004), scopes text[], expires_at`; **+ `ciphertext/iv/auth_tag` text added in 0003** | generic org-members rw. **`encrypted_token`/`ciphertext` must never be returned to the browser** — read only via admin client + app-layer decrypt. |
| `campaign_snapshots` | universal one-row-per-ad-per-day schema: `platform, campaign_*, adset_*, ad_*, date, objective, budget_type, spend, impressions, reach, frequency, clicks, ctr, cpc, cpm, landing_page_views, leads, purchases, revenue, video_views, three_second_views, thruplays, hook_rate, hold_rate, lead_quality_score, tracking_status, utm_*, source('csv')`; indexes on `(org,date)` and `(org,platform,ad_id,date)` | generic org-members rw. |
| `health_scores` | `scope('account'|'campaign'), campaign_name, total, band, breakdown jsonb, data_confidence, period_start/end` | generic org-members rw. |
| `recommendations` | `verdict, entity_name, platform, reason, proposal, confidence, status('open'\|approved\|dismissed\|done)` | generic org-members rw. |
| `reports` | `title, period, payload jsonb, created_by` | generic org-members rw. |
| `billing_subscriptions` | `stripe_customer_id, stripe_subscription_id, plan, status, current_period_end` | generic org-members rw. (unique index added in 0004) |
| `audit_logs` | `id bigint identity, organisation_id, user_id, action, detail jsonb` | RLS on; **SELECT only** (`"audit read"`); inserts via service role. Append-only. |

### `0002_phase3.sql` — token ciphertext, notifications, white-label

- Adds `platform_tokens.ciphertext / iv / auth_tag` (base64; AES-256-GCM in app layer).
- `notification_rules` — `organisation_id (unique), email, weekly_digest(bool, default true), critical_alerts(bool, default true)`. RLS on; generic org rw.
- `white_label_profiles` — `organisation_id (unique), brand_name, logo_url, primary_color('#0b5fff'), support_email`. RLS on; generic org rw.

### `0003_phase4.sql` — org economics, creative assets, storage

- `organisations.average_sale_value numeric default 200`, `gross_margin numeric default 0.6` (drive break-even in scoring).
- `creative_assets` — `kind('image'|'video'|'audio'), source('link'|'upload'|'ai'), provider, title, url, linked_campaign, created_by`. RLS on; generic org rw.
- Storage bucket `creative` (public read) + `storage.objects` policies `"creative upload"` (authenticated insert) / `"creative read"` (public select).

### `0004_hardening.sql` — QA fixes

- `platform_tokens.encrypted_token` made **nullable** (tokens now live in ciphertext/iv/auth_tag).
- Unique index `billing_subscriptions_stripe_sub_uniq` on `stripe_subscription_id` (where non-empty) → idempotent Stripe webhooks.

### `0005_auto_sync.sql` — per-org cadence

- `organisations.sync_interval_hours integer not null default 24` (0 = off, 1 = hourly, 24 = daily, 168 = weekly, or custom) and `last_synced_at timestamptz`. Drive the hourly auto-sync cron.

### `0006_content.sql` — Content Studio

- `content_posts` — `organisation_id, platform('facebook'|'instagram'|'tiktok'), caption, media_url, media_type('image'|'video'|'reel'), status('draft'|'approved'|'scheduled'|'published'|'failed'), scheduled_at, published_at, external_id, error, source('upload'|'studio'), created_by, created_at, updated_at`; index on `(org,status,scheduled_at)`. RLS on; generic org rw (`"content org rw"`). Comment stresses it only publishes approved organic content and never touches ads.

### `0007_knowledge.sql` — refreshable knowledge store

- `knowledge_docs` — primary key `domain('meta'|'tiktok'|'policy'|'seo')`, `title, body, sources jsonb, model, updated_at`. **RLS enabled with NO policy** → readable/writable only via the **service role**. Workspace-global (not org-scoped). The committed `lib/agents/knowledge.ts` baseline is the fallback when this table is empty.

### `0008_messenger_bot.sql` — webhook bot core

- `messenger_pages` — `organisation_id, external_page_id (unique), display_name, ciphertext/iv/auth_tag (encrypted Page token, write scopes)`. RLS on; generic org rw (`"msgr pages org rw"`).
- `messenger_rules` — `organisation_id, external_page_id, trigger_type('keyword'|'payload'|'welcome'|'default'), trigger (csv keywords or payload; null for welcome/default), reply, priority(int default 0)`; index `(external_page_id, trigger_type, priority)`. RLS on; generic org rw.

### `0009_messenger_multichannel.sql` — multi-channel + hours + greeting cooldown

- `messenger_pages.channel text not null default 'messenger'` (check `messenger|whatsapp`; `messenger` rows also serve Instagram DM) and `business_hours jsonb`.
- `messenger_rules.trigger_type` check extended to include `'away'`.
- `messenger_threads` — `external_page_id, sender_id, last_greeted_at`, PK `(external_page_id, sender_id)`. **RLS enabled with NO policy** → service-role only. Backs the first-message greeting cooldown.

**Note on RLS posture summary:** every org-scoped business table uses `is_org_member`; `audit_logs` is SELECT-only; `knowledge_docs` and `messenger_threads` have RLS on with **no policy** (service-role-only); `profiles` is self-only; `organisations`/`memberships` are membership-gated SELECT.

---

## 5. Feature modules (routes/files)

### 5.1 Command Center — `/command`
`app/(app)/command/page.tsx`. The post-login landing surface: shows the latest health score, band, and the most urgent safe action. Backed by the latest `reports`/`health_scores` rows.

### 5.2 Proposals queue — `/proposals`
- Page: `app/(app)/proposals/page.tsx`; actions component `components/RecActions.tsx`.
- API: `PATCH /api/recommendations/[id]` (`app/api/recommendations/[id]/route.ts`). Body `{ status: 'open'|'approved'|'dismissed'|'done' }` (Zod). Auth via RLS client; the update goes through the admin client **scoped `.eq("id", id).eq("organisation_id", orgId)`** so a member cannot mutate another org's rows. 404 if no row matched. Read-only product: approving records intent, never edits a live ad.
- The open proposal set is (re)generated by scoring (`lib/cron/score.ts`): it deletes the current `status='open'` rows and re-inserts deduped actionable verdicts (`scale|kill|reduce|refresh|fix-tracking`), preserving approved/dismissed/done history.

### 5.3 Connect, dev-token & idempotent sync
- **Page:** `/connect` (`app/(app)/connect/page.tsx`), components `components/TokenConnect.tsx`, `components/SyncButton.tsx`.
- **Dev-token connect:** `POST /api/connect/token` (`api_connect`, Pro+). Body `{ platform: 'meta'|'tiktok', token, accountId? }`. Validates the token against the platform (Meta: `me/adaccounts`; TikTok requires an explicit `advertiser_id`), encrypts it (`lib/crypto`), inserts `platform_tokens` + `connected_ad_accounts`, then **pulls immediately** so numbers appear with no extra prompt. This bypasses platform App Review (paste a `ads_read` token from Graph API Explorer / a Business System User).
- **OAuth:** `GET /api/oauth/[platform]/start` and `.../callback` (`app/api/oauth/[platform]/*`). `start` sets an httpOnly, single-use state cookie and redirects to the provider; `callback` verifies state, exchanges the code, stores the encrypted token + accounts, and pulls immediately. Config in `lib/oauth/config.ts` (Meta `ads_read,read_insights`; TikTok `ads.read`; Graph version comes from `META_GRAPH_API_VERSION`, release default `v23.0`). `configured` flips on presence of `META_APP_ID/SECRET` / `TIKTOK_APP_ID/SECRET`.
- **Manual sync:** `POST /api/sync/[platform]` (`app/api/sync/[platform]/route.ts`, `api_connect` gate) → same idempotent puller.
- **The puller** (`lib/sync/pull.ts`, `syncOrgPlatform(admin, orgId, platform)`): decrypts the latest token, pulls a rolling **30-day** window for every connected account (`metaPull` campaign insights `last_30d`/`time_increment=1`; `tiktokPull` `BASIC`/`AUCTION_CAMPAIGN` report). **Idempotent:** before insert it deletes API-sourced rows (`source = '<platform>_api'`) in the window so repeated syncs never double-count; CSV rows (`source='csv'`) are never touched. Throws on missing token/account/API error; callers decide whether to swallow. (Meta `ctr`/TikTok `ctr` are divided by 100 to normalise to a fraction.)

### 5.4 Cadence auto-sync + scoring crons
- **`GET /api/cron/auto-sync`** (hourly): for each org, gate on `auto_sync` (Pro+), skip if `sync_interval_hours <= 0` or not yet due (`interval*3.6e6 − 5min` slack), skip if no connected accounts; otherwise call `syncOrgPlatform` per connected platform, set `last_synced_at`, then `scoreAndAlertOrg`. Per-platform and per-org failures are isolated (one bad org never kills the sweep).
- **`GET /api/cron/auto-analysis`** (daily 21:00): `scoreAndAlertOrg` for **every** org (covers CSV-only orgs that never sync via API).
- **`GET /api/cron/weekly-digest`** (Fri 23:00): emails orgs with `notification_rules.weekly_digest=true` + an email, latest health summary.
- **Scoring core** (`lib/cron/score.ts`, `scoreAndAlertOrg`): pulls last 14 days of `campaign_snapshots`, runs `analyse()` (`lib/engine`) with org economics (`average_sale_value`, `gross_margin`, AUD), writes a `health_scores` row + a `reports` row, refreshes the open `recommendations` set (delete-then-insert actionable verdicts), and — if there are CRITICAL findings or a Red band and `critical_alerts` is on — emails an alert via `lib/email/resend.ts`. Email is best-effort.

### 5.5 Content Studio
- **Page:** `/content` (`app/(app)/content/page.tsx`) gates on `content_publish` (Starter+) for the studio and `creative_studio` (Pro+) for AI drafting; component `components/ContentStudio.tsx`.
- **CRUD:** `GET/POST /api/content` (`app/api/content/route.ts`). POST (`content_publish` gate) creates a `draft` `content_posts` row. GET lists the org's posts (RLS server client).
- **Per-post:** `PATCH/DELETE /api/content/[id]` (`app/api/content/[id]/route.ts`, `content_publish` gate, org-scoped writes). PATCH supports field edits (status/caption/scheduled_at) and `publishNow: true`. Scheduling to `'scheduled'` requires a `scheduled_at`.
- **AI draft:** `POST /api/content/draft` (`creative_studio` gate) — Stella drafts a platform-native organic post/reel grounded in the latest analysis (hooks, caption, hashtags, shotlist), via `callClaude`. The output is a starting point the user edits, then uploads/approves/publishes.
- **Publish providers** (`lib/publish/providers.ts`): `publishFacebook` (`/{pageId}/photos` for images, else `/feed`), `publishInstagram` (two-step container → `media_publish`, REELS/VIDEO/image), `publishTikTok` (Content Posting API `PULL_FROM_URL`, `privacy_level: SELF_ONLY` until app-approved). Credentials come from **write-scope env vars** (`META_PAGE_ACCESS_TOKEN`+`META_PAGE_ID`, `IG_USER_ID`, `TIKTOK_PUBLISH_TOKEN`) — **separate from read-only ad tokens**. Missing credentials throw `NotConfiguredError` (→ HTTP 503) so nothing is silently attempted.
- **Scheduled publish cron:** `GET /api/cron/publish` (every 15 min) — selects up to 50 `status='scheduled'` posts whose `scheduled_at <= now`, re-checks the org's active plan against `content_publish`, publishes via `publishPost`, and updates `status` to `published` (with `external_id`) or `failed` (with `error`). **Only `'scheduled'` posts are sent — reaching that state required a human approval step.**

### 5.6 AI specialist team
- **Page:** `/ai-specialists` (`app/(app)/ai-specialists/page.tsx`); console `components/AgentConsole.tsx`.
- **Registry** (`lib/agents/registry.ts`): 12 personas — Command Centre, Mira (Meta), Travis (TikTok), Dana (data), Stella (creative), Titan (offer/funnel), Milo (automation), Atlas (tracking), Riley (reporting), Paige (policy/safety), Piper (productisation), Quinn (QA). Each carries the shared `GUARDRAILS` (read-only, numbers-first, Australian English, structured **What I found · Why it matters · Safe proposal · Risk & how to reverse**).
- **Knowledge grounding** (`lib/agents/knowledge.ts`): durable dated baseline for domains `meta|tiktok|policy|seo` (benchmarks as ranges, fatigue thresholds, failure→action rules, policy rewrites, SEO/AEO). `AGENT_KNOWLEDGE` maps each agent to its domains. `knowledgeForAgent(admin, agentId)` prefers freshly auto-refreshed `knowledge_docs` rows and **falls back to the committed baseline** if the table is empty/missing.
- **Run:** `POST /api/agents/run` (`app/api/agents/run/route.ts`, `ai_team` gate, Pro+). Body `{ agentId, question? }`. Builds **read-only grounding** from the org's latest `reports.payload` (spend/leads/purchases/revenue/CPA/ROAS/MER, break-evens, health total/band/weakest, critical findings) + up to 20 open `recommendations`, prepends the agent's reference knowledge, and calls `callClaude({ system: agent.system, user, maxTokens: 1200 })`. Returns 503 `{code:'NO_KEY'}` if `ANTHROPIC_API_KEY` is unset.
- **Claude client** (`lib/ai/claude.ts`): raw Messages API via `fetch` (`anthropic-version: 2023-06-01`, key never leaves the server). `callClaude` default model `claude-sonnet-4-6` (override `ANTHROPIC_MODEL`). `researchWithWebSearch` enables the server-side `web_search_20260209` tool (GA), default model `claude-opus-4-8`, and re-sends on `pause_turn` (server-side tool loop).
- **Weekly knowledge refresh:** `GET /api/cron/refresh-knowledge` (Mon 08:00, `maxDuration 300`). For each domain it asks Claude (with `web_search`) to return strict JSON `{title, body, sources}`, parses it, and **upserts `knowledge_docs` keyed on `domain`** (records the `model`). Requires `ANTHROPIC_API_KEY` (else 503, falls back to baseline). Secured by `CRON_SECRET`.

### 5.7 Messenger automation (premium / Expert)
- **Page:** `/messenger` (`app/(app)/messenger/page.tsx`), gated on `messenger_automation`; components `components/MessengerSetup.tsx` (entry experience) + `components/MessengerBot.tsx` (channels + rules).
- **Entry setup (no-prompt):** `GET/POST /api/messenger/setup` (`app/api/messenger/setup/route.ts`). Configures a Page's Messenger profile — greeting, ice breakers, Get Started, persistent menu — straight through the Graph API `messenger_profile` endpoint with a Page token and **zero browser prompts**; idempotent, multi-client. Write-scoped (`pages_messaging` + `pages_manage_metadata`). Implemented in `lib/messenger/profile.ts` (`applyMessengerProfile`, `getMessengerProfile`, `whoami`). True keyword auto-replies are **not** in this API — they need the webhook bot (below) + app review.
- **Channels:** `GET/POST/DELETE /api/messenger/pages` (`app/api/messenger/pages/route.ts`). Register a Messenger/Instagram Page (Page token, validated via `whoami`, `external_page_id` = Page id) or a WhatsApp number (`phoneNumberId` + WhatsApp Cloud token, `external_page_id` = phone id). Token encrypted before upsert; optional `business_hours`. DELETE removes the page + its rules.
- **Rules:** `GET/POST/DELETE /api/messenger/rules` (`app/api/messenger/rules/route.ts`). Keyword/payload/welcome/default rules per page (Zod-validated; the route's POST schema currently accepts `keyword|payload|welcome|default` — note the `away` type is stored/handled by the bot and selectable in the UI even though this POST enum does not list it).
- **Subscribe:** `POST /api/messenger/subscribe` (`app/api/messenger/subscribe/route.ts`). Subscribes a registered **Messenger** Page to the app's webhook fields (`messages, messaging_postbacks, messaging_optins, message_deliveries`) via `subscribePage` (`lib/messenger/bot.ts`). WhatsApp subscribes in the App Dashboard instead.
- **Bot core** (`lib/messenger/bot.ts`):
  - `verifySignature(rawBody, header, appSecret)` — HMAC-SHA256 over the **raw** body, constant-time compare.
  - `withinHours(business_hours)` — tz-offset-aware; days Mon=0…Sun=6; defaults 08:00–18:00 Mon–Fri.
  - `decide(rules, {text, payload}, {inHours, isNewThread})` — routing order: **payload** (exact, case-insensitive; `GET_STARTED` → welcome) → **keyword** (substring of any csv keyword) → **first-message greeting** (welcome in hours / away out of hours; away falls back to welcome) → **default**; returns `null` if nothing matches.
  - `sendMessage` (Messenger + IG Send API, `messaging_type RESPONSE`, ≤2000 chars), `sendWhatsApp` (Cloud API text, ≤4096 chars), `subscribePage`.
- **Webhook (public, multi-channel):** `GET/POST /api/messenger/webhook` (`app/api/messenger/webhook/route.ts`, `runtime nodejs`, `maxDuration 60`).
  - **GET** = Meta verification handshake (`hub.verify_token` === `MESSENGER_VERIFY_TOKEN`; echoes `hub.challenge`).
  - **POST** verifies the `x-hub-signature-256` HMAC against `META_APP_SECRET` (403 on mismatch). Routes by `body.object`: `page`/`instagram` → `messaging[]` events → `sendMessage`; `whatsapp_business_account` → `changes[].value.messages[]` → `sendWhatsApp`. Per-page channel config is cached per request; the Page token is decrypted server-side via the admin client.
  - **First-message greeting cooldown:** `messenger_threads` is consulted (`GREET_COOLDOWN_MS = 6h`); a sender is "new" only if no greeting within the window, then `last_greeted_at` is upserted. When a keyword/payload rule matches, the message is **not** treated as a new-thread greeting.
  - Always returns HTTP 200 (`{received:true}`) so Meta does not retry-storm; send failures are best-effort.

---

## 6. PLANNED — LLM-grounded Messenger auto-replies

> **Status: not yet implemented.** This section specifies the upgrade. It is the in-product evolution of the uploaded "Sam bot" pattern: when no keyword/payload rule matches and the page has it enabled, generate a reply from **per-page VERIFIED FACTS + voice** using the Claude API with a strict no-hallucination system prompt, then fall back to greeting/away/default.

### 6.1 Goal & guardrails

Today `decide()` returns `null` when nothing matches and there is no `default` rule, and even the `default` is static. The upgrade adds a single AI fallback **between keyword matching and the static greeting/default fallbacks**, constrained so it can only answer from facts the operator entered. It is gated to `messenger_automation` (Expert) — the same gate as the rest of the bot — and is **opt-in per page**.

No-hallucination contract:
- The model may use **only** the page's VERIFIED FACTS. If the answer is not in the facts, it must not invent one — it should say it will have someone follow up (or defer to the away/default reply).
- No prices, hours, claims, or commitments unless present in the facts.
- Inherit the org's voice and the read-only/organic posture (this never touches ads).

### 6.2 Proposed schema (`0010_messenger_ai.sql`)

```sql
alter table messenger_pages add column if not exists ai_enabled boolean not null default false;
alter table messenger_pages add column if not exists ai_facts   text;   -- operator-entered VERIFIED FACTS (the only allowed source)
alter table messenger_pages add column if not exists ai_voice   text;   -- short tone/voice guide (e.g. "warm, concise, AU English")
```

`/api/messenger/pages` POST gains optional `aiEnabled`, `aiFacts`, `aiVoice` (Zod, with length caps, e.g. `aiFacts ≤ 4000`, `aiVoice ≤ 600`); GET returns them; `MessengerBot.tsx` gains a per-page "AI auto-reply" toggle + facts/voice textareas. These are write-scope page config, unchanged RLS (`messenger_pages` generic org rw).

### 6.3 Model & client

Use a **current fast model — `claude-haiku-4-5`** (200K context; $1/$5 per MTok) for low-latency, cost-controlled replies. Reuse the existing server-side client `callClaude` (`lib/ai/claude.ts`) with an explicit `model: "claude-haiku-4-5"` and a tight `maxTokens` (e.g. 300). No new dependency — it is the same raw Messages API path the rest of the app uses. If `ANTHROPIC_API_KEY` is unset, the AI branch is skipped and the bot falls through to the existing static fallbacks (never an error to the end user).

Strict no-hallucination system prompt (sketch):

```
You are the auto-reply assistant for "<page display_name>" on <channel>.
Answer ONLY using the VERIFIED FACTS below. If the answer is not in the facts,
do not guess, invent prices/hours/claims, or make commitments — say a team member
will follow up shortly. Keep it to 1–3 short sentences in this voice: <ai_voice>.
You never discuss or change advertising. VERIFIED FACTS:
<ai_facts>
```

### 6.4 `decide()` / webhook change

`decide()` (or a new async sibling) gains an AI step **after keyword matching, before the new-thread greeting**:

1. payload rule / `GET_STARTED` → welcome (unchanged)
2. keyword rule (unchanged)
3. **NEW:** if `ai_enabled` and `ai_facts` present and `ANTHROPIC_API_KEY` set and there is inbound `text`: call `callClaude({ model: "claude-haiku-4-5", system: <no-hallucination prompt>, user: text, maxTokens: 300 })`; if it returns non-empty text, send that.
4. first-message greeting (welcome in hours / away out of hours) (unchanged)
5. default (unchanged), else `null`.

Because the network call is async, the AI branch must move into the webhook's `replyTo` flow (which is already `async`) rather than the pure synchronous `decide()`; keep the pure `decide()` for the deterministic rules and add an `aiReply()` helper the webhook calls when the deterministic path returns nothing. The greeting-cooldown logic is unchanged (a successful keyword/payload/AI answer is "matched" and does not consume a greeting). All failures fall through to the existing static path; the webhook still returns 200.

### 6.5 Follow-ups specific to this feature

- Rate-limit / cost guard per page (e.g. cap AI replies per sender per minute).
- Optionally log AI replies to `audit_logs` (action `messenger_ai_reply`) for review.
- Per-channel media constraints still apply (text-only Send/Cloud API replies in the current bot).

---

## 7. Cron schedule (`vercel.json`) + required env vars

### Cron schedule (`vercel.json`)

| Path | Schedule | Purpose |
|---|---|---|
| `/api/cron/auto-sync` | `0 * * * *` (hourly) | Cadence-driven pull + score |
| `/api/cron/publish` | `*/15 * * * *` (every 15 min) | Publish due scheduled content |
| `/api/cron/auto-analysis` | `0 21 * * *` (daily 21:00 UTC) | Score + alert every org |
| `/api/cron/weekly-digest` | `0 23 * * 5` (Fri 23:00 UTC) | Weekly email digest |
| `/api/cron/refresh-knowledge` | `0 8 * * 1` (Mon 08:00 UTC) | Web-research knowledge refresh |

All cron routes are `GET`, **fail closed** (503 if `CRON_SECRET` unset), and accept only `Authorization: Bearer <CRON_SECRET>`. URL-carried secrets are rejected.

### Required / used environment variables

**Supabase**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Crypto**
- `TOKEN_ENCRYPTION_KEY` — base64, **exactly 32 bytes** (AES-256-GCM). Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.

**Stripe (billing)**
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- Price IDs (also map to plan): `NEXT_PUBLIC_STRIPE_PRICE_STARTER`, `NEXT_PUBLIC_STRIPE_PRICE_PRO`, **`NEXT_PUBLIC_STRIPE_PRICE_EXPERT`**

**OAuth (read-only ad connect)**
- `META_APP_ID`, `META_APP_SECRET`
- `TIKTOK_APP_ID`, `TIKTOK_APP_SECRET`
- `OAUTH_REDIRECT_BASE` (defaults to request origin)

**Content publishing (write-scope, organic only)**
- `META_PAGE_ACCESS_TOKEN`, `META_PAGE_ID` (Facebook), `IG_USER_ID` (Instagram), `TIKTOK_PUBLISH_TOKEN` (TikTok)

**Messenger automation (write-scope)**
- `META_PAGE_ACCESS_TOKEN` (also used for no-prompt entry setup; per-page tokens are stored encrypted in `messenger_pages`)
- `META_APP_SECRET` (webhook HMAC), `MESSENGER_VERIFY_TOKEN` (webhook verification handshake)
- Page/WABA scopes required at app level: `pages_messaging`, `pages_manage_metadata`, `instagram_manage_messages`, `whatsapp_business_messaging`

**AI**
- `ANTHROPIC_API_KEY` (AI team, Creative Studio draft, weekly knowledge refresh, and PLANNED Messenger AI replies)
- `ANTHROPIC_MODEL` (optional override; default `claude-sonnet-4-6` for `callClaude`, `claude-opus-4-8` for web-search research)

**Cron**
- `CRON_SECRET` — required for all cron routes (fail closed).

**Email**
- `RESEND_API_KEY` (and sender config) — used by `lib/email/resend.ts` for alerts/digests (best-effort).

**App URL**
- `NEXT_PUBLIC_APP_URL` (Stripe redirect base, webhook URL display in `MessengerBot`).

---

## 8. Security model

- **Token encryption at rest** (`lib/crypto.ts`): AES-256-GCM. `encrypt()` returns `{ciphertext, iv(12B), authTag}` (base64); `decrypt()` verifies the auth tag. Key from `TOKEN_ENCRYPTION_KEY` (must be 32 bytes or it throws). Ad tokens (`platform_tokens`) and Messenger Page tokens (`messenger_pages`) are stored encrypted; **never selected to the browser** (read only via the admin client server-side). Stored `scopes` are read-only for ads.
- **Webhook security:** `GET` verifies `MESSENGER_VERIFY_TOKEN`; `POST` verifies the `x-hub-signature-256` HMAC over the raw body against `META_APP_SECRET` (constant-time compare). Invalid signature → 403. The route always returns 200 on processing errors to avoid Meta retry storms.
- **Stripe webhook** (`app/api/stripe/webhook/route.ts`): verifies the signature with `STRIPE_WEBHOOK_SECRET`; upserts `billing_subscriptions` keyed on `stripe_subscription_id` (idempotent via the unique index). Checkout (`app/api/stripe/checkout/route.ts`) only allows configured price IDs (no arbitrary price injection) and maps price → plan.
- **Cron fail-closed:** every cron route returns 503 if `CRON_SECRET` is unset and 401 unless the `Authorization: Bearer` secret matches. URL query-string credentials are rejected.
- **Org scoping / RLS:** RLS isolates every org's data (`is_org_member`); the service role is used only server-side and mutations are explicitly `.eq("organisation_id", orgId)`-scoped. `audit_logs` is append-only; `knowledge_docs` and `messenger_threads` are service-role-only.
- **OAuth state:** `oauth_state` is an httpOnly, secure, sameSite cookie (10-min max-age) validated in the callback.

### Known follow-ups (security/correctness)

1. **Per-channel media / domain notes.** Send/Cloud API replies are text-only and length-capped (Messenger 2000, WhatsApp 4096); WhatsApp free-form text only inside the 24h customer-service window; Instagram organic publish requires a `media_url`; TikTok publishes `SELF_ONLY` until the app is approved for content posting. Document allowed media domains per provider where relevant.
2. **Messenger rules POST enum vs `away`.** `POST /api/messenger/rules` does not list `'away'` in its Zod enum although the DB constraint (0009), the bot's `decide()`, and the UI (`MessengerBot.tsx`) all support it — align the POST schema to include `'away'`.

---

## 9. App-review / go-live prerequisites

- **Meta app review (per-app, not per-page)** for advanced access to the messaging scopes used by the webhook bot: **`pages_messaging`** (Messenger), **`instagram_manage_messages`** (Instagram DM), **`whatsapp_business_messaging`** (WhatsApp). Until approved, replies to the general public are restricted. (Surfaced in `MessengerBot.tsx` setup checklist.)
- **Webhook wiring** in the Meta app: Callback URL `<NEXT_PUBLIC_APP_URL>/api/messenger/webhook`, verify token = `MESSENGER_VERIFY_TOKEN`, app secret = `META_APP_SECRET`, subscribe fields `messages, messaging_postbacks` (Messenger via the in-app Subscribe button; WhatsApp in the App Dashboard).
- **Vercel Pro plan for sub-daily crons.** The schedule includes hourly and 15-minute crons; the Hobby plan only runs crons once per day, so sub-daily cadence (auto-sync, publish) **requires Vercel Pro** (see `docs/GO-LIVE.md`).
- **Content publishing** requires write-scope tokens (`META_PAGE_ACCESS_TOKEN`/`META_PAGE_ID`, `IG_USER_ID`, `TIKTOK_PUBLISH_TOKEN`); TikTok content posting needs app approval to post non-`SELF_ONLY`.
- **Trial unlock without Stripe:** insert a `billing_subscriptions` row (`plan='expert', status='active'`) for the org (per `docs/GO-LIVE.md`); with Stripe configured the Billing page does this on checkout.

---

## 10. Phased roadmap (shipped vs next)

### Shipped (in the repo today)
- Auth + multi-tenant orgs with RLS; org bootstrap + multi-client switching.
- CSV import + 13-factor health engine (TS port, parity-tested) + saved reports.
- Read-only Meta/TikTok connect: OAuth **and** dev-token paste; idempotent 30-day puller.
- Cadence auto-sync cron + daily scoring + weekly digest + critical-alert emails.
- Proposals queue with human-in-the-loop status (approve/dismiss/done), never edits ads.
- AI specialist team (12 personas) grounded in saved analysis + dated knowledge baseline; weekly web-search knowledge refresh into `knowledge_docs`.
- Content Studio: upload/approve/schedule/publish organic FB/IG/TikTok content; AI drafting by Stella includes a Paige policy preflight before human review; scheduled-publish cron.
- Messenger automation (Expert): no-prompt entry setup; multi-channel webhook bot (Messenger/Instagram DM/WhatsApp) with keyword/payload/welcome/away/default rules, business-hours awareness, and a 6h greeting cooldown.
- Stripe billing (Starter/Pro/Expert) with idempotent webhooks; entitlement gating throughout.
- Security headers (`next.config.mjs`), AES-256-GCM token encryption, webhook HMAC, fail-closed crons.

### Next
- **PLANNED §6:** LLM-grounded Messenger auto-replies (per-page `ai_enabled`/`ai_facts`/`ai_voice`, `claude-haiku-4-5`, strict no-hallucination prompt).
- Security follow-ups (§8): align the rules POST enum with `away`; document per-channel media/domain constraints.
- Broaden sync beyond campaign-level (adset/ad granularity already in the `campaign_snapshots` schema but not populated by the API pullers).
- Meta app review completion for the messaging scopes to take the webhook bot fully public.
```
