import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LocalTableFrame from '../LocalTableFrame';
import CopyableId from '../CopyableId';
import { tip } from '../Tooltip';
import { formatDateTime, formatNumber } from '../../i18n/formatters';
import { formatMs, formatUsd } from '../../utils/telemetry';
import { enumLabel } from '../../utils/enums';
import { buildLanes, filterTrailNodes, laneOf, orderedNodes } from '../../utils/trailLayout';
import { TrailState, edgeLabel, edgeTip, entrySurfaceLabel, entrySurfaceTip, kindLabel, kindTip, laneName, stateLabel, stepTitle } from './trailParts';

/**
 * The list view of an activity trail (LP2.5): every step in time order in a LocalTableFrame (`run-trail`, with the
 * Columns control and a saved page size), filtered by kind, agent, and state, with how each step was reached. A row
 * click or its Details button opens the step drawer. It is the text equivalent of the diagrams and the only view
 * below 768px (LP-005).
 */
export default function TrailList({ trail, selectedId, onOpen, onRefresh }) {
  const { t, i18n } = useTranslation();
  const lng = i18n.language;
  const na = t('common.generic.notAvailable');
  const [filters, setFilters] = useState({ kind: '', agent: '', state: '' });
  const lanes = useMemo(() => buildLanes(trail), [trail]);
  const laneNames = useMemo(() => new Map(lanes.map((l) => [l.id, laneName(t, l)])), [lanes, t]);
  const ordered = useMemo(() => orderedNodes(trail).map((n, i) => ({ ...n, order: i + 1 })), [trail]);
  const reachedBy = useMemo(() => {
    const map = new Map();
    for (const e of trail?.edges || []) if (!map.has(e.toId)) map.set(e.toId, e);
    return map;
  }, [trail]);
  const items = useMemo(() => filterTrailNodes(ordered, filters), [ordered, filters]);
  const kinds = [...new Set(ordered.map((n) => n.kind))];
  const states = [...new Set(ordered.map((n) => n.state).filter(Boolean))];
  const set = (name) => (e) => setFilters((f) => ({ ...f, [name]: e.target.value }));
  const when = (v) => (v ? formatDateTime(v, lng, { dateStyle: 'short', timeStyle: 'medium' }) : '-');

  const columns = [
    { key: 'order', label: t('trail.columns.order'), tip: t('tips.trail.columns.order'), pinned: true, sortable: true, cellClass: 'right', render: (n) => formatNumber(n.order, {}, lng) },
    {
      key: 'kind',
      label: t('trail.columns.step'),
      tip: t('tips.trail.columns.step'),
      pinned: true,
      render: (n) => (
        <span className={n.kind === 'Redacted' ? 'trail-list-redacted' : ''} {...tip(kindTip(t, n.kind))}>
          {stepTitle(t, n)}
        </span>
      ),
      csv: (n) => n.kind
    },
    { key: 'lane', label: t('trail.columns.agent'), tip: t('tips.trail.columns.agent'), render: (n) => laneNames.get(laneOf(n)) || '-', csv: (n) => n.agentName || n.callerName || '' },
    {
      key: 'entrySurface',
      label: t('trail.columns.entrySurface'),
      tip: t('tips.trail.columns.entrySurface'),
      render: (n) => (n.entrySurface ? <span {...tip(entrySurfaceTip(t, n.entrySurface))}>{entrySurfaceLabel(t, n.entrySurface)}</span> : '-'),
      csv: (n) => n.entrySurface || ''
    },
    { key: 'state', label: t('trail.columns.state'), tip: t('tips.trail.columns.state'), pinned: true, render: (n) => <TrailState t={t} state={n.state} />, csv: (n) => n.state || '' },
    {
      key: 'reachedBy',
      label: t('trail.columns.reachedBy'),
      tip: t('tips.trail.columns.reachedBy'),
      render: (n) => {
        const e = reachedBy.get(n.id);
        return e ? <span {...tip(edgeTip(t, e.kind))}>{edgeLabel(t, e.kind)}</span> : '-';
      },
      csv: (n) => reachedBy.get(n.id)?.kind || ''
    },
    { key: 'startedUtc', label: t('trail.columns.started'), tip: t('tips.trail.columns.started'), sortable: true, cellClass: 'nowrap', render: (n) => when(n.startedUtc) },
    { key: 'durationMs', label: t('trail.columns.duration'), tip: t('tips.trail.columns.duration'), sortable: true, cellClass: 'right nowrap', render: (n) => formatMs(n.durationMs, lng, '-') },
    { key: 'unitName', label: t('trail.columns.unit'), tip: t('tips.trail.columns.unit'), defaultHidden: true, render: (n) => n.unitName || '-' },
    { key: 'runKind', label: t('trail.columns.runKind'), tip: t('tips.trail.columns.runKind'), defaultHidden: true, render: (n) => (n.runKind ? enumLabel(t, 'runKind', n.runKind) : '-') },
    { key: 'tokens', label: t('trail.columns.tokens'), tip: t('tips.trail.columns.tokens'), defaultHidden: true, cellClass: 'right nowrap', render: (n) => (n.inputTokens == null && n.outputTokens == null ? '-' : formatNumber((n.inputTokens || 0) + (n.outputTokens || 0), {}, lng)) },
    { key: 'costUsd', label: t('trail.columns.cost'), tip: t('tips.trail.columns.cost'), cellClass: 'right nowrap', render: (n) => (n.costUsd == null ? '-' : formatUsd(n.costUsd, lng, na)) },
    { key: 'id', label: t('trail.columns.id'), tip: t('tips.trail.columns.id'), defaultHidden: true, cellClass: 'cell-id', render: (n) => <CopyableId value={n.id} /> },
    {
      key: 'open',
      label: t('trail.columns.open'),
      tip: t('tips.trail.columns.open'),
      pinned: true,
      csv: () => '',
      render: (n) => (
        <button type="button" className="button-secondary button-sm" onClick={() => onOpen?.(n.id)} data-testid="trail-list-open" aria-label={t('trail.openStepNamed', { step: stepTitle(t, n) })} {...tip(t('tips.trail.openStep'))}>
          {t('trail.openStep')}
        </button>
      )
    }
  ];

  const filterSlot = (
    <div className="filter-inline">
      <label className="filter-select" {...tip(t('tips.trail.filters.kind'))}>
        <span>{t('trail.filters.kind')}</span>
        <select value={filters.kind} onChange={set('kind')} aria-label={t('trail.filters.kind')} data-testid="trail-filter-kind">
          <option value="">{t('common.generic.all')}</option>
          {kinds.map((k) => (
            <option key={k} value={k}>
              {kindLabel(t, k)}
            </option>
          ))}
        </select>
      </label>
      <label className="filter-select" {...tip(t('tips.trail.filters.agent'))}>
        <span>{t('trail.filters.agent')}</span>
        <select value={filters.agent} onChange={set('agent')} aria-label={t('trail.filters.agent')} data-testid="trail-filter-agent">
          <option value="">{t('common.generic.all')}</option>
          {lanes.map((l) => (
            <option key={l.id} value={l.id}>
              {laneNames.get(l.id)}
            </option>
          ))}
        </select>
      </label>
      <label className="filter-select" {...tip(t('tips.trail.filters.state'))}>
        <span>{t('trail.filters.state')}</span>
        <select value={filters.state} onChange={set('state')} aria-label={t('trail.filters.state')} data-testid="trail-filter-state">
          <option value="">{t('common.generic.all')}</option>
          {states.map((s) => (
            <option key={s} value={s}>
              {stateLabel(t, s)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );

  return (
    <div className="trail-list" data-testid="trail-list">
      <LocalTableFrame
        tableId="run-trail"
        columns={columns}
        items={items}
        compact
        filterSlot={filterSlot}
        onRefresh={onRefresh}
        onRowClick={(n) => onOpen?.(n.id)}
        rowProps={(n) => ({ 'data-step-id': n.id, className: [n.id === selectedId ? 'is-selected' : '', n.isFocus ? 'trail-row-focus' : ''].filter(Boolean).join(' ') })}
        emptyMessage={t('trail.listEmpty')}
        testId="trail-list-table"
      />
    </div>
  );
}
