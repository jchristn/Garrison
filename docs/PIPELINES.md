# Pipelines

A pipeline runs several agents in a fixed order on one request. The first stage works on the caller's input, the second sees the first stage's result, and so on to the last stage, whose result is the pipeline's result. Any stage can stop and wait for a person to approve its output, ask for changes, or reject it before the next stage starts.

The typical use is a chain where each step needs a different agent: a researcher collects material, a writer drafts from it, an editor tightens the draft. You could script that with three invokes and some glue code, but then the glue owns retries, cancellation, the human gate, and what happens when a replica restarts halfway. A pipeline moves all of that into the control plane.

Pipelines are available over REST, MCP, the SDKs, and the dashboard. They are not exposed over A2A, and run tokens cannot start, read, or decide anything about them, so an agent cannot start a pipeline or approve its own stage (D-048).

## Concepts

A **pipeline** is a named, versioned definition (`ppl_` identifier) with an ordered list of **stages** (`pst_`). Each stage names an agent, optionally pins one of that agent's deployments, and carries its own settings for output size, retries, failure handling, and review. Every change to a pipeline increases its `version`.

A **pipeline run** (`plr_`) is one execution of a pipeline. Starting it copies every stage's settings into the pipeline run (`stages`, each a `prs_` snapshot), so editing or deleting the pipeline afterwards never changes a pipeline run that is already going. The pipeline run records the `pipelineVersion` it started from.

Each stage of a pipeline run is carried out by ordinary Garrison runs with `kind: Pipeline`. A stage's runs are numbered by **execution**: the first run of a stage is execution 1, and every retry, revision, or resume claims the next number. One execution maps to exactly one run, enforced by the idempotency key `pipeline:{pipelineRunId}:{position}:{execution}` and a unique index on the runs table. A stage run carries `pipelineRunId`, `pipelinePosition`, and `pipelineExecution`, and `GET .../runs?pipelineRunId=plr_...` lists them.

An **attempt** is an execution inside one retry cycle. `maxAttempts` (1 to 5, default 1) is how many failed executions a stage may have before the failure counts. A revision or a resume starts a fresh cycle at attempt 1.

A **review** (`prv_`) is the gate of a stage with `requiresReview`. It is created when the stage's run finishes, and the pipeline run waits in `AwaitingReview` until the review is decided. A **revision** is what happens after a reviewer asks for changes: the same stage runs again with the reviewer's feedback in its prompt. `maxRevisions` (0 to 10, default 3) bounds how many times a reviewer can ask.

### Pipeline run statuses

| Status | Meaning |
|---|---|
| `Running` | A stage is starting or running |
| `AwaitingReview` | A stage finished and waits for its review decision |
| `Cancelling` | Cancellation was requested; the current stage run and any pending review are being stopped |
| `Succeeded` | Every stage finished, approved where a review was required. `finalRunId` is the last stage's run |
| `Failed` | A stage failed, could not start, or was rejected. `outcome` says which |
| `Cancelled` | The pipeline run, or its current stage run, was cancelled |
| `TimedOut` | The pipeline run passed its `maxDurationSeconds` deadline |

The first three are active; the rest are terminal. `outcome` is `None` while the pipeline run is active, then one of `Succeeded`, `StageFailed`, `StageStartFailed`, `ReviewRejected`, `ReviewExpired`, `Cancelled`, `TimedOut`, or `InternalError`. `errorMessage` explains every outcome other than `Succeeded`.

Each stage snapshot has its own status (`Pending`, `Running`, `AwaitingReview`, `Succeeded`, `Failed`, `Cancelled`) and counters: `executions`, `attempts`, `revisions`, `currentRunId`, `lastRunId`, and, while a transient refusal holds the stage back, `blockedReason` and `nextAttemptUtc`.

## The handoff between stages

Every stage run receives the caller's original input as its input. Earlier outputs reach a stage only through its prompt, and that prompt comes from a prompt template with the `PipelineStage` role. Garrison never pastes text into a prompt on its own, and it never rewrites the stored input of a run.

When a stage agent has an `inputSchemaJson`, the compiler validates the fully rendered `PipelineStage` task prompt against it, before adding the system prompt. The original caller input stays unchanged on the run. A handoff template for a structured-input agent must therefore render a complete JSON document matching that agent's schema; the built-in prose template will not match an object schema. Validation applies to the first stage too.

