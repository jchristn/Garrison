# Garrison SDKs

Client libraries for the Garrison REST API. Each SDK lives in its own folder, has its own README, and ships an end-to-end test harness that runs against a live control plane and worker.

| Language | Folder | Package name | Install from the repository | Runtime | Harness |
|---|---|---|---|---|---|
| C# | [`csharp`](csharp/README.md) | `Garrison.Sdk` | `dotnet add reference sdk/csharp/Garrison.Sdk/Garrison.Sdk.csproj` | .NET 8 and .NET 10 | `Garrison.Sdk.Test` |
| Python | [`python`](python/README.md) | `garrison-sdk` | `pip install ./sdk/python` | Python 3.9+ with `requests` | `test_harness.py` |
| JavaScript and TypeScript | [`js`](js/README.md) | `@garrison/sdk` | `npm run build` in `sdk/js`, then `npm install /path/to/sdk/js` | Node 18+ and modern browsers | `test-harness.mjs` |
| Go | [`go`](go/README.md) | `github.com/jchristn/Garrison/sdk/go` | a `replace` directive to `sdk/go` | Go 1.21+ | `cmd/testharness` |

None of the packages is published yet: not to NuGet, PyPI, or npm, and the Go module has no tagged release. Install from your checkout of the repository as shown above; each README has the details.

Every quick start signs in with email and password (`admin@garrison` in tenant `default`), which works the same on Docker, source builds, and Kubernetes. The access and secret keys that the harnesses use are `GARRISON_DEFAULT_ACCESS_KEY` and `GARRISON_DEFAULT_SECRET_KEY` in `docker/.env` on Docker, `access_garrison_default` and `secret_garrison_default_change_me` on a source build in development mode (`GARRISON_ALLOW_INSECURE_DEFAULTS=true`), and random values in Secret `garrison-secrets` under `default-access-key` and `default-secret-key` on Kubernetes. Each README shows how to read them.

All four SDKs are version `0.1.0-alpha` and cover the same surface:

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

The defaults are `http://127.0.0.1:8700`, `access_garrison_default`, and `secret_garrison_default_change_me`, which match a source build in development mode and the throwaway server `scripts/run-sdk-harnesses.sh` starts. On Docker Compose pass the keys from `docker/.env`, and on Kubernetes from Secret `garrison-secrets`. When the server rejects the keys, each harness stops after the token check with one message that explains where the keys come from, instead of failing every later check. The checks are: health, token authentication, signed-request authentication, built-in profile lookup, scratch agent and deployment creation on `builtin/fake`, invoke with wait, run timing fields on the finished run, run analytics for the last hour (ungrouped, grouped by harness, grouped by harness and model, filtered by the invoked run's served model, the dimensions endpoint, and a 400 for an inverted range), run plus event streaming until `run.completed`, cancel, manifest dry run (including a `ValueClamped` entry in an item's `warnings` for an out-of-range value), a deployment created with `maxAttempts` 99 that stores 10 and returns a `ValueClamped` warning (I-08), the worker node's `containerized` flag (false for the harness worker, G-29), listing runs by agent, a conversation (start on a second `builtin/fake` deployment with parameter `reportTurns`, continue so the resumed session answers `[turn 2]`, read it with `turnCount` 2 and a `sessionId`, list it and its two runs, delete it, then confirm 404 on read and on a further turn), a pipeline round trip (create a two-stage pipeline whose first stage requires review, read it by name, update it, preview it, start it and wait for the review, repeat the start with the same idempotency key, approve the review with a comment, wait for success, then start, cancel, retry, and delete a second pipeline run and delete the pipeline), control nodes, and cleanup.
