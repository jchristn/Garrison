// Grafana deep links (P13.15). Every URL is built from what GET /server-info reports in `observability`
// (grafanaUrl, datasource UIDs, dashboard UIDs), never from guessed defaults: without a Grafana URL there are no links.
// Formats target Grafana 10 and 11 (Explore with `schemaVersion=1` and `panes`, dashboards at /d/<uid>).

import { loopbackUrl } from './observability';

/** Datasource and dashboard UIDs from the observability contract, used when server info omits a field. */
export const DEFAULT_DATASOURCES = Object.freeze({ prometheus: 'garrison-prometheus', loki: 'garrison-loki', tempo: 'garrison-tempo' });
export const DEFAULT_DASHBOARDS = Object.freeze({
  overview: 'garrison-overview',
  http: 'garrison-http',
  runs: 'garrison-runs',
  workers: 'garrison-workers',
  protocols: 'garrison-protocols',
  integrations: 'garrison-integrations',
  agents: 'garrison-agents',
  models: 'garrison-models',
  kubernetes: 'garrison-kubernetes',
  scheduler: 'garrison-scheduler',
  database: 'garrison-database',
  controlPlane: 'garrison-control-plane',
  security: 'garrison-security',
  logs: 'garrison-logs'
});

/**
 * The Garrison folder's section dashboards in display order (P13.27). Each key is a field of
 * server-info `observability.dashboards` and of DEFAULT_DASHBOARDS.
 */
export const DASHBOARD_SECTIONS = Object.freeze([
  'overview',
  'http',
  'runs',
  'agents',
  'models',
  'workers',
  'kubernetes',
  'protocols',
  'scheduler',
  'database',
  'controlPlane',
  'security',
  'integrations',
  'logs'
]);

/** Margin added before and after a run's time range in Explore links, in milliseconds (5 minutes). */
export const RUN_RANGE_MARGIN_MS = 5 * 60 * 1000;

function validUrl(url) {
  return typeof url === 'string' && /^https?:\/\/\S+$/i.test(url.trim());
}

