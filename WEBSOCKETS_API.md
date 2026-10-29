# Garrison WebSocket API

The dashboard keeps its run list, node list, run detail, and pipeline run pages current over one WebSocket connection, and any other client can do the same. The channel is read-only: you subscribe to topics and Garrison pushes changes. To start or cancel runs, use REST, MCP, or A2A.

```text
ws://<server>:8700/v1.0/ws
```

Use `wss://` when the server or the ingress in front of it terminates TLS.

## Authenticating

A connection is authenticated with a session token or a run token, in one of two ways:

- Add it to the URL: `ws://127.0.0.1:8700/v1.0/ws?token=<token>`. The server answers with `welcome` as soon as the connection opens.
- Connect without it and send `{"type":"auth","token":"<token>"}` as the first message. The server answers with `welcome`, or with an `AuthenticationRequired` error if the token is not valid.

Browsers cannot set headers on a WebSocket, which is why the token travels in the URL or a message rather than in `Authorization`. Prefer the auth message when your URLs end up in logs. Access keys and the administrator API key are not accepted here; exchange them for a session token with `POST /v1.0/token` first.

```json
{"type":"welcome","principal":"admin@garrison","tenantId":"default"}
```

Until the connection is authenticated, every message except `auth` and `ping` gets an `AuthenticationRequired` error.

## Client messages

| Message | Effect |
|---|---|
| `{"type":"auth","token":"..."}` | Authenticate, or switch to a different token |
| `{"type":"subscribe","channel":"..."}` | Start receiving a channel |
| `{"type":"unsubscribe","channel":"..."}` | Stop receiving a channel |
| `{"type":"ping"}` | The server answers `{"type":"pong"}` |

## Channels

| Channel | Permission | Sends |
|---|---|---|
| `runs` | Read on Run in your tenant | `runs.changed` with the 25 most recent runs whenever any of them changes status or records a new event |
| `run:{runId}` | Read on Run for that run | Every event of the run as `run.event`, in order, then `run.status` each time the status changes |
| `nodes` | Read on Node | `nodes` with every node (up to 500) whenever a node's status or active run count changes |
| `approvals` | Read on Approval in your tenant | `approvals.changed` with the pending count, the pending approvals (newest first, up to 100), and the count of pending pipeline stage reviews, whenever either changes |
| `fan-out:{fanOutGroupId}` | Read on Run for the group's parent run | `fan-out.status` with the whole group (`FanOutGroupView`) each time its status, a member's status, or its usage changes |
| `conversation-files:{conversationId}` | Read on Conversation for that conversation | `files.changed` with the files that changed whenever a turn, a delegated child, or a user writes or deletes a file in the conversation's file space |
| `pipeline-run:{pipelineRunId}` | Read on PipelineRun for that pipeline run | `pipeline-run.status` with the whole pipeline run (stages, stage run summaries, and reviews) each time its status, a stage, a stage run, or a review changes |

A subscription starts with the current state: `runs`, `nodes`, and `approvals` send their lists at once, `pipeline-run:{pipelineRunId}` sends the pipeline run, `conversation-files:{conversationId}` sends every current file as changed, and `run:{runId}` replays the run's events from the first one before following new ones. Subscribing again to a channel you already have restarts it from scratch the same way.

The `runs`, `run:{runId}`, `pipeline-run:{pipelineRunId}`, and `approvals` channels follow the tenant of the token, so they only ever show that tenant's data. `runs` and `run:{runId}` also send an update when a run starts or stops waiting for a permission approval (`awaitingApproval`).

The `approvals` channel is the push side of the approvals inbox: subscribe to it to show a badge or to notify someone (a chat hook, for example) when a harness is waiting for a decision. Pipeline stage reviews share the inbox, so the message also carries `reviewsPending`, the number of stage reviews waiting for a person; the dashboard's Approvals badge is `pending` plus `reviewsPending`. The reviews themselves are not in the message; list them with `GET .../pipeline-reviews?status=Pending`. Decide over REST or MCP.

```json
{"type":"approvals.changed","pending":1,"reviewsPending":2,"approvals":[{"id":"apr_mv3k2a1b_7QxJm2LhR8sWcN4dTzEf","runId":"run_mv3k29zq_Hc8wPnB2dLx5rTq1VkYa","agentName":"release-helper","toolName":"Bash","summary":"git push origin main","status":"Pending","expiresUtc":"2026-10-11T21:09:03.502117Z", ...}]}
```

```json
{"type":"subscribe","channel":"run:run_mv1r5tum_PzmDRtwczukdCvf7i62"}
```

