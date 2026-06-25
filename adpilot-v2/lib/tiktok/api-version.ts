// Single source of truth for the TikTok Business API version used by the live read path
// (the insights pull in lib/sync/pull.ts). Mirrors lib/meta/graph-version.ts so TikTok ingestion
// gets the same version-pinning discipline as Meta. Bump via the TIKTOK_API_VERSION env var with no
// code edits; defaults to v1.3 (the current Business API "report" version).
export const TIKTOK_API_VERSION = process.env.TIKTOK_API_VERSION ?? "v1.3";
export const TIKTOK_API_BASE = `https://business-api.tiktok.com/open_api/${TIKTOK_API_VERSION}`;
