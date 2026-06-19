"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Remove a connected ad account. Confirm-gated (a destructive action), org-scoped on the server,
// and keeps historical numbers/scores — it only unlinks the live connection. Useful for clearing
// stale "Reconnect needed" duplicates once a non-expiring token replaces them.
export default function RemoveAccountButton({
  platform, externalAccountId, label,
}: { platform: "meta" | "tiktok"; externalAccountId: string; label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function go() {
    const ok = window.confirm(
      `Remove this ${platform} account${label ? ` (${label})` : ""}?\n\n` +
      `This unlinks the connection and clears its stored token. Your historical numbers and ` +
      `Campaign Health Scores are kept — you can reconnect any time.`,
    );
    if (!ok) return;
    setBusy(true); setMsg("");
    try {
      const r = await fetch("/api/connect/account", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ platform, externalAccountId }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.removed) { router.refresh(); return; }
      setMsg(j.error || (r.ok ? "Nothing to remove." : `Couldn't remove (HTTP ${r.status})`));
    } catch (e: any) {
      setMsg(e?.message || "Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-1 text-right">
      <button onClick={go} disabled={busy} aria-busy={busy}
        className="rounded-lg border border-border-subtle px-3 py-1.5 text-sm font-semibold text-muted hover:border-band-red hover:text-band-red disabled:opacity-50">
        {busy ? "Removing…" : "Remove"}
      </button>
      {msg && <span className="text-xs text-red-600" role="status">{msg}</span>}
    </span>
  );
}
