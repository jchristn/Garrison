// Pipelines (P12.9): navigation (Agents > Pipelines, Runs > Pipeline runs, Approvals > Stage reviews), the combined
// approvals badge, the definition form helpers and ordered stage editor, the list configurations, the review decide
// dialog (including 409 RevisionLimitReached and ReviewNotPending), the pipeline run page, and the API client.
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../i18n';
import AuthContext from '../context/AuthContext';
import AppContext from '../context/AppContext';
import ToastContext from '../context/ToastContext';
import { ApprovalsProvider } from '../context/ApprovalsContext';
import Sidebar from '../components/Sidebar';
import PipelineReviewDecideModal from '../components/PipelineReviewDecideModal';
import PipelineStagesEditor, { stageFields } from '../components/PipelineStagesEditor';
import PipelineStartModal from '../components/PipelineStartModal';
import PipelinePreviewModal from '../components/PipelinePreviewModal';
import PipelineRunDetailView from '../views/PipelineRunDetailView';
import { pipelinesConfig } from '../views/resourceConfigs';
import { pipelineRunsConfig, pipelineReviewsConfig, runsConfig } from '../views/runConfigs';
import { PAGE_VIEWS, DETAIL_VIEWS } from '../views/hubs/hubPanels';
import { findPage, findHub, pathFor, LEGACY_REDIRECTS } from '../config/navConfig';
import { ENUMS, PIPELINE_LIMITS } from '../utils/constants';
import { combinedPending } from '../utils/approvals';
import { PROMPT_ROLES, templateKindForRole, defaultTemplateFor } from '../utils/deployments';
import { enumTip } from '../utils/tips';
import { errorMessage } from '../utils/errors';
import ApiClient from '../utils/api';
import {
  blankPipeline,
  pipelineToForm,
  pipelineToBody,
  pipelineDuplicate,
  pipelineErrors,
  stageErrors,
  moveItem,
  deploymentsForAgent,
  handoffTemplates,
  pipelineTimeline,
  pendingReview,
  revisionsLeft,
  reviewDecisionBody,
  reviewDecisionError,
  reviewConflictKey,
  canCancelPipelineRun,
  canRetryPipelineRun,
  isTerminalPipelineRun,
  newIdempotencyKey
} from '../utils/pipelines';
import { respond, pipeline, pipelineRun, pipelineReview, decidedPipelineReview } from '../../tests/e2e/mocks.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const tenantUrl = (sub) => new URL(`http://127.0.0.1/v1.0/api/tenants/default/${sub}`);
const t = (...args) => i18n.t(...args);

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
});

function mount(element, { apiClient = {}, addToast = vi.fn(), refresh = vi.fn(), pending = 0, approvalsPending = null, reviewsPending = null } = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter>
        <AuthContext.Provider value={{ apiClient, principal: { isAdmin: true } }}>
          <AppContext.Provider value={{ tenantId: 'default', setWizardOpen: () => {}, setTourOpen: () => {} }}>
            <ToastContext.Provider value={{ addToast }}>
              <ApprovalsProvider value={{ pending, approvalsPending, reviewsPending, refresh }}>{element}</ApprovalsProvider>
            </ToastContext.Provider>
          </AppContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );
  });
  mounted.push({ root, container });
  return { container, addToast, refresh };
}

function type(el, value) {
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
  el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
}

const q = (sel) => document.body.querySelector(sel);
const qa = (sel) => [...document.body.querySelectorAll(sel)];
const conflict = (code) => Object.assign(new Error(code), { status: 409, code });

