// P13.12 to P13.15: observability cards and Grafana deep-link builders.

import { describe, it, expect } from 'vitest';
import { grafanaConfig, exploreUrl, traceUrl, logsUrl, runLogQuery, runTimeRange, dashboardUrl, nodeDashboardUrl, DEFAULT_DASHBOARDS, DEFAULT_DATASOURCES, RUN_RANGE_MARGIN_MS } from '../utils/grafana';
import { observabilityCards, reachabilityState } from '../utils/observability';

const INFO = {
  observability: {
    grafanaUrl: 'http://localhost:3000/',
    prometheusUrl: 'https://prom.example.com',
    lokiUrl: null,
    tempoUrl: 'http://127.0.0.1:3200',
    datasources: { prometheus: 'garrison-prometheus', loki: 'garrison-loki', tempo: 'garrison-tempo' },
    dashboards: { ...DEFAULT_DASHBOARDS }
  }
};
const RUN = { id: 'run_abc', traceId: '4bf92f3577b34da6a3ce929d0e0e4736', createdUtc: '2026-10-09T12:00:00.000Z', completedUtc: '2026-10-09T12:01:00.000Z' };
const T0 = Date.parse(RUN.createdUtc);
const T1 = Date.parse(RUN.completedUtc);

/** Decode the single Explore pane from a URL. */
function pane(url) {
  const u = new URL(url);
  expect(u.pathname).toBe('/explore');
  expect(u.searchParams.get('schemaVersion')).toBe('1');
  expect(u.searchParams.get('orgId')).toBe('1');
  const panes = JSON.parse(u.searchParams.get('panes'));
  expect(Object.keys(panes)).toEqual(['gx']);
  return panes.gx;
}

describe('grafanaConfig', () => {
  it('is null without a Grafana URL', () => {
    expect(grafanaConfig(null)).toBeNull();
    expect(grafanaConfig({})).toBeNull();
    expect(grafanaConfig({ observability: { grafanaUrl: null, datasources: null, dashboards: null } })).toBeNull();
    expect(grafanaConfig({ observability: { grafanaUrl: 'not a url' } })).toBeNull();
  });
  it('strips trailing slashes, never uses localhost, and keeps the server UIDs', () => {
    const c = grafanaConfig(INFO);
    expect(c.url).toBe('http://127.0.0.1:3000');
    expect(c.datasources).toEqual(DEFAULT_DATASOURCES);
    expect(c.dashboards.workers).toBe('garrison-workers');
  });
  it('falls back to the contract UIDs when server info omits them', () => {
    const c = grafanaConfig({ observability: { grafanaUrl: 'https://grafana.example.com' } });
    expect(c.datasources).toEqual(DEFAULT_DATASOURCES);
    expect(c.dashboards).toEqual(DEFAULT_DASHBOARDS);
    const custom = grafanaConfig({ observability: { grafanaUrl: 'https://g.example.com', datasources: { tempo: 'my-tempo' }, dashboards: { http: '' } } });
    expect(custom.datasources.tempo).toBe('my-tempo');
    expect(custom.datasources.loki).toBe('garrison-loki');
    expect(custom.dashboards.http).toBeNull();
    expect(dashboardUrl(custom, 'http')).toBeNull();
  });
});

describe('Explore links', () => {
  const c = grafanaConfig(INFO);
  it('pads the run time range by five minutes on each side, in epoch milliseconds', () => {
    expect(runTimeRange(RUN)).toEqual({ from: String(T0 - RUN_RANGE_MARGIN_MS), to: String(T1 + RUN_RANGE_MARGIN_MS) });
    const now = T0 + 120000;
    expect(runTimeRange({ createdUtc: RUN.createdUtc }, now)).toEqual({ from: String(T0 - RUN_RANGE_MARGIN_MS), to: String(now + RUN_RANGE_MARGIN_MS) });
  });
  it('links a trace to the Tempo datasource with a TraceQL trace ID query', () => {
    const url = traceUrl(c, RUN);
    expect(url.startsWith('http://127.0.0.1:3000/explore?schemaVersion=1&orgId=1&panes=')).toBe(true);
    const p = pane(url);
    expect(p.datasource).toBe('garrison-tempo');
    expect(p.queries).toEqual([{ refId: 'A', datasource: { type: 'tempo', uid: 'garrison-tempo' }, queryType: 'traceql', query: RUN.traceId }]);
    expect(p.range).toEqual(runTimeRange(RUN));
  });
  it('links logs to the Loki datasource with a line filter on the run ID', () => {
    const p = pane(logsUrl(c, RUN));
    expect(p.datasource).toBe('garrison-loki');
    expect(p.queries).toEqual([{ refId: 'A', datasource: { type: 'loki', uid: 'garrison-loki' }, expr: '{app="garrison"} |= "run_abc"', queryType: 'range' }]);
    expect(p.range).toEqual(runTimeRange(RUN));
  });
  it('escapes quotes in the LogQL filter', () => {
    expect(runLogQuery('a"b\\c')).toBe('{app="garrison"} |= "a\\"b\\\\c"');
  });
  it('returns null without Grafana, a datasource, or a trace ID', () => {
    expect(traceUrl(null, RUN)).toBeNull();
    expect(logsUrl(null, RUN)).toBeNull();
    expect(traceUrl(c, { ...RUN, traceId: null })).toBeNull();
    expect(traceUrl(c, { ...RUN, traceId: '' })).toBeNull();
    expect(logsUrl(c, { ...RUN, id: '' })).toBeNull();
    expect(traceUrl({ ...c, datasources: { ...c.datasources, tempo: null } }, RUN)).toBeNull();
    expect(exploreUrl(c, null, [], {})).toBeNull();
  });
});

