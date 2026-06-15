"use client";
import { useState } from "react";

type PublicAgent = { id: string; name: string; emoji: string; domain: string };

export default function AgentConsole({ agents, enabled }: { agents: PublicAgent[]; enabled: boolean }) {
  const [activeId, setActiveId] = useState(agents[0]?.id ?? "");
  const [question, setQuestion] = useState("");
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [errCode, setErrCode] = useState("");
  const [busy, setBusy] = useState(false);
  const active = agents.find((a) => a.id === activeId);

  function select(id: string) {
    if (busy) return;
    setActiveId(id); setText(""); setErr(""); setErrCode("");
  }

  async function run() {
    if (!enabled || busy || !activeId) return;
    setBusy(true); setErr(""); setErrCode(""); setText("");
    try {
      const r = await fetch("/api/agents/run", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: activeId, question: question.trim() || undefined }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErrCode(typeof j?.code === "string" ? j.code : "");
        setErr(j?.error || `The specialist couldn't respond (error ${r.status}). Please try again.`);
        return;
      }
      const answer = typeof j?.text === "string" ? j.text.trim() : "";
      if (!answer) { setErr("The specialist returned an empty answer. Please try again."); return; }
      setText(answer);
    } catch {
      setErr("Couldn't reach the specialist. Check your connection and try again.");
    } finally { setBusy(false); }
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((a) => {
          const sel = a.id === activeId;
          return (
            <button key={a.id} type="button" onClick={() => select(a.id)} disabled={busy} aria-pressed={sel}
              className={`rounded-2xl border p-4 text-left shadow-card transition hover:shadow-card-hover disabled:cursor-not-allowed disabled:opacity-60 ${sel ? "border-brand ring-1 ring-brand/30 bg-brand-50" : "border-border-subtle bg-white"}`}>
              <div className="mb-1 text-2xl">{a.emoji}</div>
              <h3 className="font-bold text-ink">{a.name}</h3>
              <p className="mt-1 text-sm text-muted">{a.domain}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-5 rounded-2xl border border-border-subtle bg-white p-5 shadow-card">
        <div className="mb-2 text-sm font-bold text-ink">Ask {active?.name ?? "a specialist"}</div>
        {!enabled && (
          <div className="mb-3 rounded-xl bg-brand-50 p-3 text-sm text-muted">
            🔒 The AI team is a <b>Pro &amp; Expert</b> feature. <a className="font-semibold text-brand" href="/billing">Upgrade</a> to ask grounded questions about your account.
          </div>
        )}
        <textarea value={question} onChange={(e) => setQuestion(e.target.value)} disabled={!enabled || busy}
          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); run(); } }}
          placeholder={`e.g. "What should I do about my CPA this week?" — leave blank for a full review`}
          className="h-24 w-full rounded-xl border border-border-subtle bg-surface p-3 text-sm disabled:opacity-60" />
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button type="button" onClick={run} disabled={!enabled || busy || !activeId}
            className="rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">
            {busy ? "Thinking…" : `Ask ${active?.name?.split(" ")[0] ?? "a specialist"}`}
          </button>
          <span className="text-2xs text-muted">Grounded in your latest analysis · read-only · proposals only.</span>
        </div>
        {err && (
          <div className="mt-3 rounded-xl border border-band-red/30 bg-band-red/5 p-3 text-sm text-band-red" role="alert">
            <p>{err}</p>
            {errCode === "NO_KEY" && (
              <p className="mt-1 text-2xs text-muted">An administrator needs to add <code>ANTHROPIC_API_KEY</code> on the server.</p>
            )}
          </div>
        )}
        {busy && !text && !err && (
          <p className="mt-4 text-sm text-muted" aria-live="polite">{active?.name?.split(" ")[0] ?? "The specialist"} is reviewing your latest numbers…</p>
        )}
        {text && <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-border-subtle bg-surface p-4 text-sm leading-relaxed text-ink">{text}</pre>}
      </div>
    </div>
  );
}
