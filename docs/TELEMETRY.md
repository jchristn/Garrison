# Telemetry

Garrison gives you four ways to see what it is doing: metrics from the control plane, traces handed down to harnesses, logs, and the records it keeps in its own database (request history, audit, run events). This page covers each one and what to watch.

## Metrics

The control plane publishes metrics through Radiant (OpenTelemetry) and serves them in Prometheus format on a separate listener, port 9464 at `/metrics` by default. OTLP export can be turned on as well. The settings are under `Telemetry` (see `docs/CONFIGURATION.md`):

| Setting | Default |
|---|---|
| `Telemetry.Enabled` | `true` |
| `Telemetry.PrometheusEnable`, `PrometheusHostname`, `PrometheusPort`, `PrometheusPath` | `true`, `*`, `9464`, `/metrics` |
| `Telemetry.OtlpEnable`, `OtlpEndpoint` | `false`, `http://127.0.0.1:4317` |
| `Telemetry.ServiceName` | `garrison-server`; the control-plane node identifier is the service instance |

The Prometheus listener cannot bind a true wildcard, so a hostname of `*`, `+`, or `0.0.0.0` binds to the machine host name instead (in Kubernetes that resolves to the pod IP, which is what Prometheus scrapes) and falls back to `127.0.0.1` if that fails. The startup log names the address it used: `metrics listening on garrison-worker-0:9465/metrics`. Inside a pod, scrape it with `curl http://$(hostname):9465/metrics`, not `127.0.0.1`.

If the pipeline cannot start at all, for example because the scrape port is taken, Garrison keeps running without metrics and logs `telemetry disabled: ...` at warning severity with the underlying cause.

### Garrison metrics

Prometheus names are the OpenTelemetry names with dots replaced by underscores and a `_total` suffix on counters (`garrison.runs.created` becomes `garrison_runs_created_total`).

| Metric | Type | Tags | Meaning |
|---|---|---|---|
| `garrison.http.requests` | counter | `method`, `status_class` (`2xx`, `4xx`, ...) | REST requests handled |
| `garrison.runs.created` | counter | `harness`, `kind` | Runs created |
| `garrison.runs.finished` | counter | `outcome`, `harness` | Runs that reached a terminal status |
| `garrison.runs.schema_validations` | counter | `result` (`valid`, `invalid`), `execution` (`original`, `repair`), `harness` | Validations of run output against the agent's output schema |
| `garrison.runs.repairs` | counter | `harness` | Structured output repair attempts started |
| `garrison.run.stage.duration` | histogram, seconds | `stage` (`execution`, `queue`, `first_token`), `harness` | `execution`: start to completion; `queue`: queued to leased; `first_token`: harness start to first model output |
| `garrison.harness.tokens` | histogram | `harness`, `direction` (`input`, `output`, `reasoning`) | Tokens per run, as reported by the harness |
| `garrison.claims` | counter | `result` (`won`, `lost`, `limit`) | Lease claim attempts. `lost` means another node claimed the run first; `limit` means a deployment was at its concurrency limit |
| `garrison.compile.duration` | histogram, seconds | `harness` | Time to compile a claimed run into an execution spec |
| `garrison.event.batch.size` | histogram | | Events per batch received from workers |
| `garrison.lease.expirations` | counter | `action` (`requeued`, `failed`) | Runs whose worker stopped renewing the lease |
| `garrison.mcp.tool.calls` | counter | `tool` | MCP tool calls |
| `garrison.mcp.tool.results` | counter | `tool`, `result` (`ok`, `error`) | MCP tool outcomes |
| `garrison.a2a.requests` | counter | `method` | A2A JSON-RPC requests |

The scrape also includes .NET runtime and process metrics (`dotnet_*`, `process_*`), HTTP server metrics (`http_server_request_duration_seconds` and friends), and metrics from the libraries Garrison is built on (`watson_*` for the REST listener, `voltaic_*` for MCP).

### What to watch

