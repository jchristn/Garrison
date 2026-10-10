// Run analytics helpers for GET /v1.0/api/tenants/{tenantId}/analytics/runs (plan section 10.6).
// Pure functions so they can be unit tested without a browser.

/** Range presets. `windowMs` is how far back from now the range starts; the server picks the bucket size. */
export const ANALYTICS_RANGES = {
  hour: { id: 'hour', windowMs: 60 * 60 * 1000 },
  day: { id: 'day', windowMs: 24 * 60 * 60 * 1000 },
  week: { id: 'week', windowMs: 7 * 24 * 60 * 60 * 1000 },
  month: { id: 'month', windowMs: 30 * 24 * 60 * 60 * 1000 }
};

export const RANGE_IDS = ['hour', 'day', 'week', 'month', 'custom'];
export const GROUP_BY = ['none', 'agent', 'harness', 'model', 'harnessModel'];

/** Filters the endpoint accepts, all combinable. `model` matches the run's served model. */
export const FILTER_KEYS = ['agentId', 'harnessType', 'deploymentId', 'model'];

/** Every metric in a bucket and in `totals`. Counts are integers; the *Ms and *Avg values may be null. */
export const METRIC_KEYS = [
  'runs',
  'succeeded',
  'failed',
  'cancelled',
  'timedOut',
  'inputTokens',
  'outputTokens',
  'cachedTokens',
  'reasoningTokens',
  'costUsd',
  'toolCalls',
  'timeToFirstTokenMsAvg',
  'timeToFirstTokenMsP50',
  'timeToFirstTokenMsP95',
  'streamingMsAvg',
  'executionMsAvg',
  'executionMsP95',
  'queueMsAvg',
  'outputTokensPerSecondAvg'
];

const COUNT_KEYS = new Set(['runs', 'succeeded', 'failed', 'cancelled', 'timedOut', 'inputTokens', 'outputTokens', 'cachedTokens', 'reasoningTokens', 'costUsd', 'toolCalls']);

/**
 * Chart definitions. `kind` is 'stacked' (bars that add up, so a group-by stacks one segment per group) or
 * 'line' (averages and percentiles, so a group-by draws one line per group). `metrics` are drawn when there is
 * no group-by; `grouped` is the single value drawn per group. `format` names the value formatter.
 */
export const ANALYTICS_CHARTS = [
  { id: 'outcomes', kind: 'stacked', format: 'count', metrics: ['succeeded', 'failed', 'cancelled', 'timedOut'], grouped: 'runs' },
  { id: 'ttft', kind: 'line', format: 'ms', metrics: ['timeToFirstTokenMsAvg', 'timeToFirstTokenMsP50', 'timeToFirstTokenMsP95'], grouped: 'timeToFirstTokenMsAvg' },
  { id: 'duration', kind: 'line', format: 'ms', metrics: ['streamingMsAvg', 'executionMsAvg', 'executionMsP95'], grouped: 'executionMsAvg' },
  { id: 'queue', kind: 'line', format: 'ms', metrics: ['queueMsAvg'], grouped: 'queueMsAvg' },
  { id: 'tokens', kind: 'stacked', format: 'count', metrics: ['inputTokens', 'outputTokens', 'cachedTokens', 'reasoningTokens'], grouped: 'totalTokens' },
  { id: 'throughput', kind: 'line', format: 'rate', metrics: ['outputTokensPerSecondAvg'], grouped: 'outputTokensPerSecondAvg' },
  { id: 'cost', kind: 'stacked', format: 'usd', metrics: ['costUsd'], grouped: 'costUsd' },
  { id: 'toolCalls', kind: 'stacked', format: 'count', metrics: ['toolCalls'], grouped: 'toolCalls' }
];

/** Fixed colors for the ungrouped metric series. Outcomes use status colors; everything else uses categorical slots. */
export const METRIC_COLORS = {
  succeeded: 'var(--color-success)',
  failed: 'var(--color-danger)',
  cancelled: 'var(--color-warning)',
  timedOut: 'var(--series-7)',
  timeToFirstTokenMsAvg: 'var(--series-1)',
  timeToFirstTokenMsP50: 'var(--series-3)',
  timeToFirstTokenMsP95: 'var(--series-2)',
  streamingMsAvg: 'var(--series-3)',
  executionMsAvg: 'var(--series-1)',
  executionMsP95: 'var(--series-2)',
  queueMsAvg: 'var(--series-4)',
  inputTokens: 'var(--series-1)',
  outputTokens: 'var(--series-2)',
  cachedTokens: 'var(--series-3)',
  reasoningTokens: 'var(--series-7)',
  outputTokensPerSecondAvg: 'var(--series-1)',
  costUsd: 'var(--series-1)',
  toolCalls: 'var(--series-1)'
};

export const MAX_GROUP_SERIES = 8;

