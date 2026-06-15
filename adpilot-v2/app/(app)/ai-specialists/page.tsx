const AGENTS = [
  { n: "Command Centre", e: "🧭", d: "Routes your request to the right specialist and keeps everything safe." },
  { n: "Mira — Meta Ads", e: "🔵", d: "Audits Facebook/Instagram structure, audiences, creative, CPL/CPA/ROAS." },
  { n: "Travis — TikTok Ads", e: "⚫", d: "Creative-first TikTok strategy: hooks, hold rate, Spark Ads, fatigue." },
  { n: "Dana — Data Analyst", e: "📈", d: "Unifies data; break-even CPA/ROAS/MER; keep/kill/scale calls." },
  { n: "Stella — Creative", e: "🎨", d: "Hooks, ad copy, UGC briefs, scripts, creative matrices." },
  { n: "Titan — Offer & Funnel", e: "🎯", d: "Offer, landing page, qualification, CTA, trust, proof." },
  { n: "Milo — Automation", e: "⚙️", d: "No-code / low-code / API workflows (Make, Zapier, n8n)." },
  { n: "Atlas — Tracking", e: "🛰️", d: "Pixels, events, UTMs, offline conversions, attribution." },
  { n: "Riley — Reporting", e: "📝", d: "Plain-English daily / weekly / monthly client reports." },
  { n: "Paige — Policy & Safety", e: "🛡️", d: "Checks claims, prohibited wording, compliance risk." },
  { n: "Piper — Productisation", e: "📦", d: "Packages, pricing, sales copy, onboarding, white-label." },
  { n: "Quinn — QA", e: "✅", d: "Tests prompts, maths, routing, templates, readiness." },
];

export default function AiSpecialists() {
  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">AI Specialists</h1>
      <p className="mb-5 mt-1 text-muted">Your team of ad &amp; business agents. Each proposes — you approve. None edits a live ad.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AGENTS.map((a) => (
          <div key={a.n} className="rounded-2xl border border-[#e3e8ef] bg-white p-5 shadow-card">
            <div className="mb-2 text-2xl">{a.e}</div>
            <h3 className="font-bold">{a.n}</h3>
            <p className="mt-1 text-sm text-muted">{a.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
