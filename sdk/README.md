# Garrison SDKs

Client libraries for the Garrison REST API. Each SDK lives in its own folder, has its own README, and ships an end-to-end test harness that runs against a live control plane and worker.

| Language | Folder | Package | Runtime | Harness |
|---|---|---|---|---|
| C# | [`csharp`](csharp/README.md) | `Garrison.Sdk` (NuGet) | .NET 8 and .NET 10 | `Garrison.Sdk.Test` |
| Python | [`python`](python/README.md) | `garrison-sdk` (PyPI) | Python 3.9+ with `requests` | `test_harness.py` |
| JavaScript and TypeScript | [`js`](js/README.md) | `@garrison/sdk` (npm) | Node 18+ and modern browsers | `test-harness.mjs` |
| Go | [`go`](go/README.md) | `github.com/jchristn/Garrison/sdk/go` | Go 1.21+ | `cmd/testharness` |

All four SDKs are version `0.1.0-alpha` and cover the same surface:

- Authentication with user tokens, access key pairs, HMAC-signed requests, or the admin API key.
- Tenant resources: agents, deployments, harness profiles, prompt templates, MCP servers, secrets, workspace templates, artifact stores, users, credentials, roles, permissions, and assignments.
- Runs: invoke (with or without waiting), create, cancel, retry, list, poll events, and stream events over server-sent events. Runs carry timing and usage fields (`timeToFirstTokenMs`, `streamingMs`, `executionMs`, `queueMs`, `totalMs`, `outputTokensPerSecond`, `firstTokenUtc`, `lastTokenUtc`, `reasoningTokens`, `toolCallCount`) alongside token counts and cost.
- Run analytics: totals and time-bucketed series of run counts, tokens, cost, latency, and throughput, optionally grouped by agent or harness (`GET /v1.0/api/tenants/{tenantId}/analytics/runs`).
- Declarative manifests: apply (including dry run), export, and apply history.
- Platform resources: tenants, nodes, node pools, settings, request history, and audit (C#, Python, and JavaScript; Go exposes tenants, nodes, and node pools plus a generic `Do` for the rest).

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

The defaults are `http://127.0.0.1:8700`, `access_garrison_default`, and `secret_garrison_default_change_me`. The checks are: health, token authentication, signed-request authentication, built-in profile lookup, scratch agent and deployment creation on `builtin/fake`, invoke with wait, run timing fields on the finished run, run analytics for the last hour (ungrouped, grouped by harness, and a 400 for an inverted range), run plus event streaming until `run.completed`, cancel, manifest dry run, listing runs by agent, and cleanup.
