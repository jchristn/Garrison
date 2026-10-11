# End-to-end report: synthetic-fleet (ci-gate)

## Provenance

| Field | Value |
|---|---|
| Started (UTC) | 2026-10-11 16:45:43 |
| Finished (UTC) | 2026-10-11 16:45:55 |
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
| Command line | `Garrison.Benchmark e2e --dataset benchmarks/datasets/synthetic-fleet.json --deterministic true --repeat 1 --warmup 1 --url http://127.0.0.1:37800 --stack local --label ci-gate --results-dir <repo>/benchmarks/results --seed 42 --fake-harness <repo>/benchmarks/.run/build/bin/Garrison.FakeHarness/release_net10.0/garrison-fake-harness.dll` |

## Summary

| Arm | Outcomes | Passed | Errors | Pass rate [95% CI] | Latency p50 [95% CI] (ms) | p95 [95% CI] (ms) |
|---|---|---|---|---|---|---|
| garrison | 23 | 23 | 0 | 1.000 [1.000, 1.000] | 134.8 [109.0, 140.7] | 544.4 [172.3, 5081.8] |
| direct | 15 | 15 | 0 | 1.000 [1.000, 1.000] (indicative) | 97.4 [94.1, 101.5] (indicative) | 430.9 [101.9, 430.9] (indicative) |

- **garrison**: Runs through Garrison: REST create or invoke, scheduling, lease, compile, worker, fake harness, event shipping, completion.
- **direct**: Reference arm and floor: the same fake harness, arguments, and prompt, started directly by the harness with no Garrison in between.

### Timings, garrison (passed outcomes, ms)

| Measure | n | mean | p50 [95% CI] | p90 | p95 [95% CI] | p99 | max |
|---|---|---|---|---|---|---|---|
| cancelMs | 1 | 75.7 | 75.7 | 75.7 | 75.7 | 75.7 | 75.7 |
| cancelRequestMs | 1 | 1.4 | 1.4 | 1.4 | 1.4 | 1.4 | 1.4 |
| directMs | 15 | 137.9 | 97.4 [94.1, 101.9] (indicative) | 426.9 | 430.9 [101.9, 430.9] (indicative) | 430.9 | 430.9 |
| eventPersistMaxMs | 19 | 66.2 | 43.8 [39.6, 55.8] (indicative) | 197.1 | 198.0 [61.1, 198.0] (indicative) | 198.0 | 198.0 |
| eventPersistMs | 19 | 33.9 | 13.3 [11.3, 25.3] (indicative) | 111.5 | 181.8 [32.1, 181.8] (indicative) | 181.8 | 181.8 |
| events | 19 | 10.8 | 10.0 [9.0, 12.0] (indicative) | 19.0 | 19.0 [16.0, 19.0] (indicative) | 19.0 | 19.0 |
| executionMs | 20 | 375.7 | 88.0 [87.0, 100.0] | 418.0 | 418.0 [167.0, 5053.0] | 5053.0 | 5053.0 |
| overheadMs | 15 | 39.1 | 38.3 [20.7, 43.1] (indicative) | 73.3 | 117.5 [43.1, 117.5] (indicative) | 117.5 | 117.5 |
| queueMs | 20 | 0.2 | 0.0 [0.0, 0.0] | 1.0 | 1.0 [0.0, 1.0] | 1.0 | 1.0 |
| requestMs | 23 | 325.4 | 124.6 [109.0, 138.7] | 222.8 | 234.2 [140.7, 5081.8] | 5081.8 | 5081.8 |
| serverOverheadMs | 20 | 37.5 | 33.0 [30.0, 39.0] | 57.0 | 63.0 [46.0, 64.0] | 64.0 | 64.0 |
| streamMaxMs | 2 | 1.6 | 0.5 [0.5, 2.7] (indicative) | 2.7 | 2.7 [0.5, 2.7] (indicative) | 2.7 | 2.7 |
| streamMessages | 2 | 13.0 | 13.0 [13.0, 13.0] (indicative) | 13.0 | 13.0 [13.0, 13.0] (indicative) | 13.0 | 13.0 |
| streamMs | 2 | 0.5 | 0.4 [0.4, 0.5] (indicative) | 0.5 | 0.5 [0.4, 0.5] (indicative) | 0.5 | 0.5 |
| totalMs | 20 | 413.2 | 130.0 [121.0, 144.0] | 451.0 | 457.0 [219.0, 5077.0] | 5077.0 | 5077.0 |
| ttftMs | 20 | 50.0 | 48.0 [46.0, 50.0] | 60.0 | 62.0 [53.0, 66.0] | 66.0 | 66.0 |

