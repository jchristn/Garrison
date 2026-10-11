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

`tenants`, `users`, `credentials`, `roles`, `permissions`, `rolePermissions`, `userRoleAssignments`, `credentialScopeAssignments`, `agents`, `deployments`, `harnessProfiles`, `promptTemplates`, `mcpServers`, `secrets`, `workspaceTemplates`, `artifactStores`, `manifests`, `runs`, `analytics`, `nodes`, `controlNodes`, `nodePools`, `requestHistory`, `audit`, and `settings`. Collections offer `list`, `get`, `create`, `update`, and `delete` plus resource-specific calls. Common objects (`Agent`, `Deployment`, `Run`, `RunEvent`, `EnumerationResult<T>`) are typed; other fields pass through untouched.

Control-plane replicas are read-only: `client.controlNodes.list(query)` returns a `ControlNodeListResponse` (a page of `ControlNode` plus `respondingNodeId`, the replica that answered) and `client.controlNodes.get(nodeId)` reads one replica. `ControlNode` is typed: `status` (`ControlNodeStatus`: `Starting`, `Ready`, `Draining`, `Offline`), `version`, `schemaVersion`, `backplane`, `startedUtc`, `lastHeartbeatUtc`, `activeRequests`, `openStreams`, `heldLongPolls`, `isLeader`, and `leaderEpoch` (leader only). The tenant overview also returns `controlNodesByStatus` and `leaderNodeId`.

## Streaming run events

```ts
const queued = await client.runs.create({ agentName: "my-agent", input: "Hello" });
for await (const item of client.runs.stream(queued.id)) {
  if (item.event) console.log(item.event.eventType, item.event.text);
  if (item.run) console.log("finished:", item.run.status);
}
```

The iterator ends after `run.completed`. `runs.events` polls, and `runs.waitForCompletion` waits for a terminal status.

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
