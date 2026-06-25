import "server-only";
import { decrypt } from "@/lib/crypto";
import { META_GRAPH_VERSION, META_GRAPH_BASE } from "@/lib/meta/graph-version";

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
// Rate-limit handling (Gap A) + ingestion status (Gap C/D) — PURE helpers, no I/O.
// Meta signals throttling via HTTP 429, a few error codes, and utilisation headers
// (X-Business-Use-Case-Usage / X-App-Usage). We back off a BOUNDED number of times then
// FAIL CLOSED with a typed error so the caller records `rate_limited` and the next
// scheduled sync retries — we never hammer the API (a retry-storm risks the whole app's
// platform access) and never let a throttle masquerade as "0 rows = healthy".
// ---------------------------------------------------------------------------
export class RateLimitError extends Error {
  accountId: string;
  constructor(accountId: string, detail?: string) {
    super(`Meta rate limit reached for account ${accountId}; deferring to the next sync${detail ? ` (${detail})` : ""}.`);
    this.name = "RateLimitError";
    this.accountId = accountId;
  }
}

type HeaderLike = Headers | Record<string, string> | undefined;
const headerGet = (h: HeaderLike, key: string): string | null => {
  if (!h) return null;
  if (typeof (h as Headers).get === "function") return (h as Headers).get(key);
  const rec = h as Record<string, string>;
  return rec[key] ?? rec[key.toLowerCase()] ?? null;
};

// Does this response indicate we're being throttled / at the usage ceiling? Headers are the
// primary signal; the small code set is a SECONDARY, [VERIFY]-able hint (not an exhaustive list).
export function isMetaRateLimited(status: number, body: any, headers?: HeaderLike): boolean {
  if (status === 429) return true;
  const code = Number(body?.error?.code);
  if (code === 4 || code === 17 || code === 32 || code === 613 || (code >= 80000 && code <= 80004)) return true;
  for (const name of ["x-business-use-case-usage", "x-app-usage", "x-ad-account-usage"]) {
    const raw = headerGet(headers, name);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      // Shapes differ: X-App-Usage is a flat object {call_count,total_cputime,total_time};
      // X-Business-Use-Case-Usage is {id:[buckets]}; some responses send a bare array.
      let buckets: any[];
      if (Array.isArray(parsed)) buckets = parsed;
      else {
        const vals = Object.values(parsed as Record<string, any>);
        buckets = vals.some((v) => Array.isArray(v))
          ? ([] as any[]).concat(...vals.map((v) => (Array.isArray(v) ? v : [])))
          : [parsed];
      }
      for (const b of buckets) {
        if (!b) continue;
        if (Number(b.estimated_time_to_regain_access) > 0) return true;
        if (Number(b.call_count) >= 95 || Number(b.total_cputime) >= 95 || Number(b.total_time) >= 95) return true;
      }
    } catch { /* unparseable usage header — ignore */ }
  }
  return false;
}

