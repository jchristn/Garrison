// A running turn never looks stalled while it is busy: after a tool call finishes, the line under the output says the
// agent is working on its next step, and only a long silence changes it to say how long it has been quiet.
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import i18n from '../i18n';
import TurnActivity from '../components/TurnActivity';
import { ACTIVITY_QUIET_MS, ACTIVITY_WRITING_MS, turnActivity } from '../utils/turnActivity';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const NOW = 1_800_000_000_000;
const text = { kind: 'text', text: 'Looking at the logs.' };
const toolDone = { kind: 'tool', name: 'mcp__garrison__garrison_list_runs', status: 'ok' };
const toolRunning = { kind: 'tool', name: 'mcp__garrison__garrison_list_runs', status: 'running' };

describe('turnActivity', () => {
  it('waits for a worker before the run starts, and for a person while suspended', () => {
    expect(turnActivity({ status: 'Queued', segments: [], now: NOW }).state).toBe('worker');
    expect(turnActivity({ status: 'Suspended', segments: [toolRunning], now: NOW }).state).toBe('approval');
  });

  it('says working after a tool call finishes, not idle', () => {
    expect(turnActivity({ status: 'Running', segments: [text, toolDone], lastEventAt: NOW - 500, now: NOW }).state).toBe('working');
  });

  it('stays quiet under streaming text and says working once the text stops', () => {
    expect(turnActivity({ status: 'Running', segments: [text], lastEventAt: NOW - 100, now: NOW }).state).toBe('writing');
    expect(turnActivity({ status: 'Running', segments: [text], lastEventAt: NOW - ACTIVITY_WRITING_MS - 1, now: NOW }).state).toBe('working');
  });

  it('names a running tool, however long it runs', () => {
    const a = turnActivity({ status: 'Running', segments: [toolRunning], lastEventAt: NOW - ACTIVITY_QUIET_MS * 3, now: NOW });
    expect(a.state).toBe('tool');
    expect(a.tool).toBe('mcp__garrison__garrison_list_runs');
  });

  it('says how long it has been quiet after a long silence', () => {
    const a = turnActivity({ status: 'Running', segments: [toolDone], lastEventAt: NOW - ACTIVITY_QUIET_MS, now: NOW });
    expect(a.state).toBe('quiet');
    expect(a.quietMs).toBe(ACTIVITY_QUIET_MS);
  });
});

describe('TurnActivity', () => {
  let container;
  let root;
  beforeAll(async () => {
    await i18n.changeLanguage('en');
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });
  const mount = (props) => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => root.render(<TurnActivity {...props} />));
    return container.querySelector('[data-testid="turn-activity"]');
  };

  it('shows the working line after a finished tool call', () => {
    const el = mount({ status: 'Running', segments: [text, toolDone], lastEventAt: Date.now() });
    expect(el.dataset.state).toBe('working');
    expect(el.textContent).toContain('Working on the next step');
  });

  it('shows the tool name without its MCP prefix', () => {
    const el = mount({ status: 'Running', segments: [toolRunning], lastEventAt: Date.now() });
    expect(el.textContent).toContain('Running garrison_list_runs');
  });

  it('renders nothing while text is streaming', () => {
    expect(mount({ status: 'Running', segments: [text], lastEventAt: Date.now() })).toBeNull();
  });

  it('says how long it has been quiet, with the run status', () => {
    const el = mount({ status: 'Running', segments: [toolDone], lastEventAt: Date.now() - ACTIVITY_QUIET_MS - 5000 });
    expect(el.dataset.state).toBe('quiet');
    expect(el.textContent).toMatch(/No new output for .+\. The run is still Running\./);
  });
});
