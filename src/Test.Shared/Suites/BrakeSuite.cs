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
                cases.Add(new TestCaseDescriptor(id, "cascade", "Cancel-all on a unit cancels its running and queued runs, withdraws its escalations, and expires its queued mail in one audited action; nothing in the subtree stays active, the rest is untouched; 404, 409 OrganizationNotLive, scope map, MCP for people only (" + provider + ")", ct => CascadeAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "auto-freeze", "A subtree past its budget plus the 10 percent margin is frozen once by the guard with its runs cancelled, audited, and OrgBudgetFrozen sent; lifting keeps it lifted for the window; a margin of 0 freezes at the cap from admission (" + provider + ")", ct => AutoFreezeAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "margin", "budgetFreezeMarginPercent defaults to 10, is 0 to 100 on REST, MCP, and manifests, and exports (" + provider + ")", ct => MarginAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "rollback-ticks", "Rolling back mid-tick: Finish keeps the tick and moves the mandate to its pin at once, the finished tick moves nothing, an unpinned mandate is paused; Cancel cancels the tick's run first (" + provider + ")", ct => RollbackTicksAsync(provider, ct)));
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
                KeeperSuite.Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/freezes", new Freeze { TargetKind = FreezeTargetKindEnum.OrgUnit, TargetId = "unit" }, token).ConfigureAwait(false), 404, "NotFound", "An unknown unit cannot be frozen");
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

        private static async Task CascadeAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                host.Server.Context.Get<MaintenanceService>().Keepers = null;
                host.Server.Context.Get<MaintenanceService>().OrgBudgets = null;
                OrgFixture f = await OrganizationSuite.FixtureAsync(host, "cas", token).ConfigureAwait(false);
                RequestContext admin = OrganizationSuite.Admin(host);
                RunService runs = host.Server.Context.Get<RunService>();
                EscalationService escalations = host.Server.Context.Get<EscalationService>();
                MessageService messages = host.Server.Context.Get<MessageService>();
                Deployment workerDeployment = await OrganizationSuite.DeploymentAsync(host, f.Worker, token).ConfigureAwait(false);
                Deployment leadDeployment = await OrganizationSuite.DeploymentAsync(host, f.Lead, token).ConfigureAwait(false);
                await OrganizationSuite.DeploymentAsync(host, f.Seller, token).ConfigureAwait(false);

                // Inside the ops subtree: two running runs and a queued one, an escalation, and a queued message.
                Run workerRunning = OrganizationSuite.RunOf(host, f.Worker);
                workerRunning.DeploymentId = workerDeployment.Id;
                workerRunning.LeaseExpiresUtc = DateTime.UtcNow.AddMinutes(5);
                workerRunning = await host.Server.Context.Database.Runs.CreateAsync(workerRunning, token).ConfigureAwait(false);
                Run leadRunning = OrganizationSuite.RunOf(host, f.Lead);
                leadRunning.DeploymentId = leadDeployment.Id;
                leadRunning.LeaseExpiresUtc = DateTime.UtcNow.AddMinutes(5);
                leadRunning = await host.Server.Context.Database.Runs.CreateAsync(leadRunning, token).ConfigureAwait(false);
                Run workerQueued = await runs.CreateAsync(new RunCreateContext { TenantId = host.TenantId, Agent = f.Worker, Input = "queued", CallerType = PrincipalTypeEnum.Administrator }, token).ConfigureAwait(false);
                Escalation inside = await escalations.RaiseAsync(workerRunning, new Escalation { Question = "Which way?", TargetKind = EscalationTargetKindEnum.Manager, TimeoutSeconds = 600 }, token).ConfigureAwait(false);
                AgentMessage toWorker = await messages.SendFromPersonAsync(admin, host.TenantId, new AgentMessageSendRequest { Recipient = f.Worker.Id, Subject = "For the worker" }, token).ConfigureAwait(false);

                // Outside it: a queued seller run, the seller's escalation, and a message to the seller.
                Run sellerQueued = await runs.CreateAsync(new RunCreateContext { TenantId = host.TenantId, Agent = f.Seller, Input = "sell", CallerType = PrincipalTypeEnum.Administrator }, token).ConfigureAwait(false);
                Escalation outside = await escalations.RaiseAsync(OrganizationSuite.RunOf(host, f.Seller), new Escalation { Question = "Price?", TargetKind = EscalationTargetKindEnum.Manager, TimeoutSeconds = 600 }, token).ConfigureAwait(false);
                AgentMessage toSeller = await messages.SendFromPersonAsync(admin, host.TenantId, new AgentMessageSendRequest { Recipient = f.Seller.Id, Subject = "For the seller" }, token).ConfigureAwait(false);

                int queuedInside = 0;
                foreach (Agent member in new[] { f.Lead, f.Worker })
                {
                    EnumerationResult<AgentMessage> page = await host.Server.Context.Database.AgentMessages.EnumerateAsync(new AgentMessageFilter { TenantId = host.TenantId, RecipientAgentId = member.Id, Status = MessageStatusEnum.Queued }, token).ConfigureAwait(false);
                    queuedInside += page.Objects.Count;
                }
                Assert.True(queuedInside >= 1, "The subtree has queued mail before the cascade");

                string b = T(host) + "/organizations/" + f.Org.Id;
                CascadeCancelResult result = await HttpTestHelpers.SendAsync<CascadeCancelResult>(host.AdminClient, HttpMethod.Post, b + "/units/" + f.Ops.Name + "/cancel-all", new CascadeCancelRequest { Reason = "Runaway unit." }, 200, token).ConfigureAwait(false);
                Assert.True(result.OrganizationId == f.Org.Id && result.UnitId == f.Ops.Id && result.UnitName == f.Ops.Name, "The result names the unit: " + Serializer.Serialize(result));
                Assert.True(result.RunsCancelled >= 3 && result.RunIds.Count == result.RunsCancelled && result.RunIds.Contains(workerRunning.Id) && result.RunIds.Contains(leadRunning.Id) && result.RunIds.Contains(workerQueued.Id), "The three runs (and any run the escalation's urgent message woke) are cancelled: " + Serializer.Serialize(result));
                Assert.True(result.EscalationsWithdrawn == 1 && result.MessagesExpired == queuedInside && result.TicksCancelled == 0, "One escalation and the queued mail: " + Serializer.Serialize(result));

                Assert.Equal(RunStatusEnum.Cancelling, (await host.Server.Context.Database.Runs.ReadAsync(host.TenantId, workerRunning.Id, token).ConfigureAwait(false))!.Status, "A running run goes to Cancelling");
                Assert.Equal(RunStatusEnum.Cancelling, (await host.Server.Context.Database.Runs.ReadAsync(host.TenantId, leadRunning.Id, token).ConfigureAwait(false))!.Status, "The lead's running run goes to Cancelling");
                Assert.Equal(RunStatusEnum.Cancelled, (await host.Server.Context.Database.Runs.ReadAsync(host.TenantId, workerQueued.Id, token).ConfigureAwait(false))!.Status, "A queued run is Cancelled");
                Assert.Equal(RunStatusEnum.Queued, (await host.Server.Context.Database.Runs.ReadAsync(host.TenantId, sellerQueued.Id, token).ConfigureAwait(false))!.Status, "A run outside the subtree is left alone");
                Escalation withdrawn = (await host.Server.Context.Database.Escalations.ReadAsync(host.TenantId, inside.Id, token).ConfigureAwait(false))!;
                Assert.True(withdrawn.Status == EscalationStatusEnum.Withdrawn && withdrawn.AnswerText == "Runaway unit." && withdrawn.ResolutionSource == EscalationResolutionSourceEnum.User, "The subtree's escalation is withdrawn with the reason: " + Serializer.Serialize(withdrawn));
                Assert.Equal(EscalationStatusEnum.Open, (await host.Server.Context.Database.Escalations.ReadAsync(host.TenantId, outside.Id, token).ConfigureAwait(false))!.Status, "An escalation outside stays Open");
                Assert.Equal(MessageStatusEnum.Expired, (await host.Server.Context.Database.AgentMessages.ReadAsync(host.TenantId, toWorker.Id, token).ConfigureAwait(false))!.Status, "Queued mail to the subtree expires");
                Assert.Equal(MessageStatusEnum.Queued, (await host.Server.Context.Database.AgentMessages.ReadAsync(host.TenantId, toSeller.Id, token).ConfigureAwait(false))!.Status, "Mail outside stays queued");

                // Nothing in the subtree remains active.
                foreach (Agent member in new[] { f.Lead, f.Worker })
                {
                    Assert.Equal(0, (await host.Server.Context.Database.Runs.ListActiveInScopeAsync(host.TenantId, FreezeTargetKindEnum.Agent, member.Id, 100, token).ConfigureAwait(false)).Count, member.Name + " has no active runs");
                    Assert.Equal(0L, (await host.Server.Context.Database.Escalations.EnumerateAsync(new EscalationFilter { TenantId = host.TenantId, AgentId = member.Id, Status = EscalationStatusEnum.Open }, token).ConfigureAwait(false)).TotalRecords, member.Name + " has no open escalations");
                    Assert.Equal(0, (await host.Server.Context.Database.AgentMessages.EnumerateAsync(new AgentMessageFilter { TenantId = host.TenantId, RecipientAgentId = member.Id, Status = MessageStatusEnum.Queued }, token).ConfigureAwait(false)).Objects.Count, member.Name + " has no queued mail");
                }
                Assert.True((await AuditAsync(host, token).ConfigureAwait(false)).Any(a => a.EventType == AuditEventTypeEnum.UnitCascadeCancelled && a.ResourceId == f.Org.Id && (a.Description ?? String.Empty).Contains(result.RunsCancelled + " run(s)", StringComparison.Ordinal) && (a.Description ?? String.Empty).Contains("Runaway unit.", StringComparison.Ordinal)), "One UnitCascadeCancelled audit record with the counts");
                Assert.Equal(0, (await FreezesOfAsync(host, f.Ops.Id, token).ConfigureAwait(false)).Count, "The cascade does not freeze");

                // Errors, scopes, and MCP.
                KeeperSuite.Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, b + "/units/no-such-unit/cancel-all", null, token).ConfigureAwait(false), 404, "NotFound", "An unknown unit");
                KeeperSuite.Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, b + "/units/" + f.Ops.Id + "/cancel-all", new CascadeCancelRequest { Reason = new string('r', 1025) }, token).ConfigureAwait(false), 400, "TooLong", "A reason over 1024 characters");
                Organization draft = await host.Server.Context.Get<OrganizationService>().CreateAsync(admin, host.TenantId, new Organization { Name = "cas-draft" }, token).ConfigureAwait(false);
                OrgUnit draftRoot = await host.Server.Context.Get<OrganizationService>().CreateUnitAsync(admin, draft, new OrgUnit { Name = "draft-root", LeadAgentId = f.Stranger.Id }, token).ConfigureAwait(false);
                KeeperSuite.Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/organizations/" + draft.Id + "/units/" + draftRoot.Id + "/cancel-all", null, token).ConfigureAwait(false), 409, "OrganizationNotLive", "An organization without a live revision");
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, b + "/units/" + draftRoot.Id + "/cancel-all", null, token).ConfigureAwait(false)).StatusCode, "A unit of another organization");
                Garrison.Server.Routes.OperationScope? scope = host.Server.Context.Scopes.Find("POST", "/v1.0/api/tenants/{tenantId}/organizations/{id}/units/{unitId}/cancel-all");
                Assert.True(scope != null && scope.ResourceType == ResourceTypeEnum.Organization && scope.Operation == OperationTypeEnum.Update, "The route is in the scope map as Organization Update");
                Assert.True(host.Server.Context.Scopes.Find("MCP", "garrison_unit_cancel_all") != null, "The MCP tool is in the scope map");
                using (TestMcpClient person = new TestMcpClient())
                {
                    await person.ConnectAsync(host, null, token).ConfigureAwait(false);
                    ProviderToolPage listed = await person.ToolsAsync(token).ConfigureAwait(false);
                    Assert.True(listed.Tools.Any(t => t.Name == "garrison_unit_cancel_all"), "People see garrison_unit_cancel_all");
                    CascadeCancelResult viaMcp = await person.CallAsync<CascadeCancelResult>("garrison_unit_cancel_all", new { organization = f.Org.Name, unitId = f.Sales.Name, reason = "Pause sales." }, token).ConfigureAwait(false);
                    Assert.True(viaMcp.UnitId == f.Sales.Id && viaMcp.RunsCancelled == 1 && viaMcp.RunIds.Single() == sellerQueued.Id && viaMcp.EscalationsWithdrawn == 1, "garrison_unit_cancel_all stops the sales subtree: " + Serializer.Serialize(viaMcp));
                    await person.ExpectErrorAsync("garrison_unit_cancel_all", new { organization = f.Org.Name }, "unitId", token).ConfigureAwait(false);
                }
                Run strangerRun = OrganizationSuite.RunOf(host, f.Stranger);
                strangerRun.DeploymentId = (await OrganizationSuite.DeploymentAsync(host, f.Stranger, token).ConfigureAwait(false)).Id;
                strangerRun.LeaseExpiresUtc = DateTime.UtcNow.AddMinutes(5);
                strangerRun = await host.Server.Context.Database.Runs.CreateAsync(strangerRun, token).ConfigureAwait(false);
                using (TestMcpClient run = await OrganizationSuite.RunClientAsync(host, strangerRun, token).ConfigureAwait(false))
                {
                    ProviderToolPage runTools = await run.ToolsAsync(token).ConfigureAwait(false);
                    Assert.True(!runTools.Tools.Any(t => t.Name == "garrison_unit_cancel_all"), "A run does not see garrison_unit_cancel_all");
                    await run.ExpectErrorAsync("garrison_unit_cancel_all", new { organization = f.Org.Name, unitId = f.Ops.Name }, "Forbidden", token).ConfigureAwait(false);
                }
            }
        }

        private static async Task AutoFreezeAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (FakeWebhookReceiver receiver = new FakeWebhookReceiver())
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                MaintenanceService maintenance = host.Server.Context.Get<MaintenanceService>();
                maintenance.Keepers = null;
                maintenance.OrgBudgets = null;
                maintenance.Notifications = null;
                NotificationService notifications = host.Server.Context.Get<NotificationService>();
                await notifications.StopAsync().ConfigureAwait(false);
                notifications.Options.AllowPrivateDestinations = true;
                OrgBudgetGuard guard = host.Server.Context.Get<OrgBudgetGuard>();
                guard.SpendCacheSeconds = 0;
                OrganizationService service = host.Server.Context.Get<OrganizationService>();
                RequestContext admin = OrganizationSuite.Admin(host);
                OrgFixture f = await OrganizationSuite.FixtureAsync(host, "afz", token).ConfigureAwait(false);
                await service.UpdateUnitAsync(admin, f.Org, f.Ops, new OrgUnit { Name = f.Ops.Name, ParentUnitId = f.Root.Id, LeadAgentId = f.Lead.Id, Members = new List<OrgUnitMember> { new OrgUnitMember { AgentId = f.Worker.Id } }, Budgets = new List<OrgUnitBudget> { new OrgUnitBudget { Period = BudgetPeriodEnum.Day, AmountUsd = 1 } } }, token).ConfigureAwait(false);
                await service.UpdateUnitAsync(admin, f.Org, f.Sales, new OrgUnit { Name = f.Sales.Name, ParentUnitId = f.Root.Id, LeadAgentId = f.Seller.Id, Budgets = new List<OrgUnitBudget> { new OrgUnitBudget { Period = BudgetPeriodEnum.Day, AmountUsd = 1 } } }, token).ConfigureAwait(false);
                await service.PublishAsync(admin, f.Org, await service.CreateRevisionAsync(admin, f.Org, "Budgets", token).ConfigureAwait(false), token).ConfigureAwait(false);
                Assert.Equal(10, f.Org.BudgetFreezeMarginPercent, "The margin defaults to 10 percent");
                NotificationEndpoint endpoint = await HttpTestHelpers.SendAsync<NotificationEndpoint>(host.AdminClient, HttpMethod.Post, T(host) + "/notification-endpoints", new NotificationEndpoint { Name = "afz-board", Url = receiver.BaseUrl + "/board", Events = new List<NotificationEventEnum> { NotificationEventEnum.OrgBudgetFrozen } }, 201, token).ConfigureAwait(false);
                Deployment workerDeployment = await OrganizationSuite.DeploymentAsync(host, f.Worker, token).ConfigureAwait(false);
                Deployment leadDeployment = await OrganizationSuite.DeploymentAsync(host, f.Lead, token).ConfigureAwait(false);
                Deployment sellerDeployment = await OrganizationSuite.DeploymentAsync(host, f.Seller, token).ConfigureAwait(false);

                // Past the budget but inside the margin: refused at admission, never frozen.
                await SpendAsync(host, f.Worker, workerDeployment, 1.05, token).ConfigureAwait(false);
                Assert.Equal(0, await guard.SweepAsync(DateTime.UtcNow, token).ConfigureAwait(false), "1.05 of 1 USD with a 10 percent margin is not frozen");
                Assert.Equal(0, (await FreezesOfAsync(host, f.Ops.Id, token).ConfigureAwait(false)).Count, "No freeze inside the margin");

                // Past the margin: the sweep freezes the unit once, cancelling its active runs.
                Run leadRunning = OrganizationSuite.RunOf(host, f.Lead);
                leadRunning.DeploymentId = leadDeployment.Id;
                leadRunning.LeaseExpiresUtc = DateTime.UtcNow.AddMinutes(5);
                leadRunning = await host.Server.Context.Database.Runs.CreateAsync(leadRunning, token).ConfigureAwait(false);
                await SpendAsync(host, f.Worker, workerDeployment, 0.2, token).ConfigureAwait(false);
                Assert.Equal(1, await guard.SweepAsync(DateTime.UtcNow, token).ConfigureAwait(false), "1.25 of 1 USD is past the margin");
                List<Freeze> frozen = await FreezesOfAsync(host, f.Ops.Id, token).ConfigureAwait(false);
                Freeze freeze = frozen.Single();
                Assert.True(freeze.Active && freeze.TargetKind == FreezeTargetKindEnum.OrgUnit && freeze.CreatedByName == OrgBudgetGuard.FreezerName && freeze.CancelActiveRuns
                    && (freeze.Reason ?? String.Empty).Contains(f.Ops.Name, StringComparison.Ordinal) && (freeze.Reason ?? String.Empty).Contains("1.25", StringComparison.Ordinal) && (freeze.Reason ?? String.Empty).Contains("daily", StringComparison.Ordinal), "The guard's freeze: " + Serializer.Serialize(freeze));
                Assert.Equal(RunStatusEnum.Cancelling, (await host.Server.Context.Database.Runs.ReadAsync(host.TenantId, leadRunning.Id, token).ConfigureAwait(false))!.Status, "The freeze cancelled the subtree's running run");
                Assert.True((await AuditAsync(host, token).ConfigureAwait(false)).Any(a => a.EventType == AuditEventTypeEnum.OrgBudgetFrozen && a.ResourceId == freeze.Id), "OrgBudgetFrozen is audited");
                Assert.Equal(0, await guard.SweepAsync(DateTime.UtcNow, token).ConfigureAwait(false), "An active freeze already covers the unit");
                await host.Server.Context.Get<FreezeService>().LiftAsync(admin, freeze, "Raised the budget elsewhere.", token).ConfigureAwait(false);
                Assert.Equal(0, await guard.SweepAsync(DateTime.UtcNow, token).ConfigureAwait(false), "Once lifted, the unit stays unfrozen for the rest of the window");
                Assert.Equal(1, (await FreezesOfAsync(host, f.Ops.Id, token).ConfigureAwait(false)).Count, "Still one freeze on the unit");

                // The board hears once, with the spend.
                DateTime deadline = DateTime.UtcNow.AddSeconds(30);
                while (receiver.For("/board").Count < 1)
                {
                    if (DateTime.UtcNow > deadline) throw new TestAssertionException("OrgBudgetFrozen did not arrive.");
                    await notifications.DispatchOnceAsync(token).ConfigureAwait(false);
                    await Task.Delay(200, token).ConfigureAwait(false);
                }
                WebhookReceipt receipt = receiver.For("/board").Single();
                Assert.Equal(WebhookSignatureResultEnum.Valid, WebhookSigner.Verify(receipt.Signature, endpoint.SigningSecret, receipt.Body, DateTime.UtcNow, 300), "Signed with the endpoint secret");
                NotificationPayload payload = Serializer.Deserialize<NotificationPayload>(Encoding.UTF8.GetString(receipt.Body))!;
                Assert.True(payload.Event == NotificationEventEnum.OrgBudgetFrozen && payload.BudgetFreeze != null && payload.BudgetFreeze.FreezeId == freeze.Id && payload.BudgetFreeze.OrganizationId == f.Org.Id
                    && payload.BudgetFreeze.UnitId == f.Ops.Id && Math.Abs(payload.BudgetFreeze.SpentUsd - 1.25) < 0.0001 && payload.BudgetFreeze.AmountUsd == 1 && payload.BudgetFreeze.MarginPercent == 10 && payload.BudgetFreeze.Period == BudgetPeriodEnum.Day,
                    "OrgBudgetFrozen payload: " + Serializer.Serialize(payload));

                // A margin of 0 freezes at the cap, from the admission check that sees it.
                await SpendAsync(host, f.Seller, sellerDeployment, 1.0, token).ConfigureAwait(false);
                Assert.Equal(0, await guard.SweepAsync(DateTime.UtcNow, token).ConfigureAwait(false), "At the cap with a 10 percent margin, sales is not frozen");
                Organization zero = await HttpTestHelpers.SendAsync<Organization>(host.AdminClient, HttpMethod.Put, T(host) + "/organizations/" + f.Org.Id, new Organization { Name = f.Org.Name, Mission = f.Org.Mission, BudgetFreezeMarginPercent = 0 }, 200, token).ConfigureAwait(false);
                Assert.Equal(0, zero.BudgetFreezeMarginPercent, "The margin is now 0");
                RunService runs = host.Server.Context.Get<RunService>();
                ConflictException? refused = await CatchAsync<ConflictException>(() => runs.CreateAsync(new RunCreateContext { TenantId = host.TenantId, Agent = f.Seller, Input = "sell", CallerType = PrincipalTypeEnum.Administrator }, token)).ConfigureAwait(false);
                Assert.True(refused != null && refused.Code == "BudgetExhausted", "The seller is refused at the cap");
                Freeze salesFreeze = (await FreezesOfAsync(host, f.Sales.Id, token).ConfigureAwait(false)).Single();
                Assert.True(salesFreeze.Active && salesFreeze.CreatedByName == OrgBudgetGuard.FreezerName, "The admission check froze sales at the cap: " + Serializer.Serialize(salesFreeze));
            }
        }

        private static async Task MarginAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            OrgUnitSpend spend = new OrgUnitSpend { AmountUsd = 10, SpentUsd = 10.99 };
            Assert.True(!OrgBudgetGuard.Overrun(spend, 10), "10.99 of 10 is inside a 10 percent margin");
            spend.SpentUsd = 11;
            Assert.True(OrgBudgetGuard.Overrun(spend, 10), "11 of 10 reaches a 10 percent margin");
            spend.SpentUsd = 10;
            Assert.True(OrgBudgetGuard.Overrun(spend, 0) && !OrgBudgetGuard.Overrun(spend, 1), "A margin of 0 freezes at the cap");
            Assert.True(!OrgBudgetGuard.Overrun(new OrgUnitSpend { AmountUsd = null, SpentUsd = 100 }, 0), "No budget, no freeze");

            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                string b = T(host) + "/organizations";
                KeeperSuite.Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, b, new Organization { Name = "mrg-high", BudgetFreezeMarginPercent = 101 }, token).ConfigureAwait(false), 400, "ValidationFailed", "A margin over 100");
                KeeperSuite.Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, b, new Organization { Name = "mrg-low", BudgetFreezeMarginPercent = -1 }, token).ConfigureAwait(false), 400, "ValidationFailed", "A negative margin");
                Organization created = await HttpTestHelpers.SendAsync<Organization>(host.AdminClient, HttpMethod.Post, b, new Organization { Name = "mrg-org", BudgetFreezeMarginPercent = 25 }, 201, token).ConfigureAwait(false);
                Assert.Equal(25, created.BudgetFreezeMarginPercent, "Create stores the margin");
                Organization read = await HttpTestHelpers.SendAsync<Organization>(host.AdminClient, HttpMethod.Get, b + "/" + created.Id, null, 200, token).ConfigureAwait(false);
                Assert.Equal(25, read.BudgetFreezeMarginPercent, "Read returns it");
                Organization updated = await HttpTestHelpers.SendAsync<Organization>(host.AdminClient, HttpMethod.Put, b + "/" + created.Id, new Organization { Name = "mrg-org", BudgetFreezeMarginPercent = 100 }, 200, token).ConfigureAwait(false);
                Assert.Equal(100, updated.BudgetFreezeMarginPercent, "Update stores 100");
                KeeperSuite.Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Put, b + "/" + created.Id, new Organization { Name = "mrg-org", BudgetFreezeMarginPercent = 150 }, token).ConfigureAwait(false), 400, "ValidationFailed", "Update refuses 150");

                using (TestMcpClient person = new TestMcpClient())
                {
                    await person.ConnectAsync(host, null, token).ConfigureAwait(false);
                    string? mcpError = null;
                    try
                    {
                        await person.CallAsync<Organization>("garrison_create_organization", new { name = "mrg-mcp", budgetFreezeMarginPercent = 150 }, token).ConfigureAwait(false);
                    }
                    catch (Exception e)
                    {
                        mcpError = e.Message;
                    }
                    Assert.True(mcpError != null && await host.Server.Context.Database.Organizations.ReadByNameAsync(host.TenantId, "mrg-mcp", token).ConfigureAwait(false) == null, "garrison_create_organization refuses 150: " + mcpError);
                    Organization viaMcp = await person.CallAsync<Organization>("garrison_create_organization", new { name = "mrg-mcp", budgetFreezeMarginPercent = 5 }, token).ConfigureAwait(false);
                    Assert.Equal(5, viaMcp.BudgetFreezeMarginPercent, "garrison_create_organization stores the margin");
                    Organization renamed = await person.CallAsync<Organization>("garrison_update_organization", new { organization = "mrg-mcp", mission = "Keep it." }, token).ConfigureAwait(false);
                    Assert.Equal(5, renamed.BudgetFreezeMarginPercent, "garrison_update_organization without the margin keeps it");
                }

                Garrison.Core.Manifests.ManifestService manifests = host.Server.Context.Get<Garrison.Core.Manifests.ManifestService>();
                Garrison.Core.Manifests.ManifestApplyOptions options = new Garrison.Core.Manifests.ManifestApplyOptions { PrincipalName = "admin", PrincipalType = PrincipalTypeEnum.Administrator };
                ManifestApply refused = await manifests.ApplyAsync(host.TenantId, "apiVersion: garrison/v1\nkind: Organization\nmetadata:\n  name: mrg-manifest\nspec:\n  budgetFreezeMarginPercent: 200\n  publish: false\n", options, token).ConfigureAwait(false);
                Assert.True(refused.FailedCount == 1 && Serializer.Serialize(refused.Items).Contains("OutOfRange", StringComparison.Ordinal), "A manifest margin over 100 fails: " + Serializer.Serialize(refused.Items));
                string yaml = "apiVersion: garrison/v1\nkind: Organization\nmetadata:\n  name: mrg-manifest\nspec:\n  budgetFreezeMarginPercent: 30\n  publish: false\n";
                ManifestApply applied = await manifests.ApplyAsync(host.TenantId, yaml, options, token).ConfigureAwait(false);
                Assert.True(applied.FailedCount == 0, "A manifest margin applies: " + Serializer.Serialize(applied.Items));
                Assert.Equal(30, (await host.Server.Context.Database.Organizations.ReadByNameAsync(host.TenantId, "mrg-manifest", token).ConfigureAwait(false))!.BudgetFreezeMarginPercent, "The manifest stored 30");
                Assert.True((await manifests.ApplyAsync(host.TenantId, yaml, options, token).ConfigureAwait(false)).UnchangedCount == 1, "Applying again is Unchanged");
                Garrison.Core.Manifests.ManifestExportOptions export = new Garrison.Core.Manifests.ManifestExportOptions();
                export.Resources.Add(new Garrison.Core.Manifests.ManifestResourceReference { Kind = "Organization", Name = "mrg-manifest" });
                Garrison.Core.Manifests.ManifestExportResult exported = await manifests.ExportAsync(host.TenantId, export, token).ConfigureAwait(false);
                Assert.True(exported.Yaml.Contains("budgetFreezeMarginPercent: 30", StringComparison.Ordinal), "The export carries the margin: " + exported.Yaml);
            }
        }

        private static async Task RollbackTicksAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                host.Server.Context.Get<MaintenanceService>().Keepers = null;
                host.Server.Context.Get<MaintenanceService>().OrgBudgets = null;
                OrganizationService service = host.Server.Context.Get<OrganizationService>();
                MandateService mandates = host.Server.Context.Get<MandateService>();
                KeeperScheduler keepers = host.Server.Context.Get<KeeperScheduler>();
                RequestContext admin = OrganizationSuite.Admin(host);
                Agent ceo = await OrganizationSuite.AgentAsync(host, "rbt-ceo", token).ConfigureAwait(false);
                Agent worker = await OrganizationSuite.AgentAsync(host, "rbt-worker", token).ConfigureAwait(false);
                Mandate ceoKeeper = await OrganizationSuite.MandateAsync(host, "rbt-ceo-keeper", ceo, await OrganizationSuite.DeploymentAsync(host, ceo, token).ConfigureAwait(false), "Version one.", token).ConfigureAwait(false);
                string v1 = ceoKeeper.CurrentRevisionId!;
                Organization org = await service.CreateAsync(admin, host.TenantId, new Organization { Name = "rbt-org" }, token).ConfigureAwait(false);
                OrgUnit root = await service.CreateUnitAsync(admin, org, new OrgUnit { Name = "root", LeadAgentId = ceo.Id, LeadMandateId = ceoKeeper.Id }, token).ConfigureAwait(false);
                OrgRevision first = await service.CreateRevisionAsync(admin, org, "One", token).ConfigureAwait(false);
                await service.PublishAsync(admin, org, first, token).ConfigureAwait(false);

                // Revision 2: the CEO mandate moves to version two, and a worker with its own keeper joins.
                Mandate storedCeo = (await host.Server.Context.Database.Mandates.ReadAsync(host.TenantId, ceoKeeper.Id, token).ConfigureAwait(false))!;
                MandateRevision next = await mandates.CreateRevisionAsync(admin, storedCeo, KeeperSuite.Revision("Version two.", WakeModeEnum.Fixed, 60, 120), MandateRevisionSourceEnum.Human, token).ConfigureAwait(false);
                await mandates.PublishRevisionAsync(admin, storedCeo, next, token).ConfigureAwait(false);
                Mandate workerKeeper = await OrganizationSuite.MandateAsync(host, "rbt-worker-keeper", worker, await OrganizationSuite.DeploymentAsync(host, worker, token).ConfigureAwait(false), "Work.", token).ConfigureAwait(false);
                await service.UpdateUnitAsync(admin, org, root, new OrgUnit { Name = "root", LeadAgentId = ceo.Id, LeadMandateId = ceoKeeper.Id, Members = new List<OrgUnitMember> { new OrgUnitMember { AgentId = worker.Id, MandateId = workerKeeper.Id } } }, token).ConfigureAwait(false);
                OrgRevision second = await service.CreateRevisionAsync(admin, org, "Two", token).ConfigureAwait(false);
                await service.PublishAsync(admin, org, second, token).ConfigureAwait(false);
                Assert.Equal(next.Id, (await host.Server.Context.Database.Mandates.ReadAsync(host.TenantId, ceoKeeper.Id, token).ConfigureAwait(false))!.CurrentRevisionId, "Revision 2 pins version two");

                // Both keepers are mid-tick.
                await keepers.SweepAsync(DateTime.UtcNow.AddMinutes(5), token).ConfigureAwait(false);
                Mandate ticking = (await host.Server.Context.Database.Mandates.ReadAsync(host.TenantId, ceoKeeper.Id, token).ConfigureAwait(false))!;
                Assert.True(!String.IsNullOrEmpty(ticking.ActiveTickId) && !String.IsNullOrEmpty(ticking.ActiveRunId), "The CEO keeper has a tick in flight: " + Serializer.Serialize(ticking));
                string tickRunId = ticking.ActiveRunId!;

                // Finish: the tick keeps running, the CEO mandate is already back on version one, the worker keeper is paused.
                OrgRevision rolled = await service.RollbackAsync(admin, org, first.Id, null, RollbackActiveTicksEnum.Finish, token).ConfigureAwait(false);
                Mandate afterFinish = (await host.Server.Context.Database.Mandates.ReadAsync(host.TenantId, ceoKeeper.Id, token).ConfigureAwait(false))!;
                Assert.True(afterFinish.CurrentRevisionId == v1 && afterFinish.ActiveTickId == ticking.ActiveTickId, "Finish: on the pinned revision with the tick still in flight: " + Serializer.Serialize(afterFinish));
                Run tickRun = (await host.Server.Context.Database.Runs.ReadAsync(host.TenantId, tickRunId, token).ConfigureAwait(false))!;
                Assert.True(!RunService.IsTerminal(tickRun.Status) && tickRun.Status != RunStatusEnum.Cancelling, "Finish leaves the tick's run alone: " + tickRun.Status);
                Mandate pausedWorker = (await host.Server.Context.Database.Mandates.ReadAsync(host.TenantId, workerKeeper.Id, token).ConfigureAwait(false))!;
                Assert.Equal(MandateStatusEnum.Paused, pausedWorker.Status, "A mandate outside the restored snapshot is paused");

                // The tick finishes after the rollback and moves no revision.
                await host.Server.Context.Database.Runs.TransitionAsync(new RunTransition { RunId = tickRunId, FromStatuses = new List<RunStatusEnum> { tickRun.Status }, ToStatus = RunStatusEnum.Succeeded, Outcome = RunOutcomeEnum.Succeeded, SetCompleted = true }, token).ConfigureAwait(false);
                await keepers.OnRunFinishedAsync((await host.Server.Context.Database.Runs.ReadAsync(host.TenantId, tickRunId, token).ConfigureAwait(false))!, token).ConfigureAwait(false);
                Mandate finished = (await host.Server.Context.Database.Mandates.ReadAsync(host.TenantId, ceoKeeper.Id, token).ConfigureAwait(false))!;
                Assert.True(finished.CurrentRevisionId == v1 && String.IsNullOrEmpty(finished.ActiveTickId), "The finished tick left the mandate on the restored revision: " + Serializer.Serialize(finished));
                List<AuditRecord> audit = await AuditAsync(host, token).ConfigureAwait(false);
                Assert.True(audit.Any(a => (a.Description ?? String.Empty).Contains("In-flight ticks: Finish.", StringComparison.Ordinal) && (a.Description ?? String.Empty).Contains("Paused 1 mandate", StringComparison.Ordinal)), "The rollback audit states the option and the pause");
                Assert.True(audit.Any(a => a.ResourceId == workerKeeper.Id && (a.Description ?? String.Empty).StartsWith("Paused mandate " + workerKeeper.Name + ": organization", StringComparison.Ordinal)), "The pause records its reason");

                // Cancel: roll forward to revision 2 while the CEO keeper is mid-tick again.
                await keepers.SweepAsync(DateTime.UtcNow.AddMinutes(30), token).ConfigureAwait(false);
                Mandate again = (await host.Server.Context.Database.Mandates.ReadAsync(host.TenantId, ceoKeeper.Id, token).ConfigureAwait(false))!;
                Assert.True(!String.IsNullOrEmpty(again.ActiveRunId), "A second tick is in flight: " + Serializer.Serialize(again));
                string secondRunId = again.ActiveRunId!;
                await service.RollbackAsync(admin, org, second.Id, null, RollbackActiveTicksEnum.Cancel, token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Cancelled, (await host.Server.Context.Database.Runs.ReadAsync(host.TenantId, secondRunId, token).ConfigureAwait(false))!.Status, "Cancel cancels the tick's run");
                Mandate afterCancel = (await host.Server.Context.Database.Mandates.ReadAsync(host.TenantId, ceoKeeper.Id, token).ConfigureAwait(false))!;
                Assert.True(afterCancel.CurrentRevisionId == next.Id && String.IsNullOrEmpty(afterCancel.ActiveTickId), "Cancel: the tick is over and the mandate is on revision 2's pin: " + Serializer.Serialize(afterCancel));
                OrgRevision secondFull = (await host.Server.Context.Database.Organizations.ReadRevisionAsync(host.TenantId, second.Id, token).ConfigureAwait(false))!;
                foreach (OrgRevisionMandate pin in secondFull.Mandates)
                {
                    Mandate pinned = (await host.Server.Context.Database.Mandates.ReadAsync(host.TenantId, pin.MandateId, token).ConfigureAwait(false))!;
                    Assert.Equal(pin.MandateRevisionId, pinned.CurrentRevisionId, "No mandate of the organization is outside the restored snapshot: " + pinned.Name);
                }
                Assert.True((await AuditAsync(host, token).ConfigureAwait(false)).Any(a => (a.Description ?? String.Empty).Contains("In-flight ticks: Cancel (", StringComparison.Ordinal)), "The audit states Cancel");
                Assert.Equal(400, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/organizations/" + org.Id + "/rollback", new { revisionId = first.Id, activeTicks = "Sometimes" }, token).ConfigureAwait(false)).StatusCode, "An unknown activeTicks value");
                OrgRevision viaRoute = await HttpTestHelpers.SendAsync<OrgRevision>(host.AdminClient, HttpMethod.Post, T(host) + "/organizations/" + org.Id + "/rollback", new OrgRollbackRequest { RevisionId = first.Id, ActiveTicks = RollbackActiveTicksEnum.Cancel }, 200, token).ConfigureAwait(false);
                Assert.True(viaRoute.RollbackOfRevisionId == first.Id && rolled.RollbackOfRevisionId == first.Id, "The route takes activeTicks");
            }
        }

        private static async Task SpendAsync(TestServerHost host, Agent agent, Deployment deployment, double costUsd, CancellationToken token)
        {
            Run spent = OrganizationSuite.RunOf(host, agent);
            spent.DeploymentId = deployment.Id;
            spent.Status = RunStatusEnum.Succeeded;
            spent.CompletedUtc = DateTime.UtcNow;
            spent.CostUsd = costUsd;
            await host.Server.Context.Database.Runs.CreateAsync(spent, token).ConfigureAwait(false);
        }

        private static async Task<List<Freeze>> FreezesOfAsync(TestServerHost host, string unitId, CancellationToken token)
        {
            EnumerationResult<Freeze> page = await host.Server.Context.Database.Freezes.EnumerateAsync(new FreezeFilter { TenantId = host.TenantId, TargetKind = FreezeTargetKindEnum.OrgUnit, TargetId = unitId, MaxResults = 100 }, token).ConfigureAwait(false);
            return page.Objects;
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
