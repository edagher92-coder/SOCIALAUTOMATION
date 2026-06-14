---
name: qa-system-tester
description: Tests the AdPilot OS prompts, metric calculations, agent routing, workflow templates, and automation flows for correctness, repeatability, usability, and commercial readiness — producing a structured pass/fail report with specific fixes. Use this skill when someone asks to "test the system", "QA this workflow", "check if the calculations are right", "validate the onboarding flow", "is this ready to sell?", or "run a quality check before launch".
---

## Purpose
Catch errors, inconsistencies, and gaps in the AdPilot OS system before they reach paying clients. This skill runs structured QA passes across prompts, calculations, routing logic, templates, automation blueprints, and the full end-to-end workflow — then outputs a plain-English pass/fail report with prioritised fixes. It is the final gate before any tier is released or sold.

## When to use
Run this skill before any new skill, agent, template, automation flow, or product tier goes live with clients.

Example user phrases:
- "QA the client-report-generator skill before we launch it"
- "Check the metric calculations — I think CPL formula might be wrong"
- "Test the full onboarding-to-report workflow end-to-end"
- "Is the V1 Starter tier ready to sell? Run a readiness check"
- "Validate the Make automation blueprint — does the logic hold?"
- "Find all the gaps before this goes to my first agency client"

## Inputs needed
- What to test: specific skill / agent / workflow / automation / full system / product tier (required)
- Test scope: calculation check / routing check / template check / usability check / end-to-end / commercial readiness (required)
- Sample data set for calculation tests: impressions, clicks, spend, leads, revenue (required for calculation QA)
- Known expected outputs (if available — used to verify correctness against a baseline)
- Product tier being tested: V1 / V2 / V3 (affects which features are in scope)
- {{client.currency}}, {{client.gross_margin}}, {{client.average_sale_value}} — for break-even calculation checks

## Workflow
1. Confirm what is being tested and at what scope; list all items in the test plan.
2. Run Calculation Accuracy tests:
   - Feed the sample data through every metric formula.
   - Verify: CTR, CPC, CPM, CPL, CPA, ROAS, break-even CPA, break-even ROAS.
   - Check edge cases: zero clicks (division by zero handling), zero revenue, zero leads.
   - Mark each formula PASS or FAIL with the expected vs. actual result.
3. Run Routing Logic tests:
   - Simulate user inputs that should trigger each agent and skill.
   - Verify the correct agent/skill is selected for each trigger phrase.
   - Test ambiguous inputs — does the system ask for clarification or route incorrectly?
   - Mark each routing path PASS or FAIL.
4. Run Template Completeness tests:
   - Check each template for required {{client.*}} variable placeholders.
   - Confirm no hardcoded private data (account IDs, real names, real figures).
   - Verify all section headings and required fields are present.
   - Mark each template PASS or FAIL.
5. Run Workflow Integrity tests:
   - Trace each numbered workflow step for logical sequence.
   - Check for missing steps, circular dependencies, or dead ends.
   - Verify safety rules are applied at the correct step (not after a risky action).
   - Mark each workflow PASS or FAIL.
6. Run Safety Rule compliance tests:
   - Confirm live_edit_block: true is respected — no live ad changes.
   - Confirm use_paused_duplicates_only: true is enforced where applicable.
   - Confirm no money moves without human "YES".
   - Confirm no keys/tokens/IDs in any output.
   - Mark PASS or FAIL.
7. Run Usability tests:
   - Read each skill's "When to use" and "Example commands" — are they clear enough for a non-technical user?
   - Check if inputs needed are realistic for the target customer.
   - Rate clarity: Clear / Needs Work / Confusing.
8. Run Commercial Readiness check (for product tier launches):
   - Does each tier's scope match what productisation-roadmap-builder defined?
   - Are support docs complete enough for a client to self-serve?
   - Is pricing rationale documented?
   - Mark: Ready / Needs Work / Not Ready.
9. Compile all results into a structured report: overall status, pass rate, priority fix list.
10. Prioritise fixes: P1 (blocks launch) / P2 (fix before client use) / P3 (nice to have).

## Outputs
- Full QA test report: pass/fail per test item with expected vs. actual
- Calculation accuracy table (all metrics with edge case results)
- Routing logic map with pass/fail per path
- Safety compliance summary
- Usability ratings per skill
- Commercial readiness verdict per product tier
- Prioritised fix list: P1 / P2 / P3 with specific remediation steps
- Overall system status: Ready / Conditional Go / Not Ready

## Safety rules
- QA testing is a read-only activity — no test should modify live campaigns, send reports, or trigger real automations.
- If a P1 bug is found that would cause a live money movement error, halt and flag to the human operator immediately before continuing.
- Never mark a product tier as "Ready" if a P1 or P2 safety rule failure is present.
- live_edit_block: true — this skill reads and tests; it does not push changes.
- Document all known issues in the fix list even if they seem minor — a client will find them.

## Example commands
- "Run a full QA pass on the client-report-generator skill"
- "Test all metric calculations against this sample data: [paste data]"
- "Check the V1 Starter tier for commercial readiness — is it ready to sell?"
- "QA the Make automation blueprint for the weekly reporting flow"
- "Find every place a hardcoded value appears in the templates"
- "Test that the routing logic sends 'pause this ad' to the right agent"

## Related agents
- quinn-qa-testing-agent (primary driver of this skill)
- piper-productisation-saas-agent (provides the commercial readiness criteria)
- dana-ads-data-analyst (provides baseline calculations for comparison)
- start-ads-command-centre (receives the QA report and gates any launch on the result)
- paige-ads-policy-safety-agent (cross-checks policy compliance findings)

## Handoff rules
- Run this skill before any product tier launch or client onboarding begins.
- P1 fixes must be resolved and re-tested before handoff to any client-facing workflow.
- P2 fixes should be resolved within the same sprint; document as known issues if deferred.
- QA reports are filed in /docs/qa-reports/ with date stamp after each test run.
- After a Clean pass, hand the launch-ready verdict to piper-productisation-saas-agent and the human operator to proceed.
