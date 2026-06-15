import "server-only";
import { decrypt } from "@/lib/crypto";

// Reusable read-only data pull for Meta & TikTok, shared by the manual Sync button,
// the dev-token connect flow, the OAuth callback, and the scheduled auto-sync cron.
export type Platform = "meta" | "tiktok";

const daysAgo = (n: number) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
export const SYNC_WINDOW_DAYS = 30;

export async function metaPull(token: string, accountId: string, orgId: string) {
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

export async function tiktokPull(token: string, advertiserId: string, orgId: string) {
  const metrics = ["campaign_name", "spend", "impressions", "reach", "frequency", "clicks", "ctr", "cpc", "cpm"];
  const qp = new URLSearchParams({
    advertiser_id: advertiserId, report_type: "BASIC", data_level: "AUCTION_CAMPAIGN",
    dimensions: JSON.stringify(["campaign_id", "stat_time_day"]), metrics: JSON.stringify(metrics),
    start_date: daysAgo(SYNC_WINDOW_DAYS), end_date: daysAgo(0), page_size: "1000",
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

/**
 * Pull fresh insights for one org+platform using the stored encrypted token, across
 * every connected ad account for that platform. Idempotent: it replaces the rolling
 * 30-day API window so repeated syncs never double-count. Returns the row count written.
 * Throws on hard errors (no token / account / API failure); callers decide whether to swallow.
 */
export async function syncOrgPlatform(admin: any, orgId: string, platform: Platform): Promise<number> {
  const { data: tok } = await admin.from("platform_tokens")
    .select("ciphertext,iv,auth_tag").eq("organisation_id", orgId).eq("platform", platform)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!tok?.ciphertext) throw new Error(`No connected ${platform} account. Connect it first.`);

  const { data: accts } = await admin.from("connected_ad_accounts")
    .select("external_account_id").eq("organisation_id", orgId).eq("platform", platform).eq("status", "connected");
  const ids = (accts || []).map((a: any) => String(a.external_account_id)).filter(Boolean);
  if (ids.length === 0) throw new Error(`No ${platform} ad account on file.`);

  const token = decrypt({ ciphertext: tok.ciphertext, iv: tok.iv, authTag: tok.auth_tag });
  let rows: any[] = [];
  for (const id of ids) {
    rows = rows.concat(platform === "meta" ? await metaPull(token, id, orgId) : await tiktokPull(token, id, orgId));
  }

  // Idempotent refresh: clear the API-sourced rows in the rolling window, then insert.
  // CSV-imported rows (source = 'csv') are never touched.
  await admin.from("campaign_snapshots").delete()
    .eq("organisation_id", orgId).eq("platform", platform).eq("source", `${platform}_api`)
    .gte("date", daysAgo(SYNC_WINDOW_DAYS));
  if (rows.length) await admin.from("campaign_snapshots").insert(rows);
  return rows.length;
}
