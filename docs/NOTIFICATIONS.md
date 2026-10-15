# Notifications

A notification endpoint is a URL that Garrison POSTs to when something happens in the tenant: a run finished, a pipeline run finished, or an approval is waiting for someone. The request carries a small signed JSON document. It tells the receiver what happened and where to look, and leaves it to the receiver to call the API for anything more.

Notification endpoints are tenant resources (`nep_` identifiers) managed over REST, the management MCP tools, manifests (`kind: NotificationEndpoint`), the SDKs, and the dashboard. They were added in P12.14 under decision D-054.

## Endpoints

| Field | Meaning |
|---|---|
| `name` | Unique in the tenant: 1 to 64 lowercase letters, digits, and hyphens |
| `description` | Optional, at most 4000 characters |
| `url` | Absolute `http` or `https` URL, at most 2048 characters, without user information. Checked against the SSRF rules below |
| `events` | At least one of the events below. Duplicates are removed |
| `agentId`, `deploymentId` | Optional filters, as identifiers or names |
| `includeResultText` | Default false. When true, run notifications carry the run's result text |
| `resultTextMaxChars` | How much result text, 1 to 16000, default 1000 |
| `active` | Default true. Events that happen while an endpoint is inactive are never queued for it |
| `signingSecret` | Returned only by create and rotate-secret |
| `signingSecretLast4`, `signingSecretRotatedUtc` | Lets you recognize which secret is current |

An endpoint only ever receives events that happened after it was created. Creating one does not replay history.

## Events

| Event | Sent when |
|---|---|
| `RunSucceeded` | A run finished `Succeeded` |
| `RunFailed` | A run finished `Failed` or `Rejected` |
| `RunCancelled` | A run finished `Cancelled` |
| `RunTimedOut` | A run finished `TimedOut` |
| `PipelineCompleted` | A pipeline run finished `Succeeded` |
| `PipelineFailed` | A pipeline run finished `Failed`, `TimedOut`, or `Cancelled` |
| `ApprovalRequested` | A permission approval is waiting for a person, or a pipeline stage review was requested |

Every run counts, including delegated child runs and pipeline stage runs, so an endpoint that subscribes to `RunFailed` for a busy agent should expect traffic. `ApprovalRequested` skips permission requests that a deployment rule or the deployment default decided on the spot; those never waited for anyone. A seventh value, `Test`, is used by the test action and cannot be subscribed to.

The `agentId` and `deploymentId` filters narrow run events, permission approvals, and stage reviews to runs of that agent or that deployment. Pipeline runs have no single agent, so an endpoint with either filter set receives no pipeline events at all. Use a separate unfiltered endpoint for those.

## The payload

```json
{
  "id": "ndl_2xY...",
  "event": "RunFailed",
  "tenantId": "default",
  "endpointId": "nep_2xX...",
  "occurredUtc": "2026-10-14T09:00:04.1200000Z",
  "link": "https://garrison.example.com/v1.0/api/tenants/default/runs/run_2xW...",
  "run": {
    "id": "run_2xW...",
    "agentId": "agt_...",
    "agentName": "reporter",
    "deploymentId": "dep_...",
    "kind": "Trigger",
    "status": "Failed",
    "outcome": "HarnessFailed",
    "attempt": 1,
    "triggerId": "trg_...",
    "createdUtc": "2026-10-14T09:00:00.0000000Z",
    "startedUtc": "2026-10-14T09:00:01.2000000Z",
    "completedUtc": "2026-10-14T09:00:04.1200000Z"
  }
}
```

Exactly one of `run`, `pipelineRun`, or `approval` is present, except in a test notification, which has none. Fields that are null are left out. `link` is built from `Rest.ExternalBaseUrl` and points at the API resource.

What the payload leaves out matters as much as what it holds. It never contains secrets, run input, error text, tool input, or run output. The one exception is the run's result text, which is included (as `run.resultText`, with `run.resultTruncated`) only when the endpoint sets `includeResultText`, and is cut to `resultTextMaxChars`. Turn it on only for receivers you would trust with the output itself.

`pipelineRun` carries the pipeline run's identifier, pipeline, status, outcome, stage count, final run, trigger, and timestamps. `approval` carries `kind` (`Permission` or `StageReview`), the approval or review identifier, the run, and either the agent, deployment, and tool name (permission approvals) or the pipeline run, pipeline name, and stage name (stage reviews), plus `requestedUtc` and `expiresUtc`.

## Headers and verification

Each request carries:

| Header | Value |
|---|---|
| `Content-Type` | `application/json; charset=utf-8` |
| `User-Agent` | `Garrison/<version>` |
| `X-Garrison-Event` | The event name |
| `X-Garrison-Delivery` | The delivery identifier (`ndl_...`), the same as the payload `id` and the same on every retry |
| `X-Garrison-Signature` | `t=<unix seconds>,v1=<hex HMAC-SHA256 of "<t>.<raw body>">` |

