# @garrison/sdk (JavaScript and TypeScript)

Client for the Garrison REST API, written in TypeScript and published as ESM and CommonJS with type declarations. It uses `fetch` and Web Crypto, so it runs on Node 18+ and in modern browsers.

## Install

The package is not published to npm yet, so `npm install @garrison/sdk` fails. Build it from your checkout of the repository and install it by path:

```bash
cd /path/to/Garrison/sdk/js && npm install && npm run build
cd /path/to/your-project && npm install /path/to/Garrison/sdk/js
```

Run `npm run build` again in `sdk/js` after pulling SDK changes; `npm install` by path links the folder, so your project picks up the new `dist`.

## Quick start

```ts
import { GarrisonClient } from "@garrison/sdk";

const client = new GarrisonClient("http://127.0.0.1:8700");
await client.login("admin@garrison", "password");   // the same email and password you use in the dashboard

const run = await client.agents.invoke("my-agent", "Summarize the release notes", { wait: true, waitSeconds: 120 });
console.log(run.status, run.resultText);
```

CommonJS works too: `const { GarrisonClient } = require("@garrison/sdk");`.

To sign in with an access key pair instead, call `client.loginWithKeys(accessKey, secretKey)`. See "Where the credentials come from" below.

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

Responses are dictionaries with the server's camelCase field names, exactly as documented in `REST_API.md`.

## Authentication

| Method | Effect |
|---|---|
| `login(email, password, tenantId?)` | Issues a user token and switches to bearer authentication. |
| `loginWithKeys(accessKey, secretKey)` | Issues a credential token and switches to bearer authentication. |
| `useToken(token, tenantId)` | Uses an existing token. |
| `useAccessKey(accessKey, secretKey, tenantId)` | Sends the key pair on every request. |
| `useSignedRequests(accessKey, secretKey, tenantId)` | Signs every request with HMAC-SHA256. Do not use secret keys in browser code you do not control. |
| `useAdminApiKey(apiKey, tenantId?)` | Uses the platform admin API key. |

## Modules

`tenants`, `users`, `credentials`, `roles`, `permissions`, `rolePermissions`, `userRoleAssignments`, `credentialScopeAssignments`, `agents`, `deployments`, `harnessProfiles`, `promptTemplates`, `mcpServers`, `secrets`, `workspaceTemplates`, `artifactStores`, `manifests`, `runs`, `conversations`, `approvals`, `analytics`, `nodes`, `controlNodes`, `nodePools`, `requestHistory`, `audit`, and `settings`. Collections offer `list`, `get`, `create`, `update`, and `delete` plus resource-specific calls. Common objects (`Agent`, `Deployment`, `Run`, `RunEvent`, `Conversation`, `EnumerationResult<T>`) are typed; other fields pass through untouched.

Control-plane replicas are read-only: `client.controlNodes.list(query)` returns a `ControlNodeListResponse` (a page of `ControlNode` plus `respondingNodeId`, the replica that answered) and `client.controlNodes.get(nodeId)` reads one replica. `ControlNode` is typed: `status` (`ControlNodeStatus`: `Starting`, `Ready`, `Draining`, `Offline`), `version`, `schemaVersion`, `backplane`, `startedUtc`, `lastHeartbeatUtc`, `activeRequests`, `openStreams`, `heldLongPolls`, `isLeader`, and `leaderEpoch` (leader only). The tenant overview also returns `controlNodesByStatus` and `leaderNodeId`.

## Permission approvals

When a deployment has `approvalsEnabled` set (Claude Code profiles, and Codex profiles with CodexAppServer delivery), the harness relays permission prompts to Garrison. The deployment's `approvalRules` (`DeploymentApprovalRule`: `action`, a `pattern` in Claude Code rule syntax such as `Bash(git status:*)` or `mcp__github__*`, optional `inputPattern`, and `description`) decide each request, and `approvalDefaultAction` (`ApprovalRuleAction`: `Allow`, `Deny`, `Ask`) covers requests no rule matches. `Ask` sends the request to a person, who has `approvalTimeoutSeconds` (10 to 3600, default 300) before `approvalTimeoutDecision` applies.

```ts
const pending = await client.approvals.list({ status: "Pending" });
const decided = await client.approvals.decide(pending.objects[0].id, { decision: "Allow", reason: "Looks safe", remember: true });
const result = await client.approvals.check(deploymentId, { toolName: "Bash", input: { command: "git status --short" } });
```

