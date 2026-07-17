import Link from "next/link";
import { PLANS, planPriceLabel } from "@/lib/plans";
import { FEATURE_LABEL } from "@/lib/entitlements";
import PlanMatrix from "@/components/PlanMatrix";

export default function Landing() {
  return (
    <main className="min-h-screen bg-surface antialiased">
      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-border-subtle bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-5">
          <Link href="/" className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-ink">
            <span className="inline-block h-7 w-7 rounded-xl bg-gradient-to-br from-brand to-teal shadow-sm" />
            AdPilot OS
          </Link>
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand">V7</span>
          <div className="ml-auto flex items-center gap-3 text-sm font-semibold">
            <Link href="#pricing" className="hidden text-muted transition hover:text-ink sm:inline">Pricing</Link>
            <Link href="/login"
              className="rounded-lg border border-brand-200 px-3.5 py-2 text-brand transition hover:border-brand hover:bg-brand-50 focus-visible:shadow-ring-brand">
              Sign in
            </Link>
            <Link href="/command"
              className="rounded-lg bg-brand px-3.5 py-2 text-white shadow-sm transition hover:bg-brand-600 focus-visible:shadow-ring-brand">
              Open app
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <header className="relative overflow-hidden border-b border-border-subtle bg-gradient-to-b from-surface-raised via-surface to-surface px-5 py-16 sm:py-24 lg:py-28">
        {/* subtle decorative orb */}
        <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-brand-50 opacity-50 blur-3xl" />
        <div className="relative mx-auto max-w-3xl text-center">
          <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-sm font-semibold text-brand">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand" />
            For social media managers, agencies &amp; creators
          </span>
          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-6xl">
            Know exactly what your ads are{" "}
            <span className="bg-gradient-to-r from-brand to-teal bg-clip-text text-transparent">
              doing to your money.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            One workspace for paid and organic: an explainable Campaign Health Score and safe,
            numbers-first fixes for your ads, plus content scheduling, DM auto-replies and
            white-label client reports. Read-only on ads — it proposes, you approve.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/command"
              className="rounded-xl bg-brand px-6 py-3.5 text-base font-bold text-white shadow-sm transition hover:bg-brand-600 hover:shadow-md focus-visible:shadow-ring-brand">
              Open the Command Centre →
            </Link>
            <Link href="/login"
              className="rounded-xl border border-border-subtle bg-surface-raised px-6 py-3.5 text-base font-bold text-ink shadow-sm transition hover:border-brand hover:text-brand focus-visible:shadow-ring-brand">
              Sign in
            </Link>
          </div>
          <p className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-muted">
            <span aria-hidden>🔒</span>
            Read-only · proposals only · your data stays private
          </p>
        </div>
      </header>

      {/* ── Trust bar ────────────────────────────────────────── */}
      <section className="border-b border-border-subtle bg-surface-raised px-5 py-6">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm font-semibold text-muted">
          {["Never touches a live ad", "AES-256 encrypted tokens", "Meta & TikTok read-only", "Numbers-first · no fluff"].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal" />
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* ── Built for social media managers ─────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="text-center">
          <span className="text-sm font-bold uppercase tracking-widest text-brand">Built for social media managers</span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Paid and organic, run from one place</h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-muted">
            Everything a social media manager juggles — campaigns, content, DMs and client reporting — in one calm workspace. Numbers-first, no fluff.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {([
            ["📊", "Explainable ad health", "A 0–100 Campaign Health Score with the findings leaking budget and safe, numbers-first fixes. Read-only — nothing changes on Meta/TikTok until you approve."],
            ["🎬", "Plan & schedule content", "Compose, schedule and publish posts and reels to Facebook, Instagram and TikTok from one place."],
            ["🎨", "Create on-brand", "Brief and generate ad and post creative with the AI Creative Studio, and keep your assets in one library."],
            ["💬", "Auto-reply to DMs", "Set a greeting, ice breakers, a menu and keyword auto-replies for Messenger and Instagram."],
            ["👥", "Manage every client", "Switch between clients in a click and see each one's health at a glance."],
            ["🗃️", "White-label reports", "Send client-ready reports and PDFs branded as your agency — your logo, your colours."],
          ] as [string, string, string][]).map(([icon, title, body]) => (
            <div key={title} className="rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-card">
              <div className="text-2xl" aria-hidden>{icon}</div>
              <h3 className="mt-2 font-bold text-ink">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {([
            ["Agencies & freelancers", "Run many clients without the chaos — multi-client switching, white-label reports and a tidy portfolio."],
            ["Solo & in-house teams", "One brand, end to end: schedule content, watch the health score, and keep DMs answered."],
            ["Content-led creators", "Lead with creative — generate on-brand assets, schedule reels, and grow with the numbers behind you."],
          ] as [string, string][]).map(([title, body]) => (
            <div key={title} className="rounded-2xl border border-brand-200 bg-brand-50/40 p-5">
              <h3 className="font-bold text-ink">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-muted">Read-only on ads · numbers-first · no earnings or results guarantees.</p>
      </section>

      {/* ── Pricing ──────────────────────────────────────────── */}
      <section id="pricing" className="mx-auto max-w-6xl px-5 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Simple, honest pricing</h2>
          <p className="mt-3 text-base text-muted">AUD. No results guarantees — just a system that does the work.</p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((t) => (
            <div key={t.id}
              className={`relative flex flex-col rounded-2xl border bg-surface-raised p-6 shadow-card transition hover:shadow-card-hover ${t.mostPopular ? "border-brand ring-1 ring-brand/20" : "border-border-subtle"}`}>
              {t.mostPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-xs font-bold text-white shadow-sm">
                  Most popular
                </span>
              )}
              <div className="mb-1 text-sm font-bold uppercase tracking-widest text-muted">{t.label}</div>
              <div className="text-2xl font-extrabold tracking-tight text-ink">{planPriceLabel(t)}</div>
              <p className="mt-2 text-sm text-muted">{t.blurb}</p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {t.headlineFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-ink">
                    <span className="mt-0.5 text-teal" aria-hidden>✓</span>
                    {FEATURE_LABEL[f]}
                  </li>
                ))}
              </ul>
              <Link href={t.id === "free" ? "/login" : "/billing"}
                className={`mt-6 block rounded-xl px-4 py-2.5 text-center text-sm font-bold transition ${t.mostPopular ? "bg-brand text-white hover:bg-brand-600" : "border border-border-subtle text-ink hover:border-brand hover:text-brand"}`}>
                {t.id === "free" ? "Start free" : "See plan"}
              </Link>
            </div>
          ))}
        </div>
        <div className="mt-8"><PlanMatrix /></div>
        <p className="mt-4 text-center text-xs text-muted">All plans billed monthly in AUD via Stripe. Current pricing is shown at checkout. No earnings or results guarantees.</p>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-border-subtle bg-surface-raised px-5 py-10">
        <div className="mx-auto max-w-6xl flex flex-col items-center gap-2 text-center text-sm text-muted sm:flex-row sm:justify-between">
          <span className="flex items-center gap-2 font-semibold text-ink">
            <span className="inline-block h-5 w-5 rounded-lg bg-gradient-to-br from-brand to-teal" />
            AdPilot OS V7
          </span>
          <span>Numbers-first · safe by design. No earnings or results guarantees.</span>
          <nav className="flex items-center gap-4">
            <Link href="/terms" className="transition hover:text-ink">Terms</Link>
            <Link href="/privacy" className="transition hover:text-ink">Privacy</Link>
            <Link href="/limitations" className="transition hover:text-ink">Limitations</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
