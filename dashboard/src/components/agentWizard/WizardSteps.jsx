import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FormField } from '../FormFields';
import { ErrorBanner, LoadingState } from '../States';
import { Badge } from '../StatusBadge';
import { SendIcon } from '../Icons';
import { tip } from '../Tooltip';
import SecretKindGuide from '../SecretKindGuide';
import StudioChatPanel from '../studio/StudioChatPanel';
import ChatTurn from '../studio/ChatTurn';
import StudioLink from '../studio/StudioLink';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { pathFor } from '../../config/navConfig';
import useChatTranscript from '../../hooks/useChatTranscript';
import { errorMessage, errorMessageWithDetail } from '../../utils/errors';
import { enumLabel, enumOptions } from '../../utils/enums';
import { composerKeyDown } from '../../utils/composerKeys';
import { CREDENTIAL_KINDS, needsCredential, suggestedCredential } from '../../utils/architect';
import { conversationStorageKey, readStored } from '../../utils/studio';
import { MULTILINE_SECRET_KINDS } from '../../utils/secretGuides';
import { defaultSecretKind, deploymentPlan, devDeploymentBody, diffProblems, draftAgentNames, draftCounts, slug, testTarget, withCredential, wizardArchitectName } from '../../utils/agentWizard';

const page = { pageNumber: 1, pageSize: 1000 };

/** The step's heading and what it is for. */
function StepIntro({ name }) {
  const { t } = useTranslation();
  return (
    <div className="wizard-intro">
      <h2 className="section-title">{t(`views.agentWizard.${name}.title`)}</h2>
      <p className="text-muted">{t(`views.agentWizard.${name}.intro`)}</p>
    </div>
  );
}

/** Back and next buttons at the bottom of a step. */
function StepNav({ back, next, nextLabel, nextDisabled = '', busy = false, testId = 'wizard-next' }) {
  const { t } = useTranslation();
  return (
    <div className="wizard-nav">
      {back ? (
        <button type="button" className="button-secondary" onClick={back} data-testid="wizard-back" {...tip(t('tips.views.agentWizard.back'))}>
          {t('views.agentWizard.back')}
        </button>
      ) : (
        <span />
      )}
      {next && (
        <button type="button" className="button-primary" onClick={() => !nextDisabled && !busy && next()} aria-disabled={nextDisabled || busy ? 'true' : undefined} data-testid={testId} {...tip(nextDisabled || t('tips.views.agentWizard.next'))}>
          {busy ? t('views.agentWizard.working') : nextLabel}
        </button>
      )}
    </div>
  );
}

