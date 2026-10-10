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

`GarrisonClient` exposes one client per resource: `Tenants`, `Users`, `Credentials`, `Roles`, `Permissions`, `RolePermissions`, `UserRoleAssignments`, `CredentialScopeAssignments`, `Agents`, `Deployments`, `HarnessProfiles`, `PromptTemplates`, `McpServers`, `Secrets`, `WorkspaceTemplates`, `ArtifactStores`, `Manifests`, `Runs`, `Nodes`, `NodePools`, `RequestHistory`, `Audit`, and `Settings`. Resource clients provide `ListAsync`, `GetAsync`, `CreateAsync`, `UpdateAsync`, and `DeleteAsync`, plus resource-specific operations such as `Agents.InvokeAsync`, `Credentials.RotateAsync`, and `PromptTemplates.RenderAsync`.

Models, enums, and request types live in `Garrison.Sdk.Models`, `Garrison.Sdk.Enums`, and `Garrison.Sdk.Requests`. They mirror the server contracts.

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
