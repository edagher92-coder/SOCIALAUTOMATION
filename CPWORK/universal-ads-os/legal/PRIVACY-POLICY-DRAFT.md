> ⚠️ **DRAFT — NOT LEGAL ADVICE.** Prepared by an AI drafting team as an initial
> framework only to accelerate review. Must be reviewed, completed and approved by an
> admitted Australian legal practitioner before any use or reliance. Not binding.

---

# Privacy Policy — [Business Name] (AdPilot OS)

**Status:** DRAFT framework for legal review
**Effective date:** [Effective Date]
**Last updated:** [Effective Date]
**Document owner:** [Privacy Officer Contact]

This Privacy Policy explains how [Business Name] (ABN [ABN]) ("we", "us", "our")
handles personal information in connection with the AdPilot OS service ("the Service").
It is drafted to align with the *Privacy Act 1988* (Cth) ("the Privacy Act") and the
thirteen Australian Privacy Principles ("APPs") in Schedule 1 of that Act.

> **Drafting note (remove before publication):** Section numbers below are cross-referenced
> to the APP they primarily address. These references are an aid to the reviewing
> practitioner and should be removed or retained at their discretion.

---

## 1. Who we are and the scope of this policy *(APP 1 — open and transparent management)*

1.1 [Business Name] operates AdPilot OS, a **read-only** operating system for paid
advertising on platforms such as Meta and TikTok. The Service audits connected
advertising accounts, calculates a Campaign Health Score, and proposes safe,
numbers-first changes. The Service does **not** edit, pause, create, or spend on a live
advertisement without an explicit, separately-confirmed human instruction.

1.2 We are the entity responsible for the personal information described in this policy
and we determine the purposes for which, and the manner in which, it is handled.
[SOLICITOR: confirm the contracting legal entity, its registered structure
(e.g. Pty Ltd / sole trader / trust), and whether it meets the "APP entity" definition
and any small-business-operator carve-out under s 6D of the Privacy Act. If the
small-business exemption could apply, confirm whether we voluntarily opt in by treating
ourselves as bound (recommended for a SaaS handling third-party advertising data).]

1.3 **What this policy covers.** This policy applies to personal information we collect
through the Service, our website, our communications with you, and our dealings with
account holders, their authorised users, and individuals whose information is contained
in advertising and lead data accessed through the Service.

1.4 **What this policy does not cover.** This policy does not cover the privacy practices
of third parties whose platforms or websites you connect to or visit, including the
advertising platforms (such as Meta and TikTok) and the sub-processors listed in
section 5. Their handling of personal information is governed by their own privacy
policies.

1.5 **Account holders and "downstream" individuals.** Account holders are typically
businesses or advertising professionals who use the Service. Some information accessible
through the Service relates to **other individuals** (for example, people who interacted
with an advertising campaign). Where we handle that information, we do so as described in
this policy and, where relevant, on behalf of the account holder.
[SOLICITOR: confirm the controller/processor characterisation. Australian law does not
use the GDPR controller/processor distinction directly, but the practical question —
whether we collect lead-derived data on our own behalf or on behalf of the account holder
— affects which APP obligations bite and what the customer agreement must allocate. Align
this with the Terms of Service and any Data Processing Addendum.]

---

## 2. The information we collect and how we collect it *(APP 3 — collection; APP 5 — notification)*

2.1 We collect only the personal information reasonably necessary for the functions and
activities of the Service. The categories below describe what we collect and the usual
source of collection.

### 2.2 Account and authentication information
- Identity and contact details you provide when you register or are invited, such as
  name, email address, business name, and role.
- Authentication data managed through our identity provider (Supabase Auth), such as
  login credentials and session tokens.
- Organisation and team membership details used to apply tenant isolation and access
  controls.

*Source:* collected directly from you, or from the person who invited you to an
organisation.

### 2.3 Billing information
- Subscription tier, billing status, and transaction records.
- Payment processing is handled by **Stripe**. We do **not** store full payment card
  numbers on our systems. Card data is collected and held by Stripe under Stripe's own
  terms and security controls.

*Source:* collected directly from you and from Stripe (as our payment sub-processor).

### 2.4 Connected advertising-account access and read-only performance metrics
- When you connect an advertising account, we store an **access token** for that account.
  Access tokens are **encrypted at rest** and are **never sent to your browser**
  (see section 8).
