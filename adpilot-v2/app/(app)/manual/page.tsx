import PrintButton from "@/components/PrintButton";
import PageHeader from "@/components/PageHeader";

function H({ id, children }: { id: string; children: React.ReactNode }) {
  return <h2 id={id} className="mt-8 border-b border-border-subtle pb-1 text-xl font-extrabold tracking-tight">{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) { return <p className="mt-2 text-[15px] leading-relaxed">{children}</p>; }
function UL({ items }: { items: React.ReactNode[] }) { return <ul className="mt-2 list-disc space-y-1 pl-6 text-[15px]">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>; }

export default function Manual() {
  return (
    <div className="mx-auto max-w-3xl animate-fade-in pb-16">
      <PageHeader
        eyebrow="Documentation"
        title="AdPilot OS — User Manual"
        subtitle="Version 6 · Meta & TikTok ads analytics & automation · read-only, safe by design."
        action={<PrintButton label="🖨 Download manual (PDF)" />}
      />

      <div className="rounded-2xl border border-border-subtle bg-surface-raised p-4 text-sm shadow-card print:hidden">
        <b>Contents:</b> Overview · Quick start · Connecting platforms (MCP vs API token) · Creative library ·
        Running an analysis · Reading the score · Recommendations &amp; safety · Reports &amp; PDF · Multi-client (agency) ·
        Notifications &amp; alerts · Settings · Prompting guide · Diagnostics · Error reference · Troubleshooting · FAQ ·
        Security &amp; privacy · Support &amp; error reporting.
      </div>

      <H id="overview">1. Overview</H>
      <P>AdPilot OS turns your Meta &amp; TikTok ad data into a <b>Campaign Health Score (0–100)</b>, plain-English findings, and
        safe, prioritised recommendations. It is <b>read-only</b>: it analyses and <b>proposes</b> — it never edits, pauses, or
        creates ads. Money/structure changes always require your explicit action in the ad platform.</P>

      <H id="quick-start">2. Quick start (5 minutes)</H>
      <UL items={[
        <>Sign in, then open <b>Ads Health</b>.</>,
        <>Either <b>connect</b> Meta/TikTok (Connect Accounts) <i>or</i> paste/upload a CSV export.</>,
        <>Set your <b>average sale value</b> and <b>gross margin</b> (Settings) — these define break-even.</>,
        <>Click <b>Analyse</b> → read the score, findings, and proposals.</>,
        <>Open <b>Saved Reports</b> → <b>Download branded PDF</b> for your client or boss.</>,
      ]} />
      <P>Toggle <b>Beginner / Advanced</b> (top-left) any time: Beginner is guided and plain-English; Advanced shows the full
        13-factor breakdown and extra controls.</P>

      <H id="connect">3. Connecting your platforms — MCP vs API token</H>
      <P>You can bring data three ways. Pick what suits you; you can mix them.</P>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead><tr className="text-left text-muted"><th className="border-b py-2 pr-3">Method</th><th className="border-b py-2 pr-3">Best for</th><th className="border-b py-2 pr-3">Benefits</th><th className="border-b py-2">Drawbacks</th></tr></thead>
          <tbody>
            <tr className="align-top"><td className="border-b py-2 pr-3"><b>CSV upload</b></td><td className="border-b py-2 pr-3">Anyone, instant</td><td className="border-b py-2 pr-3">No setup, no permissions, 100% private (browser/CSV)</td><td className="border-b py-2">Manual; a snapshot, not live</td></tr>
            <tr className="align-top"><td className="border-b py-2 pr-3"><b>API token (OAuth)</b></td><td className="border-b py-2 pr-3">Most users</td><td className="border-b py-2 pr-3">One-click connect, auto-sync, scheduled scoring &amp; alerts; least-privilege read-only scopes; token encrypted at rest</td><td className="border-b py-2">Needs a platform app (App ID/secret) configured once; tokens expire and need refresh</td></tr>
            <tr className="align-top"><td className="border-b py-2 pr-3"><b>MCP server</b></td><td className="border-b py-2 pr-3">Power users / Claude workflows</td><td className="border-b py-2 pr-3">Drive it from Claude/agents; flexible, scriptable; good for multi-tool automation</td><td className="border-b py-2">More moving parts; you run/host the MCP; less turnkey for non-technical users</td></tr>
          </tbody>
        </table>
      </div>
      <P><b>Recommended:</b> API token (OAuth) for day-to-day auto-sync; CSV as the always-available fallback; MCP if you already
        orchestrate via Claude. Step-by-step setup files for each are in the repo: <code>docs/SETUP-CONNECT-PLATFORMS.md</code>
        (Meta &amp; TikTok app creation, scopes, redirect URLs, and the exact env keys).</P>
      <P>To connect: <b>Connect Accounts → Connect Meta / TikTok</b>. Scopes are read-only (<code>ads_read,read_insights</code> /
        <code>ads.read</code>). After connecting, click <b>Sync now</b> (or let the daily cron do it).</P>

      <H id="creative">4. Creative library — link or upload audio / video / photo</H>
      <P>Bring creative from <b>any</b> AI tool or creator. Two ways:</P>
      <UL items={[
        <><b>Link (recommended, universal):</b> generate in your preferred tool (Midjourney, Sora, Runway, ElevenLabs, Canva, HeyGen…),
          copy the asset URL, and paste it in <b>Creative Library</b> with its type. Works with everything, no limits.</>,
        <><b>Upload your own:</b> drag an image/video/audio file in — it's stored in your private library.</>,
      ]} />
      <P>AdPilot then organises assets, links them to campaigns, and feeds them into briefs (Canva Creator). You make the content;
        AdPilot does the rest around it.</P>

      <H id="analyse">5. Running an analysis</H>
      <UL items={[
        <>On <b>Ads Health</b>, pick a sample or paste/upload a CSV (Meta or TikTok export, or the universal format — columns auto-map).</>,
        <>Confirm average sale value &amp; margin, then <b>Analyse</b>.</>,
        <>Connected accounts: use <b>Sync now</b> on Connect, then analyse the synced data.</>,
      ]} />

      <H id="score">6. Reading the Health Score</H>
      <P>0–100, banded <b>Green (80+)</b>, <b>Yellow (60–79)</b>, <b>Orange (40–59)</b>, <b>Red (&lt;40)</b>. It's a weighted average
        of 13 factors (tracking, CPA vs break-even, CTR, creative fatigue, conversion rate, lead quality, and more). In Advanced
        mode, open <b>“Why this score?”</b> to see each factor's score, weight, and points. <b>Data confidence</b> tells you how much
        to trust the result on thin data.</P>

      <H id="recommendations">7. Recommendations &amp; the safety model</H>
      <P>Each ad gets one verdict: <b>keep / kill / scale / reduce / refresh / fix-tracking / insufficient-data</b> — always as a
        <b> proposal</b>. The system never changes your account. Scaling is only suggested when health ≥70 and tracking is clean;
        budget moves require your explicit confirmation in the platform.</P>

      <H id="reports">8. Reports &amp; one-click PDF</H>
      <P>Every analysis is saved under <b>Saved Reports</b>. Open one and click <b>Download branded PDF</b> — it prints a clean,
        client-ready report with your agency branding (set in White-label). Tip: in the print dialog choose “Save as PDF”.</P>

      <H id="agency">9. Multi-client (agency) switching</H>
      <P>Use the <b>Client</b> selector (top-left) to switch workspaces, or <b>➕ Add client…</b> to create one. Each client is fully
        isolated (data, connections, reports, branding). Everything you do applies to the active client.</P>

      <H id="alerts">10. Notifications &amp; alerts</H>
      <P>In <b>Notifications</b>, set your email and enable the <b>weekly digest</b> and <b>critical alerts</b> (CPA blowouts, broken
        tracking, fatigue, Red health). A scheduled job scores connected accounts and emails breaches. Use <b>Send test email</b> to verify.</P>

      <H id="settings">11. Settings</H>
      <P>Set the active client's <b>average sale value</b> and <b>gross margin</b>. These define break-even CPA (= sale × margin) and
        break-even ROAS (= 1 ÷ margin), which drive scoring and alerts.</P>

      <H id="prompting">12. Prompting guide (AI tools: Canva / Bobby / Aria)</H>
      <P>Connect a Claude key (Claude API page) to enable live AI. Get better output by being specific:</P>
      <UL items={[
        <><b>Canva Creator:</b> give product, exact audience, the offer, and platform. Specify tone and any compliance limits (no guarantees).</>,
        <><b>Bobby (business):</b> describe your business in one line and ask a concrete question (“how do I get more repeat customers?”).</>,
        <><b>Aria (courses):</b> give the topic, who it's for, and the outcome they want.</>,
        <>Always review AI output before use. It assists; you decide.</>,
      ]} />

      <H id="diagnostics">13. Diagnostics &amp; health checks</H>
      <UL items={[
        <>App liveness: visit <code>/api/health</code> (returns status &amp; version) — or your host's status page.</>,
        <>Engine integrity: the build runs the engine self-test (parity with the Python engine) on every deploy.</>,
        <>Data issues: if a score looks wrong, open “Why this score?”, check <b>Data confidence</b>, and verify your CSV columns.</>,
        <>Connection issues: re-check on <b>Connect Accounts</b>; reconnect if a token expired.</>,
      ]} />

      <H id="errors">14. Error reference</H>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead><tr className="text-left text-muted"><th className="border-b py-2 pr-3">You see</th><th className="border-b py-2 pr-3">Means</th><th className="border-b py-2">Do this</th></tr></thead>
          <tbody>
            {[["“No rows parsed — check the headers”", "CSV columns weren't recognised", "Export at ad level; keep the header row; or use the universal template"],
              ["“AI generation isn't configured”", "No Claude key on the server", "Add ANTHROPIC_API_KEY (Claude API page explains)"],
              ["“Billing isn't configured”", "No Stripe keys set", "Add STRIPE_SECRET_KEY + price IDs"],
              ["“No connected {platform} account”", "Not connected / token missing", "Connect Accounts → Connect, then Sync now"],
              ["“{platform}_not_configured” on connect", "Platform App ID/secret missing", "Set META_/TIKTOK_ APP_ID & SECRET on the server"],
              ["“Upload needs Supabase Storage configured”", "Storage bucket not set up", "Run migration 0003, or paste an asset link instead"],
              ["401 / redirected to login", "Session expired", "Sign in again"],
              ["Sync “502 … API error”", "Platform API rejected the call", "Token may be expired or rate-limited — reconnect / retry later"],
            ].map((r, i) => <tr key={i} className="align-top"><td className="border-b py-2 pr-3">{r[0]}</td><td className="border-b py-2 pr-3">{r[1]}</td><td className="border-b py-2">{r[2]}</td></tr>)}
          </tbody>
        </table>
      </div>

      <H id="troubleshoot">15. Troubleshooting</H>
      <UL items={[
        <>Nothing happens on Analyse → check the CSV isn't empty and headers match; try a sample.</>,
        <>Score seems too low/high → confirm sale value &amp; margin in Settings; check data confidence.</>,
        <>Can't see a client's data → check the <b>Client</b> selector is on the right workspace.</>,
        <>PDF looks wrong → use the browser's print dialog, A4/Letter, “Save as PDF”, background graphics on.</>,
      ]} />

      <H id="faq">16. FAQ</H>
      <UL items={[
        <><b>Does it change my ads?</b> No — read-only, proposals only.</>,
        <><b>Is my data private?</b> CSV analysis runs in your browser; connected data is org-isolated (RLS); tokens are encrypted.</>,
        <><b>Meta &amp; TikTok together?</b> Yes — one schema, one score, plus per-platform splits.</>,
        <><b>Do I need to code?</b> No. Connect or upload, then read the report.</>,
      ]} />

      <H id="security">17. Security &amp; privacy</H>
      <UL items={[
        <>Read-only scopes; no write access to your ad accounts.</>,
        <>OAuth tokens encrypted at rest (AES-256-GCM); never sent to the browser.</>,
        <>Row-level security isolates every client's data.</>,
        <>Secrets (AI/Stripe/platform) live server-side only.</>,
        <>No earnings or results guarantees; figures can be illustrative.</>,
      ]} />

      <H id="support">18. Support &amp; error reporting</H>
      <P>To report a problem, include: what you did, what you expected, what happened, the exact error text, the client/workspace,
        and (if relevant) a sample of the CSV columns. Email your support contact (set in White-label / env <code>SUPPORT_EMAIL</code>).
        For developers: check the host logs (Vercel) and Supabase logs; the build's self-test confirms engine integrity.</P>

      <p className="mt-10 text-xs text-muted">© AdPilot OS. This manual is also maintained as <code>docs/USER-MANUAL.md</code> in the repository.</p>
    </div>
  );
}
