"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { parseEmailLinkFragment, safeAuthNext } from "@/lib/auth/email-link";
import { createClient } from "@/lib/supabase/client";

export default function CompleteEmailLinkPage() {
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function complete() {
      const tokens = parseEmailLinkFragment(window.location.hash);
      const params = new URLSearchParams(window.location.search);
      const fallback = tokens?.type === "recovery" ? "/update-password" : "/command";
      const next = safeAuthNext(params.get("next"), fallback);

      // Remove credentials before doing any network work, so refreshes, screenshots,
      // browser history and support diagnostics cannot retain the fragment.
      window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);

      if (!tokens) {
        if (active) setError("This email link is incomplete, expired, or has already been used.");
        return;
      }

      const supabase = createClient();
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      });

      if (sessionError) {
        if (active) setError("This email link is no longer active. Please request a fresh one.");
        return;
      }

      // A full navigation guarantees the newly written auth cookies are present for
      // the server-side route guard on the destination page.
      window.location.replace(next);
    }

    void complete();
    return () => { active = false; };
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-mesh px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-border-subtle bg-white p-7 text-center shadow-card sm:p-9">
        <span className={`mx-auto grid h-12 w-12 place-items-center rounded-2xl ${error ? "bg-bad/10 text-bad" : "bg-brand-50 text-brand"}`}>
          <Icon name={error ? "alert-triangle" : "hourglass"} size={22} />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-ink">{error ? "We could not open that link" : "Securing your AdPilot session"}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{error || "One moment — we are verifying the email link and opening the right page."}</p>
        {error && <Link href="/login?notice=recovery-expired" className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white">Request a new link</Link>}
      </section>
    </main>
  );
}
