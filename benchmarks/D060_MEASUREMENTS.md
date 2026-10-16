# D-060 performance observations

These are short observations on the maintainer's shared macOS host, using a private loopback stack, not a release performance baseline. Other project services remained running. Garrison integration builds and tests were paused during the first measurement window. Host load averages rose from 4.52/8.21/7.86 before startup to 17.85/14.96/10.93 during the 1020-request fairness burst. Do not compare the SQLite throughput here directly with older PostgreSQL or Kubernetes results.

The dedicated server, worker, and fake-harness artifacts were built from the uncommitted working tree at approximately 2026-10-16 06:13 UTC (2026-10-15 locally), in `/tmp/garrison-perf-artifacts`, before later broker integration changes. One alpha worker supplied eight workload slots. An idle beta worker was present in the first experiment. Raw evidence is retained under [evidence/d060](evidence/d060).

## Request-history comparison, I-05

Each arm used closed-loop concurrency 16, a one-second warmup, a five-second offered window, and an in-flight drain. Database values divide server-wide counter deltas by successful runs and include background work. The two sequential short arms were not randomized or repeated enough to establish a statistically reliable throughput improvement.

| Successful node protocol history | Successful runs | Failures | Throughput | DB statements per success | History header inserts per success | Client p95 |
| --- | --- | --- | --- | --- | --- | --- |
| Off | 193 | 0 | 35.93/s | 204.97 | 1.00 | 534 ms |
| On | 166 | 0 | 30.89/s | 219.31 | 6.25 | 629 ms |

These observations support the expected database-write direction of I-05. They do not replace a sustained PostgreSQL comparison. The first attempted pair had unavailable metrics because the service-port relay was disabled; those runs are excluded from the database-cost evidence. The private benchmark configuration now explicitly enables its loopback metrics relay, and missing database metric series remain unavailable rather than becoming a zero-statement result.

## Manifest ingestion, I-06

A fresh 2000-agent corpus contained 4040 documents. All 4040 were created, with zero failed documents or request errors. First apply took 1205.77 ms, approximately 3324 documents/second; an identical re-apply took 753.77 ms and reported every document Unchanged. All 2000 agents were reachable. Dry run took 465.66 ms. This measures the implemented cache on SQLite; no legacy uncached binary was run, so it is not a paired cache speedup claim.

## Synchronous-wait fairness stress

One noisy tenant submitted 1000 runs; two quiet tenants submitted ten each. All 1020 runs succeeded. Quiet queue p95 was 26783 and 26760 ms, so the declared ten-second target failed. Noisy queue p95 was 55395 ms. The failed result is retained.

The original driver held one synchronous waiting invocation per run. The retained database shows admission p95 below 0.94 seconds. Some first quiet runs were leased after about 1.7 seconds but did not start until another 19.29 seconds had passed. Initial noisy execution also stalled for about 19.4 seconds. This establishes that admission locking alone does not explain the failure. The worker handoff/execution stall under 1020 waiting requests needs investigation; SQLite contention and waiter bookkeeping are hypotheses, not proven causes.

The fairness driver now defaults to asynchronous admission followed by paginated bulk completion reads. It retains `--wait-invoke true` for deliberate synchronous-wait stress. It records admission and lease-to-start timing separately and emits explicit pass/fail p95 guard outcomes. A passing asynchronous experiment must not be presented as fixing the synchronous-wait stress failure.

## Tooling validation and remaining evidence

The benchmark builds without warnings. Trace preparation preserved simultaneous bursts, time scaling, and SHA-256 provenance; invalid ordering, excessive counts, missing input, and incompatible modes were rejected. Shell syntax checks pass. Live trace replay and seven-point timing-sweep functional smoke are now verified, as recorded below; sustained uncontended tuning measurements remain open. Exact per-run database attribution (I-12), the placement explanation endpoint (I-11), a sustained larger-scale run, and a new slot-efficiency optimization remain open.

## PostgreSQL fairness follow-up

A second controlled window paused Garrison integration builds/tests after the continuation regression finished. The private stack used PostgreSQL at 127.0.0.1:49934 with a fresh `perf_d060_061600` schema, a pool of 40, one worker with eight slots, and the same frozen server/worker artifacts. Other host services remained present. Each arm submitted 1000 noisy and ten runs from each of two quiet tenants. Every run succeeded in both arms, and the two explicit p95 guards passed in each arm.

| Invocation mode | Quiet 0 queue p95 | Quiet 1 queue p95 | Quiet 0 lease-to-start p95 | Quiet 1 lease-to-start p95 |
| --- | --- | --- | --- | --- |
| Asynchronous admission and bulk completion monitoring | 2646 ms | 2698 ms | 373 ms | 315 ms |
| Synchronous waiting invocation per run | 2364 ms | 2412 ms | 161 ms | 209 ms |

The declared quiet-queue target remained 10000 ms. Synchronous quiet client p95 was approximately 5028 and 5068 ms. The raw synchronous report's `admissionMs` timing is the entire waiting invocation latency, so it must not be interpreted as admission-only time; the driver now omits that field in synchronous mode. The asynchronous report's admission p95 was approximately 3.10 seconds.

