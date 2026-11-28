// The Learn page's sections in learning order (LP4.3), the tour each one offers, and which Explainer topics link to
// which section. Plain data so tests and the export script can import it.

/** Tour ids the tour engine (LP4.5) will define. Labels live in learn.tours.<camelCase id>. */
export const TOUR_IDS = ['first-look', 'run-an-agent', 'follow-a-request', 'build-a-team', 'keep-it-safe', 'agents-on-their-own', 'watch-an-organization'];

/** The catalog key of a tour's name. */
export function tourKey(tourId) {
  return `learn.tours.${String(tourId).replace(/-([a-z])/g, (_, c) => c.toUpperCase())}`;
}

/** Sections in the order a newcomer should read them. `diagram` is an id in diagrams.js. */
export const LEARN_SECTIONS = [
  { id: 'runtime', diagram: 'runtime', tour: 'run-an-agent' },
  { id: 'request', diagram: 'request', tour: 'follow-a-request' },
  { id: 'autonomy', diagram: 'autonomy', tour: 'agents-on-their-own' },
  { id: 'teams', diagram: 'teams', tour: 'build-a-team' },
  // The organization diagram starts at the board, so it offers Watch an organization; every tour is on this page once.
  { id: 'organization', diagram: 'organization', tour: 'watch-an-organization' },
  { id: 'selfRevision', diagram: 'selfRevision', tour: 'keep-it-safe' },
  { id: 'brakes', diagram: 'brakes', tour: 'keep-it-safe' }
];

/** Glossary terms in the order they appear on the page; text in learn.glossary.<id>.term and .def. */
export const GLOSSARY = [
  'tenant', 'agent', 'deployment', 'harnessProfile', 'nodePool', 'node', 'run', 'runToken',
  'keeper', 'tick', 'message', 'line', 'loopGuards', 'report', 'memory', 'escalation',
  'organization', 'unit', 'board', 'chain', 'executive', 'changeRule', 'evalSet', 'shadowTrial', 'canary',
  'freeze', 'killSwitch', 'unitBudget'
];

/** The element id of a section's anchor on the Learn page. */
export function sectionAnchor(sectionId) {
  return `learn-${sectionId}`;
}

/**
 * Explainer topics that get a "See the diagram" link, and the section each one opens. Topics left out show no link:
 * only explainers whose subject a diagram actually draws carry one.
 */
export const EXPLAINER_SECTIONS = {
  agents: 'runtime',
  agentDetail: 'runtime',
  deployments: 'runtime',
  harnessProfiles: 'runtime',
  nodes: 'runtime',
  nodePools: 'runtime',
  credentials: 'runtime',
  tenants: 'runtime',
  invoke: 'request',
  runs: 'request',
  queue: 'request',
  requests: 'request',
  keepers: 'autonomy',
  memory: 'autonomy',
  reports: 'autonomy',
  escalations: 'autonomy',
  messages: 'teams',
  organizations: 'organization',
  board: 'organization',
  performance: 'organization',
  changeRules: 'selfRevision',
  evalSets: 'selfRevision',
  evalRuns: 'selfRevision',
  shadowTrials: 'selfRevision',
  canaryReleases: 'selfRevision',
  freezes: 'brakes'
};

/** The Learn page URL for an Explainer topic, or null when the topic has no diagram. */
export function learnPathForTopic(topic, base = '/dashboard/learn') {
  const section = EXPLAINER_SECTIONS[topic];
  return section ? `${base}#${sectionAnchor(section)}` : null;
}
