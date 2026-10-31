# Garrison MCP API

Garrison runs its own Model Context Protocol server, built on Voltaic, so any MCP client can discover Garrison agents, invoke them, and follow their runs. The same server is how agents running inside Garrison call other agents: every run that is allowed to delegate gets this server in its MCP configuration, already authenticated with a run token. Approval-enabled deployments and optional built-in memory also use the Garrison endpoint independently of delegation; tools remain gated by the authenticated principal and enabled capabilities.

The server speaks MCP streamable HTTP (protocol version `2025-06-18`) on its own listener, separate from the REST port. Garrison serves that port itself and relays each request to Voltaic on a loopback port, mapping cluster-wide session identifiers to Voltaic's in-process sessions, so any replica can serve any session.

| Setting | Default | Meaning |
|---|---|---|
| `Mcp.Enable` | `true` | Start the MCP listener |
| `Mcp.Hostname` | `*` | Interface to bind |
| `Mcp.Port` | `8701` | Listener port |
| `Mcp.Path` | `/mcp` | Endpoint path |
| `Mcp.PublicUrl` | none | Internal base URL workers use to reach this server, for example `http://garrison-server:8701`. It is handed to runs, not shown to outside clients. When unset, runs are pointed at `http://127.0.0.1:<Mcp.Port>`, which only works when the worker shares the host. |
| `Mcp.MaxMessageSize` | `16777216` | Largest accepted message in bytes |
| `Mcp.MaxToolWaitSeconds` | `90` | Upper bound for `waitSeconds` on `garrison_invoke_agent` |
| `Mcp.SessionIdleTimeoutSeconds` | `3600` | Idle time after which an MCP session expires on every replica |
| `Mcp.InternalPort` | `0` | Loopback port of the internal Voltaic endpoint behind the public port; 0 picks a free port |

`docs/CONFIGURATION.md` lists the matching environment variables.

## Connecting

Send the same credentials you would send to REST: a bearer session token, `x-access-key` and `x-secret-key`, `x-api-key`, or a signed request (the signature covers the JSON-RPC body, and each nonce is accepted once across all replicas). Requests without valid credentials get `401` with `WWW-Authenticate: Bearer error="invalid_token"`. When the database cannot be reached or its connection pool is exhausted while a request is authenticated, the answer is `503` with a `Retry-After` header and a message starting `DatabaseUnavailable:` or `DatabaseBusy:`; retry after that many seconds.

The example uses the development password, which only a server started with `GARRISON_ALLOW_INSECURE_DEFAULTS=true` accepts; use your own administrator password otherwise.

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
MCP-Session-Id: mcs_mv2u...
Content-Type: application/json

