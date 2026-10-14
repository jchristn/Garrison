namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Concurrent;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Linq;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Protocol;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Serialization;
    using Garrison.Server.Backplane;
    using Garrison.Server.Runtime;
    using Garrison.Server.Services;
    using Garrison.Worker.Hosting;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Control-plane tuning (P10.24): a queued run wakes one lease long poll that could take it instead of every poll,
    /// with handoff and no lost wakeups across replicas; concurrent claims never claim a run twice; and the
    /// authentication cache drops revoked, deactivated, deleted, and re-roled principals at once on every replica, with
    /// Auth.CacheSeconds as the bound for changes made outside the API. Postgresql runs two replicas, Sqlite one.
    /// </summary>
    public static class ControlPlaneTuningSuite
    {
        #region Public-Methods

        /// <summary>
        /// Build the suites.
        /// </summary>
        /// <returns>Suites.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            List<TestSuiteDescriptor> suites = new List<TestSuiteDescriptor>();

            List<TestCaseDescriptor> unit = new List<TestCaseDescriptor>();
            unit.Add(new TestCaseDescriptor("lease-waiters", "one-matching-poll", "A notice wakes one sleeping poll that could take the run (harness, node pool, child reserve), the one asleep longest", ct => OneMatchingPollAsync(ct)));
            unit.Add(new TestCaseDescriptor("lease-waiters", "notice-during-scan", "A notice that arrives while every matching poll is looking for work makes one of them look again instead of sleeping", ct => NoticeDuringScanAsync(ct)));
            unit.Add(new TestCaseDescriptor("lease-waiters", "handoff-and-unregister", "A poll that ends with a notice it did not handle hands it to the next matching poll; a chain ends once every poll tried", ct => HandoffAndUnregisterAsync(ct)));
            unit.Add(new TestCaseDescriptor("lease-waiters", "deferred-remote", "A notice held for another replica's poll is dropped when the run is claimed and delivered after the hold otherwise; an exhausted origin republishes once", ct => DeferredRemoteAsync(ct)));
            unit.Add(new TestCaseDescriptor("lease-waiters", "subjects", "Notices round-trip through the backplane subject; a message without one, or a resynchronization, wakes every poll", ct => SubjectsAsync(ct)));
            suites.Add(new TestSuiteDescriptor("lease-waiters", "Targeted lease wakeups (P10.24)", unit));

            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "tuning-" + provider.ToString().ToLowerInvariant();
                string suffix = " (" + provider + ")";
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                cases.Add(new TestCaseDescriptor(id, "wakeup-targeted", "Ten idle polls" + (provider == DatabaseTypeEnum.Postgresql ? " on two replicas" : String.Empty) + ": each queued run is claimed promptly and wakes at most one poll per replica; QueueWakeFanout 0 wakes every poll" + suffix, ct => WakeupTargetedAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "wakeup-handoff", "Polls that cannot take a run (missing node label) hand it on until one that can claims it, well before the fallback poll" + (provider == DatabaseTypeEnum.Postgresql ? ", across replicas despite a long remote hold" : String.Empty) + suffix, ct => WakeupHandoffAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "claim-contention", "Forty runs queued at once and sixteen polls claiming concurrently: every run is claimed exactly once (epoch 1, one node)" + suffix, ct => ClaimContentionAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "worker-lease-batch", "A worker with four free slots takes four queued runs in one lease request; MaxLeaseBatch 1 restores one run per request" + suffix, ct => WorkerLeaseBatchAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "auth-cache-invalidation", "With Auth.CacheSeconds 60, a revoked token, a deactivated user, a deleted credential, role and tenant-admin changes, and a deactivated tenant take effect within 2 seconds" + (provider == DatabaseTypeEnum.Postgresql ? " on the other replica" : String.Empty) + suffix, ct => AuthCacheInvalidationAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "auth-cache-ttl", "Requests are answered from the authentication cache, and a change made outside the API takes effect within Auth.CacheSeconds" + suffix, ct => AuthCacheTtlAsync(provider, ct)));
                suites.Add(new TestSuiteDescriptor(id, "Control-plane tuning (P10.24)" + suffix, cases));
            }
            return suites;
        }

        #endregion

        #region Private-Methods

        private static int ReplicaCount(DatabaseTypeEnum provider)
        {
            return provider == DatabaseTypeEnum.Postgresql ? 2 : 1;
        }

        private static async Task<TestReplicaCluster> StartAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            TestReplicaCluster cluster = await TestReplicaCluster.StartAsync(provider, ReplicaCount(provider), BackplaneModeEnum.Auto, null, token).ConfigureAwait(false);
            foreach (TestServerHost replica in cluster.Replicas)
            {
                // The fallback poll is far off, so a prompt claim proves a notice woke the poll. Fake nodes never
                // heartbeat and never run their runs, so neither may expire during the test.
                RuntimeOptions options = replica.Server.Context.Get<RuntimeOptions>();
                options.LeasePollMs = 10000;
                options.NodeHeartbeatTimeoutMs = 600000;
                options.LeaseDurationMs = 600000;
            }
            return cluster;
        }

        private static async Task<Node> NodeAsync(TestServerHost host, string name, string? labelKey, string? labelValue, CancellationToken token)
        {
            Node node = new Node();
            node.Name = name + "-" + Guid.NewGuid().ToString("N").Substring(0, 6);
            node.Status = NodeStatusEnum.Ready;
            node.MaxConcurrentRuns = 8;
            node.LastHeartbeatUtc = DateTime.UtcNow;
            node.Capabilities.Add(new NodeCapability { HarnessType = HarnessTypeEnum.Generic, Available = true });
            if (labelKey != null) node.Labels.Add(new NodeLabel { Key = labelKey, Value = labelValue ?? String.Empty });
            return await host.Server.Context.Database.Nodes.CreateAsync(node, token).ConfigureAwait(false);
        }

        private static async Task PollLoopAsync(SchedulerService scheduler, Node node, ConcurrentDictionary<string, string> claims, ConcurrentBag<string> duplicates, CancellationToken stop)
        {
            while (!stop.IsCancellationRequested)
            {
                NodeLeaseRequest request = new NodeLeaseRequest();
                request.NodeId = node.Id;
                request.MaxRuns = 1;
                request.WaitMs = 20000;
                NodeLeaseResponse response;
                try
                {
                    response = await scheduler.LeaseAsync(node, request, stop).ConfigureAwait(false);
                }
                catch (OperationCanceledException) when (stop.IsCancellationRequested)
                {
                    return;
                }
                foreach (RunAssignment assignment in response.Assignments)
                {
                    if (!claims.TryAdd(assignment.RunId, node.Id)) duplicates.Add(assignment.RunId);
                }
            }
        }

        private static async Task StopPollersAsync(CancellationTokenSource stop, List<Task> loops)
        {
            stop.Cancel();
            try
            {
                await Task.WhenAll(loops).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
            }
        }

        private static SchedulerService Scheduler(TestReplicaCluster cluster, int replica)
        {
            return cluster.Replicas[replica].Server.Context.Get<SchedulerService>();
        }

        private static LeaseWaiters Waiters(TestServerHost replica)
        {
            return replica.Server.Context.Get<RunSignals>().Waiters;
        }

        private static int Sleeping(TestReplicaCluster cluster)
        {
            return cluster.Replicas.Sum(r => Waiters(r).SleepingCount);
        }

        private static int Deferred(TestReplicaCluster cluster)
        {
            return cluster.Replicas.Sum(r => Waiters(r).DeferredCount);
        }

        private static long Wakeups(TestReplicaCluster cluster)
        {
            return cluster.Replicas.Sum(r => Waiters(r).Wakeups);
        }

        private static double LostClaims(MetricCapture capture)
        {
            return capture.Of("garrison.claims").Where(m => m.Tag("result") == "lost").Sum(m => m.Value);
        }

        private static async Task WaitForAsync(Func<bool> condition, int timeoutMs, string what, CancellationToken token)
        {
            Stopwatch timer = Stopwatch.StartNew();
            while (!condition())
            {
                if (timer.ElapsedMilliseconds > timeoutMs) throw new TestAssertionException("Timed out after " + timeoutMs + " ms waiting for " + what + ".");
                await Task.Delay(10, token).ConfigureAwait(false);
            }
        }

        private static async Task<Run> InvokeAsync(TestServerHost replica, string tenantId, Agent agent, string input, CancellationToken token)
        {
            InvokeRequest request = new InvokeRequest();
            request.Input = input;
            request.Wait = false;
            TestResponse response = await HttpTestHelpers.SendAsync(replica.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + tenantId + "/agents/" + agent.Id + "/invoke", request, token).ConfigureAwait(false);
            if (response.StatusCode != 200 && response.StatusCode != 202) throw new TestAssertionException("Invoke returned " + response.StatusCode + ": " + response.Body);
            return Serializer.Deserialize<Run>(response.Body) ?? throw new TestAssertionException("Empty run.");
        }

        private static Task OneMatchingPollAsync(CancellationToken token)
        {
            using (LeaseWaiters waiters = new LeaseWaiters())
            {
                LeaseWaiter first = waiters.Register("node-a", null, new[] { HarnessTypeEnum.Generic }, false);
                LeaseWaiter second = waiters.Register("node-b", null, new[] { HarnessTypeEnum.Generic }, false);
                LeaseWaiter otherHarness = waiters.Register("node-c", null, new[] { HarnessTypeEnum.ClaudeCode }, false);
                LeaseWaiter otherPool = waiters.Register("node-d", "pool-x", new[] { HarnessTypeEnum.Generic }, false);
                LeaseWaiter reserve = waiters.Register("node-e", null, new[] { HarnessTypeEnum.Generic }, true);
                Task<LeaseWakeEnum> waitFirst = waiters.WaitAsync(first, 5000, token);
                Task<LeaseWakeEnum> waitSecond = waiters.WaitAsync(second, 5000, token);
                Task<LeaseWakeEnum> waitHarness = waiters.WaitAsync(otherHarness, 5000, token);
                Task<LeaseWakeEnum> waitPool = waiters.WaitAsync(otherPool, 5000, token);
                Task<LeaseWakeEnum> waitReserve = waiters.WaitAsync(reserve, 5000, token);
                Assert.Equal(5, waiters.SleepingCount, "Sleeping polls");

                // A run pinned to pool-x only matches node-d.
                Assert.True(waiters.Deliver(new QueueNotice("run-pinned", HarnessTypeEnum.Generic, "pool-x", false)), "Pinned run handled");
                Assert.True(waitPool.Wait(2000), "The pool's poll woke");
                Assert.Equal(LeaseWakeEnum.Notify, waitPool.Result, "Wake reason");
                Assert.True(waiters.TakeCurrent(otherPool)?.RunId == "run-pinned", "The pool's poll holds the notice");

                // An unpinned top-level run wakes exactly one poll: the one asleep longest, never the child reserve.
                Assert.True(waiters.Deliver(new QueueNotice("run-1", HarnessTypeEnum.Generic, null, false)), "Run handled");
                Assert.True(waitFirst.Wait(2000), "The poll asleep longest woke");
                Assert.True(!waitSecond.IsCompleted && !waitHarness.IsCompleted && !waitReserve.IsCompleted, "Only one poll woke");
                Assert.Equal(2L, waiters.Wakeups, "Wakeups so far");

                // A delegated run may go to the child reserve once no regular poll sleeps.
                Assert.True(waiters.Deliver(new QueueNotice("run-2", HarnessTypeEnum.Generic, null, true)), "Delegated run handled");
                Assert.True(waitSecond.Wait(2000), "The regular poll woke before the reserve");
                Assert.True(waiters.Deliver(new QueueNotice("run-3", HarnessTypeEnum.Generic, null, true)), "Second delegated run handled");
                Assert.True(waitReserve.Wait(2000), "The reserve poll woke for a delegated run");
                Assert.True(!waitHarness.IsCompleted, "The poll of another harness slept on");
                Assert.True(!waiters.Deliver(new QueueNotice("run-4", HarnessTypeEnum.Codex, null, false)), "No poll here can take a Codex run");

                // The affinity node's poll is woken first.
                LeaseWaiter older = waiters.Register("node-f", null, new[] { HarnessTypeEnum.ClaudeCode }, false);
                Task<LeaseWakeEnum> waitOlder = waiters.WaitAsync(older, 5000, token);
                QueueNotice turn = new QueueNotice("run-5", HarnessTypeEnum.ClaudeCode, null, false);
                turn.AffinityNodeId = "node-f";
                waiters.Deliver(turn);
                Assert.True(waitOlder.Wait(2000), "The affinity node's poll woke");
                Assert.True(!waitHarness.IsCompleted, "The poll asleep longer slept on");
                waiters.WakeAll();
                Assert.True(waitHarness.Wait(2000), "WakeAll woke the rest");
                Assert.Equal(LeaseWakeEnum.Broadcast, waitHarness.Result, "Broadcast reason");
            }
            return Task.CompletedTask;
        }

        private static async Task NoticeDuringScanAsync(CancellationToken token)
        {
            using (LeaseWaiters waiters = new LeaseWaiters())
            {
                // Registered and looking for work, not asleep: the notice is kept, and the next wait returns at once.
                LeaseWaiter scanning = waiters.Register("node-a", null, new[] { HarnessTypeEnum.Generic }, false);
                Assert.True(waiters.Deliver(new QueueNotice("run-1", HarnessTypeEnum.Generic, null, false)), "Kept for a poll that is looking");
                Assert.Equal(1, waiters.PendingCount, "Kept notices");
                Stopwatch timer = Stopwatch.StartNew();
                LeaseWakeEnum woke = await waiters.WaitAsync(scanning, 5000, token).ConfigureAwait(false);
                Assert.Equal(LeaseWakeEnum.Pending, woke, "The poll looks again");
                Assert.True(timer.ElapsedMilliseconds < 1000, "It did not sleep (" + timer.ElapsedMilliseconds + " ms)");
                Assert.True(waiters.TakeCurrent(scanning)?.RunId == "run-1", "It holds the notice");

                // A claim elsewhere drops a kept notice.
                waiters.Deliver(new QueueNotice("run-2", HarnessTypeEnum.Generic, null, false));
                waiters.Settle("run-2");
                Assert.Equal(0, waiters.PendingCount, "Kept notices after the claim");
                Assert.Equal(LeaseWakeEnum.Poll, await waiters.WaitAsync(scanning, 100, token).ConfigureAwait(false), "Nothing left to look for");
                waiters.Unregister(scanning);

                // No registered poll: nothing is kept, since a later poll reads the committed run anyway.
                Assert.True(!waiters.Deliver(new QueueNotice("run-3", HarnessTypeEnum.Generic, null, false)), "No poll here");
                Assert.Equal(0, waiters.PendingCount, "Nothing kept without a poll");
            }
        }

        private static Task HandoffAndUnregisterAsync(CancellationToken token)
        {
            using (LeaseWaiters waiters = new LeaseWaiters())
            {
                LeaseWaiter a = waiters.Register("node-a", null, new[] { HarnessTypeEnum.Generic }, false);
                LeaseWaiter b = waiters.Register("node-b", null, new[] { HarnessTypeEnum.Generic }, false);
                LeaseWaiter c = waiters.Register("node-c", null, new[] { HarnessTypeEnum.Generic }, false);
                Task<LeaseWakeEnum> waitA = waiters.WaitAsync(a, 5000, token);
                Task<LeaseWakeEnum> waitB = waiters.WaitAsync(b, 5000, token);
                Task<LeaseWakeEnum> waitC = waiters.WaitAsync(c, 5000, token);

                QueueNotice notice = new QueueNotice("run-1", HarnessTypeEnum.Generic, null, false);
                waiters.Deliver(notice);
                Assert.True(waitA.Wait(2000), "A woke");

                // A's request ends before it handled the notice (a disconnect): B gets it.
                waiters.Unregister(a);
                Assert.True(waitB.Wait(2000), "B woke when A went away");
                Assert.Equal(LeaseWakeEnum.Handoff, waitB.Result, "Handoff reason");

                // B could not take the run: C gets it, and after C nobody does.
                QueueNotice? held = waiters.TakeCurrent(b);
                Assert.True(held != null && ReferenceEquals(held, notice), "B holds the notice");
                waiters.Redeliver(held!, b);
                Assert.True(waitC.Wait(2000), "C woke");
                QueueNotice? last = waiters.TakeCurrent(c);
                Task<LeaseWakeEnum> sleepB = waiters.WaitAsync(b, 300, token);
                waiters.Redeliver(last!, c);
                Assert.Equal(LeaseWakeEnum.Poll, sleepB.Result, "B, which already tried the run, is not woken again");
                Assert.Equal(3, notice.Deliveries, "Every poll had the notice once");
            }
            return Task.CompletedTask;
        }

        private static Task DeferredRemoteAsync(CancellationToken token)
        {
            using (LeaseWaiters waiters = new LeaseWaiters())
            {
                waiters.RemoteDelayMs = 200;
                LeaseWaiter remote = waiters.Register("node-r", null, new[] { HarnessTypeEnum.Generic }, false);
                Task<LeaseWakeEnum> wait = waiters.WaitAsync(remote, 5000, token);

                QueueNotice claimed = new QueueNotice("run-claimed", HarnessTypeEnum.Generic, null, false);
                claimed.RemoteDeferred = true;
                waiters.Defer(claimed);
                Assert.Equal(1, waiters.DeferredCount, "Held");
                waiters.Settle("run-claimed");
                Assert.Equal(0, waiters.DeferredCount, "Dropped when claimed");
                Assert.True(!wait.Wait(500), "Not woken for a claimed run");

                QueueNotice unclaimed = new QueueNotice("run-open", HarnessTypeEnum.Generic, null, false);
                unclaimed.RemoteDeferred = true;
                Stopwatch timer = Stopwatch.StartNew();
                waiters.Defer(unclaimed);
                Assert.True(wait.Wait(3000), "Woken after the hold");
                Assert.True(timer.ElapsedMilliseconds >= 150, "Held about RemoteDelayMs (" + timer.ElapsedMilliseconds + " ms)");
                Assert.True(waiters.TakeCurrent(remote)?.RunId == "run-open", "The remote poll holds the notice");

                // The origin side: once every local poll tried a run whose wakeup other replicas hold, it republishes once.
                List<QueueNotice> republished = new List<QueueNotice>();
                waiters.Republish = n => republished.Add(n);
                LeaseWaiter local = waiters.Register("node-l", null, new[] { HarnessTypeEnum.Generic }, false);
                QueueNotice origin = new QueueNotice("run-origin", HarnessTypeEnum.Generic, null, false);
                origin.LocalOrigin = true;
                origin.RemoteDeferred = true;
                waiters.Unregister(remote);
                Assert.True(waiters.Deliver(origin), "Kept for the local poll");
                Assert.Equal(LeaseWakeEnum.Pending, waiters.WaitAsync(local, 1000, token).Result, "Local poll looks again");
                waiters.Redeliver(waiters.TakeCurrent(local)!, local);
                Assert.Equal(1, republished.Count, "Republished once");
                Assert.True(!republished[0].RemoteDeferred, "Republished without the hold");
                Assert.True(!QueueNotice.FromSubject(republished[0].ToSubject())!.RemoteDeferred, "The subject carries no hold");
            }
            return Task.CompletedTask;
        }

        private static Task SubjectsAsync(CancellationToken token)
        {
            QueueNotice notice = new QueueNotice("run-x", HarnessTypeEnum.Codex, "pool-1", true);
            notice.RemoteDeferred = true;
            notice.AffinityNodeId = "node-9";
            QueueNotice parsed = Assert.NotNull(QueueNotice.FromSubject(notice.ToSubject()), "Parsed notice");
            Assert.Equal("run-x", parsed.RunId, "Run");
            Assert.Equal(HarnessTypeEnum.Codex, parsed.HarnessType, "Harness");
            Assert.Equal("pool-1", parsed.NodePoolId ?? String.Empty, "Pool");
            Assert.True(parsed.Delegated && parsed.RemoteDeferred, "Flags");
            Assert.Equal("node-9", parsed.AffinityNodeId ?? String.Empty, "Affinity");
            Assert.True(QueueNotice.FromSubject(null) == null && QueueNotice.FromSubject("garbage") == null, "Unknown subjects");

            RunSignals signals = new RunSignals();
            LeaseWaiter a = signals.Waiters.Register("node-a", null, new[] { HarnessTypeEnum.Generic }, false);
            LeaseWaiter b = signals.Waiters.Register("node-b", null, new[] { HarnessTypeEnum.Codex }, false);
            Task<LeaseWakeEnum> waitA = signals.Waiters.WaitAsync(a, 5000, token);
            Task<LeaseWakeEnum> waitB = signals.Waiters.WaitAsync(b, 5000, token);
            signals.ApplyRemote(new BackplaneMessage(BackplaneMessageKindEnum.QueueChanged, null));
            Assert.True(waitA.Wait(2000) && waitB.Wait(2000), "A message without a notice wakes every poll");
            Assert.True(waitA.Result == LeaseWakeEnum.Broadcast && waitB.Result == LeaseWakeEnum.Broadcast, "Broadcast reason");

            waitA = signals.Waiters.WaitAsync(a, 5000, token);
            waitB = signals.Waiters.WaitAsync(b, 5000, token);
            signals.ApplyRemote(new BackplaneMessage(BackplaneMessageKindEnum.QueueChanged, new QueueNotice("run-y", HarnessTypeEnum.Codex, null, false).ToSubject()));
            Assert.True(waitB.Wait(2000), "The Codex poll woke");
            Assert.True(!waitA.Wait(300), "The Generic poll slept on");
            signals.SignalAll();
            Assert.True(waitA.Wait(2000), "A resynchronization wakes every poll");
            signals.Waiters.Dispose();
            return Task.CompletedTask;
        }

        private static async Task WakeupTargetedAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            int replicas = ReplicaCount(provider);
            using (MetricCapture capture = new MetricCapture())
            await using (TestReplicaCluster cluster = await StartAsync(provider, token).ConfigureAwait(false))
            {
                Agent agent = await cluster.CreateAgentAsync(0, "wake-targeted", null, token).ConfigureAwait(false);
                int pollers = 10;
                List<Node> nodes = new List<Node>();
                for (int i = 0; i < pollers; i++) nodes.Add(await NodeAsync(cluster.Replicas[0], "targeted", null, null, token).ConfigureAwait(false));
                ConcurrentDictionary<string, string> claims = new ConcurrentDictionary<string, string>(StringComparer.Ordinal);
                ConcurrentBag<string> duplicates = new ConcurrentBag<string>();
                using (CancellationTokenSource stop = CancellationTokenSource.CreateLinkedTokenSource(token))
                {
                    List<Task> loops = nodes.Select((node, i) => PollLoopAsync(Scheduler(cluster, i % replicas), node, claims, duplicates, stop.Token)).ToList();
                    try
                    {
                        await WaitForAsync(() => Sleeping(cluster) == pollers, 15000, "every poll asleep", token).ConfigureAwait(false);
                        long wakeupsBefore = Wakeups(cluster);
                        double lostBefore = LostClaims(capture);
                        List<long> latencies = new List<long>();
                        int runs = 5;
                        for (int i = 0; i < runs; i++)
                        {
                            Stopwatch timer = Stopwatch.StartNew();
                            Run run = await InvokeAsync(cluster.Replicas[i % replicas], cluster.TenantId, agent, "targeted " + i, token).ConfigureAwait(false);
                            await WaitForAsync(() => claims.ContainsKey(run.Id), 8000, "run " + i + " to be claimed", token).ConfigureAwait(false);
                            latencies.Add(timer.ElapsedMilliseconds);
                            await WaitForAsync(() => Sleeping(cluster) == pollers && Deferred(cluster) == 0, 15000, "every poll asleep again after run " + i, token).ConfigureAwait(false);
                        }
                        long targeted = Wakeups(cluster) - wakeupsBefore;
                        double lostTargeted = LostClaims(capture) - lostBefore;
                        Assert.True(latencies.Max() < 3000, "Claim latency (ms): " + String.Join(", ", latencies) + "; the fallback poll is 10000 ms.");
                        Assert.True(targeted >= runs && targeted <= runs * replicas, "Polls woken for " + runs + " runs: " + targeted + " (waking every poll would be " + (runs * pollers) + ").");

                        // Fanout 0 restores waking every matching poll on every replica.
                        foreach (TestServerHost replica in cluster.Replicas) Waiters(replica).Fanout = 0;
                        long broadcastBefore = Wakeups(cluster);
                        double lostBroadcastBefore = LostClaims(capture);
                        Run broadcastRun = await InvokeAsync(cluster.Replicas[0], cluster.TenantId, agent, "broadcast", token).ConfigureAwait(false);
                        await WaitForAsync(() => claims.ContainsKey(broadcastRun.Id), 8000, "the broadcast run to be claimed", token).ConfigureAwait(false);
                        await WaitForAsync(() => Sleeping(cluster) == pollers, 15000, "every poll asleep after the broadcast", token).ConfigureAwait(false);
                        long broadcast = Wakeups(cluster) - broadcastBefore;
                        double lostBroadcast = LostClaims(capture) - lostBroadcastBefore;
                        Assert.True(broadcast >= pollers - 1, "Fanout 0 woke " + broadcast + " of " + pollers + " polls.");
                        Assert.True(lostTargeted == 0 || lostTargeted < lostBroadcast, "Lost claims: targeted " + lostTargeted + " for " + runs + " runs, broadcast " + lostBroadcast + " for one run.");
                        Assert.True(duplicates.IsEmpty, "Runs assigned twice: " + String.Join(", ", duplicates));
                    }
                    finally
                    {
                        await StopPollersAsync(stop, loops).ConfigureAwait(false);
                    }
                }
            }
        }

        private static async Task WakeupHandoffAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            int replicas = ReplicaCount(provider);
            await using (TestReplicaCluster cluster = await StartAsync(provider, token).ConfigureAwait(false))
            {
                Agent agent = await cluster.CreateAgentAsync(0, "wake-handoff", d => d.NodeSelector.Add(new DeploymentNodeSelector { Key = "zone", Value = "blue" }), token).ConfigureAwait(false);
                ConcurrentDictionary<string, string> claims = new ConcurrentDictionary<string, string>(StringComparer.Ordinal);
                ConcurrentBag<string> duplicates = new ConcurrentBag<string>();
                using (CancellationTokenSource stop = CancellationTokenSource.CreateLinkedTokenSource(token))
                {
                    List<Task> loops = new List<Task>();
                    try
                    {
                        // Three polls without the label fall asleep first on replica A, so they are woken first.
                        for (int i = 0; i < 3; i++)
                        {
                            Node plain = await NodeAsync(cluster.Replicas[0], "plain", null, null, token).ConfigureAwait(false);
                            loops.Add(PollLoopAsync(Scheduler(cluster, 0), plain, claims, duplicates, stop.Token));
                        }
                        await WaitForAsync(() => Sleeping(cluster) == 3, 15000, "the unlabeled polls asleep", token).ConfigureAwait(false);
                        TestServerHost last = cluster.Replicas[replicas - 1];
                        // On Postgresql the labeled poll is on replica B, which would hold A's notice for 5 seconds; only
                        // A republishing once its own polls tried the run explains a prompt claim.
                        if (replicas > 1) Waiters(last).RemoteDelayMs = 5000;
                        Node blue = await NodeAsync(last, "blue", "zone", "blue", token).ConfigureAwait(false);
                        loops.Add(PollLoopAsync(Scheduler(cluster, replicas - 1), blue, claims, duplicates, stop.Token));
                        await WaitForAsync(() => Sleeping(cluster) == 4, 15000, "every poll asleep", token).ConfigureAwait(false);

                        Stopwatch timer = Stopwatch.StartNew();
                        Run run = await InvokeAsync(cluster.Replicas[0], cluster.TenantId, agent, "needs the blue zone", token).ConfigureAwait(false);
                        await WaitForAsync(() => claims.ContainsKey(run.Id), 8000, "the run to be claimed", token).ConfigureAwait(false);
                        long elapsed = timer.ElapsedMilliseconds;
                        Assert.Equal(blue.Id, claims[run.Id], "Node that claimed the run");
                        Assert.True(elapsed < 3000, "Claimed after " + elapsed + " ms; the fallback poll is 10000 ms" + (replicas > 1 ? " and the remote hold 5000 ms." : "."));
                        Assert.True(duplicates.IsEmpty, "Runs assigned twice");
                    }
                    finally
                    {
                        await StopPollersAsync(stop, loops).ConfigureAwait(false);
                    }
                }
            }
        }

        private static async Task ClaimContentionAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            int replicas = ReplicaCount(provider);
            await using (TestReplicaCluster cluster = await StartAsync(provider, token).ConfigureAwait(false))
            {
                Agent agent = await cluster.CreateAgentAsync(0, "contention", null, token).ConfigureAwait(false);
                int pollers = 16;
                int runs = 40;
                List<Node> nodes = new List<Node>();
                for (int i = 0; i < pollers; i++) nodes.Add(await NodeAsync(cluster.Replicas[0], "contended", null, null, token).ConfigureAwait(false));
                ConcurrentDictionary<string, string> claims = new ConcurrentDictionary<string, string>(StringComparer.Ordinal);
                ConcurrentBag<string> duplicates = new ConcurrentBag<string>();
                using (CancellationTokenSource stop = CancellationTokenSource.CreateLinkedTokenSource(token))
                {
                    List<Task> loops = nodes.Select((node, i) => PollLoopAsync(Scheduler(cluster, i % replicas), node, claims, duplicates, stop.Token)).ToList();
                    try
                    {
                        await WaitForAsync(() => Sleeping(cluster) == pollers, 15000, "every poll asleep", token).ConfigureAwait(false);
                        Run[] created = await Task.WhenAll(Enumerable.Range(0, runs).Select(i => InvokeAsync(cluster.Replicas[i % replicas], cluster.TenantId, agent, "contended " + i, token))).ConfigureAwait(false);
                        await WaitForAsync(() => created.All(r => claims.ContainsKey(r.Id)), 30000, "every run to be claimed (" + claims.Count + " so far)", token).ConfigureAwait(false);
                        await Task.Delay(500, token).ConfigureAwait(false);
                        Assert.True(duplicates.IsEmpty, "Runs assigned twice: " + String.Join(", ", duplicates));
                        foreach (Run run in created)
                        {
                            Run stored = Assert.NotNull(await cluster.Replicas[0].Server.Context.Database.Runs.ReadAsync(run.Id, token).ConfigureAwait(false), "Run " + run.Id);
                            Assert.Equal(RunStatusEnum.Leased, stored.Status, "Status of " + run.Id);
                            Assert.Equal(1L, stored.LeaseEpoch, "Lease epoch of " + run.Id + " (claimed once)");
                            Assert.Equal(claims[run.Id], stored.LeaseNodeId ?? String.Empty, "Node holding " + run.Id);
                        }
                    }
                    finally
                    {
                        await StopPollersAsync(stop, loops).ConfigureAwait(false);
                    }
                }
            }
        }

        private static async Task WorkerLeaseBatchAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            foreach (int batchSetting in new int[] { 0, 1 })
            {
                await using (TestCluster cluster = await TestCluster.StartAsync(provider, 0, token).ConfigureAwait(false))
                {
                    Agent agent = await cluster.CreateAgentAsync("lease-batch-" + batchSetting, "builtin/fake", null, token).ConfigureAwait(false);
                    List<Run> created = new List<Run>();
                    for (int i = 0; i < 4; i++) created.Add(await InvokeAsync(cluster.Server, cluster.Server.TenantId, agent, "batch " + i, token).ConfigureAwait(false));
                    WorkerHost worker = await TestCluster.StartWorkerAsync(cluster.Server.BaseUrl, "lease-batch-" + Guid.NewGuid().ToString("N").Substring(0, 6), settings =>
                    {
                        settings.MaxConcurrentRuns = 4;
                        settings.ChildReserveSlots = 0;
                        settings.MaxLeaseBatch = batchSetting;
                    }, token).ConfigureAwait(false);
                    cluster.Workers.Add(worker);

                    Stopwatch timer = Stopwatch.StartNew();
                    while (true)
                    {
                        int finished = 0;
                        foreach (Run run in created)
                        {
                            Run? stored = await cluster.Server.Server.Context.Database.Runs.ReadAsync(run.Id, token).ConfigureAwait(false);
                            if (stored != null && stored.Status == RunStatusEnum.Succeeded) finished++;
                        }
                        if (finished == created.Count) break;
                        if (timer.ElapsedMilliseconds > 30000) throw new TestAssertionException("Timed out waiting for 4 runs to succeed with MaxLeaseBatch " + batchSetting + " (" + finished + " done).");
                        await Task.Delay(50, token).ConfigureAwait(false);
                    }
                    int expected = batchSetting == 0 ? 4 : 1;
                    Assert.Equal(expected, worker.PeakLeaseBatch, "Most runs one lease request returned with MaxLeaseBatch " + batchSetting);
                }
            }
        }

        private static async Task<string> LoginAsync(TestServerHost host, TokenRequest request, CancellationToken token)
        {
            using (HttpClient anonymous = new HttpClient())
            {
                anonymous.BaseAddress = new Uri(host.BaseUrl);
                TokenResponse issued = await HttpTestHelpers.SendAsync<TokenResponse>(anonymous, HttpMethod.Post, "/v1.0/token", request, 200, token).ConfigureAwait(false);
                return issued.Token;
            }
        }

        private static HttpClient Bearer(TestServerHost host, string tokenString)
        {
            HttpClient client = new HttpClient();
            client.BaseAddress = new Uri(host.BaseUrl);
            client.DefaultRequestHeaders.Add("Authorization", "Bearer " + tokenString);
            client.Timeout = TimeSpan.FromSeconds(60);
            return client;
        }

        private static async Task<int> StatusAsync(HttpClient client, string path, CancellationToken token)
        {
            return (await HttpTestHelpers.SendAsync(client, HttpMethod.Get, path, null, token).ConfigureAwait(false)).StatusCode;
        }

        private static async Task<long> TakesEffectAsync(HttpClient client, string path, int expected, int timeoutMs, CancellationToken token)
        {
            Stopwatch timer = Stopwatch.StartNew();
            while (true)
            {
                if (await StatusAsync(client, path, token).ConfigureAwait(false) == expected) return timer.ElapsedMilliseconds;
                if (timer.ElapsedMilliseconds > timeoutMs) return -1;
                await Task.Delay(25, token).ConfigureAwait(false);
            }
        }

        private static async Task Warm(HttpClient client, string path, int expected, string what, CancellationToken token)
        {
            for (int i = 0; i < 3; i++) Assert.Equal(expected, await StatusAsync(client, path, token).ConfigureAwait(false), what + " (request " + (i + 1) + ")");
        }

        private static async Task SetCacheSecondsAsync(TestReplicaCluster cluster, int seconds, CancellationToken token)
        {
            await cluster.Replicas[0].Server.Context.Get<ClusterSettingsService>().SetAsync("Auth.CacheSeconds", seconds.ToString(System.Globalization.CultureInfo.InvariantCulture), "test", token).ConfigureAwait(false);
            await WaitForAsync(() => cluster.Replicas.All(r => r.Server.Context.Authentication.Cache.CacheSeconds == seconds), 10000, "Auth.CacheSeconds " + seconds + " on every replica", token).ConfigureAwait(false);
        }

        private static async Task<User> CreateUserAsync(TestServerHost host, string tenantId, string email, CancellationToken token)
        {
            return await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + tenantId + "/users", new UserRequest { Email = email, Password = "password123" }, 201, token).ConfigureAwait(false);
        }

        private static async Task AuthCacheInvalidationAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestReplicaCluster cluster = await TestReplicaCluster.StartAsync(provider, ReplicaCount(provider), BackplaneModeEnum.Auto, null, token).ConfigureAwait(false))
            {
                // Changes go through replica A; requests are answered by replica B (the same replica on Sqlite). With a
                // 60 second cache, only explicit invalidation explains a change taking effect within 2 seconds.
                TestServerHost a = cluster.Replicas[0];
                TestServerHost b = cluster.Replicas[cluster.Replicas.Count - 1];
                await SetCacheSecondsAsync(cluster, 60, token).ConfigureAwait(false);
                string t = "/v1.0/api/tenants/" + cluster.TenantId;
                int bound = 2000;

                // Revoked token (logout on A).
                await CreateUserAsync(a, cluster.TenantId, "revoked@example.com", token).ConfigureAwait(false);
                string revokedToken = await LoginAsync(a, new TokenRequest { TenantId = cluster.TenantId, Email = "revoked@example.com", Password = "password123" }, token).ConfigureAwait(false);
                using (HttpClient onA = Bearer(a, revokedToken))
                using (HttpClient onB = Bearer(b, revokedToken))
                {
                    long hitsBefore = b.Server.Context.Authentication.Cache.Hits;
                    await Warm(onB, "/v1.0/token/details", 200, "Token before logout", token).ConfigureAwait(false);
                    Assert.True(b.Server.Context.Authentication.Cache.Hits > hitsBefore, "Repeated requests are answered from the cache");
                    Assert.Equal(200, (await HttpTestHelpers.SendAsync(onA, HttpMethod.Delete, "/v1.0/token", null, token).ConfigureAwait(false)).StatusCode, "Logout");
                    long ms = await TakesEffectAsync(onB, "/v1.0/token/details", 401, bound, token).ConfigureAwait(false);
                    Assert.True(ms >= 0, "A revoked token still worked on replica B after " + bound + " ms");
                }

                // Deactivated user.
                User deactivated = await CreateUserAsync(a, cluster.TenantId, "deactivated@example.com", token).ConfigureAwait(false);
                string userToken = await LoginAsync(a, new TokenRequest { TenantId = cluster.TenantId, Email = "deactivated@example.com", Password = "password123" }, token).ConfigureAwait(false);
                using (HttpClient onB = Bearer(b, userToken))
                {
                    await Warm(onB, "/v1.0/token/details", 200, "User before deactivation", token).ConfigureAwait(false);
                    await HttpTestHelpers.SendAsync<User>(a.AdminClient, HttpMethod.Put, t + "/users/" + deactivated.Id, new UserRequest { Active = false }, 200, token).ConfigureAwait(false);
                    Assert.True(await TakesEffectAsync(onB, "/v1.0/token/details", 401, bound, token).ConfigureAwait(false) >= 0, "A deactivated user still worked on replica B after " + bound + " ms");
                }

                // Deleted credential: both its keys and a session token issued for it.
                User owner = (await a.Server.Context.Database.Users.ReadByEmailAsync(cluster.TenantId, "admin@garrison", token).ConfigureAwait(false))!;
                CredentialCreateResponse credential = await HttpTestHelpers.SendAsync<CredentialCreateResponse>(a.AdminClient, HttpMethod.Post, t + "/credentials", new CredentialRequest { Name = "doomed-" + Guid.NewGuid().ToString("N").Substring(0, 6), UserId = owner.Id }, 201, token).ConfigureAwait(false);
                string credentialToken = await LoginAsync(a, new TokenRequest { AccessKey = credential.AccessKey, SecretKey = credential.SecretKey }, token).ConfigureAwait(false);
                using (HttpClient keys = b.CredentialClient(credential.AccessKey, credential.SecretKey))
                using (HttpClient session = Bearer(b, credentialToken))
                {
                    await Warm(keys, "/v1.0/token/details", 200, "Credential keys before deletion", token).ConfigureAwait(false);
                    await Warm(session, "/v1.0/token/details", 200, "Credential token before deletion", token).ConfigureAwait(false);
                    Assert.Equal(204, (await HttpTestHelpers.SendAsync(a.AdminClient, HttpMethod.Delete, t + "/credentials/" + credential.Credential.Id, null, token).ConfigureAwait(false)).StatusCode, "Credential delete");
                    Assert.True(await TakesEffectAsync(keys, "/v1.0/token/details", 401, bound, token).ConfigureAwait(false) >= 0, "Deleted credential keys still worked on replica B");
                    Assert.True(await TakesEffectAsync(session, "/v1.0/token/details", 401, bound, token).ConfigureAwait(false) >= 0, "A deleted credential's token still worked on replica B");
                }

                // Role changes: a role assignment, then the tenant administrator flag on the user record.
                Permission readUsers = await HttpTestHelpers.SendAsync<Permission>(a.AdminClient, HttpMethod.Post, t + "/permissions", new PermissionRequest { Name = "Read users " + Guid.NewGuid().ToString("N").Substring(0, 4), ResourceTypes = new List<string> { "User" }, OperationTypes = new List<string> { "Read" } }, 201, token).ConfigureAwait(false);
                Role reader = await HttpTestHelpers.SendAsync<Role>(a.AdminClient, HttpMethod.Post, t + "/roles", new RoleRequest { Name = "CacheReader" + Guid.NewGuid().ToString("N").Substring(0, 4) }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<RolePermissionMap>(a.AdminClient, HttpMethod.Post, t + "/role-permissions", new RolePermissionRequest { RoleId = reader.Id, PermissionId = readUsers.Id }, 201, token).ConfigureAwait(false);
                User member = await CreateUserAsync(a, cluster.TenantId, "member@example.com", token).ConfigureAwait(false);
                UserRoleAssignment assignment = await HttpTestHelpers.SendAsync<UserRoleAssignment>(a.AdminClient, HttpMethod.Post, t + "/user-role-assignments", new AssignmentRequest { UserId = member.Id, RoleId = reader.Id }, 201, token).ConfigureAwait(false);
                string memberToken = await LoginAsync(a, new TokenRequest { TenantId = cluster.TenantId, Email = "member@example.com", Password = "password123" }, token).ConfigureAwait(false);
                using (HttpClient onB = Bearer(b, memberToken))
                {
                    Assert.True(await TakesEffectAsync(onB, t + "/users", 200, bound, token).ConfigureAwait(false) >= 0, "The assigned role works on replica B");
                    await Warm(onB, t + "/users", 200, "Role before removal", token).ConfigureAwait(false);
                    await HttpTestHelpers.SendAsync(a.AdminClient, HttpMethod.Delete, t + "/user-role-assignments/" + assignment.Id, null, token).ConfigureAwait(false);
                    Assert.True(await TakesEffectAsync(onB, t + "/users", 403, bound, token).ConfigureAwait(false) >= 0, "A removed role still worked on replica B");

                    await HttpTestHelpers.SendAsync<User>(a.AdminClient, HttpMethod.Put, t + "/users/" + member.Id, new UserRequest { IsTenantAdmin = true }, 200, token).ConfigureAwait(false);
                    Assert.True(await TakesEffectAsync(onB, t + "/users", 200, bound, token).ConfigureAwait(false) >= 0, "Tenant administrator granted on A did not apply on replica B");
                    await Warm(onB, t + "/users", 200, "Tenant administrator before removal", token).ConfigureAwait(false);
                    await HttpTestHelpers.SendAsync<User>(a.AdminClient, HttpMethod.Put, t + "/users/" + member.Id, new UserRequest { IsTenantAdmin = false }, 200, token).ConfigureAwait(false);
                    Assert.True(await TakesEffectAsync(onB, t + "/users", 403, bound, token).ConfigureAwait(false) >= 0, "Tenant administrator removed on A still applied on replica B");
                }

                // Deactivated tenant.
                Tenant other = await HttpTestHelpers.SendAsync<Tenant>(a.AdminClient, HttpMethod.Post, "/v1.0/api/tenants", new TenantRequest { Name = "cache-" + Guid.NewGuid().ToString("N").Substring(0, 6) }, 201, token).ConfigureAwait(false);
                await CreateUserAsync(a, other.Id, "tenant-user@example.com", token).ConfigureAwait(false);
                string tenantToken = await LoginAsync(a, new TokenRequest { TenantId = other.Id, Email = "tenant-user@example.com", Password = "password123" }, token).ConfigureAwait(false);
                using (HttpClient onB = Bearer(b, tenantToken))
                {
                    await Warm(onB, "/v1.0/token/details", 200, "Tenant before deactivation", token).ConfigureAwait(false);
                    await HttpTestHelpers.SendAsync<Tenant>(a.AdminClient, HttpMethod.Put, "/v1.0/api/tenants/" + other.Id, new TenantRequest { Active = false }, 200, token).ConfigureAwait(false);
                    Assert.True(await TakesEffectAsync(onB, "/v1.0/token/details", 401, bound, token).ConfigureAwait(false) >= 0, "A deactivated tenant's user still worked on replica B");
                }
            }
        }

        private static async Task AuthCacheTtlAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestReplicaCluster cluster = await TestReplicaCluster.StartAsync(provider, 1, BackplaneModeEnum.Auto, null, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Replicas[0];
                AuthCache cache = host.Server.Context.Authentication.Cache;
                await SetCacheSecondsAsync(cluster, 2, token).ConfigureAwait(false);
                User user = await CreateUserAsync(host, cluster.TenantId, "ttl@example.com", token).ConfigureAwait(false);
                string userToken = await LoginAsync(host, new TokenRequest { TenantId = cluster.TenantId, Email = "ttl@example.com", Password = "password123" }, token).ConfigureAwait(false);
                using (HttpClient client = Bearer(host, userToken))
                {
                    await Warm(client, "/v1.0/token/details", 200, "Before the change", token).ConfigureAwait(false);
                    long hits = cache.Hits;
                    long misses = cache.Misses;
                    for (int i = 0; i < 10; i++) Assert.Equal(200, await StatusAsync(client, "/v1.0/token/details", token).ConfigureAwait(false), "Cached request " + i);
                    Assert.True(cache.Hits - hits >= 20, "Ten requests found their session, tenant, and user in the cache (" + (cache.Hits - hits) + " hits)");

                    // A change made outside the API (no invalidation) is seen within Auth.CacheSeconds.
                    User stored = Assert.NotNull(await host.Server.Context.Database.Users.ReadAsync(user.Id, token).ConfigureAwait(false), "Stored user");
                    stored.Active = false;
                    await host.Server.Context.Database.Users.UpdateAsync(stored, token).ConfigureAwait(false);
                    Stopwatch timer = Stopwatch.StartNew();
                    long ms = await TakesEffectAsync(client, "/v1.0/token/details", 401, 5000, token).ConfigureAwait(false);
                    Assert.True(ms >= 0 && ms <= 3000, "A user deactivated in the database stopped working after " + ms + " ms; the bound is Auth.CacheSeconds (2 s).");
                    Assert.True(cache.Misses > misses, "The expired entries were read again");
                }

                // 0 turns the cache off: every lookup reads the database.
                await SetCacheSecondsAsync(cluster, 0, token).ConfigureAwait(false);
                await CreateUserAsync(host, cluster.TenantId, "uncached@example.com", token).ConfigureAwait(false);
                string uncachedToken = await LoginAsync(host, new TokenRequest { TenantId = cluster.TenantId, Email = "uncached@example.com", Password = "password123" }, token).ConfigureAwait(false);
                long hitsOff = cache.Hits;
                using (HttpClient client = Bearer(host, uncachedToken))
                {
                    for (int i = 0; i < 3; i++) Assert.Equal(200, await StatusAsync(client, "/v1.0/token/details", token).ConfigureAwait(false), "Uncached request " + i);
                }
                Assert.Equal(hitsOff, cache.Hits, "Hits with the cache off");
            }
        }

        #endregion
    }
}
