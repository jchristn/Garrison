namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Concurrent;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Serialization;
    using Garrison.Core.Telemetry;
    using Radiant;
    using SyslogLogging;

    /// <summary>
    /// Leader-only maintenance: reclaims runs whose lease expired (requeue or fail with NodeLost), enforces run
    /// deadlines as a backstop, marks silent nodes Lost (plan section 9.4), and explains queued runs that no Ready
    /// worker can run (one Warning run event per reason, and an optional failure after
    /// <see cref="RuntimeOptions.FailBlockedAfterSeconds"/>). Thread-safe.
    /// </summary>
    public class MaintenanceService : IDisposable
    {
        #region Public-Members

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
        /// Blocked-run evaluator. When null (the default), blocked queued runs are not explained or failed.
        /// </summary>
        public BlockedRunService? BlockedRuns { get; set; } = null;

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
        private bool _Disposed = false;
        private int _RetentionIntervalMs = 3600000;
        private DateTime _LastRetentionUtc = DateTime.MinValue;
        private int _BlockedCheckIntervalMs = 5000;
        private DateTime _LastBlockedCheckUtc = DateTime.MinValue;
        private readonly SemaphoreSlim _BlockedLock = new SemaphoreSlim(1, 1);
        private readonly ConcurrentDictionary<string, BlockedRunState> _Blocked = new ConcurrentDictionary<string, BlockedRunState>(StringComparer.Ordinal);

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
        /// Run one maintenance pass regardless of leadership. Used by tests.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task RunOnceAsync(CancellationToken token = default)
        {
            await ReapExpiredLeasesAsync(token).ConfigureAwait(false);
            await EnforceDeadlinesAsync(token).ConfigureAwait(false);
            await MarkLostNodesAsync(token).ConfigureAwait(false);
            await CheckBlockedRunsAsync(token).ConfigureAwait(false);
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
            }
            _Disposed = true;
        }

        #endregion

        #region Private-Methods

        private async Task LoopAsync(CancellationToken token)
        {
            while (!token.IsCancellationRequested)
            {
                try
                {
                    if (_Leader.IsLeader)
                    {
                        await ReapExpiredLeasesAsync(token).ConfigureAwait(false);
                        await EnforceDeadlinesAsync(token).ConfigureAwait(false);
                        await MarkLostNodesAsync(token).ConfigureAwait(false);
                        if ((DateTime.UtcNow - _LastBlockedCheckUtc).TotalMilliseconds >= _BlockedCheckIntervalMs)
                        {
                            _LastBlockedCheckUtc = DateTime.UtcNow;
                            await CheckBlockedRunsAsync(token).ConfigureAwait(false);
                        }
                        if (RunRetention && (DateTime.UtcNow - _LastRetentionUtc).TotalMilliseconds >= _RetentionIntervalMs)
                        {
                            _LastRetentionUtc = DateTime.UtcNow;
                            int runs = await _Database.Runs.PruneFinishedAsync(DateTime.UtcNow.AddDays(-Math.Max(1, RunRetentionDays())), token).ConfigureAwait(false);
                            int events = await _Database.RunEvents.PruneAsync(DateTime.UtcNow.AddDays(-Math.Max(1, EventRetentionDays())), token).ConfigureAwait(false);
                            if (runs + events > 0) _Logging.Info(_Header + "retention pruned " + runs + " runs and " + events + " events");
                        }
                    }
                }
                catch (Exception e) when (e is not OperationCanceledException)
                {
                    _Logging.Warn(_Header + "pass failed: " + e.Message);
                }
                await Task.Delay(_Options.MaintenanceIntervalMs, token).ConfigureAwait(false);
            }
        }

        private async Task ReapExpiredLeasesAsync(CancellationToken token)
        {
            List<Run> expired = await _Database.Runs.ListExpiredLeasesAsync(DateTime.UtcNow, 200, token).ConfigureAwait(false);
            foreach (Run run in expired)
            {
                Deployment? deployment = await _Database.Deployments.ReadAsync(run.DeploymentId, token).ConfigureAwait(false);
                bool attemptsLeft = run.Attempt < Math.Max(run.MaxAttempts, 1);
                bool requeue = !run.CancelRequested && attemptsLeft && (run.Status == RunStatusEnum.Leased || (run.Status == RunStatusEnum.Running && deployment != null && deployment.RetryOnNodeLoss));

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
                    _Telemetry.Increment("garrison.lease.expirations", new RadiantTag("action", requeue ? "requeued" : "failed"));
                    _Logging.Info(_Header + "run " + run.Id + " lease expired on " + (run.LeaseNodeName ?? run.LeaseNodeId) + "; " + (requeue ? "requeued" : transition.ToStatus.ToString().ToLowerInvariant()) + " " + RunTracing.LogFields(run.Id, run.TraceId));
                    if (requeue) _Signals.QueueChanged.Signal();
                    else
                    {
                        await _Database.Sessions.RevokeByRunAsync(run.Id, "Run lease expired.", token).ConfigureAwait(false);
                        _Signals.Complete(run.Id);
                    }
                }
            }
        }

        private async Task EnforceDeadlinesAsync(CancellationToken token)
        {
            List<Run> late = await _Database.Runs.ListPastDeadlineAsync(DateTime.UtcNow, 200, token).ConfigureAwait(false);
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
                    await _Database.Sessions.RevokeByRunAsync(run.Id, "Run timed out.", token).ConfigureAwait(false);
                    _Signals.Complete(run.Id);
                }
            }
        }

        private async Task MarkLostNodesAsync(CancellationToken token)
        {
            List<Node> stale = await _Database.Nodes.ListStaleAsync(DateTime.UtcNow.AddMilliseconds(-_Options.NodeHeartbeatTimeoutMs), token).ConfigureAwait(false);
            foreach (Node node in stale)
            {
                if (await _Database.Nodes.SetStatusAsync(node.Id, NodeStatusEnum.Lost, token).ConfigureAwait(false))
                {
                    _Logging.Warn(_Header + "node " + node.Name + " missed heartbeats and is now Lost");
                }
            }
        }

        private async Task CheckBlockedRunsAsync(CancellationToken token)
        {
            BlockedRunService? blocked = BlockedRuns;
            if (blocked == null) return;

            await _BlockedLock.WaitAsync(token).ConfigureAwait(false);
            try
            {
                List<Run> queued = await _Database.Runs.ListQueuedAsync(null, blocked.MaxQueuedRunsScanned, token).ConfigureAwait(false);
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

                        if (!_Blocked.TryGetValue(run.Id, out BlockedRunState? state))
                        {
                            state = await LoadBlockedStateAsync(run, token).ConfigureAwait(false);
                            _Blocked[run.Id] = state;
                        }
                        if (state.BlockedSinceUtc == null) state.BlockedSinceUtc = DateTime.UtcNow;

                        if (!state.Notified.Contains(reason.Value))
                        {
                            if (await AppendBlockedWarningAsync(run, reason.Value, token).ConfigureAwait(false)) state.Notified.Add(reason.Value);
                        }

                        if (failAfterSeconds > 0 && (DateTime.UtcNow - state.BlockedSinceUtc.Value).TotalSeconds >= failAfterSeconds)
                        {
                            await FailBlockedAsync(run, reason.Value, failAfterSeconds, token).ConfigureAwait(false);
                        }
                    }
                }

                foreach (string id in _Blocked.Keys.ToList())
                {
                    if (!seen.Contains(id)) _Blocked.TryRemove(id, out BlockedRunState? _);
                }
            }
            finally
            {
                _BlockedLock.Release();
            }
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
            _Telemetry.Increment("garrison.runs.blocked", new RadiantTag("reason", reason.ToString()));
            _Logging.Info(_Header + "run " + current.Id + " is blocked (" + reason + "): " + evt.Text + " " + RunTracing.LogFields(current.Id, current.TraceId));
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
                _Telemetry.Increment("garrison.runs.blocked.failed", new RadiantTag("reason", reason.ToString()));
                _Logging.Warn(_Header + "run " + run.Id + " failed after " + failAfterSeconds + " seconds blocked (" + reason + ") " + RunTracing.LogFields(run.Id, run.TraceId));
                _Signals.Complete(run.Id);
            }
        }

        #endregion
    }
}
