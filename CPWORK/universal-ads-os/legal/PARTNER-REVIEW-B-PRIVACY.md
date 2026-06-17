> ⚠️ **AI-GENERATED REVIEW — NOT LEGAL ADVICE.** This document is a review prepared by an
> AI reviewer acting in the role of a notional "senior privacy/data-protection partner". It is
> **not legal advice**, creates no lawyer–client relationship, and **does not substitute for an
> admitted Australian legal practitioner**. It is an internal aid to focus the human review only.
> Every conclusion below must be independently verified and signed off by an admitted Australian
> legal practitioner before any reliance, publication, or use. Statutory references and OAIC
> guidance positions stated below must be re-checked against the law in force at the date of
> publication.

---

# Partner Review B — Privacy (Privacy Act 1988 (Cth) & the Australian Privacy Principles)

**Reviewer role:** Senior Law Partner B — privacy / data protection
**Lead document:** `PRIVACY-POLICY-DRAFT.md`
**Cross-checked:** `TERMS-OF-SERVICE-DRAFT.md` (clause 9 — data use / model training / opt-out; clauses 1.8, 1.10, 13.4, 17.7)
**Subject product:** AdPilot OS — read-only Meta/TikTok ads audit SaaS
**Date of review:** [Review Date]
**Reviewing practitioner for sign-off:** [Admitted Australian Legal Practitioner]

---

## 1. Approval decision

**Not yet — there are blocking issues that must be resolved before this Privacy Policy is fit to
be finalised, even as a "DRAFT framework subject to conditions".**

To be precise about the gradation, because the brief invited either formulation:

- As an **internal drafting scaffold**, this is a strong, well-structured first cut. It correctly
  maps to the thirteen APPs, flags the right questions to counsel, and is honest about what it
  does not yet know. On structure and coverage I would approve it to **continue** as a working
  draft.
- However, I will **not** approve it as a "framework subject only to conditions + final
  sign-off", because two of its load-bearing factual representations (the lead-hash
  de-identification position, and the overseas/data-residency position) are presented in a way
  that, if published substantially as drafted, creates a real risk of **misleading or deceptive
  conduct (s 18 ACL)** and of **APP 5 / APP 8 non-compliance**. Those are not "polish later"
  conditions; they go to the truth of statements the policy makes to individuals. They are
  **blocking** and are set out in Part 2.

Once the Part 2 blocking issues are closed (and the factual placeholders filled by the owner and
engineering), my recommended disposition is:

> **Approved as a DRAFT framework, subject to the conditions in Parts 2–3 and to final review and
> sign-off by an admitted Australian legal practitioner who takes responsibility for the
> as-published text.**

---

## 2. Blocking issues

### B1. The salted one-way lead hash is, on the facts described, most likely still "personal information" — and the policy is drafted as though it is not. (APP definitions; s 6; APP 11; APP 12/13; NDB)

This is the single most important issue in the document, and it propagates into the Terms.

**The problem.** Section 2.5 says identifiers are "converted to a one-way hash before storage",
that "we store the hash, not the underlying personal information", and that "the hash is not
designed to be reversed by us". Section 4.3, 9.4, and Terms clause 9.4 then build on that premise
to assert lead PII is "not stored" and is "excluded" from training, and section 9.4 of the policy
tells the individual there is "no underlying lead identifier for us to return or delete".

The legal difficulty is that a **one-way hash of a low-entropy, structured identifier (an email
address or a phone number) is not, by itself, de-identification.** Under the Privacy Act,
information is "personal information" if an individual is "reasonably identifiable" from it,
having regard to the cost, difficulty, practicality and likelihood of re-identification *in the
relevant context*. The relevant context here is hostile to a de-identification claim:

- **The input space is enumerable.** Email addresses and especially phone numbers have small,
  guessable formats. Anyone holding the hashing algorithm and the salt can hash a candidate value
  and test for a match (a "dictionary"/brute-force re-identification). The output is therefore a
  reliable, persistent **pseudonymous key for a specific individual**, not anonymised data.
