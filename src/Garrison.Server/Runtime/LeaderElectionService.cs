namespace Garrison.Server.Runtime
{
    using System;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core;
    using Garrison.Core.Database;
    using Garrison.Core.Models;
    using Garrison.Core.Services;
    using Garrison.Core.Telemetry;
    using SyslogLogging;

    /// <summary>
    /// Elects one control-plane replica as the maintenance leader through an epoch-fenced database lease. Thread-safe.
    /// </summary>
    public class LeaderElectionService : ILeaderState, IDisposable
    {
        #region Public-Members

        /// <inheritdoc />
        public bool IsLeader
        {
            get
            {
                return Interlocked.Read(ref _Epoch) > 0 && DateTime.UtcNow < new DateTime(Interlocked.Read(ref _ValidUntilTicks), DateTimeKind.Utc);
            }
        }

        /// <inheritdoc />
        public long Epoch
        {
            get
            {
                return IsLeader ? Interlocked.Read(ref _Epoch) : 0;
            }
        }

        /// <summary>
        /// Holder identity of this replica.
        /// </summary>
        public string Holder { get; }

        #endregion

        #region Private-Members

        private readonly ILeaseProvider _Leases;
        private readonly RuntimeOptions _Options;
        private readonly LoggingModule _Logging;
        private readonly string _Header = "[Leader] ";
        private CancellationTokenSource? _Cts = null;
        private Task? _Loop = null;
        private long _Epoch = 0;
        private long _ValidUntilTicks = 0;
        private readonly GaugeRegistration _LeaderGauge;
        private bool _Disposed = false;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="options">Runtime options.</param>
        /// <param name="logging">Logging.</param>
        /// <param name="nodeId">Replica identifier.</param>
        /// <param name="leaseProvider">Optional provider; null retains database coordination.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public LeaderElectionService(DatabaseDriverBase database, RuntimeOptions options, LoggingModule logging, string nodeId, ILeaseProvider? leaseProvider = null)
        {
            if (database == null) throw new ArgumentNullException(nameof(database));
            _Leases = leaseProvider ?? new DatabaseLeaseProvider(database.CoordinationLeases);
            _Options = options ?? throw new ArgumentNullException(nameof(options));
            _Logging = logging ?? throw new ArgumentNullException(nameof(logging));
            Holder = (String.IsNullOrEmpty(nodeId) ? "command" : nodeId) + ":" + Guid.NewGuid().ToString("N").Substring(0, 8);
            _LeaderGauge = GarrisonMetrics.RegisterGauge(GarrisonMetricCatalog.IsLeader, () => IsLeader ? 1 : 0);
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Start campaigning.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        public void Start(CancellationToken token)
        {
            _Cts = CancellationTokenSource.CreateLinkedTokenSource(token);
            _Loop = Task.Run(() => LoopAsync(_Cts.Token));
        }

        /// <summary>
        /// Stop campaigning and release the lease.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task StopAsync(CancellationToken token)
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
            if (Interlocked.Read(ref _Epoch) > 0)
            {
                try
                {
                    await _Leases.ReleaseAsync(Constants.LeaderLeaseName, Holder, token).ConfigureAwait(false);
                }
                catch (Exception e) when (e is not OperationCanceledException)
                {
                    _Logging.Debug(_Header + "release failed: " + e.Message);
                }
            }
            Interlocked.Exchange(ref _Epoch, 0);
        }

        /// <summary>
        /// Read the leader lease from the database and return it when a replica holds it and it has not expired, so any
        /// replica can tell which replica leads (P10.19).
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The held, unexpired lease, or null when no replica leads.</returns>
        /// <exception cref="ArgumentNullException">Thrown when database is null.</exception>
        public static async Task<CoordinationLease?> ReadCurrentLeaseAsync(DatabaseDriverBase database, CancellationToken token = default)
        {
            if (database == null) throw new ArgumentNullException(nameof(database));
            CoordinationLease? lease = await database.CoordinationLeases.ReadByNameAsync(Constants.LeaderLeaseName, token).ConfigureAwait(false);
            if (lease == null || String.IsNullOrEmpty(lease.Holder) || lease.Epoch <= 0) return null;
            if (!lease.ExpiresUtc.HasValue || lease.ExpiresUtc.Value <= DateTime.UtcNow) return null;
            return lease;
        }

        /// <summary>
        /// Node ID part of a lease holder identity (holders are the node ID, a colon, and a per-process suffix).
        /// </summary>
        /// <param name="holder">Holder identity, or null.</param>
        /// <returns>Node ID, or null when holder is null or empty.</returns>
        public static string? NodeIdFromHolder(string? holder)
        {
            if (String.IsNullOrEmpty(holder)) return null;
            int colon = holder.LastIndexOf(':');
            return colon > 0 ? holder.Substring(0, colon) : holder;
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
                _LeaderGauge.Dispose();
            }
            _Disposed = true;
        }

        #endregion

        #region Private-Methods

        private async Task<bool> CampaignAsync(CancellationToken token)
        {
            DateTime attempted = DateTime.UtcNow;
            long? epoch = await _Leases.TryAcquireAsync(Constants.LeaderLeaseName, Holder, _Options.LeaderLeaseMs, token).ConfigureAwait(false);
            long previous = Interlocked.Read(ref _Epoch);
            if (epoch.HasValue)
            {
                Interlocked.Exchange(ref _ValidUntilTicks, attempted.AddMilliseconds(_Options.LeaderLeaseMs * 0.8).Ticks);
                Interlocked.Exchange(ref _Epoch, epoch.Value);
                if (previous == 0)
                {
                    GarrisonMetrics.Count(GarrisonMetricCatalog.LeaderChanges, "role", "acquired");
                    _Logging.Info(_Header + Holder + " became leader at epoch " + epoch.Value + " " + GarrisonTracing.LogFields("node", Holder));
                    return true;
                }
            }
            else
            {
                Interlocked.Exchange(ref _Epoch, 0);
                if (previous > 0)
                {
                    GarrisonMetrics.Count(GarrisonMetricCatalog.LeaderChanges, "role", "lost");
                    _Logging.Info(_Header + Holder + " lost leadership " + GarrisonTracing.LogFields("node", Holder));
                    return true;
                }
            }
            return false;
        }

        private async Task LoopAsync(CancellationToken token)
        {
            while (!token.IsCancellationRequested)
            {
                try
                {
                    await GarrisonTracing.BackgroundAsync("leader_election", "campaign", CampaignAsync, token).ConfigureAwait(false);
                }
                catch (Exception e) when (e is not OperationCanceledException)
                {
                    _Logging.Warn(_Header + "campaign failed: " + e.Message);
                    Interlocked.Exchange(ref _Epoch, 0);
                }

                await Task.Delay(Math.Max(1000, _Options.LeaderLeaseMs / 3), token).ConfigureAwait(false);
            }
        }

        #endregion
    }
}
