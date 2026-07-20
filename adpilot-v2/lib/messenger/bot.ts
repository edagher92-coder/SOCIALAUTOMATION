import "server-only";
import crypto from "crypto";
import { callClaude, NoKeyError, MODELS } from "@/lib/ai/claude";
import { META_GRAPH_VERSION } from "@/lib/meta/graph-version";

// Multi-channel Messenger/Instagram/WhatsApp bot core: signature verification, hours-aware
// reply decisioning, and the Send APIs. Ported from the meta-messaging-bot skill's reply
// brain. Messenger + Instagram DM share the Page token + Send API; WhatsApp uses the Cloud API.

const V = META_GRAPH_VERSION;

// WhatsApp Cloud API only allows a free-form text reply inside the 24h customer-service window
// (after the user's last inbound message). Outside it, Meta rejects with error 131026, so we
// fail fast with a typed error instead of wasting an API call.
export class WhatsAppWindowError extends Error {
  constructor() { super("Outside the WhatsApp 24h customer-service window — a reply needs a template message."); this.name = "WhatsAppWindowError"; }
}
export const isWhatsAppWindowError = (e: any) => e?.name === "WhatsAppWindowError";

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
// When the caller knows the last inbound time, pass it: if the window has closed we throw a
// WhatsAppWindowError before the request rather than letting Meta reject it (error 131026).
export async function sendWhatsApp(token: string, phoneId: string, to: string, text: string, lastCustomerMsgAt?: Date | null): Promise<void> {
  if (lastCustomerMsgAt != null && Date.now() - lastCustomerMsgAt.getTime() > 23.5 * 3_600_000) {
    throw new WhatsAppWindowError();
  }
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

// --- LLM-grounded auto-reply (smart mode) ---------------------------------
// Port of the uploaded Sam bot's "smart mode": only fires when no payload-rule and no
// keyword matched. Answers STRICTLY from the channel's VERIFIED FACTS — no invention of
// prices/specs/policies, never collects finance/credit details in chat. PURE + unit-testable.
export const AI_MODEL = MODELS.light;

// Build the strict, no-hallucination system prompt. `facts` is the ONLY source of truth the
// model may answer from; `voice` is an optional brand-voice note. Returns a self-contained
// prompt — no network, no env, deterministic for the same inputs.
export function buildAiSystemPrompt(facts?: string | null, voice?: string | null): string {
  const f = (facts || "").trim();
  const v = (voice || "").trim();
  return [
    "You are the customer-service assistant for a business, replying inside a chat (Messenger / Instagram DM / WhatsApp).",
    "",
    "VERIFIED FACTS (the ONLY information you may state as true):",
    f || "(none provided)",
    "",
    "STRICT RULES — follow every one:",
    "- Answer ONLY using the VERIFIED FACTS above. Do not use outside knowledge or assumptions.",
    "- If a fact needed to answer is NOT in the VERIFIED FACTS, do NOT guess or invent it. Either ask the customer a clarifying question, or tell them you'll have the business follow up.",
    "- NEVER invent or estimate prices, specs, availability, hours, or policies. If it isn't in the VERIFIED FACTS, say you don't have that detail and offer to connect them with the business.",
    "- NEVER collect or request finance, credit, card, or banking details in chat. If finance/payment comes up, say the business will handle that securely and offer to pass them on.",
    "- Keep replies to 1–4 short sentences. Use at most ONE emoji, and only when it fits the tone.",
    "- Be helpful, friendly, and concise. Do not make promises the business hasn't authorised.",
    v ? `\nBRAND VOICE: ${v}` : "",
  ].join("\n").trim();
}

// Generate a grounded reply for an inbound message, or null when the model can't/shouldn't
// answer (no API key, error, or empty output) so the caller can fall back to canned replies.
export async function aiReply(facts: string | null | undefined, voice: string | null | undefined, text: string): Promise<string | null> {
  const msg = (text || "").trim();
  if (!msg) return null;
  try {
    const out = await callClaude({
      system: buildAiSystemPrompt(facts, voice),
      user: msg,
      model: AI_MODEL,
      maxTokens: 320,
    });
    const reply = (out || "").trim();
    return reply || null;
  } catch (e) {
    // Observability without leaking content/PII: tag the failure type so a bad key or a
    // token/rate error is visible in logs for cost monitoring, then degrade to canned replies.
    console.warn("[aiReply.error]", JSON.stringify({ error_type: e instanceof NoKeyError ? "NO_KEY" : "API_ERROR" }));
    return null;
  }
}
