import { useTranslation } from 'react-i18next';
import { RefreshIcon } from './Icons';
import { tip } from './Tooltip';

/** Segmented range control + optional refresh button. */
export default function RangeTabs({ ranges, value, onChange, onRefresh, loading, label }) {
  const { t } = useTranslation();
  return (
    <div className="chart-controls">
      <div className="range-group" role="tablist" aria-label={label || t('components.chart.range')}>
        {ranges.map((r) => (
          <button
            key={r.id}
            type="button"
            role="tab"
            aria-selected={value === r.id}
            className={`range-btn ${value === r.id ? 'active' : ''}`}
            onClick={() => onChange(r.id)}
            {...tip(t(`tips.chart.ranges.${r.id}`))}
          >
            {t(`components.chart.ranges.${r.id}`)}
          </button>
        ))}
      </div>
      {onRefresh && (
        <button
          type="button"
          className="icon-button"
          onClick={onRefresh}
          disabled={loading}
          aria-label={t('components.table.refresh')}
          {...tip(t('tips.chart.refresh'))}
        >
          <RefreshIcon size={16} />
        </button>
      )}
    </div>
  );
}
