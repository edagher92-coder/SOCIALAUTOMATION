import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveOrgMembership, isOrgManagerRole, planForOrg } from "@/lib/org";
import { can } from "@/lib/entitlements";

export const runtime = "nodejs";

async function gate(): Promise<{ res?: NextResponse; orgId?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { res: NextResponse.json({ error: "Unauthorised" }, { status: 401 }) };
  const membership = await getActiveOrgMembership(user.id, user.email ?? undefined);
  if (!isOrgManagerRole(membership.role)) {
    return { res: NextResponse.json({ error: "Only workspace owners and admins can manage change drafts." }, { status: 403 }) };
  }
  if (!can(await planForOrg(membership.orgId), "ad_write")) {
    return { res: NextResponse.json({ error: "Approval-ready change drafts are an Expert feature.", upgrade: true }, { status: 402 }) };
  }
  return { orgId: membership.orgId };
}

// Compatibility endpoint for older clients. V7 has no paid-ad mutation path.
export async function PATCH() {
  const access = await gate();
  if (access.res) return access.res;
  return NextResponse.json({
      error: "Live paid-ad execution is disabled and not available in this release. Review the draft, then apply it in the advertising platform.",
    writeDisabled: true,
  }, { status: 409 });
}

export async function DELETE(_req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const access = await gate();
  if (access.res) return access.res;
  const admin = createAdminClient();
  const { data, error } = await admin.from("ad_actions")
    .update({ status: "cancelled" })
    .eq("id", params.id).eq("organisation_id", access.orgId!).eq("status", "proposed")
    .select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "The draft could not be archived." }, { status: 502 });
  if (!data) return NextResponse.json({ error: "Draft not found or already closed." }, { status: 404 });
  return NextResponse.json({ ok: true, archived: true });
}
