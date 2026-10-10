namespace Garrison.Server.Modules
{
    using System;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Server.Routes;
    using Garrison.Server.Runtime;
    using Garrison.Server.Services;

    /// <summary>
    /// Runtime: runs, scheduling, leasing, node protocol, nodes, events, leader election, and maintenance.
    /// </summary>
    public class RuntimeModule : IServerModule
    {
        #region Public-Members

        /// <inheritdoc />
        public string Name
        {
            get
            {
                return "RuntimeModule";
            }
        }

        #endregion

        #region Private-Members

        private RuntimeOptions? _Options = null;
        private RunSignals? _Signals = null;
        private RunService? _Runs = null;
        private RunEventService? _Events = null;
        private NodeService? _Nodes = null;
        private SchedulerService? _Scheduler = null;
        private DelegationPolicy? _Delegation = null;
        private AgentInvoker? _Invoker = null;
        private LeaderElectionService? _Leader = null;
        private MaintenanceService? _Maintenance = null;
        private CancellationTokenSource? _SettingsCts = null;
        private Task? _SettingsLoop = null;

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public Task InitializeAsync(ServerContext context, CancellationToken token)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));

            _Options = new RuntimeOptions();
            _Signals = new RunSignals();
            _Runs = new RunService(context.Database, _Signals, _Options, context.Telemetry);
            _Events = new RunEventService(context.Database, _Signals, context.Telemetry);
            _Nodes = new NodeService(context.Database, _Options, context.Audit);
            _Delegation = new DelegationPolicy(context.Database);
            _Invoker = new AgentInvoker(context.Database, _Runs, _Delegation);
            _Scheduler = new SchedulerService(context.Database, () => context.Get<InvocationCompiler>(), context.Authentication, _Signals, _Options, context.Telemetry, context.Logging);
            _Leader = new LeaderElectionService(context.Database, _Options, context.Logging, context.NodeId);
            _Maintenance = new MaintenanceService(context.Database, _Leader, _Signals, _Options, context.Telemetry, context.Logging);

            context.Register(_Options);
            context.Register(_Signals);
            context.Register(_Runs);
            context.Register(_Events);
            context.Register(_Nodes);
            context.Register(_Delegation);
            context.Register(_Invoker);
            context.Register(_Scheduler);
            context.Register<ILeaderState>(_Leader);
            context.Register(_Maintenance);
            return Task.CompletedTask;
        }

        /// <inheritdoc />
        public void RegisterRoutes(ServerContext context, RouteRegistrar routes)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));
            if (routes == null) throw new ArgumentNullException(nameof(routes));
            new RunRoutes(context, _Runs!, _Events!, _Options!, _Signals!, _Invoker!).Register(routes);
            new NodeProtocolRoutes(context, _Nodes!, _Scheduler!, _Events!).Register(routes);
            new NodeRoutes(context).Register(routes);
            new OverviewRoutes(context).Register(routes);
            WatsonWebserver.Webserver server = context.Get<WatsonWebserver.Webserver>();
            Garrison.Server.WebSockets.LiveUpdatesHandler live = new Garrison.Server.WebSockets.LiveUpdatesHandler(context, _Events!);
            server.WebSocket("/v1.0/ws", live.HandleAsync);
        }

        /// <inheritdoc />
        public Task StartAsync(ServerContext context, CancellationToken token)
        {
            ClusterSettingsService? cluster = context.TryGet<ClusterSettingsService>();
            if (cluster != null)
            {
                ApplyClusterSettings(cluster);
                _Maintenance!.RunRetention = true;
                _Maintenance.RunRetentionDays = () => cluster.GetInt("Runs.RetentionDays");
                _Maintenance.EventRetentionDays = () => cluster.GetInt("Runs.EventRetentionDays");
                _SettingsCts = CancellationTokenSource.CreateLinkedTokenSource(token);
                _SettingsLoop = Task.Run(() => RefreshLoopAsync(cluster, _SettingsCts.Token));
            }

            RetentionService? retention = context.TryGet<RetentionService>();
            if (retention != null) retention.ShouldRun = () => _Leader!.IsLeader;

            _Leader!.Start(token);
            _Maintenance!.Start(token);
            return Task.CompletedTask;
        }

        /// <inheritdoc />
        public async Task StopAsync(CancellationToken token)
        {
            _SettingsCts?.Cancel();
            if (_SettingsLoop != null)
            {
                try
                {
                    await _SettingsLoop.ConfigureAwait(false);
                }
                catch (OperationCanceledException)
                {
                }
            }
            _SettingsCts?.Dispose();
            if (_Maintenance != null) await _Maintenance.StopAsync().ConfigureAwait(false);
            if (_Leader != null) await _Leader.StopAsync(token).ConfigureAwait(false);
            _Maintenance?.Dispose();
            _Leader?.Dispose();
        }

        #endregion

        #region Private-Methods

        private void ApplyClusterSettings(ClusterSettingsService cluster)
        {
            if (_Options == null) return;
            _Options.LeaseDurationMs = cluster.GetInt("Scheduling.LeaseDurationMs");
            _Options.LeaseWaitMs = cluster.GetInt("Scheduling.LeaseWaitMs");
            _Options.NodeHeartbeatTimeoutMs = cluster.GetInt("Scheduling.NodeHeartbeatTimeoutMs");
            _Options.EventPollMs = cluster.GetInt("Scheduling.EventPollMs");
            _Options.MaxDelegationDepth = cluster.GetInt("Runs.MaxDelegationDepth");
        }

        private async Task RefreshLoopAsync(ClusterSettingsService cluster, CancellationToken token)
        {
            long version = cluster.Version;
            while (!token.IsCancellationRequested)
            {
                await Task.Delay(2000, token).ConfigureAwait(false);
                if (cluster.Version == version) continue;
                version = cluster.Version;
                ApplyClusterSettings(cluster);
            }
        }

        #endregion
    }
}
