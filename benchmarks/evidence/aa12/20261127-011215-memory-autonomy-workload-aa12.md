# Memory report: autonomy-workload (aa12)

## Provenance

| Field | Value |
|---|---|
| Started (UTC) | 2026-11-27 01:12:15 |
| Finished (UTC) | 2026-11-27 01:12:27 |
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
| Command line | `Garrison.Benchmark memory --url http://127.0.0.1:37800 --stack local --fake-harness <repo>/benchmarks/.run/build/bin/Garrison.FakeHarness/release_net10.0/garrison-fake-harness.dll --stack-details "local processes from the working tree: 1 server (Sqlite), 1 alpha + 1 beta workers x 4 slots" --label aa12 --shared-note "local stack on the development laptop; other agent sessions were active on the machine"` |

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
| memory | write | 200 | 200 | 200 | 0 | 0 | 2.5 | 80.17 |
| memory | read | 200 | 200 | 200 | 0 | 0 | 2.5 | 80.29 |
| memory | update-cas | 200 | 200 | 200 | 0 | 0 | 2.5 | 80.14 |
| memory | stale-write-refused | 20 | 20 | 20 | 0 | 0 | 0.2 | 83.28 |
| memory | list | 20 | 20 | 20 | 0 | 0 | 0.2 | 82.86 |
| memory | search-tag | 20 | 20 | 20 | 0 | 0 | 0.2 | 80.35 |
| memory | rest-list | 20 | 20 | 20 | 0 | 0 | 0.2 | 83.47 |
| memory | rest-content | 20 | 20 | 20 | 0 | 0 | 0.2 | 83.40 |
| memory | delete-cas | 200 | 200 | 200 | 0 | 0 | 2.5 | 80.38 |
| memory | read-deleted | 20 | 20 | 20 | 0 | 0 | 0.2 | 83.26 |

### Distributions (ms)

| Phase | Measure | n | mean | p50 [95% CI] | p95 [95% CI] | p99 | max |
|---|---|---|---|---|---|---|---|
| write | latencyMs | 200 | 6.1 | 5.6 [5.4, 5.8] | 9.1 [8.5, 9.7] | 10.5 | 11.1 |
| read | latencyMs | 200 | 1.2 | 1.0 [0.9, 1.0] | 2.1 [1.8, 2.5] | 4.4 | 12.4 |
| update-cas | latencyMs | 200 | 6.9 | 6.8 [6.7, 6.9] | 8.8 [8.1, 10.1] | 12.5 | 13.8 |
| stale-write-refused | latencyMs | 20 | 1.0 | 0.9 [0.9, 1.0] | 1.6 [1.0, 2.3] | 2.3 | 2.3 |
| list | latencyMs | 20 | 2.5 | 2.4 [2.1, 2.5] | 3.8 [2.5, 4.6] | 4.6 | 4.6 |
| search-tag | latencyMs | 20 | 10.4 | 10.3 [9.8, 10.4] | 12.6 [10.5, 13.7] | 13.7 | 13.7 |
| rest-list | latencyMs | 20 | 1.1 | 1.0 [0.9, 1.1] | 1.5 [1.1, 2.1] | 2.1 | 2.1 |
| rest-content | latencyMs | 20 | 0.8 | 0.9 [0.5, 0.9] | 1.0 [1.0, 2.2] | 2.2 | 2.2 |
| delete-cas | latencyMs | 200 | 1.7 | 1.6 [1.6, 1.7] | 3.1 [2.3, 4.3] | 4.8 | 6.0 |
| read-deleted | latencyMs | 20 | 0.9 | 0.8 [0.7, 1.2] | 1.3 [1.2, 1.5] | 1.5 | 1.5 |

## Server stage breakdown (whole run)

From /metrics before and after; server-wide, so concurrent traffic and several replicas blur it.

