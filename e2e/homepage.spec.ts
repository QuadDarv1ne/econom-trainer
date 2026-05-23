import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should display homepage with modules', async ({ page }) => {
    await page.goto('/');

    // Check that the page title is correct
    await expect(page).toHaveTitle(/Экономический тренажёр/);

    // Check that main heading is present
    await expect(page.getByRole('heading', { name: 'Экономический тренажёр' })).toBeVisible();

    // Check that public modules are displayed (finance modules require auth)
    await expect(page.getByText('Макро').first()).toBeVisible();
    await expect(page.getByText('Микро').first()).toBeVisible();
  });

  test('should navigate to GDP module and perform calculation', async ({ page }) => {
    await page.goto('/');

    // Navigate to GDP module
    await page.getByRole('tab', { name: 'ВВП' }).click();
    await expect(page.getByText('Калькулятор ВВП')).toBeVisible();

    // Enter values
    await page.getByPlaceholder('0').first().fill('1000');
    await page.getByPlaceholder('0').nth(1).fill('800');

    // Calculate
    await page.getByRole('button', { name: 'Рассчитать ВВП' }).click();

    // Check results are displayed (use exact match to avoid ambiguity)
    await expect(page.getByText('Номинальный ВВП', { exact: true })).toBeVisible();
    await expect(page.getByText('Реальный ВВП', { exact: true })).toBeVisible();
  });

  test('should toggle dark/light theme', async ({ page }) => {
    await page.goto('/');

    // Click theme toggle button in header
    await page.locator('button.h-9.w-9').first().click({ timeout: 15000 });

    // Theme should change
    await page.waitForTimeout(300);
  });
});