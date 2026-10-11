# Ingest report: garrison-live (ci-gate)

## Provenance

| Field | Value |
|---|---|
| Started (UTC) | 2026-10-11 16:45:58 |
| Finished (UTC) | 2026-10-11 16:45:58 |
| System under test | http://127.0.0.1 (bench stack) (server 0.1.0-alpha) |
| Stack | local |
| Product commit | 23c4da98f483eceb07ebe453ecea8a6030e4013f-dirty (366 changed or untracked paths) |
| Harness | Garrison.Benchmark 1.0.0, commit uncommitted-dirty |
| Machine | scrubbed, macOS 26.6.0 (Arm64), Apple M5 Max (Arm64), 18 logical processors |
| Runtime | .NET 10.0.12 |
| HTTP client | SocketsHttpHandler, MaxConnectionsPerServer 1024, timeout 660 s, pooled connection lifetime 30 s, connect timeout 10 s |
| Dataset | garrison-live (benchmarks/datasets/garrison-live.json) |
| Dataset SHA-256 | a0f3f286b047775bb9996f4b67d14d269bcc506d8fe2aabf301f48c87c506eb2 |
| External services | none: every run uses the fake harness (garrison-fake-harness), no model or paid service |
| Shared machine | not recorded (pass --shared-note) |
| Seed | 42 |
| Deterministic | yes (no wall-clock value is scored) |
| Command line | `Garrison.Benchmark ingest --dataset benchmarks/datasets/garrison-live.json --corpus live-ingest --deterministic true --url http://127.0.0.1:37800 --stack local --label ci-gate --results-dir <repo>/benchmarks/results --seed 42` |

## Summary

| Arm | Outcomes | Passed | Errors | Pass rate [95% CI] | Latency p50 [95% CI] (ms) | p95 [95% CI] (ms) |
|---|---|---|---|---|---|---|
| garrison | 3 | 3 | 0 | 1.000 [1.000, 1.000] (indicative) | 0.7 [0.6, 1.3] (indicative) | 1.3 [0.6, 1.3] (indicative) |


### Timings, garrison (passed outcomes, ms)

| Measure | n | mean | p50 [95% CI] | p90 | p95 [95% CI] | p99 | max |
|---|---|---|---|---|---|---|---|
| agents | 1 | 6.0 | 6.0 | 6.0 | 6.0 | 6.0 | 6.0 |
| reachable | 1 | 6.0 | 6.0 | 6.0 | 6.0 | 6.0 | 6.0 |
| requestMs | 2 | 0.6 | 0.6 [0.6, 0.7] (indicative) | 0.7 | 0.7 [0.6, 0.7] (indicative) | 0.7 | 0.7 |

### By probe type, garrison

| Type | n | Passed | Pass rate [95% CI] |
|---|---|---|---|
| idempotent-dry-run | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| reachability | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| secret-value | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |

### By category, garrison

| Category | n | Passed | Pass rate [95% CI] |
|---|---|---|---|
| load-path | 2 | 2 | 1.000 [1.000, 1.000] (indicative) |
| validation | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |

## Load path

| Measure | Value |
|---|---|
| Documents | 15 in 1 applies of up to 50 |
| Created / updated / unchanged / failed | 15 / 0 / 0 / 0 |
| Apply requests without a result | 0 |
| Documents per second | 1474.0 |
| Apply latency p50 / p95 / max (ms) | 10.1 / 10.1 / 10.1 |
| Idempotent re-apply (share Unchanged) | 1.000 |
| Re-apply latency p50 / p95 (ms) | 14.7 / 14.7 |
| Dry run of the whole corpus (ms) | 6.9 |
| Reachability (agents readable by name) | 6 of 6 (1.000) |

## Published and prior baselines

| Metric | Source | Baseline | This run | Net | Note |
|---|---|---|---|---|---|
| (all) | no comparable published result | none | n/a | n/a | No public benchmark measures an agent-harness control plane (scheduling runs of headless CLI agents onto pull-based workers), so there is no published score to compare against. The closest public data, the Azure Functions and Alibaba cluster traces, are workloads without an oracle; see BENCHMARKING.md, Datasets. |

## Options

| Option | Value |
|---|---|
| --batch-size | 50 |
| --connection-lifetime-seconds | 30 |
| --context | (unset) |
| --corpus | live-ingest |
| --dataset | benchmarks/datasets/garrison-live.json |
| --deterministic | true |
| --dry-run | true |
| --kubeconfig | (unset) |
| --label | ci-gate |
| --max-connections | 1024 |
| --namespace | garrison |
| --poll-ms | 100 |
| --ready-timeout-seconds | 120 |
| --reapply | true |
| --request-timeout-seconds | 660 |
| --resamples | 2000 |
| --results-dir | <repo>/benchmarks/results |
| --seed | 42 |
| --shared-note | (unset) |
| --stack | local |
| --stack-details | (unset) |
| --sut-commit | (unset) |
| --url | http://127.0.0.1:37800 |

