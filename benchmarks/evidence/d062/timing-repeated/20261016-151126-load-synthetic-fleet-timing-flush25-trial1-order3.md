# Load report: synthetic-fleet (timing-flush25-trial1-order3)

## Provenance

| Field | Value |
|---|---|
| Started (UTC) | 2026-10-16 15:11:26 |
| Finished (UTC) | 2026-10-16 15:11:58 |
| System under test | http://127.0.0.1:37800 (server 0.1.0-alpha) |
| Stack | local: timing ablation flush25; trial=1, order=3, seed=62026; SQLite; LeaseWaitMs=20000, EventFlushIntervalMs=25, EventPollMs=250; 1 alpha + 1 beta workers x 4 slots |
| Product commit | f64960d78a59a1008a58c4c9aa01825f32bd2325-dirty (523 changed or untracked paths) |
| Harness | Garrison.Benchmark 1.0.0, commit 68bc0a61b0171c9408fdd5fc36370e7b0fc156e4-dirty |
| Machine | joels-mbp, macOS 26.6.0 (Arm64), Apple M5 Max (Arm64), 18 logical processors |
| Runtime | .NET 10.0.12 |
| HTTP client | SocketsHttpHandler, MaxConnectionsPerServer 1024, timeout 660 s, pooled connection lifetime 30 s, connect timeout 10 s |
| Dataset | synthetic-fleet (benchmarks/datasets/synthetic-fleet.json) |
| Dataset SHA-256 | 2e79613ad9cab719bd66ffaa8c3eb6ac6688c37ae25a5eae9ab23cf67cf5b52a |
| External services | none: every run uses the fake harness (garrison-fake-harness), no model or paid service |
| Shared machine | Garrison measurement jobs serialized; original Compose deployment and unrelated host services remained running; host load recorded per arm |
| Seed | 42 |
| Deterministic | no |
| Command line | `Garrison.Benchmark load --url http://127.0.0.1:37800 --admin-key *** --stack local --stack-details "timing ablation flush25; trial=1, order=3, seed=62026; SQLite; LeaseWaitMs=20000, EventFlushIntervalMs=25, EventPollMs=250; 1 alpha + 1 beta workers x 4 slots" --mode closed --concurrency 16 --warmup-seconds 5 --duration-seconds 25 --results-dir /Users/joelchristner/Code/Garrison/benchmarks/evidence/d062/timing-repeated --label timing-flush25-trial1-order3 --shared-note "Garrison measurement jobs serialized; original Compose deployment and unrelated host services remained running; host load recorded per arm"` |

## Load

| Arm | Mode | Workers | Slots | Load | Started | Succeeded | Failed | Throughput (ops/s) [95% CI] | p50 (ms) | p95 [95% CI] (ms) | p99 (ms) | queue p50 (ms) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| garrison | closed | 1 | 4 | c16 | 1050 | 1050 | 0 | 41.42 [38.12, 41.73] | 383.9 | 405.8 [402.0, 409.3] | 419.3 | 289.0 |

### Database cost estimates

These divide server-wide counter deltas by successful runs and include background and failed-run work. They are not exact per-run attribution.

| Arm | Mode | DB statements / success | History header inserts / success |
|---|---|---|---|
| garrison | closed | 238.13 | 1 |

### Timings, garrison w1-c16 (successful operations, ms)

| Measure | n | mean | p50 [95% CI] | p90 | p95 [95% CI] | p99 | max |
|---|---|---|---|---|---|---|---|
| clientOverheadMs | 1050 | 307.8 | 307.7 [307.0, 308.3] | 322.6 | 330.3 [327.0, 333.4] | 341.4 | 383.4 |
| executionMs | 1050 | 75.9 | 76.0 [76.0, 77.0] | 80.0 | 81.0 [81.0, 82.0] | 85.0 | 107.0 |
| queueMs | 1050 | 288.3 | 289.0 [288.0, 290.0] | 301.0 | 307.0 [304.0, 310.0] | 322.0 | 349.0 |
| serverOverheadMs | 1050 | 304.1 | 304.0 [304.0, 305.0] | 319.0 | 326.0 [323.0, 329.0] | 338.0 | 369.0 |
| totalMs | 1050 | 380.0 | 380.0 [379.0, 381.0] | 395.0 | 401.0 [398.0, 405.0] | 415.0 | 456.0 |

| Series | Count | Total | Mean | Unit |
|---|---|---|---|---|
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/tenants/{tenantId}/agents/{agentId}/invoke",status_class="2xx",tenant="ten_mvb3v8ir_CPYnSfupQCOVxpfka8i"} | 1050 | 402468.9 | 383.30 | ms |
| garrison_invocation_wait_duration_seconds{result="completed",surface="rest"} | 1050 | 399799.0 | 380.76 | ms |
| garrison_application_operation_duration_seconds{component="run",operation="wait",result="ok"} | 1050 | 399794.6 | 380.76 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="total",tenant="ten_mvb3v8ir_CPYnSfupQCOVxpfka8i"} | 1050 | 399010.0 | 380.01 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="queue",tenant="ten_mvb3v8ir_CPYnSfupQCOVxpfka8i"} | 1050 | 302714.0 | 288.30 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="execution",tenant="ten_mvb3v8ir_CPYnSfupQCOVxpfka8i"} | 1050 | 79704.0 | 75.91 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/lease",status_class="2xx",tenant="default"} | 1051 | 65467.0 | 62.29 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="empty"} | 3 | 59999.1 | 19999.71 | ms |

