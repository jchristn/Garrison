namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Net.Http;
    using System.Net.WebSockets;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Core.Organizations;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Security;
    using Garrison.Core.Serialization;
    using Garrison.Core.Services;
    using Garrison.ProviderHarness;
    using Garrison.Server.Runtime;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Organizations (AUTONOMOUS_AGENTS_PLAN.md phase AA7): storage and tenant isolation, tree validation rules, revisions
    /// with publish and rollback of the tree and pinned mandates, the chain of command in messaging, reports, memory, and
    /// escalations, subtree budgets, organization freezes, member awareness tools, the REST routes, and the organization
    /// channel.
    /// </summary>
    public static class OrganizationSuite
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
            unit.Add(new TestCaseDescriptor("organizations-unit", "model", "Prefixes, defaults, budget bounds, and tree positions: members report to their lead, leads to the lead above, the root lead to the board", ModelAsync));
            suites.Add(new TestSuiteDescriptor("organizations-unit", "Organizations: model and tree", unit));
            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "organizations-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                cases.Add(new TestCaseDescriptor(id, "data", "Organizations, units with members, peer lines, and budgets, revisions with snapshots, publish once, and tenant isolation (" + provider + ")", ct => DataAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "validation", "One root, parent in the organization, no cycles, unique names, one lead position per agent, active agents, own mandates, peers inside, child budget within parent, no removal with children (" + provider + ")", ct => ValidationAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "revisions", "Publish, change, and roll back: the tree and the pinned mandate revision return to the earlier state, with promotion records (" + provider + ")", ct => RevisionsAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "chain", "The chain of command decides message lines, report visibility, memory scopes, the Manager escalation target, and escalate-up (" + provider + ")", ct => ChainAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "budgets", "A subtree that reaches its budget is refused with BudgetExhausted, its keeper wakes are skipped, and the parent lead is told (" + provider + ")", ct => BudgetsAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "freezes", "An OrgUnit freeze stops its whole subtree and its keepers; an Organization freeze sets Frozen and lifting restores Active (" + provider + ")", ct => FreezesAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "awareness", "A member run sees its chart and whoami, a non-member run is refused, org-context carries the manager, and capabilities carry the unit (" + provider + ")", ct => AwarenessAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "routes", "REST organizations, units, chart, revisions, publish, rollback, spend, scopes, role grants, and cross-tenant 404 (" + provider + ")", ct => RoutesAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "manifests", "kind Organization with nested units applies and publishes, applies again Unchanged, exports and re-applies after a delete; a studio draft built with unit graph operations applies after approval (" + provider + ")", ct => ManifestsAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "channel", "An organization subscriber receives spend.updated, org.changed, and report.filed; without Organization.Read the channel is refused (" + provider + ")", ct => ChannelAsync(provider, ct)));
                suites.Add(new TestSuiteDescriptor(id, "Organizations (" + provider + ")", cases));
            }
            return suites;
        }

        #endregion

        #region Private-Methods

        private static Task ModelAsync(CancellationToken token)
        {
            Assert.True(new Organization().Id.StartsWith("org_", StringComparison.Ordinal) && new OrgUnit().Id.StartsWith("oun_", StringComparison.Ordinal) && new OrgRevision().Id.StartsWith("orv_", StringComparison.Ordinal), "Prefixes org_, oun_, orv_");
            Organization defaults = new Organization();
            Assert.True(defaults.Status == OrganizationStatusEnum.Draft && defaults.CurrentRevisionNumber == 0 && new OrgRevision().State == OrgRevisionStateEnum.Draft, "Defaults: Draft organization and revision");
            bool negative = false;
            try
            {
                new OrgUnitBudget { AmountUsd = -1 };
            }
            catch (ArgumentOutOfRangeException)
            {
                negative = true;
            }
            Assert.True(negative, "A negative budget is refused");

            Organization org = new Organization { Name = "acme" };
            OrgUnit root = new OrgUnit { Name = "exec", LeadAgentId = "agt_ceo", Members = new List<OrgUnitMember> { new OrgUnitMember { AgentId = "agt_aide", Title = "Aide" } } };
            OrgUnit ops = new OrgUnit { Name = "ops", ParentUnitId = root.Id, LeadAgentId = "agt_ops", Members = new List<OrgUnitMember> { new OrgUnitMember { AgentId = "agt_w1" } }, PeerLines = new List<OrgUnitPeerLine>() };
            OrgUnit leaderless = new OrgUnit { Name = "lab", ParentUnitId = ops.Id, Members = new List<OrgUnitMember> { new OrgUnitMember { AgentId = "agt_w2" } } };
            OrgUnit sales = new OrgUnit { Name = "sales", ParentUnitId = root.Id, LeadAgentId = "agt_sales", PeerLines = new List<OrgUnitPeerLine> { new OrgUnitPeerLine { PeerUnitId = ops.Id } } };
            OrgTree tree = new OrgTree(org, new List<OrgUnit> { root, ops, leaderless, sales }, null);
            Assert.True(tree.PositionOf("agt_ceo")!.ManagerIsBoard, "The root lead answers to the board");
            Assert.Equal("agt_ceo", tree.PositionOf("agt_aide")!.ManagerAgentId, "A root member reports to the CEO");
            Assert.Equal("agt_ceo", tree.PositionOf("agt_ops")!.ManagerAgentId, "A lead reports to the lead above");
            Assert.Equal("agt_ops", tree.PositionOf("agt_w1")!.ManagerAgentId, "A member reports to its lead");
            Assert.Equal("agt_ops", tree.PositionOf("agt_w2")!.ManagerAgentId, "A member of a unit without a lead reports to the nearest lead above");
            List<string> reports = tree.DirectReports("agt_ops");
            Assert.True(reports.Count == 2 && reports.Contains("agt_w1") && reports.Contains("agt_w2"), "Direct reports of ops: " + String.Join(",", reports));
            Assert.True(tree.Chain("agt_w2").SequenceEqual(new[] { "agt_ops", "agt_ceo" }), "The chain above a worker");
            Assert.True(tree.SubtreeAgentIds(ops.Id).SetEquals(new[] { "agt_ops", "agt_w1", "agt_w2" }), "The ops subtree");
            Assert.True(tree.PeerLine("agt_sales", "agt_w1") && tree.PeerLine("agt_w1", "agt_sales") && !tree.PeerLine("agt_sales", "agt_aide"), "Peer lines work both ways and only between joined units");
            Assert.True(tree.ReportingLine("agt_w1", "agt_ops") && !tree.ReportingLine("agt_w1", "agt_ceo"), "A reporting line joins only a manager and a direct report");
            return Task.CompletedTask;
        }

        private static async Task DataAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                Garrison.Core.Database.Interfaces.IOrganizationMethods data = host.Server.Context.Database.Organizations;
                Organization org = await data.CreateAsync(new Organization { TenantId = host.TenantId, Name = "data-org", Mission = "Keep the lights on." }, token).ConfigureAwait(false);
                OrgUnit root = await data.CreateUnitAsync(new OrgUnit { TenantId = host.TenantId, OrganizationId = org.Id, Name = "root", LeadAgentId = "agt_lead", LeadTitle = "CEO" }, token).ConfigureAwait(false);
                OrgUnit child = new OrgUnit { TenantId = host.TenantId, OrganizationId = org.Id, ParentUnitId = root.Id, Name = "child" };
                child.Members.Add(new OrgUnitMember { AgentId = "agt_m1", Title = "Worker" });
                child.Members.Add(new OrgUnitMember { AgentId = "agt_m2" });
                child.PeerLines.Add(new OrgUnitPeerLine { PeerUnitId = root.Id });
                child.Budgets.Add(new OrgUnitBudget { Period = BudgetPeriodEnum.Day, AmountUsd = 5 });
                child.Budgets.Add(new OrgUnitBudget { Period = BudgetPeriodEnum.Month, AmountUsd = 50.5 });
                await data.CreateUnitAsync(child, token).ConfigureAwait(false);

                OrgUnit read = Assert.NotNull(await data.ReadUnitAsync(host.TenantId, child.Id, token).ConfigureAwait(false), "Read the unit");
                Assert.True(read.Members.Count == 2 && read.Members[0].Title == "Worker" && read.PeerLines.Single().PeerUnitName == "root" && read.Budgets.Count == 2 && read.Budgets.Any(b => b.Period == BudgetPeriodEnum.Month && Math.Abs(b.AmountUsd - 50.5) < 0.0001), "Children round-trip: " + Serializer.Serialize(read));
                Assert.Equal(2, (await data.ListUnitsAsync(host.TenantId, org.Id, token).ConfigureAwait(false)).Count, "Both units listed");

                OrgRevision revision = new OrgRevision { TenantId = host.TenantId, OrganizationId = org.Id, Note = "first" };
                revision.Units = await data.ListUnitsAsync(host.TenantId, org.Id, token).ConfigureAwait(false);
                revision.Mandates.Add(new OrgRevisionMandate { MandateId = "mdt_x", MandateRevisionId = "mrv_x" });
                await data.CreateRevisionAsync(revision, token).ConfigureAwait(false);
                OrgRevision second = await data.CreateRevisionAsync(new OrgRevision { TenantId = host.TenantId, OrganizationId = org.Id }, token).ConfigureAwait(false);
                Assert.True(revision.Number == 1 && second.Number == 2, "Revision numbers count up");
                OrgRevision snapshot = Assert.NotNull(await data.ReadRevisionAsync(host.TenantId, revision.Id, token).ConfigureAwait(false), "Read the revision");
                OrgUnit snapChild = snapshot.Units.Single(u => u.Name == "child");
                Assert.True(snapshot.Units.Count == 2 && snapChild.Id == child.Id && snapChild.Members.Count == 2 && snapChild.PeerLines.Count == 1 && snapChild.Budgets.Count == 2 && snapshot.Mandates.Single().MandateRevisionId == "mrv_x", "The snapshot round-trips: " + Serializer.Serialize(snapshot));

                Assert.True(await data.PublishRevisionAsync(org, revision, token).ConfigureAwait(false), "Publish the draft");
                Assert.True(!(await data.PublishRevisionAsync(org, revision, token).ConfigureAwait(false)), "A revision publishes once");
                Organization live = Assert.NotNull(await data.ReadAsync(host.TenantId, org.Id, token).ConfigureAwait(false), "Read the organization");
                Assert.True(live.Status == OrganizationStatusEnum.Active && live.CurrentRevisionId == revision.Id && live.CurrentRevisionNumber == 1, "Publishing makes the organization Active");
                Assert.True(await data.PublishRevisionAsync(live, second, token).ConfigureAwait(false), "Publish the second");
                List<OrgRevision> revisions = await data.ListRevisionsAsync(host.TenantId, org.Id, token).ConfigureAwait(false);
                Assert.True(revisions[0].Id == second.Id && revisions[0].State == OrgRevisionStateEnum.Published && revisions[1].State == OrgRevisionStateEnum.Superseded, "The earlier live revision is superseded");
                Assert.Equal(1, (await data.ListLiveAsync(host.TenantId, token).ConfigureAwait(false)).Count, "One live organization");

                Assert.True((await data.ReadAsync("ten_elsewhere", org.Id, token).ConfigureAwait(false)) == null, "Another tenant cannot read it");
                Assert.True((await data.ReadUnitAsync("ten_elsewhere", child.Id, token).ConfigureAwait(false)) == null, "Another tenant cannot read its unit");
                Assert.True((await data.ReadRevisionAsync("ten_elsewhere", revision.Id, token).ConfigureAwait(false)) == null, "Another tenant cannot read its revision");
                Assert.True(await data.DeleteAsync(host.TenantId, org.Id, token).ConfigureAwait(false), "Delete");
                Assert.True((await data.ListUnitsAsync(host.TenantId, org.Id, token).ConfigureAwait(false)).Count == 0 && await data.ReadRevisionAsync(host.TenantId, revision.Id, token).ConfigureAwait(false) == null, "Deleting removes units and revisions");
            }
        }

        private static async Task ValidationAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                OrganizationService service = host.Server.Context.Get<OrganizationService>();
                RequestContext admin = Admin(host);
                Agent ceo = await AgentAsync(host, "val-ceo", token).ConfigureAwait(false);
                Agent lead = await AgentAsync(host, "val-lead", token).ConfigureAwait(false);
                Agent worker = await AgentAsync(host, "val-worker", token).ConfigureAwait(false);
                Agent idle = await AgentAsync(host, "val-idle", token).ConfigureAwait(false);
                idle.Active = false;
                await host.Server.Context.Database.Agents.UpdateAsync(idle, token).ConfigureAwait(false);
                Organization org = await service.CreateAsync(admin, host.TenantId, new Organization { Name = "val-org" }, token).ConfigureAwait(false);
                Assert.Equal("NameConflict", await CodeAsync(() => service.CreateAsync(admin, host.TenantId, new Organization { Name = "val-org" }, token)).ConfigureAwait(false), "Organization names are unique in a tenant");

                OrgUnit root = await service.CreateUnitAsync(admin, org, new OrgUnit { Name = "root", LeadAgentId = ceo.Name }, token).ConfigureAwait(false);
                Assert.Equal("OneRoot", await CodeAsync(() => service.CreateUnitAsync(admin, org, new OrgUnit { Name = "second-root" }, token)).ConfigureAwait(false), "One root");
                Assert.Equal("ParentNotFound", await CodeAsync(() => service.CreateUnitAsync(admin, org, new OrgUnit { Name = "orphan", ParentUnitId = "oun_missing" }, token)).ConfigureAwait(false), "The parent must be in the organization");
                OrgUnit ops = await service.CreateUnitAsync(admin, org, new OrgUnit { Name = "ops", ParentUnitId = root.Name, LeadAgentId = lead.Name, Budgets = new List<OrgUnitBudget> { new OrgUnitBudget { AmountUsd = 10 } } }, token).ConfigureAwait(false);
                OrgUnit team = await service.CreateUnitAsync(admin, org, new OrgUnit { Name = "team", ParentUnitId = ops.Id }, token).ConfigureAwait(false);
                Assert.Equal("Cycle", await CodeAsync(() => service.UpdateUnitAsync(admin, org, ops, new OrgUnit { Name = "ops", ParentUnitId = team.Id, LeadAgentId = lead.Id }, token)).ConfigureAwait(false), "No cycles");
                Assert.Equal("UnitNameTaken", await CodeAsync(() => service.CreateUnitAsync(admin, org, new OrgUnit { Name = "OPS", ParentUnitId = root.Id }, token)).ConfigureAwait(false), "Unit names are unique in the organization");
                Assert.Equal("LeadsTwoUnits", await CodeAsync(() => service.UpdateUnitAsync(admin, org, team, new OrgUnit { Name = "team", ParentUnitId = ops.Id, LeadAgentId = lead.Id }, token)).ConfigureAwait(false), "An agent leads at most one unit");
                Assert.Equal("PositionTaken", await CodeAsync(() => service.UpdateUnitAsync(admin, org, team, new OrgUnit { Name = "team", ParentUnitId = ops.Id, Members = new List<OrgUnitMember> { new OrgUnitMember { AgentId = ceo.Name } } }, token)).ConfigureAwait(false), "An agent holds one position");
                Assert.Equal("AgentInactive", await CodeAsync(() => service.UpdateUnitAsync(admin, org, team, new OrgUnit { Name = "team", ParentUnitId = ops.Id, Members = new List<OrgUnitMember> { new OrgUnitMember { AgentId = idle.Name } } }, token)).ConfigureAwait(false), "Members are active agents");
                Assert.Equal("ValidationFailed", await CodeAsync(() => service.UpdateUnitAsync(admin, org, team, new OrgUnit { Name = "team", ParentUnitId = ops.Id, Members = new List<OrgUnitMember> { new OrgUnitMember { AgentId = "nobody" } } }, token)).ConfigureAwait(false), "Members exist");
                Assert.Equal("PeerNotFound", await CodeAsync(() => service.UpdateUnitAsync(admin, org, team, new OrgUnit { Name = "team", ParentUnitId = ops.Id, PeerLines = new List<OrgUnitPeerLine> { new OrgUnitPeerLine { PeerUnitId = "elsewhere" } } }, token)).ConfigureAwait(false), "Peers are units of the organization");
                Assert.Equal("BudgetExceedsParent", await CodeAsync(() => service.UpdateUnitAsync(admin, org, team, new OrgUnit { Name = "team", ParentUnitId = ops.Id, Budgets = new List<OrgUnitBudget> { new OrgUnitBudget { AmountUsd = 11 } } }, token)).ConfigureAwait(false), "A child budget may not exceed its parent's");
                Assert.Equal("BudgetInvalid", await CodeAsync(() => service.UpdateUnitAsync(admin, org, team, new OrgUnit { Name = "team", ParentUnitId = ops.Id, Budgets = new List<OrgUnitBudget> { new OrgUnitBudget { AmountUsd = 0 } } }, token)).ConfigureAwait(false), "A budget is above 0");

                Deployment deployment = await DeploymentAsync(host, ceo, token).ConfigureAwait(false);
                Mandate mandate = await MandateAsync(host, "val-ceo-keeper", ceo, deployment, "Run the company.", token).ConfigureAwait(false);
                Assert.Equal("MandateMismatch", await CodeAsync(() => service.UpdateUnitAsync(admin, org, team, new OrgUnit { Name = "team", ParentUnitId = ops.Id, LeadAgentId = worker.Name, LeadMandateId = mandate.Name }, token)).ConfigureAwait(false), "A mandate belongs to its agent");
                OrgUnit valid = await service.UpdateUnitAsync(admin, org, team, new OrgUnit { Name = "team", ParentUnitId = ops.Name, LeadAgentId = worker.Name, Budgets = new List<OrgUnitBudget> { new OrgUnitBudget { AmountUsd = 10 } } }, token).ConfigureAwait(false);
                Assert.True(valid.LeadAgentId == worker.Id && valid.ParentUnitId == ops.Id && valid.LeadAgentName == worker.Name, "Names resolve to identifiers: " + Serializer.Serialize(valid));
                Assert.Equal("UnitHasChildren", await CodeAsync(() => service.DeleteUnitAsync(admin, org, ops, token)).ConfigureAwait(false), "A unit with children stays");

                Organization empty = await service.CreateAsync(admin, host.TenantId, new Organization { Name = "val-empty" }, token).ConfigureAwait(false);
                Assert.Equal("OneRoot", await CodeAsync(() => service.CreateRevisionAsync(admin, empty, null, token)).ConfigureAwait(false), "A revision needs a root");
            }
        }

        private static async Task RevisionsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                OrganizationService service = host.Server.Context.Get<OrganizationService>();
                MandateService mandates = host.Server.Context.Get<MandateService>();
                RequestContext admin = Admin(host);
                Agent ceo = await AgentAsync(host, "rev-ceo", token).ConfigureAwait(false);
                Agent worker = await AgentAsync(host, "rev-worker", token).ConfigureAwait(false);
                Agent hire = await AgentAsync(host, "rev-hire", token).ConfigureAwait(false);
                Mandate mandate = await MandateAsync(host, "rev-ceo-keeper", ceo, await DeploymentAsync(host, ceo, token).ConfigureAwait(false), "Version one.", token).ConfigureAwait(false);
                string firstMandateRevision = mandate.CurrentRevisionId!;

                Organization org = await service.CreateAsync(admin, host.TenantId, new Organization { Name = "rev-org" }, token).ConfigureAwait(false);
                OrgUnit root = await service.CreateUnitAsync(admin, org, new OrgUnit { Name = "root", LeadAgentId = ceo.Name, LeadMandateId = mandate.Name, Members = new List<OrgUnitMember> { new OrgUnitMember { AgentId = worker.Name } } }, token).ConfigureAwait(false);
                OrgRevision first = await service.CreateRevisionAsync(admin, org, "Founding", token).ConfigureAwait(false);
                Assert.True(first.Number == 1 && first.State == OrgRevisionStateEnum.Draft && first.Mandates.Single().MandateRevisionId == firstMandateRevision, "The draft pins the mandate's revision: " + Serializer.Serialize(first.Mandates));
                await service.PublishAsync(admin, org, first, token).ConfigureAwait(false);
                Assert.True(org.Status == OrganizationStatusEnum.Active && org.CurrentRevisionId == first.Id, "Publishing makes it Active");
                Assert.Equal("RevisionPublished", await CodeAsync(() => service.PublishAsync(admin, org, first, token)).ConfigureAwait(false), "A revision publishes once");

                // Change the tree and the mandate, then publish revision 2.
                await service.UpdateUnitAsync(admin, org, root, new OrgUnit { Name = "root", LeadAgentId = ceo.Id, LeadMandateId = mandate.Id, Members = new List<OrgUnitMember> { new OrgUnitMember { AgentId = worker.Id }, new OrgUnitMember { AgentId = hire.Id, Title = "New hire" } } }, token).ConfigureAwait(false);
                MandateRevision next = await mandates.CreateRevisionAsync(admin, mandate, KeeperSuite.Revision("Version two."), MandateRevisionSourceEnum.Human, token).ConfigureAwait(false);
                await mandates.PublishRevisionAsync(admin, mandate, next, token).ConfigureAwait(false);
                OrgRevision second = await service.CreateRevisionAsync(admin, org, "Growth", token).ConfigureAwait(false);
                await service.PublishAsync(admin, org, second, token).ConfigureAwait(false);
                OrgChart grown = await service.ChartAsync(org, token).ConfigureAwait(false);
                Assert.True(grown.Source == "Live" && grown.RevisionNumber == 2 && grown.Units.Single().Members.Count == 2, "The chart shows revision 2: " + Serializer.Serialize(grown));

                OrgRevision rolled = await service.RollbackAsync(admin, org, null, null, token).ConfigureAwait(false);
                Assert.True(rolled.Number == 3 && rolled.RollbackOfRevisionId == first.Id && rolled.State == OrgRevisionStateEnum.Published, "Rollback publishes a copy of revision 1 as revision 3: " + Serializer.Serialize(rolled));
                List<OrgUnit> tree = await host.Server.Context.Database.Organizations.ListUnitsAsync(host.TenantId, org.Id, token).ConfigureAwait(false);
                Assert.True(tree.Single().Members.Single().AgentId == worker.Id, "The working tree is back to revision 1");
                Mandate restored = Assert.NotNull(await host.Server.Context.Database.Mandates.ReadAsync(host.TenantId, mandate.Id, token).ConfigureAwait(false), "The mandate");
                Assert.Equal(firstMandateRevision, restored.CurrentRevisionId, "The mandate is back on its pinned revision");
                OrgChart back = await service.ChartAsync(org, token).ConfigureAwait(false);
                Assert.True(back.RevisionNumber == 3 && back.Units.Single().Members.Single().AgentId == worker.Id && back.Units.Single().Lead!.MandateSummary == "Version one.", "The live chart is the earlier state: " + Serializer.Serialize(back));

                PromotionRecord? promote = await host.Server.Context.Database.Promotions.ReadLatestForOrgRevisionAsync(host.TenantId, second.Id, token).ConfigureAwait(false);
                PromotionRecord? rollback = await host.Server.Context.Database.Promotions.ReadLatestForOrgRevisionAsync(host.TenantId, rolled.Id, token).ConfigureAwait(false);
                Assert.True(promote != null && promote.SubjectKind == PromotionSubjectKindEnum.Organization && promote.Outcome == PromotionOutcomeEnum.RolledBack, "The publish record is marked rolled back: " + Serializer.Serialize(promote));
                Assert.True(rollback != null && rollback.Kind == PromotionKindEnum.Rollback && rollback.RollbackOfId == promote!.Id && rollback.OrganizationId == org.Id, "A rollback record with subject Organization: " + Serializer.Serialize(rollback));
                Assert.Equal("AlreadyLive", await CodeAsync(() => service.RollbackAsync(admin, org, rolled.Id, null, token)).ConfigureAwait(false), "Rolling back to the live revision is refused");
            }
        }

        private static async Task ChainAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                OrgFixture f = await FixtureAsync(host, "chain", token).ConfigureAwait(false);
                ChainOfCommand chain = host.Server.Context.Get<ChainOfCommand>();
                Assert.True((await chain.ManagersAsync(host.TenantId, f.Worker.Id, token).ConfigureAwait(false)).Single() == f.Lead.Id, "The worker's manager is the ops lead");
                Assert.True(await chain.BoardManagesAsync(host.TenantId, f.Ceo.Id, token).ConfigureAwait(false), "The board manages the CEO");
                Assert.Equal(OrgRelationEnum.Peer, await chain.RelationAsync(host.TenantId, f.Worker.Id, f.Seller.Id, token).ConfigureAwait(false), "Ops and sales share a peer line");

                // Messaging: reporting lines and peer lines are lines; a stranger has none.
                MessageService messages = host.Server.Context.Get<MessageService>();
                Assert.Equal(MessageStatusEnum.Queued, (await messages.SendFromRunAsync(RunOf(host, f.Worker), Send(f.Lead.Name, "Up"), token).ConfigureAwait(false)).Status, "A worker writes to its manager");
                Assert.Equal(MessageStatusEnum.Queued, (await messages.SendFromRunAsync(RunOf(host, f.Ceo), Send(f.Lead.Name, "Down"), token).ConfigureAwait(false)).Status, "A manager writes to a direct report");
                Assert.Equal(MessageStatusEnum.Queued, (await messages.SendFromRunAsync(RunOf(host, f.Worker), Send(f.Seller.Name, "Across"), token).ConfigureAwait(false)).Status, "A peer line allows mail");
                Assert.Equal("NoLine", await CodeAsync(() => messages.SendFromRunAsync(RunOf(host, f.Worker), Send(f.Ceo.Name, "Skip a level"), token)).ConfigureAwait(false), "No line skips a level");
                Assert.Equal("NoLine", await CodeAsync(() => messages.SendFromRunAsync(RunOf(host, f.Stranger), Send(f.Lead.Name, "Hello"), token)).ConfigureAwait(false), "A stranger has no line");

                // Reports: Manager reaches the manager only; Chain reaches everyone above.
                ReportService reports = host.Server.Context.Get<ReportService>();
                ReportVisibility visibility = host.Server.Context.Get<ReportVisibility>();
                Report toManager = await reports.FileFromRunAsync(RunOf(host, f.Worker), new Report { Title = "Quiet day", Audience = ReportAudienceEnum.Manager }, token).ConfigureAwait(false);
                Report toChain = await reports.FileFromRunAsync(RunOf(host, f.Worker), new Report { Title = "Outage", Audience = ReportAudienceEnum.Chain, Health = ReportHealthEnum.Unhealthy }, token).ConfigureAwait(false);
                Assert.Equal(f.Ops.Id, toManager.OrgUnitId, "A report carries its author's unit");
                Assert.True(await visibility.VisibleToAgentAsync(f.Lead.Id, toManager, token).ConfigureAwait(false) && !await visibility.VisibleToAgentAsync(f.Ceo.Id, toManager, token).ConfigureAwait(false), "A Manager report reaches the manager only");
                Assert.True(await visibility.VisibleToAgentAsync(f.Ceo.Id, toChain, token).ConfigureAwait(false) && !await visibility.VisibleToAgentAsync(f.Seller.Id, toChain, token).ConfigureAwait(false), "A Chain report reaches the CEO, not a peer");
                ReportVisibilityScope scope = await visibility.ScopeForAsync(host.TenantId, f.Ceo.Id, false, token).ConfigureAwait(false);
                EnumerationResult<Report> ceoSees = await host.Server.Context.Database.Reports.EnumerateAsync(new ReportFilter { TenantId = host.TenantId, Visibility = scope }, token).ConfigureAwait(false);
                Assert.True(ceoSees.Objects.Count == 1 && ceoSees.Objects[0].Id == toChain.Id, "The CEO's list holds the Chain report only: " + Serializer.Serialize(ceoSees.Objects.Select(r => r.Title)));

                // Memory: own unit read and write, ancestors read only, a lead reads below, the CEO alone writes the organization.
                MemoryAccessPolicy policy = host.Server.Context.Get<MemoryAccessPolicy>();
                Func<Agent, MemoryScopeKindEnum, string, bool, Task<bool>> may = async (agent, kind, scopeId, write) => (await policy.CheckRunAsync(host.TenantId, agent.Id, kind, scopeId, write, true, token).ConfigureAwait(false)).Permitted;
                Assert.True(await may(f.Worker, MemoryScopeKindEnum.OrgUnit, f.Ops.Id, true).ConfigureAwait(false), "A member writes its own unit");
                Assert.True(await may(f.Worker, MemoryScopeKindEnum.OrgUnit, f.Root.Id, false).ConfigureAwait(false) && !await may(f.Worker, MemoryScopeKindEnum.OrgUnit, f.Root.Id, true).ConfigureAwait(false), "It reads the unit above and never writes upward");
                Assert.True(!(await may(f.Worker, MemoryScopeKindEnum.OrgUnit, f.Sales.Id, false).ConfigureAwait(false)), "It does not read a peer unit");
                Assert.True(await may(f.Ceo, MemoryScopeKindEnum.OrgUnit, f.Ops.Id, false).ConfigureAwait(false) && !await may(f.Ceo, MemoryScopeKindEnum.OrgUnit, f.Ops.Id, true).ConfigureAwait(false), "A lead reads its subtree but does not write it");
                Assert.True(await may(f.Worker, MemoryScopeKindEnum.Organization, f.Org.Id, false).ConfigureAwait(false) && !await may(f.Worker, MemoryScopeKindEnum.Organization, f.Org.Id, true).ConfigureAwait(false) && await may(f.Ceo, MemoryScopeKindEnum.Organization, f.Org.Id, true).ConfigureAwait(false), "Members read the organization scope; the CEO writes it");
                Assert.True(!(await may(f.Stranger, MemoryScopeKindEnum.Organization, f.Org.Id, false).ConfigureAwait(false)), "A stranger reads nothing");
                List<Garrison.Core.Memory.MemoryScopeRef> readable = await policy.ReadableScopesAsync(host.TenantId, f.Worker.Id, true, token).ConfigureAwait(false);
                Assert.True(readable.Any(r => r.ScopeKind == MemoryScopeKindEnum.OrgUnit && r.ScopeId == f.Ops.Id) && readable.Any(r => r.ScopeKind == MemoryScopeKindEnum.OrgUnit && r.ScopeId == f.Root.Id) && readable.Any(r => r.ScopeKind == MemoryScopeKindEnum.Organization), "Readable scopes include the unit, its ancestors, and the organization");

                // Escalations: Manager targets the manager; escalate-up goes to the next lead.
                EscalationService escalations = host.Server.Context.Get<EscalationService>();
                Run raiser = await host.Server.Context.Database.Runs.CreateAsync(RunOf(host, f.Worker), token).ConfigureAwait(false);
                Escalation raised = await escalations.RaiseAsync(raiser, new Escalation { Question = "Restart the queue?", TargetKind = EscalationTargetKindEnum.Manager, TimeoutSeconds = 60 }, token).ConfigureAwait(false);
                Assert.True(raised.TargetKind == EscalationTargetKindEnum.Agent && raised.TargetId == f.Lead.Id, "Manager resolves to the ops lead: " + Serializer.Serialize(raised));
                Escalation? up = await escalations.EscalateUpAsync(raised, "test", token).ConfigureAwait(false);
                Assert.True(up != null && up.TargetKind == EscalationTargetKindEnum.Agent && up.TargetId == f.Ceo.Id && up.ParentEscalationId == raised.Id, "Escalate-up reaches the CEO: " + Serializer.Serialize(up));
                Assert.Equal("ManagerUnavailable", await CodeAsync(() => escalations.RaiseAsync(RunOf(host, f.Stranger), new Escalation { Question = "Anyone?", TargetKind = EscalationTargetKindEnum.Manager, TimeoutSeconds = 60 }, token)).ConfigureAwait(false), "A stranger has no manager");
            }
        }

        private static async Task BudgetsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                OrgFixture f = await FixtureAsync(host, "budget", token).ConfigureAwait(false);
                OrganizationService service = host.Server.Context.Get<OrganizationService>();
                await service.UpdateUnitAsync(Admin(host), f.Org, f.Ops, new OrgUnit { Name = f.Ops.Name, ParentUnitId = f.Root.Id, LeadAgentId = f.Lead.Id, Members = new List<OrgUnitMember> { new OrgUnitMember { AgentId = f.Worker.Id } }, PeerLines = new List<OrgUnitPeerLine> { new OrgUnitPeerLine { PeerUnitId = f.Sales.Id } }, Budgets = new List<OrgUnitBudget> { new OrgUnitBudget { Period = BudgetPeriodEnum.Day, AmountUsd = 1 } } }, token).ConfigureAwait(false);
                await service.PublishAsync(Admin(host), f.Org, await service.CreateRevisionAsync(Admin(host), f.Org, "Budget", token).ConfigureAwait(false), token).ConfigureAwait(false);

                Deployment workerDeployment = await DeploymentAsync(host, f.Worker, token).ConfigureAwait(false);
                await DeploymentAsync(host, f.Seller, token).ConfigureAwait(false);
                await DeploymentAsync(host, f.Lead, token).ConfigureAwait(false);
                RunService runs = host.Server.Context.Get<RunService>();
                Run first = await runs.CreateAsync(new RunCreateContext { TenantId = host.TenantId, Agent = f.Worker, Input = "work", CallerType = PrincipalTypeEnum.Administrator }, token).ConfigureAwait(false);
                Assert.True(first.Id.Length > 0, "Within budget, the worker runs");

                Run spent = RunOf(host, f.Worker);
                spent.DeploymentId = workerDeployment.Id;
                spent.Status = RunStatusEnum.Succeeded;
                spent.CompletedUtc = DateTime.UtcNow;
                spent.CostUsd = 1.5;
                await host.Server.Context.Database.Runs.CreateAsync(spent, token).ConfigureAwait(false);
                List<OrgUnitSpend> spend = await service.SpendAsync(f.Org, DateTime.UtcNow, token).ConfigureAwait(false);
                OrgUnitSpend opsSpend = spend.Single(s => s.UnitId == f.Ops.Id);
                Assert.True(opsSpend.Exhausted && opsSpend.SpentUsd >= 1.5 && spend.Single(s => s.UnitId == f.Root.Id).SpentUsd >= 1.5, "Spend rolls up the subtree: " + Serializer.Serialize(spend));

                host.Server.Context.Get<OrgBudgetGuard>().SpendCacheSeconds = 0;
                Assert.Equal("BudgetExhausted", await CodeAsync(() => runs.CreateAsync(new RunCreateContext { TenantId = host.TenantId, Agent = f.Worker, Input = "more", CallerType = PrincipalTypeEnum.Administrator }, token)).ConfigureAwait(false), "A capped subtree's agent is refused");
                Assert.Equal("BudgetExhausted", await CodeAsync(() => runs.CreateAsync(new RunCreateContext { TenantId = host.TenantId, Agent = f.Lead, Input = "lead", CallerType = PrincipalTypeEnum.Administrator }, token)).ConfigureAwait(false), "The capped unit's lead is refused too");
                Run peerRun = await runs.CreateAsync(new RunCreateContext { TenantId = host.TenantId, Agent = f.Seller, Input = "sell", CallerType = PrincipalTypeEnum.Administrator }, token).ConfigureAwait(false);
                Assert.True(peerRun.Id.Length > 0, "Another subtree keeps running");

                EnumerationResult<Escalation> notices = await host.Server.Context.Database.Escalations.EnumerateAsync(new EscalationFilter { TenantId = host.TenantId, TargetKind = EscalationTargetKindEnum.Agent, TargetId = f.Ceo.Id }, token).ConfigureAwait(false);
                Assert.True(notices.TotalRecords == 1 && notices.Objects[0].Severity == EscalationSeverityEnum.Urgent && (notices.Objects[0].Context ?? String.Empty).Contains(f.Ops.Name, StringComparison.Ordinal), "One notice reaches the parent lead: " + Serializer.Serialize(notices.Objects));

                // A keeper below the capped unit skips its wake.
                Mandate keeper = await MandateAsync(host, "budget-worker-keeper", f.Worker, workerDeployment, "Work.", token).ConfigureAwait(false);
                Mandate due = Assert.NotNull(await host.Server.Context.Database.Mandates.ReadAsync(host.TenantId, keeper.Id, token).ConfigureAwait(false), "The keeper");
                await host.Server.Context.Get<KeeperScheduler>().SweepAsync(DateTime.UtcNow.AddSeconds(5), token).ConfigureAwait(false);
                List<MandateTick> ticks = await KeeperSuite.TicksOfAsync(host, due.Id, token).ConfigureAwait(false);
                Assert.True(ticks.Count > 0 && ticks.All(t => t.Outcome == TickOutcomeEnum.Skipped && t.ErrorCode == "BudgetExhausted"), "The keeper's wake is skipped with BudgetExhausted: " + Serializer.Serialize(ticks));
            }
        }

        private static async Task FreezesAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                OrgFixture f = await FixtureAsync(host, "freeze", token).ConfigureAwait(false);
                FreezeService freezes = host.Server.Context.Get<FreezeService>();
                RequestContext admin = Admin(host);
                Deployment workerDeployment = await DeploymentAsync(host, f.Worker, token).ConfigureAwait(false);
                Mandate keeper = await MandateAsync(host, "freeze-worker-keeper", f.Worker, workerDeployment, "Work.", token).ConfigureAwait(false);

                Freeze unitFreeze = await freezes.ApplyAsync(admin, host.TenantId, new Freeze { TargetKind = FreezeTargetKindEnum.OrgUnit, TargetId = f.Ops.Name, Reason = "Audit" }, token).ConfigureAwait(false);
                Assert.True(unitFreeze.TargetId == f.Ops.Id && unitFreeze.TargetName == f.Ops.Name, "The unit is named and stored by identifier");
                Assert.Equal(unitFreeze.Id, (await freezes.FindAsync(host.TenantId, f.Worker.Id, null, null, null, false, token).ConfigureAwait(false))?.Id, "A worker below the unit is frozen");
                Assert.Equal(unitFreeze.Id, (await freezes.FindAsync(host.TenantId, f.Lead.Id, null, null, null, false, token).ConfigureAwait(false))?.Id, "The unit's lead is frozen");
                Assert.True((await freezes.FindAsync(host.TenantId, f.Ceo.Id, null, null, null, false, token).ConfigureAwait(false)) == null, "The CEO above it is not");
                Assert.True((await freezes.FindAsync(host.TenantId, f.Seller.Id, null, null, null, false, token).ConfigureAwait(false)) == null, "A peer unit is not");
                Mandate due = Assert.NotNull(await host.Server.Context.Database.Mandates.ReadAsync(host.TenantId, keeper.Id, token).ConfigureAwait(false), "The keeper");
                await host.Server.Context.Get<KeeperScheduler>().SweepAsync(DateTime.UtcNow.AddSeconds(5), token).ConfigureAwait(false);
                List<MandateTick> ticks = await KeeperSuite.TicksOfAsync(host, due.Id, token).ConfigureAwait(false);
                Assert.True(ticks.Count > 0 && ticks.All(t => t.Outcome == TickOutcomeEnum.Skipped && t.ErrorCode == "Frozen"), "A keeper below the frozen unit stops ticking: " + Serializer.Serialize(ticks));
                await freezes.LiftAsync(admin, unitFreeze, null, token).ConfigureAwait(false);
                Assert.True((await freezes.FindAsync(host.TenantId, f.Worker.Id, null, null, null, false, token).ConfigureAwait(false)) == null, "Lifting releases the subtree");

                Freeze orgFreeze = await freezes.ApplyAsync(admin, host.TenantId, new Freeze { TargetKind = FreezeTargetKindEnum.Organization, TargetId = f.Org.Name }, token).ConfigureAwait(false);
                Assert.Equal(OrganizationStatusEnum.Frozen, (await host.Server.Context.Database.Organizations.ReadAsync(host.TenantId, f.Org.Id, token).ConfigureAwait(false))!.Status, "An Organization freeze sets Frozen");
                Assert.NotNull(await freezes.FindAsync(host.TenantId, f.Ceo.Id, null, null, null, false, token).ConfigureAwait(false), "Every member is frozen, the CEO included");
                Assert.True((await freezes.FindAsync(host.TenantId, f.Stranger.Id, null, null, null, false, token).ConfigureAwait(false)) == null, "A stranger is not");
                await freezes.LiftAsync(admin, orgFreeze, "Done", token).ConfigureAwait(false);
                Assert.Equal(OrganizationStatusEnum.Active, (await host.Server.Context.Database.Organizations.ReadAsync(host.TenantId, f.Org.Id, token).ConfigureAwait(false))!.Status, "Lifting restores Active");
            }
        }

        private static async Task AwarenessAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                OrgFixture f = await FixtureAsync(host, "aware", token).ConfigureAwait(false);
                foreach (string name in new[] { "garrison_org_chart", "garrison_org_whoami", "garrison_list_organizations", "garrison_get_organization", "garrison_create_organization", "garrison_update_organization", "garrison_publish_org_revision", "garrison_rollback_organization" })
                    Assert.True(host.Server.Context.Scopes.Find("MCP", name) != null, name + " scope is registered");
                Run memberRun = await PersistedRunAsync(host, f.Worker, token).ConfigureAwait(false);
                Run outsiderRun = await PersistedRunAsync(host, f.Stranger, token).ConfigureAwait(false);
                using (TestMcpClient member = await RunClientAsync(host, memberRun, token).ConfigureAwait(false))
                using (TestMcpClient outsider = await RunClientAsync(host, outsiderRun, token).ConfigureAwait(false))
                {
                    ProviderToolPage memberTools = await member.ToolsAsync(token).ConfigureAwait(false);
                    Assert.True(memberTools.Tools.Any(t => t.Name == "garrison_org_chart") && memberTools.Tools.Any(t => t.Name == "garrison_org_whoami") && !memberTools.Tools.Any(t => t.Name == "garrison_create_organization"), "A member run sees the awareness tools only");
                    OrgChart chart = await member.CallAsync<OrgChart>("garrison_org_chart", new { }, token).ConfigureAwait(false);
                    Assert.True(chart.OrganizationId == f.Org.Id && chart.Units.Count == 3 && chart.Units[0].Lead!.AgentId == f.Ceo.Id && chart.Units.Single(u => u.Id == f.Ops.Id).PeerUnitIds.Contains(f.Sales.Id), "The member sees its chart: " + Serializer.Serialize(chart));
                    OrgWhoAmI me = await member.CallAsync<OrgWhoAmI>("garrison_org_whoami", new { }, token).ConfigureAwait(false);
                    Assert.True(me.Me.UnitId == f.Ops.Id && !me.IsLead && me.Manager!.AgentId == f.Lead.Id && me.PeerUnitNames.Contains(f.Sales.Name), "Whoami: " + Serializer.Serialize(me));

                    ProviderToolPage outsiderTools = await outsider.ToolsAsync(token).ConfigureAwait(false);
                    Assert.True(!(outsiderTools.Tools.Any(t => t.Name == "garrison_org_chart")), "A non-member run does not see the tools");
                    await outsider.ExpectErrorAsync("garrison_org_chart", new { }, "NotAMember", token).ConfigureAwait(false);
                    await outsider.ExpectErrorAsync("garrison_org_whoami", new { organization = f.Org.Name }, "NotAMember", token).ConfigureAwait(false);
                }

                Garrison.Core.Compilation.CompilationOrgContext? context = await new OrgContextLoader(host.Server.Context.Database).LoadAsync(host.TenantId, f.Worker.Id, token).ConfigureAwait(false);
                Assert.True(context != null && context.ManagerName == f.Lead.Name && context.UnitName == f.Ops.Name && context.PeerUnits.Contains(f.Sales.Name), "org-context knows the manager and peers: " + Serializer.Serialize(context));
                Assert.True((await new OrgContextLoader(host.Server.Context.Database).LoadAsync(host.TenantId, f.Stranger.Id, token).ConfigureAwait(false)) == null, "A stranger has no org context");

                List<CapabilityDescriptor> descriptors = new List<CapabilityDescriptor> { new CapabilityDescriptor { Name = f.Worker.Name, Kind = CapabilityKindEnum.Agent, SourceAgentId = f.Worker.Id } };
                await host.Server.Context.Get<Garrison.Server.Services.CapabilityService>().AttachOrgAsync(host.TenantId, descriptors, token).ConfigureAwait(false);
                Assert.True(descriptors[0].Org != null && descriptors[0].Org!.UnitName == f.Ops.Name && descriptors[0].Org!.Title == "Operator", "The capability carries the unit and title: " + Serializer.Serialize(descriptors[0].Org));
            }
        }

        private static async Task RoutesAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                Agent ceo = await AgentAsync(host, "route-ceo", token).ConfigureAwait(false);
                Agent lead = await AgentAsync(host, "route-lead", token).ConfigureAwait(false);
                string b = T(host) + "/organizations";
                Organization created = await HttpTestHelpers.SendAsync<Organization>(host.AdminClient, HttpMethod.Post, b, new Organization { Name = "route-org", Mission = "Serve." }, 201, token).ConfigureAwait(false);
                Assert.Equal(409, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, b, new Organization { Name = "route-org" }, token).ConfigureAwait(false)).StatusCode, "A duplicate name answers 409");
                OrgUnit root = await HttpTestHelpers.SendAsync<OrgUnit>(host.AdminClient, HttpMethod.Post, b + "/" + created.Id + "/units", new OrgUnit { Name = "root", LeadAgentId = ceo.Name }, 201, token).ConfigureAwait(false);
                OrgUnit ops = await HttpTestHelpers.SendAsync<OrgUnit>(host.AdminClient, HttpMethod.Post, b + "/route-org/units", new OrgUnit { Name = "ops", ParentUnitId = "root", LeadAgentId = lead.Name, Budgets = new List<OrgUnitBudget> { new OrgUnitBudget { AmountUsd = 3 } } }, 201, token).ConfigureAwait(false);
                KeeperSuite.Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, b + "/" + created.Id + "/units", new OrgUnit { Name = "rogue" }, token).ConfigureAwait(false), 409, "OneRoot", "A second root");
                Organization detail = await HttpTestHelpers.SendAsync<Organization>(host.AdminClient, HttpMethod.Get, b + "/" + created.Id, null, 200, token).ConfigureAwait(false);
                Assert.True(detail.Units != null && detail.Units.Count == 2 && detail.Units[0].Id == root.Id && detail.RootUnitId == root.Id, "Read with the working tree, root first");
                OrgUnit renamed = await HttpTestHelpers.SendAsync<OrgUnit>(host.AdminClient, HttpMethod.Put, b + "/" + created.Id + "/units/ops", new OrgUnit { Name = "operations", ParentUnitId = root.Id, LeadAgentId = lead.Id, Budgets = new List<OrgUnitBudget> { new OrgUnitBudget { AmountUsd = 3 } } }, 200, token).ConfigureAwait(false);
                Assert.Equal("operations", renamed.Name, "Update a unit by name");
                OrgChart working = await HttpTestHelpers.SendAsync<OrgChart>(host.AdminClient, HttpMethod.Get, b + "/" + created.Id + "/chart", null, 200, token).ConfigureAwait(false);
                Assert.True(working.Source == "Working" && working.Units.Count == 2, "Before publishing, the chart shows the working tree");

                OrgRevision draft = await HttpTestHelpers.SendAsync<OrgRevision>(host.AdminClient, HttpMethod.Post, b + "/" + created.Id + "/revisions", new OrgRevisionRequest { Note = "v1" }, 201, token).ConfigureAwait(false);
                OrgRevision published = await HttpTestHelpers.SendAsync<OrgRevision>(host.AdminClient, HttpMethod.Post, b + "/" + created.Id + "/revisions/" + draft.Id + "/publish", null, 200, token).ConfigureAwait(false);
                Assert.Equal(OrgRevisionStateEnum.Published, published.State, "Publish");
                await HttpTestHelpers.SendAsync<OrgRevision>(host.AdminClient, HttpMethod.Post, b + "/" + created.Id + "/revisions/" + (await HttpTestHelpers.SendAsync<OrgRevision>(host.AdminClient, HttpMethod.Post, b + "/" + created.Id + "/revisions", null, 201, token).ConfigureAwait(false)).Id + "/publish", null, 200, token).ConfigureAwait(false);
                List<OrgRevision> revisions = await HttpTestHelpers.SendAsync<List<OrgRevision>>(host.AdminClient, HttpMethod.Get, b + "/" + created.Id + "/revisions", null, 200, token).ConfigureAwait(false);
                Assert.True(revisions.Count == 2 && revisions[0].Number == 2, "Revisions, newest first");
                OrgRevision rolled = await HttpTestHelpers.SendAsync<OrgRevision>(host.AdminClient, HttpMethod.Post, b + "/" + created.Id + "/rollback", new OrgRollbackRequest { RevisionId = draft.Id }, 200, token).ConfigureAwait(false);
                Assert.True(rolled.Number == 3 && rolled.RollbackOfRevisionId == draft.Id, "Rollback to revision 1");
                List<OrgUnitSpend> spend = await HttpTestHelpers.SendAsync<List<OrgUnitSpend>>(host.AdminClient, HttpMethod.Get, b + "/" + created.Id + "/spend", null, 200, token).ConfigureAwait(false);
                Assert.True(spend.Any(s => s.UnitId == ops.Id && s.AmountUsd == 3 && !s.Exhausted), "Spend against the budget: " + Serializer.Serialize(spend));
                OrgChart live = await HttpTestHelpers.SendAsync<OrgChart>(host.AdminClient, HttpMethod.Get, b + "/" + created.Id + "/chart", null, 200, token).ConfigureAwait(false);
                Assert.True(live.Source == "Live" && live.RevisionNumber == 3, "The chart shows the live revision");
                Organization retired = await HttpTestHelpers.SendAsync<Organization>(host.AdminClient, HttpMethod.Put, b + "/" + created.Id, new Organization { Name = "route-org", Status = OrganizationStatusEnum.Retired }, 200, token).ConfigureAwait(false);
                Assert.Equal(OrganizationStatusEnum.Retired, retired.Status, "Retire");
                KeeperSuite.Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, b + "/" + created.Id + "/units", new OrgUnit { Name = "late", ParentUnitId = root.Id }, token).ConfigureAwait(false), 409, "OrganizationRetired", "A retired organization does not change");
                EnumerationResult<Organization> page = await HttpTestHelpers.SendAsync<EnumerationResult<Organization>>(host.AdminClient, HttpMethod.Get, b + "?search=route", null, 200, token).ConfigureAwait(false);
                Assert.Equal(1L, page.TotalRecords, "List with search");

                Organization foreign = await host.Server.Context.Database.Organizations.CreateAsync(new Organization { TenantId = "ten_elsewhere", Name = "foreign" }, token).ConfigureAwait(false);
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, b + "/" + foreign.Id, null, token).ConfigureAwait(false)).StatusCode, "Another tenant's organization answers 404");
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, b + "/" + foreign.Id + "/chart", null, token).ConfigureAwait(false)).StatusCode, "Another tenant's chart answers 404");
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, b + "/" + created.Id + "/units/oun_missing", null, token).ConfigureAwait(false)).StatusCode, "An unknown unit answers 404");
                Assert.True(host.Server.Context.Scopes.Find("REST", "GET " + "/v1.0/api/tenants/{tenantId}/organizations/{id}/chart") != null || host.Server.Context.Scopes.All().Any(s => s.ResourceType == ResourceTypeEnum.Organization), "Routes are in the scope map");

                await KeeperSuite.UserAsync(host, "org-viewer@example.com", "Viewer", token).ConfigureAwait(false);
                await KeeperSuite.UserAsync(host, "org-dev@example.com", "AgentDeveloper", token).ConfigureAwait(false);
                using (HttpClient viewer = await host.UserClientAsync("org-viewer@example.com", "password123", host.TenantId, token).ConfigureAwait(false))
                using (HttpClient developer = await host.UserClientAsync("org-dev@example.com", "password123", host.TenantId, token).ConfigureAwait(false))
                {
                    Assert.Equal(200, (await HttpTestHelpers.SendAsync(viewer, HttpMethod.Get, b + "/" + created.Id + "/chart", null, token).ConfigureAwait(false)).StatusCode, "A Viewer reads the chart");
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(viewer, HttpMethod.Post, b, new Organization { Name = "viewer-org" }, token).ConfigureAwait(false)).StatusCode, "A Viewer cannot create");
                    Assert.Equal(201, (await HttpTestHelpers.SendAsync(developer, HttpMethod.Post, b, new Organization { Name = "dev-org" }, token).ConfigureAwait(false)).StatusCode, "An AgentDeveloper creates");
                }
            }
        }

        private static async Task ManifestsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                foreach (string name in new[] { "mf-ceo", "mf-lead", "mf-worker", "mf-seller" }) await AgentAsync(host, name, token).ConfigureAwait(false);
                Garrison.Core.Manifests.ManifestService manifests = host.Server.Context.Get<Garrison.Core.Manifests.ManifestService>();
                Garrison.Core.Manifests.ManifestApplyOptions options = new Garrison.Core.Manifests.ManifestApplyOptions { PrincipalName = "admin", PrincipalType = PrincipalTypeEnum.Administrator };
                string yaml = "apiVersion: garrison/v1\nkind: Organization\nmetadata:\n  name: mf-org\nspec:\n  mission: Ship it.\n  units:\n    - name: root\n      lead: mf-ceo\n      leadTitle: CEO\n      budgets:\n        - { period: Day, amountUsd: 10 }\n      units:\n        - name: ops\n          lead: mf-lead\n          members:\n            - { agent: mf-worker, title: Operator }\n          peers: [sales]\n          budgets:\n            - { period: Day, amountUsd: 5 }\n        - name: sales\n          lead: mf-seller\n";
                ManifestApply applied = await manifests.ApplyAsync(host.TenantId, yaml, options, token).ConfigureAwait(false);
                Assert.True(applied.FailedCount == 0 && applied.CreatedCount == 1, "The organization applies: " + Serializer.Serialize(applied.Items));
                Organization org = Assert.NotNull(await host.Server.Context.Database.Organizations.ReadByNameAsync(host.TenantId, "mf-org", token).ConfigureAwait(false), "Created");
                Assert.True(org.Status == OrganizationStatusEnum.Active && org.CurrentRevisionNumber == 1, "Applying publishes the tree: " + Serializer.Serialize(org));
                OrgChart chart = await host.Server.Context.Get<OrganizationService>().ChartAsync(org, token).ConfigureAwait(false);
                OrgChartUnit ops = chart.Units.Single(u => u.Name == "ops");
                Assert.True(chart.Units.Count == 3 && ops.ParentUnitId == chart.Units[0].Id && ops.Members.Single().Title == "Operator" && ops.PeerUnitIds.Count == 1 && ops.Budgets.Single().AmountUsd == 5, "The live chart matches the manifest: " + Serializer.Serialize(chart));

                ManifestApply again = await manifests.ApplyAsync(host.TenantId, yaml, options, token).ConfigureAwait(false);
                Assert.True(again.UnchangedCount == 1 && again.FailedCount == 0, "Applying again changes nothing: " + Serializer.Serialize(again.Items));
                string invalid = yaml.Replace("amountUsd: 5", "amountUsd: 50", StringComparison.Ordinal);
                ManifestApply refused = await manifests.ApplyAsync(host.TenantId, invalid, options, token).ConfigureAwait(false);
                Assert.True(refused.FailedCount == 1 && Serializer.Serialize(refused.Items).Contains("BudgetExceedsParent", StringComparison.Ordinal), "A child budget over its parent's fails: " + Serializer.Serialize(refused.Items));

                Garrison.Core.Manifests.ManifestExportOptions export = new Garrison.Core.Manifests.ManifestExportOptions { FollowReferences = true };
                export.Resources.Add(new Garrison.Core.Manifests.ManifestResourceReference { Kind = "Organization", Name = "mf-org" });
                Garrison.Core.Manifests.ManifestExportResult exported = await manifests.ExportAsync(host.TenantId, export, token).ConfigureAwait(false);
                Assert.True(exported.Yaml.Contains("kind: Organization", StringComparison.Ordinal) && exported.Yaml.Contains("kind: Agent", StringComparison.Ordinal) && exported.Yaml.Contains("mf-worker", StringComparison.Ordinal), "The export carries the organization and its agents");
                await host.Server.Context.Get<OrganizationService>().DeleteAsync(Admin(host), org, token).ConfigureAwait(false);
                ManifestApply restored = await manifests.ApplyAsync(host.TenantId, exported.Yaml, options, token).ConfigureAwait(false);
                Organization back = Assert.NotNull(await host.Server.Context.Database.Organizations.ReadByNameAsync(host.TenantId, "mf-org", token).ConfigureAwait(false), "Re-created from the export");
                OrgChart roundTrip = await host.Server.Context.Get<OrganizationService>().ChartAsync(back, token).ConfigureAwait(false);
                Assert.True(restored.FailedCount == 0 && back.Status == OrganizationStatusEnum.Active && roundTrip.Units.Count == 3 && roundTrip.Units.Single(u => u.Name == "ops").Members.Single().AgentId == (await host.Server.Context.Database.Agents.ReadByNameAsync(host.TenantId, "mf-worker", token).ConfigureAwait(false))!.Id, "The bundle round-trips: " + Serializer.Serialize(restored.Items));

                // A studio draft builds a new organization with unit graph operations and applies after approval.
                string drafts = T(host) + "/studio/drafts";
                StudioDraft draft = await HttpTestHelpers.SendAsync<StudioDraft>(host.AdminClient, HttpMethod.Post, drafts, new StudioDraftCreateRequest { Title = "New org" }, 201, token).ConfigureAwait(false);
                int version = draft.Version;
                async Task<StudioGraph> Op(StudioGraphOperationRequest request)
                {
                    request.Version = version;
                    StudioGraph result = await HttpTestHelpers.SendAsync<StudioGraph>(host.AdminClient, HttpMethod.Post, drafts + "/" + draft.Id + "/graph-operations", request, 200, token).ConfigureAwait(false);
                    version = result.Version;
                    return result;
                }
                await Op(new StudioGraphOperationRequest { Operation = StudioGraphOperationEnum.AddUnit, Organization = "draft-org", Unit = "hq", Agent = "mf-ceo", Role = "CEO" }).ConfigureAwait(false);
                await Op(new StudioGraphOperationRequest { Operation = StudioGraphOperationEnum.AddUnit, Organization = "draft-org", Unit = "field", Parent = "hq", Agent = "mf-lead" }).ConfigureAwait(false);
                await Op(new StudioGraphOperationRequest { Operation = StudioGraphOperationEnum.AddUnit, Organization = "draft-org", Unit = "desk", Parent = "hq", Agent = "mf-seller" }).ConfigureAwait(false);
                await Op(new StudioGraphOperationRequest { Operation = StudioGraphOperationEnum.AddUnitMember, Organization = "draft-org", Unit = "field", Agent = "mf-worker", Role = "Runner" }).ConfigureAwait(false);
                StudioGraph graph = await Op(new StudioGraphOperationRequest { Operation = StudioGraphOperationEnum.ConnectUnits, Organization = "draft-org", From = "field", To = "desk" }).ConfigureAwait(false);
                Assert.True(graph.Nodes.Any(n => n.Key == "Organization/draft-org" && n.InDraft) && graph.Nodes.Single(n => n.Key == "OrgUnit/draft-org/field").ParentUnit == "hq" && graph.Nodes.Single(n => n.Name == "mf-worker").UnitOf.Contains("draft-org/field") && graph.Edges.Any(e => e.Kind == "Peer" && e.From == "field" && e.To == "desk"), "The canvas shows nested units, members, and the peer line: " + Serializer.Serialize(graph));
                TestResponse root2 = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, drafts + "/" + draft.Id + "/graph-operations", new StudioGraphOperationRequest { Version = version, Operation = StudioGraphOperationEnum.AddUnit, Organization = "draft-org", Unit = "rogue" }, token).ConfigureAwait(false);
                KeeperSuite.Code(root2, 400, "OneRoot", "A second root is refused on the canvas");
                StudioDraftDiff diff = await HttpTestHelpers.SendAsync<StudioDraftDiff>(host.AdminClient, HttpMethod.Post, drafts + "/" + draft.Id + "/validate", null, 200, token).ConfigureAwait(false);
                Assert.True(diff.Valid && diff.Items.Single(i => i.Kind == "Organization").Change == "Create", "The diff creates the organization: " + Serializer.Serialize(diff));
                Assert.True((await host.Server.Context.Database.Organizations.ReadByNameAsync(host.TenantId, "draft-org", token).ConfigureAwait(false)) == null, "Nothing changes before approval");
                Approval approval = await HttpTestHelpers.SendAsync<Approval>(host.AdminClient, HttpMethod.Post, drafts + "/" + draft.Id + "/request-apply", new StudioDraftVersionRequest { Version = version }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/approvals/" + approval.Id + "/decide", new ApprovalDecideRequest { Decision = ApprovalDecisionEnum.Allow }, token).ConfigureAwait(false);
                Organization created = Assert.NotNull(await host.Server.Context.Database.Organizations.ReadByNameAsync(host.TenantId, "draft-org", token).ConfigureAwait(false), "The approved draft created the organization");
                Assert.True(created.Status == OrganizationStatusEnum.Active && (await host.Server.Context.Database.Organizations.ListUnitsAsync(host.TenantId, created.Id, token).ConfigureAwait(false)).Count == 3, "It is live with three units: " + Serializer.Serialize(created));
            }
        }

        private static async Task ChannelAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                OrgFixture f = await FixtureAsync(host, "live", token).ConfigureAwait(false);
                Run spent = RunOf(host, f.Worker);
                spent.Status = RunStatusEnum.Succeeded;
                spent.CompletedUtc = DateTime.UtcNow;
                spent.CostUsd = 0.25;
                await host.Server.Context.Database.Runs.CreateAsync(spent, token).ConfigureAwait(false);
                using (ClientWebSocket socket = new ClientWebSocket())
                {
                    string bearer;
                    using (HttpClient login = await host.UserClientAsync("admin@garrison", "password", host.TenantId, token).ConfigureAwait(false))
                    {
                        bearer = login.DefaultRequestHeaders.Authorization!.Parameter!;
                    }
                    await socket.ConnectAsync(new Uri(host.BaseUrl.Replace("http://", "ws://", StringComparison.Ordinal) + "/v1.0/ws?token=" + Uri.EscapeDataString(bearer)), token).ConfigureAwait(false);
                    await socket.SendAsync(Encoding.UTF8.GetBytes("{\"type\":\"subscribe\",\"channel\":\"organization:" + f.Org.Id + "\"}"), WebSocketMessageType.Text, true, token).ConfigureAwait(false);
                    await KeeperSuite.ReceiveUntilAsync(socket, "organization.subscribed", f.Org.Id, token).ConfigureAwait(false);
                    string spend = await KeeperSuite.ReceiveUntilAsync(socket, "spend.updated", f.Ops.Id, token).ConfigureAwait(false);
                    Assert.True(spend.Contains("0.25", StringComparison.Ordinal), "spend.updated carries the subtree's spend: " + spend);
                    await Task.Delay(1200, token).ConfigureAwait(false);
                    await host.Server.Context.Get<OrganizationService>().UpdateAsync(Admin(host), f.Org, new Organization { Name = f.Org.Name, Mission = "A new mission." }, token).ConfigureAwait(false);
                    string changed = await KeeperSuite.ReceiveUntilAsync(socket, "org.changed", "A new mission.", token).ConfigureAwait(false);
                    Assert.True(changed.Length > 0, "org.changed arrives");
                    Report report = await host.Server.Context.Get<ReportService>().FileFromRunAsync(RunOf(host, f.Worker), new Report { Title = "Live report" }, token).ConfigureAwait(false);
                    await KeeperSuite.ReceiveUntilAsync(socket, "report.filed", report.Id, token).ConfigureAwait(false);
                }
                using (ClientWebSocket outsider = new ClientWebSocket())
                {
                    await KeeperSuite.UserAsync(host, "org-live-member@example.com", "TenantMember", token).ConfigureAwait(false);
                    string memberBearer;
                    using (HttpClient login = await host.UserClientAsync("org-live-member@example.com", "password123", host.TenantId, token).ConfigureAwait(false))
                    {
                        memberBearer = login.DefaultRequestHeaders.Authorization!.Parameter!;
                    }
                    await outsider.ConnectAsync(new Uri(host.BaseUrl.Replace("http://", "ws://", StringComparison.Ordinal) + "/v1.0/ws?token=" + Uri.EscapeDataString(memberBearer)), token).ConfigureAwait(false);
                    await outsider.SendAsync(Encoding.UTF8.GetBytes("{\"type\":\"subscribe\",\"channel\":\"organization:" + f.Org.Id + "\"}"), WebSocketMessageType.Text, true, token).ConfigureAwait(false);
                    string refused = await KeeperSuite.ReceiveUntilAsync(outsider, "error", "organization", token).ConfigureAwait(false);
                    Assert.True(refused.Length > 0, "Without Organization.Read the channel is refused");
                }
            }
        }

        private static async Task<OrgFixture> FixtureAsync(TestServerHost host, string prefix, CancellationToken token)
        {
            // root (CEO) with children ops (lead, worker) and sales (seller); ops and sales share a peer line.
            OrganizationService service = host.Server.Context.Get<OrganizationService>();
            RequestContext admin = Admin(host);
            OrgFixture f = new OrgFixture();
            f.Ceo = await AgentAsync(host, prefix + "-ceo", token).ConfigureAwait(false);
            f.Lead = await AgentAsync(host, prefix + "-lead", token).ConfigureAwait(false);
            f.Worker = await AgentAsync(host, prefix + "-worker", token).ConfigureAwait(false);
            f.Seller = await AgentAsync(host, prefix + "-seller", token).ConfigureAwait(false);
            f.Stranger = await AgentAsync(host, prefix + "-stranger", token).ConfigureAwait(false);
            f.Org = await service.CreateAsync(admin, host.TenantId, new Organization { Name = prefix + "-org", Mission = "Keep " + prefix + " running." }, token).ConfigureAwait(false);
            f.Root = await service.CreateUnitAsync(admin, f.Org, new OrgUnit { Name = prefix + "-root", LeadAgentId = f.Ceo.Id, LeadTitle = "CEO" }, token).ConfigureAwait(false);
            f.Sales = await service.CreateUnitAsync(admin, f.Org, new OrgUnit { Name = prefix + "-sales", ParentUnitId = f.Root.Id, LeadAgentId = f.Seller.Id }, token).ConfigureAwait(false);
            f.Ops = await service.CreateUnitAsync(admin, f.Org, new OrgUnit { Name = prefix + "-ops", ParentUnitId = f.Root.Id, LeadAgentId = f.Lead.Id, Members = new List<OrgUnitMember> { new OrgUnitMember { AgentId = f.Worker.Id, Title = "Operator" } }, PeerLines = new List<OrgUnitPeerLine> { new OrgUnitPeerLine { PeerUnitId = f.Sales.Id } } }, token).ConfigureAwait(false);
            OrgRevision revision = await service.CreateRevisionAsync(admin, f.Org, "Founding", token).ConfigureAwait(false);
            await service.PublishAsync(admin, f.Org, revision, token).ConfigureAwait(false);
            return f;
        }

        private static RequestContext Admin(TestServerHost host)
        {
            return new RequestContext { TenantId = host.TenantId, PrincipalType = PrincipalTypeEnum.Administrator, PrincipalName = "admin", IsAuthenticated = true };
        }

        private static async Task<Agent> AgentAsync(TestServerHost host, string name, CancellationToken token)
        {
            return await host.Server.Context.Database.Agents.CreateAsync(new Agent { TenantId = host.TenantId, Name = name }, token).ConfigureAwait(false);
        }

        private static async Task<Deployment> DeploymentAsync(TestServerHost host, Agent agent, CancellationToken token)
        {
            return await host.Server.Context.Database.Deployments.CreateAsync(new Deployment { TenantId = host.TenantId, Name = agent.Name + "-default", AgentId = agent.Id, HarnessProfileId = "hrn_builtin_fake" }, token).ConfigureAwait(false);
        }

        private static async Task<Mandate> MandateAsync(TestServerHost host, string name, Agent agent, Deployment deployment, string objective, CancellationToken token)
        {
            Mandate body = KeeperSuite.Body(name, agent, KeeperSuite.Revision(objective, WakeModeEnum.Fixed, 60, 120));
            body.DeploymentId = deployment.Id;
            return await HttpTestHelpers.SendAsync<Mandate>(host.AdminClient, HttpMethod.Post, T(host) + "/mandates", body, 201, token).ConfigureAwait(false);
        }

        private static Run RunOf(TestServerHost host, Agent agent)
        {
            Run run = new Run();
            run.Id = IdGenerator.NewRunId();
            run.TenantId = host.TenantId;
            run.AgentId = agent.Id;
            run.AgentName = agent.Name;
            run.Status = RunStatusEnum.Running;
            run.LeaseEpoch = 1;
            run.CallerType = PrincipalTypeEnum.Administrator;
            return run;
        }

        private static async Task<Run> PersistedRunAsync(TestServerHost host, Agent agent, CancellationToken token)
        {
            Deployment deployment = await host.Server.Context.Database.Deployments.CreateAsync(new Deployment { TenantId = host.TenantId, Name = agent.Name + "-aware", AgentId = agent.Id, HarnessProfileId = "hrn_builtin_fake" }, token).ConfigureAwait(false);
            Run run = RunOf(host, agent);
            run.DeploymentId = deployment.Id;
            run.LeaseExpiresUtc = DateTime.UtcNow.AddMinutes(5);
            return await host.Server.Context.Database.Runs.CreateAsync(run, token).ConfigureAwait(false);
        }

        private static async Task<TestMcpClient> RunClientAsync(TestServerHost host, Run run, CancellationToken token)
        {
            string bearer = await host.Server.Context.Authentication.IssueForRunAsync(run, run.LeaseEpoch, DateTime.UtcNow.AddMinutes(5), token).ConfigureAwait(false);
            TestMcpClient client = new TestMcpClient();
            await client.ConnectAsync(host, bearer, token).ConfigureAwait(false);
            return client;
        }

        private static AgentMessageSendRequest Send(string recipient, string subject)
        {
            return new AgentMessageSendRequest { Recipient = recipient, Subject = subject };
        }

        private static async Task<string> CodeAsync<T>(Func<Task<T>> action)
        {
            try
            {
                await action().ConfigureAwait(false);
            }
            catch (ConflictException e)
            {
                return e.Code;
            }
            catch (ValidationException)
            {
                return "ValidationFailed";
            }
            return "none";
        }

        private static string T(TestServerHost host)
        {
            return "/v1.0/api/tenants/" + host.TenantId;
        }

        #endregion
    }
}
