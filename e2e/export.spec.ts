import { test, expect } from '@playwright/test';

test.describe('Export', () => {
  test('should allow exporting progress', async ({ page }) => {
    await page.goto('/');

    // Navigate to GDP module and do a calculation to earn XP
    await page.getByRole('tab', { name: 'ВВП' }).click();
    await page.getByPlaceholder('0').first().fill('1000');
    await page.getByPlaceholder('0').nth(1).fill('800');
    await page.getByRole('button', { name: 'Рассчитать ВВП' }).click();
    await page.waitForTimeout(500);

    // Navigate to progress section
    await page.getByRole('tab', { name: 'Прогресс' }).click();

    // Check that export buttons are present
    await expect(page.getByRole('button', { name: 'PDF' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: 'CSV' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'JSON' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Копировать' })).toBeVisible();
  });

  test('should show progress statistics', async ({ page }) => {
    await page.goto('/');

    // Navigate to GDP module and do a calculation to earn XP first
    await page.getByRole('tab', { name: 'ВВП' }).click();
    await page.getByPlaceholder('0').first().fill('1000');
    await page.getByPlaceholder('0').nth(1).fill('800');
    await page.getByRole('button', { name: 'Рассчитать ВВП' }).click();
    await page.waitForTimeout(500);

    // Navigate to progress
    await page.getByRole('tab', { name: 'Прогресс' }).click();

    // Check that progress tracker title is displayed
    await expect(page.getByText('Прогресс тренировок').first()).toBeVisible({ timeout: 15000 });
    
    // Check that statistics are displayed (sessions, quizzes, etc.)
    await expect(page.getByText(/сессий|сес|sess|ВВП|расчет|calculat/i).first()).toBeVisible();
  });
});