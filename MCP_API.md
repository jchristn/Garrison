# Garrison MCP API

Garrison runs its own Model Context Protocol server, built on Voltaic, so any MCP client can discover Garrison agents, invoke them, and follow their runs. The same server is how agents running inside Garrison call other agents: every run that is allowed to delegate gets this server in its MCP configuration, already authenticated with a run token.

The server speaks MCP streamable HTTP (protocol version `2025-06-18`) on its own listener, separate from the REST port.

| Setting | Default | Meaning |
|---|---|---|
| `Mcp.Enable` | `true` | Start the MCP listener |
| `Mcp.Hostname` | `*` | Interface to bind |
| `Mcp.Port` | `8701` | Listener port |
| `Mcp.Path` | `/mcp` | Endpoint path |
| `Mcp.PublicUrl` | none | Internal base URL workers use to reach this server, for example `http://garrison-server:8701`. It is handed to runs, not shown to outside clients. When unset, runs are pointed at `http://127.0.0.1:<Mcp.Port>`, which only works when the worker shares the host. |
| `Mcp.MaxMessageSize` | `16777216` | Largest accepted message in bytes |
| `Mcp.MaxToolWaitSeconds` | `90` | Upper bound for `waitSeconds` on `garrison_invoke_agent` |

`docs/CONFIGURATION.md` lists the matching environment variables.

## Connecting

Send the same credentials you would send to REST: a bearer session token, `x-access-key` and `x-secret-key`, or `x-api-key`. Signed requests are not supported here, because the signature covers a request body the MCP authentication step does not see. Requests without valid credentials get `401` with `WWW-Authenticate: Bearer error="invalid_token"`.

```bash
TOKEN=$(curl -s -X POST http://127.0.0.1:8700/v1.0/token \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@garrison","password":"password"}' | jq -r .token)

curl -s -i -X POST http://127.0.0.1:8701/mcp \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"curl","version":"1"}}}'
```

```text
HTTP/1.1 200 OK
MCP-Session-Id: 52df1c78-fff0-4d40-b0e8-69db86f648df
Content-Type: application/json

{"jsonrpc":"2.0","result":{"protocolVersion":"2025-06-18","capabilities":{...},"serverInfo":{"name":"Garrison","version":"0.1.0-alpha"}},"id":1}
```

Send the returned `MCP-Session-Id` header on later requests. Most clients handle all of this for you. With Claude Code, for example:

```bash
claude mcp add --transport http garrison http://127.0.0.1:8701/mcp \
  --header "x-access-key: access_garrison_default" \
  --header "x-secret-key: secret_garrison_default_change_me"
```

A credential is the better choice for a long-lived client, since session tokens expire (480 minutes by default).

### Tenants

Users, credentials, and run tokens belong to one tenant, and every tool works inside it. Every tool's input schema also has an optional `tenantId` argument. Only callers using the administrator API key need it, because that key has no tenant; without it their calls fail with "No tenant could be resolved." Everyone else can leave it out, and it is ignored for them.

```json
{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"garrison_invoke_agent","arguments":{"tenantId":"default","agent":"docs-echo","input":"Hello from MCP","waitSeconds":30}}}
```

## Tools

Each tool checks the same permission its REST equivalent does. Every tool also accepts the optional `tenantId` described above, which the table leaves out.

| Tool | Permission | Required arguments | Optional arguments |
|---|---|---|---|
| `garrison_list_agents` | Read on Agent | none | `search` (part of a name), `maxResults` (1 to 100, default 25) |
| `garrison_get_agent` | Read on Agent | `agent` (name or identifier) | none |
| `garrison_invoke_agent` | Execute on Agent | `agent`, `input` | `parameters` (object of strings), `deploymentId`, `waitSeconds` (0 to `Mcp.MaxToolWaitSeconds`, default the maximum) |
| `garrison_start_run` | Execute on Agent | `agent`, `input` | `parameters`, `deploymentId` |
| `garrison_get_run` | Read on Run | `runId` | none |
| `garrison_get_run_events` | Read on Run | `runId` | `afterSequence` (default 0), `limit` (1 to 500, default 100) |
| `garrison_cancel_run` | Update on Run | `runId` | none |
| `garrison_list_runs` | Read on Run | none | `status`, `agent`, `maxResults` (1 to 100, default 25) |

