# End-to-end report: synthetic-fleet (timing-stream-lease5s)

## Provenance

| Field | Value |
|---|---|
| Started (UTC) | 2026-10-16 07:17:21 |
| Finished (UTC) | 2026-10-16 07:17:22 |
| System under test | http://127.0.0.1:37800 (server 0.1.0-alpha) |
| Stack | local: stream timing lease5s; LeaseWaitMs=5000, EventFlushIntervalMs=250, EventPollMs=250 |
| Product commit | f64960d78a59a1008a58c4c9aa01825f32bd2325-dirty (377 changed or untracked paths) |
| Harness | Garrison.Benchmark 1.0.0, commit 68bc0a61b0171c9408fdd5fc36370e7b0fc156e4-dirty |
| Machine | joels-mbp, macOS 26.6.0 (Arm64), Apple M5 Max (Arm64), 18 logical processors |
| Runtime | .NET 10.0.12 |
| HTTP client | SocketsHttpHandler, MaxConnectionsPerServer 1024, timeout 660 s, pooled connection lifetime 30 s, connect timeout 10 s |
| Dataset | synthetic-fleet (benchmarks/datasets/synthetic-fleet.json) |
| Dataset SHA-256 | 2e79613ad9cab719bd66ffaa8c3eb6ac6688c37ae25a5eae9ab23cf67cf5b52a |
| External services | none: every run uses the fake harness (garrison-fake-harness), no model or paid service |
| Shared machine | not recorded (pass --shared-note) |
| Seed | 42 |
| Deterministic | no |
| Command line | `Garrison.Benchmark e2e --url http://127.0.0.1:37800 --admin-key *** --stack local --stack-details "stream timing lease5s; LeaseWaitMs=5000, EventFlushIntervalMs=250, EventPollMs=250" --direct false --stream true --repeat 1 --warmup 0 --limit 2 --label timing-stream-lease5s` |

## Summary

| Arm | Outcomes | Passed | Errors | Pass rate [95% CI] | Latency p50 [95% CI] (ms) | p95 [95% CI] (ms) |
|---|---|---|---|---|---|---|
| garrison | 2 | 2 | 0 | 1.000 [1.000, 1.000] (indicative) | 74.2 [74.2, 99.5] (indicative) | 99.5 [74.2, 99.5] (indicative) |

- **garrison**: Runs through Garrison: REST create or invoke, scheduling, lease, compile, worker, fake harness, event shipping, completion.

### Timings, garrison (passed outcomes, ms)

| Measure | n | mean | p50 [95% CI] | p90 | p95 [95% CI] | p99 | max |
|---|---|---|---|---|---|---|---|
| cancelMs | 1 | 74.2 | 74.2 | 74.2 | 74.2 | 74.2 | 74.2 |
| cancelRequestMs | 1 | 3.6 | 3.6 | 3.6 | 3.6 | 3.6 | 3.6 |
| eventPersistMaxMs | 1 | 26.1 | 26.1 | 26.1 | 26.1 | 26.1 | 26.1 |
| eventPersistMs | 1 | 4.4 | 4.4 | 4.4 | 4.4 | 4.4 | 4.4 |
| events | 1 | 7.0 | 7.0 | 7.0 | 7.0 | 7.0 | 7.0 |
| executionMs | 1 | 65.0 | 65.0 | 65.0 | 65.0 | 65.0 | 65.0 |
| queueMs | 1 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 |
| requestMs | 2 | 52.5 | 5.5 [5.5, 99.5] (indicative) | 99.5 | 99.5 [5.5, 99.5] (indicative) | 99.5 | 99.5 |
| serverOverheadMs | 1 | 31.0 | 31.0 | 31.0 | 31.0 | 31.0 | 31.0 |
| totalMs | 1 | 96.0 | 96.0 | 96.0 | 96.0 | 96.0 | 96.0 |
| ttftMs | 1 | 41.0 | 41.0 | 41.0 | 41.0 | 41.0 | 41.0 |

### By probe type, garrison

| Type | n | Passed | Pass rate [95% CI] |
|---|---|---|---|
| cancel | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| codex-format | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |

### By category, garrison

| Category | n | Passed | Pass rate [95% CI] |
|---|---|---|---|
| lifecycle | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| parsing | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |

## Published and prior baselines

| Metric | Source | Baseline | This run | Net | Note |
|---|---|---|---|---|---|
| (all) | no comparable published result | none | n/a | n/a | No public benchmark measures an agent-harness control plane (scheduling runs of headless CLI agents onto pull-based workers), so there is no published score to compare against. The closest public data, the Azure Functions and Alibaba cluster traces, are workloads without an oracle; see BENCHMARKING.md, Datasets. |
| garrison.queueMs.p50 | docs/SCALING.md, Measured results (2026-10-10) (docs/SCALING.md) | 39 | 1 | -38 | Claim latency (queued to leased) with no backlog, 0.5 s runs, 3 server replicas and 4 workers on k3d; this suite uses 1 replica and measures across all e2e probes. |
| garrison.serverOverheadMs.p50 | docs/SCALING.md, Measured results (2026-10-10) (docs/SCALING.md) | 140 | 31 | -109 | SCALING.md reports runs finishing 140 to 230 ms after their harness time with no backlog; the low end is shown. serverOverheadMs is totalMs minus executionMs. |

## Options

| Option | Value |
|---|---|
| --connection-lifetime-seconds | 30 |
| --context | (unset) |
| --corpus |  |
| --dataset | benchmarks/datasets/synthetic-fleet.json |
| --deterministic | false |
| --direct | false |
| --kubeconfig | (unset) |
| --label | timing-stream-lease5s |
| --limit | 2 |
| --max-connections | 1024 |
| --namespace | garrison |
| --other-tenant | default |
| --poll-ms | 100 |
| --ready-timeout-seconds | 120 |
| --repeat | 1 |
| --request-timeout-seconds | 660 |
| --resamples | 2000 |
| --results-dir | (unset) |
| --seed | 42 |
| --shared-note | (unset) |
| --stack | local |
| --stack-details | stream timing lease5s; LeaseWaitMs=5000, EventFlushIntervalMs=250, EventPollMs=250 |
| --stream | true |
| --sut-commit | (unset) |
| --url | http://127.0.0.1:37800 |
| --warmup | 0 |
| --workspace-suffix | (unset) |

