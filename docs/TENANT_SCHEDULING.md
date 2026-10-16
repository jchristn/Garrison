# Tenant scheduling and queue bounds

Tenant `schedulingWeight` controls relative claim service, from 1 through 1000, default 1. Only a system administrator may change it through tenant create or update. Higher weights guide proportionally more claim service among eligible continuously backlogged tenants on each replica. Placement constraints, concurrency limits and the bounded candidate window can change observed ratios. This controls run-count service, not CPU time or duration, and does not reserve execution slots.

The database remains the source of truth. Candidate selection first balances its bounded window across tenants, retaining priority and age inside each tenant. The scheduler uses QoSKit weighted fair queues and carries successful service forward across claim windows, including single-slot claims. Delegated children retain their priority band ahead of new top-level work, and the child reserve retains its existing bounded admission policy. Pool dedication, required executors, label placement, deployment concurrency, and tenant isolation still apply.

Fairness state belongs to each control-plane replica. Multiple replicas therefore provide approximate aggregate fairness; a restart resets that replica's service history. At most 500 candidates are considered per query. More simultaneously backlogged tenants than a window can hold require additional windows; this is not a strict global latency guarantee.

Three cluster settings bound queued runs:

| Setting | Meaning |
| --- | --- |
| `Runs.QueueDepthCluster` | Most queued runs across the cluster |
| `Runs.QueueDepthTenant` | Most queued runs in one tenant |
| `Runs.QueueDepthAgent` | Most queued runs for one agent in its tenant |

All default to zero, which disables that limit. Positive limits are enforced in the same database transaction that creates the run, with a shared admission lock on PostgreSQL and serialized writers on SQLite. Concurrent callers on different replicas cannot overshoot the configured bound. Once a queued run is claimed or leaves the queue, that capacity is available. Existing queued runs remain when a limit is lowered. Idempotent retries return their existing run even if the queue is full.

A refusal returns `QueueFull`: REST answers HTTP 429 and `Retry-After: 5`; MCP and A2A retain the same stable code. A tenant-scoped `QueueFull` audit event records the refusal without creating a run. Daily quota enforcement is independent: a queue-depth limit controls outstanding waiting work, while a usage quota controls admitted runs, tokens, cost, or concurrent execution.

The regression suite keeps a noisy tenant backlogged at 100 times the quiet tenant's candidate count. With weights 4:1 and repeated single-slot claims, it checks the quiet tenant receives approximately 20 percent of service and waits no more than six competing claims. Provider regressions also check candidate visibility behind an older high-priority backlog and concurrent admission against cluster, tenant, and agent limits. Wall-clock p95 queue targets require a separate deployment load test because run duration, capacity, and database load determine elapsed wait.


`GET /v1.0/api/tenants/{tenantId}/runs/{id}/placement` explains current eligibility, including admission, placement and execution quota reasons, without claiming or reserving capacity. It is an advisory multi-read snapshot, not a queue-position or latency promise. See [placement diagnostics](SCALING.md#explain-a-runs-placement).

`Scheduling.MaxSynchronousWaiters` is a separate per-replica transport budget (default 256), shared by run and pipeline waits. A full pool returns accepted external work for polling rather than rejecting run admission; resident synchronous delegation reserves a slot before creating any child and fails fast if unavailable. This bounds held HTTP requests, not queued runs or tenant execution slots. The D062 three-replica 100x-noisy experiment completed 3,060 submissions with 30 observations per quiet tenant; its synchronous variant followed accepted 202 fallbacks and is not an all-requests-held result. See [bounded waits and measured scope](SCALING.md#bounded-synchronous-waits).
