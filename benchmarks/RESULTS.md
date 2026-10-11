# Benchmark results

Round 0 is the first honest run of the suite, and it did what round 0 usually does: it found defects before it found anything worth publishing. Garrison's scheduling and run flow are correct in every probe the suite has (52 of 52 routing and run-flow probes, 108 of 108 outcomes with repeats), its per-run overhead is small (about 18 ms at the median over invoking the same harness directly), and it scales out nearly linearly. It does not degrade gracefully past its capacity: an open-loop load just above what two workers can serve exhausted PostgreSQL's connections, failed requests with `500 InternalError`, and got the only server replica killed by its own liveness probe. A database restart turns some API errors into HTML pages. Those are the first things to fix (`IMPROVEMENTS.md`).

## Hardware and environment

| | |
|---|---|
| Machine | Apple M5 Max, 18 cores, 128 GB, macOS 26.6 |
| Docker | Docker Desktop VM with 18 CPUs and 7.7 GB of memory |
| Stack | k3d cluster `garrison-bench` (rancher/k3s:v1.31.4-k3s1, node capped at 3 GB): 1 server on PostgreSQL 17 (`postgres:17`, `sha256:a470461d...`), 2 workers on lane alpha and 1 on lane beta, 4 slots each; images built from the working tree (`garrison-server:bench-local` `sha256:82e58198...`, `garrison-worker:bench-local` `sha256:dfa94b4d...`) |
| Product | Commit `23c4da9`, dirty: 349 changed or untracked paths, including two other agents' in-progress work (G-22 Codex login refresh and P13.20 to P13.28 telemetry) |
| Harness | `Garrison.Benchmark` 1.0.0, uncommitted |
| Models and paid services | None: the fake harness only |
| Shared during the runs | The `garrison-k3s` cluster (about 3 GB) and three database containers in the same Docker VM, and two other agents editing and building in this working tree. **Every latency and throughput number in round 0 is indicative.** |

## Round 0 (label `round0`, 2026-10-11)

Run with `benchmarks/run-baseline.sh round0 --shared-note "..."` on the k3d stack, after `stack-up.sh` rebuilt the images. Reports (git-ignored, in `benchmarks/results/`): `20261011-162523-ingest-synthetic-fleet-round0`, `20261011-162527-ingest-garrison-live-round0`, `20261011-162527-routing-synthetic-fleet-round0`, `20261011-162548-e2e-synthetic-fleet-round0`, `20261011-162620-e2e-garrison-live-round0`, `20261011-162622-load-synthetic-fleet-round0`, `20261011-162948-load-synthetic-fleet-round0-open`, `20261011-163308-load-synthetic-fleet-round0-scale`, `20261011-163448-resilience-synthetic-fleet-round0`, and the history `20261011-164146-history.md`. Follow-up runs that reproduced the overload failure: `...-load-synthetic-fleet-repro-open60` and `...-repro-open70`.

### Correctness

| Report | Garrison arm | Direct arm |
|---|---|---|
| routing, synthetic-fleet | 24 of 24, pass rate 1.000 [1.000, 1.000] | |
| e2e, synthetic-fleet (3 repeats) | 69 of 69, 1.000 [1.000, 1.000] | 45 of 45, 1.000 [1.000, 1.000] |
| e2e, garrison-live (3 repeats) | 15 of 15, 1.000 (indicative) | 6 of 6, 1.000 (indicative) |
| ingest, synthetic-fleet | 9 of 9 apply and reachability probes; 440 of 440 documents created, 0 failed | |
| ingest, garrison-live | 3 of 3; 15 of 15 documents | |
| resilience | 4 of 5 scenarios (database-restart failed) | |

Every probe type passed, including the hard ones: placement on node selectors and weight-0 deployments, runs no worker can take (`NoMatchingPool`, `NoCapableWorker`), a profile whose executable is missing (`Failed/NotInstalled`), priority ordering, the `maxConcurrentRuns: 1` limit, request validation (`ParameterNotAllowed`, `ParameterInvalid`, `NoActiveDeployment`), every output parser (Claude, Codex, Mux, plain), 200-character truncation of a 45,000-character input, structured output with and without repair, harness failure, deadlines, cancellation in about 32 ms, idempotent creation, and tenant isolation. The direct arm produced the same result text as Garrison for every probe it covers, which checks the reference arm against the product.

