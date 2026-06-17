> ⚠️ **NOT LEGAL ADVICE — AI-GENERATED PARTNER-LEVEL REVIEW MEMO.**
> This memo is prepared by an AI reviewer acting in the role of a senior commercial/consumer law
> partner ("Partner A") for internal drafting-quality purposes only. It is **not legal advice**,
> does **not** create a lawyer–client relationship, and does **not** substitute for review,
> completion and sign-off by an **admitted Australian legal practitioner** holding a current
> practising certificate. No reliance should be placed on it for any binding purpose. All
> statutory references should be independently verified against current legislation and ACCC/OAIC
> guidance at the date of adoption.

---

# Partner Review A — AdPilot OS Terms of Service (DRAFT FRAMEWORK)

**Reviewer:** Senior Law Partner A (commercial / consumer law)
**Lead document:** `TERMS-OF-SERVICE-DRAFT.md` (v4-draft)
**Cross-checked against:** `PRIVACY-POLICY-DRAFT.md` (DRAFT framework)
**Date of review:** [Review Date]
**Scope:** Australian Consumer Law (non-excludable guarantees; s 64 / s 64A), the unfair
contract terms (UCT) regime, the regulated-advice perimeter (financial / tax / advertising),
subscription and auto-renewal disclosure, GST / tax-invoicing, the data-use & model-training
clause, and Meta/TikTok pass-through obligations.

---

## 1. Approval decision

**Approved as a DRAFT framework, subject to the conditions below and final sign-off by an admitted practitioner.**

The draft is materially above the standard usually seen at first-draft stage. It is correctly
structured around the only architectural choice that matters legally — the **read-only / "the
product proposes, the human approves"** model — and it does not, on its face, purport to exclude
non-excludable ACL guarantees. The ACL paramountcy clause (11.1), the mandatory consumer-guarantee
statement (11.3), the s 64A limitation (11.4(a)) and the advice-perimeter disclaimer (2.5) are all
present and broadly correctly framed. The drafting team has also flagged the right open questions.

The approval is conditional. There are several **blocking issues** (Section 2) that must be closed
before the document is published or relied upon, and a number of **should-fix** items (Section 3).
Critically, the single largest legal exposure is **not** in the Terms wording itself but in two
operational/factual matters that the wording assumes: (a) the **UCT regime now carries civil
penalties** (since 9 November 2023) and the indemnity/variation/cap clauses must be re-engineered for
small-business and consumer counterparties, not merely flagged; and (b) the **model-training and
"de-identified data" consent basis** (cl 9 Terms / s 4 Privacy Policy) rests on factual claims about
the architecture that must be verified before they can be safely asserted.

This memo identifies the gaps; an admitted practitioner must settle the wording and confirm the
factual predicates with the owner before adoption.

---

## 2. Blocking issues (must-fix before publication or reliance)

### B1. Unfair Contract Terms regime — the indemnity (cl 12), unilateral variation (cl 5.4 / 14) and liability cap (cl 11.4) are at real risk for consumer AND small-business standard-form contracts, and the penalty regime is now live

This is the most important issue in the document. The draft repeatedly **flags** the UCT regime to
the solicitor but does not yet **engineer** the clauses to survive it. Three points the owner must
understand:

1. **The contract is standard-form and almost certainly in scope.** AdPilot OS is a click-through,
   non-negotiated SaaS subscription. It will be a "standard form contract". The customer base
   (CLAUDE.md and cl 3.1 describe "businesses and advertising professionals"; cl 3.1 invites sole
   traders) will include **consumers** (ACL definition, now goods/services acquired where the amount
   does not exceed $100,000, regardless of purpose) and **small businesses**. The small-business UCT
   threshold was **substantially expanded from 9 November 2023**: it now applies where at least one
   party employs **fewer than 100 persons** OR has turnover under **$10 million** (the draft's open
   question 1 must be answered "yes, both consumers and small businesses are in scope" and the
   clauses drafted accordingly).
