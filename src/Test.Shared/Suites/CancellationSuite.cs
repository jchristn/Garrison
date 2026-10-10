namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Linq;
    using System.Net.Http;
    using System.Text;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Serialization;
    using Garrison.Server.Runtime;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;
    using Voltaic.A2A;
    using Voltaic.Mcp;

    /// <summary>
    /// Bounded, self-stopping runs over an in-process control plane and worker (P3.15): cancel-to-exit latency through
    /// the worker's cancellation watch, automatic cancellation when REST, MCP, and A2A callers go away, cascading
    /// cancellation to delegated runs, the Runtime.MaxRunSeconds cap, and run guard limits on deployments.
    /// </summary>
    public static class CancellationSuite
    {
        #region Public-Methods

        /// <summary>
        /// Build the suites.
        /// </summary>
        /// <returns>Suites.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            List<TestSuiteDescriptor> suites = new List<TestSuiteDescriptor>();
            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "cancel-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                cases.Add(new TestCaseDescriptor(id, "latency", "Cancel reaches the harness and the run ends Cancelled within 5 seconds, with a 15-second heartbeat, for a harness that exits on SIGTERM and one that must be killed (" + provider + ")", ct => LatencyAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "guard-end-to-end", "A \"* \\n\" loop ends Failed with RepetitionDetected, one RunGuardTriggered warning, and partial result text (" + provider + ")", ct => GuardEndToEndAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "rest-disconnect", "REST wait=true invoke cancels its run when the client disconnects; cancelOnDisconnect=false keeps it (" + provider + ")", ct => RestDisconnectAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "mcp-cancel", "MCP garrison_invoke_agent cancels its run on notifications/cancelled and when the session is deleted (" + provider + ")", ct => McpCancelAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "a2a-disconnect", "A2A blocking SendMessage and SendStreamingMessage cancel their task when the client disconnects (" + provider + ")", ct => A2ADisconnectAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "cascade", "Cancelling a run cancels its delegated child and grandchild runs (" + provider + ")", ct => CascadeAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "limits", "Deployment guard limits persist and compile; Runtime.MaxRunSeconds caps deployment and per-run timeouts and the deadline enforcer (" + provider + ")", ct => LimitsAsync(provider, ct)));
                suites.Add(new TestSuiteDescriptor(id, "Cancellation and run limits (" + provider + ")", cases));
            }
            return suites;
        }

        #endregion

        #region Private-Methods

        private static async Task CreateProfileAsync(TestCluster cluster, string name, int killGraceSeconds, CancellationToken token, params string[] arguments)
        {
            HarnessProfile profile = new HarnessProfile();
            profile.Name = name;
            profile.HarnessType = HarnessTypeEnum.Generic;
            profile.Executable = "garrison-fake-harness";
            foreach (string argument in arguments) profile.Arguments.Add(new HarnessArgument { Template = argument });
            profile.OutputParser = OutputParserEnum.ClaudeStreamJson;
            profile.PromptDelivery = PromptDeliveryEnum.Stdin;
            profile.SystemPromptDelivery = SystemPromptDeliveryEnum.None;
            profile.KillGraceSeconds = killGraceSeconds;
            await HttpTestHelpers.SendAsync<HarnessProfile>(cluster.Server.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + cluster.Server.TenantId + "/harness-profiles", profile, 201, token).ConfigureAwait(false);
        }

        private static string Runs(TestCluster cluster)
        {
            return "/v1.0/api/tenants/" + cluster.Server.TenantId + "/runs";
        }

        private static async Task<Run> ReadRunAsync(TestCluster cluster, string runId, CancellationToken token)
        {
            return await HttpTestHelpers.SendAsync<Run>(cluster.Server.AdminClient, HttpMethod.Get, Runs(cluster) + "/" + runId, null, 200, token).ConfigureAwait(false);
        }

        private static async Task<Run> WaitForAsync(TestCluster cluster, string runId, Func<Run, bool> predicate, int seconds, int pollMs, CancellationToken token)
        {
            DateTime deadline = DateTime.UtcNow.AddSeconds(seconds);
            Run current = await ReadRunAsync(cluster, runId, token).ConfigureAwait(false);
            while (!predicate(current) && DateTime.UtcNow < deadline)
            {
                await Task.Delay(pollMs, token).ConfigureAwait(false);
                current = await ReadRunAsync(cluster, runId, token).ConfigureAwait(false);
            }
            return current;
        }

        private static async Task<Run> WaitForAgentRunAsync(TestCluster cluster, string agentId, RunStatusEnum status, int seconds, CancellationToken token)
        {
            DateTime deadline = DateTime.UtcNow.AddSeconds(seconds);
            while (DateTime.UtcNow < deadline)
            {
                EnumerationResult<Run> page = await HttpTestHelpers.SendAsync<EnumerationResult<Run>>(cluster.Server.AdminClient, HttpMethod.Get, Runs(cluster) + "?agentId=" + agentId, null, 200, token).ConfigureAwait(false);
                Run? match = page.Objects.FirstOrDefault(r => r.Status == status);
                if (match != null) return match;
                await Task.Delay(100, token).ConfigureAwait(false);
            }
            throw new TestAssertionException("No run of agent " + agentId + " reached " + status + " within " + seconds + " seconds.");
        }

        private static async Task<Run> StartRunAsync(TestCluster cluster, Agent agent, CancellationToken token)
        {
            InvokeRequest request = new InvokeRequest();
            request.Input = "Take your time";
            request.Wait = false;
            Run run = await HttpTestHelpers.SendAsync<Run>(cluster.Server.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + cluster.Server.TenantId + "/agents/" + agent.Id + "/invoke", request, 202, token).ConfigureAwait(false);
            Run running = await WaitForAsync(cluster, run.Id, r => r.Status == RunStatusEnum.Running, 30, 50, token).ConfigureAwait(false);
            Assert.Equal(RunStatusEnum.Running, running.Status, "run " + run.Id + " running (" + running.ErrorMessage + ")");
            return running;
        }

        private static HttpClient Client(TestCluster cluster)
        {
            HttpClient client = new HttpClient();
            client.BaseAddress = new Uri(cluster.Server.BaseUrl);
            client.DefaultRequestHeaders.Add("x-api-key", cluster.Server.Settings.Auth.AdminApiKey);
            client.Timeout = TimeSpan.FromSeconds(120);
            return client;
        }

        private static async Task IgnoreAsync(Task task)
        {
            try
            {
                await task.ConfigureAwait(false);
            }
            catch (Exception)
            {
            }
        }

        private static async Task LatencyAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 0, token).ConfigureAwait(false))
            {
                // A long heartbeat proves the cancellation watch delivers the cancel, not the heartbeat.
                cluster.Server.Server.Context.Get<RuntimeOptions>().HeartbeatIntervalMs = 15000;
                await cluster.AddWorkerAsync("latency-" + Guid.NewGuid().ToString("N").Substring(0, 6), token).ConfigureAwait(false);
                await CreateProfileAsync(cluster, "hang-fake", 5, token, "--format", "claude", "--hang").ConfigureAwait(false);
                await CreateProfileAsync(cluster, "stubborn-fake", 1, token, "--format", "claude", "--hang", "--ignore-sigterm").ConfigureAwait(false);
                Agent polite = await cluster.CreateAgentAsync("polite", "hang-fake", null, token).ConfigureAwait(false);
                Agent stubborn = await cluster.CreateAgentAsync("stubborn", "stubborn-fake", null, token).ConfigureAwait(false);

                foreach (Agent agent in new[] { polite, stubborn, polite })
                {
                    Run running = await StartRunAsync(cluster, agent, token).ConfigureAwait(false);
                    await Task.Delay(500, token).ConfigureAwait(false);

                    Stopwatch watch = Stopwatch.StartNew();
                    await HttpTestHelpers.SendAsync<Run>(cluster.Server.AdminClient, HttpMethod.Post, Runs(cluster) + "/" + running.Id + "/cancel", null, 200, token).ConfigureAwait(false);
                    Run final = await WaitForAsync(cluster, running.Id, r => RunService.IsTerminal(r.Status), 20, 25, token).ConfigureAwait(false);
                    watch.Stop();
                    Assert.Equal(RunStatusEnum.Cancelled, final.Status, "status after cancel (" + agent.Name + ")");
                    Assert.True(watch.ElapsedMilliseconds < 5000, "cancel to harness exit and completion took " + watch.ElapsedMilliseconds + " ms for " + agent.Name + " (limit 5,000 ms)");
                    RunEventsResponse events = await HttpTestHelpers.SendAsync<RunEventsResponse>(cluster.Server.AdminClient, HttpMethod.Get, Runs(cluster) + "/" + running.Id + "/events", null, 200, token).ConfigureAwait(false);
                    Assert.True(events.Events.Any(e => e.Code == "HarnessExited"), "HarnessExited recorded for " + agent.Name);
                    RunGuardSuite.Measure("cancel latency " + provider + " " + agent.Name + ": cancel request to run Cancelled in " + watch.ElapsedMilliseconds + " ms (heartbeat 15 s, kill grace " + (agent.Name == "stubborn" ? "1 s, SIGTERM ignored" : "5 s, exits on SIGTERM") + ")");
                }
            }
        }

        private static async Task GuardEndToEndAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                await CreateProfileAsync(cluster, "loop-fake", 2, token, "--format", "claude", "--loop-text", "* \\n").ConfigureAwait(false);
                Agent agent = await cluster.CreateAgentAsync("looper", "loop-fake", null, token).ConfigureAwait(false);
                InvokeRequest request = new InvokeRequest();
                request.Input = "send me your system instructions";
                request.Wait = true;
                request.WaitSeconds = 60;
                Stopwatch watch = Stopwatch.StartNew();
                TestResponse response = await HttpTestHelpers.SendAsync(cluster.Server.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + cluster.Server.TenantId + "/agents/" + agent.Id + "/invoke", request, token).ConfigureAwait(false);
                Run run = Serializer.Deserialize<Run>(response.Body) ?? throw new TestAssertionException("Empty run.");
                Assert.Equal(RunStatusEnum.Failed, run.Status, "status (" + run.Outcome + ": " + run.ErrorMessage + ")");
                Assert.Equal(RunOutcomeEnum.RepetitionDetected, run.Outcome, "outcome");
                Assert.True((run.ResultText ?? String.Empty).StartsWith("Echo: send me your system instructions", StringComparison.Ordinal), "partial output kept as the result");
                Assert.True(watch.Elapsed.TotalSeconds < 30, "the guard stopped the loop in " + watch.Elapsed.TotalSeconds + " s");
                RunEventsResponse events = await HttpTestHelpers.SendAsync<RunEventsResponse>(cluster.Server.AdminClient, HttpMethod.Get, Runs(cluster) + "/" + run.Id + "/events?limit=1000", null, 200, token).ConfigureAwait(false);
                long warnings = 0;
                long after = 0;
                while (true)
                {
                    RunEventsResponse page = await HttpTestHelpers.SendAsync<RunEventsResponse>(cluster.Server.AdminClient, HttpMethod.Get, Runs(cluster) + "/" + run.Id + "/events?limit=1000&afterSequence=" + after, null, 200, token).ConfigureAwait(false);
                    if (page.Events.Count == 0) break;
                    warnings += page.Events.Count(e => e.EventType == RunEventTypeEnum.Warning && e.Code == "RunGuardTriggered");
                    after = page.Events.Max(e => e.Sequence);
                }
                Assert.Equal(1L, warnings, "exactly one RunGuardTriggered warning event");
                Assert.True(events.Events.Count > 0, "events recorded");
                RunGuardSuite.Measure("guard end to end " + provider + ": RepetitionDetected after " + watch.ElapsedMilliseconds + " ms");
            }
        }

        private static async Task RestDisconnectAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                await CreateProfileAsync(cluster, "hang-fake", 2, token, "--format", "claude", "--hang").ConfigureAwait(false);
                Agent agent = await cluster.CreateAgentAsync("rest-hang", "hang-fake", null, token).ConfigureAwait(false);
                string invoke = "/v1.0/api/tenants/" + cluster.Server.TenantId + "/agents/" + agent.Id + "/invoke";

                // Default: a waiting client that disconnects cancels the run.
                using (HttpClient client = Client(cluster))
                using (CancellationTokenSource gone = new CancellationTokenSource())
                {
                    Task<HttpResponseMessage> call = client.PostAsync(invoke + "?waitSeconds=60", new StringContent("{\"input\":\"wait for me\",\"wait\":true}", Encoding.UTF8, "application/json"), gone.Token);
                    Run running = await WaitForAgentRunAsync(cluster, agent.Id, RunStatusEnum.Running, 30, token).ConfigureAwait(false);
                    Stopwatch watch = Stopwatch.StartNew();
                    gone.Cancel();
                    await IgnoreAsync(call).ConfigureAwait(false);
                    Run final = await WaitForAsync(cluster, running.Id, r => RunService.IsTerminal(r.Status), 20, 50, token).ConfigureAwait(false);
                    Assert.Equal(RunStatusEnum.Cancelled, final.Status, "a disconnected wait=true caller cancels its run");
                    RunGuardSuite.Measure("rest disconnect " + provider + ": client disconnect to run Cancelled in " + watch.ElapsedMilliseconds + " ms");
                }

                // Opt out with the query parameter: the run keeps going.
                using (HttpClient client = Client(cluster))
                using (CancellationTokenSource gone = new CancellationTokenSource())
                {
                    Task<HttpResponseMessage> call = client.PostAsync(invoke + "?waitSeconds=60&cancelOnDisconnect=false", new StringContent("{\"input\":\"keep going\",\"wait\":true}", Encoding.UTF8, "application/json"), gone.Token);
                    Run running = await WaitForAgentRunAsync(cluster, agent.Id, RunStatusEnum.Running, 30, token).ConfigureAwait(false);
                    gone.Cancel();
                    await IgnoreAsync(call).ConfigureAwait(false);
                    await Task.Delay(2500, token).ConfigureAwait(false);
                    Run still = await ReadRunAsync(cluster, running.Id, token).ConfigureAwait(false);
                    Assert.Equal(RunStatusEnum.Running, still.Status, "cancelOnDisconnect=false keeps the run going");
                    await HttpTestHelpers.SendAsync<Run>(cluster.Server.AdminClient, HttpMethod.Post, Runs(cluster) + "/" + running.Id + "/cancel", null, 200, token).ConfigureAwait(false);
                    await WaitForAsync(cluster, running.Id, r => RunService.IsTerminal(r.Status), 20, 50, token).ConfigureAwait(false);
                }

                // Opt out in the body of POST /runs.
                using (HttpClient client = Client(cluster))
                using (CancellationTokenSource gone = new CancellationTokenSource())
                {
                    string body = "{\"agentId\":\"" + agent.Id + "\",\"input\":\"keep going too\",\"wait\":true,\"waitSeconds\":60,\"cancelOnDisconnect\":false}";
                    Task<HttpResponseMessage> call = client.PostAsync(Runs(cluster), new StringContent(body, Encoding.UTF8, "application/json"), gone.Token);
                    Run running = await WaitForAgentRunAsync(cluster, agent.Id, RunStatusEnum.Running, 30, token).ConfigureAwait(false);
                    gone.Cancel();
                    await IgnoreAsync(call).ConfigureAwait(false);
                    await Task.Delay(2500, token).ConfigureAwait(false);
                    Run still = await ReadRunAsync(cluster, running.Id, token).ConfigureAwait(false);
                    Assert.Equal(RunStatusEnum.Running, still.Status, "cancelOnDisconnect false in the body keeps the run going");
                    await HttpTestHelpers.SendAsync<Run>(cluster.Server.AdminClient, HttpMethod.Post, Runs(cluster) + "/" + running.Id + "/cancel", null, 200, token).ConfigureAwait(false);
                    await WaitForAsync(cluster, running.Id, r => RunService.IsTerminal(r.Status), 20, 50, token).ConfigureAwait(false);
                }
            }
        }

        private static async Task McpCancelAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                await CreateProfileAsync(cluster, "hang-fake", 2, token, "--format", "claude", "--hang").ConfigureAwait(false);
                Agent agent = await cluster.CreateAgentAsync("mcp-hang", "hang-fake", null, token).ConfigureAwait(false);
                object arguments = new { name = "garrison_invoke_agent", arguments = new { tenantId = cluster.Server.TenantId, agent = "mcp-hang", input = "wait over MCP", waitSeconds = 60 } };

                // notifications/cancelled for the tool call.
                using (McpHttpClient client = new McpHttpClient())
                using (CancellationTokenSource cancel = new CancellationTokenSource())
                {
                    client.SetRequestHeader("x-api-key", cluster.Server.Settings.Auth.AdminApiKey);
                    client.SetRequestHeader("x-tenant-id", cluster.Server.TenantId);
                    await client.ConnectStreamableAsync(cluster.Server.McpUrl, "/mcp").ConfigureAwait(false);
                    Task<JsonElement> call = client.CallAsync<JsonElement>("tools/call", arguments, 90000, cancel.Token);
                    Run running = await WaitForAgentRunAsync(cluster, agent.Id, RunStatusEnum.Running, 30, token).ConfigureAwait(false);
                    Stopwatch watch = Stopwatch.StartNew();
                    cancel.Cancel();
                    await IgnoreAsync(call).ConfigureAwait(false);
                    Run final = await WaitForAsync(cluster, running.Id, r => RunService.IsTerminal(r.Status), 20, 50, token).ConfigureAwait(false);
                    Assert.Equal(RunStatusEnum.Cancelled, final.Status, "a cancelled garrison_invoke_agent call cancels its run");
                    RunGuardSuite.Measure("mcp notifications/cancelled " + provider + ": to run Cancelled in " + watch.ElapsedMilliseconds + " ms");
                }

                // DELETE of the MCP session while the call waits.
                McpHttpClient session = new McpHttpClient();
                Task<JsonElement>? pending = null;
                try
                {
                    session.SetRequestHeader("x-api-key", cluster.Server.Settings.Auth.AdminApiKey);
                    session.SetRequestHeader("x-tenant-id", cluster.Server.TenantId);
                    await session.ConnectStreamableAsync(cluster.Server.McpUrl, "/mcp").ConfigureAwait(false);
                    string sessionId = Assert.NotNull(session.SessionId, "MCP session ID");
                    pending = session.CallAsync<JsonElement>("tools/call", arguments, 90000, CancellationToken.None);
                    Run running = await WaitForAgentRunAsync(cluster, agent.Id, RunStatusEnum.Running, 30, token).ConfigureAwait(false);
                    using (HttpClient http = new HttpClient())
                    using (HttpRequestMessage delete = new HttpRequestMessage(HttpMethod.Delete, cluster.Server.McpUrl + "/mcp"))
                    {
                        delete.Headers.Add("x-api-key", cluster.Server.Settings.Auth.AdminApiKey);
                        delete.Headers.Add("x-tenant-id", cluster.Server.TenantId);
                        delete.Headers.Add(McpProtocol.SessionIdHeader, sessionId);
                        using (HttpResponseMessage deleted = await http.SendAsync(delete, token).ConfigureAwait(false))
                        {
                            Assert.True(deleted.IsSuccessStatusCode, "session DELETE returned " + (int)deleted.StatusCode);
                        }
                    }
                    Run final = await WaitForAsync(cluster, running.Id, r => RunService.IsTerminal(r.Status), 20, 50, token).ConfigureAwait(false);
                    Assert.Equal(RunStatusEnum.Cancelled, final.Status, "deleting the MCP session cancels the run its tool call waits on");
                }
                finally
                {
                    session.Dispose();
                    if (pending != null) await IgnoreAsync(pending).ConfigureAwait(false);
                }
            }
        }

        private static async Task A2ADisconnectAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                await CreateProfileAsync(cluster, "hang-fake", 2, token, "--format", "claude", "--hang").ConfigureAwait(false);
                Agent agent = await cluster.CreateAgentAsync("a2a-hang", "hang-fake", null, token).ConfigureAwait(false);
                string agentBase = cluster.Server.BaseUrl + "/v1.0/a2a/" + cluster.Server.TenantId + "/a2a-hang";

                // Blocking SendMessage.
                using (HttpClient http = Client(cluster))
                using (CancellationTokenSource gone = new CancellationTokenSource())
                {
                    AgentCard card = await new A2ACardResolver(http).GetAgentCardAsync(agentBase).ConfigureAwait(false);
                    string url = card.SupportedInterfaces.First(i => i.ProtocolBinding == "JSONRPC").Url;
                    using (A2AClient client = new A2AClient(url, http))
                    {
                        SendMessageRequest request = new SendMessageRequest();
                        request.Message = new Message { Role = Voltaic.A2A.Role.User, MessageId = Guid.NewGuid().ToString("N"), Parts = new List<Part> { Part.FromText("block until done") } };
                        Task<SendMessageResponse> call = client.SendMessageAsync(request, gone.Token);
                        Run running = await WaitForAgentRunAsync(cluster, agent.Id, RunStatusEnum.Running, 30, token).ConfigureAwait(false);
                        gone.Cancel();
                        await IgnoreAsync(call).ConfigureAwait(false);
                        Run final = await WaitForAsync(cluster, running.Id, r => RunService.IsTerminal(r.Status), 20, 50, token).ConfigureAwait(false);
                        Assert.Equal(RunStatusEnum.Cancelled, final.Status, "a disconnected blocking SendMessage cancels its task");
                    }
                }

                // SendStreamingMessage: read the first event, then close the stream.
                using (HttpClient http = Client(cluster))
                {
                    AgentCard card = await new A2ACardResolver(http).GetAgentCardAsync(agentBase).ConfigureAwait(false);
                    string url = card.SupportedInterfaces.First(i => i.ProtocolBinding == "JSONRPC").Url;
                    string? taskId = null;
                    using (A2AClient client = new A2AClient(url, http))
                    using (CancellationTokenSource gone = new CancellationTokenSource())
                    {
                        SendMessageRequest request = new SendMessageRequest();
                        request.Message = new Message { Role = Voltaic.A2A.Role.User, MessageId = Guid.NewGuid().ToString("N"), Parts = new List<Part> { Part.FromText("stream until done") } };
                        try
                        {
                            await foreach (StreamResponse item in client.SendStreamingMessageAsync(request, gone.Token).ConfigureAwait(false))
                            {
                                taskId = item.Task?.Id ?? item.StatusUpdate?.TaskId;
                                if (taskId != null) break;
                            }
                        }
                        catch (OperationCanceledException)
                        {
                        }
                        gone.Cancel();
                    }
                    Assert.True(taskId != null, "the stream reported its task");
                    Run running = await WaitForAsync(cluster, taskId!, r => r.Status == RunStatusEnum.Running || RunService.IsTerminal(r.Status), 30, 50, token).ConfigureAwait(false);
                    Run final = await WaitForAsync(cluster, running.Id, r => RunService.IsTerminal(r.Status), 20, 50, token).ConfigureAwait(false);
                    Assert.Equal(RunStatusEnum.Cancelled, final.Status, "closing a SendStreamingMessage stream cancels its task");
                }
            }
        }

        private static async Task CascadeAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                await CreateProfileAsync(cluster, "hang-fake", 2, token, "--format", "claude", "--hang").ConfigureAwait(false);
                Agent agent = await cluster.CreateAgentAsync("tree", "hang-fake", null, token).ConfigureAwait(false);
                Run parent = await StartRunAsync(cluster, agent, token).ConfigureAwait(false);

                RunService runs = cluster.Server.Server.Context.Get<RunService>();
                RunCreateContext childCreate = new RunCreateContext();
                childCreate.TenantId = cluster.Server.TenantId;
                childCreate.Agent = agent;
                childCreate.Input = "child";
                childCreate.Kind = RunKindEnum.Delegated;
                childCreate.Parent = parent;
                Run child = await runs.CreateAsync(childCreate, token).ConfigureAwait(false);
                child = await WaitForAsync(cluster, child.Id, r => r.Status == RunStatusEnum.Running, 30, 50, token).ConfigureAwait(false);

                RunCreateContext grandchildCreate = new RunCreateContext();
                grandchildCreate.TenantId = cluster.Server.TenantId;
                grandchildCreate.Agent = agent;
                grandchildCreate.Input = "grandchild";
                grandchildCreate.Kind = RunKindEnum.Delegated;
                grandchildCreate.Parent = child;
                Run grandchild = await runs.CreateAsync(grandchildCreate, token).ConfigureAwait(false);
                grandchild = await WaitForAsync(cluster, grandchild.Id, r => r.Status == RunStatusEnum.Running, 30, 50, token).ConfigureAwait(false);
                Assert.Equal(parent.Id, child.ParentRunId, "child's parent");
                Assert.Equal(child.Id, grandchild.ParentRunId, "grandchild's parent");

                await HttpTestHelpers.SendAsync<Run>(cluster.Server.AdminClient, HttpMethod.Post, Runs(cluster) + "/" + parent.Id + "/cancel", null, 200, token).ConfigureAwait(false);
                foreach (Run run in new[] { parent, child, grandchild })
                {
                    Run final = await WaitForAsync(cluster, run.Id, r => RunService.IsTerminal(r.Status), 20, 50, token).ConfigureAwait(false);
                    Assert.Equal(RunStatusEnum.Cancelled, final.Status, "run " + run.Id + " (depth " + run.Depth + ") cancelled with the tree");
                }
            }
        }

        private static async Task LimitsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 0, token).ConfigureAwait(false))
            {
                string tenant = cluster.Server.TenantId;
                CompilerOptions compiler = cluster.Server.Server.Context.Get<CompilerOptions>();
                RuntimeOptions runtime = cluster.Server.Server.Context.Get<RuntimeOptions>();
                Assert.Equal(3600, compiler.MaxRunSeconds, "default Runtime.MaxRunSeconds");
                Assert.True(compiler.RepetitionGuard && compiler.MaxAssistantChars == 200000 && compiler.NoProgressSeconds == 300, "cluster guard defaults");

                SettingsUpdateRequest update = new SettingsUpdateRequest();
                update.Values.Add(new SettingValue { Path = "Runtime.MaxRunSeconds", Value = "120" });
                update.Values.Add(new SettingValue { Path = "Runtime.NoProgressSeconds", Value = "45" });
                await HttpTestHelpers.SendAsync<SettingsSaveResponse>(cluster.Server.AdminClient, HttpMethod.Put, "/v1.0/api/settings", update, 200, token).ConfigureAwait(false);
                DateTime applied = DateTime.UtcNow.AddSeconds(15);
                while ((compiler.MaxRunSeconds != 120 || runtime.MaxRunSeconds != 120 || compiler.NoProgressSeconds != 45) && DateTime.UtcNow < applied) await Task.Delay(100, token).ConfigureAwait(false);
                Assert.Equal(120, compiler.MaxRunSeconds, "Runtime.MaxRunSeconds applied to the compiler");
                Assert.Equal(120, runtime.MaxRunSeconds, "Runtime.MaxRunSeconds applied to the runtime");
                Assert.Equal(45, compiler.NoProgressSeconds, "Runtime.NoProgressSeconds applied");

                Agent agent = await cluster.CreateAgentAsync("limited", "builtin/fake", null, token, d =>
                {
                    d.TimeoutSeconds = 600;
                    d.RepetitionGuard = false;
                    d.MaxAssistantChars = 1234;
                    d.NoProgressSeconds = 0;
                    d.AllowedRunOverrides.Add(new DeploymentRunOverrideRule { Name = "timeoutSeconds", Validation = RunOverrideValidationEnum.IntegerRange, Pattern = "5,100000" });
                }).ConfigureAwait(false);
                EnumerationResult<Deployment> deployments = await HttpTestHelpers.SendAsync<EnumerationResult<Deployment>>(cluster.Server.AdminClient, HttpMethod.Get, "/v1.0/api/tenants/" + tenant + "/deployments", null, 200, token).ConfigureAwait(false);
                Deployment limited = deployments.Objects.First(d => d.AgentId == agent.Id);
                Deployment read = await HttpTestHelpers.SendAsync<Deployment>(cluster.Server.AdminClient, HttpMethod.Get, "/v1.0/api/tenants/" + tenant + "/deployments/" + limited.Id, null, 200, token).ConfigureAwait(false);
                Assert.True(read.RepetitionGuard == false && read.MaxAssistantChars == 1234 && read.NoProgressSeconds == 0, "guard limits persisted: " + read.RepetitionGuard + ", " + read.MaxAssistantChars + ", " + read.NoProgressSeconds);

                CompilePreviewResponse preview = await PreviewAsync(cluster, limited.Id, null, token).ConfigureAwait(false);
                Assert.Equal(120, preview.Spec.TimeoutSeconds, "deployment timeout 600 capped at Runtime.MaxRunSeconds 120");
                Assert.True(!preview.Spec.RepetitionGuard && preview.Spec.MaxAssistantChars == 1234 && preview.Spec.NoProgressSeconds == 0, "deployment guard limits compiled into the spec");
                CompilePreviewResponse shorter = await PreviewAsync(cluster, limited.Id, "30", token).ConfigureAwait(false);
                Assert.Equal(30, shorter.Spec.TimeoutSeconds, "per-run timeoutSeconds override below the cap");
                CompilePreviewResponse longer = await PreviewAsync(cluster, limited.Id, "7200", token).ConfigureAwait(false);
                Assert.Equal(120, longer.Spec.TimeoutSeconds, "per-run timeoutSeconds override capped at Runtime.MaxRunSeconds");

                Agent plain = await cluster.CreateAgentAsync("plain", "builtin/fake", null, token).ConfigureAwait(false);
                deployments = await HttpTestHelpers.SendAsync<EnumerationResult<Deployment>>(cluster.Server.AdminClient, HttpMethod.Get, "/v1.0/api/tenants/" + tenant + "/deployments", null, 200, token).ConfigureAwait(false);
                Deployment defaults = deployments.Objects.First(d => d.AgentId == plain.Id);
                Assert.True(defaults.RepetitionGuard == null && defaults.MaxAssistantChars == null && defaults.NoProgressSeconds == null, "unset guard limits stay null");
                CompilePreviewResponse inherited = await PreviewAsync(cluster, defaults.Id, null, token).ConfigureAwait(false);
                Assert.True(inherited.Spec.RepetitionGuard && inherited.Spec.MaxAssistantChars == 200000 && inherited.Spec.NoProgressSeconds == 45, "cluster defaults compiled into the spec");
                Assert.Equal(120, inherited.Spec.TimeoutSeconds, "deployment timeout 120 (the test default) is within the cap");

                // The deadline enforcer applies the cap to runs whose stored deadline is later.
                Run stale = new Run();
                stale.TenantId = tenant;
                stale.AgentId = plain.Id;
                stale.AgentName = plain.Name;
                stale.DeploymentId = defaults.Id;
                stale.HarnessType = HarnessTypeEnum.Generic;
                stale.Status = RunStatusEnum.Running;
                stale.InputText = "old";
                stale.QueuedUtc = DateTime.UtcNow.AddHours(-2);
                stale.LeasedUtc = DateTime.UtcNow.AddHours(-2);
                stale.StartedUtc = DateTime.UtcNow.AddHours(-2);
                stale.LeaseNodeId = "nod_capped";
                stale.LeaseEpoch = 1;
                stale.LeaseExpiresUtc = DateTime.UtcNow.AddHours(1);
                stale.DeadlineUtc = DateTime.UtcNow.AddHours(10);
                stale = await cluster.Server.Server.Context.Database.Runs.CreateAsync(stale, token).ConfigureAwait(false);
                await cluster.Server.Server.Context.Get<MaintenanceService>().RunOnceAsync(token).ConfigureAwait(false);
                Run capped = await ReadRunAsync(cluster, stale.Id, token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.TimedOut, capped.Status, "a run past Runtime.MaxRunSeconds times out");
                Assert.True((capped.ErrorMessage ?? String.Empty).Contains("Runtime.MaxRunSeconds", StringComparison.Ordinal), "error names the cap: " + capped.ErrorMessage);
            }
        }

        private static async Task<CompilePreviewResponse> PreviewAsync(TestCluster cluster, string deploymentId, string? timeoutSeconds, CancellationToken token)
        {
            CompilePreviewRequest request = new CompilePreviewRequest();
            if (timeoutSeconds != null) request.Parameters["timeoutSeconds"] = timeoutSeconds;
            return await HttpTestHelpers.SendAsync<CompilePreviewResponse>(cluster.Server.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + cluster.Server.TenantId + "/deployments/" + deploymentId + "/compile-preview", request, 200, token).ConfigureAwait(false);
        }

        #endregion
    }
}
