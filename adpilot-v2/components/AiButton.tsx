"use client";
import { useState } from "react";

export default function AiButton({ task, getInputs, label = "✨ Write with AI" }:
  { task: "canva" | "bobby" | "aria"; getInputs: () => Record<string, string>; label?: string }) {
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true); setErr(""); setText("");
    try {
      const r = await fetch("/api/ai/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, inputs: getInputs() }),
      });
      const j = await r.json();
      if (!r.ok) { setErr(j.error || "AI error"); return; }
      setText(j.text);
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }

  return (
    <div className="mt-3">
      <button onClick={go} disabled={busy}
        className="rounded-lg border border-brand px-4 py-2 text-sm font-bold text-brand disabled:opacity-50">
        {busy ? "Writing…" : label}
      </button>
      {err && <p className="mt-2 text-sm text-band-red">{err} <span className="text-muted">(the template above still works.)</span></p>}
      {text && <pre className="mt-3 whitespace-pre-wrap rounded-lg border border-[#e3e8ef] bg-white p-3 text-sm shadow-card">{text}</pre>}
    </div>
  );
}
