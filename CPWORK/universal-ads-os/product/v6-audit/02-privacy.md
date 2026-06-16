# V6 Audit — Privacy & Data Protection (APP + Notifiable Data Breaches)

> Officer: recruited Privacy & Data-Protection lead — Australian Privacy Act 1988 (Cth) / APP +
> NDB scheme + data-breach-prevention specialist.
> Scope: `adpilot-v2/` (live app). **Read-only analysis. No code edited, no git, no installs.**
> Owner priority: **data-breach prevention is #1.** Cross-references the new model-training
> consent intent in `CPWORK/universal-ads-os/product/v6-tiers/04-data-consent.md`.
> Last updated: 2026-06-16.

---

## 0. Executive summary

The data foundation is **mostly sound**: OAuth/page tokens are AES-256-GCM encrypted
(`lib/crypto.ts`), lead PII is one-way salted-SHA-256 hashed *at ingest* before storage
(`lib/pii.ts`), webhooks use fail-closed HMAC with constant-time compare, RLS (`is_org_member`)
covers every org-scoped table, and the FK cascade chain is complete (every org table — including
the new `lead_events`, `alert_events`, `account_daily_metrics`, `org_budget`, `trend_data` —
cascades `on delete cascade` from `organisations`).

**The single biggest gap is right-to-erasure (APP 11.2):** `/api/data-deletion` only *records*
a request and returns a confirmation code — **no shippable code path actually deletes anything.**
The cascade chain is correct but nothing in the repo triggers it (the only real deletes are in
`scripts/seed-demo.ts`). A deletion request is therefore acknowledged but never actioned. That is
both an APP 11 / Meta-data-deletion-callback compliance gap **and** a standing pool of retained
PII that enlarges any future breach.

Secondary breach-surface risks: (a) `PII_PEPPER` defaults to `""` — if shipped unset in prod, lead
hashes degrade to plain SHA-256 (rainbow-table reversible) and the "we never store reversible PII"
promise breaks; (b) several API routes echo upstream `e.message` to the client, leaking account
IDs / platform internals; (c) the model-training plan's engineering guardrails (§6 of the consent
doc) are *documented but not yet enforced in code* — no per-org training opt-out flag, no
deletion-propagation into training sets.

---

## 1. PII inventory + data flows (protection map)

| Data class | Table / location | Protection at rest | Verdict |
|---|---|---|---|
| Account email / name | `profiles` (`0001`), `auth.users` | Plaintext (Supabase-managed); RLS `id = auth.uid()` | OK — minimal, isolated |
| OAuth / System-User tokens | `platform_tokens` (`0001`) | **AES-256-GCM** (ciphertext/iv/auth_tag), RLS `is_org_member` | Strong |
| Messenger page tokens | `messenger_pages` (`0008`) | **AES-256-GCM**, RLS `is_org_member` | Strong |
| Lead contact details | `lead_events.email_hash` / `phone_hash` (`0018`) | **One-way salted SHA-256** (`lib/pii.ts`); never plaintext; RLS read-only | Strong *if* pepper set (see P0-2) |
| Lead attribution (campaign, sale value, quality) | `lead_events` (`0018`) | Plaintext non-PII business data; RLS | OK |
| Ad performance metrics | `campaign_snapshots`, `health_scores`, `recommendations`, `reports.payload`, `account_daily_metrics` (`0021`) | Plaintext business data; RLS `is_org_member` | OK; small advertisers re-identifiable (treat as personal info for training — §4) |
| Alert events | `alert_events` (`0019`) | Plaintext (campaign + metric); RLS | OK |
| Notification recipient | `notification_rules.email`, `white_label_profiles.support_email` | **Plaintext email**; RLS | Acceptable (delivery address); deletion must cover it |
| Content captions | `content_posts.caption` | Plaintext user content; RLS | OK; deletion must cover it |
| Legal acceptance audit | `legal_acceptances` (`0016`) | Plaintext (user_id, version, hash); RLS `user_id = auth.uid()` | OK |
| Deletion-request subject | `/api/data-deletion` | Hashed subject; never returned/logged | OK (but not persisted/actioned — P0-1) |

Direct identifiers held: account email/name (plaintext), notification/support emails (plaintext),
encrypted platform tokens, hashed lead email/phone. **No plaintext lead PII anywhere** — confirmed.

---

## 2. Tenant isolation (RLS)

`is_org_member(org)` is `security definer stable`, checks `memberships` for `auth.uid()`. Every
org-scoped table has `enable row level security` + an `is_org_member(organisation_id)` policy,
including all the new ones audited:

- `0016 legal_acceptances` — RLS, `user_id = auth.uid()` (own-row). OK.
- `0017 schema_parity` — alters `campaign_snapshots` only; inherits existing RLS. OK.
- `0018 lead_events` — RLS + `is_org_member` select. OK.
- `0019 alert_events` — RLS + `is_org_member` select. OK.
- `0020 org_budget` — column add on `organisations`; existing RLS applies. OK.
- `0021 account_daily_metrics` — RLS + `is_org_member` select. OK.

