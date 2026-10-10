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

The per-deployment limit is checked when a run is claimed. With several control-plane replicas claiming at the same moment it can be exceeded by a run or two; treat it as a throttle, not a hard quota.

## Control plane

Each replica is stateless apart from a few in-memory caches, so any replica can serve any request. Run events, run status, cluster settings, sessions, and leases live in the database, and streaming endpoints (SSE, WebSocket, A2A streaming) read from it, so a client can follow a run on a different replica from the one that created it.

More than one replica needs PostgreSQL. Garrison refuses to start on Sqlite when `Cluster.ExpectedReplicas` is above 1, because Sqlite cannot be shared safely between processes on different hosts.

### How replicas coordinate

| Concern | Mechanism |
|---|---|
| Two workers want the same run | Claiming is one `UPDATE ... WHERE status = 'Queued'`. Exactly one succeeds; the loser moves on to the next candidate |
| A worker that was thought dead comes back | Each claim increments the run's fencing epoch. Every event, heartbeat, and completion carries the epoch, and a stale one is rejected with `StaleLease`, telling the worker to stop the harness |
| Requeueing, deadlines, lost nodes, retention | Done by one leader, elected through a database lease (15 seconds, renewed every pass). If the leader dies, another replica takes over within the lease time |
| Settings | Cluster settings are in the database; every replica reloads them about every 3 seconds |
| Revocation | Sessions are database rows, so revoking a token takes effect on every replica |
| New work | A replica wakes its own waiting long polls immediately when a run is queued. Long polls on other replicas notice within `LeasePollMs` (500 ms) |

### Things that are still per replica

- **MCP sessions.** The MCP server keeps session state in memory, and a request with a session identifier the replica does not know answers 404 `Session not found`. With more than one replica, MCP traffic needs session affinity. In Kubernetes, set `sessionAffinity: ClientIP` on the service that carries port 8701, or route MCP through an ingress with sticky sessions. Without it, MCP clients and agent delegation fail intermittently. The shipped manifests do not set affinity yet.
- **Signed-request nonces.** Each replica remembers the nonces it has seen, so a captured signed request could be replayed once on each other replica within the skew window. Use TLS.
- **Token rate limiting.** `Auth.RateLimitPerMinute` is counted per replica, so the effective limit is that number times the replica count.
- **Settings files.** Node settings written through the settings API go to that replica's file. Use a ConfigMap and environment variables for clustered deployments.

REST, A2A, SSE, and WebSocket traffic need no affinity.

### What limits a replica

Most control-plane work is small: authentication, authorization (role grants are cached briefly), and database reads and writes. The heavier parts are:

- **Compiling runs.** Each claimed run is compiled into an execution spec: templates rendered, secrets decrypted, a run token issued. Watch `garrison_compile_duration_seconds`.
- **Event ingestion.** Workers send events in batches (100 events or every 250 ms per run by default). Very chatty harnesses multiplied by many concurrent runs means many small database writes.
- **Streaming subscribers.** Every SSE or WebSocket subscriber polls the database (`Scheduling.EventPollMs`, 250 ms, for SSE; about once a second for WebSocket). Hundreds of dashboards watching hundreds of runs add up; raise the poll interval if the database becomes the bottleneck.
- **Long polls.** Each worker holds one lease request open for up to `LeaseWaitMs` (20 seconds). That is one connection per worker per replica it happens to reach, which is cheap.

The production overlay's HPA scales the server between 2 and 10 replicas on CPU. Remember the MCP affinity note above before relying on it.

## Database

PostgreSQL carries all coordination, so it is the component to size first. The busiest tables are runs and run events. Retention keeps them bounded: finished runs are deleted after `Runs.RetentionDays` (30) and events after `Runs.EventRetentionDays` (14); request history and audit have their own retention. Lower these if the tables grow faster than you want, and raise `Database.MaxPoolSize` (100 per replica) only together with PostgreSQL's `max_connections`.

## Timing settings

All of these are cluster settings and apply live.

| Setting | Default | Effect of raising it | Effect of lowering it |
|---|---|---|---|
| `Scheduling.LeaseDurationMs` | 30000 | Fewer false "node lost" decisions on slow networks | A dead worker's runs are recovered sooner |
| `Scheduling.NodeHeartbeatTimeoutMs` | 20000 | Same, for whole nodes | Same |
| `Scheduling.LeaseWaitMs` | 20000 | Fewer lease requests from idle workers | Faster reaction when a replica's wake-up is missed |
| `Scheduling.EventPollMs` | 250 | Less database load from streams | Lower streaming latency |

Workers heartbeat every 5 seconds by default, and the server's registration response tells them the heartbeat interval and lease wait to use.

## Failure handling

| Failure | What happens |
|---|---|
| A worker crashes | Its leases stop being renewed. After the lease expires, the leader requeues each run if the deployment allows another attempt (`maxAttempts`, `retryOnNodeLoss`) or fails it with `NodeLost` |
| A worker loses the control plane | It keeps running its harnesses, buffers events (up to `MaxBufferedEvents` per run), and retries completion for up to `CompletionRetrySeconds`. If its lease was taken away in the meantime, its reports are refused and the run's later attempt wins |
| A control-plane replica crashes | Clients and workers retry against another replica. If it was the leader, another replica takes over maintenance within the leader lease |
| The database is unavailable | The control plane cannot accept or hand out work. Workers keep running what they have and retry |
| A run hangs | The worker kills it at the deadline. If the worker cannot, the leader fails the run after the deadline plus a grace period |
