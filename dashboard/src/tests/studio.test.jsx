// Agent studio (AD7.10, AD7.16, AD9.2, AD9.3): the helpers (status filters, conflict changes, the architect's first
// message, architect deployments and prompts, PromptTemplateInUse names, diff counts, new-item checks, playground agents
// and transcript, graph shapes, compile preview summary, live channel, permissions), the API client routes, the
// navigation entry, and the graph drawn with delegation depth and capabilities.
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../i18n';
import StudioGraphPanel from '../components/studio/StudioGraphPanel';
import { PAGE_VIEWS, DETAIL_VIEWS } from '../views/hubs/hubPanels';
import { findPage, pathFor } from '../config/navConfig';
import ApiClient from '../utils/api';
import { ENUMS } from '../utils/constants';
import { errorMessage } from '../utils/errors';
import { ApiError } from '../utils/api';
import {
  DEFAULT_ARCHITECT_PROMPT,
  architectDeployments,
  compilePreviewBody,
  compilePreviewSummary,
  defaultArchitectPrompt,
  diffCounts,
  draftChanges,
  draftStatusTone,
  entryAgent,
  filterDrafts,
  findArchitectAgent,
  firstArchitectMessage,
  graphApps,
  inUseDeployments,
  isDraftOpen,
  isStudioDraftChanged,
  itemTemplate,
  newItemErrors,
  noItemChanges,
  playgroundAgents,
  playgroundFileName,
  playgroundMarkdown,
  sortArchitectPrompts,
  staleKeys,
  stripDraftPrefix,
  studioDraftChannel,
  studioPermissions
} from '../utils/studio';
import { ARCHITECT_DEPLOYMENT, architectPrompts, studioDiff, studioDraft, studioGraph } from '../../tests/e2e/mocks.js';

const t = (...args) => i18n.t(...args);

beforeAll(async () => {
  await i18n.changeLanguage('en');
});