- We collect **read-only advertising performance metrics** from the connected accounts —
  for example, spend, impressions, clicks, conversions, and account/campaign/ad structure
  and settings. This data is used to audit the account and calculate the Campaign Health
  Score.
- Advertising metrics are generally **business and statistical data** rather than personal
  information. However, some fields obtained from a platform may, alone or in combination,
  relate to an identifiable individual. Where that occurs, we treat the data as personal
  information.

*Source:* collected from the connected advertising platform via its official API, using
the authorisation you grant.

[SOLICITOR: confirm the exact scopes/fields pulled from each platform API and whether any
field can constitute personal information or **sensitive information** (APP 3.3) — for
example, audience or targeting attributes that reveal health, racial or ethnic origin,
sexual orientation, political opinions, or religious beliefs. If any sensitive information
is or could be collected, consent and additional handling rules apply and this policy must
address them expressly.]

### 2.5 Lead events (stored as a one-way hash)
- The Service may process **lead events** — records that an advertising lead occurred.
- Where a lead record would otherwise contain personal information identifying the lead
  (for example, an email address or phone number), that identifier is converted to a
  **one-way hash** before storage. We store the hash, not the underlying personal
  information.
- The hash is used for de-duplication, matching, and measurement. We do **not** store the
  recoverable lead PII, and the hash is not designed to be reversed by us.

*Source:* derived from lead data made available through the connected advertising account
or an integration you configure.

[SOLICITOR: confirm the hashing method and salting strategy and whether the resulting hash
is "de-identified" within the meaning of the Privacy Act (s 6 and OAIC guidance), or
whether it remains "personal information" because re-identification is reasonably possible
in the relevant context (e.g. a salted hash of an email may still be matchable). The
characterisation drives whether sections 3, 4 and 9 apply to the hash. State the
conclusion plainly in this policy once settled.]

### 2.6 Technical, usage, and support information
- Device, browser, and log information (such as IP address, timestamps, and pages or
  features accessed) collected automatically when you use the Service.
- Communications you send to us, including support requests and correspondence.

*Source:* collected automatically through your use of the Service, and directly from you.

### 2.7 Collection from third parties; unsolicited information
- Where it is unreasonable or impracticable to collect personal information only from the
  individual concerned, we may collect it from the connected platforms and our
  sub-processors as described above (APP 3.6).
- If we receive **unsolicited** personal information that we could not lawfully have
  collected, we will destroy or de-identify it as soon as practicable, where lawful to do
  so (APP 4).

### 2.8 Anonymity and pseudonymity *(APP 2)*
Because the Service requires an authenticated account and a connection to your advertising
accounts, dealing with us anonymously or under a pseudonym is generally not practicable
for the core Service. You may contact us with general enquiries without identifying
yourself, where practicable.

---

## 3. Why we collect, hold, use and disclose personal information *(APP 3, APP 6)*

3.1 We collect, hold, and use personal information for the following primary purposes:
- to create, authenticate, and administer accounts and organisations;
- to provide the Service — auditing connected advertising accounts, calculating the
  Campaign Health Score, generating reports, and proposing safe changes;
- to process subscriptions, billing, and payments (through Stripe);
- to provide support, respond to enquiries, and manage our relationship with you;
- to maintain security, prevent and investigate misuse, and protect our systems and users;
- to meet our legal, regulatory, and record-keeping obligations; and
- to improve the Service, including as described (with limits) in section 4.

3.2 **Use for a secondary purpose.** We will only use or disclose personal information for
a secondary purpose where an exception in APP 6 applies — for example, where you would
reasonably expect the secondary use and it is related to the primary purpose, where you
have consented, or where the use or disclosure is required or authorised by or under an
Australian law or a court/tribunal order.

3.3 We do not use the access tokens for connected advertising accounts for any purpose
other than performing the read-only functions of the Service that you authorise.

---

## 4. Data use and model training *(APP 6; relevant to APP 1 governance)*

4.1 **Our position.** We do **not** use **identifiable** customer content or lead PII to
train, fine-tune, or improve machine-learning or AI models.

