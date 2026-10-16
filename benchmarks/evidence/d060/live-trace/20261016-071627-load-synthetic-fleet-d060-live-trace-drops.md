# Load report: synthetic-fleet (d060-live-trace-drops)

## Provenance

| Field | Value |
|---|---|
| Started (UTC) | 2026-10-16 07:16:27 |
| Finished (UTC) | 2026-10-16 07:16:30 |
| System under test | http://127.0.0.1:37800 (server 0.1.0-alpha) |
| Stack | local: local processes from the working tree: 1 server (Sqlite), 1 alpha + 1 beta workers x 4 slots |
| Product commit | f64960d78a59a1008a58c4c9aa01825f32bd2325-dirty (355 changed or untracked paths) |
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
| Command line | `Garrison.Benchmark load --url http://127.0.0.1:37800 --stack local --fake-harness /tmp/garrison-live-perf-artifacts/bin/Garrison.FakeHarness/release_net10.0/garrison-fake-harness.dll --stack-details "local processes from the working tree: 1 server (Sqlite), 1 alpha + 1 beta workers x 4 slots" --mode trace --trace benchmarks/evidence/d060/trace-live.json --duration-seconds 4 --warmup-seconds 0 --max-in-flight 1 --lane-label bench.garrison.io/lane=alpha --label d060-live-trace-drops --results-dir benchmarks/evidence/d060/live-trace` |

## Load

| Arm | Mode | Workers | Slots | Load | Started | Succeeded | Failed | Throughput (ops/s) [95% CI] | p50 (ms) | p95 [95% CI] (ms) | p99 (ms) | queue p50 (ms) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| garrison | trace | 1 | 4 | 4/s | 16 | 7 | 9 | 1.75 [1.00, 2.50] | 99.0 | 222.4 [102.5, 222.4] (indicative) | 222.4 | 1.0 |

### Database cost estimates

These divide server-wide counter deltas by successful runs and include background and failed-run work. They are not exact per-run attribution.

| Arm | Mode | DB statements / success | History header inserts / success |
|---|---|---|---|
| garrison | trace | 228 | 1.14 |

### Failures by kind

| Arm | Level | Kind | Count |
|---|---|---|---|
| garrison | w1-r4 | client: more than 1 in flight | 9 |

### Timings, garrison w1-r4 (successful operations, ms)

| Measure | n | mean | p50 [95% CI] | p90 | p95 [95% CI] | p99 | max |
|---|---|---|---|---|---|---|---|
| clientOverheadMs | 7 | 41.8 | 22.5 [22.0, 30.8] (indicative) | 147.4 | 147.4 [25.5, 147.4] (indicative) | 147.4 | 147.4 |
| executionMs | 7 | 73.3 | 74.0 [69.0, 77.0] (indicative) | 77.0 | 77.0 [75.0, 77.0] (indicative) | 77.0 | 77.0 |
| queueMs | 7 | 3.9 | 1.0 [1.0, 9.0] (indicative) | 13.0 | 13.0 [1.0, 13.0] (indicative) | 13.0 | 13.0 |
| serverOverheadMs | 7 | 33.7 | 19.0 [18.0, 26.0] (indicative) | 116.0 | 116.0 [21.0, 116.0] (indicative) | 116.0 | 116.0 |
| totalMs | 7 | 107.0 | 95.0 [87.0, 100.0] (indicative) | 191.0 | 191.0 [98.0, 191.0] (indicative) | 191.0 | 191.0 |

| Series | Count | Total | Mean | Unit |
|---|---|---|---|---|
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/lease",status_class="2xx",tenant="default"} | 7 | 3871.5 | 553.07 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="assigned"} | 7 | 3855.2 | 550.74 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/watch",status_class="aborted",tenant="default"} | 6 | 2994.9 | 499.14 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/tenants/{tenantId}/agents/{agentId}/invoke",status_class="2xx",tenant="ten_mvamweb5_WfuDS5hrE1EkYmTzYDJ"} | 7 | 787.6 | 112.51 | ms |
| garrison_invocation_wait_duration_seconds{result="completed",surface="rest"} | 7 | 751.4 | 107.34 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="total",tenant="ten_mvamweb5_WfuDS5hrE1EkYmTzYDJ"} | 7 | 749.0 | 107.00 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="execution",tenant="ten_mvamweb5_WfuDS5hrE1EkYmTzYDJ"} | 7 | 513.0 | 73.29 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="first_token",tenant="ten_mvamweb5_WfuDS5hrE1EkYmTzYDJ"} | 7 | 285.0 | 40.71 | ms |

## Server stage breakdown (whole run)

From /metrics before and after; server-wide, so concurrent traffic and several replicas blur it.

