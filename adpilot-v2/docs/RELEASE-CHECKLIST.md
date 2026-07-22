# AdPilot OS release checklist

Run this against the production deployment, not a preview deployment. Record the
release URL, migration result, API versions, and operator initials in the launch
ticket.

## Before deployment

- [ ] Apply `0001_init.sql` through `0032_content_archiving.sql` in order with
  `supabase db push` (or the Supabase SQL editor) and confirm no migration errors.
- [ ] Set production-only secrets in Vercel. `SUPABASE_SERVICE_ROLE_KEY`,
  `TOKEN_ENCRYPTION_KEY`, `CRON_SECRET`, Stripe secrets, provider tokens, and AI
  keys must never be `NEXT_PUBLIC_*` values or committed files.
- [ ] Confirm that no live paid-ad mutation controls or write credentials are exposed.
  Expert can prepare approval-ready change drafts, but accepted changes are applied
  manually in the advertising platform.
- [ ] Set `META_GRAPH_API_VERSION` and run one real read-only Meta connection,
  one organic publish, and one Messenger send in the release environment. All
  Meta paths must use the same validated version.
- [ ] For TikTok Direct Post, query creator information and present only the
  returned privacy options before publishing. Unreviewed apps must remain
  private-only.

## Security and access controls

- [ ] Verify `viewer` can read but cannot change content, reports, alerts, or
  workspace data; `member` can operate normal workspace data; only `owner` and
  `admin` can connect/disconnect advertising accounts, configure Messenger, or
  start checkout.
- [ ] Confirm the Supabase Data API cannot select `platform_tokens` or
  `billing_subscriptions` with a user session.
- [ ] `GET /api/health` exposes only service status. Use the `CRON_SECRET` Bearer
  header for operator configuration detail; check that responses are not cached.
- [ ] Call every cron with `Authorization: Bearer $CRON_SECRET`; URL query-string
  credentials are intentionally rejected.
- [ ] Trigger a Stripe test checkout for the selected workspace and confirm its
  subscription is written to that workspace, then send a signed Stripe test event.

## Release verification

- [ ] `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` pass
  from the release commit.
- [ ] Sign up as a new user; import a sample CSV; confirm the health score,
  recommendations, report download, and organisation switcher work.
- [ ] Attempt the OAuth flow twice: a completed callback works once, and a replay
  is rejected.
- [ ] Verify all Vercel crons appear on the production deployment. Vercel crons
  do not run on preview deployments.
- [ ] Set up monitoring for `/api/health`, Vercel function errors, Supabase
  database/storage use, Stripe webhook failures, and provider token expiry.
