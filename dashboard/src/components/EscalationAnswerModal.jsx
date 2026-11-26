import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { tip } from './Tooltip';
import { EscalationSeverityBadge } from './EscalationBadges';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { useOpenEscalations } from '../context/EscalationsContext';
import { ESCALATION_LIMITS } from '../utils/constants';
import { errorMessage, errorDetail, errorMessageWithDetail } from '../utils/errors';
import { enumLabel } from '../utils/enums';
import { formatDateTime, formatRelativeTime } from '../i18n/formatters';
import { answerErrors, answerToBody, blankAnswer, hasOptions, optionLabel } from '../utils/escalations';

/**
 * Answer one open escalation (AA2.13): the question and context the run wrote, its options as buttons (the default
 * answer marked), and free text, which is required when there are no options and explains the choice otherwise.
 * A 409 (someone answered first, a timeout, or the escalation was passed up) ends in a toast. onAnswered(escalation)
 * receives the answered escalation, or null when it was no longer open.
 */
export default function EscalationAnswerModal({ escalation, onClose, onAnswered }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const { refresh } = useOpenEscalations();
  const [form, setForm] = useState(() => blankAnswer(escalation));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!escalation) return null;

  const lng = i18n.language;
  const options = hasOptions(escalation);

  const submit = async () => {
    const found = answerErrors(form, escalation, t);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    setError('');
    try {
      const answered = await apiClient.answerEscalation(tenantId, escalation.id, answerToBody(form, escalation));
      addToast({ type: 'success', message: t('components.escalations.toasts.answered', { agent: escalation.agentName || escalation.agentId || '-' }) });
      refresh();
      onAnswered?.(answered || null);
    } catch (e) {
      if (e?.status === 409) {
        addToast({ type: 'warning', message: e?.code === 'EscalatedUp' ? t('components.escalations.toasts.passedUp') : t('components.escalations.toasts.notOpen') });
        refresh();
        onAnswered?.(null);
      } else if (e?.status === 400) {
        setError(`${errorMessageWithDetail(t, e)} ${errorDetail(t, e)}`.trim());
      } else if (e?.status === 403) {
        addToast({ type: 'error', message: `${t('components.escalations.toasts.forbidden')} ${errorDetail(t, e)}`.trim() });
      } else {
        addToast({ type: 'error', message: `${errorMessage(t, e)} ${errorDetail(t, e)}`.trim() });
      }
    } finally {
      setBusy(false);
    }
  };

  const pick = (key) => {
    setForm((f) => ({ ...f, choice: key }));
    setErrors((x) => ({ ...x, choice: undefined }));
  };

  return (
    <Modal
      open
      onClose={() => !busy && onClose?.()}
      size="medium"
      title={t('components.escalations.answerTitle', { agent: escalation.agentName || escalation.agentId || '-' })}
      headerMeta={<code className="cell-id">{escalation.id}</code>}
      footer={
        <>
          <button type="button" className="button-secondary" onClick={onClose} disabled={busy} {...tip(t('tips.modal.cancelForm'))}>
            {t('common.actions.cancel')}
          </button>
          <button type="button" className="button-primary" onClick={submit} disabled={busy} data-testid="escalation-answer-submit" {...tip(t('tips.components.escalations.submit'))}>
            {busy ? t('common.generic.saving') : t('components.escalations.submit')}
          </button>
        </>
      }
    >
      <div className="flex-col gap-md escalation-answer" data-testid="escalation-answer">
        <div className="inline-meta">
          <EscalationSeverityBadge severity={escalation.severity} t={t} />
          {escalation.mode === 'Blocking' && (
            <span className="pill pill-warning" {...tip(t('tips.enums.escalationMode.Blocking'))}>
              {enumLabel(t, 'escalationMode', 'Blocking')}
            </span>
          )}
          {escalation.expiresUtc && (
            <span className="text-muted" {...tip(formatDateTime(escalation.expiresUtc, lng))}>
              {t('components.escalations.expires', { when: formatRelativeTime(escalation.expiresUtc, lng), action: enumLabel(t, 'escalationTimeoutAction', escalation.timeoutAction) })}
            </span>
          )}
        </div>
        <section aria-label={t('components.escalations.question')}>
          <div className="detail-item-label" {...tip(t('tips.components.escalations.question'))}>
            {t('components.escalations.question')}
          </div>
          <p className="escalation-question" data-testid="escalation-answer-question">
            {escalation.question}
          </p>
          {escalation.context && (
            <>
              <div className="detail-item-label" {...tip(t('tips.components.escalations.context'))}>
                {t('components.escalations.context')}
              </div>
              <pre className="escalation-context">{escalation.context}</pre>
            </>
          )}
        </section>

        {options && (
          <fieldset className="escalation-choices">
            <legend {...tip(t('tips.components.escalations.choice'))}>{t('components.escalations.choice')}</legend>
            <div className="escalation-choice-list" role="radiogroup" aria-label={t('components.escalations.choice')}>
              {escalation.options.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  role="radio"
                  aria-checked={form.choice === o.key}
                  className={`escalation-choice ${form.choice === o.key ? 'selected' : ''}`}
                  disabled={busy}
                  onClick={() => pick(o.key)}
                  data-testid={`escalation-choice-${o.key}`}
                  {...tip(o.key === escalation.defaultAnswer ? t('tips.components.escalations.defaultChoice') : t('tips.components.escalations.pickChoice'))}
                >
                  <strong>{o.label || o.key}</strong>
                  {o.label && <code>{o.key}</code>}
                  {o.key === escalation.defaultAnswer && <span className="pill pill-neutral">{t('components.escalations.default')}</span>}
                </button>
              ))}
            </div>
            {errors.choice && <div className="field-error">{errors.choice}</div>}
          </fieldset>
        )}
        {escalation.defaultAnswer && !(escalation.options || []).some((o) => o.key === escalation.defaultAnswer) && (
          <p className="text-muted" data-testid="escalation-default-answer">
            {t('components.escalations.defaultAnswer', { answer: optionLabel(escalation, escalation.defaultAnswer) })}
          </p>
        )}

        <div className="field">
          <label htmlFor="escalation-text" {...tip(t(options ? 'tips.components.escalations.explain' : 'tips.components.escalations.text'))}>
            {t(options ? 'components.escalations.explain' : 'components.escalations.text')}
          </label>
          <textarea
            id="escalation-text"
            rows={4}
            maxLength={ESCALATION_LIMITS.answerMax}
            value={form.text}
            disabled={busy}
            placeholder={t('components.escalations.textPlaceholder')}
            onChange={(e) => {
              const text = e.target.value;
              setForm((f) => ({ ...f, text }));
              setErrors((x) => ({ ...x, text: undefined }));
            }}
            data-testid="escalation-answer-text"
            {...tip(t(options ? 'tips.components.escalations.explain' : 'tips.components.escalations.text'))}
          />
          {errors.text && <div className="field-error">{errors.text}</div>}
        </div>
        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}
