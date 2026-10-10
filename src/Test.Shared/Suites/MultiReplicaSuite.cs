namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Globalization;
    using System.IO;
    using System.Linq;
    using System.Net.Http;
    using System.Text;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database.Ado;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Protocol;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Security;
    using Garrison.Core.Serialization;
    using Garrison.Server.Backplane;
    using Garrison.Server.Protocols;
    using Garrison.Server.Runtime;
    using Garrison.Server.Services;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Multi-replica test mode (Phase 10): two or three in-process control-plane replicas share one Postgresql database
    /// and behave like one. Sqlite runs one replica, so only the drain case runs there.
    /// </summary>
    public static class MultiReplicaSuite
    {
        /// <summary>
        /// Build the suites.
        /// </summary>
        /// <returns>Suites.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            List<TestSuiteDescriptor> suites = new List<TestSuiteDescriptor>();
            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "replicas-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                if (provider == DatabaseTypeEnum.Postgresql)
                {
                    cases.Add(new TestCaseDescriptor(id, "one-migrator-one-leader", "Three replicas starting together: one applies the migrations, one leads maintenance, all report ready (" + provider + ")", ct => OneMigratorOneLeaderAsync(provider, ct)));
                    cases.Add(new TestCaseDescriptor(id, "sse-cross-replica", "A run created on replica A streams its events over SSE from replica B (" + provider + ")", ct => SseAcrossReplicasAsync(provider, ct)));
                    cases.Add(new TestCaseDescriptor(id, "lease-wakeup-notify", "A worker long-polling replica B wakes promptly when a run is created on A (PostgresNotify) (" + provider + ")", ct => LeaseWakeupAsync(provider, BackplaneModeEnum.PostgresNotify, ct)));
                    cases.Add(new TestCaseDescriptor(id, "lease-wakeup-polling", "A worker long-polling replica B wakes promptly when a run is created on A (Polling) (" + provider + ")", ct => LeaseWakeupAsync(provider, BackplaneModeEnum.Polling, ct)));
                    cases.Add(new TestCaseDescriptor(id, "mcp-session-cross-replica", "An MCP session opened on replica A works on B, stays bound to its principal, and closes everywhere (" + provider + ")", ct => McpAcrossReplicasAsync(provider, ct)));
                    cases.Add(new TestCaseDescriptor(id, "nonce-replay", "A signed request accepted by replica A is rejected as a replay by B (" + provider + ")", ct => NonceReplayAsync(provider, ct)));
                    cases.Add(new TestCaseDescriptor(id, "rate-limit-shared", "The token rate limit counts attempts on every replica together (" + provider + ")", ct => RateLimitAsync(provider, ct)));
                    cases.Add(new TestCaseDescriptor(id, "max-concurrent-runs", "maxConcurrentRuns holds under concurrent claims through two replicas (" + provider + ")", ct => MaxConcurrentAsync(provider, ct)));
                    cases.Add(new TestCaseDescriptor(id, "settings-invalidation", "A cluster setting changed on replica A applies on B well before B's refresh interval (" + provider + ")", ct => SettingsInvalidationAsync(provider, ct)));
                    cases.Add(new TestCaseDescriptor(id, "idempotent-invoke", "Invokes with one Idempotency-Key sent to two replicas at once create one run (" + provider + ")", ct => IdempotentInvokeAsync(provider, ct)));
                }
                cases.Add(new TestCaseDescriptor(id, "drain", "Stopping a replica turns readiness off, ends SSE streams, and finishes promptly; liveness stays 200 (" + provider + ")", ct => DrainAsync(provider, ct)));
                suites.Add(new TestSuiteDescriptor(id, "Multiple replicas (" + provider + ")", cases));
            }
            return suites;
        }

        private static string RunsPath(TestReplicaCluster cluster)
        {
            return "/v1.0/api/tenants/" + cluster.TenantId + "/runs";
        }

        private static async Task<Run> InvokeAsync(TestServerHost replica, string tenantId, Agent agent, string input, bool wait, CancellationToken token)
        {
            InvokeRequest request = new InvokeRequest();
            request.Input = input;
            request.Wait = wait;
            request.WaitSeconds = 60;
            TestResponse response = await HttpTestHelpers.SendAsync(replica.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + tenantId + "/agents/" + agent.Id + "/invoke", request, token).ConfigureAwait(false);
            if (response.StatusCode != 200 && response.StatusCode != 202) throw new TestAssertionException("Invoke returned " + response.StatusCode + ": " + response.Body);
            return Serializer.Deserialize<Run>(response.Body) ?? throw new TestAssertionException("Empty run.");
        }

        private static async Task OneMigratorOneLeaderAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestReplicaCluster cluster = await TestReplicaCluster.StartAsync(provider, 3, BackplaneModeEnum.Auto, null, token).ConfigureAwait(false))
            {
                int latest = SchemaBuilder.LatestVersion;
                Assert.Equal(latest, cluster.Replicas.Sum(r => r.Server.Context.Database.MigrationsApplied), "Migrations applied across replicas");
                Assert.Equal(1, cluster.Replicas.Count(r => r.Server.Context.Database.MigrationsApplied > 0), "Replicas that applied migrations");

                foreach (TestServerHost replica in cluster.Replicas)
                {
                    HealthResponse ready = await HttpTestHelpers.SendAsync<HealthResponse>(replica.AdminClient, HttpMethod.Get, "/v1.0/api/health/ready", null, 200, token).ConfigureAwait(false);
                    Assert.Equal("healthy", ready.Status, "Readiness of " + replica.Settings.NodeId);
                    Assert.Equal(latest, ready.SchemaVersion, "Schema version reported by " + replica.Settings.NodeId);
                    Assert.Equal("PostgresNotify", ready.Backplane ?? String.Empty, "Backplane on Postgresql");
                    await HttpTestHelpers.SendAsync<HealthResponse>(replica.AdminClient, HttpMethod.Get, "/v1.0/api/health/live", null, 200, token).ConfigureAwait(false);
                }

                DateTime deadline = DateTime.UtcNow.AddSeconds(20);
                while (cluster.Replicas.Count(r => r.Server.Context.Get<ILeaderState>().IsLeader) != 1 && DateTime.UtcNow < deadline) await Task.Delay(100, token).ConfigureAwait(false);
                Assert.Equal(1, cluster.Replicas.Count(r => r.Server.Context.Get<ILeaderState>().IsLeader), "Leaders");

                TestServerHost leader = cluster.Replicas.Single(r => r.Server.Context.Get<ILeaderState>().IsLeader);
                deadline = DateTime.UtcNow.AddSeconds(15);
                while (leader.Server.Context.Get<MaintenanceService>().LeaderPasses == 0 && DateTime.UtcNow < deadline) await Task.Delay(100, token).ConfigureAwait(false);
                Assert.True(leader.Server.Context.Get<MaintenanceService>().LeaderPasses > 0, "The leader runs maintenance.");
                foreach (TestServerHost follower in cluster.Replicas.Where(r => !ReferenceEquals(r, leader)))
                {
                    Assert.Equal(0L, follower.Server.Context.Get<MaintenanceService>().LeaderPasses, "Maintenance passes on follower " + follower.Settings.NodeId);
                }
            }
        }

        private static async Task SseAcrossReplicasAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestReplicaCluster cluster = await TestReplicaCluster.StartAsync(provider, 2, BackplaneModeEnum.Auto, null, token).ConfigureAwait(false))
            {
                await cluster.AddWorkerAsync(0, null, token).ConfigureAwait(false);
                Agent agent = await cluster.CreateAgentAsync(0, "replica-streamer", d => d.Parameters.Add(new DeploymentParameter { Name = "delayMs", Value = "200" }), token).ConfigureAwait(false);
                Run run = await InvokeAsync(cluster.Replicas[0], cluster.TenantId, agent, "Stream me across replicas", false, token).ConfigureAwait(false);

                TestServerHost b = cluster.Replicas[1];
                long receivedBefore = b.Server.Backplane.Received;
                using (HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, RunsPath(cluster) + "/" + run.Id + "/events/stream"))
                using (HttpResponseMessage response = await b.AdminClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, token).ConfigureAwait(false))
                using (Stream stream = await response.Content.ReadAsStreamAsync(token).ConfigureAwait(false))
                using (StreamReader reader = new StreamReader(stream))
                {
                    int events = 0;
                    bool completed = false;
                    string? currentEvent = null;
                    while (true)
                    {
                        string? line = await reader.ReadLineAsync(token).ConfigureAwait(false);
                        if (line == null) break;
                        if (line.StartsWith("event:", StringComparison.Ordinal)) currentEvent = line.Substring(6).Trim();
                        if (!line.StartsWith("data:", StringComparison.Ordinal)) continue;
                        if (currentEvent == "run.event") events++;
                        if (currentEvent == "run.completed")
                        {
                            Run final = Serializer.Deserialize<Run>(line.Substring(5).Trim()) ?? throw new TestAssertionException("Bad final run.");
                            Assert.Equal(RunStatusEnum.Succeeded, final.Status, "Final status seen on replica B");
                            completed = true;
                            break;
                        }
                    }
                    Assert.True(completed, "The stream on replica B ended without run.completed.");
                    Assert.True(events > 0, "The stream on replica B delivered no events.");
                }
                Assert.True(b.Server.Backplane.Received > receivedBefore, "Replica B heard run changes from replica A over the backplane.");
            }
        }

        private static async Task LeaseWakeupAsync(DatabaseTypeEnum provider, BackplaneModeEnum backplane, CancellationToken token)
        {
            await using (TestReplicaCluster cluster = await TestReplicaCluster.StartAsync(provider, 2, backplane, null, token).ConfigureAwait(false))
            {
                // Replica B re-checks the queue on its own only every 10 seconds, so a prompt claim proves the wake-up
                // came from replica A through the backplane.
                cluster.Replicas[1].Server.Context.Get<RuntimeOptions>().LeasePollMs = 10000;
                await cluster.AddWorkerAsync(1, w => w.LeaseWaitMs = 20000, token).ConfigureAwait(false);
                Agent agent = await cluster.CreateAgentAsync(0, "replica-wakeup", null, token).ConfigureAwait(false);

                // Let the worker settle into a long poll on B, then let B's own poll pass.
                await Task.Delay(1500, token).ConfigureAwait(false);

                List<long> latencies = new List<long>();
                for (int attempt = 0; attempt < 3; attempt++)
                {
                    Stopwatch timer = Stopwatch.StartNew();
                    Run run = await InvokeAsync(cluster.Replicas[0], cluster.TenantId, agent, "wake " + attempt, false, token).ConfigureAwait(false);
                    while (timer.ElapsedMilliseconds < 15000)
                    {
                        Run? current = await cluster.Replicas[0].Server.Context.Database.Runs.ReadAsync(run.Id, token).ConfigureAwait(false);
                        if (current != null && current.Status != RunStatusEnum.Queued && current.Status != RunStatusEnum.Pending) break;
                        await Task.Delay(20, token).ConfigureAwait(false);
                    }
                    latencies.Add(timer.ElapsedMilliseconds);
                    await cluster.Replicas[0].Server.Context.Get<RunService>().WaitAsync(cluster.TenantId, run.Id, 60, token).ConfigureAwait(false);
                    await Task.Delay(500, token).ConfigureAwait(false);
                }
                Assert.True(latencies.Max() < 3000, "Claim latency across replicas (ms): " + String.Join(", ", latencies) + "; without the backplane B would wait up to 10000 ms.");
            }
        }

        private static async Task<McpReply> McpPostAsync(HttpClient http, string url, string? sessionId, string body, CancellationToken token)
        {
            using (HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Post, url))
            {
                request.Content = new StringContent(body, Encoding.UTF8, "application/json");
                request.Headers.TryAddWithoutValidation("Accept", "application/json, text/event-stream");
                if (sessionId != null)
                {
                    request.Headers.TryAddWithoutValidation("MCP-Session-Id", sessionId);
                    request.Headers.TryAddWithoutValidation("MCP-Protocol-Version", "2025-06-18");
                }
                using (HttpResponseMessage response = await http.SendAsync(request, token).ConfigureAwait(false))
                {
                    McpReply reply = new McpReply();
                    reply.Status = (int)response.StatusCode;
                    if (response.Headers.TryGetValues("MCP-Session-Id", out IEnumerable<string>? values)) reply.SessionId = values.FirstOrDefault();
                    string text = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                    if (String.Equals(response.Content.Headers.ContentType?.MediaType, "text/event-stream", StringComparison.OrdinalIgnoreCase))
                    {
                        string? data = text.Split('\n').Select(l => l.Trim()).Where(l => l.StartsWith("data:", StringComparison.Ordinal)).Select(l => l.Substring(5).Trim()).LastOrDefault(l => l.Contains("\"jsonrpc\"", StringComparison.Ordinal));
                        text = data ?? text;
                    }
                    reply.Body = text;
                    return reply;
                }
            }
        }

        private static async Task<int> McpDeleteAsync(HttpClient http, string url, string sessionId, CancellationToken token)
        {
            using (HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Delete, url))
            {
                request.Headers.TryAddWithoutValidation("MCP-Session-Id", sessionId);
                using (HttpResponseMessage response = await http.SendAsync(request, token).ConfigureAwait(false))
                {
                    return (int)response.StatusCode;
                }
            }
        }

        private static async Task McpAcrossReplicasAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestReplicaCluster cluster = await TestReplicaCluster.StartAsync(provider, 2, BackplaneModeEnum.Auto, null, token).ConfigureAwait(false))
            {
                await cluster.CreateAgentAsync(0, "mcp-replica-echo", null, token).ConfigureAwait(false);
                string urlA = cluster.Replicas[0].McpUrl + "/mcp";
                string urlB = cluster.Replicas[1].McpUrl + "/mcp";
                using (HttpClient admin = new HttpClient())
                using (HttpClient other = new HttpClient())
                {
                    admin.DefaultRequestHeaders.Add("x-api-key", cluster.Replicas[0].Settings.Auth.AdminApiKey);
                    admin.DefaultRequestHeaders.Add("x-tenant-id", cluster.TenantId);
                    other.DefaultRequestHeaders.Add("x-access-key", cluster.Replicas[0].Settings.Security.DefaultAccessKey);
                    other.DefaultRequestHeaders.Add("x-secret-key", cluster.Replicas[0].Settings.Security.DefaultSecretKey);

                    McpReply init = await McpPostAsync(admin, urlA, null, "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"initialize\",\"params\":{\"protocolVersion\":\"2025-06-18\",\"capabilities\":{},\"clientInfo\":{\"name\":\"replica-test\",\"version\":\"1.0\"}}}", token).ConfigureAwait(false);
                    Assert.Equal(200, init.Status, "initialize on A: " + init.Body);
                    string session = init.SessionId ?? throw new TestAssertionException("initialize returned no MCP-Session-Id.");
                    Assert.True(session.StartsWith("mcs_", StringComparison.Ordinal), "Clients receive cluster session identifiers: " + session);
                    McpReply initialized = await McpPostAsync(admin, urlA, session, "{\"jsonrpc\":\"2.0\",\"method\":\"notifications/initialized\"}", token).ConfigureAwait(false);
                    Assert.True(initialized.Status == 202 || initialized.Status == 200, "notifications/initialized on A returned " + initialized.Status);

                    McpReply listOnB = await McpPostAsync(admin, urlB, session, "{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"tools/list\",\"params\":{}}", token).ConfigureAwait(false);
                    Assert.Equal(200, listOnB.Status, "tools/list on B with A's session: " + listOnB.Body);
                    Assert.True(listOnB.Body.Contains("garrison_list_agents", StringComparison.Ordinal), "tools/list on B: " + listOnB.Body);
                    Assert.True(cluster.Replicas[1].Server.Context.Get<GarrisonMcpServer>().Proxy!.Rehydrations >= 1, "Replica B replayed the session's handshake.");

                    McpReply callOnB = await McpPostAsync(admin, urlB, session, "{\"jsonrpc\":\"2.0\",\"id\":3,\"method\":\"tools/call\",\"params\":{\"name\":\"garrison_list_agents\",\"arguments\":{\"tenantId\":\"" + cluster.TenantId + "\"}}}", token).ConfigureAwait(false);
                    Assert.Equal(200, callOnB.Status, "tools/call on B: " + callOnB.Body);
                    Assert.True(callOnB.Body.Contains("mcp-replica-echo", StringComparison.Ordinal), "tools/call on B lists the agent: " + callOnB.Body);

                    McpReply listOnA = await McpPostAsync(admin, urlA, session, "{\"jsonrpc\":\"2.0\",\"id\":4,\"method\":\"tools/list\",\"params\":{}}", token).ConfigureAwait(false);
                    Assert.Equal(200, listOnA.Status, "tools/list back on A: " + listOnA.Body);

                    McpReply hijack = await McpPostAsync(other, urlB, session, "{\"jsonrpc\":\"2.0\",\"id\":5,\"method\":\"tools/list\",\"params\":{}}", token).ConfigureAwait(false);
                    Assert.Equal(404, hijack.Status, "Another principal cannot use the session: " + hijack.Body);

                    Assert.Equal(200, await McpDeleteAsync(admin, urlB, session, token).ConfigureAwait(false), "DELETE on B");
                    int status = 0;
                    DateTime deadline = DateTime.UtcNow.AddSeconds(5);
                    while (DateTime.UtcNow < deadline)
                    {
                        McpReply after = await McpPostAsync(admin, urlA, session, "{\"jsonrpc\":\"2.0\",\"id\":6,\"method\":\"tools/list\",\"params\":{}}", token).ConfigureAwait(false);
                        status = after.Status;
                        if (status == 404) break;
                        await Task.Delay(100, token).ConfigureAwait(false);
                    }
                    Assert.Equal(404, status, "A session closed on B is gone on A");
                }
            }
        }

        private static async Task NonceReplayAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestReplicaCluster cluster = await TestReplicaCluster.StartAsync(provider, 2, BackplaneModeEnum.Auto, null, token).ConfigureAwait(false))
            {
                string accessKey = cluster.Replicas[0].Settings.Security.DefaultAccessKey;
                string secretKey = cluster.Replicas[0].Settings.Security.DefaultSecretKey;
                string date = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ", CultureInfo.InvariantCulture);
                string nonce = Guid.NewGuid().ToString("N");
                string signature = RequestSigner.Sign(secretKey, RequestSigner.Canonicalize("GET", "/v1.0/token/details", null, cluster.TenantId, date, nonce, null));

                List<int> statuses = new List<int>();
                foreach (TestServerHost replica in cluster.Replicas)
                {
                    using (HttpClient client = new HttpClient())
                    {
                        client.BaseAddress = new Uri(replica.BaseUrl);
                        client.DefaultRequestHeaders.Add("x-access-key", accessKey);
                        client.DefaultRequestHeaders.Add("x-date", date);
                        client.DefaultRequestHeaders.Add("x-nonce", nonce);
                        client.DefaultRequestHeaders.Add("x-signature", signature);
                        statuses.Add((await HttpTestHelpers.SendAsync(client, HttpMethod.Get, "/v1.0/token/details", null, token).ConfigureAwait(false)).StatusCode);
                    }
                }
                Assert.Equal(200, statuses[0], "Signed request on replica A");
                Assert.Equal(401, statuses[1], "The same signed request replayed on replica B");
            }
        }

        private static async Task RateLimitAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestReplicaCluster cluster = await TestReplicaCluster.StartAsync(provider, 2, BackplaneModeEnum.Auto, s => s.Auth.RateLimitPerMinute = 3, token).ConfigureAwait(false))
            {
                for (int attempt = 0; attempt < 2; attempt++)
                {
                    long minute = DateTime.UtcNow.Ticks / TimeSpan.TicksPerMinute;
                    List<int> statuses = new List<int>();
                    for (int i = 0; i < 4; i++)
                    {
                        TestServerHost replica = cluster.Replicas[i % 2];
                        using (HttpClient anonymous = new HttpClient())
                        {
                            anonymous.BaseAddress = new Uri(replica.BaseUrl);
                            TestResponse response = await HttpTestHelpers.SendAsync(anonymous, HttpMethod.Post, "/v1.0/token", new TokenRequest { TenantId = cluster.TenantId, Email = "nobody@example.com", Password = "wrong" }, token).ConfigureAwait(false);
                            statuses.Add(response.StatusCode);
                        }
                    }
                    if (DateTime.UtcNow.Ticks / TimeSpan.TicksPerMinute != minute && attempt == 0) continue;
                    Assert.Equal("401,401,401,429", String.Join(",", statuses), "Statuses across replicas A, B, A, B with a limit of 3 per minute");
                    return;
                }
            }
        }

        private static async Task MaxConcurrentAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestReplicaCluster cluster = await TestReplicaCluster.StartAsync(provider, 2, BackplaneModeEnum.Auto, null, token).ConfigureAwait(false))
            {
                Agent agent = await cluster.CreateAgentAsync(0, "replica-limited", d => d.MaxConcurrentRuns = 2, token).ConfigureAwait(false);
                for (int i = 0; i < 10; i++) await InvokeAsync(cluster.Replicas[i % 2], cluster.TenantId, agent, "limited " + i, false, token).ConfigureAwait(false);

                List<Node> nodes = new List<Node>();
                for (int i = 0; i < 6; i++)
                {
                    Node node = new Node();
                    node.Name = "fake-node-" + i + "-" + Guid.NewGuid().ToString("N").Substring(0, 4);
                    node.Status = NodeStatusEnum.Ready;
                    node.MaxConcurrentRuns = 8;
                    node.LastHeartbeatUtc = DateTime.UtcNow;
                    node.Capabilities.Add(new NodeCapability { HarnessType = HarnessTypeEnum.Generic, Available = true });
                    nodes.Add(await cluster.Replicas[0].Server.Context.Database.Nodes.CreateAsync(node, token).ConfigureAwait(false));
                }

                NodeLeaseResponse[] responses = await Task.WhenAll(nodes.Select((node, i) => Task.Run(async () =>
                {
                    SchedulerService scheduler = cluster.Replicas[i % 2].Server.Context.Get<SchedulerService>();
                    NodeLeaseRequest request = new NodeLeaseRequest();
                    request.NodeId = node.Id;
                    request.MaxRuns = 4;
                    request.WaitMs = 0;
                    return await scheduler.LeaseAsync(node, request, token).ConfigureAwait(false);
                }, token))).ConfigureAwait(false);

                int claimed = responses.Sum(r => r.Assignments.Count);
                Assert.Equal(2, claimed, "Runs leased across both replicas with maxConcurrentRuns 2");
                RunFilter filter = new RunFilter();
                filter.TenantId = cluster.TenantId;
                filter.AgentId = agent.Id;
                filter.Status = RunStatusEnum.Leased;
                filter.MaxResults = 100;
                Assert.Equal(2L, (await cluster.Replicas[1].Server.Context.Database.Runs.EnumerateAsync(filter, token).ConfigureAwait(false)).TotalRecords, "Leased runs in the database");
            }
        }

        private static async Task SettingsInvalidationAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestReplicaCluster cluster = await TestReplicaCluster.StartAsync(provider, 2, BackplaneModeEnum.Auto, null, token).ConfigureAwait(false))
            {
                ClusterSettingsService a = cluster.Replicas[0].Server.Context.Get<ClusterSettingsService>();
                ClusterSettingsService b = cluster.Replicas[1].Server.Context.Get<ClusterSettingsService>();
                b.RefreshIntervalMs = 600000;
                await Task.Delay(3500, token).ConfigureAwait(false);

                int before = b.GetInt("Runs.MaxDelegationDepth");
                int changed = before == 5 ? 4 : 5;
                Stopwatch timer = Stopwatch.StartNew();
                await a.SetAsync("Runs.MaxDelegationDepth", changed.ToString(CultureInfo.InvariantCulture), "test", token).ConfigureAwait(false);
                while (b.GetInt("Runs.MaxDelegationDepth") != changed && timer.ElapsedMilliseconds < 5000) await Task.Delay(20, token).ConfigureAwait(false);
                Assert.Equal(changed, b.GetInt("Runs.MaxDelegationDepth"), "Setting on replica B after " + timer.ElapsedMilliseconds + " ms");
                Assert.True(timer.ElapsedMilliseconds < 2000, "Replica B applied the change in " + timer.ElapsedMilliseconds + " ms.");

                DateTime deadline = DateTime.UtcNow.AddSeconds(5);
                while (cluster.Replicas[1].Server.Context.Get<RuntimeOptions>().MaxDelegationDepth != changed && DateTime.UtcNow < deadline) await Task.Delay(20, token).ConfigureAwait(false);
                Assert.Equal(changed, cluster.Replicas[1].Server.Context.Get<RuntimeOptions>().MaxDelegationDepth, "Runtime options on replica B");
            }
        }

        private static async Task IdempotentInvokeAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestReplicaCluster cluster = await TestReplicaCluster.StartAsync(provider, 2, BackplaneModeEnum.Auto, null, token).ConfigureAwait(false))
            {
                Agent agent = await cluster.CreateAgentAsync(0, "replica-idempotent", null, token).ConfigureAwait(false);
                string key = "load-" + Guid.NewGuid().ToString("N");
                List<Task<string>> sends = new List<Task<string>>();
                for (int i = 0; i < 6; i++)
                {
                    TestServerHost replica = cluster.Replicas[i % 2];
                    sends.Add(Task.Run(async () =>
                    {
                        using (HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Post, "/v1.0/api/tenants/" + cluster.TenantId + "/agents/" + agent.Id + "/invoke"))
                        {
                            request.Headers.Add("Idempotency-Key", key);
                            request.Content = new StringContent(Serializer.Serialize(new InvokeRequest { Input = "same", Wait = false }), Encoding.UTF8, "application/json");
                            using (HttpResponseMessage response = await replica.AdminClient.SendAsync(request, token).ConfigureAwait(false))
                            {
                                string body = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                                Run run = Serializer.Deserialize<Run>(body) ?? throw new TestAssertionException("Empty run: " + body);
                                return run.Id;
                            }
                        }
                    }, token));
                }
                string[] ids = await Task.WhenAll(sends).ConfigureAwait(false);
                Assert.Equal(1, ids.Distinct().Count(), "Runs created for one Idempotency-Key across replicas: " + String.Join(", ", ids.Distinct()));
            }
        }

        private static async Task DrainAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestReplicaCluster cluster = await TestReplicaCluster.StartAsync(provider, 1, BackplaneModeEnum.Auto, null, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Replicas[0];
                Agent agent = await cluster.CreateAgentAsync(0, "drain-agent", null, token).ConfigureAwait(false);
                Run run = await InvokeAsync(host, cluster.TenantId, agent, "nobody will run this", false, token).ConfigureAwait(false);

                using (HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, RunsPath(cluster) + "/" + run.Id + "/events/stream"))
                using (HttpResponseMessage response = await host.AdminClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, token).ConfigureAwait(false))
                using (Stream stream = await response.Content.ReadAsStreamAsync(token).ConfigureAwait(false))
                using (StreamReader reader = new StreamReader(stream))
                {
                    Task<string> readAll = Task.Run(async () =>
                    {
                        try
                        {
                            return await reader.ReadToEndAsync(token).ConfigureAwait(false);
                        }
                        catch (Exception e) when (e is IOException || e is HttpRequestException)
                        {
                            return "closed: " + e.Message;
                        }
                    }, token);
                    await Task.Delay(500, token).ConfigureAwait(false);

                    // Draining starts: readiness turns off at once while liveness stays on.
                    host.Server.Context.BeginShutdown();
                    TestResponse ready = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, "/v1.0/api/health/ready", null, token).ConfigureAwait(false);
                    Assert.Equal(503, ready.StatusCode, "Readiness while draining: " + ready.Body);
                    Assert.True(ready.Body.Contains("draining", StringComparison.Ordinal), "Readiness says draining: " + ready.Body);
                    TestResponse live = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, "/v1.0/api/health/live", null, token).ConfigureAwait(false);
                    Assert.Equal(200, live.StatusCode, "Liveness while draining");

                    await Task.WhenAny(readAll, Task.Delay(10000, token)).ConfigureAwait(false);
                    Assert.True(readAll.IsCompleted, "The SSE stream should end once the replica drains.");
                    Assert.True(readAll.Result.Contains("server.draining", StringComparison.Ordinal) || readAll.Result.StartsWith("closed", StringComparison.Ordinal), "Stream ending: " + readAll.Result);

                    Stopwatch timer = Stopwatch.StartNew();
                    await host.Server.StopAsync(token).ConfigureAwait(false);
                    Assert.True(timer.ElapsedMilliseconds < 20000, "Stop took " + timer.ElapsedMilliseconds + " ms.");
                }
            }
        }
    }
}
