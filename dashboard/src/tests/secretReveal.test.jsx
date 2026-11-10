// Secret reveal: the API client route, the Reveal row action (hidden for LeaseBroker, disabled without a value or
// without Admin on Secret), the dialog that fetches only on request and drops the value when hidden, the audit event
// label, and the new strings in every locale.
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import i18n from '../i18n';
import { TRANSLATIONS } from '../i18n/resources';
import SecretRevealModal from '../components/SecretRevealModal';
import { secretsConfig, secretRevealBlocked } from '../views/resourceConfigs';
import { ENUMS } from '../utils/constants';
import ApiClient from '../utils/api';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const t = (...args) => i18n.t(...args);

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

function mount(element) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(element));
  mounted.push({ root, container });
  return container;
}

const q = (selector) => document.body.querySelector(selector);
const stored = { id: 'sec_1', name: 'anthropic', kind: 'AnthropicApiKey', valueLast4: '1234' };
const manager = { permissions: { isAdmin: false, isTenantAdmin: false, grants: [{ resourceTypes: ['Secret'], operations: ['All'], permissionType: 'Permit' }] } };
const user = { permissions: { isAdmin: false, isTenantAdmin: false, grants: [{ resourceTypes: ['Secret'], operations: ['Read', 'Execute'], permissionType: 'Permit' }] } };

describe('secret reveal', () => {
  it('posts to the reveal route', async () => {
    const calls = [];
    const original = globalThis.fetch;
    globalThis.fetch = vi.fn(async (url, init) => {
      calls.push(`${init.method} ${String(url)}`);
      return new Response(JSON.stringify({ id: 'sec_1', value: 'v' }), { status: 200 });
    });
    try {
      await new ApiClient('http://127.0.0.1:8700', 'tok').revealSecret('default', 'sec_1');
      expect(calls).toEqual(['POST http://127.0.0.1:8700/v1.0/api/tenants/default/secrets/sec_1/reveal']);
    } finally {
      globalThis.fetch = original;
    }
  });

  it('offers Reveal only when the caller may and the secret has a value', () => {
    const ctx = (lookups) => ({ t, lookups, setExtraModal: vi.fn(), apiClient: {}, tenantId: 'default' });
    const reveal = (row, lookups) => secretsConfig.rowActions(row, ctx(lookups)).find((a) => a.label === t('resources.secrets.actions.reveal'));
    expect(reveal(stored, manager).disabled).toBe(false);
    expect(reveal(stored, { permissions: { isTenantAdmin: true } }).disabled).toBe(false);
    expect(reveal(stored, user).disabled).toBe(true);
    expect(reveal(stored, user).tip).toMatch(/Admin/);
    expect(secretRevealBlocked({ ...stored, valueLast4: null }, { t, lookups: manager })).toBe(t('tips.resources.secrets.revealNoValue'));
    expect(reveal({ ...stored, kind: 'LeaseBroker', valueLast4: null }, manager).hidden).toBe(true);
  });

  it('fetches only when asked, shows the value with a copy button, and drops it on hide', async () => {
    const load = vi.fn(async () => ({ id: 'sec_1', name: 'anthropic', value: 'sk-ant-shown-1234' }));
    mount(<SecretRevealModal name="anthropic" load={load} onClose={() => {}} />);
    expect(load).not.toHaveBeenCalled();
    expect(q('[data-testid="secret-reveal-warning"]').textContent).toMatch(/audit log/);
    expect(q('[data-testid="secret-reveal-value"]')).toBeNull();
    await act(async () => q('[data-testid="secret-reveal-confirm"]').click());
    expect(load).toHaveBeenCalledTimes(1);
    expect(q('[data-testid="secret-reveal-value"]').textContent).toBe('sk-ant-shown-1234');
    const card = q('[data-testid="secret-reveal-card"]');
    expect(card.classList.contains('code-block')).toBe(true);
    expect(card.querySelector('[data-testid="secret-reveal-value"]').tagName).toBe('PRE');
    expect(card.querySelector('[data-testid="secret-reveal-copy"]').classList.contains('copy-btn')).toBe(true);
    await act(async () => q('[data-testid="secret-reveal-hide"]').click());
    expect(q('[data-testid="secret-reveal-value"]')).toBeNull();
    expect(document.body.textContent).not.toContain('sk-ant-shown-1234');
  });

  it('shows the server refusal instead of a value', async () => {
    const load = vi.fn(async () => {
      throw Object.assign(new Error('Forbidden'), { status: 403, message: 'You need Admin on Secret.' });
    });
    mount(<SecretRevealModal name="anthropic" load={load} onClose={() => {}} />);
    await act(async () => q('[data-testid="secret-reveal-confirm"]').click());
    expect(q('[data-testid="secret-reveal-error"]')).not.toBeNull();
    expect(q('[data-testid="secret-reveal-value"]')).toBeNull();
  });

  it('labels SecretRevealed and the reveal strings in every locale', () => {
    expect(ENUMS.auditEventType).toContain('SecretRevealed');
    for (const catalog of Object.values(TRANSLATIONS)) {
      expect(catalog.enums.auditEventType.SecretRevealed).toBeTruthy();
      expect(catalog.components.secretReveal.reveal).toBeTruthy();
      expect(catalog.resources.secrets.actions.reveal).toBeTruthy();
    }
    expect(t('resources.secrets.subtitle')).not.toMatch(/write-only/);
  });
});
