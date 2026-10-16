namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Net.Http;
    using System.Text;
    using Garrison.Core.Serialization;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Services;
    using Garrison.Server.Runtime;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>Tenant weighted service, candidate starvation, and atomic queue admission regressions (P12.36).</summary>
    public static class TenantSchedulingSuite
    {
        /// <summary>Build suites for each selected provider.</summary>
        /// <returns>Suites.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            List<TestSuiteDescriptor> suites = new List<TestSuiteDescriptor>();
            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "tenant-scheduling-" + provider.ToString().ToLowerInvariant();
                suites.Add(new TestSuiteDescriptor(id, "Tenant scheduling (" + provider + ")", new List<TestCaseDescriptor>
                {
                    new TestCaseDescriptor(id, "weighted-single-claims", "Fair service persists across single-slot claims; quiet tenant gets bounded service under 100x noisy backlog", ct => FairAsync(ct)),
                    new TestCaseDescriptor(id, "fair-window", "SQL candidate window includes quiet tenants despite older high-priority noisy backlog", ct => WindowAsync(provider, ct)),
                    new TestCaseDescriptor(id, "queue-depth-atomic", "Concurrent queue admission, independent scopes, idempotent retries, and capacity after claim", ct => AdmissionAsync(provider, ct)),
                    new TestCaseDescriptor(id, "queue-http", "REST QueueFull has Retry-After and an audit event without creating a rejected run", ct => HttpAsync(provider, ct)),
                    new TestCaseDescriptor(id, "tenant-weight", "Tenant scheduling weight persists and clamps", ct => WeightAsync(provider, ct))
                }));
            }
            return suites;
        }

        private static Task FairAsync(CancellationToken token)
        {
            token.ThrowIfCancellationRequested();
            TenantFairQueue queue = new TenantFairQueue();
            Dictionary<string, int> weights = new Dictionary<string, int> { ["noisy"] = 4, ["quiet"] = 1 };
            int quiet = 0;
            int gap = 0;
            int worstGap = 0;
            for (int iteration = 0; iteration < 500; iteration++)
            {
                List<Run> runs = Enumerable.Range(0, 100).Select(i => new Run { Status = RunStatusEnum.Queued, TenantId = "noisy", Priority = 100, CreatedUtc = DateTime.UtcNow.AddMinutes(-10) }).ToList();
                runs.Add(new Run { Status = RunStatusEnum.Queued, TenantId = "quiet", Priority = 0 });
                Run next = queue.Order(runs, weights)[0];
                queue.Claimed(next.TenantId, weights[next.TenantId], weights.Keys);
                if (next.TenantId == "quiet") { quiet++; worstGap = Math.Max(worstGap, gap); gap = 0; }
                else gap++;
            }
            Assert.True(quiet >= 90 && quiet <= 110, "4:1 weighted share over repeated single-slot claims: " + quiet);
            Assert.True(worstGap <= 6, "quiet tenant waits at most six noisy claims: " + worstGap);
            return Task.CompletedTask;
        }

        private static async Task HttpAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 0, token).ConfigureAwait(false))
            {
                Agent agent = await cluster.CreateAgentAsync("queue-bounded", token: token).ConfigureAwait(false);
                cluster.Server.Server.Context.Get<RuntimeOptions>().QueueDepthAgent = 1;
                string path = "/v1.0/api/tenants/" + cluster.Server.TenantId + "/agents/" + agent.Id + "/invoke";
                await HttpTestHelpers.SendAsync<Run>(cluster.Server.AdminClient, HttpMethod.Post, path, new InvokeRequest { Wait = false, Input = "first" }, 202, token).ConfigureAwait(false);
                using (HttpResponseMessage response = await cluster.Server.AdminClient.PostAsync(path, new StringContent(Serializer.Serialize(new InvokeRequest { Wait = false, Input = "second" }), Encoding.UTF8, "application/json"), token).ConfigureAwait(false))
                {
                    Assert.Equal(429, (int)response.StatusCode, "queue status");
                    Assert.True(response.Headers.Contains("Retry-After"), "retry hint");
                    Assert.True((await response.Content.ReadAsStringAsync(token).ConfigureAwait(false)).Contains("QueueFull", StringComparison.Ordinal), "stable queue error");
                }
                Garrison.Core.Enumeration.EnumerationResult<AuditRecord> audit = await cluster.Server.Server.Context.Database.Audit.EnumerateAsync(cluster.Server.TenantId, new Garrison.Core.Enumeration.EnumerationQuery { MaxResults = 1000 }, token).ConfigureAwait(false);
                Assert.True(audit.Objects.Any(a => a.EventType == AuditEventTypeEnum.QueueFull && a.ResourceId == agent.Id), "tenant scoped refusal audit");
            }
        }

        private static async Task WeightAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                Tenant tenant = await db.Tenants.CreateAsync(new Tenant { Name = "weighted", SchedulingWeight = 4 }, token).ConfigureAwait(false);
                Assert.Equal(4, (await db.Tenants.ReadAsync(tenant.Id, token).ConfigureAwait(false))!.SchedulingWeight, "weight round trip");
                tenant.SchedulingWeight = 2000;
                await db.Tenants.UpdateAsync(tenant, token).ConfigureAwait(false);
                Assert.Equal(1000, (await db.Tenants.ReadAsync(tenant.Id, token).ConfigureAwait(false))!.SchedulingWeight, "weight upper bound");
            }
        }

        private static async Task WindowAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                for (int i = 0; i < 100; i++) await db.Runs.CreateAsync(new Run { Status = RunStatusEnum.Queued, TenantId = "noisy", AgentId = "a", DeploymentId = "d", HarnessType = HarnessTypeEnum.Generic, Priority = 100 }, token).ConfigureAwait(false);
                Run quiet = await db.Runs.CreateAsync(new Run { Status = RunStatusEnum.Queued, TenantId = "quiet", AgentId = "b", DeploymentId = "e", HarnessType = HarnessTypeEnum.Generic }, token).ConfigureAwait(false);
                ClaimCandidateFilter filter = new ClaimCandidateFilter { HarnessTypes = new List<HarnessTypeEnum> { HarnessTypeEnum.Generic }, Limit = 16, TenantFairWindow = true };
                List<Run> window = await db.Runs.ListClaimCandidatesAsync(filter, token).ConfigureAwait(false);
                Assert.True(window.Any(r => r.Id == quiet.Id), "quiet tenant appears in bounded fair window");
                filter.AllowedTenantIds = new List<string> { "noisy" };
                Assert.True((await db.Runs.ListClaimCandidatesAsync(filter, token).ConfigureAwait(false)).All(r => r.TenantId == "noisy"), "dedicated pool tenant boundary retained");
            }
        }

        private static async Task AdmissionAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                QueueDepthLimits limit = new QueueDepthLimits { Cluster = 4, Tenant = 3, Agent = 2 };
                List<Task<bool>> work = Enumerable.Range(0, 20).Select(async index =>
                {
                    try { await db.Runs.CreateAsync(new Run { Status = RunStatusEnum.Queued, TenantId = "t", AgentId = "a", DeploymentId = "d" }, limit, token).ConfigureAwait(false); return true; }
                    catch (QueueFullException e) { Assert.Equal("Agent", e.Scope, "agent scope"); return false; }
                }).ToList();
                bool[] admitted = await Task.WhenAll(work).ConfigureAwait(false);
                Assert.Equal(2, admitted.Count(v => v), "concurrent agent limit exact");
                Run third = await db.Runs.CreateAsync(new Run { Status = RunStatusEnum.Queued, TenantId = "t", AgentId = "b", DeploymentId = "d", IdempotencyKey = "same", CallerId = "caller" }, limit, token).ConfigureAwait(false);
                Run retry = await db.Runs.CreateAsync(new Run { Status = RunStatusEnum.Queued, TenantId = "t", AgentId = "b", DeploymentId = "d", IdempotencyKey = "same", CallerId = "caller" }, limit, token).ConfigureAwait(false);
                Assert.Equal(third.Id, retry.Id, "idempotent retry bypasses full tenant queue");
                try { await db.Runs.CreateAsync(new Run { Status = RunStatusEnum.Queued, TenantId = "t", AgentId = "c", DeploymentId = "d" }, limit, token).ConfigureAwait(false); throw new TestAssertionException("tenant limit accepted"); }
                catch (QueueFullException e) { Assert.Equal("Tenant", e.Scope, "tenant scope"); }
                await db.Runs.CreateAsync(new Run { Status = RunStatusEnum.Queued, TenantId = "other", AgentId = "c", DeploymentId = "d" }, limit, token).ConfigureAwait(false);
                try { await db.Runs.CreateAsync(new Run { Status = RunStatusEnum.Queued, TenantId = "third", AgentId = "c", DeploymentId = "d" }, limit, token).ConfigureAwait(false); throw new TestAssertionException("cluster limit accepted"); }
                catch (QueueFullException e) { Assert.Equal("Cluster", e.Scope, "cluster scope"); }
                await db.Runs.TryClaimAsync(third.Id, "node", "node", DateTime.UtcNow.AddMinutes(1), token).ConfigureAwait(false);
                await db.Runs.CreateAsync(new Run { Status = RunStatusEnum.Queued, TenantId = "t", AgentId = "b", DeploymentId = "d" }, limit, token).ConfigureAwait(false);
            }
        }
    }
}
