# Load report: synthetic-fleet (timing-baseline-trial1-order5)

## Provenance

| Field | Value |
|---|---|
| Started (UTC) | 2026-10-16 15:12:39 |
| Finished (UTC) | 2026-10-16 15:13:11 |
| System under test | http://127.0.0.1:37800 (server 0.1.0-alpha) |
| Stack | local: timing ablation baseline; trial=1, order=5, seed=62026; SQLite; LeaseWaitMs=20000, EventFlushIntervalMs=250, EventPollMs=250; 1 alpha + 1 beta workers x 4 slots |
| Product commit | f64960d78a59a1008a58c4c9aa01825f32bd2325-dirty (527 changed or untracked paths) |
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
| Command line | `Garrison.Benchmark load --url http://127.0.0.1:37800 --admin-key *** --stack local --stack-details "timing ablation baseline; trial=1, order=5, seed=62026; SQLite; LeaseWaitMs=20000, EventFlushIntervalMs=250, EventPollMs=250; 1 alpha + 1 beta workers x 4 slots" --mode closed --concurrency 16 --warmup-seconds 5 --duration-seconds 25 --results-dir /Users/joelchristner/Code/Garrison/benchmarks/evidence/d062/timing-repeated --label timing-baseline-trial1-order5 --shared-note "Garrison measurement jobs serialized; original Compose deployment and unrelated host services remained running; host load recorded per arm"` |

## Load

| Arm | Mode | Workers | Slots | Load | Started | Succeeded | Failed | Throughput (ops/s) [95% CI] | p50 (ms) | p95 [95% CI] (ms) | p99 (ms) | queue p50 (ms) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| garrison | closed | 1 | 4 | c16 | 1046 | 1046 | 0 | 41.24 [38.00, 41.50] | 385.5 | 404.6 [402.1, 406.9] | 415.1 | 290.0 |

### Database cost estimates

These divide server-wide counter deltas by successful runs and include background and failed-run work. They are not exact per-run attribution.

| Arm | Mode | DB statements / success | History header inserts / success |
|---|---|---|---|
| garrison | closed | 227.06 | 1 |

### Timings, garrison w1-c16 (successful operations, ms)

| Measure | n | mean | p50 [95% CI] | p90 | p95 [95% CI] | p99 | max |
|---|---|---|---|---|---|---|---|
| clientOverheadMs | 1046 | 308.7 | 309.0 [308.5, 309.6] | 321.0 | 325.6 [324.0, 327.8] | 340.6 | 378.1 |
| executionMs | 1046 | 76.5 | 77.0 [77.0, 77.0] | 80.0 | 81.0 [81.0, 82.0] | 87.0 | 97.0 |
| queueMs | 1046 | 289.1 | 290.0 [289.0, 290.0] | 301.0 | 306.0 [303.0, 307.0] | 316.0 | 341.0 |
| serverOverheadMs | 1046 | 305.2 | 306.0 [305.0, 306.0] | 318.0 | 323.0 [321.0, 325.0] | 338.0 | 362.0 |
| totalMs | 1046 | 381.7 | 382.0 [381.0, 383.0] | 396.0 | 401.0 [399.0, 404.0] | 411.0 | 443.0 |

| Series | Count | Total | Mean | Unit |
|---|---|---|---|---|
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/tenants/{tenantId}/agents/{agentId}/invoke",status_class="2xx",tenant="ten_mvb3wsld_Mga7RTXlKghzWelq6aj"} | 1046 | 402490.2 | 384.79 | ms |
| garrison_invocation_wait_duration_seconds{result="completed",surface="rest"} | 1046 | 400014.0 | 382.42 | ms |
| garrison_application_operation_duration_seconds{component="run",operation="wait",result="ok"} | 1046 | 400009.4 | 382.42 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="total",tenant="ten_mvb3wsld_Mga7RTXlKghzWelq6aj"} | 1046 | 399218.0 | 381.66 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="queue",tenant="ten_mvb3wsld_Mga7RTXlKghzWelq6aj"} | 1046 | 302440.0 | 289.14 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="execution",tenant="ten_mvb3wsld_Mga7RTXlKghzWelq6aj"} | 1046 | 79982.0 | 76.46 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/lease",status_class="2xx",tenant="default"} | 1044 | 65166.8 | 62.42 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="empty"} | 3 | 59999.3 | 19999.78 | ms |

## Server stage breakdown (whole run)

From /metrics before and after; server-wide, so concurrent traffic and several replicas blur it.

| Series | Count | Total | Mean | Unit |
|---|---|---|---|---|
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/tenants/{tenantId}/agents/{agentId}/invoke",status_class="2xx",tenant="ten_mvb3wsld_Mga7RTXlKghzWelq6aj"} | 1257 | 485354.8 | 386.12 | ms |
| garrison_invocation_wait_duration_seconds{result="completed",surface="rest"} | 1257 | 481715.4 | 383.23 | ms |
| garrison_application_operation_duration_seconds{component="run",operation="wait",result="ok"} | 1257 | 481699.1 | 383.21 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="total",tenant="ten_mvb3wsld_Mga7RTXlKghzWelq6aj"} | 1257 | 480860.0 | 382.55 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="queue",tenant="ten_mvb3wsld_Mga7RTXlKghzWelq6aj"} | 1257 | 364006.0 | 289.58 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="execution",tenant="ten_mvb3wsld_Mga7RTXlKghzWelq6aj"} | 1257 | 95988.0 | 76.36 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/lease",status_class="2xx",tenant="default"} | 1248 | 67146.1 | 53.80 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/watch",status_class="aborted",tenant="default"} | 1244 | 63729.7 | 51.23 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="empty"} | 3 | 59999.3 | 19999.78 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="first_token",tenant="ten_mvb3wsld_Mga7RTXlKghzWelq6aj"} | 1257 | 51840.0 | 41.24 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="first_token_excl_delegation",tenant="ten_mvb3wsld_Mga7RTXlKghzWelq6aj"} | 1257 | 51840.0 | 41.24 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="streaming",tenant="ten_mvb3wsld_Mga7RTXlKghzWelq6aj"} | 1257 | 33336.0 | 26.52 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="assigned"} | 1245 | 6732.5 | 5.41 | ms |
| garrison_scheduler_claim_duration_seconds{result="assigned"} | 1245 | 5801.7 | 4.66 | ms |
| garrison_db_operation_duration_seconds{operation="select",provider="sqlite",result="ok",table="none"} | 5038 | 4252.7 | 0.84 | ms |

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
| --label | timing-baseline-trial1-order5 |
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
| --stack-details | timing ablation baseline; trial=1, order=5, seed=62026; SQLite; LeaseWaitMs=20000, EventFlushIntervalMs=250, EventPollMs=250; 1 alpha + 1 beta workers x 4 slots |
| --sut-commit | (unset) |
| --trace | (unset) |
| --url | http://127.0.0.1:37800 |
| --wait-seconds | 300 |
| --warmup-seconds | 5 |
| --worker-statefulset | garrison-worker |
| --workspace-suffix | (unset) |

