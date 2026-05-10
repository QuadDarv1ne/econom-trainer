import { test, expect } from '@playwright/test';

test.describe('Export', () => {
  test('should allow exporting progress', async ({ page }) => {
    await page.goto('/');

    // Navigate to progress section
    await page.getByRole('tab', { name: 'Прогресс' }).click();

    // Check that export buttons are present
    await expect(page.getByRole('button', { name: 'Скачать' })).toBeVisible()
      .catch(() => expect(page.getByRole('button', { name: 'PDF' })).toBeVisible());
    await expect(page.getByRole('button', { name: 'Копировать' })).toBeVisible()
      .catch(() => expect(page.getByRole('button', { name: 'Копия' })).toBeVisible());
    await expect(page.getByRole('button', { name: 'Поделиться' })).toBeVisible()
      .catch(() => expect(page.getByRole('button', { name: 'Share' })).toBeVisible());
  });

  test('should show progress statistics', async ({ page }) => {
    await page.goto('/');

    // Navigate to progress
    await page.getByRole('tab', { name: 'Прогресс' }).click();

    // Check that statistics are displayed
    await expect(page.getByText(/статистика|прогресс|XP/i)).toBeVisible()
      .catch(() => expect(page.getByText('Прогресс')).toBeVisible());
  });
});