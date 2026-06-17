# V6 Research — Stream 07: Monetisation & Packaging

> **Author:** Piper (Productisation) paired with a senior SaaS pricing/growth expert.
> **Date:** 2026-06-16 · **Scope:** Phase-0 research. Read-only on code. No prices set or committed.
> **Mandate fit:** "features + packaging that bring real financial gain to (1) clients, (2) the owner,
> (3) developers/resellers." Every numeric/pricing decision is deferred to the **Owner questions** section.
> **Web status:** AVAILABLE — external 2026 benchmarks gathered (sources at the foot).

---

## 0. Executive summary (the 5 moves)

1. **Hybrid pricing model: per-seat/tier base + usage meters (ad accounts & AI actions) + an
   ad-spend-band multiplier for the agency tier.** 2026 data: 43% of SaaS now hybrid → 61% by year-end;
   hybrid reports ~38% higher revenue growth than pure subscription. This is the single biggest ARPU lever.
2. **Convert Free into a "reverse trial" (full Pro for 14 days → drops to a genuinely useful Free).**
   Reverse trials convert at ~18–32% (median 24%) vs freemium 2–8% — and protect PLG by leaving a sticky
   free tier (CSV import + Health Score) intact.
3. **Deepen the Expert/Agency tier into a real white-label platform** (sub-accounts, branded client
   logins, portfolio rollup, markup re-billing) — this is where ARPU and resale leverage compound; the
   internal white-label doc already proves 69–99% agency margins, so the willingness-to-pay is there.
4. **Launch a Template & Dashboard Marketplace + a Partner/Reseller program** (rev-share on templates,
   recurring commission for resellers). Hybrid partner programs generate ~40% more expansion revenue/customer.
5. **Anchor every tier to client ROI: "wasted-spend found" as the headline metric.** The product's wedge
   ("can't wreck your account; proves its own maths") becomes a quantified savings number that justifies
   the subscription and drives retention/expansion.

File path of this doc: `CPWORK/universal-ads-os/product/v6-research/07-monetisation.md`

---

## 1. Where we are today (live-code truth, not the markdown)

The shipping app (`adpilot-v2`) already has a clean, test-enforced commercial spine — this is an asset:

- **4 tiers** `free / starter / pro / expert` (`lib/entitlements.ts`), `agency`→`expert` alias.
- **Gate truth** (`FEATURE_MIN_PLAN`) is decoupled from **display truth** (`lib/plans.ts`), kept in sync
  by a drift-alarm test. Adding a feature = one line; adding a tier = small, safe change.
- **Prices are NULL → "See pricing"** (owner-gated). PM anchors noted in `plans.ts` comments:
  Free $0 · Starter $49 · Pro $149 · Expert $399 /mo, annual ≈ 2 months free. **Not committed.**
- **Stripe = recurring subscriptions only** (`app/api/stripe/checkout` + `webhook`), price→plan map is
  allow-listed and fails closed. Mode is hardcoded `"subscription"`, `quantity: 1`.
- **White-label exists but is shallow:** `app/(app)/agency/page.tsx` saves brand_name/logo/colour/support
  email to a `white-label` profile that themes the *report header only*. No sub-accounts, no client logins,
  no portfolio rollup, no markup billing.
- **Current feature→tier map:** Free = csv_import, health_score. Starter += reports, content_publish,
  threshold_alerts. Pro += api_connect, auto_sync, ai_team, creative_studio, multi_client, lead_quality_loop.
  Expert += white_label, messenger_automation, ad_write, expert_plugins.

**Monetisation gaps the live code reveals:**
- No usage metering anywhere (no per-ad-account, per-AI-action, or per-spend dimension). Pure flat tiers.
- No annual plans wired (cadence is `"month"` only; no annual Stripe price keys).
- No add-ons / one-time purchases (`mode: "subscription"` only).
- No marketplace, no partner/reseller plumbing, no referral attribution.
- No "value realised" surface (wasted spend found, ROAS lift) to justify price at renewal.
- The rich `pricing-tiers.md` (one-time $97–$4,997 download model) is the *old framework*'s economics and
  **conflicts** with the live recurring-SaaS model. V6 should pick recurring-SaaS as canonical and treat the
  one-time figures as resale/DWY services, not the core.

