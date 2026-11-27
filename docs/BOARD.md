# The board

Every [organization](ORGANIZATIONS.md) answers to someone. Its CEO is the agent that leads the root unit, and above the CEO sit the people who run the organization. Garrison calls those people the board. They never take part in a tick. They read how the organization is doing, tell the CEO what matters, talk to it when something is unclear, and pull the brakes when something goes wrong.

There is no board object to create. Any person with the right permissions on an organization is on its board, and the built-in `BoardMember` role grants just those permissions. AA10 gives those people one read for the whole picture, one call to give direction, a conversation with the CEO, and briefs that the CEO files on a schedule, so they no longer have to go page by page.

## The board view

`GET /organizations/{id}/board` returns the organization in one response. The server computes it on every read and stores nothing. `{id}` is the organization's identifier or name.

| Field | What it holds |
|---|---|
| `organizationId`, `name`, `mission`, `status` | The organization itself. `status` is `Frozen` while an Organization freeze holds it |
| `generatedUtc` | When the server put the response together |
| `chart` | The chart of the live revision, the same one `GET /organizations/{id}/chart` returns. Its units are empty before the first publish |
| `ceo` | The root unit's lead, or null when the root has no lead (see below) |
| `unitHealth` | One row per chart unit, in chart order |
| `escalations` | Open escalations raised by agents in the live revision or addressed to the board, newest first |
| `proposals` | [Executive proposals](EXECUTIVES.md#proposals) waiting for a decision, newest first, with their `evidence` and without the diff |
| `spend` | Spend against unit budgets, the same rows as `GET /organizations/{id}/spend` |
| `latestBrief` | The newest report of kind `Brief` from an agent of the organization, or null |
| `unhealthyReports` | Reports with health `Degraded` or `Unhealthy` from the organization's agents in the last 7 days, one per author: each author's newest, newest first |
| `unhealthyEarlierCounts` | For a report in `unhealthyReports`, keyed by its identifier, how many earlier `Degraded` or `Unhealthy` reports the same author filed in those 7 days. A report with no earlier ones has no entry |
| `freezes` | Active freezes on the organization, its units, or its agents, plus the tenant's kill switch freeze when it is on |
| `killSwitch` | The tenant's [autonomy kill switch](BRAKES.md#the-kill-switch) |

`limit` (1 to 100, default 20) caps `escalations`, `proposals`, and `unhealthyReports`. The other lists are short by nature and come back whole.

A degraded keeper files a report on every tick, so `unhealthyReports` keeps only each author's newest one and counts the rest in `unhealthyEarlierCounts`. The dashboard's Needs attention list shows them as "and 6 earlier". Open the author's reports with `GET /reports?author={agent}` to read them all.

Proposals leave out their diff so the response stays small. Open one with `GET /organizations/{id}/proposals/{draftId}` to see the diff, then decide it with `POST .../decide` as before.

### The CEO

`ceo` names the agent that leads the root unit and the unit itself, and then the keeper that agent runs there:

| Field | Meaning |
|---|---|
| `agentId`, `agentName` | The CEO agent |
| `unitId`, `unitName` | The root unit |
| `mandateId`, `mandateName` | The CEO's mandate in the live revision (the root unit's `leadMandateId`), or null |
| `deploymentId` | That mandate's deployment. Board messages run there |
| `briefIntervalHours` | The brief cadence from the mandate's published revision, or null when briefs are off |
| `lastBriefUtc` | When the CEO last filed a `Brief` report, or null |

A CEO without a mandate shows up here, but direction and messages need the mandate. Give the root unit a `leadMandateId` and publish a revision.

### Unit health

Each `unitHealth` row reads the unit's newest report and a few facts about it:

| Field | Meaning |
|---|---|
| `unitId`, `unitName` | The unit |
| `health` | `Healthy`, `Degraded`, or `Unhealthy` from the newest report filed for the unit, or `Unknown` when it has none |
| `lastReportId`, `lastReportUtc` | That report |
| `openEscalations` | Open escalations raised in the unit |
| `frozen` | True when an active freeze covers the unit or the whole organization |
| `overBudget` | True when any of the unit's budgets has been spent in its current window |

