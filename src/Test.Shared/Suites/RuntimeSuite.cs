namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Protocol;
    using Garrison.Core.Requests;
    using Garrison.Core.Services;
    using Garrison.Core.Settings;
    using Garrison.Core.Telemetry;
    using Garrison.Server.Runtime;
    using Garrison.Server.Settings;
    using SyslogLogging;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Runtime suites: atomic claims, fencing, lease reaping, leader election, idempotent events, delegation policy.
    /// </summary>
    public static class RuntimeSuite
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
                string id = "runtime-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                cases.Add(new TestCaseDescriptor(id, "claim-race", "Parallel claimers: exactly one wins each run (" + provider + ")", ct => ClaimRaceAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "stale-long-poll", "An old lease poll cannot claim after its node becomes unavailable or registers again (" + provider + ")", ct => StaleLongPollAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "fencing", "Stale epochs and other nodes are fenced out (" + provider + ")", ct => FencingAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "lease-reaper", "Expired leases requeue with attempts left and fail with NodeLost otherwise (" + provider + ")", ct => ReaperAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "leader-election", "Only one holder leads; leadership moves after expiry with a higher epoch (" + provider + ")", ct => LeaderAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "events-idempotent", "Re-sent event batches are ignored by sequence (" + provider + ")", ct => EventsAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "blocked-reasons", "Queued runs report NoReadyWorker, NoCapableWorker, and NoMatchingPool from node state (" + provider + ")", ct => BlockedReasonsAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "blocked-maintenance", "The leader explains blocked runs once per reason and fails them after Runtime.FailBlockedAfterSeconds (" + provider + ")", ct => BlockedMaintenanceAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "delegation-policy", "Delegation allowlist, cycle, and depth rules (" + provider + ")", ct => DelegationAsync(provider, ct)));
                suites.Add(new TestSuiteDescriptor(id, "Runtime (" + provider + ")", cases));
            }
            return suites;
        }

        private static Run NewRun(string tenantId, string deploymentId)
        {
            Run run = new Run();
            run.TenantId = tenantId;
            run.AgentId = "agt_test";
            run.AgentName = "tester";
            run.DeploymentId = deploymentId;
            run.HarnessType = HarnessTypeEnum.Generic;
            run.Status = RunStatusEnum.Queued;
            run.QueuedUtc = DateTime.UtcNow;
            run.InputText = "hello";
            return run;
        }

        private static async Task StaleLongPollAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            foreach (string change in new[] { "Lost", "Offline", "Draining", "Cordoned", "Inactive", "Reregistered", "CapabilitiesChanged", "Deleted" })
            {
                await using (TestCluster cluster = await TestCluster.StartAsync(provider, 0, token).ConfigureAwait(false))
                {
                    DatabaseDriverBase db = cluster.Server.Server.Context.Database;
                    Agent agent = await cluster.CreateAgentAsync("stale-poll", "builtin/fake", null, token).ConfigureAwait(false);
                    Node node = new Node();
                    node.Name = "stale-poll";
                    node.RegisteredUtc = DateTime.UtcNow;
                    node.LastHeartbeatUtc = DateTime.UtcNow;
                    node.Capabilities.Add(new NodeCapability { HarnessType = HarnessTypeEnum.Generic, Executable = "garrison-fake-harness", Available = true });
                    await db.Nodes.CreateAsync(node, token).ConfigureAwait(false);
                    Node snapshot = Assert.NotNull(await db.Nodes.ReadAsync(node.Id, token).ConfigureAwait(false), "Node snapshot");
                    SchedulerService scheduler = cluster.Server.Server.Context.Get<SchedulerService>();
                    Task<NodeLeaseResponse> pending = scheduler.LeaseAsync(snapshot, new NodeLeaseRequest { NodeId = node.Id, MaxRuns = 1, WaitMs = 2000 }, token);
                    DateTime deadline = DateTime.UtcNow.AddSeconds(3);
                    while (cluster.Server.Server.Context.Activity.HeldLongPolls == 0)
                    {
                        Assert.True(DateTime.UtcNow < deadline, "Lease request reaches its wait before node changes");
                        await Task.Delay(10, token).ConfigureAwait(false);
                    }
                    if (change == "Deleted") await db.Nodes.DeleteAsync(node.Id, token).ConfigureAwait(false);
                    else
                    {
                        Node current = Assert.NotNull(await db.Nodes.ReadAsync(node.Id, token).ConfigureAwait(false), "Current node");
                        if (change == "CapabilitiesChanged") current.Capabilities[0].Available = false;
                        else if (change == "Inactive") current.Active = false;
                        else if (change == "Reregistered") current.RegisteredUtc = current.RegisteredUtc!.Value.AddSeconds(1);
                        else current.Status = Enum.Parse<NodeStatusEnum>(change);
                        await db.Nodes.UpdateAsync(current, token).ConfigureAwait(false);
                    }
                    Run queued = await HttpTestHelpers.SendAsync<Run>(cluster.Server.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + cluster.Server.TenantId + "/agents/" + agent.Id + "/invoke", new InvokeRequest { Input = "Queued after node changes", Wait = false }, 202, token).ConfigureAwait(false);
                    NodeLeaseResponse response = await pending.WaitAsync(TimeSpan.FromSeconds(3), token).ConfigureAwait(false);
                    Assert.Equal(0, response.Assignments.Count, change + ": old poll receives no assignment");
                    Run untouched = Assert.NotNull(await db.Runs.ReadAsync(queued.Id, token).ConfigureAwait(false), "Queued run");
                    Assert.Equal(RunStatusEnum.Queued, untouched.Status, change + ": run stays queued");
                    Assert.True(untouched.LeaseNodeId == null, change + ": run is not leased to the old node");
                    Assert.Equal(0, cluster.Server.Server.Context.Activity.HeldLongPolls, "Poll accounting clears");

                    Node replacement = new Node();
                    replacement.Name = "replacement";
                    replacement.LastHeartbeatUtc = DateTime.UtcNow;
                    replacement.Capabilities.Add(new NodeCapability { HarnessType = HarnessTypeEnum.Generic, Executable = "garrison-fake-harness", Available = true });
                    await db.Nodes.CreateAsync(replacement, token).ConfigureAwait(false);
                    replacement = Assert.NotNull(await db.Nodes.ReadAsync(replacement.Id, token).ConfigureAwait(false), "Replacement node");
                    NodeLeaseResponse next = await scheduler.LeaseAsync(replacement, new NodeLeaseRequest { NodeId = replacement.Id, MaxRuns = 1, WaitMs = 0 }, token).ConfigureAwait(false);
                    Assert.Equal(1, next.Assignments.Count, change + ": a Ready replacement still claims the run");
                    Assert.Equal(queued.Id, next.Assignments[0].RunId, "Replacement claims the same queued run");
                }
            }
        }

        private static async Task ClaimRaceAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                List<Run> runs = new List<Run>();
                for (int i = 0; i < 10; i++) runs.Add(await db.Runs.CreateAsync(NewRun("ten_a", "dep_a"), token).ConfigureAwait(false));

                int wins = 0;
                List<Task> claimers = new List<Task>();
                for (int worker = 0; worker < 6; worker++)
                {
                    string node = "nod_" + worker;
                    claimers.Add(Task.Run(async () =>
                    {
                        foreach (Run run in runs)
                        {
                            long? epoch = await db.Runs.TryClaimAsync(run.Id, node, node, DateTime.UtcNow.AddSeconds(30), token).ConfigureAwait(false);
                            if (epoch.HasValue) Interlocked.Increment(ref wins);
                        }
                    }, token));
                }
                await Task.WhenAll(claimers).ConfigureAwait(false);
                Assert.Equal(10, wins, "Claims won");

                foreach (Run run in runs)
                {
                    Run read = Assert.NotNull(await db.Runs.ReadAsync(run.Id, token).ConfigureAwait(false), "Run");
                    Assert.Equal(RunStatusEnum.Leased, read.Status, "Status");
                    Assert.Equal(1L, read.LeaseEpoch, "Epoch");
                }
            }
        }

        private static async Task FencingAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                Run run = await db.Runs.CreateAsync(NewRun("ten_a", "dep_a"), token).ConfigureAwait(false);
                long epoch = (await db.Runs.TryClaimAsync(run.Id, "nod_1", "w1", DateTime.UtcNow.AddSeconds(30), token).ConfigureAwait(false)) ?? throw new TestAssertionException("Claim failed.");

                Assert.True(!await db.Runs.ExtendLeaseAsync(run.Id, "nod_1", epoch + 1, DateTime.UtcNow.AddSeconds(60), token).ConfigureAwait(false), "Wrong epoch extended a lease.");
                Assert.True(!await db.Runs.ExtendLeaseAsync(run.Id, "nod_2", epoch, DateTime.UtcNow.AddSeconds(60), token).ConfigureAwait(false), "Another node extended a lease.");
                Assert.True(await db.Runs.ExtendLeaseAsync(run.Id, "nod_1", epoch, DateTime.UtcNow.AddSeconds(60), token).ConfigureAwait(false), "Owner could not extend.");

                Run result = new Run();
                result.Id = run.Id;
                result.Status = RunStatusEnum.Succeeded;
                result.Outcome = RunOutcomeEnum.Succeeded;
                result.ResultText = "done";
                Assert.True(!await db.Runs.CompleteAsync(result, "nod_2", epoch, token).ConfigureAwait(false), "Another node completed the run.");
                Assert.True(await db.Runs.CompleteAsync(result, "nod_1", epoch, token).ConfigureAwait(false), "Owner could not complete.");
                Assert.True(!await db.Runs.CompleteAsync(result, "nod_1", epoch, token).ConfigureAwait(false), "A finished run accepted a second completion.");
                Run read = Assert.NotNull(await db.Runs.ReadAsync(run.Id, token).ConfigureAwait(false), "Run");
                Assert.Equal("done", read.ResultText, "Result");
            }
        }

        private static async Task ReaperAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                Run retryable = NewRun("ten_a", "dep_missing");
                retryable.MaxAttempts = 2;
                retryable = await db.Runs.CreateAsync(retryable, token).ConfigureAwait(false);
                Run final = NewRun("ten_a", "dep_missing");
                final.MaxAttempts = 1;
                final = await db.Runs.CreateAsync(final, token).ConfigureAwait(false);

                await db.Runs.TryClaimAsync(retryable.Id, "nod_1", "w1", DateTime.UtcNow.AddSeconds(-5), token).ConfigureAwait(false);
                await db.Runs.TryClaimAsync(final.Id, "nod_1", "w1", DateTime.UtcNow.AddSeconds(-5), token).ConfigureAwait(false);

                FixedLeader leader = new FixedLeader();
                using (GarrisonTelemetry telemetry = new GarrisonTelemetry(new TelemetrySettings { Enabled = false }, "test", null))
                using (MaintenanceService maintenance = new MaintenanceService(db, leader, new RunSignals(), new RuntimeOptions(), telemetry, QuietLogging()))
                {
                    await maintenance.RunOnceAsync(token).ConfigureAwait(false);
                }

                Run requeued = Assert.NotNull(await db.Runs.ReadAsync(retryable.Id, token).ConfigureAwait(false), "Retryable");
                Assert.Equal(RunStatusEnum.Queued, requeued.Status, "Retryable status");
                Assert.Equal(2, requeued.Attempt, "Attempt");
                Assert.True(requeued.LeaseNodeId == null, "Lease should be cleared.");

                Run failed = Assert.NotNull(await db.Runs.ReadAsync(final.Id, token).ConfigureAwait(false), "Final");
                Assert.Equal(RunStatusEnum.Failed, failed.Status, "Final status");
                Assert.Equal(RunOutcomeEnum.NodeLost, failed.Outcome, "Final outcome");

                long? reclaimed = await db.Runs.TryClaimAsync(retryable.Id, "nod_2", "w2", DateTime.UtcNow.AddSeconds(30), token).ConfigureAwait(false);
                Assert.Equal(2L, reclaimed ?? 0, "Epoch after requeue");
            }
        }

        private static async Task LeaderAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                long? a = await db.CoordinationLeases.TryAcquireAsync("leader", "A", 2000, token).ConfigureAwait(false);
                long? b = await db.CoordinationLeases.TryAcquireAsync("leader", "B", 2000, token).ConfigureAwait(false);
                Assert.Equal(1L, a ?? 0, "A epoch");
                Assert.True(b == null, "B must not lead while A's lease is live.");
                long? aRenew = await db.CoordinationLeases.TryAcquireAsync("leader", "A", 1000, token).ConfigureAwait(false);
                Assert.Equal(1L, aRenew ?? 0, "Renewal keeps the epoch");
                await Task.Delay(1300, token).ConfigureAwait(false);
                long? bLater = await db.CoordinationLeases.TryAcquireAsync("leader", "B", 2000, token).ConfigureAwait(false);
                Assert.Equal(2L, bLater ?? 0, "B epoch after expiry");
                long? aLater = await db.CoordinationLeases.TryAcquireAsync("leader", "A", 2000, token).ConfigureAwait(false);
                Assert.True(aLater == null, "A must not reclaim while B leads.");
            }
        }

        private static async Task EventsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                Run run = await db.Runs.CreateAsync(NewRun("ten_a", "dep_a"), token).ConfigureAwait(false);
                List<RunEvent> batch = new List<RunEvent>();
                for (int i = 1; i <= 5; i++)
                {
                    RunEvent evt = new RunEvent();
                    evt.TenantId = "ten_a";
                    evt.RunId = run.Id;
                    evt.Sequence = i;
                    evt.EventType = RunEventTypeEnum.AssistantText;
                    evt.Text = "chunk " + i;
                    batch.Add(evt);
                }
                Assert.Equal(5, await db.RunEvents.InsertBatchAsync(batch, token).ConfigureAwait(false), "First insert");
                foreach (RunEvent evt in batch) evt.Id = String.Empty;
                Assert.Equal(0, await db.RunEvents.InsertBatchAsync(batch, token).ConfigureAwait(false), "Duplicate insert");
                List<RunEvent> after = await db.RunEvents.ListAfterAsync(run.Id, 2, 100, token).ConfigureAwait(false);
                Assert.Equal(3, after.Count, "Events after 2");
                Assert.Equal(3L, after[0].Sequence, "First sequence after 2");
            }
        }

        private static Node NewNode(string name, NodeStatusEnum status, string? poolId, params HarnessTypeEnum[] harnesses)
        {
            Node node = new Node();
            node.Name = name;
            node.Status = status;
            node.NodePoolId = poolId;
            node.LastHeartbeatUtc = DateTime.UtcNow;
            foreach (HarnessTypeEnum harness in harnesses) node.Capabilities.Add(new NodeCapability { NodeId = node.Id, HarnessType = harness, Available = true });
            return node;
        }

        private static async Task BlockedReasonsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                BlockedRunService blocked = new BlockedRunService(db);
                blocked.SnapshotTtlMs = 0;

                Run codex = NewRun("ten_a", "dep_a");
                codex.HarnessType = HarnessTypeEnum.Codex;
                codex = await db.Runs.CreateAsync(codex, token).ConfigureAwait(false);

                Assert.Equal(RunBlockedReasonEnum.NoReadyWorker, (await blocked.AnnotateAsync(codex, token).ConfigureAwait(false))!.BlockedReason, "no nodes at all");
                await db.Nodes.CreateAsync(NewNode("draining-codex", NodeStatusEnum.Draining, null, HarnessTypeEnum.Codex), token).ConfigureAwait(false);
                Assert.Equal(RunBlockedReasonEnum.NoReadyWorker, (await blocked.AnnotateAsync(codex, token).ConfigureAwait(false))!.BlockedReason, "only non-Ready nodes");

                await db.Nodes.CreateAsync(NewNode("generic-only", NodeStatusEnum.Ready, null, HarnessTypeEnum.Generic), token).ConfigureAwait(false);
                Assert.Equal(RunBlockedReasonEnum.NoCapableWorker, (await blocked.AnnotateAsync(codex, token).ConfigureAwait(false))!.BlockedReason, "Ready node without the harness");
                Assert.True(BlockedRunService.Describe(codex, RunBlockedReasonEnum.NoCapableWorker).Contains("Codex harness", StringComparison.Ordinal), "description names the harness");

                NodePool gpu = await db.NodePools.CreateAsync(new NodePool { Name = "gpu" }, token).ConfigureAwait(false);
                NodePool other = await db.NodePools.CreateAsync(new NodePool { Name = "other" }, token).ConfigureAwait(false);
                NodePool dedicated = new NodePool { Name = "dedicated" };
                dedicated.Tenants.Add("ten_other");
                dedicated = await db.NodePools.CreateAsync(dedicated, token).ConfigureAwait(false);
                await db.Nodes.CreateAsync(NewNode("codex-gpu", NodeStatusEnum.Ready, gpu.Id, HarnessTypeEnum.Codex), token).ConfigureAwait(false);
                await db.Nodes.CreateAsync(NewNode("codex-dedicated", NodeStatusEnum.Ready, dedicated.Id, HarnessTypeEnum.Codex), token).ConfigureAwait(false);

                Run inOtherPool = NewRun("ten_a", "dep_a");
                inOtherPool.HarnessType = HarnessTypeEnum.Codex;
                inOtherPool.NodePoolId = other.Id;
                inOtherPool = await db.Runs.CreateAsync(inOtherPool, token).ConfigureAwait(false);

                Run withSelector = NewRun("ten_a", "dep_a");
                withSelector.HarnessType = HarnessTypeEnum.Codex;
                withSelector.Requirements.Add(new RunRequirement { Key = "zone", Value = "mars" });
                withSelector = await db.Runs.CreateAsync(withSelector, token).ConfigureAwait(false);

                Run inGpuPool = NewRun("ten_a", "dep_a");
                inGpuPool.HarnessType = HarnessTypeEnum.Codex;
                inGpuPool.NodePoolId = gpu.Id;
                inGpuPool = await db.Runs.CreateAsync(inGpuPool, token).ConfigureAwait(false);

                Run dedicatedOnly = NewRun("ten_a", "dep_a");
                dedicatedOnly.HarnessType = HarnessTypeEnum.Codex;
                dedicatedOnly.NodePoolId = dedicated.Id;
                dedicatedOnly = await db.Runs.CreateAsync(dedicatedOnly, token).ConfigureAwait(false);

                Run running = NewRun("ten_a", "dep_a");
                running.HarnessType = HarnessTypeEnum.ClaudeCode;
                running.Status = RunStatusEnum.Running;
                running = await db.Runs.CreateAsync(running, token).ConfigureAwait(false);

                Run otherTenant = NewRun("ten_b", "dep_b");
                otherTenant.HarnessType = HarnessTypeEnum.Mux;
                otherTenant = await db.Runs.CreateAsync(otherTenant, token).ConfigureAwait(false);

                RunFilter filter = new RunFilter();
                filter.TenantId = "ten_a";
                filter.MaxResults = 100;
                List<Run> page = (await db.Runs.EnumerateAsync(filter, token).ConfigureAwait(false)).Objects;
                await blocked.AnnotateManyAsync(page, token).ConfigureAwait(false);
                Dictionary<string, RunBlockedReasonEnum?> reasons = page.ToDictionary(r => r.Id, r => r.BlockedReason);
                Assert.True(reasons[codex.Id] == null, "a capable Ready node with no constraints unblocks the run (got " + reasons[codex.Id] + ")");
                Assert.Equal(RunBlockedReasonEnum.NoMatchingPool, reasons[inOtherPool.Id] ?? (RunBlockedReasonEnum)(-1), "node pool mismatch");
                Assert.Equal(RunBlockedReasonEnum.NoMatchingPool, reasons[withSelector.Id] ?? (RunBlockedReasonEnum)(-1), "node selector mismatch");
                Assert.True(reasons[inGpuPool.Id] == null, "matching pool is not blocked");
                Assert.Equal(RunBlockedReasonEnum.NoMatchingPool, reasons[dedicatedOnly.Id] ?? (RunBlockedReasonEnum)(-1), "pool dedicated to another tenant");
                Assert.True(reasons[running.Id] == null, "non-queued runs are never blocked");

                List<Run> blockedA = await blocked.ListBlockedAsync("ten_a", token).ConfigureAwait(false);
                Assert.Equal(3, blockedA.Count, "blocked runs in ten_a");
                Assert.Equal(3L, await blocked.CountBlockedAsync("ten_a", token).ConfigureAwait(false), "blocked count in ten_a");
                Assert.Equal(1L, await blocked.CountBlockedAsync("ten_b", token).ConfigureAwait(false), "blocked count in ten_b");
                Assert.Equal(RunBlockedReasonEnum.NoCapableWorker, (await blocked.AnnotateAsync(otherTenant, token).ConfigureAwait(false))!.BlockedReason, "Mux has no capable node");

                List<Run> queued = await db.Runs.ListQueuedAsync("ten_a", 100, token).ConfigureAwait(false);
                Assert.Equal(5, queued.Count, "queued runs in ten_a");
                Assert.Equal(1, queued.Single(r => r.Id == withSelector.Id).Requirements.Count, "requirements loaded with queued runs");

                blocked.SnapshotTtlMs = 60000;
                await blocked.SnapshotAsync(true, token).ConfigureAwait(false);
                await db.Nodes.CreateAsync(NewNode("mux-node", NodeStatusEnum.Ready, null, HarnessTypeEnum.Mux), token).ConfigureAwait(false);
                Assert.Equal(RunBlockedReasonEnum.NoCapableWorker, (await blocked.AnnotateAsync(otherTenant, token).ConfigureAwait(false))!.BlockedReason, "cached snapshot is reused");
                blocked.Invalidate();
                Assert.True((await blocked.AnnotateAsync(otherTenant, token).ConfigureAwait(false))!.BlockedReason == null, "invalidated snapshot sees the new node");
            }
        }

        private static async Task BlockedMaintenanceAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                BlockedRunService blocked = new BlockedRunService(db);
                blocked.SnapshotTtlMs = 0;
                Node generic = await db.Nodes.CreateAsync(NewNode("generic-worker", NodeStatusEnum.Ready, null, HarnessTypeEnum.Generic), token).ConfigureAwait(false);

                Run codex = NewRun("ten_a", "dep_a");
                codex.HarnessType = HarnessTypeEnum.Codex;
                codex = await db.Runs.CreateAsync(codex, token).ConfigureAwait(false);
                Run fine = await db.Runs.CreateAsync(NewRun("ten_a", "dep_a"), token).ConfigureAwait(false);

                RuntimeOptions options = new RuntimeOptions();
                FixedLeader leader = new FixedLeader();
                using (GarrisonTelemetry telemetry = new GarrisonTelemetry(new TelemetrySettings { Enabled = false }, "test", null))
                {
                    using (MaintenanceService maintenance = new MaintenanceService(db, leader, new RunSignals(), options, telemetry, QuietLogging()))
                    {
                        maintenance.BlockedRuns = blocked;
                        await maintenance.RunOnceAsync(token).ConfigureAwait(false);
                        await maintenance.RunOnceAsync(token).ConfigureAwait(false);
                    }

                    List<RunEvent> events = await db.RunEvents.ListAfterAsync(codex.Id, 0, 100, token).ConfigureAwait(false);
                    Assert.Equal(1, events.Count, "one warning per reason");
                    Assert.Equal(RunEventTypeEnum.Warning, events[0].EventType, "event type");
                    Assert.Equal("No Ready worker reports the Codex harness. The run waits until one registers.", events[0].Text, "event text");
                    Assert.Equal(0, (await db.RunEvents.ListAfterAsync(fine.Id, 0, 100, token).ConfigureAwait(false)).Count, "runs a worker can take get no warning");
                    Run afterWarning = Assert.NotNull(await db.Runs.ReadAsync(codex.Id, token).ConfigureAwait(false), "Run");
                    Assert.Equal(events[0].Sequence, afterWarning.LastEventSequence, "last event sequence advances");
                    Assert.Equal(RunStatusEnum.Queued, afterWarning.Status, "still queued without fail-after");

                    // A new leader (fresh in-memory state) does not repeat the warning, but a new reason gets its own.
                    using (MaintenanceService successor = new MaintenanceService(db, leader, new RunSignals(), options, telemetry, QuietLogging()))
                    {
                        successor.BlockedRuns = blocked;
                        await successor.RunOnceAsync(token).ConfigureAwait(false);
                        Assert.Equal(1, (await db.RunEvents.ListAfterAsync(codex.Id, 0, 100, token).ConfigureAwait(false)).Count, "successor does not repeat the warning");

                        await db.Nodes.SetStatusAsync(generic.Id, NodeStatusEnum.Cordoned, token).ConfigureAwait(false);
                        await successor.RunOnceAsync(token).ConfigureAwait(false);
                        await successor.RunOnceAsync(token).ConfigureAwait(false);
                        List<RunEvent> second = await db.RunEvents.ListAfterAsync(codex.Id, 0, 100, token).ConfigureAwait(false);
                        Assert.Equal(2, second.Count, "a new reason adds one warning");
                        Assert.True((second[1].Text ?? String.Empty).StartsWith("No worker node is Ready", StringComparison.Ordinal), "NoReadyWorker text: " + second[1].Text);
                        Assert.Equal(1, (await db.RunEvents.ListAfterAsync(fine.Id, 0, 100, token).ConfigureAwait(false)).Count, "the generic run is now blocked too");

                        options.FailBlockedAfterSeconds = 1;
                        await successor.RunOnceAsync(token).ConfigureAwait(false);
                        await Task.Delay(1200, token).ConfigureAwait(false);
                        await db.Nodes.SetStatusAsync(generic.Id, NodeStatusEnum.Ready, token).ConfigureAwait(false);
                        await successor.RunOnceAsync(token).ConfigureAwait(false);
                    }

                    Run failed = Assert.NotNull(await db.Runs.ReadAsync(codex.Id, token).ConfigureAwait(false), "Failed run");
                    Assert.Equal(RunStatusEnum.Failed, failed.Status, "blocked run fails after the configured wait");
                    Assert.Equal(RunOutcomeEnum.NoCapableWorker, failed.Outcome, "outcome");
                    Assert.True(failed.CompletedUtc.HasValue, "completed time set");
                    Assert.True((failed.ErrorMessage ?? String.Empty).Contains("Runtime.FailBlockedAfterSeconds", StringComparison.Ordinal) && (failed.ErrorMessage ?? String.Empty).Contains("Codex", StringComparison.Ordinal), "error message: " + failed.ErrorMessage);
                    Run unblocked = Assert.NotNull(await db.Runs.ReadAsync(fine.Id, token).ConfigureAwait(false), "Unblocked run");
                    Assert.Equal(RunStatusEnum.Queued, unblocked.Status, "a run that became runnable again is not failed");
                }
            }
        }

        private static async Task DelegationAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                Agent caller = new Agent();
                caller.TenantId = "ten_a";
                caller.Name = "lead";
                caller.DelegationMode = DelegationModeEnum.AllowList;
                caller.DelegationAllowList.Add("helper");
                caller.DelegationMaxDepth = 1;
                await db.Agents.CreateAsync(caller, token).ConfigureAwait(false);
                Agent helper = new Agent();
                helper.TenantId = "ten_a";
                helper.Name = "helper";
                await db.Agents.CreateAsync(helper, token).ConfigureAwait(false);
                Agent other = new Agent();
                other.TenantId = "ten_a";
                other.Name = "other";
                await db.Agents.CreateAsync(other, token).ConfigureAwait(false);

                Run parent = NewRun("ten_a", "dep_a");
                parent.AgentId = caller.Id;
                parent.AgentName = caller.Name;
                parent.CallChain = "lead";
                parent.Status = RunStatusEnum.Running;
                parent = await db.Runs.CreateAsync(parent, token).ConfigureAwait(false);

                DelegationPolicy policy = new DelegationPolicy(db);
                await policy.CheckAsync(parent, helper, token).ConfigureAwait(false);
                await ExpectConflictAsync(() => policy.CheckAsync(parent, other, token), "DelegationNotAllowed").ConfigureAwait(false);
                await ExpectConflictAsync(() => policy.CheckAsync(parent, caller, token), "DelegationNotAllowed").ConfigureAwait(false);

                parent.Depth = 1;
                await ExpectConflictAsync(() => policy.CheckAsync(parent, helper, token), "DelegationDepthExceeded").ConfigureAwait(false);

                caller.DelegationMode = DelegationModeEnum.Any;
                caller.DelegationMaxDepth = 5;
                await db.Agents.UpdateAsync(caller, token).ConfigureAwait(false);
                parent.Depth = 0;
                parent.CallChain = "lead,helper";
                await ExpectConflictAsync(() => policy.CheckAsync(parent, helper, token), "DelegationCycle").ConfigureAwait(false);
            }
        }

        private static LoggingModule QuietLogging()
        {
            LoggingModule logging = new LoggingModule();
            logging.Settings.EnableConsole = false;
            return logging;
        }

        private static async Task ExpectConflictAsync(Func<Task> action, string code)
        {
            try
            {
                await action().ConfigureAwait(false);
            }
            catch (ConflictException e)
            {
                Assert.Equal(code, e.Code, "Conflict code");
                return;
            }
            throw new TestAssertionException("Expected conflict " + code + ".");
        }
    }
}
