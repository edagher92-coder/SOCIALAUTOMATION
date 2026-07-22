import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveOrgMembership, isOrgManagerRole, planForOrg } from "@/lib/org";
import { can } from "@/lib/entitlements";
import { writeEnabled } from "@/lib/actions/execute";

export const runtime = "nodejs";

// Approval-ready change drafts for Expert workspaces. They are inert records for
// review and manual application in Ads Manager; V7 has no live-ad execution path.
async function gate(): Promise<{ res?: NextResponse; orgId?: string; userId?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { res: NextResponse.json({ error: "Unauthorised" }, { status: 401 }) };
  const membership = await getActiveOrgMembership(user.id, user.email ?? undefined);
  if (!isOrgManagerRole(membership.role)) return { res: NextResponse.json({ error: "Only workspace owners and admins can manage change drafts." }, { status: 403 }) };
  if (!can(await planForOrg(membership.orgId), "ad_write")) return { res: NextResponse.json({ error: "Approval-ready change drafts are an Expert feature.", upgrade: true }, { status: 402 }) };
  return { orgId: membership.orgId, userId: user.id };
}

const Body = z.object({
  platform: z.enum(["meta", "tiktok"]),
  entity_level: z.enum(["campaign", "adset", "ad"]),
  external_entity_id: z.string().min(1).max(80),
  entity_name: z.string().max(200).optional(),
  action: z.enum(["pause", "resume", "set_budget"]),
  params: z.object({ daily_budget: z.number().positive().max(1_000_000) }).partial().optional(),
});

function confirmPhrase(a: z.infer<typeof Body>): string {
  const who = a.entity_name ? `"${a.entity_name}"` : a.external_entity_id;
  if (a.action === "set_budget") return `SET BUDGET ${who} $${a.params?.daily_budget}/day`;
  return `${a.action.toUpperCase()} ${a.entity_level} ${who}`;
}

export async function GET() {
  const g = await gate(); if (g.res) return g.res;
  const supabase = createClient();
  const { data } = await supabase.from("ad_actions")
    .select("id,platform,entity_level,external_entity_id,entity_name,action,params,status,confirm_phrase,result,error,created_at,executed_at,reverted_at")
    .eq("organisation_id", g.orgId!).order("created_at", { ascending: false }).limit(100);
  return NextResponse.json({ actions: data || [], writeEnabled: writeEnabled() });
}

export async function POST(req: Request) {
  const g = await gate(); if (g.res) return g.res;
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid action", details: parsed.error.flatten() }, { status: 400 });
  if (parsed.data.action === "set_budget" && !parsed.data.params?.daily_budget) {
    return NextResponse.json({ error: "set_budget needs params.daily_budget" }, { status: 400 });
  }
  const admin = createAdminClient();
  const { data, error } = await admin.from("ad_actions").insert({
    organisation_id: g.orgId!, requested_by: g.userId!, status: "proposed",
    platform: parsed.data.platform, entity_level: parsed.data.entity_level,
    external_entity_id: parsed.data.external_entity_id, entity_name: parsed.data.entity_name ?? null,
    action: parsed.data.action, params: parsed.data.params ?? {},
    confirm_phrase: confirmPhrase(parsed.data),
  }).select("id,confirm_phrase").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 502 });
  return NextResponse.json({ ok: true, id: data.id, confirm_phrase: data.confirm_phrase });
}
