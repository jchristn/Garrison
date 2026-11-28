# Activity trails

An activity trail shows what happened to a request: where the work started, every agent and record it reached, and the answer that went back. `GET /v1.0/api/tenants/{tenantId}/runs/{id}/trail` and the management MCP tool `garrison_get_run_trail` build one for any run. The full guide to reading a trail is still to be written (LEARNABILITY_PLAN.md task LP1.11). This page records what the trail is built from.

## Lineage inventory

Garrison has no table of "hops". The trail is stitched together from link fields that each record already carries. The table below lists every way a run starts, the fields that tie the run to its cause, and whether the answer to the caller is recorded anywhere. Each row was checked against the code on 2026-11-27 (LP1.1).

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

These links do not exist as structured fields today. The trail works without them, and none was added in LP1.2, which only adds indexes (schema migration 61).

- **The reply leg is never recorded on its own.** No path stores "the answer went back to the caller" as a record. The trail draws a `Reply` node from the root run's terminal state when the origin is a person or API caller who started the run directly. For A2A that means the trail ends at the run's terminal state whether or not the client ever fetched the result.
- **Non-blocking escalation answers.** The answer reaches the raising agent through its next keeper tick (`DeliveredTickId`), which is a different trail. The trail shows the escalation as answered but has no edge into that later tick.
- **Shadow copies** do not record the live run they copy, except inside their idempotency key as text. A shadow run's trail starts at the person who started the trial.
- **Which surface a request came in on** (REST, MCP, A2A, app) is used for metrics but not stored on the run, so a Caller node cannot say how the caller connected.
- **Unit names** come from the organization revision that is live now, not the one in force when each step ran, because the chain of command reads only live revisions.
