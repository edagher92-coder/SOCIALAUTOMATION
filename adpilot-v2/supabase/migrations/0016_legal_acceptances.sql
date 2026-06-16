-- AdPilot OS V4 — Legal acceptance audit trail.
-- Records each time a user accepts a versioned legal document (Terms / Privacy) at signup.
-- content_hash pins exactly which rendered document the user agreed to, so a later text
-- change is always distinguishable from the version a user originally accepted.
create table if not exists legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organisation_id uuid references organisations(id) on delete set null,
  document text not null check (document in ('terms','privacy')),
  version text not null,
  content_hash text not null,
  accepted_at timestamptz not null default now()
);
create index if not exists legal_acceptances_user_idx on legal_acceptances (user_id, document, accepted_at);

alter table legal_acceptances enable row level security;

-- A user may read and create only their own acceptance rows.
create policy "legal_acceptances own select" on legal_acceptances for select
  using (user_id = auth.uid());
create policy "legal_acceptances own insert" on legal_acceptances for insert
  with check (user_id = auth.uid());
