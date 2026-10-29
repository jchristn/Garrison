import { defineConfig, devices } from '@playwright/test';

// Runs the e2e suite against a running dashboard image instead of vite preview, to check the nginx side: the app
// UI at /apps/{slug}/, the SPA fallback, the Content-Security-Policy, and /v1.0/apps/ proxied with streaming intact.
// Start the image with the mock gateway on the host as its upstream, then run this config:
//   docker build -f dashboard/Dockerfile -t garrison-dashboard:local .          (from the repository root)
//   docker run --rm -p 127.0.0.1:18080:80 -e GARRISON_API_UPSTREAM=http://host.docker.internal:4791 garrison-dashboard:local
//   npx playwright test --config playwright.image.config.js
// GARRISON_APP_UI_URL overrides the image address (default http://127.0.0.1:18080).
const MOCK_PORT = 4791;

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './test-results/image',
  timeout: 60000,
  fullyParallel: false,
  workers: 1,
  // Through nginx in a container, a request can occasionally race a revoked session; retry once before failing.
  retries: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.GARRISON_APP_UI_URL || 'http://127.0.0.1:18080',
    trace: 'retain-on-failure',
    acceptDownloads: true
  },
  webServer: {
    command: `node tests/e2e/mockGateway.mjs ${MOCK_PORT}`,
    url: `http://127.0.0.1:${MOCK_PORT}/__mock/log`,
    reuseExistingServer: false,
    timeout: 30000
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
