# Garrison benchmarks

This directory holds everything about the benchmark suite except the harness code, which is `src/Test.Benchmark` (assembly and process `Garrison.Benchmark`). The plan, hypotheses, and metric definitions are in `BENCHMARKING.md` at the repository root; the curated numbers are in `RESULTS.md` here; the fixes the numbers point to are in `IMPROVEMENTS.md` at the root.

The harness talks to Garrison only over the REST API, as a client would, with its own typed client. It never references a product assembly or reads the database. Every run uses the fake harness (`src/Garrison.FakeHarness`), so the suite costs no tokens, needs no credentials, and measures Garrison rather than a model.

## Contents

| Path | What it is |
|---|---|
| `bench.sh`, `bench.bat` | Build the harness in Release and run one command against the stack chosen by `BENCH_STACK` |
| `stack-up.sh`, `stack-up.bat` | Create the isolated K3S-in-Docker stack (k3d cluster `garrison-bench`) from the working tree |
| `stack-down.sh`, `stack-down.bat` | Delete that cluster (the full reset) |
| `start-bench-server.sh`, `.bat` | Start the local stack: the server and workers as processes from the working tree |
| `stop-bench-server.sh`, `.bat` | Stop the local stack |
| `run-baseline.sh`, `.bat` | The standard suite for one round |
| `ci-gate.sh`, `.bat` | The deterministic gate against `baselines/`; what CI runs |
| `common.sh`, `common.bat` | Shared settings for the scripts (ports, paths, build) |
| `k3d/cluster.yaml` | The k3d cluster: pinned K3S image, ports, memory cap |
| `k8s/` | Kustomize overlay on `k8s/base` for the bench cluster: two worker lanes, small requests, fake credentials |
| `config/garrison-bench.json` | Server settings of the local stack, copied fresh into `.run/` on every start |
| `datasets/` | Datasets, `SCHEMA.md`, and the sources and build scripts that produce them |
| `baselines/` | Committed reports the CI gate compares against (`ci-<kind>-<dataset>.json` and `.md`) |
| `baselines.json` | Published or prior results shown next to every report |
| `RESULTS.md` | Curated results, round by round, with the defects found |
| `results/` | Per-run reports (git-ignored except `.gitkeep`) |
| `.run/` | Git-ignored scratch: builds, the local stack, logs, the bench kubeconfig |
| `data/` | Git-ignored: downloaded public datasets (none are used yet) |

There is no `labels/` directory: no probe is judged by a model, so there is nothing to calibrate. There is no `agent/` directory: the suite does not run agents in the loop.

## The two stacks

| | k3d stack (`stack-up.sh`) | local stack (`start-bench-server.sh`) |
|---|---|---|
| What runs | K3S v1.31.4 in Docker (k3d), the shipped Kustomize base with in-cluster PostgreSQL 17, 1 server, 2 workers on lane `alpha` and 1 on lane `beta`, 4 slots each | `Garrison.Server` (Release, Sqlite) and worker processes (1 alpha, 1 beta, 4 slots each) from the working tree |
| Images | Built from the working tree as `jchristn77/garrison-{server,worker}:bench-local`; `postgres:17`, `busybox:1.36`, `curlimages/curl:8.10.1` as the base pins them | None |
| URL | `http://127.0.0.1:37870` (MCP 37871, Kubernetes API 37443) | `http://127.0.0.1:37800` (MCP 37801, Prometheus 37464, worker health 37811 and up, worker metrics 37821 and up) |
| Use it for | Rounds: everything, including scale-out and resilience | The CI gate and quick checks |

Both stacks run only the fake harness. On the local stack the workers' `PATH` is a directory with the fake harness wrapper plus the system directories, so a `claude` or `codex` installed on your machine is never found. Both use obviously fake credentials (admin API key `garrison-benchmark-admin-key-not-for-production`).

### Ports

The suite uses the 37xxx block, bound to 127.0.0.1 only. Other stacks on the maintainer's machine use 8700 to 8710 (Docker Compose), 6560 and 18870 (`k8s/tests`), 16443 and 18080 (a `garrison-k3s` cluster), 3000 and 9090 (Grafana and Prometheus port-forwards). Pick a different block for the next project.

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

## Datasets

| Dataset | Tier | Size | Probes | Split | License |
|---|---|---|---|---|---|
| `synthetic-fleet` | synthetic | 4 corpora: routing (20 items, 24 probes, 7 negative), e2e (28 items, 23 probes, 5 negative), load (7 items), fleet (440 items, 9 probes, 6 negative) | 56 (18 negative) | all | Part of this repository (MIT) |
| `garrison-live` | live, frozen 2026-10-11 | 2 corpora (live-ingest, live-e2e), each with the 15 shipped sample documents | 8 (4 negative) | all | Part of this repository (MIT) |

`datasets/SCHEMA.md` describes the format and how the files are built. No public dataset is used: none measures an agent-harness control plane with an oracle and published scores (`BENCHMARKING.md`, Datasets, says why the cluster traces that exist do not fit yet). If a public trace is added later, it is downloaded at run time into `data/` and never committed; check licenses upstream before publishing anything derived from these datasets. There are no local corpora either: Garrison does not ingest unstructured content.

After changing code on the load path (manifest apply), pass a new `--workspace-suffix` or let the corpus hash change, because a reused tenant only re-applies the same documents.

## CI gate

`ci-gate.sh` is what `.github/workflows/benchmark.yaml` runs on every push to every branch and every pull request, on `ubuntu-latest`. It starts the local stack, runs the deterministic subset, compares each report with its committed baseline, uploads `benchmarks/results/` and the stack logs as an artifact (also when it fails), and fails the build on any regression or incomplete run.

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
