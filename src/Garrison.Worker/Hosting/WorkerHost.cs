namespace Garrison.Worker.Hosting
{
    using System;
    using System.Collections.Concurrent;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Linq;
    using System.Reflection;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Protocol;
    using Garrison.Core.Telemetry;
    using Garrison.Worker.Execution;
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

        #endregion

        #region Private-Members

        private readonly WorkerSettings _Settings;
        private readonly LoggingModule _Logging;
        private readonly NodeProtocolClient _Client;
        private readonly IRunExecutor _Executor;
        private readonly CapabilityProber _Prober;
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

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="settings">Settings.</param>
        /// <param name="logging">Logging.</param>
        /// <param name="executor">Executor; null creates a process executor.</param>
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
            _Executor = executor ?? new ProcessRunExecutor(options, message => _Logging.Debug(_Header + message));

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
                _Telemetry.Gauge("garrison.worker.runs.active", () => _Runs.Count, "{run}");
                _Telemetry.Gauge("garrison.worker.slots.free", () => _Slots.CurrentCount, "{slot}");
                if (_Telemetry.Active && _Telemetry.PrometheusHostname != null)
                {
                    _Logging.Info(_Header + "metrics listening on " + _Telemetry.PrometheusHostname + ":" + _Settings.Telemetry.PrometheusPort + _Settings.Telemetry.PrometheusPath);
                }
            }

            if (startHealthServer)
            {
                GarrisonTelemetry? telemetry = _Telemetry;
                Func<CancellationToken, Task<MetricsScrape?>>? metrics = null;
                if (telemetry != null && _Settings.Telemetry.ServeMetricsOnServicePort) metrics = token => telemetry.ScrapeAsync(token);
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
            _Telemetry?.Dispose();
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
                foreach (NodeCapabilityReport capability in _Capabilities)
                {
                    _Logging.Info(_Header + "harness " + capability.HarnessType + " (" + capability.Executable + "): " + (capability.Available ? "available " + capability.Version : "unavailable, " + capability.Detail));
                }

                await RegisterUntilSuccessAsync(token).ConfigureAwait(false);

                Task heartbeat = Task.Run(() => HeartbeatLoopAsync(token));
                Task lease = Task.Run(() => LeaseLoopAsync(token));
                Task probe = Task.Run(() => ProbeLoopAsync(token));
                await Task.WhenAll(heartbeat, lease, probe).ConfigureAwait(false);
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

            NodeRegisterResponse response = await _Client.RegisterAsync(request, token).ConfigureAwait(false);
            _NodeId = response.NodeId;
            if (response.HeartbeatIntervalMs > 0) _HeartbeatIntervalMs = Math.Clamp(response.HeartbeatIntervalMs, 500, 60000);
            if (response.LeaseWaitMs >= 0) _LeaseWaitMs = Math.Clamp(response.LeaseWaitMs, 0, 60000);
            Interlocked.Exchange(ref _Registered, 1);
            Interlocked.Exchange(ref _NeedsRegistration, 0);
            _LastError = null;
            _Logging.Info(_Header + "registered as " + request.Name + " (" + _NodeId + ") with capacity " + request.MaxConcurrentRuns);
        }

        private async Task HeartbeatLoopAsync(CancellationToken token)
        {
            int failures = 0;
            while (!token.IsCancellationRequested)
            {
                await Task.Delay(failures == 0 ? _HeartbeatIntervalMs : Backoff(failures), token).ConfigureAwait(false);
                try
                {
                    if (Volatile.Read(ref _NeedsRegistration) == 1) await RegisterAsync(token).ConfigureAwait(false);

                    NodeHeartbeatRequest request = new NodeHeartbeatRequest();
                    request.NodeId = _NodeId ?? String.Empty;
                    request.ActiveRuns = _Runs.Values.Select(r => new NodeRunLease { RunId = r.RunId, Epoch = r.Epoch }).ToList();
                    request.FreeCapacity = _Slots.CurrentCount;
                    request.Draining = Draining;
                    NodeHeartbeatResponse response = await _Client.HeartbeatAsync(request, token).ConfigureAwait(false);
                    failures = 0;
                    _LastError = null;

                    foreach (string runId in response.LostRunIds) await TransitionAsync(runId, true, token).ConfigureAwait(false);
                    foreach (string runId in response.CancelRunIds) await TransitionAsync(runId, false, token).ConfigureAwait(false);
                    if (response.Drain && !Draining)
                    {
                        _Logging.Info(_Header + "control plane requested drain");
                        _ = Task.Run(() => StopAsync(CancellationToken.None));
                    }
                }
                catch (NodeProtocolException e)
                {
                    failures++;
                    _LastError = e.Message;
                    if (e.StatusCode == 404 || e.StatusCode == 401 || e.StatusCode == 403)
                    {
                        Interlocked.Exchange(ref _NeedsRegistration, 1);
                        Interlocked.Exchange(ref _Registered, 0);
                    }
                    _Logging.Warn(_Header + "heartbeat failed: " + e.Message);
                }
            }
        }

        private async Task TransitionAsync(string runId, bool lost, CancellationToken token)
        {
            using (await _RunLocks.LockAsync(runId, token).ConfigureAwait(false))
            {
                if (!_Runs.TryGetValue(runId, out ActiveRun? run)) return;
                if (lost)
                {
                    _Logging.Warn(_Header + "lease for run " + runId + " was lost; killing the harness " + run.LogFields);
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
                            NodeLeaseResponse response = await _Client.LeaseAsync(request, leasing.Token).ConfigureAwait(false);
                            failures = 0;
                            RunAssignment? assignment = response.Assignments.FirstOrDefault();
                            _Telemetry?.Increment("garrison.worker.leases", new RadiantTag("result", assignment == null ? "empty" : "assigned"));
                            if (assignment == null) continue;
                            for (int i = 1; i < response.Assignments.Count; i++) _Logging.Warn(_Header + "ignoring extra assignment " + response.Assignments[i].RunId + " (requested one)");

                            started = Launch(assignment);
                        }
                        catch (NodeProtocolException e)
                        {
                            failures++;
                            _LastError = e.Message;
                            _Telemetry?.Increment("garrison.worker.leases", new RadiantTag("result", "error"));
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
            return true;
        }

        private async Task ExecuteAsync(ActiveRun run)
        {
            string nodeId = _NodeId ?? String.Empty;
            _Logging.Info(_Header + "executing run " + run.RunId + " (epoch " + run.Epoch + ", " + run.Assignment.Spec.HarnessType + ") " + run.LogFields);
            RunEventShipper shipper = new RunEventShipper(_Client, nodeId, run.RunId, run.Epoch, _Settings.EventBatchSize, _Settings.MaxBufferedEvents, _Settings.EventFlushIntervalMs,
                id =>
                {
                    _Logging.Warn(_Header + "control plane reports a stale lease for run " + id + "; killing the harness " + run.LogFields);
                    run.MarkLost();
                },
                message => _Logging.Debug(_Header + message + " " + run.LogFields),
                run.Assignment.EventSequenceStart);
            string harness = run.Assignment.Spec.HarnessType.ToString();
            bool retained = run.Assignment.Spec.RetainForRepair;
            bool lastSucceeded = false;
            try
            {
                RunAssignment current = run.Assignment;
                int repairAttempt = 0;
                while (true)
                {
                    RunCompleteRequest complete = await ExecuteOnceAsync(run, current, shipper, harness).ConfigureAwait(false);
                    lastSucceeded = complete.Status == RunStatusEnum.Succeeded;
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
                        complete.SupportsRepair = true;
                        response = await ReportCompletionAsync(run, complete, retry.Token).ConfigureAwait(false);
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
                if (retained)
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
            RecordRun(harness, complete, stopwatch.Elapsed.TotalSeconds);
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
                    _Telemetry?.Increment("garrison.worker.completion_reports", new RadiantTag("result", "accepted"));
                    return response;
                }
                catch (StaleLeaseException)
                {
                    _Logging.Warn(_Header + "completion for run " + runId + " rejected: stale lease " + run.LogFields);
                    _Telemetry?.Increment("garrison.worker.completion_reports", new RadiantTag("result", "stale"));
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
                        _Telemetry?.Increment("garrison.worker.completion_reports", new RadiantTag("result", "abandoned"));
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
                bool changed = latest.Count != _Capabilities.Count || latest.Where((c, i) => c.Available != _Capabilities[i].Available || c.Version != _Capabilities[i].Version).Any();
                _Capabilities = latest;
                if (changed)
                {
                    _Logging.Info(_Header + "harness capabilities changed; re-registering");
                    Interlocked.Exchange(ref _NeedsRegistration, 1);
                }
            }
        }

        private Activity? StartHarnessActivity(ActiveRun run, string harness)
        {
            ActivityContext parent = default(ActivityContext);
            string? traceParent = run.Assignment.Spec.TraceParent;
            if (!String.IsNullOrEmpty(traceParent)) ActivityContext.TryParse(traceParent, null, out parent);
            Activity? activity = _Activity.StartActivity("harness " + harness + " exec", ActivityKind.Internal, parent);
            if (activity != null)
            {
                activity.SetTag("garrison.run_id", run.RunId);
                activity.SetTag("garrison.harness", harness);
                activity.SetTag("garrison.lease_epoch", run.Epoch);
            }
            return activity;
        }

        private void RecordRun(string harness, RunCompleteRequest complete, double seconds)
        {
            if (_Telemetry == null) return;
            RadiantTag harnessTag = new RadiantTag("harness", harness);
            _Telemetry.Increment("garrison.worker.runs", harnessTag, new RadiantTag("outcome", complete.Outcome.ToString()));
            _Telemetry.Record("garrison.worker.run.duration", seconds, harnessTag);
            if (complete.InputTokens > 0) _Telemetry.Add("garrison.worker.harness.tokens", complete.InputTokens, harnessTag, new RadiantTag("direction", "input"));
            if (complete.OutputTokens > 0) _Telemetry.Add("garrison.worker.harness.tokens", complete.OutputTokens, harnessTag, new RadiantTag("direction", "output"));
            if (complete.CachedTokens > 0) _Telemetry.Add("garrison.worker.harness.tokens", complete.CachedTokens, harnessTag, new RadiantTag("direction", "cached"));
            if (complete.ReasoningTokens > 0) _Telemetry.Add("garrison.worker.harness.tokens", complete.ReasoningTokens, harnessTag, new RadiantTag("direction", "reasoning"));
            if (complete.TimeToFirstTokenMs.HasValue) _Telemetry.Record("garrison.worker.run.ttft", complete.TimeToFirstTokenMs.Value / 1000.0, harnessTag);
            if (complete.StreamingMs.HasValue) _Telemetry.Record("garrison.worker.run.streaming", complete.StreamingMs.Value / 1000.0, harnessTag);
            if (complete.CostUsd != null && complete.CostUsd.Value > 0) _Telemetry.Add("garrison.worker.harness.cost_usd", complete.CostUsd.Value, harnessTag);
        }

        private static int Backoff(int attempt)
        {
            int baseMs = Math.Min(30000, 500 * (1 << Math.Min(Math.Max(attempt, 0), 6)));
            return baseMs + Random.Shared.Next(0, Math.Max(1, baseMs / 4));
        }

        #endregion
    }
}
