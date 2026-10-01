/**
 * Vitest configuration for unit tests that require a browser-like DOM
 * environment (React hooks, browser APIs).
 *
 * Covers:
 *   - src/hooks/__tests__/useFreighterWallet.test.ts
 *   - src/utils/__tests__/stellarAmounts.test.ts
 *
 * Environment justification (issue #603):
 *   This suite is split from the integration config because it needs a
 *   jsdom environment plus the DOM/browser shims provided by
 *   `vitest.hooks.setup.ts` (e.g. `window`, `localStorage`, `matchMedia`).
 *   The integration suite runs under a Node environment and does not load
 *   those shims, so the two setups cannot be merged without either pulling
 *   jsdom into the integration run or dropping the browser shims here.
 *   The split is therefore an environment need, not a code-shape split.
 *
 * Run with:
 *   pnpm test:hooks
 */
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: [
      "src/hooks/__tests__/useFreighterWallet.test.ts",
      "src/utils/__tests__/stellarAmounts.test.ts",
    ],
    setupFiles: ["./vitest.hooks.setup.ts"],
  },
  resolve: {
    alias: [
      { find: "@/data", replacement: path.resolve(__dirname, "./src/data") },
      { find: "@", replacement: path.resolve(__dirname, "./") },
    ],
  },
});
