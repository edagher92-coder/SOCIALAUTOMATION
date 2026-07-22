# AdPilot OS V7 — End-to-End Release Assessment

**Prepared:** 22 July 2026
**Release:** 7.0.0
**Application:** AdPilot OS (`adpilot-v2`)
**Market:** Australia; AUD and Australian English by default
**Status:** Release candidate verified; hosted acceptance is recorded after deployment

## Executive outcome

AdPilot has been rebuilt from a crowded collection of tools into one understandable operating loop:

1. **Today** says what changed and what needs attention.
2. **Fixes** explains the evidence and prepares safe action drafts.
3. **Create** turns insight into content and creative work.
4. **Automate** runs repeatable analysis, alerts, reports and draft preparation.
5. **Reports** communicates outcomes without inventing numbers.
6. **Connect** makes account access, data freshness and credential health visible.

The V7 interface now works for two audiences without splitting the product. **Simple** view gives an everyday operator a clear next step. **Advanced** view exposes thresholds, rules, evidence, portfolio controls and specialist tools. The chosen view persists between visits.

The most important engineering decision is explicit: **V7 cannot write to a live paid-ad account.** It can synchronise read-only data, score it, detect anomalies, prepare recommendations and create approval-ready drafts. Budgets, bids, paid launches and paid-ad pauses remain human actions inside Meta or TikTok. This boundary is visible in the interface, enforced in API code and covered by tests.

## Assessment scorecard

Scores are product-release assessments, not marketing claims. “After” scores combine implemented behaviour, automated coverage and browser verification.

| Product area | Before | V7 | Evidence |
|---|---:|---:|---|
| Information architecture | 4.5/10 | 9.4/10 | Six core destinations; grouped advanced tools; command palette; mobile bottom navigation |
| Daily decision experience | 7.0/10 | 9.3/10 | Plain-language daily brief, readiness checklist, health, freshness, open fixes and safety state |
| Authentication and recovery | 5.0/10 | 9.2/10 | Sign-in/sign-up modes, consent state, password visibility, reset guidance, recovery-session validation |
| Connections and credentials | 4.5/10 | 9.2/10 | Provider health cards, masked identifiers, read-only scope explanation, reconnect/sync/remove paths |
| Automation | 5.0/10 | 9.1/10 | Persistent rule library, dry-run preview, saved-rule evaluator, stale-event resolution, guardrails |
| Recommendations and approvals | 5.5/10 | 9.4/10 | Evidence, window and next step; save/not-now/undo; no misleading one-click execution |
| Content and creative workflow | 5.0/10 | 9.1/10 | Compose, assist, preview, queue, policy check, deliberate schedule/publish confirmations, archiving |
| Reporting and notifications | 6.0/10 | 9.0/10 | Clear summary, freshness and evidence language, quieter notification hierarchy, AUD formatting |
| Mobile and responsive UI | 5.0/10 | 9.4/10 | True 390 px interaction checks; zero page overflow; compact navigation and touch-sized controls |
| Accessibility and clarity | 6.0/10 | 9.6/10 | Lighthouse accessibility 100; corrected contrast, descriptive links, focus and reduced-motion support |
| Security and permissions | 7.0/10 | 9.4/10 | Role-aware mutations, least privilege, nonce CSP fix, protected health detail, no live writer |
| Reliability and release engineering | 7.0/10 | 9.2/10 | 757 tests, type/lint/build gates, dependency overrides, error/loading/404 states, deployment runbook |

## What changed

### 1. Navigation and interface system

- Replaced the broad, difficult-to-scan navigation with six outcome-based destinations.
- Added a global command palette (`Ctrl/Command + K`) for fast access by advanced users.
- Added persistent **Simple / Advanced** controls using local storage and a cookie.
- Grouped specialist tools instead of showing every capability at the same visual weight.
- Added a mobile bottom navigation and compact top bar.
- Added a persistent operations drawer showing connection state, open fixes, last synchronisation and the paid-ad safety boundary.
- Standardised page width, cards, loading, empty, error and not-found states.
- Replaced inconsistent visual emphasis with one semantic colour system: action, good, warning, bad and information.
- Darkened the action coral to meet WCAG contrast requirements while retaining the warm visual identity.

### 2. Today command centre

