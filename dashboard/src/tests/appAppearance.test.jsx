// The app appearance step (LP8.4): presets and custom colors with the derived and contrast notes, inline image
// upload, the starter prompt editor (add, reorder by button and keyboard, remove, limits, counts), the live preview
// in light and dark, the form and body helpers for the LP8 fields, and tooltips on every control.
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import i18n from '../i18n';
import AuthContext from '../context/AuthContext';
import AppContext from '../context/AppContext';
import AgenticAppAppearance from '../components/AgenticAppAppearance';
import { appErrors, appToBody, appToForm, blankApp } from '../utils/apps';
import { APP_COLOR_ROLES } from '../utils/appPalettes';
import { deriveDarkColor } from '../utils/appColors';
import { appImageAssetName } from '../components/AgenticAppImageField';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const t = (...args) => i18n.t(...args);
const q = (sel) => document.body.querySelector(sel);
const qa = (sel) => [...document.body.querySelectorAll(sel)];
const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });

beforeAll(async () => {
  await i18n.changeLanguage('en');
});

let mounted = [];
afterEach(() => {
  for (const { root, container } of mounted) {
    act(() => root.unmount());
    container.remove();
  }
  mounted = [];
});

/** The step with its own form state, as ResourceView keeps it; `latest.form` is the last record it produced. */
function mountStep(initial, { apiClient = {}, assets = [], reloadOptions = vi.fn(), errors = {} } = {}) {
  const latest = { form: initial };
  function Harness() {
    const [form, setForm] = useState(initial);
    latest.form = form;
    return <AgenticAppAppearance data={form} onChange={setForm} errors={errors} assets={assets} reloadOptions={reloadOptions} />;
  }
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <AuthContext.Provider value={{ apiClient, principal: { isAdmin: true } }}>
        <AppContext.Provider value={{ tenantId: 'default', setWizardOpen: () => {}, setTourOpen: () => {} }}>
          <Harness />
        </AppContext.Provider>
      </AuthContext.Provider>
    );
  });
  mounted.push({ root, container });
  return latest;
}

function click(el) {
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

function type(el, value) {
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  act(() => {
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
    el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  });
}

function key(el, k, extra = {}) {
  act(() => {
    el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, ...extra }));
  });
}

const app = (extra = {}) => ({ ...blankApp(), name: 'research', displayName: 'Research Desk', ...extra });

describe('app appearance fields', () => {
  it('reads missing LP8 fields as their defaults and sends them back in the contract shape', () => {
    const form = appToForm({ name: 'x', primaryColor: '#0F766E' });
    expect(form).toMatchObject({ subtitle: '', paletteId: '', darkPrimaryColor: '', themeDefault: 'System', allowThemeSwitch: true, cornerStyle: 'Rounded', density: 'Comfortable', showFilesPanel: true, showLanguagePicker: true, showPoweredBy: true, starterPrompts: [] });
    const body = appToBody({ ...form, subtitle: ' Hi ', starterPrompts: [' One ', '', 'Two'], showPoweredBy: false, darkAccentColor: '#FFF', cornerStyle: 'Pill' });
    expect(body).toMatchObject({ subtitle: 'Hi', welcomeTitle: null, agentAvatarAssetId: null, paletteId: null, darkAccentColor: '#FFF', darkPrimaryColor: null, starterPrompts: ['One', 'Two'], showPoweredBy: false, allowThemeSwitch: true, cornerStyle: 'Pill', density: 'Comfortable', themeDefault: 'System' });
    expect(appToForm({ name: 'x', allowThemeSwitch: false, starterPrompts: ['a'] })).toMatchObject({ allowThemeSwitch: false, starterPrompts: ['a'] });
  });

  it('checks lengths, dark colors, and the prompt limits like the server', () => {
    const e = appErrors({ ...app(), members: [{ agentId: 'agt_1' }], entryAgentId: 'agt_1', subtitle: 'x'.repeat(201), darkHeaderColor: 'navy', starterPrompts: ['a', 'b', 'c', 'd', 'e'.repeat(201)] }, t);
    expect(e.subtitle).toBe(t('common.fieldCodes.TooLong'));
    expect(e.darkHeaderColor).toBe(t('common.fieldCodes.InvalidColor'));
    expect(e.starterPrompts).toBe(t('common.fieldCodes.TooMany'));
    expect(e['starterPrompts[4]']).toBe(t('common.fieldCodes.TooLong'));
    const ok = appErrors({ ...app(), members: [{ agentId: 'agt_1' }], entryAgentId: 'agt_1', darkHeaderColor: '#123' }, t);
    expect(ok.darkHeaderColor).toBeUndefined();
  });

  it('names uploaded images after the app and the role', () => {
    expect(appImageAssetName('Research Desk!', 'logo', 36)).toBe('research-desk-logo-10');
    expect(appImageAssetName('', 'avatar', 35)).toBe('app-avatar-z');
  });
});

