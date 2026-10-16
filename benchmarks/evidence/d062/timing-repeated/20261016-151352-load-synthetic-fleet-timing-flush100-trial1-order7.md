# Load report: synthetic-fleet (timing-flush100-trial1-order7)

## Provenance

| Field | Value |
|---|---|
| Started (UTC) | 2026-10-16 15:13:52 |
| Finished (UTC) | 2026-10-16 15:14:23 |
| System under test | http://127.0.0.1:37800 (server 0.1.0-alpha) |
| Stack | local: timing ablation flush100; trial=1, order=7, seed=62026; SQLite; LeaseWaitMs=20000, EventFlushIntervalMs=100, EventPollMs=250; 1 alpha + 1 beta workers x 4 slots |
| Product commit | f64960d78a59a1008a58c4c9aa01825f32bd2325-dirty (534 changed or untracked paths) |
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
| Command line | `Garrison.Benchmark load --url http://127.0.0.1:37800 --admin-key *** --stack local --stack-details "timing ablation flush100; trial=1, order=7, seed=62026; SQLite; LeaseWaitMs=20000, EventFlushIntervalMs=100, EventPollMs=250; 1 alpha + 1 beta workers x 4 slots" --mode closed --concurrency 16 --warmup-seconds 5 --duration-seconds 25 --results-dir /Users/joelchristner/Code/Garrison/benchmarks/evidence/d062/timing-repeated --label timing-flush100-trial1-order7 --shared-note "Garrison measurement jobs serialized; original Compose deployment and unrelated host services remained running; host load recorded per arm"` |

## Load

| Arm | Mode | Workers | Slots | Load | Started | Succeeded | Failed | Throughput (ops/s) [95% CI] | p50 (ms) | p95 [95% CI] (ms) | p99 (ms) | queue p50 (ms) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| garrison | closed | 1 | 4 | c16 | 887 | 887 | 0 | 34.91 [32.35, 35.23] | 453.0 | 486.2 [480.7, 489.3] | 508.5 | 341.0 |

### Database cost estimates

These divide server-wide counter deltas by successful runs and include background and failed-run work. They are not exact per-run attribution.

| Arm | Mode | DB statements / success | History header inserts / success |
|---|---|---|---|
| garrison | closed | 230.92 | 1 |

### Timings, garrison w1-c16 (successful operations, ms)

| Measure | n | mean | p50 [95% CI] | p90 | p95 [95% CI] | p99 | max |
|---|---|---|---|---|---|---|---|
| clientOverheadMs | 887 | 369.8 | 369.0 [368.4, 369.7] | 386.0 | 396.3 [393.4, 399.5] | 416.9 | 471.0 |
| executionMs | 887 | 84.9 | 85.0 [84.0, 85.0] | 89.0 | 92.0 [91.0, 93.0] | 98.0 | 106.0 |
| queueMs | 887 | 341.1 | 341.0 [340.0, 341.0] | 356.0 | 366.0 [363.0, 369.0] | 385.0 | 433.0 |
| serverOverheadMs | 887 | 366.2 | 365.0 [365.0, 366.0] | 383.0 | 393.0 [390.0, 396.0] | 414.0 | 457.0 |
| totalMs | 887 | 451.1 | 449.0 [449.0, 451.0] | 471.0 | 483.0 [477.0, 486.0] | 501.0 | 563.0 |

| Series | Count | Total | Mean | Unit |
|---|---|---|---|---|
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/tenants/{tenantId}/agents/{agentId}/invoke",status_class="2xx",tenant="ten_mvb3ycpc_8tnmUhRqhaDtPiaFIRI"} | 887 | 402971.5 | 454.31 | ms |
| garrison_invocation_wait_duration_seconds{result="completed",surface="rest"} | 887 | 400677.7 | 451.72 | ms |
| garrison_application_operation_duration_seconds{component="run",operation="wait",result="ok"} | 887 | 400673.8 | 451.72 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="total",tenant="ten_mvb3ycpc_8tnmUhRqhaDtPiaFIRI"} | 887 | 400143.0 | 451.12 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="queue",tenant="ten_mvb3ycpc_8tnmUhRqhaDtPiaFIRI"} | 887 | 302530.0 | 341.07 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="execution",tenant="ten_mvb3ycpc_8tnmUhRqhaDtPiaFIRI"} | 887 | 75291.0 | 84.88 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/lease",status_class="2xx",tenant="default"} | 888 | 64690.9 | 72.85 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="empty"} | 3 | 59997.4 | 19999.14 | ms |

## Server stage breakdown (whole run)

From /metrics before and after; server-wide, so concurrent traffic and several replicas blur it.

| Series | Count | Total | Mean | Unit |
|---|---|---|---|---|
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/tenants/{tenantId}/agents/{agentId}/invoke",status_class="2xx",tenant="ten_mvb3ycpc_8tnmUhRqhaDtPiaFIRI"} | 1061 | 486492.5 | 458.52 | ms |
| garrison_invocation_wait_duration_seconds{result="completed",surface="rest"} | 1061 | 483011.7 | 455.24 | ms |
| garrison_application_operation_duration_seconds{component="run",operation="wait",result="ok"} | 1061 | 482998.3 | 455.23 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="total",tenant="ten_mvb3ycpc_8tnmUhRqhaDtPiaFIRI"} | 1061 | 482529.0 | 454.79 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="queue",tenant="ten_mvb3ycpc_8tnmUhRqhaDtPiaFIRI"} | 1061 | 364463.0 | 343.51 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="execution",tenant="ten_mvb3ycpc_8tnmUhRqhaDtPiaFIRI"} | 1061 | 90596.0 | 85.39 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/lease",status_class="2xx",tenant="default"} | 1056 | 66496.3 | 62.97 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="empty"} | 3 | 59997.4 | 19999.14 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/watch",status_class="aborted",tenant="default"} | 1052 | 53768.1 | 51.11 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="first_token",tenant="ten_mvb3ycpc_8tnmUhRqhaDtPiaFIRI"} | 1061 | 45830.0 | 43.20 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="first_token_excl_delegation",tenant="ten_mvb3ycpc_8tnmUhRqhaDtPiaFIRI"} | 1061 | 45830.0 | 43.20 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="streaming",tenant="ten_mvb3ycpc_8tnmUhRqhaDtPiaFIRI"} | 1061 | 30007.0 | 28.28 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="assigned"} | 1053 | 6135.6 | 5.83 | ms |
| garrison_scheduler_claim_duration_seconds{result="assigned"} | 1053 | 5203.3 | 4.94 | ms |
| garrison_db_operation_duration_seconds{operation="select",provider="sqlite",result="ok",table="none"} | 4262 | 3741.9 | 0.88 | ms |

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
| --label | timing-flush100-trial1-order7 |
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
| --stack-details | timing ablation flush100; trial=1, order=7, seed=62026; SQLite; LeaseWaitMs=20000, EventFlushIntervalMs=100, EventPollMs=250; 1 alpha + 1 beta workers x 4 slots |
| --sut-commit | (unset) |
| --trace | (unset) |
| --url | http://127.0.0.1:37800 |
| --wait-seconds | 300 |
| --warmup-seconds | 5 |
| --worker-statefulset | garrison-worker |
| --workspace-suffix | (unset) |