### Overhead and latency (e2e, synthetic-fleet, no backlog)

| Measure | p50 [95% CI] | p95 [95% CI] |
|---|---|---|
| Garrison minus direct, paired (overheadMs, n 45) | 17.7 ms [16.2, 21.0] | 49.3 ms [29.0, 171.4] |
| Claim latency (queueMs, n 60) | 2 ms [2, 2] | 9 ms [3, 14] |
| totalMs minus executionMs (serverOverheadMs) | 23 ms [21, 24] | 44 ms [37, 76] |
| Event stored after the worker stamped it (eventPersistMs, n 57 runs) | 10.7 ms [10.3, 10.9] | 208.3 ms [93.4, 222.6] |
| SSE delivery after storage (streamMs, n 6 runs, indicative) | 15.7 ms [15.2, 15.8] | 15.9 ms |
| Cancel to `Cancelled` (n 3, indicative) | 31.6 ms | 35.0 ms |

### Load, closed loop (2 workers, 8 slots, fake harness with no delay)

| Arm | Clients | Throughput, ops/s [95% CI] | p50 / p95 (ms) | queue p50 (ms) | clientOverheadMs p50 / p95 |
|---|---|---|---|---|---|
| garrison | 1 | 9.74 [7.95, 10.38] | 91 / 200 | 2 | 30 / 90 |
| garrison | 4 | 39.39 [33.86, 40.05] | 100 / 117 | 3 | 37 / 51 |
| garrison | 8 | 59.31 [51.38, 60.43] | 130 / 171 | 5 | 55 / 89 |
| garrison | 16 | 58.68 [51.43, 59.86] | 267 / 321 | 131 | 187 / 241 |
| direct | 1 | 12.31 [10.57, 12.48] | 81 / 90 | | |
| direct | 4 | 46.37 [40.00, 46.86] | 86 / 96 | | |
| direct | 8 | 85.45 [73.76, 86.00] | 93 / 103 | | |
| direct | 16 | 93.54 [81.24, 95.19] | 169 / 217 | | |

Garrison's ceiling is the 8 slots: at 16 clients the extra 8 wait in the queue (queue p50 131 ms). The direct arm on the host machine reached 93 ops/s, so CPU was not the limit.

### Load, open loop (2 workers, 8 slots)

| Rate | Started | Succeeded | Failed | Throughput (ops/s) | p50 / p95 (ms) |
|---|---|---|---|---|---|
| 20/s | 400 | 400 | 0 | 19.93 | 123 / 184 |
| 40/s | 800 | 800 | 0 | 39.75 | 144 / 224 |
| 60/s | 1200 | 996 | **204** (203 `500 InternalError`, 1 HTML 500) | 10.83 | 70,607 / 72,893 |
| 80/s | 1600 | 1600 | 0 | 41.60 | 11,132 / 18,061 |

At 60/s, just above the closed-loop ceiling of 59/s, completions stopped for about 50 seconds. The repro run (`repro-open70`, 70/s then 90/s, with logs captured) showed why: the backlog of waiting invocations exhausted PostgreSQL's connections (`53300: sorry, too many clients already`), invokes failed with `500 InternalError`, the liveness probe `GET /health/live` timed out after 4 s twice, and the kubelet restarted the only server replica; its in-flight waits ended with 202 as they drain, and the new replica leased the 1,496 queued runs within a minute. The 80/s level of round 0 ran after the restart and did not hit the limit again in its window. See defects D-4 and D-5.

### Scale-out (closed loop, 24 clients, runs of about 265 ms)

| Workers | Slots | Throughput, ops/s [95% CI] | Ratio to 1 worker | p50 latency (ms) |
|---|---|---|---|---|
| 1 | 4 | 13.39 [12.68, 13.68] | 1.00 | 1763 |
| 2 | 8 | 25.90 [24.71, 26.67] | 1.93 | 908 |
| 3 | 12 | 35.61 [33.00, 36.62] | 2.66 | 650 |

### Load path

| | synthetic-fleet (440 documents, batches of 50) | 2000-agent fleet (4040 documents, dev runs) |
|---|---|---|
| Documents per second | 402 | 363 (batches of 100), 420 (1000), 471 (one apply of 4040) |
| Apply latency p50 / p95 | 90 / 229 ms per batch | 8.6 s for the single 4040-document apply |
| Re-apply | 100% Unchanged, p50 94 ms per batch | 100% Unchanged, 10.6 s for the single apply (slower than creating) |
| Dry run of everything | 394 ms | 2.3 s |
| Reachability | 200 of 200 | 2000 of 2000 |

