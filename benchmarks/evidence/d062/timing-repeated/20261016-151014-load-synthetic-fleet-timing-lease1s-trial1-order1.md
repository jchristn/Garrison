# Load report: synthetic-fleet (timing-lease1s-trial1-order1)

## Provenance

| Field | Value |
|---|---|
| Started (UTC) | 2026-10-16 15:10:14 |
| Finished (UTC) | 2026-10-16 15:10:45 |
| System under test | http://127.0.0.1:37800 (server 0.1.0-alpha) |
| Stack | local: timing ablation lease1s; trial=1, order=1, seed=62026; SQLite; LeaseWaitMs=1000, EventFlushIntervalMs=250, EventPollMs=250; 1 alpha + 1 beta workers x 4 slots |
| Product commit | f64960d78a59a1008a58c4c9aa01825f32bd2325-dirty (519 changed or untracked paths) |
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
| Command line | `Garrison.Benchmark load --url http://127.0.0.1:37800 --admin-key *** --stack local --stack-details "timing ablation lease1s; trial=1, order=1, seed=62026; SQLite; LeaseWaitMs=1000, EventFlushIntervalMs=250, EventPollMs=250; 1 alpha + 1 beta workers x 4 slots" --mode closed --concurrency 16 --warmup-seconds 5 --duration-seconds 25 --results-dir /Users/joelchristner/Code/Garrison/benchmarks/evidence/d062/timing-repeated --label timing-lease1s-trial1-order1 --shared-note "Garrison measurement jobs serialized; original Compose deployment and unrelated host services remained running; host load recorded per arm"` |

## Load

| Arm | Mode | Workers | Slots | Load | Started | Succeeded | Failed | Throughput (ops/s) [95% CI] | p50 (ms) | p95 [95% CI] (ms) | p99 (ms) | queue p50 (ms) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| garrison | closed | 1 | 4 | c16 | 896 | 896 | 0 | 35.27 [32.81, 35.42] | 451.7 | 465.9 [464.3, 467.3] | 472.5 | 339.0 |

### Database cost estimates

These divide server-wide counter deltas by successful runs and include background and failed-run work. They are not exact per-run attribution.

| Arm | Mode | DB statements / success | History header inserts / success |
|---|---|---|---|
| garrison | closed | 229.71 | 1 |

### Timings, garrison w1-c16 (successful operations, ms)

| Measure | n | mean | p50 [95% CI] | p90 | p95 [95% CI] | p99 | max |
|---|---|---|---|---|---|---|---|
| clientOverheadMs | 896 | 366.2 | 367.3 [367.0, 367.7] | 375.7 | 380.3 [378.3, 382.1] | 389.5 | 452.8 |
| executionMs | 896 | 84.0 | 84.0 [84.0, 84.0] | 87.0 | 88.0 [88.0, 89.0] | 92.0 | 112.0 |
| queueMs | 896 | 337.6 | 339.0 [339.0, 340.0] | 347.0 | 351.0 [349.0, 352.0] | 358.0 | 409.0 |
| serverOverheadMs | 896 | 362.8 | 364.0 [364.0, 364.0] | 372.0 | 377.0 [375.0, 379.0] | 387.0 | 440.0 |
| totalMs | 896 | 446.7 | 448.0 [448.0, 449.0] | 458.0 | 463.0 [461.0, 464.0] | 469.0 | 517.0 |

| Series | Count | Total | Mean | Unit |
|---|---|---|---|---|
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/tenants/{tenantId}/agents/{agentId}/invoke",status_class="2xx",tenant="ten_mvb3tog3_ovph6rmcMGk3DZciYAT"} | 896 | 403029.0 | 449.81 | ms |
| garrison_invocation_wait_duration_seconds{result="completed",surface="rest"} | 896 | 400878.3 | 447.41 | ms |
| garrison_application_operation_duration_seconds{component="run",operation="wait",result="ok"} | 896 | 400874.6 | 447.40 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="total",tenant="ten_mvb3tog3_ovph6rmcMGk3DZciYAT"} | 896 | 400282.0 | 446.74 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="queue",tenant="ten_mvb3tog3_ovph6rmcMGk3DZciYAT"} | 896 | 302531.0 | 337.65 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/lease",status_class="2xx",tenant="default"} | 930 | 97454.9 | 104.79 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="empty"} | 36 | 93014.0 | 2583.72 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="execution",tenant="ten_mvb3tog3_ovph6rmcMGk3DZciYAT"} | 896 | 75257.0 | 83.99 | ms |

## Server stage breakdown (whole run)

From /metrics before and after; server-wide, so concurrent traffic and several replicas blur it.

| Series | Count | Total | Mean | Unit |
|---|---|---|---|---|
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/tenants/{tenantId}/agents/{agentId}/invoke",status_class="2xx",tenant="ten_mvb3tog3_ovph6rmcMGk3DZciYAT"} | 1075 | 486143.8 | 452.23 | ms |
| garrison_invocation_wait_duration_seconds{result="completed",surface="rest"} | 1075 | 482815.7 | 449.13 | ms |
| garrison_application_operation_duration_seconds{component="run",operation="wait",result="ok"} | 1075 | 482802.2 | 449.12 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="total",tenant="ten_mvb3tog3_ovph6rmcMGk3DZciYAT"} | 1075 | 482249.0 | 448.60 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="queue",tenant="ten_mvb3tog3_ovph6rmcMGk3DZciYAT"} | 1075 | 364181.0 | 338.77 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/lease",status_class="2xx",tenant="default"} | 1107 | 102156.2 | 92.28 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="empty"} | 39 | 96015.7 | 2461.94 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="execution",tenant="ten_mvb3tog3_ovph6rmcMGk3DZciYAT"} | 1075 | 90250.0 | 83.95 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/watch",status_class="aborted",tenant="default"} | 1066 | 53962.7 | 50.62 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="first_token",tenant="ten_mvb3tog3_ovph6rmcMGk3DZciYAT"} | 1075 | 44135.0 | 41.06 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="first_token_excl_delegation",tenant="ten_mvb3tog3_ovph6rmcMGk3DZciYAT"} | 1075 | 44135.0 | 41.06 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="streaming",tenant="ten_mvb3tog3_ovph6rmcMGk3DZciYAT"} | 1075 | 27502.0 | 25.58 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="assigned"} | 1068 | 5784.6 | 5.42 | ms |
| garrison_scheduler_claim_duration_seconds{result="assigned"} | 1068 | 4941.1 | 4.63 | ms |
| garrison_db_operation_duration_seconds{operation="select",provider="sqlite",result="ok",table="none"} | 4616 | 3806.3 | 0.82 | ms |

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
| --label | timing-lease1s-trial1-order1 |
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
| --stack-details | timing ablation lease1s; trial=1, order=1, seed=62026; SQLite; LeaseWaitMs=1000, EventFlushIntervalMs=250, EventPollMs=250; 1 alpha + 1 beta workers x 4 slots |
| --sut-commit | (unset) |
| --trace | (unset) |
| --url | http://127.0.0.1:37800 |
| --wait-seconds | 300 |
| --warmup-seconds | 5 |
| --worker-statefulset | garrison-worker |
| --workspace-suffix | (unset) |

