import { tip } from './Tooltip';
import { formatCurrency, formatPercent } from '../i18n/formatters';
import { chartRows } from '../utils/performance';

/**
 * Success rate and cost by unit (AA11.7), drawn the way the dashboard draws its other bars: one row per unit with a
 * success-rate bar (0 to 100 percent) and a cost bar scaled to the most expensive unit. Each bar is a meter with its
 * value as text beside it, so the chart reads without color and reflows to one column on a phone.
 */
export default function UnitPerformanceChart({ units, t, lng }) {
  const rows = chartRows(units);
  if (rows.length === 0) return null;
  return (
    <figure className="perf-chart" data-testid="performance-chart">
      <figcaption className="perf-chart-legend">
        <span className="perf-legend perf-legend-rate" {...tip(t('tips.performance.chart.successRate'))}>
          {t('performance.chart.successRate')}
        </span>
        <span className="perf-legend perf-legend-cost" {...tip(t('tips.performance.chart.cost'))}>
          {t('performance.chart.cost')}
        </span>
      </figcaption>
      <ul className="plain-list perf-chart-rows">
        {rows.map((r) => {
          const rate = r.successRate == null ? null : Math.round(r.successRate * 100);
          const rateText = r.successRate == null ? t('performance.chart.noRuns') : formatPercent(r.successRate, lng);
          const costText = formatCurrency(r.costUsd, lng, 'USD');
          return (
            <li key={r.unitId} className="perf-chart-row" data-chart-unit={r.unitId}>
              <div className="perf-chart-unit">{r.unitName}</div>
              <div className="perf-chart-bars">
                <div className="perf-bar perf-bar-rate">
                  <div className="perf-bar-track" role="meter" aria-label={t('performance.chart.rateLabel', { unit: r.unitName, value: rateText })} aria-valuemin={0} aria-valuemax={100} aria-valuenow={rate ?? 0}>
                    <div className="perf-bar-fill" style={{ width: `${rate ?? 0}%` }} />
                  </div>
                  <span className="perf-bar-value">{rateText}</span>
                </div>
                <div className="perf-bar perf-bar-cost">
                  <div className="perf-bar-track" role="meter" aria-label={t('performance.chart.costLabel', { unit: r.unitName, value: costText })} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(r.costFraction * 100)}>
                    <div className="perf-bar-fill" style={{ width: `${Math.round(r.costFraction * 100)}%` }} />
                  </div>
                  <span className="perf-bar-value">{costText}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}
