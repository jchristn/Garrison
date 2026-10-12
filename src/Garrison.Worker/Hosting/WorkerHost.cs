namespace Garrison.Worker.Hosting
{
    using System;
    using System.Collections.Concurrent;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.IO;
    using System.Linq;
    using System.Reflection;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Protocol;
    using Garrison.Core.Telemetry;
    using Garrison.Worker.Execution;
    using Garrison.Worker.Kubernetes;
    using Garrison.Worker.Protocol;
    using Garrison.Worker.Reporting;
    using Garrison.Worker.Settings;
    using Padlocks;
    using Radiant;
    using SyslogLogging;

    /// <summary>
    /// Worker node ("Post"): probes harness capabilities, registers with the control plane, heartbeats, leases runs up
    /// to its capacity, executes them, ships events, reports completion, honors cancellation and lost leases, and
    /// drains on shutdown. The worker never connects to anything but the control plane and what harnesses call.
    /// Thread-safe.
    /// </summary>
    public class WorkerHost : IAsyncDisposable
    {
        #region Public-Members

        /// <summary>
        /// Settings.
        /// </summary>
        public WorkerSettings Settings
        {
            get
            {
                return _Settings;
            }
        }

        /// <summary>
        /// Node identifier assigned at registration, or null.
        /// </summary>
        public string? NodeId
        {
            get
            {
                return _NodeId;
            }
        }

        /// <summary>
        /// Whether the worker is registered.
        /// </summary>
        public bool Registered
        {
            get
            {
                return Volatile.Read(ref _Registered) == 1;
            }
        }

        /// <summary>
        /// Whether the worker is draining.
        /// </summary>
        public bool Draining
        {
            get
            {
                return Volatile.Read(ref _Draining) == 1;
            }
        }

        /// <summary>
        /// Whether the lease loop is running.
        /// </summary>
        public bool Leasing
        {
            get
            {
                return Volatile.Read(ref _Leasing) == 1;
            }
        }

        /// <summary>
        /// Number of runs executing.
        /// </summary>
        public int ActiveRunCount
        {
            get
            {
                return _Runs.Count;
            }
        }

        /// <summary>
        /// Total runs completed since start.
        /// </summary>
        public long CompletedRuns
        {
            get
            {
                return Interlocked.Read(ref _CompletedRuns);
            }
        }

        /// <summary>
        /// Clock used by the heartbeat loop's pause detection. Default <see cref="TimeProvider.System"/>. Set it before
        /// <see cref="StartAsync"/>.
        /// </summary>
        /// <exception cref="ArgumentNullException">Thrown when set to null.</exception>
        public TimeProvider Clock
        {
            get
            {
                return _Pause.Clock;
            }
            set
            {
                if (value == null) throw new ArgumentNullException(nameof(value));
                _Pause = new PauseDetector(value);
            }
        }

        /// <summary>
        /// Pauses the heartbeat loop detected since the worker started.
        /// </summary>
        public long PausesDetected
        {
            get
            {
                return _Pause.PausesDetected;
            }
        }

        #endregion

        #region Private-Members

        private readonly WorkerSettings _Settings;
        private readonly LoggingModule _Logging;
        private readonly NodeProtocolClient _Client;
        private readonly IRunExecutor _Executor;
        private readonly ProcessRunExecutor _ConversationSweeper;
        private readonly CapabilityProber _Prober;
        private readonly KubernetesRuntime? _Kubernetes = null;
        private readonly KubernetesJobReconciler? _Reconciler = null;
        private readonly ConcurrentDictionary<string, ActiveRun> _Runs = new ConcurrentDictionary<string, ActiveRun>(StringComparer.Ordinal);
        private readonly ConcurrentDictionary<string, Task> _RunTasks = new ConcurrentDictionary<string, Task>(StringComparer.Ordinal);
        private readonly Padlock<string> _RunLocks = new Padlock<string>();
        private readonly CancellationTokenSource _Stop = new CancellationTokenSource();
        private readonly CancellationTokenSource _StopLeasing = new CancellationTokenSource();
        private readonly SemaphoreSlim _Slots;
        private readonly string _Header = "[Worker] ";
        private readonly ActivitySource _Activity = new ActivitySource("Garrison.Worker");
        private HealthServer? _Health = null;
        private GarrisonTelemetry? _Telemetry = null;
        private readonly List<GaugeRegistration> _Gauges = new List<GaugeRegistration>();
        private Task? _MainTask = null;
        private List<NodeCapabilityReport> _Capabilities = new List<NodeCapabilityReport>();
        private string? _NodeId = null;
        private string? _LastError = null;
        private int _HeartbeatIntervalMs;
        private int _LeaseWaitMs;
        private int _Registered = 0;
        private int _Draining = 0;
        private int _Leasing = 0;
        private int _NeedsRegistration = 1;
        private long _CompletedRuns = 0;
        private CancellationTokenSource? _WatchCall = null;
        private int _WatchWaitMs = 25000;
        private int _WatchIdlePollMs = 200;
        private int _PauseCheckMs = 1000;
        private PauseDetector _Pause = new PauseDetector(TimeProvider.System);

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="settings">Settings.</param>
        /// <param name="logging">Logging.</param>
        /// <param name="executor">Executor; null creates a process executor, routed together with a Kubernetes Job executor when Kubernetes.Enabled is set.</param>
        /// <param name="client">Protocol client; null creates one from settings.</param>
        /// <exception cref="ArgumentNullException">Thrown when settings or logging is null.</exception>
        public WorkerHost(WorkerSettings settings, LoggingModule logging, IRunExecutor? executor = null, NodeProtocolClient? client = null)
        {
            _Settings = settings ?? throw new ArgumentNullException(nameof(settings));
            _Logging = logging ?? throw new ArgumentNullException(nameof(logging));
            _Client = client ?? new NodeProtocolClient(settings.ServerUrl, settings.AccessKey, settings.SecretKey);

            ExecutorOptions options = new ExecutorOptions();
            options.WorkRoot = settings.WorkRoot;
            options.EnvironmentAllowlist = new List<string>(settings.EnvironmentAllowlist);
            options.McpPreflightTimeoutMs = settings.McpPreflightTimeoutMs;
            _ConversationSweeper = new ProcessRunExecutor(options, message => _Logging.Info(_Header + message));
            if (executor != null)
            {
                _Executor = executor;
            }
            else
            {
                ProcessRunExecutor process = new ProcessRunExecutor(options, message => _Logging.Debug(_Header + message));
                KubernetesJobRunExecutor? job = null;
                if (settings.Kubernetes.Enabled)
                {
                    _Kubernetes = new KubernetesRuntime(settings.Kubernetes, message => _Logging.Info(_Header + message));
                    _Reconciler = new KubernetesJobReconciler(_Kubernetes, settings.EffectiveNodeName, message => _Logging.Info(_Header + message));
                    job = new KubernetesJobRunExecutor(_Kubernetes, settings.EffectiveNodeName, new List<string>(settings.EnvironmentAllowlist), settings.McpPreflightTimeoutMs, message => _Logging.Debug(_Header + message));
                }
                _Executor = new RoutingRunExecutor(process, job);
            }

            _Prober = new CapabilityProber(settings);
            _Slots = new SemaphoreSlim(settings.MaxConcurrentRuns, settings.MaxConcurrentRuns);
            _HeartbeatIntervalMs = settings.HeartbeatIntervalMs;
            _LeaseWaitMs = settings.LeaseWaitMs;
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Start the health listener and the background loops. Returns immediately.
        /// </summary>
        /// <param name="startHealthServer">Whether to start the health listener.</param>
        /// <returns>Task.</returns>
        public Task StartAsync(bool startHealthServer = true)
        {
            if (_Settings.Telemetry.Enabled && _Telemetry == null)
            {
                _Telemetry = new GarrisonTelemetry(_Settings.Telemetry, _Settings.EffectiveNodeName, message =>
                {
                    if (message.StartsWith("telemetry", StringComparison.Ordinal)) _Logging.Warn(_Header + message);
                    else _Logging.Debug(_Header + message);
                });
                _Gauges.Add(GarrisonMetrics.RegisterGauge(GarrisonMetricCatalog.WorkerRunsActive, () => _Runs.Count));
                _Gauges.Add(GarrisonMetrics.RegisterGauge(GarrisonMetricCatalog.WorkerSlotsFree, () => _Slots.CurrentCount));
                if (_Telemetry.Active && _Telemetry.PrometheusHostname != null)
                {
                    _Logging.Info(_Header + "metrics listening on " + _Telemetry.PrometheusHostname + ":" + _Settings.Telemetry.PrometheusPort + _Settings.Telemetry.PrometheusPath);
                }
            }

            if (startHealthServer)
            {
                GarrisonTelemetry? telemetry = _Telemetry;
                Func<string?, CancellationToken, Task<MetricsScrape?>>? metrics = null;
                if (telemetry != null && _Settings.Telemetry.ServeMetricsOnServicePort) metrics = (accept, token) => telemetry.ScrapeAsync(accept, token);
                _Health = new HealthServer(_Settings.HealthHostname, _Settings.HealthPort, Health, metrics);
                _Health.Start();
                _Logging.Info(_Header + "health listening on " + _Settings.HealthHostname + ":" + _Settings.HealthPort + (metrics != null && telemetry!.PrometheusUrl != null ? " (also serving /metrics)" : String.Empty));
            }
            _MainTask = Task.Run(() => MainAsync(_Stop.Token));
            return Task.CompletedTask;
        }

        /// <summary>
        /// Health snapshot.
        /// </summary>
        /// <returns>Health.</returns>
        public WorkerHealth Health()
        {
            WorkerHealth health = new WorkerHealth();
            health.Registered = Registered;
            health.Draining = Draining;
            health.Ready = Registered && Leasing && !Draining;
            health.Status = Draining ? "draining" : (health.Ready ? "ready" : "not-ready");
            health.NodeName = _Settings.EffectiveNodeName;
            health.NodeId = _NodeId;
            health.ActiveRuns = _Runs.Count;
            health.MaxConcurrentRuns = _Settings.MaxConcurrentRuns;
            health.LastError = _LastError;
            health.Utc = DateTime.UtcNow;
            return health;
        }

        /// <summary>
        /// Drain: stop leasing, tell the control plane, wait for running runs up to the drain timeout, cancel the rest,
        /// and stop the loops.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task StopAsync(CancellationToken token = default)
        {
            if (Interlocked.Exchange(ref _Draining, 1) == 0)
            {
                _Logging.Info(_Header + "draining with " + _Runs.Count + " active run(s)");
                _StopLeasing.Cancel();
                if (_NodeId != null)
                {
                    try
                    {
                        await _Client.DrainAsync(_NodeId, token).ConfigureAwait(false);
                    }
                    catch (NodeProtocolException e)
                    {
                        _Logging.Debug(_Header + "drain notification failed: " + e.Message);
                    }
                }
            }

            Task all = Task.WhenAll(_RunTasks.Values.ToArray());
            Task drained = await Task.WhenAny(all, Task.Delay(TimeSpan.FromSeconds(_Settings.DrainTimeoutSeconds), token)).ConfigureAwait(false);
            if (drained != all)
            {
                _Logging.Warn(_Header + "drain timeout elapsed; cancelling " + _Runs.Count + " run(s)");
                foreach (ActiveRun run in _Runs.Values) run.Cancel();
                await Task.WhenAny(all, Task.Delay(TimeSpan.FromSeconds(30), CancellationToken.None)).ConfigureAwait(false);
            }

            _Stop.Cancel();
            if (_MainTask != null)
            {
                try
                {
                    await _MainTask.ConfigureAwait(false);
                }
                catch (OperationCanceledException)
                {
                }
            }
        }

        /// <summary>
        /// Dispose.
        /// </summary>
        /// <returns>Value task.</returns>
        public async ValueTask DisposeAsync()
        {
            if (!_Stop.IsCancellationRequested)
            {
                using (CancellationTokenSource timeout = new CancellationTokenSource(TimeSpan.FromSeconds(30)))
                {
                    await StopAsync(timeout.Token).ConfigureAwait(false);
                }
            }
            _Health?.Dispose();
            foreach (GaugeRegistration gauge in _Gauges) gauge.Dispose();
            _Gauges.Clear();
            _Telemetry?.Dispose();
            _Kubernetes?.Dispose();
            _Activity.Dispose();
            _Client.Dispose();
            _Stop.Dispose();
            _StopLeasing.Dispose();
            _Slots.Dispose();
            GC.SuppressFinalize(this);
        }

        #endregion

        #region Private-Methods

        private async Task MainAsync(CancellationToken token)
        {
            try
            {
                _Capabilities = await _Prober.ProbeAllAsync(token).ConfigureAwait(false);
                CountProbes(_Capabilities);
                foreach (NodeCapabilityReport capability in _Capabilities)
                {
                    _Logging.Info(_Header + "harness " + capability.HarnessType + " (" + capability.Executable + "): " + (capability.Available ? "available " + capability.Version : "unavailable, " + capability.Detail));
                }

                if (_Kubernetes != null) await _Kubernetes.InitializeAsync(_Settings.EffectiveNodeName, token).ConfigureAwait(false);

                await RegisterUntilSuccessAsync(token).ConfigureAwait(false);

                Task heartbeat = Task.Run(() => HeartbeatLoopAsync(token));
                Task lease = Task.Run(() => LeaseLoopAsync(token));
                Task probe = Task.Run(() => ProbeLoopAsync(token));
                Task watch = Task.Run(() => WatchLoopAsync(token));
                Task reconcile = Task.Run(() => ReconcileLoopAsync(token));
                Task sweep = Task.Run(() => ConversationSweepLoopAsync(token));
                await Task.WhenAll(heartbeat, lease, probe, watch, reconcile, sweep).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
            }
            catch (Exception e)
            {
                _Logging.Alert(_Header + "worker loop failed: " + e);
            }
        }

        private async Task RegisterUntilSuccessAsync(CancellationToken token)
        {
            int attempt = 0;
            while (!token.IsCancellationRequested)
            {
                try
                {
                    await RegisterAsync(token).ConfigureAwait(false);
                    return;
                }
                catch (NodeProtocolException e)
                {
                    _LastError = e.Message;
                    int delay = Backoff(attempt++);
                    _Logging.Warn(_Header + "registration failed (retrying in " + delay + " ms): " + e.Message);
                    await Task.Delay(delay, token).ConfigureAwait(false);
                }
            }
            token.ThrowIfCancellationRequested();
        }

        private async Task RegisterAsync(CancellationToken token)
        {
            NodeRegisterRequest request = new NodeRegisterRequest();
            request.Name = _Settings.EffectiveNodeName;
            request.Version = Assembly.GetExecutingAssembly().GetName().Version?.ToString();
            request.Address = Environment.MachineName;
            request.MaxConcurrentRuns = _Settings.MaxConcurrentRuns;
            request.NodePool = _Settings.NodePool;
            request.Labels = new Dictionary<string, string>(_Settings.Labels);
            foreach (KeyValuePair<string, string> label in _Prober.CapabilityLabels(_Capabilities)) request.Labels[label.Key] = label.Value;
            request.Capabilities = _Capabilities;
            request.Executors = Executors();

            NodeRegisterResponse response = await _Client.RegisterAsync(request, token).ConfigureAwait(false);
            _NodeId = response.NodeId;
            if (response.HeartbeatIntervalMs > 0) _HeartbeatIntervalMs = Math.Clamp(response.HeartbeatIntervalMs, 500, 60000);
            if (response.LeaseWaitMs >= 0) _LeaseWaitMs = Math.Clamp(response.LeaseWaitMs, 0, 60000);
            Interlocked.Exchange(ref _Registered, 1);
            Interlocked.Exchange(ref _NeedsRegistration, 0);
            _LastError = null;
            _Logging.Info(_Header + "registered as " + request.Name + " (" + _NodeId + ") with capacity " + request.MaxConcurrentRuns + " and executors " + String.Join(", ", request.Executors));
        }

        private async Task HeartbeatLoopAsync(CancellationToken token)
        {
            int failures = 0;
            _Pause.Touch();
            while (!token.IsCancellationRequested)
            {
                await WaitForHeartbeatAsync(failures == 0 ? _HeartbeatIntervalMs : Backoff(failures), token).ConfigureAwait(false);
                try
                {
                    if (Volatile.Read(ref _NeedsRegistration) == 1) await RegisterAsync(token).ConfigureAwait(false);

                    await GarrisonTracing.BackgroundAsync("worker", "heartbeat", HeartbeatOnceAsync, token).ConfigureAwait(false);
                    failures = 0;
                    _LastError = null;
                    GarrisonMetrics.Count(GarrisonMetricCatalog.WorkerHeartbeats, "result", "ok");
                }
                catch (NodeProtocolException e)
                {
                    failures++;
                    GarrisonMetrics.Count(GarrisonMetricCatalog.WorkerHeartbeats, "result", "error");
                    _LastError = e.Message;
                    if (e.StatusCode == 404 || e.StatusCode == 401 || e.StatusCode == 403)
                    {
                        Interlocked.Exchange(ref _NeedsRegistration, 1);
                        Interlocked.Exchange(ref _Registered, 0);
                    }
                    _Logging.Warn(_Header + "heartbeat failed: " + e.Message);
                }
                _Pause.Touch();
            }
        }

        private async Task<bool> HeartbeatOnceAsync(CancellationToken token)
        {
            NodeHeartbeatRequest request = new NodeHeartbeatRequest();
            request.NodeId = _NodeId ?? String.Empty;
            request.ActiveRuns = _Runs.Values.Select(r => new NodeRunLease { RunId = r.RunId, Epoch = r.Epoch }).ToList();
            request.FreeCapacity = _Slots.CurrentCount;
            request.Draining = Draining;
            NodeHeartbeatResponse response = await _Client.HeartbeatAsync(request, token).ConfigureAwait(false);

            foreach (string runId in response.LostRunIds) await TransitionAsync(runId, true, token).ConfigureAwait(false);
            foreach (string runId in response.CancelRunIds) await TransitionAsync(runId, false, token).ConfigureAwait(false);
            if (response.Drain && !Draining)
            {
                _Logging.Info(_Header + "control plane requested drain " + GarrisonTracing.LogFields("node", _Settings.EffectiveNodeName));
                _ = Task.Run(() => StopAsync(CancellationToken.None));
            }
            return response.LostRunIds.Count > 0 || response.CancelRunIds.Count > 0 || response.Drain;
        }

        private void CountProbes(List<NodeCapabilityReport> capabilities)
        {
            foreach (NodeCapabilityReport capability in capabilities)
            {
                GarrisonMetrics.Count(GarrisonMetricCatalog.WorkerProbes, "harness", capability.HarnessType.ToString(), "result", capability.Available ? "available" : "unavailable");
            }
        }

        private async Task WaitForHeartbeatAsync(int delayMs, CancellationToken token)
        {
            // Sleep in short slices and compare wall-clock time, so a pause (host sleep, frozen container or VM, clock
            // jump) is noticed on resume. Then heartbeat at once: the heartbeat renews every lease this worker holds
            // before the control plane's pause deferral ends (P3.16).
            int waited = 0;
            while (waited < delayMs)
            {
                int slice = Math.Min(_PauseCheckMs, delayMs - waited);
                await Task.Delay(slice, token).ConfigureAwait(false);
                waited += slice;
                TimeSpan paused = _Pause.Observe(slice, _Settings.PauseGraceMs);
                if (paused > TimeSpan.Zero)
                {
                    GarrisonMetrics.Count(GarrisonMetricCatalog.WorkerPauses);
                    _Logging.Warn(_Header + "worker was paused for " + Math.Round(paused.TotalSeconds, 1) + " s; heartbeating and renewing " + _Runs.Count + " leases now"
                        + " event=worker.pause pausedMs=" + (long)paused.TotalMilliseconds + " resumedUtc=" + _Pause.UtcNow.ToString("o") + " activeRuns=" + _Runs.Count);
                    return;
                }
            }
        }

        private string PauseContext()
        {
            DateTime? resumed = _Pause.LastResumedUtc;
            if (!resumed.HasValue) return String.Empty;
            TimeSpan since = _Pause.UtcNow - resumed.Value;
            if (since.TotalMinutes > 10) return String.Empty;
            return " (this worker resumed from a " + Math.Round(_Pause.LastPause.TotalSeconds, 1) + " s pause " + Math.Round(since.TotalSeconds, 1) + " s ago event=worker.stale_after_pause)";
        }

        private async Task WatchLoopAsync(CancellationToken token)
        {
            // Cancellation fast path: a long poll that returns as soon as a run held here is cancelled, so cancel reaches
            // the harness in well under a second instead of waiting for the next heartbeat (which stays the fallback).
            int failures = 0;
            while (!token.IsCancellationRequested)
            {
                try
                {
                    List<ActiveRun> watched = _Runs.Values.Where(r => !r.Lost && !r.Cancellation.IsCancellationRequested).ToList();
                    if (watched.Count == 0 || _NodeId == null || Volatile.Read(ref _NeedsRegistration) == 1)
                    {
                        await Task.Delay(_WatchIdlePollMs, token).ConfigureAwait(false);
                        continue;
                    }

                    NodeWatchRequest request = new NodeWatchRequest();
                    request.NodeId = _NodeId;
                    request.Runs = watched.Select(r => new NodeRunLease { RunId = r.RunId, Epoch = r.Epoch }).ToList();
                    request.WaitMs = _WatchWaitMs;
                    request.RelayApprovals = true;
                    request.KnownApprovals = watched.SelectMany(r => r.KnownApprovals).ToList();
                    using (CancellationTokenSource call = CancellationTokenSource.CreateLinkedTokenSource(token))
                    {
                        Interlocked.Exchange(ref _WatchCall, call);
                        try
                        {
                            NodeWatchResponse response = await _Client.WatchAsync(request, call.Token).ConfigureAwait(false);
                            failures = 0;
                            RecordApprovals(response.Approvals);
                            foreach (string runId in response.CancelRunIds) await TransitionAsync(runId, false, token).ConfigureAwait(false);
                        }
                        catch (OperationCanceledException) when (!token.IsCancellationRequested)
                        {
                            // A run was added or removed: watch again with the new set.
                        }
                        finally
                        {
                            Interlocked.CompareExchange(ref _WatchCall, null, call);
                        }
                    }
                }
                catch (NodeProtocolException e)
                {
                    failures++;
                    // 404: an older control plane without the watch, or the node must register again. The heartbeat still
                    // delivers cancellations, so back off for longer.
                    int delay = e.StatusCode == 404 ? 30000 : Backoff(failures);
                    _Logging.Debug(_Header + "cancellation watch failed: " + e.Message);
                    await Task.Delay(delay, token).ConfigureAwait(false);
                }
            }
        }

        private async Task CatchUpApprovalsAsync(ActiveRun run, RunAssignment assignment)
        {
            // A harness can finish moments after its last approval was decided, before the watch delivered the notice;
            // ask once more without waiting so the timeline is complete before the completion report (P12.3).
            ExecutionSpec spec = assignment.Spec ?? new ExecutionSpec();
            bool approvals = spec.ApprovalRelay != null || spec.McpPreflight.Any(c => c.RequiredTools.Contains(InvocationCompiler.PermissionPromptTool));
            if (!approvals || _NodeId == null || run.Lost) return;
            NodeWatchRequest request = new NodeWatchRequest();
            request.NodeId = _NodeId;
            request.Runs = new List<NodeRunLease> { new NodeRunLease { RunId = run.RunId, Epoch = run.Epoch } };
            request.WaitMs = 0;
            request.RelayApprovals = true;
            request.KnownApprovals = run.KnownApprovals;
            try
            {
                using (CancellationTokenSource timeout = new CancellationTokenSource(TimeSpan.FromSeconds(10)))
                {
                    NodeWatchResponse response = await _Client.WatchAsync(request, timeout.Token).ConfigureAwait(false);
                    RecordApprovals(response.Approvals);
                }
            }
            catch (Exception e) when (e is NodeProtocolException || e is OperationCanceledException || e is System.Net.Http.HttpRequestException)
            {
                _Logging.Debug(_Header + "could not read the final approvals of run " + run.RunId + ": " + e.Message + " " + run.LogFields);
            }
        }

        private void RecordApprovals(List<NodeApprovalNotice>? notices)
        {
            // Permission approvals (P12.3) of runs held here: record each state once in the run's event stream, so the
            // timeline shows when the harness started waiting and who decided.
            if (notices == null) return;
            foreach (NodeApprovalNotice notice in notices)
            {
                if (!_Runs.TryGetValue(notice.RunId, out ActiveRun? run)) continue;
                IRunReporter? reporter = run.Reporter;
                if (reporter == null || !run.AddApproval(notice.Key)) continue;
                RunEventReport report = new RunEventReport();
                report.EventType = RunEventTypeEnum.Lifecycle;
                report.Code = notice.EventCode;
                DateTime? at = notice.Status == ApprovalStatusEnum.Pending ? notice.RequestedUtc : notice.DecidedUtc;
                if (at.HasValue) report.TimestampUtc = at.Value;
                report.Text = notice.Describe();
                report.ToolName = notice.ToolName;
                report.RawEventJson = Garrison.Core.Serialization.Serializer.Serialize(notice);
                reporter.Emit(report);
                _Logging.Debug(_Header + "run " + notice.RunId + " " + report.Text + " " + run.LogFields);
            }
        }

        private void RestartWatch()
        {
            CancellationTokenSource? call = Volatile.Read(ref _WatchCall);
            if (call == null) return;
            try
            {
                call.Cancel();
            }
            catch (ObjectDisposedException)
            {
            }
        }

        private async Task TransitionAsync(string runId, bool lost, CancellationToken token)
        {
            using (await _RunLocks.LockAsync(runId, token).ConfigureAwait(false))
            {
                if (!_Runs.TryGetValue(runId, out ActiveRun? run)) return;
                if (lost)
                {
                    _Logging.Warn(_Header + "lease for run " + runId + " was lost; killing the harness" + PauseContext() + " " + run.LogFields);
                    run.MarkLost();
                }
                else
                {
                    _Logging.Info(_Header + "cancelling run " + runId + " at the control plane's request " + run.LogFields);
                    run.Cancel();
                }
            }
        }

        private async Task LeaseLoopAsync(CancellationToken token)
        {
            using (CancellationTokenSource leasing = CancellationTokenSource.CreateLinkedTokenSource(token, _StopLeasing.Token))
            {
                Interlocked.Exchange(ref _Leasing, 1);
                int failures = 0;
                try
                {
                    while (!leasing.IsCancellationRequested)
                    {
                        await _Slots.WaitAsync(leasing.Token).ConfigureAwait(false);
                        bool started = false;
                        try
                        {
                            if (Volatile.Read(ref _NeedsRegistration) == 1 || _NodeId == null)
                            {
                                await Task.Delay(1000, leasing.Token).ConfigureAwait(false);
                                continue;
                            }

                            NodeLeaseRequest request = new NodeLeaseRequest();
                            request.NodeId = _NodeId;
                            request.MaxRuns = 1;
                            request.WaitMs = _LeaseWaitMs;
                            NodeLeaseResponse response = new NodeLeaseResponse();
                            await GarrisonTracing.BackgroundAsync("worker", "lease", async ct =>
                            {
                                response = await _Client.LeaseAsync(request, ct).ConfigureAwait(false);
                                return response.Assignments.Count > 0;
                            }, leasing.Token).ConfigureAwait(false);
                            failures = 0;
                            RunAssignment? assignment = response.Assignments.FirstOrDefault();
                            GarrisonMetrics.Count(GarrisonMetricCatalog.WorkerLeases, "result", assignment == null ? "empty" : "assigned");
                            if (assignment == null) continue;
                            for (int i = 1; i < response.Assignments.Count; i++) _Logging.Warn(_Header + "ignoring extra assignment " + response.Assignments[i].RunId + " (requested one)");

                            started = Launch(assignment);
                        }
                        catch (NodeProtocolException e)
                        {
                            failures++;
                            _LastError = e.Message;
                            GarrisonMetrics.Count(GarrisonMetricCatalog.WorkerLeases, "result", "error");
                            if (e.StatusCode == 404 || e.StatusCode == 401 || e.StatusCode == 403) Interlocked.Exchange(ref _NeedsRegistration, 1);
                            _Logging.Warn(_Header + "lease failed: " + e.Message);
                            await Task.Delay(Backoff(failures), leasing.Token).ConfigureAwait(false);
                        }
                        finally
                        {
                            if (!started) _Slots.Release();
                        }
                    }
                }
                catch (OperationCanceledException)
                {
                }
                finally
                {
                    Interlocked.Exchange(ref _Leasing, 0);
                }
            }
        }

        private bool Launch(RunAssignment assignment)
        {
            ActiveRun run = new ActiveRun(assignment);
            if (!_Runs.TryAdd(run.RunId, run))
            {
                _Logging.Warn(_Header + "run " + run.RunId + " is already active; ignoring duplicate assignment " + run.LogFields);
                run.Dispose();
                return false;
            }
            Task task = Task.Run(() => ExecuteAsync(run));
            _RunTasks[run.RunId] = task;
            RestartWatch();
            return true;
        }

        private async Task ExecuteAsync(ActiveRun run)
        {
            string nodeId = _NodeId ?? String.Empty;
            _Logging.Info(_Header + "executing run " + run.RunId + " (epoch " + run.Epoch + ", " + run.Assignment.Spec.HarnessType + ") " + run.LogFields);
            RunEventShipper shipper = new RunEventShipper(_Client, nodeId, run.RunId, run.Epoch, _Settings.EventBatchSize, _Settings.MaxBufferedEvents, _Settings.EventFlushIntervalMs,
                id =>
                {
                    _Logging.Warn(_Header + "control plane reports a stale lease for run " + id + "; killing the harness" + PauseContext() + " " + run.LogFields);
                    run.MarkLost();
                },
                message => _Logging.Debug(_Header + message + " " + run.LogFields),
                run.Assignment.EventSequenceStart);
            run.Reporter = shipper;
            string harness = run.Assignment.Spec.HarnessType.ToString();
            bool retained = run.Assignment.Spec.RetainForRepair;
            bool lastSucceeded = false;
            bool launched = false;
            try
            {
                // Start gate (P10.20): nothing is launched until the control plane has moved the run to Running at this
                // lease epoch. A run cancelled while waiting is reported Cancelled without launching; a run whose start
                // is refused (stale) or cannot be acknowledged before its lease expires is abandoned, and the control
                // plane requeues it knowing it never started.
                bool cancelledBeforeStart = false;
                try
                {
                    if (!await shipper.AcknowledgeStartAsync(run.Assignment.LeaseExpiresUtc, run.Cancellation.Token).ConfigureAwait(false))
                    {
                        _Logging.Warn(_Header + "run " + run.RunId + " was not started: the control plane " + (shipper.Stale ? "reports the lease as stale" : "did not acknowledge the start before the lease expired")
                            + "; leaving it to the control plane" + PauseContext() + " " + run.LogFields);
                        return;
                    }
                }
                catch (OperationCanceledException) when (run.Cancellation.IsCancellationRequested)
                {
                    cancelledBeforeStart = true;
                }

                RunAssignment current = run.Assignment;
                int repairAttempt = 0;
                while (true)
                {
                    RunCompleteRequest complete;
                    if (cancelledBeforeStart)
                    {
                        complete = new RunCompleteRequest();
                        complete.Status = RunStatusEnum.Cancelled;
                        complete.Outcome = RunOutcomeEnum.Cancelled;
                        complete.ErrorMessage = "Run was cancelled before it started.";
                        complete.CompletedUtc = DateTime.UtcNow;
                    }
                    else
                    {
                        launched = true;
                        complete = await ExecuteOnceAsync(run, current, shipper, harness).ConfigureAwait(false);
                        await CatchUpApprovalsAsync(run, current).ConfigureAwait(false);
                    }
                    lastSucceeded = complete.Status == RunStatusEnum.Succeeded;
                    if (complete.Outcome == RunOutcomeEnum.NodeLost && current.Spec.Executor == RunExecutorEnum.KubernetesJob)
                    {
                        // The run pod was stopped from outside: do not report, so the lease expires and the control plane
                        // requeues or fails the run under the deployment's retryOnNodeLoss, exactly as for a lost worker.
                        using (CancellationTokenSource flush = new CancellationTokenSource(TimeSpan.FromSeconds(30)))
                        {
                            try
                            {
                                await shipper.FlushAsync(flush.Token).ConfigureAwait(false);
                            }
                            catch (OperationCanceledException)
                            {
                            }
                        }
                        _Logging.Warn(_Header + "run pod of run " + run.RunId + " was lost (" + complete.ErrorMessage + "); leaving the lease to expire " + run.LogFields);
                        return;
                    }
                    RunCompleteResponse? response;

                    using (CancellationTokenSource retry = new CancellationTokenSource(TimeSpan.FromSeconds(_Settings.CompletionRetrySeconds)))
                    {
                        try
                        {
                            await shipper.FlushAsync(retry.Token).ConfigureAwait(false);
                        }
                        catch (OperationCanceledException)
                        {
                            _Logging.Warn(_Header + "gave up delivering events for run " + run.RunId + " " + run.LogFields);
                        }

                        if (run.Lost || shipper.Stale)
                        {
                            _Logging.Info(_Header + "run " + run.RunId + " lost its lease; not reporting completion " + run.LogFields);
                            return;
                        }

                        complete.NodeId = nodeId;
                        complete.Epoch = run.Epoch;
                        complete.RepairAttempt = repairAttempt;
                        // Repairs resume the harness session in the run's directories, which only Process runs keep.
                        complete.SupportsRepair = current.Spec.Executor == RunExecutorEnum.Process;
                        long reportStart = Stopwatch.GetTimestamp();
                        using (Activity? report = StartRunActivity(run, "run:report"))
                        {
                            response = await ReportCompletionAsync(run, complete, retry.Token).ConfigureAwait(false);
                            if (response != null) GarrisonTracing.Ok(report);
                            else GarrisonTracing.Fail(report, "completion not accepted");
                        }
                        GarrisonMetrics.Observe(GarrisonMetricCatalog.WorkerRunStage, GarrisonMetrics.SecondsSince(reportStart), "stage", "report", "harness", harness, "agent", run.Assignment.Spec.AgentName);
                    }

                    if (response == null || response.Repair == null || response.RepairAttempt <= repairAttempt) return;
                    if (run.Lost || run.Cancellation.IsCancellationRequested)
                    {
                        _Logging.Info(_Header + "run " + run.RunId + " was cancelled or lost before its structured output repair " + run.LogFields);
                        return;
                    }

                    repairAttempt = response.RepairAttempt;
                    _Logging.Info(_Header + "run " + run.RunId + " output failed schema validation; running repair attempt " + repairAttempt + " " + run.LogFields);
                    shipper.AdvanceSequence(response.EventSequenceStart);
                    RunAssignment repair = new RunAssignment();
                    repair.RunId = run.RunId;
                    repair.Epoch = run.Epoch;
                    repair.LeaseExpiresUtc = current.LeaseExpiresUtc;
                    repair.EventSequenceStart = response.EventSequenceStart;
                    repair.Spec = response.Repair;
                    current = repair;
                }
            }
            finally
            {
                if (retained && launched)
                {
                    try
                    {
                        _Executor.Release(run.Assignment, lastSucceeded);
                    }
                    catch (Exception e)
                    {
                        _Logging.Warn(_Header + "releasing the directories of run " + run.RunId + " failed: " + e.Message + " " + run.LogFields);
                    }
                }
                await shipper.DisposeAsync().ConfigureAwait(false);
                using (await _RunLocks.LockAsync(run.RunId, CancellationToken.None).ConfigureAwait(false))
                {
                    _Runs.TryRemove(run.RunId, out ActiveRun? _);
                    _RunTasks.TryRemove(run.RunId, out Task? _);
                }
                run.Dispose();
                Interlocked.Increment(ref _CompletedRuns);
                _Slots.Release();
            }
        }

        private async Task<RunCompleteRequest> ExecuteOnceAsync(ActiveRun run, RunAssignment assignment, RunEventShipper shipper, string harness)
        {
            RunCompleteRequest complete;
            Stopwatch stopwatch = Stopwatch.StartNew();
            using (Activity? activity = StartHarnessActivity(run, harness))
            {
                if (activity != null && assignment.Spec.RepairAttempt > 0) activity.SetTag("garrison.repair_attempt", assignment.Spec.RepairAttempt);
                try
                {
                    complete = await _Executor.ExecuteAsync(assignment, shipper, run.Cancellation.Token).ConfigureAwait(false);
                }
                catch (Exception e)
                {
                    complete = new RunCompleteRequest();
                    complete.Status = RunStatusEnum.Failed;
                    complete.Outcome = RunOutcomeEnum.InternalError;
                    complete.ErrorMessage = "Executor failed: " + e.Message;
                }

                if (activity != null)
                {
                    activity.SetTag("garrison.outcome", complete.Outcome.ToString());
                    if (complete.ExitCode != null) activity.SetTag("process.exit_code", complete.ExitCode.Value);
                    activity.SetStatus(complete.Status == RunStatusEnum.Succeeded ? ActivityStatusCode.Ok : ActivityStatusCode.Error, complete.ErrorMessage);
                }
            }
            stopwatch.Stop();
            RecordRun(assignment.Spec, complete, stopwatch.Elapsed.TotalSeconds);
            GarrisonMetrics.Observe(GarrisonMetricCatalog.WorkerRunStage, stopwatch.Elapsed.TotalSeconds, "stage", "execution", "harness", harness, "agent", assignment.Spec.AgentName);
            return complete;
        }

        private async Task<RunCompleteResponse?> ReportCompletionAsync(ActiveRun run, RunCompleteRequest complete, CancellationToken token)
        {
            string runId = run.RunId;
            int attempt = 0;
            while (true)
            {
                try
                {
                    RunCompleteResponse response = await _Client.CompleteAsync(runId, complete, token).ConfigureAwait(false);
                    _Logging.Info(_Header + "run " + runId + " completed: " + complete.Status + " (" + complete.Outcome + ")" + (response?.Repair != null ? "; repair requested" : String.Empty) + " " + run.LogFields);
                    GarrisonMetrics.Count(GarrisonMetricCatalog.WorkerCompletionReports, "result", "accepted");
                    return response;
                }
                catch (StaleLeaseException)
                {
                    _Logging.Warn(_Header + "completion for run " + runId + " rejected: stale lease" + PauseContext() + " " + run.LogFields);
                    GarrisonMetrics.Count(GarrisonMetricCatalog.WorkerCompletionReports, "result", "stale");
                    return null;
                }
                catch (NodeProtocolException e)
                {
                    _Logging.Warn(_Header + "completion report for run " + runId + " failed (retrying): " + e.Message + " " + run.LogFields);
                    try
                    {
                        await Task.Delay(Backoff(attempt++), token).ConfigureAwait(false);
                    }
                    catch (OperationCanceledException)
                    {
                        _Logging.Alert(_Header + "gave up reporting completion for run " + runId + " " + run.LogFields);
                        GarrisonMetrics.Count(GarrisonMetricCatalog.WorkerCompletionReports, "result", "abandoned");
                        return null;
                    }
                }
            }
        }

        private async Task ProbeLoopAsync(CancellationToken token)
        {
            if (_Settings.ProbeIntervalSeconds <= 0) return;
            while (!token.IsCancellationRequested)
            {
                await Task.Delay(TimeSpan.FromSeconds(_Settings.ProbeIntervalSeconds), token).ConfigureAwait(false);
                List<NodeCapabilityReport> latest = await _Prober.ProbeAllAsync(token).ConfigureAwait(false);
                CountProbes(latest);
                bool changed = latest.Count != _Capabilities.Count || latest.Where((c, i) => c.Available != _Capabilities[i].Available || c.Version != _Capabilities[i].Version).Any();
                if (_Kubernetes != null)
                {
                    bool before = _Kubernetes.Available;
                    await _Kubernetes.InitializeAsync(_Settings.EffectiveNodeName, token).ConfigureAwait(false);
                    if (before != _Kubernetes.Available) changed = true;
                }
                _Capabilities = latest;
                if (changed)
                {
                    _Logging.Info(_Header + "harness capabilities changed; re-registering");
                    Interlocked.Exchange(ref _NeedsRegistration, 1);
                }
            }
        }

        private List<RunExecutorEnum> Executors()
        {
            List<RunExecutorEnum> executors = new List<RunExecutorEnum> { RunExecutorEnum.Process };
            if (_Kubernetes != null && _Kubernetes.Available) executors.Add(RunExecutorEnum.KubernetesJob);
            return executors;
        }

        private async Task ReconcileLoopAsync(CancellationToken token)
        {
            // Deletes this worker's run Jobs for runs it does not hold: right after start (everything from before a
            // restart is orphaned) and then periodically (P11.7).
            if (_Kubernetes == null || _Reconciler == null) return;
            while (!token.IsCancellationRequested)
            {
                if (_Kubernetes.Available)
                {
                    int deleted = await _Reconciler.ReconcileAsync(() => new HashSet<string>(_Runs.Values.Select(r => KubernetesJobReconciler.Key(r.RunId, r.Epoch)), StringComparer.Ordinal), token).ConfigureAwait(false);
                    if (deleted > 0) GarrisonMetrics.Count(GarrisonMetricCatalog.K8sReconciled, deleted, GarrisonMetrics.Tags("result", "deleted"));
                }
                await Task.Delay(TimeSpan.FromSeconds(_Settings.Kubernetes.ReconcileIntervalSeconds), token).ConfigureAwait(false);
            }
        }

        private async Task ConversationSweepLoopAsync(CancellationToken token)
        {
            // Conversation directories outlive their turns so the next turn can resume the harness session (P12.1);
            // the ones nobody used for ConversationRetentionHours are removed here.
            if (_Settings.ConversationRetentionHours <= 0) return;
            while (!token.IsCancellationRequested)
            {
                try
                {
                    HashSet<string> active = new HashSet<string>(
                        _Runs.Values.Select(r => r.Assignment.Spec.Conversation?.ConversationId).Where(id => !String.IsNullOrEmpty(id)).Select(id => id!),
                        StringComparer.Ordinal);
                    int deleted = _ConversationSweeper.SweepConversations(TimeSpan.FromHours(_Settings.ConversationRetentionHours), active);
                    if (deleted > 0) GarrisonMetrics.Count(GarrisonMetricCatalog.WorkerConversationsSwept, deleted, new TagList());
                }
                catch (Exception e) when (e is IOException || e is UnauthorizedAccessException)
                {
                    _Logging.Warn(_Header + "conversation sweep failed: " + e.Message);
                }
                await Task.Delay(TimeSpan.FromSeconds(_Settings.ConversationSweepIntervalSeconds), token).ConfigureAwait(false);
            }
        }

        private Activity? StartHarnessActivity(ActiveRun run, string harness)
        {
            Activity? activity = StartRunActivity(run, "harness " + harness + " exec");
            if (activity != null)
            {
                activity.SetTag("garrison.harness", harness);
                activity.SetTag("garrison.lease_epoch", run.Epoch);
            }
            return activity;
        }

        private Activity? StartRunActivity(ActiveRun run, string name)
        {
            // Worker spans join the run's trace from the traceparent shipped in the execution spec, so the server's
            // create, claim, and compile spans and the worker's spans form one trace (P13.25).
            ActivityContext parent = default(ActivityContext);
            string? traceParent = run.Assignment.Spec.TraceParent;
            if (!String.IsNullOrEmpty(traceParent)) ActivityContext.TryParse(traceParent, null, out parent);
            Activity? activity = _Activity.StartActivity(name, ActivityKind.Internal, parent);
            if (activity != null)
            {
                activity.SetTag("garrison.run_id", run.RunId);
                activity.SetTag("garrison.agent", run.Assignment.Spec.AgentName);
                activity.SetTag("garrison.tenant", run.Assignment.Spec.TenantId);
                activity.SetTag("garrison.node", _Settings.EffectiveNodeName);
            }
            return activity;
        }

        private static void RecordRun(ExecutionSpec spec, RunCompleteRequest complete, double seconds)
        {
            RunMetricLabels labels = RunMetricLabels.For(spec, complete.ServedModel);
            GarrisonMetrics.Count(GarrisonMetricCatalog.WorkerRuns, 1, GarrisonMetrics.RunTags(labels, "outcome", complete.Outcome.ToString()));
            GarrisonMetrics.Observe(GarrisonMetricCatalog.WorkerRunDuration, seconds, GarrisonMetrics.RunTags(labels));
            WorkerTokens(labels, "input", complete.InputTokens);
            WorkerTokens(labels, "output", complete.OutputTokens);
            WorkerTokens(labels, "cached", complete.CachedTokens);
            WorkerTokens(labels, "reasoning", complete.ReasoningTokens);
            if (complete.TimeToFirstTokenMs.HasValue) GarrisonMetrics.Observe(GarrisonMetricCatalog.WorkerRunTtft, complete.TimeToFirstTokenMs.Value / 1000.0, GarrisonMetrics.RunTags(labels));
            if (complete.StreamingMs.HasValue) GarrisonMetrics.Observe(GarrisonMetricCatalog.WorkerRunStreaming, complete.StreamingMs.Value / 1000.0, GarrisonMetrics.RunTags(labels));
            if (complete.CostUsd != null && complete.CostUsd.Value > 0) GarrisonMetrics.Count(GarrisonMetricCatalog.WorkerCost, complete.CostUsd.Value, GarrisonMetrics.RunTags(labels));
            string? guard = RunMetricLabels.Guard(complete.Outcome);
            if (guard != null) GarrisonMetrics.Count(GarrisonMetricCatalog.WorkerGuardTrips, "guard", guard, "harness", labels.Harness, "agent", labels.Agent);
        }

        private static void WorkerTokens(RunMetricLabels labels, string direction, long tokens)
        {
            if (tokens <= 0) return;
            GarrisonMetrics.Count(GarrisonMetricCatalog.WorkerTokens, tokens, GarrisonMetrics.RunTags(labels, "direction", direction));
        }

        private static int Backoff(int attempt)
        {
            int baseMs = Math.Min(30000, 500 * (1 << Math.Min(Math.Max(attempt, 0), 6)));
            return baseMs + Random.Shared.Next(0, Math.Max(1, baseMs / 4));
        }

        #endregion
    }
}
