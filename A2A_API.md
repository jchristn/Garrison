# Garrison A2A API

Garrison exposes agents to other agents over the Agent2Agent protocol (A2A 1.0, JSON-RPC binding). Each agent with `exposeA2A` set gets its own agent card and its own JSON-RPC endpoint. A2A tasks are Garrison runs: sending a message starts a run, the task identifier is the run identifier, and everything you can see over A2A you can also see over REST, MCP, and the dashboard.

The gateway shares the REST listener (port 8700 by default). Agents are addressed by tenant and name:

| Route | Authentication | Purpose |
|---|---|---|
| `GET /v1.0/a2a/{tenantId}/{agentName}/.well-known/agent-card.json` | None | The agent card |
| `GET /v1.0/a2a/{tenantId}` | Read on Agent | Cards for every exposed agent in the tenant, as a JSON array |
| `POST /v1.0/a2a/{tenantId}/{agentName}` | Any REST scheme | JSON-RPC endpoint |

An agent that does not exist or is not exposed answers 404 for its card and `-32001` on the JSON-RPC endpoint. So does an agent in a tenant other than the caller's, unless the caller is a system administrator.

Only agents are exposed over A2A. Pipelines (`docs/PIPELINES.md`) have no agent card and no A2A endpoint; start them over REST, MCP, or an SDK. An agent that is a pipeline stage still has its own card, and a message sent to it runs that agent alone, outside any pipeline.

## Agent cards

```bash
curl -s http://127.0.0.1:8700/v1.0/a2a/default/docs-echo/.well-known/agent-card.json
```

```json
{
  "name": "docs-echo",
  "description": "Echoes its input",
  "version": "0.2.0",
  "supportedInterfaces": [
    { "url": "http://127.0.0.1:8700/v1.0/a2a/default/docs-echo", "protocolBinding": "JSONRPC", "protocolVersion": "1.0" }
  ],
  "capabilities": { "streaming": true, "pushNotifications": false, "stateTransitionHistory": false },
  "provider": { "organization": "Garrison", "url": "https://github.com/jchristn/Garrison" },
  "skills": [ { "id": "docs-echo", "name": "docs-echo", "description": "Echoes its input", "tags": [] } ],
  "defaultInputModes": [ "text/plain" ],
  "defaultOutputModes": [ "text/plain", "application/json" ],
  "securitySchemes": {
    "garrison": {
      "httpAuthSecurityScheme": {
        "scheme": "bearer",
        "description": "Garrison session token from POST /v1.0/token, or a run token issued to a Garrison agent."
      }
    }
  },
  "securityRequirements": [ { "schemes": { "garrison": [] } } ]
}
```

The card's `name` is the agent's display name when it has one, and its name otherwise; the URL always uses the agent's name. The interface URL is built from `Rest.ExternalBaseUrl` (`GARRISON_EXTERNAL_BASE_URL`) when it is set, and otherwise from the request's scheme and `Host` header (the scheme comes from `X-Forwarded-Proto` when a proxy sends it). Set `Rest.ExternalBaseUrl` whenever Garrison sits behind an ingress or load balancer that rewrites the host, or remote agents will be handed an address they cannot reach. Cards never use `Rest.PublicBaseUrl`: that is the internal address handed to runs (for example `http://garrison-server:8700`), which callers outside the cluster or Compose network cannot reach. The same rule applies to `GET /v1.0/api/tenants/{tenantId}/agents/{idOrName}/card`. Agents whose input mode is `Structured`, or that have an input schema (`inputSchema`), advertise `application/json` as their input mode instead of `text/plain`. For an agent with an input schema, the message text must be a JSON document that matches the schema; a message that does not parse or does not match gets a JSON-RPC error carrying the same field messages and codes as REST (`InputNotJson` or `InputSchemaViolation` on keys such as `input.topic`), and no task is created.

The skill description is the agent's description by default. To word it differently, point the agent's `skillDescriptionTemplateId` at a prompt template, or give the tenant a `ToolDescription` template named `a2a-skill-description` to change it for every agent without its own; the built-in is `builtin/a2a-skill-description`. The template is rendered with the full template language (filters, conditionals, includes) and these variables: `agent.name`, `agent.displayName`, `agent.description`, `agent.tags`, `tool.name`, `tenant.id`, and `garrison.version`. The card's `description` is the agent's description when it has one and the rendered skill description otherwise; a skill without a description of its own uses the rendered text.