| Series | Count | Total | Mean | Unit |
|---|---|---|---|---|
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/lease",status_class="2xx",tenant="default"} | 7 | 3871.5 | 553.07 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="assigned"} | 7 | 3855.2 | 550.74 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/watch",status_class="aborted",tenant="default"} | 6 | 2994.9 | 499.14 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/tenants/{tenantId}/agents/{agentId}/invoke",status_class="2xx",tenant="ten_mvamweb5_WfuDS5hrE1EkYmTzYDJ"} | 7 | 787.6 | 112.51 | ms |
| garrison_invocation_wait_duration_seconds{result="completed",surface="rest"} | 7 | 751.4 | 107.34 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="total",tenant="ten_mvamweb5_WfuDS5hrE1EkYmTzYDJ"} | 7 | 749.0 | 107.00 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="execution",tenant="ten_mvamweb5_WfuDS5hrE1EkYmTzYDJ"} | 7 | 513.0 | 73.29 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="first_token",tenant="ten_mvamweb5_WfuDS5hrE1EkYmTzYDJ"} | 7 | 285.0 | 40.71 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="first_token_excl_delegation",tenant="ten_mvamweb5_WfuDS5hrE1EkYmTzYDJ"} | 7 | 285.0 | 40.71 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="streaming",tenant="ten_mvamweb5_WfuDS5hrE1EkYmTzYDJ"} | 7 | 182.0 | 26.00 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="startup",tenant="ten_mvamweb5_WfuDS5hrE1EkYmTzYDJ"} | 7 | 68.0 | 9.71 | ms |
| garrison_scheduler_claim_duration_seconds{result="assigned"} | 7 | 57.1 | 8.16 | ms |
| garrison_compile_duration_seconds{agent="load-echo",harness="Generic",result="ok"} | 7 | 35.6 | 5.09 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="none",stage="compile",tenant="ten_mvamweb5_WfuDS5hrE1EkYmTzYDJ"} | 7 | 31.8 | 4.54 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="queue",tenant="ten_mvamweb5_WfuDS5hrE1EkYmTzYDJ"} | 7 | 27.0 | 3.86 | ms |

## Published and prior baselines

| Metric | Source | Baseline | This run | Net | Note |
|---|---|---|---|---|---|
| (all) | no comparable published result | none | n/a | n/a | No public benchmark measures an agent-harness control plane (scheduling runs of headless CLI agents onto pull-based workers), so there is no published score to compare against. The closest public data, the Azure Functions and Alibaba cluster traces, are workloads without an oracle; see BENCHMARKING.md, Datasets. |
| load.garrison.closed.w2-c1.queueMs.p50 | docs/SCALING.md, Measured results (2026-10-10) (docs/SCALING.md) | 39 | n/a | n/a | Claim latency with no backlog (16 runs of 0.5 s on 16 slots); here one closed-loop client on 8 slots. |

## Notes

- Trace source /Users/joelchristner/Code/Garrison/benchmarks/evidence/d060/trace-live.csv; source SHA-256 e97c5d706d105de475d1a3dc4530969a55373ed65f033944445fdde4fb8b8ddc; prepared trace SHA-256 7217197530e9d358230f82bf16a28afb3c6619a024d3dd34b1b03bd7f3c86e4c; 18 arrivals; offsets beyond the measured duration are not sent; no looping or jitter.
- Closed loop hides stalls (coordinated omission); use --mode open for latency claims. Open loop measures from the scheduled send time.

## Options

| Option | Value |
|---|---|
| --agent | load-echo |
| --arms | garrison |
| --concurrency | 1,4,8,16 |
| --connection-lifetime-seconds | 30 |
| --context | (unset) |
| --corpus | load |
| --dataset | benchmarks/datasets/synthetic-fleet.json |
| --delay-ms | 0 |
| --duration-seconds | 4 |
| --input | load test run |
| --kubeconfig | (unset) |
| --label | d060-live-trace-drops |
| --lane-label | bench.garrison.io/lane=alpha |
| --max-connections | 1024 |
| --max-in-flight | 1 |
| --mode | trace |
| --namespace | garrison |
| --rates | 1,2,4 |
| --ready-timeout-seconds | 120 |
| --request-timeout-seconds | 660 |
| --resamples | 2000 |
| --results-dir | benchmarks/evidence/d060/live-trace |
| --scale-workers |  |
| --seed | 42 |
| --shared-note | (unset) |
| --stack | local |
| --stack-details | local processes from the working tree: 1 server (Sqlite), 1 alpha + 1 beta workers x 4 slots |
| --sut-commit | (unset) |
| --trace | benchmarks/evidence/d060/trace-live.json |
| --url | http://127.0.0.1:37800 |
| --wait-seconds | 300 |
| --warmup-seconds | 0 |
| --worker-statefulset | garrison-worker |
| --workspace-suffix | (unset) |

