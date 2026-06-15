-- AdPilot OS V2 — GUARDED ad-write actions (pause / resume / budget on LIVE campaigns).
-- This is the one place the product mutates ad accounts, so it is deliberately heavily gated:
--   Expert tier (ad_write entitlement) + ADS_WRITE_ENABLED env kill-switch + a typed-YES
--   confirmation phrase per action + prior_state captured for one-click revert + full audit.
-- Requires an ads_management write-scope token; without it execution fails closed.
create table if not exists ad_actions (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations(id) on delete cascade,
  platform text not null check (platform in ('meta','tiktok')),
  entity_level text not null check (entity_level in ('campaign','adset','ad')),
  external_entity_id text not null,
  entity_name text,
  action text not null check (action in ('pause','resume','set_budget')),
  params jsonb not null default '{}'::jsonb,
  prior_state jsonb,                 -- captured immediately before execution, for revert
  status text not null default 'proposed' check (status in ('proposed','done','failed','reverted')),
  confirm_phrase text not null,      -- the exact text the user must type to execute
  result text,
  error text,
  requested_by uuid,
  approved_by uuid,
  created_at timestamptz not null default now(),
  executed_at timestamptz,
  reverted_at timestamptz
);
create index if not exists ad_actions_org_status_idx on ad_actions (organisation_id, status, created_at);

alter table ad_actions enable row level security;
create policy "ad_actions org rw" on ad_actions for all
  using (is_org_member(organisation_id)) with check (is_org_member(organisation_id));
