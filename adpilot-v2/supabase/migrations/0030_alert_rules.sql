-- AdPilot OS V2 — configurable alert rules (P5.2).
--
-- User-configurable rule library that generalises the 4 hard-coded alerts.ts rules. A rule is DATA;
-- the pure evaluator (lib/rules/evaluator.ts) turns it into an alert/proposal. Rules NEVER execute an
-- ad change — they are read-only signals, inert until a human acts (the read-only invariant holds).
-- The 13 ALT-001..013 presets (lib/rules/presets.ts) are the seed library + free-tier fallback.

create table if not exists alert_rules (
  id               uuid        primary key default gen_random_uuid(),
  organisation_id  uuid        not null references organisations(id) on delete cascade,
  name             text        not null,
  metric           text        not null,          -- spend|cpl|cpa|cpc|cpm|ctr|roas|frequency|leads|purchases|conversions
  operator         text        not null,          -- gt|gte|lt|lte|eq|zscore_gt|zscore_lt|pct_change_gt|pct_change_lt
  threshold        numeric     not null default 0,
  window_days      integer,                        -- baseline window for rolling operators
  min_volume_gate  integer,                        -- min impressions before the rule may fire
  min_spend_gate   numeric,                         -- only fire when spend ≥ this
  severity         text        not null default 'warning',
  scope            text        not null default 'campaign',
  platform         text,                            -- 'meta' | 'tiktok' | null (any)
  rule_group       text,                            -- AND-group id (collective anomaly)
  group_logic      text,                            -- 'and' | null
  enabled          boolean     not null default true,
  message          text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint alert_rules_severity_chk check (severity in ('info', 'warning', 'critical')),
  constraint alert_rules_scope_chk    check (scope in ('account', 'campaign', 'ad'))
);

create index if not exists alert_rules_org_idx on alert_rules (organisation_id);

alter table alert_rules enable row level security;

-- Org members fully MANAGE their own rules (configured in the Advanced rule-builder UI), unlike the
-- read-only audit tables. Service role bypasses RLS for the scoring cron. Idempotent guard.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'alert_rules' and policyname = 'alert_rules org manage'
  ) then
    create policy "alert_rules org manage" on alert_rules for all
      using (is_org_member(organisation_id))
      with check (is_org_member(organisation_id));
  end if;
end$$;