A non-JSON handoff fails the receiving run with outcome `CompileFailed` and an error message starting with `InputNotJson`; a schema mismatch starts with `InputSchemaViolation` and includes field paths such as `input.topic`. As with other compilation failures, the pipeline ends with `StageStartFailed`; `maxAttempts` and `continueOnFailure` do not bypass this failure. Revision handoffs are validated again. Compile preview exposes the same validation error. Output repair prompts are not input-validated again.

Each stage runs in its own workspace. Files one stage wrote are not on disk for the next stage, which may well be on another worker. What passes between stages is:

- the previous stage's result text, cut at the stage's `outputCharLimit` (1000 to 200000 characters, default 16000) and marked as cut short when it was longer,
- its structured output, when the agent has an output schema and the JSON fits under the same limit,
- references to its artifacts (name, media type, size, and `art_` identifier, see [ARTIFACTS.md](ARTIFACTS.md)), not their contents,
- the approving reviewer's notes, when the previous stage had a review,
- and, on a revision, the reviewer's feedback and the stage's own previous output. A stage resumed after a rejection gets the same block with the reject comment, when the reviewer left one.

There is no per-stage instruction field. What makes stage 2 behave like an editor is stage 2's agent: its system prompt, description, and deployment. When you want different wording around the handoff, bind your own template.

### Which template renders the prompt

The compiler first renders the stage run's normal task prompt (the deployment's `Task` binding, or `DelegatedTask`) and puts the result in `pipeline.task`. It then renders the `PipelineStage` template around it. The template is chosen in this order:

1. the stage's own `handoffTemplateId`, at `handoffTemplateVersion` when one is pinned,
2. the deployment's `PipelineStage` prompt binding,
3. `builtin/pipeline-stage`.

A handoff template must be a `Task` template; anything else fails validation with field code `TemplateKindMismatch`. `builtin/pipeline-stage` includes the `builtin/pipeline-revision` fragment for revisions. The versions used are recorded in the run's `templateVersions` like every other template, and [PROMPTS.md](PROMPTS.md#pipeline-stages) lists every `pipeline.*` variable.

### What a stage sees

Take a two-stage pipeline `release-notes`: `draft` runs the agent `writer` and requires a review, `edit` runs the agent `editor`. The caller starts it with "Write release notes for 2.4 from the merged pull requests." The writer drafts, and a reviewer approves the draft with the note "Keep it under 200 words." This is the prompt the `edit` stage run receives from `builtin/pipeline-stage`:

```text
You are stage 2 of 2 ("edit") in the pipeline release-notes. Earlier stages ran in their own workspaces, so their files are not in yours; use the outputs below.

The previous stage, draft (agent writer), finished with status Succeeded. Its output:

--- Output of draft ---
Garrison 2.4 adds pipelines: ordered agent stages with optional human review. Stage runs hand their results to the next stage through prompt templates, ...
--- End of output ---

A reviewer approved the previous stage with these notes:
Keep it under 200 words.

--- Your task ---
Write release notes for 2.4 from the merged pull requests.
```

If the reviewer had asked for changes instead, the `draft` stage would have run again, and its prompt would have gained this block (from `builtin/pipeline-revision`) before the task:

```text
A reviewer did not accept your previous attempt at this stage (revision 1) and left the feedback below. Address it and produce a complete new result.

--- Reviewer feedback from Dana Ruiz ---
List the breaking changes first.
--- End of feedback ---

--- Your previous output ---
Garrison 2.4 adds pipelines: ...
--- End of previous output ---
```

`POST .../pipelines/{id}/preview` renders every stage's prompt from a sample input and sample stage outputs without starting anything, which is the fastest way to check a custom handoff template.

## Reviews

A stage with `requiresReview` gets a review when its run finishes `Succeeded`, and also when it fails with `continueOnFailure` set, so a person can decide whether a failed stage is good enough to build on. While the review is pending, the pipeline run is `AwaitingReview` and nothing else happens.

| Decision | Comment | Effect |
|---|---|---|
| `Approve` | Optional | The pipeline continues with the next stage (or succeeds after the last one). The comment reaches the next stage as `pipeline.reviewNotes` |
| `RequestChanges` | Required | The same stage runs again with the comment as `pipeline.revision.feedback`. At the limit (`revisions` equal to `maxRevisions`) the decision answers 409 `RevisionLimitReached` and the review stays pending, so approve or reject it instead |
| `Reject` | Optional reason | The pipeline run fails with outcome `ReviewRejected` |

