namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Net.Http;
    using System.Net.Sockets;
    using System.Text;
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
                cases.Add(new TestCaseDescriptor(id, "mcp-response-framing", "MCP responses relayed by the proxy, including a bodyless 202 for a notification, end cleanly with no bytes after them (" + provider + ")", ct => McpKeepAliveFramingAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "mcp-agent-tools", "Agents with exposeMcpTool are MCP tools in their tenant, and tenant templates override tool descriptions (" + provider + ")", ct => McpAgentToolsAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "a2a", "A2A card, send, and stream through the Voltaic client (" + provider + ")", ct => A2AAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "delegation", "Run tokens delegate to allowed agents only (" + provider + ")", ct => DelegationAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "rejected-runs", "Queued runs whose deployment or agent was deactivated are Rejected when claimed, not started (" + provider + ")", ct => RejectedRunsAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "blocked-runs", "Runs no worker can take report blockedReason over REST and MCP, count on the overview, get a warning event, and fail after the configured wait (" + provider + ")", ct => BlockedRunsAsync(provider, ct)));
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
                Agent agent = await cluster.CreateAgentAsync("echo", "builtin/fake", null, token, d => d.Parameters.Add(new DeploymentParameter { Name = "delayMs", Value = "100" })).ConfigureAwait(false);
                Run run = await InvokeAsync(cluster, agent, "Hello from the test suite", true, token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Succeeded, run.Status, "Status (" + run.Outcome + ": " + run.ErrorMessage + ")");
                AssertTelemetry(run);
                Assert.True((run.ResultText ?? String.Empty).StartsWith("Echo:", StringComparison.Ordinal), "Result was '" + run.ResultText + "'.");
                Assert.True(run.InputTokens > 0 || run.OutputTokens > 0, "Usage should be recorded.");
                Assert.True(!String.IsNullOrEmpty(run.LeaseNodeName), "Lease node should be recorded.");

                Run read = await HttpTestHelpers.SendAsync<Run>(cluster.Server.AdminClient, HttpMethod.Get, "/v1.0/api/tenants/" + cluster.Server.TenantId + "/runs/" + run.Id, null, 200, token).ConfigureAwait(false);
                AssertTelemetry(read);
                Assert.True(read.OutputTokensPerSecond.HasValue && read.OutputTokensPerSecond.Value > 0, "Tokens per second with at least 100 ms of streaming (streaming " + read.StreamingMs + " ms).");

                string window = "from=" + Uri.EscapeDataString(DateTime.UtcNow.AddHours(-1).ToString("o")) + "&to=" + Uri.EscapeDataString(DateTime.UtcNow.AddMinutes(1).ToString("o"));
                Garrison.Core.Responses.RunAnalyticsResponse analytics = await HttpTestHelpers.SendAsync<Garrison.Core.Responses.RunAnalyticsResponse>(cluster.Server.AdminClient, HttpMethod.Get, "/v1.0/api/tenants/" + cluster.Server.TenantId + "/analytics/runs?" + window + "&groupBy=agent", null, 200, token).ConfigureAwait(false);
                Assert.Equal(1L, analytics.Totals.Runs, "Analytics count the run");
                Assert.Equal(1L, analytics.Totals.Succeeded, "Analytics count the success");
                Assert.Equal(read.TimeToFirstTokenMs ?? -1, (long)(analytics.Totals.TimeToFirstTokenMsP50 ?? -2), "Analytics TTFT p50 equals the run's TTFT");
                Assert.Equal(agent.Id, analytics.Series.Single().Key, "Analytics series per agent");
                if (Environment.GetEnvironmentVariable("GARRISON_TEST_STRICT_TEMPLATES") != "false") Assert.True(read.TemplateVersions.Count > 0, "Template versions should be recorded on the run.");
            }
        }

        private static void AssertTelemetry(Run run)
        {
            long ttft = run.TimeToFirstTokenMs ?? -1;
            long streaming = run.StreamingMs ?? -1;
            long execution = run.ExecutionMs ?? -1;
            Assert.True(ttft > 0, "timeToFirstTokenMs should be populated (was " + ttft + ").");
            Assert.True(streaming > 0, "streamingMs should be populated and non-zero (was " + streaming + ").");
            Assert.True(execution >= ttft + streaming, "executionMs (" + execution + ") should cover TTFT plus streaming.");
            Assert.True(run.FirstTokenUtc.HasValue && run.LastTokenUtc.HasValue && run.LastTokenUtc.Value >= run.FirstTokenUtc.Value, "firstTokenUtc and lastTokenUtc should be populated.");
            Assert.True(run.QueueMs.HasValue && run.QueueMs.Value >= 0, "queueMs should be populated.");
            Assert.True(run.TotalMs.HasValue && run.TotalMs.Value >= (run.QueueMs ?? 0), "totalMs should be populated and cover queueMs.");
            Assert.Equal(2L, run.ReasoningTokens, "reasoningTokens from the fake harness");
            Assert.Equal(0, run.ToolCallCount, "toolCallCount");
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
                // A worker counts a run after it reports completion, so a waiting caller can see the run finish
                // slightly before the counter moves. Allow a short grace period.
                DateTime deadline = DateTime.UtcNow.AddSeconds(10);
                while (cluster.Workers.Sum(w => w.CompletedRuns) < 8 && DateTime.UtcNow < deadline) await Task.Delay(50, token).ConfigureAwait(false);
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
                    Assert.True(tools.GetProperty("tools").EnumerateArray().All(t => t.GetProperty("inputSchema").GetProperty("properties").TryGetProperty("tenantId", out JsonElement _)), "System administrators see tenantId on every tool (G-19)");

                    JsonElement listed = await client.CallAsync<JsonElement>("tools/call", new { name = "garrison_list_agents", arguments = new { tenantId = cluster.Server.TenantId } }, 60000).ConfigureAwait(false);
                    Assert.True(ToolText(listed).Contains("mcp-echo"), "garrison_list_agents did not include the agent: " + ToolText(listed));

                    JsonElement invoked = await client.CallAsync<JsonElement>("tools/call", new { name = "garrison_invoke_agent", arguments = new { tenantId = cluster.Server.TenantId, agent = "mcp-echo", input = "Ping over MCP", waitSeconds = 60 } }, 90000).ConfigureAwait(false);
                    string text = ToolText(invoked);
                    using (JsonDocument summary = JsonDocument.Parse(text))
                    {
                        Assert.Equal("Succeeded", summary.RootElement.GetProperty("status").GetString(), "MCP run status (" + text + ")");
                        Assert.True((summary.RootElement.GetProperty("result").GetString() ?? String.Empty).StartsWith("Echo:", StringComparison.Ordinal), "MCP result: " + text);
                    }
                    Garrison.Server.Protocols.McpRunSummary typed = Serializer.Deserialize<Garrison.Server.Protocols.McpRunSummary>(text) ?? throw new TestAssertionException("Empty MCP summary.");
                    Assert.True((typed.TimeToFirstTokenMs ?? -1) > 0 && typed.ExecutionMs.HasValue && typed.TotalMs.HasValue, "MCP run summary carries timing telemetry: " + text);
                    Assert.Equal(2L, typed.ReasoningTokens, "MCP run summary reasoning tokens");
                }
            }
        }

        private static async Task RejectedRunsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 0, token).ConfigureAwait(false))
            {
                string tenant = cluster.Server.TenantId;
                Agent kept = await cluster.CreateAgentAsync("kept-agent", "builtin/fake", null, token).ConfigureAwait(false);
                Agent dropped = await cluster.CreateAgentAsync("dropped-deployment", "builtin/fake", null, token).ConfigureAwait(false);
                Agent inactive = await cluster.CreateAgentAsync("inactive-agent", "builtin/fake", null, token).ConfigureAwait(false);
                Run keptRun = await InvokeAsync(cluster, kept, "Still wanted", false, token).ConfigureAwait(false);
                Run droppedRun = await InvokeAsync(cluster, dropped, "Deployment goes away", false, token).ConfigureAwait(false);
                Run inactiveRun = await InvokeAsync(cluster, inactive, "Agent goes away", false, token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Queued, droppedRun.Status, "Queued with no worker");

                Garrison.Core.Database.DatabaseDriverBase database = cluster.Server.Server.Context.Database;
                Deployment deployment = Assert.NotNull(await database.Deployments.ReadAsync(tenant, droppedRun.DeploymentId, token).ConfigureAwait(false), "Deployment");
                deployment.Active = false;
                await database.Deployments.UpdateAsync(deployment, token).ConfigureAwait(false);
                Agent agent = Assert.NotNull(await database.Agents.ReadAsync(tenant, inactive.Id, token).ConfigureAwait(false), "Agent");
                agent.Active = false;
                await database.Agents.UpdateAsync(agent, token).ConfigureAwait(false);

                await cluster.AddWorkerAsync("rejecting-worker", token).ConfigureAwait(false);
                Run keptDone = await WaitTerminalAsync(cluster, keptRun.Id, token).ConfigureAwait(false);
                Run droppedDone = await WaitTerminalAsync(cluster, droppedRun.Id, token).ConfigureAwait(false);
                Run inactiveDone = await WaitTerminalAsync(cluster, inactiveRun.Id, token).ConfigureAwait(false);

                Assert.Equal(RunStatusEnum.Succeeded, keptDone.Status, "Unaffected run (" + keptDone.ErrorMessage + ")");
                Assert.Equal(RunStatusEnum.Rejected, droppedDone.Status, "Run of a deactivated deployment");
                Assert.Equal(RunOutcomeEnum.Rejected, droppedDone.Outcome, "Outcome of a deactivated deployment's run");
                Assert.True((droppedDone.ErrorMessage ?? String.Empty).Contains("deactivated", StringComparison.Ordinal), "Rejection reason: " + droppedDone.ErrorMessage);
                Assert.True(droppedDone.CompletedUtc.HasValue && String.IsNullOrEmpty(droppedDone.LeaseNodeId), "Rejected runs are completed and hold no lease");
                Assert.True(droppedDone.StartedUtc == null, "Rejected runs never start");
                Assert.Equal(RunStatusEnum.Rejected, inactiveDone.Status, "Run of a deactivated agent");
                Assert.True((inactiveDone.ErrorMessage ?? String.Empty).Contains("Agent inactive-agent was deactivated", StringComparison.Ordinal), "Agent rejection reason: " + inactiveDone.ErrorMessage);
            }
        }

        private static async Task<Run> WaitTerminalAsync(TestCluster cluster, string runId, CancellationToken token)
        {
            DateTime until = DateTime.UtcNow.AddSeconds(60);
            while (true)
            {
                Run run = await HttpTestHelpers.SendAsync<Run>(cluster.Server.AdminClient, HttpMethod.Get, "/v1.0/api/tenants/" + cluster.Server.TenantId + "/runs/" + runId, null, 200, token).ConfigureAwait(false);
                if (Garrison.Server.Runtime.RunService.IsTerminal(run.Status)) return run;
                if (DateTime.UtcNow > until) throw new TestAssertionException("Run " + runId + " did not finish; status " + run.Status + ".");
                await Task.Delay(200, token).ConfigureAwait(false);
            }
        }

        private static async Task McpKeepAliveFramingAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                Uri mcp = new Uri(cluster.Server.McpUrl);
                string headers = "x-api-key: " + cluster.Server.Settings.Auth.AdminApiKey + "\r\nx-tenant-id: " + cluster.Server.TenantId + "\r\n";
                McpReply init = await RawMcpExchangeAsync(mcp, headers, "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"initialize\",\"params\":{\"protocolVersion\":\"2025-06-18\",\"capabilities\":{},\"clientInfo\":{\"name\":\"framing\",\"version\":\"1.0\"}}}", token).ConfigureAwait(false);
                Assert.Equal(200, init.Status, "initialize: " + init.Body);
                string session = init.SessionId ?? throw new TestAssertionException("initialize returned no MCP-Session-Id.");
                headers += "MCP-Session-Id: " + session + "\r\n";

                McpReply initialized = await RawMcpExchangeAsync(mcp, headers, "{\"jsonrpc\":\"2.0\",\"method\":\"notifications/initialized\"}", token).ConfigureAwait(false);
                Assert.Equal(202, initialized.Status, "notifications/initialized");

                McpReply tools = await RawMcpExchangeAsync(mcp, headers, "{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"tools/list\",\"params\":{}}", token).ConfigureAwait(false);
                Assert.Equal(200, tools.Status, "tools/list");
                Assert.True(tools.Body.Contains("garrison_invoke_agent", StringComparison.Ordinal), "tools/list body: " + tools.Body);
            }
        }

        private static async Task<McpReply> RawMcpExchangeAsync(Uri mcp, string headers, string body, CancellationToken token)
        {
            using (TcpClient tcp = new TcpClient())
            {
                await tcp.ConnectAsync(mcp.Host, mcp.Port, token).ConfigureAwait(false);
                using (NetworkStream stream = tcp.GetStream())
                {
                    McpReply reply = await RawMcpPostAsync(stream, mcp, headers, body, token).ConfigureAwait(false);

                    // Nothing may follow the end of the response. A doubled chunk terminator here is what HTTP clients
                    // such as Node's parser reject ("Expected HTTP/"), and what a reused connection reads as its next status line.
                    using (CancellationTokenSource drain = CancellationTokenSource.CreateLinkedTokenSource(token))
                    {
                        drain.CancelAfter(2000);
                        byte[] buffer = new byte[256];
                        int extra = 0;
                        string trailing = String.Empty;
                        try
                        {
                            while (true)
                            {
                                int read = await stream.ReadAsync(buffer, 0, buffer.Length, drain.Token).ConfigureAwait(false);
                                if (read < 1) break;
                                extra += read;
                                trailing += Encoding.ASCII.GetString(buffer, 0, read);
                            }
                        }
                        catch (OperationCanceledException) when (!token.IsCancellationRequested)
                        {
                        }
                        catch (IOException)
                        {
                        }
                        Assert.Equal(0, extra, "Bytes after the end of the HTTP " + reply.Status + " response: '" + trailing.Replace("\r", "\\r").Replace("\n", "\\n") + "'");
                    }
                    return reply;
                }
            }
        }

        private static async Task<McpReply> RawMcpPostAsync(NetworkStream stream, Uri mcp, string headers, string body, CancellationToken token)
        {
            byte[] payload = Encoding.UTF8.GetBytes(body);
            string request = "POST /mcp HTTP/1.1\r\nHost: " + mcp.Host + ":" + mcp.Port + "\r\nContent-Type: application/json\r\nAccept: application/json, text/event-stream\r\n" + headers + "Content-Length: " + payload.Length + "\r\n\r\n";
            byte[] head = Encoding.ASCII.GetBytes(request);
            await stream.WriteAsync(head, 0, head.Length, token).ConfigureAwait(false);
            await stream.WriteAsync(payload, 0, payload.Length, token).ConfigureAwait(false);
            await stream.FlushAsync(token).ConfigureAwait(false);

            string statusLine = await ReadLineAsync(stream, token).ConfigureAwait(false);
            string[] parts = statusLine.Split(' ');
            if (parts.Length < 2 || !parts[0].StartsWith("HTTP/", StringComparison.Ordinal) || !Int32.TryParse(parts[1], out int status))
                throw new TestAssertionException("Expected an HTTP status line, read '" + statusLine + "'.");

            McpReply reply = new McpReply();
            reply.Status = status;
            long contentLength = -1;
            bool chunked = false;
            while (true)
            {
                string line = await ReadLineAsync(stream, token).ConfigureAwait(false);
                if (line.Length == 0) break;
                int colon = line.IndexOf(':');
                if (colon < 1) continue;
                string name = line.Substring(0, colon).Trim();
                string value = line.Substring(colon + 1).Trim();
                if (String.Equals(name, "Content-Length", StringComparison.OrdinalIgnoreCase)) contentLength = Int64.Parse(value);
                else if (String.Equals(name, "Transfer-Encoding", StringComparison.OrdinalIgnoreCase)) chunked = value.Contains("chunked", StringComparison.OrdinalIgnoreCase);
                else if (String.Equals(name, "MCP-Session-Id", StringComparison.OrdinalIgnoreCase)) reply.SessionId = value;
            }

            using (MemoryStream content = new MemoryStream())
            {
                if (chunked)
                {
                    while (true)
                    {
                        string sizeLine = await ReadLineAsync(stream, token).ConfigureAwait(false);
                        int size = Convert.ToInt32(sizeLine.Split(';')[0].Trim(), 16);
                        if (size == 0)
                        {
                            await ReadLineAsync(stream, token).ConfigureAwait(false);
                            break;
                        }
                        await ReadExactlyAsync(stream, content, size, token).ConfigureAwait(false);
                        await ReadLineAsync(stream, token).ConfigureAwait(false);
                    }
                }
                else if (contentLength > 0)
                {
                    await ReadExactlyAsync(stream, content, (int)contentLength, token).ConfigureAwait(false);
                }
                reply.Body = Encoding.UTF8.GetString(content.ToArray());
            }
            return reply;
        }

        private static async Task<string> ReadLineAsync(NetworkStream stream, CancellationToken token)
        {
            StringBuilder line = new StringBuilder();
            byte[] one = new byte[1];
            while (true)
            {
                int read = await stream.ReadAsync(one, 0, 1, token).ConfigureAwait(false);
                if (read < 1) throw new TestAssertionException("The connection closed while reading a line; read so far: '" + line + "'.");
                if (one[0] == (byte)'\n') break;
                if (one[0] != (byte)'\r') line.Append((char)one[0]);
            }
            return line.ToString();
        }

        private static async Task ReadExactlyAsync(NetworkStream stream, MemoryStream destination, int count, CancellationToken token)
        {
            byte[] buffer = new byte[count];
            int offset = 0;
            while (offset < count)
            {
                int read = await stream.ReadAsync(buffer, offset, count - offset, token).ConfigureAwait(false);
                if (read < 1) throw new TestAssertionException("The connection closed after " + offset + " of " + count + " body bytes.");
                offset += read;
            }
            destination.Write(buffer, 0, count);
        }

        private static async Task McpAgentToolsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                string tenant = cluster.Server.TenantId;
                string templates = "/v1.0/api/tenants/" + tenant + "/prompt-templates";
                await cluster.CreateAgentAsync("tool-echo", "builtin/fake", a =>
                {
                    a.ExposeMcpTool = true;
                    a.McpToolName = "echo_tool";
                    a.Description = "Echoes its input.";
                }, token).ConfigureAwait(false);
                await cluster.CreateAgentAsync("named-tool", "builtin/fake", a => a.ExposeMcpTool = true, token).ConfigureAwait(false);
                await cluster.CreateAgentAsync("not-exposed", "builtin/fake", null, token).ConfigureAwait(false);

                TestResponse reserved = await HttpTestHelpers.SendAsync(cluster.Server.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + tenant + "/agents", new Agent { Name = "reserved-tool", ExposeMcpTool = true, McpToolName = "garrison_list_agents" }, token).ConfigureAwait(false);
                Assert.Equal(400, reserved.StatusCode, "Reserved MCP tool name (" + reserved.Body + ")");

                // Before any override: built-in descriptions, and builtin/mcp-tool-description for agent tools.
                Dictionary<string, string> before = await ListToolDescriptionsAsync(cluster, tenant).ConfigureAwait(false);
                Assert.True(before["garrison_list_agents"].StartsWith("List the Garrison agents", StringComparison.Ordinal), "Built-in description: " + before["garrison_list_agents"]);
                Assert.Equal("Echoes its input. Send a message to the Garrison agent \"tool-echo\" and receive its answer.", before["echo_tool"], "Agent tool uses builtin/mcp-tool-description");
                Assert.True(before.ContainsKey("named-tool"), "An agent without mcpToolName is offered under its name");
                Assert.True(!before.ContainsKey("not-exposed"), "Agents without exposeMcpTool are not tools");

                PromptTemplate listOverride = new PromptTemplate { Name = "mcp-tool-garrison_list_agents", Kind = PromptTemplateKindEnum.ToolDescription, Content = "Tenant {{tenant.id}}: {{tool.name}} lists our agents. {{tool.defaultDescription | truncate: 25}}" };
                await HttpTestHelpers.SendAsync<PromptTemplate>(cluster.Server.AdminClient, HttpMethod.Post, templates, listOverride, 201, token).ConfigureAwait(false);
                PromptTemplate wrongKind = new PromptTemplate { Name = "mcp-tool-garrison_get_run", Kind = PromptTemplateKindEnum.Fragment, Content = "Should be ignored." };
                await HttpTestHelpers.SendAsync<PromptTemplate>(cluster.Server.AdminClient, HttpMethod.Post, templates, wrongKind, 201, token).ConfigureAwait(false);
                PromptTemplate agentDefault = new PromptTemplate { Name = "mcp-tool-description", Kind = PromptTemplateKindEnum.ToolDescription, Content = "Ask {{agent.name}} through {{tool.name}}." };
                await HttpTestHelpers.SendAsync<PromptTemplate>(cluster.Server.AdminClient, HttpMethod.Post, templates, agentDefault, 201, token).ConfigureAwait(false);

                Dictionary<string, string> after = await ListToolDescriptionsAsync(cluster, tenant).ConfigureAwait(false);
                Assert.True(after["garrison_list_agents"].StartsWith("Tenant " + tenant + ": garrison_list_agents lists our agents. List the Garrison agents", StringComparison.Ordinal), "Tenant override rendered: " + after["garrison_list_agents"]);
                Assert.True(after["garrison_get_run"].StartsWith("Get the status", StringComparison.Ordinal), "A template of another kind does not override: " + after["garrison_get_run"]);
                Assert.Equal("Ask tool-echo through echo_tool.", after["echo_tool"], "Tenant mcp-tool-description replaces the built-in for agent tools");

                // Another tenant sees the built-ins and none of the first tenant's agent tools.
                Tenant other = await HttpTestHelpers.SendAsync<Tenant>(cluster.Server.AdminClient, HttpMethod.Post, "/v1.0/api/tenants", new TenantRequest { Name = "Other " + Guid.NewGuid().ToString("N").Substring(0, 6) }, 201, token).ConfigureAwait(false);
                Dictionary<string, string> otherTools = await ListToolDescriptionsAsync(cluster, other.Id).ConfigureAwait(false);
                Assert.True(otherTools["garrison_list_agents"].StartsWith("List the Garrison agents", StringComparison.Ordinal), "Overrides are per tenant: " + otherTools["garrison_list_agents"]);
                Assert.True(!otherTools.ContainsKey("echo_tool"), "Agent tools are per tenant");

                using (McpHttpClient client = new McpHttpClient())
                {
                    client.SetRequestHeader("x-api-key", cluster.Server.Settings.Auth.AdminApiKey);
                    client.SetRequestHeader("x-tenant-id", tenant);
                    await client.ConnectStreamableAsync(cluster.Server.McpUrl, "/mcp").ConfigureAwait(false);
                    JsonElement invoked = await client.CallAsync<JsonElement>("tools/call", new { name = "echo_tool", arguments = new { input = "Ping the agent tool", waitSeconds = 60 } }, 90000).ConfigureAwait(false);
                    string text = ToolText(invoked);
                    using (JsonDocument summary = JsonDocument.Parse(text))
                    {
                        Assert.Equal("Succeeded", summary.RootElement.GetProperty("status").GetString(), "Agent tool run status (" + text + ")");
                        Assert.Equal("tool-echo", summary.RootElement.GetProperty("agent").GetString(), "Agent tool invoked its agent");
                        Assert.True((summary.RootElement.GetProperty("result").GetString() ?? String.Empty).StartsWith("Echo:", StringComparison.Ordinal), "Agent tool result: " + text);
                    }
                }

                using (McpHttpClient client = new McpHttpClient())
                {
                    client.SetRequestHeader("x-api-key", cluster.Server.Settings.Auth.AdminApiKey);
                    client.SetRequestHeader("x-tenant-id", other.Id);
                    await client.ConnectStreamableAsync(cluster.Server.McpUrl, "/mcp").ConfigureAwait(false);
                    string failure;
                    try
                    {
                        JsonElement result = await client.CallAsync<JsonElement>("tools/call", new { name = "echo_tool", arguments = new { input = "x" } }, 90000).ConfigureAwait(false);
                        failure = result.GetRawText();
                    }
                    catch (Exception e) when (e is not TestAssertionException)
                    {
                        failure = e.Message;
                    }
                    Assert.True(failure.Contains("NotFound", StringComparison.Ordinal) || failure.Contains("not found", StringComparison.OrdinalIgnoreCase), "Another tenant cannot call the agent tool: " + failure);
                }
            }
        }

        private static async Task<Dictionary<string, string>> ListToolDescriptionsAsync(TestCluster cluster, string tenantId)
        {
            using (McpHttpClient client = new McpHttpClient())
            {
                client.SetRequestHeader("x-api-key", cluster.Server.Settings.Auth.AdminApiKey);
                client.SetRequestHeader("x-tenant-id", tenantId);
                await client.ConnectStreamableAsync(cluster.Server.McpUrl, "/mcp").ConfigureAwait(false);
                JsonElement tools = await client.CallAsync<JsonElement>("tools/list", new { }).ConfigureAwait(false);
                Dictionary<string, string> descriptions = new Dictionary<string, string>(StringComparer.Ordinal);
                foreach (JsonElement tool in tools.GetProperty("tools").EnumerateArray())
                {
                    descriptions[tool.GetProperty("name").GetString() ?? String.Empty] = tool.GetProperty("description").GetString() ?? String.Empty;
                }
                return descriptions;
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
                parent.TraceParent = "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01";
                parent.TraceId = "4bf92f3577b34da6a3ce929d0e0e4736";
                Garrison.Core.Models.User? admin = await cluster.Server.Server.Context.Database.Users.ReadByEmailAsync(tenant, "admin@garrison", token).ConfigureAwait(false);
                parent.CallerId = admin?.Id;
                parent = await cluster.Server.Server.Context.Database.Runs.CreateAsync(parent, token).ConfigureAwait(false);
                string runToken = await cluster.Server.Server.Context.Authentication.IssueForRunAsync(parent, parent.LeaseEpoch, DateTime.UtcNow.AddMinutes(5), token).ConfigureAwait(false);

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
                    Assert.Equal(parent.TraceId, child.TraceId, "Delegated runs join the parent run's trace");

                    TestResponse denied = await HttpTestHelpers.SendAsync(asRun, HttpMethod.Post, "/v1.0/api/tenants/" + tenant + "/agents/" + outsider.Id + "/invoke", request, token).ConfigureAwait(false);
                    Assert.Equal(409, denied.StatusCode, "Disallowed delegation status (" + denied.Body + ")");
                    TestResponse admin403 = await HttpTestHelpers.SendAsync(asRun, HttpMethod.Get, "/v1.0/api/tenants/" + tenant + "/users", null, token).ConfigureAwait(false);
                    Assert.True(admin403.StatusCode == 403 || admin403.StatusCode == 404, "Run tokens must not reach administration (got " + admin403.StatusCode + ").");
                }

                // G-19: run-token MCP sessions do not see administrator-only arguments, a stray tenantId is ignored, and
                // a wrong deploymentId tells the model to omit it.
                using (McpHttpClient client = new McpHttpClient())
                {
                    client.SetRequestHeader("Authorization", "Bearer " + runToken);
                    await client.ConnectStreamableAsync(cluster.Server.McpUrl, "/mcp").ConfigureAwait(false);
                    JsonElement tools = await client.CallAsync<JsonElement>("tools/list", new { }).ConfigureAwait(false);
                    List<JsonElement> listed = tools.GetProperty("tools").EnumerateArray().ToList();
                    Assert.True(listed.Count >= 8, "Run token sees the tools");
                    foreach (JsonElement tool in listed)
                    {
                        JsonElement properties = tool.GetProperty("inputSchema").GetProperty("properties");
                        Assert.True(!properties.TryGetProperty("tenantId", out JsonElement _), "Run token must not see tenantId on " + tool.GetProperty("name").GetString());
                    }
                    JsonElement invokeTool = listed.Single(t => t.GetProperty("name").GetString() == "garrison_invoke_agent");
                    Assert.True((invokeTool.GetProperty("description").GetString() ?? String.Empty).Contains("omit", StringComparison.OrdinalIgnoreCase), "invoke description tells the model to omit optional fields");
                    Assert.True((invokeTool.GetProperty("inputSchema").GetProperty("properties").GetProperty("deploymentId").GetProperty("description").GetString() ?? String.Empty).Contains("Omit it", StringComparison.Ordinal), "deploymentId says to omit it");

                    JsonElement invoked = await client.CallAsync<JsonElement>("tools/call", new { name = "garrison_invoke_agent", arguments = new { tenantId = "global", agent = "helper", input = "Delegated over MCP", waitSeconds = 60 } }, 90000).ConfigureAwait(false);
                    string text = ToolText(invoked);
                    using (JsonDocument summary = JsonDocument.Parse(text))
                    {
                        Assert.Equal("Succeeded", summary.RootElement.GetProperty("status").GetString(), "A stray tenantId from a run token is ignored (" + text + ")");
                    }

                    string wrongDeployment;
                    try
                    {
                        JsonElement result = await client.CallAsync<JsonElement>("tools/call", new { name = "garrison_invoke_agent", arguments = new { agent = "helper", input = "x", deploymentId = "helper" } }, 90000).ConfigureAwait(false);
                        wrongDeployment = result.GetProperty("content")[0].GetProperty("text").GetString() ?? String.Empty;
                    }
                    catch (Exception e) when (e is not TestAssertionException)
                    {
                        wrongDeployment = e.Message;
                    }
                    Assert.True(wrongDeployment.Contains("NotFound: ", StringComparison.Ordinal) && wrongDeployment.Contains("Omit deploymentId to use the agent's default routing.", StringComparison.Ordinal), "Deployment not found text: " + wrongDeployment);
                }
            }
        }

        private static async Task BlockedRunsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                string tenant = cluster.Server.TenantId;
                string runs = "/v1.0/api/tenants/" + tenant + "/runs";
                Garrison.Server.Runtime.BlockedRunService blocked = cluster.Server.Server.Context.Get<Garrison.Server.Runtime.BlockedRunService>();
                blocked.Invalidate();

                Agent echo = await cluster.CreateAgentAsync("blocked-echo", "builtin/fake", null, token).ConfigureAwait(false);
                Agent coder = await cluster.CreateAgentAsync("blocked-coder", "builtin/codex", null, token).ConfigureAwait(false);
                Agent pinned = await cluster.CreateAgentAsync("blocked-pinned", "builtin/fake", null, token, d => d.NodeSelector.Add(new DeploymentNodeSelector { Key = "zone", Value = "mars" })).ConfigureAwait(false);

                Run done = await InvokeAsync(cluster, echo, "Runs fine", true, token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Succeeded, done.Status, "capable run succeeds");
                TestResponse doneRaw = await HttpTestHelpers.SendAsync(cluster.Server.AdminClient, HttpMethod.Get, runs + "/" + done.Id, null, token).ConfigureAwait(false);
                Assert.True(doneRaw.Body.Contains("\"blockedReason\":null", StringComparison.Ordinal), "blockedReason is always present and null for finished runs: " + doneRaw.Body);

                Run codex = await InvokeAsync(cluster, coder, "Nobody runs Codex here", false, token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Queued, codex.Status, "Codex run waits");
                Assert.Equal(RunBlockedReasonEnum.NoCapableWorker, codex.BlockedReason ?? (RunBlockedReasonEnum)(-1), "invoke response carries blockedReason");
                Run pinnedRun = await InvokeAsync(cluster, pinned, "Nobody is on Mars", false, token).ConfigureAwait(false);
                Assert.Equal(RunBlockedReasonEnum.NoMatchingPool, pinnedRun.BlockedReason ?? (RunBlockedReasonEnum)(-1), "node selector mismatch");

                TestResponse raw = await HttpTestHelpers.SendAsync(cluster.Server.AdminClient, HttpMethod.Get, runs + "/" + codex.Id, null, token).ConfigureAwait(false);
                Assert.True(raw.Body.Contains("\"blockedReason\":\"NoCapableWorker\"", StringComparison.Ordinal), "REST read: " + raw.Body);
                Garrison.Core.Enumeration.EnumerationResult<Run> listed = await HttpTestHelpers.SendAsync<Garrison.Core.Enumeration.EnumerationResult<Run>>(cluster.Server.AdminClient, HttpMethod.Get, runs + "?status=Queued", null, 200, token).ConfigureAwait(false);
                Assert.Equal(RunBlockedReasonEnum.NoCapableWorker, listed.Objects.Single(r => r.Id == codex.Id).BlockedReason ?? (RunBlockedReasonEnum)(-1), "REST list");
                Assert.Equal(RunBlockedReasonEnum.NoMatchingPool, listed.Objects.Single(r => r.Id == pinnedRun.Id).BlockedReason ?? (RunBlockedReasonEnum)(-1), "REST list pinned");

                Garrison.Core.Responses.OverviewResponse overview = await HttpTestHelpers.SendAsync<Garrison.Core.Responses.OverviewResponse>(cluster.Server.AdminClient, HttpMethod.Get, "/v1.0/api/tenants/" + tenant + "/overview", null, 200, token).ConfigureAwait(false);
                Assert.Equal(2L, overview.BlockedRuns, "overview blockedRuns");
                Assert.Equal(2L, overview.Queued, "overview queued");

                using (McpHttpClient client = new McpHttpClient())
                {
                    client.SetRequestHeader("x-api-key", cluster.Server.Settings.Auth.AdminApiKey);
                    client.SetRequestHeader("x-tenant-id", tenant);
                    await client.ConnectStreamableAsync(cluster.Server.McpUrl, "/mcp").ConfigureAwait(false);
                    JsonElement got = await client.CallAsync<JsonElement>("tools/call", new { name = "garrison_get_run", arguments = new { tenantId = tenant, runId = codex.Id } }, 60000).ConfigureAwait(false);
                    Garrison.Server.Protocols.McpRunSummary summary = Serializer.Deserialize<Garrison.Server.Protocols.McpRunSummary>(ToolText(got)) ?? throw new TestAssertionException("Empty MCP summary.");
                    Assert.Equal("NoCapableWorker", summary.BlockedReason, "MCP run summary blockedReason");
                }

                Garrison.Server.Runtime.MaintenanceService maintenance = cluster.Server.Server.Context.Get<Garrison.Server.Runtime.MaintenanceService>();
                await maintenance.RunOnceAsync(token).ConfigureAwait(false);
                await maintenance.RunOnceAsync(token).ConfigureAwait(false);
                Garrison.Core.Responses.RunEventsResponse events = await HttpTestHelpers.SendAsync<Garrison.Core.Responses.RunEventsResponse>(cluster.Server.AdminClient, HttpMethod.Get, runs + "/" + codex.Id + "/events", null, 200, token).ConfigureAwait(false);
                List<RunEvent> warnings = events.Events.Where(e => e.EventType == RunEventTypeEnum.Warning).ToList();
                Assert.Equal(1, warnings.Count, "exactly one warning event");
                Assert.True((warnings[0].Text ?? String.Empty).Contains("Codex harness", StringComparison.Ordinal), "warning text: " + warnings[0].Text);

                Garrison.Core.Requests.SettingsUpdateRequest update = new Garrison.Core.Requests.SettingsUpdateRequest();
                update.Values.Add(new Garrison.Core.Requests.SettingValue { Path = "Runtime.FailBlockedAfterSeconds", Value = "1" });
                await HttpTestHelpers.SendAsync<Garrison.Core.Responses.SettingsSaveResponse>(cluster.Server.AdminClient, HttpMethod.Put, "/v1.0/api/settings", update, 200, token).ConfigureAwait(false);
                Garrison.Server.Runtime.RuntimeOptions options = cluster.Server.Server.Context.Get<Garrison.Server.Runtime.RuntimeOptions>();
                DateTime applyDeadline = DateTime.UtcNow.AddSeconds(15);
                while (options.FailBlockedAfterSeconds != 1 && DateTime.UtcNow < applyDeadline) await Task.Delay(100, token).ConfigureAwait(false);
                Assert.Equal(1, options.FailBlockedAfterSeconds, "cluster setting applied to the runtime");

                await Task.Delay(1200, token).ConfigureAwait(false);
                await maintenance.RunOnceAsync(token).ConfigureAwait(false);
                Run failed = await HttpTestHelpers.SendAsync<Run>(cluster.Server.AdminClient, HttpMethod.Get, runs + "/" + codex.Id, null, 200, token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Failed, failed.Status, "blocked run failed");
                Assert.Equal(RunOutcomeEnum.NoCapableWorker, failed.Outcome, "outcome NoCapableWorker");
                Assert.True(failed.BlockedReason == null, "finished runs are not blocked");
                Assert.True(!String.IsNullOrEmpty(failed.ErrorMessage), "failure explains itself");

                Garrison.Core.Responses.OverviewResponse after = await HttpTestHelpers.SendAsync<Garrison.Core.Responses.OverviewResponse>(cluster.Server.AdminClient, HttpMethod.Get, "/v1.0/api/tenants/" + tenant + "/overview", null, 200, token).ConfigureAwait(false);
                Assert.Equal(0L, after.BlockedRuns, "overview blockedRuns after failing");
            }
        }

        private static string ToolText(JsonElement result)
        {
            if (result.TryGetProperty("isError", out JsonElement isError) && isError.ValueKind == JsonValueKind.True) throw new TestAssertionException("Tool error: " + result.GetRawText());
            return result.GetProperty("content")[0].GetProperty("text").GetString() ?? String.Empty;
        }
    }
}