- **A salt only helps if it is secret, per-record, and not stored alongside the hash.** A single
  static application-wide "pepper" held in the same system as the hashes does little; if the
  organisation can compute the hash, the organisation can re-identify. And the *whole point* of
  the hash here — "de-duplication, matching, and measurement" — is that the same person reliably
  maps to the same value. That is the functional definition of a persistent identifier, i.e.
  information that singles out and is *about* an individual.
- **OAIC guidance treats hashing/pseudonymisation as a security and minimisation control, not as
  a magic conversion to non-personal information.** De-identification requires that
  re-identification is *not reasonably likely in the relevant context*, considering data the
  entity holds **and** data others could bring to bear.

**Why this is blocking, not cosmetic.** The policy makes affirmative representations to consumers
and to the OAIC that flow from the "it's not personal information" premise:

1. **APP 12/APP 13 (access/correction) and erasure (s 9.4):** The policy tells an individual we
   have "no underlying lead identifier … to return or delete." If the hash is in fact personal
   information about that person, that statement is **wrong** and may itself be misleading. The
   individual may have access/correction rights, and the hashed record is squarely *in scope* of
   an erasure request.
2. **APP 11 security + NDB scheme:** If the hash table is personal information, then a breach of
   it is a breach of personal information, and the NDB serious-harm assessment (s 12.x of the
   policy / Part IIIC) must treat it as such. A breach narrative that says "only hashes were
   exposed, so no personal information was lost" could understate a notifiable breach.
3. **Section 4 / Terms 9.4 (training exclusion):** "Lead PII is excluded because only a hash is
   stored" is only true if the hash is genuinely non-personal. If it is personal information, the
   exclusion claim is overstated and the s 18 ACL exposure attaches to the marketing-adjacent
   "we don't train on your lead data" promise.

**Required resolution (must do at least one, and state the result plainly in the policy):**

- **Option A — treat the hash as personal information.** This is the conservative, defensible
  default. Re-draft sections 2.5, 4.3, 9.4 and Terms 9.4 to say the hashed lead record is
  *personal information held in a minimised, pseudonymised form*, that it is protected as such
  under APP 11, is **in scope** of access/correction/erasure, and is included in NDB assessment.
  This is the position I recommend unless engineering can substantiate Option B.
- **Option B — substantiate a genuine de-identification claim.** Only available if there is a
  documented technical design that defeats reasonable re-identification: e.g. an HMAC with a
  **secret key held in a separate trust boundary / KMS not accessible to the analytics tier**,
  truncation, k-anonymity/aggregation thresholds, and a **documented re-identification-risk
  assessment** (motivated-intruder test). Even then, OAIC guidance is cautious; the claim must be
  evidenced, governed, and periodically re-tested, and the policy should not assert de-identified
  status more strongly than the evidence supports.

**Engineering must answer, in writing, before this can be closed:** the exact hash algorithm; salt
vs. HMAC-key; whether the salt/key is per-record or global; where it is stored relative to the
hashes; whether the application can compute a hash from a plaintext identifier on demand; and what
other lead fields (timestamp, campaign, value, partial identifiers) are stored alongside the hash
(because those raise re-identification by linkage). Until that exists, **the policy must adopt
Option A**.

---

### B2. The country list required by APP 5.1(i) / APP 8 is missing — and the policy cannot be published with section 6 as a placeholder. (APP 5; APP 8; s 16C)

Section 6 is currently almost entirely a `[SOLICITOR]` placeholder. That is acceptable in a draft,
but it is a **publication blocker** because:

- **APP 5.1(i)** requires the entity, at or before collection, to notify the individual of the
  **countries** in which overseas recipients are *likely* to be located, *if it is practicable to
  specify them*. For a SaaS with a known, short sub-processor list (Supabase, Stripe, Resend,
  Anthropic), it **is** practicable to specify them. "We may send data overseas" is not
  sufficient.
