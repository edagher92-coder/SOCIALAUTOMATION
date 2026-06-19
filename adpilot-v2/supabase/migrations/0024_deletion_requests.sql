-- Audit log of data-deletion requests: the Meta data-deletion callback and public
-- email requests (POST /api/data-deletion). Lets the back-office prove a request was
-- received and track its actioning — a Meta App Review expectation.
--
-- No PII is stored: `subject_hash` is a one-way SHA-256 of the subject (email / Meta
-- user id), never the raw value. Requests arrive UNAUTHENTICATED (Meta / public), so
-- there is no organisation to scope to: RLS is ENABLED with NO policies, which means the
-- anon + authenticated roles can never read or write it. Only the service role (which
-- bypasses RLS) inserts on receipt and actions the request from a back-office job.
create table if not exists deletion_requests (
  id uuid primary key default gen_random_uuid(),
  subject_hash text not null,
  request_type text not null,                       -- 'meta' | 'email'
  confirmation_code text not null,
  status text not null default 'received',          -- 'received' | 'processing' | 'done' | 'failed'
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists deletion_requests_subject_idx on deletion_requests (subject_hash);
create index if not exists deletion_requests_status_idx on deletion_requests (status, created_at desc);

alter table deletion_requests enable row level security;
-- No policies by design — service role only (it bypasses RLS).
