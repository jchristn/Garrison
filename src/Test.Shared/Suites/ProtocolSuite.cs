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
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Serialization;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;
    using Voltaic.A2A;
    using Voltaic.Mcp;

    /// <summary>
    /// End-to-end suites over an in-process control plane and workers with the fake harness: REST invoke, SSE, cancel,
    /// MCP tools (Voltaic client), A2A (Voltaic client), and delegation with run tokens.
    /// </summary>
    public static class ProtocolSuite
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
                string id = "e2e-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                cases.Add(new TestCaseDescriptor(id, "rest-invoke", "REST invoke runs on a worker and returns the harness result (" + provider + ")", ct => RestInvokeAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "two-workers", "Runs spread across two workers and all succeed (" + provider + ")", ct => TwoWorkersAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "sse-stream", "Event stream delivers events and the final run (" + provider + ")", ct => StreamAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "cancel", "Cancelling a running run stops it (" + provider + ")", ct => CancelAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "mcp-tools", "MCP list and invoke through the Voltaic client (" + provider + ")", ct => McpAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "a2a", "A2A card, send, and stream through the Voltaic client (" + provider + ")", ct => A2AAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "delegation", "Run tokens delegate to allowed agents only (" + provider + ")", ct => DelegationAsync(provider, ct)));
                suites.Add(new TestSuiteDescriptor(id, "End to end (" + provider + ")", cases));
            }
            return suites;
        }

        private static async Task<Run> InvokeAsync(TestCluster cluster, Agent agent, string input, bool wait, CancellationToken token)
        {
            InvokeRequest request = new InvokeRequest();
            request.Input = input;
            request.Wait = wait;
            request.WaitSeconds = 60;
            TestResponse response = await HttpTestHelpers.SendAsync(cluster.Server.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + cluster.Server.TenantId + "/agents/" + agent.Id + "/invoke", request, token).ConfigureAwait(false);
            if (response.StatusCode != 200 && response.StatusCode != 202) throw new TestAssertionException("Invoke returned " + response.StatusCode + ": " + response.Body);
            return Serializer.Deserialize<Run>(response.Body) ?? throw new TestAssertionException("Empty run.");
        }

        private static async Task RestInvokeAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                Agent agent = await cluster.CreateAgentAsync("echo", "builtin/fake", null, token).ConfigureAwait(false);
                Run run = await InvokeAsync(cluster, agent, "Hello from the test suite", true, token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Succeeded, run.Status, "Status (" + run.Outcome + ": " + run.ErrorMessage + ")");
                Assert.True((run.ResultText ?? String.Empty).StartsWith("Echo:", StringComparison.Ordinal), "Result was '" + run.ResultText + "'.");
                Assert.True(run.InputTokens > 0 || run.OutputTokens > 0, "Usage should be recorded.");
                Assert.True(!String.IsNullOrEmpty(run.LeaseNodeName), "Lease node should be recorded.");

                Run read = await HttpTestHelpers.SendAsync<Run>(cluster.Server.AdminClient, HttpMethod.Get, "/v1.0/api/tenants/" + cluster.Server.TenantId + "/runs/" + run.Id, null, 200, token).ConfigureAwait(false);
                if (Environment.GetEnvironmentVariable("GARRISON_TEST_STRICT_TEMPLATES") != "false") Assert.True(read.TemplateVersions.Count > 0, "Template versions should be recorded on the run.");
            }
        }

        private static async Task TwoWorkersAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 2, token).ConfigureAwait(false))
            {
                Agent agent = await cluster.CreateAgentAsync("spread", "builtin/fake", null, token).ConfigureAwait(false);
                List<Task<Run>> runs = new List<Task<Run>>();
                for (int i = 0; i < 8; i++) runs.Add(InvokeAsync(cluster, agent, "request " + i, true, token));
                Run[] finished = await Task.WhenAll(runs).ConfigureAwait(false);
                Assert.True(finished.All(r => r.Status == RunStatusEnum.Succeeded), "All runs should succeed: " + String.Join(", ", finished.Select(r => r.Status + "/" + r.Outcome)));
                Assert.True(finished.Select(r => r.LeaseNodeName).Distinct().Count() >= 1, "Runs should record their nodes.");
                Assert.Equal(8L, cluster.Workers.Sum(w => w.CompletedRuns), "Completed runs across workers");
            }
        }

        private static async Task StreamAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                Agent agent = await cluster.CreateAgentAsync("streamer", "builtin/fake", null, token).ConfigureAwait(false);
                Run run = await InvokeAsync(cluster, agent, "Stream me", false, token).ConfigureAwait(false);
                using (HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, "/v1.0/api/tenants/" + cluster.Server.TenantId + "/runs/" + run.Id + "/events/stream"))
                using (HttpResponseMessage response = await cluster.Server.AdminClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, token).ConfigureAwait(false))
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
                        if (line.StartsWith("data:", StringComparison.Ordinal))
                        {
                            if (currentEvent == "run.event") events++;
                            if (currentEvent == "run.completed")
                            {
                                Run final = Serializer.Deserialize<Run>(line.Substring(5).Trim()) ?? throw new TestAssertionException("Bad final run.");
                                Assert.Equal(RunStatusEnum.Succeeded, final.Status, "Final status");
                                completed = true;
                                break;
                            }
                        }
                    }
                    Assert.True(completed, "Stream ended without run.completed.");
                    Assert.True(events > 0, "Stream delivered no events.");
                }
            }
        }

        private static async Task CancelAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                string tenant = cluster.Server.TenantId;
                HarnessProfile slow = new HarnessProfile();
                slow.Name = "slow-fake";
                slow.HarnessType = HarnessTypeEnum.Generic;
                slow.Executable = "garrison-fake-harness";
                slow.Arguments.Add(new HarnessArgument { Template = "--format" });
                slow.Arguments.Add(new HarnessArgument { Template = "claude" });
                slow.Arguments.Add(new HarnessArgument { Template = "--delay-ms" });
                slow.Arguments.Add(new HarnessArgument { Template = "20000" });
                slow.OutputParser = OutputParserEnum.ClaudeStreamJson;
                slow.PromptDelivery = PromptDeliveryEnum.Stdin;
                slow.SystemPromptDelivery = SystemPromptDeliveryEnum.None;
                await HttpTestHelpers.SendAsync<HarnessProfile>(cluster.Server.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + tenant + "/harness-profiles", slow, 201, token).ConfigureAwait(false);

                Agent agent = await cluster.CreateAgentAsync("sleeper", "slow-fake", null, token).ConfigureAwait(false);
                Run run = await InvokeAsync(cluster, agent, "Take your time", false, token).ConfigureAwait(false);

                DateTime deadline = DateTime.UtcNow.AddSeconds(20);
                Run current = run;
                while (current.Status != RunStatusEnum.Running && DateTime.UtcNow < deadline)
                {
                    await Task.Delay(100, token).ConfigureAwait(false);
                    current = await HttpTestHelpers.SendAsync<Run>(cluster.Server.AdminClient, HttpMethod.Get, "/v1.0/api/tenants/" + tenant + "/runs/" + run.Id, null, 200, token).ConfigureAwait(false);
                }
                Assert.Equal(RunStatusEnum.Running, current.Status, "Status before cancel (" + current.ErrorMessage + ")");

                await HttpTestHelpers.SendAsync<Run>(cluster.Server.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + tenant + "/runs/" + run.Id + "/cancel", null, 200, token).ConfigureAwait(false);
                deadline = DateTime.UtcNow.AddSeconds(20);
                while (!Garrison.Server.Runtime.RunService.IsTerminal(current.Status) && DateTime.UtcNow < deadline)
                {
                    await Task.Delay(200, token).ConfigureAwait(false);
                    current = await HttpTestHelpers.SendAsync<Run>(cluster.Server.AdminClient, HttpMethod.Get, "/v1.0/api/tenants/" + tenant + "/runs/" + run.Id, null, 200, token).ConfigureAwait(false);
                }
                Assert.Equal(RunStatusEnum.Cancelled, current.Status, "Status after cancel");
            }
        }

        private static async Task McpAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                await cluster.CreateAgentAsync("mcp-echo", "builtin/fake", null, token).ConfigureAwait(false);
                using (McpHttpClient client = new McpHttpClient())
                {
                    client.SetRequestHeader("x-api-key", cluster.Server.Settings.Auth.AdminApiKey);
                    client.SetRequestHeader("x-tenant-id", cluster.Server.TenantId);
                    await client.ConnectStreamableAsync(cluster.Server.McpUrl, "/mcp").ConfigureAwait(false);

                    JsonElement tools = await client.CallAsync<JsonElement>("tools/list", new { }).ConfigureAwait(false);
                    List<string> names = tools.GetProperty("tools").EnumerateArray().Select(t => t.GetProperty("name").GetString() ?? String.Empty).ToList();
                    Assert.True(names.Contains("garrison_invoke_agent"), "tools/list is missing garrison_invoke_agent: " + String.Join(", ", names));

                    JsonElement listed = await client.CallAsync<JsonElement>("tools/call", new { name = "garrison_list_agents", arguments = new { tenantId = cluster.Server.TenantId } }, 60000).ConfigureAwait(false);
                    Assert.True(ToolText(listed).Contains("mcp-echo"), "garrison_list_agents did not include the agent: " + ToolText(listed));

                    JsonElement invoked = await client.CallAsync<JsonElement>("tools/call", new { name = "garrison_invoke_agent", arguments = new { tenantId = cluster.Server.TenantId, agent = "mcp-echo", input = "Ping over MCP", waitSeconds = 60 } }, 90000).ConfigureAwait(false);
                    string text = ToolText(invoked);
                    using (JsonDocument summary = JsonDocument.Parse(text))
                    {
                        Assert.Equal("Succeeded", summary.RootElement.GetProperty("status").GetString(), "MCP run status (" + text + ")");
                        Assert.True((summary.RootElement.GetProperty("result").GetString() ?? String.Empty).StartsWith("Echo:", StringComparison.Ordinal), "MCP result: " + text);
                    }
                }
            }
        }

        private static async Task A2AAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                await cluster.CreateAgentAsync("a2a-echo", "builtin/fake", null, token).ConfigureAwait(false);
                string agentBase = cluster.Server.BaseUrl + "/v1.0/a2a/" + cluster.Server.TenantId + "/a2a-echo";
                using (HttpClient http = new HttpClient())
                {
                    http.DefaultRequestHeaders.Add("x-api-key", cluster.Server.Settings.Auth.AdminApiKey);
                    http.Timeout = TimeSpan.FromSeconds(120);
                    AgentCard card = await new A2ACardResolver(http).GetAgentCardAsync(agentBase).ConfigureAwait(false);
                    Assert.Equal("a2a-echo", card.Name, "Card name");
                    string url = card.SupportedInterfaces.First(i => i.ProtocolBinding == "JSONRPC").Url;

                    using (A2AClient client = new A2AClient(url, http))
                    {
                        SendMessageRequest request = new SendMessageRequest();
                        request.Message = new Message { Role = Voltaic.A2A.Role.User, MessageId = Guid.NewGuid().ToString("N"), Parts = new List<Part> { Part.FromText("Hello over A2A") } };
                        SendMessageResponse response = await client.SendMessageAsync(request).ConfigureAwait(false);
                        AgentTask task = Assert.NotNull(response.Task, "Task");
                        Assert.Equal(TaskState.Completed, task.Status.State, "A2A task state");
                        string? answer = task.Artifacts?.SelectMany(a => a.Parts).Select(p => p.Text).FirstOrDefault(t => t != null);
                        Assert.True((answer ?? String.Empty).StartsWith("Echo:", StringComparison.Ordinal), "A2A artifact text: " + answer);

                        AgentTask fetched = await client.GetTaskAsync(new GetTaskRequest { Id = task.Id }).ConfigureAwait(false);
                        Assert.Equal(task.Id, fetched.Id, "GetTask id");

                        SendMessageRequest streamRequest = new SendMessageRequest();
                        streamRequest.Message = new Message { Role = Voltaic.A2A.Role.User, MessageId = Guid.NewGuid().ToString("N"), Parts = new List<Part> { Part.FromText("Stream over A2A") } };
                        TaskState last = TaskState.Unspecified;
                        bool sawArtifact = false;
                        await foreach (StreamResponse update in client.SendStreamingMessageAsync(streamRequest).ConfigureAwait(false))
                        {
                            if (update.StatusUpdate != null) last = update.StatusUpdate.Status.State;
                            if (update.ArtifactUpdate != null) sawArtifact = true;
                        }
                        Assert.Equal(TaskState.Completed, last, "Final streamed state");
                        Assert.True(sawArtifact, "Stream should include the result artifact.");
                    }
                }
            }
        }

        private static async Task DelegationAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                string tenant = cluster.Server.TenantId;
                Agent helper = await cluster.CreateAgentAsync("helper", "builtin/fake", null, token).ConfigureAwait(false);
                Agent outsider = await cluster.CreateAgentAsync("outsider", "builtin/fake", null, token).ConfigureAwait(false);
                Agent lead = await cluster.CreateAgentAsync("lead", "builtin/fake", a =>
                {
                    a.DelegationMode = DelegationModeEnum.AllowList;
                    a.DelegationAllowList.Add("helper");
                }, token).ConfigureAwait(false);

                Run parent = new Run();
                parent.TenantId = tenant;
                parent.AgentId = lead.Id;
                parent.AgentName = lead.Name;
                parent.DeploymentId = "dep_parent";
                parent.Status = RunStatusEnum.Running;
                parent.CallChain = lead.Name;
                parent.CallerType = PrincipalTypeEnum.User;
                Garrison.Core.Models.User? admin = await cluster.Server.Server.Context.Database.Users.ReadByEmailAsync(tenant, "admin@garrison.local", token).ConfigureAwait(false);
                parent.CallerId = admin?.Id;
                parent = await cluster.Server.Server.Context.Database.Runs.CreateAsync(parent, token).ConfigureAwait(false);
                string runToken = await cluster.Server.Server.Context.Authentication.IssueForRunAsync(parent, DateTime.UtcNow.AddMinutes(5), token).ConfigureAwait(false);

                using (HttpClient asRun = new HttpClient())
                {
                    asRun.BaseAddress = new Uri(cluster.Server.BaseUrl);
                    asRun.DefaultRequestHeaders.Add("Authorization", "Bearer " + runToken);
                    asRun.Timeout = TimeSpan.FromSeconds(90);
                    InvokeRequest request = new InvokeRequest();
                    request.Input = "Delegated work";
                    request.WaitSeconds = 60;

                    Run child = await HttpTestHelpers.SendAsync<Run>(asRun, HttpMethod.Post, "/v1.0/api/tenants/" + tenant + "/agents/" + helper.Id + "/invoke", request, 200, token).ConfigureAwait(false);
                    Assert.Equal(RunStatusEnum.Succeeded, child.Status, "Delegated status");
                    Assert.Equal(parent.Id, child.ParentRunId, "Parent link");
                    Assert.Equal(1, child.Depth, "Depth");
                    Assert.Equal(RunKindEnum.Delegated, child.Kind, "Kind");

                    TestResponse denied = await HttpTestHelpers.SendAsync(asRun, HttpMethod.Post, "/v1.0/api/tenants/" + tenant + "/agents/" + outsider.Id + "/invoke", request, token).ConfigureAwait(false);
                    Assert.Equal(409, denied.StatusCode, "Disallowed delegation status (" + denied.Body + ")");
                    TestResponse admin403 = await HttpTestHelpers.SendAsync(asRun, HttpMethod.Get, "/v1.0/api/tenants/" + tenant + "/users", null, token).ConfigureAwait(false);
                    Assert.True(admin403.StatusCode == 403 || admin403.StatusCode == 404, "Run tokens must not reach administration (got " + admin403.StatusCode + ").");
                }
            }
        }

        private static string ToolText(JsonElement result)
        {
            if (result.TryGetProperty("isError", out JsonElement isError) && isError.ValueKind == JsonValueKind.True) throw new TestAssertionException("Tool error: " + result.GetRawText());
            return result.GetProperty("content")[0].GetProperty("text").GetString() ?? String.Empty;
        }
    }
}