- **APP 8 + s 16C** mean the entity generally remains **accountable** for an overseas recipient's
  handling as if it were the entity's own act. Section 6.2 states this correctly, but the policy
  then needs to actually identify the disclosures and the safeguard relied on.
- **Data-residency representation risk.** Section 6.3(e) anticipates a possible customer-facing
  promise such as *"advertising and lead data is stored in Australia."* That is exactly the kind
  of statement that is **load-bearing and s 18-sensitive**: it must not be made unless the
  Supabase project region (and any read replica / backup / log-shipping / support-tooling
  location) genuinely keeps that data in-country, **and** Anthropic/Stripe/Resend processing
  locations are consistent with it. AI inference (Anthropic) and email (Resend) in particular are
  commonly US-processed; promising "stored in Australia" while routing content to a US inference
  endpoint would be misleading unless carefully scoped (e.g. "stored" vs "processed", and what is
  sent to each provider).

**Required resolution before publication:** engineering/owner to confirm, and the policy to state,
the processing location of **each** sub-processor; a concrete country list (at minimum
Australia + the United States, plus any others Supabase/Stripe/Resend use for failover/CDN/support);
the APP 8 basis relied on (reasonable-steps + contractual flow-down vs. an APP 8.2(b) informed-
consent route); and the final, accurate residency commitment. Do **not** ship the "stored in
Australia" promise until verified end-to-end including backups and logs.

---

### B3. The Anthropic "no-training" representation is asserted upstream (s 4.1/4.3) but not yet contractually confirmed (s 4.4). The policy must not promise what the contract does not deliver. (APP 6; s 18 ACL)

