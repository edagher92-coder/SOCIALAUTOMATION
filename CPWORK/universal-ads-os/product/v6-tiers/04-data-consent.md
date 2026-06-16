# V6 Tiers — Data-Use & Model-Improvement Consent (Privacy / Terms clause)

> Owner: Compliance & Privacy lead (Paige + AU Privacy Act / APP + ACL specialist).
> Audience: AdPilot OS V6 build + the owner + the reviewing solicitor.
> Scope: a Terms/Privacy clause that PERMITS AdPilot to use connected client data to improve
> and train the system, drafted to the Australian Privacy Principles (APPs) under the Privacy
> Act 1988 (Cth) and consistent with the Australian Consumer Law (ACL).
> **Read-only on code. This document authors NO binding legal text.** Every clause below is a
> clearly-marked **PLACEHOLDER** for a qualified Australian solicitor to finalise.
> Last updated: 2026-06-16.

---

> ## ⚖️ SOLICITOR-ONLY — NOT LEGALLY BINDING
> Everything in §1–§3 is **draft placeholder prose written by a non-lawyer**. It carries the
> same status as the existing `DRAFT — NOT LEGALLY BINDING` banner on the scaffold pages. It
> must NOT be shipped as-is, relied upon, or presented to a user as binding. A qualified
> Australian privacy/IP solicitor must review, rewrite, and sign off **before launch** — in
> particular the consent mechanism (§4c), the secondary-use basis, and any cross-border
> training/sub-processor disclosure. Items flagged **[SOLICITOR]** are decisions only a lawyer
> should make.

---

## 0. Why this is privacy-sensitive (the honest framing)

Using client data to "improve and train the model" is a **secondary use** of personal
information under the APPs. The data in scope is not trivial:

| Data class | Where it lives | PII status | Source of truth |
|---|---|---|---|
| Account / billing | `auth.users`, Stripe | **Personal info** (email, name) | `0001_init.sql`, Stripe |
| Ad performance metrics | `reports.payload`, `recommendations` | Largely non-PII business data; *can* re-identify a small advertiser | `lib/engine/analyse()` |
| Connected-account data (Meta/TikTok) | synced via `lib/sync/pull.ts` | Account-level metrics; tied to a real business | platform OAuth/System-User token |
| CRM / lead data | `lead_events` (`0018`) | **email_hash / phone_hash only** — one-way salted SHA-256 (`lib/pii.ts`); never plaintext | `app/api/webhooks/crm/route.ts` |

Key facts that shape the clause (audited, not assumed):
- CRM lead PII is **already hashed at ingest** (`hashEmail`/`hashPhone`, salted with `PII_PEPPER`)
  — AdPilot never stores plaintext email/phone. Good. But a SHA-256 hash of an email is still
  **"personal information"** under the Privacy Act where re-identification is reasonably possible
  (and the OAIC treats hashed identifiers cautiously). Hashing reduces, but does not eliminate,
  APP obligations.
- The V6 AI roadmap (`v6-research/05-ai-evals.md`) shows how training/eval would *actually* use
  data: eval fixtures are built from **`analyse(rows, cfg)` outputs** — structured, account-derived
  metrics and per-ad `decide()` verdicts — and the doc explicitly says **"eval fixtures use
  synthetic data; no private business data enters the shippable tree."** So the *current* design
  already leans on de-identified/synthetic data. The clause below should **codify that as the
  contractual default**, not loosen it.
- The Privacy Policy already names **Anthropic** as an AI sub-processor and commits to a
  data-deletion path (`/api/data-deletion`, `0016` cascade on user delete). The training clause
  must be consistent with both.

**Bottom line:** the owner *can* get permission to train, but APP 6 (use/disclosure for a
secondary purpose) means the cleanest, lowest-risk posture is: **train on de-identified and/or
aggregated data by default, and require separate, express opt-in before any identifiable client
data is used for model training.** That is the recommendation in §4.

---

## 1. (a) PLACEHOLDER — Data-use & model-improvement clause (Terms of Service)

> **[PLACEHOLDER — solicitor to finalise. AU-APP-aware draft. Not binding.]**

**X. Improving and training our system**

1. **What we use.** To operate, maintain, secure, and improve AdPilot OS, we process the data you
   connect to or generate within the service. This includes: (a) account and billing details;
   (b) read-only advertising performance metrics drawn from your connected ad accounts (for
   example spend, results, cost-per-result, and the health scores and recommendations we compute
   from them); and (c) where you connect a CRM or lead source, lead and sale events — from which
   any contact details (email, phone) are converted to a one-way, non-reversible hashed form on
   receipt and are never stored by us in plain text.

