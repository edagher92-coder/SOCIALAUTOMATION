import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveOrgId } from "@/lib/org";
import { verdictMeta, VERDICT_GLOSSARY_KEY } from "@/lib/proposals";
import { metricDef } from "@/lib/metric-glossary";
import PageHeader from "@/components/PageHeader";
import RecActions from "@/components/RecActions";
import Tip from "@/components/Tip";
import ModeAware from "@/components/ModeAware";
import { Icon, VERDICT_ICON } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function FixesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const orgId = user ? await getActiveOrgId(user.id, user.email ?? undefined) : "";

  if (!orgId) {
    return (
      <div className="mx-auto max-w-4xl animate-fade-in">
        <PageHeader eyebrow="Decision queue" title="Fixes" subtitle="Prioritised work from your latest audit." />
        <div className="rounded-3xl border border-dashed border-border-subtle bg-white p-10 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-surface text-brand"><Icon name="check-circle" size={23} /></span><p className="mt-3 font-bold text-ink">Sign in to see your fixes</p><Link href="/login" className="mt-4 inline-flex rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white">Sign in</Link></div>
      </div>
    );
  }

  const { data: recs, error } = await supabase.from("recommendations")
    .select("id,verdict,entity_name,platform,reason,proposal,created_at")
    .eq("organisation_id", orgId).eq("status", "open")
    .order("created_at", { ascending: false }).limit(200);

  const list = (recs || []).slice().sort((a, b) => verdictMeta(a.verdict).rank - verdictMeta(b.verdict).rank);
  const grouped = list.reduce((result: Record<string, typeof list>, item) => { (result[item.verdict] ||= []).push(item); return result; }, {});
  const urgent = list.filter((item) => item.verdict === "kill" || item.verdict === "fix-tracking").length;
  const improvements = list.filter((item) => item.verdict === "reduce" || item.verdict === "refresh").length;

  return (
    <div className="mx-auto max-w-5xl animate-fade-in">
      <PageHeader
        eyebrow="Decision queue"
        title="Fixes"
        subtitle="Review the evidence behind every recommendation. Saving a plan updates this worklist only; live paid ads remain untouched."
        action={<Link href="/automate" className="inline-flex items-center gap-2 rounded-xl border border-border-subtle bg-white px-3.5 py-2 text-sm font-bold text-ink shadow-sm hover:border-brand-200"><Icon name="blocks" size={16} /> Watch rules</Link>}
      />

      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border-subtle bg-white p-4 shadow-card"><div className="text-2xs font-extrabold uppercase tracking-wider text-muted">Waiting for review</div><div className="mt-1 text-2xl font-extrabold tabular-nums text-ink">{list.length}</div><p className="mt-1 text-xs text-muted">Across the latest audit evidence</p></div>
        <div className="rounded-2xl border border-bad/20 bg-bad/5 p-4"><div className="text-2xs font-extrabold uppercase tracking-wider text-bad">Important</div><div className="mt-1 text-2xl font-extrabold tabular-nums text-bad">{urgent}</div><p className="mt-1 text-xs text-muted">Tracking or loss-control checks</p></div>
        <div className="rounded-2xl border border-warn/25 bg-warn/5 p-4"><div className="text-2xs font-extrabold uppercase tracking-wider text-amber-800">Improvements</div><div className="mt-1 text-2xl font-extrabold tabular-nums text-amber-800">{improvements}</div><p className="mt-1 text-xs text-muted">Efficiency or creative refresh work</p></div>
      </section>

      <div className="mb-5 flex items-start gap-2 rounded-2xl border border-good/25 bg-good/10 p-4 text-sm text-green-900"><span className="mt-0.5"><Icon name="shield" size={17} /></span><div><b>Safe review mode is on.</b> “Save as planned” records your decision and creates a clear worklist. It never pauses, launches or changes the budget of a paid ad.</div></div>

      {error ? (
        <div className="rounded-3xl border border-bad/30 bg-bad/10 p-8 text-center"><Icon name="alert-triangle" className="mx-auto text-bad" size={26} /><p className="mt-3 font-bold text-bad">Fixes could not be loaded</p><p className="mt-1 text-sm text-muted">Refresh to try the request again.</p></div>
      ) : list.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border-subtle bg-white p-10 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-good/10 text-green-700"><Icon name="check-circle" size={24} /></span><p className="mt-3 font-extrabold text-ink">Nothing is waiting for review</p><p className="mx-auto mt-1 max-w-md text-sm text-muted">Connect an account and let the next sync run, or import a CSV for a fresh audit.</p><div className="mt-4 flex justify-center gap-2"><Link href="/connect" className="rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white">Connect data</Link><Link href="/dashboard" className="rounded-xl border border-border-subtle px-4 py-2.5 text-sm font-bold text-ink">Import CSV</Link></div></div>
      ) : (
        <div className="space-y-7">
          {Object.keys(grouped).sort((a, b) => verdictMeta(a).rank - verdictMeta(b).rank).map((verdict) => {
            const meta = verdictMeta(verdict);
            const definition = metricDef(VERDICT_GLOSSARY_KEY[verdict] || "");
            const icon = VERDICT_ICON[verdict] || VERDICT_ICON.keep;
            const items = grouped[verdict];
            return (
              <section key={verdict}>
                <header className="mb-2 flex items-center gap-2"><span className={`inline-flex items-center gap-1.5 text-sm font-extrabold ${meta.cls}`}><Icon name={icon.icon} size={16} /> {meta.label}</span><span className="rounded-full bg-white px-2 py-0.5 text-2xs font-bold text-muted shadow-sm">{items.length}</span>{definition && <Tip label={meta.label} term={definition.term} align="left">{definition.what}</Tip>}</header>
                <div className="space-y-3">
                  {items.map((item) => (
                    <article key={item.id} className="rounded-3xl border border-border-subtle bg-white p-4 shadow-card sm:p-5">
                      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-bold text-ink">{item.entity_name}</h3>{item.platform && item.platform !== "?" && <span className="rounded-full bg-surface px-2 py-0.5 text-2xs font-extrabold uppercase text-muted">{item.platform}</span>}<span className="text-2xs text-muted">Latest audit · {new Date(item.created_at).toLocaleDateString("en-AU")}</span></div>
                          <ModeAware only="advanced">{item.reason && <div className="mt-3 rounded-xl border border-border-subtle bg-surface p-3"><div className="mb-1 flex items-center gap-1.5 text-2xs font-extrabold uppercase tracking-wider text-muted"><Icon name="info" size={12} /> Why this was flagged</div><p className="text-sm leading-relaxed text-muted">{item.reason}</p></div>}</ModeAware>
                          {item.proposal && <div className="mt-3 rounded-xl bg-brand-50 p-3"><div className="mb-1 flex items-center gap-1.5 text-2xs font-extrabold uppercase tracking-wider text-brand"><Icon name="chevron-right" size={12} /> Suggested next step</div><p className="text-sm leading-relaxed text-ink">{item.proposal}</p></div>}
                        </div>
                        <RecActions id={item.id} verdict={item.verdict} />
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
