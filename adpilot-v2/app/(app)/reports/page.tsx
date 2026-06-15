import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveOrgId } from "@/lib/org";
import PageHeader from "@/components/PageHeader";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const orgId = user ? await getActiveOrgId(user.id, user.email ?? undefined) : "";
  const { data: reports } = await supabase
    .from("reports").select("id,title,period,created_at").eq("organisation_id", orgId)
    .order("created_at", { ascending: false }).limit(50);

  return (
    <div className="max-w-3xl animate-fade-in">
      <PageHeader
        eyebrow="Reports"
        title="Saved reports"
        subtitle="Every analysis you run is saved here automatically (when the database is connected)."
      />

      {(!reports || reports.length === 0) ? (
        <div className="rounded-2xl border border-dashed border-border-subtle bg-surface-raised p-10 text-center">
          <div className="text-3xl">📄</div>
          <p className="mt-2 font-semibold text-ink">No saved reports yet</p>
          <p className="mt-1 text-sm text-muted">
            Run an <Link href="/dashboard" className="font-semibold text-brand">Ads Health Check</Link> to create your first report.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {reports.map((r: any) => (
            <Link key={r.id} href={`/reports/${r.id}`}
              className="flex items-center justify-between rounded-2xl border border-border-subtle bg-surface-raised p-4 shadow-card transition hover:border-brand hover:shadow-card-hover">
              <div>
                <div className="font-semibold text-ink">{r.title}</div>
                <div className="text-xs text-muted">{r.period} · saved {new Date(r.created_at).toLocaleString()}</div>
              </div>
              <span className="font-semibold text-brand">View →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
