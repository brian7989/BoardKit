import { expect, test } from '@playwright/test';

// Chromium needs a 250ms still hold to start a touch drag, so we use raw CDP events
// instead of page.touchscreen which can't maintain a fixed position.
test.describe(() => {
  test.use({ hasTouch: true });

  test('a touch long-press lifts the tile for dragging', async ({ page, context }) => {
    await page.goto('/');
    const tile = page.locator('[data-bk-tile-id="t-weather"]');
    const box = await tile.boundingBox();
    if (!box) throw new Error('tile has no layout box');
    const x = Math.round(box.x + box.width / 2);
    // Press the header strip: floating tiles may cover the body's center.
    const y = Math.round(box.y + 16);

    const cdp = await context.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
    try {
      await expect.poll(() => tile.getAttribute('data-bk-lifted'), { timeout: 2000 }).toBe('true');
    } finally {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    }
  });
});
