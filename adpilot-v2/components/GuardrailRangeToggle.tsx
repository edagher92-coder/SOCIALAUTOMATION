"use client";
import { useRouter, useSearchParams } from "next/navigation";
import RangeToggle from "@/components/RangeToggle";

// Drives the Mission Control guardrails panel's day window via the `?days=` URL param,
// so the range survives reloads/back-forward and the server component re-renders with it.
export default function GuardrailRangeToggle({ days }: { days: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const onChange = (d: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("days", String(d));
    router.push(`?${params.toString()}`);
  };

  return <RangeToggle days={days} onChange={onChange} variant="cockpit" />;
}
