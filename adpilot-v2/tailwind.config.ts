import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0b5fff",
          50:  "#eef3ff",
          100: "#dce7ff",
          200: "#bfd4ff",
          500: "#0b5fff",
          600: "#0952db",
          700: "#073db5",
        },
        navy: "#0b1f3a",
        command: "#0a1430",
        teal: {
          DEFAULT: "#00c2a8",
          50:  "#e6fbf6",
          100: "#ccf7ed",
        },
        ink: "#0d1626",
        muted: "#5a6577",
        surface: "#f7f9fc",
        "surface-raised": "#ffffff",
        "border-subtle": "#e3e8ef",
        "border-focus": "#0b5fff",
        band: {
          green:  "#16a34a",
          yellow: "#ca8a04",
          orange: "#ea580c",
          red:    "#dc2626",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      boxShadow: {
        card:  "0 1px 3px rgba(13,22,38,.06), 0 8px 24px rgba(13,22,38,.06)",
        "card-hover": "0 1px 3px rgba(13,22,38,.08), 0 12px 32px rgba(13,22,38,.10)",
        "ring-brand": "0 0 0 3px rgba(11,95,255,.18)",
        "inner-sm": "inset 0 1px 2px rgba(13,22,38,.06)",
      },
      transitionDuration: {
        "150": "150ms",
        "200": "200ms",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%":       { opacity: "0.6" },
        },
        "live-pulse": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%":       { opacity: "0.4", transform: "scale(0.85)" },
        },
      },
      animation: {
        "fade-in":     "fade-in 200ms ease both",
        "pulse-subtle": "pulse-subtle 1.5s ease-in-out infinite",
        "live-pulse":  "live-pulse 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
