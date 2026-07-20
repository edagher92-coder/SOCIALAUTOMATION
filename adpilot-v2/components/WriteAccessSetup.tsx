"use client";

import { useState } from "react";

const ACKNOWLEDGEMENT = "ENABLE META AD WRITE ACCESS";

export default function WriteAccessSetup({ executionEnabled }: { executionEnabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState("");
  const [accountId, setAccountId] = useState("");
  const [acknowledge, setAcknowledge] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function attach() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/connect/write-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, accountId: accountId.trim() || undefined, acknowledge }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) { setMessage(body.error || "Could not attach the write credential."); return; }
      setToken(""); setAcknowledge(""); setOpen(false);
      setMessage(`Write credential attached for ${body.accountCount} assigned account(s).`);
    } catch (error: any) { setMessage(error?.message || "Network error."); }
    finally { setBusy(false); }
  }

  return (
    <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-bold text-ink">Execution controls</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">Only owners and admins can attach a Meta write credential or approve an action. Every action still needs its own exact typed approval and is recorded for audit.</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${executionEnabled ? "bg-band-green/10 text-band-green" : "bg-amber-100 text-amber-900"}`}>
          {executionEnabled ? "Execution control on" : "Execution control off"}
        </span>
      </div>
      {!executionEnabled && <p className="mt-3 rounded-lg border border-amber-200 bg-white/70 p-3 text-xs text-amber-900">The deployment kill switch is off, so no action can reach Meta even if it is approved. A production operator must set both the execution control and explicit budget limits before enabling it.</p>}
      <button type="button" onClick={() => setOpen(!open)} className="mt-3 rounded-lg border border-amber-400 bg-white px-3 py-2 text-sm font-bold text-ink">
        {open ? "Close write credential setup" : "Attach Meta write credential"}
      </button>
      {open && (
        <div className="mt-3 grid gap-3 rounded-xl border border-amber-200 bg-white p-4">
          <p className="text-sm text-muted">Use a dedicated Meta System User credential with <code>ads_management</code>. Do not reuse a personal login token.</p>
          <label className="text-sm font-semibold">Meta ad account ID <span className="font-normal text-muted">(optional; numeric)</span>
            <input value={accountId} onChange={(e) => setAccountId(e.target.value)} placeholder="1234567890" className="mt-1 w-full rounded-lg border border-border-subtle p-2.5 font-normal" />
          </label>
          <label className="text-sm font-semibold">Meta write token
            <input type="password" value={token} onChange={(e) => setToken(e.target.value)} autoComplete="off" placeholder="Paste dedicated System User token" className="mt-1 w-full rounded-lg border border-border-subtle p-2.5 font-mono font-normal" />
          </label>
          <label className="text-sm font-semibold">Type <code>{ACKNOWLEDGEMENT}</code> to confirm
            <input value={acknowledge} onChange={(e) => setAcknowledge(e.target.value)} className="mt-1 w-full rounded-lg border border-border-subtle p-2.5 font-normal" />
          </label>
          <button type="button" onClick={attach} disabled={busy || token.trim().length < 10 || acknowledge !== ACKNOWLEDGEMENT} className="w-fit rounded-lg bg-amber-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
            {busy ? "Checking credential…" : "Securely attach write credential"}
          </button>
        </div>
      )}
      {message && <p className="mt-3 text-sm" role="status">{message}</p>}
    </section>
  );
}
