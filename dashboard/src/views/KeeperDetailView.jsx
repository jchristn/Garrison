import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import OpenTrailLink from '../components/trail/OpenTrailLink';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import CopyableId from '../components/CopyableId';
import ConfirmModal from '../components/ConfirmModal';
import JsonViewerModal from '../components/JsonViewerModal';
import Explainer from '../components/Explainer';
import Modal from '../components/Modal';
import DiffViewer from '../components/DiffViewer';
import TableFrame from '../components/TableFrame';
import LocalTableFrame from '../components/LocalTableFrame';
import TimeSeriesChart from '../components/TimeSeriesChart';
import KeeperRevisionModal from '../components/KeeperRevisionModal';
import { MandateStatusBadge, TickOutcomeBadge } from '../components/KeeperBadges';
import { Badge } from '../components/StatusBadge';
import { EmptyNote, EmptyState, ErrorBanner, LoadingState } from '../components/States';
import { CodeIcon, TrashIcon, PlayIcon, PauseIcon, WakeIcon, PlusIcon, ListIcon } from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { ENUMS, KEEPER_POLL_MS } from '../utils/constants';
import { pathFor } from '../config/navConfig';
import { errorMessage } from '../utils/errors';
import { enumLabel } from '../utils/enums';
import { enumTip } from '../utils/tips';
import { formatCurrency, formatDateTime, formatNumber, formatRelativeTime } from '../i18n/formatters';
import { canPause, canResume, canWake, formatInterval, outcomeCounts, previousRevision, revisionText, sameRevisionContent, tickSeries } from '../utils/keepers';
import { tip } from '../components/Tooltip';
import FreezeAction from '../components/FreezeAction';
import FrozenBanner from '../components/FrozenBanner';
import useActiveFreezes from '../hooks/useActiveFreezes';
import useCallerPermissions from '../hooks/useCallerPermissions';
import usePageSizePref from '../hooks/usePageSizePref';
import { deniedProps, permissionDenied } from '../utils/permissions';
import { FREEZES_CHANGED_EVENT, freezeOn, freezesFor } from '../utils/freezes';
import UnitLink from '../components/UnitLink';
import useOrgUnitIndex from '../hooks/useOrgUnitIndex';
import { unitsOfMandate } from '../utils/organizations';

/** Rows per page of the ticks table until the operator picks another size (saved per table). */
const TICK_PAGE_SIZE = 25;

function Detail({ label, tip: tipText, children, testId }) {
  return (
    <div className="detail-item" data-testid={testId}>
      <div className="detail-item-label" {...tip(tipText)}>
        {label}
      </div>
      <div className="detail-item-value">{children ?? '-'}</div>
    </div>
  );
}

/** A link to another dashboard page that navigates in place. */
function PageLink({ to, tipText, navigate, children, testId }) {
  return (
    <a
      href={to}
      data-testid={testId}
      {...tip(tipText)}
      onClick={(e) => {
        e.preventDefault();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}

/** One block of revision text (objective, healthy definition, and so on), kept as the author wrote it. */
function RevisionText({ label, tipText, value, testId }) {
  if (!value) return null;
  return (
    <div className="keeper-revision-block" data-testid={testId}>
      <div className="detail-item-label" {...tip(tipText)}>
        {label}
      </div>
      <div className="keeper-revision-text">{value}</div>
    </div>
  );
}

/**
 * Live updates for one keeper over the WebSocket channel mandate:{id} (AA1.13). Calls onEvent for tick.started and
 * tick.completed and returns whether the channel is subscribed; while it is not, the page polls.
 */
function useMandateChannel(apiClient, mandateId, onEvent) {
  const [live, setLive] = useState(false);
  const handler = useRef(onEvent);
  useEffect(() => {
    handler.current = onEvent;
  }, [onEvent]);
  useEffect(() => {
    if (!apiClient || !mandateId || typeof WebSocket === 'undefined' || typeof apiClient.webSocketUrl !== 'function') return undefined;
    const channel = `mandate:${mandateId}`;
    let ws;
    try {
      ws = new WebSocket(apiClient.webSocketUrl());
      ws.onopen = () => {
        try {
          ws.send(JSON.stringify({ type: 'subscribe', channel }));
        } catch {
          /* ignore */
        }
      };
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message?.type === 'subscribed' && message.channel === channel) setLive(true);
          else if (message?.type === 'error' && message.channel === channel) setLive(false);
          else if ((message?.type === 'tick.started' || message?.type === 'tick.completed') && message.mandateId === mandateId) handler.current?.(message);
        } catch {
          /* not JSON */
        }
      };
      ws.onclose = () => setLive(false);
      ws.onerror = () => setLive(false);
    } catch {
      setLive(false);
    }
    return () => ws?.close();
  }, [apiClient, mandateId]);
  return live;
}

