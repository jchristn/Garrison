# Garrison Go SDK

Go client for the Garrison REST API. The SDK library uses only the standard library; Go 1.21+. The optional interactive console uses golang.org/x/term to hide terminal credentials.

## Install

There is no tagged release of the Go module yet. Until there is, point your module at your checkout of the repository with a `replace` directive:

```bash
go mod edit -require=github.com/jchristn/Garrison/sdk/go@v0.0.0 -replace=github.com/jchristn/Garrison/sdk/go=/path/to/Garrison/sdk/go
go mod tidy
```

If your machine can fetch `github.com/jchristn/Garrison`, `go get github.com/jchristn/Garrison/sdk/go@main` also works and records a pseudo-version for the current commit.

## Quick start

```go
import garrison "github.com/jchristn/Garrison/sdk/go"

client := garrison.NewClient("http://127.0.0.1:8700")
// The same email and password you use in the dashboard.
if _, err := client.Login(ctx, "admin@garrison", "password", "default"); err != nil {
	return err
}
run, err := client.Agents.Invoke(ctx, "my-agent", garrison.InvokeRequest{Input: "Summarize the release notes", Wait: true, WaitSeconds: 120})
if err != nil {
	return err
}
fmt.Println(run.Status, run.ResultText)
```

Every call takes a `context.Context`.

To sign in with an access key pair instead, call `client.LoginWithKeys(ctx, accessKey, secretKey)`. See "Where the credentials come from" below.

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

Responses are dictionaries with the server's camelCase field names, exactly as documented in `REST_API.md`.

## Authentication

`Login`, `LoginWithKeys`, `UseToken`, `UseAccessKey`, `UseSignedRequests` (HMAC-SHA256), and `UseAdminAPIKey`. `TokenDetails` and `Logout` manage the current token.

## Resources

`Tenants`, `Users`, `Credentials`, `Roles`, `Permissions`, `RolePermissions`, `UserRoleAssignments`, `CredentialScopeAssignments`, `Agents`, `Deployments`, `HarnessProfiles`, `PromptTemplates`, `McpServers`, `Secrets`, `WorkspaceTemplates`, `ArtifactStores`, `Nodes`, and `NodePools` provide `List`, `Get`, `Create`, `Update`, `Delete`, and `Action` (for sub-routes such as `rotate` or `cordon`). They decode into whatever you pass as `out`: a typed struct such as `garrison.Agent` or a `map[string]any`. `Pipelines` adds typed `Start` and `Preview` to the same methods. `Manifests`, `Runs`, `Conversations`, `Approvals`, `PipelineRuns`, `PipelineReviews`, `Analytics`, and `ControlNodes` are fully typed. For anything else, `client.Do(ctx, method, path, query, body, &out)` sends an authenticated request.

Control-plane replicas are read-only: `client.ControlNodes.List(ctx, opts)` returns a `*garrison.ControlNodeList` (a page of `garrison.ControlNode` plus `RespondingNodeID`, the replica that answered) and `client.ControlNodes.Get(ctx, nodeID)` reads one replica. `Status` is one of the `ControlNodeStatus*` constants (`Starting`, `Ready`, `Draining`, `Offline`); `IsLeader` and `LeaderEpoch` (leader only) come from the coordination lease.

## Permission approvals

When a deployment has `ApprovalsEnabled` set (Claude Code profiles, and Codex profiles with CodexAppServer delivery), the harness relays permission prompts to Garrison. The deployment's `ApprovalRules` (`garrison.DeploymentApprovalRule`: `Action`, a `Pattern` in Claude Code rule syntax such as `Bash(git status:*)` or `mcp__github__*`, optional `InputPattern`, and `Description`) decide each request, and `ApprovalDefaultAction` (one of the `ApprovalRuleAction*` constants) covers requests no rule matches. `Ask` sends the request to a person, who has `ApprovalTimeoutSeconds` (10 to 3600, default 300) before `ApprovalTimeoutDecision` applies.

```go
pending, err := client.Approvals.List(ctx, garrison.ApprovalFilter{Status: garrison.ApprovalStatusPending})
decided, err := client.Approvals.Decide(ctx, pending.Objects[0].ID, garrison.ApprovalDecideRequest{
	Decision: garrison.ApprovalDecisionAllow, Reason: "Looks safe", Remember: true,
})
result, err := client.Approvals.Check(ctx, deploymentID, garrison.ApprovalCheckRequest{
	ToolName: "Bash", Input: &garrison.ApprovalToolInput{Command: "git status --short"},
})
```