Comments are limited to 8000 characters. A decision is a compare-and-set from `Pending`, so when two people decide at once one wins and the other gets 409 `ReviewNotPending`. Deciding a review of a pipeline run that is cancelling or already finished also answers `ReviewNotPending`. Each decision writes a `PipelineReviewDecided` audit record.

By default a review waits indefinitely. A stage can set `reviewTimeoutSeconds` (0 to 2592000) and a `reviewTimeoutAction` of `Approve` or `Reject` (the default). When the timeout passes, the leader's sweep applies the action with `decisionSource: Timeout`: an approval continues the pipeline, and a rejection ends it `Failed` with outcome `ReviewExpired` (the review's status is `Expired`). The pipeline's own `maxDurationSeconds` still counts while a review waits, so a pipeline with a deadline never waits past it.

Reviews have their own statuses: `Pending`, `Approved`, `ChangesRequested`, `Rejected`, `Expired`, and `Cancelled` (the pipeline run was cancelled or timed out first). `decisionSource` is `User`, `Timeout`, or `Cancelled`.

Stage reviews share the approvals inbox with permission approvals. They are authorized as the `Approval` resource type: Read on Approval lists and reads them, Update on Approval decides them. They are a separate entity from permission approvals, though, with their own routes under `/pipeline-reviews`.

## Failure, retry, and cancellation

When a stage run ends `Failed` or `TimedOut`, the stage tries again with a new execution until it has used `maxAttempts`. After the last attempt, a stage with `continueOnFailure` moves on (the next stage sees `pipeline.previous.status` as `Failed` and can react to it in its template), and any other stage fails the pipeline run with outcome `StageFailed`.

Some stages fail before their run does any work. A missing agent or deployment, an inactive agent, an agent with no active deployment, stage parameters the deployment no longer allows, a run the scheduler rejects at claim, and a compile failure all end the pipeline run with `StageStartFailed`; retrying the same execution would fail the same way, so these never use up attempts. `QuotaExceeded` is different, because quotas reset and limits change. When a usage quota refuses the stage run at admission, the stage records `blockedReason`, sets `nextAttemptUtc`, and creates the run about five seconds later, then keeps trying on that cadence until the quota allows it. When the quota runs out between admission and compilation, the stage run ends `Failed` with outcome `CompileFailed` and an error message starting with `QuotaExceeded:`; that run stays in the pipeline run's history, and the stage waits the same way and starts a new execution. Neither case counts against `maxAttempts`. An unexpected database or transport error while creating the stage run is also treated as transient.

Cancelling a pipeline run (`POST .../pipeline-runs/{id}/cancel`) moves it to `Cancelling`, cancels its pending review, cancels the current stage run together with any runs that run delegated to, and ends it `Cancelled`. Cancelling the current stage run directly (`POST .../runs/{id}/cancel`) cancels the pipeline run too. A stage run cannot be retried on its own: `POST .../runs/{id}/retry` answers 409 `PipelineStageRun`, because the pipeline has to know which execution counts.

To pick a stopped pipeline run up again, use `POST .../pipeline-runs/{id}/retry`. It works on `Failed`, `TimedOut`, and `Cancelled` pipeline runs (409 `PipelineRunNotRetryable` otherwise), resumes at the stage where the pipeline run stopped with a new execution and a fresh attempt count, keeps the outputs of the stages before it, and restarts the deadline from now. If retention has already removed the run of an earlier stage, the stage after it could not be given that output, so the retry answers 409 `PipelineHistoryPruned`; start the pipeline again instead. Two retries racing each other produce one resume and one 409 `PipelineRunChanged`.

`maxDurationSeconds` on the pipeline (0 for no limit, up to 2592000) sets `deadlineUtc` when the pipeline run starts. Time spent waiting for reviews counts. Past the deadline, the sweep ends the pipeline run `TimedOut`, cancels its pending review, and cancels its current stage run.

A finished pipeline run can be deleted with `DELETE .../pipeline-runs/{id}`, which removes the pipeline run and its reviews and keeps its stage runs. An active pipeline run answers 409, including one a concurrent retry has just reopened; cancel it first. A pipeline cannot be deleted while it has active pipeline runs (409 `PipelineInUse`), and an agent or deployment that a pipeline stage references cannot be deleted (409 `ReferencedByPipeline`).

## Several replicas

