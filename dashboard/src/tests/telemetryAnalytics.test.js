// Unit tests for run telemetry formatting, analytics aggregation, export helpers, traffic shares, and column
// preference migration.

import { describe, it, expect, beforeAll } from 'vitest';
import i18n from '../i18n';
import { runTelemetry, formatMs, formatCount, formatRate, formatUsd, runPhases } from '../utils/telemetry';
import {
  parseAnalyticsParams,
  analyticsSearch,
  analyticsQuery,
  normalizeAnalytics,
  normalizeDimensions,
  chartSeries,
  successRate,
  niceTicks,
  chartMax,
  breakdownRows,
  splitHarnessModel,
  ANALYTICS_CHARTS,
  MAX_GROUP_SERIES
} from '../utils/analytics';
import { toCsv, seriesCsv, seriesJson, exportFileName, slug, tableCsv } from '../utils/exporters';
import { trafficShares } from '../utils/deployments';
import { resolveHidden } from '../hooks/useColumnPrefs';

beforeAll(async () => {
  await i18n.changeLanguage('en');
});

describe('run telemetry', () => {
  it('passes server values through and keeps reported nulls as null', () => {
    const tel = runTelemetry({ timeToFirstTokenMs: 1200, streamingMs: null, executionMs: 5000, queueMs: 20, totalMs: 5100, outputTokensPerSecond: null, outputTokens: 50, inputTokens: '10', toolCallCount: 3 });
    expect(tel.timeToFirstTokenMs).toBe(1200);
    expect(tel.streamingMs).toBeNull();
    expect(tel.outputTokensPerSecond).toBeNull();
    expect(tel.inputTokens).toBe(10);
    expect(tel.toolCallCount).toBe(3);
    expect(tel.reasoningTokens).toBeNull();
  });

  it('derives values only for fields an older server never sent', () => {
    const tel = runTelemetry({ queuedUtc: '2026-01-01T00:00:00Z', leasedUtc: '2026-01-01T00:00:02Z', startedUtc: '2026-01-01T00:00:03Z', completedUtc: '2026-01-01T00:00:13Z', streamingMs: 4000, outputTokens: 200 });
    expect(tel.queueMs).toBe(2000);
    expect(tel.executionMs).toBe(10000);
    expect(tel.totalMs).toBe(13000);
    expect(tel.outputTokensPerSecond).toBe(50);
    expect(runTelemetry({ streamingMs: 50, outputTokens: 10 }).outputTokensPerSecond).toBeNull();
    expect(runTelemetry({ startedUtc: '2026-01-01T00:00:03Z' }).executionMs).toBeNull();
  });

  it('formats with the locale and a translated placeholder for nulls', () => {
    expect(formatMs(null, 'en', 'n/a')).toBe('n/a');
    expect(formatMs(1500, 'de', 'k. A.')).toBe('1,5 s');
    expect(formatCount(1234567, 'de', 'n/a')).toBe('1.234.567');
    expect(formatCount(undefined, 'en', 'n/a')).toBe('n/a');
    expect(formatRate(42.345, 'en', 'n/a', 'tok/s')).toBe('42.3 tok/s');
    expect(formatUsd(0.0123, 'en', 'n/a')).toBe('$0.0123');
    expect(formatUsd(null, 'ja', '該当なし')).toBe('該当なし');
    expect(i18n.t('common.generic.notAvailable')).toBe('n/a');
  });

  it('splits run time into proportional phases', () => {
    const phases = runPhases({ queueMs: 1000, timeToFirstTokenMs: 1000, streamingMs: 2000, executionMs: 4000 });
    expect(phases.map((p) => p.key)).toEqual(['queue', 'startup', 'streaming', 'tail']);
    expect(phases.reduce((s, p) => s + p.share, 0)).toBeCloseTo(1);
    expect(runPhases({ queueMs: null, timeToFirstTokenMs: null, streamingMs: null, executionMs: null })).toEqual([]);
  });
});

