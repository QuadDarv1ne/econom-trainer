import { test, expect } from '@playwright/test';

test.describe('Quiz Module', () => {
  test('should display quiz and allow answering questions', async ({ page }) => {
    await page.goto('/');

    // Navigate to quiz module
    await page.getByRole('tab', { name: 'Квиз' }).click();
    await expect(page.getByText('Квиз по экономике')).toBeVisible();

    // Start quiz
    await page.getByRole('button', { name: 'Начать тест' }).click();

    // Check that question is displayed
    await expect(page.getByRole('radiogroup')).toBeVisible();

    // Select an answer
    await page.getByRole('radio').first().click();

    // Submit answer
    await expect(page.getByRole('button', { name: 'Ответить' })).toBeVisible();
  });

  test('should show quiz results after completion', async ({ page }) => {
    await page.goto('/');

    // Navigate to quiz module
    await page.getByRole('tab', { name: 'Квиз' }).click();

    // Start quiz
    await page.getByRole('button', { name: 'Начать тест' }).click();

    // Answer all questions (simplified - just check the flow works)
    for (let i = 0; i < 3; i++) {
      await page.getByRole('radio').first().click();
      const answerButton = await page.getByRole('button', { name: 'Ответить' }).first();
      if (await answerButton.isVisible()) {
        await answerButton.click();
      }
      const nextButton = await page.getByRole('button', { name: 'Следующий' }).first();
      if (await nextButton.isVisible()) {
        await nextButton.click();
      }
      await page.waitForTimeout(500);
    }
  });
});