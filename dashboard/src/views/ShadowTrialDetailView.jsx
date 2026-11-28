import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/PageHeader';
import CopyableId from '../components/CopyableId';
import JsonViewerModal from '../components/JsonViewerModal';
import KpiCard from '../components/KpiCard';
import EvalReasonModal from '../components/EvalReasonModal';
import { EvalDetail, EvalLink } from '../components/EvalDetailParts';
import { ShadowTrialStatusBadge } from '../components/EvalBadges';
import { LoadingState, ErrorBanner, EmptyState } from '../components/States';
import { CodeIcon } from '../components/Icons';
import { tip } from '../components/Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { pathFor } from '../config/navConfig';
import { errorMessage, errorDetail } from '../utils/errors';
import { formatDateTime, formatNumber, formatRelativeTime } from '../i18n/formatters';
import { agreementRate, scoreText } from '../utils/evaluations';

const POLL_MS = 15000;

/**
 * One shadow trial (AA9.15): the source deployment whose succeeded runs are copied, the candidate that replays a
 * sampled share of them as Shadow runs that cannot act, how the outputs are compared (normalized text, an eval set,
 * or the judge), and the counts so far: compared, agreed, diverged, and candidate failures, with the agreement rate.
 * A running trial refreshes on its own and can be stopped with a reason.
 */
