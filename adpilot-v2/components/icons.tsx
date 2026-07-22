// AdPilot OS V7 — zero-dependency SVG icon set (Cockpit P1).
// Replaces emoji as the carrier of meaning in nav, verdict chips and status surfaces.
// 24px grid, stroke-based, currentColor — recolorable, weight-consistent, OS-independent.

import type { SVGProps } from "react";

export type IconName = keyof typeof PATHS;

// Each entry is the inner SVG markup on a 24×24 grid (stroke handled by the wrapper).
const PATHS = {
  radar: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4.5" /><path d="M12 12l6.5-6.5" /><circle cx="12" cy="12" r="0.5" fill="currentColor" /></>,
  "check-circle": <><circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.5 2.5 4.5-5.5" /></>,
  gauge: <><path d="M4 14a8 8 0 1 1 16 0" /><path d="M12 14l3.5-3.5" /><path d="M4 18h16" /></>,
  link: <><path d="M9.5 14.5l5-5" /><path d="M8 16l-1.5 1.5a3.5 3.5 0 0 1-5-5L4 10" transform="translate(3 -1)" /><path d="M16 8l1.5-1.5a3.5 3.5 0 0 1 5 5L20 14" transform="translate(-3 1)" /></>,
  tag: <><path d="M3.5 3.5h7l10 10-7 7-10-10z" /><circle cx="8" cy="8" r="1.4" /></>,
  wrench: <><path d="M14.5 6.5a4 4 0 0 0-5.4 5L4 16.6a2 2 0 1 0 2.8 2.8l5.1-5.1a4 4 0 0 0 5-5.4l-2.6 2.6-2.3-2.3z" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /></>,
  clapper: <><rect x="3.5" y="8" width="17" height="12" rx="2" /><path d="M3.5 8l2-4h15l-2 4" /><path d="M8.5 4.5l-1.6 3.4M13.5 4.5l-1.6 3.4M18.5 4.5l-1.6 3.4" /></>,
  rocket: <><path d="M12 15c4-3 6.5-7 6.5-11-4 0-8 2.5-11 6.5L4 11l3 3z" transform="translate(1.5 1.5)" /><path d="M6.5 17.5c-1.5.5-2.5 3-2.5 3s2.5-1 3-2.5" /><circle cx="14" cy="9.5" r="1.4" /></>,
  calendar: <><rect x="4" y="5.5" width="16" height="15" rx="2" /><path d="M4 10h16M8.5 3.5v3.5M15.5 3.5v3.5" /></>,
  image: <><rect x="3.5" y="5" width="17" height="14" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M4.5 17.5l4.5-4.5 3 3 3.5-3.5 4 4" /></>,
  scorecard: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 16v-4M12 16V8M16 16v-6" /></>,
  palette: <><path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.4 0 2-.9 2-1.8 0-1.5-1.5-1.7-1.5-3 0-1.2 1-1.7 2.5-1.7h2A3.5 3.5 0 0 0 20.5 10 8.5 8.5 0 0 0 12 3.5z" /><circle cx="8" cy="10" r="1" fill="currentColor" /><circle cx="12" cy="7.5" r="1" fill="currentColor" /><circle cx="16" cy="10" r="1" fill="currentColor" /></>,
  chat: <><path d="M20 12a8 8 0 1 0-3.1 6.3L20.5 19l-.9-3.2A7.9 7.9 0 0 0 20 12z" /></>,
  users: <><circle cx="9" cy="8.5" r="3.2" /><path d="M3.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" /><path d="M15.5 5.8a3.2 3.2 0 0 1 0 5.4M17.5 14.9c1.8.7 3 2.3 3 4.6" /></>,
  "file-text": <><path d="M6 3.5h8l4 4v13H6z" /><path d="M14 3.5v4h4M9 12h6M9 15.5h6" /></>,
  compass: <><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5z" /></>,
  shield: <><path d="M12 3.5l7 2.5v5c0 4.5-3 8-7 9.5-4-1.5-7-5-7-9.5V6z" /><path d="M9 12l2 2 4-4.5" /></>,
  briefcase: <><rect x="3.5" y="8" width="17" height="11.5" rx="2" /><path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3.5 13h17" /></>,
  "graduation-cap": <><path d="M12 4.5L2.5 9 12 13.5 21.5 9z" /><path d="M6.5 11.5v4c0 1.5 2.5 3 5.5 3s5.5-1.5 5.5-3v-4M21.5 9v5" /></>,
  sparkle: <><path d="M12 4l1.8 5.2L19 11l-5.2 1.8L12 18l-1.8-5.2L5 11l5.2-1.8z" /><path d="M18.5 16.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" /></>,
  blocks: <><rect x="4" y="4" width="7" height="7" rx="1.2" /><rect x="13" y="4" width="7" height="7" rx="1.2" /><rect x="4" y="13" width="7" height="7" rx="1.2" /><rect x="13" y="13" width="7" height="7" rx="1.2" /></>,
  "credit-card": <><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="M3 10h18M6.5 14.5h4" /></>,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M12 3.5v2.4M12 18.1v2.4M3.5 12h2.4M18.1 12h2.4M6 6l1.7 1.7M16.3 16.3L18 18M18 6l-1.7 1.7M7.7 16.3L6 18" /></>,
  bell: <><path d="M12 4a5.5 5.5 0 0 1 5.5 5.5c0 4 1.5 5.5 2 6H4.5c.5-.5 2-2 2-6A5.5 5.5 0 0 1 12 4z" /><path d="M10 18.5a2 2 0 0 0 4 0" /></>,
  plug: <><path d="M9 3.5V8M15 3.5V8" /><path d="M6.5 8h11v3a5.5 5.5 0 0 1-11 0z" /><path d="M12 16.5v4" /></>,
  book: <><path d="M5 4.5h11a2.5 2.5 0 0 1 2.5 2.5v12.5H7A2 2 0 0 1 5 17.5z" /><path d="M5 17.5A2 2 0 0 1 7 15.5h11.5" /></>,
  lock: <><rect x="5.5" y="10.5" width="13" height="9.5" rx="2" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" /></>,
  flame: <><path d="M12 3.5c1 3-4 4.5-4 9a4.6 4.6 0 0 0 4.6 4.6A4.4 4.4 0 0 0 17 12.7c0-1.4-.6-2.4-1.2-3.2-.4 1-.8 1.5-1.6 1.9.4-3.2-.5-6.2-2.2-7.9z" transform="translate(0 1.5)" /></>,
  "trend-up": <><path d="M3.5 17.5l5.5-5.5 3.5 3.5 8-8.5" /><path d="M15 7h5.5v5.5" /></>,
  "trend-down": <><path d="M3.5 6.5L9 12l3.5-3.5 8 8.5" /><path d="M15 17h5.5v-5.5" /></>,
  "alert-triangle": <><path d="M12 4L2.8 19.5h18.4z" /><path d="M12 10v4M12 16.8v.4" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.6v.4" /></>,
  pause: <><circle cx="12" cy="12" r="9" /><path d="M9.5 8.5v7M14.5 8.5v7" /></>,
  refresh: <><path d="M4.5 12a7.5 7.5 0 0 1 13-5L20 9.5" /><path d="M20 4.5v5h-5" /><path d="M19.5 12a7.5 7.5 0 0 1-13 5L4 14.5" /><path d="M4 19.5v-5h5" /></>,
  scale: <><path d="M12 4v16M5 20h14" /><path d="M12 6.5l6 3.5-6 3.5-6-3.5z" transform="translate(0 -1)" /></>,
  scissors: <><circle cx="6.5" cy="7" r="2.5" /><circle cx="6.5" cy="17" r="2.5" /><path d="M8.6 8.4L20 18M8.6 15.6L20 6" /></>,
  hourglass: <><path d="M6.5 4h11M6.5 20h11M7.5 4c0 6 4.5 5.5 4.5 8s-4.5 2-4.5 8M16.5 4c0 6-4.5 5.5-4.5 8s4.5 2 4.5 8" /></>,
  satellite: <><rect x="9" y="9" width="6" height="6" rx="1" transform="rotate(45 12 12)" /><path d="M5 5l3.5 3.5M19 19l-3.5-3.5M16 4.5L19.5 8M4.5 16L8 19.5" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5L21 21" /></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  x: <><path d="M6 6l12 12M18 6L6 18" /></>,
  "more-horizontal": <><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></>,
  "log-out": <><path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9" /></>,
  sliders: <><path d="M4 6h7M15 6h5M4 12h3M11 12h9M4 18h10M18 18h2" /><circle cx="13" cy="6" r="2" /><circle cx="9" cy="12" r="2" /><circle cx="16" cy="18" r="2" /></>,
  "chevron-right": <path d="M9 5l7 7-7 7" />,
  activity: <><path d="M3 12h4l2.2-5 4.2 10 2.1-5H21" /></>,
  eye: <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" /><circle cx="12" cy="12" r="2.5" /></>,
  upload: <><path d="M12 16V4M7.5 8.5L12 4l4.5 4.5M5 19.5h14" /></>,
  download: <><path d="M12 4v12M7.5 11.5L12 16l4.5-4.5M5 19.5h14" /></>,
  key: <><circle cx="8" cy="12" r="4" /><path d="M12 12h9M17 12v3M20 12v2" /></>,
  sun: <><circle cx="12" cy="12" r="3.5" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" /></>,
  moon: <path d="M20 15.3A8.5 8.5 0 0 1 8.7 4a8.5 8.5 0 1 0 11.3 11.3z" />,
} as const;

export function Icon({ name, size = 18, strokeWidth = 1.75, ...rest }: { name: IconName; size?: number; strokeWidth?: number } & Omit<SVGProps<SVGSVGElement>, "name">) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false" {...rest}>
      {PATHS[name]}
    </svg>
  );
}

// Verdict → icon + semantic tone, shared by cockpit surfaces (single source of truth so a
// verdict never renders with mismatched icon/colour).
export const VERDICT_ICON: Record<string, { icon: IconName; tone: "bad" | "warn" | "good" | "muted" }> = {
  "fix-tracking":        { icon: "wrench",     tone: "warn" },
  kill:                  { icon: "pause",      tone: "bad" },
  reduce:                { icon: "scissors",   tone: "warn" },
  refresh:               { icon: "refresh",    tone: "warn" },
  scale:                 { icon: "scale",      tone: "good" },
  keep:                  { icon: "check-circle", tone: "good" },
  duplicate:             { icon: "blocks",     tone: "good" },
  "insufficient-data":   { icon: "hourglass",  tone: "muted" },
};