| Question | Look at |
|---|---|
| Are runs failing, and why? | `garrison_runs_finished_total` by `outcome`. `NotCredentialed`, `NotInstalled`, and `McpPreflightFailed` point at configuration, not at the model |
| Are workers dying mid-run? | `garrison_lease_expirations_total`, and nodes in `Lost` in the dashboard |
| Is there contention for work? | The `lost` share of `garrison_claims_total`. Some is normal with many workers |
| Is a deployment throttled? | `garrison_claims_total{result="limit"}` |
| How expensive are runs? | `garrison_harness_tokens` by harness, and `costUsd` on runs |
| Is the API healthy? | `garrison_http_requests_total` by `status_class`, `http_server_request_duration_seconds` |

### Worker metrics

Workers publish their own metrics through the same pipeline, configured by the `Telemetry` block in `garrison-worker.json` (service name `garrison-worker`, Prometheus on port 9465 at `/metrics`) and the environment variables `GARRISON_WORKER_TELEMETRY_ENABLE`, `GARRISON_WORKER_PROMETHEUS_PORT`, `GARRISON_WORKER_OTLP_ENABLE`, and `GARRISON_WORKER_OTLP_ENDPOINT`.

| Metric | Type | Tags | Meaning |
|---|---|---|---|
| `garrison.worker.leases` | counter | `result` (`assigned`, `empty`, `error`) | Lease requests and what came back |
| `garrison.worker.runs` | counter | `harness`, `outcome` | Runs this worker finished |
| `garrison.worker.run.duration` | histogram, seconds | `harness` | Run duration on the worker |
| `garrison.worker.run.ttft` | histogram, seconds | `harness` | Harness process start to first model output |
| `garrison.worker.run.streaming` | histogram, seconds | `harness` | First to last model output |
| `garrison.worker.harness.tokens` | histogram | `harness`, `direction` (`input`, `output`, `cached`, `reasoning`) | Tokens per run |
| `garrison.worker.harness.cost_usd` | histogram | `harness` | Reported cost per run |
| `garrison.worker.completion_reports` | counter | `result` (`accepted`, `stale`, `abandoned`) | Completion reports, including ones refused for a lost lease or given up after `CompletionRetrySeconds` |
| `garrison.worker.runs.active` | gauge | | Runs in progress |
| `garrison.worker.slots.free` | gauge | | Free run slots |

The worker's state is also visible through the control plane (node status, capacity, active runs, and last heartbeat in `GET /v1.0/api/nodes`, the dashboard, and the `nodes` WebSocket channel) and from its health endpoint, `GET /health/ready` on port 8710.

## Run timing

Every run records how long it waited, how long the harness took to start producing output, and how long it streamed. The values are on the `Run` returned by the REST API, in the MCP run summary, in A2A task metadata, and in the SDK run models, and they feed the analytics endpoint (`GET /v1.0/api/tenants/{tenantId}/analytics/runs`, described in `REST_API.md`) behind the dashboard's charts.

```
queued --> leased --> process start --> first output --> last output --> exit --> completion received
|<- queueMs ->|
                      |<- timeToFirstTokenMs ->|<-- streamingMs -->|
                      |<----------------- executionMs ------------------->|
|<------------------------------------- totalMs ------------------------------------------>|
```

