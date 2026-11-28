// Activity trail client (LP2.1): the getRunTrail route and query, the effect operations route the drawer uses, and the
// useRunTrail hook's auto-refresh (LP-011: 5 seconds while a step runs, off when every step is terminal, and a
// person's own choice kept), all against the LP1.5 fixture.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import ApiClient from '../utils/api';
import useRunTrail, { TRAIL_LIVE_REFRESH_SECONDS } from '../hooks/useRunTrail';
import fixture from './fixtures/runTrail.json';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });

let mounted = [];
afterEach(() => {
  for (const { root, container } of mounted) {
    act(() => root.unmount());
    container.remove();
  }
  mounted = [];
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function Probe({ apiClient, runId, out }) {
  const state = useRunTrail(apiClient, 'default', runId);
  out.current = state;
  return null;
}

function mountHook(apiClient, runId = 'run_b2') {
  const out = { current: null };
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(<Probe apiClient={apiClient} runId={runId} out={out} />));
  mounted.push({ root, container });
  return out;
}

const running = () => ({ ...fixture, nodes: fixture.nodes.map((n) => (n.id === 'run_a6' ? { ...n, state: 'Running', endedUtc: null } : n)) });

describe('trail API client', () => {
  it('reads the trail route with includeEffects and the run operations route', async () => {
    const calls = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url) => {
        calls.push(String(url));
        const body = String(url).includes('/operations') ? [{ id: 'eff_1', tool: 'garrison_send_message' }] : fixture;
        return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
      })
    );
    const client = new ApiClient('http://127.0.0.1:8700', 'tok');
    const trail = await client.getRunTrail('default', 'run_b2');
    expect(trail.focusRunId).toBe('run_b2');
    expect(calls[0]).toBe('http://127.0.0.1:8700/v1.0/api/tenants/default/runs/run_b2/trail?includeEffects=true');
    await client.getRunTrail('default', 'run_b2', { includeEffects: false });
    expect(calls[1]).toContain('includeEffects=false');
    const ops = await client.listRunOperations('default', 'run_a1');
    expect(calls[2]).toBe('http://127.0.0.1:8700/v1.0/api/tenants/default/runs/run_a1/operations');
    expect(ops[0].id).toBe('eff_1');
  });
});

describe('useRunTrail', () => {
  it('loads the trail and leaves auto-refresh off when every step is terminal', async () => {
    const apiClient = { getRunTrail: vi.fn(async () => fixture) };
    const out = mountHook(apiClient);
    await flush();
    expect(apiClient.getRunTrail).toHaveBeenCalledWith('default', 'run_b2', { includeEffects: true });
    expect(out.current.trail.nodeCount).toBe(15);
    expect(out.current.live).toBe(false);
    expect(out.current.autoRefresh).toBe(0);
  });

  it('refreshes every 5 seconds while a step runs and stops once all are terminal', async () => {
    vi.useFakeTimers();
    let current = running();
    const apiClient = { getRunTrail: vi.fn(async () => current) };
    const out = mountHook(apiClient);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(out.current.live).toBe(true);
    expect(out.current.autoRefresh).toBe(TRAIL_LIVE_REFRESH_SECONDS);
    current = fixture;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(apiClient.getRunTrail).toHaveBeenCalledTimes(2);
    expect(out.current.autoRefresh).toBe(0);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(20000);
    });
    expect(apiClient.getRunTrail).toHaveBeenCalledTimes(2);
  });

  it('keeps the interval a person picked and keeps the last trail when a refresh fails', async () => {
    const apiClient = { getRunTrail: vi.fn(async () => fixture) };
    const out = mountHook(apiClient);
    await flush();
    act(() => out.current.setAutoRefresh(30));
    apiClient.getRunTrail.mockImplementationOnce(async () => {
      throw Object.assign(new Error('boom'), { status: 500 });
    });
    await act(async () => {
      await out.current.reload();
    });
    expect(out.current.autoRefresh).toBe(30);
    expect(out.current.trail.nodeCount).toBe(15);
    expect(out.current.error.status).toBe(500);
  });
});
