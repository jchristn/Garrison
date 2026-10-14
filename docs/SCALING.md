# Scaling

Garrison has two halves that scale independently. Control-plane replicas ("Command") serve the API and decide which run goes where. Worker replicas ("Post") run harnesses. The control plane never connects to a worker; workers pull work. So adding workers adds execution capacity without any control-plane change, and adding control-plane replicas adds API capacity without any worker change.

This page explains what limits each half, how the pieces coordinate, and what to watch out for. `docs/KUBERNETES.md` has the commands.

## Workers

A worker runs up to `MaxConcurrentRuns` harnesses at once (4 by default). Total capacity is the sum over workers, and in practice it is bounded by memory: a Claude Code or Codex process with Node.js typically wants a few hundred megabytes, plus whatever the agent builds or runs in its workspace. Size the worker pod's memory for `MaxConcurrentRuns` simultaneous harnesses, and lower the concurrency rather than overcommitting.

To scale out, add replicas. A new worker registers under its pod name, reports the harnesses it found and its labels, and starts long-polling for work within seconds. To scale in, remove replicas: a worker that receives SIGTERM stops leasing, finishes its running harnesses for up to `DrainTimeoutSeconds` (900), reports, and exits. Kubernetes' `terminationGracePeriodSeconds` must be at least as long; both are 900 in the shipped manifests.

Use node pools and labels to separate kinds of work: a pool of Claude Code workers with API keys, a pool of Mux workers next to a GPU model server, a pool dedicated to one tenant. Each Helm `workerPools` entry is its own StatefulSet. Deployments pick workers with `nodePoolId` and `nodeSelector`, and the scheduler only leases a run to a worker that reports the run's harness type as available.

### Concurrency limits

| Limit | Where |
|---|---|
| Runs per worker | `MaxConcurrentRuns` in the worker settings |
| Runs per deployment | `maxConcurrentRuns` on the deployment (0 means unlimited) |
| Work per lease call | Up to 64 runs per lease request, bounded by the worker's free slots |

The per-deployment limit is exact, however many replicas and workers claim at once. Claims for a deployment that has a limit are serialized in the database (a transaction-scoped PostgreSQL advisory lock; Sqlite has a single writer anyway), and the claiming `UPDATE` itself counts the deployment's `Leased`, `Running`, and `Cancelling` runs. A claim that would exceed the limit changes nothing and the run stays queued.

Node pools dedicated to tenants are enforced at claim time: a worker in a pool that lists tenants only receives those tenants' runs, and a run pinned to a pool only goes to that pool's workers. Both conditions are applied in the candidate query, so a dedicated worker never starves behind a backlog of runs it may not take.

## Control plane

Any replica can serve any request. Run events, run status, cluster settings, sessions, leases, signed-request nonces, rate limit counters, and MCP sessions live in the database, and streaming endpoints (SSE, WebSocket, A2A streaming) read from it, so a client can follow a run on a different replica from the one that created it, and a worker can long-poll any replica.

More than one replica needs PostgreSQL. Garrison refuses to start on Sqlite when `Cluster.ExpectedReplicas` is above 1, because Sqlite cannot be shared safely between processes on different hosts. Running several replicas on one Sqlite file is not supported, even on one host: the startup lock and the single-writer claim serialization only cover one process.

### How replicas coordinate

