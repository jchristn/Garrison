// P10.19: control nodes (control-plane replicas). Uptime and heartbeat helpers, status tones, the Grafana link,
// and the API client methods.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatElapsed, formatUptime } from '../i18n/formatters';
import { HEARTBEAT_STALE_MS, heartbeatAgeMs, isHeartbeatStale, leaderOf } from '../utils/controlNodes';
import { controlNodeStatusTone, ENUMS } from '../utils/constants';
import { grafanaConfig, controlNodeDashboardUrl } from '../utils/grafana';
import ApiClient from '../utils/api';
import { controlNodeList, controlNodes } from '../../tests/e2e/mocks.js';

const norm = (v) => String(v).replace(/[\s\u00a0\u202f]+/g, ' ');
const NOW = Date.parse('2026-10-10T12:00:00Z');
const ago = (ms) => new Date(NOW - ms).toISOString();

describe('uptime formatting', () => {
  it('shows the two largest non-zero units', () => {
    expect(norm(formatElapsed((3 * 86400 + 4 * 3600 + 5 * 60) * 1000, 'en'))).toBe('3 days, 4 hr');
    expect(norm(formatElapsed((2 * 3600 + 30) * 1000, 'en'))).toBe('2 hr');
    expect(norm(formatElapsed((12 * 60 + 5) * 1000, 'en'))).toBe('12 min, 5 sec');
    expect(norm(formatElapsed(42_000, 'en'))).toBe('42 sec');
  });
  it('reads zero, negative, and invalid input safely', () => {
    expect(norm(formatElapsed(400, 'en'))).toBe('0 sec');
    expect(norm(formatElapsed(-5000, 'en'))).toBe('0 sec');
    expect(formatElapsed(null, 'en')).toBe('-');
    expect(formatElapsed(Number.NaN, 'en')).toBe('-');
    expect(formatUptime(null, 'en', NOW)).toBe('-');
    expect(formatUptime('not a date', 'en', NOW)).toBe('-');
  });
  it('counts uptime from the start time', () => {
    expect(norm(formatUptime(ago((3 * 3600 + 25 * 60) * 1000), 'en', NOW))).toBe('3 hr, 25 min');
  });
  it('uses the locale\'s own unit words', () => {
    const ms = (26 * 3600 + 60) * 1000;
    expect(norm(formatElapsed(ms, 'de'))).toMatch(/^1 Tg\.?,? 2 Std\.?$/);
    expect(norm(formatElapsed(ms, 'fr'))).toMatch(/^1 j(,| et)? 2 h$/);
    expect(norm(formatElapsed(ms, 'ja'))).toMatch(/1 ?日.*2 ?時間/);
    expect(norm(formatElapsed(ms, 'zh-Hans'))).toMatch(/1 ?天.*2 ?小时/);
    for (const code of ['es', 'it', 'zh-Hant', 'yue-Hant']) expect(formatElapsed(ms, code)).toMatch(/1.*2/);
  });
});

describe('heartbeat age', () => {
  afterEach(() => vi.useRealTimers());

  it('measures the age and flags replicas silent for more than 15 seconds', () => {
    expect(HEARTBEAT_STALE_MS).toBe(15000);
    expect(heartbeatAgeMs(ago(2000), NOW)).toBe(2000);
    expect(heartbeatAgeMs(null, NOW)).toBeNull();
    expect(heartbeatAgeMs('garbage', NOW)).toBeNull();
    expect(isHeartbeatStale({ status: 'Ready', lastHeartbeatUtc: ago(2000) }, NOW)).toBe(false);
    expect(isHeartbeatStale({ status: 'Ready', lastHeartbeatUtc: ago(15000) }, NOW)).toBe(false);
    expect(isHeartbeatStale({ status: 'Ready', lastHeartbeatUtc: ago(15001) }, NOW)).toBe(true);
    expect(isHeartbeatStale({ status: 'Draining', lastHeartbeatUtc: ago(40000) }, NOW)).toBe(true);
  });
  it('never flags Offline replicas or rows without a heartbeat', () => {
    expect(isHeartbeatStale({ status: 'Offline', lastHeartbeatUtc: ago(3600000) }, NOW)).toBe(false);
    expect(isHeartbeatStale({ status: 'Ready' }, NOW)).toBe(false);
    expect(isHeartbeatStale(null, NOW)).toBe(false);
  });
  it('defaults to the current clock', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    expect(isHeartbeatStale({ status: 'Ready', lastHeartbeatUtc: ago(20000) })).toBe(true);
  });
  it('finds the leader in a list', () => {
    expect(leaderOf(controlNodes()).name).toBe('garrison-server-a');
    expect(leaderOf([])).toBeNull();
    expect(leaderOf(null)).toBeNull();
  });
});