`Approvals.List` filters by status, run, root run, agent, deployment, decision source, and time range (`FromUTC`, `ToUTC`); for a pending count, use `MaxResults: 1` and read `TotalRecords`. `Approvals.Get` returns an error matching `garrison.IsStatus(err, 404)` for an approval outside the tenant. `Approvals.Decide` fails with 409 (`ApprovalNotPending`) when the approval was already decided, and `Remember` needs Update on the approval's deployment. `Approvals.Check` records nothing and returns a `*garrison.ApprovalCheckResponse`. `garrison.Run` has `PendingApprovals`, `AwaitingApproval` (the run stays `Running` while it waits), and `ApprovalWaitMs`. The deployment approval fields use `omitempty`: zero values are left out of requests and the server applies its defaults.

## Pipelines

A pipeline runs agents as ordered stages. Each stage gets the caller's input plus the earlier stages' results, rendered by a `PipelineStage` prompt template, and a stage with `RequiresReview` waits for a person before the next stage starts.

```go
var pipeline garrison.Pipeline
err := client.Pipelines.Create(ctx, garrison.Pipeline{Name: "draft-and-edit", Stages: []garrison.PipelineStage{
	{Name: "draft", AgentID: writerID, RequiresReview: true},
	{Name: "edit", AgentID: editorID},
}}, &pipeline)
run, err := client.Pipelines.Start(ctx, pipeline.ID, garrison.PipelineStartRequest{
	Input: "Announce the release", Wait: true, WaitSeconds: 60,
}, "release-announcement-1") // idempotency key, sent as the Idempotency-Key header; "" for none
reviews, err := client.PipelineReviews.List(ctx, garrison.PipelineReviewFilter{
	Status: garrison.PipelineReviewStatusPending, PipelineRunID: run.ID,
})
_, err = client.PipelineReviews.Decide(ctx, reviews.Objects[0].ID, garrison.PipelineReviewDecideRequest{
	Decision: garrison.PipelineReviewDecisionApprove, Comment: "Keep it short",
})
finished, err := client.PipelineRuns.Get(ctx, run.ID, 60) // waits until it ends or waits for a review
```

`Pipelines` takes an identifier or a name for `Get`, `Update`, `Delete`, `Start`, and `Preview`. `Update` advances the pipeline's `Version`; pipeline runs already started keep their snapshot. `Delete` answers 409 (`PipelineInUse`) while pipeline runs are active. `Preview` renders every stage prompt from sample input and sample earlier outputs. Starting needs Execute on the pipeline and on every stage agent; a repeated idempotency key with the same input returns the same pipeline run, and different input answers 409.

`PipelineRuns.List` filters by pipeline, status, caller, and time range. `Get` with `waitSeconds` above 0 (at most 600) waits until the pipeline run ends or waits for a review; the detail carries `Stages`, `Reviews`, and `Runs` (stage run summaries). `Cancel` also cancels the pending review and the current stage run; `Retry` resumes a Failed, TimedOut, or Cancelled pipeline run at the stage where it stopped; `Delete` removes a finished pipeline run (stage runs are kept).

`PipelineReviews.Decide` takes `PipelineReviewDecisionApprove` (the comment reaches the next stage as review notes), `PipelineReviewDecisionRequestChanges` (comment required; the stage runs again with it, at most `MaxRevisions` times, then 409 `RevisionLimitReached`), or `PipelineReviewDecisionReject` (the pipeline run fails). A review that is no longer pending answers 409 (`ReviewNotPending`). Reviews are authorized as approvals (Approval Read and Update). Run tokens cannot use pipelines or reviews.

The pipeline status, outcome, stage status, review status, decision, and decision source values are the `PipelineRunStatus*`, `PipelineRunOutcome*`, `PipelineStageStatus*`, `PipelineReviewStatus*`, `PipelineReviewDecision*`, and `PipelineReviewSource*` constants. Optional `Pipeline` and `PipelineStage` fields use `omitempty`, so zero values take the server defaults: `Active` nil means true, `OutputCharLimit` 0 means 16000, `MaxAttempts` 0 means 1, and `MaxRevisions` nil means 3.

## Streaming run events

```go
queued, _ := client.Runs.Create(ctx, garrison.RunCreateRequest{AgentName: "my-agent", Input: "Hello"})
err := client.Runs.Stream(ctx, queued.ID, 0, func(item garrison.RunStreamItem) bool {
	if item.Event != nil {
		fmt.Println(item.Event.EventType, item.Event.Text)
	}
	if item.Run != nil {
		fmt.Println("finished:", item.Run.Status)
	}
	return true
})
```

