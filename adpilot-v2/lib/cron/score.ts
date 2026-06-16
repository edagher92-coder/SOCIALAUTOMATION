import "server-only";
import { analyse } from "@/lib/engine";
import { sendEmail } from "@/lib/email/resend";
import { refreshOpenRecommendations } from "@/lib/proposals";
import { evaluateAlertRules } from "@/lib/cron/alerts";

// Shared scheduled scoring + breach-alert logic, used by both the daily
// auto-analysis cron and the cadence-driven auto-sync cron so they never diverge.

function breaches(result: any): string[] {
  const a: string[] = [];
  for (const f of result.health?.findings || []) if (f.severity === "CRITICAL") a.push(f.message);
  if (result.health?.band === "Red") a.push(`Account health is RED (${Math.round(result.health.total)}/100).`);
  return Array.from(new Set(a));
}

export async function scoreAndAlertOrg(
  admin: any,
  org: { id: string; name?: string; average_sale_value?: number; gross_margin?: number; monthly_budget?: number | null },
): Promise<{ scored: boolean; alerted: boolean }> {
  const since = new Date(Date.now() - 14 * 864e5).toISOString().slice(0, 10);
  const { data: snaps } = await admin.from("campaign_snapshots")
    .select("campaign_name,platform,spend,impressions,reach,frequency,clicks,ctr,cpc,cpm,leads,purchases,revenue,lead_quality_score,tracking_status")
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
    pacing: { monthlyBudget, spendToDate, daysElapsed: now.getUTCDate(), daysInMonth },
    lead_quality_avg: leadQualityAvg,
  });
  await admin.from("health_scores").insert({ organisation_id: org.id, scope: "account", total: result.health.total, band: result.health.band, breakdown: result.health.breakdown });
  await admin.from("reports").insert({ organisation_id: org.id, title: `Scheduled — health ${Math.round(result.health.total)}`, period: new Date().toISOString().slice(0, 10), payload: result });

  // Refresh the open Proposals queue from this analysis (actionable verdicts only, deduped).
  // Approved/dismissed/done history is preserved — we only replace the 'open' set.
  // Platform-aware dedupe + insert-then-clear safety live in the shared helper so the
  // cron path and the CSV scoring route can never diverge.
  await refreshOpenRecommendations(admin, org.id, (result.decisions || []) as any[]);

  // Threshold-alert rule library (read-only signal): evaluate the synced snapshots and upsert
  // open hits, deduped per (org, rule+campaign). Best-effort — never blocks scoring.
  const hits = evaluateAlertRules(snaps as any[]);
  if (hits.length) {
    try {
      await admin.from("alert_events").upsert(
        hits.map((h) => ({ organisation_id: org.id, rule_id: h.rule_id, severity: h.severity, campaign_name: h.campaign_name, metric: h.metric, value: h.value, threshold: h.threshold, message: h.message, status: "open", dedupe_key: h.dedupe_key })),
        { onConflict: "organisation_id,dedupe_key" },
      );
    } catch { /* alert log is best-effort */ }
  }

  let alerted = false;
  // Fold critical rule hits into the breach list so they reach the alert email too.
  const b = Array.from(new Set([...breaches(result), ...hits.filter((h) => h.severity === "critical").map((h) => h.message)]));
  if (b.length) {
    const { data: rule } = await admin.from("notification_rules").select("email,critical_alerts").eq("organisation_id", org.id).maybeSingle();
    if (rule?.critical_alerts && rule.email) {
      const html = `<h2 style="font-family:sans-serif">⚠ AdPilot OS alert — ${org.name ?? "your account"}</h2>
        <p style="font-family:sans-serif">${result.health.band} · ${Math.round(result.health.total)}/100</p>
        <ul style="font-family:sans-serif">${b.map((x) => `<li>${x}</li>`).join("")}</ul>
        <p style="font-family:sans-serif">Open your dashboard for the safe proposals. (Read-only — nothing was changed.)</p>`;
      try { await sendEmail(rule.email, `⚠ AdPilot alert — ${org.name ?? "your account"}`, html); alerted = true; } catch { /* email best-effort */ }
    }
  }
  return { scored: true, alerted };
}