2. **Improvement and training.** We may use this data to improve, evaluate, benchmark, and train
   the analytical models, scoring system, and AI specialists that power AdPilot OS, so the service
   becomes more accurate and more useful for all customers.

3. **De-identification and aggregation first.** Where we use your data for model improvement or
   training, we will **de-identify and/or aggregate it** so that it does not identify you, your
   business, or any individual, **wherever doing so still serves the purpose**. Our default and
   preferred basis for training is de-identified and aggregated data.

4. **No cross-tenant exposure.** We will **never expose one customer's identifiable data to
   another customer.** Outputs generated for your workspace are derived only from your own
   connected data and our general (de-identified/aggregated) knowledge. Tenant isolation is
   enforced technically (row-level security scoped to your organisation).

5. **Your contact (lead) PII.** Hashed contact identifiers from your CRM/lead events are used to
   match and de-duplicate leads and to compute lead-quality and attribution signals. **We do not
   use the underlying personal contact details of your leads to train a general model**, and we
   do not attempt to re-identify hashed values.

6. **Your choice.** *[SOLICITOR to confirm mechanism — see §4.]* You may **opt out** of having
   your identifiable data used for model training at any time via your workspace settings or by
   contacting us; **[OR, if express opt-in is adopted:]** we will only use your identifiable data
   for model training where you have given us **separate, express consent**, and you may withdraw
   that consent at any time. Opting out / withdrawing consent does not affect: (a) our use of
   de-identified or aggregated data; or (b) processing necessary to provide the service to you.

7. **Third-party AI providers.** Some processing uses third-party AI sub-processors (see our
   Privacy Policy). We contractually require that data we send for these purposes is not used by
   the provider to train their own foundation models, except as disclosed. *[SOLICITOR to verify
   against the current Anthropic/commercial-terms position and update the sub-processor list.]*

8. **Read-only, always.** Nothing in this clause changes the read-only nature of AdPilot OS. We
   never edit, pause, create, or spend on a live ad; this clause concerns analysis and model
   improvement only.

> **[SOLICITOR]** decisions embedded above: (i) opt-out vs express opt-in wording in cl. 6;
> (ii) the secondary-use legal basis recital; (iii) the exact representation in cl. 7 about
> third-party training — must match Anthropic's then-current commercial terms; (iv) whether any
> of this needs to be a *separate* consent screen vs a Terms clause (see §4c).

---

## 2. (b) PLACEHOLDER — Matching Privacy Policy collection-notice addition

> **[PLACEHOLDER — solicitor to finalise. APP 5 collection-notice style. Not binding.]**

Add to the Privacy Policy, **§1 Collection notice** and a new **§ "How we use your information /
model improvement"** sub-section (APP 5 requires we state the purposes of collection, including
secondary purposes, at or before collection):

> **Why we collect and how we use it.** We collect the data described in "Data categories" to
> provide AdPilot OS to you, to bill you, to keep the service secure, and to **improve, evaluate,
> and train the analytical and AI models that power the service.** Where we use your data to
> improve or train our models, we **de-identify and/or aggregate it wherever that still meets the
> purpose**, and we **never expose one customer's identifiable data to another customer**.
>
> **Lead and CRM data.** If you connect a CRM or lead source, any contact details (email, phone)
> are converted to a one-way, salted hash on receipt; we do not store them in plain text and do
> not attempt to re-identify them.
>
> **Your control.** *[opt-out wording OR express-opt-in wording per §4c]* You can manage whether
> your identifiable data is used for model training in your workspace settings, and you can
> request access, correction, or deletion of your personal information at any time
> (see "Deletion-request contact"). Deletion requests are honoured in our model-training pipeline
> as set out in §5 below.
>
> **AI sub-processors and overseas disclosure.** Some processing uses third-party AI providers,
> which may involve disclosure outside Australia. See "Sub-processors" and "Australian data
> residency" for the providers we use and the safeguards that apply (APP 8).

This slots beside the existing scaffold lines that already disclose **Anthropic** as a
sub-processor and the **data-deletion** path — keep those; this addition makes the *training*
purpose explicit, which the current scaffold does **not** yet do.

---

## 3. Plain-language signup / consent micro-copy (PLACEHOLDER)

> **[PLACEHOLDER — copy for the signup checkbox area / a settings toggle. Not binding.]**

