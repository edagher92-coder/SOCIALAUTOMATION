import "server-only";
import crypto from "crypto";

// Messenger webhook bot core: signature verification, keyword/payload matching, and the
// Send API. The public webhook reuses these with a per-page decrypted token. This is the
// "real" multi-client auto-reply layer that the entry-experience setup can't cover.

const V = "v21.0";

export type Rule = { trigger_type: "keyword" | "payload" | "welcome" | "default"; trigger?: string | null; reply: string; priority?: number };

// Verify Meta's X-Hub-Signature-256 over the RAW request body (HMAC-SHA256 with app secret).
export function verifySignature(rawBody: string, header: string | null, appSecret: string): boolean {
  if (!header || !appSecret) return false;
  const expected = "sha256=" + crypto.createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Choose a reply for an inbound event. Order: matching payload → welcome (on GET_STARTED)
// → keyword contains-match → default catch-all. Returns null if nothing matches.
export function matchReply(rules: Rule[], input: { text?: string; payload?: string }): string | null {
  const byType = (t: Rule["trigger_type"]) => rules.filter((r) => r.trigger_type === t).sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));

  if (input.payload) {
    const p = byType("payload").find((r) => (r.trigger || "").toUpperCase() === input.payload!.toUpperCase());
    if (p) return p.reply;
    if (input.payload.toUpperCase() === "GET_STARTED") {
      const w = byType("welcome")[0];
      if (w) return w.reply;
    }
  }
  if (input.text) {
    const t = input.text.toLowerCase();
    for (const r of byType("keyword")) {
      const kws = (r.trigger || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
      if (kws.some((k) => t.includes(k))) return r.reply;
    }
  }
  const d = byType("default")[0];
  return d ? d.reply : null;
}

// Send a text reply via the Send API (messaging_type RESPONSE).
export async function sendMessage(pageToken: string, recipientId: string, text: string): Promise<void> {
  const r = await fetch(`https://graph.facebook.com/${V}/me/messages?access_token=${encodeURIComponent(pageToken)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ recipient: { id: recipientId }, messaging_type: "RESPONSE", message: { text: text.slice(0, 2000) } }),
  });
  if (!r.ok) {
    const j: any = await r.json().catch(() => ({}));
    throw new Error(j?.error?.message || `Send API error ${r.status}`);
  }
}