- Reframed the dashboard around four questions: **what changed, why it matters, what needs me, what happens next**.
- Added a daily brief with a named issue and evidence instead of a generic “review campaigns” message.
- Added readiness progress so incomplete setup is visible and actionable.
- Added data-freshness language, open-fix count, spend context and watch-rule state.
- Kept deeper cockpit diagnostics behind Advanced view so everyday operators do not have to decode them.
- Made the human decision boundary visible beside operational state, inspired by the calm preflight controls used in Kraken Guardian.

### 3. Authentication, sign-up and password reset

- Rebuilt the authentication page with clear **Sign in** and **Create account** tabs.
- Added show/hide password controls and meaningful field labels.
- Added legal-consent enforcement to account creation.
- Added a complete forgot-password state with a clear “send a new reset link” action.
- Normalised email input and clarified that only the newest reset email should be used.
- Rebuilt the update-password page to detect a missing or expired recovery session and direct the user back to request a fresh link.
- Fixed a production-blocking Content Security Policy fault. The previous nonce policy allowed HTML to render but blocked Next.js hydration scripts, so sign-up and reset controls could appear while not responding. The root layout now renders dynamically so each response receives the nonce required by the policy.
- Verified sign-up and forgot-password state changes in a real browser at desktop and phone sizes.

### 4. Connections and credential handling

- Rebuilt Connect as an integration hub rather than a token form.
- Added Meta, TikTok, CSV and supporting-provider cards with connection health, data freshness and next actions.
- Added masked account identifiers and plain-language credential explanations.
- Added reconnect, synchronise and remove controls with explicit consequences.
- Kept CSV import available on Free.
- Enforced least privilege: Meta manual tokens containing `ads_management` are rejected and users are directed to use read-only `ads_read` and `read_insights` permissions.
- Removed the paid-ad write-token enrolment endpoint and interface.

### 5. Automation Studio

- Added a dedicated `/automate` workspace and `/api/automation/rules` API.
- Introduced three understandable automation classes:
  - **Observe automatically:** synchronisation, scoring, anomaly and fatigue detection.
  - **Prepare automatically:** alerts, reports, creative briefs and approval-ready drafts.
  - **Spend is human-only:** live paid-ad changes stay in the advertising platform.
- Added rule templates, custom rules, enable/disable controls, installation and a dry-run preview.
- Added visible guardrails and plan-aware capability descriptions.
- Wired saved database rules into the scheduled scoring job. Previously, users could configure rules in the interface while the scheduled job continued to use a separate hard-coded set.
- Added central persistence mapping with a safe preset fallback if the saved-rule table is unavailable.
- Added recurrence handling, stale-event resolution and database upserts.
- Prevented duplicate warning and critical events for the same entity/metric by retaining the higher severity.
- Made `window_days` affect the statistical baseline used by z-score rules.
- Escaped organisation and event text before email HTML rendering.

### 6. Recommendations and paid-ad safety

- Rewrote recommendation cards to include metric, observed value, comparison baseline, time window, confidence/data caveat and next step.
- Replaced “approve” language that implied execution with **Save as planned**, **Not now** and undo.
- Removed the dormant Meta execution implementation, execution console and write-access setup.
- Changed the action API to fail closed for live execution and preserve approval-ready drafts.
- Added manager-level gating to paid-action mutation endpoints.
- Added archive/cancel handling instead of deletion.
- Kept the product commercially useful on premium plans through richer automation and approval-ready change preparation without silently mutating spend.

### 7. Create, content and creative operations

- Rebuilt Create around **Compose, AI Assist and Queue**.
- Added platform selection, media URL support, character feedback and a platform-style preview.
- Added AI caption assistance, policy checking, image-concept support and status guidance.
- Made the workflow explicit: draft → approve → schedule/publish.
- Added deliberate confirmation for schedule, publish and removal actions.
- Replaced destructive deletion with archiving so history is preserved.
- Prevented published content from being archived through the draft endpoint.
- Added migration `0032_content_archiving.sql` for `archived_at`, the archived content state and cancelled action-draft state.

### 8. Reports, notifications and economics

- Simplified Reports around what happened, what it means and what to do next.
- Kept numbers grounded in saved analysis; no fabricated benchmarks or outcome promises.
- Standardised AUD presentation and evidence/safety language.
- Reduced notification noise and gave urgent, review and informational states clear hierarchy.
- Rebuilt Settings around break-even CPA, ROAS and CPL, including plainly labelled model inputs.
- Added validation for percentages, budgets and reporting cadence.
- Kept modelled decision lines explicitly separate from forecasts.

