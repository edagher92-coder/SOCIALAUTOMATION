# Client Usability Tests — AdPilot OS

**Version:** 1.0.0
**Last updated:** 2026-06-14
**Purpose:** Structured usability test protocol for non-technical business owners. Identifies friction points, blocking failures, and time-on-task benchmarks.

---

## Test Overview

### Who Should Run These Tests
- **Tester profile:** A non-technical business owner or office manager who currently manages or oversees paid ads but has no developer or data-analyst background
- **NOT:** The product creator, a digital marketer, or anyone familiar with Claude or AI tools
- **Ideal tester:** A business owner spending $1,000–$5,000/month on Meta ads; comfortable with Google Sheets but not with code

### When to Run
- Before the first sale of the Starter tier
- After any significant change to the Sheets dashboard or onboarding documentation
- When a new SOP is added that affects the core loop

### What the Tester Should NOT Have
- A prior demonstration of AdPilot OS
- Access to this test protocol (do not show them the expected times or pass criteria)
- Support from the product creator during the test (observe only, do not assist)

---

## Pre-Test Setup (Observer Only)

Before the tester begins:
1. Provide the tester with a fresh download link to the AdPilot OS Starter ZIP
2. Provide a test Meta or TikTok CSV export (use Dataset 1 — Clean Account from qa/sample-data-tests.md, printed or in a file)
3. Confirm the tester has: a computer, a Google account, a claude.ai account (can be free)
4. Start a timer
5. Do NOT explain anything — let the tester read the materials themselves
6. Note all moments where the tester hesitates, re-reads, or makes an error

---

## Task 1: Unzip and Open the Product

**Instruction to tester:** "You've just purchased AdPilot OS. Your download just arrived. Please open it and get started."

**Expected steps:**
1. Tester downloads and unzips the file
2. Tester opens README-FIRST.md

**Time target:** Under 3 minutes

**Success criterion:** Tester opens README-FIRST.md without prompting. Does not immediately open other files.

**Common failure points:**
- Tester opens a random file instead of README-FIRST.md (failure: file naming not prominent enough)
- Tester cannot unzip the file on their operating system (failure: need to provide platform-specific instructions)
- Tester gets confused by the folder structure (failure: too many folders at the top level)

**Observer notes field:**
- Time taken: ____
- Did the tester open README-FIRST.md first? YES / NO
- If NO, what did they open? ____
- Any hesitation points: ____

---

## Task 2: Make a Copy of the Dashboard

**Instruction to tester:** "The instructions say to make a copy of the Google Sheets dashboard. Please do that now."

