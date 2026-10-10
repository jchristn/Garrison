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

The production overlay's HPA scales the server between 2 and 10 replicas on CPU, and can also scale on request rate and active runs through Prometheus Adapter (`docs/KUBERNETES.md`, "Autoscaling"). Remember the MCP affinity note above before relying on it.

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

Read claim latency with the backlog in mind. When `RUNS` is larger than the cluster's slots (`WORKERS` times `WORKER_CONCURRENCY`, 16 by default), most of a run's wait is its place in the queue, and the percentiles describe the backlog. For the scheduler's own overhead, run with `RUNS` at or below the slot count; for throughput, keep the backlog.
