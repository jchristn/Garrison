// Field warnings (I-08) after a create or update and in manifest apply results, and the node containerized flag
// (G-29).

import { beforeAll, afterEach, describe, it, expect, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import i18n from '../i18n';
import FieldWarnings, { fieldWarningsOf } from '../components/FieldWarnings';
import ManifestResults from '../components/ManifestResults';
import { translateServerText } from '../utils/serverText';
import { nodesConfig } from '../views/runConfigs';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root;
let container;
beforeAll(async () => {
  await i18n.changeLanguage('en');
});
afterEach(async () => {
  if (root) act(() => root.unmount());
  container?.remove();
  root = null;
  await i18n.changeLanguage('en');
});
async function mount(element) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(element);
  });
}

const CLAMPED = { field: 'maxAttempts', code: 'ValueClamped', given: '99', stored: '10', message: 'maxAttempts 99 is outside the allowed range 1 to 10; 10 was stored.' };

describe('field warnings (I-08)', () => {
  it('reads the warnings array and ignores responses without one', () => {
    expect(fieldWarningsOf({ id: 'dep_1', warnings: [CLAMPED] })).toEqual([CLAMPED]);
    expect(fieldWarningsOf({ id: 'dep_1' })).toEqual([]);
    expect(fieldWarningsOf(null)).toEqual([]);
    expect(fieldWarningsOf({ warnings: [null, CLAMPED] })).toEqual([CLAMPED]);
  });

  it('translates the server clamp message', async () => {
    const t = (...args) => i18n.t(...args);
    expect(translateServerText(t, CLAMPED.message)).toBe('The value 99 for maxAttempts is outside the allowed range 1 to 10; 10 was stored.');
    await i18n.changeLanguage('de');
    expect(translateServerText(t, CLAMPED.message)).toBe('Der Wert 99 für maxAttempts liegt außerhalb des zulässigen Bereichs 1 bis 10; gespeichert wurde 10.');
  });

  it('lists each field and message and can be dismissed', async () => {
    const onDismiss = vi.fn();
    await mount(<FieldWarnings warnings={[CLAMPED, { field: 'weight', code: 'ValueClamped', message: '' }]} onDismiss={onDismiss} />);
    const notice = document.querySelector('[data-testid="field-warnings"]');
    expect(notice).not.toBeNull();
    expect(notice.getAttribute('role')).toBe('note');
    expect(notice.textContent).toContain('Saved with 2 adjusted values');
    const items = notice.querySelectorAll('li');
    expect(items).toHaveLength(2);
    expect(items[0].getAttribute('data-field')).toBe('maxAttempts');
    expect(items[0].textContent).toContain('maxAttempts');
    expect(items[0].textContent).toContain('outside the allowed range 1 to 10');
    expect(items[1].textContent).toContain('Value clamped to the allowed range');
    await act(async () => {
      document.querySelector('[data-testid="field-warnings-dismiss"]').click();
    });
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('renders nothing without warnings', async () => {
    await mount(<FieldWarnings warnings={[]} />);
    expect(document.querySelector('[data-testid="field-warnings"]')).toBeNull();
  });

  it('shows manifest item warnings under the item row', async () => {
    const items = [
      { id: 'mai_1', kind: 'Agent', name: 'echo-agent', result: 'Validated', plannedResult: 'Created', message: 'Would be created.', warnings: [] },
      { id: 'mai_2', kind: 'Deployment', name: 'echo-default', result: 'Validated', plannedResult: 'Updated', message: 'Would be updated.', warnings: [CLAMPED] }
    ];
    await mount(<ManifestResults items={items} />);
    const notices = document.querySelectorAll('[data-testid="manifest-warnings"]');
    expect(notices).toHaveLength(1);
    expect(notices[0].querySelector('li').getAttribute('data-code')).toBe('ValueClamped');
    expect(notices[0].textContent).toContain('maxAttempts');
    expect(document.querySelector('tr[data-item="echo-default"]').textContent).toContain('1 warning');
    expect(document.querySelector('tr[data-item="echo-agent"]').textContent).not.toContain('warning');
  });
});

describe('node containerized flag (G-29)', () => {
  const t = (...args) => i18n.t(...args);
  const ctx = { t, i18n };
  it('has a Containerized column with yes and no and a CSV value', () => {
    const col = nodesConfig.columns(ctx).find((c) => c.key === 'containerized');
    expect(col).toBeTruthy();
    expect(col.label).toBe('Containerized');
    expect(col.csv({ containerized: true })).toBe('true');
    expect(col.csv({})).toBe('false');
  });
  it('shows the flag in the node detail', () => {
    const field = nodesConfig.fields({}, { t }).find((f) => f.name === 'containerized');
    expect(field).toBeTruthy();
    expect(field.type).toBe('checkbox');
    expect(field.tip).toContain('container or pod');
  });
});
