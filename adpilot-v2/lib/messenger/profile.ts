import "server-only";

// No-prompt Messenger setup via the Graph API messenger_profile endpoint — TS port of
// meta_messaging_setup.py. Sets the customer-facing chat entry experience (greeting,
// ice breakers, Get Started, persistent menu) with a Page token and ZERO browser prompts;
// idempotent, multi-client. WRITE-scoped (pages_messaging + pages_manage_metadata), kept
// separate from the read-only ad layer.
//
// NOTE: true keyword-triggered auto-REPLIES are NOT in the public API — they need a
// Messenger webhook bot + app review. Ice breakers + persistent menu cover most of that.

const V = "v21.0";

export type IceBreaker = { question: string; payload: string };
export type MenuItem =
  | { type: "web_url"; title: string; url: string }
  | { type: "postback"; title: string; payload: string };
export type MessengerConfig = {
  greeting?: string;
  ice_breakers?: IceBreaker[];
  persistent_menu?: MenuItem[];
};

export class NoMessengerTokenError extends Error {
  constructor() {
    super("No Page token. Paste a Page token (pages_messaging + pages_manage_metadata) or set META_PAGE_ACCESS_TOKEN.");
    this.name = "NoMessengerTokenError";
  }
}

async function graph(method: string, path: string, token: string, body?: any, params?: Record<string, string>) {
  const qs = new URLSearchParams({ ...(params || {}), access_token: token });
  const r = await fetch(`https://graph.facebook.com/${V}/${path}?${qs.toString()}`, {
    method,
    headers: body ? { "content-type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const j: any = await r.json();
  if (!r.ok) throw new Error(j?.error?.message || `Graph API error ${r.status}`);
  return j;
}

export async function whoami(token: string): Promise<{ id: string; name?: string }> {
  return graph("GET", "me", token, undefined, { fields: "name,id" });
}

export async function getMessengerProfile(token: string) {
  const me = await whoami(token);
  const prof = await graph("GET", `${me.id}/messenger_profile`, token, undefined, {
    fields: "greeting,ice_breakers,get_started,persistent_menu",
  });
  return { page: me, profile: prof?.data?.[0] ?? prof };
}

// Applies the config in the order Meta expects: get_started first, then greeting,
// ice breakers, persistent menu. Returns each step's API response.
export async function applyMessengerProfile(token: string, cfg: MessengerConfig) {
  const me = await whoami(token);
  const page = me.id;
  const steps: Record<string, any> = {};
  steps.get_started = await graph("POST", `${page}/messenger_profile`, token, { get_started: { payload: "GET_STARTED" } });
  if (cfg.greeting) {
    steps.greeting = await graph("POST", `${page}/messenger_profile`, token, {
      platform: "messenger",
      greeting: [{ locale: "default", text: cfg.greeting }],
    });
  }
  if (cfg.ice_breakers?.length) {
    steps.ice_breakers = await graph("POST", `${page}/messenger_profile`, token, {
      ice_breakers: [{ locale: "default", call_to_actions: cfg.ice_breakers }],
    });
  }
  if (cfg.persistent_menu?.length) {
    steps.persistent_menu = await graph("POST", `${page}/messenger_profile`, token, {
      persistent_menu: [{ locale: "default", composer_input_disabled: false, call_to_actions: cfg.persistent_menu }],
    });
  }
  return { page: me, steps };
}
