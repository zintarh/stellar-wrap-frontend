import { expect, test } from "@playwright/test";

const pages = [
  { name: "landing", path: "/visual-tests/mobile-viewport/landing" },
  { name: "connect", path: "/visual-tests/mobile-viewport/connect" },
  { name: "loading", path: "/visual-tests/mobile-viewport/loading" },
  { name: "persona", path: "/visual-tests/mobile-viewport/persona" },
  { name: "share", path: "/visual-tests/mobile-viewport/share" },
] as const;

test.describe("Mobile viewport visual regression", () => {
  for (const page of pages) {
    test(`${page.name} page matches mobile baseline`, async ({ page: browserPage }) => {
      await browserPage.goto(page.path);
      await expect(browserPage.locator("main, [data-testid]").first()).toHaveScreenshot(`${page.name}-mobile.png`);
    });
  }
});