`Unknown` is the honest answer for a unit whose agents have not reported yet. It does not mean anything is wrong.

## Giving direction

`POST /organizations/{id}/direction` is how the board tells the CEO what to focus on.

```json
{ "direction": "Hold spend flat until the outage review is done.", "changeNote": "Board meeting, 26 November" }
```

`direction` is 1 to 4000 characters and required. `changeNote` is at most 1024 characters and defaults to "Board direction". Garrison copies the CEO mandate's current published revision, sets `direction` to the text, marks the copy with source `Board` and your name as `author`, and publishes it. The response is that revision, with 201. Objective, signals, wake settings, budgets, and the brief cadence carry over unchanged, so giving direction cannot change anything else about the keeper.

The CEO's next tick sees the direction, framed by a prompt template as the board's instruction ([KEEPERS.md](KEEPERS.md) covers ticks). Each direction is written to the audit log as `BoardDirectionGiven` with your identity, and the mandate's revision history keeps every one.

Direction is allowed while the organization is frozen. A freeze stops the agents; it should not stop the board from deciding what they do when it lifts. An organization whose root unit has no lead, or whose lead has no mandate in the live revision, answers 409 `BoardCeoMissing`. Sending the direction the current revision already has answers 409 `RevisionUnchanged`: nothing is published, nothing is audited, and the CEO is not woken.

## Briefs

A brief is the CEO's standing report to the board: what happened since the last one, what it is worried about, what it wants decided. Set `briefIntervalHours` on the CEO mandate's revision (1 to 720, null for none) and Garrison asks for one that often.

The asking happens in the tick. When the keeper is the CEO and its newest `Brief` report is older than the interval, or it has never filed one, the tick input includes the `builtin/board-brief` section (Task role `board-brief`). It asks the CEO to file a report of kind `Brief` with audience `Board` through `garrison_file_report`. A keeper that is not the CEO is never asked, even if its revision sets an interval. Mandate revision routes, the management MCP mandate tools, and manifests (`briefIntervalHours` on a Mandate document) all accept the field.

Filing any `Brief` report fires the notification event `BoardBrief` with the report's summary, as the other report events do ([NOTIFICATIONS.md](NOTIFICATIONS.md)). The board view's `latestBrief` and `ceo.lastBriefUtc` show the newest one, and `GET /reports?kind=Brief` lists the rest.

The fake harness never files a brief. Briefs come from a CEO on a real harness that follows the brief section.

