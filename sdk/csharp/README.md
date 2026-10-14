# Garrison.Sdk

C# client for the Garrison REST API. Targets .NET 8 and .NET 10.

## Install

The package is not published to NuGet yet, so `dotnet add package Garrison.Sdk` finds nothing. Reference the project from your checkout of the repository instead:

```bash
dotnet add reference /path/to/Garrison/sdk/csharp/Garrison.Sdk/Garrison.Sdk.csproj
```

Or build a package and install it from a local folder:

```bash
dotnet pack /path/to/Garrison/sdk/csharp/Garrison.Sdk -c Release -o ./local-packages
dotnet add package Garrison.Sdk --prerelease --source ./local-packages
```

## Quick start

```csharp
using Garrison.Sdk;
using Garrison.Sdk.Models;
using Garrison.Sdk.Requests;

using (GarrisonClient client = new GarrisonClient("http://127.0.0.1:8700"))
{
    // The same email and password you use in the dashboard.
    await client.LoginAsync("admin@garrison", "password", "default");

    Run run = await client.Agents.InvokeAsync("my-agent", new InvokeRequest
    {
        Input = "Summarize the release notes",
        Wait = true,
        WaitSeconds = 120
    });

    Console.WriteLine(run.Status + ": " + run.ResultText);
}
```

To sign in with an access key pair instead, call `client.LoginWithKeysAsync(accessKey, secretKey)`. See "Where the credentials come from" below.

## Where the credentials come from

Email and password sign-in works the same on every runtime: tenant `default`, user `admin@garrison`, and the administrator password. That password is `password` on Docker Compose and source builds unless `GARRISON_ADMIN_PASSWORD` was set before the first start. On Kubernetes it is whatever `GARRISON_ADMIN_PASSWORD` held when `k8s/scripts/generate-secrets.sh` ran (also `password` by default), stored in Secret `garrison-secrets`.

The seeded administrator access and secret keys depend on the runtime:

| Runtime | Access key | Secret key |
|---|---|---|
| Docker Compose and source builds | `access_garrison_default` (or `GARRISON_DEFAULT_ACCESS_KEY` in `docker/.env`) | `secret_garrison_default_change_me` (or `GARRISON_DEFAULT_SECRET_KEY`) |
| Kubernetes (Kustomize or Helm) | random, key `default-access-key` in Secret `garrison-secrets` | random, key `default-secret-key` in Secret `garrison-secrets` |

On Kubernetes, read them with:

```bash
kubectl -n garrison get secret garrison-secrets -o jsonpath='{.data.default-access-key}' | base64 --decode; echo
kubectl -n garrison get secret garrison-secrets -o jsonpath='{.data.default-secret-key}' | base64 --decode; echo
kubectl -n garrison get secret garrison-secrets -o jsonpath='{.data.admin-password}' | base64 --decode; echo
```

You can also create a credential of your own in the dashboard (Access > Credentials); the secret key is shown once.

## Authentication

| Method | Effect |
|---|---|
| `LoginAsync(email, password, tenantId)` | Issues a user token and switches to bearer authentication. |
| `LoginWithKeysAsync(accessKey, secretKey)` | Issues a credential token and switches to bearer authentication. |
| `UseToken(token, tenantId)` | Uses an existing token. |
| `UseAccessKey(accessKey, secretKey, tenantId)` | Sends the key pair on every request. |
| `UseSignedRequests(accessKey, secretKey, tenantId)` | Signs every request with HMAC-SHA256. The secret never goes over the wire. |
| `UseAdminApiKey(apiKey, tenantId)` | Uses the platform admin API key. |

`GetTokenDetailsAsync`, `RefreshAsync`, and `LogoutAsync` manage the current token. The tenant for tenant-scoped calls comes from the login response or the `tenantId` argument.

## Modules

