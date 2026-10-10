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

`tenants`, `users`, `credentials`, `roles`, `permissions`, `rolePermissions`, `userRoleAssignments`, `credentialScopeAssignments`, `agents`, `deployments`, `harnessProfiles`, `promptTemplates`, `mcpServers`, `secrets`, `workspaceTemplates`, `artifactStores`, `manifests`, `runs`, `nodes`, `nodePools`, `requestHistory`, `audit`, and `settings`. Collections offer `list`, `get`, `create`, `update`, and `delete` plus resource-specific calls. Common objects (`Agent`, `Deployment`, `Run`, `RunEvent`, `EnumerationResult<T>`) are typed; other fields pass through untouched.

## Streaming run events

```ts
const queued = await client.runs.create({ agentName: "my-agent", input: "Hello" });
for await (const item of client.runs.stream(queued.id)) {
  if (item.event) console.log(item.event.eventType, item.event.text);
  if (item.run) console.log("finished:", item.run.status);
}
```

The iterator ends after `run.completed`. `runs.events` polls, and `runs.waitForCompletion` waits for a terminal status.

## Errors

Non-success responses reject with `GarrisonError` carrying `statusCode`, `code`, `body`, and the parsed `error` payload.

## Build and test

```bash
npm install
npm run build
node test-harness.mjs http://127.0.0.1:8700 access_garrison_default secret_garrison_default_change_me
```
