namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Net.Http;
    using System.Text;
    using System.Text.Json;
    using System.Text.RegularExpressions;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Serialization;
    using Garrison.Core.Services;
    using Garrison.Server.Runtime;
    using Garrison.Server.Services;
    using Garrison.Worker.Hosting;
    using Garrison.Worker.Settings;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;
    using Voltaic.Mcp;

    /// <summary>
    /// Delegation capacity (P12.38): a parent waiting synchronously on a child never blocks that child forever. Parents
    /// that delegate run the fake harness as Claude Code and call garrison_invoke_agent through the Garrison MCP server
    /// in their MCP configuration, exactly as a real harness does.
    /// </summary>
    public static class DelegationCapacitySuite
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
                string id = "delegation-capacity-" + provider.ToString().ToLowerInvariant();
                string durableId = "continuation-child-" + provider.ToString().ToLowerInvariant();
                suites.Add(new TestSuiteDescriptor(durableId, "Durable delegation wait", new List<TestCaseDescriptor> { new TestCaseDescriptor(durableId, "single-slot", "A parent releases its sole slot while a child runs and resumes with the saved child result (" + provider + ")", ct => DurableWaitAsync(provider, ct)) }));
                string budgetId = "delegation-wait-budget-" + provider.ToString().ToLowerInvariant();
                suites.Add(new TestSuiteDescriptor(budgetId, "Delegation wait budget (" + provider + ")", new List<TestCaseDescriptor>
                {
                    new TestCaseDescriptor(budgetId, "shared-wait-budget-admission", "Full external wait budget refuses resident delegation before child creation; cancellation, idempotency and creation failure release resources", ct => SharedWaitBudgetAsync(provider, ct)),
                    new TestCaseDescriptor(budgetId, "reserved-child-wait", "An admitted resident child wait owns one slot, retains reserve eligibility and completes with a terminal child", ct => ReservedChildWaitAsync(provider, ct))
                }));
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                cases.Add(new TestCaseDescriptor(id, "deadlock-4x4", "4 slots and 4 parents that each delegate once synchronously all finish (" + provider + ")", ct => DeadlockAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "random-trees", "Random delegation trees on small slot counts always finish or fail with DelegationCapacityExhausted, never hang (" + provider + ")", ct => RandomTreesAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "resident-cap", "Resident processes never exceed MaxConcurrentRuns plus ChildReserveSlots, and waiting runs never exceed the node's cap (" + provider + ")", ct => ResidentCapAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "deployment-limit", "A parent and its child in one deployment with maxConcurrentRuns 1 do not deadlock (" + provider + ")", ct => DeploymentLimitAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "admission", "The wait handshake refuses a delegation beyond the node's waiter cap or the child queue depth with DelegationCapacityExhausted over REST (429) and MCP; delegating without waiting is unaffected (" + provider + ")", ct => AdmissionAsync(provider, ct)));
                suites.Add(new TestSuiteDescriptor(id, "Delegation capacity (" + provider + ")", cases));
            }
            return suites;
        }

        #endregion

        #region Private-Methods

        private static async Task DurableWaitAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await StartAsync(provider, settings => { settings.MaxConcurrentRuns = 1; settings.ChildReserveSlots = 0; }, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                string api = "/v1.0/api/tenants/" + host.TenantId;
                ArtifactStore store = await HttpTestHelpers.SendAsync<ArtifactStore>(host.AdminClient, HttpMethod.Post, api + "/artifact-stores", new ArtifactStore { Name = "child-checkpoints", Kind = ArtifactStoreKindEnum.Database }, 201, token).ConfigureAwait(false);
                HarnessProfile profile = await DelegatingProfileAsync(host, token).ConfigureAwait(false);
                profile.SessionFormat = "garrison-fake-session-v1";
                profile.Arguments.Add(new HarnessArgument { Template = "--permission-once" });
                profile.Arguments.Add(new HarnessArgument { Template = "--echo-chars" });
                profile.Arguments.Add(new HarnessArgument { Template = "0" });
                await host.Server.Context.Database.HarnessProfiles.UpdateAsync(profile, token).ConfigureAwait(false);
                await cluster.CreateAgentAsync("durable-child", "builtin/fake", token: token).ConfigureAwait(false);
                Agent agent = await cluster.CreateAgentAsync("durable-parent", profile.Name, parent => { parent.DelegationMode = DelegationModeEnum.AllowList; parent.DelegationAllowList.Add("durable-child"); }, token, deployment =>
                {
                    deployment.SuspensionEnabled = true;
                    deployment.ArtifactStoreId = store.Id;
                    deployment.Parameters.Add(new DeploymentParameter { Name = "invoke1", Value = Invoke("durable-child", "durable-child-result") });
                }).ConfigureAwait(false);
                Run started = await CreateRunAsync(cluster, agent, "parent", token).ConfigureAwait(false);
                List<Run> completed = await WaitAllAsync(cluster, new List<string> { started.Id }, TimeSpan.FromSeconds(60), "durable parent sharing its only slot with its child", token).ConfigureAwait(false);
                Run done = completed.Single();
                Assert.Equal(RunStatusEnum.Succeeded, done.Status, "Durable parent succeeds: " + done.ErrorMessage);
                Assert.True((done.ResultText ?? String.Empty).Contains("durable-child-result", StringComparison.Ordinal), "Parent resumed with the saved child output: " + done.ResultText);
                Assert.Equal(1, (await ChildrenAsync(cluster, new List<Run> { done }, token).ConfigureAwait(false)).Count, "Resume did not invoke the child twice");
                RunEventsResponse events = await HttpTestHelpers.SendAsync<RunEventsResponse>(host.AdminClient, HttpMethod.Get, api + "/runs/" + done.Id + "/events", null, 200, token).ConfigureAwait(false);
                Assert.True(events.Events.Any(entry => entry.Code == "RunSuspended"), "Parent emitted a durable suspension checkpoint");
                Assert.True(cluster.Workers[0].PeakActiveRunCount <= 1, "Parent and child never exceeded the sole process slot");
            }
        }

        private static async Task DeadlockAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await StartAsync(provider, null, token).ConfigureAwait(false))
            {
                HarnessProfile profile = await DelegatingProfileAsync(cluster.Server, token).ConfigureAwait(false);
                await cluster.CreateAgentAsync("dl-child", "builtin/fake", null, token).ConfigureAwait(false);
                // Each parent first holds its slot for a moment, so all four slots are taken by parents before any of
                // them delegates: the old scheduler then had no slot left for the children.
                Agent parent = await cluster.CreateAgentAsync("dl-parent", profile.Name, a =>
                {
                    a.DelegationMode = DelegationModeEnum.AllowList;
                    a.DelegationAllowList.Add("dl-child");
                }, token, d =>
                {
                    d.Parameters.Add(new DeploymentParameter { Name = "holdMs", Value = "1500" });
                    d.Parameters.Add(new DeploymentParameter { Name = "invoke1", Value = Invoke("dl-child", "child work") });
                }).ConfigureAwait(false);

                List<Run> parents = new List<Run>();
                for (int i = 0; i < 4; i++) parents.Add(await CreateRunAsync(cluster, parent, "parent " + i, token).ConfigureAwait(false));

                List<Run> finished = await WaitAllAsync(cluster, parents.Select(p => p.Id).ToList(), TimeSpan.FromSeconds(60), "4 parents on 4 slots, each waiting on a child", token).ConfigureAwait(false);
                foreach (Run run in finished)
                {
                    Assert.Equal(RunStatusEnum.Succeeded, run.Status, "Parent " + run.Id + " status");
                    Assert.True((run.ResultText ?? String.Empty).Contains("Succeeded", StringComparison.Ordinal), "Parent " + run.Id + " saw its child succeed: " + run.ResultText);
                }
                List<Run> children = await ChildrenAsync(cluster, parents, token).ConfigureAwait(false);
                Assert.Equal(4, children.Count, "One child per parent");
                Assert.True(children.All(c => c.Status == RunStatusEnum.Succeeded), "Every child succeeded");
                WorkerHost worker = cluster.Workers[0];
                Assert.True(worker.PeakActiveRunCount > 4 && worker.PeakActiveRunCount <= 4 + worker.Settings.ChildReserveSlots,
                    "Children ran in the child reserve lent by their waiting parents (peak " + worker.PeakActiveRunCount + " processes, cap " + (4 + worker.Settings.ChildReserveSlots) + ")");
            }
        }

        private static async Task RandomTreesAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            // Property: whatever the slot counts and tree shape, every run finishes, and every delegation either ran its
            // child or failed at once with DelegationCapacityExhausted. Seeded, so a failure names a reproducible case.
            for (int seed = 1; seed <= 10; seed++)
            {
                Random random = new Random(3800 + seed);
                int slots = random.Next(1, 4);
                int reserve = random.Next(0, 3);
                int waiters = random.Next(0, 4);
                int depth = random.Next(1, 3);
                List<int> fanout = new List<int>();
                for (int level = 0; level < depth; level++) fanout.Add(random.Next(1, 3));
                int roots = random.Next(1, slots + 3);
                int holdMs = random.Next(0, 400);
                string shape = "seed " + seed + ": " + slots + " slots, reserve " + reserve + ", waiters " + waiters + ", " + roots + " roots, fan-out " + String.Join("x", fanout);

                await using (TestCluster cluster = await StartAsync(provider, s =>
                {
                    s.MaxConcurrentRuns = slots;
                    s.ChildReserveSlots = reserve;
                    s.MaxResidentWaiters = waiters;
                }, token).ConfigureAwait(false))
                {
                    HarnessProfile profile = await DelegatingProfileAsync(cluster.Server, token).ConfigureAwait(false);
                    string prefix = "tree" + seed + "-l";
                    await cluster.CreateAgentAsync(prefix + depth, "builtin/fake", null, token).ConfigureAwait(false);
                    Agent? root = null;
                    for (int level = depth - 1; level >= 0; level--)
                    {
                        string next = prefix + (level + 1);
                        int calls = fanout[level];
                        Agent agent = await cluster.CreateAgentAsync(prefix + level, profile.Name, a =>
                        {
                            a.DelegationMode = DelegationModeEnum.AllowList;
                            a.DelegationAllowList.Add(next);
                        }, token, d =>
                        {
                            if (holdMs > 0) d.Parameters.Add(new DeploymentParameter { Name = "holdMs", Value = holdMs.ToString(System.Globalization.CultureInfo.InvariantCulture) });
                            for (int call = 1; call <= calls; call++) d.Parameters.Add(new DeploymentParameter { Name = "invoke" + call, Value = Invoke(next, "level " + (level + 1) + " call " + call) });
                        }).ConfigureAwait(false);
                        root = agent;
                    }

                    List<string> rootIds = new List<string>();
                    for (int i = 0; i < roots; i++) rootIds.Add((await CreateRunAsync(cluster, root!, "root " + i, token).ConfigureAwait(false)).Id);
                    await WaitAllAsync(cluster, rootIds, TimeSpan.FromSeconds(90), shape, token).ConfigureAwait(false);
                    List<Run> all = await AllRunsAsync(cluster, token).ConfigureAwait(false);
                    await WaitAllAsync(cluster, all.Select(r => r.Id).ToList(), TimeSpan.FromSeconds(30), shape + " (children)", token).ConfigureAwait(false);
                    all = await AllRunsAsync(cluster, token).ConfigureAwait(false);
                    Assert.True(all.All(r => r.Status == RunStatusEnum.Succeeded), shape + ": every run succeeded: " + String.Join("; ", all.Where(r => r.Status != RunStatusEnum.Succeeded).Select(r => r.AgentName + " " + r.Status + " " + r.ErrorMessage)));

                    int refused = 0;
                    foreach (Run run in all)
                    {
                        int level = Int32.Parse(run.AgentName.Substring(prefix.Length), System.Globalization.CultureInfo.InvariantCulture);
                        if (level >= depth) continue;
                        List<string> results = await InvokeResultsAsync(cluster, run.Id, token).ConfigureAwait(false);
                        int children = all.Count(r => r.ParentRunId == run.Id);
                        int succeeded = results.Count(r => Classify(r) == "ok");
                        int capacity = results.Count(r => Classify(r) == "capacity");
                        refused += capacity;
                        Assert.True(results.Count == fanout[level] && succeeded + capacity == results.Count,
                            shape + ": run " + run.Id + " delegations either ran or failed with DelegationCapacityExhausted: " + String.Join(" | ", results.Select(r => r.Length > 160 ? r.Substring(0, 160) : r)));
                        Assert.Equal(succeeded, children, shape + ": run " + run.Id + " has one child per successful delegation");
                    }
                    WorkerHost worker = cluster.Workers[0];
                    Assert.True(worker.PeakActiveRunCount <= slots + reserve, shape + ": resident processes " + worker.PeakActiveRunCount + " never exceed " + (slots + reserve));
                    if (DelegationCapacity.MaxWaiters(new Node { MaxConcurrentRuns = slots, ChildReserveSlots = reserve, MaxResidentWaiters = waiters }) == 0)
                    {
                        Assert.True(refused > 0, shape + ": a node that may keep no waiting run refuses every synchronous delegation");
                    }
                }
            }
        }

        private static async Task ResidentCapAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            // 2 slots and 1 reserve slot: at most 3 processes, and at most 2 runs waiting at once.
            await using (TestCluster cluster = await StartAsync(provider, s =>
            {
                s.MaxConcurrentRuns = 2;
                s.ChildReserveSlots = 1;
            }, token).ConfigureAwait(false))
            {
                HarnessProfile profile = await DelegatingProfileAsync(cluster.Server, token).ConfigureAwait(false);
                await cluster.CreateAgentAsync("cap-child", "builtin/fake", null, token).ConfigureAwait(false);
                Agent parent = await cluster.CreateAgentAsync("cap-parent", profile.Name, a =>
                {
                    a.DelegationMode = DelegationModeEnum.AllowList;
                    a.DelegationAllowList.Add("cap-child");
                }, token, d =>
                {
                    d.Parameters.Add(new DeploymentParameter { Name = "holdMs", Value = "300" });
                    d.Parameters.Add(new DeploymentParameter { Name = "invoke1", Value = Invoke("cap-child", "first") });
                    d.Parameters.Add(new DeploymentParameter { Name = "invoke2", Value = Invoke("cap-child", "second") });
                }).ConfigureAwait(false);

                WorkerHost worker = cluster.Workers[0];
                DatabaseDriverBase db = cluster.Server.Server.Context.Database;
                Node node = Assert.NotNull(await db.Nodes.ReadAsync(worker.NodeId!, token).ConfigureAwait(false), "Worker node");
                Assert.True(node.MaxConcurrentRuns == 2 && node.ChildReserveSlots == 1 && node.MaxResidentWaiters == 0, "The worker reported its reserve at registration");
                int maxWaiters = DelegationCapacity.MaxWaiters(node);

                List<string> roots = new List<string>();
                for (int i = 0; i < 6; i++) roots.Add((await CreateRunAsync(cluster, parent, "parent " + i, token).ConfigureAwait(false)).Id);
                long peakWaiting = 0;
                int peakProcesses = 0;
                DateTime deadline = DateTime.UtcNow.AddSeconds(90);
                while (true)
                {
                    peakProcesses = Math.Max(peakProcesses, worker.ActiveRunCount);
                    peakWaiting = Math.Max(peakWaiting, await db.Runs.CountWaitingOnNodeAsync(node.Id, token).ConfigureAwait(false));
                    List<Run> current = await AllRunsAsync(cluster, token).ConfigureAwait(false);
                    if (current.Count(r => roots.Contains(r.Id) && RunService.IsTerminal(r.Status)) == roots.Count && current.All(r => RunService.IsTerminal(r.Status))) break;
                    if (DateTime.UtcNow > deadline) throw new TestAssertionException("Deadlock: runs did not finish: " + String.Join("; ", current.Select(r => r.AgentName + " " + r.Status)));
                    await Task.Delay(25, token).ConfigureAwait(false);
                }
                Assert.True(peakProcesses <= 3 && worker.PeakActiveRunCount <= 3, "Resident processes stay within 2 slots plus 1 reserve slot (sampled " + peakProcesses + ", peak " + worker.PeakActiveRunCount + ")");
                Assert.True(peakWaiting <= maxWaiters, "Waiting runs stay within the node's cap of " + maxWaiters + " (peak " + peakWaiting + ")");
                List<Run> all = await AllRunsAsync(cluster, token).ConfigureAwait(false);
                Assert.True(all.All(r => r.Status == RunStatusEnum.Succeeded), "Every run succeeded");
                Assert.True(all.Any(r => r.AgentName == "cap-child"), "Children ran");
                foreach (string id in roots)
                {
                    List<string> results = await InvokeResultsAsync(cluster, id, token).ConfigureAwait(false);
                    Assert.True(results.Count == 2 && results.All(r => Classify(r) != "other"), "Each delegation ran or failed with DelegationCapacityExhausted: " + String.Join(" | ", results));
                }
            }
        }

        private static async Task DeploymentLimitAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await StartAsync(provider, null, token).ConfigureAwait(false))
            {
                HarnessProfile profile = await DelegatingProfileAsync(cluster.Server, token).ConfigureAwait(false);
                // The agent delegates to itself once: its child runs in the same deployment, which allows one active run.
                // The grandchild is refused by the depth limit, so the tree is exactly a parent and a child.
                Agent self = await cluster.CreateAgentAsync("dl-self", profile.Name, a =>
                {
                    a.DelegationMode = DelegationModeEnum.Any;
                    a.DelegationAllowRecursion = true;
                    a.DelegationMaxDepth = 1;
                }, token, d =>
                {
                    d.MaxConcurrentRuns = 1;
                    d.Parameters.Add(new DeploymentParameter { Name = "invoke1", Value = Invoke("dl-self", "the same deployment") });
                }).ConfigureAwait(false);

                Run parent = await CreateRunAsync(cluster, self, "parent", token).ConfigureAwait(false);
                List<Run> finished = await WaitAllAsync(cluster, new List<string> { parent.Id }, TimeSpan.FromSeconds(60), "a parent waiting on a child in its own deployment with maxConcurrentRuns 1", token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Succeeded, finished[0].Status, "Parent status");
                List<string> results = await InvokeResultsAsync(cluster, parent.Id, token).ConfigureAwait(false);
                Assert.True(results.Count == 1 && Classify(results[0]) == "ok", "The parent's child ran: " + String.Join(" | ", results));
                List<Run> children = await ChildrenAsync(cluster, new List<Run> { parent }, token).ConfigureAwait(false);
                Assert.True(children.Count == 1 && children[0].Status == RunStatusEnum.Succeeded && children[0].DeploymentId == parent.DeploymentId, "One child in the same deployment succeeded");
            }
        }

        private static async Task AdmissionAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 0, token).ConfigureAwait(false))
            {
                DatabaseDriverBase db = cluster.Server.Server.Context.Database;
                AuthenticationService authentication = cluster.Server.Server.Context.Authentication;
                RuntimeOptions runtime = cluster.Server.Server.Context.Get<RuntimeOptions>();
                Agent child = await cluster.CreateAgentAsync("adm-child", "builtin/fake", null, token).ConfigureAwait(false);
                Agent parent = await cluster.CreateAgentAsync("adm-parent", "builtin/fake", a => a.DelegationMode = DelegationModeEnum.Any, token).ConfigureAwait(false);

                // One regular and one reserve slot: one run may wait at once. No worker runs here, so children stay queued.
                Node small = await db.Nodes.CreateAsync(new Node { Name = "adm-small-" + Guid.NewGuid().ToString("N").Substring(0, 6), MaxConcurrentRuns = 1, ChildReserveSlots = 1, LastHeartbeatUtc = DateTime.UtcNow }, token).ConfigureAwait(false);
                Node roomy = await db.Nodes.CreateAsync(new Node { Name = "adm-roomy-" + Guid.NewGuid().ToString("N").Substring(0, 6), MaxConcurrentRuns = 4, ChildReserveSlots = 2, LastHeartbeatUtc = DateTime.UtcNow }, token).ConfigureAwait(false);
                string first = await LeasedRunTokenAsync(cluster, parent, small, "first", token).ConfigureAwait(false);
                string second = await LeasedRunTokenAsync(cluster, parent, small, "second", token).ConfigureAwait(false);
                string third = await LeasedRunTokenAsync(cluster, parent, roomy, "third", token).ConfigureAwait(false);

                using (CancellationTokenSource waiting = CancellationTokenSource.CreateLinkedTokenSource(token))
                using (HttpClient firstClient = RunClient(cluster, first))
                using (HttpClient secondClient = RunClient(cluster, second))
                using (HttpClient thirdClient = RunClient(cluster, third))
                {
                    Task<TestResponse> held = HttpTestHelpers.SendAsync(firstClient, HttpMethod.Post, InvokePath(cluster, child), new InvokeRequest { Input = "held", Wait = true, WaitSeconds = 60 }, waiting.Token);
                    DateTime deadline = DateTime.UtcNow.AddSeconds(15);
                    while (await db.Runs.CountWaitingOnNodeAsync(small.Id, token).ConfigureAwait(false) < 1)
                    {
                        if (held.IsCompleted) throw new TestAssertionException("The first wait returned early: " + (await held.ConfigureAwait(false)).Body);
                        if (DateTime.UtcNow > deadline) throw new TestAssertionException("The first parent was never recorded as waiting.");
                        await Task.Delay(50, token).ConfigureAwait(false);
                    }

                    using (HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Post, InvokePath(cluster, child)))
                    {
                        request.Content = new StringContent(Serializer.Serialize(new InvokeRequest { Input = "refused", Wait = true, WaitSeconds = 30 }), Encoding.UTF8, "application/json");
                        using (HttpResponseMessage response = await secondClient.SendAsync(request, token).ConfigureAwait(false))
                        {
                            string body = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                            Assert.Equal(429, (int)response.StatusCode, "A second waiter on a full node is refused at once: " + body);
                            Assert.True(body.Contains("DelegationCapacityExhausted", StringComparison.Ordinal), "Typed error code: " + body);
                            Assert.True(response.Headers.TryGetValues("Retry-After", out IEnumerable<string>? retry) && retry.FirstOrDefault() == "5", "Retry-After from Runs.DelegationRetryAfterSeconds");
                        }
                    }

                    TestResponse unwaited = await HttpTestHelpers.SendAsync(secondClient, HttpMethod.Post, InvokePath(cluster, child), new InvokeRequest { Input = "fire and forget", Wait = false }, token).ConfigureAwait(false);
                    Assert.True(unwaited.StatusCode == 200 || unwaited.StatusCode == 202, "Delegating without waiting needs no waiter place: " + unwaited.StatusCode + " " + unwaited.Body);

                    string mcp = await McpInvokeAsync(cluster, second, token).ConfigureAwait(false);
                    Assert.True(mcp.StartsWith("DelegationCapacityExhausted:", StringComparison.Ordinal), "MCP returns the typed error: " + mcp);

                    // The child queue depth: one waited child is queued, so a depth of 1 refuses the next wait anywhere.
                    SettingsUpdateRequest update = new SettingsUpdateRequest();
                    update.Values.Add(new SettingValue { Path = "Runs.DelegationChildQueueDepth", Value = "1" });
                    await HttpTestHelpers.SendAsync<SettingsSaveResponse>(cluster.Server.AdminClient, HttpMethod.Put, "/v1.0/api/settings", update, 200, token).ConfigureAwait(false);
                    DateTime applied = DateTime.UtcNow.AddSeconds(15);
                    while (runtime.DelegationChildQueueDepth != 1 && DateTime.UtcNow < applied) await Task.Delay(100, token).ConfigureAwait(false);
                    Assert.Equal(1, runtime.DelegationChildQueueDepth, "Runs.DelegationChildQueueDepth applied");
                    TestResponse deep = await HttpTestHelpers.SendAsync(thirdClient, HttpMethod.Post, InvokePath(cluster, child), new InvokeRequest { Input = "too deep", Wait = true, WaitSeconds = 30 }, token).ConfigureAwait(false);
                    Assert.True(deep.StatusCode == 429 && deep.Body.Contains("DelegationCapacityExhausted", StringComparison.Ordinal) && deep.Body.Contains("queued", StringComparison.Ordinal), "The queue depth refuses a waiter on a roomy node: " + deep.StatusCode + " " + deep.Body);

                    update.Values[0].Value = "100";
                    await HttpTestHelpers.SendAsync<SettingsSaveResponse>(cluster.Server.AdminClient, HttpMethod.Put, "/v1.0/api/settings", update, 200, token).ConfigureAwait(false);
                    applied = DateTime.UtcNow.AddSeconds(15);
                    while (runtime.DelegationChildQueueDepth != 100 && DateTime.UtcNow < applied) await Task.Delay(100, token).ConfigureAwait(false);

                    // The waiter leaves: its wait record goes with it, and the node has a waiter place again.
                    waiting.Cancel();
                    try
                    {
                        await held.ConfigureAwait(false);
                    }
                    catch (OperationCanceledException)
                    {
                    }
                    deadline = DateTime.UtcNow.AddSeconds(15);
                    while (await db.Runs.CountWaitingOnNodeAsync(small.Id, token).ConfigureAwait(false) > 0)
                    {
                        if (DateTime.UtcNow > deadline) throw new TestAssertionException("The first parent's wait was not removed when it stopped waiting.");
                        await Task.Delay(50, token).ConfigureAwait(false);
                    }
                }
            }
        }

        private static async Task SharedWaitBudgetAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (MetricCapture capture = new MetricCapture())
            {
                await using (TestCluster cluster = await TestCluster.StartAsync(provider, 0, token).ConfigureAwait(false))
                {
                    DatabaseDriverBase db = cluster.Server.Server.Context.Database;
                    RuntimeOptions runtime = cluster.Server.Server.Context.Get<RuntimeOptions>();
                    runtime.MaxSynchronousWaiters = 1;
                    Agent holder = await cluster.CreateAgentAsync("budget-holder", token: token).ConfigureAwait(false);
                    Agent child = await cluster.CreateAgentAsync("budget-child", token: token).ConfigureAwait(false);
                    Agent parent = await cluster.CreateAgentAsync("budget-parent", configure: a => a.DelegationMode = DelegationModeEnum.Any, token: token).ConfigureAwait(false);
                    Node node = await db.Nodes.CreateAsync(new Node { Name = "budget-parent-node", MaxConcurrentRuns = 4, ChildReserveSlots = 1, LastHeartbeatUtc = DateTime.UtcNow }, token).ConfigureAwait(false);
                    string parentToken = await LeasedRunTokenAsync(cluster, parent, node, "parent", token).ConfigureAwait(false);
                    using (HttpClient parentClient = RunClient(cluster, parentToken))
                    {
                        using (CancellationTokenSource held = CancellationTokenSource.CreateLinkedTokenSource(token))
                        {
                            Task<TestResponse> external = HttpTestHelpers.SendAsync(cluster.Server.AdminClient, HttpMethod.Post, InvokePath(cluster, holder), new InvokeRequest { Input = "hold external wait", Wait = true, WaitSeconds = 60, CancelOnDisconnect = false }, held.Token);
                            DateTime deadline = DateTime.UtcNow.AddSeconds(10);
                            while (runtime.SynchronousWaits.Active != 1 && DateTime.UtcNow < deadline) await Task.Delay(20, token).ConfigureAwait(false);
                            Assert.Equal(1, runtime.SynchronousWaits.Active, "real external invocation occupies the wait budget");
                            TestResponse denied = await HttpTestHelpers.SendAsync(parentClient, HttpMethod.Post, InvokePath(cluster, child), new InvokeRequest { Input = "must not create child", Wait = true, WaitSeconds = 60 }, token).ConfigureAwait(false);
                            Assert.True(denied.StatusCode == 429 && denied.Body.Contains("DelegationCapacityExhausted", StringComparison.Ordinal) && denied.Body.Contains("control-plane replica", StringComparison.Ordinal), "typed wait-budget denial: " + denied.Body);
                            Assert.True(!(await AllRunsAsync(cluster, token).ConfigureAwait(false)).Any(r => r.AgentId == child.Id), "denied delegation creates zero child runs");
                            Assert.Equal(0L, await db.Runs.CountWaitingOnNodeAsync(node.Id, token).ConfigureAwait(false), "denied delegation creates zero child handshakes");
                            Assert.Equal(1, runtime.SynchronousWaits.Active, "denial does not release another caller's budget slot");
                            Assert.True(capture.Of("garrison.synchronous.wait.admission").Any(m => m.Tag("result") == "delegation_denied"), "typed denial has its own bounded telemetry result");
                            Assert.True(!capture.Of("garrison.synchronous.wait.admission").Any(m => m.Tag("result") == "fallback"), "denied delegation is not counted as accepted asynchronous fallback");
                            Assert.True(capture.Of("garrison.delegation.denials").Any(m => m.Tag("reason") == "DelegationCapacityExhausted"), "denial also records the existing delegation counter");
                            held.Cancel();
                            try { await external.ConfigureAwait(false); } catch (OperationCanceledException) { }
                            deadline = DateTime.UtcNow.AddSeconds(15);
                            while (runtime.SynchronousWaits.Active != 0 && DateTime.UtcNow < deadline) await Task.Delay(20, token).ConfigureAwait(false);
                            Assert.Equal(0, runtime.SynchronousWaits.Active, "cancelled external wait releases its slot");
                        }
                        TestResponse createFailure = await HttpTestHelpers.SendAsync(parentClient, HttpMethod.Post, InvokePath(cluster, child), new InvokeRequest { Input = "invalid child deployment", DeploymentId = "dep_missing_budget_regression", Wait = true }, token).ConfigureAwait(false);
                        Assert.Equal(404, createFailure.StatusCode, "creation fails after acquiring budget and handshake");
                        Assert.Equal(0, runtime.SynchronousWaits.Active, "creation failure releases reserved budget");
                        Assert.Equal(0L, await db.Runs.CountWaitingOnNodeAsync(node.Id, token).ConfigureAwait(false), "creation failure ends handshake");
                        parentClient.DefaultRequestHeaders.Add("Idempotency-Key", "budget-idempotent-child");
                        TestResponse firstChild = await HttpTestHelpers.SendAsync(parentClient, HttpMethod.Post, InvokePath(cluster, child), new InvokeRequest { Input = "cancel admitted child wait", Wait = false }, token).ConfigureAwait(false);
                        Assert.Equal(202, firstChild.StatusCode, "idempotent original child accepted asynchronously");
                        Run canonicalChild = Serializer.Deserialize<Run>(firstChild.Body) ?? throw new TestAssertionException("Missing canonical child.");
                        using (CancellationTokenSource waiting = CancellationTokenSource.CreateLinkedTokenSource(token))
                        {
                            Task<TestResponse> admitted = HttpTestHelpers.SendAsync(parentClient, HttpMethod.Post, InvokePath(cluster, child), new InvokeRequest { Input = "cancel admitted child wait", Wait = true, WaitSeconds = 60, CancelOnDisconnect = true }, waiting.Token);
                            DateTime deadline = DateTime.UtcNow.AddSeconds(10);
                            while (await db.Runs.CountWaitingOnNodeAsync(node.Id, token).ConfigureAwait(false) != 1 && DateTime.UtcNow < deadline) await Task.Delay(20, token).ConfigureAwait(false);
                            Assert.Equal(1, runtime.SynchronousWaits.Active, "admitted delegation holds exactly one wait slot");
                            Assert.True(!admitted.IsCompleted, "reserved wait must not reacquire and silently fall back");
                            Assert.True(await db.Runs.IsWaitedChildAsync(cluster.Server.TenantId, canonicalChild.Id, token).ConfigureAwait(false), "idempotent retry retargets handshake to canonical child");
                            Assert.Equal(1, (await AllRunsAsync(cluster, token).ConfigureAwait(false)).Count(r => r.AgentId == child.Id), "idempotent retry creates no second child");
                            waiting.Cancel();
                            try { await admitted.ConfigureAwait(false); } catch (OperationCanceledException) { }
                            deadline = DateTime.UtcNow.AddSeconds(15);
                            while ((runtime.SynchronousWaits.Active != 0 || await db.Runs.CountWaitingOnNodeAsync(node.Id, token).ConfigureAwait(false) != 0) && DateTime.UtcNow < deadline) await Task.Delay(20, token).ConfigureAwait(false);
                            Assert.Equal(0, runtime.SynchronousWaits.Active, "cancelled child wait releases reservation");
                            Assert.Equal(0L, await db.Runs.CountWaitingOnNodeAsync(node.Id, token).ConfigureAwait(false), "cancelled child wait releases handshake");
                        }
                    }
                }
            }
        }

        private static async Task ReservedChildWaitAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await StartAsync(provider, settings => { settings.MaxConcurrentRuns = 1; settings.ChildReserveSlots = 1; }, token).ConfigureAwait(false))
            {
                RuntimeOptions runtime = cluster.Server.Server.Context.Get<RuntimeOptions>();
                runtime.MaxSynchronousWaiters = 1;
                HarnessProfile profile = await DelegatingProfileAsync(cluster.Server, token).ConfigureAwait(false);
                Agent child = await cluster.CreateAgentAsync("reserved-child", token: token).ConfigureAwait(false);
                Agent parent = await cluster.CreateAgentAsync("reserved-parent", profile.Name, a => a.DelegationMode = DelegationModeEnum.Any, token, d => d.Parameters.Add(new DeploymentParameter { Name = "invoke1", Value = Invoke(child.Name, "reserved child") })).ConfigureAwait(false);
                Run root = await CreateRunAsync(cluster, parent, "parent", token).ConfigureAwait(false);
                await WaitAllAsync(cluster, new List<string> { root.Id }, TimeSpan.FromSeconds(30), "reserved synchronous child", token).ConfigureAwait(false);
                List<Run> runs = await AllRunsAsync(cluster, token).ConfigureAwait(false);
                Assert.True(runs.Any(r => r.ParentRunId == root.Id && r.AgentId == child.Id && r.Status == RunStatusEnum.Succeeded), "child uses reserve and completes");
                List<string> results = await InvokeResultsAsync(cluster, root.Id, token).ConfigureAwait(false);
                Assert.True(results.Count == 1 && Classify(results[0]) == "ok", "parent received a terminal child result, not queued fallback: " + String.Join("; ", results));
                Assert.Equal(0, runtime.SynchronousWaits.Active, "normal completion releases reservation");
                Assert.Equal(0L, await cluster.Server.Server.Context.Database.Runs.CountWaitingOnNodeAsync(cluster.Workers[0].NodeId!, token).ConfigureAwait(false), "normal completion releases handshake");
            }
        }

        private static async Task<string> LeasedRunTokenAsync(TestCluster cluster, Agent agent, Node node, string input, CancellationToken token)
        {
            DatabaseDriverBase db = cluster.Server.Server.Context.Database;
            Run run = await CreateRunAsync(cluster, agent, input, token).ConfigureAwait(false);
            long epoch = (await db.Runs.TryClaimAsync(run.Id, node.Id, node.Name, DateTime.UtcNow.AddMinutes(10), token).ConfigureAwait(false)) ?? throw new TestAssertionException("Claim of " + run.Id + " failed.");
            Run claimed = Assert.NotNull(await db.Runs.ReadAsync(run.Id, token).ConfigureAwait(false), "Claimed run");
            return await cluster.Server.Server.Context.Authentication.IssueForRunAsync(claimed, epoch, DateTime.UtcNow.AddMinutes(10), token).ConfigureAwait(false);
        }

        private static HttpClient RunClient(TestCluster cluster, string runToken)
        {
            HttpClient client = new HttpClient();
            client.BaseAddress = new Uri(cluster.Server.BaseUrl);
            client.DefaultRequestHeaders.Add("Authorization", "Bearer " + runToken);
            client.Timeout = TimeSpan.FromSeconds(90);
            return client;
        }

        private static string InvokePath(TestCluster cluster, Agent agent)
        {
            return "/v1.0/api/tenants/" + cluster.Server.TenantId + "/agents/" + agent.Id + "/invoke";
        }

        private static async Task<string> McpInvokeAsync(TestCluster cluster, string runToken, CancellationToken token)
        {
            using (McpHttpClient client = new McpHttpClient())
            {
                client.SetRequestHeader("Authorization", "Bearer " + runToken);
                await client.ConnectStreamableAsync(cluster.Server.McpUrl, "/mcp").ConfigureAwait(false);
                JsonElement invoked = await client.CallAsync<JsonElement>("tools/call", new { name = "garrison_invoke_agent", arguments = new { agent = "adm-child", input = "over MCP", waitSeconds = 30 } }, 60000).ConfigureAwait(false);
                return invoked.GetProperty("content")[0].GetProperty("text").GetString() ?? String.Empty;
            }
        }

        private static async Task<List<string>> InvokeResultsAsync(TestCluster cluster, string runId, CancellationToken token)
        {
            List<RunEvent> events = await cluster.Server.Server.Context.Database.RunEvents.ListAfterAsync(runId, 0, 1000, token).ConfigureAwait(false);
            return events.Where(e => e.EventType == RunEventTypeEnum.ToolResult && !String.IsNullOrEmpty(e.Text) && !e.Text!.StartsWith("ok ", StringComparison.Ordinal)).Select(e => e.Text!).ToList();
        }

        private static string Classify(string result)
        {
            if (result.StartsWith("DelegationCapacityExhausted", StringComparison.Ordinal)) return "capacity";
            string head = result.Length > 400 ? result.Substring(0, 400) : result;
            return Regex.IsMatch(head, "\"status\":\\s*\"Succeeded\"") ? "ok" : "other";
        }

        private static async Task<TestCluster> StartAsync(DatabaseTypeEnum provider, Action<WorkerSettings>? configure, CancellationToken token)
        {
            TestCluster cluster = await TestCluster.StartAsync(provider, 0, token).ConfigureAwait(false);
            WorkerHost worker = await TestCluster.StartWorkerAsync(cluster.Server.BaseUrl, "delegation-" + Guid.NewGuid().ToString("N").Substring(0, 6), settings =>
            {
                // The fake harness stands in for Claude Code, so it reads --mcp-config like Claude Code does.
                settings.Probes.Add(new HarnessProbeSettings { HarnessType = HarnessTypeEnum.ClaudeCode, Executable = "garrison-fake-harness", Label = "fake-claude" });
                configure?.Invoke(settings);
            }, token).ConfigureAwait(false);
            cluster.Workers.Add(worker);
            return cluster;
        }

        private static async Task<HarnessProfile> DelegatingProfileAsync(TestServerHost host, CancellationToken token)
        {
            // builtin/claude-code with the fake harness as the executable: each --mcp-invoke calls a tool on the Garrison
            // MCP server named in the run's --mcp-config, authenticated with the run token.
            HarnessProfile profile = BuiltInSeeder.HarnessProfileDefaults().Single(p => p.Name == "builtin/claude-code");
            profile.Id = IdGenerator.NewHarnessProfileId();
            profile.TenantId = host.TenantId;
            profile.Name = "test-delegating-" + Guid.NewGuid().ToString("N").Substring(0, 6);
            profile.Executable = "garrison-fake-harness";
            profile.IsBuiltIn = false;
            profile.BuiltInKey = null;
            profile.IsProtected = false;
            profile.Arguments.Insert(0, new HarnessArgument { Template = "claude" });
            profile.Arguments.Insert(0, new HarnessArgument { Template = "--format" });
            profile.Arguments.Add(new HarnessArgument { Template = "--tool-calls", Condition = "{{deployment.parameters.holdMs}}" });
            profile.Arguments.Add(new HarnessArgument { Template = "1", Condition = "{{deployment.parameters.holdMs}}" });
            profile.Arguments.Add(new HarnessArgument { Template = "--tool-sleep-ms", Condition = "{{deployment.parameters.holdMs}}" });
            profile.Arguments.Add(new HarnessArgument { Template = "{{deployment.parameters.holdMs}}", Condition = "{{deployment.parameters.holdMs}}" });
            for (int i = 1; i <= 3; i++)
            {
                string condition = "{{deployment.parameters.invoke" + i + "}}";
                profile.Arguments.Add(new HarnessArgument { Template = "--mcp-invoke", Condition = condition });
                profile.Arguments.Add(new HarnessArgument { Template = condition, Condition = condition });
            }
            for (int i = 0; i < profile.Arguments.Count; i++)
            {
                profile.Arguments[i].Id = String.Empty;
                profile.Arguments[i].Position = i;
            }
            return await host.Server.Context.Database.HarnessProfiles.CreateAsync(profile, token).ConfigureAwait(false);
        }

        private static string Invoke(string agent, string input)
        {
            return "garrison,garrison_invoke_agent," + Serializer.Serialize(new Dictionary<string, object> { { "agent", agent }, { "input", input }, { "waitSeconds", 120 } });
        }

        private static async Task<Run> CreateRunAsync(TestCluster cluster, Agent agent, string input, CancellationToken token)
        {
            InvokeRequest request = new InvokeRequest();
            request.Input = input;
            request.Wait = false;
            TestResponse response = await HttpTestHelpers.SendAsync(cluster.Server.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + cluster.Server.TenantId + "/agents/" + agent.Id + "/invoke", request, token).ConfigureAwait(false);
            if (response.StatusCode != 200 && response.StatusCode != 202) throw new TestAssertionException("Invoke returned " + response.StatusCode + ": " + response.Body);
            return Serializer.Deserialize<Run>(response.Body) ?? throw new TestAssertionException("Empty run.");
        }

        private static async Task<List<Run>> WaitAllAsync(TestCluster cluster, List<string> runIds, TimeSpan timeout, string what, CancellationToken token)
        {
            DateTime deadline = DateTime.UtcNow + timeout;
            List<Run> runs = new List<Run>();
            while (true)
            {
                runs.Clear();
                foreach (string id in runIds)
                {
                    Run? run = await cluster.Server.Server.Context.Database.Runs.ReadAsync(id, token).ConfigureAwait(false);
                    if (run != null) runs.Add(run);
                }
                if (runs.Count == runIds.Count && runs.All(r => RunService.IsTerminal(r.Status))) return runs;
                if (DateTime.UtcNow > deadline)
                {
                    List<Run> all = await AllRunsAsync(cluster, token).ConfigureAwait(false);
                    throw new TestAssertionException("Deadlock: " + what + " did not finish within " + timeout.TotalSeconds + " s. Runs: "
                        + String.Join("; ", all.Select(r => r.AgentName + " " + r.Id + " " + r.Status + (String.IsNullOrEmpty(r.ParentRunId) ? String.Empty : " parent " + r.ParentRunId))));
                }
                await Task.Delay(100, token).ConfigureAwait(false);
            }
        }

        private static async Task<List<Run>> AllRunsAsync(TestCluster cluster, CancellationToken token)
        {
            RunFilter filter = new RunFilter();
            filter.TenantId = cluster.Server.TenantId;
            filter.MaxResults = 1000;
            return (await cluster.Server.Server.Context.Database.Runs.EnumerateAsync(filter, token).ConfigureAwait(false)).Objects;
        }

        private static async Task<List<Run>> ChildrenAsync(TestCluster cluster, List<Run> parents, CancellationToken token)
        {
            HashSet<string> ids = new HashSet<string>(parents.Select(p => p.Id), StringComparer.Ordinal);
            return (await AllRunsAsync(cluster, token).ConfigureAwait(false)).Where(r => r.ParentRunId != null && ids.Contains(r.ParentRunId)).ToList();
        }

        #endregion
    }
}