| Concern | Mechanism |
|---|---|
| Two workers want the same run | Claiming is one `UPDATE ... WHERE status = 'Queued'`. Exactly one succeeds; the loser moves on to the next candidate |
| A worker that was thought dead comes back | Each claim increments the run's fencing epoch. Every event, heartbeat, and completion carries the epoch, and a stale one is rejected with `StaleLease`, telling the worker to stop the harness |
| Deployment `maxConcurrentRuns` | Exact: claims for the deployment are serialized in the database and the claim counts active runs |
| Requeueing, deadlines, lost nodes, retention, cleanup of expired shared state | Done by one leader, elected through a database lease (15 seconds, renewed every pass). If the leader dies, another replica takes over within the lease time |
| Schema migrations and built-in seeding | Run under a database startup lock (a PostgreSQL session advisory lock on its own connection, released when the work ends or the process dies). The first replica migrates; the others wait, then find nothing to do. A row in `coordination_leases` cannot be used here, because that table is itself created by the migrations, and a session lock cannot outlive a crashed migrator |
| Settings | Cluster settings are in the database. A change publishes `SettingsChanged` on the backplane and every replica reloads at once; each also reloads every 3 seconds regardless |
| Permissions | Grant caches (15 seconds) are dropped on every replica when roles, permissions, assignments, users, or credentials change |
| Revocation | Sessions are database rows, so revoking a token takes effect on every replica |
| New work | Queuing a run wakes waiting long polls on every replica through the backplane. Without a message, a long poll still re-checks every `LeasePollMs` (500 ms) |
| Run events | Event ingestion on any replica wakes that run's SSE and A2A streaming subscribers on every replica. Without a message, they re-read every `4 x Scheduling.EventPollMs` (1 second) |
| Run completion | A run finishing on any replica wakes its synchronous-invoke waiters on every replica. They ignore event batches, and without a message they re-read every `Scheduling.InvocationWaitPollMs` (5 seconds), so a backlog of waiting invocations costs about one read per waiter every 5 seconds instead of one per second plus one per event batch |
| Permission approvals | A harness call waiting on an approval is held by the replica that received it. A decision on any replica is a compare-and-set update of the `approvals` row and publishes `ApprovalChanged`, which wakes the waiter wherever it is; without a message the waiter re-reads the row every 2 seconds. The leader's sweep cancels approvals of runs that stopped and expires approvals nobody is waiting on any more |
| Signed-request replay | Nonces are stored in `request_nonces` until twice `Auth.SignedRequestSkewSeconds` has passed, so a captured request cannot be replayed on any replica |
| Token rate limit | `Auth.RateLimitPerMinute` is counted in `rate_limit_buckets`, so the limit is the same however many replicas run |
| MCP sessions | Session identifiers (`mcs_...`) name rows in `mcp_sessions`, so any replica serves any session (below) |
| Idempotent run creation | Creates with the same `Idempotency-Key` are serialized on the key in the database, so retries that reach two replicas at once create one run |

### The event backplane

Replicas tell each other about changes through a small backplane, chosen with `Cluster.Backplane` (`GARRISON_BACKPLANE`):

| Mode | How it works | When to use it |
|---|---|---|
| `Auto` (default) | `PostgresNotify` on PostgreSQL, `Local` on Sqlite | Almost always |
| `PostgresNotify` | Each replica keeps one unpooled `LISTEN` connection; publishing is `pg_notify` on a pooled connection. The channel name is derived from the database, schema, and table prefix, so separate installations sharing a server stay apart | PostgreSQL, lowest latency |
| `Polling` | Messages are rows in `backplane_messages`; each replica polls every `Cluster.BackplanePollMs` (250 ms). The leader deletes rows older than 5 minutes | Connection poolers that do not support `LISTEN` (for example PgBouncer in transaction mode) |
| `Local` | Nothing leaves the process | One replica |

Messages are hints, never the only path: run changes, new work, settings and permission invalidations, and MCP session closures. Every waiter re-reads the database on its own interval, so a dropped message costs latency and nothing else. Publishing never blocks a request; messages are coalesced (one per kind and subject) every 10 ms. After the `LISTEN` connection is re-established, or after the polling backplane recovers from a database error, each replica wakes every waiter and drops its caches, because messages may have been missed in between.

### MCP sessions across replicas

Voltaic, which implements MCP, keeps sessions in process memory, rejects a session identifier it did not issue, and has no hook for adopting one. So Garrison answers the public MCP port itself and relays each request to Voltaic on a loopback port (`Mcp.InternalPort`, a free port by default). On `initialize`, the relay stores the session in `mcp_sessions` (principal, requested protocol version, client name and version) and returns its own identifier. When a request names a session this replica has not seen (opened on another replica, or before a restart), the relay checks the row, confirms the caller is the same principal, replays the `initialize` handshake against its own Voltaic endpoint, and maps the two. A session expires after `Mcp.SessionIdleTimeoutSeconds` (3600) without use, and `DELETE` ends it on every replica. The relay authenticates each request once and passes the principal to Voltaic with a per-process secret, so a signed request's nonce is used once.

Two things do not carry across replicas: the client capabilities sent with `initialize` (Garrison never calls back into an MCP client, so it does not store them), and resumption of an SSE stream with `Last-Event-ID` (a client that moves to another replica opens a new stream). Neither affects Garrison's tools. MCP needs no session affinity, so the `sessionAffinity: ClientIP` workaround is unnecessary.

### In-memory state, replica by replica

Every piece of state a replica keeps in memory, and why it is safe with several replicas:

