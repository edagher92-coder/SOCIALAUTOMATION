// Single source of truth for the Meta Graph API version used by the live ingestion
// read path — the insights pull (lib/sync/pull.ts), the token/permission probe and
// ad-account discovery (connect/token + oauth callback). Bump via the
// META_GRAPH_API_VERSION env var with no code edits; defaults to v23.0 (the Phase-1
// ingestion target).
//
// NOTE: some non-ingestion Meta callers (messenger, publish, organic, lead-ads,
// audience) read the SAME env var but currently default to v21.0. They are bumped
// separately under their own smoke tests — setting META_GRAPH_API_VERSION in the
// environment moves all of them together; leaving it unset keeps ingestion on v23.0
// and those surfaces on v21.0 until each is validated.
export const META_GRAPH_VERSION = process.env.META_GRAPH_API_VERSION ?? "v23.0";
export const META_GRAPH_BASE = `https://graph.facebook.com/${META_GRAPH_VERSION}`;
