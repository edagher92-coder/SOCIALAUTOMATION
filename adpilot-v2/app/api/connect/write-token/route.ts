import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveOrgMembership, isOrgManagerRole, planForOrg } from "@/lib/org";
import { can } from "@/lib/entitlements";
import { encrypt } from "@/lib/crypto";
import { META_GRAPH_BASE } from "@/lib/meta/graph-version";

export const runtime = "nodejs";

// This deliberately does not reuse the normal read-token endpoint. A write token is
// a different credential with a different blast radius and needs an explicit owner/admin
// acknowledgement every time it is attached or replaced.
const Body = z.object({
  token: z.string().min(10),
  accountId: z.string().trim().regex(/^\d+$/).optional(),
  acknowledge: z.literal("ENABLE META AD WRITE ACCESS"),
});

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid Meta token and type ENABLE META AD WRITE ACCESS exactly." }, { status: 400 });

  const membership = await getActiveOrgMembership(user.id, user.email ?? undefined);
  if (!isOrgManagerRole(membership.role)) return NextResponse.json({ error: "Only workspace owners and admins can attach a write credential." }, { status: 403 });
  if (!can(await planForOrg(membership.orgId), "ad_write")) return NextResponse.json({ error: "Approved live-ad actions are an Expert feature.", upgrade: true }, { status: 402 });

  const token = parsed.data.token.trim();
  const permissions = await fetch(`${META_GRAPH_BASE}/me/permissions?access_token=${encodeURIComponent(token)}`);
  const permissionBody: any = await permissions.json().catch(() => ({}));
  if (!permissions.ok) return NextResponse.json({ error: "Meta rejected this credential. Confirm it is current and belongs to your Meta business." }, { status: 502 });
  const granted = new Set((permissionBody.data || []).filter((p: any) => p?.status === "granted").map((p: any) => String(p.permission)));
  if (!granted.has("ads_management")) return NextResponse.json({ error: "This credential is missing Meta ads_management. No credential was saved." }, { status: 400 });

  const accountsResponse = await fetch(`${META_GRAPH_BASE}/me/adaccounts?fields=name,account_id&access_token=${encodeURIComponent(token)}`);
  const accountsBody: any = await accountsResponse.json().catch(() => ({}));
  if (!accountsResponse.ok) return NextResponse.json({ error: "Meta could not list ad accounts for this write credential. No credential was saved." }, { status: 502 });
  const accountIds = (accountsBody.data || []).map((a: any) => String(a.account_id || a.id || "").replace(/^act_/, "")).filter(Boolean);
  if (accountIds.length === 0) return NextResponse.json({ error: "This write credential has no assigned ad account. No credential was saved." }, { status: 400 });
  if (parsed.data.accountId && !accountIds.includes(parsed.data.accountId)) return NextResponse.json({ error: "The nominated ad account is not assigned to this write credential." }, { status: 400 });

  const encrypted = encrypt(token);
  const admin = createAdminClient();
  const { error } = await admin.from("platform_tokens").insert({
    organisation_id: membership.orgId,
    platform: "meta",
    ciphertext: encrypted.ciphertext,
    iv: encrypted.iv,
    auth_tag: encrypted.authTag,
    scopes: ["ads_read", "read_insights", "ads_management"],
  });
  if (error) return NextResponse.json({ error: "Could not securely store the write credential." }, { status: 502 });
  await admin.from("audit_logs").insert({ organisation_id: membership.orgId, user_id: user.id, action: "ad_write_credential_attached", detail: { account_id: parsed.data.accountId || "all_assigned" } });
  return NextResponse.json({ ok: true, accountCount: accountIds.length });
}
