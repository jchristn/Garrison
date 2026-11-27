# Keeper scheduler report: autonomy-workload (ba2-postgresql)

## Provenance

| Field | Value |
|---|---|
| Started (UTC) | 2026-11-27 03:01:42 |
| Finished (UTC) | 2026-11-27 03:13:20 |
| System under test | http://127.0.0.1:37800 (server 0.3.0) |
| Stack | local: local processes from the working tree: 1 server (PostgreSQL), 1 alpha + 1 beta workers x 4 slots |
| Product commit | 5344feead4a8754faf155bd8cbdd6d2acf309bc6-dirty (21 changed or untracked paths) |
| Harness | Garrison.Benchmark 1.0.0, commit 1c55d9b8a6bafc0d8509fa24056dade0a005e078-dirty |
| Machine | scrubbed, macOS 26.6.0 (Arm64), Apple M5 Max (Arm64), 18 logical processors |
| Runtime | .NET 10.0.14 |
| HTTP client | SocketsHttpHandler, MaxConnectionsPerServer 1024, timeout 660 s, pooled connection lifetime 30 s, connect timeout 10 s |
| Dataset | autonomy-workload (benchmarks/config/autonomy-workload.yaml) |
| Dataset SHA-256 | 3ad2f90916049c41d40651fbb8e531455b8258ff6e2dfe744618adf4e4c1a422 |
| External services | none: every run uses the fake harness (garrison-fake-harness), no model or paid service |
| Shared machine | local stack on the development laptop; other agent sessions were active on the machine |
| Seed | 42 |
| Deterministic | no |
| Command line | `Garrison.Benchmark scheduler --url http://127.0.0.1:37800 --stack local --fake-harness <repo>/benchmarks/.run/build/bin/Garrison.FakeHarness/release_net10.0/garrison-fake-harness.dll --stack-details "local processes from the working tree: 1 server (PostgreSQL), 1 alpha + 1 beta workers x 4 slots" --levels 1,100,1000,10000 --window-seconds 120 --label ba2-postgresql --shared-note "local stack on the development laptop; other agent sessions were active on the machine"` |

## Summary

| Arm | Outcomes | Passed | Errors | Pass rate [95% CI] | Latency p50 [95% CI] (ms) | p95 [95% CI] (ms) |
|---|---|---|---|---|---|---|
| garrison | 16 | 16 | 0 | 1.000 [1.000, 1.000] (indicative) | n/a | n/a |


### By probe type, garrison

| Type | n | Passed | Pass rate [95% CI] |
|---|---|---|---|
| create | 4 | 4 | 1.000 [1.000, 1.000] (indicative) |
| first-wake | 4 | 4 | 1.000 [1.000, 1.000] (indicative) |
| single-flight | 4 | 4 | 1.000 [1.000, 1.000] (indicative) |
| tick-runs | 4 | 4 | 1.000 [1.000, 1.000] (indicative) |

### By category, garrison

| Category | n | Passed | Pass rate [95% CI] |
|---|---|---|---|
| n1 | 4 | 4 | 1.000 [1.000, 1.000] (indicative) |
| n100 | 4 | 4 | 1.000 [1.000, 1.000] (indicative) |
| n1000 | 4 | 4 | 1.000 [1.000, 1.000] (indicative) |
| n10000 | 4 | 4 | 1.000 [1.000, 1.000] (indicative) |

## Phases

Censored values are lower bounds (a wake or message still waiting when the window closed) and are included in the distributions.

| Scenario | Phase | Size | Operations | Succeeded | Failed | Censored | Window (s) | Throughput (ops/s) |
|---|---|---|---|---|---|---|---|---|
| scheduler | n1 | 1 | 2 | 2 | 0 | 0 | 120.1 | 0.02 |
| scheduler | n100 | 100 | 200 | 200 | 0 | 0 | 120.2 | 1.66 |
| scheduler | n1000 | 1000 | 1633 | 1576 | 0 | 57 | 123.5 | 12.76 |
| scheduler | n10000 | 10000 | 10715 | 10669 | 0 | 46 | 242.2 | 44.05 |

### Distributions (ms)

