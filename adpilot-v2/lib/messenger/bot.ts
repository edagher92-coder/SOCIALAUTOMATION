import "server-only";
import crypto from "crypto";

// Multi-channel Messenger/Instagram/WhatsApp bot core: signature verification, hours-aware
// reply decisioning, and the Send APIs. Ported from the meta-messaging-bot skill's reply
// brain. Messenger + Instagram DM share the Page token + Send API; WhatsApp uses the Cloud API.

const V = "v21.0";

export type Rule = {
  trigger_type: "keyword" | "payload" | "welcome" | "away" | "default";
  trigger?: string | null;
  reply: string;
  priority?: number;
};
export type BusinessHours = { tz_offset?: number; open_hour?: number; close_hour?: number; days?: number[] };
export type DecideCtx = { inHours: boolean; isNewThread: boolean };

// Verify Meta's X-Hub-Signature-256 over the RAW request body (HMAC-SHA256 with app secret).
export function verifySignature(rawBody: string, header: string | null, appSecret: string): boolean {
  if (!header || !appSecret) return false;
  const expected = "sha256=" + crypto.createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Hours check with a tz offset (in hours). days uses Mon=0 … Sun=6 (matches the skill).
export function withinHours(bh?: BusinessHours | null): boolean {
  if (!bh) return true;
  const now = new Date(Date.now() + (bh.tz_offset ?? 0) * 3_600_000);
  const day = (now.getUTCDay() + 6) % 7; // JS Sun=0..Sat=6 → Mon=0..Sun=6
  const days = bh.days ?? [0, 1, 2, 3, 4];
  if (!days.includes(day)) return false;
  const h = now.getUTCHours();
  return (bh.open_hour ?? 8) <= h && h < (bh.close_hour ?? 18);
}

// Routing: payload → welcome(on GET_STARTED) → keyword-contains → first-message greeting
// (hours-aware: welcome in hours, away out of hours) → default fallback. Returns null if none.
export function decide(rules: Rule[], input: { text?: string; payload?: string }, ctx: DecideCtx): string | null {
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
  if (ctx.isNewThread) {
    const greet = ctx.inHours ? byType("welcome")[0] : (byType("away")[0] || byType("welcome")[0]);
    if (greet) return greet.reply;
  }
  const d = byType("default")[0];
  return d ? d.reply : null;
}

// Messenger + Instagram DM (Send API; messaging_type RESPONSE).
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

// WhatsApp Cloud API (free-form text only within the 24h customer-service window).
export async function sendWhatsApp(token: string, phoneId: string, to: string, text: string): Promise<void> {
  const r = await fetch(`https://graph.facebook.com/${V}/${phoneId}/messages?access_token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: text.slice(0, 4096) } }),
  });
  if (!r.ok) {
    const j: any = await r.json().catch(() => ({}));
    throw new Error(j?.error?.message || `WhatsApp send error ${r.status}`);
  }
}

// Subscribe a Page to the app's webhook fields (automates subscribe_page.py).
export async function subscribePage(pageToken: string): Promise<any> {
  const me: any = await (await fetch(`https://graph.facebook.com/${V}/me?fields=id,name&access_token=${encodeURIComponent(pageToken)}`)).json();
  if (!me?.id) throw new Error(me?.error?.message || "Bad Page token");
  const fields = "messages,messaging_postbacks,messaging_optins,message_deliveries";
  const r = await fetch(`https://graph.facebook.com/${V}/${me.id}/subscribed_apps?subscribed_fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(pageToken)}`, { method: "POST" });
  const j: any = await r.json();
  if (!r.ok) throw new Error(j?.error?.message || `Subscribe error ${r.status}`);
  return { page: me, subscribed: j };
}
