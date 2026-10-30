# Garrison SDKs

Client libraries for the Garrison REST API. Each SDK lives in its own folder, has its own README, and ships an end-to-end test harness that runs against a live control plane and worker.

**Garrison Agent Studio.** Garrison is a runtime for headless agent harnesses: a multi-tenant control plane with pull-based workers, exposed over REST, MCP, and A2A. Since 0.2.0 it is also an agent studio built on that runtime, so one platform covers an agentic app from start to finish:

| Stage | What the SDKs call |
|---|---|
| Build | Studio drafts, the app graph, agent assets, the capability catalog, agent architects, architect prompts |
| Test | The playground against draft revisions, compile preview |
| Deploy | Draft apply through an approval, agent and app revisions, environments, promotion and rollback |
| Run and scale | Runs, conversations, fan-out groups, pipelines, triggers |
| Operate and manage | Apps, the app gateway for end users, file spaces, RBAC, quotas, notifications |
| Observe | Run events and streams, transcripts, analytics, audit |

Each SDK has an Agent Studio walkthrough in its README and in its interactive console: apply the support triage bundle (`examples/agentic-apps/support-triage/support-triage.yaml`) to create an app, open a studio draft from that app, list the architect prompts and select one for an agent architect (creating one on the fake harness when the tenant has none), and chat with the app through its gateway as an anonymous end user. The Python SDK also has it as a script, [`python/examples/agent_studio.py`](python/examples/agent_studio.py).

| Language | Folder | Package name | Install from the repository | Runtime | Harness |
|---|---|---|---|---|---|
| C# | [`csharp`](csharp/README.md) | `Garrison.Sdk` | `dotnet add reference sdk/csharp/Garrison.Sdk/Garrison.Sdk.csproj` | .NET 8 and .NET 10 | `Garrison.Sdk.Test` |
| Python | [`python`](python/README.md) | `garrison-sdk` | `pip install ./sdk/python` | Python 3.9+ with `requests` | `test_harness.py` |
| JavaScript and TypeScript | [`js`](js/README.md) | `@garrison/sdk` | `npm run build` in `sdk/js`, then `npm install /path/to/sdk/js` | Node 18+ and modern browsers | `test-harness.mjs` |
| Go | [`go`](go/README.md) | `github.com/jchristn/Garrison/sdk/go` | a `replace` directive to `sdk/go` | Go 1.21+ | `cmd/testharness` |

None of the packages is published yet: not to NuGet, PyPI, or npm, and the Go module has no tagged release. Install from your checkout of the repository as shown above; each README has the details.

Every quick start signs in with email and password (`admin@garrison` in tenant `default`), which works the same on Docker, source builds, and Kubernetes. The access and secret keys that the harnesses use are `GARRISON_DEFAULT_ACCESS_KEY` and `GARRISON_DEFAULT_SECRET_KEY` in `docker/.env` on Docker, `access_garrison_default` and `secret_garrison_default_change_me` on a source build in development mode (`GARRISON_ALLOW_INSECURE_DEFAULTS=true`), and random values in Secret `garrison-secrets` under `default-access-key` and `default-secret-key` on Kubernetes. Each README shows how to read them.

All four SDKs are version `0.2.0` and cover the same surface:

