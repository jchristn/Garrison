namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
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
                cases.Add(new TestCaseDescriptor(id, "fencing", "Stale epochs and other nodes are fenced out (" + provider + ")", ct => FencingAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "lease-reaper", "Expired leases requeue with attempts left and fail with NodeLost otherwise (" + provider + ")", ct => ReaperAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "leader-election", "Only one holder leads; leadership moves after expiry with a higher epoch (" + provider + ")", ct => LeaderAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "events-idempotent", "Re-sent event batches are ignored by sequence (" + provider + ")", ct => EventsAsync(provider, ct)));
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
