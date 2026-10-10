# Garrison Go SDK

Go client for the Garrison REST API. Standard library only; Go 1.21+.

## Install

```bash
go get github.com/jchristn/Garrison/sdk/go
```

## Quick start

```go
import garrison "github.com/jchristn/Garrison/sdk/go"

client := garrison.NewClient("http://127.0.0.1:8700")
if _, err := client.LoginWithKeys(ctx, "access_...", "secret_..."); err != nil {
	return err
}
run, err := client.Agents.Invoke(ctx, "my-agent", garrison.InvokeRequest{Input: "Summarize the release notes", Wait: true, WaitSeconds: 120})
if err != nil {
	return err
}
fmt.Println(run.Status, run.ResultText)
```

Every call takes a `context.Context`.

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

`garrison.Run` carries timing and usage measurements. Pointer fields are nil when the server could not measure them (the server omits them from JSON):

- `FirstTokenUTC`, `LastTokenUTC` (`*string`): ISO 8601 UTC times of the first and last model output event.
- `TimeToFirstTokenMs`, `StreamingMs`, `ExecutionMs`, `QueueMs`, `TotalMs` (`*int64`): durations in milliseconds.
- `OutputTokensPerSecond` (`*float64`).
- `ReasoningTokens`, `ToolCallCount` (`int64`, default 0), alongside `InputTokens`, `OutputTokens`, `CachedTokens`, and `CostUSD`.

`Run.BlockedReason` (`*string`) is computed by the server when a run is read. It is nil unless the run is `Queued` and no Ready worker can run it. Values: `NoReadyWorker` (no node is Ready), `NoCapableWorker` (no Ready node reports the run's harness), `NoMatchingPool` (capable nodes exist but none matches the deployment's node pool or node selector). The tenant overview counts these runs as `blockedRuns`. See "Blocked runs" in `REST_API.md`.

## Run analytics

`client.Analytics.Runs(ctx, garrison.AnalyticsQuery{...})` calls `GET /v1.0/api/tenants/{tenantId}/analytics/runs` and returns a `*garrison.RunAnalytics` with `Totals` and one or more `Series`, each holding time `Buckets` (`StartUTC` plus the same metrics as `Totals`). Query fields are optional: `From` and `To` (ISO 8601 UTC), `Interval` (`minute`, `hour`, `day`, `week`, or `auto`), `AgentID`, `HarnessType`, `DeploymentID`, `Model` (served model; `unknown` matches runs without a recorded model), and `GroupBy` (`none`, `agent`, `harness`, `model`, or `harnessModel`). With `harnessModel` each series key is `Harness|model` (for example `ClaudeCode|claude-sonnet-4-5`) and its label is `Harness / model`. `BucketSeconds` in the response is the authoritative bucket size.

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

## Errors

Non-2xx responses return `*garrison.Error` with `StatusCode`, `Code`, `Message`, and `Body`. `garrison.IsStatus(err, 409)` checks the status.

## Test harness

```bash
go run ./cmd/testharness http://127.0.0.1:8700 access_garrison_default secret_garrison_default_change_me
```
