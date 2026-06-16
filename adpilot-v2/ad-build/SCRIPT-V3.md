# AdPilot OS V3 — Launch Ad v2 · "Two Accounts. One Audit."
## Finalized production proposal (team consensus) + master production prompts

> 9:16 vertical · 1080×1920 · 30fps · ~50s · mute-first (burned-in captions) + optional sound-on VO.
> Refines the baseline ad (`ad-build/SCRIPT.md`) by replacing the invented 61/100 with **real demo
> data**, adding a **plan-tiers** scene and a **two-account proof** structure, and raising the energy.

---

## 0. How this was built (the team + the consensus)

An **expert evaluator** went through the webapp first and locked the authoritative model + context
(exact tiers, exact live demo numbers, product model, brand). Then nine specialists worked **in
parallel** off that one foundation: **marketing exec, sales exec, script writer, motion/animation
director, brand/visual designer, hook & virality specialist, data storyteller, validator/compliance,
editor**. This document is the show-runner's reconciliation of all nine into one locked plan.

**Key debates resolved (the "finalise" step):**
1. **What's the hook?** Marketing + Hook + Data all argued the **$780 → $0 leak** is the strongest
   scroll-stopper. Editor had the score first. **Resolved: open cold on $780 → $0.** The Café score
   contextualises it immediately after.
2. **Before/after of one account?** Data/Brand proposed a 58→80 "transformation" morph. **Validator
   override (compliance):** 58 (Café) and 80 (Maya) are **two different demo accounts** — showing one
   gauge "climb" implies AdPilot changed an account and conflates two. **Resolved: "Two accounts. One
   audit." — a contrast between two labelled accounts, never a single-account before/after.**