## Server stage breakdown (whole run)

From /metrics before and after; server-wide, so concurrent traffic and several replicas blur it.

| Series | Count | Total | Mean | Unit |
|---|---|---|---|---|
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/tenants/{tenantId}/agents/{agentId}/invoke",status_class="2xx",tenant="ten_mvb3v8ir_CPYnSfupQCOVxpfka8i"} | 1261 | 485199.7 | 384.77 | ms |
| garrison_invocation_wait_duration_seconds{result="completed",surface="rest"} | 1261 | 481299.7 | 381.68 | ms |
| garrison_application_operation_duration_seconds{component="run",operation="wait",result="ok"} | 1261 | 481286.7 | 381.67 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="total",tenant="ten_mvb3v8ir_CPYnSfupQCOVxpfka8i"} | 1261 | 480527.0 | 381.07 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="queue",tenant="ten_mvb3v8ir_CPYnSfupQCOVxpfka8i"} | 1261 | 364312.0 | 288.91 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="execution",tenant="ten_mvb3v8ir_CPYnSfupQCOVxpfka8i"} | 1261 | 95791.0 | 75.96 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/lease",status_class="2xx",tenant="default"} | 1255 | 67505.7 | 53.79 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/watch",status_class="aborted",tenant="default"} | 1251 | 65346.0 | 52.24 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="empty"} | 3 | 59999.1 | 19999.71 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="first_token",tenant="ten_mvb3v8ir_CPYnSfupQCOVxpfka8i"} | 1261 | 51894.0 | 41.15 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="first_token_excl_delegation",tenant="ten_mvb3v8ir_CPYnSfupQCOVxpfka8i"} | 1261 | 51894.0 | 41.15 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="streaming",tenant="ten_mvb3v8ir_CPYnSfupQCOVxpfka8i"} | 1261 | 33206.0 | 26.33 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="assigned"} | 1252 | 7091.9 | 5.66 | ms |
| garrison_scheduler_claim_duration_seconds{result="assigned"} | 1252 | 6131.5 | 4.90 | ms |
| garrison_db_operation_duration_seconds{operation="select",provider="sqlite",result="ok",table="none"} | 5058 | 4559.7 | 0.90 | ms |

## Published and prior baselines

| Metric | Source | Baseline | This run | Net | Note |
|---|---|---|---|---|---|
| (all) | no comparable published result | none | n/a | n/a | No public benchmark measures an agent-harness control plane (scheduling runs of headless CLI agents onto pull-based workers), so there is no published score to compare against. The closest public data, the Azure Functions and Alibaba cluster traces, are workloads without an oracle; see BENCHMARKING.md, Datasets. |
| load.garrison.closed.w2-c1.queueMs.p50 | docs/SCALING.md, Measured results (2026-10-10) (docs/SCALING.md) | 39 | n/a | n/a | Claim latency with no backlog (16 runs of 0.5 s on 16 slots); here one closed-loop client on 8 slots. |

## Notes

- Closed loop hides stalls (coordinated omission); use --mode open for latency claims. Open loop measures from the scheduled send time.
- Shared machine: Garrison measurement jobs serialized; original Compose deployment and unrelated host services remained running; host load recorded per arm. Latency and throughput are indicative.

## Options

| Option | Value |
|---|---|
| --agent | load-echo |
| --arms | garrison |
| --concurrency | 16 |
| --connection-lifetime-seconds | 30 |
| --context | (unset) |
| --corpus | load |
| --database-attribution | false |
| --database-attribution-seconds | 10 |
| --dataset | benchmarks/datasets/synthetic-fleet.json |
| --delay-ms | 0 |
| --duration-seconds | 25 |
| --input | load test run |
| --kubeconfig | (unset) |
| --label | timing-flush25-trial1-order3 |
| --lane-label | bench.garrison.io/lane=alpha |
| --max-connections | 1024 |
| --max-in-flight | 2000 |
| --mode | closed |
| --namespace | garrison |
| --rates | 1,2,4 |
| --ready-timeout-seconds | 120 |
| --request-timeout-seconds | 660 |
| --resamples | 2000 |
| --results-dir | /Users/joelchristner/Code/Garrison/benchmarks/evidence/d062/timing-repeated |
| --scale-workers |  |
| --seed | 42 |
| --shared-note | Garrison measurement jobs serialized; original Compose deployment and unrelated host services remained running; host load recorded per arm |
| --stack | local |
| --stack-details | timing ablation flush25; trial=1, order=3, seed=62026; SQLite; LeaseWaitMs=20000, EventFlushIntervalMs=25, EventPollMs=250; 1 alpha + 1 beta workers x 4 slots |
| --sut-commit | (unset) |
| --trace | (unset) |
| --url | http://127.0.0.1:37800 |
| --wait-seconds | 300 |
| --warmup-seconds | 5 |
| --worker-statefulset | garrison-worker |
| --workspace-suffix | (unset) |

