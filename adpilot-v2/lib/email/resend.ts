import "server-only";

export class NoEmailKeyError extends Error {
  constructor() { super("NO_EMAIL_KEY"); this.name = "NoEmailKeyError"; }
}

// A Resend file attachment: base64-encoded `content` + a `filename`. Used to attach the generated
// report PDF to the weekly digest (scheduled PDF delivery).
export type EmailAttachment = { filename: string; content: string };

// Pure request-body shaper (exported for unit testing) — attachments are only included when present,
// so existing callers send exactly the same JSON they did before.
export function buildResendPayload(
  from: string, to: string, subject: string, html: string, attachments?: EmailAttachment[],
): Record<string, unknown> {
  const body: Record<string, unknown> = { from, to, subject, html };
  if (attachments && attachments.length) body.attachments = attachments;
  return body;
}

// Send transactional email via Resend (fetch, no SDK). Degrades when unconfigured. The optional
// `attachments` carry base64 files (e.g. the report PDF) — omitting them is fully backward-compatible.
export async function sendEmail(
  to: string, subject: string, html: string, opts: { attachments?: EmailAttachment[] } = {},
): Promise<true> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new NoEmailKeyError();
  const from = process.env.EMAIL_FROM || "AdPilot OS <onboarding@resend.dev>";
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify(buildResendPayload(from, to, subject, html, opts.attachments)),
  });
  if (!r.ok) throw new Error("Email send failed: " + (await r.text()).slice(0, 200));
  return true;
}
