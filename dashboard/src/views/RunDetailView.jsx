import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import RunTimeline from '../components/RunTimeline';
import ArtifactsView from './ArtifactsView';
import CodeBlock from '../components/CodeBlock';
import MarkdownView from '../components/MarkdownView';
import CopyableId from '../components/CopyableId';
import ConfirmModal from '../components/ConfirmModal';
import JsonViewerModal from '../components/JsonViewerModal';
import Tabs from '../components/Tabs';
import { LoadingState, ErrorBanner, EmptyState } from '../components/States';
import { StopIcon, RetryIcon, CodeIcon } from '../components/Icons';
import { RunStatus, TurnSession } from './runConfigs';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { TERMINAL_RUN_STATUSES, ENUMS } from '../utils/constants';
import { pathFor } from '../config/navConfig';
import { errorMessage } from '../utils/errors';
import { formatDateTime, formatNumber } from '../i18n/formatters';
import { runTelemetry, formatMs, formatUsd } from '../utils/telemetry';
import RunTelemetryPanel from '../components/RunTelemetryPanel';
import ExportMenu from '../components/ExportMenu';
import { exportFileName, toCsv } from '../utils/exporters';
import { tip } from '../components/Tooltip';
import { BlockedBadge, BlockedRunNotice } from '../components/BlockedRun';
import { enumTip } from '../utils/tips';
import NamedId from '../components/NamedId';
import { translateServerText } from '../utils/serverText';
import { enumLabel } from '../utils/enums';
import GrafanaLink from '../components/GrafanaLink';
import { useGrafana } from '../hooks/useServerInfo';
import { traceUrl, logsUrl } from '../utils/grafana';
import RunGuardNotice from '../components/RunGuardNotice';
import { guardOutcome } from '../utils/runGuards';
import RunApprovals from '../components/RunApprovals';
import ApprovalDecideModal from '../components/ApprovalDecideModal';
import { AwaitingApprovalBadge } from '../components/ApprovalBadges';
import { errorDetail } from '../utils/errors';

function Detail({ label, tip: tipText, children }) {
  return (
    <div className="detail-item">
      <div className="detail-item-label" {...tip(tipText)}>
        {label}
      </div>
      <div className="detail-item-value">{children ?? '-'}</div>
    </div>
  );
}