describe('analytics helpers', () => {
  const response = {
    fromUtc: '2026-10-09T00:00:00Z',
    toUtc: '2026-10-09T03:00:00Z',
    interval: 'hour',
    bucketSeconds: 3600,
    truncated: true,
    totals: { runs: 7, succeeded: 5, failed: 1, cancelled: 1, timedOut: 0 },
    series: [
      { key: 'ClaudeCode|claude-sonnet-5-5', label: 'ClaudeCode / claude-sonnet-5-5', buckets: [{ startUtc: '2026-10-09T00:00:00Z', runs: 4, inputTokens: 10, outputTokens: 5, costUsd: 0.5, timeToFirstTokenMsAvg: 1000 }, { startUtc: '2026-10-09T01:00:00Z', runs: 1, timeToFirstTokenMsAvg: 4000 }] },
      { key: 'Mux|', label: 'Mux / unknown', buckets: [{ startUtc: '2026-10-09T01:00:00Z', runs: 2, timeToFirstTokenMsAvg: null }] }
    ]
  };

  it('parses and writes URL state with defaults omitted', () => {
    const state = parseAnalyticsParams(new URLSearchParams('range=week&agentId=a1&model=m1&groupBy=harnessModel&bogus=1'));
    expect(state).toMatchObject({ range: 'week', agentId: 'a1', model: 'm1', groupBy: 'harnessModel', harnessType: '' });
    expect(parseAnalyticsParams(new URLSearchParams('range=year&groupBy=planet'))).toMatchObject({ range: 'day', groupBy: 'none' });
    expect(analyticsSearch({ range: 'day', groupBy: 'none', agentId: '' }).toString()).toBe('');
    expect(analyticsSearch({ ...state }).toString()).toBe('range=week&agentId=a1&model=m1&groupBy=harnessModel');
  });

  it('builds queries for presets and validates custom ranges', () => {
    const now = new Date('2026-10-09T12:00:00Z');
    const { query } = analyticsQuery({ range: 'hour', groupBy: 'model', model: 'x', harnessType: 'Mux' }, now);
    expect(query).toEqual({ from: '2026-10-09T11:00:00.000Z', to: '2026-10-09T12:00:00.000Z', interval: 'auto', harnessType: 'Mux', model: 'x', groupBy: 'model' });
    expect(analyticsQuery({ range: 'custom', from: '', to: '' }).error).toBe('incomplete');
    expect(analyticsQuery({ range: 'custom', from: '2026-10-09T12:00:00Z', to: '2026-10-09T11:00:00Z' }).error).toBe('reversed');
    expect(analyticsQuery({ range: 'custom', from: '2026-10-09T10:00:00Z', to: '2026-10-09T11:00:00Z', groupBy: 'none' }).query.from).toBe('2026-10-09T10:00:00.000Z');
  });

  it('normalizes and aligns series onto one bucket grid', () => {
    const data = normalizeAnalytics(response);
    expect(data.times).toEqual(['2026-10-09T00:00:00.000Z', '2026-10-09T01:00:00.000Z']);
    expect(data.series[1].buckets[0].runs).toBe(0);
    expect(data.series[1].buckets[0].timeToFirstTokenMsAvg).toBeNull();
    expect(data.series[0].runs).toBe(5);
    expect(data.truncated).toBe(true);
    expect(data.totals.totalTokens).toBe(0);
    expect(normalizeAnalytics(null).series).toEqual([]);
  });

  it('builds metric series without grouping and group series with a cap', () => {
    const data = normalizeAnalytics(response);
    const ttft = ANALYTICS_CHARTS.find((c) => c.id === 'ttft');
    const single = chartSeries({ ...data, series: [data.series[0]] }, ttft, false);
    expect(single.series.map((s) => s.metric)).toEqual(['timeToFirstTokenMsAvg', 'timeToFirstTokenMsP50', 'timeToFirstTokenMsP95', 'timeToFirstTokenExcludingDelegationMsAvg']);
    const grouped = chartSeries(data, ttft, true);
    expect(grouped.series.map((s) => s.label)).toEqual(['ClaudeCode / claude-sonnet-5-5', 'Mux / unknown']);

    const many = { times: ['t'], series: Array.from({ length: 11 }, (_, i) => ({ key: `k${i}`, label: `g${i}`, runs: 11 - i, buckets: [{ runs: 11 - i, timeToFirstTokenMsAvg: 1 }] })) };
    const stacked = chartSeries(many, ANALYTICS_CHARTS.find((c) => c.id === 'outcomes'), true, 'Other');
    expect(stacked.series).toHaveLength(MAX_GROUP_SERIES);
    expect(stacked.series[MAX_GROUP_SERIES - 1]).toMatchObject({ key: '__other', label: 'Other' });
    expect(stacked.series[MAX_GROUP_SERIES - 1].values[0]).toBe(4 + 3 + 2 + 1);
    const lines = chartSeries(many, ttft, true);
    expect(lines.series).toHaveLength(MAX_GROUP_SERIES);
    expect(lines.hidden).toBe(3);
  });

  it('computes success rate, ticks, and chart maxima', () => {
    expect(successRate({ succeeded: 3, failed: 1, cancelled: 0, timedOut: 0 })).toBe(0.75);
    expect(successRate({ succeeded: 0, failed: 0 })).toBeNull();
    expect(niceTicks(87)).toEqual([0, 25, 50, 75, 100]);
    expect(niceTicks(0)).toEqual([0, 0.25, 0.5, 0.75, 1]);
    const series = [{ values: [1, 2] }, { values: [3, null] }];
    expect(chartMax(series, 'stacked')).toBe(4);
    expect(chartMax(series, 'line')).toBe(3);
    expect(chartMax([{ values: [9], hidden: true }, { values: [2] }], 'line')).toBe(2);
  });

  it('builds the harness by model breakdown with run-weighted TTFT', () => {
    const rows = breakdownRows(normalizeAnalytics(response));
    expect(rows[0]).toMatchObject({ harness: 'ClaudeCode', model: 'claude-sonnet-5-5', runs: 5, inputTokens: 10, costUsd: 0.5 });
    expect(rows[0].timeToFirstTokenMsAvg).toBe((4 * 1000 + 1 * 4000) / 5);
    expect(rows[1]).toMatchObject({ harness: 'Mux', model: 'unknown', timeToFirstTokenMsAvg: null });
    expect(splitHarnessModel('Codex|gpt|5')).toEqual({ harness: 'Codex', model: 'gpt|5' });
  });

  it('normalizes dimensions', () => {
    const dims = normalizeDimensions({ agents: [{ id: 'b', name: 'zeta' }, { id: 'a', name: 'alpha' }, null], harnesses: ['Mux', 'ClaudeCode'], models: ['m2', '', 'm1'] });
    expect(dims.agents.map((a) => a.name)).toEqual(['alpha', 'zeta']);
    expect(dims.harnesses).toEqual(['ClaudeCode', 'Mux']);
    expect(dims.models).toEqual(['m1', 'm2']);
    expect(dims.deployments).toEqual([]);
  });
});

