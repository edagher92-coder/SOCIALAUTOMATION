import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy (Draft)" };

// SCAFFOLD ONLY — no AI-authored legal text. Section headings + placeholders only.
// A qualified Australian solicitor must supply the binding text before launch.
export default function PrivacyPage() {
  return (
    <article className="prose-legal">
      <div
        role="alert"
        className="mb-8 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900"
      >
        DRAFT — NOT LEGALLY BINDING. Pending Australian solicitor review. Do not rely on this document.
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight text-ink">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted">Version v4-draft · Australian English · Australian Privacy Principles</p>

      <section className="mt-8 space-y-6 text-sm leading-relaxed text-ink">
        <div>
          <h2 className="text-lg font-bold text-ink">1. Collection notice</h2>
          <p className="text-muted">[Placeholder — solicitor to supply: what personal information we collect, why we collect it, and how it is used, consistent with the Australian Privacy Principles.]</p>
        </div>
        <div>
          <h2 className="text-lg font-bold text-ink">2. Data categories</h2>
          <p className="text-muted">[Placeholder — solicitor to supply: account details, billing details, and read-only advertising performance metrics drawn from connected ad accounts.]</p>
        </div>
        <div>
          <h2 className="text-lg font-bold text-ink">3. Sub-processors</h2>
          <p className="text-muted">[Placeholder — solicitor to supply: we rely on the following sub-processors — Supabase (database &amp; authentication), Stripe (payments), Resend (transactional email), and Anthropic (AI assistance).]</p>
        </div>
        <div>
          <h2 className="text-lg font-bold text-ink">4. Australian data residency</h2>
          <p className="text-muted">[Placeholder — solicitor to supply: where personal information is stored and processed, and the position on Australian data residency and any overseas disclosure.]</p>
        </div>
        <div>
          <h2 className="text-lg font-bold text-ink">5. Deletion-request contact</h2>
          <p className="text-muted">[Placeholder — solicitor to supply: how to request access, correction, or deletion of your personal information. Deletion requests may also be lodged via our data-deletion endpoint.]</p>
        </div>
        <div>
          <h2 className="text-lg font-bold text-ink">6. Security &amp; complaints</h2>
          <p className="text-muted">[Placeholder — solicitor to supply.]</p>
        </div>
      </section>
    </article>
  );
}