| Field | What it measures | Where and how |
|---|---|---|
| `timeToFirstTokenMs` | From the moment the harness process starts to its first model output, meaning the first assistant text or thinking event the parser produces. It includes the CLI's own startup, MCP server connections, and the model's first-token latency, so it is what a user waiting on the run experiences, not the model's raw latency. | Worker, on a monotonic clock (`Stopwatch`) started right after the process launches. A line counts when the worker reads it from stdout. |
| `streamingMs` | From the first model output to the last. 0 when there was only one output event (for example a harness that prints its whole answer at once). | Worker, same clock. |
| `executionMs` | From process start to process exit, including a kill after a deadline or cancellation. | Worker, same clock. |
| `firstTokenUtc`, `lastTokenUtc` | Wall-clock times of the first and last model output. | Worker: the process start time plus the monotonic offsets, so they agree exactly with the durations. |
| `queueMs` | From queued to leased by a worker. A run that is requeued after its worker disappears starts a new queue period. | Server, from its own `queuedUtc` and `leasedUtc`. |
| `totalMs` | From queued to the moment the server received the completion. | Server clock only. |
| `outputTokensPerSecond` | `outputTokens / (streamingMs / 1000)`. Only defined when `streamingMs` is at least 100, because shorter windows give meaningless rates. Harnesses that report usage only at the end, or emit their answer as one event, often have no rate. | Computed by the server when the run is read. |
| `reasoningTokens` | Reasoning or thinking tokens: Codex `reasoning_output_tokens` (also included in `outputTokens`, as before), Claude Code `usage.output_tokens_details.thinking_tokens` or the sum of `modelUsage.*.thinkingTokens`, Mux `usage.reasoningTokens` when present. 0 when the harness does not report them. | Parser. |
| `toolCallCount` | Tool call events the parser produced (MCP tools, shell commands, web searches, and so on). | Worker. |

Durations measured by the worker never mix clocks, so they are exact even when the worker's and server's clocks disagree. Durations the server computes use only server timestamps for the same reason. A value that could not be measured is `null`: a harness that never started has no timings, one that was killed before it produced output has `executionMs` but no `timeToFirstTokenMs`, and runs that finished before schema migration 2 have only `queueMs` and `totalMs`, derived from their stored timestamps.

The analytics endpoint aggregates up to 100,000 runs per request in the server process, so averages and percentiles (nearest rank) come out the same on Sqlite and Postgresql.

## Traces

With OTLP enabled, the control plane exports traces from its HTTP and MCP listeners. When a run is compiled, the current trace context is stored in the execution spec. The worker continues that trace with a `harness <type> exec` span around the harness process (with OTLP enabled on the worker) and passes the context to the harness as the `TRACEPARENT` environment variable, so a harness that understands W3C trace context can join the trace.

## Logs

Both processes log to the console by default, and the server logs the database schema version at startup; the control plane can also log to a file (`Logging.FileLogging`). Severity runs from 0 (debug) to 7 (emergency), with 1 as the default. The control plane's `Logging.MinimumSeverity` can be changed live through the settings API. Log lines are prefixed with the component, such as `[Mcp]` or `[LiveUpdates]`.

Secrets are never logged. Values passed to harnesses as secrets are scrubbed from run events, results, and stderr on the worker before they are sent.

## Records in the database

| Record | Where to read it | Retention |
|---|---|---|
| Request history: method, path, status, timing, principal, and (truncated) bodies for every REST request | `GET /v1.0/api/request-history`, `GET /v1.0/api/request-history/summary` (counts per time bucket), dashboard | `RequestHistory.RetentionDays` (30) |
| Audit: authorization denials and privileged changes | `GET .../audit`, dashboard | `Audit.RetentionDays` (365) |
| Run events: lifecycle, assistant text, tool calls and results, usage, warnings, errors, the final result | `GET .../runs/{id}/events`, SSE, WebSocket | `Runs.EventRetentionDays` (14) |
| Runs, with outcome, usage, cost, served model, exit code, stderr tail, and the template versions used | `GET .../runs` | `Runs.RetentionDays` (30) |

Request history capture can be turned off with the `RequestHistory.Enabled` cluster setting, and the captured body size is limited by `RequestHistory.MaxRequestBodyBytes` and `MaxResponseBodyBytes`. The overview endpoint (`GET .../overview`) summarizes run counts, outcomes, and node state for dashboards.

## Kubernetes

The Helm chart and Kustomize base annotate the server pods with `prometheus.io/scrape`, `prometheus.io/port: "9464"`, and `prometheus.io/path: /metrics` (worker pods use port 9465 where the manifests annotate them), so a Prometheus that honors those annotations finds them without extra configuration. A packaged observability stack (Prometheus, Grafana dashboards, Tempo, Loki, and an OpenTelemetry Collector) is planned; `k8s/components/observability/README.md` tracks it.
