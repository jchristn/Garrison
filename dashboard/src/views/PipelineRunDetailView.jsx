import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import CopyableId from '../components/CopyableId';
import ConfirmModal from '../components/ConfirmModal';
import JsonViewerModal from '../components/JsonViewerModal';
import Explainer from '../components/Explainer';
import PipelineReviewDecideModal from '../components/PipelineReviewDecideModal';
import { Badge } from '../components/StatusBadge';
import { LoadingState, ErrorBanner, EmptyState } from '../components/States';
import { StopIcon, RetryIcon, CodeIcon, TrashIcon } from '../components/Icons';
import { PipelineRunStatusBadge, PipelineRunOutcome, PipelineStageStatusBadge, PipelineReviewStatusBadge, PipelineReviewDecisionBadge } from '../components/PipelineBadges';
import { RunStatus } from './runConfigs';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { PIPELINE_RUN_POLL_MS } from '../utils/constants';
import { pathFor } from '../config/navConfig';
import { errorMessage } from '../utils/errors';
import { enumLabel } from '../utils/enums';
import { enumTip } from '../utils/tips';
import { textPreview } from '../utils/conversations';
import { formatDateTime, formatNumber, formatRelativeTime } from '../i18n/formatters';
import { pipelineTimeline, pendingReview, isTerminalPipelineRun, canCancelPipelineRun, canRetryPipelineRun } from '../utils/pipelines';
import { tip } from '../components/Tooltip';

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

/**
 * Live updates for one pipeline run over the WebSocket channel pipeline-run:{id} (P12.9). Calls onRun with each
 * pushed pipeline run (status, stages, stage run summaries, reviews) and returns whether the channel is subscribed;
 * while it is not, the page polls.
 */
function usePipelineRunChannel(apiClient, pipelineRunId, onRun) {
  const [live, setLive] = useState(false);
  const handler = useRef(onRun);
  useEffect(() => {
    handler.current = onRun;
  }, [onRun]);
  useEffect(() => {
    if (!apiClient || !pipelineRunId || typeof WebSocket === 'undefined' || typeof apiClient.webSocketUrl !== 'function') return undefined;
    const channel = `pipeline-run:${pipelineRunId}`;
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
          else if (message?.type === 'pipeline-run.status' && message.pipelineRun?.id === pipelineRunId) handler.current?.(message.pipelineRun);
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
  }, [apiClient, pipelineRunId]);
  return live;
}

/**
 * One pipeline run (P12.9): summary, the pending review with Approve, Request changes, and Reject, and the stage
 * timeline (each stage's status, executions, attempts, and revisions, its stage runs with links to Run detail, and its
 * reviews). Cancel, Retry, and Delete (finished runs only). Updates live over the pipeline-run channel, else polls.
 */
