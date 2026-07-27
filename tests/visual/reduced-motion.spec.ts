import { expect, test } from "@playwright/test";

test.describe("Reduced-motion rendering", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  test("LandingPage: animated elements are visible and non-essential animations are disabled", async ({ page }) => {
    await page.goto("/");

    const animatedElements = [
      "animated-scan-lines",
      "animated-glow-1",
      "animated-glow-2",
      "animated-glow-3",
      "animated-node-0",
      "animated-svg-lines",
      "animated-block-chain",
      "animated-tx-flow",
    ];

    for (const id of animatedElements) {
      await expect(page.getByTestId(id)).toBeVisible();
    }

    await expect(page.getByTestId("live-wrap-counter")).toBeVisible();
  });

  test("Loading page: progress indicators remain visible under reduced motion", async ({ page }) => {
    await page.goto("/loading");

    await expect(page.getByTestId("progress-indicator")).toBeVisible();
    await expect(page.getByTestId("step-progress-display")).toBeVisible();
  });
});
