// Evaluations (AA9.9, AA9.15): navigation (Autonomy > Eval sets, Eval runs, Shadow trials, Canary releases with their
// detail pages), the enum mirrors (states, origins, scorers, statuses, the new resource types, run kinds, and the
// CanaryRolledBack event), the form helpers (case and check round trip and client checks, run, shadow trial, and canary
// bodies and checks), the eval-run channel reducer, readable field codes, the eval run page with a failing case and
// its diff, the playground's Save as eval case, and the API routes.
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../i18n';
import AuthContext from '../context/AuthContext';
import AppContext from '../context/AppContext';
import ToastContext from '../context/ToastContext';
import EvalRunDetailView from '../views/EvalRunDetailView';
import SaveEvalCaseModal from '../components/SaveEvalCaseModal';
import { PAGE_VIEWS, DETAIL_VIEWS } from '../views/hubs/hubPanels';
import { findPage, pathFor } from '../config/navConfig';
import { ENUMS } from '../utils/constants';
import ApiClient from '../utils/api';
import { evalFieldErrors, EVAL_FIELD_CODES } from '../utils/evalErrors';
import { FIELD_CODES } from '../utils/errors';
import {
  applyEvalEvent,
  agreementRate,
  blankCanary,
  caseFormErrors,
  caseFormToBody,
  caseToForm,
  canaryFormErrors,
  canaryFormToBody,
  currentStep,
  effectiveScorers,
  evalRunChannel,
  evalRunFormErrors,
  evalRunFormToBody,
  evalSetFormToBody,
  needsJudge,
  resultOutcome,
  shadowTrialFormErrors,
  stepState
} from '../utils/evaluations';
import { evalCase, evalCaseResult, evalRun, canaryRelease, shadowTrial } from '../../tests/e2e/mocks.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const t = (...args) => i18n.t(...args);
const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });

beforeAll(async () => {
  await i18n.changeLanguage('en');
});

let mounted = [];
afterEach(() => {
  for (const { root, container } of mounted) {
    act(() => root.unmount());
    container.remove();
  }
  mounted = [];
  document.body.innerHTML = '';
});

function mount(element, { apiClient = {}, addToast = vi.fn() } = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter>
        <AuthContext.Provider value={{ apiClient, principal: { isAdmin: true } }}>
          <AppContext.Provider value={{ tenantId: 'default', setWizardOpen: () => {}, setTourOpen: () => {} }}>
            <ToastContext.Provider value={{ addToast }}>{element}</ToastContext.Provider>
          </AppContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );
  });
  mounted.push({ root, container });
  return { container, addToast };
}

const q = (sel) => document.body.querySelector(sel);
const qa = (sel) => [...document.body.querySelectorAll(sel)];
const setValue = (el, value) =>
  act(() => {
    const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
    el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  });

describe('navigation and enums', () => {
  it('puts the evaluation pages under Autonomy with detail routes', () => {
    for (const [id, slug] of [['evaluations', 'evaluations'], ['evalRuns', 'eval-runs'], ['shadowTrials', 'shadow-trials'], ['canaryReleases', 'canary-releases']]) {
      const page = findPage(id);
      expect(page.hub).toBe('autonomy');
      expect(page.slug).toBe(slug);
      expect(PAGE_VIEWS[id]).toBeTruthy();
      expect(DETAIL_VIEWS[id]).toBeTruthy();
      expect(pathFor(id, 'x_1')).toBe(`/dashboard/${slug}/x_1`);
    }
    expect(pathFor('evaluations', 'evs_1', { run: '1' })).toBe('/dashboard/evaluations/evs_1?run=1');
  });

  it('mirrors the server enums', () => {
    expect(ENUMS.evalScorer).toEqual(['ExactMatch', 'Contains', 'JsonSchemaValid', 'Judge']);
    expect(ENUMS.evalRunStatus).toEqual(['Pending', 'Running', 'Completed', 'Failed', 'Cancelled']);
    expect(ENUMS.canaryStatus).toEqual(['Running', 'Promoted', 'RolledBack', 'Aborted']);
    expect(ENUMS.resourceType.slice(-4)).toEqual(['EvalSet', 'EvalRun', 'ShadowTrial', 'CanaryRelease']);
    expect(ENUMS.runKind).toEqual(expect.arrayContaining(['Eval', 'Shadow']));
    expect(ENUMS.notificationEvent).toContain('CanaryRolledBack');
    expect(t('enums.canaryStatus.RolledBack')).toBe('Rolled back');
    expect(t('enums.evalScorer.JsonSchemaValid')).toBe('Valid JSON Schema');
  });
});

