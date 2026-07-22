import Link from "next/link";
import { PLANS, planPriceLabel } from "@/lib/plans";
import { FEATURE_LABEL } from "@/lib/entitlements";
import PlanMatrix from "@/components/PlanMatrix";
import { Icon, type IconName } from "@/components/icons";

const VALUE_CARDS: { icon: IconName; title: string; body: string; detail: string }[] = [
  { icon: "radar", title: "Know what changed", body: "A daily brief ranks the few items that actually need attention.", detail: "Health, pacing, tracking and freshness" },
  { icon: "shield", title: "Understand why", body: "Recommendations carry a time window, evidence and honest data limits.", detail: "No opaque score or invented benchmark" },
  { icon: "blocks", title: "Automate the routine", body: "Sync, scoring, watch rules, alerts, reports and drafts run on schedule.", detail: "Live paid-ad changes remain human-run" },
  { icon: "clapper", title: "Turn insight into work", body: "Move from fatigue signals to creative briefs, content and client reports.", detail: "One connected operating workflow" },
];

export default function Landing() {
  return (
    <main className="min-h-screen bg-surface text-ink">
      <nav className="sticky top-0 z-50 border-b border-border-subtle bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl min-w-0 items-center gap-2 px-4 sm:gap-3 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2 text-lg font-extrabold tracking-tight sm:gap-2.5"><span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-gradient text-white shadow-glow"><Icon name="radar" size={17} /></span>AdPilot <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-2xs font-extrabold text-brand sm:px-2">V7</span></Link>
          <div className="ml-auto hidden items-center gap-7 text-sm font-semibold text-muted md:flex"><Link href="#product" className="hover:text-ink">Product</Link><Link href="#safety" className="hover:text-ink">Safety</Link><Link href="#pricing" className="hover:text-ink">Pricing</Link><Link href="/how-it-works" className="hover:text-ink">How it works</Link></div>
          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2 md:ml-6"><Link href="/login" className="rounded-xl px-2.5 py-2 text-sm font-bold text-ink hover:bg-surface sm:px-3.5">Sign in</Link><Link href="/login?mode=signup" className="rounded-xl bg-brand px-3 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-600 sm:px-4">Create account</Link></div>
        </div>
      </nav>

      <header className="relative overflow-hidden border-b border-border-subtle bg-mesh px-4 py-14 sm:px-6 sm:py-20 lg:py-24">
        <div className="mx-auto grid min-w-0 max-w-7xl items-center gap-12 lg:grid-cols-[minmax(0,.9fr)_minmax(560px,1.1fr)]">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3 py-1.5 text-xs font-extrabold text-brand shadow-sm"><span className="h-1.5 w-1.5 rounded-full bg-good" /> Meta + TikTok · paid + organic</span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.04] tracking-[-0.035em] sm:text-6xl">Run advertising from one calm, explainable workspace.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">AdPilot shows what changed, why it matters, what needs you now, and what can safely run itself—without silently changing a live paid ad.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Link href="/login?mode=signup" className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-base font-extrabold text-white shadow-glow hover:bg-brand-600">Start with a private workspace <Icon name="chevron-right" size={17} /></Link><Link href="/how-it-works" className="inline-flex items-center gap-2 rounded-xl border border-border-subtle bg-white px-6 py-3.5 text-base font-bold shadow-card hover:border-brand-200"><Icon name="book" size={17} /> See the workflow</Link></div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-muted">{["CSV available on Free", "AUD and Australian English", "No results guarantees"].map((text) => <span key={text} className="flex items-center gap-1.5"><span className="text-good"><Icon name="check-circle" size={14} /></span>{text}</span>)}</div>
          </div>

          <div className="relative min-w-0">
            <div aria-hidden className="absolute -inset-8 rounded-full bg-brand/10 blur-3xl" />
            <section className="relative min-w-0 overflow-hidden rounded-[1.75rem] border border-cockpit-edge bg-cockpit p-4 text-cockpit-ink shadow-2xl sm:p-5">
              <div className="flex items-center justify-between border-b border-cockpit-edge pb-4"><div><div className="text-2xs font-extrabold uppercase tracking-[0.18em] text-brand-200">Today</div><div className="mt-1 font-extrabold">Northshore Growth</div></div><span className="rounded-full bg-good/10 px-2.5 py-1 text-2xs font-extrabold text-good">Data fresh · 18m</span></div>
              <div className="mt-4 grid gap-3 sm:grid-cols-[1.25fr_.75fr]">
                <div className="rounded-2xl border border-cockpit-edge bg-cockpit-raised p-4"><div className="flex items-center gap-2 text-2xs font-extrabold uppercase tracking-wider text-cockpit-muted"><span className="h-2 w-2 rounded-full bg-warn" /> Daily brief</div><h2 className="mt-3 text-xl font-extrabold">Two improvements need review</h2><p className="mt-2 text-xs leading-relaxed text-cockpit-muted">“Winter Leads” is 28% above break-even CPA after a meaningful sample. Tracking is clean; prepare a lower-budget test.</p><div className="mt-4 inline-flex rounded-lg bg-brand px-3 py-2 text-xs font-bold text-white">Review the evidence</div></div>
                <div className="rounded-2xl border border-cockpit-edge bg-cockpit-raised p-4"><div className="text-2xs font-extrabold uppercase tracking-wider text-cockpit-muted">Health</div><div className="mt-3 text-4xl font-extrabold tabular-nums text-warn">72<span className="text-sm text-cockpit-muted">/100</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-cockpit-edge"><div className="h-full w-[72%] rounded-full bg-warn" /></div><p className="mt-2 text-2xs text-cockpit-muted">Stable · 13 factors checked</p></div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3"><div className="rounded-xl border border-cockpit-edge bg-cockpit-raised p-3"><div className="text-[9px] font-bold uppercase text-cockpit-muted">Spend today</div><div className="mt-1 text-lg font-extrabold tabular-nums">$418</div><div className="mt-2 h-1 rounded-full bg-cockpit-edge"><div className="h-full w-[64%] rounded-full bg-good" /></div></div><div className="rounded-xl border border-cockpit-edge bg-cockpit-raised p-3"><div className="text-[9px] font-bold uppercase text-cockpit-muted">Open fixes</div><div className="mt-1 text-lg font-extrabold tabular-nums">2</div><div className="mt-1 text-[9px] text-cockpit-muted">both explained</div></div><div className="rounded-xl border border-cockpit-edge bg-cockpit-raised p-3"><div className="text-[9px] font-bold uppercase text-cockpit-muted">Watch rules</div><div className="mt-1 text-lg font-extrabold tabular-nums">11</div><div className="mt-1 text-[9px] text-good">running safely</div></div></div>
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-good/20 bg-good/10 p-3 text-xs"><span className="text-good"><Icon name="shield" size={15} /></span><span className="text-cockpit-muted"><b className="text-cockpit-ink">Live paid-ad changes blocked.</b> Analysis and preparation continue automatically.</span></div>
            </section>
          </div>
        </div>
      </header>

      <section className="border-b border-border-subtle bg-white px-4 py-5 sm:px-6"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-9 gap-y-3 text-xs font-bold text-muted">{["Encrypted credentials", "Read-only advertising access", "Evidence before recommendations", "Human control over spend"].map((text) => <span key={text} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-brand" />{text}</span>)}</div></section>

      <section id="product" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="max-w-3xl"><div className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand">One operating loop</div><h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">The app answers four questions in order.</h2><p className="mt-4 text-base leading-relaxed text-muted">Simple view gives an everyday operator the next useful step. Advanced view opens the evidence, rules, creative diagnostics and portfolio controls.</p></div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{VALUE_CARDS.map((card, index) => <article key={card.title} className="rounded-3xl border border-border-subtle bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover"><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand"><Icon name={card.icon} size={19} /></span><span className="text-xs font-extrabold text-muted">0{index + 1}</span></div><h3 className="mt-5 text-lg font-extrabold">{card.title}</h3><p className="mt-2 text-sm leading-relaxed text-muted">{card.body}</p><p className="mt-4 border-t border-border-subtle pt-3 text-xs font-semibold text-ink">{card.detail}</p></article>)}</div>
      </section>

      <section id="safety" className="bg-cockpit px-4 py-16 text-cockpit-ink sm:px-6 sm:py-24"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.8fr_1.2fr]"><div><div className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand-200">Guardian-style controls</div><h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Automation with visible boundaries.</h2><p className="mt-4 text-base leading-relaxed text-cockpit-muted">Borrowing the strongest command-centre pattern: always show system state, caps, evidence and the human decision boundary before something consequential happens.</p></div><div className="grid gap-3 sm:grid-cols-2">{[
        ["Automatic", "Data sync, scoring and anomaly detection", "activity", "good"],
        ["Automatic", "Alerts, reports and draft preparation", "blocks", "good"],
        ["Review required", "Recommendations and paused creative drafts", "eye", "warn"],
        ["Human only", "Live budgets, bids, launches and paid-ad pauses", "shield", "warn"],
      ].map(([state, body, icon, tone]) => <div key={body} className="rounded-2xl border border-cockpit-edge bg-cockpit-raised p-4"><div className={`flex items-center gap-2 text-xs font-extrabold uppercase ${tone === "good" ? "text-good" : "text-warn"}`}><Icon name={icon as IconName} size={16} />{state}</div><p className="mt-2 text-sm leading-relaxed text-cockpit-muted">{body}</p></div>)}</div></div></section>

      <section id="pricing" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="text-center"><div className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand">Plans</div><h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Start with the audit. Add automation when it pays for itself.</h2><p className="mx-auto mt-4 max-w-2xl text-base text-muted">Monthly AUD pricing. Features are gated honestly; no earnings or performance guarantees.</p></div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{PLANS.map((plan) => <article key={plan.id} className={`relative flex flex-col rounded-3xl border bg-white p-6 shadow-card ${plan.mostPopular ? "border-brand ring-2 ring-brand/10" : "border-border-subtle"}`}>{plan.mostPopular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-xs font-extrabold text-white">Most popular</span>}<div className="text-xs font-extrabold uppercase tracking-widest text-muted">{plan.label}</div><div className="mt-2 text-2xl font-extrabold">{planPriceLabel(plan)}</div><p className="mt-2 min-h-10 text-sm text-muted">{plan.blurb}</p><ul className="mt-5 flex-1 space-y-2.5">{plan.headlineFeatures.map((feature) => <li key={feature} className="flex items-start gap-2 text-sm"><span className="mt-0.5 text-good"><Icon name="check-circle" size={15} /></span>{FEATURE_LABEL[feature]}</li>)}</ul><Link href={plan.id === "free" ? "/login?mode=signup" : "/billing"} className={`mt-6 block rounded-xl px-4 py-2.5 text-center text-sm font-bold ${plan.mostPopular ? "bg-brand text-white" : "border border-border-subtle text-ink hover:border-brand-200"}`}>{plan.id === "free" ? "Create account" : "See this plan"}</Link></article>)}</div>
        <div className="mt-8"><PlanMatrix /></div>
      </section>

      <section className="border-y border-border-subtle bg-white px-4 py-14 sm:px-6"><div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left"><div><h2 className="text-2xl font-extrabold">Ready for a clearer daily operating rhythm?</h2><p className="mt-2 text-sm text-muted">Create the workspace first. Connect data only when you are ready.</p></div><Link href="/login?mode=signup" className="inline-flex flex-shrink-0 items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-extrabold text-white shadow-glow">Create your workspace <Icon name="chevron-right" size={16} /></Link></div></section>

      <footer className="px-4 py-10 sm:px-6"><div className="mx-auto flex max-w-7xl flex-col items-center gap-4 text-center text-sm text-muted sm:flex-row sm:justify-between"><span className="flex items-center gap-2 font-extrabold text-ink"><span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-gradient text-white"><Icon name="radar" size={14} /></span>AdPilot V7</span><span>Numbers-first · safe by design · no results guarantees</span><nav className="flex gap-4"><Link href="/terms" className="hover:text-ink">Terms</Link><Link href="/privacy" className="hover:text-ink">Privacy</Link><Link href="/limitations" className="hover:text-ink">Limitations</Link></nav></div></footer>
    </main>
  );
}