{"jsonrpc":"2.0","result":{"protocolVersion":"2025-06-18","capabilities":{...},"serverInfo":{"name":"Garrison","version":"0.2.0"}},"id":1}
```

Send the returned `MCP-Session-Id` header on later requests. Session identifiers start with `mcs_` and are valid on every control-plane replica, so MCP needs no sticky sessions behind a load balancer: a replica that has not seen a session yet checks it in the database, confirms it belongs to the same principal, and takes it over. A session expires after `Mcp.SessionIdleTimeoutSeconds` (3600) without use, and `DELETE /mcp` with the header ends it everywhere. Another principal presenting the identifier gets 404. Server-sent event streams are resumable with `Last-Event-ID` on the replica that started them; after moving to another replica a client opens a new stream. Most clients handle all of this for you. With Claude Code, for example:

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

A tool that returns a record (a run summary, an agent, an approval) puts it in the result's `structuredContent` as a JSON object, and also as JSON text in `content` for clients that read only `content`. Fields that hold JSON, such as `structuredOutput`, `inputSchema`, `outputSchema`, `rawEvent`, and an approval's `input`, are JSON values in that record, not strings. See "Tool results" in [docs/MANAGEMENT_MCP.md](docs/MANAGEMENT_MCP.md).

| Tool | Permission | Required arguments | Optional arguments |
|---|---|---|---|
| `garrison_list_agents` | Read on Agent | none | `search` (part of a name), `maxResults` (1 to 100, default 25) |
| `garrison_get_agent` | Read on Agent | `agent` (name or identifier) | none |
| `garrison_invoke_agent` | Execute on Agent | `agent`, `input` | `parameters` (object of strings), `deploymentId`, `waitSeconds` (0 to `Mcp.MaxToolWaitSeconds`, default the maximum), `startConversation` (boolean), `conversationId` |
| `garrison_start_run` | Execute on Agent | `agent`, `input` | `parameters`, `deploymentId`, `startConversation`, `conversationId` |
| `garrison_get_run` | Read on Run | `runId` | none |
| `garrison_get_run_events` | Read on Run | `runId` | `afterSequence` (default 0), `limit` (1 to 500, default 100) |
| `garrison_get_run_transcript` | Read on Run | `runId` | `format` (`markdown`, the default, or `json`), `includeThinking` (default false) |
| `garrison_get_conversation_transcript` | Read on Conversation (user and API credentials only) | `conversationId` | `format` (`markdown` or `json`), `includeThinking` (default false) |
| `garrison_cancel_run` | Update on Run | `runId` | none |
| `garrison_upload_artifact` | Create on Artifact (a run token only for its own run, at its current lease epoch) | `runId`, `storeId`, `name`, `epoch`, `repairAttempt`, `contentBase64` | `mediaType`. Uploads one workspace file that the producing deployment's artifact globs select; provider credentials stay on the server |
| `garrison_list_runs` | Read on Run | none | `status`, `agent`, `maxResults` (1 to 100, default 25) |
| `garrison_list_approvals` | Read on Approval | none | `status` (`Pending`, `Approved`, `Denied`, `Expired`, `Cancelled`), `runId`, `agent`, `maxResults` (1 to 100, default 25) |
| `garrison_get_approval` | Read on Approval | `approvalId` | none |
| `garrison_decide_approval` | Update on Approval (and Update on Deployment with `remember`) | `approvalId`, `decision` (`Allow` or `Deny`) | `reason`, `remember` (default false), `rulePattern` |
| `garrison_permission_prompt` | Run tokens only | `tool_name`, `input` (object) | `tool_use_id` |
| `garrison_memory_read` (when enabled) | Execute on Agent for user/developer calls; own agent for hosted runs | `key`; `agent` for user/developer calls | `agent` must match the hosted run if supplied |
| `garrison_memory_write` (when enabled) | Same memory authorization; hosted mutations are epoch-fenced | `key`, `value`; `agent` for user/developer calls | `agent` must match the hosted run if supplied |
| `garrison_memory_delete` (when enabled) | Same memory authorization; hosted mutations are epoch-fenced | `key`; `agent` for user/developer calls | `agent` must match the hosted run if supplied |
| `garrison_list_pipelines` | Read on Pipeline | none | `search` (part of a name), `maxResults` (1 to 100, default 25) |
| `garrison_start_pipeline` | Execute on Pipeline, and Execute on Agent for every stage agent | `pipeline` (name or `ppl_` identifier), `input` | `waitSeconds` (0 to 600, capped by `Mcp.MaxToolWaitSeconds`; omit to return at once), `idempotencyKey`, `inputContentType` (default `text/plain`), `priority` (default 0) |
| `garrison_get_pipeline_run` | Read on PipelineRun | `pipelineRunId` | `waitSeconds` (as above) |
| `garrison_list_pipeline_runs` | Read on PipelineRun | none | `pipeline` (name or identifier), `status`, `maxResults` (1 to 100, default 25) |
| `garrison_cancel_pipeline_run` | Update on PipelineRun | `pipelineRunId` | none |
| `garrison_list_pipeline_reviews` | Read on Approval | none | `status` (`Pending`, `Approved`, `ChangesRequested`, `Rejected`, `Expired`, `Cancelled`), `pipelineRunId`, `maxResults` (1 to 100, default 25) |
| `garrison_decide_pipeline_review` | Update on Approval | `reviewId`, `decision` (`Approve`, `RequestChanges`, or `Reject`) | `comment` (required for `RequestChanges`, at most 8000 characters) |

Run summaries (`garrison_get_run`, `garrison_list_runs`, and the invoke tools) include `awaitingApproval`, true while the run's harness waits for a person to decide a permission approval. `garrison_list_approvals` returns the same page as `GET .../approvals` and `garrison_get_approval` and `garrison_decide_approval` return an `Approval` (see REST_API.md). A run token can neither list nor decide approvals, so an agent cannot approve its own requests.

`garrison_list_agents` returns only active agents. `parameters` must be values the chosen deployment lets callers override, exactly as with `POST .../invoke`. `input` is required by `garrison_invoke_agent`, `garrison_start_run`, `garrison_start_pipeline`, and agent tools: a missing argument fails the tool's schema check, and an empty or whitespace input fails with `ValidationFailed`. No run is started either way.

### Agents as their own tools

An agent with `exposeMcpTool` set is also listed as a tool of its own, for callers in its tenant. The tool is named by the agent's `mcpToolName`, or by the agent's name when that is empty. Calling it is the same as calling `garrison_invoke_agent` for that agent: it waits for the answer and returns the same run summary.

| Argument | Required | Meaning |
|---|---|---|
| `input` | yes | The complete request for the agent |
| `parameters` | no | Run parameters the agent's deployment lets callers override, as strings |
| `waitSeconds` | no | 0 to `Mcp.MaxToolWaitSeconds`, default the maximum |

Rules:

- The permission is Execute on that agent. A caller only sees the agent tools it may execute; run tokens see only agents their run may delegate to (allowlist and recursion rules apply), and the delegation depth and cycle checks apply to the call.
- `mcpToolName` is 1 to 64 letters, digits, underscores, dots, and hyphens, and cannot start with `garrison_`, which is reserved for the built-in tools. An invalid name is refused with 400 when the agent is saved.
- When two agents in a tenant claim the same tool name, the older agent keeps it and the other is not listed.
- The description is the agent's `toolDescriptionTemplateId` template, else the tenant's own `mcp-tool-description` template (see below), else `builtin/mcp-tool-description`. It is rendered with `agent.name`, `agent.displayName`, `agent.description`, `agent.tags`, `tool.name`, `tenant.id`, and `garrison.version`.
- Agent tools appear in `tools/list` as soon as the agent is saved; no reconnect is needed. Garrison does not send `notifications/tools/list_changed`, so a client that caches the list sees a new agent tool the next time it lists tools.
- A system administrator without a tenant sees agent tools only when it sends `x-tenant-id` (or passes `tenantId` in the call).

### Conversations

Pass `"startConversation": true` to `garrison_invoke_agent` or `garrison_start_run` to begin a conversation; the run summary then carries `conversationId` and `conversationTurn`. Pass that `conversationId` with the next request to the same agent and it becomes the conversation's next turn: the agent resumes the harness session of the earlier turns, so it remembers them without the caller repeating them. One turn of a conversation runs at a time; a request sent while the previous turn is unfinished fails with `ConversationBusy: ...` (see Errors). How turns are placed on workers, and what happens when the worker holding the session is gone, is described under Conversations in `REST_API.md`.

```json
{"jsonrpc":"2.0","id":7,"method":"tools/call","params":{"name":"garrison_invoke_agent","arguments":{"agent":"docs-echo","input":"Draft a haiku about queues","startConversation":true}}}
{"jsonrpc":"2.0","id":8,"method":"tools/call","params":{"name":"garrison_invoke_agent","arguments":{"agent":"docs-echo","input":"Now make it rhyme","conversationId":"cnv_mv4m..."}}}
```

### Pipelines

The pipeline tools start and follow [pipelines](docs/PIPELINES.md): ordered agent stages where each stage sees the previous stage's result and a stage can wait for a person to review it. Only users and credentials get them. Run and node tokens neither see them in `tools/list` nor can call them, so an agent cannot start a pipeline or decide a stage review.

```json
{"jsonrpc":"2.0","id":9,"method":"tools/call","params":{"name":"garrison_start_pipeline","arguments":{"pipeline":"release-notes","input":"Write release notes for 2.4 from the merged pull requests.","waitSeconds":60,"idempotencyKey":"release-2.4"}}}
{"jsonrpc":"2.0","id":10,"method":"tools/call","params":{"name":"garrison_list_pipeline_reviews","arguments":{"status":"Pending","pipelineRunId":"plr_mv5d0k3q_Rk2wT8mNbX4vLq7Y"}}}
{"jsonrpc":"2.0","id":11,"method":"tools/call","params":{"name":"garrison_decide_pipeline_review","arguments":{"reviewId":"prv_mv5d0k9a_Hq3Lz8WcN1tYb5Ks","decision":"Approve","comment":"Keep it under 200 words."}}}
```

`garrison_start_pipeline`, `garrison_get_pipeline_run`, and `garrison_cancel_pipeline_run` return the `PipelineRun` exactly as `GET .../pipeline-runs/{id}` does, with its stages, stage run summaries (`runs`), and reviews. A `waitSeconds` wait ends early when the pipeline run finishes or stops for a review (`status: AwaitingReview`); running out of time never cancels anything. `garrison_list_pipelines`, `garrison_list_pipeline_runs`, and `garrison_list_pipeline_reviews` return the same enumeration envelope as their REST lists (`objects`, `totalRecords`, and so on), newest first. `garrison_decide_pipeline_review` returns the decided `PipelineReview`. `REST_API.md` (section Pipelines) describes every field.

Repeating `garrison_start_pipeline` with the same `idempotencyKey` and input returns the same pipeline run; the same key with a different pipeline or input fails with `IdempotencyKeyConflict`. Retrying or deleting a pipeline run and previewing stage prompts are REST-only.


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
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
  "conversationId": "cnv_mv4m...",
  "conversationTurn": 1,
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
| `blockedReason` | Always present. `null` unless the run is `Queued` and no Ready worker can run it, in which case it is `NoReadyWorker`, `NoCapableWorker`, `NoMatchingPool`, or `NoIsolatingWorker` (an `Untrusted` run that no Ready worker can isolate; see "Blocked runs" and "Deployment trust level" in `REST_API.md`). Computed when the summary is built |
| `finished` | Whether the run reached a terminal status |
| `result` | The final text, when finished |
| `servedModel` | The model the harness reported serving the run, for example `claude-sonnet-5-5`. Always present; `null` until the run reports it or when the harness reports none |
| `traceId` | W3C trace ID (32 lowercase hexadecimal characters) of the trace the run was created and compiled in, for opening the run in Tempo or searching its logs (`trace=<traceId>`). Always present; `null` only for runs created before trace IDs were recorded (see `docs/TELEMETRY.md`) |
| `structuredOutput` | Structured output as a JSON value (usually an object), when the agent defines an output schema |
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
| `inputSchema`, `outputSchema` | The agent's input and output JSON Schemas as JSON objects; omitted when the agent has none |

For example:

```json
{"agents":[{"id":"agt_mv2j4kki_BWJVBqKxEXAMPLE","name":"codex-coder","displayName":"Codex coder","description":"Writes and reviews code.","inputMode":"Text","skills":[]}],"totalRecords":1}
```
 `garrison_list_runs` returns `{"runs":[...],"totalRecords":n}` of run summaries. `garrison_get_run_events` returns the same body as `GET .../runs/{id}/events`, without the raw harness output.

`garrison_get_run_transcript` and `garrison_get_conversation_transcript` return the transcript that `GET .../runs/{id}/transcript` and `GET .../conversations/{id}/transcript` download, as `{ "format": "markdown" or "json", "mediaType", "fileName", "truncated", "markdown" or "transcript" }`: `markdown` holds the Markdown text, and `transcript` holds the JSON document (see [docs/TRANSCRIPTS.md](docs/TRANSCRIPTS.md)). Secrets are redacted the same way. A run token can read the transcript of a run in its own run tree, as with `garrison_get_run_events`, and cannot use the conversation tool.

When an agent has an input schema (`inputSchema`), `input` for `garrison_invoke_agent`, `garrison_start_run`, and the agent's own tool must be a JSON document that matches it. A mismatch fails with `ValidationFailed`, and the error text names each field the way REST does (`input.topic`, with the field codes `InputNotJson` or `InputSchemaViolation`).

When `garrison_invoke_agent` stops waiting before the run finishes, the summary has `finished: false` and the current status. Follow it with `garrison_get_run` or `garrison_get_run_events`. If `blockedReason` is not null, no worker can take the run yet; waiting longer only helps once a suitable worker registers. Running out of `waitSeconds` never cancels the run.

### Cancelling a waiting call

While `garrison_invoke_agent` waits, its run belongs to the call. The run is cancelled (and with it any runs it delegated) when:

- the client cancels the call with `notifications/cancelled` for the call's request ID (most clients send it when the user stops a tool call or a request times out on the client side), or
- the MCP session ends while the call waits: the client sends `DELETE` for the session, or the session is closed on any replica.

A cancel notification may reach a different control-plane replica than the one running the call; the replica that receives it relays it over the event backplane to the one that has the call. The harness gets SIGTERM within about a second. The call itself gets no response (the client cancelled it); use `garrison_get_run` to see the run end as `Cancelled`. A control-plane replica that is shutting down does not cancel runs. `garrison_start_run` never ties its run to the call; cancel those runs with `garrison_cancel_run`.

Runs can also end on their own when a worker run guard trips: `outcome` is `RepetitionDetected`, `OutputLimitExceeded`, or `NoProgress`, `errorMessage` says why, and `result` holds the output produced before the stop (see "Run guards" in `REST_API.md`).

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
| Any REST conflict code | For example `RunFinished`, `NoActiveDeployment`, `DelegationNotAllowed`, `IdempotencyKeyConflict`, `ConversationBusy`, `ConversationAgentMismatch`, `PipelineInactive`, `PipelineRunFinished`, `PipelineInUse`, `ReviewNotPending`, `RevisionLimitReached` (see the 409 codes in `REST_API.md`) |
| `DelegationCapacityExhausted` | A run called `garrison_invoke_agent` with a wait, and waiting on the child could leave no capacity to run it: the run's worker already keeps as many runs waiting on a child as it may (`MaxResidentWaiters`, and never so many that every regular and child reserve slot holds a waiting run), or `Runs.DelegationChildQueueDepth` waited children are already queued. Nothing was started. Retry later, or call with `waitSeconds: 0` and follow the run with `garrison_get_run` A resident synchronous child call also fails with this code when the replica has no `Scheduling.MaxSynchronousWaiters` budget; it reserves that budget before child creation, so denial creates neither child nor handshake. |
| `DatabaseBusy`, `DatabaseUnavailable` | The database had no free connections, or could not be reached, while the tool ran. Nothing was started; retry in a few seconds |

Tool result text is JSON written with plain `\"` escapes, so quotes in run output read naturally.

