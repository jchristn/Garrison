namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Net.Http;
    using System.Net.WebSockets;
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
    using Garrison.Server.Backplane;
    using Garrison.Server.Services;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Studio drafts (AD7.1 to AD7.5): version compare-and-set, drafts from an app with a diff that matches a manifest dry
    /// run, graph operations, DraftApply approvals (nothing changes before approval, approver permission, DraftStale), and
    /// the delegated Drafts grant for run tokens over MCP.
    /// </summary>
    public static class StudioSuite
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
                string id = "studio-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                cases.Add(new TestCaseDescriptor(id, "drafts", "Drafts hold one document per kind and name; a stale version is 409 DraftVersionConflict; documents must match their path (" + provider + ")", ct => DraftsAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "diff-validate", "A draft from a 3-agent app diffs Unchanged; edits show Create and Update with field changes; validation matches manifests/apply?dryRun=true per document (" + provider + ")", ct => DiffAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "graph", "Graph operations add members, connect, set the entry, disconnect, remove, and move nodes on the draft's app (" + provider + ")", ct => GraphAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "apply-approval", "request-apply changes nothing until a person approves; an approver without Create on Manifest is refused; approval applies atomically; a moved live record is DraftStale (" + provider + ")", ct => ApplyAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "apply-failure", "A draft that validates but fails while applying changes nothing live: its approval is cancelled with the reason, the draft opens again, and the decide answers DraftInvalid naming what failed; a draft with a deployment the write would refuse is refused at request-apply (" + provider + ")", ct => ApplyFailureAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "grant-mcp", "A managementAccess Drafts run token runs the draft-to-approval flow over MCP for its person; without the grant, or for a person without design permissions, it is refused; it cannot decide its approval (" + provider + ")", ct => GrantAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "channel", "A change made through an MCP tool reaches a studio-draft:{id} subscriber with the new version and the changed item (" + provider + ")", ct => ChannelAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "architect-seed", "Every tenant has the protected agent-architect with its skill asset; the four architect templates are built-in and immutable but resettable (" + provider + ")", ct => SeedAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "architect-prompt-flow", "Clone a built-in architect prompt, edit it, spawn an architect on the clone, see the edit on the next turn, pin and reset, refuse deleting it while in use, then switch and delete (" + provider + ")", ct => ArchitectPromptAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "architects", "Architects are tenant-wide: create with a credential secret, list (paginated, search, activeOnly), read by ID or name, update keeps other deployment settings and can replace or remove the credential, delete; a plain deployment is not an architect; the prompt catalog pages; MCP tools match; another tenant gets 404 (" + provider + ")", ct => ArchitectsAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "architect-script", "A scripted fake-harness architect turn sets a deployment's model, timeout, and approval rule, and binds all three capability sources (agent edge, MCP server, host tool), all through studio tools; the diff shows exactly those changes (" + provider + ")", ct => ScriptAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "architect-seed-replicas", "Replicas seeding the architect at the same time, including for a new tenant, leave exactly one agent and one skill asset and raise no unique constraint failure (" + provider + ")", ct => SeedReplicasAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "preview", "Compile preview of a draft revision shows its new asset's placed path, previews another environment's deployment, and keeps secrets redacted (" + provider + ")", ct => PreviewAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "playground", "Playground runs execute an agent's draft revision on an ephemeral draft-environment deployment, from an agent or from a studio draft, without publishing; apps cannot select the draft environment (" + provider + ")", ct => PlaygroundAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "deploy-dev", "From an empty draft to a running dev app: agent, dev deployment, and app drafted, approved, applied, and answering at its app URL through the gateway; a pinned dev deployment moves to the new revision (" + provider + ")", ct => DeployDevAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "tenancy-rbac", "Another tenant's drafts and architect prompts are 404 or absent; a user without design permissions gets 403 on drafts, architect prompts, and the 0.2.0 routes for capabilities, file spaces, fan-out groups, assets, and apps (" + provider + ")", ct => TenancyAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "build-deploy-chat", "From an empty tenant: an architect on the guided prompt builds a two-agent app through draft tools, a person approves, the app answers two turns at its URL and writes a file, which downloads; the app is promoted to staging and rolled back (" + provider + ")", ct => BuildDeployChatAsync(provider, ct)));
                suites.Add(new TestSuiteDescriptor(id, "Studio drafts (" + provider + ")", cases));
            }
            return suites;
        }

        #endregion

        #region Private-Methods

        private static string T(TestServerHost host)
        {
            return "/v1.0/api/tenants/" + host.TenantId;
        }

        private static string D(TestServerHost host)
        {
            return T(host) + "/studio/drafts";
        }

        private static void Code(TestResponse response, int status, string code, string what)
        {
            Assert.Equal(status, response.StatusCode, what + " status (" + response.Body + ")");
            Assert.True(response.Body.Contains(code, StringComparison.Ordinal), what + " answers " + code + ": " + response.Body);
        }

        private static string AgentYaml(string name, string description)
        {
            return "apiVersion: garrison/v1\nkind: Agent\nmetadata:\n  name: " + name + "\n  description: " + description + "\nspec:\n  displayName: " + name + "\n";
        }

        private static async Task<List<Agent>> AppAsync(TestServerHost host, string prefix, CancellationToken token)
        {
            List<Agent> agents = new List<Agent>();
            foreach (string role in new[] { "orchestrator", "researcher", "writer" })
            {
                agents.Add(await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, T(host) + "/agents", new Agent { Name = prefix + "-" + role, Description = "The " + role + "." }, 201, token).ConfigureAwait(false));
            }
            AgenticApp app = new AgenticApp
            {
                Name = prefix, EntryAgentId = agents[0].Name,
                Members = agents.Select(a => new AgenticAppMember { AgentId = a.Name }).ToList(),
                Edges = new List<AgenticAppEdge>
                {
                    new AgenticAppEdge { CallerAgentId = agents[0].Name, CalleeAgentId = agents[1].Name },
                    new AgenticAppEdge { CallerAgentId = agents[1].Name, CalleeAgentId = agents[2].Name }
                }
            };
            await HttpTestHelpers.SendAsync<AgenticApp>(host.AdminClient, HttpMethod.Post, T(host) + "/apps", app, 201, token).ConfigureAwait(false);
            return agents;
        }

        private static async Task<StudioDraft> PutAsync(HttpClient client, string path, int version, string document, CancellationToken token)
        {
            return await HttpTestHelpers.SendAsync<StudioDraft>(client, HttpMethod.Put, path, new StudioDraftItemRequest { Version = version, Document = document }, 200, token).ConfigureAwait(false);
        }

        private static async Task<User> UserAsync(TestServerHost host, string email, string role, CancellationToken token)
        {
            await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, T(host) + "/users", new UserRequest { Email = email, Password = "password123" }, 201, token).ConfigureAwait(false);
            User user = Assert.NotNull((await host.Server.Context.Database.Users.EnumerateAsync(host.TenantId, new EnumerationQuery { MaxResults = 1000 }, token).ConfigureAwait(false)).Objects.FirstOrDefault(u => u.Email == email), email);
            await HttpTestHelpers.SendAsync<UserRoleAssignment>(host.AdminClient, HttpMethod.Post, T(host) + "/user-role-assignments", new AssignmentRequest { UserId = user.Id, RoleName = role }, 201, token).ConfigureAwait(false);
            return user;
        }

        private static async Task DraftsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                StudioDraft draft = await HttpTestHelpers.SendAsync<StudioDraft>(host.AdminClient, HttpMethod.Post, D(host), new StudioDraftCreateRequest { Title = "Empty" }, 201, token).ConfigureAwait(false);
                Assert.True(draft.Id.StartsWith("sdr_", StringComparison.Ordinal) && draft.Version == 1 && draft.Status == StudioDraftStatusEnum.Open && draft.Items.Count == 0, "New draft: " + Serializer.Serialize(draft));
                string item = D(host) + "/" + draft.Id + "/items/Agent/drafted";
                StudioDraft one = await PutAsync(host.AdminClient, item, 1, AgentYaml("drafted", "First."), token).ConfigureAwait(false);
                Assert.True(one.Version == 2 && one.Items.Count == 1 && one.Items[0].BaseHash == null, "Item stored; nothing live to base it on");
                TestResponse stale = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Put, item, new StudioDraftItemRequest { Version = 1, Document = AgentYaml("drafted", "Stale.") }, token).ConfigureAwait(false);
                Code(stale, 409, "DraftVersionConflict", "Stale version");
                Assert.True(stale.Body.Contains("version 2", StringComparison.Ordinal), "The conflict names the current version: " + stale.Body);
                StudioDraft two = await PutAsync(host.AdminClient, item, 2, AgentYaml("drafted", "Second."), token).ConfigureAwait(false);
                Assert.True(two.Version == 3 && two.Items.Count == 1 && two.Items[0].Document.Contains("Second.", StringComparison.Ordinal), "Replaced, not duplicated");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Put, D(host) + "/" + draft.Id + "/items/Agent/other", new StudioDraftItemRequest { Version = 3, Document = AgentYaml("drafted", "Wrong name.") }, token).ConfigureAwait(false), 400, "DocumentMismatch", "Name must match the path");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Put, D(host) + "/" + draft.Id + "/items/Secret/key", new StudioDraftItemRequest { Version = 3, Document = "kind: Secret" }, token).ConfigureAwait(false), 400, "UnsupportedKind", "Secrets never go in drafts");

                // Two writers racing on one version: exactly one wins.
                Task<TestResponse> a = HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Put, D(host) + "/" + draft.Id + "/items/Agent/race-a", new StudioDraftItemRequest { Version = 3, Document = AgentYaml("race-a", "A.") }, token);
                Task<TestResponse> b = HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Put, D(host) + "/" + draft.Id + "/items/Agent/race-b", new StudioDraftItemRequest { Version = 3, Document = AgentYaml("race-b", "B.") }, token);
                TestResponse[] raced = await Task.WhenAll(a, b).ConfigureAwait(false);
                Assert.True(raced.Count(r => r.StatusCode == 200) == 1 && raced.Count(r => r.StatusCode == 409) == 1, "One of two concurrent writes wins: " + raced[0].StatusCode + ", " + raced[1].StatusCode);

                StudioDraft current = await HttpTestHelpers.SendAsync<StudioDraft>(host.AdminClient, HttpMethod.Get, D(host) + "/" + draft.Id, null, 200, token).ConfigureAwait(false);
                StudioDraft removed = await HttpTestHelpers.SendAsync<StudioDraft>(host.AdminClient, HttpMethod.Delete, item + "?version=" + current.Version, null, 200, token).ConfigureAwait(false);
                Assert.True(removed.Items.All(i => i.Name != "drafted") && removed.Version == current.Version + 1, "Removed");
                EnumerationResult<StudioDraft> mine = await HttpTestHelpers.SendAsync<EnumerationResult<StudioDraft>>(host.AdminClient, HttpMethod.Get, D(host) + "?mine=true", null, 200, token).ConfigureAwait(false);
                Assert.True(mine.Objects.Any(d => d.Id == draft.Id), "Listed as mine");
                EnumerationResult<StudioDraft> applied = await HttpTestHelpers.SendAsync<EnumerationResult<StudioDraft>>(host.AdminClient, HttpMethod.Get, D(host) + "?status=Applied", null, 200, token).ConfigureAwait(false);
                Assert.True(applied.Objects.All(d => d.Status == StudioDraftStatusEnum.Applied) && applied.Objects.All(d => d.Id != draft.Id), "The status filter leaves out open drafts");
                Assert.Equal(204, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, D(host) + "/" + draft.Id, null, token).ConfigureAwait(false)).StatusCode, "Discarded");
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, D(host) + "/" + draft.Id, null, token).ConfigureAwait(false)).StatusCode, "Gone");
            }
        }

        private static async Task DiffAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                await AppAsync(host, "dif", token).ConfigureAwait(false);
                StudioDraft draft = await HttpTestHelpers.SendAsync<StudioDraft>(host.AdminClient, HttpMethod.Post, D(host), new StudioDraftCreateRequest { FromApp = "dif" }, 201, token).ConfigureAwait(false);
                Assert.True(draft.TargetApp == "dif" && draft.Items.Count(i => i.Kind == "Agent") == 3 && draft.Items.Any(i => i.Kind == "AgenticApp" && i.Name == "dif") && draft.Items.All(i => i.BaseHash != null), "From the app with its agents: " + String.Join(", ", draft.Items.Select(i => i.Kind + "/" + i.Name)));
                StudioDraftDiff same = await HttpTestHelpers.SendAsync<StudioDraftDiff>(host.AdminClient, HttpMethod.Get, D(host) + "/" + draft.Id + "/diff", null, 200, token).ConfigureAwait(false);
                Assert.True(same.Valid && same.Items.All(i => i.Change == "Unchanged" && !i.Stale), "An untouched draft is unchanged: " + Serializer.Serialize(same));

                StudioDraft edited = await PutAsync(host.AdminClient, D(host) + "/" + draft.Id + "/items/Agent/dif-writer", draft.Version, AgentYaml("dif-writer", "Writes plainly."), token).ConfigureAwait(false);
                edited = await PutAsync(host.AdminClient, D(host) + "/" + draft.Id + "/items/Agent/dif-editor", edited.Version, AgentYaml("dif-editor", "Edits drafts."), token).ConfigureAwait(false);
                StudioDraftDiff diff = await HttpTestHelpers.SendAsync<StudioDraftDiff>(host.AdminClient, HttpMethod.Get, D(host) + "/" + draft.Id + "/diff", null, 200, token).ConfigureAwait(false);
                StudioDraftDiffItem update = diff.Items.Single(i => i.Name == "dif-writer");
                Assert.True(update.Change == "Update" && update.Changes != null && update.Changes.Count > 0, "The writer is an update with field changes: " + Serializer.Serialize(update));
                Assert.Equal("Create", diff.Items.Single(i => i.Name == "dif-editor").Change, "The editor is new");

                StudioDraftDiff validated = await HttpTestHelpers.SendAsync<StudioDraftDiff>(host.AdminClient, HttpMethod.Post, D(host) + "/" + draft.Id + "/validate", null, 200, token).ConfigureAwait(false);
                string bundle = String.Join("---\n", edited.Items.Where(i => i.Operation == StudioDraftOperationEnum.Upsert).Select(i => i.Document));
                ManifestApply dryRun;
                using (StringContent content = new StringContent(bundle, System.Text.Encoding.UTF8, "application/yaml"))
                using (HttpResponseMessage response = await host.AdminClient.PostAsync(T(host) + "/manifests/apply?dryRun=true", content, token).ConfigureAwait(false))
                {
                    string body = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                    Assert.Equal(200, (int)response.StatusCode, "Dry run: " + body);
                    dryRun = Assert.NotNull(Serializer.Deserialize<ManifestApply>(body), "Dry run body");
                }
                foreach (ManifestApplyItem planned in dryRun.Items)
                {
                    ManifestApplyResultEnum outcome = planned.PlannedResult ?? planned.Result;
                    string expected = outcome == ManifestApplyResultEnum.Created ? "Create" : outcome == ManifestApplyResultEnum.Updated ? "Update" : outcome == ManifestApplyResultEnum.Failed ? "Failed" : "Unchanged";
                    Assert.Equal(expected, validated.Items.Single(i => i.Kind == planned.Kind && i.Name == planned.Name).Change, "Validation matches the dry run for " + planned.Kind + "/" + planned.Name);
                }

                StudioDraft broken = await PutAsync(host.AdminClient, D(host) + "/" + draft.Id + "/items/Deployment/dif-broken", edited.Version, "apiVersion: garrison/v1\nkind: Deployment\nmetadata:\n  name: dif-broken\nspec:\n  agent: no-such-agent\n  harnessProfile: no-such-profile\n", token).ConfigureAwait(false);
                StudioDraftDiff invalid = await HttpTestHelpers.SendAsync<StudioDraftDiff>(host.AdminClient, HttpMethod.Post, D(host) + "/" + broken.Id + "/validate", null, 200, token).ConfigureAwait(false);
                Assert.True(!invalid.Valid && invalid.Items.Single(i => i.Name == "dif-broken").Change == "Failed", "A broken document fails validation: " + Serializer.Serialize(invalid));
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, D(host) + "/" + broken.Id + "/request-apply", new StudioDraftVersionRequest { Version = broken.Version }, token).ConfigureAwait(false), 400, "DraftInvalid", "An invalid draft cannot ask for approval");
            }
        }

        private static async Task GraphAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                await AppAsync(host, "grf", token).ConfigureAwait(false);
                StudioDraft draft = await HttpTestHelpers.SendAsync<StudioDraft>(host.AdminClient, HttpMethod.Post, D(host), new StudioDraftCreateRequest { Title = "Graph" }, 201, token).ConfigureAwait(false);
                string ops = D(host) + "/" + draft.Id + "/graph-operations";
                int version = draft.Version;
                async Task<StudioGraph> Op(StudioGraphOperationRequest request)
                {
                    request.Version = version;
                    StudioGraph result = await HttpTestHelpers.SendAsync<StudioGraph>(host.AdminClient, HttpMethod.Post, ops, request, 200, token).ConfigureAwait(false);
                    version = result.Version;
                    return result;
                }
                // The draft does not hold the app yet: the first change starts from the live app.
                StudioGraph graph = await Op(new StudioGraphOperationRequest { Operation = StudioGraphOperationEnum.AddMember, App = "grf", Agent = "grf-editor", Role = "Edits" }).ConfigureAwait(false);
                Assert.True(graph.Nodes.Any(n => n.Key == "AgenticApp/grf" && n.InDraft) && graph.Nodes.Single(n => n.Key == "Agent/grf-orchestrator").EntryOf.Contains("grf") && graph.Edges.Count == 2 && graph.Nodes.Any(n => n.Name == "grf-editor"), "Live app copied with the new member: " + Serializer.Serialize(graph));
                graph = await Op(new StudioGraphOperationRequest { Operation = StudioGraphOperationEnum.Connect, App = "grf", From = "grf-writer", To = "grf-editor", FanOut = false }).ConfigureAwait(false);
                Assert.True(graph.Edges.Any(e => e.From == "grf-writer" && e.To == "grf-editor" && !e.FanOut), "Connected");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, ops, new StudioGraphOperationRequest { Version = version, Operation = StudioGraphOperationEnum.Connect, App = "grf", From = "grf-writer", To = "nobody" }, token).ConfigureAwait(false), 400, "NotAMember", "Edges connect members");
                graph = await Op(new StudioGraphOperationRequest { Operation = StudioGraphOperationEnum.SetEntry, App = "grf", Agent = "grf-researcher" }).ConfigureAwait(false);
                Assert.True(graph.Nodes.Single(n => n.Name == "grf-researcher").EntryOf.Contains("grf") && !graph.Nodes.Single(n => n.Name == "grf-orchestrator").EntryOf.Contains("grf"), "Entry moved");
                graph = await Op(new StudioGraphOperationRequest { Operation = StudioGraphOperationEnum.Disconnect, App = "grf", From = "grf-orchestrator", To = "grf-researcher" }).ConfigureAwait(false);
                graph = await Op(new StudioGraphOperationRequest { Operation = StudioGraphOperationEnum.RemoveMember, App = "grf", Agent = "grf-orchestrator" }).ConfigureAwait(false);
                Assert.True(!graph.Edges.Any(e => e.From == "grf-orchestrator" || e.To == "grf-orchestrator") && graph.Nodes.All(n => n.Name != "grf-orchestrator"), "Member and its edges removed: " + Serializer.Serialize(graph));
                graph = await Op(new StudioGraphOperationRequest { Operation = StudioGraphOperationEnum.MoveNode, NodeKey = "Agent/grf-writer", X = 120, Y = 80 }).ConfigureAwait(false);
                StudioGraphEdge chain = graph.Edges.Single(e => e.From == "grf-researcher" && e.To == "grf-writer");
                Assert.True(chain.Depth == 2 && graph.Edges.Single(e => e.From == "grf-writer").Depth == 1, "Edge depth counts the calls below: " + Serializer.Serialize(graph.Edges));
                StudioGraphNode moved = graph.Nodes.Single(n => n.Key == "Agent/grf-writer");
                Assert.True(moved.X == 120 && moved.Y == 80, "Placed");

                StudioDraft after = await HttpTestHelpers.SendAsync<StudioDraft>(host.AdminClient, HttpMethod.Get, D(host) + "/" + draft.Id, null, 200, token).ConfigureAwait(false);
                StudioDraftItem app = after.Items.Single(i => i.Kind == "AgenticApp");
                Assert.True(app.Document.Contains("entry: grf-researcher", StringComparison.Ordinal) && app.Document.Contains("grf-editor", StringComparison.Ordinal), "The app document carries the graph: " + app.Document);
                StudioGraph read = await HttpTestHelpers.SendAsync<StudioGraph>(host.AdminClient, HttpMethod.Get, D(host) + "/" + draft.Id + "/graph", null, 200, token).ConfigureAwait(false);
                Assert.Equal(Serializer.Serialize(graph), Serializer.Serialize(read), "Reading the graph returns what the last operation returned");
            }
        }

        private static async Task ApplyFailureAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                StudioDraft draft = await HttpTestHelpers.SendAsync<StudioDraft>(host.AdminClient, HttpMethod.Post, D(host), new StudioDraftCreateRequest { Title = "Loop" }, 201, token).ConfigureAwait(false);
                string path = D(host) + "/" + draft.Id + "/items/";
                draft = await PutAsync(host.AdminClient, path + "Agent/afl-entry", draft.Version, AgentYaml("afl-entry", "Talks to people."), token).ConfigureAwait(false);
                draft = await PutAsync(host.AdminClient, path + "Agent/afl-helper", draft.Version, AgentYaml("afl-helper", "Helps."), token).ConfigureAwait(false);
                draft = await PutAsync(host.AdminClient, path + "Deployment/afl-entry-dev", draft.Version, "apiVersion: garrison/v1\nkind: Deployment\nmetadata:\n  name: afl-entry-dev\nspec:\n  agent: afl-entry\n  harnessProfile: builtin/fake\n  artifactGlobs: ['out/**']\n", token).ConfigureAwait(false);

                // A deployment the write would refuse (artifact globs without a store) is refused before anyone is asked.
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, D(host) + "/" + draft.Id + "/request-apply", new StudioDraftVersionRequest { Version = draft.Version }, token).ConfigureAwait(false), 400, "DraftInvalid", "Validation refuses what the write would refuse");
                draft = await PutAsync(host.AdminClient, path + "Deployment/afl-entry-dev", draft.Version, "apiVersion: garrison/v1\nkind: Deployment\nmetadata:\n  name: afl-entry-dev\nspec:\n  agent: afl-entry\n  harnessProfile: builtin/fake\n", token).ConfigureAwait(false);

                // An app whose calls loop: only the app check while writing catches it.
                draft = await PutAsync(host.AdminClient, path + "AgenticApp/afl-app", draft.Version, "apiVersion: garrison/v1\nkind: AgenticApp\nmetadata:\n  name: afl-app\nspec:\n  entry: afl-entry\n  members: [ { agent: afl-entry }, { agent: afl-helper } ]\n  edges: [ { from: afl-entry, to: afl-helper }, { from: afl-helper, to: afl-entry } ]\n  environments: [ { environment: dev, deployment: afl-entry-dev } ]\n", token).ConfigureAwait(false);
                Approval approval = await HttpTestHelpers.SendAsync<Approval>(host.AdminClient, HttpMethod.Post, D(host) + "/" + draft.Id + "/request-apply", new StudioDraftVersionRequest { Version = draft.Version }, 201, token).ConfigureAwait(false);
                TestResponse decided = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/approvals/" + approval.Id + "/decide", new ApprovalDecideRequest { Decision = ApprovalDecisionEnum.Allow }, token).ConfigureAwait(false);
                Code(decided, 409, "DraftInvalid", "The apply fails");
                Assert.True(decided.Body.Contains("AgenticApp/afl-app", StringComparison.Ordinal) && decided.Body.Contains("nothing was changed", StringComparison.Ordinal), "The refusal names the failing item and says nothing changed: " + decided.Body);
                foreach (string agent in new[] { "afl-entry", "afl-helper" })
                {
                    Assert.Equal(404, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, T(host) + "/agents/" + agent, null, token).ConfigureAwait(false)).StatusCode, "Nothing live: " + agent);
                }
                Approval after = await HttpTestHelpers.SendAsync<Approval>(host.AdminClient, HttpMethod.Get, T(host) + "/approvals/" + approval.Id, null, 200, token).ConfigureAwait(false);
                Assert.True(after.Status == ApprovalStatusEnum.Cancelled && (after.Reason ?? "").Contains("afl-app", StringComparison.Ordinal), "The approval is cancelled with the reason: " + Serializer.Serialize(after));
                StudioDraft reopened = await HttpTestHelpers.SendAsync<StudioDraft>(host.AdminClient, HttpMethod.Get, D(host) + "/" + draft.Id, null, 200, token).ConfigureAwait(false);
                Assert.Equal(StudioDraftStatusEnum.Open, reopened.Status, "The draft is open again");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/approvals/" + approval.Id + "/decide", new ApprovalDecideRequest { Decision = ApprovalDecisionEnum.Allow }, token).ConfigureAwait(false), 409, "ApprovalNotPending", "A second decision is refused as not pending");

                // Fixed, it applies.
                reopened = await PutAsync(host.AdminClient, path + "AgenticApp/afl-app", reopened.Version, "apiVersion: garrison/v1\nkind: AgenticApp\nmetadata:\n  name: afl-app\nspec:\n  entry: afl-entry\n  members: [ { agent: afl-entry }, { agent: afl-helper } ]\n  edges: [ { from: afl-entry, to: afl-helper } ]\n  environments: [ { environment: dev, deployment: afl-entry-dev } ]\n", token).ConfigureAwait(false);
                Approval again = await HttpTestHelpers.SendAsync<Approval>(host.AdminClient, HttpMethod.Post, D(host) + "/" + draft.Id + "/request-apply", new StudioDraftVersionRequest { Version = reopened.Version }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<Approval>(host.AdminClient, HttpMethod.Post, T(host) + "/approvals/" + again.Id + "/decide", new ApprovalDecideRequest { Decision = ApprovalDecisionEnum.Allow }, 200, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Get, T(host) + "/agents/afl-entry", null, 200, token).ConfigureAwait(false);
            }
        }

        private static async Task ApplyAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                await AppAsync(host, "apl", token).ConfigureAwait(false);
                StudioDraft draft = await HttpTestHelpers.SendAsync<StudioDraft>(host.AdminClient, HttpMethod.Post, D(host), new StudioDraftCreateRequest { FromApp = "apl" }, 201, token).ConfigureAwait(false);
                draft = await PutAsync(host.AdminClient, D(host) + "/" + draft.Id + "/items/Agent/apl-writer", draft.Version, AgentYaml("apl-writer", "Writes plainly."), token).ConfigureAwait(false);
                draft = await PutAsync(host.AdminClient, D(host) + "/" + draft.Id + "/items/Agent/apl-editor", draft.Version, AgentYaml("apl-editor", "Edits drafts."), token).ConfigureAwait(false);
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, D(host) + "/" + draft.Id + "/request-apply", new StudioDraftVersionRequest { Version = draft.Version - 1 }, token).ConfigureAwait(false), 409, "DraftVersionConflict", "request-apply checks the version");
                Approval approval = await HttpTestHelpers.SendAsync<Approval>(host.AdminClient, HttpMethod.Post, D(host) + "/" + draft.Id + "/request-apply", new StudioDraftVersionRequest { Version = draft.Version }, 201, token).ConfigureAwait(false);
                Assert.True(approval.Kind == ApprovalKindEnum.DraftApply && approval.DraftId == draft.Id && approval.Status == ApprovalStatusEnum.Pending && approval.Summary != null && approval.Summary.Contains("1 to create, 1 to update", StringComparison.Ordinal), "DraftApply approval: " + Serializer.Serialize(approval));
                StudioDraft pending = await HttpTestHelpers.SendAsync<StudioDraft>(host.AdminClient, HttpMethod.Get, D(host) + "/" + draft.Id, null, 200, token).ConfigureAwait(false);
                Assert.True(pending.Status == StudioDraftStatusEnum.PendingApproval && pending.ApprovalId == approval.Id, "Draft waits for approval");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Put, D(host) + "/" + draft.Id + "/items/Agent/apl-x", new StudioDraftItemRequest { Version = pending.Version, Document = AgentYaml("apl-x", "X.") }, token).ConfigureAwait(false), 409, "DraftNotOpen", "A pending draft is frozen");
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, T(host) + "/agents/apl-editor", null, token).ConfigureAwait(false)).StatusCode, "Nothing changes before approval");
                Agent writerBefore = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Get, T(host) + "/agents/apl-writer", null, 200, token).ConfigureAwait(false);
                Assert.Equal("The writer.", writerBefore.Description ?? String.Empty, "The writer is unchanged before approval");

                await UserAsync(host, "studio-operator@example.com", BuiltInRoles.AgentOperator, token).ConfigureAwait(false);
                using (HttpClient operatorClient = await host.UserClientAsync("studio-operator@example.com", "password123", host.TenantId, token).ConfigureAwait(false))
                {
                    Code(await HttpTestHelpers.SendAsync(operatorClient, HttpMethod.Post, T(host) + "/approvals/" + approval.Id + "/decide", new ApprovalDecideRequest { Decision = ApprovalDecisionEnum.Allow }, token).ConfigureAwait(false), 403, "ApproverLacksPermission", "An approver who cannot apply manifests is refused");
                }
                Approval decided = await HttpTestHelpers.SendAsync<Approval>(host.AdminClient, HttpMethod.Post, T(host) + "/approvals/" + approval.Id + "/decide", new ApprovalDecideRequest { Decision = ApprovalDecisionEnum.Allow, Reason = "Looks right." }, 200, token).ConfigureAwait(false);
                Assert.True(decided.Status == ApprovalStatusEnum.Approved, "Approved");
                Agent editor = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Get, T(host) + "/agents/apl-editor", null, 200, token).ConfigureAwait(false);
                Agent writer = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Get, T(host) + "/agents/apl-writer", null, 200, token).ConfigureAwait(false);
                Assert.True(editor.Description == "Edits drafts." && writer.Description == "Writes plainly.", "Both changes applied");
                Assert.True(!String.IsNullOrEmpty(editor.LatestPublishedRevisionId) && !String.IsNullOrEmpty(writer.LatestPublishedRevisionId), "Applying publishes revisions of the agents it changed");
                StudioDraft applied = await HttpTestHelpers.SendAsync<StudioDraft>(host.AdminClient, HttpMethod.Get, D(host) + "/" + draft.Id, null, 200, token).ConfigureAwait(false);
                Assert.True(applied.Status == StudioDraftStatusEnum.Applied && !String.IsNullOrEmpty(applied.ManifestApplyId), "Draft applied and linked to its manifest apply: " + Serializer.Serialize(applied));

                // A live change after validation makes the draft stale; the approval cannot apply it.
                StudioDraft second = await HttpTestHelpers.SendAsync<StudioDraft>(host.AdminClient, HttpMethod.Post, D(host), new StudioDraftCreateRequest { FromApp = "apl" }, 201, token).ConfigureAwait(false);
                second = await PutAsync(host.AdminClient, D(host) + "/" + second.Id + "/items/Agent/apl-researcher", second.Version, AgentYaml("apl-researcher", "Researches widely."), token).ConfigureAwait(false);
                Approval stale = await HttpTestHelpers.SendAsync<Approval>(host.AdminClient, HttpMethod.Post, D(host) + "/" + second.Id + "/request-apply", new StudioDraftVersionRequest { Version = second.Version }, 201, token).ConfigureAwait(false);
                Agent researcher = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Get, T(host) + "/agents/apl-researcher", null, 200, token).ConfigureAwait(false);
                researcher.Description = "Changed live meanwhile.";
                await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Put, T(host) + "/agents/" + researcher.Id, researcher, 200, token).ConfigureAwait(false);
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/approvals/" + stale.Id + "/decide", new ApprovalDecideRequest { Decision = ApprovalDecisionEnum.Allow }, token).ConfigureAwait(false), 409, "DraftStale", "A moved live record");
                Agent kept = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Get, T(host) + "/agents/" + researcher.Id, null, 200, token).ConfigureAwait(false);
                Assert.Equal("Changed live meanwhile.", kept.Description ?? String.Empty, "The live change stands");
                StudioDraft reopened = await HttpTestHelpers.SendAsync<StudioDraft>(host.AdminClient, HttpMethod.Get, D(host) + "/" + second.Id, null, 200, token).ConfigureAwait(false);
                Assert.True(reopened.Status == StudioDraftStatusEnum.Open && reopened.ApprovalId == null, "The draft is open again: " + Serializer.Serialize(reopened));
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, D(host) + "/" + second.Id + "/request-apply", new StudioDraftVersionRequest { Version = reopened.Version }, token).ConfigureAwait(false), 400, "DraftStale", "Asking again needs a rebase");

                // Denying returns the draft to Open.
                StudioDraft third = await HttpTestHelpers.SendAsync<StudioDraft>(host.AdminClient, HttpMethod.Post, D(host), new StudioDraftCreateRequest { Title = "Deny me" }, 201, token).ConfigureAwait(false);
                third = await PutAsync(host.AdminClient, D(host) + "/" + third.Id + "/items/Agent/apl-denied", third.Version, AgentYaml("apl-denied", "Never."), token).ConfigureAwait(false);
                Approval denyMe = await HttpTestHelpers.SendAsync<Approval>(host.AdminClient, HttpMethod.Post, D(host) + "/" + third.Id + "/request-apply", new StudioDraftVersionRequest { Version = third.Version }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<Approval>(host.AdminClient, HttpMethod.Post, T(host) + "/approvals/" + denyMe.Id + "/decide", new ApprovalDecideRequest { Decision = ApprovalDecisionEnum.Deny }, 200, token).ConfigureAwait(false);
                StudioDraft denied = await HttpTestHelpers.SendAsync<StudioDraft>(host.AdminClient, HttpMethod.Get, D(host) + "/" + third.Id, null, 200, token).ConfigureAwait(false);
                Assert.True(denied.Status == StudioDraftStatusEnum.Open, "Denied drafts reopen");
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, T(host) + "/agents/apl-denied", null, token).ConfigureAwait(false)).StatusCode, "Nothing applied on deny");
            }
        }

        private static async Task<string> RunBearerAsync(TestServerHost host, string name, ManagementAccessEnum access, User caller, CancellationToken token)
        {
            Agent agent = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, T(host) + "/agents", new Agent { Name = name }, 201, token).ConfigureAwait(false);
            Deployment deployment = await host.Server.Context.Database.Deployments.CreateAsync(new Deployment { TenantId = host.TenantId, Name = name, AgentId = agent.Id, HarnessProfileId = "hrn_builtin_fake", ManagementAccess = access }, token).ConfigureAwait(false);
            Run run = await host.Server.Context.Database.Runs.CreateAsync(new Run { TenantId = host.TenantId, AgentId = agent.Id, DeploymentId = deployment.Id, Status = RunStatusEnum.Running, CallerType = PrincipalTypeEnum.User, CallerId = caller.Id, LeaseEpoch = 1, LeaseExpiresUtc = DateTime.UtcNow.AddMinutes(5) }, token).ConfigureAwait(false);
            return await host.Server.Context.Authentication.IssueForRunAsync(run, 1, DateTime.UtcNow.AddMinutes(5), token).ConfigureAwait(false);
        }

        private static async Task GrantAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                User designer = await UserAsync(host, "studio-designer@example.com", BuiltInRoles.AgentDeveloper, token).ConfigureAwait(false);
                User viewer = await UserAsync(host, "studio-viewer@example.com", BuiltInRoles.Viewer, token).ConfigureAwait(false);
                string granted = await RunBearerAsync(host, "architect-granted", ManagementAccessEnum.Drafts, designer, token).ConfigureAwait(false);
                string plain = await RunBearerAsync(host, "architect-plain", ManagementAccessEnum.None, designer, token).ConfigureAwait(false);
                string weak = await RunBearerAsync(host, "architect-weak", ManagementAccessEnum.Drafts, viewer, token).ConfigureAwait(false);

                string draftId;
                using (TestMcpClient client = new TestMcpClient())
                {
                    await client.ConnectAsync(host, granted, token).ConfigureAwait(false);
                    Assert.True((await client.ToolsAsync(token).ConfigureAwait(false)).Tools.Any(t => t.Name == "garrison_studio_put_item"), "The granted run sees the studio tools");
                    EnumerationResult<AgentAsset> assets = await client.CallAsync<EnumerationResult<AgentAsset>>("garrison_list_agent_assets", new { }, token).ConfigureAwait(false);
                    Assert.True(assets.Objects.Any(x => x.Name == "agent-architect-skills"), "A studio run reads agent assets (AD2.7)");
                    await client.ExpectErrorAsync("garrison_create_agent_asset", new { configuration = new AgentAsset { Name = "studio-made", Kind = AgentAssetKindEnum.Skill } }, "Forbidden", token).ConfigureAwait(false);
                    StudioDraft draft = await client.CallAsync<StudioDraft>("garrison_studio_create_draft", new { title = "Architect draft" }, token).ConfigureAwait(false);
                    draftId = draft.Id;
                    Assert.Equal(designer.Id, draft.OwnerUserId ?? String.Empty, "The draft belongs to the person the run works for");
                    draft = await client.CallAsync<StudioDraft>("garrison_studio_put_item", new { draftId, version = draft.Version, kind = "Agent", name = "mcp-researcher", document = AgentYaml("mcp-researcher", "Researches.") }, token).ConfigureAwait(false);
                    draft = await client.CallAsync<StudioDraft>("garrison_studio_put_item", new { draftId, version = draft.Version, kind = "Agent", name = "mcp-lead", document = AgentYaml("mcp-lead", "Leads.") }, token).ConfigureAwait(false);
                    StudioGraph graph = await client.CallAsync<StudioGraph>("garrison_studio_graph_operation", new { draftId, version = draft.Version, graphOperation = "AddMember", app = "mcp-app", agent = "mcp-lead" }, token).ConfigureAwait(false);
                    graph = await client.CallAsync<StudioGraph>("garrison_studio_graph_operation", new { draftId, version = graph.Version, graphOperation = "AddMember", app = "mcp-app", agent = "mcp-researcher" }, token).ConfigureAwait(false);
                    graph = await client.CallAsync<StudioGraph>("garrison_studio_graph_operation", new { draftId, version = graph.Version, graphOperation = "Connect", app = "mcp-app", from = "mcp-lead", to = "mcp-researcher" }, token).ConfigureAwait(false);
                    StudioDraftDiff diff = await client.CallAsync<StudioDraftDiff>("garrison_studio_validate", new { draftId }, token).ConfigureAwait(false);
                    Assert.True(diff.Valid && diff.Items.Count == 3 && diff.Items.All(i => i.Change == "Create"), "Three creates: " + Serializer.Serialize(diff));
                    Approval approval = await client.CallAsync<Approval>("garrison_studio_request_apply", new { draftId, version = graph.Version }, token).ConfigureAwait(false);
                    Assert.True(approval.Kind == ApprovalKindEnum.DraftApply && approval.Status == ApprovalStatusEnum.Pending, "Approval requested");
                    await client.ExpectErrorAsync("garrison_decide_approval", new { approvalId = approval.Id, decision = "Allow" }, "Forbidden", token).ConfigureAwait(false);
                    await client.ExpectErrorAsync("garrison_apply_manifest", new { manifest = AgentYaml("mcp-direct", "Direct.") }, "Forbidden", token).ConfigureAwait(false);
                    await client.ExpectErrorAsync("garrison_delete_agent", new { agent = "architect-plain" }, "Forbidden", token).ConfigureAwait(false);
                }
                using (HttpClient run = new HttpClient { BaseAddress = host.AdminClient.BaseAddress })
                {
                    run.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", granted);
                    Assert.Equal(200, (await HttpTestHelpers.SendAsync(run, HttpMethod.Get, D(host) + "/" + draftId, null, token).ConfigureAwait(false)).StatusCode, "The granted run reads drafts over REST too");
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(run, HttpMethod.Delete, D(host) + "/" + draftId, null, token).ConfigureAwait(false)).StatusCode, "It cannot discard drafts");
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(run, HttpMethod.Get, T(host) + "/secrets", null, token).ConfigureAwait(false)).StatusCode, "It cannot read secrets");
                    StudioDraft draft = await HttpTestHelpers.SendAsync<StudioDraft>(host.AdminClient, HttpMethod.Get, D(host) + "/" + draftId, null, 200, token).ConfigureAwait(false);
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(run, HttpMethod.Post, T(host) + "/approvals/" + draft.ApprovalId + "/decide", new ApprovalDecideRequest { Decision = ApprovalDecisionEnum.Allow }, token).ConfigureAwait(false)).StatusCode, "A run cannot decide its own draft");
                }
                using (TestMcpClient client = new TestMcpClient())
                {
                    await client.ConnectAsync(host, plain, token).ConfigureAwait(false);
                    Assert.True((await client.ToolsAsync(token).ConfigureAwait(false)).Tools.All(t => !t.Name.StartsWith("garrison_studio_", StringComparison.Ordinal)), "A run without the grant does not see the studio tools");
                    await client.ExpectErrorAsync("garrison_studio_create_draft", new { title = "No grant" }, "Forbidden", token).ConfigureAwait(false);
                    await client.ExpectErrorAsync("garrison_studio_get_draft", new { draftId }, "Forbidden", token).ConfigureAwait(false);
                }
                using (TestMcpClient client = new TestMcpClient())
                {
                    await client.ConnectAsync(host, weak, token).ConfigureAwait(false);
                    await client.ExpectErrorAsync("garrison_studio_create_draft", new { title = "Viewer's architect" }, "Forbidden", token).ConfigureAwait(false);
                    await client.ExpectErrorAsync("garrison_studio_get_draft", new { draftId }, "NotFound", token).ConfigureAwait(false);
                }

                // The person approves; the run never could.
                StudioDraft pending = await HttpTestHelpers.SendAsync<StudioDraft>(host.AdminClient, HttpMethod.Get, D(host) + "/" + draftId, null, 200, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<Approval>(host.AdminClient, HttpMethod.Post, T(host) + "/approvals/" + pending.ApprovalId + "/decide", new ApprovalDecideRequest { Decision = ApprovalDecisionEnum.Allow }, 200, token).ConfigureAwait(false);
                AgenticApp app = await HttpTestHelpers.SendAsync<AgenticApp>(host.AdminClient, HttpMethod.Get, T(host) + "/apps/mcp-app", null, 200, token).ConfigureAwait(false);
                Assert.True(app.Members.Count == 2 && app.Edges.Count == 1, "The app the architect drafted is live after approval");
            }
        }

        private static async Task ChannelAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                StudioDraft draft = await HttpTestHelpers.SendAsync<StudioDraft>(host.AdminClient, HttpMethod.Post, D(host), new StudioDraftCreateRequest { Title = "Live" }, 201, token).ConfigureAwait(false);
                using (ClientWebSocket socket = new ClientWebSocket())
                {
                    string bearer;
                    using (HttpClient login = await host.UserClientAsync("admin@garrison", "password", host.TenantId, token).ConfigureAwait(false))
                    {
                        bearer = login.DefaultRequestHeaders.Authorization!.Parameter!;
                    }
                    await socket.ConnectAsync(new Uri(host.BaseUrl.Replace("http://", "ws://", StringComparison.Ordinal) + "/v1.0/ws?token=" + Uri.EscapeDataString(bearer)), token).ConfigureAwait(false);
                    await socket.SendAsync(Encoding.UTF8.GetBytes("{\"type\":\"subscribe\",\"channel\":\"studio-draft:" + draft.Id + "\"}"), WebSocketMessageType.Text, true, token).ConfigureAwait(false);
                    await ReceiveUntilAsync(socket, "studio-draft.changed", "\"version\":1", token).ConfigureAwait(false);
                    using (TestMcpClient client = new TestMcpClient())
                    {
                        await client.ConnectAsync(host, null, token).ConfigureAwait(false);
                        await client.CallAsync<StudioDraft>("garrison_studio_put_item", new { draftId = draft.Id, version = 1, kind = "Agent", name = "live-agent", document = AgentYaml("live-agent", "Live.") }, token).ConfigureAwait(false);
                    }
                    string changed = await ReceiveUntilAsync(socket, "studio-draft.changed", "\"version\":2", token).ConfigureAwait(false);
                    Assert.True(changed.Contains("live-agent", StringComparison.Ordinal) && changed.Contains("\"graph\"", StringComparison.Ordinal), "The change names the item and carries the graph: " + changed);
                }
            }
        }

        private static async Task SeedAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                Agent architect = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Get, T(host) + "/agents/agent-architect", null, 200, token).ConfigureAwait(false);
                Assert.True(architect.IsProtected && !String.IsNullOrEmpty(architect.LatestPublishedRevisionId), "Seeded, protected, with a published revision");
                AgentRevision revision = await HttpTestHelpers.SendAsync<AgentRevision>(host.AdminClient, HttpMethod.Get, T(host) + "/agents/" + architect.Id + "/revisions/" + architect.LatestPublishedRevisionId, null, 200, token).ConfigureAwait(false);
                AgentAsset skill = await HttpTestHelpers.SendAsync<AgentAsset>(host.AdminClient, HttpMethod.Get, T(host) + "/agent-assets/agent-architect-skills", null, 200, token).ConfigureAwait(false);
                Assert.True(revision.AssetPins.Any(p => p.AssetId == skill.Id) && skill.Kind == AgentAssetKindEnum.Skill, "The revision pins the skill asset");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, T(host) + "/agents/" + architect.Id, null, token).ConfigureAwait(false), 409, "Protected", "The architect cannot be deleted");
                foreach (string key in new[] { "agent-architect", "agent-architect-guided", "agent-architect-design", "agent-architect-runtime" })
                {
                    string id = "tpl_builtin_" + key.Replace("-", "_");
                    PromptTemplate template = await HttpTestHelpers.SendAsync<PromptTemplate>(host.AdminClient, HttpMethod.Get, T(host) + "/prompt-templates/" + id, null, 200, token).ConfigureAwait(false);
                    Assert.True(template.IsBuiltIn && template.Name == "builtin/" + key, key + " is built in");
                    Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Put, T(host) + "/prompt-templates/" + id, new PromptTemplateRequest { Name = template.Name, Kind = template.Kind, Content = "changed" }, token).ConfigureAwait(false), 409, "BuiltInImmutable", key + " cannot be edited");
                    Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, T(host) + "/prompt-templates/" + id, null, token).ConfigureAwait(false), 409, "BuiltInImmutable", key + " cannot be deleted");
                    PromptTemplate reset = await HttpTestHelpers.SendAsync<PromptTemplate>(host.AdminClient, HttpMethod.Post, T(host) + "/prompt-templates/" + id + "/reset", null, 200, token).ConfigureAwait(false);
                    Assert.Equal(template.CurrentVersion, reset.CurrentVersion, key + " reset is a no-op when it matches the release");
                }
                Tenant other = await HttpTestHelpers.SendAsync<Tenant>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants", new TenantRequest { Name = "Architect Other" }, 201, token).ConfigureAwait(false);
                Agent theirs = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Get, "/v1.0/api/tenants/" + other.Id + "/agents/agent-architect", null, 200, token).ConfigureAwait(false);
                Assert.True(theirs.Id != architect.Id && theirs.IsProtected, "A new tenant gets its own architect");
            }
        }

        private static async Task ArchitectPromptAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                string prompts = T(host) + "/prompt-templates";
                List<ArchitectPromptEntry> catalog = (await HttpTestHelpers.SendAsync<EnumerationResult<ArchitectPromptEntry>>(host.AdminClient, HttpMethod.Get, T(host) + "/studio/architect-prompts?maxResults=1000", null, 200, token).ConfigureAwait(false)).Objects;
                Assert.True(catalog.Count >= 2 && catalog[0].Name == "builtin/agent-architect" && catalog[0].IsDefault && catalog[1].Name == "builtin/agent-architect-guided", "Built-ins first: " + String.Join(", ", catalog.Select(c => c.Name)));

                PromptTemplate clone = await HttpTestHelpers.SendAsync<PromptTemplate>(host.AdminClient, HttpMethod.Post, prompts + "/tpl_builtin_agent_architect/clone", new CloneRequest { Name = "my-architect" }, 201, token).ConfigureAwait(false);
                Assert.True(clone.CurrentVersion == 1 && clone.BuiltInKey == "agent-architect" && !clone.IsBuiltIn, "Clone at version 1 keeps the built-in key");
                await HttpTestHelpers.SendAsync<PromptTemplate>(host.AdminClient, HttpMethod.Post, prompts, new PromptTemplateRequest { Name = "custom-system", Kind = PromptTemplateKindEnum.System, Content = "Custom system prompt." }, 201, token).ConfigureAwait(false);
                catalog = (await HttpTestHelpers.SendAsync<EnumerationResult<ArchitectPromptEntry>>(host.AdminClient, HttpMethod.Get, T(host) + "/studio/architect-prompts?maxResults=1000", null, 200, token).ConfigureAwait(false)).Objects;
                List<string> order = catalog.Select(c => c.Name).ToList();
                Assert.True(order.IndexOf("my-architect") == 2 && order.IndexOf("custom-system") > 2, "Then clones, then other System templates: " + String.Join(", ", order));

                PromptTemplate edited = await HttpTestHelpers.SendAsync<PromptTemplate>(host.AdminClient, HttpMethod.Put, prompts + "/" + clone.Id, new PromptTemplateRequest { Name = "my-architect", Kind = PromptTemplateKindEnum.System, Content = clone.Content + "\nEDIT-ONE: speak like a ship captain." }, 200, token).ConfigureAwait(false);
                Assert.Equal(2, edited.CurrentVersion, "Edit makes version 2");

                Agent architectAgent = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Get, T(host) + "/agents/agent-architect", null, 200, token).ConfigureAwait(false);
                Deployment architect = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Post, T(host) + "/deployments", new Deployment { Name = "architect", AgentId = architectAgent.Id, HarnessProfileId = "hrn_builtin_fake", ArchitectPromptTemplateId = "my-architect" }, 201, token).ConfigureAwait(false);
                Assert.True(architect.ManagementAccess == ManagementAccessEnum.Drafts && architect.PromptBindings.Any(b => b.Role == "System" && b.TemplateId == clone.Id && b.PinnedVersion == null), "Architect deployment: Drafts access and the clone as its System prompt");
                Deployment defaulted = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Post, T(host) + "/deployments", new Deployment { Name = "architect-default", AgentId = architectAgent.Id, HarnessProfileId = "hrn_builtin_fake" }, 201, token).ConfigureAwait(false);
                Assert.True(defaulted.PromptBindings.Any(b => b.Role == "System" && b.TemplateId == "tpl_builtin_agent_architect"), "No selection binds builtin/agent-architect");

                StudioDraft linked = await HttpTestHelpers.SendAsync<StudioDraft>(host.AdminClient, HttpMethod.Post, D(host), new StudioDraftCreateRequest { Title = "Linked desk" }, 201, token).ConfigureAwait(false);
                Run first = await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/agent-architect/invoke", new InvokeRequest { Input = "Design an app.", DeploymentId = architect.Id, StartConversation = true, StudioDraftId = linked.Id, Wait = true, WaitSeconds = 120 }, 200, token).ConfigureAwait(false);
                StudioDraft afterLink = await HttpTestHelpers.SendAsync<StudioDraft>(host.AdminClient, HttpMethod.Get, D(host) + "/" + linked.Id, null, 200, token).ConfigureAwait(false);
                Assert.True(!String.IsNullOrEmpty(first.ConversationId) && afterLink.ConversationId == first.ConversationId, "Invoking with studioDraftId links the draft to the new conversation");
                Garrison.Core.Compilation.CompilationResult compiled = await host.Server.Context.Get<Garrison.Core.Compilation.InvocationCompiler>().CompileAsync(first, null, token).ConfigureAwait(false);
                Assert.True(Serializer.Serialize(compiled.Spec).Contains("Linked desk", StringComparison.Ordinal) && Serializer.Serialize(compiled.Spec).Contains(linked.Id, StringComparison.Ordinal), "The architect's prompt names the linked draft, rendered from its template");
                Run firstRead = await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Get, T(host) + "/runs/" + first.Id, null, 200, token).ConfigureAwait(false);
                Assert.True(firstRead.TemplateVersions.Any(v => v.TemplateId == clone.Id && v.Version == 2), "The run records the clone at version 2: " + Serializer.Serialize(firstRead.TemplateVersions));

                await HttpTestHelpers.SendAsync<PromptTemplate>(host.AdminClient, HttpMethod.Put, prompts + "/" + clone.Id, new PromptTemplateRequest { Name = "my-architect", Kind = PromptTemplateKindEnum.System, Content = clone.Content + "\nEDIT-TWO: be brief." }, 200, token).ConfigureAwait(false);
                CompilePreviewResponse preview = await HttpTestHelpers.SendAsync<CompilePreviewResponse>(host.AdminClient, HttpMethod.Post, T(host) + "/deployments/" + architect.Id + "/compile-preview", new CompilePreviewRequest { Input = "Next turn." }, 200, token).ConfigureAwait(false);
                string rendered = Serializer.Serialize(preview.Spec);
                Assert.True(rendered.Contains("EDIT-TWO", StringComparison.Ordinal) && !rendered.Contains("EDIT-ONE", StringComparison.Ordinal) && preview.TemplateVersions.Any(v => v.TemplateId == clone.Id && v.Version == 3), "The next turn renders version 3 with no redeploy");
                Run second = await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/agent-architect/invoke", new InvokeRequest { Input = "Again.", DeploymentId = architect.Id, Wait = true, WaitSeconds = 120 }, 200, token).ConfigureAwait(false);
                Run secondRead = await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Get, T(host) + "/runs/" + second.Id, null, 200, token).ConfigureAwait(false);
                Assert.True(secondRead.TemplateVersions.Any(v => v.TemplateId == clone.Id && v.Version == 3), "The next run records version 3");

                ArchitectPromptSelection pinned = await HttpTestHelpers.SendAsync<ArchitectPromptSelection>(host.AdminClient, HttpMethod.Put, T(host) + "/studio/architects/" + architect.Id + "/prompt", new ArchitectPromptRequest { ArchitectPromptTemplateId = clone.Id, ArchitectPromptVersion = 2 }, 200, token).ConfigureAwait(false);
                Assert.True(pinned.ArchitectPromptVersion == 2 && pinned.CurrentVersion == 3, "Pinned to version 2");
                await HttpTestHelpers.SendAsync<PromptTemplate>(host.AdminClient, HttpMethod.Put, prompts + "/" + clone.Id, new PromptTemplateRequest { Name = "my-architect", Kind = PromptTemplateKindEnum.System, Content = clone.Content + "\nEDIT-THREE." }, 200, token).ConfigureAwait(false);
                CompilePreviewResponse pinnedPreview = await HttpTestHelpers.SendAsync<CompilePreviewResponse>(host.AdminClient, HttpMethod.Post, T(host) + "/deployments/" + architect.Id + "/compile-preview", new CompilePreviewRequest { Input = "Pinned." }, 200, token).ConfigureAwait(false);
                string pinnedText = Serializer.Serialize(pinnedPreview.Spec);
                Assert.True(pinnedText.Contains("EDIT-ONE", StringComparison.Ordinal) && !pinnedText.Contains("EDIT-THREE", StringComparison.Ordinal), "A pin keeps its text");

                PromptTemplate resetClone = await HttpTestHelpers.SendAsync<PromptTemplate>(host.AdminClient, HttpMethod.Post, prompts + "/" + clone.Id + "/reset", null, 200, token).ConfigureAwait(false);
                PromptTemplate shipped = await HttpTestHelpers.SendAsync<PromptTemplate>(host.AdminClient, HttpMethod.Get, prompts + "/tpl_builtin_agent_architect", null, 200, token).ConfigureAwait(false);
                Assert.True(resetClone.CurrentVersion == 5 && resetClone.Content == shipped.Content, "Reset brings back the shipped body as a new version");
                await HttpTestHelpers.SendAsync<PromptTemplate>(host.AdminClient, HttpMethod.Post, prompts + "/tpl_builtin_agent_architect/reset", null, 200, token).ConfigureAwait(false);

                TestResponse inUse = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, prompts + "/" + clone.Id, null, token).ConfigureAwait(false);
                Code(inUse, 409, "PromptTemplateInUse", "Deleting the selected clone");
                Assert.True(inUse.Body.Contains(architect.Id, StringComparison.Ordinal), "The refusal names the architect deployment");
                Deployment plain = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Post, T(host) + "/deployments", new Deployment { Name = "not-architect", AgentId = (await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, T(host) + "/agents", new Agent { Name = "plain-agent" }, 201, token).ConfigureAwait(false)).Id, HarnessProfileId = "hrn_builtin_fake" }, 201, token).ConfigureAwait(false);
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Put, T(host) + "/studio/architects/" + plain.Id + "/prompt", new ArchitectPromptRequest { ArchitectPromptTemplateId = clone.Id }, token).ConfigureAwait(false), 400, "NotAnArchitectDeployment", "Another agent's deployment");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Put, T(host) + "/studio/architects/" + architect.Id + "/prompt", new ArchitectPromptRequest { ArchitectPromptTemplateId = "builtin/default-task" }, token).ConfigureAwait(false), 400, "InvalidArchitectPrompt", "A Task template");

                using (TestMcpClient client = new TestMcpClient())
                {
                    await client.ConnectAsync(host, null, token).ConfigureAwait(false);
                    ArchitectPromptSelection switched = await client.CallAsync<ArchitectPromptSelection>("garrison_studio_set_architect_prompt", new { deployment = "architect", architectPromptTemplateId = "builtin/agent-architect-guided" }, token).ConfigureAwait(false);
                    Assert.Equal("tpl_builtin_agent_architect_guided", switched.ArchitectPromptTemplateId, "Switched over MCP");
                    List<ArchitectPromptEntry> listed = (await client.CallAsync<EnumerationResult<ArchitectPromptEntry>>("garrison_studio_list_architect_prompts", new { maxResults = 100 }, token).ConfigureAwait(false)).Objects;
                    Assert.True(listed.Single(e => e.Name == "builtin/agent-architect-guided").Deployments.Contains(architect.Id), "The catalog shows which architect uses the guided prompt");
                    PromptTemplate mcpClone = await client.CallAsync<PromptTemplate>("garrison_clone_prompt_template", new { template = "builtin/agent-architect-guided", name = "mcp-architect" }, token).ConfigureAwait(false);
                    PromptTemplate mcpEdited = await client.CallAsync<PromptTemplate>("garrison_update_prompt_template", new { template = "mcp-architect", content = "You are {{agent.name}}. MCP-EDIT.", changeNote = "Shorter." }, token).ConfigureAwait(false);
                    Assert.True(mcpClone.CurrentVersion == 1 && mcpEdited.CurrentVersion == 2, "Clone and update over MCP");
                    PromptRenderResponse mcpRendered = await client.CallAsync<PromptRenderResponse>("garrison_render_prompt_template", new { template = "mcp-architect" }, token).ConfigureAwait(false);
                    Assert.True(mcpRendered.Success && mcpRendered.Rendered.Contains("MCP-EDIT", StringComparison.Ordinal), "Render over MCP");
                    PromptTemplate mcpReset = await client.CallAsync<PromptTemplate>("garrison_reset_prompt_template", new { template = "mcp-architect" }, token).ConfigureAwait(false);
                    Assert.True(mcpReset.CurrentVersion == 3 && !mcpReset.Content.Contains("MCP-EDIT", StringComparison.Ordinal), "Reset over MCP");
                }
                Run third = await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/agent-architect/invoke", new InvokeRequest { Input = "Still works.", DeploymentId = architect.Id, Wait = true, WaitSeconds = 120 }, 200, token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Succeeded, third.Status, "The architect still runs after the refused delete: " + third.ErrorMessage);
                Assert.Equal(204, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, prompts + "/" + clone.Id, null, token).ConfigureAwait(false)).StatusCode, "After switching, the clone can be deleted");

                Run run = await host.Server.Context.Database.Runs.CreateAsync(new Run { TenantId = host.TenantId, AgentId = architect.AgentId, DeploymentId = architect.Id, Status = RunStatusEnum.Running, CallerType = PrincipalTypeEnum.Administrator, LeaseEpoch = 1, LeaseExpiresUtc = DateTime.UtcNow.AddMinutes(5) }, token).ConfigureAwait(false);
                string bearer = await host.Server.Context.Authentication.IssueForRunAsync(run, 1, DateTime.UtcNow.AddMinutes(5), token).ConfigureAwait(false);
                using (TestMcpClient client = new TestMcpClient())
                {
                    await client.ConnectAsync(host, bearer, token).ConfigureAwait(false);
                    await client.ExpectErrorAsync("garrison_studio_set_architect_prompt", new { deployment = "architect", architectPromptTemplateId = "builtin/agent-architect" }, "Forbidden", token).ConfigureAwait(false);
                }
            }
        }

        private static async Task ScriptAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            string steps = String.Join("\n", Enumerable.Range(1, 5).Select(i =>
                "    - template: --mcp-invoke\n      condition: \"{{deployment.parameters.step" + i + "}}\"\n    - template: \"{{deployment.parameters.step" + i + "}}\"\n      condition: \"{{deployment.parameters.step" + i + "}}\""));
            string live = @"apiVersion: garrison/v1
