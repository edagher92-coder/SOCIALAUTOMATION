import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How AdPilot OS Works — Read-only AI Ads Audit",
  description:
    "A 0–100 Campaign Health Score, 13 weighted factors, Wilson significance testing and 12 AI specialists. " +
    "AdPilot OS reads your Meta and TikTok ad data and proposes safe, numbers-first fixes — it never touches a live ad.",
};

// ── Data ─────────────────────────────────────────────────────────────────────

const PAINS = [
  {
    label: "Media buyers",
    headline: "You're staring at dashboards that don't tell you what to do next.",
    body: "CPM is up 40%. Click-through dropped. Three campaigns are spending but none are scaling. You know something is wrong — you just can't pin down which lever to pull first.",
  },
  {
    label: "Agency AMs",
    headline: "Client meetings eat the time you'd need to actually fix the account.",
    body: "You're writing status updates, not fixing budget leaks. Every campaign review is manual. And you still can't explain to the client in one number whether their account is healthy.",
  },
  {
    label: "SMB founders",
    headline: "You're paying an agency or running it yourself — and still can't tell if it's working.",
    body: "You have a rough ROAS number and a gut feel. But 'looks okay' isn't a strategy. Without a structured audit you're guessing at five-figure monthly spend.",
  },
];

const SCORE_FACTORS = [
  ["Spend pacing", "Is budget being delivered evenly or spiking at the end of the period?"],
  ["CPM trend", "Are impression costs rising week-on-week versus your account baseline?"],
  ["Click-through rate", "Is creative fatigue dragging CTR below the floor for your objective?"],
  ["Conversion rate", "Are clicks actually converting, or is the landing experience leaking?"],
  ["Cost per result", "Is CPA or CPL trending toward or past your break-even point?"],
  ["Lead quality loop", "Are inbound leads converting downstream, or is Meta optimising for the wrong signal?"],
  ["Frequency", "Are you showing the same creative to the same people too often?"],
  ["Wilson significance", "Is there enough data to trust a verdict — or is the signal too thin?"],
  ["Budget efficiency", "Are impressions concentrating on a narrow audience, reducing reach per dollar?"],
  ["Creative fatigue index", "How fast is performance decaying relative to ad age and frequency?"],
  ["Audience overlap", "Are your ad sets competing with each other for the same eyeballs?"],
  ["Objective alignment", "Does the campaign objective match how you're actually measuring success?"],
  ["Tracking integrity", "Are conversions being counted, or are pixel gaps hiding real performance?"],
];

const FEATURES = [
  {
    eyebrow: "Campaign Health Score",
    headline: "One number that tells you where you stand.",
    body: "The 0–100 Health Score aggregates 13 weighted factors into a single verdict — Green (≥80), Yellow (≥60), Orange (≥40) or Red. Not a vanity metric: each factor has a threshold, a weighting and an explanation you can read to a client.",
    detail: "Free on CSV import. Live Meta / TikTok data on Pro and above.",
  },
  {
    eyebrow: "Wilson Significance Gate",
    headline: "Proposals backed by a statistics check, not a gut feel.",
    body: "Before AdPilot OS suggests scaling or killing an ad, it runs a Wilson confidence interval test. If the sample is too thin to trust the signal, the verdict says so instead of guessing. You don't act on noise.",
    detail: "Available on all plans. Part of every audit output.",
  },
  {
    eyebrow: "Fatigue & Pacing Diagnostics",
    headline: "Know when creative is dying and when spend is drifting.",
    body: "Fatigue detection tracks CTR decay relative to ad age and frequency. Pacing checks whether your budget is being delivered as intended or bunching. Both are surfaced as findings with plain-English explanations.",
    detail: "Included in the health audit on all plans.",
  },
  {
    eyebrow: "12 AI Specialists",
    headline: "Ask a specialist, not a chatbot.",
    body: "The AI layer is a team: a strategist, a creative director, a data analyst, a copywriter and eight more specialists — each grounded in your actual account data. No hallucinated benchmarks. No generic advice. Every response is anchored to what the engine found.",
    detail: "AI team available on Pro and Expert.",
  },
  {
    eyebrow: "Read-only by design",
    headline: "It proposes. You approve. Nothing changes without a typed YES.",
    body: "AdPilot OS never edits, pauses, creates or spends on a live ad without an explicit typed confirmation — and even then only on Expert with ADS_WRITE_ENABLED active. The product is a decision-support system, not an autopilot.",
    detail: "Safe by architecture, not just policy.",
  },
];

