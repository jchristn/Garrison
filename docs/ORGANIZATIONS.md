# Organizations

An organization gives a group of agents a shape: who leads whom, who may talk to whom, what they share, and how much they may spend. It is a tree of units. Each unit has a lead agent, members, and optionally an app, peer lines to other units, and budgets. The lead of the root unit is the organization's CEO, and above the CEO sits the board: the people who run the organization.

Escalations, reports, memory, messaging, freezes, and budgets all read the same structure, so an agent's manager is the same agent whichever feature asks. Nothing in an organization takes effect until a person publishes a revision of it.

An organization has:

| Field | Meaning |
|---|---|
| `name` | 1 to 128 characters, unique in the tenant |
| `description` | For people, at most 2000 characters |
| `mission` | What the organization exists to do, at most 8000 characters. Member runs see it through `builtin/org-context` |
| `status` | `Draft` until the first publish, then `Active`. `Frozen` while an Organization freeze holds it. `Retired` when a person retires it |
| `rootUnitId` | The root unit of the working tree. Set by the server |
| `currentRevisionId`, `currentRevisionNumber` | The live revision, or none before the first publish. Set by the server |

Identifiers start with `org_` for organizations, `oun_` for units, and `orv_` for revisions. An organization lives in one tenant.

## Units

| Field | Meaning |
|---|---|
| `name` | 1 to 128 characters, unique in the organization, ignoring case |
| `description` | What the unit is responsible for, at most 2000 characters |
| `parentUnitId` | The unit above it. Leave it empty for the root; an organization has exactly one |
| `leadAgentId`, `leadTitle`, `leadMandateId` | The lead agent, its title (at most 128 characters), and its keeper. A unit may have no lead yet |
| `appId` | An agentic app the unit runs |
| `members` | Up to 200 other agents, each with `agentId`, an optional `title`, and an optional `mandateId` |
| `peerLines` | Up to 50 other units of the same organization, each as `peerUnitId` |
| `budgets` | At most one `Day` and one `Month` budget, each an `amountUsd` above 0 and at most 10,000,000 |

Requests may name agents, mandates, apps, and units instead of giving identifiers; Garrison stores the identifiers and fills in the names when it reads a unit back. A mandate must be a keeper of the agent it is listed with. Every lead and member must be an active agent. An agent holds one position per organization, as a lead or as a member, but it may hold positions in several organizations.

A peer line is stored on one unit and works in both directions. A budget caps the spend of the unit's whole subtree, the unit included (see [Budgets](#budgets)).

## The working tree and the live revision

People edit an organization's units through the unit routes, or replace them all at once with `garrison_update_organization`. Those edits change the working tree, which nothing reads at run time. To make a structure live, snapshot the working tree as a revision and publish it. The chain of command, message lines, memory scopes, freezes, and budgets read only the live revision of an organization whose status is `Active` or `Frozen` (AA-064). A `Draft` organization, a `Retired` one, and unpublished edits do not count.

The split exists so that a half-edited tree never routes mail or money. You can move three units, add a lead, and change a budget, look at the result, and publish it as one change that one rollback undoes.

The chart is the exception for people: `GET .../chart` shows the live revision, and before the first publish it shows the working tree, with `source` set to `Live` or `Working` so you can tell which.

### Validation

Every edit to the working tree is checked against the whole tree, and so is every snapshot and publish. A refusal is a 409 with one of these codes:

