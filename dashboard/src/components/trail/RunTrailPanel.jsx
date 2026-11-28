import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AutoRefreshSelect from '../AutoRefreshSelect';
import { LoadingState, ErrorBanner, EmptyState } from '../States';
import { DownloadIcon, RefreshIcon } from '../Icons';
import { tip } from '../Tooltip';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import useRunTrail from '../../hooks/useRunTrail';
import { pathFor } from '../../config/navConfig';
import { errorMessage } from '../../utils/errors';
import { downloadText, exportFileName } from '../../utils/exporters';
import { formatNumber } from '../../i18n/formatters';
import { formatMs, formatUsd } from '../../utils/telemetry';
import { isSingleRunTrail, trailSummary } from '../../utils/trailLayout';
import TrailSequence from './TrailSequence';
import TrailList from './TrailList';
import TrailStepDrawer from './TrailStepDrawer';

// The graph view brings React Flow, which loads with the canvas chunk only when the Graph view opens.
const TrailGraph = lazy(() => import('./TrailGraph'));

/** Trail views (LP-005): the sequence view is the default; below 768px only the list shows. */
export const TRAIL_VIEWS = ['sequence', 'graph', 'list'];

/** Width below which only the list view is offered (LP-005). */
export const TRAIL_NARROW_QUERY = '(max-width: 767px)';

function useNarrow() {
  const get = () => (typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(TRAIL_NARROW_QUERY).matches : false);
  const [narrow, setNarrow] = useState(get);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const mq = window.matchMedia(TRAIL_NARROW_QUERY);
    const on = () => setNarrow(mq.matches);
    on();
    if (mq.addEventListener) mq.addEventListener('change', on);
    else if (mq.addListener) mq.addListener(on);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', on);
      else if (mq.removeListener) mq.removeListener(on);
    };
  }, []);
  return narrow;
}

