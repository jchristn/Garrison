# Messaging report: autonomy-workload (ci-gate)

## Provenance

| Field | Value |
|---|---|
| Started (UTC) | 2026-11-27 01:13:04 |
| Finished (UTC) | 2026-11-27 01:13:22 |
| System under test | http://127.0.0.1 (bench stack) (server 0.3.0) |
| Stack | local |
| Product commit | 71ea9abc40b475c984a1a4c252638b25d255a9f1-dirty (2 changed or untracked paths) |
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
| Command line | `Garrison.Benchmark messaging --recipients 5 --messages 40 --rounds 2 --deterministic true --url http://127.0.0.1:37800 --stack local --label ci-gate --results-dir <repo>/benchmarks/results --seed 42` |

## Summary

| Arm | Outcomes | Passed | Errors | Pass rate [95% CI] | Latency p50 [95% CI] (ms) | p95 [95% CI] (ms) |
|---|---|---|---|---|---|---|
| garrison | 5 | 5 | 0 | 1.000 [1.000, 1.000] (indicative) | n/a | n/a |


### By probe type, garrison

| Type | n | Passed | Pass rate [95% CI] |
|---|---|---|---|
| all-delivered | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| coalesced | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| delivered-to-keeper | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| send-accepted | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| urgent-wakes | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |

### By category, garrison

| Category | n | Passed | Pass rate [95% CI] |
|---|---|---|---|
| delivery | 4 | 4 | 1.000 [1.000, 1.000] (indicative) |
| send | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |

## Phases

Censored values are lower bounds (a wake or message still waiting when the window closed) and are included in the distributions.

| Scenario | Phase | Size | Operations | Succeeded | Failed | Censored | Window (s) | Throughput (ops/s) |
|---|---|---|---|---|---|---|---|---|
| messaging | send | 50 | 50 | 50 | 0 | 0 | 0.0 | 1071.12 |
| messaging | urgent-delivery | 10 | 10 | 10 | 0 | 0 | 11.5 | 0.87 |
| messaging | normal-delivery | 40 | 40 | 40 | 0 | 0 | 11.5 | 3.47 |

### Distributions (ms)

| Phase | Measure | n | mean | p50 [95% CI] | p95 [95% CI] | p99 | max |
|---|---|---|---|---|---|---|---|
| send | sendLatencyMs | 50 | 5.8 | 3.7 [3.1, 4.1] | 18.9 [18.8, 18.9] | 18.9 | 18.9 |
| urgent-delivery | deliveryLagMs | 10 | 5614.3 | 5494.7 [5460.7, 5754.2] (indicative) | 5776.8 [5747.4, 5776.8] (indicative) | 5776.8 | 5776.8 |
| normal-delivery | queuedDeliveryLagMs | 40 | 5622.4 | 5504.0 [5487.1, 5759.6] | 5782.4 [5768.1, 5795.3] | 5795.3 | 5795.3 |

### Counts

| Phase | Count | Value |
|---|---|---|
| send | normalAccepted | 40 |
| send | urgentAccepted | 10 |
| urgent-delivery | deliveredAll | 50 |
| urgent-delivery | messageTicks | 10 |

## Server stage breakdown (whole run)

From /metrics before and after; server-wide, so concurrent traffic and several replicas blur it.

| Series | Count | Total | Mean | Unit |
|---|---|---|---|---|
| garrison_keeper_interval_seconds{mode="fixed"} | 15 | 54000000.0 | 3600000.00 | ms |
| garrison_message_delivery_lag_duration_seconds{urgency="normal"} | 40 | 224897.1 | 5622.43 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/watch",status_class="aborted",tenant="default"} | 14 | 72360.1 | 5168.58 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/lease",status_class="2xx",tenant="default"} | 16 | 72089.8 | 4505.61 | ms |
| garrison_message_delivery_lag_duration_seconds{urgency="urgent"} | 10 | 56143.5 | 5614.35 | ms |
| garrison_keeper_tick_lag_duration_seconds{source="message"} | 10 | 55886.9 | 5588.69 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="empty"} | 2 | 40003.8 | 20001.92 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="assigned"} | 14 | 32076.8 | 2291.20 | ms |
| garrison_keeper_tick_lag_duration_seconds{source="timer"} | 5 | 21193.4 | 4238.69 | ms |
| voltaic_server_session_duration_seconds{voltaic_protocol="mcp",voltaic_reason="deleted",voltaic_transport="http"} | 15 | 612.8 | 40.85 | ms |
| garrison_run_stage_duration_seconds{agent="inbox-002",deployment="inbox-002-fake",harness="Generic",model="fake-model",stage="total",tenant="ten_mwyaevfu_ToOHInXqVGrurlQMuYc"} | 3 | 549.0 | 183.00 | ms |
| garrison_run_stage_duration_seconds{agent="inbox-003",deployment="inbox-003-fake",harness="Generic",model="fake-model",stage="total",tenant="ten_mwyaevfu_ToOHInXqVGrurlQMuYc"} | 3 | 547.0 | 182.33 | ms |
| garrison_run_stage_duration_seconds{agent="inbox-000",deployment="inbox-000-fake",harness="Generic",model="fake-model",stage="total",tenant="ten_mwyaevfu_ToOHInXqVGrurlQMuYc"} | 3 | 538.0 | 179.33 | ms |
| garrison_run_stage_duration_seconds{agent="inbox-004",deployment="inbox-004-fake",harness="Generic",model="fake-model",stage="total",tenant="ten_mwyaevfu_ToOHInXqVGrurlQMuYc"} | 3 | 532.0 | 177.33 | ms |
| garrison_run_stage_duration_seconds{agent="inbox-001",deployment="inbox-001-fake",harness="Generic",model="fake-model",stage="total",tenant="ten_mwyaevfu_ToOHInXqVGrurlQMuYc"} | 3 | 526.0 | 175.33 | ms |

## Published and prior baselines

| Metric | Source | Baseline | This run | Net | Note |
|---|---|---|---|---|---|
| (all) | no comparable published result | none | n/a | n/a | No public benchmark measures an agent-harness control plane (scheduling runs of headless CLI agents onto pull-based workers), so there is no published score to compare against. The closest public data, the Azure Functions and Alibaba cluster traces, are workloads without an oracle; see BENCHMARKING.md, Datasets. |

## Notes

- Messages are sent as a person (the system administrator key), so the line policy does not apply; freezes, the thread budget, and Messaging.LineRatePerMinute do. Urgent wakes are limited by Messaging.UrgentWakesPerHour (default 12), so --rounds is at most 12.
- Delivery is measured with server timestamps: createdUtc when the message is stored, deliveredUtc when the keeper tick that carries it claims it, before the tick's run starts.

## Options

| Option | Value |
|---|---|
| --body-bytes | 512 |
| --concurrency | 8 |
| --connection-lifetime-seconds | 30 |
| --context | (unset) |
| --delivery-timeout-seconds | 120 |
| --deterministic | true |
| --kubeconfig | (unset) |
| --label | ci-gate |
| --max-connections | 1024 |
| --messages | 40 |
| --namespace | garrison |
| --recipients | 5 |
| --request-timeout-seconds | 660 |
| --resamples | 2000 |
| --results-dir | <repo>/benchmarks/results |
| --rounds | 2 |
| --seed | 42 |
| --shared-note | (unset) |
| --stack | local |
| --stack-details | (unset) |
| --sut-commit | (unset) |
| --url | http://127.0.0.1:37800 |
| --workload | benchmarks/config/autonomy-workload.yaml |