describe('pipelines navigation (decision 1: tabs, no new sidebar item)', () => {
  it('puts definitions under Agents, runs under Runs, and reviews under Approvals', () => {
    expect(findPage('pipelines')).toMatchObject({ hub: 'agents', tab: 'pipelines' });
    expect(findPage('pipelineRuns')).toMatchObject({ hub: 'runs', tab: 'pipeline-runs', detail: true });
    expect(findPage('pipelineReviews')).toMatchObject({ hub: 'approvals', tab: 'pipeline-reviews' });
    expect(pathFor('pipelines')).toBe('/dashboard/agents?tab=pipelines');
    expect(pathFor('pipelineRuns')).toBe('/dashboard/runs?tab=pipeline-runs');
    expect(pathFor('pipelineRuns', 'plr_1')).toBe('/dashboard/pipeline-runs/plr_1');
    expect(pathFor('pipelineReviews')).toBe('/dashboard/approvals?tab=pipeline-reviews');
    // Approvals stays the hub's default tab and keeps its detail route.
    expect(pathFor('approvals')).toBe('/dashboard/approvals');
    expect(pathFor('approvals', 'apr_1')).toBe('/dashboard/approvals/apr_1');
    expect(findHub('approvals').tabs.map((p) => p.id)).toEqual(['approvals', 'pipelineReviews']);
  });

  it('registers views and redirects the bare slugs to their tabs', () => {
    for (const id of ['pipelines', 'pipelineRuns', 'pipelineReviews']) expect(PAGE_VIEWS[id], id).toBeTruthy();
    expect(DETAIL_VIEWS.pipelineRuns).toBe(PipelineRunDetailView);
    const redirects = Object.fromEntries(LEGACY_REDIRECTS.map((r) => [r.from, `${r.to}?tab=${r.tab}`]));
    expect(redirects.pipelines).toBe('/dashboard/agents?tab=pipelines');
    expect(redirects['pipeline-runs']).toBe('/dashboard/runs?tab=pipeline-runs');
    expect(redirects['pipeline-reviews']).toBe('/dashboard/approvals?tab=pipeline-reviews');
  });

  it('mirrors the server enums and new resource and audit types', () => {
    expect(ENUMS.pipelineRunStatus).toEqual(['Running', 'AwaitingReview', 'Cancelling', 'Succeeded', 'Failed', 'Cancelled', 'TimedOut']);
    expect(ENUMS.pipelineRunOutcome).toEqual(['None', 'Succeeded', 'StageFailed', 'StageStartFailed', 'ReviewRejected', 'ReviewExpired', 'Cancelled', 'TimedOut', 'InternalError']);
    expect(ENUMS.pipelineStageStatus).toEqual(['Pending', 'Running', 'AwaitingReview', 'Succeeded', 'Failed', 'Cancelled']);
    expect(ENUMS.pipelineReviewStatus).toEqual(['Pending', 'Approved', 'ChangesRequested', 'Rejected', 'Expired', 'Cancelled']);
    expect(ENUMS.pipelineReviewDecision).toEqual(['Approve', 'RequestChanges', 'Reject']);
    expect(ENUMS.pipelineReviewSource).toEqual(['User', 'Timeout', 'Cancelled']);
    expect(ENUMS.resourceType).toEqual(expect.arrayContaining(['Pipeline', 'PipelineRun']));
    expect(ENUMS.auditEventType).toEqual(expect.arrayContaining(['PipelineReviewDecided', 'PipelineRunCancelled']));
  });

  it('explains every pipeline status, outcome, and review value in a tooltip', () => {
    const missing = [];
    for (const group of ['pipelineRunStatus', 'pipelineRunOutcome', 'pipelineStageStatus', 'pipelineReviewStatus', 'pipelineReviewDecision', 'pipelineReviewSource']) {
      for (const value of ENUMS[group]) if (enumTip(t, group, value).length < 25) missing.push(`${group}.${value}`);
    }
    expect(missing).toEqual([]);
  });

  it('labels the new cluster settings and the PipelineStage prompt role', () => {
    expect(t('views.settings.fields.Runtime.PipelineSweepIntervalMs')).toBe('Pipeline sweep interval (ms)');
    expect(t('views.settings.fields.Runtime.PipelineMaxStages')).toBe('Maximum stages per pipeline');
    expect(t('tips.views.settings.fields.Runtime.PipelineMaxStages')).toMatch(/Most stages/);
    expect(PROMPT_ROLES).toContain('PipelineStage');
    expect(templateKindForRole('PipelineStage')).toBe('Task');
    expect(defaultTemplateFor('PipelineStage', [{ id: 'pt_ps', name: 'builtin/pipeline-stage', kind: 'Task', isBuiltIn: true }])).toBe('pt_ps');
    expect(t('resources.deployments.promptRoles.PipelineStage')).toMatch(/Pipeline stage/);
  });
});

describe('combined approvals badge', () => {
  it('adds pending approvals and pending stage reviews', () => {
    expect(combinedPending(null, null)).toBeNull();
    expect(combinedPending(undefined, null)).toBeNull();
    expect(combinedPending(2, null)).toBe(2);
    expect(combinedPending(null, 3)).toBe(3);
    expect(combinedPending(2, 3)).toBe(5);
  });

  it('shows one badge with both counts in its tooltip', () => {
    const { container } = mount(<Sidebar />, { pending: 5, approvalsPending: 2, reviewsPending: 3 });
    const badge = container.querySelector('[data-nav="approvals"] [data-testid="approvals-badge"]');
    expect(badge.textContent).toBe('5');
    expect(badge.getAttribute('data-tip')).toBe('Waiting for a person: tool call approvals (2) and pipeline stage reviews (3). Open Approvals to decide them.');
    expect(container.querySelectorAll('[data-testid="approvals-badge"]')).toHaveLength(1);
  });
});

