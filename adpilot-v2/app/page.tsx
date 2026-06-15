import Link from "next/link";

export default function Landing() {
  return (
    <main>
      <nav className="sticky top-0 z-50 border-b border-[#e3e8ef] bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5">
          <span className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
            <span className="inline-block h-6 w-6 rounded-lg bg-gradient-to-br from-brand to-teal" /> AdPilot OS
          </span>
          <span className="ml-1 rounded-full bg-[#eaf1ff] px-2 py-0.5 text-xs font-bold text-[#0b3aa6]">V2</span>
          <div className="ml-auto flex items-center gap-4 text-sm font-semibold text-muted">
            <Link href="#pricing" className="hidden sm:inline">Pricing</Link>
            <Link href="/login" className="rounded-lg border border-brand px-3 py-2 text-brand">Sign in</Link>
            <Link href="/dashboard" className="rounded-lg bg-brand px-3 py-2 text-white">Open app</Link>
          </div>
        </div>
      </nav>

      <header className="border-b border-[#e3e8ef] bg-gradient-to-b from-white to-[#f4f7fb] px-5 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="mb-5 inline-block rounded-full bg-[#eaf1ff] px-3 py-1 text-sm font-bold text-[#0b3aa6]">
            Meta &amp; TikTok · explainable · safe by design
          </span>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Know exactly what your ads are{" "}
            <span className="bg-gradient-to-r from-brand to-teal bg-clip-text text-transparent">doing to your money.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
            An explainable Campaign Health Score, the findings leaking budget, and safe, numbers-first recommendations —
            without ever touching a live ad.
          </p>
          <div className="mt-7 flex justify-center gap-3">
            <Link href="/dashboard" className="rounded-xl bg-brand px-5 py-3 font-bold text-white">Analyse my ads</Link>
            <Link href="/login" className="rounded-xl border border-brand px-5 py-3 font-bold text-brand">Sign in</Link>
          </div>
          <p className="mt-5 text-sm font-semibold text-muted">
            🔒 Read-only · proposals only · your data stays private
          </p>
        </div>
      </header>

      <section id="pricing" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-center text-3xl font-bold tracking-tight">Simple, honest pricing</h2>
        <p className="mb-8 mt-2 text-center text-muted">AUD. No results guarantees — just a system that does the work.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { n: "Starter", p: "$97–297", d: "DIY: dashboard, CSV import, audits." },
            { n: "Pro", p: "$497–1,497", d: "Automation, alerts, health scoring, UTM builder." },
            { n: "Agency", p: "$1,997+", d: "Multi-client, branded reports, white-label." },
          ].map((t) => (
            <div key={t.n} className="rounded-2xl border border-[#e3e8ef] bg-white p-6 shadow-card">
              <h3 className="text-lg font-bold">{t.n}</h3>
              <div className="my-2 text-2xl font-extrabold">{t.p}</div>
              <p className="text-sm text-muted">{t.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-[#e3e8ef] py-8 text-center text-sm text-muted">
        AdPilot OS V2 · numbers-first · safe by design. No earnings or results guarantees.
      </footer>
    </main>
  );
}
