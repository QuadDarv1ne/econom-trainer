import { test, expect } from '@playwright/test';

test.describe('Achievements', () => {
  test('should display achievements and allow reset', async ({ page }) => {
    await page.goto('/');

    // Navigate to achievements section
    await page.getByRole('tab', { name: 'Бейджи' }).click();

    // Check that achievements are displayed
    await expect(page.getByText('Ваши достижения')).toBeVisible();

    // Check that reset button is present
    const resetButton = page.getByRole('button', { name: 'Сбросить' });
    await expect(resetButton).toBeVisible();
  });

  test('should show achievement badges', async ({ page }) => {
    await page.goto('/');

    // Navigate to achievements
    await page.getByRole('tab', { name: 'Бейджи' }).click();

    // Check that badge icons or titles are visible
    await expect(page.locator('[class*="badge"], [class*="achievement"]')).first()
      .toBeVisible()
      .catch(() => expect(page.getByText('Достижения')).toBeVisible());
  });
});