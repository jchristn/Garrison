// Invoke response card (P5.52): Preview streams Markdown as it arrives, Response shows the final result, and a new
// Send clears the card and ignores frames from the previous run. The stream is driven by the test
// (installControlledStream), so each assertion sees exactly the deltas pushed so far.

import { test, expect } from '@playwright/test';
import { installMocks, installControlledStream, pushRunEvent, pushRunFrame, mockRun } from './mocks.js';

async function login(page) {
  await page.goto('/');
  await page.locator('#tenantId').fill('default');
  await page.locator('#email').fill('admin@garrison');
  await page.locator('#password').fill('password');
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
}

/** Serve invoke and GET run for test-controlled run IDs. `runs` maps ID to the record GET returns. */
async function routeRuns(page, runs, invokeQueue, { invokeDelayMs = 0 } = {}) {
  await page.route(/\/v1\.0\/api\/tenants\/[^/]+\/agents\/[^/]+\/invoke/, async (route) => {
    const id = invokeQueue.shift();
    if (invokeDelayMs) await new Promise((r) => setTimeout(r, invokeDelayMs));
    return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(runs[id]) });
  });
  await page.route(/\/v1\.0\/api\/tenants\/[^/]+\/runs\/(run_s[^/?]+)(\?.*)?$/, (route) => {
    const id = /runs\/(run_s[^/?]+)/.exec(route.request().url())[1];
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(runs[id]) });
  });
}

let seq = 0;
const ev = (eventType, extra = {}) => ({ id: `rev_t${++seq}`, tenantId: 'default', sequence: seq, eventType, ...extra });

async function send(page, text) {
  await page.locator('#invoke-message').fill(text);
  await page.getByTestId('invoke-send').click();
}

test.use({ actionTimeout: 15000 });

test.beforeEach(async ({ page }) => {
  seq = 0;
  await installMocks(page);
});

test('Preview renders streamed Markdown incrementally, with reasoning, tool chips, and live timing', async ({ page }) => {
  await installControlledStream(page);
  const running = mockRun('run_s1', { status: 'Running', outcome: 'None', resultText: undefined, errorMessage: undefined, harnessType: 'ClaudeCode' });
  const runs = { run_s1: running };
  await routeRuns(page, runs, ['run_s1']);
  await login(page);
  await page.goto('/dashboard/invoke');
  await send(page, 'Summarize the README');

  const preview = page.getByTestId('invoke-preview');
  await expect(page.getByRole('tab', { name: 'Preview' })).toHaveAttribute('aria-selected', 'true');
  await expect(preview.getByTestId('stream-live')).toBeVisible();
  await expect(preview.getByTestId('stream-waiting')).toBeVisible();
  await expect(preview.getByTestId('stream-elapsed')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__sse.opened.length)).toBeGreaterThan(0);

  // Reasoning first: collapsed by default.
  await pushRunEvent(page, 'run_s1', ev('Thinking', { text: 'The user wants a summary. ' }));
  await pushRunEvent(page, 'run_s1', ev('Thinking', { text: 'Read the README first.' }));
  const reasoning = preview.getByTestId('stream-reasoning');
  await expect(reasoning).toBeVisible();
  await expect(reasoning).not.toHaveAttribute('open', '');
  await expect(reasoning.locator('.stream-reasoning-text')).toBeHidden();
  await expect(preview.getByTestId('stream-ttft')).toBeVisible();

  // A heading arrives in two pieces and is re-rendered as it grows.
  await pushRunEvent(page, 'run_s1', ev('AssistantText', { text: '## Sum' }));
  await expect(preview.locator('.markdown-body h2')).toHaveText('Sum');
  await pushRunEvent(page, 'run_s1', ev('AssistantText', { text: 'mary\n\nThe README has ' }));
  await expect(preview.locator('.markdown-body h2')).toHaveText('Summary');
  await expect(preview.getByTestId('stream-waiting')).toHaveCount(0);

  // Tool call chip: running, then settled by its result. No raw JSON is shown.
  await pushRunEvent(page, 'run_s1', ev('ToolCall', { toolName: 'read_file', toolCallId: 'toolu_1', text: '{"path":"README.md"}' }));
  const chip = preview.getByTestId('stream-tool-chip');
  await expect(chip).toHaveAttribute('data-status', 'running');
  await expect(chip).toContainText('read_file');
  await pushRunEvent(page, 'run_s1', ev('ToolResult', { toolName: 'read_file', toolCallId: 'toolu_1', success: true, text: '# Garrison' }));
  await expect(chip).toHaveAttribute('data-status', 'ok');
  await expect(preview).not.toContainText('"path"');

  // A table, a list with a link, and a code block, each streamed.
  await pushRunEvent(page, 'run_s1', ev('AssistantText', { text: '| File | Lines |\n|---|---|\n' }));
  await pushRunEvent(page, 'run_s1', ev('AssistantText', { text: '| README.md | 42 |\n\n' }));
  await expect(preview.locator('.markdown-body table td').first()).toHaveText('README.md');
  await pushRunEvent(page, 'run_s1', ev('AssistantText', { text: '- **Bold** item\n- [Docs](https://example.com/docs)\n\n<img src="x" onerror="window.__pwned=1"><script>window.__pwned=2</script>\n\n' }));
  const link = preview.locator('.markdown-body a', { hasText: 'Docs' });
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', /noopener/);
  await expect(link).toHaveAttribute('data-tip', /example\.com/);
  await pushRunEvent(page, 'run_s1', ev('AssistantText', { text: '```bash\nnpm test\n```\n' }));
  await expect(preview.locator('.markdown-body .code-block pre')).toHaveText('npm test');
  expect(await page.evaluate(() => window.__pwned)).toBeUndefined();
  await expect(preview.locator('script, [onerror]')).toHaveCount(0);

  await pushRunEvent(page, 'run_s1', ev('Usage', { inputTokens: 900, outputTokens: 120 }));
  await expect(preview.getByTestId('stream-rate')).toBeVisible();

  // Reasoning expands on click.
  await reasoning.locator('summary').click();
  await expect(reasoning.locator('.stream-reasoning-text')).toHaveText('The user wants a summary. Read the README first.');

  // The run completes: the Preview stays selected and offers the Response tab.
  runs.run_s1 = {
    ...running,
    status: 'Succeeded',
    outcome: 'Succeeded',
    resultText: '## Summary\n\n| File | Lines |\n|---|---|\n| README.md | 42 |',
    structuredOutput: { files: 1, lines: 42 },
    completedUtc: new Date().toISOString()
  };
  await pushRunFrame(page, 'run_s1', 'run.completed', runs.run_s1);
  await expect(preview.getByTestId('stream-finished-hint')).toBeVisible();
  await expect(preview.getByTestId('stream-finished')).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Preview' })).toHaveAttribute('aria-selected', 'true');
  await expect(preview.locator('.markdown-body h2')).toHaveText('Summary');

  // Response: rendered result with a raw toggle, structured output as JSON, outcome, and telemetry.
  await page.getByRole('tab', { name: 'Response' }).click();
  const response = page.getByTestId('invoke-response');
  await expect(response.getByTestId('invoke-outcome')).toBeVisible();
  const result = response.getByTestId('invoke-result');
  await expect(result.locator('.markdown-body table td').first()).toHaveText('README.md');
  await result.getByTestId('markdown-raw-toggle').click();
  await expect(result.locator('pre')).toContainText('| File | Lines |');
  await expect(response.locator('.code-block pre').last()).toContainText('"lines": 42');
  await expect(response.locator('.telemetry-panel, [data-testid="run-telemetry"]').first()).toBeVisible();
});

