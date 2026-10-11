# Ingest report: synthetic-fleet (ci-gate)

## Provenance

| Field | Value |
|---|---|
| Started (UTC) | 2026-10-11 16:45:55 |
| Finished (UTC) | 2026-10-11 16:45:56 |
| System under test | http://127.0.0.1 (bench stack) (server 0.1.0-alpha) |
| Stack | local |
| Product commit | 23c4da98f483eceb07ebe453ecea8a6030e4013f-dirty (366 changed or untracked paths) |
| Harness | Garrison.Benchmark 1.0.0, commit uncommitted-dirty |
| Machine | scrubbed, macOS 26.6.0 (Arm64), Apple M5 Max (Arm64), 18 logical processors |
| Runtime | .NET 10.0.12 |
| HTTP client | SocketsHttpHandler, MaxConnectionsPerServer 1024, timeout 660 s, pooled connection lifetime 30 s, connect timeout 10 s |
| Dataset | synthetic-fleet (benchmarks/datasets/synthetic-fleet.json) |
| Dataset SHA-256 | 2e79613ad9cab719bd66ffaa8c3eb6ac6688c37ae25a5eae9ab23cf67cf5b52a |
| External services | none: every run uses the fake harness (garrison-fake-harness), no model or paid service |
| Shared machine | not recorded (pass --shared-note) |
| Seed | 42 |
| Deterministic | yes (no wall-clock value is scored) |
| Command line | `Garrison.Benchmark ingest --dataset benchmarks/datasets/synthetic-fleet.json --deterministic true --batch-size 100 --url http://127.0.0.1:37800 --stack local --label ci-gate --results-dir <repo>/benchmarks/results --seed 42` |

## Summary

| Arm | Outcomes | Passed | Errors | Pass rate [95% CI] | Latency p50 [95% CI] (ms) | p95 [95% CI] (ms) |
|---|---|---|---|---|---|---|
| garrison | 9 | 9 | 0 | 1.000 [1.000, 1.000] (indicative) | 2.1 [1.6, 4.7] (indicative) | 5.6 [2.5, 5.6] (indicative) |


### Timings, garrison (passed outcomes, ms)

| Measure | n | mean | p50 [95% CI] | p90 | p95 [95% CI] | p99 | max |
|---|---|---|---|---|---|---|---|
| agents | 1 | 200.0 | 200.0 | 200.0 | 200.0 | 200.0 | 200.0 |
| reachable | 1 | 200.0 | 200.0 | 200.0 | 200.0 | 200.0 | 200.0 |
| requestMs | 8 | 2.9 | 2.1 [1.6, 4.7] (indicative) | 5.6 | 5.6 [4.5, 5.6] (indicative) | 5.6 | 5.6 |

### By probe type, garrison

| Type | n | Passed | Pass rate [95% CI] |
|---|---|---|---|
| bad-api-version | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| idempotent-dry-run | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| missing-reference | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| new-document | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| reachability | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| reserved-name | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| secret-value | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| template-syntax | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| unknown-kind | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |

### By category, garrison

| Category | n | Passed | Pass rate [95% CI] |
|---|---|---|---|
| load-path | 3 | 3 | 1.000 [1.000, 1.000] (indicative) |
| validation | 6 | 6 | 1.000 [1.000, 1.000] (indicative) |

## Load path

| Measure | Value |
|---|---|
| Documents | 440 in 5 applies of up to 100 |
| Created / updated / unchanged / failed | 440 / 0 / 0 / 0 |
| Apply requests without a result | 0 |
| Documents per second | 2291.4 |
| Apply latency p50 / p95 / max (ms) | 29.7 / 68.5 / 68.5 |
| Idempotent re-apply (share Unchanged) | 1.000 |
| Re-apply latency p50 / p95 (ms) | 47.0 / 114.3 |
| Dry run of the whole corpus (ms) | 116.0 |
| Reachability (agents readable by name) | 200 of 200 (1.000) |

## Server stage breakdown (whole run)

From /metrics before and after; server-wide, so concurrent traffic and several replicas blur it.

