import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: { default: "AdPilot OS — Meta & TikTok Ads Health", template: "%s · AdPilot OS" },
  description:
    "Audit your Meta & TikTok ads, get an explainable Campaign Health Score and safe recommendations — never edits a live ad.",
  applicationName: "AdPilot OS",
  openGraph: {
    title: "AdPilot OS — Meta & TikTok Ads Health",
    description: "Explainable Campaign Health Score + safe, numbers-first recommendations. Read-only.",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "AdPilot OS", description: "Meta & TikTok ads health — explainable & safe." },
};

export const viewport = { themeColor: "#161221" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-surface text-ink font-sans antialiased">{children}</body>
    </html>
  );
}