`approvals.list` takes an `ApprovalFilter` (`status`, `runId`, `rootRunId`, `agentId`, `deploymentId`, `decisionSource`, `fromUtc`, `toUtc`); for a pending count, pass `{ status: "Pending", maxResults: 1 }` and read `totalRecords`. `approvals.get` rejects with `GarrisonError` (404) for an approval outside the tenant. `approvals.decide` rejects with 409 (`ApprovalNotPending`) when the approval was already decided, and `remember` needs Update on the approval's deployment. `approvals.check` records nothing and resolves to an `ApprovalCheckResponse` (`action`, `source`, `ruleId`, `rulePattern`, `suggestedRule`, `approvalsEnabled`); its input uses Claude Code tool input names (`file_path`, `notebook_path`). `Approval` is typed, and `Run` has `pendingApprovals`, `awaitingApproval` (the run stays `Running` while it waits), and `approvalWaitMs`.

## Streaming run events

```ts
const queued = await client.runs.create({ agentName: "my-agent", input: "Hello" });
for await (const item of client.runs.stream(queued.id)) {
  if (item.event) console.log(item.event.eventType, item.event.text);
  if (item.run) console.log("finished:", item.run.status);
}
```

The iterator ends after `run.completed`. `runs.events` polls, and `runs.waitForCompletion` waits for a terminal status.

## Conversations

A conversation is a multi-turn session with one agent. Each turn is a run, and every turn after the first resumes the harness session the earlier turns built, on the node that holds that session's directories. Pass `{ startConversation: true }` to `agents.invoke`, `runs.create`, or `deployments.test` to start one; the returned run's `conversationId` names it. Pass that ID as `conversationId` to send the next turn.

```ts
const first = await client.agents.invoke("my-agent", "Plan the migration", { startConversation: true });
const conversationId = first.conversationId!;

const second = await client.agents.invoke("my-agent", "Now write step 1", { conversationId });
console.log(second.conversationTurn, second.resultText);   // 2 ...

const conversation = await client.conversations.get(conversationId);
const turns = (await client.conversations.listRuns(conversationId)).objects;   // oldest first
await client.conversations.delete(conversationId);                             // the runs are kept
```

Turns of one conversation never overlap. A turn sent while the previous one is unfinished is refused, not queued, with 409 `ConversationBusy`; wait for the previous run (or cancel it) and send again:

```ts
try {
  await client.agents.invoke("my-agent", "Next", { conversationId });
} catch (e) {
  if (!(e instanceof GarrisonError) || e.statusCode !== 409 || e.code !== "ConversationBusy") throw e;
  const { activeRunId } = await client.conversations.get(conversationId);
  if (activeRunId) await client.runs.waitForCompletion(activeRunId);
}
```

Other 409 codes are `ConversationAgentMismatch` (the conversation belongs to another agent), `ConversationDeploymentMismatch` (the request names a deployment other than the conversation's), and `ConversationDeploymentUnavailable` (the conversation's deployment was deleted). An unknown `conversationId` returns 404. `conversations.delete` also rejects with 409 `ConversationBusy` while a turn is unfinished.

`conversations.list(filter)` takes a `ConversationFilter` (`agentId`, `contextId` for the A2A context the conversation was created for, `callerId`, `search`, `maxResults`, `skip`, `ordering`). `runs.list({ conversationId })` lists a conversation's runs. A `Conversation` carries `turnCount`, `sessionId`, `affinityNodeId` and `affinityNodeName`, `activeRunId`, `lastRunId`, `busy` (true while a turn is unfinished), `fallbackCount`, and `lastFallbackReason`.

Each turn's `Run` has `conversationId`, `conversationTurn` (1 for the first turn, 0 outside a conversation), `resumeSessionId`, `affinityNodeId`, `affinityUntilUtc`, and `conversationFallbackReason`. A fallback happens when the turn cannot resume and starts a fresh session seeded with the transcript of the earlier turns instead; `CONVERSATION_FALLBACK_REASONS` and the `ConversationFallbackReason` type list the values (`AffinityNodeLost`, `AffinityWaitExpired`, `WorkspaceLost`, `SessionMissing`, `HarnessChanged`, `ResumeUnsupported`, `ExecutorWithoutState`). A turn that could not even fall back ends with outcome `ConversationStateLost`. Deleting a conversation writes a `ConversationDeleted` audit record. See "Conversations" in `REST_API.md`.

## Run timing and usage fields

Finished runs carry timing and usage metrics. Most nullable fields are omitted by the server when they cannot be measured, so treat them as optional. `outputTokensPerSecond`, `blockedReason`, `outputSchemaValid`, and `schemaValidationErrors` are always present and are `null` when there is nothing to report.

