# Memory report: autonomy-workload (ci-gate)

## Provenance

| Field | Value |
|---|---|
| Started (UTC) | 2026-11-27 01:13:22 |
| Finished (UTC) | 2026-11-27 01:13:26 |
| System under test | http://127.0.0.1 (bench stack) (server 0.3.0) |
| Stack | local |
| Product commit | 71ea9abc40b475c984a1a4c252638b25d255a9f1-dirty (4 changed or untracked paths) |
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
| Command line | `Garrison.Benchmark memory --keys 50 --concurrency 4 --rate 50 --deterministic true --url http://127.0.0.1:37800 --stack local --label ci-gate --results-dir <repo>/benchmarks/results --seed 42` |

## Summary

| Arm | Outcomes | Passed | Errors | Pass rate [95% CI] | Latency p50 [95% CI] (ms) | p95 [95% CI] (ms) |
|---|---|---|---|---|---|---|
| garrison | 10 | 10 | 0 | 1.000 [1.000, 1.000] (indicative) | n/a | n/a |


### By probe type, garrison

| Type | n | Passed | Pass rate [95% CI] |
|---|---|---|---|
| delete-cas | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| list | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| read | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| read-deleted | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| rest-content | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| rest-list | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| search-tag | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| stale-write-refused | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| update-cas | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |
| write | 1 | 1 | 1.000 [1.000, 1.000] (indicative) |

## Phases

Censored values are lower bounds (a wake or message still waiting when the window closed) and are included in the distributions.

| Scenario | Phase | Size | Operations | Succeeded | Failed | Censored | Window (s) | Throughput (ops/s) |
|---|---|---|---|---|---|---|---|---|
| memory | write | 50 | 50 | 50 | 0 | 0 | 1.0 | 50.66 |
| memory | read | 50 | 50 | 50 | 0 | 0 | 1.0 | 50.91 |
| memory | update-cas | 50 | 50 | 50 | 0 | 0 | 1.0 | 50.58 |
| memory | stale-write-refused | 5 | 5 | 5 | 0 | 0 | 0.1 | 60.71 |
| memory | list | 5 | 5 | 5 | 0 | 0 | 0.1 | 60.21 |
| memory | search-tag | 5 | 5 | 5 | 0 | 0 | 0.1 | 58.29 |
| memory | rest-list | 5 | 5 | 5 | 0 | 0 | 0.1 | 60.04 |
| memory | rest-content | 5 | 5 | 5 | 0 | 0 | 0.1 | 58.88 |
| memory | delete-cas | 50 | 50 | 50 | 0 | 0 | 1.0 | 50.95 |
| memory | read-deleted | 5 | 5 | 5 | 0 | 0 | 0.1 | 60.79 |

### Distributions (ms)

| Phase | Measure | n | mean | p50 [95% CI] | p95 [95% CI] | p99 | max |
|---|---|---|---|---|---|---|---|
| write | latencyMs | 50 | 6.0 | 5.5 [5.3, 5.7] | 9.6 [6.7, 15.0] | 15.0 | 15.0 |
| read | latencyMs | 50 | 1.2 | 1.1 [1.0, 1.3] | 1.9 [1.8, 2.2] | 2.2 | 2.2 |
| update-cas | latencyMs | 50 | 5.6 | 5.4 [5.1, 5.9] | 6.9 [6.6, 8.0] | 8.0 | 8.0 |
| stale-write-refused | latencyMs | 5 | 2.9 | 2.5 [1.6, 4.8] (indicative) | 4.8 [2.5, 4.8] (indicative) | 4.8 | 4.8 |
| list | latencyMs | 5 | 2.8 | 2.4 [2.2, 4.6] (indicative) | 4.6 [2.4, 4.6] (indicative) | 4.6 | 4.6 |
| search-tag | latencyMs | 5 | 7.2 | 5.9 [5.3, 11.9] (indicative) | 11.9 [5.9, 11.9] (indicative) | 11.9 | 11.9 |
| rest-list | latencyMs | 5 | 1.5 | 1.1 [1.0, 3.3] (indicative) | 3.3 [1.1, 3.3] (indicative) | 3.3 | 3.3 |
| rest-content | latencyMs | 5 | 1.6 | 1.1 [0.9, 3.6] (indicative) | 3.6 [1.1, 3.6] (indicative) | 3.6 | 3.6 |
| delete-cas | latencyMs | 50 | 1.8 | 1.8 [1.5, 2.0] | 4.0 [2.2, 5.6] | 5.6 | 5.6 |
| read-deleted | latencyMs | 5 | 1.0 | 1.0 [0.8, 1.2] (indicative) | 1.2 [1.0, 1.2] (indicative) | 1.2 | 1.2 |

