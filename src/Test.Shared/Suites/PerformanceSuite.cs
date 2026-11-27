namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Net.Http;
    using System.Net.Http.Headers;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Security;
    using Garrison.Core.Serialization;
    using Garrison.Core.Services;
    using Garrison.Core.Telemetry;
    using Garrison.ProviderHarness;
    using Garrison.Server.Routes;
    using Garrison.Server.Runtime;
    using Garrison.Server.Services;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Performance signals (AUTONOMOUS_AGENTS_PLAN.md AA11.1 to AA11.3, AA11.10): rollups per agent and unit subtree over a
    /// window against seeded runs, the subordinate performance tool for unit leads (their subtree only), scheduled checks
    /// (EvalSet triggers) whose results appear in performance, and agents refused on EvalSet triggers and check results.
    /// </summary>
    public static class PerformanceSuite
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
            unit.Add(new TestCaseDescriptor("performance-unit", "accumulator", "Counts, success and escalation rates, cost, nearest-rank latency percentiles, eval score, and sample runs (failed first, at most 5); EvalSet is a trigger target and the scheduled checks counter is catalogued", AccumulatorAsync));
            suites.Add(new TestSuiteDescriptor("performance-unit", "Performance: rollup arithmetic", unit));
            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "performance-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                cases.Add(new TestCaseDescriptor(id, "rollup", "GET /organizations/{id}/performance rolls seeded runs, escalations, loop-guard refusals, and eval runs up by agent and unit subtree, leaves out eval runs and outsiders, restricts to unitId, validates the window, and answers 404 across tenants (" + provider + ")", ct => RollupAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "lead", "garrison_subordinate_performance shows a unit lead its subtree and refuses units outside it (OutsideSubtree) and agents that lead nothing (NotAUnitLead); people pass the organization (" + provider + ")", ct => LeadAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "scheduled-check", "An EvalSet trigger validates its set, deployment, count, and run-as user, fires a RecentInputs eval run linked both ways, records NoRecentInputs as a failed fire, and its result appears in performance (" + provider + ")", ct => ScheduledCheckAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "agent-refusal", "Agents cannot create or change EvalSet triggers or cancel a check's eval run (" + provider + ")", ct => AgentRefusalAsync(provider, ct)));
                suites.Add(new TestSuiteDescriptor(id, "Performance (" + provider + ")", cases));
            }
            return suites;
        }

        #endregion

        #region Private-Methods

        private static string T(TestServerHost host)
        {
            return "/v1.0/api/tenants/" + host.TenantId;
        }

        private static Task AccumulatorAsync(CancellationToken token)
        {
            DateTime now = new DateTime(2026, 11, 26, 12, 0, 0, DateTimeKind.Utc);
            PerformanceAccumulator empty = new PerformanceAccumulator();
            PerformanceMetrics none = empty.ToMetrics();
            Assert.True(none.Runs == 0 && none.SuccessRate == null && none.EscalationRate == null && none.LatencyP50Ms == null && none.EvalScore == null && none.SampleRunIds.Count == 0, "No runs: nulls and zeros");

            PerformanceAccumulator accumulator = new PerformanceAccumulator();
            List<Run> runs = new List<Run>();
            for (int i = 0; i < 6; i++) runs.Add(Seeded("run_s" + i, RunStatusEnum.Succeeded, now.AddMinutes(i), (i + 1) * 100, 0.25));
            runs.Add(Seeded("run_f1", RunStatusEnum.Failed, now.AddMinutes(10), 1000, 0.5));
            runs.Add(Seeded("run_f2", RunStatusEnum.TimedOut, now.AddMinutes(11), 2000, null));
            runs.Add(Seeded("run_c1", RunStatusEnum.Cancelled, now.AddMinutes(12), 50, null));
            Run running = Seeded("run_r1", RunStatusEnum.Running, now.AddMinutes(13), 0, null);
            running.CompletedUtc = null;
            running.TotalMs = null;
            runs.Add(running);
            accumulator.AddRuns(runs);
            accumulator.AddRuns(new[] { runs[0] });
            accumulator.AddEscalations(3);
            accumulator.AddLoopGuardRejections(2);
            accumulator.AddEvalRuns(new[] { new EvalRun { Id = "evr_a", Score = 0.5 }, new EvalRun { Id = "evr_b", Score = 1.0 }, new EvalRun { Id = "evr_c", Score = null } });
            PerformanceMetrics m = accumulator.ToMetrics();
            Assert.True(m.Runs == 10 && m.Succeeded == 6 && m.Failed == 2 && m.Cancelled == 1, "Counts, a repeated run counted once: " + Serializer.Serialize(m));
            Assert.Equal(0.75, m.SuccessRate ?? -1, "successRate is succeeded over succeeded plus failed");
            Assert.Equal(2.0, m.CostUsd, "Cost sums");
            Assert.True(m.LatencyP50Ms == 400 && m.LatencyP95Ms == 2000 && m.LatencyP99Ms == 2000, "Nearest-rank percentiles over the 9 finished runs: " + m.LatencyP50Ms + ", " + m.LatencyP95Ms + ", " + m.LatencyP99Ms);
            Assert.True(m.EscalationsRaised == 3 && m.EscalationRate == 0.3 && m.LoopGuardRejections == 2, "Escalations and loop guards: " + Serializer.Serialize(m));
            Assert.True(m.EvalRuns == 2 && m.EvalScore == 0.75, "The mean score of scored eval runs");
            Assert.True(m.SampleRunIds.SequenceEqual(new[] { "run_f2", "run_f1", "run_s5", "run_s4", "run_s3" }), "Newest failures first, then newest successes, 5 at most: " + String.Join(", ", m.SampleRunIds));

            Assert.True(Enum.IsDefined(TriggerTargetTypeEnum.EvalSet), "EvalSet is a trigger target");
            Assert.True(GarrisonMetricCatalog.All().Any(d => d.Name == "garrison.evals.scheduled_checks" && d.Dashboard == "garrison-autonomy"), "The scheduled checks counter is catalogued");
            return Task.CompletedTask;
        }

        private static Run Seeded(string id, RunStatusEnum status, DateTime created, long totalMs, double? cost)
        {
            Run run = new Run();
            run.Id = id;
            run.AgentId = "agt_x";
            run.Status = status;
            run.CreatedUtc = created;
            run.QueuedUtc = created;
            run.CompletedUtc = created.AddMilliseconds(totalMs);
            run.TotalMs = totalMs;
            run.CostUsd = cost;
            return run;
        }

        private static async Task<Run> RunAsync(TestServerHost host, Agent agent, RunStatusEnum status, double cost, long totalMs, RunKindEnum kind, CancellationToken token)
        {
            Run run = OrganizationSuite.RunOf(host, agent);
            run.Kind = kind;
            run.Status = status;
            run.CostUsd = cost;
            run.QueuedUtc = DateTime.UtcNow.AddMilliseconds(-totalMs);
            run.CompletedUtc = status == RunStatusEnum.Running ? null : DateTime.UtcNow;
            return await host.Server.Context.Database.Runs.CreateAsync(run, token).ConfigureAwait(false);
        }

        private static async Task RefusedMessageAsync(TestServerHost host, Agent sender, Agent recipient, MessageRejectionEnum reason, CancellationToken token)
        {
            AgentMessage message = new AgentMessage();
            message.TenantId = host.TenantId;
            message.ThreadId = message.Id;
            message.SenderAgentId = sender.Id;
            message.SenderAgentName = sender.Name;
            message.RecipientAgentId = recipient.Id;
            message.RecipientAgentName = recipient.Name;
            message.Subject = "Seeded";
            message.Status = MessageStatusEnum.Rejected;
            message.RejectionReason = reason;
            await host.Server.Context.Database.AgentMessages.CreateAsync(message, token).ConfigureAwait(false);
        }

        private static async Task RollupAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                host.Server.Context.Get<MaintenanceService>().Keepers = null;
                string b = T(host) + "/organizations";
                OrgFixture f = await OrganizationSuite.FixtureAsync(host, "pf", token).ConfigureAwait(false);
                Deployment workerDeployment = await OrganizationSuite.DeploymentAsync(host, f.Worker, token).ConfigureAwait(false);

                Run ok1 = await RunAsync(host, f.Worker, RunStatusEnum.Succeeded, 0.5, 1000, RunKindEnum.Invoke, token).ConfigureAwait(false);
                Run ok2 = await RunAsync(host, f.Worker, RunStatusEnum.Succeeded, 0.5, 3000, RunKindEnum.Keeper, token).ConfigureAwait(false);
                Run bad = await RunAsync(host, f.Worker, RunStatusEnum.Failed, 0.25, 2000, RunKindEnum.Invoke, token).ConfigureAwait(false);
                await RunAsync(host, f.Worker, RunStatusEnum.Succeeded, 9, 100, RunKindEnum.Eval, token).ConfigureAwait(false);
                await RunAsync(host, f.Worker, RunStatusEnum.Succeeded, 9, 100, RunKindEnum.Shadow, token).ConfigureAwait(false);
                await RunAsync(host, f.Worker, RunStatusEnum.Succeeded, 9, 100, RunKindEnum.Playground, token).ConfigureAwait(false);
                Run leadOk = await RunAsync(host, f.Lead, RunStatusEnum.Succeeded, 1, 500, RunKindEnum.Invoke, token).ConfigureAwait(false);
                await RunAsync(host, f.Lead, RunStatusEnum.Cancelled, 0, 100, RunKindEnum.Invoke, token).ConfigureAwait(false);
                await RunAsync(host, f.Seller, RunStatusEnum.Succeeded, 2, 700, RunKindEnum.Invoke, token).ConfigureAwait(false);
                await RunAsync(host, f.Stranger, RunStatusEnum.Failed, 50, 700, RunKindEnum.Invoke, token).ConfigureAwait(false);

                Escalation asked = await host.Server.Context.Database.Escalations.CreateAsync(new Escalation { TenantId = host.TenantId, AgentId = f.Worker.Id, AgentName = f.Worker.Name, Question = "May I restart the queue?" }, token).ConfigureAwait(false);
                await host.Server.Context.Database.Escalations.CreateAsync(new Escalation { TenantId = host.TenantId, AgentId = f.Worker.Id, AgentName = f.Worker.Name, Question = "May I restart the queue?", ParentEscalationId = asked.Id }, token).ConfigureAwait(false);
                await host.Server.Context.Database.Escalations.CreateAsync(new Escalation { TenantId = host.TenantId, AgentId = f.Stranger.Id, Question = "Outside" }, token).ConfigureAwait(false);
                await RefusedMessageAsync(host, f.Worker, f.Seller, MessageRejectionEnum.HopLimit, token).ConfigureAwait(false);
                await RefusedMessageAsync(host, f.Worker, f.Seller, MessageRejectionEnum.LineRate, token).ConfigureAwait(false);
                await RefusedMessageAsync(host, f.Worker, f.Seller, MessageRejectionEnum.NoLine, token).ConfigureAwait(false);
                await RefusedMessageAsync(host, f.Seller, f.Worker, MessageRejectionEnum.Frozen, token).ConfigureAwait(false);
                await host.Server.Context.Database.EvalRuns.CreateAsync(new EvalRun { TenantId = host.TenantId, SetId = "evs_seeded", SetName = "seeded", SetVersion = 1, TargetType = EvalRunTargetEnum.Deployment, AgentId = f.Worker.Id, DeploymentId = workerDeployment.Id, Status = EvalRunStatusEnum.Completed, Score = 0.8, TotalCases = 1, CompletedCases = 1, CompletedUtc = DateTime.UtcNow }, token).ConfigureAwait(false);
                await host.Server.Context.Database.EvalRuns.CreateAsync(new EvalRun { TenantId = host.TenantId, SetId = "evs_seeded", SetName = "seeded", SetVersion = 1, TargetType = EvalRunTargetEnum.Deployment, AgentId = f.Worker.Id, DeploymentId = workerDeployment.Id, Status = EvalRunStatusEnum.Running, TotalCases = 1 }, token).ConfigureAwait(false);

                OrgPerformance all = await HttpTestHelpers.SendAsync<OrgPerformance>(host.AdminClient, HttpMethod.Get, b + "/" + f.Org.Name + "/performance", null, 200, token).ConfigureAwait(false);
                Assert.True(all.OrganizationId == f.Org.Id && all.Name == f.Org.Name && all.ToUtc > all.FromUtc && Math.Abs((all.ToUtc - all.FromUtc).TotalDays - 7) < 0.01 && !all.Truncated, "Seven days by default: " + all.FromUtc.ToString("o") + " to " + all.ToUtc.ToString("o"));
                Assert.True(all.Units.Count == 3 && all.Units[0].UnitId == f.Root.Id && all.Units[0].ParentUnitId == null && all.Units[0].LeadAgentId == f.Ceo.Id, "Units in chart order, root first: " + Serializer.Serialize(all.Units.Select(u => u.UnitName)));
                Assert.True(all.Agents.Count == 4 && all.Agents.Select(a => a.AgentId).ToHashSet().SetEquals(new[] { f.Ceo.Id, f.Lead.Id, f.Worker.Id, f.Seller.Id }), "Every positioned agent and no outsider: " + Serializer.Serialize(all.Agents.Select(a => a.AgentName)));

                AgentPerformance worker = all.Agents.Single(a => a.AgentId == f.Worker.Id);
                PerformanceMetrics w = worker.Metrics;
                Assert.True(worker.UnitId == f.Ops.Id && !worker.IsLead && worker.AgentName == f.Worker.Name, "The worker sits in ops as a member");
                Assert.True(w.Runs == 3 && w.Succeeded == 2 && w.Failed == 1 && w.Cancelled == 0, "Eval, shadow, and playground runs are left out: " + Serializer.Serialize(w));
                Assert.True(Math.Abs((w.SuccessRate ?? 0) - 0.6667) < 0.001 && Math.Abs(w.CostUsd - 1.25) < 1e-9, "Success rate and cost: " + Serializer.Serialize(w));
                Assert.True(w.LatencyP50Ms.HasValue && w.LatencyP50Ms >= 1900 && w.LatencyP50Ms <= 2200 && w.LatencyP99Ms >= 2900, "Latency percentiles over finished runs: " + Serializer.Serialize(w));
                Assert.True(w.EscalationsRaised == 1 && Math.Abs((w.EscalationRate ?? 0) - 0.3333) < 0.001, "One escalation (its escalated-up copy is not counted again): " + Serializer.Serialize(w));
                Assert.True(w.LoopGuardRejections == 2, "HopLimit and LineRate count; NoLine does not: " + w.LoopGuardRejections);
                Assert.True(w.EvalRuns == 1 && w.EvalScore == 0.8, "The completed eval run on the worker's deployment: " + Serializer.Serialize(w));
                Assert.True(w.SampleRunIds.Count == 3 && w.SampleRunIds[0] == bad.Id && w.SampleRunIds.Contains(ok1.Id) && w.SampleRunIds.Contains(ok2.Id), "Samples, the failure first: " + String.Join(", ", w.SampleRunIds));
                AgentPerformance lead = all.Agents.Single(a => a.AgentId == f.Lead.Id);
                Assert.True(lead.IsLead && lead.Metrics.Runs == 2 && lead.Metrics.Cancelled == 1 && lead.Metrics.SuccessRate == 1 && lead.Metrics.SampleRunIds.SequenceEqual(new[] { leadOk.Id }), "The lead: " + Serializer.Serialize(lead.Metrics));
                AgentPerformance ceo = all.Agents.Single(a => a.AgentId == f.Ceo.Id);
                Assert.True(ceo.Metrics.Runs == 0 && ceo.Metrics.SuccessRate == null && ceo.Metrics.EscalationRate == null, "An agent without runs has null rates");

                PerformanceMetrics ops = all.Units.Single(u => u.UnitId == f.Ops.Id).Metrics;
                PerformanceMetrics root = all.Units.Single(u => u.UnitId == f.Root.Id).Metrics;
                PerformanceMetrics sales = all.Units.Single(u => u.UnitId == f.Sales.Id).Metrics;
                Assert.True(ops.Runs == 5 && ops.Succeeded == 3 && ops.Failed == 1 && ops.Cancelled == 1 && Math.Abs(ops.CostUsd - 2.25) < 1e-9 && ops.EscalationsRaised == 1 && ops.LoopGuardRejections == 2 && ops.EvalRuns == 1, "Ops covers its lead and member: " + Serializer.Serialize(ops));
                Assert.True(sales.Runs == 1 && sales.LoopGuardRejections == 0, "Sales: the Frozen refusal is not a loop guard: " + Serializer.Serialize(sales));
                Assert.True(root.Runs == 6 && Math.Abs(root.CostUsd - 4.25) < 1e-9 && root.SampleRunIds.Count == 5 && root.SampleRunIds[0] == bad.Id, "Root covers the whole subtree, not the outsider: " + Serializer.Serialize(root));

                // unitId restricts to the subtree, by identifier or name.
                OrgPerformance opsOnly = await HttpTestHelpers.SendAsync<OrgPerformance>(host.AdminClient, HttpMethod.Get, b + "/" + f.Org.Id + "/performance?unitId=" + f.Ops.Name, null, 200, token).ConfigureAwait(false);
                Assert.True(opsOnly.Units.Count == 1 && opsOnly.Units[0].UnitId == f.Ops.Id && opsOnly.Agents.Select(a => a.AgentId).SequenceEqual(new[] { f.Lead.Id, f.Worker.Id }), "Restricted to ops: " + Serializer.Serialize(opsOnly.Agents.Select(a => a.AgentName)));
                KeeperSuite.Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, b + "/" + f.Org.Id + "/performance?unitId=nowhere", null, token).ConfigureAwait(false), 404, "NotFound", "A unit outside the organization");
                OrgFixture other = await OrganizationSuite.FixtureAsync(host, "pf2", token).ConfigureAwait(false);
                KeeperSuite.Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, b + "/" + f.Org.Id + "/performance?unitId=" + other.Ops.Id, null, token).ConfigureAwait(false), 404, "NotFound", "Another organization's unit");

                // The window: before the seeded runs nothing counts; an empty, too long, or malformed window answers 400.
                string before = Uri.EscapeDataString(DateTime.UtcNow.AddDays(-3).ToString("o"));
                string earlier = Uri.EscapeDataString(DateTime.UtcNow.AddDays(-2).ToString("o"));
                OrgPerformance past = await HttpTestHelpers.SendAsync<OrgPerformance>(host.AdminClient, HttpMethod.Get, b + "/" + f.Org.Id + "/performance?fromUtc=" + before + "&toUtc=" + earlier, null, 200, token).ConfigureAwait(false);
                Assert.True(past.Units.All(u => u.Metrics.Runs == 0 && u.Metrics.EscalationsRaised == 0 && u.Metrics.EvalRuns == 0), "Nothing before the seeded rows");
                KeeperSuite.Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, b + "/" + f.Org.Id + "/performance?fromUtc=" + earlier + "&toUtc=" + before, null, token).ConfigureAwait(false), 400, "fromUtc", "from after to");
                string long1 = Uri.EscapeDataString(DateTime.UtcNow.AddDays(-91).ToString("o"));
                KeeperSuite.Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, b + "/" + f.Org.Id + "/performance?fromUtc=" + long1, null, token).ConfigureAwait(false), 400, "WindowTooLong", "A window over 90 days");
                KeeperSuite.Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, b + "/" + f.Org.Id + "/performance?toUtc=yesterday", null, token).ConfigureAwait(false), 400, "toUtc", "A malformed time");

                // Before the first publish the rollup is empty; another tenant's organization answers 404.
                Organization draft = await HttpTestHelpers.SendAsync<Organization>(host.AdminClient, HttpMethod.Post, b, new Organization { Name = "pf-draft" }, 201, token).ConfigureAwait(false);
                OrgPerformance unpublished = await HttpTestHelpers.SendAsync<OrgPerformance>(host.AdminClient, HttpMethod.Get, b + "/" + draft.Id + "/performance", null, 200, token).ConfigureAwait(false);
                Assert.True(unpublished.Units.Count == 0 && unpublished.Agents.Count == 0 && unpublished.Checks.Count == 0, "An unpublished organization has an empty rollup");
                Organization foreign = await host.Server.Context.Database.Organizations.CreateAsync(new Organization { TenantId = "ten_elsewhere", Name = "pf-foreign" }, token).ConfigureAwait(false);
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, b + "/" + foreign.Id + "/performance", null, token).ConfigureAwait(false)).StatusCode, "Another tenant's organization answers 404");

                OperationScope? scope = host.Server.Context.Scopes.Find("GET", "/v1.0/api/tenants/{tenantId}/organizations/{id}/performance");
                OperationScope? tool = host.Server.Context.Scopes.Find("MCP", "garrison_subordinate_performance");
                Assert.True(scope?.ResourceType == ResourceTypeEnum.Organization && scope.Operation == OperationTypeEnum.Read && tool?.ResourceType == ResourceTypeEnum.Organization && tool.Operation == OperationTypeEnum.Read, "The route and the tool are in the scope map");

                // A Viewer reads performance; a user without Organization.Read does not.
                await KeeperSuite.UserAsync(host, "perf-viewer@example.com", BuiltInRoles.Viewer, token).ConfigureAwait(false);
                using (HttpClient viewer = await host.UserClientAsync("perf-viewer@example.com", "password123", host.TenantId, token).ConfigureAwait(false))
                {
                    Assert.Equal(200, (await HttpTestHelpers.SendAsync(viewer, HttpMethod.Get, b + "/" + f.Org.Id + "/performance", null, token).ConfigureAwait(false)).StatusCode, "A Viewer reads performance");
                }
            }
        }

        private static async Task<Run> LiveRunAsync(TestServerHost host, Agent agent, CancellationToken token)
        {
            Run run = OrganizationSuite.RunOf(host, agent);
            run.DeploymentId = (await OrganizationSuite.DeploymentAsync(host, agent, token).ConfigureAwait(false)).Id;
            run.LeaseExpiresUtc = DateTime.UtcNow.AddMinutes(5);
            return await host.Server.Context.Database.Runs.CreateAsync(run, token).ConfigureAwait(false);
        }

        private static async Task LeadAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                host.Server.Context.Get<MaintenanceService>().Keepers = null;
                OrgFixture f = await OrganizationSuite.FixtureAsync(host, "pl", token).ConfigureAwait(false);
                await RunAsync(host, f.Worker, RunStatusEnum.Succeeded, 0.5, 1000, RunKindEnum.Invoke, token).ConfigureAwait(false);
                await RunAsync(host, f.Seller, RunStatusEnum.Failed, 0.5, 1000, RunKindEnum.Invoke, token).ConfigureAwait(false);

                Run leadRun = await LiveRunAsync(host, f.Lead, token).ConfigureAwait(false);
                using (TestMcpClient lead = await OrganizationSuite.RunClientAsync(host, leadRun, token).ConfigureAwait(false))
                {
                    ProviderToolPage tools = await lead.ToolsAsync(token).ConfigureAwait(false);
                    Assert.True(tools.Tools.Any(t => t.Name == "garrison_subordinate_performance"), "A unit lead's run sees the tool");
                    OrgPerformance mine = await lead.CallAsync<OrgPerformance>("garrison_subordinate_performance", new { }, token).ConfigureAwait(false);
                    Assert.True(mine.OrganizationId == f.Org.Id && mine.Units.Count == 1 && mine.Units[0].UnitId == f.Ops.Id && mine.Agents.Select(a => a.AgentId).SequenceEqual(new[] { f.Lead.Id, f.Worker.Id }), "The lead sees its own unit's subtree: " + Serializer.Serialize(mine.Agents.Select(a => a.AgentName)));
                    Assert.True(mine.Units[0].Metrics.Runs == 2 && mine.Units[0].Metrics.Succeeded == 1 && mine.Units[0].Metrics.Failed == 0, "The worker's run and the lead's own running run, not the seller's: " + Serializer.Serialize(mine.Units[0].Metrics));
                    OrgPerformance named = await lead.CallAsync<OrgPerformance>("garrison_subordinate_performance", new { unitId = f.Ops.Name, fromUtc = DateTime.UtcNow.AddDays(-1).ToString("o") }, token).ConfigureAwait(false);
                    Assert.True(named.Units.Count == 1 && named.Units[0].UnitId == f.Ops.Id, "Its own unit by name");
                    await lead.ExpectErrorAsync("garrison_subordinate_performance", new { unitId = f.Root.Id }, "OutsideSubtree", token).ConfigureAwait(false);
                    await lead.ExpectErrorAsync("garrison_subordinate_performance", new { unitId = f.Sales.Name }, "OutsideSubtree", token).ConfigureAwait(false);
                    await lead.ExpectErrorAsync("garrison_subordinate_performance", new { unitId = "no-such-unit" }, "OutsideSubtree", token).ConfigureAwait(false);
                    await lead.ExpectErrorAsync("garrison_subordinate_performance", new { fromUtc = DateTime.UtcNow.AddDays(-100).ToString("o") }, "ValidationFailed", token).ConfigureAwait(false);
                }

                Run ceoRun = await LiveRunAsync(host, f.Ceo, token).ConfigureAwait(false);
                using (TestMcpClient ceo = await OrganizationSuite.RunClientAsync(host, ceoRun, token).ConfigureAwait(false))
                {
                    OrgPerformance whole = await ceo.CallAsync<OrgPerformance>("garrison_subordinate_performance", new { }, token).ConfigureAwait(false);
                    Assert.True(whole.Units.Count == 3 && whole.Agents.Count == 4, "The CEO sees the whole tree");
                    OrgPerformance sales = await ceo.CallAsync<OrgPerformance>("garrison_subordinate_performance", new { unitId = f.Sales.Id }, token).ConfigureAwait(false);
                    Assert.True(sales.Units.Count == 1 && sales.Units[0].UnitId == f.Sales.Id && sales.Units[0].Metrics.Failed == 1, "and any unit below it");
                }

                Run workerRun = await LiveRunAsync(host, f.Worker, token).ConfigureAwait(false);
                using (TestMcpClient member = await OrganizationSuite.RunClientAsync(host, workerRun, token).ConfigureAwait(false))
                {
                    ProviderToolPage tools = await member.ToolsAsync(token).ConfigureAwait(false);
                    Assert.True(!tools.Tools.Any(t => t.Name == "garrison_subordinate_performance"), "A member's run does not see the tool");
                    await member.ExpectErrorAsync("garrison_subordinate_performance", new { }, "NotAUnitLead", token).ConfigureAwait(false);
                }

                using (TestMcpClient admin = new TestMcpClient())
                {
                    await admin.ConnectAsync(host, null, token).ConfigureAwait(false);
                    OrgPerformance viaPeople = await admin.CallAsync<OrgPerformance>("garrison_subordinate_performance", new { organization = f.Org.Name, unitId = f.Sales.Name }, token).ConfigureAwait(false);
                    Assert.True(viaPeople.Units.Count == 1 && viaPeople.Units[0].UnitId == f.Sales.Id, "People pass the organization and any unit");
                    await admin.ExpectErrorAsync("garrison_subordinate_performance", new { }, "ValidationFailed", token).ConfigureAwait(false);
                }
            }
        }

        private static Trigger Check(string name, string? setId, string? deploymentId, string? judge, int? count)
        {
            return new Trigger { Name = name, Type = TriggerTypeEnum.Cron, TargetType = TriggerTargetTypeEnum.EvalSet, EvalSetId = setId, DeploymentId = deploymentId, EvalJudgeAgentId = judge, EvalRecentInputCount = count, CronExpression = "0 6 * * *", TimeZone = "UTC" };
        }

        private static async Task<EvalSet> JudgedSetAsync(TestServerHost host, string name, string? judge, CancellationToken token)
        {
            EvalSetRequest body = new EvalSetRequest
            {
                Name = name,
                JudgeAgent = judge,
                Cases = new List<EvalCase> { new EvalCase { InputText = "Say hello", Checks = new List<EvalCaseCheck> { new EvalCaseCheck { Scorer = EvalScorerEnum.Judge, Argument = "Is the reply polite?" } } } }
            };
            return await HttpTestHelpers.SendAsync<EvalSet>(host.AdminClient, HttpMethod.Post, T(host) + "/eval-sets", body, 201, token).ConfigureAwait(false);
        }

        private static async Task<EvalRun> WaitEvalAsync(TestServerHost host, string evalRunId, CancellationToken token)
        {
            DateTime deadline = DateTime.UtcNow.AddSeconds(120);
            while (true)
            {
                EvalRun run = await HttpTestHelpers.SendAsync<EvalRun>(host.AdminClient, HttpMethod.Get, T(host) + "/eval-runs/" + evalRunId, null, 200, token).ConfigureAwait(false);
                if (run.Status == EvalRunStatusEnum.Completed || run.Status == EvalRunStatusEnum.Failed || run.Status == EvalRunStatusEnum.Cancelled) return run;
                if (DateTime.UtcNow > deadline) throw new TestAssertionException("Eval run " + evalRunId + " did not finish in time: " + Serializer.Serialize(run));
                await Task.Delay(200, token).ConfigureAwait(false);
            }
        }

        private static async Task<Organization> SingleUnitOrgAsync(TestServerHost host, string name, Agent lead, CancellationToken token)
        {
            OrganizationService organizations = host.Server.Context.Get<OrganizationService>();
            RequestContext admin = OrganizationSuite.Admin(host);
            Organization org = await organizations.CreateAsync(admin, host.TenantId, new Organization { Name = name }, token).ConfigureAwait(false);
            await organizations.CreateUnitAsync(admin, org, new OrgUnit { Name = name + "-root", LeadAgentId = lead.Id }, token).ConfigureAwait(false);
            OrgRevision revision = await organizations.CreateRevisionAsync(admin, org, "Founding", token).ConfigureAwait(false);
            await organizations.PublishAsync(admin, org, revision, token).ConfigureAwait(false);
            return org;
        }

        private static async Task ScheduledCheckAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                host.Server.Context.Get<MaintenanceService>().Keepers = null;
                Agent target = await cluster.CreateAgentAsync("pc-target", "builtin/fake", null, token).ConfigureAwait(false);
                await cluster.CreateAgentAsync("pc-judge", "builtin/fake", null, token, d => d.Parameters.Add(new DeploymentParameter { Name = "answer", Value = "{\"score\": 0.9, \"passed\": true, \"reason\": \"Polite.\"}" })).ConfigureAwait(false);
                Agent idle = await cluster.CreateAgentAsync("pc-idle", "builtin/fake", null, token).ConfigureAwait(false);
                Deployment deployment = (await host.Server.Context.Database.Deployments.ListByAgentAsync(host.TenantId, target.Id, token).ConfigureAwait(false)).Single(d => d.Environment == "dev");
                Deployment idleDeployment = (await host.Server.Context.Database.Deployments.ListByAgentAsync(host.TenantId, idle.Id, token).ConfigureAwait(false)).Single(d => d.Environment == "dev");
                EvalSet set = await JudgedSetAsync(host, "pc-polite", null, token).ConfigureAwait(false);
                Organization org = await SingleUnitOrgAsync(host, "pc-org", target, token).ConfigureAwait(false);
                foreach (string input in new[] { "recent one", "recent two" })
                {
                    Run ordinary = await host.Server.Context.Get<RunService>().CreateAsync(new RunCreateContext { TenantId = host.TenantId, Agent = target, DeploymentId = deployment.Id, Input = input, CallerType = PrincipalTypeEnum.Administrator }, token).ConfigureAwait(false);
                    await host.Server.Context.Get<RunService>().WaitAsync(host.TenantId, ordinary.Id, 60, token).ConfigureAwait(false);
                }

                using (HttpClient person = await host.UserClientAsync("admin@garrison", "password", host.TenantId, token).ConfigureAwait(false))
                {
                    string triggers = T(host) + "/triggers";
                    KeeperSuite.Code(await HttpTestHelpers.SendAsync(person, HttpMethod.Post, triggers, Check("pc-noset", null, deployment.Id, "pc-judge", 2), token).ConfigureAwait(false), 400, "evalSetId", "An EvalSet trigger without a set");
                    KeeperSuite.Code(await HttpTestHelpers.SendAsync(person, HttpMethod.Post, triggers, Check("pc-nodep", set.Id, null, "pc-judge", 2), token).ConfigureAwait(false), 400, "deploymentId", "An EvalSet trigger without a deployment");
                    KeeperSuite.Code(await HttpTestHelpers.SendAsync(person, HttpMethod.Post, triggers, Check("pc-count", set.Id, deployment.Id, "pc-judge", 51), token).ConfigureAwait(false), 400, "evalRecentInputCount", "A recent input count over 50");
                    KeeperSuite.Code(await HttpTestHelpers.SendAsync(person, HttpMethod.Post, triggers, Check("pc-judge-x", set.Id, deployment.Id, "nobody", 2), token).ConfigureAwait(false), 400, "evalJudgeAgentId", "An unknown judge");
                    EvalSet foreignSet = await host.Server.Context.Database.EvalSets.CreateAsync(new EvalSet { TenantId = "ten_elsewhere", Name = "pc-foreign", Version = 1 }, token).ConfigureAwait(false);
                    KeeperSuite.Code(await HttpTestHelpers.SendAsync(person, HttpMethod.Post, triggers, Check("pc-foreign", foreignSet.Id, deployment.Id, "pc-judge", 2), token).ConfigureAwait(false), 400, "ReferenceNotFound", "Another tenant's set");
                    KeeperSuite.Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, triggers, Check("pc-admin", set.Id, deployment.Id, "pc-judge", 2), token).ConfigureAwait(false), 400, "UserRequired", "An EvalSet trigger saved by the administrator key would not run as a user");

                    Trigger trigger = await HttpTestHelpers.SendAsync<Trigger>(person, HttpMethod.Post, triggers, Check("pc-check", set.Name, deployment.Name, "pc-judge", 2), 201, token).ConfigureAwait(false);
                    Assert.True(trigger.TargetType == TriggerTargetTypeEnum.EvalSet && trigger.EvalSetId == set.Id && trigger.DeploymentId == deployment.Id && trigger.AgentId == target.Id && trigger.EvalJudgeAgentId != null && trigger.EvalRecentInputCount == 2 && trigger.RunAsType == PrincipalTypeEnum.User && trigger.NextFireUtc.HasValue, "Names resolve to identifiers, the agent comes from the deployment, and it runs as the person: " + Serializer.Serialize(trigger));

                    // The schedule fires it: a RecentInputs eval run linked to the trigger both ways.
                    TriggerService service = host.Server.Context.Get<TriggerService>();
                    Assert.True(await service.SweepAsync(trigger.NextFireUtc!.Value.AddSeconds(1), token).ConfigureAwait(false), "The sweep fires the check");
                    EnumerationResult<TriggerFire> fires = await HttpTestHelpers.SendAsync<EnumerationResult<TriggerFire>>(person, HttpMethod.Get, triggers + "/" + trigger.Id + "/fires", null, 200, token).ConfigureAwait(false);
                    TriggerFire fire = fires.Objects.Single();
                    Assert.True(fire.Source == TriggerFireSourceEnum.Cron && fire.Outcome == TriggerFireOutcomeEnum.Started && fire.EvalRunId != null && fire.RunId == null, "The fire links its eval run: " + Serializer.Serialize(fire));
                    EvalRun started = await HttpTestHelpers.SendAsync<EvalRun>(person, HttpMethod.Get, T(host) + "/eval-runs/" + fire.EvalRunId, null, 200, token).ConfigureAwait(false);
                    Assert.True(started.TriggerId == trigger.Id && started.InputMode == EvalRunInputModeEnum.RecentInputs && started.RecentInputCount == 2 && started.TotalCases == 2 && started.DeploymentId == deployment.Id && started.TargetType == EvalRunTargetEnum.Deployment && started.StartedByType == PrincipalTypeEnum.User && started.JudgeAgentId == trigger.EvalJudgeAgentId, "The eval run records the trigger, mode, count, judge, and the person: " + Serializer.Serialize(started));
                    EvalRun done = await WaitEvalAsync(host, started.Id, token).ConfigureAwait(false);
                    Assert.True(done.Status == EvalRunStatusEnum.Completed && Math.Abs((done.Score ?? 0) - 0.9) < 1e-9, "The trigger's judge graded it: " + Serializer.Serialize(done));

                    // Its result appears in performance, for the agent and its unit, and in the checks.
                    OrgPerformance performance = await HttpTestHelpers.SendAsync<OrgPerformance>(person, HttpMethod.Get, T(host) + "/organizations/" + org.Id + "/performance", null, 200, token).ConfigureAwait(false);
                    PerformanceCheck check = Assert.NotNull(performance.Checks.SingleOrDefault(c => c.TriggerId == trigger.Id), "The check is listed");
                    Assert.True(check.TriggerName == "pc-check" && check.Active && check.EvalSetId == set.Id && check.EvalSetName == set.Name && check.DeploymentId == deployment.Id && check.AgentId == target.Id && check.CronExpression == "0 6 * * *" && check.NextFireUtc.HasValue, "The check's configuration: " + Serializer.Serialize(check));
                    Assert.True(check.LastEvalRunId == started.Id && check.LastStatus == EvalRunStatusEnum.Completed && Math.Abs((check.LastScore ?? 0) - 0.9) < 1e-9 && check.LastRunUtc.HasValue, "The check's last result: " + Serializer.Serialize(check));
                    AgentPerformance agent = performance.Agents.Single(a => a.AgentId == target.Id);
                    Assert.True(agent.Metrics.EvalRuns >= 1 && Math.Abs((agent.Metrics.EvalScore ?? 0) - 0.9) < 1e-9 && performance.Units[0].Metrics.EvalScore == agent.Metrics.EvalScore, "The score counts in the agent's and unit's eval score: " + Serializer.Serialize(agent.Metrics));
                    Assert.True(agent.Metrics.Runs == 2 && agent.Metrics.Succeeded == 2, "Eval case and judge runs are not counted as the agent's runs: " + Serializer.Serialize(agent.Metrics));

                    // A check with nothing to replay records a failed fire, as agent triggers do.
                    Trigger idleCheck = await HttpTestHelpers.SendAsync<Trigger>(person, HttpMethod.Post, triggers, Check("pc-idle-check", set.Id, idleDeployment.Id, "pc-judge", null), 201, token).ConfigureAwait(false);
                    TriggerFire failed = await HttpTestHelpers.SendAsync<TriggerFire>(person, HttpMethod.Post, triggers + "/" + idleCheck.Id + "/fire", new TriggerFireRequest(), 201, token).ConfigureAwait(false);
                    Assert.True(failed.Outcome == TriggerFireOutcomeEnum.Failed && failed.ErrorCode == "NoRecentInputs" && failed.EvalRunId == null, "NoRecentInputs is a failed fire: " + Serializer.Serialize(failed));
                    Trigger reread = await HttpTestHelpers.SendAsync<Trigger>(person, HttpMethod.Get, triggers + "/" + idleCheck.Id, null, 200, token).ConfigureAwait(false);
                    Assert.True(reread.LastFireOutcome == TriggerFireOutcomeEnum.Failed && reread.FireCount == 1 && reread.EvalRecentInputCount == null, "The trigger records the failed fire");

                    // Switching an EvalSet trigger to an agent target clears the eval fields.
                    Trigger switched = Check("pc-idle-check", null, idleDeployment.Id, "pc-judge", 5);
                    switched.TargetType = TriggerTargetTypeEnum.Agent;
                    switched.AgentId = idle.Id;
                    Trigger agentTrigger = await HttpTestHelpers.SendAsync<Trigger>(person, HttpMethod.Put, triggers + "/" + idleCheck.Id, switched, 200, token).ConfigureAwait(false);
                    Assert.True(agentTrigger.TargetType == TriggerTargetTypeEnum.Agent && agentTrigger.EvalSetId == null && agentTrigger.EvalJudgeAgentId == null && agentTrigger.EvalRecentInputCount == null, "An agent trigger keeps no eval fields");
                    Trigger mismatch = Check("pc-idle-check", set.Id, idleDeployment.Id, null, null);
                    mismatch.TargetType = TriggerTargetTypeEnum.Agent;
                    mismatch.AgentId = idle.Id;
                    KeeperSuite.Code(await HttpTestHelpers.SendAsync(person, HttpMethod.Put, triggers + "/" + idleCheck.Id, mismatch, token).ConfigureAwait(false), 400, "TargetMismatch", "An agent trigger with an eval set");
                }
            }
        }

        private static async Task AgentRefusalAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                host.Server.Context.Get<MaintenanceService>().Keepers = null;
                OrgFixture f = await OrganizationSuite.FixtureAsync(host, "pr", token).ConfigureAwait(false);
                Deployment deployment = await OrganizationSuite.DeploymentAsync(host, f.Worker, token).ConfigureAwait(false);
                EvalSet set = await JudgedSetAsync(host, "pr-set", f.Seller.Name, token).ConfigureAwait(false);
                Run leadRun = await LiveRunAsync(host, f.Lead, token).ConfigureAwait(false);
                RequestContext runCtx = new RequestContext { IsAuthenticated = true, TenantId = host.TenantId, PrincipalType = PrincipalTypeEnum.Run, RunId = leadRun.Id, PrincipalName = "run " + leadRun.Id };

                // The service refuses a run token even if authorization let it through (AA-074).
                TenantConfigurationService mutations = new TenantConfigurationService(host.Server.Context);
                string code = "none";
                try
                {
                    await mutations.CreateTriggerAsync(runCtx, host.TenantId, Check("pr-agent-check", set.Id, deployment.Id, null, 3), (type, id) => Task.FromResult(true), token).ConfigureAwait(false);
                }
                catch (ValidationException e)
                {
                    code = e.Codes.Values.FirstOrDefault() ?? e.Code;
                }
                Assert.Equal("PeopleOnly", code, "A run token cannot create an EvalSet trigger");

                using (HttpClient person = await host.UserClientAsync("admin@garrison", "password", host.TenantId, token).ConfigureAwait(false))
                {
                    Trigger trigger = await HttpTestHelpers.SendAsync<Trigger>(person, HttpMethod.Post, T(host) + "/triggers", Check("pr-check", set.Id, deployment.Id, null, 3), 201, token).ConfigureAwait(false);
                    code = "none";
                    try
                    {
                        Trigger change = Check("pr-check", null, null, null, null);
                        change.TargetType = TriggerTargetTypeEnum.Agent;
                        change.AgentId = f.Lead.Id;
                        await mutations.UpdateTriggerAsync(runCtx, host.TenantId, trigger, change, (type, id) => Task.FromResult(true), token).ConfigureAwait(false);
                    }
                    catch (ValidationException e)
                    {
                        code = e.Codes.Values.FirstOrDefault() ?? e.Code;
                    }
                    Assert.Equal("PeopleOnly", code, "A run token cannot change an EvalSet trigger, even into another target");

                    // Over REST and MCP a run token never reaches the trigger or its eval runs.
                    string bearer = await host.Server.Context.Authentication.IssueForRunAsync(leadRun, leadRun.LeaseEpoch, DateTime.UtcNow.AddMinutes(5), token).ConfigureAwait(false);
                    using (HttpClient agent = new HttpClient())
                    {
                        agent.BaseAddress = new Uri(host.BaseUrl);
                        agent.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", bearer);
                        int created = (await HttpTestHelpers.SendAsync(agent, HttpMethod.Post, T(host) + "/triggers", Check("pr-rest", set.Id, deployment.Id, null, 3), token).ConfigureAwait(false)).StatusCode;
                        Assert.True(created == 400 || created == 403, "A run token cannot create an EvalSet trigger over REST: " + created);
                        int updated = (await HttpTestHelpers.SendAsync(agent, HttpMethod.Put, T(host) + "/triggers/" + trigger.Id, Check("pr-check", set.Id, deployment.Id, null, 1), token).ConfigureAwait(false)).StatusCode;
                        Assert.True(updated == 400 || updated == 403 || updated == 404, "or change one: " + updated);

                        EvalRun evalRun = await host.Server.Context.Database.EvalRuns.CreateAsync(new EvalRun { TenantId = host.TenantId, SetId = set.Id, SetName = set.Name, SetVersion = set.Version, TargetType = EvalRunTargetEnum.Deployment, AgentId = f.Worker.Id, DeploymentId = deployment.Id, InputMode = EvalRunInputModeEnum.RecentInputs, TriggerId = trigger.Id, Status = EvalRunStatusEnum.Running, TotalCases = 1 }, token).ConfigureAwait(false);
                        int cancel = (await HttpTestHelpers.SendAsync(agent, HttpMethod.Post, T(host) + "/eval-runs/" + evalRun.Id + "/cancel", new EvalRunCancelRequest(), token).ConfigureAwait(false)).StatusCode;
                        Assert.True(cancel == 403 || cancel == 404, "A run token cannot cancel a check's eval run: " + cancel);
                        EvalRun still = Assert.NotNull(await host.Server.Context.Database.EvalRuns.ReadAsync(host.TenantId, evalRun.Id, token).ConfigureAwait(false), "The eval run");
                        Assert.Equal(EvalRunStatusEnum.Running, still.Status, "The check's eval run is untouched");
                    }
                    using (TestMcpClient agentMcp = await OrganizationSuite.RunClientAsync(host, leadRun, token).ConfigureAwait(false))
                    {
                        await agentMcp.ExpectErrorAsync("garrison_create_trigger", new { configuration = Check("pr-mcp", set.Id, deployment.Id, null, 3) }, "Forbidden", token).ConfigureAwait(false);
                    }

                    Trigger after = await HttpTestHelpers.SendAsync<Trigger>(person, HttpMethod.Get, T(host) + "/triggers/" + trigger.Id, null, 200, token).ConfigureAwait(false);
                    Assert.True(after.TargetType == TriggerTargetTypeEnum.EvalSet && after.EvalRecentInputCount == 3, "The check is unchanged");
                }
            }
        }

        #endregion
    }
}
