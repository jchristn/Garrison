import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/PageHeader';
import CopyableId from '../components/CopyableId';
import JsonViewerModal from '../components/JsonViewerModal';
import LocalTableFrame from '../components/LocalTableFrame';
import EvalReasonModal from '../components/EvalReasonModal';
import { EvalDetail, EvalLink, EvalSection } from '../components/EvalDetailParts';
import { CanaryStatusBadge } from '../components/EvalBadges';
import { LoadingState, ErrorBanner, EmptyState } from '../components/States';
import { CodeIcon } from '../components/Icons';
import { tip } from '../components/Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { pathFor } from '../config/navConfig';
import { errorMessage, errorDetail } from '../utils/errors';
import { formatDateTime, formatNumber, formatRelativeTime } from '../i18n/formatters';
import { scoreText, stepState } from '../utils/evaluations';
import { stepText } from './evaluationConfigs';

const POLL_MS = 15000;

/**
 * One canary release (AA9.15): the agent, the candidate and baseline deployments with their weights before the
 * release, the steps (traffic percent, minimum runs, minimum minutes) with the current one marked, the error-rate
 * ceiling and the optional eval gate, and how it ended: promoted, rolled back with the reason, or aborted. A running
 * release refreshes on its own and can be aborted, which restores the initial weights.
 */
