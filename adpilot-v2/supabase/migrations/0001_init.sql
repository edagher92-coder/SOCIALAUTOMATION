-- AdPilot OS V2 — initial schema with multi-tenant Row-Level Security.
-- Every business-data row carries organisation_id; users only see rows for orgs
-- they belong to. Tokens are stored encrypted; audit_logs are append-only.

create extension if not exists "pgcrypto";

-- ---------- Identity & tenancy ----------
create table organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  currency text not null default 'AUD',
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now()
);

create type member_role as enum ('owner','admin','member','viewer');

create table memberships (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role member_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (organisation_id, user_id)
);

-- membership helper used by every RLS policy
create or replace function is_org_member(org uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from memberships m
    where m.organisation_id = org and m.user_id = auth.uid()
  );
$$;

-- ---------- Ad accounts & tokens ----------
create table connected_ad_accounts (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations(id) on delete cascade,
  platform text not null check (platform in ('meta','tiktok')),
  external_account_id text not null,
  display_name text,
  status text not null default 'connected',
  created_at timestamptz not null default now()
);

-- Encrypted OAuth tokens. Encrypt/decrypt in the app layer (KMS/Vault); never select to client.
create table platform_tokens (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations(id) on delete cascade,
  ad_account_id uuid references connected_ad_accounts(id) on delete cascade,
  platform text not null,
  encrypted_token bytea not null,
  scopes text[],
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- Campaign data (universal schema, one row per ad per day) ----------
create table campaign_snapshots (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations(id) on delete cascade,
  platform text not null,
  campaign_id text, campaign_name text,
  adset_id text, adset_name text,
  ad_id text, ad_name text,
  date date not null,
  objective text, budget_type text,
  spend numeric, impressions bigint, reach bigint, frequency numeric,
  clicks bigint, ctr numeric, cpc numeric, cpm numeric,
  landing_page_views bigint, leads bigint, purchases bigint, revenue numeric,
  video_views bigint, three_second_views bigint, thruplays bigint,
  hook_rate numeric, hold_rate numeric,
  lead_quality_score numeric, tracking_status text,
  utm_source text, utm_medium text, utm_campaign text,
  source text not null default 'csv',
  created_at timestamptz not null default now()
);
create index on campaign_snapshots (organisation_id, date);
create index on campaign_snapshots (organisation_id, platform, ad_id, date);

create table health_scores (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations(id) on delete cascade,
  scope text not null default 'account',     -- account | campaign
  campaign_name text,
  total numeric not null, band text not null,
  breakdown jsonb not null,
  data_confidence numeric,
  period_start date, period_end date,
  created_at timestamptz not null default now()
);

create table recommendations (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations(id) on delete cascade,
  verdict text not null,                      -- keep|kill|scale|reduce|refresh|fix-tracking|...
  entity_name text, platform text,
  reason text, proposal text,
  confidence numeric, status text not null default 'open',  -- open|approved|dismissed|done
  created_at timestamptz not null default now()
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations(id) on delete cascade,
  title text, period text, payload jsonb not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table billing_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations(id) on delete cascade,
  stripe_customer_id text, stripe_subscription_id text,
  plan text, status text,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

-- Append-only audit log
create table audit_logs (
  id bigint generated always as identity primary key,
  organisation_id uuid references organisations(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  action text not null, detail jsonb,
  created_at timestamptz not null default now()
);

-- ---------- RLS ----------
alter table organisations enable row level security;
alter table profiles enable row level security;
alter table memberships enable row level security;
alter table connected_ad_accounts enable row level security;
alter table platform_tokens enable row level security;
alter table campaign_snapshots enable row level security;
alter table health_scores enable row level security;
alter table recommendations enable row level security;
alter table reports enable row level security;
alter table billing_subscriptions enable row level security;
alter table audit_logs enable row level security;

-- profiles: a user sees/edits only their own profile
create policy "own profile" on profiles for all using (id = auth.uid()) with check (id = auth.uid());

-- organisations: members can read; owners/admins update
create policy "org read" on organisations for select using (is_org_member(id));

-- memberships: a user can see memberships of orgs they belong to
create policy "membership read" on memberships for select using (is_org_member(organisation_id));

-- Generic org-scoped policy applied to all business-data tables
do $$
declare t text;
begin
  foreach t in array array[
    'connected_ad_accounts','platform_tokens','campaign_snapshots','health_scores',
    'recommendations','reports','billing_subscriptions'
  ] loop
    execute format('create policy "org members rw" on %I for all using (is_org_member(organisation_id)) with check (is_org_member(organisation_id));', t);
  end loop;
end$$;

-- audit_logs: members can read their org's logs; inserts go through the service role only
create policy "audit read" on audit_logs for select using (is_org_member(organisation_id));

-- NOTE: platform_tokens.encrypted_token must never be returned to the browser.
-- Access it only via server code with the service role + app-layer decryption.
