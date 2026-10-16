# D062 scale and distributed recovery validation

Evidence retains the D061 directory and filenames used when execution began; this report reconciles those runs for the D062 scope decision.

These are measurements from the uncommitted working tree on the existing shared Apple M5 Max host. Original Garrison Compose services and unrelated applications remained running. The private benchmark PostgreSQL database, processes and Kubernetes cluster were isolated from original application data. They are experimental measurements, not universal release SLOs.

## Sustained timing sweep

Seven fresh private SQLite stacks each ran five seconds of warmup, 30 seconds of closed-loop load at concurrency 16, then 12 end-to-end probes with stream mode enabled. All 4,978 measured load calls and 84 end-to-end probes succeeded. The end-to-end set includes Codex parsing, cancellation, tenant isolation, and create/wait behavior; it is not 84 independent streaming-only probes. The seven arms retain their exact settings and provenance in `benchmarks/evidence/d061/timing/`.

| Arm | Successes | Throughput/s | Client p95 ms |
| --- | ---: | ---: | ---: |
| Baseline | 1121 | 36.89 | 476 |
| Lease wait 1 second | 756 | 24.85 | 934 |
| Lease wait 5 seconds | 821 | 26.98 | 806 |
| Worker flush 25 ms | 672 | 21.56 | 935 |
| Worker flush 100 ms | 464 | 14.94 | 1797 |
| Server event poll 50 ms | 838 | 27.22 | 941 |
| Server event poll 100 ms | 306 | 9.63 | 2618 |

Other work overlapped this sequential sweep, so arm order and host load are confounded. Do not interpret this table as causal tuning evidence or change product defaults from it. The experiment demonstrates sustained execution of each timing configuration; randomized dedicated-host comparisons remain appropriate for selecting defaults.

## Multi-replica fairness and larger load

Three control-plane processes shared PostgreSQL 17 and six workers with 16 slots each. The finite fairness experiment submitted 3,000 noisy-tenant runs and 30 runs for each of two quiet tenants. All 3,060 succeeded. Quiet queue p95 was 6,563 ms and 6,624 ms, both below the experiment's 10-second target. `multi-replica-fairness.sh` reproduces the worker-lane adaptation without changing the committed source dataset.

The 1,000-run tiers showed the saturation boundary: 25/s completed all 1,000 at 25.0/s, claim p95 56 ms and end-to-end p95 1,327 ms. At 50/s, all 1,000 still succeeded, but throughput was 30.6/s and claim p95 11,070 ms, exceeding the experiment target. This failed level is retained rather than treated as passing acceptance.

## Gateway and recovery

The external mutation fixture passed all 12 cases: the prior nine worker-process-loss cases plus rolling control-plane process replacement after a committed effect for each of AtMostOnce, Journaled and AtLeastOnce. Receipts prove effect counts and attempts. Replacement uses Kubernetes rollout semantics; it does not prove a simultaneous outage of every control-plane replica. Separate TCP/HTTP fault cases exercise endpoint unavailability. The disposable Kubernetes cluster was deleted after execution.

The paired gateway experiment completed 210 journal operations (200 measured, 10 warmup). Full MCP child-admission positive-difference p99 was 125.16 ms. Gateway-owned instrumentation, excluding awaited tool dispatch, observed 420 combined operator/run calls with mean 6.97 ms and histogram p99 upper bound 50 ms. These combined-mode observations precede the later bounded `mode=run/operator` metric label. They are not a fenced-only exact sample percentile. No unapproved five-millisecond latency budget gates the experiment; callers may supply an explicit budget.

The network suite passed 20/20 cases across SQLite and PostgreSQL, including actual TCP reset/refusal and healing before lease expiry, HTTP unavailability, all three long-partition policies, and assertions that an old healed worker cannot overwrite terminal results or create a new epoch.

## Continuation scale

One hundred actual fake-harness process sessions were simultaneously retained as durable checkpoints, released every lease, then resumed on a replacement worker, on each database provider. Every session preserved its identity and consumed exactly one human grant. Runtime was 48.3 seconds on SQLite and 118.7 seconds on PostgreSQL under concurrent load. These are real child-process and archive/protocol tests using a deterministic harness, not 100 paid-model conversations. Existing installed-Claude/Codex compatibility tests establish separate real-CLI format coverage.