/** The template versions a run was compiled with (M1-23), each linking to its template's page. */
function TemplateVersionLinks({ versions, t, navigate, list = false }) {
  const links = versions.map((v) => (
    <a
      key={`${v.templateId}-${v.version}`}
      href={pathFor('promptTemplates', v.templateId)}
      data-testid="run-template-link"
      {...tip(t('tips.views.runDetail.openTemplate', { name: v.templateName || v.templateId, version: v.version }))}
      onClick={(e) => {
        e.preventDefault();
        navigate(pathFor('promptTemplates', v.templateId));
      }}
    >
      <code>{v.templateName || v.templateId}</code> v{v.version}
    </a>
  ));
  if (list) return <ul className="plain-list">{links.map((l) => <li key={l.key}>{l}</li>)}</ul>;
  return <span className="template-version-links">{links}</span>;
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
  const [deployment, setDeployment] = useState(null);
  const [agentState, setAgentState] = useState(null);
  const [approvals, setApprovals] = useState([]);
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const [approvalsError, setApprovalsError] = useState(null);
  const [deciding, setDeciding] = useState(null);
  const lastSeq = useRef(0);
  const grafana = useGrafana();

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

  const pollEvents = useCallback(async () => {
    if (!apiClient || !recordId) return;
    try {
      // Page through every stored event; long runs can have more than one page.
      for (let page = 0; page < 200; page += 1) {
        const r = await apiClient.listRunEvents(tenantId, recordId, lastSeq.current, 500);
        appendEvents(r.items || []);
        if (!r.hasMore || !(r.items || []).length) break;
      }
    } catch {
      // Polling is best-effort; the next poll or the live stream catches up.
    }
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

  // Permission approvals of this run (P12.3), reloaded whenever the run's pending count or status changes.
  const loadApprovals = useCallback(() => {
    if (!apiClient || !recordId) return;
    setApprovalsLoading(true);
    apiClient
      .listApprovals(tenantId, { runId: recordId, pageNumber: 1, pageSize: 100 })
      .then((r) => {
        setApprovals(r.items || []);
        setApprovalsError(null);
      })
      .catch((e) => setApprovalsError(`${errorMessage(t, e)} ${errorDetail(t, e)}`.trim()))
      .finally(() => setApprovalsLoading(false));
  }, [apiClient, tenantId, recordId, t]);
  const pendingApprovals = run?.pendingApprovals ?? 0;
  const runStatus = run?.status;
  useEffect(() => {
    if (runStatus) loadApprovals();
  }, [loadApprovals, pendingApprovals, runStatus]);

  // Names for the deployment and agent (M1-20), and whether the agent still exists so Retry can explain itself (M1-22).
  const deploymentId = run?.deploymentId;
  const agentId = run?.agentId;
  useEffect(() => {
    if (!apiClient || !deploymentId) return;
    apiClient
      .getDeployment(tenantId, deploymentId)
      .then((d) => setDeployment({ name: d?.name, deleted: false }))
      .catch((e) => setDeployment({ name: null, deleted: e?.status === 404 }));
  }, [apiClient, tenantId, deploymentId]);
  useEffect(() => {
    if (!apiClient || !agentId) return;
    apiClient
      .getAgent(tenantId, agentId)
      .then((a) => setAgentState({ exists: true, name: a?.name }))
      .catch((e) => setAgentState({ exists: e?.status !== 404 }));
  }, [apiClient, tenantId, agentId]);
  const agentMissing = agentState?.exists === false;
  // The server refuses to retry a run whose agent or deployment was deleted (409 AgentDeleted, DeploymentDeleted).
  const retryBlocked = agentMissing ? t('views.runDetail.agentDeleted', { agent: run?.agentName }) : deployment?.deleted ? t('views.runDetail.deploymentDeleted', { agent: run?.agentName }) : null;

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
  const tel = runTelemetry(run);
  const na = t('common.generic.notAvailable');

  return (
    <div>
      <PageHeader
        title={t('views.runDetail.titleWithAgent', { agent: run.agentName })}
        subtitle={
          <span className="inline-meta">
            <CopyableId value={run.id} max={40} /> <RunStatus status={run.status} t={t} /> <BlockedBadge run={run} t={t} /> <AwaitingApprovalBadge run={run} t={t} /> {live && <span className="pill pill-info" {...tip(t('tips.views.runDetail.live'))}>{t('topbar.live')}</span>}
          </span>
        }
        actions={
          <>
            <GrafanaLink size="md" href={traceUrl(grafana, run)} label={t('views.runDetail.viewTrace')} tipText={t('tips.views.runDetail.viewTrace')} testId="run-view-trace" />
            <GrafanaLink size="md" href={logsUrl(grafana, run)} label={t('views.runDetail.viewLogs')} tipText={t('tips.views.runDetail.viewLogs')} testId="run-view-logs" />
            <button type="button" className="button-secondary" onClick={() => setJsonOpen(true)} {...tip(t('tips.views.runDetail.viewJson'))}>
              <CodeIcon /> {t('common.actions.viewJson')}
            </button>
            {!terminal && (
              <button type="button" className="button-danger" onClick={() => setConfirmCancel(true)} {...tip(t('tips.resources.runs.actions.cancel'))}>
                <StopIcon size={14} /> {t('resources.runs.actions.cancel')}
              </button>
            )}
            {terminal && (
              <button type="button" className="button-secondary" onClick={retry} disabled={!!retryBlocked} data-testid="run-retry" {...tip(retryBlocked || t('tips.resources.runs.actions.retry'))}>
                <RetryIcon size={14} /> {t('resources.runs.actions.retry')}
              </button>
            )}
          </>
        }
      />

      <BlockedRunNotice run={run} />
      {run.executor === 'Process' && <div className="warning-banner" role="status" data-testid="process-trusted-only">{t('processSecurity.trustedOnly')}</div>}
      {run.awaitingApproval && (
        <div className="warning-banner" role="status" data-testid="awaiting-approval">
          <span>{t('views.runDetail.awaitingApproval', { count: run.pendingApprovals || 1 })}</span>
          <button type="button" className="button-secondary button-sm" onClick={() => setTab('approvals')} {...tip(t('tips.views.runDetail.reviewApprovals'))}>
            {t('views.runDetail.reviewApprovals')}
          </button>
        </div>
      )}
      <RunGuardNotice run={run} detailed deploymentName={run.deploymentName || deployment?.name || null} />
      {retryBlocked && terminal && (
        <div className="info-banner" role="note" data-testid="agent-deleted">
          {retryBlocked}
        </div>
      )}

      <div className="panel detail-grid run-summary">
        <Detail label={t('resources.runs.columns.outcome')} tip={t('tips.resources.runs.outcome')}>
          {run.outcome && run.outcome !== 'None' ? <span {...tip(enumTip(t, 'runOutcome', run.outcome))}>{t(`enums.runOutcome.${run.outcome}`, { defaultValue: run.outcome })}</span> : '-'}
        </Detail>
        <Detail label={t('resources.runs.columns.harnessType')} tip={t('tips.resources.runs.harnessType')}>{enumLabel(t, 'harnessType', run.harnessType)}</Detail>
        <Detail label={t('resources.runs.columns.leaseNodeName')} tip={t('tips.resources.runs.leaseNodeName')}>{run.leaseNodeName}</Detail>
        <Detail label={t('views.runDetail.deployment')} tip={t('tips.views.runDetail.deployment')}>
          {run.deploymentId ? <NamedId id={run.deploymentId} name={run.deploymentName || deployment?.name || (deployment?.deleted ? run.deploymentId : null)} deleted={!!deployment?.deleted} /> : '-'}
        </Detail>
        <Detail label={t('views.runDetail.templatesUsed')} tip={t('tips.views.runDetail.templatesUsed')}>
          {(run.templateVersions || []).length ? <TemplateVersionLinks versions={run.templateVersions} t={t} navigate={navigate} /> : '-'}
        </Detail>
        <Detail label={t('views.runDetail.model')} tip={t('tips.views.runDetail.model')}>{run.servedModel || '-'}</Detail>
        <Detail label={t('resources.runs.columns.executionMs')} tip={t('tips.telemetry.executionMs')}>{formatMs(tel.executionMs, i18n.language, na)}</Detail>
        <Detail label={t('views.runDetail.tokensLabel')} tip={t('tips.views.runDetail.tokens')}>{t('views.runDetail.tokens', { input: formatNumber(run.inputTokens || 0), output: formatNumber(run.outputTokens || 0) })}</Detail>
        <Detail label={t('resources.runs.columns.costUsd')} tip={t('tips.telemetry.costUsd')}>{`${formatUsd(tel.costUsd, i18n.language, na)}${tel.costUsd !== null && run.costEstimated ? ` (${t('views.runDetail.estimated')})` : ''}`}</Detail>
        <Detail label={t('views.runDetail.caller')} tip={t('tips.views.runDetail.caller')}>{run.callerName || run.callerId}</Detail>
        <Detail label={t('resources.runs.columns.depth')} tip={t('tips.resources.runs.depth')}>{run.depth ?? 0}</Detail>
        <Detail label={t('views.runDetail.parent')} tip={t('tips.views.runDetail.parent')}>
          {run.parentRunId ? (
            <a
              href={pathFor('runs', run.parentRunId)}
              {...tip(t('tips.views.runDetail.openParent'))}
              onClick={(e) => {
                e.preventDefault();
                navigate(pathFor('runs', run.parentRunId));
              }}
            >
              {run.parentRunId}
            </a>
          ) : (
            '-'
          )}
        </Detail>
        {run.conversationId && (
          <>
            <Detail label={t('views.runDetail.conversation')} tip={t('tips.views.runDetail.conversation')}>
              <span className="inline-meta">
                <a
                  href={pathFor('conversations', run.conversationId)}
                  data-testid="run-conversation-link"
                  {...tip(t('tips.views.runDetail.openConversation'))}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(pathFor('conversations', run.conversationId));
                  }}
                >
                  <code>{run.conversationId}</code>
                </a>
                <span className="text-muted">{t('resources.runs.turn', { turn: formatNumber(run.conversationTurn ?? 0) })}</span>
              </span>
            </Detail>
            <Detail label={t('views.runDetail.conversationSession')} tip={t('tips.views.runDetail.conversationSession')}>
              <TurnSession run={run} t={t} />
            </Detail>
            {run.resumeSessionId && (
              <Detail label={t('views.runDetail.resumeSessionId')} tip={t('tips.views.runDetail.resumeSessionId')}>
                <CopyableId value={run.resumeSessionId} max={40} />
              </Detail>
            )}
            {run.affinityNodeId && (
              <Detail label={t('views.runDetail.affinityNode')} tip={t('tips.views.runDetail.affinityNode')}>
                <span className="inline-meta">
                  <CopyableId value={run.affinityNodeId} max={30} />
                  {run.affinityUntilUtc && <span className="text-muted">{t('views.runDetail.affinityUntil', { time: formatDateTime(run.affinityUntilUtc, i18n.language) })}</span>}
                </span>
              </Detail>
            )}
          </>
        )}
        {run.pipelineRunId && (
          <Detail label={t('views.runDetail.pipelineRun')} tip={t('tips.views.runDetail.pipelineRun')}>
            <span className="inline-meta">
              <a
                href={pathFor('pipelineRuns', run.pipelineRunId)}
                data-testid="run-pipeline-link"
                {...tip(t('tips.views.runDetail.openPipelineRun'))}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(pathFor('pipelineRuns', run.pipelineRunId));
                }}
              >
                <code>{run.pipelineRunId}</code>
              </a>
              <span className="text-muted">{t('resources.runs.pipelineStage', { position: run.pipelinePosition ?? 0, execution: run.pipelineExecution ?? 0 })}</span>
            </span>
          </Detail>
        )}
        <Detail label={t('views.runDetail.attempt')} tip={t('tips.views.runDetail.attempt')}>{`${run.attempt ?? 1} / ${run.maxAttempts ?? 1}`}</Detail>
        {run.outputSchemaValid != null && (
          <Detail label={t('views.runDetail.outputSchema')} tip={t('tips.views.runDetail.outputSchema')}>
            {t(`views.runDetail.outputSchemaStates.${run.outputSchemaValid ? 'valid' : 'invalid'}${run.repairAttempts > 0 ? 'AfterRepair' : ''}`)}
          </Detail>
        )}
        <Detail label={t('resources.runs.columns.createdUtc')} tip={t('tips.views.runDetail.created')}>{formatDateTime(run.createdUtc, i18n.language)}</Detail>
        <Detail label={t('views.runDetail.started')} tip={t('tips.views.runDetail.started')}>{run.startedUtc ? formatDateTime(run.startedUtc, i18n.language) : '-'}</Detail>
        <Detail label={t('views.runDetail.completed')} tip={t('tips.views.runDetail.completed')}>{run.completedUtc ? formatDateTime(run.completedUtc, i18n.language) : '-'}</Detail>
        <Detail label={t('views.runDetail.exitCode')} tip={t('tips.views.runDetail.exitCode')}>{run.exitCode}</Detail>
        <Detail label={t('views.runDetail.traceId')} tip={t('tips.views.runDetail.traceId')}>{run.traceId ? <span data-testid="run-trace-id"><CopyableId value={run.traceId} max={40} /></span> : null}</Detail>
      </div>

      <RunTelemetryPanel run={run} />

      {run.errorMessage && !guardOutcome(run) && <div className="error-banner">{translateServerText(t, run.errorMessage)}</div>}

      <Tabs
        label={t('views.runDetail.title')}
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'artifacts', label: t('nav.items.artifacts.label'), tip: t('nav.items.artifacts.tip') },
          { id: 'transcript', label: t('views.runDetail.transcript'), tip: t('tips.views.runDetail.tabs.transcript') },
          { id: 'result', label: t('views.runDetail.result'), tip: t('tips.views.runDetail.tabs.result') },
          { id: 'input', label: t('views.runDetail.input'), tip: t('tips.views.runDetail.tabs.input') },
          { id: 'stderr', label: t('views.runDetail.stderr'), tip: t('tips.views.runDetail.tabs.stderr') },
          { id: 'children', label: t('views.runDetail.children', { count: children.length }), tip: t('tips.views.runDetail.tabs.children') },
          { id: 'approvals', label: t('views.runDetail.approvals', { count: approvals.length }), tip: t('tips.views.runDetail.tabs.approvals') }
        ]}
      />

      <div className="panel">
        {tab === 'artifacts' && <ArtifactsView runId={recordId} />}
        {tab === 'transcript' && (
          <>
            <div className="timeline-toolbar">
              <label className="filter-select" {...tip(t('tips.views.runDetail.eventFilter'))}>
                <span>{t('views.runDetail.eventFilter')}</span>
                <select value={filter} onChange={(e) => setFilter(e.target.value)} {...tip(t('tips.views.runDetail.eventFilter'))}>
                  <option value="all">{t('common.generic.all')}</option>
                  {ENUMS.runEventType.map((ty) => (
                    <option key={ty} value={ty}>
                      {t(`enums.runEventType.${ty}`, { defaultValue: ty })}
                    </option>
                  ))}
                </select>
              </label>
              <span className="text-muted">{t('views.runDetail.eventCount', { count: events.length })}</span>
              {events.length > 0 && (
                <ExportMenu
                  title={t('views.runDetail.transcript')}
                  testId="export-transcript"
                  fileName={(ext) => exportFileName('run-transcript', run.id, { filter: filter === 'all' ? '' : filter }, ext)}
                  csv={() =>
                    toCsv(
                      ['sequence', 'timestamp_utc', 'event_type', 'tool_name', 'success', 'input_tokens', 'output_tokens', 'text'],
                      events.filter((e) => filter === 'all' || e.eventType === filter).map((e) => [e.sequence, e.timestampUtc ? new Date(e.timestampUtc).toISOString() : null, e.eventType, e.toolName, e.success, e.inputTokens, e.outputTokens, e.text])
                    )
                  }
                  json={() => JSON.stringify({ runId: run.id, agent: run.agentName, filter, exportedUtc: new Date().toISOString(), events: events.filter((e) => filter === 'all' || e.eventType === filter) }, null, 2)}
                />
              )}
            </div>
            <RunTimeline events={events} filter={filter} />
          </>
        )}
        {tab === 'result' && (
          <div className="flex-col gap-md">
            <MarkdownView text={run.resultText} rawToggle testId="run-result" emptyText={terminal ? t('views.runDetail.noResult') : t('views.runDetail.pending')} />
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
                <TemplateVersionLinks versions={run.templateVersions} t={t} navigate={navigate} list />
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
                  <a href={pathFor('runs', c.id)} {...tip(t('tips.views.runDetail.openChild'))} onClick={(e) => { e.preventDefault(); navigate(pathFor('runs', c.id)); }}>
                    {c.agentName}
                  </a>{' '}
                  <RunStatus status={c.status} t={t} /> <code className="text-muted">{c.id}</code>
                </li>
              ))}
            </ul>
          ))}
        {tab === 'approvals' && <RunApprovals approvals={approvals} loading={approvalsLoading} error={approvalsError} onDecide={(approval, decision) => setDeciding({ approval, decision })} />}
      </div>

      {deciding && (
        <ApprovalDecideModal
          approval={deciding.approval}
          initialDecision={deciding.decision}
          onClose={() => setDeciding(null)}
          onDecided={() => {
            setDeciding(null);
            loadApprovals();
            loadRun();
          }}
        />
      )}
      <ConfirmModal open={confirmCancel} danger title={t('resources.runs.actions.cancel')} message={t('views.runDetail.confirmCancel')} confirmLabel={t('resources.runs.actions.cancel')} confirmTip={t('tips.resources.runs.actions.cancel')} onConfirm={cancel} onCancel={() => setConfirmCancel(false)} />
      <JsonViewerModal open={jsonOpen} value={run} onClose={() => setJsonOpen(false)} />
    </div>
  );
}
