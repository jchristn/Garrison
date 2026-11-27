# Keeper scheduler report: autonomy-workload (ba2-sqlite)

## Provenance

| Field | Value |
|---|---|
| Started (UTC) | 2026-11-27 02:49:48 |
| Finished (UTC) | 2026-11-27 03:01:32 |
| System under test | http://127.0.0.1:37800 (server 0.3.0) |
| Stack | local: local processes from the working tree: 1 server (Sqlite), 1 alpha + 1 beta workers x 4 slots |
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
| Command line | `Garrison.Benchmark scheduler --url http://127.0.0.1:37800 --stack local --fake-harness <repo>/benchmarks/.run/build/bin/Garrison.FakeHarness/release_net10.0/garrison-fake-harness.dll --stack-details "local processes from the working tree: 1 server (Sqlite), 1 alpha + 1 beta workers x 4 slots" --levels 1,100,1000,10000 --window-seconds 120 --label ba2-sqlite --shared-note "local stack on the development laptop; other agent sessions were active on the machine"` |

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
| scheduler | n1 | 1 | 2 | 2 | 0 | 0 | 120.0 | 0.02 |
| scheduler | n100 | 100 | 200 | 200 | 0 | 0 | 120.2 | 1.66 |
| scheduler | n1000 | 1000 | 2000 | 2000 | 0 | 0 | 123.1 | 16.24 |
| scheduler | n10000 | 10000 | 11158 | 11087 | 0 | 71 | 189.7 | 58.45 |

### Distributions (ms)

| Phase | Measure | n | mean | p50 [95% CI] | p95 [95% CI] | p99 | max |
|---|---|---|---|---|---|---|---|
| n1 | createLatencyMs | 1 | 31.0 | 31.0 | 31.0 | 31.0 | 31.0 |
| n1 | firstWakeLagMs | 1 | 245.4 | 245.4 | 245.4 | 245.4 | 245.4 |
| n1 | startedTickLagMs | 2 | 3007.5 | 245.4 [245.4, 5769.7] (indicative) | 5769.7 [245.4, 5769.7] (indicative) | 5769.7 | 5769.7 |
| n1 | tickLagMs | 2 | 3007.5 | 245.4 [245.4, 5769.7] (indicative) | 5769.7 [245.4, 5769.7] (indicative) | 5769.7 | 5769.7 |
| n100 | createLatencyMs | 100 | 33.5 | 26.1 [25.1, 35.3] | 68.3 [64.1, 68.6] | 68.6 | 68.8 |
| n100 | firstWakeLagMs | 100 | 396.4 | 398.6 [379.2, 399.4] | 455.3 [440.9, 497.9] | 499.9 | 500.7 |
| n100 | startedTickLagMs | 200 | 2325.5 | 500.7 [440.5, 3072.9] | 5515.6 [5201.0, 5781.5] | 5816.3 | 5875.8 |
| n100 | tickLagMs | 200 | 2325.5 | 500.7 [440.4, 3112.5] | 5515.6 [5201.0, 5781.5] | 5816.3 | 5875.8 |
| n1000 | createLatencyMs | 1000 | 49.0 | 19.9 [19.6, 20.2] | 149.4 [145.7, 159.0] | 187.3 | 198.8 |
| n1000 | firstWakeLagMs | 1000 | 2982.4 | 2641.7 [2542.7, 2726.3] | 5567.0 [5520.6, 5595.4] | 5704.8 | 5723.2 |
| n1000 | startedTickLagMs | 2000 | 3251.1 | 2946.4 [2834.6, 3043.1] | 5853.0 [5723.2, 5965.1] | 6388.1 | 6659.7 |
| n1000 | tickLagMs | 2000 | 3251.1 | 2946.4 [2840.1, 3047.3] | 5853.0 [5723.2, 5965.1] | 6388.1 | 6659.7 |
| n10000 | createLatencyMs | 10000 | 111.4 | 47.3 [46.3, 48.2] | 317.8 [311.0, 324.7] | 476.8 | 717.5 |
| n10000 | firstWakeLagMs | 10000 | 23526.8 | 24517.6 [24166.4, 24830.4] | 44525.0 [43987.2, 44870.9] | 50455.7 | 51302.0 |
| n10000 | startedTickLagMs | 11087 | 22626.7 | 23655.0 [23220.1, 23950.1] | 44524.5 [44003.2, 44870.9] | 50450.5 | 51302.0 |
| n10000 | tickLagMs | 11158 | 22493.7 | 23509.9 [23114.3, 23835.0] | 44523.3 [43986.4, 44863.1] | 50450.1 | 51302.0 |

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
| n1000 | ticksStarted | 2000 |
| n1000 | wakesHandled | 2000 |
| n1000 | wakesPendingAtWindowEnd | 0 |
| n10000 | createFailed | 0 |
| n10000 | deleteFailed | 0 |
| n10000 | mandates | 10000 |
| n10000 | mandatesWithoutTick | 0 |
| n10000 | tickReadFailures | 0 |
| n10000 | ticksFailed | 0 |
| n10000 | ticksRunningAtWindowEnd | 8481 |
| n10000 | ticksStarted | 11087 |
| n10000 | wakesHandled | 11087 |
| n10000 | wakesPendingAtWindowEnd | 71 |

