namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Net.Http;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database.Telemetry;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Telemetry;
    using Garrison.Server.Routes;
    using Radiant;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;
    using Voltaic.Mcp;

    /// <summary>
    /// Telemetry coverage (P13.20 to P13.25): the metric catalog is documented and charted, every REST route, MCP tool,
    /// and A2A method has a row in the coverage matrix in docs/TELEMETRY.md, and the central instrumentation points
    /// (request telemetry, database driver, background services, MCP tools) record what the matrix promises. A route,
    /// tool, or metric added without telemetry coverage fails here. Run with GARRISON_UPDATE_TELEMETRY_DOC=1 to rewrite
    /// the generated sections of the matrix.
    /// </summary>
    public static class TelemetryCoverageSuite
    {
        #region Public-Methods

        /// <summary>
        /// Build the suites.
        /// </summary>
        /// <returns>Suites.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            string id = "telemetry";
            List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
            cases.Add(new TestCaseDescriptor(id, "catalog", "Every metric in the catalog is unique, bucketed, documented, and assigned a dashboard", ct => CatalogAsync(ct)));
            cases.Add(new TestCaseDescriptor(id, "dashboards", "Every metric is charted on its dashboard, and every dashboard UID is in server-info", ct => DashboardsAsync(ct)));
            cases.Add(new TestCaseDescriptor(id, "routes", "Every REST route, MCP tool, and A2A method has a row in the coverage matrix", ct => RoutesAsync(ct)));
            cases.Add(new TestCaseDescriptor(id, "http-runtime", "Requests record route-template metrics, database statements, background iterations, and auth failures", ct => HttpRuntimeAsync(ct)));
            cases.Add(new TestCaseDescriptor(id, "run-runtime", "A run records per-agent lifecycle, stage, token, and worker metrics with tenant, agent, deployment, harness, and model labels", ct => RunRuntimeAsync(ct)));
            cases.Add(new TestCaseDescriptor(id, "mcp-runtime", "MCP tool calls record duration by tool and result, and sessions are counted", ct => McpRuntimeAsync(ct)));
            cases.Add(new TestCaseDescriptor(id, "label-guard", "The cardinality guard folds values beyond the limit into other and counts them", ct => LabelGuardAsync(ct)));
            cases.Add(new TestCaseDescriptor(id, "telemetry-failure-isolation", "Throwing trace and metric consumers cannot change the application result or original exception", ct => TelemetryFailureIsolationAsync(ct)));
            cases.Add(new TestCaseDescriptor(id, "application-stage-runtime", "Application spans classify error and cancellation without exception values; intrinsic gateway timing excludes tool execution", ct => ApplicationStageAsync(ct)));
            cases.Add(new TestCaseDescriptor(id, "statement-names", "Database statement names carry the operation and table, never values", ct => StatementNamesAsync(ct)));
            List<TestSuiteDescriptor> suites = new List<TestSuiteDescriptor>();
            suites.Add(new TestSuiteDescriptor(id, "Telemetry coverage (P13.20)", cases));
            suites.AddRange(DatabaseAttributionSuite.Build());
            return suites;
        }

        #endregion

        #region Private-Methods

        private static string DocumentPath()
        {
            return Path.Combine(TelemetryCoverageDocument.RepositoryRoot(), "docs", "TELEMETRY.md");
        }

        private static bool UpdateRequested()
        {
            return String.Equals(Environment.GetEnvironmentVariable("GARRISON_UPDATE_TELEMETRY_DOC"), "1", StringComparison.Ordinal);
        }

        private static void CheckSection(string name, string expected)
        {
            string path = DocumentPath();
            string document = File.ReadAllText(path);
            if (UpdateRequested())
            {
                File.WriteAllText(path, TelemetryCoverageDocument.Replace(document, name, expected));
                return;
            }
            string? actual = TelemetryCoverageDocument.Section(document, name);
            Assert.True(actual != null, "docs/TELEMETRY.md has no " + TelemetryCoverageDocument.StartMarker(name) + " section");
            List<string> expectedLines = expected.Trim('\n').Split('\n').ToList();
            List<string> actualLines = actual!.Trim('\n').Split('\n').ToList();
            List<string> missing = expectedLines.Where(l => !actualLines.Contains(l)).ToList();
            List<string> stale = actualLines.Where(l => !expectedLines.Contains(l)).ToList();
            Assert.True(missing.Count == 0 && stale.Count == 0,
                "The " + name + " section of docs/TELEMETRY.md is out of date (run the suites with GARRISON_UPDATE_TELEMETRY_DOC=1 to regenerate it). Missing rows:\n"
                + String.Join("\n", missing.Take(20)) + "\nStale rows:\n" + String.Join("\n", stale.Take(20)));
        }

        private static Task CatalogAsync(CancellationToken token)
        {
            List<MetricDescriptor> all = GarrisonMetricCatalog.All();
            List<string> duplicates = all.GroupBy(m => m.Name).Where(g => g.Count() > 1).Select(g => g.Key).ToList();
            Assert.True(duplicates.Count == 0, "Duplicate metric names: " + String.Join(", ", duplicates));
            foreach (MetricDescriptor metric in all)
            {
                Assert.True(metric.Name.StartsWith("garrison.", StringComparison.Ordinal), metric.Name + " has the garrison. prefix");
                Assert.True(!String.IsNullOrEmpty(metric.Description) && !String.IsNullOrEmpty(metric.Category) && metric.Dashboard.StartsWith("garrison-", StringComparison.Ordinal), metric.Name + " has a description, category, and dashboard");
                if (metric.Kind == MetricKindEnum.Histogram) Assert.True(metric.Buckets != null && metric.Buckets.Length > 0, metric.Name + " declares histogram buckets");
                Assert.True(!metric.Labels.Any(l => l == "run" || l == "run_id" || l == "trace" || l == "user"), metric.Name + " carries no per-run or per-user identifier label");
            }
            CheckSection("metrics", TelemetryCoverageDocument.Metrics());
            return Task.CompletedTask;
        }

        private static Task DashboardsAsync(CancellationToken token)
        {
            string directory = Path.Combine(TelemetryCoverageDocument.RepositoryRoot(), "k8s", "components", "observability", "dashboards");
            Dictionary<string, string> dashboards = new Dictionary<string, string>(StringComparer.Ordinal);
            foreach (string file in Directory.GetFiles(directory, "*.json"))
            {
                string json = File.ReadAllText(file);
                using (JsonDocument document = JsonDocument.Parse(json))
                {
                    string uid = document.RootElement.GetProperty("uid").GetString() ?? String.Empty;
                    dashboards[uid] = json;
                }
            }

            List<string> uncharted = new List<string>();
            foreach (MetricDescriptor metric in GarrisonMetricCatalog.All())
            {
                if (!dashboards.TryGetValue(metric.Dashboard, out string? json))
                {
                    uncharted.Add(metric.PrometheusName + " (dashboard " + metric.Dashboard + " missing)");
                    continue;
                }
                if (!json.Contains(metric.PrometheusName, StringComparison.Ordinal)) uncharted.Add(metric.PrometheusName + " (not on " + metric.Dashboard + ")");
            }
            Assert.True(uncharted.Count == 0, "Metrics without a panel on their dashboard: " + String.Join(", ", uncharted));

            string root = TelemetryCoverageDocument.RepositoryRoot();
            foreach (string relative in new[] { "docker/observability/prometheus.yaml", "k8s/components/observability/config/prometheus.yaml", "k8s/helm/garrison/files/observability/prometheus.yaml" })
            {
                string scrape = File.ReadAllText(Path.Combine(root, relative));
                Assert.True(scrape.Contains("honor_labels: true", StringComparison.Ordinal), relative + " preserves application component labels instead of renaming them exported_component");
                Assert.True(scrape.Contains("process_component", StringComparison.Ordinal), relative + " retains process identity separately from application component");
            }
            Assert.Equal(File.ReadAllText(Path.Combine(root, "k8s/components/observability/config/prometheus.yaml")), File.ReadAllText(Path.Combine(root, "k8s/helm/garrison/files/observability/prometheus.yaml")), "Kubernetes and Helm scrape contracts stay identical");

            ObservabilityDashboards uids = new ObservabilityDashboards();
            HashSet<string> advertised = new HashSet<string>(typeof(ObservabilityDashboards).GetProperties().Select(p => p.GetValue(uids) as string ?? String.Empty), StringComparer.Ordinal);
            List<string> unadvertised = dashboards.Keys.Where(k => !advertised.Contains(k)).ToList();
            List<string> absent = advertised.Where(a => !dashboards.ContainsKey(a)).ToList();
            Assert.True(unadvertised.Count == 0 && absent.Count == 0, "Dashboards and server-info UIDs differ. Not in server-info: " + String.Join(", ", unadvertised) + "; no dashboard file: " + String.Join(", ", absent));
            return Task.CompletedTask;
        }

        private static async Task RoutesAsync(CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(DatabaseTypeEnum.Sqlite, null, token).ConfigureAwait(false))
            {
                OperationScopeMap scopes = host.Server.Context.Scopes;
                Assert.True(scopes.All().Count > 100, "The route table is populated");
                CheckSection("routes", TelemetryCoverageDocument.Routes(scopes));
                List<string> tools = scopes.All().Where(s => s.Method == "MCP").Select(s => s.Path).ToList();
                string toolTable = TelemetryCoverageDocument.McpTools();
                List<string> undocumented = tools.Where(t => !toolTable.Contains("`" + t + "`", StringComparison.Ordinal)).ToList();
                Assert.True(undocumented.Count == 0, "MCP tools in the operation scope map without a coverage row: " + String.Join(", ", undocumented));
            }
            CheckSection("mcp-tools", TelemetryCoverageDocument.McpTools());
            CheckSection("a2a-methods", TelemetryCoverageDocument.A2aMethods());
        }

        private static async Task HttpRuntimeAsync(CancellationToken token)
        {
            using (MetricCapture capture = new MetricCapture())
            {
                await using (TestServerHost host = await TestServerHost.StartAsync(DatabaseTypeEnum.Sqlite, null, token).ConfigureAwait(false))
                {
                    await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, "/v1.0/api/server-info", null, token).ConfigureAwait(false);
                    await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, "/v1.0/api/tenants/" + host.TenantId + "/agents", null, token).ConfigureAwait(false);
                    using (HttpClient anonymous = new HttpClient())
                    {
                        anonymous.BaseAddress = new Uri(host.BaseUrl);
                        await HttpTestHelpers.SendAsync(anonymous, HttpMethod.Get, "/v1.0/api/tenants/" + host.TenantId + "/agents", null, token).ConfigureAwait(false);
                    }

                    List<CapturedMeasurement> requests = capture.Of("garrison.http.requests");
                    Assert.True(requests.Any(m => m.Tag("route") == "/v1.0/api/server-info" && m.Tag("status_code") == "200"), "Server info is counted by route template: " + Describe(requests));
                    Assert.True(requests.Any(m => m.Tag("route") == "/v1.0/api/tenants/{tenantId}/agents" && m.Tag("tenant") == host.TenantId), "Tenant routes are counted by template, never the raw path, with the tenant label: " + Describe(requests));
                    Assert.True(requests.All(m => m.Tag("route") == null || !m.Tag("route")!.Contains(host.TenantId, StringComparison.Ordinal)), "No route label carries a raw identifier");
                    Assert.True(requests.Any(m => m.Tag("route") == "unauthenticated" && m.Tag("status_code") == "401"), "Rejected requests are labeled unauthenticated");
                    Assert.True(capture.Of("garrison.http.request.duration").Any(m => m.Tag("route") == "/v1.0/api/tenants/{tenantId}/agents"), "Request duration is recorded by route");
                    Assert.True(capture.Of("garrison.auth.failures").Any(m => m.Tag("reason") == "Missing"), "Missing credentials are counted");
                    Assert.True(capture.Of("garrison.db.operation.duration").Any(m => m.Tag("provider") == "sqlite" && m.Tag("operation") == "select" && m.Tag("table") != "none"), "Database statements are timed by operation and table");
                    Assert.True(capture.Of("garrison.background.iterations").Any(m => m.Tag("service") == "leader_election"), "Background iterations are counted");

                    capture.Observe();
                    Assert.True(capture.Of("garrison.http.requests.in_flight").Count > 0, "The in-flight gauge reports");
                    Assert.True(capture.Of("garrison.build.info").Count == 0 || capture.Of("garrison.build.info").All(m => m.Tag("version") != null), "Build info carries the version");
                }
            }
        }

        private static async Task RunRuntimeAsync(CancellationToken token)
        {
            using (MetricCapture capture = new MetricCapture())
            {
                await using (TestCluster cluster = await TestCluster.StartAsync(DatabaseTypeEnum.Sqlite, 1, token).ConfigureAwait(false))
                {
                    Agent agent = await cluster.CreateAgentAsync("telemetry-echo", "builtin/fake", null, token).ConfigureAwait(false);
                    InvokeRequest request = new InvokeRequest();
                    request.Input = "Report your telemetry";
                    request.Wait = true;
                    request.WaitSeconds = 60;
                    Run run = await HttpTestHelpers.SendAsync<Run>(cluster.Server.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + cluster.Server.TenantId + "/agents/" + agent.Id + "/invoke", request, 200, token).ConfigureAwait(false);
                    Assert.Equal(RunStatusEnum.Succeeded, run.Status, "The run succeeded (" + run.ErrorMessage + ")");

                    List<CapturedMeasurement> created = capture.Of("garrison.runs.created").Where(m => m.Tag("agent") == "telemetry-echo").ToList();
                    Assert.True(created.Count == 1 && created[0].Tag("tenant") == cluster.Server.TenantId && !String.IsNullOrEmpty(created[0].Tag("harness")), "Run creation is counted per agent: " + Describe(created));
                    Assert.True(!String.IsNullOrEmpty(created[0].Tag("deployment")) && created[0].Tag("deployment") != run.DeploymentId, "The deployment label is the deployment name, not its ID: " + created[0].Tag("deployment"));

                    List<CapturedMeasurement> finished = capture.Of("garrison.runs.finished").Where(m => m.Tag("agent") == "telemetry-echo").ToList();
                    Assert.True(finished.Any(m => m.Tag("outcome") == "Succeeded" && m.Tag("model") != null), "Finished runs are counted per agent with outcome and model: " + Describe(finished));

                    List<CapturedMeasurement> stages = capture.Of("garrison.run.stage.duration").Where(m => m.Tag("agent") == "telemetry-echo").ToList();
                    foreach (string stage in new[] { "queue", "claim", "compile", "startup", "first_token", "execution", "total" })
                    {
                        Assert.True(stages.Any(m => m.Tag("stage") == stage), "Stage " + stage + " is recorded per agent: " + String.Join(", ", stages.Select(m => m.Tag("stage")).Distinct()));
                    }
                    Assert.True(capture.Of("garrison.run.tokens").Any(m => m.Tag("agent") == "telemetry-echo" && m.Tag("direction") == "output"), "Output tokens are counted per agent");
                    Assert.True(capture.Of("garrison.invocation.wait.duration").Any(m => m.Tag("surface") == "rest" && m.Tag("result") == "completed"), "The synchronous wait is recorded");

                    List<CapturedMeasurement> worker = capture.Of("garrison.worker.runs").Where(m => m.Tag("agent") == "telemetry-echo").ToList();
                    Assert.True(worker.Any(m => m.Tag("outcome") == "Succeeded" && m.Tag("deployment") == created[0].Tag("deployment")), "The worker counts the run with the same labels: " + Describe(worker));
                    Assert.True(capture.Of("garrison.worker.run.ttft").Any(m => m.Tag("agent") == "telemetry-echo"), "The worker records TTFT per agent");
                    Assert.True(capture.Of("garrison.worker.run.stage.duration").Any(m => m.Tag("stage") == "report"), "The worker records the completion report stage");
                    Assert.True(capture.Of("garrison.outbound.duration").Any(m => m.Tag("service") == "control_plane" && m.Tag("operation") == "complete"), "Node protocol calls are outbound calls");
                }
            }
        }

        private static async Task McpRuntimeAsync(CancellationToken token)
        {
            using (MetricCapture capture = new MetricCapture())
            {
                await using (TestServerHost host = await TestServerHost.StartAsync(DatabaseTypeEnum.Sqlite, null, token).ConfigureAwait(false))
                {
                    using (McpHttpClient client = new McpHttpClient())
                    {
                        client.SetRequestHeader("x-api-key", host.Settings.Auth.AdminApiKey);
                        client.SetRequestHeader("x-tenant-id", host.TenantId);
                        await client.ConnectStreamableAsync(host.McpUrl, "/mcp").ConfigureAwait(false);
                        await client.CallAsync<JsonElement>("tools/call", new { name = "garrison_list_agents", arguments = new { tenantId = host.TenantId } }, 60000).ConfigureAwait(false);
                    }
                    List<CapturedMeasurement> durations = capture.Of("garrison.mcp.tool.duration");
                    Assert.True(durations.Any(m => m.Tag("tool") == "garrison_list_agents" && m.Tag("result") == "ok"), "MCP tool duration is recorded by tool and result: " + Describe(durations));
                    Assert.True(capture.Of("garrison.mcp.tool.calls").Any(m => m.Tag("tenant") == host.TenantId), "MCP tool calls carry the tenant");
                    Assert.True(capture.Of("garrison.mcp.sessions").Any(m => m.Tag("event") == "created"), "MCP sessions are counted when created");
                }
            }
        }

        private static Task LabelGuardAsync(CancellationToken token)
        {
            LabelGuard guard = new LabelGuard();
            guard.MaxLabelValues = 10;
            int folded = 0;
            guard.OnFolded = key => Interlocked.Increment(ref folded);
            for (int i = 0; i < 10; i++) Assert.Equal("agent-" + i, guard.Fold("agent", "agent-" + i), "Values within the limit keep their own series");
            Assert.Equal("other", guard.Fold("agent", "agent-10"), "The eleventh value folds");
            Assert.Equal("agent-3", guard.Fold("agent", "agent-3"), "Values already seen still pass");
            Assert.Equal("none", guard.Fold("agent", null), "Empty values are reported as none");
            Assert.Equal("tenant-x", guard.Fold("tenant", "tenant-x"), "Each label key has its own limit");
            Assert.Equal(1, folded, "Folded values are counted");
            guard.MaxLabelValues = 1;
            Assert.Equal(10, guard.MaxLabelValues, "The limit has a minimum of 10");
            guard.MaxLabelValues = 1000000;
            Assert.Equal(10000, guard.MaxLabelValues, "The limit has a maximum of 10000");
            return Task.CompletedTask;
        }

        private static async Task TelemetryFailureIsolationAsync(CancellationToken token)
        {
            using (System.Diagnostics.ActivityListener listener = new System.Diagnostics.ActivityListener())
            using (System.Diagnostics.Metrics.MeterListener metrics = new System.Diagnostics.Metrics.MeterListener())
            {
                listener.ShouldListenTo = source => source.Name == "Garrison";
                listener.Sample = (ref System.Diagnostics.ActivityCreationOptions<System.Diagnostics.ActivityContext> options) => System.Diagnostics.ActivitySamplingResult.AllData;
                listener.ActivityStopped = activity => throw new InvalidOperationException("trace consumer failed");
                System.Diagnostics.ActivitySource.AddActivityListener(listener);
                metrics.InstrumentPublished = (instrument, owner) => { if (instrument.Meter.Name == "Garrison") owner.EnableMeasurementEvents(instrument); };
                metrics.SetMeasurementEventCallback<double>((instrument, value, tags, state) => throw new InvalidOperationException("metric consumer failed"));
                metrics.SetMeasurementEventCallback<long>((instrument, value, tags, state) => throw new InvalidOperationException("metric consumer failed"));
                metrics.Start();
                int value = await ApplicationOperation.MeasureAsync("test", "throwing_consumers", ct => Task.FromResult(7), token).ConfigureAwait(false);
                Assert.Equal(7, value, "Successful result survives failed consumers");
                bool original = false;
                try { await ApplicationOperation.MeasureAsync("test", "original_failure", ct => Task.FromException<int>(new FormatException("original failure")), token).ConfigureAwait(false); }
                catch (FormatException exception) { original = exception.Message == "original failure"; }
                Assert.True(original, "Original exception survives failed consumers");
                Assert.True(System.Diagnostics.Activity.Current == null, "Failed span callbacks do not leak the stopped activity into application context");
            }
        }

        private static async Task ApplicationStageAsync(CancellationToken token)
        {
            List<System.Diagnostics.Activity> spans = new List<System.Diagnostics.Activity>();
            using (System.Diagnostics.ActivityListener listener = new System.Diagnostics.ActivityListener())
            using (MetricCapture capture = new MetricCapture())
            {
                listener.ShouldListenTo = source => source.Name == "Garrison";
                listener.Sample = (ref System.Diagnostics.ActivityCreationOptions<System.Diagnostics.ActivityContext> options) => System.Diagnostics.ActivitySamplingResult.AllData;
                listener.ActivityStopped = activity => spans.Add(activity);
                System.Diagnostics.ActivitySource.AddActivityListener(listener);
                await GatewayOperation.MeasureAsync(async ct =>
                {
                    await GatewayOperation.DispatchAsync(async inner => { await Task.Delay(150, inner).ConfigureAwait(false); return true; }, ct).ConfigureAwait(false);
                    return true;
                }, token).ConfigureAwait(false);
                double dispatch = capture.Of("garrison.application.operation.duration").Single(m => m.Tag("component") == "gateway").Value;
                double overhead = capture.Of("garrison.gateway.overhead.duration").Single().Value;
                Assert.True(dispatch >= 0.12 && overhead < dispatch / 2, "Intrinsic gateway timing excludes the slow tool dispatch");
                try { await ApplicationOperation.MeasureAsync("test", "failed", ct => Task.FromException(new InvalidOperationException("sensitive-provider-value")), token).ConfigureAwait(false); }
                catch (InvalidOperationException) { }
                try { await ApplicationOperation.MeasureAsync("test", "cancelled", ct => Task.FromCanceled(new CancellationToken(true)), token).ConfigureAwait(false); }
                catch (OperationCanceledException) { }
                Assert.True(capture.Of("garrison.application.operations").Any(m => m.Tag("result") == "error"), "Caught errors counted");
                Assert.True(capture.Of("garrison.application.operations").Any(m => m.Tag("result") == "cancelled"), "Cancellation counted");
                Assert.True(spans.Any(a => a.OperationName == "stage:test:failed" && a.Status == System.Diagnostics.ActivityStatusCode.Error), "Error status reaches trace exporter");
                Assert.True(spans.All(a => !(a.StatusDescription ?? string.Empty).Contains("sensitive-provider-value", StringComparison.Ordinal)), "Exception values never reach application spans");
            }
        }

        private static Task StatementNamesAsync(CancellationToken token)
        {
            Assert.Equal("select runs", DatabaseTelemetry.Describe("SELECT * FROM \"garrison\".\"runs\" WHERE id = @id;").Name, "Select from a quoted, schema-qualified table");
            Assert.Equal("insert run_events", DatabaseTelemetry.Describe("INSERT INTO run_events (id, text) VALUES (@id, @text);").Name, "Insert");
            Assert.Equal("upsert control_nodes", DatabaseTelemetry.Describe("INSERT INTO control_nodes (id) VALUES (@id) ON CONFLICT (id) DO UPDATE SET id = @id;").Name, "Upsert");
            Assert.Equal("update nodes", DatabaseTelemetry.Describe("UPDATE nodes SET status = 'Lost' WHERE id = @id;").Name, "Update");
            Assert.Equal("delete request_nonces", DatabaseTelemetry.Describe("DELETE FROM request_nonces WHERE expiresutc < @now;").Name, "Delete");
            Assert.Equal("ddl schema", DatabaseTelemetry.Describe("CREATE TABLE IF NOT EXISTS runs (id TEXT);").Name, "DDL");
            Assert.True(!DatabaseTelemetry.Describe("SELECT * FROM runs WHERE id = 'run_secret';").Name.Contains("secret", StringComparison.Ordinal), "Literal values never reach the name");
            return Task.CompletedTask;
        }

        private static string Describe(List<CapturedMeasurement> measurements)
        {
            return String.Join("; ", measurements.Take(20).Select(m => String.Join(",", m.Tags.Select(t => t.Key + "=" + t.Value))));
        }

        #endregion
    }
}
