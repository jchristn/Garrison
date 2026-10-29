// Tooltip audit, the same rule as the dashboard (D-030): every visible button, link, input, select, textarea, table
// header, and label has a data-tip tooltip of at least 25 characters that does not just restate its visible text.
// The audit covers sign-in, the chat with a streamed answer (including a link and a table in the answer), the file
// panel, the version dialog, the error page, and the narrow layout.
import { test, expect } from '@playwright/test';
import { resetMock, send } from './helpers.js';

const SELECTOR = 'button, a[href], input:not([type="hidden"]), select, textarea, th, label';
const MIN_LENGTH = 25;

async function audit(page, context, failures) {
  const problems = await page.evaluate(
    ({ selector, min }) => {
      const norm = (s) => String(s || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
      const visible = (el) => {
        if (!el.getClientRects().length) return false;
        const style = getComputedStyle(el);
        if (style.visibility === 'hidden' || style.display === 'none') return false;
        if (el.closest('[aria-hidden="true"], .tooltip')) return false;
        return true;
      };
      const out = [];
      let count = 0;
      for (const el of document.querySelectorAll(selector)) {
        if (!visible(el)) continue;
        if (el.classList.contains('skip-link') && el.getBoundingClientRect().bottom < 0) continue;
        count += 1;
        const tipText = (el.getAttribute('data-tip') || '').trim();
        const text = (el.innerText || (el.tagName === 'SELECT' ? '' : el.value) || el.getAttribute('aria-label') || '').trim().split('\n')[0];
        const id = `${el.tagName.toLowerCase()} "${text.slice(0, 40)}"${el.id ? ` #${el.id}` : ''}`;
        if (!tipText) out.push(`${id}: no tooltip`);
        else if (tipText.length < min) out.push(`${id}: tooltip too short ("${tipText}")`);
        else if (text && norm(tipText) === norm(text)) out.push(`${id}: tooltip restates the label`);
        else if (text && norm(tipText).startsWith(norm(text)) && tipText.length - text.length < 15) out.push(`${id}: tooltip barely extends the label`);
      }
      return { out, count };
    },
    { selector: SELECTOR, min: MIN_LENGTH }
  );
  expect(problems.count, `${context}: nothing to audit`).toBeGreaterThan(0);
  for (const p of problems.out) failures.push(`[${context}] ${p}`);
}

test('every interactive element has a useful tooltip', async ({ page, request }) => {
  const failures = [];
  await resetMock(request, {
    app: { showOperatorDetail: true },
    scenario: {
      chunks: ['See [the docs](https://example.com/docs).\n\n', '| Week | Revenue |\n', '|---|---|\n', '| 1 | 10 |\n'],
      chunkMs: 50,
      holdMs: 50,
      writeFile: { path: 'out/summary.md', content: '# Summary\n', atChunk: 0 }
    }
  });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/apps/demo/');
  await expect(page.getByTestId('signin-anonymous')).toBeVisible();
  await audit(page, 'sign-in', failures);

  await page.getByTestId('signin-anonymous').click();
  await audit(page, 'empty chat', failures);
  await send(page, 'Summarize');
  await expect(page.getByTestId('turn').first()).toHaveAttribute('data-phase', 'done');
  await expect(page.locator('[data-testid="file-item"]')).toHaveCount(1);
  await expect(page.locator('.markdown-body a[href="https://example.com/docs"]')).toBeVisible();
  await expect(page.locator('.markdown-body th').first()).toBeVisible();
  await audit(page, 'chat with answer and files', failures);

  await page.getByTestId('file-versions').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await audit(page, 'version dialog', failures);
  await page.keyboard.press('Escape');

  await page.setViewportSize({ width: 360, height: 740 });
  await page.getByTestId('toggle-conversations').click();
  await audit(page, 'phone conversation list', failures);

  await page.goto('/apps/missing-app/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await audit(page, 'not found page', failures);

  expect(failures).toEqual([]);
});

test('tooltips show on hover and keyboard focus and are announced', async ({ page }) => {
  await page.goto('/apps/demo/');
  const button = page.getByTestId('signin-anonymous');
  await button.hover();
  const tooltip = page.locator('#garrison-app-tooltip');
  await expect(tooltip).toHaveClass(/is-visible/);
  await expect(tooltip).toHaveText(await button.getAttribute('data-tip'));
  await expect(button).toHaveAttribute('aria-describedby', 'garrison-app-tooltip');
  await page.keyboard.press('Escape');
  await expect(tooltip).not.toHaveClass(/is-visible/);
  await page.getByLabel('Email').focus();
  await expect(tooltip).toHaveClass(/is-visible/);
});
