-- AdPilot OS V4 — schema parity for ad-level sync.
-- The engine's universal FIELDS (lib/engine/schema.ts) and the enriched ad-level
-- Meta/TikTok pull (lib/sync/pull.ts) write columns that some campaign_snapshots
-- deployments predate. Add every missing column idempotently so API-synced ad rows
-- carry full identity, budgets, video, social and derived columns — no data loss,
-- no double-count. (campaign_snapshots already has RLS + the "org members rw"
-- policy from 0001_init.sql; this migration changes no policy.)
alter table campaign_snapshots add column if not exists campaign_id text;
alter table campaign_snapshots add column if not exists adset_id text;
alter table campaign_snapshots add column if not exists ad_id text;
alter table campaign_snapshots add column if not exists ad_name text;
alter table campaign_snapshots add column if not exists daily_budget numeric;
alter table campaign_snapshots add column if not exists lifetime_budget numeric;
alter table campaign_snapshots add column if not exists six_second_views numeric;
alter table campaign_snapshots add column if not exists comments numeric;
alter table campaign_snapshots add column if not exists shares numeric;
alter table campaign_snapshots add column if not exists saves numeric;
alter table campaign_snapshots add column if not exists sales_count numeric;
alter table campaign_snapshots add column if not exists gross_profit numeric;
alter table campaign_snapshots add column if not exists utm_content text;
alter table campaign_snapshots add column if not exists utm_term text;
alter table campaign_snapshots add column if not exists recommendation text;
alter table campaign_snapshots add column if not exists notes text;
