namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Protocol;
    using Garrison.Core.Responses;
    using Garrison.Harnesses.Preflight;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>Real-process MCP stdio diagnostics, bounded failures, and environment isolation.</summary>
    public static class McpStdioSuite
    {
        /// <summary>Build the diagnostic suite.</summary>
        /// <returns>Suite descriptors.</returns>
        public static IReadOnlyList<TestSuiteDescriptor> Build()
        {
            List<TestSuiteDescriptor> suites = new List<TestSuiteDescriptor> { new TestSuiteDescriptor("mcp-stdio", "Worker stdio MCP diagnostics", new List<TestCaseDescriptor>
            {
                new TestCaseDescriptor("mcp-stdio", "handshake", "Stdio MCP initializes, follows pagination, checks tools, and uses only configured environment", SuccessAsync),
                new TestCaseDescriptor("mcp-stdio", "failures", "Stdio MCP missing tools, malformed JSON, cursor cycles, absent commands and timeouts are bounded", FailuresAsync),
                new TestCaseDescriptor("mcp-stdio", "cancellation", "Stdio MCP cancellation stops a hung subprocess", CancellationAsync)
            }) };
            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "mcp-stdio-" + provider.ToString().ToLowerInvariant();
                suites.Add(new TestSuiteDescriptor(id, "Worker stdio MCP dispatch", new List<TestCaseDescriptor>
                {
                    new TestCaseDescriptor(id, "queue", "MCP diagnostic queue atomically claims once, fences worker registrations, scopes outcomes, and expires", ct => QueueAsync(provider, ct)),
                    new TestCaseDescriptor(id, "worker", "A stdio diagnostic requested on replica B executes on the selected worker of replica A and leaves no queue entry", ct => WorkerAsync(provider, ct))
                }));
            }
            return suites;
        }

        private static async Task QueueAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                DateTime registration = DateTime.UtcNow;
                McpTestQueueEntry entry = new McpTestQueueEntry { TenantId = "tenant-diagnostic", ServerId = "mcp-diagnostic", NodeId = "node-diagnostic", NodeRegisteredUtc = registration, ServerUpdatedUtc = registration };
                await db.Nodes.CreateAsync(new Node { Id = entry.NodeId, Name = "diagnostic-node", RegisteredUtc = registration, SupportsMcpTests = true }, token).ConfigureAwait(false);
                await db.McpTests.CreateAsync(entry, token).ConfigureAwait(false);
                Assert.True(await db.McpTests.ReadAsync("other-tenant", entry.Id, token).ConfigureAwait(false) == null, "Tenant scoped");
                Assert.True(await db.McpTests.ClaimAsync(entry.NodeId, registration.AddSeconds(1), token).ConfigureAwait(false) == null, "Re-registration fences claim");
                Task<McpTestQueueEntry?>[] claims = Enumerable.Range(0, 8).Select(_ => db.McpTests.ClaimAsync(entry.NodeId, registration, token)).ToArray();
                Assert.Equal(1, (await Task.WhenAll(claims).ConfigureAwait(false)).Count(e => e != null), "One atomic claim");
                McpServerTestResponse outcome = new McpServerTestResponse { Success = true, Tools = new List<string> { "fixture_echo", "fixture_status" }, DurationMs = 4 };
                Assert.True(!await db.McpTests.CompleteAsync(entry.NodeId, registration.AddSeconds(1), entry.Id, outcome, token).ConfigureAwait(false), "Stale registration refuses completion");
                Assert.True(await db.McpTests.CompleteAsync(entry.NodeId, registration, entry.Id, outcome, token).ConfigureAwait(false), "Current completion");
                Assert.True(!await db.McpTests.CompleteAsync(entry.NodeId, registration, entry.Id, outcome, token).ConfigureAwait(false), "Duplicate completion does not replace tools");
                McpTestQueueEntry? saved = await db.McpTests.ReadAsync(entry.TenantId, entry.Id, token).ConfigureAwait(false);
                Assert.True(saved != null && saved.Finished && saved.Result.Success && saved.Result.Tools.SequenceEqual(outcome.Tools), "Structured result round-trip");
                await db.McpTests.DeleteAsync("other-tenant", entry.Id, token).ConfigureAwait(false);
                Assert.NotNull(await db.McpTests.ReadAsync(entry.TenantId, entry.Id, token).ConfigureAwait(false), "Other tenant cannot delete");
                await db.McpTests.DeleteAsync(entry.TenantId, entry.Id, token).ConfigureAwait(false);
                Node currentNode = await db.Nodes.ReadAsync(entry.NodeId, token).ConfigureAwait(false) ?? throw new InvalidOperationException("Missing fixture node");
                currentNode.RegisteredUtc = registration.AddSeconds(1);
                await db.Nodes.UpdateAsync(currentNode, token).ConfigureAwait(false);
                entry.Id = Garrison.Core.Helpers.IdGenerator.New(Garrison.Core.Constants.McpTestIdPrefix);
                await db.McpTests.CreateAsync(entry, token).ConfigureAwait(false);
                Assert.True(await db.McpTests.ClaimAsync(entry.NodeId, registration, token).ConfigureAwait(false) == null, "Database rechecks current registration after a stale heartbeat snapshot");
                await db.McpTests.DeleteAsync(entry.TenantId, entry.Id, token).ConfigureAwait(false);
                entry.Id = Garrison.Core.Helpers.IdGenerator.New(Garrison.Core.Constants.McpTestIdPrefix); entry.ExpiresUtc = DateTime.UtcNow.AddSeconds(-1);
                await db.McpTests.CreateAsync(entry, token).ConfigureAwait(false);
                Assert.True(await db.McpTests.ClaimAsync(entry.NodeId, registration, token).ConfigureAwait(false) == null, "Expired cannot start");
                await db.McpTests.RemoveExpiredAsync(token).ConfigureAwait(false);
                Assert.True(await db.McpTests.ReadAsync(entry.TenantId, entry.Id, token).ConfigureAwait(false) == null, "Expired queue cleanup");
            }
        }

        private static async Task WorkerAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 0, token).ConfigureAwait(false))
            await using (TestServerHost replica = await TestServerHost.StartAsync(provider, settings =>
            {
                settings.Database = cluster.Server.Settings.Database;
                settings.NodeId = "stdio-second-replica";
            }, token).ConfigureAwait(false))
            {
                cluster.Workers.Add(await TestCluster.StartWorkerAsync(cluster.Server.BaseUrl, "single-slot-diagnostic", settings => settings.MaxConcurrentRuns = 1, token).ConfigureAwait(false));
                string api = "/v1.0/api/tenants/" + cluster.Server.TenantId;
                await HttpTestHelpers.SendAsync<Secret>(cluster.Server.AdminClient, HttpMethod.Post, api + "/secrets", new SecretRequest { Name = "fixture_stdio_secret", Value = "fixture-private-value" }, 201, token).ConfigureAwait(false);
                McpServer server = await HttpTestHelpers.SendAsync<McpServer>(cluster.Server.AdminClient, HttpMethod.Post, api + "/mcp-servers", new McpServer
                {
                    Name = "stdio-fixture", Active = false, Transport = McpTransportEnum.Stdio, Command = "garrison-fake-harness",
                    Arguments = new List<string> { "--mcp-stdio", "--stdio-env" }, RequiredTools = new List<string> { "fixture_status" },
                    Environment = new List<McpServerVariable> { new McpServerVariable { Name = "MCP_FIXTURE_SECRET", ValueTemplate = "{{secret.fixture_stdio_secret}}" } }
                }, 201, token).ConfigureAwait(false);
                Node node = (await cluster.Server.Server.Context.Database.Nodes.EnumerateAsync(new EnumerationQuery(), token).ConfigureAwait(false)).Objects.Single();
                Assert.True(node.SupportsMcpTests, "Worker advertises support");
                await HttpTestHelpers.SendAsync<ErrorResponse>(replica.AdminClient, HttpMethod.Post, api + "/mcp-servers/" + server.Id + "/test", null, 400, token).ConfigureAwait(false);
                McpServerTestResponse result = await HttpTestHelpers.SendAsync<McpServerTestResponse>(replica.AdminClient, HttpMethod.Post, api + "/mcp-servers/" + server.Id + "/test?nodeId=" + node.Id, null, 200, token).ConfigureAwait(false);
                Assert.True(result.Success && result.Tools.Contains("fixture_status") && result.NodeId == node.Id, result.Error ?? "Remote worker diagnostic");
                Assert.True(!Garrison.Core.Serialization.Serializer.Serialize(result).Contains("fixture-private-value", StringComparison.Ordinal), "Credentials absent from outcome");
                EnumerationResult<RequestHistoryEntry> history = await cluster.Server.Server.Context.Database.RequestHistory.EnumerateAsync(null, new EnumerationQuery { MaxResults = 1000 }, token).ConfigureAwait(false);
                Assert.True(history.Objects.All(row => !(row.RequestBody ?? String.Empty).Contains("fixture-private-value", StringComparison.Ordinal) && !(row.ResponseBody ?? String.Empty).Contains("fixture-private-value", StringComparison.Ordinal)), "Diagnostic credentials absent from request history");
            }
        }

        private static McpWorkerTest Test(string? flag = null)
        {
            McpWorkerTest test = new McpWorkerTest { Command = "dotnet", TimeoutMs = 1000 };
            test.Arguments.Add(Path.Combine(AppContext.BaseDirectory, "garrison-fake-harness.dll"));
            test.Arguments.Add("--mcp-stdio");
            if (flag != null) test.Arguments.Add(flag);
            return test;
        }

        private static async Task<McpServerTestResponse> ProbeAsync(McpWorkerTest test, CancellationToken token)
        {
            string work = Path.Combine(Path.GetTempPath(), "garrison-mcp-probe-" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(work);
            try
            {
                Dictionary<string, string> environment = new Dictionary<string, string> { ["PATH"] = Environment.GetEnvironmentVariable("PATH") ?? String.Empty };
                return await new McpStdioProbe().TestAsync(test, work, environment, token).ConfigureAwait(false);
            }
            finally { Directory.Delete(work, true); }
        }

        private static async Task SuccessAsync(CancellationToken token)
        {
            McpWorkerTest test = Test("--stdio-env");
            test.Environment.Add(new ExecutionEnvironmentVariable { Name = "MCP_FIXTURE_SECRET", Value = "fixture-private-value", IsSecret = true });
            test.RequiredTools.Add("fixture_status");
            McpServerTestResponse result = await ProbeAsync(test, token).ConfigureAwait(false);
            Assert.True(result.Success, result.Error ?? "Handshake success");
            Assert.Equal(2, result.Tools.Count, "Both pages");
            Assert.Equal(0, result.MissingRequiredTools.Count, "Required tools");
        }

        private static async Task FailuresAsync(CancellationToken token)
        {
            foreach (string flag in new[] { "--stdio-malformed", "--stdio-cycle", "--stdio-hang", "--stdio-env" })
            {
                McpServerTestResponse result = await ProbeAsync(Test(flag), token).ConfigureAwait(false);
                Assert.True(!result.Success && !String.IsNullOrEmpty(result.Error), "Safe failure for " + flag);
                Assert.True(!result.Error!.Contains("fixture-private-value", StringComparison.Ordinal), "No protocol or stderr secret");
                Assert.True(result.DurationMs < 5000, "Bounded failure");
            }
            McpWorkerTest missing = Test(); missing.RequiredTools.Add("does_not_exist");
            Assert.True(!(await ProbeAsync(missing, token).ConfigureAwait(false)).Success, "Missing required tool");
            McpWorkerTest absent = Test(); absent.Command = "not-a-garrison-command-" + Guid.NewGuid().ToString("N");
            Assert.True(!(await ProbeAsync(absent, token).ConfigureAwait(false)).Success, "Missing executable");
        }

        private static async Task CancellationAsync(CancellationToken token)
        {
            using (CancellationTokenSource cancel = CancellationTokenSource.CreateLinkedTokenSource(token))
            {
                cancel.CancelAfter(200);
                bool cancelled = false;
                try { await ProbeAsync(Test("--stdio-hang"), cancel.Token).ConfigureAwait(false); }
                catch (OperationCanceledException) { cancelled = true; }
                Assert.True(cancelled, "Host cancellation propagates after process cleanup");
            }
        }
    }
}
