import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const supabase = createClient();
  const { data: reports } = await supabase
    .from("reports").select("id,title,period,created_at").order("created_at", { ascending: false }).limit(50);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-extrabold tracking-tight">Saved reports</h1>
      <p className="mb-5 mt-1 text-muted">Every analysis you run is saved here automatically (when the database is connected).</p>

      {(!reports || reports.length === 0) ? (
        <div className="rounded-2xl border border-dashed border-[#d0d7de] p-10 text-center text-muted">
          No saved reports yet. Run an <Link href="/dashboard" className="font-semibold text-brand">Ads Health Check</Link> to create one.
        </div>
      ) : (
        <div className="space-y-2">
          {reports.map((r: any) => (
            <Link key={r.id} href={`/reports/${r.id}`}
              className="flex items-center justify-between rounded-xl border border-[#e3e8ef] bg-white p-4 shadow-card hover:border-brand">
              <div>
                <div className="font-semibold">{r.title}</div>
                <div className="text-xs text-muted">{r.period} · saved {new Date(r.created_at).toLocaleString()}</div>
              </div>
              <span className="text-brand">View →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
