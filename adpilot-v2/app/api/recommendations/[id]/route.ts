import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveOrgId } from "@/lib/org";

export const runtime = "nodejs";

// Human-in-the-loop: approve / dismiss / mark-done a proposal. Read-only product —
// "approve" records intent; it never edits a live ad.
const Body = z.object({ status: z.enum(["open", "approved", "dismissed", "done"]) });

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const id = params?.id?.trim();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const orgId = await getActiveOrgId(user.id, user.email ?? undefined);
  const admin = createAdminClient();

  // Scope the update to the active org so a member can't touch another org's rows.
  // Idempotent: re-PATCHing to the same status returns the row unchanged (no 404).
  const { data, error } = await admin.from("recommendations")
    .update({ status: parsed.data.status })
    .eq("id", id).eq("organisation_id", orgId)
    .select("id,status").maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 502 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, id: data.id, status: data.status });
}
