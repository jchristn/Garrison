namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Net.Http;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Serialization;
    using Garrison.Server.Runtime;
    using Garrison.Server.Services;
    using Garrison.Worker.Hosting;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Deployment effect policy (P12.29): AtLeastOnce requeues a run whose worker was lost after it started; AtMostOnce and
    /// Journaled without known effect coverage end it Failed with NodeLost. New deployments default to AtMostOnce, the deprecated
    /// retryOnNodeLoss is still accepted on input, and a disagreement between the two is a 400.
    /// </summary>
    public static class EffectPolicySuite
    {
        #region Public-Methods

        /// <summary>
        /// Build the suites.
        /// </summary>
        /// <returns>Suites.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            List<TestSuiteDescriptor> suites = new List<TestSuiteDescriptor>();
            List<TestCaseDescriptor> unit = new List<TestCaseDescriptor>
            {
                new TestCaseDescriptor("effect-policy", "requeue-decision", "Lease expiry decision: Leased runs requeue under every policy; Running runs only under AtLeastOnce; cancelled runs and runs out of attempts never requeue", RequeueDecisionAsync),
                new TestCaseDescriptor("effect-policy", "legacy-input", "Deployment JSON: retryOnNodeLoss alone maps (true AtLeastOnce, false AtMostOnce), effectPolicy wins when both agree, a disagreement is flagged, and output carries both fields", LegacyInputAsync)
            };
            suites.Add(new TestSuiteDescriptor("effect-policy", "Deployment effect policy", unit));

            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "effect-policy-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>
                {
                    new TestCaseDescriptor(id, "transient-connection-reset", "Dropped worker TCP connections recover before lease expiry without duplicate execution", ct => TransientConnectionResetAsync(provider, ct)),
                    new TestCaseDescriptor(id, "transient-control-plane-outage", "A transient full worker/control-plane outage heals before lease expiry without retry or loss", ct => TransientPartitionAsync(provider, ct)),
                    new TestCaseDescriptor(id, "node-loss-at-least-once", "A worker partitioned after its run started: under AtLeastOnce the run is requeued and succeeds on another worker (" + provider + ")", ct => NodeLossAsync(provider, DeploymentEffectPolicyEnum.AtLeastOnce, ct)),
                    new TestCaseDescriptor(id, "node-loss-at-most-once", "A worker partitioned after its run started: under AtMostOnce the run ends Failed with NodeLost and never runs again, even after the deployment is changed to AtLeastOnce mid-run (" + provider + ")", ct => NodeLossAsync(provider, DeploymentEffectPolicyEnum.AtMostOnce, ct)),
                    new TestCaseDescriptor(id, "node-loss-journaled", "A worker partitioned after its run started: under Journaled the run ends Failed with NodeLost, because the CLI has unknown effect coverage (" + provider + ")", ct => NodeLossAsync(provider, DeploymentEffectPolicyEnum.Journaled, ct)),
                    new TestCaseDescriptor(id, "rest", "REST: new deployments default to AtMostOnce, retryOnNodeLoss-only input maps, conflicts are 400 EffectPolicyConflict, responses carry both fields, runs record the policy, and changes are audited (" + provider + ")", ct => RestAsync(provider, ct)),
                    new TestCaseDescriptor(id, "manifests", "Manifests: omitted means AtMostOnce, retryOnNodeLoss maps, a conflict fails with EffectPolicyConflict, and export writes effectPolicy and round-trips unchanged (" + provider + ")", ct => ManifestsAsync(provider, ct)),
                    new TestCaseDescriptor(id, "mcp-management", "MCP management: new deployments default to AtMostOnce, retryOnNodeLoss-only input maps, and a conflict is rejected naming effectPolicy (" + provider + ")", ct => McpManagementAsync(provider, ct)),
                    new TestCaseDescriptor(id, "delegated-child", "A delegated child run follows its own deployment's effect policy, not its parent's (" + provider + ")", ct => DelegatedChildAsync(provider, ct))
                };
                suites.Add(new TestSuiteDescriptor(id, "Deployment effect policy (" + provider + ")", cases));
            }
            return suites;
        }

        #endregion

        #region Private-Methods

        private static Task RequeueDecisionAsync(CancellationToken token)
        {
            foreach (DeploymentEffectPolicyEnum policy in Enum.GetValues<DeploymentEffectPolicyEnum>())
            {
                Assert.True(EffectPolicyRules.RequeueOnLeaseExpiry(NewRun(RunStatusEnum.Leased, policy, 1, 3)), "A Leased run is requeued under " + policy);
                bool running = EffectPolicyRules.RequeueOnLeaseExpiry(NewRun(RunStatusEnum.Running, policy, 1, 3));
                Assert.Equal(policy == DeploymentEffectPolicyEnum.AtLeastOnce, running, "A lost Running run under " + policy);
                Assert.True(!EffectPolicyRules.RequeueOnLeaseExpiry(NewRun(RunStatusEnum.Running, policy, 3, 3)), "No attempts left under " + policy);
                Assert.True(!EffectPolicyRules.RequeueOnLeaseExpiry(NewRun(RunStatusEnum.Cancelling, policy, 1, 3)), "A Cancelling run is not requeued under " + policy);
                Run cancelled = NewRun(RunStatusEnum.Leased, policy, 1, 3);
                cancelled.CancelRequested = true;
                Assert.True(!EffectPolicyRules.RequeueOnLeaseExpiry(cancelled), "A cancel-requested run is not requeued under " + policy);
            }
            Assert.True(!EffectPolicyRules.RequeuesStartedRuns(DeploymentEffectPolicyEnum.Journaled), "Journaled behaves because the CLI has unknown effect coverage");
            return Task.CompletedTask;
        }

        private static Task LegacyInputAsync(CancellationToken token)
        {
            Deployment fresh = new Deployment();
            Assert.True(fresh.EffectPolicy == DeploymentEffectPolicyEnum.AtMostOnce && !fresh.RetryOnNodeLoss && !fresh.EffectPolicyConflict, "A new deployment is AtMostOnce");

            Deployment legacyTrue = Assert.NotNull(Serializer.Deserialize<Deployment>("{\"name\":\"a\",\"retryOnNodeLoss\":true}"), "Legacy true");
            Assert.True(legacyTrue.EffectPolicy == DeploymentEffectPolicyEnum.AtLeastOnce && legacyTrue.RetryOnNodeLoss && !legacyTrue.EffectPolicyConflict, "retryOnNodeLoss true maps to AtLeastOnce");
            Deployment legacyFalse = Assert.NotNull(Serializer.Deserialize<Deployment>("{\"name\":\"a\",\"retryOnNodeLoss\":false}"), "Legacy false");
            Assert.True(legacyFalse.EffectPolicy == DeploymentEffectPolicyEnum.AtMostOnce && !legacyFalse.EffectPolicyConflict, "retryOnNodeLoss false maps to AtMostOnce");

            foreach (string body in new[] { "{\"effectPolicy\":\"Journaled\",\"retryOnNodeLoss\":false}", "{\"retryOnNodeLoss\":false,\"effectPolicy\":\"Journaled\"}" })
            {
                Deployment agreeing = Assert.NotNull(Serializer.Deserialize<Deployment>(body), "Agreeing");
                Assert.True(agreeing.EffectPolicy == DeploymentEffectPolicyEnum.Journaled && !agreeing.RetryOnNodeLoss && !agreeing.EffectPolicyConflict, "Journaled with retryOnNodeLoss false agrees, in either order: " + body);
            }
            foreach (string body in new[] { "{\"effectPolicy\":\"AtMostOnce\",\"retryOnNodeLoss\":true}", "{\"retryOnNodeLoss\":true,\"effectPolicy\":\"Journaled\"}", "{\"effectPolicy\":\"AtLeastOnce\",\"retryOnNodeLoss\":false}" })
            {
                Assert.True(Assert.NotNull(Serializer.Deserialize<Deployment>(body), "Conflicting").EffectPolicyConflict, "Conflict is flagged: " + body);
            }

            string json = Serializer.Serialize(new Deployment { EffectPolicy = DeploymentEffectPolicyEnum.AtLeastOnce });
            Assert.True(json.Contains("\"effectPolicy\":\"AtLeastOnce\"", StringComparison.Ordinal) && json.Contains("\"retryOnNodeLoss\":true", StringComparison.Ordinal) && !json.Contains("effectPolicyConflict", StringComparison.OrdinalIgnoreCase), "Output carries effectPolicy and the derived retryOnNodeLoss: " + json);
            Deployment roundTrip = Assert.NotNull(Serializer.Deserialize<Deployment>(json), "Round trip");
            Assert.True(roundTrip.EffectPolicy == DeploymentEffectPolicyEnum.AtLeastOnce && !roundTrip.EffectPolicyConflict, "A response sent back unchanged is accepted");
            return Task.CompletedTask;
        }

        private static async Task NodeLossAsync(DatabaseTypeEnum provider, DeploymentEffectPolicyEnum policy, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 0, token).ConfigureAwait(false))
            using (HttpPartitionProxy proxy = new HttpPartitionProxy(cluster.Server.BaseUrl))
            {
                FastLeases(cluster);
                string agentName = "effect-" + policy.ToString().ToLowerInvariant();
                Agent agent = await cluster.CreateAgentAsync(agentName, "builtin/fake", null, token, d =>
                {
                    d.MaxAttempts = 3;
                    d.EffectPolicy = policy;
                }).ConfigureAwait(false);

                HoldingExecutor partitionedExecutor = new HoldingExecutor("partitioned");
                partitionedExecutor.HoldMs = 120000;
                HoldingExecutor healthyExecutor = new HoldingExecutor("healthy");
                proxy.PartitionAfterStartAcknowledged = true;
                WorkerHost partitioned = await TestCluster.StartWorkerAsync(proxy.BaseUrl, "lost-" + Guid.NewGuid().ToString("N").Substring(0, 6), null, token, partitionedExecutor).ConfigureAwait(false);
                try
                {
                    Run run = await CreateRunAsync(cluster.Server, agent, "Started, then lost", token).ConfigureAwait(false);
                    Assert.Equal(policy, run.EffectPolicy, "The run records the policy it was admitted under");
                    Run running = await WaitForAsync(cluster, run.Id, r => r.Status == RunStatusEnum.Running, TimeSpan.FromSeconds(30), "the start acknowledgement", token).ConfigureAwait(false);
                    Assert.Equal(1, running.Attempt, "First attempt is running");

                    if (policy == DeploymentEffectPolicyEnum.AtMostOnce)
                    {
                        // Changing the deployment mid-run must not change how this run is handled.
                        string tenantPath = "/v1.0/api/tenants/" + cluster.Server.TenantId;
                        EnumerationResult<Deployment> page = await cluster.Server.Server.Context.Database.Deployments.EnumerateAsync(cluster.Server.TenantId, new EnumerationQuery { MaxResults = 100 }, token).ConfigureAwait(false);
                        Deployment deployment = page.Objects.Single(d => d.AgentId == agent.Id);
                        deployment.EffectPolicy = DeploymentEffectPolicyEnum.AtLeastOnce;
                        Deployment changed = await HttpTestHelpers.SendAsync<Deployment>(cluster.Server.AdminClient, HttpMethod.Put, tenantPath + "/deployments/" + deployment.Id, deployment, 200, token).ConfigureAwait(false);
                        Assert.Equal(DeploymentEffectPolicyEnum.AtLeastOnce, changed.EffectPolicy, "Deployment changed mid-run");
                    }

                    await using (WorkerHost healthy = await TestCluster.StartWorkerAsync(cluster.Server.BaseUrl, "healthy-" + Guid.NewGuid().ToString("N").Substring(0, 6), null, token, healthyExecutor).ConfigureAwait(false))
                    {
                        Run finished = await WaitForAsync(cluster, run.Id, r => RunService.IsTerminal(r.Status), TimeSpan.FromSeconds(120), "the lost run to finish", token).ConfigureAwait(false);
                        if (policy == DeploymentEffectPolicyEnum.AtLeastOnce)
                        {
                            Assert.Equal(RunStatusEnum.Succeeded, finished.Status, "AtLeastOnce requeues and succeeds: " + finished.ErrorMessage);
                            // The lost worker's in-flight long poll may still be handed the requeued attempt, which it can never
                            // start (the start gate), so that attempt is requeued once more before the healthy worker gets it.
                            Assert.True(finished.Attempt >= 2 && finished.ResultText == "healthy", "Requeued and finished on the healthy worker: attempt " + finished.Attempt + ", result " + finished.ResultText);
                            Assert.Equal(1, healthyExecutor.Executed, "The healthy worker ran the second attempt");
                            Assert.Equal(1, partitionedExecutor.Executed, "The lost worker started the first attempt");
                        }
                        else
                        {
                            Assert.Equal(RunStatusEnum.Failed, finished.Status, policy + " does not requeue a started run");
                            Assert.Equal(RunOutcomeEnum.NodeLost, finished.Outcome, "Outcome under " + policy);
                            Assert.Equal(1, finished.Attempt, "No second attempt under " + policy);
                            Assert.Equal(policy, finished.EffectPolicy, "The run keeps its admitted policy");
                            await Task.Delay(2000, token).ConfigureAwait(false);
                            Assert.Equal(0, healthyExecutor.Executed, "The healthy worker never ran it under " + policy);
                            Assert.Equal(1, partitionedExecutor.Executed, "The run started once under " + policy);
                        }
                        long settledEpoch = finished.LeaseEpoch;
                        proxy.Heal();
                        await Task.Delay(2500, token).ConfigureAwait(false);
                        Run afterHeal = Assert.NotNull(await cluster.Server.Server.Context.Database.Runs.ReadAsync(finished.Id, token).ConfigureAwait(false), "Run after partition heals");
                        Assert.Equal(finished.Status, afterHeal.Status, "Healing an old worker cannot change terminal status");
                        Assert.Equal(settledEpoch, afterHeal.LeaseEpoch, "Healing cannot create another execution epoch");
                        Assert.Equal(finished.ResultText, afterHeal.ResultText, "Old worker cannot overwrite the winning result");
                    }
                }
                finally
                {
                    proxy.Heal();
                    await partitioned.DisposeAsync().ConfigureAwait(false);
                }
            }
        }

        private static async Task TransientPartitionAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 0, token).ConfigureAwait(false))
            using (HttpPartitionProxy proxy = new HttpPartitionProxy(cluster.Server.BaseUrl))
            {
                RuntimeOptions options = cluster.Server.Server.Context.Get<RuntimeOptions>();
                options.LeaseDurationMs = 30000;
                options.MaintenanceIntervalMs = 500;
                options.PauseGraceMs = 60000;
                Agent agent = await cluster.CreateAgentAsync("transient-partition", "builtin/fake", null, token, deployment => deployment.EffectPolicy = DeploymentEffectPolicyEnum.AtMostOnce).ConfigureAwait(false);
                HoldingExecutor executor = new HoldingExecutor("survived-transient-outage");
                executor.HoldMs = 6000;
                proxy.PartitionAfterStartAcknowledged = true;
                await using (WorkerHost worker = await TestCluster.StartWorkerAsync(proxy.BaseUrl, "transient-worker", null, token, executor).ConfigureAwait(false))
                {
                    Run admitted = await CreateRunAsync(cluster.Server, agent, "Temporary control-plane outage", token).ConfigureAwait(false);
                    Run running = await WaitForAsync(cluster, admitted.Id, run => run.Status == RunStatusEnum.Running, TimeSpan.FromSeconds(30), "first start", token).ConfigureAwait(false);
                    Assert.True(proxy.Partitioned, "All worker requests are cut after start acknowledgement");
                    await Task.Delay(2000, token).ConfigureAwait(false);
                    proxy.Heal();
                    Run finished = await WaitForAsync(cluster, admitted.Id, run => RunService.IsTerminal(run.Status), TimeSpan.FromSeconds(60), "completion after healing", token).ConfigureAwait(false);
                    Assert.Equal(RunStatusEnum.Succeeded, finished.Status, "Work survives the short outage: " + finished.ErrorMessage);
                    Assert.Equal(running.LeaseEpoch, finished.LeaseEpoch, "No new lease after transient outage");
                    Assert.Equal(1, finished.Attempt, "No replay under AtMostOnce");
                    Assert.Equal(1, executor.Executed, "Harness executes exactly once");
                    Assert.Equal("survived-transient-outage", finished.ResultText, "Completion delivered after healing");
                }
            }
        }

        private static async Task TransientConnectionResetAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 0, token).ConfigureAwait(false))
            using (TcpFaultProxy proxy = new TcpFaultProxy("127.0.0.1", new Uri(cluster.Server.BaseUrl).Port))
            {
                RuntimeOptions options = cluster.Server.Server.Context.Get<RuntimeOptions>();
                options.LeaseDurationMs = 30000;
                options.MaintenanceIntervalMs = 500;
                options.PauseGraceMs = 60000;
                Agent agent = await cluster.CreateAgentAsync("transient-reset", "builtin/fake", null, token, deployment => deployment.EffectPolicy = DeploymentEffectPolicyEnum.AtMostOnce).ConfigureAwait(false);
                HoldingExecutor executor = new HoldingExecutor("survived-transient-outage");
                executor.HoldMs = 6000;
                string workerUrl = "http://127.0.0.1:" + proxy.Port;
                await using (WorkerHost worker = await TestCluster.StartWorkerAsync(workerUrl, "transient-worker", null, token, executor).ConfigureAwait(false))
                {
                    Run admitted = await CreateRunAsync(cluster.Server, agent, "Temporary control-plane outage", token).ConfigureAwait(false);
                    Run running = await WaitForAsync(cluster, admitted.Id, run => run.Status == RunStatusEnum.Running, TimeSpan.FromSeconds(30), "first start", token).ConfigureAwait(false);
                    proxy.Cut();
                    Assert.True(proxy.IsCut, "Active TCP connections reset and new connections refused");
                    await Task.Delay(2000, token).ConfigureAwait(false);
                    proxy.Restore();
                    Run finished = await WaitForAsync(cluster, admitted.Id, run => RunService.IsTerminal(run.Status), TimeSpan.FromSeconds(60), "completion after healing", token).ConfigureAwait(false);
                    Assert.Equal(RunStatusEnum.Succeeded, finished.Status, "Work survives the short outage: " + finished.ErrorMessage);
                    Assert.Equal(running.LeaseEpoch, finished.LeaseEpoch, "No new lease after transient outage");
                    Assert.Equal(1, finished.Attempt, "No replay under AtMostOnce");
                    Assert.Equal(1, executor.Executed, "Harness executes exactly once");
                    Assert.Equal("survived-transient-outage", finished.ResultText, "Completion delivered after healing");
                }
            }
        }

        private static async Task RestAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                string tenantPath = "/v1.0/api/tenants/" + host.TenantId;
                Agent agent = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, tenantPath + "/agents", new Agent { Name = "effect-rest" }, 201, token).ConfigureAwait(false);
                HarnessProfile profile = await host.Server.Context.Database.HarnessProfiles.ReadByNameAsync(host.TenantId, "builtin/fake", token).ConfigureAwait(false) ?? throw new TestAssertionException("No fake profile.");
                string prefix = "{\"agentId\":\"" + agent.Id + "\",\"harnessProfileId\":\"" + profile.Id + "\",\"weight\":0,";

                TestResponse plain = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, tenantPath + "/deployments", prefix + "\"name\":\"plain\"}", token).ConfigureAwait(false);
                Assert.Equal(201, plain.StatusCode, "Create without either field: " + plain.Body);
                Assert.True(plain.Body.Contains("\"effectPolicy\":\"AtMostOnce\"", StringComparison.Ordinal) && plain.Body.Contains("\"retryOnNodeLoss\":false", StringComparison.Ordinal), "New deployments default to AtMostOnce and the response carries both fields: " + plain.Body);

                Deployment legacyTrue = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Post, tenantPath + "/deployments", prefix + "\"name\":\"legacy-true\",\"retryOnNodeLoss\":true}", 201, token).ConfigureAwait(false);
                Assert.True(legacyTrue.EffectPolicy == DeploymentEffectPolicyEnum.AtLeastOnce && legacyTrue.RetryOnNodeLoss, "retryOnNodeLoss true maps to AtLeastOnce");
                Deployment storedTrue = Assert.NotNull(await host.Server.Context.Database.Deployments.ReadAsync(legacyTrue.Id, token).ConfigureAwait(false), "Stored legacy true");
                Assert.Equal(DeploymentEffectPolicyEnum.AtLeastOnce, storedTrue.EffectPolicy, "Stored mapped policy");
                Deployment legacyFalse = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Post, tenantPath + "/deployments", prefix + "\"name\":\"legacy-false\",\"retryOnNodeLoss\":false}", 201, token).ConfigureAwait(false);
                Assert.Equal(DeploymentEffectPolicyEnum.AtMostOnce, legacyFalse.EffectPolicy, "retryOnNodeLoss false maps to AtMostOnce");
                Deployment journaled = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Post, tenantPath + "/deployments", prefix + "\"name\":\"journaled\",\"effectPolicy\":\"Journaled\",\"retryOnNodeLoss\":false}", 201, token).ConfigureAwait(false);
                Assert.True(journaled.EffectPolicy == DeploymentEffectPolicyEnum.Journaled && !journaled.RetryOnNodeLoss, "Journaled with an agreeing retryOnNodeLoss is accepted; retryOnNodeLoss reads false");

                foreach (string conflict in new[] { "\"effectPolicy\":\"AtMostOnce\",\"retryOnNodeLoss\":true", "\"effectPolicy\":\"AtLeastOnce\",\"retryOnNodeLoss\":false", "\"retryOnNodeLoss\":true,\"effectPolicy\":\"Journaled\"" })
                {
                    TestResponse rejected = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, tenantPath + "/deployments", prefix + "\"name\":\"conflict\"," + conflict + "}", token).ConfigureAwait(false);
                    Assert.Equal(400, rejected.StatusCode, "Conflicting input is rejected: " + conflict);
                    Assert.True(rejected.Body.Contains("EffectPolicyConflict", StringComparison.Ordinal) && rejected.Body.Contains("\"effectPolicy\"", StringComparison.Ordinal), "Field code on effectPolicy: " + rejected.Body);
                }
                TestResponse unknown = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, tenantPath + "/deployments", prefix + "\"name\":\"unknown\",\"effectPolicy\":\"Sometimes\"}", token).ConfigureAwait(false);
                Assert.Equal(400, unknown.StatusCode, "An unknown policy is rejected: " + unknown.Body);

                // Updates: legacy-only input maps, a conflict is a 400, and the change is audited.
                string updatePath = tenantPath + "/deployments/" + legacyFalse.Id;
                Deployment toTrue = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Put, updatePath, prefix + "\"name\":\"legacy-false\",\"retryOnNodeLoss\":true}", 200, token).ConfigureAwait(false);
                Assert.Equal(DeploymentEffectPolicyEnum.AtLeastOnce, toTrue.EffectPolicy, "Update with retryOnNodeLoss true maps to AtLeastOnce");
                Assert.True(await AuditedAsync(host, "Effect policy changed from AtMostOnce to AtLeastOnce", token).ConfigureAwait(false), "Effect policy change audited");
                TestResponse updateConflict = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Put, updatePath, prefix + "\"name\":\"legacy-false\",\"effectPolicy\":\"AtMostOnce\",\"retryOnNodeLoss\":true}", token).ConfigureAwait(false);
                Assert.True(updateConflict.StatusCode == 400 && updateConflict.Body.Contains("EffectPolicyConflict", StringComparison.Ordinal), "Update conflict is a 400 with the field code: " + updateConflict.Body);
                Deployment kept = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Get, updatePath, null, 200, token).ConfigureAwait(false);
                Assert.Equal(DeploymentEffectPolicyEnum.AtLeastOnce, kept.EffectPolicy, "A rejected update changes nothing");
                kept.EffectPolicy = DeploymentEffectPolicyEnum.Journaled;
                Deployment roundTrip = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Put, updatePath, kept, 200, token).ConfigureAwait(false);
                Assert.Equal(DeploymentEffectPolicyEnum.Journaled, roundTrip.EffectPolicy, "A read, edit, and write round trip with both fields is accepted");

                // Runs record the policy of the deployment that served them.
                await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Post, tenantPath + "/deployments", prefix.Replace("\"weight\":0,", "\"weight\":100,", StringComparison.Ordinal) + "\"name\":\"serving\",\"effectPolicy\":\"AtLeastOnce\"}", 201, token).ConfigureAwait(false);
                Run run = await CreateRunAsync(host, agent, "recorded policy", token).ConfigureAwait(false);
                Assert.Equal(DeploymentEffectPolicyEnum.AtLeastOnce, run.EffectPolicy, "Run records the admitted policy");
                TestResponse runJson = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, tenantPath + "/runs/" + run.Id, null, token).ConfigureAwait(false);
                Assert.True(runJson.Body.Contains("\"effectPolicy\":\"AtLeastOnce\"", StringComparison.Ordinal), "Run JSON carries effectPolicy: " + runJson.Body);
            }
        }

        private static async Task ManifestsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                string tenantPath = "/v1.0/api/tenants/" + host.TenantId;
                string head = "apiVersion: garrison/v1\nkind: Deployment\nmetadata:\n  name: ";
                string body = "\nspec:\n  agent: manifest-effect\n  harnessProfile: builtin/fake\n  weight: 0\n";
                string manifest = "apiVersion: garrison/v1\nkind: Agent\nmetadata:\n  name: manifest-effect\nspec:\n  description: Effect policy manifest.\n---\n"
                    + head + "effect-default" + body + "---\n"
                    + head + "effect-legacy" + body + "  retryOnNodeLoss: true\n---\n"
                    + head + "effect-journaled" + body + "  effectPolicy: Journaled\n";
                ManifestApply applied = await ApplyAsync(host, manifest, 200, token).ConfigureAwait(false);
                Assert.Equal(0, applied.FailedCount, "Manifest applies");
                DatabaseDriverBase db = host.Server.Context.Database;
                Assert.Equal(DeploymentEffectPolicyEnum.AtMostOnce, Assert.NotNull(await db.Deployments.ReadByNameAsync(host.TenantId, "effect-default", token).ConfigureAwait(false), "Default").EffectPolicy, "Omitted means AtMostOnce");
                Assert.Equal(DeploymentEffectPolicyEnum.AtLeastOnce, Assert.NotNull(await db.Deployments.ReadByNameAsync(host.TenantId, "effect-legacy", token).ConfigureAwait(false), "Legacy").EffectPolicy, "retryOnNodeLoss true maps to AtLeastOnce");
                Assert.Equal(DeploymentEffectPolicyEnum.Journaled, Assert.NotNull(await db.Deployments.ReadByNameAsync(host.TenantId, "effect-journaled", token).ConfigureAwait(false), "Journaled").EffectPolicy, "effectPolicy applies");

                TestResponse export = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, tenantPath + "/manifests/export", null, token).ConfigureAwait(false);
                Assert.True(export.Body.Contains("effectPolicy: AtMostOnce", StringComparison.Ordinal) && export.Body.Contains("effectPolicy: AtLeastOnce", StringComparison.Ordinal) && export.Body.Contains("effectPolicy: Journaled", StringComparison.Ordinal), "Export writes effectPolicy for every deployment");
                Assert.True(!export.Body.Contains("retryOnNodeLoss", StringComparison.Ordinal), "Export does not write the deprecated field");
                ManifestApply reapplied = await ApplyAsync(host, export.Body, 200, token).ConfigureAwait(false);
                Assert.True(reapplied.FailedCount == 0 && reapplied.UpdatedCount == 0, "Exported manifest re-applies unchanged");

                ManifestApply legacySame = await ApplyAsync(host, head + "effect-legacy" + body + "  effectPolicy: AtLeastOnce\n  retryOnNodeLoss: true\n", 200, token).ConfigureAwait(false);
                Assert.True(legacySame.FailedCount == 0 && legacySame.UpdatedCount == 0, "Agreeing fields re-apply unchanged");
                ManifestApply flipped = await ApplyAsync(host, head + "effect-legacy" + body, 200, token).ConfigureAwait(false);
                ManifestApplyItem change = flipped.Items.Single();
                Assert.True(change.Result == ManifestApplyResultEnum.Updated && change.Changes.Any(c => c.Field.Contains("effectPolicy", StringComparison.Ordinal)), "Diff names effectPolicy");

                ManifestApply failed = await ApplyAsync(host, head + "effect-conflict" + body + "  effectPolicy: AtMostOnce\n  retryOnNodeLoss: true\n", 400, token).ConfigureAwait(false);
                ManifestApplyItem item = failed.Items.Single();
                Assert.True(item.Result == ManifestApplyResultEnum.Failed && item.ErrorCode == "EffectPolicyConflict" && item.ErrorField == "effectPolicy", "Conflict fails with the field code: " + item.ErrorCode + " " + item.ErrorField + " " + item.Message);
            }
        }

        private static async Task McpManagementAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            using (TestMcpClient client = new TestMcpClient())
            {
                await client.ConnectAsync(host, null, token).ConfigureAwait(false);
                Agent agent = await client.CallAsync<Agent>("garrison_create_agent", new { configuration = new Agent { Name = "mcp-effect" } }, token).ConfigureAwait(false);
                Deployment plain = await client.CallAsync<Deployment>("garrison_create_deployment", new { configuration = new { name = "mcp-plain", agentId = agent.Id, harnessProfileId = "hrn_builtin_fake", weight = 0 } }, token).ConfigureAwait(false);
                Assert.True(plain.EffectPolicy == DeploymentEffectPolicyEnum.AtMostOnce && !plain.RetryOnNodeLoss, "MCP create defaults to AtMostOnce");
                Deployment legacy = await client.CallAsync<Deployment>("garrison_create_deployment", new { configuration = new { name = "mcp-legacy", agentId = agent.Id, harnessProfileId = "hrn_builtin_fake", weight = 0, retryOnNodeLoss = true } }, token).ConfigureAwait(false);
                Assert.Equal(DeploymentEffectPolicyEnum.AtLeastOnce, legacy.EffectPolicy, "MCP retryOnNodeLoss-only input maps");
                legacy.EffectPolicy = DeploymentEffectPolicyEnum.Journaled;
                Deployment updated = await client.CallAsync<Deployment>("garrison_update_deployment", new { deploymentId = legacy.Id, configuration = legacy }, token).ConfigureAwait(false);
                Assert.Equal(DeploymentEffectPolicyEnum.Journaled, updated.EffectPolicy, "MCP update carries effectPolicy");
                Assert.Equal(DeploymentEffectPolicyEnum.Journaled, (await client.CallAsync<Deployment>("garrison_get_deployment", new { deploymentId = legacy.Id }, token).ConfigureAwait(false)).EffectPolicy, "MCP read carries effectPolicy");

                string error = String.Empty;
                try
                {
                    await client.CallAsync("garrison_create_deployment", new { configuration = new { name = "mcp-conflict", agentId = agent.Id, harnessProfileId = "hrn_builtin_fake", weight = 0, effectPolicy = "AtMostOnce", retryOnNodeLoss = true } }, token).ConfigureAwait(false);
                }
                catch (TestAssertionException e)
                {
                    error = e.Message;
                }
                Assert.True(error.Contains("ValidationFailed", StringComparison.Ordinal) && error.Contains("effectPolicy", StringComparison.Ordinal), "MCP conflict names the field: " + error);
            }
        }

        private static async Task DelegatedChildAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                DatabaseDriverBase db = cluster.Server.Server.Context.Database;
                AuthenticationService authentication = cluster.Server.Server.Context.Authentication;
                Agent helper = await cluster.CreateAgentAsync("effect-helper", "builtin/fake", null, token, d => d.EffectPolicy = DeploymentEffectPolicyEnum.AtMostOnce).ConfigureAwait(false);
                // The lead's deployment pins a pool no worker has, so only this test claims its run.
                Agent lead = await cluster.CreateAgentAsync("effect-lead", "builtin/fake", a =>
                {
                    a.DelegationMode = DelegationModeEnum.AllowList;
                    a.DelegationAllowList.Add("effect-helper");
                }, token, d =>
                {
                    d.EffectPolicy = DeploymentEffectPolicyEnum.AtLeastOnce;
                    d.NodeSelector.Add(new DeploymentNodeSelector { Key = "zone", Value = "mars" });
                }).ConfigureAwait(false);

                Run parent = await CreateRunAsync(cluster.Server, lead, "Delegate under a different policy", token).ConfigureAwait(false);
                Assert.Equal(DeploymentEffectPolicyEnum.AtLeastOnce, parent.EffectPolicy, "Parent policy");
                long epoch = (await db.Runs.TryClaimAsync(parent.Id, "nod_ghost", "ghost", DateTime.UtcNow.AddMinutes(5), token).ConfigureAwait(false)) ?? throw new TestAssertionException("Claim failed.");
                Run claimed = Assert.NotNull(await db.Runs.ReadAsync(parent.Id, token).ConfigureAwait(false), "Claimed parent");
                string runToken = await authentication.IssueForRunAsync(claimed, epoch, DateTime.UtcNow.AddMinutes(10), token).ConfigureAwait(false);

                using (HttpClient asRun = new HttpClient())
                {
                    asRun.BaseAddress = new Uri(cluster.Server.BaseUrl);
                    asRun.DefaultRequestHeaders.Add("Authorization", "Bearer " + runToken);
                    asRun.Timeout = TimeSpan.FromSeconds(90);
                    InvokeRequest request = new InvokeRequest();
                    request.Input = "Delegated work";
                    request.Wait = true;
                    request.WaitSeconds = 60;
                    Run child = await HttpTestHelpers.SendAsync<Run>(asRun, HttpMethod.Post, "/v1.0/api/tenants/" + cluster.Server.TenantId + "/agents/" + helper.Id + "/invoke", request, 200, token).ConfigureAwait(false);
                    Assert.True(child.ParentRunId == parent.Id && child.Status == RunStatusEnum.Succeeded, "Delegated child ran: " + child.Status + " " + child.ErrorMessage);
                    Assert.Equal(DeploymentEffectPolicyEnum.AtMostOnce, child.EffectPolicy, "The child follows its own deployment's policy");
                }
            }
        }

        private static void FastLeases(TestCluster cluster)
        {
            RuntimeOptions runtime = cluster.Server.Server.Context.Get<RuntimeOptions>();
            runtime.LeaseDurationMs = 5000;
            runtime.MaintenanceIntervalMs = 500;
            // A loaded test machine must not look like a host pause, which defers lease expiry.
            runtime.PauseGraceMs = 60000;
        }

        private static async Task<Run> CreateRunAsync(TestServerHost host, Agent agent, string input, CancellationToken token)
        {
            InvokeRequest request = new InvokeRequest();
            request.Input = input;
            request.Wait = false;
            TestResponse response = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + host.TenantId + "/agents/" + agent.Id + "/invoke", request, token).ConfigureAwait(false);
            if (response.StatusCode != 200 && response.StatusCode != 202) throw new TestAssertionException("Invoke returned " + response.StatusCode + ": " + response.Body);
            return Serializer.Deserialize<Run>(response.Body) ?? throw new TestAssertionException("Empty run.");
        }

        private static async Task<Run> WaitForAsync(TestCluster cluster, string runId, Func<Run, bool> done, TimeSpan timeout, string what, CancellationToken token)
        {
            DateTime deadline = DateTime.UtcNow + timeout;
            Run? run = null;
            while (DateTime.UtcNow < deadline)
            {
                run = await cluster.Server.Server.Context.Database.Runs.ReadAsync(runId, token).ConfigureAwait(false);
                if (run != null && done(run)) return run;
                await Task.Delay(100, token).ConfigureAwait(false);
            }
            throw new TestAssertionException("Timed out waiting for " + what + " (run " + runId + " is " + run?.Status + ", attempt " + run?.Attempt + ").");
        }

        private static async Task<bool> AuditedAsync(TestServerHost host, string fragment, CancellationToken token)
        {
            EnumerationResult<AuditRecord> page = await host.Server.Context.Database.Audit.EnumerateAsync(null, new EnumerationQuery { MaxResults = 500 }, token).ConfigureAwait(false);
            return page.Objects.Any(a => (a.Description ?? String.Empty).Contains(fragment, StringComparison.Ordinal));
        }

        private static async Task<ManifestApply> ApplyAsync(TestServerHost host, string yaml, int expectedStatus, CancellationToken token)
        {
            using (HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Post, "/v1.0/api/tenants/" + host.TenantId + "/manifests/apply"))
            {
                request.Content = new StringContent(yaml, Encoding.UTF8, "application/yaml");
                using (HttpResponseMessage response = await host.AdminClient.SendAsync(request, token).ConfigureAwait(false))
                {
                    string responseBody = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                    if ((int)response.StatusCode != expectedStatus) throw new TestAssertionException("Manifest apply returned " + (int)response.StatusCode + " (expected " + expectedStatus + "): " + responseBody);
                    return Serializer.Deserialize<ManifestApply>(responseBody) ?? throw new TestAssertionException("Empty apply response.");
                }
            }
        }

        private static Run NewRun(RunStatusEnum status, DeploymentEffectPolicyEnum policy, int attempt, int maxAttempts)
        {
            Run run = new Run();
            run.Status = status;
            run.EffectPolicy = policy;
            run.Attempt = attempt;
            run.MaxAttempts = maxAttempts;
            return run;
        }

        #endregion
    }
}
