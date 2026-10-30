// How to get a secret's value, against mocked APIs: the Create secret form shows a guide for the chosen kind (steps,
// commands to copy, a link to the provider), file-shaped kinds get a multi-line box, the Set value dialog shows the same
// guide for the secret's kind, and the setup wizard's credential step shows it too.

import { test, expect } from '@playwright/test';
import { installMocks } from './mocks.js';

async function login(page) {
  await page.goto('/');
  await page.locator('#tenantId').fill('default');
  await page.locator('#email').fill('admin@garrison');
  await page.locator('#password').fill('password');
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
}

const SECRETS = '/dashboard/configuration?tab=secrets';

test.beforeEach(async ({ page }) => {
  page.on('dialog', (dialog) => {
    throw new Error(`Native dialog used: ${dialog.message()}`);
  });
  await installMocks(page);
});

test('the Create secret form says how to get the value for the chosen kind', async ({ page }) => {
  await login(page);
  await page.goto(SECRETS);
  await page.getByTestId('add-button').click();
  const guide = page.getByTestId('secret-guide');
  const kind = page.locator('#secrets-kind');

  await kind.selectOption('ClaudeCodeOAuthToken');
  await expect(guide).toHaveAttribute('data-kind', 'ClaudeCodeOAuthToken');
  await expect(guide).toContainText('How to get the value for Claude Code OAuth token');
  await expect(guide.locator('pre, code').filter({ hasText: 'claude setup-token' }).first()).toBeVisible();
  await expect(guide).toContainText('CLAUDE_CODE_OAUTH_TOKEN');
  await expect(page.getByTestId('secret-guide-note')).toContainText("Anthropic's terms");
  // The generic caution under Kind is gone; the guide carries it for the kinds it applies to.
  await expect(page.locator('.modal .field', { has: kind }).locator('.field-hint')).toHaveCount(0);
  await expect(page.locator('#secrets-value')).toHaveAttribute('type', 'password');

  await kind.selectOption('AnthropicApiKey');
  await expect(guide).toContainText('ANTHROPIC_API_KEY');
  await expect(page.getByTestId('secret-guide-link-s1')).toHaveAttribute('href', 'https://console.anthropic.com/settings/keys');
  await expect(page.getByTestId('secret-guide-link-s1')).toHaveAttribute('target', '_blank');
  await expect(page.getByTestId('secret-guide-note')).toHaveCount(0);

  // A Codex login is a whole JSON file: the guide shows the commands and the value box keeps line breaks.
  await kind.selectOption('CodexAuthJson');
  await expect(guide.locator('pre, code').filter({ hasText: 'codex login' }).first()).toBeVisible();
  await expect(guide.locator('pre, code').filter({ hasText: 'auth.json' }).first()).toBeVisible();
  await expect(page.locator('textarea#secrets-value')).toBeVisible();

  for (const k of ['OpenAiApiKey', 'GeminiApiKey', 'GenericEnv', 'GenericFile', 'BearerToken', 'BasicAuth', 'GitCredential']) {
    await kind.selectOption(k);
    await expect(guide).toHaveAttribute('data-kind', k);
    await expect(guide.locator('ol li').first()).not.toBeEmpty();
  }
  await expect(page.locator('textarea#secrets-value')).toHaveCount(0);
});

test('Set value shows the guide for the secret kind', async ({ page }) => {
  await login(page);
  await page.goto(SECRETS);
  // sec_0002 is a Codex login.
  await page.locator('.data-table tbody tr', { has: page.locator('strong', { hasText: /^sec-2$/ }) }).locator('.action-menu-trigger').click();
  await page.getByRole('menuitem', { name: 'Set value' }).click();
  const guide = page.getByTestId('secret-guide');
  await expect(guide).toHaveAttribute('data-kind', 'CodexAuthJson');
  await expect(guide).toContainText('codex login');
  await expect(page.locator('.modal textarea#value-prompt')).toBeVisible();
});

test('the setup wizard credential step shows the guide', async ({ page }) => {
  await page.route(/\/tenants\/[^/]+\/agents(\?|$)/, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ objects: [], totalRecords: 0, skip: 0, maxResults: 1, endOfResults: true }) })
  );
  await login(page);
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByTestId('secret-guide')).toHaveAttribute('data-kind', 'AnthropicApiKey');
  await page.locator('#wiz-secret-kind').selectOption('ClaudeCodeOAuthToken');
  await expect(page.getByTestId('secret-guide')).toContainText('claude setup-token');
});
