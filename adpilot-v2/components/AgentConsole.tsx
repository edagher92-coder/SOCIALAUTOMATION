"use client";
import { useState } from "react";

type PublicAgent = { id: string; name: string; emoji: string; domain: string };

export default function AgentConsole({ agents, enabled }: { agents: PublicAgent[]; enabled: boolean }) {
  const [activeId, setActiveId] = useState(agents[0]?.id ?? "");
  const [question, setQuestion] = useState("");
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const active = agents.find((a) => a.id === activeId);

  async function run() {
    setBusy(true); setErr(""); setText("");
    try {
      const r = await fetch("/api/agents/run", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: activeId, question: question.trim() || undefined }),
      });
      const j = await r.json();
      if (!r.ok) { setErr(j.error || "AI error"); return; }
      setText(j.text);
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((a) => {
          const sel = a.id === activeId;
          return (
            <button key={a.id} onClick={() => { setActiveId(a.id); setText(""); setErr(""); }}
              className={`rounded-2xl border p-4 text-left shadow-card transition hover:shadow-card-hover ${sel ? "border-brand ring-1 ring-brand/30 bg-brand-50" : "border-border-subtle bg-white"}`}>
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
        <textarea value={question} onChange={(e) => setQuestion(e.target.value)} disabled={!enabled}
          placeholder={`e.g. "What should I do about my CPA this week?" — leave blank for a full review`}
          className="h-24 w-full rounded-xl border border-border-subtle bg-surface p-3 text-sm disabled:opacity-60" />
        <div className="mt-2 flex items-center gap-3">
          <button onClick={run} disabled={!enabled || busy}
            className="rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">
            {busy ? "Thinking…" : `Ask ${active?.name?.split(" ")[0] ?? ""}`}
          </button>
          <span className="text-2xs text-muted">Grounded in your latest analysis · read-only · proposals only.</span>
        </div>
        {err && <p className="mt-3 text-sm text-band-red">{err}</p>}
        {text && <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-border-subtle bg-surface p-4 text-sm leading-relaxed text-ink">{text}</pre>}
      </div>
    </div>
  );
}