test('a new Send clears the card at once and ignores late frames from the previous run', async ({ page }) => {
  await installControlledStream(page, { ignoreAbort: true });
  const base = { status: 'Running', outcome: 'None', resultText: undefined, errorMessage: undefined, harnessType: 'ClaudeCode' };
  const runs = { run_sa: mockRun('run_sa', base), run_sb: mockRun('run_sb', base) };
  await routeRuns(page, runs, ['run_sa', 'run_sb'], { invokeDelayMs: 600 });
  await login(page);
  await page.goto('/dashboard/invoke');

  await send(page, 'first');
  await expect.poll(() => page.evaluate(() => window.__sse.opened.includes('run_sa'))).toBe(true);
  await pushRunEvent(page, 'run_sa', ev('Thinking', { text: 'First reasoning.' }));
  await pushRunEvent(page, 'run_sa', ev('AssistantText', { text: 'First run **answer**.' }));
  await pushRunEvent(page, 'run_sa', ev('ToolCall', { toolName: 'grep', toolCallId: 't1' }));
  const preview = page.getByTestId('invoke-preview');
  await expect(preview.getByTestId('stream-text')).toContainText('First run answer.');
  runs.run_sa = { ...runs.run_sa, status: 'Succeeded', outcome: 'Succeeded', resultText: 'First result', completedUtc: new Date().toISOString() };
  await pushRunFrame(page, 'run_sa', 'run.completed', runs.run_sa);
  await expect(preview.getByTestId('stream-finished-hint')).toBeVisible();
  await page.getByRole('tab', { name: 'Response' }).click();
  await expect(page.getByTestId('invoke-result')).toContainText('First result');

  // Second send: the card is empty right away, before the server has even answered the invoke.
  await send(page, 'second');
  await expect(page.getByTestId('invoke-starting')).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Preview' })).toHaveAttribute('aria-selected', 'true');
  const fresh = page.getByTestId('invoke-preview');
  await expect(fresh.getByTestId('stream-text')).toHaveCount(0);
  await expect(fresh.getByTestId('stream-reasoning')).toHaveCount(0);
  await expect(fresh.getByTestId('stream-tool-chip')).toHaveCount(0);
  await expect(fresh.getByTestId('stream-finished-hint')).toHaveCount(0);
  await expect(fresh.getByTestId('stream-waiting')).toBeVisible();
  await expect(page.getByTestId('invoke-card')).not.toContainText(/First (run|reasoning|result)/);

  await expect.poll(() => page.evaluate(() => window.__sse.opened.includes('run_sb'))).toBe(true);
  // A late frame from the first run (its stream is still delivering) must not land in the new card.
  expect(await pushRunEvent(page, 'run_sa', ev('AssistantText', { text: ' LATE FROM FIRST' }))).toBeGreaterThan(0);
  await pushRunEvent(page, 'run_sb', ev('AssistantText', { text: 'Second run text.' }));
  await expect(fresh.getByTestId('stream-text')).toHaveText('Second run text.');
  await page.waitForTimeout(200);
  await expect(page.getByTestId('invoke-card')).not.toContainText('LATE FROM FIRST');
  await expect(page.getByTestId('invoke-card')).not.toContainText(/First (run|reasoning|result)/);
  await expect(page.locator('.invoke-run-head')).toContainText('run_sb');
});

