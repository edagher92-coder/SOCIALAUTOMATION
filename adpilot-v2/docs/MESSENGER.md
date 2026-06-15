# Messenger Automation — Operator Runbook

_Last updated: 2026-06-15._

How to run the multi-channel chat bot in AdPilot OS: **Messenger, Instagram DMs, and WhatsApp**, all from one webhook. This is the **Expert-tier** feature (`messenger_automation` in `lib/entitlements.ts`). It covers minting tokens, registering channels, writing rules, the webhook subscription, app review, and the honest limits.

There are two distinct capabilities, both on `/messenger` in the app:
1. **Entry experience** — greeting, ice breakers, Get Started button, and persistent menu, set through the Graph API with **no browser and no "Allow" prompts** (`lib/messenger/profile.ts`).
2. **Auto-reply webhook bot** — a public webhook that answers inbound messages on all three channels with rules (`app/api/messenger/webhook/route.ts`, brain in `lib/messenger/bot.ts`).

> Safety: this layer is **separate from the read-only ad analysis**. It only writes the Messenger profile you configure and sends replies you defined. The app never edits, pauses, or creates ads.

---

## 1. Token scopes you need

| Channel | Scopes |
|---|---|
| Messenger entry setup + replies | `pages_messaging`, `pages_manage_metadata` |
| Instagram DM replies | `instagram_manage_messages` (IG Business/Creator linked to the Page; replies use the Page token + Send API) |
| WhatsApp replies | `whatsapp_business_messaging` |

The webhook receives Messenger and Instagram events under one Page subscription (they share the `messaging[]` shape and the Page-token Send API). WhatsApp arrives as a separate `whatsapp_business_account` event and replies via the WhatsApp Cloud API with its own token + phone-number ID.

---

## 2. Minting tokens

### Messenger / Instagram (Page token)
1. **Graph API Explorer** (developers.facebook.com → Tools → Graph API Explorer): select your app, request `pages_messaging` + `pages_manage_metadata` (+ `instagram_manage_messages` for IG), and generate a **User token**.
2. Exchange for a **non-expiring Page token** so the bot doesn't break in ~60 days:
   - User token → long-lived user token (app-secret exchange):
     `GET /oauth/access_token?grant_type=fb_exchange_token&client_id=<APP_ID>&client_secret=<APP_SECRET>&fb_exchange_token=<SHORT_USER_TOKEN>`
   - Long-lived user token → Page token:
     `GET /me/accounts` (returns a per-Page `access_token` that does not expire while the user token is valid).
3. Paste the Page token when you **Connect a channel** in-app, or set `META_PAGE_ACCESS_TOKEN` for the default Page.

### WhatsApp (Cloud API)
Use a **system-user token** from Business Settings with `whatsapp_business_messaging`, plus the **phone-number ID** from the WhatsApp → API Setup screen. Paste both when connecting the WhatsApp channel.

> Tokens are stored **encrypted per org** (AES-256-GCM, `TOKEN_ENCRYPTION_KEY`) in `messenger_pages`; they are never returned to the browser.

---

## 3. Registering channels in-app

On `/messenger` → **Auto-replies** → **Connect a channel**:
- **Messenger / Instagram:** paste the Page token. The app calls `GET /me` to verify it and stores the Page id + display name.
- **WhatsApp:** paste the WhatsApp token + phone-number ID.
- Set **business hours** here too (open hour, close hour, UTC offset, active days). These drive the welcome-vs-away routing below.

Registered channels are listed underneath; remove a channel to delete it and all its rules.

---

## 4. Business hours

Per channel you set `open_hour`, `close_hour`, `tz_offset` (in hours), and `days` (Mon=0 … Sun=6; default Mon–Fri). At message time the bot computes "in hours" and uses it to pick the first-message greeting:
- **In hours** → the `welcome` rule.
- **Out of hours** → the `away` rule (falls back to `welcome` if no `away` rule exists).

