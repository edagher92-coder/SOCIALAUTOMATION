# 02 — Connection & Automation Back-End Design (v6-connect)

> Owner: Connection/Automation back-end lead — senior integrations + application-security engineer.
> Scope: `adpilot-v2/` OAuth + sync + cron + crypto + dev-token path. **Read-only analysis. No code
> edited, no git, no installs.** Brief: make the API integration + automation pipeline efficient,
> effective, resilient, and EXTREMELY SAFE. Breach-resistance is paramount.
> Cross-refs: `v6-research/03-automation.md`, `v6-audit/01-cybersecurity.md`, `02-privacy.md`.
> Tags: **SAFE-AUTOMATIC** = mechanical, low product/legal judgement · **NEEDS-REVIEW** = schema/ops/owner decision.
> Date: 2026-06-16.

---

## 0. TL;DR

The back end is already **structurally safe**: read-only OAuth scopes (`ads_read,read_insights` /
`ads.read`), AES-256-GCM token vault with no fallback key, session-bound OAuth `state`, fail-closed
constant-time `CRON_SECRET`, idempotent rolling-window pulls, and a cron fan-out with concurrency +
time-budget guard + per-org isolation + auth-only disconnect signalling. The read-only invariant
holds end-to-end — the sync layer literally has no write-to-platform code path.

The gaps are **resilience and efficiency**, not safety: (1) **no token refresh / rotation / expiry
tracking** — short-lived Meta tokens (~1–2h) silently die and the column `platform_tokens.expires_at`
is never written or read; (2) **no retry/backoff** — a single transient `429`/`5xx` from Meta or
TikTok throws and aborts the entire platform pull; (3) **full 30-day re-pull every cadence** with no
incremental window and no rate-limit awareness. The one genuine *security* hardening worth doing is
**signing the OAuth `state`** (HMAC) so it is tamper-evident, not just session-bound.

---

## 1. What exists today (verified in code)

| Surface | File | Posture |
|---|---|---|
| OAuth scopes/config | `lib/oauth/config.ts` | **Least-privilege read-only**, env-gated (`configured` flag), pinned API versions (Meta v21.0). |
| OAuth start | `app/api/oauth/[platform]/start/route.ts` | Auth-gated; sets `state` cookie `httpOnly+secure+sameSite=lax`, 600s TTL; relative redirects. |
| OAuth callback | `app/api/oauth/[platform]/callback/route.ts` | Platform allowlist; `state===cookie` + state-encoded user-id bound to session; upstream errors logged server-side, not leaked to URL; encrypts token before store; immediate pull (best-effort). |
| Token vault | `lib/crypto.ts` | AES-256-GCM, fresh 12-byte random IV/encrypt, auth tag stored+checked, key must decode to exactly 32 bytes or throw, **no fallback key**. Tolerant key parser. |
| Read-only pull | `lib/sync/pull.ts` | Ad-level Meta+TikTok → upsert `campaign_snapshots`. Idempotent (clear rolling 30d API window then insert; never touches CSV rows). De-dupes account ids. Decrypts token in-memory only. |
| Dev-token connect | `app/api/connect/token/route.ts` | Plan-gated (`api_connect`, pro+); validates token + discovers accounts before storing; numeric-id guard; Zod body. |
| Cadence auto-sync | `app/api/cron/auto-sync/route.ts` | Fail-closed `CRON_SECRET`; plan-gated; per-org cadence due-check with jitter slack; **concurrency=4 + 50s time-budget guard (no silent truncation)**; `Promise.allSettled` per-platform; advances `last_synced_at` only on ≥1 success; marks disconnected only on auth-shaped errors. |
| Score/alert | `lib/cron/score.ts` | Per-org isolation; scoring failure never rolls back the sync. |
| Cron auth | `lib/cron-auth.ts` | Constant-time `timingSafeEqual`, fails closed when secret unset. |

**Leave alone (confirmed correct):** crypto, cron-auth, scope minimality, callback open-redirect
safety, idempotent delete-then-insert, the partial-failure cadence-advance rule, auth-only disconnect.

---

## 2. Findings (resilience + efficiency + one safety)

### Connection resilience
- **No token refresh / rotation / expiry use.** Grep across `lib/` + `app/` finds zero
  `refresh_token` / `fb_exchange_token` / `grant_type` / `expires_at` reads or writes. Meta
  short-lived tokens last ~1–2h; the long-lived exchange (`grant_type=fb_exchange_token`, ~60d) and
  TikTok refresh are never performed, and `platform_tokens.expires_at` (present in schema since
  `0001`) is never set. Consequence: a connection silently expires and the *first failed cron pull*
  is the only signal — there is no proactive reconnect prompt and no use of the System User token
  path the owner is gated on. **Impact: resilience.**
- **No retry/backoff on transient pull failures.** `metaPull`/`tiktokPull` (`lib/sync/pull.ts:58,93`)
  do a single `fetch` and `throw` on any `!r.ok`. A transient `429`/`500`/`503`/network blip aborts
  the whole platform pull; the cron correctly isolates it (the *other* platform still syncs) but the
  failed platform is lost for the entire cadence interval. **Impact: resilience.**
