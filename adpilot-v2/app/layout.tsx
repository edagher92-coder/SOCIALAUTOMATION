import "./globals.css";
import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import { cookies } from "next/headers";
import { AuthFragmentBridge } from "@/components/auth-fragment-bridge";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: { default: "AdPilot OS — Explainable advertising operations", template: "%s · AdPilot OS" },
  description: "See what changed across Meta and TikTok, understand why, automate safe operations, and keep live paid-ad spend under human control.",
  applicationName: "AdPilot OS",
  openGraph: {
    title: "AdPilot OS — Explainable advertising operations",
    description: "One calm workspace for advertising health, creative workflows, reporting and guarded automation.",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "AdPilot OS", description: "Know what changed, why it matters and what to do next." },
};

export const viewport: Viewport = { themeColor: "#0c0f1a", colorScheme: "dark light" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // A fresh CSP nonce is generated for every request. Next can only attach that
  // nonce to its framework and hydration scripts during dynamic rendering.
  await connection();
  const cookieStore = await cookies();
  const theme = cookieStore.get("adpilot_theme")?.value === "light" ? "light" : "dark";
  return <html lang="en-AU" className={theme === "dark" ? "dark" : undefined} suppressHydrationWarning><body className="bg-surface font-sans text-ink antialiased"><AuthFragmentBridge />{children}</body></html>;
}
