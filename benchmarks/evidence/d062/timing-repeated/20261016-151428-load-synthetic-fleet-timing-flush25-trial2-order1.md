# Load report: synthetic-fleet (timing-flush25-trial2-order1)

## Provenance

| Field | Value |
|---|---|
| Started (UTC) | 2026-10-16 15:14:28 |
| Finished (UTC) | 2026-10-16 15:15:00 |
| System under test | http://127.0.0.1:37800 (server 0.1.0-alpha) |
| Stack | local: timing ablation flush25; trial=2, order=1, seed=62026; SQLite; LeaseWaitMs=20000, EventFlushIntervalMs=25, EventPollMs=250; 1 alpha + 1 beta workers x 4 slots |
| Product commit | f64960d78a59a1008a58c4c9aa01825f32bd2325-dirty (536 changed or untracked paths) |
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
| Command line | `Garrison.Benchmark load --url http://127.0.0.1:37800 --admin-key *** --stack local --stack-details "timing ablation flush25; trial=2, order=1, seed=62026; SQLite; LeaseWaitMs=20000, EventFlushIntervalMs=25, EventPollMs=250; 1 alpha + 1 beta workers x 4 slots" --mode closed --concurrency 16 --warmup-seconds 5 --duration-seconds 25 --results-dir /Users/joelchristner/Code/Garrison/benchmarks/evidence/d062/timing-repeated --label timing-flush25-trial2-order1 --shared-note "Garrison measurement jobs serialized; original Compose deployment and unrelated host services remained running; host load recorded per arm"` |

## Load

| Arm | Mode | Workers | Slots | Load | Started | Succeeded | Failed | Throughput (ops/s) [95% CI] | p50 (ms) | p95 [95% CI] (ms) | p99 (ms) | queue p50 (ms) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| garrison | closed | 1 | 4 | c16 | 1003 | 1003 | 0 | 39.54 [36.54, 39.73] | 402.9 | 420.5 [418.9, 421.9] | 440.1 | 303.0 |

### Database cost estimates

These divide server-wide counter deltas by successful runs and include background and failed-run work. They are not exact per-run attribution.

| Arm | Mode | DB statements / success | History header inserts / success |
|---|---|---|---|
| garrison | closed | 237.34 | 1 |

### Timings, garrison w1-c16 (successful operations, ms)

| Measure | n | mean | p50 [95% CI] | p90 | p95 [95% CI] | p99 | max |
|---|---|---|---|---|---|---|---|
| clientOverheadMs | 1003 | 324.0 | 325.1 [324.4, 325.7] | 335.9 | 341.3 [339.5, 342.8] | 360.7 | 408.1 |
| executionMs | 1003 | 77.8 | 78.0 [78.0, 78.0] | 82.0 | 83.0 [83.0, 84.0] | 87.0 | 111.0 |
| queueMs | 1003 | 301.6 | 303.0 [302.0, 304.0] | 313.0 | 318.0 [316.0, 319.0] | 338.0 | 376.0 |
| serverOverheadMs | 1003 | 320.5 | 322.0 [321.0, 322.0] | 332.0 | 338.0 [336.0, 339.0] | 357.0 | 396.0 |
| totalMs | 1003 | 398.3 | 399.0 [399.0, 400.0] | 412.0 | 417.0 [415.0, 419.0] | 436.0 | 476.0 |

| Series | Count | Total | Mean | Unit |
|---|---|---|---|---|
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/tenants/{tenantId}/agents/{agentId}/invoke",status_class="2xx",tenant="ten_mvb3z4vq_gDHFDhFpc8bKeUYJyhF"} | 1003 | 402704.4 | 401.50 | ms |
| garrison_invocation_wait_duration_seconds{result="completed",surface="rest"} | 1003 | 400214.6 | 399.02 | ms |
| garrison_application_operation_duration_seconds{component="run",operation="wait",result="ok"} | 1003 | 400210.3 | 399.01 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="total",tenant="ten_mvb3z4vq_gDHFDhFpc8bKeUYJyhF"} | 1003 | 399517.0 | 398.32 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="queue",tenant="ten_mvb3z4vq_gDHFDhFpc8bKeUYJyhF"} | 1003 | 302456.0 | 301.55 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="execution",tenant="ten_mvb3z4vq_gDHFDhFpc8bKeUYJyhF"} | 1003 | 78066.0 | 77.83 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/lease",status_class="2xx",tenant="default"} | 1001 | 65180.9 | 65.12 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="empty"} | 3 | 59999.6 | 19999.88 | ms |

## Server stage breakdown (whole run)

From /metrics before and after; server-wide, so concurrent traffic and several replicas blur it.

| Series | Count | Total | Mean | Unit |
|---|---|---|---|---|
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/tenants/{tenantId}/agents/{agentId}/invoke",status_class="2xx",tenant="ten_mvb3z4vq_gDHFDhFpc8bKeUYJyhF"} | 1207 | 485739.1 | 402.44 | ms |
| garrison_invocation_wait_duration_seconds{result="completed",surface="rest"} | 1207 | 482056.2 | 399.38 | ms |
| garrison_application_operation_duration_seconds{component="run",operation="wait",result="ok"} | 1207 | 482049.0 | 399.38 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="total",tenant="ten_mvb3z4vq_gDHFDhFpc8bKeUYJyhF"} | 1207 | 481383.0 | 398.83 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="queue",tenant="ten_mvb3z4vq_gDHFDhFpc8bKeUYJyhF"} | 1207 | 364147.0 | 301.70 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="execution",tenant="ten_mvb3z4vq_gDHFDhFpc8bKeUYJyhF"} | 1207 | 93862.0 | 77.76 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/lease",status_class="2xx",tenant="default"} | 1199 | 67129.3 | 55.99 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/watch",status_class="aborted",tenant="default"} | 1195 | 61047.1 | 51.09 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="empty"} | 3 | 59999.6 | 19999.88 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="first_token",tenant="ten_mvb3z4vq_gDHFDhFpc8bKeUYJyhF"} | 1207 | 50614.0 | 41.93 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="first_token_excl_delegation",tenant="ten_mvb3z4vq_gDHFDhFpc8bKeUYJyhF"} | 1207 | 50614.0 | 41.93 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="streaming",tenant="ten_mvb3z4vq_gDHFDhFpc8bKeUYJyhF"} | 1207 | 32456.0 | 26.89 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="assigned"} | 1196 | 6732.8 | 5.63 | ms |
| garrison_scheduler_claim_duration_seconds{result="assigned"} | 1196 | 5821.5 | 4.87 | ms |
| garrison_db_operation_duration_seconds{operation="select",provider="sqlite",result="ok",table="none"} | 4838 | 4278.7 | 0.88 | ms |

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
| --label | timing-flush25-trial2-order1 |
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
| --stack-details | timing ablation flush25; trial=2, order=1, seed=62026; SQLite; LeaseWaitMs=20000, EventFlushIntervalMs=25, EventPollMs=250; 1 alpha + 1 beta workers x 4 slots |
| --sut-commit | (unset) |
| --trace | (unset) |
| --url | http://127.0.0.1:37800 |
| --wait-seconds | 300 |
| --warmup-seconds | 5 |
| --worker-statefulset | garrison-worker |
| --workspace-suffix | (unset) |

