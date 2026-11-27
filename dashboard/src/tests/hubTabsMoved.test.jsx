// AA13: Board, Performance, Change rules, and the evaluation tabs moved out of Autonomy. An old link to one of them
// forwards to the hub that owns the tab now, instead of opening the Autonomy hub's first tab.
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import i18n from '../i18n';
import { UrlTabs } from '../components/Tabs';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;

function Where() {
  const location = useLocation();
  return <div data-testid="where">{`${location.pathname}${location.search}`}</div>;
}

function mount(url) {
  const tabs = [
    { id: 'keepers', label: 'Keepers', render: () => <Where /> },
    { id: 'messages', label: 'Messages', render: () => <Where /> }
  ];
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/dashboard/autonomy" element={<UrlTabs tabs={tabs} label="Autonomy" />} />
          <Route path="*" element={<Where />} />
        </Routes>
      </MemoryRouter>
    );
  });
  return container.querySelector('[data-testid="where"]').textContent;
}

beforeAll(async () => {
  await i18n.changeLanguage('en');
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('hub tabs that moved', () => {
  it('forwards a moved tab to its new hub and keeps other parameters', () => {
    expect(mount('/dashboard/autonomy?tab=board')).toBe('/dashboard/organizations?tab=board');
    expect(mount('/dashboard/autonomy?tab=eval-runs&status=Running')).toBe('/dashboard/evaluations?tab=eval-runs&status=Running');
  });

  it('drops the tab parameter when the moved tab is its new hub default', () => {
    expect(mount('/dashboard/autonomy?tab=organizations')).toBe('/dashboard/organizations');
  });

  it('opens the tab that is still here, and the first tab for an unknown one', () => {
    expect(mount('/dashboard/autonomy?tab=messages')).toBe('/dashboard/autonomy?tab=messages');
    expect(mount('/dashboard/autonomy?tab=nowhere')).toBe('/dashboard/autonomy?tab=nowhere');
  });
});
