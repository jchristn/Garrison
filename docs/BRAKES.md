# Brakes

Keepers act on their own, so Garrison needs ways to stop them that do not depend on the agent cooperating. There are four:

- A **freeze** stops one agent, deployment, keeper, app, organization unit, or organization until someone lifts it.
- A **spend cap** stops a keeper that has spent its budget for the tick or the day.
- A **unit budget** stops every agent in an organization unit's subtree once the subtree has spent its budget for the day or month.
- The **kill switch** stops every keeper in the tenant at once.

All four take effect in the control plane: a refused run is never created and a skipped wake never starts a tick, so the agent has nothing to argue with. Run tokens never hold the Freeze permissions, so an agent cannot lift a freeze on itself or turn the kill switch off.

## Freezes

A freeze names a target:

| `targetKind` | What stops |
|---|---|
| `Agent` | Every new run of the agent, on any deployment, and every keeper bound to it |
| `Deployment` | Every new run on the deployment and every keeper bound to it |
| `Mandate` | The keeper's ticks. The mandate shows status `Frozen` until the freeze is lifted |
| `App` | Every run that users of the agentic app start through the app gateway |
| `TenantAutonomy` | Every keeper in the tenant. This is the kill switch; see [below](#the-kill-switch) |
| `OrgUnit` | Every lead and member of the unit's subtree in the organization's live revision, as if each agent were frozen |
| `Organization` | Every agent in the organization's live revision. The organization shows status `Frozen` until the freeze is lifted |

`targetId` takes an identifier or a name. Garrison stores the identifier and keeps the name as `targetName`, so the freeze still reads well after a rename. Each target has at most one active freeze; a second one is refused with 409 `AlreadyFrozen`, which names the freeze already in place.

While a freeze is active:

- A new run in scope is refused with 409 `Frozen` when it is created. The message names the freeze and its reason. Every way of starting a run goes through this check: invocations, conversation turns, app chats, pipeline stages, triggers, delegated runs, and keeper ticks. A run that was already queued before the freeze is not stopped by it; use `cancelActiveRuns` for those.
- A keeper in scope skips its wakes. Each skipped wake is recorded as a `Skipped` tick with error code `Frozen`, and the schedule moves on by one interval, so lifting the freeze later does not release a burst of overdue ticks.
- Runs that were already running keep going, unless the freeze was applied with `cancelActiveRuns: true`. Then Garrison cancels them through the normal cancellation path and records how many it cancelled in `cancelledRunCount` (at most 10000 per freeze).

A freeze on an agent or a deployment does not change a keeper's status; only a `Mandate` freeze shows `Frozen` on the keeper. The keeper's ticks still show the freeze as their skip reason.

An `OrgUnit` or `Organization` freeze covers the agents that hold positions in the live revision when the freeze cache loads. Publishing a revision, rolling back, or deleting the organization drops the cache, so an agent moved into a frozen unit stops and one moved out starts again. See [ORGANIZATIONS.md](ORGANIZATIONS.md#freezes).

Lifting a freeze is the only way to undo it. Lifted freezes stay in the list with who lifted them, when, and why. A lifted `Mandate` freeze returns the keeper to `Active` with its next wake spread over up to 60 seconds (never more than its current interval), so lifting many freezes together does not start every tick at once. Lifting a freeze that is already lifted answers 409 `FreezeLifted`.

Reasons, for a freeze and for a lift, hold at most 2000 characters.

```bash
curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/freezes" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"targetKind": "Agent", "targetId": "billing-agent", "reason": "Refund loop on order 4411", "cancelActiveRuns": true}'

curl -s -X POST "http://127.0.0.1:8700/v1.0/api/tenants/default/freezes/mfz_mx2c9h4k_Lw8RtQ3pZk7NvBd2Hs/lift" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"reason": "Prompt fixed in revision 7"}'
```

## Spend caps

A keeper revision can carry two budgets in US dollars:

| Field | What it limits |
|---|---|
| `budgetPerTickUsd` | What one tick may cost |
| `budgetPerDayUsd` | What all of the keeper's ticks may cost in one UTC day |

Garrison enforces them where it knows the cost. When it compiles a tick, it lowers the harness's own budget to whatever the tick and the day have left, and a tick with nothing left is refused with `MandateBudgetExceeded`. Harnesses report cost when an execution ends, and when a tick run suspends (for example to wait for an approval) Garrison checks what it has spent so far and cancels it if it has reached its tick budget. Within one uninterrupted execution, the harness's budget is the limit.

The daily budget is tracked through a usage quota scope, `Mandate`, over the keeper's tick runs. When a wake comes due and the day's spend has reached `budgetPerDayUsd`, the keeper:

1. moves to status `CapReached`, with its next wake set just after the next UTC midnight (spread over up to 5 minutes, so capped keepers do not all wake together);
2. records a `Skipped` tick with error code `CapReached` that says what it spent and when it resumes;
3. raises an `Urgent` escalation to its human default: the revision's escalation target when that is a user or a role, otherwise the user the keeper runs as. The escalation is already marked delivered, so its text never reaches the keeper itself. It times out with its default answer when the window resets.

The scheduler's sweep returns the keeper to `Active` once the window has reset. To let it continue sooner, publish a revision with a larger `budgetPerDayUsd` and resume it.

A usage quota with scope `Mandate` can also be created by hand for any keeper, with the same limits as other quotas. See [Usage quotas](../REST_API.md#usage-quotas).

## Unit budgets

An organization unit can carry a `Day` and a `Month` budget in US dollars. Each caps the known cost of every run by the agents in the unit's subtree, keepers or not. Once a subtree has spent its budget, a new run by any of those agents is refused with 409 `BudgetExhausted`, and a keeper among them records each due wake as a `Skipped` tick with error code `BudgetExhausted`. The unit's manager gets one `Urgent` escalation per window, and everything resumes when the UTC day or month turns over. A child unit's budget may not exceed its parent's.

Unit budgets are set on the organization and take effect when a revision is published; a usage quota with scope `OrgUnit` cannot be created by hand. A keeper inside a unit with money left still stops at its own `budgetPerDayUsd`. See [ORGANIZATIONS.md](ORGANIZATIONS.md#budgets).

## The kill switch

The kill switch is a tenant-wide freeze of autonomy. While it is on:

- no keeper wakes; each due wake is recorded as a `Skipped` tick with error code `KillSwitch`;
- a new keeper run is refused with 409 `Frozen`;
- ordinary invocations, conversations, pipelines, and triggers keep working.

Turning it on creates a `TenantAutonomy` freeze, which appears in the freeze list like any other. Turning it off lifts that freeze. Turning it on while it is already on changes nothing and returns the current state.

```bash
curl -s -X PUT "http://127.0.0.1:8700/v1.0/api/tenants/default/autonomy/kill-switch" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"enabled": true, "reason": "Incident 42: keepers paused while billing is investigated"}'
```

The response carries `enabled`, the `freezeId` that holds the switch on, the `reason`, `changedByName`, and `changedUtc`.

## Permissions

| Action | Permission | Built-in roles |
|---|---|---|
| List and read freezes, read the kill switch | Read on `Freeze` | TenantAdmin, Editor, Viewer, Auditor, AgentDeveloper, AgentOperator |
| Apply a freeze | Create on `Freeze` | TenantAdmin, Editor, AgentOperator |
| Lift a freeze, set the kill switch | Update on `Freeze` | TenantAdmin, Editor, AgentOperator |

AgentOperator gets these through its own permission, `AgentOperator.Brakes`, so the people who watch keepers can stop them without being able to change them. A custom role that should not stop anything can copy AgentOperator without it. Run tokens never hold any Freeze permission.

Every freeze, lift, and kill switch change is written to the audit log as `FreezeApplied`, `FreezeLifted`, or `KillSwitchChanged`.

## Where it shows up

| Surface | What you get |
|---|---|
| REST | `/v1.0/api/tenants/{tenantId}/freezes` and `/autonomy/kill-switch`. See [REST_API.md](../REST_API.md#freezes-and-the-kill-switch) |
| MCP | `garrison_list_freezes`, `garrison_freeze`, and `garrison_lift_freeze` for people and API credentials. See [MCP_API.md](../MCP_API.md) |
| WebSocket | The `freezes` channel: `freezes.active` on subscribe, then `freeze.applied`, `freeze.lifted`, and `killswitch.changed`. See [WEBSOCKETS_API.md](../WEBSOCKETS_API.md) |
| Notifications | `FreezeApplied` (including the kill switch turning on) and `MandateCapReached`. See [NOTIFICATIONS.md](NOTIFICATIONS.md) |
| Metrics | `garrison.freezes` by target kind and action (`applied`, `lifted`, `refused`, `skipped`, `cancelled`), `garrison.spend.cap.hits` by scope (`mandate_tick`, `mandate_day`, `org_unit_day`, `org_unit_month`), and the `garrison.org.budgets.exhausted` gauge by period. See [TELEMETRY.md](TELEMETRY.md) |
| SDKs | A Freezes client in C#, Python, JavaScript/TypeScript, and Go |

## How it works across replicas

Each replica keeps a tenant's active freezes in a short cache, so the admission check does not read the database for every run. Applying or lifting a freeze drops the tenant's cache on the replica that made the change and, through the backplane, on every other replica. The cache also expires after 30 seconds, so a lost backplane message delays a freeze by at most that long. Keeper wakes are checked against the same cache.