| Code | Rule |
|---|---|
| `OneRoot` | Two units without a parent. A snapshot or publish also needs exactly one root, so an empty tree or a tree without a root is refused there |
| `ParentNotFound` | The parent is not a unit of this organization |
| `Cycle` | A unit would sit below itself, or names itself as its parent |
| `UnitNameTaken` | Two units share a name, ignoring case |
| `LeadsTwoUnits` | An agent leads two units of the organization |
| `PositionTaken` | An agent is listed twice: as a lead and a member, or as a member of two units |
| `PeerNotFound` | A peer line points at the unit itself or outside the organization |
| `BudgetPeriodTaken` | A unit has two budgets for the same period |
| `BudgetInvalid` | A budget is 0 or less, or above 10,000,000 USD |
| `BudgetExceedsParent` | A budget is larger than the budget for the same period on the nearest unit above that has one |
| `TooManyUnits`, `TooManyMembers`, `TooManyPeerLines` | More than 500 units, 200 members in a unit, or 50 peer lines on a unit |
| `AgentInactive` | A lead or member is not active. Publishing checks again, so an agent deactivated after it joined the working tree blocks the publish until its unit changes |
| `MandateMismatch` | A mandate belongs to a different agent |
| `UnitHasChildren` | Deleting a unit that still has units below it |
| `NameConflict` | Another organization in the tenant has the name |
| `OrganizationRetired` | Editing, snapshotting, publishing, or rolling back a retired organization |
| `StatusNotSettable` | A status change other than to `Retired` (from `Draft` or `Active`) or from `Retired` back to `Active` |

Field errors (a name that is too long, an agent, mandate, or app that does not exist, a lead mandate without a lead) answer 400 `ValidationFailed` with the field. Deleting a unit also deletes the peer lines that point at it.

## Revisions, publish, and rollback

`POST .../revisions` snapshots the working tree as a `Draft` revision: its units with their members, peer lines, and budgets, and the current revision of every mandate the units name. Revisions are numbered from 1 in each organization and never change once written.

Publishing a draft makes it live. The previous live revision becomes `Superseded`, an organization in `Draft` becomes `Active`, and each pinned mandate revision becomes its mandate's current revision again if something else replaced it in the meantime. A mandate that was still `Draft` becomes `Active`, and an active one wakes under the restored revision with its interval reset. Publishing a revision that is already published answers 409 `RevisionPublished`; a revision of another organization answers 409 `RevisionMismatch`.

`POST .../rollback` returns to an earlier live revision: the one you name in `revisionId`, or by default the one that was live most recently before the current one. Garrison writes a new revision that copies the earlier snapshot, with `rollbackOfRevisionId` pointing at it, publishes the copy, restores its pinned mandate revisions, and replaces the working tree with the earlier units. Revision numbers only grow, so rolling revision 3 back to revision 1 produces revision 4. A revision that was never live answers 409 `RevisionNeverPublished`, the live revision answers `AlreadyLive`, and an organization with nothing earlier answers `NothingToRollBack`.