describe('pipeline definition form', () => {
  const record = pipeline(1);

  it('turns a record into form values and back into the API body in stage order', () => {
    const shuffled = { ...record, stages: [...record.stages].reverse() };
    const form = pipelineToForm(shuffled);
    expect(form.stages.map((s) => s.name)).toEqual(['triage', 'fix', 'summarize']);
    expect(form.stages[2].deploymentId).toBe('');
    const body = pipelineToBody(form);
    expect(body).toMatchObject({ name: 'triage-and-fix', maxDurationSeconds: 7200, active: true });
    expect(body.stages.map((s) => s.position)).toEqual([1, 2, 3]);
    expect(body.stages[0]).toMatchObject({ agentId: 'agt_0001', deploymentId: 'dep_0001', handoffTemplateId: null, handoffTemplateVersion: null, maxAttempts: 2, parameters: [{ name: 'format', value: 'claude' }] });
    expect(body.stages[1]).toMatchObject({ deploymentId: null, handoffTemplateId: 'tpl_builtin_default_task', handoffTemplateVersion: 1, requiresReview: true, reviewTimeoutSeconds: 3600, reviewTimeoutAction: 'Approve', maxRevisions: 2 });
    expect(body.stages[2]).toMatchObject({ continueOnFailure: true, outputCharLimit: 8000, requiresReview: false, reviewTimeoutSeconds: 0 });
    expect(body.stages[0]).not.toHaveProperty('id');
  });

  it('drops the version pin without a template and blank parameter rows', () => {
    const form = blankPipeline();
    form.name = 'p';
    form.stages[0] = { ...form.stages[0], agentId: 'agt_1', handoffTemplateVersion: 4, parameters: [{ name: ' ', value: 'x' }] };
    const body = pipelineToBody(form);
    expect(body.stages[0].handoffTemplateVersion).toBeNull();
    expect(body.stages[0].parameters).toEqual([]);
    expect(body.description).toBeNull();
  });

  it('duplicates with stage references kept and IDs removed', () => {
    const copy = pipelineDuplicate(record);
    expect(copy.name).toBe('triage-and-fix-copy');
    expect(copy.id).toBeUndefined();
    expect(copy.stages[0]).toMatchObject({ agentId: 'agt_0001', deploymentId: 'dep_0001' });
    expect(copy.stages[1].handoffTemplateId).toBe('tpl_builtin_default_task');
    expect(copy.stages[0].id).toBeUndefined();
    expect(copy.stages[0].parameters).toEqual([{ name: 'format', value: 'claude' }]);
    expect(pipelinesConfig.toDuplicate(record).name).toBe('triage-and-fix-copy');
  });

  it('checks names, ranges, agents, duplicates, and parameters like the server', () => {
    const form = pipelineToForm(record);
    expect(pipelineErrors(form, t)).toEqual({});
    const bad = pipelineToForm(record);
    bad.name = 'Bad Name';
    bad.maxDurationSeconds = -1;
    bad.stages[1] = { ...bad.stages[1], name: 'TRIAGE', agentId: '', maxAttempts: 9, reviewTimeoutSeconds: 3000000 };
    bad.stages[2] = { ...bad.stages[2], parameters: [{ name: 'model', value: 'x' }], deploymentId: '' };
    const errors = pipelineErrors(bad, t);
    expect(Object.keys(errors).sort()).toEqual(['maxDurationSeconds', 'name', 'stages', 'stages[1].agentId', 'stages[1].maxAttempts', 'stages[1].name', 'stages[1].reviewTimeoutSeconds', 'stages[2].parameters']);
    expect(errors['stages[1].name']).toBe('Another stage is already named TRIAGE.');
    expect(errors['stages[1].maxAttempts']).toBe('Enter a whole number from 1 to 5.');
    expect(errors.stages).toBe('Item 2: this stage has errors. Item 3: this stage has errors.');
    expect(stageErrors(errors, 1)).toEqual({ name: errors['stages[1].name'], agentId: 'This field is required.', maxAttempts: errors['stages[1].maxAttempts'], reviewTimeoutSeconds: errors['stages[1].reviewTimeoutSeconds'] });
    expect(pipelineErrors({ ...form, stages: [] }, t).stages).toBe('Add at least one stage.');
    expect(pipelineErrors({ ...form, stages: [...form.stages, ...form.stages].map((s, i) => ({ ...s, name: `s${i}` })) }, t, 4).stages).toBe('A pipeline has at most 4 stages.');
    expect(pipelinesConfig.validate({ ...form, stages: Array.from({ length: 30 }, (_, i) => ({ ...form.stages[0], name: `s${i}` })) }, t)).toEqual({});
  });

  it('moves, filters deployments by agent, and offers only Task templates', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c']);
    expect(moveItem(['a', 'b', 'c'], 0, -1)).toEqual(['a', 'b', 'c']);
    const deployments = [
      { id: 'd1', agentId: 'a1' },
      { id: 'd2', agentId: 'a2' }
    ];
    expect(deploymentsForAgent(deployments, 'a2').map((d) => d.id)).toEqual(['d2']);
    expect(deploymentsForAgent(deployments, '')).toEqual([]);
    const templates = [
      { id: 't1', name: 'mine', kind: 'Task' },
      { id: 't2', name: 'sys', kind: 'System' },
      { id: 't3', name: 'builtin/pipeline-stage', kind: 'Task', isBuiltIn: true }
    ];
    expect(handoffTemplates(templates).map((x) => x.id)).toEqual(['t3', 't1']);
    expect(handoffTemplates(templates, 't2').map((x) => x.id)).toEqual(['t3', 't1', 't2']);
  });

  it('gives every stage field a label and a useful tooltip', () => {
    const fields = stageFields(t, { ...blankPipeline().stages[0], requiresReview: true, reviewTimeoutSeconds: 10, handoffTemplateId: 'x' }, {});
    expect(fields.map((f) => f.name)).toEqual(['name', 'agentId', 'deploymentId', 'handoffTemplateId', 'handoffTemplateVersion', 'outputCharLimit', 'maxAttempts', 'continueOnFailure', 'requiresReview', 'reviewTimeoutSeconds', 'reviewTimeoutAction', 'maxRevisions', 'description', 'parameters']);
    for (const f of fields) {
      expect(f.label, f.name).toBeTruthy();
      expect(f.tip.length, f.name).toBeGreaterThan(25);
    }
    expect(fields.find((f) => f.name === 'reviewTimeoutAction').options.map((o) => o.value)).toEqual(['Approve', 'Reject']);
  });
});

