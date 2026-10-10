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

`Tenants`, `Users`, `Credentials`, `Roles`, `Permissions`, `RolePermissions`, `UserRoleAssignments`, `CredentialScopeAssignments`, `Agents`, `Deployments`, `HarnessProfiles`, `PromptTemplates`, `McpServers`, `Secrets`, `WorkspaceTemplates`, `ArtifactStores`, `Nodes`, and `NodePools` provide `List`, `Get`, `Create`, `Update`, `Delete`, and `Action` (for sub-routes such as `rotate` or `cordon`). They decode into whatever you pass as `out`: a typed struct such as `garrison.Agent` or a `map[string]any`. `Manifests` and `Runs` are fully typed. For anything else, `client.Do(ctx, method, path, query, body, &out)` sends an authenticated request.

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

## Errors

Non-2xx responses return `*garrison.Error` with `StatusCode`, `Code`, `Message`, and `Body`. `garrison.IsStatus(err, 409)` checks the status.

## Test harness

```bash
go run ./cmd/testharness http://127.0.0.1:8700 access_garrison_default secret_garrison_default_change_me
```