| Phase | Measure | n | mean | p50 [95% CI] | p95 [95% CI] | p99 | max |
|---|---|---|---|---|---|---|---|
| n1 | createLatencyMs | 1 | 64.5 | 64.5 | 64.5 | 64.5 | 64.5 |
| n1 | firstWakeLagMs | 1 | 5849.3 | 5849.3 | 5849.3 | 5849.3 | 5849.3 |
| n1 | startedTickLagMs | 2 | 3056.9 | 264.5 [264.5, 5849.3] (indicative) | 5849.3 [264.5, 5849.3] (indicative) | 5849.3 | 5849.3 |
| n1 | tickLagMs | 2 | 3056.9 | 264.5 [264.5, 5849.3] (indicative) | 5849.3 [264.5, 5849.3] (indicative) | 5849.3 | 5849.3 |
| n100 | createLatencyMs | 100 | 35.9 | 34.1 [33.7, 34.4] | 50.8 [49.4, 50.9] | 53.1 | 53.7 |
| n100 | firstWakeLagMs | 100 | 1118.8 | 1113.1 [1111.7, 1123.0] | 1155.2 [1146.1, 1156.7] | 1158.6 | 1158.9 |
| n100 | startedTickLagMs | 200 | 2392.4 | 1147.2 [1139.3, 2105.9] | 5561.7 [5271.6, 5883.4] | 5918.4 | 6089.8 |
| n100 | tickLagMs | 200 | 2392.4 | 1147.2 [1139.0, 2178.8] | 5561.7 [5271.6, 5883.4] | 5918.4 | 6089.8 |
| n1000 | createLatencyMs | 1000 | 54.6 | 48.1 [47.8, 48.4] | 98.1 [97.2, 101.3] | 134.2 | 150.3 |
| n1000 | firstWakeLagMs | 1000 | 3437.2 | 3126.5 [3097.8, 3202.0] | 5763.8 [5719.8, 5782.1] | 5853.9 | 5896.9 |
| n1000 | startedTickLagMs | 1576 | 3366.8 | 3146.9 [3101.9, 3215.8] | 5780.0 [5740.8, 5812.3] | 6309.0 | 6943.8 |
| n1000 | tickLagMs | 1633 | 3330.1 | 3129.0 [3096.8, 3203.9] | 5775.8 [5733.9, 5810.3] | 6295.0 | 6943.8 |
| n10000 | createLatencyMs | 10000 | 195.4 | 131.9 [129.8, 134.4] | 537.2 [527.2, 549.8] | 747.0 | 3353.2 |
| n10000 | firstWakeLagMs | 10000 | 23999.2 | 19799.4 [19687.3, 19975.1] | 47652.6 [47550.0, 47705.0] | 49265.5 | 50474.1 |
| n10000 | startedTickLagMs | 10669 | 22991.3 | 19566.7 [19479.5, 19657.6] | 47585.7 [47469.5, 47664.0] | 49237.7 | 50474.1 |
| n10000 | tickLagMs | 10715 | 22901.7 | 19534.4 [19465.3, 19626.2] | 47577.2 [47461.1, 47660.5] | 49235.4 | 50474.1 |

### Counts

| Phase | Count | Value |
|---|---|---|
| n1 | createFailed | 0 |
| n1 | deleteFailed | 0 |
| n1 | mandates | 1 |
| n1 | mandatesWithoutTick | 0 |
| n1 | tickReadFailures | 0 |
| n1 | ticksFailed | 0 |
| n1 | ticksRunningAtWindowEnd | 0 |
| n1 | ticksStarted | 2 |
| n1 | wakesHandled | 2 |
| n1 | wakesPendingAtWindowEnd | 0 |
| n100 | createFailed | 0 |
| n100 | deleteFailed | 0 |
| n100 | mandates | 100 |
| n100 | mandatesWithoutTick | 0 |
| n100 | tickReadFailures | 0 |
| n100 | ticksFailed | 0 |
| n100 | ticksRunningAtWindowEnd | 0 |
| n100 | ticksStarted | 200 |
| n100 | wakesHandled | 200 |
| n100 | wakesPendingAtWindowEnd | 0 |
| n1000 | createFailed | 0 |
| n1000 | deleteFailed | 0 |
| n1000 | mandates | 1000 |
| n1000 | mandatesWithoutTick | 0 |
| n1000 | tickReadFailures | 0 |
| n1000 | ticksFailed | 0 |
| n1000 | ticksRunningAtWindowEnd | 587 |
| n1000 | ticksStarted | 1576 |
| n1000 | wakesHandled | 1576 |
| n1000 | wakesPendingAtWindowEnd | 57 |
| n10000 | createFailed | 0 |
| n10000 | deleteFailed | 0 |
| n10000 | mandates | 10000 |
| n10000 | mandatesWithoutTick | 0 |
| n10000 | tickReadFailures | 0 |
| n10000 | ticksFailed | 0 |
| n10000 | ticksRunningAtWindowEnd | 9503 |
| n10000 | ticksStarted | 10669 |
| n10000 | wakesHandled | 10669 |
| n10000 | wakesPendingAtWindowEnd | 46 |

## Server stage breakdown (whole run)

From /metrics before and after; server-wide, so concurrent traffic and several replicas blur it.

