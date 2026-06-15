"use client";
import { useState } from "react";

export default function Aria() {
  const [topic, setTopic] = useState("Slush machine maintenance for cafés");
  const [audience, setAudience] = useState("café & venue owners");
  const [outcome, setOutcome] = useState("keep machines running through summer with zero breakdowns");
  const [out, setOut] = useState<null | { promise: string; modules: { t: string; lessons: string[] }[]; magnet: string }>(null);

  function build() {
    const t = topic.trim(), a = audience.trim(), o = outcome.trim();
    setOut({
      promise: `A practical course that helps ${a} ${o} — without hiring a specialist.`,
      modules: [
        { t: "1. Foundations", lessons: [`Why ${t.toLowerCase()} matters (the cost of getting it wrong)`, "Quick wins you can do today", "Tools & safety basics"] },
        { t: "2. The core method", lessons: ["Step-by-step walkthrough", "The weekly routine", "Common mistakes & how to avoid them"] },
        { t: "3. Troubleshooting", lessons: ["Diagnose the 5 most common problems", "When to DIY vs call a pro", "Checklists & templates"] },
        { t: "4. Make it stick", lessons: ["Build your maintenance calendar", `Measuring results toward: ${o}`, "Next steps & resources"] },
      ],
      magnet: `Lead magnet: "The 1-page ${t} checklist" — collect emails, then offer the full course.`,
    });
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-extrabold tracking-tight">Aria — Course Creator</h1>
      <p className="mb-5 mt-1 text-muted">Turn your expertise into a sellable course outline — promise, modules, lessons, and a lead magnet.</p>

      <div className="rounded-2xl border border-[#e3e8ef] bg-white p-5 shadow-card">
        <div className="grid gap-3">
          <L label="Topic / expertise" v={topic} set={setTopic} />
          <L label="Who it's for" v={audience} set={setAudience} />
          <L label="Outcome they want" v={outcome} set={setOutcome} />
        </div>
        <button onClick={build} className="mt-4 rounded-lg bg-brand px-5 py-2.5 font-bold text-white">Generate outline</button>
      </div>

      {out && (
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-[#e3e8ef] bg-white p-5 shadow-card">
            <h3 className="mb-1 font-bold">Course promise</h3><p className="text-sm">{out.promise}</p>
          </div>
          {out.modules.map((m) => (
            <div key={m.t} className="rounded-2xl border border-[#e3e8ef] bg-white p-5 shadow-card">
              <h3 className="mb-2 font-bold">{m.t}</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm">{m.lessons.map((l, i) => <li key={i}>{l}</li>)}</ul>
            </div>
          ))}
          <div className="rounded-2xl border border-[#e3e8ef] bg-[#f4f7fb] p-5"><p className="text-sm font-semibold">{out.magnet}</p></div>
          <p className="text-xs text-muted">Connect the Claude API (sidebar) to expand each lesson into full scripts and slides.</p>
        </div>
      )}
    </div>
  );
}
function L({ label, v, set }: { label: string; v: string; set: (s: string) => void }) {
  return (<div><label className="mb-1 block text-sm font-bold">{label}</label>
    <input value={v} onChange={(e) => set(e.target.value)} className="w-full rounded-lg border border-[#e3e8ef] p-2.5" /></div>);
}
