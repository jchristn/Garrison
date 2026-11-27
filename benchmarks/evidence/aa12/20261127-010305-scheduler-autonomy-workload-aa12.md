# Keeper scheduler report: autonomy-workload (aa12)

## Provenance

| Field | Value |
|---|---|
| Started (UTC) | 2026-11-27 01:03:05 |
| Finished (UTC) | 2026-11-27 01:11:30 |
| System under test | http://127.0.0.1:37800 (server 0.3.0) |
| Stack | local: local processes from the working tree: 1 server (Sqlite), 1 alpha + 1 beta workers x 4 slots |
| Product commit | 78891d4e22928d95b3bf7b221d0a10b5f541b91b-dirty (1 changed or untracked paths) |
| Harness | Garrison.Benchmark 1.0.0, commit 78891d4e22928d95b3bf7b221d0a10b5f541b91b |
| Machine | scrubbed, macOS 26.6.0 (Arm64), Apple M5 Max (Arm64), 18 logical processors |
| Runtime | .NET 10.0.14 |
| HTTP client | SocketsHttpHandler, MaxConnectionsPerServer 1024, timeout 660 s, pooled connection lifetime 30 s, connect timeout 10 s |
| Dataset | autonomy-workload (benchmarks/config/autonomy-workload.yaml) |
| Dataset SHA-256 | 3ad2f90916049c41d40651fbb8e531455b8258ff6e2dfe744618adf4e4c1a422 |
| External services | none: every run uses the fake harness (garrison-fake-harness), no model or paid service |
| Shared machine | local stack on the development laptop; other agent sessions were active on the machine |
| Seed | 42 |
| Deterministic | no |
| Command line | `Garrison.Benchmark scheduler --url http://127.0.0.1:37800 --stack local --fake-harness <repo>/benchmarks/.run/build/bin/Garrison.FakeHarness/release_net10.0/garrison-fake-harness.dll --stack-details "local processes from the working tree: 1 server (Sqlite), 1 alpha + 1 beta workers x 4 slots" --levels 1,100,1000,10000 --window-seconds 120 --label aa12 --shared-note "local stack on the development laptop; other agent sessions were active on the machine"` |

## Summary

| Arm | Outcomes | Passed | Errors | Pass rate [95% CI] | Latency p50 [95% CI] (ms) | p95 [95% CI] (ms) |
|---|---|---|---|---|---|---|
| garrison | 16 | 15 | 0 | 0.938 [0.812, 1.000] (indicative) | n/a | n/a |


### By probe type, garrison

| Type | n | Passed | Pass rate [95% CI] |
|---|---|---|---|
| create | 4 | 4 | 1.000 [1.000, 1.000] (indicative) |
| first-wake | 4 | 3 | 0.750 [0.250, 1.000] (indicative) |
| single-flight | 4 | 4 | 1.000 [1.000, 1.000] (indicative) |
| tick-runs | 4 | 4 | 1.000 [1.000, 1.000] (indicative) |

### By category, garrison

| Category | n | Passed | Pass rate [95% CI] |
|---|---|---|---|
| n1 | 4 | 4 | 1.000 [1.000, 1.000] (indicative) |
| n100 | 4 | 4 | 1.000 [1.000, 1.000] (indicative) |
| n1000 | 4 | 4 | 1.000 [1.000, 1.000] (indicative) |
| n10000 | 4 | 3 | 0.750 [0.250, 1.000] (indicative) |

## Phases

Censored values are lower bounds (a wake or message still waiting when the window closed) and are included in the distributions.

| Scenario | Phase | Size | Operations | Succeeded | Failed | Censored | Window (s) | Throughput (ops/s) |
|---|---|---|---|---|---|---|---|---|
| scheduler | n1 | 1 | 2 | 2 | 0 | 0 | 120.0 | 0.02 |
| scheduler | n100 | 100 | 200 | 200 | 0 | 0 | 120.1 | 1.67 |
| scheduler | n1000 | 1000 | 1900 | 1800 | 0 | 100 | 120.5 | 14.94 |
| scheduler | n10000 | 10000 | 11000 | 2200 | 0 | 8800 | 128.0 | 17.18 |

### Distributions (ms)