Protocol problems such as an unknown tool name are JSON-RPC errors:

```json
{"jsonrpc":"2.0","error":{"code":-32602,"message":"Tool 'garrison_nope' was not found."},"id":6}
```

## Delegation from inside a run

When an agent's delegation mode is anything other than `None`, the control plane adds an HTTP MCP server named `garrison` to each of its runs' MCP configuration. It points at `Mcp.PublicUrl` plus `Mcp.Path` and carries `Authorization: Bearer <run token>`. The worker checks before launch that the server answers and offers `garrison_invoke_agent`; if it does not, the run fails instead of starting an agent that cannot do what it was told it can. The name `garrison` is reserved, so tenants cannot register an MCP server with it.

A run token is narrower than the person who started the chain:

- It can only use the run and agent tools above and `garrison_permission_prompt`, and only within the run's tenant. The approval list, read, and decide tools refuse it, and the pipeline tools are not offered to it at all.
- `garrison_list_agents` shows only the agents the calling agent may delegate to: none when its delegation mode is `None`, the names on its allowlist when the mode is `AllowList`, and never itself unless recursion is allowed.
- Invocations are checked against the delegation depth limit, cycles, and the allowlist, and fail with the reason when they break a rule.
- A call that waits records the calling run as waiting on its child before the child is created. While it waits, the worker lends the run's slot to delegated children through its child reserve, so runs that all wait on their children cannot hold every slot. When waiting could leave no capacity for the child, the call fails at once with `DelegationCapacityExhausted` instead of waiting forever (see `docs/SCALING.md`).
- Run lookups are limited to runs in the same delegation tree.
- The token is revoked when the run finishes, times out, or loses its lease, including when an expired lease is requeued for another attempt.
- The token is fenced by the lease epoch it was minted for: it works only while its run is active at that epoch. A harness that kept running after its lease expired (a partitioned worker, for example) cannot delegate, read runs, or open an MCP session with it, even before revocation reaches it; the new attempt gets a new token (see `docs/SECURITY.md`).