### 9. Permissions and organisation access

- Added reusable access checks for **viewer, editor and manager** requirements.
- Viewers retain read access; members can perform editor mutations; owners/admins control manager-level settings.
- Applied editor or manager checks to organisation settings, notifications, content, recommendations, automation, AI, audiences, audits, creative operations, ingest, leads, policy checks, sync and white-label mutations.
- Standardised unauthorised mutation responses as HTTP 403.
- Added dedicated access-matrix tests.

### 10. Security headers and application hardening

- Kept a nonce-based Content Security Policy and corrected it to work with dynamic Next.js rendering.
- Added `strict-dynamic`, explicit font sources and `form-action` control; development-only evaluation is not enabled in production.
- Protected detailed health/configuration fields behind the existing operator bearer secret. Public health responses expose only service state and version.
- Kept token encryption-key validation boolean-only; no key or secret value is returned.
- Removed write-related environment configuration and documentation.
- Updated Next.js to 16.2.11 and React/React DOM to 19.2.8.
- Overrode Next.js transitive dependencies to patched `postcss` 8.5.21 and `sharp` 0.35.3. A clean install audit reports **zero known production vulnerabilities** as of 22 July 2026.

### 11. Failure and recovery experience

- Added branded application error, loading and not-found states.
- Added useful retry and return paths rather than exposing generic framework screens.
- Kept credential and sync failure messages actionable without exposing tokens.
- Added clear recovery states for expired password-reset sessions.
- Updated deployment, release and rollback documentation for V7 and the no-live-writer boundary.

### 12. Version and product truthfulness

- Updated the application and health endpoint to 7.0.0.
- Rewrote landing and product explanation pages around the actual V7 behaviour.
- Removed claims that an approval executes a paid-ad change.
- Kept “no results guarantees” and human control of spend visible.
- Preserved the core evidence-first rule: when data is missing or insufficient, AdPilot says so.

## Research translated into the product

The research was used as a pattern library, not as a visual copy exercise.

