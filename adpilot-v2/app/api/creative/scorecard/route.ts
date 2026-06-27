import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveOrgId, planForOrg } from "@/lib/org";
import { can } from "@/lib/entitlements";
import { computeCreativeScorecard } from "@/lib/engine/creative";
import { computeWastedSpend } from "@/lib/engine/waste";
import type { Cfg } from "@/lib/engine/types";

export const runtime = "nodejs";

// Query window: last 14 days of snapshots — enough for fatigue detection without
// including stale creative that's been off for weeks.
const WINDOW_DAYS = 14;
const MAX_ROWS = 5000;

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const orgId = await getActiveOrgId(user.id, user.email ?? undefined);
  const plan = await planForOrg(orgId);
  if (!can(plan, "creative_studio")) {
    return NextResponse.json(
      { error: "The Creative Scorecard is a Pro & Expert feature.", upgrade: true, plan },
      { status: 402 },
    );
  }

  const admin = createAdminClient();
  const since = new Date(Date.now() - WINDOW_DAYS * 86400_000).toISOString().slice(0, 10);

  const [snapshotsRes, configRes] = await Promise.all([
    admin
      .from("campaign_snapshots")
      .select(
        "ad_id,ad_name,campaign_name,platform,date,spend,impressions,reach,clicks,ctr,frequency," +
        "leads,purchases,revenue,three_second_views,thruplays,hook_rate,hold_rate,tracking_status",
      )
      .eq("organisation_id", orgId)
      .gte("date", since)
      .order("date", { ascending: true })
      .limit(MAX_ROWS),
    admin
      .from("organisations")
      .select("average_sale_value,gross_margin,currency,lead_close_rate")
      .eq("id", orgId)
      .maybeSingle(),
  ]);

  const snapshots = (snapshotsRes.data || []) as any[];
  const orgCfg = (configRes.data || {}) as any;

  if (!snapshots.length) {
    return NextResponse.json({ scorecard: [], waste: null, windowDays: WINDOW_DAYS, rows: 0 });
  }

  // Map snapshot columns → engine Row fields. Column names differ slightly from the CSV row keys.
  const rows = snapshots.map((s) => ({
    ad_id: s.ad_id ?? undefined,
    ad_name: s.ad_name ?? undefined,
    campaign_name: s.campaign_name ?? undefined,
    platform: s.platform ?? undefined,
    date: s.date ?? undefined,
    spend: Number(s.spend) || 0,
    impressions: Number(s.impressions) || 0,
    reach: Number(s.reach) || 0,
    clicks: Number(s.clicks) || 0,
    ctr: s.ctr != null ? Number(s.ctr) : null,
    frequency: s.frequency != null ? Number(s.frequency) : null,
    leads: Number(s.leads) || 0,
    purchases: Number(s.purchases) || 0,
    revenue: Number(s.revenue) || 0,
    video_3_sec_views: Number(s.three_second_views) || 0,
    thruplay_views: Number(s.thruplays) || 0,
    hook_rate: s.hook_rate != null ? Number(s.hook_rate) : null,
    hold_rate: s.hold_rate != null ? Number(s.hold_rate) : null,
    tracking_status: s.tracking_status ?? "ok",
  }));

  const cfg: Cfg = {
    average_sale_value: Number(orgCfg.average_sale_value) || 200,
    gross_margin: Number(orgCfg.gross_margin) || 0.5,
    currency: orgCfg.currency || "AUD",
    lead_close_rate: orgCfg.lead_close_rate != null ? Number(orgCfg.lead_close_rate) : null,
  };

  const scorecard = computeCreativeScorecard(rows, cfg);
  const totalSpend = rows.reduce((s, r) => s + r.spend, 0);
  const waste = computeWastedSpend(scorecard, totalSpend);
  const currency = orgCfg.currency || "AUD";

  return NextResponse.json({ scorecard, waste, currency, windowDays: WINDOW_DAYS, rows: rows.length });
}
