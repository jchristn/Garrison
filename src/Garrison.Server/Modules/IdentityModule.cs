namespace Garrison.Server.Modules
{
    using System;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Server.Routes;
    using Garrison.Server.Services;

    /// <summary>
    /// Identity and administration: tenants, users, credentials, roles, permissions, assignments, audit, request history,
    /// settings, and server info. Publishes <see cref="IdentityService"/>, <see cref="ClusterSettingsService"/>,
    /// <see cref="SettingsService"/>, <see cref="RequestHistoryCaptureService"/> (also as <see cref="IRequestObserver"/>),
    /// and <see cref="RetentionService"/>.
    /// </summary>
    public class IdentityModule : IServerModule
    {
        #region Private-Members

        private ClusterSettingsService? _Cluster = null;
        private RequestHistoryCaptureService? _Capture = null;
        private RetentionService? _Retention = null;
        private SettingsService? _SettingsService = null;
        private CancellationTokenSource? _Stopping = null;
        private Task? _ClusterLoop = null;
        private Task? _RetentionLoop = null;

        #endregion

        #region Public-Members

        /// <inheritdoc />
        public string Name
        {
            get
            {
                return "IdentityModule";
            }
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task InitializeAsync(ServerContext context, CancellationToken token)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));

            _Cluster = new ClusterSettingsService(context.Database, context.Settings.RequestHistory.Enabled, context.Settings.RequestHistory.RetentionDays);
            await _Cluster.RefreshAsync(token).ConfigureAwait(false);
            context.Register(_Cluster);

            _SettingsService = new SettingsService(context.Settings, _Cluster, context.Logging);
            context.Register(_SettingsService);
            context.Register(new IdentityService(context.Database, context.Cipher, context.Audit, context.Authorization));

            _Capture = new RequestHistoryCaptureService(context.Database, context.Settings.RequestHistory, _Cluster, context.Logging);
            context.Register(_Capture);
            context.Register<IRequestObserver>(_Capture);

            _Retention = new RetentionService(context.Database, _Cluster, context.Logging);
            context.Register(_Retention);
        }

        /// <inheritdoc />
        public void RegisterRoutes(ServerContext context, RouteRegistrar routes)
        {
            IdentityService identity = context.Get<IdentityService>();
            new TenantRoutes(context, identity).Register(routes);
            new UserRoutes(context, identity).Register(routes);
            new CredentialRoutes(context, identity).Register(routes);
            new RoleRoutes(context).Register(routes);
            new PermissionRoutes(context).Register(routes);
            new AssignmentRoutes(context, identity).Register(routes);
            new AuditRoutes(context).Register(routes);
            new RequestHistoryRoutes(context, context.Get<RequestHistoryCaptureService>()).Register(routes);
            new SettingsRoutes(context, context.Get<SettingsService>()).Register(routes);
            new ServerInfoRoutes(context, context.Get<RequestHistoryCaptureService>()).Register(routes);
        }

        /// <inheritdoc />
        public Task StartAsync(ServerContext context, CancellationToken token)
        {
            _Stopping = CancellationTokenSource.CreateLinkedTokenSource(token);
            _Capture!.Start();
            _ClusterLoop = Task.Run(() => _Cluster!.RunAsync(message => context.Logging.Warn("[Identity] " + message), _Stopping.Token));
            _RetentionLoop = Task.Run(() => _Retention!.RunAsync(_Stopping.Token));
            return Task.CompletedTask;
        }

        /// <inheritdoc />
        public async Task StopAsync(CancellationToken token)
        {
            if (_Capture != null) await _Capture.StopAsync(token).ConfigureAwait(false);
            if (_Stopping != null)
            {
                _Stopping.Cancel();
                try
                {
                    if (_ClusterLoop != null) await _ClusterLoop.ConfigureAwait(false);
                    if (_RetentionLoop != null) await _RetentionLoop.ConfigureAwait(false);
                }
                catch (OperationCanceledException)
                {
                }
                _Stopping.Dispose();
                _Stopping = null;
            }
            _Capture?.Dispose();
            _SettingsService?.Dispose();
        }

        #endregion
    }
}
