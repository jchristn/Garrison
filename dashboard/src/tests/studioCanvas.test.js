// Studio canvas (AD8.2 to AD8.6): YAML rewriting of draft items (agent, app, and deployment fields), the graph to
// canvas mapping, graph operation bodies, agent choices, the graph in words, deployments per environment, and field
// errors.
import { describe, it, expect, beforeAll } from 'vitest';
import i18n from '../i18n';
import { ApiError } from '../utils/api';
import {
  ManifestYamlError,
  extractDocument,
  joinPromptRef,
  manifestValue,
  parseManifest,
  parseSchemaText,
  readAgentFields,
  readAppFields,
  readDeploymentFields,
  runtimeErrors,
  splitPromptRef,
  writeAgentFields,
  writeAppFields,
  writeDeploymentFields
} from '../utils/manifestYaml';
import {
  agentChoices,
  canvasApps,
  defaultCanvasApp,
  draftDeployments,
  edgeId,
  fieldError,
  graphSummary,
  graphToFlow,
  liveDeployments,
  nodeLabel,
  operationBody,
  otherFieldErrors,
  parseEdgeId,
  samePosition,
  sortEnvironments
} from '../utils/studioCanvas';
import { STUDIO_APP_YAML, STUDIO_WRITER_YAML, studioDraft, studioGraph } from '../../tests/e2e/mocks.js';

const t = (...args) => i18n.t(...args);

beforeAll(async () => {
  await i18n.changeLanguage('en');
});

const DEPLOYMENT_YAML = [
  'apiVersion: garrison/v1',
  'kind: Deployment',
  'metadata:',
  '  name: writer-staging',
  'spec:',
  '  agent: writer',
  '  harnessProfile: builtin/fake',
  '  environment: staging',
  '  model: sonnet',
  '  timeoutSeconds: 300',
  '  prompts:',
  '    System: writer-system@2',
  '    Task: writer-task',
  '  parameters:',
  '    format: claude',
  ''
].join('\n');

