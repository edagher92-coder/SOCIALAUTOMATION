-- AdPilot OS V2 — refreshable knowledge store. The committed lib/agents/knowledge.ts is
-- the durable baseline; the weekly /api/cron/refresh-knowledge job upserts fresher,
-- web-researched versions here. Workspace-global reference data (not org-scoped):
-- RLS is enabled with NO policy, so it is readable/writable only via the service role
-- (the app reads it server-side with the admin client). Falls back to the baseline if empty.
create table if not exists knowledge_docs (
  domain text primary key check (domain in ('meta','tiktok','policy','seo')),
  title text,
  body text not null,
  sources jsonb not null default '[]'::jsonb,
  model text,
  updated_at timestamptz not null default now()
);

alter table knowledge_docs enable row level security;
