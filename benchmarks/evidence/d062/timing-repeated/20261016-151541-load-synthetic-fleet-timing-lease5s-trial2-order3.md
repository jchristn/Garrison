# Load report: synthetic-fleet (timing-lease5s-trial2-order3)

## Provenance

| Field | Value |
|---|---|
| Started (UTC) | 2026-10-16 15:15:41 |
| Finished (UTC) | 2026-10-16 15:16:13 |
| System under test | http://127.0.0.1:37800 (server 0.1.0-alpha) |
| Stack | local: timing ablation lease5s; trial=2, order=3, seed=62026; SQLite; LeaseWaitMs=5000, EventFlushIntervalMs=250, EventPollMs=250; 1 alpha + 1 beta workers x 4 slots |
| Product commit | f64960d78a59a1008a58c4c9aa01825f32bd2325-dirty (540 changed or untracked paths) |
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
| Command line | `Garrison.Benchmark load --url http://127.0.0.1:37800 --admin-key *** --stack local --stack-details "timing ablation lease5s; trial=2, order=3, seed=62026; SQLite; LeaseWaitMs=5000, EventFlushIntervalMs=250, EventPollMs=250; 1 alpha + 1 beta workers x 4 slots" --mode closed --concurrency 16 --warmup-seconds 5 --duration-seconds 25 --results-dir /Users/joelchristner/Code/Garrison/benchmarks/evidence/d062/timing-repeated --label timing-lease5s-trial2-order3 --shared-note "Garrison measurement jobs serialized; original Compose deployment and unrelated host services remained running; host load recorded per arm"` |

## Load

| Arm | Mode | Workers | Slots | Load | Started | Succeeded | Failed | Throughput (ops/s) [95% CI] | p50 (ms) | p95 [95% CI] (ms) | p99 (ms) | queue p50 (ms) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| garrison | closed | 1 | 4 | c16 | 875 | 875 | 0 | 34.43 [31.96, 34.65] | 460.8 | 480.6 [477.6, 482.2] | 492.3 | 346.0 |

### Database cost estimates

These divide server-wide counter deltas by successful runs and include background and failed-run work. They are not exact per-run attribution.

| Arm | Mode | DB statements / success | History header inserts / success |
|---|---|---|---|
| garrison | closed | 227.82 | 1 |

### Timings, garrison w1-c16 (successful operations, ms)

| Measure | n | mean | p50 [95% CI] | p90 | p95 [95% CI] | p99 | max |
|---|---|---|---|---|---|---|---|
| clientOverheadMs | 875 | 375.3 | 375.1 [374.7, 375.8] | 388.0 | 394.0 [391.6, 397.4] | 410.2 | 480.8 |
| executionMs | 875 | 85.6 | 86.0 [86.0, 86.0] | 89.0 | 91.0 [90.0, 92.0] | 98.0 | 106.0 |
| queueMs | 875 | 345.8 | 346.0 [346.0, 347.0] | 358.0 | 363.0 [361.0, 365.0] | 374.0 | 441.0 |
| serverOverheadMs | 875 | 371.9 | 372.0 [371.0, 372.0] | 385.0 | 391.0 [388.0, 394.0] | 406.0 | 468.0 |
| totalMs | 875 | 457.6 | 458.0 [457.0, 458.0] | 472.0 | 477.0 [474.0, 479.0] | 488.0 | 555.0 |

| Series | Count | Total | Mean | Unit |
|---|---|---|---|---|
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/tenants/{tenantId}/agents/{agentId}/invoke",status_class="2xx",tenant="ten_mvb40p08_W3bx2Q3k0icbVDsIJ8o"} | 875 | 403047.6 | 460.63 | ms |
| garrison_invocation_wait_duration_seconds{result="completed",surface="rest"} | 875 | 400993.9 | 458.28 | ms |
| garrison_application_operation_duration_seconds{component="run",operation="wait",result="ok"} | 875 | 400990.1 | 458.27 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="total",tenant="ten_mvb40p08_W3bx2Q3k0icbVDsIJ8o"} | 875 | 400364.0 | 457.56 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="queue",tenant="ten_mvb40p08_W3bx2Q3k0icbVDsIJ8o"} | 875 | 302593.0 | 345.82 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/lease",status_class="2xx",tenant="default"} | 882 | 94316.7 | 106.94 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="empty"} | 9 | 90005.2 | 10000.57 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="execution",tenant="ten_mvb40p08_W3bx2Q3k0icbVDsIJ8o"} | 875 | 74935.0 | 85.64 | ms |

## Server stage breakdown (whole run)

From /metrics before and after; server-wide, so concurrent traffic and several replicas blur it.

| Series | Count | Total | Mean | Unit |
|---|---|---|---|---|
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/tenants/{tenantId}/agents/{agentId}/invoke",status_class="2xx",tenant="ten_mvb40p08_W3bx2Q3k0icbVDsIJ8o"} | 1050 | 486318.2 | 463.16 | ms |
| garrison_invocation_wait_duration_seconds{result="completed",surface="rest"} | 1050 | 483135.4 | 460.13 | ms |
| garrison_application_operation_duration_seconds{component="run",operation="wait",result="ok"} | 1050 | 483121.2 | 460.12 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="total",tenant="ten_mvb40p08_W3bx2Q3k0icbVDsIJ8o"} | 1050 | 482536.0 | 459.56 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="queue",tenant="ten_mvb40p08_W3bx2Q3k0icbVDsIJ8o"} | 1050 | 364414.0 | 347.06 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/lease",status_class="2xx",tenant="default"} | 1050 | 96012.8 | 91.44 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="empty"} | 9 | 90005.2 | 10000.57 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="execution",tenant="ten_mvb40p08_W3bx2Q3k0icbVDsIJ8o"} | 1050 | 89830.0 | 85.55 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/watch",status_class="aborted",tenant="default"} | 1040 | 53255.0 | 51.21 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="first_token",tenant="ten_mvb40p08_W3bx2Q3k0icbVDsIJ8o"} | 1050 | 43314.0 | 41.25 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="first_token_excl_delegation",tenant="ten_mvb40p08_W3bx2Q3k0icbVDsIJ8o"} | 1050 | 43314.0 | 41.25 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="streaming",tenant="ten_mvb40p08_W3bx2Q3k0icbVDsIJ8o"} | 1050 | 30376.0 | 28.93 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="assigned"} | 1041 | 5658.5 | 5.44 | ms |
| garrison_scheduler_claim_duration_seconds{result="assigned"} | 1041 | 4805.5 | 4.62 | ms |
| garrison_db_operation_duration_seconds{operation="select",provider="sqlite",result="ok",table="none"} | 4266 | 3585.6 | 0.84 | ms |

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
| --label | timing-lease5s-trial2-order3 |
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
| --stack-details | timing ablation lease5s; trial=2, order=3, seed=62026; SQLite; LeaseWaitMs=5000, EventFlushIntervalMs=250, EventPollMs=250; 1 alpha + 1 beta workers x 4 slots |
| --sut-commit | (unset) |
| --trace | (unset) |
| --url | http://127.0.0.1:37800 |
| --wait-seconds | 300 |
| --warmup-seconds | 5 |
| --worker-statefulset | garrison-worker |
| --workspace-suffix | (unset) |

