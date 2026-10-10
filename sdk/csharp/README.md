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

`GarrisonClient` exposes one client per resource: `Tenants`, `Users`, `Credentials`, `Roles`, `Permissions`, `RolePermissions`, `UserRoleAssignments`, `CredentialScopeAssignments`, `Agents`, `Deployments`, `HarnessProfiles`, `PromptTemplates`, `McpServers`, `Secrets`, `WorkspaceTemplates`, `ArtifactStores`, `Manifests`, `Runs`, `Analytics`, `Nodes`, `ControlNodes`, `NodePools`, `RequestHistory`, `Audit`, and `Settings`. Resource clients provide `ListAsync`, `GetAsync`, `CreateAsync`, `UpdateAsync`, and `DeleteAsync`, plus resource-specific operations such as `Agents.InvokeAsync`, `Credentials.RotateAsync`, and `PromptTemplates.RenderAsync`.

Control-plane replicas are read-only: `ControlNodes.ListAsync(query)` returns a `ControlNodeListResponse` (a page of `ControlNode` plus `RespondingNodeId`, the replica that answered) and `ControlNodes.GetAsync(id)` reads one replica by node ID. Each `ControlNode` carries `Status` (`ControlNodeStatusEnum`: `Starting`, `Ready`, `Draining`, `Offline`), version, schema version, backplane, start and heartbeat times, activity (`ActiveRequests`, `OpenStreams`, `HeldLongPolls`), `IsLeader`, and `LeaderEpoch` (leader only). `OverviewResponse` also has `ControlNodesByStatus` and `LeaderNodeId`. Reading needs Read on Node, like worker nodes.

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
| `DelegationWaitMs` | `long?` | Time the run spent waiting on child runs it started (delegation), measured from server timestamps of the runs whose `ParentRunId` is this run. |
| `TimeToFirstTokenExcludingDelegationMs` | `long?` | `TimeToFirstTokenMs` minus the delegation wait that happened before the first token; never negative. |
| `OutputTokensPerSecond` | `double?` | Output tokens over the streaming window. |
| `ReasoningTokens` | `long` | Reasoning tokens (default 0). |
| `ToolCallCount` | `int` | Tool calls made during the run (default 0). |

Nullable properties are null when the value could not be measured. On the wire, most of these fields are left out when there is no value, while `outputTokensPerSecond` is always present and `null` when it cannot be measured (no streaming window, or one shorter than 100 ms). Both deserialize to null here.

## Blocked runs

`Run.BlockedReason` (`RunBlockedReasonEnum?`) is computed by the server when a run is read. It is null unless the run is `Queued` and no Ready worker can run it. Values: `NoReadyWorker` (no node is Ready), `NoCapableWorker` (no Ready node reports the run's harness), `NoMatchingPool` (capable nodes exist but none matches the deployment's node pool or node selector). The tenant overview counts these runs as `OverviewResponse.BlockedRuns`. See "Blocked runs" in `REST_API.md`.

When the agent has an output schema, the server validates each run's final output against it. `Run.OutputSchemaValid` (`bool?`) is true or false after validation and null when nothing was validated, `Run.SchemaValidationErrors` (`string?`) holds the first few errors of a failed validation, and `Run.RepairAttempts` (`int`, 0 or 1) counts the structured output repair Garrison makes when the harness can resume its session. A run whose output still does not validate fails with `RunOutcomeEnum.SchemaValidationFailed`. See "Structured output validation" in `REST_API.md`.

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