**Expected steps:**
1. Tester clicks the Sheets link in README-FIRST.md
2. Tester goes to File → Make a copy
3. Tester renames the copy (or doesn't — test whether they understand this is needed)

**Time target:** Under 3 minutes

**Success criterion:** Tester has a personal copy of the dashboard in their own Google Drive.

**Common failure points:**
- Tester edits the original template rather than making a copy (this breaks the shared template for future users)
- Tester cannot find the "Make a copy" option
- Tester's Google account requires organisation permission to copy (IT restriction — document as an edge case)

**Observer notes field:**
- Time taken: ____
- Did tester make a copy or edit the original? COPY / ORIGINAL (fail)
- Did tester rename their copy? YES / NO
- Hesitation points: ____

---

## Task 3: Fill In the Config File

**Instruction to tester:** "Please open the configuration file and fill it in for your business." (Point to client-config.yaml in the file list if they are stuck finding it — but note the failure.)

**Expected steps:**
1. Tester opens client-config.yaml in a text editor
2. Tester replaces {{client.name}} with their business name
3. Tester replaces other placeholder values with real numbers
4. Tester saves the file

**Time target:** Under 5 minutes

**Success criterion:** Config file saved with all {{client.*}} placeholders replaced by real values. No placeholders remain.

**Common failure points:**
- Tester does not know what "YAML" is or how to edit it (open in TextEdit/Notepad — does not require understanding YAML)
- Tester replaces the placeholder text but forgets to remove the quotation marks (edge case — document)
- Tester sets target_cpa_aud or target_roas to 0 because they "don't know their targets" (failure: need a prompt or default guidance in the config)
- Tester opens the file in a YAML editor that reformats it unexpectedly (rare but document)

**Observer notes field:**
- Time taken: ____
- Did tester replace all {{client.*}} placeholders? YES / PARTIAL / NO
- Did tester save the file? YES / NO
- Were any placeholders left blank or set to 0? YES / NO — which ones: ____
- Hesitation points: ____

---

## Task 4: Import the CSV Data

**Instruction to tester:** "Please import the test data file into your dashboard." (Hand them the sample CSV from Dataset 1.)

**Expected steps:**
1. Tester opens their Google Sheets copy
2. Tester navigates to the "CSV Import" tab
3. Tester opens the CSV → copies all contents
4. Tester pastes into cell A1 of the CSV Import tab

**Time target:** Under 5 minutes

**Success criterion:** Data is visible in the CSV Import tab AND the Dashboard tab shows calculated metrics (spend, CTR, CPC, CPM visible and non-zero).

**Common failure points:**
- Tester pastes data into the Dashboard tab, not the CSV Import tab
- Tester uses File → Import instead of paste (creates a new sheet rather than populating the correct tab)
- The CSV format uses semicolons instead of commas (locale issue for some European settings — but tester is Australian, low risk)
- Column headers in the test CSV do not match the expected column headers in the dashboard (document which columns caused confusion)

**Observer notes field:**
- Time taken: ____
- Did tester find the CSV Import tab without prompting? YES / NO
- Did data populate in the Dashboard tab? YES / NO
- Did any cells show errors or zeros instead of numbers? YES / NO — which ones: ____
- Hesitation points: ____

---

## Task 5: Run the Audit in Claude

**Instruction to tester:** "Using the instructions in the README, please run an audit on the data you just imported."

**Expected steps:**
1. Tester opens claude.ai
2. Tester locates the audit skill prompt (in skills/meta-ads-audit/SKILL.md or as directed by onboarding)
3. Tester starts a new conversation
4. Tester pastes the system prompt
5. Tester copies the Audit Summary tab content from their Sheets
6. Tester pastes it into Claude with the instruction to run the audit

**Time target:** Under 20 minutes

**Success criterion:** Claude returns an audit response with a health score (0–100) and at least 3 findings.

**Common failure points:**
- Tester cannot find the audit skill file in the folder structure
- Tester does not know what a "system prompt" is and skips the step — audit runs without the correct context (failure: phrasing in README needs to be simpler — "copy this text and paste it at the start of a new Claude conversation")
- Tester is on Claude free and hits a rate limit or context limit mid-audit (failure: need to document that Claude Pro is recommended for accounts with >10 campaigns)
- Tester pastes the wrong thing into Claude (pastes the raw CSV instead of the Audit Summary tab output)
- Claude returns an error or generic response because the prompt was not correctly loaded

**Observer notes field:**
- Time taken: ____
- Did tester successfully load the audit skill prompt? YES / NO
- Did Claude return a health score? YES / NO — score shown: ____
- Did Claude return at least 3 findings? YES / NO
- Was the tester on free or Pro Claude? FREE / PRO
- Hesitation points: ____

---

## Task 6: Generate the Report

**Instruction to tester:** "Please generate a report from the audit results."

**Expected steps:**
1. Tester locates the reporting skill prompt (in skills/ads-reporting-builder/SKILL.md)
2. Tester loads the skill and instructs Claude to generate a report from the audit findings
3. Tester receives a structured report
4. Tester opens the Client Report Template
5. Tester copies the report content into the template

**Time target:** Under 15 minutes

**Success criterion:** A completed (or substantially completed) report document exists with real content — not blank placeholders — in the main sections.

**Common failure points:**
- Tester starts a new Claude conversation and loses the audit context — report is generated without findings (failure: onboarding needs to explicitly say "stay in the same conversation" or "paste the audit findings again")
- Tester cannot find the report template Google Doc link
- Tester copies the report text into the wrong place in the template (e.g. into the header rather than the body)
- The template has too many sections and feels overwhelming

**Observer notes field:**
- Time taken: ____
- Did Claude generate a complete report? YES / PARTIAL / NO
- Did tester successfully populate the report template? YES / PARTIAL / NO
- Any sections left blank: ____
- Hesitation points: ____

---

## Post-Test Interview (5 minutes)

Ask the tester these questions after they finish (or stop):

1. "Overall, how would you rate the experience of setting this up? (1 = very confusing, 5 = very clear)"
   Answer: ____

2. "What was the most confusing step?"
   Answer: ____

3. "Was there anything you almost gave up on?"
   Answer: ____

4. "Is there anything you'd want explained before you started, that wasn't?"
   Answer: ____

5. "Would you use this system monthly? Why or why not?"
   Answer: ____

6. "Does the report feel professional enough to share with a client or business partner?"
   Answer: ____

---

## Scoring and Pass Criteria

| Task | Time Target | Critical (must pass) | Important (should pass) |
|------|------------|---------------------|------------------------|
| 1 — Unzip and open | ≤3 min | Opens README-FIRST.md first | Does not require support |
| 2 — Dashboard copy | ≤3 min | Makes a copy (not editing original) | Completes without support |
| 3 — Config file | ≤5 min | No {{client.*}} left unfilled | Understands what each field is |
| 4 — CSV import | ≤5 min | Dashboard shows real numbers | Pastes to correct tab |
| 5 — Run audit | ≤20 min | Receives health score | 3+ findings returned |
| 6 — Generate report | ≤15 min | Report has real content | Template substantially populated |
| **Total core loop** | **≤45 min** | **All 6 tasks completed** | **No blocking failures** |

**Overall pass:** Total time ≤45 minutes AND all 6 critical criteria met AND post-test clarity rating ≥4/5.

**Partial pass:** Total time ≤60 minutes AND ≤1 critical failure AND post-test clarity rating ≥3/5. Product may ship but identified friction points must be logged as Medium defects.

**Fail:** Any task not completed due to a blocking failure, OR total time >60 minutes, OR clarity rating ≤2/5. Do not ship. Fix the blocking point and re-test.

---

## Observer Instructions

**What you may do:**
- Start and stop the timer
- Take notes
- Count hesitations and re-reads
- Note which specific word, instruction, or UI element caused confusion

**What you may NOT do:**
- Explain any step to the tester
- Point to the correct button or file
- Suggest what to do next
- React to the tester's mistakes (maintain a neutral expression)

**Exception:** If the tester is completely blocked for more than 5 minutes (e.g. they cannot open the file format), you may offer one hint and note it as a failure. "Hint given at [step]" should appear in your observer notes.

---

## Common Root Cause Categories

When documenting failures, use these categories to group findings:

| Code | Category | Example |
|------|----------|---------|
| F-DOC | Documentation clarity | README instruction was ambiguous |
| F-NAV | Navigation / file structure | Couldn't find the right file |
| F-TECH | Technical barrier | Couldn't unzip; couldn't edit YAML |
| F-CLAUDE | Claude interface | Didn't know where to paste the prompt |
| F-DATA | Data handling | Pasted to wrong tab; wrong CSV format |
| F-TIME | Time overrun | Completed correctly but took too long |
| F-CONF | Confidence / motivation | Tester hesitated excessively before acting |
