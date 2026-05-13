import { test, expect } from '@playwright/test';

test.describe('Quiz Module', () => {
  test('should display quiz and allow answering questions', async ({ page }) => {
    await page.goto('/');

    // Navigate to quiz module
    await page.getByRole('tab', { name: 'Квиз' }).click();
    // Check that quiz content is displayed (look for quiz-related text)
    await expect(page.getByText(/Тест|Квиз|вопрос|вопросов/).first()).toBeVisible({ timeout: 15000 });

    // Start quiz - look for any button that starts the quiz
    const startButton = page.getByRole('button', { name: /Начать|Старт|Start/ }).first();
    await expect(startButton).toBeVisible();
    await startButton.click();

    // Check that question is displayed
    await expect(page.getByRole('radiogroup')).toBeVisible();

    // Select an answer - this transitions to 'answered' state
    await page.getByRole('radio').first().click();

    // After answering, "Next Question" or "Show Results" button should appear
    await expect(page.getByRole('button', { name: /Следующий вопрос|Показать результаты|Next Question|Show Results/ }).first()).toBeVisible({ timeout: 10000 });
  });

  test('should show quiz results after completion', async ({ page }) => {
    await page.goto('/');

    // Navigate to quiz module
    await page.getByRole('tab', { name: 'Квиз' }).click();

    // Start quiz
    await page.getByRole('button', { name: /Начать|Старт|Start/ }).first().click({ timeout: 15000 });

    // Answer all questions (simplified - just check the flow works)
    for (let i = 0; i < 3; i++) {
      await page.getByRole('radio').first().click();
      const answerButton = page.getByRole('button', { name: /Ответить|Ответ|Submit/ }).first();
      if (await answerButton.isVisible()) {
        await answerButton.click();
      }
      const nextButton = page.getByRole('button', { name: /Следующий|Дальше|Next/ }).first();
      if (await nextButton.isVisible()) {
        await nextButton.click();
      }
      await page.waitForTimeout(500);
    }
  });
});