| Field | Type | Meaning |
|---|---|---|
| `firstTokenUtc`, `lastTokenUtc` | `string` (ISO 8601 UTC) or absent | First and last model output event. |
| `timeToFirstTokenMs` | `number` or absent | Start to first output event. |
| `streamingMs` | `number` or absent | First to last output event. |
| `executionMs` | `number` or absent | Start to completion. |
| `queueMs` | `number` or absent | Creation to start. |
| `totalMs` | `number` or absent | Creation to completion. |
| `delegationWaitMs` | `number` or absent | Time the run spent waiting on child runs it started (delegation), measured from server timestamps of the runs whose `parentRunId` is this run. |
| `timeToFirstTokenExcludingDelegationMs` | `number` or absent | `timeToFirstTokenMs` minus the delegation wait that happened before the first token; never negative. |
| `outputTokensPerSecond` | `number` or `null` | Output throughput while streaming; `null` when not measurable (no streaming window, or one shorter than 100 ms). |
| `reasoningTokens` | `number` (default 0) | Reasoning tokens reported by the harness. |
| `toolCallCount` | `number` (default 0) | Tool calls made by the run. |

`run.blockedReason` (`RunBlockedReason | null`) is computed by the server when a run is read. It is `null` unless the run is `Queued` and no Ready worker can run it. Values: `NoReadyWorker` (no node is Ready), `NoCapableWorker` (no Ready node reports the run's harness), `NoMatchingPool` (capable nodes exist but none matches the deployment's node pool or node selector). The tenant overview counts these runs as `blockedRuns`. See "Blocked runs" in `REST_API.md`.