describe('studio helpers', () => {
  it('filters drafts by status chips in the browser, showing every status with none chosen', () => {
    const drafts = [1, 2, 3, 4].map(studioDraft);
    expect(filterDrafts(drafts, new Set())).toHaveLength(4);
    expect(filterDrafts(drafts, ['PendingApproval']).map((d) => d.id)).toEqual(['drf_0002']);
    expect(filterDrafts(drafts, new Set(['Applied', 'Discarded'])).map((d) => d.id)).toEqual(['drf_0003', 'drf_0004']);
    expect(filterDrafts(null, [])).toEqual([]);
    expect(isDraftOpen(studioDraft(1))).toBe(true);
    expect(isDraftOpen(studioDraft(2))).toBe(false);
    expect(draftStatusTone('PendingApproval')).toBe('warning');
    expect(ENUMS.studioDraftStatus).toEqual(['Open', 'PendingApproval', 'Applied', 'Discarded']);
  });

  it('names what changed between two reads of a draft', () => {
    const before = studioDraft(1);
    const after = {
      ...before,
      version: 5,
      items: [...before.items.filter((i) => i.name !== 'writer-dev').map((i) => (i.name === 'writer' ? { ...i, document: `${i.document}#\n` } : i)), { kind: 'Agent', name: 'reviewer', operation: 'Upsert', document: '' }]
    };
    const changes = draftChanges(before, after);
    expect(changes).toMatchObject({ added: ['Agent/reviewer'], updated: ['Agent/writer'], removed: ['Deployment/writer-dev'], fromVersion: 3, toVersion: 5, statusChanged: false });
    expect(noItemChanges(changes)).toBe(false);
    const moved = draftChanges(before, { ...before, version: 4, status: 'PendingApproval' });
    expect(noItemChanges(moved)).toBe(true);
    expect(moved.statusChanged).toBe(true);
  });

  it('prefixes the first architect message with the draft and strips it for display', () => {
    const text = firstArchitectMessage(studioDraft(1), '  Add a writer ');
    expect(text).toBe('[Studio draft drf_0001: Research app]\n\nAdd a writer');
    expect(stripDraftPrefix(text)).toBe('Add a writer');
    expect(stripDraftPrefix('No prefix')).toBe('No prefix');
    expect(firstArchitectMessage(null, 'hi')).toBe('hi');
  });

  it('finds architect deployments, the agent-architect agent, and orders architect prompts', () => {
    expect(architectDeployments([{ id: 'dep_0001', managementAccess: 'None' }, ARCHITECT_DEPLOYMENT]).map((d) => d.id)).toEqual(['dep_arch']);
    expect(findArchitectAgent([{ id: 'a', name: 'agent-architect-x' }, { id: 'b', name: 'agent-architect' }]).id).toBe('b');
    expect(findArchitectAgent([])).toBeNull();
    const shuffled = [architectPrompts()[2], architectPrompts()[1], architectPrompts()[0]];
    expect(sortArchitectPrompts(shuffled).map((p) => p.name)).toEqual(['builtin/agent-architect', 'builtin/agent-architect-guided', 'agent-architect-team']);
    expect(defaultArchitectPrompt(shuffled).name).toBe(DEFAULT_ARCHITECT_PROMPT);
    expect(defaultArchitectPrompt([{ id: 'x', name: DEFAULT_ARCHITECT_PROMPT }]).id).toBe('x');
  });

  it('reads the deployments a PromptTemplateInUse refusal names', () => {
    expect(inUseDeployments('Prompt template agent-architect-team is bound by deployment(s) dep_arch (architect), dep_2 (second). Unbind it or switch those deployments to another template first.')).toEqual([
      'architect',
      'second'
    ]);
    expect(inUseDeployments('Prompt template x is bound by deployment(s) dep_9. Unbind it.')).toEqual(['dep_9']);
    expect(inUseDeployments('Something else.')).toEqual([]);
  });

  it('counts the diff and marks stale items', () => {
    expect(diffCounts(studioDiff('drf_0001', 3, false))).toEqual({ Create: 1, Update: 1, Delete: 0, Unchanged: 0, Failed: 1, stale: 1 });
    expect([...staleKeys(studioDiff())]).toEqual(['AgenticApp/research']);
    expect(diffCounts(null).Create).toBe(0);
  });

  it('starts new items with a manifest header and checks them like the server', () => {
    expect(itemTemplate('Agent', 'writer')).toContain('kind: Agent\nmetadata:\n  name: writer');
    const items = studioDraft(1).items;
    expect(newItemErrors({ kind: 'Agent', name: 'reviewer', operation: 'Upsert' }, items, t)).toEqual({});
    expect(newItemErrors({ kind: 'Agent', name: 'writer', operation: 'Upsert' }, items, t).name).toBe('The draft already holds Agent/writer.');
    expect(newItemErrors({ kind: 'Agent', name: '-bad', operation: 'Upsert' }, items, t).name).toMatch(/starting with a letter or digit/);
    expect(newItemErrors({ kind: 'PromptTemplate', name: 'p', operation: 'Delete' }, items, t).operation).toMatch(/not PromptTemplate/);
    expect(newItemErrors({ kind: 'Secret', name: 'x', operation: 'Upsert' }, items, t).kind).toBeTruthy();
  });

  it('offers the draft agents in the playground and finds the entry agent', () => {
    const draft = studioDraft(1);
    const graph = studioGraph();
    expect(playgroundAgents(draft, graph)).toEqual(['planner', 'researcher', 'writer']);
    expect(entryAgent(draft, graph)).toBe('planner');
    expect(entryAgent({ targetApp: 'other' }, graph)).toBe('planner');
    expect(entryAgent(draft, { nodes: [] })).toBeNull();
  });

  it('writes the playground turns as Markdown', () => {
    const md = playgroundMarkdown(studioDraft(1), [
      { input: 'Hi', agent: 'planner', answer: 'Hello', runId: 'run_1' },
      { input: 'Again', agent: 'writer', status: 'Failed', error: 'Boom' }
    ]);
    expect(md).toContain('# Playground: Research app');
    expect(md).toContain('## Turn 1 (planner)');
    expect(md).toContain('Hello');
    expect(md).toContain('Run: run_1');
    expect(md).toContain('Boom');
    expect(md.endsWith('\n')).toBe(true);
    expect(playgroundFileName({ id: 'drf/1 x' })).toBe('playground-drf-1-x.md');
  });

  it('shapes the draft graph into apps with depth, and lists agents in no app', () => {
    const graph = studioGraph();
    graph.nodes.push({ key: 'Agent/loner', kind: 'Agent', name: 'loner', inDraft: true, deleted: false, entryOf: [], memberOf: [], capabilities: ['web'] });
    const { apps, loose } = graphApps(graph);
    expect(apps).toHaveLength(1);
    expect(apps[0]).toMatchObject({ name: 'research', entryAgentId: 'planner', inDraft: true });
    expect(apps[0].members.map((m) => m.agentId)).toEqual(['planner', 'researcher', 'writer']);
    expect(apps[0].edges).toContainEqual({ callerAgentId: 'planner', calleeAgentId: 'writer', fanOutAllowed: false, depth: 1 });
    expect(loose.map((n) => n.name)).toEqual(['loner']);
    expect(graphApps(null)).toEqual({ apps: [], loose: [] });
  });

  it('summarizes a compile preview and sends only the chosen revision and environment', () => {
    const summary = compilePreviewSummary({
      commandLine: 'claude -p',
      deploymentId: 'dep_0002',
      spec: { executable: 'claude', arguments: ['-p'], assetFiles: [{ assetName: 's', kind: 'Skill', version: 2, path: '.claude/skills/s/SKILL.md', sizeBytes: 5 }], fileSpace: { mountPath: 'files', maxFiles: 10, maxFileBytes: 100, files: [{ path: 'a' }] } }
    });
    expect(summary).toMatchObject({ commandLine: 'claude -p', deploymentId: 'dep_0002', fileSpace: { mountPath: 'files', files: 1, maxFiles: 10 } });
    expect(summary.assets[0].path).toBe('.claude/skills/s/SKILL.md');
    expect(compilePreviewSummary({ spec: { executable: 'claude', arguments: ['-p', 'two words'] } }).commandLine).toBe('claude -p "two words"');
    expect(compilePreviewSummary({ spec: {} }).fileSpace).toBeNull();
    expect(compilePreviewBody({ input: 'x' })).toEqual({ input: 'x', parameters: {} });
    expect(compilePreviewBody({ input: 'x', agentRevisionId: 'arv_1', environment: 'prod' })).toEqual({ input: 'x', parameters: {}, agentRevisionId: 'arv_1', environment: 'prod' });
  });

  it('recognizes studio-draft.changed for its draft only', () => {
    expect(studioDraftChannel('drf_0001')).toBe('studio-draft:drf_0001');
    expect(isStudioDraftChanged({ type: 'studio-draft.changed', draftId: 'drf_0001', version: 4 }, 'drf_0001')).toBe(true);
    expect(isStudioDraftChanged({ type: 'studio-draft.changed', draftId: 'drf_0002' }, 'drf_0001')).toBe(false);
    expect(isStudioDraftChanged({ type: 'fan-out.status' }, 'drf_0001')).toBe(false);
  });

  it('explains missing permissions and disables nothing when they are unknown', () => {
    expect(Object.values(studioPermissions(t, null)).every((v) => v === '')).toBe(true);
    expect(Object.values(studioPermissions(t, { isAdmin: true, grants: [] })).every((v) => v === '')).toBe(true);
    const reader = { grants: [{ permissionType: 'Permit', resourceTypes: ['StudioDraft', 'Approval', 'PromptTemplate', 'Deployment'], operations: ['Read'], scope: 'Tenant' }] };
    const denied = studioPermissions(t, reader);
    expect(denied.create).toBe('You need Create permission on Studio draft for this. Ask an administrator for a role that grants it.');
    expect(denied.decide).toMatch(/Update permission on Approval/);
    expect(denied.preview).toBe('');
    const decider = { grants: [{ permissionType: 'Permit', resourceTypes: ['Approval'], operations: ['Update'], scope: 'Tenant' }] };
    expect(studioPermissions(t, decider).decide).toMatch(/Create permission on Manifest/);
  });

  it('translates the studio refusals', () => {
    const err = (status, code, message) => new ApiError(status, { code, message });
    expect(errorMessage(t, err(409, 'DraftVersionConflict', 'Draft x changed since version you read; read it again (it is at a newer version) and retry.'))).toBe('The draft changed since you read it. Read it again and retry.');
    expect(errorMessage(t, err(403, 'ApproverLacksPermission', 'x'))).toMatch(/Create on Manifest/);
    expect(errorMessage(t, err(409, 'DraftStale', 'x'))).toMatch(/Live configuration changed/);
    expect(errorMessage(t, err(400, 'AgentNotLive', 'x'))).toMatch(/Apply the draft before trying/);
  });
});

