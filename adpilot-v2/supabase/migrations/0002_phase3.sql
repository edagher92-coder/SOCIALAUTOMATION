-- AdPilot OS V2 — Phase 3: OAuth token storage, notifications, white-label.

-- Encrypted token columns (text base64 — AES-256-GCM in app layer).
alter table platform_tokens add column if not exists ciphertext text;
alter table platform_tokens add column if not exists iv text;
alter table platform_tokens add column if not exists auth_tag text;

-- Notification preferences (per org).
create table if not exists notification_rules (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations(id) on delete cascade,
  email text,
  weekly_digest boolean not null default true,
  critical_alerts boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organisation_id)
);

-- White-label branding (per org).
create table if not exists white_label_profiles (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations(id) on delete cascade,
  brand_name text,
  logo_url text,
  primary_color text default '#0b5fff',
  support_email text,
  created_at timestamptz not null default now(),
  unique (organisation_id)
);

alter table notification_rules enable row level security;
alter table white_label_profiles enable row level security;

create policy "notif org rw" on notification_rules for all
  using (is_org_member(organisation_id)) with check (is_org_member(organisation_id));
create policy "wl org rw" on white_label_profiles for all
  using (is_org_member(organisation_id)) with check (is_org_member(organisation_id));
