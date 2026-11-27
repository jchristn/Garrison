# Messaging report: autonomy-workload (aa12)

## Provenance

| Field | Value |
|---|---|
| Started (UTC) | 2026-11-27 01:11:51 |
| Finished (UTC) | 2026-11-27 01:12:15 |
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
| Command line | `Garrison.Benchmark messaging --url http://127.0.0.1:37800 --stack local --fake-harness <repo>/benchmarks/.run/build/bin/Garrison.FakeHarness/release_net10.0/garrison-fake-harness.dll --stack-details "local processes from the working tree: 1 server (Sqlite), 1 alpha + 1 beta workers x 4 slots" --label aa12 --shared-note "local stack on the development laptop; other agent sessions were active on the machine"` |

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
| messaging | send | 575 | 575 | 575 | 0 | 0 | 0.9 | 532.52 |
| messaging | urgent-delivery | 75 | 75 | 75 | 0 | 0 | 16.0 | 4.69 |
| messaging | normal-delivery | 500 | 500 | 500 | 0 | 0 | 16.0 | 31.26 |

### Distributions (ms)

| Phase | Measure | n | mean | p50 [95% CI] | p95 [95% CI] | p99 | max |
|---|---|---|---|---|---|---|---|
| send | sendLatencyMs | 575 | 13.5 | 3.8 [3.7, 3.9] | 11.6 [8.4, 33.3] | 330.7 | 331.1 |
| urgent-delivery | deliveryLagMs | 75 | 5103.6 | 5172.5 [5093.9, 5191.2] | 5442.7 [5417.6, 5452.5] | 5459.1 | 5459.1 |
| normal-delivery | queuedDeliveryLagMs | 500 | 5168.7 | 5213.5 [5198.1, 5227.2] | 5513.3 [5502.8, 5527.8] | 5549.5 | 5578.4 |

### Counts

| Phase | Count | Value |
|---|---|---|
| send | normalAccepted | 500 |
| send | urgentAccepted | 75 |
| urgent-delivery | deliveredAll | 575 |
| urgent-delivery | messageTicks | 75 |

## Server stage breakdown (whole run)

From /metrics before and after; server-wide, so concurrent traffic and several replicas blur it.

| Series | Count | Total | Mean | Unit |
|---|---|---|---|---|
| garrison_keeper_interval_seconds{mode="fixed"} | 100 | 360000000.0 | 3600000.00 | ms |
| garrison_message_delivery_lag_duration_seconds{urgency="normal"} | 500 | 2584332.8 | 5168.67 | ms |
| garrison_message_delivery_lag_duration_seconds{urgency="urgent"} | 75 | 382770.1 | 5103.60 | ms |
| garrison_keeper_tick_lag_duration_seconds{source="message"} | 75 | 374026.3 | 4987.02 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/lease",status_class="2xx",tenant="default"} | 99 | 92404.4 | 933.38 | ms |
| garrison_keeper_tick_lag_duration_seconds{source="timer"} | 25 | 88230.6 | 3529.22 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="assigned"} | 97 | 52349.6 | 539.69 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="empty"} | 2 | 40000.2 | 20000.12 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/watch",status_class="aborted",tenant="default"} | 90 | 39647.0 | 440.52 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/watch",status_class="2xx",tenant="default"} | 1 | 25000.1 | 25000.11 | ms |
| garrison_db_operation_duration_seconds{operation="transaction",provider="sqlite",result="ok",table="none"} | 3725 | 8495.1 | 2.28 | ms |
| garrison_db_write_lock_wait_seconds{provider="sqlite"} | 6364 | 7691.6 | 1.21 | ms |
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/tenants/{tenantId}/messages",status_class="2xx",tenant="ten_mwyadb3o_l5sCJXrcXS2YxBwn1W9"} | 575 | 7624.8 | 13.26 | ms |
| voltaic_server_session_duration_seconds{voltaic_protocol="mcp",voltaic_reason="deleted",voltaic_transport="http"} | 100 | 1853.3 | 18.53 | ms |
| garrison_outbound_duration_seconds{operation="post",result="2xx",service="mcp_internal"} | 300 | 1421.8 | 4.74 | ms |

## Published and prior baselines

| Metric | Source | Baseline | This run | Net | Note |
|---|---|---|---|---|---|
| (all) | no comparable published result | none | n/a | n/a | No public benchmark measures an agent-harness control plane (scheduling runs of headless CLI agents onto pull-based workers), so there is no published score to compare against. The closest public data, the Azure Functions and Alibaba cluster traces, are workloads without an oracle; see BENCHMARKING.md, Datasets. |

## Notes

- Messages are sent as a person (the system administrator key), so the line policy does not apply; freezes, the thread budget, and Messaging.LineRatePerMinute do. Urgent wakes are limited by Messaging.UrgentWakesPerHour (default 12), so --rounds is at most 12.
- Delivery is measured with server timestamps: createdUtc when the message is stored, deliveredUtc when the keeper tick that carries it claims it, before the tick's run starts.
- Shared machine: local stack on the development laptop; other agent sessions were active on the machine. Latency and throughput are indicative.

## Options

| Option | Value |
|---|---|
| --body-bytes | 512 |
| --concurrency | 8 |
| --connection-lifetime-seconds | 30 |
| --context | (unset) |
| --delivery-timeout-seconds | 120 |
| --deterministic | false |
| --kubeconfig | (unset) |
| --label | aa12 |
| --max-connections | 1024 |
| --messages | 500 |
| --namespace | garrison |
| --recipients | 25 |
| --request-timeout-seconds | 660 |
| --resamples | 2000 |
| --results-dir | (unset) |
| --rounds | 3 |
| --seed | 42 |
| --shared-note | local stack on the development laptop; other agent sessions were active on the machine |
| --stack | local |
| --stack-details | local processes from the working tree: 1 server (Sqlite), 1 alpha + 1 beta workers x 4 slots |
| --sut-commit | (unset) |
| --url | http://127.0.0.1:37800 |
| --workload | benchmarks/config/autonomy-workload.yaml |