The larger population fixture uses batches of eight checkpointing processes, a one-hour human approval deadline, and an explicit whole-population suspension count before node replacement. Its count is controlled by `GARRISON_CONTINUATION_SCALE`; the default is 32. The initial serial 1,000-session attempt was stopped before its default five-minute approval deadline, and a retry hit a concurrently edited test-helper compile error. Those interrupted attempts are not passing evidence.

## Evidence index

- `benchmarks/evidence/d061/distributed-effects.json`: all 12 external mutation cases and receipts.
- `benchmarks/evidence/d061/distributed-effects-gateway.json`: paired samples plus intrinsic-stage metric deltas.
- `benchmarks/evidence/d061/network-recovery-tests.json`: 20 passing provider cases including TCP and HTTP faults.
- `benchmarks/evidence/d061/continuation-100-and-policy-tests.json`: the two 100-session population cases and accompanying policy tests.
- `benchmarks/evidence/d061/20261016-143202-fairness-synthetic-fleet-d061-multireplica-async.json`: 3,060-run fairness evidence.
- `benchmarks/evidence/d061/20261016-143442-scale-scale-workload-scale-10k.json`: every run succeeded, but latency acceptance failed.
- `benchmarks/evidence/d061/service-arrivals.csv`, `service-arrivals.json`, and `service-arrivals-provenance.json`: 1,497 actual admitted-service arrival timestamps from the benchmark, with source hash. These are benchmark service traffic, not external production calibration.

The 10,000-run tier completed all 10,000 successfully at 25.0 runs/s and 696 events/s. Claim p95 was 15,150 ms and end-to-end p95 was 17,898 ms, exceeding experiment budgets. The run establishes larger-tier execution and a measured failure boundary, not passed latency acceptance.

The 1,000-session process population passed in 238.4 seconds on SQLite, using batches of eight processes and an explicit count proving all 1,000 were simultaneously Suspended before stopping the original worker. All 1,000 restored successfully on a replacement node, preserving session identities and consuming exactly one reviewed grant each. PostgreSQL process-population evidence remains 100 sessions; the 10,000-record test is separate passive database coverage.

Final instrumented synchronous fairness also passed: all 3,060 runs succeeded, with 30 quiet samples per tenant and queue p95 8,049 ms and 7,049 ms. The bounded synchronous waiter pool returned accepted 202 responses for 2,292 runs; the benchmark followed those through bulk reads and excludes early 202 response time from terminal client latency. This is intentionally not an all-requests-held experiment.

A final lower offered-rate bracket passed on the instrumented three-replica stack after continuation scale testing ended: all 1,000 runs at 15/s succeeded, yielding 15.0 runs/s, 407 events/s, claim p95 17 ms and end-to-end p95 1,138 ms. A root solution build overlapped the early portion; original Compose and unrelated applications remained running. This demonstrates a passing measured bracket beneath the retained failure boundary, not an unconstrained release capacity guarantee.

Final trace runs used current application-scope instrumentation and captured every successful run's exact scoped database usage after the timed window:

| Replay | Arrivals / successes | Client p95 | Exact attributed runs | Statements / run | Reads / run | Writes / run |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Captured Garrison-service arrivals, 60 seconds | 1497 / 1497 | 596.6 ms | 1497, zero missing | 148.955 | 132.905 | 16.049 |
| Synthetic mixed bursts, 60 seconds | 1250 / 1250 | 2422 ms | 1250, zero missing | 152.896 | 135.715 | 17.181 |

The service replay used actual admission timestamps from the earlier isolated 10,000-run benchmark. It is captured service traffic, not external production traffic. The synthetic fixture alternates 10/s background, 25/s moderate traffic and 60/s bursts. Neither run dropped or failed an arrival. Latency begins at scheduled arrival. Exact database values count only completed instrumented run scopes; server-wide background-inclusive estimates remain separate. The collector uses a global bounded collection budget and reports missing runs explicitly.

The captured-service report sampled the initial inventory while workers were still registering after readiness, so its unchanged raw report records zero workers at that instant. An independent database query retained in `service-replay-inventory.json` confirms all 1,497 runs executed across six actual nodes. The following burst report sampled all six workers and 96 slots normally.

- `benchmarks/evidence/d061/continuation-1000.json` and `continuation-scale-provenance.json`: the larger real-process population and exact fixture settings.
- `benchmarks/evidence/d061/20261016-144225-fairness-synthetic-fleet-d061-final-multireplica-sync.json`: final instrumented synchronous fairness with 202 follow-up.