Sections 4.1 and 4.3 make firm promises ("we do **not** use identifiable customer content … to
train …"; "lead PII is never used for model training"). Section 4.4 then defers the *actual
contractual confirmation* with Anthropic to a `[SOLICITOR]` note ("confirm … that customer inputs
and outputs are **not used to train** … and any data-retention period").

This is an internal inconsistency that is **blocking** because the upstream promise is only true if
the downstream contract says so. Before publication the owner/counsel must:

- Obtain and retain the **commercial/API terms** that govern the AdPilot↔Anthropic relationship and
  confirm in writing that (a) inputs/outputs are **not used to train** the provider's models under
  those terms, and (b) the provider's data-retention/zero-retention position is what the policy
  implies. (For an AI reviewer's purposes I note only that this must be verified from the
  *actually applicable* contract/terms — not assumed — and the confirmed position then stated in
  s 4.4.)
- Confirm **what content is actually sent to Anthropic.** The sub-processor table (s 5.3) says
  "content submitted to produce a response". If any prompt can contain personal information (lead
  context, names in account data, support text), then Anthropic is receiving personal information
  and this is an APP 6 use/disclosure and an APP 8 overseas disclosure that must be reconciled with
  sections 5 and 6 and with the "de-identified/aggregated only for improvement" promise in s 4.2.

Until 4.4 is closed, sections 4.1/4.3 should be softened to track only what the contract confirms,
or the firm promises must be backed by the confirmed terms.

---

### B4. APP 6 secondary-use basis for "Service and model improvement" relies on an opt-OUT that is not clearly grounded — and may be the wrong construction. (APP 6; APP 3; APP 5)

Section 4.2 + 4.5 (and Terms 9.2 + 9.5) permit use of customer data "to develop, evaluate, or
improve the Service or its models" limited to "de-identified or aggregated" data, with an
**opt-out**. Two problems:

1. **If the data is genuinely de-identified, it is not personal information and APP 6 does not bite
   at all** — in which case the opt-out is a commercial courtesy, not a legal requirement, and the
   policy should say so honestly rather than implying the opt-out is what makes the use lawful.
2. **If the data is *not* genuinely de-identified** (see B1 — the lead hash is the obvious case,
   but "aggregated" account metrics can also remain personal where the account is a sole trader or
   a named individual), then using it for the *secondary purpose* of model/Service improvement
   needs an APP 6 footing: either (a) it is within the individual's reasonable expectations and
   related to the primary purpose, or (b) consent. **An opt-out is not consent.** For a *secondary*
   use of identifiable information that the individual would not obviously expect (training/
   evaluation), reliance on a buried opt-out is weak. The defensible constructions are: keep the
   secondary use strictly to genuinely de-identified/aggregated data (then it is not personal
   information), **or** obtain opt-IN consent at sign-up for any identifiable use.

**Required resolution:** decide and state the basis. My recommendation: (i) hard-limit
training/improvement to genuinely de-identified/aggregated data and back the de-identification
claim with the B1 work; (ii) keep the opt-out as a courtesy but do **not** present it as the
lawful basis; (iii) ensure the APP 5 collection notice and sign-up flow surface this use so that
"reasonable expectation" is properly founded. This must be **consistent across** policy s 4 and
Terms 9.2/9.5/9.6.

---

### B5. Sensitive information is flagged as a question but left open — and the answer changes the consent architecture. (APP 3.3; s 6 "sensitive information")

Section 2.4's `[SOLICITOR]` note correctly spots that platform targeting/audience attributes
(health, racial/ethnic origin, sexual orientation, political/religious affiliation, etc.) *could*
constitute **sensitive information**, which generally requires **consent** to collect and attracts
stricter handling. This cannot remain merely a question in a published policy: the product either
does or does not ingest fields capable of revealing sensitive information.

**Required resolution before publication:** engineering to enumerate the exact API
scopes/fields pulled from Meta and TikTok and confirm whether any field is, or in combination
reveals, sensitive information. If yes, the policy must add an express sensitive-information
section with a consent mechanism (and the collection should ideally be designed *out*). If no, the
policy should state plainly that the Service does not collect sensitive information. A definite
statement is required either way — silence/ambiguity is itself an APP 1/APP 5 transparency gap.

---

## 3. Recommended improvements (strongly advised, not strictly blocking)

- **R1. Make the erasure clause concrete on backups, logs, and sub-processors (APP 11.2; APP 12/13).**
  Section 9.4 defers the *scope* of `/api/account/erase` to counsel. Before publication, the policy
  should state, in plain terms: what is deleted immediately vs. de-identified; that **backups**
  expire on a stated cycle (e.g. live deletion now, backup overwrite within N days) rather than
  being individually purged; that **logs** are retained for a stated security period then deleted;
  that erasure requests are **propagated to sub-processors** (Supabase/Stripe/Resend/Anthropic) and
  on what timeframe; and a single committed end-to-end timeframe. Tie this to the B1 decision on
  whether the hashed lead record is in scope (it should be, under Option A).

- **R2. Reconcile retention periods with concrete numbers (APP 11.2).** Section 11 uses
  "indicative" language and defers numbers. At minimum commit to: billing/financial records retained
  **5 years** (consistent with general Australian record-keeping expectations — confirm with the
  owner's accountant/the applicable tax requirements); logs (e.g. 30–90 days); backups (e.g. 30
  days); account data (active + a defined tail). Vague retention undermines APP 11.2's
  destroy/de-identify obligation.

- **R3. Controller/processor (or Australian-law equivalent) characterisation must be settled, not
  flagged.** Section 1.5's note is correct that Australian law does not use the GDPR
  controller/processor split, but the *practical* allocation — whether AdPilot handles lead-derived
  data on its **own** behalf or **on behalf of** the account holder — drives who owes APP 5 notice
  to the downstream individual, who handles their access/erasure request, and what the customer
  agreement (Terms cl 3.4, 9) must allocate. Settle this and align Terms cl 3.4 (the customer's
  warranty that it has "obtained all necessary consents") with the policy, because the policy
  currently leans on the customer having collected leads lawfully while also describing AdPilot's
  own handling.

- **R4. APP 1 governance specifics.** Name a real **Privacy Officer role** (role-based mailbox,
  e.g. `privacy@[domain]`, never a personal address — consistent with the project's resale-clean
  rule), and confirm the s 6D small-business-operator analysis. Given the business handles
  third-party advertising/lead data and trades on a privacy-forward posture, I support the draft's
  recommendation to **voluntarily opt in** to APP coverage and to say so — but that is an owner
  decision to confirm.

- **R5. Cookies/analytics (s 10) must be made definite.** If only strictly-necessary cookies are
  used, say so plainly and drop the conditional language. If any analytics/pixel is used, list it,
  its location (feeds s 6 country list), and the consent/opt-out mechanism. An ads product using a
  marketing pixel on its own site while telling users it is privacy-first would be a poor look and a
  potential s 18 issue.

- **R6. Direct marketing / Spam Act (s 7).** Confirm the consent basis for each marketing channel
  and that unsubscribe is functional and actioned within the statutory period. Keep the clear
  separation drawn in 7.1 between *necessary service communications* and *marketing* — that
  distinction is correct and worth preserving.

- **R7. NDB assessment-period wording (s 12.3).** "We aim to assess … within 30 days" is correct as
  the **maximum** statutory ceiling, but the drafting should make clear the obligation is to assess
  **expeditiously and within 30 days**, not that 30 days is a target. Also confirm sub-processor
  contracts oblige the provider to notify AdPilot of a breach quickly enough for AdPilot to meet its
  own NDB clock (s 12.4 already flags this — close it).

- **R8. Anonymity/pseudonymity (s 2.8).** The APP 2 treatment is sound for an authenticated SaaS;
  no change needed beyond confirming general enquiries can genuinely be made without identification.

- **R9. "Changes to this policy" consent (s 15).** "Continued use indicates acknowledgement" is
  acceptable for routine changes but is **not** a substitute for fresh **consent** where a change
  expands use of personal information (e.g. a new training use, a new overseas recipient). Flag that
  material privacy-expanding changes require notice and, where consent was the basis, **fresh
  consent** — not mere continued use.

---

## 4. Section-by-section notes with suggested wording

> Suggested wording is **drafting assistance for the reviewing practitioner**, not settled text.

**Header / disclaimers.** Good. The DRAFT / not-legal-advice banner and the closing reminder are
appropriately prominent and should be retained until an admitted practitioner adopts the text.

**§1 (APP 1 scope).** Sound. Resolve the s 6D and entity questions (R4). Settle §1.5
controller/processor characterisation (R3) rather than leaving it as a note.

**§2.4 (connected metrics; sensitive info).** Close B5. Add a definite statement. Suggested, *if*
no sensitive information is collected:
> "The Service does not intentionally collect sensitive information (as defined in the Privacy
> Act). We configure platform data access to exclude audience or targeting attributes that reveal
> sensitive information. If we become aware that sensitive information has been collected
> incidentally, we will handle it in accordance with APP 3.3 and APP 4 and delete or de-identify it
> where lawful."

**§2.5 (lead hash) — REWRITE per B1.** If adopting Option A (recommended), suggested:
> "Where a lead record would otherwise contain a direct identifier (such as an email address or
> phone number), we convert that identifier to a one-way cryptographic hash and store the hash in
> place of the raw identifier, as a data-minimisation measure. Because the same individual produces
> the same hash, and because the underlying identifiers are drawn from a limited range of possible
> values, the hash can in some circumstances be matched back to an individual. We therefore treat
> the hashed lead record as **personal information** and protect it accordingly. We do not store the
> raw lead identifier, and we do not attempt to reverse the hash for any purpose other than the
> matching, de-duplication and measurement functions described here."
Then delete the §9.4 statement that there is "no underlying lead identifier … to return or delete"
and replace it (see §9 below).

