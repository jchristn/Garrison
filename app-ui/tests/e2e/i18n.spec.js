// Locales, like the dashboard's check: the selector lists every locale by its own name with the beta label; each
// language changes lang and the visible text, survives a reload, and leaves no raw catalog key in visible text or in
// tooltip, aria-label, placeholder, or title attributes. The RTL pseudo-locale mirrors the layout without
// horizontal overflow, down to a 360 px wide phone.
import { test, expect } from '@playwright/test';
import { LOCALES, getLocaleLabel } from '../../src/i18n/localeRegistry.js';
import en from '../../src/i18n/locales/en.js';
import de from '../../src/i18n/locales/de.js';
import es from '../../src/i18n/locales/es.js';
import fr from '../../src/i18n/locales/fr.js';
import it from '../../src/i18n/locales/it.js';
import ja from '../../src/i18n/locales/ja.js';
import zhHans from '../../src/i18n/locales/zh-Hans.js';
import zhHant from '../../src/i18n/locales/zh-Hant.js';
import yueHant from '../../src/i18n/locales/yue-Hant.js';
import { resetMock, send } from './helpers.js';

const CATALOGS = { en, de, es, fr, it, ja, 'zh-Hans': zhHans, 'zh-Hant': zhHant, 'yue-Hant': yueHant };
const RAW_KEY_SOURCE = '\\b(?:common|app|signIn|header|conversations|chat|statuses|detailTypes|files|errors|tips)\\.[A-Za-z0-9_]+\\b';

async function rawKeys(page) {
  return page.evaluate((source) => {
    const re = new RegExp(source, 'g');
    const found = new Set();
    for (const m of document.body.innerText.match(re) || []) found.add(m);
    for (const el of document.querySelectorAll('[data-tip], [aria-label], [placeholder], [title]')) {
      for (const attr of ['data-tip', 'aria-label', 'placeholder', 'title']) {
        for (const m of (el.getAttribute(attr) || '').match(re) || []) found.add(`${attr}: ${m}`);
      }
    }
    return [...found];
  }, RAW_KEY_SOURCE);
}

async function overflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

test.beforeEach(async ({ request }) => {
  await resetMock(request, { scenario: { chunkMs: 30, holdMs: 30, writeFile: { path: 'a.md', content: 'x', atChunk: 0 } } });
});

test('the language selector lists every locale by autonym with beta labels', async ({ page }) => {
  await page.goto('/apps/demo/');
  const options = page.getByTestId('language-select').locator('option');
  await expect(options).toHaveText(LOCALES.map((l) => getLocaleLabel(l.code)));
  for (const l of LOCALES.filter((x) => x.beta)) {
    await expect(page.locator(`[data-testid="language-select"] option[value="${l.code}"]`)).toHaveAttribute('data-beta', 'true');
  }
});

for (const [code, catalog] of Object.entries(CATALOGS)) {
  test(`${code}: every screen is translated with no raw keys`, async ({ page }) => {
    await page.goto(`/apps/demo/?lang=${code}`);
    await expect(page.locator('html')).toHaveAttribute('lang', code);
    await expect(page.getByTestId('signin-anonymous')).toHaveText(catalog.signIn.anonymous);
    await expect(page.getByTestId('signin-submit')).toHaveText(catalog.signIn.submit);
    expect(await rawKeys(page)).toEqual([]);

    await page.getByTestId('signin-anonymous').click();
    await expect(page.getByTestId('new-conversation')).toHaveText(catalog.conversations.new);
    await send(page, 'Hello');
    await expect(page.getByTestId('turn').first()).toHaveAttribute('data-phase', 'done');
    await expect(page.locator('#file-panel-title')).toHaveText(catalog.files.title);
    expect(await rawKeys(page)).toEqual([]);

    // The choice survives a reload.
    await page.goto('/apps/demo/');
    await expect(page.locator('html')).toHaveAttribute('lang', code);
    await expect(page.getByTestId('new-conversation')).toHaveText(catalog.conversations.new);
  });
}

test('the RTL pseudo-locale mirrors the layout without horizontal overflow', async ({ page }) => {
  for (const width of [1280, 360]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/apps/demo/?lang=zz');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    expect(await overflow(page), `sign-in at ${width}`).toBeLessThanOrEqual(0);
    await page.getByTestId('signin-anonymous').click();
    await send(page, 'Hello');
    await expect(page.getByTestId('turn').first()).toHaveAttribute('data-phase', 'done');
    expect(await overflow(page), `chat at ${width}`).toBeLessThanOrEqual(0);
    if (width > 1100) {
      // The conversation list sits at the inline start, which is the right edge in RTL.
      const list = await page.locator('#conversation-sidebar').boundingBox();
      expect(list.x).toBeGreaterThan(width / 2);
    }
    await page.evaluate(() => sessionStorage.clear());
  }
  await page.goto('/apps/demo/?lang=en');
});
