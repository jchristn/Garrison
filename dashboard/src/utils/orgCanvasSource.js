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
//   validate(organization)  A promise of { valid, problems: [{ code, severity, unitId, unit, agentId, agent, mandateId,
//                           message }] }. severity is Error or Warning; valid is true when no problem is an Error, so a
//                           tree with only warnings still publishes.
//
// A part a source does not support answers null without sending anything.

import { canvasOrganizations, orgToFlow, peerId, unitAgentChoices } from './orgCanvas';
import { blankUnit, treeOrder, unitFormToBody, unitToForm } from './organizations';
import { isMissingEndpoint } from './errors';

/** Every method a source carries, in the order of section 6.4. */
export const ORG_SOURCE_METHODS = ['load', 'addUnit', 'removeUnit', 'moveUnit', 'setLead', 'addMember', 'removeMember', 'connectUnits', 'disconnectUnits', 'setBudget', 'attachMandate', 'detachMandate', 'validate'];

/** Codes the validate route answers with severity Error (LP3.7); an Error stops a publish. */
export const ORG_ERROR_CODES = ['AgentInTwoUnits', 'PeerLineToMissingUnit', 'BudgetOverParent', 'UnitDetachedFromRoot', 'OneRoot', 'Cycle', 'UnitNameTaken', 'TooManyUnits', 'TooManyMembers', 'TooManyPeerLines', 'BudgetPeriodTaken', 'BudgetInvalid', 'AgentInactive'];

/** Codes the validate route answers with severity Warning; a tree with only warnings still publishes. */
export const ORG_WARNING_CODES = ['UnitWithoutLead', 'KeeperDeploymentMissing', 'MandateMismatch'];

/** Every problem code, each explained under components.orgDesigner.problems.<code>. */
export const ORG_PROBLEM_CODES = [...ORG_ERROR_CODES, ...ORG_WARNING_CODES];

/** The severity of a code when the answer leaves it out: Warning for the warning codes, else Error. */
export function severityOf(code) {
  return ORG_WARNING_CODES.includes(code) ? 'Warning' : 'Error';
}

/** Whether a list of problems lets the tree publish: no problem is an Error. */
export function publishable(problems) {
  return !(problems || []).some((p) => p.severity === 'Error');
}

/** How many changes Undo can step back through (LP3.10); older ones drop off. */
export const ORG_HISTORY_LIMIT = 50;

/** The drag data type of an agent dragged from the people palette onto a unit (LP3.3). */
export const AGENT_DRAG_TYPE = 'application/x-garrison-agent';

/** The agent name a drop carries, or '' when the drag did not come from the people palette. */
export function draggedAgent(dataTransfer) {
  try {
    return String(dataTransfer?.getData(AGENT_DRAG_TYPE) || '').trim();
  } catch {
    return '';
  }
}

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
  return { valid: publishable(problems), problems };
}

/** One problem in the shape of the validate route, with the unit and agent names the canvas links to. */
export function problem(code, { severity = null, unitId = null, unit = '', agentId = null, agent = '', mandateId = null, mandate = '', message = '' } = {}) {
  return { code, severity: severity === 'Error' || severity === 'Warning' ? severity : severityOf(code), unitId, unit, agentId, agent, mandateId, mandate, message };
}

// ------------------------------------------------------------------------------------------------ working tree

const lower = (v) => String(v || '').toLowerCase();

/** Agent lookups for the working tree: by ID and by name (case-insensitive), from the tenant's agents. */
function agentIndex(agents) {
  const byId = new Map();
  const byName = new Map();
  for (const a of agents || []) {
    if (!a?.id) continue;
    byId.set(a.id, a);
    if (a.name) byName.set(lower(a.name), a);
  }
  return { byId, byName };
}

/**
 * A published organization's working tree as the canvas flow (LP3.2), in the shape orgToFlow gives a draft: units by
 * name in tree order with parent, lead, member names, depth, and children, and unique peer lines. Each unit also
 * carries what the working tree adds: its record ID (unitId), the lead's title, its budgets, and its people (lead
 * first) with agent ID, title, and attached mandate. Agents show by name, which the unit routes accept.
 */
