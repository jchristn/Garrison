// App appearance (LP8.5): dark colors and their derivation, the theme rule, corner style and density, and what the
// chat shows from the app's appearance fields (subtitle, welcome title, starter prompts, placeholder, agent name and
// avatar, hidden files panel, language picker, theme switch, and the Powered by Garrison line).

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import i18n from '../i18n';
import App from '../App.jsx';
import { applyBranding, brandingVariables, contrastRatio, deriveDarkColor, layoutAttributes, toOklch } from '../utils/branding.js';
import { appTheme, themeSwitchAllowed } from '../utils/theme.js';
import { FakeEventSource, mockFetch } from './fakes.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const SESSION = { token: 'gas_t', expiresUtc: '2099-01-01T00:00:00Z', principalName: 'anonymous', anonymous: true };
const TURN = { runId: 'run_1', turn: 1, message: 'Summarize the week', status: 'Succeeded', answer: 'Done.', awaitingApproval: false, createdUtc: '2026-10-28T12:00:00Z' };
const BASE = { slug: 'demo', displayName: 'Research Desk', welcomeText: 'Hello.', authMode: 'Anonymous', anonymousAllowed: true, showOperatorDetail: false };

describe('dark colors', () => {
  it('derives a dark surface with the same hue and a brighter brand color', () => {
    const light = '#fff7ed';
    const dark = deriveDarkColor(light, 'surface');
    expect(toOklch(dark).l).toBeLessThan(0.25);
    expect(Math.abs(toOklch(dark).h - toOklch(light).h)).toBeLessThan(0.35);
    expect(contrastRatio(dark, '#e6edf6')).toBeGreaterThanOrEqual(4.5);
    expect(deriveDarkColor('#0b1220', 'surface')).toBe('#0b1220');
    expect(toOklch(deriveDarkColor('#0f766e', 'brand')).l).toBeCloseTo(0.72, 1);
    expect(deriveDarkColor('#e5e5e5', 'brand')).toBe('#e5e5e5');
    expect(deriveDarkColor('nope')).toBeNull();
  });

  it('uses dark colors in the dark theme, derives null ones only for apps with a palette, and keeps old apps as they were', () => {
    const old = { primaryColor: '#1e3a8a', backgroundColor: '#f8fafc' };
    expect(brandingVariables(old, 'dark')).toEqual(brandingVariables(old, 'light'));
    const chosen = { ...old, paletteId: 'ocean', darkPrimaryColor: '#38bdf8' };
    const dark = brandingVariables(chosen, 'dark');
    expect(dark['--app-primary']).toBe('#38bdf8');
    expect(dark['--app-on-primary']).toBe('#000000');
    expect(dark['--app-background']).toBe(deriveDarkColor('#f8fafc'));
    expect(dark['--app-on-background']).toBe('#ffffff');
    expect(brandingVariables(chosen, 'light')['--app-background']).toBe('#f8fafc');
    expect(brandingVariables({ darkHeaderColor: '#111111' }, 'light')['--app-header']).toBeUndefined();
    expect(brandingVariables({ darkHeaderColor: 'red', headerColor: '#ffffff' }, 'dark')['--app-header']).toBe('#ffffff');
  });

  it('sets the corner style and density attributes only when they differ from the defaults', () => {
    expect(layoutAttributes({})).toEqual({ 'data-corners': null, 'data-density': null });
    expect(layoutAttributes({ cornerStyle: 'Rounded', density: 'Comfortable' })).toEqual({ 'data-corners': null, 'data-density': null });
    const root = document.createElement('div');
    root.setAttribute('data-theme', 'dark');
    applyBranding({ slug: 'demo', cornerStyle: 'Pill', density: 'Compact', paletteId: 'x', backgroundColor: '#ffffff' }, root);
    expect(root.getAttribute('data-corners')).toBe('pill');
    expect(root.getAttribute('data-density')).toBe('compact');
    expect(root.style.getPropertyValue('--app-background')).toBe(deriveDarkColor('#ffffff'));
    applyBranding({ slug: 'demo', cornerStyle: 'Sharp' }, root, null, 'light');
    expect(root.getAttribute('data-corners')).toBe('sharp');
    expect(root.hasAttribute('data-density')).toBe(false);
  });
});

describe('theme rule', () => {
  beforeEach(() => localStorage.clear());

  it('starts from themeDefault and ignores a saved choice when switching is off', () => {
    localStorage.setItem('garrison.app.theme', 'dark');
    expect(appTheme({})).toBe('dark');
    expect(appTheme({ themeDefault: 'Light' })).toBe('dark');
    expect(appTheme({ themeDefault: 'Light', allowThemeSwitch: false })).toBe('light');
    localStorage.clear();
    expect(appTheme({ themeDefault: 'Dark' })).toBe('dark');
    expect(appTheme({ themeDefault: 'System' })).toBe('light');
    expect(themeSwitchAllowed({})).toBe(true);
    expect(themeSwitchAllowed({ allowThemeSwitch: false })).toBe(false);
  });
});

let container;
let root;
const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
const q = (sel) => document.body.querySelector(sel);
const qa = (sel) => [...document.body.querySelectorAll(sel)];

async function render(element) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => root.render(element));
  await flush();
  await flush();
}

