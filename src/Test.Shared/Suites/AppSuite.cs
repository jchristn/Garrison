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
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, T(host) + "/agents/" + agents[2].Id, null, token).ConfigureAwait(false), 409, "AgentInUse", "A member agent cannot be deleted");

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