- **Auth-fail → reconnect signalling is good but coarse.** The cron's auth-regex
  (`auto-sync/route.ts:73-77`) is well-built (requires real auth signals, won't disconnect on
  transient errors) but disconnect is **all-or-nothing per platform** and there is no `expires_at`-
  driven *pre-emptive* signal before the token actually fails. **Impact: resilience.**

### Efficiency
- **Full 30-day re-pull every cadence.** `SYNC_WINDOW_DAYS=30` is re-fetched and the whole API
  window re-deleted+re-inserted on every run, even hourly cadences where only today changed. No
  incremental "pull last N days, upsert by key" path. For multi-account orgs this is the dominant
  cost and the closest thing to redundant pulls. **Impact: efficiency.**
- **No rate-limit awareness.** No reading of Meta `X-Business-Use-Case-Usage` / `X-App-Usage` or
  TikTok throttle headers, no inter-account spacing; accounts are pulled in a sequential `for` loop
  inside `syncOrgPlatform` (`pull.ts:159`) with no backoff if the platform starts throttling.
  **Impact: efficiency + resilience.**
- **No async report-run for large pulls.** Meta Insights large pulls should use the async
  report-run + poll pattern (per `03-automation.md` §E2); today everything is a synchronous fetch
  that can blow the per-call window on big accounts. **Impact: efficiency.**

### Safety (the one real security hardening)
- **OAuth `state` is unsigned** (`start/route.ts:19`: `base64url(JSON{u,t})`) and compared with
  `!==` not constant-time (`callback:27`). It is cookie-bound (`httpOnly`) + user-id-checked, so
  practical exploitation is low, but the value is **not tamper-evident** — there is no integrity
  guarantee on the encoded user-id beyond the cookie equality check. Signing it (HMAC over `{u,t}`
  with the existing key material) makes it self-validating and lets the `t` timestamp enforce a hard
  TTL independent of the cookie. **Impact: safety.** (Matches `01-cybersecurity.md` finding #8, raised
  from cosmetic because a *signed* state is the principled fix, not just constant-time compare.)
- (Inherited, out of this module's scope but on the same admin-write surface: shared-secret
  cross-tenant write via `createAdminClient()` — `01-cybersecurity.md` P0-2. Sync writes are NOT
  affected because they derive `orgId` server-side, never from caller input. Flagged for awareness.)

---

## 3. TOP BACK-END BUILDS (prioritised)

### Build 1 — Token lifecycle: refresh, expiry tracking, pre-emptive reconnect
**Impact: resilience (+ effectiveness) · NEEDS-REVIEW** (platform App-Review + token-exchange testing).

- **Add `lib/oauth/refresh.ts`** — `ensureFreshToken(admin, orgId, platform)`:
  - Meta: on connect (`callback` + `connect/token`) immediately exchange short-lived → long-lived
    (`GET /v21.0/oauth/access_token?grant_type=fb_exchange_token&...`); store the returned
    `expires_in` as `platform_tokens.expires_at`.
  - TikTok: persist `refresh_token` (new encrypted column) and exchange when near expiry.
  - Called at the top of `syncOrgPlatform` (`lib/sync/pull.ts`): if `expires_at` is within a buffer
    (e.g. 7 days for Meta), refresh and re-encrypt before pulling.
- **Change `app/api/oauth/[platform]/callback/route.ts` + `app/api/connect/token/route.ts`** to
  write `expires_at` (and TikTok `refresh_token` ciphertext) on insert.
- **Change `app/api/cron/auto-sync/route.ts`**: before the due-check, surface tokens whose
  `expires_at` is imminent as a *pre-emptive* "reconnect soon" signal (new
  `connected_ad_accounts.status = 'expiring'`) instead of waiting for a hard auth failure.
- **New migration** `0009_token_lifecycle.sql` (NEEDS-REVIEW): add `platform_tokens.refresh_ciphertext/
  refresh_iv/refresh_auth_tag` (nullable), backfill nothing; `connected_ad_accounts.status` already free-text.
- Rotation: on every refresh, **insert a new row** (the code already `order by created_at desc limit 1`)
  and let old rows age out — never decrypt-in-place. Keeps the vault append-only and rotation-clean.

### Build 2 — Retry/backoff + rate-limit respect in the pull layer
**Impact: resilience + efficiency · SAFE-AUTOMATIC** (read-only, no schema, no new dep).

