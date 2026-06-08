import { request } from '@playwright/test';
import type { FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const TEST_USER_EMAIL = `e2e-test-${Date.now()}@example.com`;
const TEST_USER_PASSWORD = 'TestPass123!';
const TEST_USER_NAME = 'E2E Test User';

async function setup(config: FullConfig) {
  const apiContext = await request.newContext({
    baseURL: config.webServer?.url || 'http://localhost:3000',
  });

  // Try to register the test user
  const response = await apiContext.post('/api/auth/register', {
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000' },
    data: { name: TEST_USER_NAME, email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD, phone: '+79991234567' },
  });

  const status = response.status();
  if (status !== 201 && status !== 409) {
    console.error(`Failed to create test user: ${status}`);
    const body = await response.text();
    console.error(body);
  }

  await apiContext.dispose();

  // Store credentials in a temp file for tests to read
  const credsPath = path.join(__dirname, '.e2e-credentials.json');
  fs.writeFileSync(credsPath, JSON.stringify({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }));
}

export default setup;