| Phase | Measure | n | mean | p50 [95% CI] | p95 [95% CI] | p99 | max |
|---|---|---|---|---|---|---|---|
| n1 | createLatencyMs | 1 | 1.2 | 1.2 | 1.2 | 1.2 | 1.2 |
| n1 | firstWakeLagMs | 1 | 3331.8 | 3331.8 | 3331.8 | 3331.8 | 3331.8 |
| n1 | startedTickLagMs | 2 | 4666.1 | 3331.8 [3331.8, 6000.4] (indicative) | 6000.4 [3331.8, 6000.4] (indicative) | 6000.4 | 6000.4 |
| n1 | tickLagMs | 2 | 4666.1 | 3331.8 [3331.8, 6000.4] (indicative) | 6000.4 [3331.8, 6000.4] (indicative) | 6000.4 | 6000.4 |
| n100 | createLatencyMs | 100 | 11.4 | 10.8 [10.2, 11.7] | 18.4 [14.6, 18.9] | 19.1 | 19.1 |
| n100 | firstWakeLagMs | 100 | 3457.0 | 3455.9 [3450.8, 3463.5] | 3486.9 [3484.1, 3487.1] | 3487.2 | 3487.3 |
| n100 | startedTickLagMs | 200 | 3865.4 | 3472.3 [3464.5, 3484.1] | 5978.9 [5882.8, 6059.0] | 6112.0 | 6133.7 |
| n100 | tickLagMs | 200 | 3865.4 | 3472.3 [3464.2, 3484.3] | 5978.9 [5882.8, 6059.0] | 6112.0 | 6133.7 |
| n1000 | createLatencyMs | 1000 | 8.0 | 8.1 [8.0, 8.1] | 9.9 [9.5, 10.2] | 12.7 | 13.8 |
| n1000 | firstWakeLagMs | 1000 | 34035.7 | 30789.1 [30768.7, 37285.0] | 63922.6 [63914.8, 63930.5] | 63945.0 | 63948.3 |
| n1000 | startedTickLagMs | 1800 | 21424.4 | 7804.6 [7363.0, 10843.3] | 63905.4 [57351.9, 63912.8] | 63939.1 | 63948.3 |
| n1000 | tickLagMs | 1900 | 20383.3 | 7314.4 [7095.4, 7714.2] | 63901.1 [57349.8, 63910.8] | 63938.9 | 63948.3 |
| n10000 | createLatencyMs | 10000 | 12.9 | 11.1 [11.0, 11.1] | 23.4 [23.3, 23.5] | 26.1 | 34.8 |
| n10000 | firstWakeLagMs | 10000 | 111037.3 | 123004.4 [122880.9, 123126.0] | 126137.8 [126101.5, 126163.2] | 126426.1 | 126499.0 |
| n10000 | startedTickLagMs | 2200 | 66718.7 | 67388.9 [67355.9, 72361.5] | 119540.1 [119521.3, 124565.1] | 124614.3 | 124628.9 |
| n10000 | tickLagMs | 11000 | 104102.1 | 122342.2 [122208.0, 122471.3] | 126100.4 [126062.8, 126132.7] | 126415.8 | 126499.0 |

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
| n1000 | ticksRunningAtWindowEnd | 0 |
| n1000 | ticksStarted | 1800 |
| n1000 | wakesHandled | 1800 |
| n1000 | wakesPendingAtWindowEnd | 100 |
| n10000 | createFailed | 0 |
| n10000 | deleteFailed | 0 |
| n10000 | mandates | 10000 |
| n10000 | mandatesWithoutTick | 7800 |
| n10000 | tickReadFailures | 0 |
| n10000 | ticksFailed | 0 |
| n10000 | ticksRunningAtWindowEnd | 0 |
| n10000 | ticksStarted | 2200 |
| n10000 | wakesHandled | 2200 |
| n10000 | wakesPendingAtWindowEnd | 8800 |

## Server stage breakdown (whole run)

From /metrics before and after; server-wide, so concurrent traffic and several replicas blur it.