export function workingTreeFlow(organization, agents = []) {
  const units = organization?.units || [];
  const name = organization?.name || '';
  const { byId } = agentIndex(agents);
  const agentName = (id, fallback) => byId.get(id)?.name || fallback || id || '';
  const nameOf = new Map(units.map((u) => [u.id, u.name]));
  const shaped = treeOrder(units).map(({ unit: u, depth }) => {
    const lead = u.leadAgentId ? agentName(u.leadAgentId, u.leadAgentName) : '';
    const people = [];
    if (lead) people.push({ name: lead, agentId: u.leadAgentId, title: u.leadTitle || '', mandateId: u.leadMandateId || null, lead: true });
    for (const m of u.members || []) people.push({ name: agentName(m.agentId, m.agentName), agentId: m.agentId, title: m.title || '', mandateId: m.mandateId || null, lead: false });
    return {
      id: u.name,
      key: `OrgUnit/${name}/${u.name}`,
      name: u.name,
      unitId: u.id,
      parent: u.parentUnitId && nameOf.has(u.parentUnitId) ? nameOf.get(u.parentUnitId) : null,
      lead,
      leadTitle: u.leadTitle || '',
      members: people
        .filter((p) => !p.lead)
        .map((p) => p.name)
        .sort(),
      people,
      budgets: (u.budgets || []).map((b) => ({ period: b.period, amountUsd: b.amountUsd })),
      inDraft: false,
      children: [],
      depth
    };
  });
  const byName = new Map(shaped.map((u) => [u.name, u]));
  for (const u of shaped) if (u.parent && byName.has(u.parent)) byName.get(u.parent).children.push(u.name);
  const peers = [];
  for (const u of units) {
    for (const line of u.peerLines || []) {
      const other = nameOf.get(line.peerUnitId);
      if (!other || other === u.name) continue;
      if (peers.some((p) => (p.from === u.name && p.to === other) || (p.from === other && p.to === u.name))) continue;
      peers.push({ id: peerId(u.name, other), from: u.name, to: other });
    }
  }
  return {
    organization: name,
    inDraft: false,
    deleted: false,
    units: shaped,
    peers,
    roots: shaped.filter((u) => !u.parent).map((u) => u.name)
  };
}

/**
 * The working tree source (LP3.2): wraps the organization unit routes Organization detail uses. Every change reads the
 * unit fresh, changes the one field, and replaces the unit (PUT), so a change made elsewhere since the page loaded is
 * kept. `enqueue(task)` runs changes one at a time in the order made (the host keeps the queue across reloads).
 * After a change `onChanged()` reloads the organization; a refusal goes to `onError(error, operation)` (a tree rule
 * refusal is a 409 with its code, such as BudgetExceedsParent) and the method answers null. `mandates` and
 * `deployments` feed the client checks used when the server has no validate route.
 */