describe('manifest YAML: agents', () => {
  it('reads the agent fields, with the description from spec when metadata has none', () => {
    const f = readAgentFields(STUDIO_WRITER_YAML);
    expect(f).toMatchObject({ name: 'writer', description: 'Writes the report', capabilities: ['pandoc'], hasCapabilities: true, hasAssets: false, assets: [], inputSchema: '', outputSchema: '' });
    const json = readAgentFields('kind: Agent\nmetadata:\n  name: a\n  description: Meta\nspec:\n  inputSchemaJson: \'{"type":"object"}\'\n');
    expect(json.description).toBe('Meta');
    expect(JSON.parse(json.inputSchema)).toEqual({ type: 'object' });
  });

  it('writes the description where the document keeps it and leaves other keys alone', () => {
    const text = writeAgentFields(STUDIO_WRITER_YAML, { ...readAgentFields(STUDIO_WRITER_YAML), description: 'Writes the final report' });
    const v = manifestValue(text);
    expect(v.spec.description).toBe('Writes the final report');
    expect(v.metadata.description).toBeUndefined();
    expect(v.spec.capabilities).toEqual(['pandoc']);
    expect(v.apiVersion).toBe('garrison/v1');
    expect(text.indexOf('kind: Agent')).toBeLessThan(text.indexOf('metadata:'));
  });

  it('writes schemas as YAML mappings, replacing JSON strings, and clears them when empty', () => {
    const base = 'kind: Agent\nmetadata:\n  name: a\nspec:\n  inputSchemaJson: \'{"type":"string"}\'\n  displayName: A\n';
    const fields = { ...readAgentFields(base), inputSchema: '{"type":"object","required":["topic"]}', outputSchema: '{"type":"object"}' };
    const v = manifestValue(writeAgentFields(base, fields));
    expect(v.spec.inputSchemaJson).toBeUndefined();
    expect(v.spec.inputSchema).toEqual({ type: 'object', required: ['topic'] });
    expect(v.spec.outputSchema).toEqual({ type: 'object' });
    expect(v.spec.displayName).toBe('A');
    const cleared = manifestValue(writeAgentFields(writeAgentFields(base, fields), { ...fields, inputSchema: '', outputSchema: ' ' }));
    expect(cleared.spec.inputSchema).toBeUndefined();
    expect(cleared.spec.outputSchema).toBeUndefined();
  });

  it('refuses schema text that is not a JSON object', () => {
    expect(parseSchemaText('')).toEqual({ value: null });
    expect(parseSchemaText('{"type":"object"}')).toEqual({ value: { type: 'object' } });
    expect(parseSchemaText('{type')).toEqual({ error: 'json' });
    expect(parseSchemaText('[1]')).toEqual({ error: 'object' });
    expect(() => writeAgentFields(STUDIO_WRITER_YAML, { ...readAgentFields(STUDIO_WRITER_YAML), inputSchema: 'nope' })).toThrow(/inputSchema/);
  });

  it('writes assets and capabilities only when the document named them or the person set some', () => {
    const plain = 'kind: Agent\nmetadata:\n  name: a\nspec: {}\n';
    const untouched = manifestValue(writeAgentFields(plain, readAgentFields(plain)));
    expect(untouched.spec).toEqual({});
    const set = writeAgentFields(plain, { ...readAgentFields(plain), assets: [{ asset: 'style', version: '2' }, { asset: 'notes', version: '' }, { asset: ' ', version: '' }], capabilities: [' pandoc', '', 'git'] });
    const v = manifestValue(set);
    expect(v.spec.assets).toEqual([{ asset: 'style', version: 2 }, { asset: 'notes' }]);
    expect(v.spec.capabilities).toEqual(['pandoc', 'git']);
    // Block style, not `spec: {}` with keys inside the braces.
    expect(set).toMatch(/spec:\n {2}assets:/);
    // Clearing a list the document named writes an empty list (the next revision has none), not "keep current".
    const cleared = manifestValue(writeAgentFields(set, { ...readAgentFields(set), capabilities: [] }));
    expect(cleared.spec.capabilities).toEqual([]);
  });

  it('throws ManifestYamlError for a document that does not parse', () => {
    expect(() => parseManifest('kind: [unclosed')).toThrow(ManifestYamlError);
    expect(() => parseManifest('- a\n- b\n')).toThrow(ManifestYamlError);
    expect(manifestValue('kind: [unclosed')).toBeNull();
  });
});

describe('manifest YAML: apps', () => {
  it('reads and writes sign-in and branding, dropping an empty branding block', () => {
    const f = readAppFields(STUDIO_APP_YAML);
    expect(f).toMatchObject({ name: 'research', entry: 'planner', authMode: '', anonymousEnabled: false });
    expect(f.branding.displayName).toBe('');
    const text = writeAppFields(STUDIO_APP_YAML, { ...f, authMode: 'Anonymous', anonymousEnabled: true, branding: { ...f.branding, displayName: 'Research Desk', primaryColor: '#1F6FEB' } });
    const v = manifestValue(text);
    expect(v.spec.authMode).toBe('Anonymous');
    expect(v.spec.anonymousEnabled).toBe(true);
    expect(v.spec.branding).toEqual({ displayName: 'Research Desk', primaryColor: '#1F6FEB' });
    // Members, edges, and the entry agent are the graph operations' business.
    expect(v.spec.members).toHaveLength(3);
    expect(v.spec.edges[1]).toEqual({ from: 'planner', to: 'writer', fanOut: false });
    expect(v.spec.entry).toBe('planner');
    const bare = manifestValue(writeAppFields(text, { ...readAppFields(text), branding: { displayName: '', logo: '', primaryColor: '', accentColor: '', welcomeText: '' } }));
    expect(bare.spec.branding).toBeUndefined();
  });
});

