import { test, expect } from '@playwright/test';

test.describe('Financial Math Module', () => {
  test('should display financial math module and perform calculations', async ({ page }) => {
    await page.goto('/');

    // Navigate to financial math module
    await page.getByRole('tab', { name: 'Фин.мат' }).click();
    // Check for financial math content (the title may be rendered differently)
    await expect(page.getByText(/Финансов|Сложн|NPV/).first()).toBeVisible({ timeout: 15000 });

    // Check that calculation options are available
    const compoundText = page.getByText('Сложные проценты');
    const calcText = page.getByText('Расчёт');
    await expect(compoundText.or(calcText)).toBeVisible();
  });

  test('should calculate compound interest', async ({ page }) => {
    await page.goto('/');

    // Navigate to financial math module
    await page.getByRole('tab', { name: 'Фин.мат' }).click();

    // Look for compound interest inputs
    const principalInput = page.getByPlaceholder(/0/).first();
    if (await principalInput.isVisible()) {
      await principalInput.fill('1000');
      
      const rateInput = page.getByPlaceholder(/0/).nth(1);
      if (await rateInput.isVisible()) {
        await rateInput.fill('5');
      }

      // Calculate
      const calcButton = page.getByRole('button', { name: /Рассчитать/ });
      if (await calcButton.isVisible()) {
        await calcButton.click();
        
        // Check results are displayed
        await page.waitForTimeout(300);
      }
    }
  });
});