3. **Does AdPilot "kill" the ad?** Read-only. **Resolved: the user approves a proposal** ("you
   approve") — the engine proposes, never executes.
4. **"12 AI specialists"?** Validator flagged it unverified; confirmed in `lib/agents/registry.ts`
   (12 named agents). **Resolved: keep "12 AI specialists".**
5. **Runtime / scene count:** Reconciled Script(11)/Motion(10)/Brand(11)/Editor(49s) into one
   **11-scene, ~50s** board on the Editor's 122-BPM grid.

---

## 1. Strategy (locked)

- **Audience:** DIY small-business owners & solo creators spending ~$3k–$10k/mo on Meta & TikTok, no
  analyst, no trusted agency. The two demo faces: Bean & Bloom (struggling local) and Coach Maya
  (growing creator).
- **Insight:** *"I'm spending money every day and I can't tell if it's working — and I'm scared the
  answer is no."* They don't lack dashboards; they lack a **verdict.**
- **Big idea:** **"Two accounts. One audit. See the leak — and the scale."**
- **Promise / tagline:** *"Know exactly what your ads are doing to your money."*
- **The trust unlock (the close):** *"Read-only — it proposes, you approve. It never touches a live
  ad."*
- **Success metric:** cost per **free-audit start** (activation), not views. 3-second hold-rate is the
  leading diagnostic.

---

## 2. Compliance guardrails (applied throughout — GO/NO-GO)

Every item must be green:
1. No "guarantee/guaranteed", no earnings/results promise — anywhere.
2. Every on-screen number traces to source: **58, 80, 1.04, 2.19, $4,068/$4,250, $9,924/$21,716,
   $780→$0**. Nothing else.
3. **"61/100" appears nowhere.** **"2.5× Hook Reel" (any per-ad multiplier) appears nowhere** — only
   account ROAS **2.19 / ~2.2×**.
4. All prices **AUD**, with currency shown, matching source: **$97–297 / $497–1,497 / $1,997+**.
5. **No Free / $0 card.** Exactly 3 tiers; Pro tagged "Most popular".
6. Demo metrics carry a persistent **"Demo account · illustrative"** microlabel.
7. **Two distinct accounts** — never a single-account before/after; never imply AdPilot changed an account.
8. Read-only scoped to the analysis engine: *"it proposes — you approve."* No "we optimised/killed your ads."
9. No implied Meta/TikTok partnership/endorsement ("connects to Meta & TikTok, read-only").
10. Ad claims match the landing page (pricing, read-only, no-guarantees).

---

## 3. Final storyboard (canonical · 11 scenes · ~50s · mute-first)

| # | Time | Scene | On-screen CAPTION (mute-first) | VOICEOVER (sound-on) | Motion / sound (122 BPM) |
|---|------|-------|--------------------------------|----------------------|--------------------------|
| 1 | 0.0–4.5 | **HOOK — the leak** (near-black). One ad row: spend rolls $0→**$780**, revenue flatlines at **$0**, "TRACKING BROKEN" stamps; tiny "Demo account". | **"This ad spent $780. It made $0 back."** → small: *Two accounts. One audit.* | "This ad spent seven hundred and eighty dollars… and made nothing back." | $ counter up + glitch on $0; sub-boom; let $0 sit in silence ~0.5s (the void). |
| 2 | 4.5–9.5 | **CAFÉ DIAGNOSIS** (near-black). Gauge needle sweeps to **58/100 ORANGE "At risk"**; ROAS rolls to **1.04**; micro-stats $4,068 spend · $4,250 rev · CPA $32.54 vs BE $21.08. Label "ACCOUNT 1 · Bean & Bloom · demo". | **"Account 1: 58/100. Spending $32.54 to make a $21 sale."** | "AdPilot scores the whole account, zero to a hundred. This one? Fifty-eight — at risk." | **DROP 1** lands as needle locks (~8.4s); detuned UI ping. |
| 3 | 9.5–14.5 | **5 VERDICTS fire.** Pills stamp in sequence 🛠️Fix · 🛑Kill · 🔻Reduce · ♻️Refresh · 🚀Scale; **Kill** highlighted (the bleeder). | **"Then it tells you exactly what to do. 5 clear verdicts."** | "Then it tells you what to do — fix, kill, reduce, refresh, scale." | One percussive tick per pill, ~1 beat apart; each pill scale-pops. |
| 4 | 14.5–18.0 | **YOU APPROVE.** Thumb taps **Approve** on the 🛑 Kill for "Menu Reel A"; pill flips "Approved ✓", row greys out. | **"You tap approve. That's it."** | "You approve the safe fixes. Done." | Tactile pop + descending power-off zip; green ripple. |
| 5 | 18.0–23.0 | **READ-ONLY (calm valley).** Coral→amber gradient; lock badge stamps; a live ad sits behind glass, untouched. | **"Read-only. It proposes — you approve. It never touches a live ad."** | "It's read-only. It proposes — you decide. It never edits a live ad. Your data stays private." | **Filter-sweep DOWN**, SFX sparse, motion decelerates (~12-frame settle). Trust beat. |
| 6 | 23.0–28.0 | **ACCOUNT TWO.** "Two accounts. One audit." title; cut to **Coach Maya** gauge **80/100 GREEN "Healthy"**. Label "ACCOUNT 2 · Coach Maya · demo". | **"Account 2: 80/100. Green. Scale-eligible."** | "Now a different account. Same engine — eighty out of a hundred. Green." | **Riser → DROP 2** (peak) on the cut to Maya (~27.6s); bright shimmer. |
| 7 | 28.0–33.0 | **MAYA'S MONEY.** ROAS **2.19**; spend **$9,924** → revenue **$21,716** (bar fills green past spend); 🚀 Scale the TikTok "Day-1 Hook Reel" + "Free Guide Optin". | **"$9,924 in → $21,716 out. 2.19× ROAS. Scale the winners."** | "Nine thousand nine hundred in, twenty-one thousand seven hundred out — two-point-two ROAS. The audit says: scale the winners." | Revenue counter lands on the next downbeat (one-two punch with ROAS). |
| 8 | 33.0–37.0 | **12 AI SPECIALISTS** grid pops in (Mira/Meta, Travis/TikTok, Dana/Data, Atlas/Tracking, Paige/Policy…), router hub pulses a coral ring. | **"12 AI specialists. Grounded in your real numbers."** | "Twelve AI specialists — Meta, TikTok, tracking, policy — every call grounded in your real numbers." | 12 staccato data-ticks as avatars populate. |
| 9 | 37.0–42.0 | **PLAN TIERS.** 3 cards rise: **Starter $97–297** · **PRO $497–1,497 (MOST POPULAR, coral glow)** · **Expert $1,997+** — AUD. One hero line each. | **"From $97 AUD. Pro = auto-sync + 12 agents + studio."** | "Plans from ninety-seven dollars. Pro adds auto-sync, all twelve agents, and the creative studio." | 3 whooshes; **Pro-card glow-pulse** hit (~38.5s). |
| 10 | 42.0–45.0 | **RECEIPTS.** Stamp: "Real demo accounts · real numbers · ~6 months of Meta & TikTok data · scored by the real engine." | **"Real demo accounts. Real numbers. ~6 months of data."** | "Real demo accounts, real numbers, six months of data." | Subtle "proof" click; understated. |
| 11 | 45.0–50.5 | **END CARD.** AdPilot OS V3 lockup + gradient sweep; CTA button breathes; trust line. | **"Know exactly what your ads are doing to your money."** → **[ Run your free audit ]** · *Read-only · Meta + TikTok · from $97 AUD · no results guaranteed* | "Know exactly what your ads are doing to your money. Run your free audit." | Resolved impact stinger on the downbeat; button pulse; ring-out. |

**Total ≈ 50.5s** (trim scenes 3 & 7 by ~0.5s each to hit 49s if needed). **3 hook variants** (A: "$780→$0" — winner; B: "Your ads are spending money right now…"; C: split "58 vs 80") available for A/B testing.

---

## 4. Live-data choreography & receipts (all numbers foundation-exact)

- **The void:** $0 must hit visual silence (~0.5s) before any caption — the void is the hook.
- **Counters land ON the downbeat** (start the roll ~0.4s early so the final number snaps on the hit).
- **Two-account contrast, side-by-side values (never "before/after of one account"):**

| Metric | ACCOUNT 1 · Bean & Bloom (demo) | ACCOUNT 2 · Coach Maya (demo) |
|---|---|---|
| Health | **58/100 · Orange** "At risk" | **80/100 · Green** "Healthy — scale-eligible" |
| ROAS | **1.04** (barely break-even) | **2.19** |
| Spend → Revenue | $4,068 → $4,250 | $9,924 → $21,716 |
| CPA vs break-even | $32.54 vs $21.08 (over — red) | $91.05 vs $169.15 (under — green) |
| Headline verdict | 🛠️ Fix tracking · 🛑 Kill the bleeder | 🚀 Scale the winners |

---

## 5. Visual system (condensed — full tokens verified vs `tailwind.config.ts`)

- **Two worlds:** near-black **command `#161221`** (hero/authority scenes, text `#faf7f4`) vs warm
  **surface `#faf7f4`** (clarity/UI scenes, text `#1c1726`). Never full-screen pure white.
- **Coral `#f9603f` = action/brand** (wordmark, CTA, Pro ring, live dot — one coral focal point per
  scene). **Amber `#ffb224` = accent/energy** (gradient 2nd stop + small reward sparks only). **Band
  colors are data-only:** green `#16a34a`, yellow `#ca8a04`, orange `#ea580c`, red `#dc2626`.
- **Gradient:** `linear-gradient(135deg,#f9603f,#ffb224)` — same angle everywhere.
- **Type:** **Anton** (display: hero numbers/captions/prices, ≥40px) + **Inter** (UI/labels/legal).
  *Anton = the noun; Inter = the sentence.*
- **Gauge:** 270° arc, Ø620, stroke 48, rounded caps. Bands re-anchored to health thresholds:
  **Red <0.40 · Orange 0.40–0.60 · Yellow 0.60–0.80 · Green ≥0.80.** Café fill = 58/100×270° = 156.6°
  (orange); Maya fill = 216° (green). Two distinct gauges (two accounts), not one morphing.
- **Pro price card:** 340×680, lifted −60px, 3px coral border + coral glow, "MOST POPULAR" gradient
  ribbon, gradient-filled button. Starter/Expert neutral (ink + grey) so Pro wins the eye.

---

## 6. Production blueprint (hybrid)

- **Code renderer (`ad-build/render.js`) = the pixel-accurate spine** for all data/UI/brand scenes
  (gauges, pills, counters, price stack, 12-grid, end-card) — it already has the primitives.
  **Required updates before rendering V3:** (a) add the **command `#161221`** dark world; (b)
  **re-anchor gauge bands** to the health thresholds above (baseline had them quartered/reversed);
  (c) add band colors `#16a34a`/`#ea580c`; (d) add the **two new scenes** (dual-account gauges, the
  3-tier price stack) and the **$780→$0** counter; (e) persistent "Demo account · illustrative" label.
- **Adobe Firefly = 2–3 textured backdrop plates** that vector can't fake (night-dashboard, ambient
  gradient field, optional hands-on-phone B-roll), composited *behind* transparent renderer overlays.