/** Step 1: name the project and say what the agents should do, or continue a draft. */
export function GoalStep({ draft, state, update, go, onCreated }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const navigate = useNavigate();
  const [title, setTitle] = useState(draft?.title || '');
  const [goal, setGoal] = useState(state.goal || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [drafts, setDrafts] = useState([]);

  useEffect(() => {
    if (!apiClient || draft) return;
    apiClient
      .listStudioDrafts(tenantId, { mine: true, pageNumber: 1, pageSize: 10, status: 'Open' })
      .then((r) => setDrafts(r.items || []))
      .catch(() => setDrafts([]));
  }, [apiClient, tenantId, draft]);

  const missing = !title.trim() ? t('tips.views.agentWizard.goal.needTitle') : !goal.trim() ? t('tips.views.agentWizard.goal.needGoal') : '';
  const next = async () => {
    if (draft) {
      update({ goal: goal.trim() });
      go('access');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const created = await apiClient.createStudioDraft(tenantId, { title: title.trim() });
      onCreated(created, goal.trim());
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <StepIntro name="goal" />
      <div className="form-grid">
        <FormField id="wizard-title" field={{ name: 'title', type: 'text', label: t('views.agentWizard.goal.name'), required: true, disabled: !!draft, placeholder: t('views.agentWizard.goal.namePlaceholder'), tip: t('tips.views.agentWizard.goal.name'), hint: t('views.agentWizard.goal.nameHint') }} value={title} onChange={setTitle} disabled={!!draft} />
        <FormField
          id="wizard-goal"
          field={{ name: 'goal', type: 'textarea', rows: 6, span: 'full', label: t('views.agentWizard.goal.goal'), required: true, placeholder: t('views.agentWizard.goal.goalPlaceholder'), tip: t('tips.views.agentWizard.goal.goal'), hint: t('views.agentWizard.goal.goalHint') }}
          value={goal}
          onChange={setGoal}
        />
      </div>
      {error && <ErrorBanner message={errorMessage(t, error)} />}
      <StepNav next={next} nextLabel={t('views.agentWizard.goal.next')} nextDisabled={missing} busy={busy} />
      {!draft && drafts.length > 0 && (
        <div className="wizard-resume" data-testid="wizard-resume">
          <div className="form-section-title">{t('views.agentWizard.goal.resume')}</div>
          <ul className="wizard-list">
            {drafts.map((d) => (
              <li key={d.id}>
                <button type="button" className="button-link" onClick={() => navigate(pathFor('agentWizard', d.id))} {...tip(t('tips.views.agentWizard.goal.resume'))}>
                  {d.title}
                </button>{' '}
                <span className="text-muted">{new Date(d.lastUpdateUtc || d.createdUtc).toLocaleString(i18n.language)}</span>
              </li>
            ))}
          </ul>
          <StudioLink to={pathFor('studio')} className="button button-secondary button-sm wizard-all-drafts" testId="wizard-all-drafts" tipText={t('tips.views.agentWizard.goal.allDrafts')}>
            {t('views.agentWizard.goal.allDrafts')}
          </StudioLink>
        </div>
      )}
    </>
  );
}

/**
 * Step 2: the harness the agents run on, its model, and the credential it signs in with. A credential can be added
 * here, with the instructions for getting one. Continuing sets up the wizard's architect on the same harness and
 * credential (one per harness profile, reused).
 */
export function AccessStep({ state, update, go }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const [profiles, setProfiles] = useState(null);
  const [secrets, setSecrets] = useState([]);
  const [profileId, setProfileId] = useState(state.harnessProfileId || '');
  const [model, setModel] = useState(state.model || '');
  const [secretId, setSecretId] = useState(state.credentialSecretId || '');
  const [adding, setAdding] = useState(false);
  const [newSecret, setNewSecret] = useState({ name: '', kind: '', value: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const loadSecrets = useCallback(
    () =>
      apiClient
        .listSecrets(tenantId, page)
        .then((r) => {
          const list = (r.items || []).filter((s) => s.active !== false);
          setSecrets(list);
          return list;
        })
        .catch(() => []),
    [apiClient, tenantId]
  );

  useEffect(() => {
    if (!apiClient) return;
    apiClient
      .listHarnessProfiles(tenantId, { ...page, includeBuiltIn: true })
      .then((r) => {
        const list = r.items || [];
        setProfiles(list);
        if (!state.harnessProfileId && list.length) setProfileId((list.find((p) => p.harnessType === 'ClaudeCode') || list[0]).id);
      })
      .catch(() => setProfiles([]));
    loadSecrets();
  }, [apiClient, tenantId, loadSecrets, state.harnessProfileId]);

  const profile = (profiles || []).find((p) => p.id === profileId) || null;
  const kinds = profile ? CREDENTIAL_KINDS[profile.harnessType] || [] : [];
  const needs = !!profile && needsCredential(profile.harnessType);
  const fitting = secrets.filter((s) => kinds.includes(s.kind));

  // Suggest a credential that fits the harness when none is chosen yet.
  useEffect(() => {
    if (!profile || secretId) return;
    const suggested = suggestedCredential(secrets, profile.harnessType);
    if (suggested) setSecretId(suggested.id);
  }, [profile, secrets, secretId]);

  const startAdding = () => {
    setAdding(true);
    setNewSecret({ name: `${slug(profile?.name)}-key`, kind: defaultSecretKind(profile?.harnessType), value: '' });
  };

  const saveSecret = async () => {
    setBusy(true);
    setError(null);
    try {
      const created = await apiClient.createSecret(tenantId, { name: newSecret.name.trim(), kind: newSecret.kind, value: newSecret.value, active: true });
      await loadSecrets();
      setSecretId(created.id);
      setAdding(false);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  const missing = !profile ? t('tips.views.agentWizard.access.needProfile') : needs && !secretId ? t('tips.views.agentWizard.access.needCredential') : '';

  // Set up the wizard's architect: same harness, model, and credential; the guided architect prompt.
  const next = async () => {
    setBusy(true);
    setError(null);
    try {
      const name = wizardArchitectName(profile);
      const found = await apiClient.listArchitects(tenantId, { pageNumber: 1, pageSize: 50, search: name });
      const existing = (found.items || []).find((a) => a.name === name);
      const body = { name, harnessProfileId: profile.id, model: model.trim() || null, active: true, credentialSecretId: secretId || '' };
      const architect = existing
        ? await apiClient.updateArchitect(tenantId, existing.id, body)
        : await apiClient.createArchitect(tenantId, { ...body, description: t('views.agentWizard.access.architectDescription'), architectPromptTemplateId: 'builtin/agent-architect-guided' });
      const secret = secrets.find((s) => s.id === secretId);
      update({ harnessProfileId: profile.id, profileName: profile.name, model: model.trim(), credentialSecretId: secretId, secretName: secret?.name || '', architectId: architect.id });
      go('design');
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  if (!profiles) return <LoadingState />;
  const list = (k) => new Intl.ListFormat(i18n.language, { type: 'disjunction' }).format(k);

  return (
    <>
      <StepIntro name="access" />
      <div className="form-grid">
        <FormField
          id="wizard-profile"
          field={{ name: 'harnessProfileId', type: 'select', label: t('views.agentWizard.access.harness'), required: true, options: profiles.map((p) => ({ value: p.id, label: p.name })), tip: t('tips.views.agentWizard.access.harness'), hint: t('views.agentWizard.access.harnessHint') }}
          value={profileId}
          onChange={(v) => {
            setProfileId(v);
            setSecretId('');
          }}
        />
        <FormField id="wizard-model" field={{ name: 'model', type: 'text', label: t('views.agentWizard.access.model'), placeholder: 'sonnet', tip: t('tips.views.agentWizard.access.model'), hint: t('views.agentWizard.access.modelHint') }} value={model} onChange={setModel} />
      </div>
      {profile && (
        <div className="wizard-credential" data-testid="wizard-credential">
          <div className="form-section-title">{t('views.agentWizard.access.credential')}</div>
          {!needs ? (
            <p className="text-muted">{t('views.agentWizard.access.noCredentialNeeded', { profile: profile.name })}</p>
          ) : (
            <>
              <p className="text-muted">{t('views.agentWizard.access.credentialIntro', { profile: profile.name, kinds: list(kinds) })}</p>
              {fitting.length > 0 && (
                <div className="wizard-choices" role="radiogroup" aria-label={t('views.agentWizard.access.credential')}>
                  {fitting.map((s) => (
                    <label key={s.id} className={`checkbox-chip${secretId === s.id ? ' selected' : ''}`} {...tip(t('tips.views.agentWizard.access.useSecret', { name: s.name }))}>
                      <input type="radio" name="wizard-secret" value={s.id} checked={secretId === s.id} onChange={() => setSecretId(s.id)} data-testid={`wizard-secret-${s.name}`} />
                      <span>
                        {s.name} <span className="text-muted">({s.kind})</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
              {!fitting.length && !adding && <div className="warning-banner" role="note">{t('views.agentWizard.access.noFittingSecret', { kinds: list(kinds) })}</div>}
              {!adding ? (
                <button type="button" className="button-secondary" onClick={startAdding} data-testid="wizard-add-secret" {...tip(t('tips.views.agentWizard.access.addSecret'))}>
                  {t('views.agentWizard.access.addSecret')}
                </button>
              ) : (
                <div className="wizard-new-secret" data-testid="wizard-new-secret">
                  <SecretKindGuide kind={newSecret.kind} />
                  <div className="form-grid">
                    <FormField id="wizard-secret-name" field={{ name: 'name', type: 'text', label: t('resources.secrets.fields.name'), required: true, tip: t('tips.views.agentWizard.access.secretName') }} value={newSecret.name} onChange={(v) => setNewSecret({ ...newSecret, name: v })} />
                    <FormField
                      id="wizard-secret-kind"
                      field={{ name: 'kind', type: 'select', label: t('resources.secrets.fields.kind'), required: true, options: enumOptions(t, 'secretKind').filter((o) => kinds.includes(o.value)), tip: t('tips.resources.secrets.kind') }}
                      value={newSecret.kind}
                      onChange={(v) => setNewSecret({ ...newSecret, kind: v })}
                    />
                    <FormField
                      id="wizard-secret-value"
                      field={{ name: 'value', type: MULTILINE_SECRET_KINDS.includes(newSecret.kind) ? 'code' : 'password', rows: 8, span: 'full', label: t('resources.secrets.fields.value'), required: true, tip: t('tips.resources.secrets.value') }}
                      value={newSecret.value}
                      onChange={(v) => setNewSecret({ ...newSecret, value: v })}
                    />
                  </div>
                  <div className="flex gap-sm">
                    <button type="button" className="button-primary" onClick={() => newSecret.name.trim() && newSecret.value && !busy && saveSecret()} aria-disabled={!newSecret.name.trim() || !newSecret.value || busy ? 'true' : undefined} data-testid="wizard-save-secret" {...tip(t('tips.views.agentWizard.access.saveSecret'))}>
                      {t('views.agentWizard.access.saveSecret')}
                    </button>
                    <button type="button" className="button-secondary" onClick={() => setAdding(false)} {...tip(t('tips.modal.cancelForm'))}>
                      {t('common.actions.cancel')}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
      {error && <ErrorBanner message={errorMessageWithDetail(t, error)} />}
      <StepNav back={() => go('goal')} next={next} nextLabel={t('views.agentWizard.access.next')} nextDisabled={missing || (adding ? t('tips.views.agentWizard.access.finishSecret') : '')} busy={busy} />
    </>
  );
}

/** What the draft holds so far, beside the chat. */
function DraftContents({ draft }) {
  const { t } = useTranslation();
  const counts = draftCounts(draft);
  const agents = draftAgentNames(draft);
  return (
    <aside className="wizard-contents" data-testid="wizard-contents" aria-label={t('views.agentWizard.design.contents')}>
      <div className="form-section-title">{t('views.agentWizard.design.contents')}</div>
      {Object.keys(counts).length === 0 ? (
        <p className="text-muted">{t('views.agentWizard.design.empty')}</p>
      ) : (
        <>
          <ul className="wizard-list wizard-counts">
            {Object.entries(counts).map(([kind, n]) => (
              <li key={kind}>
                <Badge tone="info">{n}</Badge> {enumLabel(t, 'resourceType', kind)}
              </li>
            ))}
          </ul>
          {agents.length > 0 && (
            <>
              <div className="form-section-title">{t('views.agentWizard.design.agents')}</div>
              <ul className="wizard-list">
                {agents.map((n) => (
                  <li key={n}>
                    <code>{n}</code>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </aside>
  );
}

/** Step 3: chat with the architect, which builds the agents in the draft. */
export function DesignStep({ draft, state, update, go, reload }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const [architect, setArchitect] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!apiClient || !state.architectId) return;
    apiClient.getArchitect(tenantId, state.architectId).then(setArchitect).catch(setError);
  }, [apiClient, tenantId, state.architectId]);

  // The message the composer starts with, fixed when the step opens: the problems from review, or the goal before the
  // first turn. Keeping it fixed keeps the chat mounted while a turn runs.
  const [first] = useState(() => {
    if (state.fixMessage) return state.fixMessage;
    const started = !!readStored(conversationStorageKey(draft.id)) || !!draft.conversationId;
    return started ? '' : t('views.agentWizard.design.firstMessage', { goal: state.goal || draft.title, profile: state.profileName || '', secret: state.secretName || '-' });
  });
  const agents = draftAgentNames(draft);

  const onTurnFinished = useCallback(() => {
    if (state.fixMessage) update({ fixMessage: '' });
    reload();
  }, [state.fixMessage, update, reload]);

  if (error) return <ErrorBanner message={errorMessage(t, error)} />;
  if (!architect) return <LoadingState />;
  return (
    <>
      <StepIntro name="design" />
      <div className="wizard-design">
        <StudioChatPanel draft={draft} architects={[architect]} architectId={architect.id} onArchitectChange={() => {}} hideArchitectControls initialMessage={first} title={t('views.agentWizard.design.chatTitle', { architect: architect.name })} onTurnFinished={onTurnFinished} />
        <DraftContents draft={draft} />
      </div>
      <StepNav back={() => go('access')} next={() => go('review')} nextLabel={t('views.agentWizard.design.next')} nextDisabled={agents.length ? '' : t('tips.views.agentWizard.design.needAgent')} />
    </>
  );
}

/** Step 4: validate the draft; send problems back to the architect. */
export function ReviewStep({ draft, update, go }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const [diff, setDiff] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const validate = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const d = await apiClient.validateStudioDraft(tenantId, draft.id);
      setDiff(d);
      update({ validVersion: d.valid ? draft.version : null });
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }, [apiClient, tenantId, draft.id, draft.version, update]);

  useEffect(() => {
    if (draft.status === 'Open') validate();
  }, [validate, draft.status]);

  const problems = diffProblems(diff);
  const askToFix = () => {
    update({ fixMessage: t('views.agentWizard.review.fixMessage', { problems: problems.map((p) => `- ${p}`).join('\n') }) });
    go('design');
  };

  if (draft.status !== 'Open')
    return (
      <>
        <StepIntro name="review" />
        <div className="info-banner" role="status">
          {t(`views.agentWizard.review.status.${draft.status}`, { defaultValue: draft.status })}
        </div>
        <StepNav back={() => go('design')} next={() => go('approve')} nextLabel={t('views.agentWizard.review.next')} />
      </>
    );

  return (
    <>
      <StepIntro name="review" />
      {error && <ErrorBanner message={errorMessageWithDetail(t, error)} />}
      {!diff ? (
        <LoadingState />
      ) : (
        <>
          <table className="data-table wizard-review" data-testid="wizard-review">
            <thead>
              <tr>
                <th>{t('views.agentWizard.review.kind')}</th>
                <th>{t('views.agentWizard.review.name')}</th>
                <th>{t('views.agentWizard.review.change')}</th>
                <th>{t('views.agentWizard.review.note')}</th>
              </tr>
            </thead>
            <tbody>
              {diff.items.map((i) => (
                <tr key={`${i.kind}/${i.name}`} data-change={i.change}>
                  <td>{enumLabel(t, 'resourceType', i.kind)}</td>
                  <td>
                    <code>{i.name}</code>
                  </td>
                  <td>
                    <Badge tone={i.change === 'Failed' || i.stale ? 'danger' : i.change === 'Unchanged' ? 'neutral' : 'success'}>{enumLabel(t, 'studioDiffChange', i.change)}</Badge>
                  </td>
                  <td>{i.message || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {problems.length > 0 ? (
            <div className="warning-banner wizard-problems" role="alert" data-testid="wizard-problems">
              <div>{t('views.agentWizard.review.problems', { count: problems.length })}</div>
              <button type="button" className="button-primary button-sm" onClick={askToFix} data-testid="wizard-ask-fix" {...tip(t('tips.views.agentWizard.review.askFix'))}>
                {t('views.agentWizard.review.askFix')}
              </button>
            </div>
          ) : (
            <div className="info-banner" role="status" data-testid="wizard-valid">
              {t('views.agentWizard.review.valid')}
            </div>
          )}
        </>
      )}
      <div className="flex gap-sm">
        <button type="button" className="button-secondary" onClick={() => !busy && validate()} aria-disabled={busy ? 'true' : undefined} data-testid="wizard-validate" {...tip(t('tips.views.agentWizard.review.validate'))}>
          {t('views.agentWizard.review.validate')}
        </button>
      </div>
      <StepNav back={() => go('design')} next={() => go('approve')} nextLabel={t('views.agentWizard.review.next')} nextDisabled={diff?.valid ? '' : t('tips.views.agentWizard.review.needValid')} />
    </>
  );
}

/**
 * Give every agent the draft created a working dev deployment: create one on the chosen harness with the credential
 * bound, or bind the credential to the dev deployment the architect drafted. Returns the plan with what was done.
 */
async function prepareDeployments(apiClient, tenantId, draft, state) {
  const agents = [];
  for (const name of draftAgentNames(draft)) {
    try {
      agents.push(await apiClient.getAgent(tenantId, name));
    } catch {
      /* an agent the draft deletes or renamed */
    }
  }
  const all = (await apiClient.listDeployments(tenantId, page)).items || [];
  const plan = deploymentPlan(agents, all, state.credentialSecretId);
  const taken = all.map((d) => d.name);
  const results = [];
  for (const item of plan) {
    if (item.action === 'create') {
      const body = devDeploymentBody(item.agent, state, taken);
      taken.push(body.name);
      results.push({ ...item, deployment: await apiClient.createDeployment(tenantId, body) });
    } else if (item.action === 'bind') {
      const current = await apiClient.getDeployment(tenantId, item.deployment.id);
      results.push({ ...item, deployment: await apiClient.updateDeployment(tenantId, current.id, withCredential(current, state.credentialSecretId)) });
    } else {
      results.push(item);
    }
  }
  return results;
}

/**
 * Step 5: approve the draft and apply it (or wait for someone allowed to approve), then give every new agent a dev
 * deployment on the chosen harness with the credential bound.
 */
export function ApproveStep({ draft, state, update, go, reload }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const [phase, setPhase] = useState(draft.status === 'Applied' ? (state.deploymentsReady ? 'done' : 'deploy') : draft.status === 'PendingApproval' ? 'pending' : 'ready');
  const [approvalId, setApprovalId] = useState(draft.approvalId || null);
  const [results, setResults] = useState(state.deployments || []);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const deploy = useCallback(
    async (applied) => {
      setPhase('deploy');
      setError(null);
      try {
        const done = await prepareDeployments(apiClient, tenantId, applied, state);
        setResults(done);
        update({ deploymentsReady: true, deployments: done.map((r) => ({ agent: { id: r.agent.id, name: r.agent.name }, action: r.action, deployment: { id: r.deployment.id, name: r.deployment.name } })) });
        setPhase('done');
      } catch (e) {
        setError(e);
        setPhase('deployFailed');
      }
    },
    [apiClient, tenantId, state, update]
  );

  // Someone else has to decide: watch the approval until it is decided.
  useEffect(() => {
    if (phase !== 'waiting' || !approvalId) return undefined;
    const id = setInterval(async () => {
      try {
        const a = await apiClient.getApproval(tenantId, approvalId);
        if (a.status === 'Pending') return;
        const d = await reload();
        if (a.status === 'Approved' && d?.status === 'Applied') deploy(d);
        else setPhase('ready');
      } catch {
        /* keep watching */
      }
    }, 5000);
    return () => clearInterval(id);
  }, [phase, approvalId, apiClient, tenantId, reload, deploy]);

  // Applied earlier but the deployments were not prepared (the page was closed in between): finish now.
  useEffect(() => {
    if (phase === 'deploy' && draft.status === 'Applied' && !busy && !results.length) deploy(draft);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const approve = async () => {
    setBusy(true);
    setError(null);
    try {
      let id = approvalId;
      if (draft.status === 'Open') {
        const approval = await apiClient.requestStudioDraftApply(tenantId, draft.id, draft.version);
        id = approval.id;
        setApprovalId(id);
      }
      try {
        await apiClient.decideApproval(tenantId, id, { decision: 'Allow', reason: t('views.agentWizard.approve.reason') });
      } catch (e) {
        if (e?.status === 403) {
          setPhase('waiting');
          return;
        }
        throw e;
      }
      const applied = await reload();
      await deploy(applied);
    } catch (e) {
      setError(e);
      await reload();
      setPhase(e?.code === 'DraftInvalid' || e?.code === 'DraftStale' ? 'failed' : 'ready');
    } finally {
      setBusy(false);
    }
  };

  const askToFix = () => {
    update({ fixMessage: t('views.agentWizard.review.fixMessage', { problems: errorMessageWithDetail(t, error) }) });
    go('design');
  };

  const counts = draftCounts(draft);
  return (
    <>
      <StepIntro name="approve" />
      {(phase === 'ready' || phase === 'pending' || phase === 'failed') && (
        <div className="wizard-approve" data-testid="wizard-approve">
          <p>{t('views.agentWizard.approve.summary', { agents: counts.Agent || 0, total: Object.values(counts).reduce((a, b) => a + b, 0), profile: state.profileName || '', secret: state.secretName || '-' })}</p>
          <ul className="plain-list">
            <li>{t('views.agentWizard.approve.will1')}</li>
            <li>{t('views.agentWizard.approve.will2')}</li>
            <li>{t('views.agentWizard.approve.will3')}</li>
          </ul>
          {phase !== 'failed' && (
            <button type="button" className="button-primary" onClick={() => !busy && approve()} aria-disabled={busy ? 'true' : undefined} data-testid="wizard-approve-button" {...tip(t('tips.views.agentWizard.approve.approve'))}>
              {busy ? t('views.agentWizard.working') : t('views.agentWizard.approve.approve')}
            </button>
          )}
        </div>
      )}
      {phase === 'waiting' && (
        <div className="info-banner" role="status" data-testid="wizard-waiting">
          <span>{t('views.agentWizard.approve.waiting')}</span>{' '}
          <StudioLink to={pathFor('approvals', approvalId)} tipText={t('tips.views.agentWizard.approve.openApproval')}>
            {t('views.agentWizard.approve.openApproval')}
          </StudioLink>
        </div>
      )}
      {(phase === 'deploy' || (phase === 'done' && !results.length)) && <LoadingState />}
      {error && (
        <div className="error-banner wizard-error" role="alert" data-testid="wizard-approve-error">
          <div>{errorMessageWithDetail(t, error)}</div>
          {phase === 'failed' && (
            <button type="button" className="button-primary button-sm" onClick={askToFix} data-testid="wizard-ask-fix" {...tip(t('tips.views.agentWizard.review.askFix'))}>
              {t('views.agentWizard.review.askFix')}
            </button>
          )}
          {phase === 'deployFailed' && (
            <button type="button" className="button-secondary button-sm" onClick={() => deploy(draft)} data-testid="wizard-retry-deploy" {...tip(t('tips.views.agentWizard.approve.retry'))}>
              {t('views.agentWizard.approve.retry')}
            </button>
          )}
        </div>
      )}
      {phase === 'done' && results.length > 0 && (
        <div className="wizard-done" data-testid="wizard-approved">
          <div className="info-banner" role="status">
            {t('views.agentWizard.approve.done')}
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('views.agentWizard.approve.agent')}</th>
                <th>{t('views.agentWizard.approve.deployment')}</th>
                <th>{t('views.agentWizard.approve.what')}</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.agent.id}>
                  <td>
                    <StudioLink to={pathFor('agents', r.agent.id)} tipText={t('tips.views.agentWizard.approve.openAgent')}>
                      {r.agent.name}
                    </StudioLink>
                  </td>
                  <td>
                    <code>{r.deployment?.name}</code>
                  </td>
                  <td>{t(`views.agentWizard.approve.actions.${r.action}`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <StepNav back={() => go('review')} next={phase === 'done' ? () => go('test') : null} nextLabel={t('views.agentWizard.approve.next')} />
    </>
  );
}

/** Step 6: talk to the new agent (the app's entry agent) on its dev deployment, then go on from there. */
export function TestStep({ draft, state, update }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const navigate = useNavigate();
  const [target, setTarget] = useState(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!apiClient) return;
    (async () => {
      const graph = await apiClient.getStudioDraftGraph(tenantId, draft.id).catch(() => null);
      const { agent: name, app } = testTarget(draft, graph);
      if (!name) return;
      try {
        const agent = await apiClient.getAgent(tenantId, name);
        const ready = (state.deployments || []).find((d) => d.agent.id === agent.id);
        setTarget({ agent, app, deploymentId: ready?.deployment?.id || null });
      } catch (e) {
        setError(e);
      }
    })();
  }, [apiClient, tenantId, draft, state.deployments]);

  const conversationId = state.testConversationId || null;
  const { turns, pendingActive, live, turnsRef, onTurnsScroll, startTurn } = useChatTranscript({ apiClient, tenantId, conversationId });

  const send = async () => {
    const text = message.trim();
    if (!text || sending || pendingActive || !target) return;
    setSending(true);
    setError(null);
    try {
      const body = conversationId ? { input: text, conversationId } : { input: text, deploymentId: target.deploymentId || undefined, startConversation: true };
      const created = await apiClient.invokeAgent(tenantId, target.agent.id, body, { wait: false });
      const run = created?.run || created;
      setMessage('');
      if (!conversationId && run?.conversationId) update({ testConversationId: run.conversationId });
      startTurn(run, text);
    } catch (e) {
      setError(e);
    } finally {
      setSending(false);
    }
  };

  const links = useMemo(
    () => [
      target && { to: pathFor('agents', target.agent.id), label: t('views.agentWizard.test.openAgent', { name: target.agent.name }), testId: 'wizard-open-agent' },
      target?.app && { to: pathFor('apps', null, { search: target.app }), label: t('views.agentWizard.test.openApp', { name: target.app }), testId: 'wizard-open-app' },
      target && { to: pathFor('invoke', null, { agentId: target.agent.id, deploymentId: target.deploymentId || undefined }), label: t('views.agentWizard.test.openInvoke'), testId: 'wizard-open-invoke' }
    ].filter(Boolean),
    [target, t]
  );

  return (
    <>
      <StepIntro name="test" />
      {target && <p className="text-muted">{t('views.agentWizard.test.talkingTo', { name: target.agent.name })}</p>}
      <div className="chat-transcript" ref={turnsRef} onScroll={onTurnsScroll} data-testid="wizard-test-turns">
        {turns.length === 0 ? <div className="text-muted">{t('views.agentWizard.test.empty')}</div> : turns.map((r) => <ChatTurn key={r.id} run={r} live={live[r.id] || null} architectName={target?.agent.name || ''} />)}
      </div>
      <div className="field">
        <label htmlFor="wizard-test-message" {...tip(t('tips.views.agentWizard.test.message'))}>
          {t('views.agentWizard.test.message')}
        </label>
        <textarea id="wizard-test-message" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => composerKeyDown(e, send, setMessage)} data-testid="wizard-test-message" {...tip(t('tips.views.agentWizard.test.message'))} />
        <div className="field-hint">{t('components.studio.chat.keysHint')}</div>
      </div>
      {error && <ErrorBanner message={errorMessageWithDetail(t, error)} />}
      <div className="flex gap-sm items-center">
        <button type="button" className="button-primary" onClick={send} disabled={sending || pendingActive || !message.trim() || !target} data-testid="wizard-test-send" {...tip(t('tips.views.agentWizard.test.send'))}>
          <SendIcon size={14} /> {t('components.studio.chat.send')}
        </button>
      </div>
      <p className="chat-disclaimer">{t('components.studio.chat.disclaimer')}</p>
      <div className="wizard-finish" data-testid="wizard-finish">
        <div className="form-section-title">{t('views.agentWizard.test.next')}</div>
        <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
          {links.map((l) => (
            <StudioLink key={l.testId} to={l.to} className="button button-secondary" testId={l.testId} tipText={l.label}>
              {l.label}
            </StudioLink>
          ))}
          <button type="button" className="button-secondary" onClick={() => navigate(pathFor('agentWizard', 'new'))} data-testid="wizard-another" {...tip(t('tips.views.agentWizard.test.another'))}>
            {t('views.agentWizard.test.another')}
          </button>
        </div>
      </div>
    </>
  );
}
