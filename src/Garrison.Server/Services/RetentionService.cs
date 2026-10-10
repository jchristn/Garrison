namespace Garrison.Server.Services
{
    using System;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using SyslogLogging;

    /// <summary>
    /// Periodically prunes request history, audit records, and expired sessions according to cluster settings.
    /// Pruning is idempotent, so running it on every replica is safe until leader election gates it. Thread-safe.
    /// </summary>
    public class RetentionService
    {
        #region Public-Members

        /// <summary>
        /// Interval between passes in milliseconds. Minimum 60000, maximum 86400000, default 3600000.
        /// </summary>
        public int IntervalMs
        {
            get
            {
                return _IntervalMs;
            }
            set
            {
                _IntervalMs = Math.Clamp(value, 60000, 86400000);
            }
        }

        /// <summary>
        /// Optional predicate; when it returns false the pass is skipped (for example, not the leader).
        /// </summary>
        public Func<bool>? ShouldRun { get; set; } = null;

        #endregion

        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly ClusterSettingsService _Cluster;
        private readonly LoggingModule _Logging;
        private int _IntervalMs = 3600000;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="cluster">Cluster settings.</param>
        /// <param name="logging">Logging.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public RetentionService(DatabaseDriverBase database, ClusterSettingsService cluster, LoggingModule logging)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Cluster = cluster ?? throw new ArgumentNullException(nameof(cluster));
            _Logging = logging ?? throw new ArgumentNullException(nameof(logging));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Run one pruning pass.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Total rows pruned.</returns>
        public async Task<int> PruneOnceAsync(CancellationToken token = default)
        {
            DateTime now = DateTime.UtcNow;
            int total = 0;
            total += await _Database.RequestHistory.PruneAsync(now.AddDays(-_Cluster.GetInt("RequestHistory.RetentionDays")), token).ConfigureAwait(false);
            total += await _Database.Audit.PruneAsync(now.AddDays(-_Cluster.GetInt("Audit.RetentionDays")), token).ConfigureAwait(false);
            total += await _Database.Sessions.PruneExpiredAsync(now.AddDays(-1), token).ConfigureAwait(false);
            return total;
        }

        /// <summary>
        /// Prune on an interval until cancelled.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task RunAsync(CancellationToken token)
        {
            while (!token.IsCancellationRequested)
            {
                try
                {
                    await Task.Delay(_IntervalMs, token).ConfigureAwait(false);
                    if (ShouldRun != null && !ShouldRun()) continue;
                    int pruned = await PruneOnceAsync(token).ConfigureAwait(false);
                    if (pruned > 0) _Logging.Info("[Retention] pruned " + pruned + " rows");
                }
                catch (OperationCanceledException)
                {
                    return;
                }
                catch (Exception e)
                {
                    _Logging.Warn("[Retention] pass failed: " + e.Message);
                }
            }
        }

        #endregion
    }
}
