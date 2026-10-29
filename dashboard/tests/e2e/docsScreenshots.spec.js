// Screenshots of the studio canvas for docs/STUDIO.md (AD8.7), taken from the mocked studio with the fake-harness
// example draft (tests/e2e/canvasMocks.js). Skipped unless GARRISON_DOCS_SCREENSHOTS=1, so the normal suite never
// rewrites the images:
//
//   GARRISON_DOCS_SCREENSHOTS=1 npx playwright test tests/e2e/docsScreenshots.spec.js

import path from 'path';
import { test, expect } from '@playwright/test';
import { installMocks } from './mocks.js';
import { installCanvasMocks } from './canvasMocks.js';

const OUT = path.resolve(process.cwd(), '..', 'docs', 'images');

test.skip(!process.env.GARRISON_DOCS_SCREENSHOTS, 'Set GARRISON_DOCS_SCREENSHOTS=1 to refresh the documentation screenshots.');
test.use({ viewport: { width: 1440, height: 1700 } });

async function login(page) {
  await page.goto('/');
  await page.locator('#tenantId').fill('default');
  await page.locator('#email').fill('admin@garrison');
  await page.locator('#password').fill('password');
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
}

test('studio canvas screenshots', async ({ page }) => {
  await installMocks(page);
  const { state } = await installCanvasMocks(page);
  // The example app with an editor the writer calls, laid out by hand.
  const app = state.items.find((i) => i.kind === 'AgenticApp');
  app.document = app.document.replace('    - agent: writer\n', '    - agent: writer\n    - agent: editor\n').replace('  authMode:', '    - from: writer\n      to: editor\n      fanOut: false\n  authMode:');
  state.layout = [
    { nodeKey: 'Agent/planner', x: 20, y: 120 },
    { nodeKey: 'Agent/researcher', x: 300, y: 20 },
    { nodeKey: 'Agent/writer', x: 300, y: 220 },
    { nodeKey: 'Agent/editor', x: 580, y: 220 }
  ];
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
  await login(page);
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  await page.goto('/dashboard/studio/drf_0001?tab=graph');
  const canvas = page.getByTestId('studio-graph');
  await expect(page.locator('.react-flow__node[data-id="editor"]')).toBeVisible();
  await page.locator('.react-flow__node[data-id="writer"]').click();
  await expect(page.getByTestId('studio-agent-panel')).toBeVisible();
  await page.mouse.move(0, 0);
  await canvas.screenshot({ path: path.join(OUT, 'studio-canvas.png') });

  // A call started from the keyboard: the connect bar and the shortcuts list.
  await page.locator('.react-flow__node[data-id="researcher"]').focus();
  await page.keyboard.press('c');
  await expect(page.getByTestId('studio-canvas-connect-bar')).toBeVisible();
  await page.locator('.studio-canvas-keys summary').click();
  await page.mouse.move(0, 0);
  await canvas.screenshot({ path: path.join(OUT, 'studio-canvas-keyboard.png') });
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('studio-canvas-connect-bar')).toHaveCount(0);

  // The writer's staging deployment on the Runtime tab.
  await page.locator('.studio-canvas-keys summary').click();
  await page.locator('.react-flow__node[data-id="writer"]').click();
  await page.getByRole('tab', { name: 'Runtime' }).click();
  await page.getByTestId('studio-runtime-deployment').selectOption('writer-staging');
  await page.getByTestId('studio-runtime-timeoutSeconds').fill('600');
  await page.mouse.move(0, 0);
  await canvas.screenshot({ path: path.join(OUT, 'studio-canvas-runtime.png') });
});