One renderer builds every card: this route, `GET /v1.0/a2a/{tenantId}`, and `GET /v1.0/api/tenants/{tenantId}/agents/{idOrName}/card` return the same card for the same agent and host. The bearer scheme is always keyed `garrison` in `securitySchemes` and `securityRequirements`.

## Authentication

The card advertises bearer authentication, and that is what most A2A clients send, but the JSON-RPC endpoint accepts every scheme REST accepts: session tokens, `x-access-key` and `x-secret-key`, signed requests, the administrator API key, and run tokens. Sending a message needs Execute on Agent; reading, listing, and subscribing need Read on Run; cancelling needs Update on Run. A refusal is JSON-RPC error `-32007`.

## Methods

Garrison accepts both the A2A 1.0 method names and the older slash-style names.

| Method | Alias | What it does |
|---|---|---|
| `SendMessage` | `message/send` | Start a run and, unless told not to, wait for it |
| `SendStreamingMessage` | `message/stream` | Start a run and stream its progress as SSE |
| `GetTask` | `tasks/get` | Read a task by `id` |
| `ListTasks` | `tasks/list` | List this agent's tasks |
| `CancelTask` | `tasks/cancel` | Cancel a task by `id` |
| `SubscribeToTask` | `tasks/resubscribe` | Stream an existing task's progress as SSE |

### SendMessage

Give every new message its own `messageId`. This works in bash and zsh because the ID is made in the current shell, not in a pipeline subshell:

```bash
MSG_ID=$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid)
curl -s -X POST http://127.0.0.1:8700/v1.0/a2a/default/docs-echo \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "1",
    "method": "SendMessage",
    "params": {
      "message": { "role": "ROLE_USER", "messageId": "'"$MSG_ID"'", "parts": [ { "text": "Hello over A2A" } ] }
    }
  }'
```

```json
{
  "jsonrpc": "2.0",
  "result": {
    "task": {
      "id": "run_mv1r3xkn_Hek6UZChHh5Xc6g2Nep",
      "contextId": "cnv_mv1r3xkm_P2vKq8sWd3Lr0Ty7AbN",
      "status": { "state": "TASK_STATE_COMPLETED", "timestamp": "2026-10-10T02:04:21.882039+00:00" },
      "artifacts": [
        { "artifactId": "run_mv1r3xkn_Hek6UZChHh5Xc6g2Nep-result", "name": "result", "parts": [ { "text": "Echo: Hello over A2A" } ] }
      ],
      "metadata": {
        "garrison.agent": "docs-echo",
        "garrison.outcome": "Succeeded",
        "garrison.servedModel": "fake-model",
        "garrison.traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
        "garrison.conversationId": "cnv_mv1r3xkm_P2vKq8sWd3Lr0Ty7AbN",
        "garrison.conversationTurn": 1,
        "garrison.inputTokens": 12,
        "garrison.outputTokens": 7
      }
    }
  },
  "id": "1"
}
```

How the message becomes a run:

- **Input.** The parts are joined, separated by blank lines, into the run's input. Text parts are used as is, data parts are serialized as JSON, and URL parts contribute the URL. A message with none of these, or whose parts add up to only whitespace, is rejected with `-32602` and starts no task.
- **Idempotency.** `messageId` becomes the run's idempotency key (`a2a:<messageId>`). Sending the same `messageId` with the same content again within 24 hours returns the original task instead of starting a new run, so retries are safe. Sending it with different content is a mistake and is rejected with HTTP 409 Conflict and a JSON-RPC error (code `-32602`, `data.code` `MessageIdConflict`, `data.taskId` the existing task) whose message names the `messageId` and the task. Use a new `messageId` for every new message.
- **Parameters.** Request metadata entries named `garrison.parameter.<name>` become run parameters, for example `"metadata": {"garrison.parameter.model": "sonnet"}`. They are validated against the deployment's allowed overrides exactly like REST parameters. A rejected parameter is named in the error message (for example `parameters.model: Deployment echo-default does not allow overriding model.`) and in `data.errors` and `data.fieldCodes`.
- **Waiting.** The call waits up to `Mcp.MaxToolWaitSeconds` (90 by default) for the run to finish. Set `"configuration": {"returnImmediately": true}` to get the task back at once in the `TASK_STATE_SUBMITTED` state, then poll with `GetTask` or attach with `SubscribeToTask`.
- **Disconnecting.** A blocking `SendMessage` whose client disconnects before the task finishes cancels the task (and any runs it delegated), so an abandoned request does not keep a model busy. The wait running out does not cancel it, and neither does a replica shutting down. To start work that outlives the connection, use `returnImmediately`.
- **Context.** Every message belongs to a Garrison conversation (see Conversations in `REST_API.md`). A message without `contextId` starts a new conversation, and the task's `contextId` is the conversation identifier (`cnv_...`). A message whose `contextId` names a conversation of this agent becomes its next turn: the agent resumes the harness session the earlier messages built, so it remembers them. A `contextId` Garrison has not seen (one your client generated) starts a conversation for it, and later messages with the same value continue that conversation; the tasks report your value as their `contextId`.
- **One message at a time per context.** A message sent while the context's previous task is still working is rejected with `-32602` and `data.code` `ConversationBusy`; the message names the working task. Wait for that task (or cancel it) and send again. Messages in different contexts run in parallel as usual.