function SummaryItem({ label, tipText, value, testId }) {
  return (
    <div className="trail-summary-item" data-testid={testId}>
      <dt {...tip(tipText)}>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

/**
 * The Trail tab of Run detail (LP2.7): the activity trail from the request that started the chain, through every
 * agent and hop, back to the reply. A summary strip (agents, hops, duration, tokens, cost, failures), a banner when
 * the server cut the trail at a cap, Export JSON, Refresh and auto-refresh (5 seconds while a step runs, LP-011), and
 * three views: sequence (default), graph, and list. `?step=<nodeId>` selects a step and opens its drawer, which is how
 * the "Open trail" links elsewhere land on the right step (LP2.8).
 */
export default function RunTrailPanel({ runId }) {
  const { t, i18n } = useTranslation();
  const lng = i18n.language;
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const narrow = useNarrow();
  const [view, setView] = useState('sequence');
  const { trail, error, loading, reload, autoRefresh, setAutoRefresh } = useRunTrail(apiClient, tenantId, runId);
  const requestedStep = searchParams.get('step') || '';
  const [selectedId, setSelectedId] = useState(requestedStep || null);
  const [openId, setOpenId] = useState(requestedStep || null);
  const shownView = narrow ? 'list' : view;

  useEffect(() => {
    if (requestedStep) {
      setSelectedId(requestedStep);
      setOpenId(requestedStep);
    }
  }, [requestedStep]);

  const writeStep = useCallback(
    (id) => {
      const next = new URLSearchParams(searchParams);
      if (id) next.set('step', id);
      else next.delete('step');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const open = useCallback(
    (id) => {
      setSelectedId(id);
      setOpenId(id);
      writeStep(id);
    },
    [writeStep]
  );

  const close = useCallback(() => {
    const id = openId;
    setOpenId(null);
    writeStep(null);
    // Focus goes back to the step the drawer was opened from.
    requestAnimationFrame(() => {
      const el = [...document.querySelectorAll('.trail-views [data-step-id]')].find((n) => n.getAttribute('data-step-id') === id);
      const target = el?.matches?.('[tabindex], button') ? el : el?.querySelector?.('button, [tabindex]');
      target?.focus?.();
    });
  }, [openId, writeStep]);

  const summary = useMemo(() => trailSummary(trail), [trail]);
  const openNode = trail?.nodes?.find((n) => n.id === openId) || null;

  if (!trail && error) {
    return (
      <div data-testid="trail-panel">
        <ErrorBanner message={error?.status === 404 ? t('trail.notFound') : errorMessage(t, error)} onRetry={reload} />
      </div>
    );
  }
  if (!trail) return <LoadingState label={t('trail.loading')} />;

  const truncated = trail.truncation && trail.truncation !== 'None';
  const na = t('common.generic.notAvailable');
  const exportJson = () => downloadText(exportFileName('run-trail', runId, {}, 'json'), JSON.stringify(trail, null, 2), 'application/json');

  return (
    <div className="trail-panel" data-testid="trail-panel">
      <div className="trail-toolbar">
        {!narrow && (
          <div className="range-group segmented" role="group" aria-label={t('trail.views.label')} data-testid="trail-views" data-tour="trail-views">
            {TRAIL_VIEWS.map((v) => (
              <button key={v} type="button" aria-pressed={view === v} className={`range-btn ${view === v ? 'active' : ''}`} onClick={() => setView(v)} data-testid={`trail-view-${v}`} {...tip(t(`tips.trail.views.${v}`))}>
                {t(`trail.views.${v}`)}
              </button>
            ))}
          </div>
        )}
        <div className="trail-toolbar-end" data-tour="trail-actions">
          <AutoRefreshSelect value={autoRefresh} onChange={setAutoRefresh} />
          <button type="button" className="button-secondary button-sm" onClick={reload} disabled={loading} data-testid="trail-refresh" {...tip(t('tips.trail.refresh'))}>
            <RefreshIcon /> {t('trail.refresh')}
          </button>
          <button type="button" className="button-secondary button-sm" onClick={exportJson} data-testid="trail-export-json" {...tip(t('tips.trail.exportJson'))}>
            <DownloadIcon /> {t('trail.exportJson')}
          </button>
        </div>
      </div>

      {narrow && (
        // The sequence and graph views need room; below 768 pixels the list stands in, and says so (UXP1-V040).
        <p className="info-banner trail-narrow-note" role="note" data-testid="trail-narrow-note">
          {view === 'graph' ? t('trail.narrowGraph') : t('trail.narrowSequence')}
        </p>
      )}

      <dl className="trail-summary" data-testid="trail-summary" data-tour="trail-summary">
        <SummaryItem label={t('trail.summary.agents')} tipText={t('tips.trail.summary.agents')} value={formatNumber(summary.agents, {}, lng)} testId="trail-summary-agents" />
        <SummaryItem label={t('trail.summary.hops')} tipText={t('tips.trail.summary.hops')} value={formatNumber(summary.hops, {}, lng)} testId="trail-summary-hops" />
        <SummaryItem label={t('trail.summary.duration')} tipText={t('tips.trail.summary.duration')} value={formatMs(summary.durationMs, lng, na)} testId="trail-summary-duration" />
        <SummaryItem label={t('trail.summary.tokens')} tipText={t('tips.trail.summary.tokens')} value={t('trail.drawer.tokens', { input: formatNumber(summary.inputTokens, {}, lng), output: formatNumber(summary.outputTokens, {}, lng) })} testId="trail-summary-tokens" />
        <SummaryItem label={t('trail.summary.cost')} tipText={t('tips.trail.summary.cost')} value={formatUsd(summary.costUsd, lng, na)} testId="trail-summary-cost" />
        <SummaryItem label={t('trail.summary.failures')} tipText={t('tips.trail.summary.failures')} value={<span className={summary.failures ? 'text-danger' : ''}>{formatNumber(summary.failures, {}, lng)}</span>} testId="trail-summary-failures" />
      </dl>

      {error && <ErrorBanner message={errorMessage(t, error)} onRetry={reload} />}
      {truncated && (
        <div className="warning-banner" role="status" data-testid="trail-truncated">
          <span>{t(`trail.truncation.${trail.truncation}`, { count: trail.nodeCount, hops: trail.hopCount })}</span>
          <a
            href={pathFor('settings')}
            {...tip(t('tips.trail.truncationSetting'))}
            onClick={(e) => {
              e.preventDefault();
              navigate(pathFor('settings'));
            }}
          >
            {t('trail.truncationSetting')}
          </a>
        </div>
      )}
      {trail.nodes?.some((n) => n.kind === 'Redacted') && (
        <p className="text-muted trail-redacted-note" data-testid="trail-redacted-note">
          {t('trail.redactedNote')}
        </p>
      )}
      {isSingleRunTrail(trail) && (
        <EmptyState title={t('trail.singleTitle')} body={t('trail.singleBody')} />
      )}

      <div className={`trail-body view-${shownView} ${openNode ? 'has-drawer' : ''}`.trim()}>
        <div className="trail-views" data-tour="trail-steps">
          {shownView === 'sequence' && <TrailSequence trail={trail} selectedId={selectedId} onSelect={setSelectedId} onOpen={open} />}
          {shownView === 'graph' && (
            <Suspense fallback={<LoadingState />}>
              <TrailGraph trail={trail} selectedId={selectedId} onSelect={setSelectedId} onOpen={open} />
            </Suspense>
          )}
          {shownView === 'list' && <TrailList trail={trail} selectedId={selectedId} onOpen={open} onRefresh={reload} />}
        </div>
        {openNode && <TrailStepDrawer trail={trail} node={openNode} onClose={close} />}
      </div>
    </div>
  );
}
