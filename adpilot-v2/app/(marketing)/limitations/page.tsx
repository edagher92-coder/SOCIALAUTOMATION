import type { Metadata } from "next";

export const metadata: Metadata = { title: "Limitations & Disclaimer (Draft)" };

// SCAFFOLD ONLY — no AI-authored legal text. Section headings + placeholders only.
// A qualified Australian solicitor must supply the binding text before launch.
export default function LimitationsPage() {
  return (
    <article className="prose-legal">
      <div
        role="alert"
        className="mb-8 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900"
      >
        DRAFT — NOT LEGALLY BINDING. Pending Australian solicitor review. Do not rely on this document.
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight text-ink">Limitations &amp; Disclaimer</h1>
      <p className="mt-2 text-sm text-muted">Version v4-draft · Australian English</p>

      <section className="mt-8 space-y-6 text-sm leading-relaxed text-ink">
        <div>
          <h2 className="text-lg font-bold text-ink">1. Decision-support, not advice</h2>
          <p className="text-muted">[Placeholder — solicitor to supply: AdPilot OS provides decision-support tools and is not financial, legal, or professional advice.]</p>
        </div>
        <div>
          <h2 className="text-lg font-bold text-ink">2. Figures are illustrative</h2>
          <p className="text-muted">[Placeholder — solicitor to supply: any figures, projections, or scores shown are illustrative estimates only and may differ from actual results.]</p>
        </div>
        <div>
          <h2 className="text-lg font-bold text-ink">3. No earnings guarantees</h2>
          <p className="text-muted">[Placeholder — solicitor to supply: we make no guarantee of earnings, return on ad spend, or any particular result.]</p>
        </div>
        <div>
          <h2 className="text-lg font-bold text-ink">4. You execute changes in-platform</h2>
          <p className="text-muted">[Placeholder — solicitor to supply: AdPilot OS is read-only. The user reviews recommendations and executes any change themselves within the relevant advertising platform.]</p>
        </div>
      </section>
    </article>
  );
}
