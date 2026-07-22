import Link from "next/link";
import { Icon } from "@/components/icons";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-mesh px-5 text-center">
      <section className="w-full max-w-md rounded-3xl border border-border-subtle bg-white p-8 shadow-card"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand"><Icon name="compass" size={23} /></span><div className="mt-4 text-2xs font-extrabold uppercase tracking-[0.2em] text-brand">404 · Page not found</div><h1 className="mt-2 text-2xl font-extrabold text-ink">That destination is not here</h1><p className="mt-2 text-sm leading-relaxed text-muted">The link may be old, or this tool may have moved into the new V7 navigation.</p><div className="mt-5 flex justify-center gap-2"><Link href="/command" className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white"><Icon name="radar" size={15} /> Open Today</Link><Link href="/" className="rounded-xl border border-border-subtle px-4 py-2.5 text-sm font-bold text-ink">Home</Link></div></section>
    </main>
  );
}
