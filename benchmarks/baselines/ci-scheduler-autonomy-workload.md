# Keeper scheduler report: autonomy-workload (ci-gate)

## Provenance

| Field | Value |
|---|---|
| Started (UTC) | 2026-11-27 01:12:44 |
| Finished (UTC) | 2026-11-27 01:13:04 |
| System under test | http://127.0.0.1 (bench stack) (server 0.3.0) |
| Stack | local |
| Product commit | 71ea9abc40b475c984a1a4c252638b25d255a9f1 |
| Harness | Garrison.Benchmark 1.0.0, commit 78891d4e22928d95b3bf7b221d0a10b5f541b91b |
| Machine | scrubbed, macOS 26.6.0 (Arm64), Apple M5 Max (Arm64), 18 logical processors |
| Runtime | .NET 10.0.14 |
| HTTP client | SocketsHttpHandler, MaxConnectionsPerServer 1024, timeout 660 s, pooled connection lifetime 30 s, connect timeout 10 s |
| Dataset | autonomy-workload (benchmarks/config/autonomy-workload.yaml) |
| Dataset SHA-256 | 3ad2f90916049c41d40651fbb8e531455b8258ff6e2dfe744618adf4e4c1a422 |
| External services | none: every run uses the fake harness (garrison-fake-harness), no model or paid service |
| Shared machine | not recorded (pass --shared-note) |
| Seed | 42 |
| Deterministic | yes (no wall-clock value is scored) |
| Command line | `Garrison.Benchmark scheduler --levels 5 --window-seconds 20 --deterministic true --url http://127.0.0.1:37800 --stack local --label ci-gate --results-dir <repo>/benchmarks/results --seed 42` |

## Summary

| Arm | Outcomes | Passed | Errors | Pass rate [95% CI] | Latency p50 [95% CI] (ms) | p95 [95% CI] (ms) |
|---|---|---|---|---|---|---|
| garrison | 4 | 4 | 0 | 1.000 [1.000, 1.000] (indicative) | n/a | n/a |


### By probe type, garrison

| Type | n | Passed | Pass rate [95% CI] |
|---|---|---|---|
| create | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| first-wake | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| single-flight | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| tick-runs | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |

## Phases

Censored values are lower bounds (a wake or message still waiting when the window closed) and are included in the distributions.

| Scenario | Phase | Size | Operations | Succeeded | Failed | Censored | Window (s) | Throughput (ops/s) |
|---|---|---|---|---|---|---|---|---|
| scheduler | n5 | 5 | 5 | 5 | 0 | 0 | 20.0 | 0.25 |

### Distributions (ms)

| Phase | Measure | n | mean | p50 [95% CI] | p95 [95% CI] | p99 | max |
|---|---|---|---|---|---|---|---|
| n5 | createLatencyMs | 5 | 42.9 | 42.9 [42.9, 42.9] (indicative) | 42.9 [42.9, 42.9] (indicative) | 42.9 | 42.9 |
| n5 | firstWakeLagMs | 5 | 339.5 | 339.5 [339.2, 339.7] (indicative) | 339.7 [339.5, 339.7] (indicative) | 339.7 | 339.7 |
| n5 | startedTickLagMs | 5 | 339.5 | 339.5 [339.2, 339.7] (indicative) | 339.7 [339.5, 339.7] (indicative) | 339.7 | 339.7 |
| n5 | tickLagMs | 5 | 339.5 | 339.5 [339.2, 339.7] (indicative) | 339.7 [339.5, 339.7] (indicative) | 339.7 | 339.7 |

### Counts

| Phase | Count | Value |
|---|---|---|
| n5 | createFailed | 0 |
| n5 | deleteFailed | 0 |
| n5 | mandates | 5 |
| n5 | mandatesWithoutTick | 0 |
| n5 | tickReadFailures | 0 |
| n5 | ticksFailed | 0 |
| n5 | ticksRunningAtWindowEnd | 0 |
| n5 | ticksStarted | 5 |
| n5 | wakesHandled | 5 |
| n5 | wakesPendingAtWindowEnd | 0 |

## Server stage breakdown (whole run)

From /metrics before and after; server-wide, so concurrent traffic and several replicas blur it.

