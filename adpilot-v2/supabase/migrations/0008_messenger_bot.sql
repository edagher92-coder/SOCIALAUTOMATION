-- AdPilot OS V2 — Messenger webhook bot (premium). Stores per-page encrypted Page tokens
-- and keyword/payload auto-reply rules so a single webhook can drive many client pages.
-- Going LIVE additionally requires Meta app review for pages_messaging advanced access +
-- subscribing each page to the app's webhook. Tokens are encrypted (AES-256-GCM); the
-- public webhook reads them via the service role only.

create table if not exists messenger_pages (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations(id) on delete cascade,
  external_page_id text not null,
  display_name text,
  ciphertext text, iv text, auth_tag text,   -- encrypted Page token (write scopes)
  created_at timestamptz not null default now(),
  unique (external_page_id)
);

create table if not exists messenger_rules (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations(id) on delete cascade,
  external_page_id text not null,
  trigger_type text not null check (trigger_type in ('keyword','payload','welcome','default')),
  trigger text,                 -- keyword(s) (comma-separated) or payload (e.g. PRICE); null for welcome/default
  reply text not null,
  priority integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists messenger_rules_page_idx on messenger_rules (external_page_id, trigger_type, priority);

alter table messenger_pages enable row level security;
alter table messenger_rules enable row level security;

create policy "msgr pages org rw" on messenger_pages for all
  using (is_org_member(organisation_id)) with check (is_org_member(organisation_id));
create policy "msgr rules org rw" on messenger_rules for all
  using (is_org_member(organisation_id)) with check (is_org_member(organisation_id));