| Series | Count | Total | Mean | Unit |
|---|---|---|---|---|
| garrison_run_stage_duration_seconds{agent="keeper-bench",deployment="keeper-bench-fake",harness="Generic",model="none",stage="total",tenant="ten_mwyeakbq_nhl7OOOnK70DuH5DUQY"} | 10436 | 2008516240.0 | 192460.35 | ms |
| garrison_run_stage_duration_seconds{agent="keeper-bench",deployment="keeper-bench-fake",harness="Generic",model="fake-model",stage="total",tenant="ten_mwyeakbq_nhl7OOOnK70DuH5DUQY"} | 2550 | 272696642.0 | 106939.86 | ms |
| garrison_run_stage_duration_seconds{agent="keeper-bench",deployment="keeper-bench-fake",harness="Generic",model="fake-model",stage="queue",tenant="ten_mwyeakbq_nhl7OOOnK70DuH5DUQY"} | 2550 | 270215346.0 | 105966.80 | ms |
| garrison_keeper_tick_lag_duration_seconds{source="timer"} | 12974 | 253069877.4 | 19505.93 | ms |
| garrison_keeper_interval_seconds{mode="fixed"} | 2600 | 156000000.0 | 60000.00 | ms |
| db_client_operation_duration_seconds{db_client_connection_pool_name="Host=127.0.0.1;Port=55432;Database=garrison_bench;Username=postgres;Maximum Pool Size=100;Minimum Pool Size=0;Timeout=15;Command Timeout=30;Connection Idle Lifetime=300",db_system_name="postgresql",server_address="127.0.0.1",server_port="55432"} | 2370846 | 9520179.8 | 4.02 | ms |
| garrison_run_stage_duration_seconds{agent="keeper-bench",deployment="keeper-bench-fake",harness="Generic",model="none",stage="queue",tenant="ten_mwyeakbq_nhl7OOOnK70DuH5DUQY"} | 51 | 2935685.0 | 57562.45 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/lease",status_class="2xx",tenant="default"} | 2201 | 2699583.4 | 1226.53 | ms |
| garrison_application_operation_duration_seconds{component="run",operation="admission",result="ok"} | 12974 | 2201882.6 | 169.72 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/tenants/{tenantId}/mandates",status_class="2xx",tenant="ten_mwyeakbq_nhl7OOOnK70DuH5DUQY"} | 11098 | 1970326.0 | 177.54 | ms |
| garrison_db_operation_duration_seconds{operation="transaction",provider="postgresql",result="ok",table="none"} | 128917 | 1768041.0 | 13.71 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="empty"} | 88 | 1761660.1 | 20018.86 | ms |
| voltaic_server_session_duration_seconds{voltaic_protocol="mcp",voltaic_reason="deleted",voltaic_transport="http"} | 2556 | 970974.2 | 379.88 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="assigned"} | 2113 | 915680.0 | 433.36 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/watch",status_class="aborted",tenant="default"} | 2102 | 886197.8 | 421.60 | ms |

## Published and prior baselines

| Metric | Source | Baseline | This run | Net | Note |
|---|---|---|---|---|---|
| (all) | no comparable published result | none | n/a | n/a | No public benchmark measures an agent-harness control plane (scheduling runs of headless CLI agents onto pull-based workers), so there is no published score to compare against. The closest public data, the Azure Functions and Alibaba cluster traces, are workloads without an oracle; see BENCHMARKING.md, Datasets. |

## Notes

- Keeper settings are the server's (defaults: Autonomy.SchedulerSweepSeconds 5, Autonomy.MaxDueClaimsPerSweep 1000, Autonomy.SchedulerSweepConcurrency 32, Autonomy.MinIntervalSeconds 60). A sweep claims at most MaxDueClaimsPerSweep due wakes, SchedulerSweepConcurrency at a time, so the scheduler handles at most MaxDueClaimsPerSweep / SchedulerSweepSeconds wakes per second, less when the database cannot start that many runs in the time; mandates beyond that rate times the interval build a backlog.
- tickLagMs covers every handled wake (started or skipped) plus censored pending wakes; startedTickLagMs covers only wakes that started a run; firstWakeLagMs is each mandate's first wake, due at creation.
- Wake times are server timestamps; the window end is the harness clock, which is the same clock on the local stack.
- Shared machine: local stack on the development laptop; other agent sessions were active on the machine. Latency and throughput are indicative.

## Options

| Option | Value |
|---|---|
| --agent | keeper-bench |
| --concurrency | 16 |
| --connection-lifetime-seconds | 30 |
| --context | (unset) |
| --deployment | keeper-bench-fake |
| --deterministic | false |
| --interval-seconds | 60 |
| --kubeconfig | (unset) |
| --label | ba2-postgresql |
| --levels | 1,100,1000,10000 |
| --max-connections | 1024 |
| --namespace | garrison |
| --request-timeout-seconds | 660 |
| --resamples | 2000 |
| --results-dir | (unset) |
| --seed | 42 |
| --shared-note | local stack on the development laptop; other agent sessions were active on the machine |
| --stack | local |
| --stack-details | local processes from the working tree: 1 server (PostgreSQL), 1 alpha + 1 beta workers x 4 slots |
| --sut-commit | (unset) |
| --url | http://127.0.0.1:37800 |
| --window-seconds | 120 |
| --workload | benchmarks/config/autonomy-workload.yaml |