Continuing a conversation:

```bash
curl -s -X POST http://127.0.0.1:8700/v1.0/a2a/default/docs-echo \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "2",
    "method": "SendMessage",
    "params": {
      "message": { "role": "ROLE_USER", "messageId": "'"$(uuidgen)"'", "contextId": "cnv_mv1r3xkm_P2vKq8sWd3Lr0Ty7AbN", "parts": [ { "text": "And now in French" } ] }
    }
  }'
```

### Tasks

| Garrison | A2A |
|---|---|
| Run identifier | Task `id` |
| The run's conversation: its identifier, or the client `contextId` it was created for. Runs outside a conversation (REST runs and delegated runs) report their delegation chain's root run | `contextId` |
| `Pending`, `Queued` | `TASK_STATE_SUBMITTED` |
| `Leased`, `Running`, `Cancelling` | `TASK_STATE_WORKING` |
| `Succeeded` | `TASK_STATE_COMPLETED` |
| `Cancelled` | `TASK_STATE_CANCELED` |
| `Rejected` | `TASK_STATE_REJECTED` |
| `Failed`, `TimedOut`, and anything else | `TASK_STATE_FAILED` |

A completed task carries one artifact, `<runId>-result`, named `result`. It has a text part with the final answer and, when the agent produced structured output, a second data part with media type `application/json`. Failed and rejected tasks carry a status message made of the run's outcome and error message, in the form `<outcome>: <error>`. Tasks in a conversation also have `garrison.conversationId`, `garrison.conversationTurn`, and, when the turn started a fresh session from the transcript, `garrison.conversationFallbackReason`. Every task has `garrison.agent`, `garrison.outcome`, `garrison.inputTokens`, `garrison.outputTokens`, `garrison.cachedTokens`, `garrison.reasoningTokens`, and `garrison.toolCallCount` in its metadata, and `garrison.servedModel` (the model the harness reported, or `null`), and `garrison.traceId` (the run's W3C trace ID, omitted for runs created before trace IDs were recorded). Once measured, it also has the run timing values `garrison.timeToFirstTokenMs`, `garrison.streamingMs`, `garrison.executionMs`, `garrison.queueMs`, `garrison.totalMs`, and `garrison.outputTokensPerSecond`, and once the run finishes `garrison.delegationWaitMs` and `garrison.timeToFirstTokenExcludingDelegationMs` (see `docs/TELEMETRY.md`).

`GetTask` takes `{"id": "<runId>"}`. A task that belongs to a different agent is reported as not found (`-32001`), even when it exists.

`ListTasks` returns this agent's tasks, newest first. Parameters: `contextId` (only the tasks of that conversation, or of that delegation chain for a root run identifier), `pageSize` (1 to 100, default 50), `pageToken` (the `nextPageToken` from the previous page), and `includeArtifacts` (default false). The response has `tasks`, `pageSize`, `totalSize`, and `nextPageToken`, which is empty on the last page.

`CancelTask` takes `{"id": "<runId>"}` and returns the task. A run that already finished cannot be cancelled (`-32002`).

### Streaming

`SendStreamingMessage` takes the same parameters as `SendMessage`. `SubscribeToTask` takes `{"id": "<runId>"}`. Both answer with `text/event-stream`, where every `data:` line is a complete JSON-RPC response carrying the request's `id`. The first one holds the task, the rest hold status or artifact updates, and the stream closes after the terminal status.

