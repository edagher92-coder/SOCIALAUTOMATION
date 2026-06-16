-- v4 Wave B: optional monthly ad budget per org, powering the budget_pacing health factor.
-- Null/unset => pacing factor stays neutral (no guess). Existing RLS on organisations applies.
alter table organisations add column if not exists monthly_budget numeric;