`garrison_list_agents` returns only active agents. `parameters` must be values the chosen deployment lets callers override, exactly as with `POST .../invoke`.

### Results

A successful call returns one text content item holding a JSON object. The run tools return a run summary:

```json
{
  "runId": "run_mv1qv8wf_GutuwbFizqFeHyg17da",
  "agent": "docs-echo",
  "status": "Succeeded",
  "outcome": "Succeeded",
  "blockedReason": null,
  "finished": true,
  "result": "Echo: Hello from MCP",
  "servedModel": "fake-model",
  "inputTokens": 12,
  "outputTokens": 7,
  "costUsd": 0.0001,
  "cachedTokens": 3,
  "reasoningTokens": 2,
  "toolCallCount": 0,
  "repairAttempts": 0,
  "timeToFirstTokenMs": 61,
  "streamingMs": 21,
  "executionMs": 88,
  "queueMs": 9,
  "totalMs": 104,
  "delegationWaitMs": 0,
  "timeToFirstTokenExcludingDelegationMs": 61,
  "createdUtc": "2026-10-10T01:57:36.591804Z",
  "completedUtc": "2026-10-10T01:57:36.674182Z"
}
```

| Field | Meaning |
|---|---|
| `runId`, `agent` | The run and the agent's name |
| `status`, `outcome` | Run status and, when finished, the outcome (see `REST_API.md`) |
| `blockedReason` | Always present. `null` unless the run is `Queued` and no Ready worker can run it, in which case it is `NoReadyWorker`, `NoCapableWorker`, or `NoMatchingPool` (see "Blocked runs" in `REST_API.md`). Computed when the summary is built |
| `finished` | Whether the run reached a terminal status |
| `result` | The final text, when finished |
| `servedModel` | The model the harness reported serving the run, for example `claude-sonnet-5-5`. Always present; `null` until the run reports it or when the harness reports none |
| `structuredOutputJson` | Structured output as a JSON string, when the agent defines an output schema |
| `outputSchemaValid` | Whether the final output validated against the agent's output schema. Omitted when the agent has no schema or nothing was validated (see "Structured output validation" in `REST_API.md`) |
| `repairAttempts` | Structured output repairs started for the run: 0 or 1 |
| `error` | Error message for failed runs |
| `inputTokens`, `outputTokens`, `cachedTokens`, `reasoningTokens`, `costUsd` | Usage reported by the harness (`reasoningTokens` is 0 when the harness does not report it) |
| `toolCallCount` | Tool call events in the run |
| `timeToFirstTokenMs`, `streamingMs`, `executionMs`, `queueMs`, `totalMs`, `outputTokensPerSecond` | Run timing, with the same meaning as the REST run fields (see "Run timing and usage fields" in `REST_API.md` and `docs/TELEMETRY.md`). Omitted when not measured |
| `delegationWaitMs`, `timeToFirstTokenExcludingDelegationMs` | Time the run spent waiting on runs it delegated to, and time to first token without that wait. Omitted until the run finishes |
| `createdUtc`, `completedUtc` | Timestamps |

`garrison_list_agents` returns `{"agents":[...],"totalRecords":n}`. `garrison_get_agent` returns one agent in the same shape. Each agent has these fields:

| Field | Meaning |
|---|---|
| `id` | Agent identifier |
| `name` | Agent name, usable as the `agent` argument |
| `displayName` | Human-friendly name; omitted when not set |
| `description` | What the agent does; omitted when not set |
| `inputMode` | `Text` or `Structured` |
| `skills` | The agent's skills, each as `name` or `name: description` (an empty list when there are none) |
| `inputSchemaJson`, `outputSchemaJson` | The agent's input and output JSON Schemas as strings; omitted when the agent has none |

