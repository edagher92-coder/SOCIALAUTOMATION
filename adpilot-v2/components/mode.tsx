"use client";
import { createContext, useContext, useEffect, useState } from "react";

export type Mode = "beginner" | "advanced";
const Ctx = createContext<{ mode: Mode; setMode: (m: Mode) => void }>({ mode: "beginner", setMode: () => {} });

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>("beginner");
  useEffect(() => {
    const m = (typeof localStorage !== "undefined" && localStorage.getItem("adpilot_mode")) as Mode | null;
    if (m === "beginner" || m === "advanced") setMode(m);
  }, []);
  useEffect(() => {
    try { localStorage.setItem("adpilot_mode", mode); } catch {}
  }, [mode]);
  return <Ctx.Provider value={{ mode, setMode }}>{children}</Ctx.Provider>;
}

export const useMode = () => useContext(Ctx);
