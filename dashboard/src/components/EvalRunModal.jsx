import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import FormFields from './FormFields';
import { tip } from './Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { EVAL_LIMITS } from '../utils/constants';
import { enumOptions } from '../utils/enums';
import { errorMessage, errorDetail } from '../utils/errors';
import { evalFieldErrors } from '../utils/evalErrors';
import { blankEvalRun, evalRunFormErrors, evalRunFormToBody } from '../utils/evaluations';

const safeList = (promise) => promise.then((r) => r.items || []).catch(() => []);

/** The fields of the run form for the pick lists loaded so far. */
export function evalRunFields(t, { sets = null, deployments = [], agents = [] } = {}, form = {}) {
  const f = (name, type, extra = {}) => ({ name, type, label: t(`evals.run.fields.${name}`), tip: t(`tips.evals.run.${name}`), ...extra });
  const fields = [];
  if (sets) fields.push(f('setId', 'select', { required: true, options: sets.map((s) => ({ value: s.id, label: t('evals.run.setOption', { name: s.name, version: s.version }) })), hint: t('evals.run.hints.setId') }));
  fields.push(f('targetType', 'select', { required: true, options: enumOptions(t, 'evalRunTarget'), hint: t('evals.run.hints.targetType') }));
  fields.push(f('deploymentId', 'select', { noneLabel: t('evals.run.chooseDeployment'), options: deployments.map((d) => ({ value: d.id, label: d.environment ? `${d.name} (${d.environment})` : d.name })), showIf: (d) => d.targetType === 'Deployment' }));
  // An agent the lists do not hold yet (a playground agent named before the lists load) stays selectable by name.
  const agentOptions = agents.map((a) => ({ value: a.id, label: a.name }));
  if (form.agentId && !agentOptions.some((o) => o.value === form.agentId)) agentOptions.push({ value: form.agentId, label: form.agentId });
  fields.push(f('agentId', 'select', { noneLabel: t('evals.run.chooseAgent'), options: agentOptions, showIf: (d) => d.targetType === 'AgentRevision', hint: t('evals.run.hints.agentId') }));
  fields.push(f('agentRevisionId', 'text', { placeholder: 'arv_...', showIf: (d) => d.targetType === 'AgentRevision', hint: t('evals.run.hints.agentRevisionId') }));
  fields.push(f('inputMode', 'select', { required: true, options: enumOptions(t, 'evalRunInputMode'), showIf: (d) => d.targetType === 'Deployment', hint: t('evals.run.hints.inputMode') }));
  fields.push(f('recentInputCount', 'number', { min: 1, max: EVAL_LIMITS.recentInputsMax, step: 1, showIf: (d) => d.targetType === 'Deployment' && d.inputMode === 'RecentInputs', hint: t('evals.run.hints.recentInputCount', { max: EVAL_LIMITS.recentInputsMax }) }));
  fields.push(f('thresholdPercent', 'number', { min: 0, max: 100, step: 'any', placeholder: t('evals.run.placeholders.thresholdPercent'), hint: t('evals.run.hints.thresholdPercent') }));
  fields.push(f('budgetUsd', 'number', { min: 0, max: EVAL_LIMITS.budgetMax, step: 'any', placeholder: t('evals.run.placeholders.budgetUsd'), hint: t('evals.run.hints.budgetUsd') }));
  return fields;
}

/**
 * Run an eval set (AA9.15): against a deployment (its cases, or its recent inputs scored by the judge) or against an
 * agent revision (the agent's draft revision by default, which is what the studio playground runs), with an optional
 * pass threshold and budget. With set it runs that version; without, the form picks one of the newest versions.
 * initial may name the target (targetType, agentId as an ID or a name, deploymentId). onStarted(evalRun) receives the
 * new eval run.
 */
export default function EvalRunModal({ set = null, initial = {}, onClose, onStarted }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const [form, setForm] = useState(() => blankEvalRun(set, initial));
  const [lists, setLists] = useState({ sets: set ? null : [], deployments: [], agents: [] });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!apiClient) return;
    let alive = true;
    const page = { pageNumber: 1, pageSize: 500 };
    Promise.all([
      set ? Promise.resolve(null) : safeList(apiClient.listEvalSets(tenantId, { ...page, latestOnly: true })),
      safeList(apiClient.listDeployments(tenantId, page)),
      safeList(apiClient.listAgents(tenantId, page))
    ]).then(([sets, deployments, agents]) => {
      if (!alive) return;
      setLists({ sets, deployments, agents });
      // A target named by name (the playground knows agent names) becomes its ID once the lists are in.
      setForm((f) => {
        const agent = agents.find((a) => a.id === f.agentId || a.name === f.agentId);
        const next = { ...f, agentId: agent ? agent.id : f.agentId };
        if (!set && !next.setId && sets?.length) next.setId = sets[0].id;
        return next;
      });
    });
    return () => {
      alive = false;
    };
  }, [apiClient, tenantId, set]);

  const start = async () => {
    const found = evalRunFormErrors(form, t);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    setError('');
    try {
      const run = await apiClient.createEvalRun(tenantId, evalRunFormToBody(form));
      addToast({ type: 'success', message: t('evals.toasts.runStarted', { name: run?.setName || set?.name || '' }) });
      onStarted?.(run);
    } catch (e) {
      const perField = evalFieldErrors(t, e);
      if (perField) setErrors(perField);
      setError(`${errorMessage(t, e)} ${errorDetail(t, e)}`.trim());
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      size="medium"
      onClose={() => !busy && onClose?.()}
      title={set ? t('evals.run.titleFor', { name: set.name, version: set.version }) : t('evals.run.title')}
      footer={
        <>
          <button type="button" className="button-secondary" onClick={onClose} disabled={busy} {...tip(t('tips.modal.cancelForm'))}>
            {t('common.actions.cancel')}
          </button>
          <button type="button" className="button-primary" onClick={start} disabled={busy} data-testid="eval-run-start" {...tip(t('tips.evals.run.start'))}>
            {busy ? t('evals.run.starting') : t('evals.run.start')}
          </button>
        </>
      }
    >
      <div className="flex-col gap-md" data-testid="eval-run-form">
        <p className="text-muted">{t('evals.run.intro')}</p>
        <FormFields fields={evalRunFields(t, lists, form)} data={form} errors={errors} disabled={busy} onChange={setForm} idPrefix="eval-run" />
        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}