describe('ordered stage editor', () => {
  const options = {
    agents: [
      { id: 'agt_1', name: 'triager' },
      { id: 'agt_2', name: 'fixer' }
    ],
    deployments: [
      { id: 'dep_1', agentId: 'agt_1', name: 'triager-default' },
      { id: 'dep_2', agentId: 'agt_2', name: 'fixer-default' }
    ],
    templates: [{ id: 'tpl_1', name: 'builtin/pipeline-stage', kind: 'Task', isBuiltIn: true }]
  };

  function Harness({ initial, onChange, errors }) {
    return <PipelineStagesEditor value={initial} options={options} errors={errors} onChange={onChange} />;
  }

  it('adds, reorders, and removes stages', () => {
    const onChange = vi.fn();
    const stages = [
      { ...blankPipeline().stages[0], name: 'one', agentId: 'agt_1' },
      { ...blankPipeline().stages[0], name: 'two', agentId: 'agt_2' }
    ];
    mount(<Harness initial={stages} onChange={onChange} />);
    expect(qa('.pipeline-stage')).toHaveLength(2);
    expect(q('[data-testid="stage-1-up"]').disabled).toBe(true);
    act(() => q('[data-testid="stage-1-down"]').click());
    expect(onChange.mock.calls.at(-1)[0].map((s) => s.name)).toEqual(['two', 'one']);
    act(() => q('[data-testid="stage-2-remove"]').click());
    expect(onChange.mock.calls.at(-1)[0].map((s) => s.name)).toEqual(['one']);
    act(() => q('[data-testid="pipeline-add-stage"]').click());
    const added = onChange.mock.calls.at(-1)[0];
    expect(added).toHaveLength(3);
    expect(added[2]).toMatchObject({ name: 'stage-3', maxAttempts: 1, outputCharLimit: 16000, maxRevisions: 3, reviewTimeoutAction: 'Reject' });
  });

  it('lists only the stage agent deployments and clears a deployment of another agent', () => {
    const onChange = vi.fn();
    mount(<Harness initial={[{ ...blankPipeline().stages[0], agentId: 'agt_1', deploymentId: 'dep_1' }]} onChange={onChange} />);
    const deployment = q('#pipelines-stage-0-deploymentId');
    expect([...deployment.options].map((o) => o.value)).toEqual(['', 'dep_1']);
    expect(deployment.options[0].textContent).toBe('Any active deployment (weighted)');
    act(() => type(q('#pipelines-stage-0-agentId'), 'agt_2'));
    expect(onChange.mock.calls.at(-1)[0][0]).toMatchObject({ agentId: 'agt_2', deploymentId: '' });
  });

  it('shows review settings only for review gates and the server errors per stage', () => {
    const stage = { ...blankPipeline().stages[0], agentId: 'agt_1' };
    mount(<Harness initial={[stage, { ...stage, name: 'gate', requiresReview: true, reviewTimeoutSeconds: 60 }]} onChange={() => {}} errors={{ 'stages[1].maxRevisions': 'maxRevisions is 0 to 10.', stages: 'Item 2: bad' }} />);
    expect(q('#pipelines-stage-0-maxRevisions')).toBeNull();
    expect(q('#pipelines-stage-1-maxRevisions')).not.toBeNull();
    expect(q('#pipelines-stage-1-reviewTimeoutAction')).not.toBeNull();
    expect(qa('.pipeline-stage')[1].textContent).toContain('maxRevisions is 0 to 10.');
    expect(q('[data-testid="pipeline-stages"]').textContent).toContain('Item 2: bad');
    for (const el of qa('.pipeline-stage button, .pipeline-stage input, .pipeline-stage select, .pipeline-stage textarea')) {
      expect((el.getAttribute('data-tip') || '').length, el.outerHTML.slice(0, 80)).toBeGreaterThan(24);
    }
  });

  it('renders the stage editor inside the pipeline form through the custom field', () => {
    const fields = pipelinesConfig.fields(pipelinesConfig.blank(), { t, mode: 'create', options });
    const stagesField = fields.find((f) => f.name === 'stages');
    const onChange = vi.fn();
    const data = pipelinesConfig.blank();
    mount(stagesField.render(data, { disabled: false, onChange, errors: {} }));
    act(() => q('[data-testid="pipeline-add-stage"]').click());
    expect(onChange.mock.calls.at(-1)[0].stages).toHaveLength(2);
    expect(onChange.mock.calls.at(-1)[0].name).toBe('');
  });
});