- **Canva = whole-ad alternative / final grade & caption pass** (master prompt in §7a).
- **Composite → one MP4** via ffmpeg (`overlay` renderer PNGs on Firefly plates; normalise all to
  1080×1920/30fps/yuv420p; concat on the beat; master encode `-c:v libx264 -profile:v high
  -pix_fmt yuv420p -movflags +faststart`, mute-first `-an`, captions baked).

---

## 7. MASTER PRODUCTION PROMPTS

### (a) CANVA — full 9:16 video (paste into Canva AI / generate-design)

> Create a **9:16 vertical video ad (1080×1920, 30fps, ~50s), mute-first with bold baked-in
> captions**, for **AdPilot OS V3 — a read-only Meta & TikTok ad auditor**. Brand: near-black
> background **#161221**, warm off-white **#faf7f4**, ink **#1c1726**, a **coral #f9603f → amber
> #ffb224** 135° gradient for accents/buttons; status colors green **#16a34a**, orange **#ea580c**,
> red **#dc2626**. Display/caption font **Anton**; UI font **Inter**. Recurring frame: **"Two
> accounts. One audit."** Label all metrics "Demo account · illustrative."
> Scenes (each with a big bottom caption):
> 1. Hook (near-black): one ad row — "$780 spent → $0 back", red "TRACKING BROKEN". Caption: "This ad spent $780. It made $0 back."
> 2. Health gauge sweeps to **58/100 ORANGE "At risk"**, ROAS 1.04. Caption: "Account 1: 58/100."
> 3. Five verdict chips stamp in: **Fix tracking · Kill · Reduce · Refresh · Scale** (Kill highlighted). Caption: "5 clear verdicts."
> 4. A thumb taps **Approve** on Kill; the ad row greys out. Caption: "You tap approve."
> 5. Coral→amber gradient trust frame: a padlock; a live ad behind glass, untouched. Caption: "Read-only. It proposes — you approve. It never touches a live ad."
> 6. "Two accounts. One audit." — cut to a **second** account, gauge **80/100 GREEN "Healthy"**. Caption: "Account 2: 80/100. Green."
> 7. Money: spend **$9,924 → revenue $21,716**, ROAS **2.19**, "Scale the winners". Caption: "$9,924 in → $21,716 out."
> 8. Grid of **12 AI specialist** avatars. Caption: "12 AI specialists."
> 9. Three pricing cards (AUD): **Starter $97–297**, **Pro $497–1,497 — MOST POPULAR (coral glow ring)**, **Expert $1,997+**. Caption: "From $97 AUD."
> 10. Proof stamp: "Real demo accounts · real numbers · ~6 months of Meta & TikTok data."
> 11. End card: **AdPilot OS V3** logo + gradient sweep; button **"Run your free audit"**; line "Read-only · Meta + TikTok · from $97 AUD · no results guaranteed." Caption: "Know exactly what your ads are doing to your money."
> Style: modern, confident, high-contrast fintech-SaaS; punchy entrance animations, number counters,
> gentle glow pulses; energetic creator-hustle pacing; ~122 BPM feel. **No spoken audio required — all
> messaging via animated captions.** No "guaranteed" claims; no Free tier; prices in AUD. Export
> **MP4, 1080×1920, H.264.**

