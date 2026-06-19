import "server-only";
import { decrypt } from "@/lib/crypto";

// Reusable read-only data pull for Meta & TikTok, shared by the manual Sync button,
// the dev-token connect flow, the OAuth callback, and the scheduled auto-sync cron.
//
// SCOPES ARE READ-ONLY AND UNCHANGED: Meta `ads_read,read_insights`; TikTok `ads.read`.
// This module never writes to the ad platform — it only reads insights and upserts
// into our own `campaign_snapshots`.
//
// We pull at AD level (not campaign) and extract conversions (leads / purchases /
// revenue) plus video metrics, so API-synced accounts no longer look like "spend with
// zero results" and stop tripping a FALSE CRITICAL tracking finding in the health engine.
export type Platform = "meta" | "tiktok";

const daysAgo = (n: number) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
export const SYNC_WINDOW_DAYS = 30;

const num = (v: any): number => {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

// ---------------------------------------------------------------------------
// Conversion extraction — PURE helpers (no I/O), exported for unit testing.
// ---------------------------------------------------------------------------

// Meta returns conversions in `actions[]` (counts) and `action_values[]` (monetary),
// each `{ action_type, value }`. Action types vary by event configuration, so we match
// a small allow-list per outcome. Returns plain numbers (0 when absent).
export type MetaAction = { action_type?: string; value?: any };

const META_LEAD_TYPES = new Set(["lead", "onsite_conversion.lead_grouped", "leadgen.other"]);
const META_PURCHASE_TYPES = new Set(["purchase", "omni_purchase"]);
// Landing page views are NOT a valid Ads Insights field — Meta returns them inside `actions[]`.
// Requesting `landing_page_views` in the `fields` param fails with
// "(#100) landing_page_views is not valid for fields param", so we read it from actions here.
const META_LPV_TYPES = new Set(["landing_page_view", "omni_landing_page_view"]);

export function extractMetaConversions(
  actions?: MetaAction[] | null,
  actionValues?: MetaAction[] | null,
): { leads: number; purchases: number; revenue: number; landing_page_views: number } {
  let leads = 0;
  let purchases = 0;
  let revenue = 0;
  let landing_page_views = 0;

  for (const a of actions || []) {
    const t = String(a?.action_type || "");
    if (META_LEAD_TYPES.has(t)) leads += num(a?.value);
    else if (META_PURCHASE_TYPES.has(t)) purchases += num(a?.value);
    else if (META_LPV_TYPES.has(t)) landing_page_views += num(a?.value);
  }
  // Revenue comes from the monetary `action_values[]`, summing the purchase value(s).
  for (const a of actionValues || []) {
    const t = String(a?.action_type || "");
    if (META_PURCHASE_TYPES.has(t)) revenue += num(a?.value);
  }

  return { leads, purchases, revenue, landing_page_views };
}

export async function metaPull(token: string, accountId: string, orgId: string) {
  const act = accountId.startsWith("act_") ? accountId : `act_${accountId}`;
  // AD level so conversions land on the ad row the engine groups/scores by.
  const fields = [
    "campaign_id", "campaign_name", "adset_id", "adset_name", "ad_id", "ad_name",
    "spend", "impressions", "reach", "clicks", "frequency", "ctr", "cpc", "cpm",
    "actions", "action_values",
    "video_play_actions", "video_thruplay_watched_actions",
  ].join(",");
  const r = await fetch(`https://graph.facebook.com/v21.0/${act}/insights?level=ad&date_preset=last_30d&time_increment=1&fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(token)}`);
  const j: any = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error?.message || `Meta API error (HTTP ${r.status})`);
  return (j.data || []).map((d: any) => {
    const conv = extractMetaConversions(d.actions, d.action_values);
    // Meta reports video metrics as `[{ action_type, value }]` arrays; the "video_view"
    // entry carries the count. 3s plays = video_play_actions; thruplays = video_thruplay_watched_actions.
    const firstVal = (arr?: MetaAction[] | null) => num((arr || [])[0]?.value);
    return {
      organisation_id: orgId, platform: "meta",
      campaign_id: d.campaign_id ?? null, campaign_name: d.campaign_name,
      adset_id: d.adset_id ?? null, adset_name: d.adset_name ?? null,
      ad_id: d.ad_id ?? null, ad_name: d.ad_name ?? null,
      date: d.date_start,
      spend: num(d.spend), impressions: num(d.impressions), reach: num(d.reach), frequency: num(d.frequency),
      clicks: num(d.clicks), ctr: num(d.ctr) / 100, cpc: num(d.cpc), cpm: num(d.cpm),
      landing_page_views: conv.landing_page_views,
      leads: conv.leads, purchases: conv.purchases, revenue: conv.revenue,
      three_second_views: firstVal(d.video_play_actions),
      thruplays: firstVal(d.video_thruplay_watched_actions),
      tracking_status: "ok", source: "meta_api",
    };
  });
}

