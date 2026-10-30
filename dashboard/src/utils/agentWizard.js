// The agent wizard (Agents > Agents > Agent wizard): a guided path from a description of what the agents should do to
// approved, published agents with working dev deployments. Plain functions (no JSX) so tests can import them.

import { CREDENTIAL_KINDS } from './architect';

/** The wizard's steps, in order. */
export const WIZARD_STEPS = ['goal', 'access', 'design', 'review', 'approve', 'test'];

/** localStorage key of one draft's wizard choices (harness profile, credential, model, architect, goal). */
export function wizardStateKey(draftId) {
  return `garrison.agentWizard.${draftId}`;
}

/** Read one draft's wizard choices; {} when there are none or storage is unavailable. */
export function readWizardState(draftId) {
  try {
    const raw = window.localStorage.getItem(wizardStateKey(draftId));
    return raw ? JSON.parse(raw) || {} : {};
  } catch {
    return {};
  }
}

/** Merge choices into one draft's wizard state and return the result. */
export function writeWizardState(draftId, patch) {
  const next = { ...readWizardState(draftId), ...patch };
  try {
    window.localStorage.setItem(wizardStateKey(draftId), JSON.stringify(next));
  } catch {
    /* storage unavailable: the wizard still works for this page */
  }
  return next;
}

/** A lower-case slug of a name for record names: letters, digits, and dashes. */
export function slug(name) {
  return (
    String(name || '')
      .toLowerCase()
      .replace(/^builtin\//, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'default'
  );
}

/** The architect the wizard uses for a harness profile: one per profile, reused across wizards. */
export function wizardArchitectName(profile) {
  return `architect-${slug(profile?.name)}`;
}

/** The secret kind the wizard offers first when creating a credential for a harness type. */
export function defaultSecretKind(harnessType) {
  return (CREDENTIAL_KINDS[harnessType] || [])[0] || 'GenericEnv';
}

/** Agent names the draft creates or changes (Upsert items of kind Agent). */
export function draftAgentNames(draft) {
  return (draft?.items || []).filter((i) => i.kind === 'Agent' && i.operation !== 'Delete').map((i) => i.name);
}

/** What the draft holds, counted by kind: { Agent: 2, Deployment: 2, AgenticApp: 1, ... }. */
export function draftCounts(draft) {
  const counts = {};
  for (const i of draft?.items || []) {
    if (i.operation === 'Delete') continue;
    counts[i.kind] = (counts[i.kind] || 0) + 1;
  }
  return counts;
}

/**
 * The agent to talk to in the test step: the entry agent of the draft's app when the graph has one, else the first
 * agent the draft creates. Returns { agent, app } (names; app null without one).
 */
export function testTarget(draft, graph) {
  const nodes = graph?.nodes || [];
  const entry = nodes.find((n) => n.kind === 'Agent' && (n.entryOf || []).length > 0);
  if (entry) return { agent: entry.name, app: entry.entryOf[0] };
  const agents = draftAgentNames(draft);
  return { agent: agents[0] || null, app: null };
}

/**
 * What the approve step has to do for each agent so it is ready to run in dev: create a dev deployment on the
 * chosen harness profile with the credential bound, or bind the credential to a dev deployment that lacks one.
 * `agents` are the applied agents ({ id, name }); `deployments` the tenant's deployments. Returns
 * [{ agent, action: 'create' | 'bind' | 'ready', deployment }].
 */
export function deploymentPlan(agents, deployments, credentialSecretId) {
  return (agents || []).map((agent) => {
    const dev = (deployments || []).filter((d) => d.agentId === agent.id && (d.environment || 'dev') === 'dev');
    if (!dev.length) return { agent, action: 'create', deployment: null };
    const bound = dev.find((d) => !credentialSecretId || (d.resourceBindings || []).some((b) => b.kind === 'Secret' && b.resourceId === credentialSecretId));
    if (bound) return { agent, action: 'ready', deployment: bound };
    return { agent, action: 'bind', deployment: dev[0] };
  });
}

/** Body for a new dev deployment of an agent on the chosen harness, model, and credential. */
export function devDeploymentBody(agent, { harnessProfileId, model, credentialSecretId }, takenNames = []) {
  let name = `${agent.name}-dev`;
  for (let n = 2; takenNames.includes(name); n++) name = `${agent.name}-dev-${n}`;
  const body = { name, agentId: agent.id, harnessProfileId, environment: 'dev', active: true, resourceBindings: [] };
  if (model) body.model = model;
  if (credentialSecretId) body.resourceBindings.push({ kind: 'Secret', alias: 'credential', resourceId: credentialSecretId });
  return body;
}

/** The deployment with the credential bound under the alias "credential" (replacing an earlier credential binding). */
export function withCredential(deployment, credentialSecretId) {
  const bindings = (deployment.resourceBindings || []).filter((b) => !(b.kind === 'Secret' && b.alias === 'credential'));
  bindings.push({ kind: 'Secret', alias: 'credential', resourceId: credentialSecretId });
  return { ...deployment, resourceBindings: bindings };
}

/** The draft's failing and stale items from a diff, as lines for the architect to fix. */
export function diffProblems(diff) {
  return (diff?.items || []).filter((i) => i.change === 'Failed' || i.stale).map((i) => `${i.kind}/${i.name}: ${i.message || (i.stale ? 'stale' : 'failed')}`);
}
