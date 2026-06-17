"use client";
import { useState } from "react";

// Premium Messenger setup editor. Prefilled with a neutral starter template; edit per client.
// Applies greeting / ice breakers / persistent menu via the Graph API — no browser, no prompts.
const slug = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40) || "OPTION";

type Menu = { title: string; url: string };

export default function MessengerSetup({ tokenConfigured }: { tokenConfigured: boolean }) {
  const [pageToken, setPageToken] = useState("");
  const [greeting, setGreeting] = useState(
    "Hi 👋 — ask me anything about our products, pricing, and current specials!",
  );
  const [ice, setIce] = useState<string[]>([
    "How much are your products?",
    "Do you offer repairs or servicing?",
    "Tell me about your current special",
    "What are your payment options?",
  ]);
  const [menu, setMenu] = useState<Menu[]>([
    { title: "See our range", url: "https://example.com" },
    { title: "Current special", url: "https://example.com/offer" },
  ]);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);

  function payload(): any {
    return {
      pageToken: pageToken.trim() || undefined,
      greeting: greeting.trim() || undefined,
      ice_breakers: ice.filter((q) => q.trim()).slice(0, 4).map((q) => ({ question: q.trim().slice(0, 80), payload: slug(q) })),
      persistent_menu: menu.filter((m) => m.title.trim() && m.url.trim()).slice(0, 3).map((m) => ({ type: "web_url", title: m.title.trim().slice(0, 30), url: m.url.trim() })),
    };
  }

  async function apply() {
    setBusy("apply"); setMsg(""); setOk(false);
    try {
      const r = await fetch("/api/messenger/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload()) });
      const j = await r.json();
      if (!r.ok) setMsg(j.error || "Apply failed");
      else { setOk(true); setMsg(`Applied to ${j.page?.name || "your Page"} ✅ — live in Messenger now.`); }
    } catch (e: any) { setMsg(e.message); } finally { setBusy(""); }
  }
  async function show() {
    setBusy("show"); setMsg(""); setOk(false);
    try {
      const qs = pageToken.trim() ? `?pageToken=${encodeURIComponent(pageToken.trim())}` : "";
      const r = await fetch(`/api/messenger/setup${qs}`);
      const j = await r.json();
      if (!r.ok) setMsg(j.error || "Read failed");
      else { setOk(true); setMsg(`Live profile for ${j.page?.name || "Page"} read ✓ (see console).`); console.log("Messenger profile:", j.profile); }
    } catch (e: any) { setMsg(e.message); } finally { setBusy(""); }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border-subtle bg-white p-5 shadow-card">
        <label className="block text-sm">
          <span className="mb-1 block font-semibold">Page token {tokenConfigured && <span className="font-normal text-muted">(optional — a server token is configured)</span>}</span>
          <input type="password" value={pageToken} onChange={(e) => setPageToken(e.target.value)} autoComplete="off"
            placeholder={tokenConfigured ? "Leave blank to use the configured token" : "Paste a Page token (pages_messaging + pages_manage_metadata)"}
            className="w-full rounded-lg border border-border-subtle p-2.5 font-mono" />
        </label>
        <p className="mt-1.5 text-2xs text-muted">Mint one in Graph API Explorer (no prompts there). Used to write the Page's Messenger profile; not stored.</p>
      </div>

      <div className="rounded-2xl border border-border-subtle bg-white p-5 shadow-card">
        <label className="block text-sm"><span className="mb-1 block font-semibold">Greeting</span>
          <textarea value={greeting} onChange={(e) => setGreeting(e.target.value)} maxLength={600} className="h-20 w-full rounded-lg border border-border-subtle p-2.5" />
        </label>

        <div className="mt-4 text-sm font-semibold">Ice breakers <span className="font-normal text-muted">(up to 4 tappable questions)</span></div>
        {ice.map((q, i) => (
          <input key={i} value={q} maxLength={80} onChange={(e) => setIce(ice.map((v, j) => (j === i ? e.target.value : v)))}
            className="mt-2 w-full rounded-lg border border-border-subtle p-2 text-sm" placeholder={`Question ${i + 1}`} />
        ))}

        <div className="mt-4 text-sm font-semibold">Persistent menu <span className="font-normal text-muted">(up to 3 links)</span></div>
        {menu.map((m, i) => (
          <div key={i} className="mt-2 grid grid-cols-2 gap-2">
            <input value={m.title} maxLength={30} onChange={(e) => setMenu(menu.map((v, j) => (j === i ? { ...v, title: e.target.value } : v)))} className="rounded-lg border border-border-subtle p-2 text-sm" placeholder="Title" />
            <input value={m.url} onChange={(e) => setMenu(menu.map((v, j) => (j === i ? { ...v, url: e.target.value } : v)))} className="rounded-lg border border-border-subtle p-2 text-sm" placeholder="https://…" />
          </div>
        ))}

        <div className="mt-4 flex items-center gap-3">
          <button onClick={apply} disabled={!!busy} className="rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy === "apply" ? "Applying…" : "Apply to Page"}</button>
          <button onClick={show} disabled={!!busy} className="rounded-lg border border-border-subtle px-4 py-2.5 text-sm font-semibold disabled:opacity-50">{busy === "show" ? "Reading…" : "Show live"}</button>
          {msg && <span className={`text-sm ${ok ? "text-teal" : "text-band-red"}`}>{msg}</span>}
        </div>
      </div>
    </div>
  );
}
