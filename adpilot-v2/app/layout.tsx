import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AdPilot OS V2 — Meta & TikTok Ads Health",
  description:
    "Audit your Meta & TikTok ads, get an explainable Campaign Health Score and safe recommendations — never edits a live ad.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#f4f7fb] text-ink font-sans antialiased">{children}</body>
    </html>
  );
}
