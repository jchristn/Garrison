// Organization canvas sources (LP3.1, LEARNABILITY_PLAN.md section 6.4). OrgCanvas draws one organization and sends
// every change through a source, so the same canvas edits a studio draft and a published organization's working tree.
// Plain functions (no JSX, no React Flow) so Node-based tests can import them.
//
// A source is a plain object:
//
//   kind                    'draft' or 'workingTree'.
//   supports                { moveUnit, setLead, budgets, mandates, rules }: which optional parts the canvas shows.
//   organizations()         Organization names the source holds (a draft may hold several; a working tree one).
//   load(organization)      The organization as the canvas flow ({ organization, units, peers, roots, ... }, see
//                           orgToFlow). Synchronous: both sources read state their host already loaded.
//   choices(agents)         Agent names that can lead or join a unit.
//   addUnit, removeUnit, moveUnit, setLead, addMember, removeMember, connectUnits, disconnectUnits, setBudget,
//   attachMandate, detachMandate
//                           Each takes one object of fields (organization and unit names, agent names) and answers a
//                           promise of something truthy when the change was made, or null when it was refused. The
//                           source reports a refusal itself (the draft source through runOperation's error notice, the
//                           working tree source through its onError), so callers only branch on the result.
//   validate(organization)  A promise of { valid, problems: [{ code, unitId, unit, agentId, agent, mandateId, message }] }.
//
// A part a source does not support answers null without sending anything.

import { canvasOrganizations, orgToFlow, unitAgentChoices } from './orgCanvas';

/** Every method a source carries, in the order of section 6.4. */
export const ORG_SOURCE_METHODS = ['load', 'addUnit', 'removeUnit', 'moveUnit', 'setLead', 'addMember', 'removeMember', 'connectUnits', 'disconnectUnits', 'setBudget', 'attachMandate', 'detachMandate', 'validate'];

/** Problem codes the validate route answers with (LP3.7), each explained under components.orgDesigner.problems.<code>. */
export const ORG_PROBLEM_CODES = ['UnitWithoutLead', 'AgentInTwoUnits', 'PeerLineToMissingUnit', 'BudgetOverParent', 'KeeperDeploymentMissing', 'UnitDetachedFromRoot'];

const unsupported = () => Promise.resolve(null);

/**
 * The studio draft source (LP3.1): wraps the unit graph operations the studio canvas sent before the refactor
 * (AddUnit, RemoveUnit, AddUnitMember, RemoveUnitMember, ConnectUnits, DisconnectUnits) through runOperation, which
 * queues them, sends the newest draft version, and shows a refusal. A draft has no operation to move a unit, change a
 * lead, or set budgets and keepers, so those parts are off; they change in the Organization item's document.
 */
export function draftOrgSource({ graph, runOperation }) {
  return {
    kind: 'draft',
    supports: { moveUnit: false, setLead: false, budgets: false, mandates: false, rules: false },
    organizations: () => canvasOrganizations(graph),
    load: (organization) => orgToFlow(graph, organization),
    choices: (agents) => unitAgentChoices(agents, graph),
    addUnit: ({ organization, unit, parent, agent, role }) =>
      runOperation('AddUnit', {
        organization,
        unit,
        parent: parent || undefined,
        agent: agent || undefined,
        role: role || undefined
      }),
    removeUnit: ({ organization, unit }) => runOperation('RemoveUnit', { organization, unit }),
    moveUnit: unsupported,
    setLead: unsupported,
    addMember: ({ organization, unit, agent, role }) =>
      runOperation('AddUnitMember', {
        organization,
        unit,
        agent,
        role: role || undefined
      }),
    removeMember: ({ organization, unit, agent }) =>
      runOperation('RemoveUnitMember', {
        organization,
        unit,
        agent
      }),
    connectUnits: ({ organization, from, to }) => runOperation('ConnectUnits', { organization, from, to }),
    disconnectUnits: ({ organization, from, to }) =>
      runOperation('DisconnectUnits', {
        organization,
        from,
        to
      }),
    setBudget: unsupported,
    attachMandate: unsupported,
    detachMandate: unsupported,
    validate: (organization) => Promise.resolve(draftOrgProblems(graph, organization))
  };
}

/**
 * The live checks for a draft organization (LP3.7). The studio has no per-organization validation: its Validate
 * button is a whole-draft manifest dry run, too heavy to send after every change and without these codes. So the
 * dashboard computes the checks the draft graph can answer on the client: a unit without a lead, an agent in two
 * units, a peer line to a unit that is not there, and a unit whose parent is missing or that is a second root. The
 * graph carries no budgets or keepers, so BudgetOverParent and KeeperDeploymentMissing are left to the manifest dry
 * run when the draft is applied.
 */
export function draftOrgProblems(graph, organization) {
  const problems = [];
  if (!organization) return { valid: true, problems };
  const nodes = graph?.nodes || [];
  const prefix = `${organization}/`;
  const raw = nodes.filter((n) => n.kind === 'OrgUnit' && n.organization === organization);
  const nameOf = (n) => (n.name.startsWith(prefix) ? n.name.slice(prefix.length) : n.name);
  const names = new Set(raw.map(nameOf));
  let roots = 0;
  for (const n of raw) {
    const unit = nameOf(n);
    if (!n.lead) problems.push(problem('UnitWithoutLead', { unit }));
    if (n.parentUnit && !names.has(n.parentUnit)) problems.push(problem('UnitDetachedFromRoot', { unit }));
    else if (!n.parentUnit) {
      roots += 1;
      if (roots > 1) problems.push(problem('UnitDetachedFromRoot', { unit }));
    }
  }
  for (const a of nodes.filter((n) => n.kind === 'Agent' && !n.deleted)) {
    const positions = (a.unitOf || []).filter((p) => p.startsWith(prefix));
    if (positions.length > 1) problems.push(problem('AgentInTwoUnits', { unit: positions[1].slice(prefix.length), agent: a.name }));
  }
  for (const e of graph?.edges || []) {
    if (e.kind !== 'Peer' || e.organization !== organization) continue;
    if (!names.has(e.from) || !names.has(e.to)) problems.push(problem('PeerLineToMissingUnit', { unit: names.has(e.from) ? e.from : e.to }));
  }
  return { valid: problems.length === 0, problems };
}

/** One problem in the shape of the validate route, with the unit and agent names the canvas links to. */
export function problem(code, { unitId = null, unit = '', agentId = null, agent = '', mandateId = null, mandate = '', message = '' } = {}) {
  return { code, unitId, unit, agentId, agent, mandateId, mandate, message };
}
