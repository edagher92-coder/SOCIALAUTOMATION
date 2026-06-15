import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decrypt } from "@/lib/crypto";
import { verifySignature, matchReply, sendMessage, type Rule } from "@/lib/messenger/bot";

export const runtime = "nodejs";

// Public Messenger webhook (Meta calls this — no auth). Security is signature + verify token.
// GET: Meta's subscription handshake. POST: inbound events → routed by page id → auto-reply.

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
  if (body.object !== "page") return NextResponse.json({ received: true });

  const admin = createAdminClient();
  const tokenCache = new Map<string, string | null>();
  const rulesCache = new Map<string, Rule[]>();

  async function pageToken(pageId: string): Promise<string | null> {
    if (tokenCache.has(pageId)) return tokenCache.get(pageId)!;
    const { data } = await admin.from("messenger_pages").select("ciphertext,iv,auth_tag").eq("external_page_id", pageId).maybeSingle();
    let tok: string | null = null;
    try { if (data?.ciphertext) tok = decrypt({ ciphertext: data.ciphertext, iv: data.iv, authTag: data.auth_tag }); } catch { tok = null; }
    tokenCache.set(pageId, tok);
    return tok;
  }
  async function pageRules(pageId: string): Promise<Rule[]> {
    if (rulesCache.has(pageId)) return rulesCache.get(pageId)!;
    const { data } = await admin.from("messenger_rules").select("trigger_type,trigger,reply,priority").eq("external_page_id", pageId);
    const rules = (data || []) as Rule[];
    rulesCache.set(pageId, rules);
    return rules;
  }

  try {
    for (const entry of body.entry || []) {
      const pageId = String(entry.id);
      for (const ev of entry.messaging || []) {
        const senderId = ev.sender?.id;
        if (!senderId || ev.message?.is_echo) continue;
        const text: string | undefined = ev.message?.text;
        const payload: string | undefined = ev.postback?.payload || ev.message?.quick_reply?.payload;
        if (!text && !payload) continue;

        const reply = matchReply(await pageRules(pageId), { text, payload });
        if (!reply) continue;
        const tok = await pageToken(pageId);
        if (!tok) continue;
        try { await sendMessage(tok, senderId, reply); } catch { /* best-effort per event */ }
      }
    }
  } catch { /* always 200 so Meta doesn't retry-storm */ }
  return NextResponse.json({ received: true });
}
