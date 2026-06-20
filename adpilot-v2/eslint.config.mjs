import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

// ESLint 9 flat config. Next.js 16 removed the `next lint` command, so `npm run lint` now runs
// the ESLint CLI directly against this config. It mirrors the previous `.eslintrc.json`
// (`next/core-web-vitals` + the same three intentional relaxations), and pins two net-new
// experimental React Compiler rules back off to preserve the project's pre-upgrade strictness.
export default [
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts", "coverage/**"] },
  ...nextCoreWebVitals,
  {
    rules: {
      // Carried over verbatim from the old .eslintrc.json — intentional project relaxations.
      "@next/next/no-img-element": "off",
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/no-explicit-any": "off",
      // Net-new EXPERIMENTAL React Compiler rules introduced by eslint-config-next@16. They fire
      // on intentional, correct patterns the app relies on (standard localStorage hydration inside
      // effects; `window.location.href = …` redirects), so they're relaxed rather than used to
      // churn working code. Re-enable deliberately if/when the codebase adopts the React Compiler.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
    },
  },
  // Config files legitimately use anonymous default exports.
  { files: ["**/*.config.{js,mjs,cjs}"], rules: { "import/no-anonymous-default-export": "off" } },
];