2. **UCT is now penalised, not merely "void".** Since the *Treasury Laws Amendment (More Competition,
   Better Prices) Act 2022* commenced (9 November 2023), it is a **contravention** to propose, apply,
   rely on, or purport to rely on an unfair term in a standard-form consumer or small-business
   contract, attracting **civil penalties** (per contravention, on the substantially increased
   maximum-penalty scale). The old position — "an unfair term is simply void" — is obsolete. The
   commercial risk of an over-reaching indemnity or variation clause is therefore no longer "the
   clause won't be enforced"; it is "the company can be penalised for including it." This changes the
   drafting posture from defensive to conservative.

**Specific clauses at risk and required fixes:**

- **Indemnity (cl 12).** A broad, one-way indemnity from a consumer/small-business customer in favour
  of the supplier is a textbook "example" of a potentially unfair term (it is listed among the
  illustrative grey-list categories — terms that limit/penalise one party or shift risk). Clause 12.2
  helpfully reduces it for the Provider's contribution and disclaims unfair-term operation, but a
  court assesses the term as drafted, not the saving clause. **Must-fix:** (i) narrow the indemnity to
  **third-party claims** only (not first-party loss); (ii) confine it to matters genuinely within the
  customer's control and causation (their Customer Data, their unlawful use, their platform-terms
  breaches) — the draft already does most of this; (iii) **cap** the indemnity (e.g. mirror the
  liability cap) — an uncapped indemnity sitting beside a capped liability clause is asymmetric and a
  UCT red flag; (iv) make it **proportionate/contributory** (already in 12.2); and (v) consider
  whether limb 12.1(d) ("changes you make to your advertising … in reliance on a Proposal") is
  defensible — it is reasonable in the read-only context but should be tied to the customer's
  independent decision (cl 2.4), not to mere "reliance", to avoid the appearance of the supplier
  off-loading the consequences of its own outputs.

- **Unilateral variation of price (cl 5.4) and of terms (cl 14).** Unilateral-variation rights are
  the most heavily scrutinised UCT category. The draft's mitigations (prior notice, right to cancel
  before the change takes effect, ACL carve-out) are the **correct** mitigations, but two gaps remain:
  (i) **no defined notice period** — "reasonable prior notice" is left to the solicitor; a court/ACCC
  will look for a **specified, adequate** period (commonly **at least 30 days**) — this must be fixed
  and stated, not deferred; and (ii) the variation right should be **limited to changes that are
  reasonably necessary** or, for adverse changes, paired with a genuine, **penalty-free** exit (no
  loss of pre-paid value). The "continued use = acceptance" mechanic in 14.2 is acceptable **only**
  if the customer had genuine advance notice and a real ability to leave; otherwise it edges toward
  unfair.

- **Liability cap (cl 11.4(c)).** A cap at "Fees paid in the preceding 12 months" is commercially
  orthodox and generally defensible **for paid tiers**. Two problems: (i) **the Free Tier** — a cap
  measured by fees paid is **$0** for free users, which both (a) may be challenged as an effective
  total exclusion of liability (UCT / s 64 territory for any non-excludable component) and (b) is
  commercially unnecessary to push that hard; the draft itself flags this (11.4 note) — it must be
  **resolved**, e.g. a nominal floor (such as $100 or a fixed modest sum) for Free Tier. (ii) The cap
  must sit unambiguously **behind** clause 11.1/11.3 (it does, via 11.5) — keep that.

**Recommendation:** treat B1 as the gating item. An admitted practitioner should redraft cl 12, fix
the notice periods in 5.4/14, and resolve the Free-Tier cap, with an express eye to the penalised UCT
regime. The "[SOLICITOR: …]" flags are necessary but **not sufficient** — these are drafting changes,
not just confirmations.

### B2. The advice-perimeter disclaimer (cl 2.5) protects against private-law reliance but does not, by itself, keep conduct outside the *regulated* perimeters — the gate must be behavioural, not just contractual

Clause 2.5 is well drafted as a **disclaimer of reliance** and is necessary. But a disclaimer cannot
cure conduct that, in substance, **is** a regulated activity. Two perimeters:

- **Financial product / financial services advice (Corporations Act / ASIC).** Low risk here —
  AdPilot OS analyses advertising performance, not financial products — but the AI specialist
  features must not drift into recommending financial products, credit, or "how to invest your
  budget" framing that could be characterised as financial advice. The disclaimer helps; the
  **guardrails in the product** (CLAUDE.md references hardened `GUARDRAILS` across the 12 personas)
  are what actually keep this safe. Cross-reference the contractual disclaimer to those guardrails.

