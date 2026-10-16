# Load report: synthetic-fleet (timing-lease1s-trial2-order6)

## Provenance

| Field | Value |
|---|---|
| Started (UTC) | 2026-10-16 15:17:30 |
| Finished (UTC) | 2026-10-16 15:18:01 |
| System under test | http://127.0.0.1:37800 (server 0.1.0-alpha) |
| Stack | local: timing ablation lease1s; trial=2, order=6, seed=62026; SQLite; LeaseWaitMs=1000, EventFlushIntervalMs=250, EventPollMs=250; 1 alpha + 1 beta workers x 4 slots |
| Product commit | f64960d78a59a1008a58c4c9aa01825f32bd2325-dirty (546 changed or untracked paths) |
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
| Command line | `Garrison.Benchmark load --url http://127.0.0.1:37800 --admin-key *** --stack local --stack-details "timing ablation lease1s; trial=2, order=6, seed=62026; SQLite; LeaseWaitMs=1000, EventFlushIntervalMs=250, EventPollMs=250; 1 alpha + 1 beta workers x 4 slots" --mode closed --concurrency 16 --warmup-seconds 5 --duration-seconds 25 --results-dir /Users/joelchristner/Code/Garrison/benchmarks/evidence/d062/timing-repeated --label timing-lease1s-trial2-order6 --shared-note "Garrison measurement jobs serialized; original Compose deployment and unrelated host services remained running; host load recorded per arm"` |

## Load

| Arm | Mode | Workers | Slots | Load | Started | Succeeded | Failed | Throughput (ops/s) [95% CI] | p50 (ms) | p95 [95% CI] (ms) | p99 (ms) | queue p50 (ms) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| garrison | closed | 1 | 4 | c16 | 1074 | 1074 | 0 | 42.36 [39.00, 42.62] | 375.4 | 391.5 [389.4, 395.0] | 401.9 | 282.0 |

### Database cost estimates

These divide server-wide counter deltas by successful runs and include background and failed-run work. They are not exact per-run attribution.

| Arm | Mode | DB statements / success | History header inserts / success |
|---|---|---|---|
| garrison | closed | 229.09 | 1 |

### Timings, garrison w1-c16 (successful operations, ms)

| Measure | n | mean | p50 [95% CI] | p90 | p95 [95% CI] | p99 | max |
|---|---|---|---|---|---|---|---|
| clientOverheadMs | 1074 | 301.9 | 302.4 [302.1, 302.8] | 311.3 | 317.5 [314.6, 319.5] | 326.7 | 380.2 |
| executionMs | 1074 | 73.2 | 73.0 [73.0, 73.0] | 76.0 | 77.0 [76.0, 77.0] | 81.0 | 96.0 |
| queueMs | 1074 | 281.5 | 282.0 [282.0, 283.0] | 291.0 | 296.0 [294.0, 298.0] | 305.0 | 347.0 |
| serverOverheadMs | 1074 | 298.4 | 299.0 [299.0, 299.0] | 308.0 | 314.0 [311.0, 316.0] | 324.0 | 367.0 |
| totalMs | 1074 | 371.6 | 372.0 [372.0, 373.0] | 382.0 | 388.0 [386.0, 391.0] | 399.0 | 445.0 |

| Series | Count | Total | Mean | Unit |
|---|---|---|---|---|
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/tenants/{tenantId}/agents/{agentId}/invoke",status_class="2xx",tenant="ten_mvb4312p_GhpgoocqsIdEl1C57H8"} | 1074 | 402363.5 | 374.64 | ms |
| garrison_invocation_wait_duration_seconds{result="completed",surface="rest"} | 1074 | 399943.2 | 372.39 | ms |
| garrison_application_operation_duration_seconds{component="run",operation="wait",result="ok"} | 1074 | 399938.1 | 372.38 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="total",tenant="ten_mvb4312p_GhpgoocqsIdEl1C57H8"} | 1074 | 399089.0 | 371.59 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="queue",tenant="ten_mvb4312p_GhpgoocqsIdEl1C57H8"} | 1074 | 302313.0 | 281.48 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/lease",status_class="2xx",tenant="default"} | 1107 | 98311.7 | 88.81 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="empty"} | 36 | 93031.6 | 2584.21 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="execution",tenant="ten_mvb4312p_GhpgoocqsIdEl1C57H8"} | 1074 | 78564.0 | 73.15 | ms |

## Server stage breakdown (whole run)

From /metrics before and after; server-wide, so concurrent traffic and several replicas blur it.

| Series | Count | Total | Mean | Unit |
|---|---|---|---|---|
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/tenants/{tenantId}/agents/{agentId}/invoke",status_class="2xx",tenant="ten_mvb4312p_GhpgoocqsIdEl1C57H8"} | 1289 | 485057.1 | 376.30 | ms |
| garrison_invocation_wait_duration_seconds{result="completed",surface="rest"} | 1289 | 481426.4 | 373.49 | ms |
| garrison_application_operation_duration_seconds{component="run",operation="wait",result="ok"} | 1289 | 481411.5 | 373.48 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="total",tenant="ten_mvb4312p_GhpgoocqsIdEl1C57H8"} | 1289 | 480519.0 | 372.78 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="queue",tenant="ten_mvb4312p_GhpgoocqsIdEl1C57H8"} | 1289 | 363777.0 | 282.22 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/lease",status_class="2xx",tenant="default"} | 1319 | 103310.4 | 78.32 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="empty"} | 39 | 96032.7 | 2462.38 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="execution",tenant="ten_mvb4312p_GhpgoocqsIdEl1C57H8"} | 1289 | 94245.0 | 73.11 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/watch",status_class="aborted",tenant="default"} | 1279 | 64948.0 | 50.78 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="first_token",tenant="ten_mvb4312p_GhpgoocqsIdEl1C57H8"} | 1289 | 52992.0 | 41.11 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="first_token_excl_delegation",tenant="ten_mvb4312p_GhpgoocqsIdEl1C57H8"} | 1289 | 52992.0 | 41.11 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="streaming",tenant="ten_mvb4312p_GhpgoocqsIdEl1C57H8"} | 1289 | 31185.0 | 24.19 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="assigned"} | 1280 | 6880.3 | 5.38 | ms |
| garrison_scheduler_claim_duration_seconds{result="assigned"} | 1280 | 5936.2 | 4.64 | ms |
| garrison_db_operation_duration_seconds{operation="select",provider="sqlite",result="ok",table="none"} | 5472 | 4573.7 | 0.84 | ms |

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
| --label | timing-lease1s-trial2-order6 |
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
| --stack-details | timing ablation lease1s; trial=2, order=6, seed=62026; SQLite; LeaseWaitMs=1000, EventFlushIntervalMs=250, EventPollMs=250; 1 alpha + 1 beta workers x 4 slots |
| --sut-commit | (unset) |
| --trace | (unset) |
| --url | http://127.0.0.1:37800 |
| --wait-seconds | 300 |
| --warmup-seconds | 5 |
| --worker-statefulset | garrison-worker |
| --workspace-suffix | (unset) |

