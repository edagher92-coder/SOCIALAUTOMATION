import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { decrypt } from "@/lib/crypto";
import type { AudienceInsights } from "./types";
import { metaGenderAgeToRows, shareMapToNamed, onlineToHourly } from "./parse";

// Live follower demographics from the official platform APIs, using the connection the user
// already authorised in Connect. Aggregate + anonymised only (the platforms never expose
// individuals; breakdowns need ~100+ followers). Everything here fails CLOSED: any missing
// connection, scope, or unexpected payload makes getLiveAudience return null so the caller
// falls back to the clearly-labelled sample — we never pass partial/empty data off as real.

const GRAPH = "https://graph.facebook.com/v21.0";
const TT = "https://business-api.tiktok.com/open_api/v1.3";

// Pull a named metric's latest value object out of a Graph /insights response.
function insightValue(resp: any, name: string): Record<string, number> | null {
  const row = (resp?.data || []).find((d: any) => d?.name === name);
  const v = row?.values?.[row.values.length - 1]?.value;
  return v && typeof v === "object" ? (v as Record<string, number>) : null;
}

// ---- live fetchers (best-effort; throw/return null → sample fallback) ----

async function gget(path: string, token: string, params: Record<string, string>): Promise<any> {
  const qs = new URLSearchParams({ ...params, access_token: token });
  const r = await fetch(`${GRAPH}/${path}?${qs.toString()}`);
  const j: any = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error?.message || `Graph API error (HTTP ${r.status})`);
  return j;
}

// Facebook Page + linked Instagram follower demographics. Discovers the Page/IG from the token
// (needs pages_read_engagement / instagram_manage_insights — owner-gated like the live ad audit).
export async function fetchMetaAudience(token: string): Promise<AudienceInsights | null> {
  // Discover a managed Page (and its linked IG business account) from the token.
  const pages = await gget("me/accounts", token, { fields: "id,name,followers_count,instagram_business_account", limit: "1" });
  const page = pages?.data?.[0];
  if (!page?.id) return null;

  const ig = page.instagram_business_account?.id;
  if (ig) {
    // Prefer Instagram audience (richer demographics) when the Page has a linked IG account.
    const handleResp = await gget(`${ig}`, token, { fields: "username,followers_count" });
    const ins = await gget(`${ig}/insights`, token, { metric: "audience_gender_age,audience_country,audience_locale", period: "lifetime" });
    const ageGender = metaGenderAgeToRows(insightValue(ins, "audience_gender_age") || {});
    if (!ageGender.length) return null; // < ~100 followers ⇒ platform withholds breakdowns
    return {
      platform: "instagram",
      handle: handleResp?.username ? `@${handleResp.username}` : page.name || "your account",
      followerCount: Number(handleResp?.followers_count) || Number(page.followers_count) || 0,
      ageGender,
      topLocations: shareMapToNamed(insightValue(ins, "audience_country") || {}),
      topLanguages: shareMapToNamed(insightValue(ins, "audience_locale") || {}, 4),
      activeByHour: SAMPLE_HOURS_FALLBACK, // IG doesn't expose hourly demographics; left neutral.
      source: "instagram",
      fetchedAt: new Date().toISOString(),
    };
  }

  // Facebook Page fan demographics.
  const ins = await gget(`${page.id}/insights`, token, { metric: "page_fans_gender_age,page_fans_country,page_fans_online", period: "lifetime" });
  const ageGender = metaGenderAgeToRows(insightValue(ins, "page_fans_gender_age") || {});
  if (!ageGender.length) return null;
  return {
    platform: "facebook",
    handle: page.name || "your Page",
    followerCount: Number(page.followers_count) || 0,
    ageGender,
    topLocations: shareMapToNamed(insightValue(ins, "page_fans_country") || {}),
    topLanguages: [],
    activeByHour: onlineToHourly(insightValue(ins, "page_fans_online") || {}),
    source: "facebook",
    fetchedAt: new Date().toISOString(),
  };
}