Both PostgreSQL arms passed without changing scheduling or queue targets. This narrows the earlier SQLite failure to a provider/shared-host interaction rather than establishing a general fair-claim ordering failure. It does not prove a specific root cause or fix SQLite. There were only ten samples per quiet tenant and one control-plane replica; a sustained multi-replica acceptance run and SQLite waiter profiling remain open. Raw reports are preserved alongside the failed SQLite result in [evidence/d060](evidence/d060).

## Workspace cache, 10,000-file fixture

`benchmarks/workspace-cache.sh` exercised production preparation and snapshot code against 10,000 deterministic incompressible files totaling 81,920,000 bytes. Every arm produced work-tree SHA-256 `A701F9BB1C44509609364BF9DB899586B3929D69A34EC62E27653E2392DF47A3`. Raw evidence: [workspace-cache.json](evidence/d060/workspace-cache.json).

| Arm | Preparation or restore | Received payload |
|---|---:|---:|
| Uncached clone | 4.880 s | 82,308,318 git pack bytes |
| Cold mirror plus clone | 2.207 s | 82,308,318 git pack bytes |
| Warm mirror plus clone | 1.419 s | 0 git pack bytes |
| Prepared snapshot restore | 3.307 s | 175,241,080 ZIP bytes |

Snapshot capture took 2.554 s. These are single ordered arms on the shared host, with an unencrypted local SSH shim, so filesystem caching and concurrent work affect timing. The warm mirror avoided pack transfer; the prepared archive was larger because it preserves both the working tree and git database. Snapshot reuse is a portability option, not a universal bandwidth or latency improvement. No physical network speedup is claimed.

## Live trace and timing-sweep smoke, 2026-10-16 UTC

This follow-up verifies tooling mechanics on a shared host while other Garrison validation continued. It uses a private fresh SQLite stack at `127.0.0.1:37800`, one worker with four slots, frozen Debug server/worker/fake-harness binaries from `/tmp/garrison-reviewfix-artifacts`, and the existing frozen Release benchmark binary. No rebuild, Compose mutation, or access to the original user-data stack was needed. Artifact SHA-256 values and a host snapshot (18 logical CPUs, load average 5.15/6.39/7.67) are in `evidence/d060/live-tooling-provenance.json`. Report source-commit metadata describes the working tree, so the binary hashes are the precise executable provenance.

`trace-live.csv` contains 18 arrivals with simultaneous bursts, including two at 5000 ms. After `prepare-trace`, two live four-second replays each accounted for exactly 16 in-window arrivals, omitting the two beyond the cutoff:

| Maximum in flight | Scheduled/accounted | Successful | Client drops | Server failures |
| --- | ---: | ---: | ---: | ---: |
| 32 | 16 | 16 | 0 | 0 |
| 1 | 16 | 7 | 9 | 0 |

The uncapped replay completed 6/6/3/1 runs in its four one-second buckets, with scheduled-arrival p95 266.90 ms. The capped replay classified all nine failures as `client: more than 1 in flight`; they are intentional client drops, not requests sent to the server. `started` in these reports counts all scheduled attempts including drops, and equals successes plus failures. Source SHA-256 is `e97c5d706d105de475d1a3dc4530969a55373ed65f033944445fdde4fb8b8ddc`; prepared SHA-256 is `7217197530e9d358230f82bf16a28afb3c6619a024d3dd34b1b03bd7f3c86e4c`. Both raw reports are under `evidence/d060/live-trace`.

The complete seven-arm `timing-sweep.sh` ran with `NO_BUILD=1`, one closed-loop client, zero warmup, one-second offered windows, one alpha worker, no beta workers, and two end-to-end probes per arm. Baseline settings were lease wait 20000 ms, worker event flush 250 ms, and server event poll 250 ms. Each named arm changes only its indicated dimension. Each arm used a fresh database and process stack.

| Arm | Load successes | Load failures | Load p95 ms | Stream events | Maximum event persistence lag ms |
| --- | ---: | ---: | ---: | ---: | ---: |
| baseline | 10 | 0 | 219.86 | 7 | 33.85 |
| lease1s | 8 | 0 | 258.23 | 7 | 35.02 |
| lease5s | 9 | 0 | 236.47 | 7 | 26.13 |
| flush25 | 10 | 0 | 207.36 | 7 | 8.54 |
| flush100 | 9 | 0 | 226.71 | 7 | 34.88 |
| poll50 | 9 | 0 | 231.05 | 7 | 34.35 |
| poll100 | 9 | 0 | 228.69 | 7 | 25.50 |

All 14 end-to-end probes passed, including one actual Codex event stream and one cancellation per arm. Reports with exact settings and stream timing are under `evidence/d060/timing-smoke-stream`. An initial seven-arm smoke used limit 1 and selected cancellation only; those raw reports remain under `timing-smoke`, and are not stream-delivery evidence. The second run corrected the sample selection to limit 2 and explicitly verified persisted event counts. All private processes were stopped afterward.

These short, cold, single-client samples verify that every timing arm runs and reports, not that any setting improves latency. They do not select production defaults or complete a sustained quiet-machine tuning experiment. The trace is synthetic; a licensed production arrival dataset and large-scale replay remain separate work.
