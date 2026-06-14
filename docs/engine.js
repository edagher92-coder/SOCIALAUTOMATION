/*
 * AdPilot OS — client-side engine (faithful port of tools/adpilot/*.py).
 * Runs entirely in the browser: metrics, 13-factor health score, auto-audit,
 * and SAFE decisions. No backend, no dependencies, no secrets. Read-only.
 * A parity test (engine.test.js) checks it matches the Python engine.
 */
(function (root) {
  "use strict";

  // ---------- metrics ----------
  const safeDiv = (n, d) => (!d ? null : n / d);
  const M = {
    safeDiv,
    ctr: (clicks, imp) => safeDiv(clicks, imp),
    cpc: (spend, clicks) => safeDiv(spend, clicks),
    cpm: (spend, imp) => { const v = safeDiv(spend, imp); return v == null ? null : v * 1000; },
    cpl: (spend, leads) => safeDiv(spend, leads),
    cpa: (spend, p) => safeDiv(spend, p),
    roas: (rev, spend) => safeDiv(rev, spend),
    mer: (rev, spend) => safeDiv(rev, spend),
    frequency: (imp, reach) => safeDiv(imp, reach),
    hookRate: (s3, imp) => safeDiv(s3, imp),
    holdRate: (tp, s3) => safeDiv(tp, s3),
    convRate: (p, clicks) => safeDiv(p, clicks),
    breakEvenCpa: (avg, gm) => avg * gm,
    breakEvenRoas: (gm) => safeDiv(1, gm),
    variancePct: (a, t) => safeDiv((a - t) * 100, t),
    isRoasAnomaly: (r) => r != null && r >= 20,
    blendedCpa: (spends, convs) => safeDiv(spends.reduce((a, b) => a + b, 0), convs.reduce((a, b) => a + b, 0)),
    fmt: (v, dp = 2) => v == null ? "N/A" : Number(v).toLocaleString(undefined, { minimumFractionDigits: dp, maximumFractionDigits: dp }),
  };

  // ---------- health (canonical 13-factor) ----------
  const WEIGHTS = {
    tracking_quality: 15, cpa: 15, spend_efficiency: 12, conversion_rate: 10,
    ctr: 8, lead_quality: 8, creative_freshness: 8, cpc: 7, naming_quality: 5,
    offer_strength: 5, landing_page_alignment: 4, budget_pacing: 2, data_confidence: 1,
  };
  const BANDS = [[80, "Green", "Healthy — scale-eligible if tracking is clean."],
                 [60, "Yellow", "Watch — fix the weak factors before scaling."],
                 [40, "Orange", "Needs work — significant issues, act this week."],
                 [0, "Red", "Critical — stop and fix before spending more."]];
  function band(score) { for (const [f, n, g] of BANDS) if (score >= f) return [n, g]; return ["Red", BANDS[3][2]]; }

  function computeHealth(factorScores, naFactors) {
    const na = new Set(naFactors || []);
    for (const f in WEIGHTS) if (!(f in factorScores)) na.add(f);
    let activeWeight = 0;
    for (const f in WEIGHTS) if (!na.has(f)) activeWeight += WEIGHTS[f];
    if (activeWeight === 0) throw new Error("All factors N/A");
    const breakdown = {}; let total = 0;
    for (const f in WEIGHTS) {
      if (na.has(f)) { breakdown[f] = { score: null, weight: WEIGHTS[f], adjusted_weight: 0, weighted_points: 0 }; continue; }
      const adj = WEIGHTS[f] * 100 / activeWeight;
      const pts = factorScores[f] * adj / 100;
      total += pts;
      breakdown[f] = { score: factorScores[f], weight: WEIGHTS[f], adjusted_weight: adj, weighted_points: pts };
    }
    total = Math.round(total * 100) / 100;
    const [name, guidance] = band(total);
    // weakest = biggest lost weighted points
    const losses = [];
    for (const f in breakdown) { const b = breakdown[f]; if (b.score == null) continue; losses.push([b.adjusted_weight * (100 - b.score) / 100, f]); }
    losses.sort((a, b) => b[0] - a[0]);
    return { total, band: name, guidance, breakdown, weakest: losses.slice(0, 3).map(x => x[1]) };
  }

  // ---------- audit (heuristic factor derivation) ----------
  const NEUTRAL = 70;
  function cpaScore(cpa, be) {
    if (cpa == null || be <= 0) return null;
    const over = (cpa - be) / be;
    const pts = [[0, 100], [0.10, 80], [0.25, 60], [0.50, 35], [0.75, 10]];
    if (over <= 0) return 100; if (over >= 0.75) return 10;
    for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]; if (over >= x0 && over <= x1) return y0 + (over - x0) / (x1 - x0) * (y1 - y0); }
    return 10;
  }
  function ctrScore(ctr) {
    if (ctr == null) return 50; const p = ctr * 100;
    if (p >= 2) return 95; if (p >= 1) return 60 + (p - 1) * 35; if (p >= 0.5) return 30 + (p - 0.5) / 0.5 * 30;
    return Math.max(10, p / 0.5 * 30);
  }
  function freshnessScore(freq) { if (freq == null || freq < 1) return 80; if (freq <= 2) return 90; if (freq <= 3) return 65; if (freq <= 4) return 35; return 12; }
  function convRateScore(cr) { if (cr == null) return 50; const p = cr * 100; if (p >= 3) return 90; if (p >= 1.5) return 55 + (p - 1.5) / 1.5 * 35; if (p >= 0.5) return 25 + (p - 0.5) / 1.0 * 30; return Math.max(10, p / 0.5 * 25); }
  function trackingScore(rows, agg) {
    const w = { ok: 100, active: 100, partial: 60, review: 30, broken: 12 };
    const tot = rows.reduce((a, r) => a + (r.spend || 0), 0) || 1;
    let s = 0; for (const r of rows) s += (w[(r.tracking_status || "ok").toLowerCase()] ?? 70) * (r.spend || 0) / tot;
    if (agg.spend > 0 && agg.purchases === 0 && agg.leads === 0) s = Math.min(s, 30);
    const missing = rows.filter(r => !r.utm_campaign).length;
    if (rows.length && missing) s -= 15 * missing / rows.length;
    return Math.max(0, Math.min(100, s));
  }
  function namingScore(rows) {
    if (!rows.length) return NEUTRAL; let ok = 0;
    for (const r of rows) { const segs = String(r.campaign_name || "").split("_"); const hasDate = segs.some(x => /^\d{8}$/.test(x)); if (segs.length >= 4 && hasDate) ok++; }
    return 100 * ok / rows.length;
  }
  function dataConfScore(agg) { if (agg.clicks >= 200 || agg.purchases >= 30) return 100; if (agg.clicks >= 50 || agg.purchases >= 15) return 70; if (agg.clicks >= 20) return 40; return 15; }

  function aggregate(rows) {
    const s = k => rows.reduce((a, r) => a + (r[k] || 0), 0);
    const spend = s("spend");
    return { spend, impressions: s("impressions"), reach: s("reach"), clicks: s("clicks"),
      leads: s("leads"), purchases: s("purchases"), revenue: s("revenue"),
      ctr: M.ctr(s("clicks"), s("impressions")), cpa: M.cpa(spend, s("purchases")),
      roas: M.roas(s("revenue"), spend), conv_rate: M.convRate(s("purchases"), s("clicks")) };
  }
  function sev(score) { if (score < 25) return "CRITICAL"; if (score < 45) return "HIGH"; if (score < 65) return "MEDIUM"; return "LOW"; }

  function scoreAccount(rows, cfg) {
    const agg = aggregate(rows);
    const be = M.breakEvenCpa(cfg.average_sale_value, cfg.gross_margin);
    const freq = M.frequency(agg.impressions, agg.reach);
    const factors = {}; const na = [];
    factors.tracking_quality = trackingScore(rows, agg);
    const cs = cpaScore(agg.cpa, be); if (cs == null) na.push("cpa"); else factors.cpa = cs;
    factors.ctr = ctrScore(agg.ctr);
    factors.conversion_rate = convRateScore(agg.conv_rate);
    factors.creative_freshness = freshnessScore(freq);
    factors.naming_quality = namingScore(rows);
    factors.data_confidence = dataConfScore(agg);
    if (agg.spend > 0 && agg.purchases === 0 && agg.leads === 0) factors.data_confidence = Math.min(factors.data_confidence, 20);
    factors.budget_pacing = 85;
    const lq = rows.map(r => r.lead_quality_score).filter(v => v); if (!lq.length) na.push("lead_quality"); else factors.lead_quality = lq.reduce((a, b) => a + b, 0) / lq.length;
    const effBase = cs == null ? 50 : cs;
    factors.spend_efficiency = 0.6 * effBase + 0.4 * factors.data_confidence;
    factors.cpc = 0.5 * factors.ctr + 0.5 * NEUTRAL;
    factors.offer_strength = NEUTRAL; factors.landing_page_alignment = NEUTRAL;
    const res = computeHealth(factors, na);
    res.agg = agg; res.break_even_cpa = be; res.findings = findings(factors, agg, be, freq, na);
    return res;
  }
  function findings(factors, agg, be, freq, na) {
    const out = [];
    if (agg.spend > 0 && agg.purchases === 0 && agg.leads === 0) out.push({ severity: "CRITICAL", factor: "tracking_quality", message: "Spend with zero recorded conversions/leads — verify pixel/events before any budget decision." });
    if ("cpa" in factors && agg.cpa && agg.cpa > be) out.push({ severity: sev(factors.cpa), factor: "cpa", message: `CPA ${M.fmt(agg.cpa)} over break-even ${M.fmt(be)}.` });
    if (freq && freq >= 4) out.push({ severity: "HIGH", factor: "creative_freshness", message: `Frequency ${freq.toFixed(1)} ≥ 4.0 — creative fatigue; refresh.` });
    const seen = new Set(out.map(o => o.factor));
    Object.entries(factors).sort((a, b) => a[1] - b[1]).forEach(([f, s]) => { if (s < 45 && !seen.has(f)) { out.push({ severity: sev(s), factor: f, message: `${f} weak (score ${Math.round(s)}).` }); seen.add(f); } });
    if (na.length) out.push({ severity: "INFO", factor: na.join(","), message: "Not derivable from media data — needs human input (e.g. lead quality from CRM; offer/landing review)." });
    return out.slice(0, 8);
  }
  function scoreByCampaign(rows, cfg) {
    const groups = {};
    for (const r of rows) { const k = r.campaign_name || r.campaign_id || "(unnamed)"; (groups[k] = groups[k] || []).push(r); }
    const out = Object.entries(groups).map(([name, grp]) => {
      const res = scoreAccount(grp, cfg); const a = res.agg;
      return { campaign: name, platforms: [...new Set(grp.map(r => r.platform || "?"))].sort(), ads: grp.length,
        spend: a.spend, cpa: a.cpa, roas: a.roas, health: res.total, band: res.band,
        top_finding: res.findings.length ? res.findings[0].message : "" };
    });
    out.sort((a, b) => a.health - b.health);
    return out;
  }

  // ---------- decisions ----------
  function decide(row, cfg, ctrPeak, health) {
    const g = k => row[k] || 0;
    const spend = g("spend"), clicks = g("clicks"), leads = g("leads"), purchases = g("purchases"), revenue = g("revenue");
    let freq = row.frequency || M.frequency(g("impressions"), g("reach")) || 0;
    let curCtr = row.ctr; if (curCtr == null) curCtr = M.ctr(clicks, g("impressions"));
    const be = M.breakEvenCpa(cfg.average_sale_value, cfg.gross_margin);
    const cpa = M.cpa(spend, purchases), roas = M.roas(revenue, spend);
    const tracking = (row.tracking_status || "ok").toLowerCase();
    const out = (verdict, reason, proposal) => ({ verdict, reason, proposal, safe: true });
    if (tracking === "broken" || tracking === "review" || (spend > 0 && purchases === 0 && leads === 0)) {
      if (spend >= be) return out("fix-tracking", "Spend with zero recorded results and/or tracking flagged — verify pixel/events before any budget or scale decision.", "Audit pixel + events (atlas). Do NOT scale or cut yet.");
    }
    const conf = clicks >= 50 || (purchases || leads) >= 15;
    if (!conf) return out("insufficient-data", "Below decision floor (<50 clicks and <15 conversions). Not statistically reliable.", "Let spend accumulate; re-evaluate later. No change.");
    if (M.isRoasAnomaly(roas)) return out("fix-tracking", `ROAS ${M.fmt(roas)} is implausibly high — likely a tracking anomaly.`, "Verify conversion values before acting on this number.");
    const ctrDropped = ctrPeak && curCtr != null && ctrPeak > 0 && (ctrPeak - curCtr) / ctrPeak >= 0.25;
    if (freq >= 4 && (ctrDropped || (curCtr != null && curCtr < 0.01))) return out("refresh", `Creative fatigue: frequency ${freq.toFixed(1)} ≥ 4.0 with falling/low CTR.`, "Build 3-5 fresh variants of the winning angle as PAUSED duplicates; broaden audience. Original untouched.");
    if (cpa != null) {
      if (cpa <= be) { if (health != null && health >= 70 && tracking === "ok") return out("scale", `CPA ${M.fmt(cpa)} ≤ break-even ${M.fmt(be)}, health ${Math.round(health)} ≥ 70.`, "Propose ≤20% budget increase (needs typed YES) AND duplicate the winning angle."); return out("keep", `CPA ${M.fmt(cpa)} ≤ break-even ${M.fmt(be)} but not clear-to-scale (health/tracking).`, "Keep running; duplicate the angle; clean tracking before scaling."); }
      if (cpa <= be * 1.5) return out("reduce", `CPA ${M.fmt(cpa)} above break-even ${M.fmt(be)} but recoverable.`, "Reduce budget; test a new angle as a paused duplicate.");
      return out("kill", `CPA ${M.fmt(cpa)} > 1.5× break-even ${M.fmt(be)}.`, "Pause this ad (reversible). Reallocate to a winner.");
    }
    if (leads > 0 && purchases === 0) return out("keep", `CPL ${M.fmt(M.cpl(spend, leads))} but no sales recorded — likely a lead quality / qualification / follow-up / offer issue, not media.`, "Route to lead-quality-analyser + titan; don't scale on CPL alone.");
    return out("keep", "Within acceptable range.", "Monitor; no change proposed.");
  }

  // ---------- ingest (CSV text -> normalised rows) ----------
  const NUMERIC = new Set(["daily_budget","lifetime_budget","spend","impressions","reach","frequency","clicks","ctr","cpc","cpm","landing_page_views","leads","purchases","revenue","cost_per_lead","cost_per_purchase","roas","video_views","three_second_views","six_second_views","thruplays","hook_rate","hold_rate","comments","shares","saves","lead_quality_score","sales_count","gross_profit"]);
  const FIELDS = ["business_id","business_name","platform","ad_account_id","campaign_id","campaign_name","adset_id","adset_name","ad_id","ad_name","date","objective","budget_type","daily_budget","lifetime_budget","spend","impressions","reach","frequency","clicks","ctr","cpc","cpm","landing_page_views","leads","purchases","revenue","cost_per_lead","cost_per_purchase","roas","video_views","three_second_views","six_second_views","thruplays","hook_rate","hold_rate","comments","shares","saves","lead_quality_score","sales_count","gross_profit","utm_source","utm_medium","utm_campaign","utm_content","utm_term","tracking_status","recommendation","notes"];
  const META_MAP = { "Campaign name": "campaign_name", "Ad set name": "adset_name", "Ad name": "ad_name", "Day": "date", "Reporting starts": "date", "Amount spent (AUD)": "spend", "Amount spent": "spend", "Impressions": "impressions", "Reach": "reach", "Frequency": "frequency", "Link clicks": "clicks", "Clicks (all)": "clicks", "Landing page views": "landing_page_views", "Leads": "leads", "Purchases": "purchases", "Purchases conversion value": "revenue", "3-second video plays": "three_second_views", "ThruPlays": "thruplays" };
  const TT_MAP = { "Campaign name": "campaign_name", "Ad group name": "adset_name", "Ad name": "ad_name", "Date": "date", "Cost": "spend", "Impressions": "impressions", "Reach": "reach", "Frequency": "frequency", "Clicks": "clicks", "Landing page views": "landing_page_views", "Leads (form)": "leads", "Conversions": "purchases", "Total conversion value": "revenue", "Video views": "video_views", "2-second video views": "three_second_views", "Video views at 100%": "thruplays" };

  function toNum(v) { if (v == null) return null; const s = String(v).trim().replace(/[,$%]/g, ""); if (s === "" || ["N/A","NA","-"].includes(s.toUpperCase())) return null; const n = Number(s); return isNaN(n) ? null : n; }
  function detectPlatform(h) { const s = new Set(h); if (s.has("Ad group name") || s.has("Cost")) return "tiktok"; if (s.has("Ad set name") || s.has("Amount spent (AUD)") || s.has("ThruPlays")) return "meta"; return "universal"; }

  function parseCSV(text) {
    const rows = []; let i = 0, field = "", row = [], inq = false;
    while (i < text.length) { const c = text[i];
      if (inq) { if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inq = false; } else field += c; }
      else if (c === '"') inq = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(field); rows.push(row); row = []; field = ""; }
      else field += c;
      i++;
    }
    if (field !== "" || row.length) { row.push(field); rows.push(row); }
    return rows.filter(r => r.length && !(r.length === 1 && r[0] === ""));
  }

  function normalise(raw, platform) {
    const map = platform === "meta" ? META_MAP : platform === "tiktok" ? TT_MAP : null;
    const row = {}; FIELDS.forEach(f => row[f] = null);
    if (platform === "meta" || platform === "tiktok") row.platform = platform;
    for (const key in raw) {
      const field = map ? (map[key] || (FIELDS.includes(key) ? key : null)) : (FIELDS.includes(key) ? key : null);
      if (!field) continue;
      row[field] = NUMERIC.has(field) ? toNum(raw[key]) : raw[key];
    }
    if (platform === "meta" || platform === "tiktok") row.platform = platform;
    return row;
  }
  function fillComputed(r) {
    const g = k => r[k] || 0;
    if (r.frequency == null) r.frequency = M.frequency(g("impressions"), g("reach"));
    if (r.ctr == null) r.ctr = M.ctr(g("clicks"), g("impressions"));
    if (r.cpc == null) r.cpc = M.cpc(g("spend"), g("clicks"));
    if (r.cpm == null) r.cpm = M.cpm(g("spend"), g("impressions"));
    if (r.cost_per_lead == null) r.cost_per_lead = M.cpl(g("spend"), g("leads"));
    if (r.cost_per_purchase == null) r.cost_per_purchase = M.cpa(g("spend"), g("purchases"));
    if (r.roas == null) r.roas = M.roas(g("revenue"), g("spend"));
    if (r.hook_rate == null) r.hook_rate = M.hookRate(g("three_second_views"), g("impressions"));
    if (r.hold_rate == null) r.hold_rate = M.holdRate(g("thruplays"), g("three_second_views"));
    return r;
  }
  function parseCsvText(text, platform) {
    const grid = parseCSV(text); if (!grid.length) return [];
    const headers = grid[0]; const plat = platform || detectPlatform(headers);
    return grid.slice(1).map(cells => { const raw = {}; headers.forEach((h, idx) => raw[h] = cells[idx]); return fillComputed(normalise(raw, plat)); });
  }

  const API = { metrics: M, WEIGHTS, band, computeHealth, scoreAccount, scoreByCampaign, decide, parseCsvText, detectPlatform };
  root.AdPilot = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
