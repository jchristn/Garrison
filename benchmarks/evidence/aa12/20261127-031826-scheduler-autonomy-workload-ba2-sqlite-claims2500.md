# Keeper scheduler report: autonomy-workload (ba2-sqlite-claims2500)

## Provenance

| Field | Value |
|---|---|
| Started (UTC) | 2026-11-27 03:18:26 |
| Finished (UTC) | 2026-11-27 03:23:48 |
| System under test | http://127.0.0.1:37800 (server 0.3.0) |
| Stack | local: local processes from the working tree: 1 server (Sqlite), 1 alpha + 1 beta workers x 4 slots |
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
| Command line | `Garrison.Benchmark scheduler --url http://127.0.0.1:37800 --stack local --fake-harness <repo>/benchmarks/.run/build/bin/Garrison.FakeHarness/release_net10.0/garrison-fake-harness.dll --stack-details "local processes from the working tree: 1 server (Sqlite), 1 alpha + 1 beta workers x 4 slots" --levels 10000 --window-seconds 90 --label ba2-sqlite-claims2500` |

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
| scheduler | n10000 | 10000 | 10691 | 10660 | 0 | 31 | 172.7 | 61.73 |

### Distributions (ms)

| Phase | Measure | n | mean | p50 [95% CI] | p95 [95% CI] | p99 | max |
|---|---|---|---|---|---|---|---|
| n10000 | createLatencyMs | 10000 | 132.0 | 97.0 [91.2, 101.5] | 374.3 [368.6, 382.2] | 563.9 | 1467.7 |
| n10000 | firstWakeLagMs | 10000 | 19958.7 | 20416.7 [20054.0, 20752.3] | 31780.8 [31731.6, 31824.4] | 32189.3 | 35685.9 |
| n10000 | startedTickLagMs | 10660 | 19882.3 | 20432.9 [20148.1, 20904.0] | 31795.1 [31761.3, 31848.3] | 34315.3 | 35685.9 |
| n10000 | tickLagMs | 10691 | 19832.3 | 20420.6 [20064.8, 20883.6] | 31794.3 [31761.3, 31847.3] | 34315.3 | 35685.9 |

### Counts

| Phase | Count | Value |
|---|---|---|
| n10000 | createFailed | 0 |
| n10000 | deleteFailed | 0 |
| n10000 | mandates | 10000 |
| n10000 | mandatesWithoutTick | 0 |
| n10000 | tickReadFailures | 0 |
| n10000 | ticksFailed | 0 |
| n10000 | ticksRunningAtWindowEnd | 9211 |
| n10000 | ticksStarted | 10660 |
| n10000 | wakesHandled | 10660 |
| n10000 | wakesPendingAtWindowEnd | 31 |

## Server stage breakdown (whole run)

From /metrics before and after; server-wide, so concurrent traffic and several replicas blur it.

| Series | Count | Total | Mean | Unit |
|---|---|---|---|---|
| garrison_run_stage_duration_seconds{agent="keeper-bench",deployment="keeper-bench-fake",harness="Generic",model="none",stage="total",tenant="ten_mwyew3bp_O96tWQtmT9jmNKRnZvv"} | 9382 | 1799589834.0 | 191813.03 | ms |
| garrison_keeper_tick_lag_duration_seconds{source="timer"} | 11220 | 214452158.9 | 19113.38 | ms |
| garrison_run_stage_duration_seconds{agent="keeper-bench",deployment="keeper-bench-fake",harness="Generic",model="fake-model",stage="total",tenant="ten_mwyew3bp_O96tWQtmT9jmNKRnZvv"} | 1838 | 201046198.0 | 109383.13 | ms |
| garrison_run_stage_duration_seconds{agent="keeper-bench",deployment="keeper-bench-fake",harness="Generic",model="fake-model",stage="queue",tenant="ten_mwyew3bp_O96tWQtmT9jmNKRnZvv"} | 1838 | 200026975.0 | 108828.60 | ms |
| garrison_keeper_interval_seconds{mode="fixed"} | 2009 | 120540000.0 | 60000.00 | ms |
| garrison_run_stage_duration_seconds{agent="keeper-bench",deployment="keeper-bench-fake",harness="Generic",model="none",stage="queue",tenant="ten_mwyew3bp_O96tWQtmT9jmNKRnZvv"} | 293 | 62137708.0 | 212074.09 | ms |
| garrison_db_write_lock_wait_seconds{provider="sqlite"} | 277382 | 5779391.6 | 20.84 | ms |
| garrison_application_operation_duration_seconds{component="run",operation="admission",result="ok"} | 11220 | 2517972.1 | 224.42 | ms |
| garrison_db_operation_duration_seconds{operation="select",provider="sqlite",result="ok",table="runs"} | 220368 | 2426291.8 | 11.01 | ms |
| garrison_db_operation_duration_seconds{operation="transaction",provider="sqlite",result="ok",table="none"} | 127560 | 2403017.2 | 18.84 | ms |
| garrison_http_request_duration_seconds{method="DELETE",route="/v1.0/api/tenants/{tenantId}/mandates/{id}",status_class="2xx",tenant="ten_mwyew3bp_O96tWQtmT9jmNKRnZvv"} | 9993 | 1928167.3 | 192.95 | ms |
| garrison_application_operation_duration_seconds{component="run",operation="cancel",result="ok"} | 9457 | 1577377.8 | 166.79 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/tenants/{tenantId}/mandates",status_class="2xx",tenant="ten_mwyew3bp_O96tWQtmT9jmNKRnZvv"} | 9998 | 1298775.1 | 129.90 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/lease",status_class="2xx",tenant="default"} | 1676 | 1232552.9 | 735.41 | ms |
| garrison_db_operation_duration_seconds{operation="upsert",provider="sqlite",result="ok",table="run_database_usage"} | 41036 | 1021117.7 | 24.88 | ms |

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
| --label | ba2-sqlite-claims2500 |
| --levels | 10000 |
| --max-connections | 1024 |
| --namespace | garrison |
| --request-timeout-seconds | 660 |
| --resamples | 2000 |
| --results-dir | (unset) |
| --seed | 42 |
| --shared-note | (unset) |
| --stack | local |
| --stack-details | local processes from the working tree: 1 server (Sqlite), 1 alpha + 1 beta workers x 4 slots |
| --sut-commit | (unset) |
| --url | http://127.0.0.1:37800 |
| --window-seconds | 90 |
| --workload | benchmarks/config/autonomy-workload.yaml |

