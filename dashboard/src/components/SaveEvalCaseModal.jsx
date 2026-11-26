import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import FormFields from './FormFields';
import EvalChecksEditor from './EvalChecksEditor';
import { tip } from './Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { pathFor } from '../config/navConfig';
import { EVAL_LIMITS } from '../utils/constants';
import { errorMessage, errorDetail } from '../utils/errors';
import { evalFieldErrors } from '../utils/evalErrors';
import { caseFormErrors, caseFormToBody, evalSetFormErrors } from '../utils/evaluations';
import { caseFields } from './EvalCaseModal';

const NEW_SET = '__new__';

/**
 * Save a playground turn as an eval case (AA9.9): the turn's input and the agent's answer become a case (input and
 * expected text, both editable, with optional checks and hidden) of a chosen eval set, or of a new set with origin
 * Playground, with sourceRunId naming the playground run. A case added to an approved version lands on its next
 * version, a draft. Afterwards the dialog links to the set and to running it against the agent's draft revision, which
 * is what the playground ran.
 */
export default function SaveEvalCaseModal({ input, output, runId, agentName, onClose }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const [sets, setSets] = useState(null);
  const [setId, setSetId] = useState('');
  const [newName, setNewName] = useState('');
  const [form, setForm] = useState(() => ({ name: '', inputText: input || '', expectedText: output || '', hidden: false, checks: [], files: [], sourceRunId: runId || null }));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(null);

  useEffect(() => {
    if (!apiClient) return;
    let alive = true;
    apiClient
      .listEvalSets(tenantId, { pageNumber: 1, pageSize: 500, latestOnly: true })
      .then((r) => r.items || [])
      .catch(() => [])
      .then((items) => {
        if (!alive) return;
        setSets(items);
        setSetId(items.length ? items[0].id : NEW_SET);
      });
    return () => {
      alive = false;
    };
  }, [apiClient, tenantId]);

  const save = async () => {
    const found = caseFormErrors(form, t);
    if (setId === NEW_SET) {
      const setErrorsFound = evalSetFormErrors({ name: newName }, t);
      if (setErrorsFound.name) found.newSetName = setErrorsFound.name;
    } else if (!setId) found.setId = t('evals.save.errors.set');
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    setError('');
    try {
      let target = (sets || []).find((s) => s.id === setId);
      if (setId === NEW_SET) target = await apiClient.createEvalSet(tenantId, { name: newName.trim(), origin: 'Playground', tags: ['playground'] });
      const item = await apiClient.createEvalCase(tenantId, target.id, caseFormToBody(form));
      const versionId = item?.setId || target.id;
      setSaved({ setId: versionId, name: target.name, version: versionId === target.id ? target.version : (target.version || 0) + 1 });
      addToast({ type: 'success', message: t('evals.toasts.caseSavedTo', { name: target.name }) });
    } catch (e) {
      const perField = evalFieldErrors(t, e);
      if (perField) setErrors(perField);
      setError(`${errorMessage(t, e)} ${errorDetail(t, e)}`.trim());
    } finally {
      setBusy(false);
    }
  };

  const go = (to) => {
    onClose?.();
    navigate(to);
  };

  const setOptions = [...(sets || []).map((s) => ({ value: s.id, label: t('evals.run.setOption', { name: s.name, version: s.version }) })), { value: NEW_SET, label: t('evals.save.newSet') }];

  return (
    <Modal
      open
      size="large"
      onClose={() => !busy && onClose?.()}
      title={t('evals.save.title')}
      footer={
        saved ? (
          <>
            <button type="button" className="button-secondary" onClick={onClose} {...tip(t('tips.evals.save.done'))}>
              {t('evals.save.done')}
            </button>
            <button type="button" className="button-secondary" onClick={() => go(pathFor('evaluations', saved.setId))} data-testid="eval-save-open-set" {...tip(t('tips.evals.save.openSet'))}>
              {t('evals.save.openSet')}
            </button>
            <button type="button" className="button-primary" onClick={() => go(pathFor('evaluations', saved.setId, { run: '1', target: 'AgentRevision', agent: agentName || '' }))} data-testid="eval-save-run-set" {...tip(t('tips.evals.save.runSet'))}>
              {t('evals.save.runSet')}
            </button>
          </>
        ) : (
          <>
            <button type="button" className="button-secondary" onClick={onClose} disabled={busy} {...tip(t('tips.modal.cancelForm'))}>
              {t('common.actions.cancel')}
            </button>
            <button type="button" className="button-primary" onClick={save} disabled={busy || sets === null} data-testid="eval-save-submit" {...tip(t('tips.evals.save.submit'))}>
              {busy ? t('common.generic.saving') : t('evals.save.submit')}
            </button>
          </>
        )
      }
    >
      {saved ? (
        <div className="flex-col gap-md" data-testid="eval-save-done">
          <p>{t('evals.save.saved', { name: saved.name, version: saved.version })}</p>
          <p className="text-muted">{t('evals.save.runHint', { agent: agentName || t('evals.save.entryAgent') })}</p>
        </div>
      ) : (
        <div className="flex-col gap-md" data-testid="eval-save-form">
          <p className="text-muted">{t('evals.save.intro')}</p>
          <div className="form-grid">
            <div className={`field ${errors.setId ? 'has-error' : ''}`}>
              <label htmlFor="eval-save-set" {...tip(t('tips.evals.save.set'))}>
                {t('evals.save.set')}
              </label>
              <select id="eval-save-set" value={setId} disabled={busy || sets === null} onChange={(e) => setSetId(e.target.value)} data-testid="eval-save-set" {...tip(t('tips.evals.save.set'))}>
                {sets === null && <option value="">{t('common.generic.loading')}</option>}
                {setOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {errors.setId && (
                <div className="field-error" role="alert">
                  {errors.setId}
                </div>
              )}
            </div>
            {setId === NEW_SET && (
              <div className={`field ${errors.newSetName || errors.name ? 'has-error' : ''}`}>
                <label htmlFor="eval-save-new-name" {...tip(t('tips.evals.save.newSetName'))}>
                  {t('evals.save.newSetName')}
                  <span className="required-mark" aria-hidden="true"> *</span>
                </label>
                <input id="eval-save-new-name" type="text" maxLength={EVAL_LIMITS.nameMax} value={newName} disabled={busy} placeholder="playground-regressions" onChange={(e) => setNewName(e.target.value)} data-testid="eval-save-new-name" {...tip(t('tips.evals.save.newSetName'))} />
                <div className="field-hint">{t('evals.save.newSetHint')}</div>
                {errors.newSetName && (
                  <div className="field-error" role="alert">
                    {errors.newSetName}
                  </div>
                )}
              </div>
            )}
          </div>
          <FormFields fields={caseFields(t)} data={form} errors={errors} disabled={busy} onChange={setForm} idPrefix="eval-save" />
          <EvalChecksEditor checks={form.checks} errors={errors} disabled={busy} onChange={(checks) => setForm((f) => ({ ...f, checks }))} idPrefix="eval-save-check" />
          {runId && <p className="text-muted">{t('evals.case.fromRun', { id: runId })}</p>}
          {error && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