- Bundled-acknowledgement line (under the existing Terms+Privacy checkbox):
  *"We use connected account and performance data to run and improve AdPilot OS. Identifiable
  data is de-identified or aggregated for model training, and is never shared between customers.
  See our Privacy Policy."*
- If **express opt-in** is adopted (recommended for identifiable training data — §4), add a
  **separate, unticked** checkbox or a settings toggle (NOT pre-ticked, NOT bundled into the
  Terms acceptance):
  *"Help improve AdPilot's models using my account's data. We de-identify or aggregate it first
  and never share it with other customers. You can turn this off any time. (Optional.)"*

---

## 4. (c) Opt-in vs bundled consent — RECOMMENDATION

**Recommendation: a two-tier consent split.**

1. **De-identified / aggregated training → bundled is acceptable.** Use of genuinely
   de-identified or aggregated data falls largely outside the "personal information" core of the
   Privacy Act, and improving the service is a purpose a customer would reasonably expect.
   Disclosing it clearly in the Terms + Privacy Policy (the bundled acceptance the signup flow
   already captures) is a defensible basis. **This should be the default and the primary
   training basis.**

2. **Identifiable client data for training → EXPRESS, UNBUNDLED OPT-IN.** Where any
   *identifiable* business/account data (or hashed-but-reasonably-re-identifiable lead data) is
   used to train models, the safest APP-aligned posture is **separate, express, opt-in consent**,
   not consent bundled into the Terms checkbox. OAIC guidance on consent requires it to be
   **voluntary, informed, specific, current, and given by someone with capacity** — bundled
   "agree to everything" consent is weak for a secondary, non-obvious purpose like model training.
   So: a distinct, unticked toggle (signup or settings), withdrawable at any time.

**Why not bundled-everything?** Bundling identifiable-data training into the same "I agree to the
Terms & Privacy Policy" tick risks the consent being found **not freely given / not specific** —
the classic APP consent failure mode. Splitting it (bundled for de-identified, express opt-in for
identifiable) is the lower-risk, OAIC-defensible design and is also good-faith with the product's
"your data stays private" promise already shown on the login page.

> **[SOLICITOR]** Final call on (1) vs (2) boundary, and whether opt-OUT (vs opt-IN) is acceptable
> for the de-identified tier in the relevant jurisdictions/markets. If AdPilot ever markets into
> the EU/UK, GDPR would push the whole thing toward opt-in + a lawful-basis analysis — flag for
> the solicitor if international launch is planned.

---

## 5. (d) Exactly where it goes in the scaffold + what to update

### 5.1 Pages / sections (file: relative to `adpilot-v2/`)

| Where | File | Action |
|---|---|---|
| **Terms — new section** | `app/(marketing)/terms/page.tsx` | Insert the §1 clause as a **new numbered section** (e.g. a new "7. Data, improvement & model training" before "Liability & governing law"). Keep the existing `DRAFT — NOT LEGALLY BINDING` banner. Placeholder prose only. |
| **Privacy — §1 + new sub-section** | `app/(marketing)/privacy/page.tsx` | Expand **§1 Collection notice** and add a new section "How we use your information — model improvement" (the §2 text). Reinforce existing §3 Sub-processors (Anthropic) and §4 overseas-disclosure. Keep banner. |
| **Privacy — §5 deletion** | `app/(marketing)/privacy/page.tsx` | Add one line that deletion requests are also honoured in the training pipeline (ties to §6 engineering guardrails). |
| **Limitations** | `app/(marketing)/limitations/page.tsx` | **No change needed** — this clause is collection/use, not a results disclaimer. |

### 5.2 Signup / checkout consent copy

- **Update the signup screen** `app/login/page.tsx`. The current checkbox covers Terms + Privacy
  only. Add either:
  - (minimum) the **bundled acknowledgement line** (§3 first bullet) under the existing checkbox, **and**
  - (recommended, if express opt-in is adopted) a **separate unticked optional toggle** (§3 second
    bullet). It must NOT block account creation and must NOT be pre-checked.
- **Checkout (Stripe):** no separate consent needed at checkout *if* the signup acceptance already
  covers data use; billing is a different basis. Do not bundle training consent into the payment
  step.
- A **settings page toggle** to opt out / withdraw at any time is required to make cl. 6 / the
  opt-in real (see §6).

### 5.3 Version-bump `legal_acceptances`? — **YES.**

Because the Terms and Privacy text materially change (a new substantive use of personal data), the
versioned acceptance record must bump so existing users are recorded as accepting the new version.

