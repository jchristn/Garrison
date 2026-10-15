// P12.27 transcript export on run and conversation detail, P12.21 manifest bundle export with selection and
// download, and P12.22 invoke forms generated from an agent's input schema with server field errors on the controls.

import fs from 'fs';
import { test, expect } from '@playwright/test';
import { installMocks, mockRun } from './mocks.js';

async function login(page) {
  await page.goto('/');
  await page.locator('#tenantId').fill('default');
  await page.locator('#email').fill('admin@garrison');
  await page.locator('#password').fill('password');
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
}

/** Record transcript requests (path and query) while the default mocks answer them. */
function recordTranscripts(page) {
  const urls = [];
  page.on('request', (req) => {
    if (req.url().includes('/transcript')) urls.push(new URL(req.url()));
  });
  return urls;
}

async function exportTranscript(page, testId, format, { thinking = false } = {}) {
  await page.getByTestId(testId).click();
  if (thinking) await page.getByTestId(`${testId}-thinking`).check();
  const download = page.waitForEvent('download');
  await page.locator(`[data-testid="${testId}-menu"] [data-transcript-format="${format}"]`).click();
  const d = await download;
  return { name: d.suggestedFilename(), body: fs.readFileSync(await d.path(), 'utf8') };
}

test.use({ actionTimeout: 15000 });

test.beforeEach(async ({ page }) => {
  await installMocks(page);
});

test('run detail exports the transcript as Markdown and JSON', async ({ page }) => {
  const urls = recordTranscripts(page);
  await login(page);
  await page.goto('/dashboard/runs/run_0001');
  const md = await exportTranscript(page, 'run-transcript-export', 'markdown');
  expect(md.name).toBe('run_0001-transcript.md');
  expect(md.body).toContain('# Transcript: run run_0001');
  const json = await exportTranscript(page, 'run-transcript-export', 'json', { thinking: true });
  expect(json.name).toBe('run_0001-transcript.json');
  expect(JSON.parse(json.body)).toMatchObject({ schema: 'garrison.transcript/v1', kind: 'Run', runId: 'run_0001' });
  expect(urls[0].pathname).toBe('/v1.0/api/tenants/default/runs/run_0001/transcript');
  expect(urls[0].searchParams.get('format')).toBe('markdown');
  expect(urls[0].searchParams.get('includeThinking')).toBeNull();
  expect(urls[1].searchParams.get('format')).toBe('json');
  expect(urls[1].searchParams.get('includeThinking')).toBe('true');
});

test('conversation detail exports every turn as a transcript', async ({ page }) => {
  const urls = recordTranscripts(page);
  await login(page);
  await page.goto('/dashboard/conversations/cnv_0001');
  await expect(page.getByTestId('conversation-detail')).toBeVisible();
  const md = await exportTranscript(page, 'conversation-transcript-export', 'markdown');
  expect(md.name).toBe('cnv_0001-transcript.md');
  expect(md.body).toContain('conversation cnv_0001');
  expect(urls[0].pathname).toBe('/v1.0/api/tenants/default/conversations/cnv_0001/transcript');
});

test('a failed transcript export shows the server message', async ({ page }) => {
  await page.route(/\/runs\/run_0002\/transcript/, (route) => route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'NotFound', code: 'NotFound', message: 'Run run_0002 not found.' }) }));
  await login(page);
  await page.goto('/dashboard/runs/run_0002');
  await page.getByTestId('run-transcript-export').click();
  await page.locator('[data-testid="run-transcript-export-menu"] [data-transcript-format="markdown"]').click();
  await expect(page.locator('.toast').last()).toContainText('Run run_0002 not found.');
});

test('manifest export selects kinds and resources, lists required secrets, and downloads the bundle', async ({ page }) => {
  const urls = [];
  page.on('request', (req) => {
    if (req.url().includes('/manifests/export')) urls.push({ method: req.method(), url: new URL(req.url()) });
  });
  await login(page);
  await page.goto('/dashboard/configuration?tab=manifests');
  await page.getByRole('tab', { name: 'Export', exact: true }).click();
  await page.getByTestId('bundle-scope-selected').check();
  await expect(page.getByTestId('manifest-export-run')).toBeDisabled();
  await page.getByTestId('bundle-kind-Agent').check();
  await page.getByTestId('bundle-resources').fill('Pipeline/release\nSecret/nope');
  await expect(page.getByTestId('bundle-resources-error')).toContainText('Secret/nope');
  await expect(page.getByTestId('manifest-export-run')).toBeDisabled();
  await page.getByTestId('bundle-resources').fill('Pipeline/release, PromptTemplate/team/review');
  await page.getByTestId('bundle-include-builtin').check();
  await page.getByTestId('manifest-export-run').click();
  await expect(page.getByTestId('bundle-required-secrets')).toContainText('github-token');
  await expect(page.getByTestId('bundle-required-secrets')).toContainText('ApiKey');
  await expect(page.getByTestId('manifest-export')).toContainText('kind: Bundle');
  expect(urls[0].method).toBe('GET');
  expect(urls[0].url.searchParams.get('kinds')).toBe('Agent');
  expect(urls[0].url.searchParams.get('resources')).toBe('Pipeline/release,PromptTemplate/team/review');
  expect(urls[0].url.searchParams.get('followReferences')).toBe('true');
  expect(urls[0].url.searchParams.get('includeBuiltIn')).toBe('true');

  const download = page.waitForEvent('download');
  await page.getByTestId('manifest-export-download').click();
  const d = await download;
  expect(d.suggestedFilename()).toBe('garrison-bundle-default.yaml');
  expect(fs.readFileSync(await d.path(), 'utf8')).toContain('requiredSecrets');
});

