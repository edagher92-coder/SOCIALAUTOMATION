import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decrypt } from "@/lib/crypto";
import { verifySignature, decide, withinHours, sendMessage, sendWhatsApp, aiReply, type Rule, type BusinessHours } from "@/lib/messenger/bot";

export const runtime = "nodejs";
export const maxDuration = 60;

// Public multi-channel webhook (Meta calls this — no auth; secured by verify token + signature).
// GET: subscription handshake. POST: Messenger / Instagram DM / WhatsApp events → auto-reply.
const GREET_COOLDOWN_MS = 6 * 3_600_000;

export async function GET(req: Request) {
  const u = new URL(req.url);
  const verify = process.env.MESSENGER_VERIFY_TOKEN;
  if (verify && u.searchParams.get("hub.mode") === "subscribe" && u.searchParams.get("hub.verify_token") === verify) {
    return new NextResponse(u.searchParams.get("hub.challenge") || "", { status: 200 });
  }
  return new NextResponse("forbidden", { status: 403 });
}

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("x-hub-signature-256"), process.env.META_APP_SECRET || "")) {
    return NextResponse.json({ error: "bad signature" }, { status: 403 });
  }
  let body: any;
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ received: true }); }

  const admin = createAdminClient();
  type Channel = { token: string | null; rules: Rule[]; hours?: BusinessHours | null; channel: string; aiEnabled: boolean; aiFacts: string | null; aiVoice: string | null };
  const cache = new Map<string, Channel>();

  async function channelFor(externalPageId: string): Promise<Channel> {
    if (cache.has(externalPageId)) return cache.get(externalPageId)!;
    const { data: page } = await admin.from("messenger_pages")
      .select("ciphertext,iv,auth_tag,business_hours,channel,ai_enabled,ai_facts,ai_voice").eq("external_page_id", externalPageId).maybeSingle();
    let token: string | null = null;
    try { if (page?.ciphertext) token = decrypt({ ciphertext: page.ciphertext, iv: page.iv, authTag: page.auth_tag }); } catch { token = null; }
    const { data: rules } = await admin.from("messenger_rules").select("trigger_type,trigger,reply,priority").eq("external_page_id", externalPageId);
    const ch: Channel = {
      token, rules: (rules || []) as Rule[],
      hours: (page as any)?.business_hours ?? null, channel: (page as any)?.channel || "messenger",
      aiEnabled: !!(page as any)?.ai_enabled, aiFacts: (page as any)?.ai_facts ?? null, aiVoice: (page as any)?.ai_voice ?? null,
    };
    cache.set(externalPageId, ch);
    return ch;
  }

  // First-message greeting cooldown (per page/channel + sender).
  async function isNewThread(externalPageId: string, senderId: string): Promise<boolean> {
    const { data } = await admin.from("messenger_threads").select("last_greeted_at").eq("external_page_id", externalPageId).eq("sender_id", senderId).maybeSingle();
    const last = data?.last_greeted_at ? new Date(data.last_greeted_at).getTime() : 0;
    if (last && Date.now() - last < GREET_COOLDOWN_MS) return false;
    await admin.from("messenger_threads").upsert({ external_page_id: externalPageId, sender_id: senderId, last_greeted_at: new Date().toISOString() }, { onConflict: "external_page_id,sender_id" });
    return true;
  }

  async function replyTo(externalPageId: string, senderId: string, input: { text?: string; payload?: string }, send: (token: string, to: string, text: string) => Promise<void>) {
    const ch = await channelFor(externalPageId);
    if (!ch.token) return;
    // "Matched" = a real intent (a payload rule / GET_STARTED, or a keyword hit) — only then
    // do we skip the first-message greeting. Unknown payloads fall through to the greeting.
    const payloadMatched = input.payload
      ? (ch.rules.some((r) => r.trigger_type === "payload" && (r.trigger || "").toUpperCase() === input.payload!.toUpperCase()) || input.payload.toUpperCase() === "GET_STARTED")
      : false;
    const keywordMatched = input.text
      ? ch.rules.some((r) => r.trigger_type === "keyword" && (r.trigger || "").split(",").some((k) => input.text!.toLowerCase().includes(k.trim().toLowerCase())))
      : false;
    // LLM-grounded "smart mode": no payload-rule and no keyword matched, the channel has AI
    // enabled, an API key is configured, and there's message text → answer STRICTLY from the
    // channel's verified facts. On any miss (no key / error / empty), fall through to the
    // canned welcome/away/default below. We do NOT consume the greeting cooldown for AI.
    if (!payloadMatched && !keywordMatched && input.text && ch.aiEnabled && process.env.ANTHROPIC_API_KEY) {
      const ai = await aiReply(ch.aiFacts, ch.aiVoice, input.text);
      if (ai) { try { await send(ch.token, senderId, ai); } catch { /* best-effort */ } return; }
    }
    const newThread = (payloadMatched || keywordMatched) ? false : await isNewThread(externalPageId, senderId);
    const text = decide(ch.rules, input, { inHours: withinHours(ch.hours), isNewThread: newThread });
    if (text) { try { await send(ch.token, senderId, text); } catch { /* best-effort */ } }
  }

  try {
    const obj = body.object;
    if (obj === "page" || obj === "instagram") {
      // Messenger + Instagram DM share the messaging[] shape + Page-token Send API.
      for (const entry of body.entry || []) {
        const pageId = String(entry.id);
        for (const ev of entry.messaging || []) {
          const senderId = ev.sender?.id;
          if (!senderId || ev.message?.is_echo) continue;
          const text: string | undefined = ev.message?.text;
          const payload: string | undefined = ev.postback?.payload || ev.message?.quick_reply?.payload;
          if (!text && !payload) continue;
          await replyTo(pageId, senderId, { text, payload }, (tok, to, t) => sendMessage(tok, to, t));
        }
      }
    } else if (obj === "whatsapp_business_account") {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value || {};
          const phoneId = value.metadata?.phone_number_id;
          if (!phoneId) continue;
          for (const msg of value.messages || []) {
            const from = msg.from;
            if (!from) continue;
            let text: string | undefined, payload: string | undefined;
            if (msg.type === "text") text = msg.text?.body;
            else if (msg.type === "interactive") payload = msg.interactive?.button_reply?.id || msg.interactive?.list_reply?.id;
            if (!text && !payload) continue;
            await replyTo(String(phoneId), from, { text, payload }, (tok, to, t) => sendWhatsApp(tok, String(phoneId), to, t));
          }
        }
      }
    }
  } catch { /* always 200 so Meta doesn't retry-storm */ }
  return NextResponse.json({ received: true });
}
