namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics.Metrics;
    using System.Linq;
    using System.Net;
    using System.Net.Sockets;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Core.Responses;

    /// <summary>
    /// Registers and heartbeats this replica's control node row (P10.19). One per replica. The row is written as
    /// Starting when the server begins initializing, Ready once it serves, Draining as soon as shutdown begins, and Offline
    /// on a clean stop. Each heartbeat carries the replica's activity (requests in flight, open streams, held long polls)
    /// and refreshes the <c>garrison_control_nodes</c> gauge. Database failures are logged and retried on the next
    /// heartbeat; they never stop the replica. Thread-safe.
    /// </summary>
    public class ControlNodeService : IDisposable
    {
        #region Public-Members

        /// <summary>
        /// Node ID of this replica (the row identifier).
        /// </summary>
        public string NodeId { get; }

        /// <summary>
        /// Returns the number of HTTP requests in flight. Default returns 0; the server host supplies its counter.
        /// </summary>
        public Func<int> ActiveRequests
        {
            get
            {
                return _ActiveRequests;
            }
            set
            {
                _ActiveRequests = value ?? throw new ArgumentNullException(nameof(value));
            }
        }

        /// <summary>
        /// Returns the heartbeat interval in milliseconds (clamped to 1000 through 60000). Default returns 5000; the
        /// server host supplies <see cref="RuntimeOptions.ControlNodeHeartbeatMs"/>.
        /// </summary>
        public Func<int> HeartbeatIntervalMs
        {
            get
            {
                return _HeartbeatIntervalMs;
            }
            set
            {
                _HeartbeatIntervalMs = value ?? throw new ArgumentNullException(nameof(value));
            }
        }

        /// <summary>
        /// Status this replica last wrote.
        /// </summary>
        public ControlNodeStatusEnum Status
        {
            get
            {
                return (ControlNodeStatusEnum)Interlocked.CompareExchange(ref _Status, 0, 0);
            }
        }

        /// <summary>
        /// Clock used for heartbeat timestamps and pause detection. Default <see cref="TimeProvider.System"/>. Set it
        /// before <see cref="RegisterAsync"/>; tests use a manual clock.
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
        /// Time (from <see cref="Clock"/>) of the last Starting, Ready, or Draining row this replica wrote successfully,
        /// or null before the first. The maintenance leader refuses to mark other nodes while this is stale (P3.16).
        /// </summary>
        public DateTime? LastHeartbeatUtc
        {
            get
            {
                long ticks = Interlocked.Read(ref _LastHeartbeatTicks);
                return ticks == 0 ? null : new DateTime(ticks, DateTimeKind.Utc);
            }
        }

        /// <summary>
        /// Pause tolerance for the heartbeat loop, in milliseconds: when more than the heartbeat interval plus this value
        /// passes between two checks, the loop logs the pause and heartbeats at once. Returns 5000 by default; the runtime
        /// module supplies <see cref="RuntimeOptions.PauseGraceMs"/>.
        /// </summary>
        /// <exception cref="ArgumentNullException">Thrown when set to null.</exception>
        public Func<int> PauseGraceMs
        {
            get
            {
                return _PauseGraceMs;
            }
            set
            {
                _PauseGraceMs = value ?? throw new ArgumentNullException(nameof(value));
            }
        }

        /// <summary>
        /// Heartbeats written successfully since the replica started.
        /// </summary>
        public long Heartbeats
        {
            get
            {
                return Interlocked.Read(ref _Heartbeats);
            }
        }

        #endregion

        #region Private-Members

        private readonly ServerContext _Context;
        private readonly string _Name;
        private readonly string _Hostname;
        private readonly string _Address;
        private readonly string? _Backplane;
        private readonly DateTime _StartedUtc = DateTime.UtcNow;
        private readonly string _Header = "[ControlNode] ";
        private readonly long[] _StatusCounts = new long[4];
        private readonly SemaphoreSlim _WriteLock = new SemaphoreSlim(1, 1);
        private Func<int> _ActiveRequests = () => 0;
        private Func<int> _HeartbeatIntervalMs = () => 5000;
        private Func<int> _PauseGraceMs = () => 5000;
        private TimeProvider _Clock = TimeProvider.System;
        private PauseDetector _Pause = new PauseDetector(TimeProvider.System);
        private long _LastHeartbeatTicks = 0;
        private int _PauseCheckMs = 1000;
        private int _Status = (int)ControlNodeStatusEnum.Starting;
        private long _Heartbeats = 0;
        private CancellationTokenSource? _Cts = null;
        private Task? _Loop = null;
        private bool _Stopped = false;
        private bool _Disposed = false;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate and register the <c>garrison.control_nodes</c> gauge (exported to Prometheus as
        /// <c>garrison_control_nodes</c> with a <c>status</c> label).
        /// </summary>
        /// <param name="context">Server context.</param>
        /// <param name="backplane">Name of the event backplane this replica runs, or null.</param>
        /// <exception cref="ArgumentNullException">Thrown when context is null.</exception>
        public ControlNodeService(ServerContext context, string? backplane)
        {
            _Context = context ?? throw new ArgumentNullException(nameof(context));
            NodeId = context.NodeId;
            _Name = context.NodeId;
            _Hostname = ResolveHostname();
            _Address = ResolveAddress(context.Settings.Rest.Hostname, context.Settings.Rest.Port);
            _Backplane = backplane;
            context.Telemetry.Gauge("garrison.control_nodes", ObserveCounts, "{node}");
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Write the row as Starting. Called once the database is migrated, before modules initialize.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task RegisterAsync(CancellationToken token = default)
        {
            await WriteAsync(ControlNodeStatusEnum.Starting, token).ConfigureAwait(false);
            _Context.Logging.Info(_Header + "registered control node " + NodeId + " (" + _Address + ")");
        }

        /// <summary>
        /// Mark the row Ready and start heartbeating. Called once the replica serves requests.
        /// </summary>
        /// <param name="token">Cancellation token that stops the heartbeat loop.</param>
        /// <returns>Task.</returns>
        public async Task StartAsync(CancellationToken token = default)
        {
            await WriteAsync(_Context.IsDraining ? ControlNodeStatusEnum.Draining : ControlNodeStatusEnum.Ready, token).ConfigureAwait(false);
            _Cts = CancellationTokenSource.CreateLinkedTokenSource(token);
            CancellationToken loopToken = _Cts.Token;
            _Loop = Task.Run(() => LoopAsync(loopToken));
        }

        /// <summary>
        /// Write the row as Draining now. Called when shutdown begins; the heartbeat loop also notices on its own.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task MarkDrainingAsync(CancellationToken token = default)
        {
            await WriteAsync(ControlNodeStatusEnum.Draining, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Stop heartbeating and write the row as Offline. Calls after the first do nothing.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task StopAsync(CancellationToken token = default)
        {
            _Cts?.Cancel();
            if (_Loop != null)
            {
                try
                {
                    await _Loop.ConfigureAwait(false);
                }
                catch (OperationCanceledException)
                {
                }
            }
            if (_Stopped) return;
            await WriteAsync(ControlNodeStatusEnum.Offline, token).ConfigureAwait(false);
            _Stopped = true;
            _Context.Logging.Info(_Header + "control node " + NodeId + " is Offline");
        }

        /// <summary>
        /// Write one heartbeat now with the current status and activity. Used by the loop and by tests.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task HeartbeatAsync(CancellationToken token = default)
        {
            ControlNodeStatusEnum status = _Context.IsDraining ? ControlNodeStatusEnum.Draining : ControlNodeStatusEnum.Ready;
            await WriteAsync(status, token).ConfigureAwait(false);
            await RefreshCountsAsync(token).ConfigureAwait(false);
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
                _WriteLock.Dispose();
            }
            _Disposed = true;
        }

        #endregion

        #region Private-Methods

        private async Task LoopAsync(CancellationToken token)
        {
            _Pause.Touch();
            while (!token.IsCancellationRequested)
            {
                int interval = Math.Clamp(_HeartbeatIntervalMs(), 1000, 60000);
                try
                {
                    await WaitForBeatAsync(interval, token).ConfigureAwait(false);
                }
                catch (OperationCanceledException)
                {
                    return;
                }

                try
                {
                    await HeartbeatAsync(token).ConfigureAwait(false);
                }
                catch (OperationCanceledException)
                {
                    return;
                }
                catch (Exception e)
                {
                    _Context.Logging.Warn(_Header + "heartbeat failed: " + e.Message);
                }
                _Pause.Touch();
            }
        }

        private async Task WaitForBeatAsync(int interval, CancellationToken token)
        {
            // Sleep in short slices so a pause (host sleep, frozen VM, clock jump) is noticed on resume and the row is
            // heartbeated at once instead of after the rest of the interval (P3.16). Shutdown also wakes the loop, so the
            // row shows Draining without waiting for the next beat.
            int waited = 0;
            while (waited < interval)
            {
                int slice = Math.Min(_PauseCheckMs, interval - waited);
                bool wasDraining = _Context.IsDraining;
                using (CancellationTokenSource wake = CancellationTokenSource.CreateLinkedTokenSource(token, _Context.Stopping))
                {
                    try
                    {
                        await Task.Delay(slice, wasDraining ? token : wake.Token).ConfigureAwait(false);
                    }
                    catch (OperationCanceledException) when (!token.IsCancellationRequested)
                    {
                        return;
                    }
                }
                waited += slice;
                TimeSpan paused = _Pause.Observe(slice, Math.Max(1000, _PauseGraceMs()));
                if (paused > TimeSpan.Zero)
                {
                    _Context.Logging.Warn(_Header + "control node " + NodeId + " was paused for " + Math.Round(paused.TotalSeconds, 1) + " s; heartbeating now event=controlnode.pause pausedMs=" + (long)paused.TotalMilliseconds + " resumedUtc=" + _Pause.UtcNow.ToString("o"));
                    return;
                }
            }
        }

        private async Task WriteAsync(ControlNodeStatusEnum status, CancellationToken token)
        {
            if (_Disposed) return;
            bool offline = status == ControlNodeStatusEnum.Offline;
            ControlNode row = new ControlNode();
            row.Id = NodeId;
            row.Name = _Name;
            row.Hostname = _Hostname;
            row.Address = _Address;
            row.Version = Constants.ProductVersion;
            row.SchemaVersion = _Context.Database.SchemaVersion;
            row.Backplane = _Backplane;
            row.Status = status;
            row.StartedUtc = _StartedUtc;
            row.LastHeartbeatUtc = _Clock.GetUtcNow().UtcDateTime;
            row.ActiveRequests = offline ? 0 : _ActiveRequests();
            row.OpenStreams = offline ? 0 : _Context.Activity.OpenStreams;
            row.HeldLongPolls = offline ? 0 : _Context.Activity.HeldLongPolls;

            await _WriteLock.WaitAsync(token).ConfigureAwait(false);
            try
            {
                // Once Offline has been written, nothing (a late heartbeat) may bring the row back.
                if (_Stopped) return;
                await _Context.Database.ControlNodes.UpsertAsync(row, token).ConfigureAwait(false);
                Interlocked.Exchange(ref _Status, (int)status);
                Interlocked.Increment(ref _Heartbeats);
                if (!offline) Interlocked.Exchange(ref _LastHeartbeatTicks, row.LastHeartbeatUtc.Ticks);
            }
            catch (Exception e) when (e is not OperationCanceledException)
            {
                _Context.Logging.Warn(_Header + "could not write control node " + NodeId + " as " + status + ": " + e.Message);
            }
            finally
            {
                _WriteLock.Release();
            }
        }

        private async Task RefreshCountsAsync(CancellationToken token)
        {
            List<StatusCount> counts = await _Context.Database.ControlNodes.CountByStatusAsync(token).ConfigureAwait(false);
            foreach (ControlNodeStatusEnum status in Enum.GetValues<ControlNodeStatusEnum>())
            {
                long count = counts.Where(c => String.Equals(c.Status, status.ToString(), StringComparison.Ordinal)).Sum(c => c.Count);
                Interlocked.Exchange(ref _StatusCounts[(int)status], count);
            }
        }

        private List<Measurement<double>> ObserveCounts()
        {
            List<Measurement<double>> measurements = new List<Measurement<double>>();
            foreach (ControlNodeStatusEnum status in Enum.GetValues<ControlNodeStatusEnum>())
            {
                measurements.Add(new Measurement<double>(Interlocked.Read(ref _StatusCounts[(int)status]), new KeyValuePair<string, object?>("status", status.ToString())));
            }
            return measurements;
        }

        private static string ResolveHostname()
        {
            try
            {
                string host = Dns.GetHostName();
                if (!String.IsNullOrWhiteSpace(host)) return host;
            }
            catch (SocketException)
            {
            }
            return Environment.MachineName;
        }

        private static string ResolveAddress(string configuredHost, int port)
        {
            bool wildcard = String.IsNullOrWhiteSpace(configuredHost) || configuredHost == "*" || configuredHost == "+" || configuredHost == "0.0.0.0" || configuredHost == "::";
            if (!wildcard) return configuredHost + ":" + port;
            try
            {
                IPAddress? address = Dns.GetHostAddresses(Dns.GetHostName())
                    .FirstOrDefault(a => a.AddressFamily == AddressFamily.InterNetwork && !IPAddress.IsLoopback(a));
                if (address != null) return address + ":" + port;
            }
            catch (SocketException)
            {
            }
            catch (ArgumentException)
            {
            }
            return "127.0.0.1:" + port;
        }

        #endregion
    }
}
