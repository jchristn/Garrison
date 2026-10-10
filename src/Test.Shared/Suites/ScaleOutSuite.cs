namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Database.Ado;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Serialization;
    using Garrison.Core.Settings;
    using Garrison.Core.Telemetry;
    using Garrison.Server.Backplane;
    using Garrison.Server.Runtime;
    using SyslogLogging;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Phase 10 data-layer guarantees on every provider: exact deployment limits under concurrent claims, tenant-dedicated
    /// pools at claim, shared nonces and rate limits, one migrator, cluster MCP sessions, the polling backplane,
    /// idempotent run creation under races, retention archival, and cleanup of expired shared state.
    /// </summary>
    public static class ScaleOutSuite
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
                string id = "scaleout-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                cases.Add(new TestCaseDescriptor(id, "claim-limit-race", "Concurrent claims from several drivers never exceed a deployment's maxConcurrentRuns (" + provider + ")", ct => ClaimLimitRaceAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "dedicated-pool", "A tenant-dedicated pool's node sees its tenant's run behind a backlog of other tenants' runs, and others never see it (" + provider + ")", ct => DedicatedPoolAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "nonces", "A signed-request nonce is accepted once until it expires (" + provider + ")", ct => NoncesAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "rate-limits", "Rate limit buckets count hits from every driver (" + provider + ")", ct => RateLimitsAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "migrate-once", "Drivers initializing one database together apply each migration exactly once (" + provider + ")", ct => MigrateOnceAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "mcp-sessions", "Cluster MCP sessions read, touch, expire, and delete (" + provider + ")", ct => McpSessionsAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "polling-backplane", "The polling backplane delivers between two instances, not to the sender (" + provider + ")", ct => PollingBackplaneAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "idempotent-create", "Concurrent creates with one idempotency key insert one run (" + provider + ")", ct => IdempotentCreateAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "retention-archive", "Retention archives runs with their events and old events to JSON Lines before deleting them (" + provider + ")", ct => ArchiveAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "control-nodes", "Control node rows upsert, enumerate, count by status, go Offline when silent, and are deleted after the Offline retention (" + provider + ")", ct => ControlNodesAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "shared-state-cleanup", "The leader's cleanup removes expired nonces, buckets, sessions, and old backplane messages (" + provider + ")", ct => CleanupAsync(provider, ct)));
                suites.Add(new TestSuiteDescriptor(id, "Scale-out data layer (" + provider + ")", cases));
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

        private static LoggingModule QuietLogging()
        {
            LoggingModule logging = new LoggingModule();
            logging.Settings.EnableConsole = false;
            return logging;
        }

        private static async Task<List<DatabaseDriverBase>> PeersAsync(DatabaseDriverBase primary, int count, CancellationToken token)
        {
            // Postgresql peers are separate drivers (separate pools, as separate replicas would have). Sqlite runs one
            // control plane, so its peers share the one driver.
            List<DatabaseDriverBase> peers = new List<DatabaseDriverBase>();
            for (int i = 0; i < count; i++)
            {
                if (primary.DatabaseType == DatabaseTypeEnum.Postgresql) peers.Add(await DatabaseDriverFactory.CreateAndInitializeAsync(((AdoDatabaseDriver)primary).Settings.Clone(), token).ConfigureAwait(false));
                else peers.Add(primary);
            }
            return peers;
        }

        private static void DisposePeers(DatabaseDriverBase primary, List<DatabaseDriverBase> peers)
        {
            foreach (DatabaseDriverBase peer in peers.Where(p => !ReferenceEquals(p, primary))) peer.Dispose();
        }

        private static async Task ClaimLimitRaceAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                List<Run> runs = new List<Run>();
                for (int i = 0; i < 12; i++) runs.Add(await db.Runs.CreateAsync(NewRun("ten_a", "dep_limited"), token).ConfigureAwait(false));
                List<DatabaseDriverBase> peers = await PeersAsync(db, 4, token).ConfigureAwait(false);
                try
                {
                    int wins = 0;
                    int limited = 0;
                    List<Task> claimers = new List<Task>();
                    for (int worker = 0; worker < 8; worker++)
                    {
                        DatabaseDriverBase driver = peers[worker % peers.Count];
                        string node = "nod_" + worker;
                        claimers.Add(Task.Run(async () =>
                        {
                            foreach (Run run in runs)
                            {
                                ClaimResult result = await driver.Runs.TryClaimWithinLimitAsync(run.Id, node, node, DateTime.UtcNow.AddSeconds(30), "dep_limited", 3, token).ConfigureAwait(false);
                                if (result.Claimed) Interlocked.Increment(ref wins);
                                if (result.LimitReached) Interlocked.Increment(ref limited);
                            }
                        }, token));
                    }
                    await Task.WhenAll(claimers).ConfigureAwait(false);
                    Assert.Equal(3, wins, "Claims won with maxConcurrentRuns 3");
                    Assert.True(limited > 0, "Some claims should report the limit.");
                    Assert.Equal(3L, await db.Runs.CountActiveByDeploymentAsync("dep_limited", token).ConfigureAwait(false), "Active runs");

                    // Finishing one frees exactly one slot.
                    Run active = (await db.Runs.ListActiveByNodeAsync("nod_0", token).ConfigureAwait(false)).FirstOrDefault()
                        ?? (await Task.WhenAll(Enumerable.Range(1, 7).Select(n => db.Runs.ListActiveByNodeAsync("nod_" + n, token))).ConfigureAwait(false)).SelectMany(l => l).First();
                    Run done = new Run();
                    done.Id = active.Id;
                    done.Status = RunStatusEnum.Succeeded;
                    done.Outcome = RunOutcomeEnum.Succeeded;
                    Assert.True(await db.Runs.CompleteAsync(done, active.LeaseNodeId!, active.LeaseEpoch, token).ConfigureAwait(false), "Complete");
                    int second = 0;
                    foreach (Run run in runs)
                    {
                        ClaimResult result = await db.Runs.TryClaimWithinLimitAsync(run.Id, "nod_x", "nod_x", DateTime.UtcNow.AddSeconds(30), "dep_limited", 3, token).ConfigureAwait(false);
                        if (result.Claimed) second++;
                    }
                    Assert.Equal(1, second, "Claims after one run finished");
                }
                finally
                {
                    DisposePeers(db, peers);
                }
            }
        }

        private static async Task DedicatedPoolAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                NodePool pool = new NodePool();
                pool.Name = "pool-dedicated-" + Guid.NewGuid().ToString("N").Substring(0, 6);
                pool.Tenants = new List<string> { "ten_dedicated" };
                pool = await db.NodePools.CreateAsync(pool, token).ConfigureAwait(false);

                // A backlog of higher-priority runs from another tenant, ahead of the dedicated tenant's run.
                for (int i = 0; i < 30; i++)
                {
                    Run other = NewRun("ten_other", "dep_other");
                    other.Priority = 10;
                    await db.Runs.CreateAsync(other, token).ConfigureAwait(false);
                }
                Run own = await db.Runs.CreateAsync(NewRun("ten_dedicated", "dep_own"), token).ConfigureAwait(false);
                Run pinned = NewRun("ten_other", "dep_pinned");
                pinned.NodePoolId = pool.Id;
                pinned = await db.Runs.CreateAsync(pinned, token).ConfigureAwait(false);

                ClaimCandidateFilter dedicated = new ClaimCandidateFilter();
                dedicated.HarnessTypes = new List<HarnessTypeEnum> { HarnessTypeEnum.Generic };
                dedicated.NodePoolId = pool.Id;
                dedicated.AllowedTenantIds = pool.Tenants;
                dedicated.Limit = 16;
                List<Run> candidates = await db.Runs.ListClaimCandidatesAsync(dedicated, token).ConfigureAwait(false);
                Assert.True(candidates.Any(r => r.Id == own.Id), "The dedicated node must see its tenant's run behind 30 other runs.");
                Assert.True(candidates.All(r => r.TenantId == "ten_dedicated"), "The dedicated node must see only its tenant's runs.");

                Node node = new Node();
                node.Name = "dedicated-node";
                node.NodePoolId = pool.Id;
                Assert.True(PlacementRules.MatchesPlacement(node, pool, own), "Placement allows the dedicated tenant.");
                Assert.True(!PlacementRules.MatchesPlacement(node, pool, pinned), "Placement rejects another tenant's run pinned to the dedicated pool.");

                ClaimCandidateFilter shared = new ClaimCandidateFilter();
                shared.HarnessTypes = new List<HarnessTypeEnum> { HarnessTypeEnum.Generic };
                shared.NodePoolId = null;
                shared.Limit = 500;
                List<Run> unpooled = await db.Runs.ListClaimCandidatesAsync(shared, token).ConfigureAwait(false);
                Assert.True(unpooled.All(r => r.Id != pinned.Id), "A node outside the pool never sees a run pinned to it.");
            }
        }

        private static async Task NoncesAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                List<DatabaseDriverBase> peers = await PeersAsync(db, 1, token).ConfigureAwait(false);
                try
                {
                    string key = "access:" + Guid.NewGuid().ToString("N");
                    Assert.True(await db.Nonces.TryUseAsync(key, DateTime.UtcNow.AddMinutes(10), token).ConfigureAwait(false), "First use");
                    Assert.True(!await peers[0].Nonces.TryUseAsync(key, DateTime.UtcNow.AddMinutes(10), token).ConfigureAwait(false), "Replay through another driver");

                    string expiring = "access:" + Guid.NewGuid().ToString("N");
                    Assert.True(await db.Nonces.TryUseAsync(expiring, DateTime.UtcNow.AddSeconds(-1), token).ConfigureAwait(false), "First use of an expiring nonce");
                    Assert.True(await peers[0].Nonces.TryUseAsync(expiring, DateTime.UtcNow.AddMinutes(10), token).ConfigureAwait(false), "An expired nonce may be used again");

                    int concurrentWins = 0;
                    string raced = "access:" + Guid.NewGuid().ToString("N");
                    await Task.WhenAll(Enumerable.Range(0, 8).Select(i => Task.Run(async () =>
                    {
                        if (await (i % 2 == 0 ? db : peers[0]).Nonces.TryUseAsync(raced, DateTime.UtcNow.AddMinutes(10), token).ConfigureAwait(false)) Interlocked.Increment(ref concurrentWins);
                    }, token))).ConfigureAwait(false);
                    Assert.Equal(1, concurrentWins, "Concurrent uses of one nonce accepted");
                }
                finally
                {
                    DisposePeers(db, peers);
                }
            }
        }

        private static async Task RateLimitsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                List<DatabaseDriverBase> peers = await PeersAsync(db, 1, token).ConfigureAwait(false);
                try
                {
                    string bucket = "token|127.0.0.1|" + Guid.NewGuid().ToString("N");
                    await Task.WhenAll(Enumerable.Range(0, 10).Select(i => (i % 2 == 0 ? db : peers[0]).RateLimits.IncrementAsync(bucket, DateTime.UtcNow.AddMinutes(2), token))).ConfigureAwait(false);
                    Assert.Equal(11, await db.RateLimits.IncrementAsync(bucket, DateTime.UtcNow.AddMinutes(2), token).ConfigureAwait(false), "Hits after ten concurrent increments and one more");
                }
                finally
                {
                    DisposePeers(db, peers);
                }
            }
        }

        private static async Task MigrateOnceAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            DatabaseSettings settings = TestEnvironment.IsolatedSettings(provider);
            List<DatabaseDriverBase> drivers = new List<DatabaseDriverBase>();
            for (int i = 0; i < 3; i++) drivers.Add(DatabaseDriverFactory.Create(settings.Clone()));
            try
            {
                await Task.WhenAll(drivers.Select(d => Task.Run(() => d.InitializeAsync(token), token))).ConfigureAwait(false);
                int latest = SchemaBuilder.LatestVersion;
                Assert.Equal(latest, drivers.Sum(d => d.MigrationsApplied), "Migrations applied across drivers");
                Assert.Equal(1, drivers.Count(d => d.MigrationsApplied > 0), "Drivers that applied migrations");
                foreach (DatabaseDriverBase driver in drivers)
                {
                    Assert.Equal(latest, driver.SchemaVersion, "Schema version seen by every driver");
                    Assert.Equal(latest, await driver.ReadSchemaVersionAsync(token).ConfigureAwait(false), "Schema version in the database");
                }
            }
            finally
            {
                foreach (DatabaseDriverBase driver in drivers) driver.Dispose();
            }
        }

        private static async Task McpSessionsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                DateTime now = DateTime.UtcNow;
                McpSession session = new McpSession();
                session.Principal = "Administrator:admin";
                session.ProtocolVersion = "2025-06-18";
                session.ClientName = "test-client";
                session.ClientVersion = "1.0";
                session.ExpiresUtc = now.AddMinutes(5);
                await db.McpSessions.CreateAsync(session, token).ConfigureAwait(false);

                McpSession read = Assert.NotNull(await db.McpSessions.ReadActiveAsync(session.Id, now, token).ConfigureAwait(false), "Session");
                Assert.Equal("2025-06-18", read.ProtocolVersion, "Protocol version");
                Assert.Equal("test-client", read.ClientName, "Client name");
                Assert.True(await db.McpSessions.TouchAsync(session.Id, now, now.AddMinutes(10), token).ConfigureAwait(false), "Touch a live session");
                Assert.True(await db.McpSessions.ReadActiveAsync(session.Id, now.AddMinutes(11), token).ConfigureAwait(false) == null, "Expired sessions are not read");
                Assert.True(!await db.McpSessions.TouchAsync(session.Id, now.AddMinutes(11), now.AddMinutes(20), token).ConfigureAwait(false), "Expired sessions are not revived");
                Assert.True(await db.McpSessions.DeleteAsync(session.Id, token).ConfigureAwait(false), "Delete");
                Assert.True(await db.McpSessions.ReadActiveAsync(session.Id, now, token).ConfigureAwait(false) == null, "Deleted sessions are gone");
            }
        }

        private static async Task PollingBackplaneAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                List<DatabaseDriverBase> peers = await PeersAsync(db, 1, token).ConfigureAwait(false);
                using (PollingBackplane first = new PollingBackplane(db, "first", QuietLogging()))
                using (PollingBackplane second = new PollingBackplane(peers[0], "second", QuietLogging()))
                {
                    try
                    {
                        first.PollMs = 50;
                        second.PollMs = 50;
                        List<BackplaneMessage> atFirst = new List<BackplaneMessage>();
                        List<BackplaneMessage> atSecond = new List<BackplaneMessage>();
                        first.MessageReceived += (s, m) => { lock (atFirst) atFirst.Add(m); };
                        second.MessageReceived += (s, m) => { lock (atSecond) atSecond.Add(m); };
                        await first.StartAsync(token).ConfigureAwait(false);
                        await second.StartAsync(token).ConfigureAwait(false);

                        DateTime sent = DateTime.UtcNow;
                        first.Publish(new BackplaneMessage(BackplaneMessageKindEnum.RunChanged, "run_1"));
                        first.Publish(new BackplaneMessage(BackplaneMessageKindEnum.RunChanged, "run_1"));
                        first.Publish(new BackplaneMessage(BackplaneMessageKindEnum.QueueChanged, null));
                        second.Publish(new BackplaneMessage(BackplaneMessageKindEnum.SettingsChanged, "Runs.RetentionDays"));

                        DateTime deadline = DateTime.UtcNow.AddSeconds(5);
                        while (DateTime.UtcNow < deadline)
                        {
                            bool done;
                            lock (atSecond)
                            {
                                lock (atFirst)
                                {
                                    done = atSecond.Count >= 2 && atFirst.Count >= 1;
                                }
                            }
                            if (done) break;
                            await Task.Delay(20, token).ConfigureAwait(false);
                        }
                        await Task.Delay(300, token).ConfigureAwait(false);
                        lock (atSecond)
                        {
                            Assert.Equal(2, atSecond.Count, "Messages at the second instance (duplicates coalesced): " + String.Join(", ", atSecond.Select(m => m.Kind + ":" + m.Subject)));
                            Assert.True(atSecond.Any(m => m.Kind == BackplaneMessageKindEnum.RunChanged && m.Subject == "run_1"), "RunChanged delivered");
                            Assert.True(atSecond.Any(m => m.Kind == BackplaneMessageKindEnum.QueueChanged), "QueueChanged delivered");
                        }
                        lock (atFirst)
                        {
                            Assert.Equal(1, atFirst.Count, "Messages at the first instance (its own are not delivered)");
                            Assert.Equal(BackplaneMessageKindEnum.SettingsChanged, atFirst[0].Kind, "Kind");
                        }
                        Assert.True((DateTime.UtcNow - sent).TotalSeconds < 5, "Delivery took too long.");
                    }
                    finally
                    {
                        await first.StopAsync(token).ConfigureAwait(false);
                        await second.StopAsync(token).ConfigureAwait(false);
                        DisposePeers(db, peers);
                    }
                }
            }
        }

        private static async Task IdempotentCreateAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                List<DatabaseDriverBase> peers = await PeersAsync(db, 3, token).ConfigureAwait(false);
                try
                {
                    string key = "retry-" + Guid.NewGuid().ToString("N");
                    Run[] created = await Task.WhenAll(Enumerable.Range(0, 6).Select(i => Task.Run(async () =>
                    {
                        Run run = NewRun("ten_a", "dep_a");
                        run.IdempotencyKey = key;
                        return await peers[i % peers.Count].Runs.CreateAsync(run, token).ConfigureAwait(false);
                    }, token))).ConfigureAwait(false);
                    Assert.Equal(1, created.Select(r => r.Id).Distinct().Count(), "Distinct runs for one idempotency key");

                    RunFilter filter = new RunFilter();
                    filter.TenantId = "ten_a";
                    filter.MaxResults = 100;
                    Assert.Equal(1L, (await db.Runs.EnumerateAsync(filter, token).ConfigureAwait(false)).TotalRecords, "Rows inserted");
                }
                finally
                {
                    DisposePeers(db, peers);
                }
            }
        }

        private static async Task ArchiveAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                Run old = NewRun("ten_a", "dep_a");
                old.Parameters.Add(new RunParameter { Name = "colour", Value = "blue" });
                old = await db.Runs.CreateAsync(old, token).ConfigureAwait(false);
                long epoch = (await db.Runs.TryClaimAsync(old.Id, "nod_1", "w1", DateTime.UtcNow.AddSeconds(30), token).ConfigureAwait(false)) ?? throw new TestAssertionException("Claim failed.");
                List<RunEvent> events = new List<RunEvent>();
                for (int i = 1; i <= 3; i++) events.Add(new RunEvent { TenantId = "ten_a", RunId = old.Id, Sequence = i, EventType = RunEventTypeEnum.Warning, Text = "line " + i });
                await db.RunEvents.InsertBatchAsync(events, token).ConfigureAwait(false);
                Run finished = new Run();
                finished.Id = old.Id;
                finished.Status = RunStatusEnum.Succeeded;
                finished.Outcome = RunOutcomeEnum.Succeeded;
                finished.CompletedUtc = DateTime.UtcNow.AddDays(-40);
                Assert.True(await db.Runs.CompleteAsync(finished, "nod_1", epoch, token).ConfigureAwait(false), "Complete");

                Run kept = await db.Runs.CreateAsync(NewRun("ten_a", "dep_a"), token).ConfigureAwait(false);
                await db.RunEvents.InsertBatchAsync(new List<RunEvent> { new RunEvent { TenantId = "ten_a", RunId = kept.Id, Sequence = 1, EventType = RunEventTypeEnum.Warning, Text = "recent" } }, token).ConfigureAwait(false);

                string directory = Path.Combine(Path.GetTempPath(), "garrison-test-archive", Guid.NewGuid().ToString("N"));
                try
                {
                    using (GarrisonTelemetry telemetry = new GarrisonTelemetry(new TelemetrySettings { Enabled = false }, "test", null))
                    using (MaintenanceService maintenance = new MaintenanceService(db, new FixedLeader(), new RunSignals(), new RuntimeOptions(), telemetry, QuietLogging()))
                    {
                        maintenance.Archiver = new RunArchiver(db, directory, QuietLogging());
                        maintenance.RunRetentionDays = () => 30;
                        maintenance.EventRetentionDays = () => 14;
                        int removed = await maintenance.ApplyRetentionAsync(token).ConfigureAwait(false);
                        Assert.Equal(1, removed, "Runs and events removed (the old run and its events go together)");
                    }

                    Assert.True(await db.Runs.ReadAsync(old.Id, token).ConfigureAwait(false) == null, "The old run is deleted");
                    Assert.Equal(0, (await db.RunEvents.ListAfterAsync(old.Id, 0, 100, token).ConfigureAwait(false)).Count, "The old run's events are deleted");
                    Assert.Equal(1, (await db.RunEvents.ListAfterAsync(kept.Id, 0, 100, token).ConfigureAwait(false)).Count, "Recent events are kept");

                    string[] files = Directory.GetFiles(directory, "garrison-runs-*.jsonl");
                    Assert.Equal(1, files.Length, "Run archive files");
                    string[] lines = File.ReadAllLines(files[0]).Where(l => l.Length > 0).ToArray();
                    Assert.Equal(1, lines.Length, "Archived runs");
                    ArchivedRun archived = Serializer.Deserialize<ArchivedRun>(lines[0]) ?? throw new TestAssertionException("Unreadable archive line.");
                    Assert.Equal(old.Id, archived.Run.Id, "Archived run");
                    Assert.Equal(3, archived.Events.Count, "Archived events");
                    Assert.Equal("blue", archived.Run.Parameters.Single().Value, "Archived parameters");
                }
                finally
                {
                    if (Directory.Exists(directory)) Directory.Delete(directory, true);
                }
            }
        }

        private static async Task CleanupAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                DateTime now = DateTime.UtcNow;
                await db.Nonces.TryUseAsync("expired-nonce", now.AddMinutes(-1), token).ConfigureAwait(false);
                await db.Nonces.TryUseAsync("live-nonce", now.AddMinutes(10), token).ConfigureAwait(false);
                await db.RateLimits.IncrementAsync("expired-bucket", now.AddMinutes(-1), token).ConfigureAwait(false);
                McpSession expired = new McpSession();
                expired.Principal = "User:usr_1";
                expired.ProtocolVersion = "2025-06-18";
                expired.ExpiresUtc = now.AddMinutes(-1);
                await db.McpSessions.CreateAsync(expired, token).ConfigureAwait(false);
                BackplaneMessage stale = new BackplaneMessage(BackplaneMessageKindEnum.QueueChanged, null);
                stale.Origin = "old";
                stale.CreatedUtc = now.AddHours(-1);
                await db.BackplaneMessages.InsertAsync(new List<BackplaneMessage> { stale }, token).ConfigureAwait(false);

                using (GarrisonTelemetry telemetry = new GarrisonTelemetry(new TelemetrySettings { Enabled = false }, "test", null))
                using (MaintenanceService maintenance = new MaintenanceService(db, new FixedLeader(), new RunSignals(), new RuntimeOptions(), telemetry, QuietLogging()))
                {
                    int removed = await maintenance.CleanupSharedStateAsync(token).ConfigureAwait(false);
                    Assert.Equal(4, removed, "Expired rows removed");
                }
                Assert.True(!await db.Nonces.TryUseAsync("live-nonce", now.AddMinutes(10), token).ConfigureAwait(false), "Live nonces survive cleanup");
                Assert.Equal(0, (await db.BackplaneMessages.ListAfterAsync(0, 10, token).ConfigureAwait(false)).Count, "Old backplane messages removed");
            }
        }

        private static ControlNode NewControlNode(string id, ControlNodeStatusEnum status, DateTime heartbeatUtc)
        {
            ControlNode node = new ControlNode();
            node.Id = id;
            node.Name = id;
            node.Hostname = "host-" + id;
            node.Address = "127.0.0.1:8700";
            node.Version = "0.1.0-alpha";
            node.SchemaVersion = SchemaBuilder.LatestVersion;
            node.Backplane = "Local";
            node.Status = status;
            node.StartedUtc = heartbeatUtc.AddMinutes(-5);
            node.LastHeartbeatUtc = heartbeatUtc;
            node.ActiveRequests = 3;
            node.OpenStreams = 2;
            node.HeldLongPolls = 1;
            return node;
        }

        private static async Task ControlNodesAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                DateTime now = DateTime.UtcNow;
                await db.ControlNodes.UpsertAsync(NewControlNode("cn-live", ControlNodeStatusEnum.Starting, now), token).ConfigureAwait(false);
                ControlNode live = NewControlNode("cn-live", ControlNodeStatusEnum.Ready, now);
                live.ActiveRequests = 7;
                await db.ControlNodes.UpsertAsync(live, token).ConfigureAwait(false);
                await db.ControlNodes.UpsertAsync(NewControlNode("cn-silent", ControlNodeStatusEnum.Ready, now.AddMinutes(-2)), token).ConfigureAwait(false);
                await db.ControlNodes.UpsertAsync(NewControlNode("cn-gone", ControlNodeStatusEnum.Offline, now.AddHours(-30)), token).ConfigureAwait(false);
                await db.ControlNodes.UpsertAsync(NewControlNode("cn-draining", ControlNodeStatusEnum.Ready, now), token).ConfigureAwait(false);
                Assert.True(await db.ControlNodes.SetStatusAsync("cn-draining", ControlNodeStatusEnum.Draining, now, token).ConfigureAwait(false), "Set status");

                ControlNode read = Assert.NotNull(await db.ControlNodes.ReadAsync("cn-live", token).ConfigureAwait(false), "Live control node");
                Assert.Equal(ControlNodeStatusEnum.Ready, read.Status, "Upsert replaces the status");
                Assert.Equal(7, read.ActiveRequests, "Upsert replaces the activity");
                Assert.Equal(2, read.OpenStreams, "Open streams");
                Assert.Equal(1, read.HeldLongPolls, "Held long polls");
                Assert.Equal("host-cn-live", read.Hostname ?? String.Empty, "Hostname");
                Assert.Equal(SchemaBuilder.LatestVersion, read.SchemaVersion, "Schema version");
                Assert.Equal(DateTimeKind.Utc, read.LastHeartbeatUtc.Kind, "Heartbeat kind");
                Assert.True(Math.Abs((read.LastHeartbeatUtc - now).TotalSeconds) < 1, "Heartbeat round-trips");

                Garrison.Core.Enumeration.EnumerationQuery query = new Garrison.Core.Enumeration.EnumerationQuery();
                query.Ordering = EnumerationOrderEnum.NameAscending;
                Garrison.Core.Enumeration.EnumerationResult<ControlNode> page = await db.ControlNodes.EnumerateAsync(query, token).ConfigureAwait(false);
                Assert.Equal(4L, page.TotalRecords, "Total control nodes");
                Assert.Equal("cn-draining,cn-gone,cn-live,cn-silent", String.Join(",", page.Objects.Select(n => n.Id)), "Name ordering");
                query.Search = "SILENT";
                Assert.Equal(1L, (await db.ControlNodes.EnumerateAsync(query, token).ConfigureAwait(false)).TotalRecords, "Search by name");

                List<string> marked = await db.ControlNodes.MarkSilentOfflineAsync(now.AddSeconds(-30), token).ConfigureAwait(false);
                Assert.Equal("cn-silent", String.Join(",", marked), "Only the silent row goes Offline");
                ControlNode silent = Assert.NotNull(await db.ControlNodes.ReadAsync("cn-silent", token).ConfigureAwait(false), "Silent control node");
                Assert.Equal(ControlNodeStatusEnum.Offline, silent.Status, "Silent row status");
                Assert.Equal(0, silent.ActiveRequests + silent.OpenStreams + silent.HeldLongPolls, "An Offline row reports no activity");

                Dictionary<string, long> counts = (await db.ControlNodes.CountByStatusAsync(token).ConfigureAwait(false)).ToDictionary(c => c.Status, c => c.Count);
                Assert.Equal(1L, counts["Ready"], "Ready count");
                Assert.Equal(1L, counts["Draining"], "Draining count");
                Assert.Equal(2L, counts["Offline"], "Offline count");

                // The leader's cleanup deletes rows Offline for longer than the retention (24 hours by default) only.
                using (GarrisonTelemetry telemetry = new GarrisonTelemetry(new TelemetrySettings { Enabled = false }, "test", null))
                using (MaintenanceService maintenance = new MaintenanceService(db, new FixedLeader(), new RunSignals(), new RuntimeOptions(), telemetry, QuietLogging()))
                {
                    await maintenance.CleanupSharedStateAsync(token).ConfigureAwait(false);
                }
                Assert.True(await db.ControlNodes.ReadAsync("cn-gone", token).ConfigureAwait(false) == null, "A row Offline for 30 hours is deleted");
                Assert.True(await db.ControlNodes.ReadAsync("cn-silent", token).ConfigureAwait(false) != null, "A row Offline for 2 minutes is kept");
                Assert.True(await db.ControlNodes.DeleteAsync("cn-silent", token).ConfigureAwait(false), "Delete");
            }
        }
    }
}
