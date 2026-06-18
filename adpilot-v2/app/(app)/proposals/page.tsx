import { createClient } from "@/lib/supabase/server";
import { getActiveOrgId } from "@/lib/org";
import { verdictMeta, VERDICT_GLOSSARY_KEY } from "@/lib/proposals";
import { metricDef } from "@/lib/metric-glossary";
import PageHeader from "@/components/PageHeader";
import RecActions from "@/components/RecActions";
import Tip from "@/components/Tip";

export const dynamic = "force-dynamic";

export default async function Proposals() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const orgId = user ? await getActiveOrgId(user.id, user.email ?? undefined) : "";

  // Signed-out / no-org: prompt to sign in rather than querying with an empty id.
  if (!orgId) {
    return (
      <div className="max-w-3xl animate-fade-in">
        <PageHeader
          eyebrow="Proposals"
          title="Proposals"
          subtitle="Safe, prioritised actions from your latest analysis. Read-only — nothing is changed on Meta/TikTok."
        />
        <div className="rounded-2xl border border-dashed border-border-subtle bg-surface-raised p-10 text-center">
          <div className="text-3xl">📋</div>
          <p className="mt-2 font-semibold text-ink">Sign in to see your proposals</p>
          <a href="/login" className="mt-4 inline-block rounded-xl bg-brand px-5 py-2 text-sm font-bold text-white">Sign in</a>
        </div>
      </div>
    );
  }

  const { data: recs, error } = await supabase
    .from("recommendations")
    .select("id,verdict,entity_name,platform,reason,proposal,created_at")
    .eq("organisation_id", orgId).eq("status", "open")
    .order("created_at", { ascending: false }).limit(200);

  const list = (recs || []).slice().sort((a: any, b: any) => verdictMeta(a.verdict).rank - verdictMeta(b.verdict).rank);

  return (
    <div className="max-w-3xl animate-fade-in">
      <PageHeader
        eyebrow="Proposals"
        title="Proposals"
        subtitle="Safe, prioritised actions from the latest analysis. Read-only — approving records your intent; nothing is changed on Meta/TikTok."
      />

      {error ? (
        <div className="rounded-2xl border border-band-red/30 bg-band-red/5 p-8 text-center">
          <p className="font-semibold text-band-red">We couldn’t load your proposals.</p>
          <p className="mt-1 text-sm text-muted">This is usually temporary — refresh to try again.</p>
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-subtle bg-surface-raised p-10 text-center">
          <div className="text-3xl">✅</div>
          <p className="mt-2 font-semibold text-ink">No open proposals</p>
          <p className="mt-1 text-sm text-muted">
            Connect an account and let a sync run, or paste a CSV on{" "}
            <a className="font-semibold text-brand" href="/dashboard">Ads Health</a>.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((r: any) => {
            const m = verdictMeta(r.verdict);
            const def = metricDef(VERDICT_GLOSSARY_KEY[r.verdict] || "");
            return (
              <div key={r.id} className="rounded-2xl border border-border-subtle bg-white p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-sm font-extrabold ${m.cls}`}>{m.emoji} {m.label}</span>
                      {def && <Tip label={m.label} term={def.term} align="left">{def.what}</Tip>}
                      <span className="truncate text-sm font-semibold text-ink">· {r.entity_name}</span>
                      {r.platform && r.platform !== "?" && (
                        <span className="rounded-full bg-surface px-2 py-0.5 text-2xs font-bold uppercase text-muted">{r.platform}</span>
                      )}
                    </div>
                    {r.reason && <p className="mt-1 text-sm text-muted">{r.reason}</p>}
                    {r.proposal && <p className="mt-1.5 text-sm text-ink"><span className="font-semibold">Proposal:</span> {r.proposal}</p>}
                  </div>
                  <RecActions id={r.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