The instructions that teach an agent how to use these tools are prompt templates (`builtin/garrison-tools-instructions` for the tool guidance and `builtin/delegated-task` for the task a child run receives, see `docs/PROMPTS.md`), so you can change how agents are told to delegate per deployment.

## Permission approvals from inside a run

When a deployment has `approvalsEnabled`, the control plane adds the `garrison` MCP server to its runs even when delegation is off, and the worker's pre-flight check requires `garrison_permission_prompt`. Claude Code is started with `--permission-prompt-tool mcp__garrison__garrison_permission_prompt`, so before it runs a tool that needs permission it calls:

```json
{"name": "garrison_permission_prompt", "arguments": {"tool_name": "Bash", "input": {"command": "git push origin main"}, "tool_use_id": "toolu_01JmH6x9"}}
```

The tool evaluates the deployment's approval rules. Allow and Deny answer at once; Ask creates a pending approval and the call blocks until a person decides it (REST, `garrison_decide_approval`, or the dashboard), it expires, or the run stops. The result is one text content item in the shape Claude Code reads, plus the approval identifier and status:

```json
{"behavior": "allow", "updatedInput": {"command": "git push origin main"}, "approvalId": "apr_mv3k2a1b_7QxJm2LhR8sWcN4dTzEf", "approvalStatus": "Approved"}
```

```json
{"behavior": "deny", "message": "A person reviewing this run in Garrison denied this Bash call (apr_mv3k2a1b_7QxJm2LhR8sWcN4dTzEf). Reason: not during the freeze Do not retry the same call; continue without it, or explain in your answer what you need and why.", "approvalId": "apr_mv3k2a1b_7QxJm2LhR8sWcN4dTzEf", "approvalStatus": "Denied"}
```

The denial message is rendered from the prompt template `builtin/approval-denied`; a tenant template named `approval-denied` with the kind `Other` replaces it for that tenant. Only a run token may call the tool, and only about its own run (the run comes from the token, never from the arguments). Claude Code's own MCP tool timeout is raised to cover the wait (`MCP_TOOL_TIMEOUT` is at least the approval timeout plus two minutes). If the MCP client cancels the call or the run is cancelled, the approval is cancelled and the answer is a denial.

