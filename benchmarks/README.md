# Garrison benchmarks

This directory holds everything about the benchmark suite except the harness code, which is `src/Test.Benchmark` (assembly and process `Garrison.Benchmark`). The plan, hypotheses, and metric definitions are in `BENCHMARKING.md` at the repository root; the curated numbers are in `RESULTS.md` here; the fixes the numbers point to are in `archive/IMPROVEMENTS.md` at the root.

The harness talks to Garrison only over the REST API, as a client would, with its own typed client. It never references a product assembly or reads the database. Every run uses the fake harness (`src/Garrison.FakeHarness`), so the suite costs no tokens, needs no credentials, and measures Garrison rather than a model.

## Contents

| Path | What it is |
|---|---|
| `bench.sh`, `bench.bat` | Build the harness in Release and run one command against the stack chosen by `BENCH_STACK` |
| `stack-up.sh`, `stack-up.bat` | Create the isolated K3S-in-Docker stack (k3d cluster `garrison-bench`) from the working tree |
| `stack-down.sh`, `stack-down.bat` | Delete that cluster (the full reset) |
| `start-bench-server.sh`, `.bat` | Start the local stack: the server and workers as processes from the working tree |
| `stop-bench-server.sh`, `.bat` | Stop the local stack |
| `scale.sh` | Control plane load to failure (P14.15): start the scale stack, run the `scale` command per tier, tear it down. Shell only, no `.bat` |
| `scale-up.sh`, `scale-down.sh` | Start and stop the scale stack: PostgreSQL 17 in Docker plus several servers and workers as processes from the working tree |
| `run-baseline.sh`, `.bat` | The standard suite for one round |
| `ci-gate.sh`, `.bat` | The deterministic gate against `baselines/`; run locally |
| `common.sh`, `common.bat` | Shared settings for the scripts (ports, paths, build) |
| `k3d/cluster.yaml` | The k3d cluster: pinned K3S image, ports, memory cap |
| `k8s/` | Kustomize overlay on `k8s/base` for the bench cluster: two worker lanes, small requests, fake credentials |
| `config/garrison-bench.json` | Server settings of the local stack, copied fresh into `.run/` on every start |
| `config/scale-workload.yaml` | The `scale` command's workload: a fake harness profile in its paced mode, the `scale-echo` agent, and its deployment |
| `datasets/` | Datasets, `SCHEMA.md`, and the sources and build scripts that produce them |
| `baselines/` | Committed reports the CI gate compares against (`ci-<kind>-<dataset>.json` and `.md`) |
| `baselines.json` | Published or prior results shown next to every report |
| `RESULTS.md` | Curated results, round by round, with the defects found |
| `results/` | Per-run reports (git-ignored except `.gitkeep`) |
| `.run/` | Git-ignored scratch: builds, the local stack, logs, the bench kubeconfig |
| `data/` | Git-ignored: downloaded public datasets (none are used yet) |

There is no `labels/` directory: no probe is judged by a model, so there is nothing to calibrate. There is no `agent/` directory: the suite does not run agents in the loop.

## The stacks

