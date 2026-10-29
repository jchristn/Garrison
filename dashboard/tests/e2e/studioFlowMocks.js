// A stateful mock of the whole studio flow (AD12.11) on top of installMocks: an empty tenant whose only agent is the
// seeded agent-architect, the setup wizard creating the architect's deployment, a new draft that the architect fills
// over two mocked turns (two agents, their dev and staging deployments, then the app), request apply and the
// DraftApply approval, the applied app live in dev, promotion to staging, and rollback. Routes registered here run
// before the shared mocks (Playwright tries the newest route first) and fall back to them for everything else.

import { ARCHITECT_AGENT, ARCHITECT_DEPLOYMENT, draftApproval, respond, revisionId, studioRun } from './mocks.js';

const json = (status, body) => ({ status, contentType: 'application/json', body: JSON.stringify(body) });
const NOW = Date.parse('2026-10-09T12:00:00Z');
const iso = (minutes) => new Date(NOW - minutes * 60000).toISOString();

export const FLOW_DRAFT_ID = 'drf_0100';
export const FLOW_APP_ID = 'app_0100';

const PLANNER = { id: 'agt_0011', tenantId: 'default', name: 'planner', displayName: 'Planner', active: true, isProtected: false, createdUtc: iso(5), lastUpdateUtc: iso(5) };
const WRITER = { id: 'agt_0012', tenantId: 'default', name: 'writer', displayName: 'Writer', active: true, isProtected: false, createdUtc: iso(5), lastUpdateUtc: iso(5) };

const doc = (kind, name, spec) => `apiVersion: garrison/v1\nkind: ${kind}\nmetadata:\n  name: ${name}\nspec:\n${spec}`;

/** What the architect's first turn writes: two agents and a deployment of each in dev and in staging. */
const TURN_ONE_ITEMS = [
  { kind: 'Agent', name: 'planner', operation: 'Upsert', document: doc('Agent', 'planner', '  description: Plans the document\n') },
  { kind: 'Agent', name: 'writer', operation: 'Upsert', document: doc('Agent', 'writer', '  description: Writes the document\n') },
  ...['planner', 'writer'].flatMap((agent) =>
    ['dev', 'staging'].map((env) => ({ kind: 'Deployment', name: `${agent}-${env}`, operation: 'Upsert', document: doc('Deployment', `${agent}-${env}`, `  agent: ${agent}\n  environment: ${env}\n  harnessProfile: builtin/fake\n`) }))
  )
];

/** What the second turn writes: the app, with the planner as entry agent calling the writer. */
const TURN_TWO_ITEMS = [{ kind: 'AgenticApp', name: 'docs', operation: 'Upsert', document: doc('AgenticApp', 'docs', '  entry: planner\n  members:\n    - agent: planner\n    - agent: writer\n  edges:\n    - from: planner\n      to: writer\n') }];

/** A deployment the applied draft created; staging carries LOG_LEVEL=info and dev LOG_LEVEL=debug, so overrides differ. */
function appDeployment(agent, env, pinned) {
  const id = `dep_${agent.name}_${env}`;
  const out = {
    id,
    tenantId: 'default',
    name: `${agent.name}-${env}`,
    agentId: agent.id,
    harnessProfileId: 'hp_0001',
    model: 'sonnet',
    environment: env,
    active: true,
    environmentOverrides: [{ id: `chr_${id}_env`, deploymentId: id, name: 'LOG_LEVEL', valueTemplate: env === 'dev' ? 'debug' : 'info', isSecret: false }],
    createdUtc: iso(2),
    lastUpdateUtc: iso(2)
  };
  if (pinned) out.agentRevisionId = revisionId(agent.id, 1);
  return out;
}

/**
 * Install the flow. Returns the state so a test can assert on what the dashboard sent: architect deployment bodies,
 * architect invocations, the apply request, decisions, promotions, and rollbacks.
 */
