import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import RunTimeline from '../components/RunTimeline';
import CodeBlock from '../components/CodeBlock';
import CopyableId from '../components/CopyableId';
import ConfirmModal from '../components/ConfirmModal';
import JsonViewerModal from '../components/JsonViewerModal';
import Tabs from '../components/Tabs';
import { LoadingState, ErrorBanner, EmptyState } from '../components/States';
import { StopIcon, RetryIcon, CodeIcon } from '../components/Icons';
import { RunStatus } from './runConfigs';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { TERMINAL_RUN_STATUSES, ENUMS } from '../utils/constants';
import { pathFor } from '../utils/routes';
import { errorMessage } from '../utils/errors';
import { formatDateTime, formatDuration, formatNumber, formatCurrency, elapsedMs } from '../i18n/formatters';

function Detail({ label, children }) {
  return (
    <div className="detail-item">
      <div className="detail-item-label">{label}</div>
      <div className="detail-item-value">{children ?? '-'}</div>
    </div>
  );
}

/** Run detail: live transcript (SSE with polling fallback), outcome, result, stderr, children, cancel and retry. */
export default function RunDetailView({ recordId }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [run, setRun] = useState(null);
  const [events, setEvents] = useState([]);
  const [children, setChildren] = useState([]);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('transcript');
  const [filter, setFilter] = useState('all');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [jsonOpen, setJsonOpen] = useState(false);
  const [live, setLive] = useState(false);
  const lastSeq = useRef(0);

  const loadRun = useCallback(() => {
    if (!apiClient || !recordId) return Promise.resolve(null);
    return apiClient
      .getRun(tenantId, recordId)
      .then((r) => {
        setRun(r);
        setError(null);
        return r;
      })
      .catch((e) => {
        setError(e);
        return null;
      });
  }, [apiClient, tenantId, recordId]);

  const appendEvents = useCallback((incoming) => {
    const list = (Array.isArray(incoming) ? incoming : [incoming]).filter((e) => e && typeof e === 'object' && e.sequence > lastSeq.current);
    if (list.length === 0) return;
    lastSeq.current = Math.max(lastSeq.current, ...list.map((e) => e.sequence));
    setEvents((prev) => [...prev, ...list].sort((a, b) => a.sequence - b.sequence));
  }, []);

  const pollEvents = useCallback(() => {
    if (!apiClient || !recordId) return Promise.resolve();
    return apiClient
      .listRunEvents(tenantId, recordId, lastSeq.current, 500)
      .then((r) => appendEvents(r.items || []))
      .catch(() => {});
  }, [apiClient, tenantId, recordId, appendEvents]);

  useEffect(() => {
    lastSeq.current = 0;
    setEvents([]);
    loadRun();
    pollEvents();
    apiClient
      ?.listRunChildren(tenantId, recordId)
      .then((r) => setChildren(r.items || []))
      .catch(() => setChildren([]));
  }, [apiClient, tenantId, recordId, loadRun, pollEvents]);

  const terminal = run && TERMINAL_RUN_STATUSES.includes(run.status);

  // Live stream while the run is active; fall back to polling when SSE is unavailable.
  useEffect(() => {
    if (!apiClient || !run || terminal) return undefined;
    let fallback = null;
    const controller = apiClient.streamRunEvents(
      tenantId,
      recordId,
      lastSeq.current,
      (data) => {
        setLive(true);
        appendEvents(data);
      },
      () => {
        setLive(false);
        fallback = setInterval(() => {
          pollEvents();
          loadRun();
        }, 2000);
      }
    );
    const statusTimer = setInterval(loadRun, 3000);
    return () => {
      controller.abort();
      clearInterval(statusTimer);
      if (fallback) clearInterval(fallback);
      setLive(false);
    };
  }, [apiClient, tenantId, recordId, run?.status, terminal, appendEvents, pollEvents, loadRun]); // eslint-disable-line react-hooks/exhaustive-deps

  const cancel = async () => {
    try {
      await apiClient.cancelRun(tenantId, recordId);
      addToast({ type: 'success', message: t('resources.runs.toasts.cancelRequested') });
      setConfirmCancel(false);
      loadRun();
    } catch (e) {
      addToast({ type: 'error', message: errorMessage(t, e) });
      setConfirmCancel(false);
    }
  };

  const retry = async () => {
    try {
      const next = await apiClient.retryRun(tenantId, recordId);
      addToast({ type: 'success', message: t('resources.runs.toasts.retried') });
      if (next?.id) navigate(pathFor('runs', next.id));
    } catch (e) {
      addToast({ type: 'error', message: errorMessage(t, e) });
    }
  };

  if (error && !run) {
    return (
      <div>
        <PageHeader title={t('views.runDetail.title')} />
        <ErrorBanner message={errorMessage(t, error)} onRetry={loadRun} />
        <EmptyState title={t('views.runDetail.notFoundTitle')} body={t('views.runDetail.notFoundBody')} />
      </div>
    );
  }
  if (!run) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title={t('views.runDetail.titleWithAgent', { agent: run.agentName })}
        subtitle={
          <span className="inline-meta">
            <CopyableId value={run.id} max={40} /> <RunStatus status={run.status} t={t} /> {live && <span className="pill pill-info">{t('topbar.live')}</span>}
          </span>
        }
        actions={
          <>
            <button type="button" className="button-secondary" onClick={() => setJsonOpen(true)}>
              <CodeIcon /> {t('common.actions.viewJson')}
            </button>
            {!terminal && (
              <button type="button" className="button-danger" onClick={() => setConfirmCancel(true)}>
                <StopIcon size={14} /> {t('resources.runs.actions.cancel')}
              </button>
            )}
            {terminal && (
              <button type="button" className="button-secondary" onClick={retry}>
                <RetryIcon size={14} /> {t('resources.runs.actions.retry')}
              </button>
            )}
          </>
        }
      />

      <div className="panel detail-grid run-summary">
        <Detail label={t('resources.runs.columns.outcome')}>{run.outcome && run.outcome !== 'None' ? t(`enums.runOutcome.${run.outcome}`, { defaultValue: run.outcome }) : '-'}</Detail>
        <Detail label={t('resources.runs.columns.harnessType')}>{run.harnessType}</Detail>
        <Detail label={t('resources.runs.columns.leaseNodeName')}>{run.leaseNodeName}</Detail>
        <Detail label={t('views.runDetail.deployment')}>{run.deploymentId ? <CopyableId value={run.deploymentId} /> : '-'}</Detail>
        <Detail label={t('views.runDetail.model')}>{run.servedModel}</Detail>
        <Detail label={t('resources.runs.columns.duration')}>{run.startedUtc ? formatDuration(elapsedMs(run.startedUtc, run.completedUtc), i18n.language) : '-'}</Detail>
        <Detail label={t('views.runDetail.tokensLabel')}>{t('views.runDetail.tokens', { input: formatNumber(run.inputTokens || 0), output: formatNumber(run.outputTokens || 0) })}</Detail>
        <Detail label={t('resources.runs.columns.costUsd')}>{run.costUsd != null ? `${formatCurrency(run.costUsd, i18n.language)}${run.costEstimated ? ` (${t('views.runDetail.estimated')})` : ''}` : '-'}</Detail>
        <Detail label={t('views.runDetail.caller')}>{run.callerName || run.callerId}</Detail>
        <Detail label={t('resources.runs.columns.depth')}>{run.depth ?? 0}</Detail>
        <Detail label={t('views.runDetail.parent')}>{run.parentRunId ? <a href={pathFor('runs', run.parentRunId)} onClick={(e) => { e.preventDefault(); navigate(pathFor('runs', run.parentRunId)); }}>{run.parentRunId}</a> : '-'}</Detail>
        <Detail label={t('views.runDetail.attempt')}>{`${run.attempt ?? 1} / ${run.maxAttempts ?? 1}`}</Detail>
        <Detail label={t('resources.runs.columns.createdUtc')}>{formatDateTime(run.createdUtc, i18n.language)}</Detail>
        <Detail label={t('views.runDetail.started')}>{run.startedUtc ? formatDateTime(run.startedUtc, i18n.language) : '-'}</Detail>
        <Detail label={t('views.runDetail.completed')}>{run.completedUtc ? formatDateTime(run.completedUtc, i18n.language) : '-'}</Detail>
        <Detail label={t('views.runDetail.exitCode')}>{run.exitCode}</Detail>
      </div>

      {run.errorMessage && <div className="error-banner">{run.errorMessage}</div>}

      <Tabs
        label={t('views.runDetail.title')}
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'transcript', label: t('views.runDetail.transcript') },
          { id: 'result', label: t('views.runDetail.result') },
          { id: 'input', label: t('views.runDetail.input') },
          { id: 'stderr', label: t('views.runDetail.stderr') },
          { id: 'children', label: t('views.runDetail.children', { count: children.length }) }
        ]}
      />

      <div className="panel">
        {tab === 'transcript' && (
          <>
            <div className="timeline-toolbar">
              <label className="filter-select">
                <span>{t('views.runDetail.eventFilter')}</span>
                <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                  <option value="all">{t('common.generic.all')}</option>
                  {ENUMS.runEventType.map((ty) => (
                    <option key={ty} value={ty}>
                      {t(`enums.runEventType.${ty}`, { defaultValue: ty })}
                    </option>
                  ))}
                </select>
              </label>
              <span className="text-muted">{t('views.runDetail.eventCount', { count: events.length })}</span>
            </div>
            <RunTimeline events={events} filter={filter} />
          </>
        )}
        {tab === 'result' && (
          <div className="flex-col gap-md">
            <CodeBlock value={run.resultText} emptyText={terminal ? t('views.runDetail.noResult') : t('views.runDetail.pending')} />
            {run.structuredOutputJson && (
              <>
                <h3 className="section-title">{t('views.runDetail.structuredOutput')}</h3>
                <CodeBlock value={run.structuredOutputJson} prettyJson />
              </>
            )}
          </div>
        )}
        {tab === 'input' && (
          <div className="flex-col gap-md">
            <CodeBlock value={run.inputText} />
            {(run.parameters || []).length > 0 && <CodeBlock value={Object.fromEntries((run.parameters || []).map((p) => [p.name, p.value]))} prettyJson />}
            {(run.templateVersions || []).length > 0 && (
              <>
                <h3 className="section-title">{t('views.runDetail.templateVersions')}</h3>
                <ul className="plain-list">
                  {run.templateVersions.map((v) => (
                    <li key={v.templateId}>
                      <code>{v.templateName}</code> v{v.version}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
        {tab === 'stderr' && <CodeBlock value={run.stderrTail} emptyText={t('views.runDetail.noStderr')} />}
        {tab === 'children' &&
          (children.length === 0 ? (
            <div className="text-muted">{t('views.runDetail.noChildren')}</div>
          ) : (
            <ul className="plain-list">
              {children.map((c) => (
                <li key={c.id}>
                  <a href={pathFor('runs', c.id)} onClick={(e) => { e.preventDefault(); navigate(pathFor('runs', c.id)); }}>
                    {c.agentName}
                  </a>{' '}
                  <RunStatus status={c.status} t={t} /> <code className="text-muted">{c.id}</code>
                </li>
              ))}
            </ul>
          ))}
      </div>

      <ConfirmModal open={confirmCancel} danger title={t('resources.runs.actions.cancel')} message={t('views.runDetail.confirmCancel')} confirmLabel={t('resources.runs.actions.cancel')} onConfirm={cancel} onCancel={() => setConfirmCancel(false)} />
      <JsonViewerModal open={jsonOpen} value={run} onClose={() => setJsonOpen(false)} />
    </div>
  );
}
