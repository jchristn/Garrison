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
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Server.Runtime;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>Placement dry-run correctness, privacy, and no-mutation regressions for each database provider.</summary>
    public static class PlacementExplanationSuite
    {
        /// <summary>Build provider suites.</summary>
        /// <returns>Suites.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            List<TestSuiteDescriptor> suites = new List<TestSuiteDescriptor>();
            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "placement-explanation-" + provider.ToString().ToLowerInvariant();
                suites.Add(new TestSuiteDescriptor(id, "Placement explanation (" + provider + ")", new List<TestCaseDescriptor>
                {
                    new TestCaseDescriptor(id, "remote-admission-and-disabled-quota", "Remote placement requires no hosted deployment and shares registration TTL/active checks; disabled quotas do not reject", ct => RemoteAsync(provider, ct)),
                    new TestCaseDescriptor(id, "synchronous-wait-headroom", "Bounded waits return accepted run IDs and release budget on completion while worker protocol progresses", ct => WaitBudgetAsync(provider, ct)),
                    new TestCaseDescriptor(id, "static-privacy-no-mutation", "Dry run shares placement filters, hides dedicated inventory and changes no epoch or lease", ct => StaticAsync(provider, ct)),
                    new TestCaseDescriptor(id, "capacity-affinity-and-quota", "Dry run explains actual node capacity, affinity, deployment and quota gates", ct => CapacityAsync(provider, ct))
                }));
            }
            return suites;
        }

        private static async Task RemoteAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 0, token).ConfigureAwait(false))
            {
                DatabaseDriverBase db = cluster.Server.Server.Context.Database;
                Agent agent = await db.Agents.CreateAsync(new Agent { TenantId = cluster.Server.TenantId, Name = "placement-remote", Kind = AgentKindEnum.Remote, RemoteProtocol = RemoteProtocolEnum.Mcp, RemoteEndpointUrl = "https://example.invalid/mcp", McpToolName = "invoke", RegistrationTtlSeconds = 60, LastRegisteredUtc = DateTime.UtcNow }, token).ConfigureAwait(false);
                Run run = await db.Runs.CreateAsync(new Run { TenantId = agent.TenantId, AgentId = agent.Id, AgentName = agent.Name, Executor = RunExecutorEnum.RemoteMcp, HarnessType = HarnessTypeEnum.Generic, Status = RunStatusEnum.Queued }, token).ConfigureAwait(false);
                Node node = Worker("remote-worker");
                node.Executors = new List<RunExecutorEnum> { RunExecutorEnum.RemoteMcp };
                node = await db.Nodes.CreateAsync(node, token).ConfigureAwait(false);
                await db.UsageQuotas.CreateAsync(new UsageQuota { TenantId = agent.TenantId, Name = "disabled", Scope = UsageQuotaScopeEnum.Tenant, ResourceId = agent.TenantId, MaxConcurrentRuns = 0, DailyTokenLimit = 0, DailyCostUsdLimit = 0, EnforcementEnabled = false }, token).ConfigureAwait(false);
                PlacementExplanationService service = new PlacementExplanationService(db);
                RunPlacementResponse explanation = await service.ExplainAsync(run, token).ConfigureAwait(false);
                Assert.True(explanation.Eligible && explanation.AdmissionRejection == null, "remote run has no deployment and disabled quota does not enforce");
                agent.LastRegisteredUtc = DateTime.UtcNow.AddMinutes(-2);
                await db.Agents.UpdateAsync(agent, token).ConfigureAwait(false);
                explanation = await service.ExplainAsync(run, token).ConfigureAwait(false);
                Assert.True(!explanation.Eligible && explanation.Reasons.Contains("AdmissionRejected") && explanation.AdmissionRejection!.Contains("RemoteRegistrationExpired", StringComparison.Ordinal), "same TTL rejection as dispatch");
                agent.LastRegisteredUtc = DateTime.UtcNow;
                agent.Active = false;
                await db.Agents.UpdateAsync(agent, token).ConfigureAwait(false);
                explanation = await service.ExplainAsync(run, token).ConfigureAwait(false);
                Assert.True(!explanation.Eligible && explanation.AdmissionRejection!.Contains("deactivated", StringComparison.Ordinal), "same active registration rejection as dispatch");
            }
        }

        private static async Task WaitBudgetAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 0, token).ConfigureAwait(false))
            {
                RuntimeOptions options = cluster.Server.Server.Context.Get<RuntimeOptions>();
                options.MaxSynchronousWaiters = 2;
                Agent agent = await cluster.CreateAgentAsync("wait-budget", token: token).ConfigureAwait(false);
                string path = "/v1.0/api/tenants/" + cluster.Server.TenantId + "/agents/" + agent.Id + "/invoke";
                Task<Run> first = HttpTestHelpers.SendAsync<Run>(cluster.Server.AdminClient, HttpMethod.Post, path, new InvokeRequest { Input = "first", Wait = true, WaitSeconds = 30 }, 200, token);
                Task<Run> second = HttpTestHelpers.SendAsync<Run>(cluster.Server.AdminClient, HttpMethod.Post, path, new InvokeRequest { Input = "second", Wait = true, WaitSeconds = 30 }, 200, token);
                DateTime deadline = DateTime.UtcNow.AddSeconds(10);
                while (options.SynchronousWaits.Active < 2 && DateTime.UtcNow < deadline) await Task.Delay(10, token).ConfigureAwait(false);
                Assert.Equal(2, options.SynchronousWaits.Active, "two requests actually hold wait slots");
                Run fallback = await HttpTestHelpers.SendAsync<Run>(cluster.Server.AdminClient, HttpMethod.Post, path, new InvokeRequest { Input = "fallback", Wait = true, WaitSeconds = 30 }, 202, token).ConfigureAwait(false);
                Assert.True(fallback.Status == RunStatusEnum.Queued && !String.IsNullOrEmpty(fallback.Id), "over-budget invocation accepted exactly once with polling ID");
                Assert.Equal(2, options.SynchronousWaits.Active, "fallback does not occupy a request wait slot");
                await cluster.AddWorkerAsync("headroom-worker", token).ConfigureAwait(false);
                Run[] completed = await Task.WhenAll(first, second).ConfigureAwait(false);
                Assert.True(completed.All(r => r.Status == RunStatusEnum.Succeeded), "worker register, lease, started, events and completion remain live");
                Run? fallbackCompleted = await cluster.Server.Server.Context.Get<RunService>().WaitAsync(fallback.TenantId, fallback.Id, 10, token).ConfigureAwait(false);
                Assert.True(fallbackCompleted?.Status == RunStatusEnum.Succeeded, "accepted fallback is the same completed run");
                Assert.Equal(0, options.SynchronousWaits.Active, "all slots released after completion");
                options.MaxSynchronousWaiters = 5000;
                Assert.Equal(768, options.MaxSynchronousWaiters, "configuration cannot consume Watson's entire request cap");
            }
        }

        private static Node Worker(string name)
        {
            return new Node { Name = name, Status = NodeStatusEnum.Ready, RegisteredUtc = DateTime.UtcNow, Capabilities = new List<NodeCapability> { new NodeCapability { HarnessType = HarnessTypeEnum.Generic, Available = true } } };
        }

        private static async Task StaticAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 0, token).ConfigureAwait(false))
            {
                DatabaseDriverBase db = cluster.Server.Server.Context.Database;
                Agent agent = await cluster.CreateAgentAsync("placement-static", token: token).ConfigureAwait(false);
                Run run = await HttpTestHelpers.SendAsync<Run>(cluster.Server.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + cluster.Server.TenantId + "/agents/" + agent.Id + "/invoke", new InvokeRequest { Input = "dry run", Wait = false }, 202, token).ConfigureAwait(false);
                Node good = await db.Nodes.CreateAsync(Worker("eligible"), token).ConfigureAwait(false);
                Node unavailable = Worker("unavailable");
                unavailable.Capabilities[0].Available = false;
                unavailable = await db.Nodes.CreateAsync(unavailable, token).ConfigureAwait(false);
                Node inactive = Worker("inactive");
                inactive.Active = false;
                inactive = await db.Nodes.CreateAsync(inactive, token).ConfigureAwait(false);
                Tenant other = await db.Tenants.CreateAsync(new Tenant { Name = "private" }, token).ConfigureAwait(false);
                NodePool privatePool = await db.NodePools.CreateAsync(new NodePool { Name = "private", Tenants = new List<string> { other.Id } }, token).ConfigureAwait(false);
                Node hidden = Worker("private-worker");
                hidden.NodePoolId = privatePool.Id;
                hidden = await db.Nodes.CreateAsync(hidden, token).ConfigureAwait(false);
                string path = "/v1.0/api/tenants/" + run.TenantId + "/runs/" + run.Id + "/placement";
                for (int attempt = 0; attempt < 3; attempt++)
                {
                    RunPlacementResponse explanation = await HttpTestHelpers.SendAsync<RunPlacementResponse>(cluster.Server.AdminClient, HttpMethod.Get, path, null, 200, token).ConfigureAwait(false);
                    Assert.True(explanation.Eligible && explanation.Nodes.Single(n => n.NodeId == good.Id).Eligible, "capable worker eligible");
                    Assert.True(explanation.Nodes.Single(n => n.NodeId == unavailable.Id).Reasons.Contains("HarnessUnavailable"), "missing harness explained");
                    Assert.True(explanation.Nodes.Single(n => n.NodeId == inactive.Id).Reasons.Contains("NodeInactive"), "inactive explained");
                    Assert.True(!explanation.Nodes.Any(n => n.NodeId == hidden.Id), "other tenant dedicated node omitted");
                }
                Run after = (await db.Runs.ReadAsync(run.TenantId, run.Id, token).ConfigureAwait(false))!;
                Assert.Equal(run.LeaseEpoch, after.LeaseEpoch, "no epoch increment");
                Assert.True(after.LeaseNodeId == null && after.Status == RunStatusEnum.Queued, "no lease or state change");
                await HttpTestHelpers.SendAsync<RunPlacementResponse>(cluster.Server.AdminClient, HttpMethod.Get, "/v1.0/api/tenants/" + other.Id + "/runs/" + run.Id + "/placement", null, 404, token).ConfigureAwait(false);
                run.Requirements = new List<RunRequirement> { new RunRequirement { Key = "zone", Value = "west" } };
                Assert.True(PlacementRules.Rejections(good, null, run).Contains("NodeSelectorMismatch"), "selectors use shared filter");
                run.TrustLevel = DeploymentTrustLevelEnum.Untrusted;
                run.RequiredCapabilities.Isolation = ExecutorIsolationEnum.Container;
                Assert.True(PlacementRules.Rejections(good, null, run).Contains("ExecutorCapabilitiesUnsatisfied"), "isolation use shared capability filter");
            }
        }

        private static async Task CapacityAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 0, token).ConfigureAwait(false))
            {
                DatabaseDriverBase db = cluster.Server.Server.Context.Database;
                Agent agent = await cluster.CreateAgentAsync("placement-capacity", token: token).ConfigureAwait(false);
                Run run = await HttpTestHelpers.SendAsync<Run>(cluster.Server.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + cluster.Server.TenantId + "/agents/" + agent.Id + "/invoke", new InvokeRequest { Input = "capacity", Wait = false }, 202, token).ConfigureAwait(false);
                Node full = Worker("full");
                full.MaxConcurrentRuns = 1;
                full = await db.Nodes.CreateAsync(full, token).ConfigureAwait(false);
                Node affinity = await db.Nodes.CreateAsync(Worker("affinity"), token).ConfigureAwait(false);
                Run active = await db.Runs.CreateAsync(new Run { TenantId = run.TenantId, AgentId = run.AgentId, AgentName = run.AgentName, DeploymentId = run.DeploymentId, Status = RunStatusEnum.Running, LeaseNodeId = full.Id }, token).ConfigureAwait(false);
                run.AffinityNodeId = affinity.Id;
                run.AffinityUntilUtc = DateTime.UtcNow.AddMinutes(1);
                PlacementExplanationService service = new PlacementExplanationService(db);
                RunPlacementResponse explanation = await service.ExplainAsync(run, token).ConfigureAwait(false);
                Assert.True(explanation.Nodes.Single(n => n.NodeId == full.Id).Reasons.Contains("NodeCapacityFull"), "active database leases consume node capacity");
                Assert.True(explanation.Nodes.Single(n => n.NodeId == full.Id).Reasons.Contains("SessionAffinityWait"), "affinity uses scheduler rule");
                Assert.True(explanation.Nodes.Single(n => n.NodeId == affinity.Id).Eligible, "affinity worker remains eligible");
                full.ChildReserveSlots = 1;
                await db.Nodes.UpdateAsync(full, token).ConfigureAwait(false);
                run.AffinityNodeId = null;
                run.ParentRunId = active.Id;
                run.Kind = RunKindEnum.Delegated;
                ChildWaitAdmission wait = await db.Runs.BeginChildWaitAsync(new ChildWaitRequest { TenantId = run.TenantId, ParentRunId = active.Id, ChildRunId = run.Id }, token).ConfigureAwait(false);
                Assert.True(wait.Admitted && await db.Runs.IsWaitedChildAsync(run.TenantId, run.Id, token).ConfigureAwait(false), "active wait is visible to shared SQL predicate");
                explanation = await service.ExplainAsync(run, token).ConfigureAwait(false);
                Assert.True(explanation.Nodes.Single(n => n.NodeId == full.Id).Eligible, "waiting parent's child can use reserve despite full normal slots");
                await db.Runs.EndChildWaitAsync(wait.WaitId!, token).ConfigureAwait(false);
                explanation = await service.ExplainAsync(run, token).ConfigureAwait(false);
                Assert.True(explanation.Nodes.Single(n => n.NodeId == full.Id).Reasons.Contains("NodeCapacityFull"), "ending wait closes reserve eligibility");
                Deployment deployment = (await db.Deployments.ReadAsync(run.TenantId, run.DeploymentId, token).ConfigureAwait(false))!;
                deployment.MaxConcurrentRuns = 1;
                await db.Deployments.UpdateAsync(deployment, token).ConfigureAwait(false);
                UsageQuota quota = await db.UsageQuotas.CreateAsync(new UsageQuota { TenantId = run.TenantId, Name = "placement-quota", EnforcementEnabled = true, Scope = UsageQuotaScopeEnum.Tenant, ResourceId = run.TenantId, MaxConcurrentRuns = 1, DailyTokenLimit = 0 }, token).ConfigureAwait(false);
                explanation = await service.ExplainAsync(run, token).ConfigureAwait(false);
                Assert.True(!explanation.Eligible && explanation.Reasons.Contains("DeploymentConcurrencyLimit"), "deployment full globally");
                Assert.True(explanation.Reasons.Contains("QuotaConcurrencyLimit") && explanation.Reasons.Contains("QuotaDailyTokenLimit"), "claim quota gates explained");
                Assert.True(!await db.Runs.IsWaitedChildAsync(run.TenantId, run.Id, token).ConfigureAwait(false), "ordinary run cannot occupy reserve");
                run.Status = RunStatusEnum.Succeeded;
                Assert.True((await service.ExplainAsync(run, token).ConfigureAwait(false)).Reasons.Contains("RunNotQueued"), "terminal cannot claim");
            }
        }
    }
}