describe('manifest YAML: deployments', () => {
  it('reads runtime fields with the System prompt split from its pinned version', () => {
    const f = readDeploymentFields(DEPLOYMENT_YAML);
    expect(f).toMatchObject({ name: 'writer-staging', agent: 'writer', environment: 'staging', model: 'sonnet', timeoutSeconds: '300', maxTurns: '', systemTemplate: 'writer-system', systemVersion: '2', approvalsEnabled: false, approvalDefaultAction: 'Ask', approvalRules: [] });
    expect(readDeploymentFields('kind: Deployment\nmetadata:\n  name: d\nspec:\n  agent: a\n').environment).toBe('dev');
  });

  it('changes only the runtime keys and keeps other prompts and parameters', () => {
    const f = readDeploymentFields(DEPLOYMENT_YAML);
    const text = writeDeploymentFields(DEPLOYMENT_YAML, { ...f, timeoutSeconds: '600', maxTurns: '20', maxBudgetUsd: '2.5', effort: 'high', systemVersion: '' });
    const v = manifestValue(text);
    expect(v.spec).toMatchObject({ agent: 'writer', harnessProfile: 'builtin/fake', environment: 'staging', model: 'sonnet', effort: 'high', timeoutSeconds: 600, maxTurns: 20, maxBudgetUsd: 2.5, parameters: { format: 'claude' } });
    expect(v.spec.prompts).toEqual({ System: 'writer-system', Task: 'writer-task' });
    expect(v.spec.approvalsEnabled).toBeUndefined();
    expect(v.spec.approvalRules).toBeUndefined();
  });

  it('writes approvals and drops empty runtime values', () => {
    const f = readDeploymentFields(DEPLOYMENT_YAML);
    const text = writeDeploymentFields(DEPLOYMENT_YAML, {
      ...f,
      model: '',
      timeoutSeconds: '',
      systemTemplate: '',
      approvalsEnabled: true,
      approvalDefaultAction: 'Deny',
      approvalRules: [
        { action: 'Allow', pattern: 'Read', inputPattern: '', description: '' },
        { action: 'Ask', pattern: 'Bash(git *)', inputPattern: 'push', description: 'Pushes' },
        { action: 'Deny', pattern: '  ', inputPattern: '', description: '' }
      ]
    });
    const v = manifestValue(text);
    expect(v.spec.model).toBeUndefined();
    expect(v.spec.timeoutSeconds).toBeUndefined();
    expect(v.spec.prompts).toEqual({ Task: 'writer-task' });
    expect(v.spec.approvalsEnabled).toBe(true);
    expect(v.spec.approvalDefaultAction).toBe('Deny');
    expect(v.spec.approvalRules).toEqual([
      { action: 'Allow', pattern: 'Read' },
      { action: 'Ask', pattern: 'Bash(git *)', inputPattern: 'push', description: 'Pushes' }
    ]);
  });

  it('checks runtime values before saving', () => {
    expect(runtimeErrors({ timeoutSeconds: '600', maxTurns: '', maxBudgetUsd: '0', systemTemplate: 'x', systemVersion: '3', approvalRules: [] })).toEqual({});
    expect(runtimeErrors({ timeoutSeconds: '0', maxTurns: '2.5', maxBudgetUsd: '-1', systemTemplate: '', systemVersion: '3', approvalRules: [{ pattern: '' }] })).toEqual({
      timeoutSeconds: 'integer',
      maxTurns: 'integer',
      maxBudgetUsd: 'number',
      systemVersion: 'version',
      'approvalRules[0].pattern': 'pattern'
    });
  });

  it('splits and joins template references', () => {
    expect(splitPromptRef('shouty-task@1')).toEqual({ template: 'shouty-task', version: '1' });
    expect(splitPromptRef('builtin/agent-architect')).toEqual({ template: 'builtin/agent-architect', version: '' });
    expect(splitPromptRef(undefined)).toEqual({ template: '', version: '' });
    expect(joinPromptRef('a', '2')).toBe('a@2');
    expect(joinPromptRef('a', '')).toBe('a');
    expect(joinPromptRef('', '2')).toBe('');
  });

  it('extracts one document from an exported bundle', () => {
    const bundle = `apiVersion: garrison/v1\nkind: Bundle\nmetadata:\n  name: export\nspec: {}\n---\n${DEPLOYMENT_YAML}---\n${STUDIO_WRITER_YAML}`;
    const doc = extractDocument(bundle, 'Deployment', 'writer-staging');
    expect(manifestValue(doc).spec.environment).toBe('staging');
    expect(doc).not.toContain('kind: Bundle');
    expect(extractDocument(bundle, 'Deployment', 'missing')).toBeNull();
    expect(extractDocument('', 'Agent', 'a')).toBeNull();
  });
});

