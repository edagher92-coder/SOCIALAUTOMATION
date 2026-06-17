# 01 — Cybersecurity Audit (AdPilot OS v6 audit)

> Read-only application-security review of `adpilot-v2/` (Next.js 14 + Supabase + Stripe).
> Scope: dependency vulns + inbound attack surface + data-breach risk. **No code was edited.**
> Auditor: recruited security lead. Date: 2026-06-16. Concern: data-breach prevention.

---

## TL;DR

- **Dependency vulns (full tree):** 10 — **1 critical / 6 high / 3 moderate / 0 low.**
  - Production-runtime exposure (`--omit=dev`): **2** — `next` (high) + `postcss` (moderate).
  - The 1 **critical** and the bulk of the highs are **dev-only** (`vitest`/`vite`/`esbuild`,
    `eslint-config-next`/`glob`) — not shipped to prod, but still CI/dev-machine risk.
  - **Every** fix is flagged `isSemVerMajor: true`. Plain `npm audit fix` (non-force) fixes
    **nothing here**; all require major bumps (`npm audit fix --force` / manual majors).
  - Note: GitHub Dependabot reported ~15; the local lockfile resolves to 10. The delta is
    likely already-patched transitives or alerts on the other tree. Reconcile against the
    Dependabot tab — counts below are what `npm audit` proves locally.
- **Biggest data-breach risk:** the multi-tenant **write path runs on a single global shared
  secret** (`CRM_WEBHOOK_SECRET`, `INGEST_API_KEY`) feeding an **RLS-bypassing service-role
  client** with a caller-supplied `organisation_id`. One leaked secret = cross-tenant write to
  *any* org. Auth is strong; **tenant isolation is the weak link.**
- **Good news (verified, do NOT "fix"):** AES-256-GCM token crypto is correct (fresh random IV,
  auth tag, 32-byte key enforced, no fallback key); Stripe + CRM + Messenger webhooks all verify
  HMAC signatures in constant time and fail closed; OAuth callback validates platform allowlist,
  binds `state` to the session user, and uses only relative redirects (no open redirect).

---

## 1. Dependency vulnerabilities (`npm audit`)

| Package | Sev | Vulnerable range | Prod? (`--omit=dev`) | Fix | Breaking? |
|---|---|---|---|---|---|
| **vitest** | **critical** | `<=3.2.5` | dev-only | `vitest@4.1.9` | **YES (major)** |
| **next** | high | `9.3.4-canary.0 – 16.3.0-canary.5` | **YES (runtime)** | `next@16.2.9` | **YES (major, 14→16)** |
| esbuild | high | `<=0.28.0` | dev-only | via `vitest@4` | YES |
| vite | high | `<=6.4.2` | dev-only | via `vitest@4` | YES |
| @next/eslint-plugin-next | high | `14.0.5-canary – 15.0.0-rc.1` | dev-only | `eslint-config-next@16.2.9` | YES |
| eslint-config-next | high | `14.0.5-canary – 15.0.0-rc.1` | dev-only | `eslint-config-next@16.2.9` | YES |
| glob | high | `10.2.0 – 10.4.5` | dev-only (CLI) | `eslint-config-next@16.2.9` | YES |
| **postcss** | moderate | `<8.5.10` | **YES (via next)** | `next@16.2.9` | YES |
| @vitest/mocker | moderate | `<=3.0.0-beta.4` | dev-only | via `vitest@4` | YES |
| vite-node | moderate | `<=2.2.0-beta.2` | dev-only | via `vitest@4` | YES |

**What this means.** Two dependency "clusters" cover all 10:
- **`next` cluster** (`next` high + `postcss` moderate) — the only one with **production runtime
  exposure**. The `next@14` advisories are mostly DoS / cache-poisoning / SSRF-via-WebSocket /
  CSP-nonce-XSS / middleware-bypass. Fix = bump to a patched line. `npm` proposes `next@16` (two
  majors). A **safer, smaller** move: bump to the latest patched **`next@14.2.x`** (e.g.
  `14.2.35`+ already pinned — confirm the installed patch covers the listed GHSAs; if not, the
  minimal in-major bump usually clears most without a 14→16 rewrite). **NEEDS-REVIEW** either way.
- **`vitest`/`eslint` clusters** — **dev/CI-only**. The "critical" lives here. Real but lower
  blast radius (a malicious package/site hitting a *dev* server). Bumping `vitest@2 → 4` and
  `eslint-config-next@14 → 16` are majors that may break test config/lint rules. **NEEDS-REVIEW.**