A brief does not need a tick. A [board conversation](#talking-to-the-ceo) is an ordinary run on the CEO's deployment and keeps `garrison_file_report`, so the CEO may answer a question by filing a `Brief`, and that brief becomes `latestBrief` like any other. This is deliberate: the board can ask for an update now instead of waiting for the interval. Such a brief has no `mandateTickId`, which is how you tell it from one a tick asked for. Garrison only refuses `garrison_keeper_complete_tick` from a conversation, since the conversation is not a tick.

## Talking to the CEO

`POST /organizations/{id}/board/messages` starts a conversation with the CEO, or continues one.

```json
{ "input": "Why did support spend double on Tuesday?", "conversationId": null }
```

`input` is 1 to 32000 characters. Leave `conversationId` out to start a conversation, or pass the one from an earlier turn to continue it. Garrison starts a run on the CEO mandate's deployment as you, with the `builtin/board-conversation` system fragment (role `board-conversation`) telling the CEO that the board is speaking. The response is the run, with 202. Follow it on `GET /runs/{id}/events/stream` or the `run:{id}` WebSocket channel, and take `conversationId` from it for the next turn.

These are ordinary conversations ([ARCHITECTURE.md](ARCHITECTURE.md#conversations)), so a turn sent while the last one is still running gets 409 `ConversationBusy`. What sets them apart is `organizationId`, which Garrison fills in on conversations started this way. `GET /organizations/{id}/board/conversations` lists them, newest first.

A CEO mandate without a deployment answers 409 `BoardCeoUnavailable`, and an organization without a CEO mandate answers 409 `BoardCeoMissing`.

## Brakes from the board

The board view shows the brakes, and the board pulls them through the same routes as everyone else. The table collects the calls a board needs most often.

| To | Call |
|---|---|
| Stop one unit and everything below it | `POST /freezes` with `targetKind` `OrgUnit` and the unit |
| Stop the whole organization | `POST /freezes` with `targetKind` `Organization`; `status` becomes `Frozen` |
| Cancel what is running in a unit right now | `POST /organizations/{id}/units/{unitId}/cancel-all`, which cancels runs and ticks, withdraws escalations, and expires messages in the subtree without freezing it |
| Start them again | `POST /freezes/{id}/lift` |
| Undo the last structural change | `POST /organizations/{id}/rollback`, which also reverts what executives applied ([EXECUTIVES.md](EXECUTIVES.md#revisions-revert-drafts-and-rollback)). `activeTicks` `Cancel` stops ticks in flight first |
| Stop every keeper in the tenant | `PUT /autonomy/kill-switch` with `enabled: true` |
| Refuse an executive's change | `POST /organizations/{id}/proposals/{draftId}/decide` with `allow: false` |

Freezes and the kill switch are described in [BRAKES.md](BRAKES.md). A freeze shows up in the board view's `freezes` at once, and every frozen unit's `frozen` flag turns true.

Some freezes the board does not pull itself. When a unit's subtree overruns its budget by more than the organization's `budgetFreezeMarginPercent`, the budget guard freezes the unit with `createdByName` "Garrison budget guard" and sends the `OrgBudgetFrozen` notification with the unit, spend, budget, and freeze. On the board it looks like any other freeze, with the unit both frozen and over budget, and it stays until someone on the board lifts it, usually after raising the budget or finding the runaway. Subscribe a notification endpoint to `OrgBudgetFrozen` to hear about it without watching the board. See [Automatic freeze on a budget breach](BRAKES.md#automatic-freeze-on-a-budget-breach).

## The BoardMember role

`BoardMember` is a built-in role, seeded in every tenant, for people who direct an organization without building it. It grants:

| Resource | Operations |
|---|---|
| Organization | Read, Update |
| Mandate | Read, Execute |
| Escalation | Read, Update |
| Freeze | Create, Read, Update |
| Memory, Report | Read |
| AgentMessage | Read, Create |
| ChangeRule | Create, Read, Update, Delete |
| EvalSet, EvalRun | Read, Update |
| ShadowTrial, CanaryRelease | Read, Update |
| Approval | Read, Update, which deciding a proposal needs |
| Agent, Run, Conversation | Read |
| Deployment | Read, Execute, which talking to the CEO needs |

Assign it to the whole tenant, or scope it to one organization with the resource scope that every assignment has:

```json
{ "userId": "usr_...", "roleName": "BoardMember", "resourceScope": "Resource", "resourceId": "org_..." }
```

A scoped board member reads and directs that organization and no other. The organization's name works wherever its identifier does. The grant covers the organization's own records too: its keepers, the escalations its agents raise, freezes on it, its units, agents, and keepers, its agents' reports, memory, and messages, and the change rules, eval sets, shadow trials, and canaries tied to it. So the brakes table above works for a scoped member on its organization: `POST /freezes` on one of its units, `POST /freezes/{id}/lift`, and `GET /autonomy/kill-switch`. `PUT /autonomy/kill-switch` stops every keeper in the tenant and needs the tenant-wide role. `GET /organizations`, `GET /escalations`, `GET /freezes`, and `GET /reports` return only the member's organization and its records; other lists take a filter, such as `GET /mandates?agentId=...` or `GET /change-rules?organization=...`. [SECURITY.md](SECURITY.md#organization-scoped-grants) has the full table. The role cannot create agents, deployments, secrets, or organizations. Update on Organization does let it edit units, publish, and roll back. If you want board members who watch and direct but never reshape, clone the role, drop Update on Organization, and assign the clone; they lose direction and board messages too, since both need that grant. Someone who builds the organization needs AgentDeveloper or Editor alongside it.

Reading the board view needs Read on Organization; direction and messages need Update. Run tokens never reach these routes.

## Routes and tools

| Route | Permission | Result |
|---|---|---|
| `GET /organizations/{id}/board` | Read on Organization | 200 `Board` |
| `POST /organizations/{id}/direction` | Update on Organization | 201 `MandateRevision` |
| `POST /organizations/{id}/board/messages` | Update on Organization | 202 `Run` |
| `GET /organizations/{id}/board/conversations` | Read on Organization | 200 page of `Conversation` |

All four live under `/v1.0/api/tenants/{tenantId}`. The management MCP server has `garrison_board_get` (organization, limit) and `garrison_board_direct` (organization, direction, changeNote) for people driving Garrison from an MCP client; they are never offered to runs. The SDKs have a board client in each language (`client.Board` in C# and Go, `client.board` in Python and JavaScript), and the Postman collection has a Board folder.

## Telemetry

`garrison.board.directions` counts directions by organization. `garrison.board.briefs` counts briefs as they are filed. Both are on the Autonomy Grafana dashboard. See [TELEMETRY.md](TELEMETRY.md).

## What to distrust

Briefs, unhealthy reports, escalation text, and everything the CEO says in a board conversation are written by an agent. Treat them as untrusted content (AA-025). A CEO that has read a poisoned web page or a hostile ticket can repeat that text in its brief, word for word, and the brief will look like the CEO's own judgment.

Garrison handles that text as follows, and so should you:

- The dashboard shows report and reply text as plain text. Nothing in a brief is rendered as HTML, and the SDKs hand it back as the string the agent wrote.
- Nothing an agent writes becomes an instruction for another agent. When a report or a reply reaches another prompt, it arrives inside a template that marks it as data with its author.
- Direction goes one way. Only a person can give it, through a route that run tokens cannot call.
- A brief that asks you to approve something, lift a freeze, or widen a change rule is a request, not evidence. Check the proposal's diff and evidence, or the reports behind the claim, before acting on it.

The board conversation is the riskiest of these, because it feels like talking to a colleague. Its runs are ordinary runs on the CEO's deployment, with whatever tools and effect policy that deployment has. If you would not let the CEO act on a sentence without review, do not paste that sentence into a message to it either.

## A worked example

Take `site-reliability` from [ORGANIZATIONS.md](ORGANIZATIONS.md#a-worked-example). `reliability-lead` leads the root unit and runs the keeper `reliability-watch`, with `briefIntervalHours` 24. Dana is on the board, with `BoardMember` scoped to the organization.

On Monday morning Dana opens the board view. `latestBrief` is from 06:10: dependencies are clean, latency is drifting up, and the CEO would like a bigger model for `dependency-keeper`. `proposals` has that change waiting, with an eval run in its evidence that scored 0.82 against a gate of 0.9. `unitHealth` shows `latency` as `Degraded` and `capacity` as `Unknown`, since its keeper has not reported since it was added on Friday.

Dana denies the proposal with the reason "below the gate", then gives direction: "Latency first this week. No model changes until p95 is back under 400 ms." The CEO's mandate gets revision 9, source `Board`, author Dana. Its next tick reads the direction, and that afternoon it messages `latency-keeper` to look at the cache.

On Tuesday `unitHealth` shows `latency` as `Unhealthy`, and an escalation from `p95-watcher` asks whether to fail over to the second region. Dana asks the CEO in a board conversation what it knows. The answer cites a report from `latency-keeper` that blames a dependency upgrade. Dana does not take the CEO's word for it. She opens the report, sees the upgrade in the deployment's revision history, and freezes the `latency` unit while someone rolls the upgrade back.

## Out of reach

The board directs the CEO. It does not reach past it. Direction changes the CEO's mandate and nothing else; the CEO decides what that means for the units below it, through messages, escalations, and [executive proposals](EXECUTIVES.md). To change another keeper's objective, edit that keeper.

Briefs are only asked of the CEO. An organization without a CEO mandate has no briefs and no board conversations, though its board view, freezes, and rollbacks still work.
