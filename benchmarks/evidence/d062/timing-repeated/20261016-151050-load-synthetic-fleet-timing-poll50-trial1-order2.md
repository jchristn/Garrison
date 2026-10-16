# Load report: synthetic-fleet (timing-poll50-trial1-order2)

## Provenance

| Field | Value |
|---|---|
| Started (UTC) | 2026-10-16 15:10:50 |
| Finished (UTC) | 2026-10-16 15:11:22 |
| System under test | http://127.0.0.1:37800 (server 0.1.0-alpha) |
| Stack | local: timing ablation poll50; trial=1, order=2, seed=62026; SQLite; LeaseWaitMs=20000, EventFlushIntervalMs=250, EventPollMs=50; 1 alpha + 1 beta workers x 4 slots |
| Product commit | f64960d78a59a1008a58c4c9aa01825f32bd2325-dirty (521 changed or untracked paths) |
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
| Command line | `Garrison.Benchmark load --url http://127.0.0.1:37800 --admin-key *** --stack local --stack-details "timing ablation poll50; trial=1, order=2, seed=62026; SQLite; LeaseWaitMs=20000, EventFlushIntervalMs=250, EventPollMs=50; 1 alpha + 1 beta workers x 4 slots" --mode closed --concurrency 16 --warmup-seconds 5 --duration-seconds 25 --results-dir /Users/joelchristner/Code/Garrison/benchmarks/evidence/d062/timing-repeated --label timing-poll50-trial1-order2 --shared-note "Garrison measurement jobs serialized; original Compose deployment and unrelated host services remained running; host load recorded per arm"` |

## Load

| Arm | Mode | Workers | Slots | Load | Started | Succeeded | Failed | Throughput (ops/s) [95% CI] | p50 (ms) | p95 [95% CI] (ms) | p99 (ms) | queue p50 (ms) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| garrison | closed | 1 | 4 | c16 | 955 | 955 | 0 | 37.59 [34.77, 37.92] | 422.4 | 439.2 [437.7, 440.5] | 457.1 | 317.0 |

### Database cost estimates

These divide server-wide counter deltas by successful runs and include background and failed-run work. They are not exact per-run attribution.

| Arm | Mode | DB statements / success | History header inserts / success |
|---|---|---|---|
| garrison | closed | 227.27 | 1 |

### Timings, garrison w1-c16 (successful operations, ms)

| Measure | n | mean | p50 [95% CI] | p90 | p95 [95% CI] | p99 | max |
|---|---|---|---|---|---|---|---|
| clientOverheadMs | 955 | 343.3 | 343.5 [343.2, 343.8] | 354.5 | 357.9 [356.8, 359.1] | 374.1 | 438.1 |
| executionMs | 955 | 79.2 | 79.0 [79.0, 79.0] | 82.0 | 83.0 [83.0, 84.0] | 89.0 | 104.0 |
| queueMs | 955 | 316.9 | 317.0 [317.0, 318.0] | 328.0 | 331.0 [330.0, 332.0] | 347.0 | 401.0 |
| serverOverheadMs | 955 | 339.9 | 340.0 [340.0, 341.0] | 351.0 | 354.0 [353.0, 356.0] | 371.0 | 425.0 |
| totalMs | 955 | 419.1 | 419.0 [419.0, 420.0] | 432.0 | 436.0 [434.0, 437.0] | 453.0 | 505.0 |

| Series | Count | Total | Mean | Unit |
|---|---|---|---|---|
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/tenants/{tenantId}/agents/{agentId}/invoke",status_class="2xx",tenant="ten_mvb3ughc_Dg7MZ2FkaDc2wOvybb5"} | 955 | 403107.2 | 422.10 | ms |
| garrison_invocation_wait_duration_seconds{result="completed",surface="rest"} | 955 | 400858.1 | 419.75 | ms |
| garrison_application_operation_duration_seconds{component="run",operation="wait",result="ok"} | 955 | 400853.5 | 419.74 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="total",tenant="ten_mvb3ughc_Dg7MZ2FkaDc2wOvybb5"} | 955 | 400193.0 | 419.05 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="queue",tenant="ten_mvb3ughc_Dg7MZ2FkaDc2wOvybb5"} | 955 | 302622.0 | 316.88 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="execution",tenant="ten_mvb3ughc_Dg7MZ2FkaDc2wOvybb5"} | 955 | 75599.0 | 79.16 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/lease",status_class="2xx",tenant="default"} | 956 | 64703.5 | 67.68 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="empty"} | 3 | 59995.0 | 19998.33 | ms |

## Server stage breakdown (whole run)

From /metrics before and after; server-wide, so concurrent traffic and several replicas blur it.

| Series | Count | Total | Mean | Unit |
|---|---|---|---|---|
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/tenants/{tenantId}/agents/{agentId}/invoke",status_class="2xx",tenant="ten_mvb3ughc_Dg7MZ2FkaDc2wOvybb5"} | 1142 | 486378.9 | 425.90 | ms |
| garrison_invocation_wait_duration_seconds{result="completed",surface="rest"} | 1142 | 482818.7 | 422.78 | ms |
| garrison_application_operation_duration_seconds{component="run",operation="wait",result="ok"} | 1142 | 482806.4 | 422.77 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="total",tenant="ten_mvb3ughc_Dg7MZ2FkaDc2wOvybb5"} | 1142 | 482201.0 | 422.24 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="queue",tenant="ten_mvb3ughc_Dg7MZ2FkaDc2wOvybb5"} | 1142 | 364405.0 | 319.09 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="execution",tenant="ten_mvb3ughc_Dg7MZ2FkaDc2wOvybb5"} | 1142 | 90641.0 | 79.37 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/lease",status_class="2xx",tenant="default"} | 1137 | 66600.4 | 58.58 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="empty"} | 3 | 59995.0 | 19998.33 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/watch",status_class="aborted",tenant="default"} | 1133 | 58075.1 | 51.26 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="first_token",tenant="ten_mvb3ughc_Dg7MZ2FkaDc2wOvybb5"} | 1142 | 46963.0 | 41.12 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="first_token_excl_delegation",tenant="ten_mvb3ughc_Dg7MZ2FkaDc2wOvybb5"} | 1142 | 46963.0 | 41.12 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="streaming",tenant="ten_mvb3ughc_Dg7MZ2FkaDc2wOvybb5"} | 1142 | 32358.0 | 28.33 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="assigned"} | 1134 | 6224.8 | 5.49 | ms |
| garrison_scheduler_claim_duration_seconds{result="assigned"} | 1134 | 5287.5 | 4.66 | ms |
| garrison_db_operation_duration_seconds{operation="select",provider="sqlite",result="ok",table="none"} | 4586 | 3845.8 | 0.84 | ms |

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
| --label | timing-poll50-trial1-order2 |
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
| --stack-details | timing ablation poll50; trial=1, order=2, seed=62026; SQLite; LeaseWaitMs=20000, EventFlushIntervalMs=250, EventPollMs=50; 1 alpha + 1 beta workers x 4 slots |
| --sut-commit | (unset) |
| --trace | (unset) |
| --url | http://127.0.0.1:37800 |
| --wait-seconds | 300 |
| --warmup-seconds | 5 |
| --worker-statefulset | garrison-worker |
| --workspace-suffix | (unset) |

