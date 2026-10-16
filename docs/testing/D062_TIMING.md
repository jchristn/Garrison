# D062 replicated timing ablations

All fourteen timing arms completed: **13,714 successful runs, zero failures**. Two complete seven-arm rounds ran in seeded randomized order, each on a fresh private SQLite stack. The observed differences do not justify changing defaults.

## Conditions and provenance

- Seed **62026**, two rounds; **25-second** measured load windows after **5-second** warmups; closed-loop concurrency **16**.
- One local control plane; one alpha and one beta worker, four slots each. This load targets the alpha lane, so **four slots** carry the measured workload. The beta worker remains ready but does not double measured capacity.
- Stream probes were explicitly disabled to isolate the load replications. The existing stream-path validation is separate.
- The other Garrison performance, test and build jobs finished before this window. The original Compose deployment and unrelated host services remained running. These are shared-host measurements, not a release-capacity certification.
- Every arm retains its exact settings, trial, order, report hash and before/after host-load snapshot in the [manifest](../../benchmarks/evidence/d062/timing-repeated/manifest.json). Full measurements and same-round baseline comparisons are in [summary.json](../../benchmarks/evidence/d062/timing-repeated/summary.json).
- The manifest also records SHA-256 hashes of **178 frozen application/runtime files**. The private Release build was unchanged throughout the sweep. A later source-only delegation safety guard is not included in those binaries; it changes the non-durable run-principal child-wait admission path, which this external synchronous load does not exercise. Final guard validation is recorded in [D062 validation](D062_VALIDATION.md).

The first round order was lease1s, poll50, flush25, poll100, baseline, lease5s, flush100. The second was flush25, baseline, lease5s, poll50, flush100, lease1s, poll100. The full window ran from 2026-10-16T15:10:11.697599+00:00 to 2026-10-16T15:18:40.397222+00:00.

## Paired results

Settings are lease wait / worker event flush / server event tail poll, in milliseconds. Throughput deltas compare each arm with the baseline from its own round.

| Arm | Settings, ms | Round 1 runs/s | Round 2 runs/s | Round 1 p95, ms | Round 2 p95, ms | Throughput vs baseline, R1 / R2 |
|---|---|---:|---:|---:|---:|---|
| baseline | 20000/250/250 | 41.24 | 34.98 | 404.6 | 488.4 | +0.0% / +0.0% |
| lease1s | 1000/250/250 | 35.27 | 42.36 | 465.9 | 391.5 | -14.5% / +21.1% |
| lease5s | 5000/250/250 | 38.52 | 34.43 | 428.8 | 480.6 | -6.6% / -1.6% |
| flush25 | 20000/25/250 | 41.42 | 39.54 | 405.8 | 420.5 | +0.4% / +13.0% |
| flush100 | 20000/100/250 | 34.91 | 39.77 | 486.2 | 412.5 | -15.4% / +13.7% |
| poll50 | 20000/250/50 | 37.59 | 37.77 | 439.2 | 493.2 | -8.9% / +8.0% |
| poll100 | 20000/250/100 | 41.54 | 40.97 | 402.7 | 407.1 | +0.7% / +17.1% |

The unchanged baseline fell from 41.24 to 34.98 runs/s between rounds, while its p95 increased from 404.6 to 488.4 ms. Lease and flush changes either reversed direction or did not reproduce a latency benefit. This variation is large enough that the earlier single ordered sweep cannot establish a tuning improvement.

The poll100 arm had a same-direction throughput result, but its round-one advantage was only 0.7%, with overlapping throughput and p95 confidence intervals. Its larger second-round difference is relative to the slower second baseline. More importantly, EventPollMs controls streaming event-tail subscribers; this workload has no such subscriber. Its apparent advantage therefore does not demonstrate a causal event-poll optimization. Stream-path delivery claims must use a streaming workload.

One-minute host-load observations ranged from 2.98 to 13.02 on 18 logical CPUs. Five-minute observations ranged from 6.33 to 8.30, and fifteen-minute observations from 12.24 to 15.79. Longer averages include earlier work. Load averages are context rather than proof of an uncontended host, and operation-level bootstrap intervals do not capture all between-run host variation.

**Decision:** retain LeaseWaitMs=20000, EventFlushIntervalMs=250 and EventPollMs=250. The replicated experiment is complete; it does not support changing these defaults or claiming a causal performance win.

## Reproduction

```bash
TIMING_REPEAT=2 TIMING_RANDOM_SEED=62026 \
TIMING_DURATION_SECONDS=25 TIMING_WARMUP_SECONDS=5 TIMING_CONCURRENCY=16 \
TIMING_STREAM_PROBES=0 \
TIMING_MANIFEST=benchmarks/evidence/d062/timing-repeated/manifest.json \
TIMING_RESULTS_DIR=benchmarks/evidence/d062/timing-repeated \
  benchmarks/timing-sweep.sh \
  --shared-note 'Garrison measurement jobs serialized; other host services remain running'
```

Use a new results directory for a new comparison. `TIMING_PLAN_ONLY=1` previews the schedule. Without the new repeat/seed variables, the script preserves its previous single-round fixed order and report labels. Offline checks verified repeatable ordering for the same seed, changed ordering for another seed, exactly seven distinct arms in each round, and the legacy default order. Bash syntax validation passed. The private stack was stopped after the final arm; the original deployment was unchanged.
