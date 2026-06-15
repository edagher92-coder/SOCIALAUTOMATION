// Small helpers for route-handler tests that need an authenticated Supabase
// server client and/or a controllable org plan. Pairs with makeMockSupabase.
//
// These return plain objects you can hand to vi.mock factories, e.g.:
//
//   const auth = makeAuthState();
//   vi.mock("@/lib/supabase/server", () => ({ createClient: () => auth.serverClient }));
//   vi.mock("@/lib/org", () => ({
//     getActiveOrgId: async () => auth.orgId,
//     planForOrg: async () => auth.plan,
//   }));
//   // then per test: auth.setUser(null) / auth.setPlan("starter")

import type { Plan } from "@/lib/entitlements";

export interface AuthUser {
  id: string;
  email?: string;
}

export interface AuthState {
  /** A Supabase-server-client-shaped object whose auth.getUser() returns the current user. */
  serverClient: { auth: { getUser: () => Promise<{ data: { user: AuthUser | null } }> } };
  orgId: string;
  plan: Plan;
  setUser: (u: AuthUser | null) => void;
  setOrg: (id: string) => void;
  setPlan: (p: Plan) => void;
}

export function makeAuthState(opts: { user?: AuthUser | null; orgId?: string; plan?: Plan } = {}): AuthState {
  let user: AuthUser | null = opts.user === undefined ? { id: "u1", email: "user@example.com" } : opts.user;
  const state: AuthState = {
    orgId: opts.orgId ?? "org-1",
    plan: opts.plan ?? "free",
    serverClient: {
      auth: { getUser: async () => ({ data: { user } }) },
    },
    setUser(u) { user = u; },
    setOrg(id) { state.orgId = id; },
    setPlan(p) { state.plan = p; },
  };
  return state;
}

/** Build a JSON POST Request for a route handler under test. */
export function jsonRequest(url: string, body: unknown, init: RequestInit = {}): Request {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...(init.headers as any) },
    body: JSON.stringify(body),
    ...init,
  });
}
