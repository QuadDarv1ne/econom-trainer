import { test, expect } from '@playwright/test';

test.describe('Export', () => {
  test('should allow exporting progress', async ({ page }) => {
    await page.goto('/');

    // Navigate to progress section
    await page.getByRole('link', { name: 'Прогресс' }).click();

    // Check that export buttons are present
    await expect(page.getByRole('button', { name: 'Скачать' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Копировать' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Поделиться' })).toBeVisible();
  });
});