| State | Where | Treatment |
|---|---|---|
| Signed-request nonces | `request_nonces` table | Shared. One upsert per signed request; the leader deletes expired rows every minute |
| Token rate limit counters | `rate_limit_buckets` table | Shared. One upsert per token request, exact across replicas. Chosen over dividing the limit by the replica count, which goes wrong as soon as the autoscaler changes the count or the load balancer is uneven; token requests are rare enough for a database write |
| MCP sessions | Voltaic memory, keyed by `mcp_sessions` rows | Shared through the table and the relay above |
| Grant cache (`AuthorizationService`) | Per replica, 15 seconds | Invalidated on every replica through `PermissionsChanged`; the time to live bounds a lost message |
| Cluster settings cache | Per replica | Reloaded on `SettingsChanged` and every 3 seconds |
| Runtime options derived from settings | Per replica | Re-applied whenever the settings cache changes |
| Run signals (SSE, A2A streaming, synchronous REST and MCP invoke waits) | Per replica, one entry per watched run | Woken locally and through the backplane; an entry exists only while someone waits on it; waiters re-read the database every second regardless |
| Approval waits | Per replica, one entry per pending approval with a waiting harness call | Woken locally and through `ApprovalChanged`; re-read every 2 seconds regardless; a waiter lost with its replica is resolved by the leader's sweep (expiry plus 30 seconds) |
| Queue signal (lease long polls) | Per replica | Woken locally and through `QueueChanged`; long polls re-check every 500 ms regardless |
| WebSocket subscriptions | Per connection | Each connection polls the database about once a second, so it is correct on any replica |
| Blocked-run node snapshot | Per replica, 3 seconds | Read-only advice (`blockedReason`); a few seconds of staleness is acceptable |
| Blocked-run notices | Leader only | A new leader rebuilds them from the `RunBlocked` events already written, so notices are not repeated |
| Observability status | Per replica, 30 seconds, keyed by the settings | Per replica by design: it reports what this replica can reach |
| Run gauges (`garrison_runs_queued`, `garrison_runs_active`) | Per replica, refreshed every 10 seconds | Every replica reports the same cluster-wide counts; aggregate with `max`, not `sum` |
| Request history capture queue | Per replica, flushed to the database in the background | Entries not yet flushed are lost if the replica crashes; a graceful shutdown flushes them |
| Leader state | Per replica | By design; fenced by the lease epoch |
| Control node activity counters (open streams, held long polls, requests in flight) | Per replica | By design: each replica writes its own counters into its own `control_nodes` row on every heartbeat |
| Template parse cache | Per process, keyed by template text | Content-addressed, so never stale |
| MCP tool descriptions | Loaded at startup | They come from protected built-in templates that only change with a release, and every replica loads the same text |
| Operation scope map and routes | Per process | Identical on every replica |
| Harness profiles, prompt templates, agents, deployments, secrets | Not cached | The compiler reads them from the database for every claimed run |
| Settings file | Per replica | Node settings written through the settings API go to that replica's file. Use a ConfigMap and environment variables for clustered deployments |

REST, A2A, SSE, WebSocket, MCP, and node protocol traffic need no affinity.

### Startup, readiness, and shutdown

A starting replica first answers on its REST port with a small startup listener: `GET /v1.0/api/health/live` answers 200 and everything else 503 (`starting`) while it waits for the startup lock, migrates, and seeds. Then the real listener takes the port. Readiness (`GET /v1.0/api/health` or `/v1.0/api/health/ready`) answers 200 only when the database answers, its schema is at least the version this build needs, and the replica is not draining. Point the readiness probe at `/v1.0/api/health/ready` and the liveness probe at the separate liveness port, `http://127.0.0.1:8702/v1.0/api/health/live` (`Rest.LivenessPort`), so a long migration, a database outage, or overload never restarts a pod. The liveness port is served from its own thread from the moment the process starts: it never waits for the database, the REST listener's request queue, or the thread pool, so a saturated replica keeps answering it while readiness takes it out of rotation. The shipped manifests probe liveness every 10 seconds with a 10-second timeout and restart only after 6 failures in a row.

On SIGTERM a replica drains: readiness answers 503 (`draining`) at once, waiting lease long polls return empty so their workers re-poll another replica, SSE streams send `server.draining` and close (an `EventSource` reconnects elsewhere and resumes with `Last-Event-ID`), A2A streams, WebSockets, and synchronous waits end, and in-flight requests get up to 15 seconds. Then background work and the listeners stop. The whole sequence fits a 30-second termination grace period.

### Seeing the replicas: control nodes

Every replica keeps one row in `control_nodes` (migration 7) about itself, the way a worker keeps its row in `nodes`, so an operator can see the control plane next to the workers. `GET /v1.0/api/control-nodes` lists the rows (Read on `Node`, the same permission as worker nodes; see `REST_API.md`), and the overview adds `controlNodesByStatus` and `leaderNodeId`.

