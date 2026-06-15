import "server-only";
import { analyse } from "@/lib/engine";
import { sendEmail } from "@/lib/email/resend";

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
  org: { id: string; name?: string; average_sale_value?: number; gross_margin?: number },
): Promise<{ scored: boolean; alerted: boolean }> {
  const since = new Date(Date.now() - 14 * 864e5).toISOString().slice(0, 10);
  const { data: snaps } = await admin.from("campaign_snapshots")
    .select("campaign_name,platform,spend,impressions,reach,frequency,clicks,ctr,cpc,cpm,leads,purchases,revenue,lead_quality_score,tracking_status")
    .eq("organisation_id", org.id).gte("date", since).limit(5000);
  if (!snaps || snaps.length === 0) return { scored: false, alerted: false };

  const result = analyse(snaps as any, {
    average_sale_value: org.average_sale_value ?? 200,
    gross_margin: org.gross_margin ?? 0.6, currency: "AUD",
  });
  await admin.from("health_scores").insert({ organisation_id: org.id, scope: "account", total: result.health.total, band: result.health.band, breakdown: result.health.breakdown });
  await admin.from("reports").insert({ organisation_id: org.id, title: `Scheduled — health ${Math.round(result.health.total)}`, period: new Date().toISOString().slice(0, 10), payload: result });

  // Refresh the open Proposals queue from this analysis (actionable verdicts only, deduped).
  // Approved/dismissed/done history is preserved — we only replace the 'open' set.
  const ACTIONABLE = new Set(["scale", "kill", "reduce", "refresh", "fix-tracking"]);
  const seen = new Set<string>();
  const recs: any[] = [];
  for (const d of (result.decisions || []) as any[]) {
    if (!ACTIONABLE.has(d.verdict)) continue;
    const k = `${d.platform}|${d.name}|${d.verdict}`;
    if (seen.has(k)) continue;
    seen.add(k);
    recs.push({ organisation_id: org.id, verdict: d.verdict, entity_name: d.name, platform: d.platform, reason: d.reason, proposal: d.proposal });
  }
  await admin.from("recommendations").delete().eq("organisation_id", org.id).eq("status", "open");
  if (recs.length) await admin.from("recommendations").insert(recs);

  let alerted = false;
  const b = breaches(result);
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