The stream ends after `run.completed`. `Runs.Events` polls and `Runs.WaitForCompletion` waits for a terminal status.

## Conversations

A conversation is a multi-turn session with one agent. Each turn is a run, and every turn after the first resumes the harness session the earlier turns built, on the node that holds that session's directories. Set `StartConversation: true` on an `InvokeRequest` or `RunCreateRequest` to start one; the returned run's `ConversationID` names it. Set `ConversationID` to send the next turn. Deployment tests take the same body: `client.Deployments.Action(ctx, id, "test", garrison.InvokeRequest{...}, &run)`.

```go
first, err := client.Agents.Invoke(ctx, "my-agent", garrison.InvokeRequest{Input: "Plan the migration", Wait: true, StartConversation: true})
conversationID := *first.ConversationID

second, err := client.Agents.Invoke(ctx, "my-agent", garrison.InvokeRequest{Input: "Now write step 1", Wait: true, ConversationID: conversationID})
fmt.Println(second.ConversationTurn, second.ResultText) // 2 ...

conversation, err := client.Conversations.Get(ctx, conversationID)
turns, err := client.Conversations.ListRuns(ctx, conversationID, 0, 0) // oldest first
err = client.Conversations.Delete(ctx, conversationID)                // the runs are kept
```

Turns of one conversation never overlap. A turn sent while the previous one is unfinished is refused, not queued, with HTTP 409 and code `ConversationBusy`; wait for the previous run (or cancel it) and send again:

```go
_, err := client.Agents.Invoke(ctx, "my-agent", garrison.InvokeRequest{Input: "Next", Wait: true, ConversationID: conversationID})
var apiErr *garrison.Error
if errors.As(err, &apiErr) && apiErr.StatusCode == 409 && apiErr.Code == "ConversationBusy" {
	if c, err := client.Conversations.Get(ctx, conversationID); err == nil && c.ActiveRunID != nil {
		_, _ = client.Runs.WaitForCompletion(ctx, *c.ActiveRunID)
	}
}
```

Other 409 codes are `ConversationAgentMismatch` (the conversation belongs to another agent), `ConversationDeploymentMismatch` (the request names a deployment other than the conversation's), and `ConversationDeploymentUnavailable` (the conversation's deployment was deleted). An unknown `ConversationID` returns 404. `Conversations.Delete` also returns 409 `ConversationBusy` while a turn is unfinished.

`Conversations.List(ctx, garrison.ConversationFilter{...})` filters by `AgentID`, `ContextID` (the A2A context the conversation was created for), `CallerID`, and `Search`, with `Ordering`, `MaxResults`, and `Skip`. `RunFilter.ConversationID` lists a conversation's runs through `Runs.List`. A `garrison.Conversation` carries `TurnCount`, `SessionID`, `AffinityNodeID` and `AffinityNodeName`, `ActiveRunID`, `LastRunID`, `Busy` (true while a turn is unfinished), `FallbackCount`, and `LastFallbackReason`.

Each turn's `Run` has `ConversationID` (`*string`), `ConversationTurn` (`int`: 1 for the first turn, 0 outside a conversation), `ResumeSessionID`, `AffinityNodeID`, `AffinityUntilUTC`, and `ConversationFallbackReason`. A fallback happens when the turn cannot resume and starts a fresh session seeded with the transcript of the earlier turns instead; the `ConversationFallback*` constants list the values (`AffinityNodeLost`, `AffinityWaitExpired`, `WorkspaceLost`, `SessionMissing`, `HarnessChanged`, `ResumeUnsupported`, `ExecutorWithoutState`). A turn that could not even fall back ends with `RunOutcomeConversationStateLost`. See "Conversations" in `REST_API.md`.

## Run timing and usage fields

`garrison.Run` carries timing and usage measurements. Pointer fields are nil when the server could not measure them (the server omits most of them from JSON, and sends `outputTokensPerSecond` as `null`):

- `FirstTokenUTC`, `LastTokenUTC` (`*string`): ISO 8601 UTC times of the first and last model output event.
- `TimeToFirstTokenMs`, `StreamingMs`, `ExecutionMs`, `QueueMs`, `TotalMs` (`*int64`): durations in milliseconds.
- `DelegationWaitMs` (`*int64`): time the run spent waiting on child runs it started (delegation), measured from server timestamps of the runs whose `parentRunId` is this run.
- `TimeToFirstTokenExcludingDelegationMs` (`*int64`): `TimeToFirstTokenMs` minus the delegation wait that happened before the first token; never negative.
- `OutputTokensPerSecond` (`*float64`): nil when there was no streaming window or it was shorter than 100 ms.
- `ReasoningTokens`, `ToolCallCount` (`int64`, default 0), alongside `InputTokens`, `OutputTokens`, `CachedTokens`, and `CostUSD`.

