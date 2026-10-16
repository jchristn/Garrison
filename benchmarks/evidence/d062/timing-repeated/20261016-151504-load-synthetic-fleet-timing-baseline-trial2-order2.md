# Load report: synthetic-fleet (timing-baseline-trial2-order2)

## Provenance

| Field | Value |
|---|---|
| Started (UTC) | 2026-10-16 15:15:04 |
| Finished (UTC) | 2026-10-16 15:15:36 |
| System under test | http://127.0.0.1:37800 (server 0.1.0-alpha) |
| Stack | local: timing ablation baseline; trial=2, order=2, seed=62026; SQLite; LeaseWaitMs=20000, EventFlushIntervalMs=250, EventPollMs=250; 1 alpha + 1 beta workers x 4 slots |
| Product commit | f64960d78a59a1008a58c4c9aa01825f32bd2325-dirty (538 changed or untracked paths) |
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
| Command line | `Garrison.Benchmark load --url http://127.0.0.1:37800 --admin-key *** --stack local --stack-details "timing ablation baseline; trial=2, order=2, seed=62026; SQLite; LeaseWaitMs=20000, EventFlushIntervalMs=250, EventPollMs=250; 1 alpha + 1 beta workers x 4 slots" --mode closed --concurrency 16 --warmup-seconds 5 --duration-seconds 25 --results-dir /Users/joelchristner/Code/Garrison/benchmarks/evidence/d062/timing-repeated --label timing-baseline-trial2-order2 --shared-note "Garrison measurement jobs serialized; original Compose deployment and unrelated host services remained running; host load recorded per arm"` |

## Load

| Arm | Mode | Workers | Slots | Load | Started | Succeeded | Failed | Throughput (ops/s) [95% CI] | p50 (ms) | p95 [95% CI] (ms) | p99 (ms) | queue p50 (ms) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| garrison | closed | 1 | 4 | c16 | 889 | 889 | 0 | 34.98 [32.50, 35.23] | 453.6 | 488.4 [475.4, 498.9] | 536.8 | 341.0 |

### Database cost estimates

These divide server-wide counter deltas by successful runs and include background and failed-run work. They are not exact per-run attribution.

| Arm | Mode | DB statements / success | History header inserts / success |
|---|---|---|---|
| garrison | closed | 227.37 | 1 |

### Timings, garrison w1-c16 (successful operations, ms)

| Measure | n | mean | p50 [95% CI] | p90 | p95 [95% CI] | p99 | max |
|---|---|---|---|---|---|---|---|
| clientOverheadMs | 889 | 369.1 | 368.8 [368.0, 369.5] | 382.2 | 400.1 [390.9, 410.5] | 441.3 | 456.1 |
| executionMs | 889 | 84.7 | 84.0 [84.0, 84.0] | 88.0 | 90.0 [89.0, 93.0] | 102.0 | 125.0 |
| queueMs | 889 | 340.5 | 341.0 [340.0, 341.0] | 353.0 | 366.0 [363.0, 376.0] | 408.0 | 420.0 |
| serverOverheadMs | 889 | 365.6 | 365.0 [365.0, 366.0] | 379.0 | 396.0 [388.0, 407.0] | 437.0 | 444.0 |
| totalMs | 889 | 450.3 | 450.0 [449.0, 451.0] | 466.0 | 485.0 [471.0, 494.0] | 529.0 | 540.0 |

| Series | Count | Total | Mean | Unit |
|---|---|---|---|---|
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/tenants/{tenantId}/agents/{agentId}/invoke",status_class="2xx",tenant="ten_mvb3zwxc_KEZ7RWIocipVf6lXnkQ"} | 889 | 403105.5 | 453.44 | ms |
| garrison_invocation_wait_duration_seconds{result="completed",surface="rest"} | 889 | 400882.8 | 450.94 | ms |
| garrison_application_operation_duration_seconds{component="run",operation="wait",result="ok"} | 889 | 400878.7 | 450.93 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="total",tenant="ten_mvb3zwxc_KEZ7RWIocipVf6lXnkQ"} | 889 | 400310.0 | 450.29 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="queue",tenant="ten_mvb3zwxc_KEZ7RWIocipVf6lXnkQ"} | 889 | 302667.0 | 340.46 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="execution",tenant="ten_mvb3zwxc_KEZ7RWIocipVf6lXnkQ"} | 889 | 75273.0 | 84.67 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/lease",status_class="2xx",tenant="default"} | 890 | 64555.8 | 72.53 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="empty"} | 3 | 59996.5 | 19998.83 | ms |

## Server stage breakdown (whole run)

From /metrics before and after; server-wide, so concurrent traffic and several replicas blur it.

| Series | Count | Total | Mean | Unit |
|---|---|---|---|---|
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/tenants/{tenantId}/agents/{agentId}/invoke",status_class="2xx",tenant="ten_mvb3zwxc_KEZ7RWIocipVf6lXnkQ"} | 1070 | 486272.1 | 454.46 | ms |
| garrison_invocation_wait_duration_seconds{result="completed",surface="rest"} | 1070 | 482821.6 | 451.24 | ms |
| garrison_application_operation_duration_seconds{component="run",operation="wait",result="ok"} | 1070 | 482806.9 | 451.22 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="total",tenant="ten_mvb3zwxc_KEZ7RWIocipVf6lXnkQ"} | 1070 | 482247.0 | 450.70 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="queue",tenant="ten_mvb3zwxc_KEZ7RWIocipVf6lXnkQ"} | 1070 | 364354.0 | 340.52 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="execution",tenant="ten_mvb3zwxc_KEZ7RWIocipVf6lXnkQ"} | 1070 | 90302.0 | 84.39 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/lease",status_class="2xx",tenant="default"} | 1064 | 66412.1 | 62.42 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="empty"} | 3 | 59996.5 | 19998.83 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/watch",status_class="aborted",tenant="default"} | 1060 | 54434.5 | 51.35 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="first_token",tenant="ten_mvb3zwxc_KEZ7RWIocipVf6lXnkQ"} | 1070 | 44731.0 | 41.80 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="first_token_excl_delegation",tenant="ten_mvb3zwxc_KEZ7RWIocipVf6lXnkQ"} | 1070 | 44731.0 | 41.80 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="streaming",tenant="ten_mvb3zwxc_KEZ7RWIocipVf6lXnkQ"} | 1070 | 30580.0 | 28.58 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="assigned"} | 1061 | 6047.7 | 5.70 | ms |
| garrison_scheduler_claim_duration_seconds{result="assigned"} | 1061 | 5090.6 | 4.80 | ms |
| garrison_db_operation_duration_seconds{operation="select",provider="sqlite",result="ok",table="none"} | 4298 | 3782.7 | 0.88 | ms |

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
| --label | timing-baseline-trial2-order2 |
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
| --stack-details | timing ablation baseline; trial=2, order=2, seed=62026; SQLite; LeaseWaitMs=20000, EventFlushIntervalMs=250, EventPollMs=250; 1 alpha + 1 beta workers x 4 slots |
| --sut-commit | (unset) |
| --trace | (unset) |
| --url | http://127.0.0.1:37800 |
| --wait-seconds | 300 |
| --warmup-seconds | 5 |
| --worker-statefulset | garrison-worker |
| --workspace-suffix | (unset) |