test('exporting everything sends no selection', async ({ page }) => {
  const urls = [];
  page.on('request', (req) => {
    if (req.url().includes('/manifests/export')) urls.push(new URL(req.url()));
  });
  await login(page);
  await page.goto('/dashboard/configuration?tab=manifests');
  await page.getByRole('tab', { name: 'Export', exact: true }).click();
  await page.getByTestId('manifest-export-run').click();
  await expect(page.getByTestId('bundle-requirements')).toBeVisible();
  expect([...urls[0].searchParams.keys()]).toEqual([]);
});

test('an agent with an input schema gets a generated form that sends JSON', async ({ page }) => {
  const bodies = [];
  await page.route(/\/v1\.0\/api\/tenants\/[^/]+\/agents\/[^/]+\/invoke/, (route) => {
    bodies.push(JSON.parse(route.request().postData() || '{}'));
    return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(mockRun('run_form', { status: 'Succeeded', outcome: 'Succeeded' })) });
  });
  await login(page);
  await page.goto('/dashboard/invoke?agentId=agt_0003');
  await expect(page.getByTestId('schema-form')).toBeVisible();
  await expect(page.locator('#invoke-message')).toHaveCount(0);
  await expect(page.getByTestId('schema-field-depth')).toHaveValue('2');

  // Required fields are checked before anything is sent.
  await page.getByTestId('invoke-send').click();
  await expect(page.getByTestId('schema-error-topic')).toContainText('This field is required.');
  expect(bodies).toHaveLength(0);

  await page.getByTestId('schema-field-topic').fill('GPU prices');
  await page.getByTestId('schema-field-urgent').check();
  await page.getByTestId('schema-field-tone').selectOption({ label: 'casual' });
  await page.getByTestId('schema-add-tags').click();
  await page.getByTestId('schema-item-tags-0').fill('hardware');
  await page.getByTestId('schema-field-address.city').fill('Austin');
  await page.getByTestId('invoke-send').click();
  await expect.poll(() => bodies.length).toBe(1);
  expect(bodies[0].inputContentType).toBe('application/json');
  expect(JSON.parse(bodies[0].input)).toEqual({ topic: 'GPU prices', depth: 2, urgent: true, tone: 'casual', tags: ['hardware'], address: { city: 'Austin' } });

  // The raw JSON toggle carries the values over and back.
  await page.getByTestId('schema-mode-json').click();
  const raw = page.getByTestId('schema-raw-json');
  expect(JSON.parse(await raw.inputValue())).toMatchObject({ topic: 'GPU prices', tags: ['hardware'] });
  await raw.fill('{"topic":"edited","depth":5}');
  await page.getByTestId('schema-mode-form').click();
  await expect(page.getByTestId('schema-field-topic')).toHaveValue('edited');
  await expect(page.getByTestId('schema-field-depth')).toHaveValue('5');
});

test('server schema violations land on the matching form controls', async ({ page }) => {
  await page.route(/\/v1\.0\/api\/tenants\/[^/]+\/agents\/[^/]+\/invoke/, (route) =>
    route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({
        error: 'BadRequest',
        code: 'ValidationFailed',
        message: 'The input does not match the agent input schema.',
        fields: { 'input.topic': 'Value is shorter than 5 characters.', 'input.tags[0]': 'Value is not allowed.', 'input.address.city': 'Required property is missing.', input: 'Additional properties are not allowed.' },
        fieldCodes: { 'input.topic': 'InputSchemaViolation', 'input.tags[0]': 'InputSchemaViolation', 'input.address.city': 'InputSchemaViolation', input: 'InputSchemaViolation' }
      })
    })
  );
  await login(page);
  await page.goto('/dashboard/invoke?agentId=agt_0003');
  await page.getByTestId('schema-field-topic').fill('GPU');
  await page.getByTestId('invoke-send').click();
  await expect(page.getByTestId('schema-error-topic')).toContainText('Value is shorter than 5 characters.');
  await expect(page.getByTestId('schema-error-tags')).toContainText('[0] Value is not allowed.');
  await expect(page.getByTestId('schema-error-address.city')).toContainText('Required property is missing.');
  await expect(page.getByTestId('schema-errors')).toContainText('Additional properties are not allowed.');
});

test('agents without an input schema keep the plain text input', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/invoke?agentId=agt_0001');
  await expect(page.locator('#invoke-message')).toBeVisible();
  await expect(page.getByTestId('schema-form')).toHaveCount(0);
});
