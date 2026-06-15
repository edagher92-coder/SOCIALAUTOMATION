import { createClient } from "@/lib/supabase/server";
import { getActiveOrgId } from "@/lib/org";
import { verdictMeta } from "@/lib/proposals";
import RecActions from "@/components/RecActions";

export const dynamic = "force-dynamic";

export default async function Proposals() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const orgId = user ? await getActiveOrgId(user.id, user.email ?? undefined) : "";
  const { data: recs } = await supabase
    .from("recommendations")
    .select("id,verdict,entity_name,platform,reason,proposal,created_at")
    .eq("organisation_id", orgId).eq("status", "open")
    .order("created_at", { ascending: false }).limit(200);

  const list = (recs || []).slice().sort((a: any, b: any) => verdictMeta(a.verdict).rank - verdictMeta(b.verdict).rank);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-extrabold tracking-tight">Proposals</h1>
      <p className="mb-5 mt-1 text-muted">Safe, prioritised actions from the latest analysis. <b>Read-only</b> — approving records your intent; nothing is changed on Meta/TikTok.</p>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-subtle p-8 text-center text-muted">
          No open proposals. Connect an account and let a sync run, or paste a CSV on <a className="font-semibold text-brand" href="/dashboard">Ads Health</a>.
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((r: any) => {
            const m = verdictMeta(r.verdict);
            return (
              <div key={r.id} className="rounded-2xl border border-border-subtle bg-white p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-extrabold ${m.cls}`}>{m.emoji} {m.label}</span>
                      <span className="truncate text-sm font-semibold text-ink">· {r.entity_name}</span>
                      {r.platform && <span className="rounded-full bg-surface px-2 py-0.5 text-2xs font-bold uppercase text-muted">{r.platform}</span>}
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
