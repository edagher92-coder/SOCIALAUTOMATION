import { timingSafeEqual } from "crypto";

// Constant-time comparison so the CRON_SECRET can't be recovered via timing.
function safeEq(a: string | null | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  const ab = Buffer.from(a), bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

// Authorise a cron request against CRON_SECRET. Vercel Cron sends the secret in
// an `Authorization: Bearer <secret>` header. Do not accept it in a query string:
// URLs are commonly retained by access logs, browser history, and proxies.
// Always fails closed when the secret is unset.
export function cronAuthorized(req: Request, secret: string | undefined): boolean {
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  const bearer = auth && auth.startsWith("Bearer ") ? auth.slice(7) : null;
  return safeEq(bearer, secret);
}