describe('pipeline lists', () => {
  const ctx = { t, i18n, navigate: vi.fn(), setExtraModal: vi.fn(), reload: vi.fn(), apiClient: {}, tenantId: 'default', addToast: vi.fn() };

  it('summarizes stages and review gates in the pipelines table and offers Start, Preview, and runs', () => {
    const cols = Object.fromEntries(pipelinesConfig.columns({ ...ctx, lookups: { agents: { agt_0001: 'echo-agent', agt_0002: 'fixer' } } }).map((c) => [c.key, c]));
    const row = pipeline(1);
    expect(renderToStaticMarkup(cols.stages.render(row))).toContain('3 stages: echo-agent &gt; fixer &gt; echo-agent');
    expect(cols.reviewGates.render(row)).toBe('1');
    expect(cols.maxDurationSeconds.render(pipeline(2))).toBe('No limit');
    const visible = (r) => pipelinesConfig.rowActions(r, ctx).filter((a) => !a.hidden).map((a) => a.label);
    expect(visible(row)).toEqual(['Start', 'Preview prompts', 'View pipeline runs']);
    expect(visible(pipeline(2))).toEqual(['Preview prompts', 'View pipeline runs']);
    pipelinesConfig.rowActions(row, ctx)[0].onClick();
    expect(ctx.setExtraModal.mock.calls.at(-1)[0].props.pipeline.id).toBe('ppl_0001');
    pipelinesConfig.rowActions(row, ctx)[2].onClick();
    expect(ctx.navigate).toHaveBeenLastCalledWith('/dashboard/runs?tab=pipeline-runs&pipelineId=ppl_0001');
  });

  it('filters pipeline runs by status, pipeline, and time and acts by status', () => {
    expect(pipelineRunsConfig.filters.map((f) => f.name)).toEqual(['status', 'pipelineId', 'fromUtc', 'toUtc']);
    expect(pipelineRunsConfig.filters[0].options).toEqual(ENUMS.pipelineRunStatus);
    expect(pipelineRunsConfig.urlFilters).toEqual(expect.arrayContaining(['status', 'pipelineId']));
    const rows = respond('GET', tenantUrl('pipeline-runs?maxResults=25&skip=0')).objects;
    const visible = (r) => pipelineRunsConfig.rowActions(r, ctx).filter((a) => !a.hidden).map((a) => a.label);
    expect(visible(rows[0])).toEqual(['Cancel', 'View stage runs']);
    expect(visible(rows[1])).toEqual(['View stage runs', 'Open final run']);
    expect(visible(rows[2])).toEqual(['Retry', 'View stage runs']);
    expect(pipelineRunsConfig.canDelete(rows[1])).toBe(true);
    expect(pipelineRunsConfig.canDelete(rows[0])).toBe(false);
    expect(pipelineRunsConfig.detailPath(rows[0])).toBe('/dashboard/pipeline-runs/plr_0001');
    const status = pipelineRunsConfig.columns(ctx).find((c) => c.key === 'status');
    expect(renderToStaticMarkup(status.render(rows[0]))).toContain('Awaiting review');
    expect(respond('GET', tenantUrl('pipeline-runs?status=Failed')).objects.map((r) => r.id)).toEqual(['plr_0003']);
  });

  it('opens the stage review inbox on pending reviews with decide actions', () => {
    expect(pipelineReviewsConfig.defaultFilters).toEqual({ status: 'Pending' });
    expect(pipelineReviewsConfig.filters.map((f) => f.name)).toEqual(['status', 'pipelineId', 'decisionSource', 'pipelineRunId']);
    expect(pipelineReviewsConfig.filters[2].tip(t)).toMatch(/review timeout/);
    const rows = respond('GET', tenantUrl('pipeline-reviews?maxResults=25&skip=0')).objects;
    const pending = rows.find((r) => r.status === 'Pending');
    const visible = (r) => pipelineReviewsConfig.rowActions(r, ctx).filter((a) => !a.hidden).map((a) => a.label);
    expect(visible(pending)).toEqual(['Approve', 'Request changes', 'Reject', 'Open stage run']);
    expect(visible(rows.find((r) => r.status === 'Approved'))).toEqual(['Open stage run']);
    pipelineReviewsConfig.rowActions(pending, ctx)[1].onClick();
    const modal = ctx.setExtraModal.mock.calls.at(-1)[0];
    expect(modal.props.review.id).toBe(pending.id);
    expect(modal.props.initialDecision).toBe('RequestChanges');
    expect(pipelineReviewsConfig.detailPath(pending)).toBe('/dashboard/pipeline-runs/plr_0001');
    const cols = Object.fromEntries(pipelineReviewsConfig.columns(ctx).map((c) => [c.key, c]));
    expect(renderToStaticMarkup(cols.status.render(rows.find((r) => r.status === 'ChangesRequested')))).toContain('Changes requested');
    expect(renderToStaticMarkup(cols.decisionSource.render(rows.find((r) => r.status === 'Expired')))).toContain('Timeout');
  });

  it('shows the pipeline run of stage runs in the runs list and filters by it', () => {
    expect(runsConfig.urlFilters).toContain('pipelineRunId');
    const col = runsConfig.columns(ctx).find((c) => c.key === 'pipelineRunId');
    expect(renderToStaticMarkup(col.render({ pipelineRunId: 'plr_0001', pipelinePosition: 2, pipelineExecution: 3 }))).toContain('stage 2, execution 3');
    expect(col.render({})).toBe('-');
  });
});

