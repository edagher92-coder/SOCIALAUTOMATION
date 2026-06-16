"use client";
import { useMode } from "./mode";

// V6 P2 dual-mode primitive: render children only in a given view mode.
// "simple" maps to the provider's "beginner" value. Use it to keep Advanced-only sections out of
// the Simple 10-second view without duplicating pages. (Capability gating stays server-side via
// can(plan, feature); this is purely about which mode the user has chosen.)
export default function ModeAware({
  only,
  children,
  fallback = null,
}: {
  only: "simple" | "advanced";
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { mode } = useMode();
  const isAdvanced = mode === "advanced";
  const show = only === "advanced" ? isAdvanced : !isAdvanced;
  return <>{show ? children : fallback}</>;
}
