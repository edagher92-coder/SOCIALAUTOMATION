> **DRAFT FOR OWNER DECISION — analysis prepared by an AI working group; the legal portions are NOT legal advice and require an admitted Australian legal practitioner's review.**

# AdPilot OS — Live-Write Decision Memo

**To:** Owner
**From:** Cross-functional working group (Product · Risk/Compliance · Cyber-security · Legal review — two senior reviewers)
**Date:** 17 June 2026
**Status:** Draft for decision. No code or config changed by this memo. `ADS_WRITE_ENABLED` remains off by default.
**Decision requested:** Should AdPilot ever enable the dormant guarded live-write path so it can apply changes (pause/resume an ad, adjust a budget) *after* a human types YES — and if so, under what conditions?

---

## 1. Summary & recommendation

**Recommendation: keep live-write OFF for launch, and treat it as a deliberately phased, opt-in, Expert-only capability that we may switch on later — not a launch feature.** The dormant path is already engineered conservatively (four independent gates, reversible-only actions, prior-state capture, a ≤20% budget clamp, Meta-only with TikTok deliberately throwing). The case *for* enabling it is real — closing the loop from "we found the problem" to "we fixed it" is what most competitors monetise, and friction loses users between insight and action. But the case *against* is stronger at this stage: the financial loss from a mistaken automated change lands on the user, the liability and trust exposure is asymmetric (one bad write can erase the credibility that "we never touch your ads" buys us), and Meta App Review for write scopes is a non-trivial, unverified gate. Our recommended posture is to **build and harden the guardrail *validators* now (off-path), market read-only as a feature, and only flip the switch via a staged, per-org opt-in beta once the legal, platform-permission, and audit requirements in §8 are all satisfied.** This is a reversible decision in one direction (we can always turn it on later) and an expensive one to walk back in the other (turning it off after a public incident is reputationally costly), which argues for patience.

---

## 2. The current safety model (what exists today)

AdPilot OS is **read-only by design**, and the architecture enforces "propose; the human approves" in code, not just in copy:

- **The engine never acts.** `lib/engine/decisions.ts` returns `Decision` objects whose verdicts (`keep / kill / reduce / refresh / scale / fix-tracking / insufficient-data`) are *recommendations with prose proposals*. Every path constructs its result through one helper, `out(...)`, which hard-codes `safe: true`. The type (`lib/engine/types.ts`) declares `safe: true` as a literal, and a dedicated test (`decisions.safety.test.ts`) asserts `decide(...).safe === true` across a spread of fixtures. There is no branch that can return an unsafe verdict.
- **Proposals are reversible-by-construction.** Even the most aggressive verdicts propose reversible moves: `kill` proposes *pause* (explicitly "reversible"), `scale` proposes a *≤20% budget increase that needs a typed YES*, `refresh` builds *paused duplicates* and leaves the original untouched. The engine never proposes a destructive, non-reversible operation.
- **The live-write path is dormant and quadruple-gated.** `lib/actions/execute.ts` is the only code that can mutate a live ad, and it is protected by four independent gates, any one of which blocks a write:
  1. **`ADS_WRITE_ENABLED` env kill-switch** — off by default; `executeAction()` throws `WriteDisabledError` immediately if it is not `"1"`. This is a server-side switch, not a per-user toggle.
  2. **Write-scope token must exist** — the call uses an `ads_management` token; without it the platform itself rejects the write.
  3. **API layer requires a typed-YES + Expert entitlement** — the UI/route layer demands the exact typed confirmation and `can(plan, "ad_write")` before `executeAction` is ever reached.
  4. **Reversibility is built in** — `captureState()` snapshots `status / daily_budget / lifetime_budget / name` *before* the write, and `revertAction()` can restore it. Only `pause / resume / set_budget` are supported; **TikTok writes intentionally throw** rather than ship a half-correct writer.
- **The console states the posture plainly.** `components/ActionsConsole.tsx` shows execution as **OFF** by default and explains that turning it on requires `ADS_WRITE_ENABLED=1` *and* a write-scope account that needs Meta App Review; staged actions "won't fire."

Net: today the product *cannot* touch a live ad. The dormant path is a careful skeleton, not an active feature.

---

## 3. The case FOR enabling (user value, competitiveness, friction reduction)

