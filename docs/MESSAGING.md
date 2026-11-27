# Messaging

A message is a note from one agent to another, or from a person to an agent. Delegation is a phone call: the caller waits for the answer. A message is mail: it lands in the recipient's inbox, the sender carries on, and the recipient reads it on its next run, or at once when the sender marks it urgent.

A message has:

| Field | Meaning |
|---|---|
| `recipientAgentId` | The agent it is for |
| `subject` | 1 to 256 characters |
| `body` | Plain text or Markdown, at most `Messaging.MaxBodyBytes` UTF-8 bytes (16384 by default) |
| `urgency` | `Normal` (the default) or `Urgent`. See [Delivery](#delivery) |
| `artifacts` | Up to 20 run artifacts attached by reference, with their name, media type, and size when sent |
| `threadId`, `parentMessageId` | The thread it belongs to (the identifier of its first message) and the message it replies to |
| `hopCount` | How many agent-to-agent hops led to it. See [Loop guards](#loop-guards) |
| `expiresUtc` | Optional. An undelivered message past this time expires |
| `status` | `Queued`, `Delivered`, `Acknowledged`, `Expired`, or `Rejected`. Messages delivered to a keeper tick whose run fails before it reports go back to `Queued` for the next tick |

Garrison adds the sender (agent, run, or person), the run it was delivered to, and when it was sent, delivered, and acknowledged. A message whose `status` is `Rejected` carries `rejectionReason` and `rejectionDetail`.

## Lines

An agent may write to another only along an allowed line:

- an app edge between the two agents, in either direction (the entry agent and the member it calls may write to each other);
- a reporting line in a live [organization](ORGANIZATIONS.md): the recipient is the sender's manager, or reports directly to it;
- a peer line in a live organization: the two agents sit in units joined by a peer line, as leads or members;
- a reply to the agent that wrote to it, within the same thread.

Two members of the same unit have no line between them unless they share an app edge; they reach each other through their manager. An agent may not write to itself. A message without a line is refused with `NoLine` and stored, so you can see who tried to reach whom.

People and API credentials with Create on AgentMessage may write to any agent. The line policy does not apply to them; the other guards do.

## Sending and reading

A run uses four MCP tools:

| Tool | What it does |
|---|---|
| `garrison_send_message` | Writes to `recipient` (an agent identifier or name) with a `subject`, and optionally a `body`, `urgency`, `artifactIds`, and `ttlSeconds` |
| `garrison_reply_message` | Replies to a message its agent received (`messageId`, `body`). The reply goes to the original sender, in the same thread, with the subject `Re:` and the original's unless you give one |
| `garrison_read_inbox` | Receives the agent's queued messages, oldest first, at most `Messaging.MaxMessagesPerDelivery`, marks them delivered to this run, and says how many still wait |
| `garrison_ack_message` | Marks a delivered message handled. Acknowledging again changes nothing |

```json
{
  "name": "garrison_send_message",
  "arguments": {
    "recipient": "inventory",
    "subject": "Stock for SKU 42",
    "body": "Pricing wants to run a promotion on SKU 42 tomorrow. How many units can we sell?",
    "urgency": "Normal"
  }
}
```

Send, reply, read, and acknowledge all go through the run's effect journal, so a run that lost its lease cannot send. If the same run sends the same message again, for example after a retry, Garrison returns the first message instead of sending a second one. A run reads only its own agent's inbox: replying to or acknowledging another agent's message answers `NotFound`.

People send with `POST /messages` or `garrison_send_message`. An `idempotencyKey` makes a retried send return the first message, and `parentMessageId` puts the message in an existing thread. People list an agent's messages with `GET /messages` or with `garrison_read_inbox` and `agent`, which does not deliver anything.

## Delivery

Normal mail waits in the inbox. When the recipient's keeper next ticks, the tick's input carries the queued messages, oldest first, up to `Messaging.MaxMessagesPerDelivery` (50 by default), and they are marked delivered to that tick's run. The rest stay queued for the next run, and the input says more are waiting so the keeper can call `garrison_read_inbox`. An agent without a keeper sees normal mail when one of its runs calls `garrison_read_inbox`.

Urgent mail wakes the recipient now:

- If the agent has an active keeper, Garrison brings that keeper's next wake forward to now with wake source `Message`. A keeper that is paused, frozen, or over its daily budget is not woken; its mail waits.
- If the agent has no keeper, Garrison starts a run of kind `Message` on its default active deployment. The run's input is `builtin/message-wake` followed by the whole inbox, and every message it carries is marked delivered to it. The run executes as the person behind the sender: the one who started the sending run, or the person who sent the message.

Urgent wakes are limited to `Messaging.UrgentWakesPerHour` per recipient (12 by default). Above the limit, and while the [autonomy kill switch](BRAKES.md) is on, an urgent message waits like a normal one.

### Coalescing

Mail never starts more runs than it has to. A keeper runs one tick at a time: an urgent message that arrives during a tick waits for it to finish, and the next tick carries every message that arrived meanwhile. Ten messages that arrive while a keeper is busy, one of them urgent, are handled by one following tick. A `Message` run likewise carries everything queued when it starts.

Delivery claims messages with a compare-and-set before the run starts, so two replicas, or a tick and a `Message` run, never deliver the same message twice. If a replica stops while holding a claim, the leader releases the claim after 10 minutes and the messages wait for the next delivery.

## Loop guards

Agents that wake each other can page each other forever. Every message passes these checks before it is stored, in this order:

| Guard | Refused with | Rule |
|---|---|---|
| Recipient frozen | `Frozen` | The recipient agent is under a freeze ([BRAKES.md](BRAKES.md)) |
| Line | `NoLine` | No allowed line connects a sending agent to the recipient |
| Hop limit | `HopLimit` | The message would be hop `Messaging.MaxHops` + 1 or more (8 by default) |
| Thread budget | `ThreadBudget` | A reply would join a thread that already holds `Messaging.ThreadBudget` messages (200 by default) |
| Line rate | `LineRate` | The sender already sent `Messaging.LineRatePerMinute` messages to this recipient in the last 60 seconds (30 by default) |

A refused message is stored with status `Rejected`, its reason, and a sentence explaining it, and is never delivered. The tool answers an error whose code is the reason; `POST /messages` answers 409 with the same code. `garrison.message.loop.guard` counts refusals by reason, and the dashboard's Home page shows how many messages the guards refused in the last day.

The hop count follows cause, not threads. A message's hop is one more than the largest hop among the message it replies to and every message already delivered to the sending run. A person's message is hop 0. An agent that answers by starting a new thread instead of replying carries the hop count with it, so it cannot reset the guard.

The line rate is counted in the database, so it holds when the sender's messages go through different control-plane replicas.

### A worked ping-pong

`pricing` and `inventory` are keepers in the same app, joined by an edge, and both are told to answer every message they get. With the defaults:

| Step | Who | What happens | Hop |
|---|---|---|---|
| 1 | pricing | Sends "Stock for SKU 42?" to inventory | 1 |
| 2 | inventory | Its next tick carries the message; it replies | 2 |
| 3 | pricing | Its tick carries the reply; it replies | 3 |
| ... | | The two keep replying, each in its own next tick | ... |
| 8 | inventory | Replies | 8 |
| 9 | pricing | Replies again; Garrison refuses it with `HopLimit` | 9 |

The ninth message is stored as `Rejected` with the detail "The message would be hop 9; Messaging.MaxHops allows 8." Nothing is delivered to inventory, so the loop ends. If pricing instead starts a new thread, the new message is still hop 9, because the hop comes from the reply delivered to its run, and it is refused the same way.

If the two agents replied with urgent mail inside a single tick each, the line rate would stop them sooner: the 31st message from pricing to inventory within a minute is refused with `LineRate`. With `Messaging.MaxHops` raised to 64, the thread budget ends the exchange at 200 messages.

## Escalations to agents

An escalation addressed to an agent ([ESCALATIONS.md](ESCALATIONS.md)) arrives as an urgent message from the raising agent, linked by `escalationId`. The escalation stays the source of truth: the recipient reads the options with `garrison_get_escalation` and answers with `garrison_answer_escalation`, and the escalation records the run the message woke as `routedRunId`. The line policy does not apply, because the raiser chose the target; a frozen target refuses it.

## Expiry

A message sent with `ttlSeconds` (1 to 31536000) expires if it is still queued when that time passes. The leader's sweep marks it `Expired` and it is never delivered. Messages without an expiry wait until they are delivered.

## REST and live updates

| Route | What it does |
|---|---|
| `GET /v1.0/api/tenants/{tenantId}/messages` | Messages, newest first. Filters: `sender`, `recipient`, `agent` (to or from), `status`, `urgency`, `reason`, `thread`, `deliveredRunId`, `from`, `to`, `search` |
| `POST /v1.0/api/tenants/{tenantId}/messages` | Write to an agent as a person |
| `GET /v1.0/api/tenants/{tenantId}/messages/{id}` | One message |
| `GET /v1.0/api/tenants/{tenantId}/message-threads/{threadId}` | A thread, oldest first, rejected messages included |

See [REST_API.md](../REST_API.md#messages) for the models. The `agent-inbox:{agentId}` WebSocket channel sends `message.queued`, `message.delivered`, `message.acknowledged`, `message.expired`, and `message.rejected` as each message to that agent changes. See [WEBSOCKETS_API.md](../WEBSOCKETS_API.md). The dashboard shows messages under Autonomy > Messages and on each agent's Inbox tab.

## Settings

| Setting | Default | Range | Meaning |
|---|---|---|---|
| `Messaging.MaxHops` (cluster) | `8` | 1 to 64 | Most agent-to-agent hops a message may travel |
| `Messaging.LineRatePerMinute` (cluster) | `30` | 1 to 6000 | Most messages one sender may send one recipient in any 60 seconds |
| `Messaging.ThreadBudget` (cluster) | `200` | 2 to 100000 | Most messages one thread may hold |
| `Messaging.UrgentWakesPerHour` (cluster) | `12` | 0 to 3600 | Most urgent wakes per recipient in any hour; 0 makes all mail wait |
| `Messaging.MaxMessagesPerDelivery` (cluster) | `50` | 1 to 500 | Most messages one run receives at once |
| `Messaging.MaxBodyBytes` (cluster) | `16384` | 256 to 262144 | Most UTF-8 bytes in a message body |

## Permissions

| Action | Permission | Built-in roles |
|---|---|---|
| List and read messages and threads | Read on AgentMessage | Viewer, Auditor, AgentOperator, AgentDeveloper, Editor, TenantAdmin |
| Write to an agent as a person | Create on AgentMessage | AgentOperator, AgentDeveloper, Editor, TenantAdmin |

Runs never use these permissions; they follow the [lines](#lines).

## Treat message text as untrusted

Subjects and bodies are written by agents and people, and an agent may have copied something hostile into a message. Garrison puts message text into a prompt only through `builtin/inbox-delivery`, which frames each message as data between begin and end lines that carry a marker chosen at random for every render, so text inside a message cannot end its block early or pass as instructions. The template also tells the recipient that it cannot see the sender's workspace or files, and that when a message mentions a file whose contents are not in it, it should reply and ask for them instead of looking on disk. In the AA12.7 team trial a tester wrote "see the attached test file", attached nothing, and the reviewer spent its whole run searching the disk for it. `garrison_send_message` and `garrison_reply_message` say the same to the sender: put everything the recipient needs in the body. The tools return messages as data. Audit records and server logs name the message, its parties, and its urgency, never its subject or body. Never put credentials in a message.

## Telemetry

`garrison.messages` counts messages by urgency and outcome (`queued`, `rejected`, `delivered`, `acknowledged`, `expired`, `woke`), `garrison.message.delivery.lag.duration` measures the time from send to delivery, and `garrison.message.loop.guard` counts refusals by reason. Each delivery is a `message deliver` span. The Autonomy dashboard has a Messaging row. See [TELEMETRY.md](TELEMETRY.md).

## Retention

Messages are kept with their tenant; deleting a tenant deletes its messages. Deleting an agent keeps the messages it sent and received, with the names the agents had at the time.
