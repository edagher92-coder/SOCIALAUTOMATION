/**
 * AdPilot OS — demo account seeder.
 *
 * Creates two polished, fully-populated DEMO accounts (a fitness creator and a
 * local café) with ~6 months of realistic Meta/TikTok data, scored through the
 * REAL engine so the health score, breakdown, proposals and reports are genuine.
 *
 * SAFETY: only ever creates/【deletes】 data tied to the two known demo emails and
 * organisations whose name ends with "[DEMO]". It never touches other rows.
 * Requires the service-role key (RLS is bypassed only with it).
 *
 *   npx tsx scripts/seed-demo.ts            # create / refresh the two demo accounts
 *   npx tsx scripts/seed-demo.ts --clean    # remove the two demo accounts + data
 *   npx tsx scripts/seed-demo.ts --dry-run  # generate + score in memory, print, no DB
 *   npx tsx scripts/seed-demo.ts --only=creator|cafe
 *
 * Credentials (env or .env.local):
 *   SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { analyse } from "../lib/engine/index";
import { refreshOpenRecommendations } from "../lib/proposals";

// ----------------------------------------------------------------------------
// args + creds
// ----------------------------------------------------------------------------
const ARGS = process.argv.slice(2);
const DRY = ARGS.includes("--dry-run");
const CLEAN = ARGS.includes("--clean");
const ONLY = (ARGS.find((a) => a.startsWith("--only=")) || "").split("=")[1] || "";

function loadEnvLocal() {
  const p = join(__dirname, "..", ".env.local");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnvLocal();
const URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "AdPilotDemo!2026";

// ----------------------------------------------------------------------------
// deterministic RNG + helpers
// ----------------------------------------------------------------------------
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const r2 = (n: number) => Math.round(n * 100) / 100;
const DAYS = 182;
const dayDate = (offsetFromToday: number) => {
  const d = new Date(); d.setUTCHours(12, 0, 0, 0); d.setUTCDate(d.getUTCDate() - offsetFromToday);
  return d;
};
const iso = (d: Date) => d.toISOString();
const ymd = (d: Date) => d.toISOString().slice(0, 10);

// ----------------------------------------------------------------------------
// ad model — `monthly` targets are tuned (vs break-even) to yield a believable
// verdict spread; daily rows are derived with trend + weekday seasonality + noise.
// trend = recent-vs-old multiplier applied to the OLDEST day (1 = flat).
// ----------------------------------------------------------------------------
type Plat = "meta" | "tiktok";
interface AdSpec {
  platform: Plat; campaign: string; adset: string; ad: string; objective: string;
  reel?: boolean; tracking?: string; trend?: number; // <1 growth (old smaller), >1 decline
  m: { spend: number; clicks: number; impressions: number; leads: number; purchases: number; revenue: number; frequency: number };
  note?: string;
}

interface Persona {
  key: "creator" | "cafe";
  email: string; fullName: string; orgName: string;
  currency: string; asv: number; gm: number;
  accounts: { platform: Plat; external: string; display: string }[];
  ads: AdSpec[];
  posts: { platform: string; caption: string; media_type: string; status: string; whenDays: number }[];
  creatives: { kind: string; provider: string; title: string; url: string; linked: string }[];
  messenger?: { page: string; display: string; rules: { trigger_type: string; trigger?: string; reply: string; priority?: number }[] };
  whiteLabel?: { brand_name: string; primary_color: string; support_email: string };
}

// ---- Persona 1: fitness creator (strong → Green) ---------------------------
const CREATOR: Persona = {
  key: "creator",
  email: process.env.DEMO_CREATOR_EMAIL || "creator.demo@adpilot.app",
  fullName: "Coach Maya Ellis",
  orgName: "Coach Maya — Fitness Studio [DEMO]",
  currency: "AUD", asv: 199, gm: 0.85,
  accounts: [
    { platform: "meta", external: "act_DEMO_maya_meta", display: "Coach Maya (Instagram/FB)" },
    { platform: "tiktok", external: "DEMO_maya_tiktok", display: "@coachmaya (TikTok)" },
  ],
  ads: [
    // profitable evergreen → keep (+ becomes a scale winner)
    { platform: "meta", campaign: "12WkShred_Sales_LLA3_20251201", adset: "Lookalike 3% Purchasers", ad: "Transformation Carousel", objective: "conversions",
      m: { spend: 3000, clicks: 1900, impressions: 120000, leads: 70, purchases: 30, revenue: 30 * 199, frequency: 2.1 }, trend: 0.45, note: "winner" },
    // TikTok reel rocket → keep/scale
    { platform: "tiktok", campaign: "ShredChallenge_Reels_Broad_20260115", adset: "Broad 18-34 AU", ad: "Day-1 Hook Reel", objective: "conversions", reel: true,
      m: { spend: 2400, clicks: 3000, impressions: 300000, leads: 120, purchases: 26, revenue: 26 * 199, frequency: 1.6 }, trend: 0.3, note: "rocket" },
    // lead magnet — many leads, no direct sales on this ad → keep (CPL branch), not in queue
    { platform: "meta", campaign: "Free7DayGuide_Leads_Interest_20251110", adset: "Interest: Home Workouts", ad: "Free Guide Optin", objective: "leads",
      m: { spend: 1500, clicks: 1800, impressions: 100000, leads: 400, purchases: 35, revenue: 35 * 199, frequency: 1.8 } },
    // recoverable but over break-even → reduce
    { platform: "meta", campaign: "ColdTest_Conv_Yoga_20260201", adset: "Interest: Yoga", ad: "Testimonial Video B", objective: "conversions",
      m: { spend: 2400, clicks: 820, impressions: 82000, leads: 24, purchases: 12, revenue: 12 * 199, frequency: 2.6 } },
    // fatigued retargeter → refresh (freq>=4, ctr<1%)
    { platform: "meta", campaign: "Retarget_Program_RTG30_20260210", adset: "RTG 30d Viewers", ad: "Last-Chance Promo", objective: "conversions",
      m: { spend: 900, clicks: 230, impressions: 138000, leads: 9, purchases: 9, revenue: 9 * 199, frequency: 4.6 } },
  ],
  posts: [
    { platform: "instagram", caption: "3 moves to wake up your core 🔥 Save this for tomorrow's session.", media_type: "reel", status: "published", whenDays: 5 },
    { platform: "tiktok", caption: "POV: day 1 of the 12-Week Shred. Tag a friend who's starting Monday.", media_type: "reel", status: "published", whenDays: 2 },
    { platform: "instagram", caption: "New PR alert 💪 Full leg-day routine drops Friday.", media_type: "image", status: "scheduled", whenDays: -3 },
    { platform: "facebook", caption: "Doors to the 12-Week Shred close Sunday. Link in bio.", media_type: "image", status: "approved", whenDays: -1 },
    { platform: "tiktok", caption: "Meal-prep in 20 minutes (high protein, under $5/serve).", media_type: "reel", status: "draft", whenDays: 0 },
  ],
  creatives: [
    { kind: "video", provider: "upload", title: "Transformation montage v3", url: "https://demo.adpilot.app/creative/maya-transformation.mp4", linked: "12-Week Shred — Sales" },
    { kind: "video", provider: "tiktok", title: "Day-1 Hook reel (raw)", url: "https://demo.adpilot.app/creative/maya-hook.mp4", linked: "Shred Challenge — Reels" },
    { kind: "image", provider: "canva", title: "Free Guide cover", url: "https://demo.adpilot.app/creative/maya-guide.png", linked: "Free 7-Day Guide — Lead Gen" },
  ],
  whiteLabel: undefined,
};

// ---- Persona 2: local café (needs work → Orange) ---------------------------
const CAFE: Persona = {
  key: "cafe",
  email: process.env.DEMO_CAFE_EMAIL || "cafe.demo@adpilot.app",
  fullName: "Mia Bennett",
  orgName: "Bean & Bloom Café [DEMO]",
  currency: "AUD", asv: 34, gm: 0.62,
  accounts: [
    { platform: "meta", external: "act_DEMO_beanbloom", display: "Bean & Bloom (FB/IG)" },
    { platform: "tiktok", external: "DEMO_beanbloom_tt", display: "@beanandbloom (TikTok)" },
  ],
  ads: [
    // working promo → keep (+ scale winner)
    { platform: "meta", campaign: "Weekend Brunch Promo", adset: "5km radius · 22-45", ad: "Brunch Carousel", objective: "conversions",
      m: { spend: 900, clicks: 1300, impressions: 78000, leads: 120, purchases: 80, revenue: 80 * 34, frequency: 2.3 }, trend: 0.7, note: "winner" },
    // budget bleeder → kill (cpa > 1.5x break-even)
    { platform: "meta", campaign: "New Menu Launch", adset: "Broad · 18-55", ad: "Menu Reel A", objective: "conversions",
      m: { spend: 1250, clicks: 900, impressions: 102000, leads: 70, purchases: 18, revenue: 18 * 34, frequency: 3.1 } },
    // broken tracking → fix-tracking (spend, zero recorded purchases)
    { platform: "meta", campaign: "Loyalty App Installs", adset: "Engaged shoppers", ad: "Loyalty Promo", objective: "conversions", tracking: "broken",
      m: { spend: 780, clicks: 640, impressions: 60000, leads: 0, purchases: 0, revenue: 0, frequency: 2.0 } },
    // recoverable → reduce
    { platform: "meta", campaign: "Catering Enquiries", adset: "Office lunch 3km", ad: "Catering Lead Form", objective: "leads",
      m: { spend: 640, clicks: 520, impressions: 41000, leads: 70, purchases: 23, revenue: 23 * 34, frequency: 1.9 } },
    // tired creative → refresh (freq>=4, low ctr)
    { platform: "tiktok", campaign: "Behind the Beans", adset: "Broad AU", ad: "Roastery BTS", objective: "traffic", reel: true,
      m: { spend: 520, clicks: 180, impressions: 150000, leads: 14, purchases: 6, revenue: 6 * 34, frequency: 4.3 } },
  ],
  posts: [
    { platform: "instagram", caption: "Weekend special: brown-butter banana bread + a flat white ☕ $12 til Sunday.", media_type: "image", status: "published", whenDays: 4 },
    { platform: "facebook", caption: "We're hiring weekend baristas! DM us 'JOBS' to apply.", media_type: "image", status: "published", whenDays: 6 },
    { platform: "instagram", caption: "New cold-brew flight just landed 🧊 Which one are you trying?", media_type: "reel", status: "scheduled", whenDays: -2 },
    { platform: "tiktok", caption: "How we pull our signature espresso (it's the 27-second rule).", media_type: "reel", status: "draft", whenDays: 0 },
  ],
  creatives: [
    { kind: "image", provider: "canva", title: "Brunch promo carousel", url: "https://demo.adpilot.app/creative/bb-brunch.png", linked: "Weekend Brunch Promo" },
    { kind: "video", provider: "tiktok", title: "Roastery BTS reel", url: "https://demo.adpilot.app/creative/bb-bts.mp4", linked: "Behind the Beans" },
  ],
  messenger: {
    page: "DEMO_beanbloom_page", display: "Bean & Bloom Café",
    rules: [
      { trigger_type: "welcome", reply: "Hi! ☕ Welcome to Bean & Bloom. Ask me about our menu, hours, or to book a table." },
      { trigger_type: "keyword", trigger: "hours", reply: "We're open 7am–4pm Mon–Fri, 8am–3pm weekends.", priority: 10 },
      { trigger_type: "keyword", trigger: "menu", reply: "Here's our menu 🥐 https://demo.adpilot.app/beanbloom/menu", priority: 9 },
      { trigger_type: "keyword", trigger: "book", reply: "Tap here to reserve a table: https://demo.adpilot.app/beanbloom/book", priority: 8 },
      { trigger_type: "away", reply: "Thanks for the message! We're closed right now but will reply at 7am ☀️" },
      { trigger_type: "default", reply: "Thanks for reaching out! A team member will reply shortly. For quick answers try 'menu', 'hours' or 'book'." },
    ],
  },
  whiteLabel: { brand_name: "Bean & Bloom Café", primary_color: "#7a4a2b", support_email: "hello@beanandbloom.demo" },
};

const PERSONAS = [CREATOR, CAFE].filter((p) => !ONLY || p.key === ONLY);

// ----------------------------------------------------------------------------
// data generation
// ----------------------------------------------------------------------------
function genDailyRows(p: Persona, orgId: string) {
  const rng = mulberry32(p.key === "creator" ? 1337 : 4242);
  const rows: any[] = [];
  for (const ad of p.ads) {
    const trend = ad.trend ?? 1; // oldest-day multiplier
    const base = {
      spend: ad.m.spend / 30, clicks: ad.m.clicks / 30, impressions: ad.m.impressions / 30,
      leads: ad.m.leads / 30, purchases: ad.m.purchases / 30, revenue: ad.m.revenue / 30,
    };
    for (let off = DAYS - 1; off >= 0; off--) {
      const d = dayDate(off);
      const age = off / (DAYS - 1);                       // 1 = oldest, 0 = today
      const tf = trend < 1 ? 1 - (1 - trend) * age : 1 + (trend - 1) * age; // growth/decline
      const dow = d.getUTCDay();
      const weekend = dow === 0 || dow === 6;
      const season = (weekend ? (p.key === "cafe" ? 1.35 : 0.85) : 1) * (0.82 + rng() * 0.36);
      const f = Math.max(0, tf * season);
      const spend = base.spend * f;
      if (spend < 0.5) continue;
      const impressions = Math.round(base.impressions * f);
      const clicks = Math.round(base.clicks * f);
      const leads = Math.round(base.leads * f);
      const purchases = Math.round(base.purchases * f * (0.9 + rng() * 0.2));
      const revenue = ad.m.purchases ? purchases * (ad.m.revenue / ad.m.purchases) : 0;
      const frequency = r2(ad.m.frequency * (0.92 + rng() * 0.16));
      const reach = frequency > 0 ? Math.round(impressions / frequency) : impressions;
      const ctr = impressions > 0 ? r2((clicks / impressions) * 100) / 100 : 0;
      const vv = ad.reel ? Math.round(impressions * (0.55 + rng() * 0.2)) : 0;
      rows.push({
        organisation_id: orgId, platform: ad.platform,
        campaign_id: `DEMO-${ad.campaign.replace(/\W+/g, "-")}`, campaign_name: ad.campaign,
        adset_id: `DEMO-${ad.adset.replace(/\W+/g, "-")}`, adset_name: ad.adset,
        ad_id: `DEMO-${ad.ad.replace(/\W+/g, "-")}`, ad_name: ad.ad,
        date: ymd(d), objective: ad.objective, budget_type: "daily",
        spend: r2(spend), impressions, reach, frequency, clicks,
        ctr, cpc: clicks ? r2(spend / clicks) : null, cpm: impressions ? r2((spend / impressions) * 1000) : null,
        landing_page_views: Math.round(clicks * (0.7 + rng() * 0.2)),
        leads, purchases, revenue: r2(revenue),
        video_views: vv, three_second_views: ad.reel ? Math.round(vv * 0.8) : 0,
        thruplays: ad.reel ? Math.round(vv * 0.35) : 0,
        hook_rate: ad.reel ? r2(0.25 + rng() * 0.25) : null, hold_rate: ad.reel ? r2(0.1 + rng() * 0.15) : null,
        lead_quality_score: leads ? Math.round((p.key === "creator" ? 80 : 60) + rng() * 16 - 8) : null,
        tracking_status: ad.tracking || "ok",
        utm_source: ad.platform, utm_medium: "paid-social", utm_campaign: ad.campaign,
        source: "csv",
      });
    }
  }
  return rows;
}

// One engine row per ad for a 30-day window, computed analytically from the
// monthly targets × the window's trend factor. This keeps scoring economics
// deterministic (stable verdicts/health) while the STORED daily snapshots stay
// realistically noisy/rounded for the dashboard. windowEndOffset = days-ago of
// the window's recent edge (0 = the latest 30 days).
function aggregateFromSpecs(p: Persona, windowEndOffset: number, windowDays: number) {
  const mid = windowEndOffset + windowDays / 2;
  const age = Math.min(1, mid / (DAYS - 1)); // 0 = now, 1 = oldest
  return p.ads.map((ad) => {
    const trend = ad.trend ?? 1;
    const f = Math.max(0.05, trend < 1 ? 1 - (1 - trend) * age : 1 + (trend - 1) * age);
    return {
      platform: ad.platform, campaign_name: ad.campaign, ad_name: ad.ad,
      spend: r2(ad.m.spend * f), impressions: Math.round(ad.m.impressions * f),
      reach: Math.round((ad.m.impressions * f) / Math.max(1, ad.m.frequency)),
      clicks: Math.round(ad.m.clicks * f), leads: Math.round(ad.m.leads * f),
      purchases: Math.round(ad.m.purchases * f), revenue: r2(ad.m.revenue * f),
      frequency: ad.m.frequency, ctr: ad.m.impressions ? r2((ad.m.clicks / ad.m.impressions) * 100) / 100 : 0,
      tracking_status: ad.tracking || "ok",
    };
  });
}

const cfgFor = (p: Persona) => ({ business_name: p.orgName.replace(" [DEMO]", ""), average_sale_value: p.asv, gross_margin: p.gm, currency: p.currency });

// genuine "scale" proposals for true winners (the engine's scale branch needs a
// health arg it isn't given in analyse(); the app's queue mirrors that, so we add
// scale recs for ads that are clearly clear-to-scale, just like a human would).
function scaleRecsFor(p: Persona, orgId: string, aggRows: any[]) {
  const beRoas = 1 / p.gm;
  return aggRows
    .filter((a) => a.revenue > 0 && a.spend > 0 && a.revenue / a.spend >= beRoas * 1.5 && a.clicks >= 50)
    .sort((a, b) => b.revenue / b.spend - a.revenue / a.spend)
    .slice(0, p.ads.filter((x) => x.note === "winner" || x.note === "rocket").length || 1)
    .map((a) => ({
      organisation_id: orgId, verdict: "scale", entity_name: a.ad_name, platform: a.platform,
      reason: `ROAS ${r2(a.revenue / a.spend)}× on ${a.platform} (break-even ${r2(beRoas)}×) with ${a.purchases} sales — clear-to-scale.`,
      proposal: "Propose ≤20% budget increase (needs a typed YES) AND duplicate the winning angle to a fresh audience.",
      confidence: 0.9, status: "open",
    }));
}

// ----------------------------------------------------------------------------
// DB ops
// ----------------------------------------------------------------------------
async function findDemoUser(admin: SupabaseClient, email: string) {
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const u = data.users.find((x) => (x.email || "").toLowerCase() === email.toLowerCase());
    if (u) return u;
    if (data.users.length < 1000) break;
  }
  return null;
}

async function cleanPersona(admin: SupabaseClient, p: Persona) {
  const u = await findDemoUser(admin, p.email);
  if (!u) { console.log(`  · ${p.email}: no existing user`); return; }
  const { data: mems } = await admin.from("memberships").select("organisation_id").eq("user_id", u.id);
  for (const m of mems || []) {
    const { data: org } = await admin.from("organisations").select("id,name").eq("id", m.organisation_id).maybeSingle();
    if (org && String(org.name).endsWith("[DEMO]")) {
      await admin.from("organisations").delete().eq("id", org.id); // cascades to all child rows
      console.log(`  · removed org "${org.name}"`);
    }
  }
  await admin.auth.admin.deleteUser(u.id); // cascades profiles + memberships
  console.log(`  · removed auth user ${p.email}`);
}

async function seedPersona(admin: SupabaseClient, p: Persona) {
  await cleanPersona(admin, p); // idempotent: start clean for this demo email

  // auth user
  const { data: created, error: uErr } = await admin.auth.admin.createUser({
    email: p.email, password: DEMO_PASSWORD, email_confirm: true, user_metadata: { full_name: p.fullName },
  });
  if (uErr || !created.user) throw new Error(`createUser ${p.email}: ${uErr?.message}`);
  const userId = created.user.id;
  await admin.from("profiles").upsert({ id: userId, email: p.email, full_name: p.fullName });

  // org + membership + plan
  const { data: org, error: oErr } = await admin.from("organisations").insert({
    name: p.orgName, currency: p.currency, average_sale_value: p.asv, gross_margin: p.gm,
    sync_interval_hours: 24, last_synced_at: iso(dayDate(0)),
  }).select("id").single();
  if (oErr || !org) throw new Error(`org ${p.orgName}: ${oErr?.message}`);
  const orgId = org.id as string;
  await admin.from("memberships").insert({ organisation_id: orgId, user_id: userId, role: "owner" });
  await admin.from("billing_subscriptions").insert({
    organisation_id: orgId, plan: "expert", status: "active",
    stripe_customer_id: `cus_DEMO_${p.key}`, current_period_end: iso(dayDate(-30)),
  });

  // connected accounts
  await admin.from("connected_ad_accounts").insert(p.accounts.map((a) => ({
    organisation_id: orgId, platform: a.platform, external_account_id: a.external, display_name: a.display, status: "connected",
  })));

  // daily snapshots
  const rows = genDailyRows(p, orgId);
  for (let i = 0; i < rows.length; i += 500) await admin.from("campaign_snapshots").insert(rows.slice(i, i + 500));

  // 6 monthly historical reports + health scores (oldest → newest) using the real engine
  for (let mi = 5; mi >= 0; mi--) {
    const agg = aggregateFromSpecs(p, mi * 30, 30);
    if (!agg.length) continue;
    const res = analyse(agg as any, cfgFor(p));
    const when = iso(dayDate(mi * 30));
    await admin.from("health_scores").insert({
      organisation_id: orgId, scope: "account", total: res.health.total, band: res.health.band,
      breakdown: res.health.breakdown, data_confidence: (res.health as any).breakdown?.data_confidence?.score ?? null,
      period_start: ymd(dayDate(mi * 30 + 30)), period_end: ymd(dayDate(mi * 30)), created_at: when,
    });
    const month = dayDate(mi * 30).toLocaleString("en-AU", { month: "long", year: "numeric" });
    await admin.from("reports").insert({
      organisation_id: orgId, title: `${month} — health ${Math.round(res.health.total)}`,
      period: ymd(dayDate(mi * 30)), payload: res, created_by: userId, created_at: when,
    });
  }

  // current proposals queue from the latest 30-day analysis
  const aggNow = aggregateFromSpecs(p, 0, 30);
  const resNow = analyse(aggNow as any, cfgFor(p));
  await refreshOpenRecommendations(admin, orgId, resNow.decisions as any[]);
  const scale = scaleRecsFor(p, orgId, aggNow);
  if (scale.length) await admin.from("recommendations").insert(scale);

  // content posts
  await admin.from("content_posts").insert(p.posts.map((po) => ({
    organisation_id: orgId, platform: po.platform, caption: po.caption, media_type: po.media_type,
    status: po.status, source: "studio", created_by: userId,
    published_at: po.status === "published" ? iso(dayDate(po.whenDays)) : null,
    scheduled_at: po.status === "scheduled" ? iso(dayDate(po.whenDays)) : null,
  })));

  // creative assets
  await admin.from("creative_assets").insert(p.creatives.map((c) => ({
    organisation_id: orgId, kind: c.kind, source: "link", provider: c.provider, title: c.title, url: c.url, linked_campaign: c.linked, created_by: userId,
  })));

  // notifications
  await admin.from("notification_rules").insert({ organisation_id: orgId, email: p.email, weekly_digest: true, critical_alerts: true });

  // messenger (café)
  if (p.messenger) {
    await admin.from("messenger_pages").insert({
      organisation_id: orgId, external_page_id: p.messenger.page, display_name: p.messenger.display, channel: "messenger",
      business_hours: { mon_fri: "07:00-16:00", weekend: "08:00-15:00" }, ai_enabled: true,
      ai_facts: "Specialty café in Brunswick. Open 7am–4pm weekdays. Famous for brown-butter banana bread and single-origin cold brew.",
      ai_voice: "Warm, upbeat, concise.",
    });
    await admin.from("messenger_rules").insert(p.messenger.rules.map((rl) => ({
      organisation_id: orgId, external_page_id: p.messenger!.page, trigger_type: rl.trigger_type, trigger: rl.trigger || null, reply: rl.reply, priority: rl.priority || 0,
    })));
  }

  // white-label
  if (p.whiteLabel) await admin.from("white_label_profiles").insert({ organisation_id: orgId, ...p.whiteLabel });

  return { orgId, snapshots: rows.length, current: resNow, scale: scale.length };
}

// ----------------------------------------------------------------------------
// dry-run (no DB) — proves the pipeline + lets us tune the verdict/band mix
// ----------------------------------------------------------------------------
function dryRun() {
  for (const p of PERSONAS) {
    const rows = genDailyRows(p, "dry-org");
    const agg = aggregateFromSpecs(p, 0, 30);
    const res = analyse(agg as any, cfgFor(p));
    const recs = (res.decisions as any[]).filter((d) => ["scale", "kill", "reduce", "refresh", "fix-tracking"].includes(d.verdict));
    const scale = scaleRecsFor(p, "dry-org", agg);
    console.log(`\n━━ ${p.orgName}  (${p.key}) ━━`);
    console.log(`   snapshots: ${rows.length}  |  asv $${p.asv}  gm ${p.gm}  break-even CPA ~$${r2(p.asv * p.gm)}`);
    console.log(`   HEALTH: ${Math.round(res.health.total)}/100  ${res.health.band}   (${res.health.guidance?.slice(0, 70) || ""})`);
    console.log(`   summary: spend $${Math.round(res.summary.spend)}  rev $${Math.round(res.summary.revenue)}  ROAS ${r2(res.summary.roas || 0)}  CPA $${r2(res.summary.cpa || 0)}`);
    console.log(`   proposals (engine):`);
    for (const d of res.decisions as any[]) console.log(`     · ${String(d.verdict).padEnd(16)} ${d.name}`);
    console.log(`   + manual scale recs: ${scale.map((s) => s.entity_name).join(", ") || "(none)"}`);
    const actionable = recs.map((d) => d.verdict);
    console.log(`   → actionable queue: ${[...new Set([...actionable, ...scale.map(() => "scale")])].join(", ")}`);
  }
  console.log("\n(dry-run: nothing written)\n");
}

// ----------------------------------------------------------------------------
async function main() {
  if (DRY) { dryRun(); return; }
  if (!URL || !KEY) {
    console.error("Missing credentials. Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (env or .env.local), or use --dry-run.");
    process.exit(1);
  }
  const admin = createClient(URL, KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  console.log(`AdPilot demo seeder → ${URL}`);
  console.log(`Only ever touches the demo emails + "[DEMO]" orgs.\n`);

  if (CLEAN) {
    console.log("Removing demo accounts…");
    for (const p of PERSONAS) await cleanPersona(admin, p);
    console.log("\nDone. Demo data removed.\n");
    return;
  }

  for (const p of PERSONAS) {
    console.log(`Seeding ${p.orgName}…`);
    const out = await seedPersona(admin, p);
    console.log(`  ✓ ${p.email}  ·  ${out.snapshots} snapshots  ·  health ${Math.round(out.current.health.total)}/100 ${out.current.health.band}  ·  +${out.scale} scale recs\n`);
  }
  console.log("Done. Log in with:");
  for (const p of PERSONAS) console.log(`  • ${p.email}  /  ${DEMO_PASSWORD}   (${p.key})`);
  console.log("");
}
main().catch((e) => { console.error(e); process.exit(1); });
