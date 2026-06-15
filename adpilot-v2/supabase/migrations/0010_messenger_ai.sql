-- AdPilot OS V2 — Messenger LLM-grounded auto-reply (Expert). Ports the uploaded Sam bot's
-- "smart mode": when no payload-rule and no keyword matches, an LLM answers from VERIFIED FACTS
-- only (strict, no-hallucination). Per-channel toggle + facts + brand voice live on the channel.
--   - ai_enabled: opt-in per channel (default off; existing rule logic is unchanged when off).
--   - ai_facts:   the ONLY source of truth the model may answer from (prices, specials, policies…).
--   - ai_voice:   optional brand-voice/persona note (e.g. "friendly, concise, Aussie tone").
-- The webhook reads these via the service role only; sending still needs the channel's token,
-- Meta app review (pages_messaging / instagram_manage_messages / whatsapp_business_messaging),
-- and ANTHROPIC_API_KEY set on the server. No ad-layer access is involved.

alter table messenger_pages add column if not exists ai_enabled boolean not null default false;
alter table messenger_pages add column if not exists ai_facts text;
alter table messenger_pages add column if not exists ai_voice text;
