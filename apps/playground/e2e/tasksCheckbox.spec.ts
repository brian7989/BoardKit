import { expect, test } from '@playwright/test';

test('a plain click toggles a task checkbox without starting a drag', async ({ page }) => {
  await page.goto('/');
  const tile = page.locator('[data-bk-tile-id="t-tasks"]');
  const checkbox = tile.getByRole('checkbox').first();
  const rowBefore = await tile.evaluate((el) => getComputedStyle(el).getPropertyValue('--bk-row'));
  const checkedBefore = await checkbox.isChecked();

  await checkbox.click();

  await expect(checkbox).toBeChecked({ checked: !checkedBefore });
  await expect(tile).not.toHaveAttribute('data-bk-active', 'true');
  await expect(tile).not.toHaveAttribute('data-bk-lifted', 'true');
  expect(await tile.evaluate((el) => getComputedStyle(el).getPropertyValue('--bk-row'))).toBe(rowBefore);
});
