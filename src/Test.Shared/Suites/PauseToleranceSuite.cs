namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Core.Settings;
    using Garrison.Core.Telemetry;
    using Garrison.Server.Runtime;
    using SyslogLogging;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Pause tolerance (P3.16): a leader that was paused (host sleep, frozen VM, clock jump) does not mark healthy nodes
    /// Lost, healthy control nodes Offline, or fail healthy runs; a real outage is still detected after the deferral; and
    /// deadlines move by the paused time only for runs whose worker re-confirmed its lease. Every case drives the
    /// maintenance clock by hand.
    /// </summary>
    public static class PauseToleranceSuite
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
                string id = "pause-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                cases.Add(new TestCaseDescriptor(id, "detector", "PauseDetector reports a gap longer than the interval plus the grace and nothing shorter (" + provider + ")", ct => DetectorAsync(ct)));
                cases.Add(new TestCaseDescriptor(id, "leader-pause", "A 3-minute leader pause with workers that resume heartbeating marks nothing Lost or Offline and fails no run (" + provider + ")", ct => LeaderPauseAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "real-outage", "A worker that stays down through a pause is marked Lost and its run fails with NodeLost after the deferral (" + provider + ")", ct => RealOutageAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "deadline-extension", "Deadlines move by the paused time only when the worker re-confirmed the lease (" + provider + ")", ct => DeadlineExtensionAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "self-stale", "A leader whose own control node heartbeat is stale marks nothing until it heartbeats again (" + provider + ")", ct => SelfStaleAsync(provider, ct)));
                suites.Add(new TestSuiteDescriptor(id, "Pause tolerance (" + provider + ")", cases));
            }
            return suites;
        }

        private static Task DetectorAsync(CancellationToken token)
        {
            token.ThrowIfCancellationRequested();
            ManualTimeProvider clock = new ManualTimeProvider(Start());
            PauseDetector detector = new PauseDetector(clock);
            Assert.Equal(TimeSpan.Zero, detector.Observe(2000, 5000), "first observation");
            clock.Advance(TimeSpan.FromMilliseconds(6900));
            Assert.Equal(TimeSpan.Zero, detector.Observe(2000, 5000), "gap within the interval plus the grace");
            clock.Advance(TimeSpan.FromSeconds(180));
            Assert.Equal(TimeSpan.FromSeconds(178), detector.Observe(2000, 5000), "paused time is the gap minus the interval");
            Assert.Equal(1L, detector.PausesDetected, "pauses detected");
            Assert.Equal(clock.UtcNow(), detector.LastResumedUtc ?? DateTime.MinValue, "resume time");
            return Task.CompletedTask;
        }

        private static async Task LeaderPauseAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                ManualTimeProvider clock = new ManualTimeProvider(Start());
                DateTime t0 = clock.UtcNow();
                Node worker0 = await db.Nodes.CreateAsync(NewNode("garrison-worker-0", t0), token).ConfigureAwait(false);
                Node worker1 = await db.Nodes.CreateAsync(NewNode("garrison-worker-1", t0), token).ConfigureAwait(false);
                await db.ControlNodes.UpsertAsync(NewControlNode("garrison-server-0", t0), token).ConfigureAwait(false);
                await db.ControlNodes.UpsertAsync(NewControlNode("garrison-server-1", t0), token).ConfigureAwait(false);
                Run run0 = await db.Runs.CreateAsync(NewLeasedRun(worker0, t0, t0.AddSeconds(30), t0.AddSeconds(60)), token).ConfigureAwait(false);
                Run run1 = await db.Runs.CreateAsync(NewLeasedRun(worker1, t0, t0.AddSeconds(30), t0.AddMinutes(30)), token).ConfigureAwait(false);

                using (GarrisonTelemetry telemetry = new GarrisonTelemetry(new TelemetrySettings { Enabled = false }, "test", null))
                using (MaintenanceService maintenance = NewMaintenance(db, clock, telemetry, "garrison-server-0"))
                {
                    Assert.True(await maintenance.RunTickAsync(token).ConfigureAwait(false), "a normal tick evaluates");

                    // The whole VM sleeps for 3 minutes; the leader's tick runs first on resume.
                    clock.Advance(TimeSpan.FromMinutes(3));
                    Assert.True(!await maintenance.RunTickAsync(token).ConfigureAwait(false), "the tick after a pause defers");
                    Assert.Equal(1L, maintenance.PausesDetected, "pauses detected");
                    Assert.True(maintenance.DeferredUntilUtc.HasValue, "a deferral is pending");
                    await AssertHealthyAsync(db, new List<Node> { worker0, worker1 }, new List<Run> { run0, run1 }, "right after the pause", token).ConfigureAwait(false);
                    ControlNode self = Assert.NotNull(await db.ControlNodes.ReadAsync("garrison-server-0", token).ConfigureAwait(false), "leader row");
                    Assert.True(self.LastHeartbeatUtc >= clock.UtcNow().AddSeconds(-1), "the leader heartbeats itself on resume");

                    // Workers and the other replica resume and heartbeat within the window.
                    clock.Advance(TimeSpan.FromSeconds(1));
                    await ResumeWorkerAsync(db, worker0, run0, clock.UtcNow(), token).ConfigureAwait(false);
                    await ResumeWorkerAsync(db, worker1, run1, clock.UtcNow(), token).ConfigureAwait(false);
                    await db.ControlNodes.UpsertAsync(NewControlNode("garrison-server-1", clock.UtcNow()), token).ConfigureAwait(false);

                    bool evaluated = await TickUntilEvaluatedAsync(maintenance, clock, token).ConfigureAwait(false);
                    Assert.True(evaluated, "maintenance evaluates once the deferral ends");
                    await AssertHealthyAsync(db, new List<Node> { worker0, worker1 }, new List<Run> { run0, run1 }, "after the deferral", token).ConfigureAwait(false);
                    foreach (string id in new[] { "garrison-server-0", "garrison-server-1" })
                    {
                        ControlNode row = Assert.NotNull(await db.ControlNodes.ReadAsync(id, token).ConfigureAwait(false), id);
                        Assert.True(row.Status != ControlNodeStatusEnum.Offline, id + " is not Offline");
                    }
                }
            }
        }

        private static async Task RealOutageAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                ManualTimeProvider clock = new ManualTimeProvider(Start());
                DateTime t0 = clock.UtcNow();
                Node healthy = await db.Nodes.CreateAsync(NewNode("garrison-worker-0", t0), token).ConfigureAwait(false);
                Node dead = await db.Nodes.CreateAsync(NewNode("garrison-worker-1", t0), token).ConfigureAwait(false);
                await db.ControlNodes.UpsertAsync(NewControlNode("garrison-server-0", t0), token).ConfigureAwait(false);
                Run healthyRun = await db.Runs.CreateAsync(NewLeasedRun(healthy, t0, t0.AddSeconds(30), t0.AddMinutes(30)), token).ConfigureAwait(false);
                Run deadRun = await db.Runs.CreateAsync(NewLeasedRun(dead, t0, t0.AddSeconds(30), t0.AddMinutes(30)), token).ConfigureAwait(false);

                using (GarrisonTelemetry telemetry = new GarrisonTelemetry(new TelemetrySettings { Enabled = false }, "test", null))
                using (MaintenanceService maintenance = NewMaintenance(db, clock, telemetry, "garrison-server-0"))
                {
                    await maintenance.RunTickAsync(token).ConfigureAwait(false);
                    clock.Advance(TimeSpan.FromMinutes(3));
                    Assert.True(!await maintenance.RunTickAsync(token).ConfigureAwait(false), "the tick after a pause defers");
                    Node notYet = Assert.NotNull(await db.Nodes.ReadAsync(dead.Id, token).ConfigureAwait(false), "dead node");
                    Assert.Equal(NodeStatusEnum.Ready, notYet.Status, "a silent node is not marked Lost during the deferral");

                    // Only one worker comes back; the other stays down.
                    clock.Advance(TimeSpan.FromSeconds(1));
                    await ResumeWorkerAsync(db, healthy, healthyRun, clock.UtcNow(), token).ConfigureAwait(false);
                    Assert.True(await TickUntilEvaluatedAsync(maintenance, clock, token).ConfigureAwait(false), "maintenance evaluates once the deferral ends");

                    Node lost = Assert.NotNull(await db.Nodes.ReadAsync(dead.Id, token).ConfigureAwait(false), "dead node");
                    Assert.Equal(NodeStatusEnum.Lost, lost.Status, "a worker that stays down is marked Lost after the deferral");
                    Run failed = Assert.NotNull(await db.Runs.ReadAsync(deadRun.Id, token).ConfigureAwait(false), "dead run");
                    Assert.Equal(RunStatusEnum.Failed, failed.Status, "the dead worker's run fails");
                    Assert.Equal(RunOutcomeEnum.NodeLost, failed.Outcome, "outcome");
                    await AssertHealthyAsync(db, new List<Node> { healthy }, new List<Run> { healthyRun }, "the resumed worker", token).ConfigureAwait(false);
                }
            }
        }

        private static async Task DeadlineExtensionAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                ManualTimeProvider clock = new ManualTimeProvider(Start());
                DateTime t0 = clock.UtcNow();
                Node worker = await db.Nodes.CreateAsync(NewNode("garrison-worker-0", t0), token).ConfigureAwait(false);
                await db.ControlNodes.UpsertAsync(NewControlNode("garrison-server-0", t0), token).ConfigureAwait(false);

                // Leases last 10 minutes here, so neither lease expires during the pause and only the deadline decides.
                // Both runs would pass their deadline during the pause. The first one's worker renews its lease after the
                // resume; nobody renews the second.
                RuntimeOptions options = new RuntimeOptions();
                options.LeaseDurationMs = 600000;
                DateTime deadline = t0.AddSeconds(60);
                Run confirmed = await db.Runs.CreateAsync(NewLeasedRun(worker, t0, t0.AddMinutes(10), deadline), token).ConfigureAwait(false);
                Run unconfirmed = await db.Runs.CreateAsync(NewLeasedRun(worker, t0, t0.AddMinutes(10), deadline), token).ConfigureAwait(false);

                using (GarrisonTelemetry telemetry = new GarrisonTelemetry(new TelemetrySettings { Enabled = false }, "test", null))
                using (MaintenanceService maintenance = NewMaintenance(db, clock, telemetry, "garrison-server-0", options))
                {
                    await maintenance.RunTickAsync(token).ConfigureAwait(false);
                    clock.Advance(TimeSpan.FromMinutes(3));
                    await maintenance.RunTickAsync(token).ConfigureAwait(false);
                    Run during = Assert.NotNull(await db.Runs.ReadAsync(unconfirmed.Id, token).ConfigureAwait(false), "unconfirmed run");
                    Assert.Equal(RunStatusEnum.Leased, during.Status, "no deadline is enforced during the deferral");

                    clock.Advance(TimeSpan.FromSeconds(1));
                    await ResumeWorkerAsync(db, worker, confirmed, clock.UtcNow(), token, options.LeaseDurationMs).ConfigureAwait(false);
                    Assert.True(await TickUntilEvaluatedAsync(maintenance, clock, token).ConfigureAwait(false), "maintenance evaluates once the deferral ends");

                    // Paused time is the gap (180 s) minus the maintenance interval (2 s).
                    TimeSpan paused = TimeSpan.FromSeconds(178);
                    Run extended = Assert.NotNull(await db.Runs.ReadAsync(confirmed.Id, token).ConfigureAwait(false), "confirmed run");
                    Assert.Equal(RunStatusEnum.Leased, extended.Status, "the re-confirmed run keeps running");
                    Assert.True(extended.DeadlineUtc.HasValue && Math.Abs((extended.DeadlineUtc.Value - (deadline + paused)).TotalSeconds) < 1, "deadline moved by the paused time: " + extended.DeadlineUtc);

                    Run timedOut = Assert.NotNull(await db.Runs.ReadAsync(unconfirmed.Id, token).ConfigureAwait(false), "unconfirmed run");
                    Assert.Equal(RunStatusEnum.TimedOut, timedOut.Status, "a run whose lease was not re-confirmed is enforced normally");
                    Assert.Equal(RunOutcomeEnum.TimedOut, timedOut.Outcome, "outcome");
                }
            }
        }

        private static async Task SelfStaleAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                ManualTimeProvider clock = new ManualTimeProvider(Start());
                DateTime t0 = clock.UtcNow();
                Node silent = await db.Nodes.CreateAsync(NewNode("garrison-worker-0", t0.AddMinutes(-5)), token).ConfigureAwait(false);

                using (GarrisonTelemetry telemetry = new GarrisonTelemetry(new TelemetrySettings { Enabled = false }, "test", null))
                using (MaintenanceService maintenance = new MaintenanceService(db, new FixedLeader(), new RunSignals(), new RuntimeOptions(), telemetry, QuietLogging()))
                {
                    maintenance.Clock = clock;
                    DateTime? selfHeartbeat = t0.AddMinutes(-1);
                    maintenance.SelfHeartbeatUtc = () => selfHeartbeat;

                    Assert.True(!await maintenance.RunTickAsync(token).ConfigureAwait(false), "a leader with a stale own heartbeat defers");
                    Node still = Assert.NotNull(await db.Nodes.ReadAsync(silent.Id, token).ConfigureAwait(false), "node");
                    Assert.Equal(NodeStatusEnum.Ready, still.Status, "nothing is marked while the leader's own heartbeat is stale");

                    selfHeartbeat = clock.UtcNow();
                    clock.Advance(TimeSpan.FromSeconds(2));
                    Assert.True(await maintenance.RunTickAsync(token).ConfigureAwait(false), "a fresh own heartbeat lets maintenance evaluate");
                    Node lost = Assert.NotNull(await db.Nodes.ReadAsync(silent.Id, token).ConfigureAwait(false), "node");
                    Assert.Equal(NodeStatusEnum.Lost, lost.Status, "a silent node is marked Lost once the leader is fresh");
                }
            }
        }

        private static MaintenanceService NewMaintenance(DatabaseDriverBase db, ManualTimeProvider clock, GarrisonTelemetry telemetry, string selfId, RuntimeOptions? options = null)
        {
            MaintenanceService maintenance = new MaintenanceService(db, new FixedLeader(), new RunSignals(), options ?? new RuntimeOptions(), telemetry, QuietLogging());
            maintenance.Clock = clock;
            DateTime? last = clock.UtcNow();
            maintenance.SelfHeartbeatUtc = () => last;
            maintenance.HeartbeatSelfAsync = async ct =>
            {
                DateTime now = clock.UtcNow();
                await db.ControlNodes.UpsertAsync(NewControlNode(selfId, now), ct).ConfigureAwait(false);
                last = now;
            };
            return maintenance;
        }

        private static async Task<bool> TickUntilEvaluatedAsync(MaintenanceService maintenance, ManualTimeProvider clock, CancellationToken token)
        {
            // Regular ticks two seconds apart (the default maintenance interval) until the deferral ends.
            for (int i = 0; i < 20; i++)
            {
                clock.Advance(TimeSpan.FromSeconds(2));
                if (await maintenance.RunTickAsync(token).ConfigureAwait(false)) return true;
            }
            return false;
        }

        private static async Task ResumeWorkerAsync(DatabaseDriverBase db, Node node, Run run, DateTime now, CancellationToken token, int leaseDurationMs = 30000)
        {
            Node current = Assert.NotNull(await db.Nodes.ReadAsync(node.Id, token).ConfigureAwait(false), "node " + node.Name);
            current.LastHeartbeatUtc = now;
            await db.Nodes.UpdateAsync(current, token).ConfigureAwait(false);
            Assert.True(await db.Runs.ExtendLeaseAsync(run.Id, node.Id, run.LeaseEpoch, now.AddMilliseconds(leaseDurationMs), token).ConfigureAwait(false), "lease renewed for " + run.Id);
        }

        private static async Task AssertHealthyAsync(DatabaseDriverBase db, List<Node> nodes, List<Run> runs, string when, CancellationToken token)
        {
            foreach (Node node in nodes)
            {
                Node read = Assert.NotNull(await db.Nodes.ReadAsync(node.Id, token).ConfigureAwait(false), "node " + node.Name);
                Assert.Equal(NodeStatusEnum.Ready, read.Status, node.Name + " status " + when);
            }
            foreach (Run run in runs)
            {
                Run read = Assert.NotNull(await db.Runs.ReadAsync(run.Id, token).ConfigureAwait(false), "run " + run.Id);
                Assert.Equal(RunStatusEnum.Leased, read.Status, "run status " + when);
            }
        }

        private static DateTime Start()
        {
            long ticks = DateTime.UtcNow.Ticks;
            return new DateTime(ticks - (ticks % TimeSpan.TicksPerSecond), DateTimeKind.Utc);
        }

        private static Node NewNode(string name, DateTime heartbeatUtc)
        {
            Node node = new Node();
            node.Name = name;
            node.Status = NodeStatusEnum.Ready;
            node.LastHeartbeatUtc = heartbeatUtc;
            node.RegisteredUtc = heartbeatUtc;
            return node;
        }

        private static ControlNode NewControlNode(string id, DateTime heartbeatUtc)
        {
            ControlNode row = new ControlNode();
            row.Id = id;
            row.Name = id;
            row.Status = ControlNodeStatusEnum.Ready;
            row.StartedUtc = heartbeatUtc.AddHours(-1);
            row.LastHeartbeatUtc = heartbeatUtc;
            return row;
        }

        private static Run NewLeasedRun(Node node, DateTime leasedUtc, DateTime leaseExpiresUtc, DateTime deadlineUtc)
        {
            Run run = new Run();
            run.TenantId = "ten_pause";
            run.AgentId = "agt_pause";
            run.AgentName = "pause";
            run.DeploymentId = "dep_missing";
            run.HarnessType = HarnessTypeEnum.Mux;
            run.Status = RunStatusEnum.Leased;
            run.MaxAttempts = 1;
            run.Attempt = 1;
            run.InputText = "hello";
            run.QueuedUtc = leasedUtc.AddSeconds(-1);
            run.LeasedUtc = leasedUtc;
            run.LeaseNodeId = node.Id;
            run.LeaseNodeName = node.Name;
            run.LeaseEpoch = 1;
            run.LeaseExpiresUtc = leaseExpiresUtc;
            run.DeadlineUtc = deadlineUtc;
            return run;
        }

        private static LoggingModule QuietLogging()
        {
            LoggingModule logging = new LoggingModule();
            logging.Settings.EnableConsole = false;
            return logging;
        }
    }
}