**§3 (APP 3/APP 6 purposes).** Solid. The §3.2 secondary-use exception list is accurate. §3.3
(tokens used only for authorised read-only functions) is good and should be kept — it is a strong
trust statement and it is consistent with the read-only product model.

**§4 (data use / model training) — the cross-consistency hot-spot.** Close B3 (Anthropic) and B4
(opt-out basis). Align every assertion here with **Terms clause 9**:
- Policy §4.2 ("de-identified or aggregated") ↔ Terms 9.2 ("De-identified Data … only") — these are
  consistent in intent; ensure the *defined term* and threshold (Terms 1.8) and the policy's prose
  use the same standard, and that both are backed by the B1 de-identification evidence.
- Policy §4.3 (lead PII excluded) ↔ Terms 9.4 — **both currently rely on the hash being
  non-personal.** If B1 resolves to Option A, both must be re-cast as "raw lead identifiers are not
  retained; hashed lead records are personal information and are excluded from training datasets",
  rather than "lead PII is not stored at all."
- Policy §4.5 opt-out ↔ Terms 9.5 opt-out — consistent in mechanics; both must adopt the B4
  position (opt-out is a courtesy over de-identified data; not the lawful basis for identifiable
  use). Confirm the opt-out is recorded and given effect, and state the timeframe.
