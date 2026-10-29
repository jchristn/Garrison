# Telemetry

Garrison gives you four ways to see what it is doing: metrics from the control plane, traces handed down to harnesses, logs, and the records it keeps in its own database (request history, audit, run events). This page covers each one, what to watch, and how the dashboard links into Grafana, Prometheus, Loki, and Tempo when you run them.

## Metrics

The control plane publishes metrics through Radiant (OpenTelemetry) and serves them in Prometheus format on a separate listener, port 9464 at `/metrics` by default. OTLP export can be turned on as well. The settings are under `Telemetry` (see `docs/CONFIGURATION.md`):

| Setting | Default |
|---|---|
| `Telemetry.Enabled` | `true` |
| `Telemetry.PrometheusEnable`, `PrometheusHostname`, `PrometheusPort`, `PrometheusPath` | `true`, `*`, `9464`, `/metrics` (hostname environment: `GARRISON_PROMETHEUS_HOSTNAME`, worker `GARRISON_WORKER_PROMETHEUS_HOSTNAME`) |
| `Telemetry.OtlpEnable`, `OtlpEndpoint` | `false`, `http://127.0.0.1:4317` |
| `Telemetry.ServeMetricsOnServicePort` | `false`: when `true`, `GET /metrics` is also served on the REST port (8700) or the worker health port (8710), without authentication |
| `Telemetry.ServiceName` | `garrison-server`; the control-plane node identifier is the service instance |
| `Telemetry.MaxLabelValues` | `200` (10 to 10000): distinct values each metric label may take before new values are reported as `other` (environment `GARRISON_TELEMETRY_MAX_LABEL_VALUES`, worker `GARRISON_WORKER_TELEMETRY_MAX_LABEL_VALUES`) |
| `Telemetry.Exemplars` | `true`: duration histograms carry the trace that produced a sample (sets `OTEL_METRICS_EXEMPLAR_FILTER=trace_based` unless it is already set) |

The Prometheus listener cannot bind a true wildcard, so a hostname of `*`, `+`, or `0.0.0.0` binds to the machine host name instead and falls back to `127.0.0.1` if that fails. It answers only requests addressed to the name it bound. Set `Telemetry.PrometheusHostname` (environment `GARRISON_PROMETHEUS_HOSTNAME`, or `GARRISON_WORKER_PROMETHEUS_HOSTNAME` on workers) to the address scrapers use: the Kustomize base and the Helm chart set it to the pod IP from the downward API (`status.podIP`), and Docker Compose gives every Garrison container a `hostname:` equal to its service name, which is what its Prometheus scrapes. The startup log names the address it used: `metrics listening on 10.42.0.17:9465/metrics`.

| Process | Metrics listener (what Prometheus scrapes) |
|---|---|
| Server | `http://<pod IP>:9464/metrics` (Compose: `http://garrison-server:9464/metrics`) |
| Worker | `http://<pod IP>:9465/metrics` (Compose: `http://garrison-worker-1:9465/metrics`) |

`kubectl port-forward` to 9464 or 9465 and `curl http://127.0.0.1:9464/metrics` inside the pod do not reach the listener, because it is bound to the pod IP. Ask it from inside the pod by that address instead:

```bash
kubectl -n garrison exec deploy/garrison-server -- sh -c 'curl -s http://$GARRISON_PROMETHEUS_HOSTNAME:9464/metrics' | head
kubectl -n garrison exec garrison-worker-0 -- sh -c 'curl -s http://$GARRISON_WORKER_PROMETHEUS_HOSTNAME:9465/metrics' | head
```

`Telemetry.ServeMetricsOnServicePort` (default `false`) also serves the exposition at `GET /metrics` on each process's main listener, the REST port 8700 on the server and the health port 8710 on workers, which bind every interface. That endpoint needs no authentication and labels series with tenant identifiers and agent names, and the REST port is the one an Ingress exposes, so it is off unless you turn it on for a reason, for example a scraper that can only reach the main port (SR-20). When on, it asks the metrics listener for a fresh scrape on every request, passing the scraper's `Accept` header through so an OpenMetrics scrape (which is what carries exemplars) stays OpenMetrics, so both return the same values; it answers 503 when the Prometheus listener is off or did not answer, and 404 while the setting is off. Scrapes of `/metrics` on the REST port are not recorded in request history. Radiant has no API that renders the exposition in process and binds one host per listener, which is why Garrison relays the scrape instead of binding a second listener.

If the pipeline cannot start at all, for example because the scrape port is taken, Garrison keeps running without metrics and logs `telemetry disabled: ...` at warning severity with the underlying cause.

### Garrison metrics

