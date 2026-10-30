import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { ErrorBanner, LoadingState } from '../components/States';
import { tip } from '../components/Tooltip';
import StudioLink from '../components/studio/StudioLink';
import { GoalStep, AccessStep, DesignStep, ReviewStep, ApproveStep, TestStep } from '../components/agentWizard/WizardSteps';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { pathFor } from '../config/navConfig';
import { errorMessage } from '../utils/errors';
import { WIZARD_STEPS, draftAgentNames, readWizardState, writeWizardState } from '../utils/agentWizard';

/**
 * The agent wizard (Agents > Agents > Agent wizard): one guided path from "what should these agents do" to approved,
 * published agents with working dev deployments, without visiting other pages. Steps:
 * 1. Goal: name the project and describe what the agents should do (or continue a draft).
 * 2. Model access: choose the harness (Claude Code, Codex, ...), the model, and the credential it signs in with; an
 *    API key or token can be added right here, with instructions for getting one. The wizard sets up the architect.
 * 3. Design: chat with the architect, which builds the agents in a studio draft; the draft's contents show alongside.
 * 4. Review: validate the draft; problems go back to the architect with one click.
 * 5. Approve: approve and apply the draft in one step (or wait for someone allowed to), then give every new agent a
 *    dev deployment on the chosen harness with the credential bound.
 * 6. Try it: talk to the new agent (the app's entry agent) in dev.
 * The draft is the wizard's record: `/dashboard/agent-wizard/new` starts one, `/dashboard/agent-wizard/<draftId>`
 * continues it, and `?step=` remembers where. Choices that are not part of the draft (harness, credential, model,
 * architect, goal) are kept per draft in this browser.
 */
export default function AgentWizardView({ recordId }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isNew = !recordId || recordId === 'new';
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState(null);
  const [state, setState] = useState(() => (isNew ? {} : readWizardState(recordId)));

  const loadDraft = useCallback(() => {
    if (!apiClient || isNew) return Promise.resolve(null);
    return apiClient
      .getStudioDraft(tenantId, recordId)
      .then((d) => {
        setDraft(d);
        setError(null);
        return d;
      })
      .catch((e) => {
        setError(e);
        return null;
      });
  }, [apiClient, tenantId, recordId, isNew]);

  useEffect(() => {
    loadDraft();
  }, [loadDraft]);

  const update = useCallback(
    (patch) => {
      if (isNew) setState((s) => ({ ...s, ...patch }));
      else setState(writeWizardState(recordId, patch));
    },
    [isNew, recordId]
  );

  // Which steps can be opened: each needs the ones before it done.
  const reachable = useMemo(() => {
    const applied = draft?.status === 'Applied';
    return {
      goal: true,
      access: !isNew,
      design: !isNew && !!state.architectId,
      review: !isNew && !!state.architectId && draftAgentNames(draft).length > 0,
      approve: !isNew && (applied || draft?.status === 'PendingApproval' || (!!state.validVersion && state.validVersion === draft?.version)),
      test: !isNew && applied && !!state.deploymentsReady
    };
  }, [draft, state, isNew]);

  const requested = searchParams.get('step');
  const fallback = isNew ? 'goal' : WIZARD_STEPS.filter((s) => reachable[s]).pop() || 'goal';
  const step = WIZARD_STEPS.includes(requested) && reachable[requested] ? requested : fallback;
  const go = (next) => setSearchParams(next === 'goal' ? {} : { step: next }, { replace: false });

  const onCreated = (created, goal) => {
    writeWizardState(created.id, { goal });
    navigate(pathFor('agentWizard', created.id, { step: 'access' }));
  };

  if (!isNew && error && !draft) return <ErrorBanner message={errorMessage(t, error)} onRetry={loadDraft} />;
  if (!isNew && !draft) return <LoadingState />;

  const stepProps = { draft, state, update, go, reload: loadDraft, setDraft };

  return (
    <div className={`agent-wizard${step === 'design' ? ' agent-wizard-fill' : ''}`} data-testid="agent-wizard">
      <PageHeader
        title={t('views.agentWizard.title')}
        subtitle={draft ? t('views.agentWizard.subtitleDraft', { title: draft.title }) : t('views.agentWizard.subtitle')}
        actions={
          draft ? (
            <StudioLink to={pathFor('studio', draft.id)} className="button button-secondary" testId="wizard-advanced" tipText={t('tips.views.agentWizard.advanced')}>
              {t('views.agentWizard.advanced')}
            </StudioLink>
          ) : null
        }
      />
      <ol className="stepper wizard-stepper" aria-label={t('views.agentWizard.stepsLabel')}>
        {WIZARD_STEPS.map((s, i) => {
          const open = reachable[s];
          return (
            <li key={s}>
              <button
                type="button"
                className={`stepper-step${s === step ? ' active' : ''}${open ? '' : ' is-locked'}`}
                aria-current={s === step ? 'step' : undefined}
                aria-disabled={open ? undefined : 'true'}
                onClick={() => open && go(s)}
                data-testid={`wizard-step-${s}`}
                {...tip(open ? t(`tips.views.agentWizard.steps.${s}`) : t('tips.views.agentWizard.locked'))}
              >
                <span className="stepper-index">{i + 1}</span>
                {t(`views.agentWizard.steps.${s}`)}
              </button>
            </li>
          );
        })}
      </ol>
      <section className="panel wizard-panel" data-testid={`wizard-panel-${step}`}>
        {step === 'goal' && <GoalStep {...stepProps} onCreated={onCreated} />}
        {step === 'access' && <AccessStep {...stepProps} />}
        {step === 'design' && <DesignStep {...stepProps} />}
        {step === 'review' && <ReviewStep {...stepProps} />}
        {step === 'approve' && <ApproveStep {...stepProps} />}
        {step === 'test' && <TestStep {...stepProps} />}
      </section>
    </div>
  );
}
