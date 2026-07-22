import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveOrgId, planForOrg } from "@/lib/org";
import { syncOrgPlatform } from "@/lib/sync/pull";
import { scoreAndAlertOrg } from "@/lib/cron/score";
import { can } from "@/lib/entitlements";

export const runtime = "nodejs";

// Manual "Sync now" — same idempotent puller the auto-sync cron uses.
export async function POST(req: Request, props: { params: Promise<{ platform: string }> }) {
  const params = await props.params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const platform = params.platform;
  if (platform !== "meta" && platform !== "tiktok") return NextResponse.json({ error: "Unknown platform" }, { status: 404 });

  try {
    const orgId = await getActiveOrgId(user.id, user.email ?? undefined, "editor");
    if (!orgId) return NextResponse.json({ error: "You have read-only access to this workspace." }, { status: 403 });
    if (!can(await planForOrg(orgId), "api_connect")) {
      return NextResponse.json({ error: "API sync is a Pro & Expert feature. Upgrade on Billing to enable it.", upgrade: true }, { status: 402 });
    }
    const admin = createAdminClient();
    const inserted = await syncOrgPlatform(admin, orgId, platform);

    // Re-score after a manual pull, exactly like the auto-sync cron — so "Sync now" produces a
    // fresh Campaign Health Score (previously only the cron re-scored). Advance the cadence clock
    // too, so the dashboard's "last pull" and the next auto-sync due-time reflect this manual sync.
    await admin.from("organisations").update({ last_synced_at: new Date().toISOString() }).eq("id", orgId);
    let scored = false;
    const { data: org } = await admin.from("organisations")
      .select("id,name,average_sale_value,gross_margin,monthly_budget,lead_close_rate")
      .eq("id", orgId).maybeSingle();
    if (org) {
      // Isolation: scoring failures (e.g. no snapshots yet) must never fail the sync itself.
      try { scored = (await scoreAndAlertOrg(admin, org as any)).scored; } catch { /* best-effort */ }
    }
    return NextResponse.json({ inserted, scored });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Sync failed" }, { status: 502 });
  }
}