function finite(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Normalize one metrics object: counts default to 0, averages and percentiles stay null when missing. */
export function normalizeMetrics(raw) {
  const out = {};
  for (const key of METRIC_KEYS) {
    const v = finite(raw?.[key]);
    out[key] = COUNT_KEYS.has(key) ? v ?? 0 : v;
  }
  out.totalTokens = out.inputTokens + out.outputTokens;
  return out;
}

/** Read analytics state from URL search parameters, with defaults and validation. */
export function parseAnalyticsParams(searchParams) {
  const get = (k) => (searchParams.get(k) || '').trim();
  const range = RANGE_IDS.includes(get('range')) ? get('range') : 'day';
  const groupBy = GROUP_BY.includes(get('groupBy')) ? get('groupBy') : 'none';
  return { range, from: get('from'), to: get('to'), agentId: get('agentId'), harnessType: get('harnessType'), deploymentId: get('deploymentId'), model: get('model'), groupBy };
}

/** URL search parameters for analytics state. Defaults are omitted so URLs stay short. */
export function analyticsSearch(state) {
  const params = new URLSearchParams();
  if (state.range && state.range !== 'day') params.set('range', state.range);
  if (state.range === 'custom') {
    if (state.from) params.set('from', state.from);
    if (state.to) params.set('to', state.to);
  }
  for (const k of FILTER_KEYS) if (state[k]) params.set(k, state[k]);
  if (state.groupBy && state.groupBy !== 'none') params.set('groupBy', state.groupBy);
  return params;
}

/**
 * Query for the analytics endpoint, or { error } when a custom range is incomplete or reversed.
 * Presets end at `now`; custom ranges use the ISO timestamps from the URL. The interval is always `auto`.
 */
export function analyticsQuery(state, now = new Date()) {
  let from;
  let to;
  if (state.range === 'custom') {
    const f = new Date(state.from);
    const t = new Date(state.to);
    if (!state.from || !state.to || Number.isNaN(f.getTime()) || Number.isNaN(t.getTime())) return { error: 'incomplete' };
    if (f.getTime() >= t.getTime()) return { error: 'reversed' };
    from = f.toISOString();
    to = t.toISOString();
  } else {
    const range = ANALYTICS_RANGES[state.range] || ANALYTICS_RANGES.day;
    from = new Date(now.getTime() - range.windowMs).toISOString();
    to = now.toISOString();
  }
  const query = { from, to, interval: 'auto' };
  if (state.agentId) query.agentId = state.agentId;
  if (state.harnessType) query.harnessType = state.harnessType;
  if (state.deploymentId) query.deploymentId = state.deploymentId;
  if (state.model) query.model = state.model;
  if (state.groupBy && state.groupBy !== 'none') query.groupBy = state.groupBy;
  return { query };
}

/**
 * Normalize a response: totals and every bucket get the full metrics shape, series are aligned onto one
 * sorted list of bucket start times (the server gap-fills, but a missing bucket here becomes an empty one),
 * and each series gets its run total for ordering.
 */
export function normalizeAnalytics(response) {
  const seriesIn = Array.isArray(response?.series) ? response.series : [];
  const starts = new Set();
  for (const s of seriesIn) for (const b of s?.buckets || []) if (b?.startUtc) starts.add(new Date(b.startUtc).toISOString());
  const times = [...starts].sort();
  const empty = normalizeMetrics({});
  const series = seriesIn.map((s, i) => {
    const byStart = new Map((s.buckets || []).filter((b) => b?.startUtc).map((b) => [new Date(b.startUtc).toISOString(), normalizeMetrics(b)]));
    const buckets = times.map((t) => byStart.get(t) || { ...empty });
    return { key: String(s.key ?? `series-${i}`), label: s.label || String(s.key ?? ''), buckets, runs: buckets.reduce((sum, b) => sum + b.runs, 0) };
  });
  return {
    fromUtc: response?.fromUtc || null,
    toUtc: response?.toUtc || null,
    interval: response?.interval || null,
    bucketSeconds: finite(response?.bucketSeconds),
    truncated: !!response?.truncated,
    totals: normalizeMetrics(response?.totals || {}),
    times,
    series
  };
}

/**
 * Series to draw for one chart. Without a group-by: one series per metric of the first (only) server series.
 * With a group-by: one series per group for the chart's grouped value, busiest groups first. Stacked charts fold
 * groups past the cap into an "Other" series (sums stay correct); line charts drop them (averages cannot be summed)
 * and report how many were hidden.
 */
export function chartSeries(data, chart, grouped, otherLabel = 'Other') {
  if (!data || data.series.length === 0) return { series: [], hidden: 0 };
  if (!grouped) {
    const source = data.series[0];
    return {
      series: chart.metrics.map((metric) => ({ key: metric, metric, color: METRIC_COLORS[metric] || 'var(--series-1)', values: source.buckets.map((b) => b[metric]) })),
      hidden: 0
    };
  }
  const ordered = [...data.series].sort((a, b) => b.runs - a.runs || a.label.localeCompare(b.label));
  const fold = chart.kind === 'stacked' && ordered.length > MAX_GROUP_SERIES;
  const keep = fold ? ordered.slice(0, MAX_GROUP_SERIES - 1) : ordered.slice(0, MAX_GROUP_SERIES);
  const rest = ordered.slice(keep.length);
  const series = keep.map((s, i) => ({ key: s.key, label: s.label, color: `var(--series-${i + 1})`, values: s.buckets.map((b) => b[chart.grouped]) }));
  if (fold && rest.length) {
    series.push({
      key: '__other',
      label: otherLabel,
      color: 'var(--color-secondary)',
      values: data.times.map((_, i) => rest.reduce((sum, s) => sum + (s.buckets[i][chart.grouped] ?? 0), 0))
    });
  }
  return { series, hidden: fold ? 0 : rest.length };
}

/** Share of runs that succeeded, 0..1, or null when there were no finished runs. */
export function successRate(totals) {
  const finished = (totals?.succeeded || 0) + (totals?.failed || 0) + (totals?.cancelled || 0) + (totals?.timedOut || 0);
  return finished > 0 ? totals.succeeded / finished : null;
}

/** A "nice" axis maximum and evenly spaced ticks (five values from 0) for a data maximum. */
export function niceTicks(max, count = 4) {
  if (!Number.isFinite(max) || max <= 0) return [0, 1, 2, 3, 4].map((v) => v / 4);
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  return Array.from({ length: count + 1 }, (_, i) => Number((i * step).toPrecision(12)));
}

/** Largest value to fit on a chart: stacked sums per bucket, or the largest single value for lines. */
export function chartMax(series, kind) {
  let max = 0;
  const len = series[0]?.values.length || 0;
  for (let i = 0; i < len; i++) {
    if (kind === 'stacked') {
      max = Math.max(max, series.reduce((sum, s) => sum + (s.hidden ? 0 : s.values[i] || 0), 0));
    } else {
      for (const s of series) if (!s.hidden && s.values[i] !== null && s.values[i] !== undefined) max = Math.max(max, s.values[i]);
    }
  }
  return max;
}

/**
 * Normalize GET /analytics/runs/dimensions: { agents: [{id, name}], harnesses: [type], deployments: [{id, name,
 * agentId}], models: [name] }. Missing lists become empty; entries are sorted by display name.
 */
export function normalizeDimensions(raw) {
  const byName = (a, b) => String(a.name || a).localeCompare(String(b.name || b));
  return {
    agents: (Array.isArray(raw?.agents) ? raw.agents : []).filter((a) => a && a.id).map((a) => ({ id: a.id, name: a.name || a.id })).sort(byName),
    harnesses: (Array.isArray(raw?.harnesses) ? raw.harnesses : []).filter(Boolean).sort(),
    deployments: (Array.isArray(raw?.deployments) ? raw.deployments : []).filter((d) => d && d.id).map((d) => ({ id: d.id, name: d.name || d.id, agentId: d.agentId || '' })).sort(byName),
    models: (Array.isArray(raw?.models) ? raw.models : []).filter(Boolean).sort()
  };
}

/** Split a harnessModel series key (`harness|model`) into its parts; a missing model is `unknown`. */
export function splitHarnessModel(key) {
  const [harness, ...rest] = String(key || '').split('|');
  return { harness: harness || 'unknown', model: rest.join('|') || 'unknown' };
}

/**
 * Breakdown rows from a normalized response grouped by harness and model: one row per series with run and
 * token sums, cost, and average time to first token weighted by each bucket's run count (buckets without a
 * measured value are skipped). Sorted by runs, busiest first.
 */
export function breakdownRows(data) {
  if (!data) return [];
  return data.series
    .map((s) => {
      const sum = (k) => s.buckets.reduce((acc, b) => acc + (b[k] || 0), 0);
      let weight = 0;
      let total = 0;
      for (const b of s.buckets) {
        if (b.timeToFirstTokenMsAvg !== null && b.runs > 0) {
          weight += b.runs;
          total += b.timeToFirstTokenMsAvg * b.runs;
        }
      }
      const { harness, model } = splitHarnessModel(s.key);
      return {
        key: s.key,
        label: s.label,
        harness,
        model,
        runs: sum('runs'),
        inputTokens: sum('inputTokens'),
        outputTokens: sum('outputTokens'),
        cachedTokens: sum('cachedTokens'),
        reasoningTokens: sum('reasoningTokens'),
        costUsd: Number(sum('costUsd').toFixed(6)),
        timeToFirstTokenMsAvg: weight > 0 ? total / weight : null
      };
    })
    .sort((a, b) => b.runs - a.runs || a.label.localeCompare(b.label));
}

/** Usage charts shown per harness and model: stacked tokens and stacked cost. */
export const USAGE_CHARTS = [
  { id: 'usageTokens', kind: 'stacked', format: 'count', metrics: ['totalTokens'], grouped: 'totalTokens' },
  { id: 'usageCost', kind: 'stacked', format: 'usd', metrics: ['costUsd'], grouped: 'costUsd' }
];