function uid(map, defaults, key) {
  const value = map && typeof map === 'object' && key in map ? map[key] : defaults[key];
  if (value === null || value === undefined) return defaults[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/**
 * Grafana link configuration from a server-info response, or null when Grafana is not configured.
 * @returns {{ url: string, datasources: object, dashboards: object } | null}
 */
export function grafanaConfig(info) {
  const obs = info && typeof info === 'object' && info.observability && typeof info.observability === 'object' ? info.observability : null;
  if (!obs || !validUrl(obs.grafanaUrl)) return null;
  const url = loopbackUrl(obs.grafanaUrl.trim()).replace(/\/+$/, '');
  const datasources = {};
  for (const k of Object.keys(DEFAULT_DATASOURCES)) datasources[k] = uid(obs.datasources, DEFAULT_DATASOURCES, k);
  const dashboards = {};
  for (const k of Object.keys(DEFAULT_DASHBOARDS)) dashboards[k] = uid(obs.dashboards, DEFAULT_DASHBOARDS, k);
  return { url, datasources, dashboards };
}

function epochMs(value) {
  if (value === null || value === undefined || value === '') return null;
  const ms = typeof value === 'number' ? value : Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

/**
 * Explore time range around a run: from its creation minus the margin to its completion (or now) plus the margin,
 * as epoch-millisecond strings.
 */
export function runTimeRange(run, now = Date.now()) {
  const start = epochMs(run?.createdUtc) ?? epochMs(run?.queuedUtc) ?? epochMs(run?.startedUtc) ?? now - 60 * 60 * 1000;
  const end = epochMs(run?.completedUtc) ?? now;
  return { from: String(start - RUN_RANGE_MARGIN_MS), to: String(Math.max(end, start) + RUN_RANGE_MARGIN_MS) };
}

/** Grafana Explore URL with one pane: `/explore?schemaVersion=1&orgId=1&panes=<json>`. */
export function exploreUrl(config, datasourceUid, queries, range) {
  if (!config?.url || !datasourceUid) return null;
  const panes = { gx: { datasource: datasourceUid, queries, range } };
  return `${config.url}/explore?schemaVersion=1&orgId=1&panes=${encodeURIComponent(JSON.stringify(panes))}`;
}

/** Explore link to a run's trace in Tempo, or null without Grafana, the Tempo datasource, or a trace ID. */
export function traceUrl(config, run, now = Date.now()) {
  const traceId = typeof run?.traceId === 'string' ? run.traceId.trim() : '';
  const ds = config?.datasources?.tempo;
  if (!traceId || !ds) return null;
  return exploreUrl(config, ds, [{ refId: 'A', datasource: { type: 'tempo', uid: ds }, queryType: 'traceql', query: traceId }], runTimeRange(run, now));
}

/** LogQL that finds every Garrison log line about a run. */
export function runLogQuery(runId) {
  return `{app="garrison"} |= "${String(runId).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/** Explore link to a run's logs in Loki, or null without Grafana, the Loki datasource, or a run ID. */
export function logsUrl(config, run, now = Date.now()) {
  const ds = config?.datasources?.loki;
  if (!run?.id || !ds) return null;
  return exploreUrl(config, ds, [{ refId: 'A', datasource: { type: 'loki', uid: ds }, expr: runLogQuery(run.id), queryType: 'range' }], runTimeRange(run, now));
}

/**
 * Dashboard link: `/d/<uid>?orgId=1` plus optional `from`, `to` (epoch ms or ISO strings) and `vars` (`var-<name>`).
 * @param {object} config grafanaConfig() result
 * @param {string} key dashboard key (see DASHBOARD_SECTIONS)
 */
export function dashboardUrl(config, key, { from, to, vars } = {}) {
  const dash = config?.dashboards?.[key];
  if (!config?.url || !dash) return null;
  const params = new URLSearchParams({ orgId: '1' });
  const f = epochMs(from);
  const tt = epochMs(to);
  if (f !== null) params.set('from', String(f));
  if (tt !== null) params.set('to', String(tt));
  for (const [name, value] of Object.entries(vars || {})) {
    if (value !== null && value !== undefined && value !== '') params.append(`var-${name}`, String(value));
  }
  return `${config.url}/d/${encodeURIComponent(dash)}?${params.toString()}`;
}

/** Workers dashboard filtered to one node. */
export function nodeDashboardUrl(config, nodeName) {
  if (!nodeName) return null;
  return dashboardUrl(config, 'workers', { vars: { node: nodeName } });
}

/** Garrison overview dashboard filtered to one control-plane replica (`var-node`, P10.19). */
export function controlNodeDashboardUrl(config, nodeName) {
  if (!nodeName) return null;
  return dashboardUrl(config, 'overview', { vars: { node: nodeName } });
}

/**
 * One link per section dashboard for the Home Observability section, in DASHBOARD_SECTIONS order. Empty when Grafana is
 * not configured or server info reports no dashboards (`observability.dashboards` null or missing); sections whose UID is
 * blank are skipped.
 * @returns {{ key: string, uid: string, url: string }[]}
 */
export function sectionDashboardLinks(info) {
  const config = grafanaConfig(info);
  const reported = info?.observability?.dashboards;
  if (!config || !reported || typeof reported !== 'object') return [];
  const links = [];
  for (const key of DASHBOARD_SECTIONS) {
    const url = dashboardUrl(config, key);
    if (url) links.push({ key, uid: config.dashboards[key], url });
  }
  return links;
}

/** Agents dashboard filtered to one agent (`var-agent`), and to its tenant (`var-tenant`) when known. */
export function agentDashboardUrl(config, agentName, tenantId) {
  if (!agentName) return null;
  return dashboardUrl(config, 'agents', { vars: { tenant: tenantId, agent: agentName } });
}