async function click(el) {
  await act(async () => el.click());
  await flush();
}

describe('the chat with appearance settings', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('en');
  });

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    FakeEventSource.reset();
    window.EventSource = FakeEventSource;
    window.GARRISON_CONFIG = { apiUrl: '' };
    window.history.replaceState(null, '', '/apps/demo/');
    sessionStorage.setItem('garrison.app.session.demo', JSON.stringify(SESSION));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    document.body.innerHTML = '';
    document.documentElement.removeAttribute('data-corners');
    document.documentElement.removeAttribute('data-density');
  });

  it('shows the subtitle, welcome title, placeholder, and starter prompts, and sends a prompt when clicked', async () => {
    const info = {
      ...BASE,
      subtitle: 'Weekly research, summarized',
      welcomeTitle: 'What should we look into?',
      composerPlaceholder: 'Ask the desk',
      starterPrompts: ['Summarize the week', 'Find new papers'],
      themeDefault: 'Dark',
      cornerStyle: 'Sharp'
    };
    const fetchImpl = mockFetch({
      'GET /v1.0/apps/demo': info,
      'GET /v1.0/apps/demo/conversations': [200, []],
      'POST /v1.0/apps/demo/conversations': [201, { conversationId: 'cnv_1', turn: { ...TURN, status: 'Queued', answer: null } }],
      'GET /v1.0/apps/demo/conversations/cnv_1/files': { fileCount: 0, totalBytes: 0, files: [] }
    });
    await render(<App fetchImpl={fetchImpl} />);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-corners')).toBe('sharp');
    expect(q('[data-testid="brand-subtitle"]').textContent).toBe('Weekly research, summarized');
    expect(q('.welcome-title').textContent).toBe('What should we look into?');
    expect(q('[data-testid="welcome-subtitle"]').textContent).toBe('Weekly research, summarized');
    expect(q('[data-testid="composer-input"]').getAttribute('placeholder')).toBe('Ask the desk');
    const prompts = qa('[data-testid="starter-prompt"]');
    expect(prompts.map((b) => b.textContent)).toEqual(['Summarize the week', 'Find new papers']);
    expect(prompts[0].getAttribute('data-tip')).toBeTruthy();
    await click(prompts[0]);
    const sent = fetchImpl.calls.find((c) => c.method === 'POST' && c.path === '/v1.0/apps/demo/conversations');
    expect(sent.body.message).toBe('Summarize the week');
    expect(q('[data-testid="powered-by"]')).not.toBeNull();
  });

  it('names the agent and shows its avatar, and hides what the app turns off', async () => {
    window.history.replaceState(null, '', '/apps/demo/c/cnv_1');
    localStorage.setItem('garrison.app.theme', 'dark');
    const info = { ...BASE, agentDisplayName: 'Ada', agentAvatarUrl: '/v1.0/apps/demo/avatar', showFilesPanel: false, showLanguagePicker: false, allowThemeSwitch: false, showPoweredBy: false, themeDefault: 'Light' };
    const fetchImpl = mockFetch({
      'GET /v1.0/apps/demo': info,
      'GET /v1.0/apps/demo/conversations': [{ id: 'cnv_1', turnCount: 1, busy: false, createdUtc: '2026-10-28T12:00:00Z' }],
      'GET /v1.0/apps/demo/conversations/cnv_1': { id: 'cnv_1', turnCount: 1, turns: [TURN] },
      'GET /v1.0/apps/demo/conversations/cnv_1/files': { fileCount: 0, totalBytes: 0, files: [] }
    });
    await render(<App fetchImpl={fetchImpl} />);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(q('.message-agent .message-author').textContent).toBe('Ada');
    expect(q('[data-testid="agent-avatar"]').getAttribute('src')).toBe('/v1.0/apps/demo/avatar');
    expect(q('[data-testid="toggle-files"]')).toBeNull();
    expect(q('#file-sidebar')).toBeNull();
    expect(q('[data-testid="language-select"]')).toBeNull();
    expect(q('[data-testid="theme-toggle"]')).toBeNull();
    expect(q('[data-testid="powered-by"]')).toBeNull();
    expect(q('[data-testid="starter-prompts"]')).toBeNull();
  });

  it('looks as before when the app sets none of the new fields', async () => {
    const fetchImpl = mockFetch({ 'GET /v1.0/apps/demo': BASE, 'GET /v1.0/apps/demo/conversations': [200, []] });
    await render(<App fetchImpl={fetchImpl} />);
    expect(q('.welcome-title').textContent).toBe('Research Desk');
    expect(q('[data-testid="brand-subtitle"]')).toBeNull();
    expect(q('[data-testid="starter-prompts"]')).toBeNull();
    expect(q('[data-testid="composer-input"]').getAttribute('placeholder')).toBe(i18n.t('chat.composerPlaceholder'));
    expect(q('[data-testid="toggle-files"]')).not.toBeNull();
    expect(q('[data-testid="language-select"]')).not.toBeNull();
    expect(q('[data-testid="theme-toggle"]')).not.toBeNull();
    expect(document.documentElement.hasAttribute('data-corners')).toBe(false);
    expect(document.documentElement.hasAttribute('data-density')).toBe(false);
  });
});
