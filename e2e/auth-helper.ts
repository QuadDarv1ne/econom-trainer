import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Credentials are created once in global-setup and shared across all tests
function getCredentials() {
  const credsPath = path.join(__dirname, '.e2e-credentials.json');
  if (!fs.existsSync(credsPath)) {
    throw new Error('E2E credentials not found. Make sure global-setup ran successfully.');
  }
  return JSON.parse(fs.readFileSync(credsPath, 'utf-8'));
}

/**
 * Login the shared E2E test user via the login page UI.
 */
export async function setupAuthenticatedUser(page: Page) {
  const { email, password } = getCredentials();
  await loginUser(page, email, password);
  return { email, password, name: 'E2E Test User' };
}

/**
 * Login an existing user via the login page UI.
 */
export async function loginUser(page: Page, email: string, password: string) {
  await page.goto('/auth/login');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: /войти|sign in|login/i }).click();

  await page.waitForURL((url) => !url.pathname.startsWith('/auth/login'), { timeout: 10000 });
}
