# Garrison.Sdk

C# client for the Garrison REST API. Targets .NET 8 and .NET 10.

## Install

```bash
dotnet add package Garrison.Sdk --prerelease
```

## Quick start

```csharp
using Garrison.Sdk;
using Garrison.Sdk.Models;
using Garrison.Sdk.Requests;

using (GarrisonClient client = new GarrisonClient("http://127.0.0.1:8700"))
{
    await client.LoginWithKeysAsync("access_...", "secret_...");

    Run run = await client.Agents.InvokeAsync("my-agent", new InvokeRequest
    {
        Input = "Summarize the release notes",
        Wait = true,
        WaitSeconds = 120
    });

    Console.WriteLine(run.Status + ": " + run.ResultText);
}
```

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

`GarrisonClient` exposes one client per resource: `Tenants`, `Users`, `Credentials`, `Roles`, `Permissions`, `RolePermissions`, `UserRoleAssignments`, `CredentialScopeAssignments`, `Agents`, `Deployments`, `HarnessProfiles`, `PromptTemplates`, `McpServers`, `Secrets`, `WorkspaceTemplates`, `ArtifactStores`, `Manifests`, `Runs`, `Analytics`, `Nodes`, `NodePools`, `RequestHistory`, `Audit`, and `Settings`. Resource clients provide `ListAsync`, `GetAsync`, `CreateAsync`, `UpdateAsync`, and `DeleteAsync`, plus resource-specific operations such as `Agents.InvokeAsync`, `Credentials.RotateAsync`, and `PromptTemplates.RenderAsync`.

Models, enums, request types, and response types live in `Garrison.Sdk.Models`, `Garrison.Sdk.Enums`, `Garrison.Sdk.Requests`, and `Garrison.Sdk.Responses`. They mirror the server contracts.

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
| `OutputTokensPerSecond` | `double?` | Output tokens over the streaming window. |
| `ReasoningTokens` | `long` | Reasoning tokens (default 0). |
| `ToolCallCount` | `int` | Tool calls made during the run (default 0). |

Nullable properties are null when the value could not be measured.

## Blocked runs

`Run.BlockedReason` (`RunBlockedReasonEnum?`) is computed by the server when a run is read. It is null unless the run is `Queued` and no Ready worker can run it. Values: `NoReadyWorker` (no node is Ready), `NoCapableWorker` (no Ready node reports the run's harness), `NoMatchingPool` (capable nodes exist but none matches the deployment's node pool or node selector). The tenant overview counts these runs as `OverviewResponse.BlockedRuns`. See "Blocked runs" in `REST_API.md`.

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

Every query member is optional. `Interval` is `Auto`, `Minute`, `Hour`, `Day`, or `Week`. `GroupBy` is `None`, `Agent`, `Harness`, `Model`, or `HarnessModel` (sent as `harnessModel`); with `HarnessModel` each series key is `Harness|model` (for example `ClaudeCode|claude-sonnet-4-5`) and its label is `Harness / model`. `AgentId`, `DeploymentId`, `HarnessType`, and `Model` filter the runs; `Model` matches the run's served model, and `"unknown"` matches runs without a recorded model. `BucketSeconds` in the response is the authoritative bucket size, and `Truncated` is true when the server hit its 100,000-run cap. The server returns 400 (thrown as `GarrisonException`) when `From` is not earlier than `To`, when the range needs more than 400 buckets, or when a parameter is invalid.

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
```

## Errors

Non-success responses throw `GarrisonException` with `StatusCode`, `Code`, `Message`, and the raw response body. Every async method accepts a `CancellationToken`.

## Test harness

```bash
dotnet run --project Garrison.Sdk.Test -f net10.0 -- http://127.0.0.1:8700 access_garrison_default secret_garrison_default_change_me
```

It prints PASS or FAIL per check and exits non-zero on any failure. See [`../README.md`](../README.md) for the full list of checks.

## License

MIT. See [LICENSE.md](LICENSE.md).
