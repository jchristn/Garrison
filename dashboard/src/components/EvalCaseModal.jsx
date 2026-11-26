import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import FormFields from './FormFields';
import EvalChecksEditor from './EvalChecksEditor';
import { tip } from './Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { EVAL_LIMITS } from '../utils/constants';
import { errorMessage, errorDetail } from '../utils/errors';
import { evalFieldErrors } from '../utils/evalErrors';
import { blankCase, caseFormErrors, caseFormToBody, caseToForm } from '../utils/evaluations';

/** The text fields of the case form; the checks have their own editor. */
export function caseFields(t) {
  const f = (name, type, extra = {}) => ({ name, type, label: t(`evals.case.fields.${name}`), tip: t(`tips.evals.case.${name}`), hint: extra.hint, ...extra });
  return [
    f('name', 'text', { placeholder: t('evals.case.placeholders.name'), hint: t('evals.case.hints.name', { max: EVAL_LIMITS.caseNameMax }) }),
    f('inputText', 'textarea', { required: true, rows: 5, placeholder: t('evals.case.placeholders.inputText'), hint: t('evals.case.hints.inputText') }),
    f('expectedText', 'textarea', { rows: 4, placeholder: t('evals.case.placeholders.expectedText'), hint: t('evals.case.hints.expectedText') }),
    f('hidden', 'checkbox', { hint: t('evals.case.hints.hidden') })
  ];
}

/**
 * Add or edit one case of an eval set (AA9.15): its name, input, expected text, whether it is hidden from the agents
 * being graded, and its checks. On an approved version the server writes the change to the next version, a draft, and
 * onSaved(case) receives the case whose setId names that version.
 */
export default function EvalCaseModal({ set, item = null, onClose, onSaved }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const [form, setForm] = useState(() => (item ? caseToForm(item) : blankCase()));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const approved = set?.state === 'Approved';

  const save = async () => {
    const found = caseFormErrors(form, t);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    setError('');
    try {
      const body = caseFormToBody(form);
      const saved = item ? await apiClient.updateEvalCase(tenantId, set.id, item.id, body) : await apiClient.createEvalCase(tenantId, set.id, body);
      const moved = saved?.setId && saved.setId !== set.id;
      addToast({ type: 'success', message: t(moved ? 'evals.toasts.caseSavedNextVersion' : 'evals.toasts.caseSaved', { version: (set.version || 0) + 1 }) });
      onSaved?.(saved);
    } catch (e) {
      const perField = evalFieldErrors(t, e);
      if (perField) setErrors(perField);
      setError(`${errorMessage(t, e)} ${errorDetail(t, e)}`.trim());
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      size="large"
      onClose={() => !busy && onClose?.()}
      title={item ? t('evals.case.editTitle', { number: (item.order ?? 0) + 1 }) : t('evals.case.addTitle', { name: set?.name || '' })}
      footer={
        <>
          <button type="button" className="button-secondary" onClick={onClose} disabled={busy} {...tip(t('tips.modal.cancelForm'))}>
            {t('common.actions.cancel')}
          </button>
          <button type="button" className="button-primary" onClick={save} disabled={busy} data-testid="eval-case-save" {...tip(t(approved ? 'tips.evals.case.saveNextVersion' : 'tips.evals.case.save'))}>
            {busy ? t('common.generic.saving') : t('evals.case.save')}
          </button>
        </>
      }
    >
      <div className="flex-col gap-md" data-testid="eval-case-form">
        {approved && (
          <p className="info-banner" data-testid="eval-case-next-version">
            {t('evals.case.nextVersion', { version: (set.version || 0) + 1 })}
          </p>
        )}
        <FormFields fields={caseFields(t)} data={form} errors={errors} disabled={busy} onChange={setForm} idPrefix="eval-case" />
        <EvalChecksEditor checks={form.checks} errors={errors} disabled={busy} onChange={(checks) => setForm((f) => ({ ...f, checks }))} />
        {form.sourceRunId && (
          <p className="text-muted" data-testid="eval-case-source">
            {t('evals.case.fromRun', { id: form.sourceRunId })}
          </p>
        )}
        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}
