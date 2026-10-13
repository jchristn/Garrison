import { beforeAll, afterEach, describe, it, expect, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import i18n from '../i18n';
import McpTestModal from '../components/McpTestModal';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root;
let container;
beforeAll(async () => { await i18n.changeLanguage('en'); });
afterEach(() => {
  if (root) act(() => root.unmount());
  container?.remove();
  root = null;
});
async function mount(props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root.render(<McpTestModal name="fixture" onClose={() => {}} {...props} />); });
}

describe('worker MCP diagnostics', () => {
  it('requires an explicit compatible Ready worker before starting stdio', async () => {
    const load = vi.fn().mockResolvedValue({ success: true, nodeId: 'node-ready', tools: ['fixture_status'] });
    const loadNodes = vi.fn().mockResolvedValue({ items: [
      { id: 'node-ready', name: 'Ready worker', status: 'Ready', supportsMcpTests: true },
      { id: 'node-old', name: 'Old worker', status: 'Ready', supportsMcpTests: false },
      { id: 'node-offline', name: 'Offline worker', status: 'Offline', supportsMcpTests: true }
    ] });
    await mount({ load, loadNodes });
    expect(load).not.toHaveBeenCalled();
    const select = document.querySelector('#mcp-test-worker');
    expect([...select.options].map((o) => o.value)).toEqual(['', 'node-ready']);
    const run = [...document.querySelectorAll('button')].find((b) => b.textContent === 'Run test');
    expect(run.disabled).toBe(true);
    await act(async () => { select.value = 'node-ready'; select.dispatchEvent(new Event('change', { bubbles: true })); });
    await act(async () => { run.click(); });
    expect(load).toHaveBeenCalledOnce();
    expect(load).toHaveBeenCalledWith('node-ready');
    expect(document.body.textContent).toContain('fixture_status');
  });
  it('preserves automatic HTTP tests without requiring a worker', async () => {
    const load = vi.fn().mockResolvedValue({ success: true, tools: [] });
    await mount({ load });
    expect(load).toHaveBeenCalledOnce();
    expect(document.querySelector('#mcp-test-worker')).toBeNull();
  });
  it('shows a failed diagnostic message without requiring JSON expansion', async () => {
    await mount({ load: () => Promise.resolve({ success: false, error: 'Required tools are missing.', tools: [] }) });
    expect(document.body.textContent).toContain('Required tools are missing.');
  });
});