No non-breaking auto-fix exists for any of these — do not expect `npm audit fix` (sans `--force`)
to change the count.

---

## 2. Attack-surface review (verified by reading source)

### Strengths confirmed (leave alone)
- **`lib/crypto.ts`** — AES-256-GCM, `randomBytes(12)` fresh IV per `encrypt()`, auth tag stored
  and checked, key must decode to exactly 32 bytes or it throws; **no fallback/default key.** Solid.
- **`app/api/stripe/webhook/route.ts`** — `constructEvent()` verifies the Stripe signature; plan
  is allowlist-validated (fails loud on unknown), upsert idempotent, fails closed (503) if unset.
- **`app/api/webhooks/crm/route.ts:18-24,52-54`** — HMAC-SHA256 over the raw body, constant-time
  `timingSafeEqual`, **fails closed** if `CRM_WEBHOOK_SECRET` unset or signature bad. PII stored
  only as hashes.
- **`app/api/messenger/webhook/route.ts` + `lib/messenger/bot.ts:21-26`** — `X-Hub-Signature-256`
  HMAC verified constant-time.
- **`app/api/oauth/[platform]/callback/route.ts`** — platform allowlist (l.21), `state` checked +
  **state-encoded user id bound to the session** (l.27-32), redirects are relative to `/connect`
  (no open redirect), upstream error text not leaked to the URL (l.77-79).
- **`lib/cron-auth.ts`** — constant-time compare, fails closed when `CRON_SECRET` unset.
- **`middleware.ts`** — gates app pages; API routes self-authenticate (verified per-route). OK.

### Weaknesses (the actual findings)

1. **Shared-secret multi-tenant write (tenant-isolation) — HIGHEST BREACH RISK.**
   `app/api/webhooks/crm/route.ts:70-95` and `app/api/ingest/route.ts:48-50` accept a
   caller-supplied `organisation_id` and write through `createAdminClient()` (service-role,
   **RLS-bypassing**, `lib/supabase/admin.ts`). Both are gated only by a **single global secret**
   (`CRM_WEBHOOK_SECRET` HMAC / `INGEST_API_KEY`), not bound per-org. If either secret leaks (log,
   env dump, repo, shared with a CRM integrator), an attacker can write lead/sales/snapshot rows
   into **any** org's tables. Auth is strong; isolation is not. **Data-breach vector: YES (write
   side, cross-tenant pollution / poisoning the health score of arbitrary orgs).**

