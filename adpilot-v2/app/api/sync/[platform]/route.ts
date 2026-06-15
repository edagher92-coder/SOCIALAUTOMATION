import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveOrgId } from "@/lib/org";
import { decrypt } from "@/lib/crypto";

export const runtime = "nodejs";

const daysAgo = (n: number) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);

async function metaSync(token: string, accountId: string, orgId: string) {
  const act = accountId.startsWith("act_") ? accountId : `act_${accountId}`;
  const fields = "campaign_name,spend,impressions,reach,frequency,clicks,ctr,cpc,cpm";
  const r = await fetch(`https://graph.facebook.com/v21.0/${act}/insights?level=campaign&date_preset=last_30d&time_increment=1&fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(token)}`);
  const j: any = await r.json();
  if (!r.ok) throw new Error(j.error?.message || "Meta API error");
  return (j.data || []).map((d: any) => ({
    organisation_id: orgId, platform: "meta", campaign_name: d.campaign_name, date: d.date_start,
    spend: +d.spend || 0, impressions: +d.impressions || 0, reach: +d.reach || 0, frequency: +d.frequency || 0,
    clicks: +d.clicks || 0, ctr: (+d.ctr || 0) / 100, cpc: +d.cpc || 0, cpm: +d.cpm || 0,
    tracking_status: "ok", source: "meta_api",
  }));
}

async function tiktokSync(token: string, advertiserId: string, orgId: string) {
  const metrics = ["campaign_name", "spend", "impressions", "reach", "frequency", "clicks", "ctr", "cpc", "cpm"];
  const qp = new URLSearchParams({
    advertiser_id: advertiserId, report_type: "BASIC", data_level: "AUCTION_CAMPAIGN",
    dimensions: JSON.stringify(["campaign_id", "stat_time_day"]), metrics: JSON.stringify(metrics),
    start_date: daysAgo(30), end_date: daysAgo(0), page_size: "1000",
  });
  const r = await fetch(`https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/?${qp.toString()}`, { headers: { "Access-Token": token } });
  const j: any = await r.json();
  if (j.code !== 0 && j.code !== undefined) throw new Error(j.message || "TikTok API error");
  return (j.data?.list || []).map((it: any) => {
    const m = it.metrics || {}, dim = it.dimensions || {};
    return {
      organisation_id: orgId, platform: "tiktok", campaign_name: m.campaign_name || dim.campaign_id,
      date: dim.stat_time_day ? String(dim.stat_time_day).slice(0, 10) : daysAgo(0),
      spend: +m.spend || 0, impressions: +m.impressions || 0, reach: +m.reach || 0, frequency: +m.frequency || 0,
      clicks: +m.clicks || 0, ctr: (+m.ctr || 0) / 100, cpc: +m.cpc || 0, cpm: +m.cpm || 0,
      tracking_status: "ok", source: "tiktok_api",
    };
  });
}

export async function POST(req: Request, { params }: { params: { platform: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const platform = params.platform;
  if (platform !== "meta" && platform !== "tiktok") return NextResponse.json({ error: "Unknown platform" }, { status: 404 });

  try {
    const orgId = await getActiveOrgId(user.id, user.email ?? undefined);
    const admin = createAdminClient();
    const { data: tok } = await admin.from("platform_tokens")
      .select("ciphertext,iv,auth_tag").eq("organisation_id", orgId).eq("platform", platform)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!tok?.ciphertext) return NextResponse.json({ error: `No connected ${platform} account. Connect it first.` }, { status: 400 });
    const { data: acct } = await admin.from("connected_ad_accounts")
      .select("external_account_id").eq("organisation_id", orgId).eq("platform", platform)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!acct?.external_account_id) return NextResponse.json({ error: `No ${platform} ad account on file.` }, { status: 400 });

    const token = decrypt({ ciphertext: tok.ciphertext, iv: tok.iv, authTag: tok.auth_tag });
    const rows = platform === "meta"
      ? await metaSync(token, String(acct.external_account_id), orgId)
      : await tiktokSync(token, String(acct.external_account_id), orgId);
    if (rows.length) await admin.from("campaign_snapshots").insert(rows);
    return NextResponse.json({ inserted: rows.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Sync failed" }, { status: 502 });
  }
}
