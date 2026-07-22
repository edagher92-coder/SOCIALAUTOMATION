import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveOrgId } from "@/lib/org";
import PageHeader from "@/components/PageHeader";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

type ReportRow = { id: string; title: string | null; period: string | null; created_at: string };

export default async function ReportsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const orgId = user ? await getActiveOrgId(user.id, user.email ?? undefined) : "";
  const { data, error } = await supabase.from("reports").select("id,title,period,created_at").eq("organisation_id", orgId).order("created_at", { ascending: false }).limit(50);
  const reports = (data || []) as ReportRow[];
  const thisMonth = reports.filter((report) => {
    const date = new Date(report.created_at); const now = new Date();
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }).length;

  return (
    <div className="mx-auto max-w-5xl animate-fade-in">
      <PageHeader eyebrow="History & handoff" title="Reports" subtitle="Every completed audit becomes a dated checkpoint. Open it for the evidence, comparison and client-ready PDF." action={<Link href="/notifications" className="inline-flex items-center gap-2 rounded-xl border border-border-subtle bg-white px-3.5 py-2 text-sm font-bold text-ink shadow-sm hover:border-brand-200"><Icon name="bell" size={16} /> Delivery schedule</Link>} />
      <section className="mb-5 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-border-subtle bg-white p-4 shadow-card"><div className="text-2xs font-extrabold uppercase tracking-wider text-muted">Saved checkpoints</div><div className="mt-1 text-2xl font-extrabold tabular-nums text-ink">{reports.length}</div></div><div className="rounded-2xl border border-border-subtle bg-white p-4 shadow-card"><div className="text-2xs font-extrabold uppercase tracking-wider text-muted">Created this month</div><div className="mt-1 text-2xl font-extrabold tabular-nums text-ink">{thisMonth}</div></div><div className="rounded-2xl border border-good/25 bg-good/10 p-4"><div className="text-2xs font-extrabold uppercase tracking-wider text-green-800">Live-ad safety</div><div className="mt-1 flex items-center gap-2 font-extrabold text-green-900"><Icon name="shield" size={18} /> Reporting only</div></div></section>
      {error ? <div className="rounded-3xl border border-bad/30 bg-bad/10 p-8 text-center"><Icon name="alert-triangle" className="mx-auto text-bad" size={25} /><p className="mt-3 font-bold text-bad">Reports could not be loaded</p><p className="mt-1 text-sm text-muted">Refresh to try again.</p></div> : reports.length === 0 ? <div className="rounded-3xl border border-dashed border-border-subtle bg-white p-10 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-surface text-brand"><Icon name="file-text" size={23} /></span><p className="mt-3 font-extrabold text-ink">No reports yet</p><p className="mx-auto mt-1 max-w-md text-sm text-muted">Run a Health & Import audit to create the first checkpoint, or connect an account for scheduled scoring.</p><div className="mt-4 flex justify-center gap-2"><Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white"><Icon name="upload" size={15} /> Run an audit</Link><Link href="/connect" className="inline-flex items-center gap-2 rounded-xl border border-border-subtle px-4 py-2.5 text-sm font-bold text-ink"><Icon name="link" size={15} /> Connect data</Link></div></div> : <div className="overflow-hidden rounded-3xl border border-border-subtle bg-white shadow-card"><div className="border-b border-border-subtle p-5"><h2 className="font-extrabold text-ink">Report history</h2><p className="mt-1 text-sm text-muted">Newest checkpoint first. Historical numbers stay fixed when settings change later.</p></div><div className="divide-y divide-border-subtle">{reports.map((report, index) => <Link key={report.id} href={`/reports/${report.id}`} className="group flex items-center gap-4 p-4 hover:bg-surface sm:px-5"><span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-brand-50 text-brand"><Icon name="file-text" size={18} /></span><span className="min-w-0 flex-1"><span className="block truncate font-bold text-ink">{report.title || "Campaign health report"}</span><span className="mt-0.5 block text-xs text-muted">{report.period || "Audit period"} · saved {new Date(report.created_at).toLocaleString("en-AU")}</span></span>{index === 0 && <span className="hidden rounded-full bg-good/10 px-2 py-1 text-2xs font-extrabold uppercase text-green-700 sm:block">Latest</span>}<span className="text-muted group-hover:text-brand"><Icon name="chevron-right" size={17} /></span></Link>)}</div></div>}
    </div>
  );
}
