namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Net.Http;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Security;
    using Garrison.Core.Serialization;
    using Garrison.ProviderHarness;
    using Garrison.Server.Runtime;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Authorization scope fixes from the autonomy simulated user testing (docs/testing/AUTONOMY_SIMULATED_USERS.md):
    /// a BoardMember scoped to one organization uses the brakes, escalations, reports, and keepers of that organization
    /// and nothing else (UT-01), names work like identifiers for resource-scoped grants (UT-02), the organization list
    /// returns the scoped member's organization (UT-05), tools/list shows only the tools a principal could call (UT-19),
    /// and an unsupported method on a known path answers 405 with Allow (UT-20).
    /// </summary>
    public static class AuthorizationScopeSuite
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
                string id = "authz-scope-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                cases.Add(new TestCaseDescriptor(id, "board-member", "A BoardMember scoped to one organization reads and lists that organization's escalations, freezes, reports, keepers, and rules, freezes and lifts its units, reads the kill switch, works by name, and is refused everything of another organization (" + provider + ")", ct => BoardMemberAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "mcp-scoped", "Over MCP the scoped BoardMember freezes its own unit, lists only its organization, and is refused another organization's unit (" + provider + ")", ct => McpScopedAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "tool-list", "tools/list shows a Viewer, a scoped BoardMember, and an administrator only the tools their grants could call, and a run token keeps its own list (" + provider + ")", ct => ToolListAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "method-not-allowed", "An unsupported method on a known path answers 405 MethodNotAllowed with Allow; an unknown path stays 404 and an unauthenticated caller gets 401 (" + provider + ")", ct => MethodNotAllowedAsync(provider, ct)));
                suites.Add(new TestSuiteDescriptor(id, "Authorization scopes (" + provider + ")", cases));
            }
            return suites;
        }

        #endregion

        #region Private-Methods

        private static string T(TestServerHost host)
        {
            return "/v1.0/api/tenants/" + host.TenantId;
        }

        private static async Task<User> BoardMemberUserAsync(TestServerHost host, string email, string organizationId, CancellationToken token)
        {
            User member = await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, T(host) + "/users", new UserRequest { Email = email, Password = "password123" }, 201, token).ConfigureAwait(false);
            await HttpTestHelpers.SendAsync<UserRoleAssignment>(host.AdminClient, HttpMethod.Post, T(host) + "/user-role-assignments", new AssignmentRequest { UserId = member.Id, RoleName = BuiltInRoles.BoardMember, ResourceScope = ResourceScopeEnum.Resource, ResourceId = organizationId }, 201, token).ConfigureAwait(false);
            return member;
        }

        private static async Task BoardMemberAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                host.Server.Context.Get<MaintenanceService>().Keepers = null;
                string t = T(host);
                OrgFixture mine = await OrganizationSuite.FixtureAsync(host, "sc-a", token).ConfigureAwait(false);
                OrgFixture theirs = await OrganizationSuite.FixtureAsync(host, "sc-b", token).ConfigureAwait(false);
                Mandate keeper = await OrganizationSuite.MandateAsync(host, "sc-a-keeper", mine.Lead, await OrganizationSuite.DeploymentAsync(host, mine.Lead, token).ConfigureAwait(false), "Watch the queue.", token).ConfigureAwait(false);
                Mandate otherKeeper = await OrganizationSuite.MandateAsync(host, "sc-b-keeper", theirs.Lead, await OrganizationSuite.DeploymentAsync(host, theirs.Lead, token).ConfigureAwait(false), "Watch the other queue.", token).ConfigureAwait(false);
                Escalation ours = await host.Server.Context.Database.Escalations.CreateAsync(new Escalation { TenantId = host.TenantId, AgentId = mine.Lead.Id, AgentName = mine.Lead.Name, Question = "May I restart the queue?" }, token).ConfigureAwait(false);
                Escalation other = await host.Server.Context.Database.Escalations.CreateAsync(new Escalation { TenantId = host.TenantId, AgentId = theirs.Lead.Id, AgentName = theirs.Lead.Name, Question = "Not yours" }, token).ConfigureAwait(false);
                ReportService reports = host.Server.Context.Get<ReportService>();
                Report ourReport = await reports.FileFromRunAsync(OrganizationSuite.RunOf(host, mine.Worker), new Report { Title = "Queue fine", Health = ReportHealthEnum.Healthy }, token).ConfigureAwait(false);
                Report otherReport = await reports.FileFromRunAsync(OrganizationSuite.RunOf(host, theirs.Worker), new Report { Title = "Other queue", Health = ReportHealthEnum.Healthy }, token).ConfigureAwait(false);
                await BoardMemberUserAsync(host, "scoped-board@example.com", mine.Org.Id, token).ConfigureAwait(false);
                await KeeperSuite.UserAsync(host, "scoped-viewer@example.com", BuiltInRoles.Viewer, token).ConfigureAwait(false);

                using (HttpClient board = await host.UserClientAsync("scoped-board@example.com", "password123", host.TenantId, token).ConfigureAwait(false))
                using (HttpClient viewer = await host.UserClientAsync("scoped-viewer@example.com", "password123", host.TenantId, token).ConfigureAwait(false))
                {
                    // UT-05: the organization list returns the member's organization, not 403.
                    EnumerationResult<Organization> orgs = await HttpTestHelpers.SendAsync<EnumerationResult<Organization>>(board, HttpMethod.Get, t + "/organizations", null, 200, token).ConfigureAwait(false);
                    Assert.True(orgs.TotalRecords == 1 && orgs.Objects.Count == 1 && orgs.Objects[0].Id == mine.Org.Id, "A scoped BoardMember lists only its organization: " + Serializer.Serialize(orgs.Objects.Select(o => o.Name)));
                    EnumerationResult<Organization> all = await HttpTestHelpers.SendAsync<EnumerationResult<Organization>>(viewer, HttpMethod.Get, t + "/organizations", null, 200, token).ConfigureAwait(false);
                    Assert.True(all.TotalRecords >= 2, "A Viewer lists every organization");

                    // UT-02: the name works like the identifier, for the board and for the organization itself.
                    Assert.Equal(200, (await HttpTestHelpers.SendAsync(board, HttpMethod.Get, t + "/organizations/" + mine.Org.Name + "/board", null, token).ConfigureAwait(false)).StatusCode, "The board by name");
                    Assert.Equal(200, (await HttpTestHelpers.SendAsync(board, HttpMethod.Get, t + "/organizations/" + mine.Org.Name, null, token).ConfigureAwait(false)).StatusCode, "The organization by name");
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(board, HttpMethod.Get, t + "/organizations/" + theirs.Org.Name + "/board", null, token).ConfigureAwait(false)).StatusCode, "Another organization's board by name is refused");

                    // UT-01: escalations raised by the organization's agents.
                    Assert.Equal(200, (await HttpTestHelpers.SendAsync(board, HttpMethod.Get, t + "/escalations/" + ours.Id, null, token).ConfigureAwait(false)).StatusCode, "The member reads its organization's escalation");
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(board, HttpMethod.Get, t + "/escalations/" + other.Id, null, token).ConfigureAwait(false)).StatusCode, "and not another organization's");
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(board, HttpMethod.Post, t + "/escalations/" + other.Id + "/cancel", new EscalationCancelRequest { Reason = "no" }, token).ConfigureAwait(false)).StatusCode, "nor cancels it");
                    EnumerationResult<Escalation> escalations = await HttpTestHelpers.SendAsync<EnumerationResult<Escalation>>(board, HttpMethod.Get, t + "/escalations", null, 200, token).ConfigureAwait(false);
                    Assert.True(escalations.TotalRecords == 1 && escalations.Objects.Single().Id == ours.Id, "The escalation list is filtered to the organization: " + escalations.TotalRecords);
                    Assert.Equal(200, (await HttpTestHelpers.SendAsync(board, HttpMethod.Get, t + "/escalations?agentId=" + mine.Lead.Id, null, token).ConfigureAwait(false)).StatusCode, "A list filtered to one of its agents");
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(board, HttpMethod.Get, t + "/escalations?agentId=" + theirs.Lead.Id, null, token).ConfigureAwait(false)).StatusCode, "A list filtered to another organization's agent is refused");
                    Assert.Equal(2L, (await HttpTestHelpers.SendAsync<EnumerationResult<Escalation>>(viewer, HttpMethod.Get, t + "/escalations", null, 200, token).ConfigureAwait(false)).TotalRecords, "A Viewer lists every escalation");
                    Escalation cancelled = await HttpTestHelpers.SendAsync<Escalation>(board, HttpMethod.Post, t + "/escalations/" + ours.Id + "/cancel", new EscalationCancelRequest { Reason = "Handled by the board" }, 200, token).ConfigureAwait(false);
                    Assert.True(cancelled.Status != EscalationStatusEnum.Open, "The member resolves its organization's escalation");

                    // Keepers, by identifier and by name.
                    Assert.Equal(200, (await HttpTestHelpers.SendAsync(board, HttpMethod.Get, t + "/mandates/" + keeper.Id, null, token).ConfigureAwait(false)).StatusCode, "The member reads its organization's keeper");
                    Assert.Equal(200, (await HttpTestHelpers.SendAsync(board, HttpMethod.Get, t + "/mandates/" + keeper.Name, null, token).ConfigureAwait(false)).StatusCode, "by name too");
                    Assert.Equal(200, (await HttpTestHelpers.SendAsync(board, HttpMethod.Get, t + "/mandates/" + keeper.Id + "/ticks", null, token).ConfigureAwait(false)).StatusCode, "and its ticks");
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(board, HttpMethod.Get, t + "/mandates/" + otherKeeper.Name, null, token).ConfigureAwait(false)).StatusCode, "Another organization's keeper is refused");
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(board, HttpMethod.Get, t + "/mandates", null, token).ConfigureAwait(false)).StatusCode, "The unfiltered keeper list needs a tenant-wide grant");
                    Assert.Equal(200, (await HttpTestHelpers.SendAsync(board, HttpMethod.Get, t + "/mandates?agentId=" + mine.Lead.Id, null, token).ConfigureAwait(false)).StatusCode, "The keeper list filtered to one of its agents");

                    // Reports.
                    Assert.Equal(200, (await HttpTestHelpers.SendAsync(board, HttpMethod.Get, t + "/reports/" + ourReport.Id, null, token).ConfigureAwait(false)).StatusCode, "The member reads its organization's report");
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(board, HttpMethod.Get, t + "/reports/" + otherReport.Id, null, token).ConfigureAwait(false)).StatusCode, "and not another organization's");
                    EnumerationResult<Report> listed = await HttpTestHelpers.SendAsync<EnumerationResult<Report>>(board, HttpMethod.Get, t + "/reports", null, 200, token).ConfigureAwait(false);
                    Assert.True(listed.Objects.Any(r => r.Id == ourReport.Id) && !listed.Objects.Any(r => r.Id == otherReport.Id), "The report list is filtered to the organization");
                    Assert.Equal(200, (await HttpTestHelpers.SendAsync(board, HttpMethod.Get, t + "/reports?author=" + mine.Worker.Name, null, token).ConfigureAwait(false)).StatusCode, "Reports by one of its agents, by name");
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(board, HttpMethod.Get, t + "/reports?unit=" + theirs.Ops.Id, null, token).ConfigureAwait(false)).StatusCode, "Reports of another organization's unit are refused");

                    // Change rules need the organization filter; the kill switch is readable but not settable.
                    Assert.Equal(200, (await HttpTestHelpers.SendAsync(board, HttpMethod.Get, t + "/change-rules?organization=" + mine.Org.Name, null, token).ConfigureAwait(false)).StatusCode, "Change rules of its organization, by name");
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(board, HttpMethod.Get, t + "/change-rules?organization=" + theirs.Org.Id, null, token).ConfigureAwait(false)).StatusCode, "Change rules of another organization are refused");
                    Assert.Equal(200, (await HttpTestHelpers.SendAsync(board, HttpMethod.Get, t + "/autonomy/kill-switch", null, token).ConfigureAwait(false)).StatusCode, "The member reads the kill switch");
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(board, HttpMethod.Put, t + "/autonomy/kill-switch", new KillSwitchRequest { Enabled = true }, token).ConfigureAwait(false)).StatusCode, "but cannot stop every keeper in the tenant");

                    // Freezes: its own unit and keeper, never another organization's or the tenant.
                    Freeze unitFreeze = await HttpTestHelpers.SendAsync<Freeze>(board, HttpMethod.Post, t + "/freezes", new Freeze { TargetKind = FreezeTargetKindEnum.OrgUnit, TargetId = mine.Ops.Id, Reason = "Board brake" }, 201, token).ConfigureAwait(false);
                    Freeze keeperFreeze = await HttpTestHelpers.SendAsync<Freeze>(board, HttpMethod.Post, t + "/freezes", new Freeze { TargetKind = FreezeTargetKindEnum.Mandate, TargetId = keeper.Name, Reason = "Pause the keeper" }, 201, token).ConfigureAwait(false);
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(board, HttpMethod.Post, t + "/freezes", new Freeze { TargetKind = FreezeTargetKindEnum.OrgUnit, TargetId = theirs.Ops.Id }, token).ConfigureAwait(false)).StatusCode, "Freezing another organization's unit is refused");
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(board, HttpMethod.Post, t + "/freezes", new Freeze { TargetKind = FreezeTargetKindEnum.Agent, TargetId = mine.Stranger.Id }, token).ConfigureAwait(false)).StatusCode, "Freezing an agent outside the organization is refused");
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(board, HttpMethod.Post, t + "/freezes", new Freeze { TargetKind = FreezeTargetKindEnum.TenantAutonomy }, token).ConfigureAwait(false)).StatusCode, "The tenant kill switch is refused");
                    Freeze theirFreeze = await host.Server.Context.Get<FreezeService>().ApplyAsync(OrganizationSuite.Admin(host), host.TenantId, new Freeze { TargetKind = FreezeTargetKindEnum.OrgUnit, TargetId = theirs.Sales.Id }, token).ConfigureAwait(false);
                    EnumerationResult<Freeze> freezes = await HttpTestHelpers.SendAsync<EnumerationResult<Freeze>>(board, HttpMethod.Get, t + "/freezes", null, 200, token).ConfigureAwait(false);
                    Assert.True(freezes.TotalRecords == 2 && freezes.Objects.All(f => f.Id == unitFreeze.Id || f.Id == keeperFreeze.Id), "The freeze list is filtered to the organization: " + Serializer.Serialize(freezes.Objects.Select(f => f.TargetName)));
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(board, HttpMethod.Get, t + "/freezes/" + theirFreeze.Id, null, token).ConfigureAwait(false)).StatusCode, "Another organization's freeze is refused");
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(board, HttpMethod.Post, t + "/freezes/" + theirFreeze.Id + "/lift", new FreezeLiftRequest(), token).ConfigureAwait(false)).StatusCode, "and cannot be lifted");
                    Freeze lifted = await HttpTestHelpers.SendAsync<Freeze>(board, HttpMethod.Post, t + "/freezes/" + unitFreeze.Id + "/lift", new FreezeLiftRequest { Reason = "Done" }, 200, token).ConfigureAwait(false);
                    Assert.True(!lifted.Active, "The member lifts its own freeze");

                    // Nothing outside the role: no organization creation, no agent creation.
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(board, HttpMethod.Post, t + "/organizations", new Organization { Name = "sc-new" }, token).ConfigureAwait(false)).StatusCode, "A BoardMember cannot create organizations");
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(board, HttpMethod.Get, t + "/secrets", null, token).ConfigureAwait(false)).StatusCode, "nor read secrets");
                }

                // Every changed route keeps its scope map entry.
                Garrison.Server.Routes.OperationScopeMap scopes = host.Server.Context.Scopes;
                Assert.True(scopes.Find("POST", "/v1.0/api/tenants/{tenantId}/freezes")?.ResourceType == ResourceTypeEnum.Freeze && scopes.Find("POST", "/v1.0/api/tenants/{tenantId}/freezes")?.Operation == OperationTypeEnum.Create, "POST /freezes is in the scope map");
                Assert.True(scopes.Find("POST", "/v1.0/api/tenants/{tenantId}/change-rules")?.ResourceType == ResourceTypeEnum.ChangeRule && scopes.Find("POST", "/v1.0/api/tenants/{tenantId}/change-rules")?.Operation == OperationTypeEnum.Create, "POST /change-rules is in the scope map");

                // Another tenant's organization stays 404 for the administrator, and a scoped grant never crosses tenants.
                Organization foreign = await host.Server.Context.Database.Organizations.CreateAsync(new Organization { TenantId = "ten_elsewhere", Name = "sc-foreign" }, token).ConfigureAwait(false);
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, t + "/organizations/" + foreign.Id, null, token).ConfigureAwait(false)).StatusCode, "Another tenant's organization answers 404");
            }
        }

        private static async Task McpScopedAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                host.Server.Context.Get<MaintenanceService>().Keepers = null;
                OrgFixture mine = await OrganizationSuite.FixtureAsync(host, "mc-a", token).ConfigureAwait(false);
                OrgFixture theirs = await OrganizationSuite.FixtureAsync(host, "mc-b", token).ConfigureAwait(false);
                await BoardMemberUserAsync(host, "mcp-board@example.com", mine.Org.Id, token).ConfigureAwait(false);
                using (HttpClient board = await host.UserClientAsync("mcp-board@example.com", "password123", host.TenantId, token).ConfigureAwait(false))
                using (TestMcpClient client = new TestMcpClient())
                {
                    await client.ConnectAsync(host, board.DefaultRequestHeaders.Authorization?.Parameter, token).ConfigureAwait(false);
                    string frozen = await client.CallAsync("garrison_freeze", new { targetKind = "OrgUnit", target = mine.Ops.Name, reason = "Board brake" }, token).ConfigureAwait(false);
                    Assert.True(frozen.Contains(mine.Ops.Id, StringComparison.Ordinal), "The member freezes its unit over MCP: " + frozen);
                    await client.ExpectErrorAsync("garrison_freeze", new { targetKind = "OrgUnit", target = theirs.Ops.Id }, "Forbidden", token).ConfigureAwait(false);
                    string organizations = await client.CallAsync("garrison_list_organizations", new { }, token).ConfigureAwait(false);
                    Assert.True(organizations.Contains(mine.Org.Id, StringComparison.Ordinal) && !organizations.Contains(theirs.Org.Id, StringComparison.Ordinal), "The organization list over MCP is filtered: " + organizations);
                    string listed = await client.CallAsync("garrison_list_freezes", new { }, token).ConfigureAwait(false);
                    Assert.True(listed.Contains(mine.Ops.Id, StringComparison.Ordinal), "The freeze list over MCP shows the member's freeze: " + listed);
                    string organization = await client.CallAsync("garrison_get_organization", new { organization = mine.Org.Name }, token).ConfigureAwait(false);
                    Assert.True(organization.Contains(mine.Org.Id, StringComparison.Ordinal), "The organization by name over MCP");
                    await client.ExpectErrorAsync("garrison_get_organization", new { organization = theirs.Org.Name }, "Forbidden", token).ConfigureAwait(false);
                }
            }
        }

        private static async Task ToolListAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                host.Server.Context.Get<MaintenanceService>().Keepers = null;
                OrgFixture mine = await OrganizationSuite.FixtureAsync(host, "tl-a", token).ConfigureAwait(false);
                await BoardMemberUserAsync(host, "tools-board@example.com", mine.Org.Id, token).ConfigureAwait(false);
                await KeeperSuite.UserAsync(host, "tools-viewer@example.com", BuiltInRoles.Viewer, token).ConfigureAwait(false);

                using (TestMcpClient admin = new TestMcpClient())
                {
                    await admin.ConnectAsync(host, null, token).ConfigureAwait(false);
                    ProviderToolPage tools = await admin.ToolsAsync(token).ConfigureAwait(false);
                    Assert.True(tools.Tools.Any(t => t.Name == "garrison_freeze") && tools.Tools.Any(t => t.Name == "garrison_create_organization") && tools.Tools.Any(t => t.Name == "garrison_list_agents"), "An administrator sees every management tool");
                }
                using (HttpClient viewerHttp = await host.UserClientAsync("tools-viewer@example.com", "password123", host.TenantId, token).ConfigureAwait(false))
                using (TestMcpClient viewer = new TestMcpClient())
                {
                    await viewer.ConnectAsync(host, viewerHttp.DefaultRequestHeaders.Authorization?.Parameter, token).ConfigureAwait(false);
                    ProviderToolPage tools = await viewer.ToolsAsync(token).ConfigureAwait(false);
                    Assert.True(tools.Tools.Any(t => t.Name == "garrison_list_agents") && tools.Tools.Any(t => t.Name == "garrison_list_freezes"), "A Viewer sees read tools");
                    Assert.True(!tools.Tools.Any(t => t.Name == "garrison_freeze") && !tools.Tools.Any(t => t.Name == "garrison_answer_escalation") && !tools.Tools.Any(t => t.Name == "garrison_create_organization"), "A Viewer does not see tools that write: " + String.Join(", ", tools.Tools.Select(t => t.Name)));
                }
                using (HttpClient boardHttp = await host.UserClientAsync("tools-board@example.com", "password123", host.TenantId, token).ConfigureAwait(false))
                using (TestMcpClient board = new TestMcpClient())
                {
                    await board.ConnectAsync(host, boardHttp.DefaultRequestHeaders.Authorization?.Parameter, token).ConfigureAwait(false);
                    ProviderToolPage tools = await board.ToolsAsync(token).ConfigureAwait(false);
                    Assert.True(tools.Tools.Any(t => t.Name == "garrison_freeze") && tools.Tools.Any(t => t.Name == "garrison_board_get") && tools.Tools.Any(t => t.Name == "garrison_answer_escalation"), "A scoped BoardMember sees the tools its organization grant could call");
                    Assert.True(!tools.Tools.Any(t => t.Name == "garrison_create_organization"), "A scoped BoardMember does not see organization creation");
                }

                Run run = OrganizationSuite.RunOf(host, mine.Lead);
                run.DeploymentId = (await OrganizationSuite.DeploymentAsync(host, mine.Lead, token).ConfigureAwait(false)).Id;
                run.LeaseExpiresUtc = DateTime.UtcNow.AddMinutes(5);
                await host.Server.Context.Database.Runs.CreateAsync(run, token).ConfigureAwait(false);
                using (TestMcpClient runClient = await OrganizationSuite.RunClientAsync(host, run, token).ConfigureAwait(false))
                {
                    ProviderToolPage tools = await runClient.ToolsAsync(token).ConfigureAwait(false);
                    Assert.True(tools.Tools.Any(t => t.Name == "garrison_escalate") && tools.Tools.Any(t => t.Name == "garrison_file_report"), "A run keeps the tools its run may call");
                    Assert.True(!tools.Tools.Any(t => t.Name == "garrison_freeze") && !tools.Tools.Any(t => t.Name == "garrison_create_change_rule"), "and still never sees the brakes or rule writing");
                }
            }
        }

        private static async Task MethodNotAllowedAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                string t = T(host);
                using (HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Patch, t + "/mandates/some-keeper"))
                {
                    request.Content = new StringContent("{}", Encoding.UTF8, "application/json");
                    HttpResponseMessage response = await host.AdminClient.SendAsync(request, token).ConfigureAwait(false);
                    string body = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                    Assert.Equal(405, (int)response.StatusCode, "PATCH on a keeper answers 405: " + body);
                    string allow = String.Join(", ", response.Content.Headers.Allow.Concat(response.Headers.TryGetValues("Allow", out IEnumerable<string>? values) ? values : Enumerable.Empty<string>()));
                    Assert.True(allow.Contains("GET", StringComparison.Ordinal) && allow.Contains("PUT", StringComparison.Ordinal) && allow.Contains("DELETE", StringComparison.Ordinal) && !allow.Contains("PATCH", StringComparison.Ordinal), "Allow lists the keeper's methods: " + allow);
                    ErrorResponse? error = Serializer.Deserialize<ErrorResponse>(body);
                    Assert.True(error != null && error.Code == "MethodNotAllowed" && error.Error == "MethodNotAllowed" && !String.IsNullOrEmpty(error.RequestId), "The standard error body: " + body);
                }
                using (HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Patch, t + "/no-such-thing"))
                {
                    HttpResponseMessage response = await host.AdminClient.SendAsync(request, token).ConfigureAwait(false);
                    string body = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                    Assert.True((int)response.StatusCode == 404 && body.Contains("RouteNotFound", StringComparison.Ordinal), "An unknown path stays 404 RouteNotFound: " + body);
                }
                using (HttpClient anonymous = new HttpClient())
                using (HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Patch, host.BaseUrl + t + "/mandates/some-keeper"))
                {
                    HttpResponseMessage response = await anonymous.SendAsync(request, token).ConfigureAwait(false);
                    Assert.Equal(401, (int)response.StatusCode, "An unauthenticated caller learns nothing about the path");
                }
            }
        }

        #endregion
    }
}
