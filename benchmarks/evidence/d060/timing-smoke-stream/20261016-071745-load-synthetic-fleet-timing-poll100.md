# Load report: synthetic-fleet (timing-poll100)

## Provenance

| Field | Value |
|---|---|
| Started (UTC) | 2026-10-16 07:17:45 |
| Finished (UTC) | 2026-10-16 07:17:47 |
| System under test | http://127.0.0.1:37800 (server 0.1.0-alpha) |
| Stack | local: timing ablation poll100; SQLite; LeaseWaitMs=20000, EventFlushIntervalMs=250, EventPollMs=100; 1 alpha + 0 beta workers x 4 slots |
| Product commit | f64960d78a59a1008a58c4c9aa01825f32bd2325-dirty (383 changed or untracked paths) |
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
| Command line | `Garrison.Benchmark load --url http://127.0.0.1:37800 --admin-key *** --stack local --stack-details "timing ablation poll100; SQLite; LeaseWaitMs=20000, EventFlushIntervalMs=250, EventPollMs=100; 1 alpha + 0 beta workers x 4 slots" --mode closed --concurrency 1 --warmup-seconds 0 --duration-seconds 1 --label timing-poll100 --results-dir benchmarks/evidence/d060/timing-smoke-stream` |

## Load

| Arm | Mode | Workers | Slots | Load | Started | Succeeded | Failed | Throughput (ops/s) [95% CI] | p50 (ms) | p95 [95% CI] (ms) | p99 (ms) | queue p50 (ms) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| garrison | closed | 1 | 4 | c1 | 9 | 9 | 0 | 8.61 [1.00, 8.00] | 101.9 | 228.7 [107.1, 228.7] (indicative) | 228.7 | 1.0 |

### Database cost estimates

These divide server-wide counter deltas by successful runs and include background and failed-run work. They are not exact per-run attribution.

| Arm | Mode | DB statements / success | History header inserts / success |
|---|---|---|---|
| garrison | closed | 219 | 1.11 |

### Timings, garrison w1-c1 (successful operations, ms)

| Measure | n | mean | p50 [95% CI] | p90 | p95 [95% CI] | p99 | max |
|---|---|---|---|---|---|---|---|
| clientOverheadMs | 9 | 42.3 | 27.3 [25.6, 37.4] (indicative) | 153.7 | 153.7 [27.9, 153.7] (indicative) | 153.7 | 153.7 |
| executionMs | 9 | 73.8 | 74.0 [71.0, 77.0] (indicative) | 80.0 | 80.0 [75.0, 80.0] (indicative) | 80.0 | 80.0 |
| queueMs | 9 | 2.8 | 1.0 [1.0, 1.0] (indicative) | 17.0 | 17.0 [1.0, 17.0] (indicative) | 17.0 | 17.0 |
| serverOverheadMs | 9 | 34.9 | 24.0 [23.0, 27.0] (indicative) | 122.0 | 122.0 [24.0, 122.0] (indicative) | 122.0 | 122.0 |
| totalMs | 9 | 108.7 | 99.0 [94.0, 100.0] (indicative) | 197.0 | 197.0 [99.0, 197.0] (indicative) | 197.0 | 197.0 |

| Series | Count | Total | Mean | Unit |
|---|---|---|---|---|
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/lease",status_class="2xx",tenant="default"} | 9 | 1832.1 | 203.57 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="assigned"} | 9 | 1814.6 | 201.63 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/tenants/{tenantId}/agents/{agentId}/invoke",status_class="2xx",tenant="ten_mvamy2v3_DOyQueZjczs83258TNc"} | 9 | 1033.9 | 114.88 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/watch",status_class="aborted",tenant="default"} | 8 | 1022.6 | 127.83 | ms |
| garrison_invocation_wait_duration_seconds{result="completed",surface="rest"} | 9 | 980.3 | 108.92 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="total",tenant="ten_mvamy2v3_DOyQueZjczs83258TNc"} | 9 | 978.0 | 108.67 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="execution",tenant="ten_mvamy2v3_DOyQueZjczs83258TNc"} | 9 | 664.0 | 73.78 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="first_token",tenant="ten_mvamy2v3_DOyQueZjczs83258TNc"} | 9 | 363.0 | 40.33 | ms |

## Server stage breakdown (whole run)

From /metrics before and after; server-wide, so concurrent traffic and several replicas blur it.

