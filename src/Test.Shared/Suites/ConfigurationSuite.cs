namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Net.Http;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Manifests;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Security;
    using Garrison.Core.Serialization;
    using Garrison.Core.Services;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Configuration API suites over HTTP: built-in protection and cloning, prompt versioning, secrets, deployments,
    /// manifests, and agents.
    /// </summary>
    public static class ConfigurationSuite
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
                string id = "configuration-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                cases.Add(new TestCaseDescriptor(id, "builtin-profiles", "Every built-in harness profile is immutable and can be cloned and updated (" + provider + ")", ct => BuiltInProfilesAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "prompt-versions", "Prompt templates version on update, restore, clone, reset, and render (" + provider + ")", ct => PromptVersionsAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "secrets", "Secret values are write-only and in-use secrets cannot be deleted (" + provider + ")", ct => SecretsAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "deployments", "Deployments validate references, default prompt bindings, version on update, and preview (" + provider + ")", ct => DeploymentsAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "manifests", "Manifests dry-run, apply, re-apply unchanged, export, and reject bad references (" + provider + ")", ct => ManifestsAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "manifest-reference-cache", "I-06: one apply reads each referenced record once (harness profile reads do not grow with documents) for dry run, apply, and re-apply, and references to documents created or updated in the same apply still resolve (" + provider + ")", ct => ManifestReferenceCacheAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "clamp-warnings", "I-08: out-of-range values are still clamped, and REST create and update responses and manifest apply items (dry run, apply, and the stored record) say which field, the given value, and the stored value (" + provider + ")", ct => ClampWarningsAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "agents", "Agent self-registration is idempotent and the A2A card renders (" + provider + ")", ct => AgentsAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "agents-by-name", "Agent read, card, update, and delete accept a name; IDs take precedence (" + provider + ")", ct => AgentsByNameAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "delete-no-content", "Deleting one configuration resource answers 204 with no body, and a second delete 404 (" + provider + ")", ct => DeleteNoContentAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "agent-card-renderer", "The A2A card route, the tenant catalog, and the REST card route render one card with templates and the garrison scheme (" + provider + ")", ct => AgentCardRendererAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "external-urls", "A2A cards use the external URL or request host while runs get the internal URL (" + provider + ")", ct => ExternalUrlsAsync(provider, ct)));
                suites.Add(new TestSuiteDescriptor(id, "Configuration API (" + provider + ")", cases));
            }
            return suites;
        }

        #endregion

        #region Private-Methods

        private static string T(TestServerHost host)
        {
            return "/v1.0/api/tenants/" + host.TenantId;
        }

        private static async Task BuiltInProfilesAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                List<HarnessProfile> builtIns = await HttpTestHelpers.SendAsync<List<HarnessProfile>>(host.AdminClient, HttpMethod.Get, "/v1.0/api/harness-profiles/builtin", null, 200, token).ConfigureAwait(false);
                Assert.True(builtIns.Count >= 6, "six built-in profiles");
                foreach (HarnessProfile builtIn in builtIns)
                {
                    TestResponse denied = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Put, T(host) + "/harness-profiles/" + builtIn.Id, builtIn, token).ConfigureAwait(false);
                    Assert.Equal(409, denied.StatusCode, "update of " + builtIn.Name);
                    TestResponse deleteDenied = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, T(host) + "/harness-profiles/" + builtIn.Id, null, token).ConfigureAwait(false);
                    Assert.Equal(409, deleteDenied.StatusCode, "delete of " + builtIn.Name);

                    HarnessProfile clone = await HttpTestHelpers.SendAsync<HarnessProfile>(host.AdminClient, HttpMethod.Post, T(host) + "/harness-profiles/" + builtIn.Id + "/clone", new CloneRequest { Name = "copy-" + builtIn.BuiltInKey }, 201, token).ConfigureAwait(false);
                    Assert.Equal(builtIn.Arguments.Count, clone.Arguments.Count, "clone arguments of " + builtIn.Name);
                    clone.Description = "Edited copy.";
                    HarnessProfile updated = await HttpTestHelpers.SendAsync<HarnessProfile>(host.AdminClient, HttpMethod.Put, T(host) + "/harness-profiles/" + clone.Id, clone, 200, token).ConfigureAwait(false);
                    Assert.Equal("Edited copy.", updated.Description, "update of clone " + clone.Name);
                    for (int i = 0; i < builtIn.Environment.Count; i++) Assert.Equal(builtIn.Environment[i].Name, updated.Environment[i].Name, "environment order of " + clone.Name);
                }
            }
        }

        private static async Task PromptVersionsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                string b = T(host) + "/prompt-templates";
                PromptTemplate created = await HttpTestHelpers.SendAsync<PromptTemplate>(host.AdminClient, HttpMethod.Post, b, new PromptTemplateRequest { Name = "greeter", Kind = PromptTemplateKindEnum.Task, Content = "v1 {{input.message}}" }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<PromptTemplate>(host.AdminClient, HttpMethod.Put, b + "/" + created.Id, new PromptTemplateRequest { Name = "greeter", Kind = PromptTemplateKindEnum.Task, Content = "v2 {{input.message}}" }, 200, token).ConfigureAwait(false);
                PromptTemplate v3 = await HttpTestHelpers.SendAsync<PromptTemplate>(host.AdminClient, HttpMethod.Put, b + "/" + created.Id, new PromptTemplateRequest { Name = "greeter", Kind = PromptTemplateKindEnum.Task, Content = "v3 {{input.message}}" }, 200, token).ConfigureAwait(false);
                Assert.Equal(3, v3.CurrentVersion, "version after two updates");
                List<PromptTemplateVersion> versions = await HttpTestHelpers.SendAsync<List<PromptTemplateVersion>>(host.AdminClient, HttpMethod.Get, b + "/" + created.Id + "/versions", null, 200, token).ConfigureAwait(false);
                Assert.Equal(3, versions.Count, "version rows");
                PromptTemplate restored = await HttpTestHelpers.SendAsync<PromptTemplate>(host.AdminClient, HttpMethod.Post, b + "/" + created.Id + "/restore/1", null, 200, token).ConfigureAwait(false);
                Assert.Equal("v1 {{input.message}}", restored.Content, "restored content");
                Assert.Equal(4, restored.CurrentVersion, "restore creates a version");

                TestResponse badSecret = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, b, new PromptTemplateRequest { Name = "leaky", Content = "{{secret.key}}" }, token).ConfigureAwait(false);
                Assert.Equal(400, badSecret.StatusCode, "secret reference in a prompt is rejected");

                EnumerationResult<PromptTemplate> all = await HttpTestHelpers.SendAsync<EnumerationResult<PromptTemplate>>(host.AdminClient, HttpMethod.Get, b + "?maxResults=100", null, 200, token).ConfigureAwait(false);
                PromptTemplate system = all.Objects.First(t => t.Name == "builtin/default-system");
                PromptTemplate copy = await HttpTestHelpers.SendAsync<PromptTemplate>(host.AdminClient, HttpMethod.Post, b + "/" + system.Id + "/clone", new CloneRequest { Name = "my-system" }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<PromptTemplate>(host.AdminClient, HttpMethod.Put, b + "/" + copy.Id, new PromptTemplateRequest { Name = "my-system", Kind = PromptTemplateKindEnum.System, Content = "custom" }, 200, token).ConfigureAwait(false);
                PromptTemplate reset = await HttpTestHelpers.SendAsync<PromptTemplate>(host.AdminClient, HttpMethod.Post, b + "/" + copy.Id + "/reset", null, 200, token).ConfigureAwait(false);
                Assert.Equal(system.Content, reset.Content, "reset to built-in default");

                PromptRenderResponse render = await HttpTestHelpers.SendAsync<PromptRenderResponse>(host.AdminClient, HttpMethod.Post, b + "/" + system.Id + "/render", "{\"context\":{\"agent\":{\"displayName\":\"Render Bot\"}}}", 200, token).ConfigureAwait(false);
                Assert.True(render.Success && render.Rendered.Contains("Render Bot", StringComparison.Ordinal), "render preview uses sample context overrides");
            }
        }

        private static async Task SecretsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                TestResponse created = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/secrets", new SecretRequest { Name = "anthropic", Kind = SecretKindEnum.AnthropicApiKey, Value = "sk-ant-supersecret-1234" }, token).ConfigureAwait(false);
                Assert.Equal(201, created.StatusCode, "create");
                Assert.True(!created.Body.Contains("supersecret", StringComparison.Ordinal), "value never returned");
                Secret secret = Serializer.Deserialize<Secret>(created.Body)!;
                Assert.Equal("1234", secret.ValueLast4, "last four");
                Secret rotated = await HttpTestHelpers.SendAsync<Secret>(host.AdminClient, HttpMethod.Post, T(host) + "/secrets/" + secret.Id + "/rotate", new SecretValueRequest { Value = "sk-ant-new-9876" }, 200, token).ConfigureAwait(false);
                Assert.Equal("9876", rotated.ValueLast4, "rotated");

                string deploymentId = await MinimalDeploymentAsync(host, secret.Id, token).ConfigureAwait(false);
                TestResponse inUse = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, T(host) + "/secrets/" + secret.Id, null, token).ConfigureAwait(false);
                Assert.Equal(409, inUse.StatusCode, "in-use secret cannot be deleted");
                await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, T(host) + "/deployments/" + deploymentId, null, token).ConfigureAwait(false);
                TestResponse deleted = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, T(host) + "/secrets/" + secret.Id, null, token).ConfigureAwait(false);
                Assert.Equal(204, deleted.StatusCode, "delete after unbinding");
                Assert.True(String.IsNullOrEmpty(deleted.Body), "204 has no body: " + deleted.Body);
            }
        }

        private static async Task DeploymentsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                Deployment bad = new Deployment { Name = "bad", AgentId = "agt_missing", HarnessProfileId = "hrn_builtin_fake" };
                TestResponse badResponse = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/deployments", bad, token).ConfigureAwait(false);
                Assert.Equal(400, badResponse.StatusCode, "missing agent rejected");
                Assert.True(badResponse.Body.Contains("agentId", StringComparison.Ordinal), "field error names agentId");

                Secret secret = await HttpTestHelpers.SendAsync<Secret>(host.AdminClient, HttpMethod.Post, T(host) + "/secrets", new SecretRequest { Name = "oauth", Kind = SecretKindEnum.ClaudeCodeOAuthToken, Value = "oauth-token-abcdef" }, 201, token).ConfigureAwait(false);
                string id = await MinimalDeploymentAsync(host, secret.Id, token).ConfigureAwait(false);
                Deployment deployment = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Get, T(host) + "/deployments/" + id, null, 200, token).ConfigureAwait(false);
                Assert.True(deployment.PromptBindings.Any(p => p.Role == "System") && deployment.PromptBindings.Any(p => p.Role == "Task") && deployment.PromptBindings.Any(p => p.Role == "DelegatedTask"), "default prompt bindings added");

                deployment.Model = "opus";
                Deployment updated = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Put, T(host) + "/deployments/" + id, deployment, 200, token).ConfigureAwait(false);
                Assert.Equal(2, updated.ConfigVersion, "config version increments");

                CompilePreviewResponse preview = await HttpTestHelpers.SendAsync<CompilePreviewResponse>(host.AdminClient, HttpMethod.Post, T(host) + "/deployments/" + id + "/compile-preview", new CompilePreviewRequest { Input = "Hi" }, 200, token).ConfigureAwait(false);
                Assert.True(preview.CommandLine.StartsWith("claude -p", StringComparison.Ordinal), "command line");
                Assert.True(!Serializer.Serialize(preview).Contains("oauth-token-abcdef", StringComparison.Ordinal), "secret redacted in preview");
                Assert.True(preview.TemplateVersions.Count >= 2, "template versions reported");
            }
        }

        private static async Task ManifestsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                string yaml = String.Join("\n", new string[]
                {
                    "apiVersion: garrison/v1",
                    "kind: Agent",
                    "metadata:",
                    "  name: claude-helper",
                    "spec:",
                    "  displayName: Claude Helper",
                    "  description: General-purpose assistant.",
                    "  exposure: { a2a: true, mcpTool: true }",
                    "  delegation: { maxDepth: 2, allow: [codex-coder] }",
                    "---",
                    "apiVersion: garrison/v1",
                    "kind: Secret",
                    "metadata:",
                    "  name: claude-oauth-token",
                    "spec:",
                    "  kind: ClaudeCodeOAuthToken",
                    "---",
                    "apiVersion: garrison/v1",
                    "kind: Deployment",
                    "metadata:",
                    "  name: claude-helper-default",
                    "spec:",
                    "  agent: claude-helper",
                    "  harnessProfile: builtin/claude-code",
                    "  model: sonnet",
                    "  requiredCapabilities: { coldStartClass: Immediate, sessionContinuation: true }",
                    "  maxTurns: 8",
                    "  prompts:",
                    "    System: builtin/default-system",
                    "  resources:",
                    "    secrets:",
                    "      - { alias: anthropic, secret: claude-oauth-token }",
                    "  parameters: { permissionMode: acceptEdits }",
                    "  timeoutSeconds: 600",
                    "  nodeSelector: { garrison.io/harness-claude: \"true\" }"
                });

                ManifestApply dry = await ApplyAsync(host, yaml, "?dryRun=true", 200, token).ConfigureAwait(false);
                Assert.True(dry.Items.All(i => i.Result == ManifestApplyResultEnum.Validated), "dry run validates only");
                Assert.True(await NotFoundAsync(host, "/agents?search=claude-helper", token).ConfigureAwait(false), "dry run writes nothing");

                ManifestApply first = await ApplyAsync(host, yaml, String.Empty, 200, token).ConfigureAwait(false);
                Assert.Equal(3, first.CreatedCount, "created");
                ManifestApply second = await ApplyAsync(host, yaml, String.Empty, 200, token).ConfigureAwait(false);
                Assert.Equal(3, second.UnchangedCount, "re-apply unchanged");

                EnumerationResult<Deployment> deployments = await HttpTestHelpers.SendAsync<EnumerationResult<Deployment>>(host.AdminClient, HttpMethod.Get, T(host) + "/deployments", null, 200, token).ConfigureAwait(false);
                Deployment deployment = deployments.Objects.First(d => d.Name == "claude-helper-default");
                Assert.True(deployment.PromptBindings.Any(p => p.Role == "Task"), "missing roles defaulted in manifests");
                Assert.Equal(600, deployment.TimeoutSeconds ?? 0, "timeout");
                Assert.True(deployment.RequiredCapabilities.SessionContinuation && deployment.RequiredCapabilities.ColdStartClass == ExecutorColdStartEnum.Immediate, "Manifest capability requirements persist");

                TestResponse export = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, T(host) + "/manifests/export", null, token).ConfigureAwait(false);
                Assert.True(export.Body.Contains("kind: Deployment", StringComparison.Ordinal) && export.Body.Contains("claude-helper-default", StringComparison.Ordinal), "export");

                ManifestApply reapplyExport = await ApplyAsync(host, export.Body, String.Empty, 200, token).ConfigureAwait(false);
                Assert.Equal(0, reapplyExport.FailedCount, "exported manifests re-apply");
                Assert.True(export.Body.Contains("requiredCapabilities", StringComparison.Ordinal), "Export retains advanced executor requirements");
                Deployment reapplied = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Get, T(host) + "/deployments/" + deployment.Id, null, 200, token).ConfigureAwait(false);
                Assert.True(reapplied.RequiredCapabilities.SessionContinuation, "Exported requirement survives reapplication");

                ManifestApply broken = await ApplyAsync(host, "apiVersion: garrison/v1\nkind: Deployment\nmetadata: { name: broken }\nspec: { agent: nobody, harnessProfile: builtin/fake }\n", String.Empty, 400, token).ConfigureAwait(false);
                Assert.Equal(1, broken.FailedCount, "bad reference fails");
            }
        }

        private static async Task AgentsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                Agent agent = new Agent { Name = "remote-helper", Kind = AgentKindEnum.Remote, RemoteProtocol = RemoteProtocolEnum.A2A, RemoteEndpointUrl = "https://agents.example.com/a2a", Description = "Remote helper." };
                Agent first = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/register", agent, 201, token).ConfigureAwait(false);
                agent.Description = "Remote helper, updated.";
                Agent second = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/register", agent, 200, token).ConfigureAwait(false);
                Assert.Equal(first.Id, second.Id, "idempotent by name");
                Assert.True(second.LastRegisteredUtc.HasValue, "registration time recorded");
                TestResponse card = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, T(host) + "/agents/" + first.Id + "/card", null, token).ConfigureAwait(false);
                Assert.Equal(200, card.StatusCode, "card");
                Assert.True(card.Body.Contains("/v1.0/a2a/" + host.TenantId + "/remote-helper", StringComparison.Ordinal), "card URL");
                TestResponse badName = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/agents", new Agent { Name = "Bad Name" }, token).ConfigureAwait(false);
                Assert.Equal(400, badName.StatusCode, "invalid agent name");
            }
        }

        private static async Task AgentsByNameAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                Agent alpha = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, T(host) + "/agents", new Agent { Name = "alpha-agent", Description = "Alpha." }, 201, token).ConfigureAwait(false);

                Agent byName = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Get, T(host) + "/agents/alpha-agent", null, 200, token).ConfigureAwait(false);
                Assert.Equal(alpha.Id, byName.Id, "read by name");
                Agent byId = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Get, T(host) + "/agents/" + alpha.Id, null, 200, token).ConfigureAwait(false);
                Assert.Equal(alpha.Id, byId.Id, "read by ID");
                TestResponse missing = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, T(host) + "/agents/no-such-agent", null, token).ConfigureAwait(false);
                Assert.Equal(404, missing.StatusCode, "unknown name");

                TestResponse card = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, T(host) + "/agents/alpha-agent/card", null, token).ConfigureAwait(false);
                Assert.Equal(200, card.StatusCode, "card by name");
                Assert.True(card.Body.Contains("/v1.0/a2a/" + host.TenantId + "/alpha-agent", StringComparison.Ordinal), "card by name URL");

                byName.Description = "Alpha, updated by name.";
                Agent updated = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Put, T(host) + "/agents/alpha-agent", byName, 200, token).ConfigureAwait(false);
                Assert.Equal(alpha.Id, updated.Id, "update by name keeps the ID");
                Assert.Equal("Alpha, updated by name.", updated.Description, "update by name");

                // An agent whose name equals another agent's ID: the ID wins.
                Agent shadow = new Agent();
                shadow.TenantId = host.TenantId;
                shadow.Name = alpha.Id;
                shadow = await host.Server.Context.Database.Agents.CreateAsync(shadow, token).ConfigureAwait(false);
                Agent precedence = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Get, T(host) + "/agents/" + alpha.Id, null, 200, token).ConfigureAwait(false);
                Assert.Equal(alpha.Id, precedence.Id, "ID takes precedence over a name");
                Agent shadowRead = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Get, T(host) + "/agents/" + shadow.Id, null, 200, token).ConfigureAwait(false);
                Assert.Equal(alpha.Id, shadowRead.Name, "shadow agent still readable by its own ID");

                TestResponse deleted = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, T(host) + "/agents/alpha-agent", null, token).ConfigureAwait(false);
                Assert.Equal(204, deleted.StatusCode, "delete by name");
                TestResponse gone = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, T(host) + "/agents/alpha-agent", null, token).ConfigureAwait(false);
                Assert.Equal(404, gone.StatusCode, "deleted agent is gone");

                await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, T(host) + "/agents", new Agent { Name = "tenant-local" }, 201, token).ConfigureAwait(false);
                Tenant second = await HttpTestHelpers.SendAsync<Tenant>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants", new TenantRequest { Name = "Second " + Guid.NewGuid().ToString("N").Substring(0, 6) }, 201, token).ConfigureAwait(false);
                TestResponse crossTenant = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, "/v1.0/api/tenants/" + second.Id + "/agents/tenant-local", null, token).ConfigureAwait(false);
                Assert.Equal(404, crossTenant.StatusCode, "names resolve within the tenant only");
            }
        }

        private static async Task DeleteNoContentAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                List<string> paths = new List<string>();
                PromptTemplate template = await HttpTestHelpers.SendAsync<PromptTemplate>(host.AdminClient, HttpMethod.Post, T(host) + "/prompt-templates", new PromptTemplate { Name = "delete-me", Kind = PromptTemplateKindEnum.Fragment, Content = "x" }, 201, token).ConfigureAwait(false);
                paths.Add(T(host) + "/prompt-templates/" + template.Id);
                WorkspaceTemplate workspace = await HttpTestHelpers.SendAsync<WorkspaceTemplate>(host.AdminClient, HttpMethod.Post, T(host) + "/workspace-templates", new WorkspaceTemplate { Name = "delete-me" }, 201, token).ConfigureAwait(false);
                paths.Add(T(host) + "/workspace-templates/" + workspace.Id);
                McpServer server = await HttpTestHelpers.SendAsync<McpServer>(host.AdminClient, HttpMethod.Post, T(host) + "/mcp-servers", new McpServer { Name = "delete-me", Url = "http://127.0.0.1:9/mcp" }, 201, token).ConfigureAwait(false);
                paths.Add(T(host) + "/mcp-servers/" + server.Id);
                ArtifactStore store = await HttpTestHelpers.SendAsync<ArtifactStore>(host.AdminClient, HttpMethod.Post, T(host) + "/artifact-stores", new ArtifactStore { Name = "delete-me" }, 201, token).ConfigureAwait(false);
                paths.Add(T(host) + "/artifact-stores/" + store.Id);
                HarnessProfile fake = Assert.NotNull(await host.Server.Context.Database.HarnessProfiles.ReadByNameAsync(host.TenantId, "builtin/fake", token).ConfigureAwait(false), "Fake profile");
                HarnessProfile clone = await HttpTestHelpers.SendAsync<HarnessProfile>(host.AdminClient, HttpMethod.Post, T(host) + "/harness-profiles/" + fake.Id + "/clone", new CloneRequest { Name = "delete-me" }, 201, token).ConfigureAwait(false);
                paths.Add(T(host) + "/harness-profiles/" + clone.Id);
                Agent agent = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, T(host) + "/agents", new Agent { Name = "delete-me" }, 201, token).ConfigureAwait(false);
                paths.Add(T(host) + "/agents/" + agent.Id);
                User user = await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, T(host) + "/users", new UserRequest { Email = "delete-me@example.com", Password = "password123" }, 201, token).ConfigureAwait(false);
                paths.Add(T(host) + "/users/" + user.Id);
                Tenant tenant = await HttpTestHelpers.SendAsync<Tenant>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants", new TenantRequest { Name = "Delete me " + Guid.NewGuid().ToString("N").Substring(0, 6) }, 201, token).ConfigureAwait(false);
                paths.Add("/v1.0/api/tenants/" + tenant.Id);

                foreach (string path in paths)
                {
                    TestResponse first = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, path, null, token).ConfigureAwait(false);
                    Assert.Equal(204, first.StatusCode, "DELETE " + path + " (" + first.Body + ")");
                    Assert.True(String.IsNullOrEmpty(first.Body), "DELETE " + path + " returned a body: " + first.Body);
                    TestResponse second = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, path, null, token).ConfigureAwait(false);
                    Assert.Equal(404, second.StatusCode, "Second DELETE " + path + " (" + second.Body + ")");
                }
            }
        }

        private static async Task AgentCardRendererAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                PromptTemplate skillTemplate = new PromptTemplate();
                skillTemplate.Name = "card-skill";
                skillTemplate.Kind = PromptTemplateKindEnum.ToolDescription;
                skillTemplate.Content = "Skill of {{agent.name | upper}} in {{tenant.id}}{{#if agent.description}}: {{agent.description}}{{/if}}";
                PromptTemplate createdSkill = await HttpTestHelpers.SendAsync<PromptTemplate>(host.AdminClient, HttpMethod.Post, T(host) + "/prompt-templates", skillTemplate, 201, token).ConfigureAwait(false);

                Agent templated = new Agent { Name = "card-agent", DisplayName = "Card Agent", ExposeA2A = true, SkillDescriptionTemplateId = createdSkill.Id, InputMode = AgentInputModeEnum.Structured };
                templated.Tags.Add("docs");
                await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, T(host) + "/agents", templated, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, T(host) + "/agents", new Agent { Name = "plain-agent", Description = "Plain description.", ExposeA2A = true }, 201, token).ConfigureAwait(false);

                string hostHeader = "cards.example.com";
                Voltaic.A2A.AgentCard viaRest = ParseCard(await GetWithHostAsync(host, T(host) + "/agents/card-agent/card", hostHeader, null, token).ConfigureAwait(false));
                Voltaic.A2A.AgentCard viaA2A = ParseCard(await GetWithHostAsync(host, "/v1.0/a2a/" + host.TenantId + "/card-agent/.well-known/agent-card.json", hostHeader, null, token).ConfigureAwait(false));
                string catalogJson = await GetWithHostAsync(host, "/v1.0/a2a/" + host.TenantId, hostHeader, null, token).ConfigureAwait(false);
                List<Voltaic.A2A.AgentCard> catalog = System.Text.Json.JsonSerializer.Deserialize<List<Voltaic.A2A.AgentCard>>(catalogJson, Voltaic.A2A.A2AJson.DefaultOptions) ?? new List<Voltaic.A2A.AgentCard>();
                Voltaic.A2A.AgentCard viaCatalog = Assert.NotNull(catalog.FirstOrDefault(c => c.Name == "Card Agent"), "Catalog card");

                string expected = "Skill of CARD-AGENT in " + host.TenantId;
                foreach (Voltaic.A2A.AgentCard card in new[] { viaRest, viaA2A, viaCatalog })
                {
                    Assert.Equal("Card Agent", card.Name, "Card name");
                    Assert.Equal(expected, card.Description, "Card description is the rendered skill template");
                    Assert.Equal(1, card.Skills.Count, "Skill count");
                    Assert.Equal(expected, card.Skills[0].Description, "Skill description is the rendered skill template (filters and conditionals apply)");
                    Assert.True(card.Skills[0].Tags.Contains("docs"), "Skill tags");
                    Assert.Equal("application/json", card.DefaultInputModes.FirstOrDefault(), "Structured agents take JSON");
                    Assert.True(card.SecuritySchemes != null && card.SecuritySchemes.Count == 1 && card.SecuritySchemes.ContainsKey("garrison"), "Security scheme key is garrison");
                    Assert.Equal("bearer", card.SecuritySchemes!["garrison"].HttpAuthSecurityScheme?.Scheme, "Bearer scheme");
                    Assert.True(card.SecurityRequirements != null && card.SecurityRequirements.Count == 1 && card.SecurityRequirements[0].Schemes?.ContainsKey("garrison") == true, "Security requirement names the garrison scheme");
                    Assert.Equal("Garrison", card.Provider?.Organization, "Provider");
                    Assert.Equal("http://" + hostHeader + "/v1.0/a2a/" + host.TenantId + "/card-agent", card.SupportedInterfaces[0].Url, "Interface URL");
                }

                Voltaic.A2A.AgentCard plain = ParseCard(await GetWithHostAsync(host, "/v1.0/a2a/" + host.TenantId + "/plain-agent/.well-known/agent-card.json", hostHeader, null, token).ConfigureAwait(false));
                Assert.Equal("Plain description.", plain.Description, "Built-in skill template renders the description");
                Assert.Equal("Plain description.", plain.Skills[0].Description, "Built-in skill description");
                Assert.Equal("text/plain", plain.DefaultInputModes.FirstOrDefault(), "Text agents take text");
            }
        }

        private static Voltaic.A2A.AgentCard ParseCard(string json)
        {
            return System.Text.Json.JsonSerializer.Deserialize<Voltaic.A2A.AgentCard>(json, Voltaic.A2A.A2AJson.DefaultOptions) ?? throw new TestAssertionException("Card did not parse: " + json);
        }

        private static async Task ExternalUrlsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            Action<Garrison.Server.Settings.ServerSettings> configure = s =>
            {
                s.Rest.PublicBaseUrl = "http://garrison-server:8700";
                s.Mcp.PublicUrl = "http://garrison-server:8701";
            };
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, configure, token).ConfigureAwait(false))
            {
                Agent agent = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, T(host) + "/agents", new Agent { Name = "url-agent", ExposeA2A = true, DelegationMode = DelegationModeEnum.Any }, 201, token).ConfigureAwait(false);

                // No external URL set: cards follow the request's Host header (and X-Forwarded-Proto), never the internal URL.
                string viaHost = await GetWithHostAsync(host, T(host) + "/agents/url-agent/card", "garrison.example.com:9443", null, token).ConfigureAwait(false);
                Assert.True(viaHost.Contains("\"http://garrison.example.com:9443/v1.0/a2a/" + host.TenantId + "/url-agent\"", StringComparison.Ordinal), "card follows the Host header: " + viaHost);
                Assert.True(!viaHost.Contains("garrison-server", StringComparison.Ordinal), "card must not advertise the internal URL");
                string forwarded = await GetWithHostAsync(host, "/v1.0/a2a/" + host.TenantId + "/url-agent/.well-known/agent-card.json", "agents.example.org", "https", token).ConfigureAwait(false);
                Assert.True(forwarded.Contains("https://agents.example.org/v1.0/a2a/" + host.TenantId + "/url-agent", StringComparison.Ordinal), "A2A card honors X-Forwarded-Proto: " + forwarded);

                // External URL set: cards and server info use it regardless of the Host header.
                host.Settings.Rest.ExternalBaseUrl = "https://garrison.example.com/";
                string external = await GetWithHostAsync(host, T(host) + "/agents/url-agent/card", "10.0.0.5:8700", null, token).ConfigureAwait(false);
                Assert.True(external.Contains("https://garrison.example.com/v1.0/a2a/" + host.TenantId + "/url-agent", StringComparison.Ordinal), "card uses Rest.ExternalBaseUrl: " + external);
                string a2aCard = await GetWithHostAsync(host, "/v1.0/a2a/" + host.TenantId + "/url-agent/.well-known/agent-card.json", "10.0.0.5:8700", null, token).ConfigureAwait(false);
                Assert.True(a2aCard.Contains("https://garrison.example.com/v1.0/a2a/" + host.TenantId + "/url-agent", StringComparison.Ordinal), "A2A card uses Rest.ExternalBaseUrl: " + a2aCard);
                ServerInfoResponse info = await HttpTestHelpers.SendAsync<ServerInfoResponse>(host.AdminClient, HttpMethod.Get, "/v1.0/api/server-info", null, 200, token).ConfigureAwait(false);
                Assert.Equal("https://garrison.example.com", info.RestUrl, "server info uses the external URL");

                // Compiled runs still get the internal URLs.
                PromptTemplate template = new PromptTemplate();
                template.Name = "url-task";
                template.Kind = PromptTemplateKindEnum.Task;
                template.Content = "API {{garrison.apiUrl}} MCP {{garrison.mcpUrl}} INPUT {{input.text}}";
                PromptTemplate createdTemplate = await HttpTestHelpers.SendAsync<PromptTemplate>(host.AdminClient, HttpMethod.Post, T(host) + "/prompt-templates", template, 201, token).ConfigureAwait(false);
                HarnessProfile fake = (await host.Server.Context.Database.HarnessProfiles.ReadByNameAsync(host.TenantId, "builtin/fake", token).ConfigureAwait(false))!;
                Deployment deployment = new Deployment();
                deployment.Name = "url-agent-default";
                deployment.AgentId = agent.Id;
                deployment.HarnessProfileId = fake.Id;
                deployment.PromptBindings.Add(new DeploymentPromptBinding { Role = "Task", TemplateId = createdTemplate.Id });
                Deployment created = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Post, T(host) + "/deployments", deployment, 201, token).ConfigureAwait(false);
                TestResponse preview = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/deployments/" + created.Id + "/compile-preview", new CompilePreviewRequest { Input = "Hi" }, token).ConfigureAwait(false);
                Assert.Equal(200, preview.StatusCode, "compile preview: " + preview.Body);
                Assert.True(preview.Body.Contains("API http://garrison-server:8700", StringComparison.Ordinal), "runs get the internal REST URL: " + preview.Body);
                Assert.True(preview.Body.Contains("MCP http://garrison-server:8701/mcp", StringComparison.Ordinal), "runs get the internal MCP URL: " + preview.Body);
                Assert.True(!preview.Body.Contains("garrison.example.com", StringComparison.Ordinal), "runs must not get the external URL");
            }
        }

        private static async Task<string> GetWithHostAsync(TestServerHost host, string path, string hostHeader, string? forwardedProto, CancellationToken token)
        {
            using (HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, path))
            {
                request.Headers.Host = hostHeader;
                if (forwardedProto != null) request.Headers.Add("X-Forwarded-Proto", forwardedProto);
                using (HttpResponseMessage response = await host.AdminClient.SendAsync(request, token).ConfigureAwait(false))
                {
                    string body = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                    if ((int)response.StatusCode != 200) throw new TestAssertionException("GET " + path + " returned " + (int)response.StatusCode + ": " + body);
                    return body;
                }
            }
        }

        private static async Task<string> MinimalDeploymentAsync(TestServerHost host, string secretId, CancellationToken token)
        {
            Agent agent = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, T(host) + "/agents", new Agent { Name = "agent-" + Guid.NewGuid().ToString("N").Substring(0, 8) }, 201, token).ConfigureAwait(false);
            Deployment deployment = new Deployment();
            deployment.Name = agent.Name + "-default";
            deployment.AgentId = agent.Id;
            deployment.HarnessProfileId = "hrn_builtin_claude_code";
            deployment.ResourceBindings.Add(new DeploymentResourceBinding { Kind = ResourceBindingKindEnum.Secret, Alias = "credential", ResourceId = secretId });
            Deployment created = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Post, T(host) + "/deployments", deployment, 201, token).ConfigureAwait(false);
            return created.Id;
        }

        private static async Task ClampWarningsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                HttpClient admin = host.AdminClient;

                // Bodies are raw JSON: the C# models clamp on the client side too.
                TestResponse agentResponse = await HttpTestHelpers.SendAsync(admin, HttpMethod.Post, T(host) + "/agents", "{\"name\":\"clamp-agent\",\"delegationMaxDepth\":99}", token).ConfigureAwait(false);
                Assert.Equal(201, agentResponse.StatusCode, "Agent created (" + agentResponse.Body + ")");
                WarningsEnvelope agent = Serializer.Deserialize<WarningsEnvelope>(agentResponse.Body) ?? throw new TestAssertionException("Empty agent");
                ExpectClamped(agent, "delegationMaxDepth", "99", "10", "Agent create");

                string body = "{\"name\":\"clamp-deployment\",\"agentId\":\"" + agent.Id + "\",\"harnessProfileId\":\"hrn_builtin_fake\",\"maxAttempts\":99,\"weight\":5000,\"approvalTimeoutSeconds\":1}";
                TestResponse created = await HttpTestHelpers.SendAsync(admin, HttpMethod.Post, T(host) + "/deployments", body, token).ConfigureAwait(false);
                Assert.Equal(201, created.StatusCode, "Deployment created (" + created.Body + ")");
                WarningsEnvelope deployment = Serializer.Deserialize<WarningsEnvelope>(created.Body) ?? throw new TestAssertionException("Empty deployment");
                ExpectClamped(deployment, "maxAttempts", "99", "10", "Deployment create");
                ExpectClamped(deployment, "weight", "5000", "1000", "Deployment create");
                ExpectClamped(deployment, "approvalTimeoutSeconds", "1", "10", "Deployment create");
                Assert.Equal(3, deployment.Warnings!.Count, "Only clamped fields are reported");

                Deployment stored = await HttpTestHelpers.SendAsync<Deployment>(admin, HttpMethod.Get, T(host) + "/deployments/" + deployment.Id, null, 200, token).ConfigureAwait(false);
                Assert.True(stored.MaxAttempts == 10 && stored.Weight == 1000 && stored.ApprovalTimeoutSeconds == 10, "Storage still clamps");
                TestResponse read = await HttpTestHelpers.SendAsync(admin, HttpMethod.Get, T(host) + "/deployments/" + deployment.Id, null, token).ConfigureAwait(false);
                Assert.True(!read.Body.Contains("\"warnings\"", StringComparison.Ordinal), "Reads carry no warnings: " + read.Body);

                TestResponse updated = await HttpTestHelpers.SendAsync(admin, HttpMethod.Put, T(host) + "/deployments/" + deployment.Id, body.Replace("\"maxAttempts\":99", "\"maxAttempts\":0", StringComparison.Ordinal).Replace("\"weight\":5000", "\"weight\":10", StringComparison.Ordinal), token).ConfigureAwait(false);
                Assert.Equal(200, updated.StatusCode, "Deployment updated (" + updated.Body + ")");
                WarningsEnvelope update = Serializer.Deserialize<WarningsEnvelope>(updated.Body) ?? throw new TestAssertionException("Empty update");
                ExpectClamped(update, "maxAttempts", "0", "1", "Deployment update");
                Assert.True(update.Warnings!.All(w => w.Field != "weight"), "An in-range value has no warning");
                TestResponse clean = await HttpTestHelpers.SendAsync(admin, HttpMethod.Put, T(host) + "/deployments/" + deployment.Id, "{\"name\":\"clamp-deployment\",\"agentId\":\"" + agent.Id + "\",\"harnessProfileId\":\"hrn_builtin_fake\",\"maxAttempts\":3}", token).ConfigureAwait(false);
                Assert.True(clean.StatusCode == 200 && !clean.Body.Contains("\"warnings\"", StringComparison.Ordinal), "No warnings key when nothing was clamped: " + clean.Body);

                TestResponse server = await HttpTestHelpers.SendAsync(admin, HttpMethod.Post, T(host) + "/mcp-servers", "{\"name\":\"clamp-mcp\",\"url\":\"https://mcp.example.com\",\"path\":\"/mcp\",\"toolTimeoutSeconds\":99999}", token).ConfigureAwait(false);
                Assert.Equal(201, server.StatusCode, "MCP server created (" + server.Body + ")");
                ExpectClamped(Serializer.Deserialize<WarningsEnvelope>(server.Body) ?? throw new TestAssertionException("Empty server"), "toolTimeoutSeconds", "99999", "3600", "MCP server create");

                string yaml = String.Join("\n", new string[]
                {
                    "apiVersion: garrison/v1",
                    "kind: Deployment",
                    "metadata:",
                    "  name: clamp-manifest",
                    "spec:",
                    "  agent: clamp-agent",
                    "  harnessProfile: builtin/fake",
                    "  maxAttempts: 99"
                });
                ManifestApply dry = await ApplyAsync(host, yaml, "?dryRun=true", 200, token).ConfigureAwait(false);
                ExpectClamped(dry.Items[0].Warnings, "maxAttempts", "99", "10", "Manifest dry run");
                ManifestApply applied = await ApplyAsync(host, yaml, String.Empty, 200, token).ConfigureAwait(false);
                Assert.Equal(1, applied.CreatedCount, "Manifest created the deployment");
                ExpectClamped(applied.Items[0].Warnings, "maxAttempts", "99", "10", "Manifest apply");
                ManifestApply record = await HttpTestHelpers.SendAsync<ManifestApply>(admin, HttpMethod.Get, T(host) + "/manifests/applies/" + applied.Id, null, 200, token).ConfigureAwait(false);
                ExpectClamped(record.Items[0].Warnings, "maxAttempts", "99", "10", "Stored apply record");
                ManifestApply again = await ApplyAsync(host, yaml, String.Empty, 200, token).ConfigureAwait(false);
                Assert.Equal(1, again.UnchangedCount, "Re-apply is unchanged: the stored value is the clamped one");
                ExpectClamped(again.Items[0].Warnings, "maxAttempts", "99", "10", "Manifest re-apply still warns");
            }
        }

        private static void ExpectClamped(WarningsEnvelope envelope, string field, string given, string stored, string what)
        {
            ExpectClamped(envelope.Warnings ?? new List<FieldWarning>(), field, given, stored, what);
        }

        private static void ExpectClamped(List<FieldWarning> warnings, string field, string given, string stored, string what)
        {
            FieldWarning? warning = warnings.FirstOrDefault(w => w.Field == field);
            Assert.True(warning != null, what + ": a warning names " + field + " (" + String.Join("; ", warnings.Select(w => w.Field + " " + w.Message)) + ")");
            Assert.Equal("ValueClamped", warning!.Code, what + ": code");
            Assert.Equal(given, warning.Given, what + ": given value");
            Assert.Equal(stored, warning.Stored, what + ": stored value");
            Assert.True(warning.Message.Contains(field, StringComparison.Ordinal) && warning.Message.Contains(given, StringComparison.Ordinal) && warning.Message.Contains(stored, StringComparison.Ordinal), what + ": message names field and values: " + warning.Message);
        }

        private static async Task ManifestReferenceCacheAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase database = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            using (MetricCapture capture = new MetricCapture())
            {
                await new BuiltInSeeder(database).SeedAsync(token).ConfigureAwait(false);
                Tenant tenant = await database.Tenants.CreateAsync(new Tenant { Name = "i06-" + provider.ToString().ToLowerInvariant() }, token).ConfigureAwait(false);
                ManifestService manifests = new ManifestService(database, new SecretCipher("i06-master-key"));
                string providerLabel = provider == DatabaseTypeEnum.Sqlite ? "sqlite" : "postgresql";
                Func<int> profileReads = () => capture.Of("garrison.db.operation.duration").Count(m => m.Tag("operation") == "select" && (m.Tag("table") ?? String.Empty).Contains("harness_profile", StringComparison.Ordinal) && String.Equals(m.Tag("provider"), providerLabel, StringComparison.OrdinalIgnoreCase));
                Func<int> statements = () => capture.Of("garrison.db.operation.duration").Count(m => String.Equals(m.Tag("provider"), providerLabel, StringComparison.OrdinalIgnoreCase));

                // The cost of reading one harness profile once, with its child tables.
                int start = profileReads();
                await database.HarnessProfiles.ReadByNameAsync(tenant.Id, "builtin/fake", token).ConfigureAwait(false);
                int oneProfile = profileReads() - start;
                Assert.True(oneProfile > 0, "Statement metrics are captured for harness profile reads (provider label " + providerLabel + ")");

                int count = 12;
                string yaml = ReferenceManifest(count, "Do the task: {{input.message}}", 4);
                int documents = 2 + count * 2;

                start = profileReads();
                ManifestApply dry = await manifests.ApplyAsync(tenant.Id, yaml, new ManifestApplyOptions { DryRun = true }, token).ConfigureAwait(false);
                int dryReads = profileReads() - start;
                Assert.True(dry.Items.Count == documents && dry.Items.All(i => i.Result == ManifestApplyResultEnum.Validated), "Dry run validates every document: " + String.Join("; ", dry.Items.Select(i => i.Name + " " + i.Result + " " + i.Message)));
                Assert.Equal(documents, dry.CreatedCount, "Dry run plans every create");

                start = profileReads();
                int firstStatements = statements();
                ManifestApply first = await manifests.ApplyAsync(tenant.Id, yaml, new ManifestApplyOptions(), token).ConfigureAwait(false);
                int applyReads = profileReads() - start;
                firstStatements = statements() - firstStatements;
                Assert.Equal(documents, first.CreatedCount, "Apply creates every document: " + String.Join("; ", first.Items.Where(i => i.Result == ManifestApplyResultEnum.Failed).Select(i => i.Name + " " + i.Message)));

                start = profileReads();
                int reapplyStatements = statements();
                ManifestApply again = await manifests.ApplyAsync(tenant.Id, yaml, new ManifestApplyOptions(), token).ConfigureAwait(false);
                int reapplyReads = profileReads() - start;
                reapplyStatements = statements() - reapplyStatements;
                Assert.Equal(documents, again.UnchangedCount, "Re-apply changes nothing");

                // Before I-06 every deployment read the built-in profile at least twice per pass (count * 2 * oneProfile).
                Assert.True(dryReads <= oneProfile * 2, "Dry run reads the shared profile once, not per document: " + dryReads + " statements, one read is " + oneProfile);
                Assert.True(applyReads <= oneProfile * 2, "Apply reads the shared profile once, not per document: " + applyReads + " statements, one read is " + oneProfile);
                Assert.True(reapplyReads <= oneProfile * 2, "Re-apply reads the shared profile once, not per document: " + reapplyReads + " statements, one read is " + oneProfile);
                Assert.True(reapplyStatements < documents * 12, "Re-apply statements per document stay small: " + reapplyStatements + " for " + documents + " documents (apply made " + firstStatements + ")");

                // References to documents created or updated earlier in the same apply resolve against the new values: the
                // template changes, a deployment changes, a tenant profile is updated to support resume, and a new
                // deployment that needs session continuation on that profile validates against the updated profile.
                HarnessProfile builtIn = await database.HarnessProfiles.ReadByNameAsync(tenant.Id, "builtin/fake", token).ConfigureAwait(false) ?? throw new TestAssertionException("builtin/fake missing");
                HarnessProfile clone = Serializer.Deserialize<HarnessProfile>(Serializer.Serialize(builtIn)) ?? throw new TestAssertionException("Clone failed");
                clone.Id = String.Empty;
                clone.TenantId = tenant.Id;
                clone.Name = "i06-profile";
                clone.IsBuiltIn = false;
                clone.IsProtected = false;
                clone.BuiltInKey = null;
                clone.SupportsResume = false;
                clone = await database.HarnessProfiles.CreateAsync(clone, token).ConfigureAwait(false);
                string export = await manifests.ExportAsync(tenant.Id, token).ConfigureAwait(false);
                string profileDocument = export.Split("\n---\n").Select(d => d.Trim()).FirstOrDefault(d => d.Contains("kind: HarnessProfile", StringComparison.Ordinal) && d.Contains("name: i06-profile", StringComparison.Ordinal)) ?? throw new TestAssertionException("Export has no i06-profile document: " + export);
                Assert.True(profileDocument.Contains("supportsResume: false", StringComparison.Ordinal), "Exported profile has supportsResume false");
                string changed = ReferenceManifest(count, "Do the task, carefully: {{input.message}}", 5)
                    + "\n---\n" + profileDocument.Replace("supportsResume: false", "supportsResume: true", StringComparison.Ordinal)
                    + "\n---\n" + String.Join("\n", new string[]
                    {
                        "apiVersion: garrison/v1",
                        "kind: Deployment",
                        "metadata:",
                        "  name: i06-resumable",
                        "spec:",
                        "  agent: i06-agent-0",
                        "  harnessProfile: i06-profile",
                        "  requiredCapabilities: { sessionContinuation: true }",
                        "  prompts: { Task: i06-task }",
                        "  resources:",
                        "    secrets:",
                        "      - { alias: credential, secret: i06-secret }"
                    });
                ManifestApply mixed = await manifests.ApplyAsync(tenant.Id, changed, new ManifestApplyOptions(), token).ConfigureAwait(false);
                Assert.Equal(0, mixed.FailedCount, "Mixed apply succeeds: " + String.Join("; ", mixed.Items.Where(i => i.Result == ManifestApplyResultEnum.Failed).Select(i => i.Name + " " + i.Message)));
                Assert.Equal(ManifestApplyResultEnum.Updated, mixed.Items.First(i => i.Name == "i06-task").Result, "Template updated");
                Assert.Equal(ManifestApplyResultEnum.Updated, mixed.Items.First(i => i.Name == "i06-profile").Result, "Profile updated");
                Assert.Equal(ManifestApplyResultEnum.Created, mixed.Items.First(i => i.Name == "i06-resumable").Result, "Deployment on the updated profile created");
                Assert.Equal(count, mixed.Items.Count(i => i.Kind == "Deployment" && i.Result == ManifestApplyResultEnum.Updated), "Every deployment picked up maxTurns 5");
                Deployment resumable = await database.Deployments.ReadByNameAsync(tenant.Id, "i06-resumable", token).ConfigureAwait(false) ?? throw new TestAssertionException("i06-resumable missing");
                PromptTemplate template = await database.PromptTemplates.ReadByNameAsync(tenant.Id, "i06-task", token).ConfigureAwait(false) ?? throw new TestAssertionException("i06-task missing");
                Assert.Equal(clone.Id, resumable.HarnessProfileId, "Resolved to the tenant profile");
                Assert.True(resumable.PromptBindings.Any(b => b.Role == "Task" && b.TemplateId == template.Id), "Resolved to the template from the same apply");
                Assert.Equal(2, template.CurrentVersion, "Template versioned once");

                // The cache itself: reads once, answers from memory, and reads again after Forget.
                ConfigurationReferenceCache cache = new ConfigurationReferenceCache(database, tenant.Id);
                string? fakeId = await cache.IdByNameAsync("HarnessProfile", "builtin/fake", token).ConfigureAwait(false);
                Assert.True(await cache.HarnessProfileAsync(fakeId, token).ConfigureAwait(false) != null, "By-name read fills the identifier entry");
                Assert.True(await cache.IdByNameAsync("Agent", "i06-missing", token).ConfigureAwait(false) == null, "A miss is null");
                Assert.True(await cache.IdByNameAsync("Agent", "i06-missing", token).ConfigureAwait(false) == null, "A miss is remembered");
                Assert.Equal(2L, cache.DatabaseReads, "Two database reads");
                Assert.Equal(2L, cache.CacheHits, "Two answers from memory");
                cache.Forget("HarnessProfile");
                Assert.True(await cache.HarnessProfileAsync(fakeId, token).ConfigureAwait(false) != null, "Read again after Forget");
                Assert.Equal(3L, cache.DatabaseReads, "Forget makes the next read go to the database");
            }
        }

        private static string ReferenceManifest(int count, string taskContent, int maxTurns)
        {
            List<string> lines = new List<string>
            {
                "apiVersion: garrison/v1",
                "kind: Secret",
                "metadata:",
                "  name: i06-secret",
                "spec:",
                "  kind: GenericEnv",
                "---",
                "apiVersion: garrison/v1",
                "kind: PromptTemplate",
                "metadata:",
                "  name: i06-task",
                "spec:",
                "  kind: Task",
                "  content: \"" + taskContent + "\""
            };
            for (int i = 0; i < count; i++)
            {
                lines.AddRange(new string[]
                {
                    "---",
                    "apiVersion: garrison/v1",
                    "kind: Agent",
                    "metadata:",
                    "  name: i06-agent-" + i,
                    "spec:",
                    "  description: Agent " + i,
                    "---",
                    "apiVersion: garrison/v1",
                    "kind: Deployment",
                    "metadata:",
                    "  name: i06-deployment-" + i,
                    "spec:",
                    "  agent: i06-agent-" + i,
                    "  harnessProfile: builtin/fake",
                    "  maxTurns: " + maxTurns,
                    "  prompts: { System: builtin/default-system, Task: i06-task }",
                    "  resources:",
                    "    secrets:",
                    "      - { alias: credential, secret: i06-secret }"
                });
            }
            return String.Join("\n", lines);
        }

        private static async Task<ManifestApply> ApplyAsync(TestServerHost host, string yaml, string query, int expectedStatus, CancellationToken token)
        {
            using (HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Post, T(host) + "/manifests/apply" + query))
            {
                request.Content = new StringContent(yaml, Encoding.UTF8, "application/yaml");
                using (HttpResponseMessage response = await host.AdminClient.SendAsync(request, token).ConfigureAwait(false))
                {
                    string body = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                    if ((int)response.StatusCode != expectedStatus) throw new TestAssertionException("Manifest apply returned " + (int)response.StatusCode + " (expected " + expectedStatus + "): " + body);
                    return Serializer.Deserialize<ManifestApply>(body) ?? throw new TestAssertionException("Empty apply response.");
                }
            }
        }

        private static async Task<bool> NotFoundAsync(TestServerHost host, string path, CancellationToken token)
        {
            EnumerationResult<Agent> agents = await HttpTestHelpers.SendAsync<EnumerationResult<Agent>>(host.AdminClient, HttpMethod.Get, T(host) + path, null, 200, token).ConfigureAwait(false);
            return agents.TotalRecords == 0;
        }

        #endregion
    }
}
