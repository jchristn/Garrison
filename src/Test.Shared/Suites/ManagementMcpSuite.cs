namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using System.Text.RegularExpressions;
    using Garrison.Core.Security;
    using Garrison.ProviderHarness;
    using Garrison.Server.Protocols;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>Tenant configuration MCP: shared mutations, authorization, scoping, protection and manifests.</summary>
    public static class ManagementMcpSuite
    {
        /// <summary>Build retained management checks.</summary>
        /// <returns>Suites.</returns>
        public static IReadOnlyList<TestSuiteDescriptor> Build()
        {
            List<TestSuiteDescriptor> suites = new List<TestSuiteDescriptor>();
            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "management-mcp-" + provider.ToString().ToLowerInvariant();
                suites.Add(new TestSuiteDescriptor(id, "Management MCP", new List<TestCaseDescriptor>
                {
                    new TestCaseDescriptor(id, "mutations", "Agent/deployment CRUD shares REST validation, protection, versioning, default bindings and audit", ct => MutationsAsync(provider, ct)),
                    new TestCaseDescriptor(id, "authorization", "Developer credentials stay tenant-scoped; viewers and hosted run tokens cannot write configuration", ct => AuthorizationAsync(provider, ct)),
                    new TestCaseDescriptor(id, "manifests", "Manifest dry-run/apply/export preserves idempotence and requires extra authority for inline secrets", ct => ManifestsAsync(provider, ct)),
                    new TestCaseDescriptor(id, "pipelines", "Pipeline tools: definition CRUD, start with waitSeconds and idempotency, reviews, runs, cancel, in-use delete, viewer and tenant isolation, hidden from and denied to run tokens", ct => PipelinesAsync(provider, ct))
                }));
            }
            return suites;
        }
        private static async Task MutationsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            using (TestMcpClient client = new TestMcpClient())
            {
                await client.ConnectAsync(host, null, token).ConfigureAwait(false);
                List<McpToolDefinition> tools = McpToolCatalog.All().Where(t => t.ManagementTool).ToList();
                foreach (McpToolDefinition tool in tools)
                {
                    Assert.True(host.Server.Context.Scopes.Find("MCP", tool.Name) != null, "Management tool scope is registered");
                    Assert.Equal(1, Regex.Matches(tool.AdministratorInputSchemaJson, "System administrators only:").Count, "Only the root schema receives the administrator tenant selector");
                    Assert.True((await client.ToolsAsync(token).ConfigureAwait(false)).Tools.Any(t => t.Name == tool.Name), "Administrator sees management tool");
                }
                Agent agent = await client.CallAsync<Agent>("garrison_create_agent", new { configuration = new Agent { Id = "agt_ignored", TenantId = "ten_ignored", Name = "mcp-managed", IsProtected = true } }, token).ConfigureAwait(false);
                Assert.True(agent.Id != "agt_ignored" && agent.TenantId == host.TenantId && !agent.IsProtected, "Creation assigns own identity/tenant/protection");
                Agent read = await client.CallAsync<Agent>("garrison_get_agent_configuration", new { agent = agent.Name }, token).ConfigureAwait(false);
                Assert.Equal(agent.Id, read.Id, "Complete configuration read by name");
                agent.Description = "updated through MCP";
                Agent changed = await client.CallAsync<Agent>("garrison_update_agent", new { agent = agent.Id, configuration = agent }, token).ConfigureAwait(false);
                Assert.Equal(agent.CreatedUtc, changed.CreatedUtc, "Creation time preserved");
                Assert.Equal(agent.Description, changed.Description, "Agent update persists");
                await client.ExpectErrorAsync("garrison_create_agent", new { configuration = new Agent { Name = agent.Name } }, "Name", token).ConfigureAwait(false);
                await client.ExpectErrorAsync("garrison_create_agent", new { configuration = new Agent { Name = "INVALID NAME" } }, "ValidationFailed", token).ConfigureAwait(false);
                Deployment deployment = await client.CallAsync<Deployment>("garrison_create_deployment", new { configuration = new Deployment { Id = "dep_ignored", TenantId = "ten_ignored", Name = "mcp-managed", AgentId = agent.Id, HarnessProfileId = "hrn_builtin_fake", ConfigVersion = 90, IsProtected = true } }, token).ConfigureAwait(false);
                Assert.True(deployment.Id != "dep_ignored" && deployment.TenantId == host.TenantId && !deployment.IsProtected && deployment.ConfigVersion == 1, "Deployment creation normalization");
                Assert.True(deployment.PromptBindings.Any(p => p.Role == "System") && deployment.PromptBindings.Any(p => p.Role == "Task"), "Standard prompts applied");
                deployment.Weight = 2;
                Deployment updated = await client.CallAsync<Deployment>("garrison_update_deployment", new { deploymentId = deployment.Id, configuration = deployment }, token).ConfigureAwait(false);
                Assert.Equal(2, updated.ConfigVersion, "Configuration version advances");
                Assert.Equal(deployment.CreatedUtc, updated.CreatedUtc, "Deployment creation time preserved");
                Assert.Equal(2, (await client.CallAsync<Deployment>("garrison_get_deployment", new { deploymentId = deployment.Id }, token).ConfigureAwait(false)).Weight, "Deployment read");
                EnumerationResult<Deployment> listed = await client.CallAsync<EnumerationResult<Deployment>>("garrison_list_deployments", new { search = "mcp-managed" }, token).ConfigureAwait(false);
                Assert.True(listed.Objects.Any(d => d.Id == deployment.Id), "Deployment list");
                await client.ExpectErrorAsync("garrison_create_deployment", new { configuration = new Deployment { Name = "bad-ref", AgentId = agent.Id, HarnessProfileId = "hrn_missing" } }, "ValidationFailed", token).ConfigureAwait(false);
                updated.IsProtected = true;
                await host.Server.Context.Database.Deployments.UpdateAsync(updated, token).ConfigureAwait(false);
                await client.ExpectErrorAsync("garrison_delete_deployment", new { deploymentId = updated.Id }, "Protected", token).ConfigureAwait(false);
                await client.ExpectErrorAsync("garrison_update_deployment", new { deploymentId = updated.Id, configuration = deployment }, "Protected", token).ConfigureAwait(false);
                updated.IsProtected = false;
                await host.Server.Context.Database.Deployments.UpdateAsync(updated, token).ConfigureAwait(false);
                McpConfigurationDeletion deleted = await client.CallAsync<McpConfigurationDeletion>("garrison_delete_deployment", new { deploymentId = updated.Id }, token).ConfigureAwait(false);
                Assert.True(deleted.Deleted, "Deployment delete");
                await client.CallAsync<Deployment>("garrison_create_deployment", new { configuration = new Deployment { Name = "cascade-managed", AgentId = agent.Id, HarnessProfileId = "hrn_builtin_fake" } }, token).ConfigureAwait(false);
                await client.CallAsync<McpConfigurationDeletion>("garrison_delete_agent", new { agent = agent.Id }, token).ConfigureAwait(false);
                Assert.Equal(0, (await host.Server.Context.Database.Deployments.ListByAgentAsync(host.TenantId, agent.Id, token).ConfigureAwait(false)).Count, "Agent deletion cascades deployments");
                Assert.True((await host.Server.Context.Database.Audit.EnumerateAsync(new AuditFilter { TenantId = host.TenantId, EventType = AuditEventTypeEnum.ConfigurationChanged }, token).ConfigureAwait(false)).Objects.Count >= 7, "Mutations audited");
            }
        }
        private static async Task AuthorizationAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                Tenant other = await host.Server.Context.Database.Tenants.CreateAsync(new Tenant { Name = "other-management" }, token).ConfigureAwait(false);
                Agent outside = await host.Server.Context.Database.Agents.CreateAsync(new Agent { TenantId = other.Id, Name = "outside-management" }, token).ConfigureAwait(false);
                User developer = await UserAsync(host, "developer-management@example.com", BuiltInRoles.AgentDeveloper, token).ConfigureAwait(false);
                using (HttpClient login = await host.UserClientAsync(developer.Email, "password123", host.TenantId, token).ConfigureAwait(false))
                using (TestMcpClient client = new TestMcpClient())
                {
                    await client.ConnectAsync(host, login.DefaultRequestHeaders.Authorization!.Parameter, token).ConfigureAwait(false);
                    Agent created = await client.CallAsync<Agent>("garrison_create_agent", new { tenantId = other.Id, configuration = new Agent { Name = "developer-managed", TenantId = other.Id } }, token).ConfigureAwait(false);
                    Assert.Equal(host.TenantId, created.TenantId, "Developer ignores caller-supplied foreign tenant");
                    await client.ExpectErrorAsync("garrison_update_agent", new { agent = outside.Id, configuration = new Agent { Name = "stolen" } }, "NotFound", token).ConfigureAwait(false);
                    await client.ExpectErrorAsync("garrison_delete_agent", new { agent = outside.Id }, "NotFound", token).ConfigureAwait(false);
                }
                CredentialCreateResponse credential = await HttpTestHelpers.SendAsync<CredentialCreateResponse>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + host.TenantId + "/credentials", new CredentialRequest { UserId = developer.Id, Name = "management-api-credential", RoleName = BuiltInRoles.AgentDeveloper }, 201, token).ConfigureAwait(false);
                using (TestMcpClient client = new TestMcpClient())
                {
                    await client.ConnectAccessKeyAsync(host, credential.AccessKey, credential.SecretKey, token).ConfigureAwait(false);
                    Agent configured = await client.CallAsync<Agent>("garrison_create_agent", new { configuration = new Agent { Name = "api-credential-managed" } }, token).ConfigureAwait(false);
                    Assert.Equal(host.TenantId, configured.TenantId, "Developer API credential writes only its own tenant");
                }
                User viewer = await UserAsync(host, "viewer-management@example.com", BuiltInRoles.Viewer, token).ConfigureAwait(false);
                using (HttpClient login = await host.UserClientAsync(viewer.Email, "password123", host.TenantId, token).ConfigureAwait(false))
                using (TestMcpClient client = new TestMcpClient())
                {
                    await client.ConnectAsync(host, login.DefaultRequestHeaders.Authorization!.Parameter, token).ConfigureAwait(false);
                    await client.ExpectErrorAsync("garrison_create_agent", new { configuration = new Agent { Name = "viewer-write" } }, "Forbidden", token).ConfigureAwait(false);
                    await client.ExpectErrorAsync("garrison_create_deployment", new { configuration = new Deployment { Name = "viewer-write" } }, "Forbidden", token).ConfigureAwait(false);
                }
                Agent origin = await host.Server.Context.Database.Agents.CreateAsync(new Agent { TenantId = host.TenantId, Name = "run-origin" }, token).ConfigureAwait(false);
                Deployment deployment = await host.Server.Context.Database.Deployments.CreateAsync(new Deployment { TenantId = host.TenantId, Name = "run-origin", AgentId = origin.Id, HarnessProfileId = "hrn_builtin_fake" }, token).ConfigureAwait(false);
                Run run = await host.Server.Context.Database.Runs.CreateAsync(new Run { TenantId = host.TenantId, AgentId = origin.Id, DeploymentId = deployment.Id, Status = RunStatusEnum.Running, CallerType = PrincipalTypeEnum.Administrator, LeaseEpoch = 1, LeaseExpiresUtc = DateTime.UtcNow.AddMinutes(5) }, token).ConfigureAwait(false);
                string bearer = await host.Server.Context.Authentication.IssueForRunAsync(run, 1, DateTime.UtcNow.AddMinutes(5), token).ConfigureAwait(false);
                using (TestMcpClient client = new TestMcpClient())
                {
                    await client.ConnectAsync(host, bearer, token).ConfigureAwait(false);
                    Assert.True((await client.ToolsAsync(token).ConfigureAwait(false)).Tools.All(t => !McpToolCatalog.All().Any(d => d.ManagementTool && d.Name == t.Name)), "Hosted run sees no management tools");
                    await client.ExpectErrorAsync("garrison_create_agent", new { configuration = new Agent { Name = "run-write" } }, "Forbidden", token).ConfigureAwait(false);
                    await client.ExpectErrorAsync("garrison_apply_manifest", new { manifest = AgentManifest("run-manifest") }, "Forbidden", token).ConfigureAwait(false);
                }
            }
        }
        private static async Task ManifestsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            using (TestMcpClient client = new TestMcpClient())
            {
                User developer = await UserAsync(host, "manifest-management@example.com", BuiltInRoles.AgentDeveloper, token).ConfigureAwait(false);
                using (HttpClient login = await host.UserClientAsync(developer.Email, "password123", host.TenantId, token).ConfigureAwait(false))
                    await client.ConnectAsync(host, login.DefaultRequestHeaders.Authorization!.Parameter, token).ConfigureAwait(false);
                string manifest = AgentManifest("manifest-managed");
                ManifestApply dry = await client.CallAsync<ManifestApply>("garrison_apply_manifest", new { manifest, dryRun = true }, token).ConfigureAwait(false);
                Assert.Equal(0, dry.FailedCount, "Manifest dry-run validates");
                Assert.True(await host.Server.Context.Database.Agents.ReadByNameAsync(host.TenantId, "manifest-managed", token).ConfigureAwait(false) == null, "Dry run makes no configuration change");
                ManifestApply applied = await client.CallAsync<ManifestApply>("garrison_apply_manifest", new { manifest }, token).ConfigureAwait(false);
                Assert.Equal(1, applied.CreatedCount, "Manifest creates agent");
                Assert.Equal(1, (await client.CallAsync<ManifestApply>("garrison_apply_manifest", new { manifest }, token).ConfigureAwait(false)).UnchangedCount, "Manifest apply remains idempotent");
                string secret = "apiVersion: garrison/v1\nkind: Secret\nmetadata:\n  name: inline-management\nspec:\n  kind: GenericEnv\n  value: fixture-inline-secret-never-returned\n";
                ManifestApply rejected = await client.CallAsync<ManifestApply>("garrison_apply_manifest", new { manifest = secret }, token).ConfigureAwait(false);
                Assert.True(rejected.FailedCount > 0, "Inline secrets denied by default");
                await client.ExpectErrorAsync("garrison_apply_manifest", new { manifest = secret, allowSecretValues = true }, "Forbidden", token).ConfigureAwait(false);
                string exported = (await client.CallAsync<McpManifestExport>("garrison_export_manifest", new { }, token).ConfigureAwait(false)).Manifest;
                Assert.True(exported.Contains("manifest-managed", StringComparison.Ordinal) && !exported.Contains("fixture-inline-secret-never-returned", StringComparison.Ordinal), "Export has configuration without secret values");
                Assert.Equal(0, (await client.CallAsync<ManifestApply>("garrison_apply_manifest", new { manifest = exported, dryRun = true }, token).ConfigureAwait(false)).FailedCount, "Export is directly reusable YAML");
            }
        }
        private static async Task PipelinesAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            using (TestMcpClient client = new TestMcpClient())
            {
                TestServerHost host = cluster.Server;
                await client.ConnectAsync(host, null, token).ConfigureAwait(false);
                List<string> names = new List<string> { "garrison_list_pipelines", "garrison_start_pipeline", "garrison_get_pipeline_run", "garrison_list_pipeline_runs", "garrison_cancel_pipeline_run", "garrison_list_pipeline_reviews", "garrison_decide_pipeline_review", "garrison_get_pipeline", "garrison_create_pipeline", "garrison_update_pipeline", "garrison_delete_pipeline" };
                ProviderToolPage listed = await client.ToolsAsync(token).ConfigureAwait(false);
                foreach (string name in names)
                {
                    McpToolDefinition? tool = McpToolCatalog.All().FirstOrDefault(t => t.Name == name);
                    Assert.True(tool != null && tool.UserOnly, name + " is a user-only tool");
                    Assert.True(host.Server.Context.Scopes.Find("MCP", name) != null, name + " scope is registered");
                    Assert.True(listed.Tools.Any(t => t.Name == name), "Administrator sees " + name);
                    PromptTemplate? description = await host.Server.Context.Database.PromptTemplates.ReadByNameAsync(host.TenantId, McpToolCatalog.BuiltInDescriptionPrefix + name, token).ConfigureAwait(false);
                    Assert.True(description != null && description.IsBuiltIn && description.Kind == PromptTemplateKindEnum.ToolDescription, name + " description is a seeded template");
                }

                Agent writer = await cluster.CreateAgentAsync("mcp-pipe-writer", "builtin/fake", null, token).ConfigureAwait(false);
                Agent editor = await cluster.CreateAgentAsync("mcp-pipe-editor", "builtin/fake", null, token).ConfigureAwait(false);
                Pipeline definition = new Pipeline { Id = "ppl_ignored", TenantId = "ten_ignored", Name = "mcp-pipeline", IsProtected = true };
                definition.Stages.Add(new PipelineStage { Name = "write", AgentId = writer.Id, RequiresReview = true, MaxRevisions = 1 });
                definition.Stages.Add(new PipelineStage { Name = "edit", AgentId = editor.Id });
                Pipeline created = await client.CallAsync<Pipeline>("garrison_create_pipeline", new { configuration = definition }, token).ConfigureAwait(false);
                Assert.True(created.Id != "ppl_ignored" && created.TenantId == host.TenantId && !created.IsProtected && created.Version == 1 && created.Stages.Count == 2, "Creation assigns identity, tenant, protection, and stages");
                await client.ExpectErrorAsync("garrison_create_pipeline", new { configuration = new Pipeline { Name = "mcp-pipeline-empty" } }, "ValidationFailed", token).ConfigureAwait(false);
                await client.ExpectErrorAsync("garrison_create_pipeline", new { configuration = definition }, "NameConflict", token).ConfigureAwait(false);
                Pipeline read = await client.CallAsync<Pipeline>("garrison_get_pipeline", new { pipeline = created.Name }, token).ConfigureAwait(false);
                Assert.Equal(created.Id, read.Id, "Pipeline read by name");
                read.Description = "updated through MCP";
                Pipeline updated = await client.CallAsync<Pipeline>("garrison_update_pipeline", new { pipeline = read.Id, configuration = read }, token).ConfigureAwait(false);
                Assert.True(updated.Version == 2 && updated.Description == "updated through MCP" && updated.CreatedUtc == created.CreatedUtc, "Update advances the version and keeps creation time");
                EnumerationResult<Pipeline> pipelines = await client.CallAsync<EnumerationResult<Pipeline>>("garrison_list_pipelines", new { search = "mcp-pipeline" }, token).ConfigureAwait(false);
                Assert.True(pipelines.Objects.Any(p => p.Id == created.Id), "Pipeline list");
                await client.ExpectErrorAsync("garrison_get_pipeline", new { pipeline = "missing-pipeline" }, "NotFound", token).ConfigureAwait(false);

                await client.ExpectErrorAsync("garrison_start_pipeline", new { pipeline = created.Name, input = "  " }, "ValidationFailed", token).ConfigureAwait(false);
                PipelineRun started = await client.CallAsync<PipelineRun>("garrison_start_pipeline", new { pipeline = created.Name, input = "Write a haiku", waitSeconds = 25, idempotencyKey = "mcp-pipe-key" }, token).ConfigureAwait(false);
                Assert.Equal(PipelineRunStatusEnum.AwaitingReview, started.Status, "waitSeconds waits until the review gate");
                Assert.True(started.Stages.Count == 2 && started.Runs.Count == 1, "The detail carries stages and stage runs");
                PipelineRun repeated = await client.CallAsync<PipelineRun>("garrison_start_pipeline", new { pipeline = created.Id, input = "Write a haiku", idempotencyKey = "mcp-pipe-key" }, token).ConfigureAwait(false);
                Assert.Equal(started.Id, repeated.Id, "The same idempotency key returns the same pipeline run");
                await client.ExpectErrorAsync("garrison_start_pipeline", new { pipeline = created.Id, input = "Different input", idempotencyKey = "mcp-pipe-key" }, "IdempotencyKeyConflict", token).ConfigureAwait(false);

                EnumerationResult<PipelineReview> reviews = await client.CallAsync<EnumerationResult<PipelineReview>>("garrison_list_pipeline_reviews", new { status = "Pending", pipelineRunId = started.Id }, token).ConfigureAwait(false);
                Assert.Equal(1, reviews.Objects.Count, "One pending review");
                PipelineReview pending = reviews.Objects[0];
                await client.ExpectErrorAsync("garrison_list_pipeline_reviews", new { status = "Unknown" }, "ValidationFailed", token).ConfigureAwait(false);
                await client.ExpectErrorAsync("garrison_decide_pipeline_review", new { reviewId = pending.Id, decision = "RequestChanges" }, "ValidationFailed", token).ConfigureAwait(false);
                await client.ExpectErrorAsync("garrison_decide_pipeline_review", new { reviewId = "prv_missing", decision = "Approve" }, "NotFound", token).ConfigureAwait(false);

                User viewer = await UserAsync(host, "viewer-pipelines@example.com", BuiltInRoles.Viewer, token).ConfigureAwait(false);
                using (HttpClient login = await host.UserClientAsync(viewer.Email, "password123", host.TenantId, token).ConfigureAwait(false))
                using (TestMcpClient viewerClient = new TestMcpClient())
                {
                    await viewerClient.ConnectAsync(host, login.DefaultRequestHeaders.Authorization!.Parameter, token).ConfigureAwait(false);
                    Assert.True((await viewerClient.CallAsync<EnumerationResult<PipelineReview>>("garrison_list_pipeline_reviews", new { pipelineRunId = started.Id }, token).ConfigureAwait(false)).Objects.Any(r => r.Id == pending.Id), "Viewers read reviews");
                    Assert.Equal(started.Id, (await viewerClient.CallAsync<PipelineRun>("garrison_get_pipeline_run", new { pipelineRunId = started.Id }, token).ConfigureAwait(false)).Id, "Viewers read pipeline runs");
                    await viewerClient.ExpectErrorAsync("garrison_decide_pipeline_review", new { reviewId = pending.Id, decision = "Approve" }, "Forbidden", token).ConfigureAwait(false);
                    await viewerClient.ExpectErrorAsync("garrison_start_pipeline", new { pipeline = created.Id, input = "x" }, "Forbidden", token).ConfigureAwait(false);
                    await viewerClient.ExpectErrorAsync("garrison_cancel_pipeline_run", new { pipelineRunId = started.Id }, "Forbidden", token).ConfigureAwait(false);
                    await viewerClient.ExpectErrorAsync("garrison_update_pipeline", new { pipeline = created.Id, configuration = updated }, "Forbidden", token).ConfigureAwait(false);
                }

                Tenant other = await HttpTestHelpers.SendAsync<Tenant>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants", new TenantRequest { Name = "Pipelines MCP Other" }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + other.Id + "/users", new UserRequest { Email = "outsider-pipelines@example.com", Password = "password123", IsTenantAdmin = true }, 201, token).ConfigureAwait(false);
                using (HttpClient login = await host.UserClientAsync("outsider-pipelines@example.com", "password123", other.Id, token).ConfigureAwait(false))
                using (TestMcpClient outsider = new TestMcpClient())
                {
                    await outsider.ConnectAsync(host, login.DefaultRequestHeaders.Authorization!.Parameter, token).ConfigureAwait(false);
                    await outsider.ExpectErrorAsync("garrison_get_pipeline", new { pipeline = created.Id, tenantId = host.TenantId }, "NotFound", token).ConfigureAwait(false);
                    await outsider.ExpectErrorAsync("garrison_get_pipeline_run", new { pipelineRunId = started.Id }, "NotFound", token).ConfigureAwait(false);
                    await outsider.ExpectErrorAsync("garrison_decide_pipeline_review", new { reviewId = pending.Id, decision = "Reject" }, "NotFound", token).ConfigureAwait(false);
                    await outsider.ExpectErrorAsync("garrison_start_pipeline", new { pipeline = created.Id, input = "x" }, "NotFound", token).ConfigureAwait(false);
                    Assert.Equal(0, (await outsider.CallAsync<EnumerationResult<PipelineReview>>("garrison_list_pipeline_reviews", new { }, token).ConfigureAwait(false)).Objects.Count, "Other tenants list no reviews");
                }

                Deployment writerDeployment = (await host.Server.Context.Database.Deployments.ListByAgentAsync(host.TenantId, writer.Id, token).ConfigureAwait(false)).First();
                Run hosted = await host.Server.Context.Database.Runs.CreateAsync(new Run { TenantId = host.TenantId, AgentId = writer.Id, DeploymentId = writerDeployment.Id, Status = RunStatusEnum.Running, CallerType = PrincipalTypeEnum.Administrator, LeaseEpoch = 1, LeaseExpiresUtc = DateTime.UtcNow.AddMinutes(5) }, token).ConfigureAwait(false);
                string bearer = await host.Server.Context.Authentication.IssueForRunAsync(hosted, 1, DateTime.UtcNow.AddMinutes(5), token).ConfigureAwait(false);
                using (TestMcpClient runClient = new TestMcpClient())
                {
                    await runClient.ConnectAsync(host, bearer, token).ConfigureAwait(false);
                    ProviderToolPage runTools = await runClient.ToolsAsync(token).ConfigureAwait(false);
                    Assert.True(runTools.Tools.All(t => !names.Contains(t.Name)), "Run tokens see no pipeline tools");
                    await runClient.ExpectErrorAsync("garrison_list_pipelines", new { }, "Forbidden", token).ConfigureAwait(false);
                    await runClient.ExpectErrorAsync("garrison_start_pipeline", new { pipeline = created.Id, input = "x" }, "Forbidden", token).ConfigureAwait(false);
                    await runClient.ExpectErrorAsync("garrison_list_pipeline_reviews", new { }, "Forbidden", token).ConfigureAwait(false);
                    await runClient.ExpectErrorAsync("garrison_decide_pipeline_review", new { reviewId = pending.Id, decision = "Approve" }, "Forbidden", token).ConfigureAwait(false);
                }

                PipelineReview approved = await client.CallAsync<PipelineReview>("garrison_decide_pipeline_review", new { reviewId = pending.Id, decision = "Approve", comment = "Looks good" }, token).ConfigureAwait(false);
                Assert.True(approved.Status == PipelineReviewStatusEnum.Approved && approved.DecisionSource == PipelineReviewSourceEnum.User, "Review approved through MCP");
                await client.ExpectErrorAsync("garrison_decide_pipeline_review", new { reviewId = pending.Id, decision = "Reject" }, "ReviewNotPending", token).ConfigureAwait(false);
                PipelineRun finished = await client.CallAsync<PipelineRun>("garrison_get_pipeline_run", new { pipelineRunId = started.Id, waitSeconds = 25 }, token).ConfigureAwait(false);
                Assert.True(finished.Status == PipelineRunStatusEnum.Succeeded && finished.Outcome == PipelineRunOutcomeEnum.Succeeded, "The pipeline run succeeds after approval (" + finished.Status + ")");
                Assert.True(finished.Reviews.Any(r => r.Id == pending.Id) && finished.Runs.Count == 2, "The detail carries reviews and both stage runs");
                await client.ExpectErrorAsync("garrison_cancel_pipeline_run", new { pipelineRunId = started.Id }, "PipelineRunFinished", token).ConfigureAwait(false);

                PipelineRun second = await client.CallAsync<PipelineRun>("garrison_start_pipeline", new { pipeline = created.Id, input = "Write another" }, token).ConfigureAwait(false);
                await client.ExpectErrorAsync("garrison_delete_pipeline", new { pipeline = created.Id }, "PipelineInUse", token).ConfigureAwait(false);
                PipelineRun cancelling = await client.CallAsync<PipelineRun>("garrison_cancel_pipeline_run", new { pipelineRunId = second.Id }, token).ConfigureAwait(false);
                Assert.True(cancelling.Status == PipelineRunStatusEnum.Cancelling || cancelling.Status == PipelineRunStatusEnum.Cancelled, "Cancel moves the pipeline run to Cancelling or Cancelled");
                PipelineRun cancelled = await client.CallAsync<PipelineRun>("garrison_get_pipeline_run", new { pipelineRunId = second.Id, waitSeconds = 25 }, token).ConfigureAwait(false);
                Assert.Equal(PipelineRunStatusEnum.Cancelled, cancelled.Status, "The pipeline run ends Cancelled");
                EnumerationResult<PipelineRun> runs = await client.CallAsync<EnumerationResult<PipelineRun>>("garrison_list_pipeline_runs", new { pipeline = created.Name }, token).ConfigureAwait(false);
                Assert.True(runs.Objects.Any(r => r.Id == started.Id) && runs.Objects.Any(r => r.Id == second.Id), "Pipeline runs listed by pipeline name");
                EnumerationResult<PipelineRun> succeeded = await client.CallAsync<EnumerationResult<PipelineRun>>("garrison_list_pipeline_runs", new { status = "Succeeded", maxResults = 5 }, token).ConfigureAwait(false);
                Assert.True(succeeded.Objects.All(r => r.Status == PipelineRunStatusEnum.Succeeded) && succeeded.Objects.Any(r => r.Id == started.Id), "Pipeline runs filtered by status");

                McpConfigurationDeletion deleted = await client.CallAsync<McpConfigurationDeletion>("garrison_delete_pipeline", new { pipeline = created.Name }, token).ConfigureAwait(false);
                Assert.True(deleted.Deleted && deleted.Id == created.Id, "Pipeline delete");
                await client.ExpectErrorAsync("garrison_get_pipeline", new { pipeline = created.Id }, "NotFound", token).ConfigureAwait(false);
                Assert.True((await host.Server.Context.Database.Audit.EnumerateAsync(new AuditFilter { TenantId = host.TenantId, EventType = AuditEventTypeEnum.PipelineReviewDecided }, token).ConfigureAwait(false)).Objects.Count >= 1, "Review decision audited");
            }
        }
        private static string AgentManifest(string name) { return "apiVersion: garrison/v1\nkind: Agent\nmetadata:\n  name: " + name + "\nspec:\n  description: Created through a management MCP manifest.\n"; }
        private static async Task<User> UserAsync(TestServerHost host, string email, string role, CancellationToken token)
        {
            User user = await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + host.TenantId + "/users", new UserRequest { Email = email, Password = "password123" }, 201, token).ConfigureAwait(false);
            await HttpTestHelpers.SendAsync<UserRoleAssignment>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + host.TenantId + "/user-role-assignments", new AssignmentRequest { UserId = user.Id, RoleName = role }, 201, token).ConfigureAwait(false);
            return user;
        }
    }
}