describe('API client', () => {
  it('calls the studio routes', async () => {
    const calls = [];
    const fetchMock = vi.fn(async (url, init) => {
      calls.push(`${init.method} ${String(url).replace('http://127.0.0.1:8700', '')}${init.body ? ` ${init.body}` : ''}`);
      const body = String(url).endsWith('/architect-prompts') ? architectPrompts() : {};
      return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    try {
      const c = new ApiClient('http://127.0.0.1:8700', 'tok');
      await c.listStudioDrafts('default', { mine: true, search: 'res', pageNumber: 1, pageSize: 10 });
      await c.listStudioDrafts('default', { mine: false });
      await c.getStudioDraft('default', 'drf_1');
      await c.createStudioDraft('default', { title: 'T', fromApp: 'research' });
      await c.deleteStudioDraft('default', 'drf_1');
      await c.putStudioDraftItem('default', 'drf_1', 'Agent', 'writer', { version: 3, operation: 'Upsert', document: 'x' });
      await c.removeStudioDraftItem('default', 'drf_1', 'Agent', 'writer', 4);
      await c.getStudioDraftDiff('default', 'drf_1');
      await c.validateStudioDraft('default', 'drf_1');
      await c.requestStudioDraftApply('default', 'drf_1', 5);
      await c.getStudioDraftGraph('default', 'drf_1');
      await c.invokeStudioPlayground('default', 'drf_1', { input: 'hi', wait: false });
      expect(await c.listArchitectPrompts('default')).toHaveLength(3);
      await c.getArchitectPrompt('default', 'dep_arch');
      await c.setArchitectPrompt('default', 'dep_arch', { architectPromptTemplateId: 'pt_1' });
    } finally {
      vi.unstubAllGlobals();
    }
    expect(calls).toEqual([
      'GET /v1.0/api/tenants/default/studio/drafts?search=res&mine=true&maxResults=10&skip=0',
      'GET /v1.0/api/tenants/default/studio/drafts',
      'GET /v1.0/api/tenants/default/studio/drafts/drf_1',
      'POST /v1.0/api/tenants/default/studio/drafts {"title":"T","fromApp":"research"}',
      'DELETE /v1.0/api/tenants/default/studio/drafts/drf_1',
      'PUT /v1.0/api/tenants/default/studio/drafts/drf_1/items/Agent/writer {"version":3,"operation":"Upsert","document":"x"}',
      'DELETE /v1.0/api/tenants/default/studio/drafts/drf_1/items/Agent/writer?version=4',
      'GET /v1.0/api/tenants/default/studio/drafts/drf_1/diff',
      'POST /v1.0/api/tenants/default/studio/drafts/drf_1/validate',
      'POST /v1.0/api/tenants/default/studio/drafts/drf_1/request-apply {"version":5}',
      'GET /v1.0/api/tenants/default/studio/drafts/drf_1/graph',
      'POST /v1.0/api/tenants/default/studio/drafts/drf_1/playground/invoke {"input":"hi","wait":false}',
      'GET /v1.0/api/tenants/default/studio/architect-prompts',
      'GET /v1.0/api/tenants/default/studio/architects/dep_arch/prompt',
      'PUT /v1.0/api/tenants/default/studio/architects/dep_arch/prompt {"architectPromptTemplateId":"pt_1"}'
    ]);
  });
});

describe('studio page', () => {
  it('is a tab under Agents with a draft workspace at /dashboard/studio/{id}', () => {
    expect(findPage('studio')).toMatchObject({ hub: 'agents', tab: 'studio', detail: true });
    expect(pathFor('studio')).toBe('/dashboard/agents?tab=studio');
    expect(pathFor('studio', 'drf_0001')).toBe('/dashboard/studio/drf_0001');
    expect(PAGE_VIEWS.studio).toBeTruthy();
    expect(DETAIL_VIEWS.studio).toBeTruthy();
  });

  it('draws each app with the delegation depth on its calls and capabilities under the agents', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <StudioGraphPanel graph={studioGraph()} />
      </MemoryRouter>
    );
    expect(html).toContain('data-testid="studio-graph-research"');
    expect(html).toContain('data-edge-label="planner&gt;writer"');
    expect(html).toContain('depth 1');
    expect(html).toContain('data-node-note="writer"');
    expect(html).toContain('pandoc');
    expect(html).toMatch(/class="app-graph-node is-entry[^"]*" data-node="planner"/);
    expect(html).toMatch(/class="app-graph-node is-drafted" data-node="writer"/);
    const empty = renderToStaticMarkup(<StudioGraphPanel graph={{ nodes: [], edges: [] }} />);
    expect(empty).toContain('The draft holds no apps or agents to draw yet.');
  });
});