export async function installStudioFlow(page) {
  const state = {
    architectBodies: [],
    architectCreated: false,
    invokes: [],
    turnsDone: 0,
    draft: null,
    applyRequests: [],
    decisions: [],
    applied: false,
    promotions: [],
    rollbacks: [],
    records: []
  };
  const promoted = () => state.records.some((r) => r.kind === 'Promote' && r.outcome === 'Applied');

  // Agents: an empty tenant has only the seeded architect; the applied draft adds the planner and the writer.
  await page.route(/\/tenants\/[^/]+\/agents(\?.*)?$/, (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    const all = state.applied ? [ARCHITECT_AGENT, PLANNER, WRITER] : [ARCHITECT_AGENT];
    const search = new URL(route.request().url()).searchParams.get('search');
    const rows = search ? all.filter((a) => a.name.includes(search)) : all;
    return route.fulfill(json(200, { objects: rows, totalRecords: rows.length, skip: 0, maxResults: rows.length, endOfResults: true }));
  });

  // Deployments: the shared list, the architect once the wizard created it, and the app's once the draft applied.
  await page.route(/\/tenants\/[^/]+\/deployments(\?.*)?$/, (route) => {
    const method = route.request().method();
    if (method === 'POST') {
      const body = route.request().postDataJSON();
      state.architectBodies.push(body);
      state.architectCreated = true;
      return route.fulfill(json(201, { ...ARCHITECT_DEPLOYMENT, name: body.name, model: body.model, architectPromptTemplateId: body.architectPromptTemplateId }));
    }
    if (method !== 'GET') return route.fallback();
    const base = respond('GET', new URL(route.request().url()));
    const extra = [];
    if (state.architectCreated) extra.push(ARCHITECT_DEPLOYMENT);
    if (state.applied) for (const agent of [PLANNER, WRITER]) extra.push(appDeployment(agent, 'dev', false), appDeployment(agent, 'staging', promoted()));
    return route.fulfill(json(200, { ...base, objects: [...base.objects, ...extra], totalRecords: base.totalRecords + extra.length }));
  });

  // The new draft and everything about it.
  await page.route(/\/studio\/drafts(\?.*)?$/, (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    const body = route.request().postDataJSON();
    state.draft = { id: FLOW_DRAFT_ID, tenantId: 'default', title: body.title, ownerUserId: 'usr_admin', ownerName: 'admin@garrison', version: 1, status: 'Open', items: [], publishOnApply: true, layout: [], createdUtc: iso(1), lastUpdateUtc: iso(1) };
    return route.fulfill(json(201, state.draft));
  });
  await page.route(new RegExp(`/studio/drafts/${FLOW_DRAFT_ID}(/[^?]*)?(\\?.*)?$`), (route) => {
    const url = new URL(route.request().url());
    const tail = url.pathname.split(`/studio/drafts/${FLOW_DRAFT_ID}`)[1] || '';
    const draft = state.draft;
    const diff = { draftId: draft.id, version: draft.version, valid: true, items: draft.items.map((i) => ({ kind: i.kind, name: i.name, change: state.applied ? 'Unchanged' : 'Create', changes: [], stale: false })) };
    if (tail === '' || tail === '/') return route.fulfill(json(200, draft));
    if (tail === '/diff' || tail === '/validate') return route.fulfill(json(200, diff));
    if (tail === '/graph') {
      const app = draft.items.find((i) => i.kind === 'AgenticApp');
      const nodes = draft.items
        .filter((i) => i.kind === 'Agent' || i.kind === 'AgenticApp')
        .map((i) => ({ key: `${i.kind}/${i.name}`, kind: i.kind, name: i.name, inDraft: true, deleted: false, entryOf: app && i.name === 'planner' ? ['docs'] : [], memberOf: app && i.kind === 'Agent' ? ['docs'] : [], capabilities: [] }));
      return route.fulfill(json(200, { draftId: draft.id, version: draft.version, nodes, edges: app ? [{ app: 'docs', from: 'planner', to: 'writer', fanOut: false, depth: 1 }] : [] }));
    }
    if (tail === '/request-apply') {
      state.applyRequests.push(route.request().postDataJSON());
      state.draft = { ...draft, status: 'PendingApproval', approvalId: 'apr_draft_0100' };
      return route.fulfill(json(201, { ...draftApproval('apr_draft_0100', draft.id), summary: 'Apply draft Docs app: 7 to create, 0 to update, 0 to delete.' }));
    }
    return route.fallback();
  });

  // The DraftApply approval: deciding Allow applies the draft (publishes the agents and deploys them to dev).
  await page.route(/\/approvals\/apr_draft_0100(\/decide)?$/, (route) => {
    const decided = { ...draftApproval('apr_draft_0100', FLOW_DRAFT_ID), summary: 'Apply draft Docs app: 7 to create, 0 to update, 0 to delete.' };
    if (route.request().url().endsWith('/decide')) {
      state.decisions.push(route.request().postDataJSON());
      state.applied = true;
      state.draft = { ...state.draft, status: 'Applied', manifestApplyId: 'mfa_0100' };
    }
    if (state.applied) return route.fulfill(json(200, { ...decided, status: 'Approved', decision: 'Allow', decisionSource: 'User', decidedBy: 'admin@garrison', decidedUtc: iso(0) }));
    return route.fulfill(json(200, decided));
  });

  // The architect: each invocation is one turn of the cnv_docs conversation. A turn finishes when the run is read; the
  // first adds the agents and their deployments, the second the app.
  await page.route(/\/agents\/agt_arch\/invoke(\?.*)?$/, (route) => {
    const body = route.request().postDataJSON();
    state.invokes.push(body);
    const n = state.invokes.length;
    return route.fulfill(json(200, studioRun(`run_arch_${n}`, { kind: 'Invoke', conversationId: 'cnv_docs', conversationTurn: n, inputText: body.input })));
  });
  const answer = (n) => (n === 1 ? 'I added a **planner** and a **writer**, each with a dev and a staging deployment.' : 'I added the **docs** app: the planner is the entry agent and calls the writer.');
  await page.route(/\/runs\/run_arch_(\d+)$/, (route) => {
    const n = Number(route.request().url().match(/run_arch_(\d+)$/)[1]);
    if (n > state.turnsDone) {
      state.turnsDone = n;
      const items = n === 1 ? TURN_ONE_ITEMS : [...state.draft.items, ...TURN_TWO_ITEMS];
      state.draft = { ...state.draft, version: state.draft.version + 1, items: items.map((i) => ({ ...i, lastUpdateUtc: iso(0) })) };
    }
    return route.fulfill(json(200, studioRun(`run_arch_${n}`, { kind: 'Invoke', status: 'Succeeded', outcome: 'Succeeded', conversationId: 'cnv_docs', conversationTurn: n, resultText: answer(n) })));
  });
  await page.route(/\/conversations\/cnv_docs\/runs(\?.*)?$/, (route) => {
    const runs = state.invokes.map((body, k) => {
      const n = k + 1;
      const done = n <= state.turnsDone;
      return studioRun(`run_arch_${n}`, { kind: 'Invoke', status: done ? 'Succeeded' : 'Running', outcome: done ? 'Succeeded' : 'None', conversationId: 'cnv_docs', conversationTurn: n, inputText: body.input, resultText: done ? answer(n) : undefined });
    });
    return route.fulfill(json(200, { objects: runs, totalRecords: runs.length }));
  });

  // The app, live once the draft applied.
  const app = () => ({
    id: FLOW_APP_ID,
    tenantId: 'default',
    name: 'docs',
    slug: 'docs',
    description: 'Plans and writes documents',
    entryAgentId: PLANNER.id,
    members: [
      { agentId: PLANNER.id, agentName: 'planner', role: 'Plans' },
      { agentId: WRITER.id, agentName: 'writer', role: 'Writes' }
    ],
    edges: [{ callerAgentId: PLANNER.id, calleeAgentId: WRITER.id, fanOutAllowed: false }],
    environments: [{ environment: 'dev' }, { environment: 'staging' }],
    liveEnvironment: 'dev',
    authMode: 'TenantUsers',
    anonymousEnabled: false,
    showOperatorDetail: false,
    latestPublishedRevisionId: 'apr_0100_1',
    active: true,
    createdUtc: iso(1),
    lastUpdateUtc: iso(1)
  });
  await page.route(/\/tenants\/[^/]+\/apps\/(docs|app_0100)$/, (route) => {
    if (!state.applied) return route.fulfill(json(404, { error: 'NotFound', code: 'NotFound', message: 'App docs was not found.' }));
    return route.fulfill(json(200, app()));
  });
  await page.route(/\/apps\/app_0100\/revisions$/, (route) =>
    route.fulfill(
      json(200, [
        {
          id: 'apr_0100_1',
          tenantId: 'default',
          appId: FLOW_APP_ID,
          number: 1,
          state: 'Published',
          members: [PLANNER, WRITER].map((a) => ({ agentId: a.id, agentName: a.name, agentRevisionId: revisionId(a.id, 1), agentRevisionNumber: 1 })),
          edges: app().edges,
          authorName: 'admin@garrison',
          changeNote: 'Applied from Docs app',
          publishedByName: 'admin@garrison',
          publishedUtc: iso(1),
          createdUtc: iso(1)
        }
      ])
    )
  );
  await page.route(/\/apps\/app_0100\/promote$/, (route) => {
    const body = route.request().postDataJSON();
    state.promotions.push(body);
    const items = [PLANNER, WRITER].map((a, k) => ({ id: `pri_0100_${k}`, promotionRecordId: 'pro_0100', deploymentId: `dep_${a.name}_staging`, deploymentName: `${a.name}-staging`, agentId: a.id, newRevisionId: revisionId(a.id, 1) }));
    const record = { id: 'pro_0100', tenantId: 'default', kind: 'Promote', outcome: 'Applied', appId: FLOW_APP_ID, appRevisionId: 'apr_0100_1', sourceEnvironment: body.sourceEnvironment, targetEnvironment: body.targetEnvironment, skippedEnvironments: false, actorType: 'User', actorId: 'usr_admin', actorName: 'admin@garrison', note: body.note, items, createdUtc: iso(0) };
    state.records = [record, ...state.records];
    return route.fulfill(json(201, record));
  });
  await page.route(/\/promotions(\?.*)?$/, (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() !== 'GET' || url.searchParams.get('appId') !== FLOW_APP_ID) return route.fallback();
    return route.fulfill(json(200, { objects: state.records, totalRecords: state.records.length, skip: 0, maxResults: 100, endOfResults: true }));
  });
  await page.route(/\/promotions\/pro_0100\/rollback$/, (route) => {
    state.rollbacks.push(route.request().postDataJSON());
    const original = state.records.find((r) => r.id === 'pro_0100');
    const rollback = { ...original, id: 'pro_0101', kind: 'Rollback', outcome: 'Applied', rollbackOfId: 'pro_0100', note: state.rollbacks[0]?.note, items: original.items.map((i) => ({ ...i, previousRevisionId: i.newRevisionId, newRevisionId: undefined })), createdUtc: iso(-1) };
    state.records = [rollback, ...state.records.map((r) => (r.id === 'pro_0100' ? { ...r, outcome: 'RolledBack', rolledBackById: 'pro_0101' } : r))];
    return route.fulfill(json(201, rollback));
  });

  return state;
}
