import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service (Draft)" };

// SCAFFOLD ONLY — no AI-authored legal text. Section headings + placeholders only.
// A qualified Australian solicitor must supply the binding text before launch.
export default function TermsPage() {
  return (
    <article className="prose-legal">
      <div
        role="alert"
        className="mb-8 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900"
      >
        DRAFT — NOT LEGALLY BINDING. Pending Australian solicitor review. Do not rely on this document.
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight text-ink">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted">Version v4-draft · Australian English · AUD</p>

      <section className="mt-8 space-y-6 text-sm leading-relaxed text-ink">
        <div>
          <h2 className="text-lg font-bold text-ink">1. Subscription</h2>
          <p className="text-muted">[Placeholder — solicitor to supply: terms governing subscription plans, the trial period, and renewal.]</p>
        </div>
        <div>
          <h2 className="text-lg font-bold text-ink">2. Pricing (AUD, GST-inclusive)</h2>
          <p className="text-muted">[Placeholder — solicitor to supply: all prices are quoted in Australian dollars and are inclusive of GST where applicable.]</p>
        </div>
        <div>
          <h2 className="text-lg font-bold text-ink">3. Billing &amp; cancellation</h2>
          <p className="text-muted">[Placeholder — solicitor to supply: billing cycle, payment processing via Stripe, cancellation rights, and refund position.]</p>
        </div>
        <div>
          <h2 className="text-lg font-bold text-ink">4. Read-only · no automatic edits</h2>
          <p className="text-muted">[Placeholder — solicitor to supply: AdPilot OS is read-only and never automatically edits a live ad. Any change is executed by the user in-platform.]</p>
        </div>
        <div>
          <h2 className="text-lg font-bold text-ink">5. Acceptable use</h2>
          <p className="text-muted">[Placeholder — solicitor to supply.]</p>
        </div>
        <div>
          <h2 className="text-lg font-bold text-ink">6. Liability &amp; governing law</h2>
          <p className="text-muted">[Placeholder — solicitor to supply: limitation of liability and the governing law of an Australian jurisdiction.]</p>
        </div>
        <div>
          <h2 className="text-lg font-bold text-ink">7. Data use &amp; model improvement</h2>
          <p className="text-muted">[Placeholder — solicitor to supply. Intended position: AdPilot may use account and ad-performance data to operate, improve, and train its models so the system becomes more accurate and efficient over time. Any training or evaluation uses <b>de-identified and/or aggregated</b> data only; your data is never exposed to another customer (strict tenant isolation), and identifiable lead PII is excluded. You may opt out of model-improvement use without losing core functionality, and erasure requests are honoured (see the Privacy Policy).]</p>
        </div>
      </section>
    </article>
  );
}
