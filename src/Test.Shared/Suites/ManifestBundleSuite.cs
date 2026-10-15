namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Net.Http;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Manifests;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Serialization;
    using Garrison.Server.Protocols;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Manifest bundles (plan P12.21, D-054): export selectors (all, kinds, Kind/name resources), reference following,
    /// built-ins on request, secrets as requirements only, the Bundle document and its checks on apply, a round trip to a
    /// fresh tenant that fails with field codes until the secrets exist and then reproduces the configuration, idempotent
    /// re-apply, and the MCP tool.
    /// </summary>
    public static class ManifestBundleSuite
    {
        #region Private-Members

        private static readonly string _ApiTokenValue = "bundle-api-token-value-71d2";
        private static readonly string _GitTokenValue = "bundle-git-token-value-93ab";

        #endregion

        #region Public-Methods

        /// <summary>
        /// Build the suites.
        /// </summary>
        /// <returns>Suites.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            List<TestSuiteDescriptor> suites = new List<TestSuiteDescriptor>();
            List<TestCaseDescriptor> unit = new List<TestCaseDescriptor>();
            unit.Add(new TestCaseDescriptor("manifest-bundle-unit", "selectors", "Kind/name selectors split on the first slash and refuse a missing kind or name", SelectorsAsync));
            suites.Add(new TestSuiteDescriptor("manifest-bundle-unit", "Manifest bundles (unit)", unit));

            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "manifest-bundles-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                cases.Add(new TestCaseDescriptor(id, "selectors", "Export everything, by kind, and by Kind/name, with and without following references; built-ins only on request; secrets never exported but listed in the header and the Bundle document; selector errors and download headers (" + provider + ")", ct => SelectorsAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "round-trip", "A bundle applied to a fresh tenant fails with MissingSecret field codes until the secrets exist, then creates everything; re-applying reports every document Unchanged and exporting the new tenant gives the same documents (" + provider + ")", ct => RoundTripAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "bundle-document", "Bundle documents check secrets, artifact stores, and built-ins with field codes; built-in documents apply Unchanged; missing references report ReferenceNotFound; the MCP export tool takes selectors and lists required secrets (" + provider + ")", ct => BundleDocumentAsync(provider, ct)));
                suites.Add(new TestSuiteDescriptor(id, "Manifest bundles (" + provider + ")", cases));
            }
            return suites;
        }

        #endregion

        #region Private-Methods

        private static Task SelectorsAsync(CancellationToken token)
        {
            ManifestResourceReference? agent = ManifestResourceReference.TryParse(" Agent/triage ");
            Assert.True(agent != null && agent.Kind == "Agent" && agent.Name == "triage", "Kind and name");
            ManifestResourceReference? slashed = ManifestResourceReference.TryParse("PromptTemplate/team/system");
            Assert.True(slashed != null && slashed.Kind == "PromptTemplate" && slashed.Name == "team/system", "Names may contain slashes");
            Assert.True(ManifestResourceReference.TryParse("Agent") == null && ManifestResourceReference.TryParse("/x") == null && ManifestResourceReference.TryParse("Agent/") == null && ManifestResourceReference.TryParse(null) == null, "Malformed selectors");
            return Task.CompletedTask;
        }

        private static string SourceManifest()
        {
            return String.Join("\n", new string[]
            {
                "apiVersion: garrison/v1",
                "kind: Secret",
                "metadata: { name: api-token }",
                "spec: { kind: BearerToken, value: " + _ApiTokenValue + " }",
                "---",
                "apiVersion: garrison/v1",
                "kind: Secret",
                "metadata: { name: git-token }",
                "spec: { kind: GitCredential, value: " + _GitTokenValue + " }",
                "---",
                "apiVersion: garrison/v1",
                "kind: Secret",
                "metadata: { name: unused-token }",
                "spec: { kind: BearerToken, value: unused-token-value-0000 }",
                "---",
                "apiVersion: garrison/v1",
                "kind: PromptTemplate",
                "metadata: { name: writer-system }",
                "spec: { kind: System, content: 'You write clearly about {{run.input}}.' }",
                "---",
                "apiVersion: garrison/v1",
                "kind: PromptTemplate",
                "metadata: { name: unrelated-task }",
                "spec: { kind: Task, content: 'Unrelated {{run.input}}' }",
                "---",
                "apiVersion: garrison/v1",
                "kind: McpServer",
                "metadata: { name: docs }",
                "spec: { transport: Http, url: 'https://mcp.example.com/mcp' }",
                "---",
                "apiVersion: garrison/v1",
                "kind: WorkspaceTemplate",
                "metadata: { name: repo }",
                "spec: { kind: GitRepository, gitUrl: 'https://git.example.com/team/repo.git', gitCredentialSecret: git-token }",
                "---",
                "apiVersion: garrison/v1",
                "kind: Agent",
                "metadata: { name: writer, description: Writes things. }",
                "spec:",
                "  inputMode: Structured",
                "  inputSchema: { type: object, properties: { topic: { type: string } }, required: [topic] }",
                "  delegation: { maxDepth: 1, allow: [helper] }",
                "---",
                "apiVersion: garrison/v1",
                "kind: Agent",
                "metadata: { name: helper }",
                "spec: { description: Helps. }",
                "---",
                "apiVersion: garrison/v1",
                "kind: Agent",
                "metadata: { name: bystander }",
                "spec: { description: Not referenced. }",
                "---",
                "apiVersion: garrison/v1",
                "kind: Deployment",
                "metadata: { name: writer-main }",
                "spec:",
                "  agent: writer",
                "  harnessProfile: builtin/fake",
                "  workspace: repo",
                "  prompts: { System: writer-system }",
                "  resources:",
                "    secrets: [ { alias: api, secret: api-token } ]",
                "    mcpServers: [ { server: docs } ]",
                "---",
                "apiVersion: garrison/v1",
                "kind: Deployment",
                "metadata: { name: helper-main }",
                "spec: { agent: helper, harnessProfile: builtin/fake }",
                "---",
                "apiVersion: garrison/v1",
                "kind: Deployment",
                "metadata: { name: bystander-main }",
                "spec: { agent: bystander, harnessProfile: builtin/fake }",
                "---",
                "apiVersion: garrison/v1",
                "kind: Pipeline",
                "metadata: { name: publish }",
                "spec: { stages: [ { name: draft, agent: writer } ] }",
                "---",
                "apiVersion: garrison/v1",
                "kind: Trigger",
                "metadata: { name: nightly-writer }",
                "spec: { type: Cron, agent: writer, cron: '0 3 * * *', active: false }",
                "---",
                "apiVersion: garrison/v1",
                "kind: Trigger",
                "metadata: { name: nightly-publish }",
                "spec: { type: Cron, pipeline: publish, cron: '0 4 * * *', active: false }",
                "---",
                "apiVersion: garrison/v1",
                "kind: NotificationEndpoint",
                "metadata: { name: writer-alerts }",
                "spec: { url: 'https://hooks.example.com/garrison', events: [RunFailed], agent: writer }",
                ""
            });
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

        private static List<string> Documents(string yaml, string kind)
        {
            List<string> names = new List<string>();
            foreach (ManifestDocument document in ManifestParser.Parse(yaml).Where(d => d.Kind == kind)) names.Add(document.Metadata.Name);
            names.Sort(StringComparer.Ordinal);
            return names;
        }

        private static string Body(string yaml)
        {
            // Everything except the header comments and the export time.
            return String.Join("\n", yaml.Replace("\r", String.Empty, StringComparison.Ordinal).Split('\n').Where(l => !l.StartsWith("#", StringComparison.Ordinal) && !l.TrimStart().StartsWith("exportedUtc:", StringComparison.Ordinal)));
        }

        private static async Task SelectorsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                HttpClient admin = host.AdminClient;
                ManifestApply source = await ApplyAsync(admin, host.TenantId, SourceManifest(), "?allowSecretValues=true", 200, token).ConfigureAwait(false);
                Assert.Equal(0, source.FailedCount, "Source configuration applied");

                // Everything.
                string all = await ExportAsync(admin, host.TenantId, String.Empty, token).ConfigureAwait(false);
                Assert.True(all.StartsWith("# Garrison manifest bundle (garrison/v1) exported ", StringComparison.Ordinal), "Header comment: " + all);
                Assert.True(all.Contains("#   - api-token (BearerToken)", StringComparison.Ordinal) && all.Contains("#   - git-token (GitCredential)", StringComparison.Ordinal), "Header lists required secrets");
                Assert.True(!all.Contains(_ApiTokenValue, StringComparison.Ordinal) && !all.Contains(_GitTokenValue, StringComparison.Ordinal) && !all.Contains("unused-token-value", StringComparison.Ordinal), "No secret values");
                Assert.True(Documents(all, "Secret").Count == 0, "No Secret documents");
                Assert.True(Documents(all, "Bundle").SequenceEqual(new List<string> { ManifestService.BundleName }), "One Bundle document");
                Assert.True(ManifestParser.Parse(all).First().Kind == "Bundle", "The Bundle document comes first");
                Assert.True(Documents(all, "Agent").SequenceEqual(new List<string> { "bystander", "helper", "writer" }), "Every agent");
                Assert.True(Documents(all, "Trigger").Count == 2 && Documents(all, "NotificationEndpoint").Count == 1 && Documents(all, "Pipeline").Count == 1, "Every trigger, endpoint, and pipeline");
                Assert.True(Documents(all, "PromptTemplate").SequenceEqual(new List<string> { "unrelated-task", "writer-system" }), "Tenant templates only");
                Assert.True(ManifestParser.Parse(all).All(d => !d.Metadata.Name.StartsWith("builtin/", StringComparison.Ordinal)), "No built-in documents by default");
                Assert.True(all.Contains("requiredBuiltIns:", StringComparison.Ordinal) && all.Contains("name: builtin/fake", StringComparison.Ordinal), "Built-ins listed as requirements");

                // By kind.
                string agents = await ExportAsync(admin, host.TenantId, "?kinds=agent", token).ConfigureAwait(false);
                Assert.True(Documents(agents, "Agent").Count == 3 && Documents(agents, "Deployment").Count == 0 && Documents(agents, "Bundle").Count == 1, "kinds=Agent exports agents only");
                Assert.True(agents.Contains("# This bundle needs no secrets.", StringComparison.Ordinal), "Agents alone need no secrets");

                // By resource, without and with references.
                string writerOnly = await ExportAsync(admin, host.TenantId, "?resources=Agent/writer", token).ConfigureAwait(false);
                Assert.True(Documents(writerOnly, "Agent").SequenceEqual(new List<string> { "writer" }) && Documents(writerOnly, "Deployment").Count == 0, "One agent without references");
                string writer = await ExportAsync(admin, host.TenantId, "?resources=Agent/writer&followReferences=true", token).ConfigureAwait(false);
                Assert.True(Documents(writer, "Agent").SequenceEqual(new List<string> { "helper", "writer" }), "Agent brings its delegation allow list: " + String.Join(",", Documents(writer, "Agent")));
                Assert.True(Documents(writer, "Deployment").SequenceEqual(new List<string> { "helper-main", "writer-main" }), "Agents bring their deployments");
                Assert.True(Documents(writer, "PromptTemplate").SequenceEqual(new List<string> { "writer-system" }) && Documents(writer, "McpServer").SequenceEqual(new List<string> { "docs" }) && Documents(writer, "WorkspaceTemplate").SequenceEqual(new List<string> { "repo" }), "Deployment dependencies");
                Assert.True(Documents(writer, "Trigger").SequenceEqual(new List<string> { "nightly-writer" }) && Documents(writer, "NotificationEndpoint").SequenceEqual(new List<string> { "writer-alerts" }), "Triggers and endpoints that target the agent");
                Assert.True(Documents(writer, "Pipeline").Count == 0 && !writer.Contains("bystander", StringComparison.Ordinal), "Nothing that only depends on the agent, and nothing unrelated");
                Assert.True(writer.Contains("#   - api-token", StringComparison.Ordinal) && writer.Contains("#   - git-token", StringComparison.Ordinal) && !writer.Contains("unused-token", StringComparison.Ordinal), "Only the secrets the selection needs");
                string pipeline = await ExportAsync(admin, host.TenantId, "?resources=Pipeline/publish&followReferences=true", token).ConfigureAwait(false);
                Assert.True(Documents(pipeline, "Pipeline").Count == 1 && Documents(pipeline, "Trigger").SequenceEqual(new List<string> { "nightly-publish", "nightly-writer" }) && Documents(pipeline, "Agent").Contains("writer"), "Pipeline brings its stage agents and triggers");

                // Built-ins on request.
                string builtIn = await ExportAsync(admin, host.TenantId, "?resources=Deployment/helper-main&followReferences=true&includeBuiltIn=true", token).ConfigureAwait(false);
                Assert.True(Documents(builtIn, "HarnessProfile").Contains("builtin/fake"), "Built-in profile exported on request");
                Assert.True(Documents(builtIn, "PromptTemplate").Any(n => n.StartsWith("builtin/", StringComparison.Ordinal)), "Built-in default prompts exported on request");
                ManifestApply builtInApply = await ApplyAsync(admin, host.TenantId, builtIn, String.Empty, 200, token).ConfigureAwait(false);
                Assert.True(builtInApply.FailedCount == 0 && builtInApply.CreatedCount == 0 && builtInApply.UpdatedCount == 0, "A bundle with built-ins re-applies unchanged: " + Serializer.Serialize(builtInApply.Items.Where(i => i.Result != ManifestApplyResultEnum.Unchanged)));
                Assert.True(builtInApply.Items.Where(i => i.Name.StartsWith("builtin/", StringComparison.Ordinal)).All(i => i.Result == ManifestApplyResultEnum.Unchanged && i.Message != null && i.Message.Contains("Built-in", StringComparison.Ordinal)), "Built-in documents are left unchanged");

                // Selector errors.
                await ExpectExportErrorAsync(admin, host.TenantId, "?kinds=Secret", 400, "kinds", "UnknownKind", token).ConfigureAwait(false);
                await ExpectExportErrorAsync(admin, host.TenantId, "?kinds=Gizmo", 400, "kinds", "UnknownKind", token).ConfigureAwait(false);
                await ExpectExportErrorAsync(admin, host.TenantId, "?resources=Agent", 400, "resources", "InvalidSelector", token).ConfigureAwait(false);
                await ExpectExportErrorAsync(admin, host.TenantId, "?resources=Bundle/x", 400, "resources", "UnknownKind", token).ConfigureAwait(false);
                TestResponse missing = await HttpTestHelpers.SendAsync(admin, HttpMethod.Get, "/v1.0/api/tenants/" + host.TenantId + "/manifests/export?resources=Agent/nobody", null, token).ConfigureAwait(false);
                Assert.Equal(404, missing.StatusCode, "Unknown resource");
                TestResponse post = await HttpTestHelpers.SendAsync(admin, HttpMethod.Post, "/v1.0/api/tenants/" + host.TenantId + "/manifests/export", null, token).ConfigureAwait(false);
                Assert.True(post.StatusCode == 404 || post.StatusCode == 405, "The POST export is gone: " + post.StatusCode);

                // Another tenant's resources are not visible.
                Tenant other = await HttpTestHelpers.SendAsync<Tenant>(admin, HttpMethod.Post, "/v1.0/api/tenants", new TenantRequest { Name = "Bundles Other " + Guid.NewGuid().ToString("N").Substring(0, 6) }, 201, token).ConfigureAwait(false);
                TestResponse cross = await HttpTestHelpers.SendAsync(admin, HttpMethod.Get, "/v1.0/api/tenants/" + other.Id + "/manifests/export?resources=Agent/writer", null, token).ConfigureAwait(false);
                Assert.Equal(404, cross.StatusCode, "Cross-tenant selector");
                string empty = await ExportAsync(admin, other.Id, String.Empty, token).ConfigureAwait(false);
                Assert.True(ManifestParser.Parse(empty).Count == 1 && !empty.Contains("writer", StringComparison.Ordinal), "An empty tenant exports only the Bundle document");

                // Download headers.
                using (HttpResponseMessage response = await admin.GetAsync("/v1.0/api/tenants/" + host.TenantId + "/manifests/export?kinds=Agent", token).ConfigureAwait(false))
                {
                    Assert.Equal("application/yaml", response.Content.Headers.ContentType?.MediaType, "YAML media type");
                    Assert.Equal("garrison-bundle-" + host.TenantId + ".yaml", response.Content.Headers.ContentDisposition?.FileName?.Trim('"'), "File name");
                }
            }
        }

        private static async Task ExpectExportErrorAsync(HttpClient client, string tenantId, string query, int status, string field, string code, CancellationToken token)
        {
            TestResponse response = await HttpTestHelpers.SendAsync(client, HttpMethod.Get, "/v1.0/api/tenants/" + tenantId + "/manifests/export" + query, null, token).ConfigureAwait(false);
            Assert.Equal(status, response.StatusCode, "Export " + query + ": " + response.Body);
            ErrorResponse error = Assert.NotNull(Serializer.Deserialize<ErrorResponse>(response.Body), "Error body");
            Assert.True(error.FieldCodes != null && error.FieldCodes.TryGetValue(field, out string? actual) && actual == code, "Field code " + field + "=" + code + ": " + response.Body);
        }

        private static async Task RoundTripAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                HttpClient admin = host.AdminClient;
                await ApplyAsync(admin, host.TenantId, SourceManifest(), "?allowSecretValues=true", 200, token).ConfigureAwait(false);
                string bundle = await ExportAsync(admin, host.TenantId, String.Empty, token).ConfigureAwait(false);

                // Re-applying to the source tenant changes nothing.
                ManifestApply same = await ApplyAsync(admin, host.TenantId, bundle, String.Empty, 200, token).ConfigureAwait(false);
                Assert.True(same.FailedCount == 0 && same.CreatedCount == 0 && same.UpdatedCount == 0 && same.UnchangedCount == same.Items.Count, "Source re-apply is a no-op: " + Serializer.Serialize(same.Items.Where(i => i.Result != ManifestApplyResultEnum.Unchanged)));

                // A fresh tenant without the secrets fails clearly, on a dry run and on a real apply, and writes nothing.
                Tenant target = await HttpTestHelpers.SendAsync<Tenant>(admin, HttpMethod.Post, "/v1.0/api/tenants", new TenantRequest { Name = "Bundle Target " + Guid.NewGuid().ToString("N").Substring(0, 6) }, 201, token).ConfigureAwait(false);
                ManifestApply dry = await ApplyAsync(admin, target.Id, bundle, "?dryRun=true", 400, token).ConfigureAwait(false);
                ManifestApplyItem bundleItem = dry.Items.Single(i => i.Kind == "Bundle");
                Assert.True(bundleItem.Result == ManifestApplyResultEnum.Failed && bundleItem.ErrorCode == "MissingSecret" && bundleItem.ErrorField == "spec.requiredSecrets[0]", "Bundle names the missing secret: " + bundleItem.ErrorCode + " " + bundleItem.ErrorField + " " + bundleItem.Message);
                Assert.True(bundleItem.Message != null && bundleItem.Message.Contains("api-token", StringComparison.Ordinal) && bundleItem.Message.Contains("git-token", StringComparison.Ordinal), "Both secrets named: " + bundleItem.Message);
                ManifestApplyItem deploymentItem = dry.Items.Single(i => i.Kind == "Deployment" && i.Name == "writer-main");
                Assert.True(deploymentItem.ErrorCode == "MissingSecret" && deploymentItem.ErrorField == "resources.secrets.api", "Deployment reference field code: " + deploymentItem.ErrorCode + " " + deploymentItem.ErrorField);
                ManifestApplyItem workspaceItem = dry.Items.Single(i => i.Kind == "WorkspaceTemplate");
                Assert.True(workspaceItem.ErrorCode == "MissingSecret" && workspaceItem.ErrorField == "gitCredentialSecret", "Workspace reference field code: " + workspaceItem.ErrorCode + " " + workspaceItem.ErrorField);
                ManifestApply refused = await ApplyAsync(admin, target.Id, bundle, String.Empty, 400, token).ConfigureAwait(false);
                Assert.True(refused.CreatedCount == 0 && refused.FailedCount > 0, "Nothing written");
                string stillEmpty = await ExportAsync(admin, target.Id, String.Empty, token).ConfigureAwait(false);
                Assert.True(ManifestParser.Parse(stillEmpty).Count == 1, "The target is still empty");

                // Create the secrets, then the bundle applies.
                await HttpTestHelpers.SendAsync<Secret>(admin, HttpMethod.Post, "/v1.0/api/tenants/" + target.Id + "/secrets", new SecretRequest { Name = "api-token", Kind = SecretKindEnum.BearerToken, Value = "target-api-token-0001" }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<Secret>(admin, HttpMethod.Post, "/v1.0/api/tenants/" + target.Id + "/secrets", new SecretRequest { Name = "git-token", Kind = SecretKindEnum.GitCredential, Value = "target-git-token-0001" }, 201, token).ConfigureAwait(false);
                ManifestApply check = await ApplyAsync(admin, target.Id, bundle, "?dryRun=true", 200, token).ConfigureAwait(false);
                Assert.Equal(0, check.FailedCount, "Dry run passes once the secrets exist");
                ManifestApply applied = await ApplyAsync(admin, target.Id, bundle, String.Empty, 200, token).ConfigureAwait(false);
                int resources = applied.Items.Count(i => i.Kind != "Bundle");
                Assert.True(applied.FailedCount == 0 && applied.CreatedCount == resources, "Every document created: " + applied.CreatedCount + " of " + resources);

                // Re-applying is a no-op, and the target exports the same documents.
                ManifestApply again = await ApplyAsync(admin, target.Id, bundle, String.Empty, 200, token).ConfigureAwait(false);
                Assert.True(again.FailedCount == 0 && again.CreatedCount == 0 && again.UpdatedCount == 0 && again.UnchangedCount == again.Items.Count, "Re-apply is a no-op: " + Serializer.Serialize(again.Items.Where(i => i.Result != ManifestApplyResultEnum.Unchanged)));
                string reexported = await ExportAsync(admin, target.Id, String.Empty, token).ConfigureAwait(false);
                Assert.Equal(Body(bundle), Body(reexported), "The target's export matches the source's");
                Agent writer = await HttpTestHelpers.SendAsync<Agent>(admin, HttpMethod.Get, "/v1.0/api/tenants/" + target.Id + "/agents/writer", null, 200, token).ConfigureAwait(false);
                Assert.True(writer.InputSchemaJson != null && writer.InputSchemaJson.Contains("topic", StringComparison.Ordinal) && writer.DelegationAllowList.Contains("helper"), "Agent configuration reproduced");
            }
        }

        private static async Task BundleDocumentAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                HttpClient admin = host.AdminClient;
                string bundle = String.Join("\n", new string[]
                {
                    "apiVersion: garrison/v1",
                    "kind: Bundle",
                    "metadata: { name: checks }",
                    "spec:",
                    "  requiredSecrets: [ { name: later-secret, kind: BearerToken }, { name: absent-secret } ]",
                    "  requiredArtifactStores: [ absent-store ]",
                    "  requiredBuiltIns: [ { kind: HarnessProfile, name: builtin/fake }, { kind: PromptTemplate, name: builtin/does-not-exist } ]",
                    "---",
                    "apiVersion: garrison/v1",
                    "kind: Secret",
                    "metadata: { name: later-secret }",
                    "spec: { kind: BearerToken, value: later-secret-value-1234 }",
                    ""
                });
                ManifestApply result = await ApplyAsync(admin, host.TenantId, bundle, "?dryRun=true&allowSecretValues=true", 400, token).ConfigureAwait(false);
                ManifestApplyItem item = result.Items.Single(i => i.Kind == "Bundle");
                Assert.True(item.Result == ManifestApplyResultEnum.Failed && item.ErrorCode == "MissingSecret" && item.ErrorField == "spec.requiredSecrets[1]", "A secret in the same manifest counts; the absent one fails: " + item.ErrorField + " " + item.Message);
                Assert.True(item.Message != null && item.Message.Contains("absent-store", StringComparison.Ordinal) && item.Message.Contains("builtin/does-not-exist", StringComparison.Ordinal) && !item.Message.Contains("builtin/fake", StringComparison.Ordinal), "Every missing requirement named: " + item.Message);

                string storeOnly = "apiVersion: garrison/v1\nkind: Bundle\nmetadata: { name: store }\nspec: { requiredArtifactStores: [ absent-store ] }\n";
                ManifestApplyItem storeItem = (await ApplyAsync(admin, host.TenantId, storeOnly, String.Empty, 400, token).ConfigureAwait(false)).Items.Single();
                Assert.True(storeItem.ErrorCode == "MissingArtifactStore" && storeItem.ErrorField == "spec.requiredArtifactStores[0]", "Artifact store code");
                string builtInOnly = "apiVersion: garrison/v1\nkind: Bundle\nmetadata: { name: builtin }\nspec: { requiredBuiltIns: [ { kind: HarnessProfile, name: builtin/nope } ] }\n";
                ManifestApplyItem builtInItem = (await ApplyAsync(admin, host.TenantId, builtInOnly, String.Empty, 400, token).ConfigureAwait(false)).Items.Single();
                Assert.True(builtInItem.ErrorCode == "MissingBuiltIn" && builtInItem.ErrorField == "spec.requiredBuiltIns[0]", "Built-in code");
                string met = "apiVersion: garrison/v1\nkind: Bundle\nmetadata: { name: met }\nspec: { requiredBuiltIns: [ { kind: HarnessProfile, name: builtin/fake } ] }\n";
                ManifestApplyItem metItem = (await ApplyAsync(admin, host.TenantId, met, String.Empty, 200, token).ConfigureAwait(false)).Items.Single();
                Assert.True(metItem.Result == ManifestApplyResultEnum.Unchanged && metItem.Message != null && metItem.Message.Contains("requirements are met", StringComparison.Ordinal), "Met requirements are Unchanged");

                string missingBuiltInDocument = "apiVersion: garrison/v1\nkind: HarnessProfile\nmetadata: { name: builtin/nope }\nspec: { harnessType: Generic, executable: x }\n";
                ManifestApplyItem missingBuiltIn = (await ApplyAsync(admin, host.TenantId, missingBuiltInDocument, String.Empty, 400, token).ConfigureAwait(false)).Items.Single();
                Assert.True(missingBuiltIn.ErrorCode == "MissingBuiltIn" && missingBuiltIn.ErrorField == "metadata.name", "Unknown built-in document");
                string reservedAgent = "apiVersion: garrison/v1\nkind: Agent\nmetadata: { name: builtin/agent }\nspec: { }\n";
                ManifestApplyItem reserved = (await ApplyAsync(admin, host.TenantId, reservedAgent, String.Empty, 400, token).ConfigureAwait(false)).Items.Single();
                Assert.True(reserved.Message != null && reserved.Message.Contains("reserved for built-ins", StringComparison.Ordinal), "Other kinds still refuse built-in names");

                string missingAgent = "apiVersion: garrison/v1\nkind: Deployment\nmetadata: { name: orphan }\nspec: { agent: nobody, harnessProfile: builtin/fake }\n";
                ManifestApplyItem orphan = (await ApplyAsync(admin, host.TenantId, missingAgent, String.Empty, 400, token).ConfigureAwait(false)).Items.Single();
                Assert.True(orphan.ErrorCode == "ReferenceNotFound" && orphan.ErrorField == "agent", "Missing reference code: " + orphan.ErrorCode + " " + orphan.ErrorField);

                // The MCP tool takes the same selectors.
                await ApplyAsync(admin, host.TenantId, SourceManifest(), "?allowSecretValues=true", 200, token).ConfigureAwait(false);
                using (TestMcpClient client = new TestMcpClient())
                {
                    await client.ConnectAsync(host, null, token).ConfigureAwait(false);
                    McpManifestExport export = await client.CallAsync<McpManifestExport>("garrison_export_manifest", new { resources = new List<string> { "Agent/writer" }, followReferences = true }, token).ConfigureAwait(false);
                    Assert.True(export.RequiredSecrets.SequenceEqual(new List<string> { "api-token", "git-token" }), "Required secrets: " + String.Join(",", export.RequiredSecrets));
                    Assert.True(export.FileName == "garrison-bundle-" + host.TenantId + ".yaml" && export.MediaType == "application/yaml", "File name and media type");
                    Assert.True(Documents(export.Manifest, "Deployment").SequenceEqual(new List<string> { "helper-main", "writer-main" }) && !export.Manifest.Contains(_ApiTokenValue, StringComparison.Ordinal), "Same selection as REST");
                    McpManifestExport kinds = await client.CallAsync<McpManifestExport>("garrison_export_manifest", new { kinds = new List<string> { "Pipeline" } }, token).ConfigureAwait(false);
                    Assert.True(Documents(kinds.Manifest, "Pipeline").Count == 1 && Documents(kinds.Manifest, "Agent").Count == 0, "Kinds over MCP");
                    await client.ExpectErrorAsync("garrison_export_manifest", new { kinds = new List<string> { "Secret" } }, "ValidationFailed", token).ConfigureAwait(false);
                    await client.ExpectErrorAsync("garrison_export_manifest", new { resources = new List<string> { "Agent/nobody" } }, "NotFound", token).ConfigureAwait(false);
                    ManifestApply mcpApply = await client.CallAsync<ManifestApply>("garrison_apply_manifest", new { manifest = export.Manifest, dryRun = true }, token).ConfigureAwait(false);
                    Assert.Equal(0, mcpApply.FailedCount, "MCP export applies with the MCP apply tool");
                }
            }
        }

        #endregion
    }
}