Any replica can start, cancel, retry, or decide, and any replica can advance a pipeline run. Advancing is idempotent: claiming an execution, linking its run, and changing the pipeline run are each a compare-and-set in the database, and stage runs are created with the deterministic idempotency key above, so two replicas advancing the same pipeline run at the same moment still create one run per execution.

Two things drive progress. When a stage run finishes on a replica, that replica advances the pipeline run at once. The leader also sweeps every `Runtime.PipelineSweepIntervalMs` (default 5000) and catches everything else: stage runs that finished on a replica that then stopped, executions claimed but never linked to a run, blocked stage starts that are due, requested cancellations, review timeouts, deadlines, and stage runs left running under pipeline runs that already ended. It reads only the pipeline runs that need one of these, so runs parked at an open review or on a live stage run never crowd out the others, and it pages through them in identifier order. One sweep spends at most about two seconds; when that runs out, the next sweep continues where it stopped. The sweep also moves a pipeline run that shows `AwaitingReview` without a review of its current stage execution (a replica stopped halfway through starting a revision) back to `Running`. The sweep runs under the same leader lease as other maintenance, including with Clutch leases (see [CLUTCH_LEASES.md](CLUTCH_LEASES.md)).

Retention follows `Runs.RetentionDays`: finished pipeline runs are pruned with finished runs, and the runs of an active pipeline run are never pruned.

## Permissions

| Action | Permission |
|---|---|
| List, read, and preview pipelines | Read on `Pipeline` |
| Create, update, delete pipelines | Create, Update, Delete on `Pipeline` |
| Start a pipeline | Execute on `Pipeline`, and Execute on `Agent` for every stage agent (checked at start) |
| List and read pipeline runs, subscribe to `pipeline-run:{id}` | Read on `PipelineRun` |
| Cancel and retry pipeline runs | Update on `PipelineRun` |
| Delete finished pipeline runs | Delete on `PipelineRun` |
| List and read stage reviews | Read on `Approval` |
| Decide stage reviews | Update on `Approval` |

Among the built-in roles, Editor can do all of it. AgentDeveloper writes and starts pipelines and reads pipeline runs and reviews. AgentOperator starts pipelines, cancels, retries, and deletes pipeline runs, and decides reviews. AgentInvoker starts pipelines and reads pipeline runs, but cannot cancel them or see reviews. Viewer and Auditor read pipelines, pipeline runs, and reviews. Run tokens get none of this, whatever the role of the person behind them: the REST routes refuse them, and the MCP pipeline tools are neither listed nor callable for run and node tokens.

## Limits and settings

| Limit | Value |
|---|---|
| Stages per pipeline | 1 to `Runtime.PipelineMaxStages` (cluster setting, default 20, at most 100). More fails validation with field code `TooManyStages`; none fails with `PipelineEmpty` |
| Pipeline name | 1 to 64 lowercase letters, digits, and hyphens, unique per tenant (409 `NameConflict`) |
| Stage name | 1 to 128 characters, unique within the pipeline |
| `outputCharLimit` | 1000 to 200000, default 16000 |
| `maxAttempts` | 1 to 5, default 1 |
| `maxRevisions` | 0 to 10, default 3 |
| `reviewTimeoutSeconds`, `maxDurationSeconds` | 0 (no limit) to 2592000 (30 days) |
| Review comment | 8000 characters |
| Start and read waits | `waitSeconds` up to 600 over REST; over MCP, also capped by `Mcp.MaxToolWaitSeconds` (default 90) |

`Runtime.PipelineSweepIntervalMs` (500 to 600000, default 5000) sets how often the leader sweeps. Both settings are cluster settings, changed live under Settings or with `PUT /v1.0/api/settings` (see [CONFIGURATION.md](CONFIGURATION.md)).

Stage `parameters` are run parameter overrides passed to every run of the stage. They are checked against the deployment's `allowedRunOverrides` when the pipeline is saved, so a stage with parameters must pin a `deploymentId`. A pinned deployment must belong to the stage's agent (field code `DeploymentAgentMismatch`).

## Walk-through with curl

