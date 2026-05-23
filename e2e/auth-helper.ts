import { Page, request } from '@playwright/test';

const TEST_USER_PASSWORD = 'TestPass123!';
const TEST_USER_NAME = 'E2E Test User';

// Shared registration cache within a test run
let cachedCredentials: { email: string; password: string; name: string } | null = null;

/**
 * Register a user directly via API. Email failure won't block registration.
 * Reuses cached credentials if available to avoid rate limiting.
 */
export async function registerViaApi() {
  if (cachedCredentials) return cachedCredentials;

  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;
  const apiContext = await request.newContext({
    baseURL: 'http://localhost:3000',
  });

  const response = await apiContext.post('/api/auth/register', {
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000' },
    data: { name: TEST_USER_NAME, email, password: TEST_USER_PASSWORD, phone: '+79991234567' },
  });

  await apiContext.dispose();

  const status = response.status();
  if (status === 409) {
    cachedCredentials = { email, password: TEST_USER_PASSWORD, name: TEST_USER_NAME };
    return cachedCredentials;
  }

  if (!response.ok()) {
    throw new Error(`Registration failed: ${status}`);
  }

  cachedCredentials = { email, password: TEST_USER_PASSWORD, name: TEST_USER_NAME };
  return cachedCredentials;
}

/**
 * Login an existing user via the login page UI.
 */
export async function loginUser(page: Page, email: string, password: string) {
  await page.goto('/auth/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Пароль', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Войти' }).click();

  await page.waitForURL((url) => !url.pathname.startsWith('/auth/login'), { timeout: 10000 });
}

/**
 * Register via API (once) and login via UI. All tests share the same user.
 */
export async function setupAuthenticatedUser(page: Page) {
  const credentials = await registerViaApi();
  await loginUser(page, credentials.email, credentials.password);
  return credentials;
}
