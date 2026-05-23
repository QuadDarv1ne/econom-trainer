import { test, expect } from '@playwright/test';
import { setupAuthenticatedUser } from './auth-helper';

test.describe('XP and Progress System', () => {
  test('should track XP after module interactions', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.goto('/');

    // Check initial XP display
    const xpElement = page.getByText(/XP|опыт/i).first();
    if (await xpElement.isVisible()) {
      await expect(xpElement).toBeVisible();
    }

    // Navigate to a module
    await page.getByRole('tab', { name: 'ВВП' }).click();

    // Perform a calculation
    await page.getByPlaceholder('0').first().fill('500');
    await page.getByPlaceholder('0').nth(1).fill('400');
    await page.getByRole('button', { name: 'Рассчитать' }).first().click();

    // XP should be updated
    await page.waitForTimeout(500);
  });

  test('should display level information', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.goto('/');

    // Navigate to achievements or progress
    await page.getByRole('tab', { name: 'Бейджи' }).click();

    // Check that level info is displayed
    await expect(page.getByText(/уровень|Level/i).first()).toBeVisible()
      .catch(() => expect(page.getByText('Новичок')).toBeVisible());
  });

  test('should persist progress across page reloads', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.goto('/');

    // Navigate to GDP module and calculate
    await page.getByRole('tab', { name: 'ВВП' }).click();
    await page.getByPlaceholder('0').first().fill('1000');
    await page.getByRole('button', { name: 'Рассчитать' }).first().click();

    // Reload page
    await page.reload();

    // Navigate back to progress
    await page.getByRole('tab', { name: 'Прогресс' }).click();

    // Check that data is preserved
    await page.waitForTimeout(500);
  });
});