| Series | Count | Total | Mean | Unit |
|---|---|---|---|---|
| garrison_http_request_duration_seconds{method="POST",route="/v1.0/api/node/lease",status_class="2xx",tenant="default"} | 2 | 40003.2 | 20001.58 | ms |
| garrison_scheduler_lease_wait_duration_seconds{result="empty"} | 2 | 40001.9 | 20000.95 | ms |
| garrison_outbound_duration_seconds{operation="post",result="2xx",service="mcp_internal"} | 897 | 3081.9 | 3.44 | ms |
| voltaic_http_server_request_duration_seconds{http_request_method="POST",http_response_status_code="200",http_route="/mcp",voltaic_outcome="success",voltaic_protocol="mcp"} | 889 | 2978.2 | 3.35 | ms |
| voltaic_rpc_server_duration_seconds{rpc_method="tools/call",voltaic_outcome="success",voltaic_protocol="mcp",voltaic_transport="http"} | 881 | 2861.4 | 3.25 | ms |
| garrison_application_operation_duration_seconds{component="run",operation="gateway",result="ok"} | 861 | 2790.6 | 3.24 | ms |
| garrison_application_operation_duration_seconds{component="gateway",operation="tool_dispatch",result="ok"} | 861 | 2783.3 | 3.23 | ms |
| voltaic_mcp_tool_duration_seconds{gen_ai_tool_name="garrison_memory_write",voltaic_outcome="success"} | 400 | 2299.4 | 5.75 | ms |
| voltaic_mcp_tool_stage_duration_seconds{gen_ai_tool_name="garrison_memory_write",voltaic_outcome="success",voltaic_stage="execute"} | 400 | 2271.9 | 5.68 | ms |
| garrison_mcp_tool_duration_seconds{result="ok",tool="garrison_memory_write"} | 400 | 2262.9 | 5.66 | ms |
| garrison_db_operation_duration_seconds{operation="transaction",provider="sqlite",result="ok",table="none"} | 2768 | 346.4 | 0.13 | ms |
| voltaic_mcp_tool_duration_seconds{gen_ai_tool_name="garrison_memory_delete",voltaic_outcome="success"} | 200 | 200.7 | 1.00 | ms |
| voltaic_mcp_tool_duration_seconds{gen_ai_tool_name="garrison_memory_search",voltaic_outcome="success"} | 20 | 197.5 | 9.87 | ms |
| voltaic_mcp_tool_stage_duration_seconds{gen_ai_tool_name="garrison_memory_search",voltaic_outcome="success",voltaic_stage="execute"} | 20 | 197.0 | 9.85 | ms |
| garrison_mcp_tool_duration_seconds{result="ok",tool="garrison_memory_search"} | 20 | 196.8 | 9.84 | ms |

## Published and prior baselines

| Metric | Source | Baseline | This run | Net | Note |
|---|---|---|---|---|---|
| (all) | no comparable published result | none | n/a | n/a | No public benchmark measures an agent-harness control plane (scheduling runs of headless CLI agents onto pull-based workers), so there is no published score to compare against. The closest public data, the Azure Functions and Alibaba cluster traces, are workloads without an oracle; see BENCHMARKING.md, Datasets. |

## Notes

- MCP calls authenticate with the system administrator key and a tenant header, as a person calling the tools would; a run token takes the same path plus the effect journal for writes and deletes. Each MCP call is one HTTP request, and the server closes the connection after each answer, so latency includes a loopback TCP connect.
- Calls are paced open loop at --rate per second across all sessions (0 runs closed loop), because the MCP endpoint refuses more than 100 tools/call requests per second from one client (the Voltaic McpRateLimits.ToolCallsPerSecond default, which Garrison does not change). Latency is measured from the send.
- Values are deterministic text of --value-bytes bytes; every tenth key is also tagged needle, which search-tag looks for.
- Shared machine: local stack on the development laptop; other agent sessions were active on the machine. Latency and throughput are indicative.

## Options

| Option | Value |
|---|---|
| --agent | memory-bench |
| --concurrency | 8 |
| --connection-lifetime-seconds | 30 |
| --context | (unset) |
| --deterministic | false |
| --keys | 200 |
| --kubeconfig | (unset) |
| --label | aa12 |
| --max-connections | 1024 |
| --mcp-url | (unset) |
| --namespace | garrison |
| --rate | 80 |
| --request-timeout-seconds | 660 |
| --resamples | 2000 |
| --results-dir | (unset) |
| --seed | 42 |
| --shared-note | local stack on the development laptop; other agent sessions were active on the machine |
| --stack | local |
| --stack-details | local processes from the working tree: 1 server (Sqlite), 1 alpha + 1 beta workers x 4 slots |
| --sut-commit | (unset) |
| --url | http://127.0.0.1:37800 |
| --value-bytes | 1024 |
| --workload | benchmarks/config/autonomy-workload.yaml |