`GarrisonClient` exposes one client per resource: `Tenants`, `Users`, `Credentials`, `Roles`, `Permissions`, `RolePermissions`, `UserRoleAssignments`, `CredentialScopeAssignments`, `Agents`, `Deployments`, `HarnessProfiles`, `PromptTemplates`, `McpServers`, `Secrets`, `WorkspaceTemplates`, `ArtifactStores`, `Manifests`, `Runs`, `Conversations`, `Approvals`, `Pipelines`, `PipelineRuns`, `PipelineReviews`, `Analytics`, `Nodes`, `ControlNodes`, `NodePools`, `RequestHistory`, `Audit`, and `Settings`. Resource clients provide `ListAsync`, `GetAsync`, `CreateAsync`, `UpdateAsync`, and `DeleteAsync`, plus resource-specific operations such as `Agents.InvokeAsync`, `Credentials.RotateAsync`, and `PromptTemplates.RenderAsync`.

Control-plane replicas are read-only: `ControlNodes.ListAsync(query)` returns a `ControlNodeListResponse` (a page of `ControlNode` plus `RespondingNodeId`, the replica that answered) and `ControlNodes.GetAsync(id)` reads one replica by node ID. Each `ControlNode` carries `Status` (`ControlNodeStatusEnum`: `Starting`, `Ready`, `Draining`, `Offline`), version, schema version, backplane, start and heartbeat times, activity (`ActiveRequests`, `OpenStreams`, `HeldLongPolls`), `IsLeader`, and `LeaderEpoch` (leader only). `OverviewResponse` also has `ControlNodesByStatus` and `LeaderNodeId`. Reading needs Read on Node, like worker nodes.

Models, enums, request types, and response types live in `Garrison.Sdk.Models`, `Garrison.Sdk.Enums`, `Garrison.Sdk.Requests`, and `Garrison.Sdk.Responses`. They mirror the server contracts.

## Permission approvals

When a deployment has `ApprovalsEnabled` set (Claude Code profiles, and Codex profiles with CodexAppServer delivery), the harness relays permission prompts to Garrison. The deployment's `ApprovalRules` (a list of `DeploymentApprovalRule` with `Action`, `Pattern` in Claude Code rule syntax such as `Bash(git status:*)` or `mcp__github__*`, optional `InputPattern`, and `Description`) decide each request, and `ApprovalDefaultAction` (`ApprovalRuleActionEnum`: `Allow`, `Deny`, `Ask`) covers requests no rule matches. `Ask` sends the request to a person, who has `ApprovalTimeoutSeconds` (10 to 3600, default 300) before `ApprovalTimeoutDecision` applies.

```csharp
ApprovalFilter filter = new ApprovalFilter();
filter.Status = ApprovalStatusEnum.Pending;
EnumerationResult<Approval> pending = await client.Approvals.ListAsync(filter);

ApprovalDecideRequest decide = new ApprovalDecideRequest();
decide.Decision = ApprovalDecisionEnum.Allow;
decide.Remember = true; // also add an Allow rule (the approval's SuggestedRule) to the deployment
Approval decided = await client.Approvals.DecideAsync(pending.Objects[0].Id, decide);

ApprovalCheckRequest check = new ApprovalCheckRequest();
check.ToolName = "Bash";
check.Input = new ApprovalToolInput();
check.Input.Command = "git status --short";
ApprovalCheckResponse result = await client.Approvals.CheckAsync(deploymentId, check);
```

`Approvals.ListAsync` filters by status, run, root run, agent, deployment, decision source (`ApprovalSourceEnum`), and time range; for a pending count, filter on `Pending` with `MaxResults = 1` and read `TotalRecords`. `GetAsync` returns 404 for an approval outside the tenant. `DecideAsync` answers 409 (`ApprovalNotPending`) when the approval was already decided, and `Remember` needs Update on the approval's deployment. `CheckAsync` records nothing and returns the action, whether a rule or the default decided (`Source`), the matching rule, a `SuggestedRule`, and whether approvals are enabled. `Run` carries `PendingApprovals`, `AwaitingApproval` (the run stays `Running` while it waits), and `ApprovalWaitMs`.