If no business hours are set, the channel is treated as always "in hours".

---

## 5. Rule types and routing order

Add rules per channel. Each rule has a **type**, an optional **trigger**, a **reply**, and a **priority** (lower number wins within a type).

| Type | Fires when | Trigger field |
|---|---|---|
| `keyword` | the inbound text **contains** any of the comma-separated keywords (case-insensitive) | `winter, snow, plow` |
| `payload` | an ice-breaker / button payload matches (case-insensitive) | `BOOK_NOW` |
| `welcome` | first message in a thread, **in** business hours | — |
| `away` | first message in a thread, **outside** business hours | — |
| `default` | nothing else matched | — |

**Routing order** (`decide()` in `lib/messenger/bot.ts`):
`payload` → (Get Started → `welcome`) → `keyword` → first-message greeting (`welcome` in hours / `away` out of hours) → `default`. If nothing matches, the bot stays silent.

First-message greetings have a **6-hour cooldown** per sender so repeat messages aren't re-greeted.

> Known gap (be honest with clients): the **rules API** currently accepts `keyword`, `payload`, `welcome`, and `default`. The `away` type is offered in the UI and honored by the routing brain, but the create endpoint's validation does not yet list it — adding an `away` rule may be rejected until the schema is updated. Use `welcome` as the first-message greeting in the meantime.

---

## 6. Webhook subscription

The public callback is **`<app>/api/messenger/webhook`** (same URL for Messenger, Instagram, and WhatsApp). It is unauthenticated by design and protected by:
- the **verify token** (`MESSENGER_VERIFY_TOKEN`) on the GET handshake, and
- the **`X-Hub-Signature-256`** HMAC over the raw body, checked against `META_APP_SECRET`.

Steps in the **Meta App Dashboard**:
1. Set the callback URL = `<app>/api/messenger/webhook` and the verify token = your `MESSENGER_VERIFY_TOKEN`.
2. Subscribe fields `messages`, `messaging_postbacks` (Messenger/IG).
3. Subscribe the **Page** to the app's webhook fields — use the **Subscribe webhook** button next to the channel in-app (Messenger/IG). WhatsApp subscribes in the App Dashboard, not via that button.

`NEXT_PUBLIC_APP_URL` must be set so the app can show you the exact callback URL.

---

## 7. App Review — per app, not per page

To reply to the **public** (not just admins/testers), the Meta app needs **advanced access** via App Review for:
`pages_messaging` · `instagram_manage_messages` · `whatsapp_business_messaging`.

**This review is per-app.** Once your one app is approved, it covers **every client Page** you connect — you do not re-submit per page. Before approval, the bot only replies to people with a role on the app (admins/developers/testers), which is fine for testing.

---

## 8. Honest limits

- **Public replies need app review.** Until the app is approved for advanced access, replies only reach app roles (admins/testers) — not real customers.
- **WhatsApp 24-hour window.** Free-form text replies only work within 24 hours of the customer's last message. Outside that window you must send a **pre-approved message template** — the current bot sends free-form text only, so out-of-window WhatsApp sends will be rejected by Meta.
- **Entry setup ≠ auto-replies.** Ice breakers + persistent menu (the no-prompt entry experience) do not require a webhook or app review; true keyword auto-replies do.
- **Token expiry.** If you paste a short-lived Page token instead of a non-expiring one, the bot stops working when it expires. Always exchange for a non-expiring Page token (§2).
- **Best-effort sends.** The webhook always returns 200 (so Meta doesn't retry-storm); a failed send is logged but not surfaced as an error to the sender.

---

## Quick checklist for a new client page
1. Mint a non-expiring Page token with the right scopes (§2).
2. **Connect a channel** in-app, set business hours (§3–4).
3. Add `welcome`, a few `keyword`, and a `default` rule (§5).
4. Add the callback URL + verify token in the App Dashboard and **Subscribe webhook** (§6).
5. Confirm the app is approved for advanced access (one-time, per app — §7).
