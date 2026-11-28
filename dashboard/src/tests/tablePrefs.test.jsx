// Every table's pagination bar carries a labeled Columns control, and both the column choice and the rows per page are
// saved per table, so a later visit opens the table the way the user left it.
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import i18n from '../i18n';
import LocalTableFrame from '../components/LocalTableFrame';
import { ToastProvider } from '../context/ToastContext';
import { savedPageSize } from '../hooks/usePageSizePref';
import { STORAGE_KEYS } from '../utils/constants';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const ITEMS = Array.from({ length: 30 }, (_, i) => ({ id: `row-${i + 1}`, name: `Row ${i + 1}`, note: `Note ${i + 1}` }));
const COLUMNS = [
  { key: 'name', label: 'Name', pinned: true },
  { key: 'note', label: 'Note' },
  { key: 'extra', label: 'Extra', defaultHidden: true, render: () => 'x' }
];

let container;
let root;

function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(
      <ToastProvider>
        <LocalTableFrame tableId="prefs-test" columns={COLUMNS} items={ITEMS} testId="prefs-table" />
      </ToastProvider>
    ));
}

function unmount() {
  act(() => root.unmount());
  container.remove();
}

const rows = () => container.querySelectorAll('[data-testid="prefs-table"] tbody tr').length;
const headers = () => [...container.querySelectorAll('[data-testid="prefs-table"] thead th')].map((th) => th.textContent);

beforeAll(async () => {
  await i18n.changeLanguage('en');
});

beforeEach(() => localStorage.clear());

afterEach(() => {
  document.querySelectorAll('.column-picker').forEach((el) => el.remove());
});

describe('table preferences', () => {
  it('labels the Columns control inside the pagination bar', () => {
    mount();
    const button = container.querySelector('.table-pagination [data-testid="column-picker"]');
    expect(button).not.toBeNull();
    expect(button.textContent).toBe('Columns');
    unmount();
  });

  it('keeps the rows per page from one visit to the next', () => {
    mount();
    expect(rows()).toBe(25);
    const select = container.querySelector('.table-pagination-size select');
    act(() => {
      select.value = '10';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(rows()).toBe(10);
    unmount();

    expect(savedPageSize('prefs-test')).toBe(10);
    mount();
    expect(rows()).toBe(10);
    unmount();
  });

  it('keeps the column choice from one visit to the next', () => {
    mount();
    expect(headers()).toEqual(['Name', 'Note']);
    act(() => container.querySelector('[data-testid="column-picker"]').click());
    const note = [...document.querySelectorAll('.column-picker-item')].find((el) => el.textContent.includes('Note'));
    act(() => note.querySelector('input').click());
    expect(headers()).toEqual(['Name']);
    unmount();

    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.columns))['prefs-test'].hidden).toContain('note');
    mount();
    expect(headers()).toEqual(['Name']);
    unmount();
  });

  it('ignores a saved page size that is not offered', () => {
    localStorage.setItem(STORAGE_KEYS.pageSize, JSON.stringify({ 'prefs-test': 7 }));
    expect(savedPageSize('prefs-test')).toBe(25);
  });
});