| Column | What it shows |
|---|---|
| `id`, `name` | The replica's node ID: `GARRISON_NODE_ID`, which the Kubernetes manifests set to the pod name, otherwise the host name |
| `hostname`, `address` | Where the replica runs: host name, and IP address with the REST port |
| `version`, `schemaVersion` | The server build, and the schema version it found at startup. During a rolling upgrade, old and new replicas show different versions side by side |
| `backplane` | `Local`, `Polling`, or `PostgresNotify`, after `Auto` is resolved |
| `status` | `Starting` from the moment the database is migrated until the listener serves; `Ready` while serving; `Draining` as soon as SIGTERM arrives; `Offline` after a clean exit, or when the leader finds the row silent for `ControlPlane.OfflineAfterMs` (30 seconds) |
| `startedUtc`, `lastHeartbeatUtc` | Process start (uptime) and the last heartbeat. Rows are heartbeated every `ControlPlane.HeartbeatIntervalMs` (5 seconds) |
| `activeRequests`, `openStreams`, `heldLongPolls` | At the last heartbeat: HTTP requests in flight, open SSE streams and WebSocket connections, and worker lease long polls being held. A replica that is about to drain with many open streams will push that many reconnects to the others |
| `isLeader`, `leaderEpoch` | Not stored: computed from the `garrison-leader` row in `coordination_leases` when the response is built, so exactly one row shows `isLeader` while a replica holds an unexpired lease, whichever replica answers |

Every response also carries `respondingNodeId`, the replica that answered, which makes it easy to see the load balancer spreading requests. The leader deletes rows that have been `Offline` for `ControlPlane.OfflineRetentionHours` (24), so pods replaced by a rollout disappear a day later. A heartbeat rewrites the whole row, so a replica the leader marked `Offline` during a long pause comes back as `Ready` on its next heartbeat. Prometheus gets the same picture as `garrison_control_nodes` by `status`; like the run gauges, every replica reports the cluster-wide counts.

### What limits a replica

Most control-plane work is small: authentication, authorization (role grants are cached briefly), and database reads and writes. The heavier parts are:

- **Compiling runs.** Each claimed run is compiled into an execution spec: templates rendered, secrets decrypted, a run token issued. Watch `garrison_compile_duration_seconds`.
- **Event ingestion.** Workers send events in batches (100 events or every 250 ms per run by default). Very chatty harnesses multiplied by many concurrent runs means many small database writes.
- **Streaming subscribers.** An SSE subscriber reads the database when the backplane says its run changed, and at least every `4 x Scheduling.EventPollMs` (1 second); a WebSocket subscriber polls about once a second. Hundreds of dashboards watching hundreds of runs add up; raise the poll interval if the database becomes the bottleneck.
- **Long polls.** Each worker holds one lease request open for up to `LeaseWaitMs` (20 seconds). That is one connection per worker per replica it happens to reach, which is cheap.

The production overlay's HPA scales the server between 2 and 10 replicas on CPU, and can also scale on request rate and active runs through Prometheus Adapter (`docs/KUBERNETES.md`, "Autoscaling"). `garrison_runs_queued` and `garrison_runs_active` are also exported by every replica as cluster-wide gauges; take the `max` across pods, not the sum.

## Database

PostgreSQL carries run coordination and durable fencing, so it is the component to size first. Optional [Clutch coordination](CLUTCH_LEASES.md) also gates leadership and Codex credential refresh; it does not remove database claims or fencing.

### Connections

Each replica opens at most `Database.MaxPoolSize` pooled connections (`GARRISON_DB_MAX_POOL_SIZE`; 100 when unset, 40 in every shipped configuration), plus one unpooled `LISTEN` connection for the `PostgresNotify` backplane and, briefly at startup, one for the startup lock. Size the pool against the most replicas that can run at once, which is the HPA's `maxReplicas` when autoscaling is on:

```
max_connections >= maxReplicas x (MaxPoolSize + 2) + 13
```

The 13 covers PostgreSQL's `superuser_reserved_connections` (3) and about 10 for the bootstrap Job, backups, migrations run by hand, and an operator's `psql`. Add whatever other clients share the server.

