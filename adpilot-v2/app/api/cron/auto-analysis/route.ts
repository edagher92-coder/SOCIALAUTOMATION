import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { scoreAndAlertOrg } from "@/lib/cron/score";

export const runtime = "nodejs";

// Daily baseline scoring + breach alerts for every org (covers CSV-only orgs too).
// Pulling fresh data is handled by /api/cron/auto-sync on each org's chosen cadence.
// Secured by CRON_SECRET.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  // Fail closed: never run an unauthenticated scoring sweep.
  if (!secret) return NextResponse.json({ error: "Cron not configured (set CRON_SECRET)." }, { status: 503 });
  const url = new URL(req.url);
  const ok = cronAuthorized(req, secret);
  if (!ok) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const admin = createAdminClient();
  const { data: orgs, error: orgsErr } = await admin.from("organisations").select("id,name,average_sale_value,gross_margin,monthly_budget,lead_close_rate");
  if (orgsErr) return NextResponse.json({ error: "Could not load organisations." }, { status: 502 });
  let scored = 0, alerted = 0, failed = 0;

  for (const org of orgs || []) {
    try {
      const r = await scoreAndAlertOrg(admin, org as any);
      if (r.scored) scored++;
      if (r.alerted) alerted++;
    } catch {
      // Per-org isolation: one bad org (bad data / transient DB error) never kills the
      // sweep — every other org is still scored. Counted so a spike is observable.
      failed++;
    }
  }
  return NextResponse.json({ scored, alerted, failed });
}