`Run.BlockedReason` (`*string`) is computed by the server when a run is read. It is nil unless the run is `Queued` and no Ready worker can run it. Values: `NoReadyWorker` (no node is Ready), `NoCapableWorker` (no Ready node reports the run's harness), `NoMatchingPool` (capable nodes exist but none matches the deployment's node pool or node selector). The tenant overview counts these runs as `blockedRuns`. See "Blocked runs" in `REST_API.md`.

Runs stopped by a worker run guard end `Failed` with outcome `RunOutcomeRepetitionDetected` (the assistant text degenerated into a short repeated unit or into text with no letters or digits), `RunOutcomeOutputLimitExceeded` (more assistant text than the deployment's `maxAssistantChars`), or `RunOutcomeNoProgress` (nothing happened for `noProgressSeconds`). The partial output is in `Run.ResultText`, and the run has one `Warning` event with code `RunGuardTriggered`. A waiting invoke cancels its run when the connection drops (for example when its `context.Context` is cancelled); set `InvokeRequest.CancelOnDisconnect` to a pointer to `false` to keep the run going. See "Run guards" and "Cancellation" in `REST_API.md`.

When the agent has an output schema, the server validates each run's final output against it. `Run.OutputSchemaValid` (`*bool`) is set after validation and nil when nothing was validated, `Run.SchemaValidationErrors` (`*string`) holds the first few errors of a failed validation, and `Run.RepairAttempts` (`int`, 0 or 1) counts the structured output repair Garrison makes when the harness can resume its session. A run whose output still does not validate fails with outcome `RunOutcomeSchemaValidationFailed`; the `RunOutcome*` constants list every outcome. See "Structured output validation" in `REST_API.md`.

## Executors and run pods

`Deployment.Executor` is `RunExecutorProcess` (the default) or `RunExecutorKubernetesJob` (a Kubernetes Job per run); nil uses the node pool's `NodePool.DefaultExecutor`, then Process. `Deployment.PodResources` (`RunPodResources`) sets the run pod's requests and limits as Kubernetes quantities. `Run.Executor` records the executor, `Node.Executors` lists what a worker can run, and only nodes reporting a run's executor claim it. `WorkspaceKindPersistentVolume` with `WorkspaceTemplate.PersistentVolumeClaim` mounts an existing claim at the workspace path (KubernetesJob runs only). `RunOutcomePodFailed` marks run pods that failed outside the harness. See `docs/KUBERNETES.md`.

## Secret status

The control plane refreshes ChatGPT logins stored in `CodexAuthJson` secrets itself, shortly before the access token expires, and writes the rotated tokens back to the secret. When OpenAI rejects the stored refresh token for good (reused, expired, or revoked), the secret's status becomes `NeedsReauthentication`.

Decode secrets into `garrison.Secret`: `Status` (`SecretStatusOk` or `SecretStatusNeedsReauthentication`), `StatusMessage` (the provider error, empty when `Ok`), `StatusUTC` (when the status left `Ok`), `RefreshedUTC` (when the control plane last refreshed the login itself), and `AccessTokenExpiresUTC` (expiry of the stored access token; `CodexAuthJson` only). To find secrets that need attention, list them into `garrison.EnumerationResult[garrison.Secret]` and check `Status == garrison.SecretStatusNeedsReauthentication`, then set a new value with `client.Secrets.Action(ctx, id, "rotate", map[string]string{"value": newAuthJSON}, nil)`. A run whose deployment binds a secret in that state fails before it starts, with outcome `NotCredentialed` and an error message that starts with `SecretNeedsReauthentication:`. (`SecretRefreshFailed:` means the access token was expired and the refresh failed for a passing reason such as a network error; the secret stays `Ok` and a retry may work.) The fix is to replace the value: sign in again with `codex login` using a `CODEX_HOME` nothing else uses, then set the new `auth.json` as the secret's value. Setting a value returns the status to `Ok`. Do not keep using that login on another machine, because both copies share one refresh token; for shared deployments an `OpenAiApiKey` secret is simpler. See "Codex logins" in `docs/SECURITY.md`.

## Run analytics

`client.Analytics.Runs(ctx, garrison.AnalyticsQuery{...})` calls `GET /v1.0/api/tenants/{tenantId}/analytics/runs` and returns a `*garrison.RunAnalytics` with `Totals` and one or more `Series`, each holding time `Buckets` (`StartUTC` plus the same metrics as `Totals`). Query fields are optional: `From` and `To` (ISO 8601 UTC), `Interval` (`minute`, `hour`, `day`, `week`, or `auto`), `AgentID`, `HarnessType`, `DeploymentID`, `Model` (served model; `unknown` matches runs without a recorded model), and `GroupBy` (`none`, `agent`, `harness`, `model`, or `harnessModel`). With `harnessModel` each series key is `Harness|model` (for example `ClaudeCode|claude-sonnet-5-5`) and its label is `Harness / model`. `BucketSeconds` in the response is the authoritative bucket size. `AnalyticsMetrics` includes `TimeToFirstTokenExcludingDelegationMsAvg`, `TimeToFirstTokenExcludingDelegationMsP50`, `TimeToFirstTokenExcludingDelegationMsP95`, and `DelegationWaitMsAvg` (all `*float64`, nil without samples), so agents that delegate can be compared with agents that answer directly.

```go
now := time.Now().UTC()
stats, err := client.Analytics.Runs(ctx, garrison.AnalyticsQuery{
	From:     now.Add(-24 * time.Hour).Format(time.RFC3339),
	To:       now.Format(time.RFC3339),
	Interval: "hour",
	GroupBy:  "agent",
})
if err != nil {
	return err
}
fmt.Println(stats.Totals.Runs, stats.Totals.CostUSD)
for _, series := range stats.Series {
	fmt.Println(series.Label, len(series.Buckets))
}
```

The server returns HTTP 400 when `From` is not before `To`, when the range needs more than 400 buckets, or for an invalid interval, group, harness type, or date.

`client.Analytics.Dimensions(ctx, from, to)` calls `GET /v1.0/api/tenants/{tenantId}/analytics/runs/dimensions` and returns a `*garrison.AnalyticsDimensions` listing the distinct `Agents` (`ID`, `Name`), `Harnesses`, `Deployments` (`ID`, `Name`, `AgentID`), and `Models` among runs in the range, plus `Truncated`. Pass empty strings for the server default range (the last 24 hours). Use it to fill filter pickers, then feed a value back into `AnalyticsQuery`:

```go
dims, err := client.Analytics.Dimensions(ctx, now.Add(-7*24*time.Hour).Format(time.RFC3339), now.Format(time.RFC3339))
if err != nil {
	return err
}
for _, model := range dims.Models {
	byModel, err := client.Analytics.Runs(ctx, garrison.AnalyticsQuery{Model: model, GroupBy: "harnessModel"})
	if err != nil {
		return err
	}
	fmt.Println(model, byModel.Totals.Runs)
}
```

## Manifests

```go
result, err := client.Manifests.Apply(ctx, yamlText, true, false) // dry run
if err != nil {
	return err
}
items, err := result.ParsedItems()
if err != nil {
	return err
}
for _, item := range items {
	fmt.Println(item.Kind, item.Name, item.Result, item.Message)
	for _, change := range item.Changes {
		fmt.Println("  ", change.Field, change.Before, change.After)
	}
}
```

Each `ManifestApplyItem` reports what the apply did, or for a dry run what it would do. Items that are (or would be) `Updated` carry `Changes` (`ManifestFieldChange`: `Field`, `Before`, `After`; `Before` and `After` are `*string`), with values truncated to 200 characters.

## Errors

Non-2xx responses return `*garrison.Error` with `StatusCode`, `Code`, `Message`, `RequestID`, and `Body`. Validation failures fill `Fields`. The settings routes return 400 with `Errors`, a map keyed by setting path (for example `Audit.RetentionDays`) whose values say what is wrong; nothing is saved when any value is rejected. `garrison.IsStatus(err, 409)` checks the status.

## Test harness

```bash
go run ./cmd/testharness http://127.0.0.1:8700 access_garrison_default secret_garrison_default_change_me
```

The arguments are the base URL, an access key, and a secret key. The values above are the Docker Compose and source-build defaults; on Kubernetes pass the keys from Secret `garrison-secrets` (see "Where the credentials come from"). When the server rejects the keys, the harness stops after the token check with one message that says so.

## Model prices

`client.ModelPrices` provides tenant-scoped list, get, create, update, and delete operations for `/model-prices`. Prices start empty and are operator-configured USD rates per million tokens, keyed by exact served model and harness. Optional cache/reasoning rates fall back to input/output rates; explicit zero is free. Configure token inclusion flags for the harness accounting convention (Claude Code cache reads are separate). Harness-reported cost, including zero, takes precedence; estimates set `costEstimated`. Saved run costs survive later price edits or deletion. See [REST API](../../REST_API.md#model-prices).

## Usage quotas

The usage-quota module provides CRUD operations and `client.UsageQuotas.Usage(ctx, id)` for current daily UTC meters. Scope an entry to Tenant, Agent, or Deployment; null limits are unlimited and zero disallows usage. Limits cover admissions, completed tokens/cost, and active concurrency. Unknown cost keeps admission open and sets `costAccountingComplete=false`. Refusals carry `QuotaExceeded` and name the limit. Only administrators have built-in write grants. See [REST API](../../REST_API.md#usage-quotas) for accounting boundaries and supported CLI budget enforcement.

Usage quotas default to monitoring only. Explicitly set `enforcementEnabled` to `true` (Go: `EnforcementEnabled`, C#: `EnforcementEnabled`) on an active quota to enforce limits. Disabled enforcement does not reject runs or lower harness budgets.

## Interactive console

```sh
cd sdk/go && go run ./cmd/console http://127.0.0.1:8700
```

Commands: `help`, `health`, `login <tenant> <email>`, `keys`, `tenant <id>`, `agents`, `runs`, `invoke <agent> <input>`, `run <id>`, `events <id>`, `watch <id>`, `pipelines`, `pipeline-runs`, `pipeline-reviews`, `start-pipeline <pipeline> <input>`, and `quit`. Login/keys prompt for credentials without terminal echo and never save them to history or print authentication responses. Ctrl+C cancels an active request or stream. Authenticate, then use `invoke` to start a run and `watch` to follow its ID.

## Executor capabilities

Deployments accept `requiredCapabilities`: `isolation` (`Process`, `Container`, `SandboxedRuntime`), `egressControl`, `filesystemSnapshot`, `sessionContinuation`, `crossNodeRestore`, and optional required `coldStartClass` (`Immediate`, `Cold`, `Warm`). Defaults add no requirement beyond Process. Runs retain an admission-time copy. Workers expose `executorCapabilities`; legacy executor names promise no advanced capabilities. Set `executor: "KubernetesJob"` with Container requirements. Unsupported requirements remain queued with `NoCapableWorker`.

Kubernetes workers can report `warmStart: true` alongside `coldStartClass: "Cold"`; this satisfies either Cold or Warm requirements. Warm support requires enabled warming and Kubernetes RBAC. Explicit Warm requirements reject PersistentVolume workspaces and custom pod resources.

## Artifacts

The artifact client lists metadata, reads individual records, downloads raw bytes, creates temporary download links, and deletes files. Deployments select `artifactStoreId` and explicit `artifactGlobs`; empty globs disable automatic collection. Uploads require the active run lease epoch and repair attempt. See [Run artifacts](../../docs/ARTIFACTS.md) for store configuration and API behavior.

## Worker stdio MCP diagnostics

Select a Ready node whose `supportsMcpTests` flag is true, then test the MCP server with that node ID. C# uses `McpServers.TestOnWorkerAsync`, Python uses `mcp_servers.test(id, node_id=...)`, JavaScript uses `mcpServers.test(id, nodeId)`, and Go uses `TestMcpServer(ctx, id, nodeID)`. HTTP testing retains its existing behavior. See [Harness diagnostics](../../docs/HARNESSES.md#test-a-stdio-mcp-server-on-a-worker).

### Optional provider API deployments

The normal agent/deployment methods configure `hrn_builtin_provider_api`: set an explicit model, a `baseUrl` deployment parameter, an `OpenAiApiKey` secret binding, and the usual prompt bindings. Invocation, conversations, approvals, and artifact methods are unchanged. See [provider API configuration](../../docs/PROVIDER_API.md) for parameters and the initial HTTP-tool limitations. Quota enforcement remains optional.

### Management MCP clients

The same agent/deployment/manifest validation, default bindings, versioning, and audit behavior now serve REST and management MCP. Use normal developer/user credentials for MCP configuration tools; hosted run tokens cannot change configuration. Existing SDK REST methods are unchanged. See [management MCP tools](../../docs/MANAGEMENT_MCP.md) for the MCP contract and replacement semantics.
