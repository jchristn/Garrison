namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Net.Http;
    using System.Net.Http.Headers;
    using System.Security.Cryptography;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Database.Ado;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Security;
    using Garrison.Core.Serialization;
    using Garrison.Server.Runtime;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Agentic apps (AD6): validation, slug uniqueness, and AgentInUse; delegation derived from the app graph with drift;
    /// app revisions and app promotion all-or-none; app sessions and their limits; and a two-turn conversation through
    /// the gateway that lists and downloads a file the agent wrote.
    /// </summary>
    public static class AppSuite
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
                string id = "apps-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                cases.Add(new TestCaseDescriptor(id, "crud-validation", "Apps validate members, entry, edges, cycles, and reachability; slugs are unique across tenants (AppSlugTaken); a member agent cannot be deleted (AgentInUse); 403 and cross-tenant 404 (" + provider + ")", ct => CrudAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "delegation", "A three-level graph derives each member's allow list and depth into drafts; a contradicting published edit is drift and a conflicting draft is not overwritten (" + provider + ")", ct => DelegationAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "revisions-promotion", "An app revision pins every member; promotion and rollback move all three members' pins together, and a missing target deployment changes none (" + provider + ")", ct => PromotionAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "sessions", "App sessions: AppUser role required, management API refuses the token, another user's conversation is 404, expired sessions end, anonymous only when enabled (" + provider + ")", ct => SessionsAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "manifest-mcp", "A full app bundle applies, exports, and re-applies unchanged; MCP app tools list, create, read, and update apps (" + provider + ")", ct => ManifestAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "appearance-data", "Appearance fields and ordered starter prompts round-trip at the driver, an update replaces the prompts, another tenant reads nothing, and tenant deletion removes the prompt rows (" + provider + ")", ct => AppearanceDataAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "appearance-validation", "Appearance fields default, round-trip over REST, and are refused with field codes: InvalidColor, TooLong, TooMany and Required starter prompts, UnknownAsset for another tenant's avatar (" + provider + ")", ct => AppearanceValidationAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "appearance-surfaces", "The public app config carries every appearance field with the entry agent's name as the fallback author and the avatar served at /avatar; a manifest with appearance keys applies, exports them, and re-applies unchanged; MCP creates an app with them (" + provider + ")", ct => AppearanceSurfacesAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "gateway-conversation", "A two-turn gateway conversation on the fake harness, streamed, and a file the agent wrote listed and downloaded with a matching SHA-256 (" + provider + ")", ct => GatewayAsync(provider, ct)));
                suites.Add(new TestSuiteDescriptor(id, "Agentic apps (" + provider + ")", cases));
            }
            return suites;
        }

        #endregion

        #region Private-Methods

        private static string T(TestServerHost host)
        {
            return "/v1.0/api/tenants/" + host.TenantId;
        }

        private static void Code(TestResponse response, int status, string code, string what)
        {
            Assert.Equal(status, response.StatusCode, what + " status (" + response.Body + ")");
            Assert.True(response.Body.Contains(code, StringComparison.Ordinal), what + " answers " + code + ": " + response.Body);
        }

        private static async Task<List<Agent>> AgentsAsync(TestServerHost host, string prefix, CancellationToken token)
        {
            List<Agent> agents = new List<Agent>();
            foreach (string role in new[] { "orchestrator", "researcher", "writer" })
            {
                agents.Add(await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, T(host) + "/agents", new Agent { Name = prefix + "-" + role, Description = "The " + role + "." }, 201, token).ConfigureAwait(false));
            }
            return agents;
        }

        private static AgenticApp App(string name, List<Agent> agents)
        {
            return new AgenticApp
            {
                Name = name, EntryAgentId = agents[0].Name,
                Members = agents.Select(a => new AgenticAppMember { AgentId = a.Name }).ToList(),
                Edges = new List<AgenticAppEdge>
                {
                    new AgenticAppEdge { CallerAgentId = agents[0].Name, CalleeAgentId = agents[1].Name },
                    new AgenticAppEdge { CallerAgentId = agents[1].Name, CalleeAgentId = agents[2].Name }
                }
            };
        }

        private static async Task CrudAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                List<Agent> agents = await AgentsAsync(host, "crud", token).ConfigureAwait(false);
                string apps = T(host) + "/apps";
                AgenticApp created = await HttpTestHelpers.SendAsync<AgenticApp>(host.AdminClient, HttpMethod.Post, apps, App("research", agents), 201, token).ConfigureAwait(false);
                Assert.True(created.Id.StartsWith("app_", StringComparison.Ordinal) && created.Slug == "research" && created.EntryAgentId == agents[0].Id, "Names resolve to identifiers; slug defaults to the name");
                Assert.True(created.Members.All(m => m.AgentName != null) && created.Edges.Count == 2, "Members and edges stored");

                AgenticApp bad = App("bad", agents);
                bad.EntryAgentId = "not-a-member";
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, apps, bad, token).ConfigureAwait(false), 400, "EntryNotMember", "Entry must be a member");
                AgenticApp unreachable = App("unreachable", agents);
                unreachable.Edges.RemoveAt(1);
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, apps, unreachable, token).ConfigureAwait(false), 400, "UnreachableMember", "Unreachable member");
                AgenticApp cycle = App("cycle", agents);
                cycle.Edges.Add(new AgenticAppEdge { CallerAgentId = agents[2].Name, CalleeAgentId = agents[0].Name });
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, apps, cycle, token).ConfigureAwait(false), 400, "AppGraphCycle", "Cycle");
                AgenticApp outside = App("outside", agents);
                outside.Members.RemoveAt(2);
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, apps, outside, token).ConfigureAwait(false), 400, "EdgeNotMember", "Edge to a non-member");
                TestResponse blocked = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, T(host) + "/agents/" + agents[2].Id, null, token).ConfigureAwait(false);
                Code(blocked, 409, "AgentInUse", "A member agent cannot be deleted");
                Assert.True(blocked.Body.Contains(agents[2].Name, StringComparison.Ordinal) && blocked.Body.Contains(created.Name, StringComparison.Ordinal) && blocked.Body.Contains("Remove it from that app first", StringComparison.Ordinal), "Delete refusal names the agent, app, and recovery step");
                TestResponse protectedAgent = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, T(host) + "/agents/agent-architect", null, token).ConfigureAwait(false);
                Code(protectedAgent, 409, "Protected", "The built-in architect cannot be deleted");
                Assert.True(protectedAgent.Body.Contains("agent-architect", StringComparison.Ordinal) && protectedAgent.Body.Contains("protected built-in agent and cannot be deleted", StringComparison.Ordinal), "Protected refusal explains why agent-architect cannot be deleted");

                using (TestMcpClient caller = new TestMcpClient())
                {
                    await caller.ConnectAsync(host, null, token).ConfigureAwait(false);
                    await caller.ExpectErrorAsync("garrison_delete_agent", new { agent = agents[2].Id }, "AgentInUse: Agent " + agents[2].Name + " is a member of app " + created.Name + ". Remove it from that app first.", token).ConfigureAwait(false);
                    await caller.ExpectErrorAsync("garrison_delete_agent", new { agent = "agent-architect" }, "Protected: Agent agent-architect is a protected built-in agent and cannot be deleted.", token).ConfigureAwait(false);
                }

                created.Description = "Builds research overviews.";
                AgenticApp updated = await HttpTestHelpers.SendAsync<AgenticApp>(host.AdminClient, HttpMethod.Put, apps + "/research", created, 200, token).ConfigureAwait(false);
                Assert.Equal("Builds research overviews.", updated.Description ?? String.Empty, "Updated by name");

                Tenant other = await HttpTestHelpers.SendAsync<Tenant>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants", new TenantRequest { Name = "Apps Other" }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + other.Id + "/users", new UserRequest { Email = "apps-outsider@example.com", Password = "password123", IsTenantAdmin = true }, 201, token).ConfigureAwait(false);
                using (HttpClient outsider = await host.UserClientAsync("apps-outsider@example.com", "password123", other.Id, token).ConfigureAwait(false))
                {
                    Assert.Equal(404, (await HttpTestHelpers.SendAsync(outsider, HttpMethod.Get, "/v1.0/api/tenants/" + other.Id + "/apps/" + created.Id, null, token).ConfigureAwait(false)).StatusCode, "Another tenant's app");
                    Agent theirs = await HttpTestHelpers.SendAsync<Agent>(outsider, HttpMethod.Post, "/v1.0/api/tenants/" + other.Id + "/agents", new Agent { Name = "their-entry" }, 201, token).ConfigureAwait(false);
                    AgenticApp clash = new AgenticApp { Name = "theirs", Slug = "research", EntryAgentId = theirs.Id, Members = new List<AgenticAppMember> { new AgenticAppMember { AgentId = theirs.Id } } };
                    Code(await HttpTestHelpers.SendAsync(outsider, HttpMethod.Post, "/v1.0/api/tenants/" + other.Id + "/apps", clash, token).ConfigureAwait(false), 409, "AppSlugTaken", "Slugs are unique across tenants");
                }
                await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, T(host) + "/users", new UserRequest { Email = "apps-viewer@example.com", Password = "password123" }, 201, token).ConfigureAwait(false);
                User viewer = Assert.NotNull((await host.Server.Context.Database.Users.EnumerateAsync(host.TenantId, new EnumerationQuery { MaxResults = 1000 }, token).ConfigureAwait(false)).Objects.FirstOrDefault(u => u.Email == "apps-viewer@example.com"), "Viewer");
                await HttpTestHelpers.SendAsync<UserRoleAssignment>(host.AdminClient, HttpMethod.Post, T(host) + "/user-role-assignments", new AssignmentRequest { UserId = viewer.Id, RoleName = BuiltInRoles.Viewer }, 201, token).ConfigureAwait(false);
                using (HttpClient client = await host.UserClientAsync("apps-viewer@example.com", "password123", host.TenantId, token).ConfigureAwait(false))
                {
                    await HttpTestHelpers.SendAsync<AgenticApp>(client, HttpMethod.Get, apps + "/research", null, 200, token).ConfigureAwait(false);
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(client, HttpMethod.Delete, apps + "/research", null, token).ConfigureAwait(false)).StatusCode, "Viewers cannot delete apps");
                }
                Assert.Equal(204, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, apps + "/research", null, token).ConfigureAwait(false)).StatusCode, "Delete");
                Assert.Equal(204, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, T(host) + "/agents/" + agents[2].Id, null, token).ConfigureAwait(false)).StatusCode, "No longer a member, the agent can go");
            }
        }

        private static async Task DelegationAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                List<Agent> agents = await AgentsAsync(host, "dlg", token).ConfigureAwait(false);
                string apps = T(host) + "/apps";
                await HttpTestHelpers.SendAsync<AgenticApp>(host.AdminClient, HttpMethod.Post, apps, App("dlg", agents), 201, token).ConfigureAwait(false);
                AppDelegationPlan plan = await HttpTestHelpers.SendAsync<AppDelegationPlan>(host.AdminClient, HttpMethod.Get, apps + "/dlg/delegation", null, 200, token).ConfigureAwait(false);
                AppDelegationMember orchestrator = plan.Members.Single(m => m.AgentName == "dlg-orchestrator");
                Assert.True(orchestrator.DesiredMode == DelegationModeEnum.AllowList && orchestrator.DesiredAllowList.SequenceEqual(new[] { "dlg-researcher" }) && orchestrator.DesiredMaxDepth == 2 && orchestrator.Drift, "Orchestrator: allow the researcher, depth 2");
                AppDelegationMember researcher = plan.Members.Single(m => m.AgentName == "dlg-researcher");
                Assert.True(researcher.DesiredAllowList.SequenceEqual(new[] { "dlg-writer" }) && researcher.DesiredMaxDepth == 1, "Researcher: allow the writer, depth 1");
                AppDelegationMember writer = plan.Members.Single(m => m.AgentName == "dlg-writer");
                Assert.True(writer.DesiredMode == DelegationModeEnum.None && !writer.Drift, "Writer: no delegation and no drift");

                AppDelegationPlan applied = await HttpTestHelpers.SendAsync<AppDelegationPlan>(host.AdminClient, HttpMethod.Post, apps + "/dlg/delegation", null, 200, token).ConfigureAwait(false);
                Assert.True(applied.Applied && applied.Members.Where(m => m.Drift).All(m => m.DraftRevisionNumber == 2), "Drafts written for drifting members");
                foreach (Agent agent in agents.Take(2))
                {
                    await HttpTestHelpers.SendAsync<AgentRevision>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/" + agent.Id + "/revisions/2/publish", null, 200, token).ConfigureAwait(false);
                }
                AppDelegationPlan clean = await HttpTestHelpers.SendAsync<AppDelegationPlan>(host.AdminClient, HttpMethod.Get, apps + "/dlg/delegation", null, 200, token).ConfigureAwait(false);
                Assert.True(clean.Members.All(m => !m.Drift), "After publishing, no drift: " + Serializer.Serialize(clean));

                // A manual edit that contradicts the graph is reported, not silently overwritten.
                await HttpTestHelpers.SendAsync<AgentRevision>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/" + agents[2].Id + "/revisions", new AgentRevision { Description = "Writer.", DelegationMode = DelegationModeEnum.AllowList, DelegationAllowList = new List<string> { "dlg-orchestrator" }, DelegationMaxDepth = 1 }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<AgentRevision>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/" + agents[2].Id + "/revisions/2/publish", null, 200, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<AgentRevision>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/" + agents[2].Id + "/revisions", new AgentRevision { Description = "Writer, draft.", DelegationMode = DelegationModeEnum.AllowList, DelegationAllowList = new List<string> { "dlg-researcher" }, DelegationMaxDepth = 1 }, 201, token).ConfigureAwait(false);
                AppDelegationPlan drift = await HttpTestHelpers.SendAsync<AppDelegationPlan>(host.AdminClient, HttpMethod.Post, apps + "/dlg/delegation", null, 200, token).ConfigureAwait(false);
                AppDelegationMember drifted = drift.Members.Single(m => m.AgentName == "dlg-writer");
                Assert.True(drifted.Drift && drifted.SkippedReason == "DraftConflict" && drifted.DraftRevisionNumber == null, "Drift reported; the conflicting draft is left alone: " + Serializer.Serialize(drifted));
                AgentRevision draft = await HttpTestHelpers.SendAsync<AgentRevision>(host.AdminClient, HttpMethod.Get, T(host) + "/agents/" + agents[2].Id + "/revisions/3", null, 200, token).ConfigureAwait(false);
                Assert.True(draft.DelegationAllowList.SequenceEqual(new[] { "dlg-researcher" }), "The manual draft is unchanged");
            }
        }

        private static async Task<Deployment> DeploymentAsync(TestServerHost host, Agent agent, string environment, CancellationToken token)
        {
            return await host.Server.Context.Database.Deployments.CreateAsync(new Deployment { TenantId = host.TenantId, Name = agent.Name + "-" + environment, AgentId = agent.Id, HarnessProfileId = "hrn_builtin_fake", Environment = environment }, token).ConfigureAwait(false);
        }

        private static async Task PromotionAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                List<Agent> agents = await AgentsAsync(host, "pro", token).ConfigureAwait(false);
                List<Deployment> staging = new List<Deployment>();
                foreach (Agent agent in agents)
                {
                    await DeploymentAsync(host, agent, "dev", token).ConfigureAwait(false);
                    staging.Add(await DeploymentAsync(host, agent, "staging", token).ConfigureAwait(false));
                }
                string apps = T(host) + "/apps";
                await HttpTestHelpers.SendAsync<AgenticApp>(host.AdminClient, HttpMethod.Post, apps, App("pro", agents), 201, token).ConfigureAwait(false);
                AppRevision revision = await HttpTestHelpers.SendAsync<AppRevision>(host.AdminClient, HttpMethod.Post, apps + "/pro/revisions", new AppRevisionRequest { ChangeNote = "First" }, 201, token).ConfigureAwait(false);
                Assert.True(revision.Number == 1 && revision.State == AgentRevisionStateEnum.Draft && revision.Members.Count == 3 && revision.Members.All(m => m.AgentRevisionNumber == 1), "Revision 1 pins every member's revision 1");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, apps + "/pro/promote", new AppPromotionRequest { SourceEnvironment = "dev" }, token).ConfigureAwait(false), 409, "NoPublishedRevision", "Nothing published yet");
                AppRevision published = await HttpTestHelpers.SendAsync<AppRevision>(host.AdminClient, HttpMethod.Post, apps + "/pro/revisions/1/publish", null, 200, token).ConfigureAwait(false);
                Assert.Equal(AgentRevisionStateEnum.Published, published.State, "Published");

                PromotionRecord record = await HttpTestHelpers.SendAsync<PromotionRecord>(host.AdminClient, HttpMethod.Post, apps + "/pro/promote", new AppPromotionRequest { SourceEnvironment = "dev" }, 201, token).ConfigureAwait(false);
                Assert.True(record.AppId != null && record.TargetEnvironment == "staging" && record.Items.Count == 3, "One record with all three members");
                foreach (Deployment deployment in staging)
                {
                    Deployment after = Assert.NotNull(await host.Server.Context.Database.Deployments.ReadAsync(host.TenantId, deployment.Id, token).ConfigureAwait(false), "Deployment");
                    Assert.True(!String.IsNullOrEmpty(after.AgentRevisionId), "Every staging deployment is pinned");
                }
                await HttpTestHelpers.SendAsync<PromotionRecord>(host.AdminClient, HttpMethod.Post, T(host) + "/promotions/" + record.Id + "/rollback", new PromotionRollbackRequest(), 201, token).ConfigureAwait(false);
                foreach (Deployment deployment in staging)
                {
                    Deployment after = Assert.NotNull(await host.Server.Context.Database.Deployments.ReadAsync(host.TenantId, deployment.Id, token).ConfigureAwait(false), "Deployment");
                    Assert.True(String.IsNullOrEmpty(after.AgentRevisionId), "Rollback restores every pin together");
                }

                await host.Server.Context.Database.Deployments.DeleteAsync(staging[2].Id, token).ConfigureAwait(false);
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, apps + "/pro/promote", new AppPromotionRequest { SourceEnvironment = "dev" }, token).ConfigureAwait(false), 409, "NoTargetDeployments", "A member without a target deployment");
                foreach (Deployment deployment in staging.Take(2))
                {
                    Deployment after = Assert.NotNull(await host.Server.Context.Database.Deployments.ReadAsync(host.TenantId, deployment.Id, token).ConfigureAwait(false), "Deployment");
                    Assert.True(String.IsNullOrEmpty(after.AgentRevisionId), "No member was promoted");
                }
            }
        }

        private static async Task<HttpClient> SessionClientAsync(TestServerHost host, string slug, object? body, int expected, CancellationToken token)
        {
            HttpClient anonymous = new HttpClient { BaseAddress = new Uri(host.BaseUrl) };
            using (StringContent content = new StringContent(Serializer.Serialize(body ?? new { }), System.Text.Encoding.UTF8, "application/json"))
            using (HttpResponseMessage response = await anonymous.PostAsync("/v1.0/apps/" + slug + "/session", content, token).ConfigureAwait(false))
            {
                string text = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                Assert.Equal(expected, (int)response.StatusCode, "Session status: " + text);
                if (expected != 201) return anonymous;
                AppSessionResponse session = Assert.NotNull(Serializer.Deserialize<AppSessionResponse>(text), "Session");
                Assert.True(session.Token.StartsWith("gas_", StringComparison.Ordinal), "App session token prefix");
                anonymous.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", session.Token);
                return anonymous;
            }
        }

        private static async Task SessionsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                List<Agent> agents = await AgentsAsync(host, "ses", token).ConfigureAwait(false);
                await DeploymentAsync(host, agents[0], "dev", token).ConfigureAwait(false);
                AgenticApp app = await HttpTestHelpers.SendAsync<AgenticApp>(host.AdminClient, HttpMethod.Post, T(host) + "/apps", App("ses", agents), 201, token).ConfigureAwait(false);
                foreach (string email in new[] { "app-alice@example.com", "app-bob@example.com" })
                {
                    await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, T(host) + "/users", new UserRequest { Email = email, Password = "password123" }, 201, token).ConfigureAwait(false);
                }
                List<User> users = (await host.Server.Context.Database.Users.EnumerateAsync(host.TenantId, new EnumerationQuery { MaxResults = 1000 }, token).ConfigureAwait(false)).Objects;
                User alice = users.Single(u => u.Email == "app-alice@example.com");
                User bob = users.Single(u => u.Email == "app-bob@example.com");

                using (HttpClient info = new HttpClient { BaseAddress = new Uri(host.BaseUrl) })
                {
                    AppInfo described = Assert.NotNull(Serializer.Deserialize<AppInfo>(await info.GetStringAsync("/v1.0/apps/ses", token).ConfigureAwait(false)), "Info");
                    Assert.True(described.AuthMode == AppAuthModeEnum.AppUsers && !described.AnonymousAllowed, "Default: app users, no anonymous");
                }
                (await SessionClientAsync(host, "ses", null, 401, token).ConfigureAwait(false)).Dispose();
                (await SessionClientAsync(host, "ses", new { email = "app-alice@example.com", password = "wrong" }, 401, token).ConfigureAwait(false)).Dispose();
                (await SessionClientAsync(host, "ses", new { email = "app-alice@example.com", password = "password123" }, 403, token).ConfigureAwait(false)).Dispose();
                foreach (User user in new[] { alice, bob })
                {
                    await HttpTestHelpers.SendAsync<UserRoleAssignment>(host.AdminClient, HttpMethod.Post, T(host) + "/user-role-assignments", new AssignmentRequest { UserId = user.Id, RoleName = BuiltInRoles.AppUser, ResourceScope = ResourceScopeEnum.Resource, ResourceId = app.Id }, 201, token).ConfigureAwait(false);
                }
                using (HttpClient aliceClient = await SessionClientAsync(host, "ses", new { email = "app-alice@example.com", password = "password123" }, 201, token).ConfigureAwait(false))
                using (HttpClient bobClient = await SessionClientAsync(host, "ses", new { email = "app-bob@example.com", password = "password123" }, 201, token).ConfigureAwait(false))
                {
                    Assert.Equal(401, (int)(await aliceClient.GetAsync(T(host) + "/agents", token).ConfigureAwait(false)).StatusCode, "An app session cannot call the management API");
                    using (StringContent content = new StringContent("{\"message\":\"Hello\"}", System.Text.Encoding.UTF8, "application/json"))
                    using (HttpResponseMessage started = await aliceClient.PostAsync("/v1.0/apps/ses/conversations", content, token).ConfigureAwait(false))
                    {
                        string body = await started.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                        Assert.Equal(201, (int)started.StatusCode, "Alice starts a conversation: " + body);
                        string conversationId = Assert.NotNull(Serializer.Deserialize<Dictionary<string, object>>(body)?["conversationId"]?.ToString(), "Conversation id");
                        Assert.Equal(404, (int)(await bobClient.GetAsync("/v1.0/apps/ses/conversations/" + conversationId, token).ConfigureAwait(false)).StatusCode, "Bob cannot read Alice's conversation");
                        Assert.Equal(404, (int)(await bobClient.DeleteAsync("/v1.0/apps/ses/conversations/" + conversationId, token).ConfigureAwait(false)).StatusCode, "Bob cannot delete Alice's conversation");
                        using (StringContent rename = new StringContent("{\"title\":\"Mine now\"}", System.Text.Encoding.UTF8, "application/json"))
                        {
                            Assert.Equal(404, (int)(await bobClient.PutAsync("/v1.0/apps/ses/conversations/" + conversationId, rename, token).ConfigureAwait(false)).StatusCode, "Bob cannot rename Alice's conversation");
                        }
                        Assert.Equal(200, (int)(await aliceClient.GetAsync("/v1.0/apps/ses/conversations/" + conversationId, token).ConfigureAwait(false)).StatusCode, "Alice reads her own");
                        string bobsList = await bobClient.GetStringAsync("/v1.0/apps/ses/conversations", token).ConfigureAwait(false);
                        Assert.True(!bobsList.Contains(conversationId, StringComparison.Ordinal), "Bob's list has none of Alice's conversations");
                    }
                    string aliceToken = aliceClient.DefaultRequestHeaders.Authorization!.Parameter!;
                    AppSession stored = Assert.NotNull(await host.Server.Context.Database.Apps.ReadSessionByHashAsync(Convert.ToHexString(SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(aliceToken))).ToLowerInvariant(), token).ConfigureAwait(false), "Stored session");
                    await host.Server.Context.Database.Apps.RevokeSessionAsync(stored.Id, token).ConfigureAwait(false);
                    Assert.Equal(401, (int)(await aliceClient.GetAsync("/v1.0/apps/ses/conversations", token).ConfigureAwait(false)).StatusCode, "An ended session stops working");
                }

                app.AuthMode = AppAuthModeEnum.Anonymous;
                await HttpTestHelpers.SendAsync<AgenticApp>(host.AdminClient, HttpMethod.Put, T(host) + "/apps/ses", app, 200, token).ConfigureAwait(false);
                (await SessionClientAsync(host, "ses", null, 401, token).ConfigureAwait(false)).Dispose();
                app.AnonymousEnabled = true;
                await HttpTestHelpers.SendAsync<AgenticApp>(host.AdminClient, HttpMethod.Put, T(host) + "/apps/ses", app, 200, token).ConfigureAwait(false);
                using (HttpClient visitor = await SessionClientAsync(host, "ses", null, 201, token).ConfigureAwait(false))
                {
                    Assert.Equal(200, (int)(await visitor.GetAsync("/v1.0/apps/ses/conversations", token).ConfigureAwait(false)).StatusCode, "Anonymous session works once enabled");
                    Assert.Equal(401, (int)(await visitor.GetAsync(T(host) + "/runs", token).ConfigureAwait(false)).StatusCode, "Anonymous sessions cannot call the management API");
                }
            }
        }

        private static async Task GatewayAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                Agent entry = await cluster.CreateAgentAsync("gw-entry", "builtin/fake", null, token, d =>
                {
                    d.ArgumentOverrides.Add(new DeploymentArgumentOverride { Position = 0, Operation = ArgumentOverrideOperationEnum.Append, Template = "--output-last-message" });
                    d.ArgumentOverrides.Add(new DeploymentArgumentOverride { Position = 1, Operation = ArgumentOverrideOperationEnum.Append, Template = "files/answer.txt" });
                }).ConfigureAwait(false);
                AgenticApp app = new AgenticApp
                {
                    Name = "gateway", EntryAgentId = entry.Id, Members = new List<AgenticAppMember> { new AgenticAppMember { AgentId = entry.Id } },
                    AuthMode = AppAuthModeEnum.Anonymous, AnonymousEnabled = true, WelcomeText = "Ask me anything."
                };
                await HttpTestHelpers.SendAsync<AgenticApp>(host.AdminClient, HttpMethod.Post, T(host) + "/apps", app, 201, token).ConfigureAwait(false);
                using (HttpClient client = await SessionClientAsync(host, "gateway", null, 201, token).ConfigureAwait(false))
                {
                    string conversationId;
                    using (StringContent content = new StringContent("{\"message\":\"First question\"}", System.Text.Encoding.UTF8, "application/json"))
                    using (HttpResponseMessage started = await client.PostAsync("/v1.0/apps/gateway/conversations", content, token).ConfigureAwait(false))
                    {
                        string body = await started.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                        Assert.Equal(201, (int)started.StatusCode, "Start: " + body);
                        conversationId = Assert.NotNull(Serializer.Deserialize<Dictionary<string, object>>(body)?["conversationId"]?.ToString(), "Conversation id");
                    }
                    AppConversationView first = await WaitIdleAsync(client, conversationId, 1, token).ConfigureAwait(false);
                    string stream = await client.GetStringAsync("/v1.0/apps/gateway/conversations/" + conversationId + "/turns/" + first.Turns[0].RunId + "/stream", token).ConfigureAwait(false);
                    Assert.True(stream.Contains("turn.event", StringComparison.Ordinal) && stream.Contains("turn.completed", StringComparison.Ordinal) && stream.Contains("First question", StringComparison.Ordinal), "The stream carries the answer: " + stream);
                    Assert.True(!stream.Contains("\"eventType\":\"Stderr\"", StringComparison.Ordinal), "No process output for end users");

                    using (StringContent content = new StringContent("{\"message\":\"Second question\"}", System.Text.Encoding.UTF8, "application/json"))
                    using (HttpResponseMessage next = await client.PostAsync("/v1.0/apps/gateway/conversations/" + conversationId + "/messages", content, token).ConfigureAwait(false))
                    {
                        Assert.Equal(201, (int)next.StatusCode, "Second turn: " + await next.Content.ReadAsStringAsync(token).ConfigureAwait(false));
                    }
                    AppConversationView second = await WaitIdleAsync(client, conversationId, 2, token).ConfigureAwait(false);
                    Assert.True(second.Turns.Count == 2 && second.Turns.All(t => t.Status == RunStatusEnum.Succeeded) && (second.Turns[1].Answer ?? String.Empty).Contains("Second question", StringComparison.Ordinal), "Two turns answered");

                    FileSpaceListing files = Assert.NotNull(Serializer.Deserialize<FileSpaceListing>(await client.GetStringAsync("/v1.0/apps/gateway/conversations/" + conversationId + "/files", token).ConfigureAwait(false)), "Files");
                    ConversationFile answer = Assert.NotNull(files.Files.FirstOrDefault(f => f.Path == "answer.txt"), "The agent's file is listed");
                    byte[] bytes = await client.GetByteArrayAsync("/v1.0/apps/gateway/conversations/" + conversationId + "/files/content?path=answer.txt", token).ConfigureAwait(false);
                    Assert.Equal(answer.Sha256, Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant(), "Downloaded bytes match the SHA-256");

                    // Rename and delete from the app UI.
                    using (StringContent rename = new StringContent("{\"title\":\"Tide research\\nsecond line\"}", System.Text.Encoding.UTF8, "application/json"))
                    using (HttpResponseMessage renamed = await client.PutAsync("/v1.0/apps/gateway/conversations/" + conversationId, rename, token).ConfigureAwait(false))
                    {
                        string body = await renamed.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                        Assert.Equal(200, (int)renamed.StatusCode, "Rename: " + body);
                        Assert.Equal("Tide research", Assert.NotNull(Serializer.Deserialize<AppConversationView>(body), "Renamed").Title ?? String.Empty, "The title is the first line");
                    }
                    Assert.True((await client.GetStringAsync("/v1.0/apps/gateway/conversations", token).ConfigureAwait(false)).Contains("Tide research", StringComparison.Ordinal), "The list shows the new title");
                    using (StringContent blank = new StringContent("{\"title\":\"  \"}", System.Text.Encoding.UTF8, "application/json"))
                    using (HttpResponseMessage refused = await client.PutAsync("/v1.0/apps/gateway/conversations/" + conversationId, blank, token).ConfigureAwait(false))
                    {
                        Assert.Equal(400, (int)refused.StatusCode, "A blank title is refused");
                    }
                    // A finished conversation is not busy, so it can be deleted; stopping it changes nothing.
                    List<AppConversationView> listed = Assert.NotNull(Serializer.Deserialize<List<AppConversationView>>(await client.GetStringAsync("/v1.0/apps/gateway/conversations", token).ConfigureAwait(false)), "List");
                    Assert.True(listed.Single(c => c.Id == conversationId).Busy == false, "A conversation whose turns finished is not busy in the list");
                    using (HttpResponseMessage idleStop = await client.PostAsync("/v1.0/apps/gateway/conversations/" + conversationId + "/stop", null, token).ConfigureAwait(false))
                    {
                        string body = await idleStop.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                        Assert.Equal(200, (int)idleStop.StatusCode, "Stop when idle: " + body);
                        Assert.True(Assert.NotNull(Serializer.Deserialize<AppConversationView>(body), "Idle stop").Turns.All(t => t.Status == RunStatusEnum.Succeeded), "Stopping an idle conversation changes no turn");
                    }

                    // A turn that never finishes keeps the conversation busy until it is stopped.
                    Conversation stored = Assert.NotNull(await host.Server.Context.Database.Conversations.ReadAsync(host.TenantId, conversationId, token).ConfigureAwait(false), "Stored conversation");
                    Run answered = Assert.NotNull(await host.Server.Context.Database.Runs.ReadAsync(host.TenantId, second.Turns[1].RunId, token).ConfigureAwait(false), "Second turn run");
                    Run hung = new Run { TenantId = host.TenantId, AgentId = entry.Id, AgentName = entry.Name, DeploymentId = answered.DeploymentId, ConversationId = conversationId, ConversationTurn = 3, InputText = "Third question", Status = RunStatusEnum.Suspended, CallerType = PrincipalTypeEnum.User };
                    await host.Server.Context.Database.Runs.CreateAsync(hung, token).ConfigureAwait(false);
                    stored.ActiveRunId = hung.Id;
                    await host.Server.Context.Database.Conversations.UpdateAsync(stored, token).ConfigureAwait(false);
                    listed = Assert.NotNull(Serializer.Deserialize<List<AppConversationView>>(await client.GetStringAsync("/v1.0/apps/gateway/conversations", token).ConfigureAwait(false)), "List while busy");
                    Assert.True(listed.Single(c => c.Id == conversationId).Busy, "An unfinished turn makes the conversation busy");
                    Assert.Equal(409, (int)(await client.DeleteAsync("/v1.0/apps/gateway/conversations/" + conversationId, token).ConfigureAwait(false)).StatusCode, "A busy conversation cannot be deleted");
                    using (HttpResponseMessage stopped = await client.PostAsync("/v1.0/apps/gateway/conversations/" + conversationId + "/stop", null, token).ConfigureAwait(false))
                    {
                        string body = await stopped.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                        Assert.Equal(200, (int)stopped.StatusCode, "Stop: " + body);
                        AppConversationView after = Assert.NotNull(Serializer.Deserialize<AppConversationView>(body), "Stopped");
                        Assert.Equal(RunStatusEnum.Cancelled, after.Turns.Single(t => t.RunId == hung.Id).Status, "Stop cancels the running turn");
                        Assert.True(!after.Busy, "The stopped conversation is idle");
                    }

                    using (HttpResponseMessage deleted = await client.DeleteAsync("/v1.0/apps/gateway/conversations/" + conversationId, token).ConfigureAwait(false))
                    {
                        Assert.Equal(204, (int)deleted.StatusCode, "Delete: " + await deleted.Content.ReadAsStringAsync(token).ConfigureAwait(false));
                    }
                    Assert.Equal(404, (int)(await client.GetAsync("/v1.0/apps/gateway/conversations/" + conversationId, token).ConfigureAwait(false)).StatusCode, "A deleted conversation is gone");
                }
            }
        }

        private static async Task<ManifestApply> ApplyAsync(TestServerHost host, string yaml, CancellationToken token)
        {
            using (StringContent content = new StringContent(yaml, System.Text.Encoding.UTF8, "application/yaml"))
            using (HttpResponseMessage response = await host.AdminClient.PostAsync(T(host) + "/manifests/apply", content, token).ConfigureAwait(false))
            {
                string body = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                Assert.Equal(200, (int)response.StatusCode, "Apply: " + body);
                return Assert.NotNull(Serializer.Deserialize<ManifestApply>(body), "Apply result");
            }
        }

        private static async Task ManifestAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                string yaml = String.Join("\n", new[]
                {
                    "apiVersion: garrison/v1", "kind: Agent", "metadata: { name: mf-orchestrator }", "spec: { description: Plans the work }", "---",
                    "apiVersion: garrison/v1", "kind: Agent", "metadata: { name: mf-researcher }", "spec: { description: Finds sources }", "---",
                    "apiVersion: garrison/v1", "kind: Deployment", "metadata: { name: mf-orchestrator-dev }", "spec: { agent: mf-orchestrator, harnessProfile: builtin/fake }", "---",
                    "apiVersion: garrison/v1", "kind: AgenticApp", "metadata: { name: mf-research, description: Research overviews }",
                    "spec:",
                    "  entry: mf-orchestrator",
                    "  members: [ { agent: mf-orchestrator, role: Talks to people }, { agent: mf-researcher } ]",
                    "  edges: [ { from: mf-orchestrator, to: mf-researcher } ]",
                    "  environments: [ { environment: dev, deployment: mf-orchestrator-dev } ]",
                    "  authMode: Anonymous",
                    "  anonymousEnabled: true",
                    "  branding: { displayName: 'Research Desk (Beta & Co.)', primaryColor: '#1F6FEB', welcomeText: Ask for an overview., backgroundColor: '#0B1220', headerColor: '#FFFFFF', agentBubbleColor: '#FEF3C7', conversationListColor: '#1E293B', composerColor: '#F1F5F9', filesColor: '#E2E8F0', font: Serif }",
                    ""
                });
                ManifestApply first = await ApplyAsync(host, yaml, token).ConfigureAwait(false);
                Assert.True(first.FailedCount == 0 && first.CreatedCount == first.DocumentCount, "The bundle applies: " + Serializer.Serialize(first.Items.Select(i => i.Kind + "/" + i.Name + " " + i.Result + " " + i.Message)));
                ManifestApply second = await ApplyAsync(host, yaml, token).ConfigureAwait(false);
                Assert.Equal(second.DocumentCount, second.UnchangedCount, "Re-apply is unchanged: " + Serializer.Serialize(second.Items.Where(i => i.Result != ManifestApplyResultEnum.Unchanged)));
                AgenticApp app = await HttpTestHelpers.SendAsync<AgenticApp>(host.AdminClient, HttpMethod.Get, T(host) + "/apps/mf-research", null, 200, token).ConfigureAwait(false);
                Assert.True(app.DisplayName == "Research Desk (Beta & Co.)" && app.Members.Count == 2 && app.Edges.Count == 1 && app.Environments.Count == 1, "Applied app");
                Assert.True(app.BackgroundColor == "#0B1220" && app.HeaderColor == "#FFFFFF" && app.AgentBubbleColor == "#FEF3C7" && app.FontFamily == AppFontEnum.Serif, "Branding colors and typeface applied");
                AppInfo info = await HttpTestHelpers.SendAsync<AppInfo>(host.AdminClient, HttpMethod.Get, "/v1.0/apps/" + app.Slug, null, 200, token).ConfigureAwait(false);
                Assert.True(info.DisplayName == "Research Desk (Beta & Co.)" && info.BackgroundColor == "#0B1220" && info.HeaderColor == "#FFFFFF" && info.AgentBubbleColor == "#FEF3C7" && info.ConversationListColor == "#1E293B" && info.ComposerColor == "#F1F5F9" && info.FilesColor == "#E2E8F0" && info.FontFamily == AppFontEnum.Serif && info.FaviconUrl == null, "The app UI receives the branding: " + Serializer.Serialize(info));
                Run timed = new Run { Id = "run_t", Status = RunStatusEnum.Succeeded, ResultText = "Done.", ServedModel = "fake-model", TimeToFirstTokenMs = 40, StreamingMs = 120, TotalMs = 300, InputTokens = 12, OutputTokens = 7, CachedTokens = 3, ReasoningTokens = 2, ToolCallCount = 1, CostUsd = 0.001 };
                AppTurnView withDetail = Garrison.Server.Services.AppGatewayService.Turn(timed, true);
                Assert.True(withDetail.Telemetry != null && withDetail.Telemetry.ServedModel == "fake-model" && withDetail.Telemetry.TimeToFirstTokenMs == 40 && withDetail.Telemetry.CachedTokens == 3 && withDetail.Telemetry.ToolCallCount == 1, "A turn carries its telemetry when the app shows operator detail");
                Assert.True(Garrison.Server.Services.AppGatewayService.Turn(timed, false).Telemetry == null, "and none otherwise");
                AgenticApp badColor = Serializer.Deserialize<AgenticApp>(Serializer.Serialize(app))!;
                badColor.HeaderColor = "blue";
                TestResponse refused = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Put, T(host) + "/apps/" + app.Id, badColor, token).ConfigureAwait(false);
                Assert.True(refused.StatusCode == 400 && refused.Body.Contains("headerColor", StringComparison.Ordinal) && refused.Body.Contains("InvalidColor", StringComparison.Ordinal), "A color that is not #RRGGBB is refused: " + refused.Body);

                using (HttpResponseMessage exported = await host.AdminClient.GetAsync(T(host) + "/manifests/export?resources=AgenticApp/mf-research&followReferences=true", token).ConfigureAwait(false))
                {
                    string export = await exported.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                    Assert.Equal(200, (int)exported.StatusCode, "Export: " + export);
                    Assert.True(export.Contains("kind: AgenticApp", StringComparison.Ordinal) && export.Contains("mf-researcher", StringComparison.Ordinal) && export.Contains("kind: Deployment", StringComparison.Ordinal), "Export carries the app and what it needs: " + export);
                    ManifestApply again = await ApplyAsync(host, export, token).ConfigureAwait(false);
                    Assert.True(again.FailedCount == 0 && again.CreatedCount == 0 && again.UpdatedCount == 0, "The export re-applies unchanged: " + Serializer.Serialize(again.Items.Where(i => i.Result != ManifestApplyResultEnum.Unchanged).Select(i => i.Kind + "/" + i.Name + " " + i.Result + " " + Serializer.Serialize(i.Changes))));
                }

                using (TestMcpClient user = new TestMcpClient())
                {
                    await user.ConnectAsync(host, null, token).ConfigureAwait(false);
                    string listed = await user.CallAsync("garrison_list_apps", new { }, token).ConfigureAwait(false);
                    Assert.True(listed.Contains("mf-research", StringComparison.Ordinal), "Listed over MCP");
                    AgenticApp created = await user.CallAsync<AgenticApp>("garrison_create_app", new { configuration = new { name = "mf-solo", entryAgentId = "mf-researcher", members = new[] { new { agentId = "mf-researcher" } } } }, token).ConfigureAwait(false);
                    Assert.True(created.Id.StartsWith("app_", StringComparison.Ordinal), "Created over MCP");
                    AgenticApp read = await user.CallAsync<AgenticApp>("garrison_get_app", new { app = "mf-solo" }, token).ConfigureAwait(false);
                    Assert.Equal(created.Id, read.Id, "Read over MCP");
                    AgenticApp updated = await user.CallAsync<AgenticApp>("garrison_update_app", new { app = "mf-solo", configuration = new { name = "mf-solo", entryAgentId = "mf-researcher", description = "Solo", members = new[] { new { agentId = "mf-researcher" } } } }, token).ConfigureAwait(false);
                    Assert.Equal("Solo", updated.Description ?? String.Empty, "Updated over MCP");
                    await user.ExpectErrorAsync("garrison_create_app", new { configuration = new { name = "mf-bad", entryAgentId = "missing", members = new[] { new { agentId = "mf-researcher" } } } }, "ValidationFailed", token).ConfigureAwait(false);
                }
            }
        }

        private static async Task AppearanceDataAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                AgenticApp app = new AgenticApp
                {
                    TenantId = "ten_look", Name = "look", Slug = "look-" + Guid.NewGuid().ToString("N").Substring(0, 8), EntryAgentId = "agt_look",
                    Members = new List<AgenticAppMember> { new AgenticAppMember { AgentId = "agt_look" } },
                    Subtitle = "Answers in minutes", WelcomeTitle = "Hello", ComposerPlaceholder = "Ask anything", AgentDisplayName = "Desk", AgentAvatarAssetId = "ast_avatar",
                    PaletteId = "harbor", DarkPrimaryColor = "#0af", DarkAccentColor = "#112233", DarkBackgroundColor = "#000", DarkHeaderColor = "#111", DarkAgentBubbleColor = "#222",
                    DarkConversationListColor = "#333", DarkComposerColor = "#444", DarkFilesColor = "#555", ThemeDefault = AppThemeDefaultEnum.Dark, AllowThemeSwitch = false,
                    CornerStyle = AppCornerStyleEnum.Pill, Density = AppDensityEnum.Compact, ShowFilesPanel = false, ShowLanguagePicker = false, ShowPoweredBy = false,
                    StarterPrompts = new List<string> { "First", "Second", "Third" }
                };
                await db.Apps.CreateAsync(app, token).ConfigureAwait(false);
                AgenticApp read = Assert.NotNull(await db.Apps.ReadAsync("ten_look", app.Id, token).ConfigureAwait(false), "App read back");
                Assert.True(read.Subtitle == "Answers in minutes" && read.WelcomeTitle == "Hello" && read.ComposerPlaceholder == "Ask anything" && read.AgentDisplayName == "Desk" && read.AgentAvatarAssetId == "ast_avatar" && read.PaletteId == "harbor", "Text fields round-trip: " + Serializer.Serialize(read));
                Assert.True(read.DarkPrimaryColor == "#0af" && read.DarkAccentColor == "#112233" && read.DarkBackgroundColor == "#000" && read.DarkHeaderColor == "#111" && read.DarkAgentBubbleColor == "#222"
                    && read.DarkConversationListColor == "#333" && read.DarkComposerColor == "#444" && read.DarkFilesColor == "#555", "Dark colors round-trip");
                Assert.True(read.ThemeDefault == AppThemeDefaultEnum.Dark && !read.AllowThemeSwitch && read.CornerStyle == AppCornerStyleEnum.Pill && read.Density == AppDensityEnum.Compact
                    && !read.ShowFilesPanel && !read.ShowLanguagePicker && !read.ShowPoweredBy, "Theme, corners, density, and toggles round-trip");
                Assert.True(read.StarterPrompts.SequenceEqual(new[] { "First", "Second", "Third" }), "Starter prompts keep their order: " + String.Join(", ", read.StarterPrompts));

                read.StarterPrompts = new List<string> { "Only" };
                await db.Apps.UpdateAsync(read, token).ConfigureAwait(false);
                AgenticApp updated = Assert.NotNull(await db.Apps.ReadAsync("ten_look", app.Id, token).ConfigureAwait(false), "Updated app");
                Assert.True(updated.StarterPrompts.Count == 1 && updated.StarterPrompts[0] == "Only", "An update replaces the starter prompts");
                Assert.True(await db.Apps.ReadAsync("ten_other", app.Id, token).ConfigureAwait(false) == null, "Another tenant reads nothing");

                AdoDatabaseDriver ado = (AdoDatabaseDriver)db;
                await db.Tenants.DeleteCascadeAsync("ten_look", token).ConfigureAwait(false);
                object? left = await ado.ScalarAsync("SELECT COUNT(*) FROM " + ado.Table("agentic_app_starter_prompts") + " WHERE appid = @id;", c => AdoDatabaseDriver.Add(c, "id", app.Id), token).ConfigureAwait(false);
                Assert.Equal(0L, Convert.ToInt64(left, System.Globalization.CultureInfo.InvariantCulture), "Tenant deletion removes the starter prompt rows");
            }
        }

        private static async Task AppearanceValidationAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                List<Agent> agents = await AgentsAsync(host, "look", token).ConfigureAwait(false);
                string apps = T(host) + "/apps";
                AgenticApp plain = await HttpTestHelpers.SendAsync<AgenticApp>(host.AdminClient, HttpMethod.Post, apps, App("look-plain", agents), 201, token).ConfigureAwait(false);
                Assert.True(plain.ThemeDefault == AppThemeDefaultEnum.System && plain.AllowThemeSwitch && plain.CornerStyle == AppCornerStyleEnum.Rounded && plain.Density == AppDensityEnum.Comfortable
                    && plain.ShowFilesPanel && plain.ShowLanguagePicker && plain.ShowPoweredBy && plain.StarterPrompts.Count == 0 && plain.Subtitle == null && plain.DarkPrimaryColor == null, "Defaults: " + Serializer.Serialize(plain));

                AgenticApp styled = App("look-styled", agents);
                styled.Subtitle = "  Answers in minutes  ";
                styled.PaletteId = "custom";
                styled.PrimaryColor = "#1f6";
                styled.DarkPrimaryColor = "#7AB8FF";
                styled.ThemeDefault = AppThemeDefaultEnum.Light;
                styled.CornerStyle = AppCornerStyleEnum.Sharp;
                styled.StarterPrompts = new List<string> { "Summarize the news", " Plan my week " };
                AgenticApp created = await HttpTestHelpers.SendAsync<AgenticApp>(host.AdminClient, HttpMethod.Post, apps, styled, 201, token).ConfigureAwait(false);
                Assert.True(created.Subtitle == "Answers in minutes" && created.PaletteId == "custom" && created.PrimaryColor == "#1f6" && created.DarkPrimaryColor == "#7AB8FF"
                    && created.ThemeDefault == AppThemeDefaultEnum.Light && created.CornerStyle == AppCornerStyleEnum.Sharp, "Appearance stored, trimmed, and #rgb accepted: " + Serializer.Serialize(created));
                Assert.True(created.StarterPrompts.SequenceEqual(new[] { "Summarize the news", "Plan my week" }), "Starter prompts stored in order and trimmed");

                async Task Refused(Action<AgenticApp> change, string field, string code)
                {
                    AgenticApp bad = Serializer.Deserialize<AgenticApp>(Serializer.Serialize(created))!;
                    change(bad);
                    TestResponse response = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Put, apps + "/" + created.Id, bad, token).ConfigureAwait(false);
                    Assert.True(response.StatusCode == 400 && response.Body.Contains("\"" + field + "\"", StringComparison.Ordinal) && response.Body.Contains(code, StringComparison.Ordinal), field + " is refused with " + code + ": " + response.Body);
                }
                await Refused(a => a.DarkHeaderColor = "navy", "darkHeaderColor", "InvalidColor").ConfigureAwait(false);
                await Refused(a => a.DarkFilesColor = "#12345", "darkFilesColor", "InvalidColor").ConfigureAwait(false);
                await Refused(a => a.Subtitle = new string('s', 201), "subtitle", "TooLong").ConfigureAwait(false);
                await Refused(a => a.WelcomeTitle = new string('w', 121), "welcomeTitle", "TooLong").ConfigureAwait(false);
                await Refused(a => a.ComposerPlaceholder = new string('c', 121), "composerPlaceholder", "TooLong").ConfigureAwait(false);
                await Refused(a => a.AgentDisplayName = new string('a', 81), "agentDisplayName", "TooLong").ConfigureAwait(false);
                await Refused(a => a.PaletteId = new string('p', 65), "paletteId", "TooLong").ConfigureAwait(false);
                await Refused(a => a.StarterPrompts = new List<string> { "1", "2", "3", "4", "5" }, "starterPrompts", "TooMany").ConfigureAwait(false);
                await Refused(a => a.StarterPrompts = new List<string> { "ok", "   " }, "starterPrompts[1]", "Required").ConfigureAwait(false);
                await Refused(a => a.StarterPrompts = new List<string> { new string('x', 201) }, "starterPrompts[0]", "TooLong").ConfigureAwait(false);

                Tenant other = await HttpTestHelpers.SendAsync<Tenant>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants", new TenantRequest { Name = "Look Other" }, 201, token).ConfigureAwait(false);
                AgentAsset foreign = await host.Server.Context.Database.AgentAssets.CreateAsync(new AgentAsset { TenantId = other.Id, Name = "foreign-avatar" }, token).ConfigureAwait(false);
                await Refused(a => a.AgentAvatarAssetId = foreign.Id, "agentAvatarAssetId", "UnknownAsset").ConfigureAwait(false);
            }
        }

        private static async Task AppearanceSurfacesAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                string assets = T(host) + "/agent-assets";
                AgentAsset avatar = await HttpTestHelpers.SendAsync<AgentAsset>(host.AdminClient, HttpMethod.Post, assets, new AgentAsset { Name = "desk-avatar", Kind = AgentAssetKindEnum.ReferenceFile }, 201, token).ConfigureAwait(false);
                byte[] png = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D };
                AgentAssetVersionUpload upload = new AgentAssetVersionUpload();
                upload.Files.Add(new AgentAssetFile { Path = "avatar.png", ContentBase64 = Convert.ToBase64String(png) });
                await HttpTestHelpers.SendAsync<AgentAssetVersion>(host.AdminClient, HttpMethod.Post, assets + "/" + avatar.Id + "/versions", upload, 201, token).ConfigureAwait(false);

                string yaml = String.Join("\n", new[]
                {
                    "apiVersion: garrison/v1", "kind: Agent", "metadata: { name: look-desk }", "spec: { description: Answers questions }", "---",
                    "apiVersion: garrison/v1", "kind: AgenticApp", "metadata: { name: look-desk-app }",
                    "spec:",
                    "  entry: look-desk",
                    "  members: [ { agent: look-desk } ]",
                    "  authMode: Anonymous",
                    "  anonymousEnabled: true",
                    "  branding:",
                    "    displayName: Look Desk",
                    "    subtitle: Answers in minutes",
                    "    welcomeTitle: How can we help?",
                    "    composerPlaceholder: Ask a question",
                    "    agentAvatar: desk-avatar",
                    "    paletteId: harbor",
                    "    primaryColor: '#1F6FEB'",
                    "    darkPrimaryColor: '#58A6FF'",
                    "    darkAccentColor: '#fa0'",
                    "    darkBackgroundColor: '#0D1117'",
                    "    darkHeaderColor: '#161B22'",
                    "    darkAgentBubbleColor: '#21262D'",
                    "    darkConversationListColor: '#161B22'",
                    "    darkComposerColor: '#0D1117'",
                    "    darkFilesColor: '#161B22'",
                    "    themeDefault: Dark",
                    "    allowThemeSwitch: false",
                    "    cornerStyle: Pill",
                    "    density: Compact",
                    "    showFilesPanel: false",
                    "    showLanguagePicker: false",
                    "    showPoweredBy: false",
                    "    starterPrompts: [ Summarize my week, Draft a reply ]",
                    ""
                });
                ManifestApply first = await ApplyAsync(host, yaml, token).ConfigureAwait(false);
                Assert.True(first.FailedCount == 0, "The appearance bundle applies: " + Serializer.Serialize(first.Items.Select(i => i.Kind + "/" + i.Name + " " + i.Result + " " + i.Message)));
                AgenticApp app = await HttpTestHelpers.SendAsync<AgenticApp>(host.AdminClient, HttpMethod.Get, T(host) + "/apps/look-desk-app", null, 200, token).ConfigureAwait(false);
                Assert.True(app.AgentAvatarAssetId == avatar.Id && app.PaletteId == "harbor" && app.ThemeDefault == AppThemeDefaultEnum.Dark && !app.AllowThemeSwitch && app.CornerStyle == AppCornerStyleEnum.Pill
                    && app.Density == AppDensityEnum.Compact && !app.ShowFilesPanel && !app.ShowLanguagePicker && !app.ShowPoweredBy && app.StarterPrompts.SequenceEqual(new[] { "Summarize my week", "Draft a reply" }), "Manifest appearance applied: " + Serializer.Serialize(app));

                AppInfo info = await HttpTestHelpers.SendAsync<AppInfo>(host.AdminClient, HttpMethod.Get, "/v1.0/apps/" + app.Slug, null, 200, token).ConfigureAwait(false);
                Assert.True(info.Subtitle == "Answers in minutes" && info.WelcomeTitle == "How can we help?" && info.ComposerPlaceholder == "Ask a question" && info.PaletteId == "harbor"
                    && info.AgentDisplayName == "look-desk" && info.AgentAvatarUrl == "/v1.0/apps/" + app.Slug + "/avatar", "The app config carries the text fields, the entry agent's name, and the avatar path: " + Serializer.Serialize(info));
                Assert.True(info.DarkPrimaryColor == "#58A6FF" && info.DarkAccentColor == "#fa0" && info.DarkBackgroundColor == "#0D1117" && info.DarkHeaderColor == "#161B22" && info.DarkAgentBubbleColor == "#21262D"
                    && info.DarkConversationListColor == "#161B22" && info.DarkComposerColor == "#0D1117" && info.DarkFilesColor == "#161B22", "The app config carries the dark colors");
                Assert.True(info.ThemeDefault == AppThemeDefaultEnum.Dark && !info.AllowThemeSwitch && info.CornerStyle == AppCornerStyleEnum.Pill && info.Density == AppDensityEnum.Compact
                    && !info.ShowFilesPanel && !info.ShowLanguagePicker && !info.ShowPoweredBy && info.StarterPrompts.SequenceEqual(new[] { "Summarize my week", "Draft a reply" }), "The app config carries theme, layout, toggles, and starter prompts");
                using (HttpClient anonymous = new HttpClient { BaseAddress = new Uri(host.BaseUrl) })
                {
                    using (HttpResponseMessage image = await anonymous.GetAsync("/v1.0/apps/" + app.Slug + "/avatar", token).ConfigureAwait(false))
                    {
                        byte[] served = await image.Content.ReadAsByteArrayAsync(token).ConfigureAwait(false);
                        Assert.True((int)image.StatusCode == 200 && image.Content.Headers.ContentType?.MediaType == "image/png" && served.SequenceEqual(png), "The avatar is served without credentials: " + (int)image.StatusCode);
                    }
                }

                using (HttpResponseMessage exported = await host.AdminClient.GetAsync(T(host) + "/manifests/export?resources=AgenticApp/look-desk-app&followReferences=true", token).ConfigureAwait(false))
                {
                    string export = await exported.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                    Assert.Equal(200, (int)exported.StatusCode, "Export: " + export);
                    Assert.True(export.Contains("agentAvatar: desk-avatar", StringComparison.Ordinal) && export.Contains("starterPrompts", StringComparison.Ordinal) && export.Contains("Draft a reply", StringComparison.Ordinal)
                        && export.Contains("darkFilesColor", StringComparison.Ordinal) && export.Contains("cornerStyle: Pill", StringComparison.Ordinal) && export.Contains("showPoweredBy: false", StringComparison.Ordinal) && export.Contains("kind: AgentAsset", StringComparison.Ordinal),
                        "Export carries the appearance keys and the avatar asset: " + export);
                    ManifestApply again = await ApplyAsync(host, export, token).ConfigureAwait(false);
                    Assert.True(again.FailedCount == 0 && again.CreatedCount == 0 && again.UpdatedCount == 0, "The export re-applies unchanged: " + Serializer.Serialize(again.Items.Where(i => i.Result != ManifestApplyResultEnum.Unchanged).Select(i => i.Kind + "/" + i.Name + " " + i.Result + " " + Serializer.Serialize(i.Changes))));
                }

                using (TestMcpClient user = new TestMcpClient())
                {
                    await user.ConnectAsync(host, null, token).ConfigureAwait(false);
                    AgenticApp created = await user.CallAsync<AgenticApp>("garrison_create_app", new { configuration = new { name = "look-mcp", entryAgentId = "look-desk", members = new[] { new { agentId = "look-desk" } }, subtitle = "Over MCP", darkPrimaryColor = "#123", density = "Compact", showPoweredBy = false, starterPrompts = new[] { "Hello" } } }, token).ConfigureAwait(false);
                    Assert.True(created.Subtitle == "Over MCP" && created.DarkPrimaryColor == "#123" && created.Density == AppDensityEnum.Compact && !created.ShowPoweredBy && created.ShowFilesPanel && created.StarterPrompts.Count == 1, "MCP creates an app with appearance: " + Serializer.Serialize(created));
                    await user.ExpectErrorAsync("garrison_create_app", new { configuration = new { name = "look-mcp-bad", entryAgentId = "look-desk", members = new[] { new { agentId = "look-desk" } }, darkHeaderColor = "dark" } }, "ValidationFailed", token).ConfigureAwait(false);
                }
            }
        }

        private static async Task<AppConversationView> WaitIdleAsync(HttpClient client, string conversationId, int turns, CancellationToken token)
        {
            DateTime deadline = DateTime.UtcNow.AddSeconds(60);
            while (true)
            {
                AppConversationView view = Assert.NotNull(Serializer.Deserialize<AppConversationView>(await client.GetStringAsync("/v1.0/apps/gateway/conversations/" + conversationId, token).ConfigureAwait(false)), "Conversation");
                if (view.Turns.Count >= turns && view.Turns.All(t => RunService.IsTerminal(t.Status))) return view;
                if (DateTime.UtcNow > deadline) throw new TestAssertionException("Conversation did not finish turn " + turns + ": " + Serializer.Serialize(view));
                await Task.Delay(250, token).ConfigureAwait(false);
            }
        }

        #endregion
    }
}