The k3d and local stacks serve the regular rounds. A third, the scale stack, exists only for the `scale` command and is described under [Control plane load to failure](#control-plane-load-to-failure-scale).

| | k3d stack (`stack-up.sh`) | local stack (`start-bench-server.sh`) |
|---|---|---|
| What runs | K3S v1.31.4 in Docker (k3d), the shipped Kustomize base with in-cluster PostgreSQL 17, 1 server, 2 workers on lane `alpha` and 1 on lane `beta`, 4 slots each | `Garrison.Server` (Release, Sqlite) and worker processes (1 alpha, 1 beta, 4 slots each) from the working tree |
| Images | Built from the working tree as `jchristn77/garrison-{server,worker}:bench-local`; `postgres:17`, `busybox:1.36`, `curlimages/curl:8.10.1` as the base pins them | None |
| URL | `http://127.0.0.1:37870` (MCP 37871, Kubernetes API 37443) | `http://127.0.0.1:37800` (MCP 37801, Prometheus 37464, worker health 37811 and up, worker metrics 37821 and up) |
| Use it for | Rounds: everything, including scale-out and resilience | The CI gate and quick checks |

Both stacks run only the fake harness. On the local stack the workers' `PATH` is a directory with the fake harness wrapper plus the system directories, so a `claude` or `codex` installed on your machine is never found. Both use obviously fake credentials (admin API key `garrison-benchmark-admin-key-not-for-production`).

### Ports

The suite uses the 37xxx block, bound to 127.0.0.1 only. The scale stack takes PostgreSQL 37543 and 37901 to 37999 (server n: REST 37900+n, liveness 37910+n, MCP 37920+n, Prometheus 37930+n; worker n: health 37940+n, metrics 37970+n). Other stacks on the maintainer's machine use 8700 to 8710 (Docker Compose), 6560 and 18870 (`k8s/tests`), 16443 and 18080 (a `garrison-k3s` cluster), 3000 and 9090 (Grafana and Prometheus port-forwards). Pick a different block for the next project.

### Bring up the k3d stack

```bash
benchmarks/stack-up.sh                       # creates garrison-bench, builds images from your tree, deploys, waits
BUILD=0 benchmarks/stack-up.sh               # redeploy with the images you already built
SERVERS=2 ALPHA_WORKERS=3 benchmarks/stack-up.sh
benchmarks/stack-down.sh                     # delete the cluster
```

The cluster has its own kubeconfig in `benchmarks/.run/kubeconfig`; the scripts never read or change your default kubeconfig or another cluster. The node container is capped at 3 GB.

### Bring up the local stack

```bash
benchmarks/start-bench-server.sh             # builds in Release, wipes benchmarks/.run/local, starts, waits
LOCAL_ALPHA_WORKERS=2 WORKER_SLOTS=8 benchmarks/start-bench-server.sh
benchmarks/stop-bench-server.sh
```

The server gets a fresh Sqlite database and a fresh copy of `config/garrison-bench.json` on every start.

## Commands

Run any command with `benchmarks/bench.sh <command> [options]` (or `bench.bat`). Measuring commands are pointed at the k3d stack, or at the local stack with `BENCH_STACK=local`.

| Command | What it measures | Report kind |
|---|---|---|
| `validate` | Checks dataset files against `datasets/SCHEMA.md` | none |
| `generate` | Rebuilds a dataset from its committed sources (`--kind synthetic` or `live`) | none |
| `ingest` | Manifest apply at scale: dry run, batched apply, idempotent re-apply, reachability, invalid documents | `ingest` |
| `routing` | Scheduling correctness: node selectors, weight 0, blocked runs, missing harnesses, priority, the concurrency limit, request validation | `routing` |
| `e2e` | The full run flow per probe, with the direct-invocation reference arm | `e2e` |
| `load` | Throughput and latency per concurrency (closed loop) or arrival rate (open loop), optionally per worker count | `load` |
| `resilience` | A failing harness, an overrunning harness, and on k3d a worker, server, or database crash under load | `resilience` |
| `scale` | Control plane load to failure: steps up offered load across server replicas until a level breaks, with per-subsystem metrics (run it through `scale.sh`) | `scale` |
| `compare` | Paired, significance-gated diff of two reports; exit 1 on regression | none (writes `-compare-` files) |
| `history` | Headline metrics per round with the net change and baselines | none (writes `-history.md`) |
| `stub` | Runs the stub dependency (the fake harness) on its own | none |
| `ci-gate` | The deterministic subset against `baselines/` | the five gate reports |
| `wait` | Waits for the server and `--nodes` Ready workers (used by the stack scripts) | none |

Exit codes are the same for every command: 0 success, 1 error, validation failure, or regression, 2 unknown command or bad usage, 3 incomplete run (some input failed to load, or a run was lost; the report opens with a bold banner and is not comparable), 130 cancelled with Ctrl+C.

### Examples

```bash
benchmarks/bench.sh validate
benchmarks/bench.sh ingest --label try1                                   # 440-document synthetic fleet
benchmarks/bench.sh ingest --dataset benchmarks/datasets/garrison-live.json --label try1
benchmarks/bench.sh routing --label try1
benchmarks/bench.sh e2e --repeat 5 --label try1                           # with the direct arm
benchmarks/bench.sh e2e --corpus e2e --limit 8 --label quick              # stratified sample of 8 probes
benchmarks/bench.sh load --arms garrison,direct --concurrency 1,4,8,16 --label try1
benchmarks/bench.sh load --mode open --rates 20,40,60,80 --label try1-open
benchmarks/bench.sh load --scale-workers 1,2,3 --concurrency 24 --delay-ms 100 --label try1-scale
benchmarks/bench.sh resilience --scenarios worker-kill,database-restart --label try1
benchmarks/bench.sh compare --baseline benchmarks/results/A.json --candidate benchmarks/results/B.json
benchmarks/bench.sh history --rounds R0=round0,R1=round1
benchmarks/bench.sh stub --harness-args format=claude,delay-ms=20 --repeat 10
benchmarks/run-baseline.sh round1 --shared-note "nothing else running"
```

Ingest at a larger scale: generate a bigger fleet outside the committed file, then ingest it.

```bash
benchmarks/bench.sh generate --kind synthetic --agents 2000 --out benchmarks/.run/synthetic-fleet-2000.json
benchmarks/bench.sh ingest --dataset benchmarks/.run/synthetic-fleet-2000.json --corpus fleet --batch-size 1000
```

### Options

| Option | Default | Used by | Meaning |
|---|---|---|---|
| `--url` | `http://127.0.0.1:37870` (`GARRISON_BENCH_URL`) | measuring commands | REST base URL |
| `--admin-key` | the bench key (`GARRISON_BENCH_ADMIN_KEY`) | measuring commands | System administrator API key; never written into a report |
| `--dataset` | `benchmarks/datasets/synthetic-fleet.json` | most | Dataset file (comma-separated for `validate`) |
| `--corpus` | the corpora whose `command` matches | ingest, routing, e2e, load, resilience | Corpus ids to run |
| `--label` | none | all reports | Round or variant label, part of the file name |
| `--seed` | 42 | all | Seed of every random choice (sampling, bootstrap) |
| `--resamples` | 2000 | all | Bootstrap resamples (100 to 100000) |
| `--repeat` | 3 for e2e, 1 for routing | routing, e2e | Repeats of every probe |
| `--limit` | all | routing, e2e | Stratified sample of this many probes, round-robin across probe types |
| `--warmup` | 2 for e2e | routing, e2e | Run probes executed once, untimed, before measuring |
| `--direct` | true for e2e | e2e | Run the direct-invocation reference arm |
| `--fake-harness` | the newest build | e2e, load, stub | Path of `garrison-fake-harness.dll` for the direct arm |
| `--stream` | true | routing, e2e | Follow each create-mode run's event stream and measure delivery latency |
| `--deterministic` | true for routing | routing, e2e, ingest | Mark the report deterministic, so `compare` treats any pass-to-fail flip as a regression and skips latency |
| `--poll-ms` | 100 | routing, e2e, ingest | Poll interval while following runs |
| `--batch-size` | 50 | ingest | Documents per apply |
| `--arms` | `garrison` | load | `garrison`, `direct`, or both |
| `--mode` | `closed` | load | `closed` (N clients) or `open` (fixed arrival rate, latency from the scheduled time) |
| `--concurrency` | `1,4,8,16` | load | Closed-loop levels |
| `--rates` | `1,2,4` | load | Open-loop arrivals per second |
| `--warmup-seconds`, `--duration-seconds` | 5, 20 | load | Untimed warmup and measured window per level |
| `--delay-ms` | 0 (load), 300 (resilience) | load, resilience | Fake harness pause between output chunks |
| `--scale-workers` | none | load | Worker counts to sweep (k3d: scales `statefulset/garrison-worker`) |
| `--scenarios` | all five | resilience | `harness-failure`, `harness-timeout`, `worker-kill`, `server-kill`, `database-restart` |
| `--fault-mode` | `crash` | resilience | `crash` sends SIGKILL to the container's process on the k3d node; `delete` force-deletes the pod (which lets it drain) |
| `--tolerance`, `--alpha` | 0.01, 0.05 | compare | Smallest pass-rate drop that counts, and the significance level |
| `--latency-tolerance`, `--throughput-tolerance` | 0.2, 0.1 | compare | Relative p95 increase and throughput drop that count |
| `--allow-partial`, `--no-latency` | off | compare | Compare different probe sets; skip latency and throughput |
| `--rounds`, `--kinds` | none | history | `R0=<label or UTC prefix>,...`; report kinds to include |
| `--update` | off | ci-gate | Write new baselines instead of comparing |
| `--shared-note` | none | all reports | What else ran on the machine; marks latency as indicative |
| `--require-pass` | off | measuring commands | Exit 1 when any probe failed |

Every option the run used, including defaults, is written into the report. The full list per command is in `src/Test.Benchmark/Runners`.

## Control plane load to failure (scale)

P10.13 ran at laptop size and was bound by worker slots, so the control plane's ceiling was unknown. The `scale` command (P14.15) finds it: it submits K runs per level at a rising offered rate, spread round robin across every server replica, and stops at the first level that breaks. `scale.sh` wraps the whole thing.

```bash
benchmarks/scale.sh smoke        # 1 server, 2 workers x 16 slots, 100 runs at 20/s: about 2 minutes with the build
benchmarks/scale.sh 1k           # 3 servers, 10 workers x 32 slots; 1,000 runs per level at 25, 50, 100, 200, 300, 400/s
benchmarks/scale.sh 10k          # the same stack; 10,000 runs per level at 50, 100, 200, 300, 400/s
benchmarks/scale.sh all          # both tiers on one stack
SCALE_RATES=50,100 SCALE_DURATION_MS=2000 benchmarks/scale.sh 1k --plateau-ratio 0.8
SCALE_KEEP_STACK=1 benchmarks/scale.sh smoke && SCALE_REUSE=1 benchmarks/scale.sh smoke --mode closed --concurrency 8,16
```

**The stack.** `scale-up.sh` starts PostgreSQL 17 in Docker as `garrison-scale-postgres` (volume `garrison-scale-pgdata`, port 37543, recreated empty on every start unless `SCALE_KEEP_DB=1`, memory capped at `SCALE_PG_MEMORY`, 3g by default, for the 8 GB Docker VM, `max_connections` = servers x pool + 40), then `SCALE_SERVERS` (3) servers and `SCALE_WORKERS` (10) workers with `SCALE_SLOTS` (32) slots each as processes from the Release build of the working tree, each with its own ports and node name. Server 1 creates the schema before the others start; worker n reports to server ((n - 1) mod servers) + 1. Each server's pool is `SCALE_DB_POOL` (50). Workers store every paced event (`SCALE_EVENT_COALESCE=0` turns worker text merging off so the configured event rate reaches the database; 2048 is the product default). `scale-down.sh` stops the processes and removes the container and its volume. Logs are in `benchmarks/.run/scale`.

**The workload.** `config/scale-workload.yaml` is applied into its own tenant. Each run executes the fake harness in its paced mode (`--events-per-second`, `--duration-ms`): `SCALE_EVENTS_PER_SECOND` (20) assistant text events over `SCALE_DURATION_MS` (1000) ms, then the answer. Slot capacity is slots divided by the run duration (320 runs/s for the default tier); levels near or above it are bound by workers, not the control plane, and the report says so.

**A level.** Open loop (the default) submits `--runs` runs at `--rates` per second without waiting (create, then follow nothing), so the load generator stays cheap; closed loop (`--mode closed --concurrency ...`) has C clients that each invoke and wait. The level then waits until every accepted run has finished (`garrison_runs_finished_total` summed over the replicas, up to `--drain-seconds`), reads the final run records, and scrapes `/metrics` on every replica.

| Measured per level | From |
|---|---|
| Runs/s: the rate at which successful runs completed, first completion to last | Run records |
| Events/s ingested and events per run | `garrison_run_events_total` |
| Claim latency (queued to leased) and end-to-end latency (created to completed), p50, p95, p99; control-plane overhead (end-to-end minus execution) | Run records |
| Submission latency and submission errors by kind (429 QueueFull, 503 DatabaseBusy, transport, client overload) | The load generator |
| Peak runs leased or running, peak queued | Run records |
| Event inserts: statements on `run_events` and their mean time, batches | `garrison_db_operation_duration_seconds{table="run_events"}`, `garrison_event_batch_size` |
| Queue wakeups by source (notify, handoff, pending, fallback poll) and wakeups per run (every source but the fallback poll); lease requests assigned versus empty | `garrison_scheduler_queue_wakeups_total`, `garrison_scheduler_lease_requests_total` |
| Lease renewals (renewed, lost) and expirations | `garrison_lease_renewals_total`, `garrison_lease_expirations_total` |
| Per-deployment concurrency lock: acquisitions, mean and total wait; claims won, lost, limited; lost claims per run | `garrison_scheduler_deployment_lock_wait_seconds`, `garrison_claims_total` |
| Authentication: statements per run on `tenants`, `users`, `credentials`, and `authsessions`; cache hits and misses (P10.24) | `garrison_db_operation_duration_seconds`, `garrison_auth_cache_lookups_total` |
| Database statements per run (I-12), by table; `request_history_headers` inserts per run (I-05); errors; peak connections | `garrison_db_*` |
| One-minute load average of the host | `sysctl vm.loadavg` or `/proc/loadavg` |

**Breaking.** A level breaks when its error rate (failed submissions, failed runs, and runs unfinished at the drain timeout, over everything submitted) is above `--max-error-rate` (0.01), its claim p95 is above `--max-claim-p95-ms` (5000), its end-to-end p95 is above `--max-e2e-p95-ms` (0 means the run duration plus 10 s), or its throughput plateaus: open loop below `--plateau-ratio` (0.9) of the offered rate, closed loop growing less than 1 minus that ratio over the previous level. The sweep stops at the first broken level (`--stop-on-break false` runs them all). The report gives the highest throughput of a level that held (the maximum sustained runs/s and its events/s), the breaking level and its reasons, and the saturated subsystem: the strongest of several heuristic signals that compare the level with the first one (worker capacity, load generator, API admission, database, event ingestion, deployment lock, lease renewals, scheduler). Read the evidence table rather than just the winner.

Other options: `--urls` (the replicas, comma-separated; `scale.sh` passes them), `--workload`, `--agent` (`scale-echo`), `--submit-concurrency` (512 submissions in flight before arrivals count as dropped), `--wait-seconds` (closed loop, 300), `--settle-seconds` (5 between levels), `--tier`, `--workspace-suffix`. Reports are `results/<time>-scale-scale-workload-scale-<tier>.json` and `.md`.

Everything shares one machine: servers, workers, every fake harness process (a `dotnet` start costs about 40 ms of CPU), PostgreSQL in the Docker VM, and the load generator. Run it on a quiet machine, stop other stacks if you can, and read the load average column.

## Datasets

| Dataset | Tier | Size | Probes | Split | License |
|---|---|---|---|---|---|
| `synthetic-fleet` | synthetic | 4 corpora: routing (20 items, 24 probes, 7 negative), e2e (28 items, 23 probes, 5 negative), load (7 items), fleet (440 items, 9 probes, 6 negative) | 56 (18 negative) | all | Part of this repository (MIT) |
| `garrison-live` | live, frozen 2026-10-11 | 2 corpora (live-ingest, live-e2e), each with the 15 shipped sample documents | 8 (4 negative) | all | Part of this repository (MIT) |

`datasets/SCHEMA.md` describes the format and how the files are built. The primary content/workflow datasets are synthetic: no public corpus measures this agent-harness control plane with an oracle and published scores. Optional arrival replay now supports a runtime-downloaded Azure Functions 2019 count window; see the conversion instructions below. Raw public datasets and prepared external arrival schedules stay outside version control. Source attribution, transformations and hashes are recorded with the experiment; external counts do not supply an agent-content correctness oracle. There are no local corpora either: Garrison does not ingest unstructured content.

After changing code on the load path (manifest apply), pass a new `--workspace-suffix` or let the corpus hash change, because a reused tenant only re-applies the same documents.

## CI gate

`ci-gate.sh` remains available locally. Automatic benchmark execution was removed on 2026-10-12 to conserve GitHub Actions minutes (see [CI policy](../docs/CI.md)). It starts the local stack, runs the deterministic subset, compares each report with its committed baseline, writes reports under `benchmarks/results/` and retains stack logs locally, and exits nonzero on any regression or incomplete run.

| Gate job | What has to hold |
|---|---|
| `validate` | Every committed dataset is valid |
| `routing synthetic-fleet` | Every placement, blocking, ordering, and validation probe keeps its result |
| `e2e synthetic-fleet` | Every run-flow probe keeps its result, in the Garrison arm and the direct arm |
| `ingest synthetic-fleet` | No document fails, re-apply stays all Unchanged, reachability stays 1.0, the invalid-document probes keep their result |
| `e2e garrison-live`, `ingest garrison-live` | The same on the shipped configuration |

The gate never looks at latency or throughput: those depend on the machine and are compared with `compare` on one machine. A probe that flips from pass to fail is a regression even though the pass rate barely moves, because deterministic probes have no noise to discount.

Parts that do not run in CI, and why:

| Part | Why not in CI | Where it runs | How often |
|---|---|---|---|
| k3d stack: scale-out, resilience, load on PostgreSQL | Needs Docker with about 4 GB and several minutes of wall time; numbers depend on the machine | The maintainer's machine (`RESULTS.md` names it) | Every round, and before a release |
| Latency and throughput comparison | Only meaningful on one machine | Same | Every round |

To change a baseline, run `benchmarks/ci-gate.sh --update` on a clean tree and commit the new `baselines/` files with the reason in the commit message. Committed baselines carry no machine name and no absolute paths.

## Reading results

Every run writes `results/<yyyyMMdd-HHmmss>-<kind>-<dataset>[-<label>].json` and `.md`. The Markdown opens with provenance (product commit with `-dirty` for any change including untracked files, harness commit, machine, image digests, dataset SHA-256, the full command line), then the summary per arm, timings, breakdowns by probe type and category, the server stage breakdown from `/metrics`, the baselines from `baselines.json`, the misses, and every option.

- **Pass rate** is the share of probe outcomes whose every expectation held. Errors count as failures and stay in the denominator. The interval is a 95% percentile bootstrap. Groups under 20 outcomes are marked indicative: read them as anecdotes.
- **overheadMs** (e2e) is the Garrison arm's client latency minus the direct arm's wall time for the same probe and repeat. **clientOverheadMs** (load) is client latency minus the worker's `executionMs`. **serverOverheadMs** is `totalMs` minus `executionMs`, from the server's own timestamps. `queueMs` is queued to leased: claim latency when there is no backlog, the backlog otherwise.
- **eventPersistMs** is when the server stored an event minus when the worker stamped it; **streamMs** is when the harness read an event from the SSE stream minus when the server stored it. Both compare two clocks; on k3d those are the Docker VM's and this machine's, so a few milliseconds either way are noise.
- **Throughput** counts successes over the time actually measured, including the drain. Its interval comes from per-second completion counts.
- The direct arm runs on the machine that runs the harness, not inside a worker container; on k3d that makes it a floor for the work, not for the container.
- A high error rate makes latency meaningless: look at failures by kind first.
- Compare numbers only on the same machine, and say in `RESULTS.md` when anything else was running.
- A report whose provenance says `-dirty` was produced from uncommitted code. For numbers that leave the team, run from a clean commit.

## Bursty arrival traces and timing experiments

`prepare-trace` converts an ordered `offsetMs,count` CSV into a finite arrival schedule. Offsets are milliseconds relative to the start of a measurement window, counts are nonnegative integers, and equal offsets retain a burst. Omitting count means one arrival. Inputs must be ordered, finite, and nonnegative. The command refuses more than one million arrivals and records the input SHA-256. It does not contact Garrison.

```bash
benchmarks/bench.sh prepare-trace --input benchmarks/traces/bursts.csv --output benchmarks/.run/bursts.json
benchmarks/bench.sh load --mode trace --trace benchmarks/.run/bursts.json --duration-seconds 5 --warmup-seconds 0 --max-in-flight 200
```

Use `--time-scale 0.1` during preparation to compress source time by ten. The loader validates the prepared file again. Trace mode sends the schedule once per arm; it does not loop it or add jitter. Offsets at or beyond `--duration-seconds` are omitted. If warmup is enabled, it replays the prefix independently before measurement. Reports include both source and prepared-file hashes, the supplied duration, average offered rate, and failure counts, including client-side in-flight drops. Latency starts at the scheduled arrival, so a stalled load generator does not hide queuing. The committed burst fixture is synthetic, not an Azure trace. To use an external invocation trace, first extract the selected function/window into this CSV contract and retain its source information with the prepared artifact.

`benchmarks/timing-sweep.sh` starts seven fresh private local benchmark stacks and changes one timing dimension at a time: lease long polls of 1, 5, and 20 seconds, worker flush intervals of 25, 100, and 250 milliseconds, and server event polls of 50, 100, and 250 milliseconds. The common baseline is 20 seconds, 250 milliseconds, and 250 milliseconds. It refuses to start if the local benchmark port is already occupied. The script records the exact settings with each arm, stops its own processes on exit, and does not touch Compose or the scale stack.

Each point runs closed-loop load and a short streaming e2e arm, because event polling affects subscribers rather than synchronous invocation completion. Configure `TIMING_DURATION_SECONDS`, `TIMING_WARMUP_SECONDS`, `TIMING_CONCURRENCY`, and `TIMING_STREAM_REPEAT`; set `TIMING_STREAM_PROBES=0` to omit stream probes. `BENCH_EVENT_FLUSH_MS` and `BENCH_LEASE_WAIT_MS` also configure workers started by the local and scale stack scripts, using private generated worker settings files.

Load reports include database statement and request-history header insert deltas per successful run. These are explicitly estimates: they include background and failed-run work during the window, and require scraping the same server before and after. They support I-05 remeasurement; they do not implement exact I-12 per-run database attribution. Keep concurrent traffic absent, record the machine and stack, and compare repeated runs before treating a change as an improvement.

## Tenant queue fairness

`fairness` provisions one noisy and two quiet equal-weight tenant workspaces from the load corpus, interleaves 100 noisy submissions for each submission from each quiet tenant, waits for every run, and records per-tenant server `queueMs` distributions. It exits nonzero if any run fails or a quiet tenant's p95 exceeds `--max-quiet-p95-ms` (default 10000). This is a finite workload and a declared experiment target, not a universal production guarantee.

```bash
benchmarks/bench.sh fairness --url http://127.0.0.1:37800 --stack local --quiet-runs 10 --noisy-multiplier 100 --max-quiet-p95-ms 10000
# A larger sample across replicas sharing the same database:
benchmarks/bench.sh fairness --url http://127.0.0.1:37901 --urls http://127.0.0.1:37901,http://127.0.0.1:37902 --quiet-runs 30 --max-connections 4096 --max-quiet-p95-ms 10000
```

The command refuses a connection budget smaller than the total outstanding requests; otherwise a client-side connection queue could hide quiet tenants until noisy work had drained. For a multi-replica experiment, distribute workers across the replicas too. Reports retain individual run IDs, failures, queue times, client latencies, endpoint configuration, and the exact threshold. Use more than the default ten quiet runs when estimating a release acceptance percentile, and report the sample count with it. Workspaces remain for inspection, as with the other benchmark commands.

Fairness admission defaults to `wait=false`, followed by paginated bulk completion reads per tenant. This keeps the queue experiment from creating a synchronous HTTP waiter per queued run. `admissionMs` and `leaseToStartedMs` are retained separately. Set `--wait-invoke true` to stress synchronous waiter behavior deliberately; this can expose a separate control-plane bottleneck and its results must remain labelled accordingly. The initial 2026-10-15 shared-host SQLite experiment used 1020 synchronous waiters: every run succeeded, but quiet-tenant queue p95 was approximately 26.8 seconds and failed the declared ten-second target. That failure remains evidence rather than a passed fairness acceptance test.

### Workspace cache probe

Run `benchmarks/workspace-cache.sh [output.json] [files] [bytes-per-file]` on macOS or Linux with .NET 10, Python 3, and git. The default deterministic fixture has 10,000 files and 81.92 MB of file content. The standalone probe calls production `WorkspacePreparer` and `WorkspaceSnapshot`; it does not add product references to the black-box benchmark application. It compares uncached clone, cold and warm git mirrors, and prepared-snapshot restoration, verifies the complete generated work tree SHA-256, and removes its temporary repository and build files.

The transport is local `git-upload-pack` through an SSH command shim. Received pack bytes are captured with `GIT_TRACE_PACKFILE`; they represent git payload, not encrypted wire overhead or physical network latency. Snapshot bytes are the actual ZIP size. Run repeated randomized arms on dedicated hardware before drawing latency conclusions. A prepared snapshot includes the git database as well as the checked-out files and can transfer more bytes than a clone.

For bounded real network acceptance, run `benchmarks/workspace-cache-network.sh [output.json] [files=512] [bytes-per-file=8192] [rounds=3] [response-delay-ms=25] [MiB-per-second=16]`. This uses a disposable HTTPS smart Git server over loopback TCP/TLS, a probe-only ephemeral CA, controlled response delay and per-connection body pacing. Each round checks uncached/cold/warm preparation, actual request/response body and Git pack bytes, prepared snapshot capture/HTTPS transfer/restore, and complete work-tree file/mode identity. Requirements additionally include OpenSSL and curl. See [D063 cache acceptance](../docs/testing/D063_CACHE.md) for the measured small-scale results and limits.

### Exact scoped database attribution

Add `--database-attribution true` to `load` to retrieve each successful run's `database-usage` after the timed window. The report separates exact scoped statement/read/write attempts from server-wide estimated costs and reports missing completion scopes. Collection does not contribute to the measured latency or throughput window. Shared scans, candidate eligibility prechecks before atomic claim, maintenance, history writes, telemetry persistence and unflushed work lost to process failure remain outside these per-run counts.

Accepted `202` invocation fallbacks are followed to a terminal run by polling; full arrival-to-completion time remains in latency. A synchronous-wait admission fallback is not a failed run.

### Paired request-history cost

On a disposable scale stack, `NO_BUILD=1 benchmarks/request-history-ablation.sh` uses a seeded initial A/B choice and counterbalanced ABBA arms (seed 42 selects off/on/on/off) at concurrency 16, with five seconds of warmup and thirty seconds of measurement per arm. It uses `benchmarks/.run/scale/fairness-dataset.json` and the scale worker lane, reports database deltas, and restores the original `RequestHistory.Enabled` value even on failure. Set `BENCH_HISTORY_URL`, `BENCH_HISTORY_DATASET`, `BENCH_HISTORY_LANE`, `BENCH_HISTORY_DETAILS`, or duration/warmup environment variables to describe another private fixture. The script accepts only the documented loopback benchmark endpoints. Treat database deltas as whole-server estimates; background operations and history capture are outside exact run lifecycle attribution.

Attribution collection has one shared flush grace and a global time budget: `--database-attribution-seconds` defaults to 10 seconds (range 1 to 300). Runs unobserved when the budget expires are reported as missing rather than extending the measured window or waiting separately for every run.

### Repeated randomized timing ablations

`timing-sweep.sh` preserves its default single round in fixed arm order. Set `TIMING_REPEAT` and `TIMING_RANDOM_SEED` to repeat complete seven-arm rounds in a reproducible randomized order. Each arm still starts a fresh private SQLite stack; no production settings change. `TIMING_PLAN_ONLY=1` writes/prints the schedule without starting a stack.

```bash
TIMING_REPEAT=2 TIMING_RANDOM_SEED=62026 \
TIMING_DURATION_SECONDS=25 TIMING_WARMUP_SECONDS=5 TIMING_CONCURRENCY=16 \
TIMING_STREAM_PROBES=0 \
TIMING_MANIFEST=benchmarks/evidence/d062/timing-repeated/manifest.json \
TIMING_RESULTS_DIR=benchmarks/evidence/d062/timing-repeated \
  benchmarks/timing-sweep.sh
```

The JSON manifest and companion TSV retain explicit trial/order, seed, Python version, exact timing settings, before/after host load averages and report hashes. Each load report also carries trial/order/seed and settings in its stack details. If CLI arguments override environment settings, the report's recorded options are authoritative. Stream probes retain the existing default; disable them explicitly when isolating load-window replications. Coordinate with other benchmark owners before the run; randomizing order does not remove shared-host interference or prove causality.

### Native Azure Functions invocation traces

`import-azure-function-trace.py` reads the native Azure Functions 2019 CSV schema (`HashOwner,HashApp,HashFunction,Trigger,1,...,1440`) and extracts a selected one-based data row and minute window. It validates the schema, row/window bounds, unsigned counts and the benchmark's one-million-arrival limit before writing output.

```bash
python3 benchmarks/import-azure-function-trace.py --input /path/to/invocations_per_function_md.anon.d01.csv --output /tmp/azure-arrivals.csv --row 53 --first-minute 781 --minute-count 60 --provenance /tmp/azure-conversion.json
benchmarks/bench.sh prepare-trace --input /tmp/azure-arrivals.csv --output /tmp/azure-trace.json
benchmarks/bench.sh load --url http://127.0.0.1:37800 --stack local --mode trace --trace /tmp/azure-trace.json --duration-seconds 60 --warmup-seconds 0 --max-in-flight 512 --database-attribution true
```

The default `--bin-ms 1000` turns each source minute's aggregate into a simultaneous burst at one-second boundaries, compressing source time by 60x. Unknown subminute arrival times are not reconstructed. Use `--bin-ms 60000` to retain minute spacing and enlarge the replay duration accordingly. This converter does not download the dataset. Preserve its official source, license, attribution, selected row/window, archive hash, input-file hash and converted hash with the report. Keep downloaded source rows and temporary derived schedules outside the repository; the D062 example retains only benchmark reports and provenance under `benchmarks/evidence/d062/`.
