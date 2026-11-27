# The gerbil

One keeper with one standing job. `gerbil-keeper` watches a status page and a heartbeat file. It checks every 15 minutes and backs off to every 4 hours while everything stays healthy. It never restarts anything. When the page is down on two checks in a row, it asks the on-call role what to do. It keeps what it saw in agent memory, so each tick starts from what the last one found.

This is walkthrough 11.1 of `AUTONOMOUS_AGENTS_PLAN.md`, and the [keepers](../../../docs/KEEPERS.md) guide explains every field used here.

| File | What it holds |
|---|---|
| [gerbil.yaml](gerbil.yaml) | The system prompt `gerbil-system`, the agent `gerbil`, and the mandate `gerbil-keeper` |
| [fake-harness.yaml](fake-harness.yaml) | The `autonomy-script` harness profile: the fake harness, calling the Garrison tools listed in its deployment's `step1` to `step4` parameters |
| [scenarios/](scenarios) | The `gerbil` deployment on that profile, once per moment of the walkthrough: `healthy`, `down`, `still-down`, `answered` |
| [claude-code.yaml](claude-code.yaml) | The `gerbil` deployment on Claude Code, for a real run |

The mandate names its deployment, so `gerbil.yaml` is always applied together with one variant.

## The mandate

| Field | Value |
|---|---|
| Objective | Keep the status page healthy and the heartbeat file fresh, and tell a person when they are not |
| Healthy | The page answers 200 within 2 seconds, and the file changed in the last 10 minutes |
| Autonomy | Observe and report only |
| Escalation | To the on-call role (`Role` `AgentOperator`) when the page is down on two checks in a row |
| Schedule | `Backoff` from 900 seconds to 14400 seconds, factor 2 |
| Budgets | 0.25 US dollars a tick, 2 a day |

The keeper remembers three things, each tagged `recall` so it arrives with the next tick's input: `last-seen-healthy`, `consecutive-down`, and `on-call-instruction`.

## Run it on the fake harness

You need a running server and worker; the worker needs the fake harness (`garrison-fake-harness`), which the worker image has. Turn agent memory on in the server (`GARRISON_AGENT_MEMORY_ENABLE=true`, or `compose.agent-memory.yaml` in Docker Compose) so the memory steps work.

The script plays the whole walkthrough and checks every step:

```bash
GARRISON_PASSWORD=<your password> scripts/run-autonomy-example.sh
```

On Windows, `scripts\run-autonomy-example.bat -Password <your password>`. Both take the server URL, tenant, token or credentials, and the wait from flags or environment variables (`GARRISON_URL`, `GARRISON_TENANT`, `GARRISON_TOKEN`, `GARRISON_EMAIL`, `GARRISON_PASSWORD`, `GARRISON_WAIT`) and default to `http://127.0.0.1:8700`. `--cleanup` deletes the mandate at the end.

To do it by hand instead:

```bash
B=http://127.0.0.1:8700/v1.0/api/tenants/default
# Join the files with document separators and apply them as one manifest.
apply() { awk 'FNR == 1 && NR > 1 { print "---" } { print }' "$@" | curl -s -X POST "$B/manifests/apply" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/yaml" --data-binary @-; }

apply gerbil.yaml fake-harness.yaml scenarios/healthy.yaml
```

What happens, step by step:

1. **Healthy.** The mandate is new, so its first wake is due at once. The tick writes `last-seen-healthy` and `consecutive-down` to memory and completes `Quiet`. The interval goes from 900 to 1800 seconds. Left alone, it keeps doubling to 4 hours.
2. **Down.** Apply `scenarios/down.yaml` and wake the keeper (`POST $B/mandates/gerbil-keeper/wake`). The tick sees the 503, counts it in memory, and completes `Attention`. The interval snaps back to 900 seconds. Its input carried `last-seen-healthy` from the first tick: that is the memory of yesterday.
3. **Still down.** Apply `scenarios/still-down.yaml` and wake it again. Down twice in a row, so the tick calls `garrison_escalate`: "Status page down 15 minutes, last healthy 01:52. Restart, wait, or ignore?", with severity `Urgent`. It goes to the mandate's default target, the on-call role, and does not block. The tick completes `Escalated`.
4. **Answered.** Apply `scenarios/answered.yaml`, then answer from Autonomy > Escalations or over REST:

   ```bash
   curl -s -X POST "$B/escalations/<id>/answer" -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" -d '{"choice":"wait","text":"The provider is on it. Keep watching."}'
   ```

   The answer wakes the keeper with wake source `EscalationAnswer`. Its input carries the answer, framed as data. The tick writes `on-call-instruction` to memory and completes `Acted`.

Open Autonomy > Keepers and select `gerbil-keeper` to see the interval chart, the four ticks with their runs, and the revision. Autonomy > Memory shows the three entries and which tick wrote each one.

The fake keeper does not read the URL or the file. Each scenario file decides what its tick does, which is what makes the walkthrough repeatable in CI. The examples Touchstone suite (`examples-sqlite`, `examples-postgresql`, case `gerbil`) runs the same four ticks and checks the outcomes, intervals, memory, escalation, and answer.

## Run it on Claude Code

1. Edit the two signals in `gerbil.yaml`: put your status page URL in `status page` and the heartbeat file path in `heartbeat file`. The worker must be able to reach the URL and read the file.
2. Create a secret named `claude-credential` (kind `ClaudeCodeOAuthToken`, or change the kind in `claude-code.yaml` to `AnthropicApiKey`).
3. Apply `gerbil.yaml` with `claude-code.yaml`, or run `scripts/run-autonomy-example.sh --variant claude-code`, which applies them, waits for one tick, and reports how it ended.

The deployment allows only `curl`, `stat`, `date`, and the Garrison tools, so the keeper cannot restart anything even if an answer asks it to. The `gerbil-system` prompt tells it how to check, which memory keys to keep, and when to escalate. The budgets stop it at 2 US dollars a day.

## Make it your own

- Point the signals at your own page and file, and change `healthyDefinition` to match.
- Change who gets the question with `escalationTargetKind` and `escalationTargetId`: a `User`, a `Role`, or an `Agent`.
- Publishing a changed mandate (apply the edited `gerbil.yaml`) writes a new revision and wakes the keeper at once with its interval reset.
