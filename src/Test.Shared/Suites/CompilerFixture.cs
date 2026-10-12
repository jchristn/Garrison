namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Security;
    using Garrison.Core.Services;
    using Test.Shared.Infrastructure;

    /// <summary>
    /// Deterministic compiler fixture: a seeded database with fixed identifiers so compiled specs can be compared to goldens.
    /// </summary>
    public sealed class CompilerFixture : IDisposable
    {
        #region Public-Members

        /// <summary>
        /// Tenant identifier.
        /// </summary>
        public static readonly string TenantId = "ten_golden";

        /// <summary>
        /// Database.
        /// </summary>
        public DatabaseDriverBase Database { get; }

        /// <summary>
        /// Secret cipher.
        /// </summary>
        public SecretCipher Cipher { get; } = new SecretCipher("golden-master-key");

        /// <summary>
        /// Compiler.
        /// </summary>
        public InvocationCompiler Compiler { get; }

        #endregion

        #region Constructors-and-Factories

        private CompilerFixture(DatabaseDriverBase database)
        {
            Database = database;
            CompilerOptions options = new CompilerOptions();
            options.McpBaseUrl = "http://garrison-server:8701";
            options.McpPath = "/mcp";
            options.ApiBaseUrl = "http://garrison-server:8700";
            Compiler = new InvocationCompiler(database, Cipher, options);
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Create a seeded fixture.
        /// </summary>
        /// <param name="provider">Provider.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Fixture.</returns>
        public static async Task<CompilerFixture> CreateAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            DatabaseDriverBase database = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false);
            await new BuiltInSeeder(database).SeedAsync(token).ConfigureAwait(false);
            Tenant tenant = new Tenant();
            tenant.Id = TenantId;
            tenant.Name = "Golden";
            await database.Tenants.CreateAsync(tenant, token).ConfigureAwait(false);
            return new CompilerFixture(database);
        }

        /// <summary>
        /// Create a secret with a fixed identifier.
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="kind">Kind.</param>
        /// <param name="value">Value.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Secret.</returns>
        public async Task<Secret> SecretAsync(string id, SecretKindEnum kind, string value, CancellationToken token)
        {
            Secret secret = new Secret();
            secret.Id = id;
            secret.TenantId = TenantId;
            secret.Name = id;
            secret.Kind = kind;
            secret.ValueEncrypted = Cipher.Encrypt(value, id);
            return await Database.Secrets.CreateAsync(secret, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Create an agent and deployment for a built-in profile.
        /// </summary>
        /// <param name="profileKey">Built-in profile key, for example claude-code.</param>
        /// <param name="full">Whether to use the full variant (schema, delegation, MCP server, workspace, effort).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Deployment.</returns>
        public async Task<Deployment> DeploymentAsync(string profileKey, bool full, CancellationToken token)
        {
            string suffix = profileKey.Replace("-", "_") + (full ? "_full" : "_basic");
            Agent agent = new Agent();
            agent.Id = "agt_" + suffix;
            agent.TenantId = TenantId;
            agent.Name = "helper-" + profileKey + (full ? "-full" : "-basic");
            agent.DisplayName = "Helper";
            agent.Description = "Answers questions about the repository.";
            if (full)
            {
                agent.OutputSchemaJson = "{ \"type\": \"object\", \"properties\": { \"answer\": { \"type\": \"string\" } }, \"required\": [\"answer\"], \"additionalProperties\": false }";
                agent.DelegationMode = DelegationModeEnum.AllowList;
                agent.DelegationAllowList.Add("codex-coder");
            }
            await Database.Agents.CreateAsync(agent, token).ConfigureAwait(false);

            Deployment deployment = new Deployment();
            deployment.Id = "dep_" + suffix;
            deployment.TenantId = TenantId;
            deployment.AgentId = agent.Id;
            deployment.Name = agent.Name + "-default";
            deployment.HarnessProfileId = "hrn_builtin_" + profileKey.Replace("-", "_");
            if (profileKey != "fake") deployment.Model = "test-model";
            deployment.PromptBindings.Add(new DeploymentPromptBinding { Role = "System", TemplateId = BuiltInSeeder.PromptId("default-system") });
            deployment.PromptBindings.Add(new DeploymentPromptBinding { Role = "Task", TemplateId = BuiltInSeeder.PromptId("default-task") });

            SecretKindEnum kind = profileKey switch
            {
                "claude-code" => SecretKindEnum.ClaudeCodeOAuthToken,
                "codex" => SecretKindEnum.OpenAiApiKey,
                "codex-app-server" => SecretKindEnum.OpenAiApiKey,
                "mux" => SecretKindEnum.OpenAiApiKey,
                "gemini-cli" => SecretKindEnum.GeminiApiKey,
                _ => SecretKindEnum.GenericEnv
            };
            Secret credential = await SecretAsync("sec_" + suffix, kind, "credential-" + suffix, token).ConfigureAwait(false);
            deployment.ResourceBindings.Add(new DeploymentResourceBinding { Kind = ResourceBindingKindEnum.Secret, Alias = "credential", ResourceId = credential.Id });
            if (profileKey == "mux")
            {
                deployment.Parameters.Add(new DeploymentParameter { Name = "baseUrl", Value = "http://ollama:11434/v1" });
                deployment.Parameters.Add(new DeploymentParameter { Name = "adapterType", Value = "openai-compatible" });
                if (full)
                {
                    deployment.Parameters.Add(new DeploymentParameter { Name = "contextWindow", Value = "131072" });
                    deployment.Parameters.Add(new DeploymentParameter { Name = "maxTokens", Value = "16384" });
                }
            }

            if (full)
            {
                deployment.Effort = "high";
                deployment.MaxTurns = 12;
                deployment.PromptBindings.Add(new DeploymentPromptBinding { Role = "DelegatedTask", TemplateId = BuiltInSeeder.PromptId("delegated-task") });

                Secret docsToken = await SecretAsync("sec_docs_" + suffix, SecretKindEnum.BearerToken, "docs-token-" + suffix, token).ConfigureAwait(false);
                deployment.ResourceBindings.Add(new DeploymentResourceBinding { Kind = ResourceBindingKindEnum.Secret, Alias = "docs", ResourceId = docsToken.Id });
                McpServer server = new McpServer();
                server.Id = "mcp_" + suffix;
                server.TenantId = TenantId;
                server.Name = "docs";
                server.Url = "https://mcp.example.com";
                server.Path = "/mcp";
                server.Headers.Add(new McpServerHeader { Name = "Authorization", ValueTemplate = "Bearer {{secret.docs}}" });
                server.RequiredTools.Add("search");
                server.ToolTimeoutSeconds = 120;
                await Database.McpServers.CreateAsync(server, token).ConfigureAwait(false);
                deployment.ResourceBindings.Add(new DeploymentResourceBinding { Kind = ResourceBindingKindEnum.McpServer, Alias = "docs", ResourceId = server.Id });

                Secret gitToken = await SecretAsync("sec_git_" + suffix, SecretKindEnum.BearerToken, "git-token-" + suffix, token).ConfigureAwait(false);
                WorkspaceTemplate workspace = new WorkspaceTemplate();
                workspace.Id = "wsp_" + suffix;
                workspace.TenantId = TenantId;
                workspace.Name = "repo-" + suffix;
                workspace.Kind = WorkspaceKindEnum.GitRepository;
                workspace.GitUrl = "https://github.com/example/repo.git";
                workspace.GitRef = "main";
                workspace.GitCredentialSecretId = gitToken.Id;
                await Database.WorkspaceTemplates.CreateAsync(workspace, token).ConfigureAwait(false);
                deployment.WorkspaceTemplateId = workspace.Id;
            }

            return await Database.Deployments.CreateAsync(deployment, token).ConfigureAwait(false);
        }

        /// <summary>
        /// A run for a deployment.
        /// </summary>
        /// <param name="deployment">Deployment.</param>
        /// <param name="delegated">Whether the run is a delegated child run.</param>
        /// <returns>Run.</returns>
        public static Run RunFor(Deployment deployment, bool delegated)
        {
            Run run = new Run();
            run.Id = "run_golden";
            run.TenantId = TenantId;
            run.AgentId = deployment.AgentId;
            run.DeploymentId = deployment.Id;
            run.InputText = "Summarize the repository.";
            run.CallerName = "admin@garrison";
            if (delegated)
            {
                run.Kind = RunKindEnum.Delegated;
                run.Depth = 1;
                run.ParentRunId = "run_parent";
                run.RootRunId = "run_parent";
                run.CallChain = "planner,helper";
            }
            return run;
        }

        /// <summary>
        /// Dispose.
        /// </summary>
        public void Dispose()
        {
            Database.Dispose();
        }

        #endregion
    }
}