1. **Close the loop.** The highest-value moment in the product is the instant a user reads "this ad is losing money, pause it." Forcing them to leave AdPilot, log into Ads Manager, find the ad, and replicate the change introduces friction, delay, and transcription errors. A guarded "Apply (type YES)" button captures the value at the moment of conviction.
2. **Competitive parity / differentiation.** The competitive teardown notes that Madgicx, Revealbot et al. monetise "do it for me" automation. AdPilot's framing — *every action is a proposal with one-tap, typed-YES approval* — turns their biggest liability (autopilot wrecking accounts) into our differentiator: human-in-the-loop execution rather than unattended autopilot.
3. **Speed where time matters.** Pausing a runaway loser or nudging budget on a confirmed winner is time-sensitive; minutes of delay cost real AUD. A guarded one-click pause is materially faster than a context switch.
4. **Stickiness and willingness-to-pay.** Execution is a credible Expert-tier feature that justifies the top price and increases switching cost — users who run their workflow inside AdPilot are less likely to churn.
5. **We've already de-risked the hard part.** Reversible-only actions, prior-state capture, the ≤20% clamp, and Meta-only scope mean the engineering posture is conservative *by design*. Much of the safety work is done; the remaining work is governance, permissions, and rollout.

---

## 4. The case AGAINST (financial risk, liability, trust/brand, support burden)

1. **The user's money is on the line, not ours.** A wrong pause stops a profitable ad; a wrong budget change overspends. Even with a ≤20% clamp and reversibility, a change applied at the wrong moment can cost real AUD before it is noticed and reverted. The downside is borne by the customer and attributed to our software.
2. **Liability asymmetry.** When *we* make a change, even one the user confirmed, the causal story shifts from "the user managed their account" to "the tool changed my account." That invites disputes, chargebacks, and — see §6 — Australian Consumer Law exposure that a pure advisory tool largely avoids.
3. **Trust and brand.** "We never touch your ads" is a clean, defensible promise and a genuine selling point against autopilot tools. The first viral "AdPilot paused my best campaign" post costs more trust than a year of correct writes earns. Trust is asymmetric: slow to build, fast to lose.
4. **Support burden.** Every live write is a potential support ticket ("why did it change?", "change it back", "I didn't mean that"). Disputes over money are the most expensive, highest-emotion tickets to handle and the hardest to close cleanly.
5. **The read-only promise is itself a moat.** Read-only means a smaller attack surface, a simpler security story, simpler insurance/underwriting, and an easier sales/compliance conversation with cautious buyers (agencies, larger advertisers). Enabling writes erodes all of these at once.
6. **Platform risk.** Write scopes mean App Review, stricter terms, and policy obligations (see §5). A policy or rate-limit misstep can put the *entire app's* platform access at risk — including the read-only product that 100% of users rely on.

---

## 5. Platform-policy considerations (Meta Marketing API & TikTok Business API)

> Treat this section as a checklist to confirm with the platforms' current developer terms before any go-live. Items we cannot verify from inside this repo are marked **[VERIFY]**.

**Meta Marketing API**
- **Permissions / scopes.** Reads use `ads_read` / `read_insights`; writes require **`ads_management`** (already the scope the executor assumes). Granting `ads_management` to anyone but the developer's own assets requires **App Review** / Advanced Access. **[VERIFY]** current Advanced Access requirements, Business Verification, and any standard-vs-advanced-access limits for `ads_management`.
- **App Review for write capability.** A reviewer typically must be able to reproduce the write flow; our typed-YES gate must be demonstrable in review. **[VERIFY]** whether Meta requires specific screencast/use-case justification for programmatic budget/status changes.
- **Rate limits.** Marketing API enforces per-app and per-ad-account rate limiting (and ads-management write throttling). Our executor does not currently implement a client-side write rate ceiling. **[VERIFY]** exact current limits (BUC / ads-management tiers) and design a conservative client-side ceiling well under them.
- **Automated-action / quality rules.** Meta has rules against low-quality automation and may scrutinise tools that programmatically change accounts. **[VERIFY]** current Platform Terms / Developer Policies clauses on automation, and whether human-in-the-loop typed-YES is sufficient to stay clearly inside them.
- **Token type.** A non-expiring **System User** token (per CLAUDE.md "owner-only" item) is the likely production credential; ensure the write-scope variant is governed separately from read-only tokens (see §7).

**TikTok Business / Marketing API**
- **Writes are intentionally not wired** — `executeAction` throws for non-Meta platforms. So TikTok live-write is out of scope until separately designed and reviewed.
- **[VERIFY]** TikTok Business API scopes for ad/campaign status and budget changes, its app-audit/approval process, its rate limits, and its automation/terms posture before any TikTok write work begins.

