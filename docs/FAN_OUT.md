# Fan-out and gather

An orchestrator that delegates one child at a time spends most of its turn waiting. Fan-out lets it start several agents in one call, keep working or wait as it likes, and then gather what came back: every finished result, what is still pending, and what failed. A research app asks two researchers in parallel; a review app asks a security reviewer and a style reviewer at once and takes whichever answers first.

Members are ordinary delegated child runs. Everything that bounds a single delegation (the allow list, the depth limit, cycle checks, input schemas, worker capacity) applies to each member, so fan-out adds no new way around the delegation policy. The tools are for runs: a person starts a fan-out by talking to an agent that can delegate, not by calling the tool directly.

## The three tools

| Tool | What it does |
|---|---|
| `garrison_fan_out` | Starts up to `Delegation.MaxFanOutWidth` members (default 8) and returns the group with every member's run ID. It never waits |
| `garrison_gather` | Waits up to `waitSeconds` and returns the group as it stands: finished results, pending members, failures, usage, and a summary |
| `garrison_cancel_fan_out` | Ends the group and cancels its running members |

[MCP_API.md](../MCP_API.md#fan-out-and-gather) has the full argument lists.

`garrison_fan_out` checks every member before any of them starts. One member that does not exist, is off the allow list, would go too deep, would close a cycle, or has input its schema refuses, and the whole call is refused with that check's code and the member's index. Nothing half-starts. More members than the width limit is `FanOutTooWide`. Calling it again with the identical request from the same run returns the group it already started, which matters more than it sounds: harnesses retry tool calls, and a resumed session may not remember that it already fanned out.

## How a group ends

A group has a join policy, and it ends as soon as the policy is met or can no longer be met:

| Policy | Joined when |
|---|---|
| `All` (default) | Every member finished |
| `Any` | One member succeeded |
| `Quorum` | `quorum` members succeeded |

A group also ends `TimedOut` when its `timeoutSeconds` pass, `BudgetExceeded` when the members' recorded cost or tokens go over `maxCostUsd` or `maxTokens`, and `Cancelled` when someone calls `garrison_cancel_fan_out`, cancels it over REST, or when the parent run finishes or is cancelled. In every one of those cases the members still running are cancelled. When `Any` or `Quorum` is met early, the rest are cancelled too unless the call set `cancelRemaining: false`.

Groups are checked when a member finishes, when the parent gathers, and by the leader's maintenance sweep, so a group whose parent has gone quiet still times out on schedule.

## What gather returns

`garrison_gather` always returns what it has, whether or not the group ended. Each member carries its `status`, `outcome`, `resultText` (cut at `Delegation.GatherResultCharLimit`, default 16,000 characters, and marked `resultTruncated`), `structuredOutput` (a JSON value, not a string), `errorMessage`, and `filesWritten`. The group adds `pending` and `failed` as lists of member labels, `costUsd` and `tokens`, and a `summary` rendered by the `builtin/fan-out-gather-result` template, so the wording the model reads can be changed like any other prompt ([PROMPTS.md](PROMPTS.md)). Without an identifier, gather uses the run's latest group.

`filesWritten` lists paths in the conversation's file space. Members share the parent's space, so a researcher that writes `files/notes-a.md` hands that file to the orchestrator without any copying ([FILE_SPACES.md](FILE_SPACES.md)). Two members writing the same path do not silently overwrite each other: a write based on a version that has since changed is kept under a conflict name and raises a `FileConflict` warning ([FILE_SPACES.md](FILE_SPACES.md#conflicts)).

## Capacity and long waits

Every member is admitted through the same wait handshake as a waited delegation, so a fan-out that could never run fails at once with `DelegationCapacityExhausted` instead of deadlocking a worker. A parent that holds its slot while it waits takes one waiter place for the whole group, and each member counts toward `Runs.DelegationChildQueueDepth`.

When the parent's deployment has `suspensionEnabled`, gather on a running group returns at once with `continuationMarker` `GARRISON_CONTINUATION_WAIT`. The parent finishes its turn and gives its slot back, and Garrison resumes it when the group ends, with every member's result in view. That is how a worker with a single slot can still run a fan-out of three: the parent steps aside, the members run, and the parent comes back. [SCALING.md](SCALING.md) and [CONTINUATION.md](CONTINUATION.md) cover the capacity rules and what suspension needs.

## Watching groups

People follow groups through the run that started them. Run objects carry `fanOutGroupId`. Over REST, `GET .../runs/{id}/fan-out-groups` lists a run's groups, `GET .../fan-out-groups/{groupId}` reads one, and `POST .../fan-out-groups/{groupId}/cancel` ends it ([REST_API.md](../REST_API.md#fan-out-groups)). The WebSocket channel `fan-out:{groupId}` sends `fan-out.status` with the whole group each time its status, a member, or its usage changes ([WEBSOCKETS_API.md](../WEBSOCKETS_API.md)). In the dashboard, the Child runs tab of a run groups its children by fan-out group, with the join policy, member counts, budget use, and a cancel button.

## A worked example on the fake harness

[examples/fan-out.yaml](../examples/fan-out.yaml) needs no model and no credentials. Its orchestrator runs the fake harness with a profile that turns two deployment parameters into Garrison MCP calls: one `garrison_fan_out` with three members, then one `garrison_gather`.

```bash
API=http://127.0.0.1:8700/v1.0/api/tenants/default
curl -s -X POST "$API/manifests/apply" -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/yaml" --data-binary @examples/fan-out.yaml
RUN=$(curl -s -X POST "$API/agents/fan-orchestrator/invoke" -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"input":"Fan out","wait":true,"waitSeconds":120}' | jq -r .id)
curl -s "$API/runs/$RUN/fan-out-groups" -H "Authorization: Bearer $TOKEN" \
  | jq '.[0] | {status, joinPolicy, total, succeeded, members: [.members[] | {label, status}]}'
```

The group reports `Joined` under `All`, with three succeeded members labelled `source-a`, `source-b`, and `source-c`, and the orchestrator's answer ends with the gather summary. Applying the file a second time changes nothing.

For a fuller picture, the research overview app in [examples/agentic-apps](../examples/agentic-apps/README.md) fans out to two researchers, has a writer put a report in the file space, and converts it to PDF, all behind an app URL.

## Settings

| Setting | Default | Range | Meaning |
|---|---|---|---|
| `Delegation.MaxFanOutWidth` | 8 | 1 to 64 | Most members one call may start |
| `Delegation.GatherResultCharLimit` | 16000 | 256 to 1000000 | Longest result text gather returns per member |

Both are cluster settings and apply without a restart ([CONFIGURATION.md](CONFIGURATION.md#cluster-settings)).
