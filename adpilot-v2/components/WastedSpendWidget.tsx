"use client";
import { useEffect, useState } from "react";
import WastedSpendCounter from "./WastedSpendCounter";

interface WidgetState {
  total: number;
  flaggedCount: number;
  currency: string;
}

export default function WastedSpendWidget() {
  const [data, setData] = useState<WidgetState | null>(null);

  useEffect(() => {
    fetch("/api/creative/scorecard")
      .then((r) => r.json())
      .then((j) => {
        if (!j.waste || j.upgrade) return;
        const { total, killCount, reduceCount } = j.waste;
        if (total > 0) {
          setData({ total, flaggedCount: (killCount ?? 0) + (reduceCount ?? 0), currency: j.currency || "AUD" });
        }
      })
      .catch(() => {/* silent — widget is best-effort */});
  }, []);

  if (!data) return null;
  return (
    <WastedSpendCounter
      total={data.total}
      flaggedCount={data.flaggedCount}
      currency={data.currency}
      canViewScorecard
    />
  );
}
