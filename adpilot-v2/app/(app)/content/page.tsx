import { createClient } from "@/lib/supabase/server";
import { getActiveOrgId, planForOrg } from "@/lib/org";
import { can, PLAN_LABEL } from "@/lib/entitlements";
import ContentStudio from "@/components/ContentStudio";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const orgId = user ? await getActiveOrgId(user.id, user.email ?? undefined) : "";
  const plan = orgId ? await planForOrg(orgId) : "free";
  const canPublish = can(plan, "content_publish");
  const canStudio = can(plan, "creative_studio");

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-extrabold tracking-tight">Content Studio</h1>
      <p className="mb-2 mt-1 text-muted">Upload your reels &amp; posts, approve them, and publish or schedule to Instagram / Facebook / TikTok.</p>
      <p className="mb-5 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
        🔒 This publishes <b>organic content you approve</b> — it's separate from the read-only ad analysis. We still never edit, pause, or create ads.
      </p>

      {!canPublish ? (
        <div className="rounded-2xl border border-border-subtle bg-gradient-to-br from-brand-50 to-surface-raised p-6 shadow-card">
          <div className="mb-1 text-2xl">🔒</div>
          <h3 className="font-bold">Content publishing is a paid feature</h3>
          <p className="mb-3 mt-1 text-sm text-muted">Your plan ({PLAN_LABEL[plan]}) includes analysis. Upgrade to upload, approve, schedule and publish content — and unlock the AI Creative Studio on Pro &amp; Expert.</p>
          <a href="/billing" className="inline-block rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white">Upgrade</a>
        </div>
      ) : (
        <ContentStudio canStudio={canStudio} />
      )}
    </div>
  );
}
