import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { tip } from './Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { usePendingApprovals } from '../context/ApprovalsContext';
import { errorMessage, errorDetail } from '../utils/errors';
import { enumLabel } from '../utils/enums';
import { formatDateTime, formatNumber, formatRelativeTime } from '../i18n/formatters';
import { PIPELINE_LIMITS } from '../utils/constants';
import { reviewDecisionBody, reviewDecisionError, reviewConflictKey, revisionsLeft } from '../utils/pipelines';

const DECISIONS = ['Approve', 'RequestChanges', 'Reject'];

/**
 * Decide one pending pipeline stage review (P12.9): Approve (optional notes the next stage receives), Request changes
 * (a required comment; the stage runs again with it), or Reject (the pipeline run fails). A 409 RevisionLimitReached
 * stays in the dialog as an error, so the reviewer can approve or reject instead; a 409 ReviewNotPending (someone or a
 * timeout decided first) ends in a toast. `stage` is the pipeline run stage, when known, to show revisions left.
 * onDecided(review) receives the decided review, or null when it was no longer pending.
 */
export default function PipelineReviewDecideModal({ review, stage = null, initialDecision = 'Approve', onClose, onDecided }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const { refresh } = usePendingApprovals();
  const [decision, setDecision] = useState(DECISIONS.includes(initialDecision) ? initialDecision : 'Approve');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);
  const [conflict, setConflict] = useState('');
  const [loadedStage, setLoadedStage] = useState(null);
  const pipelineRunId = review?.pipelineRunId;
  const runStageId = review?.runStageId;

  // Opened from a list, the dialog does not know the stage yet: read the pipeline run once for its revision count.
  useEffect(() => {
    if (stage || !pipelineRunId || typeof apiClient?.getPipelineRun !== 'function') return undefined;
    let active = true;
    apiClient
      .getPipelineRun(tenantId, pipelineRunId)
      .then((run) => active && setLoadedStage((run?.stages || []).find((s) => s.id === runStageId) || null))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [stage, apiClient, tenantId, pipelineRunId, runStageId]);
  if (!review) return null;

  const lng = i18n.language;
  const validation = reviewDecisionError(decision, comment, t);
  const stageInfo = stage || loadedStage;
  const left = revisionsLeft(stageInfo);
  const noRevisions = left === 0;
  const names = { stage: review.stageName || `#${review.position}`, pipeline: review.pipelineName || review.pipelineId };

  const submit = async () => {
    setTouched(true);
    setConflict('');
    if (validation) return;
    setBusy(true);
    try {
      const decided = await apiClient.decidePipelineReview(tenantId, review.id, reviewDecisionBody(decision, comment));
      addToast({ type: 'success', message: t(`components.pipelineReviews.toasts.${decision}`, names) });
      refresh?.();
      onDecided?.(decided || null);
    } catch (e) {
      const key = reviewConflictKey(e);
      if (key === 'components.pipelineReviews.toasts.revisionLimit') {
        setConflict(t(key, { max: stageInfo?.maxRevisions ?? '' }));
      } else if (key) {
        addToast({ type: 'warning', message: t(key) });
        refresh?.();
        onDecided?.(null);
      } else {
        addToast({ type: 'error', message: `${errorMessage(t, e)} ${errorDetail(t, e)}`.trim() });
      }
    } finally {
      setBusy(false);
    }
  };

  const choice = (value) => {
    const tipText = t(`tips.pipelineReviews.decide.${value}`);
    return (
      <label key={value} className={`checkbox-chip decision-choice decision-${value.toLowerCase()} ${decision === value ? 'selected' : ''}`} {...tip(tipText)}>
        <input
          type="radio"
          name="pipeline-review-decision"
          value={value}
          checked={decision === value}
          disabled={busy}
          onChange={() => {
            setDecision(value);
            setConflict('');
          }}
          data-testid={`review-decide-${value}`}
          {...tip(tipText)}
        />
        <span>{enumLabel(t, 'pipelineReviewDecision', value)}</span>
      </label>
    );
  };

  const commentKey = decision === 'RequestChanges' ? 'commentRequestChanges' : decision === 'Reject' ? 'commentReject' : 'commentApprove';
  return (
    <Modal
      open
      onClose={() => !busy && onClose?.()}
      size="medium"
      title={t('components.pipelineReviews.decideTitle', names)}
      headerMeta={<code className="cell-id">{review.id}</code>}
      footer={
        <>
          <button type="button" className="button-secondary" onClick={onClose} disabled={busy} {...tip(t('tips.modal.cancelForm'))}>
            {t('common.actions.cancel')}
          </button>
          <button
            type="button"
            className={decision === 'Reject' ? 'button-danger' : 'button-primary'}
            onClick={submit}
            disabled={busy || (touched && !!validation)}
            data-testid="review-decide-submit"
            {...tip(t(`tips.pipelineReviews.decide.submit${decision}`))}
          >
            {busy ? t('common.generic.saving') : t(`components.pipelineReviews.submit.${decision}`)}
          </button>
        </>
      }
    >
      <div className="flex-col gap-md approval-decide" data-testid="pipeline-review-decide">
        <dl className="approval-facts">
          <div>
            <dt {...tip(t('tips.resources.pipelineReviews.pipelineName'))}>{t('resources.pipelineReviews.columns.pipelineName')}</dt>
            <dd>{names.pipeline}</dd>
          </div>
          <div>
            <dt {...tip(t('tips.resources.pipelineReviews.stageName'))}>{t('resources.pipelineReviews.columns.stageName')}</dt>
            <dd>
              {names.stage} <span className="text-muted">{t('components.pipelineReviews.positionExecution', { position: review.position, execution: review.execution })}</span>
            </dd>
          </div>
          {left !== null && (
            <div>
              <dt {...tip(t('tips.pipelineReviews.revisionsLeft'))}>{t('components.pipelineReviews.revisionsLeft')}</dt>
              <dd data-testid="review-revisions-left">{t('components.pipelineReviews.revisionsLeftValue', { left: formatNumber(left, {}, lng), max: formatNumber(stageInfo.maxRevisions ?? 0, {}, lng) })}</dd>
            </div>
          )}
          {review.expiresUtc && (
            <div>
              <dt {...tip(t('tips.resources.pipelineReviews.expiresUtc'))}>{t('resources.pipelineReviews.columns.expiresUtc')}</dt>
              <dd>
                <span {...tip(formatDateTime(review.expiresUtc, lng))}>{formatRelativeTime(review.expiresUtc, lng)}</span>{' '}
                <span className="text-muted">{t('components.pipelineReviews.timeoutThen', { decision: enumLabel(t, 'pipelineReviewDecision', review.timeoutAction || 'Reject') })}</span>
              </dd>
            </div>
          )}
        </dl>

        <fieldset className="decision-choices">
          <legend {...tip(t('tips.pipelineReviews.decide.decision'))}>{t('components.pipelineReviews.decision')}</legend>
          <div className="checkbox-grid">{DECISIONS.map(choice)}</div>
        </fieldset>
        {decision === 'RequestChanges' && noRevisions && (
          <div className="info-banner" role="status" data-testid="review-no-revisions">
            {t('components.pipelineReviews.noRevisionsLeft', { max: stageInfo.maxRevisions ?? 0 })}
          </div>
        )}

        <div className={`field ${touched && validation ? 'has-error' : ''}`}>
          <label htmlFor="pipeline-review-comment" {...tip(t(`tips.pipelineReviews.decide.${commentKey}`))}>
            {t(`components.pipelineReviews.${commentKey}`)}
            {decision === 'RequestChanges' && <span className="required-mark" aria-hidden="true"> *</span>}
          </label>
          <textarea
            id="pipeline-review-comment"
            rows={5}
            maxLength={PIPELINE_LIMITS.commentMax}
            value={comment}
            disabled={busy}
            placeholder={t(`components.pipelineReviews.${commentKey}Placeholder`)}
            onChange={(e) => setComment(e.target.value)}
            data-testid="review-decide-comment"
            {...tip(t(`tips.pipelineReviews.decide.${commentKey}`))}
          />
          {touched && validation && (
            <div className="field-error" role="alert">
              {validation}
            </div>
          )}
        </div>
        {conflict && (
          <div className="error-banner" role="alert" data-testid="review-decide-conflict">
            {conflict}
          </div>
        )}
      </div>
    </Modal>
  );
}