describe('review decisions', () => {
  it('builds the decide body and checks the comment', () => {
    expect(reviewDecisionBody('Approve', '  ')).toEqual({ decision: 'Approve' });
    expect(reviewDecisionBody('RequestChanges', ' add tests ')).toEqual({ decision: 'RequestChanges', comment: 'add tests' });
    expect(reviewDecisionError('RequestChanges', '', t)).toMatch(/Describe what should change/);
    expect(reviewDecisionError('Approve', '', t)).toBe('');
    expect(reviewDecisionError('Reject', 'x'.repeat(PIPELINE_LIMITS.commentMax + 1), t)).toMatch(/8000/);
    expect(reviewConflictKey(conflict('RevisionLimitReached'))).toBe('components.pipelineReviews.toasts.revisionLimit');
    expect(reviewConflictKey(conflict('ReviewNotPending'))).toBe('components.pipelineReviews.toasts.notPending');
    expect(reviewConflictKey({ status: 400 })).toBeNull();
    expect(errorMessage(t, conflict('RevisionLimitReached'))).toMatch(/used all its revisions/);
    expect(errorMessage(t, conflict('PipelineInUse'))).toMatch(/unfinished pipeline runs/);
  });

  it('approves with notes for the next stage', async () => {
    const review = pipelineReview(1);
    const decidePipelineReview = vi.fn().mockResolvedValue(decidedPipelineReview(review.id));
    const onDecided = vi.fn();
    const { addToast, refresh } = mount(<PipelineReviewDecideModal review={review} onClose={() => {}} onDecided={onDecided} />, { apiClient: { decidePipelineReview } });
    expect(q('[data-testid="review-decide-Approve"]').checked).toBe(true);
    act(() => type(q('[data-testid="review-decide-comment"]'), 'Ship it'));
    await act(async () => q('[data-testid="review-decide-submit"]').click());
    expect(decidePipelineReview).toHaveBeenCalledWith('default', review.id, { decision: 'Approve', comment: 'Ship it' });
    expect(addToast).toHaveBeenCalledWith({ type: 'success', message: 'Approved stage fix of triage-and-fix.' });
    expect(refresh).toHaveBeenCalled();
    expect(onDecided).toHaveBeenCalledWith(expect.objectContaining({ status: 'Approved' }));
  });

  it('requires a comment to request changes', async () => {
    const decidePipelineReview = vi.fn();
    mount(<PipelineReviewDecideModal review={pipelineReview(1)} initialDecision="RequestChanges" onClose={() => {}} onDecided={() => {}} />, { apiClient: { decidePipelineReview } });
    expect(q('label[for="pipeline-review-comment"]').textContent).toContain('What should change');
    await act(async () => q('[data-testid="review-decide-submit"]').click());
    expect(decidePipelineReview).not.toHaveBeenCalled();
    expect(q('[data-testid="pipeline-review-decide"]').textContent).toContain('Describe what should change.');
    expect(q('[data-testid="review-decide-submit"]').disabled).toBe(true);
    act(() => type(q('[data-testid="review-decide-comment"]'), 'Add a test'));
    expect(q('[data-testid="review-decide-submit"]').disabled).toBe(false);
  });

  it('keeps the dialog open with a clear error on 409 RevisionLimitReached', async () => {
    const stage = pipelineRun(1).stages[1];
    const onDecided = vi.fn();
    const decidePipelineReview = vi.fn().mockRejectedValue(conflict('RevisionLimitReached'));
    const { addToast } = mount(<PipelineReviewDecideModal review={pipelineReview(1)} stage={stage} initialDecision="RequestChanges" onClose={() => {}} onDecided={onDecided} />, { apiClient: { decidePipelineReview } });
    expect(q('[data-testid="review-revisions-left"]').textContent).toBe('2 of 2');
    act(() => type(q('[data-testid="review-decide-comment"]'), 'Again'));
    await act(async () => q('[data-testid="review-decide-submit"]').click());
    expect(q('[data-testid="review-decide-conflict"]').textContent).toBe('This stage already used all its revisions (maximum 2), so changes can no longer be requested. Approve or reject it instead.');
    expect(onDecided).not.toHaveBeenCalled();
    expect(addToast).not.toHaveBeenCalled();
    act(() => q('[data-testid="review-decide-Approve"]').click());
    expect(q('[data-testid="review-decide-conflict"]')).toBeNull();
  });

  it('warns that no revisions are left before submitting', () => {
    const stage = { ...pipelineRun(1).stages[1], revisions: 2 };
    expect(revisionsLeft(stage)).toBe(0);
    mount(<PipelineReviewDecideModal review={pipelineReview(1)} stage={stage} initialDecision="RequestChanges" onClose={() => {}} onDecided={() => {}} />, { apiClient: {} });
    expect(q('[data-testid="review-no-revisions"]').textContent).toMatch(/used all 2 revisions/);
  });

  it('reads the stage of a review opened from the list for its revisions', async () => {
    const getPipelineRun = vi.fn().mockResolvedValue(pipelineRun(1));
    await act(async () => {
      mount(<PipelineReviewDecideModal review={pipelineReview(1)} onClose={() => {}} onDecided={() => {}} />, { apiClient: { getPipelineRun } });
    });
    expect(getPipelineRun).toHaveBeenCalledWith('default', 'plr_0001');
    expect(q('[data-testid="review-revisions-left"]').textContent).toBe('2 of 2');
  });

  it('ends a 409 ReviewNotPending with a warning and reports it decided', async () => {
    const onDecided = vi.fn();
    const { addToast, refresh } = mount(<PipelineReviewDecideModal review={pipelineReview(1)} initialDecision="Reject" onClose={() => {}} onDecided={onDecided} />, { apiClient: { decidePipelineReview: vi.fn().mockRejectedValue(conflict('ReviewNotPending')) } });
    expect(q('[data-testid="review-decide-submit"]').className).toContain('button-danger');
    await act(async () => q('[data-testid="review-decide-submit"]').click());
    expect(addToast).toHaveBeenCalledWith({ type: 'warning', message: expect.stringMatching(/already decided/) });
    expect(refresh).toHaveBeenCalled();
    expect(onDecided).toHaveBeenCalledWith(null);
  });
});