## Pipelines

A pipeline runs agents as ordered stages. Each stage runs in its own workspace and receives the caller's input plus the earlier stages' results through a `PipelineStage` prompt template. A stage with `RequiresReview` waits for a person before the pipeline continues.

```csharp
Pipeline pipeline = new Pipeline { Name = "draft-and-edit" };
pipeline.Stages.Add(new PipelineStage { Name = "write", AgentId = writerId, RequiresReview = true });
pipeline.Stages.Add(new PipelineStage { Name = "edit", AgentId = editorId });
pipeline = await client.Pipelines.CreateAsync(pipeline);

PipelineRun run = await client.Pipelines.StartAsync(pipeline.Name, new PipelineStartRequest { Input = "Write a haiku", Wait = true, WaitSeconds = 60 }, idempotencyKey: "haiku-1");
PipelineReview review = (await client.PipelineReviews.ListAsync(new PipelineReviewFilter { Status = PipelineReviewStatusEnum.Pending, PipelineRunId = run.Id })).Objects[0];
await client.PipelineReviews.DecideAsync(review.Id, new PipelineReviewDecideRequest { Decision = PipelineReviewDecisionEnum.Approve, Comment = "Keep the second line." });
run = await client.PipelineRuns.GetAsync(run.Id, waitSeconds: 60);
```

`Pipelines` adds `StartAsync` (Pipeline Execute plus Agent Execute on every stage agent; the optional idempotency key is sent as the `Idempotency-Key` header, and a repeat with different content answers 409 `IdempotencyKeyConflict`) and `PreviewAsync` (renders every stage prompt from sample input and sample stage outputs; nothing runs) to the standard CRUD calls, which accept an identifier or a name. Updates advance `Version`; started pipeline runs keep their snapshot. Deleting a pipeline with active pipeline runs answers 409 `PipelineInUse`.

`PipelineRuns` lists by pipeline, status (`PipelineRunStatusEnum`), caller, and time range; `GetAsync` takes an optional `waitSeconds` (up to 600) and returns when the pipeline run ends or waits for a review, with its `Stages`, stage `Runs`, and `Reviews`. `CancelAsync` cancels the pending review and the current stage run; `RetryAsync` resumes a `Failed`, `TimedOut`, or `Cancelled` pipeline run at the stage where it stopped; `DeleteAsync` removes a finished pipeline run (409 `PipelineRunActive` otherwise).

