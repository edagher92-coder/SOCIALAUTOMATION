import "server-only";

// Map a Meta Graph API error body into a precise, action-oriented message. Meta uses
// code 190 (with sub-codes) for token problems; we distinguish expired vs revoked vs
// generic-invalid so the user knows exactly what to fix instead of seeing raw API text.
// Shared by the ads-connect path (app/api/connect/token) and the Page resolver
// (app/api/connect/meta-pages) so both surface identical guidance.
export function metaTokenError(body: any, httpStatus: number): string {
  const err = body?.error || {};
  const code = Number(err.code);
  const sub = Number(err.error_subcode);
  if (code === 190 || code === 102 || code === 463 || httpStatus === 401) {
    // 463 = token expired; 460 = password changed / session invalidated; 467 = invalid/revoked.
    if (sub === 463 || /expired/i.test(err.message || "")) {
      return "This Meta token has expired. Graph API Explorer tokens last only ~1–2 hours — for a connection that keeps running, generate a non-expiring Business System User token (see the token guide below), then reconnect.";
    }
    if (sub === 460 || sub === 467 || /revoked|invalidated/i.test(err.message || "")) {
      return "This Meta token has been revoked or invalidated. Generate a fresh non-expiring System User token (see the token guide below) and reconnect.";
    }
    return "This Meta token is invalid. Paste a current token with the ads_read scope — a non-expiring Business System User token is best (see the token guide below).";
  }
  if (code === 200 || code === 10 || httpStatus === 403) {
    return "Meta refused this token's permissions. Make sure it has the read-only ads_read and read_insights scopes and that your ad accounts are assigned to it (see the token guide below).";
  }
  return err.message || `Meta rejected this token (HTTP ${httpStatus}). Try a fresh non-expiring System User token — see the token guide below.`;
}
