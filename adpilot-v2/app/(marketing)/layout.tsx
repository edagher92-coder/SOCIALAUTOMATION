import Link from "next/link";

// Minimal marketing/legal layout: renders children + a simple footer.
// Deliberately has NO app sidebar — these are public, pre-auth documents.
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface antialiased">
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12">{children}</main>
      <footer className="border-t border-border-subtle bg-surface-raised px-5 py-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 text-center text-sm text-muted sm:flex-row sm:justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-ink">
            <span className="inline-block h-5 w-5 rounded-lg bg-gradient-to-br from-brand to-teal" aria-hidden />
            AdPilot OS
          </Link>
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