// TikTok audience demographics via the Business API AUDIENCE report (advertiser-scoped; uses the
// ads.read token we already store). Availability varies by account, so this fails closed too.
export async function fetchTikTokAudience(token: string, advertiserId: string): Promise<AudienceInsights | null> {
  const qp = new URLSearchParams({
    advertiser_id: advertiserId,
    report_type: "AUDIENCE",
    dimensions: JSON.stringify(["gender", "age"]),
    metrics: JSON.stringify(["impressions"]),
    start_date: new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10),
    end_date: new Date().toISOString().slice(0, 10),
  });
  const r = await fetch(`${TT}/report/integrated/get/?${qp.toString()}`, { headers: { "Access-Token": token } });
  const j: any = await r.json().catch(() => ({}));
  if (!r.ok || (typeof j.code === "number" && j.code !== 0)) return null;
  const list: any[] = j?.data?.list || [];
  if (!list.length) return null;

  // Fold gender×age rows into the % AgeGenderRow[] shape.
  const TT_AGE: Record<string, string> = { AGE_13_17: "13-17", AGE_18_24: "18-24", AGE_25_34: "25-34", AGE_35_44: "35-44", AGE_45_54: "45-54", AGE_55_100: "55-64" };
  const flat: Record<string, number> = {};
  for (const row of list) {
    const d = row.dimensions || {};
    const g = String(d.gender || "").toUpperCase().startsWith("F") ? "F" : String(d.gender || "").toUpperCase().startsWith("M") ? "M" : "U";
    const age = TT_AGE[d.age] || null;
    const n = Number(row.metrics?.impressions) || 0;
    if (age && n) flat[`${g}.${age}`] = (flat[`${g}.${age}`] || 0) + n;
  }
  const ageGender = metaGenderAgeToRows(flat);
  if (!ageGender.length) return null;
  return {
    platform: "tiktok",
    handle: "your TikTok",
    followerCount: 0,
    ageGender,
    topLocations: [],
    topLanguages: [],
    activeByHour: SAMPLE_HOURS_FALLBACK,
    source: "tiktok",
    fetchedAt: new Date().toISOString(),
  };
}

// Neutral, flat activity curve used when a platform doesn't expose hourly data (never claims a peak).
const SAMPLE_HOURS_FALLBACK = Array.from({ length: 24 }, () => 0);

// Resolve a decrypted token + connected account for an org/platform, or null.
async function connection(admin: any, orgId: string, platform: "meta" | "tiktok") {
  const { data: tok } = await admin.from("platform_tokens")
    .select("ciphertext,iv,auth_tag").eq("organisation_id", orgId).eq("platform", platform)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!tok?.ciphertext) return null;
  const { data: acct } = await admin.from("connected_ad_accounts")
    .select("external_account_id,display_name").eq("organisation_id", orgId).eq("platform", platform)
    .eq("status", "connected").limit(1).maybeSingle();
  let token: string;
  try { token = decrypt({ ciphertext: tok.ciphertext, iv: tok.iv, authTag: tok.auth_tag }); }
  catch { return null; }
  return { token, accountId: String(acct?.external_account_id || "").trim() };
}

// Best-effort live insights for an org: Meta (Page/IG) first, then TikTok. Returns null (→ sample)
// on any missing connection, missing scope, or unexpected payload — never throws to the caller.
export async function getLiveAudience(orgId: string): Promise<AudienceInsights | null> {
  const admin = createAdminClient();
  try {
    const meta = await connection(admin, orgId, "meta");
    if (meta) {
      const a = await fetchMetaAudience(meta.token).catch(() => null);
      if (a) return a;
    }
  } catch { /* fall through */ }
  try {
    const tt = await connection(admin, orgId, "tiktok");
    if (tt?.accountId) {
      const a = await fetchTikTokAudience(tt.token, tt.accountId).catch(() => null);
      if (a) return a;
    }
  } catch { /* fall through */ }
  return null;
}