### (b) ADOBE FIREFLY — hero backdrop / B-roll plates (1080×1920, no text)

> **F1 — night dashboard:** "A dark, moody analytics dashboard backdrop at night, deep near-black
> charcoal #161221 with subtle warm coral and amber bokeh glow in the corners, faint out-of-focus
> rising line-chart and grid, cinematic depth of field, premium fintech SaaS aesthetic, vertical 9:16,
> no text, no logos, large calm negative space in the center for overlay."
>
> **F2 — ambient gradient field:** "A smooth warm gradient field, coral #f9603f flowing into amber
> #ffb224, soft volumetric light, gentle film grain, abstract premium background, vertical 9:16, no
> text, center kept calm for foreground UI overlay."
>
> **F3 (optional B-roll) — hands on phone:** "Close-up of a small-business owner's hands holding a
> smartphone showing a colorful social-media ad feed, warm café lighting in soft bokeh, shallow depth
> of field, authentic candid lifestyle, vertical 9:16, no on-screen text, space at top for a caption."
>
> Post: `image_apply_gaussian_blur` (depth) · `image_add_grain` (cohesion) ·
> `image_adjust_color_temperature` (warm-match) · `image_crop_and_resize` (exact 1080×1920) ·
> `animate_design` (subtle drift for living backdrops).

