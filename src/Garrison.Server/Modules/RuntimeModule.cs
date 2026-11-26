namespace Garrison.Server.Modules
{
    using System;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Enums;
    using Garrison.Core.Evaluation;
    using Garrison.Core.Manifests;
    using Garrison.Core.Memory;
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
        private CredentialBrokerService? _CredentialBroker = null;
        private ApprovalService? _Approvals = null;
        private PipelineService? _Pipelines = null;
        private ManifestService? _Manifests = null;
        private TriggerOptions? _TriggerOptions = null;
        private NotificationOptions? _NotificationOptions = null;
        private TriggerService? _Triggers = null;
        private NotificationService? _Notifications = null;
        private TranscriptOptions? _TranscriptOptions = null;
        private KeeperOptions? _KeeperOptions = null;
        private MandateService? _Mandates = null;
        private KeeperScheduler? _Keepers = null;
        private EscalationOptions? _EscalationOptions = null;
        private MemoryOptions? _MemoryOptions = null;
        private ReportOptions? _ReportOptions = null;
        private EvaluationOptions? _EvaluationOptions = null;
        private EvalRunner? _EvalRunner = null;
        private MessagingOptions? _MessagingOptions = null;
        private EscalationService? _Escalations = null;
        private FreezeService? _Freezes = null;

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
            ToolProbeCatalog toolProbes = new ToolProbeCatalog(context.Database);
            _Nodes.ToolProbes = toolProbes;
            _Runs.ToolProbes = toolProbes;
            context.Register(toolProbes);
            _Delegation = new DelegationPolicy(context.Database);
            _Invoker = new AgentInvoker(context.Database, _Runs, _Delegation, _Options);
            _Scheduler = new SchedulerService(context.Database, () => context.Get<InvocationCompiler>(), context.Authentication, _Signals, _Options, context.Telemetry, context.Logging);
            _Scheduler.ShutdownToken = context.Stopping;
            _Scheduler.Activity = context.Activity;
            _Conversations = new ConversationService(context.Database, _Options, _Signals);
            _Conversations.Logging = context.Logging;
            _Runs.Conversations = _Conversations;
            _Events.Conversations = _Conversations;
            context.Register(_Conversations);
            _Scheduler.Conversations = _Conversations;
            _Leases = context.Settings.Leases.Provider == LeaseProviderKindEnum.Database
                ? new DatabaseLeaseProvider(context.Database.CoordinationLeases)
                : new ClutchLeaseProvider(context.Database.CoordinationLeases, context.Settings.Leases);
            context.Register<ILeaseProvider>(_Leases);
            _Leader = new LeaderElectionService(context.Database, _Options, context.Logging, context.NodeId, _Leases);
            _Blocked = new BlockedRunService(context.Database);
            _Maintenance = new MaintenanceService(context.Database, _Leader, _Signals, _Options, context.Telemetry, context.Logging);
            _Maintenance.BlockedRuns = _Blocked;
            _CredentialBroker = new CredentialBrokerService(context.Database, context.Cipher, context.Settings.CredentialBroker);
            context.Register(_CredentialBroker);
            _Maintenance.CredentialBroker = _CredentialBroker;
            _Scheduler.CredentialBroker = _CredentialBroker;
            _Runs.CredentialBroker = _CredentialBroker;
            _Events.CredentialBroker = _CredentialBroker;
            _Approvals = new ApprovalService(context.Database, _Signals, context.Cipher, context.Audit, context.Logging);
            _Approvals.IsLeader = () => _Leader.IsLeader;
            ContinuationService continuations = new ContinuationService(context.Database, context.Get<ArtifactService>(), context.Settings.Rest.PublicBaseUrl ?? ExternalUrls.BindBaseUrl(context), _Signals);
            context.Register(continuations);
            continuations.OnSuspended = (run, epoch, ct) => _CredentialBroker.RevokeRunAsync(run.TenantId, run.Id, epoch, ct);
            _Approvals.Continuations = continuations;
            _Maintenance.Continuations = continuations;
            _Scheduler.Continuations = continuations;
            AgentAssetService assets = context.Get<AgentAssetService>();
            string assetBaseUrl = context.Settings.Rest.PublicBaseUrl ?? ExternalUrls.BindBaseUrl(context);
            FileSpaceService fileSpaces = context.Get<FileSpaceService>();
            _Maintenance.FileSpaces = fileSpaces;
            _Maintenance.Capabilities = context.TryGet<CapabilityService>();
            _Scheduler.DecorateSpec = async (run, spec, ct) =>
            {
                assets.ApplyDownloadUrls(run, spec, assetBaseUrl);
                await fileSpaces.ApplyAsync(run, spec, assetBaseUrl, ct).ConfigureAwait(false);
                // AA-027: a shadow run neither reads nor writes back a file space.
                if (ShadowRunPolicy.IsShadow(run)) spec.FileSpace = null;
                if (spec.FileSpace != null)
                {
                    spec.FileSpace.MaxFileBytes = context.Settings.FileSpaces.MaxFileBytes;
                    spec.FileSpace.MaxFiles = context.Settings.FileSpaces.MaxFiles;
                }
            };
            _StructuredOutput.DecorateSpec = _Scheduler.DecorateSpec;
            _Events.Continuations = continuations;
            FanOutService fanOuts = new FanOutService(context.Database, _Runs, _Invoker, _Delegation, _Options, context.Logging);
            fanOuts.Continuations = continuations;
            _Events.FanOuts = fanOuts;
            _Maintenance.FanOuts = fanOuts;
            context.Register(fanOuts);
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
            _KeeperOptions = new KeeperOptions();
            _Mandates = new MandateService(context.Database, context.Audit, _KeeperOptions);
            RunService runs = _Runs;
            _Mandates.CancelRunAsync = async (tenantId, runId, ct) =>
            {
                Run? tickRun = await context.Database.Runs.ReadAsync(tenantId, runId, ct).ConfigureAwait(false);
                if (tickRun != null && !RunService.IsTerminal(tickRun.Status)) await runs.CancelAsync(tickRun, ct).ConfigureAwait(false);
            };
            _Keepers = new KeeperScheduler(context.Database, _Runs, new RunAsAuthorization(context.Database, context.Authorization), _KeeperOptions, context.Logging);
            _Maintenance.Keepers = _Keepers;
            _Events.Keepers = _Keepers;
            _EscalationOptions = new EscalationOptions();
            _Escalations = new EscalationService(context.Database, context.Audit, _EscalationOptions, _Runs, new RunAsAuthorization(context.Database, context.Authorization), context.Logging);
            _Escalations.ResumeRunAsync = (tenantId, runId, ct) => continuations.ResumeAsync(tenantId, runId, ct);
            _Escalations.CancelRunAsync = async (tenantId, runId, ct) =>
            {
                Run? blocked = await context.Database.Runs.ReadAsync(tenantId, runId, ct).ConfigureAwait(false);
                if (blocked != null && !RunService.IsTerminal(blocked.Status)) await runs.CancelAsync(blocked, ct).ConfigureAwait(false);
            };
            continuations.Escalations = _Escalations;
            _Keepers.Escalations = _Escalations;
            _Maintenance.Escalations = _Escalations;
            _Freezes = new FreezeService(context.Database, context.Audit, context.Logging);
            _Freezes.Backplane = _Backplane;
            Func<Run, CancellationToken, Task> cancelRun = async (target, ct) =>
            {
                if (!RunService.IsTerminal(target.Status)) await runs.CancelAsync(target, ct).ConfigureAwait(false);
            };
            _Freezes.CancelRunAsync = cancelRun;
            _Runs.Freezes = _Freezes;
            _Keepers.Freezes = _Freezes;
            ChainOfCommand chain = new ChainOfCommand(context.Database);
            _MemoryOptions = new MemoryOptions();
            MemoryService memory = new MemoryService(context.Database, () => context.TryGet<IScopedMemoryStore>(), context.Audit, _MemoryOptions, context.Logging);
            if (context.Settings.AgentMemory.Enabled)
            {
                _Maintenance.Memory = memory;
                _Keepers.Memory = memory;
            }
            context.Register(_MemoryOptions);
            context.Register(memory);
            context.Register(new MemoryAccessPolicy(context.Database, chain));

            // AA5: reports filed upward; keeper ticks receive their subordinates' new reports through report-digest.
            _ReportOptions = new ReportOptions();
            ReportVisibility reportVisibility = new ReportVisibility(context.Database, chain);
            ReportService reports = new ReportService(context.Database, context.Audit, _ReportOptions, reportVisibility, context.Logging);
            reports.Chain = chain;
            _Keepers.Reports = reports;
            context.Register(_ReportOptions);
            context.Register(reportVisibility);
            context.Register(reports);

            // AA9: evaluation options and eval set versioning; the eval runner, shadow trials, and canary releases build
            // on them.
            _EvaluationOptions = new EvaluationOptions();
            context.Register(_EvaluationOptions);
            // AA9.7, AA9.8: shadow trials copy a source deployment's finished runs to a candidate as Shadow runs; canary
            // releases move deployment weights step by step. The leader sweeps both.
            ShadowTrialService shadowTrials = new ShadowTrialService(context, _Runs);
            CanaryService canaries = new CanaryService(context);
            _Events.ShadowTrials = shadowTrials;
            _Maintenance.ShadowTrials = shadowTrials;
            _Maintenance.Canaries = canaries;
            context.Register(shadowTrials);
            context.Register(canaries);
            EvalSetVersioning versioning = new EvalSetVersioning(context.Database);
            context.Register(versioning);
            // AA9.3 to AA9.6: eval sets, the leader's eval runner, eval runs, and promotion gates.
            LeaderElectionService leader = _Leader;
            _EvalRunner = new EvalRunner(context, _EvaluationOptions, () => leader.IsLeader, _Runs, _Signals, context.Logging);
            _Maintenance.Evaluations = _EvalRunner;
            context.Register(new EvalSetService(context, _EvaluationOptions, versioning, chain));
            context.Register(_EvalRunner);
            context.Register(new EvalRunService(context, _EvalRunner));
            context.Register(new EvalGateService(context, chain));

            // AA6: messages between agents; keeper ticks drain their inbox, urgent mail wakes the recipient, and
            // escalations to agents arrive as urgent messages.
            _MessagingOptions = new MessagingOptions();
            MessageLinePolicy messageLines = new MessageLinePolicy(context.Database, chain);
            MessageService messages = new MessageService(context.Database, context.Audit, _MessagingOptions, messageLines, _Runs, new RunAsAuthorization(context.Database, context.Authorization), context.Logging);
            messages.Freezes = _Freezes;
            _Keepers.Messages = messages;
            _Escalations.Messages = messages;
            _Maintenance.Messages = messages;
            context.Register(_MessagingOptions);
            context.Register(messageLines);
            context.Register(messages);

            // AA7: organizations and the chain of command every autonomy feature resolves managers, lines, and subtrees with.
            OrganizationService organizations = new OrganizationService(context.Database, context.Audit, _Mandates, chain);
            _Escalations.Chain = chain;
            _Freezes.Chain = chain;
            OrgBudgetGuard orgBudgets = new OrgBudgetGuard(context.Database, chain, organizations, context.Logging);
            orgBudgets.Escalations = _Escalations;
            _Runs.OrgBudgets = orgBudgets;
            _Keepers.OrgBudgets = orgBudgets;
            context.Register(orgBudgets);
            FreezeService freezes = _Freezes;
            organizations.ChangedAsync = (tenantId, organizationId, change, ct) =>
            {
                // Publishing, rolling back, or deleting moves agents in and out of organization freezes.
                if (change == "Published" || change == "RolledBack" || change == "Deleted")
                {
                    freezes.OrganizationChanged(tenantId);
                    orgBudgets.Invalidate();
                }
                return Task.CompletedTask;
            };
            organizations.DeleteMemoryScopeAsync = async (tenantId, kind, scopeId, ct) => await memory.DeleteScopeAsync(tenantId, kind, scopeId, ct).ConfigureAwait(false);
            // AA8: executives, change rules, and proposals. A rollback past an executive's apply applies its revert draft.
            organizations.ApplyRevertAsync = async (ctx, tenantId, draftId, ct) => await context.Get<Garrison.Server.Services.StudioService>().ApplyRevertAsync(ctx, tenantId, draftId, ct).ConfigureAwait(false);
            context.Register(chain);
            context.Register(organizations);
            context.Register(new ExecutiveAuthority(context, chain));
            context.Register(new ChangeRuleService(context, organizations));
            context.Register(new OrgProposalService(context));
            _Events.CancelOverBudgetAsync = cancelRun;
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
            context.Register(_KeeperOptions);
            context.Register(_Mandates);
            context.Register(_Keepers);
            context.Register(_EscalationOptions);
            context.Register(_Escalations);
            context.Register(_Freezes);
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
            new FanOutRoutes(context, context.Get<FanOutService>()).Register(routes);
            new AnalyticsRoutes(_Analytics!).Register(routes);
            new NodeProtocolRoutes(context, _Nodes!, _Scheduler!, _Events!).Register(routes);
            new NodeRoutes(context).Register(routes);
            new ControlNodeRoutes(context).Register(routes);
            new ApprovalRoutes(context, _Approvals!).Register(routes);
            new PipelineRoutes(context, _Pipelines!).Register(routes);
            new PipelineRunRoutes(context, _Pipelines!).Register(routes);
            new PipelineReviewRoutes(context, _Pipelines!).Register(routes);
            new TriggerRoutes(context, _Triggers!).Register(routes);
            new MandateRoutes(context, _Mandates!).Register(routes);
            new EscalationRoutes(context, _Escalations!).Register(routes);
            new FreezeRoutes(context, _Freezes!).Register(routes);
            new MemoryRoutes(context, context.Get<MemoryService>()).Register(routes);
            new ReportRoutes(context, context.Get<ReportService>()).Register(routes);
            new MessageRoutes(context, context.Get<MessageService>()).Register(routes);
            new OrganizationRoutes(context, context.Get<OrganizationService>()).Register(routes);
            new ChangeRuleRoutes(context, context.Get<ChangeRuleService>(), context.Get<OrgProposalService>()).Register(routes);
            new ShadowTrialRoutes(context.Get<ShadowTrialService>()).Register(routes);
            new CanaryRoutes(context.Get<CanaryService>()).Register(routes);
            new EvaluationRoutes(context, context.Get<EvalSetService>(), context.Get<EvalRunService>()).Register(routes);
            new NotificationEndpointRoutes(context, _Notifications!).Register(routes);
            new OverviewRoutes(context, _Blocked!).Register(routes);
            Garrison.Server.WebSockets.LiveUpdatesHandler live = new Garrison.Server.WebSockets.LiveUpdatesHandler(context, _Events!, _Blocked!);
            routes.WebSocket("/v1.0/ws", live.HandleAsync, "Live updates WebSocket: authenticates with a token, then authorizes each subscription (runs, run:{id}, pipeline-run:{id}, conversation-files:{id}, fan-out:{id}, studio-draft:{id}, mandate:{id}, agent-inbox:{agentId}, organization:{orgId}, eval-run:{id}, approvals, escalations, freezes, reports, nodes)", "Live updates");
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
            if (_Manifests != null && _Mandates != null) _Manifests.MandateRevisionBounds = _Mandates.ApplyBounds;
            if (_Manifests != null)
            {
                FreezeService? freezes = _Freezes;
                OrgBudgetGuard? budgets = context.TryGet<OrgBudgetGuard>();
                _Manifests.OrganizationPublishedAsync = (tenantId, organizationId, ct) =>
                {
                    freezes?.OrganizationChanged(tenantId);
                    budgets?.Invalidate();
                    return Task.CompletedTask;
                };
            }
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
            if (compiler != null) { compiler.SecretPreparer = _Codex; compiler.LeaseSecretPreparer = _CredentialBroker; }

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
            if (_EvalRunner != null) await _EvalRunner.StopAsync().ConfigureAwait(false);
            if (_Maintenance != null) await _Maintenance.StopAsync().ConfigureAwait(false);
            if (_Leader != null) await _Leader.StopAsync(token).ConfigureAwait(false);
            _Maintenance?.Dispose();
            _EvalRunner?.Dispose();
            _CredentialBroker?.Dispose();
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
            if (message.Kind == BackplaneMessageKindEnum.FreezesChanged) _Freezes?.Invalidate(message.Subject);
            _Signals?.ApplyRemote(message);
        }

        private void OnBackplaneResynchronized(object? sender, EventArgs e)
        {
            _Freezes?.InvalidateAll();
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
            _Options.MaxSynchronousWaiters = cluster.GetInt("Scheduling.MaxSynchronousWaiters");
            if (_Signals != null)
            {
                _Signals.Waiters.Fanout = cluster.GetInt("Scheduling.QueueWakeFanout");
                _Signals.Waiters.RemoteDelayMs = cluster.GetInt("Scheduling.RemoteWakeDelayMs");
            }
            _Options.QueueDepthCluster = cluster.GetInt("Runs.QueueDepthCluster");
            _Options.QueueDepthTenant = cluster.GetInt("Runs.QueueDepthTenant");
            _Options.QueueDepthAgent = cluster.GetInt("Runs.QueueDepthAgent");
            _Options.MaxDelegationDepth = cluster.GetInt("Runs.MaxDelegationDepth");
            _Options.DelegationChildQueueDepth = cluster.GetInt("Runs.DelegationChildQueueDepth");
            _Options.MaxFanOutWidth = cluster.GetInt("Delegation.MaxFanOutWidth");
            _Options.GatherResultCharLimit = cluster.GetInt("Delegation.GatherResultCharLimit");
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
            if (_KeeperOptions != null)
            {
                _KeeperOptions.SchedulerSweepSeconds = cluster.GetInt("Autonomy.SchedulerSweepSeconds");
                _KeeperOptions.MinIntervalSeconds = cluster.GetInt("Autonomy.MinIntervalSeconds");
                _KeeperOptions.MaxIntervalSeconds = cluster.GetInt("Autonomy.MaxIntervalSeconds");
                _KeeperOptions.DefaultJitterPercent = cluster.GetInt("Autonomy.DefaultJitterPercent");
                _KeeperOptions.MaxDueClaimsPerSweep = cluster.GetInt("Autonomy.MaxDueClaimsPerSweep");
                _KeeperOptions.TickHistoryRetentionDays = cluster.GetInt("Autonomy.TickHistoryRetentionDays");
                _KeeperOptions.TickInputRecentTicks = cluster.GetInt("Autonomy.TickInputRecentTicks");
            }
            if (_MemoryOptions != null)
            {
                _MemoryOptions.ScopedEnabled = cluster.GetBool("Memory.Scoped.Enabled");
                _MemoryOptions.MaxValueBytes = cluster.GetInt("Memory.Scoped.MaxValueBytes");
                _MemoryOptions.MaxEntriesPerScope = cluster.GetInt("Memory.Scoped.MaxEntriesPerScope");
            }
            if (_ReportOptions != null)
            {
                _ReportOptions.MaxBodyBytes = cluster.GetInt("Reports.MaxBodyBytes");
                _ReportOptions.DigestMaxReports = cluster.GetInt("Reports.DigestMaxReports");
            }
            if (_EvaluationOptions != null)
            {
                _EvaluationOptions.MaxConcurrentCases = cluster.GetInt("Evaluation.MaxConcurrentCases");
                _EvaluationOptions.MaxCasesPerSet = cluster.GetInt("Evaluation.MaxCasesPerSet");
            }
            if (_MessagingOptions != null)
            {
                _MessagingOptions.MaxHops = cluster.GetInt("Messaging.MaxHops");
                _MessagingOptions.LineRatePerMinute = cluster.GetInt("Messaging.LineRatePerMinute");
                _MessagingOptions.ThreadBudget = cluster.GetInt("Messaging.ThreadBudget");
                _MessagingOptions.UrgentWakesPerHour = cluster.GetInt("Messaging.UrgentWakesPerHour");
                _MessagingOptions.MaxMessagesPerDelivery = cluster.GetInt("Messaging.MaxMessagesPerDelivery");
                _MessagingOptions.MaxBodyBytes = cluster.GetInt("Messaging.MaxBodyBytes");
            }
            if (_EscalationOptions != null)
            {
                _EscalationOptions.DefaultTimeoutSeconds = cluster.GetInt("Escalations.DefaultTimeoutSeconds");
                _EscalationOptions.MaxQuestionBytes = cluster.GetInt("Escalations.MaxQuestionBytes");
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
