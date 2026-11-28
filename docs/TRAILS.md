# Activity trails

An activity trail answers the question an operator asks most often about an autonomous organization: what happened to this request? It shows where the work started, every agent and record it reached on the way, and the answer that went back. Ask for the trail of any run in the chain and you get the same picture, with the run you asked about marked.

You can read a trail in three places:

- the **Trail** tab on a run's detail page in the dashboard;
- `GET /v1.0/api/tenants/{tenantId}/runs/{id}/trail` (see [REST_API.md](../REST_API.md));
- the management MCP tool `garrison_get_run_trail` (see [MCP_API.md](../MCP_API.md)).

The SDKs wrap the route as `GetRunTrailAsync` (C#), `get_run_trail` (Python), `getRunTrail` (JavaScript), and `GetRunTrail` (Go).

## What a trail shows

Garrison keeps no table of hops. Each record already carries the fields that link it to its cause: a child run names its parent, a retry names the run it retries, a message names the run that sent it and the run it woke, a report names the run that filed it. The server stitches those links together on each request. Nothing extra is written when a run starts, so a trail costs nothing until someone asks for one, and an old run's trail is as complete as its records still are.

A trail is a list of **nodes** and a list of **edges**. A node is one step: the caller, a trigger, a keeper tick, a pipeline run, a run, a message, a report, an escalation, an approval, a fan-out group, an effect journal entry, or the reply. An edge links two steps from cause to effect and says how: `Started`, `Spawned`, `FannedOut`, `Retried`, `Sent`, `Woke`, `Delivered`, `Filed`, `Raised`, `Routed`, `Answered`, `Requested`, `Decided`, `Performed`, or `Replied`. Every node also has a `lane`. Steps on the caller's side share the `caller` lane, and everything an agent did sits in that agent's lane, which is how the dashboard draws one column per agent.

Run nodes carry what you need to judge a step at a glance: the agent and its unit, the deployment, the status, start and end times, duration, tokens, cost, and the run kind, so a `Shadow` or `Eval` run is easy to spot. Effect nodes carry the tool name of a state-changing Garrison tool call. Message, report, escalation, and approval nodes carry their status and time.

The Caller node also says how the request came in, in `entrySurface`: `Rest`, `Mcp`, `A2a`, or `App`. The same field is on every run that starts a leg of the work (a run with no parent that is not a retry), so a run woken by a message says `Message`, a trigger's run says `Trigger`, and a keeper tick's run says `Keeper`. Escalations routed to an agent, eval cases, and shadow copies have their own values, and a pipeline stage is `Internal` because the pipeline run is its origin. Child runs and retries leave the field out and follow their parent. The dashboard calls the same REST API as any client, with the same credentials, so nothing tells its requests apart: they are recorded as `Rest`, and `Dashboard` is reserved. The playground is `Rest` for the same reason. Runs created before schema version 62 have no entry surface.

The walk starts at the focus run, goes back to the origin, then goes forward breadth first through every child run, fan-out group, retry, message and the run it woke, report, escalation, approval, and effect. A record is shown once even when two paths reach it, so a pair of agents that keep writing to each other shows each message once and stops at the hop cap instead of looping.

## Where a trail starts

The origin is found by walking back from the focus run. At each run the server asks, in this order:

1. Does the run have a parent or is it a retry? Then step back to that run.
2. Is it a pipeline stage? The pipeline run is the origin, and every top-level stage run hangs off it.
3. Did a keeper tick start it? The tick is the origin.
4. Did a trigger fire it? The trigger is the origin.
5. Did a message wake it? Step back to the run that sent the message. If a person sent the message, that person is the origin, and the trail shows their message as the first step.
6. Was an escalation routed to it? Step back to the run that raised the escalation.
7. Otherwise the run's caller (a user, an API credential, or the administrator) is the origin.

Parents and retries come first, so a child run started by a pipeline stage walks back to the stage, and the stage then leads to the pipeline run. The walk also stops when it comes back to a run it has already seen, or when it has stepped back across more messages than `RunTrail.MaxMessageHops` allows. In both cases the oldest run it reached becomes the origin and the trail is marked `HopCap`.

A trail ends with a `Reply` node only when a person or API caller started the first run directly and that run has finished. Garrison does not record the moment an answer reaches the caller, so the `Reply` node stands for the run's terminal state. For an A2A client that polls its task, the trail ends at the run whether or not the client has fetched the result yet. Work that started from a trigger, a keeper tick, or a pipeline has nobody waiting, so it has no reply node.

## Caps and settings

A busy organization can produce trails of thousands of steps, and a trail is built while you wait. Four cluster settings bound the work. Change them on the Settings page or through the settings API; every replica uses the new value on its next trail.

| Setting | Default | Range | What it limits |
|---|---|---|---|
| `RunTrail.MaxNodes` | 500 | 10 to 5000 | Steps in one trail. Reaching it stops the walk with `truncation: NodeCap` |
| `RunTrail.MaxMessageHops` | 12 | 0 to 50 | Message hops followed, back to the origin and forward from it. 0 follows no message. Reaching it sets `HopCap` |
| `RunTrail.MaxSpanHours` | 72 | 1 to 720 | Hours after the origin a step may start and still be shown. Later steps are left out with `SpanCap` |
| `RunTrail.IncludeEffects` | true | | Whether `Effect` nodes are included when the request does not say. `includeEffects` on the route or tool overrides it |

A truncated trail still holds every step found before the cap, and `truncation` names the first cap it hit. The dashboard shows a banner naming the cap with a link to the setting. Raising a cap is the right fix when an organization's normal work is deeper than the default; a trail that only hits `HopCap` because two agents are stuck messaging each other is telling you about the loop, not about the cap.

`hopCount` is the most message hops between the origin and any run in the trail. A plain invoke has 0, and an agent that messages a second agent, which messages a third, has 2. The build is counted in `garrison.run_trail.requests` (by outcome) and timed in `garrison.run_trail.build` (by truncation); see [TELEMETRY.md](TELEMETRY.md).

## Who can see what

Reading a trail needs Read on the focus run. That is the only check that can refuse the whole request, and a run in another tenant answers 404 as every tenant resource does.

Every other step is checked against your Read permission for its own kind: `AgentMessage` for a message, `Report`, `Escalation`, `Approval`, `FanOutGroup`, `PipelineRun`, `Mandate` for a keeper tick, `Trigger`, and `Run` for runs, effects, and the reply. A step you may not read is replaced by a `Redacted` placeholder with an identifier of its own (`red_1`, `red_2`, ...), its time, its lane, and `redactedKind`, the kind of step it hides. Its links stay, so you can see that the triage agent asked for an approval at 10:02 without learning which approval it was. A role scoped to one organization therefore sees its own part of a chain in full and the rest as placeholders.

Run tokens cannot read trails at all. The route answers 403 `RunTokenTrailNotAllowed` before it reads anything, and the MCP tool is a management tool, so runs do not see it in `tools/list` and get `Forbidden` if they call it. A trail is a map of the organization's traffic: who talked to whom, how often, and what it cost. An agent that could read it could learn about parts of the organization its position does not cover, and could use what it learned to steer its own work around the brakes. People read trails; agents use the chain of command.

## Why agent text is left out

A trail carries identifiers, kinds, states, times, names, tokens, and cost. It never carries text an agent wrote: no message subjects or bodies, report text, escalation questions or answers, tool arguments, or run output.

There are two reasons. Agent-written text is untrusted (AA-025). It reaches a prompt only through its own template, framed as data with its provenance, and it reaches a person only in a view that shows who wrote it. Copying it into a trail would make the trail a second, unframed path for that text, and a trail is exactly what an operator pastes into a chat with another model while debugging. The second reason is size: a trail of 500 steps with every message body in it would be slow to build and slower to read.

When you need the words, open the step. The dashboard's step drawer loads the record from its own detail route and shows the text inside a marked block with its source line ("written by agent Triage in run run_b2"). Over REST and MCP, read the message, report, or escalation with its own route or tool.

## Reading a trail in the dashboard

Open a run and choose the **Trail** tab, or use **Open trail** from a run row, a conversation turn, a message thread, an escalation, an approval, a report, a keeper tick, or an item on the board. Each of those opens the trail of the right run with that step selected. The URL has the form `/runs/{id}?tab=trail&step={nodeId}`, so a link to a step can be shared.

The tab has a summary strip (agents, hops, duration, tokens, cost, and failures), the truncation banner when a cap was hit, an **Export JSON** button that saves the trail exactly as the server returned it, and three views:

- **Sequence**, the default: one lane per agent with the caller on the left, steps in time order, and arrows labelled with the edge kind. Long idle gaps are collapsed. The focus run is highlighted and scrolled into view, and redacted steps are drawn as hatched boxes. Arrow keys move between steps and Enter opens the drawer. The view mirrors in right-to-left languages.
- **Graph**: the same steps laid out in time layers as a node graph, with a minimap once the trail passes 25 nodes. It is easier to read than the sequence view when one run fans out widely.
- **List**: a table with columns you can choose, filters for kind, agent, and state, and a saved page size. It is the only view on screens narrower than 768 pixels.

Clicking a step in any view opens the step drawer, which loads the record, shows its fields and any text with provenance, and links to the record's own page with a Copy ID button. While any run in the trail is still going, the tab refreshes every 5 seconds; it stops once every run has finished.

## Checking an organization before you publish

The trail tells you what an organization did. The organization validate route tells you whether a tree you are building will publish at all, before you take a revision.

`POST /v1.0/api/tenants/{tenantId}/organizations/{id}/validate` checks the working tree the way publishing would and writes nothing. It needs Read on Organization. The answer is `{ valid, problems }`, where each problem has a `code`, a `severity`, the `unitId`, `agentId`, or `mandateId` it is about, and a `message` that says what to change. An `Error` is something publishing refuses: no root or two roots, a cycle, a unit whose parent is gone, a duplicate unit name, an agent holding two positions, an inactive agent, a broken peer line, a budget above its parent's or invalid, or a tree over a size limit. A `Warning` publishes but leaves a gap you probably did not intend: a unit with no lead (`UnitWithoutLead`), a mandate that no longer exists or belongs to another agent (`MandateMismatch`), or a keeper mandate whose deployment is missing or inactive, so its ticks would never start (`KeeperDeploymentMissing`). `valid` is true when nothing is an `Error`.

The dashboard's organization designer uses the same route to list problems while you edit. The SDKs have `ValidateOrganizationAsync`, `validate_organization`, `validateOrganization`, and `ValidateOrganization`. The full list of codes is in [REST_API.md](../REST_API.md); the publish-time rules behind them are in [ORGANIZATIONS.md](ORGANIZATIONS.md#validation).

## Lineage inventory

The table below lists every way a run starts, the fields that tie the run to its cause, and whether the answer to the caller is recorded anywhere. Each row was checked against the code on 2026-11-27 (LP1.1).

| Start path | Where it starts | Fields that link the run to its cause | Trail origin | Reply to the caller recorded? |
|---|---|---|---|---|
| REST invoke | `AgentInvoker` through `RunRoutes` | `CallerType`, `CallerId`, `CallerName`; `Kind` `Invoke` | Caller | No. The HTTP response is the reply. The trail shows a `Reply` node built from the run's terminal state |
| A2A `SendMessage` | `A2ARoutes` | `CallerType`, `CallerId`, `CallerName`, `ConversationId` (the A2A `contextId`); the A2A task identifier is the run identifier | Caller | No. A caller that polls the task, or reads a stream, gets the answer from the run itself. The `Reply` node is built from the run's terminal state |
| MCP `garrison_invoke_agent` or `garrison_start_run` by a person | `GarrisonMcpServer` | `CallerType`, `CallerId`, `CallerName` | Caller | No, as for REST |
| Conversation turn (REST, app, playground) | `ConversationService`, `AppGatewayService`, `PlaygroundService` | `ConversationId`, `ConversationTurn`, caller fields; `Kind` `Playground` for the playground | Caller | No. Earlier turns are not linked to later ones as cause and effect; each turn is its own trail |
| Board direction | `BoardService` | caller fields, `ConversationId` of the board conversation | Caller | No |
| Trigger fire (cron, webhook, manual) | `TriggerService` | `TriggerId`, `Kind` `Trigger`; `CallerName` is `trigger:<name>`; the fire record holds `RunId` | Trigger | Not applicable: nobody waits |
| Keeper tick | `KeeperScheduler` | `MandateId`, `MandateTickId`, `Kind` `Keeper`; the tick holds `RunId` | KeeperTick | Not applicable |
| Message wake | `MessageService` | `Kind` `Message`; each delivered message holds `DeliveredRunId` and `WokeRecipient`, and its `SenderRunId` names the run that sent it (null when a person sent it). `CallerName` is `message:<id>` | Walks back through `SenderRunId` to the sender's origin; a person who sent the message is the Caller | Not applicable |
| Message read by a running run | `garrison_read_inbox` | the message's `DeliveredRunId` with `WokeRecipient` false | The run keeps its own origin; the trail shows a `Delivered` edge and does not follow it | Not applicable |
| Escalation to an agent | `EscalationService.RouteCoreAsync` | an urgent message with `EscalationId` and `SenderRunId` = the raising run, delivered as a message wake; the escalation holds `RoutedRunId`. Without messaging, a run with `CallerName` `escalation:<id>` and the escalation's `RoutedRunId` | Walks back through the message, or through `RoutedRunId` to `RaisingRunId` | Not applicable |
| Escalation answer | `EscalationService.AfterResolvedAsync` | Blocking: the raising run (its `EscalationId`) resumes; no new run. Non-blocking: the answer goes into the next keeper tick's input (`DeliveredTickId`) | Blocking: an `Answered` edge back to the raising run. Non-blocking: not linked in the trail yet (see gaps) | Not applicable |
| Child run (`garrison_invoke_agent` from a run) | `AgentInvoker` | `ParentRunId`, `RootRunId`, `Depth`, `CallChain`; `Kind` `Delegated`; the parent's `ChildWaitRequest` | Walks back through `ParentRunId` | The child's result goes back to the parent as the tool result; it is the child's own record |
| Fan-out member | `FanOutService` | `ParentRunId`, `RootRunId`, `FanOutGroupId`; the group holds `ParentRunId` and each member's `ChildRunId` | Walks back through `ParentRunId` | The parent reads results with `garrison_gather` |
| Retry | `RunService.RetryAsync` | `RetryOfRunId`, `Kind` `Retry`, `Attempt` | Walks back through `RetryOfRunId` | As for the original run |
| Pipeline stage | `PipelineService` | `PipelineRunId`, `PipelinePosition`, `PipelineExecution`; `Kind` `Pipeline` | PipelineRun | The pipeline run's own status |
| Eval case | `EvalRunner` | `EvalRunId`, `Kind` `Eval`; the case's `SourceRunId` when it came from a real run | Caller (the person or scheduler that started the eval run) | Not applicable |
| Shadow copy | `ShadowTrialService` | `ShadowTrialId`, `Kind` `Shadow`; the caller is the person who started the trial | Caller | Not applicable |
| Canary step | `CanaryService` | none on the run: a canary changes deployment weights, and a run that lands on the candidate is an ordinary invoke with that `DeploymentId` | As for the start path that sent it | As for that path |

Records that hang off a run, rather than start one:

| Record | Link to the run | Shown as |
|---|---|---|
| Report | `RunId` | `Filed` edge |
| Escalation | `RaisingRunId`, `RoutedRunId` | `Raised` and `Routed` edges, and `Answered` for a blocking escalation that was answered |
| Approval | `RunId`, `RootRunId` | `Requested` edge, and `Decided` once decided |
| Effect journal entry | `RunId` | `Performed` edge, with the tool name and never its arguments |
| Fan-out group | `ParentRunId` | `FannedOut` edge, then `Spawned` to each member |

## Gaps found

These links did not exist as structured fields when LP1.1 checked the code. LP1.2 added only indexes (schema migration 61); the entry surface came later (schema migration 62).

- **The reply leg is never recorded on its own.** No path stores "the answer went back to the caller" as a record. The trail draws a `Reply` node from the root run's terminal state when the origin is a person or API caller who started the run directly. For A2A that means the trail ends at the run's terminal state whether or not the client ever fetched the result.
- **Non-blocking escalation answers.** The answer reaches the raising agent through its next keeper tick (`DeliveredTickId`), which is a different trail. The trail shows the escalation as answered but has no edge into that later tick.
- **Shadow copies** do not record the live run they copy, except inside their idempotency key as text. A shadow run's trail starts at the person who started the trial.
- **Which surface a request came in on** was used for metrics but not stored. It is now the run's `entrySurface` (LP1.12, migration 62), shown on the Caller node.
- **Unit names** come from the organization revision that is live now, not the one in force when each step ran, because the chain of command reads only live revisions.
