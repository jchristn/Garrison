namespace Garrison.Server.Modules
{
    using System;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Server.Protocols;
    using Garrison.Server.Routes;
    using Garrison.Server.Runtime;

    /// <summary>
    /// Protocol ingress: MCP (Voltaic, own port), A2A gateway (main port), and agent-to-agent delegation through both.
    /// </summary>
    public class ProtocolModule : IServerModule
    {
        #region Public-Members

        /// <inheritdoc />
        public string Name
        {
            get
            {
                return "ProtocolModule";
            }
        }

        #endregion

        #region Private-Members

        private GarrisonMcpServer? _Mcp = null;

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public Task InitializeAsync(ServerContext context, CancellationToken token)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));
            _Mcp = new GarrisonMcpServer(context, context.Get<AgentInvoker>(), context.Get<RunService>(), context.Get<RunEventService>());
            context.Register(_Mcp);
            return Task.CompletedTask;
        }

        /// <inheritdoc />
        public void RegisterRoutes(ServerContext context, RouteRegistrar routes)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));
            if (routes == null) throw new ArgumentNullException(nameof(routes));
            new A2ARoutes(context, context.Get<AgentInvoker>(), context.Get<RunService>(), context.Get<RunSignals>(), context.Get<RuntimeOptions>()).Register(routes);
            _Mcp!.RecordScopes();
        }

        /// <inheritdoc />
        public async Task StartAsync(ServerContext context, CancellationToken token)
        {
            await _Mcp!.StartAsync(token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public Task StopAsync(CancellationToken token)
        {
            _Mcp?.Stop();
            _Mcp?.Dispose();
            return Task.CompletedTask;
        }

        #endregion
    }
}