---

## 2. Packaging — what belongs in Free vs Paid for V6 (PLG-safe ARPU)

Principle (from 2026 PLG data): **activation drives 60–75% of trial→paid conversion**; activated trials
convert 35–65% vs 2–8% un-activated (a 4–8× gap). So Free must deliver the *aha* (a real Health Score on
the user's own data) but withhold the *recurring habit* (automation, live sync, team, multi-client).

Recommended V6 ladder (features map to existing `Feature` enum + proposed new ones; **who gains** tagged
client `C` / owner `O` / dev-reseller `D`; **effort** S/M/L):

| Tier | Keep / Add | Rationale | Gains | Effort |
|---|---|---|---|---|
| **Free** | csv_import, health_score, **Simple view**, 1 saved report (watermarked), "wasted-spend found" teaser | The aha must be free; cap it so the habit (automation/live data) is paid | C, O | S |
| **Free→Pro reverse trial** | Full Pro for 14 days on signup, auto-downgrades to Free | 24% median conversion vs 4.5% freemium; de-risks the upgrade decision | O | M |
| **Starter** | reports (unwatermarked), content_publish, threshold_alerts, **Advanced view**, 1 ad account | DIY operator; the report+alerts habit | C, O | S |
| **Pro** | api_connect, auto_sync, ai_team, creative_studio, multi_client, lead_quality_loop, **forecasting/anomaly diagnostics (V6)**, **3–5 ad accounts included** | The "operator/freelancer" workhorse; live data is the retention moat | C, O | M |
| **Expert/Agency** | white_label (deep), messenger_automation, ad_write, expert_plugins, **unlimited-ish accounts (banded)**, **portfolio rollup**, **client logins**, **API/webhooks out** | Agencies + power resellers; highest ARPU + resale leverage | C, O, D | L |

**Packaging rules:**
- **Move `multi_client` semantics to be metered, not binary.** Today it's a Pro on/off flag. In V6 make
  "number of ad accounts / client workspaces" a *usage dimension* with tier-included allowances + overage
  (see §4). This is the cleanest ARPU expansion that doesn't hurt PLG.
- **Keep the safety wedge free.** "Physically cannot wreck your account" + "proves its own maths" is the
  trust that powers PLG word-of-mouth — never gate it.
- **`ad_write` stays Expert + double-gated** (env + typed-YES). It is a *premium capability*, not a usage meter.
- **Simple vs Advanced view is NOT a paywall** — it's UX (per V6 mandate). Don't monetise the view toggle;
  monetise capability + usage. (Free can default to Simple; Advanced available from Starter is fine as a soft nudge.)

---

## 3. Pricing-MODEL options (recommend the model; NUMBERS owner-gated)

### Option A — Pure tiered subscription (status quo)
- **Pros:** simplest; already built; predictable; easy to communicate.
- **Cons:** ARPU caps at the top tier; a 50-client agency pays the same as a 6-client one; leaves money on
  the table; no natural expansion path → flat NRR.
- **Verdict:** keep as the *base layer* but do not stop here.

### Option B — Per-seat / per-user
- **Pros:** familiar; scales with team.
- **Cons:** *anti-aligned* with this product — the value is per-ad-account and per-decision, not per-human.
  Agencies share logins; per-seat punishes the wrong thing and invites seat-sharing leakage.
- **Verdict:** **avoid as the primary axis.** A small seat allowance per tier (with cheap extra seats) is fine.

### Option C — % of ad spend
- **Pros:** value-aligned in theory; agencies understand it; uncaps revenue with client success.
- **Cons:** for a **read-only advisor** (not a spend platform), charging % of spend is hard to justify and
  invites "why am I paying $2k/mo to a tool that doesn't touch my account?" Also volatile/seasonal revenue.
- **Verdict:** **do not charge a raw % of spend.** Instead use **ad-spend *bands*** as a tier/price
  *multiplier on the agency tier only* (e.g. "manages up to $X/mo total spend") — captures value without the
  conflict-of-interest optics, and matches how Northbeam/Triple-Whale-class tools band by volume.

### Option D — Usage-based (per ad account / per AI action / per audit run)
- **Pros:** scales ARPU with real consumption; the AI specialist team + auto-sync are genuine cost+value
  meters; aligns price with the work done.
- **Cons:** pure usage hurts predictability and can chill PLG ("meter anxiety"). Needs metering plumbing
  (none exists today).
- **Verdict:** use as **add-on meters on top of tiers**, with generous included allowances so most users
  never hit them — meter only the heavy users.

### ★ Recommended: Option E — **Hybrid** (base tier + usage meters + agency spend-band)
The 2026 winner: 43%→61% of SaaS hybrid; +38% revenue growth vs pure subscription. Structure:

1. **Base = tiered subscription** (Free/Starter/Pro/Expert) — the predictable floor; unlocks *capabilities*.
2. **Usage meters with included allowances + overage:**
   - **Ad accounts / client workspaces** (the cleanest, most defensible meter).
   - **AI specialist actions / deep-audit runs** (heavy compute = heavy value; meter only above allowance).
   - **Auto-sync cadence / connected platforms** (optional).
3. **Agency spend-band multiplier** on Expert only ("manages up to $X aggregate monthly spend") — captures
   the big-agency value without raw %-of-spend optics.
4. **Annual plans** (≈2 months free) to pull cash forward + cut churn. **Owner sets the discount + numbers.**
5. **One-time add-ons** for DWY setup, premium template packs, and the real-account onboarding audit
   (requires extending Stripe beyond `mode: "subscription"`).

This keeps Free/Starter clean and PLG-friendly (no meter anxiety at the bottom), and concentrates ARPU
expansion at Pro/Expert where willingness-to-pay and value-per-account are highest.

---

## 4. Revenue-expansion features (the build list)

Tagged by **who gains** (C/O/D) and **effort** (S/M/L). All read-only-safe; none breaches the invariant.

### 4.1 Usage metering layer *(foundation — unlocks the hybrid model)*
- Add a `usage_events` table + counters for ad-accounts-connected, AI-actions, audit-runs. Surface a live
  "X of Y included" meter in-app; soft-cap + upgrade nudge at the line; Stripe metered/graduated prices for
  overage. **Gains: O (ARPU).** **Effort: L.** *Numbers owner-gated.*

### 4.2 White-label / Agency tier DEPTH *(today it only re-skins a report header)*
- **Sub-accounts / client workspaces** with the agency's branding, isolated by RLS (`is_org_member`
  pattern already exists — extend to a parent-org → child-workspace tree).