| Series | Count | Total | Mean | Unit |
|---|---|---|---|---|
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/lease",status_class="2xx",tenant="default"} | 9 | 1832.1 | 203.57 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="assigned"} | 9 | 1814.6 | 201.63 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/tenants/{tenantId}/agents/{agentId}/invoke",status_class="2xx",tenant="ten_mvamy2v3_DOyQueZjczs83258TNc"} | 9 | 1033.9 | 114.88 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/watch",status_class="aborted",tenant="default"} | 8 | 1022.6 | 127.83 | ms |
| garrison_invocation_wait_duration_seconds{result="completed",surface="rest"} | 9 | 980.3 | 108.92 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="total",tenant="ten_mvamy2v3_DOyQueZjczs83258TNc"} | 9 | 978.0 | 108.67 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="execution",tenant="ten_mvamy2v3_DOyQueZjczs83258TNc"} | 9 | 664.0 | 73.78 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="first_token",tenant="ten_mvamy2v3_DOyQueZjczs83258TNc"} | 9 | 363.0 | 40.33 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="first_token_excl_delegation",tenant="ten_mvamy2v3_DOyQueZjczs83258TNc"} | 9 | 363.0 | 40.33 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="streaming",tenant="ten_mvamy2v3_DOyQueZjczs83258TNc"} | 9 | 235.0 | 26.11 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="startup",tenant="ten_mvamy2v3_DOyQueZjczs83258TNc"} | 9 | 66.0 | 7.33 | ms |
| garrison_scheduler_claim_duration_seconds{result="assigned"} | 9 | 52.1 | 5.79 | ms |
| garrison_compile_duration_seconds{agent="load-echo",harness="Generic",result="ok"} | 9 | 34.9 | 3.88 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="none",stage="compile",tenant="ten_mvamy2v3_DOyQueZjczs83258TNc"} | 9 | 30.6 | 3.40 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="queue",tenant="ten_mvamy2v3_DOyQueZjczs83258TNc"} | 9 | 25.0 | 2.78 | ms |

## Published and prior baselines

| Metric | Source | Baseline | This run | Net | Note |
|---|---|---|---|---|---|
| (all) | no comparable published result | none | n/a | n/a | No public benchmark measures an agent-harness control plane (scheduling runs of headless CLI agents onto pull-based workers), so there is no published score to compare against. The closest public data, the Azure Functions and Alibaba cluster traces, are workloads without an oracle; see BENCHMARKING.md, Datasets. |
| load.garrison.closed.w2-c1.queueMs.p50 | docs/SCALING.md, Measured results (2026-10-10) (docs/SCALING.md) | 39 | n/a | n/a | Claim latency with no backlog (16 runs of 0.5 s on 16 slots); here one closed-loop client on 8 slots. |

## Notes

- Closed loop hides stalls (coordinated omission); use --mode open for latency claims. Open loop measures from the scheduled send time.

## Options

| Option | Value |
|---|---|
| --agent | load-echo |
| --arms | garrison |
| --concurrency | 1 |
| --connection-lifetime-seconds | 30 |
| --context | (unset) |
| --corpus | load |
| --dataset | benchmarks/datasets/synthetic-fleet.json |
| --delay-ms | 0 |
| --duration-seconds | 1 |
| --input | load test run |
| --kubeconfig | (unset) |
| --label | timing-poll100 |
| --lane-label | bench.garrison.io/lane=alpha |
| --max-connections | 1024 |
| --max-in-flight | 2000 |
| --mode | closed |
| --namespace | garrison |
| --rates | 1,2,4 |
| --ready-timeout-seconds | 120 |
| --request-timeout-seconds | 660 |
| --resamples | 2000 |
| --results-dir | benchmarks/evidence/d060/timing-smoke-stream |
| --scale-workers |  |
| --seed | 42 |
| --shared-note | (unset) |
| --stack | local |
| --stack-details | timing ablation poll100; SQLite; LeaseWaitMs=20000, EventFlushIntervalMs=250, EventPollMs=100; 1 alpha + 0 beta workers x 4 slots |
| --sut-commit | (unset) |
| --trace | (unset) |
| --url | http://127.0.0.1:37800 |
| --wait-seconds | 300 |
| --warmup-seconds | 0 |
| --worker-statefulset | garrison-worker |
| --workspace-suffix | (unset) |

