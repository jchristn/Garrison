namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Net.Http;
    using System.Net.WebSockets;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Serialization;
    using Garrison.Server.Runtime;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Parallel fan-out and gather (AD5): groups of child runs started in one call and refused as a whole when a member
    /// fails its checks; join policies, partial results, failures, and timeouts; budgets and cancellation; suspension
    /// and capacity on a one-slot worker; and the REST routes and fan-out channel.
    /// </summary>
    public static class FanOutSuite
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
                string id = "fanout-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                cases.Add(new TestCaseDescriptor(id, "start-refuse", "garrison_fan_out starts 5 children of the calling run in one call; a disallowed member or a call wider than the limit starts nothing; an identical call returns the same group (" + provider + ")", ct => StartAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "join-policies", "All, Any, and Quorum join as specified; a timeout returns partial results; a failed child is reported with its outcome (" + provider + ")", ct => PoliciesAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "budget-cancel", "A token budget breach cancels the rest and is visible to gather; cancelling a group and cancelling the parent reach every running member (" + provider + ")", ct => BudgetCancelAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "suspension-capacity", "A one-slot worker completes a fan-out of 3 with suspension on; without suspension the fan-out fails fast with DelegationCapacityExhausted (" + provider + ")", ct => CapacityAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "example", "examples/fan-out.yaml applies twice without changes and its orchestrator fans out to three members and gathers their answers on the fake harness (" + provider + ")", ct => ExampleAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "routes-channel", "REST list, read, and cancel of fan-out groups, 404 across tenants, and fan-out channel delivery (" + provider + ")", ct => RoutesAsync(provider, ct)));
                suites.Add(new TestSuiteDescriptor(id, "Fan-out and gather (" + provider + ")", cases));
            }
            return suites;
        }

        #endregion

        #region Private-Methods

        private static string T(TestServerHost host)
        {
            return "/v1.0/api/tenants/" + host.TenantId;
        }

        private static object Members(params string[] agents)
        {
            return agents.Select((a, i) => new Dictionary<string, object> { { "agent", a }, { "input", "task " + i }, { "label", a + "-" + i } }).ToList();
        }

        private static async Task<Run> ParentAsync(TestServerHost host, List<string> allowed, bool suspension, CancellationToken token)
        {
            string name = "fo-parent-" + Guid.NewGuid().ToString("N").Substring(0, 6);
            Agent orchestrator = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, T(host) + "/agents", new Agent
            {
                Name = name, DelegationMode = DelegationModeEnum.AllowList, DelegationAllowList = allowed
            }, 201, token).ConfigureAwait(false);
            Deployment deployment = await host.Server.Context.Database.Deployments.CreateAsync(new Deployment { TenantId = host.TenantId, Name = name, AgentId = orchestrator.Id, HarnessProfileId = "hrn_builtin_fake", SuspensionEnabled = suspension }, token).ConfigureAwait(false);
            return await host.Server.Context.Database.Runs.CreateAsync(new Run
            {
                TenantId = host.TenantId, AgentId = orchestrator.Id, AgentName = orchestrator.Name, DeploymentId = deployment.Id, AgentRevisionId = orchestrator.LatestPublishedRevisionId,
                Status = RunStatusEnum.Running, CallerType = PrincipalTypeEnum.Administrator, CallerId = "usr_admin", LeaseEpoch = 1, LeaseExpiresUtc = DateTime.UtcNow.AddMinutes(10), StartedUtc = DateTime.UtcNow
            }, token).ConfigureAwait(false);
        }

        private static async Task<TestMcpClient> RunClientAsync(TestServerHost host, Run run, CancellationToken token)
        {
            TestMcpClient client = new TestMcpClient();
            await client.ConnectAsync(host, await host.Server.Context.Authentication.IssueForRunAsync(run, 1, DateTime.UtcNow.AddMinutes(10), token).ConfigureAwait(false), token).ConfigureAwait(false);
            return client;
        }

        private static async Task<List<Run>> ChildrenAsync(TestServerHost host, string parentId, CancellationToken token)
        {
            return (await host.Server.Context.Database.Runs.EnumerateAsync(new RunFilter { TenantId = host.TenantId, ParentRunId = parentId, MaxResults = 1000 }, token).ConfigureAwait(false)).Objects;
        }

        private static async Task StartAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, T(host) + "/agents", new Agent { Name = "fo-worker" }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, T(host) + "/agents", new Agent { Name = "fo-forbidden" }, 201, token).ConfigureAwait(false);
                Agent worker = Assert.NotNull(await host.Server.Context.Database.Agents.ReadByNameAsync(host.TenantId, "fo-worker", token).ConfigureAwait(false), "Worker agent");
                await host.Server.Context.Database.Deployments.CreateAsync(new Deployment { TenantId = host.TenantId, Name = "fo-worker", AgentId = worker.Id, HarnessProfileId = "hrn_builtin_fake" }, token).ConfigureAwait(false);
                Run parent = await ParentAsync(host, new List<string> { "fo-worker" }, false, token).ConfigureAwait(false);
                using (TestMcpClient client = await RunClientAsync(host, parent, token).ConfigureAwait(false))
                {
                    await client.ExpectErrorAsync("garrison_fan_out", new { members = Members("fo-worker", "fo-forbidden") }, "DelegationNotAllowed", token).ConfigureAwait(false);
                    Assert.Equal(0, (await ChildrenAsync(host, parent.Id, token).ConfigureAwait(false)).Count, "A disallowed member starts nothing");
                    await client.ExpectErrorAsync("garrison_fan_out", new { members = Members(Enumerable.Repeat("fo-worker", 9).ToArray()) }, "FanOutTooWide", token).ConfigureAwait(false);
                    await client.ExpectErrorAsync("garrison_fan_out", new { members = Members("fo-worker"), joinPolicy = "Quorum", quorum = 3 }, "ValidationFailed", token).ConfigureAwait(false);
                    Assert.Equal(0, (await ChildrenAsync(host, parent.Id, token).ConfigureAwait(false)).Count, "Refused calls start nothing");

                    FanOutGroupView group = await client.CallAsync<FanOutGroupView>("garrison_fan_out", new { members = Members("fo-worker", "fo-worker", "fo-worker", "fo-worker", "fo-worker") }, token).ConfigureAwait(false);
                    Assert.True(group.FanOutGroupId.StartsWith("fog_", StringComparison.Ordinal) && group.Total == 5 && group.Status == FanOutGroupStatusEnum.Running, "Group of five");
                    List<Run> children = await ChildrenAsync(host, parent.Id, token).ConfigureAwait(false);
                    Assert.Equal(5, children.Count, "Five children");
                    Assert.True(children.All(c => c.FanOutGroupId == group.FanOutGroupId && c.RootRunId == parent.Id && c.Depth == 1 && c.Kind == RunKindEnum.Delegated), "Members are child runs of the parent in its tree");
                    Assert.True(group.Members.Select(m => m.RunId).OrderBy(x => x).SequenceEqual(children.Select(c => c.Id).OrderBy(x => x)), "Group members are the children");

                    FanOutGroupView again = await client.CallAsync<FanOutGroupView>("garrison_fan_out", new { members = Members("fo-worker", "fo-worker", "fo-worker", "fo-worker", "fo-worker") }, token).ConfigureAwait(false);
                    Assert.Equal(group.FanOutGroupId, again.FanOutGroupId, "An identical call returns the same group");
                    Assert.Equal(5, (await ChildrenAsync(host, parent.Id, token).ConfigureAwait(false)).Count, "No new children");
                    FanOutGroupView partial = await client.CallAsync<FanOutGroupView>("garrison_gather", new { fanOutGroupId = group.FanOutGroupId, waitSeconds = 0 }, token).ConfigureAwait(false);
                    Assert.True(partial.Status == FanOutGroupStatusEnum.Running && partial.Pending.Count == 5 && !String.IsNullOrEmpty(partial.Summary), "No worker: gather returns at once with every member pending");
                }
            }
        }

        private static async Task<TestCluster> ClusterAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false);
            await cluster.CreateAgentAsync("fo-fast", "builtin/fake", null, token).ConfigureAwait(false);
            await cluster.CreateAgentAsync("fo-slow", "builtin/fake", null, token, d => d.Parameters.Add(new DeploymentParameter { Name = "delayMs", Value = "30000" })).ConfigureAwait(false);
            await cluster.CreateAgentAsync("fo-fail", "builtin/fake", null, token, d => d.Parameters.Add(new DeploymentParameter { Name = "fail", Value = "true" })).ConfigureAwait(false);
            return cluster;
        }

        private static async Task<FanOutGroupView> GatherUntilAsync(TestMcpClient client, string groupId, Func<FanOutGroupView, bool> done, string what, CancellationToken token)
        {
            DateTime deadline = DateTime.UtcNow.AddSeconds(60);
            while (true)
            {
                FanOutGroupView view = await client.CallAsync<FanOutGroupView>("garrison_gather", new { fanOutGroupId = groupId, waitSeconds = 5 }, token).ConfigureAwait(false);
                if (done(view)) return view;
                if (DateTime.UtcNow > deadline) throw new TestAssertionException(what + ": group " + view.Status + ", members " + String.Join(", ", view.Members.Select(m => m.Label + "=" + m.Status)));
            }
        }

        private static async Task PoliciesAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await ClusterAsync(provider, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                Run parent = await ParentAsync(host, new List<string> { "fo-fast", "fo-slow", "fo-fail" }, false, token).ConfigureAwait(false);
                using (TestMcpClient client = await RunClientAsync(host, parent, token).ConfigureAwait(false))
                {
                    FanOutGroupView all = await client.CallAsync<FanOutGroupView>("garrison_fan_out", new { members = Members("fo-fast", "fo-fast", "fo-fail") }, token).ConfigureAwait(false);
                    FanOutGroupView allDone = await GatherUntilAsync(client, all.FanOutGroupId, v => v.Status != FanOutGroupStatusEnum.Running, "All", token).ConfigureAwait(false);
                    Assert.True(allDone.Status == FanOutGroupStatusEnum.Joined && allDone.Finished == 3 && allDone.Succeeded == 2, "All joins when every member finished");
                    FanOutMemberView failed = allDone.Members.Single(m => m.Agent == "fo-fail");
                    Assert.True(failed.Status == RunStatusEnum.Failed && failed.Outcome.HasValue && allDone.Failed.Contains(failed.Label), "The failed child is reported with its outcome: " + failed.Outcome);
                    Assert.True(allDone.Members.Where(m => m.Agent == "fo-fast").All(m => !String.IsNullOrEmpty(m.ResultText)), "Finished results are returned");
                    Assert.True((allDone.Summary ?? String.Empty).Contains("fo-fail-2", StringComparison.Ordinal) && (allDone.Summary ?? String.Empty).Contains("Joined", StringComparison.Ordinal), "The summary is rendered from the template: " + allDone.Summary);

                    FanOutGroupView any = await client.CallAsync<FanOutGroupView>("garrison_fan_out", new { members = Members("fo-slow", "fo-fast", "fo-slow"), joinPolicy = "Any" }, token).ConfigureAwait(false);
                    FanOutGroupView anyDone = await GatherUntilAsync(client, any.FanOutGroupId, v => v.Status != FanOutGroupStatusEnum.Running, "Any", token).ConfigureAwait(false);
                    Assert.True(anyDone.Status == FanOutGroupStatusEnum.Joined && anyDone.Succeeded >= 1, "Any joins on the first success");
                    await WaitTerminalAsync(host, anyDone.Members.Where(m => m.Agent == "fo-slow").Select(m => m.RunId).ToList(), token).ConfigureAwait(false);
                    foreach (FanOutMemberView slow in anyDone.Members.Where(m => m.Agent == "fo-slow"))
                    {
                        Run run = Assert.NotNull(await host.Server.Context.Database.Runs.ReadAsync(slow.RunId, token).ConfigureAwait(false), "Slow member");
                        Assert.Equal(RunStatusEnum.Cancelled, run.Status, "Remaining members are cancelled once Any is met");
                    }

                    FanOutGroupView quorum = await client.CallAsync<FanOutGroupView>("garrison_fan_out", new { members = Members("fo-fast", "fo-fail", "fo-fast"), joinPolicy = "Quorum", quorum = 2 }, token).ConfigureAwait(false);
                    FanOutGroupView quorumDone = await GatherUntilAsync(client, quorum.FanOutGroupId, v => v.Status != FanOutGroupStatusEnum.Running, "Quorum", token).ConfigureAwait(false);
                    Assert.True(quorumDone.Status == FanOutGroupStatusEnum.Joined && quorumDone.Succeeded >= 2, "Quorum of 2 joins: " + quorumDone.StatusReason);
                    FanOutGroupView unreachable = await client.CallAsync<FanOutGroupView>("garrison_fan_out", new { members = Members("fo-fail", "fo-fail", "fo-fast"), joinPolicy = "Quorum", quorum = 2 }, token).ConfigureAwait(false);
                    FanOutGroupView unreachableDone = await GatherUntilAsync(client, unreachable.FanOutGroupId, v => v.Status != FanOutGroupStatusEnum.Running, "Unreachable quorum", token).ConfigureAwait(false);
                    Assert.True(unreachableDone.Status == FanOutGroupStatusEnum.Joined && (unreachableDone.StatusReason ?? String.Empty).Contains("quorum", StringComparison.OrdinalIgnoreCase), "A quorum that can no longer be met ends the group: " + unreachableDone.StatusReason);

                    FanOutGroupView timed = await client.CallAsync<FanOutGroupView>("garrison_fan_out", new { members = Members("fo-fast", "fo-slow"), timeoutSeconds = 3 }, token).ConfigureAwait(false);
                    FanOutGroupView early = await client.CallAsync<FanOutGroupView>("garrison_gather", new { fanOutGroupId = timed.FanOutGroupId, waitSeconds = 0 }, token).ConfigureAwait(false);
                    Assert.True(early.Status == FanOutGroupStatusEnum.Running && early.Pending.Count >= 1, "Gather before the end returns partial results");
                    FanOutGroupView timedOut = await GatherUntilAsync(client, timed.FanOutGroupId, v => v.Status != FanOutGroupStatusEnum.Running, "Timeout", token).ConfigureAwait(false);
                    Assert.True(timedOut.Status == FanOutGroupStatusEnum.TimedOut, "The group times out: " + timedOut.StatusReason);
                    Assert.True(timedOut.Members.Single(m => m.Agent == "fo-fast").Status == RunStatusEnum.Succeeded, "Results finished before the timeout are kept");
                }
            }
        }

        private static async Task WaitTerminalAsync(TestServerHost host, List<string> runIds, CancellationToken token)
        {
            DateTime deadline = DateTime.UtcNow.AddSeconds(30);
            while (DateTime.UtcNow < deadline)
            {
                bool done = true;
                foreach (string id in runIds)
                {
                    Run? run = await host.Server.Context.Database.Runs.ReadAsync(id, token).ConfigureAwait(false);
                    if (run != null && !RunService.IsTerminal(run.Status)) done = false;
                }
                if (done) return;
                await Task.Delay(200, token).ConfigureAwait(false);
            }
            throw new TestAssertionException("Runs did not finish: " + String.Join(", ", runIds));
        }

        private static async Task BudgetCancelAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await ClusterAsync(provider, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                Run parent = await ParentAsync(host, new List<string> { "fo-fast", "fo-slow" }, false, token).ConfigureAwait(false);
                using (TestMcpClient client = await RunClientAsync(host, parent, token).ConfigureAwait(false))
                {
                    FanOutGroupView budget = await client.CallAsync<FanOutGroupView>("garrison_fan_out", new { members = Members("fo-fast", "fo-slow", "fo-slow"), maxTokens = 5 }, token).ConfigureAwait(false);
                    FanOutGroupView breached = await GatherUntilAsync(client, budget.FanOutGroupId, v => v.Status != FanOutGroupStatusEnum.Running, "Budget", token).ConfigureAwait(false);
                    Assert.True(breached.Status == FanOutGroupStatusEnum.BudgetExceeded && breached.Tokens > 5, "Token budget breach is visible to gather: " + breached.StatusReason);
                    await WaitTerminalAsync(host, breached.Members.Select(m => m.RunId).ToList(), token).ConfigureAwait(false);
                    foreach (FanOutMemberView slow in breached.Members.Where(m => m.Agent == "fo-slow"))
                    {
                        Assert.Equal(RunStatusEnum.Cancelled, Assert.NotNull(await host.Server.Context.Database.Runs.ReadAsync(slow.RunId, token).ConfigureAwait(false), "Member").Status, "The rest is cancelled");
                    }

                    FanOutGroupView running = await client.CallAsync<FanOutGroupView>("garrison_fan_out", new { members = Members("fo-slow", "fo-slow", "fo-slow") }, token).ConfigureAwait(false);
                    await Task.Delay(1000, token).ConfigureAwait(false);
                    FanOutGroupView cancelled = await client.CallAsync<FanOutGroupView>("garrison_cancel_fan_out", new { fanOutGroupId = running.FanOutGroupId, reason = "No longer needed." }, token).ConfigureAwait(false);
                    Assert.Equal(FanOutGroupStatusEnum.Cancelled, cancelled.Status, "Cancelled group");
                    await WaitTerminalAsync(host, running.Members.Select(m => m.RunId).ToList(), token).ConfigureAwait(false);
                    foreach (FanOutMemberView member in running.Members)
                    {
                        Assert.Equal(RunStatusEnum.Cancelled, Assert.NotNull(await host.Server.Context.Database.Runs.ReadAsync(member.RunId, token).ConfigureAwait(false), "Member").Status, "Cancellation reaches every member");
                    }

                    FanOutGroupView orphaned = await client.CallAsync<FanOutGroupView>("garrison_fan_out", new { members = Members("fo-slow", "fo-slow") }, token).ConfigureAwait(false);
                    Run current = Assert.NotNull(await host.Server.Context.Database.Runs.ReadAsync(parent.Id, token).ConfigureAwait(false), "Parent");
                    await host.Server.Context.Get<RunService>().CancelAsync(current, token).ConfigureAwait(false);
                    await WaitTerminalAsync(host, orphaned.Members.Select(m => m.RunId).ToList(), token).ConfigureAwait(false);
                    DateTime deadline = DateTime.UtcNow.AddSeconds(30);
                    FanOutGroup? group = null;
                    while (DateTime.UtcNow < deadline)
                    {
                        group = await host.Server.Context.Database.FanOuts.ReadAsync(host.TenantId, orphaned.FanOutGroupId, token).ConfigureAwait(false);
                        if (group != null && group.Status != FanOutGroupStatusEnum.Running) break;
                        await Task.Delay(250, token).ConfigureAwait(false);
                    }
                    Assert.Equal(FanOutGroupStatusEnum.Cancelled, group?.Status ?? FanOutGroupStatusEnum.Running, "Cancelling the parent cancels its groups");
                }
            }
        }

        private static async Task CapacityAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await DelegationCapacitySuite.StartAsync(provider, settings => { settings.MaxConcurrentRuns = 1; settings.ChildReserveSlots = 0; }, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                string api = T(host);
                ArtifactStore store = await HttpTestHelpers.SendAsync<ArtifactStore>(host.AdminClient, HttpMethod.Post, api + "/artifact-stores", new ArtifactStore { Name = "fan-out-checkpoints", Kind = ArtifactStoreKindEnum.Database }, 201, token).ConfigureAwait(false);
                HarnessProfile profile = await DelegationCapacitySuite.DelegatingProfileAsync(host, token).ConfigureAwait(false);
                profile.SessionFormat = "garrison-fake-session-v1";
                profile.Arguments.Add(new HarnessArgument { Template = "--permission-once" });
                profile.Arguments.Add(new HarnessArgument { Template = "--echo-chars" });
                profile.Arguments.Add(new HarnessArgument { Template = "0" });
                await host.Server.Context.Database.HarnessProfiles.UpdateAsync(profile, token).ConfigureAwait(false);
                await cluster.CreateAgentAsync("fo-member", "builtin/fake", null, token).ConfigureAwait(false);
                string fanOut = "garrison,garrison_fan_out," + Serializer.Serialize(new Dictionary<string, object> { { "members", Members("fo-member", "fo-member", "fo-member") } });
                string gather = "garrison,garrison_gather,{\"waitSeconds\":60}";

                Agent durable = await cluster.CreateAgentAsync("fo-durable", profile.Name, a => { a.DelegationMode = DelegationModeEnum.AllowList; a.DelegationAllowList.Add("fo-member"); }, token, d =>
                {
                    d.SuspensionEnabled = true;
                    d.ArtifactStoreId = store.Id;
                    d.Parameters.Add(new DeploymentParameter { Name = "invoke1", Value = fanOut });
                    d.Parameters.Add(new DeploymentParameter { Name = "invoke2", Value = gather });
                }).ConfigureAwait(false);
                Run started = await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Post, api + "/agents/" + durable.Id + "/invoke", new InvokeRequest { Input = "fan out", Wait = false }, 202, token).ConfigureAwait(false);
                Run done = await WaitRunAsync(host, started.Id, TimeSpan.FromSeconds(90), token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Succeeded, done.Status, "Durable parent finishes: " + done.ErrorMessage);
                List<Run> children = await ChildrenAsync(host, done.Id, token).ConfigureAwait(false);
                Assert.True(children.Count == 3 && children.All(c => c.Status == RunStatusEnum.Succeeded), "All three members ran on the single slot: " + String.Join(", ", children.Select(c => c.Status)));
                Assert.True(cluster.Workers[0].PeakActiveRunCount <= 1, "Parent and members never exceeded the sole slot");
                RunEventsResponse events = await HttpTestHelpers.SendAsync<RunEventsResponse>(host.AdminClient, HttpMethod.Get, api + "/runs/" + done.Id + "/events", null, 200, token).ConfigureAwait(false);
                Assert.True(events.Events.Any(e => e.Code == "RunSuspended"), "The parent suspended while its members ran");
                Assert.True((done.ResultText ?? String.Empty).Contains("fo-member", StringComparison.Ordinal), "The resumed parent sees its members' results: " + done.ResultText);

                Agent resident = await cluster.CreateAgentAsync("fo-resident", profile.Name, a => { a.DelegationMode = DelegationModeEnum.AllowList; a.DelegationAllowList.Add("fo-member"); }, token, d =>
                {
                    d.Parameters.Add(new DeploymentParameter { Name = "invoke1", Value = fanOut });
                }).ConfigureAwait(false);
                Run residentRun = await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Post, api + "/agents/" + resident.Id + "/invoke", new InvokeRequest { Input = "fan out", Wait = false }, 202, token).ConfigureAwait(false);
                Run residentDone = await WaitRunAsync(host, residentRun.Id, TimeSpan.FromSeconds(60), token).ConfigureAwait(false);
                List<RunEvent> residentEvents = await host.Server.Context.Database.RunEvents.ListAfterAsync(residentDone.Id, 0, 1000, token).ConfigureAwait(false);
                Assert.True(residentEvents.Any(e => e.EventType == RunEventTypeEnum.ToolResult && (e.Text ?? String.Empty).StartsWith("DelegationCapacityExhausted", StringComparison.Ordinal)), "Without suspension the fan-out fails fast: " + String.Join(" | ", residentEvents.Where(e => e.EventType == RunEventTypeEnum.ToolResult).Select(e => e.Text)));
                Assert.Equal(0, (await ChildrenAsync(host, residentDone.Id, token).ConfigureAwait(false)).Count, "No member was started");
            }
        }

        private static async Task<Run> WaitRunAsync(TestServerHost host, string runId, TimeSpan timeout, CancellationToken token)
        {
            DateTime deadline = DateTime.UtcNow + timeout;
            while (true)
            {
                Run? run = await host.Server.Context.Database.Runs.ReadAsync(runId, token).ConfigureAwait(false);
                if (run != null && RunService.IsTerminal(run.Status)) return run;
                if (DateTime.UtcNow > deadline)
                {
                    List<Run> all = (await host.Server.Context.Database.Runs.EnumerateAsync(new RunFilter { TenantId = host.TenantId, MaxResults = 1000 }, token).ConfigureAwait(false)).Objects;
                    throw new TestAssertionException("Run " + runId + " did not finish: " + String.Join("; ", all.Select(r => r.AgentName + " " + r.Id + " " + r.Status)));
                }
                await Task.Delay(200, token).ConfigureAwait(false);
            }
        }

        private static async Task RoutesAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await ClusterAsync(provider, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                Run parent = await ParentAsync(host, new List<string> { "fo-slow" }, false, token).ConfigureAwait(false);
                FanOutGroupView started;
                using (TestMcpClient client = await RunClientAsync(host, parent, token).ConfigureAwait(false))
                {
                    started = await client.CallAsync<FanOutGroupView>("garrison_fan_out", new { members = Members("fo-slow", "fo-slow", "fo-slow") }, token).ConfigureAwait(false);
                }
                List<FanOutGroupView> listed = await HttpTestHelpers.SendAsync<List<FanOutGroupView>>(host.AdminClient, HttpMethod.Get, T(host) + "/runs/" + parent.Id + "/fan-out-groups", null, 200, token).ConfigureAwait(false);
                Assert.True(listed.Count == 1 && listed[0].FanOutGroupId == started.FanOutGroupId && listed[0].Total == 3, "Listed under the parent run");
                FanOutGroupView read = await HttpTestHelpers.SendAsync<FanOutGroupView>(host.AdminClient, HttpMethod.Get, T(host) + "/fan-out-groups/" + started.FanOutGroupId, null, 200, token).ConfigureAwait(false);
                Assert.Equal(3, read.Members.Count, "Read with members");
                Run member = await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Get, T(host) + "/runs/" + read.Members[0].RunId, null, 200, token).ConfigureAwait(false);
                Assert.Equal(started.FanOutGroupId, member.FanOutGroupId ?? String.Empty, "Run summaries show fanOutGroupId");

                using (ClientWebSocket socket = new ClientWebSocket())
                {
                    string bearer;
                    using (HttpClient login = await host.UserClientAsync("admin@garrison", "password", host.TenantId, token).ConfigureAwait(false))
                    {
                        bearer = login.DefaultRequestHeaders.Authorization!.Parameter!;
                    }
                    await socket.ConnectAsync(new Uri(host.BaseUrl.Replace("http://", "ws://", StringComparison.Ordinal) + "/v1.0/ws?token=" + Uri.EscapeDataString(bearer)), token).ConfigureAwait(false);
                    await socket.SendAsync(Encoding.UTF8.GetBytes("{\"type\":\"subscribe\",\"channel\":\"fan-out:" + started.FanOutGroupId + "\"}"), WebSocketMessageType.Text, true, token).ConfigureAwait(false);
                    string first = await ReceiveUntilAsync(socket, "fan-out.status", "Running", token).ConfigureAwait(false);
                    Assert.True(first.Contains(started.FanOutGroupId, StringComparison.Ordinal), "The channel sends the group: " + first);
                    FanOutGroupView cancelled = await HttpTestHelpers.SendAsync<FanOutGroupView>(host.AdminClient, HttpMethod.Post, T(host) + "/fan-out-groups/" + started.FanOutGroupId + "/cancel", null, 200, token).ConfigureAwait(false);
                    Assert.Equal(FanOutGroupStatusEnum.Cancelled, cancelled.Status, "Cancelled over REST");
                    await ReceiveUntilAsync(socket, "fan-out.status", "Cancelled", token).ConfigureAwait(false);
                }

                Tenant other = await HttpTestHelpers.SendAsync<Tenant>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants", new TenantRequest { Name = "Fan-out Other" }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + other.Id + "/users", new UserRequest { Email = "fo-outsider@example.com", Password = "password123", IsTenantAdmin = true }, 201, token).ConfigureAwait(false);
                using (HttpClient outsider = await host.UserClientAsync("fo-outsider@example.com", "password123", other.Id, token).ConfigureAwait(false))
                {
                    Assert.Equal(404, (await HttpTestHelpers.SendAsync(outsider, HttpMethod.Get, "/v1.0/api/tenants/" + other.Id + "/fan-out-groups/" + started.FanOutGroupId, null, token).ConfigureAwait(false)).StatusCode, "Another tenant's group");
                    Assert.Equal(404, (await HttpTestHelpers.SendAsync(outsider, HttpMethod.Post, "/v1.0/api/tenants/" + other.Id + "/fan-out-groups/" + started.FanOutGroupId + "/cancel", null, token).ConfigureAwait(false)).StatusCode, "Another tenant cannot cancel");
                }
            }
        }

        private static async Task ExampleAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            string? directory = AppContext.BaseDirectory;
            while (directory != null && !File.Exists(Path.Combine(directory, "examples", "fan-out.yaml"))) directory = Path.GetDirectoryName(directory);
            string yaml = await File.ReadAllTextAsync(Path.Combine(Assert.NotNull(directory, "Repository root with examples/fan-out.yaml"), "examples", "fan-out.yaml"), token).ConfigureAwait(false);
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                ManifestApply first = await ApplyAsync(host, yaml, token).ConfigureAwait(false);
                Assert.True(first.FailedCount == 0 && first.CreatedCount == first.DocumentCount, "The example applies: " + Serializer.Serialize(first));
                ManifestApply second = await ApplyAsync(host, yaml, token).ConfigureAwait(false);
                Assert.Equal(second.DocumentCount, second.UnchangedCount, "Applying twice changes nothing: " + String.Join("; ", second.Items.Where(i => i.Result != ManifestApplyResultEnum.Unchanged).Select(i => Serializer.Serialize(i))));
                Run run = await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/fan-orchestrator/invoke", new InvokeRequest { Input = "Fan out", Wait = true, WaitSeconds = 120 }, 200, token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Succeeded, run.Status, "The orchestrator succeeds: " + run.ErrorMessage);
                string result = run.ResultText ?? String.Empty;
                Assert.True(result.Contains("source-a", StringComparison.Ordinal) && result.Contains("source-c", StringComparison.Ordinal) && result.Contains("Joined", StringComparison.Ordinal), "The answer carries the gathered results: " + result);
                List<FanOutGroupView> groups = await HttpTestHelpers.SendAsync<List<FanOutGroupView>>(host.AdminClient, HttpMethod.Get, T(host) + "/runs/" + run.Id + "/fan-out-groups", null, 200, token).ConfigureAwait(false);
                Assert.True(groups.Count == 1 && groups[0].Succeeded == 3, "One group with three successes");
            }
        }

        private static async Task<ManifestApply> ApplyAsync(TestServerHost host, string yaml, CancellationToken token)
        {
            using (StringContent content = new StringContent(yaml, Encoding.UTF8, "application/yaml"))
            using (HttpResponseMessage response = await host.AdminClient.PostAsync(T(host) + "/manifests/apply", content, token).ConfigureAwait(false))
            {
                string body = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                Assert.Equal(200, (int)response.StatusCode, "Apply status: " + body);
                return Assert.NotNull(Serializer.Deserialize<ManifestApply>(body), "Apply result");
            }
        }

        private static async Task<string> ReceiveUntilAsync(ClientWebSocket socket, string type, string contains, CancellationToken token)
        {
            DateTime deadline = DateTime.UtcNow.AddSeconds(15);
            byte[] buffer = new byte[262144];
            while (DateTime.UtcNow < deadline)
            {
                using (CancellationTokenSource timeout = CancellationTokenSource.CreateLinkedTokenSource(token))
                {
                    timeout.CancelAfter(TimeSpan.FromSeconds(5));
                    using (MemoryStream message = new MemoryStream())
                    {
                        WebSocketReceiveResult result;
                        do
                        {
                            result = await socket.ReceiveAsync(buffer, timeout.Token).ConfigureAwait(false);
                            message.Write(buffer, 0, result.Count);
                        }
                        while (!result.EndOfMessage);
                        string text = Encoding.UTF8.GetString(message.ToArray());
                        if (text.Contains(type, StringComparison.Ordinal) && text.Contains(contains, StringComparison.Ordinal)) return text;
                    }
                }
            }
            throw new TestAssertionException("No " + type + " message containing " + contains + " arrived.");
        }

        #endregion
    }
}