- **Branded client logins** (client sees *their* dashboard under the agency's brand/domain — CNAME/custom
  subdomain). Major retention + perceived-value lever.
- **Portfolio rollup view** (all clients' Health Scores ranked — the master-dashboard from the white-label
  doc, but live). Drives the "open one tool to see the whole book" north star.
- **Markup re-billing** (agency sets a per-client retail price; AdPilot bills the agency wholesale; agency
  keeps the margin). The internal doc's 69–99% margins are the sell; this productises it.
- **Gains: C, O, D.** **Effort: L (phased: sub-accounts → logins → rollup → re-billing).** *Numbers owner-gated.*

### 4.3 Add-ons (one-time + recurring) *(needs Stripe `mode: payment` + new price keys)*
- **DWY / onboarding audit** (one-time): the real-account audit + first report, productised.
- **Premium niche context packs** (recurring or one-time): e-com, lead-gen, local-services tuned thresholds
  — leverages the existing `ADPILOT_CONTEXT_PACK_JSON` loader; sell packs as paid unlocks.
- **Extra ad-account / workspace blocks**, **extra AI-action credits**, **white-label custom domain**.
- **Gains: C, O.** **Effort: M.** *Numbers owner-gated.*

### 4.4 Template & Dashboard Marketplace
- Sell/share report templates, dashboard layouts (the V6 Advanced-view "layouts/checkpoints"), alert-rule
  packs, UTM convention packs. First-party packs = pure margin; third-party (agency/dev-built) = **rev-share**.
