# Keeper scheduler report: autonomy-workload (ba2-pg-claims2500)

## Provenance

| Field | Value |
|---|---|
| Started (UTC) | 2026-11-27 03:13:43 |
| Finished (UTC) | 2026-11-27 03:18:03 |
| System under test | http://127.0.0.1:37800 (server 0.3.0) |
| Stack | local: local processes from the working tree: 1 server (PostgreSQL), 1 alpha + 1 beta workers x 4 slots |
| Product commit | 5344feead4a8754faf155bd8cbdd6d2acf309bc6-dirty (25 changed or untracked paths) |
| Harness | Garrison.Benchmark 1.0.0, commit 1c55d9b8a6bafc0d8509fa24056dade0a005e078-dirty |
| Machine | scrubbed, macOS 26.6.0 (Arm64), Apple M5 Max (Arm64), 18 logical processors |
| Runtime | .NET 10.0.14 |
| HTTP client | SocketsHttpHandler, MaxConnectionsPerServer 1024, timeout 660 s, pooled connection lifetime 30 s, connect timeout 10 s |
| Dataset | autonomy-workload (benchmarks/config/autonomy-workload.yaml) |
| Dataset SHA-256 | 3ad2f90916049c41d40651fbb8e531455b8258ff6e2dfe744618adf4e4c1a422 |
| External services | none: every run uses the fake harness (garrison-fake-harness), no model or paid service |
| Shared machine | not recorded (pass --shared-note) |
| Seed | 42 |
| Deterministic | no |
| Command line | `Garrison.Benchmark scheduler --url http://127.0.0.1:37800 --stack local --fake-harness <repo>/benchmarks/.run/build/bin/Garrison.FakeHarness/release_net10.0/garrison-fake-harness.dll --stack-details "local processes from the working tree: 1 server (PostgreSQL), 1 alpha + 1 beta workers x 4 slots" --levels 10000 --window-seconds 90 --label ba2-pg-claims2500` |

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
| scheduler | n10000 | 10000 | 10421 | 10388 | 0 | 33 | 176.5 | 58.87 |

### Distributions (ms)

| Phase | Measure | n | mean | p50 [95% CI] | p95 [95% CI] | p99 | max |
|---|---|---|---|---|---|---|---|
| n10000 | createLatencyMs | 10000 | 138.2 | 126.3 [125.1, 127.3] | 258.2 [247.8, 266.9] | 384.2 | 664.1 |
| n10000 | firstWakeLagMs | 10000 | 10812.7 | 11306.5 [11264.8, 11349.7] | 14144.1 [14104.1, 14199.6] | 14579.1 | 15566.8 |
| n10000 | startedTickLagMs | 10388 | 10627.9 | 11232.8 [11151.9, 11290.5] | 14136.3 [14093.7, 14189.8] | 14569.6 | 15566.8 |
| n10000 | tickLagMs | 10421 | 10603.4 | 11199.3 [11135.8, 11283.8] | 14135.3 [14092.9, 14182.1] | 14569.5 | 15566.8 |

### Counts

| Phase | Count | Value |
|---|---|---|
| n10000 | createFailed | 0 |
| n10000 | deleteFailed | 0 |
| n10000 | mandates | 10000 |
| n10000 | mandatesWithoutTick | 0 |
| n10000 | tickReadFailures | 0 |
| n10000 | ticksFailed | 0 |
| n10000 | ticksRunningAtWindowEnd | 9548 |
| n10000 | ticksStarted | 10388 |
| n10000 | wakesHandled | 10388 |
| n10000 | wakesPendingAtWindowEnd | 33 |

## Server stage breakdown (whole run)

From /metrics before and after; server-wide, so concurrent traffic and several replicas blur it.

