# Triggers

A trigger starts work without anyone calling the API at the time. It either fires on a cron schedule or fires when a signed HTTP request arrives at its webhook URL, and every fire starts an ordinary run of an agent or an ordinary pipeline run. Nothing about the run is special afterwards: it is queued, leased, compiled, and executed like any other run, and it shows up in the run list with `kind: Trigger` and the `triggerId` that started it.

Triggers are tenant resources (`trg_` identifiers) managed over REST, the management MCP tools, manifests (`kind: Trigger`), the SDKs, and the dashboard. They were added in P12.5 under decision D-054.

## The shape of a trigger

| Field | Meaning |
|---|---|
| `name` | Unique in the tenant: 1 to 64 lowercase letters, digits, and hyphens, starting and ending with a letter or digit |
| `description` | Optional, at most 4000 characters. Available to the input template as `trigger.description` |
| `type` | `Cron` (default) or `Webhook`. Cannot change after creation |
| `targetType` | `Agent` (default) or `Pipeline` |
| `agentId`, `deploymentId` | The agent to run, and optionally one of its deployments to pin runs to. Identifiers or names; names are replaced with identifiers when saved |
| `pipelineId` | The pipeline to start when `targetType` is `Pipeline`. Identifier or name |
| `inputTemplateId` | A `Task` prompt template that renders the run input. Null uses `builtin/trigger-input` (see below) |
| `priority` | Run priority of started runs, -100 to 100, default 0. Values outside the range are clamped |
| `cronExpression`, `timeZone` | Cron triggers only. Five fields, and an IANA time zone (default `UTC`) |
| `active` | Default true. An inactive trigger never fires |
| `signingSecret` | Webhook triggers only, and only in the response to create and rotate-secret |
| `signingSecretLast4`, `signingSecretRotatedUtc` | Lets you recognize which secret is current |
| `runAsType`, `runAsId`, `runAsName` | The principal fires run as. Set by the server, never by the caller |
| `lastFireUtc`, `lastFireOutcome`, `nextFireUtc`, `fireCount` | Fire bookkeeping. `nextFireUtc` is set only for active cron triggers |

A trigger that runs an agent has no `pipelineId`, and a trigger that starts a pipeline has no `agentId` or `deploymentId`; mixing them fails validation with field code `TargetMismatch`. Other validation codes you may see are `ReferenceNotFound`, `DeploymentAgentMismatch`, `TemplateKindMismatch`, `InvalidCron`, `InvalidTimeZone`, and `TypeImmutable`.

## Who a trigger runs as

A schedule that fires at 3 a.m. has no caller, so somebody has to own the run. Garrison records the principal that last created or changed the trigger (a user, a credential, or a system administrator key) and every fire runs as that principal. The run's `callerType` and `callerId` are that principal, and its `callerName` is `trigger:<name>`, so delegation from inside the run is checked against the same ceiling as if that person had invoked the agent.

Creating or updating a trigger needs `Trigger.Create` or `Trigger.Update`, and also `Agent.Execute` on the target agent. For a pipeline target it needs `Pipeline.Execute` plus `Agent.Execute` on every stage agent, the same check a pipeline start makes. If you lack it, the save answers 403 and nothing is stored.

Permissions are checked again on every fire. When the run-as user or credential has been deactivated or deleted, or has lost permission to run the target, the fire is recorded as `Failed` with error code `RunAsNotAuthorized` and no run starts. Saving the trigger again makes the person who saved it the new run-as principal, which is the intended way to hand a trigger over.

## Cron triggers

Cron expressions have five fields: minute, hour, day of month, month, and day of week. Garrison uses the Cronos parser, so lists (`1,15`), ranges (`1-5`), steps (`*/10`), month and day names (`JAN`, `MON`), `L`, `W`, `#`, and the macros `@hourly`, `@daily`, `@weekly`, `@monthly`, `@yearly`, and `@every_minute` all work. Six-field expressions with seconds are rejected.

The expression is evaluated in `timeZone`, an IANA name such as `America/New_York` or `Europe/Berlin`. Daylight saving follows Cronos: a local time that does not exist on the spring-forward day fires at the moment of the transition, and a local time that happens twice in the autumn fires once. `0 9 * * 1-5` in `America/New_York` therefore means 09:00 New York time on weekdays all year, not 14:00 UTC.

### Leader-only firing