4.2 Any use of customer data to develop, evaluate, or improve the Service or its models is
limited to data that is **de-identified or aggregated** so that individuals are not
reasonably identifiable, and is performed in a manner consistent with **tenant isolation**
(your organisation's data is logically separated from other organisations' data — see
section 8).

4.3 **Lead PII is excluded.** Identifiable lead personal information is never used for model
training or improvement. As described in section 2.5, recoverable lead identifiers are not
stored; only a one-way hash is held, and lead PII is excluded from any training or
improvement activity.

4.4 **AI processing through Anthropic.** The Service uses Anthropic's AI to generate
written analysis and recommendations. Where the Service sends content to Anthropic to
produce a response, that processing is governed by our agreement with Anthropic and by
section 5. [SOLICITOR: confirm the contractual position with Anthropic, in particular
(a) that customer inputs and outputs are **not used to train** Anthropic's models under
the applicable commercial/API terms, and (b) any data-retention period applied by the
provider. State the confirmed position here so the policy is accurate.]

4.5 **Opt-out.** You may opt out of having your **de-identified or aggregated** data used
for Service and model improvement. Opting out will **not** reduce or remove your access to
the core functionality of the Service. To opt out, contact us using the details in
section 14. [SOLICITOR: confirm the opt-out mechanism (self-service setting vs request),
how it is recorded, and the timeframe to give effect to it.]

4.6 We do not engage in any automated decision-making that produces legal or similarly
significant effects on an individual without human involvement. The Service **proposes**;
a human **approves**. [SOLICITOR: confirm this remains accurate as features evolve, and
review against any future Australian reforms addressing automated decision-making and
transparency.]

---

## 5. Disclosure and sub-processors *(APP 6; APP 8 — see also section 6)*

5.1 We do not sell personal information.

5.2 We disclose personal information to service providers ("sub-processors") who help us
operate the Service, and to others where required or authorised by law. We require our
sub-processors, by contract, to protect personal information and to use it only for the
purposes of providing their services to us. [SOLICITOR: confirm that each sub-processor
agreement contains adequate privacy, security, and (where relevant) cross-border
provisions, and that an up-to-date sub-processor register is maintained.]

5.3 **Our current sub-processors:**

| Sub-processor | Function | Information involved |
| --- | --- | --- |
| Supabase | Database, authentication, and hosting | Account, authentication, organisation, advertising-metric, hashed-lead, and usage data |
| Stripe | Payment processing and subscription billing | Billing and payment data (card data held by Stripe) |
| Resend | Transactional and notification email delivery | Email address and message content |
| Anthropic | AI generation of analysis and recommendations | Content submitted to produce a response (see section 4.4) |

[SOLICITOR: confirm this list is complete and current (including any analytics,
error-monitoring, logging, or infrastructure providers), and confirm each provider's
processing locations for section 6.]

5.4 We may also disclose personal information: to professional advisers; in connection
with a sale, merger, or restructure of our business (subject to appropriate protections);
and where required or authorised by or under an Australian law, or to a law-enforcement or
regulatory body as permitted under the APPs.

---

## 6. Overseas disclosure and Australian data-residency position *(APP 8; s 16C)*

6.1 Some of our sub-processors may store or process personal information **outside
Australia**. Before disclosing personal information to an overseas recipient, we take
reasonable steps to ensure the recipient does not breach the APPs in relation to that
information, as required by APP 8.

6.2 You should be aware that, under s 16C of the Privacy Act, in many cases we remain
accountable for an overseas recipient's handling of personal information as if we had done
the act ourselves.

