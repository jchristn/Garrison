// Agent revisions, environments, and promotions (AD1.9): the helpers, the API client routes, the Revisions panel (list,
// diff, publish, discard), the promote dialog (next environment, allowSkip, refusals), the promotion history with
// Rollback, the revision pin field, and the deployments configuration (columns, filter, form, body).
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../i18n';
import AuthContext from '../context/AuthContext';
import AppContext from '../context/AppContext';
import ToastContext from '../context/ToastContext';
import AgentRevisionsPanel from '../components/AgentRevisionsPanel';
import PromoteModal from '../components/PromoteModal';
import PromotionHistoryModal from '../components/PromotionHistoryModal';
import RevisionPinField from '../components/RevisionPinField';
import { deploymentsConfig } from '../views/resourceConfigs';
import ApiClient, { ApiError } from '../utils/api';
import { ENUMS } from '../utils/constants';
import { errorMessage } from '../utils/errors';
import {
  canRollback,
  defaultDiffPair,
  draftRevision,
  environmentNames,
  isBlockValue,
  latestPublished,
  nextEnvironment,
  orderedEnvironments,
  promotionBody,
  promotionErrors,
  publishedRevisions,
  revisionPin,
  skipsEnvironments
} from '../utils/revisions';
import { agentRevisions, revisionDiff, promotionRecord, revisionId, ENVIRONMENTS } from '../../tests/e2e/mocks.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const t = (...args) => i18n.t(...args);
const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
const page = (objects) => ({ items: objects, totalCount: objects.length, pageNumber: 1, pageSize: 1000 });
const q = (sel) => document.body.querySelector(sel);
const qa = (sel) => [...document.body.querySelectorAll(sel)];
const ENVS = ENVIRONMENTS.environments;
const conflict = (code, message = 'refused') => new ApiError(409, { code, message });

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

function choose(el, value) {
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  act(() => {
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
    el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  });
}