For Codex with the `CodexAppServer` delivery, the worker calls the same tool with the run token for each `item/commandExecution/requestApproval` (as `Bash`, input `command` and `cwd`) and `item/fileChange/requestApproval` (as `Edit`, input `paths`), and answers Codex with `accept` or `decline`.

## Tool descriptions

Each tool's description is a built-in prompt template with the kind `ToolDescription`, named `builtin/mcp-tool-<tool name>` (for example `builtin/mcp-tool-garrison_invoke_agent`, identifier `tpl_builtin_mcp_tool_invoke_agent`). The server seeds them on first start and refreshes them when a release changes the text.

A tenant can replace any of these descriptions for its own callers. Create a prompt template in the tenant, with the kind `ToolDescription`, named `mcp-tool-<tool name>` (the built-in name without `builtin/`):

```bash
curl -s -X POST http://127.0.0.1:8700/v1.0/api/tenants/default/prompt-templates \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name": "mcp-tool-garrison_invoke_agent", "kind": "ToolDescription", "content": "Hand a task to one of our agents. {{tool.defaultDescription}}"}'
```

The override is read on every `tools/list`, so it takes effect for the next listing on every replica, without a restart. It is rendered with these variables:

| Variable | Contents |
|---|---|
| `tool.name` | The tool name, for example `garrison_invoke_agent` |
| `tool.defaultDescription` | The built-in description, so an override can add to it instead of replacing it |
| `tenant.id` | The caller's tenant |
| `garrison.version` | The Garrison version |

Only an active template of kind `ToolDescription` in the caller's own tenant counts. A template of another kind, an inactive one, or one that fails to render is ignored, and the built-in description is used (a render failure is logged as a warning). Callers without a tenant, such as a system administrator using the API key without `x-tenant-id`, always see the built-in descriptions. The same rule covers agent tools: a tenant template named `mcp-tool-description` replaces `builtin/mcp-tool-description` for that tenant's agents that have no `toolDescriptionTemplateId`.

Tool names, input schemas, and permissions are not affected by an override.

## Shared files

Every run sees its conversation's file space (AD3) at `files/` in its workspace, synced in at start and written back at the end. These tools reach the space during the run, so a parent can read what a child wrote a moment ago. See [docs/FILE_SPACES.md](docs/FILE_SPACES.md).

| Tool | Permission | Arguments |
|---|---|---|
| `garrison_files_list` | ConversationFileSpace.Read | optional `includeDeleted` |
| `garrison_files_read` | ConversationFileSpace.Read | `path`; optional `version` |
| `garrison_files_write` | ConversationFileSpace.Update | `path`, `content` or `contentBase64`; optional `mediaType`, `baseVersion` |
| `garrison_files_delete` | ConversationFileSpace.Update | `path` |

A run token always uses its own tree's space and cannot name another. Users and credentials add `conversationId` or `runId` and need Read (or Update, to write or delete) on that conversation or run. `garrison_files_read` returns `path`, `version`, `sha256`, `mediaType`, `sizeBytes`, and `content` for text or `contentBase64` otherwise. `garrison_files_write` returns `requestedPath`, `path`, `version`, `conflict`, and `sha256`: with `baseVersion` set and the file changed since, the write is kept under a conflict name, `conflict` is true, and `path` is that name. Errors use the REST codes: `NotFound`, `InvalidFilePath`, `FileTooLarge`, `FileSpaceFull`, and `TooManyFiles`.

## Fan-out and gather

A run whose agent may delegate can start several agents at once and join them (AD5). Members are ordinary delegated child runs, so the allow list, depth, cycle, and capacity rules apply to each of them.

| Tool | Permission | Arguments |
|---|---|---|
| `garrison_fan_out` | Run tokens only; Agent.Execute on each member's agent | `members` (each `agent`, `input`, optional `label`, `deploymentId`, `parameters`); optional `joinPolicy` (`All`, `Any`, `Quorum`), `quorum`, `timeoutSeconds` (0 to 86400), `maxCostUsd`, `maxTokens`, `cancelRemaining` (default true) |
| `garrison_gather` | The group's parent run, or Run.Read on it | optional `fanOutGroupId` (default the run's latest group), `waitSeconds` |
| `garrison_cancel_fan_out` | The group's parent run, or Run.Update on it | `fanOutGroupId`; optional `reason` |

`garrison_fan_out` checks every member first: a member that does not exist, is off the allow list, would go too deep or form a cycle, or has an input its schema refuses, refuses the whole call before any child starts, with that check's code and the member's index. More members than `Delegation.MaxFanOutWidth` (default 8) is `FanOutTooWide`. When children could never run (a resident parent on a worker without a child reserve, for example), the call fails with `DelegationCapacityExhausted` and nothing keeps running. An identical call from the same run returns the group it already started. The result is the group with every member's run ID; it never waits.

A group ends once:

- **Joined**: the policy is met. `All` needs every member finished, `Any` one success, and `Quorum` the given number of successes. A group also joins when every member has finished, or when so many have failed that the quorum can no longer be met. With `cancelRemaining`, members still running when `Any` or `Quorum` is met are cancelled.
- **TimedOut**: `timeoutSeconds` passed first.
- **BudgetExceeded**: the members' recorded cost or tokens went over `maxCostUsd` or `maxTokens`.
- **Cancelled**: `garrison_cancel_fan_out` was called, or the parent run finished or was cancelled.

Members still running when a group times out, goes over budget, or is cancelled are cancelled.

`garrison_gather` waits up to `waitSeconds` and returns the group (`FanOutGroupView`), whether or not it ended:

- `status` and `statusReason`.
- `members`, each with `status`, `outcome`, `resultText` (cut at `Delegation.GatherResultCharLimit`), `structuredOutput` (a JSON value), `errorMessage`, and `filesWritten` (paths in the shared file space).
- `pending` and `failed`, as lists of labels.
- `costUsd` and `tokens`.
- `summary`, rendered by the `builtin/fan-out-gather-result` template.

