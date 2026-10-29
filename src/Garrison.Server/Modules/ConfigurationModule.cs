namespace Garrison.Server.Modules
{
    using System;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Manifests;
    using Garrison.Core.Services;
    using Garrison.Server.Routes;
    using Garrison.Server.Services;

    /// <summary>
    /// Configuration domain: harness profiles, prompt templates, MCP servers, secrets, workspaces, artifact stores,
    /// agents, deployments, manifests, and the invocation compiler. Publishes <see cref="InvocationCompiler"/>,
    /// <see cref="ManifestService"/>, and <see cref="AgentCardService"/> to the server context.
    /// </summary>
    public class ConfigurationModule : IServerModule
    {
        #region Public-Members

        /// <inheritdoc />
        public string Name
        {
            get
            {
                return "ConfigurationModule";
            }
        }

        #endregion

        #region Private-Members

        private InvocationCompiler? _Compiler = null;
        private ManifestService? _Manifests = null;
        private AgentCardService? _Cards = null;

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task InitializeAsync(ServerContext context, CancellationToken token)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));

            await new BuiltInSeeder(context.Database, message => context.Logging.Info("[Garrison] " + message)).SeedAsync(token).ConfigureAwait(false);

            CompilerOptions options = new CompilerOptions();
            options.McpBaseUrl = String.IsNullOrWhiteSpace(context.Settings.Mcp.PublicUrl) ? "http://127.0.0.1:" + context.Settings.Mcp.Port : context.Settings.Mcp.PublicUrl!.TrimEnd('/');
            options.McpPath = context.Settings.Mcp.Path;
            options.AgentMemoryEnabled = context.Settings.AgentMemory.Enabled;
            if (context.Settings.AgentMemory.Enabled && context.TryGet<Garrison.Core.Memory.IAgentMemoryStore>() == null)
                context.Register<Garrison.Core.Memory.IAgentMemoryStore>(new Garrison.Core.Memory.FilesystemAgentMemoryStore(context.Settings.AgentMemory.RootDirectory, context.Settings.AgentMemory.MaxValueBytes));
            options.ApiBaseUrl = ApiBaseUrl(context);
            options.ArtifactCollection.MaxFileBytes = context.Settings.Artifacts.MaxFileBytes;
            options.ArtifactCollection.MaxTotalBytes = context.Settings.Artifacts.MaxTotalBytes;
            options.ArtifactCollection.MaxFiles = context.Settings.Artifacts.MaxFiles;
            options.ArtifactCollection.MaxScanEntries = context.Settings.Artifacts.MaxScanEntries;
            options.ArtifactCollection.TimeoutSeconds = context.Settings.Artifacts.CollectionTimeoutSeconds;
            _Compiler = new InvocationCompiler(context.Database, context.Cipher, options);
            context.Register(options);
            _Manifests = new ManifestService(context.Database, context.Cipher);
            _Cards = new AgentCardService(context.Database, () => ExternalUrls.RestBaseUrl(context, null));

            context.Register(new ArtifactService(context));
            context.Register(new WorkerMcpTestService(context));
            context.Register(new McpToolListingService(context));
            context.Register(new CapabilityService(context));
            context.Register(_Compiler);
            context.Register(_Manifests);
            context.Register(_Cards);
            context.Register(new AgentRevisionService(context));
            context.Register(new PromotionService(context));
            context.Register(new AgenticAppService(context));
            context.Register(new AppGatewayService(context));
            AgentAssetService assets = new AgentAssetService(context);
            context.Register(assets);
            _Manifests.AssetContent = new ManifestAssetContentStore(assets);
            _Manifests.AppValidator = (tenantId, app, appId, ct) => context.Get<AgenticAppService>().ValidateForManifestAsync(tenantId, app, appId, ct);
            context.Register(new FileSpaceService(context));
            context.Register(new StudioService(context));
            context.Register(new ArchitectService(context));
            context.Register(new PromptTemplateService(context));
        }

        /// <inheritdoc />
        public void RegisterRoutes(ServerContext context, RouteRegistrar routes)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));
            if (routes == null) throw new ArgumentNullException(nameof(routes));

            new HarnessProfileRoutes(context).Register(routes);
            new PromptTemplateRoutes(context).Register(routes);
            new McpServerRoutes(context).Register(routes);
            new SecretRoutes(context).Register(routes);
            new WorkspaceTemplateRoutes(context).Register(routes);
            new ArtifactStoreRoutes(context).Register(routes);
            new ArtifactRoutes(context, context.Get<ArtifactService>()).Register(routes);
            new ModelPriceRoutes(context).Register(routes);
            new UsageQuotaRoutes(context).Register(routes);
            new AgentRoutes(context, _Cards!).Register(routes);
            new DeploymentRoutes(context, _Compiler!).Register(routes);
            new AgentRevisionRoutes(context, context.Get<AgentRevisionService>()).Register(routes);
            new PromotionRoutes(context, context.Get<PromotionService>()).Register(routes);
            new AgentAssetRoutes(context, context.Get<AgentAssetService>()).Register(routes);
            new CapabilityRoutes(context, context.Get<CapabilityService>()).Register(routes);
            new AppRoutes(context, context.Get<AgenticAppService>()).Register(routes);
            new AppGatewayRoutes(context, context.Get<AppGatewayService>()).Register(routes);
            new FileSpaceRoutes(context, context.Get<FileSpaceService>()).Register(routes);
            new StudioRoutes(context, context.Get<StudioService>()).Register(routes);
            new ManifestRoutes(context, _Manifests!).Register(routes);
        }

        /// <inheritdoc />
        public async Task StartAsync(ServerContext context, CancellationToken token)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));
            ArchitectService architect = context.Get<ArchitectService>();
            IdentityService? identity = context.TryGet<IdentityService>();
            if (identity != null) identity.TenantCreated = (tenantId, ct) => architect.SeedTenantAsync(tenantId, ct);
            await architect.SeedAllAsync(token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public Task StopAsync(CancellationToken token)
        {
            return Task.CompletedTask;
        }

        #endregion

        #region Private-Methods

        private static string ApiBaseUrl(ServerContext context)
        {
            // Internal URL handed to runs. Rest.PublicBaseUrl is the internal setting; Rest.ExternalBaseUrl is for people.
            if (!String.IsNullOrWhiteSpace(context.Settings.Rest.PublicBaseUrl)) return context.Settings.Rest.PublicBaseUrl!.Trim().TrimEnd('/');
            return ExternalUrls.BindBaseUrl(context);
        }

        #endregion
    }
}