- Ties directly to the V6 "upload/download for power users" mandate (Advanced view layouts become sellable units).
- **Gains: C (faster setup), O (margin + lock-in), D (creators earn).** **Effort: M–L.**

### 4.5 Partner / Reseller program (for developers + agencies)
- **Reseller tier:** recurring commission (hybrid commission model = +40% expansion/customer per 2026 data),
  partner dashboard, deal registration, co-branded assets (the sales-support pack already exists).
- **Developer/plugin program:** `expert_plugins` is already a gated feature — open it to third-party devs to
  build + sell plugins through the marketplace (rev-share). Turns the moat into an ecosystem.
- **Affiliate/referral:** in-app referral attribution → credit/commission (PLG growth loop).
- **Gains: O (CAC-light growth), D (income), C (richer ecosystem).** **Effort: M (referral) → L (full partner portal).**

### 4.6 Annual billing + commitment incentives
- Annual prices (≈2 months free), optional multi-account annual bundles for agencies. Cuts churn, pulls cash
  forward, improves LTV:CAC. **Gains: O.** **Effort: S (Stripe annual price keys + UI toggle).** *Discount % owner-gated.*

---

## 5. What drives CLIENT ROI (so they stay and pay) — retention/expansion

Retention is the real monetisation engine (best PLG NRR 120–140%). The product must *prove* its value
continuously, or any price feels high for a read-only tool. Levers:

1. **"Wasted spend found / saved" as the hero metric.** Quantify it on the dashboard, in every report, and
   in renewal emails. The objection-handling doc already uses "$400/mo wasted on $2k spend" — make it a *live
   computed number*, not a sales line. Strongest justification for any subscription price.
2. **Time saved** (hours of spreadsheet work removed) — the white-label margin tables (4–6 h/client → ~0.5 h)
   are the agency-side ROI; surface it.
3. **Health Score trend over time** (going green = the product working) — visible progress = lower churn.
4. **Forecasting + anomaly alerts (V6 diagnostics stream)** — catching a CPA spike *before* the client does
   is the moment they decide to keep paying.
5. **Lead-quality loop** — proving "cheap leads vs good leads" (the cross-platform break-even wedge) links ad
   spend to revenue; clients who see revenue attribution don't churn.
6. **Safety/trust** — "cannot wreck your account + proves its own maths" lowers the perceived risk of keeping
   it connected; trust → retention.

**Expansion triggers** (productise these as in-app nudges):
- Hitting the ad-account/AI-action allowance → upgrade or buy a block.
- Adding a 2nd/6th client → Pro→Expert nudge.
- Wanting branded client delivery → Expert white-label nudge.
- Annual renewal → offer annual discount at the moment of proven value.

---

## 6. Tier-by-tier financial-gain map (who wins where)

| Move | Client gain | Owner gain | Dev/Reseller gain |
|---|---|---|---|
| Reverse-trial Free | Tries full power risk-free | 24% vs 4.5% conversion | — |
| Hybrid meters | Pays for what they use | ARPU uncaps with usage | — |
| Deep white-label | Branded, sticky delivery | High-ARPU top tier + lock-in | 69–99% resale margin |
| Marketplace | Faster setup, more templates | Margin + ecosystem lock-in | Creators earn rev-share |
| Partner program | Better-supported ecosystem | CAC-light recurring growth | Recurring commission |
| Annual billing | Discount | Cash forward + lower churn | Bigger upfront partner payout |
| ROI surface | Sees the value, stays | Higher NRR/retention | Easier client sell |

---

## 7. Sequencing (so monetisation lands without churn risk)

1. **P1 (S):** Annual billing + reverse-trial Free + "wasted-spend found" surface. Low effort, immediate
   ARPU/conversion/retention lift, no architecture risk.
2. **P2 (M):** Usage metering foundation (ad-account meter first) + Stripe add-on `mode: payment`. Unlocks hybrid.
3. **P3 (L):** White-label depth (sub-accounts → client logins → portfolio rollup → markup re-billing).
4. **P4 (M–L):** Marketplace + partner/reseller portal + referral attribution.
Each phase verified (`tsc` + `vitest` + `next build`) per V6 operating rules; brief to owner after each major one.