For example:

```json
{"agents":[{"id":"agt_mv2j4kki_BWJVBqKxEXAMPLE","name":"codex-coder","displayName":"Codex coder","description":"Writes and reviews code.","inputMode":"Text","skills":[]}],"totalRecords":1}
```
 `garrison_list_runs` returns `{"runs":[...],"totalRecords":n}` of run summaries. `garrison_get_run_events` returns the same body as `GET .../runs/{id}/events`, without the raw harness output.

When `garrison_invoke_agent` stops waiting before the run finishes, the summary has `finished: false` and the current status. Follow it with `garrison_get_run` or `garrison_get_run_events`. If `blockedReason` is not null, no worker can take the run yet; waiting longer only helps once a suitable worker registers.

### Errors

Failures inside a tool (not found, not permitted, a missing argument, a rejected parameter) come back as a normal result with `isError: true` and one line of text in the form `Code: message`, so a caller can match the code before the colon:

```json
{"jsonrpc":"2.0","result":{"content":[{"type":"text","text":"NotFound: Run run_nope not found."}],"isError":true},"id":5}
```

| Code | When |
|---|---|
| `NotFound` | The agent or run does not exist (or is outside the calling run's tree) |
| `Forbidden` | The caller lacks the permission; the message names it |
| `ValidationFailed` | A missing argument or a rejected value. Parameter errors name the parameter, for example `ValidationFailed: Run parameter model is not allowed for deployment echo-default: Deployment echo-default does not allow overriding model. parameters.model: ...` |
| `TenantRequired`, `Unauthorized`, `UnknownTool`, `BadRequest` | The call could not be resolved |
| Any REST conflict code | For example `RunFinished`, `NoActiveDeployment`, `DelegationNotAllowed`, `IdempotencyKeyConflict` (see the 409 codes in `REST_API.md`) |

Tool result text is JSON written with plain `\"` escapes, so quotes in run output read naturally.

Protocol problems such as an unknown tool name are JSON-RPC errors:

```json
{"jsonrpc":"2.0","error":{"code":-32602,"message":"Tool 'garrison_nope' was not found."},"id":6}
```

## Delegation from inside a run

When an agent's delegation mode is anything other than `None`, the control plane adds an HTTP MCP server named `garrison` to each of its runs' MCP configuration. It points at `Mcp.PublicUrl` plus `Mcp.Path` and carries `Authorization: Bearer <run token>`. The worker checks before launch that the server answers and offers `garrison_invoke_agent`; if it does not, the run fails instead of starting an agent that cannot do what it was told it can. The name `garrison` is reserved, so tenants cannot register an MCP server with it.

A run token is narrower than the person who started the chain:

- It can only use the eight tools above, and only within the run's tenant.
- `garrison_list_agents` shows only the agents the calling agent may delegate to: none when its delegation mode is `None`, the names on its allowlist when the mode is `AllowList`, and never itself unless recursion is allowed.
- Invocations are checked against the delegation depth limit, cycles, and the allowlist, and fail with the reason when they break a rule.
- Run lookups are limited to runs in the same delegation tree.
- The token is revoked when the run finishes, times out, or loses its lease.

The instructions that teach an agent how to use these tools are prompt templates (`builtin/garrison-tools-instructions` for the tool guidance and `builtin/delegated-task` for the task a child run receives, see `docs/PROMPTS.md`), so you can change how agents are told to delegate per deployment.

## Tool descriptions

Each tool's description is a built-in prompt template with the kind `ToolDescription`, named `builtin/mcp-tool-<tool name>` (for example `builtin/mcp-tool-garrison_invoke_agent`, identifier `tpl_builtin_mcp_tool_invoke_agent`). The server seeds them on first start and reads them once when it starts.

In this release the descriptions cannot be changed through the API. Built-in templates are immutable, the server looks them up by their built-in name, and names starting with `builtin/` are reserved, so a tenant copy cannot take their place. Making these overridable is tracked as a known gap.
