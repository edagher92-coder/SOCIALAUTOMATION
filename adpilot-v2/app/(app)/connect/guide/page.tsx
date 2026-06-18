import Link from "next/link";
import ReadOnlyBadge from "@/components/ReadOnlyBadge";

export const metadata = { title: "Get a never-expiring token — AdPilot OS" };

// Standalone, always-reachable guide for creating a long-lived READ-ONLY API token so AdPilot can
// auto-sync. Replaces the old in-page #token-help anchor (which only scrolled to a collapsed block).
// Links to the animated walkthrough + each platform's OWN official developer docs.

const META_STEPS: [string, string][] = [
  ["Open Business Settings → Users → System Users", "Go to business.facebook.com/settings/system-users."],
  ["Add a System User", "Click Add, give it any name, and pick the Admin role (simplest)."],
  ["Assign your ad account", "Open Assign assets → choose your ad account → switch on full control."],
  ["Generate a new token", "Click Generate new token, pick your Meta app, and tick only ads_read and read_insights (read-only)."],
  ["Set expiry to Never", "Set Token expiration to Never, then Generate — this is what keeps your sync alive."],
  ["Paste it into AdPilot", "Back in AdPilot, choose Meta, paste the token, leave Account ID blank, and hit Connect & sync."],
];
const TIKTOK_STEPS: [string, string][] = [
  ["Open the TikTok developer portal", "Go to business-api.tiktok.com (TikTok for Business → My Apps)."],
  ["Enable the Marketing API (ads.read)", "Create/develop an app and request the read-only ads.read permission; get it approved."],
  ["Authorise + generate a long-lived token", "Authorise your advertiser account and generate a long-lived access token; copy it (and your advertiser id)."],
  ["Paste it into AdPilot", "Choose TikTok, paste the token and your advertiser id, then Connect & sync."],
];

function Steps({ steps }: { steps: [string, string][] }) {
  return (
    <ol className="mt-3 space-y-3">
      {steps.map(([t, d], i) => (
        <li key={i} className="flex gap-3">
          <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-bold text-brand">{i + 1}</span>
          <span className="text-sm text-ink"><span className="font-semibold">{t}.</span> <span className="text-muted">{d}</span></span>
        </li>
      ))}
    </ol>
  );
}

export default function TokenGuide() {
  return (
    <div className="max-w-2xl">
      <Link href="/connect" className="text-sm font-semibold text-brand">← Back to Connect</Link>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight">Connect once, sync forever</h1>
      <p className="mb-3 mt-1 text-muted">Create one <b>read-only</b> key that can be set to <b>never expire</b>, so AdPilot keeps your numbers fresh automatically — no more “session has expired”.</p>
      <ReadOnlyBadge />

      {/* Animated walkthrough */}
      <div className="mt-5 overflow-hidden rounded-2xl border border-border-subtle bg-surface-raised shadow-card">
        <video className="w-full" controls playsInline preload="metadata" poster="/guides/connect-token-poster.png">
          <source src="/guides/connect-token.mp4" type="video/mp4" />
          Your browser can’t play the guide video. Follow the written steps below.
        </video>
        <p className="px-4 py-2 text-2xs text-muted">▶ The 60-second animated walkthrough (Meta + TikTok). Read-only — AdPilot never edits, pauses, or creates ads.</p>
      </div>

      {/* Meta */}
      <div className="mt-6 rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-card">
        <h2 className="text-lg font-bold">🔵 Meta (Facebook / Instagram)</h2>
        <p className="mt-1 text-sm text-muted">Scopes: <code className="rounded bg-surface px-1">ads_read</code>, <code className="rounded bg-surface px-1">read_insights</code> (read-only).</p>
        <Steps steps={META_STEPS} />
        <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-brand">
          <a href="https://www.facebook.com/business/help/503306463479099" target="_blank" rel="noopener noreferrer" className="underline">Meta: create a System User ↗</a>
          <a href="https://developers.facebook.com/docs/marketing-api/overview/authorization/" target="_blank" rel="noopener noreferrer" className="underline">Meta Marketing API: access tokens ↗</a>
        </div>
      </div>

      {/* TikTok */}
      <div className="mt-4 rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-card">
        <h2 className="text-lg font-bold">⚫ TikTok Ads</h2>
        <p className="mt-1 text-sm text-muted">Scope: <code className="rounded bg-surface px-1">ads.read</code> (read-only).</p>
        <Steps steps={TIKTOK_STEPS} />
        <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-brand">
          <a href="https://business-api.tiktok.com/portal/docs" target="_blank" rel="noopener noreferrer" className="underline">TikTok Marketing API docs ↗</a>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link href="/connect" className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white">Paste my token on Connect →</Link>
        <span className="text-xs text-muted">Tokens are encrypted at rest (AES-256-GCM) and never sent back to your browser.</span>
      </div>
    </div>
  );
}
