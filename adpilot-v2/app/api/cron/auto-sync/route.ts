import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncOrgPlatform, type Platform } from "@/lib/sync/pull";
import { scoreAndAlertOrg } from "@/lib/cron/score";
import { can, normalisePlan } from "@/lib/entitlements";

export const runtime = "nodejs";
export const maxDuration = 60;

// Cadence-driven auto-sync. Runs hourly (Vercel cron) and, per org, only pulls when the
// org's chosen cadence is due — then re-scores + alerts. This is what makes the product
// "no prompts once access is given": connect once, pick a cadence, it runs itself.
//   sync_interval_hours: 0 = off · 1 = hourly · 24 = daily · 168 = weekly · or any custom value.
const PLATFORMS: Platform[] = ["meta", "tiktok"];

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  // Fail closed: never run an unauthenticated sweep.
  if (!secret) return NextResponse.json({ error: "Cron not configured (set CRON_SECRET)." }, { status: 503 });
  const url = new URL(req.url);
  const ok = req.headers.get("authorization") === `Bearer ${secret}` || url.searchParams.get("key") === secret;
  if (!ok) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const admin = createAdminClient();
  const { data: orgs } = await admin.from("organisations")
    .select("id,name,average_sale_value,gross_margin,sync_interval_hours,last_synced_at");

  // Auto-sync is a top-two-tier feature: map every org's active plan up front.
  const { data: subs } = await admin.from("billing_subscriptions").select("organisation_id,plan,status");
  const planFor = new Map<string, string>();
  for (const s of subs || []) if ((s as any).status === "active") planFor.set((s as any).organisation_id, (s as any).plan);

  const now = Date.now();
  let synced = 0, rows = 0, scored = 0, skipped = 0;

  for (const org of orgs || []) {
    if (!can(normalisePlan(planFor.get(org.id)), "auto_sync")) { skipped++; continue; } // plan gate

    const interval = Number((org as any).sync_interval_hours ?? 24);
    if (!interval || interval <= 0) { skipped++; continue; } // off

    const last = (org as any).last_synced_at ? new Date((org as any).last_synced_at).getTime() : 0;
    const dueMs = interval * 3_600_000 - 300_000; // 5-min slack for cron jitter
    if (last && now - last < dueMs) { skipped++; continue; } // not due yet

    const { data: accts } = await admin.from("connected_ad_accounts")
      .select("platform").eq("organisation_id", org.id).eq("status", "connected");
    const connected = new Set((accts || []).map((a: any) => a.platform));
    if (connected.size === 0) { skipped++; continue; }

    let pulled = 0, didSync = false;
    for (const p of PLATFORMS) {
      if (!connected.has(p)) continue;
      try { pulled += await syncOrgPlatform(admin, org.id, p); didSync = true; }
      catch { /* token/account issue on this platform — skip, others still run */ }
    }

    if (didSync) {
      await admin.from("organisations").update({ last_synced_at: new Date().toISOString() }).eq("id", org.id);
      synced++; rows += pulled;
      try { const r = await scoreAndAlertOrg(admin, org as any); if (r.scored) scored++; } catch { /* isolate */ }
    } else {
      skipped++;
    }
  }

  return NextResponse.json({ synced, rows, scored, skipped });
}
