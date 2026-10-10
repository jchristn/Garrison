# Telemetry

Garrison gives you four ways to see what it is doing: metrics from the control plane, traces handed down to harnesses, logs, and the records it keeps in its own database (request history, audit, run events). This page covers each one, what to watch, and how the dashboard links into Grafana, Prometheus, Loki, and Tempo when you run them.

## Metrics

The control plane publishes metrics through Radiant (OpenTelemetry) and serves them in Prometheus format on a separate listener, port 9464 at `/metrics` by default. OTLP export can be turned on as well. The settings are under `Telemetry` (see `docs/CONFIGURATION.md`):

| Setting | Default |
|---|---|
| `Telemetry.Enabled` | `true` |
| `Telemetry.PrometheusEnable`, `PrometheusHostname`, `PrometheusPort`, `PrometheusPath` | `true`, `*`, `9464`, `/metrics` |
| `Telemetry.OtlpEnable`, `OtlpEndpoint` | `false`, `http://127.0.0.1:4317` |
| `Telemetry.ServeMetricsOnServicePort` | `true`: `GET /metrics` is also served on the REST port (8700), without authentication |
| `Telemetry.ServiceName` | `garrison-server`; the control-plane node identifier is the service instance |

The Prometheus listener cannot bind a true wildcard, so a hostname of `*`, `+`, or `0.0.0.0` binds to the machine host name instead (in Kubernetes that resolves to the pod IP, which is what Prometheus scrapes) and falls back to `127.0.0.1` if that fails. The startup log names the address it used: `metrics listening on garrison-worker-0:9465/metrics`.

Because that listener answers only on the pod IP, `kubectl port-forward` to port 9464 or 9465 and `curl http://127.0.0.1:9464/metrics` inside the pod do not reach it. To cover those cases, the same exposition is also served from each process's main listener, which binds every interface:

| Process | Pod-IP listener (what Prometheus scrapes) | Also served at |
|---|---|---|
| Server | `http://<pod IP>:9464/metrics` | `http://127.0.0.1:8700/metrics` (REST port) |
| Worker | `http://<pod IP>:9465/metrics` | `http://127.0.0.1:8710/metrics` (health port) |

```bash
kubectl -n garrison port-forward deploy/garrison-server 8700:8700 &
curl -s http://127.0.0.1:8700/metrics | head
kubectl -n garrison port-forward garrison-worker-0 8710:8710 &
curl -s http://127.0.0.1:8710/metrics | head
```

