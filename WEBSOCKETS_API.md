# Garrison WebSocket API

The dashboard keeps its run list, node list, and run detail pages current over one WebSocket connection, and any other client can do the same. The channel is read-only: you subscribe to topics and Garrison pushes changes. To start or cancel runs, use REST, MCP, or A2A.

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
{"type":"welcome","principal":"admin@garrison.local","tenantId":"ten_default"}
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

A subscription starts with the current state: `runs` and `nodes` send their lists at once, and `run:{runId}` replays the run's events from the first one before following new ones. Subscribing again to a channel you already have restarts it from scratch the same way.

The `runs` and `run:{runId}` channels follow the tenant of the token, so they only ever show that tenant's runs.

```json
{"type":"subscribe","channel":"run:run_mv1r5tum_PzmDRtwczukdCvf7i62"}
```

```json
{"type":"subscribed","channel":"run:run_mv1r5tum_PzmDRtwczukdCvf7i62"}
{"type":"run.event","runId":"run_mv1r5tum_PzmDRtwczukdCvf7i62","event":{"id":"rev_mv1r5twb_JNHtUD7rzc9Gp4VSFWh","tenantId":"ten_default","runId":"run_mv1r5tum_PzmDRtwczukdCvf7i62","sequence":3,"eventType":"AssistantText","timestampUtc":"2026-10-10T02:05:50.359046Z","text":"Echo: ws demo","createdUtc":"2026-10-10T02:05:50.363466Z"}}
{"type":"run.event","runId":"run_mv1r5tum_PzmDRtwczukdCvf7i62","event":{"id":"rev_mv1r5twb_ue1aJaHmerAVWvZEchK","tenantId":"ten_default","runId":"run_mv1r5tum_PzmDRtwczukdCvf7i62","sequence":4,"eventType":"Usage","timestampUtc":"2026-10-10T02:05:50.360608Z","inputTokens":12,"outputTokens":7,"createdUtc":"2026-10-10T02:05:50.363472Z"}}
{"type":"run.status","run":{"id":"run_mv1r5tum_PzmDRtwczukdCvf7i62","agentName":"docs-echo","status":"Succeeded","outcome":"Succeeded","resultText":"Echo: ws demo", ...}}
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
| `run.event` | `runId`, `event` |
| `run.status` | `run` |
| `error` | `code`, `message`, and `channel` for subscription errors |

| Error code | Cause |
|---|---|
| `InvalidJson` | The message is not a JSON object with a `type` |
| `AuthenticationRequired` | The token is invalid, or the connection is not authenticated yet |
| `SubscriptionDenied` | Unknown channel, missing permission, a run that does not exist, or a session without a tenant |

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