export async function tiktokPull(token: string, advertiserId: string, orgId: string) {
  // AD level so conversions land on the ad row the engine groups/scores by.
  const metrics = [
    "campaign_id", "campaign_name", "adgroup_id", "ad_id", "ad_name",
    "spend", "impressions", "reach", "frequency", "clicks", "ctr", "cpc", "cpm",
    "conversion", "total_complete_payment_rate",
    "video_play_actions", "video_watched_2s", "video_watched_6s", "video_views_p100",
  ];
  const qp = new URLSearchParams({
    advertiser_id: advertiserId, report_type: "BASIC", data_level: "AUCTION_AD",
    dimensions: JSON.stringify(["ad_id", "stat_time_day"]), metrics: JSON.stringify(metrics),
    start_date: daysAgo(SYNC_WINDOW_DAYS), end_date: daysAgo(0), page_size: "1000",
  });
  const r = await fetch(`https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/?${qp.toString()}`, { headers: { "Access-Token": token } });
  const j: any = await r.json().catch(() => ({}));
  // TikTok signals errors via a non-zero `code` in a 200 body; also fail on HTTP errors.
  if (!r.ok) throw new Error(j?.message || `TikTok API error (HTTP ${r.status})`);
  if (typeof j.code === "number" && j.code !== 0) throw new Error(j.message || `TikTok API error (code ${j.code})`);
  return (j.data?.list || []).map((it: any) => {
    const m = it.metrics || {}, dim = it.dimensions || {};
    // TikTok reports conversions in `conversion`; monetary value (when the advertiser
    // tracks payment value) in `total_complete_payment` / `total_purchase_value`.
    const purchases = num(m.conversion);
    const revenue = num(m.total_complete_payment ?? m.total_purchase_value ?? m.total_complete_payment_value);
    return {
      organisation_id: orgId, platform: "tiktok",
      campaign_id: m.campaign_id ?? dim.campaign_id ?? null, campaign_name: m.campaign_name || dim.campaign_id,
      adset_id: m.adgroup_id ?? null, adset_name: m.adgroup_name ?? null,
      ad_id: m.ad_id ?? dim.ad_id ?? null, ad_name: m.ad_name ?? null,
      date: dim.stat_time_day ? String(dim.stat_time_day).slice(0, 10) : daysAgo(0),
      spend: num(m.spend), impressions: num(m.impressions), reach: num(m.reach), frequency: num(m.frequency),
      clicks: num(m.clicks), ctr: num(m.ctr) / 100, cpc: num(m.cpc), cpm: num(m.cpm),
      leads: 0, purchases, revenue,
      video_views: num(m.video_play_actions),
      three_second_views: num(m.video_watched_2s),
      six_second_views: num(m.video_watched_6s),
      thruplays: num(m.video_views_p100),
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
  // De-duplicate account ids so the same account isn't pulled twice (would inflate row counts).
  const ids: string[] = Array.from(new Set(
    (accts || []).map((a: any) => String(a.external_account_id ?? "").trim()).filter(Boolean),
  ));
  if (ids.length === 0) throw new Error(`No ${platform} ad account on file.`);

  const token = decrypt({ ciphertext: tok.ciphertext, iv: tok.iv, authTag: tok.auth_tag });
  // Accumulate across every connected account for this platform. If any account's pull
  // fails we throw — callers (manual sync / auto-sync) decide whether to swallow per-platform.
  let rows: any[] = [];
  for (const id of ids) {
    rows = rows.concat(platform === "meta" ? await metaPull(token, id, orgId) : await tiktokPull(token, id, orgId));
  }

  // Idempotent refresh: clear the API-sourced rows in the rolling window, then insert.
  // CSV-imported rows (source = 'csv') are never touched. Surface DB errors so a silently
  // failed delete/insert doesn't report a bogus success.
  const { error: delErr } = await admin.from("campaign_snapshots").delete()
    .eq("organisation_id", orgId).eq("platform", platform).eq("source", `${platform}_api`)
    .gte("date", daysAgo(SYNC_WINDOW_DAYS));
  if (delErr) throw new Error(delErr.message || "Failed to clear stale snapshots");
  if (rows.length) {
    const { error: insErr } = await admin.from("campaign_snapshots").insert(rows);
    if (insErr) throw new Error(insErr.message || "Failed to write snapshots");
  }
  return rows.length;
}
