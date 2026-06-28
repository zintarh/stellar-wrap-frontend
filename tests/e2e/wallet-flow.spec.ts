import { test, expect } from '@playwright/test';
import mockData from '../fixtures/horizon-mocks.json';

test.describe('Full wallet connect → share flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Horizon API responses
    await page.route('**/accounts/*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockData.mockResponses.accounts)
      });
    });
    await page.route('**/operations**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockData.mockResponses.operations)
      });
    });
  });

  test('happy path: manual address entry → indexing → share', async ({ page }) => {
    await page.goto('/connect');

    // Enter address manually
    const addressInput = page.locator('input[placeholder*="address"]');
    await addressInput.fill(mockData.validAddress);
    await page.click('button:has-text("Connect")');

    // Loading page: progress bar
    await expect(page).toHaveURL(/\/loading/);
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();

    // Wait for indexing
    await page.waitForURL(/\/top-daps|\/transactions-of-fury/, { timeout: 30000 });

    // Navigate through story cards
    await page.click('text=Continue');
    await expect(page).toHaveURL(/\/vibe-check/);

    // Verify vibe-check stats
    await expect(page.locator('text=Stats')).toBeVisible();
    await expect(page.locator('[data-testid="stat-card"]')).toHaveCount(3);

    // Continue to persona
    await page.click('text=Next');
    await expect(page).toHaveURL(/\/persona/);
    await expect(page.locator('[data-testid="persona-card"]')).toBeVisible();

    // Continue to share
    await page.click('text=Share');
    await expect(page).toHaveURL(/\/share/);

    // Verify share card preview
    await expect(page.locator('[data-testid="share-card"]')).toBeVisible();

    // Test Download as PNG
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download as PNG")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.png$/);
  });

  test('error path: invalid address shows error', async ({ page }) => {
    await page.goto('/connect');
    await page.fill('input[placeholder*="address"]', mockData.invalidAddress);
    await page.click('button:has-text("Connect")');
    await expect(page.locator('text=Invalid address')).toBeVisible();
  });

  test('cancellation path: cancel indexing returns to connect', async ({ page }) => {
    await page.goto('/connect');
    await page.fill('input[placeholder*="address"]', mockData.validAddress);
    await page.click('button:has-text("Connect")');
    await expect(page).toHaveURL(/\/loading/);
    await page.click('button:has-text("Cancel")');
    await expect(page).toHaveURL(/\/connect/);
  });
});