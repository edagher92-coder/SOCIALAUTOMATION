-- v4 Wave B: threshold-alert event log. Read-only signal — alerts inform, never change an ad.
create table if not exists alert_events (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations(id) on delete cascade,
  rule_id text not null,
  severity text not null,            -- 'warning' | 'critical'
  campaign_name text,
  metric text,
  value numeric,
  threshold numeric,
  message text,
  status text not null default 'open', -- 'open' | 'resolved'
  dedupe_key text not null,          -- rule + campaign; one open hit per key
  created_at timestamptz not null default now(),
  unique (organisation_id, dedupe_key)
);

create index if not exists alert_events_org_idx on alert_events (organisation_id, created_at desc);

alter table alert_events enable row level security;

create policy "alert_events org read" on alert_events for select
  using (is_org_member(organisation_id));
-- Writes happen via the service role (scheduled scoring); service role bypasses RLS.
