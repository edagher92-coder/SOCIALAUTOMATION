# GOTCHAS — hard-won lessons (do not repeat)

> Last updated: 2026-06-15, from the AdPilot OS v3 build. Read this before touching Meta/TikTok APIs,
> the messaging bot, billing/entitlements, crons, the Claude API, or running parallel build agents.
> Individual skills link here and list their own top traps under a `## Gotchas` section.

## Process & safety
- **Don't assume access you don't have.** "We already have the data/API/access" was not true — there was no deployed app, no Meta developer app, no stored tokens. Verify what's actually connected (e.g. enabled integrations) before promising a live result.
- **Never accept secrets in chat** (App Secret, API tokens, passwords). They go in env / a secret store. Decline and point to env.
- **The read-only-ad invariant is the trust moat.** Never silently add ad-write (pause/activate/budget). If a script or request implies editing live campaigns, STOP and surface it as a decision. If approved: gate behind the top tier + a typed-YES confirmation per action + an audit log + reversible framing, and soften "never edits ads" → "never without your explicit confirmation."
- **Private Google Docs can't be fetched** (auth-gated; web fetch fails on private/authenticated URLs). Ask the user to paste the content.
- **Commit & push before ending a turn** (a stop hook enforces it). Atomic file writes mean any file present on disk is complete — safe to commit mid-wave.