type TierRow = {
  id: string;
  label: string;
  price: string;
  annual: string;
  blurb: string;
  includes: string[];
  cta: string;
  ctaHref: string;
  highlight?: boolean;
};

const TIERS: TierRow[] = [
  {
    id: "free",
    label: "Free",
    price: "Free",
    annual: "",
    blurb: "Paste a CSV export, get a full Health Score. No card required.",
    includes: ["CSV import", "13-factor Health Score", "Per-ad verdicts", "Basic email alerts"],
    cta: "Start free",
    ctaHref: "/login",
  },
  {
    id: "starter",
    label: "Starter",
    price: "$49/mo AUD",
    annual: "or $490/yr — save ~17%",
    blurb: "Saved reports, content scheduling and configurable threshold alerts.",
    includes: ["Everything in Free", "Saved audit reports", "Content publishing", "Threshold alert rules"],
    cta: "See Starter",
    ctaHref: "/billing",
  },
  {
    id: "pro",
    label: "Pro",
    price: "$149/mo AUD",
    annual: "or $1,490/yr — save ~17%",
    blurb: "Live API connect, automated sync, the AI specialist team and multi-client management.",
    includes: [
      "Everything in Starter",
      "Meta & TikTok API connect",
      "Automated account sync",
      "12 AI specialists",
      "AI Creative Studio",
      "Multi-client workspace",
      "Lead quality loop",
    ],
    cta: "See Pro",
    ctaHref: "/billing",
    highlight: true,
  },
  {
    id: "expert",
    label: "Expert",
    price: "$399/mo AUD",
    annual: "or $3,990/yr — save ~17%",
    blurb: "White-label, Messenger automation, expert plugins and guarded ad actions.",
    includes: [
      "Everything in Pro",
      "White-label reports",
      "Messenger automation",
      "Expert plugins",
      "Guarded ad actions (write-gated)",
    ],
    cta: "See Expert",
    ctaHref: "/billing",
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-surface antialiased">

      {/* ── Nav ──────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-border-subtle bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-5">
          <Link href="/" className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-ink">
            <span className="inline-block h-7 w-7 rounded-xl bg-gradient-to-br from-brand to-teal shadow-sm" aria-hidden />
            AdPilot OS
          </Link>
          <div className="ml-auto flex items-center gap-3 text-sm font-semibold">
            <Link href="/#pricing" className="hidden text-muted transition hover:text-ink sm:inline">Pricing</Link>
            <Link href="/login"
              className="rounded-lg border border-brand-200 px-3.5 py-2 text-brand transition hover:border-brand hover:bg-brand-50 focus-visible:shadow-ring-brand">
              Sign in
            </Link>
            <Link href="/login"
              className="rounded-lg bg-brand px-3.5 py-2 text-white shadow-sm transition hover:bg-brand-600 focus-visible:shadow-ring-brand">
              Run free audit
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden border-b border-border-subtle bg-gradient-to-b from-white via-white to-surface px-5 py-16 sm:py-24">
        <div aria-hidden className="pointer-events-none absolute -top-28 left-1/2 h-[420px] w-[640px] -translate-x-1/2 rounded-full bg-brand-50 opacity-50 blur-3xl" />
        <div className="relative mx-auto max-w-2xl text-center">
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-sm font-semibold text-brand">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
            Read-only AI ads OS — proposes, never edits
          </span>
          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-5xl">
            A 13-factor health audit for every campaign.{" "}
            <span className="bg-gradient-to-r from-brand to-teal bg-clip-text text-transparent">
              Numbers first, always.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted">
            AdPilot OS reads your Meta and TikTok ad data, scores a 0–100 Campaign Health Score,
            and proposes safe fixes — grounded in statistics, explained in plain English.
            It never touches a live ad without your typed approval.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/login"
              className="rounded-xl bg-brand px-6 py-3.5 text-base font-bold text-white shadow-glow transition hover:bg-brand-600 focus-visible:shadow-ring-brand">
              Run your free audit →
            </Link>
            <Link href="#how-it-works"
              className="rounded-xl border border-border-subtle bg-surface-raised px-6 py-3.5 text-base font-bold text-ink shadow-sm transition hover:border-brand hover:text-brand focus-visible:shadow-ring-brand">
              See how it works
            </Link>
          </div>
          <p className="mt-5 text-sm text-muted">Free on CSV · no card required · read-only by design</p>
        </div>
      </header>

      {/* ── Pain ─────────────────────────────────────────────────── */}
      <section className="border-b border-border-subtle bg-surface-raised px-5 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <span className="text-sm font-bold uppercase tracking-widest text-brand">The problem</span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">
              Dashboards show you the numbers. Not what to do about them.
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {PAINS.map((p) => (
              <div key={p.label} className="rounded-2xl border border-border-subtle bg-surface p-6 shadow-card">
                <span className="mb-3 inline-block rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand">
                  {p.label}
                </span>
                <h3 className="font-bold leading-snug text-ink">{p.headline}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section id="how-it-works" className="border-b border-border-subtle bg-surface px-5 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <span className="text-sm font-bold uppercase tracking-widest text-brand">The engine</span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">
              How the 0–100 Campaign Health Score works
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-muted">
              The score aggregates 13 weighted factors. Each factor has a threshold and a weighting —
              so a 63/100 (Yellow) tells you the account is functional but leaking, and the findings
              tell you exactly where. Score bands: Green ≥80 · Yellow ≥60 · Orange ≥40 · Red below.
            </p>
          </div>

          {/* Step callouts */}
          <div className="mb-10 grid gap-4 sm:grid-cols-3">
            {([
              ["1. Connect or paste", "Link your Meta or TikTok account via API (Pro+), or paste a CSV export from Ads Manager. No scraping — read permission only."],
              ["2. Engine audits", "13 factors are scored against thresholds. A Wilson significance gate checks whether the data volume is sufficient before issuing a verdict."],
              ["3. Proposals, not actions", "You receive a ranked list of findings and safe fixes. You review, approve, and execute changes in-platform yourself. Nothing happens automatically."],
            ] as [string, string][]).map(([title, body]) => (
              <div key={title} className="rounded-2xl border border-brand-200 bg-brand-50/40 p-5">
                <h3 className="font-bold text-ink">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
              </div>
            ))}
          </div>

          {/* Factor table */}
          <div className="overflow-x-auto rounded-2xl border border-border-subtle bg-surface-raised shadow-card">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-surface/60">
                  <th className="p-3 text-left text-xs font-bold uppercase tracking-wide text-muted">Factor</th>
                  <th className="p-3 text-left text-xs font-bold uppercase tracking-wide text-muted">What it measures</th>
                </tr>
              </thead>
              <tbody>
                {SCORE_FACTORS.map(([factor, desc], i) => (
                  <tr key={factor} className={`border-b border-border-subtle/60 ${i % 2 === 0 ? "" : "bg-surface/40"}`}>
                    <td className="p-3 font-semibold text-ink">{factor}</td>
                    <td className="p-3 text-muted">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted">
            Verdict labels per ad: keep · kill · reduce · refresh · scale · fix-tracking · insufficient-data.
            The safe flag is always true — no verdict triggers an automatic change.
          </p>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section className="border-b border-border-subtle bg-surface-raised px-5 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <span className="text-sm font-bold uppercase tracking-widest text-brand">What you get</span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">Five capabilities, one OS</h2>
          </div>
          <div className="space-y-6">
            {FEATURES.map((f, i) => (
              <div key={f.eyebrow}
                className={`flex flex-col gap-4 rounded-2xl border border-border-subtle bg-surface p-6 shadow-card sm:flex-row ${i % 2 !== 0 ? "sm:flex-row-reverse" : ""}`}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-teal text-white shadow-sm">
                  <span className="text-lg font-extrabold">{i + 1}</span>
                </div>
                <div className="flex-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-brand">{f.eyebrow}</span>
                  <h3 className="mt-1 text-xl font-extrabold tracking-tight text-ink">{f.headline}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
                  <p className="mt-3 text-xs font-semibold text-teal">{f.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────── */}
      <section id="pricing" className="border-b border-border-subtle bg-surface px-5 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <span className="text-sm font-bold uppercase tracking-widest text-brand">Pricing</span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">Simple, honest pricing — AUD</h2>
            <p className="mt-3 text-base text-muted">No results guarantees. No lock-in. Cancel any time.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {TIERS.map((t) => (
              <div key={t.id}
                className={`relative flex flex-col rounded-2xl border bg-surface-raised p-6 shadow-card transition hover:shadow-card-hover
                  ${t.highlight ? "border-brand ring-1 ring-brand/20" : "border-border-subtle"}`}>
                {t.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-xs font-bold text-white shadow-sm">
                    Most popular
                  </span>
                )}
                <div className="mb-1 text-xs font-bold uppercase tracking-widest text-muted">{t.label}</div>
                <div className="text-2xl font-extrabold tracking-tight text-ink">{t.price}</div>
                {t.annual && <div className="mt-0.5 text-xs text-muted">{t.annual}</div>}
                <p className="mt-2 text-sm text-muted">{t.blurb}</p>
                <ul className="mt-5 flex-1 space-y-2">
                  {t.includes.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-ink">
                      <span className="mt-0.5 font-bold text-teal" aria-hidden>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href={t.ctaHref}
                  className={`mt-6 block rounded-xl px-4 py-2.5 text-center text-sm font-bold transition
                    ${t.highlight
                      ? "bg-brand text-white hover:bg-brand-600"
                      : "border border-border-subtle text-ink hover:border-brand hover:text-brand"}`}>
                  {t.cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-5 text-center text-xs text-muted">
            All plans billed monthly or annually in AUD via Stripe. Current pricing confirmed at checkout.
            No earnings or results guarantees.
          </p>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="bg-mesh px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            See your account health in minutes.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted">
            Paste a CSV from Ads Manager, get a full 13-factor Health Score and ranked findings.
            No card. No setup. No live-ad risk.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/login"
              className="rounded-xl bg-brand px-7 py-4 text-base font-bold text-white shadow-glow transition hover:bg-brand-600 focus-visible:shadow-ring-brand">
              Run your free audit →
            </Link>
            <Link href="/"
              className="rounded-xl border border-border-subtle bg-surface-raised px-7 py-4 text-base font-bold text-ink shadow-sm transition hover:border-brand hover:text-brand focus-visible:shadow-ring-brand">
              Back to home
            </Link>
          </div>
          <p className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-medium text-muted">
            <span>Read-only · never touches a live ad</span>
            <span>No earnings or results guarantees</span>
            <span>Australian English · AUD pricing</span>
          </p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="border-t border-border-subtle bg-surface-raised px-5 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 text-center text-sm text-muted sm:flex-row sm:justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-ink">
            <span className="inline-block h-5 w-5 rounded-lg bg-gradient-to-br from-brand to-teal" aria-hidden />
            AdPilot OS
          </Link>
          <span>Numbers-first · safe by design</span>
          <nav className="flex items-center gap-4">
            <Link href="/terms" className="transition hover:text-ink">Terms</Link>
            <Link href="/privacy" className="transition hover:text-ink">Privacy</Link>
            <Link href="/limitations" className="transition hover:text-ink">Limitations</Link>
          </nav>
        </div>
      </footer>

    </div>
  );
}
