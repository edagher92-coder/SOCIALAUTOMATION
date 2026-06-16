import { timingSafeEqual } from "crypto";

// Constant-time comparison so the CRON_SECRET can't be recovered via timing.
function safeEq(a: string | null | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  const ab = Buffer.from(a), bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

// Authorise a cron request against CRON_SECRET, accepted either as a
// `Authorization: Bearer <secret>` header (how Vercel Cron sends it) or a
// `?key=<secret>` query param. Always fails closed when the secret is unset.
export function cronAuthorized(req: Request, secret: string | undefined): boolean {
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  const bearer = auth && auth.startsWith("Bearer ") ? auth.slice(7) : null;
  let key: string | null = null;
  try { key = new URL(req.url).searchParams.get("key"); } catch { /* malformed url */ }
  return safeEq(bearer, secret) || safeEq(key, secret);
}