export function workingTreeOrgSource({ apiClient, tenantId, organization, agents = [], mandates = [], deployments = [], enqueue = (task) => task(), onChanged, onError }) {
  const org = organization || { id: '', name: '', units: [] };
  const units = org.units || [];
  const flow = workingTreeFlow(org, agents);
  const { byId, byName: agentsByName } = agentIndex(agents);
  const unitByName = new Map(units.map((u) => [lower(u.name), u]));
  const unitOf = (name) => unitByName.get(lower(name)) || null;
  const idOfUnit = (name) => unitOf(name)?.id || null;
  // An agent name becomes its ID when the tenant has it; otherwise the route resolves the name itself.
  const agentRef = (agent) => (agent ? agentsByName.get(lower(agent))?.id || agent : null);
  const isAgent = (id, agent) => !!id && (id === agent || id === agentRef(agent) || lower(byId.get(id)?.name) === lower(agent));

  const run = (operation, work) =>
    enqueue(async () => {
      try {
        const result = await work();
        if (onChanged) await onChanged();
        return result || true;
      } catch (e) {
        onError?.(e, operation);
        return null;
      }
    });

  const fresh = async (name) => {
    const known = unitOf(name);
    if (!known) {
      const err = new Error(`Unit ${name} is not in organization ${org.name}.`);
      err.code = 'UnitNotFound';
      throw err;
    }
    try {
      return (await apiClient.getOrgUnit(tenantId, org.id, known.id)) || known;
    } catch {
      return known;
    }
  };

  const put = (operation, name, change) =>
    run(operation, async () => {
      const unit = await fresh(name);
      const form = unitToForm(unit);
      change(form, unit);
      return apiClient.updateOrgUnit(tenantId, org.id, unit.id, unitFormToBody(form));
    });

  return {
    kind: 'workingTree',
    supports: { moveUnit: true, setLead: true, budgets: true, mandates: true, rules: true },
    organizationId: org.id,
    organizations: () => (org.name ? [org.name] : []),
    load: () => flow,
    choices: () =>
      [...new Set((agents || []).filter((a) => a?.name && a.name !== 'agent-architect' && a.kind !== 'Remote').map((a) => a.name))].sort(),
    unitId: idOfUnit,
    addUnit: ({ unit, parent, agent, role }) =>
      run('AddUnit', () =>
        apiClient.createOrgUnit(
          tenantId,
          org.id,
          unitFormToBody({ ...blankUnit(idOfUnit(parent)), name: unit, leadAgentId: agentRef(agent), leadTitle: role || '' })
        )
      ),
    removeUnit: ({ unit }) => run('RemoveUnit', () => apiClient.deleteOrgUnit(tenantId, org.id, idOfUnit(unit) || unit)),
    moveUnit: ({ unit, parent }) =>
      put('MoveUnit', unit, (form) => {
        form.parentUnitId = parent ? idOfUnit(parent) || parent : null;
      }),
    setLead: ({ unit, agent, role }) =>
      put('SetLead', unit, (form) => {
        const next = agentRef(agent);
        if (next !== form.leadAgentId) form.leadMandateId = null;
        form.leadAgentId = next;
        form.leadTitle = next ? role ?? form.leadTitle ?? '' : '';
        // A member who becomes the lead leaves the member list: an agent holds one position.
        form.members = (form.members || []).filter((m) => !isAgent(m.agentId, agent));
      }),
    addMember: ({ unit, agent, role }) =>
      put('AddUnitMember', unit, (form) => {
        form.members = [...(form.members || []), { agentId: agentRef(agent), title: role || '', mandateId: '' }];
      }),
    removeMember: ({ unit, agent }) =>
      put('RemoveUnitMember', unit, (form) => {
        form.members = (form.members || []).filter((m) => !isAgent(m.agentId, agent));
      }),
    connectUnits: ({ from, to }) =>
      put('ConnectUnits', from, (form) => {
        const id = idOfUnit(to) || to;
        if (!form.peerUnitIds.includes(id)) form.peerUnitIds = [...form.peerUnitIds, id];
      }),
    // A peer line may be stored on either unit (or both), so it is removed from each side that holds it.
    disconnectUnits: ({ from, to }) =>
      run('DisconnectUnits', async () => {
        let last = null;
        for (const [a, b] of [
          [from, to],
          [to, from]
        ]) {
          const unit = await fresh(a);
          const other = idOfUnit(b);
          if (!(unit.peerLines || []).some((l) => l.peerUnitId === other)) continue;
          const form = unitToForm(unit);
          form.peerUnitIds = form.peerUnitIds.filter((id) => id !== other);
          last = await apiClient.updateOrgUnit(tenantId, org.id, unit.id, unitFormToBody(form));
        }
        return last || true;
      }),
    setBudget: ({ unit, period, amountUsd }) =>
      put('SetBudget', unit, (form) => {
        const value = amountUsd == null || amountUsd === '' ? null : Number(amountUsd);
        if (period === 'Day') form.budgetDay = value;
        else form.budgetMonth = value;
      }),
    attachMandate: ({ unit, agent, mandateId }) =>
      put('AttachMandate', unit, (form) => {
        if (isAgent(form.leadAgentId, agent)) form.leadMandateId = mandateId || null;
        else form.members = (form.members || []).map((m) => (isAgent(m.agentId, agent) ? { ...m, mandateId: mandateId || '' } : m));
      }),
    detachMandate: ({ unit, agent }) =>
      put('DetachMandate', unit, (form) => {
        if (isAgent(form.leadAgentId, agent)) form.leadMandateId = null;
        else form.members = (form.members || []).map((m) => (isAgent(m.agentId, agent) ? { ...m, mandateId: '' } : m));
      }),
    // The server's publish checks through the dry-run route (LP3.7a). Before that route exists (404 or 405) the same
    // checks run on the client over the working tree; any other failure answers valid null with the error.
    validate: async () => {
      if (!org.id) return { valid: true, problems: [] };
      try {
        const result = await apiClient.validateOrganization(tenantId, org.id);
        return normalizeProblems(result, units, agents, mandates);
      } catch (e) {
        if (isMissingEndpoint(e)) return workingTreeProblems(units, { agents, mandates, deployments });
        return { valid: null, problems: [], error: e };
      }
    }
  };
}

