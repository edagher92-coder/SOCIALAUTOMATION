-- V6: optional lead→sale close rate (0–1) per org, powering the break-even-CPL read for
-- lead-gen accounts. Null/unset => lead-only accounts keep the conservative lead-quality routing
-- (no CPL verdict). Existing RLS on organisations applies; no backfill (intentionally null).
alter table organisations add column if not exists lead_close_rate numeric;
