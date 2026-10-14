namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Concurrent;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Linq;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Services;
    using Garrison.Core.Settings;
    using Garrison.Core.Telemetry;
    using Garrison.Server.Services;
    using Garrison.Server.Settings;
    using Garrison.Worker.Hosting;
    using SyslogLogging;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Phase 13 product suites: observability settings, server info, the observability status probes, run trace IDs and
    /// spans, log fields, and the relayed metrics endpoints (P13.12 to P13.18).
    /// </summary>
    public static class ObservabilitySuite
    {
        #region Public-Methods

        /// <summary>
        /// Build the suites.
        /// </summary>
        /// <returns>Suites.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            List<TestSuiteDescriptor> suites = new List<TestSuiteDescriptor>();
            string id = "observability";
            List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
            cases.Add(new TestCaseDescriptor(id, "settings", "Observability URL settings validate, trim, and yield to environment variables", ct => SettingsAsync(ct)));
            cases.Add(new TestCaseDescriptor(id, "request-history-node-protocol", "Request history skips successful and abandoned worker node protocol calls unless RequestHistory.CaptureNodeProtocol is on, and keeps failed ones", ct => RequestHistoryNodeProtocolAsync(ct)));
            cases.Add(new TestCaseDescriptor(id, "console-logging-without-terminal", "Server and worker console logging follows ConsoleLogging even with no terminal attached (G-8, SyslogLogging DetectConsole)", ct => ConsoleLoggingWithoutTerminalAsync(ct)));
            cases.Add(new TestCaseDescriptor(id, "server-info", "Server info reports observability URLs and Grafana UIDs only when configured", ct => ServerInfoAsync(ct)));
            cases.Add(new TestCaseDescriptor(id, "status-reachable", "Observability status probes report reachability and versions, and cache results", ct => StatusReachableAsync(ct)));
            cases.Add(new TestCaseDescriptor(id, "status-unreachable", "Observability status reports unreachable and unconfigured services without failing", ct => StatusUnreachableAsync(ct)));
            cases.Add(new TestCaseDescriptor(id, "run-tracing", "RunTracing parses trace IDs, formats log fields, and always yields a traceparent", ct => RunTracingAsync(ct)));
            cases.Add(new TestCaseDescriptor(id, "run-trace-spans", "A run records its trace ID and its create, claim, compile, and harness spans share it", ct => RunTraceSpansAsync(ct)));
            cases.Add(new TestCaseDescriptor(id, "otlp-sources", "With OTLP enabled, Radiant records spans from the Garrison and Garrison.Worker sources", ct => OtlpSourcesAsync(ct)));
            cases.Add(new TestCaseDescriptor(id, "metrics-rest", "GET /metrics on the REST port relays the Prometheus listener and can be turned off", ct => MetricsRestAsync(ct)));
            cases.Add(new TestCaseDescriptor(id, "metrics-health", "GET /metrics on the worker health port relays the exposition or answers 503", ct => MetricsHealthAsync(ct)));
            suites.Add(new TestSuiteDescriptor(id, "Observability (P13)", cases));
            return suites;
        }

        #endregion

        #region Private-Methods

        private static async Task RequestHistoryNodeProtocolAsync(CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(DatabaseTypeEnum.Sqlite, token).ConfigureAwait(false))
            {
                ClusterSettingsService cluster = new ClusterSettingsService(db, true, 30, name => null);
                await cluster.RefreshAsync(token).ConfigureAwait(false);
                LoggingModule logging = new LoggingModule();
                logging.Settings.EnableConsole = false;
                using (RequestHistoryCaptureService capture = new RequestHistoryCaptureService(db, new RequestHistorySettings(), cluster, logging))
                {
                    Assert.True(!cluster.GetBool("RequestHistory.CaptureNodeProtocol"), "Node protocol capture is off by default");
                    Assert.True(!capture.ShouldCapture("/v1.0/api/node/lease", 200, false), "A successful lease poll is skipped");
                    Assert.True(!capture.ShouldCapture("/v1.0/api/node/runs/run_1/events", 200, false), "A successful event batch is skipped");
                    Assert.True(!capture.ShouldCapture("/v1.0/api/node/watch", 500, true), "An abandoned watch is skipped");
                    Assert.True(capture.ShouldCapture("/v1.0/api/node/runs/run_1/complete", 409, false), "A failed node call is captured");
                    Assert.True(capture.ShouldCapture("/v1.0/api/nodes", 200, false), "Node management is not node protocol");
                    Assert.True(capture.ShouldCapture("/v1.0/api/node-pools", 200, false), "Node pools are not node protocol");
                    Assert.True(capture.ShouldCapture("/v1.0/api/tenants/ten_a/agents", 200, false), "Other routes are captured");

                    await cluster.SetAsync("RequestHistory.CaptureNodeProtocol", "true", "test", token).ConfigureAwait(false);
                    Assert.True(capture.ShouldCapture("/v1.0/api/node/lease", 200, false), "Opting in captures node protocol calls");
                    await cluster.SetAsync("RequestHistory.Enabled", "false", "test", token).ConfigureAwait(false);
                    Assert.True(!capture.ShouldCapture("/v1.0/api/tenants/ten_a/agents", 200, false), "Nothing is captured when request history is off");
                }
            }
        }

        private static async Task SettingsAsync(CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(DatabaseTypeEnum.Sqlite, token).ConfigureAwait(false))
            {
                Dictionary<string, string> env = new Dictionary<string, string> { { "GARRISON_LOKI_URL", "https://loki.example.com/" } };
                ClusterSettingsService cluster = new ClusterSettingsService(db, true, 30, name => env.TryGetValue(name, out string? v) ? v : null);

                Assert.Equal(String.Empty, cluster.GetString("Observability.GrafanaUrl"), "Grafana URL defaults to empty");
                Assert.Equal("https://loki.example.com", cluster.GetString("Observability.LokiUrl"), "Environment value wins and is trimmed");
                Assert.True(cluster.IsOverridden("Observability.LokiUrl"), "Loki URL is overridden by the environment");

                Assert.True(cluster.Normalize("Observability.GrafanaUrl", "ftp://grafana", out string? error, out string code) == null && code == "NotAUrl", "Non-http URLs are rejected: " + error);
                Assert.True(cluster.Normalize("Observability.GrafanaUrl", "grafana", out error, out code) == null && code == "NotAUrl", "Relative values are rejected");
                Assert.Equal("http://127.0.0.1:3000", cluster.Normalize("Observability.GrafanaUrl", " http://127.0.0.1:3000/ ", out error), "URLs are trimmed");
                Assert.Equal(String.Empty, cluster.Normalize("Observability.GrafanaUrl", "", out error), "Empty clears the URL");

                await cluster.SetAsync("Observability.GrafanaUrl", "http://grafana.example.com/", "tester", token).ConfigureAwait(false);
                Assert.Equal("http://grafana.example.com", cluster.GetString("Observability.GrafanaUrl"), "Stored value");

                bool rejected = false;
                try
                {
                    await cluster.SetAsync("Observability.LokiUrl", "http://other", "tester", token).ConfigureAwait(false);
                }
                catch (ValidationException e) when (e.Codes != null && e.Codes.ContainsValue("OverriddenByEnvironment"))
                {
                    rejected = true;
                }
                Assert.True(rejected, "Environment-overridden settings cannot be changed through the API");

                ClusterSettingsService reloaded = new ClusterSettingsService(db, true, 30, name => null);
                await reloaded.RefreshAsync(token).ConfigureAwait(false);
                Assert.Equal("http://grafana.example.com", reloaded.GetString("Observability.GrafanaUrl"), "Stored value survives a reload");
                Assert.Equal(String.Empty, reloaded.GetString("Observability.LokiUrl"), "Without the environment variable the Loki URL is empty");
            }
        }

        private static Task ConsoleLoggingWithoutTerminalAsync(CancellationToken token)
        {
            token.ThrowIfCancellationRequested();
            foreach (bool enabled in new bool[] { true, false })
            {
                Garrison.Server.Settings.LoggingSettings serverSettings = new Garrison.Server.Settings.LoggingSettings();
                serverSettings.ConsoleLogging = enabled;
                using (LoggingModule server = Garrison.Server.Bootstrapper.BuildLogging(serverSettings))
                {
                    Assert.Equal(enabled, server.Settings.EnableConsole, "Server console logging with ConsoleLogging " + enabled + " (the test host has no terminal)");
                }

                Garrison.Worker.Settings.WorkerLoggingSettings workerSettings = new Garrison.Worker.Settings.WorkerLoggingSettings();
                workerSettings.ConsoleLogging = enabled;
                using (LoggingModule worker = Garrison.Worker.Bootstrapper.BuildLogging(workerSettings))
                {
                    Assert.Equal(enabled, worker.Settings.EnableConsole, "Worker console logging with ConsoleLogging " + enabled + " (the test host has no terminal)");
                }
            }
            return Task.CompletedTask;
        }

        private static async Task ServerInfoAsync(CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(DatabaseTypeEnum.Sqlite, null, token).ConfigureAwait(false))
            {
                TestResponse raw = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, "/v1.0/api/server-info", null, token).ConfigureAwait(false);
                Assert.Equal(200, raw.StatusCode, "server info");
                Assert.True(raw.Body.Contains("\"observability\":{\"grafanaUrl\":null,\"prometheusUrl\":null,\"lokiUrl\":null,\"tempoUrl\":null,\"datasources\":null,\"dashboards\":null}", StringComparison.Ordinal), "Unconfigured observability is all nulls: " + raw.Body);

                SettingsView view = await HttpTestHelpers.SendAsync<SettingsView>(host.AdminClient, HttpMethod.Get, "/v1.0/api/settings", null, 200, token).ConfigureAwait(false);
                SettingField grafanaField = Assert.NotNull(view.Fields.FirstOrDefault(f => f.Path == "Observability.GrafanaUrl"), "Grafana URL setting");
                Assert.True(grafanaField.Source == "Database" && grafanaField.ApplyMode == "Live" && grafanaField.Editable && grafanaField.Type == "string" && !grafanaField.IsSet, "Grafana URL setting metadata");
                Assert.True(view.Fields.Any(f => f.Path == "Observability.TempoInternalUrl"), "Internal URL settings are listed");

                SettingsUpdateRequest bad = new SettingsUpdateRequest();
                bad.Values.Add(new SettingValue { Path = "Observability.GrafanaUrl", Value = "not a url" });
                Assert.Equal(400, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Put, "/v1.0/api/settings", bad, token).ConfigureAwait(false)).StatusCode, "Invalid URL is rejected");

                SettingsUpdateRequest update = new SettingsUpdateRequest();
                update.Values.Add(new SettingValue { Path = "Observability.GrafanaUrl", Value = "https://grafana.example.com/" });
                update.Values.Add(new SettingValue { Path = "Observability.TempoUrl", Value = "https://tempo.example.com" });
                await HttpTestHelpers.SendAsync<SettingsSaveResponse>(host.AdminClient, HttpMethod.Put, "/v1.0/api/settings", update, 200, token).ConfigureAwait(false);

                ServerInfoResponse info = await HttpTestHelpers.SendAsync<ServerInfoResponse>(host.AdminClient, HttpMethod.Get, "/v1.0/api/server-info", null, 200, token).ConfigureAwait(false);
                Assert.Equal("https://grafana.example.com", info.Observability.GrafanaUrl, "Grafana URL");
                Assert.Equal("https://tempo.example.com", info.Observability.TempoUrl, "Tempo URL");
                Assert.True(info.Observability.PrometheusUrl == null && info.Observability.LokiUrl == null, "Unset URLs stay null");
                ObservabilityDatasources ds = Assert.NotNull(info.Observability.Datasources, "Datasources with Grafana configured");
                ObservabilityDashboards dash = Assert.NotNull(info.Observability.Dashboards, "Dashboards with Grafana configured");
                Assert.True(ds.Prometheus == "garrison-prometheus" && ds.Loki == "garrison-loki" && ds.Tempo == "garrison-tempo", "Datasource UIDs");
                Assert.True(dash.Overview == "garrison-overview" && dash.Http == "garrison-http" && dash.Runs == "garrison-runs" && dash.Workers == "garrison-workers" && dash.Protocols == "garrison-protocols" && dash.Integrations == "garrison-integrations", "Dashboard UIDs");
            }
        }

        private static async Task StatusReachableAsync(CancellationToken token)
        {
            using (FakeObservabilityServer fake = new FakeObservabilityServer())
            {
                await using (TestServerHost host = await TestServerHost.StartAsync(DatabaseTypeEnum.Sqlite, null, token).ConfigureAwait(false))
                {
                    SettingsUpdateRequest update = new SettingsUpdateRequest();
                    update.Values.Add(new SettingValue { Path = "Observability.GrafanaUrl", Value = "https://grafana.example.com" });
                    update.Values.Add(new SettingValue { Path = "Observability.GrafanaInternalUrl", Value = fake.BaseUrl });
                    update.Values.Add(new SettingValue { Path = "Observability.PrometheusUrl", Value = fake.BaseUrl });
                    update.Values.Add(new SettingValue { Path = "Observability.LokiUrl", Value = fake.BaseUrl });
                    update.Values.Add(new SettingValue { Path = "Observability.TempoUrl", Value = fake.BaseUrl });
                    await HttpTestHelpers.SendAsync<SettingsSaveResponse>(host.AdminClient, HttpMethod.Put, "/v1.0/api/settings", update, 200, token).ConfigureAwait(false);

                    await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + host.TenantId + "/users", new UserRequest { Email = "observer@example.com", Password = "password123" }, 201, token).ConfigureAwait(false);
                    List<ObservabilityServiceStatus> status;
                    using (HttpClient plain = await host.UserClientAsync("observer@example.com", "password123", host.TenantId, token).ConfigureAwait(false))
                    {
                        status = await HttpTestHelpers.SendAsync<List<ObservabilityServiceStatus>>(plain, HttpMethod.Get, "/v1.0/api/observability/status", null, 200, token).ConfigureAwait(false);
                    }
                    Assert.Equal("grafana,prometheus,loki,tempo", String.Join(",", status.Select(s => s.Service)), "One entry per service in order");
                    Assert.True(status.All(s => s.Configured && s.Reachable), "All reachable: " + String.Join(", ", status.Select(s => s.Service + "=" + s.Reachable)));
                    Assert.Equal("11.3.0", status[0].Version, "Grafana version from /api/health (probed on the internal URL)");
                    Assert.Equal("3.1.0", status[1].Version, "Prometheus version from build info");
                    Assert.Equal("3.4.2", status[2].Version, "Loki version from build info");
                    Assert.Equal("2.7.1", status[3].Version, "Tempo version from build info");

                    int requests = fake.Requests;
                    List<ObservabilityServiceStatus> cached = await HttpTestHelpers.SendAsync<List<ObservabilityServiceStatus>>(host.AdminClient, HttpMethod.Get, "/v1.0/api/observability/status", null, 200, token).ConfigureAwait(false);
                    Assert.Equal(requests, fake.Requests, "A second call within 30 seconds is served from the cache");
                    Assert.Equal(status[0].CheckedUtc, cached[0].CheckedUtc, "Cached check time");

                    using (HttpClient anonymous = new HttpClient())
                    {
                        anonymous.BaseAddress = new Uri(host.BaseUrl);
                        Assert.Equal(401, (await HttpTestHelpers.SendAsync(anonymous, HttpMethod.Get, "/v1.0/api/observability/status", null, token).ConfigureAwait(false)).StatusCode, "Status requires authentication");
                    }
                }
            }
        }

        private static async Task StatusUnreachableAsync(CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(DatabaseTypeEnum.Sqlite, null, token).ConfigureAwait(false))
            {
                List<ObservabilityServiceStatus> none = await HttpTestHelpers.SendAsync<List<ObservabilityServiceStatus>>(host.AdminClient, HttpMethod.Get, "/v1.0/api/observability/status", null, 200, token).ConfigureAwait(false);
                Assert.True(none.Count == 4 && none.All(s => !s.Configured && !s.Reachable && s.Version == null), "Nothing configured");

                string closed = "http://127.0.0.1:" + TestServerHost.FreePort();
                SettingsUpdateRequest update = new SettingsUpdateRequest();
                update.Values.Add(new SettingValue { Path = "Observability.PrometheusUrl", Value = closed });
                update.Values.Add(new SettingValue { Path = "Observability.TempoUrl", Value = "http://203.0.113.1:3200" });
                await HttpTestHelpers.SendAsync<SettingsSaveResponse>(host.AdminClient, HttpMethod.Put, "/v1.0/api/settings", update, 200, token).ConfigureAwait(false);

                Stopwatch timer = Stopwatch.StartNew();
                List<ObservabilityServiceStatus> status = await HttpTestHelpers.SendAsync<List<ObservabilityServiceStatus>>(host.AdminClient, HttpMethod.Get, "/v1.0/api/observability/status", null, 200, token).ConfigureAwait(false);
                timer.Stop();
                ObservabilityServiceStatus prometheus = status.Single(s => s.Service == "prometheus");
                ObservabilityServiceStatus tempo = status.Single(s => s.Service == "tempo");
                Assert.True(prometheus.Configured && !prometheus.Reachable && prometheus.Version == null, "Closed port is unreachable");
                Assert.True(tempo.Configured && !tempo.Reachable, "Unroutable address is unreachable");
                Assert.True(!status.Single(s => s.Service == "grafana").Configured, "Grafana is not configured");
                Assert.True(timer.ElapsedMilliseconds < 10000, "Probes use short timeouts (took " + timer.ElapsedMilliseconds + " ms)");

                TestResponse raw = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, "/v1.0/api/observability/status", null, token).ConfigureAwait(false);
                Assert.True(raw.Body.Contains("\"version\":null", StringComparison.Ordinal), "Unknown versions are written as null: " + raw.Body);
            }
        }

        private static Task RunTracingAsync(CancellationToken token)
        {
            Assert.Equal("4bf92f3577b34da6a3ce929d0e0e4736", RunTracing.TraceIdOf("00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01"), "Trace ID from a traceparent");
            Assert.True(RunTracing.TraceIdOf("garbage") == null && RunTracing.TraceIdOf(null) == null, "Malformed traceparents have no trace ID");
            Assert.Equal("run=run_1 trace=abc", RunTracing.LogFields("run_1", "abc"), "Log fields");
            Assert.Equal("run=run_1 trace=-", RunTracing.LogFields("run_1", null), "Log fields without a trace");

            string parent = "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01";
            Assert.Equal(parent, RunTracing.TraceParentFor(null, parent), "Parent traceparent wins over a generated one");
            Activity? saved = Activity.Current;
            Activity.Current = null;
            try
            {
                string generated = RunTracing.TraceParentFor(null, null);
                Assert.True(RunTracing.TraceIdOf(generated) != null && generated.EndsWith("-01", StringComparison.Ordinal), "A sampled traceparent is generated: " + generated);
            }
            finally
            {
                Activity.Current = saved;
            }

            Run run = new Run();
            bool threw = false;
            try
            {
                run.TraceId = "not-hex";
            }
            catch (ArgumentException)
            {
                threw = true;
            }
            Assert.True(threw, "Run.TraceId rejects values that are not 32 hexadecimal characters");
            return Task.CompletedTask;
        }

        private static async Task RunTraceSpansAsync(CancellationToken token)
        {
            ConcurrentQueue<Activity> stopped = new ConcurrentQueue<Activity>();
            using (ActivityListener listener = new ActivityListener())
            {
                listener.ShouldListenTo = source => source.Name == "Garrison" || source.Name == "Garrison.Worker";
                listener.Sample = (ref ActivityCreationOptions<ActivityContext> options) => ActivitySamplingResult.AllDataAndRecorded;
                listener.ActivityStopped = activity => stopped.Enqueue(activity);
                ActivitySource.AddActivityListener(listener);

                await using (TestCluster cluster = await TestCluster.StartAsync(DatabaseTypeEnum.Sqlite, 1, token).ConfigureAwait(false))
                {
                    Agent agent = await cluster.CreateAgentAsync("traced", "builtin/fake", null, token).ConfigureAwait(false);
                    InvokeRequest request = new InvokeRequest();
                    request.Input = "Trace me";
                    request.Wait = true;
                    request.WaitSeconds = 60;
                    Run run = await HttpTestHelpers.SendAsync<Run>(cluster.Server.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + cluster.Server.TenantId + "/agents/" + agent.Id + "/invoke", request, 200, token).ConfigureAwait(false);
                    Assert.Equal(RunStatusEnum.Succeeded, run.Status, "Run status (" + run.Outcome + ": " + run.ErrorMessage + ")");
                    string traceId = Assert.NotNull(run.TraceId, "Run trace ID");
                    Assert.True(traceId.Length == 32 && traceId.All(Uri.IsHexDigit) && traceId == traceId.ToLowerInvariant(), "Trace ID is 32 lowercase hex characters");

                    Run read = await HttpTestHelpers.SendAsync<Run>(cluster.Server.AdminClient, HttpMethod.Get, "/v1.0/api/tenants/" + cluster.Server.TenantId + "/runs/" + run.Id, null, 200, token).ConfigureAwait(false);
                    Assert.Equal(traceId, read.TraceId, "REST returns the stored trace ID");

                    DateTime deadline = DateTime.UtcNow.AddSeconds(10);
                    List<Activity> spans = new List<Activity>();
                    while (DateTime.UtcNow < deadline)
                    {
                        spans = stopped.Where(a => a.TraceId.ToHexString() == traceId).ToList();
                        if (spans.Any(a => a.OperationName.StartsWith("harness ", StringComparison.Ordinal))) break;
                        await Task.Delay(50, token).ConfigureAwait(false);
                    }
                    string names = String.Join(", ", spans.Select(a => a.Source.Name + ":" + a.OperationName));
                    Activity create = Assert.NotNull(spans.FirstOrDefault(a => a.OperationName == "run:create"), "run:create span in the run's trace (" + names + ")");
                    Activity claim = Assert.NotNull(spans.FirstOrDefault(a => a.OperationName == "run:claim"), "run:claim span in the run's trace (" + names + ")");
                    Activity compile = Assert.NotNull(spans.FirstOrDefault(a => a.OperationName == "run:compile"), "run:compile span in the run's trace (" + names + ")");
                    Activity exec = Assert.NotNull(spans.FirstOrDefault(a => a.Source.Name == "Garrison.Worker" && a.OperationName.StartsWith("harness ", StringComparison.Ordinal) && a.OperationName.EndsWith(" exec", StringComparison.Ordinal)), "harness exec span in the run's trace (" + names + ")");
                    Assert.Equal(create.SpanId, claim.ParentSpanId, "run:claim is a child of run:create");
                    Assert.Equal(claim.SpanId, compile.ParentSpanId, "run:compile is a child of run:claim");
                    Assert.Equal(claim.SpanId, exec.ParentSpanId, "The worker's harness span is a child of run:claim");
                    Assert.Equal(run.Id, create.GetTagItem("garrison.run_id") as string, "run:create carries the run ID");
                }
            }
        }

        private static async Task OtlpSourcesAsync(CancellationToken token)
        {
            TelemetrySettings settings = new TelemetrySettings();
            settings.Enabled = true;
            settings.ServiceName = "garrison-otlp-test";
            settings.PrometheusEnable = false;
            settings.OtlpEnable = true;
            settings.OtlpEndpoint = "http://127.0.0.1:" + TestServerHost.FreePort();
            using (GarrisonTelemetry telemetry = new GarrisonTelemetry(settings, "otlp-test", null))
            {
                Assert.True(telemetry.Active, "Telemetry starts with OTLP enabled");
                Activity? saved = Activity.Current;
                Activity.Current = null;
                try
                {
                    using (Activity? create = RunTracing.Start("run:create", null))
                    {
                        Activity span = Assert.NotNull(create, "Radiant samples the Garrison source");
                        Assert.True(span.Recorded, "Garrison spans are recorded for export");
                        using (ActivitySource worker = new ActivitySource("Garrison.Worker"))
                        using (Activity? exec = worker.StartActivity("harness Fake exec", ActivityKind.Internal, span.Context))
                        {
                            Activity child = Assert.NotNull(exec, "Radiant samples the Garrison.Worker source");
                            Assert.True(child.Recorded && child.TraceId == span.TraceId, "The worker span joins the run's trace and is recorded");
                        }
                    }
                }
                finally
                {
                    Activity.Current = saved;
                }
            }
            await Task.CompletedTask.ConfigureAwait(false);
        }

        private static async Task MetricsRestAsync(CancellationToken token)
        {
            int metricsPort = TestServerHost.FreePort();
            await using (TestServerHost host = await TestServerHost.StartAsync(DatabaseTypeEnum.Sqlite, s =>
            {
                s.Telemetry.Enabled = true;
                s.Telemetry.ServiceName = "garrison-metrics-test";
                s.Telemetry.PrometheusEnable = true;
                s.Telemetry.PrometheusHostname = "127.0.0.1";
                s.Telemetry.PrometheusPort = metricsPort;
            }, token).ConfigureAwait(false))
            {
                Assert.True(host.Server.Context.Telemetry.Active, "Telemetry is active");
                await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, "/v1.0/api/health", null, token).ConfigureAwait(false);
                using (HttpClient anonymous = new HttpClient())
                {
                    anonymous.BaseAddress = new Uri(host.BaseUrl);
                    TestResponse metrics = await HttpTestHelpers.SendAsync(anonymous, HttpMethod.Get, "/metrics", null, token).ConfigureAwait(false);
                    Assert.Equal(200, metrics.StatusCode, "Relayed metrics without authentication: " + metrics.Body);
                    Assert.True(metrics.Body.Contains("# TYPE", StringComparison.Ordinal), "Prometheus exposition text");

                    host.Server.Context.Settings.Telemetry.ServeMetricsOnServicePort = false;
                    Assert.Equal(404, (await HttpTestHelpers.SendAsync(anonymous, HttpMethod.Get, "/metrics", null, token).ConfigureAwait(false)).StatusCode, "Turned off");
                }
            }
        }

        private static async Task MetricsHealthAsync(CancellationToken token)
        {
            int port = TestServerHost.FreePort();
            bool available = true;
            Func<WorkerHealth> health = () => new WorkerHealth();
            using (HealthServer server = new HealthServer("127.0.0.1", port, health, ct => Task.FromResult<MetricsScrape?>(available ? new MetricsScrape { Body = "# TYPE garrison_worker_runs counter\n" } : null)))
            {
                server.Start();
                using (HttpClient client = new HttpClient())
                {
                    client.BaseAddress = new Uri("http://127.0.0.1:" + port);
                    TestResponse ok = await HttpTestHelpers.SendAsync(client, HttpMethod.Get, "/metrics", null, token).ConfigureAwait(false);
                    Assert.Equal(200, ok.StatusCode, "Relayed worker metrics");
                    Assert.True(ok.Body.Contains("garrison_worker_runs", StringComparison.Ordinal), "Exposition body");
                    available = false;
                    Assert.Equal(503, (await HttpTestHelpers.SendAsync(client, HttpMethod.Get, "/metrics", null, token).ConfigureAwait(false)).StatusCode, "Unavailable listener");
                }
            }
        }

        #endregion
    }
}
