namespace Garrison.Server.Modules
{
    using System;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Enums;
    using Garrison.Core.Manifests;
    using Garrison.Core.Services;
    using Garrison.Server.Leases;
    using Garrison.Core.Models;
    using Garrison.Server.Backplane;
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
        private StructuredOutputService? _StructuredOutput = null;
        private RunAnalyticsService? _Analytics = null;
        private NodeService? _Nodes = null;
        private SchedulerService? _Scheduler = null;
        private ConversationService? _Conversations = null;
        private DelegationPolicy? _Delegation = null;
        private AgentInvoker? _Invoker = null;
        private ILeaseProvider? _Leases = null;
        private LeaderElectionService? _Leader = null;
        private MaintenanceService? _Maintenance = null;
        private BlockedRunService? _Blocked = null;
        private CancellationTokenSource? _SettingsCts = null;
        private Task? _SettingsLoop = null;
        private IEventBackplane? _Backplane = null;
        private ClusterSettingsService? _Cluster = null;
        private RunGaugeService? _Gauges = null;
        private CompilerOptions? _Compiler = null;
        private CodexCredentialService? _Codex = null;
        private ApprovalService? _Approvals = null;
        private PipelineService? _Pipelines = null;
        private ManifestService? _Manifests = null;
        private TriggerOptions? _TriggerOptions = null;
        private NotificationOptions? _NotificationOptions = null;
        private TriggerService? _Triggers = null;
        private NotificationService? _Notifications = null;
        private TranscriptOptions? _TranscriptOptions = null;

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public Task InitializeAsync(ServerContext context, CancellationToken token)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));

            _Options = new RuntimeOptions();
            _Compiler = context.TryGet<CompilerOptions>();
            _Signals = new RunSignals();
            _Backplane = context.TryGet<IEventBackplane>();
            _Signals.Backplane = _Backplane;
            _Runs = new RunService(context.Database, _Signals, _Options, context.Telemetry);
            _Events = new RunEventService(context.Database, _Signals, context.Telemetry);
            _StructuredOutput = new StructuredOutputService(context.Database, () => context.Get<InvocationCompiler>(), context.Authentication, _Options, context.Telemetry);
            _Events.StructuredOutput = _StructuredOutput;
            _Events.CostEstimation = new RunCostEstimationService(context.Database);
            _Runs.Logging = context.Logging;
            _Runs.ShutdownToken = context.Stopping;
            _Events.Logging = context.Logging;
            _Analytics = new RunAnalyticsService(context.Database);
            _Nodes = new NodeService(context.Database, _Options, context.Audit, _Signals);
            _Delegation = new DelegationPolicy(context.Database);
            _Invoker = new AgentInvoker(context.Database, _Runs, _Delegation, _Options);
            _Scheduler = new SchedulerService(context.Database, () => context.Get<InvocationCompiler>(), context.Authentication, _Signals, _Options, context.Telemetry, context.Logging);
            _Scheduler.ShutdownToken = context.Stopping;
            _Scheduler.Activity = context.Activity;
            _Conversations = new ConversationService(context.Database, _Options, _Signals);
            _Conversations.Logging = context.Logging;
            _Runs.Conversations = _Conversations;
            _Events.Conversations = _Conversations;
            _Scheduler.Conversations = _Conversations;
            _Leases = context.Settings.Leases.Provider == LeaseProviderKindEnum.Database
                ? new DatabaseLeaseProvider(context.Database.CoordinationLeases)
                : new ClutchLeaseProvider(context.Database.CoordinationLeases, context.Settings.Leases);
            context.Register<ILeaseProvider>(_Leases);
            _Leader = new LeaderElectionService(context.Database, _Options, context.Logging, context.NodeId, _Leases);
            _Blocked = new BlockedRunService(context.Database);
            _Maintenance = new MaintenanceService(context.Database, _Leader, _Signals, _Options, context.Telemetry, context.Logging);
            _Maintenance.BlockedRuns = _Blocked;
            _Approvals = new ApprovalService(context.Database, _Signals, context.Cipher, context.Audit, context.Logging);
            _Approvals.IsLeader = () => _Leader.IsLeader;
            _Runs.Approvals = _Approvals;
            _Events.Approvals = _Approvals;
            _Maintenance.Approvals = _Approvals;
            _Pipelines = new PipelineService(context.Database, _Runs, _Signals, _Options, () => context.Get<InvocationCompiler>(), context.Audit, context.Logging);
            _Pipelines.IsLeader = () => _Leader.IsLeader;
            _Scheduler.Pipelines = _Pipelines;
            _Maintenance.Pipelines = _Pipelines;
            _TriggerOptions = new TriggerOptions();
            _NotificationOptions = new NotificationOptions();
            _Triggers = new TriggerService(context.Database, _Runs, _Pipelines, context.Authorization, _TriggerOptions, context.Logging);
            _Notifications = new NotificationService(context.Database, context.Cipher, _NotificationOptions, () => ExternalUrls.RestBaseUrl(context, null), context.NodeId, context.Logging);
            _TranscriptOptions = new TranscriptOptions();
            context.Register(_TranscriptOptions);
            context.Register(new TranscriptService(context.Database, new RunRedactorFactory(context.Database, context.Cipher), _TranscriptOptions));
            _Maintenance.Triggers = _Triggers;
            _Maintenance.Notifications = _Notifications;
            if (context.Settings.Archive.Enabled)
            {
                _Maintenance.Archiver = new RunArchiver(context.Database, context.Settings.Archive.Directory!, context.Logging);
                context.Logging.Info("[Runtime] retention archives runs and events to " + context.Settings.Archive.Directory);
            }

            context.Register(_Options);
            context.Register(_Signals);
            context.Register(_Runs);
            context.Register(_Events);
            context.Register(_StructuredOutput);
            context.Register(_Analytics);
            context.Register(_Nodes);
            context.Register(_Delegation);
            context.Register(_Invoker);
            context.Register(_Scheduler);
            context.Register(_Conversations);
            context.Register<ILeaderState>(_Leader);
            context.Register(_Maintenance);
            context.Register(_Blocked);
            context.Register(_Approvals);
            context.Register(_Pipelines);
            context.Register(_TriggerOptions);
            context.Register(_NotificationOptions);
            context.Register(_Triggers);
            context.Register(_Notifications);
            _Gauges = new RunGaugeService(context.Database, context.Telemetry, context.Logging);
            context.Register(_Gauges);
            _Codex = new CodexCredentialService(context.Database, context.Cipher, () => context.Settings.Codex, context.NodeId, context.Logging, leaseProvider: _Leases);
            context.Register(_Codex);
            return Task.CompletedTask;
        }

        /// <inheritdoc />
        public void RegisterRoutes(ServerContext context, RouteRegistrar routes)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));
            if (routes == null) throw new ArgumentNullException(nameof(routes));
            new RunRoutes(context, _Runs!, _Events!, _Options!, _Signals!, _Invoker!, _Blocked!).Register(routes);
            new ConversationRoutes(context, _Conversations!, _Blocked!).Register(routes);
            new AnalyticsRoutes(_Analytics!).Register(routes);
            new NodeProtocolRoutes(context, _Nodes!, _Scheduler!, _Events!).Register(routes);
            new NodeRoutes(context).Register(routes);
            new ControlNodeRoutes(context).Register(routes);
            new ApprovalRoutes(context, _Approvals!).Register(routes);
            new PipelineRoutes(context, _Pipelines!).Register(routes);
            new PipelineRunRoutes(context, _Pipelines!).Register(routes);
            new PipelineReviewRoutes(context, _Pipelines!).Register(routes);
            new TriggerRoutes(context, _Triggers!).Register(routes);
            new NotificationEndpointRoutes(context, _Notifications!).Register(routes);
            new OverviewRoutes(context, _Blocked!).Register(routes);
            Garrison.Server.WebSockets.LiveUpdatesHandler live = new Garrison.Server.WebSockets.LiveUpdatesHandler(context, _Events!, _Blocked!);
            routes.WebSocket("/v1.0/ws", live.HandleAsync, "Live updates WebSocket: authenticates with a token, then authorizes each subscription (runs, run:{id}, pipeline-run:{id}, approvals, nodes)", "Live updates");
        }

        /// <inheritdoc />
        public Task StartAsync(ServerContext context, CancellationToken token)
        {
            if (_Backplane != null)
            {
                _Backplane.MessageReceived += OnBackplaneMessage;
                _Backplane.Resynchronized += OnBackplaneResynchronized;
            }

            _Manifests = context.TryGet<ManifestService>();
            ClusterSettingsService? cluster = context.TryGet<ClusterSettingsService>();
            if (cluster != null)
            {
                _Cluster = cluster;
                ApplyClusterSettings(cluster);
                cluster.Changed += OnClusterSettingsChanged;
                _Maintenance!.RunRetention = true;
                _Maintenance.RunRetentionDays = () => cluster.GetInt("Runs.RetentionDays");
                _Maintenance.EventRetentionDays = () => cluster.GetInt("Runs.EventRetentionDays");
                _SettingsCts = CancellationTokenSource.CreateLinkedTokenSource(token);
                _SettingsLoop = Task.Run(() => RefreshLoopAsync(cluster, _SettingsCts.Token));
            }

            RetentionService? retention = context.TryGet<RetentionService>();
            if (retention != null) retention.ShouldRun = () => _Leader!.IsLeader;

            // Pause tolerance (P3.16): the leader marks nothing while its own control node heartbeat is stale, and
            // heartbeats itself as soon as it notices a pause.
            ControlNodeService? controlNode = context.TryGet<ControlNodeService>();
            if (controlNode != null)
            {
                controlNode.PauseGraceMs = () => _Options!.PauseGraceMs;
                _Maintenance!.SelfHeartbeatUtc = () => controlNode.LastHeartbeatUtc;
                _Maintenance.HeartbeatSelfAsync = ct => controlNode.HeartbeatAsync(ct);
            }

            // G-22: runs that bind a CodexAuthJson secret get a login the control plane refreshed, and the leader keeps
            // idle logins from lapsing.
            InvocationCompiler? compiler = context.TryGet<InvocationCompiler>();
            if (compiler != null) compiler.SecretPreparer = _Codex;

            _Leader!.Start(token);
            _Maintenance!.Start(token);
            _Pipelines!.Start(token);
            _Notifications!.Start(token);
            _Codex!.Start(() => _Leader!.IsLeader, token);
            _Gauges?.Start(token);
            return Task.CompletedTask;
        }

        /// <inheritdoc />
        public async Task StopAsync(CancellationToken token)
        {
            if (_Backplane != null)
            {
                _Backplane.MessageReceived -= OnBackplaneMessage;
                _Backplane.Resynchronized -= OnBackplaneResynchronized;
            }
            if (_Cluster != null) _Cluster.Changed -= OnClusterSettingsChanged;
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
            if (_Codex != null) await _Codex.StopAsync().ConfigureAwait(false);
            _Codex?.Dispose();
            if (_Gauges != null) await _Gauges.StopAsync().ConfigureAwait(false);
            _Gauges?.Dispose();
            if (_Pipelines != null) await _Pipelines.StopAsync().ConfigureAwait(false);
            if (_Notifications != null) await _Notifications.StopAsync().ConfigureAwait(false);
            if (_Maintenance != null) await _Maintenance.StopAsync().ConfigureAwait(false);
            if (_Leader != null) await _Leader.StopAsync(token).ConfigureAwait(false);
            _Maintenance?.Dispose();
            _Approvals?.Dispose();
            _Pipelines?.Dispose();
            _Notifications?.Dispose();
            _Leader?.Dispose();
            _Signals?.Waiters.Dispose();
            if (_Leases is ClutchLeaseProvider clutch) await clutch.StopAsync(token).ConfigureAwait(false);
            if (_Leases is IDisposable disposable) disposable.Dispose();
        }

        #endregion

        #region Private-Methods

        private void OnBackplaneMessage(object? sender, BackplaneMessage message)
        {
            _Signals?.ApplyRemote(message);
        }

        private void OnBackplaneResynchronized(object? sender, EventArgs e)
        {
            _Signals?.SignalAll();
        }

        private void OnClusterSettingsChanged(object? sender, EventArgs e)
        {
            if (_Cluster != null) ApplyClusterSettings(_Cluster);
        }

        private void ApplyClusterSettings(ClusterSettingsService cluster)
        {
            if (_Options == null) return;
            _Options.LeaseDurationMs = cluster.GetInt("Scheduling.LeaseDurationMs");
            _Options.LeaseWaitMs = cluster.GetInt("Scheduling.LeaseWaitMs");
            _Options.NodeHeartbeatTimeoutMs = cluster.GetInt("Scheduling.NodeHeartbeatTimeoutMs");
            _Options.PauseGraceMs = cluster.GetInt("Scheduling.PauseGraceMs");
            _Options.EventPollMs = cluster.GetInt("Scheduling.EventPollMs");
            _Options.InvocationWaitPollMs = cluster.GetInt("Scheduling.InvocationWaitPollMs");
            if (_Signals != null)
            {
                _Signals.Waiters.Fanout = cluster.GetInt("Scheduling.QueueWakeFanout");
                _Signals.Waiters.RemoteDelayMs = cluster.GetInt("Scheduling.RemoteWakeDelayMs");
            }
            _Options.MaxDelegationDepth = cluster.GetInt("Runs.MaxDelegationDepth");
            _Options.DelegationChildQueueDepth = cluster.GetInt("Runs.DelegationChildQueueDepth");
            _Options.DelegationRetryAfterSeconds = cluster.GetInt("Runs.DelegationRetryAfterSeconds");
            _Options.FailBlockedAfterSeconds = cluster.GetInt("Runtime.FailBlockedAfterSeconds");
            _Options.MaxRunSeconds = cluster.GetInt("Runtime.MaxRunSeconds");
            _Options.ConversationAffinityWaitMs = cluster.GetInt("Runtime.ConversationAffinityWaitMs");
            _Options.ConversationTranscriptTurns = cluster.GetInt("Runtime.ConversationTranscriptTurns");
            _Options.ConversationTranscriptChars = cluster.GetInt("Runtime.ConversationTranscriptChars");
            _Options.PipelineSweepIntervalMs = cluster.GetInt("Runtime.PipelineSweepIntervalMs");
            _Options.PipelineMaxStages = cluster.GetInt("Runtime.PipelineMaxStages");
            if (_Manifests != null) _Manifests.MaxPipelineStages = _Options.PipelineMaxStages;
            if (_TriggerOptions != null)
            {
                _TriggerOptions.WebhookMaxBodyBytes = cluster.GetInt("Triggers.WebhookMaxBodyBytes");
                _TriggerOptions.WebhookToleranceSeconds = cluster.GetInt("Triggers.WebhookToleranceSeconds");
                _TriggerOptions.CronMaxLatenessSeconds = cluster.GetInt("Triggers.CronMaxLatenessSeconds");
                _TriggerOptions.FireRetentionDays = cluster.GetInt("Triggers.FireRetentionDays");
            }
            if (_NotificationOptions != null)
            {
                _NotificationOptions.AllowPrivateDestinations = cluster.GetBool("Notifications.AllowPrivateDestinations");
                _NotificationOptions.MaxAttempts = cluster.GetInt("Notifications.MaxAttempts");
                _NotificationOptions.InitialBackoffSeconds = cluster.GetInt("Notifications.InitialBackoffSeconds");
                _NotificationOptions.MaxBackoffSeconds = cluster.GetInt("Notifications.MaxBackoffSeconds");
                _NotificationOptions.TimeoutSeconds = cluster.GetInt("Notifications.TimeoutSeconds");
                _NotificationOptions.DispatchIntervalMs = cluster.GetInt("Notifications.DispatchIntervalMs");
                _NotificationOptions.SweepOverlapSeconds = cluster.GetInt("Notifications.SweepOverlapSeconds");
                _NotificationOptions.DeliveryRetentionDays = cluster.GetInt("Notifications.DeliveryRetentionDays");
                if (_Manifests != null) _Manifests.AllowPrivateNotificationDestinations = _NotificationOptions.AllowPrivateDestinations;
            }
            if (_TranscriptOptions != null)
            {
                _TranscriptOptions.MaxBytes = cluster.GetInt("Transcripts.MaxBytes");
                _TranscriptOptions.ToolTextMaxChars = cluster.GetInt("Transcripts.ToolTextMaxChars");
                _TranscriptOptions.MaxTurns = cluster.GetInt("Transcripts.MaxTurns");
            }
            if (_Compiler != null)
            {
                _Compiler.DefaultTimeoutSeconds = cluster.GetInt("Runs.DefaultTimeoutSeconds");
                _Compiler.MaxRunSeconds = cluster.GetInt("Runtime.MaxRunSeconds");
                _Compiler.RepetitionGuard = cluster.GetBool("Runtime.RepetitionGuard");
                _Compiler.MaxAssistantChars = cluster.GetInt("Runtime.MaxAssistantChars");
                _Compiler.NoProgressSeconds = cluster.GetInt("Runtime.NoProgressSeconds");
            }
            _Options.ControlNodeHeartbeatMs = cluster.GetInt("ControlPlane.HeartbeatIntervalMs");
            _Options.ControlNodeOfflineAfterMs = cluster.GetInt("ControlPlane.OfflineAfterMs");
            _Options.ControlNodeOfflineRetentionHours = cluster.GetInt("ControlPlane.OfflineRetentionHours");
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
