import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveOrgId, planForOrg } from "@/lib/org";
import { can } from "@/lib/entitlements";

export const runtime = "nodejs";

const Body = z.object({
  brand_name: z.string().max(120).optional().or(z.literal("")),
  logo_url: z.string().url().optional().or(z.literal("")),
  primary_color: z.string().max(20).optional().or(z.literal("")),
  support_email: z.string().email().optional().or(z.literal("")),
});

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const orgId = await getActiveOrgId(user.id, user.email ?? undefined);
  const { data } = await supabase.from("white_label_profiles").select("brand_name,logo_url,primary_color,support_email").eq("organisation_id", orgId).maybeSingle();
  return NextResponse.json({ profile: data || {} });
}

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const orgId = await getActiveOrgId(user.id, user.email ?? undefined, "manager");
  if (!orgId) return NextResponse.json({ error: "Only workspace owners and admins can change white-label settings." }, { status: 403 });
  // White-label branding is an Expert-tier feature. The POST writes via the admin client
  // (which bypasses RLS), so the plan gate MUST be enforced here — not just hidden in the UI.
  if (!can(await planForOrg(orgId), "white_label")) {
    return NextResponse.json({ error: "White-label branding is an Expert-tier feature. Upgrade on Billing to enable it.", upgrade: true }, { status: 402 });
  }
  const admin = createAdminClient();
  await admin.from("white_label_profiles").upsert(
    { organisation_id: orgId, ...parsed.data },
    { onConflict: "organisation_id" }
  );
  return NextResponse.json({ ok: true });
}
