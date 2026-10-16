namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Concurrent;
    using System.Collections.Generic;
    using System.Diagnostics.Metrics;
    using System.Linq;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Serialization;
    using Garrison.Core.Telemetry;
    using Radiant;
    using SyslogLogging;

    /// <summary>
    /// Leader-only maintenance: reclaims runs whose lease expired (requeue or fail with NodeLost), enforces run
    /// deadlines as a backstop, marks silent nodes Lost (plan section 9.4) and silent control-plane replicas Offline
    /// (P10.19), explains queued runs that no Ready
    /// worker can run (one Warning run event per reason, and an optional failure after
    /// <see cref="RuntimeOptions.FailBlockedAfterSeconds"/>), applies run and event retention (archiving first when an
    /// <see cref="Archiver"/> is set), and deletes expired shared state (signed-request nonces, rate limit buckets, MCP
    /// sessions, old backplane messages, and old Offline control nodes). Tolerates pauses (P3.16): when a tick comes more
    /// than <see cref="RuntimeOptions.MaintenanceIntervalMs"/> plus <see cref="RuntimeOptions.PauseGraceMs"/> after the
    /// previous one, or a pass stalls for more than <see cref="RuntimeOptions.PauseGraceMs"/> between steps, it logs a
    /// Warning and skips lease expiry, deadline enforcement, Lost and Offline marking, and blocked-run failures until
    /// <see cref="RuntimeOptions.PauseDeferralMs"/> has passed since the resume and this replica has heartbeated its own
    /// control node row again. Runs whose worker re-confirmed its lease after the pause get their deadline moved by the
    /// paused time. Thread-safe.
    /// </summary>
    public class MaintenanceService : IDisposable
    {
        #region Public-Members

        /// <summary>Revocable credential provider, or null when disabled.</summary>
        public CredentialBrokerService? CredentialBroker { get; set; } = null;


        /// <summary>
        /// Whether finished runs and old events are pruned. Default false until the runtime module wires cluster settings.
        /// </summary>
        public bool RunRetention { get; set; } = false;

        /// <summary>
        /// Days to keep finished runs.
        /// </summary>
        public Func<int> RunRetentionDays { get; set; } = () => 30;

        /// <summary>
        /// Days to keep run events.
        /// </summary>
        public Func<int> EventRetentionDays { get; set; } = () => 14;

        /// <summary>
        /// Interval between retention passes in milliseconds. Minimum 60000, maximum 86400000, default 3600000.
        /// </summary>
        public int RetentionIntervalMs
        {
            get
            {
                return _RetentionIntervalMs;
            }
            set
            {
                _RetentionIntervalMs = Math.Clamp(value, 60000, 86400000);
            }
        }

        /// <summary>
        /// Archiver for runs and events removed by retention. Null (the default) deletes without archiving.
        /// </summary>
        public RunArchiver? Archiver { get; set; } = null;

        /// <summary>
        /// Interval between cleanups of expired shared state, in milliseconds. Minimum 1000, maximum 3600000, default
        /// 60000.
        /// </summary>
        public int CleanupIntervalMs
        {
            get
            {
                return _CleanupIntervalMs;
            }
            set
            {
                _CleanupIntervalMs = Math.Clamp(value, 1000, 3600000);
            }
        }

        /// <summary>
        /// Minutes polling backplane messages are kept. Minimum 1, maximum 1440, default 5.
        /// </summary>
        public int BackplaneRetentionMinutes
        {
            get
            {
                return _BackplaneRetentionMinutes;
            }
            set
            {
                _BackplaneRetentionMinutes = Math.Clamp(value, 1, 1440);
            }
        }

        /// <summary>
        /// Maintenance passes this replica ran as the leader since it started.
        /// </summary>
        public long LeaderPasses
        {
            get
            {
                return Interlocked.Read(ref _LeaderPasses);
            }
        }

        /// <summary>
        /// Blocked-run evaluator. When null (the default), blocked queued runs are not explained or failed.
        /// </summary>
        public BlockedRunService? BlockedRuns { get; set; } = null;

        /// <summary>
        /// Permission approvals (P12.3); pending approvals of runs that stop here are cancelled. Null (the default)
        /// leaves them to the leader's sweep.
        /// </summary>
        public ApprovalService? Approvals { get; set; } = null;

        /// <summary>Durable continuation wake-ups, including missed child-completion signals.</summary>
        public ContinuationService? Continuations { get; set; } = null;

        /// <summary>
        /// Pipeline service (P12.9). When set, the leader sweeps pipeline runs every
        /// <see cref="RuntimeOptions.PipelineSweepIntervalMs"/>, and retention also removes finished pipeline runs and skips
        /// stage runs of active pipeline runs. Default null.
        /// </summary>
        public PipelineService? Pipelines { get; set; } = null;

        /// <summary>
        /// Trigger service (P12.5). When set, the leader fires due cron triggers on every pass.
        /// </summary>
        public TriggerService? Triggers { get; set; } = null;

        /// <summary>
        /// Notification service (P12.14). When set, the leader queues notifications for new events on every pass.
        /// </summary>
        public NotificationService? Notifications { get; set; } = null;

        /// <summary>
        /// Interval between blocked-run passes in the leader loop, in milliseconds. Minimum 1000, maximum 300000, default
        /// 5000. <see cref="RunOnceAsync"/> always runs a pass.
        /// </summary>
        public int BlockedCheckIntervalMs
        {
            get
            {
                return _BlockedCheckIntervalMs;
            }
            set
            {
                _BlockedCheckIntervalMs = Math.Clamp(value, 1000, 300000);
            }
        }

        /// <summary>
        /// Clock used for every time comparison. Default <see cref="TimeProvider.System"/>; tests use a manual clock to
        /// simulate a pause. Setting it resets pause detection.
        /// </summary>
        /// <exception cref="ArgumentNullException">Thrown when set to null.</exception>
        public TimeProvider Clock
        {
            get
            {
                return _Clock;
            }
            set
            {
                _Clock = value ?? throw new ArgumentNullException(nameof(value));
                _Pause = new PauseDetector(_Clock);
            }
        }

        /// <summary>
        /// Returns the time of this replica's last successful control node heartbeat, or null when it has none. When set,
        /// the leader marks nothing while its own heartbeat is older than
        /// <see cref="RuntimeOptions.ControlNodeHeartbeatMs"/> plus <see cref="RuntimeOptions.PauseGraceMs"/>, or older
        /// than the last detected resume. Null (the default) skips this check; the runtime module wires
        /// <see cref="ControlNodeService.LastHeartbeatUtc"/>.
        /// </summary>
        public Func<DateTime?>? SelfHeartbeatUtc { get; set; } = null;

        /// <summary>
        /// Writes this replica's control node heartbeat now. Called when a pause is detected and when the leader finds its
        /// own heartbeat stale. Null (the default) does nothing; the runtime module wires
        /// <see cref="ControlNodeService.HeartbeatAsync"/>.
        /// </summary>
        public Func<CancellationToken, Task>? HeartbeatSelfAsync { get; set; } = null;

        /// <summary>
        /// End of the current pause deferral (UTC, from <see cref="Clock"/>), or null when no deferral is pending.
        /// </summary>
        public DateTime? DeferredUntilUtc
        {
            get
            {
                lock (_PauseLock)
                {
                    return _DeferUntilUtc;
                }
            }
        }

        /// <summary>
        /// Pauses this replica's maintenance loop detected since it started.
        /// </summary>
        public long PausesDetected
        {
            get
            {
                return Interlocked.Read(ref _PausesDetected);
            }
        }

        #endregion

        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly ILeaderState _Leader;
        private readonly RunSignals _Signals;
        private readonly RuntimeOptions _Options;
        private readonly GarrisonTelemetry _Telemetry;
        private readonly LoggingModule _Logging;
        private readonly string _Header = "[Maintenance] ";
        private CancellationTokenSource? _Cts = null;
        private Task? _Loop = null;
        private Dictionary<string, long> _BlockedByReason = new Dictionary<string, long>(StringComparer.Ordinal);
        private GaugeRegistration? _BlockedGauge = null;
        private bool _Disposed = false;
        private int _RetentionIntervalMs = 3600000;
        private DateTime _LastRetentionUtc = DateTime.MinValue;
        private int _BlockedCheckIntervalMs = 5000;
        private DateTime _LastBlockedCheckUtc = DateTime.MinValue;
        private int _CleanupIntervalMs = 60000;
        private int _BackplaneRetentionMinutes = 5;
        private DateTime _LastCleanupUtc = DateTime.MinValue;
        private DateTime _LastPipelineSweepUtc = DateTime.MinValue;
        private long _LeaderPasses = 0;
        private readonly SemaphoreSlim _BlockedLock = new SemaphoreSlim(1, 1);
        private readonly ConcurrentDictionary<string, BlockedRunState> _Blocked = new ConcurrentDictionary<string, BlockedRunState>(StringComparer.Ordinal);
        private readonly ConcurrentDictionary<string, TimeSpan> _PauseCredit = new ConcurrentDictionary<string, TimeSpan>(StringComparer.Ordinal);
        private readonly object _PauseLock = new object();
        private TimeProvider _Clock = TimeProvider.System;
        private PauseDetector _Pause = new PauseDetector(TimeProvider.System);
        private DateTime? _DeferUntilUtc = null;
        private DateTime? _PendingResumeUtc = null;
        private DateTime? _PendingPauseStartUtc = null;
        private TimeSpan _PendingPaused = TimeSpan.Zero;
        private long _PausesDetected = 0;
        private bool _DeferralLogged = false;
        private bool _SelfStaleWarned = false;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="leader">Leader state.</param>
        /// <param name="signals">Run signals.</param>
        /// <param name="options">Runtime options.</param>
        /// <param name="telemetry">Telemetry.</param>
        /// <param name="logging">Logging.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public MaintenanceService(DatabaseDriverBase database, ILeaderState leader, RunSignals signals, RuntimeOptions options, GarrisonTelemetry telemetry, LoggingModule logging)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Leader = leader ?? throw new ArgumentNullException(nameof(leader));
            _Signals = signals ?? throw new ArgumentNullException(nameof(signals));
            _Options = options ?? throw new ArgumentNullException(nameof(options));
            _Telemetry = telemetry ?? throw new ArgumentNullException(nameof(telemetry));
            _BlockedGauge = GarrisonMetrics.RegisterGauge(GarrisonMetricCatalog.RunsBlockedCurrent, ObserveBlocked);
            _Logging = logging ?? throw new ArgumentNullException(nameof(logging));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Start the loop.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        public void Start(CancellationToken token)
        {
            _Cts = CancellationTokenSource.CreateLinkedTokenSource(token);
            _Loop = Task.Run(() => LoopAsync(_Cts.Token));
        }

        /// <summary>
        /// Stop the loop.
        /// </summary>
        /// <returns>Task.</returns>
        public async Task StopAsync()
        {
            _Cts?.Cancel();
            if (_Loop == null) return;
            try
            {
                await _Loop.ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
            }
        }

        /// <summary>
        /// Run one maintenance tick as the leader, exactly as the background loop does: detect a pause since the previous
        /// tick, defer destructive transitions while a pause deferral is pending or this replica's own heartbeat is stale,
        /// then reap leases, enforce deadlines, mark Lost and Offline nodes, and check blocked runs. Used by tests that
        /// drive <see cref="Clock"/> by hand.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when destructive transitions were evaluated on this tick, false when they were deferred.</returns>
        public async Task<bool> RunTickAsync(CancellationToken token = default)
        {
            return await TickAsync(true, true, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Run one maintenance pass regardless of leadership and without pause detection or deferral. Used by tests.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task RunOnceAsync(CancellationToken token = default)
        {
            await ReapExpiredLeasesAsync(token).ConfigureAwait(false);
            if (CredentialBroker != null) await CredentialBroker.SweepAsync(token).ConfigureAwait(false);
            await EnforceDeadlinesAsync(token).ConfigureAwait(false);
            await MarkLostNodesAsync(token).ConfigureAwait(false);
            await MarkOfflineControlNodesAsync(token).ConfigureAwait(false);
            await CheckBlockedRunsAsync(token).ConfigureAwait(false);
            if (Approvals != null) await Approvals.SweepAsync(token).ConfigureAwait(false);
            if (Continuations != null) await Continuations.SweepAsync(token).ConfigureAwait(false);
        }

        /// <summary>
        /// Apply run, event, and finished pipeline run retention once, archiving runs and events first when an
        /// <see cref="Archiver"/> is set. Stage runs of active pipeline runs are kept. Used by the leader loop and by tests.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Runs, events, and pipeline runs removed.</returns>
        public async Task<int> ApplyRetentionAsync(CancellationToken token = default)
        {
            DateTime runCutoff = Now.AddDays(-Math.Max(1, RunRetentionDays()));
            DateTime eventCutoff = Now.AddDays(-Math.Max(1, EventRetentionDays()));
            int runs;
            int events;
            RunArchiver? archiver = Archiver;
            if (archiver != null)
            {
                runs = await archiver.ArchiveRunsAsync(runCutoff, token).ConfigureAwait(false);
                events = await archiver.ArchiveEventsAsync(eventCutoff, token).ConfigureAwait(false);
                if (runs + events > 0) _Logging.Info(_Header + "retention archived and removed " + runs + " runs and " + events + " events to " + archiver.Directory);
            }
            else
            {
                runs = await _Database.Runs.PruneFinishedAsync(runCutoff, token).ConfigureAwait(false);
                events = await _Database.RunEvents.PruneAsync(eventCutoff, token).ConfigureAwait(false);
                if (runs + events > 0) _Logging.Info(_Header + "retention pruned " + runs + " runs and " + events + " events");
            }
            // Finished pipeline runs follow the run retention; stage runs of active pipeline runs are never pruned (P12.9).
            int pipelineRuns = Pipelines != null ? Pruned("pipeline_runs", await _Database.PipelineRuns.PruneFinishedAsync(runCutoff, token).ConfigureAwait(false)) : 0;
            if (runs > 0) GarrisonMetrics.Count(GarrisonMetricCatalog.RetentionDeleted, runs, GarrisonMetrics.Tags("kind", "runs"));
            if (events > 0) GarrisonMetrics.Count(GarrisonMetricCatalog.RetentionDeleted, events, GarrisonMetrics.Tags("kind", "run_events"));
            return runs + events + pipelineRuns;
        }

        /// <summary>
        /// Delete expired signed-request nonces, rate limit buckets, and MCP sessions, old backplane messages, control
        /// node rows Offline for longer than <see cref="RuntimeOptions.ControlNodeOfflineRetentionHours"/>, and delegation
        /// wait records that no longer count (<see cref="RuntimeOptions.ChildWaitOrphanSeconds"/>). Used by the leader
        /// loop and by tests.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Rows deleted.</returns>
        public async Task<int> CleanupSharedStateAsync(CancellationToken token = default)
        {
            DateTime now = Now;
            int deleted = 0;
            deleted += Pruned("nonces", await _Database.Nonces.PruneExpiredAsync(now, token).ConfigureAwait(false));
            deleted += Pruned("rate_limit_buckets", await _Database.RateLimits.PruneExpiredAsync(now, token).ConfigureAwait(false));
            int sessions = Pruned("mcp_sessions", await _Database.McpSessions.PruneExpiredAsync(now, token).ConfigureAwait(false));
            if (sessions > 0) GarrisonMetrics.Count(GarrisonMetricCatalog.McpSessions, sessions, GarrisonMetrics.Tags("event", "expired"));
            deleted += sessions;
            deleted += Pruned("backplane_messages", await _Database.BackplaneMessages.PruneAsync(now.AddMinutes(-_BackplaneRetentionMinutes), token).ConfigureAwait(false));
            deleted += Pruned("control_nodes", await _Database.ControlNodes.DeleteOfflineAsync(now.AddHours(-_Options.ControlNodeOfflineRetentionHours), token).ConfigureAwait(false));
            // Delegation wait records (P12.38) whose parent or child finished, or whose child was never created.
            deleted += Pruned("run_child_waits", await _Database.Runs.PruneChildWaitsAsync(now.AddSeconds(-_Options.ChildWaitOrphanSeconds), token).ConfigureAwait(false));
            if (deleted > 0) _Logging.Debug(_Header + "cleanup removed " + deleted + " expired nonces, rate limit buckets, MCP sessions, backplane messages, old Offline control nodes, and finished delegation waits");
            return deleted;
        }

        /// <summary>
        /// Dispose.
        /// </summary>
        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        #endregion

        #region Protected-Methods

        /// <summary>
        /// Dispose pattern implementation.
        /// </summary>
        /// <param name="disposing">True when called from Dispose.</param>
        protected virtual void Dispose(bool disposing)
        {
            if (_Disposed) return;
            if (disposing)
            {
                _Cts?.Dispose();
                _BlockedLock.Dispose();
                _BlockedGauge?.Dispose();
            }
            _Disposed = true;
        }

        #endregion

        #region Private-Methods

        private DateTime Now
        {
            get
            {
                return _Clock.GetUtcNow().UtcDateTime;
            }
        }

        private async Task LoopAsync(CancellationToken token)
        {
            while (!token.IsCancellationRequested)
            {
                try
                {
                    await TickAsync(_Leader.IsLeader, false, token).ConfigureAwait(false);
                }
                catch (Exception e) when (e is not OperationCanceledException)
                {
                    _Logging.Warn(_Header + "pass failed: " + e.Message);
                }
                await Task.Delay(_Options.MaintenanceIntervalMs, token).ConfigureAwait(false);
            }
        }

        private async Task<bool> TickAsync(bool leader, bool forceBlockedCheck, CancellationToken token)
        {
            // Every replica watches for pauses, leader or not, so a replica that becomes leader just after a resume still
            // waits for the heartbeat window.
            TimeSpan paused = _Pause.Observe(_Options.MaintenanceIntervalMs, _Options.PauseGraceMs);
            if (paused > TimeSpan.Zero) await OnPauseAsync(paused, "tick", leader, token).ConfigureAwait(false);

            bool evaluated = false;
            try
            {
                if (!leader) return false;

                if (await DestructiveAllowedAsync(token).ConfigureAwait(false))
                {
                    evaluated = true;
                    // Each step is one background iteration with its own span and metrics (P13.24, P13.25).
                    if (await AwakeAsync(token).ConfigureAwait(false)) await GarrisonTracing.BackgroundAsync("maintenance", "reap_leases", ReapExpiredLeasesAsync, token).ConfigureAwait(false);
                    if (CredentialBroker != null && await AwakeAsync(token).ConfigureAwait(false)) await CredentialBroker.SweepAsync(token).ConfigureAwait(false);
                    if (await AwakeAsync(token).ConfigureAwait(false)) await GarrisonTracing.BackgroundAsync("maintenance", "enforce_deadlines", EnforceDeadlinesAsync, token).ConfigureAwait(false);
                    if (await AwakeAsync(token).ConfigureAwait(false)) await GarrisonTracing.BackgroundAsync("maintenance", "mark_lost_nodes", MarkLostNodesAsync, token).ConfigureAwait(false);
                    if (await AwakeAsync(token).ConfigureAwait(false)) await GarrisonTracing.BackgroundAsync("maintenance", "mark_offline_control_nodes", MarkOfflineControlNodesAsync, token).ConfigureAwait(false);
                    ApprovalService? approvals = Approvals;
                    if (approvals != null && await AwakeAsync(token).ConfigureAwait(false)) await GarrisonTracing.BackgroundAsync("maintenance", "approvals", approvals.SweepAsync, token).ConfigureAwait(false);
                    ContinuationService? continuations = Continuations;
                    if (continuations != null && await AwakeAsync(token).ConfigureAwait(false)) await GarrisonTracing.BackgroundAsync("maintenance", "continuations", continuations.SweepAsync, token).ConfigureAwait(false);
                    PipelineService? pipelines = Pipelines;
                    if (pipelines != null && (Now - _LastPipelineSweepUtc).TotalMilliseconds >= _Options.PipelineSweepIntervalMs && await AwakeAsync(token).ConfigureAwait(false))
                    {
                        _LastPipelineSweepUtc = Now;
                        try
                        {
                            await GarrisonTracing.BackgroundAsync("maintenance", "pipelines", pipelines.SweepAsync, token).ConfigureAwait(false);
                        }
                        finally
                        {
                            // The sweep can legitimately take a while (it is bounded by PipelineService.SweepBudgetMs); its
                            // own duration is work, not a pause, so it must not make the next step look paused.
                            _Pause.Touch();
                        }
                    }
                    TriggerService? triggers = Triggers;
                    if (triggers != null && await AwakeAsync(token).ConfigureAwait(false))
                    {
                        try
                        {
                            await GarrisonTracing.BackgroundAsync("maintenance", "triggers", triggers.SweepAsync, token).ConfigureAwait(false);
                        }
                        finally
                        {
                            // Firing creates runs; that work is not a pause.
                            _Pause.Touch();
                        }
                    }
                    NotificationService? notifications = Notifications;
                    if (notifications != null && await AwakeAsync(token).ConfigureAwait(false))
                    {
                        try
                        {
                            await GarrisonTracing.BackgroundAsync("maintenance", "notifications", notifications.SweepAsync, token).ConfigureAwait(false);
                        }
                        finally
                        {
                            _Pause.Touch();
                        }
                    }
                    if ((forceBlockedCheck || (Now - _LastBlockedCheckUtc).TotalMilliseconds >= _BlockedCheckIntervalMs) && await AwakeAsync(token).ConfigureAwait(false))
                    {
                        _LastBlockedCheckUtc = Now;
                        await GarrisonTracing.BackgroundAsync("maintenance", "blocked_runs", CheckBlockedRunsAsync, token).ConfigureAwait(false);
                    }
                }

                if (RunRetention && (Now - _LastRetentionUtc).TotalMilliseconds >= _RetentionIntervalMs)
                {
                    _LastRetentionUtc = Now;
                    await GarrisonTracing.BackgroundAsync("maintenance", "run_retention", async ct => await ApplyRetentionAsync(ct).ConfigureAwait(false) > 0, token).ConfigureAwait(false);
                }
                if ((Now - _LastCleanupUtc).TotalMilliseconds >= _CleanupIntervalMs)
                {
                    _LastCleanupUtc = Now;
                    await GarrisonTracing.BackgroundAsync("maintenance", "cleanup_shared_state", async ct => await CleanupSharedStateAsync(ct).ConfigureAwait(false) > 0, token).ConfigureAwait(false);
                }
                Interlocked.Increment(ref _LeaderPasses);
                return evaluated;
            }
            finally
            {
                // The pass's own duration does not count toward the next gap; only the sleep between passes does.
                _Pause.Touch();
            }
        }

        private IEnumerable<Measurement<double>> ObserveBlocked()
        {
            // Only the leader evaluates blocked runs, so only the leader reports them; aggregate with max.
            if (!_Leader.IsLeader) return Array.Empty<Measurement<double>>();
            Dictionary<string, long> counts = Volatile.Read(ref _BlockedByReason);
            List<Measurement<double>> measurements = new List<Measurement<double>>(counts.Count);
            foreach (KeyValuePair<string, long> pair in counts) measurements.Add(GarrisonMetrics.Measure(pair.Value, "reason", pair.Key));
            return measurements;
        }

        private static int Pruned(string kind, int count)
        {
            if (count > 0) GarrisonMetrics.Count(GarrisonMetricCatalog.RetentionDeleted, count, GarrisonMetrics.Tags("kind", kind));
            return count;
        }

        private async Task<bool> AwakeAsync(CancellationToken token)
        {
            // A pause can also land inside a pass (between two queries). Steps of one pass follow each other at once, so
            // more than the grace between them is a pause too.
            TimeSpan paused = _Pause.Observe(0, _Options.PauseGraceMs);
            if (paused <= TimeSpan.Zero) return true;
            await OnPauseAsync(paused, "pass", true, token).ConfigureAwait(false);
            return false;
        }

        private async Task OnPauseAsync(TimeSpan paused, string detectedIn, bool leader, CancellationToken token)
        {
            DateTime resumed = Now;
            DateTime deferUntil = resumed.AddMilliseconds(_Options.PauseDeferralMs);
            lock (_PauseLock)
            {
                _PendingPauseStartUtc = resumed - paused;
                _PendingResumeUtc = resumed;
                _PendingPaused += paused;
                if (_DeferUntilUtc == null || deferUntil > _DeferUntilUtc.Value) _DeferUntilUtc = deferUntil;
                deferUntil = _DeferUntilUtc.Value;
                _DeferralLogged = false;
            }
            Interlocked.Increment(ref _PausesDetected);
            GarrisonMetrics.Count(GarrisonMetricCatalog.MaintenancePauses, "leader", leader ? "true" : "false");
            _Logging.Warn(_Header + "maintenance paused for " + Math.Round(paused.TotalSeconds, 1) + " s; giving nodes one heartbeat window ("
                + _Options.PauseDeferralMs + " ms) to report before expiring leases, enforcing deadlines, or marking nodes Lost or control nodes Offline"
                + " event=maintenance.pause pausedMs=" + (long)paused.TotalMilliseconds
                + " resumedUtc=" + resumed.ToString("o")
                + " deferUntilUtc=" + deferUntil.ToString("o")
                + " detectedIn=" + detectedIn
                + " leader=" + (leader ? "true" : "false"));

            // Time spent paused does not count toward Runtime.FailBlockedAfterSeconds.
            await _BlockedLock.WaitAsync(token).ConfigureAwait(false);
            try
            {
                foreach (BlockedRunState state in _Blocked.Values)
                {
                    if (state.BlockedSinceUtc.HasValue) state.BlockedSinceUtc = state.BlockedSinceUtc.Value + paused;
                }
            }
            finally
            {
                _BlockedLock.Release();
            }

            await TryHeartbeatSelfAsync(token).ConfigureAwait(false);
        }

        private async Task<bool> DestructiveAllowedAsync(CancellationToken token)
        {
            DateTime now = Now;
            DateTime? deferUntil;
            DateTime? resumed;
            lock (_PauseLock)
            {
                deferUntil = _DeferUntilUtc;
                resumed = _PendingResumeUtc;
            }

            if (deferUntil.HasValue && now < deferUntil.Value)
            {
                if (!_DeferralLogged)
                {
                    _DeferralLogged = true;
                    _Logging.Debug(_Header + "deferring lease expiry, deadlines, and Lost and Offline marking until " + deferUntil.Value.ToString("o"));
                }
                return false;
            }

            // A leader whose own heartbeat is stale (it just resumed, or cannot write) is not trusted to judge others.
            Func<DateTime?>? self = SelfHeartbeatUtc;
            if (self != null)
            {
                if (SelfHeartbeatStale(self(), resumed, now))
                {
                    await TryHeartbeatSelfAsync(token).ConfigureAwait(false);
                    DateTime? last = self();
                    if (SelfHeartbeatStale(last, resumed, Now))
                    {
                        if (!_SelfStaleWarned)
                        {
                            _SelfStaleWarned = true;
                            _Logging.Warn(_Header + "this replica's own control node heartbeat is stale (last " + (last.HasValue ? last.Value.ToString("o") : "never")
                                + "); not expiring leases, enforcing deadlines, or marking nodes until it heartbeats again event=maintenance.self_stale");
                        }
                        return false;
                    }
                }
                _SelfStaleWarned = false;
            }

            if (resumed.HasValue) await EndDeferralAsync(token).ConfigureAwait(false);
            return true;
        }

        private bool SelfHeartbeatStale(DateTime? last, DateTime? resumed, DateTime now)
        {
            if (!last.HasValue) return true;
            if (resumed.HasValue && last.Value < resumed.Value) return true;
            return (now - last.Value).TotalMilliseconds > _Options.ControlNodeHeartbeatMs + _Options.PauseGraceMs;
        }

        private async Task TryHeartbeatSelfAsync(CancellationToken token)
        {
            Func<CancellationToken, Task>? heartbeat = HeartbeatSelfAsync;
            if (heartbeat == null) return;
            try
            {
                await heartbeat(token).ConfigureAwait(false);
            }
            catch (Exception e) when (e is not OperationCanceledException)
            {
                _Logging.Warn(_Header + "could not heartbeat this replica's control node: " + e.Message);
            }
        }

        private async Task EndDeferralAsync(CancellationToken token)
        {
            DateTime pauseStart;
            TimeSpan paused;
            lock (_PauseLock)
            {
                if (!_PendingResumeUtc.HasValue || !_PendingPauseStartUtc.HasValue) return;
                pauseStart = _PendingPauseStartUtc.Value;
                paused = _PendingPaused;
                _PendingResumeUtc = null;
                _PendingPauseStartUtc = null;
                _PendingPaused = TimeSpan.Zero;
                _DeferUntilUtc = null;
            }

            // Runs held across the pause get their deadline back only when their worker re-confirmed the lease after the
            // pause began (a lease renewed at time t expires at t plus the lease duration). The others are enforced
            // normally: their lease expires, and their deadline stands.
            DateTime now = Now;
            int extended = 0;
            int unconfirmed = 0;
            List<Run> active = await _Database.Runs.ListActiveStartedBeforeAsync(now.AddDays(1), 1000, token).ConfigureAwait(false);
            HashSet<string> activeIds = new HashSet<string>(active.Select(r => r.Id), StringComparer.Ordinal);
            foreach (Run run in active)
            {
                token.ThrowIfCancellationRequested();
                DateTime? held = run.LeasedUtc ?? run.StartedUtc;
                if (!held.HasValue || held.Value > pauseStart) continue;

                bool reconfirmed = run.LeaseExpiresUtc.HasValue && run.LeaseExpiresUtc.Value.AddMilliseconds(-_Options.LeaseDurationMs) > pauseStart;
                if (!reconfirmed)
                {
                    unconfirmed++;
                    continue;
                }

                _PauseCredit.AddOrUpdate(run.Id, paused, (id, existing) => existing + paused);
                if (run.DeadlineUtc.HasValue && await _Database.Runs.ExtendDeadlineAsync(run.Id, run.LeaseEpoch, run.DeadlineUtc.Value + paused, token).ConfigureAwait(false))
                {
                    extended++;
                    _Logging.Info(_Header + "run " + run.Id + " deadline extended by " + Math.Round(paused.TotalSeconds, 1) + " s after a pause; node "
                        + (run.LeaseNodeName ?? run.LeaseNodeId) + " re-confirmed its lease " + RunTracing.LogFields(run.Id, run.TraceId));
                }
            }
            foreach (string id in _PauseCredit.Keys.ToList())
            {
                if (!activeIds.Contains(id)) _PauseCredit.TryRemove(id, out TimeSpan _);
            }

            _Logging.Info(_Header + "pause deferral ended; evaluating leases, deadlines, and nodes normally (" + extended + " run deadlines extended by "
                + Math.Round(paused.TotalSeconds, 1) + " s, " + unconfirmed + " runs held across the pause without a re-confirmed lease)"
                + " event=maintenance.resume pausedMs=" + (long)paused.TotalMilliseconds + " extended=" + extended + " unconfirmed=" + unconfirmed);
        }

        private async Task<bool> ReapExpiredLeasesAsync(CancellationToken token)
        {
            List<Run> expired = await _Database.Runs.ListExpiredLeasesAsync(Now, 200, token).ConfigureAwait(false);
            foreach (Run run in expired)
            {
                Deployment? deployment = await _Database.Deployments.ReadAsync(run.DeploymentId, token).ConfigureAwait(false);
                // A Leased run never started its harness (the start gate), so it is requeued under every policy. A Running
                // run follows the effect policy it was admitted under (P12.29): only AtLeastOnce requeues it; AtMostOnce,
                // and Journaled without a trusted safe checkpoint, end it with NodeLost.
                bool requeue = EffectPolicyRules.RequeueOnLeaseExpiry(run);
                if (!requeue && run.Status == RunStatusEnum.Running && run.EffectPolicy == DeploymentEffectPolicyEnum.Journaled
                    && !run.CancelRequested && run.Attempt < Math.Max(run.MaxAttempts, 1))
                {
                    requeue = await _Database.EffectOperations.RecoverySafeAsync(run.TenantId, run.Id, run.LeaseEpoch, token).ConfigureAwait(false);
                }

                RunTransition transition = new RunTransition();
                transition.RunId = run.Id;
                transition.FromStatuses.Add(run.Status);
                transition.Epoch = run.LeaseEpoch;
                transition.ClearLease = true;
                if (requeue)
                {
                    transition.ToStatus = RunStatusEnum.Queued;
                    transition.IncrementAttempt = true;
                    transition.SetQueued = true;
                }
                else if (run.Status == RunStatusEnum.Cancelling || run.CancelRequested)
                {
                    transition.ToStatus = RunStatusEnum.Cancelled;
                    transition.Outcome = RunOutcomeEnum.Cancelled;
                    transition.SetCompleted = true;
                }
                else
                {
                    transition.ToStatus = RunStatusEnum.Failed;
                    transition.Outcome = RunOutcomeEnum.NodeLost;
                    transition.ErrorMessage = "The lease held by node " + (run.LeaseNodeName ?? run.LeaseNodeId) + " expired.";
                    transition.SetCompleted = true;
                }

                if (await _Database.Runs.TransitionAsync(transition, token).ConfigureAwait(false))
                {
                    if (CredentialBroker != null) await CredentialBroker.RevokeRunAsync(run.TenantId, run.Id, run.LeaseEpoch, token).ConfigureAwait(false);
                    GarrisonMetrics.Count(GarrisonMetricCatalog.LeaseExpirations, "action", requeue ? "requeued" : "failed");
                    _Logging.Info(_Header + "run " + run.Id + " lease expired on " + (run.LeaseNodeName ?? run.LeaseNodeId) + "; " + (requeue ? "requeued" : transition.ToStatus.ToString().ToLowerInvariant()) + " (effect policy " + run.EffectPolicy + ") " + RunTracing.LogFields(run.Id, run.TraceId)
                        + " " + GarrisonTracing.LogFields("tenant", run.TenantId, "agent", run.AgentName, "deployment", deployment?.Name, "node", run.LeaseNodeName ?? run.LeaseNodeId));
                    if (requeue)
                    {
                        // Fence the old attempt (P10.21): its run token, minted for this epoch, stops working now, so a
                        // harness that outlived its lease cannot delegate. Tokens of a newer attempt are left alone.
                        await _Database.Sessions.RevokeByRunEpochAsync(run.Id, run.LeaseEpoch, "Run lease expired; the run was requeued.", token).ConfigureAwait(false);
                        _Signals.NotifyQueue(run);
                    }
                    else
                    {
                        await _Database.Sessions.RevokeByRunAsync(run.Id, "Run lease expired.", token).ConfigureAwait(false);
                        _Signals.Complete(run.Id);
                        await FinishedAsync(run, transition, token).ConfigureAwait(false);
                    }
                }
            }
            return expired.Count > 0;
        }

        private async Task FinishedAsync(Run run, RunTransition transition, CancellationToken token)
        {
            if (CredentialBroker != null) await CredentialBroker.RevokeRunAsync(run.TenantId, run.Id, run.LeaseEpoch, token).ConfigureAwait(false);
            run.Status = transition.ToStatus;
            if (transition.Outcome.HasValue) run.Outcome = transition.Outcome.Value;
            run.CompletedUtc = Now;
            await RunTelemetry.FinishedAsync(_Database, run, token).ConfigureAwait(false);
        }

        private async Task<bool> EnforceDeadlinesAsync(CancellationToken token)
        {
            List<Run> late = await _Database.Runs.ListPastDeadlineAsync(Now, 200, token).ConfigureAwait(false);
            foreach (Run run in late)
            {
                RunTransition transition = new RunTransition();
                transition.RunId = run.Id;
                transition.FromStatuses.Add(run.Status);
                transition.Epoch = run.LeaseEpoch;
                transition.ToStatus = RunStatusEnum.TimedOut;
                transition.Outcome = RunOutcomeEnum.TimedOut;
                transition.ErrorMessage = "The run passed its deadline without a result from its node.";
                transition.ClearLease = true;
                transition.SetCompleted = true;
                if (await _Database.Runs.TransitionAsync(transition, token).ConfigureAwait(false))
                {
                    _PauseCredit.TryRemove(run.Id, out TimeSpan _);
                    await _Database.Sessions.RevokeByRunAsync(run.Id, "Run timed out.", token).ConfigureAwait(false);
                    _Signals.Complete(run.Id);
                    await FinishedAsync(run, transition, token).ConfigureAwait(false);
                }
            }

            // The cluster cap bounds every run, including runs compiled before the cap was lowered and runs whose stored
            // deadline is missing or later than the cap allows.
            int capSeconds = _Options.MaxRunSeconds;
            DateTime now = Now;
            List<Run> overCap = await _Database.Runs.ListActiveStartedBeforeAsync(now.AddSeconds(-(capSeconds + _Options.DeadlineGraceSeconds)), 200, token).ConfigureAwait(false);
            foreach (Run run in overCap)
            {
                // Time a run spent paused with its lease re-confirmed afterwards does not count toward the cap.
                DateTime? started = run.StartedUtc ?? run.LeasedUtc;
                if (started.HasValue && _PauseCredit.TryGetValue(run.Id, out TimeSpan credit) && started.Value.AddSeconds(capSeconds + _Options.DeadlineGraceSeconds) + credit > now) continue;

                RunTransition transition = new RunTransition();
                transition.RunId = run.Id;
                transition.FromStatuses.Add(run.Status);
                transition.Epoch = run.LeaseEpoch;
                transition.ToStatus = RunStatusEnum.TimedOut;
                transition.Outcome = RunOutcomeEnum.TimedOut;
                transition.ErrorMessage = "The run passed the cluster cap Runtime.MaxRunSeconds (" + capSeconds + " seconds) without a result from its node.";
                transition.ClearLease = true;
                transition.SetCompleted = true;
                if (await _Database.Runs.TransitionAsync(transition, token).ConfigureAwait(false))
                {
                    _PauseCredit.TryRemove(run.Id, out TimeSpan _);
                    await _Database.Sessions.RevokeByRunAsync(run.Id, "Run timed out.", token).ConfigureAwait(false);
                    _Signals.Complete(run.Id);
                    await FinishedAsync(run, transition, token).ConfigureAwait(false);
                }
            }
            return late.Count > 0 || overCap.Count > 0;
        }

        private async Task<bool> MarkLostNodesAsync(CancellationToken token)
        {
            List<Node> stale = await _Database.Nodes.ListStaleAsync(Now.AddMilliseconds(-_Options.NodeHeartbeatTimeoutMs), token).ConfigureAwait(false);
            foreach (Node node in stale)
            {
                if (await _Database.Nodes.SetStatusAsync(node.Id, NodeStatusEnum.Lost, token).ConfigureAwait(false))
                {
                    GarrisonMetrics.Count(GarrisonMetricCatalog.NodeTransitions, "status", NodeStatusEnum.Lost.ToString());
                    _Logging.Warn(_Header + "node " + node.Name + " missed heartbeats and is now Lost " + GarrisonTracing.LogFields("node", node.Name));
                }
            }
            return stale.Count > 0;
        }

        private async Task<bool> MarkOfflineControlNodesAsync(CancellationToken token)
        {
            List<string> marked = await _Database.ControlNodes.MarkSilentOfflineAsync(Now.AddMilliseconds(-_Options.ControlNodeOfflineAfterMs), token).ConfigureAwait(false);
            foreach (string id in marked)
            {
                GarrisonMetrics.Count(GarrisonMetricCatalog.ControlNodeTransitions, "status", "Offline");
                _Logging.Warn(_Header + "control-plane replica " + id + " missed heartbeats and is now Offline " + GarrisonTracing.LogFields("node", id));
            }
            return marked.Count > 0;
        }

        private async Task<bool> CheckBlockedRunsAsync(CancellationToken token)
        {
            BlockedRunService? blocked = BlockedRuns;
            if (blocked == null) return false;
            bool any = false;

            await _BlockedLock.WaitAsync(token).ConfigureAwait(false);
            try
            {
                List<Run> queued = await _Database.Runs.ListQueuedAsync(null, blocked.MaxQueuedRunsScanned, token).ConfigureAwait(false);
                any = queued.Count > 0;
                Dictionary<string, long> byReason = new Dictionary<string, long>(StringComparer.Ordinal);
                HashSet<string> seen = new HashSet<string>(StringComparer.Ordinal);
                if (queued.Count > 0)
                {
                    PlacementSnapshot snapshot = await blocked.SnapshotAsync(true, token).ConfigureAwait(false);
                    int failAfterSeconds = _Options.FailBlockedAfterSeconds;
                    foreach (Run run in queued)
                    {
                        token.ThrowIfCancellationRequested();
                        seen.Add(run.Id);
                        RunBlockedReasonEnum? reason = BlockedRunService.Evaluate(snapshot, run);
                        if (reason == null)
                        {
                            if (_Blocked.TryGetValue(run.Id, out BlockedRunState? clear)) clear.BlockedSinceUtc = null;
                            continue;
                        }

                        byReason[reason.Value.ToString()] = (byReason.TryGetValue(reason.Value.ToString(), out long counted) ? counted : 0) + 1;
                        if (!_Blocked.TryGetValue(run.Id, out BlockedRunState? state))
                        {
                            state = await LoadBlockedStateAsync(run, token).ConfigureAwait(false);
                            _Blocked[run.Id] = state;
                        }
                        if (state.BlockedSinceUtc == null) state.BlockedSinceUtc = Now;

                        if (!state.Notified.Contains(reason.Value))
                        {
                            if (await AppendBlockedWarningAsync(run, reason.Value, token).ConfigureAwait(false)) state.Notified.Add(reason.Value);
                        }

                        if (failAfterSeconds > 0 && (Now - state.BlockedSinceUtc.Value).TotalSeconds >= failAfterSeconds)
                        {
                            await FailBlockedAsync(run, reason.Value, failAfterSeconds, token).ConfigureAwait(false);
                        }
                    }
                }

                foreach (string id in _Blocked.Keys.ToList())
                {
                    if (!seen.Contains(id)) _Blocked.TryRemove(id, out BlockedRunState? _);
                }
                Volatile.Write(ref _BlockedByReason, byReason);
            }
            finally
            {
                _BlockedLock.Release();
            }
            return any;
        }

        private async Task<BlockedRunState> LoadBlockedStateAsync(Run run, CancellationToken token)
        {
            BlockedRunState state = new BlockedRunState();
            if (run.LastEventSequence <= 0) return state;

            DateTime queuedUtc = run.QueuedUtc ?? run.CreatedUtc;
            long after = 0;
            for (int page = 0; page < 20; page++)
            {
                List<RunEvent> events = await _Database.RunEvents.ListAfterAsync(run.Id, after, 500, token).ConfigureAwait(false);
                foreach (RunEvent evt in events)
                {
                    after = Math.Max(after, evt.Sequence);
                    BlockedRunNotice? notice = ReadNotice(evt);
                    if (notice == null || notice.BlockedReason == null) continue;
                    state.Notified.Add(notice.BlockedReason.Value);
                    if (evt.TimestampUtc >= queuedUtc && (state.BlockedSinceUtc == null || evt.TimestampUtc < state.BlockedSinceUtc.Value)) state.BlockedSinceUtc = evt.TimestampUtc;
                }
                if (events.Count < 500) break;
            }
            return state;
        }

        private static BlockedRunNotice? ReadNotice(RunEvent evt)
        {
            if (evt.EventType != RunEventTypeEnum.Warning || String.IsNullOrEmpty(evt.RawEventJson)) return null;
            try
            {
                BlockedRunNotice? notice = Serializer.Deserialize<BlockedRunNotice>(evt.RawEventJson);
                if (notice == null || !String.Equals(notice.Notice, BlockedRunNotice.KindName, StringComparison.Ordinal)) return null;
                return notice;
            }
            catch (Exception e) when (e is JsonException || e is NotSupportedException || e is ArgumentException)
            {
                return null;
            }
        }

        private async Task<bool> AppendBlockedWarningAsync(Run run, RunBlockedReasonEnum reason, CancellationToken token)
        {
            Run? current = await _Database.Runs.ReadAsync(run.Id, token).ConfigureAwait(false);
            if (current == null || current.Status != RunStatusEnum.Queued) return false;

            BlockedRunNotice notice = new BlockedRunNotice();
            notice.Notice = BlockedRunNotice.KindName;
            notice.BlockedReason = reason;

            RunEvent evt = new RunEvent();
            evt.TenantId = current.TenantId;
            evt.RunId = current.Id;
            evt.Sequence = current.LastEventSequence + 1;
            evt.EventType = RunEventTypeEnum.Warning;
            evt.TimestampUtc = DateTime.UtcNow;
            evt.Text = BlockedRunService.Describe(current, reason);
            evt.Code = "RunBlocked";
            evt.RawEventJson = Serializer.Serialize(notice);

            int inserted = await _Database.RunEvents.InsertBatchAsync(new List<RunEvent> { evt }, token).ConfigureAwait(false);
            if (inserted == 0) return false;
            await _Database.Runs.UpdateLastEventSequenceAsync(current.Id, evt.Sequence, token).ConfigureAwait(false);
            GarrisonMetrics.Count(GarrisonMetricCatalog.RunsBlocked, "reason", reason.ToString());
            _Logging.Info(_Header + "run " + current.Id + " is blocked (" + reason + "): " + evt.Text + " " + RunTracing.LogFields(current.Id, current.TraceId) + " " + GarrisonTracing.LogFields("tenant", current.TenantId, "agent", current.AgentName));
            _Signals.Notify(current.Id);
            return true;
        }

        private async Task FailBlockedAsync(Run run, RunBlockedReasonEnum reason, int failAfterSeconds, CancellationToken token)
        {
            RunTransition transition = new RunTransition();
            transition.RunId = run.Id;
            transition.FromStatuses.Add(RunStatusEnum.Queued);
            transition.ToStatus = RunStatusEnum.Failed;
            transition.Outcome = RunOutcomeEnum.NoCapableWorker;
            transition.ErrorMessage = "No Ready worker could run this run for " + failAfterSeconds + " seconds: " + BlockedRunService.Cause(run, reason) + " (" + reason + "). Runs fail after this wait because the cluster setting Runtime.FailBlockedAfterSeconds is " + failAfterSeconds + ".";
            transition.ClearLease = true;
            transition.SetCompleted = true;
            if (await _Database.Runs.TransitionAsync(transition, token).ConfigureAwait(false))
            {
                _Blocked.TryRemove(run.Id, out BlockedRunState? _);
                GarrisonMetrics.Count(GarrisonMetricCatalog.RunsBlockedFailed, "reason", reason.ToString());
                _Logging.Warn(_Header + "run " + run.Id + " failed after " + failAfterSeconds + " seconds blocked (" + reason + ") " + RunTracing.LogFields(run.Id, run.TraceId) + " " + GarrisonTracing.LogFields("tenant", run.TenantId, "agent", run.AgentName));
                _Signals.Complete(run.Id);
                await FinishedAsync(run, transition, token).ConfigureAwait(false);
            }
        }

        #endregion
    }
}