The relayed endpoint asks the pod-IP listener for a fresh scrape on every request, so both return the same values; it answers 503 when the Prometheus listener is off or did not answer. It needs no authentication, like the 9464 listener, so turn it off with `Telemetry.ServeMetricsOnServicePort` set to `false` (server settings file, or the worker's `Telemetry` block) if the REST port is exposed somewhere metrics should not be. Scrapes of `/metrics` on the REST port are not recorded in request history. Radiant has no API that renders the exposition in process and binds one host per listener, which is why Garrison relays the scrape instead of binding a second listener.

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
| `delegationWaitMs` | How long the run waited on runs it delegated to: every run whose `parentRunId` is this run contributes its lifetime from creation to finish, the intervals are merged so children that ran in parallel count once, and the result is clipped to this run's execution (started to completion received). 0 for a run that delegated nothing. | Server, from the child runs' `createdUtc`, `queuedUtc`, and `totalMs`, when the parent's completion arrives. |
| `timeToFirstTokenExcludingDelegationMs` | `timeToFirstTokenMs` minus the part of the delegation wait that happened before the first model output, never negative. | Server. The first output is placed at the parent's `startedUtc` plus `timeToFirstTokenMs`, so only server timestamps are compared. |

Durations measured by the worker never mix clocks, so they are exact even when the worker's and server's clocks disagree. Durations the server computes use only server timestamps for the same reason. A value that could not be measured is `null`: a harness that never started has no timings, one that was killed before it produced output has `executionMs` but no `timeToFirstTokenMs`, and runs that finished before schema migration 2 have only `queueMs` and `totalMs`, derived from their stored timestamps.

`timeToFirstTokenMs` deliberately stays the time to the first real model output. An agent that starts by calling `garrison_invoke_agent` and writes nothing until the child answers has a TTFT close to its whole run; `delegationWaitMs` shows how much of that was waiting, and `timeToFirstTokenExcludingDelegationMs` lets a chart compare it with agents that answer directly. Analytics reports `delegationWaitMsAvg` and the average, p50, and p95 of the excluded TTFT. Runs that finished before schema migration 4 have `null` for both.

The analytics endpoint aggregates up to 100,000 runs per request in the server process, so averages and percentiles (nearest rank) come out the same on Sqlite and Postgresql.

## Traces

Every run belongs to one W3C trace, and the run records its ID as `traceId` (32 lowercase hexadecimal characters) in REST, the MCP run summary, A2A task metadata (`garrison.traceId`), and the SDK models. Runs created before schema migration 5 have `null`.

| Span | Process | Source | Parent |
|---|---|---|---|
| `run:create` | Server | `Garrison` | The request span (REST, MCP, or A2A) when one is recorded; for a delegated run, the parent run's trace |
| `run:claim` | Server | `Garrison` | `run:create`, even though the claim happens later inside a worker's lease request |
| `run:compile` | Server | `Garrison` | `run:claim` |
| `harness <type> exec` | Worker | `Garrison.Worker` | `run:claim`, from the traceparent shipped in the execution spec |

The trace ID exists even when tracing is off: if no span is recorded, Garrison generates a sampled traceparent for the run, so deep links and log searches still work once you turn exporting on. Spans carry `garrison.run_id`, `garrison.agent`, `garrison.harness`, and `garrison.node` tags. The worker also passes the traceparent to the harness as the `TRACEPARENT` environment variable, so a harness that understands W3C trace context can join the trace.

Spans are exported through Radiant over OTLP (gRPC) when `Telemetry.OtlpEnable` is true. Turn it on for the server with `GARRISON_OTLP_ENABLE=true` and `GARRISON_OTLP_ENDPOINT` (for example `http://garrison-alloy:4317`), and for workers with `GARRISON_WORKER_OTLP_ENABLE=true` and `GARRISON_WORKER_OTLP_ENDPOINT`. With both on, a run's server and worker spans arrive in Tempo as one trace. The server also exports the spans of its HTTP and MCP listeners.

## Logs

Both processes log to the console by default, and the server logs the database schema version at startup; the control plane can also log to a file (`Logging.FileLogging`). Severity runs from 0 (debug) to 7 (emergency), with 1 as the default. The control plane's `Logging.MinimumSeverity` can be changed live through the settings API. Log lines are prefixed with the component, such as `[Mcp]` or `[LiveUpdates]`.

Every line about a run ends with `run=<runId> trace=<traceId>` (`trace=-` when the run has no trace ID). That covers the server's queued, leased, compile failure, cancellation, blocked, lease expiry, repair, and finished lines, and the worker's executing, process started, cancellation, lost lease, repair, and completion lines:

```
[Runs] run run_01JABC... queued for agent echo (Invoke, Fake) run=run_01JABC... trace=4bf92f3577b34da6a3ce929d0e0e4736
[Scheduler] run run_01JABC... leased to garrison-worker-0 (epoch 1) run=run_01JABC... trace=4bf92f3577b34da6a3ce929d0e0e4736
[Worker] executing run run_01JABC... (epoch 1, Fake) run=run_01JABC... trace=4bf92f3577b34da6a3ce929d0e0e4736
```

With logs shipped to Loki under the label `app="garrison"`, `{app="garrison"} |= "<runId>"` returns everything the server and workers logged about a run, and `|= "trace=<traceId>"` does the same by trace.

Secrets are never logged. Values passed to harnesses as secrets are scrubbed from run events, results, and stderr on the worker before they are sent.

## Observability services and deep links

When Grafana, Prometheus, Loki, or Tempo run alongside Garrison, tell the server where they are and the dashboard links to them. The settings are cluster settings (stored in the database, applied live, editable on the Settings page) and every one can be set by an environment variable instead, which then wins and makes the setting read-only in the API:

| Setting | Environment variable | Meaning |
|---|---|---|
| `Observability.GrafanaUrl` | `GARRISON_GRAFANA_URL` | Grafana as a browser reaches it, for example `https://grafana.example.com` or `http://127.0.0.1:3000` |
| `Observability.PrometheusUrl` | `GARRISON_PROMETHEUS_URL` | Prometheus as a browser reaches it |
| `Observability.LokiUrl` | `GARRISON_LOKI_URL` | Loki as a browser reaches it |
| `Observability.TempoUrl` | `GARRISON_TEMPO_URL` | Tempo as a browser reaches it |
| `Observability.GrafanaInternalUrl` and so on | `GARRISON_GRAFANA_INTERNAL_URL`, `GARRISON_PROMETHEUS_INTERNAL_URL`, `GARRISON_LOKI_INTERNAL_URL`, `GARRISON_TEMPO_INTERNAL_URL` | Where the server itself reaches the service for reachability checks, for example `http://garrison-grafana:3000`. Empty uses the browser URL |

Empty means not configured. Values must be absolute `http` or `https` URLs; a trailing slash is removed.

`GET /v1.0/api/server-info` reports the browser URLs and the Grafana UIDs the deep links use, with `null` for anything not configured (the datasource and dashboard UIDs are `null` until a Grafana URL is set):

```json
"observability": {
  "grafanaUrl": "http://127.0.0.1:3000", "prometheusUrl": null, "lokiUrl": null, "tempoUrl": null,
  "datasources": { "prometheus": "garrison-prometheus", "loki": "garrison-loki", "tempo": "garrison-tempo" },
  "dashboards": { "overview": "garrison-overview", "http": "garrison-http", "runs": "garrison-runs",
                  "workers": "garrison-workers", "protocols": "garrison-protocols", "integrations": "garrison-integrations" }
}
```

`GET /v1.0/api/observability/status` (any signed-in user) returns one entry per service, in the order Grafana, Prometheus, Loki, Tempo: `service`, `configured`, `reachable`, `version`, and `checkedUtc`. The server runs the checks, not the browser, against the internal URL: Grafana `GET /api/health` (which also carries the version), Prometheus `GET /-/ready` then `/api/v1/status/buildinfo`, Loki `GET /ready` then `/loki/api/v1/status/buildinfo`, and Tempo `GET /ready` then `/api/status/buildinfo`. Reachable means the readiness check answered 2xx within 2 seconds. Results are cached for 30 seconds and refreshed at once when a URL changes; the endpoint never fails because a service is down.

The dashboard uses both:

| Where | Link |
|---|---|
| Home, Observability | One card per configured service with a Reachable or Unreachable badge, its version, and an Open link. With nothing configured, a single "Set up observability" note links here. Localhost URLs are shown as `127.0.0.1`, and no default credentials are ever shown |
| Run detail | "View trace": Grafana Explore on `garrison-tempo` with the run's `traceId`. "View logs": Grafana Explore on `garrison-loki` with `{app="garrison"} \|= "<runId>"`, over the run's time range plus 5 minutes either side |
| Nodes | "Open in Grafana": the `garrison-workers` dashboard with `var-node=<node name>` |
| Home KPIs | The `garrison-overview` dashboard |
| Request History | The `garrison-http` dashboard |
| Analytics | The `garrison-runs` dashboard over the range selected on the page |

Grafana links are built for Grafana 10 and later. Explore links have the form `<grafana>/explore?schemaVersion=1&orgId=1&panes=<JSON>`, where the URL-encoded JSON holds one pane with the datasource UID, one query (`queryType: "traceql"` with the trace ID for Tempo, `expr` for Loki), and a `range` in epoch milliseconds. Dashboard links have the form `<grafana>/d/<uid>?orgId=1`, plus `var-node=` or `from=` and `to=` where they apply. Links are hidden when Grafana is not configured, and "View trace" is hidden for runs without a trace ID.

## Records in the database

| Record | Where to read it | Retention |
|---|---|---|
| Request history: method, path, status, timing, principal, and (truncated) bodies for every REST request | `GET /v1.0/api/request-history`, `GET /v1.0/api/request-history/summary` (counts per time bucket), dashboard | `RequestHistory.RetentionDays` (30) |
| Audit: authorization denials and privileged changes | `GET .../audit`, dashboard | `Audit.RetentionDays` (365) |
| Run events: lifecycle, assistant text, tool calls and results, usage, warnings, errors, the final result | `GET .../runs/{id}/events`, SSE, WebSocket | `Runs.EventRetentionDays` (14) |
| Runs, with outcome, usage, cost, served model, trace ID, exit code, stderr tail, and the template versions used | `GET .../runs` | `Runs.RetentionDays` (30) |

Request history capture can be turned off with the `RequestHistory.Enabled` cluster setting, and the captured body size is limited by `RequestHistory.MaxRequestBodyBytes` and `MaxResponseBodyBytes`. The overview endpoint (`GET .../overview`) summarizes run counts, outcomes, and node state for dashboards.

## Kubernetes

The Helm chart and Kustomize base annotate the server and worker pods with `prometheus.io/scrape: "true"`, `prometheus.io/path: /metrics`, and `prometheus.io/port` set to the main listener that relays `/metrics`: 8700 on the server and 8710 on workers. Point a Prometheus that honors those annotations at the pod IPs and it finds every replica. Do not scrape the dedicated listeners (9464, 9465) by pod IP: they answer only requests addressed to the pod host name and return 404 otherwise. The packaged observability stack (Prometheus, Grafana with the Garrison dashboards, Tempo, Loki, and Grafana Alloy) lives in `k8s/components/observability`; `docs/KUBERNETES.md` covers the overlays that enable it, and `docs/DOCKER.md` the Compose profile.
