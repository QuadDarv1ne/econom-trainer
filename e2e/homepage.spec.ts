import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should display homepage with modules', async ({ page }) => {
    await page.goto('/');

    // Check that the page title is correct
    await expect(page).toHaveTitle(/Экономический тренажёр/);

    // Check that main heading is present
    await expect(page.getByRole('heading', { name: 'Экономический тренажёр' })).toBeVisible();

    // Check that modules are displayed
    await expect(page.getByText('Макроэкономика')).toBeVisible();
    await expect(page.getByText('Микроэкономика')).toBeVisible();
    await expect(page.getByText('Финансовая грамотность')).toBeVisible();
  });
});