export default function PipelineRunDetailView({ recordId }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const lng = i18n.language;
  const [run, setRun] = useState(null);
  const [error, setError] = useState(null);
  const [jsonOpen, setJsonOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [deciding, setDeciding] = useState(null);
  const [busy, setBusy] = useState(false);
  const unmounted = useRef(false);

  useEffect(() => {
    unmounted.current = false;
    return () => {
      unmounted.current = true;
    };
  }, []);

  const load = useCallback(() => {
    if (!apiClient || !recordId) return Promise.resolve();
    return apiClient
      .getPipelineRun(tenantId, recordId)
      .then((r) => {
        if (unmounted.current) return;
        setRun(r);
        setError(null);
      })
      .catch((e) => !unmounted.current && setError(e));
  }, [apiClient, tenantId, recordId]);

  useEffect(() => {
    load();
  }, [load]);

  const live = usePipelineRunChannel(apiClient, recordId, useCallback((r) => !unmounted.current && setRun(r), []));
  const terminal = isTerminalPipelineRun(run);

  // Without the live channel, re-read the run while it is unfinished, like Run detail and Conversation detail do.
  useEffect(() => {
    if (!run || terminal || live) return undefined;
    const id = setInterval(load, PIPELINE_RUN_POLL_MS);
    return () => clearInterval(id);
  }, [run, terminal, live, load]);

  const perform = async (kind) => {
    setBusy(true);
    try {
      if (kind === 'cancel') {
        const next = await apiClient.cancelPipelineRun(tenantId, recordId);
        if (next && !unmounted.current) setRun((prev) => ({ ...prev, ...next, stages: next.stages?.length ? next.stages : prev?.stages, runs: next.runs?.length ? next.runs : prev?.runs, reviews: next.reviews?.length ? next.reviews : prev?.reviews }));
        addToast({ type: 'success', message: t('resources.pipelineRuns.toasts.cancelRequested') });
        load();
      } else if (kind === 'retry') {
        await apiClient.retryPipelineRun(tenantId, recordId);
        addToast({ type: 'success', message: t('resources.pipelineRuns.toasts.retried') });
        load();
      } else if (kind === 'delete') {
        await apiClient.deletePipelineRun(tenantId, recordId);
        addToast({ type: 'success', message: t('common.toasts.deleted') });
        navigate(pathFor('pipelineRuns'));
      }
    } catch (e) {
      addToast({ type: 'error', message: errorMessage(t, e) });
      load();
    } finally {
      if (!unmounted.current) {
        setBusy(false);
        setConfirm(null);
      }
    }
  };

  if (error && !run) {
    return (
      <div>
        <PageHeader title={t('views.pipelineRunDetail.title')} />
        <ErrorBanner message={errorMessage(t, error)} onRetry={load} />
        <EmptyState title={t('views.pipelineRunDetail.notFoundTitle')} body={t('views.pipelineRunDetail.notFoundBody')} />
      </div>
    );
  }
  if (!run) return <LoadingState />;

  const r = run;
  const when = (v) => (v ? <span {...tip(formatDateTime(v, lng))}>{formatRelativeTime(v, lng)}</span> : '-');
  const runLink = (id, testId) => (
    <PageLink to={pathFor('runs', id)} tipText={t('tips.views.pipelineRunDetail.openRun')} navigate={navigate} testId={testId}>
      <code>{id}</code>
    </PageLink>
  );
  const timeline = pipelineTimeline(r);
  const review = pendingReview(r);
  const reviewStage = review ? (r.stages || []).find((s) => s.id === review.runStageId) || null : null;
  const input = r.inputText ? (r.inputText.length > 4000 ? `${r.inputText.slice(0, 4000)}...` : r.inputText) : '';

  return (
    <div data-testid="pipeline-run-detail">
      <PageHeader
        title={t('views.pipelineRunDetail.heading', { pipeline: r.pipelineName })}
        subtitle={
          <span className="inline-meta">
            <CopyableId value={r.id} max={40} /> <PipelineRunStatusBadge status={r.status} t={t} />{' '}
            {live ? (
              <Badge tone="info" tip={t('tips.views.pipelineRunDetail.live')}>{t('views.pipelineRunDetail.live')}</Badge>
            ) : !terminal ? (
              <Badge tone="neutral" tip={t('tips.views.pipelineRunDetail.polling')}>{t('views.pipelineRunDetail.polling')}</Badge>
            ) : null}
          </span>
        }
        actions={
          <>
            <button type="button" className="button-secondary" onClick={() => setJsonOpen(true)} {...tip(t('tips.views.pipelineRunDetail.viewJson'))}>
              <CodeIcon /> {t('common.actions.viewJson')}
            </button>
            <button type="button" className="button-secondary" onClick={() => navigate(pathFor('runs', null, { pipelineRunId: r.id }))} data-testid="pipeline-run-stage-runs" {...tip(t('tips.resources.pipelineRuns.actions.stageRuns'))}>
              {t('resources.pipelineRuns.actions.stageRuns')}
            </button>
            {canCancelPipelineRun(r) && (
              <button type="button" className="button-secondary" disabled={busy} onClick={() => setConfirm('cancel')} data-testid="pipeline-run-cancel" {...tip(t('tips.resources.pipelineRuns.actions.cancel'))}>
                <StopIcon size={14} /> {t('resources.pipelineRuns.actions.cancel')}
              </button>
            )}
            {canRetryPipelineRun(r) && (
              <button type="button" className="button-secondary" disabled={busy} onClick={() => perform('retry')} data-testid="pipeline-run-retry" {...tip(t('tips.resources.pipelineRuns.actions.retry'))}>
                <RetryIcon size={14} /> {t('resources.pipelineRuns.actions.retry')}
              </button>
            )}
            {terminal && (
              <button type="button" className="button-danger" disabled={busy} onClick={() => setConfirm('delete')} data-testid="pipeline-run-delete" {...tip(t('tips.views.pipelineRunDetail.delete'))}>
                <TrashIcon size={14} /> {t('common.actions.delete')}
              </button>
            )}
          </>
        }
      />

      <Explainer topic="pipelineRuns" />

      <div className="panel detail-grid pipeline-run-summary">
        <Detail label={t('resources.pipelineRuns.columns.pipelineName')} tip={t('tips.views.pipelineRunDetail.pipeline')}>
          <PageLink to={pathFor('pipelines', null, { search: r.pipelineName })} tipText={t('tips.views.pipelineRunDetail.openPipeline')} navigate={navigate} testId="pipeline-run-pipeline">
            {r.pipelineName}
          </PageLink>{' '}
          <span className="text-muted" {...tip(t('tips.resources.pipelineRuns.pipelineVersion'))}>{t('resources.pipelineRuns.versionShort', { version: r.pipelineVersion ?? 1 })}</span>
        </Detail>
        <Detail label={t('resources.pipelineRuns.columns.outcome')} tip={t('tips.resources.pipelineRuns.outcome')}>
          <PipelineRunOutcome outcome={r.outcome} t={t} />
        </Detail>
        <Detail label={t('resources.pipelineRuns.columns.progress')} tip={t('tips.resources.pipelineRuns.progress')}>
          {t('resources.pipelineRuns.progressValue', { position: formatNumber(Math.min(r.currentPosition ?? 1, r.stageCount ?? 0), {}, lng), count: r.stageCount ?? 0 })}
        </Detail>
        <Detail label={t('resources.pipelineRuns.columns.callerName')} tip={t('tips.resources.pipelineRuns.callerName')}>
          {r.callerName || r.callerId ? `${r.callerName || r.callerId} (${enumLabel(t, 'principalType', r.callerType)})` : null}
        </Detail>
        <Detail label={t('resources.pipelineRuns.columns.priority')} tip={t('tips.resources.pipelineRuns.priority')}>{formatNumber(r.priority ?? 0, {}, lng)}</Detail>
        <Detail label={t('views.pipelineRunDetail.finalRun')} tip={t('tips.views.pipelineRunDetail.finalRun')}>{r.finalRunId ? runLink(r.finalRunId, 'pipeline-run-final') : null}</Detail>
        <Detail label={t('resources.pipelineRuns.columns.deadlineUtc')} tip={t('tips.resources.pipelineRuns.deadlineUtc')}>{r.deadlineUtc ? when(r.deadlineUtc) : t('resources.pipelines.noLimit')}</Detail>
        <Detail label={t('views.pipelineRunDetail.started')} tip={t('tips.views.pipelineRunDetail.started')}>{r.startedUtc ? formatDateTime(r.startedUtc, lng) : '-'}</Detail>
        <Detail label={t('resources.pipelineRuns.columns.completedUtc')} tip={t('tips.resources.pipelineRuns.completedUtc')}>{r.completedUtc ? formatDateTime(r.completedUtc, lng) : '-'}</Detail>
        <Detail label={t('resources.pipelineRuns.columns.createdUtc')} tip={t('tips.resources.pipelineRuns.createdUtc')}>{formatDateTime(r.createdUtc, lng)}</Detail>
        {r.errorMessage && (
          <Detail label={t('resources.pipelineRuns.columns.errorMessage')} tip={t('tips.resources.pipelineRuns.errorMessage')}>
            <span className="text-danger">{r.errorMessage}</span>
          </Detail>
        )}
      </div>

      <section className="panel" aria-label={t('views.pipelineRunDetail.input')}>
        <h3 className="section-title" {...tip(t('tips.views.pipelineRunDetail.input'))}>
          {t('views.pipelineRunDetail.input')}
        </h3>
        {input ? <pre className="monospace pipeline-input" data-testid="pipeline-run-input">{input}</pre> : <div className="text-muted">-</div>}
      </section>

      {review && (
        <section className="panel pipeline-review-panel" aria-label={t('views.pipelineRunDetail.reviewTitle')} data-testid="pipeline-review-panel">
          <h3 className="section-title" {...tip(t('tips.views.pipelineRunDetail.reviewTitle'))}>
            {t('views.pipelineRunDetail.reviewTitle')}
          </h3>
          <p>
            {t('views.pipelineRunDetail.reviewBody', { position: review.position, stage: review.stageName, execution: review.execution })}{' '}
            {runLink(review.runId, 'pipeline-review-run')}
          </p>
          <p className="text-muted">
            {review.expiresUtc
              ? t('views.pipelineRunDetail.reviewExpires', { time: formatDateTime(review.expiresUtc, lng), decision: enumLabel(t, 'pipelineReviewDecision', review.timeoutAction || 'Reject') })
              : t('views.pipelineRunDetail.reviewNoTimeout')}
          </p>
          <div className="flex gap-sm items-center">
            <button type="button" className="button-primary" onClick={() => setDeciding({ review, decision: 'Approve' })} data-testid="pipeline-review-approve" {...tip(t('tips.resources.pipelineReviews.actions.approve'))}>
              {t('resources.pipelineReviews.actions.approve')}
            </button>
            <button type="button" className="button-secondary" onClick={() => setDeciding({ review, decision: 'RequestChanges' })} data-testid="pipeline-review-request-changes" {...tip(t('tips.resources.pipelineReviews.actions.requestChanges'))}>
              {t('resources.pipelineReviews.actions.requestChanges')}
            </button>
            <button type="button" className="button-danger" onClick={() => setDeciding({ review, decision: 'Reject' })} data-testid="pipeline-review-reject" {...tip(t('tips.resources.pipelineReviews.actions.reject'))}>
              {t('resources.pipelineReviews.actions.reject')}
            </button>
          </div>
        </section>
      )}

      <section className="panel" aria-label={t('views.pipelineRunDetail.stages')}>
        <h3 className="section-title" {...tip(t('tips.views.pipelineRunDetail.stages'))}>
          {t('views.pipelineRunDetail.stagesCount', { count: timeline.length })}
        </h3>
        {timeline.length === 0 ? (
          <div className="text-muted">{t('views.pipelineRunDetail.noStages')}</div>
        ) : (
          <ol className="pipeline-timeline" data-testid="pipeline-timeline">
            {timeline.map(({ stage, runs, reviews, current }) => (
              <li key={stage.id || stage.position} className={`pipeline-timeline-stage ${current ? 'is-current' : ''}`} data-stage={stage.position} data-status={stage.status}>
                <div className="pipeline-timeline-head inline-meta">
                  <strong>{t('resources.pipelines.stageHeading', { position: stage.position, name: stage.name })}</strong>
                  <PipelineStageStatusBadge status={stage.status} t={t} />
                  {current && <Badge tone="info" tip={t('tips.views.pipelineRunDetail.current')}>{t('views.pipelineRunDetail.current')}</Badge>}
                  {stage.requiresReview && <Badge tone="warning" tip={t('tips.views.pipelineRunDetail.reviewGate')}>{t('views.pipelineRunDetail.reviewGate')}</Badge>}
                  {stage.continueOnFailure && <Badge tip={t('tips.resources.pipelines.stagesItems.continueOnFailure')}>{t('resources.pipelines.fields.continueOnFailure')}</Badge>}
                </div>
                <div className="pipeline-timeline-meta text-muted">
                  <span {...tip(t('tips.views.pipelineRunDetail.agent'))}>{t('views.pipelineRunDetail.agent', { agent: stage.agentName || stage.agentId })}</span>
                  {' · '}
                  <span {...tip(t('tips.views.pipelineRunDetail.counts'))} data-testid={`stage-${stage.position}-counts`}>
                    {t('views.pipelineRunDetail.counts', {
                      executions: formatNumber(stage.executions ?? 0, {}, lng),
                      attempts: formatNumber(stage.attempts ?? 0, {}, lng),
                      maxAttempts: formatNumber(stage.maxAttempts ?? 1, {}, lng),
                      revisions: formatNumber(stage.revisions ?? 0, {}, lng),
                      maxRevisions: formatNumber(stage.requiresReview ? stage.maxRevisions ?? 0 : 0, {}, lng)
                    })}
                  </span>
                  {stage.startedUtc && (
                    <>
                      {' · '}
                      {t('views.pipelineRunDetail.startedAt')} {when(stage.startedUtc)}
                    </>
                  )}
                </div>
                {stage.blockedReason && (
                  <div className="info-banner" role="status" data-testid={`stage-${stage.position}-blocked`}>
                    {t('views.pipelineRunDetail.blocked', { reason: stage.blockedReason })} {stage.nextAttemptUtc ? t('views.pipelineRunDetail.nextAttempt', { time: formatDateTime(stage.nextAttemptUtc, lng) }) : ''}
                  </div>
                )}
                {runs.length > 0 && (
                  <div className="table-scroll">
                    <table className="data-table compact" data-testid={`stage-${stage.position}-runs`}>
                      <thead>
                        <tr>
                          <th scope="col" className="right" {...tip(t('tips.views.pipelineRunDetail.columns.execution'))}>{t('views.pipelineRunDetail.columns.execution')}</th>
                          <th scope="col" {...tip(t('tips.views.pipelineRunDetail.columns.run'))}>{t('views.pipelineRunDetail.columns.run')}</th>
                          <th scope="col" {...tip(t('tips.views.pipelineRunDetail.columns.status'))}>{t('views.pipelineRunDetail.columns.status')}</th>
                          <th scope="col" {...tip(t('tips.views.pipelineRunDetail.columns.outcome'))}>{t('views.pipelineRunDetail.columns.outcome')}</th>
                          <th scope="col" {...tip(t('tips.views.pipelineRunDetail.columns.error'))}>{t('views.pipelineRunDetail.columns.error')}</th>
                          <th scope="col" {...tip(t('tips.views.pipelineRunDetail.columns.created'))}>{t('views.pipelineRunDetail.columns.created')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {runs.map((x) => (
                          <tr key={x.runId} data-execution={x.execution}>
                            <td className="right">{formatNumber(x.execution ?? 0, {}, lng)}</td>
                            <td className="cell-id">{runLink(x.runId, `stage-run-${x.runId}`)}</td>
                            <td>
                              <RunStatus status={x.status} t={t} />
                            </td>
                            <td>{x.outcome && x.outcome !== 'None' ? <span {...tip(enumTip(t, 'runOutcome', x.outcome))}>{enumLabel(t, 'runOutcome', x.outcome)}</span> : '-'}</td>
                            <td>{x.errorMessage ? <span {...tip(x.errorMessage)}>{textPreview(x.errorMessage, 80)}</span> : '-'}</td>
                            <td className="nowrap">{when(x.createdUtc)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {reviews.length > 0 && (
                  <ul className="plain-list pipeline-timeline-reviews" data-testid={`stage-${stage.position}-reviews`}>
                    {reviews.map((v) => (
                      <li key={v.id} className="inline-meta">
                        <span {...tip(t('tips.views.pipelineRunDetail.reviewItem'))}>{t('views.pipelineRunDetail.reviewItem', { execution: v.execution })}</span>
                        <PipelineReviewStatusBadge status={v.status} t={t} />
                        <PipelineReviewDecisionBadge decision={v.decision} t={t} />
                        {v.decisionSource && v.decisionSource !== 'User' && <span className="text-muted" {...tip(enumTip(t, 'pipelineReviewSource', v.decisionSource))}>{enumLabel(t, 'pipelineReviewSource', v.decisionSource)}</span>}
                        {v.decidedBy && <span className="text-muted">{v.decidedBy}</span>}
                        {v.comment && <span className="pipeline-review-comment" {...tip(v.comment)}>{textPreview(v.comment, 160)}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      <ConfirmModal
        open={confirm === 'cancel'}
        danger
        title={t('views.pipelineRunDetail.confirmCancelTitle')}
        message={t('views.pipelineRunDetail.confirmCancel', { pipeline: r.pipelineName })}
        confirmLabel={t('resources.pipelineRuns.actions.cancel')}
        confirmTip={t('tips.resources.pipelineRuns.actions.cancel')}
        onConfirm={() => perform('cancel')}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmModal
        open={confirm === 'delete'}
        danger
        title={t('resources.pipelineRuns.deleteTitle')}
        message={t('views.pipelineRunDetail.confirmDelete', { pipeline: r.pipelineName })}
        confirmLabel={t('common.actions.delete')}
        confirmTip={t('tips.views.pipelineRunDetail.delete')}
        onConfirm={() => perform('delete')}
        onCancel={() => setConfirm(null)}
      />
      {deciding && (
        <PipelineReviewDecideModal
          review={deciding.review}
          stage={reviewStage}
          initialDecision={deciding.decision}
          onClose={() => setDeciding(null)}
          onDecided={() => {
            setDeciding(null);
            load();
          }}
        />
      )}
      <JsonViewerModal open={jsonOpen} value={r} onClose={() => setJsonOpen(false)} />
    </div>
  );
}
