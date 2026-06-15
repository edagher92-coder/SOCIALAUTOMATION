import Link from "next/link";
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5 text-center">
      <div className="text-4xl font-extrabold tracking-tight">404</div>
      <p className="mt-2 text-muted">That page doesn't exist.</p>
      <Link href="/dashboard" className="mt-4 rounded-lg bg-brand px-5 py-2.5 font-bold text-white">Go to dashboard</Link>
    </main>
  );
}