6.3 **Data-residency position.**
[SOLICITOR: confirm and state plainly:
(a) the hosting region(s) for Supabase (e.g. whether an Australian/Sydney region is used)
and whether data is stored and processed in Australia;
(b) the processing locations for Stripe, Resend, and Anthropic;
(c) the list of countries to which personal information is likely to be disclosed, which
APP 5.1(i) requires us to specify (or to state that it is not practicable to specify them
and why);
(d) whether we rely on any APP 8.2 exception (e.g. informed consent to overseas disclosure)
or on contractual safeguards; and
(e) the final residency commitment to make to customers (e.g. "advertising and lead data
is stored in Australia").
This section must be completed with accurate region information before publication.]

---

## 7. Direct marketing and opt-out *(APP 7)*

7.1 We may use your contact details to send you Service-related communications (such as
security, billing, and operational notices). These are not marketing and are necessary to
provide the Service.

7.2 We may also send you marketing communications about the Service and related offerings
where permitted. Each marketing message will include a simple way to opt out
(unsubscribe), and we will give effect to opt-out requests promptly.

7.3 You can opt out of marketing at any time by using the unsubscribe link in a message or
by contacting us using the details in section 14. Opting out of marketing will not affect
your receipt of necessary Service communications.

7.4 We comply with the *Spam Act 2003* (Cth) for commercial electronic messages, including
consent, sender-identification, and functional-unsubscribe requirements. [SOLICITOR:
confirm the consent basis relied on for each marketing channel and that unsubscribe
handling meets the Spam Act's "functional unsubscribe" and timing requirements.]

---

## 8. Security of personal information *(APP 11)*

8.1 We take reasonable steps to protect personal information from misuse, interference,
and loss, and from unauthorised access, modification, or disclosure. Our measures include:
- **Encryption at rest** of advertising-account access tokens using **AES-256-GCM**;
  tokens are never transmitted to the browser.
- **Tenant isolation** enforced at the database layer using PostgreSQL **Row-Level
  Security (RLS)**, so an organisation can access only its own data.
- **Access controls** based on authenticated accounts, organisation membership, and roles.
- Encryption of data in transit, security controls applied by our infrastructure
  providers, and operational controls over secrets and credentials.

8.2 No method of transmission or storage is completely secure. While we work to protect
personal information, we cannot guarantee absolute security.

8.3 [SOLICITOR / SECURITY: confirm and, where appropriate, summarise additional controls
to state in the policy — for example, encryption-in-transit standard (e.g. TLS), key
management, logging and monitoring, backup and recovery, personnel access governance, and
secret-management practices — keeping the description accurate but not so detailed as to
create security risk.]

8.4 **Destruction or de-identification.** We take reasonable steps to destroy or
de-identify personal information when we no longer need it for any purpose for which it may
be used or disclosed and we are not required by law to retain it (see section 11).

---

## 9. Access, correction and erasure *(APP 12 — access; APP 13 — correction)*

9.1 **Access.** You may request access to the personal information we hold about you. We
will respond within a reasonable period and will provide access in the manner requested
where reasonable and practicable, subject to the exceptions in APP 12 (for example, where
access would unreasonably affect another person's privacy). If we refuse access, we will
give you written reasons and information about how to complain.

9.2 **Correction.** If personal information we hold is inaccurate, out of date, incomplete,
irrelevant, or misleading, you may ask us to correct it. We will take reasonable steps to
correct it consistently with APP 13, and we will respond within a reasonable period. If we
refuse to correct the information, we will give you written reasons and tell you how to
complain.

9.3 **Erasure.** You may request deletion of your data. The Service provides a
data-deletion (right-to-erasure) endpoint at **`/api/account/erase`**, and you may also
make an erasure request using the contact details in section 14.

9.4 **Scope and limits of erasure.** Where we act on an erasure request, we will delete or
de-identify the relevant personal information unless we are required or permitted to retain
it (for example, for legal, financial-record, tax, or fraud-prevention obligations — see
section 11). Because recoverable lead PII is not stored (only a one-way hash — see
section 2.5), there is no underlying lead identifier for us to return or delete.
[SOLICITOR: confirm exactly what `/api/account/erase` deletes versus de-identifies versus
retains (including backups, logs, hashed lead records, and data held by sub-processors),
the timeframe to complete erasure end-to-end, and how the policy should describe backup
expiry. Confirm whether the hashed lead record is in or out of scope of an erasure
request, consistent with its characterisation in section 2.5.]

9.5 We do not charge for making a request. We may charge a reasonable cost-based fee for
giving access in some cases, as permitted by APP 12.7–12.8; we will tell you about any fee
before we proceed. [SOLICITOR: confirm fee policy, identity-verification steps, and
standard response timeframes.]

---

## 10. Cookies and analytics

10.1 The Service uses cookies and similar technologies that are necessary to operate the
Service, including for authentication and session management.

10.2 [SOLICITOR / PRODUCT: confirm whether any **analytics**, performance, or
advertising/marketing cookies or pixels are used (first- or third-party). If so, list each
tool, its purpose, the personal information involved, the provider's location (for section
6), and the consent/opt-out mechanism. If only strictly-necessary cookies are used, state
that plainly. Confirm whether a cookie banner or consent tool is required for the relevant
audiences and jurisdictions.]

10.3 You can usually control cookies through your browser settings. Disabling necessary
cookies may prevent parts of the Service from working.

---

## 11. Retention of personal information *(APP 11.2)*

11.1 We keep personal information only for as long as it is needed for the purposes set out
in this policy, or for as long as we are required to keep it by law.

11.2 Indicative retention periods:
- **Account and organisation data:** retained while the account is active and for a
  reasonable period after closure, then deleted or de-identified.
- **Billing records:** retained as required for taxation and financial-records purposes.
- **Read-only advertising metrics:** retained while the connected account is active and
  needed for auditing and reporting, then deleted or de-identified.
- **Hashed lead events:** retained for the period needed for de-duplication and
  measurement.
- **Logs and technical data:** retained for security and operational purposes for a
  limited period.

[SOLICITOR: confirm concrete retention periods for each category (including the minimum
financial-records retention under Australian law, commonly five years; backup retention;
and log retention), and confirm these align with the deletion/de-identification behaviour
of `/api/account/erase` described in section 9.]

---

## 12. Data breach response and the Notifiable Data Breaches scheme *(Part IIIC, Privacy Act)*

12.1 We maintain a data-breach response process. If we suspect a data breach, we will
assess it promptly and contain it where possible.

12.2 We comply with the **Notifiable Data Breaches (NDB) scheme** under Part IIIC of the
Privacy Act. Where a breach is likely to result in **serious harm** to an individual and we
are unable to prevent that likely harm through remedial action, we will notify the affected
individuals and the **Office of the Australian Information Commissioner (OAIC)** as required
by law.

12.3 We aim to assess a suspected eligible data breach within **30 days** of becoming aware
of it, consistent with the statutory assessment period, and to notify as soon as
practicable where notification is required.

12.4 [SOLICITOR: confirm the internal breach-response plan, decision-makers, assessment and
notification timeframes, the content of notifications, and whether any sub-processor
contracts require the provider to notify us within a set period so we can meet our NDB
obligations.]

---

## 13. Complaints and escalation to the OAIC *(APP 1.3; Privacy Act complaints process)*

13.1 If you have a privacy complaint, please contact us first using the details in section
14. We will acknowledge your complaint and aim to resolve it within a reasonable period.
[SOLICITOR: confirm acknowledgement and resolution timeframes to commit to.]

13.2 If you are not satisfied with our response, you may complain to the **Office of the
Australian Information Commissioner (OAIC)**:
- Website: www.oaic.gov.au
- Phone: 1300 363 992
- Post: GPO Box 5288, Sydney NSW 2001

[SOLICITOR: confirm current OAIC contact details at the time of publication.]

---

## 14. How to contact us

14.1 For privacy enquiries, requests, or complaints, contact our Privacy Officer:
- **Attention:** [Privacy Officer Contact]
- **Business:** [Business Name] (ABN [ABN])
- **Location:** [State/Territory], Australia
- **Email:** [Privacy Officer Contact]

[SOLICITOR: insert a dedicated business privacy contact channel (e.g. a role-based mailbox
such as privacy@[domain]) and a postal address. Do not use a personal email address.]

---

## 15. Changes to this policy

15.1 We may update this policy from time to time to reflect changes in our practices, the
Service, or the law. The current version will be available on our website, and the
"Last updated" date at the top will indicate when it was last changed.

15.2 Where changes are significant, we will take reasonable steps to notify you — for
example, by a notice within the Service or by email. Your continued use of the Service
after a change takes effect indicates your acknowledgement of the updated policy, to the
extent permitted by law.

[SOLICITOR: confirm the notification method for material changes and whether any change
requires fresh consent rather than mere notice.]

---

> **End of DRAFT.** This document is an AI-prepared framework only and is **not legal
> advice**. It must be reviewed, completed (all `[SOLICITOR: …]` and bracketed
> placeholders resolved), and approved by an admitted Australian legal practitioner before
> any use or reliance. Not binding.
