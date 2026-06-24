import { defineConfig } from '@playwright/test';
import path from 'node:path';

const projectRoot = path.resolve(__dirname, '../..');
const frontendDir = path.join(projectRoot, 'frontend');

const EXPO_PORT = 8081;
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${EXPO_PORT}`;

export default defineConfig({
  testDir: __dirname,
  testMatch: '*.spec.ts',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  outputDir: path.join(projectRoot, 'tests/e2e-results'),
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: path.join(projectRoot, 'tests/e2e-report') }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: true,
    viewport: { width: 390, height: 844 },
  },
  webServer: process.env.CI
    ? undefined
    : {
        command: `npx expo start --web --port ${EXPO_PORT}`,
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        cwd: frontendDir,
      },
});