Organizations have no environments of their own (AA-062). Every publish writes a [promotion record](REVISIONS.md#promotion) with subject `Organization`, `kind` `Promote`, source environment `draft`, and target environment `live`, carrying `organizationId` and `orgRevisionId`. A rollback writes a record of kind `Rollback` from `live` to `live` and marks the publish record of the revision it replaced as `RolledBack`. The records appear in `GET .../promotions` beside agent and app promotions. To undo an organization change, use the organization's rollback route; the promotions rollback route repins deployments and does not touch the organization.

## The chain of command

Every feature below asks the same questions of the live revision (AA-065):

- A member's manager is its unit's lead. When the unit has no lead, it is the nearest lead above.
- A lead's manager is the nearest lead above its unit, skipping units without a lead.
- An agent with no lead above it answers to the board. In practice the board is a person: see [Escalations](#escalations).
- A lead's direct reports are the members of its unit, the leads directly below it, and the members of any unit below it that has no lead.
- An agent's chain is its manager, its manager's manager, and so on up to the CEO.
- A reporting line joins an agent and its manager. A peer line joins every agent of two units: leads and members, in either direction.

### A worked example

The organization `site-reliability` has four units:

| Unit | Parent | Lead | Members | Peer lines | Budgets |
|---|---|---|---|---|---|
| `reliability` | none | `reliability-lead` (CEO) | none | none | Day 50 USD |
| `dependencies` | `reliability` | `dependency-keeper` | `driver-auditor` | `latency` | Day 20 USD |
| `latency` | `reliability` | none | `latency-keeper`, `p95-watcher` | | |
| `capacity` | `reliability` | `capacity-keeper` | `disk-watcher` | | |

The chain of command works out like this:

| Agent | Manager | Direct reports | Chain |
|---|---|---|---|
| `reliability-lead` | The board | `dependency-keeper`, `capacity-keeper`, `latency-keeper`, `p95-watcher` | none |
| `dependency-keeper` | `reliability-lead` | `driver-auditor` | `reliability-lead` |
| `driver-auditor` | `dependency-keeper` | none | `dependency-keeper`, `reliability-lead` |
| `latency-keeper`, `p95-watcher` | `reliability-lead`, because `latency` has no lead | none | `reliability-lead` |
| `capacity-keeper` | `reliability-lead` | `disk-watcher` | `reliability-lead` |

`latency-keeper` may message `dependency-keeper` and `driver-auditor` along the peer line, and `reliability-lead` along its reporting line. It has no line to `p95-watcher`: sharing a unit makes two agents neither manager and report nor peers, so they reach each other through their manager or through an app edge. `driver-auditor` has no line to `reliability-lead` either, so a problem it finds travels up through `dependency-keeper`, or through a `Chain` report that both of them read. `capacity` has no peer lines, so `disk-watcher` writes only to `capacity-keeper`.

## What follows the chain

### Messaging

An agent may [message](MESSAGING.md#lines) its manager, its direct reports, and any agent in a unit joined to its own by a peer line, on top of app edges and replies. The other guards (frozen recipient, hop limit, thread budget, line rate) apply as before.

### Reports

A [report](REPORTS.md#who-reads-a-report)'s audience decides how far up it travels. `Manager` reaches the author's manager only. `Chain` and `Board` reach every lead in the author's chain. A manager always reads every report of its direct reports, whatever the audience; agents further up read only the `Chain` and `Board` ones. In the example, `driver-auditor`'s `Manager` report reaches `dependency-keeper`, and its `Chain` report reaches `reliability-lead` as well. Each report records the unit its author held when it was filed in `orgUnitId`, and `GET .../reports?unit=` filters on it. A keeper tick's report digest follows the same rules.

### Memory

The `OrgUnit` and `Organization` [memory scopes](AGENT_MEMORY.md#who-may-use-which-scope) follow the tree (AA-066). A run reads and writes its own unit's `OrgUnit` scope and reads the unit scopes above it. A lead also reads the unit scopes of its subtree. Every member reads the `Organization` scope, and only the CEO writes it. Nobody writes upward or sideways. In the example, `driver-auditor` writes `dependencies` and reads `reliability`; `reliability-lead` reads all four unit scopes, writes `reliability` and the organization scope, and cannot write `latency`.

### Escalations

`garrison_escalate` with `targetKind: "Manager"` goes to the raising agent's manager, as an urgent message like any escalation to an agent. Above the root it goes to the board, which Garrison asks through a person: the user the raising keeper runs as, or else the user who started the raising run. The stored escalation names whoever was chosen, with `targetKind` `Agent` or `User`. An agent with no position in a live organization, or a board with no person behind the run, is refused with 409 `ManagerUnavailable`.

A timeout with `EscalateUp` climbs the same chain. When the current target is an agent that holds a position, the next escalation goes to that agent's manager, and from the CEO to the board's person. Otherwise it goes to the keeper's default target, as described in [ESCALATIONS.md](ESCALATIONS.md#timeouts). In the example, an unanswered question from `driver-auditor` passes from `dependency-keeper` to `reliability-lead` to a person.

### Freezes

A [freeze](BRAKES.md#freezes) with `targetKind` `OrgUnit` stops every lead and member of the unit's subtree in the live revision, as if each agent were frozen. `Organization` stops every agent in the live revision and sets the organization's status to `Frozen` until the freeze is lifted. Both take an identifier or a name. Publishing, rolling back, or deleting an organization drops the freeze cache on every replica, so a freeze follows agents as they move between units.

### Budgets

A unit budget caps the known cost of every run by the agents in the unit's subtree, leads and members, over the UTC day or the UTC calendar month (AA-063). Spend comes from the usage ledger and follows the current structure: an agent that moves to another unit takes its spend for the window with it. Runs whose cost is unknown count as 0.

When a run is created, Garrison checks the agent's own unit and every unit above it, in every live organization the agent belongs to. If any of those subtrees has spent its budget, the run is refused with 409 `BudgetExhausted`, and the message names the unit, what it spent, and when the window resets. A keeper whose agent sits in a capped subtree skips its wakes: each one is recorded as a `Skipped` tick with error code `BudgetExhausted`, and the schedule moves on by one interval.

The capped unit's manager hears about it: Garrison raises an `Urgent`, non-blocking escalation that asks whether to wait or have a person raise the budget, with `wait` as the default when it times out. The manager is the nearest lead above the capped unit, so in the example `reliability-lead` hears when `dependencies` reaches 20 USD. When the root itself is capped, the notice goes to the person behind the refused run or keeper. The notice is raised once per unit, period, and window on each replica.

Spend is cached for 15 seconds per subtree, so a run that finishes inside that window can push a subtree a little past its budget. To raise a budget, change it in the working tree and publish. A usage quota with scope `OrgUnit` cannot be created by hand (400, field `scope`); unit budgets live on the organization. `GET .../spend` reports every unit's spend against its budgets in the current windows.

The keeper budgets in [BRAKES.md](BRAKES.md#spend-caps) still apply. A keeper in a unit with room left still stops at its own daily cap.

## What members know

A run whose agent holds a position in a live organization learns its place from two tools, a system prompt fragment, and its capability descriptor.

| Tool | What it returns |
|---|---|
| `garrison_org_chart` | The live chart: units root first with their depth, lead, members, titles, one-line mandate summaries, child units, peer lines, and budgets |
| `garrison_org_whoami` | The agent's own unit and title, whether it leads, its manager (or `managerIsBoard`), its direct reports, and its peer units |

Runs see these tools only while their agent holds a position; otherwise the tools are hidden and a call answers `NotAMember`. An agent in several organizations passes `organization` to pick one. People with Read on Organization may call both: the chart with `organization`, and whoami with `agent`. A mandate summary is the first line of the mandate's current objective, at most 200 characters. It is text people or agents wrote, so treat it as data.

Every such run also gets `builtin/org-context` appended to its system prompt, whatever system template its deployment uses. It names the organization and its mission, the agent's unit and title, its manager or the board, its direct reports, and its peer units, and points at the two tools. It is a `Fragment` with the prompt role `OrgContext`. A deployment binding for that role replaces it for one deployment, and a tenant `Fragment` template named `org-context` replaces it for the tenant. The template sees `org.name`, `org.mission`, `org.unitName`, `org.title`, `org.isLead`, `org.managerName`, `org.directReports`, `org.hasDirectReports`, `org.peerUnits`, and `org.hasPeerUnits`. See [PROMPTS.md](PROMPTS.md).

[Capability descriptors](CAPABILITIES.md) of kind `Agent` carry `org` for an agent with a position: the organization, unit, whether it leads, its title, and its mandate name and summary. An orchestrator can find who is responsible for latency without reading the chart.

Where an agent belongs to several organizations, `builtin/org-context`, the capability placement, a report's `orgUnitId`, and the `Manager` escalation target use the oldest of them. Lines, report visibility, memory, freezes, and budgets consider all of them.

## REST

| Route | What it does |
|---|---|
| `GET /organizations` | Organizations by name. `search`, `maxResults`, `skip` |
| `POST /organizations` | Create one (`name`, `description`, `mission`). It starts `Draft` with no units |
| `GET /organizations/{id}` | One organization, by identifier or name, with its working tree |
| `PUT /organizations/{id}` | Change the name, description, or mission, or set `status` to `Retired` or back to `Active` |
| `DELETE /organizations/{id}` | Delete it. See [Retention and deletion](#retention-and-deletion) |
| `GET, POST /organizations/{id}/units` | List the working tree, root first, or add a unit |
| `GET, PUT, DELETE /organizations/{id}/units/{unitId}` | Read, replace, or remove a unit of the working tree |
| `GET /organizations/{id}/chart` | The chart of the live revision, or of the working tree before the first publish |
| `GET, POST /organizations/{id}/revisions` | List revisions, newest first, or snapshot the working tree (`note`) |
| `GET /organizations/{id}/revisions/{revId}` | A revision with its snapshot and pinned mandates |
| `POST /organizations/{id}/revisions/{revId}/publish` | Make a draft live |
| `POST /organizations/{id}/rollback` | Return to an earlier live revision (`revisionId`, `note`) |
| `GET /organizations/{id}/spend` | Each unit's spend against its budgets in the current windows |

Paths are relative to `/v1.0/api/tenants/{tenantId}`. Another tenant's organizations answer 404. See [REST_API.md](../REST_API.md#organizations) for the models.

Building the example over REST takes one call per unit, parents and peers first, then a snapshot and a publish:

```bash
B=http://127.0.0.1:8700/v1.0/api/tenants/default
H=(-H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json")

ORG=$(curl -s -X POST $B/organizations "${H[@]}" -d '{"name": "site-reliability", "mission": "Keep the status page green without paging people at night."}' | jq -r .id)
curl -s -X POST $B/organizations/$ORG/units "${H[@]}" -d '{"name": "reliability", "leadAgentId": "reliability-lead", "leadTitle": "Head of reliability", "budgets": [{"period": "Day", "amountUsd": 50}]}'
curl -s -X POST $B/organizations/$ORG/units "${H[@]}" -d '{"name": "latency", "parentUnitId": "reliability", "members": [{"agentId": "latency-keeper"}, {"agentId": "p95-watcher"}]}'
curl -s -X POST $B/organizations/$ORG/units "${H[@]}" -d '{"name": "dependencies", "parentUnitId": "reliability", "leadAgentId": "dependency-keeper", "members": [{"agentId": "driver-auditor", "title": "Driver auditor"}], "peerLines": [{"peerUnitId": "latency"}], "budgets": [{"period": "Day", "amountUsd": 20}]}'
curl -s -X POST $B/organizations/$ORG/units "${H[@]}" -d '{"name": "capacity", "parentUnitId": "reliability", "leadAgentId": "capacity-keeper", "members": [{"agentId": "disk-watcher"}]}'

REV=$(curl -s -X POST $B/organizations/$ORG/revisions "${H[@]}" -d '{"note": "First structure"}' | jq -r .id)
curl -s -X POST $B/organizations/$ORG/revisions/$REV/publish "${H[@]}"
```

## MCP tools

People and API credentials manage organizations with management tools, which run tokens never see. Member runs get the two awareness tools above.

| Tool | Permission | Arguments |
|---|---|---|
| `garrison_list_organizations` | Read on Organization | optional `search`, `skip`, `maxResults` (1 to 100, default 25) |
| `garrison_get_organization` | Read on Organization | `organization` (identifier or name). Returns it with its working tree |
| `garrison_create_organization` | Create on Organization, and Update to pass `units` | `name`; optional `description`, `mission`, `units` |
| `garrison_update_organization` | Update on Organization | `organization`; optional `name`, `description`, `mission`, `status` (`Retired`, `Active`), `units` |
| `garrison_publish_org_revision` | Update on Organization | `organization`; optional `revisionId`, `note` |
| `garrison_rollback_organization` | Update on Organization | `organization`; optional `revisionId`, `note` |
| `garrison_org_chart` | Member runs; people need Read on Organization | Runs: optional `organization`. People: `organization` |
| `garrison_org_whoami` | Member runs; people need Read on Organization | Runs: optional `organization`. People: `agent`, optional `organization` |

`units` replaces the whole working tree in one step. Units may name their parents and peers in any order, and a unit whose name matches an existing unit keeps that unit's identifier, so its memory and reports stay attached. `garrison_publish_org_revision` without `revisionId` snapshots the working tree and publishes it in one call. Validation failures come back as tool errors with the codes in [Validation](#validation).

```json
{
  "name": "garrison_update_organization",
  "arguments": {
    "organization": "site-reliability",
    "units": [
      { "name": "reliability", "leadAgentId": "reliability-lead", "budgets": [{ "period": "Day", "amountUsd": 50 }] },
      { "name": "dependencies", "parentUnitId": "reliability", "leadAgentId": "dependency-keeper", "members": [{ "agentId": "driver-auditor" }], "peerLines": [{ "peerUnitId": "latency" }], "budgets": [{ "period": "Day", "amountUsd": 30 }] },
      { "name": "latency", "parentUnitId": "reliability", "members": [{ "agentId": "latency-keeper" }, { "agentId": "p95-watcher" }] },
      { "name": "capacity", "parentUnitId": "reliability", "leadAgentId": "capacity-keeper", "members": [{ "agentId": "disk-watcher" }] }
    ]
  }
}
```

That call raises the `dependencies` budget in the working tree only. Nothing changes for the running agents until `garrison_publish_org_revision`.

## Live updates

The `organization:{orgId}` WebSocket channel needs Read on Organization and sends:

| Event | When | Fields |
|---|---|---|
| `organization.subscribed` | On subscribe | `organization` |
| `org.changed` | The organization, its working tree, its revisions, or its status changed, including a freeze setting it `Frozen` | `organization`, or `organizationId` and `deleted: true` once it is deleted |
| `report.filed` | A report was filed by an agent in one of its units | `organizationId`, `report` |
| `spend.updated` | Spend against the live revision's budgets moved. Checked at most every 30 seconds | `organizationId`, `spend` (one `OrgUnitSpend` per unit and period) |

See [WEBSOCKETS_API.md](../WEBSOCKETS_API.md).

## Permissions

| Action | Permission | Built-in roles |
|---|---|---|
| List and read organizations, units, revisions, the chart, and spend; subscribe to the channel | Read on Organization | Viewer, Auditor, AgentOperator, AgentDeveloper, Editor, TenantAdmin |
| Create an organization | Create on Organization | AgentDeveloper, Editor, TenantAdmin |
| Change it, edit units, snapshot, publish, roll back | Update on Organization | AgentDeveloper, Editor, TenantAdmin |
| Delete an organization | Delete on Organization | Editor, TenantAdmin |

Run tokens never hold these permissions. A run cannot change the structure it sits in; it reads its own place through `garrison_org_chart` and `garrison_org_whoami`. Every change is written to the audit log against the organization.

## Telemetry

`garrison.org.budgets.exhausted` is a gauge of unit budgets this replica has seen exhausted in their current window, by period only. It carries no organization or unit identifiers. `garrison.spend.cap.hits` counts refused runs with the scopes `org_unit_day` and `org_unit_month`. Chart reads are `org chart` spans and admission checks are `org budget check` spans. The Autonomy dashboard has an Organizations row. See [TELEMETRY.md](TELEMETRY.md).

## Retention and deletion

Organizations are kept with their tenant until someone deletes them. Revisions are never pruned, so every structure an organization ever had stays readable, and any revision that was once live can be rolled back to.

Deleting an organization deletes its units, its revisions and their snapshots, the `OrgUnit` memory of every unit that ever appeared in it, and its `Organization` memory. It does not delete agents, mandates, apps, reports, or promotion records; reports keep their `orgUnitId`. Its agents lose their positions at once, so freezes and budgets on it stop applying. Retire an organization instead when you want to keep its history and memory but take it out of the chain of command.
