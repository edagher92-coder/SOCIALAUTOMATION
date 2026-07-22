import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getActiveOrgId, planForOrg } from "@/lib/org";
import AppShell from "@/components/AppShell";
import type { Mode } from "@/components/mode";

// Authenticated pages depend on the current cookie-backed session and workspace.
export const dynamic = "force-dynamic";

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const orgId = await getActiveOrgId(user.id, user.email ?? undefined);
  const cookieStore = await cookies();
  const savedMode = cookieStore.get("adpilot_mode")?.value;
  const initialMode: Mode = savedMode === "advanced" ? "advanced" : "beginner";

  // One lightweight snapshot powers the global status bar and control drawer.
  const [plan, orgRes, fixesRes, accountsRes] = await Promise.all([
    planForOrg(orgId).catch(() => "free" as const),
    supabase.from("organisations").select("name,last_synced_at").eq("id", orgId).maybeSingle(),
    supabase.from("recommendations").select("id", { count: "exact", head: true }).eq("organisation_id", orgId).eq("status", "open"),
    supabase.from("connected_ad_accounts").select("status").eq("organisation_id", orgId),
  ]);
  const accounts = accountsRes.data || [];

  return (
    <AppShell
      email={user.email ?? undefined}
      plan={plan}
      initialMode={initialMode}
      summary={{
        name: orgRes.data?.name,
        lastSyncedAt: orgRes.data?.last_synced_at,
        openFixes: fixesRes.count ?? 0,
        connectedAccounts: accounts.length,
        connectionIssues: accounts.filter((account) => account.status === "error" || account.status === "disconnected").length,
      }}
    >
      {children}
    </AppShell>
  );
}