kind: HarnessProfile
metadata:
  name: studio-script
spec:
  harnessType: Generic
  executable: garrison-fake-harness
  promptDelivery: Stdin
  mcpConfigFormat: ClaudeJson
  mcpConfigFileName: mcp.json
  outputParser: ClaudeStreamJson
  resultSource: ParserFinalEvent
  defaultTimeoutSeconds: 300
  files:
    - baseDirectory: Config
      pathTemplate: mcp.json
      contentTemplate: ""{{> builtin/claude-code-mcp-config}}""
      isSecret: true
      condition: ""{{resources.hasMcpServers}}""
      mode: ""600""
  arguments:
    - template: --format
    - template: claude
    - template: --mcp-config
      condition: ""{{resources.hasMcpServers}}""
    - template: $GARRISON_CONFIG_DIR/mcp.json
      condition: ""{{resources.hasMcpServers}}""
" + steps + @"
---
apiVersion: garrison/v1
kind: McpServer
metadata:
  name: scr-search
spec:
  transport: Http
  url: https://search.example.com
  path: /mcp
---
apiVersion: garrison/v1
kind: Agent
metadata:
  name: scr-lead
spec:
  displayName: Lead
---
apiVersion: garrison/v1
kind: Agent
metadata:
  name: scr-writer
