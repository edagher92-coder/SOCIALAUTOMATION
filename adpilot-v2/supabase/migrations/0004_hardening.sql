-- AdPilot OS V2 — security/correctness hardening (from QA review).

-- The original encrypted_token column was NOT NULL, but the app now stores tokens
-- in ciphertext/iv/auth_tag. Make the legacy column nullable so OAuth inserts work.
alter table platform_tokens alter column encrypted_token drop not null;

-- Idempotent Stripe webhooks: dedupe subscriptions by stripe_subscription_id.
create unique index if not exists billing_subscriptions_stripe_sub_uniq
  on billing_subscriptions (stripe_subscription_id)
  where stripe_subscription_id is not null and stripe_subscription_id <> '';
