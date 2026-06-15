import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Returns the user's organisation id, creating a personal org + owner membership
// on first use. Server-only (uses the service role).
export async function ensureOrg(userId: string, email?: string): Promise<string> {
  const admin = createAdminClient();

  const { data: mem } = await admin
    .from("memberships").select("organisation_id").eq("user_id", userId).limit(1).maybeSingle();
  if (mem?.organisation_id) return mem.organisation_id as string;

  await admin.from("profiles").upsert({ id: userId, email });

  const name = email ? `${email.split("@")[0]}'s workspace` : "My workspace";
  const { data: org, error } = await admin
    .from("organisations").insert({ name }).select("id").single();
  if (error || !org) throw new Error("Could not create organisation: " + (error?.message ?? "unknown"));

  await admin.from("memberships").insert({ organisation_id: org.id, user_id: userId, role: "owner" });
  return org.id as string;
}
