namespace Garrison.Server.Runtime
{
    using System;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core;
    using Garrison.Core.Database;
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

        private readonly DatabaseDriverBase _Database;
        private readonly RuntimeOptions _Options;
        private readonly LoggingModule _Logging;
        private readonly string _Header = "[Leader] ";
        private CancellationTokenSource? _Cts = null;
        private Task? _Loop = null;
        private long _Epoch = 0;
        private long _ValidUntilTicks = 0;
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
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public LeaderElectionService(DatabaseDriverBase database, RuntimeOptions options, LoggingModule logging, string nodeId)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Options = options ?? throw new ArgumentNullException(nameof(options));
            _Logging = logging ?? throw new ArgumentNullException(nameof(logging));
            Holder = (String.IsNullOrEmpty(nodeId) ? "command" : nodeId) + ":" + Guid.NewGuid().ToString("N").Substring(0, 8);
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
                    await _Database.CoordinationLeases.ReleaseAsync(Constants.LeaderLeaseName, Holder, token).ConfigureAwait(false);
                }
                catch (Exception e) when (e is not OperationCanceledException)
                {
                    _Logging.Debug(_Header + "release failed: " + e.Message);
                }
            }
            Interlocked.Exchange(ref _Epoch, 0);
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
                    DateTime attempted = DateTime.UtcNow;
                    long? epoch = await _Database.CoordinationLeases.TryAcquireAsync(Constants.LeaderLeaseName, Holder, _Options.LeaderLeaseMs, token).ConfigureAwait(false);
                    long previous = Interlocked.Read(ref _Epoch);
                    if (epoch.HasValue)
                    {
                        Interlocked.Exchange(ref _ValidUntilTicks, attempted.AddMilliseconds(_Options.LeaderLeaseMs * 0.8).Ticks);
                        Interlocked.Exchange(ref _Epoch, epoch.Value);
                        if (previous == 0) _Logging.Info(_Header + Holder + " became leader at epoch " + epoch.Value);
                    }
                    else
                    {
                        Interlocked.Exchange(ref _Epoch, 0);
                        if (previous > 0) _Logging.Info(_Header + Holder + " lost leadership");
                    }
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
