# Executives

An executive is an agent that leads a unit of an [organization](ORGANIZATIONS.md) and may propose changes to the part of the organization below it. It writes those changes as [studio drafts](STUDIO.md), the same drafts a person or the agent architect writes. What makes it an executive is a narrower grant on its deployment and a set of checks that run on every draft it touches.

Executive authority points downward only. An agent that can change the system it runs in can also change its own goals, its own budget, or the rules that bound it, and once that happens nobody is steering. An executive can retune the agents below it, slow or speed their keepers, hire and release workers, and edit prompts its workers alone use. It can never touch itself, its own unit, anything above it, secrets, budgets going up, authority grants, or the rules that let it act without asking. No change rule lifts those limits, and no person's approval does either: a draft that breaks one cannot be applied at all.

Inside those limits, every executive draft waits for a person by default, like any other draft. People can also write **change rules** that pre-authorize narrow classes of change in part of the tree, such as "keepers in ops may set their minimum wake interval anywhere from 2 to 60 minutes". A draft whose every change a rule covers applies as soon as the executive asks. Either way the apply is recorded as an organization revision, so one rollback undoes it.

## Making an executive

Give a deployment of a unit lead `managementAccess: OrgSubtree`:

```yaml
apiVersion: garrison/v1
kind: Deployment
metadata:
  name: reliability-lead-exec
spec:
  agent: reliability-lead
  harnessProfile: claude-code
  managementAccess: OrgSubtree
```

The deployment is checked when it is created or changed. Its agent must lead exactly one unit:

| Code | When |
|---|---|
| `NotAUnitLead` | The agent leads no unit in the working tree of any organization that is not `Retired`, and no Organization document in the same manifest bundle makes it a lead |
| `LeadsSeveralUnits` | The agent leads units in more than one organization, so which subtree it would govern is ambiguous |

Both come back as a validation failure on the `managementAccess` field. A deployment and the Organization that makes its agent a lead may arrive in one bundle.

Passing validation does not settle anything for later. The executive's position is worked out again from the live chart every time it is used: when it starts a draft, each time a draft is validated, when it asks to apply, and when a person reads its proposal. A deployment with `OrgSubtree` whose agent leads exactly one unit in a live revision is that unit's executive. Publish a revision that moves the agent out of the lead's seat, and its authority ends on the next call, even in the middle of a run. A run of an `OrgSubtree` deployment whose agent leads nothing live gets 403 `NotAnExecutive` when it tries to start a draft, and a draft it wrote earlier fails validation with `OutsideSubtree` on every item.