- `benchmarks/evidence/d061/20261016-144724-scale-scale-workload-scale-1k.json`: final passing 15/s lower bracket.

## Final isolated gateway measurement

A fresh server image with the bounded `mode=run/operator` label and run-row fencing read optimization completed all 210 journal operations. It was measured on a separate disposable Kubernetes cluster, which was deleted afterward. The intrinsic histograms include 200 measured calls plus ten warmup calls per mode:

| Mode | Calls | Gateway-owned mean | p99 histogram upper bound |
| --- | ---: | ---: | ---: |
| Fenced run | 210 | 4.087 ms | 25 ms |
| Operator control | 210 | 0.013 ms | 0.1 ms |

Full paired MCP positive-difference p99 was 18.24 ms for the 200 measured pairs. This still includes transport and child admission and is not interchangeable with intrinsic overhead. Fenced-stage means were session validation 0.305 ms, lease validation 0.374 ms, journal authorization 1.270 ms, dispatch record 1.234 ms and completion record 0.850 ms. Awaited tool dispatch is excluded from the owning timer. Exact parent-run admission, claim, compile, gateway, events, completion and other instrumented SQL scopes are included in the evidence. The prior and final experiments had different concurrent host load, so the difference is not a controlled causal estimate of the optimization's speedup.

- `benchmarks/evidence/d061/d062-diagnostics-gateway.json`: mode-separated intrinsic histograms, paired samples, stage deltas and exact parent-run database usage.
- `benchmarks/evidence/d061/20261016-145406-load-synthetic-fleet-d062-final-service-trace.json`: captured-service replay and complete per-run attribution.
- `benchmarks/evidence/d061/20261016-145533-load-synthetic-fleet-d062-final-burst-trace.json`: burst replay and complete per-run attribution.
- `benchmarks/evidence/d061/service-replay-inventory.json`: independent inventory-race explanation and executing-node count.

## Remaining acceptance limits

The prescribed larger tier was executed, but its latency budget was not met on this shared host; retain partial latency acceptance. The lower bracket passes. Calibration to a target customer's production traffic, longer dedicated-host capacity validation, multi-host/network-zone faults, and 10,000 actual CLI-process continuations remain broader acceptance work. The current evidence establishes 1,000 real deterministic process continuations on SQLite, 100 on PostgreSQL, plus separate real installed-CLI format tests and passive 10,000-wait-record coverage. It does not substitute those for 10,000 paid-model sessions.

## Cleanup

After the request-history and PostgreSQL ingestion follow-up measurements completed, the private scale servers and workers were stopped and only `garrison-scale-postgres` and `garrison-scale-pgdata` were removed. Both disposable effect/gateway Kubernetes clusters were removed. The original Garrison Compose server, two workers, PostgreSQL and dashboard remained healthy; their data and images were not replaced by this validation. No commits, publication or product version changes were made.

## External Azure Functions trace

A bounded official Azure Functions 2019 invocation sample was converted with `benchmarks/import-azure-function-trace.py` and replayed on a fresh private SQLite stack with two eligible alpha workers (16 slots total) and one beta worker. All 662 arrivals succeeded, with zero drops/failures, client p50 214 ms and p95 858 ms. Exact database attribution covered all 662 runs with zero missing observations.

The selection is native data row 53, source minutes 781 through 840. Each original one-minute count becomes a simultaneous burst at a one-second boundary, so 60 source minutes replay in 60 seconds (60x compression). The largest burst is 91 arrivals. These are real external invocation-count aggregates, but unknown subminute timings are not reconstructed and this is not calibration against a target customer's production workload.

The strict converter reproduced the independently extracted CSV's SHA-256 exactly. One valid-conversion check and 11 invalid-bound/count checks passed. Downloaded native rows, derived CSV and prepared offsets remain in temporary storage; only report and source/conversion provenance are retained in the repository. Official source, CC-BY-4.0 license, attribution, release archive hash and prefix hash are recorded in `benchmarks/evidence/d062/azure-trace-provenance.json`.

- `benchmarks/evidence/d062/20261016-150830-load-synthetic-fleet-d062-azure-functions2019.json`: the completed 662-arrival replay and exact scoped database results.
- `benchmarks/evidence/d062/azure-converter-provenance.json`: validated source row/window, time compression and matching hashes.