Every Garrison metric lives on one OpenTelemetry meter named `Garrison`, declared in a single catalog (`GarrisonMetricCatalog` in `src/Garrison.Core/Telemetry`) with its type, unit, labels, histogram buckets, the process that emits it, and the Grafana dashboard that charts it. The catalog is the source of the table in the [coverage matrix](#coverage-matrix) below, and a test fails when a metric is added without a row there or without a panel on its dashboard.

Prometheus names are the OpenTelemetry names with dots replaced by underscores, `_total` on counters, and `_seconds` or `_bytes` on histograms measured in seconds or bytes (`garrison.run.stage.duration` becomes `garrison_run_stage_duration_seconds_bucket`). Every series also carries `otel_scope_name="Garrison"` and the scrape label `process_component` (`server`, `worker`), `node`, `pod`, `namespace`, and `pool`.

Per-run metrics carry five labels, on the server and on the worker:

| Label | Value |
|---|---|
| `tenant` | Tenant ID |
| `agent` | Agent name |
| `deployment` | Deployment name (the ID when the name is not known) |
| `harness` | Harness type |
| `model` | Model the harness reported serving, `none` until it is known |

So a single query answers per-agent questions directly: p95 time to first token for one agent is `histogram_quantile(0.95, sum by (le) (rate(garrison_run_stage_duration_seconds_bucket{stage="first_token", agent="triage"}[15m])))`, and its input tokens per hour are `sum(increase(garrison_run_tokens_total{agent="triage", direction="input"}[1h]))`. The stages of `garrison_run_stage_duration_seconds` are `queue`, `claim`, `compile`, `startup`, `first_token`, `first_token_excl_delegation`, `streaming`, `execution`, `delegation_wait`, and `total`, matching the [run timing](#run-timing) fields.

Requests the client abandoned before the answer, such as a worker dropping its cancellation watch long poll whenever its set of runs changes, are recorded with `status_code="499"` and `status_class="aborted"`, so they never inflate 5xx error rates.

#### Cardinality

Labels never carry run IDs, user IDs, raw paths, or free text. REST metrics use the route template Watson matched (`/v1.0/api/tenants/{tenantId}/runs/{id}`), never the raw path. The labels that grow with your data (tenant, agent, deployment, model, MCP tool, database table, error type) pass through a guard: each label keeps its first `Telemetry.MaxLabelValues` distinct values (200 by default) and reports any further value as `other`, counting each one in `garrison_telemetry_labels_folded_total{label}`. Empty values are reported as `none`. If that counter moves, raise the limit or look for a label that is not as bounded as it should be. The guard bounds each label independently, not their cross-product; series count still depends on active combinations and histogram buckets. Size retention and collectors using measured cardinality.

#### Exemplars

Duration histograms (REST requests, run stages, database statements, MCP tools, A2A methods, outbound calls, background iterations) carry exemplars: for a sampled request, the trace ID of the request that produced the sample. Prometheus stores them when it runs with `--enable-feature=exemplar-storage` (the packaged Prometheus does), and the `garrison-prometheus` Grafana datasource links an exemplar's `trace_id` to `garrison-tempo`, so a latency spike on a panel is one click from the trace that caused it. Only OpenMetrics scrapes include exemplars; Prometheus asks for OpenMetrics by default.

Counters are created the first time something happens, so a series' first scrape already holds a count and a plain `increase()` would miss those first events (an agent that ran twice shows 0). The OpenMetrics exposition carries a `_created` timestamp for every counter, and the packaged Prometheus runs with `--enable-feature=created-timestamp-zero-ingestion` to insert the zero before it. A Prometheus of your own needs the same flag for low-volume series to count correctly.

### Other metrics in the scrape

| Source | Prefix | What it adds |
|---|---|---|
| Watson (REST and MCP listeners) | `http_server_*`, `watson_*` | The OpenTelemetry HTTP server metrics by `http_route`, plus connections, route matches and misses, authentication decisions, WebSocket sessions, exceptions, and uptime. Watson telemetry is on explicitly in the server |
| Voltaic (MCP) | `voltaic_*` | MCP protocol metrics |
| Npgsql | `db_client_*` | Postgresql connection pool use, waits, and timeouts (Postgresql only) |
| .NET runtime and process | `dotnet_*`, `process_*` | GC, heap, threads, CPU, working set |

### What to watch

| Question | Look at |
|---|---|
| Are runs failing, and why? | `garrison_runs_finished_total` by `outcome` and `agent`. `NotCredentialed`, `NotInstalled`, and `McpPreflightFailed` point at configuration, not at the model |
| Which agent is slow, and where? | `garrison_run_stage_duration_seconds` by `stage` for that agent: queue time is capacity, `startup` is workspace and MCP preflight, `first_token` is the harness and model, `streaming` is output length |
| Which agent or model costs the most? | `garrison_run_cost_usd_total` and `garrison_run_tokens_total` by `agent`, `model`, and `direction` |
| Are guards stopping runs? | `garrison_runs_guard_trips_total` by `guard` and `agent` |
| Are workers dying mid-run? | `garrison_lease_expirations_total`, `garrison_node_transitions_total{status="Lost"}` |
| Is there contention for work? | The `lost` share of `garrison_claims_total`. Some is normal with many workers |
| Is a deployment throttled? | `garrison_claims_total{result="limit"}` |
| Is work queuing? | `garrison_queue_depth` by `agent` and `status`, `garrison_runs_blocked_current` by `reason` |
| Is the API healthy? | `garrison_http_requests_total` by `route` and `status_class`, p95 of `garrison_http_request_duration_seconds` by `route` |
| Is the database the bottleneck? | p95 of `garrison_db_operation_duration_seconds` by `table`, `garrison_db_errors_total`, `garrison_db_write_lock_wait_seconds` on Sqlite |
| Are all control-plane replicas up? | `max(garrison_control_nodes{status="Ready"})` against the expected replica count, and `GET /v1.0/api/control-nodes` for which one is missing |
| Is someone guessing credentials? | `garrison_auth_failures_total` by `reason`, `garrison_auth_rate_limited_total` |

Cost metrics contain harness-reported cost or server estimates using operator-configured model rates. Missing prices or usage can leave cost unknown; these counters do not measure infrastructure, database hosting, collector expense or a provider invoice. Worker cost metrics contain reported harness cost, while server completion can add a configured estimate.

### Worker metrics

Workers publish their own metrics through the same pipeline, configured by the `Telemetry` block in `garrison-worker.json` (service name `garrison-worker`, Prometheus on port 9465 at `/metrics`) and the environment variables `GARRISON_WORKER_TELEMETRY_ENABLE`, `GARRISON_WORKER_PROMETHEUS_PORT`, `GARRISON_WORKER_OTLP_ENABLE`, `GARRISON_WORKER_OTLP_ENDPOINT`, and `GARRISON_WORKER_TELEMETRY_MAX_LABEL_VALUES`. Worker metrics are the `garrison_worker_*` rows of the catalog; every call a worker makes to the control plane is also an outbound call, `garrison_outbound_duration_seconds{service="control_plane", operation="lease"}` and so on, and its Kubernetes API calls are `service="kubernetes"`.

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

Durations measured by the worker never mix clocks, so they avoid cross-host clock skew even when the worker's and server's clocks disagree. Durations the server computes use only server timestamps for the same reason. A value that could not be measured is `null`: a harness that never started has no timings, one that was killed before it produced output has `executionMs` but no `timeToFirstTokenMs`, and runs that finished before schema migration 2 have only `queueMs` and `totalMs`, derived from their stored timestamps.

`timeToFirstTokenMs` deliberately stays the time to the first real model output. An agent that starts by calling `garrison_invoke_agent` and writes nothing until the child answers has a TTFT close to its whole run; `delegationWaitMs` shows how much of that was waiting, and `timeToFirstTokenExcludingDelegationMs` lets a chart compare it with agents that answer directly. Analytics reports `delegationWaitMsAvg` and the average, p50, and p95 of the excluded TTFT. Runs that finished before schema migration 4 have `null` for both.

The analytics endpoint aggregates up to 100,000 runs per request in the server process, so averages and percentiles (nearest rank) come out the same on Sqlite and Postgresql.

## Traces

Every run belongs to one W3C trace, and the run records its ID as `traceId` (32 lowercase hexadecimal characters) in REST, the MCP run summary, A2A task metadata (`garrison.traceId`), and the SDK models. Runs created before schema migration 5 have `null`.

| Span | Process | Source | Parent |
|---|---|---|---|
| `<METHOD> <route template>` | Server | `Watson` | The caller's `traceparent` when it sends one. One server span per REST request, including the node protocol |
| `mcp <tool>` | Server | `Garrison` | The MCP request span; agent tools are `mcp agent` |
| `a2a <method>` | Server | `Garrison` | The A2A request span |
| `run:create` | Server | `Garrison` | The request span (REST, MCP, or A2A) when one is recorded; for a delegated run, the parent run's trace |
| `run:claim` | Server | `Garrison` | `run:create`, even though the claim happens later inside a worker's lease request |
| `run:compile` | Server | `Garrison` | `run:claim` |
| `harness <type> exec` | Worker | `Garrison.Worker` | `run:claim`, from the traceparent shipped in the execution spec |
| `run:workspace`, `run:mcp_preflight` | Worker | `Garrison` | `harness <type> exec` |
| `run:k8s_job` | Worker | `Garrison` | `harness <type> exec`, for KubernetesJob runs |
| `run:report` | Worker | `Garrison.Worker` | The run's trace: the completion report and its retries |
| `db <operation> <table>` | Server | `Garrison` | Whatever span is current. Statement spans are only started inside a trace, never as roots, and name the statement, never its SQL text or values |
| `<service> <operation>` (client) | Server, worker | `Garrison` | Outbound calls: `control_plane lease` and the other node protocol calls, `kubernetes post`, `grafana probe`, `mcp_server test`, `mcp_internal post` (the MCP cluster proxy) |
| `<service> <operation>` (background) | Server, worker | `Garrison` | A new trace per iteration of a background service: `maintenance reap_leases`, `leader_election campaign`, `backplane poll`, `worker heartbeat`, and the rest listed in the coverage matrix |

The trace ID exists even when tracing is off: if no span is recorded, Garrison generates a sampled traceparent for the run, so deep links and log searches still work once you turn exporting on. Spans carry `garrison.run_id`, `garrison.tenant`, `garrison.agent`, `garrison.harness`, and `garrison.node` where they apply, OpenTelemetry attributes (`http.route`, `db.system`, `db.collection.name`, `rpc.method`, `peer.service`) where one exists, and an explicit status: failures set `Error` with the exception type and message, never values or secrets. The worker also passes the traceparent to the harness as the `TRACEPARENT` environment variable, so a harness that understands W3C trace context can join the trace. KubernetesJob run pods do not export spans (their network is locked down); they log `run=` and `trace=` on every line instead, so Loki joins them to the same trace.

Background iterations that found nothing to do (an empty lease poll, a maintenance step with no expired leases) tag their root span `garrison.idle="true"`. The packaged Alloy drops those traces whole with a tail-sampling policy, so idle polling does not flood Tempo, while every iteration still counts in `garrison_background_iterations_total{result="idle"}`.

Spans are exported through Radiant over OTLP (gRPC) when `Telemetry.OtlpEnable` is true. Turn it on for the server with `GARRISON_OTLP_ENABLE=true` and `GARRISON_OTLP_ENDPOINT` (for example `http://garrison-alloy:4317`), and for workers with `GARRISON_WORKER_OTLP_ENABLE=true` and `GARRISON_WORKER_OTLP_ENDPOINT`. With both on, a run's server and worker spans arrive in Tempo as one trace.

## Logs

Both processes log to the console by default, and the server logs the database schema version at startup; the control plane can also log to a file (`Logging.FileLogging`). Severity runs from 0 (debug) to 7 (emergency), with 1 as the default. The control plane's `Logging.MinimumSeverity` can be changed live through the settings API. Log lines are prefixed with the component, such as `[Mcp]` or `[LiveUpdates]`.

Every line about a run ends with `run=<runId> trace=<traceId>` (`trace=-` when the run has no trace ID). That covers the server's queued, leased, compile failure, cancellation, blocked, lease expiry, repair, and finished lines, and the worker's executing, process started, cancellation, lost lease, repair, and completion lines:

```
[Runs] run run_01JABC... queued for agent echo (Invoke, Fake) run=run_01JABC... trace=4bf92f3577b34da6a3ce929d0e0e4736
[Scheduler] run run_01JABC... leased to garrison-worker-0 (epoch 1) run=run_01JABC... trace=4bf92f3577b34da6a3ce929d0e0e4736
[Worker] executing run run_01JABC... (epoch 1, Fake) run=run_01JABC... trace=4bf92f3577b34da6a3ce929d0e0e4736
```

Lines also carry the other fields that apply, as `key=value` pairs after the message: `tenant`, `agent`, `deployment`, `model`, `node`, `outcome`, and, on the server's per-request debug line, `route`, `status`, and `trace`:

```
[Runs] run run_01JABC... finished Succeeded (Succeeded) on garrison-worker-0 in 812 ms run=run_01JABC... trace=4bf9... tenant=ten_01J... agent=echo deployment=default model=fake-1 node=garrison-worker-0 outcome=Succeeded
[GarrisonServer] GET /v1.0/api/tenants/ten_01J.../runs 200 (3.41ms) route=/v1.0/api/tenants/{tenantId}/runs tenant=ten_01J... status=200 trace=0af7...
```

With logs shipped to Loki under the label `app="garrison"`, `{app="garrison"} |= "<runId>"` returns everything the server and workers logged about a run, and `|= "trace=<traceId>"` does the same by trace. The packaged Alloy promotes `level`, `component` (`server`, `worker`, `dashboard`), `node`, and `tenant` to Loki labels, so `sum by (level) (count_over_time({app="garrison", tenant="ten_01J..."}[5m]))` is the log volume of one tenant by severity, and `{app="garrison", level=~"Warn|Error|Alert|Critical|Emergency"}` is every problem line.

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
                  "workers": "garrison-workers", "protocols": "garrison-protocols", "integrations": "garrison-integrations",
                  "agents": "garrison-agents", "models": "garrison-models", "kubernetes": "garrison-kubernetes",
                  "scheduler": "garrison-scheduler", "database": "garrison-database", "controlPlane": "garrison-control-plane",
                  "security": "garrison-security", "logs": "garrison-logs" }
}
```

`GET /v1.0/api/observability/status` (any signed-in user) returns one entry per service, in the order Grafana, Prometheus, Loki, Tempo: `service`, `configured`, `reachable`, `version`, and `checkedUtc`. The server runs the checks, not the browser, against the internal URL: Grafana `GET /api/health` (which also carries the version), Prometheus `GET /-/ready` then `/api/v1/status/buildinfo`, Loki `GET /ready` then `/loki/api/v1/status/buildinfo`, and Tempo `GET /ready` then `/api/status/buildinfo`. Reachable means the readiness check answered 2xx within 2 seconds. Results are cached for 30 seconds and refreshed at once when a URL changes; the endpoint never fails because a service is down.

The dashboard uses both:

| Where | Link |
|---|---|
| Home, Observability | One card per configured service with a Reachable or Unreachable badge, its version, and an Open link. With nothing configured, a single "Set up observability" note links here. Localhost URLs are shown as `127.0.0.1`, and no default credentials are ever shown |
| Run detail | "View trace": Grafana Explore on `garrison-tempo` with the run's `traceId`. "View logs": Grafana Explore on `garrison-loki` with `{app="garrison"} \|= "<runId>"`, over the run's time range plus 5 minutes either side |
| Home, Observability, Grafana dashboards | One link per section dashboard (Overview, HTTP API, Runs, Agents, Models and tokens, Workers, Kubernetes executor, Protocols, Scheduler and queue, Database, Control plane, Security and auth, Integrations, Logs and traces), each with a tooltip saying what it shows. Hidden when Grafana is not configured |
| Agent detail | "Open in Grafana": the `garrison-agents` dashboard with `var-tenant=<tenant ID>&var-agent=<agent name>` |
| Nodes | "Open in Grafana": the `garrison-workers` dashboard with `var-node=<node name>` |
| Home KPIs | The `garrison-overview` dashboard |
| Request History | The `garrison-http` dashboard |
| Analytics | The `garrison-runs` dashboard over the range selected on the page |

Grafana links are built for Grafana 10 and later. Explore links have the form `<grafana>/explore?schemaVersion=1&orgId=1&panes=<JSON>`, where the URL-encoded JSON holds one pane with the datasource UID, one query (`queryType: "traceql"` with the trace ID for Tempo, `expr` for Loki), and a `range` in epoch milliseconds. Dashboard links have the form `<grafana>/d/<uid>?orgId=1`, plus `var-node=`, `var-tenant=` and `var-agent=`, or `from=` and `to=` where they apply. Links are hidden when Grafana is not configured, and "View trace" is hidden for runs without a trace ID.

## Grafana dashboards

The packaged Grafana provisions one dashboard per section into the `Garrison` folder. Each has the `Garrison dashboards` menu at the top right (it keeps the time range and variables when you switch), template variables for the dimensions it covers (plus an `Average over` window for rates and percentiles), and links from its panels to the matching logs in Loki and traces in Tempo. Duration panels show exemplars: the dots link to the trace behind a sample.

| Dashboard | UID | Variables | What it answers |
|---|---|---|---|
| Overview | `garrison-overview` | node, tenant, agent, harness | Is the cluster healthy: replicas and workers up, run rate and failures, API errors, queue, cost, recent problems |
| HTTP API | `garrison-http` | node, tenant, route, method | Request rate, errors, and latency percentiles per route template, request and response sizes, in-flight requests |
| Runs | `garrison-runs` | tenant, agent, deployment, harness, model, run | Run lifecycle: created, finished by outcome, stage durations, cancellations, structured output validation and repairs |
| Agents | `garrison-agents` | tenant, agent, deployment, harness, model | Per agent: invocations, run time and TTFT percentiles, queue, startup, streaming, delegation wait, tokens, cost, outcomes, guard trips, tool calls |
| Models and tokens | `garrison-models` | node, tenant, agent, deployment, harness, model | Tokens by direction (input, output, cached, reasoning), cost, and output throughput by model and agent |
| Workers | `garrison-workers` | node, tenant, agent, deployment, harness, model | Leases, heartbeats, run duration and stages on workers, completion reports, event shipping, capability probes, node state |
| Kubernetes executor | `garrison-kubernetes` | node | Run Jobs created and deleted, pod start latency, PodFailed by reason, orphan cleanup, Kubernetes API latency |
| Protocols (MCP, A2A, SSE) | `garrison-protocols` | tenant, agent, tool, node | MCP tools and sessions, A2A methods and task states, SSE streams, WebSocket sessions, delegation depth and denials, invocation waits |
| Scheduler and queue | `garrison-scheduler` | tenant, agent, harness | Queue depth per agent, blocked runs by reason, claims, claim and compile latency, lease requests and waits, lease expirations |
| Database | `garrison-database` | node, provider, table | Statement latency by table and operation, errors, connections, Sqlite write-lock waits, retries, retention |
| Control plane | `garrison-control-plane` | node | Replicas, leader, backplane traffic and lag, background service iterations and failures, pauses |
| Security and auth | `garrison-security` | node | Authentication failures by scheme and reason, rate limiting, authorization denials, tokens issued, secret decryption, Codex token refresh, audit records |
| Integrations | `garrison-integrations` | node, service | Outbound calls by service and operation (control plane, Kubernetes, MCP servers, observability probes), their latency and errors, observability reachability |
| Logs and traces | `garrison-logs` | component, node, tenant, agent, run | Log volume by level and component, error and warning rates, recent problem lines, trace search, telemetry pipeline health |

Dashboard JSON lives in `k8s/components/observability/dashboards` (mirrored byte for byte in the Helm chart, and mounted by Docker Compose), and `GET /v1.0/api/server-info` lists every UID under `observability.dashboards`.

## Coverage matrix

This is the inventory of what Garrison instruments (P13.20). The REST, MCP, A2A, and metric tables are generated from the code: the `telemetry` test suite builds them from the server's route table, the MCP tool catalog, the A2A gateway, and the metric catalog, and fails when they differ from this page, so a route, tool, or metric added without telemetry fails CI. Regenerate them with `GARRISON_UPDATE_TELEMETRY_DOC=1 dotnet run --project src/Test.Automated -f net10.0 -- --suites telemetry`.

### How each area is covered

| Area | Metrics | Spans | Logs | Panels |
|---|---|---|---|---|
| REST routes | `garrison_http_requests_total`, `garrison_http_request_duration_seconds`, `garrison_http_request_size_bytes`, `garrison_http_response_size_bytes` by route template, recorded once per request in the server's post-routing hook | Watson server span per request | Debug line per request with `route`, `tenant`, `status`, `trace`; warning with the request on a 500 | garrison-http |
| Authentication and authorization | `garrison_auth_failures_total`, `garrison_auth_rate_limited_total`, `garrison_authz_denials_total`, `garrison_auth_tokens_issued_total`, `garrison_audit_events_total` | Request span | Audit records | garrison-security |
| MCP tools | `garrison_mcp_tool_calls_total`, `garrison_mcp_tool_results_total`, `garrison_mcp_tool_duration_seconds` | `mcp <tool>` | `[Mcp]` lines | garrison-protocols |
| MCP sessions | `garrison_mcp_sessions_active`, `garrison_mcp_sessions_total{event}`, `garrison_outbound_*{service="mcp_internal"}` | `mcp_internal <method>` client spans of the cluster proxy | `[McpProxy]` lines | garrison-protocols |
| A2A methods | `garrison_a2a_requests_total`, `garrison_a2a_request_duration_seconds`, `garrison_a2a_tasks_total` | `a2a <method>` | Request line | garrison-protocols |
| SSE and WebSocket | `garrison_sse_streams_active`, `garrison_sse_events_total`, `garrison_websocket_sessions_active`, `garrison_websocket_messages_total` | Request span | `[LiveUpdates]` lines | garrison-protocols |
| Invocation waits and delegation | `garrison_invocation_wait_duration_seconds`, `garrison_invocation_disconnect_cancels_total`, `garrison_delegation_depth`, `garrison_delegation_denials_total` | Request span, `run:create` | `[Runs]` cancellation lines | garrison-protocols |
| Run lifecycle | `garrison_runs_created_total`, `garrison_runs_finished_total`, `garrison_run_stage_duration_seconds`, tokens, cost, guard trips, cancellations, recorded at creation and at every terminal transition (worker completion, lease expiry, deadline, blocked, cancellation of a queued run, compile failure, rejection) | `run:create`, `run:claim`, `run:compile`, worker spans | `[Runs]`, `[Scheduler]`, `[Maintenance]` lines with `run`, `trace`, `tenant`, `agent`, `deployment` | garrison-runs, garrison-agents, garrison-models |
| Node protocol (server side) | REST metrics on `/v1.0/api/node/*`, `garrison_node_heartbeats_total`, `garrison_node_transitions_total`, `garrison_scheduler_*`, `garrison_claims_total`, `garrison_event_batch_size`, `garrison_run_events_total` | Request span, `run:claim` | `[Scheduler]` lines | garrison-scheduler, garrison-workers |
| Database | `garrison_db_operation_duration_seconds`, `garrison_db_errors_total`, `garrison_db_connections_in_use`, `garrison_db_write_lock_wait_seconds`, `garrison_db_transaction_retries_total`, Npgsql `db_client_*`. Recorded in the ADO.NET driver's execution methods, through which every statement runs | `db <operation> <table>`, `db transaction none` | Errors surface in the caller's lines | garrison-database |
| Outbound calls | `garrison_outbound_requests_total`, `garrison_outbound_duration_seconds` by service and operation, through one HTTP message handler | `<service> <operation>` client spans | Caller's lines | garrison-integrations |
| Worker paths | `garrison_worker_*`, `garrison_outbound_*{service="control_plane"}` | `harness <type> exec`, `run:workspace`, `run:mcp_preflight`, `run:k8s_job`, `run:report`, `worker heartbeat`, `worker lease` | `[Worker]` lines with `run`, `trace`, `tenant`, `agent`, `deployment` | garrison-workers, garrison-agents |
| Kubernetes executor | `garrison_worker_k8s_jobs_total`, `garrison_worker_k8s_pod_start_duration_seconds`, `garrison_worker_k8s_pod_failures_total`, `garrison_worker_jobs_reconciled_total`, `garrison_outbound_*{service="kubernetes"}` | `run:k8s_job`, `kubernetes <method>` | `[Worker]` and `[run-one]` lines with `run` and `trace` | garrison-kubernetes |

### Background services

Each iteration is one call through `GarrisonTracing.BackgroundAsync`, which records `garrison_background_duration_seconds` and `garrison_background_iterations_total{service, operation, result}` (`ok`, `idle`, `error`) and starts a root span named `<service> <operation>`.

| Service | Operations | Process | Also records |
|---|---|---|---|
| `maintenance` (leader) | `reap_leases`, `enforce_deadlines`, `mark_lost_nodes`, `mark_offline_control_nodes`, `blocked_runs`, `run_retention`, `cleanup_shared_state` | Server | `garrison_lease_expirations_total`, `garrison_runs_blocked_*`, `garrison_node_transitions_total`, `garrison_control_node_transitions_total`, `garrison_retention_deleted_total`, `garrison_maintenance_pauses_total` (pause detector, every replica) |
| `leader_election` | `campaign` | Server | `garrison_leader_changes_total`, `garrison_leader_is_leader` |
| `control_node` | `heartbeat` | Server | `garrison_control_node_heartbeats_total`, `garrison_control_nodes` |
| `gauges` | `refresh` | Server | `garrison_runs_queued`, `garrison_runs_active`, `garrison_queue_depth`, `garrison_nodes` |
| `backplane` | `publish`, `poll` (polling backplane; the Postgresql backplane receives through LISTEN) | Server | `garrison_backplane_published_total`, `garrison_backplane_received_total`, `garrison_backplane_lag_seconds` |
| `retention` (leader) | `prune` | Server | `garrison_retention_deleted_total` |
| `cluster_settings` | `refresh` | Server | |
| Codex auth refresher (G-22) | `refresh` | Server | `garrison_codex_token_refresh_total{result}` |
| Request history writer | | Server | `garrison_request_history_captured_total` |
| `worker` | `heartbeat`, `lease` | Worker | `garrison_worker_heartbeats_total`, `garrison_worker_leases_total`, `garrison_worker_pauses_total` |
| Worker capability probe, cancellation watch, Job reconciler | | Worker | `garrison_worker_capability_probes_total`, `garrison_outbound_*{operation="watch"}`, `garrison_worker_jobs_reconciled_total` |

### Deliberately not instrumented

| What | Why |
|---|---|
| Dedicated remote-executor HTTP/MCP stage measurements | Remote A2A/MCP execution is implemented and reports normalized run events and worker execution outcomes. `RemoteRunExecutor` uses address-policy-guarded clients; it does not currently add the same per-stage outbound measurements as the node-protocol handler. Do not infer remote call-stage coverage from the node-protocol metrics |
| OTLP export outcomes | Radiant does not expose exporter results; its diagnostics are counted in `garrison_telemetry_diagnostics_total` and logged |
| Spans inside KubernetesJob run pods | Run pods have no network path to the collector by design; their log lines carry `run=` and `trace=` |
| Database statement spans outside a trace | Background polling would create a root span per query; the statements are still timed in `garrison_db_operation_duration_seconds` |
| The runtime module's settings re-apply loop | In-memory only; the settings refresh it follows is the `cluster_settings refresh` iteration |
| Request-scoped wait loops (synchronous waits, SSE and WebSocket pumps, the node cancellation watch) | They are part of a request, covered by its span and by the invocation, SSE, and WebSocket metrics |
| The MCP listener's own requests in `garrison_http_*` | The MCP port is a separate listener; Watson's `http_server_*` metrics and the `mcp_internal` outbound metrics cover it |
| The dashboard container | It is a static site behind nginx; its logs are shipped (`component="dashboard"`), it has no metrics |

### Metric catalog

<!-- telemetry-coverage:metrics -->
| Metric (Prometheus) | Type | Labels | Process | Dashboard | Meaning |
|---|---|---|---|---|---|
| `garrison_run_tool_calls` | histogram | `agent`, `harness` | server | garrison-agents | Tool calls (MCP tools, shell commands, searches) per run |
| `garrison_runs_guard_trips_total` | counter | `guard`, `tenant`, `agent`, `harness` | server | garrison-agents | Runs stopped by a guard: repetition, no_progress, output_limit, timeout, blocked |
| `garrison_background_duration_seconds` | histogram, seconds | `service`, `operation`, `result` | server, worker | garrison-control-plane | Duration of one iteration of a background service (scheduler, maintenance steps, leader election, retention, gauges, settings refresh, ...) |
| `garrison_background_iterations_total` | counter | `service`, `operation`, `result` | server, worker | garrison-control-plane | Background service iterations by result (ok, idle, error) |
| `garrison_backplane_lag_seconds` | histogram, seconds | `backplane` | server | garrison-control-plane | Time from publish on one replica to delivery on another |
| `garrison_backplane_published_total` | counter | `backplane`, `kind` | server | garrison-control-plane | Backplane messages published by this replica |
| `garrison_backplane_received_total` | counter | `backplane`, `kind` | server | garrison-control-plane | Backplane messages received from other replicas |
| `garrison_build_info` | gauge | `version`, `process` | server, worker | garrison-overview | Always 1; carries the Garrison version and process (server, worker) |
| `garrison_control_node_heartbeats_total` | counter | `result` | server | garrison-control-plane | This replica's control node heartbeats (ok, error) |
| `garrison_control_node_transitions_total` | counter | `status` | server | garrison-control-plane | Control node state transitions, by new status |
| `garrison_control_nodes` | gauge | `status` | server | garrison-control-plane | Control-plane replicas by status; every replica reports the same cluster-wide counts, so aggregate with max |
| `garrison_leader_changes_total` | counter | `role` | server | garrison-control-plane | Leadership acquired or lost by this replica |
| `garrison_leader_is_leader` | gauge | none | server | garrison-control-plane | 1 on the replica that holds leadership, 0 elsewhere |
| `garrison_maintenance_pauses_total` | counter | `leader` | server | garrison-control-plane | Process pauses (VM or container freeze) detected by maintenance |
| `garrison_archive_runs_total` | counter | `kind`, `result` | server | garrison-database | Runs and events written to the retention archive (kind runs or events, result ok or error) |
| `garrison_db_connections_in_use` | gauge | `provider` | server | garrison-database | Database connections open in this process (Postgresql pooling detail is in the npgsql_* metrics) |
| `garrison_db_errors_total` | counter | `provider`, `operation`, `table`, `error` | server | garrison-database | Database statements that threw, by exception type |
| `garrison_db_operation_duration_seconds` | histogram, seconds | `provider`, `operation`, `table`, `result` | server | garrison-database | Database statement and transaction duration by provider, operation (select, insert, update, delete, transaction, ...), and table |
| `garrison_db_transaction_retries_total` | counter | `provider` | server | garrison-database | Transactions retried after a transient conflict (serialization failure, busy database) |
| `garrison_db_write_lock_wait_seconds` | histogram, seconds | `provider` | server | garrison-database | Time waiting for the Sqlite write lock |
| `garrison_request_history_captured_total` | counter | `result` | server | garrison-database | Request history entries written or dropped |
| `garrison_retention_deleted_total` | counter | `kind` | server | garrison-database | Rows removed by retention (runs, events, request history, audit, ...) |
| `garrison_http_request_duration_seconds` | histogram, seconds | `method`, `route`, `status_class`, `tenant` | server | garrison-http | Time from the request arriving to the response being sent |
| `garrison_http_request_size_bytes` | histogram, bytes | `method`, `route` | server | garrison-http | Request body size |
| `garrison_http_requests_total` | counter | `method`, `route`, `status_code`, `status_class`, `tenant` | server | garrison-http | REST requests handled, by route template (never the raw path), method, status, and tenant. Requests the client abandoned (a worker dropping its cancellation watch, a closed browser tab) have status_code 499 and status_class aborted, never 5xx |
| `garrison_http_requests_in_flight` | gauge | none | server | garrison-http | REST requests being handled right now, including long polls and streams |
| `garrison_http_response_size_bytes` | histogram, bytes | `method`, `route` | server | garrison-http | Response body size (0 for streamed responses) |
| `garrison_synchronous_wait_admission_total` | counter | `result` | server | garrison-http | Synchronous wait admission, accepted asynchronous fallback, or fail-fast delegation denial protecting worker protocol request capacity |
| `garrison_synchronous_waiters` | gauge | none | server | garrison-http | Active synchronous invocation waiters admitted by the shared request budget |
| `garrison_application_operation_duration_seconds` | histogram, seconds | `component`, `operation`, `result` | server and worker | garrison-integrations | Application stage wall time; use nested traces to separate database, admission and outbound work |
| `garrison_application_operations_total` | counter | `component`, `operation`, `result` | server and worker | garrison-integrations | Application stage completions including errors and cancellations; labels contain no run identifiers or input |
| `garrison_gateway_overhead_duration_seconds` | histogram, seconds | `mode`, `result` | server | garrison-integrations | Gateway-owned elapsed time excluding awaited tool dispatch; includes authorization, database statements and lock waits |
| `garrison_observability_reachable` | gauge | `service` | server | garrison-integrations | 1 when the server's last probe reached the observability service (Grafana, Prometheus, Loki, Tempo), 0 when not; absent when not configured |
| `garrison_outbound_duration_seconds` | histogram, seconds | `service`, `operation`, `result` | server, worker | garrison-integrations | Outbound call duration |
| `garrison_outbound_requests_total` | counter | `service`, `operation`, `result` | server, worker | garrison-integrations | Outbound calls (MCP server tests, A2A remote agents, observability probes, metrics relay, MCP proxying, Kubernetes API) by result (ok, error, status class) |
| `garrison_worker_jobs_reconciled_total` | counter | `result` | worker | garrison-kubernetes | Orphaned run Jobs deleted by the reconciler |
| `garrison_worker_k8s_jobs_total` | counter | `result` | worker | garrison-kubernetes | Run Jobs created (created, create_failed) and deleted |
| `garrison_worker_k8s_pod_failures_total` | counter | `reason` | worker | garrison-kubernetes | Run pods that failed outside the harness (PodFailed), by reason (Unschedulable, ImagePull, OOMKilled, Evicted, ...) |
| `garrison_worker_k8s_pod_start_duration_seconds` | histogram, seconds | none | worker | garrison-kubernetes | Run Job created to its pod running |
| `garrison_harness_tokens` | histogram | `direction`, `agent`, `harness`, `model` | server | garrison-models | Tokens per run as reported by the harness, by direction |
| `garrison_run_cost` | histogram | `agent`, `harness`, `model` | server | garrison-models | Cost per run in US dollars |
| `garrison_run_cost_usd_total` | counter | `tenant`, `agent`, `deployment`, `harness`, `model` | server | garrison-models | Reported or estimated cost of finished runs in US dollars |
| `garrison_run_output_rate` | histogram | `agent`, `harness`, `model` | server | garrison-models | Output tokens per second over the streaming window (runs with at least 100 ms of streaming) |
| `garrison_run_tokens_total` | counter | `direction`, `tenant`, `agent`, `deployment`, `harness`, `model` | server | garrison-models | Tokens consumed by finished runs, by direction (input, output, cached, reasoning) |
| `garrison_a2a_request_duration_seconds` | histogram, seconds | `method`, `result` | server | garrison-protocols | A2A JSON-RPC method duration |
| `garrison_a2a_requests_total` | counter | `method`, `result` | server | garrison-protocols | A2A JSON-RPC requests by method and result (ok, error) |
| `garrison_a2a_tasks_total` | counter | `state` | server | garrison-protocols | A2A task states returned to callers (submitted, working, completed, failed, canceled, ...) |
| `garrison_delegation_denials_total` | counter | `reason` | server | garrison-protocols | Delegations refused (depth, cycle, policy, quota) |
| `garrison_delegation_depth` | histogram | `agent` | server | garrison-protocols | Call depth of delegated runs when they are created |
| `garrison_invocation_disconnect_cancels_total` | counter | `surface` | server | garrison-protocols | Runs cancelled because the waiting caller disconnected (cancelOnDisconnect) |
| `garrison_invocation_wait_duration_seconds` | histogram, seconds | `surface`, `result` | server | garrison-protocols | How long synchronous invocations (REST wait, MCP garrison_invoke_agent and agent tools, A2A message/send) waited, by result (completed, timeout, disconnected, cancelled) |
| `garrison_mcp_sessions_total` | counter | `event` | server | garrison-protocols | MCP session lifecycle: created, restored (served on another replica than the one that created it), closed, expired |
| `garrison_mcp_sessions_active` | gauge | none | server | garrison-protocols | MCP sessions served by this replica |
| `garrison_mcp_tool_calls_total` | counter | `tool`, `tenant` | server | garrison-protocols | MCP tool calls; agent tools are reported as tool=agent |
| `garrison_mcp_tool_duration_seconds` | histogram, seconds | `tool`, `result` | server | garrison-protocols | MCP tool call duration, including the wait for invoked agents |
| `garrison_mcp_tool_results_total` | counter | `tool`, `result` | server | garrison-protocols | MCP tool outcomes (ok, error) |
| `garrison_sse_events_total` | counter | `stream` | server | garrison-protocols | Server-sent events written |
| `garrison_sse_streams_active` | gauge | `stream` | server | garrison-protocols | Server-sent event streams open on this replica (run_events, a2a) |
| `garrison_websocket_messages_total` | counter | `direction` | server | garrison-protocols | Live-update WebSocket messages (received, sent) |
| `garrison_websocket_sessions_active` | gauge | none | server | garrison-protocols | Live-update WebSocket sessions open on this replica |
| `garrison_approval_wait_seconds` | histogram, seconds | `source`, `decision` | server | garrison-runs | Time a pending approval waited for a person, the timeout, or a cancellation |
| `garrison_approvals_decided_total` | counter | `tenant`, `agent`, `source`, `decision` | server | garrison-runs | Permission approvals decided, by who decided (rule, default, user, timeout, cancelled) and the decision (allow, deny) |
| `garrison_approvals_pending` | gauge | none | server | garrison-runs | Approvals waiting for a person, as of the leader's last sweep; aggregate with max |
| `garrison_approvals_requested_total` | counter | `tenant`, `agent`, `kind`, `action` | server | garrison-runs | Permission requests relayed by harnesses, by the action the deployment's rules chose (allow, deny, ask) |
| `garrison_conversation_busy_total` | counter | `surface` | server | garrison-runs | Conversation turns refused with 409 ConversationBusy because the conversation's previous turn had not finished, by surface (rest, mcp, a2a) |
| `garrison_conversation_fallbacks_total` | counter | `reason` | server | garrison-runs | Conversation turns that could not resume their harness session and started a fresh one from the transcript, by reason (AffinityNodeLost, AffinityWaitExpired, WorkspaceLost, SessionMissing, HarnessChanged, ResumeUnsupported, ExecutorWithoutState) |
| `garrison_conversation_turns_total` | counter | `tenant`, `agent`, `mode` | server | garrison-runs | Conversation turns created, by how the harness session starts: first (a new conversation), resume (the session on the affinity node), or fallback (a fresh session seeded with the transcript) |
| `garrison_event_batch_size` | histogram | none | server | garrison-runs | Events per batch received from workers |
| `garrison_notification_deliveries_total` | counter | `event`, `result` | server | garrison-runs | Notification delivery attempts, by event and result (succeeded, retry, failed, blocked) |
| `garrison_notifications_queued_total` | counter | `event` | server | garrison-runs | Notifications queued in the outbox, by event |
| `garrison_pipeline_advances_total` | counter | `trigger`, `result` | server | garrison-runs | Pipeline run advancement passes, by trigger (hook, sweep, api) and result (changed when the pass moved the pipeline run, unchanged otherwise) |
| `garrison_pipeline_review_wait_seconds` | histogram, seconds | `source`, `decision` | server | garrison-runs | Time a pipeline stage review waited for its decision |
| `garrison_pipeline_reviews_decided_total` | counter | `tenant`, `pipeline`, `source`, `decision` | server | garrison-runs | Pipeline stage reviews decided, by who decided (user, timeout, cancelled) and the decision (approve, requestchanges, reject, none) |
| `garrison_pipeline_reviews_pending` | gauge | none | server | garrison-runs | Pipeline stage reviews waiting for a person, as of the leader's last pipeline sweep; aggregate with max |
| `garrison_pipeline_stage_executions_total` | counter | `tenant`, `pipeline`, `mode` | server | garrison-runs | Pipeline stage runs created, by why the execution started: first, retry (a failed attempt), revision (a reviewer requested changes), or resume (a retried pipeline run) |
| `garrison_pipeline_stage_start_failures_total` | counter | `tenant`, `pipeline`, `kind` | server | garrison-runs | Pipeline stage runs that could not be created, by kind: transient (for example QuotaExceeded, retried by the sweep) or permanent (the pipeline run fails with StageStartFailed) |
| `garrison_pipelines_finished_total` | counter | `tenant`, `pipeline`, `outcome` | server | garrison-runs | Pipeline runs that reached a terminal status, by outcome (Succeeded, StageFailed, StageStartFailed, ReviewRejected, ReviewExpired, Cancelled, TimedOut, InternalError) |
| `garrison_pipelines_started_total` | counter | `tenant`, `pipeline` | server | garrison-runs | Pipeline runs started (an idempotent repeat of a start is not counted) |
| `garrison_run_events_total` | counter | `type` | server | garrison-runs | Run events received from workers, by event type |
| `garrison_run_stage_duration_seconds` | histogram, seconds | `stage`, `tenant`, `agent`, `deployment`, `harness`, `model` | server | garrison-agents | Per-run stage durations: queue (queued to leased), claim (scheduler claim and compile inside the lease request), startup (leased to harness start), first_token (TTFT), first_token_excl_delegation, streaming (first to last output), execution (harness start to exit), delegation_wait, total (queued to completion received) |
| `garrison_runs_active` | gauge | none | server | garrison-runs | Runs leased, running, or cancelling, cluster-wide; aggregate with max |
| `garrison_runs_cancellations_total` | counter | `tenant`, `agent`, `reason` | server | garrison-runs | Cancellation requests accepted, by reason (request, disconnect, parent, pipeline) |
| `garrison_runs_created_total` | counter | `tenant`, `agent`, `deployment`, `harness`, `kind`, `executor` | server | garrison-runs | Runs created (invocations), per agent and deployment |
| `garrison_runs_finished_total` | counter | `tenant`, `agent`, `deployment`, `harness`, `model`, `outcome` | server | garrison-runs | Runs that reached a terminal status, by outcome and served model |
| `garrison_runs_queued` | gauge | none | server | garrison-runs | Runs waiting for a worker (Pending and Queued), cluster-wide; aggregate with max |
| `garrison_runs_repairs_total` | counter | `harness`, `tenant`, `agent` | server | garrison-runs | Structured output repair attempts started |
| `garrison_runs_schema_validations_total` | counter | `result`, `execution`, `harness`, `tenant`, `agent` | server | garrison-runs | Validations of run output against the agent's output schema |
| `garrison_trigger_fires_total` | counter | `tenant`, `source`, `outcome` | server | garrison-runs | Trigger fires, by source (cron, webhook, manual) and outcome (started, failed, skipped); repeated webhook deliveries are not counted |
| `garrison_trigger_webhook_rejections_total` | counter | `reason` | server | garrison-runs | Trigger webhook deliveries refused before firing, by reason (missing, malformed, stale, mismatch, too_large, inactive, bad_delivery_id) |
| `garrison_claims_total` | counter | `result`, `harness` | server | garrison-scheduler | Lease claim attempts: won, lost (another node claimed first), limit (deployment at its concurrency limit), affinity (a conversation turn left for its affinity node) |
| `garrison_compile_duration_seconds` | histogram, seconds | `harness`, `agent`, `result` | server | garrison-scheduler | Time to compile a claimed run into an execution spec |
| `garrison_lease_expirations_total` | counter | `action` | server | garrison-scheduler | Runs whose worker stopped renewing the lease (requeued or failed) |
| `garrison_lease_renewals_total` | counter | `result` | server | garrison-scheduler | Run leases extended by worker heartbeats, by result: renewed, or lost (the lease had moved on, so the worker is told to stop the run) |
| `garrison_queue_depth` | gauge | `status`, `tenant`, `agent`, `harness` | server | garrison-scheduler | Unfinished runs by status, tenant, agent, and harness, cluster-wide (refreshed every 10 seconds); aggregate with max |
| `garrison_runs_blocked_total` | counter | `reason` | server | garrison-scheduler | Runs that became blocked (warning appended) |
| `garrison_runs_blocked_current` | gauge | `reason` | server | garrison-scheduler | Queued runs no Ready worker can run right now, by reason; aggregate with max |
| `garrison_runs_blocked_failed_total` | counter | `reason` | server | garrison-scheduler | Blocked runs failed with NoCapableWorker after Runtime.FailBlockedAfterSeconds |
| `garrison_scheduler_claim_duration_seconds` | histogram, seconds | `result` | server | garrison-scheduler | Time to find, claim, and compile a run inside one lease request (result assigned or empty) |
| `garrison_scheduler_deployment_lock_wait_seconds` | histogram, seconds | none | server | garrison-scheduler | Time a claim waited for the per-deployment concurrency lock that serializes claims of one deployment (Postgresql only; Sqlite has a single writer) |
| `garrison_scheduler_lease_requests_total` | counter | `result` | server | garrison-scheduler | Worker lease requests answered, by result (assigned, empty) |
| `garrison_scheduler_lease_wait_duration_seconds` | histogram, seconds | `result` | server | garrison-scheduler | How long a lease request waited (long poll) before it was answered |
| `garrison_scheduler_queue_wakeups_total` | counter | `source` | server | garrison-scheduler | Lease long polls woken to look for work again, by source: notify (a queued run this poll could take, one poll per replica by default), handoff (another poll could not take the run and handed it on), pending (a run was queued while this poll was looking for work), broadcast (every poll woken: a backplane resynchronization, an older replica, or Scheduling.QueueWakeFanout 0), or poll (the fallback poll interval, Runtime.LeasePollMs, passed without a signal) |
| `garrison_audit_events_total` | counter | `type` | server | garrison-security | Audit records written, by event type |
| `garrison_auth_cache_lookups_total` | counter | `entity`, `result` | server | garrison-security | Authentication lookups by record (session, tenant, user, credential) and result: hit (answered from the per-replica cache, Auth.CacheSeconds) or miss (read from the database) |
| `garrison_auth_failures_total` | counter | `scheme`, `reason` | server | garrison-security | Requests rejected by authentication, by scheme (BearerToken, AccessKeySignature, ...) and reason (Invalid, NotFound, Inactive, Missing) |
| `garrison_auth_rate_limited_total` | counter | `scope` | server | garrison-security | Requests refused by the authentication rate limiter, by limiter scope |
| `garrison_auth_tokens_issued_total` | counter | `scheme`, `principal` | server | garrison-security | Session tokens issued (sign-ins and token exchanges) by scheme and principal type (User, Credential, Run) |
| `garrison_authz_denials_total` | counter | `resource`, `operation`, `result` | server | garrison-security | Authorization denials by resource type, operation, and result (Forbidden, NotFound) |
| `garrison_codex_token_refresh_total` | counter | `result` | server | garrison-security | Control-plane refreshes of Codex auth.json credentials by result (ok, failed, reauth_required, skipped) |
| `garrison_secret_decrypts_total` | counter | `result` | server | garrison-security | Secret decryptions by result (ok, error) |
| `garrison_telemetry_diagnostics_total` | counter | `severity` | server, worker | garrison-logs | Diagnostics reported by the telemetry pipeline (export failures and the like) |
| `garrison_telemetry_labels_folded_total` | counter | `label` | server, worker | garrison-overview | Measurements whose label value was replaced by other because the label already had Telemetry.MaxLabelValues distinct values |
| `garrison_node_heartbeats_total` | counter | `result` | server | garrison-workers | Worker heartbeats received (ok, unknown_node, rejected) |
| `garrison_node_transitions_total` | counter | `status` | server | garrison-workers | Worker node state transitions, by new status (Ready, Draining, Lost, Offline, Registered) |
| `garrison_nodes` | gauge | `status` | server | garrison-workers | Worker nodes by status, cluster-wide; aggregate with max |
| `garrison_worker_capability_probes_total` | counter | `harness`, `result` | worker | garrison-workers | Harness capability probes (available, unavailable) |
| `garrison_worker_completion_reports_total` | counter | `result` | worker | garrison-workers | Completion reports: accepted, stale (lease lost), abandoned (gave up after CompletionRetrySeconds) |
| `garrison_worker_conversations_swept_total` | counter | none | worker | garrison-workers | Conversation directories this worker deleted after they went unused for ConversationRetentionHours |
| `garrison_worker_events_total` | counter | `result` | worker | garrison-workers | Run events relayed to the control plane (shipped, dropped) |
| `garrison_worker_harness_cost_usd_total` | counter | `tenant`, `agent`, `deployment`, `harness`, `model` | worker | garrison-models | Reported cost of runs on this worker in US dollars |
| `garrison_worker_harness_tokens_total` | counter | `direction`, `tenant`, `agent`, `deployment`, `harness`, `model` | worker | garrison-models | Tokens reported by harnesses on this worker, by direction (input, output, cached, reasoning) |
| `garrison_worker_heartbeats_total` | counter | `result` | worker | garrison-workers | Heartbeats sent (ok, error) |
| `garrison_worker_leases_total` | counter | `result` | worker | garrison-workers | Lease requests and what came back (assigned, empty, error) |
| `garrison_worker_pauses_total` | counter | none | worker | garrison-workers | Process pauses detected by the worker's heartbeat loop |
| `garrison_worker_run_duration_seconds` | histogram, seconds | `tenant`, `agent`, `deployment`, `harness`, `model` | worker | garrison-workers | Run duration on the worker (lease to completion report) |
| `garrison_worker_run_guard_trips_total` | counter | `guard`, `harness`, `agent` | worker | garrison-agents | Runs this worker stopped with a guard (repetition, no_progress, output_limit, timeout) |
| `garrison_worker_run_stage_duration_seconds` | histogram, seconds | `stage`, `harness`, `agent` | worker | garrison-workers | Worker run stages: workspace (prepare), execution (executor, including MCP preflight), report (completion report until accepted) |
| `garrison_worker_run_streaming_seconds` | histogram, seconds | `tenant`, `agent`, `deployment`, `harness`, `model` | worker | garrison-workers | First to last model output |
| `garrison_worker_run_ttft_seconds` | histogram, seconds | `tenant`, `agent`, `deployment`, `harness`, `model` | worker | garrison-workers | Harness process start to first model output |
| `garrison_worker_runs_total` | counter | `tenant`, `agent`, `deployment`, `harness`, `model`, `outcome` | worker | garrison-workers | Runs this worker finished |
| `garrison_worker_runs_active` | gauge | none | worker | garrison-workers | Runs in progress on this worker |
| `garrison_worker_slots_free` | gauge | none | worker | garrison-workers | Free run slots on this worker |
| `garrison_worker_workspace_cache_total` | counter | `tenant`, `agent`, `deployment`, `cache`, `result` | worker | garrison-workers | Workspace cache lookups, split by git mirror or prepared archive and hit or miss |
<!-- /telemetry-coverage:metrics -->

### REST routes

Every route registers through the route registrar, which records it in the operation scope map; the table below is that map.

<!-- telemetry-coverage:routes -->
| Method | Route | Metric series | Span | Log | Panels |
|---|---|---|---|---|---|
| GET | `/metrics` | not recorded, so scrapes stay out of request metrics | `GET /metrics` | none | none |
| GET | `/v1.0/a2a/{tenantId}` | `route="/v1.0/a2a/{tenantId}"` | `GET /v1.0/a2a/{tenantId}` | `route=/v1.0/a2a/{tenantId}` | garrison-http, garrison-protocols |
| POST | `/v1.0/a2a/{tenantId}/{agentName}` | `route="/v1.0/a2a/{tenantId}/{agentName}"` | `POST /v1.0/a2a/{tenantId}/{agentName}` | `route=/v1.0/a2a/{tenantId}/{agentName}` | garrison-http, garrison-protocols |
| GET | `/v1.0/a2a/{tenantId}/{agentName}/.well-known/agent-card.json` | `route="/v1.0/a2a/{tenantId}/{agentName}/.well-known/agent-card.json"` | `GET /v1.0/a2a/{tenantId}/{agentName}/.well-known/agent-card.json` | `route=/v1.0/a2a/{tenantId}/{agentName}/.well-known/agent-card.json` | garrison-http, garrison-protocols |
| GET | `/v1.0/api/control-nodes` | `route="/v1.0/api/control-nodes"` | `GET /v1.0/api/control-nodes` | `route=/v1.0/api/control-nodes` | garrison-http |
| GET | `/v1.0/api/control-nodes/{id}` | `route="/v1.0/api/control-nodes/{id}"` | `GET /v1.0/api/control-nodes/{id}` | `route=/v1.0/api/control-nodes/{id}` | garrison-http |
| GET | `/v1.0/api/harness-profiles/builtin` | `route="/v1.0/api/harness-profiles/builtin"` | `GET /v1.0/api/harness-profiles/builtin` | `route=/v1.0/api/harness-profiles/builtin` | garrison-http |
| GET | `/v1.0/api/health` | `route="/v1.0/api/health"` | `GET /v1.0/api/health` | `route=/v1.0/api/health` | garrison-http |
| GET | `/v1.0/api/health/live` | `route="/v1.0/api/health/live"` | `GET /v1.0/api/health/live` | `route=/v1.0/api/health/live` | garrison-http |
| GET | `/v1.0/api/health/ready` | `route="/v1.0/api/health/ready"` | `GET /v1.0/api/health/ready` | `route=/v1.0/api/health/ready` | garrison-http |
| GET | `/v1.0/api/node-pools` | `route="/v1.0/api/node-pools"` | `GET /v1.0/api/node-pools` | `route=/v1.0/api/node-pools` | garrison-http |
| POST | `/v1.0/api/node-pools` | `route="/v1.0/api/node-pools"` | `POST /v1.0/api/node-pools` | `route=/v1.0/api/node-pools` | garrison-http |
| DELETE | `/v1.0/api/node-pools/{id}` | `route="/v1.0/api/node-pools/{id}"` | `DELETE /v1.0/api/node-pools/{id}` | `route=/v1.0/api/node-pools/{id}` | garrison-http |
| GET | `/v1.0/api/node-pools/{id}` | `route="/v1.0/api/node-pools/{id}"` | `GET /v1.0/api/node-pools/{id}` | `route=/v1.0/api/node-pools/{id}` | garrison-http |
| PUT | `/v1.0/api/node-pools/{id}` | `route="/v1.0/api/node-pools/{id}"` | `PUT /v1.0/api/node-pools/{id}` | `route=/v1.0/api/node-pools/{id}` | garrison-http |
| POST | `/v1.0/api/node/drain` | `route="/v1.0/api/node/drain"` | `POST /v1.0/api/node/drain` | `route=/v1.0/api/node/drain` | garrison-http, garrison-workers |
| POST | `/v1.0/api/node/heartbeat` | `route="/v1.0/api/node/heartbeat"` | `POST /v1.0/api/node/heartbeat` | `route=/v1.0/api/node/heartbeat` | garrison-http, garrison-workers |
| POST | `/v1.0/api/node/lease` | `route="/v1.0/api/node/lease"` | `POST /v1.0/api/node/lease` | `route=/v1.0/api/node/lease` | garrison-http, garrison-workers, garrison-scheduler |
| POST | `/v1.0/api/node/register` | `route="/v1.0/api/node/register"` | `POST /v1.0/api/node/register` | `route=/v1.0/api/node/register` | garrison-http, garrison-workers |
| POST | `/v1.0/api/node/runs/{runId}/artifacts` | `route="/v1.0/api/node/runs/{runId}/artifacts"` | `POST /v1.0/api/node/runs/{runId}/artifacts` | `route=/v1.0/api/node/runs/{runId}/artifacts` | garrison-http, garrison-workers |
| POST | `/v1.0/api/node/runs/{runId}/complete` | `route="/v1.0/api/node/runs/{runId}/complete"` | `POST /v1.0/api/node/runs/{runId}/complete` | `route=/v1.0/api/node/runs/{runId}/complete` | garrison-http, garrison-workers |
| POST | `/v1.0/api/node/runs/{runId}/events` | `route="/v1.0/api/node/runs/{runId}/events"` | `POST /v1.0/api/node/runs/{runId}/events` | `route=/v1.0/api/node/runs/{runId}/events` | garrison-http, garrison-workers |
| POST | `/v1.0/api/node/runs/{runId}/files` | `route="/v1.0/api/node/runs/{runId}/files"` | `POST /v1.0/api/node/runs/{runId}/files` | `route=/v1.0/api/node/runs/{runId}/files` | garrison-http, garrison-workers |
| POST | `/v1.0/api/node/runs/{runId}/started` | `route="/v1.0/api/node/runs/{runId}/started"` | `POST /v1.0/api/node/runs/{runId}/started` | `route=/v1.0/api/node/runs/{runId}/started` | garrison-http, garrison-workers |
| POST | `/v1.0/api/node/tool-probes` | `route="/v1.0/api/node/tool-probes"` | `POST /v1.0/api/node/tool-probes` | `route=/v1.0/api/node/tool-probes` | garrison-http, garrison-workers |
| POST | `/v1.0/api/node/watch` | `route="/v1.0/api/node/watch"` | `POST /v1.0/api/node/watch` | `route=/v1.0/api/node/watch` | garrison-http, garrison-workers |
| GET | `/v1.0/api/nodes` | `route="/v1.0/api/nodes"` | `GET /v1.0/api/nodes` | `route=/v1.0/api/nodes` | garrison-http |
| DELETE | `/v1.0/api/nodes/{id}` | `route="/v1.0/api/nodes/{id}"` | `DELETE /v1.0/api/nodes/{id}` | `route=/v1.0/api/nodes/{id}` | garrison-http |
| GET | `/v1.0/api/nodes/{id}` | `route="/v1.0/api/nodes/{id}"` | `GET /v1.0/api/nodes/{id}` | `route=/v1.0/api/nodes/{id}` | garrison-http |
| PUT | `/v1.0/api/nodes/{id}` | `route="/v1.0/api/nodes/{id}"` | `PUT /v1.0/api/nodes/{id}` | `route=/v1.0/api/nodes/{id}` | garrison-http |
| POST | `/v1.0/api/nodes/{id}/cordon` | `route="/v1.0/api/nodes/{id}/cordon"` | `POST /v1.0/api/nodes/{id}/cordon` | `route=/v1.0/api/nodes/{id}/cordon` | garrison-http |
| POST | `/v1.0/api/nodes/{id}/drain` | `route="/v1.0/api/nodes/{id}/drain"` | `POST /v1.0/api/nodes/{id}/drain` | `route=/v1.0/api/nodes/{id}/drain` | garrison-http |
| POST | `/v1.0/api/nodes/{id}/uncordon` | `route="/v1.0/api/nodes/{id}/uncordon"` | `POST /v1.0/api/nodes/{id}/uncordon` | `route=/v1.0/api/nodes/{id}/uncordon` | garrison-http |
| GET | `/v1.0/api/observability/status` | `route="/v1.0/api/observability/status"` | `GET /v1.0/api/observability/status` | `route=/v1.0/api/observability/status` | garrison-http |
| DELETE | `/v1.0/api/request-history` | `route="/v1.0/api/request-history"` | `DELETE /v1.0/api/request-history` | `route=/v1.0/api/request-history` | garrison-http |
| GET | `/v1.0/api/request-history` | `route="/v1.0/api/request-history"` | `GET /v1.0/api/request-history` | `route=/v1.0/api/request-history` | garrison-http |
| GET | `/v1.0/api/request-history/summary` | `route="/v1.0/api/request-history/summary"` | `GET /v1.0/api/request-history/summary` | `route=/v1.0/api/request-history/summary` | garrison-http |
| DELETE | `/v1.0/api/request-history/{id}` | `route="/v1.0/api/request-history/{id}"` | `DELETE /v1.0/api/request-history/{id}` | `route=/v1.0/api/request-history/{id}` | garrison-http |
| GET | `/v1.0/api/request-history/{id}` | `route="/v1.0/api/request-history/{id}"` | `GET /v1.0/api/request-history/{id}` | `route=/v1.0/api/request-history/{id}` | garrison-http |
| GET | `/v1.0/api/server-info` | `route="/v1.0/api/server-info"` | `GET /v1.0/api/server-info` | `route=/v1.0/api/server-info` | garrison-http |
| GET | `/v1.0/api/settings` | `route="/v1.0/api/settings"` | `GET /v1.0/api/settings` | `route=/v1.0/api/settings` | garrison-http |
| PUT | `/v1.0/api/settings` | `route="/v1.0/api/settings"` | `PUT /v1.0/api/settings` | `route=/v1.0/api/settings` | garrison-http |
| POST | `/v1.0/api/settings/database/test` | `route="/v1.0/api/settings/database/test"` | `POST /v1.0/api/settings/database/test` | `route=/v1.0/api/settings/database/test` | garrison-http |
| POST | `/v1.0/api/settings/keys/rotate` | `route="/v1.0/api/settings/keys/rotate"` | `POST /v1.0/api/settings/keys/rotate` | `route=/v1.0/api/settings/keys/rotate` | garrison-http |
| POST | `/v1.0/api/settings/restart` | `route="/v1.0/api/settings/restart"` | `POST /v1.0/api/settings/restart` | `route=/v1.0/api/settings/restart` | garrison-http |
| GET | `/v1.0/api/tenants` | `route="/v1.0/api/tenants"` | `GET /v1.0/api/tenants` | `route=/v1.0/api/tenants` | garrison-http |
| POST | `/v1.0/api/tenants` | `route="/v1.0/api/tenants"` | `POST /v1.0/api/tenants` | `route=/v1.0/api/tenants` | garrison-http |
| DELETE | `/v1.0/api/tenants/{tenantId}` | `route="/v1.0/api/tenants/{tenantId}"` | `DELETE /v1.0/api/tenants/{tenantId}` | `route=/v1.0/api/tenants/{tenantId}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}` | `route="/v1.0/api/tenants/{tenantId}"` | `GET /v1.0/api/tenants/{tenantId}` | `route=/v1.0/api/tenants/{tenantId}` | garrison-http |
| PUT | `/v1.0/api/tenants/{tenantId}` | `route="/v1.0/api/tenants/{tenantId}"` | `PUT /v1.0/api/tenants/{tenantId}` | `route=/v1.0/api/tenants/{tenantId}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/agent-assets` | `route="/v1.0/api/tenants/{tenantId}/agent-assets"` | `GET /v1.0/api/tenants/{tenantId}/agent-assets` | `route=/v1.0/api/tenants/{tenantId}/agent-assets` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/agent-assets` | `route="/v1.0/api/tenants/{tenantId}/agent-assets"` | `POST /v1.0/api/tenants/{tenantId}/agent-assets` | `route=/v1.0/api/tenants/{tenantId}/agent-assets` | garrison-http |
| DELETE | `/v1.0/api/tenants/{tenantId}/agent-assets/{id}` | `route="/v1.0/api/tenants/{tenantId}/agent-assets/{id}"` | `DELETE /v1.0/api/tenants/{tenantId}/agent-assets/{id}` | `route=/v1.0/api/tenants/{tenantId}/agent-assets/{id}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/agent-assets/{id}` | `route="/v1.0/api/tenants/{tenantId}/agent-assets/{id}"` | `GET /v1.0/api/tenants/{tenantId}/agent-assets/{id}` | `route=/v1.0/api/tenants/{tenantId}/agent-assets/{id}` | garrison-http |
| PUT | `/v1.0/api/tenants/{tenantId}/agent-assets/{id}` | `route="/v1.0/api/tenants/{tenantId}/agent-assets/{id}"` | `PUT /v1.0/api/tenants/{tenantId}/agent-assets/{id}` | `route=/v1.0/api/tenants/{tenantId}/agent-assets/{id}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/agent-assets/{id}/versions` | `route="/v1.0/api/tenants/{tenantId}/agent-assets/{id}/versions"` | `GET /v1.0/api/tenants/{tenantId}/agent-assets/{id}/versions` | `route=/v1.0/api/tenants/{tenantId}/agent-assets/{id}/versions` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/agent-assets/{id}/versions` | `route="/v1.0/api/tenants/{tenantId}/agent-assets/{id}/versions"` | `POST /v1.0/api/tenants/{tenantId}/agent-assets/{id}/versions` | `route=/v1.0/api/tenants/{tenantId}/agent-assets/{id}/versions` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/agent-assets/{id}/versions/{number}` | `route="/v1.0/api/tenants/{tenantId}/agent-assets/{id}/versions/{number}"` | `GET /v1.0/api/tenants/{tenantId}/agent-assets/{id}/versions/{number}` | `route=/v1.0/api/tenants/{tenantId}/agent-assets/{id}/versions/{number}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/agent-assets/{id}/versions/{number}/files` | `route="/v1.0/api/tenants/{tenantId}/agent-assets/{id}/versions/{number}/files"` | `GET /v1.0/api/tenants/{tenantId}/agent-assets/{id}/versions/{number}/files` | `route=/v1.0/api/tenants/{tenantId}/agent-assets/{id}/versions/{number}/files` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/agents` | `route="/v1.0/api/tenants/{tenantId}/agents"` | `GET /v1.0/api/tenants/{tenantId}/agents` | `route=/v1.0/api/tenants/{tenantId}/agents` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/agents` | `route="/v1.0/api/tenants/{tenantId}/agents"` | `POST /v1.0/api/tenants/{tenantId}/agents` | `route=/v1.0/api/tenants/{tenantId}/agents` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/agents/register` | `route="/v1.0/api/tenants/{tenantId}/agents/register"` | `POST /v1.0/api/tenants/{tenantId}/agents/register` | `route=/v1.0/api/tenants/{tenantId}/agents/register` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/agents/{agentId}/invoke` | `route="/v1.0/api/tenants/{tenantId}/agents/{agentId}/invoke"` | `POST /v1.0/api/tenants/{tenantId}/agents/{agentId}/invoke` | `route=/v1.0/api/tenants/{tenantId}/agents/{agentId}/invoke` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/agents/{agentId}/playground/invoke` | `route="/v1.0/api/tenants/{tenantId}/agents/{agentId}/playground/invoke"` | `POST /v1.0/api/tenants/{tenantId}/agents/{agentId}/playground/invoke` | `route=/v1.0/api/tenants/{tenantId}/agents/{agentId}/playground/invoke` | garrison-http |
| DELETE | `/v1.0/api/tenants/{tenantId}/agents/{id}` | `route="/v1.0/api/tenants/{tenantId}/agents/{id}"` | `DELETE /v1.0/api/tenants/{tenantId}/agents/{id}` | `route=/v1.0/api/tenants/{tenantId}/agents/{id}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/agents/{id}` | `route="/v1.0/api/tenants/{tenantId}/agents/{id}"` | `GET /v1.0/api/tenants/{tenantId}/agents/{id}` | `route=/v1.0/api/tenants/{tenantId}/agents/{id}` | garrison-http |
| PUT | `/v1.0/api/tenants/{tenantId}/agents/{id}` | `route="/v1.0/api/tenants/{tenantId}/agents/{id}"` | `PUT /v1.0/api/tenants/{tenantId}/agents/{id}` | `route=/v1.0/api/tenants/{tenantId}/agents/{id}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/agents/{id}/card` | `route="/v1.0/api/tenants/{tenantId}/agents/{id}/card"` | `GET /v1.0/api/tenants/{tenantId}/agents/{id}/card` | `route=/v1.0/api/tenants/{tenantId}/agents/{id}/card` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/agents/{id}/revisions` | `route="/v1.0/api/tenants/{tenantId}/agents/{id}/revisions"` | `GET /v1.0/api/tenants/{tenantId}/agents/{id}/revisions` | `route=/v1.0/api/tenants/{tenantId}/agents/{id}/revisions` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/agents/{id}/revisions` | `route="/v1.0/api/tenants/{tenantId}/agents/{id}/revisions"` | `POST /v1.0/api/tenants/{tenantId}/agents/{id}/revisions` | `route=/v1.0/api/tenants/{tenantId}/agents/{id}/revisions` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/agents/{id}/revisions/diff` | `route="/v1.0/api/tenants/{tenantId}/agents/{id}/revisions/diff"` | `GET /v1.0/api/tenants/{tenantId}/agents/{id}/revisions/diff` | `route=/v1.0/api/tenants/{tenantId}/agents/{id}/revisions/diff` | garrison-http |
| DELETE | `/v1.0/api/tenants/{tenantId}/agents/{id}/revisions/{revId}` | `route="/v1.0/api/tenants/{tenantId}/agents/{id}/revisions/{revId}"` | `DELETE /v1.0/api/tenants/{tenantId}/agents/{id}/revisions/{revId}` | `route=/v1.0/api/tenants/{tenantId}/agents/{id}/revisions/{revId}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/agents/{id}/revisions/{revId}` | `route="/v1.0/api/tenants/{tenantId}/agents/{id}/revisions/{revId}"` | `GET /v1.0/api/tenants/{tenantId}/agents/{id}/revisions/{revId}` | `route=/v1.0/api/tenants/{tenantId}/agents/{id}/revisions/{revId}` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/agents/{id}/revisions/{revId}/publish` | `route="/v1.0/api/tenants/{tenantId}/agents/{id}/revisions/{revId}/publish"` | `POST /v1.0/api/tenants/{tenantId}/agents/{id}/revisions/{revId}/publish` | `route=/v1.0/api/tenants/{tenantId}/agents/{id}/revisions/{revId}/publish` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/analytics/runs` | `route="/v1.0/api/tenants/{tenantId}/analytics/runs"` | `GET /v1.0/api/tenants/{tenantId}/analytics/runs` | `route=/v1.0/api/tenants/{tenantId}/analytics/runs` | garrison-http, garrison-runs |
| GET | `/v1.0/api/tenants/{tenantId}/analytics/runs/dimensions` | `route="/v1.0/api/tenants/{tenantId}/analytics/runs/dimensions"` | `GET /v1.0/api/tenants/{tenantId}/analytics/runs/dimensions` | `route=/v1.0/api/tenants/{tenantId}/analytics/runs/dimensions` | garrison-http, garrison-runs |
| GET | `/v1.0/api/tenants/{tenantId}/approvals` | `route="/v1.0/api/tenants/{tenantId}/approvals"` | `GET /v1.0/api/tenants/{tenantId}/approvals` | `route=/v1.0/api/tenants/{tenantId}/approvals` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/approvals/{id}` | `route="/v1.0/api/tenants/{tenantId}/approvals/{id}"` | `GET /v1.0/api/tenants/{tenantId}/approvals/{id}` | `route=/v1.0/api/tenants/{tenantId}/approvals/{id}` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/approvals/{id}/decide` | `route="/v1.0/api/tenants/{tenantId}/approvals/{id}/decide"` | `POST /v1.0/api/tenants/{tenantId}/approvals/{id}/decide` | `route=/v1.0/api/tenants/{tenantId}/approvals/{id}/decide` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/apps` | `route="/v1.0/api/tenants/{tenantId}/apps"` | `GET /v1.0/api/tenants/{tenantId}/apps` | `route=/v1.0/api/tenants/{tenantId}/apps` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/apps` | `route="/v1.0/api/tenants/{tenantId}/apps"` | `POST /v1.0/api/tenants/{tenantId}/apps` | `route=/v1.0/api/tenants/{tenantId}/apps` | garrison-http |
| DELETE | `/v1.0/api/tenants/{tenantId}/apps/{id}` | `route="/v1.0/api/tenants/{tenantId}/apps/{id}"` | `DELETE /v1.0/api/tenants/{tenantId}/apps/{id}` | `route=/v1.0/api/tenants/{tenantId}/apps/{id}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/apps/{id}` | `route="/v1.0/api/tenants/{tenantId}/apps/{id}"` | `GET /v1.0/api/tenants/{tenantId}/apps/{id}` | `route=/v1.0/api/tenants/{tenantId}/apps/{id}` | garrison-http |
| PUT | `/v1.0/api/tenants/{tenantId}/apps/{id}` | `route="/v1.0/api/tenants/{tenantId}/apps/{id}"` | `PUT /v1.0/api/tenants/{tenantId}/apps/{id}` | `route=/v1.0/api/tenants/{tenantId}/apps/{id}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/apps/{id}/delegation` | `route="/v1.0/api/tenants/{tenantId}/apps/{id}/delegation"` | `GET /v1.0/api/tenants/{tenantId}/apps/{id}/delegation` | `route=/v1.0/api/tenants/{tenantId}/apps/{id}/delegation` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/apps/{id}/delegation` | `route="/v1.0/api/tenants/{tenantId}/apps/{id}/delegation"` | `POST /v1.0/api/tenants/{tenantId}/apps/{id}/delegation` | `route=/v1.0/api/tenants/{tenantId}/apps/{id}/delegation` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/apps/{id}/promote` | `route="/v1.0/api/tenants/{tenantId}/apps/{id}/promote"` | `POST /v1.0/api/tenants/{tenantId}/apps/{id}/promote` | `route=/v1.0/api/tenants/{tenantId}/apps/{id}/promote` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/apps/{id}/revisions` | `route="/v1.0/api/tenants/{tenantId}/apps/{id}/revisions"` | `GET /v1.0/api/tenants/{tenantId}/apps/{id}/revisions` | `route=/v1.0/api/tenants/{tenantId}/apps/{id}/revisions` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/apps/{id}/revisions` | `route="/v1.0/api/tenants/{tenantId}/apps/{id}/revisions"` | `POST /v1.0/api/tenants/{tenantId}/apps/{id}/revisions` | `route=/v1.0/api/tenants/{tenantId}/apps/{id}/revisions` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/apps/{id}/revisions/{revId}` | `route="/v1.0/api/tenants/{tenantId}/apps/{id}/revisions/{revId}"` | `GET /v1.0/api/tenants/{tenantId}/apps/{id}/revisions/{revId}` | `route=/v1.0/api/tenants/{tenantId}/apps/{id}/revisions/{revId}` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/apps/{id}/revisions/{revId}/publish` | `route="/v1.0/api/tenants/{tenantId}/apps/{id}/revisions/{revId}/publish"` | `POST /v1.0/api/tenants/{tenantId}/apps/{id}/revisions/{revId}/publish` | `route=/v1.0/api/tenants/{tenantId}/apps/{id}/revisions/{revId}/publish` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/artifact-stores` | `route="/v1.0/api/tenants/{tenantId}/artifact-stores"` | `GET /v1.0/api/tenants/{tenantId}/artifact-stores` | `route=/v1.0/api/tenants/{tenantId}/artifact-stores` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/artifact-stores` | `route="/v1.0/api/tenants/{tenantId}/artifact-stores"` | `POST /v1.0/api/tenants/{tenantId}/artifact-stores` | `route=/v1.0/api/tenants/{tenantId}/artifact-stores` | garrison-http |
| DELETE | `/v1.0/api/tenants/{tenantId}/artifact-stores/{id}` | `route="/v1.0/api/tenants/{tenantId}/artifact-stores/{id}"` | `DELETE /v1.0/api/tenants/{tenantId}/artifact-stores/{id}` | `route=/v1.0/api/tenants/{tenantId}/artifact-stores/{id}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/artifact-stores/{id}` | `route="/v1.0/api/tenants/{tenantId}/artifact-stores/{id}"` | `GET /v1.0/api/tenants/{tenantId}/artifact-stores/{id}` | `route=/v1.0/api/tenants/{tenantId}/artifact-stores/{id}` | garrison-http |
| PUT | `/v1.0/api/tenants/{tenantId}/artifact-stores/{id}` | `route="/v1.0/api/tenants/{tenantId}/artifact-stores/{id}"` | `PUT /v1.0/api/tenants/{tenantId}/artifact-stores/{id}` | `route=/v1.0/api/tenants/{tenantId}/artifact-stores/{id}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/artifacts` | `route="/v1.0/api/tenants/{tenantId}/artifacts"` | `GET /v1.0/api/tenants/{tenantId}/artifacts` | `route=/v1.0/api/tenants/{tenantId}/artifacts` | garrison-http |
| DELETE | `/v1.0/api/tenants/{tenantId}/artifacts/{id}` | `route="/v1.0/api/tenants/{tenantId}/artifacts/{id}"` | `DELETE /v1.0/api/tenants/{tenantId}/artifacts/{id}` | `route=/v1.0/api/tenants/{tenantId}/artifacts/{id}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/artifacts/{id}` | `route="/v1.0/api/tenants/{tenantId}/artifacts/{id}"` | `GET /v1.0/api/tenants/{tenantId}/artifacts/{id}` | `route=/v1.0/api/tenants/{tenantId}/artifacts/{id}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/artifacts/{id}/content` | `route="/v1.0/api/tenants/{tenantId}/artifacts/{id}/content"` | `GET /v1.0/api/tenants/{tenantId}/artifacts/{id}/content` | `route=/v1.0/api/tenants/{tenantId}/artifacts/{id}/content` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/artifacts/{id}/download-url` | `route="/v1.0/api/tenants/{tenantId}/artifacts/{id}/download-url"` | `POST /v1.0/api/tenants/{tenantId}/artifacts/{id}/download-url` | `route=/v1.0/api/tenants/{tenantId}/artifacts/{id}/download-url` | garrison-http |
| DELETE | `/v1.0/api/tenants/{tenantId}/audit` | `route="/v1.0/api/tenants/{tenantId}/audit"` | `DELETE /v1.0/api/tenants/{tenantId}/audit` | `route=/v1.0/api/tenants/{tenantId}/audit` | garrison-http, garrison-security |
| GET | `/v1.0/api/tenants/{tenantId}/audit` | `route="/v1.0/api/tenants/{tenantId}/audit"` | `GET /v1.0/api/tenants/{tenantId}/audit` | `route=/v1.0/api/tenants/{tenantId}/audit` | garrison-http, garrison-security |
| DELETE | `/v1.0/api/tenants/{tenantId}/audit/{id}` | `route="/v1.0/api/tenants/{tenantId}/audit/{id}"` | `DELETE /v1.0/api/tenants/{tenantId}/audit/{id}` | `route=/v1.0/api/tenants/{tenantId}/audit/{id}` | garrison-http, garrison-security |
| GET | `/v1.0/api/tenants/{tenantId}/audit/{id}` | `route="/v1.0/api/tenants/{tenantId}/audit/{id}"` | `GET /v1.0/api/tenants/{tenantId}/audit/{id}` | `route=/v1.0/api/tenants/{tenantId}/audit/{id}` | garrison-http, garrison-security |
| GET | `/v1.0/api/tenants/{tenantId}/capabilities` | `route="/v1.0/api/tenants/{tenantId}/capabilities"` | `GET /v1.0/api/tenants/{tenantId}/capabilities` | `route=/v1.0/api/tenants/{tenantId}/capabilities` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/capabilities` | `route="/v1.0/api/tenants/{tenantId}/capabilities"` | `POST /v1.0/api/tenants/{tenantId}/capabilities` | `route=/v1.0/api/tenants/{tenantId}/capabilities` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/capabilities/refresh` | `route="/v1.0/api/tenants/{tenantId}/capabilities/refresh"` | `POST /v1.0/api/tenants/{tenantId}/capabilities/refresh` | `route=/v1.0/api/tenants/{tenantId}/capabilities/refresh` | garrison-http |
| DELETE | `/v1.0/api/tenants/{tenantId}/capabilities/{id}` | `route="/v1.0/api/tenants/{tenantId}/capabilities/{id}"` | `DELETE /v1.0/api/tenants/{tenantId}/capabilities/{id}` | `route=/v1.0/api/tenants/{tenantId}/capabilities/{id}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/capabilities/{id}` | `route="/v1.0/api/tenants/{tenantId}/capabilities/{id}"` | `GET /v1.0/api/tenants/{tenantId}/capabilities/{id}` | `route=/v1.0/api/tenants/{tenantId}/capabilities/{id}` | garrison-http |
| PUT | `/v1.0/api/tenants/{tenantId}/capabilities/{id}` | `route="/v1.0/api/tenants/{tenantId}/capabilities/{id}"` | `PUT /v1.0/api/tenants/{tenantId}/capabilities/{id}` | `route=/v1.0/api/tenants/{tenantId}/capabilities/{id}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/conversations` | `route="/v1.0/api/tenants/{tenantId}/conversations"` | `GET /v1.0/api/tenants/{tenantId}/conversations` | `route=/v1.0/api/tenants/{tenantId}/conversations` | garrison-http |
| DELETE | `/v1.0/api/tenants/{tenantId}/conversations/{id}` | `route="/v1.0/api/tenants/{tenantId}/conversations/{id}"` | `DELETE /v1.0/api/tenants/{tenantId}/conversations/{id}` | `route=/v1.0/api/tenants/{tenantId}/conversations/{id}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/conversations/{id}` | `route="/v1.0/api/tenants/{tenantId}/conversations/{id}"` | `GET /v1.0/api/tenants/{tenantId}/conversations/{id}` | `route=/v1.0/api/tenants/{tenantId}/conversations/{id}` | garrison-http |
| DELETE | `/v1.0/api/tenants/{tenantId}/conversations/{id}/files` | `route="/v1.0/api/tenants/{tenantId}/conversations/{id}/files"` | `DELETE /v1.0/api/tenants/{tenantId}/conversations/{id}/files` | `route=/v1.0/api/tenants/{tenantId}/conversations/{id}/files` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/conversations/{id}/files` | `route="/v1.0/api/tenants/{tenantId}/conversations/{id}/files"` | `GET /v1.0/api/tenants/{tenantId}/conversations/{id}/files` | `route=/v1.0/api/tenants/{tenantId}/conversations/{id}/files` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/conversations/{id}/files` | `route="/v1.0/api/tenants/{tenantId}/conversations/{id}/files"` | `POST /v1.0/api/tenants/{tenantId}/conversations/{id}/files` | `route=/v1.0/api/tenants/{tenantId}/conversations/{id}/files` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/conversations/{id}/files/content` | `route="/v1.0/api/tenants/{tenantId}/conversations/{id}/files/content"` | `GET /v1.0/api/tenants/{tenantId}/conversations/{id}/files/content` | `route=/v1.0/api/tenants/{tenantId}/conversations/{id}/files/content` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/conversations/{id}/files/download-url` | `route="/v1.0/api/tenants/{tenantId}/conversations/{id}/files/download-url"` | `POST /v1.0/api/tenants/{tenantId}/conversations/{id}/files/download-url` | `route=/v1.0/api/tenants/{tenantId}/conversations/{id}/files/download-url` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/conversations/{id}/files/versions` | `route="/v1.0/api/tenants/{tenantId}/conversations/{id}/files/versions"` | `GET /v1.0/api/tenants/{tenantId}/conversations/{id}/files/versions` | `route=/v1.0/api/tenants/{tenantId}/conversations/{id}/files/versions` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/conversations/{id}/runs` | `route="/v1.0/api/tenants/{tenantId}/conversations/{id}/runs"` | `GET /v1.0/api/tenants/{tenantId}/conversations/{id}/runs` | `route=/v1.0/api/tenants/{tenantId}/conversations/{id}/runs` | garrison-http, garrison-runs |
| GET | `/v1.0/api/tenants/{tenantId}/conversations/{id}/transcript` | `route="/v1.0/api/tenants/{tenantId}/conversations/{id}/transcript"` | `GET /v1.0/api/tenants/{tenantId}/conversations/{id}/transcript` | `route=/v1.0/api/tenants/{tenantId}/conversations/{id}/transcript` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/credential-scope-assignments` | `route="/v1.0/api/tenants/{tenantId}/credential-scope-assignments"` | `GET /v1.0/api/tenants/{tenantId}/credential-scope-assignments` | `route=/v1.0/api/tenants/{tenantId}/credential-scope-assignments` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/credential-scope-assignments` | `route="/v1.0/api/tenants/{tenantId}/credential-scope-assignments"` | `POST /v1.0/api/tenants/{tenantId}/credential-scope-assignments` | `route=/v1.0/api/tenants/{tenantId}/credential-scope-assignments` | garrison-http |
| DELETE | `/v1.0/api/tenants/{tenantId}/credential-scope-assignments/{id}` | `route="/v1.0/api/tenants/{tenantId}/credential-scope-assignments/{id}"` | `DELETE /v1.0/api/tenants/{tenantId}/credential-scope-assignments/{id}` | `route=/v1.0/api/tenants/{tenantId}/credential-scope-assignments/{id}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/credential-scope-assignments/{id}` | `route="/v1.0/api/tenants/{tenantId}/credential-scope-assignments/{id}"` | `GET /v1.0/api/tenants/{tenantId}/credential-scope-assignments/{id}` | `route=/v1.0/api/tenants/{tenantId}/credential-scope-assignments/{id}` | garrison-http |
| PUT | `/v1.0/api/tenants/{tenantId}/credential-scope-assignments/{id}` | `route="/v1.0/api/tenants/{tenantId}/credential-scope-assignments/{id}"` | `PUT /v1.0/api/tenants/{tenantId}/credential-scope-assignments/{id}` | `route=/v1.0/api/tenants/{tenantId}/credential-scope-assignments/{id}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/credentials` | `route="/v1.0/api/tenants/{tenantId}/credentials"` | `GET /v1.0/api/tenants/{tenantId}/credentials` | `route=/v1.0/api/tenants/{tenantId}/credentials` | garrison-http, garrison-security |
| POST | `/v1.0/api/tenants/{tenantId}/credentials` | `route="/v1.0/api/tenants/{tenantId}/credentials"` | `POST /v1.0/api/tenants/{tenantId}/credentials` | `route=/v1.0/api/tenants/{tenantId}/credentials` | garrison-http, garrison-security |
| DELETE | `/v1.0/api/tenants/{tenantId}/credentials/{id}` | `route="/v1.0/api/tenants/{tenantId}/credentials/{id}"` | `DELETE /v1.0/api/tenants/{tenantId}/credentials/{id}` | `route=/v1.0/api/tenants/{tenantId}/credentials/{id}` | garrison-http, garrison-security |
| GET | `/v1.0/api/tenants/{tenantId}/credentials/{id}` | `route="/v1.0/api/tenants/{tenantId}/credentials/{id}"` | `GET /v1.0/api/tenants/{tenantId}/credentials/{id}` | `route=/v1.0/api/tenants/{tenantId}/credentials/{id}` | garrison-http, garrison-security |
| PUT | `/v1.0/api/tenants/{tenantId}/credentials/{id}` | `route="/v1.0/api/tenants/{tenantId}/credentials/{id}"` | `PUT /v1.0/api/tenants/{tenantId}/credentials/{id}` | `route=/v1.0/api/tenants/{tenantId}/credentials/{id}` | garrison-http, garrison-security |
| GET | `/v1.0/api/tenants/{tenantId}/credentials/{id}/permissions` | `route="/v1.0/api/tenants/{tenantId}/credentials/{id}/permissions"` | `GET /v1.0/api/tenants/{tenantId}/credentials/{id}/permissions` | `route=/v1.0/api/tenants/{tenantId}/credentials/{id}/permissions` | garrison-http, garrison-security |
| POST | `/v1.0/api/tenants/{tenantId}/credentials/{id}/rotate` | `route="/v1.0/api/tenants/{tenantId}/credentials/{id}/rotate"` | `POST /v1.0/api/tenants/{tenantId}/credentials/{id}/rotate` | `route=/v1.0/api/tenants/{tenantId}/credentials/{id}/rotate` | garrison-http, garrison-security |
| GET | `/v1.0/api/tenants/{tenantId}/deployments` | `route="/v1.0/api/tenants/{tenantId}/deployments"` | `GET /v1.0/api/tenants/{tenantId}/deployments` | `route=/v1.0/api/tenants/{tenantId}/deployments` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/deployments` | `route="/v1.0/api/tenants/{tenantId}/deployments"` | `POST /v1.0/api/tenants/{tenantId}/deployments` | `route=/v1.0/api/tenants/{tenantId}/deployments` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/deployments/{deploymentId}/approval-check` | `route="/v1.0/api/tenants/{tenantId}/deployments/{deploymentId}/approval-check"` | `POST /v1.0/api/tenants/{tenantId}/deployments/{deploymentId}/approval-check` | `route=/v1.0/api/tenants/{tenantId}/deployments/{deploymentId}/approval-check` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/deployments/{deploymentId}/test` | `route="/v1.0/api/tenants/{tenantId}/deployments/{deploymentId}/test"` | `POST /v1.0/api/tenants/{tenantId}/deployments/{deploymentId}/test` | `route=/v1.0/api/tenants/{tenantId}/deployments/{deploymentId}/test` | garrison-http |
| DELETE | `/v1.0/api/tenants/{tenantId}/deployments/{id}` | `route="/v1.0/api/tenants/{tenantId}/deployments/{id}"` | `DELETE /v1.0/api/tenants/{tenantId}/deployments/{id}` | `route=/v1.0/api/tenants/{tenantId}/deployments/{id}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/deployments/{id}` | `route="/v1.0/api/tenants/{tenantId}/deployments/{id}"` | `GET /v1.0/api/tenants/{tenantId}/deployments/{id}` | `route=/v1.0/api/tenants/{tenantId}/deployments/{id}` | garrison-http |
| PUT | `/v1.0/api/tenants/{tenantId}/deployments/{id}` | `route="/v1.0/api/tenants/{tenantId}/deployments/{id}"` | `PUT /v1.0/api/tenants/{tenantId}/deployments/{id}` | `route=/v1.0/api/tenants/{tenantId}/deployments/{id}` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/deployments/{id}/compile-preview` | `route="/v1.0/api/tenants/{tenantId}/deployments/{id}/compile-preview"` | `POST /v1.0/api/tenants/{tenantId}/deployments/{id}/compile-preview` | `route=/v1.0/api/tenants/{tenantId}/deployments/{id}/compile-preview` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/environments` | `route="/v1.0/api/tenants/{tenantId}/environments"` | `GET /v1.0/api/tenants/{tenantId}/environments` | `route=/v1.0/api/tenants/{tenantId}/environments` | garrison-http |
| PUT | `/v1.0/api/tenants/{tenantId}/environments` | `route="/v1.0/api/tenants/{tenantId}/environments"` | `PUT /v1.0/api/tenants/{tenantId}/environments` | `route=/v1.0/api/tenants/{tenantId}/environments` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/fan-out-groups/{id}` | `route="/v1.0/api/tenants/{tenantId}/fan-out-groups/{id}"` | `GET /v1.0/api/tenants/{tenantId}/fan-out-groups/{id}` | `route=/v1.0/api/tenants/{tenantId}/fan-out-groups/{id}` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/fan-out-groups/{id}/cancel` | `route="/v1.0/api/tenants/{tenantId}/fan-out-groups/{id}/cancel"` | `POST /v1.0/api/tenants/{tenantId}/fan-out-groups/{id}/cancel` | `route=/v1.0/api/tenants/{tenantId}/fan-out-groups/{id}/cancel` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/harness-profiles` | `route="/v1.0/api/tenants/{tenantId}/harness-profiles"` | `GET /v1.0/api/tenants/{tenantId}/harness-profiles` | `route=/v1.0/api/tenants/{tenantId}/harness-profiles` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/harness-profiles` | `route="/v1.0/api/tenants/{tenantId}/harness-profiles"` | `POST /v1.0/api/tenants/{tenantId}/harness-profiles` | `route=/v1.0/api/tenants/{tenantId}/harness-profiles` | garrison-http |
| DELETE | `/v1.0/api/tenants/{tenantId}/harness-profiles/{id}` | `route="/v1.0/api/tenants/{tenantId}/harness-profiles/{id}"` | `DELETE /v1.0/api/tenants/{tenantId}/harness-profiles/{id}` | `route=/v1.0/api/tenants/{tenantId}/harness-profiles/{id}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/harness-profiles/{id}` | `route="/v1.0/api/tenants/{tenantId}/harness-profiles/{id}"` | `GET /v1.0/api/tenants/{tenantId}/harness-profiles/{id}` | `route=/v1.0/api/tenants/{tenantId}/harness-profiles/{id}` | garrison-http |
| PUT | `/v1.0/api/tenants/{tenantId}/harness-profiles/{id}` | `route="/v1.0/api/tenants/{tenantId}/harness-profiles/{id}"` | `PUT /v1.0/api/tenants/{tenantId}/harness-profiles/{id}` | `route=/v1.0/api/tenants/{tenantId}/harness-profiles/{id}` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/harness-profiles/{id}/clone` | `route="/v1.0/api/tenants/{tenantId}/harness-profiles/{id}/clone"` | `POST /v1.0/api/tenants/{tenantId}/harness-profiles/{id}/clone` | `route=/v1.0/api/tenants/{tenantId}/harness-profiles/{id}/clone` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/manifests/applies` | `route="/v1.0/api/tenants/{tenantId}/manifests/applies"` | `GET /v1.0/api/tenants/{tenantId}/manifests/applies` | `route=/v1.0/api/tenants/{tenantId}/manifests/applies` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/manifests/applies/{id}` | `route="/v1.0/api/tenants/{tenantId}/manifests/applies/{id}"` | `GET /v1.0/api/tenants/{tenantId}/manifests/applies/{id}` | `route=/v1.0/api/tenants/{tenantId}/manifests/applies/{id}` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/manifests/apply` | `route="/v1.0/api/tenants/{tenantId}/manifests/apply"` | `POST /v1.0/api/tenants/{tenantId}/manifests/apply` | `route=/v1.0/api/tenants/{tenantId}/manifests/apply` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/manifests/export` | `route="/v1.0/api/tenants/{tenantId}/manifests/export"` | `GET /v1.0/api/tenants/{tenantId}/manifests/export` | `route=/v1.0/api/tenants/{tenantId}/manifests/export` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/mcp-servers` | `route="/v1.0/api/tenants/{tenantId}/mcp-servers"` | `GET /v1.0/api/tenants/{tenantId}/mcp-servers` | `route=/v1.0/api/tenants/{tenantId}/mcp-servers` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/mcp-servers` | `route="/v1.0/api/tenants/{tenantId}/mcp-servers"` | `POST /v1.0/api/tenants/{tenantId}/mcp-servers` | `route=/v1.0/api/tenants/{tenantId}/mcp-servers` | garrison-http |
| DELETE | `/v1.0/api/tenants/{tenantId}/mcp-servers/{id}` | `route="/v1.0/api/tenants/{tenantId}/mcp-servers/{id}"` | `DELETE /v1.0/api/tenants/{tenantId}/mcp-servers/{id}` | `route=/v1.0/api/tenants/{tenantId}/mcp-servers/{id}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/mcp-servers/{id}` | `route="/v1.0/api/tenants/{tenantId}/mcp-servers/{id}"` | `GET /v1.0/api/tenants/{tenantId}/mcp-servers/{id}` | `route=/v1.0/api/tenants/{tenantId}/mcp-servers/{id}` | garrison-http |
| PUT | `/v1.0/api/tenants/{tenantId}/mcp-servers/{id}` | `route="/v1.0/api/tenants/{tenantId}/mcp-servers/{id}"` | `PUT /v1.0/api/tenants/{tenantId}/mcp-servers/{id}` | `route=/v1.0/api/tenants/{tenantId}/mcp-servers/{id}` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/mcp-servers/{id}/test` | `route="/v1.0/api/tenants/{tenantId}/mcp-servers/{id}/test"` | `POST /v1.0/api/tenants/{tenantId}/mcp-servers/{id}/test` | `route=/v1.0/api/tenants/{tenantId}/mcp-servers/{id}/test` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/model-prices` | `route="/v1.0/api/tenants/{tenantId}/model-prices"` | `GET /v1.0/api/tenants/{tenantId}/model-prices` | `route=/v1.0/api/tenants/{tenantId}/model-prices` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/model-prices` | `route="/v1.0/api/tenants/{tenantId}/model-prices"` | `POST /v1.0/api/tenants/{tenantId}/model-prices` | `route=/v1.0/api/tenants/{tenantId}/model-prices` | garrison-http |
| DELETE | `/v1.0/api/tenants/{tenantId}/model-prices/{id}` | `route="/v1.0/api/tenants/{tenantId}/model-prices/{id}"` | `DELETE /v1.0/api/tenants/{tenantId}/model-prices/{id}` | `route=/v1.0/api/tenants/{tenantId}/model-prices/{id}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/model-prices/{id}` | `route="/v1.0/api/tenants/{tenantId}/model-prices/{id}"` | `GET /v1.0/api/tenants/{tenantId}/model-prices/{id}` | `route=/v1.0/api/tenants/{tenantId}/model-prices/{id}` | garrison-http |
| PUT | `/v1.0/api/tenants/{tenantId}/model-prices/{id}` | `route="/v1.0/api/tenants/{tenantId}/model-prices/{id}"` | `PUT /v1.0/api/tenants/{tenantId}/model-prices/{id}` | `route=/v1.0/api/tenants/{tenantId}/model-prices/{id}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/notification-endpoints` | `route="/v1.0/api/tenants/{tenantId}/notification-endpoints"` | `GET /v1.0/api/tenants/{tenantId}/notification-endpoints` | `route=/v1.0/api/tenants/{tenantId}/notification-endpoints` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/notification-endpoints` | `route="/v1.0/api/tenants/{tenantId}/notification-endpoints"` | `POST /v1.0/api/tenants/{tenantId}/notification-endpoints` | `route=/v1.0/api/tenants/{tenantId}/notification-endpoints` | garrison-http |
| DELETE | `/v1.0/api/tenants/{tenantId}/notification-endpoints/{id}` | `route="/v1.0/api/tenants/{tenantId}/notification-endpoints/{id}"` | `DELETE /v1.0/api/tenants/{tenantId}/notification-endpoints/{id}` | `route=/v1.0/api/tenants/{tenantId}/notification-endpoints/{id}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/notification-endpoints/{id}` | `route="/v1.0/api/tenants/{tenantId}/notification-endpoints/{id}"` | `GET /v1.0/api/tenants/{tenantId}/notification-endpoints/{id}` | `route=/v1.0/api/tenants/{tenantId}/notification-endpoints/{id}` | garrison-http |
| PUT | `/v1.0/api/tenants/{tenantId}/notification-endpoints/{id}` | `route="/v1.0/api/tenants/{tenantId}/notification-endpoints/{id}"` | `PUT /v1.0/api/tenants/{tenantId}/notification-endpoints/{id}` | `route=/v1.0/api/tenants/{tenantId}/notification-endpoints/{id}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/notification-endpoints/{id}/deliveries` | `route="/v1.0/api/tenants/{tenantId}/notification-endpoints/{id}/deliveries"` | `GET /v1.0/api/tenants/{tenantId}/notification-endpoints/{id}/deliveries` | `route=/v1.0/api/tenants/{tenantId}/notification-endpoints/{id}/deliveries` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/notification-endpoints/{id}/deliveries/{deliveryId}` | `route="/v1.0/api/tenants/{tenantId}/notification-endpoints/{id}/deliveries/{deliveryId}"` | `GET /v1.0/api/tenants/{tenantId}/notification-endpoints/{id}/deliveries/{deliveryId}` | `route=/v1.0/api/tenants/{tenantId}/notification-endpoints/{id}/deliveries/{deliveryId}` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/notification-endpoints/{id}/rotate-secret` | `route="/v1.0/api/tenants/{tenantId}/notification-endpoints/{id}/rotate-secret"` | `POST /v1.0/api/tenants/{tenantId}/notification-endpoints/{id}/rotate-secret` | `route=/v1.0/api/tenants/{tenantId}/notification-endpoints/{id}/rotate-secret` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/notification-endpoints/{id}/test` | `route="/v1.0/api/tenants/{tenantId}/notification-endpoints/{id}/test"` | `POST /v1.0/api/tenants/{tenantId}/notification-endpoints/{id}/test` | `route=/v1.0/api/tenants/{tenantId}/notification-endpoints/{id}/test` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/overview` | `route="/v1.0/api/tenants/{tenantId}/overview"` | `GET /v1.0/api/tenants/{tenantId}/overview` | `route=/v1.0/api/tenants/{tenantId}/overview` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/permissions` | `route="/v1.0/api/tenants/{tenantId}/permissions"` | `GET /v1.0/api/tenants/{tenantId}/permissions` | `route=/v1.0/api/tenants/{tenantId}/permissions` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/permissions` | `route="/v1.0/api/tenants/{tenantId}/permissions"` | `POST /v1.0/api/tenants/{tenantId}/permissions` | `route=/v1.0/api/tenants/{tenantId}/permissions` | garrison-http |
| DELETE | `/v1.0/api/tenants/{tenantId}/permissions/{id}` | `route="/v1.0/api/tenants/{tenantId}/permissions/{id}"` | `DELETE /v1.0/api/tenants/{tenantId}/permissions/{id}` | `route=/v1.0/api/tenants/{tenantId}/permissions/{id}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/permissions/{id}` | `route="/v1.0/api/tenants/{tenantId}/permissions/{id}"` | `GET /v1.0/api/tenants/{tenantId}/permissions/{id}` | `route=/v1.0/api/tenants/{tenantId}/permissions/{id}` | garrison-http |
| PUT | `/v1.0/api/tenants/{tenantId}/permissions/{id}` | `route="/v1.0/api/tenants/{tenantId}/permissions/{id}"` | `PUT /v1.0/api/tenants/{tenantId}/permissions/{id}` | `route=/v1.0/api/tenants/{tenantId}/permissions/{id}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/pipeline-reviews` | `route="/v1.0/api/tenants/{tenantId}/pipeline-reviews"` | `GET /v1.0/api/tenants/{tenantId}/pipeline-reviews` | `route=/v1.0/api/tenants/{tenantId}/pipeline-reviews` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/pipeline-reviews/{id}` | `route="/v1.0/api/tenants/{tenantId}/pipeline-reviews/{id}"` | `GET /v1.0/api/tenants/{tenantId}/pipeline-reviews/{id}` | `route=/v1.0/api/tenants/{tenantId}/pipeline-reviews/{id}` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/pipeline-reviews/{id}/decide` | `route="/v1.0/api/tenants/{tenantId}/pipeline-reviews/{id}/decide"` | `POST /v1.0/api/tenants/{tenantId}/pipeline-reviews/{id}/decide` | `route=/v1.0/api/tenants/{tenantId}/pipeline-reviews/{id}/decide` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/pipeline-runs` | `route="/v1.0/api/tenants/{tenantId}/pipeline-runs"` | `GET /v1.0/api/tenants/{tenantId}/pipeline-runs` | `route=/v1.0/api/tenants/{tenantId}/pipeline-runs` | garrison-http |
| DELETE | `/v1.0/api/tenants/{tenantId}/pipeline-runs/{id}` | `route="/v1.0/api/tenants/{tenantId}/pipeline-runs/{id}"` | `DELETE /v1.0/api/tenants/{tenantId}/pipeline-runs/{id}` | `route=/v1.0/api/tenants/{tenantId}/pipeline-runs/{id}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/pipeline-runs/{id}` | `route="/v1.0/api/tenants/{tenantId}/pipeline-runs/{id}"` | `GET /v1.0/api/tenants/{tenantId}/pipeline-runs/{id}` | `route=/v1.0/api/tenants/{tenantId}/pipeline-runs/{id}` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/pipeline-runs/{id}/cancel` | `route="/v1.0/api/tenants/{tenantId}/pipeline-runs/{id}/cancel"` | `POST /v1.0/api/tenants/{tenantId}/pipeline-runs/{id}/cancel` | `route=/v1.0/api/tenants/{tenantId}/pipeline-runs/{id}/cancel` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/pipeline-runs/{id}/retry` | `route="/v1.0/api/tenants/{tenantId}/pipeline-runs/{id}/retry"` | `POST /v1.0/api/tenants/{tenantId}/pipeline-runs/{id}/retry` | `route=/v1.0/api/tenants/{tenantId}/pipeline-runs/{id}/retry` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/pipelines` | `route="/v1.0/api/tenants/{tenantId}/pipelines"` | `GET /v1.0/api/tenants/{tenantId}/pipelines` | `route=/v1.0/api/tenants/{tenantId}/pipelines` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/pipelines` | `route="/v1.0/api/tenants/{tenantId}/pipelines"` | `POST /v1.0/api/tenants/{tenantId}/pipelines` | `route=/v1.0/api/tenants/{tenantId}/pipelines` | garrison-http |
| DELETE | `/v1.0/api/tenants/{tenantId}/pipelines/{id}` | `route="/v1.0/api/tenants/{tenantId}/pipelines/{id}"` | `DELETE /v1.0/api/tenants/{tenantId}/pipelines/{id}` | `route=/v1.0/api/tenants/{tenantId}/pipelines/{id}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/pipelines/{id}` | `route="/v1.0/api/tenants/{tenantId}/pipelines/{id}"` | `GET /v1.0/api/tenants/{tenantId}/pipelines/{id}` | `route=/v1.0/api/tenants/{tenantId}/pipelines/{id}` | garrison-http |
| PUT | `/v1.0/api/tenants/{tenantId}/pipelines/{id}` | `route="/v1.0/api/tenants/{tenantId}/pipelines/{id}"` | `PUT /v1.0/api/tenants/{tenantId}/pipelines/{id}` | `route=/v1.0/api/tenants/{tenantId}/pipelines/{id}` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/pipelines/{id}/preview` | `route="/v1.0/api/tenants/{tenantId}/pipelines/{id}/preview"` | `POST /v1.0/api/tenants/{tenantId}/pipelines/{id}/preview` | `route=/v1.0/api/tenants/{tenantId}/pipelines/{id}/preview` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/pipelines/{id}/start` | `route="/v1.0/api/tenants/{tenantId}/pipelines/{id}/start"` | `POST /v1.0/api/tenants/{tenantId}/pipelines/{id}/start` | `route=/v1.0/api/tenants/{tenantId}/pipelines/{id}/start` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/promotions` | `route="/v1.0/api/tenants/{tenantId}/promotions"` | `GET /v1.0/api/tenants/{tenantId}/promotions` | `route=/v1.0/api/tenants/{tenantId}/promotions` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/promotions` | `route="/v1.0/api/tenants/{tenantId}/promotions"` | `POST /v1.0/api/tenants/{tenantId}/promotions` | `route=/v1.0/api/tenants/{tenantId}/promotions` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/promotions/{id}` | `route="/v1.0/api/tenants/{tenantId}/promotions/{id}"` | `GET /v1.0/api/tenants/{tenantId}/promotions/{id}` | `route=/v1.0/api/tenants/{tenantId}/promotions/{id}` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/promotions/{id}/rollback` | `route="/v1.0/api/tenants/{tenantId}/promotions/{id}/rollback"` | `POST /v1.0/api/tenants/{tenantId}/promotions/{id}/rollback` | `route=/v1.0/api/tenants/{tenantId}/promotions/{id}/rollback` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/prompt-templates` | `route="/v1.0/api/tenants/{tenantId}/prompt-templates"` | `GET /v1.0/api/tenants/{tenantId}/prompt-templates` | `route=/v1.0/api/tenants/{tenantId}/prompt-templates` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/prompt-templates` | `route="/v1.0/api/tenants/{tenantId}/prompt-templates"` | `POST /v1.0/api/tenants/{tenantId}/prompt-templates` | `route=/v1.0/api/tenants/{tenantId}/prompt-templates` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/prompt-templates/render` | `route="/v1.0/api/tenants/{tenantId}/prompt-templates/render"` | `POST /v1.0/api/tenants/{tenantId}/prompt-templates/render` | `route=/v1.0/api/tenants/{tenantId}/prompt-templates/render` | garrison-http |
| DELETE | `/v1.0/api/tenants/{tenantId}/prompt-templates/{id}` | `route="/v1.0/api/tenants/{tenantId}/prompt-templates/{id}"` | `DELETE /v1.0/api/tenants/{tenantId}/prompt-templates/{id}` | `route=/v1.0/api/tenants/{tenantId}/prompt-templates/{id}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/prompt-templates/{id}` | `route="/v1.0/api/tenants/{tenantId}/prompt-templates/{id}"` | `GET /v1.0/api/tenants/{tenantId}/prompt-templates/{id}` | `route=/v1.0/api/tenants/{tenantId}/prompt-templates/{id}` | garrison-http |
| PUT | `/v1.0/api/tenants/{tenantId}/prompt-templates/{id}` | `route="/v1.0/api/tenants/{tenantId}/prompt-templates/{id}"` | `PUT /v1.0/api/tenants/{tenantId}/prompt-templates/{id}` | `route=/v1.0/api/tenants/{tenantId}/prompt-templates/{id}` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/prompt-templates/{id}/clone` | `route="/v1.0/api/tenants/{tenantId}/prompt-templates/{id}/clone"` | `POST /v1.0/api/tenants/{tenantId}/prompt-templates/{id}/clone` | `route=/v1.0/api/tenants/{tenantId}/prompt-templates/{id}/clone` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/prompt-templates/{id}/render` | `route="/v1.0/api/tenants/{tenantId}/prompt-templates/{id}/render"` | `POST /v1.0/api/tenants/{tenantId}/prompt-templates/{id}/render` | `route=/v1.0/api/tenants/{tenantId}/prompt-templates/{id}/render` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/prompt-templates/{id}/reset` | `route="/v1.0/api/tenants/{tenantId}/prompt-templates/{id}/reset"` | `POST /v1.0/api/tenants/{tenantId}/prompt-templates/{id}/reset` | `route=/v1.0/api/tenants/{tenantId}/prompt-templates/{id}/reset` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/prompt-templates/{id}/restore/{version}` | `route="/v1.0/api/tenants/{tenantId}/prompt-templates/{id}/restore/{version}"` | `POST /v1.0/api/tenants/{tenantId}/prompt-templates/{id}/restore/{version}` | `route=/v1.0/api/tenants/{tenantId}/prompt-templates/{id}/restore/{version}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/prompt-templates/{id}/versions` | `route="/v1.0/api/tenants/{tenantId}/prompt-templates/{id}/versions"` | `GET /v1.0/api/tenants/{tenantId}/prompt-templates/{id}/versions` | `route=/v1.0/api/tenants/{tenantId}/prompt-templates/{id}/versions` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/prompt-templates/{id}/versions/{version}` | `route="/v1.0/api/tenants/{tenantId}/prompt-templates/{id}/versions/{version}"` | `GET /v1.0/api/tenants/{tenantId}/prompt-templates/{id}/versions/{version}` | `route=/v1.0/api/tenants/{tenantId}/prompt-templates/{id}/versions/{version}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/queue/summary` | `route="/v1.0/api/tenants/{tenantId}/queue/summary"` | `GET /v1.0/api/tenants/{tenantId}/queue/summary` | `route=/v1.0/api/tenants/{tenantId}/queue/summary` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/role-permissions` | `route="/v1.0/api/tenants/{tenantId}/role-permissions"` | `GET /v1.0/api/tenants/{tenantId}/role-permissions` | `route=/v1.0/api/tenants/{tenantId}/role-permissions` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/role-permissions` | `route="/v1.0/api/tenants/{tenantId}/role-permissions"` | `POST /v1.0/api/tenants/{tenantId}/role-permissions` | `route=/v1.0/api/tenants/{tenantId}/role-permissions` | garrison-http |
| DELETE | `/v1.0/api/tenants/{tenantId}/role-permissions/{id}` | `route="/v1.0/api/tenants/{tenantId}/role-permissions/{id}"` | `DELETE /v1.0/api/tenants/{tenantId}/role-permissions/{id}` | `route=/v1.0/api/tenants/{tenantId}/role-permissions/{id}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/roles` | `route="/v1.0/api/tenants/{tenantId}/roles"` | `GET /v1.0/api/tenants/{tenantId}/roles` | `route=/v1.0/api/tenants/{tenantId}/roles` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/roles` | `route="/v1.0/api/tenants/{tenantId}/roles"` | `POST /v1.0/api/tenants/{tenantId}/roles` | `route=/v1.0/api/tenants/{tenantId}/roles` | garrison-http |
| DELETE | `/v1.0/api/tenants/{tenantId}/roles/{id}` | `route="/v1.0/api/tenants/{tenantId}/roles/{id}"` | `DELETE /v1.0/api/tenants/{tenantId}/roles/{id}` | `route=/v1.0/api/tenants/{tenantId}/roles/{id}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/roles/{id}` | `route="/v1.0/api/tenants/{tenantId}/roles/{id}"` | `GET /v1.0/api/tenants/{tenantId}/roles/{id}` | `route=/v1.0/api/tenants/{tenantId}/roles/{id}` | garrison-http |
| PUT | `/v1.0/api/tenants/{tenantId}/roles/{id}` | `route="/v1.0/api/tenants/{tenantId}/roles/{id}"` | `PUT /v1.0/api/tenants/{tenantId}/roles/{id}` | `route=/v1.0/api/tenants/{tenantId}/roles/{id}` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/roles/{id}/clone` | `route="/v1.0/api/tenants/{tenantId}/roles/{id}/clone"` | `POST /v1.0/api/tenants/{tenantId}/roles/{id}/clone` | `route=/v1.0/api/tenants/{tenantId}/roles/{id}/clone` | garrison-http |
| DELETE | `/v1.0/api/tenants/{tenantId}/runs` | `route="/v1.0/api/tenants/{tenantId}/runs"` | `DELETE /v1.0/api/tenants/{tenantId}/runs` | `route=/v1.0/api/tenants/{tenantId}/runs` | garrison-http, garrison-runs |
| GET | `/v1.0/api/tenants/{tenantId}/runs` | `route="/v1.0/api/tenants/{tenantId}/runs"` | `GET /v1.0/api/tenants/{tenantId}/runs` | `route=/v1.0/api/tenants/{tenantId}/runs` | garrison-http, garrison-runs |
| POST | `/v1.0/api/tenants/{tenantId}/runs` | `route="/v1.0/api/tenants/{tenantId}/runs"` | `POST /v1.0/api/tenants/{tenantId}/runs` | `route=/v1.0/api/tenants/{tenantId}/runs` | garrison-http, garrison-runs |
| DELETE | `/v1.0/api/tenants/{tenantId}/runs/{id}` | `route="/v1.0/api/tenants/{tenantId}/runs/{id}"` | `DELETE /v1.0/api/tenants/{tenantId}/runs/{id}` | `route=/v1.0/api/tenants/{tenantId}/runs/{id}` | garrison-http, garrison-runs |
| GET | `/v1.0/api/tenants/{tenantId}/runs/{id}` | `route="/v1.0/api/tenants/{tenantId}/runs/{id}"` | `GET /v1.0/api/tenants/{tenantId}/runs/{id}` | `route=/v1.0/api/tenants/{tenantId}/runs/{id}` | garrison-http, garrison-runs |
| POST | `/v1.0/api/tenants/{tenantId}/runs/{id}/cancel` | `route="/v1.0/api/tenants/{tenantId}/runs/{id}/cancel"` | `POST /v1.0/api/tenants/{tenantId}/runs/{id}/cancel` | `route=/v1.0/api/tenants/{tenantId}/runs/{id}/cancel` | garrison-http, garrison-runs |
| GET | `/v1.0/api/tenants/{tenantId}/runs/{id}/children` | `route="/v1.0/api/tenants/{tenantId}/runs/{id}/children"` | `GET /v1.0/api/tenants/{tenantId}/runs/{id}/children` | `route=/v1.0/api/tenants/{tenantId}/runs/{id}/children` | garrison-http, garrison-runs |
| GET | `/v1.0/api/tenants/{tenantId}/runs/{id}/database-usage` | `route="/v1.0/api/tenants/{tenantId}/runs/{id}/database-usage"` | `GET /v1.0/api/tenants/{tenantId}/runs/{id}/database-usage` | `route=/v1.0/api/tenants/{tenantId}/runs/{id}/database-usage` | garrison-http, garrison-runs |
| GET | `/v1.0/api/tenants/{tenantId}/runs/{id}/events` | `route="/v1.0/api/tenants/{tenantId}/runs/{id}/events"` | `GET /v1.0/api/tenants/{tenantId}/runs/{id}/events` | `route=/v1.0/api/tenants/{tenantId}/runs/{id}/events` | garrison-http, garrison-runs |
| GET | `/v1.0/api/tenants/{tenantId}/runs/{id}/events/stream` | `route="/v1.0/api/tenants/{tenantId}/runs/{id}/events/stream"` | `GET /v1.0/api/tenants/{tenantId}/runs/{id}/events/stream` | `route=/v1.0/api/tenants/{tenantId}/runs/{id}/events/stream` | garrison-http, garrison-runs |
| GET | `/v1.0/api/tenants/{tenantId}/runs/{id}/fan-out-groups` | `route="/v1.0/api/tenants/{tenantId}/runs/{id}/fan-out-groups"` | `GET /v1.0/api/tenants/{tenantId}/runs/{id}/fan-out-groups` | `route=/v1.0/api/tenants/{tenantId}/runs/{id}/fan-out-groups` | garrison-http, garrison-runs |
| DELETE | `/v1.0/api/tenants/{tenantId}/runs/{id}/files` | `route="/v1.0/api/tenants/{tenantId}/runs/{id}/files"` | `DELETE /v1.0/api/tenants/{tenantId}/runs/{id}/files` | `route=/v1.0/api/tenants/{tenantId}/runs/{id}/files` | garrison-http, garrison-runs |
| GET | `/v1.0/api/tenants/{tenantId}/runs/{id}/files` | `route="/v1.0/api/tenants/{tenantId}/runs/{id}/files"` | `GET /v1.0/api/tenants/{tenantId}/runs/{id}/files` | `route=/v1.0/api/tenants/{tenantId}/runs/{id}/files` | garrison-http, garrison-runs |
| POST | `/v1.0/api/tenants/{tenantId}/runs/{id}/files` | `route="/v1.0/api/tenants/{tenantId}/runs/{id}/files"` | `POST /v1.0/api/tenants/{tenantId}/runs/{id}/files` | `route=/v1.0/api/tenants/{tenantId}/runs/{id}/files` | garrison-http, garrison-runs |
| GET | `/v1.0/api/tenants/{tenantId}/runs/{id}/files/content` | `route="/v1.0/api/tenants/{tenantId}/runs/{id}/files/content"` | `GET /v1.0/api/tenants/{tenantId}/runs/{id}/files/content` | `route=/v1.0/api/tenants/{tenantId}/runs/{id}/files/content` | garrison-http, garrison-runs |
| POST | `/v1.0/api/tenants/{tenantId}/runs/{id}/files/download-url` | `route="/v1.0/api/tenants/{tenantId}/runs/{id}/files/download-url"` | `POST /v1.0/api/tenants/{tenantId}/runs/{id}/files/download-url` | `route=/v1.0/api/tenants/{tenantId}/runs/{id}/files/download-url` | garrison-http, garrison-runs |
| GET | `/v1.0/api/tenants/{tenantId}/runs/{id}/files/versions` | `route="/v1.0/api/tenants/{tenantId}/runs/{id}/files/versions"` | `GET /v1.0/api/tenants/{tenantId}/runs/{id}/files/versions` | `route=/v1.0/api/tenants/{tenantId}/runs/{id}/files/versions` | garrison-http, garrison-runs |
| GET | `/v1.0/api/tenants/{tenantId}/runs/{id}/operations` | `route="/v1.0/api/tenants/{tenantId}/runs/{id}/operations"` | `GET /v1.0/api/tenants/{tenantId}/runs/{id}/operations` | `route=/v1.0/api/tenants/{tenantId}/runs/{id}/operations` | garrison-http, garrison-runs |
| GET | `/v1.0/api/tenants/{tenantId}/runs/{id}/placement` | `route="/v1.0/api/tenants/{tenantId}/runs/{id}/placement"` | `GET /v1.0/api/tenants/{tenantId}/runs/{id}/placement` | `route=/v1.0/api/tenants/{tenantId}/runs/{id}/placement` | garrison-http, garrison-runs |
| POST | `/v1.0/api/tenants/{tenantId}/runs/{id}/retry` | `route="/v1.0/api/tenants/{tenantId}/runs/{id}/retry"` | `POST /v1.0/api/tenants/{tenantId}/runs/{id}/retry` | `route=/v1.0/api/tenants/{tenantId}/runs/{id}/retry` | garrison-http, garrison-runs |
| GET | `/v1.0/api/tenants/{tenantId}/runs/{id}/transcript` | `route="/v1.0/api/tenants/{tenantId}/runs/{id}/transcript"` | `GET /v1.0/api/tenants/{tenantId}/runs/{id}/transcript` | `route=/v1.0/api/tenants/{tenantId}/runs/{id}/transcript` | garrison-http, garrison-runs |
| GET | `/v1.0/api/tenants/{tenantId}/runs/{runId}/artifacts` | `route="/v1.0/api/tenants/{tenantId}/runs/{runId}/artifacts"` | `GET /v1.0/api/tenants/{tenantId}/runs/{runId}/artifacts` | `route=/v1.0/api/tenants/{tenantId}/runs/{runId}/artifacts` | garrison-http, garrison-runs |
| POST | `/v1.0/api/tenants/{tenantId}/runs/{runId}/artifacts` | `route="/v1.0/api/tenants/{tenantId}/runs/{runId}/artifacts"` | `POST /v1.0/api/tenants/{tenantId}/runs/{runId}/artifacts` | `route=/v1.0/api/tenants/{tenantId}/runs/{runId}/artifacts` | garrison-http, garrison-runs |
| GET | `/v1.0/api/tenants/{tenantId}/secrets` | `route="/v1.0/api/tenants/{tenantId}/secrets"` | `GET /v1.0/api/tenants/{tenantId}/secrets` | `route=/v1.0/api/tenants/{tenantId}/secrets` | garrison-http, garrison-security |
| POST | `/v1.0/api/tenants/{tenantId}/secrets` | `route="/v1.0/api/tenants/{tenantId}/secrets"` | `POST /v1.0/api/tenants/{tenantId}/secrets` | `route=/v1.0/api/tenants/{tenantId}/secrets` | garrison-http, garrison-security |
| DELETE | `/v1.0/api/tenants/{tenantId}/secrets/{id}` | `route="/v1.0/api/tenants/{tenantId}/secrets/{id}"` | `DELETE /v1.0/api/tenants/{tenantId}/secrets/{id}` | `route=/v1.0/api/tenants/{tenantId}/secrets/{id}` | garrison-http, garrison-security |
| GET | `/v1.0/api/tenants/{tenantId}/secrets/{id}` | `route="/v1.0/api/tenants/{tenantId}/secrets/{id}"` | `GET /v1.0/api/tenants/{tenantId}/secrets/{id}` | `route=/v1.0/api/tenants/{tenantId}/secrets/{id}` | garrison-http, garrison-security |
| PUT | `/v1.0/api/tenants/{tenantId}/secrets/{id}` | `route="/v1.0/api/tenants/{tenantId}/secrets/{id}"` | `PUT /v1.0/api/tenants/{tenantId}/secrets/{id}` | `route=/v1.0/api/tenants/{tenantId}/secrets/{id}` | garrison-http, garrison-security |
| POST | `/v1.0/api/tenants/{tenantId}/secrets/{id}/rotate` | `route="/v1.0/api/tenants/{tenantId}/secrets/{id}/rotate"` | `POST /v1.0/api/tenants/{tenantId}/secrets/{id}/rotate` | `route=/v1.0/api/tenants/{tenantId}/secrets/{id}/rotate` | garrison-http, garrison-security |
| PUT | `/v1.0/api/tenants/{tenantId}/secrets/{id}/value` | `route="/v1.0/api/tenants/{tenantId}/secrets/{id}/value"` | `PUT /v1.0/api/tenants/{tenantId}/secrets/{id}/value` | `route=/v1.0/api/tenants/{tenantId}/secrets/{id}/value` | garrison-http, garrison-security |
| GET | `/v1.0/api/tenants/{tenantId}/studio/architect-prompts` | `route="/v1.0/api/tenants/{tenantId}/studio/architect-prompts"` | `GET /v1.0/api/tenants/{tenantId}/studio/architect-prompts` | `route=/v1.0/api/tenants/{tenantId}/studio/architect-prompts` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/studio/architects` | `route="/v1.0/api/tenants/{tenantId}/studio/architects"` | `GET /v1.0/api/tenants/{tenantId}/studio/architects` | `route=/v1.0/api/tenants/{tenantId}/studio/architects` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/studio/architects` | `route="/v1.0/api/tenants/{tenantId}/studio/architects"` | `POST /v1.0/api/tenants/{tenantId}/studio/architects` | `route=/v1.0/api/tenants/{tenantId}/studio/architects` | garrison-http |
| DELETE | `/v1.0/api/tenants/{tenantId}/studio/architects/{deploymentId}` | `route="/v1.0/api/tenants/{tenantId}/studio/architects/{deploymentId}"` | `DELETE /v1.0/api/tenants/{tenantId}/studio/architects/{deploymentId}` | `route=/v1.0/api/tenants/{tenantId}/studio/architects/{deploymentId}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/studio/architects/{deploymentId}` | `route="/v1.0/api/tenants/{tenantId}/studio/architects/{deploymentId}"` | `GET /v1.0/api/tenants/{tenantId}/studio/architects/{deploymentId}` | `route=/v1.0/api/tenants/{tenantId}/studio/architects/{deploymentId}` | garrison-http |
| PUT | `/v1.0/api/tenants/{tenantId}/studio/architects/{deploymentId}` | `route="/v1.0/api/tenants/{tenantId}/studio/architects/{deploymentId}"` | `PUT /v1.0/api/tenants/{tenantId}/studio/architects/{deploymentId}` | `route=/v1.0/api/tenants/{tenantId}/studio/architects/{deploymentId}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/studio/architects/{deploymentId}/prompt` | `route="/v1.0/api/tenants/{tenantId}/studio/architects/{deploymentId}/prompt"` | `GET /v1.0/api/tenants/{tenantId}/studio/architects/{deploymentId}/prompt` | `route=/v1.0/api/tenants/{tenantId}/studio/architects/{deploymentId}/prompt` | garrison-http |
| PUT | `/v1.0/api/tenants/{tenantId}/studio/architects/{deploymentId}/prompt` | `route="/v1.0/api/tenants/{tenantId}/studio/architects/{deploymentId}/prompt"` | `PUT /v1.0/api/tenants/{tenantId}/studio/architects/{deploymentId}/prompt` | `route=/v1.0/api/tenants/{tenantId}/studio/architects/{deploymentId}/prompt` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/studio/drafts` | `route="/v1.0/api/tenants/{tenantId}/studio/drafts"` | `GET /v1.0/api/tenants/{tenantId}/studio/drafts` | `route=/v1.0/api/tenants/{tenantId}/studio/drafts` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/studio/drafts` | `route="/v1.0/api/tenants/{tenantId}/studio/drafts"` | `POST /v1.0/api/tenants/{tenantId}/studio/drafts` | `route=/v1.0/api/tenants/{tenantId}/studio/drafts` | garrison-http |
| DELETE | `/v1.0/api/tenants/{tenantId}/studio/drafts/{id}` | `route="/v1.0/api/tenants/{tenantId}/studio/drafts/{id}"` | `DELETE /v1.0/api/tenants/{tenantId}/studio/drafts/{id}` | `route=/v1.0/api/tenants/{tenantId}/studio/drafts/{id}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/studio/drafts/{id}` | `route="/v1.0/api/tenants/{tenantId}/studio/drafts/{id}"` | `GET /v1.0/api/tenants/{tenantId}/studio/drafts/{id}` | `route=/v1.0/api/tenants/{tenantId}/studio/drafts/{id}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/studio/drafts/{id}/diff` | `route="/v1.0/api/tenants/{tenantId}/studio/drafts/{id}/diff"` | `GET /v1.0/api/tenants/{tenantId}/studio/drafts/{id}/diff` | `route=/v1.0/api/tenants/{tenantId}/studio/drafts/{id}/diff` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/studio/drafts/{id}/graph` | `route="/v1.0/api/tenants/{tenantId}/studio/drafts/{id}/graph"` | `GET /v1.0/api/tenants/{tenantId}/studio/drafts/{id}/graph` | `route=/v1.0/api/tenants/{tenantId}/studio/drafts/{id}/graph` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/studio/drafts/{id}/graph-operations` | `route="/v1.0/api/tenants/{tenantId}/studio/drafts/{id}/graph-operations"` | `POST /v1.0/api/tenants/{tenantId}/studio/drafts/{id}/graph-operations` | `route=/v1.0/api/tenants/{tenantId}/studio/drafts/{id}/graph-operations` | garrison-http |
| DELETE | `/v1.0/api/tenants/{tenantId}/studio/drafts/{id}/items/{kind}/{name}` | `route="/v1.0/api/tenants/{tenantId}/studio/drafts/{id}/items/{kind}/{name}"` | `DELETE /v1.0/api/tenants/{tenantId}/studio/drafts/{id}/items/{kind}/{name}` | `route=/v1.0/api/tenants/{tenantId}/studio/drafts/{id}/items/{kind}/{name}` | garrison-http |
| PUT | `/v1.0/api/tenants/{tenantId}/studio/drafts/{id}/items/{kind}/{name}` | `route="/v1.0/api/tenants/{tenantId}/studio/drafts/{id}/items/{kind}/{name}"` | `PUT /v1.0/api/tenants/{tenantId}/studio/drafts/{id}/items/{kind}/{name}` | `route=/v1.0/api/tenants/{tenantId}/studio/drafts/{id}/items/{kind}/{name}` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/studio/drafts/{id}/playground/invoke` | `route="/v1.0/api/tenants/{tenantId}/studio/drafts/{id}/playground/invoke"` | `POST /v1.0/api/tenants/{tenantId}/studio/drafts/{id}/playground/invoke` | `route=/v1.0/api/tenants/{tenantId}/studio/drafts/{id}/playground/invoke` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/studio/drafts/{id}/request-apply` | `route="/v1.0/api/tenants/{tenantId}/studio/drafts/{id}/request-apply"` | `POST /v1.0/api/tenants/{tenantId}/studio/drafts/{id}/request-apply` | `route=/v1.0/api/tenants/{tenantId}/studio/drafts/{id}/request-apply` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/studio/drafts/{id}/validate` | `route="/v1.0/api/tenants/{tenantId}/studio/drafts/{id}/validate"` | `POST /v1.0/api/tenants/{tenantId}/studio/drafts/{id}/validate` | `route=/v1.0/api/tenants/{tenantId}/studio/drafts/{id}/validate` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/triggers` | `route="/v1.0/api/tenants/{tenantId}/triggers"` | `GET /v1.0/api/tenants/{tenantId}/triggers` | `route=/v1.0/api/tenants/{tenantId}/triggers` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/triggers` | `route="/v1.0/api/tenants/{tenantId}/triggers"` | `POST /v1.0/api/tenants/{tenantId}/triggers` | `route=/v1.0/api/tenants/{tenantId}/triggers` | garrison-http |
| DELETE | `/v1.0/api/tenants/{tenantId}/triggers/{id}` | `route="/v1.0/api/tenants/{tenantId}/triggers/{id}"` | `DELETE /v1.0/api/tenants/{tenantId}/triggers/{id}` | `route=/v1.0/api/tenants/{tenantId}/triggers/{id}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/triggers/{id}` | `route="/v1.0/api/tenants/{tenantId}/triggers/{id}"` | `GET /v1.0/api/tenants/{tenantId}/triggers/{id}` | `route=/v1.0/api/tenants/{tenantId}/triggers/{id}` | garrison-http |
| PUT | `/v1.0/api/tenants/{tenantId}/triggers/{id}` | `route="/v1.0/api/tenants/{tenantId}/triggers/{id}"` | `PUT /v1.0/api/tenants/{tenantId}/triggers/{id}` | `route=/v1.0/api/tenants/{tenantId}/triggers/{id}` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/triggers/{id}/fire` | `route="/v1.0/api/tenants/{tenantId}/triggers/{id}/fire"` | `POST /v1.0/api/tenants/{tenantId}/triggers/{id}/fire` | `route=/v1.0/api/tenants/{tenantId}/triggers/{id}/fire` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/triggers/{id}/fires` | `route="/v1.0/api/tenants/{tenantId}/triggers/{id}/fires"` | `GET /v1.0/api/tenants/{tenantId}/triggers/{id}/fires` | `route=/v1.0/api/tenants/{tenantId}/triggers/{id}/fires` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/triggers/{id}/rotate-secret` | `route="/v1.0/api/tenants/{tenantId}/triggers/{id}/rotate-secret"` | `POST /v1.0/api/tenants/{tenantId}/triggers/{id}/rotate-secret` | `route=/v1.0/api/tenants/{tenantId}/triggers/{id}/rotate-secret` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/triggers/{id}/webhook` | `route="/v1.0/api/tenants/{tenantId}/triggers/{id}/webhook"` | `POST /v1.0/api/tenants/{tenantId}/triggers/{id}/webhook` | `route=/v1.0/api/tenants/{tenantId}/triggers/{id}/webhook` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/usage-quotas` | `route="/v1.0/api/tenants/{tenantId}/usage-quotas"` | `GET /v1.0/api/tenants/{tenantId}/usage-quotas` | `route=/v1.0/api/tenants/{tenantId}/usage-quotas` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/usage-quotas` | `route="/v1.0/api/tenants/{tenantId}/usage-quotas"` | `POST /v1.0/api/tenants/{tenantId}/usage-quotas` | `route=/v1.0/api/tenants/{tenantId}/usage-quotas` | garrison-http |
| DELETE | `/v1.0/api/tenants/{tenantId}/usage-quotas/{id}` | `route="/v1.0/api/tenants/{tenantId}/usage-quotas/{id}"` | `DELETE /v1.0/api/tenants/{tenantId}/usage-quotas/{id}` | `route=/v1.0/api/tenants/{tenantId}/usage-quotas/{id}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/usage-quotas/{id}` | `route="/v1.0/api/tenants/{tenantId}/usage-quotas/{id}"` | `GET /v1.0/api/tenants/{tenantId}/usage-quotas/{id}` | `route=/v1.0/api/tenants/{tenantId}/usage-quotas/{id}` | garrison-http |
| PUT | `/v1.0/api/tenants/{tenantId}/usage-quotas/{id}` | `route="/v1.0/api/tenants/{tenantId}/usage-quotas/{id}"` | `PUT /v1.0/api/tenants/{tenantId}/usage-quotas/{id}` | `route=/v1.0/api/tenants/{tenantId}/usage-quotas/{id}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/usage-quotas/{id}/usage` | `route="/v1.0/api/tenants/{tenantId}/usage-quotas/{id}/usage"` | `GET /v1.0/api/tenants/{tenantId}/usage-quotas/{id}/usage` | `route=/v1.0/api/tenants/{tenantId}/usage-quotas/{id}/usage` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/user-role-assignments` | `route="/v1.0/api/tenants/{tenantId}/user-role-assignments"` | `GET /v1.0/api/tenants/{tenantId}/user-role-assignments` | `route=/v1.0/api/tenants/{tenantId}/user-role-assignments` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/user-role-assignments` | `route="/v1.0/api/tenants/{tenantId}/user-role-assignments"` | `POST /v1.0/api/tenants/{tenantId}/user-role-assignments` | `route=/v1.0/api/tenants/{tenantId}/user-role-assignments` | garrison-http |
| DELETE | `/v1.0/api/tenants/{tenantId}/user-role-assignments/{id}` | `route="/v1.0/api/tenants/{tenantId}/user-role-assignments/{id}"` | `DELETE /v1.0/api/tenants/{tenantId}/user-role-assignments/{id}` | `route=/v1.0/api/tenants/{tenantId}/user-role-assignments/{id}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/user-role-assignments/{id}` | `route="/v1.0/api/tenants/{tenantId}/user-role-assignments/{id}"` | `GET /v1.0/api/tenants/{tenantId}/user-role-assignments/{id}` | `route=/v1.0/api/tenants/{tenantId}/user-role-assignments/{id}` | garrison-http |
| PUT | `/v1.0/api/tenants/{tenantId}/user-role-assignments/{id}` | `route="/v1.0/api/tenants/{tenantId}/user-role-assignments/{id}"` | `PUT /v1.0/api/tenants/{tenantId}/user-role-assignments/{id}` | `route=/v1.0/api/tenants/{tenantId}/user-role-assignments/{id}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/users` | `route="/v1.0/api/tenants/{tenantId}/users"` | `GET /v1.0/api/tenants/{tenantId}/users` | `route=/v1.0/api/tenants/{tenantId}/users` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/users` | `route="/v1.0/api/tenants/{tenantId}/users"` | `POST /v1.0/api/tenants/{tenantId}/users` | `route=/v1.0/api/tenants/{tenantId}/users` | garrison-http |
| DELETE | `/v1.0/api/tenants/{tenantId}/users/{id}` | `route="/v1.0/api/tenants/{tenantId}/users/{id}"` | `DELETE /v1.0/api/tenants/{tenantId}/users/{id}` | `route=/v1.0/api/tenants/{tenantId}/users/{id}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/users/{id}` | `route="/v1.0/api/tenants/{tenantId}/users/{id}"` | `GET /v1.0/api/tenants/{tenantId}/users/{id}` | `route=/v1.0/api/tenants/{tenantId}/users/{id}` | garrison-http |
| PUT | `/v1.0/api/tenants/{tenantId}/users/{id}` | `route="/v1.0/api/tenants/{tenantId}/users/{id}"` | `PUT /v1.0/api/tenants/{tenantId}/users/{id}` | `route=/v1.0/api/tenants/{tenantId}/users/{id}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/users/{id}/permissions` | `route="/v1.0/api/tenants/{tenantId}/users/{id}/permissions"` | `GET /v1.0/api/tenants/{tenantId}/users/{id}/permissions` | `route=/v1.0/api/tenants/{tenantId}/users/{id}/permissions` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/workspace-templates` | `route="/v1.0/api/tenants/{tenantId}/workspace-templates"` | `GET /v1.0/api/tenants/{tenantId}/workspace-templates` | `route=/v1.0/api/tenants/{tenantId}/workspace-templates` | garrison-http |
| POST | `/v1.0/api/tenants/{tenantId}/workspace-templates` | `route="/v1.0/api/tenants/{tenantId}/workspace-templates"` | `POST /v1.0/api/tenants/{tenantId}/workspace-templates` | `route=/v1.0/api/tenants/{tenantId}/workspace-templates` | garrison-http |
| DELETE | `/v1.0/api/tenants/{tenantId}/workspace-templates/{id}` | `route="/v1.0/api/tenants/{tenantId}/workspace-templates/{id}"` | `DELETE /v1.0/api/tenants/{tenantId}/workspace-templates/{id}` | `route=/v1.0/api/tenants/{tenantId}/workspace-templates/{id}` | garrison-http |
| GET | `/v1.0/api/tenants/{tenantId}/workspace-templates/{id}` | `route="/v1.0/api/tenants/{tenantId}/workspace-templates/{id}"` | `GET /v1.0/api/tenants/{tenantId}/workspace-templates/{id}` | `route=/v1.0/api/tenants/{tenantId}/workspace-templates/{id}` | garrison-http |
| PUT | `/v1.0/api/tenants/{tenantId}/workspace-templates/{id}` | `route="/v1.0/api/tenants/{tenantId}/workspace-templates/{id}"` | `PUT /v1.0/api/tenants/{tenantId}/workspace-templates/{id}` | `route=/v1.0/api/tenants/{tenantId}/workspace-templates/{id}` | garrison-http |
| GET | `/v1.0/apps/{slug}` | `route="/v1.0/apps/{slug}"` | `GET /v1.0/apps/{slug}` | `route=/v1.0/apps/{slug}` | garrison-http |
| GET | `/v1.0/apps/{slug}/conversations` | `route="/v1.0/apps/{slug}/conversations"` | `GET /v1.0/apps/{slug}/conversations` | `route=/v1.0/apps/{slug}/conversations` | garrison-http |
| POST | `/v1.0/apps/{slug}/conversations` | `route="/v1.0/apps/{slug}/conversations"` | `POST /v1.0/apps/{slug}/conversations` | `route=/v1.0/apps/{slug}/conversations` | garrison-http |
| GET | `/v1.0/apps/{slug}/conversations/{id}` | `route="/v1.0/apps/{slug}/conversations/{id}"` | `GET /v1.0/apps/{slug}/conversations/{id}` | `route=/v1.0/apps/{slug}/conversations/{id}` | garrison-http |
| GET | `/v1.0/apps/{slug}/conversations/{id}/files` | `route="/v1.0/apps/{slug}/conversations/{id}/files"` | `GET /v1.0/apps/{slug}/conversations/{id}/files` | `route=/v1.0/apps/{slug}/conversations/{id}/files` | garrison-http |
| GET | `/v1.0/apps/{slug}/conversations/{id}/files/content` | `route="/v1.0/apps/{slug}/conversations/{id}/files/content"` | `GET /v1.0/apps/{slug}/conversations/{id}/files/content` | `route=/v1.0/apps/{slug}/conversations/{id}/files/content` | garrison-http |
| POST | `/v1.0/apps/{slug}/conversations/{id}/files/download-url` | `route="/v1.0/apps/{slug}/conversations/{id}/files/download-url"` | `POST /v1.0/apps/{slug}/conversations/{id}/files/download-url` | `route=/v1.0/apps/{slug}/conversations/{id}/files/download-url` | garrison-http |
| GET | `/v1.0/apps/{slug}/conversations/{id}/files/stream` | `route="/v1.0/apps/{slug}/conversations/{id}/files/stream"` | `GET /v1.0/apps/{slug}/conversations/{id}/files/stream` | `route=/v1.0/apps/{slug}/conversations/{id}/files/stream` | garrison-http |
| GET | `/v1.0/apps/{slug}/conversations/{id}/files/versions` | `route="/v1.0/apps/{slug}/conversations/{id}/files/versions"` | `GET /v1.0/apps/{slug}/conversations/{id}/files/versions` | `route=/v1.0/apps/{slug}/conversations/{id}/files/versions` | garrison-http |
| POST | `/v1.0/apps/{slug}/conversations/{id}/messages` | `route="/v1.0/apps/{slug}/conversations/{id}/messages"` | `POST /v1.0/apps/{slug}/conversations/{id}/messages` | `route=/v1.0/apps/{slug}/conversations/{id}/messages` | garrison-http |
| GET | `/v1.0/apps/{slug}/conversations/{id}/turns/{runId}/stream` | `route="/v1.0/apps/{slug}/conversations/{id}/turns/{runId}/stream"` | `GET /v1.0/apps/{slug}/conversations/{id}/turns/{runId}/stream` | `route=/v1.0/apps/{slug}/conversations/{id}/turns/{runId}/stream` | garrison-http |
| GET | `/v1.0/apps/{slug}/logo` | `route="/v1.0/apps/{slug}/logo"` | `GET /v1.0/apps/{slug}/logo` | `route=/v1.0/apps/{slug}/logo` | garrison-http |
| DELETE | `/v1.0/apps/{slug}/session` | `route="/v1.0/apps/{slug}/session"` | `DELETE /v1.0/apps/{slug}/session` | `route=/v1.0/apps/{slug}/session` | garrison-http |
| POST | `/v1.0/apps/{slug}/session` | `route="/v1.0/apps/{slug}/session"` | `POST /v1.0/apps/{slug}/session` | `route=/v1.0/apps/{slug}/session` | garrison-http |
| GET | `/v1.0/artifact-download/{id}` | `route="/v1.0/artifact-download/{id}"` | `GET /v1.0/artifact-download/{id}` | `route=/v1.0/artifact-download/{id}` | garrison-http |
| GET | `/v1.0/asset-download/{assetId}` | `route="/v1.0/asset-download/{assetId}"` | `GET /v1.0/asset-download/{assetId}` | `route=/v1.0/asset-download/{assetId}` | garrison-http |
| GET | `/v1.0/file-download/{fileSpaceId}` | `route="/v1.0/file-download/{fileSpaceId}"` | `GET /v1.0/file-download/{fileSpaceId}` | `route=/v1.0/file-download/{fileSpaceId}` | garrison-http |
| DELETE | `/v1.0/token` | `route="/v1.0/token"` | `DELETE /v1.0/token` | `route=/v1.0/token` | garrison-http, garrison-security |
| GET | `/v1.0/token` | `route="/v1.0/token"` | `GET /v1.0/token` | `route=/v1.0/token` | garrison-http, garrison-security |
| POST | `/v1.0/token` | `route="/v1.0/token"` | `POST /v1.0/token` | `route=/v1.0/token` | garrison-http, garrison-security |
| GET | `/v1.0/token/details` | `route="/v1.0/token/details"` | `GET /v1.0/token/details` | `route=/v1.0/token/details` | garrison-http, garrison-security |
| POST | `/v1.0/token/refresh` | `route="/v1.0/token/refresh"` | `POST /v1.0/token/refresh` | `route=/v1.0/token/refresh` | garrison-http, garrison-security |
| GET | `/v1.0/ws` | `route="/v1.0/ws"` | `GET /v1.0/ws` | `route=/v1.0/ws` | garrison-http |
<!-- /telemetry-coverage:routes -->

Routes outside the registrar: the WebSocket endpoint `/v1.0/ws` (WebSocket metrics, `[LiveUpdates]` lines, panel garrison-protocols), `GET /metrics` (not recorded, to keep scrapes out of request metrics), CORS preflight `OPTIONS` (Watson metrics), and the MCP endpoint on port 8701 (see MCP sessions above).

### MCP tools

<!-- telemetry-coverage:mcp-tools -->
| Tool | Metric series | Span | Log | Panels |
|---|---|---|---|---|
| `garrison_apply_manifest` | `tool="garrison_apply_manifest"` | `mcp garrison_apply_manifest` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_cancel_fan_out` | `tool="garrison_cancel_fan_out"` | `mcp garrison_cancel_fan_out` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_cancel_pipeline_run` | `tool="garrison_cancel_pipeline_run"` | `mcp garrison_cancel_pipeline_run` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_cancel_run` | `tool="garrison_cancel_run"` | `mcp garrison_cancel_run` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_clone_prompt_template` | `tool="garrison_clone_prompt_template"` | `mcp garrison_clone_prompt_template` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_create_agent` | `tool="garrison_create_agent"` | `mcp garrison_create_agent` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_create_agent_asset` | `tool="garrison_create_agent_asset"` | `mcp garrison_create_agent_asset` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_create_app` | `tool="garrison_create_app"` | `mcp garrison_create_app` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_create_deployment` | `tool="garrison_create_deployment"` | `mcp garrison_create_deployment` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_create_notification_endpoint` | `tool="garrison_create_notification_endpoint"` | `mcp garrison_create_notification_endpoint` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_create_pipeline` | `tool="garrison_create_pipeline"` | `mcp garrison_create_pipeline` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_create_trigger` | `tool="garrison_create_trigger"` | `mcp garrison_create_trigger` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_decide_approval` | `tool="garrison_decide_approval"` | `mcp garrison_decide_approval` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_decide_pipeline_review` | `tool="garrison_decide_pipeline_review"` | `mcp garrison_decide_pipeline_review` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_delete_agent` | `tool="garrison_delete_agent"` | `mcp garrison_delete_agent` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_delete_agent_asset` | `tool="garrison_delete_agent_asset"` | `mcp garrison_delete_agent_asset` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_delete_deployment` | `tool="garrison_delete_deployment"` | `mcp garrison_delete_deployment` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_delete_notification_endpoint` | `tool="garrison_delete_notification_endpoint"` | `mcp garrison_delete_notification_endpoint` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_delete_pipeline` | `tool="garrison_delete_pipeline"` | `mcp garrison_delete_pipeline` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_delete_trigger` | `tool="garrison_delete_trigger"` | `mcp garrison_delete_trigger` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_describe_capability` | `tool="garrison_describe_capability"` | `mcp garrison_describe_capability` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_export_manifest` | `tool="garrison_export_manifest"` | `mcp garrison_export_manifest` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_fan_out` | `tool="garrison_fan_out"` | `mcp garrison_fan_out` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_files_delete` | `tool="garrison_files_delete"` | `mcp garrison_files_delete` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_files_list` | `tool="garrison_files_list"` | `mcp garrison_files_list` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_files_read` | `tool="garrison_files_read"` | `mcp garrison_files_read` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_files_write` | `tool="garrison_files_write"` | `mcp garrison_files_write` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_fire_trigger` | `tool="garrison_fire_trigger"` | `mcp garrison_fire_trigger` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_gather` | `tool="garrison_gather"` | `mcp garrison_gather` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_get_agent` | `tool="garrison_get_agent"` | `mcp garrison_get_agent` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_get_agent_asset` | `tool="garrison_get_agent_asset"` | `mcp garrison_get_agent_asset` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_get_agent_configuration` | `tool="garrison_get_agent_configuration"` | `mcp garrison_get_agent_configuration` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_get_agent_revision` | `tool="garrison_get_agent_revision"` | `mcp garrison_get_agent_revision` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_get_app` | `tool="garrison_get_app"` | `mcp garrison_get_app` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_get_approval` | `tool="garrison_get_approval"` | `mcp garrison_get_approval` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_get_conversation_transcript` | `tool="garrison_get_conversation_transcript"` | `mcp garrison_get_conversation_transcript` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_get_deployment` | `tool="garrison_get_deployment"` | `mcp garrison_get_deployment` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_get_notification_endpoint` | `tool="garrison_get_notification_endpoint"` | `mcp garrison_get_notification_endpoint` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_get_pipeline` | `tool="garrison_get_pipeline"` | `mcp garrison_get_pipeline` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_get_pipeline_run` | `tool="garrison_get_pipeline_run"` | `mcp garrison_get_pipeline_run` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_get_run` | `tool="garrison_get_run"` | `mcp garrison_get_run` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_get_run_events` | `tool="garrison_get_run_events"` | `mcp garrison_get_run_events` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_get_run_transcript` | `tool="garrison_get_run_transcript"` | `mcp garrison_get_run_transcript` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_get_trigger` | `tool="garrison_get_trigger"` | `mcp garrison_get_trigger` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_invoke_agent` | `tool="garrison_invoke_agent"` | `mcp garrison_invoke_agent` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_list_agent_assets` | `tool="garrison_list_agent_assets"` | `mcp garrison_list_agent_assets` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_list_agent_revisions` | `tool="garrison_list_agent_revisions"` | `mcp garrison_list_agent_revisions` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_list_agents` | `tool="garrison_list_agents"` | `mcp garrison_list_agents` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_list_approvals` | `tool="garrison_list_approvals"` | `mcp garrison_list_approvals` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_list_apps` | `tool="garrison_list_apps"` | `mcp garrison_list_apps` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_list_capabilities` | `tool="garrison_list_capabilities"` | `mcp garrison_list_capabilities` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_list_deployments` | `tool="garrison_list_deployments"` | `mcp garrison_list_deployments` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_list_notification_deliveries` | `tool="garrison_list_notification_deliveries"` | `mcp garrison_list_notification_deliveries` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_list_notification_endpoints` | `tool="garrison_list_notification_endpoints"` | `mcp garrison_list_notification_endpoints` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_list_pipeline_reviews` | `tool="garrison_list_pipeline_reviews"` | `mcp garrison_list_pipeline_reviews` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_list_pipeline_runs` | `tool="garrison_list_pipeline_runs"` | `mcp garrison_list_pipeline_runs` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_list_pipelines` | `tool="garrison_list_pipelines"` | `mcp garrison_list_pipelines` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_list_runs` | `tool="garrison_list_runs"` | `mcp garrison_list_runs` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_list_trigger_fires` | `tool="garrison_list_trigger_fires"` | `mcp garrison_list_trigger_fires` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_list_triggers` | `tool="garrison_list_triggers"` | `mcp garrison_list_triggers` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_memory_delete` | `tool="garrison_memory_delete"` | `mcp garrison_memory_delete` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_memory_read` | `tool="garrison_memory_read"` | `mcp garrison_memory_read` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_memory_write` | `tool="garrison_memory_write"` | `mcp garrison_memory_write` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_permission_prompt` | `tool="garrison_permission_prompt"` | `mcp garrison_permission_prompt` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_promote` | `tool="garrison_promote"` | `mcp garrison_promote` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_publish_agent_revision` | `tool="garrison_publish_agent_revision"` | `mcp garrison_publish_agent_revision` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_render_prompt_template` | `tool="garrison_render_prompt_template"` | `mcp garrison_render_prompt_template` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_reset_prompt_template` | `tool="garrison_reset_prompt_template"` | `mcp garrison_reset_prompt_template` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_rollback_promotion` | `tool="garrison_rollback_promotion"` | `mcp garrison_rollback_promotion` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_rotate_notification_endpoint_secret` | `tool="garrison_rotate_notification_endpoint_secret"` | `mcp garrison_rotate_notification_endpoint_secret` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_rotate_trigger_secret` | `tool="garrison_rotate_trigger_secret"` | `mcp garrison_rotate_trigger_secret` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_start_pipeline` | `tool="garrison_start_pipeline"` | `mcp garrison_start_pipeline` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_start_run` | `tool="garrison_start_run"` | `mcp garrison_start_run` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_studio_create_architect` | `tool="garrison_studio_create_architect"` | `mcp garrison_studio_create_architect` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_studio_create_draft` | `tool="garrison_studio_create_draft"` | `mcp garrison_studio_create_draft` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_studio_delete_architect` | `tool="garrison_studio_delete_architect"` | `mcp garrison_studio_delete_architect` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_studio_diff` | `tool="garrison_studio_diff"` | `mcp garrison_studio_diff` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_studio_get_architect` | `tool="garrison_studio_get_architect"` | `mcp garrison_studio_get_architect` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_studio_get_architect_prompt` | `tool="garrison_studio_get_architect_prompt"` | `mcp garrison_studio_get_architect_prompt` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_studio_get_draft` | `tool="garrison_studio_get_draft"` | `mcp garrison_studio_get_draft` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_studio_graph` | `tool="garrison_studio_graph"` | `mcp garrison_studio_graph` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_studio_graph_operation` | `tool="garrison_studio_graph_operation"` | `mcp garrison_studio_graph_operation` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_studio_list_architect_prompts` | `tool="garrison_studio_list_architect_prompts"` | `mcp garrison_studio_list_architect_prompts` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_studio_list_architects` | `tool="garrison_studio_list_architects"` | `mcp garrison_studio_list_architects` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_studio_list_drafts` | `tool="garrison_studio_list_drafts"` | `mcp garrison_studio_list_drafts` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_studio_playground_invoke` | `tool="garrison_studio_playground_invoke"` | `mcp garrison_studio_playground_invoke` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_studio_put_item` | `tool="garrison_studio_put_item"` | `mcp garrison_studio_put_item` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_studio_remove_item` | `tool="garrison_studio_remove_item"` | `mcp garrison_studio_remove_item` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_studio_request_apply` | `tool="garrison_studio_request_apply"` | `mcp garrison_studio_request_apply` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_studio_set_architect_prompt` | `tool="garrison_studio_set_architect_prompt"` | `mcp garrison_studio_set_architect_prompt` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_studio_update_architect` | `tool="garrison_studio_update_architect"` | `mcp garrison_studio_update_architect` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_studio_validate` | `tool="garrison_studio_validate"` | `mcp garrison_studio_validate` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_test_notification_endpoint` | `tool="garrison_test_notification_endpoint"` | `mcp garrison_test_notification_endpoint` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_update_agent` | `tool="garrison_update_agent"` | `mcp garrison_update_agent` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_update_agent_asset` | `tool="garrison_update_agent_asset"` | `mcp garrison_update_agent_asset` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_update_app` | `tool="garrison_update_app"` | `mcp garrison_update_app` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_update_deployment` | `tool="garrison_update_deployment"` | `mcp garrison_update_deployment` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_update_notification_endpoint` | `tool="garrison_update_notification_endpoint"` | `mcp garrison_update_notification_endpoint` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_update_pipeline` | `tool="garrison_update_pipeline"` | `mcp garrison_update_pipeline` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_update_prompt_template` | `tool="garrison_update_prompt_template"` | `mcp garrison_update_prompt_template` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_update_trigger` | `tool="garrison_update_trigger"` | `mcp garrison_update_trigger` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_upload_agent_asset_version` | `tool="garrison_upload_agent_asset_version"` | `mcp garrison_upload_agent_asset_version` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `garrison_upload_artifact` | `tool="garrison_upload_artifact"` | `mcp garrison_upload_artifact` | `[Mcp]` lines, `tenant=` | garrison-protocols |
| `{mcpToolName}` (agent tools, one per exposed agent) | `tool="agent"` | `mcp agent` | `[Mcp]` lines, `tenant=`, `agent=` | garrison-protocols, garrison-agents |
<!-- /telemetry-coverage:mcp-tools -->

### A2A methods

<!-- telemetry-coverage:a2a-methods -->
| Method | Metric series | Span | Log | Panels |
|---|---|---|---|---|
| `SendMessage` | `method="SendMessage"` | `a2a SendMessage` | request line `route=/v1.0/a2a/{tenantId}/{agentName}` | garrison-protocols |
| `SendStreamingMessage` | `method="SendStreamingMessage"` | `a2a SendStreamingMessage` | request line `route=/v1.0/a2a/{tenantId}/{agentName}` | garrison-protocols |
| `GetTask` | `method="GetTask"` | `a2a GetTask` | request line `route=/v1.0/a2a/{tenantId}/{agentName}` | garrison-protocols |
| `CancelTask` | `method="CancelTask"` | `a2a CancelTask` | request line `route=/v1.0/a2a/{tenantId}/{agentName}` | garrison-protocols |
| `ListTasks` | `method="ListTasks"` | `a2a ListTasks` | request line `route=/v1.0/a2a/{tenantId}/{agentName}` | garrison-protocols |
| `SubscribeToTask` | `method="SubscribeToTask"` | `a2a SubscribeToTask` | request line `route=/v1.0/a2a/{tenantId}/{agentName}` | garrison-protocols |
<!-- /telemetry-coverage:a2a-methods -->

## Verifying telemetry end to end

`k8s/tests/telemetry-verify.sh` (and `.bat`) generates traffic across every REST route group, MCP tools and sessions, A2A methods, SSE and WebSocket streams, process and KubernetesJob runs, blocked runs, and the fake harness's guard outcomes on a cluster deployed with `OBSERVABILITY=1`, then asserts through the Prometheus, Loki, and Tempo APIs that every metric in the catalog has data, that logs carry the promoted labels, and that run traces span server and worker, and finally opens every Grafana dashboard in a headless browser and fails on any panel that shows "No data" or an error. See the header of the script for its settings.

## Records in the database

| Record | Where to read it | Retention |
|---|---|---|
| Request history: method, path, status, timing, principal, and (truncated) bodies for every REST request | `GET /v1.0/api/request-history`, `GET /v1.0/api/request-history/summary` (counts per time bucket), dashboard | `RequestHistory.RetentionDays` (30) |
| Audit: authorization denials and privileged changes | `GET .../audit`, dashboard | `Audit.RetentionDays` (365) |
| Run events: lifecycle, assistant text, tool calls and results, usage, warnings, errors, the final result | `GET .../runs/{id}/events`, SSE, WebSocket | `Runs.EventRetentionDays` (14) |
| Runs, with outcome, usage, cost, served model, trace ID, exit code, stderr tail, and the template versions used | `GET .../runs` | `Runs.RetentionDays` (30) |

Request history capture can be turned off with the `RequestHistory.Enabled` cluster setting. Successful worker node protocol calls (`/v1.0/api/node/...`) are left out unless `RequestHistory.CaptureNodeProtocol` is on, because they were the largest source of database writes per run under load; failed node calls are still captured. The captured body size is limited by `RequestHistory.MaxRequestBodyBytes` and `MaxResponseBodyBytes`. The overview endpoint (`GET .../overview`) summarizes run counts, outcomes, and node state for dashboards.

## Kubernetes

The Helm chart and Kustomize base annotate the server and worker pods with `prometheus.io/scrape: "true"`, `prometheus.io/path: /metrics`, and `prometheus.io/port` set to the metrics listener: 9464 on the server and 9465 on workers. The pods bind those listeners to their pod IP (`GARRISON_PROMETHEUS_HOSTNAME` and `GARRISON_WORKER_PROMETHEUS_HOSTNAME` from `status.podIP`), so a Prometheus that honors the annotations and scrapes pod IPs finds every replica. `/metrics` is not served on 8700 or 8710 (`Telemetry.ServeMetricsOnServicePort` is false). The packaged observability stack (Prometheus, Grafana with the Garrison dashboards, Tempo, Loki, and Grafana Alloy) lives in `k8s/components/observability`; `docs/KUBERNETES.md` covers the overlays that enable it, and `docs/DOCKER.md` the default Compose observability services.

The packaged Grafana is configured mostly through `GF_*` environment variables. Settings that have no environment override, such as feature toggles, live in `k8s/components/observability/config/grafana.ini` (mirrored in the Helm chart as `files/observability/grafana.ini`), mounted as `/etc/grafana/grafana.ini` by Kustomize, Helm, and Docker Compose. It turns off the Grafana 13 `splashScreen` feature toggle, so nobody is shown the "What's new in Grafana" announcement (the Grafana Assistant slide) on first sign-in. Without it the announcement would come back after every pod restart, because Grafana's database is not persisted. The news feed, usage reporting, and update checks are off through `GF_NEWS_NEWS_FEED_ENABLED`, `GF_ANALYTICS_REPORTING_ENABLED`, `GF_ANALYTICS_CHECK_FOR_UPDATES`, and `GF_ANALYTICS_CHECK_FOR_PLUGIN_UPDATES`. Count panels over the selected range (run outcomes, harness availability problems, HTTP requests and errors) round `increase()` to whole numbers.

Workspace cache lookups use `garrison.worker.workspace.cache` (counter, `{request}`), with `tenant`, `agent`, `deployment`, `cache` (`mirror` or `prepared`), and `result` (`hit` or `miss`). The worker dashboard charts the hit rate per deployment. Workspace stage duration includes preparation or snapshot download.

### Replaceable agent memory (D-062)

| MCP tool | Metrics | Span | Logs | Grafana |
|---|---|---|---|---|
| `garrison_memory_read` | `tool="garrison_memory_read"`; application operation component=memory, operation=read | `mcp garrison_memory_read`, nested memory stage | `[Mcp]` outcome; never memory text | garrison-protocols |
| `garrison_memory_write` | `tool="garrison_memory_write"`; application operation component=memory, operation=write | `mcp garrison_memory_write`, nested memory stage | `[Mcp]` outcome; never memory text | garrison-protocols |
| `garrison_memory_delete` | `tool="garrison_memory_delete"`; application operation component=memory, operation=delete | `mcp garrison_memory_delete`, nested memory stage | `[Mcp]` outcome; never memory text | garrison-protocols |

Worker application stages emit `garrison_application_operation_duration_seconds` and `garrison_application_operations_total` with bounded component/operation/result dimensions: `workspace` prepare/git-clone/git-mirror; `snapshot` capture/restore/upload/download-headers/download-body. Snapshot download-headers measures response-header latency; download-body measures bounded archive streaming. Capture/restore include archive processing. No paths, URLs, keys, tokens or file content are stage labels.

## Application stages and run database attribution

`ApplicationOperation.MeasureAsync` emits nested `stage:<component>:<operation>` spans and the `garrison_application_operations_total` and `garrison_application_operation_duration_seconds` families. Components and operations are fixed in code; neither metric carries run IDs, keys, input, URLs or credential values. Outcomes include `ok`, `error` and `cancelled`, including exceptions caught by outer layers. Error traces contain exception types without exception messages. Listener failures are isolated from application results.

Stages cover scheduler refresh/candidate SQL/tenant weights/placement/claim/compile, gateway session and lease checks plus journal authorization/dispatch/completion, broker issuance/revocation with outbound HTTP instrumentation, continuation checkpoint/resume work, workspace preparation/Git clone/mirror, snapshot capture/restore/upload/download, and memory read/write/delete. Existing HTTP, harness, pipeline, database, outbound integration and background metrics continue alongside these finer stages.

`garrison_gateway_overhead_duration_seconds{mode="run"}` measures gateway-owned fencing and journal wall time. It excludes awaited tool execution, child admission inside the dispatched tool, HTTP transport, and attribution flush. It includes gateway database and lock waits. `mode="operator"` separates operator calls. There is no fixed 5 ms SLO or acceptance threshold. This is the metric to profile before assigning an intrinsic-overhead budget; full MCP request latency answers a different question. The Integrations dashboard charts these stages and intrinsic gateway p99; the HTTP dashboard charts synchronous-wait admission/fallback and active waiters.

The run `database-usage` endpoint reports actual SQL attempts attributed through async-local scopes with atomic counters. Unrelated execution contexts are excluded, nested same-run stages count once, and different child runs get separate scopes. See [REST API](../REST_API.md#per-run-database-attribution) for response fields and exclusions. The load harness can collect these rows after the measured window with `--database-attribution true`; it reports observed and missing completion scopes separately from server-wide database-cost estimates. Only completed instrumented scopes are represented. Shared candidate scans, candidate eligibility prechecks before atomic claim, heartbeats, maintenance, request history and attribution persistence are excluded. A process crash or failed flush can leave incomplete telemetry, so it is unsuitable for financial accounting.

The default Compose stack now starts all five observability services and enables server/worker OTLP export. The explicit observability overlay remains compatible with older commands. Collector acceptance and evidence are documented in [D062 telemetry validation](testing/D062_TELEMETRY.md).

Packaged Prometheus jobs use `honor_labels: true` so application `component` values such as `gateway` and `memory` survive target labels. `process_component` retains the scrape target's server/worker identity. Custom scrape configurations must preserve the same distinction; otherwise Prometheus renames the application label to `exported_component` and stage queries no longer match.
