"use client";

import { useEffect, useState } from "react";
import { Icon } from "./icons";

type Theme = "dark" | "light";

function readTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => setTheme(readTheme()), []);

  function toggleTheme() {
    const nextTheme: Theme = readTheme() === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    document.cookie = `adpilot_theme=${nextTheme}; Path=/; Max-Age=31536000; SameSite=Lax`;
    setTheme(nextTheme);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex w-full items-center justify-between rounded-xl border border-border-subtle bg-surface-raised px-3 py-2 text-xs font-bold text-ink shadow-sm hover:border-brand-200"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <span className="flex items-center gap-2"><Icon name={theme === "dark" ? "moon" : "sun"} size={15} /> Appearance</span>
      <span className="text-[10px] font-semibold text-muted">{theme === "dark" ? "Dark" : "Light"}</span>
    </button>
  );
}
