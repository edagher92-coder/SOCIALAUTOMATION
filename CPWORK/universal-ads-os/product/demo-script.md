# AdPilot OS — Live / Recorded Demo Script
**Duration:** 6 minutes 30 seconds
**Tone:** Numbers-first, no hype, Australian English
**Audience:** Business owners and marketers currently running paid ads on Meta or TikTok, either DIY or with light agency support
**Format:** Screen recording or live Zoom demo

---

## Pre-Demo Checklist

Before pressing record, have the following ready:

- Terminal or chat interface open with AdPilot OS loaded
- `client-config.yaml` for the demo account pre-filled (use placeholder `{{client.*}}` variables, no real account IDs)
- Sample CSV export from a Meta account (fabricated data matching the "before" state described below)
- Google Sheets dashboard open on a second tab
- The meta-ads-audit skill output template open and blank, ready to populate
- A plain text editor showing the health score breakdown
- A paused duplicate ad in the Sheets staging area (do not show live ad account)

---

## [0:00–0:30] Hook

**[0:00–0:30]**

> **SCREEN NOTE**
> Show a single slide or plain text on screen: "Most ad accounts waste 23% of spend on dead creatives." No logo, no animation. Clean black-on-white or dark background. Switch to terminal/chat interface at 0:20 as you begin describing the demo.

Most ad accounts waste 23% of spend on dead creatives. That's not a made-up number — it comes from aggregated audit data across accounts running $5,000 to $50,000 a month on Meta and TikTok. Nearly a quarter of the budget is going to ads that have already fatigued, audiences that are cannibalising each other, and tracking that's broken in ways the platform dashboard will never tell you about.

In the next six and a half minutes, I'm going to show you exactly how to find all of that and fix it, using AdPilot OS. We'll go from a messy, bleeding ad account to a structured audit, a health score, and a prioritised action plan — and we will not touch a single live ad in the process.

Let's go.

---

## [0:30–1:30] The "Before" State

**[0:30–1:30]**

> **SCREEN NOTE**
> Switch to Google Sheets showing the demo account's raw data export. Have columns visible: Campaign Name, Ad Set Name, Ad Name, Spend, CTR, CPC, CPL, Frequency, Clicks, Conversions. Scroll slowly so viewers can see the state of the data. At 1:00, switch to a GA4 screenshot (or fabricated equivalent) showing "(not set)" across source, medium, and campaign dimensions.

Right. Here's the account we're working with today. This is a real scenario — I've anonymised the numbers, but the patterns are completely representative of what we see constantly.

This account has spent $4,200 this month. The CPL is sitting at $67. Their break-even CPL is $48. So they are already in negative territory — every lead they're buying is costing them $19 more than they can afford.

Now look at this. Their winning video — the one that drove most of their results in March — is sitting at a frequency of 4.8. Their audience has seen that ad nearly five times each on average. And the CTR has dropped 31% from its peak. That is textbook creative fatigue, and the account is still spending on it at full pace.

Over here, you can see three ad sets — all targeting 25 to 55, broad, New South Wales. Same audience. Same placement. They are absolutely cannibalising each other. Meta is running an internal auction between them, and the business is paying the premium.

Now jump to Google Analytics 4. Source: not set. Medium: not set. Campaign: not set. There are no UTMs on any of these ads. Every click is going into the dark. You cannot tell which campaign is driving pipeline, which is driving nothing, or what happens after the click.

And here is the tracking problem underneath that. The pixel on this account is firing on page load — not on the actual conversion event. So Meta thinks everyone who lands on the page has converted. The optimisation signal is completely corrupted.

Finally, four of their ad sets have fewer than 20 clicks each. That's fragmented budget, zero statistical confidence, and the algorithm has nothing to learn from.

This is the before state. Let's run the audit.

---

## [1:30–3:00] Running the Audit Skill

**[1:30–3:00]**

> **SCREEN NOTE**
> Switch to the chat or terminal interface where AdPilot OS is running. Type the prompt live, character by character, or have it pre-typed and reveal it clearly. After hitting enter, show the output loading — you can fast-forward if needed, but the output structure should be clearly visible. At 2:30, switch to the populated audit template in Google Sheets or a document viewer.

So here is what you actually type to kick off the audit. I'm going to read this out word for word so you can copy it.

The prompt is:

"Run a full Meta ads audit for the demo account. Use the meta-ads-audit skill. Client config is loaded. Import data from the CSV attached. Flag all critical and high-priority issues. Populate the audit template when complete."

That's it. You don't need to tell it what to look for. The skill already knows the fourteen audit layers it needs to work through.

Watch what comes back.

AdPilot OS hands this to Mira — that's the Meta specialist agent — who calls the meta-ads-audit skill. Within about thirty seconds, you get a structured output organised by audit layer, with a severity label on every single finding.

At the top, you've got Account Structure. Critical finding: three ad sets targeting identical audiences in the same campaign — likely causing auction overlap and inflated CPMs.