`PipelineReviews` lists by status (`PipelineReviewStatusEnum`), pipeline run, pipeline, stage run, and decision source, and `DecideAsync` takes `Approve` (the comment reaches the next stage as review notes), `RequestChanges` (comment required; the stage runs again with it, up to the stage's `MaxRevisions`, then 409 `RevisionLimitReached`), or `Reject` (the pipeline run fails with outcome `ReviewRejected`). A second decision answers 409 `ReviewNotPending`. Reviews are authorized as `Approval` Read and Update. Run tokens cannot use pipelines, pipeline runs, or reviews.

## Streaming run events

```csharp
Run queued = await client.Runs.CreateAsync(new RunCreateRequest { AgentName = "my-agent", Input = "Hello" });

await foreach (RunStreamEvent item in client.Runs.StreamAsync(queued.Id))
{
    if (item.Event != null) Console.WriteLine(item.Event.EventType + " " + item.Event.Text);
    if (item.Run != null) Console.WriteLine("finished: " + item.Run.Status);
}
```

The stream ends after `run.completed`. `Runs.GetEventsAsync` polls instead, and `Runs.WaitForCompletionAsync` polls until the run reaches a terminal status.

## Conversations

A conversation is a multi-turn session with one agent. Each turn is a run, and every turn after the first resumes the harness session the earlier turns built, on the node that holds that session's directories. Set `StartConversation = true` on an `InvokeRequest` or `RunCreateRequest` (also accepted by `Deployments.TestAsync`) to start one; the returned run's `ConversationId` names it. Pass that ID as `ConversationId` to send the next turn.

```csharp
Run first = await client.Agents.InvokeAsync("my-agent", new InvokeRequest { Input = "Plan the migration", StartConversation = true });
string conversationId = first.ConversationId!;

Run second = await client.Agents.InvokeAsync("my-agent", new InvokeRequest { Input = "Now write step 1", ConversationId = conversationId });
Console.WriteLine(second.ConversationTurn + ": " + second.ResultText);   // 2: ...

Conversation conversation = await client.Conversations.GetAsync(conversationId);
EnumerationResult<Run> turns = await client.Conversations.ListRunsAsync(conversationId);   // oldest first
await client.Conversations.DeleteAsync(conversationId);   // the runs are kept
```

Turns of one conversation never overlap. A turn sent while the previous one is unfinished is refused, not queued, with 409 `ConversationBusy`; wait for the previous run (or cancel it) and send again:

```csharp
try
{
    await client.Agents.InvokeAsync("my-agent", new InvokeRequest { Input = "Next", ConversationId = conversationId });
}
catch (GarrisonException e) when (e.StatusCode == 409 && e.Error?.Code == "ConversationBusy")
{
    Conversation current = await client.Conversations.GetAsync(conversationId);
    if (current.ActiveRunId != null) await client.Runs.WaitForCompletionAsync(current.ActiveRunId, TimeSpan.FromMinutes(5));
}
```

Other 409 codes are `ConversationAgentMismatch` (the conversation belongs to another agent), `ConversationDeploymentMismatch` (the request names a deployment other than the conversation's), and `ConversationDeploymentUnavailable` (the conversation's deployment was deleted). An unknown `ConversationId` returns 404. `DeleteAsync` also returns 409 `ConversationBusy` while a turn is unfinished.

`Conversations.ListAsync(ConversationFilter)` filters by `AgentId`, `ContextId` (the A2A context the conversation was created for), `CallerId`, and `Search`, with `Skip`, `MaxResults`, and `Ordering`. `RunFilter.ConversationId` lists a conversation's runs through `Runs.ListAsync`. A `Conversation` carries `TurnCount`, `SessionId`, `AffinityNodeId` and `AffinityNodeName`, `ActiveRunId`, `LastRunId`, `Busy` (true while a turn is unfinished), `FallbackCount`, and `LastFallbackReason`.

Each turn's `Run` has `ConversationId`, `ConversationTurn` (1 for the first turn, 0 outside a conversation), `ResumeSessionId`, `AffinityNodeId`, `AffinityUntilUtc`, and `ConversationFallbackReason`. A fallback happens when the turn cannot resume and starts a fresh session seeded with the transcript of the earlier turns instead: `ConversationFallbackReasonEnum` is `AffinityNodeLost`, `AffinityWaitExpired`, `WorkspaceLost`, `SessionMissing`, `HarnessChanged`, `ResumeUnsupported`, or `ExecutorWithoutState`. A turn that could not even fall back ends with `RunOutcomeEnum.ConversationStateLost`. Deleting a conversation writes an `AuditEventTypeEnum.ConversationDeleted` record. See "Conversations" in `REST_API.md`.

## Run timing and usage

Finished runs carry timing and usage fields in addition to `InputTokens`, `OutputTokens`, `CachedTokens`, and `CostUsd`:

| Property | Type | Meaning |
|---|---|---|
| `FirstTokenUtc`, `LastTokenUtc` | `DateTime?` | First and last model output event (UTC). |
| `TimeToFirstTokenMs` | `long?` | Process start to the first model output event. |
| `StreamingMs` | `long?` | First to last model output event. |
| `ExecutionMs` | `long?` | Start to completion. |
| `QueueMs` | `long?` | Time spent queued before the run was leased. |
| `TotalMs` | `long?` | Creation to completion. |
| `DelegationWaitMs` | `long?` | Time the run spent waiting on child runs it started (delegation), measured from server timestamps of the runs whose `ParentRunId` is this run. |
| `TimeToFirstTokenExcludingDelegationMs` | `long?` | `TimeToFirstTokenMs` minus the delegation wait that happened before the first token; never negative. |
| `OutputTokensPerSecond` | `double?` | Output tokens over the streaming window. |
| `ReasoningTokens` | `long` | Reasoning tokens (default 0). |
| `ToolCallCount` | `int` | Tool calls made during the run (default 0). |

Nullable properties are null when the value could not be measured. On the wire, most of these fields are left out when there is no value, while `outputTokensPerSecond` is always present and `null` when it cannot be measured (no streaming window, or one shorter than 100 ms). Both deserialize to null here.

## Blocked runs

`Run.BlockedReason` (`RunBlockedReasonEnum?`) is computed by the server when a run is read. It is null unless the run is `Queued` and no Ready worker can run it. Values: `NoReadyWorker` (no node is Ready), `NoCapableWorker` (no Ready node reports the run's harness), `NoMatchingPool` (capable nodes exist but none matches the deployment's node pool or node selector), `NoIsolatingWorker` (the run is `Untrusted` and no Ready node with its harness can isolate it). The tenant overview counts these runs as `OverviewResponse.BlockedRuns`. See "Blocked runs" in `REST_API.md`.

Runs stopped by a worker run guard end `Failed` with `RunOutcomeEnum.RepetitionDetected` (the assistant text degenerated into a short repeated unit or into text with no letters or digits), `RunOutcomeEnum.OutputLimitExceeded` (more assistant text than the deployment's `MaxAssistantChars`), or `RunOutcomeEnum.NoProgress` (nothing happened for `NoProgressSeconds`). The partial output is in `Run.ResultText`, and the run has one `Warning` event with code `RunGuardTriggered`. `Deployment.RepetitionGuard`, `Deployment.MaxAssistantChars`, and `Deployment.NoProgressSeconds` set the limits per deployment; null uses the cluster defaults. A waiting invoke (`InvokeRequest.Wait` true) cancels its run when the connection drops, for example when the `CancellationToken` passed to `InvokeAsync` is cancelled; set `InvokeRequest.CancelOnDisconnect = false` to keep the run going. See "Run guards" and "Cancellation" in `REST_API.md`.

When the agent has an output schema, the server validates each run's final output against it. `Run.OutputSchemaValid` (`bool?`) is true or false after validation and null when nothing was validated, `Run.SchemaValidationErrors` (`string?`) holds the first few errors of a failed validation, and `Run.RepairAttempts` (`int`, 0 or 1) counts the structured output repair Garrison makes when the harness can resume its session. A run whose output still does not validate fails with `RunOutcomeEnum.SchemaValidationFailed`. See "Structured output validation" in `REST_API.md`.

## Executors and run pods

`Deployment.Executor` chooses how runs execute: `RunExecutorEnum.Process` (a subprocess of the worker, the default) or `RunExecutorEnum.KubernetesJob` (a Kubernetes Job per run, in its own pod with no service account token and a hardened security context). Null uses the node pool's `NodePool.DefaultExecutor`, then Process. `Deployment.PodResources` (`RunPodResources`: `CpuRequest`, `CpuLimit`, `MemoryRequest`, `MemoryLimit`, `EphemeralStorageRequest`, `EphemeralStorageLimit`, as Kubernetes quantities such as `500m` or `2Gi`) sets the run pod's requests and limits. Each run records its executor in `Run.Executor`, and only nodes whose `Node.Executors` include it claim the run; a run nobody can take reports `RunBlockedReason` `NoCapableWorker`. `WorkspaceKindEnum.PersistentVolume` with `WorkspaceTemplate.PersistentVolumeClaim` mounts an existing claim at the workspace path (KubernetesJob runs only). Run pod failures outside the harness (unschedulable, image pull, OOMKilled, evicted) end with `RunOutcomeEnum.PodFailed` and a message naming the cause. See `docs/KUBERNETES.md`.

## Secret status

The control plane refreshes ChatGPT logins stored in `CodexAuthJson` secrets itself, shortly before the access token expires, and writes the rotated tokens back to the secret. When OpenAI rejects the stored refresh token for good (reused, expired, or revoked), the secret's status becomes `NeedsReauthentication`.

`Secret` carries `Status` (`SecretStatusEnum`: `Ok` or `NeedsReauthentication`), `StatusMessage` (the provider error, or null when `Ok`), `StatusUtc` (when the status left `Ok`), `RefreshedUtc` (when the control plane last refreshed the login itself), and `AccessTokenExpiresUtc` (expiry of the stored access token; `CodexAuthJson` only). To find secrets that need attention, list them and check `Status == SecretStatusEnum.NeedsReauthentication`. A run whose deployment binds a secret in that state fails before it starts, with outcome `NotCredentialed` and an error message that starts with `SecretNeedsReauthentication:`. (`SecretRefreshFailed:` means the access token was expired and the refresh failed for a passing reason such as a network error; the secret stays `Ok` and a retry may work.) The fix is to replace the value: sign in again with `codex login` using a `CODEX_HOME` nothing else uses, then set the new `auth.json` as the secret's value. Setting a value returns the status to `Ok`. Do not keep using that login on another machine, because both copies share one refresh token; for shared deployments an `OpenAiApiKey` secret is simpler. See "Codex logins" in `docs/SECURITY.md`.

## Run analytics

`Analytics.RunsAsync` returns totals and time-bucketed series of run counts, tokens, cost, latency percentiles, and throughput for the tenant.

```csharp
RunAnalyticsQuery query = new RunAnalyticsQuery();
query.From = DateTime.UtcNow.AddDays(-1);
query.To = DateTime.UtcNow;
query.Interval = AnalyticsIntervalEnum.Hour;
query.GroupBy = AnalyticsGroupByEnum.Agent;

RunAnalyticsResponse analytics = await client.Analytics.RunsAsync(query);
Console.WriteLine("runs: " + analytics.Totals.Runs + ", p95 TTFT: " + analytics.Totals.TimeToFirstTokenMsP95);
foreach (RunAnalyticsSeries series in analytics.Series)
{
    foreach (RunAnalyticsBucket bucket in series.Buckets) Console.WriteLine(series.Label + " " + bucket.StartUtc + " " + bucket.Runs);
}
```

Every query member is optional. `Interval` is `Auto`, `Minute`, `Hour`, `Day`, or `Week`. `GroupBy` is `None`, `Agent`, `Harness`, `Model`, or `HarnessModel` (sent as `harnessModel`); with `HarnessModel` each series key is `Harness|model` (for example `ClaudeCode|claude-sonnet-5-5`) and its label is `Harness / model`. `AgentId`, `DeploymentId`, `HarnessType`, and `Model` filter the runs; `Model` matches the run's served model, and `"unknown"` matches runs without a recorded model. `BucketSeconds` in the response is the authoritative bucket size, and `Truncated` is true when the server hit its 100,000-run cap. `RunAnalyticsMetrics` (on `Totals` and every bucket) also carries `TimeToFirstTokenExcludingDelegationMsAvg`, `TimeToFirstTokenExcludingDelegationMsP50`, `TimeToFirstTokenExcludingDelegationMsP95`, and `DelegationWaitMsAvg`, so agents that delegate can be compared with agents that answer directly. The server returns 400 (thrown as `GarrisonException`) when `From` is not earlier than `To`, when the range needs more than 400 buckets, or when a parameter is invalid.

`Analytics.DimensionsAsync(from, to)` returns the distinct agents, harness types, deployments, and served models among runs in a range (default: the last 24 hours), which is what a filter picker needs. Lists are sorted by name and never null.

```csharp
RunAnalyticsDimensions dimensions = await client.Analytics.DimensionsAsync(DateTime.UtcNow.AddDays(-7), DateTime.UtcNow);
foreach (string model in dimensions.Models)
{
    RunAnalyticsQuery byModel = new RunAnalyticsQuery();
    byModel.Model = model;
    byModel.GroupBy = AnalyticsGroupByEnum.HarnessModel;
    RunAnalyticsResponse report = await client.Analytics.RunsAsync(byModel);
    Console.WriteLine(model + ": " + report.Totals.Runs);
}
```

`RunAnalyticsDimensions` has `Agents` (`RunAnalyticsAgentDimension`: `Id`, `Name`), `Harnesses`, `Deployments` (`RunAnalyticsDeploymentDimension`: `Id`, `Name`, `AgentId`), `Models`, and `Truncated`.

## Manifests

```csharp
ManifestApply result = await client.Manifests.ApplyAsync(File.ReadAllText("agents.yaml"), dryRun: true);
foreach (ManifestApplyItem item in result.Items)
{
    Console.WriteLine(item.Kind + " " + item.Name + " " + item.Result + " " + item.Message);
    foreach (ManifestFieldChange change in item.Changes) Console.WriteLine("  " + change.Field + ": " + change.Before + " -> " + change.After);
}
```

Each item reports what the apply did, or for a dry run what it would do. Items that are (or would be) `Updated` carry `Changes` (`ManifestFieldChange`: `Field`, `Before`, `After`), with values as strings truncated to 200 characters.

## Errors

Non-success responses throw `GarrisonException` with `StatusCode`, the parsed `Error` (`ErrorResponse`: `Code`, `Message`, `RequestId`, and more), and the raw `ResponseBody`. Validation failures fill `Error.Fields`. The settings routes return 400 with `Error.Errors`, a dictionary keyed by setting path (for example `Audit.RetentionDays`) whose values say what is wrong; nothing is saved when any value is rejected. Every async method accepts a `CancellationToken`.

## Test harness

```bash
dotnet run --project Garrison.Sdk.Test -f net10.0 -- http://127.0.0.1:8700 access_garrison_default secret_garrison_default_change_me
```

The arguments are the base URL, an access key, and a secret key. The values above are the Docker Compose and source-build defaults; on Kubernetes pass the keys from Secret `garrison-secrets` (see "Where the credentials come from"). It prints PASS or FAIL per check and exits non-zero on any failure. When the server rejects the keys, it stops after the token check with one message that says so. See [`../README.md`](../README.md) for the full list of checks.

## License

MIT. See [LICENSE.md](LICENSE.md).

## Model prices

`client.ModelPrices` provides tenant-scoped list, get, create, update, and delete operations for `/model-prices`. Prices start empty and are operator-configured USD rates per million tokens, keyed by exact served model and harness. Optional cache/reasoning rates fall back to input/output rates; explicit zero is free. Configure token inclusion flags for the harness accounting convention (Claude Code cache reads are separate). Harness-reported cost, including zero, takes precedence; estimates set `costEstimated`. Saved run costs survive later price edits or deletion. See [REST API](../../REST_API.md#model-prices).

## Usage quotas

The usage-quota module provides CRUD operations and `client.UsageQuotas.UsageAsync(id, token)` for current daily UTC meters. Scope an entry to Tenant, Agent, or Deployment; null limits are unlimited and zero disallows usage. Limits cover admissions, completed tokens/cost, and active concurrency. Unknown cost keeps admission open and sets `costAccountingComplete=false`. Refusals carry `QuotaExceeded` and name the limit. Only administrators have built-in write grants. See [REST API](../../REST_API.md#usage-quotas) for accounting boundaries and supported CLI budget enforcement.

Usage quotas default to monitoring only. Explicitly set `enforcementEnabled` to `true` (Go: `EnforcementEnabled`, C#: `EnforcementEnabled`) on an active quota to enforce limits. Disabled enforcement does not reject runs or lower harness budgets.

## Interactive console

```sh
dotnet run --project sdk/csharp/Garrison.Sdk.Console -f net10.0 -- http://127.0.0.1:8700
```

Commands: `help`, `health`, `login <tenant> <email>`, `keys`, `tenant <id>`, `agents`, `runs`, `invoke <agent> <input>`, `run <id>`, `events <id>`, `watch <id>`, `pipelines`, `pipeline-runs`, `pipeline-reviews`, `start-pipeline <pipeline> <input>`, and `quit`. Login/keys prompt for credentials without terminal echo and never save them to history or print authentication responses. Ctrl+C cancels an active request or stream. Authenticate, then use `invoke` to start a run and `watch` to follow its ID.

## Executor capabilities

Deployments accept `requiredCapabilities`: `isolation` (`Process`, `Container`, `SandboxedRuntime`), `egressControl`, `filesystemSnapshot`, `sessionContinuation`, `crossNodeRestore`, and optional required `coldStartClass` (`Immediate`, `Cold`, `Warm`). Defaults add no requirement beyond Process. Runs retain an admission-time copy. Workers expose `executorCapabilities`; legacy executor names promise no advanced capabilities. Set `executor: "KubernetesJob"` with Container requirements. Unsupported requirements remain queued with `NoCapableWorker`.

Kubernetes workers can report `warmStart: true` alongside `coldStartClass: "Cold"`; this satisfies either Cold or Warm requirements. Warm support requires enabled warming and Kubernetes RBAC. Explicit Warm requirements reject PersistentVolume workspaces and custom pod resources.

## Trust level

`Deployment.TrustLevel` (`DeploymentTrustLevelEnum`) is `Trusted` (the default) or `Untrusted`. Untrusted runs need at least Container isolation on top of `RequiredCapabilities`: an unset `Executor` resolves to `KubernetesJob`, `Process` is rejected with field code `UntrustedNeedsIsolation`, and a run no Ready worker can isolate stays `Queued` with `BlockedReason` `RunBlockedReasonEnum.NoIsolatingWorker`. `Run.TrustLevel` reports the admitted level. `Tenant.RequireUntrustedDeployments` and `TenantRequest.RequireUntrustedDeployments` control the tenant policy that rejects Trusted deployments with field code `TenantRequiresUntrusted`. See "Deployment trust level" in `REST_API.md`.

## Artifacts

The artifact client lists metadata, reads individual records, downloads raw bytes, creates temporary download links, and deletes files. Deployments select `artifactStoreId` and explicit `artifactGlobs`; empty globs disable automatic collection. Uploads require the active run lease epoch and repair attempt. See [Run artifacts](../../docs/ARTIFACTS.md) for store configuration and API behavior.

## Worker stdio MCP diagnostics

Select a Ready node whose `supportsMcpTests` flag is true, then test the MCP server with that node ID. C# uses `McpServers.TestOnWorkerAsync`, Python uses `mcp_servers.test(id, node_id=...)`, JavaScript uses `mcpServers.test(id, nodeId)`, and Go uses `TestMcpServer(ctx, id, nodeID)`. HTTP testing retains its existing behavior. See [Harness diagnostics](../../docs/HARNESSES.md#test-a-stdio-mcp-server-on-a-worker).

### Optional provider API deployments

The normal agent/deployment methods configure `hrn_builtin_provider_api`: set an explicit model, a `baseUrl` deployment parameter, an `OpenAiApiKey` secret binding, and the usual prompt bindings. Invocation, conversations, approvals, and artifact methods are unchanged. See [provider API configuration](../../docs/PROVIDER_API.md) for parameters and the initial HTTP-tool limitations. Quota enforcement remains optional.

### Management MCP clients

The same agent/deployment/manifest validation, default bindings, versioning, and audit behavior now serve REST and management MCP. Use normal developer/user credentials for MCP configuration tools; hosted run tokens cannot change configuration. Existing SDK REST methods are unchanged. See [management MCP tools](../../docs/MANAGEMENT_MCP.md) for the MCP contract and replacement semantics.
