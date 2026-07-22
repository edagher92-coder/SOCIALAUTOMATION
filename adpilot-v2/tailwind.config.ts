import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Warm coral primary — creator energy, friendly for small businesses.
        brand: {
          DEFAULT: "rgb(var(--color-brand) / <alpha-value>)",
          50:  "rgb(var(--color-brand-50) / <alpha-value>)",
          100: "rgb(var(--color-brand-100) / <alpha-value>)",
          200: "rgb(var(--color-brand-200) / <alpha-value>)",
          500: "rgb(var(--color-brand) / <alpha-value>)",
          600: "rgb(var(--color-brand-600) / <alpha-value>)",
          700: "rgb(var(--color-brand-700) / <alpha-value>)",
        },
        // Amber/gold accent for the signature warm gradient lives on the `teal` token
        // below (kept that name so existing gradient/accent classes warm up). Tailwind's
        // built-in `amber` scale is left intact for incidental UI (e.g. the safety notice).
        navy: "#211a2e",      // warm dark (was cool navy)
        command: "#161221",   // warm near-black for the Command Center
        // `teal` retained as a token name but recoloured to the warm amber accent,
        // so existing `from-brand to-teal` gradients and accents warm up automatically.
        teal: {
          DEFAULT: "#ffb224",
          50:  "#fff8ea",
          100: "#ffedc7",
        },
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        "surface-raised": "rgb(var(--color-surface-raised) / <alpha-value>)",
        "border-subtle": "rgb(var(--color-border-subtle) / <alpha-value>)",
        "border-focus": "rgb(var(--color-brand) / <alpha-value>)",
        band: {
          green:  "#16a34a",
          yellow: "#ca8a04",
          orange: "#ea580c",
          red:    "#dc2626",
        },
        // V7 "Warm Cockpit" — dark money-surface tokens (Mission Control & co). Semantic
        // good/warn/bad are the ONLY status carriers on cockpit surfaces; brand coral stays
        // reserved for actions/CTAs so "action" and "alarm" never blur.
        cockpit: {
          DEFAULT: "#0e1220",   // cockpit page background
          raised:  "#161b2e",   // cockpit card/panel
          edge:    "#242b42",   // cockpit border/divider
          ink:     "#eef1f8",   // primary text on cockpit
          muted:   "#8b93ab",   // secondary text on cockpit
        },
        good: "#37d399",
        warn: "#ffb84d",
        bad:  "#ff6b6b",
        ice:  "#56c5ff",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      boxShadow: {
        card:  "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
        "ring-brand": "0 0 0 3px rgba(201,63,40,.20)",
        glow: "0 12px 40px -8px rgba(201,63,40,.32)",   // warm coral glow for hero CTAs
        "inner-sm": "var(--shadow-inner)",
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
