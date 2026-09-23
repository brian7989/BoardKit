import { expect, test } from '@playwright/test';

test('renders tiles for the seeded board', async ({ page }) => {
  await page.goto('/');
  const tiles = page.locator('[data-bk-tile-id]');
  await expect(tiles.first()).toBeVisible();
  expect(await tiles.count()).toBeGreaterThan(1);
  await expect(page.locator('[data-bk-tile-id="t-weather"]')).toBeVisible();
});
