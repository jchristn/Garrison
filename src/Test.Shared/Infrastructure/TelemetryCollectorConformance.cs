namespace Test.Shared.Infrastructure
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.IO;
    using System.Linq;
    using System.Net.Http;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Telemetry;
    using Garrison.Worker.Hosting;
    using Touchstone.Core;
    using Voltaic.Mcp;

    /// <summary>Opt-in real Prometheus and OTLP/Tempo collector acceptance, using disposable server and worker fixtures.</summary>
    public static class TelemetryCollectorConformance
    {
        /// <summary>Exercise real server scheduling, SQL attribution, worker execution and application spans through collectors.</summary>
        /// <param name="otlp">OTLP gRPC receiver endpoint.</param>
        /// <param name="prometheus">Prometheus API base URL.</param>
        /// <param name="tempo">Tempo API base URL.</param>
        /// <param name="metricsPort">Server metric listener port scraped by the configured Prometheus.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Credential-free outcome summary.</returns>
        public static async Task<string> RunAsync(string otlp, string prometheus, string tempo, int metricsPort, CancellationToken token = default)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(DatabaseTypeEnum.Sqlite, settings =>
            {
                settings.AgentMemory.Enabled = true;
                settings.AgentMemory.RootDirectory = Path.Combine(Path.GetTempPath(), "garrison-collector-memory-" + Guid.NewGuid().ToString("N"));
                settings.Telemetry.Enabled = true;
                settings.Telemetry.PrometheusHostname = "127.0.0.1";
                settings.Telemetry.PrometheusPort = metricsPort;
                settings.Telemetry.OtlpEnable = true;
                settings.Telemetry.OtlpEndpoint = otlp;
            }, token).ConfigureAwait(false))
            await using (WorkerHost worker = await TestCluster.StartWorkerAsync(host.BaseUrl, "collector-worker", settings =>
            {
                settings.Telemetry.Enabled = false;
            }, token).ConfigureAwait(false))
            using (HttpClient http = new HttpClient())
            {
                string tenant = host.TenantId;
                Agent agent = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + tenant + "/agents", new Agent { Name = "collector-conformance" }, 201, token).ConfigureAwait(false);
                HarnessProfile profile = await host.Server.Context.Database.HarnessProfiles.ReadByNameAsync(tenant, "builtin/fake", token).ConfigureAwait(false) ?? throw new TestAssertionException("Fake profile missing.");
                await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + tenant + "/deployments", new Deployment { Name = "collector-default", AgentId = agent.Id, HarnessProfileId = profile.Id }, 201, token).ConfigureAwait(false);
                Run run = await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + tenant + "/agents/" + agent.Id + "/invoke", new InvokeRequest { Input = "collector acceptance", Wait = true, WaitSeconds = 60 }, 200, token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Succeeded, run.Status, "Actual worker run completes with telemetry active");
                List<RunDatabaseUsage> usage = await HttpTestHelpers.SendAsync<List<RunDatabaseUsage>>(host.AdminClient, HttpMethod.Get, "/v1.0/api/tenants/" + tenant + "/runs/" + run.Id + "/database-usage", null, 200, token).ConfigureAwait(false);
                Assert.True(usage.Any(u => u.Operation == "complete" && u.Statements > 0), "Lifecycle SQL is exposed through tenant-scoped API");
                using (McpHttpClient client = new McpHttpClient())
                {
                    client.SetRequestHeader("x-api-key", host.Settings.Auth.AdminApiKey);
                    client.SetRequestHeader("x-tenant-id", tenant);
                    await client.ConnectStreamableAsync(host.McpUrl, "/mcp").ConfigureAwait(false);
                    await client.CallAsync<JsonElement>("tools/call", new { name = "garrison_memory_write", arguments = new { tenantId = tenant, agent = agent.Id, key = "collector", value = "synthetic-memory" } }, 60000).ConfigureAwait(false);
                    await client.CallAsync<JsonElement>("tools/call", new { name = "garrison_memory_read", arguments = new { tenantId = tenant, agent = agent.Id, key = "collector" } }, 60000).ConfigureAwait(false);
                    await client.CallAsync<JsonElement>("tools/call", new { name = "garrison_memory_delete", arguments = new { tenantId = tenant, agent = agent.Id, key = "collector" } }, 60000).ConfigureAwait(false);
                }
                string traceId;
                using (Activity? root = GarrisonTracing.Start("collector:application-acceptance"))
                {
                    traceId = root?.TraceId.ToHexString() ?? throw new TestAssertionException("OTLP activity listener missing.");
                    await ApplicationOperation.MeasureAsync("collector_probe", "outer", ct => ApplicationOperation.MeasureAsync("collector_probe", "inner", inner => host.Server.Context.Database.Runs.ReadAsync(tenant, run.Id, inner), ct), token).ConfigureAwait(false);
                }
                DateTime deadline = DateTime.UtcNow.AddSeconds(65);
                bool metric = false;
                bool trace = false;
                while (DateTime.UtcNow < deadline && (!metric || !trace))
                {
                    string query = Uri.EscapeDataString("garrison_application_operation_duration_seconds_count{component=\"collector_probe\",operation=\"inner\"}");
                    string metrics = await http.GetStringAsync(prometheus.TrimEnd('/') + "/api/v1/query?query=" + query, token).ConfigureAwait(false);
                    string memoryMetrics = await http.GetStringAsync(prometheus.TrimEnd('/') + "/api/v1/query?query=" + Uri.EscapeDataString("garrison_application_operation_duration_seconds_count{component=\"memory\"}"), token).ConfigureAwait(false);
                    string workerMetrics = await http.GetStringAsync(prometheus.TrimEnd('/') + "/api/v1/query?query=" + Uri.EscapeDataString("garrison_application_operation_duration_seconds_count{component=\"workspace\"}"), token).ConfigureAwait(false);
                    metric = metrics.Contains("collector_probe", StringComparison.Ordinal) && memoryMetrics.Contains("memory", StringComparison.Ordinal) && workerMetrics.Contains("workspace", StringComparison.Ordinal);
                    using (HttpResponseMessage response = await http.GetAsync(tempo.TrimEnd('/') + "/api/traces/" + traceId, token).ConfigureAwait(false))
                    {
                        string body = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                        trace = response.IsSuccessStatusCode && body.Contains("stage:collector_probe:inner", StringComparison.Ordinal) && body.Contains("stage:collector_probe:outer", StringComparison.Ordinal) && body.Contains("db ", StringComparison.Ordinal);
                    }
                    if (!metric || !trace) await Task.Delay(1000, token).ConfigureAwait(false);
                }
                Assert.True(metric, "Prometheus scraped the application stage histogram");
                Assert.True(trace, "Tempo stored nested application and database spans through OTLP collector");
                return "PASS live Prometheus application, memory and workspace histograms, OTLP nested application and SQL spans in Tempo, actual worker run, tenant-scoped SQL attribution; trace=" + traceId;
            }
        }
    }
}
