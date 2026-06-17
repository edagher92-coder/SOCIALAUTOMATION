"use client";
import { useState } from "react";

// One-click "Run my first audit": pulls fresh numbers from every connected platform and
// produces the first Campaign Health Score in a single step. It calls /api/audit/run, which
// reuses the SAME shared puller + scoring path as the scheduled crons — no engine logic here.
//
// READ-ONLY: this only reads insights and scores them. It never edits, pauses, or creates an ad.
const BAND_CLASS: Record<string, string> = {
  Green: "text-band-green",
  Yellow: "text-band-yellow",
  Orange: "text-band-orange",
  Red: "text-band-red",
};

export default function RunFirstAudit({ label = "Run my first audit", className = "" }: { label?: string; className?: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const [done, setDone] = useState(false);
  const [band, setBand] = useState<string | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [upgrade, setUpgrade] = useState(false);
  const [tokenIssue, setTokenIssue] = useState(false);

  async function go() {
    setBusy(true); setMsg(""); setOk(false); setUpgrade(false); setTokenIssue(false);
    try {
      const r = await fetch("/api/audit/run", { method: "POST" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setUpgrade(Boolean(j.upgrade));
        const e = j.error || `Audit failed (HTTP ${r.status})`;
        setTokenIssue(/access token|expired|revoked|invalid|oauth|reconnect|\b190\b|\b401\b|\b403\b/i.test(e));
        setMsg(e);
        return;
      }
      setOk(true);
      setDone(true);
      setBand(j.band ?? null);
      setTotal(j.total ?? null);
      if (j.scored && j.total != null) {
        setMsg(`Audit complete — your Campaign Health Score is ${Math.round(j.total)}/100 (${j.band}).`);
      } else {
        // Data pulled but no score (e.g. zero rows in the window). Still a success, no error styling.
        setMsg(`Pulled ${j.rows ?? 0} row${j.rows === 1 ? "" : "s"}. No scoreable data in the last 14 days yet — it'll score on the next sync.`);
      }
    } catch (e: any) {
      setMsg(e?.message || "Network error — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className={`inline-flex flex-col items-end gap-1 text-right ${className}`}>
      {done && ok && total != null ? (
        <a href="/command" className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white">
          View your score{band ? <span className={`ml-1 ${BAND_CLASS[band] ?? ""}`}>· {Math.round(total)}/100</span> : null} →
        </a>
      ) : (
        <button onClick={go} disabled={busy} aria-busy={busy}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
          {busy ? "Auditing your account…" : label}
        </button>
      )}
      {msg && (
        <span className={`text-xs ${ok ? "text-green-600" : "text-red-600"}`} role="status" aria-live="polite">
          {msg}
          {upgrade && <a href="/billing" className="ml-1 font-semibold underline">Upgrade</a>}
        </span>
      )}
      {tokenIssue && !ok && (
        <a href="#token-help" className="text-xs font-semibold text-brand underline">🔑 Token expired — how to get a non-expiring token</a>
      )}
    </span>
  );
}