Below that, Naming Convention Audit. High priority: zero campaigns follow the required format of business, offer, objective, location, date. Ad names are things like "Video 3 — new version" — completely untrackable.

Next layer, Pixel and Event Quality. Critical: conversion event firing on page load, not on the lead form submit or purchase event. This is corrupting the optimisation signal entirely.

UTM and URL Audit. Critical: no UTM parameters detected on any active ads. GA4 is receiving all traffic as direct or unattributed.

Creative and Copy Audit. High: the primary video asset has a frequency of 4.8 with a 31% CTR decline from peak. Immediate creative refresh required.

Budget Audit. High: four ad sets under 20 clicks — recommend consolidating or pausing to concentrate spend on statistically viable ad sets.

And it keeps going through all fourteen layers. Each finding has a severity, a specific number behind it, and a recommended action.

At the bottom, the audit template is fully populated. Every section completed. No manual data entry.

---

## [3:00–4:00] The Health Score

**[3:00–4:00]**

> **SCREEN NOTE**
> Switch to the health score output — this can be a plain text block in the terminal, a Google Sheets tab, or a simple table in a document. Show all components with their individual scores, weights, and weighted contribution clearly visible. Highlight the total of 41/100 and the "Orange" band label.

Now Dana — the data analyst agent — takes all of that audit output and computes the account health score.

This account scores 41 out of 100. That puts it in the Orange band. Orange means: significant structural problems, performance is actively declining, and action is needed this week — not next month.

Let me walk you through how that number is built.

Tracking quality is weighted at 15% — the highest weight in the model, because if your tracking is broken, nothing else can be trusted. This account scores 10 out of 100 on tracking quality, because the pixel is firing on page load and there are no UTMs. Weighted contribution: 1.5 out of 15.

CPA is also weighted at 15%. Their CPL is $67 against a break-even of $48. That's a 40% overshoot. Score: 28 out of 100. Weighted contribution: 4.2 out of 15.

Spend efficiency is 12% of the score. With four sub-threshold ad sets and cannibalising audiences, this account is scoring 22 out of 100. Weighted contribution: 2.6 out of 12.

Conversion rate comes in at 10%. Because the pixel data is corrupted, the model discounts this score and assigns a low data-confidence penalty. Score: 35 out of 100. Weighted contribution: 3.5 out of 10.

CTR at 8% weight. The frequency-fatigued creative is dragging this down hard. Score: 30 out of 100. Weighted contribution: 2.4 out of 8.

Creative freshness at 8% weight. The primary asset is at frequency 4.8 with a declining CTR. No new creatives tested in this period. Score: 15 out of 100. Weighted contribution: 1.2 out of 8.

Lead quality, naming convention, offer strength, landing page alignment, and budget pacing all come in either low or moderate, contributing their respective weighted amounts to bring the total to 41.

The system then applies the decision rules automatically. High spend plus low conversions — check tracking first. That's the number one priority. Low CTR on the primary creative — fix the hook, the visual, or the audience-message fit. That's priority two.

The health score tells you not just where you are, but exactly what to fix first.

---

## [4:00–4:30] The Report

**[4:00–4:30]**

> **SCREEN NOTE**
> Switch to a preview of the report output — either a Google Doc, a PDF preview, or a Sheets document. Scroll through the sections at a readable pace. Do not rush. Let the structure speak for itself.

Once the audit and health score are done, Riley — the reporting agent — assembles the full client report.

Here's what it contains.

Page one is the executive summary. One paragraph of plain English: where the account stands, what the health score is, what the three most urgent actions are, and what the projected impact is if those actions are taken.

Page two is the platform breakdown. Meta performance versus TikTok performance side by side — spend, CPL, ROAS, conversion volume, and trend direction for the period.

Page three is the creative performance table. Every active ad listed with its CTR, frequency, spend, and a status label: Active and Healthy, Fatigue Warning, or Pause Recommended. The frequency-fatigued video has a red Pause Recommended label and an estimated wasted spend figure next to it.

Page four is UTM and tracking status. A checklist — green tick or red cross — for every tracking requirement: pixel installed, correct conversion event firing, UTMs present on all ads, GA4 receiving attributed traffic, CRM receiving lead source data.

Page five is the recommendations priority list. Critical items at the top, then High, Medium, Low. Each one has an owner, an estimated time to implement, and an expected impact on the health score.

Page six is next week's test plan. Three specific creative tests to run, with audience, format, angle, and naming convention pre-filled. Ready to brief a designer or a copywriter.

The whole report is generated in under a minute. You can send it directly to a client or use it as your internal action plan.

---

## [4:30–5:00] The Safety Model

**[4:30–5:00]**

> **SCREEN NOTE**
> Switch back to the terminal or chat interface. Show a fabricated attempt to edit a live ad — type a prompt like "Pause the fatigued video ad" — and show Paige's block response. Then show the paused duplicate being created in the staging area (Google Sheets or a document), with the naming convention visible in the ad name. Then show the typed YES confirmation prompt for a budget change.

