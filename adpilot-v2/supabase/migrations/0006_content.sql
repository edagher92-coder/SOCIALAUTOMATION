-- AdPilot OS V2 — Content Studio: organic post/reel upload, approval & scheduled publishing.
-- This is SEPARATE from the read-only ad layer: it only ever publishes organic content
-- the user created and explicitly approved. It never edits, pauses, or creates ads.

create table if not exists content_posts (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations(id) on delete cascade,
  platform text not null check (platform in ('facebook','instagram','tiktok')),
  caption text,
  media_url text,
  media_type text check (media_type in ('image','video','reel')),
  status text not null default 'draft' check (status in ('draft','approved','scheduled','published','failed')),
  scheduled_at timestamptz,
  published_at timestamptz,
  external_id text,           -- platform's post/media id once published
  error text,                 -- last publish error, if any
  source text not null default 'upload',  -- 'upload' (own content) | 'studio' (AI-assisted)
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_posts_org_status_idx on content_posts (organisation_id, status, scheduled_at);

alter table content_posts enable row level security;

-- Org members can read/write their own org's content (mirrors the rest of the schema).
create policy "content org rw" on content_posts for all
  using (is_org_member(organisation_id)) with check (is_org_member(organisation_id));
