namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Memory;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Security;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>Replaceable memory persistence, scope isolation and MCP integration.</summary>
    public static class AgentMemorySuite
    {
        /// <summary>Build memory suites.</summary><returns>Suites.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            List<TestSuiteDescriptor> suites = new List<TestSuiteDescriptor>
            {
                new TestSuiteDescriptor("agent-memory", "Agent memory", new List<TestCaseDescriptor>
                {
                    new TestCaseDescriptor("agent-memory", "filesystem-contract", "Durability, tenant/agent isolation, atomic concurrent writes, bounds, links and cancellation", ContractAsync)
                })
            };
            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "agent-memory-" + provider.ToString().ToLowerInvariant();
                suites.Add(new TestSuiteDescriptor(id, "Memory MCP", new List<TestCaseDescriptor>
                {
                    new TestCaseDescriptor(id, "mcp-roundtrip", "Opt-in MCP memory persists across sessions, isolates agents and accepts an interface replacement", ct => McpAsync(provider, ct)),
                    new TestCaseDescriptor(id, "disabled-discovery", "Disabled optional memory is hidden and fails closed", ct => DisabledAsync(provider, ct))
                }));
            }
            return suites;
        }

        private static async Task ContractAsync(CancellationToken token)
        {
            string root = Path.Combine(Path.GetTempPath(), "garrison-memory-" + Guid.NewGuid().ToString("N"));
            try
            {
                IAgentMemoryStore store = new FilesystemAgentMemoryStore(root + Path.DirectorySeparatorChar, 1024);
                await store.DeleteAsync("new-tenant", "new-agent", "absent", token).ConfigureAwait(false);
                await store.WriteAsync("tenant1", "agent1", "../opaque-key", "remember this", token).ConfigureAwait(false);
                store = new FilesystemAgentMemoryStore(root, 1024);
                Assert.Equal("remember this", await store.ReadAsync("tenant1", "agent1", "../opaque-key", token).ConfigureAwait(false), "new instance retains memory");
                Assert.True(await store.ReadAsync("tenant2", "agent1", "../opaque-key", token).ConfigureAwait(false) == null, "tenant isolation");
                Assert.True(await store.ReadAsync("tenant1", "agent2", "../opaque-key", token).ConfigureAwait(false) == null, "agent isolation");
                List<Task> writes = Enumerable.Range(0, 30).Select(i => store.WriteAsync("tenant1", "agent1", "race", new string((char)('a' + i % 26), 1000), token)).ToList();
                await Task.WhenAll(writes).ConfigureAwait(false);
                string? final = await store.ReadAsync("tenant1", "agent1", "race", token).ConfigureAwait(false);
                Assert.True(final != null && final.Length == 1000 && final.All(c => c == final[0]), "atomic replacement has no torn value");
                bool bounded = false;
                try { await store.WriteAsync("tenant1", "agent1", "large", new string('x', 1025), token).ConfigureAwait(false); }
                catch (ArgumentException) { bounded = true; }
                Assert.True(bounded, "bounded bytes");
                using (CancellationTokenSource cancelled = new CancellationTokenSource())
                {
                    cancelled.Cancel(); bool stopped = false;
                    try { await store.DeleteAsync("tenant1", "agent1", "race", cancelled.Token).ConfigureAwait(false); }
                    catch (OperationCanceledException) { stopped = true; }
                    Assert.True(stopped, "cancellation prevents mutation");
                }
                if (!OperatingSystem.IsWindows())
                {
                    string link = root + "-link";
                    Directory.CreateSymbolicLink(link, root);
                    try
                    {
                        bool rejected = false;
                        try { await new FilesystemAgentMemoryStore(link).ReadAsync("tenant1", "agent1", "race", token).ConfigureAwait(false); }
                        catch (IOException) { rejected = true; }
                        Assert.True(rejected, "linked root refused");
                    }
                    finally { Directory.Delete(link); }
                }
                await store.DeleteAsync("tenant1", "agent1", "race", token).ConfigureAwait(false);
                await store.DeleteAsync("tenant1", "agent1", "race", token).ConfigureAwait(false);
                Assert.True(await store.ReadAsync("tenant1", "agent1", "race", token).ConfigureAwait(false) == null, "idempotent deletion");
            }
            finally { if (Directory.Exists(root)) Directory.Delete(root, true); }
        }

        private static async Task McpAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            string root = Path.Combine(Path.GetTempPath(), "garrison-memory-mcp-" + Guid.NewGuid().ToString("N"));
            try
            {
                await using (TestServerHost host = await TestServerHost.StartAsync(provider, s => { s.AgentMemory.Enabled = true; s.AgentMemory.RootDirectory = root; }, token).ConfigureAwait(false))
                {
                    Agent agent = await host.Server.Context.Database.Agents.CreateAsync(new Agent { TenantId = host.TenantId, Name = "memory-agent" }, token).ConfigureAwait(false);
                    Agent other = await host.Server.Context.Database.Agents.CreateAsync(new Agent { TenantId = host.TenantId, Name = "memory-other" }, token).ConfigureAwait(false);
                    using (TestMcpClient client = new TestMcpClient())
                    {
                        await client.ConnectAsync(host, null, token).ConfigureAwait(false);
                        await client.CallAsync<AgentMemoryResult>("garrison_memory_write", new { agent = agent.Id, key = "context", value = "persistent-context" }, token).ConfigureAwait(false);
                    }
                    Deployment deployment = await host.Server.Context.Database.Deployments.CreateAsync(new Deployment { TenantId = host.TenantId, Name = "memory-agent", AgentId = agent.Id, HarnessProfileId = "hrn_builtin_fake" }, token).ConfigureAwait(false);
                    Run run = await host.Server.Context.Database.Runs.CreateAsync(new Run { TenantId = host.TenantId, AgentId = agent.Id, DeploymentId = deployment.Id, Status = RunStatusEnum.Running, CallerType = PrincipalTypeEnum.Administrator, LeaseEpoch = 1, LeaseExpiresUtc = DateTime.UtcNow.AddMinutes(5) }, token).ConfigureAwait(false);
                    string bearer = await host.Server.Context.Authentication.IssueForRunAsync(run, 1, DateTime.UtcNow.AddMinutes(5), token).ConfigureAwait(false);
                    using (TestMcpClient client = new TestMcpClient())
                    {
                        await client.ConnectAsync(host, bearer, token).ConfigureAwait(false);
                        await client.CallAsync<AgentMemoryResult>("garrison_memory_write", new { key = "from-run", value = "saved by active run" }, token).ConfigureAwait(false);
                        await client.ExpectErrorAsync("garrison_memory_read", new { agent = other.Id, key = "context" }, "Forbidden", token).ConfigureAwait(false);
                        run.LeaseExpiresUtc = DateTime.UtcNow.AddSeconds(-1);
                        await host.Server.Context.Database.Runs.UpdateAsync(run, token).ConfigureAwait(false);
                        bool rejected = false;
                        try { await client.CallAsync<AgentMemoryResult>("garrison_memory_write", new { key = "from-run", value = "stale" }, token).ConfigureAwait(false); }
                        catch (Exception error) when (error is not OperationCanceledException) { rejected = true; }
                        Assert.True(rejected, "expired run cannot mutate memory");
                        Assert.Equal("saved by active run", await host.Server.Context.Get<IAgentMemoryStore>().ReadAsync(host.TenantId, agent.Id, "from-run", token).ConfigureAwait(false), "stale call leaves value unchanged");
                    }
                    User viewer = await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + host.TenantId + "/users", new UserRequest { Email = "memory-viewer@example.com", Password = "password123" }, 201, token).ConfigureAwait(false);
                    await HttpTestHelpers.SendAsync<UserRoleAssignment>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + host.TenantId + "/user-role-assignments", new AssignmentRequest { UserId = viewer.Id, RoleName = BuiltInRoles.Viewer }, 201, token).ConfigureAwait(false);
                    using (HttpClient login = await host.UserClientAsync(viewer.Email, "password123", host.TenantId, token).ConfigureAwait(false))
                    using (TestMcpClient client = new TestMcpClient())
                    {
                        await client.ConnectAsync(host, login.DefaultRequestHeaders.Authorization!.Parameter, token).ConfigureAwait(false);
                        await client.ExpectErrorAsync("garrison_memory_write", new { agent = agent.Id, key = "context", value = "viewer overwrite" }, "Forbidden", token).ConfigureAwait(false);
                        await client.ExpectErrorAsync("garrison_memory_read", new { agent = agent.Id, key = "context" }, "Forbidden", token).ConfigureAwait(false);
                    }
                    // Replace implementation through the interface, preserving the durable backing root.
                    host.Server.Context.Register<IAgentMemoryStore>(new FilesystemAgentMemoryStore(root));
                    using (TestMcpClient client = new TestMcpClient())
                    {
                        await client.ConnectAsync(host, null, token).ConfigureAwait(false);
                        AgentMemoryResult read = await client.CallAsync<AgentMemoryResult>("garrison_memory_read", new { agent = agent.Id, key = "context" }, token).ConfigureAwait(false);
                        Assert.Equal("persistent-context", read.Value, "memory across sessions and backend instances");
                        Assert.True(!(await client.CallAsync<AgentMemoryResult>("garrison_memory_read", new { agent = other.Id, key = "context" }, token).ConfigureAwait(false)).Found, "agent scope isolation");
                        await client.CallAsync<AgentMemoryResult>("garrison_memory_delete", new { agent = agent.Id, key = "context" }, token).ConfigureAwait(false);
                        await client.ExpectErrorAsync("garrison_memory_write", new { agent = agent.Id, key = "context", value = new string('x', 65537) }, "BadRequest", token).ConfigureAwait(false);
                    }
                }
            }
            finally { if (Directory.Exists(root)) Directory.Delete(root, true); }
        }

        private static async Task DisabledAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            using (TestMcpClient client = new TestMcpClient())
            {
                await client.ConnectAsync(host, null, token).ConfigureAwait(false);
                Assert.True(!(await client.ToolsAsync(token).ConfigureAwait(false)).Tools.Any(t => t.Name.StartsWith("garrison_memory_", StringComparison.Ordinal)), "disabled tools hidden");
                await client.ExpectErrorAsync("garrison_memory_read", new { agent = "unknown", key = "x" }, "MemoryDisabled", token).ConfigureAwait(false);
            }
        }
    }
}
