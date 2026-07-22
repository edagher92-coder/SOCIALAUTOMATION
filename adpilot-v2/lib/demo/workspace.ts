import "server-only";

import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { analyse } from "@/lib/engine";
import { refreshOpenRecommendations } from "@/lib/proposals";

export const INTERACTIVE_DEMO_NAME = "AdPilot Interactive Demo [DEMO]";

type DemoUser = { id: string; email?: string | null };
type Platform = "meta" | "tiktok";

type AdSpec = {
  platform: Platform;
  campaign: string;
  adset: string;
  ad: string;
  objective: "conversions" | "leads" | "traffic";
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  purchases: number;
  saleValue: number;
  frequency: number;
  trend: number;
  tracking?: "ok" | "broken";
  video?: boolean;
};

const ADS: AdSpec[] = [
  { platform: "meta", campaign: "Spring Reset — Prospecting", adset: "Broad AU · 25–44", ad: "Founder Story UGC", objective: "conversions", spend: 154, impressions: 8200, clicks: 246, leads: 22, purchases: 8, saleValue: 149, frequency: 1.8, trend: 0.58, video: true },
  { platform: "meta", campaign: "Proof That Converts — Retargeting", adset: "Site visitors · 30 days", ad: "Customer Proof Carousel", objective: "conversions", spend: 92, impressions: 3900, clicks: 156, leads: 18, purchases: 7, saleValue: 149, frequency: 2.7, trend: 0.7 },
  { platform: "tiktok", campaign: "Creative Lab — Short Form", adset: "Broad AU · 18–34", ad: "30-Second Account Audit", objective: "conversions", spend: 118, impressions: 17600, clicks: 302, leads: 24, purchases: 5, saleValue: 149, frequency: 1.5, trend: 0.5, video: true },
  { platform: "meta", campaign: "Free Growth Workshop", adset: "Small-business owners", ad: "Workshop Lead Form", objective: "leads", spend: 78, impressions: 6100, clicks: 219, leads: 38, purchases: 5, saleValue: 149, frequency: 1.6, trend: 0.8 },
  { platform: "meta", campaign: "Legacy Interest Stack", adset: "Marketing interests · v4", ad: "Feature List Static", objective: "conversions", spend: 126, impressions: 10400, clicks: 83, leads: 7, purchases: 1, saleValue: 149, frequency: 3.4, trend: 1.15 },
  { platform: "tiktok", campaign: "Creative Lab — Hook Tests", adset: "Entrepreneurs · AU", ad: "Hook Test C — Stop Guessing", objective: "traffic", spend: 86, impressions: 21200, clicks: 127, leads: 6, purchases: 1, saleValue: 149, frequency: 4.5, trend: 1.08, video: true },
  { platform: "meta", campaign: "Checkout Recovery", adset: "Initiated checkout · 14 days", ad: "Complete Your Setup", objective: "conversions", spend: 64, impressions: 2800, clicks: 149, leads: 0, purchases: 0, saleValue: 149, frequency: 2.2, trend: 0.92, tracking: "broken" },
  { platform: "meta", campaign: "Testimonial Iterations", adset: "Lookalike customers · 3%", ad: "Case Study — Jordan", objective: "conversions", spend: 104, impressions: 7200, clicks: 121, leads: 11, purchases: 2, saleValue: 149, frequency: 2.5, trend: 0.94, video: true },
];

const DAYS = 180;
const round = (value: number) => Math.round(value * 100) / 100;
const dateAgo = (days: number) => {
  const value = new Date();
  value.setUTCHours(12, 0, 0, 0);
  value.setUTCDate(value.getUTCDate() - days);
  return value;
};
const isoAgo = (days: number) => dateAgo(days).toISOString();
const ymdAgo = (days: number) => isoAgo(days).slice(0, 10);

