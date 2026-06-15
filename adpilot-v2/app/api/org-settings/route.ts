import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveOrgId } from "@/lib/org";

export const runtime = "nodejs";

const Body = z.object({
  average_sale_value: z.number().positive().max(1_000_000),
  gross_margin: z.number().min(0.01).max(1),
  // Auto-sync cadence in hours: 0 = off, 1 = hourly, 24 = daily, 168 = weekly, or custom.
  sync_interval_hours: z.number().int().min(0).max(8760).optional(),
});

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const orgId = await getActiveOrgId(user.id, user.email ?? undefined);
  const admin = createAdminClient();
  const { data } = await admin.from("organisations").select("name,average_sale_value,gross_margin,sync_interval_hours").eq("id", orgId).maybeSingle();
  return NextResponse.json({ settings: data || { average_sale_value: 200, gross_margin: 0.6, sync_interval_hours: 24 } });
}

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const orgId = await getActiveOrgId(user.id, user.email ?? undefined);
  const admin = createAdminClient();
  await admin.from("organisations").update(parsed.data).eq("id", orgId);
  return NextResponse.json({ ok: true });
}