```json
{"type":"subscribed","channel":"run:run_mv1r5tum_PzmDRtwczukdCvf7i62"}
{"type":"run.event","runId":"run_mv1r5tum_PzmDRtwczukdCvf7i62","event":{"id":"rev_mv1r5twb_JNHtUD7rzc9Gp4VSFWh","tenantId":"default","runId":"run_mv1r5tum_PzmDRtwczukdCvf7i62","sequence":3,"eventType":"AssistantText","timestampUtc":"2026-10-10T02:05:50.359046Z","text":"Echo: ws demo","createdUtc":"2026-10-10T02:05:50.363466Z"}}
{"type":"run.event","runId":"run_mv1r5tum_PzmDRtwczukdCvf7i62","event":{"id":"rev_mv1r5twb_ue1aJaHmerAVWvZEchK","tenantId":"default","runId":"run_mv1r5tum_PzmDRtwczukdCvf7i62","sequence":4,"eventType":"Usage","timestampUtc":"2026-10-10T02:05:50.360608Z","inputTokens":12,"outputTokens":7,"createdUtc":"2026-10-10T02:05:50.363472Z"}}
{"type":"run.status","run":{"id":"run_mv1r5tum_PzmDRtwczukdCvf7i62","agentName":"docs-echo","status":"Succeeded","outcome":"Succeeded","resultText":"Echo: ws demo", ...}}
```

Follow a pipeline run with `pipeline-run:{pipelineRunId}`. Each message is the whole `PipelineRun` as `GET .../pipeline-runs/{id}` returns it; to see a stage's output as it is produced, subscribe to `run:{runId}` for the stage's `currentRunId` as well.

```json
{"type":"subscribe","channel":"pipeline-run:plr_mv5d0k3q_Rk2wT8mNbX4vLq7Y"}
```

```json
{"type":"subscribed","channel":"pipeline-run:plr_mv5d0k3q_Rk2wT8mNbX4vLq7Y"}
{"type":"pipeline-run.status","pipelineRun":{"id":"plr_mv5d0k3q_Rk2wT8mNbX4vLq7Y","pipelineName":"release-notes","status":"AwaitingReview","outcome":"None","currentPosition":1,"stages":[...],"runs":[...],"reviews":[{"id":"prv_mv5d0k9a_Hq3Lz8WcN1tYb5Ks","status":"Pending", ...}], ...}}
```

Follow a conversation's shared files (see [docs/FILE_SPACES.md](docs/FILE_SPACES.md)) with `conversation-files:{conversationId}`. Each message lists only the files that changed since the last one; read the bytes over REST.

```json
{"type":"files.changed","conversationId":"cnv_mv5d1a2b_Tq8LmZ3wR7xKc4Np","fileSpaceId":"cfs_mv5d1a2c_Wb2Nq7Hx4LtYk9Rs","changed":[{"path":"notes/sources.md","version":2,"deleted":false,"sha256":"4b7e...","sizeBytes":118}]}
```

The `event` object is a `RunEvent` and the `run` object is a `Run`, exactly as REST returns them (see `REST_API.md`), including `rawEventJson`, the harness's original line, when the parser kept it. `runs.changed` carries `runs`, an array of `Run`; `nodes` carries `nodes`, an array of `Node`.

## Server messages

| Type | Fields |
|---|---|
| `welcome` | `principal`, `tenantId` |
| `subscribed`, `unsubscribed` | `channel` |
| `pong` | none |
| `runs.changed` | `runs` |
| `nodes` | `nodes` |
| `approvals.changed` | `pending`, `reviewsPending`, `approvals` |
| `pipeline-run.status` | `pipelineRun` |
| `fan-out.status` | `fanOutGroup` |
| `files.changed` | `conversationId`, `fileSpaceId`, `changed` (each `path`, `version`, `deleted`, `sha256`, `sizeBytes`) |
| `run.event` | `runId`, `event` |
| `run.status` | `run` |
| `error` | `code`, `message`, and `channel` for subscription errors |

| Error code | Cause |
|---|---|
| `InvalidJson` | The message is not a JSON object with a `type` |
| `AuthenticationRequired` | The token is invalid, or the connection is not authenticated yet |
| `SubscriptionDenied` | Unknown channel, missing permission, a run, pipeline run, conversation, or fan-out group that does not exist, or a session without a tenant. Run tokens are denied `pipeline-run:{id}` |
| `TooManySubscriptions` | The session already holds 64 subscriptions, each of which polls the database. Unsubscribe from one first |

Errors never close the connection.

## Delivery

The server checks subscriptions about once a second and reads from the database, so any control-plane replica can serve any client and nothing is lost when a client reconnects to a different replica. After reconnecting, subscribe again: `run:{runId}` replays from the start, so de-duplicate on `event.sequence` if you keep state across connections. For a single run, the SSE stream at `GET .../runs/{id}/events/stream` (see `REST_API.md`) is a simpler choice when you only need one run and want to resume from a known sequence.

## Example

```javascript
const ws = new WebSocket("ws://127.0.0.1:8700/v1.0/ws");
ws.onopen = () => {
  ws.send(JSON.stringify({ type: "auth", token }));
  ws.send(JSON.stringify({ type: "subscribe", channel: "runs" }));
};
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.type === "runs.changed") render(msg.runs);
  if (msg.type === "error") console.warn(msg.code, msg.message);
};
```