describe('case and set helpers', () => {
  it('round-trips a case and sends empty text as null', () => {
    const stored = evalCase('evs_0001', 2);
    const form = caseToForm(stored);
    expect(form).toMatchObject({ name: 'Over the limit', hidden: true, checks: [{ scorer: 'Contains', argument: 'manager', weight: 1 }, { scorer: 'Judge', weight: 2 }] });
    const body = caseFormToBody({ ...form, expectedText: '', checks: [{ scorer: 'Judge', argument: '', weight: '' }] });
    expect(body).toMatchObject({ inputText: 'Refund order 1002 for $900.', expectedText: null, hidden: true, checks: [{ scorer: 'Judge', argument: null, weight: 1 }] });
  });

  it('checks a case form like the server', () => {
    expect(caseFormErrors({ inputText: ' ', checks: [] }, t)).toEqual({ inputText: 'A case needs input text.' });
    const e = caseFormErrors(
      {
        inputText: 'x',
        expectedText: '',
        checks: [
          { scorer: 'Contains', argument: '', weight: 1 },
          { scorer: 'JsonSchemaValid', argument: '[1]', weight: 1 },
          { scorer: 'Judge', argument: '', weight: 101 }
        ]
      },
      t
    );
    expect(e).toEqual({ 'checks[0].argument': 'Give the text, or fill in the case\'s expected output.', 'checks[1].argument': 'Put a JSON Schema object here.', 'checks[2].weight': 'A weight is 0 to 100.' });
    expect(caseFormErrors({ inputText: 'x', expectedText: 'y', checks: [{ scorer: 'ExactMatch', argument: '', weight: 0 }] }, t)).toEqual({});
  });

  it('knows the default scorers and when a set needs a judge', () => {
    expect(effectiveScorers({ checks: [], expectedText: 'a' })).toEqual(['ExactMatch']);
    expect(effectiveScorers({ checks: [], expectedText: null })).toEqual(['Judge']);
    expect(needsJudge([evalCase('evs_0001', 1)])).toBe(false);
    expect(needsJudge([evalCase('evs_0001', 2)])).toBe(true);
  });

  it('leaves the name and origin out of a set update', () => {
    expect(evalSetFormToBody({ name: ' a ', origin: 'Evaluator', description: '', judgeAgent: ' j ', tags: ['x', 'x', ' '] }, 'create')).toEqual({ name: 'a', origin: 'Human', description: null, judgeAgent: 'j', tags: ['x'] });
    expect(evalSetFormToBody({ name: 'a', description: 'd', judgeAgent: '', tags: [] }, 'edit')).toEqual({ description: 'd', judgeAgent: '', tags: [] });
  });
});

