import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import TimeSeriesChart from './TimeSeriesChart';
import { ErrorBanner, LoadingState } from './States';
import { tip } from './Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { REPORT_LIMITS } from '../utils/constants';
import { errorMessage } from '../utils/errors';
import { formatNumber } from '../i18n/formatters';
import { authorText, metricNames, metricSeries, metricText } from '../utils/reports';

/**
 * One metric across every report of a report's author agent (AA5.10), oldest first, from GET /reports/metrics. The
 * picker lists the metrics this report carries and starts on the first. A report without an author agent, or without
 * metrics, says so instead of charting.
 */
export default function ReportMetricChart({ report }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const names = metricNames(report);
  const [name, setName] = useState(names[0] || '');
  const [points, setPoints] = useState(null);
  const [error, setError] = useState(null);
  const author = report?.authorAgentId || '';
  const lng = i18n.language;

  const load = useCallback(() => {
    if (!apiClient || !author || !name) return undefined;
    let cancelled = false;
    setPoints(null);
    setError(null);
    apiClient
      .listReportMetrics(tenantId, { author, name, maxPoints: REPORT_LIMITS.metricPoints })
      .then((list) => !cancelled && setPoints(Array.isArray(list) ? list : []))
      .catch((e) => !cancelled && setError(e));
    return () => {
      cancelled = true;
    };
  }, [apiClient, tenantId, author, name]);

  useEffect(load, [load]);

  if (!names.length) return <p className="text-muted" data-testid="report-chart-none">{t('reports.chart.noMetrics')}</p>;
  if (!author) return <p className="text-muted" data-testid="report-chart-none">{t('reports.chart.noAuthor')}</p>;

  const series = metricSeries(points);
  const format = (v) => formatNumber(v, { maximumFractionDigits: 2 }, lng);
  const agent = authorText(report);
  // Points days apart read best with dates alone on the x axis; closer points keep the time of day.
  const spanMs = series.times.length > 1 ? new Date(series.times[series.times.length - 1]).getTime() - new Date(series.times[0]).getTime() : 0;

  return (
    <div className="report-chart" data-testid="report-chart">
      <div className="field report-chart-picker">
        <label htmlFor="report-chart-metric" {...tip(t('tips.reports.chart.metric'))}>
          {t('reports.chart.metric')}
        </label>
        <select id="report-chart-metric" value={name} onChange={(e) => setName(e.target.value)} data-testid="report-chart-metric" {...tip(t('tips.reports.chart.metric'))}>
          {names.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      {error ? (
        <ErrorBanner message={`${t('reports.chart.failed')} ${errorMessage(t, error)}`} onRetry={load} />
      ) : points === null ? (
        <LoadingState />
      ) : series.times.length === 0 ? (
        <p className="text-muted" data-testid="report-chart-empty">
          {t('reports.chart.empty')}
        </p>
      ) : (
        <TimeSeriesChart
          id="report-metric"
          testId="report-metric-chart"
          title={t('reports.chart.title', { metric: name })}
          help={t('reports.chart.help', { agent, count: series.times.length })}
          titleTip={t('tips.reports.chart.chart')}
          kind="line"
          bucketSeconds={spanMs >= 2 * 86400000 ? 86400 : undefined}
          times={series.times}
          series={[{ key: 'metric', label: series.unit ? `${name} (${series.unit})` : name, color: 'var(--series-1)', values: series.values }]}
          format={(v) => metricText(v, null, format)}
          exportInfo={{ name: `report-metric-${agent || author}-${name}`, lines: [], unit: series.unit || undefined, filters: { author, name } }}
        />
      )}
    </div>
  );
}
