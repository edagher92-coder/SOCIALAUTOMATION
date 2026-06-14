# SECURITY.md — AdPilot OS

AdPilot OS connects to ad platforms, CRMs, and money. Treat it accordingly. This
file is binding on the product and on anyone reselling it.

---

## 0. ⚠️ Live finding from the source workspace (action required)
During the current-state audit, two **live secrets** were found in plain text in
the shared Google Drive ("Claude HQ"):
- An **Anthropic API key** (`New Text Document.txt`, begins `sk-ant-api03-…`).
- A **Stripe backup code** (`stripe_backup_code.txt`).

**Do this now:** rotate the Anthropic key, regenerate Stripe backup codes, delete
both files, and remove anyone unexpected from the folder's sharing list. These
files were **not** copied into this repository.

---

## 1. Secrets — never in the product
- **No API keys, tokens, or OAuth secrets** in skills, agents, templates, configs,
  or commits. Ever.
- **No ad-account IDs, app IDs, pixel IDs, business-portfolio IDs, or system-user
  IDs** in universal files. Use `{{client.*}}` variables.
- Tokens live **outside** the repo: environment variables or a git-ignored secrets
  file (e.g. `secrets/meta_token.txt`, `.env`). The Meta toolkit in `tools/` reads
  its token from a path/env you supply — it ships with none.
- Add a `.gitignore` covering `*.token`, `*token*.txt`, `.env`, `secrets/` before
  connecting any real account.

## 2. The live-ad safety model (product behaviour, not optional)
- `live_edit_block: true` — never push edits to a live, spending ad.
- `use_paused_duplicates_only: true` — changes ship as paused duplicates/drafts/proposals.
- `never_delete_archive_instead: true` — archive (reversible), never delete.
- `confirm_before_money_moves: true` — budget/spend changes need a typed human "YES".
- `scale_requires_clean_tracking: true` — no scaling on unclear tracking.
- Client configs may **tighten** these; they may **not** loosen them.

## 3. Platform access discipline
- Prefer **official platform APIs** over browser automation of Ads Manager
  (Ads Manager is gated as high-risk; browser automation is brittle and risky).
- Request **least-privilege** scopes (e.g. `ads_read` + `read_insights` for
  read-only audits; add `ads_management` only for the user who approves changes).
- Tokens are short-lived where possible; document refresh/rotation per client.
- Log who approved each change proposal and when.

## 4. Client data separation
- One `client-config.yaml` per business; never mix clients in one file.
- Private business knowledge lives in `business-context/<client>/`, **not** in the
  core. Ship the sellable core with `business-context/universal/` only.
- For agencies/white-label: isolate each client's exports, reports, and configs.

## 5. Safe packaging for resale
- Before zipping/selling: confirm **zero** secrets, real account IDs, or private
  data are present (run `qa/release-checklist.md`).
- De-duplicate skill packaging (don't ship four copies of one skill).
- Ship the **universal** example business only; strip `snowflow/` and
  `profit-minute-au/` from resale builds.

## 6. Community skill / dependency hygiene
- Treat third-party Claude skills and code with caution: review before installing,
  avoid skills that request broad tool access or hidden network calls.
- Keep dependencies minimal and visible. The Meta toolkit uses the Python standard
  library only (`urllib`) — **no pip installs, no hidden transitive deps**. Prefer
  this pattern; avoid abandoned or opaque packages.
- Keep repo behaviour and documented skill behaviour aligned — no surprise actions.

## 7. Compliance & claims
- No earnings/results guarantees, no misleading or absolute claims in any ad copy
  the system proposes (`paige-ads-policy-safety-agent` enforces this).
- Respect platform advertising policies and local consumer law (AU: ACCC/Australian
  Consumer Law for "no false or misleading representations").

## 8. Incident response (minimum)
1. Rotate the exposed credential immediately.
2. Pause any affected campaigns (status toggle is safe and reversible).
3. Review access logs / sharing lists.
4. Record what happened in `CHANGELOG.md` and notify the account owner.