describe('graph to canvas', () => {
  it('maps the app to nodes in reading order and edges with fan-out and depth', () => {
    const flow = graphToFlow(studioGraph(), 'research');
    expect(flow.app).toBe('research');
    expect(flow.entry).toBe('planner');
    expect(flow.nodes.map((n) => n.id)).toEqual(['planner', 'researcher', 'writer']);
    expect(flow.nodes[0]).toMatchObject({ entry: true, saved: false, position: { x: 24, y: 24 } });
    expect(flow.nodes[2]).toMatchObject({ inDraft: true, capabilities: ['pandoc'], position: { x: 264, y: 144 } });
    expect(flow.edges).toEqual([
      { id: 'planner>researcher', from: 'planner', to: 'researcher', fanOut: true, depth: 1 },
      { id: 'planner>writer', from: 'planner', to: 'writer', fanOut: false, depth: 1 }
    ]);
    expect(flow.loose).toEqual([]);
  });

  it('uses saved positions and lists agents in no app', () => {
    const graph = studioGraph();
    graph.nodes = graph.nodes.map((n) => (n.name === 'writer' ? { ...n, x: 500.4, y: 80 } : n));
    graph.nodes.push({ key: 'Agent/editor', kind: 'Agent', name: 'editor', inDraft: true, deleted: false, entryOf: [], memberOf: [], capabilities: [] });
    const flow = graphToFlow(graph, 'research');
    expect(flow.nodes.find((n) => n.id === 'writer')).toMatchObject({ saved: true, position: { x: 500.4, y: 80 } });
    expect(flow.loose).toEqual(['editor']);
    expect(graphToFlow(graph, 'missing')).toMatchObject({ nodes: [], edges: [], entry: '' });
  });

  it('finds the apps and the one to open', () => {
    const graph = studioGraph();
    expect(canvasApps(graph, studioDraft(1))).toEqual(['research']);
    expect(canvasApps({ nodes: [], edges: [] }, { targetApp: 'docs' })).toEqual(['docs']);
    expect(defaultCanvasApp(graph, studioDraft(1), 'gone')).toBe('research');
    expect(defaultCanvasApp({ nodes: [], edges: [] }, { targetApp: null }, null)).toBe('');
  });

  it('builds graph operation bodies with only the fields they use', () => {
    expect(operationBody(3, 'Connect', { app: 'research', from: 'a', to: 'b', fanOut: false, role: '' })).toEqual({ version: 3, operation: 'Connect', app: 'research', from: 'a', to: 'b', fanOut: false });
    expect(operationBody(4, 'MoveNode', { nodeKey: 'Agent/a', x: 10.6, y: '20.2' })).toEqual({ version: 4, operation: 'MoveNode', nodeKey: 'Agent/a', x: 11, y: 20 });
    expect(operationBody(5, 'AddMember', { app: 'research', agent: 'editor', role: undefined })).toEqual({ version: 5, operation: 'AddMember', app: 'research', agent: 'editor' });
    expect(edgeId('a', 'b')).toBe('a>b');
    expect(parseEdgeId('a>b')).toEqual({ from: 'a', to: 'b' });
    expect(parseEdgeId('nope')).toEqual({ from: '', to: '' });
    expect(samePosition({ x: 1.2, y: 2 }, { x: 1, y: 2.4 })).toBe(true);
    expect(samePosition(null, { x: 1, y: 2 })).toBe(false);
  });

  it('offers tenant and draft agents that are not members yet', () => {
    const agents = [{ name: 'editor' }, { name: 'planner' }, { name: 'agent-architect' }];
    const draft = { ...studioDraft(1), items: [...studioDraft(1).items, { kind: 'Agent', name: 'reviewer', operation: 'Upsert', document: '' }, { kind: 'Agent', name: 'old', operation: 'Delete', document: '' }] };
    expect(agentChoices(agents, studioGraph(), draft, 'research')).toEqual(['editor', 'reviewer']);
  });

  it('describes the graph in words', () => {
    const flow = graphToFlow(studioGraph(), 'research');
    const summary = graphSummary(t, flow);
    expect(summary.overview).toBe('App research has 3 agents. There are 2 calls between them. The entry agent is planner.');
    expect(summary.calls).toEqual(['planner calls researcher, parallel calls allowed, delegation depth 1.', 'planner calls writer, one call at a time, delegation depth 1.']);
    const one = graphSummary(t, { ...flow, nodes: flow.nodes.slice(0, 1), edges: flow.edges.slice(0, 1), entry: '' });
    expect(one.overview).toBe('App research has 1 agent. There is 1 call between them. No entry agent is set.');
    expect(graphSummary(t, graphToFlow(null, '')).overview).toBe('There is no app to describe.');
    expect(nodeLabel(t, flow.nodes[0])).toBe('planner, Entry');
    expect(nodeLabel(t, flow.nodes[2])).toBe('writer, In draft, Capabilities: pandoc');
  });
});