2. **No rate-limiting anywhere.** Grep confirms zero rate-limit implementation in `app/`/`lib/`
   (only tests/docs mention it). The unauthenticated-reachable POSTs (`/api/webhooks/crm`,
   `/api/messenger/webhook`, `/api/ingest`, `/api/stripe/webhook`) and login/AI routes have no
   per-IP / per-secret throttle → brute-forcing the global secrets, DoS, and AI-spend abuse on
   `/api/messenger/webhook` (AI replies) and `/api/ai/generate`. **Data-breach vector: indirect
   (enables offline brute-force of the shared secrets in #1).**

3. **PII pepper defaults to empty string.** `lib/pii.ts:14` `const PEPPER = process.env.PII_PEPPER
   || "";`. If unset in prod, stored `email_hash`/`phone_hash` are **plain SHA-256** → reversible
   via rainbow tables for any common email/phone. Not enforced at runtime (only a code comment).
   **Data-breach vector: YES (PII de-anonymisation if a hash table leaks).**

4. **CSP allows `'unsafe-inline'` scripts.** `next.config.mjs:4` `script-src 'self'
   'unsafe-inline'`. This defeats CSP as an XSS mitigation and compounds the `next` CSP-nonce-XSS
   advisory. (Headers otherwise good: `frame-ancestors 'none'`, `nosniff`, `X-Frame-Options DENY`,
   `Referrer-Policy no-referrer`.) **Data-breach vector: indirect (raises XSS impact → session
   theft).**

5. **CSV / data formula injection on export.** `app/api/ingest/route.ts` and the score/CSV path
   (`lib/engine/schema.ts` `parseCSV`/`normalise`) do not neutralise cells beginning with
   `= + - @ <tab> <CR>`. Free-text fields (e.g. `campaign_name`) flow through and, when a user
   later exports to CSV/Excel, can execute as a formula (data exfil / command). **Data-breach
   vector: YES (client-side, on report export).**

6. **`organisation_id` is the only thing scoping admin writes (implicit, not enforced).**
   Session-authenticated routes correctly derive org via `getActiveOrgId(user.id)`, but the
   pattern is convention, not a guard. Any future admin write that trusts a body `org_id` without
   `getActiveOrgId` re-check becomes an IDOR. Low today, fragile going forward.

7. **No payload size cap before `req.text()`/`req.json()`** on the webhooks/ingest (`crm:48`,
   `ingest:41`, `ingest` allows `rows` up to 20000) → memory-pressure DoS. Low.

8. **OAuth `state` compared with `!==`, not constant-time** (`callback:27`). State is a
   high-entropy session-bound nonce, so practical timing exfil is implausible — **low / cosmetic**;
   align with the codebase's own `timingSafeEqual` convention when convenient.

---

## 3. Prioritised remediation punch-list

### P0 — breach risk / critical-dep (do first)
| # | Where | Fix (one line) | Class | Security gain |
|---|---|---|---|---|
| P0-1 | `lib/pii.ts:14` | Fail closed: throw if `!PII_PEPPER && NODE_ENV==='production'` | **SAFE-AUTOMATIC** (add guard) | Stops plaintext-reversible PII hashes; closes PII de-anon |
| P0-2 | `webhooks/crm/route.ts:70`, `ingest/route.ts:48-50` | Bind secret→org (per-org webhook secret / API key, or DB-verify caller owns `orgId`) before any admin write | **NEEDS-REVIEW** (schema + rollout) | Closes cross-tenant write on a single leaked secret — the #1 breach vector |
| P0-3 | `package.json` `next` (+`postcss`) | Bump to the latest patched **`next@14.2.x`** covering the listed GHSAs (verify) before considering 14→16 | **NEEDS-REVIEW** (major if 16) | Removes the only 2 **prod-runtime** vulns (1 high + 1 moderate): DoS, cache-poisoning, WS-SSRF, CSP-XSS |

### P1 — high
| # | Where | Fix | Class | Gain |
|---|---|---|---|---|
| P1-1 | inbound POST routes | Add IP+secret rate-limit (Upstash/Vercel KV or in-DB counter) to crm/messenger/ingest/stripe/login/ai | **NEEDS-REVIEW** (new dep) | Blocks brute-force of shared secrets + AI-spend/DoS abuse |
| P1-2 | `next.config.mjs:4` | Drop `'unsafe-inline'` from `script-src`; adopt nonce/hash CSP | **NEEDS-REVIEW** (may break inline scripts) | Restores CSP as a real XSS barrier |
| P1-3 | `lib/engine/schema.ts` (`parseCSV`/`normalise`) | Prefix cells matching `/^[=+\-@\t\r]/` with `'` on ingest **and** export | **SAFE-AUTOMATIC** | Closes CSV/Excel formula injection on report export |
| P1-4 | dev tree | `vitest@2→4`, `eslint-config-next@14→16` (clears the critical + dev highs) | **NEEDS-REVIEW** (major) | Removes 1 critical + 4 high + 2 moderate (dev/CI only) |

### P2 — moderate / hardening
| # | Where | Fix | Class | Gain |
|---|---|---|---|---|
| P2-1 | admin-write routes | Add explicit `is member of orgId` check helper before every `admin.from().insert/update` | **SAFE-AUTOMATIC** | Future-proofs against IDOR regressions |
| P2-2 | `crm:48`, `ingest:41` | Reject `content-length` over a cap (e.g. 1 MB) before reading body | **SAFE-AUTOMATIC** | Removes memory-pressure DoS |
| P2-3 | `oauth/.../callback:27` | Use `crypto.timingSafeEqual` for `state` compare | **SAFE-AUTOMATIC** | Cosmetic consistency; negligible practical gain |

---

## 4. Single biggest breach risk (restated)

**Shared-secret, RLS-bypassing, caller-asserts-its-own-`organisation_id` write path**
(`CRM_WEBHOOK_SECRET` + `INGEST_API_KEY` → `createAdminClient()`). The signature/key checks are
correct, but because the secret is **global and not bound to a tenant**, a single leaked secret
lets an attacker write into **any** organisation. Fix = bind secret→org (P0-2).

---

*Generated read-only. No dependencies installed, no code changed, no `audit fix` run.*
