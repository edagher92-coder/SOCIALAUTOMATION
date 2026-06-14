# AdPilot OS — Engine (`tools/`)

The executable core. Most "ads tools" ship dashboards and prompts; AdPilot OS also
ships a **dependency-free, tested engine** that turns ad exports into metrics, a
0–100 health score, and **safe** decision proposals — and **self-verifies** against
the documented QA cases.

> Pure Python standard library. **No pip installs. No hidden dependencies.**
> No secrets, no account IDs — config comes from flags/env (see `SECURITY.md`).

## What's here
```
tools/
  adpilot/            the engine (importable package)
    metrics.py        all formulas (zero-division safe)
    health.py         canonical 13-factor health score (0-100) + bands
    schema.py         universal schema + Meta/TikTok column mapping
    decisions.py      safe verdict engine (keep/kill/scale/refresh/fix-tracking/…)
    ingest.py         CSV -> normalised rows + computed metrics
    report.py         numbers-first text report
    __main__.py       CLI
    tests/            self-verifying QA suite + fixtures
  meta_ads_api.py     Meta Graph API toolkit (read + guarded writes, token from env)
  tiktok_ads_api.py   TikTok read-only reporting client skeleton (token from env)
```

## Run it
```bash
cd CPWORK/universal-ads-os/tools

# 1. Prove the numbers are correct (runs qa/ test cases against the engine)
python3 -m adpilot selftest          # -> "ALL PASS ✅", exit 0

# 2. Analyse an export (Meta, TikTok, or universal CSV)
python3 -m adpilot analyze adpilot/tests/fixtures/universal_sample.csv \
        --business "Example Co" --avg-sale 200 --margin 0.6

# 3. Health-score worked example
python3 -m adpilot health
```

`analyze` auto-detects Meta vs TikTok export headers, or pass `--platform meta|tiktok`.

## Why this is hard to replicate
1. **Safe by construction.** `decisions.py` can only ever return a *proposal*
   (`safe: True`); there is **no** code path that edits a live ad, and **no**
   delete function anywhere. The optimiser literally cannot wreck an account.
2. **Cross-platform, break-even-led.** One schema for Meta + TikTok; verdicts are
   driven by **break-even CPA/ROAS and MER**, not vanity metrics.
3. **Self-verifying.** The QA cases in `qa/` are executable — `selftest` fails the
   build if any formula drifts. Buyers/agencies can prove correctness in one command.
4. **Zero-dependency + zero-secret.** Runs anywhere Python runs; nothing to install,
   nothing to leak. Resale-safe.

## Live API (optional, V3)
- `meta_ads_api.py`: reads + status toggles allowed; budget changes require a typed
  YES; archive-only (no delete). `META_AD_ACCOUNT` + `META_TOKEN` from env.
- `tiktok_ads_api.py`: read-only reporting skeleton; `TIKTOK_ADVERTISER_ID` +
  `TIKTOK_TOKEN` from env. Maps reporting fields into the universal schema.

See `api/meta-api-plan.md` and `api/tiktok-api-plan.md`.