| Series | Count | Total | Mean | Unit |
|---|---|---|---|---|
| garrison_keeper_interval_seconds{mode="fixed"} | 4378 | 262680000.0 | 60000.00 | ms |
| garrison_keeper_tick_lag_duration_seconds{source="timer"} | 4400 | 203484212.6 | 46246.41 | ms |
| garrison_run_stage_duration_seconds{agent="keeper-bench",deployment="keeper-bench-fake",harness="Generic",model="fake-model",stage="total",tenant="ten_mwya20zy_OA2PWSHctejW7x1Hz6y"} | 4385 | 2571770.0 | 586.49 | ms |
| garrison_run_stage_duration_seconds{agent="keeper-bench",deployment="keeper-bench-fake",harness="Generic",model="fake-model",stage="queue",tenant="ten_mwya20zy_OA2PWSHctejW7x1Hz6y"} | 4385 | 1980968.0 | 451.76 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/lease",status_class="2xx",tenant="default"} | 4425 | 1936795.7 | 437.69 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="empty"} | 71 | 1420045.5 | 20000.64 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/watch",status_class="aborted",tenant="default"} | 4329 | 624834.8 | 144.34 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="assigned"} | 4354 | 514449.6 | 118.16 | ms |
| garrison_run_stage_duration_seconds{agent="keeper-bench",deployment="keeper-bench-fake",harness="Generic",model="fake-model",stage="execution",tenant="ten_mwya20zy_OA2PWSHctejW7x1Hz6y"} | 4385 | 373970.0 | 85.28 | ms |
| garrison_db_write_lock_wait_seconds{provider="sqlite"} | 251343 | 236682.0 | 0.94 | ms |
| garrison_run_stage_duration_seconds{agent="keeper-bench",deployment="keeper-bench-fake",harness="Generic",model="fake-model",stage="first_token",tenant="ten_mwya20zy_OA2PWSHctejW7x1Hz6y"} | 4385 | 213114.0 | 48.60 | ms |
| garrison_run_stage_duration_seconds{agent="keeper-bench",deployment="keeper-bench-fake",harness="Generic",model="fake-model",stage="first_token_excl_delegation",tenant="ten_mwya20zy_OA2PWSHctejW7x1Hz6y"} | 4385 | 213114.0 | 48.60 | ms |
| garrison_db_operation_duration_seconds{operation="transaction",provider="sqlite",result="ok",table="none"} | 126040 | 202777.2 | 1.61 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/tenants/{tenantId}/mandates",status_class="2xx",tenant="ten_mwya20zy_OA2PWSHctejW7x1Hz6y"} | 11101 | 135168.8 | 12.18 | ms |
| garrison_run_stage_duration_seconds{agent="keeper-bench",deployment="keeper-bench-fake",harness="Generic",model="fake-model",stage="streaming",tenant="ten_mwya20zy_OA2PWSHctejW7x1Hz6y"} | 4385 | 111945.0 | 25.53 | ms |

## Published and prior baselines

| Metric | Source | Baseline | This run | Net | Note |
|---|---|---|---|---|---|
| (all) | no comparable published result | none | n/a | n/a | No public benchmark measures an agent-harness control plane (scheduling runs of headless CLI agents onto pull-based workers), so there is no published score to compare against. The closest public data, the Azure Functions and Alibaba cluster traces, are workloads without an oracle; see BENCHMARKING.md, Datasets. |

## Misses

| Arm | Probe | Repeat | Type | What went wrong | Observed |
|---|---|---|---|---|---|
| garrison | scheduler/n10000-first-wake | 0 | first-wake | mdt_mwya9ueg_dQRvO0prS9CW50mqLXh had no tick by the window end; mdt_mwya9ueh_8GyfFSmkw74pVDU33Ap had no tick by the window end; mdt_mwya9ueh_KsL3EkvfsMIY1n1ibBk had no tick by the window end; mdt_mwya9ueh_ylJdGbJgzAnwMBcM1UN had no tick by the window end; mdt_mwya9uei_dOo0AKLpEVe917BnkW2 had no tick by the window end; and 7795 more | 2200 of 10000 mandates ticked by the window end |

## Notes

- Keeper settings are the server's (defaults: Autonomy.SchedulerSweepSeconds 5, Autonomy.MaxDueClaimsPerSweep 100, Autonomy.MinIntervalSeconds 60). A sweep claims at most MaxDueClaimsPerSweep due wakes, so the scheduler handles at most MaxDueClaimsPerSweep / SchedulerSweepSeconds wakes per second, and mandates beyond that rate times the interval build a backlog.
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
| --label | aa12 |
| --levels | 1,100,1000,10000 |
| --max-connections | 1024 |
| --namespace | garrison |
| --request-timeout-seconds | 660 |
| --resamples | 2000 |
| --results-dir | (unset) |
| --seed | 42 |
| --shared-note | local stack on the development laptop; other agent sessions were active on the machine |
| --stack | local |
| --stack-details | local processes from the working tree: 1 server (Sqlite), 1 alpha + 1 beta workers x 4 slots |
| --sut-commit | (unset) |
| --url | http://127.0.0.1:37800 |
| --window-seconds | 120 |
| --workload | benchmarks/config/autonomy-workload.yaml |

