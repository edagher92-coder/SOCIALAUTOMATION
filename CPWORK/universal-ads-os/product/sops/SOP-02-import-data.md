# SOP-02 — Import Data
**Goal:** ad data in the universal schema, ready to analyse. **Time:** ~10 min.

## Steps (no-code / V1)
1. In Meta Ads Manager: export at **ad level**, daily breakdown, columns incl. spend,
   impressions, reach, clicks, leads, purchases, value, 3-sec plays, ThruPlays.
2. In TikTok Ads Manager: export ad-level daily reporting.
3. Map columns to the universal schema (`api/data-schema.md`); the mapping tables are
   in `automations/manual-csv-upload-workflow.md`.
4. Paste into the Sheets dashboard **RAW_DATA** tab, OR keep as CSV for the engine.
5. Verify with the engine:
   ```bash
   cd tools && python3 -m adpilot analyze <your-export.csv> --avg-sale <X> --margin <Y>
   ```
   (auto-detects Meta vs TikTok headers).

## Quality checks
- Spend with zero impressions → tracking flag. De-dup on (business, platform, ad, date).
- Currency normalised to the client's currency.
## Done when
Rows load and the analyze command prints metrics without errors.
## Next
SOP-03 (audit + health score). 
## Safety
Read-only. No account changes.
