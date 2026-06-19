-- AdPilot OS V2 — Organic posts: stored organic (unpaid) post performance, the unit of
-- analysis for the boost engine (lib/organic/*). This is READ-ONLY data about posts the user
-- already published; it never edits, boosts, or charges an ad. Org-scoped, RLS like the rest
-- of the schema. Rows arrive via manual entry / pasted CSV ('manual') or a future sync.

create table if not exists organic_posts (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations(id) on delete cascade,
  platform text not null check (platform in ('meta','tiktok')),
  name text,
  posted_at date,
  reach bigint not null default 0,
  impressions bigint not null default 0,
  engagements bigint not null default 0,
  external_id text,                          -- platform's post/media id, when synced
  source text not null default 'manual'      -- 'manual' (entry/CSV) | future sync sources
    check (source in ('manual','meta_sync','tiktok_sync')),
  created_at timestamptz not null default now()
);

create index if not exists organic_posts_org_posted_idx on organic_posts (organisation_id, posted_at);

-- Synced rows carry the platform's post id; dedupe them so a re-run can't multiply rows.
-- (Manual rows have a null external_id and are kept idempotent by the store's replace-on-save.)
create unique index if not exists organic_posts_external_uniq
  on organic_posts (organisation_id, external_id) where external_id is not null;

alter table organic_posts enable row level security;

-- Org members can read/write their own org's organic posts (mirrors the rest of the schema).
-- Guarded so re-running the migration is idempotent.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='organic_posts' and policyname='organic posts org rw') then
    create policy "organic posts org rw" on organic_posts for all
      using (is_org_member(organisation_id)) with check (is_org_member(organisation_id));
  end if;
end$$;
