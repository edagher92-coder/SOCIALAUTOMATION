# Per-Client Onboarding Playbook

_Last updated: 2026-06-15._

Bring a new client live in a few steps. AdPilot OS is **multi-tenant**: each client is an organisation with its own data, isolated by Postgres RLS. Every step below maps to a page in the product — no scripts, no SQL for day-to-day onboarding.

> What's per-org vs shared:
> - **Per org:** the subscription tier, ad connections, sync cadence, content posts, and Messenger channels/rules. All tokens (ad, publishing, Messenger) are **encrypted per org at rest** and never sent to the browser.
> - **Shared (one-time, per app):** the Meta app and its **App Review**. One approved app covers Messenger/IG/WhatsApp replies for **all** client pages — you never re-submit per client.

---

## The path (5 steps)

### Step 1 — Set the tier (Billing)
Pick the plan that unlocks what this client needs (`lib/entitlements.ts`):
- **Starter** → analysis, saved reports, **Content Studio** (organic publishing).
- **Pro** → adds API/dev-link connect, automated sync, the AI specialist team, AI Creative Studio, multi-client.
- **Expert** → adds **Messenger automation**, white-label, expert plugins.

Set it on the **Billing** page (Stripe checkout flips the tier automatically). For a trial without Stripe, an operator can insert a `billing_subscriptions` row for the org (see `docs/GO-LIVE.md` §4).

### Step 2 — Connect & Sync (Settings → Connect)
On **Connect & Sync**, link the client's ad data:
- Fastest: **Advanced — connect with an access token** (read-only). Meta needs a token with `ads_read`; TikTok needs a long-lived token + `advertiser_id`.
- Or use **Connect Meta** (OAuth) if app-level OAuth env is configured.

It pulls immediately on connect. (Requires **Pro+** for `api_connect`.)

### Step 3 — Set the cadence (Settings → Auto-sync)
On **Settings → Auto-sync**, pick how often the client's data refreshes: Hourly / Daily / Weekly / custom. From then on it runs itself via the hourly cron (`auto_sync`, **Pro+**; hourly cadence needs Vercel Pro).

### Step 4 — Content Studio (organic publishing)
On **Content Studio** (`/content`), the client can upload reels/posts (or AI-draft on Pro+), **approve**, then **publish now** or **schedule**. Scheduled posts go out via the publish cron (every 15 min). This is organic content only — separate from the read-only ad layer.

Publishing targets are configured with **write-scope tokens** (`META_PAGE_ACCESS_TOKEN`/`META_PAGE_ID`, `IG_USER_ID`, `TIKTOK_PUBLISH_TOKEN`). Composing and scheduling always work; if a token is absent, a publish attempt simply reports "not configured." (Requires **Starter+** for `content_publish`; the AI drafter is **Pro+**.)

### Step 5 — Messenger channels + rules (Messenger)
On **Messenger** (`/messenger`, **Expert** only):
1. **Connect a channel** — paste the client's Page token (Messenger/IG) or WhatsApp token + phone-number ID. Set business hours.
2. Add **rules** — a `welcome`, a few `keyword` rules, and a `default`. (See `docs/MESSENGER.md` for rule types and routing.)
3. **Subscribe webhook** for the Page, and confirm the callback URL + verify token are set in the Meta App Dashboard.

Tokens are encrypted per org. **App Review is one-time per app** — once approved, this client (and every future client) can reply to the public without re-submitting.

---

## Multi-tenant notes for operators
- **Isolation:** RLS scopes every query to the active org, so one client never sees another's data, connections, posts, or chat rules.
- **One app, many pages:** the Meta app's verify token (`MESSENGER_VERIFY_TOKEN`) and signing secret (`META_APP_SECRET`) are app-level; each client just connects their own Page/number to it.
- **Honest prerequisites:** Pro/Expert features are gated by the tier (Step 1). Messenger public replies and TikTok public posting both require **Meta/TikTok approval** that you do once per app, not per client — see `docs/MESSENGER.md` and `docs/GO-LIVE.md` §7–8.

## Quick checklist
1. Tier set on Billing.
2. Ad account connected on Connect & Sync (read-only).
3. Auto-sync cadence chosen.
4. Content Studio: write tokens in place (if publishing); first post approved.
5. Messenger: channel connected, rules added, webhook subscribed (Expert).