describe('start and preview', () => {
  it('starts with the input and one Idempotency-Key per dialog', async () => {
    const startPipeline = vi.fn().mockResolvedValue({ id: 'plr_0099' });
    const onStarted = vi.fn();
    mount(<PipelineStartModal pipeline={pipeline(1)} onClose={() => {}} onStarted={onStarted} />, { apiClient: { startPipeline } });
    expect(q('[data-testid="pipeline-start-submit"]').disabled).toBe(true);
    act(() => type(q('[data-testid="pipeline-start-input"]'), 'Fix issue 42'));
    await act(async () => q('[data-testid="pipeline-start-submit"]').click());
    await act(async () => q('[data-testid="pipeline-start-submit"]').click());
    expect(startPipeline).toHaveBeenCalledTimes(2);
    const [first, second] = startPipeline.mock.calls;
    expect(first.slice(0, 3)).toEqual(['default', 'ppl_0001', { input: 'Fix issue 42' }]);
    expect(first[3].idempotencyKey).toMatch(/^dash-/);
    expect(second[3].idempotencyKey).toBe(first[3].idempotencyKey);
    expect(onStarted).toHaveBeenCalledWith({ id: 'plr_0099' });
    expect(newIdempotencyKey()).not.toBe(newIdempotencyKey());
  });

  it('renders every stage prompt and shows render failures', async () => {
    const previewPipeline = vi.fn().mockResolvedValue(respond('POST', tenantUrl('pipelines/ppl_0001/preview')));
    mount(<PipelinePreviewModal pipeline={pipeline(1)} onClose={() => {}} />, { apiClient: { previewPipeline } });
    expect(qa('[id^="pipeline-preview-output-"]')).toHaveLength(2);
    await act(async () => q('[data-testid="pipeline-preview-render"]').click());
    const body = previewPipeline.mock.calls[0][2];
    expect(body.input).toBeTruthy();
    expect(body.sampleOutputs).toHaveLength(2);
    expect(qa('[data-preview-stage]')).toHaveLength(3);
    expect(q('[data-preview-stage="3"]').textContent).toContain('NoActiveDeployment');
    expect(q('[data-preview-stage="1"]').textContent).toContain('Stage 1 (triage)');
  });
});

