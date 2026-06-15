import PageHeader from "@/components/PageHeader";

const SPECS = [
  { n: "Google Sheets", e: "🟩", d: "Fastest start. Paste exports, formulas compute metrics + health score.", best: "Beginners / DIY" },
  { n: "Looker Studio", e: "📊", d: "Shareable visual report. Connect Sheets/BigQuery; Meta vs TikTok pages.", best: "Client reporting" },
  { n: "Airtable", e: "🗂️", d: "Structured base: campaigns, daily metrics, creatives, leads, reports.", best: "Operators" },
  { n: "Notion", e: "📓", d: "No-code workspace: clients, daily log, creative tests, reports.", best: "Solo / simple" },
  { n: "Agency (white-label)", e: "🏢", d: "Multi-client switcher, branded reports, portfolio roll-up.", best: "Agencies" },
];

export default function BuildDashboard() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Setup"
        title="Build a Dashboard"
        subtitle="Pick a platform and follow the spec — or just use the built-in Ads Health Check."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SPECS.map((s) => (
          <div key={s.n} className="rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-card transition hover:border-brand hover:shadow-card-hover">
            <div className="mb-2 text-2xl">{s.e}</div>
            <h3 className="font-bold text-ink">{s.n}</h3>
            <p className="mt-1 text-sm text-muted">{s.d}</p>
            <p className="mt-2 text-xs font-semibold text-brand">Best for: {s.best}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-card">
        <h3 className="font-bold text-ink">3-step quick start</h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted">
          <li>Export at <b>ad level</b>, daily, from Meta &amp; TikTok Ads Manager.</li>
          <li>Map columns to the universal schema (auto-detected in the Ads Health Check).</li>
          <li>Run the analysis → save / export the report for your client or boss.</li>
        </ol>
        <p className="mt-3 text-xs text-muted">Full build specs ship in the package under <code>dashboards/</code>.</p>
      </div>
    </div>
  );
}
