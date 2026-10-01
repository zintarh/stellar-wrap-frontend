import type { StorybookConfig } from "@storybook/nextjs";

/**
 * Accessibility testing division of responsibility:
 *
 * - `@storybook/addon-a11y` runs axe-core against individual components in the
 *   Storybook UI. It is a developer feedback tool: violations are surfaced in
 *   the panel while authoring stories, but nothing fails when nobody is
 *   watching. It is NOT the CI gate.
 *
 * - `@axe-core/playwright` runs axe-core against fully rendered pages in the
 *   Playwright suite (see `e2e/a11y.spec.ts`). That is the automated CI gate:
 *   it fails the build on regressions against the recorded baseline in
 *   `e2e/a11y-baseline.json`.
 *
 * The addon stays enabled so component-level issues are caught early during
 * development; the Playwright check is what enforces the baseline in CI.
 *
 * Tracked accessibility issues verified by the automated check:
 *   #421, #426, #500
 */
const config: StorybookConfig = {
  stories: ["../app/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-a11y"],
  framework: {
    name: "@storybook/nextjs",
    options: {},
  },
  staticDirs: ["../public"],
};

export default config;
