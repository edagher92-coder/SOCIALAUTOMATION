import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveOrgId, planForOrg } from "@/lib/org";
import { syncOrgPlatform, type Platform } from "@/lib/sync/pull";
import { scoreAndAlertOrg } from "@/lib/cron/score";
import { can } from "@/lib/entitlements";

export const runtime = "nodejs";
export const maxDuration = 60;

// "Run my first audit" — the one-click bridge between connecting and seeing a score.
//
// Connecting (OAuth or dev-token) pulls data immediately but the Campaign Health Score
// is only produced by the scheduled crons. For a freshly connected account that means an
// empty Command Center until the next auto-sync fires. This route closes that gap on demand:
// it pulls every connected platform (reusing the shared idempotent puller) and then runs the
// SAME scoring path the cron uses (scoreAndAlertOrg) — no engine logic is duplicated here.
//
// READ-ONLY: this only reads insights and writes to our own tables. It never edits an ad.
const PLATFORMS: Platform[] = ["meta", "tiktok"];

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  try {
    const orgId = await getActiveOrgId(user.id, user.email ?? undefined);
    if (!can(await planForOrg(orgId), "api_connect")) {
      return NextResponse.json(
        { error: "Running an audit from a live connection is a Pro & Expert feature. Upgrade on Billing to enable it.", upgrade: true },
        { status: 402 },
      );
    }

    const admin = createAdminClient();
    const { data: accts } = await admin.from("connected_ad_accounts")
      .select("platform").eq("organisation_id", orgId).eq("status", "connected");
    const connected = new Set((accts || []).map((a: any) => a.platform));
    const targets = PLATFORMS.filter((p) => connected.has(p));
    if (targets.length === 0) {
      return NextResponse.json(
        { error: "No connected account to audit yet — connect Meta or TikTok above first." },
        { status: 409 },
      );
    }

    // Pull every connected platform. Per-platform isolation: one platform's API hiccup
    // shouldn't sink the whole audit — we score on whatever we did manage to pull.
    let rows = 0;
    let pulled = false;
    const syncErrors: string[] = [];
    const settled = await Promise.allSettled(targets.map((p) => syncOrgPlatform(admin, orgId, p)));
    for (let i = 0; i < targets.length; i++) {
      const r = settled[i];
      if (r.status === "fulfilled") { rows += r.value as number; pulled = true; }
      else syncErrors.push(`${targets[i]}: ${(r.reason as any)?.message || "sync failed"}`);
    }
    // Hard fail only when nothing could be pulled at all — give the platform's own message.
    if (!pulled) {
      return NextResponse.json(
        { error: syncErrors[0] || "Couldn't pull any data — check the connection and try again." },
        { status: 502 },
      );
    }

    // Score with the shared cron path so a manual first audit and an auto-sync are identical.
    const { data: org } = await admin.from("organisations")
      .select("id,name,average_sale_value,gross_margin,monthly_budget,lead_close_rate")
      .eq("id", orgId).maybeSingle();
    await admin.from("organisations").update({ last_synced_at: new Date().toISOString() }).eq("id", orgId);
    const { scored } = await scoreAndAlertOrg(admin, (org ?? { id: orgId }) as any);

    // Read the score we just wrote so the UI can celebrate the actual number.
    let total: number | null = null;
    let band: string | null = null;
    if (scored) {
      const { data: latest } = await admin.from("health_scores")
        .select("total,band").eq("organisation_id", orgId)
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      total = (latest as any)?.total ?? null;
      band = (latest as any)?.band ?? null;
    }

    return NextResponse.json({
      rows, scored, total, band,
      // Non-fatal per-platform notes (e.g. one platform rate-limited) so the UI can mention them.
      syncErrors: syncErrors.length ? syncErrors : undefined,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Audit failed" }, { status: 502 });
  }
}
