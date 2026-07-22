import "server-only";
import { analyse } from "@/lib/engine";
import { sendEmail } from "@/lib/email/resend";
import { refreshOpenRecommendations } from "@/lib/proposals";
import { evaluateRules } from "@/lib/rules/evaluator";
import { alertRulesForOrg } from "@/lib/rules/persistence";
import { getAudienceInsights } from "@/lib/audience/insights";
import { buildAudienceProposals } from "@/lib/audience/proposals";

// Shared scheduled scoring + breach-alert logic, used by both the daily
// auto-analysis cron and the cadence-driven auto-sync cron so they never diverge.

function breaches(result: any): string[] {
  const a: string[] = [];
  for (const f of result.health?.findings || []) if (f.severity === "CRITICAL") a.push(f.message);
  if (result.health?.band === "Red") a.push(`Account health is RED (${Math.round(result.health.total)}/100).`);
  return Array.from(new Set(a));
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  }[character] || character));
}

export async function scoreAndAlertOrg(
  admin: any,
  org: { id: string; name?: string; average_sale_value?: number; gross_margin?: number; monthly_budget?: number | null; lead_close_rate?: number | null },
): Promise<{ scored: boolean; alerted: boolean }> {
  const since = new Date(Date.now() - 14 * 864e5).toISOString().slice(0, 10);
  const { data: snaps } = await admin.from("campaign_snapshots")
    .select("campaign_name,ad_id,ad_name,date,platform,spend,impressions,reach,frequency,clicks,ctr,cpc,cpm,leads,purchases,revenue,roas_meta,hold_rate,lead_quality_score,tracking_status")
    .eq("organisation_id", org.id).gte("date", since).limit(5000);
  if (!snaps || snaps.length === 0) return { scored: false, alerted: false };

  // Budget pacing context (account-level, current month) — null budget => neutral factor.
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
  const daysInMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
  const monthlyBudget = Number(org.monthly_budget) > 0 ? Number(org.monthly_budget) : null;
  let spendToDate = 0;
  const [{ data: monthSnaps }, { data: leadRows }] = await Promise.all([
    monthlyBudget ? admin.from("campaign_snapshots").select("spend").eq("organisation_id", org.id).gte("date", monthStart).limit(10000) : Promise.resolve({ data: [] }),
    admin.from("lead_events").select("lead_quality_score").eq("organisation_id", org.id).gte("created_at", new Date(Date.now() - 30 * 864e5).toISOString()).limit(10000),
  ]);
  for (const r of (monthSnaps || [])) spendToDate += Number((r as any).spend) || 0;
  // lead_events.lead_quality_score is 0–10; scale to the 0–100 factor space.
  const lqScores: number[] = (leadRows || []).map((r: any) => Number(r.lead_quality_score)).filter((v: number) => v > 0);
  const leadQualityAvg = lqScores.length ? Math.min(100, (lqScores.reduce((a: number, b: number) => a + b, 0) / lqScores.length) * 10) : null;

  const result = analyse(snaps as any, {
    // Guard against a stored 0/negative (nullish-coalescing wouldn't catch 0) — a non-positive
    // average-sale-value or margin would produce garbage break-even/ROAS economics.
    average_sale_value: Number(org.average_sale_value) > 0 ? Number(org.average_sale_value) : 200,
    gross_margin: Number(org.gross_margin) > 0 ? Number(org.gross_margin) : 0.6, currency: "AUD",
    lead_close_rate: Number(org.lead_close_rate) > 0 ? Number(org.lead_close_rate) : null,
    pacing: { monthlyBudget, spendToDate, daysElapsed: now.getUTCDate(), daysInMonth },
    lead_quality_avg: leadQualityAvg,
  });
  await admin.from("health_scores").insert({ organisation_id: org.id, scope: "account", total: result.health.total, band: result.health.band, breakdown: result.health.breakdown });

  // Attach live follower demographics to the report payload when a real profile is connected
  // (Facebook Page / Instagram / TikTok). Best-effort + live-only — sample data never lands in a
  // client report, and a slow/failed audience read must never block scoring.
  try {
    const ai = await getAudienceInsights(org.id);
    if (ai && ai.source !== "sample") {
      const p = buildAudienceProposals(ai);
      (result as any).audience = { platform: ai.platform, handle: ai.handle, followerCount: ai.followerCount, source: ai.source, summary: p.reportSummary };
    }
  } catch { /* audience enrichment is best-effort */ }

  await admin.from("reports").insert({ organisation_id: org.id, title: `Scheduled — health ${Math.round(result.health.total)}`, period: new Date().toISOString().slice(0, 10), payload: result });

  // V6 P1: upsert the per-day account rollup (one row per org per day) for fast trend reads.
  // Additive + best-effort — a missing table (pre-0021) or error never blocks scoring.
  try {
    const s = result.summary;
    await admin.from("account_daily_metrics").upsert({
      organisation_id: org.id, date: new Date().toISOString().slice(0, 10),
      spend: s.spend ?? 0, impressions: s.impressions ?? 0, clicks: s.clicks ?? 0,
      leads: s.leads ?? 0, purchases: s.purchases ?? 0, revenue: s.revenue ?? 0,
      health_total: result.health.total, health_band: result.health.band,
    }, { onConflict: "organisation_id,date" });
  } catch { /* trend rollup is best-effort */ }

  // Refresh the open Proposals queue from this analysis (actionable verdicts only, deduped).
  // Approved/dismissed/done history is preserved — we only replace the 'open' set.
  // Platform-aware dedupe + insert-then-clear safety live in the shared helper so the
  // cron path and the CSV scoring route can never diverge.
  await refreshOpenRecommendations(admin, org.id, (result.decisions || []) as any[]);

  // Run the workspace's saved rule library (or safe presets for a new/pre-migration
  // workspace), then keep the alert log current. Signals that no longer match are
  // resolved; a later recurrence reopens the same deduped event.
  const configuredRules = await alertRulesForOrg(admin, org.id);
  const hits = evaluateRules(configuredRules, snaps as any[]);
  try {
    if (hits.length) {
      const { error } = await admin.from("alert_events").upsert(
        hits.map((hit) => ({
          organisation_id: org.id,
          rule_id: hit.rule_id,
          severity: hit.severity,
          campaign_name: hit.entity,
          metric: hit.metric,
          value: hit.value,
          threshold: hit.threshold,
          message: hit.message,
          status: "open",
          dedupe_key: hit.dedupe_key,
        })),
        { onConflict: "organisation_id,dedupe_key" },
      );
      if (error) throw error;
    }
    const { data: openEvents } = await admin.from("alert_events")
      .select("id,dedupe_key").eq("organisation_id", org.id).eq("status", "open").limit(5000);
    const currentKeys = new Set(hits.map((hit) => hit.dedupe_key));
    const staleIds = (openEvents || []).filter((event: any) => !currentKeys.has(event.dedupe_key)).map((event: any) => event.id);
    if (staleIds.length) await admin.from("alert_events").update({ status: "resolved" }).in("id", staleIds).eq("organisation_id", org.id);
  } catch { /* alert lifecycle is best-effort and never blocks scoring */ }

  let alerted = false;
  // Fold critical rule hits into the breach list so they reach the alert email too.
  const b = Array.from(new Set([...breaches(result), ...hits.filter((h) => h.severity === "critical").map((h) => h.message)]));
  if (b.length) {
    const { data: rule } = await admin.from("notification_rules").select("email,critical_alerts").eq("organisation_id", org.id).maybeSingle();
    if (rule?.critical_alerts && rule.email) {
      const html = `<h2 style="font-family:sans-serif">⚠ AdPilot OS alert — ${escapeHtml(org.name ?? "your account")}</h2>
        <p style="font-family:sans-serif">${result.health.band} · ${Math.round(result.health.total)}/100</p>
        <ul style="font-family:sans-serif">${b.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>
        <p style="font-family:sans-serif">Open your dashboard for the safe proposals. (Read-only — nothing was changed.)</p>`;
      try { await sendEmail(rule.email, `⚠ AdPilot alert — ${org.name ?? "your account"}`, html); alerted = true; } catch { /* email best-effort */ }
    }
  }
  return { scored: true, alerted };
}
