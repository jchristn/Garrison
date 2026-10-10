# Garrison Go SDK

Go client for the Garrison REST API. Standard library only; Go 1.21+.

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

`Tenants`, `Users`, `Credentials`, `Roles`, `Permissions`, `RolePermissions`, `UserRoleAssignments`, `CredentialScopeAssignments`, `Agents`, `Deployments`, `HarnessProfiles`, `PromptTemplates`, `McpServers`, `Secrets`, `WorkspaceTemplates`, `ArtifactStores`, `Nodes`, and `NodePools` provide `List`, `Get`, `Create`, `Update`, `Delete`, and `Action` (for sub-routes such as `rotate` or `cordon`). They decode into whatever you pass as `out`: a typed struct such as `garrison.Agent` or a `map[string]any`. `Manifests`, `Runs`, and `Analytics` are fully typed. For anything else, `client.Do(ctx, method, path, query, body, &out)` sends an authenticated request.

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

## Run timing and usage fields

`garrison.Run` carries timing and usage measurements. Pointer fields are nil when the server could not measure them (the server omits most of them from JSON, and sends `outputTokensPerSecond` as `null`):

- `FirstTokenUTC`, `LastTokenUTC` (`*string`): ISO 8601 UTC times of the first and last model output event.
- `TimeToFirstTokenMs`, `StreamingMs`, `ExecutionMs`, `QueueMs`, `TotalMs` (`*int64`): durations in milliseconds.
- `DelegationWaitMs` (`*int64`): time the run spent waiting on child runs it started (delegation), measured from server timestamps of the runs whose `parentRunId` is this run.
- `TimeToFirstTokenExcludingDelegationMs` (`*int64`): `TimeToFirstTokenMs` minus the delegation wait that happened before the first token; never negative.
- `OutputTokensPerSecond` (`*float64`): nil when there was no streaming window or it was shorter than 100 ms.
- `ReasoningTokens`, `ToolCallCount` (`int64`, default 0), alongside `InputTokens`, `OutputTokens`, `CachedTokens`, and `CostUSD`.

`Run.BlockedReason` (`*string`) is computed by the server when a run is read. It is nil unless the run is `Queued` and no Ready worker can run it. Values: `NoReadyWorker` (no node is Ready), `NoCapableWorker` (no Ready node reports the run's harness), `NoMatchingPool` (capable nodes exist but none matches the deployment's node pool or node selector). The tenant overview counts these runs as `blockedRuns`. See "Blocked runs" in `REST_API.md`.

When the agent has an output schema, the server validates each run's final output against it. `Run.OutputSchemaValid` (`*bool`) is set after validation and nil when nothing was validated, `Run.SchemaValidationErrors` (`*string`) holds the first few errors of a failed validation, and `Run.RepairAttempts` (`int`, 0 or 1) counts the structured output repair Garrison makes when the harness can resume its session. A run whose output still does not validate fails with outcome `RunOutcomeSchemaValidationFailed`; the `RunOutcome*` constants list every outcome. See "Structured output validation" in `REST_API.md`.

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
