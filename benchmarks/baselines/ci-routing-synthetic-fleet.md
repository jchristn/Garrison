# Routing report: synthetic-fleet (ci-gate)

## Provenance

| Field | Value |
|---|---|
| Started (UTC) | 2026-10-11 16:45:21 |
| Finished (UTC) | 2026-10-11 16:45:43 |
| System under test | http://127.0.0.1 (bench stack) (server 0.1.0-alpha) |
| Stack | local |
| Product commit | 23c4da98f483eceb07ebe453ecea8a6030e4013f-dirty (366 changed or untracked paths) |
| Harness | Garrison.Benchmark 1.0.0, commit uncommitted-dirty |
| Machine | scrubbed, macOS 26.6.0 (Arm64), Apple M5 Max (Arm64), 18 logical processors |
| Runtime | .NET 10.0.12 |
| HTTP client | SocketsHttpHandler, MaxConnectionsPerServer 1024, timeout 660 s, pooled connection lifetime 30 s, connect timeout 10 s |
| Dataset | synthetic-fleet (benchmarks/datasets/synthetic-fleet.json) |
| Dataset SHA-256 | 2e79613ad9cab719bd66ffaa8c3eb6ac6688c37ae25a5eae9ab23cf67cf5b52a |
| External services | none: every run uses the fake harness (garrison-fake-harness), no model or paid service |
| Shared machine | not recorded (pass --shared-note) |
| Seed | 42 |
| Deterministic | yes (no wall-clock value is scored) |
| Command line | `Garrison.Benchmark routing --dataset benchmarks/datasets/synthetic-fleet.json --deterministic true --url http://127.0.0.1:37800 --stack local --label ci-gate --results-dir <repo>/benchmarks/results --seed 42` |

## Summary

| Arm | Outcomes | Passed | Errors | Pass rate [95% CI] | Latency p50 [95% CI] (ms) | p95 [95% CI] (ms) |
|---|---|---|---|---|---|---|
| garrison | 24 | 24 | 0 | 1.000 [1.000, 1.000] | 206.8 [3.7, 208.8] | 231.0 [209.3, 250.2] |

- **garrison**: Runs through Garrison: REST create or invoke, scheduling, lease, compile, worker, fake harness, event shipping, completion.

### Timings, garrison (passed outcomes, ms)

| Measure | n | mean | p50 [95% CI] | p90 | p95 [95% CI] | p99 | max |
|---|---|---|---|---|---|---|---|
| eventPersistMaxMs | 15 | 38.1 | 34.1 [33.6, 37.2] (indicative) | 50.5 | 64.0 [42.5, 64.0] (indicative) | 64.0 | 64.0 |
| eventPersistMs | 15 | 14.0 | 11.7 [10.7, 20.2] (indicative) | 21.2 | 26.0 [20.2, 26.0] (indicative) | 26.0 | 26.0 |
| events | 16 | 10.1 | 11.0 [10.0, 11.0] (indicative) | 11.0 | 11.0 [11.0, 11.0] (indicative) | 11.0 | 11.0 |
| executionMs | 15 | 86.1 | 83.0 [78.0, 85.0] (indicative) | 106.0 | 124.0 [85.0, 124.0] (indicative) | 124.0 | 124.0 |
| queueMs | 16 | 1.4 | 1.0 [1.0, 1.0] (indicative) | 2.0 | 7.0 [1.0, 7.0] (indicative) | 7.0 | 7.0 |
| requestMs | 24 | 4.3 | 2.5 [2.4, 2.9] | 3.7 | 10.5 [3.2, 35.1] | 35.1 | 35.1 |
| serverOverheadMs | 15 | 35.6 | 30.0 [21.0, 32.0] (indicative) | 65.0 | 116.0 [32.0, 116.0] (indicative) | 116.0 | 116.0 |
| streamMaxMs | 16 | 1.3 | 0.9 [0.7, 1.1] (indicative) | 2.7 | 4.2 [1.2, 4.2] (indicative) | 4.2 | 4.2 |
| streamMessages | 16 | 11.1 | 12.0 [11.0, 12.0] (indicative) | 12.0 | 12.0 [12.0, 12.0] (indicative) | 12.0 | 12.0 |
| streamMs | 16 | 1.2 | 0.9 [0.7, 1.0] (indicative) | 2.7 | 4.1 [1.1, 4.1] (indicative) | 4.1 | 4.1 |
| totalMs | 16 | 114.5 | 113.0 [106.0, 117.0] (indicative) | 160.0 | 199.0 [127.0, 199.0] (indicative) | 199.0 | 199.0 |
| ttftMs | 15 | 52.0 | 49.0 [47.0, 51.0] (indicative) | 54.0 | 94.0 [51.0, 94.0] (indicative) | 94.0 | 94.0 |

### By probe type, garrison

| Type | n | Passed | Pass rate [95% CI] |
|---|---|---|---|
| concurrency-limit | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| missing-executable | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| missing-harness | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| no-deployment | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| no-selector | 3 | 3 | 1.000 [1.000, 1.000] (indicative) |
| node-selector | 8 | 8 | 1.000 [1.000, 1.000] (indicative) |
| override-in-range | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| override-not-allowed | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| override-out-of-range | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| priority | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| unknown-agent | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| unmatched-selector | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| weight-zero | 3 | 3 | 1.000 [1.000, 1.000] (indicative) |

### By category, garrison

| Category | n | Passed | Pass rate [95% CI] |
|---|---|---|---|
| blocking | 3 | 3 | 1.000 [1.000, 1.000] (indicative) |
| ordering | 2 | 2 | 1.000 [1.000, 1.000] (indicative) |
| placement | 14 | 14 | 1.000 [1.000, 1.000] (indicative) |
| validation | 5 | 5 | 1.000 [1.000, 1.000] (indicative) |

## Published and prior baselines

| Metric | Source | Baseline | This run | Net | Note |
|---|---|---|---|---|---|
| (all) | no comparable published result | none | n/a | n/a | No public benchmark measures an agent-harness control plane (scheduling runs of headless CLI agents onto pull-based workers), so there is no published score to compare against. The closest public data, the Azure Functions and Alibaba cluster traces, are workloads without an oracle; see BENCHMARKING.md, Datasets. |

## Options

| Option | Value |
|---|---|
| --connection-lifetime-seconds | 30 |
| --context | (unset) |
| --corpus |  |
| --dataset | benchmarks/datasets/synthetic-fleet.json |
| --deterministic | true |
| --direct | false |
| --kubeconfig | (unset) |
| --label | ci-gate |
| --limit | 0 |
| --max-connections | 1024 |
| --namespace | garrison |
| --other-tenant | default |
| --poll-ms | 100 |
| --ready-timeout-seconds | 120 |
| --repeat | 1 |
| --request-timeout-seconds | 660 |
| --resamples | 2000 |
| --results-dir | <repo>/benchmarks/results |
| --seed | 42 |
| --shared-note | (unset) |
| --stack | local |
| --stack-details | (unset) |
| --stream | true |
| --sut-commit | (unset) |
| --url | http://127.0.0.1:37800 |
| --warmup | 0 |
| --workspace-suffix | (unset) |