/** The validate route's answer with unit, agent, and mandate names filled in from the working tree. */
export function normalizeProblems(result, units = [], agents = [], mandates = []) {
  const unitName = new Map((units || []).map((u) => [u.id, u.name]));
  const { byId } = agentIndex(agents);
  const mandateName = new Map((mandates || []).map((m) => [m.id, m.name]));
  const problems = (Array.isArray(result?.problems) ? result.problems : []).map((p) =>
    problem(p?.code || '', {
      severity: p?.severity,
      unitId: p?.unitId || null,
      unit: unitName.get(p?.unitId) || '',
      agentId: p?.agentId || null,
      agent: byId.get(p?.agentId)?.name || '',
      mandateId: p?.mandateId || null,
      mandate: mandateName.get(p?.mandateId) || '',
      message: typeof p?.message === 'string' ? p.message : ''
    })
  );
  return { valid: typeof result?.valid === 'boolean' ? result.valid : publishable(problems), problems };
}

/**
 * The publish checks of LP3.7 computed over a working tree, for a server without the validate route (the main ones;
 * the tree rules the unit routes already refuse at write time, such as Cycle or TooManyUnits, are left to the
 * server): a unit without a lead (Warning), an agent in two units, a peer line to a missing unit, a budget over the nearest ancestor's budget of the same
 * period, a keeper (an attached mandate) whose deployment is missing or inactive (Warning), and a unit with no path to
 * the root.
 */
export function workingTreeProblems(units = [], { agents = [], mandates = null, deployments = null } = {}) {
  const list = Array.isArray(units) ? units : [];
  const byId = new Map(list.map((u) => [u.id, u]));
  const { byId: agentsById } = agentIndex(agents);
  const agentName = (id, fallback) => agentsById.get(id)?.name || fallback || '';
  const problems = [];
  const add = (code, unit, extra = {}) => problems.push(problem(code, { unitId: unit.id, unit: unit.name, ...extra }));
  const roots = list.filter((u) => !u.parentUnitId);
  for (const u of list) {
    if (!u.leadAgentId) add('UnitWithoutLead', u);
    // No path to the root: a missing parent, a second root, or a loop above the unit.
    let detached = false;
    if (u.parentUnitId && !byId.has(u.parentUnitId)) detached = true;
    if (!u.parentUnitId && roots.length > 1 && roots[0] !== u) detached = true;
    const seen = new Set([u.id]);
    for (let at = u; at?.parentUnitId && byId.has(at.parentUnitId); at = byId.get(at.parentUnitId)) {
      if (seen.has(at.parentUnitId)) {
        detached = true;
        break;
      }
      seen.add(at.parentUnitId);
    }
    if (detached) add('UnitDetachedFromRoot', u);
  }
  const positions = new Map();
  for (const u of list) {
    const people = [...(u.leadAgentId ? [{ agentId: u.leadAgentId, agentName: u.leadAgentName }] : []), ...(u.members || [])];
    for (const p of people) {
      if (!p?.agentId) continue;
      if (positions.has(p.agentId) && positions.get(p.agentId) !== u.id) add('AgentInTwoUnits', u, { agentId: p.agentId, agent: agentName(p.agentId, p.agentName) });
      else positions.set(p.agentId, u.id);
    }
  }
  for (const u of list) for (const line of u.peerLines || []) if (!byId.has(line.peerUnitId) || line.peerUnitId === u.id) add('PeerLineToMissingUnit', u);
  for (const u of list) {
    for (const b of u.budgets || []) {
      const cap = budgetCap(list, u.id, b.period);
      if (cap && Number(b.amountUsd) > Number(cap.amountUsd)) add('BudgetOverParent', u);
    }
  }
  if (Array.isArray(mandates) && Array.isArray(deployments)) {
    const mandateById = new Map(mandates.map((m) => [m.id, m]));
    const live = new Set(deployments.filter((d) => d.active !== false).map((d) => d.id));
    for (const u of list) {
      const attached = [...(u.leadMandateId ? [{ agentId: u.leadAgentId, mandateId: u.leadMandateId }] : []), ...(u.members || []).filter((m) => m.mandateId)];
      for (const a of attached) {
        const m = mandateById.get(a.mandateId);
        if (m && (!m.deploymentId || !live.has(m.deploymentId))) add('KeeperDeploymentMissing', u, { agentId: a.agentId, agent: agentName(a.agentId), mandateId: m.id, mandate: m.name || '' });
      }
    }
  }
  return { valid: publishable(problems), problems };
}

/**
 * The most a unit's budget may be for a period (LP3.5): the budget of the nearest unit above it that has one for that
 * period, as { unitId, unitName, amountUsd }, or null when nothing above it sets one.
 */
