# Load report: synthetic-fleet (timing-poll100-trial1-order4)

## Provenance

| Field | Value |
|---|---|
| Started (UTC) | 2026-10-16 15:12:03 |
| Finished (UTC) | 2026-10-16 15:12:34 |
| System under test | http://127.0.0.1:37800 (server 0.1.0-alpha) |
| Stack | local: timing ablation poll100; trial=1, order=4, seed=62026; SQLite; LeaseWaitMs=20000, EventFlushIntervalMs=250, EventPollMs=100; 1 alpha + 1 beta workers x 4 slots |
| Product commit | f64960d78a59a1008a58c4c9aa01825f32bd2325-dirty (525 changed or untracked paths) |
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
| Command line | `Garrison.Benchmark load --url http://127.0.0.1:37800 --admin-key *** --stack local --stack-details "timing ablation poll100; trial=1, order=4, seed=62026; SQLite; LeaseWaitMs=20000, EventFlushIntervalMs=250, EventPollMs=100; 1 alpha + 1 beta workers x 4 slots" --mode closed --concurrency 16 --warmup-seconds 5 --duration-seconds 25 --results-dir /Users/joelchristner/Code/Garrison/benchmarks/evidence/d062/timing-repeated --label timing-poll100-trial1-order4 --shared-note "Garrison measurement jobs serialized; original Compose deployment and unrelated host services remained running; host load recorded per arm"` |

## Load

| Arm | Mode | Workers | Slots | Load | Started | Succeeded | Failed | Throughput (ops/s) [95% CI] | p50 (ms) | p95 [95% CI] (ms) | p99 (ms) | queue p50 (ms) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| garrison | closed | 1 | 4 | c16 | 1054 | 1054 | 0 | 41.54 [38.23, 41.92] | 382.6 | 402.7 [400.2, 404.1] | 412.6 | 288.0 |

### Database cost estimates

These divide server-wide counter deltas by successful runs and include background and failed-run work. They are not exact per-run attribution.

| Arm | Mode | DB statements / success | History header inserts / success |
|---|---|---|---|
| garrison | closed | 227.12 | 1 |

### Timings, garrison w1-c16 (successful operations, ms)

| Measure | n | mean | p50 [95% CI] | p90 | p95 [95% CI] | p99 | max |
|---|---|---|---|---|---|---|---|
| clientOverheadMs | 1054 | 306.3 | 306.2 [305.5, 307.0] | 319.7 | 325.0 [323.1, 327.7] | 335.9 | 400.0 |
| executionMs | 1054 | 76.2 | 77.0 [76.0, 77.0] | 81.0 | 82.0 [81.0, 82.0] | 87.0 | 101.0 |
| queueMs | 1054 | 287.3 | 288.0 [287.0, 289.0] | 300.0 | 304.0 [302.0, 307.0] | 315.0 | 357.0 |
| serverOverheadMs | 1054 | 302.7 | 303.0 [302.0, 303.0] | 316.0 | 322.0 [319.0, 323.0] | 333.0 | 387.0 |
| totalMs | 1054 | 379.0 | 379.0 [378.0, 380.0] | 394.0 | 399.0 [397.0, 401.0] | 409.0 | 467.0 |

| Series | Count | Total | Mean | Unit |
|---|---|---|---|---|
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/tenants/{tenantId}/agents/{agentId}/invoke",status_class="2xx",tenant="ten_mvb3w0kh_oME3sKDigNcziMtfTmT"} | 1054 | 402844.1 | 382.21 | ms |
| garrison_invocation_wait_duration_seconds{result="completed",surface="rest"} | 1054 | 400205.9 | 379.70 | ms |
| garrison_application_operation_duration_seconds{component="run",operation="wait",result="ok"} | 1054 | 400201.0 | 379.70 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="total",tenant="ten_mvb3w0kh_oME3sKDigNcziMtfTmT"} | 1054 | 399424.0 | 378.96 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="queue",tenant="ten_mvb3w0kh_oME3sKDigNcziMtfTmT"} | 1054 | 302763.0 | 287.25 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="execution",tenant="ten_mvb3w0kh_oME3sKDigNcziMtfTmT"} | 1054 | 80330.0 | 76.21 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/lease",status_class="2xx",tenant="default"} | 1054 | 65374.5 | 62.03 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="empty"} | 3 | 59996.5 | 19998.82 | ms |

## Server stage breakdown (whole run)

From /metrics before and after; server-wide, so concurrent traffic and several replicas blur it.

| Series | Count | Total | Mean | Unit |
|---|---|---|---|---|
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/tenants/{tenantId}/agents/{agentId}/invoke",status_class="2xx",tenant="ten_mvb3w0kh_oME3sKDigNcziMtfTmT"} | 1266 | 485521.9 | 383.51 | ms |
| garrison_invocation_wait_duration_seconds{result="completed",surface="rest"} | 1266 | 481597.7 | 380.41 | ms |
| garrison_application_operation_duration_seconds{component="run",operation="wait",result="ok"} | 1266 | 481583.7 | 380.40 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="total",tenant="ten_mvb3w0kh_oME3sKDigNcziMtfTmT"} | 1266 | 480810.0 | 379.79 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="queue",tenant="ten_mvb3w0kh_oME3sKDigNcziMtfTmT"} | 1266 | 364358.0 | 287.80 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="execution",tenant="ten_mvb3w0kh_oME3sKDigNcziMtfTmT"} | 1266 | 96315.0 | 76.08 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/lease",status_class="2xx",tenant="default"} | 1258 | 67402.3 | 53.58 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/watch",status_class="aborted",tenant="default"} | 1254 | 64675.5 | 51.58 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="empty"} | 3 | 59996.5 | 19998.82 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="first_token",tenant="ten_mvb3w0kh_oME3sKDigNcziMtfTmT"} | 1266 | 52295.0 | 41.31 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="first_token_excl_delegation",tenant="ten_mvb3w0kh_oME3sKDigNcziMtfTmT"} | 1266 | 52295.0 | 41.31 | ms |
| garrison_run_stage_duration_seconds{agent="load-echo",deployment="load-echo-fake",harness="Generic",model="fake-model",stage="streaming",tenant="ten_mvb3w0kh_oME3sKDigNcziMtfTmT"} | 1266 | 33191.0 | 26.22 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="assigned"} | 1255 | 6994.1 | 5.57 | ms |
| garrison_scheduler_claim_duration_seconds{result="assigned"} | 1255 | 6053.5 | 4.82 | ms |
| garrison_db_operation_duration_seconds{operation="select",provider="sqlite",result="ok",table="none"} | 5076 | 4467.7 | 0.88 | ms |

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
| --label | timing-poll100-trial1-order4 |
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
| --stack-details | timing ablation poll100; trial=1, order=4, seed=62026; SQLite; LeaseWaitMs=20000, EventFlushIntervalMs=250, EventPollMs=100; 1 alpha + 1 beta workers x 4 slots |
| --sut-commit | (unset) |
| --trace | (unset) |
| --url | http://127.0.0.1:37800 |
| --wait-seconds | 300 |
| --warmup-seconds | 5 |
| --worker-statefulset | garrison-worker |
| --workspace-suffix | (unset) |

