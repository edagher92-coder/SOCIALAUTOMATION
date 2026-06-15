import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#0b5fff",
        navy: "#0b1f3a",
        teal: "#00c2a8",
        ink: "#0d1626",
        muted: "#5a6577",
        band: {
          green: "#16a34a",
          yellow: "#ca8a04",
          orange: "#ea580c",
          red: "#dc2626",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(13,22,38,.06), 0 8px 24px rgba(13,22,38,.06)",
      },
    },
  },
  plugins: [],
};
export default config;