describe('run, shadow, and canary helpers', () => {
  it('builds a run body with the threshold as 0 to 1', () => {
    expect(evalRunFormToBody({ setId: 's', targetType: 'Deployment', deploymentId: 'd', inputMode: 'RecentInputs', recentInputCount: 5, thresholdPercent: 80, budgetUsd: '' })).toEqual({ setId: 's', targetType: 'Deployment', deploymentId: 'd', inputMode: 'RecentInputs', recentInputCount: 5, threshold: 0.8, budgetUsd: null });
    expect(evalRunFormToBody({ setId: 's', targetType: 'AgentRevision', agentId: 'planner', agentRevisionId: '', inputMode: 'RecentInputs', thresholdPercent: null, budgetUsd: 1 })).toEqual({ setId: 's', targetType: 'AgentRevision', agentId: 'planner', inputMode: 'Cases', threshold: null, budgetUsd: 1 });
    expect(evalRunFormErrors({ setId: 's', targetType: 'Deployment', deploymentId: '', thresholdPercent: 101, budgetUsd: -1 }, t)).toEqual({ deploymentId: 'Pick the deployment to evaluate.', thresholdPercent: 'A threshold is 0 to 100 percent.', budgetUsd: 'A budget is 0 to 100000 USD.' });
  });

  it('checks shadow trials and canary steps like the server', () => {
    expect(shadowTrialFormErrors({ sourceDeploymentId: 'a', candidateDeploymentId: 'a', samplePercent: 0 }, t)).toEqual({ candidateDeploymentId: 'The candidate must be a different deployment from the source.', samplePercent: 'Sample 1 to 100 percent of the runs.' });
    expect(agreementRate(shadowTrial(1))).toBe(0.85);
    expect(agreementRate({ comparedCount: 0 })).toBeNull();
    const form = { ...blankCanary(), agentId: 'a', candidateDeploymentId: 'c', baselineDeploymentId: 'b' };
    expect(canaryFormErrors(form, t)).toEqual({});
    expect(canaryFormErrors({ ...form, steps: [{ weightPercent: 50 }, { weightPercent: 40 }] }, t).steps).toBe('Each step\'s percent is 1 to 100 and higher than the step before it.');
    expect(canaryFormErrors({ ...form, steps: [{ weightPercent: 50 }] }, t).steps).toBe('The last step must be 100 percent.');
    expect(canaryFormErrors({ ...form, evalSetId: 'evs_1' }, t).minEvalScorePercent).toBe('An eval gate needs both an eval set and a minimum score, or neither.');
    expect(canaryFormToBody({ ...form, evalSetId: 'evs_1', minEvalScorePercent: 75 })).toMatchObject({ evalSetId: 'evs_1', minEvalScore: 0.75, maxErrorRatePercent: 5, steps: [{ weightPercent: 10, minimumRuns: 20, minimumMinutes: 10 }, { weightPercent: 50 }, { weightPercent: 100 }] });
    const release = canaryRelease(1);
    expect(currentStep(release)).toEqual({ number: 2, total: 3, weightPercent: 50 });
    expect([0, 1, 2].map((i) => stepState(release, i))).toEqual(['done', 'current', 'pending']);
    expect(stepState(canaryRelease(2), 0)).toBe('stopped');
  });

  it('applies eval-run channel messages', () => {
    const run = { ...evalRun(2), completedCases: 0, status: 'Pending' };
    let state = { run, results: [] };
    expect(evalRunChannel(run.id)).toBe('eval-run:evr_0002');
    state = applyEvalEvent(state, { type: 'eval.case.completed', evalRunId: run.id, completedCases: 1, totalCases: 3, result: evalCaseResult(run.id, 1, 'failed') });
    state = applyEvalEvent(state, { type: 'eval.case.completed', evalRunId: run.id, completedCases: 2, totalCases: 3, result: evalCaseResult(run.id, 0, 'passed') });
    expect(state.run).toMatchObject({ status: 'Running', completedCases: 2 });
    expect(state.results.map((r) => r.order)).toEqual([0, 1]);
    expect(applyEvalEvent(state, { type: 'eval.completed', evalRunId: 'evr_other', status: 'Failed' })).toBe(state);
    state = applyEvalEvent(state, { type: 'eval.completed', evalRunId: run.id, status: 'Completed', score: 0.5, passed: false, completedCases: 3, failureReason: null });
    expect(state.run).toMatchObject({ status: 'Completed', score: 0.5, passed: false, completedCases: 3 });
    expect(resultOutcome(evalCaseResult(run.id, 2, 'errored'))).toBe('errored');
  });

  it('explains the field codes in plain words', () => {
    for (const code of EVAL_FIELD_CODES) {
      expect(FIELD_CODES).toContain(code);
      expect(t(`evals.fieldCodes.${code}`), code).not.toBe(`evals.fieldCodes.${code}`);
    }
    const err = { fields: { 'steps[2].weightPercent': 'raw', other: 'server text' }, fieldCodes: { 'steps[2].weightPercent': 'LastStepNotFull', other: 'Weird' } };
    expect(evalFieldErrors(t, err)).toEqual({ 'steps[2].weightPercent': 'The last step must be 100 percent.', other: 'server text' });
  });
});

describe('eval run page', () => {
  it('lists case results, marks the failing ones, and opens the diff with the scorer notes', async () => {
    const run = evalRun(1);
    const apiClient = {
      getEvalRun: vi.fn(async () => run),
      getEvalRunResults: vi.fn(async () => [0, 1, 2].map((k) => evalCaseResult(run.id, k))),
      listEvalCases: vi.fn(async () => [1, 2, 3].map((k) => evalCase('evs_0001', k))),
      listDeployments: vi.fn(async () => ({ items: [{ id: 'dep_0001', name: 'deployment-1' }] })),
      listAgents: vi.fn(async () => ({ items: [] }))
    };
    mount(<EvalRunDetailView recordId={run.id} />, { apiClient });
    await flush();
    await flush();
    expect(q('[data-testid="eval-run-detail"]').textContent).toContain('refund-answers v2');
    expect(q('[data-testid="eval-run-detail"]').textContent).toContain('Deployment deployment-1');
    expect(q('[data-testid="eval-run-live"]')).toBeNull();
    const rows = qa('[data-testid="eval-results-table"] tbody tr');
    expect(rows.map((r) => r.getAttribute('data-outcome'))).toEqual(['passed', 'failed', 'errored']);
    expect(rows.map((r) => r.classList.contains('eval-result-failing'))).toEqual([false, true, true]);
    await act(() => q('[data-testid="eval-result-open-1"]').click());
    const modal = q('[data-testid="eval-result"]');
    expect(modal.querySelector('[data-testid="eval-result-diff"]').textContent).toContain('This refund needs a manager.');
    expect(modal.querySelector('[data-testid="eval-result-checks"]').textContent).toContain('Refunded an amount over the limit');
    expect(modal.querySelector('[data-testid="eval-check-judge-run"]').getAttribute('href')).toBe('/dashboard/runs/run_judge_2');
  });
});

