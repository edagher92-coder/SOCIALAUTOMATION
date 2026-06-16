import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listOrgs, getActiveOrgId, planForOrg } from "@/lib/org";
import { can, PLAN_LABEL } from "@/lib/entitlements";
import PageHeader from "@/components/PageHeader";

export const dynamic = "force-dynamic";

const BANDC: Record<string, string> = { Green: "#16a34a", Yellow: "#ca8a04", Orange: "#ea580c", Red: "#dc2626" };
const money = (v: number) => `$${Math.round(v).toLocaleString()}`;

export default async function Portfolio() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const orgId = await getActiveOrgId(user.id, user.email ?? undefined);
  const plan = await planForOrg(orgId);

  if (!can(plan, "multi_client")) {
    return (
      <div className="max-w-2xl">
        <PageHeader eyebrow="Agency" title="Portfolio" subtitle="All your clients, health and spend at a glance." />
        <div className="rounded-2xl border border-border-subtle bg-gradient-to-br from-brand-50 to-surface-raised p-6 shadow-card">
          <div className="mb-1 text-2xl">🗂️</div>
          <h3 className="font-bold">The multi-client portfolio is a Pro &amp; Expert feature</h3>
          <p className="mb-3 mt-1 text-sm text-muted">Your plan ({PLAN_LABEL[plan]}) manages a single workspace. Pro and Expert add multiple client workspaces and this cross-client roll-up.</p>
          <a href="/billing" className="inline-block rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white">Upgrade to enable</a>
        </div>
      </div>
    );
  }

  const { orgs } = await listOrgs(user.id);
  const admin = createAdminClient();
  const monthStart = (() => { const d = new Date(); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString().slice(0, 10); })();

  const rows = await Promise.all(orgs.map(async (o) => {
    const [{ data: hs }, { data: snaps }] = await Promise.all([
      admin.from("health_scores").select("total,band,created_at").eq("organisation_id", o.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      admin.from("campaign_snapshots").select("spend,revenue").eq("organisation_id", o.id).gte("date", monthStart).limit(5000),
    ]);
    const spend = (snaps || []).reduce((a: number, r: any) => a + (Number(r.spend) || 0), 0);
    const revenue = (snaps || []).reduce((a: number, r: any) => a + (Number(r.revenue) || 0), 0);
    return { id: o.id, name: o.name, role: o.role, total: hs ? Math.round((hs as any).total) : null, band: (hs as any)?.band ?? null, spend, revenue };
  }));

  const totalSpend = rows.reduce((a, r) => a + r.spend, 0);
  const totalRevenue = rows.reduce((a, r) => a + r.revenue, 0);
  const portfolioRoas = totalSpend > 0 ? totalRevenue / totalSpend : null;
  const needAttention = rows.filter((r) => r.band === "Red" || r.band === "Orange").sort((a, b) => (a.total ?? 0) - (b.total ?? 0));

  return (
    <div className="max-w-4xl animate-fade-in">
      <PageHeader eyebrow="Agency" title="Portfolio" subtitle={`${rows.length} client workspace${rows.length === 1 ? "" : "s"} · month to date`} />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat k="Clients" v={String(rows.length)} />
        <Stat k="MTD spend" v={money(totalSpend)} />
        <Stat k="MTD revenue" v={money(totalRevenue)} />
        <Stat k="Portfolio ROAS" v={portfolioRoas == null ? "N/A" : `${portfolioRoas.toFixed(2)}×`} />
      </div>

      {needAttention.length > 0 && (
        <div className="mb-5 rounded-2xl border border-band-red/30 bg-band-red/5 p-4 text-sm">
          <b className="text-band-red">Needs attention ({needAttention.length})</b>
          <ul className="mt-1 space-y-0.5">
            {needAttention.map((r) => <li key={r.id}>● {r.name} — {r.total ?? "—"}/100 {r.band}</li>)}
          </ul>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted">
            <tr><th className="p-3">Client</th><th className="p-3">Health</th><th className="p-3">MTD spend</th><th className="p-3">ROAS</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border-subtle">
                <td className="p-3 font-semibold">{r.name} <span className="text-xs font-normal text-muted">{r.role}</span></td>
                <td className="p-3">{r.total == null ? <span className="text-muted">No score yet</span> : <span className="inline-block rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ background: BANDC[r.band || ""] || "#5a6577" }}>{r.total}/100 · {r.band}</span>}</td>
                <td className="p-3">{money(r.spend)}</td>
                <td className="p-3">{r.spend > 0 ? `${(r.revenue / r.spend).toFixed(2)}×` : "N/A"}</td>
                <td className="p-3 text-right"><Link href="/command" className="font-semibold text-brand">Open →</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted">Read-only roll-up across the workspaces you belong to. Fees/margins are internal and never appear on client-facing reports.</p>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return <div className="rounded-xl border border-border-subtle bg-surface-raised p-3 shadow-card"><b className="block text-lg">{v}</b><span className="text-xs text-muted">{k}</span></div>;
}
