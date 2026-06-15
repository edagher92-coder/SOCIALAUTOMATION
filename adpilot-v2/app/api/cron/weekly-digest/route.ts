import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";

export const runtime = "nodejs";

// Weekly digest. Secured by CRON_SECRET (Vercel Cron sends it as a Bearer token,
// or pass ?key=... ). Emails each org with weekly_digest on + an email set.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  // Fail closed: never send digests from an unauthenticated trigger.
  if (!secret) return NextResponse.json({ error: "Cron not configured (set CRON_SECRET)." }, { status: 503 });
  const url = new URL(req.url);
  const ok = req.headers.get("authorization") === `Bearer ${secret}` || url.searchParams.get("key") === secret;
  if (!ok) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const admin = createAdminClient();
  const { data: rules } = await admin.from("notification_rules").select("organisation_id,email,weekly_digest").eq("weekly_digest", true);

  let sent = 0, skipped = 0;
  for (const rule of rules || []) {
    if (!rule.email) { skipped++; continue; }
    const { data: rep } = await admin.from("reports")
      .select("title,payload").eq("organisation_id", rule.organisation_id)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!rep) { skipped++; continue; }
    const h: any = (rep.payload as any)?.health;
    const html = `<h2 style="font-family:sans-serif">Your weekly AdPilot OS digest</h2>
      <p style="font-family:sans-serif">Latest health score: <b>${h ? Math.round(h.total) : "—"}/100 (${h?.band || "n/a"})</b></p>
      <p style="font-family:sans-serif">${rep.title}</p>
      <p style="font-family:sans-serif">Open your dashboard for the full findings and safe proposals. (Read-only — nothing is changed on your ad accounts.)</p>`;
    try { await sendEmail(rule.email, "Your weekly ads health digest", html); sent++; }
    catch { skipped++; }
  }
  return NextResponse.json({ sent, skipped });
}
