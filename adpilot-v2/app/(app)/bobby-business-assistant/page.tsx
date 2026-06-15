"use client";
import { useState } from "react";

const PLAYBOOKS: Record<string, string[]> = {
  "Get more leads": [
    "Pick ONE offer and one audience — stop splitting focus.",
    "Make the offer specific and time-bound (e.g. '$0 quote this week').",
    "Run the Ads Health Check; kill anything above 1.5× break-even CPA.",
    "Reply to every enquiry within 5 minutes (speed beats polish).",
  ],
  "Fix cashflow": [
    "Set aside GST/BAS the day money lands — separate account.",
    "Invoice on completion, not month-end; deposits on jobs > $500.",
    "Chase debtors weekly; oldest first.",
    "Know your break-even: average sale × gross margin = max cost per sale.",
  ],
  "Raise prices": [
    "Anchor to value/outcome, not hours.",
    "Raise 10–15% on new quotes first; measure win-rate.",
    "Add a clear 'why us' (proof, speed, guarantee that's compliant).",
    "Defend the price — discounting signals doubt.",
  ],
  "Win back time": [
    "List your 5 most-repeated tasks; template or automate the top 2.",
    "Use the AI Specialists for audits & reports instead of doing them manually.",
    "Batch admin into one block; protect mornings for sales.",
  ],
};

export default function Bobby() {
  const [topic, setTopic] = useState<keyof typeof PLAYBOOKS>("Get more leads");
  const [q, setQ] = useState("");
  const prompt = `You are Bobby, a plain-English Australian business advisor (Andrew Griffiths style: direct, numbers-first, no jargon). My business: [describe]. My question: ${q || "[your question]"}. Give me 3 practical moves I can do this week, the one number to watch, and what to avoid.`;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-extrabold tracking-tight">Bobby — Business Assistant</h1>
      <p className="mb-5 mt-1 text-muted">Plain-English, numbers-first help for small business owners. Pick a playbook, or build a question to run with AI.</p>

      <div className="rounded-2xl border border-[#e3e8ef] bg-white p-5 shadow-card">
        <div className="flex flex-wrap gap-2">
          {Object.keys(PLAYBOOKS).map((k) => (
            <button key={k} onClick={() => setTopic(k as any)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${topic === k ? "bg-brand text-white" : "border border-brand text-brand"}`}>{k}</button>
          ))}
        </div>
        <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm">{PLAYBOOKS[topic].map((x, i) => <li key={i}>{x}</li>)}</ul>
      </div>

      <div className="mt-5 rounded-2xl border border-[#e3e8ef] bg-white p-5 shadow-card">
        <h3 className="font-bold">Ask Bobby anything</h3>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. How do I get more repeat customers?"
          className="mt-2 w-full rounded-lg border border-[#e3e8ef] p-2.5" />
        <p className="mt-3 text-xs font-bold text-muted">Copy-paste prompt (use in Claude, or connect the Claude API to run it here):</p>
        <pre className="mt-1 whitespace-pre-wrap rounded-lg bg-[#f4f7fb] p-3 text-xs">{prompt}</pre>
      </div>
    </div>
  );
}
