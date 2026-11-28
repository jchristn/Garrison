// Shared table states and helpers (LP5.5, UX pass 1): a failed load shows its error instead of "0 records" and an empty
// row, a first load hides the counts, the empty message sits outside the scrolling table, column width classes, the
// shared row actions, and tooltips that open on keyboard focus but not on programmatic focus.
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import i18n from '../i18n';
import TableFrame from '../components/TableFrame';
import RowActions from '../components/RowActions';
import { columnWidthClass } from '../components/DataTable';
import { TooltipLayer } from '../components/Tooltip';
import { ToastProvider } from '../context/ToastContext';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'createdUtc', label: 'Created' },
  { key: 'description', label: 'Description' },
  { key: 'actions', label: 'Actions', render: () => 'x' }
];

let container;
let root;

function mount(node) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<ToastProvider>{node}</ToastProvider>));
}

function unmount() {
  act(() => root.unmount());
  container.remove();
}

const q = (sel) => container.querySelector(sel);

beforeAll(async () => {
  await i18n.changeLanguage('en');
});

beforeEach(() => localStorage.clear());

afterEach(() => {
  vi.useRealTimers();
});

describe('table states', () => {
  it('shows a load error in place of the rows, with no record count or empty message', () => {
    mount(<TableFrame tableId="states-error" columns={COLUMNS} items={[]} totalRecords={0} pageNumber={1} pageSize={25} onPageChange={() => {}} error={<div className="error-banner">Boom</div>} emptyMessage="No records match the current filters." />);
    expect(q('[data-testid="table-error"]').textContent).toContain('Boom');
    expect(container.textContent).not.toContain('records');
    expect(container.textContent).not.toContain('No records match');
    expect(container.textContent).not.toContain('Page 1 of 1');
    unmount();
  });

  it('hides the counts during a first load', () => {
    mount(<TableFrame tableId="states-loading" columns={COLUMNS} items={[]} loading totalRecords={0} pageNumber={1} pageSize={25} onPageChange={() => {}} />);
    expect(container.textContent).not.toContain('0 records');
    expect(container.textContent).not.toContain('Page 1 of 1');
    unmount();
  });

  it('puts the empty message below the scrolling table, not inside it', () => {
    mount(<TableFrame tableId="states-empty" columns={COLUMNS} items={[]} totalRecords={0} pageNumber={1} pageSize={25} onPageChange={() => {}} emptyMessage="Nothing here yet." />);
    expect(q('.table-scroll .table-empty')).toBeNull();
    expect(q('.table-scroll + .table-empty').textContent).toBe('Nothing here yet.');
    expect(container.textContent).toContain('0 records');
    unmount();
  });

  it('marks short, long text, and action columns', () => {
    expect(columnWidthClass({ key: 'createdUtc' })).toBe('col-short');
    expect(columnWidthClass({ key: 'version' })).toBe('col-short');
    expect(columnWidthClass({ key: 'status' })).toBe('');
    expect(columnWidthClass({ key: 'description' })).toBe('col-text');
    expect(columnWidthClass({ key: 'actions' })).toBe('col-actions');
    expect(columnWidthClass({ key: 'name' })).toBe('');
    expect(columnWidthClass({ key: 'name', nowrap: true })).toBe('col-short');
    expect(columnWidthClass({ key: 'status', wrap: true })).toBe('col-text');
    mount(<TableFrame tableId="states-classes" columns={COLUMNS} items={[{ id: 'a', name: 'A', createdUtc: 'now', description: 'Text' }]} totalRecords={1} pageNumber={1} pageSize={25} onPageChange={() => {}} />);
    const cells = [...container.querySelectorAll('tbody td')].map((td) => td.className);
    expect(cells).toEqual(['', 'col-short', 'col-text', 'col-actions']);
    unmount();
  });
});

describe('row actions', () => {
  it('shows one inline primary action and the rest in the row menu', () => {
    const remove = vi.fn();
    const edit = vi.fn();
    mount(<RowActions label="Case 1" menuTestId="case-menu" primary={{ label: 'Edit', onClick: edit, testId: 'case-edit' }} items={[{ label: 'Remove', onClick: remove, testId: 'case-remove' }]} />);
    expect(q('[data-testid="case-edit"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="case-remove"]')).toBeNull();
    act(() => q('[data-testid="case-edit"]').click());
    expect(edit).toHaveBeenCalledTimes(1);
    act(() => q('[data-testid="case-menu"]').click());
    act(() => document.querySelector('[data-testid="case-remove"]').click());
    expect(remove).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('keeps a disabled primary action inert', () => {
    const edit = vi.fn();
    mount(<RowActions primary={{ label: 'Edit', onClick: edit, testId: 'case-edit', disabled: true, tip: 'You may not do this.' }} items={[]} />);
    const button = q('[data-testid="case-edit"]');
    expect(button.getAttribute('aria-disabled')).toBe('true');
    act(() => button.click());
    expect(edit).not.toHaveBeenCalled();
    unmount();
  });
});

describe('tooltips and focus', () => {
  it('opens no tooltip on programmatic focus, and opens one after a Tab key', () => {
    vi.useFakeTimers();
    mount(
      <>
        <TooltipLayer />
        <button type="button" data-tip="Close this window" data-testid="tipped">
          x
        </button>
        <button type="button" data-tip="Second" data-testid="second">
          y
        </button>
      </>
    );
    const bubble = () => document.getElementById('garrison-tooltip');
    act(() => q('[data-testid="tipped"]').focus());
    act(() => vi.advanceTimersByTime(1000));
    expect(bubble().classList.contains('is-visible')).toBe(false);
    act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true })));
    act(() => q('[data-testid="second"]').focus());
    act(() => vi.advanceTimersByTime(1000));
    expect(bubble().classList.contains('is-visible')).toBe(true);
    expect(bubble().textContent).toBe('Second');
    unmount();
  });
});