describe('save as eval case', () => {
  it('saves a playground turn to an existing set with the run as its source', async () => {
    const apiClient = {
      listEvalSets: vi.fn(async () => ({ items: [{ id: 'evs_0002', name: 'playground-regressions', version: 1, state: 'Draft' }] })),
      createEvalCase: vi.fn(async (_t, setId, body) => ({ ...body, id: 'evc_9', setId }))
    };
    const { addToast } = mount(<SaveEvalCaseModal input="Hi" output="Hello there." runId="run_play_1" agentName="planner" onClose={() => {}} />, { apiClient });
    await flush();
    expect(q('#eval-save-inputText').value).toBe('Hi');
    expect(q('#eval-save-expectedText').value).toBe('Hello there.');
    setValue(q('#eval-save-name'), 'Greeting');
    await act(() => q('[data-testid="eval-save-submit"]').click());
    await flush();
    expect(apiClient.createEvalCase).toHaveBeenCalledWith('default', 'evs_0002', expect.objectContaining({ name: 'Greeting', inputText: 'Hi', expectedText: 'Hello there.', sourceRunId: 'run_play_1', checks: [] }));
    expect(addToast).toHaveBeenCalledWith({ type: 'success', message: 'Saved the case to playground-regressions.' });
    expect(q('[data-testid="eval-save-done"]').textContent).toContain('playground-regressions v1');
  });
});

describe('API routes', () => {
  it('calls the evaluation, shadow trial, and canary routes', async () => {
    const calls = [];
    const client = new ApiClient('http://127.0.0.1:8700', 'tok');
    client._request = (method, path, opts) => {
      calls.push([method, path, opts?.body ?? null]);
      return Promise.resolve({ objects: [] });
    };
    await client.listEvalSets('default', { latestOnly: true, pageNumber: 1, pageSize: 10 });
    await client.createEvalSet('default', { name: 'a' });
    await client.updateEvalSet('default', 'evs_1', { description: 'b' });
    await client.approveEvalSet('default', 'evs_1');
    await client.createEvalCase('default', 'evs_1', { inputText: 'x' });
    await client.updateEvalCase('default', 'evs_1', 'evc_1', { inputText: 'y' });
    await client.deleteEvalCase('default', 'evs_1', 'evc_1');
    await client.createEvalRun('default', { setId: 'evs_1' });
    await client.getEvalRunResults('default', 'evr_1');
    await client.cancelEvalRun('default', 'evr_1', { reason: 'r' });
    await client.stopShadowTrial('default', 'shd_1', { reason: null });
    await client.abortCanaryRelease('default', 'cnr_1');
    const base = '/v1.0/api/tenants/default';
    expect(calls.map(([m, p]) => `${m} ${p}`)).toEqual([
      `GET ${base}/eval-sets`,
      `POST ${base}/eval-sets`,
      `PUT ${base}/eval-sets/evs_1`,
      `POST ${base}/eval-sets/evs_1/approve`,
      `POST ${base}/eval-sets/evs_1/cases`,
      `PUT ${base}/eval-sets/evs_1/cases/evc_1`,
      `DELETE ${base}/eval-sets/evs_1/cases/evc_1`,
      `POST ${base}/eval-runs`,
      `GET ${base}/eval-runs/evr_1/results`,
      `POST ${base}/eval-runs/evr_1/cancel`,
      `POST ${base}/shadow-trials/shd_1/stop`,
      `POST ${base}/canary-releases/cnr_1/abort`
    ]);
    expect(calls[9][2]).toEqual({ reason: 'r' });
    expect(calls[11][2]).toEqual({});
  });
});
