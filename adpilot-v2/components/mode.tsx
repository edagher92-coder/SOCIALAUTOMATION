"use client";
import { createContext, useContext, useEffect, useState } from "react";

export type Mode = "beginner" | "advanced";
type ModeCtx = {
  mode: Mode; setMode: (m: Mode) => void;
  helpTips: boolean; setHelpTips: (v: boolean) => void;
};
const Ctx = createContext<ModeCtx>({ mode: "beginner", setMode: () => {}, helpTips: true, setHelpTips: () => {} });

export function ModeProvider({ children, initialMode = "beginner" }: { children: React.ReactNode; initialMode?: Mode }) {
  const [mode, setModeState] = useState<Mode>(initialMode);
  // Plain-English "?" help tips. On by default (beginner-friendly); persisted so power users can hide them.
  const [helpTips, setHelpTips] = useState<boolean>(true);
  useEffect(() => {
    const m = (typeof localStorage !== "undefined" && localStorage.getItem("adpilot_mode")) as Mode | null;
    if (m === "beginner" || m === "advanced") setModeState(m);
    const h = typeof localStorage !== "undefined" ? localStorage.getItem("adpilot_help") : null;
    if (h === "off") setHelpTips(false);
  }, []);
  const setMode = (next: Mode) => {
    setModeState(next);
    try {
      localStorage.setItem("adpilot_mode", next);
      document.cookie = `adpilot_mode=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    } catch {}
  };
  useEffect(() => {
    try { localStorage.setItem("adpilot_help", helpTips ? "on" : "off"); } catch {}
  }, [helpTips]);
  return <Ctx.Provider value={{ mode, setMode, helpTips, setHelpTips }}>{children}</Ctx.Provider>;
}

export const useMode = () => useContext(Ctx);
export const useHelpTips = () => useContext(Ctx);