- **Tax agent services (Tax Practitioners Board / *Tax Agent Services Act 2009*).** Higher latent
  risk. The product is AU-focused, references GST/ATO/PAYG (CLAUDE.md), and could be read as
  commenting on a customer's tax position (e.g. deductibility of ad spend, GST treatment).
  **Must-fix:** strengthen cl 2.5 to state expressly that the Service **does not provide tax agent
  services** within the meaning of the *Tax Agent Services Act 2009* (Cth) and that any GST/ATO
  references are **general information**, plus a product guardrail preventing the AI from giving
  entity-specific tax conclusions.

- **Misleading or deceptive conduct (ACL s 18) — the real exposure.** A disclaimer **does not**
  excuse misleading conduct. If the AI specialist outputs or the Campaign Health Score convey, in
  substance, an impression that turns out to be misleading, s 18 liability can arise notwithstanding
  cl 2.5 and notwithstanding the "no guarantee" clause (2.6). This is non-excludable. The mitigation
  is partly contractual (the "estimates / based on available inputs / no guarantee" framing in 2.6 is
  good) and partly **factual** — the outputs must be accurate and not overstated. **Must-fix:** add an
  internal note that the s 18 risk is managed by output accuracy and guardrails, not by the
  disclaimer, and ensure no marketing/product copy makes performance or "health score = good account"
  claims that the engine cannot substantiate.

**Why blocking:** the draft's open question 4 treats this as a "confirm" item. Given the AU tax
framing baked into the product, the TPB perimeter and the s 18 point need an affirmative drafting
fix and a guardrail cross-check, not just confirmation.

### B3. Data-use & model-training clause (cl 9, esp. 9.2, 9.4–9.6) — enforceability and consent basis depend on factual claims that are not yet verified; as drafted there is a misrepresentation / s 18 risk

Clause 9 makes several **factual assertions** that, if inaccurate, expose the company to s 18
(misleading conduct) and to a Privacy Act complaint:

- **"De-identified Data only" for training (9.2) and "We will not attempt to re-identify" (9.6).**
  These are good and align with the Privacy Policy (s 4). But "de-identified" under the Privacy Act
  is a **high bar** — data must not be about an individual who is *reasonably identifiable* in the
  relevant context. The Privacy Policy's own s 2.5 note correctly worries that a **salted hash of an
  email may still be matchable** and therefore may remain personal information. **There is a latent
  inconsistency:** the Terms assert lead PII is "excluded from training" (9.4) and the Privacy Policy
  asserts the hash is the only thing stored — but if the hash is still "personal information", then
  using it (or aggregates derived from genuinely-personal fields) for training is not "de-identified
  data only." **Must-fix:** the de-identification standard (Terms 1.8) and the hash characterisation
  (Privacy Policy 2.5) must be settled **consistently** and the clauses worded to match the verified
  technical reality. Do not publish either document until the engineer confirms the de-identification
  method and the practitioner accepts it meets the OAIC threshold.

