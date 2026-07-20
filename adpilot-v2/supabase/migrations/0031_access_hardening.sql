-- AdPilot OS V6 — release access hardening.
--
-- The original policies treated all members alike, so a `viewer` could write
-- directly through Supabase's Data API. Make the role model enforceable at the
-- database boundary: viewers read, members operate on normal workspace data,
-- and only owners/admins manage credentials and customer-facing automation.

create or replace function public.is_org_member(org uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
    where m.organisation_id = org and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_org_editor(org uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
    where m.organisation_id = org
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin', 'member')
  );
$$;

create or replace function public.is_org_manager(org uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
    where m.organisation_id = org
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin')
  );
$$;

-- Credentials and billing must never be available to browser/Data API clients.
-- Server routes use the service role after their own user/role checks.
drop policy if exists "org members rw" on public.platform_tokens;
drop policy if exists "org members rw" on public.billing_subscriptions;

-- Normal workspace data: all members can read; editors (not viewers) can write.
do $$
declare t text;
begin
  foreach t in array array[
    'campaign_snapshots', 'health_scores', 'recommendations', 'reports',
    'creative_assets', 'content_posts', 'ad_actions', 'alert_rules'
  ] loop
    execute format('drop policy if exists "org members rw" on public.%I', t);
    execute format('drop policy if exists "creative org rw" on public.%I', t);
    execute format('drop policy if exists "content org rw" on public.%I', t);
    execute format('drop policy if exists "ad_actions org rw" on public.%I', t);
    execute format('drop policy if exists "alert_rules org manage" on public.%I', t);
    execute format('create policy %I on public.%I for select using (public.is_org_member(organisation_id))', t || ' members read', t);
    execute format('create policy %I on public.%I for insert with check (public.is_org_editor(organisation_id))', t || ' editors insert', t);
    execute format('create policy %I on public.%I for update using (public.is_org_editor(organisation_id)) with check (public.is_org_editor(organisation_id))', t || ' editors update', t);
    execute format('create policy %I on public.%I for delete using (public.is_org_editor(organisation_id))', t || ' editors delete', t);
  end loop;
end $$;

-- Connections, shared notification destinations, white-label settings, and
-- Messenger rules can alter the organisation's external presence: manager-only.
do $$
declare t text;
begin
  foreach t in array array[
    'connected_ad_accounts', 'notification_rules', 'white_label_profiles',
    'messenger_pages', 'messenger_rules'
  ] loop
    execute format('drop policy if exists "org members rw" on public.%I', t);
    execute format('drop policy if exists "notif org rw" on public.%I', t);
    execute format('drop policy if exists "wl org rw" on public.%I', t);
    execute format('drop policy if exists "msgr pages org rw" on public.%I', t);
    execute format('drop policy if exists "msgr rules org rw" on public.%I', t);
    execute format('create policy %I on public.%I for select using (public.is_org_member(organisation_id))', t || ' members read', t);
    execute format('create policy %I on public.%I for insert with check (public.is_org_manager(organisation_id))', t || ' managers insert', t);
    execute format('create policy %I on public.%I for update using (public.is_org_manager(organisation_id)) with check (public.is_org_manager(organisation_id))', t || ' managers update', t);
    execute format('create policy %I on public.%I for delete using (public.is_org_manager(organisation_id))', t || ' managers delete', t);
  end loop;
end $$;
