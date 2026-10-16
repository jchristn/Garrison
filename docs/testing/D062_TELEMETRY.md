# D062 application telemetry and database attribution

The application-stage instrumentation and exact scoped database attribution are implemented. This extends the existing Watson/Radiant HTTP, harness, pipeline, database and background telemetry rather than replacing it.

## Implementation

- `ApplicationOperation` records nested spans and stage counters/histograms with fixed component, operation and outcome labels. Failures and cancellation remain visible even when outer application layers catch them. Exceptions contribute types rather than messages. Throwing trace and metric consumers cannot change the operation result or original exception.
- Gateway stages separate session validation, row-only lease validation, journal authorization, dispatch and completion. `garrison_gateway_overhead_duration_seconds{mode="run"}` excludes awaited tool execution and HTTP transport. Operator calls have a separate mode. Gateway lease checks read the run row without hydrating its input/requirement children and still enforce tenant ownership.
- Broker issuance/revocation, continuation, workspace/Git cache, snapshot capture/restore/transfers, memory and scheduler stages use the same application instrumentation. Broker HTTP calls use outbound integration telemetry.
- Async-local scopes count actual central ADO statement attempts. Parallel unrelated work is excluded; nested same-run operations count once; child runs have their own scope. Migration 34 persists atomic cumulative rows per tenant, run and lifecycle operation.
- The Run Read protected `database-usage` endpoint and all four SDKs expose completed-scope totals. Explicit transaction wrappers are separate from statements; statement durations include lock waits and can overlap under concurrency. Run and tenant deletion remove their usage rows.
- The load harness's `--database-attribution true` option fetches usage after the timed window and reports observed/missing completion scopes separately from global database-cost estimates. Accepted asynchronous invocation fallbacks are followed to completion, including their full latency.
- The base Compose file starts Prometheus, Grafana, Tempo, Loki and Alloy and enables OTLP by default. Existing explicit overlay commands remain compatible. HTTP panels show synchronous-wait budget use/fallback, and Integrations panels show application stages and intrinsic gateway overhead. Provisioning remains shared with Kubernetes/Helm. Scrape jobs honor application component labels and expose process_component separately, preventing target-label collisions. Promtool validates the Compose configuration.

## Verification

A broad targeted run passed **50/50 cases**, including telemetry coverage/runtime, exact attribution on SQLite and PostgreSQL, effect journal fencing and broker regressions. The attribution cases execute actual queries with unrelated concurrent queries, concurrent same-run flushes, nested scopes, failed statements, tenant isolation and deletion cleanup. A regression installs throwing `ActivityListener` and `MeterListener` consumers and verifies the original application result and exception survive.

After the final listener-isolation and explicit database-span status changes, the focused telemetry/attribution rerun passed **14/14 cases** across the two providers.

Credential-free case results: [final focused results](../../benchmarks/evidence/d062/telemetry-final-tests.json) and [telemetry-tests.json](../../benchmarks/evidence/d062/telemetry-tests.json). Subsequent combined validation is recorded in [D062 validation](D062_VALIDATION.md).

The reproducible backend command is:

```bash
dotnet build src/Test.Automated/Test.Automated.csproj -f net10.0 --artifacts-path /tmp/garrison-telemetry-build
GARRISON_TEST_PROVIDERS=sqlite,postgresql \
  dotnet /tmp/garrison-telemetry-build/bin/Test.Automated/debug_net10.0/Test.Automated.dll \
  --suites telemetry,database-attribution,effect-journal,credential-broker
```

Use the existing `GARRISON_TEST_PG_*` variables for an isolated PostgreSQL fixture. Set `GARRISON_UPDATE_TELEMETRY_DOC=1` only when intentionally regenerating catalog/coverage tables after a route or metric change.

### Live collectors

A disposable real server/worker fixture completed a fake-harness run, read its completion attribution through REST, exercised all three MCP memory tools, and emitted nested application/database spans. The live Prometheus API returned application, memory and workspace histogram counts. Alloy accepted OTLP and Tempo returned the trace, including the `outer -> inner -> db` parent chain. Grafana provisioned all **14** domain dashboards. Prometheus, Grafana, Tempo and Loki passed their healthchecks; Alloy accepted and forwarded the test trace.

A second live run mounted the exact packaged Compose Prometheus configuration unchanged. With its component=server target label, all three memory operation series retained component=memory and process_component=server, with no exported_component. See [packaged scrape evidence](../../benchmarks/evidence/d062/telemetry-packaged-scrape.json). Helm template/lint and the k3s-observability Kustomize overlay also rendered successfully. The subsequent telemetry suite, including the packaged-label collision regression, passed 10/10 cases ([results](../../benchmarks/evidence/d062/telemetry-config-tests.json)).

Credential-free evidence: [telemetry-collector.json](../../benchmarks/evidence/d062/telemetry-collector.json). The trace contains seven verified spans. The source fixture used a loopback scrape proxy because Radiant matches its listener Host header; packaged Compose service DNS names already match their listeners.

Against a configured collector stack:

```bash
GARRISON_TEST_OTLP_ENDPOINT=http://127.0.0.1:14317 \
GARRISON_TEST_PROMETHEUS_URL=http://127.0.0.1:39090 \
GARRISON_TEST_TEMPO_URL=http://127.0.0.1:39200 \
GARRISON_TEST_METRICS_PORT=39464 \
  dotnet /tmp/garrison-telemetry-build/bin/Test.Automated/debug_net10.0/Test.Automated.dll \
  --telemetry-collector-conformance
```

The conformance command owns its disposable application fixture and exits after assertions. Configure Prometheus to scrape its metrics port using a matching Host header, or a loopback proxy for a source process outside Docker. It never changes the normal deployment.

## Limits and interpretation

Exact counts mean actual attempts inside completed, explicitly attributed lifecycle scopes. Shared scheduler scans, candidate eligibility prechecks before atomic claim, heartbeats, maintenance, request-history writes and telemetry's own persistence are deliberately separate. A process crash before a scope flush, or a failed best-effort flush, can leave incomplete counters. Flush failures increment the telemetry attribution-flush error series. These are diagnostic measurements rather than a billing or effect-safety ledger.

The live collector probe establishes signal delivery and span nesting for exercised stages. It does not claim sustained collector ingestion capacity, every snapshot/cache transfer permutation, or every possible provider failure. Gateway latency acceptance and scale measurements are documented separately. No intrinsic overhead budget is inferred from the old paired full-request diagnostic.

The Linux/container stack was exercised. Windows batch-script execution remains unverified on this macOS host.

Attribution collection has one shared flush grace and a global time budget: `--database-attribution-seconds` defaults to 10 seconds (range 1 to 300). Runs unobserved when the budget expires are reported as missing rather than extending the measured window or waiting separately for every run.