**Two tables have RLS enabled but NO policy** (deny-all to anon/auth, service-role only by design):
`knowledge_docs` (`0007`, workspace-global reference) and `messenger_threads` (`0009`, cooldown
state). Acceptable *only because* they are accessed exclusively via the service-role client; this
intent should be asserted by a test, not just a comment (P2-1).

**Service-role (admin) client** (`lib/supabase/admin.ts`) bypasses RLS and is used in ~36 places.
Sweep found every write/read is scoped by `organisation_id` (or `auth.users` id) — **no
cross-tenant path found.** This is the highest-leverage breach surface, so it must be guarded
against regression (P1-3). No `service_role` key is exposed to the browser.

---

## 3. Data-deletion completeness (APP 11.2 / right-to-erasure)

**FK cascade chain — COMPLETE.** `auth.users` delete cascades `profiles`, `memberships`,
`legal_acceptances`. `organisations` delete cascades `connected_ad_accounts`, `platform_tokens`,
`campaign_snapshots`, `health_scores`, `recommendations`, `reports`, `audit_logs`,
`notification_rules`, `messenger_*`, `content_posts`, `ad_actions`, **and the new
`lead_events`, `alert_events`, `account_daily_metrics`, `trend_data`** (`org_budget` is a column on
`organisations`). So a single `auth.admin.deleteUser` (last member) or org delete *would* erase
everything.

**But nothing triggers it.** `/api/data-deletion` POST records a request and returns a code; the
comment says "a separate authenticated back-office process actions the deletion" — **that process
does not exist in the repo.** Grep shows the only `deleteUser` / org-delete calls live in
`scripts/seed-demo.ts` (dev fixtures), not in any production route or cron. **Result: deletion
requests are acknowledged but never executed → APP 11 non-compliance + Meta data-deletion-callback
non-compliance + indefinite PII retention.** This is the #1 privacy P0.

---

## 4. Model-training guardrails (vs `04-data-consent.md` §6)

The consent doc commits to 8 engineering guardrails (de-identified/aggregated by default, no
plaintext/hashed lead PII in general training, tenant isolation, deletion propagation, opt-out
honoured, sub-processor no-train, no private data in tree, read-only untouched). **Today none are
enforced in code** because no training/eval data-builder exists yet — they are promises, not
controls. Before any training pipeline ships:

- **De-identification gate:** training/eval sets must be built only from `analyse()` outputs /
  aggregates, never raw org-tagged rows. Needs a single sanctioned data-builder module that strips
  `organisation_id`, account ids, `reports.payload` free-text, and excludes `email_hash`/`phone_hash`.
- **Lead PII out of scope:** `lead_events.email_hash`/`phone_hash` must be hard-excluded as features
  (a hashed email is still "personal information" under the Privacy Act). No re-identification attempts.
- **Cross-tenant:** the data-builder must never join across orgs; aggregates must be k-anonymous
  (a single small advertiser is re-identifiable — see PII table). Needs a min-cohort threshold.
- **Consent state:** no per-org training opt-out/opt-in flag exists yet. Needs a column on
  `organisations` + a `'data_training'` value added to the `legal_acceptances.document` CHECK
  (currently `('terms','privacy')` only) so opt-in/withdrawal is auditable (per consent doc §5.3).
- **Deletion propagation:** the deletion job (P0-1) must also evict the subject from future
  training/eval sets and any cached grounding.
- **Sub-processor:** confirm the Anthropic API tier used does not train on submitted data.

All of the above are **NEEDS-REVIEW** (product/ML/solicitor) — they are design controls for a
pipeline not yet built; the audit's job here is to ensure they exist *before* training begins.

---

## 5. Breach-response posture (NDB scheme readiness)

- **Logging:** mostly clean. `app/api/oauth/[platform]/callback/route.ts:78` logs `e?.message`
  (could capture upstream token-exchange detail in server logs). Stripe webhook logs session id +
  `metadata.plan`. Server-side only; low severity but tighten.
- **Error messages to client:** `score`, `sync/[platform]`, `connect/token`, `messenger/pages`,
  `actions/[id]` echo raw `e.message` — leaks ad-account ids / platform validation internals
  (recon aid, not direct PII). Sanitise: log detail server-side, return generic to client.
- **No private business data in tree:** `snowflow|edagher` grep guard + env-gated context-pack
  still in force (CLAUDE.md rule). Good.
- **NDB readiness gaps:** no documented breach-response runbook, no PII-access audit trail for
  service-role reads, no `PII_PEPPER` rotation procedure. The NDB scheme requires assessment +
  OAIC/individual notification within 30 days of a suspected eligible breach — there is no
  template/owner/clock defined. Documentation-level, but required for a "breach-prevention #1" posture.

---

## 6. PRIORITISED PUNCH-LIST

> Tags: **SAFE-AUTOMATIC** = mechanical, low-risk, no product/legal judgement.
> **NEEDS-REVIEW** = product/ML/solicitor decision or destructive/irreversible.

