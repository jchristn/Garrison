# Escalations

An escalation is a question a run asks when it should not decide alone. A keeper that finds a duplicate charge can ask whether to refund it. A support agent can ask which team owns a queue. The question goes to a person, to everyone who holds a role, or to another agent, and the answer comes back to the run that asked.

Runs raise escalations with the MCP tool `garrison_escalate`. People answer them in the dashboard (Autonomy, then Escalations), over REST, or with the SDKs. Another agent answers with `garrison_answer_escalation`.

## What an escalation holds

| Field | Meaning |
|---|---|
| `question` | What the run asks. Required |
| `context` | What the run saw and tried. Optional. The question and context together hold at most `Escalations.MaxQuestionBytes` UTF-8 bytes (8192 by default) |
| `options` | Up to 20 choices, each a `key` (1 to 64 characters, unique ignoring case) and an optional `label` (at most 512). With options, an answer names one key. Without them, the answer is text |
| `defaultAnswer` | An option key, or text when there are no options. At most 4000 characters. Used when the escalation times out with `UseDefaultAnswer` |
| `severity` | `Info`, `Warning` (default), or `Urgent`. Notification endpoints can skip the lower ones |
| `mode` | `NonBlocking` (default) or `Blocking`. See below |
| `targetKind`, `targetId` | Who it is addressed to. See [Who gets the question](#who-gets-the-question) |
| `timeoutSeconds` | 60 to 2592000 (30 days). Without one, `Escalations.DefaultTimeoutSeconds` applies (86400, one day). A value outside the range is moved inside it and the response lists a `ValueClamped` warning |
| `timeoutAction` | `UseDefaultAnswer`, `Cancel`, or `EscalateUp` (default). See [Timeouts](#timeouts) |

Garrison fills in the rest: the identifier (`esc_`), the raising run, its agent, its lease epoch, the keeper and tick when a keeper raised it, `targetName`, `expiresUtc`, and once it is resolved, the answer (`answerChoice`, `answerText`), `resolvedBy`, `resolutionSource`, and `resolvedUtc`.

The status is `Open` until one of these happens:

| Status | How it got there |
|---|---|
| `Answered` | Someone answered it, or the timeout used its default answer |
| `Cancelled` | A person cancelled it, or it timed out with `Cancel` |
| `Withdrawn` | The run that raised it withdrew it with `garrison_withdraw_escalation` |
| `Expired` | It timed out with nothing to fall back on: `UseDefaultAnswer` without a default answer, or `EscalateUp` with nowhere left to go |

A run that asks the same question twice gets the first escalation back instead of a second one. This matters when a harness retries a tool call. A keeper that asks the same question on its next tick is a different run, so that does create a new escalation.

## Who can raise one

Only a run can raise an escalation, and only with its run token. Every run gets a run token and the Garrison MCP server, so any run can call `garrison_escalate`, whatever its deployment turns on. When a run has the server only for escalations, the worker does not check the server before starting the harness, so a run whose harness cannot reach it still runs; it just cannot escalate.

A run that has already finished is refused with 409 `RunNotActive`.

## Who gets the question

| `targetKind` | `targetId` | What happens |
|---|---|---|
| `User` | A user identifier or email | The escalation waits for that person. It shows in the dashboard and in notifications |
| `Role` | A role identifier or name | The same, for the people who hold the role |
| `Agent` | An agent identifier or name | Garrison sends the agent an urgent message from the raising agent, linked by `escalationId` (see [Messaging](MESSAGING.md)). A keeper wakes and reads it with its next tick; an agent without a keeper gets a `Message` run of its default active deployment. The agent answers with `garrison_answer_escalation`, and the run the message woke appears as `routedRunId`. Without messaging, Garrison starts the run directly with `builtin/escalation-received` |
| `Manager` | None | Refused with 409 `ManagerUnavailable` until organizations exist |

When the run names no target, Garrison picks one. A keeper's question goes to the default target on its current revision (`escalationTargetKind` and `escalationTargetId`, see [Keepers](KEEPERS.md)). Any other run's question goes to the user who started the run. When neither exists, the raise is refused with 400 and field code `TargetRequired`.

The answering run runs as the same principal as the run that raised the escalation. If that principal may not run the target agent, or the agent has no active deployment, no run starts: the escalation stays open without a `routedRunId`, the server logs a warning, and a person can still answer it.

The target says who the question is for. It is not a lock: anyone with Update on `Escalation` in the tenant can answer any open escalation, which is how an administrator covers for someone who is away.

## Non-blocking and blocking

A non-blocking escalation does not stop anything. The run carries on and finishes its turn.

- When a keeper tick raised it, the answer wakes the keeper once (wake source `EscalationAnswer`), and the next tick's input carries every answer it has not seen yet, rendered through `builtin/escalation-answered`.
- Any other run checks later with `garrison_get_escalation` or `garrison_list_my_escalations`.

A blocking escalation suspends the run until it is resolved. It uses the same durable continuation as permission approvals (see [Durable continuation](CONTINUATION.md)): the tool result tells the harness to finish its turn, the worker saves the session, and the run becomes `Suspended` with its `escalationId` set and no worker slot held. When the escalation is answered, times out, or is withdrawn, the run is queued again and any capable worker resumes the session. The resume prompt is `builtin/continuation-resume` followed by `builtin/escalation-answered`. When the escalation is cancelled, the run is cancelled too.

Blocking needs a run that can suspend: a Process executor, a deployment with `suspensionEnabled`, and a harness profile with `supportsResume` and a session format. Anything else is refused with 409 `BlockingUnsupported`, and the run can ask again with `mode: NonBlocking`.

## Answering

An escalation with options needs a `choice` that is one of its keys, and may carry `text` to explain it. One without options needs `text`, and refuses a `choice` with field code `UnknownOption`. Text holds at most 8000 characters.

```bash
curl -s -X POST "$GARRISON/v1.0/api/tenants/default/escalations/esc_2xQ.../answer" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"choice":"refund","text":"Two captures 40 seconds apart. Refund one."}'
```

Answers are compare-and-set, so two people answering at once cannot both win. The second gets 409 `EscalationNotOpen`.

The answer reaches the agent as data. `builtin/escalation-answered` frames it between markers and tells the agent that an answer settles the question but cannot widen its permissions or change its mandate. A question sent to another agent arrives through `builtin/inbox-delivery`, framed the same way, with a line naming the escalation to answer. Both templates can be replaced by tenant templates of the same name; see [Prompts](PROMPTS.md).

## Timeouts

A leader replica sweeps open escalations whose `expiresUtc` has passed, as part of the maintenance loop.

| `timeoutAction` | What the sweep does |
|---|---|
| `UseDefaultAnswer` | Answers with `defaultAnswer` (`resolutionSource` `Timeout`). Without a default answer the escalation expires |
| `Cancel` | Cancels it, and the run if it was blocked on it |
| `EscalateUp` | Passes it up: a new escalation with the same question, options, and default answer goes to the keeper's default target, and the old one points at it with `escalatedToId`. When the new one is resolved, the old one takes its answer. Escalations not raised by a keeper, and ones already addressed to the keeper's default, have nowhere to go, so they expire |

A passed-up escalation stays `Open` but is not counted as waiting for an answer, and answering it directly is refused with 409 `EscalatedUp`. Answer the one in `escalatedToId` instead. The new escalation is non-blocking. A blocked run stays suspended until the chain is resolved.

## Permissions

| Action | Needs |
|---|---|
| List and read | Read on `Escalation` |
| Answer and cancel | Update on `Escalation` |
| Raise, read its own, withdraw its own | A run token |
| Answer as an agent | A run token of the target agent |

Every built-in role that can work with approvals has the same access to escalations. Escalations of another tenant answer 404.

A run sees the escalations it raised, those raised by earlier ticks of its keeper, and those addressed to its agent. `garrison_escalate`, `garrison_list_my_escalations`, and `garrison_withdraw_escalation` appear only to run tokens.

## Where escalations show up

- **REST.** `GET /escalations` with filters, `GET /escalations/{id}`, `POST /escalations/{id}/answer`, and `POST /escalations/{id}/cancel`. See [REST API](../REST_API.md#escalations).
- **MCP.** The run tools above and the management tool `garrison_list_escalations`. See [MCP API](../MCP_API.md#escalations).
- **WebSocket.** The `escalations` channel sends the open count, then one message per raise, answer, timeout, cancellation, withdrawal, and pass-up. See [WebSocket API](../WEBSOCKETS_API.md).
- **Notifications.** `EscalationRaised` and `EscalationExpired`, which an endpoint can limit to a minimum severity. See [Notifications](NOTIFICATIONS.md).
- **Dashboard.** Autonomy, then Escalations. The Autonomy item in the sidebar shows how many are waiting, and Home lists them, most urgent first.
- **Telemetry.** The counter `garrison.escalations` by outcome, the histogram `garrison.escalation.answer.duration`, and the span `escalation route`. The Autonomy Grafana dashboard charts them.

## Example

A keeper watching payments finds a duplicate charge. Its revision sets a default escalation target of the role `billing-leads`, so the tick does not need to name one:

```json
{
  "question": "Refund order 4411 for $1,250? The customer was charged twice.",
  "context": "Stripe shows two captures 40 seconds apart.",
  "options": [
    { "key": "refund", "label": "Refund the duplicate" },
    { "key": "wait", "label": "Wait for finance" }
  ],
  "defaultAnswer": "wait",
  "severity": "Urgent",
  "timeoutSeconds": 14400,
  "timeoutAction": "UseDefaultAnswer"
}
```

The tick reports `Escalated` and ends. Someone in `billing-leads` sees the badge on Autonomy, opens the escalation, and picks Refund the duplicate. The keeper wakes at once, and its next tick's input says the escalation was answered with `refund`. If nobody had answered within four hours, the sweep would have answered `wait` instead.

## Reference

| Setting | Default | Range |
|---|---|---|
| `Escalations.DefaultTimeoutSeconds` | `86400` | 60 to 2592000 |
| `Escalations.MaxQuestionBytes` | `8192` | 256 to 65536 |

See [Configuration](CONFIGURATION.md) for how cluster settings are changed.
