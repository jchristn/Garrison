namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Linq;
    using System.Net.Http;
    using System.Net.WebSockets;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Keepers;
    using Garrison.Core.Models;
    using Garrison.Core.Notifications;
    using Garrison.Core.Requests;
    using Garrison.Core.Security;
    using Garrison.Core.Serialization;
    using Garrison.Core.Services;
    using Garrison.ProviderHarness;
    using Garrison.Server.Protocols;
    using Garrison.Server.Runtime;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Brakes (AUTONOMOUS_AGENTS_PLAN.md phase AA3): freezes on agents, deployments, mandates, and apps refuse new runs and
    /// skip keeper wakes; cancelActiveRuns cancels the runs in scope; the autonomy kill switch stops keeper ticks and leaves
    /// ordinary invocations working; a keeper with a tiny daily budget stops, escalates, and resumes after the window; the
    /// per-tick budget lowers the harness budget and refuses an exhausted tick; a freeze applied on one replica is honored by
    /// another over the backplane; the MCP tools are for people only; the freezes channel; and the FreezeApplied and
    /// MandateCapReached notifications.
    /// </summary>
    public static class BrakeSuite
    {
        #region Public-Methods

        /// <summary>
        /// Build the suites.
        /// </summary>
        /// <returns>Suites.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            List<TestSuiteDescriptor> suites = new List<TestSuiteDescriptor>();
            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "brakes-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                cases.Add(new TestCaseDescriptor(id, "freezes", "Agent, deployment, mandate, and app freezes refuse new runs with Frozen; AlreadyFrozen, lift, FreezeLifted, validation, permissions, cancelActiveRuns, and cross-tenant 404 (" + provider + ")", ct => FreezesAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "keepers", "A frozen agent's keeper records Skipped Frozen and moves on one interval; the kill switch skips three sweeps, refuses keeper runs, leaves invocations working, and resumes without a burst (" + provider + ")", ct => KeepersAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "caps", "A keeper over its tiny daily budget becomes CapReached, records the cap, escalates Urgent to its default role, and ticks again after the window; Mandate quota scope; per-tick budget at compilation (" + provider + ")", ct => CapsAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "replicas", "Agent, deployment, mandate, and app freezes applied on one replica refuse runs on the other within one backplane round trip, and a lift is seen the same way (" + provider + ")", ct => ReplicasAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "mcp", "garrison_list_freezes, garrison_freeze, and garrison_lift_freeze for people; hidden from and refused to run tokens (" + provider + ")", ct => McpAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "channel", "A freezes subscriber receives the active count, then freeze.applied, freeze.lifted, and killswitch.changed (" + provider + ")", ct => ChannelAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "notifications", "Signed FreezeApplied and MandateCapReached notifications, and an agent filter (" + provider + ")", ct => NotificationsAsync(provider, ct)));
                suites.Add(new TestSuiteDescriptor(id, "Brakes (" + provider + ")", cases));
            }
            return suites;
        }

        #endregion

        #region Private-Methods

        private static async Task FreezesAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 0, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                cluster.Server.Server.Context.Get<MaintenanceService>().Keepers = null;
                Agent agent = await cluster.CreateAgentAsync("frz-agent", "builtin/fake", null, token).ConfigureAwait(false);
                Agent other = await cluster.CreateAgentAsync("frz-other", "builtin/fake", null, token).ConfigureAwait(false);

                // Agent freeze by name: invocations of that agent are refused, others are not.
                Run before = await InvokeAsync(host, agent, 202, token).ConfigureAwait(false);
                Freeze frozen = await HttpTestHelpers.SendAsync<Freeze>(host.AdminClient, HttpMethod.Post, T(host) + "/freezes", new Freeze { TargetKind = FreezeTargetKindEnum.Agent, TargetId = agent.Name, Reason = "Runaway loop." }, 201, token).ConfigureAwait(false);
                Assert.True(frozen.Id.StartsWith("mfz_", StringComparison.Ordinal) && frozen.TargetId == agent.Id && frozen.TargetName == agent.Name && frozen.Active && frozen.CreatedByName != null, "A freeze resolves the agent by name: " + Serializer.Serialize(frozen));
                TestResponse refused = await InvokeRawAsync(host, agent, token).ConfigureAwait(false);
                KeeperSuite.Code(refused, 409, "Frozen", "An invocation of a frozen agent");
                Assert.True(refused.Body.Contains(frozen.Id, StringComparison.Ordinal) && refused.Body.Contains("Runaway loop.", StringComparison.Ordinal), "The refusal names the freeze: " + refused.Body);
                await InvokeAsync(host, other, 202, token).ConfigureAwait(false);
                Run queued = (await host.Server.Context.Database.Runs.ReadAsync(host.TenantId, before.Id, token).ConfigureAwait(false))!;
                Assert.Equal(RunStatusEnum.Queued, queued.Status, "Without cancelActiveRuns, a queued run is left alone");
                KeeperSuite.Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/freezes", new Freeze { TargetKind = FreezeTargetKindEnum.Agent, TargetId = agent.Id }, token).ConfigureAwait(false), 409, "AlreadyFrozen", "A second freeze on the same agent");

                // Validation and unknown targets.
                KeeperSuite.Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/freezes", new Freeze { TargetKind = FreezeTargetKindEnum.Deployment }, token).ConfigureAwait(false), 400, "Required", "A freeze without a target");
                KeeperSuite.Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/freezes", new Freeze { TargetKind = FreezeTargetKindEnum.OrgUnit, TargetId = "unit" }, token).ConfigureAwait(false), 409, "OrganizationsUnavailable", "OrgUnit freezes wait for organizations");
                KeeperSuite.Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/freezes", new Freeze { TargetKind = FreezeTargetKindEnum.Agent, TargetId = other.Id, Reason = new string('r', 2001) }, token).ConfigureAwait(false), 400, "TooLong", "A reason over 2000 characters");
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/freezes", new Freeze { TargetKind = FreezeTargetKindEnum.Agent, TargetId = "no-such-agent" }, token).ConfigureAwait(false)).StatusCode, "An unknown agent");
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, T(host) + "/freezes/mfz_missing", null, token).ConfigureAwait(false)).StatusCode, "An unknown freeze");

                // Deployment freeze: runs on that deployment are refused.
                Deployment otherDeployment = (await host.Server.Context.Database.Deployments.ReadByNameAsync(host.TenantId, other.Name + "-default", token).ConfigureAwait(false))!;
                Freeze deploymentFreeze = await HttpTestHelpers.SendAsync<Freeze>(host.AdminClient, HttpMethod.Post, T(host) + "/freezes", new Freeze { TargetKind = FreezeTargetKindEnum.Deployment, TargetId = otherDeployment.Name }, 201, token).ConfigureAwait(false);
                Assert.Equal(otherDeployment.Id, deploymentFreeze.TargetId, "A deployment freeze resolves the name");
                KeeperSuite.Code(await InvokeRawAsync(host, other, token).ConfigureAwait(false), 409, "Frozen", "An invocation routed to a frozen deployment");

                // App freeze: a run started through the app is refused; the same agent outside the app is not.
                Agent appAgent = await cluster.CreateAgentAsync("frz-app-agent", "builtin/fake", null, token).ConfigureAwait(false);
                AgenticApp app = await HttpTestHelpers.SendAsync<AgenticApp>(host.AdminClient, HttpMethod.Post, T(host) + "/apps", new AgenticApp { Name = "frz-app", EntryAgentId = appAgent.Name, Members = new List<AgenticAppMember> { new AgenticAppMember { AgentId = appAgent.Name } } }, 201, token).ConfigureAwait(false);
                Freeze appFreeze = await HttpTestHelpers.SendAsync<Freeze>(host.AdminClient, HttpMethod.Post, T(host) + "/freezes", new Freeze { TargetKind = FreezeTargetKindEnum.App, TargetId = app.Name }, 201, token).ConfigureAwait(false);
                RunService runs = host.Server.Context.Get<RunService>();
                FrozenException? appRefusal = await CatchAsync<FrozenException>(() => runs.CreateAsync(new RunCreateContext { TenantId = host.TenantId, Agent = appAgent, Input = "hi", AppId = app.Id }, token)).ConfigureAwait(false);
                Assert.True(appRefusal != null && appRefusal.FreezeId == appFreeze.Id && appRefusal.TargetKind == FreezeTargetKindEnum.App, "A run started through a frozen app is refused");
                await InvokeAsync(host, appAgent, 202, token).ConfigureAwait(false);

                // Mandate freeze: the mandate shows Frozen; lifting returns it to Active.
                Mandate mandate = await HttpTestHelpers.SendAsync<Mandate>(host.AdminClient, HttpMethod.Post, T(host) + "/mandates", KeeperSuite.Body("frz-watch", appAgent, KeeperSuite.Revision("Watch the pond.")), 201, token).ConfigureAwait(false);
                Freeze mandateFreeze = await HttpTestHelpers.SendAsync<Freeze>(host.AdminClient, HttpMethod.Post, T(host) + "/freezes", new Freeze { TargetKind = FreezeTargetKindEnum.Mandate, TargetId = mandate.Name }, 201, token).ConfigureAwait(false);
                Mandate frozenMandate = await HttpTestHelpers.SendAsync<Mandate>(host.AdminClient, HttpMethod.Get, T(host) + "/mandates/" + mandate.Id, null, 200, token).ConfigureAwait(false);
                Assert.Equal(MandateStatusEnum.Frozen, frozenMandate.Status, "A frozen mandate shows Frozen");
                KeeperSuite.Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/mandates/" + mandate.Id + "/wake", null, token).ConfigureAwait(false), 409, "MandateNotActive", "A frozen mandate cannot be woken");
                FrozenException? tickRefusal = await CatchAsync<FrozenException>(() => runs.CreateAsync(new RunCreateContext { TenantId = host.TenantId, Agent = appAgent, Input = "tick", Kind = RunKindEnum.Keeper, MandateId = mandate.Id }, token)).ConfigureAwait(false);
                Assert.True(tickRefusal != null && tickRefusal.FreezeId == mandateFreeze.Id, "A tick run of a frozen mandate is refused");

                // Lists and filters.
                EnumerationResult<Freeze> active = await HttpTestHelpers.SendAsync<EnumerationResult<Freeze>>(host.AdminClient, HttpMethod.Get, T(host) + "/freezes?active=true", null, 200, token).ConfigureAwait(false);
                Assert.Equal(4, active.Objects.Count, "Four active freezes");
                EnumerationResult<Freeze> byKind = await HttpTestHelpers.SendAsync<EnumerationResult<Freeze>>(host.AdminClient, HttpMethod.Get, T(host) + "/freezes?targetKind=Deployment", null, 200, token).ConfigureAwait(false);
                Assert.True(byKind.Objects.Count == 1 && byKind.Objects[0].Id == deploymentFreeze.Id, "Filter by target kind");

                // Lift.
                Freeze lifted = await HttpTestHelpers.SendAsync<Freeze>(host.AdminClient, HttpMethod.Post, T(host) + "/freezes/" + frozen.Id + "/lift", new FreezeLiftRequest { Reason = "Fixed the loop." }, 200, token).ConfigureAwait(false);
                Assert.True(!lifted.Active && lifted.LiftedUtc.HasValue && lifted.LiftReason == "Fixed the loop." && lifted.LiftedByName != null, "Lift records who and why: " + Serializer.Serialize(lifted));
                await InvokeAsync(host, agent, 202, token).ConfigureAwait(false);
                KeeperSuite.Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/freezes/" + frozen.Id + "/lift", null, token).ConfigureAwait(false), 409, "FreezeLifted", "Lifting twice");
                DateTime liftedAt = DateTime.UtcNow;
                await HttpTestHelpers.SendAsync<Freeze>(host.AdminClient, HttpMethod.Post, T(host) + "/freezes/" + mandateFreeze.Id + "/lift", null, 200, token).ConfigureAwait(false);
                Mandate thawed = await HttpTestHelpers.SendAsync<Mandate>(host.AdminClient, HttpMethod.Get, T(host) + "/mandates/" + mandate.Id, null, 200, token).ConfigureAwait(false);
                Assert.True(thawed.Status == MandateStatusEnum.Active && thawed.NextWakeUtc.HasValue && thawed.NextWakeUtc.Value <= liftedAt.AddSeconds(65), "A lifted mandate is Active with a wake soon: " + Serializer.Serialize(thawed));
                EnumerationResult<Freeze> history = await HttpTestHelpers.SendAsync<EnumerationResult<Freeze>>(host.AdminClient, HttpMethod.Get, T(host) + "/freezes?active=false", null, 200, token).ConfigureAwait(false);
                Assert.Equal(2, history.Objects.Count, "Lifted freezes are kept as history");

                // cancelActiveRuns cancels the runs already in scope.
                Agent busy = await cluster.CreateAgentAsync("frz-busy", "builtin/fake", null, token).ConfigureAwait(false);
                Run first = await InvokeAsync(host, busy, 202, token).ConfigureAwait(false);
                Run second = await InvokeAsync(host, busy, 202, token).ConfigureAwait(false);
                Freeze cancelling = await HttpTestHelpers.SendAsync<Freeze>(host.AdminClient, HttpMethod.Post, T(host) + "/freezes", new Freeze { TargetKind = FreezeTargetKindEnum.Agent, TargetId = busy.Id, CancelActiveRuns = true }, 201, token).ConfigureAwait(false);
                Assert.Equal(2, cancelling.CancelledRunCount, "Both queued runs were cancelled: " + Serializer.Serialize(cancelling));
                foreach (Run run in new[] { first, second })
                {
                    Run stored = (await host.Server.Context.Database.Runs.ReadAsync(host.TenantId, run.Id, token).ConfigureAwait(false))!;
                    Assert.Equal(RunStatusEnum.Cancelled, stored.Status, "Run " + run.Id + " was cancelled");
                }
                Freeze reread = await HttpTestHelpers.SendAsync<Freeze>(host.AdminClient, HttpMethod.Get, T(host) + "/freezes/" + cancelling.Id, null, 200, token).ConfigureAwait(false);
                Assert.Equal(2, reread.CancelledRunCount, "The count is stored");

                // Permissions: a Viewer reads but cannot freeze; an AgentOperator freezes and lifts.
                await KeeperSuite.UserAsync(host, "frz-viewer@example.com", "Viewer", token).ConfigureAwait(false);
                await KeeperSuite.UserAsync(host, "frz-operator@example.com", "AgentOperator", token).ConfigureAwait(false);
                using (HttpClient viewer = await host.UserClientAsync("frz-viewer@example.com", "password123", host.TenantId, token).ConfigureAwait(false))
                using (HttpClient operatorClient = await host.UserClientAsync("frz-operator@example.com", "password123", host.TenantId, token).ConfigureAwait(false))
                {
                    await HttpTestHelpers.SendAsync<EnumerationResult<Freeze>>(viewer, HttpMethod.Get, T(host) + "/freezes", null, 200, token).ConfigureAwait(false);
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(viewer, HttpMethod.Post, T(host) + "/freezes", new Freeze { TargetKind = FreezeTargetKindEnum.Agent, TargetId = agent.Id }, token).ConfigureAwait(false)).StatusCode, "A Viewer cannot freeze");
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(viewer, HttpMethod.Put, T(host) + "/autonomy/kill-switch", new KillSwitchRequest { Enabled = true }, token).ConfigureAwait(false)).StatusCode, "A Viewer cannot flip the kill switch");
                    Freeze byOperator = await HttpTestHelpers.SendAsync<Freeze>(operatorClient, HttpMethod.Post, T(host) + "/freezes", new Freeze { TargetKind = FreezeTargetKindEnum.Agent, TargetId = agent.Id }, 201, token).ConfigureAwait(false);
                    await HttpTestHelpers.SendAsync<Freeze>(operatorClient, HttpMethod.Post, T(host) + "/freezes/" + byOperator.Id + "/lift", null, 200, token).ConfigureAwait(false);
                }

                // Tenant isolation.
                Tenant outside = await HttpTestHelpers.SendAsync<Tenant>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants", new TenantRequest { Name = "Brakes Other" }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + outside.Id + "/users", new UserRequest { Email = "frz-outsider@example.com", Password = "password123", IsTenantAdmin = true }, 201, token).ConfigureAwait(false);
                using (HttpClient outsider = await host.UserClientAsync("frz-outsider@example.com", "password123", outside.Id, token).ConfigureAwait(false))
                {
                    Assert.Equal(404, (await HttpTestHelpers.SendAsync(outsider, HttpMethod.Get, "/v1.0/api/tenants/" + outside.Id + "/freezes/" + deploymentFreeze.Id, null, token).ConfigureAwait(false)).StatusCode, "Another tenant's freeze is not found");
                    Assert.Equal(404, (await HttpTestHelpers.SendAsync(outsider, HttpMethod.Post, "/v1.0/api/tenants/" + outside.Id + "/freezes/" + deploymentFreeze.Id + "/lift", null, token).ConfigureAwait(false)).StatusCode, "Another tenant cannot lift it");
                    Assert.Equal(404, (await HttpTestHelpers.SendAsync(outsider, HttpMethod.Post, "/v1.0/api/tenants/" + outside.Id + "/freezes", new Freeze { TargetKind = FreezeTargetKindEnum.Agent, TargetId = agent.Id }, token).ConfigureAwait(false)).StatusCode, "Another tenant cannot freeze this tenant's agent");
                    EnumerationResult<Freeze> theirs = await HttpTestHelpers.SendAsync<EnumerationResult<Freeze>>(outsider, HttpMethod.Get, "/v1.0/api/tenants/" + outside.Id + "/freezes", null, 200, token).ConfigureAwait(false);
                    Assert.Equal(0, theirs.Objects.Count, "Another tenant lists none");
                }
            }
        }

        private static async Task KeepersAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await KeeperSuite.ClusterAsync(provider, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                KeeperScheduler scheduler = host.Server.Context.Get<KeeperScheduler>();
                Agent agent = await cluster.CreateAgentAsync("frz-keeper", "builtin/fake", null, token).ConfigureAwait(false);
                Mandate mandate = await HttpTestHelpers.SendAsync<Mandate>(host.AdminClient, HttpMethod.Post, T(host) + "/mandates", KeeperSuite.Body("frz-pond", agent, KeeperSuite.Revision("Keep the pond calm.")), 201, token).ConfigureAwait(false);

                // A frozen agent: the due wake is Skipped with Frozen and the schedule moves on by one interval.
                Freeze agentFreeze = await HttpTestHelpers.SendAsync<Freeze>(host.AdminClient, HttpMethod.Post, T(host) + "/freezes", new Freeze { TargetKind = FreezeTargetKindEnum.Agent, TargetId = agent.Id }, 201, token).ConfigureAwait(false);
                DateTime now = DateTime.UtcNow.AddSeconds(1);
                Assert.True(await scheduler.SweepAsync(now, token).ConfigureAwait(false), "The sweep records the frozen wake");
                List<MandateTick> ticks = await KeeperSuite.TicksOfAsync(host, mandate.Id, token).ConfigureAwait(false);
                Assert.True(ticks.Count == 1 && ticks[0].Outcome == TickOutcomeEnum.Skipped && ticks[0].ErrorCode == "Frozen" && ticks[0].RunId == null && ticks[0].ErrorMessage!.Contains(agentFreeze.Id, StringComparison.Ordinal), "Skipped Frozen: " + Serializer.Serialize(ticks));
                Mandate deferred = (await host.Server.Context.Database.Mandates.ReadAsync(host.TenantId, mandate.Id, token).ConfigureAwait(false))!;
                Assert.True(deferred.Status == MandateStatusEnum.Active && deferred.NextWakeUtc.HasValue && deferred.NextWakeUtc.Value >= now.AddSeconds(55), "The wake moved by one interval: " + Serializer.Serialize(deferred));
                await HttpTestHelpers.SendAsync<Freeze>(host.AdminClient, HttpMethod.Post, T(host) + "/freezes/" + agentFreeze.Id + "/lift", null, 200, token).ConfigureAwait(false);

                // The kill switch.
                KillSwitchState off = await HttpTestHelpers.SendAsync<KillSwitchState>(host.AdminClient, HttpMethod.Get, T(host) + "/autonomy/kill-switch", null, 200, token).ConfigureAwait(false);
                Assert.True(!off.Enabled && off.FreezeId == null, "The kill switch starts off");
                KeeperSuite.Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Put, T(host) + "/autonomy/kill-switch", new KillSwitchRequest(), token).ConfigureAwait(false), 400, "Required", "enabled is required");
                KillSwitchState on = await HttpTestHelpers.SendAsync<KillSwitchState>(host.AdminClient, HttpMethod.Put, T(host) + "/autonomy/kill-switch", new KillSwitchRequest { Enabled = true, Reason = "Cost spike." }, 200, token).ConfigureAwait(false);
                Assert.True(on.Enabled && on.FreezeId != null && on.Reason == "Cost spike." && on.ChangedUtc.HasValue, "The kill switch is on: " + Serializer.Serialize(on));
                KillSwitchState again = await HttpTestHelpers.SendAsync<KillSwitchState>(host.AdminClient, HttpMethod.Put, T(host) + "/autonomy/kill-switch", new KillSwitchRequest { Enabled = true }, 200, token).ConfigureAwait(false);
                Assert.Equal(on.FreezeId, again.FreezeId, "Turning it on twice keeps one freeze");
                List<AuditRecord> audit = await AuditAsync(host, token).ConfigureAwait(false);
                Assert.True(audit.Any(a => a.EventType == AuditEventTypeEnum.KillSwitchChanged && a.ResourceId == on.FreezeId), "Turning it on is audited");

                // Three sweeps over three due wakes: no tick starts.
                DateTime clock = DateTime.UtcNow;
                for (int i = 0; i < 3; i++)
                {
                    clock = clock.AddSeconds(61 + i * 60);
                    Mandate due = (await host.Server.Context.Database.Mandates.ReadAsync(host.TenantId, mandate.Id, token).ConfigureAwait(false))!;
                    Assert.True(due.NextWakeUtc.HasValue && due.NextWakeUtc.Value <= clock, "Sweep " + (i + 1) + " has a due wake");
                    await scheduler.SweepAsync(clock, token).ConfigureAwait(false);
                }
                ticks = await KeeperSuite.TicksOfAsync(host, mandate.Id, token).ConfigureAwait(false);
                Assert.True(ticks.Count(t => t.ErrorCode == "KillSwitch" && t.Outcome == TickOutcomeEnum.Skipped) == 3 && ticks.All(t => t.RunId == null), "Three wakes skipped by the kill switch, no runs: " + Serializer.Serialize(ticks));
                EnumerationResult<Run> keeperRuns = await HttpTestHelpers.SendAsync<EnumerationResult<Run>>(host.AdminClient, HttpMethod.Get, T(host) + "/runs?mandateId=" + mandate.Id, null, 200, token).ConfigureAwait(false);
                Assert.Equal(0, keeperRuns.Objects.Count, "No keeper runs while the switch is on");
                FrozenException? keeperRefused = await CatchAsync<FrozenException>(() => host.Server.Context.Get<RunService>().CreateAsync(new RunCreateContext { TenantId = host.TenantId, Agent = agent, Input = "tick", Kind = RunKindEnum.Keeper, MandateId = mandate.Id }, token)).ConfigureAwait(false);
                Assert.True(keeperRefused != null && keeperRefused.TargetKind == FreezeTargetKindEnum.TenantAutonomy, "A keeper run is refused while the switch is on");
                Run ordinary = await InvokeAsync(host, agent, 202, token).ConfigureAwait(false);
                Assert.Equal(RunKindEnum.Invoke, ordinary.Kind, "Ordinary invocations keep working");

                // Off: the overdue wakes were deferred, so nothing starts at once; the next interval starts the tick.
                KillSwitchState offAgain = await HttpTestHelpers.SendAsync<KillSwitchState>(host.AdminClient, HttpMethod.Put, T(host) + "/autonomy/kill-switch", new KillSwitchRequest { Enabled = false, Reason = "Resolved." }, 200, token).ConfigureAwait(false);
                Assert.True(!offAgain.Enabled, "The kill switch is off");
                int before = (await KeeperSuite.TicksOfAsync(host, mandate.Id, token).ConfigureAwait(false)).Count;
                await scheduler.SweepAsync(clock.AddSeconds(1), token).ConfigureAwait(false);
                Assert.Equal(before, (await KeeperSuite.TicksOfAsync(host, mandate.Id, token).ConfigureAwait(false)).Count, "No burst of overdue ticks right after the switch goes off");
                Assert.True(await scheduler.SweepAsync(clock.AddSeconds(61), token).ConfigureAwait(false), "The next interval starts a tick");
                MandateTick resumed = (await KeeperSuite.TicksOfAsync(host, mandate.Id, token).ConfigureAwait(false)).First(t => t.RunId != null);
                await KeeperSuite.WaitTickAsync(host, resumed.Id, token).ConfigureAwait(false);
                audit = await AuditAsync(host, token).ConfigureAwait(false);
                Assert.True(audit.Count(a => a.EventType == AuditEventTypeEnum.KillSwitchChanged) == 2, "Turning it off is audited");
            }
        }

        private static async Task CapsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await KeeperSuite.ClusterAsync(provider, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                host.Server.Context.Get<MaintenanceService>().Escalations = null;
                KeeperScheduler scheduler = host.Server.Context.Get<KeeperScheduler>();
                await KeeperSuite.ApplyScriptProfileAsync(host, token).ConfigureAwait(false);
                Agent agent = await cluster.CreateAgentAsync("cap-keeper", "keeper-script", null, token).ConfigureAwait(false);
                MandateRevision revision = KeeperSuite.Revision("Spend carefully.");
                revision.BudgetPerDayUsd = 0.00005;
                revision.EscalationTargetKind = EscalationTargetKindEnum.Role;
                revision.EscalationTargetId = "AgentOperator";
                Mandate mandate = await HttpTestHelpers.SendAsync<Mandate>(host.AdminClient, HttpMethod.Post, T(host) + "/mandates", KeeperSuite.Body("cap-pond", agent, revision), 201, token).ConfigureAwait(false);

                // The first tick runs and spends 0.0001 USD, twice the daily budget.
                Assert.True(await scheduler.SweepAsync(DateTime.UtcNow.AddSeconds(1), token).ConfigureAwait(false), "The first tick starts");
                MandateTick first = await WaitTickAsync(host, (await KeeperSuite.TicksOfAsync(host, mandate.Id, token).ConfigureAwait(false)).Single().Id, token).ConfigureAwait(false);
                Run firstRun = (await host.Server.Context.Database.Runs.ReadAsync(host.TenantId, first.RunId!, token).ConfigureAwait(false))!;
                Assert.True(firstRun.CostUsd.HasValue && firstRun.CostUsd.Value > 0.00005, "The tick run reported a cost: " + firstRun.CostUsd);

                // The Mandate quota scope counts the keeper's spend.
                UsageQuota scope = await HttpTestHelpers.SendAsync<UsageQuota>(host.AdminClient, HttpMethod.Post, T(host) + "/usage-quotas", new UsageQuota { Name = "cap-pond-quota", Scope = UsageQuotaScopeEnum.Mandate, ResourceId = mandate.Id }, 201, token).ConfigureAwait(false);
                UsageQuotaUsage usage = await HttpTestHelpers.SendAsync<UsageQuotaUsage>(host.AdminClient, HttpMethod.Get, T(host) + "/usage-quotas/" + scope.Id + "/usage", null, 200, token).ConfigureAwait(false);
                Assert.True(usage.RunsUsed == 1 && usage.CostUsd > 0.00005, "Mandate scope usage: " + Serializer.Serialize(usage));
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/usage-quotas", new UsageQuota { Name = "ghost", Scope = UsageQuotaScopeEnum.Mandate, ResourceId = "mdt_missing" }, token).ConfigureAwait(false)).StatusCode, "A Mandate quota needs a real mandate");

                // The next wake finds the budget spent: CapReached, a Skipped tick, and an Urgent escalation.
                await HttpTestHelpers.SendAsync<Mandate>(host.AdminClient, HttpMethod.Post, T(host) + "/mandates/" + mandate.Id + "/wake", null, 202, token).ConfigureAwait(false);
                DateTime now = DateTime.UtcNow.AddSeconds(1);
                Assert.True(await scheduler.SweepAsync(now, token).ConfigureAwait(false), "The sweep records the cap");
                Mandate capped = await HttpTestHelpers.SendAsync<Mandate>(host.AdminClient, HttpMethod.Get, T(host) + "/mandates/" + mandate.Id, null, 200, token).ConfigureAwait(false);
                DateTime reset = DateTime.SpecifyKind(now.Date.AddDays(1), DateTimeKind.Utc);
                Assert.True(capped.Status == MandateStatusEnum.CapReached && capped.NextWakeUtc.HasValue && capped.NextWakeUtc.Value >= reset && capped.NextWakeUtc.Value <= reset.AddSeconds(301), "CapReached until the window resets: " + Serializer.Serialize(capped));
                MandateTick cap = (await KeeperSuite.TicksOfAsync(host, mandate.Id, token).ConfigureAwait(false)).Single(t => t.ErrorCode == "CapReached");
                Assert.True(cap.Outcome == TickOutcomeEnum.Skipped && cap.RunId == null, "The cap is a Skipped tick: " + Serializer.Serialize(cap));
                EnumerationResult<Escalation> raised = await HttpTestHelpers.SendAsync<EnumerationResult<Escalation>>(host.AdminClient, HttpMethod.Get, T(host) + "/escalations?mandateId=" + mandate.Id, null, 200, token).ConfigureAwait(false);
                Assert.True(raised.Objects.Count == 1, "One escalation: " + Serializer.Serialize(raised.Objects));
                Escalation notice = raised.Objects[0];
                Assert.True(notice.Severity == EscalationSeverityEnum.Urgent && notice.TargetKind == EscalationTargetKindEnum.Role && notice.TargetName == "AgentOperator" && notice.RaisingRunId == null && notice.MandateTickId == cap.Id && notice.DeliveredTickId == cap.Id && notice.Status == EscalationStatusEnum.Open, "An Urgent escalation to the default role, already delivered: " + Serializer.Serialize(notice));
                Assert.True(notice.Question.Contains("daily budget", StringComparison.Ordinal) && notice.DefaultAnswer == "acknowledged" && notice.TimeoutAction == EscalationTimeoutActionEnum.UseDefaultAnswer, "The notice explains the cap: " + notice.Question);
                KeeperSuite.Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/mandates/" + mandate.Id + "/wake", null, token).ConfigureAwait(false), 409, "MandateNotActive", "A capped keeper cannot be woken");
                Assert.True(!await scheduler.SweepAsync(now.AddSeconds(120), token).ConfigureAwait(false), "Nothing happens while capped");

                // After the window resets, the keeper ticks again. (The scheduler runs on the injected clock; the run's
                // compilation uses the real one, where today's budget is still spent, so the test checks the start only.)
                DateTime after = capped.NextWakeUtc!.Value.AddSeconds(1);
                Assert.True(await scheduler.SweepAsync(after, token).ConfigureAwait(false), "The sweep after the reset starts a tick");
                Mandate reactivated = (await host.Server.Context.Database.Mandates.ReadAsync(host.TenantId, mandate.Id, token).ConfigureAwait(false))!;
                Assert.Equal(MandateStatusEnum.Active, reactivated.Status, "The keeper is Active again");
                List<MandateTick> ticks = await KeeperSuite.TicksOfAsync(host, mandate.Id, token).ConfigureAwait(false);
                MandateTick resumed = Assert.NotNull(ticks.FirstOrDefault(t => t.RunId != null && t.Id != first.Id), "A new tick started with a run: " + Serializer.Serialize(ticks));
                Run resumedRun = (await host.Server.Context.Database.Runs.ReadAsync(host.TenantId, resumed.RunId!, token).ConfigureAwait(false))!;
                Assert.True(resumedRun.InputText == null || !resumedRun.InputText.Contains("daily budget", StringComparison.Ordinal), "The cap notice is for people, not the keeper's input");

                // Per-tick budget: compilation lowers the harness budget to what the tick has left and refuses a spent tick.
                MandateRevision perTick = KeeperSuite.Revision("Small steps.");
                perTick.BudgetPerTickUsd = 0.0005;
                Mandate small = await HttpTestHelpers.SendAsync<Mandate>(host.AdminClient, HttpMethod.Post, T(host) + "/mandates", KeeperSuite.Body("cap-small", agent, perTick), 201, token).ConfigureAwait(false);
                Mandate smallStored = (await host.Server.Context.Database.Mandates.ReadAsync(host.TenantId, small.Id, token).ConfigureAwait(false))!;
                MandateTick tick = new MandateTick { TenantId = host.TenantId, MandateId = small.Id, RevisionId = smallStored.CurrentRevisionId, RevisionNumber = 1, StartedUtc = DateTime.UtcNow, ScheduledUtc = DateTime.UtcNow };
                await host.Server.Context.Database.MandateTicks.CreateAsync(tick, token).ConfigureAwait(false);
                Run tickRun = new Run { TenantId = host.TenantId, AgentId = agent.Id, Kind = RunKindEnum.Keeper, MandateId = small.Id, MandateTickId = tick.Id, CostUsd = 0.0001 };
                Deployment copy = new Deployment { MaxBudgetUsd = 1.0 };
                UsageQuotaPolicy policy = new UsageQuotaPolicy(host.Server.Context.Database);
                await policy.ApplyBudgetAsync(copy, tickRun, token).ConfigureAwait(false);
                Assert.True(copy.MaxBudgetUsd.HasValue && Math.Abs(copy.MaxBudgetUsd.Value - 0.0004) < 0.0000001, "The harness budget is what the tick has left: " + copy.MaxBudgetUsd);
                tickRun.CostUsd = 0.0006;
                CompilationException? spent = await CatchAsync<CompilationException>(() => policy.ApplyBudgetAsync(new Deployment(), tickRun, token)).ConfigureAwait(false);
                Assert.True(spent != null && spent.Code == "MandateBudgetExceeded", "A tick that spent its budget is refused at compilation");
                MandateBudgetStatus status = (await new MandateBudgetReader(host.Server.Context.Database).ReadForRunAsync(tickRun, DateTime.UtcNow, token).ConfigureAwait(false))!;
                Assert.Equal("budgetPerTickUsd", status.ExhaustedBudget ?? String.Empty, "The per-tick budget is the one spent");
            }
        }

        private static async Task ReplicasAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            // Sqlite's Auto backplane is in-process only, so two Sqlite replicas talk through the polling backplane.
            Garrison.Server.Backplane.BackplaneModeEnum backplane = provider == DatabaseTypeEnum.Postgresql ? Garrison.Server.Backplane.BackplaneModeEnum.Auto : Garrison.Server.Backplane.BackplaneModeEnum.Polling;
            await using (TestReplicaCluster cluster = await TestReplicaCluster.StartAsync(provider, 2, backplane, null, token).ConfigureAwait(false))
            {
                foreach (TestServerHost replica in cluster.Replicas) replica.Server.Context.Get<MaintenanceService>().Keepers = null;
                TestServerHost a = cluster.Replicas[0];
                TestServerHost b = cluster.Replicas[1];
                Agent agent = await cluster.CreateAgentAsync(0, "frz-replicated", null, token).ConfigureAwait(false);
                Agent deployed = await cluster.CreateAgentAsync(0, "frz-deployed", null, token).ConfigureAwait(false);

                // Replica B admits (and caches the empty freeze list), then A freezes the agent.
                await InvokeAsync(b, agent, 202, token).ConfigureAwait(false);
                await InvokeAsync(b, deployed, 202, token).ConfigureAwait(false);
                Freeze freeze = await HttpTestHelpers.SendAsync<Freeze>(a.AdminClient, HttpMethod.Post, T(a) + "/freezes", new Freeze { TargetKind = FreezeTargetKindEnum.Agent, TargetId = agent.Id }, 201, token).ConfigureAwait(false);
                long seen = await UntilAsync(async () => (await InvokeRawAsync(b, agent, token).ConfigureAwait(false)).StatusCode == 409, "Replica B refuses the frozen agent", token).ConfigureAwait(false);
                Assert.True(seen < b.Server.Context.Get<FreezeService>().CacheSeconds * 1000L, "Replica B honored the freeze in " + seen + " ms, before its cache would expire");

                Deployment deployment = (await a.Server.Context.Database.Deployments.ReadByNameAsync(a.TenantId, deployed.Name + "-default", token).ConfigureAwait(false))!;
                await HttpTestHelpers.SendAsync<Freeze>(b.AdminClient, HttpMethod.Post, T(b) + "/freezes", new Freeze { TargetKind = FreezeTargetKindEnum.Deployment, TargetId = deployment.Id }, 201, token).ConfigureAwait(false);
                await UntilAsync(async () => (await InvokeRawAsync(a, deployed, token).ConfigureAwait(false)).StatusCode == 409, "Replica A refuses the frozen deployment", token).ConfigureAwait(false);

                // Mandate and app freezes applied on A are honored by B's admission.
                Agent keeper = await cluster.CreateAgentAsync(0, "frz-replicated-keeper", null, token).ConfigureAwait(false);
                Mandate mandate = await HttpTestHelpers.SendAsync<Mandate>(a.AdminClient, HttpMethod.Post, T(a) + "/mandates", KeeperSuite.Body("frz-replicated-pond", keeper, KeeperSuite.Revision("Watch.")), 201, token).ConfigureAwait(false);
                AgenticApp app = await HttpTestHelpers.SendAsync<AgenticApp>(a.AdminClient, HttpMethod.Post, T(a) + "/apps", new AgenticApp { Name = "frz-replicated-app", EntryAgentId = keeper.Name, Members = new List<AgenticAppMember> { new AgenticAppMember { AgentId = keeper.Name } } }, 201, token).ConfigureAwait(false);
                RunService bRuns = b.Server.Context.Get<RunService>();
                Func<Task<bool>> tickRefused = async () => await CatchAsync<FrozenException>(() => bRuns.CreateAsync(new RunCreateContext { TenantId = b.TenantId, Agent = keeper, Input = "tick", Kind = RunKindEnum.Keeper, MandateId = mandate.Id }, token)).ConfigureAwait(false) != null;
                Func<Task<bool>> appRefused = async () => await CatchAsync<FrozenException>(() => bRuns.CreateAsync(new RunCreateContext { TenantId = b.TenantId, Agent = keeper, Input = "hi", AppId = app.Id }, token)).ConfigureAwait(false) != null;
                Assert.True(!await appRefused().ConfigureAwait(false), "Replica B admits the app before the freeze");
                await HttpTestHelpers.SendAsync<Freeze>(a.AdminClient, HttpMethod.Post, T(a) + "/freezes", new Freeze { TargetKind = FreezeTargetKindEnum.Mandate, TargetId = mandate.Id }, 201, token).ConfigureAwait(false);
                await UntilAsync(tickRefused, "Replica B refuses the frozen mandate's tick", token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<Freeze>(a.AdminClient, HttpMethod.Post, T(a) + "/freezes", new Freeze { TargetKind = FreezeTargetKindEnum.App, TargetId = app.Id }, 201, token).ConfigureAwait(false);
                long appSeen = await UntilAsync(appRefused, "Replica B refuses the frozen app", token).ConfigureAwait(false);
                Assert.True(appSeen < b.Server.Context.Get<FreezeService>().CacheSeconds * 1000L, "Replica B honored the app freeze in " + appSeen + " ms");

                // A lift on B is seen by A.
                await HttpTestHelpers.SendAsync<Freeze>(b.AdminClient, HttpMethod.Post, T(b) + "/freezes/" + freeze.Id + "/lift", null, 200, token).ConfigureAwait(false);
                await UntilAsync(async () => (await InvokeRawAsync(a, agent, token).ConfigureAwait(false)).StatusCode == 202, "Replica A admits the agent again", token).ConfigureAwait(false);
            }
        }

        private static async Task McpAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 0, token).ConfigureAwait(false))
            using (TestMcpClient person = new TestMcpClient())
            {
                TestServerHost host = cluster.Server;
                Agent agent = await cluster.CreateAgentAsync("frz-mcp", "builtin/fake", null, token).ConfigureAwait(false);
                string[] tools = new[] { "garrison_list_freezes", "garrison_freeze", "garrison_lift_freeze" };
                await person.ConnectAsync(host, null, token).ConfigureAwait(false);
                ProviderToolPage listed = await person.ToolsAsync(token).ConfigureAwait(false);
                foreach (string name in tools)
                {
                    Assert.True(listed.Tools.Any(t => t.Name == name), "People see " + name);
                    Assert.True(host.Server.Context.Scopes.Find("MCP", name) != null, name + " scope is registered");
                }

                Freeze applied = await person.CallAsync<Freeze>("garrison_freeze", new { targetKind = "Agent", target = agent.Name, reason = "From MCP." }, token).ConfigureAwait(false);
                Assert.True(applied.TargetId == agent.Id && applied.Active && applied.Reason == "From MCP.", "garrison_freeze: " + Serializer.Serialize(applied));
                await person.ExpectErrorAsync("garrison_freeze", new { targetKind = "Agent", target = agent.Name }, "AlreadyFrozen", token).ConfigureAwait(false);
                Freeze killSwitch = await person.CallAsync<Freeze>("garrison_freeze", new { targetKind = "TenantAutonomy" }, token).ConfigureAwait(false);
                McpFreezeList list = await person.CallAsync<McpFreezeList>("garrison_list_freezes", new { active = true }, token).ConfigureAwait(false);
                Assert.True(list.TotalCount == 2 && list.KillSwitchEnabled, "garrison_list_freezes: " + Serializer.Serialize(list));
                McpFreezeList agents = await person.CallAsync<McpFreezeList>("garrison_list_freezes", new { targetKind = "Agent" }, token).ConfigureAwait(false);
                Assert.True(agents.Freezes.Count == 1 && agents.Freezes[0].Id == applied.Id, "Filter by target kind");

                // Run tokens never see or call the freeze tools.
                User admin = Assert.NotNull(await host.Server.Context.Database.Users.ReadByEmailAsync(host.TenantId, "admin@garrison", token).ConfigureAwait(false), "The seeded admin user");
                Run running = new Run { Id = IdGenerator.NewRunId(), TenantId = host.TenantId, AgentId = agent.Id, AgentName = agent.Name, Status = RunStatusEnum.Running, LeaseEpoch = 1, CallerType = PrincipalTypeEnum.User, CallerId = admin.Id, CallerName = admin.Email, LeaseExpiresUtc = DateTime.UtcNow.AddMinutes(5) };
                running.DeploymentId = (await host.Server.Context.Database.Deployments.ReadByNameAsync(host.TenantId, agent.Name + "-default", token).ConfigureAwait(false))!.Id;
                running = await host.Server.Context.Database.Runs.CreateAsync(running, token).ConfigureAwait(false);
                string bearer = await host.Server.Context.Authentication.IssueForRunAsync(running, running.LeaseEpoch, DateTime.UtcNow.AddMinutes(5), token).ConfigureAwait(false);
                using (TestMcpClient run = new TestMcpClient())
                {
                    await run.ConnectAsync(host, bearer, token).ConfigureAwait(false);
                    ProviderToolPage runTools = await run.ToolsAsync(token).ConfigureAwait(false);
                    foreach (string name in tools) Assert.True(!runTools.Tools.Any(t => t.Name == name), "A run does not see " + name);
                    await run.ExpectErrorAsync("garrison_lift_freeze", new { freezeId = killSwitch.Id }, "Forbidden", token).ConfigureAwait(false);
                    await run.ExpectErrorAsync("garrison_freeze", new { targetKind = "Agent", target = agent.Id }, "Forbidden", token).ConfigureAwait(false);
                }
                using (HttpClient runHttp = new HttpClient { BaseAddress = new Uri(host.BaseUrl) })
                {
                    runHttp.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", bearer);
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(runHttp, HttpMethod.Post, T(host) + "/freezes/" + killSwitch.Id + "/lift", null, token).ConfigureAwait(false)).StatusCode, "A run token cannot lift a freeze over REST");
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(runHttp, HttpMethod.Put, T(host) + "/autonomy/kill-switch", new KillSwitchRequest { Enabled = false }, token).ConfigureAwait(false)).StatusCode, "A run token cannot flip the kill switch");
                }

                Freeze lifted = await person.CallAsync<Freeze>("garrison_lift_freeze", new { freezeId = applied.Id, reason = "Done." }, token).ConfigureAwait(false);
                Assert.True(!lifted.Active && lifted.LiftReason == "Done.", "garrison_lift_freeze");
                await person.ExpectErrorAsync("garrison_lift_freeze", new { freezeId = applied.Id }, "FreezeLifted", token).ConfigureAwait(false);
                await person.ExpectErrorAsync("garrison_lift_freeze", new { freezeId = "mfz_missing" }, "NotFound", token).ConfigureAwait(false);
            }
        }

        private static async Task ChannelAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 0, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                Agent agent = await cluster.CreateAgentAsync("frz-live", "builtin/fake", null, token).ConfigureAwait(false);
                using (ClientWebSocket socket = new ClientWebSocket())
                {
                    string bearer;
                    using (HttpClient login = await host.UserClientAsync("admin@garrison", "password", host.TenantId, token).ConfigureAwait(false))
                    {
                        bearer = login.DefaultRequestHeaders.Authorization!.Parameter!;
                    }
                    await socket.ConnectAsync(new Uri(host.BaseUrl.Replace("http://", "ws://", StringComparison.Ordinal) + "/v1.0/ws?token=" + Uri.EscapeDataString(bearer)), token).ConfigureAwait(false);
                    await socket.SendAsync(Encoding.UTF8.GetBytes("{\"type\":\"subscribe\",\"channel\":\"freezes\"}"), WebSocketMessageType.Text, true, token).ConfigureAwait(false);
                    string opening = await KeeperSuite.ReceiveUntilAsync(socket, "freezes.active", "\"active\"", token).ConfigureAwait(false);
                    Assert.True(opening.Contains("\"active\":0", StringComparison.Ordinal) && opening.Contains("\"killSwitch\":false", StringComparison.Ordinal), "The active count comes first: " + opening);
                    await Task.Delay(1200, token).ConfigureAwait(false);

                    Freeze applied = await HttpTestHelpers.SendAsync<Freeze>(host.AdminClient, HttpMethod.Post, T(host) + "/freezes", new Freeze { TargetKind = FreezeTargetKindEnum.Agent, TargetId = agent.Id }, 201, token).ConfigureAwait(false);
                    string appliedMessage = await KeeperSuite.ReceiveUntilAsync(socket, "freeze.applied", applied.Id, token).ConfigureAwait(false);
                    Assert.True(appliedMessage.Contains("\"active\":1", StringComparison.Ordinal), "Applied carries the active count: " + appliedMessage);
                    await HttpTestHelpers.SendAsync<Freeze>(host.AdminClient, HttpMethod.Post, T(host) + "/freezes/" + applied.Id + "/lift", null, 200, token).ConfigureAwait(false);
                    await KeeperSuite.ReceiveUntilAsync(socket, "freeze.lifted", applied.Id, token).ConfigureAwait(false);
                    KillSwitchState on = await HttpTestHelpers.SendAsync<KillSwitchState>(host.AdminClient, HttpMethod.Put, T(host) + "/autonomy/kill-switch", new KillSwitchRequest { Enabled = true }, 200, token).ConfigureAwait(false);
                    string switched = await KeeperSuite.ReceiveUntilAsync(socket, "killswitch.changed", on.FreezeId!, token).ConfigureAwait(false);
                    Assert.True(switched.Contains("\"killSwitch\":true", StringComparison.Ordinal), "The kill switch message says it is on: " + switched);
                }
                using (ClientWebSocket outsider = new ClientWebSocket())
                {
                    await KeeperSuite.UserAsync(host, "frz-member@example.com", "TenantMember", token).ConfigureAwait(false);
                    string memberBearer;
                    using (HttpClient login = await host.UserClientAsync("frz-member@example.com", "password123", host.TenantId, token).ConfigureAwait(false))
                    {
                        memberBearer = login.DefaultRequestHeaders.Authorization!.Parameter!;
                    }
                    await outsider.ConnectAsync(new Uri(host.BaseUrl.Replace("http://", "ws://", StringComparison.Ordinal) + "/v1.0/ws?token=" + Uri.EscapeDataString(memberBearer)), token).ConfigureAwait(false);
                    await outsider.SendAsync(Encoding.UTF8.GetBytes("{\"type\":\"subscribe\",\"channel\":\"freezes\"}"), WebSocketMessageType.Text, true, token).ConfigureAwait(false);
                    string refused = await KeeperSuite.ReceiveUntilAsync(outsider, "error", "freezes", token).ConfigureAwait(false);
                    Assert.True(refused.Length > 0, "Without Freeze.Read the channel is refused");
                }
            }
        }

        private static async Task NotificationsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (FakeWebhookReceiver receiver = new FakeWebhookReceiver())
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 0, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                host.Server.Context.Get<MaintenanceService>().Notifications = null;
                host.Server.Context.Get<MaintenanceService>().Keepers = null;
                NotificationService notifications = host.Server.Context.Get<NotificationService>();
                await notifications.StopAsync().ConfigureAwait(false);
                notifications.Options.AllowPrivateDestinations = true;
                Agent agent = await cluster.CreateAgentAsync("frz-notify", "builtin/fake", null, token).ConfigureAwait(false);
                Agent other = await cluster.CreateAgentAsync("frz-notify-other", "builtin/fake", null, token).ConfigureAwait(false);

                NotificationEndpoint all = await HttpTestHelpers.SendAsync<NotificationEndpoint>(host.AdminClient, HttpMethod.Post, T(host) + "/notification-endpoints", new NotificationEndpoint { Name = "brakes-all", Url = receiver.BaseUrl + "/all", Events = new List<NotificationEventEnum> { NotificationEventEnum.FreezeApplied, NotificationEventEnum.MandateCapReached } }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<NotificationEndpoint>(host.AdminClient, HttpMethod.Post, T(host) + "/notification-endpoints", new NotificationEndpoint { Name = "brakes-agent", Url = receiver.BaseUrl + "/agent", AgentId = agent.Id, Events = new List<NotificationEventEnum> { NotificationEventEnum.FreezeApplied } }, 201, token).ConfigureAwait(false);
                await notifications.SweepAsync(token).ConfigureAwait(false);

                Freeze agentFreeze = await HttpTestHelpers.SendAsync<Freeze>(host.AdminClient, HttpMethod.Post, T(host) + "/freezes", new Freeze { TargetKind = FreezeTargetKindEnum.Agent, TargetId = agent.Id, Reason = "Notify me." }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<Freeze>(host.AdminClient, HttpMethod.Post, T(host) + "/freezes", new Freeze { TargetKind = FreezeTargetKindEnum.Agent, TargetId = other.Id }, 201, token).ConfigureAwait(false);
                Mandate mandate = await HttpTestHelpers.SendAsync<Mandate>(host.AdminClient, HttpMethod.Post, T(host) + "/mandates", KeeperSuite.Body("frz-capped", other, KeeperSuite.Revision("Watch.")), 201, token).ConfigureAwait(false);
                Mandate stored = (await host.Server.Context.Database.Mandates.ReadAsync(host.TenantId, mandate.Id, token).ConfigureAwait(false))!;
                MandateTick cap = new MandateTick { TenantId = host.TenantId, MandateId = mandate.Id, RevisionId = stored.CurrentRevisionId, RevisionNumber = 1, StartedUtc = DateTime.UtcNow, ScheduledUtc = DateTime.UtcNow, FinishedUtc = DateTime.UtcNow, Outcome = TickOutcomeEnum.Skipped, ErrorCode = "CapReached", ErrorMessage = "Spent." };
                await host.Server.Context.Database.MandateTicks.CreateAsync(cap, token).ConfigureAwait(false);

                DateTime deadline = DateTime.UtcNow.AddSeconds(30);
                while (receiver.For("/all").Count < 3 || receiver.For("/agent").Count < 1)
                {
                    if (DateTime.UtcNow > deadline) throw new TestAssertionException("Brake notifications did not arrive: all " + receiver.For("/all").Count + ", agent " + receiver.For("/agent").Count);
                    await notifications.SweepAsync(token).ConfigureAwait(false);
                    await notifications.DispatchOnceAsync(token).ConfigureAwait(false);
                    await Task.Delay(200, token).ConfigureAwait(false);
                }
                await notifications.SweepAsync(token).ConfigureAwait(false);
                await notifications.DispatchOnceAsync(token).ConfigureAwait(false);
                List<WebhookReceipt> receipts = receiver.For("/all");
                Assert.Equal(3, receipts.Count, "Two freezes and one cap, once each");
                List<NotificationPayload> payloads = new List<NotificationPayload>();
                foreach (WebhookReceipt receipt in receipts)
                {
                    Assert.Equal(WebhookSignatureResultEnum.Valid, WebhookSigner.Verify(receipt.Signature, all.SigningSecret, receipt.Body, DateTime.UtcNow, 300), "Signed with the endpoint secret");
                    payloads.Add(Serializer.Deserialize<NotificationPayload>(Encoding.UTF8.GetString(receipt.Body))!);
                }
                NotificationPayload frozen = payloads.Single(p => p.Event == NotificationEventEnum.FreezeApplied && p.Freeze?.Id == agentFreeze.Id);
                Assert.True(frozen.Freeze!.TargetKind == FreezeTargetKindEnum.Agent && frozen.Freeze.TargetName == agent.Name && frozen.Freeze.Reason == "Notify me." && frozen.Link != null && frozen.Link.Contains("/freezes/" + agentFreeze.Id, StringComparison.Ordinal), "FreezeApplied payload: " + Serializer.Serialize(frozen));
                NotificationPayload capped = payloads.Single(p => p.Event == NotificationEventEnum.MandateCapReached);
                Assert.True(capped.MandateCap!.MandateId == mandate.Id && capped.MandateCap.MandateName == mandate.Name && capped.MandateCap.TickId == cap.Id && capped.MandateCap.AgentId == other.Id, "MandateCapReached payload: " + Serializer.Serialize(capped));
                List<WebhookReceipt> agentReceipts = receiver.For("/agent");
                Assert.True(agentReceipts.Count == 1 && Encoding.UTF8.GetString(agentReceipts[0].Body).Contains(agentFreeze.Id, StringComparison.Ordinal), "The agent-filtered endpoint received only its agent's freeze");
            }
        }

        private static string T(TestServerHost host)
        {
            return "/v1.0/api/tenants/" + host.TenantId;
        }

        private static async Task<TestResponse> InvokeRawAsync(TestServerHost host, Agent agent, CancellationToken token)
        {
            InvokeRequest request = new InvokeRequest();
            request.Input = "Hello.";
            request.Wait = false;
            return await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/agents/" + agent.Id + "/invoke", request, token).ConfigureAwait(false);
        }

        private static async Task<Run> InvokeAsync(TestServerHost host, Agent agent, int expected, CancellationToken token)
        {
            TestResponse response = await InvokeRawAsync(host, agent, token).ConfigureAwait(false);
            Assert.Equal(expected, response.StatusCode, "Invoke " + agent.Name + ": " + response.Body);
            return Serializer.Deserialize<Run>(response.Body) ?? throw new TestAssertionException("Empty run.");
        }

        private static async Task<MandateTick> WaitTickAsync(TestServerHost host, string tickId, CancellationToken token)
        {
            DateTime deadline = DateTime.UtcNow.AddSeconds(60);
            while (true)
            {
                MandateTick tick = (await host.Server.Context.Database.MandateTicks.ReadAsync(host.TenantId, tickId, token).ConfigureAwait(false))!;
                if (tick.FinishedUtc.HasValue) return tick;
                if (DateTime.UtcNow > deadline)
                {
                    Run? run = tick.RunId == null ? null : await host.Server.Context.Database.Runs.ReadAsync(host.TenantId, tick.RunId, token).ConfigureAwait(false);
                    throw new TestAssertionException("Tick " + tickId + " did not finish; run " + tick.RunId + " is " + run?.Status + " (" + run?.Outcome + ": " + run?.ErrorMessage + ")");
                }
                await Task.Delay(100, token).ConfigureAwait(false);
            }
        }

        private static async Task<List<AuditRecord>> AuditAsync(TestServerHost host, CancellationToken token)
        {
            EnumerationResult<AuditRecord> page = await host.Server.Context.Database.Audit.EnumerateAsync(host.TenantId, new EnumerationQuery { MaxResults = 1000 }, token).ConfigureAwait(false);
            return page.Objects;
        }

        private static async Task<long> UntilAsync(Func<Task<bool>> condition, string what, CancellationToken token)
        {
            Stopwatch watch = Stopwatch.StartNew();
            while (!await condition().ConfigureAwait(false))
            {
                if (watch.ElapsedMilliseconds > 20000) throw new TestAssertionException(what + " within 20 seconds.");
                await Task.Delay(100, token).ConfigureAwait(false);
            }
            return watch.ElapsedMilliseconds;
        }

        private static async Task<T?> CatchAsync<T>(Func<Task> action) where T : Exception
        {
            try
            {
                await action().ConfigureAwait(false);
                return null;
            }
            catch (T e)
            {
                return e;
            }
        }

        #endregion
    }
}