| Series | Count | Total | Mean | Unit |
|---|---|---|---|---|
| garrison_keeper_interval_seconds{mode="fixed"} | 5 | 300000.0 | 60000.00 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/lease",status_class="2xx",tenant="default"} | 5 | 42418.5 | 8483.69 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="empty"} | 2 | 39996.3 | 19998.17 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="assigned"} | 3 | 2355.0 | 784.99 | ms |
| garrison_keeper_tick_lag_duration_seconds{source="timer"} | 5 | 1697.4 | 339.47 | ms |
| garrison_run_stage_duration_seconds{agent="keeper-bench",deployment="keeper-bench-fake",harness="Generic",model="fake-model",stage="total",tenant="ten_mwyaefq8_bHl9GwFmxJ1fx8IqCK1"} | 5 | 1608.0 | 321.60 | ms |
| garrison_run_stage_duration_seconds{agent="keeper-bench",deployment="keeper-bench-fake",harness="Generic",model="fake-model",stage="execution",tenant="ten_mwyaefq8_bHl9GwFmxJ1fx8IqCK1"} | 5 | 347.0 | 69.40 | ms |
| voltaic_server_session_duration_seconds{voltaic_protocol="mcp",voltaic_reason="deleted",voltaic_transport="http"} | 5 | 346.4 | 69.27 | ms |
| garrison_outbound_duration_seconds{operation="post",result="2xx",service="mcp_internal"} | 15 | 328.9 | 21.92 | ms |
| voltaic_http_server_request_duration_seconds{http_request_method="POST",http_response_status_code="200",http_route="/mcp",voltaic_outcome="success",voltaic_protocol="mcp"} | 10 | 313.5 | 31.35 | ms |
| garrison_scheduler_claim_duration_seconds{result="empty"} | 164 | 230.9 | 1.41 | ms |
| garrison_run_stage_duration_seconds{agent="keeper-bench",deployment="keeper-bench-fake",harness="Generic",model="fake-model",stage="startup",tenant="ten_mwyaefq8_bHl9GwFmxJ1fx8IqCK1"} | 5 | 219.0 | 43.80 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/tenants/{tenantId}/mandates",status_class="2xx",tenant="ten_mwyaefq8_bHl9GwFmxJ1fx8IqCK1"} | 5 | 212.0 | 42.40 | ms |
| garrison_run_stage_duration_seconds{agent="keeper-bench",deployment="keeper-bench-fake",harness="Generic",model="fake-model",stage="first_token",tenant="ten_mwyaefq8_bHl9GwFmxJ1fx8IqCK1"} | 5 | 178.0 | 35.60 | ms |
| garrison_run_stage_duration_seconds{agent="keeper-bench",deployment="keeper-bench-fake",harness="Generic",model="fake-model",stage="first_token_excl_delegation",tenant="ten_mwyaefq8_bHl9GwFmxJ1fx8IqCK1"} | 5 | 178.0 | 35.60 | ms |

## Published and prior baselines

| Metric | Source | Baseline | This run | Net | Note |
|---|---|---|---|---|---|
| (all) | no comparable published result | none | n/a | n/a | No public benchmark measures an agent-harness control plane (scheduling runs of headless CLI agents onto pull-based workers), so there is no published score to compare against. The closest public data, the Azure Functions and Alibaba cluster traces, are workloads without an oracle; see BENCHMARKING.md, Datasets. |

## Notes

- Keeper settings are the server's (defaults: Autonomy.SchedulerSweepSeconds 5, Autonomy.MaxDueClaimsPerSweep 100, Autonomy.MinIntervalSeconds 60). A sweep claims at most MaxDueClaimsPerSweep due wakes, so the scheduler handles at most MaxDueClaimsPerSweep / SchedulerSweepSeconds wakes per second, and mandates beyond that rate times the interval build a backlog.
- tickLagMs covers every handled wake (started or skipped) plus censored pending wakes; startedTickLagMs covers only wakes that started a run; firstWakeLagMs is each mandate's first wake, due at creation.
- Wake times are server timestamps; the window end is the harness clock, which is the same clock on the local stack.

## Options

| Option | Value |
|---|---|
| --agent | keeper-bench |
| --concurrency | 16 |
| --connection-lifetime-seconds | 30 |
| --context | (unset) |
| --deployment | keeper-bench-fake |
| --deterministic | true |
| --interval-seconds | 60 |
| --kubeconfig | (unset) |
| --label | ci-gate |
| --levels | 5 |
| --max-connections | 1024 |
| --namespace | garrison |
| --request-timeout-seconds | 660 |
| --resamples | 2000 |
| --results-dir | <repo>/benchmarks/results |
| --seed | 42 |
| --shared-note | (unset) |
| --stack | local |
| --stack-details | (unset) |
| --sut-commit | (unset) |
| --url | http://127.0.0.1:37800 |
| --window-seconds | 20 |
| --workload | benchmarks/config/autonomy-workload.yaml |

