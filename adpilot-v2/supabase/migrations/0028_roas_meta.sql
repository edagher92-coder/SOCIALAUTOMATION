-- AdPilot OS V2 — capture Meta's own reported purchase ROAS for a read-only reconciliation.
--
-- `roas_meta` stores Meta's `purchase_roas` (its attribution-window / view-through ROAS) per
-- ad-day row. It is surfaced ONLY side-by-side with the derived revenue/spend ROAS as an
-- "attribution-window difference" for the human to judge — it is NEVER fed into any health
-- factor, verdict, or the derived ROAS. Additive + nullable: CSV rows and TikTok (no equivalent
-- field) simply leave it null.
alter table campaign_snapshots add column if not exists roas_meta numeric;