- Policy §4.4 (Anthropic) — replace the `[SOLICITOR]` note with the confirmed contractual position
  once obtained (B3). Suggested skeleton once confirmed:
  > "Under our agreement with Anthropic, content we send for processing is **not used to train
  > Anthropic's models**, and is retained by Anthropic only for [confirmed retention period] before
  > deletion. Anthropic processes this content in [country/countries] (see section 6)."
- Policy §4.6 (no solely-automated significant decisions) — accurate for the current "proposes;
  human approves" model and consistent with Terms 2.3–2.4. Keep, and keep the watch-item for future
  automated-decision-making reform.

**§5 (disclosure / sub-processors).** §5.1 "we do not sell personal information" — good, keep.
Confirm the sub-processor table is complete (analytics, error-monitoring, logging, hosting/CDN are
the usual omissions — §5.3 note already flags this). Each table row should ultimately carry the
processing **location** to feed §6 (R5/B2).

**§6 (overseas / residency) — COMPLETE per B2.** This section must be fully written with a real
country list before publication. Suggested skeleton once locations are confirmed:
> "We disclose personal information to recipients located in **Australia** and the **United
> States**[, and …]. Specifically: [Supabase — hosting/database — region]; [Stripe — payments —
> United States/other]; [Resend — email — country]; [Anthropic — AI processing — country]. Before
> any overseas disclosure we take reasonable steps to ensure the recipient does not breach the APPs
> (APP 8.1), principally through contractual data-protection obligations. [State residency
> commitment, e.g.: 'Your advertising and lead data is stored at rest in Australia; limited content
> may be processed overseas as described above.']"
Do not assert "stored in Australia" unless verified including backups and logs.

**§7 (direct marketing).** Sound; close the Spam Act consent/unsubscribe confirmation (R6).

**§8 (security, APP 11).** Accurate and appropriately specific (AES-256-GCM at rest for tokens;
tokens never sent to browser; PostgreSQL RLS tenant isolation; access controls). §8.2 (no absolute
guarantee) is appropriate. Complete §8.3 with TLS-in-transit, key management, logging/monitoring,
backup/recovery and personnel access — accurately but not so granularly as to create risk. Ensure
§8 expressly extends APP 11 protection to the **hashed lead records** if B1 → Option A.

**§9 (access/correction/erasure) — REWRITE §9.4 per B1 + R1.** Replace the "no underlying lead
identifier … to return or delete" sentence. Suggested:
> "Erasure covers the personal information we hold about you, including account, profile,
> advertising-metric and **hashed lead** records that relate to you, subject to the retention
> exceptions in section 11. When you request erasure: we delete or de-identify the relevant records
> in our live systems within [N] days; we propagate the request to our sub-processors; residual
> copies in encrypted backups are overwritten on our standard backup cycle (within [N] days); and
> limited records may be retained only where law requires (for example, financial records) or for
> the establishment/exercise/defence of a legal claim. We will tell you what we have deleted,
> de-identified, or retained, and why."
§9.5 (fees / identity verification) — confirm and complete.

**§10 (cookies).** Make definite per R5.

**§11 (retention).** Commit to concrete numbers per R2; align with §9 erasure and the
`/api/account/erase` behaviour.

**§12 (NDB).** Accurate. Tighten §12.3 wording per R7; close §12.4 sub-processor-notification
flow-down.

**§13 (complaints / OAIC).** Correct mechanism. Verify OAIC contact details (address/phone/URL)
are current at publication — these have changed historically, so do not rely on the draft's values.

**§14 (contact).** Use a **role-based** privacy mailbox and a postal address. **Never** a personal
email — consistent with the project's resale-clean rule.

**§15 (changes).** Add the fresh-consent carve-out for privacy-expanding changes per R9.

---

## 5. Residual risks for the owner / engaged counsel

These remain live even after the above is addressed, and the owner should accept them consciously
or instruct counsel/engineering to close them:

1. **Re-identification risk is a moving target.** Even if Option B (genuine de-identification of the
   lead hash) is adopted and documented today, advances in matching/auxiliary data can erode it.
   The de-identification claim needs a **named owner**, a documented motivated-intruder assessment,
   and a periodic re-test. If that governance cannot be sustained, default to Option A.

2. **Truthfulness of the residency promise over time.** A "data stored in Australia" commitment must
   survive provider region changes, failover, CDN edge caching, and support tooling. Any drift makes
   a published statement misleading (s 18 ACL). Build a change-control gate: no sub-processor or
   region change ships without a privacy/residency review and a policy update.

3. **Anthropic / AI provider terms are not within the owner's control and can change.** The
   no-training and retention representations depend on the provider's current terms. Counsel should
   confirm the *contractually applicable* terms (not marketing summaries), retain evidence, and set
   a review trigger on provider-terms updates. What is sent to the model (whether prompts can carry
   personal information) is the owner's design choice and should be minimised at source.

4. **Customer-as-source-of-leads lawfulness.** The Terms (cl 3.4) shift to the customer the warranty
   that leads were collected with necessary consents. That allocation is reasonable but does **not**
   fully insulate AdPilot if AdPilot is itself an APP entity handling that data; downstream
   individuals may still look to AdPilot. The controller/processor characterisation (R3) and any
   Data Processing Addendum (flagged in Terms 9.7) should be settled by counsel.

5. **Small-business-operator exemption (s 6D) decision.** If the owner relies on the exemption, the
   privacy-forward marketing posture and the handling of third-party data create both legal and
   reputational risk; if the owner voluntarily opts in (recommended), every APP obligation in the
   policy becomes a binding commitment to honour, not aspiration.

6. **Cross-document consistency must be re-checked at final sign-off.** The data-use/training/opt-out
   story spans Privacy Policy §4 and §9 and Terms §9 (and the Terms' own "open questions" item 5
   already flags this). After the B1/B3/B4 edits, both documents and the in-product sign-up
   collection notice (APP 5) must be re-read together so that no one statement contradicts another.

7. **This review is AI-generated.** It may have missed issues, mis-stated guidance, or relied on
   positions that have since changed. It is a focusing aid only. **An admitted Australian legal
   practitioner must independently verify all statutory references, OAIC guidance, and the
   as-published text, and take responsibility for sign-off.**

---

> **Reviewer disposition:** Not yet approvable as a conditions-only framework — close blocking
> issues **B1–B5** first (the lead-hash characterisation and the overseas/residency country list are
> the two that most directly create representation and compliance risk). Once closed and the factual
> placeholders are filled, this is suitable to be **approved as a DRAFT framework subject to the
> Part 2–3 conditions and final admitted-practitioner sign-off**. — Senior Law Partner B (Privacy)
