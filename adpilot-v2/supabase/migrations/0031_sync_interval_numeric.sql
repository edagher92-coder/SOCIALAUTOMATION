-- AdPilot OS V2 — allow sub-hourly auto-sync cadence (e.g. every 30 minutes).
-- Widens sync_interval_hours from integer to numeric so it can hold fractional values.
alter table organisations alter column sync_interval_hours type numeric using sync_interval_hours::numeric;

comment on column organisations.sync_interval_hours is
  'Auto-sync cadence in hours. 0 = off, 0.5 = every 30 min, 1 = hourly, 24 = daily, 168 = weekly, or any custom value.';
