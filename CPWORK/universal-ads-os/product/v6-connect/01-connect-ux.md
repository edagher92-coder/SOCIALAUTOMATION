# V6 Connect UX — best-in-class connect + auto-sync flow (01-connect-ux)

> Owner: Connection-experience lead (product design + onboarding UX). Status: design spec,
> read-only study of `adpilot-v2`. No code edited. Reuses the existing `/connect` page,
> `TokenConnect`/`SyncButton` components, OAuth start/callback routes, `/settings` cadence,
> and the `mode` provider + `ModeAware` primitive.
> Date: 2026-06-16.

---

## 0. TL;DR for the owner

Connecting an ad account should feel like a single, calm, obviously-safe action: **pick
your platform → one click (read-only) → watch it connect, sync, and produce a first score
in front of you.** Today the building blocks are all there and individually good — the
3-step strip, labelled OAuth cards, the `?connected=`/`?error=` redirect states, the
"never expire" System-User token guide, immediate first-sync on the server — but they sit
as **flat sections on one page** rather than a **guided wizard with live states**. The user
sees every method at once (OAuth + advanced token paste + System-User docs) and has to
self-assemble the flow. The fix is to wrap the existing pieces in a small 3-step stepper,
give the connect action **live status** (connecting → connected → first score, or
needs-reconnect/error with the right next step), make "read-only / we never touch your ads"
a **persistent visible badge** not a one-line footnote, and turn auto-sync into **one good
default (Daily) that's already on**, changeable in one tap. Simple mode hides the token
paste and System-User docs entirely; Advanced reveals them.

---

## 1. What exists today (verified in code)

| Piece | File | State |
|---|---|---|
| Connect page | `app/(app)/connect/page.tsx` | Server page. 3-step strip + read-only line + OAuth cards (Meta/TikTok) + `TokenConnect` + `<details>` System-User guide + connected-accounts list + reconnect banner. All sections stacked, always visible. |
| OAuth start | `app/api/oauth/[platform]/start/route.ts` | Sets signed `oauth_state` cookie, redirects to platform with read-only scope. Returns `?error=<platform>_not_configured` when creds missing. |
| OAuth callback | `app/api/oauth/[platform]/callback/route.ts` | Exchanges code, discovers ad accounts, **syncs immediately** (`syncOrgPlatform`), redirects `/connect?connected=<platform>` or `?error=<platform>_failed`/`_bad_state`/`_no_code`. |
| Token paste | `components/TokenConnect.tsx` | "Advanced — dev link". Platform select, account-id (with email-mistake guard), password token field, POSTs `/api/connect/token`, reports `connected · N accounts · pulled N rows`. |
| Token API | `app/api/connect/token/route.ts` | Validates token, discovers accounts, encrypts (AES-256-GCM), inserts, **immediate sync**. Rich errors incl. Meta code 190 ("token expired → use System User"). 402 `upgrade:true` when plan-gated. |
| Sync now | `components/SyncButton.tsx` | Manual `/api/sync/<platform>`; on auth-shaped failure surfaces the `#token-help` link. |
| Cadence | `app/(app)/settings/page.tsx` | Presets Off/Hourly/6h/12h/Daily/Weekly + Custom. Default `sync_interval_hours = 24` (Daily). Pro+ gated. |
| Mode | `components/mode.tsx` + `components/ModeAware.tsx` | `beginner`/`advanced`, localStorage. `<ModeAware only="advanced">` already shipped. |

**Diagnosis.** The page is *complete* but *undirected*. Three connection methods (OAuth,
token paste, System-User) all render at full weight simultaneously, so a first-timer can't
tell which is "the" path. The connect action is a plain link → full-page redirect → a tiny
`✅ Connected meta.` toast; there is no in-flow "connecting…", no "we pulled N rows, here's
your first score" payoff, and no live needs-reconnect/error distinction beyond a banner.
Auto-sync is correct (Daily default, runs unattended) but it lives on a *different page*
(`/settings`) and is only ever referenced as a footnote, so users don't know it's on.

