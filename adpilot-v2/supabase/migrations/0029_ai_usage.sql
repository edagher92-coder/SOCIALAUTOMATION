-- AdPilot OS V2 — AI usage telemetry (P1.4).
--
-- Append-only record of every Claude API call: token counts (incl. prompt-cache hits/writes)
-- and the estimated USD cost. Read-only/observability only — writes are best-effort from the AI
-- path (a logging failure must never break a request, mirroring the email-degradation pattern).
-- This table never stores a prompt, a completion, or any client data — counts and cost only.

create table if not exists ai_usage (
  id                 uuid        primary key default gen_random_uuid(),
  organisation_id    uuid        not null references organisations(id) on delete cascade,
  created_at         timestamptz not null default now(),
  model              text        not null,         -- resolved model id (e.g. claude-sonnet-4-6)
  route              text,                          -- which surface made the call (agent id, cron name, …)
  input_tokens       integer     not null default 0,
  output_tokens      integer     not null default 0,
  cache_read_tokens  integer     not null default 0,
  cache_write_tokens integer     not null default 0,
  cost_usd           numeric(12,6) not null default 0
);

-- Primary query pattern: per-org spend over time, newest first.
create index if not exists ai_usage_org_created_idx
  on ai_usage (organisation_id, created_at desc);

alter table ai_usage enable row level security;

-- Org members can read their own AI-usage history (mirrors the rest of the schema).
-- Writes happen only via the service role (server-side AI calls); service role bypasses RLS.
-- Guarded so re-running the migration is idempotent.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'ai_usage'
      and policyname = 'ai_usage org read'
  ) then
    create policy "ai_usage org read" on ai_usage for select
      using (is_org_member(organisation_id));
  end if;
end$$;
