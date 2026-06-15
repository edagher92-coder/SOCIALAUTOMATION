import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveOrgId, planForOrg } from "@/lib/org";
import { can } from "@/lib/entitlements";
import { decrypt } from "@/lib/crypto";
import { captureState, executeAction, revertAction, isWriteDisabled, type AdAction } from "@/lib/actions/execute";

export const runtime = "nodejs";

const Body = z.object({ confirm: z.string().optional(), revert: z.boolean().optional() });

async function gate(): Promise<{ res?: NextResponse; orgId?: string; userId?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { res: NextResponse.json({ error: "Unauthorised" }, { status: 401 }) };
  const orgId = await getActiveOrgId(user.id, user.email ?? undefined);
  if (!can(await planForOrg(orgId), "ad_write")) {
    return { res: NextResponse.json({ error: "Guarded ad changes are an Expert feature.", upgrade: true }, { status: 402 }) };
  }
  return { orgId, userId: user.id };
}

async function writeToken(admin: any, orgId: string, platform: string): Promise<string | null> {
  const { data } = await admin.from("platform_tokens")
    .select("ciphertext,iv,auth_tag").eq("organisation_id", orgId).eq("platform", platform)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!data?.ciphertext) return null;
  try { return decrypt({ ciphertext: data.ciphertext, iv: data.iv, authTag: data.auth_tag }); } catch { return null; }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const g = await gate(); if (g.res) return g.res;
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const admin = createAdminClient();
  const { data: row } = await admin.from("ad_actions").select("*").eq("id", params.id).eq("organisation_id", g.orgId!).maybeSingle();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const action: AdAction = { platform: row.platform, entity_level: row.entity_level, external_entity_id: row.external_entity_id, action: row.action, params: row.params };

  // ---- Revert a previously-executed change ----
  if (parsed.data.revert) {
    if (row.status !== "done") return NextResponse.json({ error: "Only a completed action can be reverted." }, { status: 400 });
    const token = await writeToken(admin, g.orgId!, row.platform);
    if (!token) return NextResponse.json({ error: "No write-scope token on file for this platform." }, { status: 400 });
    try {
      const detail = await revertAction(token, action, row.prior_state);
      await admin.from("ad_actions").update({ status: "reverted", reverted_at: new Date().toISOString(), result: `reverted: ${detail}` }).eq("id", row.id).eq("organisation_id", g.orgId!);
      return NextResponse.json({ ok: true, status: "reverted" });
    } catch (e: any) {
      return NextResponse.json({ error: e?.message || "Revert failed", writeDisabled: isWriteDisabled(e) }, { status: isWriteDisabled(e) ? 503 : 502 });
    }
  }

  // ---- Execute: requires the exact typed-YES confirmation ----
  if (row.status !== "proposed") return NextResponse.json({ error: `Action is already ${row.status}.` }, { status: 400 });
  if ((parsed.data.confirm || "").trim() !== row.confirm_phrase) {
    return NextResponse.json({ error: "Confirmation text does not match. Type the exact phrase to authorise this live change." }, { status: 400 });
  }
  const token = await writeToken(admin, g.orgId!, row.platform);
  if (!token) return NextResponse.json({ error: "No write-scope (ads_management) token on file. Connect a write-capable account first." }, { status: 400 });

  try {
    // Snapshot prior state for revert BEFORE mutating; tolerate snapshot failure.
    let prior: any = null;
    try { prior = await captureState(token, action); } catch { prior = null; }
    const result = await executeAction(token, action);
    await admin.from("ad_actions").update({
      status: "done", executed_at: new Date().toISOString(), approved_by: g.userId!, prior_state: prior, result, error: null,
    }).eq("id", row.id).eq("organisation_id", g.orgId!);
    return NextResponse.json({ ok: true, status: "done", result });
  } catch (e: any) {
    const msg = e?.message || "Execution failed";
    await admin.from("ad_actions").update({ status: "failed", error: msg }).eq("id", row.id).eq("organisation_id", g.orgId!);
    return NextResponse.json({ error: msg, writeDisabled: isWriteDisabled(e) }, { status: isWriteDisabled(e) ? 503 : 502 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const g = await gate(); if (g.res) return g.res;
  const admin = createAdminClient();
  await admin.from("ad_actions").delete().eq("id", params.id).eq("organisation_id", g.orgId!).eq("status", "proposed");
  return NextResponse.json({ ok: true });
}
