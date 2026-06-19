"use client";
import InfoTip from "./InfoTip";
import { useHelpTips } from "./mode";

// Help-tip gate. Renders the accessible "?" InfoTip only when the user has help
// tips switched on (default on for beginners; toggle lives in the sidebar). Takes
// the same props as InfoTip, so it can be dropped in anywhere — including inside
// server components, since every prop is serialisable.
export default function Tip(props: React.ComponentProps<typeof InfoTip>) {
  const { helpTips } = useHelpTips();
  if (!helpTips) return null;
  return <InfoTip {...props} />;
}