| Configuration | Replicas (most) | `MaxPoolSize` | Connections needed | `max_connections` |
|---|---|---|---|---|
| Kustomize base with `components/postgres`, Helm `database.mode: embedded` | 4 | 40 | 4 x 42 + 13 = 181 | 200 (set by the component and `database.embedded.maxConnections`) |
| `overlays/production` and `values-production.yaml` (external PostgreSQL, HPA up to 10) | 10 | 20 | 10 x 22 + 13 = 233 | at least 250 on your PostgreSQL |
| Docker Compose | 1 | 40 | 55 | 100 (PostgreSQL's default) |
| `k8s/tests` scale overlay | 3 to 5 | 40 | up to 223 | 300 |

The Helm chart checks the embedded case when it renders and refuses a combination that does not fit. Raise `max_connections` (each connection costs PostgreSQL a few megabytes) or lower the pool when you add replicas.

Most requests hold a connection for one query, so a pool of 20 to 50 per replica is usually plenty, and a smaller pool with `Database.ConnectionTimeoutSeconds` (15) fails fast instead of piling up waiters. When the pool is exhausted, or PostgreSQL itself is out of connection slots, requests answer `503 DatabaseBusy` with `Retry-After` (`Rest.DatabaseRetryAfterSeconds`, default 2), and when the database cannot be reached they answer `503 DatabaseUnavailable`; neither is ever a 500. Clients and SDK callers should retry these after the advertised delay. `Database.MinPoolSize` keeps warm connections, and `Database.CommandTimeoutSeconds` (30) bounds any single statement. Behind PgBouncer in transaction mode, use `Cluster.Backplane` `Polling`, because `LISTEN` needs a session.

### Read path

The busiest tables are runs and run events. Run lists filter by tenant with status, agent, or time and order by creation time; each of those has an index, as do delegation trees (`rootrunid`), the leader's scans of expired leases, deadlines, and finished runs, and event retention (`createdutc`). Events are read by run and sequence through the unique `(runid, sequence)` index, a page at a time (`limit` up to 5000, with `hasMore`). Run lists return run rows without their child rows (parameters, requirements, template versions); a single run read loads them. Claim candidates load only their label requirements, in one query per batch.

### Retention and archival

Retention keeps the tables bounded: finished runs are deleted after `Runs.RetentionDays` (30) with their events, and events after `Runs.EventRetentionDays` (14); request history and audit have their own retention. The leader runs retention once an hour. Lower these if the tables grow faster than you want.

Set `Archive.Directory` (`GARRISON_ARCHIVE_DIRECTORY`) to keep what retention removes. Before deleting, the leader appends each run, with its parameters, requirements, template versions, and events, as one line of `garrison-runs-yyyyMMdd.jsonl`, and each event of a still-retained run as one line of `garrison-events-yyyyMMdd.jsonl` (UTC dates). A record is deleted only after its line is written and flushed, so a full disk delays retention instead of losing data. Whichever replica leads writes the archive, so with several replicas mount one shared (ReadWriteMany) volume at the same path in each. Artifact stores do not carry a location yet, so they cannot receive archives; copy the files to object storage with your usual tooling.

## Timing settings

All of these are cluster settings and apply live.

| Setting | Default | Effect of raising it | Effect of lowering it |
|---|---|---|---|
| `Scheduling.LeaseDurationMs` | 30000 | Fewer false "node lost" decisions on slow networks | A dead worker's runs are recovered sooner |
| `Scheduling.NodeHeartbeatTimeoutMs` | 20000 | Same, for whole nodes | Same |
| `Scheduling.LeaseWaitMs` | 20000 | Fewer lease requests from idle workers | Faster reaction when a replica's wake-up is missed |
| `Scheduling.EventPollMs` | 250 | Less database load from streams | Lower streaming latency |
| `Scheduling.InvocationWaitPollMs` | 5000 | Less database load from waiting invocations | A waiter whose completion signal was lost answers sooner |
| `ControlPlane.HeartbeatIntervalMs` | 5000 | Fewer control node writes | Fresher activity counters |
| `ControlPlane.OfflineAfterMs` | 30000 | Fewer false `Offline` rows on a slow database | A crashed replica shows `Offline` sooner |
| `Scheduling.PauseGraceMs` | 5000 | Fewer false pause detections on a slow database | Shorter pauses are caught (see "Pauses" below) |

Workers heartbeat every 5 seconds by default, and the server's registration response tells them the heartbeat interval and lease wait to use.

## Failure handling

| Failure | What happens |
|---|---|
| A worker crashes | Its leases stop being renewed. After the lease expires, the leader requeues a run that never started (still Leased) if it has attempts left; a run that started is requeued only when the deployment sets `retryOnNodeLoss` and has attempts left, and otherwise fails with `NodeLost` |
| A worker loses the control plane | It keeps running its harnesses, buffers events (up to `MaxBufferedEvents` per run), and retries completion for up to `CompletionRetrySeconds`. If its lease was taken away in the meantime, its reports are refused and the run's later attempt wins |
| A control-plane replica crashes | Clients and workers retry against another replica. If it was the leader, another replica takes over maintenance within the leader lease |
| The database is unavailable | The control plane cannot accept or hand out work: API calls answer `503 DatabaseUnavailable` (JSON, with `Retry-After`), readiness answers 503, and liveness keeps answering 200. Workers keep running what they have and retry |
| A worker is partitioned after it claims a run | The worker asks the control plane to acknowledge the start before it launches the harness (the start gate). Without the acknowledgement it never launches; the lease expires and the leader requeues the run, which therefore runs once. A run whose start was acknowledged follows `retryOnNodeLoss` when its lease expires: `NodeLost` by default, a new attempt only when the deployment allows it, and the old attempt's run token stops working either way |
| A run hangs | The worker kills it at the deadline. If the worker cannot, the leader fails the run after the deadline plus a grace period |
| The host sleeps, or the container or VM is frozen | Every timestamp looks old on resume. The leader notices the gap, holds off for one heartbeat window, and judges nodes and runs only after they have had a chance to report (below) |

### Pauses

A laptop that sleeps with Docker running freezes every process in the Docker VM: the control plane, the workers, and PostgreSQL. When the VM resumes, the wall clock has jumped, so every heartbeat, lease, and control node row looks minutes old. Without protection, the leader's first pass would mark every worker `Lost`, every replica (itself included) `Offline`, and fail healthy runs with `NodeLost`; the workers would then see stale leases and kill their harnesses. This happened on 2026-10-10, and P3.16 is the fix.

The leader's maintenance loop compares the wall-clock time since its previous tick with the time it slept. A tick counts as a pause when the gap is longer than the maintenance interval (2 seconds) plus `Scheduling.PauseGraceMs` (5 seconds), so 7 seconds with the defaults. Two steps of one pass more than `Scheduling.PauseGraceMs` apart count too, which covers a pause that lands in the middle of a pass. Every replica watches, not only the leader, so a replica that wins the election just after a resume also waits. On a pause the leader:

1. Logs a Warning such as `maintenance paused for 178.0 s; giving nodes one heartbeat window (10000 ms) to report ...` with structured fields `event=maintenance.pause pausedMs=... resumedUtc=... deferUntilUtc=... detectedIn=tick|pass leader=true|false`, and counts it in `garrison.maintenance.pauses`.
2. Heartbeats its own control node row at once.
3. Expires no leases, enforces no deadlines (including the `Runtime.MaxRunSeconds` cap), marks no worker `Lost` and no control node `Offline`, and fails no blocked run until one heartbeat window plus the grace has passed since the resume: the larger of `HeartbeatIntervalMs` and `ControlPlane.HeartbeatIntervalMs` plus `Scheduling.PauseGraceMs`, so 10 seconds with the defaults. Another pause during the window starts a new one. Time spent paused does not count toward `Runtime.FailBlockedAfterSeconds`.
4. When the window ends, gives deadlines back. A run held across the pause whose worker re-confirmed the lease after the pause began (its lease now expires later than any renewal made before the pause could produce) gets its deadline, and its allowance under `Runtime.MaxRunSeconds`, moved by the paused time. A run whose worker did not re-confirm keeps its deadline and is enforced normally. The leader logs `event=maintenance.resume` with how many runs were extended and how many were not.
5. Evaluates normally. A worker that is really down (it stopped heartbeating and never came back) is marked `Lost` and its runs requeued or failed on the first pass after the window, so a real outage is detected at most one heartbeat window later than without a pause.

Separately, a leader whose own control node heartbeat is stale (older than `ControlPlane.HeartbeatIntervalMs` plus `Scheduling.PauseGraceMs`, or older than its last detected resume) marks nothing. It heartbeats itself first, and logs `event=maintenance.self_stale` once if it still cannot. A leader that just resumed therefore never judges others before it has re-heartbeated itself. Each replica's heartbeat loop also wakes once a second, notices a pause the same way, logs `event=controlnode.pause`, and heartbeats at once.

Workers do the same on their side. The heartbeat loop wakes once a second, and when more than its sleep plus the worker's `PauseGraceMs` (5 seconds) has passed it logs `worker was paused for N s; heartbeating and renewing M leases now` (`event=worker.pause`) and heartbeats immediately, which renews every lease it holds well inside the leader's window. If the control plane still answers that a lease is stale (the leader really did give the run away), the worker kills the harness as before, and the log line says it resumed from a pause (`event=worker.stale_after_pause`).

The rule assumes the pause is visible as a wall-clock jump. Pauses shorter than the threshold need no protection: with the defaults a node is only marked `Lost` after 20 seconds of silence, and a 7-second gap cannot get there on its own. Raise `Scheduling.PauseGraceMs` if your database is slow enough that one maintenance query takes more than 5 seconds, or every slow pass will be treated as a pause and real outages will be judged later.

## Scale and resilience tests

`k8s/tests` holds the tests that back the numbers on this page. They run against a throwaway k3d cluster with its own kubeconfig (`k8s/tests/.work/kubeconfig`), so they never touch your default kubeconfig or another cluster you have running, and the cluster's node container is capped (`NODE_MEMORY`, 4 GB by default) so it cannot starve other containers. Every worker runs only the fake harness, so the tests cost no tokens and measure Garrison rather than a model.

| Script | Plan item | What it does | Passes when |
|---|---|---|---|
| `cluster-up.sh` | | Creates k3d cluster `garrison-scale` (API on 127.0.0.1:6560, the server's NodePort on 127.0.0.1:18870) and imports the images. `BUILD=1` builds them from your checkout first, tagged `scaletest-local` | |
| `deploy.sh` | | `SERVERS` replicas on PostgreSQL, `WORKERS` workers with `WORKER_CONCURRENCY` slots each, small resource requests; waits for every worker to be Ready. Re-run to resize | |
| `loadtest.sh` | P10.13 | Starts `RUNS` runs at once and follows them to the end | Every run Succeeded |
| `rolling-upgrade-test.sh` | P10.8 | Starts the load, then restarts the server Deployment (or sets `UPGRADE_TAG`) once a third of the runs exist; `ROLL_WORKERS=1` rolls the workers too | Every run Succeeded and no run creation failed |
| `chaos-test.sh` | P10.14 | Starts the load, then kills a random server or worker pod every `CHAOS_INTERVAL` seconds for `CHAOS_DURATION` seconds (forcefully by default, like a crash) | No run is stuck: each one ends Succeeded, or Failed with `NodeLost` or `StaleLease` after its attempts ran out, within `TIMEOUT_SECONDS` |
| `run-all.sh` | | All of the above in order, then deletes the cluster unless `KEEP_CLUSTER=1` | All three pass |
| `cluster-down.sh` | | Deletes the cluster | |
| `local-dry-run.sh` | | The load generator against a local server (Sqlite) and worker processes, no Kubernetes; `RESTART_SERVER_AFTER=<seconds>` restarts the server mid-run | Every run Succeeded |

```bash
k8s/tests/cluster-up.sh            # or BUILD=1 k8s/tests/cluster-up.sh to test your working tree
k8s/tests/deploy.sh                # 3 servers, 4 workers x 4 slots
k8s/tests/loadtest.sh              # 300 runs of about 3 seconds
k8s/tests/rolling-upgrade-test.sh
k8s/tests/chaos-test.sh
k8s/tests/cluster-down.sh
```

The defaults (3 servers, 4 workers with 4 slots, 300 runs) fit a laptop whose Docker VM has about 8 GB that it shares with other containers. The plan's full test is 3 servers, 10 workers, and 1000 concurrent runs. On a machine with 16 GB or more for Docker:

```bash
NODE_MEMORY=12g AGENTS=2 k8s/tests/cluster-up.sh
SERVERS=3 WORKERS=10 k8s/tests/deploy.sh
RUNS=1000 TIMEOUT_SECONDS=1800 k8s/tests/loadtest.sh
RUNS=1000 TIMEOUT_SECONDS=1800 k8s/tests/rolling-upgrade-test.sh
RUNS=1000 TIMEOUT_SECONDS=1800 CHAOS_DURATION=300 k8s/tests/chaos-test.sh
```

`AGENTS=2` adds two k3d agent nodes so the spread and anti-affinity rules have somewhere to put replicas; each node gets `NODE_MEMORY`. `deploy.sh` and the three tests also run against another cluster: set `KUBECONFIG_FILE` and `CONTEXT` to reach it and `BASE_URL` to wherever this machine reaches the server's REST port (the test overlay exposes NodePort 30870). They never fall back to your current context.

The load generator (`k8s/tests/loadgen`, a C# console that uses the SDK) applies a `loadtest-echo` agent on the fake harness with `maxAttempts` 3 and `retryOnNodeLoss`, creates every run with an idempotency key (so a creation retried after a dropped connection never makes a duplicate), and follows the runs through the run list. It writes one CSV row per run under `k8s/tests/results/` with the server's timestamps, claim latency (queued to leased), attempt count, worker, and outcome, and appends one row per test to `k8s/tests/results/summary.csv` with claim latency percentiles, run time percentiles, throughput, failures by outcome, and the verdict. When a test fails, the script also saves pod listings, events, and server and worker logs next to the CSV.

### Measured results

Measured on 2026-10-10 on a laptop: a k3d cluster capped at 4 GB in a Docker VM with 8 GB that also ran another Garrison cluster with the observability stack. 3 server replicas on PostgreSQL 17, 4 workers with 4 slots each (16 slots), fake harness.

| Test | Runs | Run length | Outcome | Claim latency p50 / p99 | Throughput |
|---|---|---|---|---|---|
| Scheduler overhead, no backlog | 16 | 3 s | 16 succeeded | 130 ms / 191 ms | 4.9 runs/s |
| Scheduler overhead, no backlog | 16 | 0.5 s | 16 succeeded | 39 ms / 107 ms | 22.7 runs/s |
| Load (P10.13) | 300 at once | 3 s | 300 succeeded | 28.3 s / 56.0 s (backlog) | 5.0 runs/s |
| Rolling upgrade (P10.8): all 3 servers restarted mid-load | 300 at once | 5 s | 300 succeeded, 0 failed, 0 creation errors | 46.1 s / 91.9 s (backlog) | 3.1 runs/s |
| Chaos (P10.14): 7 forced kills of server and worker pods, 15 s apart | 300 at once | 5 s | 300 succeeded, 0 stuck, 8 requeued after a worker died | 42.4 s / 92.8 s (backlog) | 3.1 runs/s |

With no backlog, the control plane adds about 40 to 190 ms between a run being queued and a worker leasing it, and runs finished 140 to 230 ms after their harness time. Under load, throughput sat at the slot limit (16 slots divided by the run length), so the workers, not the control plane, were the bottleneck: add workers or slots to go faster. The plan's full size (3 servers, 10 workers, 1000 runs) needs more memory than this laptop's Docker VM; use the commands above on a larger machine and add the results here.

Read claim latency with the backlog in mind. When `RUNS` is larger than the cluster's slots (`WORKERS` times `WORKER_CONCURRENCY`, 16 by default), most of a run's wait is its place in the queue, and the percentiles describe the backlog. For the scheduler's own overhead, run with `RUNS` at or below the slot count; for throughput, keep the backlog.

## Event insertion microbenchmark (P10.22)

Event ingestion uses multi-row inserts with `(runid, sequence)` replay deduplication. All chunks share one transaction, so a late failure rolls back the whole batch. PostgreSQL chunks at 4,369 rows (15 parameters per row, protocol limit 65,535). SQLite uses two-row chunks with a reused prepared command, because large named-parameter statements measured slower than small ones; its conservative parameter budget remains 999. `AdoRunEventMethods.BatchRowLimit` can tune chunk size (1 to 5,000), with the parameter budget as a second cap. Single-event batches retain the original lightweight path.

Measured 2026-10-12 on Apple M5 Max, .NET 10.0.401, SQLite locally and PostgreSQL 17.11 in Docker. Each cell is the median of five rounds of 3,000 events; events carry 128-character assistant text and raw JSON. Setup/allocation and one warmup batch are excluded; transaction/connection cost is included. Baseline is `f947551` with the same microbenchmark harness copied in. These are direct database measurements, not the fleet capacity ceiling (P14.15 remains open).

| Provider | Batch size | Before events/s | After events/s | Ratio |
|---|---:|---:|---:|---:|
| sqlite | 1 | 25,091 | 25,427 | 1.01x |
| sqlite | 10 | 74,825 | 84,976 | 1.14x |
| sqlite | 100 | 121,777 | 136,749 | 1.12x |
| postgresql | 1 | 1,640 | 1,656 | 1.01x |
| postgresql | 10 | 3,424 | 13,010 | 3.80x |
| postgresql | 100 | 3,901 | 43,760 | 11.22x |

Raw results and environment are local generated artifacts (ignored by Git): `benchmarks/results/20261012-event-inserts/{before.csv,after.csv,provenance.txt}`. The table above preserves the measured medians; this five-round microbenchmark does not establish statistical significance or a fleet throughput target. Reproduce the comparison with an available PostgreSQL test server:

```bash
GARRISON_TEST_PROVIDERS=sqlite,postgresql scripts/benchmark-event-inserts.sh f947551
```

For one revision, run `dotnet run --project src/Test.Automated -f net10.0 -- --event-insert-benchmark --providers sqlite,postgresql --benchmark-events 3000 --benchmark-rounds 5`. Provider connection overrides are the existing `GARRISON_TEST_PG_*` variables. The comparison script preserves CSV/build logs and removes its temporary baseline worktree.

## Text delta coalescing (P10.23)

Workers merge consecutive `AssistantText` or `Thinking` deltas inside `EventFlushIntervalMs`, up to `EventTextCoalesceMaxChars` (default 2048; environment `GARRISON_WORKER_EVENT_TEXT_COALESCE_MAX_CHARS`). Set the cap to `0` to compare uncoalesced storage. Other types, metadata changes, sequence advances, explicit flushes, and selected delivery batches seal the current group. Retries never change a previously sent payload. Individual events exceeding the cap remain intact.

The provider-backed fixture emits 1000 four-character deltas: the disabled baseline stores 1000 rows, and the default stores 2 (500x fewer), with identical concatenated text and original JSONL harness lines. This measures token-stream storage, not end-to-end throughput. Live streams still tail the same database at the existing cadence. Reproduce on SQLite/PostgreSQL:

```sh
dotnet run --project src/Test.Automated -f net10.0 -- --providers sqlite,postgresql --suites event-coalescing
```
