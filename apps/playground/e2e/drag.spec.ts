import { expect, test, type Locator, type Page } from '@playwright/test';

// Board 3's habittracker tile sits on an otherwise-empty bottom half, so dragging it down always
// lands somewhere free instead of getting rejected by a fully-packed grid.
async function goToBoardThree(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Board 3' }).click();
}

async function readRow(tile: Locator): Promise<string> {
  return tile.evaluate((el) => getComputedStyle(el).getPropertyValue('--bk-row'));
}

test('a mouse drag moves a tile to a new cell', async ({ page }) => {
  await goToBoardThree(page);
  const tile = page.locator('[data-bk-tile-id="t-habittracker"]');
  await expect(tile).toBeVisible();
  const rowBefore = await readRow(tile);

  // Drags start from the header strip only, not the widget body.
  const header = tile.locator('[data-bk-tile-header]');
  const headerBox = await header.boundingBox();
  const box = await tile.boundingBox();
  if (!box || !headerBox) throw new Error('tile has no layout box');
  const cx = headerBox.x + headerBox.width / 2;
  const cy = headerBox.y + headerBox.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx, cy + 10, { steps: 3 });
  await page.mouse.move(cx, cy + box.height + 5, { steps: 8 });
  await page.mouse.up();

  await expect.poll(() => readRow(tile)).not.toBe(rowBefore);
});
