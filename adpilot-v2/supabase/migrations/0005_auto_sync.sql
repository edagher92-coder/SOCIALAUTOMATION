-- AdPilot OS V2 — per-organisation auto-sync cadence.
-- Drives the hourly /api/cron/auto-sync job: it only pulls when an org's cadence is due.
alter table organisations add column if not exists sync_interval_hours integer not null default 24;
alter table organisations add column if not exists last_synced_at timestamptz;

comment on column organisations.sync_interval_hours is
  'Auto-sync cadence in hours. 0 = off, 1 = hourly, 24 = daily, 168 = weekly, or any custom value.';
comment on column organisations.last_synced_at is
  'Last successful auto/manual sync; used by the auto-sync cron to decide when the next pull is due.';