test('Codex runs explain that output arrives in one piece, then show the full message', async ({ page }) => {
  await installControlledStream(page);
  const runs = { run_sc: mockRun('run_sc', { status: 'Running', outcome: 'None', resultText: undefined, errorMessage: undefined, harnessType: 'Codex' }) };
  await routeRuns(page, runs, ['run_sc']);
  await login(page);
  await page.goto('/dashboard/invoke');
  await send(page, 'hello codex');
  const preview = page.getByTestId('invoke-preview');
  await expect(preview.getByTestId('stream-codex-note')).toBeVisible();
  await expect(preview.getByTestId('stream-waiting')).toContainText('Codex');
  await expect.poll(() => page.evaluate(() => window.__sse.opened.includes('run_sc'))).toBe(true);
  await pushRunEvent(page, 'run_sc', ev('AssistantText', { text: 'Full answer with a list:\n\n- one\n- two', rawEvent: { type: 'item.completed' } }));
  await expect(preview.locator('.markdown-body li')).toHaveCount(2);
  await expect(preview.getByTestId('stream-waiting')).toHaveCount(0);
});

test('the default mocked stream fills Preview, and Run detail renders the result as Markdown with a raw toggle', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/invoke');
  await send(page, 'hello');
  const preview = page.getByTestId('invoke-preview');
  await expect(preview.locator('.markdown-body h2')).toHaveText('Summary');
  await expect(preview.locator('.markdown-body table')).toBeVisible();
  await expect(preview.getByTestId('stream-tool-chip')).toHaveAttribute('data-status', 'ok');
  await expect(preview.getByTestId('stream-reasoning')).toBeVisible();

  await page.goto('/dashboard/runs/run_0001');
  await page.getByRole('tab', { name: 'Result' }).click();
  const result = page.getByTestId('run-result');
  await expect(result.locator('.markdown-body')).toContainText('Hello from the fake harness.');
  await result.getByTestId('markdown-raw-toggle').click();
  await expect(result.locator('pre')).toContainText('Hello from the fake harness.');
});

test('Preview renders coalesced assistant and thinking groups with JSONL raw events', async ({ page }) => {
  await installControlledStream(page);
  const runs = { run_smerged: mockRun('run_smerged', { status: 'Running', outcome: 'None', resultText: undefined, errorMessage: undefined }) };
  await routeRuns(page, runs, ['run_smerged']);
  await login(page);
  await page.goto('/dashboard/invoke');
  await send(page, 'coalesced stream');
  await expect.poll(() => page.evaluate(() => window.__sse.opened.includes('run_smerged'))).toBe(true);
  await pushRunEvent(page, 'run_smerged', ev('Thinking', { text: 'First thought. Second thought.', rawEventText: '{"text":"First thought. "}\n{"text":"Second thought."}' }));
  await pushRunEvent(page, 'run_smerged', ev('AssistantText', { text: '## Combined\n\n- one\n- two', rawEventText: '{"text":"## Combined"}\n{"text":"\\n\\n- one\\n- two"}' }));
  const preview = page.getByTestId('invoke-preview');
  await expect(preview.locator('.markdown-body h2')).toHaveText('Combined');
  await expect(preview.locator('.markdown-body li')).toHaveCount(2);
  const reasoning = preview.getByTestId('stream-reasoning');
  await reasoning.locator('summary').click();
  await expect(reasoning.locator('.stream-reasoning-text')).toHaveText('First thought. Second thought.');
  await expect(preview).not.toContainText('{"text"');
});
