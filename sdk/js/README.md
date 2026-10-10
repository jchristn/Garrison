# @garrison/sdk (JavaScript and TypeScript)

Client for the Garrison REST API, written in TypeScript and published as ESM and CommonJS with type declarations. It uses `fetch` and Web Crypto, so it runs on Node 18+ and in modern browsers.

## Install

```bash
npm install @garrison/sdk
```

## Quick start

```ts
import { GarrisonClient } from "@garrison/sdk";

const client = new GarrisonClient("http://127.0.0.1:8700");
await client.loginWithKeys("access_...", "secret_...");

const run = await client.agents.invoke("my-agent", "Summarize the release notes", { wait: true, waitSeconds: 120 });
console.log(run.status, run.resultText);
```

CommonJS works too: `const { GarrisonClient } = require("@garrison/sdk");`.

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

`tenants`, `users`, `credentials`, `roles`, `permissions`, `rolePermissions`, `userRoleAssignments`, `credentialScopeAssignments`, `agents`, `deployments`, `harnessProfiles`, `promptTemplates`, `mcpServers`, `secrets`, `workspaceTemplates`, `artifactStores`, `manifests`, `runs`, `analytics`, `nodes`, `nodePools`, `requestHistory`, `audit`, and `settings`. Collections offer `list`, `get`, `create`, `update`, and `delete` plus resource-specific calls. Common objects (`Agent`, `Deployment`, `Run`, `RunEvent`, `EnumerationResult<T>`) are typed; other fields pass through untouched.

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

Finished runs carry timing and usage metrics. Nullable fields are omitted by the server when they cannot be measured, so treat them as optional.

| Field | Type | Meaning |
|---|---|---|
| `firstTokenUtc`, `lastTokenUtc` | `string` (ISO 8601 UTC) or absent | First and last model output event. |
| `timeToFirstTokenMs` | `number` or absent | Start to first output event. |
| `streamingMs` | `number` or absent | First to last output event. |
| `executionMs` | `number` or absent | Start to completion. |
| `queueMs` | `number` or absent | Creation to start. |
| `totalMs` | `number` or absent | Creation to completion. |
| `outputTokensPerSecond` | `number` or absent | Output throughput while streaming. |
| `reasoningTokens` | `number` (default 0) | Reasoning tokens reported by the harness. |
| `toolCallCount` | `number` (default 0) | Tool calls made by the run. |

`run.blockedReason` (`RunBlockedReason | null`) is computed by the server when a run is read. It is `null` unless the run is `Queued` and no Ready worker can run it. Values: `NoReadyWorker` (no node is Ready), `NoCapableWorker` (no Ready node reports the run's harness), `NoMatchingPool` (capable nodes exist but none matches the deployment's node pool or node selector). The tenant overview counts these runs as `blockedRuns`. See "Blocked runs" in `REST_API.md`.

When the agent has an output schema, the server validates each run's final output against it. `run.outputSchemaValid` (`boolean | null`) is true or false after validation and `null` when nothing was validated, `run.schemaValidationErrors` (`string | null`) holds the first few errors of a failed validation, and `run.repairAttempts` (`number`, 0 or 1) counts the structured output repair Garrison makes when the harness can resume its session. A run whose output still does not validate fails with outcome `SchemaValidationFailed`; `RUN_OUTCOMES` and the `RunOutcome` type list every outcome. See "Structured output validation" in `REST_API.md`.

## Run analytics

`analytics.runs(query)` calls `GET /v1.0/api/tenants/{tenantId}/analytics/runs` and returns totals plus time-bucketed series. Every query field is optional: `from`, `to` (ISO 8601 UTC strings or `Date`), `interval` (`minute`, `hour`, `day`, `week`, `auto`), `agentId`, `harnessType`, `deploymentId`, `model` (served model; `"unknown"` matches runs without a recorded model), and `groupBy` (`none`, `agent`, `harness`, `model`, `harnessModel`). With `harnessModel` each series key is `Harness|model` (for example `ClaudeCode|claude-sonnet-4-5`) and its label is `Harness / model`.

```ts
const now = Date.now();
const report = await client.analytics.runs({ from: new Date(now - 86400000), to: new Date(now), interval: "hour", groupBy: "agent" });
console.log(report.totals.runs, report.totals.costUsd, report.bucketSeconds);
for (const series of report.series) {
  for (const bucket of series.buckets) console.log(series.label, bucket.startUtc, bucket.runs, bucket.timeToFirstTokenMsP95);
}
```

`bucketSeconds` is the authoritative bucket size. `truncated` is true when the 100,000-run cap was hit. Averages and percentiles are `null` when a bucket has no samples. The server returns 400 when `from` is not before `to`, when the range needs more than 400 buckets, or when a parameter is invalid.

`analytics.dimensions({ from, to })` calls `GET /v1.0/api/tenants/{tenantId}/analytics/runs/dimensions` and returns the distinct values among runs in the range (default: the last 24 hours), which is handy for filter pickers. The result is `{ agents: [{ id, name }], harnesses: string[], deployments: [{ id, name, agentId }], models: string[], truncated }`, with each list sorted by name.

```ts
const dims = await client.analytics.dimensions({ from: new Date(now - 7 * 86400000), to: new Date(now) });
for (const model of dims.models) {
  const byModel = await client.analytics.runs({ from: new Date(now - 7 * 86400000), to: new Date(now), model, groupBy: "harnessModel" });
  console.log(model, byModel.totals.runs);
}
```

## Errors

Non-success responses reject with `GarrisonError` carrying `statusCode`, `code`, `body`, and the parsed `error` payload.

## Build and test

```bash
npm install
npm run build
node test-harness.mjs http://127.0.0.1:8700 access_garrison_default secret_garrison_default_change_me
```