**General**
- Any write feature should fail *closed* on rate-limit or auth errors (defer, never silently retry-storm), consistent with the existing read-side "rate-limit hits → defer" posture.
- **[VERIFY]** that our Terms permit acting as an agent making changes on the user's behalf under both platforms' terms, and that the user's own platform Business Manager permissions are sufficient for the token to perform the write.

---

## 6. Legal & liability angle (Australia)

> **Not legal advice.** The following is the working group's risk framing and must be reviewed and settled by an admitted Australian legal practitioner before any live-write go-live.

- **Australian Consumer Law (ACL) — non-excludable guarantees.** Services supplied to consumers carry non-excludable guarantees, including that they be rendered with **due care and skill** and be reasonably fit for purpose. **A disclaimer cannot contract out of these guarantees.** If an automated change is made without due care and causes loss, a "we're not liable for anything" clause will not, on its face, defeat an ACL claim. **[VERIFY scope]** whether business customers above the relevant threshold are "consumers" for these purposes and how liability may be limited (e.g. to re-supply) for non-consumer / B2B supply — solicitor to confirm.
- **Misleading or deceptive conduct (ACL s18).** Marketing must not over-promise the safety or reliability of the feature. Phrases like "safe," "guaranteed reversible," or "we'll never lose your money" are hazardous; the clamp and reversibility reduce risk but **do not eliminate** it (a reverted change still incurs real spend during the window). Anti-hype, numbers-first copy is both our house style and the safer legal posture.
- **Who bears the loss if an automated change loses money?** This is the central legal question. Options the solicitor should weigh:
  - *User bears it* (positioned as the user's own decision, executed by their typed consent) — strongest if the typed-YES + audit log genuinely evidence informed, specific consent for *that* action.
  - *Shared / capped* (liability capped to fees or re-supply, subject to ACL non-excludable guarantees).
  - The reality is likely **mixed**: the typed-YES + audit log shift the narrative toward user agency, but the ACL due-care guarantee means we retain residual exposure if the *recommendation or execution* was negligent (e.g. a clamp bug, a stale snapshot, acting on broken-tracking data).
- **Role of typed-YES consent + audit log.** These are our two strongest controls. To carry legal weight they should: (a) show the *specific* change (entity, current value → proposed value, platform) at the moment of confirmation; (b) require typing an exact confirmation (not a checkbox); (c) record *who/when/what/prior-state/result* in an **immutable, tamper-evident** log; and (d) be exportable as evidence. The current `captureState` snapshot is the backbone of both reversibility and the audit trail.
- **Disclaimers.** Useful but bounded: clear, prominent, plain-English disclaimers ("AdPilot executes only the change you confirm; you remain responsible for your account; advertising outcomes are not guaranteed; nothing here is financial advice") are worthwhile **as long as they are framed as subject to the non-excludable ACL guarantees** and do not purport to exclude them. Solicitor to draft.
- **Engagement of professional-advice boundaries.** AdPilot must continue to avoid financial/legal/tax advice. Executing a budget change must be framed as *carrying out the user's instruction*, not as advice the user relied on us to be correct.

---

## 7. Cyber-security angle

- **Token-scope escalation.** Read-only tokens (`ads_read` / `read_insights`) cannot change anything; an `ads_management` write token can pause, resume, and reallocate spend. Introducing write scopes is a **material expansion of blast radius** for every credential we hold. Write tokens must be: stored separately from read tokens, scoped to the minimum entities/actions, rotated, and *never* loaded on read-only paths.
- **Blast radius.** Today a token compromise leaks data (serious, but bounded). With write scope, a compromise could **pause winners and reallocate budgets across every connected Expert org** — a destructive, money-moving event, not just a confidentiality breach. The `ADS_WRITE_ENABLED` env switch being off means the *application code* won't write even if a write token leaks, but a stolen token used directly against the platform API is outside that protection — hence minimum-scope tokens and platform-side rate/permission limits matter.
- **Abuse / compromise scenarios to design against:**
  - Stolen write token used directly against the Graph API (mitigation: short-lived/rotated tokens, IP allowlisting if supported, platform rate ceilings, anomaly alerting on write volume).
  - Compromised AdPilot session / account takeover triggering bulk "apply" (mitigation: per-action typed-YES that cannot be scripted/batched, step-up auth for Expert write, cooldowns, daily action caps).
  - Confused-deputy / SSRF / injected-action via a poisoned proposal (mitigation: server-side re-validation of every action against the clamp and allowlist; never trust client-supplied action params).
  - Insider / supply-chain change to the clamp or kill-switch (mitigation: code-owner review on `lib/actions/*`, signed releases, tests asserting the clamp and gates).
- **Kill-switch.** Two layers: (1) the existing global env kill-switch (`ADS_WRITE_ENABLED=0`) that disables *all* writes app-wide instantly; (2) a per-org "pause execution" control. A **one-click global kill-switch** that an operator can hit without a deploy is a hard requirement for go-live, plus an automated tripwire (e.g. write error-rate or volume threshold) that flips it.
- **Audit/observability.** Every write and revert must emit an immutable log entry and a metric; alert on write spikes, repeated failures, and reverts.

---

## 8. Recommended phased approach with hard guardrails

**Phase 0 — Launch (now): OFF, and marketed as OFF.**
- Keep `ADS_WRITE_ENABLED` off. Ship read-only. Market "we never touch your ads / propose, you approve" as a *feature*.
- Build and unit-test the guardrail **validators** off-path (clamp, allowlist, cooldown, caps, min-data gate) so they exist and are tested without being reachable. Do not wire any new live-write call.

**Phase 1 — Foundations (no live writes yet):**
- Solicitor-drafted Terms/consent text, disclaimers, and liability position (§6) finalised.
- Immutable, tamper-evident audit log designed and shipped.
- Meta App Review for `ads_management` obtained; client-side write rate ceiling implemented; **[VERIFY]** items in §5 closed.
- Security review of token separation, kill-switch, and abuse scenarios (§7) signed off.

**Phase 2 — Closed beta (live writes, tightly fenced), only on explicit owner green-light:**
- **Opt-in per org** (off until an Expert org explicitly enables it), **Expert-tier only**.
- **Per-action typed-YES** showing entity, current → proposed value, and platform; no batch/auto-apply.
- **Reversible-only actions** (`pause / resume / set_budget`); prior state captured before every write; one-click revert.
- **Budget deltas clamped to ≤20%** (already the engine's `scale` posture), with an absolute **spend cap** and a **daily action cap** per org.
- **Min-data + clean-tracking gate** — never execute on `insufficient-data`, `fix-tracking`, or broken-tracking rows.
- **Cooldown** between changes on the same entity (prevents thrash; **[VERIFY]** a sensible default, e.g. 24–72h).
- **Do-not-touch allowlist/denylist** (user can mark campaigns off-limits).
- **Full immutable audit log** of who/when/what/prior-state/result; exportable.
- **One-click global kill-switch** + automated tripwire on write error-rate/volume.
- **Clear disclaimers** at the point of action, subject to ACL guarantees.
- **Staged rollout:** small invited cohort, monitored, with a published rollback plan.

**Phase 3 — General availability (Expert, opt-in) only after beta exit criteria met:**
- Exit criteria (illustrative; owner to set): zero unexplained writes, revert path proven in production, support-ticket rate within budget, no policy strikes, security sign-off renewed. TikTok writes remain out of scope until separately designed and reviewed.

**Invariants that must never regress, even at GA:** `decide().safe === true`; the engine never *itself* executes; every write requires the full gate stack (env + write-scope token + Expert + per-action typed-YES); reversible-only; clamp/caps enforced **server-side**; immutable audit log; global kill-switch; resale-clean and RLS invariants intact.

---

## 9. Open questions for the owner to decide

1. **Go / no-go for launch:** confirm live-write stays OFF for launch and is *not* a launch feature. (Recommended: yes.)
2. **Appetite for Phase 2 at all:** do we ever intend to enable writes, or is "never touch your ads" a permanent positioning? (This drives whether we even build Phase 1 foundations.)
3. **Liability stance:** which option in §6 do we instruct the solicitor to pursue (user-bears / capped / shared), and what liability cap (if any) for B2B supply, subject to ACL?
4. **Platform investment:** are we prepared to pursue Meta App Review for `ads_management` and the ongoing compliance burden it implies?
5. **Action scope at GA:** restrict to `pause/resume` only (most clearly reversible), or also `set_budget` within the ≤20% clamp?
6. **Guardrail numbers:** confirm the clamp (≤20%), spend cap, daily action cap, cooldown window, and min-data thresholds.
7. **Beta cohort & kill criteria:** who's in the closed beta, and what tripwire/incident automatically flips the global kill-switch and pauses the programme?
8. **Insurance / underwriting:** do we need professional indemnity / tech E&O cover sized for money-moving actions before go-live?
9. **TikTok:** confirm TikTok writes stay out of scope indefinitely until separately greenlit.

---

*Prepared as a balanced draft for owner decision. No code or configuration was changed in producing this memo. Legal sections require review by an admitted Australian legal practitioner; platform-policy items marked **[VERIFY]** require confirmation against the current Meta and TikTok developer terms.*