---

## 2. The ideal connect flow — a guided 4-step wizard

A single `/connect` page, but reframed as a **stepper** (reuse the existing 3-step strip as
the stepper header — make each step *active/done* aware). One primary path; advanced is a
quiet fallback inside step 1. Persistent **read-only safety badge** pinned top-right of the
wizard the whole way through.

### Step 1 — Pick platform (one screen, one decision)
Two big choice cards: **Meta (Facebook/Instagram)** and **TikTok Ads** (reuse existing
cards). Each shows the read-only scope as a reassurance, not jargon: *"Read-only — we can
see your numbers, we can't touch your ads."* Primary button per card: **Connect Meta**
(read-only) → `/api/oauth/meta/start`. Below the two cards, in **Advanced mode only**, a
quiet disclosure: *"Connect with an access token instead"* → expands `TokenConnect`
(today's "dev link" path) + the System-User `<details>` guide. In Simple mode these are
hidden entirely (OAuth is the only path shown).

### Step 2 — Connecting (live state, no dead air)
After the OAuth redirect returns, the page reads `?connected=` / `?error=` and the wizard
shows an **explicit status card** instead of today's one-line toast:
- **Connecting…** (optimistic, while the callback runs the immediate sync) — spinner +
  *"Securely connecting and pulling your last 30 days — this takes a few seconds. Read-only."*
- **Connected ✓** — green card: *"Connected Meta · 2 ad accounts · pulled 1,240 rows."*
  (The callback/token API already return account + row counts — surface them, don't discard.)
- **Needs reconnect** / **Error** — band-red card with the *specific* next step: token
  expired → the System-User "never expire" guide opens inline; `_not_configured` →
  *"Ask your admin to finish OAuth setup, or paste a token instead";* `_bad_state` →
  *"Session timed out — try connect again."*

### Step 3 — First score (the payoff)
On `connected`, auto-advance to a **First score** card: the freshly-computed 0–100 health
score + band word + one plain sentence, with **"See your full breakdown →"** (to
Command Center / Ads Health). This is the moment that proves the product works; today the
user has to navigate away to discover anything happened. (Score already exists post-sync;
just fetch and show it.)

### Step 4 — Auto-sync is already on (confirm, don't configure)
A reassurance strip, not a settings form: *"✓ Auto-sync is on — Daily. We'll pull fresh
numbers and re-score every day. No prompts, never edits an ad."* with one quiet
**"Change frequency"** link → `/settings` cadence. One good default (Daily), one-tap change.
In Simple mode this is *the only* automation surface; in Advanced, `/settings` exposes the
full cadence + custom-hours control (already built).

**Net flow (what the user feels):** *pick → one click → "connecting, read-only" → "connected,
here's 1,240 rows and your score" → "auto-sync is on daily."* Four states, each with a clear
visual, each reinforcing safety.

---

## 3. Making "safe" obvious throughout

Safety is currently a 1-line footnote (`page.tsx` line 33) and per-component microcopy. Promote it:
- **Persistent read-only badge** in the wizard header, all steps: `🔒 Read-only · we never
  edit, pause, create, or spend`. A small reusable `<ReadOnlyBadge>` component.
- Every connect button labelled **"Connect … (read-only)"** — the safety is *in the verb*.
- The scope line stays but is phrased in plain English (*"we can see, we can't touch"*),
  not raw scope strings, in Simple mode; raw scopes show in Advanced.
- Token encryption line (`AES-256-GCM · never sent to your browser`) stays where a token is
  pasted (Advanced), and is summarised as one calm line in the badge tooltip.

---

## 4. Automation setup — one default, easy change, no jargon

- **Default Daily, already on** the moment an account connects (it already is —
  `sync_interval_hours` defaults to 24). The wizard's Step 4 just *says so*.
- **Plain-English cadence labels** in Simple mode: "Every day (recommended)", "A few times
  a day", "Once a week", "Off — I'll sync manually" — mapped to the existing 24/6/168/0
  presets. The literal "Every N hours / custom" control stays in Advanced (`/settings`).
- Remove the word "cadence" from any Simple-mode surface; use "how often we check."
- A tiny `<AutoSyncStatus>` chip (reusable) showing "Auto-sync: Daily ✓" on Connect,
  Command Center, and the connected-account rows so the user always knows it's running.

---

## 5. Simple vs Advanced treatment (reuse `ModeAware`)

| Surface | Simple (`beginner`) | Advanced |
|---|---|---|
| Connect methods | OAuth cards only | OAuth + token-paste disclosure + System-User guide |
| Scope copy | "we can see, can't touch" | raw `ads_read, read_insights` |
| Cadence | 4 plain labels | full preset + custom hours |
| Status detail | score + row count | + per-account ids, sync errors, last-synced |
| System-User docs | hidden (shown only if a reconnect is needed) | always available in disclosure |

Wrap the advanced-only blocks in `<ModeAware only="advanced">` (already shipped). The
needs-reconnect banner + System-User guide should appear **in Simple mode too, but only when
an account is actually `disconnected`/`error`** — i.e. surfaced exactly when it's relevant,
which is the right-moment guidance the owner asked for.

---

## 6. Top builds (prioritised)

**Build 1 — Connect wizard wrapper with live states.** `[Effort: M]` `[SAFE-AUTOMATIC]`
Turn `connect/page.tsx` into a stepper. New client `components/ConnectWizard.tsx` owns step
state, reads `?connected=`/`?error=` and renders the **Connecting / Connected ✓ /
Needs-reconnect / Error** status card (reusing the counts the callback + token API already
return). Reuse OAuth cards + `TokenConnect` inside it. Purely presentational; no API/route
change, no write path — read-only invariant untouched.

**Build 2 — "First score" payoff card.** `[Effort: S]` `[SAFE-AUTOMATIC]`
On `connected`, fetch the just-written `health_scores` row and show score + band + one
sentence + "See full breakdown →". Closes the loop so the user sees the product work without
navigating away. Read-only fetch only.

**Build 3 — Persistent `<ReadOnlyBadge>` + `<AutoSyncStatus>` chips.** `[Effort: S]`
`[SAFE-AUTOMATIC]` Two tiny reusable components. Badge pins in the wizard header; AutoSync
chip ("Daily ✓") shows on Connect, Command Center, and account rows. Makes safety + "it's
already running" visible everywhere. Presentation only.

**Build 4 — Plain-English cadence in Simple mode.** `[Effort: S]` `[NEEDS-REVIEW]`
A Simple-mode cadence control on the wizard's Step 4 mapping plain labels → existing
24/6/168/0 presets, posting to the existing `/api/org-settings`. Tagged NEEDS-REVIEW only
because it lets the user change *how often we read* (a write to org settings, never to an
ad) — confirm the label→hours mapping and that "Off" is clearly reversible. Advanced keeps
the full `/settings` control unchanged.

**Build 5 — Mode-aware connect (hide token paste + scopes in Simple).** `[Effort: S]`
`[SAFE-AUTOMATIC]` Wrap the token-paste + System-User disclosure + raw-scope copy in
`<ModeAware only="advanced">`; show the System-User guide in Simple only when a reconnect is
actually needed. Reuses the shipped primitive; presentation only.

---

## 7. Guardrails preserved
All five builds are presentation-layer over read-only routes. No new write path; OAuth scopes
stay read-only (`ads_read, read_insights` / `ads.read`); tokens stay encrypted and never
returned to the browser; auto-sync stays Pro+ gated; capability gating remains server-side via
`can(plan, feature)` (mode controls visibility/density only). Resale-clean — no private data
introduced.