## Parallel sub-agents (orchestration)
- **Concurrency is limited (~3–4).** Launching 5–6 agents at once triggers "Server is temporarily limiting requests" and the extras fail at launch. Launch in small batches; re-fire failures on their completion notifications.
- **Partition file ownership disjointly.** Two editing agents on the same file corrupt the tree. Use read-only review agents (Explore — can't Edit) for audits.
- **Don't let agents run `npm run build`/`dev` concurrently** (shared `.next`, port 3000) or `npm install` (node_modules). Have each agent validate with `npm run typecheck` + targeted `npx vitest run`; the orchestrator runs the consolidated build + live smoke-check + commit centrally.
- **Re-verify after integrating.** Agents leave occasional type slips — e.g. `Array.from(new Set(...))` inferring `unknown[]` (annotate `: string[]`), or `vi.fn` tuple-spread typing (`const fn: any = vi.fn(...)`).

## Meta / Graph API
- **business.facebook.com is a PROTECTED site** in agent browsers — every action prompts and can't be allowlisted. Use the Graph API; `developers.facebook.com` (Graph Explorer, App Dashboard) is NOT protected.
- **`messenger_profile` greeting requires `platform: "messenger"`** in the payload or it 400s (New Page Experience).
- **Set `get_started` before `persistent_menu`/`ice_breakers`** on some pages.
- **Graph Explorer page tokens are short-lived (~1–2h).** Exchange a long-lived user token (via app secret) → a **non-expiring page token**; mint once per client.
- **Webhook:** verify-token handshake on GET; **HMAC-SHA256 over the RAW body** (`X-Hub-Signature-256`) on POST; **always return 200 fast** or Meta retry-storms.
- **Keyword auto-REPLIES are not in the public API.** They need a webhook bot + **App Review for `pages_messaging` Advanced Access** to message the public. App Review is **per-app, not per-page** — one approved app covers all client pages.
- **Instagram DM rides the same webhook** (object `instagram`, same `messaging[]` shape) and sends via `/me/messages` with the Page token.
- **WhatsApp is a separate Cloud API:** object `whatsapp_business_account`, events at `entry[].changes[].value.messages[]`, routed by `value.metadata.phone_number_id`, sent via `/{phone_id}/messages` with a WhatsApp token. **Free-form replies only inside the 24h window**; templates beyond it.
- **`/me/adaccounts` returns `account_id` WITHOUT the `act_` prefix**, but the insights endpoint needs `act_<id>`. Normalise both ways.

## TikTok API
- **TikTok signals errors via a non-zero `code` in a 200 body** — checking only HTTP status misses them. Fail on `!res.ok` AND on `typeof code === "number" && code !== 0`.
- **Content Posting defaults to `SELF_ONLY` (private)** until the app is audited/approved — it can't post publicly before that.

## Claude API / models (consult the `claude-api` skill — never guess)
- **Use current model IDs:** default `claude-opus-4-8`; fast/high-volume `claude-haiku-4-5`; deep web research `claude-opus-4-8`. Uploaded scripts used outdated ids (`claude-3-5-haiku-latest`) — don't copy them.
- **Opus 4.8 / Fable 5:** adaptive thinking only; `temperature`/`top_p`/`top_k` and `budget_tokens` are REMOVED (400); assistant prefill 400s.
- **web_search tool:** `{ type: "web_search_20260209", name: "web_search", max_uses }` — GA, **no beta header** (dynamic filtering built in), server-side. Handle `stop_reason: "pause_turn"` by re-sending the conversation.

## Next.js 14 / Supabase
- **`import "server-only"` modules throw under vitest.** Alias `server-only` to an empty shim in `vitest.config.ts` to unit-test them.
- **`tsc --noEmit` checks TEST files too** (vitest/esbuild does not). Keep test typing clean.
- **Production build needs dummy `NEXT_PUBLIC_SUPABASE_*`** env (CI passes them). Most pages are auth-gated → no real click-through without a live Supabase.
- **RLS:** enable + add a policy. The **service-role admin client BYPASSES RLS** — right for webhooks/crons (no user context), but scope writes by `organisation_id` explicitly. **Never select token ciphertext to the browser.** Encrypt tokens at rest (AES-256-GCM).

## Crons (Vercel)
- **Fail closed:** require `CRON_SECRET` (503 if unset, 401 if wrong). `Authorization: Bearer` is primary; a `?key=` query fallback gets logged — prefer the header.
- **Hobby plan:** crons run once/day max (~2 crons). Sub-daily/hourly + many crons need **Vercel Pro**.
- **Per-org isolation:** one bad org must not kill a sweep (try/catch per org; count failures).
- **Idempotent sync:** delete the rolling-window rows for `(org, platform, source)` then insert; dedupe account ids; on **partial failure don't advance `last_synced_at`** (stay "due").
- **Queue refresh: insert NEW rows before deleting OLD ones**, so a failed insert never empties the user's queue.

## Billing / entitlements
- **Entitlements are the single source of truth** (`lib/entitlements.ts`). Gate every premium route AND the cron path.
- **Fail closed on billing:** an unmapped `priceId` or missing price→plan config must 503, never default to a paid plan. `normalisePlan(unknown)` → `"free"`.
- **Handle `customer.subscription.deleted/updated`** to downgrade to free — not just `checkout.session.completed`. Idempotent upsert on `stripe_subscription_id`.

## Build/CI (added 2026-06-15)
- **Stale `.next/types` across branches:** `tsc --noEmit` reads cached route types from a previous build, so after switching branches it throws phantom `TS2307` "Cannot find module …/route.js" errors for routes that only exist on the *other* branch. Fix: `rm -rf .next` before typecheck (or trust `next build`, which regenerates types fresh). A fresh CI checkout is unaffected.

## Deploying to Vercel + Supabase (added 2026-06-15, from the first live deploy)
- **Set the Root Directory to the app subfolder.** The repo has no root `package.json` (the app lives in `adpilot-v2/`). If Vercel's Root Directory isn't set to `adpilot-v2`, the build can't find the app.
- **`No Output Directory named "public"` = wrong Framework Preset.** It means Vercel isn't treating it as Next.js. Fix: Settings → Framework Preset = **Next.js**, and leave Output Directory **override OFF** (Next uses `.next`, never `public`).
- **Pasting the whole env block into ONE variable's value.** Vercel's bulk paste only splits `KEY=value` lines when pasted into the *key* field; pasted into a *value* field it stores all lines as that one value. Symptom: build dies in `Collecting page data` for `/_not-found` with `ERR_INVALID_URL` and `input: '[REDACTED]\n' ×N` — because `metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL)` got the whole block. Fix: each variable holds only its own single line.
- **base64 keys get mangled on paste.** A `+` in a base64 secret can become a space via URL-decoding, and `-`/`_` (base64url) differ from `+`/`/` — both break `Buffer.from(k,"base64")` length checks (e.g. `TOKEN_ENCRYPTION_KEY must be 32 bytes`). Fixes: generate keys with **no `+` or `/`** (regenerate until clean) for paste-safety, AND make the parser tolerant (trim, map `-_`→`+/`, map space→`+`, accept 64-char hex). Env-var changes need a **redeploy** to take effect.
- **Supabase has two key systems now.** Legacy **JWT** keys (`anon`/`service_role`, start `eyJ`) vs new **`sb_publishable_`/`sb_secret_`** keys. `@supabase/supabase-js` < ~2.49 only supports the legacy `eyJ` keys — use those, or the client silently fails at runtime. Never put the `service_role` key in client code/transcripts; rotate it if it leaks (Settings → API → roll JWT secret).
- **Supabase Site URL defaults to `http://localhost:3000`,** so signup confirmation links point at localhost and 404 in production (and expire). For testing, **disable "Confirm email"** (Auth → Providers → Email) and confirm users manually (Auth → Users); for production set **Site URL + Redirect URLs** to the deployed domain.
- **A "run-once" concatenated migration file must be fully idempotent.** The first migration often uses bare `create table` / `create type` / `create policy`, which fail on re-run (`42P07 relation already exists`). When bundling all migrations into one paste-and-run script, transform to `create table if not exists`, guard the enum with a `do $$ … pg_type` block, name + `if not exists` every index, and prefix each `create policy` with `drop policy if exists`.
- **Grant a plan for testing without Stripe** by inserting an *active* `billing_subscriptions` row — the `plan` text must match an exact `Plan` value (`free|starter|pro|expert`); `planForOrg` reads the latest row and ignores anything not `status='active'`.
- **Vercel Hobby vs Pro:** Hobby caps crons (~2, daily-only) and is non-commercial per ToS. Sub-daily crons (hourly sync, 15-min publish) and any paid product need **Pro**; after upgrading, redeploy so all crons register, then check Settings → Cron Jobs.
- **Dev-link connect Account ID is the ad-account id, not the login email.** Meta ad-account ids are numeric (`act_<digits>`); validate and reject an email pasted there, or it creates a bogus account.