- **Google Ads:** prioritised explanations, diagnostic insight, change context and conversion-lag awareness. Official references: [Insights](https://support.google.com/google-ads/answer/16279166?hl=en), [optimisation score](https://support.google.com/google-ads/answer/12994751?hl=en), [diagnostics](https://support.google.com/google-ads/answer/10256472?hl=en) and [channel/asset reporting](https://support.google.com/google-ads/answer/16451273?hl=en).
- **Meta and TikTok:** separated automated campaign assistance from the operator’s decision boundary. Official references: [Meta opportunity score](https://www.facebook.com/help/messenger-app/175741192481247/) and [TikTok Smart+ updates](https://ads.tiktok.com/help/article/about-updates-to-smart-plus).
- **Stripe Workbench:** adapted the pattern of one operational surface for events, logs, configuration and recovery: [Workbench overview](https://docs.stripe.com/workbench/overview?locale=en-GB).
- **Vercel:** adapted visible health, logs and alerting as release-operability requirements: [Observability](https://vercel.com/products/observability), [logs](https://vercel.com/docs/logs) and [alerts](https://vercel.com/docs/alerts).
- **Linear:** adapted compact saved views, current-cycle focus and a digestible activity pulse: [Cycles](https://linear.app/docs/use-cycles), [display options](https://linear.app/docs/display-options) and [Pulse](https://linear.app/docs/pulse).
- **HubSpot:** adapted checklist-led onboarding and template-based workflow automation: [workflow automation](https://www.hubspot.com/products/workflow-automation) and [onboarding checklists](https://knowledge.hubspot.com/help-and-resources/manage-onboarding-to-do-lists-with-checklists).
- **Smartly, Motion and Madgicx:** compared creative workflow, cross-channel operations and rule automation. References: [Smartly introduction](https://docs.smartly.io/docs/introduction-to-smartly), [Motion solutions](https://motionapp.com/solutions) and [Madgicx overview](https://academy.madgicx.com/lessons/what-is-madgicx).
- **Kraken Guardian:** adapted the strongest internal pattern: calm system state, visible limits, preflight checks, auditability and explicit human control over consequential actions.

## Verification record

The release candidate passed:

- **TypeScript:** zero errors.
- **ESLint:** zero errors.
- **Automated tests:** 85 files, **757 tests passed**.
- **Production build:** successful on Next.js 16.2.11; 52 static-generation tasks completed and all application/API routes compiled.
- **Dependency audit:** clean install, production scope, **zero known vulnerabilities**.
- **Real-browser console:** zero errors across landing, sign-in, sign-up and password-update pages.
- **Responsive browser checks:** no horizontal overflow at 1,440 px or a true 390 × 844 phone viewport.
- **Authentication interaction checks:** forgot-password transition passed; sign-up consent gating passed.
- **Lighthouse mobile:** Performance **98**, Accessibility **100**, Best Practices **100**, SEO **100**.
- **Diff hygiene:** no whitespace errors and no secret file included in the tracked change set.

The local browser check used non-production placeholder Supabase values only. No customer credential or API secret was copied into the repository.

## Sign-in and recovery guide

1. Open the hosted AdPilot URL and choose **Sign in**.
2. Enter the email used for the account and its password.
3. If the password is unknown, choose **Forgot password?**, enter the same email and select **Send a new reset link**.
4. Use only the newest reset email. Older Supabase recovery links may be invalid after a newer one is requested.
5. The link opens **Choose a new password**. If AdPilot reports that the recovery session is missing or expired, return to Sign in and request one fresh link.
6. For a new workspace, choose **Create account**, complete the fields, accept the legal terms and submit.

Production email delivery still depends on the project’s configured Supabase custom SMTP provider, authorised sending domain and redirect URL allow-list.

## Release operations

### Database

Apply migrations in order through `0032_content_archiving.sql` before exercising archive/cancel controls in production. The application is backward-tolerant for saved automation-rule loading, but content archiving requires the new column and status constraint.

### Required production configuration

- Supabase URL, anon key and service-role key
- Valid 32-byte token-encryption key
- Canonical application URL
- Cron secret
- Custom SMTP and approved recovery redirect URLs
- Resend for digests/notifications if email automation is enabled
- Stripe secret, webhook secret and confirmed price IDs if billing is enabled
- Read-only Meta/TikTok application credentials and approved scopes

### Human acceptance checks after deployment

1. Health endpoint returns version 7.0.0 and `status: ok`.
2. Create-account page changes mode and accepts consent.
3. One password-reset email arrives and its newest link opens the update page.
4. Existing account signs in and reaches Today.
5. Simple/Advanced selection persists after refresh.
6. Connected account shows masked identifier and freshness.
7. Manual sync completes and updates freshness.
8. Automation rule dry run returns explained matches.
9. A content draft can be archived without losing history.
10. A recommendation can be saved as planned but cannot execute a live paid-ad change.

## Remaining owner-gated decisions

These are not code defects and cannot be truthfully completed with invented credentials or legal/commercial choices:

- Confirm the final recurring AUD prices and map the correct Stripe production price IDs.
- Have Australian counsel approve Terms, Privacy and Limitations text.
- Confirm Supabase custom SMTP, sender-domain authentication and redirect allow-list.
- Complete Meta/TikTok provider app review for the required **read-only** scopes.
- Confirm the Vercel plan supports the configured cron frequency and review first-week usage/alerts.
- Decide whether content publishing tokens should be enabled; this is separate from paid-ad write access.

## Recommended next release

V7 should gather real usage before adding breadth. The strongest V7.1 priorities are:

1. Saved filters/views for multi-client operators.
2. A unified audit timeline for syncs, rule matches, drafts, approvals and archives.
3. Creative-fatigue gallery with thumbnails and comparison cohorts.
4. Conversion-lag and attribution-quality explanations beside short-window verdicts.
5. Guided provider onboarding with a test connection before credentials are saved.
6. Error-budget and incident view using Vercel/Supabase operational events.
7. Passkeys or magic-link sign-in after SMTP reliability is proven.

Live paid-ad execution should remain out of scope until a separate, reviewed control plane exists with per-account caps, typed confirmation, two-person approval for large moves, complete audit logging, provider sandboxes and tested rollback. That work must not be smuggled into ordinary automation.

---

**Release principle:** automate collection, analysis, explanation and preparation; keep irreversible or spend-changing decisions visible, reviewable and human-controlled.
