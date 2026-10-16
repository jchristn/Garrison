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
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Serialization;
    using Garrison.Core.Services;
    using Garrison.Server.Backplane;
    using Garrison.Server.Runtime;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>Local multi-control-plane effect safety under partitions, leader loss and a complete endpoint outage.</summary>
    public static class RecoveryAcceptanceSuite
    {
        /// <summary>Build PostgreSQL distributed-runtime acceptance cases.</summary>
        /// <returns>Selected suites.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            List<TestSuiteDescriptor> suites = new List<TestSuiteDescriptor>();
            if (!TestEnvironment.Providers().Contains(DatabaseTypeEnum.Postgresql)) return suites;
            string id = "recovery-acceptance-postgresql";
            List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
            foreach (DeploymentEffectPolicyEnum policy in new[] { DeploymentEffectPolicyEnum.AtMostOnce, DeploymentEffectPolicyEnum.Journaled, DeploymentEffectPolicyEnum.AtLeastOnce })
            {
                DeploymentEffectPolicyEnum selected = policy;
                cases.Add(new TestCaseDescriptor(id, "leader-loss-partition-" + policy.ToString().ToLowerInvariant(), "Three replicas: committed external effect, isolated worker, leader stopped, surviving replicas recover under " + policy, ct => RecoverAsync(selected, false, ct)));
                cases.Add(new TestCaseDescriptor(id, "all-control-planes-offline-" + policy.ToString().ToLowerInvariant(), "All three replicas stop after an external commit, endpoints remain unavailable past lease expiry, new runtimes recover under " + policy, ct => RecoverAsync(selected, true, ct)));
            }
            suites.Add(new TestSuiteDescriptor(id, "Local distributed recovery acceptance (P12.34)", cases));
            return suites;
        }

        private static void FastRuntime(TestServerHost host)
        {
            RuntimeOptions options = host.Server.Context.Get<RuntimeOptions>();
            options.LeaseDurationMs = 5000;
            options.MaintenanceIntervalMs = 250;
            options.PauseGraceMs = 60000;
        }

        private static async Task WaitAsync(Func<Task<bool>> predicate, string description, CancellationToken token, int seconds = 45)
        {
            DateTime deadline = DateTime.UtcNow.AddSeconds(seconds);
            while (DateTime.UtcNow < deadline)
            {
                if (await predicate().ConfigureAwait(false)) return;
                await Task.Delay(100, token).ConfigureAwait(false);
            }
            throw new TestAssertionException("Timed out: " + description);
        }

        private static async Task RecoverAsync(DeploymentEffectPolicyEnum policy, bool totalOutage, CancellationToken token)
        {
            await using (ExternalEffectSink sink = await ExternalEffectSink.StartAsync(token).ConfigureAwait(false))
            await using (TestReplicaCluster cluster = await TestReplicaCluster.StartAsync(DatabaseTypeEnum.Postgresql, 3, BackplaneModeEnum.PostgresNotify, null, token).ConfigureAwait(false))
            {
                foreach (TestServerHost replica in cluster.Replicas) FastRuntime(replica);
                await WaitAsync(() => Task.FromResult(cluster.Replicas.Count(replica => replica.Server.Context.Get<ILeaderState>().IsLeader) == 1), "initial singleton leader", token).ConfigureAwait(false);
                TestServerHost initialLeader = cluster.Replicas.Single(replica => replica.Server.Context.Get<ILeaderState>().IsLeader);
                string initialLeaderId = initialLeader.Settings.NodeId ?? throw new TestAssertionException("Leader has no node identity.");
                long initialLeaderEpoch = initialLeader.Server.Context.Get<ILeaderState>().Epoch;
                string tenant = cluster.TenantId;
                string path = "/v1.0/api/tenants/" + tenant;
                HarnessProfile profile = BuiltInSeeder.HarnessProfileDefaults().Single(item => item.Name == "builtin/fake");
                profile.Id = IdGenerator.NewHarnessProfileId();
                profile.Name = "recovery-attempt-fixture";
                profile.TenantId = tenant;
                profile.IsBuiltIn = false;
                profile.IsProtected = false;
                profile.BuiltInKey = null;
                profile.Arguments.Clear();
                profile.Arguments.Add(new HarnessArgument { Template = "{{run.attempt}}" });
                profile = await HttpTestHelpers.SendAsync<HarnessProfile>(initialLeader.AdminClient, HttpMethod.Post, path + "/harness-profiles", profile, 201, token).ConfigureAwait(false);
                Agent agent = await cluster.CreateAgentAsync(0, "recovery-" + policy.ToString().ToLowerInvariant(), deployment =>
                {
                    deployment.HarnessProfileId = profile.Id;
                    deployment.EffectPolicy = policy;
                    deployment.MaxAttempts = 5;
                }, token).ConfigureAwait(false);
                using (HttpPartitionProxy proxy = new HttpPartitionProxy(initialLeader.BaseUrl))
                {
                    proxy.PartitionAfterStartAcknowledged = true;
                    await using (Garrison.Worker.Hosting.WorkerHost oldWorker = await TestCluster.StartWorkerAsync(proxy.BaseUrl, "old-effect-worker", null, token, new ExternalEffectExecutor(sink.BaseUrl, true)).ConfigureAwait(false))
                    {
                        Run admitted = await HttpTestHelpers.SendAsync<Run>(initialLeader.AdminClient, HttpMethod.Post, path + "/agents/" + agent.Id + "/invoke", new InvokeRequest { Input = "Commit exactly one externally visible mutation before fault injection.", Wait = false }, 202, token).ConfigureAwait(false);
                        await WaitAsync(async () => (await sink.ReceiptsAsync(token).ConfigureAwait(false)).Count == 1, "first independent external receipt", token).ConfigureAwait(false);
                        Run running = Assert.NotNull(await initialLeader.Server.Context.Database.Runs.ReadAsync(tenant, admitted.Id, token).ConfigureAwait(false), "Running before fault");
                        Assert.Equal(RunStatusEnum.Running, running.Status, "Effect occurred in a started attempt");
                        Assert.True(proxy.Partitioned, "Old worker is isolated from every control-plane request");
                        List<TestServerHost> active;
                        DateTime outageStarted = DateTime.UtcNow;
                        if (totalOutage)
                        {
                            await Task.WhenAll(cluster.Replicas.Select(replica => replica.Server.StopAsync(token))).ConfigureAwait(false);
                            foreach (TestServerHost stopped in cluster.Replicas)
                            {
                                using (HttpClient probe = new HttpClient { Timeout = TimeSpan.FromSeconds(2) })
                                {
                                    bool unavailable = false;
                                    try { using (HttpResponseMessage response = await probe.GetAsync(stopped.BaseUrl + "/v1.0/api/health/ready", token).ConfigureAwait(false)) unavailable = !response.IsSuccessStatusCode; }
                                    catch (HttpRequestException) { unavailable = true; }
                                    Assert.True(unavailable, "Every old control-plane endpoint is unavailable");
                                }
                            }
                            await Task.Delay(6000, token).ConfigureAwait(false);
                            Assert.True(DateTime.UtcNow > running.LeaseExpiresUtc, "Complete endpoint outage outlasts the old execution lease");
                            active = new List<TestServerHost>();
                            for (int index = 0; index < 2; index++)
                            {
                                int number = index;
                                TestServerHost replacement = await TestServerHost.StartAsync(DatabaseTypeEnum.Postgresql, settings =>
                                {
                                    settings.Database = cluster.Database.Clone();
                                    settings.NodeId = "replacement-" + number;
                                    settings.Cluster.ExpectedReplicas = 2;
                                    settings.Cluster.Backplane = BackplaneModeEnum.PostgresNotify;
                                }, token).ConfigureAwait(false);
                                FastRuntime(replacement);
                                active.Add(replacement);
                            }
                            cluster.Replicas.AddRange(active);
                        }
                        else
                        {
                            await initialLeader.Server.StopAsync(token).ConfigureAwait(false);
                            active = cluster.Replicas.Where(replica => replica != initialLeader).ToList();
                        }
                        await WaitAsync(() => Task.FromResult(active.Count(replica => replica.Server.Context.Get<ILeaderState>().IsLeader) == 1), "one replacement maintenance leader", token).ConfigureAwait(false);
                        TestServerHost leader = active.Single(replica => replica.Server.Context.Get<ILeaderState>().IsLeader);
                        Assert.True(leader.Settings.NodeId != initialLeaderId, "A different control plane leads");
                        Assert.True(leader.Server.Context.Get<ILeaderState>().Epoch > initialLeaderEpoch, "Leader fencing epoch advances");
                        await using (Garrison.Worker.Hosting.WorkerHost healthyWorker = await TestCluster.StartWorkerAsync(active.Last().BaseUrl, "replacement-effect-worker", null, token, new ExternalEffectExecutor(sink.BaseUrl, false)).ConfigureAwait(false))
                        {
                            Run? finished = null;
                            await WaitAsync(async () =>
                            {
                                finished = await leader.Server.Context.Database.Runs.ReadAsync(tenant, admitted.Id, token).ConfigureAwait(false);
                                return finished != null && RunService.IsTerminal(finished.Status);
                            }, "policy-specific terminal recovery", token, 90).ConfigureAwait(false);
                            List<ExternalEffectReceipt> receipts = await sink.ReceiptsAsync(token).ConfigureAwait(false);
                            int expected = policy == DeploymentEffectPolicyEnum.AtLeastOnce ? 2 : 1;
                            Assert.Equal(expected, receipts.Count, "External sink is intentionally not deduplicating");
                            Assert.True(receipts.All(receipt => receipt.OperationId == admitted.Id), "Every mutation retains the operation/run identity");
                            Assert.Equal(1, receipts[0].Attempt, "Initial committed attempt is tagged");
                            if (policy == DeploymentEffectPolicyEnum.AtLeastOnce)
                            {
                                Assert.Equal(RunStatusEnum.Succeeded, finished!.Status, "Replacement worker completes permitted replay");
                                Assert.True(finished.Attempt >= 2, "Replayed run has a new attempt");
                                Assert.Equal(finished.Attempt, receipts[1].Attempt, "Duplicate is tagged with actual rendered run.attempt");
                                Assert.True(finished.LeaseEpoch > running.LeaseEpoch, "Execution fencing epoch advances");
                            }
                            else
                            {
                                Assert.Equal(RunStatusEnum.Failed, finished!.Status, "Unproven side effects cannot replay");
                                Assert.Equal(RunOutcomeEnum.NodeLost, finished.Outcome, "Explicit unsafe recovery outcome");
                                Assert.Equal(1, finished.Attempt, "No hidden retry");
                            }
                            proxy.PartitionAfterStartAcknowledged = false;
                            proxy.Retarget(active.Last().BaseUrl);
                            proxy.Heal();
                            await Task.Delay(2000, token).ConfigureAwait(false);
                            Run stable = Assert.NotNull(await leader.Server.Context.Database.Runs.ReadAsync(tenant, admitted.Id, token).ConfigureAwait(false), "Stable terminal run");
                            Assert.Equal(finished!.Status, stable.Status, "Healed stale worker cannot rewrite terminal state");
                            Assert.Equal(finished.LeaseEpoch, stable.LeaseEpoch, "Healed worker cannot obtain a new execution epoch");
                            Assert.Equal(expected, (await sink.ReceiptsAsync(token).ConfigureAwait(false)).Count, "No delayed extra mutation after healing");
                            string? evidence = Environment.GetEnvironmentVariable("GARRISON_RECOVERY_EVIDENCE");
                            if (!String.IsNullOrEmpty(evidence))
                            {
                                Dictionary<string, object> record = new Dictionary<string, object>
                                {
                                    ["policy"] = policy.ToString(), ["topology"] = totalOutage ? "all-three-endpoints-offline-and-replaced" : "leader-loss-with-two-survivors-and-worker-partition",
                                    ["runId"] = admitted.Id, ["initialLeader"] = initialLeaderId, ["initialLeaderEpoch"] = initialLeaderEpoch,
                                    ["replacementLeader"] = leader.Settings.NodeId ?? String.Empty, ["replacementLeaderEpoch"] = leader.Server.Context.Get<ILeaderState>().Epoch,
                                    ["finalStatus"] = stable.Status.ToString(), ["attempt"] = stable.Attempt, ["receipts"] = receipts,
                                    ["outageOrFailoverSeconds"] = (DateTime.UtcNow - outageStarted).TotalSeconds, ["passed"] = true
                                };
                                File.AppendAllText(evidence, Serializer.Serialize(record) + Environment.NewLine);
                            }
                        }
                    }
                }
            }
        }
    }
}
