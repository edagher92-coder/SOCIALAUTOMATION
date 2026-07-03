"use client";
import { useState } from "react";
import RunFirstAudit from "@/components/RunFirstAudit";

// Dev-link connect: paste a read-only access token to connect Meta/TikTok without OAuth
// app review. On success the server pulls data immediately (automation-first) and we offer
// a one-click "Run my first audit" so the user reaches their Campaign Health Score right away.
export default function TokenConnect() {
  const [platform, setPlatform] = useState<"meta" | "tiktok">("meta");
  const [token, setToken] = useState("");
  const [accountId, setAccountId] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const [upgrade, setUpgrade] = useState(false);
  const [tokenIssue, setTokenIssue] = useState(false);
  const [canAudit, setCanAudit] = useState(false);

  const tikTokNeedsAccount = platform === "tiktok" && accountId.trim().length === 0;
  // Catch the easy mistake of typing a login email into the ad-account-id box.
  const accountLooksLikeEmail = platform === "meta" && /@/.test(accountId);
  const canSubmit = token.trim().length >= 10 && !tikTokNeedsAccount && !accountLooksLikeEmail;

  async function go() {
    if (!canSubmit) return;
    setBusy(true); setMsg(""); setOk(false); setUpgrade(false); setTokenIssue(false); setCanAudit(false);
    try {
      const r = await fetch("/api/connect/token", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, token: token.trim(), accountId: accountId.trim() || undefined }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setUpgrade(Boolean(j.upgrade)); // 402 → show the Billing link
        setTokenIssue(Boolean(j.tokenHelp)); // token-shaped error → deep-link the in-page guide
        setMsg(j.error || `Connect failed (HTTP ${r.status})`);
      } else {
        setOk(true);
        setCanAudit(Boolean(j.canAudit));
        const n = j.inserted ?? 0;
        setMsg(`Connected ${j.connected} · ${j.accounts} account(s) · pulled ${n} row${n === 1 ? "" : "s"}`
          + (j.syncError ? ` (first sync note: ${j.syncError})` : "") + ".");
        setToken("");
      }
    } catch (e: any) { setMsg(e?.message || "Network error — check your connection and try again."); }
    finally { setBusy(false); }
  }

  return (
    <div className="mt-4 rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-card">
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
          <input value={accountId} onChange={(e) => setAccountId(e.target.value)} placeholder={platform === "meta" ? "act_123… — leave blank for all" : "advertiser_id"}
            className={`w-full rounded-lg border p-2.5 ${accountLooksLikeEmail ? "border-red-400" : "border-[#e3e8ef]"}`} />
          <span className="mt-1 block text-xs text-muted">
            {platform === "meta"
              ? "Your Meta ad-account id (act_…), not your login email. Leave blank to connect every account the token can see."
              : "Your TikTok advertiser id (numeric)."}
          </span>
          {accountLooksLikeEmail && (
            <span className="mt-1 block text-xs font-semibold text-red-600">That looks like an email — use an ad-account id (act_…) or leave it blank.</span>
          )}
        </label>
      </div>
      <label className="mt-3 block text-sm">
        <span className="mb-1 block font-semibold">Access token</span>
        <input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste read-only token"
          className="w-full rounded-lg border border-[#e3e8ef] p-2.5 font-mono" autoComplete="off" />
      </label>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button onClick={go} disabled={busy || !canSubmit} aria-busy={busy}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
          {busy ? "Connecting…" : "Connect & sync"}
        </button>
        {tikTokNeedsAccount && !msg && (
          <span className="text-xs text-muted">Enter the advertiser_id to enable TikTok connect.</span>
        )}
        {msg && (
          <span className={`text-xs ${ok ? "text-green-600" : "text-red-600"}`} role="status" aria-live="polite">
            {msg}
            {upgrade && <a href="/billing" className="ml-1 font-semibold underline">Upgrade</a>}
            {tokenIssue && !ok && <a href="#token-help" className="ml-1 font-semibold underline">How to get a non-expiring token</a>}
          </span>
        )}
      </div>
      {ok && canAudit && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-teal/30 bg-teal/5 p-3">
          <span className="text-sm font-semibold text-ink">Connected — get your first Campaign Health Score now.</span>
          <RunFirstAudit />
        </div>
      )}
      <p className="mt-3 text-xs text-muted">Token is encrypted (AES-256-GCM) before storage and never sent back to the browser. Read-only — we never edit, pause, or create ads.</p>
    </div>
  );
}
