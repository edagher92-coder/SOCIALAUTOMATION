"use client";
import { useEffect, useState } from "react";

type Action = {
  id: string; platform: string; entity_level: string; external_entity_id: string; entity_name?: string | null;
  action: string; params: any; status: string; confirm_phrase: string; result?: string | null; error?: string | null;
  created_at: string; executed_at?: string | null; reverted_at?: string | null;
};

const STATUS_CLS: Record<string, string> = {
  proposed: "bg-surface text-muted", done: "bg-band-green/10 text-band-green",
  failed: "bg-band-red/10 text-band-red", reverted: "bg-band-yellow/10 text-band-yellow",
};

export default function ActionsConsole({ writeEnabled }: { writeEnabled: boolean }) {
  const [actions, setActions] = useState<Action[]>([]);
  const [form, setForm] = useState({ platform: "meta", entity_level: "campaign", external_entity_id: "", entity_name: "", action: "pause", daily_budget: "" });
  const [confirm, setConfirm] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    const r = await fetch("/api/actions"); const j = await r.json();
    if (r.ok) setActions(j.actions || []);
  }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!form.external_entity_id.trim()) return;
    setBusy("create"); setMsg("");
    try {
      const body: any = { platform: form.platform, entity_level: form.entity_level, external_entity_id: form.external_entity_id.trim(), entity_name: form.entity_name.trim() || undefined, action: form.action };
      if (form.action === "set_budget") body.params = { daily_budget: Number(form.daily_budget) };
      const r = await fetch("/api/actions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok) setMsg(j.error || "Could not create");
      else { setForm({ ...form, external_entity_id: "", entity_name: "", daily_budget: "" }); load(); }
    } catch (e: any) { setMsg(e.message); } finally { setBusy(""); }
  }
  async function execute(a: Action) {
    setBusy("exec:" + a.id); setMsg("");
    try {
      const r = await fetch(`/api/actions/${a.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirm: confirm[a.id] || "" }) });
      const j = await r.json();
      setMsg(r.ok ? `Executed: ${a.confirm_phrase} ✅` : (j.error || "Failed"));
      load();
    } catch (e: any) { setMsg(e.message); } finally { setBusy(""); }
  }
  async function revert(a: Action) {
    setBusy("rev:" + a.id); setMsg("");
    try {
      const r = await fetch(`/api/actions/${a.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ revert: true }) });
      const j = await r.json(); setMsg(r.ok ? "Reverted ✅" : (j.error || "Revert failed")); load();
    } catch (e: any) { setMsg(e.message); } finally { setBusy(""); }
  }
  async function del(id: string) { await fetch(`/api/actions/${id}`, { method: "DELETE" }); load(); }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-band-red/30 bg-band-red/5 p-4 text-sm text-band-red">
        ⚠ <b>This makes REAL changes to live ad campaigns</b> (pause / resume / budget). It's the one place AdPilot writes to an ad account.
        {writeEnabled
          ? <> Execution is <b>ON</b> for this deployment. Every change still needs the exact typed confirmation, captures prior state, and is reversible + audited.</>
          : <> Execution is <b>OFF</b> until a production operator sets <code>AD_WRITE_EXECUTION_ENABLED=1</code>, configures the budget guardrails, and an owner attaches a dedicated <code>ads_management</code> credential. You can stage actions now; they will not fire.</>}
      </div>

      {/* Stage an action */}
      <div className="rounded-2xl border border-border-subtle bg-white p-5 shadow-card">
        <h3 className="font-bold">Stage a change</h3>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} className="rounded-lg border border-border-subtle p-2 text-sm">
            <option value="meta">Meta</option><option value="tiktok">TikTok (not yet executable)</option>
          </select>
          <select value={form.entity_level} onChange={(e) => setForm({ ...form, entity_level: e.target.value })} className="rounded-lg border border-border-subtle p-2 text-sm">
            <option value="campaign">Campaign</option><option value="adset">Ad set</option><option value="ad">Ad</option>
          </select>
          <input value={form.external_entity_id} onChange={(e) => setForm({ ...form, external_entity_id: e.target.value })} placeholder="Entity ID (e.g. 1203…)" className="rounded-lg border border-border-subtle p-2 text-sm" />
          <input value={form.entity_name} onChange={(e) => setForm({ ...form, entity_name: e.target.value })} placeholder="Name (optional, for the confirm phrase)" className="rounded-lg border border-border-subtle p-2 text-sm" />
          <select value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })} className="rounded-lg border border-border-subtle p-2 text-sm">
            <option value="pause">Pause</option><option value="resume">Resume</option><option value="set_budget">Set daily budget</option>
          </select>
          {form.action === "set_budget" && (
            <input type="number" min={1} value={form.daily_budget} onChange={(e) => setForm({ ...form, daily_budget: e.target.value })} placeholder="Daily budget (account currency)" className="rounded-lg border border-border-subtle p-2 text-sm" />
          )}
        </div>
        <button onClick={create} disabled={busy === "create" || !form.external_entity_id.trim()} className="mt-3 rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy === "create" ? "Staging…" : "Stage (propose) action"}</button>
        {msg && <p className="mt-2 text-sm text-muted">{msg}</p>}
      </div>

      {/* Queue */}
      <div>
        <h3 className="mb-2 font-bold">Staged & executed changes</h3>
        {actions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-subtle p-6 text-center text-muted">Nothing staged yet.</div>
        ) : (
          <div className="space-y-2.5">
            {actions.map((a) => (
              <div key={a.id} className="rounded-2xl border border-border-subtle bg-white p-4 shadow-card">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-ink">{a.confirm_phrase} <span className="text-2xs uppercase text-muted">{a.platform}</span></span>
                  <span className={`rounded-full px-2 py-0.5 text-2xs font-bold capitalize ${STATUS_CLS[a.status] || ""}`}>{a.status}</span>
                </div>
                {a.error && <p className="mt-1 text-2xs text-band-red">{a.error}</p>}
                {a.status === "proposed" && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-border-subtle pt-2">
                    <span className="text-2xs text-muted">Type to authorise: <code className="rounded bg-surface px-1 py-0.5 text-ink">{a.confirm_phrase}</code></span>
                    <input value={confirm[a.id] || ""} onChange={(e) => setConfirm({ ...confirm, [a.id]: e.target.value })} placeholder="type the exact phrase" className="flex-1 rounded-lg border border-border-subtle p-1.5 text-xs" />
                    <button onClick={() => execute(a)} disabled={busy === "exec:" + a.id || (confirm[a.id] || "") !== a.confirm_phrase} className="rounded-lg bg-band-red px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40">{busy === "exec:" + a.id ? "…" : "Execute live"}</button>
                    <button onClick={() => del(a.id)} className="rounded-lg border border-border-subtle px-2.5 py-1.5 text-xs font-semibold text-muted">Delete</button>
                  </div>
                )}
                {a.status === "done" && (
                  <div className="mt-2 flex items-center gap-2 border-t border-border-subtle pt-2">
                    <span className="text-2xs text-muted">Executed{a.executed_at ? ` ${new Date(a.executed_at).toLocaleString()}` : ""}.</span>
                    <button onClick={() => revert(a)} disabled={busy === "rev:" + a.id} className="rounded-lg border border-brand px-3 py-1 text-xs font-semibold text-brand disabled:opacity-50">{busy === "rev:" + a.id ? "…" : "Revert"}</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
