import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/PageHeader';
import CopyableId from '../components/CopyableId';
import JsonViewerModal from '../components/JsonViewerModal';
import KpiCard from '../components/KpiCard';
import Modal from '../components/Modal';
import DiffViewer from '../components/DiffViewer';
import EvalReasonModal from '../components/EvalReasonModal';
import { EvalDetail, EvalLink, EvalSection } from '../components/EvalDetailParts';
import { EvalResultBadge, EvalRunStatusBadge, EvalVerdictBadge } from '../components/EvalBadges';
import { LoadingState, ErrorBanner, EmptyState } from '../components/States';
import { CodeIcon } from '../components/Icons';
import { tip } from '../components/Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import useEvalRunChannel from '../hooks/useEvalRunChannel';
import { pathFor } from '../config/navConfig';
import { errorMessage, errorDetail } from '../utils/errors';
import { enumLabel } from '../utils/enums';
import { enumTip } from '../utils/tips';
import { formatCurrency, formatDateTime, formatNumber, formatRelativeTime, truncate } from '../i18n/formatters';
import { applyEvalEvent, isEvalRunFinished, progressPercent, resultOutcome, scoreText } from '../utils/evaluations';

const POLL_MS = 5000;

/** The case a result is for, by case ID (cases mode); recent-input results have none. */
function caseLabel(t, result, cases) {
  const item = result.caseId ? cases[result.caseId] : null;
  if (item?.name) return item.name;
  if (item) return t('evals.runDetail.caseNumber', { number: (result.order ?? 0) + 1 });
  return t('evals.runDetail.recentInput', { number: (result.order ?? 0) + 1 });
}

/**
 * One case result in full: the input, the expected text against the output as a line diff (or the output alone when
 * the case has no expected text), the error when the case run failed, and each check with its scorer, weight, score,
 * the scorer's note, and the judge run that graded it.
 */
