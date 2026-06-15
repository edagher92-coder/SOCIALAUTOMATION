import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { analyse } from "@/lib/engine";
import { sendEmail } from "@/lib/email/resend";

export const runtime = "nodejs";

function breaches(result: any): string[] {
  const a: string[] = [];
  for (const f of result.health?.findings || []) if (f.severity === "CRITICAL") a.push(f.message);
  if (result.health?.band === "Red") a.push(`Account health is RED (${Math.round(result.health.total)}/100).`);
  return Array.from(new Set(a));
}

// Scheduled scoring + breach alerts. Secured by CRON_SECRET.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const url = new URL(req.url);
  if (secret) {
    const ok = req.headers.get("authorization") === `Bearer ${secret}` || url.searchParams.get("key") === secret;
    if (!ok) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: orgs } = await admin.from("organisations").select("id,name,average_sale_value,gross_margin");
  const since = new Date(Date.now() - 14 * 864e5).toISOString().slice(0, 10);
  let scored = 0, alerted = 0;

  for (const org of orgs || []) {
    const { data: snaps } = await admin.from("campaign_snapshots")
      .select("campaign_name,platform,spend,impressions,reach,frequency,clicks,ctr,cpc,cpm,leads,purchases,revenue,lead_quality_score,tracking_status")
      .eq("organisation_id", org.id).gte("date", since).limit(5000);
    if (!snaps || snaps.length === 0) continue;

    const result = analyse(snaps as any, {
      average_sale_value: (org as any).average_sale_value ?? 200,
      gross_margin: (org as any).gross_margin ?? 0.6, currency: "AUD",
    });
    await admin.from("health_scores").insert({ organisation_id: org.id, scope: "account", total: result.health.total, band: result.health.band, breakdown: result.health.breakdown });
    await admin.from("reports").insert({ organisation_id: org.id, title: `Scheduled — health ${Math.round(result.health.total)}`, period: new Date().toISOString().slice(0, 10), payload: result });
    scored++;

    const b = breaches(result);
    if (b.length) {
      const { data: rule } = await admin.from("notification_rules").select("email,critical_alerts").eq("organisation_id", org.id).maybeSingle();
      if (rule?.critical_alerts && rule.email) {
        const html = `<h2 style="font-family:sans-serif">⚠ AdPilot OS alert — ${(org as any).name}</h2>
          <p style="font-family:sans-serif">${result.health.band} · ${Math.round(result.health.total)}/100</p>
          <ul style="font-family:sans-serif">${b.map((x) => `<li>${x}</li>`).join("")}</ul>
          <p style="font-family:sans-serif">Open your dashboard for the safe proposals. (Read-only — nothing was changed.)</p>`;
        try { await sendEmail(rule.email, `⚠ AdPilot alert — ${(org as any).name}`, html); alerted++; } catch { /* email best-effort */ }
      }
    }
  }
  return NextResponse.json({ scored, alerted });
}