describe('pipeline run page', () => {
  it('builds the timeline with stage runs and reviews per stage', () => {
    const run = pipelineRun(2);
    const timeline = pipelineTimeline(run);
    expect(timeline.map((x) => x.stage.position)).toEqual([1, 2, 3]);
    expect(timeline[1].runs.map((r) => r.execution)).toEqual([1, 2]);
    expect(timeline[1].reviews.map((r) => r.status)).toEqual(['ChangesRequested', 'Approved']);
    expect(timeline.some((x) => x.current)).toBe(false);
    expect(pipelineTimeline(pipelineRun(1))[1].current).toBe(true);
    expect(pendingReview(pipelineRun(1)).id).toBe('prv_0001');
    expect(pendingReview(run)).toBeNull();
    expect([isTerminalPipelineRun(run), canCancelPipelineRun(run), canRetryPipelineRun(run)]).toEqual([true, false, false]);
    expect([canCancelPipelineRun(pipelineRun(1)), canRetryPipelineRun(pipelineRun(3))]).toEqual([true, true]);
  });

  it('shows the review panel, stage timeline, run links, and Cancel for a run awaiting review', async () => {
    const getPipelineRun = vi.fn().mockResolvedValue(respond('GET', tenantUrl('pipeline-runs/plr_0001')));
    await act(async () => {
      mount(<PipelineRunDetailView recordId="plr_0001" />, { apiClient: { getPipelineRun } });
    });
    expect(q('[data-testid="pipeline-run-detail"]')).not.toBeNull();
    expect(qa('.pipeline-timeline-stage')).toHaveLength(3);
    expect(q('[data-stage="2"]').getAttribute('data-status')).toBe('AwaitingReview');
    expect(q('[data-testid="stage-1-counts"]').textContent).toBe('Executions 1, attempts 1 of 2, revisions 0 of 0');
    expect(q('[data-testid="stage-run-run_0011"]').getAttribute('href')).toBe('/dashboard/runs/run_0011');
    expect(q('[data-testid="pipeline-review-panel"]').textContent).toContain('Stage 2 (fix) finished execution 1');
    expect(q('[data-testid="pipeline-run-cancel"]')).not.toBeNull();
    expect(q('[data-testid="pipeline-run-retry"]')).toBeNull();
    expect(q('[data-testid="pipeline-run-delete"]')).toBeNull();
    expect(q('[data-testid="pipeline-run-input"]').textContent).toContain('Issue #42');
    act(() => q('[data-testid="pipeline-review-request-changes"]').click());
    expect(q('[data-testid="review-decide-RequestChanges"]').checked).toBe(true);
    expect(q('[data-testid="review-revisions-left"]').textContent).toBe('2 of 2');
  });

  it('offers Retry and Delete for a failed run and resumes it', async () => {
    const getPipelineRun = vi.fn().mockResolvedValue(respond('GET', tenantUrl('pipeline-runs/plr_0003')));
    const retryPipelineRun = vi.fn().mockResolvedValue({ ...pipelineRun(3), status: 'Running' });
    let toast;
    await act(async () => {
      toast = mount(<PipelineRunDetailView recordId="plr_0003" />, { apiClient: { getPipelineRun, retryPipelineRun } }).addToast;
    });
    expect(q('[data-testid="pipeline-review-panel"]')).toBeNull();
    expect(q('[data-testid="pipeline-run-cancel"]')).toBeNull();
    expect(q('[data-testid="pipeline-run-delete"]')).not.toBeNull();
    expect(q('[data-testid="stage-1-runs"]').textContent).toContain('The harness exited with code 1.');
    await act(async () => q('[data-testid="pipeline-run-retry"]').click());
    expect(retryPipelineRun).toHaveBeenCalledWith('default', 'plr_0003');
    expect(toast).toHaveBeenCalledWith({ type: 'success', message: 'The pipeline run resumes at the stage where it stopped.' });
  });

  it('applies live pipeline-run.status pushes from the WebSocket channel', async () => {
    const sockets = [];
    class FakeSocket {
      constructor(url) {
        this.url = url;
        this.sent = [];
        sockets.push(this);
      }
      send(data) {
        this.sent.push(JSON.parse(data));
      }
      close() {}
    }
    const original = globalThis.WebSocket;
    globalThis.WebSocket = FakeSocket;
    try {
      const getPipelineRun = vi.fn().mockResolvedValue(respond('GET', tenantUrl('pipeline-runs/plr_0004')));
      await act(async () => {
        mount(<PipelineRunDetailView recordId="plr_0004" />, { apiClient: { getPipelineRun, webSocketUrl: () => 'ws://127.0.0.1/v1.0/ws?token=x' } });
      });
      const ws = sockets[0];
      act(() => ws.onopen());
      expect(ws.sent).toEqual([{ type: 'subscribe', channel: 'pipeline-run:plr_0004' }]);
      act(() => ws.onmessage({ data: JSON.stringify({ type: 'subscribed', channel: 'pipeline-run:plr_0004' }) }));
      expect(document.body.textContent).toContain('Live');
      act(() => ws.onmessage({ data: JSON.stringify({ type: 'pipeline-run.status', pipelineRun: { ...pipelineRun(2), id: 'plr_0004' } }) }));
      expect(q('[data-stage="3"]').getAttribute('data-status')).toBe('Succeeded');
      expect(q('[data-testid="pipeline-run-final"]')).not.toBeNull();
    } finally {
      globalThis.WebSocket = original;
    }
  });
});

describe('API client', () => {
  it('sends the Idempotency-Key header on start and uses the documented routes', async () => {
    const calls = [];
    const original = globalThis.fetch;
    globalThis.fetch = vi.fn(async (url, init) => {
      calls.push({ url: String(url), method: init.method, headers: init.headers, body: init.body });
      return new Response(JSON.stringify({ objects: [], totalRecords: 4 }), { status: 200 });
    });
    try {
      const client = new ApiClient('http://127.0.0.1:8700', 'tok');
      await client.startPipeline('default', 'ppl_1', { input: 'x' }, { idempotencyKey: 'k1' });
      await client.previewPipeline('default', 'ppl_1', { input: 'x', sampleOutputs: [] });
      await client.listPipelineRuns('default', { status: 'Failed', pageNumber: 2, pageSize: 10 });
      await client.cancelPipelineRun('default', 'plr_1');
      await client.retryPipelineRun('default', 'plr_1');
      await client.decidePipelineReview('default', 'prv_1', { decision: 'Reject' });
      expect(await client.countPendingPipelineReviews('default')).toBe(4);
      expect(calls[0]).toMatchObject({ url: 'http://127.0.0.1:8700/v1.0/api/tenants/default/pipelines/ppl_1/start?wait=false', method: 'POST' });
      expect(calls[0].headers['Idempotency-Key']).toBe('k1');
      expect(calls[1].url).toBe('http://127.0.0.1:8700/v1.0/api/tenants/default/pipelines/ppl_1/preview');
      expect(calls[2].url).toBe('http://127.0.0.1:8700/v1.0/api/tenants/default/pipeline-runs?status=Failed&maxResults=10&skip=10');
      expect(calls.slice(3, 6).map((c) => `${c.method} ${new URL(c.url).pathname}`)).toEqual([
        'POST /v1.0/api/tenants/default/pipeline-runs/plr_1/cancel',
        'POST /v1.0/api/tenants/default/pipeline-runs/plr_1/retry',
        'POST /v1.0/api/tenants/default/pipeline-reviews/prv_1/decide'
      ]);
      expect(calls[6].url).toBe('http://127.0.0.1:8700/v1.0/api/tenants/default/pipeline-reviews?status=Pending&maxResults=1&skip=0');
    } finally {
      globalThis.fetch = original;
    }
  });
});
