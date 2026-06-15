"use client";
import { useEffect, useState } from "react";

type Page = { external_page_id: string; display_name?: string };
type RuleRow = { id: string; external_page_id: string; trigger_type: string; trigger?: string | null; reply: string; priority: number };

const TRIGGER_TYPES = [
  { v: "keyword", label: "Keyword (message contains)" },
  { v: "payload", label: "Ice-breaker / button payload" },
  { v: "welcome", label: "Welcome (Get Started)" },
  { v: "default", label: "Default (no match)" },
];

export default function MessengerBot({ webhookUrl, verifyConfigured, appSecretConfigured }: { webhookUrl: string; verifyConfigured: boolean; appSecretConfigured: boolean }) {
  const [pages, setPages] = useState<Page[]>([]);
  const [active, setActive] = useState("");
  const [rules, setRules] = useState<RuleRow[]>([]);
  const [token, setToken] = useState("");
  const [form, setForm] = useState({ trigger_type: "keyword", trigger: "", reply: "" });
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  async function loadPages() {
    const r = await fetch("/api/messenger/pages"); const j = await r.json();
    if (r.ok) { setPages(j.pages || []); if (!active && j.pages?.[0]) setActive(j.pages[0].external_page_id); }
  }
  async function loadRules(page: string) {
    if (!page) return setRules([]);
    const r = await fetch(`/api/messenger/rules?page=${encodeURIComponent(page)}`); const j = await r.json();
    if (r.ok) setRules(j.rules || []);
  }
  useEffect(() => { loadPages(); }, []);
  useEffect(() => { loadRules(active); }, [active]);

  async function register() {
    setBusy("reg"); setMsg("");
    try {
      const r = await fetch("/api/messenger/pages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pageToken: token.trim() }) });
      const j = await r.json();
      if (!r.ok) setMsg(j.error || "Could not register"); else { setToken(""); setMsg(`Registered ${j.page?.name || "page"} ✅`); await loadPages(); setActive(j.page?.id || active); }
    } catch (e: any) { setMsg(e.message); } finally { setBusy(""); }
  }
  async function addRule() {
    if (!active || !form.reply.trim()) return;
    setBusy("rule"); setMsg("");
    try {
      const r = await fetch("/api/messenger/rules", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ external_page_id: active, trigger_type: form.trigger_type, trigger: form.trigger.trim() || undefined, reply: form.reply.trim() }),
      });
      const j = await r.json();
      if (!r.ok) setMsg(j.error || "Could not add rule"); else { setForm({ trigger_type: "keyword", trigger: "", reply: "" }); loadRules(active); }
    } catch (e: any) { setMsg(e.message); } finally { setBusy(""); }
  }
  async function delRule(id: string) { await fetch(`/api/messenger/rules?id=${id}`, { method: "DELETE" }); loadRules(active); }

  return (
    <div className="space-y-5">
      {/* Setup checklist */}
      <div className="rounded-2xl border border-border-subtle bg-white p-5 shadow-card">
        <h3 className="font-bold">Webhook (one-time, in your Meta app)</h3>
        <ol className="mt-2 space-y-1 text-sm text-muted">
          <li>1. Callback URL: <code className="rounded bg-surface px-1.5 py-0.5 text-ink">{webhookUrl || "set NEXT_PUBLIC_APP_URL"}</code></li>
          <li>2. Verify token: {verifyConfigured ? <span className="text-teal">configured ✓</span> : <span className="text-band-red">set MESSENGER_VERIFY_TOKEN on the server</span>}</li>
          <li>3. App secret (signature): {appSecretConfigured ? <span className="text-teal">configured ✓</span> : <span className="text-band-red">set META_APP_SECRET</span>}</li>
          <li>4. Subscribe the Page to <code className="rounded bg-surface px-1.5 py-0.5 text-ink">messages, messaging_postbacks</code>, and get <b>pages_messaging advanced access</b> (Meta app review) to reply beyond test users.</li>
        </ol>
      </div>

      {/* Register page */}
      <div className="rounded-2xl border border-border-subtle bg-white p-5 shadow-card">
        <h3 className="font-bold">Connect a Page</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          <input type="password" value={token} onChange={(e) => setToken(e.target.value)} autoComplete="off" placeholder="Paste a Page token (pages_messaging + pages_manage_metadata)" className="min-w-0 flex-1 rounded-lg border border-border-subtle p-2.5 font-mono text-sm" />
          <button onClick={register} disabled={busy === "reg" || token.trim().length < 20} className="rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy === "reg" ? "Connecting…" : "Connect"}</button>
        </div>
        {pages.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {pages.map((p) => (
              <button key={p.external_page_id} onClick={() => setActive(p.external_page_id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${active === p.external_page_id ? "bg-brand text-white" : "bg-surface text-muted"}`}>
                {p.display_name || p.external_page_id}
              </button>
            ))}
          </div>
        )}
        {msg && <p className="mt-2 text-sm text-muted">{msg}</p>}
      </div>

      {/* Rules */}
      {active && (
        <div className="rounded-2xl border border-border-subtle bg-white p-5 shadow-card">
          <h3 className="font-bold">Auto-reply rules</h3>
          <p className="mt-0.5 text-xs text-muted">First match wins, by type: payload → welcome → keyword → default.</p>
          <div className="mt-3 space-y-2">
            {rules.length === 0 && <p className="text-sm text-muted">No rules yet — add one below (e.g. keyword <code>winter</code> → your $225 service reply).</p>}
            {rules.map((r) => (
              <div key={r.id} className="flex items-start justify-between gap-3 rounded-xl border border-[#eef2f7] p-3 text-sm">
                <div className="min-w-0">
                  <span className="rounded-full bg-surface px-2 py-0.5 text-2xs font-bold uppercase text-muted">{r.trigger_type}</span>
                  {r.trigger && <span className="ml-2 font-semibold text-ink">{r.trigger}</span>}
                  <p className="mt-1 line-clamp-2 text-muted">{r.reply}</p>
                </div>
                <button onClick={() => delRule(r.id)} className="flex-shrink-0 text-xs font-semibold text-band-red">Delete</button>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2 border-t border-[#eef2f7] pt-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <select value={form.trigger_type} onChange={(e) => setForm({ ...form, trigger_type: e.target.value })} className="rounded-lg border border-border-subtle p-2 text-sm">
                {TRIGGER_TYPES.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
              </select>
              <input value={form.trigger} onChange={(e) => setForm({ ...form, trigger: e.target.value })}
                placeholder={form.trigger_type === "keyword" ? "winter, service, repair" : form.trigger_type === "payload" ? "WINTER" : "(no trigger needed)"}
                disabled={form.trigger_type === "welcome" || form.trigger_type === "default"}
                className="rounded-lg border border-border-subtle p-2 text-sm disabled:opacity-50" />
            </div>
            <textarea value={form.reply} onChange={(e) => setForm({ ...form, reply: e.target.value })} maxLength={2000} placeholder="Auto-reply text…" className="h-20 w-full rounded-lg border border-border-subtle p-2.5 text-sm" />
            <button onClick={addRule} disabled={busy === "rule" || !form.reply.trim()} className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy === "rule" ? "Adding…" : "Add rule"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
