-- V6 P1: trend data foundation (unblocks Phase 3 diagnostics: time-series, trend, forecast).
-- Read-only/analytical; no change to the read-only ad invariant.

-- Time-series read index on the append-only health history (health_scores had no index).
create index if not exists health_scores_org_created_idx
  on health_scores (organisation_id, created_at desc);

-- Per-org per-day account rollup: a compact, fast-to-read daily series for trend/forecast/anomaly,
-- so the engine/dashboard don't re-aggregate raw campaign_snapshots on every read. Upserted by the
-- scheduled scoring path (one row per org per day). Derived data — never PII, never a live write.
create table if not exists account_daily_metrics (
  organisation_id uuid not null references organisations(id) on delete cascade,
  date date not null,
  spend numeric not null default 0,
  impressions numeric not null default 0,
  clicks numeric not null default 0,
  leads numeric not null default 0,
  purchases numeric not null default 0,
  revenue numeric not null default 0,
  health_total numeric,
  health_band text,
  created_at timestamptz not null default now(),
  primary key (organisation_id, date)
);

create index if not exists account_daily_metrics_org_date_idx
  on account_daily_metrics (organisation_id, date desc);

alter table account_daily_metrics enable row level security;
create policy "adm org read" on account_daily_metrics for select
  using (is_org_member(organisation_id));
-- Writes happen via the service role (scheduled scoring); service role bypasses RLS.