Runs stopped by a worker run guard end `Failed` with outcome `RepetitionDetected` (the assistant text degenerated into a short repeated unit or into text with no letters or digits), `OutputLimitExceeded` (more assistant text than the deployment's `maxAssistantChars`), or `NoProgress` (nothing happened for `noProgressSeconds`). The partial output is in `run.resultText`, and the run has one `Warning` event with code `RunGuardTriggered`. A waiting invoke cancels its run when the connection drops; pass `{ cancelOnDisconnect: false }` to `agents.invoke` or `runs.create` to keep the run going. See "Run guards" and "Cancellation" in `REST_API.md`.

When the agent has an output schema, the server validates each run's final output against it. `run.outputSchemaValid` (`boolean | null`) is true or false after validation and `null` when nothing was validated, `run.schemaValidationErrors` (`string | null`) holds the first few errors of a failed validation, and `run.repairAttempts` (`number`, 0 or 1) counts the structured output repair Garrison makes when the harness can resume its session. A run whose output still does not validate fails with outcome `SchemaValidationFailed`; `RUN_OUTCOMES` and the `RunOutcome` type list every outcome. See "Structured output validation" in `REST_API.md`.

## Executors and run pods

`Deployment.executor` (`RunExecutor`: `"Process"`, the default, or `"KubernetesJob"` for a Kubernetes Job per run) chooses how runs execute; null uses the node pool's `defaultExecutor`, then Process. `Deployment.podResources` (`RunPodResources`) sets the run pod's requests and limits as Kubernetes quantities. Runs carry `executor`, worker nodes (`WorkerNode`) list `executors`, and only nodes reporting a run's executor claim it. `WorkspaceTemplate` kind `"PersistentVolume"` mounts `persistentVolumeClaim` at the workspace path (KubernetesJob runs only). `RUN_OUTCOMES` includes `PodFailed` for run pods that fail outside the harness. See `docs/KUBERNETES.md`.

## Secret status

The control plane refreshes ChatGPT logins stored in `CodexAuthJson` secrets itself, shortly before the access token expires, and writes the rotated tokens back to the secret. When OpenAI rejects the stored refresh token for good (reused, expired, or revoked), the secret's status becomes `NeedsReauthentication`.

The `Secret` type carries `status` (`SecretStatus`, one of `SECRET_STATUSES`: `"Ok"` or `"NeedsReauthentication"`), `statusMessage` (the provider error, absent when `Ok`), `statusUtc` (when the status left `Ok`), `refreshedUtc` (when the control plane last refreshed the login itself), and `accessTokenExpiresUtc` (expiry of the stored access token; `CodexAuthJson` only). To find secrets that need attention, list them and check `secret.status === "NeedsReauthentication"`, then call `client.secrets.setValue(id, newAuthJson)`. A run whose deployment binds a secret in that state fails before it starts, with outcome `NotCredentialed` and an error message that starts with `SecretNeedsReauthentication:`. (`SecretRefreshFailed:` means the access token was expired and the refresh failed for a passing reason such as a network error; the secret stays `Ok` and a retry may work.) The fix is to replace the value: sign in again with `codex login` using a `CODEX_HOME` nothing else uses, then set the new `auth.json` as the secret's value. Setting a value returns the status to `Ok`. Do not keep using that login on another machine, because both copies share one refresh token; for shared deployments an `OpenAiApiKey` secret is simpler. See "Codex logins" in `docs/SECURITY.md`.

## Run analytics

`analytics.runs(query)` calls `GET /v1.0/api/tenants/{tenantId}/analytics/runs` and returns totals plus time-bucketed series. Every query field is optional: `from`, `to` (ISO 8601 UTC strings or `Date`), `interval` (`minute`, `hour`, `day`, `week`, `auto`), `agentId`, `harnessType`, `deploymentId`, `model` (served model; `"unknown"` matches runs without a recorded model), and `groupBy` (`none`, `agent`, `harness`, `model`, `harnessModel`). With `harnessModel` each series key is `Harness|model` (for example `ClaudeCode|claude-sonnet-5-5`) and its label is `Harness / model`.

```ts
const now = Date.now();
const report = await client.analytics.runs({ from: new Date(now - 86400000), to: new Date(now), interval: "hour", groupBy: "agent" });
console.log(report.totals.runs, report.totals.costUsd, report.bucketSeconds);
for (const series of report.series) {
  for (const bucket of series.buckets) console.log(series.label, bucket.startUtc, bucket.runs, bucket.timeToFirstTokenMsP95);
}
```

`bucketSeconds` is the authoritative bucket size. `truncated` is true when the 100,000-run cap was hit. Averages and percentiles are `null` when a bucket has no samples. Besides `timeToFirstTokenMsAvg`, `timeToFirstTokenMsP50`, and `timeToFirstTokenMsP95`, the metrics include `timeToFirstTokenExcludingDelegationMsAvg`, `timeToFirstTokenExcludingDelegationMsP50`, `timeToFirstTokenExcludingDelegationMsP95`, and `delegationWaitMsAvg`, so agents that delegate can be compared with agents that answer directly. The server returns 400 when `from` is not before `to`, when the range needs more than 400 buckets, or when a parameter is invalid.

`analytics.dimensions({ from, to })` calls `GET /v1.0/api/tenants/{tenantId}/analytics/runs/dimensions` and returns the distinct values among runs in the range (default: the last 24 hours), which is handy for filter pickers. The result is `{ agents: [{ id, name }], harnesses: string[], deployments: [{ id, name, agentId }], models: string[], truncated }`, with each list sorted by name.

```ts
const dims = await client.analytics.dimensions({ from: new Date(now - 7 * 86400000), to: new Date(now) });
for (const model of dims.models) {
  const byModel = await client.analytics.runs({ from: new Date(now - 7 * 86400000), to: new Date(now), model, groupBy: "harnessModel" });
  console.log(model, byModel.totals.runs);
}
```

## Manifests

```ts
const result = await client.manifests.apply(yamlText, { dryRun: true });
for (const item of result.items) {
  console.log(item.kind, item.name, item.result, item.message ?? "");
  for (const change of item.changes ?? []) console.log("  ", change.field, change.before, "->", change.after);
}
```

Each item (`ManifestApplyItem`) reports what the apply did, or for a dry run what it would do. Items that are (or would be) `Updated` carry `changes` (`ManifestFieldChange`: `field`, `before`, `after`), with values as strings truncated to 200 characters.

## Errors

Non-success responses reject with `GarrisonError` carrying `statusCode`, `code`, `body`, and the parsed `error` payload. Validation failures expose field details as `fields`. The settings routes return 400 with `errors`, an object keyed by setting path (for example `Audit.RetentionDays`) whose values say what is wrong; nothing is saved when any value is rejected.

## Build and test

```bash
npm install
npm run build
node test-harness.mjs http://127.0.0.1:8700 access_garrison_default secret_garrison_default_change_me
```

The harness arguments are the base URL, an access key, and a secret key. The values above are the Docker Compose and source-build defaults; on Kubernetes pass the keys from Secret `garrison-secrets` (see "Where the credentials come from"). When the server rejects the keys, the harness stops after the token check with one message that says so.

## Model prices

`client.modelPrices` provides tenant-scoped list, get, create, update, and delete operations for `/model-prices`. Prices start empty and are operator-configured USD rates per million tokens, keyed by exact served model and harness. Optional cache/reasoning rates fall back to input/output rates; explicit zero is free. Configure token inclusion flags for the harness accounting convention (Claude Code cache reads are separate). Harness-reported cost, including zero, takes precedence; estimates set `costEstimated`. Saved run costs survive later price edits or deletion. See [REST API](../../REST_API.md#model-prices).

## Usage quotas

The usage-quota module provides CRUD operations and `client.usageQuotas.usage(id)` for current daily UTC meters. Scope an entry to Tenant, Agent, or Deployment; null limits are unlimited and zero disallows usage. Limits cover admissions, completed tokens/cost, and active concurrency. Unknown cost keeps admission open and sets `costAccountingComplete=false`. Refusals carry `QuotaExceeded` and name the limit. Only administrators have built-in write grants. See [REST API](../../REST_API.md#usage-quotas) for accounting boundaries and supported CLI budget enforcement.

Usage quotas default to monitoring only. Explicitly set `enforcementEnabled` to `true` (Go: `EnforcementEnabled`, C#: `EnforcementEnabled`) on an active quota to enforce limits. Disabled enforcement does not reject runs or lower harness budgets.

## Interactive console

```sh
node sdk/js/bin/console.mjs http://127.0.0.1:8700
```

Commands: `help`, `health`, `login <tenant> <email>`, `keys`, `tenant <id>`, `agents`, `runs`, `invoke <agent> <input>`, `run <id>`, `events <id>`, `watch <id>`, and `quit`. Login/keys prompt for credentials without terminal echo and never save them to history or print authentication responses. Ctrl+C cancels an active request or stream. Authenticate, then use `invoke` to start a run and `watch` to follow its ID.

The npm package installs the `garrison` console command. Set `client.transport.abortSignal` to an AbortSignal to cancel SDK HTTP calls and streams; leave it unset for ordinary use.

## Executor capabilities

Deployments accept `requiredCapabilities`: `isolation` (`Process`, `Container`, `SandboxedRuntime`), `egressControl`, `filesystemSnapshot`, `sessionContinuation`, `crossNodeRestore`, and optional required `coldStartClass` (`Immediate`, `Cold`, `Warm`). Defaults add no requirement beyond Process. Runs retain an admission-time copy. Workers expose `executorCapabilities`; legacy executor names promise no advanced capabilities. Set `executor: "KubernetesJob"` with Container requirements. Unsupported requirements remain queued with `NoCapableWorker`.

Kubernetes workers can report `warmStart: true` alongside `coldStartClass: "Cold"`; this satisfies either Cold or Warm requirements. Warm support requires enabled warming and Kubernetes RBAC. Explicit Warm requirements reject PersistentVolume workspaces and custom pod resources.

## Artifacts

The artifact client lists metadata, reads individual records, downloads raw bytes, creates temporary download links, and deletes files. Deployments select `artifactStoreId` and explicit `artifactGlobs`; empty globs disable automatic collection. Uploads require the active run lease epoch and repair attempt. See [Run artifacts](../../docs/ARTIFACTS.md) for store configuration and API behavior.

## Worker stdio MCP diagnostics

Select a Ready node whose `supportsMcpTests` flag is true, then test the MCP server with that node ID. C# uses `McpServers.TestOnWorkerAsync`, Python uses `mcp_servers.test(id, node_id=...)`, JavaScript uses `mcpServers.test(id, nodeId)`, and Go uses `TestMcpServer(ctx, id, nodeID)`. HTTP testing retains its existing behavior. See [Harness diagnostics](../../docs/HARNESSES.md#test-a-stdio-mcp-server-on-a-worker).

### Optional provider API deployments

The normal agent/deployment methods configure `hrn_builtin_provider_api`: set an explicit model, a `baseUrl` deployment parameter, an `OpenAiApiKey` secret binding, and the usual prompt bindings. Invocation, conversations, approvals, and artifact methods are unchanged. See [provider API configuration](../../docs/PROVIDER_API.md) for parameters and the initial HTTP-tool limitations. Quota enforcement remains optional.

### Management MCP clients

The same agent/deployment/manifest validation, default bindings, versioning, and audit behavior now serve REST and management MCP. Use normal developer/user credentials for MCP configuration tools; hosted run tokens cannot change configuration. Existing SDK REST methods are unchanged. See [management MCP tools](../../docs/MANAGEMENT_MCP.md) for the MCP contract and replacement semantics.