### P0 — breach / PII-exposure / legal non-compliance

| # | Issue | File | Fix | Tag |
|---|---|---|---|---|
| **P0-1** | Right-to-erasure not executed — `/api/data-deletion` only records a request; no code actions it. APP 11.2 + Meta callback non-compliance; indefinite PII retention. | `app/api/data-deletion/route.ts` (+ new back-office job) | Build the authenticated deletion-actioning job: verify request → resolve subject to user/org → `auth.admin.deleteUser` (last member) and/or org delete to fire the cascade → record completion. Add a test proving all PII tables (incl. `lead_events`, `account_daily_metrics`, `alert_events`) are empty for the subject afterwards. | **NEEDS-REVIEW** (destructive, irreversible) |
| **P0-2** | `PII_PEPPER` defaults to `""`; if shipped unset, lead hashes are plain SHA-256 → rainbow-table reversible → the "never store reversible PII" promise fails. | `lib/pii.ts:14` | Fail-closed in production: throw on startup / refuse to hash if `PII_PEPPER` unset when `NODE_ENV==='production'` (keep `""` default only for dev/test). Add a deploy-time env check. | **NEEDS-REVIEW** (ops/env; could block deploy) |

### P1 — high-risk hardening

| # | Issue | File | Fix | Tag |
|---|---|---|---|---|
| **P1-1** | API routes echo raw `e.message` to client → leaks account ids / platform internals. | `app/api/score/route.ts:41`, `sync/[platform]/route.ts:27`, `connect/token/route.ts:66`, `messenger/pages/route.ts:88`, `actions/[id]/route.ts:53,77` | Log full error server-side; return a generic message + status to client. | **SAFE-AUTOMATIC** |
| **P1-2** | OAuth callback + Stripe webhook log raw error / session metadata. | `app/api/oauth/[platform]/callback/route.ts:78`, `app/api/stripe/webhook/route.ts:39` | Drop `e?.message` / metadata from logs; log a stable code/event id only. | **SAFE-AUTOMATIC** |
| **P1-3** | Service-role client bypasses RLS in ~36 sites; correct today but unguarded against regression — the top cross-tenant breach surface. | `lib/supabase/admin.ts` + callers | Add a regression test asserting every admin query is `organisation_id`/user-scoped (or a lint rule); document the admin-client contract. | **NEEDS-REVIEW** (test design) |
| **P1-4** | Model-training guardrails (consent doc §6) are promised but unenforced; no opt-out flag, no de-id gate, no deletion-propagation. | new training data-builder; `organisations`; `legal_acceptances` CHECK | Before any training ships: single sanctioned de-identifying data-builder (strips org id, excludes `*_hash`, k-anon aggregates), per-org training consent flag, add `'data_training'` to `legal_acceptances.document` CHECK, wire deletion (P0-1) to evict from training sets. | **NEEDS-REVIEW** (ML/product/solicitor) |

### P2 — defence-in-depth / documentation

| # | Issue | File | Fix | Tag |
|---|---|---|---|---|
| **P2-1** | `knowledge_docs`, `messenger_threads` have RLS-on / no-policy (service-role-only) by intent, asserted only in comments. | `0007_knowledge.sql`, `0009_messenger_multichannel.sql` | Add a test asserting anon/auth role gets zero rows; document the deny-all-by-design intent. | **SAFE-AUTOMATIC** |
| **P2-2** | No NDB breach-response runbook, no PII-access/service-role audit trail, no pepper-rotation procedure. | docs + ops | Write a breach-response runbook (assessment + OAIC/individual notification ≤30 days, owner, contact), add service-role read audit logging, document `PII_PEPPER` rotation. | **NEEDS-REVIEW** (owner/solicitor) |
| **P2-3** | Meta `signed_request` HMAC not verified at `/api/data-deletion` (deferred to back-office that doesn't exist). | `app/api/data-deletion/route.ts:25` | Verify the HMAC with the app secret at receipt (or implement the back-office verifier as part of P0-1) so malformed/forged requests aren't recorded. | **SAFE-AUTOMATIC** (once app secret available) |
| **P2-4** | Migration sequence skips `0012`–`0015`; confirm no dropped/untracked PII-bearing migration. | `supabase/migrations/` | Confirm gap is intentional (renumbering) and not a missing migration carrying RLS/PII. | **SAFE-AUTOMATIC** (verification only) |

---

## 7. Top recommendation for the owner

For a "data-breach-prevention is #1" posture the order is: **(P0-1)** make deletion actually
delete — both for APP 11 and to shrink the standing PII pool; **(P0-2)** fail-closed the PII pepper
so hashed leads stay irreversible in production; then the cheap, safe-automatic log/error
hardening (P1-1, P1-2). Tenant isolation and token encryption are already strong — keep them
strong with the P1-3 regression guard. Do **not** start the model-training pipeline until P1-4's
de-identification + consent + deletion-propagation controls exist.