An executive run sees the studio draft tools, `garrison_list_change_rules`, and the `builtin/executive-system` fragment in its system prompt (see [Prompts](#the-executive-prompt)). Unlike `Drafts`, `OrgSubtree` does not open the playground. What an executive can do is run an eval set against its own draft with `garrison_run_eval` (see [Eval gates](#eval-gates)), which is how it tries a changed or new worker before proposing it.

## What it may change

An executive's subtree is the units strictly below its own unit. Within it the executive reaches:

- the leads and members of those units;
- their deployments, and the mandates bound to those deployments or named on the units;
- prompt templates used only by agents and deployments in the subtree;
- agent assets pinned only by agents in the subtree.

Its own unit is not part of it. That includes the executive's agent, its deployments and mandates, the unit's members list, its title, and its budgets. Changing the unit you lead would be changing your own position, so a person does it.

Templates and assets need a closer look, because one template can serve many deployments. Garrison counts who uses each one: agents through their tool and skill description templates and pinned assets, deployments through their prompt bindings. A template or asset used only inside the subtree is **exclusive** and the executive may edit it. One also used outside is **shared** and read-only to the executive, which gets `OutsideSubtree` with a hint to copy it under a new name and bind the copy. A brand new template or asset is always allowed. Built-in templates are never part of a subtree.

A draft may hold these kinds: `Agent`, `Deployment`, `Mandate`, `PromptTemplate`, `AgentAsset`, and the executive's own `Organization`. In the Organization document only the units below the executive may differ from the live tree. The organization's description and mission belong to the board.

New workers come in through the same draft that places them. A new agent must join a unit below the executive in the Organization item of the same draft; its deployment must deploy an agent below the executive, and a mandate must bind a deployment below it. A live agent from outside the subtree, or one in no unit at all, can never be moved in through an executive draft. Without that rule an executive could adopt any agent in the tenant by listing it as a member.

## Hard limits

Every executive draft is checked against these limits when it is validated, when apply is requested, and again just before it applies. A refused item shows `change: Failed` with the code in `errorCode`, and the draft's diff lists every refusal in `refusals`. Request-apply of a draft with any refusal fails with 400 `DraftInvalid`, whatever rules exist and whoever asks.

| Code | Refused when the draft |
|---|---|
| `SelfModification` | Touches the executive's own agent, a deployment or mandate of that agent, the mandate it holds as lead, or its own unit (including placing itself in a unit below), or deletes its own organization |
| `OutsideSubtree` | Touches an agent, deployment, mandate, template, asset, or unit that is not below the executive; edits a shared template or asset; adds a live agent from outside the subtree to a unit; draws a new peer line to a unit outside the subtree; changes the organization's description or mission; creates an organization; or names another organization |
| `ForbiddenKind` | Deletes any live record; holds a kind other than the six above; or changes a field whose path contains `secret` or `credential` on an agent, deployment, or asset |
| `BudgetIncrease` | Raises or removes `maxBudgetUsd` on an existing deployment, `budgetPerTickUsd`, `budgetPerDayUsd`, or `maxTokensPerTick` on an existing mandate, or any budget of an existing unit below |
| `AuthorityChange` | Changes `managementAccess` on any deployment, including giving a new deployment anything but `None` |

A budget may stay the same or go down. Removing one counts as raising it, since no budget means no cap. An executive retires a worker by removing it from its unit, which is a `RemoveWorker` change. The agent and its records stay, and a person deletes them if they should go.

Every permission is still checked against the person who started the run. The draft's dry run happens with that person's permissions and secret access, so an executive started by someone who cannot edit deployments cannot propose a deployment change that passes validation. The hard limits sit on top of that ceiling and never widen it.

## Drafts and proposals

An executive works with the ordinary studio tools:

1. `garrison_studio_create_draft` starts a draft. Garrison records the run, the organization, the unit the executive leads, and its agent on the draft. Those never change afterward. A draft without a title is called `Proposal for <unit>`.
2. `garrison_studio_put_item` adds or replaces manifest documents. Reading the live document first (with `garrison_studio_get_draft` or the configuration read tools) and editing it is the easiest way to change one field.
3. `garrison_studio_validate` returns the diff with `refusals`, `ruleMatches`, and `appliesByRule`.
4. `garrison_studio_request_apply` asks to apply.

Seen from the organization, an executive's draft is a **proposal**. A run token reaches only drafts of the person it acts for, and an executive reaches only its own proposals for the unit it leads now. Any other run, including an architect working for the same person, never sees an executive's proposal. The person who owns the draft can still read and edit it through the studio routes, and every item they add is held to the same executive limits.

`ruleMatches` lists every change in the draft with its classes, the rule that covers it, or a `reason` starting with "Needs a person:" that says why none does. A change that a rule would cover once the draft passes the rule's eval gate also carries `code` `EvalGatePending`; a change covered by a gated rule names the passing eval run in `gateEvalRunId`. `appliesByRule` is true when the draft is valid, every change is covered, and something actually changes. It is a prediction: the rules are checked again on request.

## Change classes

Change rules speak in classes, not fields. Garrison compares each draft item with live configuration and sorts every changed field into one of seven classes. A change can carry more than one class. A field that fits no class makes the whole change **unclassified**, and an unclassified change always waits for a person.

| Class | What maps to it |
|---|---|
| `PromptRetune` | A deployment's `prompts` bindings or `description`; an agent's `displayName`, `description`, `skills`, `tags`, or `assets`; any change to an existing exclusive template or asset; a new template or asset in a draft that adds no agent |
| `WakeTuning` | A mandate's `revision.wakeMode`, `minIntervalSeconds`, `maxIntervalSeconds`, `backoffFactor`, or `jitterPercent` |
| `MandateTextEdit` | A mandate's `description`, or its `revision.objective`, `healthyDefinition`, `autonomy`, `escalationPolicy`, `direction`, `signals`, or `changeNote` |
| `AddWorker` | A new agent, deployment, or mandate; a new template or asset in a draft that also adds an agent; an agent added to a unit below |
| `RemoveWorker` | An agent removed from a unit below |
| `ModelChange` | A deployment's `model`, `fallbackModel`, `effort`, or `inferenceEndpoint` |
| `DeploymentWeight` | A deployment's `weight` |

Everything else is unclassified. That covers, among others, a deployment's harness, trust level, egress rules, approval settings, executor, `maxBudgetUsd` (going down), and `maxTurns`; an agent's delegation settings and exposure; a mandate's budgets (going down) and escalation target; and in the Organization item, a new or removed unit, a moved unit, a changed lead, titles, the lead's mandate, apps, peer lines, and budgets. Anything that loosens isolation or reach is deliberately left for a person.

For the Organization item each unit is looked at separately: every agent who joins is one `AddWorker` change, every agent who leaves is one `RemoveWorker` change, and other edits to the unit are one unclassified change.

## Change rules

A change rule is a standing yes from a person. It names an organization, a unit, and the classes it allows, with optional limits:

| Field | Meaning |
|---|---|
| `id` | `cru_` identifier |
| `organizationId` | The organization. Set on create; a rule never moves to another organization (`OrganizationNotSettable`) |
| `unitId` | The rule covers changes in this unit and every unit below it. Requests may name the unit |
| `name` | 1 to 128 characters |
| `description` | Why the rule exists, at most 2000 characters |
| `active` | Default `true`. An inactive rule never matches |
| `expiresUtc` | When the rule stops matching. Optional, and there is no default expiry. It must be in the future when you set or change it (`ExpiryInPast`); an update that keeps an expiry already past is allowed, so an expired rule can still be renamed or turned off |
| `classes` | At least one class, each once |
| `limits` | Up to 32 numeric bounds, each with `class` (which the rule must list), `name`, and a `minimum`, a `maximum`, or both. Bounds are inclusive and zero or more |
| `gateEvalSet` | Optional eval set name, at most 128 characters. When set, the rule covers an `AddWorker` or `ModelChange` change only after the draft passed this set (see [Eval gates](#eval-gates)). The rule must list `AddWorker` or `ModelChange`, and the set must have a version a person approved |
| `gateThreshold` | Score from 0 to 1 the gate's eval run must reach. Default 1 when `gateEvalSet` is set; values outside the range are clamped. Only allowed with `gateEvalSet` |
| `createdByType`, `createdById`, `createdByName`, `updatedByName` | Who wrote and last changed it. Set by the server |

`organizationName` and `unitName` are filled in on read.

Limit names depend on the class:

| Class | Limit names |
|---|---|
| `WakeTuning` | `count`, `minIntervalSeconds`, `maxIntervalSeconds`, `backoffFactor`, `jitterPercent` (the new values) |
| `DeploymentWeight` | `count`, `weight` (the new weight) |
| Every other class | `count` |

A value limit is checked against the value as the draft leaves it, whether or not the draft changed that value. A wake change that only lowers `maxIntervalSeconds` is still held to a `minIntervalSeconds` limit when the mandate has a minimum, so a mandate that already sits outside a rule's range stays outside its cover until a person moves it. A limit on a value the mandate does not set at all is skipped.

`count` bounds how many subjects of a class one draft may change under that rule. A subject is one worker or one record: an agent together with its deployment, its mandate, and its place in a unit counts as one worker. So `AddWorker` with `count` at most 1 lets a draft hire one new worker, even though that draft holds an Agent, a Deployment, a Mandate, and an Organization membership. Each template, asset, or unit edit counts once. When a draft goes over a rule's count, every change of that class assigned to the rule loses its cover and needs a person.

Rule validation answers 400 `ValidationFailed` with these field codes: `Required` (no name, or no class), `TooLong`, `OrganizationNotFound`, `UnitNotFound`, `ExpiryInPast`, `Duplicate` (a class or a class and limit name twice), `TooMany`, `ClassNotInRule`, `UnknownLimit`, `BoundRequired`, `MinimumAboveMaximum`, `NegativeBound`, and for the eval gate `GateClassRequired` (the rule lists neither `AddWorker` nor `ModelChange`), `GateSetRequired` (a threshold without a set), `EvalSetNotFound`, and `EvalSetNotApproved` (no version of the set was approved by a person).

### How a change finds a rule

Matching runs change by change, in a fixed order, so the same draft against the same rules always gets the same answer:

1. A change with an unclassified field, or no class at all, is never covered.
2. Otherwise Garrison walks the organization's rules that are in force (active and not expired), oldest first, and takes the first rule whose unit contains the change, that lists every class of the change, and whose value limits the new values meet. A rule with an eval gate is skipped for an `AddWorker` or `ModelChange` change until the draft passed the gate, so a later rule without a gate may still cover it.
3. When every change has a rule, the `count` limits are checked per rule across the draft.

When the only thing between a change and a rule is a gate the draft has not passed, the change's reason is the gate's (for example "Needs a person: rule Model upgrades requires eval set support-quality version 3 at score 0.9; the draft's latest eval run against it, evr_..., scored 0.75.") and its `code` is `EvalGatePending`.

Where a change sits is decided by the agent it belongs to: an agent's unit, a deployment's agent's unit, or a mandate's agent's unit, as the draft leaves them. A membership change sits in the unit it changes. Templates and assets sit at the executive's own unit, so only a rule on that unit or above it covers them. A rule on a unit below the executive covers that unit's corner of the subtree only.

A rule matches against the live chart. A rule whose unit was removed from the live revision covers nothing until a person points it at another unit.

## Request-apply

When an executive asks to apply, Garrison validates the draft again, checks the hard limits, and matches the rules. Then one of three things happens:

- **Refused.** Something failed or broke a hard limit. The answer is 400 `DraftInvalid` with each problem and its code. Nothing changes.
- **Applied by rule.** Every change is covered, and the person who started the run holds Create on `Manifest`. Garrison creates the `DraftApply` approval and decides it at once with `decisionSource` `Rule`, `decidedBy` "change rules", `ruleId` set to the first matching rule, and `rulePattern` listing every matching rule. The draft applies as that person, mandate revisions it writes carry source `Executive`, and the answer is the approved `Approval`.
- **Waiting.** Something is not covered, or the person who started the run may not apply manifests. The approval stays `Pending`, the draft moves to `PendingApproval`, and a person decides it like any draft.

An executive may ask again for a proposal that waits, passing the draft's current version. While something is still uncovered the answer is the same pending approval. Once every change is covered, for example because an eval run of the draft passed a rule's gate, the waiting approval is cancelled ("Superseded") and the draft applies by rule as above.

The person ceiling holds on both paths. A rule never lets a draft do more than the person behind the run could have done by hand. When the person who started the run is inactive or unknown, the draft waits.

If live configuration moved between the request and the apply, the approval is cancelled with `DraftStale` and the draft returns to `Open`. If the manifest apply fails, nothing changes and the draft reopens.

The approval records the run that wrote the draft (`rootRunId`) and the executive's agent, so the approvals list shows which agent a proposal came from.

## Eval gates

A change rule can hold back hiring and model changes until the draft proves itself. Set `gateEvalSet` (and `gateThreshold`) on a rule that lists `AddWorker` or `ModelChange`, and the rule covers such a change only when the draft has an eval run that:

- ran against the gate set's latest version a person approved (or, without one, the latest version an evaluator agent outside the executive's subtree wrote; an environment's promotion gate never takes that fallback and counts approved versions only);
- ran over the set's cases (`inputMode: Cases`; a `RecentInputs` replay never counts);
- was created after the draft's items last changed (`contentChangedUtc` on the draft; moving nodes on the canvas does not count as a change);
- completed with a score at or above the threshold.

Other classes the same rule lists, such as `WakeTuning`, are covered at once as before. The gate is checked every time the draft is validated and again when apply is requested.

The executive runs the eval itself with `garrison_run_eval`, passing `set`, `studioDraftId`, and `agent` (the worker it changes or adds; it may be left out when the draft touches exactly one agent). What gets evaluated is the draft, not live configuration:

- The draft's Agent document for a live agent becomes that agent's draft revision, as in the playground.
- A Deployment document for the agent (a `model` change, for example) is planned into an eval copy named `eval-{agent}-d{key}` in the reserved `draft` environment, with weight 0 and pinned to the evaluated revision, and every case runs on it. The eval run's `deploymentId` names the copy.
- A worker the draft adds is evaluated as an eval copy of the new agent, named `eval-d{key}-{agent}` and marked protected, on an eval copy of its Deployment document. A draft that adds an agent without a deployment answers `NoDeployment`.

Live configuration does not change until the draft applies. A failing eval leaves the change waiting with the failing run named in the reason (the rule match's code is `EvalGatePending`); run the set again after improving the draft. Hidden cases stay hidden from the executive, which sees their scores only, and the case and judge runs of hidden cases answer 404 to its run token. The eval copies go when the draft is applied or deleted; the eval runs and their results stay as evidence. Case runs and judge runs are `Eval` runs and cannot act (`EvalRunRefused`), so an eval of a draft never sends a message, writes memory, or calls a tool with effects.

A draft that pins a deployment's revision in an environment with an eval gate does not validate until that revision passed the environment's gate (`EvalGateFailed` on the item), whatever change rules say. [EVALS.md](EVALS.md) covers eval sets, scorers, eval runs, promotion gates, shadow trials, and canary releases in full.

## Revisions, revert drafts, and rollback

Every executive apply, by rule or by a person, ends in a new published revision of the organization. Its `note` says how it was applied and the draft's title, and two fields tie it to the change:

| Field | Meaning |
|---|---|
| `draftId` | The executive draft that was applied |
| `revertDraftId` | A draft titled `Undo: <title>` that holds the records the apply changed, as they were just before it |

The Organization document inside an executive draft is applied with `publish: false`, and the recorded revision is what publishes the tree. So one apply makes exactly one revision, whatever the draft held. The revert draft covers the records the revision snapshot does not: agents, deployments, mandates, templates, and assets. A record the apply created is listed in the revert draft as a delete when its kind can be deleted from a draft (agents and deployments). Mandates, templates, and assets the apply created stay after a rollback, for a person to remove.

Rolling the organization back to a revision before one or more executive applies does two things. It restores the tree and the pinned mandate revisions as any rollback does, and then it applies the revert drafts of every executive revision published after the target, newest first. Revert drafts belong to rollback: no run token can read or edit one, while people see them among their drafts. Each revert draft is used once; it moves to `Applied`, and a second rollback past the same revision does not apply it again. The rollback's audit entry says how many executive applies it undid.

If the organization cannot take a new revision when an executive draft applies (for example because it was retired in the meantime), the change stays live and the audit log says why no revision recorded it.

## Proposals

People follow executives through the organization's proposals.

| Route | Permission | Result |
|---|---|---|
| `GET /organizations/{id}/proposals` | Read on `Organization` | `EnumerationResult<OrgProposal>`, newest change first. Query: `status` (`Open`, `PendingApproval`, `Applied`), `maxResults`, `skip` |
| `GET /organizations/{id}/proposals/{draftId}` | Read on `Organization` | `OrgProposal` with `evidence`. One that is not applied carries `diff` with refusals and rule matches |
| `POST /organizations/{id}/proposals/{draftId}/decide` | Update on `Approval` | `OrgProposal`. Body `{allow, reason}` |

Paths are relative to `/v1.0/api/tenants/{tenantId}`. A draft that is not an executive proposal of that organization answers 404.

An `OrgProposal` is computed from the draft and its approval. It carries `draftId`, `title`, `status`, `version`, `organizationId`, `unitId` and `unitName` (the unit the executive leads), `agentId` and `agentName` (the executive), `originRunId`, `ownerName` (the person the run acted for), `approvalId`, `approvalStatus`, `decisionSource` (`Rule` or `User`), `decidedBy`, `reason`, `ruleIds`, `diff`, `evidence`, `createdUtc`, and `lastUpdateUtc`.

`evidence` (filled when one proposal is read, null in lists) shows what tested the draft:

| Field | Meaning |
|---|---|
| `contentChangedUtc` | When the draft's items last changed. Eval runs before it no longer count toward a gate |
| `evalRuns` | Every eval run of the draft, newest first: `evalRunId`, `setName`, `setVersion`, `agentId`, `deploymentId` (the eval copy, when the draft changes the deployment), `status`, `score`, `threshold`, `passed`, `completedCases`, `totalCases`, `current` (created after the last change), `createdUtc`, `completedUtc` |
| `shadowTrials` | Shadow trials started after the draft whose candidate is a deployment the draft changes or an eval copy of it: `shadowTrialId`, `name`, `sourceDeploymentId`, `candidateDeploymentId`, `candidateDeploymentName`, `status`, `comparedCount`, `agreedCount`, `divergedCount`, `candidateFailureCount`, `createdUtc`, `completedUtc` |
| `canaryReleases` | Canary releases started after the draft with such a candidate: `canaryReleaseId`, `agentId`, `candidateDeploymentId`, `candidateDeploymentName`, `baselineDeploymentId`, `status`, `currentStepIndex`, `stepCount`, `rollbackReason`, `createdUtc`, `completedUtc` |

Deciding works like deciding any `DraftApply` approval ([STUDIO.md](STUDIO.md#applying-a-draft)). Allow needs Create on `Manifest` (403 `ApproverLacksPermission`), validates the draft again, applies it as the deciding person, and records the organization revision. Deny sends the draft back to `Open` for the executive. A proposal that is not waiting answers 409 `ProposalNotPending`, and a run token is refused with 403 `ApproverIsAgent`. The draft's approval can also be decided through `POST /approvals/{id}/decide`, with the same result.

## Change rule routes

| Route | Permission | Result |
|---|---|---|
| `GET /change-rules` | Read on `ChangeRule` | `EnumerationResult<ChangeRule>`, newest first. Query: `organization`, `unit` (needs `organization`), `activeOnly`, `search`, `maxResults`, `skip` |
| `POST /change-rules` | Create on `ChangeRule` | `ChangeRule`, 201 |
| `GET /change-rules/{ruleId}` | Read on `ChangeRule` | `ChangeRule` |
| `PUT /change-rules/{ruleId}` | Update on `ChangeRule` | `ChangeRule`. Replaces unit, name, description, active, expiry, classes, limits, and the eval gate (`gateEvalSet`, `gateThreshold`; leave them out to remove the gate) |
| `DELETE /change-rules/{ruleId}` | Delete on `ChangeRule` | 204. Drafts it already applied stay applied |

A run token is refused on every write with 403 `RulesArePeopleOnly`, whatever its permissions. Over REST a run token cannot read rules either; executives read them with `garrison_list_change_rules`. Deleting an organization deletes its rules.

```bash
B=http://127.0.0.1:8700/v1.0/api/tenants/default
curl -s -X POST $B/change-rules -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{
  "organizationId": "site-reliability",
  "unitId": "reliability",
  "name": "Keepers may slow down",
  "description": "Quiet nights are fine. Ticks every 5 to 60 minutes need no review.",
  "classes": [{"class": "WakeTuning"}],
  "limits": [{"class": "WakeTuning", "name": "minIntervalSeconds", "minimum": 300, "maximum": 3600}]
}'
```

## MCP tools

| Tool | Who | Arguments |
|---|---|---|
| `garrison_list_change_rules` | Executive runs: the in-force rules on their unit or above it and on units below it. People: Read on `ChangeRule` | People only: optional `organization`, `unit`, `activeOnly`, `search`, `skip`, `maxResults` |
| `garrison_get_change_rule` | People, Read on `ChangeRule` | `ruleId` |
| `garrison_create_change_rule` | People, Create on `ChangeRule` | `organization`, `unit`, `name`, `classes`; optional `description`, `active`, `expiresUtc`, `limits`, `gateEvalSet`, `gateThreshold` |
| `garrison_update_change_rule` | People, Update on `ChangeRule` | `ruleId`; optional `unit`, `name`, `description`, `active`, `expiresUtc`, `classes`, `limits`, `gateEvalSet` (an empty string removes the gate), `gateThreshold`. Fields you leave out keep their values; `classes` and `limits` replace the lists |
| `garrison_delete_change_rule` | People, Delete on `ChangeRule` | `ruleId` |
| `garrison_list_org_proposals` | People, Read on `Organization` | `organization`; optional `status`, `skip`, `maxResults` |
| `garrison_get_org_proposal` | People, Read on `Organization` | `organization`, `draftId` |
| `garrison_decide_org_proposal` | People, Update on `Approval` (and Create on `Manifest` to apply) | `organization`, `draftId`, `allow`; optional `reason` |

Runs never see the rule-writing or proposal tools, and only executive runs see `garrison_list_change_rules`. Any other run that calls it gets `NotAnExecutive`.

## Live updates and notifications

The `organization:{orgId}` WebSocket channel sends `proposal.changed` with `organizationId` and a `proposal` (an `OrgProposal` with its `evidence` and without its diff) each time an executive's draft of that organization changes after you subscribed: created, edited, waiting, applied, or sent back. See [WEBSOCKETS_API.md](../WEBSOCKETS_API.md).

The notification event `OrgProposalApplied` fires when change rules applied a proposal without a person. Proposals a person approves do not send it, because a person already saw them. The payload carries `proposal` with `draftId`, `title`, `organizationId`, `organizationName`, `unitId`, `unitName`, `agentId`, `agentName`, `approvalId`, `ruleIds`, `appliedUtc`, and `evidence` (as on the proposal), and its `link` points at the proposal. An endpoint filtered to an agent hears only that executive's proposals; one filtered to a deployment hears none. See [NOTIFICATIONS.md](NOTIFICATIONS.md).

## The executive prompt

Every run of an executive gets `builtin/executive-system` appended to its system prompt, after the organization's `builtin/org-context`. It names the unit and organization, lists the units below with their leads and member counts, explains how to propose a change with the studio tools, spells out the hard limits with their codes, reminds the executive that the person who started the run bounds it, and lists the change rules in force with their classes, limits, expiry, and eval gate. Unit and rule names in it are marked as data.

A tenant `Fragment` template named `executive-system` replaces it for the tenant, and a deployment binding for the `ExecutiveSystem` role replaces it for one deployment. `POST .../deployments/{id}/compile-preview` on an executive deployment shows the fragment as a real run would get it. See [PROMPTS.md](PROMPTS.md).

## Permissions

| Action | Permission | Built-in roles |
|---|---|---|
| List and read change rules | Read on `ChangeRule` | Viewer, Auditor, AgentOperator, AgentDeveloper, Editor, TenantAdmin |
| Create, change, and delete change rules | Create, Update, Delete on `ChangeRule` | Editor, TenantAdmin |
| List and read proposals | Read on `Organization` | Viewer, Auditor, AgentOperator, AgentDeveloper, Editor, TenantAdmin |
| Decide a proposal | Update on `Approval`, and Create on `Manifest` to allow | Editor and TenantAdmin; AgentOperator can deny |
| Roll back an organization, undoing executive applies | Update on `Organization` | AgentDeveloper, Editor, TenantAdmin |
| Give a deployment `managementAccess: OrgSubtree` | Create or Update on `Deployment` | AgentDeveloper, Editor, TenantAdmin |

AgentDeveloper may build organizations but not write the rules that let agents change them unattended. Granting autonomy is a separate decision, and the built-in roles keep it with Editor and TenantAdmin.

Every rule change, every executive apply, and every revision it records is written to the audit log. `garrison.org.proposals` counts proposals by `source` (`rule` or `user`) and `outcome` (`applied`, `waiting`, `denied`, `refused`, `failed`), and each executive validation is an `org proposal validate` span. The Autonomy dashboard has an Executive proposals panel. See [TELEMETRY.md](TELEMETRY.md).

## A worked example

Take the `site-reliability` organization from [ORGANIZATIONS.md](ORGANIZATIONS.md#a-worked-example). `reliability-lead` leads the root unit `reliability`, with `dependencies`, `latency`, and `capacity` below it. Its deployment `reliability-lead-exec` has `managementAccess: OrgSubtree`, so it is the executive of those three units. `latency-keeper` runs a keeper mandate `latency-watch` that wakes every 60 to 120 seconds.

A person on the board writes the rule from the curl example above: on `reliability` and below, `WakeTuning` is fine as long as `minIntervalSeconds` lands between 300 and 3600.

Overnight, the executive reads `latency-keeper`'s reports, sees that nothing has moved for hours, and decides the keeper is ticking too often. In its run it calls:

```json
{ "name": "garrison_studio_create_draft", "arguments": { "title": "Slow latency-watch overnight" } }
```

then puts the live `latency-watch` mandate back with `minIntervalSeconds: 300` and `maxIntervalSeconds: 600`, and validates. `ruleMatches` shows one change, `Mandate/latency-watch` with class `WakeTuning`, covered by "Keepers may slow down", and `appliesByRule` is true. `garrison_studio_request_apply` comes back with an approved approval whose `decisionSource` is `Rule`. The mandate has a new revision with source `Executive`, the keeper wakes under it, the organization has a new revision whose `draftId` is the draft, and an endpoint subscribed to `OrgProposalApplied` gets a notification.

Next the executive decides `dependency-keeper` needs a stronger model and drafts a change to its deployment's `model`. That is `ModelChange`, and no rule lists it, so request-apply answers with a `Pending` approval. On the organization's proposals tab or through `GET /organizations/site-reliability/proposals/{draftId}`, a person sees the diff and the reason: "Needs a person: rule Keepers may slow down does not cover ModelChange." They allow it, and it applies as them, with its own organization revision.

After a few of these the board decides model upgrades can go through on their own if they hold up. A person approves an eval set `dependency-triage` of past triage questions and writes a second rule on `dependencies`: `ModelChange`, with `gateEvalSet` `dependency-triage` and `gateThreshold` 0.9. The executive's next model change validates with `code` `EvalGatePending`. It calls `garrison_run_eval` with the set, its draft, and `dependency-keeper`; the cases run on an eval copy of the deployment with the new model, and the run scores 0.95. Validating again shows the change covered by the new rule with `gateEvalRunId` set, and request-apply applies it by rule. The proposal's `evidence` lists that eval run for whoever reviews the organization's history later.

Then the executive tries to raise its own deployment's `maxBudgetUsd`. Validation refuses the item with `SelfModification`, and request-apply fails with `DraftInvalid`. No rule and no approval can get that draft through. A person who wants the change makes it directly.

The next morning someone decides the overnight changes were a mistake. `POST /organizations/site-reliability/rollback` with the revision that was live before them restores the tree, then applies the two revert drafts newest first: `dependency-keeper`'s deployment gets its old model back, and `latency-watch` gets a new revision with the old 60 to 120 second bounds.

## Out of reach

Some things are closed to executives on purpose, and stay closed whatever rules people write:

- Anything about the executive itself: its agent, deployments, mandates, its own unit, and its own place in the chart.
- Anything at or above its own unit, the organization's description and mission, and other organizations.
- Writing, changing, or deleting change rules. People decide how much an agent may do unattended.
- Raising or removing any budget, and changing `managementAccess` anywhere.
- Secrets and credential references, and deleting live records.
- Freezes, escalation answers, approvals, and mandate publishes outside the draft path. A run token is refused on the mandate publish route.
- The playground. Executives cannot try draft agent revisions until evaluations exist to judge them (AA9).

The archived reasoning is in decisions AA-022, AA-023, and AA-068 to AA-073 of `AUTONOMOUS_AGENTS_PLAN.md`. The threat model is in [SECURITY.md](SECURITY.md#executive-authority).
