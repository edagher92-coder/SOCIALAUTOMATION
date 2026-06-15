import { defineConfig } from "vitest/config";
import path from "node:path";

// Test config. Aliases the `server-only` marker package (which is not installed
// and would otherwise fail to resolve under Node) to an empty shim so server-side
// modules can be imported directly in unit tests. Also wires the `@/*` path alias
// used across the app so future tests can rely on it.
export default defineConfig({
  resolve: {
    alias: {
      "server-only": path.resolve(__dirname, "test/server-only-shim.ts"),
      "@": path.resolve(__dirname, "."),
    },
  },
});