function click(el) {
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

const AGENT = { id: 'agt_0001', name: 'echo-agent', latestPublishedRevisionId: revisionId('agt_0001', 2), draftRevisionId: revisionId('agt_0001', 3) };

describe('revision and environment helpers', () => {
  const revisions = agentRevisions('agt_0001');

  it('finds the draft, the latest published revision, and the default diff pair', () => {
    expect(draftRevision(revisions, AGENT).number).toBe(3);
    expect(latestPublished(revisions, AGENT).number).toBe(2);
    expect(publishedRevisions(revisions).map((r) => r.number)).toEqual([2, 1]);
    expect(defaultDiffPair(revisions, AGENT)).toEqual({ from: revisionId('agt_0001', 2), to: revisionId('agt_0001', 3) });
    // Without a draft: previous published against latest.
    const published = revisions.filter((r) => r.state === 'Published');
    expect(defaultDiffPair(published, { id: 'agt_0001' })).toEqual({ from: revisionId('agt_0001', 1), to: revisionId('agt_0001', 2) });
    expect(defaultDiffPair(published.slice(0, 1), {})).toEqual({ from: '', to: '' });
  });

  it('orders environments and finds the next one', () => {
    expect(environmentNames([{ name: 'prod', position: 2 }, { name: 'dev', position: 0 }, { name: 'qa', position: 1 }])).toEqual(['dev', 'qa', 'prod']);
    expect(orderedEnvironments([]).map((e) => e.name)).toEqual(['dev', 'staging', 'prod']);
    expect(environmentNames(ENVS, ['legacy'])).toEqual(['dev', 'staging', 'prod', 'legacy']);
    expect(nextEnvironment(ENVS, 'dev')).toBe('staging');
    expect(nextEnvironment(ENVS, 'prod')).toBe('');
    expect(skipsEnvironments(ENVS, 'dev', 'staging')).toBe(false);
    expect(skipsEnvironments(ENVS, 'dev', 'prod')).toBe(true);
    expect(skipsEnvironments(ENVS, 'prod', 'dev')).toBe(true);
  });

  it('describes revision pins and which records can be rolled back', () => {
    expect(revisionPin({}, {})).toEqual({ pinned: false, number: null });
    expect(revisionPin({ agentRevisionId: 'arv_0001_1' }, { arv_0001_1: 1 })).toMatchObject({ pinned: true, number: 1 });
    expect(revisionPin({ agentRevisionId: 'arv_x' }, {})).toMatchObject({ pinned: true, number: null, id: 'arv_x' });
    expect(canRollback(promotionRecord(1))).toBe(true);
    expect(canRollback(promotionRecord(2))).toBe(false);
    expect(canRollback(promotionRecord(3))).toBe(false);
    expect(isBlockValue('a\nb')).toBe(true);
    expect(isBlockValue('short')).toBe(false);
  });

  it('builds the promotion body and checks it before sending', () => {
    const form = { agentId: 'agt_0001', sourceEnvironment: 'dev', targetEnvironment: '', agentRevisionId: '', allowSkip: false, note: '  ' };
    expect(promotionBody(form, ENVS)).toEqual({ agentId: 'agt_0001', sourceEnvironment: 'dev', targetEnvironment: 'staging' });
    expect(promotionErrors(form, ENVS, t)).toEqual({});
    const skip = { ...form, targetEnvironment: 'prod', agentRevisionId: 'arv_0001_2', note: 'go' };
    expect(promotionErrors(skip, ENVS, t).allowSkip).toMatch(/Allow skipping environments/);
    expect(promotionBody({ ...skip, allowSkip: true }, ENVS)).toEqual({ agentId: 'agt_0001', sourceEnvironment: 'dev', targetEnvironment: 'prod', agentRevisionId: 'arv_0001_2', allowSkip: true, note: 'go' });
    expect(promotionErrors({ ...form, sourceEnvironment: 'prod' }, ENVS, t).targetEnvironment).toMatch(/no environment after/);
    expect(promotionErrors({ ...form, agentId: '', sourceEnvironment: '' }, ENVS, t)).toMatchObject({ agentId: expect.any(String), sourceEnvironment: expect.any(String) });
  });

  it('mirrors the server enums and translates every refusal code', () => {
    expect(ENUMS.agentRevisionState).toEqual(['Draft', 'Published']);
    expect(ENUMS.promotionKind).toEqual(['Promote', 'Rollback']);
    expect(ENUMS.promotionOutcome).toEqual(['Applied', 'RolledBack']);
    expect(ENUMS.revisionChangeType).toEqual(['Changed', 'Added', 'Removed']);
    expect(ENUMS.resourceType).toEqual(expect.arrayContaining(['AgentRevision', 'Promotion']));
    for (const code of ['PromotionOrderViolation', 'NoNextEnvironment', 'NoTargetDeployments', 'NoSourceRevision', 'AmbiguousSourceRevision', 'RevisionNotPublished', 'PromotionConflict', 'NotAPromotion', 'AlreadyRolledBack', 'RevisionUnchanged', 'RevisionPublished', 'EnvironmentInUse']) {
      const text = errorMessage(t, conflict(code, `${code} raw server text`));
      expect(text, code).not.toContain('raw server text');
      expect(text, code).toBe(t(`errorCodes.${code}`));
    }
  });
});

describe('API client', () => {
  it('uses the documented revision, environment, and promotion routes', async () => {
    const calls = [];
    const original = globalThis.fetch;
    globalThis.fetch = vi.fn(async (url, init) => {
      calls.push({ url: String(url), method: init.method, body: init.body });
      return new Response(init.method === 'DELETE' ? null : JSON.stringify({ objects: [], totalRecords: 0 }), { status: init.method === 'DELETE' ? 204 : 200 });
    });
    try {
      const client = new ApiClient('http://127.0.0.1:8700', 'tok');
      await client.listAgentRevisions('default', 'agt_1');
      await client.getAgentRevision('default', 'agt_1', 3);
      await client.saveAgentDraft('default', 'agt_1', { description: 'x' });
      await client.discardAgentRevision('default', 'agt_1', 'arv_3');
      await client.publishAgentRevision('default', 'agt_1', 'arv_3', { changeNote: 'n' });
      await client.diffAgentRevisions('default', 'agt_1', 2, 'arv_3');
      await client.getEnvironments('default');
      await client.updateEnvironments('default', { environments: [{ name: 'dev', position: 0 }] });
      await client.listPromotions('default', { agentId: 'agt_1', pageNumber: 1, pageSize: 100 });
      await client.getPromotion('default', 'pro_1');
      await client.promote('default', { agentId: 'agt_1', sourceEnvironment: 'dev' });
      await client.rollbackPromotion('default', 'pro_1', { note: 'n' });
      expect(calls.map((c) => `${c.method} ${c.url.replace('http://127.0.0.1:8700/v1.0/api/tenants/default/', '')}`)).toEqual([
        'GET agents/agt_1/revisions?maxResults=1000&skip=0',
        'GET agents/agt_1/revisions/3',
        'POST agents/agt_1/revisions',
        'DELETE agents/agt_1/revisions/arv_3',
        'POST agents/agt_1/revisions/arv_3/publish',
        'GET agents/agt_1/revisions/diff?from=2&to=arv_3',
        'GET environments',
        'PUT environments',
        'GET promotions?agentId=agt_1&maxResults=100&skip=0',
        'GET promotions/pro_1',
        'POST promotions',
        'POST promotions/pro_1/rollback'
      ]);
      expect(JSON.parse(calls[4].body)).toEqual({ changeNote: 'n' });
      expect(JSON.parse(calls[10].body)).toEqual({ agentId: 'agt_1', sourceEnvironment: 'dev' });
    } finally {
      globalThis.fetch = original;
    }
  });
});

describe('Revisions panel', () => {
  const client = (extra = {}) => ({
    listAgentRevisions: vi.fn().mockResolvedValue(page(agentRevisions('agt_0001'))),
    diffAgentRevisions: vi.fn((_t, agentId, from, to) => Promise.resolve(revisionDiff(agentId, from, to))),
    ...extra
  });

  it('lists revisions with state and latest markers and diffs latest published against the draft', async () => {
    const apiClient = client();
    mount(<AgentRevisionsPanel agent={AGENT} />, { apiClient });
    await flush();
    await flush();
    const rows = qa('[data-testid="agent-revisions"] tbody tr');
    expect(rows.map((r) => r.getAttribute('data-revision'))).toEqual(['3', '2', '1']);
    expect(rows[0].textContent).toContain('Draft');
    expect(rows[1].textContent).toContain('Latest');
    expect(rows[1].textContent).toContain('Stricter reply format');
    expect(rows[0].querySelector('[data-testid="revision-publish"]')).not.toBeNull();
    expect(rows[1].querySelector('[data-testid="revision-publish"]')).toBeNull();
    expect(apiClient.diffAgentRevisions).toHaveBeenCalledWith('default', 'agt_0001', revisionId('agt_0001', 2), revisionId('agt_0001', 3));
    expect(q('[data-testid="revision-diff"] [data-field="description"]').textContent).toContain('Sample agent that also summarizes');
    expect(q('[data-testid="revision-diff"] [data-field="outputSchema"] .diff-viewer')).not.toBeNull();

    click(rows[1].querySelector('[data-testid="revision-compare"]'));
    await flush();
    expect(apiClient.diffAgentRevisions).toHaveBeenLastCalledWith('default', 'agt_0001', revisionId('agt_0001', 1), revisionId('agt_0001', 2));
    choose(q('[data-testid="revision-diff-to"]'), revisionId('agt_0001', 1));
    await flush();
    expect(q('[data-testid="revision-compare-panel"]').textContent).toContain('Select two different revisions');
  });

  it('publishes the draft with a change note and reloads', async () => {
    const publishAgentRevision = vi.fn().mockResolvedValue({ number: 3, state: 'Published' });
    const onChanged = vi.fn();
    const apiClient = client({ publishAgentRevision });
    const { addToast } = mount(<AgentRevisionsPanel agent={AGENT} onChanged={onChanged} />, { apiClient });
    await flush();
    click(q('[data-revision="3"] [data-testid="revision-publish"]'));
    choose(q('[data-testid="revision-change-note"]'), ' Adds a summary ');
    click(q('[data-testid="revision-publish-submit"]'));
    await flush();
    expect(publishAgentRevision).toHaveBeenCalledWith('default', 'agt_0001', revisionId('agt_0001', 3), { changeNote: 'Adds a summary' });
    expect(addToast).toHaveBeenCalledWith({ type: 'success', message: 'Published revision 3.' });
    expect(onChanged).toHaveBeenCalled();
    expect(q('[data-testid="revision-publish-submit"]')).toBeNull();
  });

  it('keeps the publish dialog open with the translated refusal', async () => {
    const apiClient = client({ publishAgentRevision: vi.fn().mockRejectedValue(conflict('RevisionUnchanged')) });
    mount(<AgentRevisionsPanel agent={AGENT} />, { apiClient });
    await flush();
    click(q('[data-revision="3"] [data-testid="revision-publish"]'));
    click(q('[data-testid="revision-publish-submit"]'));
    await flush();
    expect(q('.modal').textContent).toContain('The draft is the same as the latest published revision');
  });

  it('discards the draft after confirmation', async () => {
    const discardAgentRevision = vi.fn().mockResolvedValue(null);
    const apiClient = client({ discardAgentRevision });
    const { addToast } = mount(<AgentRevisionsPanel agent={AGENT} />, { apiClient });
    await flush();
    click(q('[data-revision="3"] [data-testid="revision-discard"]'));
    const confirm = qa('.modal button').find((b) => b.textContent === 'Discard draft');
    click(confirm);
    await flush();
    expect(discardAgentRevision).toHaveBeenCalledWith('default', 'agt_0001', revisionId('agt_0001', 3));
    expect(addToast).toHaveBeenCalledWith({ type: 'success', message: 'The draft was discarded.' });
  });
});

describe('promote dialog', () => {
  const client = (promote) => ({
    listAgents: vi.fn().mockResolvedValue(page([{ id: 'agt_0001', name: 'echo-agent' }])),
    getEnvironments: vi.fn().mockResolvedValue(ENVIRONMENTS),
    listAgentRevisions: vi.fn().mockResolvedValue(page(agentRevisions('agt_0001'))),
    promote
  });

  it('defaults the target to the next environment and sends the promotion', async () => {
    const promote = vi.fn().mockResolvedValue(promotionRecord(1));
    const onPromoted = vi.fn();
    const { addToast } = mount(<PromoteModal initial={{ agentId: 'agt_0001', sourceEnvironment: 'dev' }} onClose={() => {}} onPromoted={onPromoted} />, { apiClient: client(promote) });
    await flush();
    expect(q('#promote-target option').textContent).toBe('Next environment (staging)');
    expect(qa('#promote-revision option').map((o) => o.textContent)).toEqual(['The revision running in the source environment', 'Revision 2', 'Revision 1']);
    click(q('[data-testid="promote-submit"]'));
    await flush();
    expect(promote).toHaveBeenCalledWith('default', { agentId: 'agt_0001', sourceEnvironment: 'dev', targetEnvironment: 'staging' });
    expect(addToast).toHaveBeenCalledWith({ type: 'success', message: 'Promoted to staging. Deployments updated: 1.' });
    expect(onPromoted).toHaveBeenCalled();
  });

  it('asks for Allow skipping before a skip, then shows the server refusal', async () => {
    const promote = vi.fn().mockRejectedValue(conflict('PromotionOrderViolation'));
    mount(<PromoteModal initial={{ agentId: 'agt_0001', sourceEnvironment: 'dev' }} onClose={() => {}} />, { apiClient: client(promote) });
    await flush();
    choose(q('#promote-target'), 'prod');
    expect(q('.modal').textContent).toContain('prod is not the environment right after dev.');
    click(q('[data-testid="promote-submit"]'));
    await flush();
    expect(promote).not.toHaveBeenCalled();
    expect(q('.field-error').textContent).toContain('Allow skipping environments');
    click(q('#promote-allow-skip'));
    click(q('[data-testid="promote-submit"]'));
    await flush();
    expect(promote).toHaveBeenCalledWith('default', { agentId: 'agt_0001', sourceEnvironment: 'dev', targetEnvironment: 'prod', allowSkip: true });
    expect(q('[data-testid="promote-error"]').textContent).toContain('The target is not the next environment after the source.');
  });
});

describe('promotion history', () => {
  it('lists records, offers Rollback only for applied promotions, and rolls back with a note', async () => {
    const rollbackPromotion = vi.fn().mockResolvedValue(promotionRecord(2));
    const listPromotions = vi.fn().mockResolvedValue(page([1, 2, 3].map(promotionRecord)));
    const apiClient = {
      listAgents: vi.fn().mockResolvedValue(page([{ id: 'agt_0001', name: 'echo-agent' }])),
      listAgentRevisions: vi.fn().mockResolvedValue(page(agentRevisions('agt_0001'))),
      listPromotions,
      rollbackPromotion
    };
    const onChanged = vi.fn();
    const { addToast } = mount(<PromotionHistoryModal agentId="agt_0001" onClose={() => {}} onChanged={onChanged} />, { apiClient });
    await flush();
    await flush();
    expect(listPromotions).toHaveBeenCalledWith('default', { agentId: 'agt_0001', pageNumber: 1, pageSize: 100 });
    const rows = qa('[data-testid="promotions-table"] tbody tr');
    expect(rows).toHaveLength(3);
    expect(rows[0].textContent).toContain('dev to staging');
    expect(rows[0].textContent).toContain('(Revision 1 to Revision 2)');
    expect(rows[2].textContent).toContain('Rolled back');
    expect(qa('[data-testid="promotion-rollback"]')).toHaveLength(1);
    click(q('[data-testid="promotion-rollback"]'));
    choose(q('[data-testid="promotion-rollback-note"]'), 'Staging broke');
    click(qa('.modal button').find((b) => b.textContent === 'Roll back' && b.className.includes('button-danger')));
    await flush();
    expect(rollbackPromotion).toHaveBeenCalledWith('default', 'pro_0001', { note: 'Staging broke' });
    expect(addToast).toHaveBeenCalledWith({ type: 'success', message: 'Rolled back. The previous revision pins are restored.' });
    expect(onChanged).toHaveBeenCalled();
  });
});

describe('revision pin field', () => {
  it('offers follow latest and the agent published revisions, and clears a pin of another agent', async () => {
    const apiClient = { listAgentRevisions: vi.fn().mockResolvedValue(page(agentRevisions('agt_0001'))) };
    const onChange = vi.fn();
    mount(<RevisionPinField data={{ agentId: 'agt_0001', agentRevisionId: 'arv_0009_1' }} onChange={onChange} label="Revision pin" tipText="tip text long enough" />, { apiClient });
    await flush();
    expect(qa('#deployments-agentRevisionId option').map((o) => o.textContent)).toEqual(['Follow latest published', 'Revision 2', 'Revision 1', 'arv_0009_1']);
    expect(onChange).toHaveBeenCalledWith({ agentId: 'agt_0001', agentRevisionId: null });
  });

  it('asks for an agent first', () => {
    mount(<RevisionPinField data={{}} onChange={() => {}} label="Revision pin" tipText="tip text long enough" />, { apiClient: {} });
    expect(q('#deployments-agentRevisionId').disabled).toBe(true);
    expect(document.body.textContent).toContain('Select an agent first.');
  });
});

describe('deployments configuration', () => {
  const ctx = { t, i18n, lookups: { environments: ENVS, revisionNumbers: { arv_0001_1: 1 } } };

  it('adds Environment and Pinned revision columns and a client-side environment filter', () => {
    const keys = deploymentsConfig.columns(ctx).map((c) => c.key);
    expect(keys).toEqual(expect.arrayContaining(['environment', 'agentRevisionId']));
    const filter = deploymentsConfig.filters.find((f) => f.name === 'environment');
    expect(filter.clientSide).toBe(true);
    expect(filter.options({ environments: ENVS })).toEqual(['dev', 'staging', 'prod']);
    expect(filter.matches({ environment: 'staging' }, 'staging')).toBe(true);
    expect(filter.matches({}, 'dev')).toBe(true);
    const pin = deploymentsConfig.columns(ctx).find((c) => c.key === 'agentRevisionId');
    expect(pin.csv({ agentRevisionId: 'arv_0001_1' })).toBe('1');
    expect(pin.csv({})).toBe('latest');
  });

  it('puts environment and revision pin in the form and the body', () => {
    expect(deploymentsConfig.blank()).toMatchObject({ environment: 'dev', agentRevisionId: null });
    const fields = deploymentsConfig.fields({ environment: 'qa' }, { t, i18n, options: { environments: ENVS } });
    const env = fields.find((f) => f.name === 'environment');
    expect(env.options.map((o) => o.value)).toEqual(['dev', 'staging', 'prod', 'qa']);
    expect(fields.find((f) => f.name === 'agentRevisionId').type).toBe('custom');
    const body = deploymentsConfig.toBody({ ...deploymentsConfig.blank(), environment: '', agentRevisionId: '' });
    expect(body).toMatchObject({ environment: 'dev', agentRevisionId: null });
  });

  it('offers Promote and Promotion history row actions', () => {
    const labels = deploymentsConfig.rowActions({ id: 'dep_1', agentId: 'agt_0001' }, { t, navigate: () => {}, setExtraModal: () => {}, reload: () => {} }).map((a) => a.label);
    expect(labels).toEqual(expect.arrayContaining(['Promote', 'Promotion history']));
  });
});