## Server stage breakdown (whole run)

From /metrics before and after; server-wide, so concurrent traffic and several replicas blur it.

| Series | Count | Total | Mean | Unit |
|---|---|---|---|---|
| garrison_run_stage_duration_seconds{agent="keeper-bench",deployment="keeper-bench-fake",harness="Generic",model="none",stage="total",tenant="ten_mwydv9td_PyxVjoZgd4dkL1F2LLy"} | 9228 | 1545679453.0 | 167498.86 | ms |
| garrison_run_stage_duration_seconds{agent="keeper-bench",deployment="keeper-bench-fake",harness="Generic",model="fake-model",stage="total",tenant="ten_mwydv9td_PyxVjoZgd4dkL1F2LLy"} | 5356 | 409286665.0 | 76416.48 | ms |
| garrison_run_stage_duration_seconds{agent="keeper-bench",deployment="keeper-bench-fake",harness="Generic",model="fake-model",stage="queue",tenant="ten_mwydv9td_PyxVjoZgd4dkL1F2LLy"} | 5356 | 407405625.0 | 76065.28 | ms |
| garrison_keeper_interval_seconds{mode="fixed"} | 5451 | 327060000.0 | 60000.00 | ms |
| garrison_keeper_tick_lag_duration_seconds{source="timer"} | 14588 | 263310467.3 | 18049.80 | ms |
| garrison_run_stage_duration_seconds{agent="keeper-bench",deployment="keeper-bench-fake",harness="Generic",model="none",stage="queue",tenant="ten_mwydv9td_PyxVjoZgd4dkL1F2LLy"} | 552 | 117976502.0 | 213725.55 | ms |
| garrison_db_write_lock_wait_seconds{provider="sqlite"} | 394054 | 6184503.3 | 15.69 | ms |
| garrison_application_operation_duration_seconds{component="run",operation="admission",result="ok"} | 14588 | 3057973.0 | 209.62 | ms |
| garrison_db_operation_duration_seconds{operation="select",provider="sqlite",result="ok",table="runs"} | 277969 | 2709166.3 | 9.75 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/lease",status_class="2xx",tenant="default"} | 5127 | 2589712.7 | 505.11 | ms |
| garrison_db_operation_duration_seconds{operation="transaction",provider="sqlite",result="ok",table="none"} | 158708 | 2442275.6 | 15.39 | ms |
| garrison_http_request_duration_seconds{method="DELETE",route="/v1.0/api/tenants/{tenantId}/mandates/{id}",status_class="2xx",tenant="ten_mwydv9td_PyxVjoZgd4dkL1F2LLy"} | 11090 | 2134015.4 | 192.43 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="empty"} | 91 | 1820209.8 | 20002.31 | ms |
| garrison_application_operation_duration_seconds{component="run",operation="cancel",result="ok"} | 9339 | 1783505.1 | 190.97 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/tenants/{tenantId}/mandates",status_class="2xx",tenant="ten_mwydv9td_PyxVjoZgd4dkL1F2LLy"} | 11100 | 1145660.2 | 103.21 | ms |

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
| --label | ba2-sqlite |
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

