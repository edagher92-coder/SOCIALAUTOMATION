// Derive the account's REAL average CPM per platform from the ad snapshots we already pull, so
// boost projections are grounded in what this account actually pays rather than a guess. The
// aggregation (cpmByPlatformFromRows) is pure + unit-tested; the thin DB wrapper just feeds it rows.
import type { OrganicPlatform } from "./boost";

export interface CpmByPlatform { meta: number | null; tiktok: number | null }

interface SnapRow { platform?: string | null; spend?: number | null; impressions?: number | null }

// Weighted CPM = total spend / total impressions x 1000, per platform. Null when there are no
// impressions on that platform yet — the UI then falls back to a clearly-labelled benchmark.
export function cpmByPlatformFromRows(rows: SnapRow[]): CpmByPlatform {
  const agg: Record<OrganicPlatform, { spend: number; impr: number }> = {
    meta: { spend: 0, impr: 0 }, tiktok: { spend: 0, impr: 0 },
  };
  for (const r of rows || []) {
    const p: OrganicPlatform | null = r.platform === "meta" ? "meta" : r.platform === "tiktok" ? "tiktok" : null;
    if (!p) continue;
    agg[p].spend += Number(r.spend) || 0;
    agg[p].impr += Number(r.impressions) || 0;
  }
  const cpm = (a: { spend: number; impr: number }) => (a.impr > 0 ? (a.spend / a.impr) * 1000 : null);
  return { meta: cpm(agg.meta), tiktok: cpm(agg.tiktok) };
}

// Pull the last 90 days of snapshots for the org and reduce to CPM per platform. `admin` is the
// service-role client (same one the sync uses), passed in so this stays easy to test.
export async function getAccountCpmByPlatform(admin: any, orgId: string): Promise<CpmByPlatform> {
  const since = new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10);
  const { data } = await admin
    .from("campaign_snapshots")
    .select("platform,spend,impressions")
    .eq("organisation_id", orgId)
    .gte("date", since);
  return cpmByPlatformFromRows((data as SnapRow[]) || []);
}
