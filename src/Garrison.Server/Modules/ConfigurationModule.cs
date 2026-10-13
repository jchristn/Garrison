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
            options.ApiBaseUrl = ApiBaseUrl(context);
            _Compiler = new InvocationCompiler(context.Database, context.Cipher, options);
            context.Register(options);
            _Manifests = new ManifestService(context.Database, context.Cipher);
            _Cards = new AgentCardService(context.Database, () => ExternalUrls.RestBaseUrl(context, null));

            context.Register(_Compiler);
            context.Register(_Manifests);
            context.Register(_Cards);
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
            new ModelPriceRoutes(context).Register(routes);
            new UsageQuotaRoutes(context).Register(routes);
            new AgentRoutes(context, _Cards!).Register(routes);
            new DeploymentRoutes(context, _Compiler!).Register(routes);
            new ManifestRoutes(context, _Manifests!).Register(routes);
        }

        /// <inheritdoc />
        public Task StartAsync(ServerContext context, CancellationToken token)
        {
            return Task.CompletedTask;
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