describe('export helpers', () => {
  it('writes RFC 4180 CSV with locale-independent numbers', () => {
    expect(toCsv(['a', 'b'], [[1234.5, 'x, "y"'], [null, true]])).toBe('a,b\r\n1234.5,"x, ""y"""\r\n,true\r\n');
    const csv = seriesCsv(['2026-10-09T00:00:00Z'], [{ label: 'Avg', values: [0.5] }, { label: 'p95', values: [null] }]);
    expect(csv).toBe('bucket_start_utc,Avg,p95\r\n2026-10-09T00:00:00.000Z,0.5,\r\n');
  });

  it('names files after the chart, range, and filters', () => {
    expect(exportFileName('analytics-ttft', 'week', { agentId: 'agt_1', model: 'gpt-oss:20b', harnessType: '' }, 'csv')).toBe('garrison_analytics-ttft_week_agentid-agt_1_model-gpt-oss-20b.csv');
    expect(slug('Ünïcode / Name')).toBe('unicode-name');
  });

  it('exports JSON with buckets keyed by series', () => {
    const doc = JSON.parse(seriesJson({ chart: 'c', title: 'T', range: { fromUtc: 'f', toUtc: 't' }, filters: { a: 1 }, times: ['2026-10-09T00:00:00Z'], series: [{ key: 'k', label: 'K', values: [3] }] }));
    expect(doc.buckets[0]).toEqual({ startUtc: '2026-10-09T00:00:00.000Z', values: { k: 3 } });
    expect(doc.fromUtc).toBe('f');
  });

  it('exports table pages from raw values', () => {
    const csv = tableCsv([{ key: 'name', label: 'Name' }, { key: 'labels', label: 'Labels' }, { key: 'x', label: 'X', csv: (r) => r.n * 2 }, { key: 'actions', label: 'Actions' }], [{ name: 'a', labels: { z: 1 }, n: 2 }]);
    expect(csv).toBe('Name,Labels,X\r\na,"{""z"":1}",4\r\n');
  });
});

describe('deployments and column preferences', () => {
  it('splits traffic by weight across active deployments', () => {
    const shares = trafficShares([
      { id: 'a', weight: 300, active: true },
      { id: 'b', weight: 100, active: true },
      { id: 'c', weight: 500, active: false }
    ]);
    expect(shares).toEqual({ a: 0.75, b: 0.25, c: 0 });
    expect(trafficShares([{ id: 'a', weight: 0, active: true }])).toEqual({ a: 0 });
  });

  it('honors default-hidden columns that a saved preference has never seen', () => {
    const columns = [{ key: 'id', pinned: true }, { key: 'old' }, { key: 'oldHidden', defaultHidden: true }, { key: 'newHidden', defaultHidden: true }];
    expect(resolveHidden(undefined, columns)).toEqual(['oldHidden', 'newHidden']);
    expect(resolveHidden({ hidden: ['old'], known: ['id', 'old', 'oldHidden'] }, columns)).toEqual(['old', 'newHidden']);
    expect(resolveHidden(['old'], columns)).toEqual(['old', 'oldHidden', 'newHidden']);
  });
});
