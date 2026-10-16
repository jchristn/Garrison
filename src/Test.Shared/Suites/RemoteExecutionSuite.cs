namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Net.Http;
    using System.Text.Json;
    using Garrison.Core.Serialization;
    using WatsonWebserver;
    using WatsonWebserver.Core;
    using HttpMethod = System.Net.Http.HttpMethod;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Protocol;
    using Garrison.Core.Requests;
    using Garrison.Core.Security;
    using Garrison.Core.Services;
    using Garrison.Server.Runtime;
    using Garrison.Worker.Execution;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>Remote A2A/MCP worker execution, registration expiry, and credential boundary regressions (P12.4).</summary>
    public static class RemoteExecutionSuite
    {
        /// <summary>Build remote execution suites.</summary>
        /// <returns>Provider suites.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            List<TestSuiteDescriptor> suites = new List<TestSuiteDescriptor>();
            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "remote-execution-" + provider.ToString().ToLowerInvariant();
                suites.Add(new TestSuiteDescriptor(id, "Remote execution (" + provider + ")", new List<TestCaseDescriptor>
                {
                    new TestCaseDescriptor(id, "compile-registration", "Remote specs use tenant scoped credentials and reject expired registrations at compile", ct => CompileAsync(provider, ct)),
                    new TestCaseDescriptor(id, "health-crosses-registration-expiry", "Slow A2A/MCP health discovery cannot dispatch after registration expiry", ct => HealthExpiryAsync(ct)),
                    new TestCaseDescriptor(id, "mcp-health-call", "Worker initializes MCP, verifies advertised tool, calls it and returns structured output", ct => McpAsync(provider, ct)),
                    new TestCaseDescriptor(id, "a2a-worker", "Remote A2A registration executes through a worker against another hosted agent", ct => A2AAsync(provider, ct)),
                    new TestCaseDescriptor(id, "ssrf-cancellation", "Remote dispatch refuses metadata, expired registration and malformed MCP input and honors cancellation", ct => RefusalAsync(ct))
                }));
            }
            return suites;
        }

        private static async Task<string> BearerAsync(TestServerHost host, CancellationToken token)
        {
            using (HttpClient client = await host.UserClientAsync(host.Settings.Security.AdminEmail, host.Settings.Security.AdminPassword, token: token).ConfigureAwait(false))
                return client.DefaultRequestHeaders.GetValues("Authorization").First().Substring(7);
        }

        private static async Task CompileAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                SecretCipher cipher = new SecretCipher("remote-test-key");
                Secret secret = new Secret { TenantId = "t", Name = "remote-token", Kind = SecretKindEnum.BearerToken };
                secret.ValueEncrypted = cipher.Encrypt("remote-private-token", secret.Id);
                await db.Secrets.CreateAsync(secret, token).ConfigureAwait(false);
                Agent agent = await db.Agents.CreateAsync(new Agent { TenantId = "t", Name = "remote", Kind = AgentKindEnum.Remote, RemoteProtocol = RemoteProtocolEnum.Mcp, RemoteEndpointUrl = "http://127.0.0.1:8701/mcp", McpToolName = "echo", RemoteCredentialSecretId = secret.Id, LastRegisteredUtc = DateTime.UtcNow, RegistrationTtlSeconds = 60 }, token).ConfigureAwait(false);
                InvocationCompiler compiler = new InvocationCompiler(db, cipher, new CompilerOptions());
                Run run = new Run { TenantId = "t", AgentId = agent.Id, DeploymentId = agent.Id, AgentName = agent.Name, Executor = RunExecutorEnum.RemoteMcp, InputText = "{}" };
                CompilationResult compiled = await compiler.CompileAsync(run, null, token).ConfigureAwait(false);
                Assert.Equal("remote-private-token", compiled.Spec.RemoteAgent!.BearerToken, "credential resolved");
                Assert.True(compiled.Spec.ScrubValues.Contains("remote-private-token"), "credential scrubbed");
                agent.RemoteCredentialSecretId = (await db.Secrets.CreateAsync(new Secret { TenantId = "other", Name = "foreign", ValueEncrypted = cipher.Encrypt("foreign-token", "foreign") }, token).ConfigureAwait(false)).Id;
                await db.Agents.UpdateAsync(agent, token).ConfigureAwait(false);
                try { await compiler.CompileAsync(run, null, token).ConfigureAwait(false); throw new TestAssertionException("cross tenant credential accepted"); }
                catch (CompilationException e) { Assert.Equal("ReferenceNotFound", e.Code, "tenant isolation"); }
                agent.LastRegisteredUtc = DateTime.UtcNow.AddMinutes(-2);
                await db.Agents.UpdateAsync(agent, token).ConfigureAwait(false);
                try { await compiler.CompileAsync(run, null, token).ConfigureAwait(false); throw new TestAssertionException("expired registration accepted"); }
                catch (CompilationException e) { Assert.Equal("RemoteRegistrationExpired", e.Code, "expiry code"); }
            }
        }

        private static async Task McpAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, token: token).ConfigureAwait(false))
            {
                string bearer = await BearerAsync(host, token).ConfigureAwait(false);
                RunAssignment assignment = new RunAssignment { Spec = new ExecutionSpec { Executor = RunExecutorEnum.RemoteMcp, TimeoutSeconds = 15, RemoteAgent = new ExecutionRemoteAgent { Protocol = RemoteProtocolEnum.Mcp, EndpointUrl = host.McpUrl + "/mcp", ToolName = "garrison_list_agents", BearerToken = bearer, Input = "{}" } } };
                RemoteTestReporter reporter = new RemoteTestReporter();
                RunCompleteRequest result = await new RemoteRunExecutor().ExecuteAsync(assignment, reporter, token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Succeeded, result.Status, "MCP completion: " + result.ErrorMessage);
                Assert.True(reporter.Events.Any(e => e.Code == "RemoteHealthy"), "health event");
                assignment.Spec.RemoteAgent.ToolName = "does-not-exist";
                RunCompleteRequest missing = await new RemoteRunExecutor().ExecuteAsync(assignment, reporter, token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Failed, missing.Status, "unadvertised tool refuses dispatch");
            }
        }

        private static async Task A2AAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                Agent hosted = await cluster.CreateAgentAsync("remote-target", configure: a => a.ExposeA2A = true, token: token).ConfigureAwait(false);
                string bearer = await BearerAsync(cluster.Server, token).ConfigureAwait(false);
                string tenant = cluster.Server.TenantId;
                Secret secret = new Secret { TenantId = tenant, Name = "remote-a2a-token", Kind = SecretKindEnum.BearerToken };
                // The test server's configured master key is also used by its runtime compiler.
                secret.ValueEncrypted = new SecretCipher(cluster.Server.Settings.Security.MasterKey).Encrypt(bearer, secret.Id);
                await cluster.Server.Server.Context.Database.Secrets.CreateAsync(secret, token).ConfigureAwait(false);
                Agent remote = await cluster.Server.Server.Context.Database.Agents.CreateAsync(new Agent { TenantId = tenant, Name = "remote-caller", Kind = AgentKindEnum.Remote, RemoteProtocol = RemoteProtocolEnum.A2A, RemoteEndpointUrl = cluster.Server.BaseUrl + "/v1.0/a2a/" + tenant + "/" + hosted.Name, RemoteCredentialSecretId = secret.Id, LastRegisteredUtc = DateTime.UtcNow, RegistrationTtlSeconds = 60 }, token).ConfigureAwait(false);
                string path = "/v1.0/api/tenants/" + tenant;
                Run started = await HttpTestHelpers.SendAsync<Run>(cluster.Server.AdminClient, HttpMethod.Post, path + "/agents/" + remote.Id + "/invoke", new InvokeRequest { Wait = false, Input = "remote worker input" }, 202, token).ConfigureAwait(false);
                Run? final = null;
                for (int attempt = 0; attempt < 200; attempt++)
                {
                    final = await cluster.Server.Server.Context.Database.Runs.ReadAsync(tenant, started.Id, token).ConfigureAwait(false);
                    if (final != null && RunService.IsTerminal(final.Status)) break;
                    await Task.Delay(100, token).ConfigureAwait(false);
                }
                Assert.Equal(RunStatusEnum.Succeeded, final!.Status, "A2A worker completion: " + final.ErrorMessage);
                Deployment slow = (await cluster.Server.Server.Context.Database.Deployments.ReadByNameAsync(tenant, hosted.Name + "-default", token).ConfigureAwait(false))!;
                slow.Parameters.Add(new DeploymentParameter { Name = "delayMs", Value = "8000" });
                await cluster.Server.Server.Context.Database.Deployments.UpdateAsync(slow, token).ConfigureAwait(false);
                RunAssignment timed = new RunAssignment { RunId = "remote-timeout-" + Guid.NewGuid().ToString("N"), Spec = new ExecutionSpec { Executor = RunExecutorEnum.RemoteA2A, TimeoutSeconds = 1, RemoteAgent = new ExecutionRemoteAgent { Protocol = RemoteProtocolEnum.A2A, EndpointUrl = remote.RemoteEndpointUrl!, BearerToken = bearer, Input = "slow request" } } };
                System.Diagnostics.Stopwatch elapsed = System.Diagnostics.Stopwatch.StartNew();
                RunCompleteRequest timeout = await new RemoteRunExecutor().ExecuteAsync(timed, new RemoteTestReporter(), token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.TimedOut, timeout.Status, "in-flight remote timeout");
                Assert.True(elapsed.Elapsed < TimeSpan.FromSeconds(4), "timeout bounds local remote request");
                timed.RunId = "remote-cancel-" + Guid.NewGuid().ToString("N");
                timed.Spec.TimeoutSeconds = 10;
                using (CancellationTokenSource cancelled = CancellationTokenSource.CreateLinkedTokenSource(token))
                {
                    cancelled.CancelAfter(300);
                    RunCompleteRequest cancelledResult = await new RemoteRunExecutor().ExecuteAsync(timed, new RemoteTestReporter(), cancelled.Token).ConfigureAwait(false);
                    Assert.Equal(RunStatusEnum.Cancelled, cancelledResult.Status, "in-flight caller cancellation");
                }
                remote.LastRegisteredUtc = DateTime.UtcNow.AddMinutes(-2);
                await cluster.Server.Server.Context.Database.Agents.UpdateAsync(remote, token).ConfigureAwait(false);
                TestResponse refused = await HttpTestHelpers.SendAsync(cluster.Server.AdminClient, HttpMethod.Post, path + "/agents/" + remote.Id + "/invoke", new InvokeRequest { Wait = false, Input = "stale" }, token).ConfigureAwait(false);
                Assert.Equal(409, refused.StatusCode, "expired registration admission");
                Assert.True(refused.Body.Contains("RemoteRegistrationExpired", StringComparison.Ordinal), "expiry code");
            }
        }

        private static async Task HealthExpiryAsync(CancellationToken token)
        {
            foreach (RemoteProtocolEnum protocol in new[] { RemoteProtocolEnum.Mcp, RemoteProtocolEnum.A2A })
            {
                int mutations = 0;
                int health = 0;
                string endpoint = "http://127.0.0.1:" + TestServerHost.FreePort();
                DateTime expiry = DateTime.UtcNow.AddSeconds(1);
                using (Webserver server = new Webserver(new WebserverSettings { Hostname = "127.0.0.1", Port = new Uri(endpoint).Port }, async context =>
                {
                    context.Response.ContentType = "application/json";
                    if (protocol == RemoteProtocolEnum.A2A)
                    {
                        if (context.Request.Method.ToString() == "GET")
                        {
                            Interlocked.Increment(ref health);
                            TimeSpan remaining = expiry - DateTime.UtcNow;
                            if (remaining > TimeSpan.Zero) await Task.Delay(remaining + TimeSpan.FromMilliseconds(100), token).ConfigureAwait(false);
                            await context.Response.Send(Serializer.Serialize(new { name = "expiry-fixture", url = endpoint, version = "1.0", capabilities = new { }, defaultInputModes = new[] { "text" }, defaultOutputModes = new[] { "text" }, skills = new object[0] })).ConfigureAwait(false);
                        }
                        else { Interlocked.Increment(ref mutations); await context.Response.Send("{}").ConfigureAwait(false); }
                        return;
                    }
                    if (context.Request.Method.ToString() != "POST") { context.Response.StatusCode = 405; await context.Response.Send(String.Empty).ConfigureAwait(false); return; }
                    using (JsonDocument document = JsonDocument.Parse(context.Request.DataAsString))
                    {
                        JsonElement request = document.RootElement;
                        string? methodName = request.GetProperty("method").GetString();
                        if (!request.TryGetProperty("id", out JsonElement id)) { context.Response.StatusCode = 202; await context.Response.Send(String.Empty).ConfigureAwait(false); return; }
                        object result;
                        if (methodName == "initialize") result = new { protocolVersion = "2025-03-26", capabilities = new { tools = new { } }, serverInfo = new { name = "expiry-fixture", version = "1" } };
                        else if (methodName == "tools/list")
                        {
                            Interlocked.Increment(ref health);
                            TimeSpan remaining = expiry - DateTime.UtcNow;
                            if (remaining > TimeSpan.Zero) await Task.Delay(remaining + TimeSpan.FromMilliseconds(100), token).ConfigureAwait(false);
                            result = new { tools = new[] { new { name = "mutate", inputSchema = new { type = "object" } } } };
                        }
                        else { Interlocked.Increment(ref mutations); result = new { content = new object[0] }; }
                        await context.Response.Send(Serializer.Serialize(new { jsonrpc = "2.0", id = id.Clone(), result })).ConfigureAwait(false);
                    }
                }))
                {
                    server.Start();
                    RunAssignment assignment = new RunAssignment { Spec = new ExecutionSpec { Executor = protocol == RemoteProtocolEnum.Mcp ? RunExecutorEnum.RemoteMcp : RunExecutorEnum.RemoteA2A, TimeoutSeconds = 10, RemoteAgent = new ExecutionRemoteAgent { Protocol = protocol, EndpointUrl = endpoint, ToolName = "mutate", Input = "{}", ExpiresUtc = expiry } } };
                    RunCompleteRequest result = await new RemoteRunExecutor().ExecuteAsync(assignment, new RemoteTestReporter(), token).ConfigureAwait(false);
                    Assert.True(health > 0, "Real protocol health response crossed registration expiry: " + protocol + ": " + result.ErrorMessage);
                    Assert.True(result.ErrorMessage?.Contains("RemoteRegistrationExpired", StringComparison.Ordinal) == true, "Expiry prevents dispatch after slow health: " + protocol + ": " + result.ErrorMessage);
                    Assert.Equal(0, mutations, "No remote mutation dispatched after registration expiry: " + protocol);
                    server.Stop();
                }
            }
        }

        private static async Task RefusalAsync(CancellationToken token)
        {
            RemoteRunExecutor executor = new RemoteRunExecutor();
            RemoteTestReporter reporter = new RemoteTestReporter();
            RunAssignment assignment = new RunAssignment { Spec = new ExecutionSpec { Executor = RunExecutorEnum.RemoteA2A, TimeoutSeconds = 2, RemoteAgent = new ExecutionRemoteAgent { Protocol = RemoteProtocolEnum.A2A, EndpointUrl = "http://169.254.169.254/", Input = "metadata forbidden" } } };
            RunCompleteRequest blocked = await executor.ExecuteAsync(assignment, reporter, token).ConfigureAwait(false);
            Assert.Equal(RunStatusEnum.Failed, blocked.Status, "metadata refused");
            Assert.True(blocked.ErrorMessage != null, "metadata refusal error");
            assignment.Spec.RemoteAgent.ExpiresUtc = DateTime.UtcNow.AddSeconds(-1);
            RunCompleteRequest expired = await executor.ExecuteAsync(assignment, reporter, token).ConfigureAwait(false);
            Assert.True(expired.ErrorMessage!.Contains("RemoteRegistrationExpired", StringComparison.Ordinal), "worker expiry defense");
            using (CancellationTokenSource cancelled = new CancellationTokenSource())
            {
                cancelled.Cancel();
                RunCompleteRequest result = await executor.ExecuteAsync(assignment, reporter, cancelled.Token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Cancelled, result.Status, "cancellation");
            }
            assignment.Spec.Executor = RunExecutorEnum.RemoteMcp;
            assignment.Spec.RemoteAgent = new ExecutionRemoteAgent { Protocol = RemoteProtocolEnum.Mcp, EndpointUrl = "http://127.0.0.1:1/mcp", ToolName = "echo", Input = "[]" };
            RunCompleteRequest malformed = await executor.ExecuteAsync(assignment, reporter, token).ConfigureAwait(false);
            Assert.Equal(RunStatusEnum.Failed, malformed.Status, "non-object tool input refused");
        }
    }
}