```text
data: {"jsonrpc":"2.0","result":{"task":{"id":"run_mv1r4ek0_vOHPH3orUauTtaLFk52","contextId":"run_mv1r4ek0_vOHPH3orUauTtaLFk52","status":{"state":"TASK_STATE_SUBMITTED",...},...}},"id":2}

data: {"jsonrpc":"2.0","result":{"statusUpdate":{"taskId":"run_mv1r4ek0_vOHPH3orUauTtaLFk52","contextId":"run_mv1r4ek0_vOHPH3orUauTtaLFk52","status":{"state":"TASK_STATE_WORKING",...}}},"id":2}

data: {"jsonrpc":"2.0","result":{"artifactUpdate":{"taskId":"run_mv1r4ek0_vOHPH3orUauTtaLFk52","contextId":"run_mv1r4ek0_vOHPH3orUauTtaLFk52","artifact":{"artifactId":"run_mv1r4ek0_vOHPH3orUauTtaLFk52-result","name":"result","parts":[{"text":"Echo: Stream this"}]},"append":false,"lastChunk":true}},"id":2}

data: {"jsonrpc":"2.0","result":{"statusUpdate":{"taskId":"run_mv1r4ek0_vOHPH3orUauTtaLFk52","contextId":"run_mv1r4ek0_vOHPH3orUauTtaLFk52","status":{"state":"TASK_STATE_COMPLETED",...}}},"id":2}
```

Garrison sends one status update per state change, plus the result artifact just before the final status of a successful run. It does not stream partial text; follow the run's events over REST or WebSocket for that.

Closing a `SendStreamingMessage` stream before the final status cancels the task it started, the same as disconnecting from a blocking `SendMessage`. Closing a `SubscribeToTask` stream only stops watching; the task keeps running.

A task can also fail on its own when a worker run guard stops it: the status message starts with `RepetitionDetected`, `OutputLimitExceeded`, or `NoProgress`, followed by the reason (see "Run guards" in `REST_API.md`).

## Errors

| Code | Meaning |
|---|---|
| `-32700` | The body is not valid JSON |
| `-32601` | Unknown method |
| `-32602` | Invalid parameters: missing input, a parameter the deployment does not allow, or another validation failure |
| `-32001` | The agent or task was not found |
| `-32002` | The task already finished and cannot be cancelled |
| `-32007` | The caller does not have the needed permission |
| `-32603` | The database had no free connections (`data.code` `DatabaseBusy`) or could not be reached (`DatabaseUnavailable`). Sent with HTTP 503 and a `Retry-After` header; retry after that many seconds |

Conflicts that REST reports as 409, such as an inactive agent, an agent with no active deployment, or a delegation rule violation, come back as `-32602` with the Garrison error code at the start of the message, for example `NoActiveDeployment: Agent docs-echo has no active deployment with a weight above zero, so it cannot run. ...`. The same applies to `QuotaExceeded` and to `DelegationCapacityExhausted`, which REST reports as 429: a run that sends a blocking or streaming message to another agent is recorded as waiting on the child task first, and the message fails with that code when waiting could leave no capacity to run the child (see `docs/SCALING.md`). A `SendMessage` with `returnImmediately` is never refused this way. JSON-RPC errors are sent with HTTP 200, except a reused `messageId` with different content, which is sent with HTTP 409, and database failures, which are sent with HTTP 503.

Garrison errors also carry `data` with a stable machine code, so clients do not need to parse the message:

```json
{
  "jsonrpc": "2.0", "id": "1",
  "error": {
    "code": -32602,
    "message": "Run parameter model is not allowed for deployment docs-echo-default: Deployment docs-echo-default does not allow overriding model. parameters.model: Deployment docs-echo-default does not allow overriding model.",
    "data": {
      "code": "ValidationFailed",
      "errors": { "parameters.model": "Deployment docs-echo-default does not allow overriding model." },
      "fieldCodes": { "parameters.model": "ParameterNotAllowed" }
    }
  }
}
```

`data.code` is `ValidationFailed`, `MessageIdConflict`, `InvalidParams`, `DatabaseBusy`, `DatabaseUnavailable`, or the REST conflict code (for example `NoActiveDeployment`, or `ConversationBusy` for a message whose context is still working on its previous task). A failure before the JSON-RPC call is read (authentication, the tenant check, or authorization while the database is down) answers with the REST error shape instead: 503 `DatabaseUnavailable` or `DatabaseBusy` with `Retry-After`.

## Calling Garrison agents from Garrison agents

Garrison agents normally delegate over MCP (see `MCP_API.md`), but a run token works here too. Calling remote A2A agents from inside Garrison (agents of kind `Remote`) is not available yet; invoking one fails with `RemoteAgentNotSupported`.
