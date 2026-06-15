-- AdPilot OS V2 — Phase 4: org economics, multi-client, creative assets, storage.

-- Per-org economics (drive break-even in scheduled scoring).
alter table organisations add column if not exists average_sale_value numeric default 200;
alter table organisations add column if not exists gross_margin numeric default 0.6;

-- Creative assets: link from any AI tool/creator (URL) or upload your own.
create table if not exists creative_assets (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations(id) on delete cascade,
  kind text not null check (kind in ('image','video','audio')),
  source text not null default 'link',          -- link | upload | ai
  provider text,                                  -- e.g. Midjourney, Sora, ElevenLabs, Canva, Upload
  title text,
  url text not null,
  linked_campaign text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
alter table creative_assets enable row level security;
create policy "creative org rw" on creative_assets for all
  using (is_org_member(organisation_id)) with check (is_org_member(organisation_id));

-- Storage bucket for uploaded creative (public read; URLs are the asset links).
insert into storage.buckets (id, name, public)
  values ('creative', 'creative', true)
  on conflict (id) do nothing;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='storage' and policyname='creative upload') then
    create policy "creative upload" on storage.objects for insert to authenticated with check (bucket_id = 'creative');
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and policyname='creative read') then
    create policy "creative read" on storage.objects for select using (bucket_id = 'creative');
  end if;
end$$;
