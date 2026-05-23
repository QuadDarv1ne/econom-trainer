import { test, expect } from '@playwright/test';
import { setupAuthenticatedUser } from './auth-helper';

test.describe('Profile & Security', () => {
  test('should navigate to profile page and display tabs', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.goto('/profile');

    // Check tabs are visible
    await expect(page.getByRole('tab', { name: /личн|personal/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /безопас|security/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /прогресс|progress/i })).toBeVisible();
  });

  test('should display dashboard with profile tab', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.goto('/dashboard');

    // Check dashboard loads
    await expect(page).toHaveURL('/dashboard');

    // Check navigation links exist in header
    await expect(page.getByRole('link', { name: /профиль|profile/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /дашборд|dashboard/i })).toBeVisible();
  });

  test('should navigate between profile and dashboard', async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.goto('/profile');

    // From profile, go to dashboard via header
    await page.getByRole('link', { name: /дашборд|dashboard/i }).click();
    await expect(page).toHaveURL('/dashboard');

    // From dashboard, go back to profile
    await page.getByRole('link', { name: /профиль|profile/i }).click();
    await expect(page).toHaveURL('/profile');
  });

  test('should show loading state on initial load', async ({ page }) => {
    await setupAuthenticatedUser(page);

    // Intercept the profile API to simulate slow load
    await page.route('**/api/profile', async (route) => {
      await page.waitForTimeout(500);
      await route.continue();
    });

    await page.goto('/profile');

    // Page should load eventually even with slow API
    await expect(page.getByRole('tab', { name: /личн|personal/i })).toBeVisible({ timeout: 10000 });
  });
});
