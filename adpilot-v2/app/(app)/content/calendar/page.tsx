import { createClient } from "@/lib/supabase/server";
import { getActiveOrgId, planForOrg } from "@/lib/org";
import { can, PLAN_LABEL } from "@/lib/entitlements";
import ContentCalendar from "@/components/ContentCalendar";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const orgId = user ? await getActiveOrgId(user.id, user.email ?? undefined) : "";
  const plan = orgId ? await planForOrg(orgId) : "free";
  const canPublish = can(plan, "content_publish");

  return (
    <div className="max-w-3xl">
      <div className="mb-1 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">Content Calendar</h1>
        <a href="/content" className="rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-bold text-ink transition hover:border-brand hover:text-brand">Queue &amp; composer →</a>
      </div>
      <p className="mb-5 mt-1 text-muted">Everything scheduled and published across Instagram, Facebook &amp; TikTok, at a glance.</p>

      {!canPublish ? (
        <div className="rounded-2xl border border-border-subtle bg-gradient-to-br from-brand-50 to-surface-raised p-6 shadow-card">
          <div className="mb-1 text-2xl">🔒</div>
          <h3 className="font-bold">Content scheduling is a paid feature</h3>
          <p className="mb-3 mt-1 text-sm text-muted">Your plan ({PLAN_LABEL[plan]}) includes analysis. Upgrade to schedule and publish content across your channels.</p>
          <a href="/billing" className="inline-block rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white">Upgrade</a>
        </div>
      ) : (
        <ContentCalendar />
      )}
    </div>
  );
}
