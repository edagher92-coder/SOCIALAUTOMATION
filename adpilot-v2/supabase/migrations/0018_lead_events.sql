-- AdPilot OS V4 — Wave B: inbound lead/CRM events.
--
-- Populates the dormant lead_quality_score loop from signed CRM/lead webhooks.
-- Stores ONLY hashed PII (email_hash / phone_hash — one-way salted SHA-256 from
-- lib/pii.ts) plus non-PII attribution. No plaintext contact details, ever.

create table if not exists lead_events (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations(id) on delete cascade,
  event_id text,                 -- provider event id; drives idempotency
  lead_id text,                  -- provider-side lead/contact id (not PII)
  platform text,                 -- attribution source platform, e.g. 'meta'
  campaign_name text,
  status text,                   -- lead.status_changed status, e.g. 'won'
  sale_value_aud numeric,        -- AUD sale value on sale.recorded
  lead_quality_score numeric,    -- 0..100 quality signal fed into scoring
  email_hash text,               -- sha256(normalised email + pepper) — never plaintext
  phone_hash text,               -- sha256(normalised phone + pepper) — never plaintext
  source text,                   -- ingest source tag, e.g. 'crm_webhook'
  closed_date date,
  created_at timestamptz default now()
);

-- Idempotency: a repeated webhook delivery with the same (org, event_id) is a no-op.
create unique index if not exists lead_events_org_event_uidx
  on lead_events (organisation_id, event_id);

alter table lead_events enable row level security;

-- Org members may read their own lead events (mirror 0002). Writes happen via the
-- service-role admin client in the webhook route, which bypasses RLS.
create policy "lead_events org select" on lead_events for select
  using (is_org_member(organisation_id));
