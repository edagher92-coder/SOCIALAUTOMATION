import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, type EmailAttachment } from "@/lib/email/resend";
import { buildReportPdf } from "@/lib/reports/pdf";

export const runtime = "nodejs";

// Weekly digest. Secured by CRON_SECRET (Vercel Cron sends it as a Bearer token,
// or pass ?key=... ). Emails each org with weekly_digest on + an email set.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  // Fail closed: never send digests from an unauthenticated trigger.
  if (!secret) return NextResponse.json({ error: "Cron not configured (set CRON_SECRET)." }, { status: 503 });
  const url = new URL(req.url);
  const ok = cronAuthorized(req, secret);
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
      <p style="font-family:sans-serif">Your full report is attached as a PDF. (Read-only — nothing is changed on your ad accounts.)</p>`;
    // Scheduled PDF delivery: render the live report PDF from the saved payload and attach it.
    // Best-effort — if generation fails, still send the HTML digest rather than dropping it entirely.
    let attachments: EmailAttachment[] | undefined;
    try {
      const pdf = await buildReportPdf(rep.payload, { title: rep.title || "Ads Health Report", brandName: "AdPilot OS" });
      attachments = [{ filename: "adpilot-report.pdf", content: Buffer.from(pdf).toString("base64") }];
    } catch { /* PDF generation failed — fall back to the HTML-only digest */ }
    try { await sendEmail(rule.email, "Your weekly ads health digest", html, { attachments }); sent++; }
    catch { skipped++; }
  }
  return NextResponse.json({ sent, skipped });
}