describe('the appearance step', () => {
  it('fills every color from a preset, then turns custom on an edit, and shows the derived dark color', () => {
    const latest = mountStep(app());
    expect(q('[data-testid="palette-current"]').textContent).toContain(t('components.appAppearance.palettes.none'));
    click(q('[data-testid="palette-ocean"]'));
    expect(latest.form.paletteId).toBe('ocean');
    expect(latest.form.primaryColor).toBe('#0369A1');
    expect(latest.form.darkFilesColor).toBe('#072A40');
    expect(q('[data-testid="palette-ocean"]').getAttribute('aria-pressed')).toBe('true');
    expect(q('[data-testid="palette-current"]').textContent).toContain('Ocean');

    type(q('#apps-darkBackgroundColor'), '');
    expect(latest.form.paletteId).toBe('custom');
    const derived = q('[data-testid="apps-darkBackgroundColor-derived"]');
    expect(derived.textContent).toBe(t('components.appAppearance.derived'));
    expect(derived.getAttribute('data-source')).toBe('derived');
    expect(derived.querySelector('.appearance-mini-swatch').style.background).toBeTruthy();
    expect(q('#apps-darkBackgroundColor').getAttribute('placeholder')).toBe(deriveDarkColor('#F0F9FF').toUpperCase());
    click(q('[data-testid="palette-reset"]'));
    expect(latest.form.paletteId).toBe('');
    expect(latest.form.primaryColor).toBe('');
  });

  it('says the dark color stays the light one for an app saved before palettes', () => {
    mountStep(app({ headerColor: '#FFFFFF' }));
    const note = q('[data-testid="apps-darkHeaderColor-derived"]');
    expect(note.getAttribute('data-source')).toBe('light');
    expect(note.textContent).toBe(t('components.appAppearance.sameAsLight'));
  });

  it('warns beside a color whose text falls under AA', () => {
    mountStep(app({ paletteId: 'custom', conversationListColor: '#334155' }));
    // Dark theme text on a dark list in the light theme fails; white text on it passes.
    expect(q('[data-testid="apps-conversationListColor-contrast"]')).not.toBeNull();
    expect(q('[data-testid="apps-conversationListColor-contrast"]').textContent).toContain('4.5:1');
    expect(q('[data-testid="apps-primaryColor-contrast"]')).toBeNull();
  });

  it('adds, edits, reorders by button and by keyboard, and removes starter prompts, up to four', () => {
    const latest = mountStep(app());
    expect(q('[data-testid="starter-prompts-count"]').textContent).toBe('0 of 4 prompts');
    for (let i = 0; i < 4; i++) click(q('[data-testid="starter-prompt-add"]'));
    expect(q('[data-testid="starter-prompt-add"]').disabled).toBe(true);
    expect(q('[data-testid="starter-prompts-count"]').textContent).toBe('4 of 4 prompts');
    const inputs = () => qa('[data-testid="starter-prompt-input"]');
    ['One', 'Two', 'Three', 'Four'].forEach((text, i) => type(inputs()[i], text));
    expect(qa('[data-testid="starter-prompt-chars"]')[0].textContent).toBe('3/200 characters');
    click(qa('[data-testid="starter-prompt-down"]')[0]);
    expect(latest.form.starterPrompts).toEqual(['Two', 'One', 'Three', 'Four']);
    key(inputs()[3], 'ArrowUp', { altKey: true });
    expect(latest.form.starterPrompts).toEqual(['Two', 'One', 'Four', 'Three']);
    expect(document.activeElement).toBe(inputs()[2]);
    key(inputs()[0], 'ArrowUp', { altKey: true });
    expect(latest.form.starterPrompts[0]).toBe('Two');
    click(qa('[data-testid="starter-prompt-remove"]')[1]);
    expect(latest.form.starterPrompts).toEqual(['Two', 'Four', 'Three']);
    expect(qa('[data-testid="starter-prompt-up"]')[0].disabled).toBe(true);
    expect(qa('[data-testid="starter-prompt-up"]')[0].getAttribute('aria-label')).toBe('Move prompt 1 up');
  });

  it('updates the preview in light and dark as the fields change', () => {
    mountStep(app({ starterPrompts: ['Summarize the week'] }));
    expect(q('[data-testid="app-preview-light-welcome"]').textContent).toBe('Research Desk');
    type(q('#apps-welcomeTitle'), 'What should we look into?');
    type(q('#apps-composerPlaceholder'), 'Ask the desk');
    type(q('#apps-agentDisplayName'), 'Ada');
    for (const theme of ['light', 'dark']) {
      expect(q(`[data-testid="app-preview-${theme}-welcome"]`).textContent).toBe('What should we look into?');
      expect(q(`[data-testid="app-preview-${theme}-placeholder"]`).textContent).toBe('Ask the desk');
      expect(q(`[data-testid="app-preview-${theme}-agent"]`).textContent).toBe('Ada');
      expect(q(`[data-testid="app-preview-${theme}-prompts"]`).textContent).toContain('Summarize the week');
    }
    click(q('[data-testid="palette-forest"]'));
    const light = q('[data-testid="app-preview-light"] .app-preview').style;
    const dark = q('[data-testid="app-preview-dark"] .app-preview').style;
    expect(light.getPropertyValue('--pv-primary')).toBe('#15803d');
    expect(dark.getPropertyValue('--pv-primary')).toBe('#4ade80');
    expect(dark.getPropertyValue('--pv-on-background')).toBe('#ffffff');
    type(q('#apps-cornerStyle'), 'Pill');
    type(q('#apps-density'), 'Compact');
    expect(q('[data-testid="app-preview-dark"] .app-preview').className).toContain('pv-corners-pill');
    expect(q('[data-testid="app-preview-dark"] .app-preview').className).toContain('pv-density-compact');
    click(q('#apps-showFilesPanel'));
    expect(q('[data-testid="app-preview-light-files"]')).toBeNull();
  });

  it('uploads an image inline as a new asset and selects it', async () => {
    const apiClient = {
      createAgentAsset: vi.fn(async (_tenant, body) => ({ id: 'aas_new', name: body.name, kind: body.kind })),
      uploadAgentAssetVersion: vi.fn(async () => ({ created: true, version: { number: 1 } }))
    };
    const reloadOptions = vi.fn();
    const latest = mountStep(app(), { apiClient, reloadOptions, assets: [{ id: 'aas_old', name: 'brand-logo' }] });
    expect(qa('#apps-logoAssetId option').map((o) => o.textContent)).toEqual([t('resources.apps.noLogo'), 'brand-logo']);
    const input = q('[data-testid="apps-agentAvatarAssetId-file"]');
    const file = new File([new Uint8Array([137, 80, 78, 71])], 'ada.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    await act(async () => {
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await flush();
    await flush();
    expect(apiClient.createAgentAsset).toHaveBeenCalledWith('default', expect.objectContaining({ kind: 'ReferenceFile', tags: ['app-appearance'] }));
    expect(apiClient.createAgentAsset.mock.calls[0][1].name).toMatch(/^research-avatar-/);
    expect(apiClient.uploadAgentAssetVersion).toHaveBeenCalledWith('default', 'aas_new', expect.objectContaining({ files: [expect.objectContaining({ path: 'ada.png', mediaType: 'image/png' })] }));
    expect(latest.form.agentAvatarAssetId).toBe('aas_new');
    expect(reloadOptions).toHaveBeenCalled();
    expect(q('[data-testid="apps-agentAvatarAssetId-uploaded"]')).not.toBeNull();
    expect(q('[data-testid="app-preview-light-avatar"]').getAttribute('src')).toMatch(/^data:image\/png;base64,/);
  });

  it('refuses a file that is not an image without calling the server', async () => {
    const apiClient = { createAgentAsset: vi.fn(), uploadAgentAssetVersion: vi.fn() };
    mountStep(app(), { apiClient });
    const input = q('[data-testid="apps-logoAssetId-file"]');
    Object.defineProperty(input, 'files', { value: [new File(['x'], 'notes.txt', { type: 'text/plain' })], configurable: true });
    await act(async () => {
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(q('[data-testid="apps-logoAssetId-error"]').textContent).toBe(t('components.appAppearance.image.notImage'));
    expect(apiClient.createAgentAsset).not.toHaveBeenCalled();
  });

  it('gives every control a tooltip of real text, and the role colors a dark field each', () => {
    mountStep(app());
    const controls = qa('[data-testid="app-appearance"] input, [data-testid="app-appearance"] select, [data-testid="app-appearance"] textarea, [data-testid="app-appearance"] button').filter((el) => el.type !== 'file');
    const missing = controls.filter((el) => (el.getAttribute('data-tip') || '').length < 25).map((el) => el.id || el.getAttribute('data-testid') || el.outerHTML.slice(0, 60));
    expect(missing).toEqual([]);
    for (const r of APP_COLOR_ROLES) expect(q(`#apps-${r.darkField}`), r.darkField).not.toBeNull();
  });
});