Only the control-plane leader fires cron triggers. On every maintenance pass (`Runtime` maintenance interval, two seconds by default) it reads the active cron triggers whose `nextFireUtc` has passed and claims each occurrence with a compare-and-set that moves `nextFireUtc` from the value it read to the next occurrence. Exactly one caller wins that update. A replica that also thinks it is the leader during a handover loses the compare-and-set and does nothing, and the fire record has a unique key per occurrence (`cron:<ticks>`) as a second guard. A cluster with three replicas fires each occurrence once.

Firing runs with the leader's other maintenance steps, so it follows the same pause rule: after the leader notices that its own process was paused (host sleep, a frozen VM, a clock jump), it holds every step, cron firing and notification queueing included, until the pause deferral ends (`Scheduling.PauseGraceMs`). A schedule that came due during the pause fires at the end of the deferral, under the catch-up rules below.

Cron fires are at most once per occurrence. The leader claims the occurrence before it creates the run, so a leader that dies in the few milliseconds between the two loses that occurrence rather than firing it twice. For a schedule that is the safer failure.

### Missed occurrences

If no replica could fire a schedule for a while (every replica down, a long pause, a database outage), the leader that comes back does not replay every missed occurrence. All of them collapse into one fire for the most recent one, with `scheduledUtc` set to that occurrence. When even the most recent missed occurrence is older than `Triggers.CronMaxLatenessSeconds` (default 3600), nothing runs: the occurrence is recorded as a `Skipped` fire with error code `MissedSchedule`, and the schedule continues with the next future occurrence. Setting the bound to 0 always fires once, however late.

An inactive trigger has no `nextFireUtc`. Activating it again schedules the first occurrence after the moment it was activated, so it never catches up on the time it was off. Editing a trigger without changing its expression, time zone, or active flag keeps the scheduled occurrence; changing any of them reschedules from now.

## Webhook triggers

A webhook trigger gets a signing secret (`whsec_` followed by 40 random characters) when it is created. The secret is stored encrypted with the cluster master key and is returned exactly once, in the create response. Lose it and you rotate it: `POST .../triggers/{id}/rotate-secret` returns a new one, and the old one stops working at once.

Deliveries go to:

```
POST /v1.0/api/tenants/{tenantId}/triggers/{triggerId}/webhook
```

The route takes no token. It is authorized only by the `X-Garrison-Signature` header:

```
X-Garrison-Signature: t=<unix seconds>,v1=<hex>
```

`<hex>` is the lowercase hexadecimal HMAC-SHA256, keyed with the UTF-8 bytes of the signing secret, of the timestamp, a period, and the raw request body exactly as sent: `HMAC(secret, "<t>.<body>")`. The header may carry more than one `v1=` value and any match is accepted. The timestamp must be within `Triggers.WebhookToleranceSeconds` (default 300) of the server clock in either direction, which is what stops a captured request from being replayed later.

An optional `X-Garrison-Delivery` header (1 to 128 printable ASCII characters) names the delivery. A second request with the same delivery identifier does not start a second run; it answers 200 with the first fire and `duplicate: true`. Senders that retry on timeouts should always set it.

Signing with openssl:

```bash
SECRET='whsec_...'
BODY='{"action":"opened","number":42}'
TS=$(date +%s)
SIG=$(printf '%s.%s' "$TS" "$BODY" | openssl dgst -sha256 -hmac "$SECRET" -hex | sed 's/^.* //')
curl -sS -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/triggers/trg_.../webhook" \
  -H "Content-Type: application/json" \
  -H "X-Garrison-Delivery: pr-42-opened" \
  -H "X-Garrison-Signature: t=$TS,v1=$SIG" \
  --data-binary "$BODY"
```

The same in Python:

```python
import hashlib, hmac, json, time, urllib.request

secret = b"whsec_..."
body = json.dumps({"action": "opened", "number": 42}).encode()
ts = str(int(time.time()))
sig = hmac.new(secret, ts.encode() + b"." + body, hashlib.sha256).hexdigest()
req = urllib.request.Request(
    "http://127.0.0.1:8700/v1.0/api/tenants/default/triggers/trg_.../webhook",
    data=body, method="POST",
    headers={"Content-Type": "application/json", "X-Garrison-Signature": f"t={ts},v1={sig}"})
print(urllib.request.urlopen(req).read())
```

Sign the bytes you send. Re-serializing the JSON on either side (reordering keys, changing whitespace) breaks the signature, which is why `--data-binary` matters in the curl example.

