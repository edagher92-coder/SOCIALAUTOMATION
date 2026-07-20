import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveOrgMembership, isOrgManagerRole } from "@/lib/org";

export const runtime = "nodejs";

// Remove a connected ad account.
//   POST { platform, externalAccountId } → unlinks the account from the caller's active org.
// Scoped strictly to the caller's org (organisation_id = active org), so one org can never
// remove another's account. Historical campaign_snapshots / scores are intentionally kept —
// this only severs the live connection. When the LAST account for a platform is removed, the
// platform's stored (encrypted) token is also cleared, so no orphaned credential lingers at rest.
const Body = z.object({
  platform: z.enum(["meta", "tiktok"]),
  externalAccountId: z.string().trim().min(1),
});

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "platform and externalAccountId are required." }, { status: 400 });
  }
  const { platform, externalAccountId } = parsed.data;

  try {
    const membership = await getActiveOrgMembership(user.id, user.email ?? undefined);
    if (!isOrgManagerRole(membership.role)) {
      return NextResponse.json({ error: "Only workspace owners and admins can remove an advertising account." }, { status: 403 });
    }
    const orgId = membership.orgId;
    const admin = createAdminClient();

    // Delete only the matching row in the caller's org. `.select()` returns the removed rows so
    // we can report whether anything actually matched (idempotent: removing twice is harmless).
    const { data: removedRows, error } = await admin.from("connected_ad_accounts")
      .delete()
      .eq("organisation_id", orgId)
      .eq("platform", platform)
      .eq("external_account_id", externalAccountId)
      .select("external_account_id");
    if (error) throw new Error(error.message);
    const removed = (removedRows || []).length > 0;

    // If no connected accounts remain for this platform in this org, clear the stored token too.
    let tokenCleared = false;
    if (removed) {
      const { count } = await admin.from("connected_ad_accounts")
        .select("id", { count: "exact", head: true })
        .eq("organisation_id", orgId).eq("platform", platform);
      if ((count ?? 0) === 0) {
        await admin.from("platform_tokens").delete().eq("organisation_id", orgId).eq("platform", platform);
        tokenCleared = true;
      }
    }

    return NextResponse.json({ removed, tokenCleared });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Remove failed" }, { status: 502 });
  }
}