describe('control node status', () => {
  it('has a tone for every status, and status is never shown by color alone', () => {
    expect(ENUMS.controlNodeStatus).toEqual(['Starting', 'Ready', 'Draining', 'Offline']);
    expect(ENUMS.controlNodeStatus.map(controlNodeStatusTone)).toEqual(['info', 'success', 'warning', 'danger']);
    expect(controlNodeStatusTone('Unknown')).toBe('neutral');
    expect(ENUMS.backplane).toEqual(['Local', 'Polling', 'PostgresNotify']);
  });
});

describe('control node Grafana link', () => {
  it('opens the overview dashboard filtered to the replica', () => {
    const c = grafanaConfig({ observability: { grafanaUrl: 'http://127.0.0.1:3000/' } });
    expect(controlNodeDashboardUrl(c, 'garrison-server-a')).toBe('http://127.0.0.1:3000/d/garrison-overview?orgId=1&var-node=garrison-server-a');
    expect(controlNodeDashboardUrl(c, '')).toBeNull();
    expect(controlNodeDashboardUrl(null, 'garrison-server-a')).toBeNull();
    expect(controlNodeDashboardUrl(grafanaConfig({ observability: { grafanaUrl: 'http://127.0.0.1:3000', dashboards: { overview: 'custom' } } }), 'x')).toBe('http://127.0.0.1:3000/d/custom?orgId=1&var-node=x');
  });
});

describe('control node API methods', () => {
  afterEach(() => vi.unstubAllGlobals());

  function stubFetch(body) {
    const calls = [];
    vi.stubGlobal('fetch', async (url) => {
      calls.push(String(url));
      return { ok: true, status: 200, text: async () => JSON.stringify(body) };
    });
    return calls;
  }

  it('lists control nodes with paging and keeps respondingNodeId', async () => {
    const calls = stubFetch(controlNodeList());
    const page = await new ApiClient('http://127.0.0.1:8700').listControlNodes({ pageNumber: 1, pageSize: 25, search: 'server' });
    expect(calls[0]).toBe('http://127.0.0.1:8700/v1.0/api/control-nodes?search=server&maxResults=25&skip=0');
    expect(page.items.map((n) => n.name)).toEqual(['garrison-server-a', 'garrison-server-b']);
    expect(page.totalCount).toBe(2);
    expect(page.respondingNodeId).toBe('garrison-server-a');
  });
  it('answers null for respondingNodeId when the server omits it', async () => {
    stubFetch({ objects: [], totalRecords: 0 });
    expect((await new ApiClient('http://127.0.0.1:8700').listControlNodes()).respondingNodeId).toBeNull();
  });
  it('reads one control node by ID', async () => {
    const calls = stubFetch({ ...controlNodes()[1], respondingNodeId: 'garrison-server-a' });
    const node = await new ApiClient('http://127.0.0.1:8700').getControlNode('garrison-server-b');
    expect(calls[0]).toBe('http://127.0.0.1:8700/v1.0/api/control-nodes/garrison-server-b');
    expect(node.respondingNodeId).toBe('garrison-server-a');
  });
});