- In `app/login/page.tsx`, bump `LEGAL_VERSION` (`"v4-draft"` → e.g. `"v6-draft"`) and update
  `LEGAL_HASH` to a stable hash of the **new** rendered documents. The `0016` design *exists
  precisely for this*: `content_hash` "pins exactly which rendered document the user agreed to,
  so a later text change is always distinguishable."
- **No migration change required to the `legal_acceptances` table** — the schema is version-agnostic
  (`version text`, `content_hash text`). However:
  - **[SOLICITOR/PRODUCT]** If express opt-in for training is a *separately recordable* consent
    (recommended), the `document` CHECK constraint currently only allows `('terms','privacy')`.
    To record a discrete training-consent acceptance you would need a **new migration** adding e.g.
    `'data_training'` to the CHECK (or a dedicated `consents` table). Recommended: add
    `'data_training'` to the `document` check in a new migration (`00XX`) and POST a third
    acceptance row when the user opts in, so consent + withdrawal are auditable.
  - Re-acceptance flow: existing users should be re-prompted to accept the new version on next
    login (a banner / interstitial), per the audit-trail intent of `0016`. **[PRODUCT]**

---

## 6. (e) Engineering guardrails the build MUST honour

These are **binding engineering constraints** that make the clause truthful. The clause promises
them; the code must enforce them. (Consistent with `v6-research/05-ai-evals.md`, which already
states fixtures use synthetic data and no private data enters the shippable tree.)

1. **Train/eval on de-identified or aggregated data by default.** Build training/eval sets from
   `analyse()` outputs and aggregates, **not** from raw rows tied to a named org. Where identifiable
   data is genuinely required, it must be gated behind the recorded opt-in (§5.3) and stripped of
   direct identifiers first.
2. **Never use plaintext lead PII for general training.** Lead contact details are hashed at ingest
   (`lib/pii.ts`) and must stay hashed; do not reverse, do not attempt re-identification, do not
   feed hashed identifiers into a general model as features that could leak. Treat `email_hash` /
   `phone_hash` as out-of-scope for model training.
3. **Tenant isolation is non-negotiable.** Model context and outputs for org A must derive only
   from org A's own connected data plus de-identified/aggregated general knowledge. RLS
   (`is_org_member`, scoped on every table incl. `lead_events`, `legal_acceptances`) must not be
   bypassed in any training/inference path. No cross-tenant prompt bleed.
4. **Respect deletion in the training pipeline.** When a deletion request is actioned
   (`/api/data-deletion`, or the `on delete cascade` from `auth.users`), the subject's data must be
   removed from **future** training/eval sets, and the deletion must propagate to any cached
   grounding. Document the position on data already baked into a trained checkpoint
   **[SOLICITOR/ML]** (de-identified/aggregated data that no longer identifies the subject is
   generally retainable; identifiable contributions should be excludable).
5. **Honour opt-out / withdrawn opt-in.** A user who opts out (or never opted in, under the
   express-opt-in model) must be **excluded from identifiable-data training** from that point.
   Enforce via a per-org flag checked by the training/eval data-builder. Store the consent state
   auditable (see §5.3).
6. **Third-party provider terms.** Calls to AI sub-processors (Anthropic et al.) must use a
   configuration where the provider does **not** train its foundation models on our customers' data,
   unless that is separately disclosed and consented. **[SOLICITOR/ENG]** verify the account/API
   tier honours this.
7. **No private business data in the shippable tree** (existing CLAUDE.md rule): the `snowflow|edagher`
   grep guard and the env-gated context-pack loader stay in force; eval fixtures stay synthetic.
8. **Read-only contract untouched.** None of this touches `decide().safe`, `ADS_WRITE_ENABLED`, or
   the no-live-edit guarantee. Data-use is analysis/training only.

---

## 7. Summary of decisions for the owner

- **You can train** — but the clean, APP-defensible design is: **de-identified/aggregated by
  default (bundled disclosure OK); identifiable client data only with separate express opt-in.**
- **Update 2 marketing pages** (Terms + Privacy), **the signup screen**, add a **settings toggle**,
  and **version-bump `legal_acceptances`** (and add `'data_training'` to the `document` check if
  recording training consent discretely).
- **Engineering must** train on de-identified/aggregated data, keep lead PII hashed and out of
  general training, enforce tenant isolation, propagate deletion, and honour opt-out.
- **Everything in §1–§3 is placeholder, non-binding prose. A solicitor must finalise — especially
  the consent mechanism, secondary-use basis, and sub-processor/overseas-training disclosure.**
