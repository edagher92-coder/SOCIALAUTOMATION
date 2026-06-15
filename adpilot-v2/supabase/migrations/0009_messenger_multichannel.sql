-- AdPilot OS V2 — Messenger bot → multi-channel (Instagram DM + WhatsApp) + business hours.
-- Brings the in-product bot to parity with the meta-messaging-bot skill:
--   - channel column: 'messenger' rows also serve Instagram DM; 'whatsapp' rows are a WABA phone.
--   - business_hours per channel for hours-aware greeting vs away message.
--   - messenger_threads tracks last-greeted per sender for the first-message greeting cooldown.

alter table messenger_pages add column if not exists channel text not null default 'messenger';
alter table messenger_pages add column if not exists business_hours jsonb;
-- channel: 'messenger' (Messenger + IG, token = Page token) | 'whatsapp' (external_page_id = phone_number_id, token = WhatsApp token)
alter table messenger_pages drop constraint if exists messenger_pages_channel_check;
alter table messenger_pages add constraint messenger_pages_channel_check check (channel in ('messenger','whatsapp'));

-- Allow the 'away' rule type (hours-aware away message).
alter table messenger_rules drop constraint if exists messenger_rules_trigger_type_check;
alter table messenger_rules add constraint messenger_rules_trigger_type_check
  check (trigger_type in ('keyword','payload','welcome','away','default'));

-- First-message greeting cooldown (per page/channel + sender). Service-role only.
create table if not exists messenger_threads (
  external_page_id text not null,
  sender_id text not null,
  last_greeted_at timestamptz not null default now(),
  primary key (external_page_id, sender_id)
);
alter table messenger_threads enable row level security;
