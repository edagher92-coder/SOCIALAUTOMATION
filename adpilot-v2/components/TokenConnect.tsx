"use client";
import { useState } from "react";

// Dev-link connect: paste a read-only access token to connect Meta/TikTok without OAuth
// app review. On success the server pulls data immediately (automation-first).
export default function TokenConnect() {
  const [platform, setPlatform] = useState<"meta" | "tiktok">("meta");
  const [token, setToken] = useState("");
  const [accountId, setAccountId] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);

  async function go() {
    setBusy(true); setMsg(""); setOk(false);
    try {
      const r = await fetch("/api/connect/token", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, token: token.trim(), accountId: accountId.trim() || undefined }),
      });
      const j = await r.json();
      if (!r.ok) { setMsg(j.error || "Connect failed"); }
      else {
        setOk(true);
        setMsg(`Connected ${j.connected} · ${j.accounts} account(s) · pulled ${j.inserted} rows`
          + (j.syncError ? ` (first sync note: ${j.syncError})` : "") + ". Refresh to see it below.");
        setToken("");
      }
    } catch (e: any) { setMsg(e.message || "Connect failed"); }
    finally { setBusy(false); }
  }

  return (
    <div className="mt-4 rounded-2xl border border-[#e3e8ef] bg-white p-5 shadow-card">
      <h3 className="font-bold">Advanced — connect with an access token (dev link)</h3>
      <p className="mb-3 mt-1 text-sm text-muted">
        Paste a read-only token to connect now without OAuth app review. Meta: a token with
        <code className="mx-1">ads_read</code> from the Graph API Explorer or a Business System User.
        TikTok: a long-lived token plus the advertiser id.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-semibold">Platform</span>
          <select value={platform} onChange={(e) => setPlatform(e.target.value as "meta" | "tiktok")}
            className="w-full rounded-lg border border-[#e3e8ef] p-2.5">
            <option value="meta">Meta (Facebook / Instagram)</option>
            <option value="tiktok">TikTok Ads</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold">Account ID {platform === "tiktok" ? "(advertiser_id, required)" : "(optional)"}</span>
          <input value={accountId} onChange={(e) => setAccountId(e.target.value)} placeholder={platform === "meta" ? "act_123… (leave blank for all)" : "advertiser_id"}
            className="w-full rounded-lg border border-[#e3e8ef] p-2.5" />
        </label>
      </div>
      <label className="mt-3 block text-sm">
        <span className="mb-1 block font-semibold">Access token</span>
        <input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste read-only token"
          className="w-full rounded-lg border border-[#e3e8ef] p-2.5 font-mono" autoComplete="off" />
      </label>
      <div className="mt-3 flex items-center gap-3">
        <button onClick={go} disabled={busy || token.trim().length < 10}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
          {busy ? "Connecting…" : "Connect & sync"}
        </button>
        {msg && <span className={`text-xs ${ok ? "text-green-600" : "text-red-600"}`}>{msg}</span>}
      </div>
      <p className="mt-3 text-xs text-muted">Token is encrypted (AES-256-GCM) before storage and never sent back to the browser. Read-only — we never edit, pause, or create ads.</p>
    </div>
  );
}
