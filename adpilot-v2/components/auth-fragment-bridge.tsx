"use client";

import { useEffect } from "react";

/**
 * Supabase falls back to the configured Site URL when a requested redirect path
 * is not allow-listed. Preserve a valid implicit email-link fragment by routing
 * it to the dedicated consumer from whichever public page receives it.
 */
export function AuthFragmentBridge() {
  useEffect(() => {
    if (window.location.pathname === "/auth/complete") return;

    const hash = window.location.hash;
    if (!hash) return;
    const params = new URLSearchParams(hash.slice(1));
    const isAuthResult = Boolean(
      (params.get("access_token") && params.get("refresh_token")) ||
      params.get("error") ||
      params.get("error_code"),
    );
    if (!isAuthResult) return;

    const next = params.get("type") === "recovery" ? "/update-password" : "/command";
    window.location.replace(`/auth/complete?next=${encodeURIComponent(next)}${hash}`);
  }, []);

  return null;
}
