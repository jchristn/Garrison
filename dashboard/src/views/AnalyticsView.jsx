import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import KpiCard from '../components/KpiCard';
import Explainer from '../components/Explainer';
import RangeTabs from '../components/RangeTabs';
import AutoRefreshSelect from '../components/AutoRefreshSelect';
import TimeSeriesChart from '../components/TimeSeriesChart';
import ExportMenu from '../components/ExportMenu';
import { LoadingState, ErrorBanner, EmptyState } from '../components/States';
import { tip } from '../components/Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import useAutoRefresh from '../hooks/useAutoRefresh';
import { ENUMS } from '../utils/constants';
import { errorMessage, isMissingEndpoint } from '../utils/errors';
import { toLocalInput, toUtcIso } from '../utils/query';
import {
  chartsForTtftMode,
  seriesDisplayLabel,
  USAGE_CHARTS,
  GROUP_BY,
  FILTER_KEYS,
  parseAnalyticsParams,
  analyticsSearch,
  analyticsQuery,
  normalizeAnalytics,
  normalizeDimensions,
  chartSeries,
  successRate,
  breakdownRows
} from '../utils/analytics';
import { exportFileName, toCsv } from '../utils/exporters';
import { formatNumber, formatPercent, formatCurrency, formatDuration, formatDateTime } from '../i18n/formatters';
import { enumLabel } from '../utils/enums';

const PRESETS = [{ id: 'hour' }, { id: 'day' }, { id: 'week' }, { id: 'month' }, { id: 'custom' }];

/**
 * Run analytics over time from GET /analytics/runs: totals cards, one full-width chart per metric family, and
 * usage by harness and model (stacked token and cost charts plus a breakdown table). Every filter (range, custom
 * from and to, agent, harness, deployment, model, group by) lives in the URL. Filter options come from
 * GET /analytics/runs/dimensions for the selected range, falling back to the agent and deployment lists.
 */