// Bounded exponential backoff with jitter (ms). The ceiling is intentionally low (a few
// seconds): the function has a ~60s budget, so if the throttle persists past our retries we
// defer to the next sync rather than wait out a minutes-long regain window.
export function metaBackoffMs(attempt: number): number {
  const base = Math.min(4000, 500 * 2 ** attempt); // 500, 1000, 2000, 4000 (capped)
  return Math.round(base + Math.random() * base * 0.25); // +0–25% jitter
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export type MetaPullOpts = {
  meta?: { partial: boolean };           // out-param: set true when the page cap truncated the pull
  sleep?: (ms: number) => Promise<void>; // injectable so tests don't actually wait
  maxRetries?: number;                   // per-page rate-limit retries before failing closed
  maxPages?: number;                     // pagination guard
};

// The honest status recorded for every ingestion run (mirrors migration 0027's CHECK constraint).
export type IngestionStatus = "ok" | "partial" | "rate_limited" | "auth_failed" | "empty" | "error";

// Classify a thrown sync error into an ingestion status. RateLimitError is authoritative; otherwise
// token / scope / permission signals → auth_failed, and everything else → a generic error.
export function classifyIngestionError(e: unknown, message: string): IngestionStatus {
  if (e instanceof RateLimitError) return "rate_limited";
  const m = message.toLowerCase();
  if (/\b(401|403)\b|code\W*190|\btoken\b|scope|expired|revoked|invalid oauth|not\s+grant|permission|ads_read/.test(m)) return "auth_failed";
  return "error";
}

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

export async function metaPull(token: string, accountId: string, orgId: string, opts: MetaPullOpts = {}) {
  const act = accountId.startsWith("act_") ? accountId : `act_${accountId}`;
  const sleep = opts.sleep ?? defaultSleep;
  const maxRetries = opts.maxRetries ?? 3;
  const maxPages = opts.maxPages ?? 25;
  // AD level so conversions land on the ad row the engine groups/scores by.
  const fields = [
    "campaign_id", "campaign_name", "adset_id", "adset_name", "ad_id", "ad_name",
    "spend", "impressions", "reach", "clicks", "frequency", "ctr", "cpc", "cpm",
    "actions", "action_values",
    "video_play_actions", "video_thruplay_watched_actions",
  ].join(",");
  // Meta paginates insights (default ~25/page). With time_increment=1 a 30-day window is
  // dozens-to-hundreds of ad-day rows, and the FIRST page is the OLDEST dates — so a naive
  // single-page read can return only stale rows that fall outside the 14-day scoring window
  // (account looks "synced" but never scores). Request a big page AND follow `paging.next`
  // until exhausted so every day in the window is captured. The guard caps runaway paging.
  let url = `${META_GRAPH_BASE}/${act}/insights?level=ad&date_preset=last_30d&time_increment=1&limit=500&fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(token)}`;
  const data: any[] = [];
  for (let page = 0; url && page < maxPages; page++) {
    let j: any;
    // Per-page rate-limit retry loop (Gap A): back off on 429 / usage-ceiling, fail closed on exhaustion.
    for (let attempt = 0; ; attempt++) {
      const r = await fetch(url);
      j = await r.json().catch(() => ({}));
      if (isMetaRateLimited(r.status, j, (r as any).headers)) {
        if (attempt >= maxRetries) throw new RateLimitError(accountId);
        await sleep(metaBackoffMs(attempt));
        continue;
      }
      if (!r.ok) throw new Error(j?.error?.message || `Meta API error (HTTP ${r.status})`);
      break;
    }
    if (Array.isArray(j.data)) data.push(...j.data);
    url = j?.paging?.next || "";
  }
  // If pagination was cut short by the page guard (more pages remained), the pull is PARTIAL —
  // signal it so the caller records `partial` rather than treating an incomplete read as complete (Gap D).
  if (url && opts.meta) opts.meta.partial = true;
  return data.map((d: any) => {
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
  const startedAt = new Date().toISOString();
  let status: IngestionStatus = "ok";
  let rowsWritten = 0;
  let partialPull = false;
  let accountIdsForLog: string | null = null;
  let errorMessage: string | null = null;
  try {
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
    accountIdsForLog = ids.join(",").slice(0, 200);

    const token = decrypt({ ciphertext: tok.ciphertext, iv: tok.iv, authTag: tok.auth_tag });
    // Accumulate across every connected account for this platform. Pull each account
    // INDEPENDENTLY: one unreadable account (e.g. Meta (#200) "owner has not granted ads_read"
    // for an account that isn't assigned to this token) must NOT abort the whole sync. Such an
    // account is auto-marked `disconnected` so it stops blocking every future pull, and we keep
    // the rows from the accounts that did succeed. We only hard-fail when EVERY account failed
    // (e.g. a dead/invalid token), so callers still surface a real connection problem.
    let rows: any[] = [];
    const failures: { id: string; message: string }[] = [];
    for (const id of ids) {
      try {
        if (platform === "meta") {
          const pm = { partial: false };
          rows = rows.concat(await metaPull(token, id, orgId, { meta: pm }));
          if (pm.partial) partialPull = true;
        } else {
          rows = rows.concat(await tiktokPull(token, id, orgId));
        }
      } catch (e: any) {
        // Fail CLOSED on a throttle: don't keep hammering the remaining accounts — propagate and
        // defer to the next sync (recorded as `rate_limited`), never a retry-storm.
        if (e instanceof RateLimitError) throw e;
        const message = String(e?.message || "pull failed");
        failures.push({ id, message });
        // Permission / not-assigned errors mean this token can't read this account — drop it so it
        // stops poisoning the batch. (Meta #200 / "ads_read" / "ads_management" / "permission".)
        if (/\(?#?\s*200\)?|ads_read|ads_management|not\s+grant|permission/i.test(message)) {
          await admin.from("connected_ad_accounts").update({ status: "disconnected" })
            .eq("organisation_id", orgId).eq("platform", platform).eq("external_account_id", id);
        }
      }
    }
    // Every account failed → surface the first error so a genuinely broken token isn't silent.
    if (rows.length === 0 && failures.length === ids.length && failures.length > 0) {
      throw new Error(failures[0].message);
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
    rowsWritten = rows.length;
    // Honest status (Gap D): a successful-but-empty pull is `empty` (no delivery — NOT a failure),
    // a page-capped pull is `partial`, otherwise `ok`. The scorer already declines to fabricate a
    // Red/CRITICAL on zero spend, so this record is the durable signal for the trust surface (1b).
    status = rows.length === 0 ? "empty" : partialPull ? "partial" : "ok";
    return rows.length;
  } catch (e: any) {
    errorMessage = String(e?.message || "sync failed").slice(0, 500);
    status = classifyIngestionError(e, errorMessage);
    throw e;
  } finally {
    // Best-effort audit record of EVERY pull (Gap C/D). Read-only signal — it deliberately never
    // stores a token, never throws, and never blocks or rolls back the sync result.
    try {
      await admin.from("ingestion_runs").insert({
        organisation_id: orgId, platform, account_id: accountIdsForLog,
        started_at: startedAt, finished_at: new Date().toISOString(),
        window_days: SYNC_WINDOW_DAYS, rows_written: rowsWritten, status,
        error_message: errorMessage, graph_version: platform === "meta" ? META_GRAPH_VERSION : null,
      });
    } catch { /* ingestion audit log is best-effort */ }
  }
}