### (c) RENDERER scene specs (the code spine draws these — see §6 updates)
Dual gauges (58 Orange / 80 Green, labelled two accounts) · the $780→$0 counter with glitch ·
5 verdict pills (Kill filled for Café, Scale filled for Maya) · 3-tier price stack (Pro glowing) ·
12-avatar grid + router hub pulse · end-card lockup. All on `#161221` or transparent for compositing.

---

## 8. Music / sound / export

- **122 BPM** "creator-hustle" pop-trap, bright & trustworthy. Beat grid = 0.492s/beat.
- **Drop 1** on the Café score-needle lock (~8.4s); **5 verdict ticks** on beats; **Approve pop**
  (~17s); **filter-sweep DOWN** for read-only; **riser → Drop 2** on the cut to Maya (~27.6s);
  **Pro-card glow** hit; **resolved impact** on the end card.
- **Muted contract:** every SFX has a visual twin; captions are load-bearing; VO is additive only.
- **Export:** two masters — (a) mute-first with burned-in captions (primary), (b) sound-on VO+music.
  MP4 · 1080×1920 · 30fps CFR · H.264 High · yuv420p · +faststart · sound-on −14 LUFS / ≤−1 dBTP.

---

## 9. Post copy (paid social)

- **Fear:** "One of my ads spent $780 and made $0 back — tracking was silently broken. AdPilot OS V3
  audited the whole account in seconds, scored it 58/100, and flagged the bleeder. It's read-only —
  it proposes, you approve, it never touches your live ads. #smallbusinessmarketing #facebookads #roas"
- **Creator:** "Two demo accounts, one audit. One scored 58/100 with a $780 leak; the other 80/100 at
  2.2× ROAS, ready to scale. Know exactly what your ads are doing to your money. #contentcreator #tiktokads"
- **Agency:** "Client audit in under a minute: 0–100 health score, 12 AI specialists, a safe fix plan
  (fix/kill/reduce/refresh/scale) — read-only, it never edits a live ad. From $97 AUD. #ppc #agencylife"
