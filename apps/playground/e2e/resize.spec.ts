import { expect, test } from '@playwright/test';

test('the tile menu resizes a tile', async ({ page }) => {
  await page.goto('/');
  const tile = page.locator('[data-bk-tile-id="t-tasks"]');
  const before = await tile.boundingBox();
  if (!before) throw new Error('tile has no layout box');

  await tile.getByRole('button', { name: /Options for/ }).click();
  await page.getByRole('menu').getByText('2×1', { exact: true }).click();

  await expect.poll(async () => (await tile.boundingBox())?.height).toBeLessThan(before.height);
});