---

## 8. Owner questions (ALL numbers/pricing decisions — decided just before upload)

**Pricing-model & numbers**
1. Confirm the **base monthly AUD** for Starter / Pro / Expert (PM anchors $49/$149/$399 are placeholders only).
2. **Annual discount** — confirm "≈2 months free" (i.e. ~17%) or set a different %.
3. Adopt the **hybrid model** (base + usage meters + agency spend-band)? If yes:
   - **Included allowances** per tier for: ad accounts/workspaces, AI-specialist actions, deep-audit runs.
   - **Overage prices** for each meter (per extra ad account, per AI-action block, etc.).
   - **Agency spend-band thresholds + multipliers** ("manages up to $X/mo aggregate spend" → price step).
4. **Seats:** included seats per tier + price of extra seats (recommend small allowance, cheap extras)?
5. **GST / merchant-of-record:** charge inc-GST to AU buyers via Stripe Tax, or use a MoR (Lemon Squeezy) for
   international tax? (Confirm with accountant.)
6. **Currency:** AUD primary confirmed — also offer USD pricing? If so, set USD numbers (don't auto-FX).

**Add-ons & marketplace**
7. **DWY / onboarding-audit** one-time price(s) (old doc: $1,500–$5,000 — confirm or revise).
8. **Premium context-pack** prices (one-time vs recurring) per niche pack.
9. **Marketplace rev-share split** with third-party template/plugin creators (e.g. 70/30 — owner to set).
10. **Custom-domain / white-label add-on** price.

**Partner / reseller**
11. **Reseller commission** structure & % (recommend hybrid: upfront + recurring; 2026 data favours hybrid).
12. **Affiliate/referral** reward (credit vs cash; amount).
13. Open **`expert_plugins` to third-party developers**? (yes/no + rev-share if yes.)

**Packaging / strategy**
14. Approve making **`multi_client` a metered allowance** (vs today's binary Pro flag)?
15. Approve the **reverse-trial** (14-day full-Pro on signup → Free)? Confirm trial length (14 days default).
16. Keep the legacy **one-time $97–$4,997 download tiers** (`pricing-tiers.md`) as DWY/service-only, and make
    **recurring-SaaS canonical** for the app? (Recommended — they currently conflict.)
17. Free-tier caps: confirm "1 watermarked report + Health Score + CSV import" as the Free ceiling.

**Non-pricing owner gates already on the queue (restated):** Meta System User token for the real-account
audit; solicitor Terms/Privacy text.

---

## 9. Sources (web — accessed 2026-06-16)

- NxCode — SaaS Pricing Strategy Guide 2026 (per-seat / usage / outcome / hybrid).
- Momentum Nexus — SaaS Pricing Strategy Guide 2026 (usage-based winning; when to use tiered/per-user/value).
- Advisable — The SaaS Pricing Shift: Usage-Based vs Subscriptions 2026.
- getmonetizely — 2026 Guide to SaaS, AI, and Agentic Pricing (AI-linked billing).
- AdStellar — Facebook/Meta Ads SaaS Pricing guides 2026 (%-of-spend, per-seat, flat-fee norms).
- SaaSHero — B2B SaaS Google Ads Management Pricing 2026 (flat-fee vs %-of-spend conflict).
- GrowthSpree — PLG hybrid 2026 + Trial-to-Paid Conversion Benchmarks (reverse trial 18–32%, freemium 2–8%).
- CausalFunnel — 2026 B2B SaaS Funnel Conversion Benchmarks.
- SuiteDash / LiveChat Partners / Reply / Channels-as-a-Strategy — White-label & reseller programs + commission
  structures 2026 (hybrid commission +40% expansion).
- Improvado / Triple Whale / AdLibrary — Northbeam vs Triple Whale 2026 (volume/account banding; ~$1k–$2.5k/mo).

> Key external stats used: hybrid pricing 43%→61% adoption (+38% growth); reverse-trial 24% median vs
> freemium 4.5%; activation drives 60–75% of conversion; best-PLG NRR 120–140%; hybrid reseller commission
> +40% expansion/customer; ad-tools commonly band by spend/account volume.