- **Consent basis for training use.** The Terms rely on **contractual agreement** ("You agree that we
  may …", 9.2) plus an **opt-out** (9.5). For genuinely de-identified/aggregated data this is
  defensible because the Privacy Act does not apply to non-personal information. **But** for any data
  that is still personal information, an opt-out buried in standard-form Terms is a weak consent basis
  and, combined with the UCT regime, a clause that purports to authorise broad training use of
  personal information could itself be challenged. **Must-fix:** confirm that **only** non-personal
  (genuinely de-identified/aggregated) data is used for training; if any personal information is used,
  the consent mechanism must be upgraded (clear, opt-in, separable) — an opt-out clause is not enough.

- **"Tenant isolation / never exposed to any other customer" (9.3) and "Lead PII excluded" (9.4).**
  These are substantiable-claim representations. The Privacy Policy (s 8) describes RLS and AES-256-GCM.
  **Must-fix:** confirm the claims are presently true (not aspirational) before assertion — overstated
  security claims are a classic s 18 / OAIC exposure.

- **Anthropic processing (Privacy Policy 4.4) — cross-document gap.** The Privacy Policy names
  **Anthropic** as the AI sub-processor and flags (correctly) that the practitioner must confirm
  customer inputs/outputs are **not used to train** the provider's models under the applicable
  commercial/API terms, and the provider's retention period. The **Terms** (9.7) refer only generically
  to "AI/model providers." **Must-fix for consistency:** (i) ensure the Terms' permitted-use and
  sub-processor clauses are consistent with the Privacy Policy's specific Anthropic disclosure; and
  (ii) **verify and then state** the contractual position with the AI provider (no training on customer
  data; retention period) before publication — this is a factual predicate, not boilerplate. The
  current commercial/enterprise API terms of the named provider generally do not train on business API
  inputs/outputs and apply a limited retention window, but the **specific applicable terms and any
  zero-retention arrangement must be confirmed by the practitioner against the executed agreement** and
  not assumed from this memo.

**Why blocking:** these are representations to customers and individuals. Asserting them before the
architecture is verified converts a drafting document into a potential misrepresentation.

### B4. Meta / TikTok pass-through obligations — currently a placeholder, and the platforms DO impose flow-down terms

Clauses 10.3–10.4 correctly anticipate platform-mandated pass-through terms but **leave them as a
"[SOLICITOR: insert]" placeholder**. This is a genuine gap, not a formality:

- Meta's Platform Terms and **Business Tools Terms / Marketing API** terms, and TikTok's
  **Marketing API / Business Products** terms, impose **specific developer and end-user obligations**
  — including permitted data use, restrictions on combining/selling platform data, security
  requirements, deletion-on-request obligations, and required end-user disclosures. A SaaS that reads
  ad-account data via these APIs is typically **contractually required to flow certain of these terms
  down to its users** and to comply with developer-platform policies (and may be subject to app review).
- The "read-only" posture reduces but does **not** eliminate these obligations — data access alone
  triggers data-use and deletion commitments.

**Must-fix:** before publication, the actual current Meta and TikTok developer/marketing-API terms
must be reviewed and any mandated flow-down terms inserted into cl 10.4 (and reflected in the Privacy
Policy's sub-processor/overseas-disclosure sections). Until then cl 10.4 is an empty shell. The
precedence clause (17.7) correctly ranks platform-mandated terms above the Terms — that structure is
right; it just needs content.

### B5. Auto-renewal disclosure must meet the substantive standard, not just appear in the Terms

Clause 4.4 (automatic renewal) and cl 6.2 (recurring authorisation) are present and substantively
fine. But auto-renewing subscriptions are an active ACCC enforcement and UCT focus area. **Must-fix
(disclosure, not just terms):** (i) the auto-renewal, the renewal amount, the billing interval, and
the cancellation method must be **clearly and conspicuously disclosed at the point of sale** (not only
buried in the Terms) — this is a conduct requirement (s 18 / s 29) the Terms cannot satisfy alone;
(ii) cancellation must be **as easy as sign-up** (cl 6.3's in-product cancellation is good — confirm
it is genuinely self-service and not gated behind a retention flow); and (iii) if a free trial that
converts to paid is offered (cl 4.3), the **pre-trial disclosure of the conversion, the price and the
cancellation deadline** is essential — trial-to-paid conversions without clear disclosure are a known
enforcement trigger. The draft flags trial mechanics as owner-gated; that is acceptable provided the
disclosure is built before any trial launches.

---

## 3. Recommended improvements (should-fix)

- **S1. Define "consumer" and "small business" and segment the terms.** Rather than one-size-fits-all,
  consider an explicit clause acknowledging that where the customer is a "consumer" or a "small business
  contract" party under the ACL, the UCT protections and consumer guarantees apply and prevail. This
  both improves compliance posture and signals good faith.

- **S2. s 64A limitation (cl 11.4(a)) — confirm the carve-out logic.** The s 64A limitation to
  re-supply/cost-of-re-supply is **only** available where the services are **not** of a kind ordinarily
  acquired for personal, domestic or household use. AdPilot OS is a B2B ad tool, so the limitation is
  likely available — but the drafting should make the "not ordinarily acquired for personal use"
  predicate explicit and the practitioner should confirm it holds for the actual customer base (e.g.
  solo operators auditing personal-brand ad accounts).

- **S3. Make the "as is / as available" disclaimer (11.2) plainly subordinate in consumer-facing copy.**
  It is legally subordinated by 11.1/11.3/11.5, but "as is" language sitting next to the consumer-
  guarantee statement can itself **mislead consumers about their rights** (s 64 / s 29(1)(m) — false
  representation as to existence/effect of a guarantee/right). Recommend a one-line in-context pointer
  ("nothing in this clause limits the guarantees in clause 11.3").

- **S4. Refund clause (6.3/6.5) — tighten the "change of mind" framing.** The "no pro-rata refund for
  change of mind, except where the ACL requires" framing is correct, but ensure the public refund/FAQ
  copy mirrors it. A "no refunds" representation that overstates the position is the most common ACL
  s 29 breach for SaaS. Good that 6.5 expressly preserves ACL rights.

- **S5. GST / tax invoices (cl 5.2) — make the operational commitment concrete.** The clause is
  correctly drafted (GST-inclusive display; tax invoice "where applicable"). Should-fix: confirm the
  company is/will be **GST-registered** (mandatory at $75k turnover) and that Stripe is configured to
  issue compliant **tax invoices** (ABN, the words "Tax Invoice", GST amount or "Total price includes
  GST", date, supplier identity). Note the **overseas-customer** wrinkle the draft flags: B2B exports
  of services may be **GST-free**, and inbound digital-product GST rules differ — the practitioner/
  accountant should confirm the GST treatment matrix, but the **Terms wording is adequate**.

- **S6. Privacy Policy alignment — small-business exemption (Privacy Policy 1.2).** The Privacy Policy
  correctly raises the s 6D small-business-operator exemption and recommends voluntarily opting in.
  **Strongly endorse opting in** and binding the company to the APPs — a SaaS handling third-party
  advertising and lead data should not rely on the exemption (reputationally and because trading in
  personal information removes the exemption anyway). The Terms should reflect that the company holds
  itself to the APPs (cl 9.1 does — good).

- **S7. Notifiable Data Breaches (Privacy Policy 12) — ensure the Terms don't undercut it.** The
  Privacy Policy commits to the NDB scheme and a 30-day assessment. Ensure nothing in the Terms'
  liability/limitation clauses purports to exclude liability for a failure to meet NDB obligations
  (it doesn't appear to — 11.1/11.5 catch this — but confirm).

- **S8. Erasure endpoint (Privacy Policy 9.3, `/api/account/erase`) ↔ Terms 9.8/13.4.** Good
  cross-referencing. Should-fix: confirm the endpoint actually does what the Privacy Policy says
  (deletes vs de-identifies vs retains, including backups, logs, hashed records, and sub-processor
  data) and that the De-identified Data carve-out (Terms 9.6) is consistently described. A published
  deletion promise that the system doesn't honour is an s 18 exposure.

- **S9. Assignment (cl 17.1) and "sale/restructure" disclosure of personal information (Privacy Policy
  5.4 / 9 / 13.4).** Consistent across documents — good. Should-fix: ensure the privacy notice for a
  business-sale disclosure of personal information is adequate (APP 6) and that the assignment clause's
  "provided your rights are not materially diminished" survives UCT scrutiny.

- **S10. Governing law (cl 15).** Non-exclusive jurisdiction and a "nothing limits a right you have to
  bring proceedings elsewhere where that cannot be excluded" saving is the **correct** consumer-safe
  approach. Just fill the [State/Territory].

- **S11. Survival list (cl 13.5)** omits cl 14? (Changes) — minor; confirm. Otherwise the survival
  list is sensible.

---

## 4. Clause-by-clause notes (with suggested redline wording where useful)

> Suggested wording is **illustrative drafting input for the admitted practitioner**, not final text.

- **Header / "About this document".** Good — the DRAFT/not-legal-advice framing and the bracketed-token
  convention are appropriate. Keep the `[SOLICITOR: …]` notes out of the published version.

- **Cl 1.8 (De-identified Data).** Tie this definition expressly to the **outcome** ("not reasonably
  identifiable in the context in which the data is held or used") and cross-reference the hash
  characterisation in the Privacy Policy. **Blocking dependency — see B3.**

- **Cl 2.3 (guarded write path).** Well framed. *Suggested addition:* "Each such change is initiated and
  authorised solely by you; we act only as a conduit to transmit the instruction you confirm." This
  reinforces that the company is not the actor (reduces liability for the *change* itself, distinct
  from any defect in the tool). Confirm logging/audit-trail disclosure.

- **Cl 2.5 (no advice).** Strengthen per **B2**. *Suggested addition:* "The Service does not provide
  financial product advice (Corporations Act 2001 (Cth)) or tax agent services (Tax Agent Services Act
  2009 (Cth)). Any references to GST, ATO, or other Australian regulatory matters are general
  information only and not advice about your circumstances."

- **Cl 2.6 (no guarantee of results).** Good and important. Keep "estimates based on available inputs"
  — it is the s 18 mitigation. Ensure marketing copy matches (no "improve your ROAS" guarantees).

- **Cl 2.7 (changes to the Service).** "Reasonable efforts to avoid material reductions … of a paid
  tier during a paid period" — good, and subordinated to cl 11. Consider adding that a **material
  adverse reduction** to a paid tier gives a **pro-rata refund / cancellation** right, which both
  improves fairness and de-risks UCT.

- **Cl 3.1 (eligibility / B2B positioning).** The "intended for businesses" framing does **not** remove
  ACL consumer status (the $100k limb applies regardless of purpose). Don't rely on it. See B1/S1.

- **Cl 4.4 (auto-renewal).** Substantively fine — **disclosure** is the issue (B5).

- **Cl 4.5 (upgrades/downgrades) & 5.4 (price changes).** Confirm proration aligns with Stripe; fix the
  notice period (B1). *Suggested:* "We will give you at least 30 days' prior notice of any increase to
  the Fees for your Subscription. The increase applies only from your next renewal after that notice.
  You may cancel before it takes effect without penalty."

- **Cl 5.2 (GST).** Adequate (S5).

- **Cl 6.3 (cancellation) / 6.5 (ACL refunds).** Good. The express "in addition to and does not limit
  the ACL" is exactly right (avoids s 64 / s 29 misrepresentation). Keep 11.3 cross-reference.

- **Cl 7 (acceptable use).** Reasonable. Note 7.1(f) ("develop a competing product / train a competing
  model") and 7.1(d) (reverse engineering) are common; ensure 7.1(d)'s "except to the extent prohibited
  by law" carve-out is retained (it is) so it doesn't override non-excludable interoperability rights.

- **Cl 8.5 (feedback licence).** "Perpetual, royalty-free" feedback licence is standard and acceptable
  even in consumer/small-business contracts because it is narrow and customary; low UCT risk. Leave.

- **Cl 9 (data use / training).** See **B3** — the most consequential section after liability. The
  structure (operate/improve/train only on de-identified; lead PII excluded; opt-out; tenant isolation)
  is the right structure; the **factual verification** is the gate.

- **Cl 10.4 (platform pass-through).** **Empty — see B4.** Must be populated.

- **Cl 11.1 / 11.3 / 11.5 (ACL paramountcy & mandatory statement).** Correctly structured. **Action:**
  confirm cl 11.3 reproduces the **current prescribed** consumer-guarantee wording verbatim (the draft
  flags this) and decide whether the **goods** limb is needed (likely services-only — so the services
  wording alone is appropriate). Do not paraphrase the prescribed text.

- **Cl 11.4 (limitation).** s 64A limb (a) — confirm availability (S2). Cap (c) — fix Free Tier (B1).
  Consequential-loss exclusion (b) — standard and acceptable subject to 11.1/11.5.

- **Cl 12 (indemnity).** **Redraft per B1.** *Suggested structure:* limit to third-party claims; cap at
  the cl 11.4(c) amount; retain the proportionality carve-out (12.2); tie 12.1(d) to the customer's
  independent decision under cl 2.4 rather than "reliance on a Proposal."

- **Cl 13 (termination/suspension).** Suspension rights are reasonable; "immediate suspension to
  protect the Service/others" (13.3) is justifiable. Ensure suspension for the company's **convenience**
  is not implied — limit to the enumerated grounds (it is). For UCT, ensure a corresponding
  customer-friendly consequence (data export window in 13.4 — good).

- **Cl 14 (changes to Terms).** Fix notice period; ensure penalty-free exit (B1).

- **Cl 15 (governing law).** Good consumer-safe drafting (S10).

- **Cl 17.6 (entire agreement) / 17.7 (precedence).** Correctly preserve liability for misleading or
  deceptive conduct and rank Non-Excludable Rights and platform-mandated terms above the Terms. This is
  well done. Confirm the Privacy Policy is incorporated (cl 1.11 says so — good).

---

## 5. Residual risks the owner must accept or refer to engaged counsel

The following cannot be closed by drafting alone and must be **accepted by the owner with eyes open**
or **referred to engaged counsel / the relevant adviser** before publication:

1. **UCT penalty exposure (R-high).** Even a well-drafted indemnity/variation/cap can be challenged.
   The penalised regime means the residual risk is regulatory (ACCC), not just unenforceability. Owner
   must accept that the conservative redraft (B1) trades some commercial protection for compliance.

2. **Factual-predicate risk on data claims (R-high).** Every representation in cl 9 (Terms) and ss 4 &
   8 (Privacy) — de-identification, no-training-on-PII, tenant isolation, AES-256-GCM, hash
   irreversibility, the AI provider's no-train/retention position — is only as safe as the architecture.
   If any claim is aspirational rather than implemented, there is s 18 and OAIC exposure. **Engineering
   sign-off is a precondition.**

3. **Regulated-advice perimeter (R-medium).** The disclaimer + guardrails materially reduce, but do not
   eliminate, the risk that AI outputs are characterised as tax-agent services or as misleading. As
   features evolve (especially the env-gated write path), the perimeter must be re-reviewed.

4. **Meta/TikTok flow-down and app-review risk (R-medium).** The platforms can change API terms, require
   app re-review, or restrict access; mandated flow-down terms must be tracked and updated. Until the
   actual platform terms are mapped (B4), there is residual non-compliance risk with the developer
   agreements themselves (separate from the customer Terms).

5. **GST / overseas-customer tax treatment (R-medium).** Refer the GST registration status, tax-invoice
   configuration, and the GST-free-export / inbound-digital-services treatment to a **registered tax
   agent / accountant** — outside this consumer-law review and not curable by Terms wording.

6. **Auto-renewal / trial conduct (R-medium).** The clauses are fine; the **point-of-sale disclosure and
   cancellation UX** are conduct risks the owner must build and maintain, especially before any free
   trial launches.

7. **Privacy Act reform horizon (R-low/watch).** Australian privacy reform (including possible changes
   to the small-business exemption, a statutory tort, and automated-decision-making transparency) is in
   motion. The Privacy Policy's automated-decision statement (4.6) and the small-business-exemption
   posture should be revisited on any reform commencement.

8. **Placeholders (R-blocking-administrative).** Publication is barred until all `[placeholders]` and
   `[SOLICITOR: …]` items are resolved: `[Business Name]`, `[ABN]`, `[Contact Email]`, role-based
   privacy mailbox, `[State/Territory]`, `[Effective Date]`, Privacy Policy URL, registered postal
   address, confirmed AUD prices per tier, and the populated platform pass-through terms.

---

### Summary

The framework is **approved as a DRAFT, conditional on the conditions above and final sign-off by an
admitted Australian legal practitioner.** It is structurally sound and correctly anchored on the
read-only / human-approval model and ACL paramountcy. The decisive work remaining is: (B1) re-engineer
the indemnity, variation and Free-Tier cap for the **penalised** UCT regime; (B2) harden the
tax/advertising/s 18 advice perimeter behaviourally, not just contractually; (B3) **verify before
asserting** the data-use, de-identification, training and AI-provider claims, and reconcile the Terms
with the Privacy Policy on the hash characterisation; (B4) **populate** the Meta/TikTok pass-through
terms; and (B5) build compliant point-of-sale auto-renewal/trial **disclosure**. None of these are
fatal to the framework; all must be closed before reliance.

> **Reminder:** AI-generated memo, **not legal advice**, no lawyer–client relationship; engage an
> admitted Australian legal practitioner before adoption or reliance.
