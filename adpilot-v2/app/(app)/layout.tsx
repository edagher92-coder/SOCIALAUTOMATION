import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveOrgId, planForOrg } from "@/lib/org";
import AppShell from "@/components/AppShell";

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // Plan drives the mode+plan-aware nav (hide locked items → declutter). Best-effort: default free.
  const plan = await getActiveOrgId(user.id, user.email ?? undefined).then(planForOrg).catch(() => "free" as const);
  return <AppShell email={user.email ?? undefined} plan={plan}>{children}</AppShell>;
}