export function budgetCap(units, unitId, period) {
  const byId = new Map((units || []).map((u) => [u.id, u]));
  const seen = new Set([unitId]);
  for (let at = byId.get(unitId); at?.parentUnitId && byId.has(at.parentUnitId) && !seen.has(at.parentUnitId); ) {
    seen.add(at.parentUnitId);
    at = byId.get(at.parentUnitId);
    const b = (at.budgets || []).find((x) => x.period === period);
    if (b && b.amountUsd != null) return { unitId: at.id, unitName: at.name, amountUsd: Number(b.amountUsd) };
  }
  return null;
}

/**
 * The change rules that apply to a unit (LP3.6): a rule covers its unit's subtree, so these are the rules set on the
 * unit or on any unit above it, in the order given.
 */
export function rulesForUnit(rules, units, unitId) {
  const byId = new Map((units || []).map((u) => [u.id, u]));
  const chain = new Set();
  for (let at = byId.get(unitId); at && !chain.has(at.id); at = at.parentUnitId ? byId.get(at.parentUnitId) : null) chain.add(at.id);
  return (rules || []).filter((r) => chain.has(r.unitId));
}

/** A problem in words, with its unit, agent, and keeper named; an unknown code shows the server's message. */
export function problemText(t, p) {
  if (ORG_PROBLEM_CODES.includes(p?.code)) {
    return t(`components.orgDesigner.problems.${p.code}`, { unit: p.unit || p.unitId || '-', agent: p.agent || p.agentId || '-', mandate: p.mandate || p.mandateId || '-' });
  }
  return p?.message || p?.code || '';
}

// ------------------------------------------------------------------------------------------------ undo

/**
 * The steps that undo one change (LP3.10), each [method, fields], worked out from the flow before the change. Removing
 * a unit is undone by adding it again with its lead, then its members, peer lines, budgets, and keepers. Answers [] for
 * a change that cannot be undone.
 */
export function inverseSteps(method, args, flow) {
  const organization = args?.organization;
  const unitOf = (name) => (flow?.units || []).find((u) => u.name === name) || null;
  const before = unitOf(args?.unit);
  const person = (unit, agent) => (unit?.people || []).find((p) => p.name === agent) || null;
  switch (method) {
    case 'addUnit':
      return [['removeUnit', { organization, unit: args.unit }]];
    case 'removeUnit': {
      if (!before) return [];
      const steps = [['addUnit', { organization, unit: before.name, parent: before.parent || '', agent: before.lead || '', role: before.leadTitle || '' }]];
      for (const m of before.members || []) steps.push(['addMember', { organization, unit: before.name, agent: m, role: person(before, m)?.title || '' }]);
      for (const p of flow?.peers || []) {
        if (p.from === before.name || p.to === before.name) steps.push(['connectUnits', { organization, from: p.from, to: p.to }]);
      }
      for (const b of before.budgets || []) steps.push(['setBudget', { organization, unit: before.name, period: b.period, amountUsd: b.amountUsd }]);
      for (const p of before.people || []) if (p.mandateId) steps.push(['attachMandate', { organization, unit: before.name, agent: p.name, mandateId: p.mandateId }]);
      return steps;
    }
    case 'addMember':
      return [['removeMember', { organization, unit: args.unit, agent: args.agent }]];
    case 'removeMember':
      return [['addMember', { organization, unit: args.unit, agent: args.agent, role: person(before, args.agent)?.title || '' }]];
    case 'connectUnits':
      return [['disconnectUnits', { organization, from: args.from, to: args.to }]];
    case 'disconnectUnits':
      return [['connectUnits', { organization, from: args.from, to: args.to }]];
    case 'setLead': {
      if (!before) return [];
      const steps = [['setLead', { organization, unit: args.unit, agent: before.lead || '', role: before.leadTitle || '' }]];
      // A member who became the lead goes back to the member list.
      if (args.agent && (before.members || []).includes(args.agent)) steps.push(['addMember', { organization, unit: args.unit, agent: args.agent, role: person(before, args.agent)?.title || '' }]);
      return steps;
    }
    case 'moveUnit':
      return before ? [['moveUnit', { organization, unit: args.unit, parent: before.parent || '' }]] : [];
    case 'setBudget': {
      if (!before) return [];
      const old = (before.budgets || []).find((b) => b.period === args.period);
      return [['setBudget', { organization, unit: args.unit, period: args.period, amountUsd: old ? old.amountUsd : null }]];
    }
    case 'attachMandate':
    case 'detachMandate': {
      const old = person(before, args.agent)?.mandateId || null;
      return [old ? ['attachMandate', { organization, unit: args.unit, agent: args.agent, mandateId: old }] : ['detachMandate', { organization, unit: args.unit, agent: args.agent }]];
    }
    default:
      return [];
  }
}
