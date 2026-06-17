# AdPilot OS — Legal Framework: Status & Consolidated Sign-off

> **DRAFT — NOT LEGAL ADVICE.** Prepared by an AI legal-drafting team (two drafters + two
> senior-partner reviewers) as an initial framework to accelerate, not replace, an admitted
> Australian legal practitioner. Nothing here is binding until a qualified practitioner reviews,
> completes and approves it. AI "partners" are reviewers, not admitted counsel.

## Documents in this set
| File | What it is |
|---|---|
| `TERMS-OF-SERVICE-DRAFT.md` | DRAFT Terms (17 clauses; ACL paramountcy, read-only model, data-use/training, AUD/GST). |
| `PRIVACY-POLICY-DRAFT.md` | DRAFT Privacy Policy (15 APP-aligned sections; NDB, sub-processors, erasure). |
| `PARTNER-REVIEW-A-TERMS.md` | Senior partner A (commercial/consumer) review of the Terms. |
| `PARTNER-REVIEW-B-PRIVACY.md` | Senior partner B (privacy/data) review of the Privacy Policy. |

## Loop outcome (review round 1)
- **Terms — Partner A: _Approved as a DRAFT framework, subject to conditions_** + admitted-practitioner sign-off.
- **Privacy — Partner B: _Not yet approvable_** — 5 blocking issues, several fact-dependent.

The loop is intentionally **paused here**, because the remaining blockers are not things further AI
iteration can close — they need real-world facts and engaged counsel (see "Who must resolve").

## The #1 cross-cutting issue (read this first)
**The salted one-way lead hash is most likely still "personal information"** (a hash of a low-entropy
identifier such as an email/phone is a re-identifiable persistent key, not de-identification). Both the
Terms (cl 9) and Privacy (§4/§9) — **and the live marketing `/terms` and `/privacy` §7 placeholder
clauses** — currently lean on "hashing ⇒ de-identified/excluded". That framing must be re-cast
**together** to either:
- **(A) Treat hashed lead data as personal information** (conservative; safest default), or
- **(B) Substantiate genuine de-identification** (e.g. HMAC with a KMS-held secret key + a documented
  re-identification-risk assessment) before claiming it.

Until resolved, the Terms/Privacy/§7 wording risks an APP breach + s 18 ACL misleading-conduct exposure.

## Consolidated must-fix list
**Terms (Partner A blocking):** B1 Unfair-Contract-Terms re-engineering (indemnity → third-party only;
≥30-day variation notice; fix Free-Tier $0 cap); B2 advice-perimeter carve-outs (TASA 2009 / Corporations
Act) — disclaimer alone doesn't keep conduct outside the perimeter; B3 verify the data-use/training factual
claims before asserting; B4 populate Meta/TikTok pass-through terms; B5 build auto-renewal disclosure conduct.

**Privacy (Partner B blocking):** B1 lead-hash characterisation (above); B2 add the APP 8 country list +
don't ship the "stored in Australia" promise until verified end-to-end; B3 contractually confirm the
Anthropic no-training/retention position before promising it; B4 APP 6 secondary-use — opt-out is not
consent for *identifiable* data (limit to de-identified or obtain opt-in); B5 define whether any platform
field is APP 3.3 sensitive information and add consent if so.

## Who must resolve what
- **Engineering / owner (facts):** lead-hash design + re-identification assessment; sub-processor hosting
  regions + data-residency reality; Anthropic contractual no-training confirmation; exact erasure scope
  (backups/logs/sub-processors); whether sensitive targeting fields are ingested.
- **Owner (decisions):** confirm contracting entity + ABN + governing-law state; AUD prices/free-trial;
  consumer-vs-business positioning; whether to adopt conservative option (A) for the hash.
- **Admitted AU legal practitioner (sign-off):** UCT clause drafting, current ACL prescribed wording,
  TASA/Corporations carve-outs, final binding text. The drafts + both partner reviews are the brief.

_Status: DRAFT framework, Terms conditionally approved / Privacy pending blocker resolution. Not for
reliance until an admitted practitioner signs off._