## Server stage breakdown (whole run)

From /metrics before and after; server-wide, so concurrent traffic and several replicas blur it.

| Series | Count | Total | Mean | Unit |
|---|---|---|---|---|
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/lease",status_class="2xx",tenant="default"} | 2 | 40001.1 | 20000.56 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="empty"} | 2 | 39999.8 | 19999.90 | ms |
| garrison_outbound_duration_seconds{operation="post",result="2xx",service="mcp_internal"} | 229 | 731.6 | 3.19 | ms |
| voltaic_http_server_request_duration_seconds{http_request_method="POST",http_response_status_code="200",http_route="/mcp",voltaic_outcome="success",voltaic_protocol="mcp"} | 225 | 707.4 | 3.14 | ms |
| voltaic_rpc_server_duration_seconds{rpc_method="tools/call",voltaic_outcome="success",voltaic_protocol="mcp",voltaic_transport="http"} | 221 | 668.7 | 3.03 | ms |
| garrison_application_operation_duration_seconds{component="run",operation="gateway",result="ok"} | 216 | 639.7 | 2.96 | ms |
| garrison_application_operation_duration_seconds{component="gateway",operation="tool_dispatch",result="ok"} | 216 | 636.1 | 2.94 | ms |
| voltaic_mcp_tool_duration_seconds{gen_ai_tool_name="garrison_memory_write",voltaic_outcome="success"} | 100 | 515.6 | 5.16 | ms |
| voltaic_mcp_tool_stage_duration_seconds{gen_ai_tool_name="garrison_memory_write",voltaic_outcome="success",voltaic_stage="execute"} | 100 | 509.5 | 5.10 | ms |
| garrison_mcp_tool_duration_seconds{result="ok",tool="garrison_memory_write"} | 100 | 507.2 | 5.07 | ms |
| garrison_db_operation_duration_seconds{operation="transaction",provider="sqlite",result="ok",table="none"} | 709 | 71.0 | 0.10 | ms |
| voltaic_mcp_tool_duration_seconds{gen_ai_tool_name="garrison_memory_delete",voltaic_outcome="success"} | 50 | 52.7 | 1.05 | ms |
| voltaic_mcp_tool_stage_duration_seconds{gen_ai_tool_name="garrison_memory_delete",voltaic_outcome="success",voltaic_stage="execute"} | 50 | 50.1 | 1.00 | ms |
| voltaic_mcp_tool_duration_seconds{gen_ai_tool_name="garrison_memory_read",voltaic_outcome="success"} | 56 | 48.8 | 0.87 | ms |
| garrison_mcp_tool_duration_seconds{result="ok",tool="garrison_memory_delete"} | 50 | 48.8 | 0.98 | ms |

## Published and prior baselines

| Metric | Source | Baseline | This run | Net | Note |
|---|---|---|---|---|---|
| (all) | no comparable published result | none | n/a | n/a | No public benchmark measures an agent-harness control plane (scheduling runs of headless CLI agents onto pull-based workers), so there is no published score to compare against. The closest public data, the Azure Functions and Alibaba cluster traces, are workloads without an oracle; see BENCHMARKING.md, Datasets. |

## Notes

- MCP calls authenticate with the system administrator key and a tenant header, as a person calling the tools would; a run token takes the same path plus the effect journal for writes and deletes. Each MCP call is one HTTP request, and the server closes the connection after each answer, so latency includes a loopback TCP connect.
- Calls are paced open loop at --rate per second across all sessions (0 runs closed loop), because the MCP endpoint refuses more than 100 tools/call requests per second from one client (the Voltaic McpRateLimits.ToolCallsPerSecond default, which Garrison does not change). Latency is measured from the send.
- Values are deterministic text of --value-bytes bytes; every tenth key is also tagged needle, which search-tag looks for.

## Options

| Option | Value |
|---|---|
| --agent | memory-bench |
| --concurrency | 4 |
| --connection-lifetime-seconds | 30 |
| --context | (unset) |
| --deterministic | true |
| --keys | 50 |
| --kubeconfig | (unset) |
| --label | ci-gate |
| --max-connections | 1024 |
| --mcp-url | (unset) |
| --namespace | garrison |
| --rate | 50 |
| --request-timeout-seconds | 660 |
| --resamples | 2000 |
| --results-dir | <repo>/benchmarks/results |
| --seed | 42 |
| --shared-note | (unset) |
| --stack | local |
| --stack-details | (unset) |
| --sut-commit | (unset) |
| --url | http://127.0.0.1:37800 |
| --value-bytes | 1024 |
| --workload | benchmarks/config/autonomy-workload.yaml |

