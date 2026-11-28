// The seven concept diagrams on the Learn page (LP4.2), as data for the kit in Diagram.jsx.
//
// Every label comes from the catalogs by convention: learn.diagrams.<id>.title, .summary, and .desc;
// .boxes.<box>.title and .body; .groups.<group>; .arrows.<arrow> (an arrow without a key has no label).
// `page` is a page id for pathFor() in config/navConfig.js, `doc` a path under docs/, and `code` the class or tool
// name the box stands for. Code names stay in English in every locale, the way the docs write them.
//
// Each diagram was checked against the code paths that docs/ARCHITECTURE.md ("Autonomy on top of the runtime") names,
// and against the guide the box links to. When the docs or the code change, change the diagram with them.
//
// Tones: core (the subject of the diagram), actor (people and callers), check (a check that can refuse),
// stop (a brake or a refusal). Boxes without a tone are neutral.

/** @type {Array<object>} */
export const DIAGRAMS = [
  {
    id: 'runtime',
    columns: 3,
    boxes: [
      { id: 'credential', col: 0, row: 0, tone: 'actor', page: 'credentials', doc: 'SECURITY.md#identities' },
      { id: 'agent', col: 1, row: 0, tone: 'core', page: 'agents', doc: 'REVISIONS.md#revisions' },
      { id: 'harnessProfile', col: 0, row: 1, page: 'harnessProfiles', doc: 'HARNESSES.md' },
      { id: 'deployment', col: 1, row: 1, tone: 'core', page: 'deployments', doc: 'ARCHITECTURE.md#the-life-of-a-run' },
      { id: 'nodePool', col: 2, row: 1, page: 'nodePools', doc: 'TENANT_SCHEDULING.md' },
      { id: 'run', col: 1, row: 2, tone: 'core', page: 'runs', doc: 'ARCHITECTURE.md#run-states' },
      { id: 'node', col: 2, row: 2, page: 'nodes', doc: 'ARCHITECTURE.md#the-parts' }
    ],
    groups: [
      { id: 'tenant', cols: [0, 1], rows: [0, 2] },
      { id: 'fleet', cols: [2, 2], rows: [1, 2] }
    ],
    arrows: [
      { id: 'invokes', from: 'credential', to: 'agent' },
      { id: 'runsOn', from: 'agent', to: 'deployment' },
      { id: 'usedBy', from: 'harnessProfile', to: 'deployment' },
      { id: 'targets', from: 'deployment', to: 'nodePool' },
      { id: 'creates', from: 'deployment', to: 'run' },
      { id: 'groups', from: 'nodePool', to: 'node' },
      { id: 'leases', from: 'node', to: 'run' }
    ]
  },
  {
    id: 'request',
    columns: 4,
    boxes: [
      { id: 'caller', col: 0, row: 0, tone: 'actor', page: 'invoke', doc: 'ARCHITECTURE.md#the-life-of-a-run' },
      { id: 'surface', col: 1, row: 0, page: 'requests', doc: 'ARCHITECTURE.md#the-life-of-a-run' },
      { id: 'admission', col: 2, row: 0, tone: 'check', page: 'freezes', doc: 'BRAKES.md', code: 'RunService' },
      { id: 'queued', col: 3, row: 0, page: 'queue', doc: 'TENANT_SCHEDULING.md' },
      { id: 'reply', col: 0, row: 1, page: 'runs', doc: 'ARCHITECTURE.md#the-life-of-a-run' },
      { id: 'events', col: 1, row: 1, page: 'runs', doc: 'ARCHITECTURE.md#the-life-of-a-run' },
      { id: 'harness', col: 2, row: 1, page: 'harnessProfiles', doc: 'HARNESSES.md' },
      { id: 'lease', col: 3, row: 1, tone: 'core', page: 'nodes', doc: 'ARCHITECTURE.md#the-life-of-a-run', code: 'ExecutionSpec' }
    ],
    groups: [
      { id: 'controlPlane', cols: [1, 3], rows: [0, 0] },
      { id: 'worker', cols: [2, 3], rows: [1, 1] }
    ],
    arrows: [
      { id: 'sends', from: 'caller', to: 'surface' },
      { id: 'admit', from: 'surface', to: 'admission' },
      { id: 'admitted', from: 'admission', to: 'queued' },
      { id: 'leased', from: 'queued', to: 'lease' },
      { id: 'starts', from: 'lease', to: 'harness' },
      { id: 'output', from: 'harness', to: 'events' },
      { id: 'finish', from: 'events', to: 'reply' },
      { id: 'returns', from: 'reply', to: 'caller' }
    ]
  },
  {
    id: 'autonomy',
    columns: 3,
    boxes: [
      { id: 'keeper', col: 0, row: 0, tone: 'core', page: 'keepers', doc: 'KEEPERS.md' },
      { id: 'mandate', col: 1, row: 0, page: 'keepers', doc: 'KEEPERS.md#what-a-mandate-holds' },
      { id: 'schedule', col: 2, row: 0, page: 'keepers', doc: 'KEEPERS.md#backoff', code: 'KeeperScheduler' },
      { id: 'run', col: 1, row: 1, tone: 'core', page: 'runs', doc: 'KEEPERS.md#a-tick-step-by-step', code: 'garrison_keeper_complete_tick' },
      { id: 'tick', col: 2, row: 1, page: 'keepers', doc: 'KEEPERS.md#a-tick-step-by-step' },
      { id: 'memory', col: 0, row: 2, page: 'memory', doc: 'AGENT_MEMORY.md#recall-into-keeper-ticks' },
      { id: 'report', col: 1, row: 2, page: 'reports', doc: 'REPORTS.md', code: 'garrison_file_report' },
      { id: 'escalation', col: 2, row: 2, tone: 'actor', page: 'escalations', doc: 'ESCALATIONS.md', code: 'garrison_escalate' }
    ],
    arrows: [
      { id: 'holds', from: 'keeper', to: 'mandate' },
      { id: 'sets', from: 'mandate', to: 'schedule' },
      { id: 'comesDue', from: 'schedule', to: 'tick' },
      { id: 'starts', from: 'tick', to: 'run' },
      { id: 'writes', from: 'run', to: 'memory', fromOffset: -0.3 },
      { id: 'files', from: 'run', to: 'report' },
      { id: 'raises', from: 'run', to: 'escalation', fromOffset: 0.3, toOffset: -0.2 },
      { id: 'answerWakes', from: 'escalation', to: 'tick', dashed: true, fromOffset: 0.22 }
    ]
  },
  {
    id: 'teams',
    columns: 4,
    boxes: [
      { id: 'sender', col: 0, row: 0, tone: 'actor', page: 'messages', doc: 'MESSAGING.md#sending-and-reading', code: 'garrison_send_message' },
      { id: 'guards', col: 1, row: 0, tone: 'check', page: 'messages', doc: 'MESSAGING.md#loop-guards', code: 'MessageService' },
      { id: 'mailbox', col: 2, row: 0, tone: 'core', page: 'messages', doc: 'MESSAGING.md#delivery' },
      { id: 'normal', col: 3, row: 0, page: 'keepers', doc: 'MESSAGING.md#delivery', code: 'garrison_read_inbox' },
      { id: 'rejected', col: 1, row: 1, tone: 'stop', page: 'messages', doc: 'MESSAGING.md#loop-guards' },
      { id: 'urgent', col: 2, row: 1, page: 'keepers', doc: 'MESSAGING.md#delivery' },
      { id: 'recipient', col: 3, row: 1, tone: 'core', page: 'runs', doc: 'MESSAGING.md#coalescing' }
    ],
    arrows: [
      { id: 'sends', from: 'sender', to: 'guards' },
      { id: 'passes', from: 'guards', to: 'mailbox' },
      { id: 'refused', from: 'guards', to: 'rejected' },
      { id: 'normal', from: 'mailbox', to: 'normal' },
      { id: 'urgent', from: 'mailbox', to: 'urgent' },
      { id: 'nextRun', from: 'normal', to: 'recipient' },
      { id: 'wakes', from: 'urgent', to: 'recipient' }
    ]
  },
  {
    id: 'organization',
    columns: 4,
    boxes: [
      { id: 'board', col: 1, row: 0, tone: 'actor', page: 'board', doc: 'BOARD.md' },
      { id: 'root', col: 1, row: 1, tone: 'core', page: 'organizations', doc: 'ORGANIZATIONS.md#units' },
      { id: 'unitA', col: 0, row: 2, page: 'organizations', doc: 'ORGANIZATIONS.md#units' },
      { id: 'unitB', col: 2, row: 2, page: 'organizations', doc: 'ORGANIZATIONS.md#budgets' },
      { id: 'working', col: 3, row: 0, page: 'organizations', doc: 'ORGANIZATIONS.md#the-working-tree-and-the-live-revision' },
      { id: 'revision', col: 3, row: 1, tone: 'core', page: 'organizations', doc: 'ORGANIZATIONS.md#revisions-publish-and-rollback' },
      { id: 'chain', col: 3, row: 2, tone: 'check', page: 'organizations', doc: 'ORGANIZATIONS.md#the-chain-of-command', code: 'ChainOfCommand' }
    ],
    groups: [{ id: 'live', cols: [0, 2], rows: [1, 2] }],
    arrows: [
      { id: 'oversees', from: 'board', to: 'root' },
      { id: 'reportsA', from: 'root', to: 'unitA', fromOffset: -0.2 },
      { id: 'reportsB', from: 'root', to: 'unitB', fromOffset: 0.2 },
      { id: 'peer', from: 'unitA', to: 'unitB', dashed: true, both: true },
      { id: 'publish', from: 'working', to: 'revision' },
      { id: 'readBy', from: 'revision', to: 'chain' }
    ]
  },
  {
    id: 'selfRevision',
    columns: 3,
    boxes: [
      { id: 'executive', col: 1, row: 0, tone: 'core', page: 'organizations', doc: 'EXECUTIVES.md#making-an-executive', code: 'managementAccess: OrgSubtree' },
      { id: 'draft', col: 1, row: 1, page: 'studio', doc: 'EXECUTIVES.md#drafts-and-proposals' },
      { id: 'limits', col: 1, row: 2, tone: 'check', page: 'organizations', doc: 'EXECUTIVES.md#hard-limits', code: 'ExecutiveDraftValidator' },
      { id: 'refused', col: 2, row: 2, tone: 'stop', page: 'organizations', doc: 'EXECUTIVES.md#hard-limits' },
      { id: 'eval', col: 0, row: 3, page: 'evalRuns', doc: 'EXECUTIVES.md#eval-gates', code: 'garrison_run_eval' },
      { id: 'rules', col: 1, row: 3, tone: 'check', page: 'changeRules', doc: 'EXECUTIVES.md#change-rules', code: 'ChangeClassifier · ChangeRuleMatcher' },
      { id: 'person', col: 2, row: 3, tone: 'actor', page: 'approvals', doc: 'EXECUTIVES.md#request-apply' },
      { id: 'apply', col: 1, row: 4, tone: 'core', page: 'approvals', doc: 'EXECUTIVES.md#request-apply', code: 'DraftApply' },
      { id: 'evidence', col: 2, row: 4, page: 'shadowTrials', doc: 'EVALS.md#shadow-trials' },
      { id: 'rollback', col: 0, row: 5, tone: 'stop', page: 'organizations', doc: 'EXECUTIVES.md#revisions-revert-drafts-and-rollback' },
      { id: 'revision', col: 1, row: 5, page: 'organizations', doc: 'ORGANIZATIONS.md#revisions-publish-and-rollback' },
      { id: 'revert', col: 2, row: 5, page: 'studio', doc: 'EXECUTIVES.md#revisions-revert-drafts-and-rollback' }
    ],
    arrows: [
      { id: 'writes', from: 'executive', to: 'draft' },
      { id: 'checked', from: 'draft', to: 'limits' },
      { id: 'breaks', from: 'limits', to: 'refused' },
      { id: 'passes', from: 'limits', to: 'rules' },
      { id: 'gate', from: 'eval', to: 'rules', dashed: true },
      { id: 'notCovered', from: 'rules', to: 'person' },
      { id: 'covered', from: 'rules', to: 'apply', fromOffset: -0.2 },
      { id: 'allows', from: 'person', to: 'apply', fromOffset: -0.25, toOffset: 0.2 },
      { id: 'evidence', from: 'evidence', to: 'person', dashed: true, fromOffset: 0.25 },
      { id: 'publishes', from: 'apply', to: 'revision' },
      { id: 'saves', from: 'revision', to: 'revert' },
      { id: 'restores', from: 'rollback', to: 'revision' }
    ]
  },
  {
    id: 'brakes',
    columns: 4,
    boxes: [
      { id: 'freeze', col: 0, row: 0, tone: 'stop', page: 'freezes', doc: 'BRAKES.md#freezes' },
      { id: 'killSwitch', col: 1, row: 0, tone: 'stop', page: 'freezes', doc: 'BRAKES.md#the-kill-switch', code: 'TenantAutonomy' },
      { id: 'spendCap', col: 2, row: 0, tone: 'stop', page: 'keepers', doc: 'BRAKES.md#spend-caps' },
      { id: 'unitBudget', col: 3, row: 0, tone: 'stop', page: 'organizations', doc: 'BRAKES.md#unit-budgets', code: 'OrgBudgetGuard' },
      { id: 'checks', col: 0, row: 1, span: 4, tone: 'check', page: 'freezes', doc: 'ARCHITECTURE.md#brakes', code: 'RunService · KeeperScheduler · FreezeService' },
      { id: 'refused', col: 0, row: 2, span: 2, page: 'runs', doc: 'BRAKES.md#freezes' },
      { id: 'skipped', col: 2, row: 2, span: 2, page: 'keepers', doc: 'KEEPERS.md#lifecycle' },
      { id: 'cancelAll', col: 0, row: 3, span: 2, page: 'organizations', doc: 'BRAKES.md#cancel-everything-in-a-unit', code: 'OrgBrakeService' },
      { id: 'autoFreeze', col: 2, row: 3, span: 2, page: 'freezes', doc: 'BRAKES.md#automatic-freeze-on-a-budget-breach', code: 'OrgBudgetGuard' }
    ],
    groups: [
      { id: 'newWork', cols: [0, 3], rows: [0, 2] },
      { id: 'inFlight', cols: [0, 3], rows: [3, 3] }
    ],
    arrows: [
      { id: 'freeze', from: 'freeze', to: 'checks' },
      { id: 'killSwitch', from: 'killSwitch', to: 'checks' },
      { id: 'spendCap', from: 'spendCap', to: 'checks' },
      { id: 'unitBudget', from: 'unitBudget', to: 'checks' },
      { id: 'refuses', from: 'checks', to: 'refused' },
      { id: 'skips', from: 'checks', to: 'skipped' }
    ]
  }
];

/** Arrow ids that carry a label, per diagram. Every other arrow is drawn without one. */
export const LABELLED_ARROWS = {
  runtime: ['invokes', 'runsOn', 'usedBy', 'targets', 'creates', 'groups', 'leases'],
  request: ['sends', 'admitted', 'leased', 'starts', 'returns'],
  autonomy: ['holds', 'sets', 'comesDue', 'starts', 'writes', 'files', 'raises', 'answerWakes'],
  teams: ['sends', 'passes', 'refused', 'normal', 'urgent', 'nextRun', 'wakes'],
  organization: ['oversees', 'reportsA', 'peer', 'publish', 'readBy'],
  selfRevision: ['writes', 'checked', 'breaks', 'passes', 'gate', 'notCovered', 'covered', 'allows', 'evidence', 'publishes', 'saves', 'restores'],
  brakes: ['refuses', 'skips']
};

/** Find a diagram definition by id. */
export function findDiagram(id) {
  return DIAGRAMS.find((d) => d.id === id) || null;
}
