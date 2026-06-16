import "server-only";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalisePlan, type Plan } from "@/lib/entitlements";

// Active subscription plan for an org (defaults to "free" when none/inactive).
export async function planForOrg(orgId: string): Promise<Plan> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("billing_subscriptions").select("plan,status").eq("organisation_id", orgId)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!data || (data as any).status !== "active") return "free";
  return normalisePlan((data as any).plan);
}

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

// Returns the user's ACTIVE org id (from the `active_org` cookie if they're a
// member of it), else their first org, else bootstraps one. Drives multi-client.
export async function getActiveOrgId(userId: string, email?: string): Promise<string> {
  const admin = createAdminClient();
  const { data: mems } = await admin.from("memberships").select("organisation_id").eq("user_id", userId);
  const ids = (mems || []).map((m: any) => m.organisation_id as string);
  if (ids.length === 0) return ensureOrg(userId, email);
  const want = (await cookies()).get("active_org")?.value;
  return want && ids.includes(want) ? want : ids[0];
}

// List the orgs a user belongs to (id, name, role) + the active one.
export async function listOrgs(userId: string): Promise<{ orgs: { id: string; name: string; role: string }[]; activeId: string }> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("memberships").select("role, organisation_id, organisations(name)").eq("user_id", userId);
  const orgs = (data || []).map((m: any) => ({ id: m.organisation_id, name: m.organisations?.name || "Workspace", role: m.role }));
  const want = (await cookies()).get("active_org")?.value;
  const activeId = orgs.find((o) => o.id === want)?.id || orgs[0]?.id || "";
  return { orgs, activeId };
}

