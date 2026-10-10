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
    using Garrison.Core.Serialization;
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
                cases.Add(new TestCaseDescriptor(id, "agents", "Agent self-registration is idempotent and the A2A card renders (" + provider + ")", ct => AgentsAsync(provider, ct)));
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
                Assert.Equal(200, deleted.StatusCode, "delete after unbinding");
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

                TestResponse export = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/manifests/export", null, token).ConfigureAwait(false);
                Assert.True(export.Body.Contains("kind: Deployment", StringComparison.Ordinal) && export.Body.Contains("claude-helper-default", StringComparison.Ordinal), "export");

                ManifestApply reapplyExport = await ApplyAsync(host, export.Body, String.Empty, 200, token).ConfigureAwait(false);
                Assert.Equal(0, reapplyExport.FailedCount, "exported manifests re-apply");

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