describe('deployments per environment', () => {
  const draft = {
    items: [
      { kind: 'Deployment', name: 'writer-prod-x', operation: 'Upsert', document: 'kind: Deployment\nmetadata:\n  name: writer-prod-x\nspec:\n  agent: writer\n  environment: prod\n' },
      { kind: 'Deployment', name: 'writer-staging', operation: 'Upsert', document: DEPLOYMENT_YAML },
      { kind: 'Deployment', name: 'writer-dev', operation: 'Upsert', document: 'kind: Deployment\nmetadata:\n  name: writer-dev\nspec:\n  agent: writer\n' },
      { kind: 'Deployment', name: 'planner-dev', operation: 'Upsert', document: 'kind: Deployment\nmetadata:\n  name: planner-dev\nspec:\n  agent: planner\n' },
      { kind: 'Deployment', name: 'writer-gone', operation: 'Delete', document: '' }
    ]
  };

  it('lists the agent deployment items in promotion order', () => {
    expect(draftDeployments(draft, 'writer').map((d) => `${d.fields.environment}:${d.item.name}`)).toEqual(['dev:writer-dev', 'staging:writer-staging', 'prod:writer-prod-x']);
    expect(sortEnvironments(['qa', 'prod', 'dev', 'dev', 'canary'])).toEqual(['dev', 'prod', 'canary', 'qa']);
  });

  it('lists live deployments the draft does not hold, without playground copies', () => {
    const agents = [{ id: 'agt_w', name: 'writer' }];
    const deployments = [
      { id: 'd1', name: 'writer-dev', agentId: 'agt_w', environment: 'dev' },
      { id: 'd2', name: 'writer-prod', agentId: 'agt_w', environment: 'prod' },
      { id: 'd3', name: 'playground-writer', agentId: 'agt_w', environment: 'draft' },
      { id: 'd4', name: 'other', agentId: 'agt_x', environment: 'dev' },
      { id: 'd5', name: 'writer-qa', agentId: 'agt_w' }
    ];
    expect(liveDeployments(deployments, agents, 'writer', draft).map((d) => d.name)).toEqual(['writer-qa', 'writer-prod']);
  });
});

describe('field errors', () => {
  it('translates field codes and falls back to the server message', () => {
    const error = new ApiError(400, { code: 'ValidationFailed', message: 'Invalid.', fields: { to: 'A member cannot call itself.', from: 'x is odd.' }, fieldCodes: { to: 'SelfEdge', from: 'Whatever' } });
    expect(fieldError(t, error, 'to')).toBe('An agent cannot call itself.');
    expect(fieldError(t, error, 'from')).toBe('x is odd.');
    expect(fieldError(t, error, 'missing')).toBe('');
    expect(fieldError(t, null, 'to')).toBe('');
    expect(otherFieldErrors(t, error, ['to'])).toEqual(['from: x is odd.']);
  });
});