The signature scheme is the one inbound trigger webhooks use ([TRIGGERS.md](TRIGGERS.md#webhook-triggers)). Each attempt is signed with the endpoint's current secret and a fresh timestamp, while the body stays byte-for-byte the same across retries. A receiver should check the signature over the raw bytes, reject timestamps that are too old for its taste, and ignore a delivery identifier it has already handled:

```python
import hashlib, hmac, time

def verify(headers, raw_body: bytes, secret: str, tolerance=300) -> bool:
    parts = dict(p.split("=", 1) for p in headers["X-Garrison-Signature"].split(","))
    ts = int(parts["t"])
    if abs(time.time() - ts) > tolerance:
        return False
    expected = hmac.new(secret.encode(), f"{ts}.".encode() + raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, parts["v1"])
```

## Delivery

Delivery is asynchronous and goes through a durable outbox. The control-plane leader runs a sweep on every maintenance pass: for runs, pipeline runs, permission approvals, and stage reviews it reads what finished or appeared since its last position, re-reading `Notifications.SweepOverlapSeconds` (default 30) of already-scanned history so that a row written late by a slow replica or a skewed clock is still seen. For each matching active endpoint it inserts one outbox row, and a unique key per endpoint and event makes the re-read harmless. The sweep is the only producer, so a replica that crashes in the middle of finishing a run cannot lose its notification.

Every replica runs a dispatcher every `Notifications.DispatchIntervalMs` (default 1000). It claims due rows with a compare-and-set that marks them `Delivering` until a claim expiry, sends up to eight at a time, and records the result. If a replica dies while sending, its claim expires and another replica sends the delivery again. Delivery is therefore at least once, and receivers should deduplicate on `X-Garrison-Delivery`. Under normal operation each notification is sent once.

How an attempt ends:

| Result | Then |
|---|---|
| 2xx | `Succeeded` |
| 408, 429, any 5xx, a connection failure, a DNS failure, or no answer within `Notifications.TimeoutSeconds` (default 10) | Retried |
| 3xx | `Failed`. Redirects are never followed |
| Any other 4xx | `Failed` |
| A destination the SSRF rules refuse | `Failed` |
| The endpoint became inactive, was deleted, or its secret cannot be decrypted | `Failed` |

Retries wait `Notifications.InitialBackoffSeconds` (default 10) after the first failure and double each time, up to `Notifications.MaxBackoffSeconds` (default 3600). After `Notifications.MaxAttempts` (default 8) attempts the delivery is marked `Failed`. With the defaults that is roughly 21 minutes of retrying before giving up.

## SSRF protection

A notification URL is a request the control plane makes from inside your network, so it is checked twice. When an endpoint is saved, the URL must be `http` or `https`, must have a host, and must not carry user information; `localhost` and IP literals are checked against the address rules right away. When a delivery connects, Garrison resolves the host itself and connects only to addresses the rules allow, so a name that resolves (or later rebinds) to an internal address never gets a connection. No proxy is used and redirects are not followed.

| Addresses | Allowed |
|---|---|
| Public addresses | Yes |
| Loopback (127.0.0.0/8, ::1, `localhost`) and private (10/8, 172.16/12, 192.168/16, 100.64/10, fc00::/7, fec0::/10) | Only when `Notifications.AllowPrivateDestinations` is true (off by default) |
| Link-local (169.254.0.0/16, which holds cloud metadata services such as 169.254.169.254, and fe80::/10) | Never |
| Unspecified, multicast, broadcast, and reserved ranges | Never |

IPv4-mapped, IPv4-compatible, and NAT64 (`64:ff9b::/96`) IPv6 addresses are judged by the IPv4 address inside them. A refused URL fails creation with field code `DestinationBlocked`; a malformed one fails with `InvalidUrl`. Turning on private destinations is meant for clusters where the receivers really are internal services, and it still keeps the metadata range closed.

## The delivery log and test sends

`GET .../notification-endpoints/{id}/deliveries` lists an endpoint's deliveries newest first, filterable with `status` (`Pending`, `Delivering`, `Succeeded`, `Failed`). Each delivery shows its event, subject, attempts, next attempt, last HTTP status, last error, last duration, delivery time, and the exact body that was sent. `GET .../deliveries/{deliveryId}` reads one.

`POST .../notification-endpoints/{id}/test` queues a `Test` notification and makes its first attempt before answering, so the response already tells you whether the receiver accepted it. Test sends work on inactive endpoints too, which lets you check a receiver before switching an endpoint on. A test that fails with a retryable error keeps retrying on the normal schedule.

The leader prunes finished deliveries (`Succeeded` and `Failed`) older than `Notifications.DeliveryRetentionDays` (default 14) once an hour. Deleting an endpoint deletes its delivery log, and anything still queued for it is never sent.

## Manifests

```yaml
apiVersion: garrison/v1
kind: NotificationEndpoint
metadata:
  name: ops-alerts
spec:
  url: https://hooks.example.com/garrison
  events: [RunFailed, RunTimedOut, PipelineFailed, ApprovalRequested]
  agent: reporter
```

A new endpoint applied from a manifest gets a generated secret that the apply result does not show; rotate it to read it, or set `spec.signingSecret` in an apply that allows secret values. See [MANIFESTS.md](MANIFESTS.md#notificationendpoint).

Deleting an agent or deployment that an endpoint filters on answers 409 `ReferencedByNotificationEndpoint`.