describe('dashboard links', () => {
  const c = grafanaConfig(INFO);
  it('builds /d/<uid> links with orgId', () => {
    expect(dashboardUrl(c, 'overview')).toBe('http://127.0.0.1:3000/d/garrison-overview?orgId=1');
    expect(dashboardUrl(c, 'http')).toBe('http://127.0.0.1:3000/d/garrison-http?orgId=1');
  });
  it('passes a node variable for the workers dashboard', () => {
    expect(nodeDashboardUrl(c, 'garrison-worker-0')).toBe('http://127.0.0.1:3000/d/garrison-workers?orgId=1&var-node=garrison-worker-0');
    expect(nodeDashboardUrl(c, 'a b&c')).toBe('http://127.0.0.1:3000/d/garrison-workers?orgId=1&var-node=a+b%26c');
    expect(nodeDashboardUrl(c, '')).toBeNull();
  });
  it('passes the time range for the runs dashboard', () => {
    expect(dashboardUrl(c, 'runs', { from: RUN.createdUtc, to: RUN.completedUtc })).toBe(`http://127.0.0.1:3000/d/garrison-runs?orgId=1&from=${T0}&to=${T1}`);
    expect(dashboardUrl(c, 'runs', { from: 'garbage' })).toBe('http://127.0.0.1:3000/d/garrison-runs?orgId=1');
  });
  it('returns null without Grafana or for an unknown dashboard', () => {
    expect(dashboardUrl(null, 'overview')).toBeNull();
    expect(dashboardUrl(c, 'nope')).toBeNull();
  });
});

describe('observability cards', () => {
  const status = [
    { service: 'grafana', configured: true, reachable: true, version: '11.2.0', checkedUtc: '2026-10-09T12:00:00Z' },
    { service: 'prometheus', configured: true, reachable: false, version: null, checkedUtc: '2026-10-09T12:00:00Z' },
    { service: 'loki', configured: false, reachable: false, version: null, checkedUtc: '2026-10-09T12:00:00Z' },
    { service: 'tempo', configured: true, reachable: true, version: '2.6.0', checkedUtc: '2026-10-09T12:00:00Z' }
  ];
  it('shows one card per configured service in contract order, with state and version', () => {
    expect(observabilityCards(INFO, status)).toEqual([
      { id: 'grafana', url: 'http://127.0.0.1:3000/', state: 'reachable', version: '11.2.0' },
      { id: 'prometheus', url: 'https://prom.example.com', state: 'unreachable', version: null },
      { id: 'tempo', url: 'http://127.0.0.1:3200', state: 'reachable', version: '2.6.0' }
    ]);
  });
  it('reports checking while loading and unknown when the status call failed', () => {
    expect(reachabilityState(undefined, 'grafana')).toBe('checking');
    expect(reachabilityState(null, 'grafana')).toBe('unknown');
    expect(reachabilityState([], 'grafana')).toBe('unknown');
    expect(observabilityCards(INFO, null).map((c) => c.state)).toEqual(['unknown', 'unknown', 'unknown']);
  });
  it('shows nothing when no service is configured', () => {
    expect(observabilityCards({ observability: { grafanaUrl: null, prometheusUrl: null, lokiUrl: null, tempoUrl: null } }, status)).toEqual([]);
  });
});