The commands assume a server on `127.0.0.1:8700`, a worker, and two agents named `writer` and `editor` that each have an active deployment. Any agents on the fake harness work for trying it out. Set `GARRISON_ADMIN_PASSWORD` to the password generated by Docker Compose or the Kubernetes secret setup; source development mode uses `password` (see [QUICKSTART.md](QUICKSTART.md#before-you-start)).

```bash
TOKEN=$(jq -n --arg p "$GARRISON_ADMIN_PASSWORD" '{email:"admin@garrison",password:$p,tenantId:"default"}' |
  curl -s -X POST http://127.0.0.1:8700/v1.0/token -H "Content-Type: application/json" --data-binary @- | jq -r .token)
API=http://127.0.0.1:8700/v1.0/api/tenants/default
WRITER=$(curl -s "$API/agents/writer" -H "Authorization: Bearer $TOKEN" | jq -r .id)
EDITOR=$(curl -s "$API/agents/editor" -H "Authorization: Bearer $TOKEN" | jq -r .id)
```

Create the pipeline. Stages run in list order, and positions are assigned from it.

```bash
PPL=$(curl -s -X POST "$API/pipelines" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{
  "name": "release-notes",
  "description": "Draft release notes, have a person check them, then edit",
  "maxDurationSeconds": 86400,
  "stages": [
    { "name": "draft", "agentId": "'"$WRITER"'", "requiresReview": true,
      "reviewTimeoutSeconds": 14400, "reviewTimeoutAction": "Reject", "maxRevisions": 2 },
    { "name": "edit", "agentId": "'"$EDITOR"'", "maxAttempts": 2, "outputCharLimit": 32000 }
  ]
}' | jq -r .id)
```

The answer is the stored pipeline with `id`, `version: 1`, and each stage's `id`, `position`, and defaults filled in. Pipeline routes accept the name or the `ppl_` identifier.

Check the prompts before running anything. `sampleOutputs[0]` stands in for the `draft` output that `edit` sees.

```bash
curl -s -X POST "$API/pipelines/release-notes/preview" -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"input":"Write release notes for 2.4.","sampleOutputs":["Garrison 2.4 adds pipelines."]}' | jq '.stages[] | {stageName, success, prompt}'
```

Start it and wait up to 60 seconds. The call returns when the pipeline run finishes or stops for a review, or when the wait runs out, whichever comes first. Send an `Idempotency-Key` so a repeated request returns the same pipeline run.

```bash
PLR=$(curl -s -X POST "$API/pipelines/release-notes/start" -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -H "Idempotency-Key: release-2.4" \
  -d '{"input":"Write release notes for 2.4 from the merged pull requests.","wait":true,"waitSeconds":60}' \
  | tee /dev/stderr | jq -r .id)
```

The response is the pipeline run with its stages, the summaries of its stage runs, and its reviews. Here the `draft` stage has finished and waits:

```json
{
  "id": "plr_mv5d0k3q_Rk2wT8mNbX4vLq7Y",
  "pipelineName": "release-notes",
  "pipelineVersion": 1,
  "status": "AwaitingReview",
  "outcome": "None",
  "currentPosition": 1,
  "stageCount": 2,
  "stages": [
    { "position": 1, "name": "draft", "agentName": "writer", "status": "AwaitingReview", "executions": 1, "attempts": 1, "revisions": 0, "currentRunId": "run_mv5d0k3s_9VbQx2LmT7nRp4Wz" },
    { "position": 2, "name": "edit", "agentName": "editor", "status": "Pending", "executions": 0, "attempts": 0, "revisions": 0 }
  ],
  "runs": [
    { "runId": "run_mv5d0k3s_9VbQx2LmT7nRp4Wz", "position": 1, "execution": 1, "agentName": "writer", "status": "Succeeded", "outcome": "Succeeded" }
  ],
  "reviews": [
    { "id": "prv_mv5d0k9a_Hq3Lz8WcN1tYb5Ks", "position": 1, "stageName": "draft", "execution": 1, "status": "Pending", "timeoutAction": "Reject", "expiresUtc": "2026-10-13T22:41:07.511Z" }
  ]
}
```

Read the draft from its run, then decide. Ask for a change first:

```bash
REVIEW=$(curl -s "$API/pipeline-reviews?pipelineRunId=$PLR&status=Pending" -H "Authorization: Bearer $TOKEN" | jq -r '.objects[0].id')
curl -s -X POST "$API/pipeline-reviews/$REVIEW/decide" -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"decision":"RequestChanges","comment":"List the breaking changes first."}'
```

The `draft` stage runs again as execution 2 with the feedback in its prompt. Wait for the new review, then approve it with a note for the editor:

```bash
curl -s "$API/pipeline-runs/$PLR?waitSeconds=60" -H "Authorization: Bearer $TOKEN" | jq '{status, currentPosition}'
REVIEW=$(curl -s "$API/pipeline-reviews?pipelineRunId=$PLR&status=Pending" -H "Authorization: Bearer $TOKEN" | jq -r '.objects[0].id')
curl -s -X POST "$API/pipeline-reviews/$REVIEW/decide" -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"decision":"Approve","comment":"Keep it under 200 words."}'
curl -s "$API/pipeline-runs/$PLR?waitSeconds=60" -H "Authorization: Bearer $TOKEN" | jq '{status, outcome, finalRunId}'
```

When the pipeline run succeeds, `finalRunId` is the `edit` stage's run, and its `resultText` is the pipeline's answer. The other calls you will want:

```bash
curl -s "$API/pipeline-runs?pipelineId=$PPL&status=Failed" -H "Authorization: Bearer $TOKEN"           # recent failures
curl -s "$API/runs?pipelineRunId=$PLR" -H "Authorization: Bearer $TOKEN"                                # every stage run
curl -s -X POST "$API/pipeline-runs/$PLR/cancel" -H "Authorization: Bearer $TOKEN"                     # stop an active one
curl -s -X POST "$API/pipeline-runs/$PLR/retry" -H "Authorization: Bearer $TOKEN"                      # resume a stopped one
curl -s -X DELETE "$API/pipeline-runs/$PLR" -H "Authorization: Bearer $TOKEN"                          # remove a finished one
```

Every route, field, and error code is in [REST_API.md](../REST_API.md#pipelines). Pipelines can also be kept in source control as `kind: Pipeline` manifest documents ([MANIFESTS.md](MANIFESTS.md#pipeline)).

## MCP tools

Users and credentials get eleven pipeline tools on the Garrison MCP server. Run and node tokens see none of them.

| Tool | Does |
|---|---|
| `garrison_list_pipelines` | Lists pipelines; optional `search` and `maxResults` |
| `garrison_start_pipeline` | Starts one; `pipeline` and `input` required, optional `waitSeconds`, `idempotencyKey`, `inputContentType`, `priority` |
| `garrison_get_pipeline_run` | Reads a pipeline run with stages, stage runs, and reviews; optional `waitSeconds` |
| `garrison_list_pipeline_runs` | Lists pipeline runs; optional `pipeline`, `status`, `maxResults` |
| `garrison_cancel_pipeline_run` | Cancels an active pipeline run |
| `garrison_list_pipeline_reviews` | Lists stage reviews; optional `status`, `pipelineRunId`, `maxResults` |
| `garrison_decide_pipeline_review` | Approves, requests changes to, or rejects a pending review |
| `garrison_get_pipeline`, `garrison_create_pipeline`, `garrison_update_pipeline`, `garrison_delete_pipeline` | Management tools for definitions, using the REST pipeline fields as `configuration` |

Retrying and deleting pipeline runs, and previewing prompts, are REST-only. [MCP_API.md](../MCP_API.md#pipelines) has the arguments and results.

## In the dashboard

Pipelines live inside existing hubs rather than a hub of their own:

- **Agents > Pipelines** lists definitions and opens the stage editor: agent, deployment, and handoff template pickers, review settings, the prompt preview, and Start.
- **Runs > Pipeline runs** shows pipeline runs, and each opens a timeline of stages with links to their stage runs, the review panel, and Cancel and Retry.
- **Approvals > Stage reviews** is the inbox for pending reviews, next to permission approvals. The Approvals badge counts both, and the decide dialog offers Approve, Request changes, and Reject.

The dashboard follows a pipeline run over the WebSocket channel `pipeline-run:{id}` and the shared `approvals` channel, whose `approvals.changed` message carries `reviewsPending` for the badge (see [WEBSOCKETS_API.md](../WEBSOCKETS_API.md)).

## Telemetry

Pipelines report `garrison_pipelines_started_total`, `garrison_pipelines_finished_total` (by outcome), `garrison_pipeline_stage_executions_total` (by why the execution started: first, retry, revision, resume), `garrison_pipeline_stage_start_failures_total` (transient or permanent), `garrison_pipeline_reviews_decided_total`, `garrison_pipeline_review_wait_seconds`, `garrison_pipeline_reviews_pending`, and `garrison_pipeline_advances_total`, all on the Runs dashboard. Log lines carry the `[Pipelines]` prefix with `tenant=` and `pipeline=` fields. See [TELEMETRY.md](TELEMETRY.md).