- Authentication with user tokens, access key pairs, HMAC-signed requests, or the admin API key.
- Tenant resources: agents, deployments, harness profiles, prompt templates, MCP servers, secrets, workspace templates, artifact stores, users, credentials, roles, permissions, and assignments.
- Runs: invoke (with or without waiting), create, cancel, retry, list, poll events, and stream events over server-sent events. Runs carry timing and usage fields (`timeToFirstTokenMs`, `streamingMs`, `executionMs`, `queueMs`, `totalMs`, `delegationWaitMs`, `timeToFirstTokenExcludingDelegationMs`, `outputTokensPerSecond`, `firstTokenUtc`, `lastTokenUtc`, `reasoningTokens`, `toolCallCount`) alongside token counts and cost.
- Conversations: start a multi-turn conversation with `startConversation` on invoke, run creation, or a deployment test, continue it with `conversationId` (the harness resumes its session), list, read, and delete conversations, and list a conversation's turns. Runs carry `conversationId`, `conversationTurn`, `resumeSessionId`, `affinityNodeId`, `affinityUntilUtc`, and `conversationFallbackReason`.
- Permission approvals: list (filter by status, run, root run, agent, deployment, decision source, and time range), read, and decide approvals (`/v1.0/api/tenants/{tenantId}/approvals`), and evaluate a deployment's approval rules against a sample tool call without recording anything (`POST /v1.0/api/tenants/{tenantId}/deployments/{deploymentId}/approval-check`). Deployments carry `approvalsEnabled`, `approvalDefaultAction`, `approvalTimeoutSeconds`, `approvalTimeoutDecision`, and `approvalRules`; runs carry `pendingApprovals`, `awaitingApproval`, and `approvalWaitMs`.
- Pipelines: create, read (by identifier or name), update, delete, start (with an optional `Idempotency-Key` header and wait), and preview pipeline definitions (`/v1.0/api/tenants/{tenantId}/pipelines`); list, read (with an optional `waitSeconds`), cancel, retry, and delete pipeline runs (`/pipeline-runs`); and list, read, and decide stage reviews with Approve, RequestChanges, or Reject (`/pipeline-reviews`).
- Triggers: create, read (by identifier or name), update, delete, rotate the signing secret of, fire, and list the fires of cron and webhook triggers (`/v1.0/api/tenants/{tenantId}/triggers`), and deliver a signed webhook to one (`POST /triggers/{id}/webhook`). Runs and pipeline runs carry `triggerId`, and runs list by it. Each SDK has a webhook signature helper (sign and verify `X-Garrison-Signature`) that works for trigger webhooks and for checking notifications.
- Notification endpoints: create, read, update, delete, rotate the signing secret of, and test notification endpoints, and list and read their delivery log (`/v1.0/api/tenants/{tenantId}/notification-endpoints`).
- Run analytics: totals and time-bucketed series of run counts, tokens, cost, latency, and throughput, optionally filtered by agent, harness, deployment, or served model and grouped by agent, harness, model, or harness and model (`GET /v1.0/api/tenants/{tenantId}/analytics/runs`), plus the distinct filter values among runs in a range (`GET /v1.0/api/tenants/{tenantId}/analytics/runs/dimensions`).
- Declarative manifests: apply (including dry run, with per-field `changes` for updated items), bundle export with selectors (kinds, `Kind/name` resources, reference following, built-ins; secrets listed by name in a leading `Bundle` document, never exported), and apply history.
- Transcripts: a run's or a conversation's transcript as Markdown or as the typed JSON document (`Transcript`), with thinking optional and secrets redacted.
- Structured input: agents carry `inputSchemaJson`; invocations that are not JSON or break the schema fail with field codes `InputNotJson` and `InputSchemaViolation` on `input` or `input.<path>`.
- Capability catalog: list (filter by kind, tag, and search text), read by identifier or name, create, replace, and delete manual descriptors, and refresh derived ones (`/v1.0/api/tenants/{tenantId}/capabilities`). Harness profiles carry `toolProbes`, and `blockedReason` gains `NoToolWorker`.
- Fan-out groups: list a run's groups oldest first, read one with its members' state and results, and cancel one (`/v1.0/api/tenants/{tenantId}/runs/{runId}/fan-out-groups` and `/v1.0/api/tenants/{tenantId}/fan-out-groups/{groupId}`). Runs only create groups through the `garrison_fan_out` MCP tool, so the SDKs read and cancel them; `Run.fanOutGroupId` names the group a child run belongs to.
- Agentic apps: list, create, read by identifier or name, replace, and delete apps, read and apply the delegation plan their graph implies, take, list, read, and publish app revisions, and promote an app revision (`/v1.0/api/tenants/{tenantId}/apps`). `Conversation.appId` names the app that started a conversation. Every SDK also has an app gateway client for an app's end users (`/v1.0/apps/{slug}`): app info and logo, sign-in or anonymous sessions, conversations, turns streamed over server-sent events with resume, waiting for a turn, the conversation's files, and the `files.changed` stream. It is `AppGatewayClient` in C# (`client.AppGateway(slug)`), JavaScript (`client.appGateway(slug)`), and Go (`client.AppGateway(slug)`), and `AppGateway` in Python (`client.app_gateway(slug)`).
- Studio drafts: list (your own with `mine`, search by title), create (empty or from an app), read, and discard drafts, put and remove items at the version you read (409 `DraftVersionConflict` when the draft moved on), diff and validate, read the app graph and apply graph operations, and request an apply, which returns a `DraftApply` approval decided through the approvals client (`/v1.0/api/tenants/{tenantId}/studio/drafts`). `Approval.draftId` names the draft. Agent architects: list (paginated, search by name, `activeOnly`), create, read by identifier or name, update, and delete the tenant's architects (`/v1.0/api/tenants/{tenantId}/studio/architects`); an architect is a deployment of the built-in `agent-architect` with draft access, created from a name, harness profile, model, active flag, prompt, and optional credential secret. `credentialSecretId` (an identifier or name) binds the secret the harness signs in with under the alias `credential`, the response adds `credentialSecretName` and `credentialSecretKind`, and an empty string on update removes the binding (400 `InvalidCredentialSecret` for a missing or inactive secret). Architect prompts: list them one page at a time (`maxResults`, `skip`, `search`; the result is an enumeration result, not a bare array), and read and set an architect's prompt (`/studio/architect-prompts` and `/studio/architects/{deploymentId}/prompt`); deployments carry `managementAccess` and accept `architectPromptTemplateId` and `architectPromptVersion` on create. Prompt templates clone, update, reset, and render in every SDK.
- Studio playground and compile preview: run an agent's revision (by default its open draft) on an ephemeral deployment in the reserved `draft` environment (`/v1.0/api/tenants/{tenantId}/agents/{agentIdOrName}/playground/invoke`), or write a studio draft's document as the agent's draft revision and run it (`/v1.0/api/tenants/{tenantId}/studio/drafts/{id}/playground/invoke`); both return a run of kind `Playground` with `agentRevisionId` set. Compile preview (`/v1.0/api/tenants/{tenantId}/deployments/{id}/compile-preview`, now in every SDK including Go) takes `agentRevisionId` and `environment` and returns the `deploymentId` compiled and the `agentRevisionId` used. Studio graph nodes carry `capabilities` and edges carry `depth`.
- Platform resources: tenants, nodes, control nodes (control-plane replicas, read-only), node pools, settings, request history, and audit (C#, Python, and JavaScript; Go exposes tenants, nodes, control nodes, and node pools plus a generic `Do` for the rest).

## Running every harness

```bash
scripts/run-sdk-harnesses.sh          # macOS and Linux
scripts\run-sdk-harnesses.bat         # Windows
```

The script builds the solution, starts a throwaway Sqlite server on `127.0.0.1:18700` and one worker with the fake harness, runs each harness, and prints a summary. Set `GARRISON_SDK_SKIP=go,python` to skip languages. The Go harness runs with a local `go` toolchain when present and falls back to the `golang:1.23` Docker image.

Each harness also runs on its own against any server:

```
<harness> [baseUrl] [accessKey] [secretKey]
```

The defaults are `http://127.0.0.1:8700`, `access_garrison_default`, and `secret_garrison_default_change_me`, which match a source build in development mode and the throwaway server `scripts/run-sdk-harnesses.sh` starts. On Docker Compose pass the keys from `docker/.env`, and on Kubernetes from Secret `garrison-secrets`. When the server rejects the keys, each harness stops after the token check with one message that explains where the keys come from, instead of failing every later check. The checks are: health, token authentication, signed-request authentication, built-in profile lookup, scratch agent and deployment creation on `builtin/fake`, invoke with wait, run timing fields on the finished run, run analytics for the last hour (ungrouped, grouped by harness, grouped by harness and model, filtered by the invoked run's served model, the dimensions endpoint, and a 400 for an inverted range), run plus event streaming until `run.completed`, cancel, manifest dry run (including a `ValueClamped` entry in an item's `warnings` for an out-of-range value), a deployment created with `maxAttempts` 99 that stores 10 and returns a `ValueClamped` warning (I-08), the worker node's `containerized` flag (false for the harness worker, G-29), listing runs by agent, a conversation (start on a second `builtin/fake` deployment with parameter `reportTurns`, continue so the resumed session answers `[turn 2]`, read it with `turnCount` 2 and a `sessionId`, list it and its two runs, delete it, then confirm 404 on read and on a further turn), a pipeline round trip (create a two-stage pipeline whose first stage requires review, read it by name, update it, preview it, start it and wait for the review, repeat the start with the same idempotency key, approve the review with a comment, wait for success, then start, cancel, retry, and delete a second pipeline run and delete the pipeline), control nodes, the capability catalog (find the scratch agent's Agent descriptor, create a tagged manual descriptor with an input schema, read it by identifier and by name, filter by tag, expect 400 `InvalidJsonSchema` for a bad schema and 409 `NameConflict` for a duplicate name, update it, refresh, and delete it), fan-out groups (the invoked run lists no groups, and reading or cancelling `fog_missing` is 404), an agentic app (create one with the scratch agent as its only member and entry, `authMode` `Anonymous` with anonymous use enabled, read it by name, read a one-member delegation plan, take and publish an app revision, and delete the app; the JavaScript harness also reads the app info through `AppGatewayClient`, starts an anonymous session, lists no conversations, and expects 401 for a management token on the gateway), a studio draft (create an empty draft, put an `Agent` item, expect 409 `DraftVersionConflict` for a put at a stale version, add a live agent to a new app with an `AddMember` graph operation, diff and validate with two `Create` items, request the apply, allow the `DraftApply` approval through the approvals client, then confirm the draft is `Applied` and the app exists, and delete the app and agents), architect prompts (the first listed is `builtin/agent-architect`; clone it, create a deployment of `agent-architect` on `builtin/fake` bound to the clone with `managementAccess` `Drafts`, read its prompt, set it back to `builtin/agent-architect`, reset the clone, and delete the deployment and the clone; the Go harness also renders ad hoc content with `RenderContent`), the app gateway chat (apply the support triage bundle, read the app info, expect 404 for the logo of an app without one, start an anonymous session, start a conversation, stream the turn to `turn.completed`, wait for it to succeed with an answer, read and list the conversation, list its files, read the first `files.changed` event, end the session, and expect 401 without one; the Go harness skips it when it cannot find `examples/agentic-apps` above its working directory), the playground (create an agent and a `dev` deployment on `builtin/fake`, save a draft revision with a distinctive description, run the agent's playground invoke with wait and expect a succeeded run of kind `Playground` whose `agentRevisionId` is the draft revision, then compile preview the `dev` deployment with that `agentRevisionId` and expect it back, and delete the deployment and agent), and cleanup.

After the harnesses, `scripts/run-sdk-harnesses.sh` runs `scripts/verify-sdk-consoles.py`, which drives each interactive console through health, sign-in, the run commands, an invocation, and the Agent Studio walkthrough (`apply`, `apps`, `studio-draft`, `architect-prompts`, `architect`, `architects`, and `chat`), checks that the bundle applied, the draft opened from the app, a prompt was selected, the architects were listed, and the chat turn succeeded, and confirms no credential appears in the output. It removes the drafts and any `agent-architect-sdk` architect it created.

## 0.2.0 route coverage

Every route added in 0.2.0 has a typed method and model in all four SDKs. Tenant routes are relative to `/v1.0/api/tenants/{tenantId}`; the app gateway routes are absolute. Two anonymous routes have no method on purpose: `GET /v1.0/asset-download/{assetId}` is for leased runs on workers, and `GET /v1.0/file-download/{fileSpaceId}` is the plain URL that the `download-url` methods return.

| Route | C# | Python | JavaScript/TypeScript | Go |
|---|---|---|---|---|
| **Agent revisions** | | | | |
| `GET /agents/{id}/revisions` | `AgentRevisions.ListAsync` | `agents.revisions` | `agents.listRevisions` | `Agents.ListRevisions` |
| `POST /agents/{id}/revisions` | `AgentRevisions.SaveDraftAsync` | `agents.save_draft` | `agents.saveDraft` | `Agents.SaveDraft` |
| `GET /agents/{id}/revisions/diff` | `AgentRevisions.DiffAsync` | `agents.diff_revisions` | `agents.diffRevisions` | `Agents.DiffRevisions` |
| `GET /agents/{id}/revisions/{revId}` | `AgentRevisions.GetAsync` | `agents.get_revision` | `agents.getRevision` | `Agents.GetRevision` |
| `DELETE /agents/{id}/revisions/{revId}` | `AgentRevisions.DiscardDraftAsync` | `agents.delete_revision` | `agents.deleteRevision` | `Agents.DeleteRevision` |
| `POST /agents/{id}/revisions/{revId}/publish` | `AgentRevisions.PublishAsync` | `agents.publish_revision` | `agents.publishRevision` | `Agents.PublishRevision` |
| **Environments and promotions** | | | | |
| `GET /environments` | `Promotions.GetEnvironmentsAsync` | `environments.get` | `environments.get` | `Environments.Get` |
| `PUT /environments` | `Promotions.UpdateEnvironmentsAsync` | `environments.update` | `environments.update` | `Environments.Update` |
| `GET /promotions` | `Promotions.ListAsync` | `promotions.list` | `promotions.list` | `Promotions.List` |
| `POST /promotions` | `Promotions.PromoteAsync` | `promotions.promote` | `promotions.promote` | `Promotions.Promote` |
| `GET /promotions/{id}` | `Promotions.GetAsync` | `promotions.get` | `promotions.get` | `Promotions.Get` |
| `POST /promotions/{id}/rollback` | `Promotions.RollbackAsync` | `promotions.rollback` | `promotions.rollback` | `Promotions.Rollback` |
| **Agent assets** | | | | |
| `GET /agent-assets` | `AgentAssets.ListAsync` | `agent_assets.list` | `agentAssets.list` | `AgentAssets.List` |
| `POST /agent-assets` | `AgentAssets.CreateAsync` | `agent_assets.create` | `agentAssets.create` | `AgentAssets.Create` |
| `GET /agent-assets/{id}` | `AgentAssets.GetAsync` | `agent_assets.get` | `agentAssets.get` | `AgentAssets.Get` |
| `PUT /agent-assets/{id}` | `AgentAssets.UpdateAsync` | `agent_assets.update` | `agentAssets.update` | `AgentAssets.Update` |
| `DELETE /agent-assets/{id}` | `AgentAssets.DeleteAsync` | `agent_assets.delete` | `agentAssets.delete` | `AgentAssets.Delete` |
| `GET /agent-assets/{id}/versions` | `AgentAssets.ListVersionsAsync` | `agent_assets.versions` | `agentAssets.listVersions` | `AgentAssets.ListVersions` |
| `POST /agent-assets/{id}/versions` | `AgentAssets.UploadVersionAsync`, `UploadFilesAsync`, `UploadRawAsync` | `agent_assets.upload`, `upload_raw` | `agentAssets.uploadVersion`, `uploadRaw` | `AgentAssets.UploadVersion`, `UploadRaw` |
| `GET /agent-assets/{id}/versions/{n}` | `AgentAssets.GetVersionAsync` | `agent_assets.get_version` | `agentAssets.getVersion` | `AgentAssets.GetVersion` |
| `GET /agent-assets/{id}/versions/{n}/files` | `AgentAssets.DownloadFileAsync` | `agent_assets.download_file` | `agentAssets.downloadFile` | `AgentAssets.DownloadFile` |
| **File spaces (`conversations` or `runs` as the owner)** | | | | |
| `GET /{owner}/{id}/files` | `FileSpaces.ListAsync` | `file_spaces.list` | `fileSpaces.list` | `FileSpaces.List` |
| `GET /{owner}/{id}/files/content` | `FileSpaces.ReadAsync`, `ReadTextAsync` | `file_spaces.read`, `read_text` | `fileSpaces.read`, `readText` | `FileSpaces.Read` |
| `GET /{owner}/{id}/files/versions` | `FileSpaces.ListVersionsAsync` | `file_spaces.versions` | `fileSpaces.versions` | `FileSpaces.Versions` |
| `POST /{owner}/{id}/files` | `FileSpaces.WriteAsync`, `WriteBytesAsync`, `WriteTextAsync` | `file_spaces.write`, `write_raw` | `fileSpaces.write`, `writeRaw` | `FileSpaces.WriteText`, `WriteBytes`, `WriteRaw` |
| `DELETE /{owner}/{id}/files` | `FileSpaces.DeleteAsync` | `file_spaces.delete` | `fileSpaces.delete` | `FileSpaces.Delete` |
| `POST /{owner}/{id}/files/download-url` | `FileSpaces.DownloadUrlAsync` | `file_spaces.download_url` | `fileSpaces.downloadUrl` | `FileSpaces.DownloadURL` |
| **Capabilities** | | | | |
| `GET /capabilities` | `Capabilities.ListAsync` | `capabilities.list` | `capabilities.list` | `Capabilities.List` |
| `POST /capabilities` | `Capabilities.CreateAsync` | `capabilities.create` | `capabilities.create` | `Capabilities.Create` |
| `POST /capabilities/refresh` | `Capabilities.RefreshAsync` | `capabilities.refresh` | `capabilities.refresh` | `Capabilities.Refresh` |
| `GET /capabilities/{id}` | `Capabilities.GetAsync` | `capabilities.get` | `capabilities.get` | `Capabilities.Get` |
| `PUT /capabilities/{id}` | `Capabilities.UpdateAsync` | `capabilities.update` | `capabilities.update` | `Capabilities.Update` |
| `DELETE /capabilities/{id}` | `Capabilities.DeleteAsync` | `capabilities.delete` | `capabilities.delete` | `Capabilities.Delete` |
| **Fan-out groups** | | | | |
| `GET /runs/{id}/fan-out-groups` | `FanOutGroups.ListByRunAsync` | `fan_out_groups.list_by_run` | `fanOutGroups.listByRun` | `FanOutGroups.ListByRun` |
| `GET /fan-out-groups/{id}` | `FanOutGroups.GetAsync` | `fan_out_groups.get` | `fanOutGroups.get` | `FanOutGroups.Get` |
| `POST /fan-out-groups/{id}/cancel` | `FanOutGroups.CancelAsync` | `fan_out_groups.cancel` | `fanOutGroups.cancel` | `FanOutGroups.Cancel` |
| **Agentic apps** | | | | |
| `GET /apps` | `Apps.ListAsync` | `apps.list` | `apps.list` | `Apps.List` |
| `POST /apps` | `Apps.CreateAsync` | `apps.create` | `apps.create` | `Apps.Create` |
| `GET /apps/{id}` | `Apps.GetAsync` | `apps.get` | `apps.get` | `Apps.Get` |
| `PUT /apps/{id}` | `Apps.UpdateAsync` | `apps.update` | `apps.update` | `Apps.Update` |
| `DELETE /apps/{id}` | `Apps.DeleteAsync` | `apps.delete` | `apps.delete` | `Apps.Delete` |
| `GET /apps/{id}/delegation` | `Apps.GetDelegationAsync` | `apps.delegation` | `apps.delegation` | `Apps.Delegation` |
| `POST /apps/{id}/delegation` | `Apps.ApplyDelegationAsync` | `apps.apply_delegation` | `apps.applyDelegation` | `Apps.ApplyDelegation` |
| `GET /apps/{id}/revisions` | `Apps.ListRevisionsAsync` | `apps.revisions` | `apps.revisions` | `Apps.Revisions` |
| `POST /apps/{id}/revisions` | `Apps.CreateRevisionAsync` | `apps.create_revision` | `apps.createRevision` | `Apps.CreateRevision` |
| `GET /apps/{id}/revisions/{revId}` | `Apps.GetRevisionAsync` | `apps.get_revision` | `apps.getRevision` | `Apps.GetRevision` |
| `POST /apps/{id}/revisions/{revId}/publish` | `Apps.PublishRevisionAsync` | `apps.publish_revision` | `apps.publishRevision` | `Apps.PublishRevision` |
| `POST /apps/{id}/promote` | `Apps.PromoteAsync` | `apps.promote` | `apps.promote` | `Apps.Promote` |
| **App gateway (absolute paths; `gateway` is `client.AppGateway(slug)` in C#, `client.app_gateway(slug)` in Python, `client.appGateway(slug)` or `new AppGatewayClient(baseUrl, slug)` in JavaScript, `client.AppGateway(slug)` or `garrison.NewAppGatewayClient(baseURL, slug)` in Go)** | | | | |
| `GET /v1.0/apps/{slug}` | `gateway.InfoAsync` | `gateway.info` | `gateway.info` | `gateway.Info` |
| `GET /v1.0/apps/{slug}/logo` | `gateway.GetLogoAsync`, `LogoUrl` | `gateway.logo`, `logo_url` | `gateway.logo`, `logoUrl` | `gateway.Logo`, `LogoURL` |
| `POST /v1.0/apps/{slug}/session` | `gateway.StartSessionAsync` | `gateway.start_session` | `gateway.startSession` | `gateway.StartSession` |
| `DELETE /v1.0/apps/{slug}/session` | `gateway.EndSessionAsync` | `gateway.end_session` | `gateway.endSession` | `gateway.EndSession` |
| `GET /v1.0/apps/{slug}/conversations` | `gateway.ListConversationsAsync` | `gateway.conversations` | `gateway.conversations` | `gateway.Conversations` |
| `POST /v1.0/apps/{slug}/conversations` | `gateway.StartConversationAsync` | `gateway.start_conversation` | `gateway.startConversation` | `gateway.StartConversation` |
| `GET /v1.0/apps/{slug}/conversations/{id}` | `gateway.GetConversationAsync`, `WaitForTurnAsync` | `gateway.conversation`, `wait_for_turn` | `gateway.conversation`, `waitForTurn` | `gateway.Conversation`, `WaitForTurn` |
| `POST /v1.0/apps/{slug}/conversations/{id}/messages` | `gateway.SendAsync` | `gateway.send` | `gateway.send` | `gateway.Send` |
| `GET /v1.0/apps/{slug}/conversations/{id}/turns/{runId}/stream` | `gateway.StreamTurnAsync` | `gateway.stream_turn` | `gateway.streamTurn` | `gateway.StreamTurn` |
| `GET /v1.0/apps/{slug}/conversations/{id}/files` | `gateway.ListFilesAsync` | `gateway.files` | `gateway.files` | `gateway.Files` |
| `GET /v1.0/apps/{slug}/conversations/{id}/files/content` | `gateway.ReadFileAsync` | `gateway.read_file` | `gateway.readFile` | `gateway.ReadFile` |
| `GET /v1.0/apps/{slug}/conversations/{id}/files/versions` | `gateway.ListFileVersionsAsync` | `gateway.file_versions` | `gateway.fileVersions` | `gateway.FileVersions` |
| `POST /v1.0/apps/{slug}/conversations/{id}/files/download-url` | `gateway.DownloadUrlAsync` | `gateway.download_url` | `gateway.downloadUrl` | `gateway.DownloadURL` |
| `GET /v1.0/apps/{slug}/conversations/{id}/files/stream` | `gateway.StreamFilesAsync` | `gateway.stream_files` | `gateway.streamFiles` | `gateway.StreamFiles` |
| **Studio drafts** | | | | |
| `GET /studio/drafts` | `StudioDrafts.ListAsync` | `studio_drafts.list` | `studioDrafts.list` | `StudioDrafts.List` |
| `POST /studio/drafts` | `StudioDrafts.CreateAsync` | `studio_drafts.create` | `studioDrafts.create` | `StudioDrafts.Create` |
| `GET /studio/drafts/{id}` | `StudioDrafts.GetAsync` | `studio_drafts.get` | `studioDrafts.get` | `StudioDrafts.Get` |
| `DELETE /studio/drafts/{id}` | `StudioDrafts.DeleteAsync` | `studio_drafts.delete` | `studioDrafts.delete` | `StudioDrafts.Delete` |
| `PUT /studio/drafts/{id}/items/{kind}/{name}` | `StudioDrafts.PutItemAsync` | `studio_drafts.put_item` | `studioDrafts.putItem` | `StudioDrafts.PutItem` |
| `DELETE /studio/drafts/{id}/items/{kind}/{name}` | `StudioDrafts.RemoveItemAsync` | `studio_drafts.remove_item` | `studioDrafts.removeItem` | `StudioDrafts.RemoveItem` |
| `GET /studio/drafts/{id}/diff` | `StudioDrafts.DiffAsync` | `studio_drafts.diff` | `studioDrafts.diff` | `StudioDrafts.Diff` |
| `POST /studio/drafts/{id}/validate` | `StudioDrafts.ValidateAsync` | `studio_drafts.validate` | `studioDrafts.validate` | `StudioDrafts.Validate` |
| `POST /studio/drafts/{id}/request-apply` | `StudioDrafts.RequestApplyAsync` | `studio_drafts.request_apply` | `studioDrafts.requestApply` | `StudioDrafts.RequestApply` |
| `GET /studio/drafts/{id}/graph` | `StudioDrafts.GetGraphAsync` | `studio_drafts.graph` | `studioDrafts.graph` | `StudioDrafts.Graph` |
| `POST /studio/drafts/{id}/graph-operations` | `StudioDrafts.ApplyGraphOperationAsync` | `studio_drafts.graph_operation` | `studioDrafts.graphOperation` | `StudioDrafts.GraphOperation` |
| **Agent architects** | | | | |
| `GET /studio/architects` | `StudioDrafts.ListArchitectsAsync` | `studio_drafts.list_architects` | `studioDrafts.listArchitects` | `StudioDrafts.Architects` |
| `POST /studio/architects` | `StudioDrafts.CreateArchitectAsync` | `studio_drafts.create_architect` | `studioDrafts.createArchitect` | `StudioDrafts.CreateArchitect` |
| `GET /studio/architects/{deploymentId}` | `StudioDrafts.GetArchitectAsync` | `studio_drafts.get_architect` | `studioDrafts.getArchitect` | `StudioDrafts.Architect` |
| `PUT /studio/architects/{deploymentId}` | `StudioDrafts.UpdateArchitectAsync` | `studio_drafts.update_architect` | `studioDrafts.updateArchitect` | `StudioDrafts.UpdateArchitect` |
| `DELETE /studio/architects/{deploymentId}` | `StudioDrafts.DeleteArchitectAsync` | `studio_drafts.delete_architect` | `studioDrafts.deleteArchitect` | `StudioDrafts.DeleteArchitect` |
| **Architect prompts** | | | | |
| `GET /studio/architect-prompts` | `StudioDrafts.ListArchitectPromptsAsync` | `studio_drafts.list_architect_prompts` | `studioDrafts.listArchitectPrompts` | `StudioDrafts.ArchitectPrompts` |
| `GET /studio/architects/{deploymentId}/prompt` | `StudioDrafts.GetArchitectPromptAsync` | `studio_drafts.get_architect_prompt` | `studioDrafts.getArchitectPrompt` | `StudioDrafts.ArchitectPrompt` |
| `PUT /studio/architects/{deploymentId}/prompt` | `StudioDrafts.SetArchitectPromptAsync` | `studio_drafts.set_architect_prompt` | `studioDrafts.setArchitectPrompt` | `StudioDrafts.SetArchitectPrompt` |
| `POST /deployments` (architect fields) | `Deployments.CreateAsync` | `deployments.create` | `deployments.create` | `Deployments.Create` |
| `POST /prompt-templates/{id}/clone` | `PromptTemplates.CloneAsync` | `prompt_templates.clone` | `promptTemplates.clone` | `PromptTemplates.Clone` |
| `PUT /prompt-templates/{id}` | `PromptTemplates.UpdateAsync` | `prompt_templates.update` | `promptTemplates.update` | `PromptTemplates.Update` |
| `POST /prompt-templates/{id}/reset` | `PromptTemplates.ResetAsync` | `prompt_templates.reset` | `promptTemplates.reset` | `PromptTemplates.Reset` |
| `POST /prompt-templates/{id}/render` | `PromptTemplates.RenderAsync` | `prompt_templates.render` | `promptTemplates.render` | `PromptTemplates.Render` |
| `POST /prompt-templates/render` | `PromptTemplates.RenderContentAsync` | `prompt_templates.render_content` | `promptTemplates.renderContent` | `PromptTemplates.RenderContent` |
| `DELETE /prompt-templates/{id}` (409 `PromptTemplateInUse`) | `PromptTemplates.DeleteAsync` | `prompt_templates.delete` | `promptTemplates.delete` | `PromptTemplates.Delete` |
| **Playground and compile preview** | | | | |
| `POST /studio/drafts/{id}/playground/invoke` | `StudioDrafts.PlaygroundInvokeAsync` | `studio_drafts.playground_invoke` | `studioDrafts.playgroundInvoke` | `StudioDrafts.PlaygroundInvoke` |
| `POST /agents/{agentId}/playground/invoke` | `Agents.PlaygroundInvokeAsync` | `agents.playground_invoke` | `agents.playgroundInvoke` | `Agents.PlaygroundInvoke` |
| `POST /deployments/{id}/compile-preview` (`agentRevisionId`, `environment`) | `Deployments.CompilePreviewAsync` | `deployments.compile_preview` | `deployments.compilePreview` | `Deployments.CompilePreview` |
