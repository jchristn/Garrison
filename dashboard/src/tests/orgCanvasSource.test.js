// Organization canvas sources (LP3.1, LP3.7): the draft source sends the same studio unit graph operations the canvas
// sent before the refactor, leaves out what a draft cannot do, and checks a draft organization on the client.
import { describe, it, expect, vi } from 'vitest';
import { ORG_SOURCE_METHODS, ORG_PROBLEM_CODES, draftOrgProblems, draftOrgSource } from '../utils/orgCanvasSource';
import { orgToFlow } from '../utils/orgCanvas';
import { graphOf, orgCanvasState } from '../../tests/e2e/canvasMocks.js';

const graph = () => graphOf(orgCanvasState());

describe('draft organization source', () => {
  it('carries every method of the interface', () => {
    const source = draftOrgSource({ graph: graph(), runOperation: vi.fn() });
    for (const m of ORG_SOURCE_METHODS) expect(typeof source[m], m).toBe('function');
    expect(source.kind).toBe('draft');
    expect(source.organizations()).toEqual(['research-org']);
    expect(source.load('research-org')).toEqual(orgToFlow(graph(), 'research-org'));
    expect(source.choices([{ name: 'zed' }])).toContain('zed');
  });

  it('sends the unit graph operations with the fields the canvas sent before', async () => {
    const runOperation = vi.fn(() => Promise.resolve({ version: 2 }));
    const source = draftOrgSource({ graph: graph(), runOperation });
    const organization = 'research-org';
    await source.addUnit({ organization, unit: 'Archive', parent: '', agent: '', role: '' });
    await source.addUnit({ organization, unit: 'Archive', parent: 'Research', agent: 'zed', role: 'Clerk' });
    await source.removeUnit({ organization, unit: 'Archive' });
    await source.addMember({ organization, unit: 'Research', agent: 'zed', role: '' });
    await source.removeMember({ organization, unit: 'Research', agent: 'zed' });
    await source.connectUnits({ organization, from: 'Research', to: 'Publishing' });
    await source.disconnectUnits({ organization, from: 'Research', to: 'Publishing' });
    expect(runOperation.mock.calls).toEqual([
      ['AddUnit', { organization, unit: 'Archive', parent: undefined, agent: undefined, role: undefined }],
      ['AddUnit', { organization, unit: 'Archive', parent: 'Research', agent: 'zed', role: 'Clerk' }],
      ['RemoveUnit', { organization, unit: 'Archive' }],
      ['AddUnitMember', { organization, unit: 'Research', agent: 'zed', role: undefined }],
      ['RemoveUnitMember', { organization, unit: 'Research', agent: 'zed' }],
      ['ConnectUnits', { organization, from: 'Research', to: 'Publishing' }],
      ['DisconnectUnits', { organization, from: 'Research', to: 'Publishing' }]
    ]);
  });

  it('answers null for what a draft cannot do, without sending anything', async () => {
    const runOperation = vi.fn();
    const source = draftOrgSource({ graph: graph(), runOperation });
    for (const m of ['moveUnit', 'setLead', 'setBudget', 'attachMandate', 'detachMandate']) expect(await source[m]({ organization: 'research-org', unit: 'Research' }), m).toBeNull();
    expect(runOperation).not.toHaveBeenCalled();
    expect(Object.values(source.supports).every((v) => v === false)).toBe(true);
  });
});

describe('draft organization checks', () => {
  it('passes the sample organization', async () => {
    expect(await draftOrgSource({ graph: graph(), runOperation: vi.fn() }).validate('research-org')).toEqual({ valid: true, problems: [] });
    expect(draftOrgProblems(graph(), '')).toEqual({ valid: true, problems: [] });
  });

  it('finds a unit without a lead, an agent in two units, a missing peer, and a detached unit', () => {
    const g = graph();
    const research = g.nodes.find((n) => n.key === 'OrgUnit/research-org/Research');
    research.lead = null;
    g.nodes.find((n) => n.kind === 'Agent' && n.name === 'writer').unitOf.push('research-org/Publishing');
    g.edges.push({ kind: 'Peer', organization: 'research-org', from: 'Research', to: 'Gone' });
    g.nodes.push({ key: 'OrgUnit/research-org/Orphan', kind: 'OrgUnit', name: 'research-org/Orphan', organization: 'research-org', parentUnit: 'Missing', lead: 'zed' });
    g.nodes.push({ key: 'OrgUnit/research-org/Second', kind: 'OrgUnit', name: 'research-org/Second', organization: 'research-org', parentUnit: null, lead: 'zed2' });
    const { valid, problems } = draftOrgProblems(g, 'research-org');
    expect(valid).toBe(false);
    expect(problems.map((p) => `${p.code}:${p.unit}:${p.agent}`)).toEqual(['UnitWithoutLead:Research:', 'UnitDetachedFromRoot:Orphan:', 'UnitDetachedFromRoot:Second:', 'AgentInTwoUnits:Publishing:writer', 'PeerLineToMissingUnit:Research:']);
    for (const p of problems) expect(ORG_PROBLEM_CODES).toContain(p.code);
  });
});
