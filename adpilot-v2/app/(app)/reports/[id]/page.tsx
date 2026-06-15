import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const f2 = (v: number | null) => (v == null ? "N/A" : (Math.round(v * 100) / 100).toLocaleString());
const BANDC: Record<string, string> = { Green: "#16a34a", Yellow: "#ca8a04", Orange: "#ea580c", Red: "#dc2626" };

export default async function ReportDetail({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: report } = await supabase.from("reports").select("title,period,payload,created_at").eq("id", params.id).maybeSingle();
  if (!report) notFound();
  const p: any = (report as any).payload;
  const h = p?.health, s = p?.summary;

  return (
    <div className="max-w-3xl">
      <Link href="/reports" className="text-sm font-semibold text-brand">← All reports</Link>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight">{(report as any).title}</h1>
      <p className="mb-5 mt-1 text-muted">{(report as any).period} · saved {new Date((report as any).created_at).toLocaleString()}</p>

      {h && (
        <div className="rounded-2xl border border-[#e3e8ef] bg-white p-5 shadow-card">
          <span className="inline-block rounded-full px-3 py-1 text-sm font-extrabold text-white" style={{ background: BANDC[h.band] || "#5a6577" }}>
            {Math.round(h.total)}/100 · {h.band}
          </span>
          <p className="mt-2 font-semibold">{h.guidance}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 text-sm">
            <Stat k="Spend" v={f2(s?.spend)} /><Stat k="CPA" v={f2(s?.cpa)} />
            <Stat k="Break-even CPA" v={f2(s?.break_even_cpa)} /><Stat k="ROAS" v={f2(s?.roas)} />
          </div>
        </div>
      )}

      {h?.findings?.length > 0 && (
        <div className="mt-4 rounded-2xl border border-[#e3e8ef] bg-white p-5 shadow-card">
          <h3 className="mb-2 font-bold">Findings</h3>
          <ul className="space-y-1 text-sm">{h.findings.map((f: any, i: number) => <li key={i}><b>{f.severity}</b> — {f.message}</li>)}</ul>
        </div>
      )}

      {p?.decisions?.length > 0 && (
        <div className="mt-4 rounded-2xl border border-[#e3e8ef] bg-white p-5 shadow-card">
          <h3 className="mb-2 font-bold">Proposals</h3>
          <ul className="space-y-1 text-sm">{p.decisions.map((d: any, i: number) => <li key={i}><b className="capitalize">{d.verdict}</b> — {d.name}: {d.proposal}</li>)}</ul>
        </div>
      )}
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return <div className="rounded-lg bg-[#f4f7fb] p-2.5"><b className="block text-lg">{v}</b><span className="text-xs text-muted">{k}</span></div>;
}