### Timings, direct (passed outcomes, ms)

| Measure | n | mean | p50 [95% CI] | p90 | p95 [95% CI] | p99 | max |
|---|---|---|---|---|---|---|---|
| directMs | 15 | 137.9 | 97.4 [94.1, 101.5] (indicative) | 426.9 | 430.9 [101.9, 430.9] (indicative) | 430.9 | 430.9 |

### By probe type, garrison

| Type | n | Passed | Pass rate [95% CI] |
|---|---|---|---|
| cancel | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| codex-format | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| create-wait | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| cross-tenant | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| deadline | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| escaping | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| event-stream | 2 | 2 | 1.000 [1.000, 1.000] (indicative) |
| fixed-answer | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| harness-failure | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| idempotency | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| large-input | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| multiline | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| mux-format | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| plain-format | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| short-input | 2 | 2 | 1.000 [1.000, 1.000] (indicative) |
| structured-invalid | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| structured-output | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| structured-repair | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| truncation | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| unicode | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| unknown-agent | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |

### By category, garrison

| Category | n | Passed | Pass rate [95% CI] |
|---|---|---|---|
| failure | 2 | 2 | 1.000 [1.000, 1.000] (indicative) |
| isolation | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| lifecycle | 3 | 3 | 1.000 [1.000, 1.000] (indicative) |
| parsing | 4 | 4 | 1.000 [1.000, 1.000] (indicative) |
| prompts | 7 | 7 | 1.000 [1.000, 1.000] (indicative) |
| streaming | 2 | 2 | 1.000 [1.000, 1.000] (indicative) |
| structured | 3 | 3 | 1.000 [1.000, 1.000] (indicative) |
| validation | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |

### By probe type, direct

| Type | n | Passed | Pass rate [95% CI] |
|---|---|---|---|
| codex-format | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| create-wait | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| escaping | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| event-stream | 2 | 2 | 1.000 [1.000, 1.000] (indicative) |
| fixed-answer | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| harness-failure | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| large-input | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| multiline | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| mux-format | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| plain-format | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| short-input | 2 | 2 | 1.000 [1.000, 1.000] (indicative) |
| truncation | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| unicode | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |

### By category, direct

| Category | n | Passed | Pass rate [95% CI] |
|---|---|---|---|
| failure | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| lifecycle | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| parsing | 4 | 4 | 1.000 [1.000, 1.000] (indicative) |
| prompts | 7 | 7 | 1.000 [1.000, 1.000] (indicative) |
| streaming | 2 | 2 | 1.000 [1.000, 1.000] (indicative) |

## Published and prior baselines

| Metric | Source | Baseline | This run | Net | Note |
|---|---|---|---|---|---|
| (all) | no comparable published result | none | n/a | n/a | No public benchmark measures an agent-harness control plane (scheduling runs of headless CLI agents onto pull-based workers), so there is no published score to compare against. The closest public data, the Azure Functions and Alibaba cluster traces, are workloads without an oracle; see BENCHMARKING.md, Datasets. |
| garrison.queueMs.p50 | docs/SCALING.md, Measured results (2026-10-10) (docs/SCALING.md) | 39 | 0 | -39 | Claim latency (queued to leased) with no backlog, 0.5 s runs, 3 server replicas and 4 workers on k3d; this suite uses 1 replica and measures across all e2e probes. |
| garrison.serverOverheadMs.p50 | docs/SCALING.md, Measured results (2026-10-10) (docs/SCALING.md) | 140 | 33 | -107 | SCALING.md reports runs finishing 140 to 230 ms after their harness time with no backlog; the low end is shown. serverOverheadMs is totalMs minus executionMs. |

## Options

| Option | Value |
|---|---|
| --connection-lifetime-seconds | 30 |
| --context | (unset) |
| --corpus |  |
| --dataset | benchmarks/datasets/synthetic-fleet.json |
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
| --warmup | 1 |
| --workspace-suffix | (unset) |