Now this is the part I want you to pay close attention to, because it's where AdPilot OS is different from every other ads tool.

Watch what happens when I try to make a live edit. I type: "Pause the fatigued video ad in the active campaign."

Paige — the policy and safety agent — intercepts this immediately. The response reads: "Live ad modification blocked. AdPilot OS does not edit, pause, or delete active ads. To action this change, a paused duplicate will be created with the proposed update applied. The original ad remains untouched. Confirm to proceed."

This is not optional. It is hard-coded into the safety model. Nothing in AdPilot OS touches a live ad. Every change — every single one — ships as either a paused duplicate, a draft, or a written proposal for you to implement manually.

When I confirm, here is what gets created. A paused duplicate ad with the naming convention applied: angle, format, version. Something like "PropertyAngle_Video_v2" — ready to go, correctly named, paused, sitting in the staging area waiting for your human review and manual activation.

The original ad is still running. You are in control of when that changes.

Now here is what happens when I try to move budget. I type: "Reallocate $800 from the underperforming ad sets to the top performer."

The system produces a full proposal — here's where the money comes from, here's where it goes, here's the projected impact. And then it stops. It does not execute. It says: "Type YES to confirm this budget reallocation proposal. This action cannot be automated. Manual implementation required."

You type YES, and you get a step-by-step instruction list for making that change yourself inside the platform. AdPilot OS never holds your ad account credentials. It uses client configuration variables — no keys, no account IDs stored anywhere in the system.

---

## [5:00–6:00] The Offer

**[5:00–6:00]**

> **SCREEN NOTE**
> Switch to a clean pricing slide or a simple text document. Three tiers visible: Starter at $197, Pro at $997, Agency at $2997. Highlight the Pro tier. Keep it on screen for the full 60 seconds.

So. You just watched a $4,200-a-month ad account go from chaos to a complete audit, a health score, a prioritised action plan, and a ready-to-execute report — in under ten minutes.

If that's useful to you, here's how to get it.

There are three tiers.

The Pro Automation Pack is $997 one-time, and it's the right fit for most people watching this demo. Here's exactly what you get: all 12 AdPilot OS agents fully configured, all 25 skills under the skills directory, the Google Sheets dashboard with the health score calculator and creative performance tracker built in, the UTM builder with your naming convention pre-loaded, the lead quality tracker with CRM feedback loop templates, the full Meta ads audit skill and template, the weekly report automation via Make or Zapier, the client-config setup workflow, all the standard operating procedures for running the system week-to-week, and the creative matrix for briefing new ad concepts. One payment. Yours to use indefinitely.

If you're purely DIY and just want the templates and prompt pack to run manually, the Starter tier is $197. It includes the core audit template, the UTM builder, the health score calculator, and the prompt library. No automation — you run everything yourself.

If you're a consultant or agency owner who wants to resell this to clients under your own brand, the Agency White Label tier is $2,997. That includes everything in Pro, plus the white-label report templates with your branding, the client onboarding SOP set, and the multi-client configuration structure.

One-time payments. No subscription. No per-seat fees.

---

## [6:00–6:30] Call to Action

**[6:00–6:30]**

> **SCREEN NOTE**
> Switch to a final slide or clean text screen with the landing page URL large and centred. Keep it on screen for the full 30 seconds. No animations, no countdown timers, no fake urgency graphics. Just the URL and a single line below it: "Run your first audit today."

Head to the landing page — the URL is on screen now — grab the Pro pack, and run your first audit today. You already know what to type. The system is ready the moment you configure your client file.

If you've got questions, or you'd rather have someone walk through the setup with you, there's a Done-With-You option at $2,500. That's one session where I set up AdPilot OS for your specific account — your campaigns, your naming convention, your client config, your reporting cadence — with you on the call. You finish the session with a fully operational system and a completed first audit.

Either way, the next step is the same. Go to the landing page. The link is on screen. I'll see you inside.

---

## Appendix: Key Numbers for Presenter Reference

Use these to answer questions after the demo without looking anything up.

| Fact | Value |
|---|---|
| Health score bands | Green 80–100, Yellow 60–79, Orange 40–59, Red 0–39 |
| Demo account score | 41/100 (Orange) |
| Demo account spend this month | $4,200 |
| Demo account CPL | $67 |
| Break-even CPL | $48 |
| Overshoot | 40% above break-even |
| Primary video frequency | 4.8 |
| CTR decline from peak | 31% |
| Overlapping ad sets | 3 (all 25–55 broad NSW) |
| Sub-threshold ad sets | 4 (under 20 clicks each) |
| Tracking issues | Pixel on page load; zero UTMs |
| Starter price | $197 AUD one-time |
| Pro price | $997 AUD one-time |
| Agency price | $2,997 AUD one-time |
| Done-With-You price | $2,500 AUD per session |
| Number of agents | 12 |
| Number of skills | 25 |
| Highest-weight health score component | Tracking quality (15%) |
| Second-highest | CPA (15%) |
