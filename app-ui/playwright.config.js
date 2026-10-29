import { defineConfig, devices } from '@playwright/test';

// Browser tests run against the production build (vite preview). vite preview proxies /v1.0 to a scripted mock of
// the app gateway (tests/e2e/mockGateway.mjs), the way nginx proxies it in the dashboard image, so no Garrison server
// is needed and the tests see real server-sent event timing.
const MOCK_PORT = 4791;

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './test-results/artifacts',
  timeout: 60000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4174',
    trace: 'retain-on-failure',
    acceptDownloads: true
  },
  webServer: [
    {
      command: `node tests/e2e/mockGateway.mjs ${MOCK_PORT}`,
      url: `http://127.0.0.1:${MOCK_PORT}/__mock/log`,
      reuseExistingServer: false,
      timeout: 30000
    },
    {
      command: 'npm run build && npx vite preview --port 4174 --host 127.0.0.1 --strictPort',
      url: 'http://127.0.0.1:4174/apps/',
      env: { GARRISON_API_URL: `http://127.0.0.1:${MOCK_PORT}` },
      reuseExistingServer: false,
      timeout: 180000
    }
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