export default function ShadowTrialDetailView({ recordId }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const [trial, setTrial] = useState(null);
  const [names, setNames] = useState({});
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const lng = i18n.language;

  const load = useCallback(() => {
    if (!apiClient || !recordId) return;
    apiClient
      .getShadowTrial(tenantId, recordId)
      .then((x) => {
        setTrial(x);
        setError(null);
      })
      .catch((e) => setError(e));
  }, [apiClient, tenantId, recordId]);

  useEffect(load, [load]);

  useEffect(() => {
    if (!apiClient) return;
    apiClient
      .listDeployments(tenantId, { pageNumber: 1, pageSize: 1000 })
      .then((r) => setNames(Object.fromEntries((r.items || []).map((d) => [d.id, d.name]))))
      .catch(() => setNames({}));
  }, [apiClient, tenantId]);

  const running = trial?.status === 'Running';
  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [running, load]);

  if (error && !trial) {
    return (
      <div>
        <PageHeader title={t('evals.shadowDetail.title')} />
        <ErrorBanner message={`${errorMessage(t, error)} ${errorDetail(t, error)}`.trim()} onRetry={load} />
        {error?.status === 404 && <EmptyState title={t('evals.shadowDetail.notFoundTitle')} body={t('evals.shadowDetail.notFoundBody')} />}
      </div>
    );
  }
  if (!trial) return <LoadingState />;

  const x = trial;
  const when = (value) => (value ? <span {...tip(formatRelativeTime(value, lng))}>{formatDateTime(value, lng, { dateStyle: 'medium', timeStyle: 'short' })}</span> : '-');
  const label = (name) => t(`evals.shadowDetail.fields.${name}`);
  const tipOf = (name) => t(`tips.evals.shadowDetail.fields.${name}`);
  const deployment = (id) => (id ? names[id] || id : '-');
  const close = () => setModal(null);
  const comparison = x.comparisonEvalSetId ? 'set' : x.useJudge ? 'judge' : 'text';

  return (
    <div className="page-flow" data-testid="shadow-trial-detail">
      <PageHeader
        title={x.name || t('evals.shadowDetail.title')}
        subtitle={
          <span className="inline-meta">
            <CopyableId value={x.id} max={40} /> <ShadowTrialStatusBadge status={x.status} t={t} />
          </span>
        }
        back={
          <EvalLink to={pathFor('shadowTrials')} tipText={t('tips.evals.shadowDetail.back')} testId="shadow-back">
            {t('evals.shadowDetail.back')}
          </EvalLink>
        }
        actions={
          <>
            <button type="button" className="button-secondary" onClick={() => setModal('json')} {...tip(t('tips.evals.shadowDetail.viewJson'))}>
              <CodeIcon /> {t('common.actions.viewJson')}
            </button>
            {running && (
              <button type="button" className="button-danger" onClick={() => setModal('stop')} data-testid="shadow-stop-open" {...tip(t('tips.evals.actions.stopTrial'))}>
                {t('evals.actions.stopTrial')}
              </button>
            )}
          </>
        }
      />

      <p className="text-muted">{t('evals.shadowDetail.note')}</p>
      {x.stopReason && (
        <p className="warning-banner" data-testid="shadow-stop-reason">
          {t('evals.shadowDetail.stopReason', { reason: x.stopReason })}
        </p>
      )}

      <div className="kpi-grid" data-testid="shadow-counts">
        <KpiCard label={t('evals.shadowDetail.kpi.compared')} value={formatNumber(x.comparedCount || 0, {}, lng)} testId="shadow-compared" tip={t('tips.evals.shadowDetail.kpi.compared')} />
        <KpiCard label={t('evals.shadowDetail.kpi.agreed')} value={formatNumber(x.agreedCount || 0, {}, lng)} tone="success" testId="shadow-agreed" tip={t('tips.evals.shadowDetail.kpi.agreed')} />
        <KpiCard label={t('evals.shadowDetail.kpi.diverged')} value={formatNumber(x.divergedCount || 0, {}, lng)} tone={x.divergedCount ? 'warning' : undefined} testId="shadow-diverged" tip={t('tips.evals.shadowDetail.kpi.diverged')} />
        <KpiCard label={t('evals.shadowDetail.kpi.failures')} value={formatNumber(x.candidateFailureCount || 0, {}, lng)} tone={x.candidateFailureCount ? 'danger' : undefined} testId="shadow-failures" tip={t('tips.evals.shadowDetail.kpi.failures')} />
        <KpiCard label={t('evals.shadowDetail.kpi.agreement')} value={scoreText(agreementRate(x), lng)} testId="shadow-agreement" tip={t('tips.evals.shadowDetail.kpi.agreement')} />
      </div>

      <div className="panel detail-grid">
        <EvalDetail name="source" label={label('source')} tipText={tipOf('source')}>
          {deployment(x.sourceDeploymentId)}
        </EvalDetail>
        <EvalDetail name="candidate" label={label('candidate')} tipText={tipOf('candidate')}>
          {deployment(x.candidateDeploymentId)}
        </EvalDetail>
        <EvalDetail name="samplePercent" label={label('samplePercent')} tipText={tipOf('samplePercent')}>
          {t('evals.percent', { value: x.samplePercent })}
        </EvalDetail>
        <EvalDetail name="comparison" label={label('comparison')} tipText={tipOf('comparison')}>
          {comparison === 'set' ? (
            <EvalLink to={pathFor('evaluations', x.comparisonEvalSetId)} tipText={t('tips.evals.actions.openSet')}>
              {t('evals.shadowDetail.comparison.set')}
            </EvalLink>
          ) : (
            t(`evals.shadowDetail.comparison.${comparison}`)
          )}
        </EvalDetail>
        <EvalDetail name="endsUtc" label={label('endsUtc')} tipText={tipOf('endsUtc')}>
          {x.endsUtc ? when(x.endsUtc) : t('evals.untilStopped')}
        </EvalDetail>
        <EvalDetail name="createdBy" label={label('createdBy')} tipText={tipOf('createdBy')}>
          {x.createdByName || '-'}
        </EvalDetail>
        <EvalDetail name="createdUtc" label={label('createdUtc')} tipText={tipOf('createdUtc')}>
          {when(x.createdUtc)}
        </EvalDetail>
        <EvalDetail name="completedUtc" label={label('completedUtc')} tipText={tipOf('completedUtc')}>
          {when(x.completedUtc)}
        </EvalDetail>
      </div>

      {modal === 'stop' && (
        <EvalReasonModal
          title={t('evals.shadowDetail.stopTitle')}
          message={t('evals.shadowDetail.stopMessage', { name: x.name || x.id })}
          confirmLabel={t('evals.actions.stopTrial')}
          confirmTip={t('tips.evals.actions.stopTrial')}
          testId="shadow-stop"
          onClose={close}
          onConfirm={async (reason) => {
            const next = await apiClient.stopShadowTrial(tenantId, x.id, { reason });
            addToast({ type: 'success', message: t('evals.toasts.trialStopped') });
            close();
            if (next) setTrial(next);
            else load();
          }}
        />
      )}
      <JsonViewerModal open={modal === 'json'} value={x} onClose={close} />
    </div>
  );
}
