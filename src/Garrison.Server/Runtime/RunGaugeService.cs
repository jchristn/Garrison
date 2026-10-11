namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Diagnostics.Metrics;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Responses;
    using Garrison.Core.Telemetry;
    using SyslogLogging;

    /// <summary>
    /// Cluster-wide run gauges for autoscaling (P10.6): garrison.runs.queued (Pending and Queued) and garrison.runs.active
    /// (Leased, Running, and Cancelling), read from the database on an interval and cached, so a scrape never touches
    /// the database. Also garrison.queue.depth (unfinished runs per status, tenant, agent, and harness) and garrison.nodes
    /// (worker nodes per status) (P13.24). Every replica reports the same cluster-wide values; aggregate with max, not
    /// sum. Thread-safe.
    /// </summary>
    public class RunGaugeService : IDisposable
    {
        #region Public-Members

        /// <summary>
        /// Refresh interval in milliseconds. Minimum 1000, maximum 600000, default 10000.
        /// </summary>
        public int RefreshIntervalMs
        {
            get
            {
                return _RefreshIntervalMs;
            }
            set
            {
                _RefreshIntervalMs = Math.Clamp(value, 1000, 600000);
            }
        }

        /// <summary>
        /// Last observed queued runs (Pending and Queued).
        /// </summary>
        public long Queued
        {
            get
            {
                return Interlocked.Read(ref _Queued);
            }
        }

        /// <summary>
        /// Last observed active runs (Leased, Running, and Cancelling).
        /// </summary>
        public long Active
        {
            get
            {
                return Interlocked.Read(ref _Active);
            }
        }

        #endregion

        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly LoggingModule? _Logging;
        private CancellationTokenSource? _Cts = null;
        private Task? _Loop = null;
        private int _RefreshIntervalMs = 10000;
        private long _Queued = 0;
        private long _Active = 0;
        private List<RunGaugeRow> _Depth = new List<RunGaugeRow>();
        private List<StatusCount> _Nodes = new List<StatusCount>();
        private readonly List<GaugeRegistration> _Gauges = new List<GaugeRegistration>();
        private bool _Disposed = false;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate and register the gauges.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="telemetry">Telemetry.</param>
        /// <param name="logging">Logging, or null.</param>
        /// <exception cref="ArgumentNullException">Thrown when database or telemetry is null.</exception>
        public RunGaugeService(DatabaseDriverBase database, GarrisonTelemetry telemetry, LoggingModule? logging)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            if (telemetry == null) throw new ArgumentNullException(nameof(telemetry));
            _Logging = logging;
            _Gauges.Add(GarrisonMetrics.RegisterGauge(GarrisonMetricCatalog.RunsQueued, () => Interlocked.Read(ref _Queued)));
            _Gauges.Add(GarrisonMetrics.RegisterGauge(GarrisonMetricCatalog.RunsActive, () => Interlocked.Read(ref _Active)));
            _Gauges.Add(GarrisonMetrics.RegisterGauge(GarrisonMetricCatalog.QueueDepth, ObserveDepth));
            _Gauges.Add(GarrisonMetrics.RegisterGauge(GarrisonMetricCatalog.Nodes, ObserveNodes));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Start refreshing.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        public void Start(CancellationToken token)
        {
            _Cts = CancellationTokenSource.CreateLinkedTokenSource(token);
            CancellationToken loopToken = _Cts.Token;
            _Loop = Task.Run(() => LoopAsync(loopToken));
        }

        /// <summary>
        /// Stop refreshing.
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
        /// Read the counts once.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task RefreshAsync(CancellationToken token = default)
        {
            List<StatusCount> counts = await _Database.Runs.CountUnfinishedAsync(token).ConfigureAwait(false);
            long queued = 0;
            long active = 0;
            foreach (StatusCount count in counts)
            {
                if (count.Status == "Pending" || count.Status == "Queued") queued += count.Count;
                else active += count.Count;
            }
            Interlocked.Exchange(ref _Queued, queued);
            Interlocked.Exchange(ref _Active, active);
            Volatile.Write(ref _Depth, await _Database.Runs.CountUnfinishedByAgentAsync(token).ConfigureAwait(false));
            Volatile.Write(ref _Nodes, await _Database.Nodes.CountByStatusAsync(token).ConfigureAwait(false));
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
                foreach (GaugeRegistration gauge in _Gauges) gauge.Dispose();
                _Gauges.Clear();
            }
            _Disposed = true;
        }

        #endregion

        #region Private-Methods

        private IEnumerable<Measurement<double>> ObserveDepth()
        {
            List<RunGaugeRow> rows = Volatile.Read(ref _Depth);
            List<Measurement<double>> measurements = new List<Measurement<double>>(rows.Count);
            foreach (RunGaugeRow row in rows)
            {
                TagList tags = GarrisonMetrics.Tags("status", row.Status, "tenant", row.TenantId, "agent", row.AgentName, "harness", row.HarnessType.ToString());
                measurements.Add(GarrisonMetrics.Measure(row.Count, tags));
            }
            return measurements;
        }

        private IEnumerable<Measurement<double>> ObserveNodes()
        {
            List<StatusCount> rows = Volatile.Read(ref _Nodes);
            List<Measurement<double>> measurements = new List<Measurement<double>>(rows.Count);
            foreach (StatusCount row in rows) measurements.Add(GarrisonMetrics.Measure(row.Count, "status", row.Status));
            return measurements;
        }

        private async Task LoopAsync(CancellationToken token)
        {
            while (!token.IsCancellationRequested)
            {
                try
                {
                    await GarrisonTracing.BackgroundAsync("gauges", "refresh", RefreshAsync, token).ConfigureAwait(false);
                }
                catch (OperationCanceledException)
                {
                    return;
                }
                catch (Exception e)
                {
                    _Logging?.Debug("[RunGauges] refresh failed: " + e.Message);
                }
                try
                {
                    await Task.Delay(_RefreshIntervalMs, token).ConfigureAwait(false);
                }
                catch (OperationCanceledException)
                {
                    return;
                }
            }
        }

        #endregion
    }
}
