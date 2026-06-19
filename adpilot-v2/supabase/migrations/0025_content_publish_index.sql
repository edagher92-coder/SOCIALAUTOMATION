-- Supports the publish rate-limit guard: counting an org's successfully-published posts per
-- platform in the trailing 24h (see lib/publish/rate-limits.ts). The existing index is keyed on
-- (organisation_id, status, scheduled_at), which doesn't serve a platform + published_at count.
create index if not exists content_posts_org_platform_published_idx
  on content_posts (organisation_id, platform, status, published_at);