/**
 * One keeper (AA1.16): its status and schedule, the current revision, the ticks (a chart of the applied interval, the
 * outcome counts, and a paged table with links to each tick's run), and the revisions with a diff against the previous
 * one. Pause, Resume, Wake now, New revision, View runs, View JSON, and Delete. Updates live over the mandate channel,
 * else polls.
 */
export default function KeeperDetailView({ recordId }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const lng = i18n.language;
  const [mandate, setMandate] = useState(null);
  const [error, setError] = useState(null);
  const [ticks, setTicks] = useState({ items: [], totalCount: 0 });
  const [tickPage, setTickPage] = useState(1);
  const [tickPageSize, setTickPageSize] = usePageSizePref('keeper-ticks', TICK_PAGE_SIZE);
  const [tickOutcome, setTickOutcome] = useState('');
  const [revisions, setRevisions] = useState([]);
  const [names, setNames] = useState({ agent: null, deployment: null });
  const [jsonOpen, setJsonOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [diffOf, setDiffOf] = useState(null);
  const [busy, setBusy] = useState(false);
  const unmounted = useRef(false);
  const unitIndex = useOrgUnitIndex();

  useEffect(() => {
    unmounted.current = false;
    return () => {
      unmounted.current = true;
    };
  }, []);

  const loadMandate = useCallback(() => {
    if (!apiClient || !recordId) return Promise.resolve();
    return apiClient
      .getMandate(tenantId, recordId)
      .then((m) => {
        if (unmounted.current) return;
        setMandate(m);
        setError(null);
      })
      .catch((e) => !unmounted.current && setError(e));
  }, [apiClient, tenantId, recordId]);

  const loadTicks = useCallback(() => {
    if (!apiClient || !recordId) return Promise.resolve();
    return apiClient
      .listMandateTicks(tenantId, recordId, { pageNumber: tickPage, pageSize: tickPageSize, ...(tickOutcome ? { outcome: tickOutcome } : {}) })
      .then((r) => !unmounted.current && setTicks({ items: r.items || [], totalCount: r.totalCount ?? (r.items || []).length }))
      .catch(() => !unmounted.current && setTicks({ items: [], totalCount: 0 }));
  }, [apiClient, tenantId, recordId, tickPage, tickPageSize, tickOutcome]);

  const loadRevisions = useCallback(() => {
    if (!apiClient || !recordId) return Promise.resolve();
    return apiClient
      .listMandateRevisions(tenantId, recordId, { pageNumber: 1, pageSize: 100 })
      .then((r) => !unmounted.current && setRevisions(r.items || []))
      .catch(() => !unmounted.current && setRevisions([]));
  }, [apiClient, tenantId, recordId]);

  const reloadAll = useCallback(() => Promise.all([loadMandate(), loadTicks(), loadRevisions()]), [loadMandate, loadTicks, loadRevisions]);

  useEffect(() => {
    loadMandate();
    loadRevisions();
  }, [loadMandate, loadRevisions]);
  useEffect(() => {
    loadTicks();
  }, [loadTicks]);

  // Agent and deployment names for the summary; the IDs stay visible when the caller cannot read them.
  const agentId = mandate?.agentId;
  const deploymentId = mandate?.deploymentId;
  useEffect(() => {
    if (!apiClient || !agentId) return undefined;
    let active = true;
    Promise.all([apiClient.getAgent(tenantId, agentId).catch(() => null), deploymentId ? apiClient.getDeployment(tenantId, deploymentId).catch(() => null) : Promise.resolve(null)]).then(([a, d]) => {
      if (active) setNames({ agent: a ? a.displayName || a.name : null, deployment: d ? d.name : null });
    });
    return () => {
      active = false;
    };
  }, [apiClient, tenantId, agentId, deploymentId]);

  const onEvent = useCallback(() => {
    if (unmounted.current) return;
    loadMandate();
    loadTicks();
  }, [loadMandate, loadTicks]);
  const live = useMandateChannel(apiClient, mandate?.id, onEvent);

  // Brakes (AA3.8): freezes on this keeper, its agent, or its deployment, and the kill switch. Freezing or lifting
  // changes the keeper's status, so the keeper is re-read too.
  const activeFreezes = useActiveFreezes();
  const permissions = useCallerPermissions();
  useEffect(() => {
    window.addEventListener(FREEZES_CHANGED_EVENT, loadMandate);
    return () => window.removeEventListener(FREEZES_CHANGED_EVENT, loadMandate);
  }, [loadMandate]);

  // Without the live channel, re-read the keeper and its ticks while it is scheduled or ticking.
  const scheduled = mandate?.status === 'Active' || !!mandate?.activeRunId;
  useEffect(() => {
    if (!mandate || live || !scheduled) return undefined;
    const id = setInterval(() => {
      loadMandate();
      loadTicks();
    }, KEEPER_POLL_MS);
    return () => clearInterval(id);
  }, [mandate, live, scheduled, loadMandate, loadTicks]);

  const act = async (kind) => {
    setBusy(true);
    try {
      let next = null;
      if (kind === 'pause') next = await apiClient.pauseMandate(tenantId, recordId);
      else if (kind === 'resume') next = await apiClient.resumeMandate(tenantId, recordId);
      else if (kind === 'wake') next = await apiClient.wakeMandate(tenantId, recordId);
      if (next && !unmounted.current) setMandate((prev) => ({ ...prev, ...next, currentRevision: next.currentRevision || prev?.currentRevision }));
      addToast({ type: 'success', message: t(`resources.keepers.toasts.${kind}`, { name: mandate?.name }) });
      loadMandate();
    } catch (e) {
      addToast({ type: 'error', message: errorMessage(t, e) });
      loadMandate();
    } finally {
      if (!unmounted.current) setBusy(false);
    }
  };

  const remove = async (force) => {
    setBusy(true);
    try {
      await apiClient.deleteMandate(tenantId, recordId, force);
      addToast({ type: 'success', message: t('common.toasts.deleted') });
      navigate(pathFor('keepers'));
    } catch (e) {
      // A running tick answers 409 MandateActive: offer to delete anyway, which cancels that tick's run.
      if (!force && e?.code === 'MandateActive') {
        setConfirm('forceDelete');
        return;
      }
      addToast({ type: 'error', message: errorMessage(t, e) });
      setConfirm(null);
    } finally {
      if (!unmounted.current) setBusy(false);
    }
  };

  const publish = async (revision) => {
    setBusy(true);
    try {
      await apiClient.publishMandateRevision(tenantId, recordId, revision.id);
      addToast({ type: 'success', message: t('components.keeperRevision.published', { number: revision.number }) });
      reloadAll();
    } catch (e) {
      addToast({ type: 'error', message: errorMessage(t, e) });
    } finally {
      if (!unmounted.current) setBusy(false);
    }
  };

  if (error && !mandate) {
    return (
      <div>
        <PageHeader title={t('views.keeperDetail.title')} />
        <ErrorBanner message={errorMessage(t, error)} onRetry={loadMandate} />
        <EmptyState title={t('views.keeperDetail.notFoundTitle')} body={t('views.keeperDetail.notFoundBody')} />
      </div>
    );
  }
  if (!mandate) return <LoadingState />;

  const m = mandate;
  const rev = m.currentRevision || null;
  const when = (v) => (v ? <span {...tip(formatDateTime(v, lng))}>{formatRelativeTime(v, lng)}</span> : '-');
  const runLink = (id, testId) => (
    <PageLink to={pathFor('runs', id)} tipText={t('tips.views.keeperDetail.openRun')} navigate={navigate} testId={testId}>
      <code>{id}</code>
    </PageLink>
  );
  const series = tickSeries(ticks.items);
  // UT-03: write actions stay visible but disabled, with the missing permission as the tooltip.
  const deniedUpdate = permissionDenied(t, permissions, 'Mandate', 'Update', { resourceId: m.id });
  const deniedExecute = permissionDenied(t, permissions, 'Mandate', 'Execute', { resourceId: m.id });
  const deniedDelete = permissionDenied(t, permissions, 'Mandate', 'Delete', { resourceId: m.id });
  const counts = outcomeCounts(ticks.items, ENUMS.tickOutcome);
  const usd = (v) => (v === null || v === undefined ? '-' : formatCurrency(v, lng, 'USD'));
  const diffPrev = diffOf ? previousRevision(revisions, diffOf) : null;
  const stopping = freezesFor(
    activeFreezes.freezes,
    [
      { kind: 'Mandate', id: m.id },
      { kind: 'Agent', id: m.agentId },
      { kind: 'Deployment', id: m.deploymentId }
    ],
    { killSwitch: true }
  );

  return (
    <div data-testid="keeper-detail">
      <PageHeader
        title={t('views.keeperDetail.heading', { name: m.name })}
        subtitle={
          <span className="inline-meta" aria-live="polite" data-testid="keeper-live-status">
            <CopyableId value={m.id} max={40} /> <MandateStatusBadge status={m.status} t={t} />
            {m.activeRunId && <Badge tone="info" tip={t('tips.resources.keepers.ticking')}>{t('resources.keepers.ticking')}</Badge>}
            {live ? (
              <Badge tone="info" tip={t('tips.views.keeperDetail.live')}>{t('views.keeperDetail.live')}</Badge>
            ) : scheduled ? (
              <Badge tone="neutral" tip={t('tips.views.keeperDetail.polling')}>{t('views.keeperDetail.polling')}</Badge>
            ) : null}
          </span>
        }
        actions={
          <>
            <button type="button" className="button-secondary" onClick={() => setJsonOpen(true)} {...tip(t('tips.views.keeperDetail.viewJson'))}>
              <CodeIcon /> {t('common.actions.viewJson')}
            </button>
            <button type="button" className="button-secondary" onClick={() => navigate(pathFor('runs', null, { mandateId: m.id }))} data-testid="keeper-runs" {...tip(t('tips.resources.keepers.actions.runs'))}>
              <ListIcon size={14} /> {t('resources.keepers.actions.runs')}
            </button>
            <button type="button" className="button-secondary" disabled={busy} onClick={() => !deniedUpdate && setRevisionOpen(true)} data-testid="keeper-new-revision" {...deniedProps(deniedUpdate)} {...tip(deniedUpdate || t('tips.views.keeperDetail.newRevision'))}>
              <PlusIcon size={14} /> {t('views.keeperDetail.newRevision')}
            </button>
            {canPause(m) && (
              <button type="button" className="button-secondary" disabled={busy} onClick={() => !deniedExecute && act('pause')} data-testid="keeper-pause" {...deniedProps(deniedExecute)} {...tip(deniedExecute || t('tips.resources.keepers.actions.pause'))}>
                <PauseIcon size={14} /> {t('resources.keepers.actions.pause')}
              </button>
            )}
            {canResume(m) && (
              <button type="button" className="button-secondary" disabled={busy} onClick={() => !deniedExecute && act('resume')} data-testid="keeper-resume" {...deniedProps(deniedExecute)} {...tip(deniedExecute || t('tips.resources.keepers.actions.resume'))}>
                <PlayIcon size={14} /> {t('resources.keepers.actions.resume')}
              </button>
            )}
            {canWake(m) && (
              <button type="button" className="button-primary" disabled={busy} onClick={() => !deniedExecute && act('wake')} data-testid="keeper-wake" {...deniedProps(deniedExecute)} {...tip(deniedExecute || t('tips.resources.keepers.actions.wake'))}>
                <WakeIcon size={14} /> {t('resources.keepers.actions.wake')}
              </button>
            )}
            <FreezeAction targetKind="Mandate" targetId={m.id} targetName={m.name} active={activeFreezes} permissions={permissions} />
            <button type="button" className="button-danger" disabled={busy} onClick={() => !deniedDelete && setConfirm('delete')} data-testid="keeper-delete" {...deniedProps(deniedDelete)} {...tip(deniedDelete || t('tips.views.keeperDetail.delete'))}>
              <TrashIcon size={14} /> {t('common.actions.delete')}
            </button>
          </>
        }
      />

      <FrozenBanner freezes={stopping} permissions={permissions} own={freezeOn(activeFreezes.freezes, 'Mandate', m.id)} />

      <Explainer topic="keepers" />

      <div className="panel detail-grid" data-testid="keeper-summary">
        <Detail label={t('resources.keepers.columns.agent')} tip={t('tips.resources.keepers.agent')}>
          <PageLink to={pathFor('agents', m.agentId)} tipText={t('tips.views.keeperDetail.openAgent')} navigate={navigate} testId="keeper-agent">
            {names.agent || m.agentId}
          </PageLink>
        </Detail>
        <Detail label={t('resources.keepers.columns.deployment')} tip={t('tips.resources.keepers.deployment')}>
          {names.deployment ? (
            <PageLink to={pathFor('deployments', null, { search: names.deployment })} tipText={t('tips.links.openDeployment')} navigate={navigate} testId="keeper-deployment">
              {names.deployment}
            </PageLink>
          ) : (
            m.deploymentId
          )}
        </Detail>
        <Detail label={t('links.unit')} tip={t('tips.links.keeperUnit')} testId="keeper-unit">
          {unitsOfMandate(unitIndex, m.id).length ? (
            <span className="inline-meta">
              {unitsOfMandate(unitIndex, m.id).map((u) => (
                <UnitLink key={u.id} unit={u} testId="keeper-unit-link" />
              ))}
            </span>
          ) : null}
        </Detail>
        <Detail label={t('resources.keepers.columns.nextWakeUtc')} tip={t('tips.resources.keepers.nextWakeUtc')} testId="keeper-next-wake">
          {m.status === 'Active' && m.nextWakeUtc ? (
            <span className="inline-meta">
              {when(m.nextWakeUtc)}
              {m.pendingWakeSource && <span className="text-muted" {...tip(enumTip(t, 'wakeSource', m.pendingWakeSource))}>{enumLabel(t, 'wakeSource', m.pendingWakeSource)}</span>}
            </span>
          ) : (
            t('views.keeperDetail.noWake')
          )}
        </Detail>
        <Detail label={t('resources.keepers.columns.currentIntervalSeconds')} tip={t('tips.resources.keepers.currentIntervalSeconds')}>
          {formatInterval(t, m.currentIntervalSeconds)}
          {rev ? <span className="text-muted">{` (${enumLabel(t, 'wakeMode', rev.wakeMode)})`}</span> : null}
        </Detail>
        <Detail label={t('resources.keepers.columns.lastTick')} tip={t('tips.resources.keepers.lastTick')}>
          <span aria-live="polite" data-testid="keeper-last-tick">
            {m.lastTickUtc ? (
              <span className="inline-meta">
                {when(m.lastTickUtc)} <TickOutcomeBadge outcome={m.lastTickOutcome} t={t} />
              </span>
            ) : (
              t('resources.keepers.neverTicked')
            )}
          </span>
        </Detail>
        <Detail label={t('views.keeperDetail.quietStreak')} tip={t('tips.views.keeperDetail.quietStreak')}>{formatNumber(m.consecutiveQuietTicks ?? 0, {}, lng)}</Detail>
        <Detail label={t('resources.keepers.columns.tickCount')} tip={t('tips.resources.keepers.tickCount')}>{formatNumber(m.tickCount ?? 0, {}, lng)}</Detail>
        <Detail label={t('views.keeperDetail.activeRun')} tip={t('tips.views.keeperDetail.activeRun')}>{m.activeRunId ? runLink(m.activeRunId, 'keeper-active-run') : null}</Detail>
        <Detail label={t('resources.keepers.columns.currentRevisionNumber')} tip={t('tips.resources.keepers.currentRevisionNumber')}>{m.currentRevisionNumber ? formatNumber(m.currentRevisionNumber, {}, lng) : null}</Detail>
        <Detail label={t('resources.keepers.columns.runAs')} tip={t('tips.resources.keepers.runAs')}>{m.runAsName || m.runAsId ? `${m.runAsName || m.runAsId} (${enumLabel(t, 'principalType', m.runAsType)})` : null}</Detail>
        <Detail label={t('resources.keepers.columns.createdUtc')} tip={t('tips.resources.keepers.createdUtc')}>{formatDateTime(m.createdUtc, lng)}</Detail>
        {m.description && (
          <Detail label={t('resources.keepers.columns.description')} tip={t('tips.resources.keepers.description')}>
            {m.description}
          </Detail>
        )}
      </div>

      <section className="panel" aria-label={t('views.keeperDetail.revisionTitle')} data-testid="keeper-current-revision">
        <h3 className="section-title" {...tip(t('tips.views.keeperDetail.revisionTitle'))}>
          {rev ? t('views.keeperDetail.revisionHeading', { number: rev.number }) : t('views.keeperDetail.revisionTitle')}
        </h3>
        {!rev ? (
          <EmptyNote>{t('views.keeperDetail.noRevision')}</EmptyNote>
        ) : (
          <>
            <RevisionText label={t('resources.keepers.fields.objective')} tipText={t('tips.resources.keepers.objective')} value={rev.objective} testId="keeper-objective" />
            <RevisionText label={t('resources.keepers.fields.healthyDefinition')} tipText={t('tips.resources.keepers.healthyDefinition')} value={rev.healthyDefinition} />
            <RevisionText label={t('resources.keepers.fields.autonomy')} tipText={t('tips.resources.keepers.autonomy')} value={rev.autonomy} />
            <RevisionText label={t('resources.keepers.fields.escalationPolicy')} tipText={t('tips.resources.keepers.escalationPolicy')} value={rev.escalationPolicy} />
            <RevisionText label={t('resources.keepers.fields.direction')} tipText={t('tips.resources.keepers.direction')} value={rev.direction} />
            {(rev.signals || []).length > 0 && (
              <div className="keeper-revision-block">
                <div className="detail-item-label" {...tip(t('tips.resources.keepers.signals'))}>
                  {t('resources.keepers.fields.signals')}
                </div>
                <ul className="plain-list" data-testid="keeper-signals">
                  {rev.signals.map((s) => (
                    <li key={s.name}>
                      <strong>{s.name}</strong>
                      {s.description ? <span className="text-muted">{` ${s.description}`}</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="detail-grid keeper-revision-numbers" data-tour="keeper-limits">
              <Detail label={t('resources.keepers.fields.wakeMode')} tip={t('tips.resources.keepers.wakeMode')}>
                <span {...tip(enumTip(t, 'wakeMode', rev.wakeMode))}>{enumLabel(t, 'wakeMode', rev.wakeMode)}</span>
              </Detail>
              <Detail label={t('views.keeperDetail.minInterval')} tip={t('tips.resources.keepers.minIntervalSeconds')}>{formatInterval(t, rev.minIntervalSeconds)}</Detail>
              {rev.wakeMode !== 'Fixed' && <Detail label={t('views.keeperDetail.maxInterval')} tip={t('tips.resources.keepers.maxIntervalSeconds')}>{formatInterval(t, rev.maxIntervalSeconds)}</Detail>}
              {rev.wakeMode !== 'Fixed' && <Detail label={t('resources.keepers.fields.backoffFactor')} tip={t('tips.resources.keepers.backoffFactor')}>{formatNumber(rev.backoffFactor ?? 2, { maximumFractionDigits: 2 }, lng)}</Detail>}
              <Detail label={t('resources.keepers.fields.jitterPercent')} tip={t('tips.resources.keepers.jitterPercent')}>{rev.jitterPercent === null || rev.jitterPercent === undefined ? t('views.keeperDetail.clusterDefault') : `${formatNumber(rev.jitterPercent, {}, lng)}%`}</Detail>
              <Detail label={t('resources.keepers.fields.budgetPerTickUsd')} tip={t('tips.resources.keepers.budgetPerTickUsd')}>{rev.budgetPerTickUsd == null ? t('views.keeperDetail.noLimit') : usd(rev.budgetPerTickUsd)}</Detail>
              <Detail label={t('resources.keepers.fields.budgetPerDayUsd')} tip={t('tips.resources.keepers.budgetPerDayUsd')}>{rev.budgetPerDayUsd == null ? t('views.keeperDetail.noLimit') : usd(rev.budgetPerDayUsd)}</Detail>
              <Detail label={t('resources.keepers.fields.maxTokensPerTick')} tip={t('tips.resources.keepers.maxTokensPerTick')}>{rev.maxTokensPerTick == null ? t('views.keeperDetail.noLimit') : formatNumber(rev.maxTokensPerTick, {}, lng)}</Detail>
            </div>
          </>
        )}
      </section>

      <section className="panel" aria-label={t('views.keeperDetail.ticks')} data-testid="keeper-ticks" data-tour="keeper-ticks">
        <div className="flex gap-sm items-center keeper-section-head">
          <h3 className="section-title" {...tip(t('tips.views.keeperDetail.ticks'))}>
            {t('views.keeperDetail.ticks')}
          </h3>
          <label className="filter-text" {...tip(t('tips.views.keeperDetail.outcomeFilter'))}>
            <span className="sr-only">{t('views.keeperDetail.outcomeFilter')}</span>
            <select
              value={tickOutcome}
              aria-label={t('views.keeperDetail.outcomeFilter')}
              data-testid="keeper-ticks-outcome"
              onChange={(e) => {
                setTickPage(1);
                setTickOutcome(e.target.value);
              }}
            >
              <option value="">{t('views.keeperDetail.allOutcomes')}</option>
              {ENUMS.tickOutcome.map((o) => (
                <option key={o} value={o}>
                  {enumLabel(t, 'tickOutcome', o)}
                </option>
              ))}
            </select>
          </label>
        </div>
        {ticks.items.length === 0 ? (
          <EmptyState title={t('views.keeperDetail.noTicksTitle')} body={t(m.status === 'Active' ? 'views.keeperDetail.noTicksActive' : 'views.keeperDetail.noTicksBody')} />
        ) : (
          <>
            <div className="inline-meta keeper-outcome-counts" data-testid="keeper-outcome-counts" {...tip(t('tips.views.keeperDetail.outcomeCounts'))}>
              {counts.map((c) => (
                <span key={c.outcome} className="inline-meta">
                  <TickOutcomeBadge outcome={c.outcome} t={t} /> {formatNumber(c.count, {}, lng)}
                </span>
              ))}
            </div>
            {series.times.length > 1 && (
              <TimeSeriesChart
                id="keeper-intervals"
                testId="keeper-interval-chart"
                title={t('views.keeperDetail.chartTitle')}
                help={t('views.keeperDetail.chartHelp')}
                titleTip={t('tips.views.keeperDetail.chart')}
                kind="line"
                times={series.times}
                series={[{ key: 'interval', label: t('views.keeperDetail.chartSeries'), color: 'var(--series-1)', values: series.intervals }]}
                format={(v) => formatNumber(v, { maximumFractionDigits: 1 }, lng)}
                exportInfo={{ name: `keeper-${m.name}-intervals`, lines: [], unit: 'min', filters: { outcome: tickOutcome || null } }}
              />
            )}
            <TableFrame
              tableId="keeper-ticks"
              testId="keeper-ticks-table"
              rowProps={(x) => ({ 'data-tick': x.id, 'data-outcome': x.outcome || '' })}
              compact
              items={ticks.items}
              totalRecords={ticks.totalCount}
              pageNumber={tickPage}
              pageSize={tickPageSize}
              onPageChange={setTickPage}
              onPageSizeChange={(size) => {
                setTickPageSize(size);
                setTickPage(1);
              }}
              onRefresh={loadTicks}
              columns={[
                { key: 'started', label: t('views.keeperDetail.columns.started'), tip: t('tips.views.keeperDetail.columns.started'), cellClass: 'nowrap', render: (x) => when(x.startedUtc) },
                { key: 'source', label: t('views.keeperDetail.columns.source'), tip: t('tips.views.keeperDetail.columns.source'), render: (x) => <span {...tip(enumTip(t, 'wakeSource', x.wakeSource))}>{enumLabel(t, 'wakeSource', x.wakeSource)}</span> },
                { key: 'outcome', label: t('views.keeperDetail.columns.outcome'), tip: t('tips.views.keeperDetail.columns.outcome'), render: (x) => (x.finishedUtc || x.outcome ? <TickOutcomeBadge outcome={x.outcome} t={t} /> : <Badge tone="info" tip={t('tips.resources.keepers.ticking')}>{t('resources.keepers.ticking')}</Badge>) },
                { key: 'run', label: t('views.keeperDetail.columns.run'), tip: t('tips.views.keeperDetail.columns.run'), cellClass: 'cell-id', render: (x) => (x.runId ? <span className="inline-meta">{runLink(x.runId, `keeper-tick-run-${x.id}`)} <OpenTrailLink runId={x.runId} step={x.id} testId={`keeper-tick-trail-${x.id}`} /></span> : '-') },
                {
                  key: 'interval',
                  label: t('views.keeperDetail.columns.interval'),
                  tip: t('tips.views.keeperDetail.columns.interval'),
                  cellClass: 'nowrap',
                  render: (x) => (
                    <>
                      {formatInterval(t, x.appliedIntervalSeconds)}
                      {x.requestedNextWakeSeconds ? <span className="text-muted" {...tip(t('tips.views.keeperDetail.requested'))}>{` (${t('views.keeperDetail.requested', { interval: formatInterval(t, x.requestedNextWakeSeconds) })})`}</span> : null}
                    </>
                  )
                },
                { key: 'cost', label: t('views.keeperDetail.columns.cost'), tip: t('tips.views.keeperDetail.columns.cost'), headerClass: 'right', cellClass: 'right', render: (x) => usd(x.costUsd) },
                {
                  key: 'summary',
                  label: t('views.keeperDetail.columns.summary'),
                  tip: t('tips.views.keeperDetail.columns.summary'),
                  cellClass: 'keeper-tick-summary',
                  render: (x) => (
                    <>
                      {x.summary ? <span {...tip(x.summary)}>{x.summary.length > 160 ? `${x.summary.slice(0, 160)}...` : x.summary}</span> : null}
                      {x.errorMessage ? <span className="text-danger" {...tip(x.errorCode || '')}>{x.errorMessage}</span> : null}
                      {!x.summary && !x.errorMessage ? '-' : null}
                    </>
                  )
                }
              ]}
            />
          </>
        )}
      </section>

      <section className="panel" aria-label={t('views.keeperDetail.revisions')} data-testid="keeper-revisions" data-tour="keeper-revisions">
        <h3 className="section-title" {...tip(t('tips.views.keeperDetail.revisions'))}>
          {t('views.keeperDetail.revisions')}
        </h3>
        {revisions.length === 0 ? (
          <EmptyNote>{t('views.keeperDetail.noRevisions')}</EmptyNote>
        ) : (
          <LocalTableFrame
            tableId="keeper-revisions"
            testId="keeper-revisions-table"
            compact
            items={revisions}
            rowProps={(r) => ({ 'data-revision': r.number })}
            columns={[
              {
                key: 'number',
                label: t('views.keeperDetail.columns.number'),
                tip: t('tips.views.keeperDetail.columns.number'),
                headerClass: 'right',
                cellClass: 'right nowrap',
                render: (r) => (
                  <>
                    {formatNumber(r.number, {}, lng)}
                    {r.id === m.currentRevisionId && (
                      <>
                        {' '}
                        <Badge tone="success" tip={t('tips.views.keeperDetail.current')}>{t('views.keeperDetail.current')}</Badge>
                      </>
                    )}
                  </>
                )
              },
              { key: 'state', label: t('views.keeperDetail.columns.state'), tip: t('tips.views.keeperDetail.columns.state'), render: (r) => <span {...tip(enumTip(t, 'mandateRevisionState', r.state))}>{enumLabel(t, 'mandateRevisionState', r.state)}</span> },
              { key: 'source', label: t('views.keeperDetail.columns.revisionSource'), tip: t('tips.views.keeperDetail.columns.revisionSource'), render: (r) => <span {...tip(enumTip(t, 'mandateRevisionSource', r.source))}>{enumLabel(t, 'mandateRevisionSource', r.source)}</span> },
              { key: 'author', label: t('views.keeperDetail.columns.author'), tip: t('tips.views.keeperDetail.columns.author'), render: (r) => r.author || '-' },
              { key: 'changeNote', label: t('views.keeperDetail.columns.changeNote'), tip: t('tips.views.keeperDetail.columns.changeNote'), render: (r) => (r.changeNote ? <span {...tip(r.changeNote)}>{r.changeNote.length > 80 ? `${r.changeNote.slice(0, 80)}...` : r.changeNote}</span> : '-') },
              { key: 'created', label: t('views.keeperDetail.columns.created'), tip: t('tips.views.keeperDetail.columns.created'), cellClass: 'nowrap', render: (r) => when(r.createdUtc) },
              {
                key: 'actions',
                label: t('common.generic.actions'),
                tip: t('tips.table.actionsColumn'),
                headerClass: 'right',
                cellClass: 'right nowrap',
                render: (r) => (
                  <>
                    <button type="button" className="button-ghost button-sm" onClick={() => setDiffOf(r)} data-testid={`keeper-revision-diff-${r.number}`} {...tip(t('tips.views.keeperDetail.diff'))}>
                      {t('views.keeperDetail.diff')}
                    </button>
                    {r.state === 'Draft' &&
                      (() => {
                        // A draft that says the same as the current revision cannot be published (409 RevisionUnchanged).
                        const blocked = deniedUpdate || (sameRevisionContent(r, m.currentRevision) ? t('tips.keeperRevision.unchanged') : '');
                        return (
                          <button type="button" className="button-secondary button-sm" disabled={busy} onClick={() => !blocked && publish(r)} data-testid={`keeper-revision-publish-${r.number}`} {...deniedProps(blocked)} {...tip(blocked || t('tips.keeperRevision.publish'))}>
                            {t('components.keeperRevision.publish')}
                          </button>
                        );
                      })()}
                  </>
                )
              }
            ]}
          />
        )}
      </section>

      <ConfirmModal
        open={confirm === 'delete'}
        danger
        title={t('resources.keepers.deleteTitle')}
        message={t('views.keeperDetail.confirmDelete', { name: m.name })}
        confirmLabel={t('common.actions.delete')}
        confirmTip={t('tips.views.keeperDetail.delete')}
        onConfirm={() => remove(false)}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmModal
        open={confirm === 'forceDelete'}
        danger
        title={t('resources.keepers.deleteTitle')}
        message={t('views.keeperDetail.confirmForceDelete', { name: m.name })}
        confirmLabel={t('views.keeperDetail.forceDelete')}
        confirmTip={t('tips.views.keeperDetail.forceDelete')}
        onConfirm={() => remove(true)}
        onCancel={() => setConfirm(null)}
      />
      {revisionOpen && (
        <KeeperRevisionModal
          mandate={m}
          onClose={() => setRevisionOpen(false)}
          onSaved={() => {
            reloadAll();
          }}
        />
      )}
      {diffOf && (
        <Modal open size="large" onClose={() => setDiffOf(null)} title={t('views.keeperDetail.diffTitle', { number: diffOf.number })}>
          {diffOf.changeNote && <p data-testid="keeper-diff-note">{t('views.keeperDetail.changeNote', { note: diffOf.changeNote })}</p>}
          {diffPrev ? null : <p className="text-muted">{t('views.keeperDetail.diffFirst')}</p>}
          <DiffViewer
            before={revisionText(diffPrev, t)}
            after={revisionText(diffOf, t)}
            beforeLabel={diffPrev ? t('views.keeperDetail.revisionLabel', { number: diffPrev.number }) : t('views.keeperDetail.nothing')}
            afterLabel={t('views.keeperDetail.revisionLabel', { number: diffOf.number })}
          />
        </Modal>
      )}
      <JsonViewerModal open={jsonOpen} value={m} onClose={() => setJsonOpen(false)} />
    </div>
  );
}
