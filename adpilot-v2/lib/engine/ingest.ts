// AdPilot OS V2 — CSV text -> normalised rows with computed metrics (TS port).
import type { Row } from "./types";
import * as M from "./metrics";
import { parseCSV, detectPlatform, normalise } from "./schema";

function fillComputed(r: Row): Row {
  const g = (k: string): number => r[k] || 0;
  if (r.frequency == null) r.frequency = M.frequency(g("impressions"), g("reach"));
  if (r.ctr == null) r.ctr = M.ctr(g("clicks"), g("impressions"));
  if (r.cpc == null) r.cpc = M.cpc(g("spend"), g("clicks"));
  if (r.cpm == null) r.cpm = M.cpm(g("spend"), g("impressions"));
  if (r.cost_per_lead == null) r.cost_per_lead = M.cpl(g("spend"), g("leads"));
  if (r.cost_per_purchase == null) r.cost_per_purchase = M.cpa(g("spend"), g("purchases"));
  if (r.roas == null) r.roas = M.roas(g("revenue"), g("spend"));
  if (r.hook_rate == null) r.hook_rate = M.hookRate(g("three_second_views"), g("impressions"));
  if (r.hold_rate == null) r.hold_rate = M.holdRate(g("thruplays"), g("three_second_views"));
  return r;
}

export function parseCsvText(text: string, platform?: string | null): Row[] {
  const grid = parseCSV(text);
  if (!grid.length) return [];
  const headers = grid[0];
  const plat = platform || detectPlatform(headers);
  return grid.slice(1).map((cells) => {
    const raw: Row = {};
    headers.forEach((h, idx) => (raw[h] = cells[idx]));
    return fillComputed(normalise(raw, plat));
  });
}
