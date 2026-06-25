-- AdPilot OS V2 — Ingestion run audit log + connected_ad_accounts dedup guard.
--
-- Part 1: `ingestion_runs` — append-only record of every platform data-pull.
--   Read-only signal; it never edits, pauses, or spends on a live ad.
--   IMPORTANT: this table deliberately has NO token column.  Tokens live in
--   `platform_tokens` (encrypted, service-role only).  Nothing here must ever
--   store a credential.
--
-- Part 2: unique constraint on `connected_ad_accounts` (organisation_id, platform,
--   external_account_id) to block duplicate-on-reconnect rows.  A safe de-duplicate
--   step runs first so the constraint can be added even if duplicates already exist.

-- -----------------------------------------------------------------------
-- Part 1: ingestion_runs
-- -----------------------------------------------------------------------

create table if not exists ingestion_runs (
  id               uuid        primary key default gen_random_uuid(),
  organisation_id  uuid        not null references organisations(id) on delete cascade,
  platform         text        not null,          -- 'meta' | 'tiktok'
  account_id       text,                          -- external ad-account id; nullable (run may fail before resolving accounts)
  started_at       timestamptz not null default now(),
  finished_at      timestamptz,
  window_days      integer,
  rows_written     integer     not null default 0,
  status           text        not null,          -- ok | partial | rate_limited | auth_failed | empty | error
  error_message    text,
  graph_version    text,
  created_at       timestamptz not null default now(),

  constraint ingestion_runs_status_chk check (
    status in ('ok', 'partial', 'rate_limited', 'auth_failed', 'empty', 'error')
  )
);

-- Primary query pattern: Command Centre panel — latest runs per org, newest first.
create index if not exists ingestion_runs_org_started_idx
  on ingestion_runs (organisation_id, started_at desc);

alter table ingestion_runs enable row level security;

-- Org members can read their own ingestion history (mirrors the rest of the schema).
-- Writes happen only via the service role (server-side ingest jobs); service role bypasses RLS.
-- Guarded so re-running the migration is idempotent.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'ingestion_runs'
      and policyname = 'ingestion_runs org read'
  ) then
    create policy "ingestion_runs org read" on ingestion_runs for select
      using (is_org_member(organisation_id));
  end if;
end$$;

-- -----------------------------------------------------------------------
-- Part 2: de-duplicate connected_ad_accounts, then add unique constraint
-- -----------------------------------------------------------------------
-- Strategy: within each (organisation_id, platform, external_account_id) group,
-- keep the most-recently created row (highest created_at), breaking ties by the
-- physical ctid (arbitrary but stable within the transaction).  Delete the rest.
-- This is safe to run once; if no duplicates exist, zero rows are deleted.

delete from connected_ad_accounts
where id in (
  select id
  from (
    select
      id,
      row_number() over (
        partition by organisation_id, platform, external_account_id
        order by created_at desc, ctid desc
      ) as rn
    from connected_ad_accounts
  ) ranked
  where rn > 1
);

-- Now add the unique constraint (idempotent: create index … if not exists).
create unique index if not exists connected_ad_accounts_org_platform_acct_uniq
  on connected_ad_accounts (organisation_id, platform, external_account_id);