Partial results are always returned. When the parent's deployment has `suspensionEnabled` and the group is still running, gather returns at once with `continuationMarker` `GARRISON_CONTINUATION_WAIT`. The run then finishes its turn and releases its slot. Garrison resumes it when the group ends, and the resumed turn sees each member's result.

Run objects carry `fanOutGroupId`. The REST routes and the `fan-out:{groupId}` WebSocket channel show groups to people (see [REST_API.md](REST_API.md#fan-out-groups) and [WEBSOCKETS_API.md](WEBSOCKETS_API.md)). [examples/fan-out.yaml](examples/fan-out.yaml) runs a fan-out of three on the fake harness.

## Agentic apps

Management tools for apps (AD6), for users and credentials only:

| Tool | Permission | Arguments |
|---|---|---|
| `garrison_list_apps` | AgenticApp.Read | optional `search`, `maxResults` |
| `garrison_get_app` | AgenticApp.Read on the resolved ID | `app` (name or ID) |
| `garrison_create_app` | AgenticApp.Create | `configuration` (REST app fields; agents by name or ID) |
| `garrison_update_app` | AgenticApp.Update on the resolved ID | `app`, `configuration` |

`configuration` takes the REST `AgenticApp` fields, including the branding fields `displayName`, `logoAssetId`, `primaryColor`, `accentColor`, `backgroundColor`, `headerColor`, `agentBubbleColor` (each color `#RRGGBB` or null), `fontFamily` (`System`, `Sans`, `Serif`, `Rounded`, `Mono`), `faviconAssetId`, and `welcomeText`.

Validation errors use the REST field codes (for example `InvalidColor`, `UnknownAsset`). See [docs/APPS.md](docs/APPS.md).

## Studio drafts

Tools for building studio drafts (AD7). Users and credentials can call them with the matching `StudioDraft` permission. A run can call them only when its deployment sets `managementAccess: Drafts`, and then only on drafts of the person it works for, within that person's permissions ([docs/STUDIO.md](docs/STUDIO.md#delegated-management)).

| Tool | Permission | Arguments |
|---|---|---|
| `garrison_studio_list_drafts` | StudioDraft.Read | optional `search` |
| `garrison_studio_create_draft` | StudioDraft.Create | optional `title`, `fromApp` |
| `garrison_studio_get_draft` | StudioDraft.Read | `draftId` |
| `garrison_studio_put_item` | StudioDraft.Update | `draftId`, `version`, `kind`, `name`, `document` (YAML), optional `operation` (`Upsert`, `Delete`) |
| `garrison_studio_remove_item` | StudioDraft.Update | `draftId`, `version`, `kind`, `name` |
| `garrison_studio_graph` | StudioDraft.Read | `draftId` |
| `garrison_studio_graph_operation` | StudioDraft.Update | `draftId`, `version`, `graphOperation` (`AddMember`, `RemoveMember`, `Connect`, `Disconnect`, `SetEntry`, `MoveNode`), and that operation's `app`, `agent`, `role`, `from`, `to`, `fanOut`, `nodeKey`, `x`, `y` |
| `garrison_studio_diff` | StudioDraft.Read | `draftId` |
| `garrison_studio_validate` | StudioDraft.Read | `draftId` |
| `garrison_studio_request_apply` | StudioDraft.Update | `draftId`, `version` |
| `garrison_studio_playground_invoke` | StudioDraft.Update and AgentRevision.Update | `draftId`, `input`, optional `agent`, `conversationId`, `waitSeconds` |

Every change names the draft version the caller read and fails with `DraftVersionConflict` when the draft moved on. No tool applies a draft. A person decides the `DraftApply` approval that `garrison_studio_request_apply` creates.

Architect, architect prompt, and prompt template tools, for users and credentials only. Runs never see or call them, so the architect cannot change itself or its own prompt:

| Tool | Permission | Arguments |
|---|---|---|
| `garrison_studio_list_architects` | Deployment.Read | optional `search` (part of a name), `activeOnly`, `maxResults` (1 to 100, default 25), `skip` |
| `garrison_studio_get_architect` | Deployment.Read on the resolved ID | `architect` (name or ID) |
| `garrison_studio_create_architect` | Deployment.Create | `name`, `harnessProfileId`, optional `description`, `model`, `active` (default true), `credentialSecretId` (the secret the harness signs in with), `architectPromptTemplateId` (default `builtin/agent-architect`), `architectPromptVersion` |
| `garrison_studio_update_architect` | Deployment.Update on the resolved ID | `architect`, optional `name`, `description`, `harnessProfileId`, `model`, `active`, `credentialSecretId` (an empty string removes it), `architectPromptTemplateId`, `architectPromptVersion` |
| `garrison_studio_delete_architect` | Deployment.Delete on the resolved ID | `architect` |
| `garrison_studio_list_architect_prompts` | PromptTemplate.Read | optional `search` (part of a name), `maxResults` (1 to 100, default 25), `skip` |
| `garrison_studio_get_architect_prompt` | Deployment.Read | `deployment` (name or ID) |
| `garrison_studio_set_architect_prompt` | Deployment.Update | `deployment`, `architectPromptTemplateId`, optional `architectPromptVersion` |
| `garrison_clone_prompt_template` | PromptTemplate.Create | `template` (name or ID), `name` |
| `garrison_update_prompt_template` | PromptTemplate.Update | `template`, optional `name`, `description`, `kind`, `content`, `changeNote` |
| `garrison_reset_prompt_template` | PromptTemplate.Update | `template` (a built-in, or a clone of one) |
| `garrison_render_prompt_template` | PromptTemplate.Read | `template` or `content`, optional `context` |

An architect is a deployment that may edit studio drafts, and its ID is the deployment ID (`dep_...`). `garrison_studio_list_architects` and `garrison_studio_list_architect_prompts` return an `EnumerationResult` (`success`, `maxResults`, `skip`, `totalRecords`, `recordsRemaining`, `endOfResults`, `timestampUtc`, `objects`); the get, create, and update tools return an `Architect`, and `garrison_studio_delete_architect` returns `{"id": "dep_...", "deleted": true}`. The architect prompt list keeps its fixed order (built-ins, then clones, then other `System` templates) on every page. `garrison_studio_update_architect` changes only the fields you pass and leaves the deployment's other settings alone; a new prompt takes effect on the architect's next turn. Errors use the REST codes: `ValidationFailed`, `InvalidArchitectPrompt`, `InvalidCredentialSecret`, `NameConflict`, `ArchitectAgentMissing`, and `NotFound` for a deployment that is not an architect. See [docs/ARCHITECT.md](docs/ARCHITECT.md#architects).

The prompt template tools behave like the REST prompt template routes ([docs/PROMPTS.md](docs/PROMPTS.md)): an update with new content adds a version, built-ins cannot be updated, and reset adds a version only when the content differs.

## Capability catalog

When delegation is on, runs also get the catalog tools (AD4). See [docs/CAPABILITIES.md](docs/CAPABILITIES.md).

| Tool | Permission | Arguments |
|---|---|---|
| `garrison_list_capabilities` | Capability.Read for users; run tokens use their discovery permission | optional `kind` (`Agent`, `McpTool`, `HarnessBuiltIn`), `tag`, `search` |
| `garrison_describe_capability` | As above | `capability` (identifier or name) |

A run token sees only agents its agent may delegate to, tools of MCP servers bound to its deployment, built-ins its harness profile probes, and manual descriptors with no source. Users see the tenant catalog. `garrison_list_agents` returns each agent's `hints` (`status`, `sampleSize`, `medianDurationMs`, `p90DurationMs`, `meanCostUsd`); while `status` is `Unknown` the values are null. An unknown or hidden capability answers `NotFound`.

## Management tools

User/developer credentials can configure their tenant through these tools. `AgentDeveloper`, administrator roles, or equivalent resource grants are required for writes. Hosted run and node tokens cannot use management tools; they retain discovery, invocation, and their existing run/approval capabilities.

| Tool | Permission | Required arguments |
|---|---|---|
| `garrison_get_agent_configuration` | Agent.Read | `agent` (name or ID) |
| `garrison_create_agent` | Agent.Create | `configuration` |
| `garrison_update_agent` | Agent.Update on the resolved ID | `agent`, `configuration` |
| `garrison_delete_agent` | Agent.Delete on the resolved ID | `agent`; deletes its deployments and revision history too, and fails with `Protected`, `AgentInUse`, `ReferencedByPipeline`, `ReferencedByTrigger`, or `ReferencedByNotificationEndpoint` like the REST route |
| `garrison_list_deployments` | Deployment.Read | none; optional `search`, `maxResults` |
| `garrison_get_deployment` | Deployment.Read on the ID | `deploymentId` |
| `garrison_create_deployment` | Deployment.Create | `configuration` |
| `garrison_update_deployment` | Deployment.Update on the ID | `deploymentId`, `configuration` |
| `garrison_delete_deployment` | Deployment.Delete on the ID | `deploymentId` |
| `garrison_list_agent_assets` | AgentAsset.Read | none; optional `kind`, `search`, `maxResults` |
| `garrison_get_agent_asset` | AgentAsset.Read on the resolved ID | `asset` (name or ID); optional `version` |
| `garrison_create_agent_asset` | AgentAsset.Create | `configuration` |
| `garrison_update_agent_asset` | AgentAsset.Update on the resolved ID | `asset`, `configuration` |
| `garrison_upload_agent_asset_version` | AgentAsset.Create on the resolved ID | `asset`, `files` (each `path`, optional `mediaType`, and `content` or `contentBase64`); optional `changeNote` |
| `garrison_delete_agent_asset` | AgentAsset.Delete on the resolved ID | `asset` |
| `garrison_list_agent_revisions` | AgentRevision.Read on the resolved agent | `agent` (name or ID); optional `maxResults` |
| `garrison_get_agent_revision` | AgentRevision.Read on the resolved agent | `agent`, `revision` (`arv_` identifier or number) |
| `garrison_publish_agent_revision` | AgentRevision.Execute on the resolved agent | `agent`, `revision`; optional `changeNote` |
| `garrison_promote` | Promotion.Execute for the target environment | `agentId`, `sourceEnvironment`; optional `targetEnvironment`, `agentRevisionId`, `allowSkip`, `note` |
| `garrison_rollback_promotion` | Promotion.Execute for the promotion's target environment | `promotionId` |
| `garrison_apply_manifest` | Manifest.Create; Secret.Create when `allowSecretValues` is true | `manifest`; optional `dryRun`, `allowSecretValues` |
| `garrison_export_manifest` | Manifest.Read | none; optional `kinds` (array), `resources` (array of `Kind/name`), `followReferences`, `includeBuiltIn` |
| `garrison_get_pipeline` | Pipeline.Read on the resolved ID | `pipeline` (name or ID) |
| `garrison_create_pipeline` | Pipeline.Create | `configuration` |
| `garrison_update_pipeline` | Pipeline.Update on the resolved ID | `pipeline`, `configuration` |
| `garrison_delete_pipeline` | Pipeline.Delete on the resolved ID | `pipeline` |
| `garrison_list_triggers` | Trigger.Read | none; optional `search`, `type` (`Cron` or `Webhook`), `maxResults` |
| `garrison_get_trigger` | Trigger.Read on the resolved ID | `trigger` (name or ID) |
| `garrison_create_trigger` | Trigger.Create, and Execute on the target agent (or the pipeline and every stage agent) | `configuration` |
| `garrison_update_trigger` | Trigger.Update on the resolved ID, and Execute on the target | `trigger`, `configuration` |
| `garrison_delete_trigger` | Trigger.Delete on the resolved ID | `trigger` |
| `garrison_list_trigger_fires` | Trigger.Read on the resolved ID | `trigger`; optional `outcome` (`Started`, `Failed`, `Skipped`), `maxResults` |
| `garrison_fire_trigger` | Trigger.Execute on the resolved ID | `trigger`; optional `body` (payload, at most `Triggers.WebhookMaxBodyBytes`), `contentType` |
| `garrison_rotate_trigger_secret` | Trigger.Update on the resolved ID | `trigger`; returns the new `signingSecret` once |
| `garrison_list_notification_endpoints` | NotificationEndpoint.Read | none; optional `search`, `maxResults` |
| `garrison_get_notification_endpoint` | NotificationEndpoint.Read on the resolved ID | `endpoint` (name or ID) |
| `garrison_create_notification_endpoint` | NotificationEndpoint.Create | `configuration` |
| `garrison_update_notification_endpoint` | NotificationEndpoint.Update on the resolved ID | `endpoint`, `configuration` |
| `garrison_delete_notification_endpoint` | NotificationEndpoint.Delete on the resolved ID | `endpoint` |
| `garrison_list_notification_deliveries` | NotificationEndpoint.Read on the resolved ID | `endpoint`; optional `status` (`Pending`, `Delivering`, `Succeeded`, `Failed`), `maxResults` |
| `garrison_rotate_notification_endpoint_secret` | NotificationEndpoint.Update on the resolved ID | `endpoint`; returns the new `signingSecret` once |
| `garrison_test_notification_endpoint` | NotificationEndpoint.Execute on the resolved ID | `endpoint`; returns the delivery |

Configuration uses the REST agent, deployment, and pipeline fields; a pipeline `configuration` carries its complete `stages` list, so read it with `garrison_get_pipeline` before an update. Deleting a pipeline with active pipeline runs fails with `PipelineInUse`. Updates replace the full configuration, preserve identity/creation metadata, and increment deployment versions. Protected records cannot be changed. Creation ignores supplied identity/tenant/protection/version fields. A deployment `configuration` takes `effectPolicy` (`AtMostOnce` when omitted, `AtLeastOnce`, or `Journaled`); the deprecated `retryOnNodeLoss` is still accepted for one release (`true` is `AtLeastOnce`, `false` is `AtMostOnce`), and a configuration whose two values disagree fails with `ValidationFailed` naming `effectPolicy` (field code `EffectPolicyConflict`). Results carry both, with `retryOnNodeLoss` derived from `effectPolicy`. A deployment `configuration` also takes `egressRules` (a list of `cidr`, optional `port`, and `protocol`), validated as over REST: an invalid rule fails with `ValidationFailed` naming the field, such as `egressRules[0].cidr`. A tenant-bound caller cannot override its tenant. Export takes the same selectors as `GET .../manifests/export` and returns `{manifest, mediaType, fileName, requiredSecrets}`: a YAML bundle whose first document lists the secrets, artifact stores, and built-ins the target tenant needs; secret values are never exported. Apply returns the normal manifest report; inspect `failedCount` and document results. Saving a deployment, agent, or manifest that sends a secret's value somewhere needs `Execute` on that `Secret` (the `SecretManager` or `SecretUser` role), as over REST: a deployment fails with `ValidationFailed` naming `resourceBindings` (field code `SecretUseDenied`), and a manifest document reports `errorCode` `SecretUseDenied`. A run parameter rule sent without `validation` is an `Enum` rule and needs its allowed values in `pattern`. See [management workflow and examples](docs/MANAGEMENT_MCP.md).

Trigger and notification endpoint `configuration` objects use the REST models (see [docs/TRIGGERS.md](docs/TRIGGERS.md) and [docs/NOTIFICATIONS.md](docs/NOTIFICATIONS.md)). A trigger created or updated over MCP runs as the calling credential. The `signingSecret` of a new webhook trigger or notification endpoint is in the create result and nowhere else; `garrison_get_*` never returns it. Rotating secrets, firing a trigger by hand, and sending a test notification are also available through the management MCP tools listed above, as well as REST and the dashboard.

Asset tools (AD2) follow [docs/ASSETS.md](docs/ASSETS.md): the read tools are ordinary tools that permission decides, and the write tools are management tools, so run tokens cannot write assets. Revision and promotion tools (AD1) follow the REST rules in [docs/REVISIONS.md](docs/REVISIONS.md): publishing an unchanged draft fails with `RevisionUnchanged`, publishing twice with `RevisionPublished`, and a promotion that skips an environment without `allowSkip` with `PromotionOrderViolation`. Like every management tool, they are hidden from and refused for run and node tokens.

## Execution and recovery behavior

Remote registered A2A/MCP agents use the existing invocation tools and authorization checks. Tenant queue bounds and scheduling weights are described in [tenant scheduling](docs/TENANT_SCHEDULING.md). An opted-in compatible parent can checkpoint while awaiting approval or child work instead of retaining a worker slot; see [continuation](docs/CONTINUATION.md). Lease-epoch checks and the journal apply to Garrison-mediated effects, with the limits in [effect safety](docs/effect-safety.md).

## Optional agent memory

When enabled, `garrison_memory_read`, `garrison_memory_write` and `garrison_memory_delete` expose provider-neutral persistent memory. Keys are scoped to the authenticated tenant and agent; hosted runs cannot select another agent. User/developer calls require Agent.Execute. Mutations use the run effect gateway. See [agent memory](docs/AGENT_MEMORY.md) for schemas, bounds, provider replacement and deployment.