function EvalResultModal({ result, item, onClose }) {
  const { t, i18n } = useTranslation();
  const lng = i18n.language;
  const checks = result.checkResults || [];
  const expected = item?.expectedText;
  return (
    <Modal
      open
      size="xlarge"
      onClose={onClose}
      title={item?.name ? t('evals.runDetail.resultTitleNamed', { number: (result.order ?? 0) + 1, name: item.name }) : t('evals.runDetail.resultTitle', { number: (result.order ?? 0) + 1 })}
      headerMeta={<EvalResultBadge result={result} t={t} />}
      footer={
        <button type="button" className="button-secondary" onClick={onClose} {...tip(t('tips.modal.close'))}>
          {t('common.actions.close')}
        </button>
      }
    >
      <div className="flex-col gap-md" data-testid="eval-result">
        <div className="inline-meta">
          <span {...tip(t('tips.evals.runDetail.columns.score'))}>{t('evals.runDetail.scoreIs', { score: scoreText(result.score, lng) })}</span>
          {result.runId && (
            <EvalLink to={pathFor('runs', result.runId)} tipText={t('tips.evals.runDetail.openCaseRun')} testId="eval-result-run">
              {t('evals.runDetail.openCaseRun')}
            </EvalLink>
          )}
          {result.sourceRunId && (
            <EvalLink to={pathFor('runs', result.sourceRunId)} tipText={t('tips.evals.runDetail.openSourceRun')} testId="eval-result-source-run">
              {t('evals.runDetail.openSourceRun')}
            </EvalLink>
          )}
          {result.costUsd > 0 && <span className="text-muted">{formatCurrency(result.costUsd, lng)}</span>}
        </div>
        {result.errorMessage && (
          <div className="error-banner" role="alert" data-testid="eval-result-error">
            {result.errorMessage}
          </div>
        )}
        {item?.hidden && <p className="text-muted">{t('evals.runDetail.hiddenCase')}</p>}
        {item?.inputText && (
          <section aria-label={t('evals.runDetail.input')}>
            <div className="detail-item-label" {...tip(t('tips.evals.runDetail.input'))}>
              {t('evals.runDetail.input')}
            </div>
            <pre className="eval-pre" data-testid="eval-result-input">
              {item.inputText}
            </pre>
          </section>
        )}
        {expected ? (
          <section aria-label={t('evals.runDetail.diff')} data-testid="eval-result-diff">
            <div className="detail-item-label" {...tip(t('tips.evals.runDetail.diff'))}>
              {t('evals.runDetail.diff')}
            </div>
            <DiffViewer before={expected} after={result.outputText || ''} beforeLabel={t('evals.runDetail.expected')} afterLabel={t('evals.runDetail.output')} />
          </section>
        ) : (
          <section aria-label={t('evals.runDetail.output')}>
            <div className="detail-item-label" {...tip(t('tips.evals.runDetail.output'))}>
              {t('evals.runDetail.output')}
            </div>
            <pre className="eval-pre" data-testid="eval-result-output">
              {result.outputText || t('evals.runDetail.noOutput')}
            </pre>
          </section>
        )}
        <section aria-label={t('evals.runDetail.checks')}>
          <div className="detail-item-label" {...tip(t('tips.evals.runDetail.checks'))}>
            {t('evals.runDetail.checks')}
          </div>
          {checks.length === 0 ? (
            <p className="text-muted">{t('evals.runDetail.noChecks')}</p>
          ) : (
            <div className="table-scroll" tabIndex={0} role="region" aria-label={t('evals.runDetail.checks')}>
              <table className="data-table compact" data-testid="eval-result-checks">
                <thead>
                  <tr>
                    {['scorer', 'weight', 'score', 'outcome', 'note', 'judgeRun'].map((k) => (
                      <th key={k} scope="col" {...tip(t(`tips.evals.runDetail.checkColumns.${k}`))}>
                        {t(`evals.runDetail.checkColumns.${k}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {checks.map((c, i) => (
                    <tr key={i} className={c.passed ? undefined : 'eval-result-failing'} data-check={i}>
                      <td>
                        <span {...tip(enumTip(t, 'evalScorer', c.scorer))}>{enumLabel(t, 'evalScorer', c.scorer)}</span>
                      </td>
                      <td className="nowrap">{formatNumber(c.weight, { maximumFractionDigits: 2 }, lng)}</td>
                      <td className="nowrap">{scoreText(c.score, lng)}</td>
                      <td>
                        <span className={`pill pill-${c.passed ? 'success' : 'danger'}`}>{t(`evals.outcome.${c.passed ? 'passed' : 'failed'}`)}</span>
                      </td>
                      <td className="eval-text-cell">{c.note || '-'}</td>
                      <td>
                        {c.judgeRunId ? (
                          <EvalLink to={pathFor('runs', c.judgeRunId)} tipText={t('tips.evals.runDetail.openJudgeRun')} testId="eval-check-judge-run">
                            <code>{c.judgeRunId}</code>
                          </EvalLink>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </Modal>
  );
}

/**
 * One eval run (AA9.15): the set version and target, the status and verdict against the threshold, progress as cases
 * finish (live over the eval-run:{id} channel, polling while it is not subscribed), score, cost against the budget,
 * and a row per case result, failing cases highlighted and filterable. A row opens the case in full with the expected
 * against output diff and every check's scorer note and judge run. Cancel stops a pending or running run.
 */
export default function EvalRunDetailView({ recordId }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const [state, setState] = useState({ run: null, results: [] });
  const [cases, setCases] = useState({});
  const [names, setNames] = useState({ deployments: {}, agents: {} });
  const [error, setError] = useState(null);
  const [failingOnly, setFailingOnly] = useState(false);
  const [opened, setOpened] = useState(null);
  const [modal, setModal] = useState(null);
  const lng = i18n.language;
  const run = state.run;
  const finished = isEvalRunFinished(run?.status);

  const load = useCallback(() => {
    if (!apiClient || !recordId) return;
    Promise.all([apiClient.getEvalRun(tenantId, recordId), apiClient.getEvalRunResults(tenantId, recordId).catch(() => [])])
      .then(([r, results]) => {
        setState({ run: r, results: (Array.isArray(results) ? results : results?.items || []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) });
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

  const setId = run?.setId;
  useEffect(() => {
    if (!apiClient || !setId) return;
    apiClient
      .listEvalCases(tenantId, setId)
      .then((items) => setCases(Object.fromEntries((Array.isArray(items) ? items : items?.items || []).map((c) => [c.id, c]))))
      .catch(() => setCases({}));
  }, [apiClient, tenantId, setId]);

  const onEvent = useCallback(
    (message) => {
      setState((s) => applyEvalEvent(s, message));
      // The final message carries counts only; read the results once more so nothing a missed message held is lost.
      if (message.type === 'eval.completed') load();
    },
    [load]
  );
  const live = useEvalRunChannel(apiClient, recordId, onEvent, !!run && !finished);

  useEffect(() => {
    if (!run || finished || live) return undefined;
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [run, finished, live, load]);

  const rows = useMemo(() => state.results.filter((r) => !failingOnly || resultOutcome(r) !== 'passed'), [state.results, failingOnly]);
  const failing = state.results.filter((r) => resultOutcome(r) !== 'passed').length;

  if (error && !run) {
    return (
      <div>
        <PageHeader title={t('evals.runDetail.title')} />
        <ErrorBanner message={`${errorMessage(t, error)} ${errorDetail(t, error)}`.trim()} onRetry={load} />
        {error?.status === 404 && <EmptyState title={t('evals.runDetail.notFoundTitle')} body={t('evals.runDetail.notFoundBody')} />}
      </div>
    );
  }
  if (!run) return <LoadingState />;

  const r = run;
  const when = (value) => (value ? <span {...tip(formatRelativeTime(value, lng))}>{formatDateTime(value, lng, { dateStyle: 'medium', timeStyle: 'medium' })}</span> : '-');
  const label = (name) => t(`evals.runDetail.fields.${name}`);
  const tipOf = (name) => t(`tips.evals.runDetail.fields.${name}`);
  const percent = progressPercent(r);
  const close = () => setModal(null);

  return (
    <div data-testid="eval-run-detail">
      <PageHeader
        title={t('evals.setVersion', { name: r.setName || r.setId, version: r.setVersion })}
        subtitle={
          <span className="inline-meta">
            <CopyableId value={r.id} max={40} /> <EvalRunStatusBadge status={r.status} t={t} /> <EvalVerdictBadge run={r} t={t} />
            {!finished && (
              <span className={`pill pill-${live ? 'success' : 'neutral'}`} data-testid="eval-run-live" {...tip(t(live ? 'tips.evals.runDetail.live' : 'tips.evals.runDetail.polling'))}>
                {t(live ? 'evals.runDetail.live' : 'evals.runDetail.polling')}
              </span>
            )}
          </span>
        }
        actions={
          <>
            <EvalLink to={pathFor('evalRuns')} tipText={t('tips.evals.runDetail.back')} testId="eval-run-back">
              {t('evals.runDetail.back')}
            </EvalLink>
            <EvalLink to={pathFor('evaluations', r.setId)} tipText={t('tips.evals.actions.openSet')} testId="eval-run-open-set">
              {t('evals.actions.openSet')}
            </EvalLink>
            <button type="button" className="button-secondary" onClick={() => setModal('json')} {...tip(t('tips.evals.runDetail.viewJson'))}>
              <CodeIcon /> {t('common.actions.viewJson')}
            </button>
            {!finished && (
              <button type="button" className="button-danger" onClick={() => setModal('cancel')} data-testid="eval-run-cancel-open" {...tip(t('tips.evals.actions.cancelRun'))}>
                {t('evals.actions.cancelRun')}
              </button>
            )}
          </>
        }
      />

      {r.failureReason && (
        <div className="error-banner" role="alert" data-testid="eval-run-failure">
          {t('evals.runDetail.failure', { reason: r.failureReason })}
        </div>
      )}

      <div className="panel" data-testid="eval-run-progress">
        <div className="eval-progress-head">
          <span {...tip(t('tips.evals.runDetail.progress'))}>{t('evals.progress', { completed: r.completedCases || 0, total: r.totalCases || 0, passed: r.passedCases || 0 })}</span>
          <span className="text-muted">{t('evals.percent', { value: percent })}</span>
        </div>
        <div className="eval-progress" role="progressbar" aria-label={t('evals.runDetail.progressLabel')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
          <div className="eval-progress-bar" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard label={t('evals.runDetail.kpi.score')} value={scoreText(r.score, lng)} note={r.threshold !== null && r.threshold !== undefined ? t('evals.runDetail.kpi.threshold', { threshold: scoreText(r.threshold, lng) }) : t('evals.runDetail.kpi.noThreshold')} tone={r.passed === false ? 'danger' : r.passed ? 'success' : undefined} testId="eval-kpi-score" tip={t('tips.evals.runDetail.kpi.score')} />
        <KpiCard label={t('evals.runDetail.kpi.passed')} value={`${formatNumber(r.passedCases || 0, {}, lng)} / ${formatNumber(r.totalCases || 0, {}, lng)}`} testId="eval-kpi-passed" tip={t('tips.evals.runDetail.kpi.passed')} />
        <KpiCard label={t('evals.runDetail.kpi.errored')} value={formatNumber(r.erroredCases || 0, {}, lng)} tone={r.erroredCases ? 'warning' : undefined} testId="eval-kpi-errored" tip={t('tips.evals.runDetail.kpi.errored')} />
        <KpiCard label={t('evals.runDetail.kpi.cost')} value={formatCurrency(r.costUsd || 0, lng)} note={r.budgetUsd !== null && r.budgetUsd !== undefined ? t('evals.runDetail.kpi.budget', { budget: formatCurrency(r.budgetUsd, lng) }) : t('evals.runDetail.kpi.noBudget')} testId="eval-kpi-cost" tip={t('tips.evals.runDetail.kpi.cost')} />
      </div>

      <div className="panel detail-grid">
        <EvalDetail name="target" label={label('target')} tipText={tipOf('target')}>
          {r.targetType === 'Deployment' ? (
            <span>{t('evals.target.deployment', { name: names.deployments[r.deploymentId] || r.deploymentId || '-' })}</span>
          ) : (
            <span>
              {r.agentId ? (
                <EvalLink to={pathFor('agents', r.agentId)} tipText={t('tips.evals.runDetail.openAgent')}>
                  {names.agents[r.agentId] || r.agentId}
                </EvalLink>
              ) : (
                '-'
              )}{' '}
              <code>{r.agentRevisionId || '-'}</code>
            </span>
          )}
        </EvalDetail>
        <EvalDetail name="targetType" label={label('targetType')} tipText={tipOf('targetType')}>
          <span {...tip(enumTip(t, 'evalRunTarget', r.targetType))}>{enumLabel(t, 'evalRunTarget', r.targetType)}</span>
        </EvalDetail>
        <EvalDetail name="inputMode" label={label('inputMode')} tipText={tipOf('inputMode')}>
          <span {...tip(enumTip(t, 'evalRunInputMode', r.inputMode))}>{r.inputMode === 'RecentInputs' ? t('evals.runDetail.recentInputs', { count: r.recentInputCount }) : enumLabel(t, 'evalRunInputMode', r.inputMode)}</span>
        </EvalDetail>
        <EvalDetail name="startedBy" label={label('startedBy')} tipText={tipOf('startedBy')}>
          {r.startedByName || '-'}
        </EvalDetail>
        <EvalDetail name="createdUtc" label={label('createdUtc')} tipText={tipOf('createdUtc')}>
          {when(r.createdUtc)}
        </EvalDetail>
        <EvalDetail name="completedUtc" label={label('completedUtc')} tipText={tipOf('completedUtc')}>
          {when(r.completedUtc)}
        </EvalDetail>
        {r.studioDraftId && (
          <EvalDetail name="studioDraftId" label={label('studioDraftId')} tipText={tipOf('studioDraftId')}>
            <EvalLink to={pathFor('studio', r.studioDraftId)} tipText={t('tips.evals.runDetail.openDraft')}>
              <code>{r.studioDraftId}</code>
            </EvalLink>
          </EvalDetail>
        )}
      </div>

      <EvalSection
        id="results"
        title={t('evals.runDetail.results', { count: state.results.length })}
        tipText={t('tips.evals.runDetail.results')}
        testId="eval-run-results"
        actions={
          <label className="eval-results-filter" {...tip(t('tips.evals.runDetail.failingOnly'))}>
            <input type="checkbox" checked={failingOnly} onChange={(e) => setFailingOnly(e.target.checked)} data-testid="eval-results-failing-only" />{' '}
            {t('evals.runDetail.failingOnly', { count: failing })}
          </label>
        }
      >
        {rows.length === 0 ? (
          <p className="text-muted">{state.results.length ? t('evals.runDetail.noFailing') : t(finished ? 'evals.runDetail.noResults' : 'evals.runDetail.waiting')}</p>
        ) : (
          <div className="table-scroll" tabIndex={0} role="region" aria-label={t('evals.runDetail.results', { count: state.results.length })}>
            <table className="data-table compact" data-testid="eval-results-table">
              <thead>
                <tr>
                  {['order', 'case', 'outcome', 'score', 'checks', 'output'].map((k) => (
                    <th key={k} scope="col" {...tip(t(`tips.evals.runDetail.columns.${k}`))}>
                      {t(`evals.runDetail.columns.${k}`)}
                    </th>
                  ))}
                  <th scope="col" className="right" {...tip(t('tips.evals.runDetail.columns.open'))}>
                    {t('common.generic.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((res) => {
                  const outcome = resultOutcome(res);
                  const checks = res.checkResults || [];
                  return (
                    <tr key={res.id || res.order} className={outcome === 'passed' ? undefined : 'eval-result-failing'} data-result={res.order} data-outcome={outcome}>
                      <td className="nowrap">{(res.order ?? 0) + 1}</td>
                      <td className="eval-text-cell">{caseLabel(t, res, cases)}</td>
                      <td>
                        <EvalResultBadge result={res} t={t} />
                      </td>
                      <td className="nowrap">{scoreText(res.score, lng)}</td>
                      <td>{checks.length ? t('evals.runDetail.checksPassed', { passed: checks.filter((c) => c.passed).length, total: checks.length }) : '-'}</td>
                      <td className="eval-text-cell" {...tip(res.errorMessage || res.outputText || '')}>
                        {res.errorMessage ? <span className="eval-error-text">{truncate(res.errorMessage, 60)}</span> : truncate(res.outputText || '', 60) || '-'}
                      </td>
                      <td className="actions-cell">
                        <button type="button" className="button-ghost button-sm" onClick={() => setOpened(res)} data-testid={`eval-result-open-${res.order}`} {...tip(t('tips.evals.runDetail.open'))}>
                          {t('evals.runDetail.open')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </EvalSection>

      {opened && <EvalResultModal result={opened} item={opened.caseId ? cases[opened.caseId] : null} onClose={() => setOpened(null)} />}
      {modal === 'cancel' && (
        <EvalReasonModal
          title={t('evals.runDetail.cancelTitle')}
          message={t('evals.runDetail.cancelMessage', { name: r.setName || r.setId })}
          confirmLabel={t('evals.actions.cancelRun')}
          confirmTip={t('tips.evals.actions.cancelRun')}
          testId="eval-run-cancel"
          onClose={close}
          onConfirm={async (reason) => {
            const next = await apiClient.cancelEvalRun(tenantId, r.id, { reason });
            addToast({ type: 'success', message: t('evals.toasts.runCancelled') });
            close();
            if (next) setState((s) => ({ ...s, run: next }));
            load();
          }}
        />
      )}
      <JsonViewerModal open={modal === 'json'} value={r} onClose={close} />
    </div>
  );
}
