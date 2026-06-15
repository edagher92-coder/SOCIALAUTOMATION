import "server-only";

export class NoEmailKeyError extends Error {
  constructor() { super("NO_EMAIL_KEY"); this.name = "NoEmailKeyError"; }
}

// Send transactional email via Resend (fetch, no SDK). Degrades when unconfigured.
export async function sendEmail(to: string, subject: string, html: string): Promise<true> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new NoEmailKeyError();
  const from = process.env.EMAIL_FROM || "AdPilot OS <onboarding@resend.dev>";
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!r.ok) throw new Error("Email send failed: " + (await r.text()).slice(0, 200));
  return true;
}
