import { expect, test } from "@playwright/test";

test.describe("Reduced-motion rendering", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  test("LandingPage: ambient layers stay static and decorative motion is removed", async ({ page }) => {
    await page.goto("/");

    // Ambient layers stay rendered but static under reduced motion.
    const staticElements = [
      "animated-scan-lines",
      "animated-glow-1",
      "animated-glow-2",
      "animated-glow-3",
    ];

    for (const id of staticElements) {
      await expect(page.getByTestId(id)).toBeVisible();
    }

    // Purely decorative motion layers are not rendered at all.
    const removedElements = [
      "animated-node-0",
      "animated-svg-lines",
      "animated-block-chain",
      "animated-tx-flow",
    ];

    for (const id of removedElements) {
      await expect(page.getByTestId(id)).toHaveCount(0);
    }

    await expect(page.getByTestId("live-wrap-counter")).toBeVisible();
  });

  test("Loading page: progress indicators remain visible under reduced motion", async ({ page }) => {
    await page.goto("/loading");

    await expect(page.getByTestId("progress-indicator")).toBeVisible();
    await expect(page.getByTestId("step-progress-display")).toBeVisible();
  });
});
