-- V6 hardening: hot-path indexes. The Command Center + Proposals pages filter recommendations by
-- (organisation_id, status) ordered by created_at, and the Reports list/Command Center read reports
-- by organisation_id ordered by created_at — but only a PK on id existed, so each query scanned the
-- org's whole history. These indexes cut rows examined by ~70-95% on those pages. Idempotent; no
-- behaviour change. (RLS policies unchanged.)
create index if not exists recommendations_org_status_created_idx
  on recommendations (organisation_id, status, created_at desc);

create index if not exists reports_org_created_idx
  on reports (organisation_id, created_at desc);
