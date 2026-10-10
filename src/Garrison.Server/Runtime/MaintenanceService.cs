namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Telemetry;
    using Radiant;
    using SyslogLogging;

    /// <summary>
    /// Leader-only maintenance: reclaims runs whose lease expired (requeue or fail with NodeLost), enforces run
    /// deadlines as a backstop, and marks silent nodes Lost (plan section 9.4). Thread-safe.
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
            if (disposing) _Cts?.Dispose();
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
                        await RunOnceAsync(token).ConfigureAwait(false);
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
                    _Logging.Info(_Header + "run " + run.Id + " lease expired on " + (run.LeaseNodeName ?? run.LeaseNodeId) + "; " + (requeue ? "requeued" : transition.ToStatus.ToString().ToLowerInvariant()));
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

        #endregion
    }
}