| Series | Count | Total | Mean | Unit |
|---|---|---|---|---|
| garrison_run_stage_duration_seconds{agent="keeper-bench",deployment="keeper-bench-fake",harness="Generic",model="none",stage="total",tenant="ten_mwyeq0fi_578Er1hklC7ZmXlbzNN"} | 9595 | 1664858913.0 | 173513.17 | ms |
| garrison_run_stage_duration_seconds{agent="keeper-bench",deployment="keeper-bench-fake",harness="Generic",model="fake-model",stage="total",tenant="ten_mwyeq0fi_578Er1hklC7ZmXlbzNN"} | 1016 | 111842583.0 | 110081.28 | ms |
| garrison_keeper_tick_lag_duration_seconds{source="timer"} | 10609 | 111250735.6 | 10486.45 | ms |
| garrison_run_stage_duration_seconds{agent="keeper-bench",deployment="keeper-bench-fake",harness="Generic",model="fake-model",stage="queue",tenant="ten_mwyeq0fi_578Er1hklC7ZmXlbzNN"} | 1016 | 110624612.0 | 108882.49 | ms |
| garrison_keeper_interval_seconds{mode="fixed"} | 1073 | 64380000.0 | 60000.00 | ms |
| db_client_operation_duration_seconds{db_client_connection_pool_name="Host=127.0.0.1;Port=55432;Database=garrison_bench;Username=postgres;Maximum Pool Size=100;Minimum Pool Size=0;Timeout=15;Command Timeout=30;Connection Idle Lifetime=300",db_system_name="postgresql",server_address="127.0.0.1",server_port="55432"} | 1660513 | 6737955.6 | 4.06 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/tenants/{tenantId}/mandates",status_class="2xx",tenant="ten_mwyeq0fi_578Er1hklC7ZmXlbzNN"} | 9997 | 1357442.0 | 135.78 | ms |
| garrison_run_stage_duration_seconds{agent="keeper-bench",deployment="keeper-bench-fake",harness="Generic",model="none",stage="queue",tenant="ten_mwyeq0fi_578Er1hklC7ZmXlbzNN"} | 7 | 1351077.0 | 193011.00 | ms |
| garrison_db_operation_duration_seconds{operation="transaction",provider="postgresql",result="ok",table="none"} | 107399 | 1346247.4 | 12.54 | ms |
| garrison_application_operation_duration_seconds{component="run",operation="admission",result="ok"} | 10609 | 1318236.7 | 124.26 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/lease",status_class="2xx",tenant="default"} | 765 | 1027751.4 | 1343.47 | ms |
| garrison_db_operation_duration_seconds{operation="select",provider="postgresql",result="ok",table="runs"} | 175773 | 937203.0 | 5.33 | ms |
| garrison_http_request_duration_seconds{method="DELETE",route="/v1.0/api/tenants/{tenantId}/mandates/{id}",status_class="2xx",tenant="ten_mwyeq0fi_578Er1hklC7ZmXlbzNN"} | 9996 | 896846.3 | 89.72 | ms |
| garrison_db_operation_duration_seconds{operation="select",provider="postgresql",result="ok",table="mandate_ticks"} | 136079 | 726524.9 | 5.34 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="empty"} | 30 | 601260.4 | 20042.01 | ms |

## Published and prior baselines

| Metric | Source | Baseline | This run | Net | Note |
|---|---|---|---|---|---|
| (all) | no comparable published result | none | n/a | n/a | No public benchmark measures an agent-harness control plane (scheduling runs of headless CLI agents onto pull-based workers), so there is no published score to compare against. The closest public data, the Azure Functions and Alibaba cluster traces, are workloads without an oracle; see BENCHMARKING.md, Datasets. |

## Notes

- Keeper settings are the server's (defaults: Autonomy.SchedulerSweepSeconds 5, Autonomy.MaxDueClaimsPerSweep 1000, Autonomy.SchedulerSweepConcurrency 32, Autonomy.MinIntervalSeconds 60). A sweep claims at most MaxDueClaimsPerSweep due wakes, SchedulerSweepConcurrency at a time, so the scheduler handles at most MaxDueClaimsPerSweep / SchedulerSweepSeconds wakes per second, less when the database cannot start that many runs in the time; mandates beyond that rate times the interval build a backlog.
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
| --deterministic | false |
| --interval-seconds | 60 |
| --kubeconfig | (unset) |
| --label | ba2-pg-claims2500 |
| --levels | 10000 |
| --max-connections | 1024 |
| --namespace | garrison |
| --request-timeout-seconds | 660 |
| --resamples | 2000 |
| --results-dir | (unset) |
| --seed | 42 |
| --shared-note | (unset) |
| --stack | local |
| --stack-details | local processes from the working tree: 1 server (PostgreSQL), 1 alpha + 1 beta workers x 4 slots |
| --sut-commit | (unset) |
| --url | http://127.0.0.1:37800 |
| --window-seconds | 90 |
| --workload | benchmarks/config/autonomy-workload.yaml |