- **Add `lib/sync/fetch.ts`** — `fetchWithRetry(url, init, { retries: 3 })`: retry only on
  `429`/`500`/`502`/`503`/`504` and network errors; exponential backoff with jitter (e.g.
  0.5s→2s→8s, capped); honour `Retry-After` when present; **never retry `4xx` auth errors** (so the
  cron's disconnect signalling still fires fast). Cap total time well under cron `maxDuration`.
- **Change `lib/sync/pull.ts`**: route `metaPull`/`tiktokPull` `fetch` calls through it; read Meta
  `X-Business-Use-Case-Usage` / `X-App-Usage` and TikTok throttle hints and short-circuit to a soft
  defer (not a throw) when near the platform ceiling, so the cron records "deferred", not "failed".
- Add per-account spacing in the `syncOrgPlatform` loop when an org has many accounts.
- This is the highest-leverage *safe-automatic* win: it converts transient blips from "lost for a
  whole cadence" into "retried within seconds", with zero new attack surface.

### Build 3 — Incremental pull window (kill redundant re-pulls)
**Impact: efficiency · SAFE-AUTOMATIC** (logic-only; the table already supports upsert-by-key).

- **Change `lib/sync/pull.ts`**: keep the 30-day window for the *first* sync / reconnect, but for a
  recurring cadence pull only the changed tail — `max(last_synced_at − 2d, 30d ago)` to today
  (2-day overlap absorbs platform attribution lag). Switch the idempotent step from
  delete-30d-then-insert to **upsert on `(organisation_id, platform, ad_id, date)`** so re-pulled
  days correct themselves without nuking untouched history.
- **Needs a unique index** (new migration, SAFE-AUTOMATIC) on
  `campaign_snapshots(organisation_id, platform, ad_id, date)` where `source = '<platform>_api'`.
- Net effect: hourly cadences move ~1–3 days of rows instead of ~30×; large-account orgs stop
  re-deleting/re-inserting thousands of rows every run; the 50s cron budget covers far more orgs.

### Build 4 (the one safety hardening) — Sign the OAuth `state`
**Impact: safety · SAFE-AUTOMATIC** (small, self-contained, no schema).

- **Add `lib/oauth/state.ts`** — `signState({u,t})` = `base64url(payload).base64url(HMAC-SHA256(payload, secret))`
  using a dedicated `OAUTH_STATE_SECRET` (fail closed if unset, like `CRON_SECRET`); `verifyState()`
  recomputes the HMAC with `timingSafeEqual` and enforces a hard TTL on `t` (e.g. ≤600s).
- **Change `start/route.ts`** to emit the signed state and **`callback/route.ts`** to verify it
  (replacing the plaintext `JSON.parse` + `!==` compare at l.27–32). Keeps the cookie + user-id
  binding as a second factor — defence in depth.
- Makes the state tamper-evident and expiry-bounded independent of the cookie; closes
  `01-cybersecurity.md` finding #8 properly.

### Build 5 — Automation audit log for the connection pipeline
**Impact: resilience (trust/debugging) · SAFE-AUTOMATIC.**

- **New migration** `automation_runs` (RLS `is_org_member`, service-role write): one row per
  cron sweep + per-org outcome — `synced/skipped/failed/deferred`, rows, http_status, retry_count,
  token-refresh events. **Change `app/api/cron/auto-sync/route.ts`** + `lib/sync/pull.ts` to write it.
- Turns today's `console.error`-only truncation/failure signal into a queryable trail; pairs with
  `03-automation.md` §E3 and gives the reconnect UI a real "last successful sync" source.

---

## 4. Automation-safety invariants (must hold for every build above)

- **Read-only is sacred.** Nothing here adds a write-to-platform call. All scopes stay
  `ads_read,read_insights` / `ads.read`. The only live-write path remains the quadruple-gated
  `lib/actions/execute.ts` (Expert + `ADS_WRITE_ENABLED` + typed-YES + write-scope token) — untouched.
- **Fail-safe defaults.** Token refresh fails closed (no token → throw → cron isolates → disconnect
  signal). State signing fails closed if `OAUTH_STATE_SECRET` unset. Rate-limit hits → *defer*, never
  silently drop. Retry never retries auth errors (so reconnect signalling stays fast).
- **No over-permissioned tokens.** Refresh never widens scope; the long-lived exchange inherits the
  granted read scopes. System User tokens (owner-gated) are non-expiring read tokens — Build 1 just
  records `expires_at = null` and skips refresh for them.
- **Cadence respect.** Builds preserve the existing due-check + jitter slack + concurrency + 50s
  time budget; Build 3 makes each run cheaper so the budget covers more orgs without raising
  platform call volume.
- **Idempotency preserved.** Build 3 strengthens it (upsert-by-key vs delete-then-insert); CSV rows
  (`source='csv'`) remain untouched.

---

## 5. Suggested sequencing

1. **Build 2** (retry/backoff) + **Build 4** (sign state) — both SAFE-AUTOMATIC, no schema, ship first.
2. **Build 3** (incremental window) — SAFE-AUTOMATIC + one index migration; biggest efficiency win.
3. **Build 5** (audit log) — SAFE-AUTOMATIC; unblocks observability for the rest.
4. **Build 1** (token lifecycle) — NEEDS-REVIEW (platform App-Review, token-exchange testing, the
   owner-gated System User token); the resilience capstone.

---

*Generated read-only. No dependencies installed, no code changed, no migration run.*