function random(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildInteractiveDemoSnapshots(orgId: string) {
  const rng = random(92026);
  const rows: Record<string, unknown>[] = [];
  for (const spec of ADS) {
    for (let offset = DAYS - 1; offset >= 0; offset--) {
      const age = offset / (DAYS - 1);
      const weekday = dateAgo(offset).getUTCDay();
      const weekdayFactor = weekday === 0 || weekday === 6 ? 0.86 : 1.05;
      const trendFactor = 1 - (1 - spec.trend) * age;
      const factor = Math.max(0.25, trendFactor * weekdayFactor * (0.86 + rng() * 0.28));
      const spend = round(spec.spend * factor);
      const impressions = Math.round(spec.impressions * factor);
      const clicks = Math.round(spec.clicks * factor);
      const leads = Math.round(spec.leads * factor * (0.9 + rng() * 0.2));
      const purchases = Math.round(spec.purchases * factor * (0.86 + rng() * 0.28));
      const revenue = purchases * spec.saleValue;
      const videoViews = spec.video ? Math.round(impressions * (0.58 + rng() * 0.12)) : 0;
      rows.push({
        organisation_id: orgId,
        platform: spec.platform,
        campaign_id: `DEMO-C-${spec.campaign.replace(/\W+/g, "-")}`,
        campaign_name: spec.campaign,
        adset_id: `DEMO-S-${spec.adset.replace(/\W+/g, "-")}`,
        adset_name: spec.adset,
        ad_id: `DEMO-A-${spec.ad.replace(/\W+/g, "-")}`,
        ad_name: spec.ad,
        date: ymdAgo(offset),
        objective: spec.objective,
        budget_type: "daily",
        daily_budget: round(spec.spend * 1.12),
        spend,
        impressions,
        reach: Math.round(impressions / spec.frequency),
        frequency: round(spec.frequency * (0.94 + rng() * 0.12)),
        clicks,
        ctr: impressions ? round(clicks / impressions) : 0,
        cpc: clicks ? round(spend / clicks) : null,
        cpm: impressions ? round((spend / impressions) * 1000) : null,
        landing_page_views: Math.round(clicks * (0.76 + rng() * 0.12)),
        leads,
        purchases,
        sales_count: purchases,
        revenue,
        gross_profit: round(revenue * 0.74),
        video_views: videoViews,
        three_second_views: spec.video ? Math.round(videoViews * 0.82) : 0,
        six_second_views: spec.video ? Math.round(videoViews * 0.61) : 0,
        thruplays: spec.video ? Math.round(videoViews * 0.34) : 0,
        hook_rate: spec.video ? round(0.29 + rng() * 0.16) : null,
        hold_rate: spec.video ? round(0.13 + rng() * 0.12) : null,
        comments: Math.round(impressions * 0.0007 * factor),
        shares: Math.round(impressions * 0.0011 * factor),
        saves: Math.round(impressions * 0.0015 * factor),
        lead_quality_score: leads ? Math.round(64 + rng() * 27) : null,
        tracking_status: spec.tracking || "ok",
        roas_meta: spec.platform === "meta" && spend ? round((revenue / spend) * (0.9 + rng() * 0.2)) : null,
        utm_source: spec.platform,
        utm_medium: "paid-social",
        utm_campaign: spec.campaign,
        utm_content: spec.ad,
        source: "csv",
        notes: "Interactive demo data — no live ad account is connected.",
      });
    }
  }
  return rows;
}

function aggregateByAd(rows: Record<string, any>[], startOffset: number, days = 30) {
  const allowed = new Set(Array.from({ length: days }, (_, index) => ymdAgo(startOffset + index)));
  const grouped = new Map<string, Record<string, any>>();
  for (const row of rows) {
    if (!allowed.has(row.date)) continue;
    const key = `${row.platform}:${row.ad_id}`;
    const current = grouped.get(key) || { platform: row.platform, campaign_name: row.campaign_name, ad_name: row.ad_name, spend: 0, impressions: 0, reach: 0, clicks: 0, leads: 0, purchases: 0, revenue: 0, frequency: row.frequency, tracking_status: row.tracking_status };
    for (const metric of ["spend", "impressions", "reach", "clicks", "leads", "purchases", "revenue"]) current[metric] += Number(row[metric] || 0);
    current.frequency = Math.max(current.frequency, row.frequency);
    grouped.set(key, current);
  }
  return [...grouped.values()].map((row) => ({ ...row, ctr: row.impressions ? row.clicks / row.impressions : 0 }));
}

async function insertRows(admin: SupabaseClient, table: string, rows: Record<string, unknown>[], chunkSize = 400) {
  for (let index = 0; index < rows.length; index += chunkSize) {
    const { error } = await admin.from(table).insert(rows.slice(index, index + chunkSize));
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

async function singleId(admin: SupabaseClient, table: string, row: Record<string, unknown>) {
  const { data, error } = await admin.from(table).insert(row).select("id").single();
  if (error || !data) throw new Error(`${table}: ${error?.message || "insert failed"}`);
  return data.id as string;
}

export async function seedInteractiveDemoWorkspace(admin: SupabaseClient, user: DemoUser) {
  const externalPageId = `DEMO-PAGE-${user.id}`;
  const { data: memberships, error: membershipError } = await admin
    .from("memberships")
    .select("organisation_id,role,organisations(name)")
    .eq("user_id", user.id);
  if (membershipError) throw new Error(membershipError.message);

  const existing = (memberships || []).find((membership: any) => membership.organisations?.name === INTERACTIVE_DEMO_NAME);
  if (existing) {
    if (existing.role !== "owner") throw new Error("Only the demo workspace owner can refresh it.");
    const { count } = await admin.from("memberships").select("id", { count: "exact", head: true }).eq("organisation_id", existing.organisation_id);
    if ((count || 0) > 1) throw new Error("This demo workspace has other members and cannot be refreshed automatically.");
    await admin.from("messenger_threads").delete().eq("external_page_id", externalPageId);
    const { error } = await admin.from("organisations").delete().eq("id", existing.organisation_id);
    if (error) throw new Error(`Could not refresh the old demo workspace: ${error.message}`);
  }

  await admin.from("profiles").upsert({ id: user.id, email: user.email || undefined });
  const orgId = await singleId(admin, "organisations", {
    name: INTERACTIVE_DEMO_NAME,
    currency: "AUD",
    average_sale_value: 149,
    gross_margin: 0.74,
    monthly_budget: 18000,
    lead_close_rate: 0.18,
    sync_interval_hours: 6,
    last_synced_at: new Date().toISOString(),
  });

  try {
    await insertRows(admin, "memberships", [{ organisation_id: orgId, user_id: user.id, role: "owner" }]);
    await insertRows(admin, "billing_subscriptions", [{ organisation_id: orgId, plan: "expert", status: "active", stripe_customer_id: `cus_DEMO_${user.id.slice(0, 8)}`, current_period_end: isoAgo(-30) }]);
    await insertRows(admin, "connected_ad_accounts", [
      { organisation_id: orgId, platform: "meta", external_account_id: `act_DEMO_${user.id.slice(0, 8)}`, display_name: "AdPilot Growth Lab · Meta", status: "connected" },
      { organisation_id: orgId, platform: "tiktok", external_account_id: `tt_DEMO_${user.id.slice(0, 8)}`, display_name: "@adpilotgrowth · TikTok", status: "connected" },
    ]);

    const snapshots = buildInteractiveDemoSnapshots(orgId);
    await insertRows(admin, "campaign_snapshots", snapshots);

    const daily = new Map<string, Record<string, any>>();
    for (const row of snapshots as Record<string, any>[]) {
      const value = daily.get(row.date) || { organisation_id: orgId, date: row.date, spend: 0, impressions: 0, clicks: 0, leads: 0, purchases: 0, revenue: 0 };
      for (const metric of ["spend", "impressions", "clicks", "leads", "purchases", "revenue"]) value[metric] += Number(row[metric] || 0);
      daily.set(row.date, value);
    }
    const dailyRows = [...daily.values()].map((row, index) => ({ ...row, spend: round(row.spend), revenue: round(row.revenue), health_total: round(62 + (index / DAYS) * 18 + Math.sin(index / 8) * 2.5), health_band: index > 130 ? "Green" : index > 65 ? "Yellow" : "Orange" }));
    await insertRows(admin, "account_daily_metrics", dailyRows);

    const config = { business_name: "AdPilot Growth Lab", average_sale_value: 149, gross_margin: 0.74, currency: "AUD", monthly_budget: 18000, lead_close_rate: 0.18 };
    let latest: ReturnType<typeof analyse> | null = null;
    for (let month = 5; month >= 0; month--) {
      const result = analyse(aggregateByAd(snapshots as Record<string, any>[], month * 30) as any, config);
      latest = result;
      const when = isoAgo(month * 30);
      await insertRows(admin, "health_scores", [{ organisation_id: orgId, scope: "account", total: result.health.total, band: result.health.band, breakdown: result.health.breakdown, data_confidence: (result.health as any).breakdown?.data_confidence?.score ?? null, period_start: ymdAgo(month * 30 + 29), period_end: ymdAgo(month * 30), created_at: when }]);
      await insertRows(admin, "reports", [{ organisation_id: orgId, title: `${dateAgo(month * 30).toLocaleString("en-AU", { month: "long", year: "numeric" })} performance review`, period: ymdAgo(month * 30), payload: result, created_by: user.id, created_at: when }]);
    }
    if (!latest) throw new Error("Demo analysis could not be generated.");
    await refreshOpenRecommendations(admin, orgId, latest.decisions as any[]);

    await insertRows(admin, "ad_actions", [
      { organisation_id: orgId, platform: "meta", entity_level: "campaign", external_entity_id: "DEMO-C-Legacy-Interest-Stack", entity_name: "Legacy Interest Stack", action: "pause", params: {}, prior_state: { status: "ACTIVE" }, status: "proposed", confirm_phrase: "YES PAUSE LEGACY INTEREST STACK", requested_by: user.id, created_at: isoAgo(0) },
      { organisation_id: orgId, platform: "meta", entity_level: "campaign", external_entity_id: "DEMO-C-Proof-That-Converts-Retargeting", entity_name: "Proof That Converts — Retargeting", action: "set_budget", params: { current_daily_budget: 92, proposed_daily_budget: 110, change_percent: 19.6 }, prior_state: { daily_budget: 92 }, status: "proposed", confirm_phrase: "YES SET BUDGET 110", requested_by: user.id, created_at: isoAgo(1) },
      { organisation_id: orgId, platform: "tiktok", entity_level: "ad", external_entity_id: "DEMO-A-Hook-Test-C", entity_name: "Hook Test C — Stop Guessing", action: "pause", params: {}, prior_state: { status: "ACTIVE" }, status: "done", confirm_phrase: "YES PAUSE HOOK TEST C", result: "Demo approval recorded; no live account was changed.", requested_by: user.id, approved_by: user.id, created_at: isoAgo(12), executed_at: isoAgo(11) },
      { organisation_id: orgId, platform: "meta", entity_level: "campaign", external_entity_id: "DEMO-C-Customer-Proof", entity_name: "Customer Proof Carousel", action: "set_budget", params: { daily_budget: 105 }, prior_state: { daily_budget: 86 }, status: "reverted", confirm_phrase: "YES SET BUDGET 105", result: "Reverted during demo review.", requested_by: user.id, approved_by: user.id, created_at: isoAgo(25), executed_at: isoAgo(24), reverted_at: isoAgo(22) },
    ]);

    const content = [
      ["instagram", "The three numbers we check before touching any ad budget.", "reel", "published", 6],
      ["tiktok", "POV: your campaign is profitable but your dashboard says panic.", "reel", "published", 4],
      ["facebook", "A calm Monday account-health checklist for small teams.", "image", "published", 2],
      ["instagram", "Creative fatigue is a signal—not a reason to rebuild everything.", "image", "scheduled", -2],
      ["tiktok", "We audited 100 ads. Here are the hooks that held attention.", "reel", "scheduled", -4],
      ["facebook", "Live workshop: understand ROAS without a spreadsheet maze.", "image", "approved", -7],
      ["instagram", "Case study: scaling 18% without breaking the learning phase.", "reel", "draft", 0],
      ["tiktok", "Three tracking checks before you blame the creative.", "reel", "draft", 0],
      ["instagram", "Old winter promotion — retained for reporting history.", "image", "archived", 48],
    ];
    await insertRows(admin, "content_posts", content.map(([platform, caption, media_type, status, when]) => ({ organisation_id: orgId, platform, caption, media_type, status, source: "studio", created_by: user.id, published_at: status === "published" ? isoAgo(Number(when)) : null, scheduled_at: status === "scheduled" ? isoAgo(Number(when)) : null, archived_at: status === "archived" ? isoAgo(Number(when)) : null })));

    await insertRows(admin, "creative_assets", [
      { organisation_id: orgId, kind: "video", source: "ai", provider: "AdPilot Studio", title: "Founder story · UGC master", url: "https://images.unsplash.com/photo-1556761175-b413da4baf72", linked_campaign: "Spring Reset — Prospecting", created_by: user.id },
      { organisation_id: orgId, kind: "image", source: "ai", provider: "Canva", title: "Customer proof carousel · v4", url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71", linked_campaign: "Proof That Converts — Retargeting", created_by: user.id },
      { organisation_id: orgId, kind: "video", source: "upload", provider: "TikTok", title: "30-second audit · clean captions", url: "https://images.unsplash.com/photo-1611162617474-5b21e879e113", linked_campaign: "Creative Lab — Short Form", created_by: user.id },
      { organisation_id: orgId, kind: "image", source: "upload", provider: "Figma", title: "Workshop registration card", url: "https://images.unsplash.com/photo-1553877522-43269d4ea984", linked_campaign: "Free Growth Workshop", created_by: user.id },
    ]);

    const organic = Array.from({ length: 16 }, (_, index) => ({ organisation_id: orgId, platform: index % 3 === 0 ? "tiktok" : "meta", name: ["Founder lesson", "Monday dashboard", "Customer proof", "Hook teardown", "Budget myth"][index % 5], posted_at: ymdAgo(index * 5 + 2), reach: 4200 + index * 730, impressions: 5300 + index * 920, engagements: 210 + index * 38, external_id: `DEMO-ORGANIC-${user.id.slice(0, 8)}-${index}`, source: index % 3 === 0 ? "tiktok_sync" : "meta_sync" }));
    await insertRows(admin, "organic_posts", organic);

    const leadStatuses = ["new", "qualified", "proposal_sent", "won", "lost"];
    const leads = Array.from({ length: 54 }, (_, index) => {
      const status = leadStatuses[index % leadStatuses.length];
      const won = status === "won";
      const fingerprint = createHash("sha256").update(`adpilot-demo-${user.id}-${index}`).digest("hex");
      return { organisation_id: orgId, event_id: `DEMO-LEAD-${index}`, lead_id: `lead_${1000 + index}`, platform: index % 4 === 0 ? "tiktok" : "meta", campaign_name: ADS[index % 4].campaign, status, sale_value_aud: won ? 149 : null, lead_quality_score: 48 + ((index * 13) % 49), email_hash: fingerprint, source: "crm_webhook", closed_date: won || status === "lost" ? ymdAgo(index * 2) : null, created_at: isoAgo(index * 2) };
    });
    await insertRows(admin, "lead_events", leads);

    await insertRows(admin, "alert_rules", [
      { organisation_id: orgId, name: "High CPA after meaningful spend", metric: "cpa", operator: "gt", threshold: 110, min_spend_gate: 250, severity: "critical", scope: "campaign", enabled: true, message: "CPA is above the workspace guardrail." },
      { organisation_id: orgId, name: "Creative fatigue watch", metric: "frequency", operator: "gte", threshold: 4, min_volume_gate: 5000, severity: "warning", scope: "ad", enabled: true, message: "Frequency is high enough to inspect creative fatigue." },
      { organisation_id: orgId, name: "Strong ROAS candidate", metric: "roas", operator: "gte", threshold: 2.4, min_spend_gate: 300, severity: "info", scope: "campaign", enabled: true, message: "Performance is above the scale-review threshold." },
      { organisation_id: orgId, name: "Tracking integrity", metric: "purchases", operator: "eq", threshold: 0, min_spend_gate: 200, severity: "critical", scope: "campaign", enabled: true, message: "Spend is present but no purchases were recorded." },
    ]);
    await insertRows(admin, "alert_events", [
      { organisation_id: orgId, rule_id: "DEMO-CPA", severity: "critical", campaign_name: "Legacy Interest Stack", metric: "cpa", value: 126, threshold: 110, message: "CPA exceeded the guardrail after meaningful spend.", status: "open", dedupe_key: "DEMO-CPA:Legacy Interest Stack", created_at: isoAgo(0) },
      { organisation_id: orgId, rule_id: "DEMO-FATIGUE", severity: "warning", campaign_name: "Creative Lab — Hook Tests", metric: "frequency", value: 4.5, threshold: 4, message: "Audience frequency suggests creative fatigue.", status: "open", dedupe_key: "DEMO-FATIGUE:Creative Lab", created_at: isoAgo(1) },
      { organisation_id: orgId, rule_id: "DEMO-TRACKING", severity: "critical", campaign_name: "Checkout Recovery", metric: "purchases", value: 0, threshold: 0, message: "Tracking validation is required before optimisation.", status: "open", dedupe_key: "DEMO-TRACKING:Checkout Recovery", created_at: isoAgo(0) },
      { organisation_id: orgId, rule_id: "DEMO-ROAS", severity: "warning", campaign_name: "Spring Reset — Prospecting", metric: "roas", value: 2.8, threshold: 2.4, message: "Scale review completed and documented.", status: "resolved", dedupe_key: "DEMO-ROAS:Spring Reset", created_at: isoAgo(9) },
    ]);

    await insertRows(admin, "notification_rules", [{ organisation_id: orgId, email: user.email || "demo@adpilot.app", weekly_digest: true, critical_alerts: true }]);
    await insertRows(admin, "white_label_profiles", [{ organisation_id: orgId, brand_name: "Northstar Growth Co.", primary_color: "#f06a52", support_email: user.email || "demo@adpilot.app" }]);
    await insertRows(admin, "messenger_pages", [{ organisation_id: orgId, external_page_id: externalPageId, display_name: "AdPilot Growth Lab", channel: "messenger", business_hours: { timezone: "Australia/Sydney", monday_friday: "09:00-17:30", weekend: "closed" }, ai_enabled: true, ai_facts: "AdPilot Growth Lab helps Australian small businesses understand paid social performance. Demo bookings are available weekdays.", ai_voice: "Calm, practical and concise." }]);
    await insertRows(admin, "messenger_rules", [
      { organisation_id: orgId, external_page_id: externalPageId, trigger_type: "welcome", reply: "Hi! I can help with pricing, demo bookings, or how AdPilot protects your ad spend.", priority: 20 },
      { organisation_id: orgId, external_page_id: externalPageId, trigger_type: "keyword", trigger: "price,pricing,cost", reply: "Plans start with monitoring and grow into guarded automation. Would you like a quick plan comparison?", priority: 15 },
      { organisation_id: orgId, external_page_id: externalPageId, trigger_type: "keyword", trigger: "demo,book,call", reply: "Absolutely—share your preferred weekday and we’ll suggest a time.", priority: 14 },
      { organisation_id: orgId, external_page_id: externalPageId, trigger_type: "away", reply: "Thanks for your message. We’re offline now and will reply next business day.", priority: 10 },
      { organisation_id: orgId, external_page_id: externalPageId, trigger_type: "default", reply: "Thanks—someone from the team will review this shortly.", priority: 0 },
    ]);
    await insertRows(admin, "messenger_threads", Array.from({ length: 8 }, (_, index) => ({ external_page_id: externalPageId, sender_id: `demo_sender_${index}`, last_greeted_at: isoAgo(index) })));

    await insertRows(admin, "ingestion_runs", Array.from({ length: 18 }, (_, index) => ({ organisation_id: orgId, platform: index % 3 === 0 ? "tiktok" : "meta", account_id: index % 3 === 0 ? `tt_DEMO_${user.id.slice(0, 8)}` : `act_DEMO_${user.id.slice(0, 8)}`, started_at: isoAgo(index * 3), finished_at: new Date(dateAgo(index * 3).getTime() + 42000).toISOString(), window_days: 30, rows_written: 236 + ((index * 47) % 180), status: index === 7 ? "partial" : "ok", error_message: index === 7 ? "Two archived ads were unavailable; active reporting data completed." : null, graph_version: index % 3 === 0 ? null : "v23.0" })));
    await insertRows(admin, "ai_usage", Array.from({ length: 24 }, (_, index) => ({ organisation_id: orgId, created_at: isoAgo(index * 2), model: index % 4 === 0 ? "claude-opus-4-1" : "claude-sonnet-4", route: ["command-brief", "creative-scorecard", "weekly-digest", "policy-check"][index % 4], input_tokens: 1850 + index * 41, output_tokens: 420 + index * 17, cache_read_tokens: index % 3 === 0 ? 900 : 0, cache_write_tokens: index % 5 === 0 ? 600 : 0, cost_usd: round(0.018 + index * 0.0017) })));

    await insertRows(admin, "audit_logs", [
      { organisation_id: orgId, user_id: user.id, action: "demo.workspace.created", detail: { label: "Interactive demo workspace created", safe: true } },
      { organisation_id: orgId, user_id: user.id, action: "connection.sync.completed", detail: { platform: "meta", rows: 418, mode: "demo" }, created_at: isoAgo(1) },
      { organisation_id: orgId, user_id: user.id, action: "recommendation.reviewed", detail: { entity: "Customer Proof Carousel", decision: "approved for review", mode: "demo" }, created_at: isoAgo(3) },
      { organisation_id: orgId, user_id: user.id, action: "content.scheduled", detail: { platform: "instagram", title: "Creative fatigue is a signal", mode: "demo" }, created_at: isoAgo(5) },
      { organisation_id: orgId, user_id: user.id, action: "alert.resolved", detail: { campaign: "Spring Reset — Prospecting", rule: "Strong ROAS candidate", mode: "demo" }, created_at: isoAgo(9) },
      { organisation_id: orgId, user_id: user.id, action: "action.reverted", detail: { entity: "Customer Proof Carousel", reason: "Demonstration of reversible approvals" }, created_at: isoAgo(22) },
    ]);

    return {
      orgId,
      workspace: INTERACTIVE_DEMO_NAME,
      counts: { snapshots: snapshots.length, campaigns: ADS.length, leads: leads.length, organicPosts: organic.length, reports: 6, actions: 4, alerts: 4 },
      safety: "Synthetic reporting only. No platform token or live-write credential was created.",
    };
  } catch (error) {
    await admin.from("messenger_threads").delete().eq("external_page_id", externalPageId);
    await admin.from("organisations").delete().eq("id", orgId);
    throw error;
  }
}
