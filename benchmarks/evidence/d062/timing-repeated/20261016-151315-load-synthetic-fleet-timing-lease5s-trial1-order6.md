# Load report: synthetic-fleet (timing-lease5s-trial1-order6)

## Provenance

| Field | Value |
|---|---|
| Started (UTC) | 2026-10-16 15:13:15 |
| Finished (UTC) | 2026-10-16 15:13:47 |
| System under test | http://127.0.0.1:37800 (server 0.1.0-alpha) |
| Stack | local: timing ablation lease5s; trial=1, order=6, seed=62026; SQLite; LeaseWaitMs=5000, EventFlushIntervalMs=250, EventPollMs=250; 1 alpha + 1 beta workers x 4 slots |
| Product commit | f64960d78a59a1008a58c4c9aa01825f32bd2325-dirty (532 changed or untracked paths) |
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
| Command line | `Garrison.Benchmark load --url http://127.0.0.1:37800 --admin-key *** --stack local --stack-details "timing ablation lease5s; trial=1, order=6, seed=62026; SQLite; LeaseWaitMs=5000, EventFlushIntervalMs=250, EventPollMs=250; 1 alpha + 1 beta workers x 4 slots" --mode closed --concurrency 16 --warmup-seconds 5 --duration-seconds 25 --results-dir /Users/joelchristner/Code/Garrison/benchmarks/evidence/d062/timing-repeated --label timing-lease5s-trial1-order6 --shared-note "Garrison measurement jobs serialized; original Compose deployment and unrelated host services remained running; host load recorded per arm"` |

## Load

| Arm | Mode | Workers | Slots | Load | Started | Succeeded | Failed | Throughput (ops/s) [95% CI] | p50 (ms) | p95 [95% CI] (ms) | p99 (ms) | queue p50 (ms) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| garrison | closed | 1 | 4 | c16 | 978 | 978 | 0 | 38.52 [35.65, 38.77] | 413.8 | 428.8 [428.0, 432.3] | 445.7 | 311.0 |

### Database cost estimates

These divide server-wide counter deltas by successful runs and include background and failed-run work. They are not exact per-run attribution.

| Arm | Mode | DB statements / success | History header inserts / success |
|---|---|---|---|
| garrison | closed | 227.64 | 1 |

### Timings, garrison w1-c16 (successful operations, ms)

| Measure | n | mean | p50 [95% CI] | p90 | p95 [95% CI] | p99 | max |
|---|---|---|---|---|---|---|---|
| clientOverheadMs | 978 | 333.7 | 334.9 [334.1, 335.5] | 346.2 | 349.1 [348.1, 352.4] | 367.1 | 426.1 |
| executionMs | 978 | 78.5 | 78.0 [78.0, 79.0] | 82.0 | 84.0 [83.0, 84.0] | 87.0 | 106.0 |
| queueMs | 978 | 309.3 | 311.0 [310.0, 311.0] | 321.0 | 324.0 [323.0, 327.0] | 341.0 | 395.0 |
| serverOverheadMs | 978 | 330.3 | 332.0 [331.0, 332.0] | 342.0 | 346.0 [345.0, 349.0] | 364.0 | 415.0 |
| totalMs | 978 | 408.8 | 411.0 [410.0, 411.0] | 422.0 | 425.0 [424.0, 429.0] | 441.0 | 495.0 |

| Series | Count | Total | Mean | Unit |
|---|---|---|---|---|
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/tenants/{tenantId}/agents/{agentId}/invoke",status_class="2xx",tenant="ten_mvb3xkmz_ikWQ2CVnXYqa8ffssz5"} | 977 | 402422.6 | 411.90 | ms |
| garrison_invocation_wait_duration_seconds{result="completed",surface="rest"} | 978 | 400522.1 | 409.53 | ms |
| garrison_application_operation_duration_seconds{component="run",operation="wait",result="ok"} | 978 | 400517.7 | 409.53 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="total",tenant="ten_mvb3xkmz_ikWQ2CVnXYqa8ffssz5"} | 978 | 399843.0 | 408.84 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="queue",tenant="ten_mvb3xkmz_ikWQ2CVnXYqa8ffssz5"} | 978 | 302525.0 | 309.33 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/lease",status_class="2xx",tenant="default"} | 985 | 94953.3 | 96.40 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="empty"} | 9 | 90000.2 | 10000.03 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="execution",tenant="ten_mvb3xkmz_ikWQ2CVnXYqa8ffssz5"} | 978 | 76807.0 | 78.53 | ms |

## Server stage breakdown (whole run)

From /metrics before and after; server-wide, so concurrent traffic and several replicas blur it.

| Series | Count | Total | Mean | Unit |
|---|---|---|---|---|
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/tenants/{tenantId}/agents/{agentId}/invoke",status_class="2xx",tenant="ten_mvb3xkmz_ikWQ2CVnXYqa8ffssz5"} | 1174 | 485523.6 | 413.56 | ms |
| garrison_invocation_wait_duration_seconds{result="completed",surface="rest"} | 1175 | 482406.9 | 410.56 | ms |
| garrison_application_operation_duration_seconds{component="run",operation="wait",result="ok"} | 1175 | 482392.5 | 410.55 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="total",tenant="ten_mvb3xkmz_ikWQ2CVnXYqa8ffssz5"} | 1175 | 481743.0 | 409.99 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="queue",tenant="ten_mvb3xkmz_ikWQ2CVnXYqa8ffssz5"} | 1175 | 364252.0 | 310.00 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/lease",status_class="2xx",tenant="default"} | 1176 | 96870.2 | 82.37 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="execution",tenant="ten_mvb3xkmz_ikWQ2CVnXYqa8ffssz5"} | 1175 | 92151.0 | 78.43 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="empty"} | 9 | 90000.2 | 10000.03 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/watch",status_class="aborted",tenant="default"} | 1166 | 59690.1 | 51.19 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="first_token",tenant="ten_mvb3xkmz_ikWQ2CVnXYqa8ffssz5"} | 1175 | 49045.0 | 41.74 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="first_token_excl_delegation",tenant="ten_mvb3xkmz_ikWQ2CVnXYqa8ffssz5"} | 1175 | 49045.0 | 41.74 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="streaming",tenant="ten_mvb3xkmz_ikWQ2CVnXYqa8ffssz5"} | 1175 | 32822.0 | 27.93 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="assigned"} | 1167 | 6470.8 | 5.54 | ms |
| garrison_scheduler_claim_duration_seconds{result="assigned"} | 1167 | 5545.0 | 4.75 | ms |
| garrison_db_operation_duration_seconds{operation="select",provider="sqlite",result="ok",table="none"} | 4774 | 4130.8 | 0.87 | ms |

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
| --label | timing-lease5s-trial1-order6 |
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
| --stack-details | timing ablation lease5s; trial=1, order=6, seed=62026; SQLite; LeaseWaitMs=5000, EventFlushIntervalMs=250, EventPollMs=250; 1 alpha + 1 beta workers x 4 slots |
| --sut-commit | (unset) |
| --trace | (unset) |
| --url | http://127.0.0.1:37800 |
| --wait-seconds | 300 |
| --warmup-seconds | 5 |
| --worker-statefulset | garrison-worker |
| --workspace-suffix | (unset) |

