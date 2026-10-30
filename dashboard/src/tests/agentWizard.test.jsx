// Agent wizard: the step helpers (names, credential kinds, draft contents, test target, dev deployment plan and bodies,
// credential binding, diff problems), its stored state, and the navigation entry (a hidden detail page under Agents,
// with the studio tab hidden).
import { describe, it, expect, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../i18n';
import { findHub, findPage, pathFor } from '../config/navConfig';
import { DETAIL_VIEWS } from '../views/hubs/hubPanels';
import { agentsConfig } from '../views/resourceConfigs';
import {
  WIZARD_STEPS,
  defaultSecretKind,
  deploymentPlan,
  devDeploymentBody,
  diffProblems,
  draftAgentNames,
  draftCounts,
  readWizardState,
  slug,
  testTarget,
  withCredential,
  wizardArchitectName,
  writeWizardState
} from '../utils/agentWizard';

const t = i18n.getFixedT('en');

const draft = {
  items: [
    { kind: 'Agent', name: 'researcher', operation: 'Upsert' },
    { kind: 'Agent', name: 'writer', operation: 'Upsert' },
    { kind: 'Agent', name: 'old-agent', operation: 'Delete' },
    { kind: 'Deployment', name: 'researcher-dev', operation: 'Upsert' },
    { kind: 'AgenticApp', name: 'research', operation: 'Upsert' }
  ]
};

describe('agent wizard helpers', () => {
  it('has six steps in order', () => {
    expect(WIZARD_STEPS).toEqual(['goal', 'access', 'design', 'review', 'approve', 'test']);
  });

  it('names one architect per harness profile', () => {
    expect(slug('builtin/Claude Code')).toBe('claude-code');
    expect(slug('')).toBe('default');
    expect(wizardArchitectName({ name: 'builtin/claude-code' })).toBe('architect-claude-code');
  });

  it('offers the best credential kind for a harness first', () => {
    expect(defaultSecretKind('ClaudeCode')).toBe('AnthropicApiKey');
    expect(defaultSecretKind('Codex')).toBe('OpenAiApiKey');
    expect(defaultSecretKind('Fake')).toBe('GenericEnv');
  });

  it('lists the agents the draft creates and counts its items, leaving out deletes', () => {
    expect(draftAgentNames(draft)).toEqual(['researcher', 'writer']);
    expect(draftCounts(draft)).toEqual({ Agent: 2, Deployment: 1, AgenticApp: 1 });
    expect(draftAgentNames(null)).toEqual([]);
  });

  it('tests the app entry agent when there is one, else the first agent', () => {
    const graph = { nodes: [{ kind: 'Agent', name: 'writer', entryOf: [] }, { kind: 'Agent', name: 'researcher', entryOf: ['research'] }] };
    expect(testTarget(draft, graph)).toEqual({ agent: 'researcher', app: 'research' });
    expect(testTarget({ items: [{ kind: 'Agent', name: 'solo' }] }, null)).toEqual({ agent: 'solo', app: null });
    expect(testTarget({ items: [] }, null)).toEqual({ agent: null, app: null });
  });

  it('plans a dev deployment per agent: create, bind the credential, or nothing to do', () => {
    const agents = [
      { id: 'agt_1', name: 'a' },
      { id: 'agt_2', name: 'b' },
      { id: 'agt_3', name: 'c' }
    ];
    const deployments = [
      { id: 'dep_2', agentId: 'agt_2', environment: 'dev', resourceBindings: [] },
      { id: 'dep_3', agentId: 'agt_3', environment: 'dev', resourceBindings: [{ kind: 'Secret', alias: 'credential', resourceId: 'sec_1' }] },
      { id: 'dep_9', agentId: 'agt_1', environment: 'prod', resourceBindings: [] }
    ];
    expect(deploymentPlan(agents, deployments, 'sec_1').map((p) => [p.agent.name, p.action, p.deployment?.id || null])).toEqual([
      ['a', 'create', null],
      ['b', 'bind', 'dep_2'],
      ['c', 'ready', 'dep_3']
    ]);
    expect(deploymentPlan([agents[1]], deployments, '')[0].action).toBe('ready');
  });

  it('builds a dev deployment body with the harness, model, and credential, avoiding taken names', () => {
    expect(devDeploymentBody({ id: 'agt_1', name: 'a' }, { harnessProfileId: 'hp_1', model: 'sonnet', credentialSecretId: 'sec_1' }, ['a-dev'])).toEqual({
      name: 'a-dev-2',
      agentId: 'agt_1',
      harnessProfileId: 'hp_1',
      environment: 'dev',
      active: true,
      model: 'sonnet',
      resourceBindings: [{ kind: 'Secret', alias: 'credential', resourceId: 'sec_1' }]
    });
    expect(devDeploymentBody({ id: 'agt_1', name: 'a' }, { harnessProfileId: 'hp_1' }).resourceBindings).toEqual([]);
  });

  it('replaces only the credential binding', () => {
    const deployment = { id: 'dep_1', resourceBindings: [{ kind: 'Secret', alias: 'credential', resourceId: 'sec_old' }, { kind: 'Secret', alias: 'github', resourceId: 'sec_gh' }] };
    expect(withCredential(deployment, 'sec_new').resourceBindings).toEqual([
      { kind: 'Secret', alias: 'github', resourceId: 'sec_gh' },
      { kind: 'Secret', alias: 'credential', resourceId: 'sec_new' }
    ]);
  });

  it('turns failed and stale diff items into lines for the architect', () => {
    const diff = { items: [{ kind: 'Deployment', name: 'x', change: 'Failed', message: 'Artifact globs require an artifact store.' }, { kind: 'Agent', name: 'y', change: 'Update', stale: true }, { kind: 'Agent', name: 'z', change: 'Create' }] };
    expect(diffProblems(diff)).toEqual(['Deployment/x: Artifact globs require an artifact store.', 'Agent/y: stale']);
    expect(diffProblems(null)).toEqual([]);
  });
});

describe('agent wizard state', () => {
  beforeEach(() => window.localStorage.clear());

  it('keeps choices per draft and merges updates', () => {
    expect(readWizardState('sdr_1')).toEqual({});
    writeWizardState('sdr_1', { goal: 'g', architectId: 'dep_a' });
    expect(writeWizardState('sdr_1', { validVersion: 3 })).toEqual({ goal: 'g', architectId: 'dep_a', validVersion: 3 });
    expect(readWizardState('sdr_2')).toEqual({});
  });
});

describe('agent wizard navigation', () => {
  it('is a hidden detail page under Agents, and the studio tab is hidden', () => {
    expect(findPage('agentWizard')).toMatchObject({ hub: 'agents', detail: true, hidden: true });
    expect(pathFor('agentWizard', 'new')).toBe('/dashboard/agent-wizard/new');
    expect(pathFor('agentWizard', 'sdr_1', { step: 'access' })).toBe('/dashboard/agent-wizard/sdr_1?step=access');
    expect(DETAIL_VIEWS.agentWizard).toBeTruthy();
    expect(findHub('agents').tabs.filter((p) => !p.hidden).map((p) => p.id)).not.toContain('studio');
  });

  it('puts an Agent wizard button on the Agents page', () => {
    const html = renderToStaticMarkup(<MemoryRouter>{agentsConfig.headerActions({ t, navigate: () => {} })}</MemoryRouter>);
    expect(html).toContain('data-testid="open-agent-wizard"');
    expect(html).toContain('Agent wizard');
  });
});
