namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Net.Http;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Manifests;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Serialization;
    using Garrison.Core.Services;
    using Garrison.Server.Protocols;
    using Garrison.Server.Routes;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Agent revisions, environments, and promotion (AD1): revision 1 for every agent and the backfill, the draft and
    /// publish rules, field-level diffs, compiling from pinned and latest revisions, environment validation,
    /// promotion and rollback, the REST routes with RBAC and tenant isolation, the MCP tools, and manifests.
    /// </summary>
    public static class RevisionSuite
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
            unit.Add(new TestCaseDescriptor("revisions-unit", "content-hash-diff", "Content hash ignores list order where it should, and the diff lists changed fields, schemas, allow list entries, prompt pins, and tags", ContentAsync));
            suites.Add(new TestSuiteDescriptor("revisions-unit", "Agent revisions (unit)", unit));

            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "revisions-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                cases.Add(new TestCaseDescriptor(id, "revision-one-backfill", "Every agent has exactly one published revision 1 whose hash matches its fields, including agents the backfill finds without one (" + provider + ")", ct => BackfillAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "draft-publish", "One open draft per agent, publish freezes it, RevisionUnchanged and RevisionPublished, direct edits publish at once, diff (" + provider + ")", ct => DraftPublishAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "compile-pin", "A deployment pinned to revision 1 renders revision 1 after revision 2 is published; unpinned follows the latest; runs record their revision; UnknownEnvironment and UnknownRevision (" + provider + ")", ct => CompilePinAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "promotion", "Promote dev to staging to prod, roll back prod to the exact previous pins, PromotionOrderViolation, allowSkip, and Execute on Promotion for the target (" + provider + ")", ct => PromotionAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "routes-rbac", "Routes: 400 validation, 403 without permission, 404 across tenants, environments list, and operation scope map entries (" + provider + ")", ct => RoutesAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "mcp", "MCP revision and promotion tools as a user, refused for a run token and hidden from its tools/list (" + provider + ")", ct => McpAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "manifests", "Manifests: environment and agentRevision on deployments, revision.publish false writes a draft, dry run, export round trip, and a bundle applied to another tenant (" + provider + ")", ct => ManifestsAsync(provider, ct)));
                suites.Add(new TestSuiteDescriptor(id, "Agent revisions and promotion (" + provider + ")", cases));
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

        private static Task ContentAsync(CancellationToken token)
        {
            Agent agent = new Agent { Name = "content", Description = "one", DelegationMode = DelegationModeEnum.AllowList };
            agent.DelegationAllowList = new List<string> { "b", "a" };
            agent.Tags = new List<string> { "y", "x" };
            AgentRevision first = AgentRevisionContent.FromAgent(agent);
            agent.DelegationAllowList = new List<string> { "a", "b" };
            agent.Tags = new List<string> { "x", "y" };
            AgentRevision reordered = AgentRevisionContent.FromAgent(agent);
            Assert.Equal(first.ContentHash, reordered.ContentHash, "Allow list and tag order do not change the hash");

            agent.Description = "two";
            agent.OutputSchemaJson = "{\"type\":\"object\"}";
            agent.DelegationAllowList = new List<string> { "a", "c" };
            agent.Tags = new List<string> { "x" };
            agent.ToolDescriptionTemplateId = "pmt_tool";
            AgentRevision second = AgentRevisionContent.FromAgent(agent);
            Assert.True(first.ContentHash != second.ContentHash, "Content changes change the hash");
            AgentRevisionDiff diff = AgentRevisionContent.Diff(first, second);
            AssertFalse(diff.Identical, "Not identical");
            Assert.True(diff.Changes.Any(c => c.Field == "description" && c.From == "one" && c.To == "two"), "Description change listed");
            Assert.True(diff.Changes.Any(c => c.Field == "outputSchemaJson" && c.From == null && c.To != null), "Schema change listed");
            Assert.True(diff.Changes.Any(c => c.Field == "delegationAllowList" && c.ChangeType == RevisionChangeTypeEnum.Removed && c.From == "b"), "Allow list removal listed");
            Assert.True(diff.Changes.Any(c => c.Field == "delegationAllowList" && c.ChangeType == RevisionChangeTypeEnum.Added && c.To == "c"), "Allow list addition listed");
            Assert.True(diff.Changes.Any(c => c.Field == "promptPins" && c.ChangeType == RevisionChangeTypeEnum.Added && c.To == "ToolDescription:pmt_tool"), "Prompt pin listed");
            Assert.True(diff.Changes.Any(c => c.Field == "tags" && c.ChangeType == RevisionChangeTypeEnum.Removed && c.From == "y"), "Tag removal listed");
            Assert.True(AgentRevisionContent.Diff(second, second).Identical, "A revision diffed with itself is identical");

            Agent target = new Agent { Name = "target" };
            AgentRevisionContent.ApplyTo(second, target);
            Assert.Equal("two", target.Description, "ApplyTo copies content");
            Assert.Equal("pmt_tool", target.ToolDescriptionTemplateId, "ApplyTo copies prompt pins back");
            return Task.CompletedTask;
        }

        private static async Task BackfillAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                Agent created = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, T(host) + "/agents", new Agent { Name = "rev-seed", Description = "Seeded", Tags = new List<string> { "a" } }, 201, token).ConfigureAwait(false);
                EnumerationResult<AgentRevision> page = await HttpTestHelpers.SendAsync<EnumerationResult<AgentRevision>>(host.AdminClient, HttpMethod.Get, T(host) + "/agents/" + created.Id + "/revisions", null, 200, token).ConfigureAwait(false);
                Assert.Equal(1, page.Objects.Count, "A new agent has one revision");
                AgentRevision one = page.Objects[0];
                Assert.Equal(1, one.Number, "Revision 1");
                Assert.Equal(AgentRevisionStateEnum.Published, one.State, "Published");
                Agent read = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Get, T(host) + "/agents/" + created.Id, null, 200, token).ConfigureAwait(false);
                Assert.Equal(one.Id, read.LatestPublishedRevisionId, "Agent points at revision 1");
                Assert.Equal(AgentRevisionContent.FromAgent(read).ContentHash, one.ContentHash, "Hash matches the agent's fields");

                // Built-in and seeded agents get one too.
                EnumerationResult<Agent> agents = await host.Server.Context.Database.Agents.EnumerateAsync(host.TenantId, new EnumerationQuery { MaxResults = 1000 }, token).ConfigureAwait(false);
                foreach (Agent agent in agents.Objects)
                {
                    List<AgentRevision> revisions = await host.Server.Context.Database.AgentRevisions.ListAsync(host.TenantId, agent.Id, token).ConfigureAwait(false);
                    Assert.True(revisions.Count(r => r.State == AgentRevisionStateEnum.Published) >= 1, "Agent " + agent.Name + " has a published revision");
                    AssertFalse(String.IsNullOrEmpty(agent.LatestPublishedRevisionId), "Agent " + agent.Name + " has a latest pointer");
                }

                // An agent that predates revisions (no pointer, no rows) gets exactly one from the backfill, and a second
                // pass changes nothing.
                Agent legacy = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, T(host) + "/agents", new Agent { Name = "rev-legacy", Description = "Old" }, 201, token).ConfigureAwait(false);
                Garrison.Core.Database.Ado.AdoDatabaseDriver driver = (Garrison.Core.Database.Ado.AdoDatabaseDriver)host.Server.Context.Database;
                await driver.NonQueryAsync("DELETE FROM " + driver.Table("agent_revisions") + " WHERE agentid = @id;", c => Garrison.Core.Database.Ado.AdoDatabaseDriver.Add(c, "id", legacy.Id), token).ConfigureAwait(false);
                await driver.NonQueryAsync("UPDATE " + driver.Table("agents") + " SET latestpublishedrevisionid = NULL WHERE id = @id;", c => Garrison.Core.Database.Ado.AdoDatabaseDriver.Add(c, "id", legacy.Id), token).ConfigureAwait(false);
                Assert.True(await host.Server.Context.Database.AgentRevisions.BackfillAsync(token).ConfigureAwait(false) >= 1, "Backfill finds the legacy agent");
                Assert.Equal(0, await host.Server.Context.Database.AgentRevisions.BackfillAsync(token).ConfigureAwait(false), "Second backfill pass does nothing");
                List<AgentRevision> legacyRevisions = await host.Server.Context.Database.AgentRevisions.ListAsync(host.TenantId, legacy.Id, token).ConfigureAwait(false);
                Assert.Equal(1, legacyRevisions.Count, "Exactly one revision after backfill");
                Assert.Equal(AgentRevisionStateEnum.Published, legacyRevisions[0].State, "Backfilled revision is published");
                Agent legacyRead = Assert.NotNull(await host.Server.Context.Database.Agents.ReadAsync(host.TenantId, legacy.Id, token).ConfigureAwait(false), "Legacy agent");
                Assert.Equal(legacyRevisions[0].Id, legacyRead.LatestPublishedRevisionId, "Pointer set by backfill");
                Assert.Equal(AgentRevisionContent.FromAgent(legacyRead).ContentHash, legacyRevisions[0].ContentHash, "Backfilled hash matches the fields");
            }
        }

        private static async Task DraftPublishAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                Agent agent = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, T(host) + "/agents", new Agent { Name = "rev-draft", Description = "First" }, 201, token).ConfigureAwait(false);
                string revisions = T(host) + "/agents/" + agent.Name + "/revisions";

                // An unchanged draft cannot be published.
                AgentRevision same = await HttpTestHelpers.SendAsync<AgentRevision>(host.AdminClient, HttpMethod.Post, revisions, new AgentRevision { Description = "First" }, 201, token).ConfigureAwait(false);
                Assert.Equal(2, same.Number, "Draft gets the next number");
                Assert.Equal(AgentRevisionStateEnum.Draft, same.State, "It is a draft");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, revisions + "/" + same.Id + "/publish", null, token).ConfigureAwait(false), 409, "RevisionUnchanged", "Publishing an unchanged draft");

                // Saving again replaces the same draft.
                AgentRevision draft = await HttpTestHelpers.SendAsync<AgentRevision>(host.AdminClient, HttpMethod.Post, revisions, new AgentRevision { Description = "Second", OutputSchemaJson = "{\"type\":\"object\"}", DelegationMode = DelegationModeEnum.AllowList, DelegationAllowList = new List<string> { "helper" }, ChangeNote = "More" }, 201, token).ConfigureAwait(false);
                Assert.Equal(same.Id, draft.Id, "Still the one open draft");
                Agent withDraft = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Get, T(host) + "/agents/" + agent.Id, null, 200, token).ConfigureAwait(false);
                Assert.Equal(draft.Id, withDraft.DraftRevisionId, "Agent points at its draft");
                Assert.Equal("First", withDraft.Description, "A draft does not change what runs");

                // Invalid content is refused with field errors.
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, revisions, new AgentRevision { OutputSchemaJson = "{not json" }, token).ConfigureAwait(false), 400, "outputSchemaJson", "Invalid schema");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, revisions, new AgentRevision { PromptPins = new List<AgentRevisionPromptPin> { new AgentRevisionPromptPin { Role = "ToolDescription", TemplateId = "pmt_missing" } } }, token).ConfigureAwait(false), 400, "promptPins[0].templateId", "Unknown prompt template");

                // Diff from the published revision to the draft.
                AgentRevisionDiff diff = await HttpTestHelpers.SendAsync<AgentRevisionDiff>(host.AdminClient, HttpMethod.Get, revisions + "/diff?from=1&to=2", null, 200, token).ConfigureAwait(false);
                Assert.True(diff.Changes.Any(c => c.Field == "description" && c.From == "First" && c.To == "Second"), "Diff lists the description");
                Assert.True(diff.Changes.Any(c => c.Field == "outputSchemaJson"), "Diff lists the schema");
                Assert.True(diff.Changes.Any(c => c.Field == "delegationAllowList" && c.To == "helper"), "Diff lists the allow list entry");
                AgentRevisionDiff defaults = await HttpTestHelpers.SendAsync<AgentRevisionDiff>(host.AdminClient, HttpMethod.Get, revisions + "/diff", null, 200, token).ConfigureAwait(false);
                Assert.Equal(2, defaults.ToNumber, "Default to is the draft");
                Assert.Equal(1, defaults.FromNumber, "Default from is the published revision before it");

                // Publish freezes it.
                AgentRevision published = await HttpTestHelpers.SendAsync<AgentRevision>(host.AdminClient, HttpMethod.Post, revisions + "/2/publish", new RevisionPublishRequest { ChangeNote = "Ship it" }, 200, token).ConfigureAwait(false);
                Assert.Equal(AgentRevisionStateEnum.Published, published.State, "Published");
                Assert.Equal("Ship it", published.ChangeNote, "Change note recorded");
                Assert.True(published.PublishedUtc.HasValue, "Publication time recorded");
                Agent after = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Get, T(host) + "/agents/" + agent.Id, null, 200, token).ConfigureAwait(false);
                Assert.Equal(published.Id, after.LatestPublishedRevisionId, "Latest pointer moved");
                Assert.True(String.IsNullOrEmpty(after.DraftRevisionId), "Draft pointer cleared");
                Assert.Equal("Second", after.Description, "Agent shows the published definition");
                Assert.Equal("helper", String.Join(",", after.DelegationAllowList), "Allow list copied to the agent");

                // Nothing can change a published revision.
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, revisions + "/2/publish", null, token).ConfigureAwait(false), 409, "RevisionPublished", "Publishing twice");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, revisions + "/2", null, token).ConfigureAwait(false), 409, "RevisionPublished", "Deleting a published revision");
                AgentRevision next = await HttpTestHelpers.SendAsync<AgentRevision>(host.AdminClient, HttpMethod.Post, revisions, new AgentRevision { Description = "Third" }, 201, token).ConfigureAwait(false);
                Assert.Equal(3, next.Number, "Saving after publish opens a new draft");
                AgentRevision frozen = await HttpTestHelpers.SendAsync<AgentRevision>(host.AdminClient, HttpMethod.Get, revisions + "/2", null, 200, token).ConfigureAwait(false);
                Assert.Equal("Second", frozen.Description, "Revision 2 is unchanged");
                Assert.Equal(published.ContentHash, frozen.ContentHash, "Hash unchanged");
                Assert.Equal(204, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, revisions + "/3", null, token).ConfigureAwait(false)).StatusCode, "Draft discarded");
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, revisions + "/3", null, token).ConfigureAwait(false)).StatusCode, "Discarded draft is gone");

                // A direct edit publishes at once (AD-030); an edit with the same content does not.
                agent = after;
                agent.Description = "Direct";
                await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Put, T(host) + "/agents/" + agent.Id, agent, 200, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Put, T(host) + "/agents/" + agent.Id, agent, 200, token).ConfigureAwait(false);
                List<AgentRevision> all = await host.Server.Context.Database.AgentRevisions.ListAsync(host.TenantId, agent.Id, token).ConfigureAwait(false);
                Assert.Equal("1,2,3", String.Join(",", all.Select(r => r.Number)), "One new published revision for the direct edit (taking the discarded draft's number), none for the repeat");
                Assert.Equal("Direct", all.Last().Description, "It carries the edit");
                Assert.Equal(AgentRevisionStateEnum.Published, all.Last().State, "Published");
            }
        }

        private static async Task CompilePinAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                Agent agent = await cluster.CreateAgentAsync("rev-compile", "builtin/fake", a => a.Description = "Revision one text", token).ConfigureAwait(false);
                AgentRevision one = Assert.NotNull(await host.Server.Context.Database.AgentRevisions.ReadByNumberAsync(host.TenantId, agent.Id, 1, token).ConfigureAwait(false), "Revision 1");
                Deployment unpinned = Assert.NotNull(await host.Server.Context.Database.Deployments.ReadByNameAsync(host.TenantId, "rev-compile-default", token).ConfigureAwait(false), "Default deployment");
                Assert.Equal("dev", unpinned.Environment, "Deployments default to dev");
                Deployment pinned = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Post, T(host) + "/deployments", new Deployment { Name = "rev-compile-pinned", AgentId = agent.Id, HarnessProfileId = unpinned.HarnessProfileId, AgentRevisionId = one.Id, Environment = "prod" }, 201, token).ConfigureAwait(false);
                Assert.Equal(one.Id, pinned.AgentRevisionId, "Pin stored");
                Assert.Equal("prod", pinned.Environment, "Environment stored");

                await HttpTestHelpers.SendAsync<AgentRevision>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/" + agent.Id + "/revisions", new AgentRevision { Description = "Revision two text" }, 201, token).ConfigureAwait(false);
                AgentRevision two = await HttpTestHelpers.SendAsync<AgentRevision>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/" + agent.Id + "/revisions/2/publish", null, 200, token).ConfigureAwait(false);

                InvocationCompiler compiler = host.Server.Context.Get<InvocationCompiler>();
                string pinnedSpec = Serializer.Serialize((await compiler.PreviewAsync(host.TenantId, pinned.Id, "hello", null, token).ConfigureAwait(false)).Spec);
                Assert.True(pinnedSpec.Contains("Revision one text", StringComparison.Ordinal), "Pinned deployment renders revision 1");
                AssertFalse(pinnedSpec.Contains("Revision two text", StringComparison.Ordinal), "Pinned deployment does not render revision 2");
                string followSpec = Serializer.Serialize((await compiler.PreviewAsync(host.TenantId, unpinned.Id, "hello", null, token).ConfigureAwait(false)).Spec);
                Assert.True(followSpec.Contains("Revision two text", StringComparison.Ordinal), "Unpinned deployment renders the latest published revision");

                // Runs record the revision they compile from.
                InvokeRequest invoke = new InvokeRequest { Input = "hi", Wait = true, WaitSeconds = 60, DeploymentId = pinned.Id };
                Run run = await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/" + agent.Id + "/invoke", invoke, 200, token).ConfigureAwait(false);
                Assert.Equal(one.Id, run.AgentRevisionId, "Pinned run records revision 1");
                invoke.DeploymentId = unpinned.Id;
                Run latest = await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/" + agent.Id + "/invoke", invoke, 200, token).ConfigureAwait(false);
                Assert.Equal(two.Id, latest.AgentRevisionId, "Unpinned run records the latest revision");

                // Validation of environment labels and pins.
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/deployments", new Deployment { Name = "rev-bad-env", AgentId = agent.Id, HarnessProfileId = unpinned.HarnessProfileId, Environment = "qa" }, token).ConfigureAwait(false), 400, "UnknownEnvironment", "Unknown environment");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/deployments", new Deployment { Name = "rev-bad-pin", AgentId = agent.Id, HarnessProfileId = unpinned.HarnessProfileId, AgentRevisionId = "arv_missing" }, token).ConfigureAwait(false), 400, "UnknownRevision", "Unknown revision pin");
                await HttpTestHelpers.SendAsync<AgentRevision>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/" + agent.Id + "/revisions", new AgentRevision { Description = "Draft three" }, 201, token).ConfigureAwait(false);
                AgentRevision three = Assert.NotNull(await host.Server.Context.Database.AgentRevisions.ReadByNumberAsync(host.TenantId, agent.Id, 3, token).ConfigureAwait(false), "Draft 3");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/deployments", new Deployment { Name = "rev-draft-pin", AgentId = agent.Id, HarnessProfileId = unpinned.HarnessProfileId, AgentRevisionId = three.Id }, token).ConfigureAwait(false), 400, "UnknownRevision", "A draft cannot be pinned");

                // A custom environment list makes qa valid and refuses removing an environment still in use.
                TenantEnvironmentList custom = new TenantEnvironmentList { Environments = new List<TenantEnvironment> { new TenantEnvironment { Name = "dev" }, new TenantEnvironment { Name = "qa" }, new TenantEnvironment { Name = "prod" } } };
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Put, T(host) + "/environments", new TenantEnvironmentList { Environments = new List<TenantEnvironment> { new TenantEnvironment { Name = "dev" } } }, token).ConfigureAwait(false), 409, "EnvironmentInUse", "Removing prod while a deployment uses it");
                TenantEnvironmentList stored = await HttpTestHelpers.SendAsync<TenantEnvironmentList>(host.AdminClient, HttpMethod.Put, T(host) + "/environments", custom, 200, token).ConfigureAwait(false);
                AssertFalse(stored.IsDefault, "Custom list stored");
                Assert.Equal("dev,qa,prod", String.Join(",", stored.Environments.Select(e => e.Name)), "Order kept");
                await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Post, T(host) + "/deployments", new Deployment { Name = "rev-qa", AgentId = agent.Id, HarnessProfileId = unpinned.HarnessProfileId, Environment = "qa" }, 201, token).ConfigureAwait(false);
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Put, T(host) + "/environments", new TenantEnvironmentList { Environments = new List<TenantEnvironment> { new TenantEnvironment { Name = "dev" }, new TenantEnvironment { Name = "draft" }, new TenantEnvironment { Name = "prod" } } }, token).ConfigureAwait(false), 400, "reserved", "draft is reserved");
            }
        }

        private static async Task PromotionAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                Agent agent = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, T(host) + "/agents", new Agent { Name = "rev-promo", Description = "v1" }, 201, token).ConfigureAwait(false);
                AgentRevision one = Assert.NotNull(await host.Server.Context.Database.AgentRevisions.ReadByNumberAsync(host.TenantId, agent.Id, 1, token).ConfigureAwait(false), "Revision 1");
                string profile = "hrn_builtin_fake";
                Deployment dev = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Post, T(host) + "/deployments", new Deployment { Name = "promo-dev", AgentId = agent.Id, HarnessProfileId = profile }, 201, token).ConfigureAwait(false);
                Deployment staging = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Post, T(host) + "/deployments", new Deployment { Name = "promo-staging", AgentId = agent.Id, HarnessProfileId = profile, Environment = "staging", AgentRevisionId = one.Id }, 201, token).ConfigureAwait(false);
                Deployment prodA = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Post, T(host) + "/deployments", new Deployment { Name = "promo-prod-a", AgentId = agent.Id, HarnessProfileId = profile, Environment = "prod", AgentRevisionId = one.Id }, 201, token).ConfigureAwait(false);
                Deployment prodB = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Post, T(host) + "/deployments", new Deployment { Name = "promo-prod-b", AgentId = agent.Id, HarnessProfileId = profile, Environment = "prod" }, 201, token).ConfigureAwait(false);

                await HttpTestHelpers.SendAsync<AgentRevision>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/" + agent.Id + "/revisions", new AgentRevision { Description = "v2" }, 201, token).ConfigureAwait(false);
                AgentRevision two = await HttpTestHelpers.SendAsync<AgentRevision>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/" + agent.Id + "/revisions/2/publish", null, 200, token).ConfigureAwait(false);

                // dev (unpinned, so it runs v2) to staging.
                PromotionRecord toStaging = await HttpTestHelpers.SendAsync<PromotionRecord>(host.AdminClient, HttpMethod.Post, T(host) + "/promotions", new PromotionRequest { AgentId = agent.Name, SourceEnvironment = "dev" }, 201, token).ConfigureAwait(false);
                Assert.Equal("staging", toStaging.TargetEnvironment, "Default target is the next environment");
                Assert.Equal(two.Id, toStaging.AgentRevisionId, "dev runs revision 2");
                Assert.Equal(1, toStaging.Items.Count, "One staging deployment");
                Assert.Equal(one.Id, toStaging.Items[0].PreviousRevisionId, "Previous pin recorded");
                Deployment stagingAfter = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Get, T(host) + "/deployments/" + staging.Id, null, 200, token).ConfigureAwait(false);
                Assert.Equal(two.Id, stagingAfter.AgentRevisionId, "Staging repinned");

                // staging to prod repins both prod deployments together.
                PromotionRecord toProd = await HttpTestHelpers.SendAsync<PromotionRecord>(host.AdminClient, HttpMethod.Post, T(host) + "/promotions", new PromotionRequest { AgentId = agent.Id, SourceEnvironment = "staging" }, 201, token).ConfigureAwait(false);
                Assert.Equal(2, toProd.Items.Count, "Both prod deployments");
                foreach (Deployment prod in new[] { prodA, prodB })
                {
                    Deployment read = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Get, T(host) + "/deployments/" + prod.Id, null, 200, token).ConfigureAwait(false);
                    Assert.Equal(two.Id, read.AgentRevisionId, prod.Name + " repinned");
                }

                // Rollback restores the exact previous pins: prod-a back to revision 1, prod-b back to unpinned.
                PromotionRecord rollback = await HttpTestHelpers.SendAsync<PromotionRecord>(host.AdminClient, HttpMethod.Post, T(host) + "/promotions/" + toProd.Id + "/rollback", new PromotionRollbackRequest { Note = "Bad prompt" }, 201, token).ConfigureAwait(false);
                Assert.Equal(PromotionKindEnum.Rollback, rollback.Kind, "Rollback record");
                Assert.Equal(toProd.Id, rollback.RollbackOfId, "Links the promotion");
                Deployment prodARead = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Get, T(host) + "/deployments/" + prodA.Id, null, 200, token).ConfigureAwait(false);
                Deployment prodBRead = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Get, T(host) + "/deployments/" + prodB.Id, null, 200, token).ConfigureAwait(false);
                Assert.Equal(one.Id, prodARead.AgentRevisionId, "prod-a pinned to revision 1 again");
                Assert.True(String.IsNullOrEmpty(prodBRead.AgentRevisionId), "prod-b unpinned again");
                PromotionRecord original = await HttpTestHelpers.SendAsync<PromotionRecord>(host.AdminClient, HttpMethod.Get, T(host) + "/promotions/" + toProd.Id, null, 200, token).ConfigureAwait(false);
                Assert.Equal(PromotionOutcomeEnum.RolledBack, original.Outcome, "Promotion marked rolled back");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/promotions/" + toProd.Id + "/rollback", null, token).ConfigureAwait(false), 409, "AlreadyRolledBack", "Rolling back twice");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/promotions/" + rollback.Id + "/rollback", null, token).ConfigureAwait(false), 409, "NotAPromotion", "Rolling back a rollback");
                EnumerationResult<PromotionRecord> history = await HttpTestHelpers.SendAsync<EnumerationResult<PromotionRecord>>(host.AdminClient, HttpMethod.Get, T(host) + "/promotions?agentId=" + agent.Id, null, 200, token).ConfigureAwait(false);
                Assert.Equal(3, history.Objects.Count, "Three records for the agent");
                Assert.Equal(rollback.Id, history.Objects[0].Id, "Newest first");

                // Order: dev to prod skips staging.
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/promotions", new PromotionRequest { AgentId = agent.Id, SourceEnvironment = "dev", TargetEnvironment = "prod" }, token).ConfigureAwait(false), 409, "PromotionOrderViolation", "Skipping staging");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/promotions", new PromotionRequest { AgentId = agent.Id, SourceEnvironment = "prod" }, token).ConfigureAwait(false), 400, "NoNextEnvironment", "Nothing after prod");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/promotions", new PromotionRequest { AgentId = agent.Id, SourceEnvironment = "qa" }, token).ConfigureAwait(false), 400, "UnknownEnvironment", "Unknown source");

                // A Releaser scoped to staging may promote dev to staging but not skip to prod; a developer may do neither.
                User releaser = await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, T(host) + "/users", new UserRequest { Email = "releaser@example.com", Password = "password123" }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<UserRoleAssignment>(host.AdminClient, HttpMethod.Post, T(host) + "/user-role-assignments", new AssignmentRequest { UserId = releaser.Id, RoleName = "Releaser", ResourceScope = ResourceScopeEnum.Resource, ResourceId = "staging" }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<UserRoleAssignment>(host.AdminClient, HttpMethod.Post, T(host) + "/user-role-assignments", new AssignmentRequest { UserId = releaser.Id, RoleName = "Viewer" }, 201, token).ConfigureAwait(false);
                using (HttpClient client = await host.UserClientAsync("releaser@example.com", "password123", host.TenantId, token).ConfigureAwait(false))
                {
                    await HttpTestHelpers.SendAsync<PromotionRecord>(client, HttpMethod.Post, T(host) + "/promotions", new PromotionRequest { AgentId = agent.Id, SourceEnvironment = "dev", AgentRevisionId = one.Id }, 201, token).ConfigureAwait(false);
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(client, HttpMethod.Post, T(host) + "/promotions", new PromotionRequest { AgentId = agent.Id, SourceEnvironment = "dev", TargetEnvironment = "prod", AllowSkip = true }, token).ConfigureAwait(false)).StatusCode, "No Execute on Promotion for prod");
                }
                User developer = await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, T(host) + "/users", new UserRequest { Email = "developer@example.com", Password = "password123" }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<UserRoleAssignment>(host.AdminClient, HttpMethod.Post, T(host) + "/user-role-assignments", new AssignmentRequest { UserId = developer.Id, RoleName = "AgentDeveloper" }, 201, token).ConfigureAwait(false);
                using (HttpClient client = await host.UserClientAsync("developer@example.com", "password123", host.TenantId, token).ConfigureAwait(false))
                {
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(client, HttpMethod.Post, T(host) + "/promotions", new PromotionRequest { AgentId = agent.Id, SourceEnvironment = "dev" }, token).ConfigureAwait(false)).StatusCode, "Developers cannot promote");
                    await HttpTestHelpers.SendAsync<EnumerationResult<PromotionRecord>>(client, HttpMethod.Get, T(host) + "/promotions", null, 200, token).ConfigureAwait(false);
                }

                // An administrator may skip with allowSkip.
                PromotionRecord skipped = await HttpTestHelpers.SendAsync<PromotionRecord>(host.AdminClient, HttpMethod.Post, T(host) + "/promotions", new PromotionRequest { AgentId = agent.Id, SourceEnvironment = "dev", TargetEnvironment = "prod", AllowSkip = true }, 201, token).ConfigureAwait(false);
                Assert.True(skipped.SkippedEnvironments, "Recorded as skipping");
            }
        }

        private static async Task RoutesAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                Agent agent = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, T(host) + "/agents", new Agent { Name = "rev-routes" }, 201, token).ConfigureAwait(false);
                string revisions = T(host) + "/agents/" + agent.Id + "/revisions";
                TenantEnvironmentList defaults = await HttpTestHelpers.SendAsync<TenantEnvironmentList>(host.AdminClient, HttpMethod.Get, T(host) + "/environments", null, 200, token).ConfigureAwait(false);
                Assert.True(defaults.IsDefault, "Default list");
                Assert.Equal("dev,staging,prod", String.Join(",", defaults.Environments.Select(e => e.Name)), "dev, staging, prod");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Put, T(host) + "/environments", new TenantEnvironmentList(), token).ConfigureAwait(false), 400, "environments", "Empty list");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Put, T(host) + "/environments", new TenantEnvironmentList { Environments = new List<TenantEnvironment> { new TenantEnvironment { Name = "Dev!" } } }, token).ConfigureAwait(false), 400, "environments[0].name", "Bad name");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/promotions", new PromotionRequest { SourceEnvironment = "dev" }, token).ConfigureAwait(false), 400, "agentId", "Promotion without an agent");
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, revisions + "/99", null, token).ConfigureAwait(false)).StatusCode, "Missing revision");
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, T(host) + "/promotions/pro_missing", null, token).ConfigureAwait(false)).StatusCode, "Missing promotion");

                User viewer = await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, T(host) + "/users", new UserRequest { Email = "rev-viewer@example.com", Password = "password123" }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<UserRoleAssignment>(host.AdminClient, HttpMethod.Post, T(host) + "/user-role-assignments", new AssignmentRequest { UserId = viewer.Id, RoleName = "Viewer" }, 201, token).ConfigureAwait(false);
                using (HttpClient client = await host.UserClientAsync("rev-viewer@example.com", "password123", host.TenantId, token).ConfigureAwait(false))
                {
                    await HttpTestHelpers.SendAsync<EnumerationResult<AgentRevision>>(client, HttpMethod.Get, revisions, null, 200, token).ConfigureAwait(false);
                    await HttpTestHelpers.SendAsync<TenantEnvironmentList>(client, HttpMethod.Get, T(host) + "/environments", null, 200, token).ConfigureAwait(false);
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(client, HttpMethod.Post, revisions, new AgentRevision { Description = "x" }, token).ConfigureAwait(false)).StatusCode, "Viewers cannot draft");
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(client, HttpMethod.Post, revisions + "/1/publish", null, token).ConfigureAwait(false)).StatusCode, "Viewers cannot publish");
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(client, HttpMethod.Put, T(host) + "/environments", defaults, token).ConfigureAwait(false)).StatusCode, "Viewers cannot set environments");
                }

                Tenant other = await HttpTestHelpers.SendAsync<Tenant>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants", new TenantRequest { Name = "Revisions Other" }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + other.Id + "/users", new UserRequest { Email = "rev-outsider@example.com", Password = "password123", IsTenantAdmin = true }, 201, token).ConfigureAwait(false);
                using (HttpClient outsider = await host.UserClientAsync("rev-outsider@example.com", "password123", other.Id, token).ConfigureAwait(false))
                {
                    Assert.Equal(404, (await HttpTestHelpers.SendAsync(outsider, HttpMethod.Get, revisions, null, token).ConfigureAwait(false)).StatusCode, "Another tenant's revisions by path");
                    Assert.Equal(404, (await HttpTestHelpers.SendAsync(outsider, HttpMethod.Get, "/v1.0/api/tenants/" + other.Id + "/agents/" + agent.Id + "/revisions", null, token).ConfigureAwait(false)).StatusCode, "Another tenant's agent through their tenant");
                    AgentRevision theirs = Assert.NotNull(await host.Server.Context.Database.AgentRevisions.ReadByNumberAsync(host.TenantId, agent.Id, 1, token).ConfigureAwait(false), "Revision 1");
                    Assert.True(await host.Server.Context.Database.AgentRevisions.ReadAsync(other.Id, theirs.Id, token).ConfigureAwait(false) == null, "Data layer filters by tenant");
                    Assert.Equal(404, (await HttpTestHelpers.SendAsync(outsider, HttpMethod.Get, T(host) + "/promotions", null, token).ConfigureAwait(false)).StatusCode, "Another tenant's promotions");
                }

                OperationScopeMap scopes = host.Server.Context.Scopes;
                string[] expected =
                {
                    "GET /v1.0/api/tenants/{tenantId}/agents/{id}/revisions", "POST /v1.0/api/tenants/{tenantId}/agents/{id}/revisions",
                    "GET /v1.0/api/tenants/{tenantId}/agents/{id}/revisions/diff", "GET /v1.0/api/tenants/{tenantId}/agents/{id}/revisions/{revId}",
                    "DELETE /v1.0/api/tenants/{tenantId}/agents/{id}/revisions/{revId}", "POST /v1.0/api/tenants/{tenantId}/agents/{id}/revisions/{revId}/publish",
                    "GET /v1.0/api/tenants/{tenantId}/environments", "PUT /v1.0/api/tenants/{tenantId}/environments",
                    "GET /v1.0/api/tenants/{tenantId}/promotions", "POST /v1.0/api/tenants/{tenantId}/promotions",
                    "GET /v1.0/api/tenants/{tenantId}/promotions/{id}", "POST /v1.0/api/tenants/{tenantId}/promotions/{id}/rollback"
                };
                foreach (string route in expected)
                {
                    string[] parts = route.Split(' ');
                    OperationScope? scope = scopes.Find(parts[0], parts[1]);
                    Assert.NotNull(scope, "Scope map entry for " + route);
                    Assert.True(scope!.ResourceType.HasValue, "Resource type recorded for " + route);
                }
            }
        }

        private static async Task McpAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                Agent agent = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, T(host) + "/agents", new Agent { Name = "rev-mcp", Description = "v1" }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Post, T(host) + "/deployments", new Deployment { Name = "rev-mcp-dev", AgentId = agent.Id, HarnessProfileId = "hrn_builtin_fake" }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Post, T(host) + "/deployments", new Deployment { Name = "rev-mcp-staging", AgentId = agent.Id, HarnessProfileId = "hrn_builtin_fake", Environment = "staging" }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<AgentRevision>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/" + agent.Id + "/revisions", new AgentRevision { Description = "v2" }, 201, token).ConfigureAwait(false);
                string[] names = { "garrison_list_agent_revisions", "garrison_get_agent_revision", "garrison_publish_agent_revision", "garrison_promote", "garrison_rollback_promotion" };
                using (TestMcpClient client = new TestMcpClient())
                {
                    await client.ConnectAsync(host, null, token).ConfigureAwait(false);
                    List<string> listed = (await client.ToolsAsync(token).ConfigureAwait(false)).Tools.Select(t => t.Name).ToList();
                    foreach (string name in names) Assert.True(listed.Contains(name), "User sees " + name);
                    EnumerationResult<AgentRevision> page = await client.CallAsync<EnumerationResult<AgentRevision>>("garrison_list_agent_revisions", new { agent = agent.Name }, token).ConfigureAwait(false);
                    Assert.Equal(2, page.Objects.Count, "Two revisions");
                    AgentRevision draft = await client.CallAsync<AgentRevision>("garrison_get_agent_revision", new { agent = agent.Name, revision = "2" }, token).ConfigureAwait(false);
                    Assert.Equal(AgentRevisionStateEnum.Draft, draft.State, "Draft read");
                    AgentRevision published = await client.CallAsync<AgentRevision>("garrison_publish_agent_revision", new { agent = agent.Id, revision = draft.Id, changeNote = "From MCP" }, token).ConfigureAwait(false);
                    Assert.Equal(AgentRevisionStateEnum.Published, published.State, "Published through MCP");
                    await client.ExpectErrorAsync("garrison_publish_agent_revision", new { agent = agent.Id, revision = draft.Id }, "RevisionPublished", token).ConfigureAwait(false);
                    PromotionRecord promoted = await client.CallAsync<PromotionRecord>("garrison_promote", new { agentId = agent.Name, sourceEnvironment = "dev" }, token).ConfigureAwait(false);
                    Assert.Equal("staging", promoted.TargetEnvironment, "Promoted to staging");
                    await client.ExpectErrorAsync("garrison_promote", new { agentId = agent.Name, sourceEnvironment = "dev", targetEnvironment = "prod" }, "PromotionOrderViolation", token).ConfigureAwait(false);
                    PromotionRecord rolled = await client.CallAsync<PromotionRecord>("garrison_rollback_promotion", new { promotionId = promoted.Id }, token).ConfigureAwait(false);
                    Assert.Equal(PromotionKindEnum.Rollback, rolled.Kind, "Rolled back through MCP");
                }

                Deployment deployment = Assert.NotNull(await host.Server.Context.Database.Deployments.ReadByNameAsync(host.TenantId, "rev-mcp-dev", token).ConfigureAwait(false), "Deployment");
                Run run = await host.Server.Context.Database.Runs.CreateAsync(new Run { TenantId = host.TenantId, AgentId = agent.Id, DeploymentId = deployment.Id, Status = RunStatusEnum.Running, CallerType = PrincipalTypeEnum.Administrator, LeaseEpoch = 1, LeaseExpiresUtc = DateTime.UtcNow.AddMinutes(5) }, token).ConfigureAwait(false);
                string bearer = await host.Server.Context.Authentication.IssueForRunAsync(run, 1, DateTime.UtcNow.AddMinutes(5), token).ConfigureAwait(false);
                using (TestMcpClient client = new TestMcpClient())
                {
                    await client.ConnectAsync(host, bearer, token).ConfigureAwait(false);
                    List<string> listed = (await client.ToolsAsync(token).ConfigureAwait(false)).Tools.Select(t => t.Name).ToList();
                    foreach (string name in names) AssertFalse(listed.Contains(name), "Run token does not see " + name);
                    await client.ExpectErrorAsync("garrison_list_agent_revisions", new { agent = agent.Name }, "Forbidden", token).ConfigureAwait(false);
                    await client.ExpectErrorAsync("garrison_promote", new { agentId = agent.Name, sourceEnvironment = "dev" }, "Forbidden", token).ConfigureAwait(false);
                }
            }
        }

        private static async Task ManifestsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                string bundle = String.Join("\n", new[]
                {
                    "apiVersion: garrison/v1",
                    "kind: Agent",
                    "metadata: { name: rev-writer }",
                    "spec: { description: Writes things }",
                    "---",
                    "apiVersion: garrison/v1",
                    "kind: Deployment",
                    "metadata: { name: rev-writer-dev }",
                    "spec: { agent: rev-writer, harnessProfile: builtin/fake }",
                    "---",
                    "apiVersion: garrison/v1",
                    "kind: Deployment",
                    "metadata: { name: rev-writer-prod }",
                    "spec: { agent: rev-writer, harnessProfile: builtin/fake, environment: prod, agentRevision: 1 }",
                    ""
                });
                ManifestApply dry = await ApplyAsync(host.AdminClient, host.TenantId, bundle, "?dryRun=true", 200, token).ConfigureAwait(false);
                Assert.Equal(0, dry.FailedCount, "Dry run passes: " + Serializer.Serialize(dry));
                ManifestApply applied = await ApplyAsync(host.AdminClient, host.TenantId, bundle, String.Empty, 200, token).ConfigureAwait(false);
                Assert.Equal(3, applied.CreatedCount, "Three created");
                Agent writer = Assert.NotNull(await host.Server.Context.Database.Agents.ReadByNameAsync(host.TenantId, "rev-writer", token).ConfigureAwait(false), "Agent");
                Deployment prod = Assert.NotNull(await host.Server.Context.Database.Deployments.ReadByNameAsync(host.TenantId, "rev-writer-prod", token).ConfigureAwait(false), "Prod deployment");
                Assert.Equal("prod", prod.Environment, "Environment applied");
                Assert.Equal(writer.LatestPublishedRevisionId, prod.AgentRevisionId, "Pinned to revision 1 of the new agent");
                ManifestApply again = await ApplyAsync(host.AdminClient, host.TenantId, bundle, String.Empty, 200, token).ConfigureAwait(false);
                Assert.Equal(3, again.UnchangedCount, "Re-apply unchanged: " + Serializer.Serialize(again));

                // Bad pins and environments are refused at plan time.
                string badPin = bundle.Replace("agentRevision: 1", "agentRevision: 7", StringComparison.Ordinal);
                ManifestApply refused = await ApplyAsync(host.AdminClient, host.TenantId, badPin, "?dryRun=true", 400, token).ConfigureAwait(false);
                Assert.True(refused.Items.Any(i => i.ErrorCode == "UnknownRevision"), "Unknown revision number: " + Serializer.Serialize(refused));
                string badEnv = bundle.Replace("environment: prod", "environment: qa", StringComparison.Ordinal);
                ManifestApply refusedEnv = await ApplyAsync(host.AdminClient, host.TenantId, badEnv, String.Empty, 400, token).ConfigureAwait(false);
                Assert.True(refusedEnv.FailedCount > 0, "Unknown environment refused: " + Serializer.Serialize(refusedEnv));

                // revision.publish false writes a draft and leaves what runs alone.
                string draftDoc = String.Join("\n", new[] { "apiVersion: garrison/v1", "kind: Agent", "metadata: { name: rev-writer }", "spec: { description: Writes better things, revision: { publish: false, changeNote: Tune wording } }", "" });
                await ApplyAsync(host.AdminClient, host.TenantId, draftDoc, String.Empty, 200, token).ConfigureAwait(false);
                Agent afterDraft = Assert.NotNull(await host.Server.Context.Database.Agents.ReadAsync(host.TenantId, writer.Id, token).ConfigureAwait(false), "Agent");
                Assert.Equal("Writes things", afterDraft.Description, "Live definition unchanged");
                AgentRevision draft = Assert.NotNull(await host.Server.Context.Database.AgentRevisions.ReadAsync(host.TenantId, afterDraft.DraftRevisionId ?? "none", token).ConfigureAwait(false), "Draft written");
                Assert.Equal("Writes better things", draft.Description, "Draft carries the document");
                Assert.Equal("Tune wording", draft.ChangeNote, "Change note");

                // Export emits environment and the pinned revision number, and the bundle applies to another tenant.
                string exported = await ExportAsync(host.AdminClient, host.TenantId, "?resources=Agent/rev-writer&followReferences=true", token).ConfigureAwait(false);
                ManifestDocument prodDoc = ManifestParser.Parse(exported).First(d => d.Kind == "Deployment" && d.Metadata.Name == "rev-writer-prod");
                Assert.Equal("prod", prodDoc.Spec["environment"]?.ToString(), "Export emits environment");
                Assert.Equal("1", prodDoc.Spec["agentRevision"]?.ToString(), "Export emits the revision number");
                Tenant other = await HttpTestHelpers.SendAsync<Tenant>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants", new TenantRequest { Name = "Revisions Import" }, 201, token).ConfigureAwait(false);
                ManifestApply imported = await ApplyAsync(host.AdminClient, other.Id, exported, String.Empty, 200, token).ConfigureAwait(false);
                Assert.Equal(0, imported.FailedCount, "Applies to another tenant: " + Serializer.Serialize(imported));
                Deployment otherProd = Assert.NotNull(await host.Server.Context.Database.Deployments.ReadByNameAsync(other.Id, "rev-writer-prod", token).ConfigureAwait(false), "Imported deployment");
                AssertFalse(String.IsNullOrEmpty(otherProd.AgentRevisionId), "Pin resolved in the other tenant");
            }
        }

        private static void AssertFalse(bool condition, string message)
        {
            Assert.True(!condition, message);
        }

        private static async Task<ManifestApply> ApplyAsync(HttpClient client, string tenantId, string yaml, string query, int expectedStatus, CancellationToken token)
        {
            using (StringContent content = new StringContent(yaml, Encoding.UTF8, "application/yaml"))
            using (HttpResponseMessage response = await client.PostAsync("/v1.0/api/tenants/" + tenantId + "/manifests/apply" + query, content, token).ConfigureAwait(false))
            {
                string body = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                Assert.Equal(expectedStatus, (int)response.StatusCode, "Apply status: " + body);
                return Assert.NotNull(Serializer.Deserialize<ManifestApply>(body), "Apply result");
            }
        }

        private static async Task<string> ExportAsync(HttpClient client, string tenantId, string query, CancellationToken token)
        {
            TestResponse response = await HttpTestHelpers.SendAsync(client, HttpMethod.Get, "/v1.0/api/tenants/" + tenantId + "/manifests/export" + query, null, token).ConfigureAwait(false);
            Assert.Equal(200, response.StatusCode, "Export " + query + ": " + response.Body);
            return response.Body;
        }

        #endregion
    }
}
