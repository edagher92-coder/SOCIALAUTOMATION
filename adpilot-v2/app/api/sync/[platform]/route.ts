import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveOrgId, planForOrg } from "@/lib/org";
import { syncOrgPlatform } from "@/lib/sync/pull";
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
    const orgId = await getActiveOrgId(user.id, user.email ?? undefined);
    if (!can(await planForOrg(orgId), "api_connect")) {
      return NextResponse.json({ error: "API sync is a Pro & Expert feature. Upgrade on Billing to enable it.", upgrade: true }, { status: 402 });
    }
    const admin = createAdminClient();
    const inserted = await syncOrgPlatform(admin, orgId, platform);
    return NextResponse.json({ inserted });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Sync failed" }, { status: 502 });
  }
}
