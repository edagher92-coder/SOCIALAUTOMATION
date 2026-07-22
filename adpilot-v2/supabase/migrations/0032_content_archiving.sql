-- AdPilot OS V7 — preserve content history instead of deleting it.

alter table public.content_posts
  add column if not exists archived_at timestamptz;

alter table public.content_posts
  drop constraint if exists content_posts_status_check;

alter table public.content_posts
  add constraint content_posts_status_check
  check (status in ('draft', 'approved', 'scheduled', 'published', 'failed', 'archived'));

create index if not exists content_posts_org_archived_idx
  on public.content_posts (organisation_id, archived_at desc)
  where status = 'archived';

-- Approval-ready paid-ad change drafts are also archived, never deleted. V7
-- contains no execution path; this status preserves the prior audit trail.
alter table public.ad_actions
  drop constraint if exists ad_actions_status_check;

alter table public.ad_actions
  add constraint ad_actions_status_check
  check (status in ('proposed', 'done', 'failed', 'reverted', 'cancelled'));