export default function AnalyticsView() {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const state = useMemo(() => parseAnalyticsParams(searchParams), [searchParams]);
  const [dims, setDims] = useState(() => normalizeDimensions({}));
  const [data, setData] = useState(null);
  const [usage, setUsage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const lng = i18n.language;
  const na = t('common.generic.notAvailable');

  const update = useCallback(
    (patch) => {
      const next = { ...state, ...patch };
      if (patch.agentId !== undefined && patch.agentId !== state.agentId) next.deploymentId = '';
      if (patch.range === 'custom' && state.range !== 'custom') {
        const q = analyticsQuery(state);
        next.from = q.query?.from || '';
        next.to = q.query?.to || '';
      }
      setSearchParams(analyticsSearch(next), { replace: true });
    },
    [state, setSearchParams]
  );

  const built = useMemo(() => analyticsQuery(state), [state]);

  const loadDimensions = useCallback(async () => {
    if (!apiClient || built.error) return;
    try {
      setDims(normalizeDimensions(await apiClient.getRunAnalyticsDimensions(tenantId, { from: built.query.from, to: built.query.to })));
    } catch {
      // Older servers: fall back to every agent and deployment, every harness type, and no model list.
      const [agents, deployments] = await Promise.all([
        apiClient.listAgents(tenantId, { pageNumber: 1, pageSize: 1000 }).then((r) => r.items || []).catch(() => []),
        apiClient.listDeployments(tenantId, { pageNumber: 1, pageSize: 1000 }).then((r) => r.items || []).catch(() => [])
      ]);
      setDims(normalizeDimensions({ agents: agents.map((a) => ({ id: a.id, name: a.displayName || a.name })), deployments, harnesses: ENUMS.harnessType, models: [] }));
    }
  }, [apiClient, tenantId, built]);

  useEffect(() => {
    loadDimensions();
  }, [loadDimensions]);

  const load = useCallback(() => {
    if (!apiClient || built.error) return;
    const { query } = analyticsQuery(state);
    setLoading(true);
    setError(null);
    const main = apiClient.getRunAnalytics(tenantId, query);
    const byHarnessModel = state.groupBy === 'harnessModel' ? main : apiClient.getRunAnalytics(tenantId, { ...query, groupBy: 'harnessModel' });
    Promise.all([main, byHarnessModel.catch(() => null)])
      .then(([r, u]) => {
        setData(normalizeAnalytics(r));
        setUsage(u ? normalizeAnalytics(u) : null);
      })
      .catch((e) => {
        setError(e);
        setData(null);
        setUsage(null);
      })
      .finally(() => setLoading(false));
  }, [apiClient, tenantId, state, built]);

  useEffect(load, [load]);
  useAutoRefresh(load, refresh);

  const grouped = state.groupBy !== 'none';
  const totals = data?.totals;
  const rate = successRate(totals);
  const missing = isMissingEndpoint(error);
  const deploymentOptions = state.agentId ? dims.deployments.filter((d) => !d.agentId || d.agentId === state.agentId) : dims.deployments;
  const breakdown = useMemo(() => breakdownRows(usage), [usage]);

  // Keep a selected value in its dropdown even when the range no longer contains it.
  const withSelected = (list, value, make) => (value && !list.some((x) => (x.id ?? x) === value) ? [...list, make(value)] : list);
  const agentOptions = withSelected(dims.agents, state.agentId, (id) => ({ id, name: id }));
  const harnessOptions = withSelected(dims.harnesses.length ? dims.harnesses : ENUMS.harnessType, state.harnessType, (h) => h);
  // A deployment the dimensions report without a name was deleted; say so instead of showing a bare ID (M1-20).
  const deploymentList = withSelected(deploymentOptions, state.deploymentId, (id) => ({ id, name: id })).map((d) => (d.name === d.id ? { ...d, name: t('views.analytics.deletedDeployment', { id: d.id }) } : d));
  const agentList = agentOptions.map((a) => (a.name === a.id ? { ...a, name: t('views.analytics.deletedAgent', { id: a.id }) } : a));
  const harnessName = (h) => enumLabel(t, 'harnessType', h);
  const unknownModel = t('views.analytics.unknownModel');
  const labelSeries = (list, groupBy) => list.map((s) => ({ ...s, label: seriesDisplayLabel(s, groupBy, harnessName, unknownModel) }));
  const excluding = state.ttft === 'excluding';
  const charts = chartsForTtftMode(state.ttft);
  const modelOptions = withSelected(dims.models, state.model, (m) => m);

  const formatters = {
    count: (v) => formatNumber(v, { maximumFractionDigits: 0 }, lng),
    ms: (v) => formatDuration(v, lng),
    rate: (v) => `${formatNumber(v, { maximumFractionDigits: 1 }, lng)} ${t('common.units.tokPerSec')}`,
    usd: (v) => formatCurrency(v, lng)
  };
  const units = { count: 'count', ms: 'milliseconds', rate: 'tokens per second', usd: 'USD' };
  const msOrNa = (v) => (v === null || v === undefined ? na : formatDuration(v, lng));

  // Export context: file names carry the range and filters; PNG and SVG headers carry readable lines.
  const filterValues = Object.fromEntries(FILTER_KEYS.map((k) => [k, state[k]]).concat([['groupBy', grouped ? state.groupBy : '']]));
  const rangeLabel = state.range === 'custom' ? `${state.from || ''}_${state.to || ''}` : state.range;
  // Export headers name agents and deployments rather than showing IDs (M1-20); file names keep the IDs.
  const exportValue = (k, v) => {
    if (k === 'harnessType') return enumLabel(t, 'harnessType', v);
    if (k === 'groupBy') return t(`views.analytics.groupBy.${v}`);
    if (k === 'agentId') return agentList.find((a) => a.id === v)?.name || v;
    if (k === 'deploymentId') return deploymentList.find((d) => d.id === v)?.name || v;
    return v;
  };
  const exportLines = [
    data ? t('views.analytics.export.window', { from: formatDateTime(data.fromUtc, lng), to: formatDateTime(data.toUtc, lng) }) : '',
    ...Object.entries(filterValues)
      .filter(([, v]) => v)
      .map(([k, v]) => `${t(`views.analytics.filters.${k}`)}: ${exportValue(k, v)}`)
  ].filter(Boolean);
  const exportInfo = (id, format, scope = filterValues) => ({ name: `analytics-${id}`, range: rangeLabel, filters: scope, lines: exportLines, unit: units[format], window: { fromUtc: data?.fromUtc, toUtc: data?.toUtc } });

  const field = (key, control) => (
    <div className="field">
      <label htmlFor={`analytics-${key}`} {...tip(t(`tips.analytics.filters.${key}`))}>
        {t(`views.analytics.filters.${key}`)}
      </label>
      {control}
    </div>
  );

  const cards = totals
    ? [
        { key: 'runs', value: formatNumber(totals.runs, {}, lng), note: t('views.analytics.cards.runsNote', { succeeded: formatNumber(totals.succeeded, {}, lng), failed: formatNumber(totals.failed, {}, lng) }) },
        { key: 'successRate', value: rate === null ? na : formatPercent(rate, lng), tone: rate !== null && rate < 0.9 ? 'warning' : 'success' },
        { key: 'ttft', value: msOrNa(totals.timeToFirstTokenMsAvg), note: t('views.analytics.cards.p95', { value: msOrNa(totals.timeToFirstTokenMsP95) }) },
        { key: 'ttftExcludingDelegation', value: msOrNa(totals.timeToFirstTokenExcludingDelegationMsAvg), note: t('views.analytics.cards.p95', { value: msOrNa(totals.timeToFirstTokenExcludingDelegationMsP95) }) },
        { key: 'delegationWait', value: msOrNa(totals.delegationWaitMsAvg) },
        { key: 'execution', value: msOrNa(totals.executionMsAvg), note: t('views.analytics.cards.p95', { value: msOrNa(totals.executionMsP95) }) },
        { key: 'queue', value: msOrNa(totals.queueMsAvg) },
        {
          key: 'tokens',
          value: formatNumber(totals.inputTokens + totals.outputTokens, { notation: 'compact' }, lng),
          note: t('views.analytics.cards.tokensNote', { input: formatNumber(totals.inputTokens, { notation: 'compact' }, lng), output: formatNumber(totals.outputTokens, { notation: 'compact' }, lng) })
        },
        { key: 'throughput', value: totals.outputTokensPerSecondAvg === null ? na : formatters.rate(totals.outputTokensPerSecondAvg) },
        { key: 'cost', value: formatCurrency(totals.costUsd, lng) },
        { key: 'toolCalls', value: formatNumber(totals.toolCalls, {}, lng) }
      ]
    : [];

  const seriesTip = (chart, groupBy) => (s) =>
    s.metric ? t(`tips.analytics.metrics.${s.metric}`) : s.key === '__other' ? t('tips.analytics.otherSeries') : t(`tips.analytics.groupSeries.${groupBy}`, { name: s.label, metric: t(`views.analytics.metrics.${chart.grouped}`) });

  const breakdownColumns = ['harness', 'model', 'runs', 'inputTokens', 'outputTokens', 'cachedTokens', 'reasoningTokens', 'costUsd', 'timeToFirstTokenMsAvg'];
  const breakdownCsv = () =>
    toCsv(
      ['harness', 'model', 'runs', 'input_tokens', 'output_tokens', 'cached_tokens', 'reasoning_tokens', 'cost_usd', 'avg_time_to_first_token_ms'],
      breakdown.map((r) => [r.harness, r.model, r.runs, r.inputTokens, r.outputTokens, r.cachedTokens, r.reasoningTokens, r.costUsd, r.timeToFirstTokenMsAvg === null ? null : Math.round(r.timeToFirstTokenMsAvg)])
    );
  const cell = (key, r) => {
    if (key === 'harness') return t(`enums.harnessType.${r.harness}`, { defaultValue: r.harness });
    if (key === 'model') return r.model === 'unknown' ? t('views.analytics.unknownModel') : r.model;
    if (key === 'costUsd') return formatCurrency(r.costUsd, lng);
    if (key === 'timeToFirstTokenMsAvg') return msOrNa(r.timeToFirstTokenMsAvg);
    return formatNumber(r[key], {}, lng);
  };

  return (
    <div>
      <PageHeader title={t('views.analytics.title')} subtitle={t('views.analytics.subtitle')} actions={<AutoRefreshSelect value={refresh} onChange={setRefresh} />} />
      <Explainer topic="analytics" />

      <div className="panel analytics-filters" data-testid="analytics-filters">
        <div className="field analytics-range-field">
          <span className="explorer-op-picker-label" {...tip(t('tips.analytics.filters.range'))}>{t('views.analytics.filters.range')}</span>
          <RangeTabs ranges={PRESETS} value={state.range} onChange={(range) => update({ range })} onRefresh={load} loading={loading} label={t('views.analytics.filters.range')} />
        </div>
        {state.range === 'custom' && (
          <>
            {field('from', <input id="analytics-from" type="datetime-local" value={toLocalInput(state.from)} onChange={(e) => update({ from: toUtcIso(e.target.value) || '' })} {...tip(t('tips.analytics.filters.from'))} />)}
            {field('to', <input id="analytics-to" type="datetime-local" value={toLocalInput(state.to)} onChange={(e) => update({ to: toUtcIso(e.target.value) || '' })} {...tip(t('tips.analytics.filters.to'))} />)}
          </>
        )}
        {field(
          'agentId',
          <select id="analytics-agentId" value={state.agentId} onChange={(e) => update({ agentId: e.target.value })} {...tip(t('tips.analytics.filters.agentId'))}>
            <option value="">{t('views.analytics.allAgents')}</option>
            {agentList.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        )}
        {field(
          'harnessType',
          <select id="analytics-harnessType" value={state.harnessType} onChange={(e) => update({ harnessType: e.target.value })} {...tip(t('tips.analytics.filters.harnessType'))}>
            <option value="">{t('views.analytics.allHarnesses')}</option>
            {harnessOptions.map((h) => (
              <option key={h} value={h}>
                {t(`enums.harnessType.${h}`, { defaultValue: h })}
              </option>
            ))}
          </select>
        )}
        {field(
          'deploymentId',
          <select id="analytics-deploymentId" value={state.deploymentId} onChange={(e) => update({ deploymentId: e.target.value })} {...tip(t('tips.analytics.filters.deploymentId'))}>
            <option value="">{t('views.analytics.allDeployments')}</option>
            {deploymentList.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        )}
        {field(
          'model',
          <select id="analytics-model" value={state.model} onChange={(e) => update({ model: e.target.value })} {...tip(t('tips.analytics.filters.model'))}>
            <option value="">{t('views.analytics.allModels')}</option>
            {modelOptions.map((m) => (
              <option key={m} value={m}>
                {m === 'unknown' ? t('views.analytics.unknownModel') : m}
              </option>
            ))}
          </select>
        )}
        {field(
          'groupBy',
          <select id="analytics-groupBy" value={state.groupBy} onChange={(e) => update({ groupBy: e.target.value })} {...tip(t('tips.analytics.filters.groupBy'))}>
            {GROUP_BY.map((g) => (
              <option key={g} value={g}>
                {t(`views.analytics.groupBy.${g}`)}
              </option>
            ))}
          </select>
        )}
        <div className="field field-checkbox analytics-ttft-toggle">
          <input id="analytics-ttft" type="checkbox" checked={excluding} onChange={(e) => update({ ttft: e.target.checked ? 'excluding' : 'all' })} data-testid="analytics-ttft-excluding" {...tip(t('tips.analytics.filters.ttft'))} />
          <label htmlFor="analytics-ttft" {...tip(t('tips.analytics.filters.ttft'))}>
            {t('views.analytics.filters.ttft')}
          </label>
        </div>
      </div>

      {built.error && (
        <div className="warning-banner" role="status">
          {t(`views.analytics.rangeError.${built.error}`)}
        </div>
      )}
      {data?.truncated && (
        <div className="warning-banner" role="status" data-testid="analytics-truncated">
          {t('views.analytics.truncated')}
        </div>
      )}
      {error && !missing && <ErrorBanner message={errorMessage(t, error)} onRetry={load} />}

      {missing ? (
        <div className="table-frame">
          <EmptyState title={t('views.analytics.unavailableTitle')} body={t('views.analytics.unavailableBody')} />
        </div>
      ) : !data && loading ? (
        <LoadingState label={t('views.analytics.loading')} />
      ) : data && totals.runs === 0 ? (
        <div className="table-frame" data-testid="analytics-empty">
          <EmptyState title={t('views.analytics.emptyTitle')} body={t('views.analytics.emptyBody')} />
        </div>
      ) : data ? (
        <>
          <div className="kpi-grid" data-testid="analytics-totals">
            {cards.map((c) => (
              <KpiCard key={c.key} label={t(`views.analytics.cards.${c.key}`)} value={c.value} note={c.note} tone={c.tone} tip={t(`tips.analytics.cards.${c.key}`)} testId={`analytics-card-${c.key}`} />
            ))}
          </div>
          <div className="analytics-charts">
            {charts.map((chart) => {
              const raw = chartSeries(data, chart, grouped, t('views.analytics.other'));
              const series = labelSeries(raw.series, state.groupBy);
              const hidden = raw.hidden;
              return (
                <div key={chart.id}>
                  <TimeSeriesChart
                    id={chart.id}
                    testId={`analytics-chart-${chart.id}`}
                    title={grouped ? t('views.analytics.groupedTitle', { chart: t(`views.analytics.charts.${chart.id}.title`), metric: t(`views.analytics.metrics.${chart.grouped}`) }) : t(`views.analytics.charts.${chart.id}.title`)}
                    help={chart.id === 'ttft' && excluding ? t('views.analytics.charts.ttft.helpExcluding') : t(`views.analytics.charts.${chart.id}.help`)}
                    titleTip={t(`tips.analytics.charts.${chart.id}`)}
                    kind={chart.kind}
                    times={data.times}
                    series={series}
                    format={formatters[chart.format]}
                    bucketSeconds={data.bucketSeconds}
                    legendTip={seriesTip(chart, state.groupBy)}
                    exportInfo={exportInfo(chart.id === 'ttft' && excluding ? 'ttft-excluding-delegation' : chart.id, chart.format)}
                  />
                  {hidden > 0 && <div className="analytics-chart-help">{t('views.analytics.hiddenGroups', { count: hidden })}</div>}
                </div>
              );
            })}
          </div>

          {usage && (
            <section className="analytics-usage" aria-labelledby="usage-title" data-testid="analytics-usage">
              <h2 id="usage-title" className="section-title" {...tip(t('tips.analytics.usage'))}>
                {t('views.analytics.usage.title')}
              </h2>
              <p className="analytics-chart-help">{t('views.analytics.usage.help')}</p>
              <div className="analytics-charts">
                {USAGE_CHARTS.map((chart) => {
                  const series = labelSeries(chartSeries(usage, chart, true, t('views.analytics.other')).series, 'harnessModel');
                  return (
                    <TimeSeriesChart
                      key={chart.id}
                      id={chart.id}
                      testId={`analytics-chart-${chart.id}`}
                      title={t(`views.analytics.charts.${chart.id}.title`)}
                      help={t(`views.analytics.charts.${chart.id}.help`)}
                      titleTip={t(`tips.analytics.charts.${chart.id}`)}
                      kind="stacked"
                      times={usage.times}
                      series={series}
                      format={formatters[chart.format]}
                      bucketSeconds={usage.bucketSeconds}
                      legendTip={seriesTip(chart, 'harnessModel')}
                      exportInfo={exportInfo(chart.id, chart.format, { ...filterValues, groupBy: 'harnessModel' })}
                    />
                  );
                })}
                <div className="table-frame" data-testid="analytics-breakdown">
                  <div className="table-toolbar">
                    <div className="table-pagination-summary">
                      <strong {...tip(t('tips.analytics.breakdown'))}>{t('views.analytics.breakdown.title')}</strong>
                    </div>
                    <div className="table-pagination-controls">
                      {breakdown.length > 0 && (
                        <ExportMenu
                          title={t('views.analytics.breakdown.title')}
                          testId="export-breakdown"
                          fileName={(ext) => exportFileName('analytics-harness-model-breakdown', rangeLabel, filterValues, ext)}
                          csv={breakdownCsv}
                        />
                      )}
                    </div>
                  </div>
                  {breakdown.length === 0 ? (
                    <div className="chart-empty">{t('views.analytics.noDataInChart')}</div>
                  ) : (
                    <div className="table-scroll">
                      <table className="data-table">
                        <thead>
                          <tr>
                            {breakdownColumns.map((k) => (
                              <th key={k} scope="col" className={k === 'harness' || k === 'model' ? '' : 'right'} {...tip(t(`tips.analytics.breakdownColumns.${k}`))}>
                                {t(`views.analytics.breakdown.columns.${k}`)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {breakdown.map((r) => (
                            <tr key={r.key} data-row={r.key}>
                              {breakdownColumns.map((k) => (
                                <td key={k} className={k === 'harness' || k === 'model' ? '' : 'right nowrap'}>
                                  {cell(k, r)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
        </>
      ) : null}
    </div>
  );
}