spec:
  displayName: Writer
---
apiVersion: garrison/v1
kind: Agent
metadata:
  name: scr-reviewer
spec:
  displayName: Reviewer
---
apiVersion: garrison/v1
kind: Deployment
metadata:
  name: scr-writer-dev
spec:
  agent: scr-writer
  harnessProfile: builtin/fake
---
apiVersion: garrison/v1
kind: Deployment
metadata:
  name: scr-reviewer-dev
spec:
  agent: scr-reviewer
  harnessProfile: builtin/fake
---
apiVersion: garrison/v1
kind: AgenticApp
metadata:
  name: scr
spec:
  entry: scr-lead
  members:
    - { agent: scr-lead }
    - { agent: scr-writer }
  edges:
    - { from: scr-lead, to: scr-writer }
";
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                using (StringContent content = new StringContent(live, Encoding.UTF8, "application/yaml"))
                using (HttpResponseMessage response = await host.AdminClient.PostAsync(T(host) + "/manifests/apply", content, token).ConfigureAwait(false))
                {
                    string body = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                    Assert.Equal(200, (int)response.StatusCode, "Live configuration: " + body);
                    Assert.True(!body.Contains("\"Failed\"", StringComparison.Ordinal), "Live configuration applies: " + body);
                }
                using (HttpClient person = await host.UserClientAsync("admin@garrison", "password", host.TenantId, token).ConfigureAwait(false))
                {
                    StudioDraft draft = await HttpTestHelpers.SendAsync<StudioDraft>(person, HttpMethod.Post, D(host), new StudioDraftCreateRequest { FromApp = "scr" }, 201, token).ConfigureAwait(false);
                    string writerDeployment = "apiVersion: garrison/v1\nkind: Deployment\nmetadata:\n  name: scr-writer-dev\nspec:\n  agent: scr-writer\n  harnessProfile: builtin/fake\n  model: claude-sonnet-5-5\n  timeoutSeconds: 600\n  approvalRules:\n    - { action: Ask, pattern: \"Bash(git push:*)\" }\n";
                    string reviewerDeployment = "apiVersion: garrison/v1\nkind: Deployment\nmetadata:\n  name: scr-reviewer-dev\nspec:\n  agent: scr-reviewer\n  harnessProfile: builtin/fake\n  resources:\n    mcpServers:\n      - { alias: search, server: scr-search }\n";
                    string writerAgent = "apiVersion: garrison/v1\nkind: Agent\nmetadata:\n  name: scr-writer\nspec:\n  displayName: Writer\n  capabilities: [pandoc]\n";
                    Dictionary<string, string> parameters = new Dictionary<string, string>
                    {
                        ["step1"] = "garrison,garrison_studio_put_item," + Serializer.Serialize(new { draftId = draft.Id, version = draft.Version, kind = "Deployment", name = "scr-writer-dev", document = writerDeployment }),
                        ["step2"] = "garrison,garrison_studio_graph_operation," + Serializer.Serialize(new { draftId = draft.Id, version = draft.Version + 1, graphOperation = "AddMember", agent = "scr-reviewer" }),
                        ["step3"] = "garrison,garrison_studio_graph_operation," + Serializer.Serialize(new { draftId = draft.Id, version = draft.Version + 2, graphOperation = "Connect", from = "scr-writer", to = "scr-reviewer" }),
                        ["step4"] = "garrison,garrison_studio_put_item," + Serializer.Serialize(new { draftId = draft.Id, version = draft.Version + 3, kind = "Deployment", name = "scr-reviewer-dev", document = reviewerDeployment }),
                        ["step5"] = "garrison,garrison_studio_put_item," + Serializer.Serialize(new { draftId = draft.Id, version = draft.Version + 4, kind = "Agent", name = "scr-writer", document = writerAgent })
                    };
                    Agent scripted = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, T(host) + "/agents", new Agent { Name = "scr-architect" }, 201, token).ConfigureAwait(false);
                    HarnessProfile profile = Assert.NotNull((await host.Server.Context.Database.HarnessProfiles.EnumerateAsync(host.TenantId, new EnumerationQuery { MaxResults = 1000 }, token).ConfigureAwait(false)).Objects.FirstOrDefault(p => p.Name == "studio-script"), "Script profile");
                    Deployment architect = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Post, T(host) + "/deployments", new Deployment { Name = "scr-architect", AgentId = scripted.Id, HarnessProfileId = profile.Id, ManagementAccess = ManagementAccessEnum.Drafts, Parameters = parameters.Select(p => new DeploymentParameter { Name = p.Key, Value = p.Value }).ToList() }, 201, token).ConfigureAwait(false);
                    Run run = await HttpTestHelpers.SendAsync<Run>(person, HttpMethod.Post, T(host) + "/agents/scr-architect/invoke", new InvokeRequest { Input = "Make the writer cheaper and safer, add a reviewer with search, and give the writer pandoc.", DeploymentId = architect.Id, Wait = true, WaitSeconds = 120 }, 200, token).ConfigureAwait(false);
                    Assert.Equal(RunStatusEnum.Succeeded, run.Status, "The architect turn succeeds: " + run.ErrorMessage + " " + run.ResultText);

                    StudioDraft after = await HttpTestHelpers.SendAsync<StudioDraft>(person, HttpMethod.Get, D(host) + "/" + draft.Id, null, 200, token).ConfigureAwait(false);
                    Assert.Equal(draft.Version + 5, after.Version, "Five tool calls, five versions: " + run.ResultText);
                    StudioDraftDiff diff = await HttpTestHelpers.SendAsync<StudioDraftDiff>(person, HttpMethod.Get, D(host) + "/" + draft.Id + "/diff", null, 200, token).ConfigureAwait(false);
                    Assert.True(diff.Valid, "The scripted draft validates: " + Serializer.Serialize(diff));
                    StudioDraftDiffItem writerDiff = diff.Items.Single(i => i.Kind == "Deployment" && i.Name == "scr-writer-dev");
                    List<string> fields = (writerDiff.Changes ?? new List<ManifestFieldChange>()).Select(c => c.Field.Split('.', '[')[0]).Distinct().OrderBy(f => f, StringComparer.Ordinal).ToList();
                    Assert.True(writerDiff.Change == "Update" && fields.SequenceEqual(new[] { "approvalRules", "model", "timeoutSeconds" }), "Exactly model, timeout, and the approval rule: " + String.Join(", ", fields));
                    StudioGraph graph = StudioService.Graph(after);
                    Assert.True(graph.Edges.Any(e => e.App == "scr" && e.From == "scr-writer" && e.To == "scr-reviewer"), "Agent edge binding");
                    Assert.True(graph.Nodes.Single(n => n.Key == "Agent/scr-writer").Capabilities.SequenceEqual(new[] { "pandoc" }), "The graph shows the writer's host tool");
                    Assert.True(diff.Items.Single(i => i.Kind == "Deployment" && i.Name == "scr-reviewer-dev").Change == "Update", "MCP server binding on the reviewer's deployment");
                    StudioDraftDiffItem writerAgentDiff = diff.Items.Single(i => i.Kind == "Agent" && i.Name == "scr-writer");
                    Assert.True(writerAgentDiff.Change == "Update" && (writerAgentDiff.Changes ?? new List<ManifestFieldChange>()).Any(c => c.Field.StartsWith("capabilities", StringComparison.Ordinal)), "Host tool requirement on the writer: " + Serializer.Serialize(writerAgentDiff));
                }
            }
        }

        private static async Task SeedReplicasAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            int replicas = provider == DatabaseTypeEnum.Postgresql ? 2 : 1;
            await using (TestReplicaCluster cluster = await TestReplicaCluster.StartAsync(provider, replicas, BackplaneModeEnum.Auto, null, token).ConfigureAwait(false))
            {
                TestServerHost first = cluster.Replicas[0];
                Tenant fresh = await first.Server.Context.Database.Tenants.CreateAsync(new Tenant { Name = "Seed Race" }, token).ConfigureAwait(false);
                List<Task> seeding = new List<Task>();
                for (int round = 0; round < 3; round++)
                {
                    foreach (TestServerHost replica in cluster.Replicas)
                    {
                        ArchitectService architect = replica.Server.Context.Get<ArchitectService>();
                        seeding.Add(architect.SeedAllAsync(token));
                        seeding.Add(architect.SeedTenantAsync(fresh.Id, token));
                    }
                }
                await Task.WhenAll(seeding).ConfigureAwait(false);
                foreach (string tenantId in new[] { first.TenantId, fresh.Id })
                {
                    EnumerationResult<Agent> agents = await first.Server.Context.Database.Agents.EnumerateAsync(tenantId, new EnumerationQuery { MaxResults = 1000 }, token).ConfigureAwait(false);
                    Assert.Equal(1, agents.Objects.Count(a => a.Name == "agent-architect"), "One architect in " + tenantId);
                    EnumerationResult<AgentAsset> assets = await first.Server.Context.Database.AgentAssets.EnumerateAsync(tenantId, null, new EnumerationQuery { MaxResults = 1000 }, token).ConfigureAwait(false);
                    AgentAsset skill = Assert.NotNull(assets.Objects.SingleOrDefault(a => a.Name == "agent-architect-skills"), "One skill asset in " + tenantId);
                    Assert.Equal(1, skill.CurrentVersion, "Seeding again adds no version: " + tenantId);
                }
            }
        }

        private static async Task PreviewAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                RequestContext system = new RequestContext { IsAuthenticated = true, TenantId = host.TenantId, PrincipalType = PrincipalTypeEnum.Administrator, PrincipalName = "test" };
                AgentAssetService assets = host.Server.Context.Get<AgentAssetService>();
                AgentAsset skill = await assets.CreateAsync(system, host.TenantId, new AgentAsset { Name = "prev-skill", Kind = AgentAssetKindEnum.Skill }, token).ConfigureAwait(false);
                await assets.UploadVersionAsync(system, host.TenantId, skill, new List<AgentAssetFile> { new AgentAssetFile { Path = "SKILL.md", MediaType = "text/markdown" } }, new Dictionary<string, byte[]> { ["SKILL.md"] = Encoding.UTF8.GetBytes("# Preview skill") }, null, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<Secret>(host.AdminClient, HttpMethod.Post, T(host) + "/secrets", new SecretRequest { Name = "prev-key", Value = "super-secret-preview-value" }, 201, token).ConfigureAwait(false);
                Agent agent = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, T(host) + "/agents", new Agent { Name = "prev-agent", Description = "Previewed." }, 201, token).ConfigureAwait(false);
                Deployment dev = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Post, T(host) + "/deployments", new Deployment { Name = "prev-dev", AgentId = agent.Id, HarnessProfileId = "hrn_builtin_fake", Environment = "dev" }, 201, token).ConfigureAwait(false);
                Deployment staging = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Post, T(host) + "/deployments", new Deployment { Name = "prev-staging", AgentId = agent.Id, HarnessProfileId = "hrn_builtin_fake", Environment = "staging", Model = "staging-model" }, 201, token).ConfigureAwait(false);
                AgentRevision draft = await HttpTestHelpers.SendAsync<AgentRevision>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/" + agent.Id + "/revisions", new AgentRevision { Description = "Previewed, with a skill.", AssetPins = new List<AgentRevisionAssetPin> { new AgentRevisionAssetPin { AssetId = skill.Id, Version = 1 } } }, 201, token).ConfigureAwait(false);

                string preview = T(host) + "/deployments/" + dev.Id + "/compile-preview";
                CompilePreviewResponse current = await HttpTestHelpers.SendAsync<CompilePreviewResponse>(host.AdminClient, HttpMethod.Post, preview, new CompilePreviewRequest(), 200, token).ConfigureAwait(false);
                Assert.True(!Serializer.Serialize(current.Spec).Contains("prev-skill", StringComparison.Ordinal), "The published revision has no skill");
                CompilePreviewResponse drafted = await HttpTestHelpers.SendAsync<CompilePreviewResponse>(host.AdminClient, HttpMethod.Post, preview, new CompilePreviewRequest { AgentRevisionId = draft.Id }, 200, token).ConfigureAwait(false);
                string draftedText = Serializer.Serialize(drafted.Spec);
                Assert.True(drafted.AgentRevisionId == draft.Id && draftedText.Contains("prev-skill", StringComparison.Ordinal), "The draft revision places its skill: " + draftedText.Substring(0, Math.Min(400, draftedText.Length)));
                Assert.True(!draftedText.Contains("super-secret-preview-value", StringComparison.Ordinal), "Secrets stay redacted");
                CompilePreviewResponse other = await HttpTestHelpers.SendAsync<CompilePreviewResponse>(host.AdminClient, HttpMethod.Post, preview, new CompilePreviewRequest { Environment = "staging" }, 200, token).ConfigureAwait(false);
                Assert.Equal(staging.Id, other.DeploymentId, "Staging's deployment is compiled");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, preview, new CompilePreviewRequest { Environment = "prod" }, token).ConfigureAwait(false), 400, "NoDeploymentInEnvironment", "No prod deployment");
            }
        }

        private static async Task PlaygroundAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                Agent agent = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, T(host) + "/agents", new Agent { Name = "pg-agent", Description = "Published description." }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Post, T(host) + "/deployments", new Deployment { Name = "pg-dev", AgentId = agent.Id, HarnessProfileId = "hrn_builtin_fake", Environment = "dev" }, 201, token).ConfigureAwait(false);
                AgentRevision draft = await HttpTestHelpers.SendAsync<AgentRevision>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/" + agent.Id + "/revisions", new AgentRevision { Description = "PLAYGROUND-DRAFT description." }, 201, token).ConfigureAwait(false);

                Run run = await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/pg-agent/playground/invoke", new PlaygroundInvokeRequest { Input = "Try the draft." }, 200, token).ConfigureAwait(false);
                Assert.True(run.Status == RunStatusEnum.Succeeded && run.Kind == RunKindEnum.Playground && run.AgentRevisionId == draft.Id, "A playground run of the draft revision: " + run.Status + " " + run.Kind + " " + run.AgentRevisionId + " " + run.ErrorMessage);
                Deployment playground = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Get, T(host) + "/deployments/" + run.DeploymentId, null, 200, token).ConfigureAwait(false);
                Assert.True(playground.Environment == "draft" && playground.Name == "playground-pg-agent" && playground.AgentRevisionId == draft.Id, "On the ephemeral draft deployment");
                CompilePreviewResponse preview = await HttpTestHelpers.SendAsync<CompilePreviewResponse>(host.AdminClient, HttpMethod.Post, T(host) + "/deployments/" + playground.Id + "/compile-preview", new CompilePreviewRequest(), 200, token).ConfigureAwait(false);
                Assert.True(Serializer.Serialize(preview.Spec).Contains("PLAYGROUND-DRAFT", StringComparison.Ordinal), "The playground renders the draft's unpublished prompt text");
                Agent still = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Get, T(host) + "/agents/" + agent.Id, null, 200, token).ConfigureAwait(false);
                Assert.Equal("Published description.", still.Description ?? String.Empty, "Nothing is published");
                Run second = await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/pg-agent/playground/invoke", new PlaygroundInvokeRequest { Input = "Again.", ConversationId = run.ConversationId }, 200, token).ConfigureAwait(false);
                Assert.True(second.DeploymentId == run.DeploymentId && second.ConversationId == run.ConversationId && !String.IsNullOrEmpty(run.ConversationId), "A second turn reuses the playground deployment and the conversation");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/deployments", new Deployment { Name = "pg-sneaky", AgentId = agent.Id, HarnessProfileId = "hrn_builtin_fake", Environment = "draft" }, token).ConfigureAwait(false), 400, "ReservedEnvironment", "Users cannot create draft-environment deployments");
                AgenticApp app = new AgenticApp { Name = "pg-app", EntryAgentId = agent.Id, Members = new List<AgenticAppMember> { new AgenticAppMember { AgentId = agent.Id } }, Environments = new List<AgenticAppEnvironment> { new AgenticAppEnvironment { Environment = "draft", DeploymentId = playground.Id } } };
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/apps", app, token).ConfigureAwait(false), 400, "UnknownEnvironment", "Apps cannot use the draft environment");

                StudioDraft studio = await HttpTestHelpers.SendAsync<StudioDraft>(host.AdminClient, HttpMethod.Post, D(host), new StudioDraftCreateRequest { Title = "Playground draft" }, 201, token).ConfigureAwait(false);
                studio = await PutAsync(host.AdminClient, D(host) + "/" + studio.Id + "/items/Agent/pg-agent", studio.Version, AgentYaml("pg-agent", "STUDIO-DRAFT description."), token).ConfigureAwait(false);
                Run fromDraft = await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Post, D(host) + "/" + studio.Id + "/playground/invoke", new PlaygroundInvokeRequest { Agent = "pg-agent", Input = "From the studio." }, 200, token).ConfigureAwait(false);
                AgentRevision used = await HttpTestHelpers.SendAsync<AgentRevision>(host.AdminClient, HttpMethod.Get, T(host) + "/agents/" + agent.Id + "/revisions/" + fromDraft.AgentRevisionId, null, 200, token).ConfigureAwait(false);
                Assert.True(fromDraft.Status == RunStatusEnum.Succeeded && used.State == AgentRevisionStateEnum.Draft && used.Description == "STUDIO-DRAFT description.", "The studio draft's document ran as the agent's draft revision: " + Serializer.Serialize(used));
                still = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Get, T(host) + "/agents/" + agent.Id, null, 200, token).ConfigureAwait(false);
                Assert.Equal("Published description.", still.Description ?? String.Empty, "Still nothing published");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, D(host) + "/" + studio.Id + "/playground/invoke", new PlaygroundInvokeRequest { Agent = "pg-missing", Input = "x" }, token).ConfigureAwait(false), 400, "AgentNotLive", "An agent that does not exist yet");
            }
        }

        private static async Task DeployDevAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                StudioDraft draft = await HttpTestHelpers.SendAsync<StudioDraft>(host.AdminClient, HttpMethod.Post, D(host), new StudioDraftCreateRequest { Title = "New desk" }, 201, token).ConfigureAwait(false);
                string items = D(host) + "/" + draft.Id + "/items/";
                draft = await PutAsync(host.AdminClient, items + "Agent/desk-entry", draft.Version, AgentYaml("desk-entry", "Answers people."), token).ConfigureAwait(false);
                draft = await PutAsync(host.AdminClient, items + "Deployment/desk-entry-dev", draft.Version, "apiVersion: garrison/v1\nkind: Deployment\nmetadata:\n  name: desk-entry-dev\nspec:\n  agent: desk-entry\n  harnessProfile: builtin/fake\n  environment: dev\n", token).ConfigureAwait(false);
                draft = await PutAsync(host.AdminClient, items + "AgenticApp/desk", draft.Version, "apiVersion: garrison/v1\nkind: AgenticApp\nmetadata:\n  name: desk\nspec:\n  entry: desk-entry\n  members:\n    - { agent: desk-entry }\n  environments:\n    - { environment: dev, deployment: desk-entry-dev }\n  liveEnvironment: dev\n  authMode: Anonymous\n  anonymousEnabled: true\n", token).ConfigureAwait(false);
                Approval approval = await HttpTestHelpers.SendAsync<Approval>(host.AdminClient, HttpMethod.Post, D(host) + "/" + draft.Id + "/request-apply", new StudioDraftVersionRequest { Version = draft.Version }, 201, token).ConfigureAwait(false);
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, "/v1.0/apps/desk", null, token).ConfigureAwait(false)).StatusCode, "No app before approval");
                await HttpTestHelpers.SendAsync<Approval>(host.AdminClient, HttpMethod.Post, T(host) + "/approvals/" + approval.Id + "/decide", new ApprovalDecideRequest { Decision = ApprovalDecisionEnum.Allow }, 200, token).ConfigureAwait(false);

                using (HttpClient client = new HttpClient { BaseAddress = host.AdminClient.BaseAddress })
                {
                    string session;
                    using (StringContent content = new StringContent("{}", Encoding.UTF8, "application/json"))
                    using (HttpResponseMessage response = await client.PostAsync("/v1.0/apps/desk/session", content, token).ConfigureAwait(false))
                    {
                        string body = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                        Assert.Equal(201, (int)response.StatusCode, "Anonymous session: " + body);
                        session = Assert.NotNull(Serializer.Deserialize<AppSessionResponse>(body), "Session").Token;
                    }
                    client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", session);
                    string conversationId;
                    using (StringContent content = new StringContent("{\"message\":\"Hello desk\"}", Encoding.UTF8, "application/json"))
                    using (HttpResponseMessage started = await client.PostAsync("/v1.0/apps/desk/conversations", content, token).ConfigureAwait(false))
                    {
                        string body = await started.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                        Assert.Equal(201, (int)started.StatusCode, "Start: " + body);
                        conversationId = Assert.NotNull(Serializer.Deserialize<Dictionary<string, object>>(body)?["conversationId"]?.ToString(), "Conversation id");
                    }
                    DateTime deadline = DateTime.UtcNow.AddSeconds(60);
                    AppConversationView view;
                    while (true)
                    {
                        view = Assert.NotNull(Serializer.Deserialize<AppConversationView>(await client.GetStringAsync("/v1.0/apps/desk/conversations/" + conversationId, token).ConfigureAwait(false)), "Conversation");
                        if (view.Turns.Count == 1 && Garrison.Server.Runtime.RunService.IsTerminal(view.Turns[0].Status)) break;
                        if (DateTime.UtcNow > deadline) throw new TestAssertionException("The turn did not finish: " + Serializer.Serialize(view));
                        await Task.Delay(250, token).ConfigureAwait(false);
                    }
                    Assert.True(view.Turns[0].Status == RunStatusEnum.Succeeded && (view.Turns[0].Answer ?? String.Empty).Contains("Hello desk", StringComparison.Ordinal), "The drafted app answers at its URL: " + Serializer.Serialize(view));
                }

                // A dev deployment pinned to a revision moves to the revision the next apply publishes; staging stays.
                Agent entry = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Get, T(host) + "/agents/desk-entry", null, 200, token).ConfigureAwait(false);
                Deployment dev = (await host.Server.Context.Database.Deployments.ListByAgentAsync(host.TenantId, entry.Id, token).ConfigureAwait(false)).Single(d => d.Name == "desk-entry-dev");
                dev.AgentRevisionId = entry.LatestPublishedRevisionId;
                await host.Server.Context.Database.Deployments.UpdateAsync(dev, token).ConfigureAwait(false);
                Deployment staging = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Post, T(host) + "/deployments", new Deployment { Name = "desk-entry-staging", AgentId = entry.Id, HarnessProfileId = "hrn_builtin_fake", Environment = "staging", AgentRevisionId = entry.LatestPublishedRevisionId }, 201, token).ConfigureAwait(false);
                StudioDraft next = await HttpTestHelpers.SendAsync<StudioDraft>(host.AdminClient, HttpMethod.Post, D(host), new StudioDraftCreateRequest { FromApp = "desk" }, 201, token).ConfigureAwait(false);
                next = await PutAsync(host.AdminClient, D(host) + "/" + next.Id + "/items/Agent/desk-entry", next.Version, AgentYaml("desk-entry", "Answers people kindly."), token).ConfigureAwait(false);
                Approval second = await HttpTestHelpers.SendAsync<Approval>(host.AdminClient, HttpMethod.Post, D(host) + "/" + next.Id + "/request-apply", new StudioDraftVersionRequest { Version = next.Version }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<Approval>(host.AdminClient, HttpMethod.Post, T(host) + "/approvals/" + second.Id + "/decide", new ApprovalDecideRequest { Decision = ApprovalDecisionEnum.Allow }, 200, token).ConfigureAwait(false);
                Agent updated = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Get, T(host) + "/agents/desk-entry", null, 200, token).ConfigureAwait(false);
                Deployment devAfter = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Get, T(host) + "/deployments/" + dev.Id, null, 200, token).ConfigureAwait(false);
                Deployment stagingAfter = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Get, T(host) + "/deployments/" + staging.Id, null, 200, token).ConfigureAwait(false);
                Assert.True(updated.LatestPublishedRevisionId != entry.LatestPublishedRevisionId && devAfter.AgentRevisionId == updated.LatestPublishedRevisionId && stagingAfter.AgentRevisionId == entry.LatestPublishedRevisionId, "Dev moves to the new revision; staging waits for promotion: before " + entry.LatestPublishedRevisionId + ", after " + updated.LatestPublishedRevisionId + ", dev " + devAfter.AgentRevisionId + ", staging " + stagingAfter.AgentRevisionId);
            }
        }

        private static async Task TenancyAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                StudioDraft draft = await HttpTestHelpers.SendAsync<StudioDraft>(host.AdminClient, HttpMethod.Post, D(host), new StudioDraftCreateRequest { Title = "Ours" }, 201, token).ConfigureAwait(false);
                PromptTemplate ourClone = await HttpTestHelpers.SendAsync<PromptTemplate>(host.AdminClient, HttpMethod.Post, T(host) + "/prompt-templates/tpl_builtin_agent_architect/clone", new CloneRequest { Name = "our-architect" }, 201, token).ConfigureAwait(false);

                Tenant other = await HttpTestHelpers.SendAsync<Tenant>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants", new TenantRequest { Name = "Studio Other" }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + other.Id + "/users", new UserRequest { Email = "studio-outsider@example.com", Password = "password123", IsTenantAdmin = true }, 201, token).ConfigureAwait(false);
                using (HttpClient outsider = await host.UserClientAsync("studio-outsider@example.com", "password123", other.Id, token).ConfigureAwait(false))
                {
                    string theirs = "/v1.0/api/tenants/" + other.Id;
                    Assert.Equal(404, (await HttpTestHelpers.SendAsync(outsider, HttpMethod.Get, theirs + "/studio/drafts/" + draft.Id, null, token).ConfigureAwait(false)).StatusCode, "Another tenant's draft through their tenant");
                    Assert.Equal(404, (await HttpTestHelpers.SendAsync(outsider, HttpMethod.Get, D(host) + "/" + draft.Id, null, token).ConfigureAwait(false)).StatusCode, "Another tenant's draft through ours");
                    EnumerationResult<StudioDraft> list = await HttpTestHelpers.SendAsync<EnumerationResult<StudioDraft>>(outsider, HttpMethod.Get, theirs + "/studio/drafts", null, 200, token).ConfigureAwait(false);
                    Assert.True(list.Objects.All(d => d.Id != draft.Id), "Not listed to another tenant");
                    List<ArchitectPromptEntry> prompts = (await HttpTestHelpers.SendAsync<EnumerationResult<ArchitectPromptEntry>>(outsider, HttpMethod.Get, theirs + "/studio/architect-prompts?maxResults=1000", null, 200, token).ConfigureAwait(false)).Objects;
                    Assert.True(prompts.All(p => p.Id != ourClone.Id) && prompts.Any(p => p.Name == "builtin/agent-architect"), "Another tenant sees the built-ins but not our clone");
                }

                await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, T(host) + "/users", new UserRequest { Email = "studio-nobody@example.com", Password = "password123" }, 201, token).ConfigureAwait(false);
                using (HttpClient nobody = await host.UserClientAsync("studio-nobody@example.com", "password123", host.TenantId, token).ConfigureAwait(false))
                {
                    string[] reads = { D(host), D(host) + "/" + draft.Id, T(host) + "/studio/architect-prompts", T(host) + "/studio/architects", T(host) + "/capabilities", T(host) + "/agent-assets", T(host) + "/apps", T(host) + "/fan-out-groups/fog_missing", T(host) + "/conversations/cnv_missing/files" };
                    foreach (string path in reads)
                    {
                        Assert.Equal(403, (await HttpTestHelpers.SendAsync(nobody, HttpMethod.Get, path, null, token).ConfigureAwait(false)).StatusCode, "No permission: GET " + path);
                    }
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(nobody, HttpMethod.Post, D(host), new StudioDraftCreateRequest { Title = "Nope" }, token).ConfigureAwait(false)).StatusCode, "No permission: create a draft");
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(nobody, HttpMethod.Put, D(host) + "/" + draft.Id + "/items/Agent/nope", new StudioDraftItemRequest { Version = draft.Version, Document = AgentYaml("nope", "No.") }, token).ConfigureAwait(false)).StatusCode, "No permission: edit a draft");
                }
            }
        }

        private static async Task ArchitectsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                string architects = T(host) + "/studio/architects";
                EnumerationResult<Architect> empty = await HttpTestHelpers.SendAsync<EnumerationResult<Architect>>(host.AdminClient, HttpMethod.Get, architects, null, 200, token).ConfigureAwait(false);
                Assert.True(empty.TotalRecords == 0 && empty.Objects.Count == 0, "A new tenant has no architects");

                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, architects, new ArchitectRequest { Name = "", HarnessProfileId = "" }, token).ConfigureAwait(false), 400, "harnessProfileId", "Name and harness profile are required");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, architects, new ArchitectRequest { Name = "bad-prompt", HarnessProfileId = "hrn_builtin_fake", ArchitectPromptTemplateId = "builtin/default-task" }, token).ConfigureAwait(false), 400, "InvalidArchitectPrompt", "A Task template is not an architect prompt");

                Secret key = await HttpTestHelpers.SendAsync<Secret>(host.AdminClient, HttpMethod.Post, T(host) + "/secrets", new SecretRequest { Name = "architect-key", Kind = SecretKindEnum.AnthropicApiKey, Value = "sk-ant-architect-1234" }, 201, token).ConfigureAwait(false);
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, architects, new ArchitectRequest { Name = "bad-credential", HarnessProfileId = "hrn_builtin_fake", CredentialSecretId = "no-such-secret" }, token).ConfigureAwait(false), 400, "InvalidCredentialSecret", "An unknown credential secret");
                Architect first = await HttpTestHelpers.SendAsync<Architect>(host.AdminClient, HttpMethod.Post, architects, new ArchitectRequest { Name = "architect-one", Description = "First.", HarnessProfileId = "hrn_builtin_fake", Model = "fake-model", CredentialSecretId = "architect-key" }, 201, token).ConfigureAwait(false);
                Assert.True(first.CredentialSecretId == key.Id && first.CredentialSecretName == "architect-key" && first.CredentialSecretKind == "AnthropicApiKey", "The credential is bound and shown: " + Serializer.Serialize(first));
                Assert.True(first.Id.StartsWith("dep_", StringComparison.Ordinal) && first.AgentName == "agent-architect" && first.ArchitectPromptTemplateId == "tpl_builtin_agent_architect" && first.ArchitectPromptVersion == null && first.Active && first.Model == "fake-model", "Created on the default prompt: " + Serializer.Serialize(first));
                Deployment underlying = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Get, T(host) + "/deployments/" + first.Id, null, 200, token).ConfigureAwait(false);
                Assert.True(underlying.ManagementAccess == ManagementAccessEnum.Drafts, "The architect is a deployment with Drafts access");
                Assert.True(underlying.ResourceBindings.Any(b => b.Kind == ResourceBindingKindEnum.Secret && b.Alias == "credential" && b.ResourceId == key.Id), "The credential is bound to the deployment as alias credential");
                Architect second = await HttpTestHelpers.SendAsync<Architect>(host.AdminClient, HttpMethod.Post, architects, new ArchitectRequest { Name = "architect-two", HarnessProfileId = "hrn_builtin_fake", ArchitectPromptTemplateId = "builtin/agent-architect-guided", ArchitectPromptVersion = 1, Active = false }, 201, token).ConfigureAwait(false);
                Assert.True(second.ArchitectPromptName == "builtin/agent-architect-guided" && second.ArchitectPromptVersion == 1 && !second.Active, "Created on the guided prompt, pinned, inactive");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, architects, new ArchitectRequest { Name = "architect-one", HarnessProfileId = "hrn_builtin_fake" }, token).ConfigureAwait(false), 409, "NameConflict", "Duplicate name");

                Agent plainAgent = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, T(host) + "/agents", new Agent { Name = "not-an-architect" }, 201, token).ConfigureAwait(false);
                Deployment plain = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Post, T(host) + "/deployments", new Deployment { Name = "plain", AgentId = plainAgent.Id, HarnessProfileId = "hrn_builtin_fake" }, 201, token).ConfigureAwait(false);
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, architects + "/" + plain.Id, null, token).ConfigureAwait(false)).StatusCode, "A plain deployment is not an architect");
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, architects + "/" + plain.Id, null, token).ConfigureAwait(false)).StatusCode, "Deleting a plain deployment as an architect");

                EnumerationResult<Architect> page = await HttpTestHelpers.SendAsync<EnumerationResult<Architect>>(host.AdminClient, HttpMethod.Get, architects + "?maxResults=1&ordering=CreatedAscending", null, 200, token).ConfigureAwait(false);
                Assert.True(page.TotalRecords == 2 && page.Objects.Count == 1 && page.Objects[0].Id == first.Id && !page.EndOfResults && page.RecordsRemaining == 1, "First page of one: " + Serializer.Serialize(page));
                EnumerationResult<Architect> next = await HttpTestHelpers.SendAsync<EnumerationResult<Architect>>(host.AdminClient, HttpMethod.Get, architects + "?maxResults=1&skip=1&ordering=CreatedAscending", null, 200, token).ConfigureAwait(false);
                Assert.True(next.Objects.Count == 1 && next.Objects[0].Id == second.Id && next.EndOfResults, "Second page");
                EnumerationResult<Architect> searched = await HttpTestHelpers.SendAsync<EnumerationResult<Architect>>(host.AdminClient, HttpMethod.Get, architects + "?search=two", null, 200, token).ConfigureAwait(false);
                Assert.True(searched.TotalRecords == 1 && searched.Objects[0].Id == second.Id, "Search by name");
                EnumerationResult<Architect> active = await HttpTestHelpers.SendAsync<EnumerationResult<Architect>>(host.AdminClient, HttpMethod.Get, architects + "?activeOnly=true", null, 200, token).ConfigureAwait(false);
                Assert.True(active.TotalRecords == 1 && active.Objects[0].Id == first.Id, "activeOnly");
                Assert.Equal(second.Id, (await HttpTestHelpers.SendAsync<Architect>(host.AdminClient, HttpMethod.Get, architects + "/architect-two", null, 200, token).ConfigureAwait(false)).Id, "Read by name");

                Deployment tuned = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Get, T(host) + "/deployments/" + first.Id, null, 200, token).ConfigureAwait(false);
                tuned.TimeoutSeconds = 321;
                await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Put, T(host) + "/deployments/" + first.Id, tuned, 200, token).ConfigureAwait(false);
                Architect renamed = await HttpTestHelpers.SendAsync<Architect>(host.AdminClient, HttpMethod.Put, architects + "/" + first.Id, new ArchitectRequest { Name = "architect-renamed", Description = "Renamed.", HarnessProfileId = "hrn_builtin_fake", Model = "other-model", Active = false, ArchitectPromptTemplateId = "builtin/agent-architect-guided" }, 200, token).ConfigureAwait(false);
                Assert.True(renamed.Name == "architect-renamed" && renamed.Model == "other-model" && !renamed.Active && renamed.ArchitectPromptName == "builtin/agent-architect-guided" && renamed.ConfigVersion == 3, "Updated: " + Serializer.Serialize(renamed));
                Deployment afterUpdate = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Get, T(host) + "/deployments/" + first.Id, null, 200, token).ConfigureAwait(false);
                Assert.True(afterUpdate.TimeoutSeconds == 321 && afterUpdate.ManagementAccess == ManagementAccessEnum.Drafts, "Other deployment settings are kept");
                Architect keptPrompt = await HttpTestHelpers.SendAsync<Architect>(host.AdminClient, HttpMethod.Put, architects + "/" + first.Id, new ArchitectRequest { Name = "architect-renamed", HarnessProfileId = "hrn_builtin_fake", Active = true }, 200, token).ConfigureAwait(false);
                Assert.True(keptPrompt.ArchitectPromptName == "builtin/agent-architect-guided" && keptPrompt.Active && keptPrompt.CredentialSecretId == key.Id, "No prompt or credential in the update keeps the current ones");
                Architect noKey = await HttpTestHelpers.SendAsync<Architect>(host.AdminClient, HttpMethod.Put, architects + "/" + first.Id, new ArchitectRequest { Name = "architect-renamed", HarnessProfileId = "hrn_builtin_fake", CredentialSecretId = "" }, 200, token).ConfigureAwait(false);
                Assert.True(noKey.CredentialSecretId == null, "An empty credential removes it");
                Architect withKey = await HttpTestHelpers.SendAsync<Architect>(host.AdminClient, HttpMethod.Put, architects + "/" + first.Id, new ArchitectRequest { Name = "architect-renamed", HarnessProfileId = "hrn_builtin_fake", CredentialSecretId = key.Id }, 200, token).ConfigureAwait(false);
                Assert.True(withKey.CredentialSecretId == key.Id, "Bound again by ID");

                EnumerationResult<ArchitectPromptEntry> promptPage = await HttpTestHelpers.SendAsync<EnumerationResult<ArchitectPromptEntry>>(host.AdminClient, HttpMethod.Get, T(host) + "/studio/architect-prompts?maxResults=1", null, 200, token).ConfigureAwait(false);
                Assert.True(promptPage.Objects.Count == 1 && promptPage.Objects[0].Name == "builtin/agent-architect" && promptPage.TotalRecords >= 2 && !promptPage.EndOfResults, "The prompt catalog pages: " + Serializer.Serialize(promptPage));
                EnumerationResult<ArchitectPromptEntry> promptNext = await HttpTestHelpers.SendAsync<EnumerationResult<ArchitectPromptEntry>>(host.AdminClient, HttpMethod.Get, T(host) + "/studio/architect-prompts?maxResults=1&skip=1", null, 200, token).ConfigureAwait(false);
                Assert.True(promptNext.Objects.Count == 1 && promptNext.Objects[0].Name == "builtin/agent-architect-guided" && promptNext.Objects[0].Deployments.Contains(first.Id) && promptNext.Objects[0].Deployments.Contains(second.Id), "Second prompt page names its architects");
                EnumerationResult<ArchitectPromptEntry> promptSearch = await HttpTestHelpers.SendAsync<EnumerationResult<ArchitectPromptEntry>>(host.AdminClient, HttpMethod.Get, T(host) + "/studio/architect-prompts?search=guided", null, 200, token).ConfigureAwait(false);
                Assert.True(promptSearch.TotalRecords == 1, "Prompt search");

                using (TestMcpClient client = new TestMcpClient())
                {
                    await client.ConnectAsync(host, null, token).ConfigureAwait(false);
                    EnumerationResult<Architect> listed = await client.CallAsync<EnumerationResult<Architect>>("garrison_studio_list_architects", new { maxResults = 1, skip = 0 }, token).ConfigureAwait(false);
                    Assert.True(listed.TotalRecords == 2 && listed.Objects.Count == 1, "MCP list pages");
                    Architect made = await client.CallAsync<Architect>("garrison_studio_create_architect", new { name = "mcp-architect", harnessProfileId = "hrn_builtin_fake", credentialSecretId = "architect-key" }, token).ConfigureAwait(false);
                    Assert.True(made.ArchitectPromptTemplateId == "tpl_builtin_agent_architect" && made.CredentialSecretName == "architect-key", "MCP create with a credential");
                    Architect changed = await client.CallAsync<Architect>("garrison_studio_update_architect", new { architect = "mcp-architect", model = "mcp-model" }, token).ConfigureAwait(false);
                    Assert.True(changed.Model == "mcp-model" && changed.Name == "mcp-architect" && changed.Active, "MCP update keeps fields left out");
                    Architect read = await client.CallAsync<Architect>("garrison_studio_get_architect", new { architect = made.Id }, token).ConfigureAwait(false);
                    Assert.Equal("mcp-model", read.Model, "MCP get");
                    await client.ExpectErrorAsync("garrison_studio_get_architect", new { architect = "plain" }, "NotFound", token).ConfigureAwait(false);
                    await client.CallAsync<object>("garrison_studio_delete_architect", new { architect = made.Id }, token).ConfigureAwait(false);
                    await client.ExpectErrorAsync("garrison_studio_get_architect", new { architect = made.Id }, "NotFound", token).ConfigureAwait(false);
                }

                Tenant other = await HttpTestHelpers.SendAsync<Tenant>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants", new TenantRequest { Name = "Architects Other" }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + other.Id + "/users", new UserRequest { Email = "architects-outsider@example.com", Password = "password123", IsTenantAdmin = true }, 201, token).ConfigureAwait(false);
                using (HttpClient outsider = await host.UserClientAsync("architects-outsider@example.com", "password123", other.Id, token).ConfigureAwait(false))
                {
                    string theirs = "/v1.0/api/tenants/" + other.Id + "/studio/architects";
                    Assert.Equal(404, (await HttpTestHelpers.SendAsync(outsider, HttpMethod.Get, theirs + "/" + first.Id, null, token).ConfigureAwait(false)).StatusCode, "Another tenant's architect");
                    Assert.Equal(404, (await HttpTestHelpers.SendAsync(outsider, HttpMethod.Put, theirs + "/" + first.Id, new ArchitectRequest { Name = "x", HarnessProfileId = "hrn_builtin_fake" }, token).ConfigureAwait(false)).StatusCode, "Changing another tenant's architect");
                    EnumerationResult<Architect> theirList = await HttpTestHelpers.SendAsync<EnumerationResult<Architect>>(outsider, HttpMethod.Get, theirs, null, 200, token).ConfigureAwait(false);
                    Assert.True(theirList.TotalRecords == 0, "Not listed to another tenant");
                }

                Assert.Equal(204, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, architects + "/" + second.Id, null, token).ConfigureAwait(false)).StatusCode, "Delete");
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, architects + "/" + second.Id, null, token).ConfigureAwait(false)).StatusCode, "Gone");
                EnumerationResult<Architect> remaining = await HttpTestHelpers.SendAsync<EnumerationResult<Architect>>(host.AdminClient, HttpMethod.Get, architects, null, 200, token).ConfigureAwait(false);
                Assert.True(remaining.TotalRecords == 1 && remaining.Objects[0].Id == first.Id, "One left");
            }
        }

        private static async Task BuildDeployChatAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                Tenant tenant = await HttpTestHelpers.SendAsync<Tenant>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants", new TenantRequest { Name = "Fresh Studio" }, 201, token).ConfigureAwait(false);
                string t = "/v1.0/api/tenants/" + tenant.Id;
                await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, t + "/users", new UserRequest { Email = "builder@example.com", Password = "password123", IsTenantAdmin = true }, 201, token).ConfigureAwait(false);
                using (HttpClient builder = await host.UserClientAsync("builder@example.com", "password123", tenant.Id, token).ConfigureAwait(false))
                {
                    EnumerationResult<Agent> before = await HttpTestHelpers.SendAsync<EnumerationResult<Agent>>(builder, HttpMethod.Get, t + "/agents", null, 200, token).ConfigureAwait(false);
                    Assert.True(before.Objects.Count == 1 && before.Objects[0].Name == "agent-architect", "An empty tenant has only the architect");

                    string steps = String.Join("\n", Enumerable.Range(1, 6).Select(i =>
                        "    - template: --mcp-invoke\n      condition: \"{{deployment.parameters.step" + i + "}}\"\n    - template: \"{{deployment.parameters.step" + i + "}}\"\n      condition: \"{{deployment.parameters.step" + i + "}}\""));
                    string profileYaml = "apiVersion: garrison/v1\nkind: HarnessProfile\nmetadata:\n  name: architect-script\nspec:\n  harnessType: Generic\n  executable: garrison-fake-harness\n  promptDelivery: Stdin\n  mcpConfigFormat: ClaudeJson\n  mcpConfigFileName: mcp.json\n  outputParser: ClaudeStreamJson\n  resultSource: ParserFinalEvent\n  defaultTimeoutSeconds: 300\n  files:\n    - baseDirectory: Config\n      pathTemplate: mcp.json\n      contentTemplate: \"{{> builtin/claude-code-mcp-config}}\"\n      isSecret: true\n      condition: \"{{resources.hasMcpServers}}\"\n      mode: \"600\"\n  arguments:\n    - template: --format\n    - template: claude\n    - template: --mcp-config\n      condition: \"{{resources.hasMcpServers}}\"\n    - template: $GARRISON_CONFIG_DIR/mcp.json\n      condition: \"{{resources.hasMcpServers}}\"\n" + steps + "\n";
                    using (StringContent content = new StringContent(profileYaml, Encoding.UTF8, "application/yaml"))
                    using (HttpResponseMessage response = await builder.PostAsync(t + "/manifests/apply", content, token).ConfigureAwait(false))
                    {
                        Assert.Equal(200, (int)response.StatusCode, "Script profile: " + await response.Content.ReadAsStringAsync(token).ConfigureAwait(false));
                    }
                    HarnessProfile profile = Assert.NotNull((await host.Server.Context.Database.HarnessProfiles.EnumerateAsync(tenant.Id, new EnumerationQuery { MaxResults = 1000 }, token).ConfigureAwait(false)).Objects.FirstOrDefault(p => p.Name == "architect-script"), "Profile");

                    // The person opens a draft and picks the guided architect prompt (the wizard's choice).
                    StudioDraft draft = await HttpTestHelpers.SendAsync<StudioDraft>(builder, HttpMethod.Post, t + "/studio/drafts", new StudioDraftCreateRequest { Title = "Desk app" }, 201, token).ConfigureAwait(false);
                    string agentA = "apiVersion: garrison/v1\nkind: Agent\nmetadata:\n  name: desk-front\n  description: Talks to people\nspec:\n  displayName: Front desk\n  delegation:\n    allow: [desk-helper]\n    maxDepth: 1\n";
                    string agentB = "apiVersion: garrison/v1\nkind: Agent\nmetadata:\n  name: desk-helper\n  description: Helps the front desk\nspec:\n  displayName: Helper\n";
                    string depA = "apiVersion: garrison/v1\nkind: Deployment\nmetadata:\n  name: desk-front-dev\nspec:\n  agent: desk-front\n  harnessProfile: builtin/fake\n  environment: dev\n  argumentOverrides:\n    - { position: 0, operation: Append, template: --output-last-message }\n    - { position: 1, operation: Append, template: files/answer.txt }\n";
                    string depB = "apiVersion: garrison/v1\nkind: Deployment\nmetadata:\n  name: desk-helper-dev\nspec:\n  agent: desk-helper\n  harnessProfile: builtin/fake\n  environment: dev\n";
                    string app = "apiVersion: garrison/v1\nkind: AgenticApp\nmetadata:\n  name: desk-app\nspec:\n  entry: desk-front\n  members:\n    - { agent: desk-front }\n    - { agent: desk-helper }\n  edges:\n    - { from: desk-front, to: desk-helper, fanOut: false }\n  environments:\n    - { environment: dev, deployment: desk-front-dev }\n  liveEnvironment: dev\n  authMode: Anonymous\n  anonymousEnabled: true\n";
                    string[][] items = { new[] { "Agent", "desk-front", agentA }, new[] { "Agent", "desk-helper", agentB }, new[] { "Deployment", "desk-front-dev", depA }, new[] { "Deployment", "desk-helper-dev", depB }, new[] { "AgenticApp", "desk-app", app } };
                    List<DeploymentParameter> parameters = new List<DeploymentParameter>();
                    for (int i = 0; i < items.Length; i++)
                    {
                        parameters.Add(new DeploymentParameter { Name = "step" + (i + 1), Value = "garrison,garrison_studio_put_item," + Serializer.Serialize(new { draftId = draft.Id, version = draft.Version + i, kind = items[i][0], name = items[i][1], document = items[i][2] }) });
                    }
                    parameters.Add(new DeploymentParameter { Name = "step6", Value = "garrison,garrison_studio_request_apply," + Serializer.Serialize(new { draftId = draft.Id, version = draft.Version + 5 }) });
                    Agent architectAgent = (await HttpTestHelpers.SendAsync<EnumerationResult<Agent>>(builder, HttpMethod.Get, t + "/agents", null, 200, token).ConfigureAwait(false)).Objects.Single();
                    Deployment architect = await HttpTestHelpers.SendAsync<Deployment>(builder, HttpMethod.Post, t + "/deployments", new Deployment { Name = "architect", AgentId = architectAgent.Id, HarnessProfileId = profile.Id, ArchitectPromptTemplateId = "builtin/agent-architect-guided", Parameters = parameters }, 201, token).ConfigureAwait(false);
                    Assert.True(architect.ManagementAccess == ManagementAccessEnum.Drafts && architect.PromptBindings.Any(b => b.Role == "System" && b.TemplateId == "tpl_builtin_agent_architect_guided"), "Architect on the guided prompt with Drafts access");

                    Run designed = await HttpTestHelpers.SendAsync<Run>(builder, HttpMethod.Post, t + "/agents/agent-architect/invoke", new InvokeRequest { Input = "Build me a front desk with a helper.", DeploymentId = architect.Id, StartConversation = true, StudioDraftId = draft.Id, Wait = true, WaitSeconds = 120 }, 200, token).ConfigureAwait(false);
                    Assert.Equal(RunStatusEnum.Succeeded, designed.Status, "The architect turn succeeds: " + designed.ErrorMessage);
                    StudioDraft pending = await HttpTestHelpers.SendAsync<StudioDraft>(builder, HttpMethod.Get, t + "/studio/drafts/" + draft.Id, null, 200, token).ConfigureAwait(false);
                    Assert.True(pending.Status == StudioDraftStatusEnum.PendingApproval && pending.Items.Count == 5 && pending.ConversationId == designed.ConversationId, "The architect built five items and asked for approval: " + designed.ResultText);
                    Approval decided = await HttpTestHelpers.SendAsync<Approval>(builder, HttpMethod.Post, t + "/approvals/" + pending.ApprovalId + "/decide", new ApprovalDecideRequest { Decision = ApprovalDecisionEnum.Allow }, 200, token).ConfigureAwait(false);
                    Assert.Equal(ApprovalStatusEnum.Approved, decided.Status, "Approved");
                    Deployment frontDev = (await HttpTestHelpers.SendAsync<EnumerationResult<Deployment>>(builder, HttpMethod.Get, t + "/deployments?search=desk-front-dev", null, 200, token).ConfigureAwait(false)).Objects.Single();
                    Assert.Equal("dev", frontDev.Environment, "Deployed to dev");

                    using (HttpClient end = new HttpClient { BaseAddress = host.AdminClient.BaseAddress })
                    {
                        Assert.Equal(200, (int)(await end.GetAsync("/v1.0/apps/desk-app", token).ConfigureAwait(false)).StatusCode, "The app URL answers");
                        string session;
                        using (StringContent content = new StringContent("{}", Encoding.UTF8, "application/json"))
                        using (HttpResponseMessage response = await end.PostAsync("/v1.0/apps/desk-app/session", content, token).ConfigureAwait(false))
                        {
                            session = Assert.NotNull(Serializer.Deserialize<AppSessionResponse>(await response.Content.ReadAsStringAsync(token).ConfigureAwait(false)), "Session").Token;
                        }
                        end.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", session);
                        string conversationId;
                        using (StringContent content = new StringContent("{\"message\":\"First question\"}", Encoding.UTF8, "application/json"))
                        using (HttpResponseMessage started = await end.PostAsync("/v1.0/apps/desk-app/conversations", content, token).ConfigureAwait(false))
                        {
                            conversationId = Assert.NotNull(Serializer.Deserialize<Dictionary<string, object>>(await started.Content.ReadAsStringAsync(token).ConfigureAwait(false))?["conversationId"]?.ToString(), "Conversation id");
                        }
                        await WaitTurnsAsync(end, conversationId, 1, token).ConfigureAwait(false);
                        using (StringContent content = new StringContent("{\"message\":\"Second question\"}", Encoding.UTF8, "application/json"))
                        using (HttpResponseMessage next = await end.PostAsync("/v1.0/apps/desk-app/conversations/" + conversationId + "/messages", content, token).ConfigureAwait(false))
                        {
                            Assert.Equal(201, (int)next.StatusCode, "Second turn: " + await next.Content.ReadAsStringAsync(token).ConfigureAwait(false));
                        }
                        AppConversationView view = await WaitTurnsAsync(end, conversationId, 2, token).ConfigureAwait(false);
                        Assert.True(view.Turns.All(x => x.Status == RunStatusEnum.Succeeded), "Two turns answered");
                        string file = await end.GetStringAsync("/v1.0/apps/desk-app/conversations/" + conversationId + "/files/content?path=answer.txt", token).ConfigureAwait(false);
                        Assert.True(file.Contains("Second question", StringComparison.Ordinal), "The file the agent wrote downloads with the latest answer: " + file);
                    }

                    // Promote to staging and roll back.
                    foreach (string agentName in new[] { "desk-front", "desk-helper" })
                    {
                        Agent agent = await HttpTestHelpers.SendAsync<Agent>(builder, HttpMethod.Get, t + "/agents/" + agentName, null, 200, token).ConfigureAwait(false);
                        await HttpTestHelpers.SendAsync<Deployment>(builder, HttpMethod.Post, t + "/deployments", new Deployment { Name = agentName + "-staging", AgentId = agent.Id, HarnessProfileId = "hrn_builtin_fake", Environment = "staging" }, 201, token).ConfigureAwait(false);
                    }
                    await HttpTestHelpers.SendAsync<AppRevision>(builder, HttpMethod.Post, t + "/apps/desk-app/revisions", new AppRevisionRequest { ChangeNote = "First" }, 201, token).ConfigureAwait(false);
                    await HttpTestHelpers.SendAsync<AppRevision>(builder, HttpMethod.Post, t + "/apps/desk-app/revisions/1/publish", null, 200, token).ConfigureAwait(false);
                    PromotionRecord promoted = await HttpTestHelpers.SendAsync<PromotionRecord>(builder, HttpMethod.Post, t + "/apps/desk-app/promote", new AppPromotionRequest { SourceEnvironment = "dev" }, 201, token).ConfigureAwait(false);
                    Assert.True(promoted.TargetEnvironment == "staging" && promoted.Items.Count == 2, "Both members promoted to staging");
                    PromotionRecord rolled = await HttpTestHelpers.SendAsync<PromotionRecord>(builder, HttpMethod.Post, t + "/promotions/" + promoted.Id + "/rollback", new PromotionRollbackRequest(), 201, token).ConfigureAwait(false);
                    Assert.Equal(promoted.Id, rolled.RollbackOfId ?? String.Empty, "The rollback record points at the promotion");
                }
            }
        }

        private static async Task<AppConversationView> WaitTurnsAsync(HttpClient client, string conversationId, int turns, CancellationToken token)
        {
            DateTime deadline = DateTime.UtcNow.AddSeconds(90);
            while (true)
            {
                AppConversationView view = Assert.NotNull(Serializer.Deserialize<AppConversationView>(await client.GetStringAsync("/v1.0/apps/desk-app/conversations/" + conversationId, token).ConfigureAwait(false)), "Conversation");
                if (view.Turns.Count >= turns && view.Turns.All(x => Garrison.Server.Runtime.RunService.IsTerminal(x.Status))) return view;
                if (DateTime.UtcNow > deadline) throw new TestAssertionException("Turn " + turns + " did not finish: " + Serializer.Serialize(view));
                await Task.Delay(250, token).ConfigureAwait(false);
            }
        }

        private static async Task<string> ReceiveUntilAsync(ClientWebSocket socket, string type, string contains, CancellationToken token)
        {
            DateTime deadline = DateTime.UtcNow.AddSeconds(15);
            byte[] buffer = new byte[262144];
            while (DateTime.UtcNow < deadline)
            {
                using (CancellationTokenSource timeout = CancellationTokenSource.CreateLinkedTokenSource(token))
                {
                    timeout.CancelAfter(TimeSpan.FromSeconds(5));
                    using (MemoryStream message = new MemoryStream())
                    {
                        WebSocketReceiveResult result;
                        do
                        {
                            result = await socket.ReceiveAsync(buffer, timeout.Token).ConfigureAwait(false);
                            message.Write(buffer, 0, result.Count);
                        }
                        while (!result.EndOfMessage);
                        string text = Encoding.UTF8.GetString(message.ToArray());
                        if (text.Contains(type, StringComparison.Ordinal) && text.Contains(contains, StringComparison.Ordinal)) return text;
                    }
                }
            }
            throw new TestAssertionException("No " + type + " message containing " + contains + " within 15 seconds.");
        }

        #endregion
    }
}
