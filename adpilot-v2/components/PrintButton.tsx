"use client";
export default function PrintButton({ label = "🖨 Download PDF" }: { label?: string }) {
  return (
    <button onClick={() => window.print()} className="rounded-lg border border-brand px-4 py-2 text-sm font-bold text-brand print:hidden">
      {label}
    </button>
  );
}
