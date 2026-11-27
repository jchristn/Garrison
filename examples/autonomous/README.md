# Autonomy examples

Two examples of agents with standing jobs. Both run on the scripted fake harness with no model and no credentials, and both have a Claude Code variant for a real run.

| Example | What it shows |
|---|---|
| [gerbil](gerbil/README.md) | One keeper watching a status page and a heartbeat file: backoff, memory between ticks, and an escalation the on-call person answers |
| [site-reliability-org](site-reliability-org/README.md) | An organization with a reliability lead (the CEO), uptime, latency, and dependency keepers, and a memory curator: peer-line messages, reports, a board brief, an escalation, budgets, change rules, and an approved eval set that gates the lead's hiring proposal |

`scripts/run-autonomy-example.sh` (and `.bat` on Windows) runs the gerbil end to end against a running server and worker and checks each step. The examples Touchstone suite (`examples-sqlite`, `examples-postgresql`) applies both examples and plays them on the fake harness.

The fake variants share one harness profile, `autonomy-script`: the fake harness, calling the Garrison MCP tools listed in a deployment's `step1` to `step4` parameters in order. That keeps every tick repeatable, at the cost of the keepers not really looking at anything. Swap in the Claude Code deployments to let them look.