| Series | Count | Total | Mean | Unit |
|---|---|---|---|---|
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/tenants/{tenantId}/manifests/apply",status_class="2xx",tenant="ten_mv421hk4_jB37gedmYl3WPtzvXUI"} | 13 | 553.3 | 42.56 | ms |
| garrison_db_operation_duration_seconds{operation="transaction",provider="sqlite",result="ok",table="none"} | 763 | 86.3 | 0.11 | ms |
| garrison_db_operation_duration_seconds{operation="select",provider="sqlite",result="ok",table="harness_profile_args"} | 1200 | 53.1 | 0.04 | ms |
| garrison_http_request_duration_seconds{method="GET",route="/v1.0/api/tenants/{tenantId}/agents/{id}",status_class="2xx",tenant="ten_mv421hk4_jB37gedmYl3WPtzvXUI"} | 200 | 47.1 | 0.24 | ms |
| garrison_db_operation_duration_seconds{operation="select",provider="sqlite",result="ok",table="agents"} | 2002 | 46.9 | 0.02 | ms |
| garrison_db_operation_duration_seconds{operation="select",provider="sqlite",result="ok",table="harness_profiles"} | 1200 | 38.0 | 0.03 | ms |
| garrison_db_operation_duration_seconds{operation="select",provider="sqlite",result="ok",table="prompt_template_variables"} | 2241 | 35.2 | 0.02 | ms |
| garrison_db_operation_duration_seconds{operation="select",provider="sqlite",result="ok",table="prompt_templates"} | 2321 | 33.5 | 0.01 | ms |
| garrison_db_operation_duration_seconds{operation="select",provider="sqlite",result="ok",table="harness_profile_exit_codes"} | 1200 | 17.6 | 0.01 | ms |
| garrison_db_operation_duration_seconds{operation="select",provider="sqlite",result="ok",table="harness_profile_probe_args"} | 1200 | 16.7 | 0.01 | ms |
| garrison_db_operation_duration_seconds{operation="select",provider="sqlite",result="ok",table="harness_profile_files"} | 1200 | 15.6 | 0.01 | ms |
| garrison_db_operation_duration_seconds{operation="select",provider="sqlite",result="ok",table="agent_tags"} | 1400 | 14.4 | 0.01 | ms |
| garrison_db_operation_duration_seconds{operation="select",provider="sqlite",result="ok",table="deployments"} | 600 | 12.4 | 0.02 | ms |
| garrison_db_operation_duration_seconds{operation="select",provider="sqlite",result="ok",table="harness_profile_env"} | 1200 | 11.8 | 0.01 | ms |
| garrison_db_operation_duration_seconds{operation="insert",provider="sqlite",result="ok",table="request_history_headers"} | 2722 | 11.6 | 0.00 | ms |

## Published and prior baselines

| Metric | Source | Baseline | This run | Net | Note |
|---|---|---|---|---|---|
| (all) | no comparable published result | none | n/a | n/a | No public benchmark measures an agent-harness control plane (scheduling runs of headless CLI agents onto pull-based workers), so there is no published score to compare against. The closest public data, the Azure Functions and Alibaba cluster traces, are workloads without an oracle; see BENCHMARKING.md, Datasets. |

## Options

| Option | Value |
|---|---|
| --batch-size | 100 |
| --connection-lifetime-seconds | 30 |
| --context | (unset) |
| --corpus |  |
| --dataset | benchmarks/datasets/synthetic-fleet.json |
| --deterministic | true |
| --dry-run | true |
| --kubeconfig | (unset) |
| --label | ci-gate |
| --max-connections | 1024 |
| --namespace | garrison |
| --poll-ms | 100 |
| --ready-timeout-seconds | 120 |
| --reapply | true |
| --request-timeout-seconds | 660 |
| --resamples | 2000 |
| --results-dir | <repo>/benchmarks/results |
| --seed | 42 |
| --shared-note | (unset) |
| --stack | local |
| --stack-details | (unset) |
| --sut-commit | (unset) |
| --url | http://127.0.0.1:37800 |