### Resilience

| Scenario | Result | Runs | Lost | Duplicates | Client errors | Unclean | Recovery |
|---|---|---|---|---|---|---|---|
| harness-failure | pass | 10 | 0 | 0 | 0 | 0 | all `Failed/HarnessFailed` |
| harness-timeout | pass | 3 | 0 | 0 | 0 | 0 | all `TimedOut` |
| worker-kill (SIGKILL) | pass | 71 | 0 | 0 | 0 | 0 | 2 runs requeued; the last finished 31.3 s after the kill (the 30 s lease) |
| server-kill (SIGKILL, 1 replica) | pass | 86 | 0 | 0 | 20 transport errors while it restarted | 0 | 6.1 s |
| database-restart (SIGKILL) | **FAIL** | 72 | 0 | 0 | 18 | **18 HTML 500 pages** | 3.7 s |

No run was lost or duplicated in any scenario; creations retried with the same idempotency key always converged on one run.

### Hypotheses

| ID | Verdict | Evidence |
|---|---|---|
| H1 claim latency and throughput | Latency confirmed; throughput partly | queueMs p50 2 to 5 ms and p95 7 to 21 ms with idle slots (target 50 and 200). With a backlog, 58.7 ops/s against about 69 that 8 slots allow at the measured slot time (exec 78 ms plus the worker's own steps), 85%; at 8 clients 80% |
| H2 overhead under 150 ms | Confirmed | 17.7 ms paired p50, 30 ms clientOverheadMs p50 at one client; SCALING.md's 140 to 230 ms is not reproduced (it measured three replicas and backlogged runs) |
| H3 event latency | Confirmed | eventPersistMs p95 208 ms (target 300); SSE delivery 16 ms (target 1 s, indicative) |
| H4 scale-out | Confirmed | 1.93x and 2.66x (targets 1.8x and 2.6x) |
| H5 correctness under failure | **Refuted** | All probes pass and nothing was lost, but D-1 (HTML errors during a database restart), and past capacity D-4 and D-5 (connection exhaustion, then a liveness restart) |
| H6 load path | Confirmed | 440 documents in about 1.1 s of apply time; 4040 in one 8.6 s request; re-apply all Unchanged; reachability 1.0 |

### History

From `Garrison.Benchmark history --rounds R0=round0` (headline rows only; the full table with every probe type is in `benchmarks/results/20261011-164146-history.md`).

| Report | Metric | R0 | Baseline (source) | Net |
|---|---|---|---|---|
| e2e/synthetic-fleet | garrison.passRate | 1 | none published | |
| e2e/synthetic-fleet | garrison.overheadMs.p50 | 17.681 | | |
| e2e/synthetic-fleet | garrison.queueMs.p50 | 2 | 39 (docs/SCALING.md, internal) | -37 |
| e2e/synthetic-fleet | garrison.serverOverheadMs.p50 | 23 | 140 (docs/SCALING.md, internal) | -117 |
| e2e/garrison-live | garrison.overheadMs.p50 | 16.139 | none published | |
| routing/synthetic-fleet | garrison.passRate | 1 | none published | |
| load/synthetic-fleet | load.garrison.closed.peakThroughput | 59.31 | none published | |
| load/synthetic-fleet | load.direct.closed.peakThroughput | 93.54 | | |
| load/synthetic-fleet | load.garrison.closed.w2-c1.queueMs.p50 | 2 | 39 (docs/SCALING.md, internal) | -37 |
| ingest/synthetic-fleet | ingest.documentsPerSecond | 402.2 | none published | |
| resilience/synthetic-fleet | resilience.database-restart.passed | 0 | | |

There is one round so far, so there is no net change between rounds yet.

## Defects found by the benchmarks

None is fixed yet: the suite was built under an instruction not to change product code. Each has an entry in `IMPROVEMENTS.md`.

| ID | Defect | Where | Found by |
|---|---|---|---|
| D-1 | During a database outage, API calls answer `500` with Watson's HTML page (`It's me, not you`) instead of a JSON error, because the administrator tenant check and the authorization decision read the database outside the route's exception mapping. A database outage should be a JSON 503 | `src/Garrison.Server/Routes/RouteRegistrar.cs` lines 119 (`AuthorizeAsync`), 183 and 222 (`TenantMissingAsync`), mapping in `InvokeAsync` at 248 | resilience `database-restart`: 18 HTML responses in round 0, 4 and 12 in development runs |
| D-2 | Every run is counted as a server error: the worker abandons its cancellation watch long poll whenever its held runs change, and the request metrics record the abandoned request with the default status 500 (`status_class="5xx"`), one per run | `src/Garrison.Server/Services/RequestTelemetry.cs` line 91 (in-progress P13.22 work); the worker side is `src/Garrison.Worker/Protocol/NodeProtocolClient.cs` line 128 | stage breakdown of every load level: watch 5xx count equals runs |
| D-3 | An invalid enum value in a manifest spec returns the serializer's message with internal type names and byte positions (`...could not be converted to Garrison.Core.Enums.SecretKindEnum. Path: $.kind | LineNumber: 0 | BytePositionInLine: 17.`) | `src/Garrison.Core/Manifests/ManifestService.cs` line 606 | live dataset build (`kind: Generic` instead of `GenericEnv`) |
| D-4 | The shipped database pool (`Database.MaxPoolSize` 100) is as large as the shipped PostgreSQL's `max_connections` (the default 100, less 3 reserved), so one replica under a backlog of waiting invocations runs PostgreSQL out of connections (`53300: sorry, too many clients already`) and invokes fail with `500 InternalError`. `docs/SCALING.md` itself says to keep `replicas x (MaxPoolSize + 2)` below `max_connections`; the scale tests in `k8s/tests` only pass because their overlay raises `max_connections` to 300 and lowers the pool to 40 | `k8s/base/config/garrison.json` line 15; `k8s/components/postgres/postgres.yaml` (no `max_connections`) | open-loop load at 60/s (round 0) and 90/s (repro) |
| D-5 | Under overload the liveness probe (`/v1.0/api/health/live`, 4 s timeout, 2 failures) stops answering in time and the kubelet restarts the only server, turning overload into an outage and ending every waiting invocation | `k8s/base/server-deployment.yaml` lines 180 to 186; the probe timed out while the API was saturated | open-loop load at 90/s (repro): pod restarted with reason "failed liveness probe" |

Not defects, but recorded so nobody chases them: out-of-range values such as `maxAttempts: 99` are clamped to the documented range by both REST and manifests (the first version of a probe expected a 400, and the probe was wrong); a manifest apply that fails answers 400 with the `ManifestApply` body rather than the common error shape, as `docs/MANIFESTS.md` documents.

## Environment notes

- The machine was shared (see above). The other agents' builds and the `garrison-k3s` cluster competed for the same CPUs and Docker VM memory.
- On k3d, the harness runs on macOS while the server and workers run in the Docker VM, so eventPersistMs and streamMs compare two clocks. Differences of a few milliseconds are noise; on the local stack they share one clock.
- The direct arm runs `dotnet garrison-fake-harness.dll` on macOS; the Garrison arm's harness runs in a Linux container. The direct arm's startup is about 20 ms slower than the container's executionMs, which makes the paired overhead slightly smaller than the container-fair clientOverheadMs (30 ms at p50 with one client).
- The server-kill scenario restarts the single replica; with two replicas the clients would fail over instead. The suite's default is one replica so the stage breakdown is clean.
- A scale-down leaves the removed worker's node row `Offline`, and in round 0 one such row still showed `activeRuns: 1` after its run had finished elsewhere. Not investigated further.

## Known weaknesses of the suite

- One machine, shared during round 0; no number here should leave the team without a rerun on a quiet machine.
- Probes are hand-written against the documentation, and their oracles are mostly exact checks on the fake harness. They test what Garrison does with a harness, not how real harnesses behave.
- The stage breakdown diffs server-wide counters, so background work (heartbeats, long polls) is mixed into per-level numbers, and with several replicas a scrape reaches only one of them.
- Closed-loop load hides stalls; round 0's open-loop levels are what exposed D-4 and D-5. The open-loop rates are fixed, not bursty (IMPROVEMENTS.md I-10).
- No public dataset and no published baseline exists for this kind of system; the only baselines are Garrison's own earlier numbers, measured on a different topology.
- The CI gate runs on the local stack (Sqlite, processes), so it cannot catch PostgreSQL- or Kubernetes-specific regressions; those need a round on the k3d stack.