### Responses

| Status | When |
|---|---|
| 202 | Accepted: the fire record, with `runId` or `pipelineRunId` when the run started, or `outcome: Failed` and an error code when it could not |
| 200 | A repeated `X-Garrison-Delivery`: the earlier fire with `duplicate: true` |
| 400 `InvalidDeliveryId` | The delivery header is empty, longer than 128 characters, or not printable ASCII |
| 401 `InvalidSignature` | Anything that fails verification |
| 429 `RateLimited` | The source address sent more deliveries that failed verification than `Auth.RateLimitPerMinute` (default 60) in the current minute, counted across replicas; it is refused until the minute ends, even with a valid signature |
| 409 `TriggerInactive` | A correctly signed delivery to an inactive trigger |
| 413 `PayloadTooLarge` | The body is larger than `Triggers.WebhookMaxBodyBytes` (default 256 KiB); checked before the signature |

The 401 is deliberately uniform. An unknown tenant, an unknown trigger, a cron trigger, a missing header, a malformed header, a stale timestamp, and a wrong signature all get the same status, code, and message, and the server computes an HMAC against a throwaway key when there is no secret so that the response time does not give the difference away either. Only a sender who can sign correctly learns anything more about the trigger. A failed fire (for example a run-as principal that lost its permission) is still a 202: the delivery was received and recorded, and the fire history says why nothing ran.

## Input templates

The run input is rendered from a prompt template, never from text built into the server. A trigger with no `inputTemplateId` uses a tenant `Task` template named `trigger-input` when one exists and is active, and `builtin/trigger-input` otherwise. To word things your own way, write a `Task` template and point `inputTemplateId` at it. [PROMPTS.md](PROMPTS.md#trigger-input) lists the variables; the useful ones are `trigger.scheduledUtc` for schedules and `webhook.body` and `webhook.json` for webhooks:

```
Review pull request #{{webhook.json.number}} ({{webhook.json.action}}) and post a summary.
```

An input that renders to nothing is not sent: the fire fails with `InputRequired`. A template that fails to render fails the fire with `TemplateRenderFailed`, and a template that was deleted fails it with `InputTemplateNotFound`.

## Manual fire

`POST .../triggers/{id}/fire` fires a trigger now, regardless of its type or schedule, and answers 201 with the fire. An optional body `{"body": "...", "contentType": "application/json"}` is passed to the template as `webhook.body` (and `webhook.json` when it parses as JSON), which is the easiest way to try a webhook trigger's template without signing anything. A manual fire needs `Trigger.Execute`, still runs as the trigger's run-as principal, and does not move the cron schedule.

## Fire history

Every fire is recorded (`tfr_` identifiers) and listed newest first by `GET .../triggers/{id}/fires`, filterable with `outcome`. A fire has its `source` (`Cron`, `Webhook`, or `Manual`), `scheduledUtc` (the cron occurrence, or the arrival time), `firedUtc`, `deliveryId`, `outcome` (`Started`, `Failed`, or `Skipped`), the `runId` or `pipelineRunId` it started, and `errorCode` and `errorMessage` when it did not. Webhook bodies are not stored in the history; the rendered input is the run's input. Runs a trigger started can also be listed with `GET .../runs?triggerId=trg_...`.

The leader prunes fires older than `Triggers.FireRetentionDays` (default 30) once an hour. Deleting a trigger deletes its fire history and keeps the runs it started.

## Manifests

```yaml
apiVersion: garrison/v1
kind: Trigger
metadata:
  name: nightly-report
spec:
  description: Summarize yesterday's failed runs.
  type: Cron
  agent: reporter
  cron: "0 6 * * *"
  timeZone: Europe/Berlin
---
apiVersion: garrison/v1
kind: Trigger
metadata:
  name: pr-review
spec:
  type: Webhook
  pipeline: review-pipeline
  inputTemplate: pr-review-input
```

References are by name and may point at resources defined earlier in the same manifest. Applied triggers run as the principal that applied the manifest. A new webhook trigger gets a generated secret that the apply result does not show; rotate it to read it, or set `spec.signingSecret` in an apply that allows secret values. Export never includes the secret. See [MANIFESTS.md](MANIFESTS.md#trigger).

## Deleting things a trigger uses

Deleting an agent, a deployment, or a pipeline that a trigger points at answers 409 `ReferencedByTrigger` with the trigger names. Change or delete those triggers first.
