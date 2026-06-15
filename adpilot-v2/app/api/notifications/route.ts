import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureOrg } from "@/lib/org";
import { sendEmail, NoEmailKeyError } from "@/lib/email/resend";

export const runtime = "nodejs";

const Body = z.object({
  email: z.string().email().optional().or(z.literal("")),
  weekly_digest: z.boolean().default(true),
  critical_alerts: z.boolean().default(true),
  test: z.boolean().optional(),
});

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { data } = await supabase.from("notification_rules").select("email,weekly_digest,critical_alerts").maybeSingle();
  return NextResponse.json({ rule: data || { email: user.email, weekly_digest: true, critical_alerts: true } });
}

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { email, weekly_digest, critical_alerts, test } = parsed.data;
  const addr = email || user.email!;

  const orgId = await ensureOrg(user.id, user.email ?? undefined);
  const admin = createAdminClient();
  await admin.from("notification_rules").upsert(
    { organisation_id: orgId, email: addr, weekly_digest, critical_alerts },
    { onConflict: "organisation_id" }
  );

  if (test) {
    try {
      await sendEmail(addr, "AdPilot OS — test email", "<p style='font-family:sans-serif'>✅ Your AdPilot OS notifications are working.</p>");
      return NextResponse.json({ ok: true, emailConfigured: true, sent: true });
    } catch (e: any) {
      if (e instanceof NoEmailKeyError) return NextResponse.json({ ok: true, emailConfigured: false });
      return NextResponse.json({ error: e.message }, { status: 502 });
    }
  }
  return NextResponse.json({ ok: true });
}