export default function CanaryReleaseDetailView({ recordId }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const [release, setRelease] = useState(null);
  const [names, setNames] = useState({ deployments: {}, agents: {} });
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const lng = i18n.language;

  const load = useCallback(() => {
    if (!apiClient || !recordId) return;
    apiClient
      .getCanaryRelease(tenantId, recordId)
      .then((x) => {
        setRelease(x);
        setError(null);
      })
      .catch((e) => setError(e));
  }, [apiClient, tenantId, recordId]);

  useEffect(load, [load]);

  useEffect(() => {
    if (!apiClient) return;
    const page = { pageNumber: 1, pageSize: 1000 };
    Promise.all([apiClient.listDeployments(tenantId, page).catch(() => ({ items: [] })), apiClient.listAgents(tenantId, page).catch(() => ({ items: [] }))]).then(([d, a]) =>
      setNames({ deployments: Object.fromEntries((d.items || []).map((x) => [x.id, x.name])), agents: Object.fromEntries((a.items || []).map((x) => [x.id, x.name])) })
    );
  }, [apiClient, tenantId]);

  const running = release?.status === 'Running';
  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [running, load]);

  if (error && !release) {
    return (
      <div>
        <PageHeader title={t('evals.canaryDetail.title')} />
        <ErrorBanner message={`${errorMessage(t, error)} ${errorDetail(t, error)}`.trim()} onRetry={load} />
        {error?.status === 404 && <EmptyState title={t('evals.canaryDetail.notFoundTitle')} body={t('evals.canaryDetail.notFoundBody')} />}
      </div>
    );
  }
  if (!release) return <LoadingState />;

  const x = release;
  const when = (value) => (value ? <span {...tip(formatRelativeTime(value, lng))}>{formatDateTime(value, lng, { dateStyle: 'medium', timeStyle: 'short' })}</span> : '-');
  const label = (name) => t(`evals.canaryDetail.fields.${name}`);
  const tipOf = (name) => t(`tips.evals.canaryDetail.fields.${name}`);
  const deployment = (id) => (id ? names.deployments[id] || id : '-');
  const agent = names.agents[x.agentId] || x.agentId;
  const close = () => setModal(null);

  return (
    <div className="page-flow" data-testid="canary-detail">
      <PageHeader
        title={t('evals.canaryDetail.heading', { agent })}
        subtitle={
          <span className="inline-meta">
            <CopyableId value={x.id} max={40} /> <CanaryStatusBadge status={x.status} t={t} /> <span data-testid="canary-step">{stepText(t, x)}</span>
          </span>
        }
        back={
          <EvalLink to={pathFor('canaryReleases')} tipText={t('tips.evals.canaryDetail.back')} testId="canary-back">
            {t('evals.canaryDetail.back')}
          </EvalLink>
        }
        actions={
          <>
            <button type="button" className="button-secondary" onClick={() => setModal('json')} {...tip(t('tips.evals.canaryDetail.viewJson'))}>
              <CodeIcon /> {t('common.actions.viewJson')}
            </button>
            {running && (
              <button type="button" className="button-danger" onClick={() => setModal('abort')} data-testid="canary-abort-open" {...tip(t('tips.evals.actions.abortCanary'))}>
                {t('evals.actions.abortCanary')}
              </button>
            )}
          </>
        }
      />

      {x.status === 'RolledBack' && (
        <div className="error-banner" role="alert" data-testid="canary-rollback">
          {t('evals.canaryDetail.rolledBack', { reason: x.rollbackReason || t('evals.canaryDetail.noReason') })}
        </div>
      )}
      {x.status === 'Aborted' && (
        <p className="warning-banner" data-testid="canary-aborted">
          {t('evals.canaryDetail.aborted', { reason: x.rollbackReason || t('evals.canaryDetail.noReason') })}
        </p>
      )}
      {x.status === 'Promoted' && (
        <p className="info-banner" data-testid="canary-promoted">
          {t('evals.canaryDetail.promoted', { candidate: deployment(x.candidateDeploymentId) })}
        </p>
      )}

      <div className="panel detail-grid">
        <EvalDetail name="agent" label={label('agent')} tipText={tipOf('agent')}>
          <EvalLink to={pathFor('agents', x.agentId)} tipText={t('tips.evals.canaryDetail.openAgent')}>
            {agent}
          </EvalLink>
        </EvalDetail>
        <EvalDetail name="candidate" label={label('candidate')} tipText={tipOf('candidate')}>
          {t('evals.canaryDetail.withWeight', { name: deployment(x.candidateDeploymentId), weight: x.candidateInitialWeight })}
        </EvalDetail>
        <EvalDetail name="baseline" label={label('baseline')} tipText={tipOf('baseline')}>
          {t('evals.canaryDetail.withWeight', { name: deployment(x.baselineDeploymentId), weight: x.baselineInitialWeight })}
        </EvalDetail>
        <EvalDetail name="maxErrorRatePercent" label={label('maxErrorRatePercent')} tipText={tipOf('maxErrorRatePercent')}>
          {t('evals.percent', { value: x.maxErrorRatePercent })}
        </EvalDetail>
        <EvalDetail name="gate" label={label('gate')} tipText={tipOf('gate')}>
          {x.evalSetId ? (
            <EvalLink to={pathFor('evaluations', x.evalSetId)} tipText={t('tips.evals.actions.openSet')}>
              {t('evals.canaryDetail.gate', { score: scoreText(x.minEvalScore, lng) })}
            </EvalLink>
          ) : (
            t('evals.canary.noGate')
          )}
        </EvalDetail>
        <EvalDetail name="stepStartedUtc" label={label('stepStartedUtc')} tipText={tipOf('stepStartedUtc')}>
          {when(x.stepStartedUtc)}
        </EvalDetail>
        <EvalDetail name="createdBy" label={label('createdBy')} tipText={tipOf('createdBy')}>
          {x.createdByName || '-'}
        </EvalDetail>
        <EvalDetail name="completedUtc" label={label('completedUtc')} tipText={tipOf('completedUtc')}>
          {when(x.completedUtc)}
        </EvalDetail>
      </div>

      <EvalSection id="steps" title={t('evals.canaryDetail.steps')} tipText={t('tips.evals.canaryDetail.steps')} testId="canary-steps">
        <LocalTableFrame
          tableId="canary-steps"
          testId="canary-steps-table"
          compact
          items={(x.steps || []).map((s, i) => ({ ...s, index: i, state: stepState(x, i) }))}
          rowId={(s) => String(s.index)}
          rowProps={(s) => ({ 'data-step': s.index + 1, 'data-state': s.state, className: s.state === 'current' ? 'eval-current-row' : undefined })}
          columns={[
            { key: 'step', label: t('evals.canaryDetail.columns.step'), tip: t('tips.evals.canaryDetail.columns.step'), cellClass: 'nowrap', render: (s) => s.index + 1 },
            { key: 'weightPercent', label: t('evals.canaryDetail.columns.weightPercent'), tip: t('tips.evals.canaryDetail.columns.weightPercent'), cellClass: 'nowrap', render: (s) => t('evals.percent', { value: s.weightPercent }) },
            { key: 'minimumRuns', label: t('evals.canaryDetail.columns.minimumRuns'), tip: t('tips.evals.canaryDetail.columns.minimumRuns'), cellClass: 'nowrap', render: (s) => formatNumber(s.minimumRuns, {}, lng) },
            { key: 'minimumMinutes', label: t('evals.canaryDetail.columns.minimumMinutes'), tip: t('tips.evals.canaryDetail.columns.minimumMinutes'), cellClass: 'nowrap', render: (s) => formatNumber(s.minimumMinutes, {}, lng) },
            {
              key: 'state',
              label: t('evals.canaryDetail.columns.state'),
              tip: t('tips.evals.canaryDetail.columns.state'),
              render: (s) => (
                <span className={`pill pill-${s.state === 'done' ? 'success' : s.state === 'current' ? 'info' : s.state === 'stopped' ? 'warning' : 'neutral'}`} {...tip(t(`tips.evals.canaryDetail.stepStates.${s.state}`))}>
                  {t(`evals.canaryDetail.stepStates.${s.state}`)}
                </span>
              )
            }
          ]}
        />
      </EvalSection>

      {modal === 'abort' && (
        <EvalReasonModal
          title={t('evals.canaryDetail.abortTitle')}
          message={t('evals.canaryDetail.abortMessage')}
          confirmLabel={t('evals.actions.abortCanary')}
          confirmTip={t('tips.evals.actions.abortCanary')}
          testId="canary-abort"
          onClose={close}
          onConfirm={async (reason) => {
            const next = await apiClient.abortCanaryRelease(tenantId, x.id, { reason });
            addToast({ type: 'success', message: t('evals.toasts.canaryAborted') });
            close();
            if (next) setRelease(next);
            else load();
          }}
        />
      )}
      <JsonViewerModal open={modal === 'json'} value={x} onClose={close} />
    </div>
  );
}
