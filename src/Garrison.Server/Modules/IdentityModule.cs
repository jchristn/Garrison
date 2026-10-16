namespace Garrison.Server.Modules
{
    using System;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Server.Backplane;
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
        private ObservabilityService? _Observability = null;
        private RequestHistoryCaptureService? _Capture = null;
        private RetentionService? _Retention = null;
        private SettingsService? _SettingsService = null;
        private CancellationTokenSource? _Stopping = null;
        private Task? _ClusterLoop = null;
        private Task? _RetentionLoop = null;
        private IEventBackplane? _Backplane = null;
        private ServerContext? _Context = null;

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

            _Context = context;
            _Backplane = context.TryGet<IEventBackplane>();
            context.Authorization.Backplane = _Backplane;
            context.Authentication.Cache.Backplane = _Backplane;
            // Any identity, role, or permission change clears the authentication cache along with the grants, here and
            // (through PermissionsChanged) on every other replica (P10.24).
            context.Authorization.Invalidated += OnAuthorizationInvalidated;

            _Cluster = new ClusterSettingsService(context.Database, context.Settings.RequestHistory.Enabled, context.Settings.RequestHistory.RetentionDays);
            _Cluster.Backplane = _Backplane;
            await _Cluster.RefreshAsync(token).ConfigureAwait(false);
            context.Register(_Cluster);
            ApplyClusterSettings();
            _Cluster.Changed += OnClusterSettingsChanged;

            _Observability = new ObservabilityService(_Cluster);
            context.Register(_Observability);

            _SettingsService = new SettingsService(context.Settings, _Cluster, context.Logging);
            context.Register(_SettingsService);
            context.Register(new IdentityService(context.Database, context.Cipher, context.Audit, context.Authorization, () => context.Settings.Auth.PasswordHashIterations, () => context.Settings.Auth));

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
            new RoleRoutes(context, identity).Register(routes);
            new PermissionRoutes(context, identity).Register(routes);
            new AssignmentRoutes(context, identity).Register(routes);
            new AuditRoutes(context).Register(routes);
            new RequestHistoryRoutes(context, context.Get<RequestHistoryCaptureService>()).Register(routes);
            new SettingsRoutes(context, context.Get<SettingsService>()).Register(routes);
            new ServerInfoRoutes(context, context.Get<RequestHistoryCaptureService>()).Register(routes);
            new ObservabilityRoutes(context.Get<ObservabilityService>()).Register(routes);
        }

        /// <inheritdoc />
        public Task StartAsync(ServerContext context, CancellationToken token)
        {
            _Stopping = CancellationTokenSource.CreateLinkedTokenSource(token);
            if (_Backplane != null)
            {
                _Backplane.MessageReceived += OnBackplaneMessage;
                _Backplane.Resynchronized += OnBackplaneResynchronized;
            }
            _Capture!.Start();
            _ClusterLoop = Task.Run(() => _Cluster!.RunAsync(message => context.Logging.Warn("[Identity] " + message), _Stopping.Token));
            _RetentionLoop = Task.Run(() => _Retention!.RunAsync(_Stopping.Token));
            return Task.CompletedTask;
        }

        /// <inheritdoc />
        public async Task StopAsync(CancellationToken token)
        {
            if (_Cluster != null) _Cluster.Changed -= OnClusterSettingsChanged;
            if (_Context != null) _Context.Authorization.Invalidated -= OnAuthorizationInvalidated;
            if (_Backplane != null)
            {
                _Backplane.MessageReceived -= OnBackplaneMessage;
                _Backplane.Resynchronized -= OnBackplaneResynchronized;
            }
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
            _Observability?.Dispose();
        }

        #endregion

        #region Private-Methods

        private void OnBackplaneMessage(object? sender, BackplaneMessage message)
        {
            if (message.Kind == BackplaneMessageKindEnum.PermissionsChanged) _Context?.Authorization.InvalidateLocal();
            else if (message.Kind == BackplaneMessageKindEnum.SessionRevoked) _Context?.Authentication.Cache.InvalidateSessionLocal(message.Subject);
            else if (message.Kind == BackplaneMessageKindEnum.SettingsChanged) RefreshSettingsInBackground();
        }

        private void OnAuthorizationInvalidated(object? sender, EventArgs e)
        {
            _Context?.Authentication.Cache.ClearLocal();
        }

        private void OnClusterSettingsChanged(object? sender, EventArgs e)
        {
            ApplyClusterSettings();
        }

        private void ApplyClusterSettings()
        {
            if (_Cluster == null || _Context == null) return;
            _Context.Authentication.Cache.CacheSeconds = _Cluster.GetInt("Auth.CacheSeconds");
        }

        private void OnBackplaneResynchronized(object? sender, EventArgs e)
        {
            _Context?.Authorization.InvalidateLocal();
            RefreshSettingsInBackground();
        }

        private void RefreshSettingsInBackground()
        {
            ClusterSettingsService? cluster = _Cluster;
            CancellationToken token = _Stopping?.Token ?? CancellationToken.None;
            if (cluster == null) return;
            _ = Task.Run(async () =>
            {
                try
                {
                    await cluster.RefreshAsync(token).ConfigureAwait(false);
                }
                catch (Exception e) when (e is not OperationCanceledException)
                {
                    _Context?.Logging.Warn("[Identity] cluster settings refresh after a backplane message failed: " + e.Message);
                }
                catch (OperationCanceledException)
                {
                }
            });
        }

        #endregion
    }
}
