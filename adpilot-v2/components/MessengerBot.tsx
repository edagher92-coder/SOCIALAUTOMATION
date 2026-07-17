"use client";
import { useEffect, useState } from "react";

type Page = { external_page_id: string; display_name?: string; channel?: string; ai_enabled?: boolean; ai_facts?: string | null; ai_voice?: string | null };
type RuleRow = { id: string; external_page_id: string; trigger_type: string; trigger?: string | null; reply: string; priority: number };

const TRIGGER_TYPES = [
  { v: "keyword", label: "Keyword (message contains)" },
  { v: "payload", label: "Ice-breaker / button payload" },
  { v: "welcome", label: "Welcome / greeting (first message, in hours)" },
  { v: "away", label: "Away (first message, outside hours)" },
  { v: "default", label: "Default (no match)" },
];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function MessengerBot({ webhookUrl, verifyConfigured, appSecretConfigured }: { webhookUrl: string; verifyConfigured: boolean; appSecretConfigured: boolean }) {
  const [pages, setPages] = useState<Page[]>([]);
  const [active, setActive] = useState("");
  const [rules, setRules] = useState<RuleRow[]>([]);

  // Registration form
  const [channel, setChannel] = useState<"messenger" | "whatsapp">("messenger");
  const [pageToken, setPageToken] = useState("");
  const [waToken, setWaToken] = useState("");
  const [waPhone, setWaPhone] = useState("");
  const [hours, setHours] = useState({ tz_offset: 10, open_hour: 8, close_hour: 18, days: [0, 1, 2, 3, 4, 5] as number[] });

  const [form, setForm] = useState({ trigger_type: "keyword", trigger: "", reply: "" });
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  // AI smart-mode settings for the active channel.
  const [ai, setAi] = useState({ enabled: false, facts: "", voice: "" });
  const [aiMsg, setAiMsg] = useState("");
  const activePage = pages.find((p) => p.external_page_id === active);

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
  // Hydrate the AI editor from the active page whenever the selection or page data changes.
  useEffect(() => {
    setAiMsg("");
    setAi({ enabled: !!activePage?.ai_enabled, facts: activePage?.ai_facts || "", voice: activePage?.ai_voice || "" });
  }, [active, activePage?.ai_enabled, activePage?.ai_facts, activePage?.ai_voice]);

  async function register() {
    setBusy("reg"); setMsg("");
    try {
      const body: any = { channel, business_hours: hours };
      if (channel === "whatsapp") { body.whatsappToken = waToken.trim(); body.phoneNumberId = waPhone.trim(); }
      else { body.pageToken = pageToken.trim(); }
      const r = await fetch("/api/messenger/pages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok) setMsg(j.error || "Could not register");
      else { setPageToken(""); setWaToken(""); setMsg(`Connected ${j.page?.name || "channel"} (${j.page?.channel}) ✅`); await loadPages(); setActive(j.page?.id || active); }
    } catch (e: any) { setMsg(e.message); } finally { setBusy(""); }
  }
  async function subscribe(page: string) {
    setBusy("sub:" + page); setMsg("");
    try {
      const r = await fetch("/api/messenger/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ external_page_id: page }) });
      const j = await r.json();
      setMsg(r.ok ? `Subscribed ${j.page?.name || page} to the webhook ✅` : (j.error || "Subscribe failed"));
    } catch (e: any) { setMsg(e.message); } finally { setBusy(""); }
  }
  async function addRule() {
    if (!active || !form.reply.trim()) return;
    setBusy("rule");
    try {
      const r = await fetch("/api/messenger/rules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ external_page_id: active, trigger_type: form.trigger_type, trigger: form.trigger.trim() || undefined, reply: form.reply.trim() }) });
      const j = await r.json();
      if (!r.ok) setMsg(j.error || "Could not add rule"); else { setForm({ trigger_type: "keyword", trigger: "", reply: "" }); loadRules(active); }
    } catch (e: any) { setMsg(e.message); } finally { setBusy(""); }
  }
  async function delRule(id: string) { await fetch(`/api/messenger/rules?id=${id}`, { method: "DELETE" }); loadRules(active); }
  async function saveAi() {
    if (!active) return;
    setBusy("ai"); setAiMsg("");
    try {
      const r = await fetch("/api/messenger/pages", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ external_page_id: active, ai_enabled: ai.enabled, ai_facts: ai.facts.trim() || null, ai_voice: ai.voice.trim() || null }),
      });
      const j = await r.json();
      if (!r.ok) setAiMsg(j.error || "Could not save");
      else { setAiMsg("Saved ✅"); await loadPages(); }
    } catch (e: any) { setAiMsg(e.message); } finally { setBusy(""); }
  }
  const toggleDay = (d: number) => setHours({ ...hours, days: hours.days.includes(d) ? hours.days.filter((x) => x !== d) : [...hours.days, d].sort() });

  return (
    <div className="space-y-5">
      {/* Setup checklist */}
      <div className="rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-card">
        <h3 className="font-bold">Webhook (one-time, in your Meta app)</h3>
        <ol className="mt-2 space-y-1 text-sm text-muted">
          <li>1. Callback URL: <code className="rounded bg-surface px-1.5 py-0.5 text-ink">{webhookUrl || "set NEXT_PUBLIC_APP_URL"}</code> — works for Messenger, Instagram, and WhatsApp.</li>
          <li>2. Verify token: {verifyConfigured ? <span className="text-teal">configured ✓</span> : <span className="text-band-red">set MESSENGER_VERIFY_TOKEN</span>} · App secret: {appSecretConfigured ? <span className="text-teal">configured ✓</span> : <span className="text-band-red">set META_APP_SECRET</span>}</li>
          <li>3. Subscribe fields <code className="rounded bg-surface px-1.5 py-0.5 text-ink">messages, messaging_postbacks</code> (Messenger: use the button below; WhatsApp: in the App Dashboard).</li>
          <li>4. App Review for <b>pages_messaging</b> / <b>instagram_manage_messages</b> / <b>whatsapp_business_messaging</b> advanced access to reply to the public. Per-app, not per-page.</li>
        </ol>
      </div>

      {/* Register channel */}
      <div className="rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-card">
        <h3 className="font-bold">Connect a channel</h3>
        <div className="mt-2 flex gap-2 text-sm">
          {(["messenger", "whatsapp"] as const).map((c) => (
            <button key={c} onClick={() => setChannel(c)} className={`rounded-lg px-3 py-1.5 font-semibold capitalize ${channel === c ? "bg-brand text-white" : "bg-surface text-muted"}`}>{c === "messenger" ? "Messenger / Instagram" : "WhatsApp"}</button>
          ))}
        </div>
        {channel === "messenger" ? (
          <input type="password" value={pageToken} onChange={(e) => setPageToken(e.target.value)} autoComplete="off" placeholder="Page token (pages_messaging + pages_manage_metadata [+ instagram_manage_messages for IG])" className="mt-2 w-full rounded-lg border border-border-subtle p-2.5 font-mono text-sm" />
        ) : (
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <input value={waPhone} onChange={(e) => setWaPhone(e.target.value)} placeholder="WhatsApp phone number ID" className="rounded-lg border border-border-subtle p-2.5 text-sm" />
            <input type="password" value={waToken} onChange={(e) => setWaToken(e.target.value)} autoComplete="off" placeholder="WhatsApp Cloud API token" className="rounded-lg border border-border-subtle p-2.5 font-mono text-sm" />
          </div>
        )}

        {/* Business hours */}
        <div className="mt-3 rounded-xl bg-surface p-3">
          <div className="text-xs font-bold uppercase tracking-wide text-muted">Business hours (drives away vs greeting)</div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <label>Open <input type="number" min={0} max={23} value={hours.open_hour} onChange={(e) => setHours({ ...hours, open_hour: +e.target.value })} className="w-16 rounded border border-border-subtle p-1" /></label>
            <label>Close <input type="number" min={1} max={24} value={hours.close_hour} onChange={(e) => setHours({ ...hours, close_hour: +e.target.value })} className="w-16 rounded border border-border-subtle p-1" /></label>
            <label>UTC offset <input type="number" value={hours.tz_offset} onChange={(e) => setHours({ ...hours, tz_offset: +e.target.value })} className="w-16 rounded border border-border-subtle p-1" /></label>
            <span className="flex gap-1">{DAYS.map((d, i) => (
              <button key={d} onClick={() => toggleDay(i)} className={`rounded px-1.5 py-0.5 text-2xs font-bold ${hours.days.includes(i) ? "bg-brand text-white" : "bg-surface-raised text-muted"}`}>{d}</button>
            ))}</span>
          </div>
        </div>

        <button onClick={register} disabled={!!busy} className="mt-3 rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy === "reg" ? "Connecting…" : "Connect channel"}</button>

        {pages.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {pages.map((p) => (
              <div key={p.external_page_id} className="flex items-center justify-between gap-2 rounded-lg border border-border-subtle px-3 py-1.5 text-sm">
                <button onClick={() => setActive(p.external_page_id)} className={`text-left font-semibold ${active === p.external_page_id ? "text-brand" : "text-ink"}`}>
                  {p.display_name} <span className="text-2xs uppercase text-muted">{p.channel}</span>
                </button>
                {p.channel === "messenger" && <button onClick={() => subscribe(p.external_page_id)} disabled={busy === "sub:" + p.external_page_id} className="text-xs font-semibold text-brand disabled:opacity-50">{busy === "sub:" + p.external_page_id ? "…" : "Subscribe webhook"}</button>}
              </div>
            ))}
          </div>
        )}
        {msg && <p className="mt-2 text-sm text-muted">{msg}</p>}
      </div>

      {/* Rules + AI smart mode */}
      {active && (
        <>
        <div className="rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-card">
          <h3 className="font-bold">Auto-reply rules <span className="text-xs font-normal text-muted">— {activePage?.display_name}</span></h3>
          <p className="mt-0.5 text-xs text-muted">Order: payload → keyword → first-message greeting (hours-aware) → default.</p>
          <div className="mt-3 space-y-2">
            {rules.length === 0 && <p className="text-sm text-muted">No rules yet. Add a welcome + a few keyword rules (e.g. <code>winter</code> → your service reply).</p>}
            {rules.map((r) => (
              <div key={r.id} className="flex items-start justify-between gap-3 rounded-xl border border-border-subtle p-3 text-sm">
                <div className="min-w-0">
                  <span className="rounded-full bg-surface px-2 py-0.5 text-2xs font-bold uppercase text-muted">{r.trigger_type}</span>
                  {r.trigger && <span className="ml-2 font-semibold text-ink">{r.trigger}</span>}
                  <p className="mt-1 line-clamp-2 text-muted">{r.reply}</p>
                </div>
                <button onClick={() => delRule(r.id)} className="flex-shrink-0 text-xs font-semibold text-band-red">Delete</button>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2 border-t border-border-subtle pt-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <select value={form.trigger_type} onChange={(e) => setForm({ ...form, trigger_type: e.target.value })} className="rounded-lg border border-border-subtle p-2 text-sm">
                {TRIGGER_TYPES.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
              </select>
              <input value={form.trigger} onChange={(e) => setForm({ ...form, trigger: e.target.value })}
                placeholder={form.trigger_type === "keyword" ? "winter, service, repair" : form.trigger_type === "payload" ? "WINTER" : "(no trigger needed)"}
                disabled={["welcome", "away", "default"].includes(form.trigger_type)}
                className="rounded-lg border border-border-subtle p-2 text-sm disabled:opacity-50" />
            </div>
            <textarea value={form.reply} onChange={(e) => setForm({ ...form, reply: e.target.value })} maxLength={2000} placeholder="Auto-reply text…" className="h-20 w-full rounded-lg border border-border-subtle p-2.5 text-sm" />
            <button onClick={addRule} disabled={busy === "rule" || !form.reply.trim()} className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy === "rule" ? "Adding…" : "Add rule"}</button>
          </div>
        </div>

        {/* AI smart mode (LLM-grounded auto-reply) */}
        <div className="rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold">AI smart replies <span className="text-xs font-normal text-muted">— answers from your verified facts only</span></h3>
              <p className="mt-0.5 text-xs text-muted">When no payload or keyword rule matches, the assistant answers strictly from the facts below. It never invents prices, specs, or policies, and never collects finance details in chat. Falls back to your welcome/away/default rules if it can't answer.</p>
            </div>
            <label className="flex flex-shrink-0 cursor-pointer items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={ai.enabled} onChange={(e) => setAi({ ...ai, enabled: e.target.checked })} className="h-4 w-4" />
              {ai.enabled ? "On" : "Off"}
            </label>
          </div>
          <div className="mt-3 space-y-2">
            <label className="block text-sm">
              <span className="mb-1 block font-semibold">Verified facts <span className="font-normal text-muted">(the only source the AI may answer from — prices, specials, hours, policies, what you offer)</span></span>
              <textarea value={ai.facts} onChange={(e) => setAi({ ...ai, facts: e.target.value })} maxLength={8000} placeholder={"e.g.\n- We service and repair all major brands. Standard service is $120.\n- Current special: 10% off repairs booked this month.\n- Open Mon–Fri 8am–6pm; finance available (handled by our team, not in chat)."} className="h-32 w-full rounded-lg border border-border-subtle p-2.5 text-sm" />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold">Brand voice <span className="font-normal text-muted">(optional)</span></span>
              <input value={ai.voice} onChange={(e) => setAi({ ...ai, voice: e.target.value })} maxLength={1000} placeholder="e.g. friendly, concise, warm Aussie tone" className="w-full rounded-lg border border-border-subtle p-2 text-sm" />
            </label>
            <div className="flex items-center gap-3">
              <button onClick={saveAi} disabled={busy === "ai"} className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy === "ai" ? "Saving…" : "Save AI settings"}</button>
              {aiMsg && <span className="text-sm text-muted">{aiMsg}</span>}
            </div>
            <p className="text-2xs text-muted">Requires <code className="rounded bg-surface px-1 py-0.5">ANTHROPIC_API_KEY</code> on the server. Same Meta app review as auto-replies (pages_messaging / instagram_manage_messages / whatsapp_business_messaging) to reply to the public.</p>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
