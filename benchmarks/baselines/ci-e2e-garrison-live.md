# End-to-end report: garrison-live (ci-gate)

## Provenance

| Field | Value |
|---|---|
| Started (UTC) | 2026-10-11 16:45:57 |
| Finished (UTC) | 2026-10-11 16:45:57 |
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
| Command line | `Garrison.Benchmark e2e --dataset benchmarks/datasets/garrison-live.json --corpus live-e2e --deterministic true --repeat 1 --warmup 0 --url http://127.0.0.1:37800 --stack local --label ci-gate --results-dir <repo>/benchmarks/results --seed 42 --fake-harness <repo>/benchmarks/.run/build/bin/Garrison.FakeHarness/release_net10.0/garrison-fake-harness.dll` |

## Summary

| Arm | Outcomes | Passed | Errors | Pass rate [95% CI] | Latency p50 [95% CI] (ms) | p95 [95% CI] (ms) |
|---|---|---|---|---|---|---|
| garrison | 5 | 5 | 0 | 1.000 [1.000, 1.000] (indicative) | 2.7 [1.8, 232.4] (indicative) | 232.4 [2.7, 232.4] (indicative) |
| direct | 2 | 2 | 0 | 1.000 [1.000, 1.000] (indicative) | 95.1 [95.1, 100.9] (indicative) | 100.9 [95.1, 100.9] (indicative) |

- **garrison**: Runs through Garrison: REST create or invoke, scheduling, lease, compile, worker, fake harness, event shipping, completion.
- **direct**: Reference arm and floor: the same fake harness, arguments, and prompt, started directly by the harness with no Garrison in between.

### Timings, garrison (passed outcomes, ms)

| Measure | n | mean | p50 [95% CI] | p90 | p95 [95% CI] | p99 | max |
|---|---|---|---|---|---|---|---|
| directMs | 2 | 98.0 | 95.1 [95.1, 100.9] (indicative) | 100.9 | 100.9 [95.1, 100.9] (indicative) | 100.9 | 100.9 |
| eventPersistMaxMs | 2 | 41.3 | 37.8 [37.8, 44.8] (indicative) | 44.8 | 44.8 [37.8, 44.8] (indicative) | 44.8 | 44.8 |
| eventPersistMs | 2 | 13.6 | 12.0 [12.0, 15.2] (indicative) | 15.2 | 15.2 [12.0, 15.2] (indicative) | 15.2 | 15.2 |
| events | 2 | 9.5 | 9.0 [9.0, 10.0] (indicative) | 10.0 | 10.0 [9.0, 10.0] (indicative) | 10.0 | 10.0 |
| executionMs | 2 | 91.5 | 89.0 [89.0, 94.0] (indicative) | 94.0 | 94.0 [89.0, 94.0] (indicative) | 94.0 | 94.0 |
| overheadMs | 2 | 78.5 | 19.8 [19.8, 137.3] (indicative) | 137.3 | 137.3 [19.8, 137.3] (indicative) | 137.3 | 137.3 |
| queueMs | 2 | 1.0 | 0.0 [0.0, 2.0] (indicative) | 2.0 | 2.0 [0.0, 2.0] (indicative) | 2.0 | 2.0 |
| requestMs | 5 | 50.2 | 5.0 [1.8, 121.5] (indicative) | 121.5 | 121.5 [5.0, 121.5] (indicative) | 121.5 | 121.5 |
| serverOverheadMs | 2 | 23.0 | 19.0 [19.0, 27.0] (indicative) | 27.0 | 27.0 [19.0, 27.0] (indicative) | 27.0 | 27.0 |
| streamMaxMs | 1 | 0.9 | 0.9 | 0.9 | 0.9 | 0.9 | 0.9 |
| streamMessages | 1 | 11.0 | 11.0 | 11.0 | 11.0 | 11.0 | 11.0 |
| streamMs | 1 | 0.9 | 0.9 | 0.9 | 0.9 | 0.9 | 0.9 |
| totalMs | 2 | 114.5 | 108.0 [108.0, 121.0] (indicative) | 121.0 | 121.0 [108.0, 121.0] (indicative) | 121.0 | 121.0 |
| ttftMs | 2 | 53.5 | 53.0 [53.0, 54.0] (indicative) | 54.0 | 54.0 [53.0, 54.0] (indicative) | 54.0 | 54.0 |

### Timings, direct (passed outcomes, ms)

| Measure | n | mean | p50 [95% CI] | p90 | p95 [95% CI] | p99 | max |
|---|---|---|---|---|---|---|---|
| directMs | 2 | 98.0 | 95.1 [95.1, 100.9] (indicative) | 100.9 | 100.9 [95.1, 100.9] (indicative) | 100.9 | 100.9 |

### By probe type, garrison

| Type | n | Passed | Pass rate [95% CI] |
|---|---|---|---|
| cross-tenant | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| override-not-allowed | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| quick-start | 2 | 2 | 1.000 [1.000, 1.000] (indicative) |
| unknown-agent | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |

### By category, garrison

| Category | n | Passed | Pass rate [95% CI] |
|---|---|---|---|
| flow | 2 | 2 | 1.000 [1.000, 1.000] (indicative) |
| isolation | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| validation | 2 | 2 | 1.000 [1.000, 1.000] (indicative) |

## Published and prior baselines

| Metric | Source | Baseline | This run | Net | Note |
|---|---|---|---|---|---|
| (all) | no comparable published result | none | n/a | n/a | No public benchmark measures an agent-harness control plane (scheduling runs of headless CLI agents onto pull-based workers), so there is no published score to compare against. The closest public data, the Azure Functions and Alibaba cluster traces, are workloads without an oracle; see BENCHMARKING.md, Datasets. |

## Options

| Option | Value |
|---|---|
| --connection-lifetime-seconds | 30 |
| --context | (unset) |
| --corpus | live-e2e |
| --dataset | benchmarks/datasets/garrison-live.json |
| --deterministic | true |
| --direct | true |
| --fake-harness | <repo>/benchmarks/.run/build/bin/Garrison.FakeHarness/release_net10.0/garrison-fake-harness.dll |
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

