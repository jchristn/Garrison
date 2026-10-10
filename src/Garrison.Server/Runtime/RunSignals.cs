namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Concurrent;

    /// <summary>
    /// Per-run and global signals used to wake waiters on this replica early. Waiters always re-read the database, so
    /// changes made on other replicas are still observed on the next poll. Thread-safe.
    /// </summary>
    public class RunSignals
    {
        #region Public-Members

        /// <summary>
        /// Signaled when new runs are queued on this replica.
        /// </summary>
        public AsyncSignal QueueChanged { get; } = new AsyncSignal();

        #endregion

        #region Private-Members

        private readonly ConcurrentDictionary<string, AsyncSignal> _Runs = new ConcurrentDictionary<string, AsyncSignal>(StringComparer.Ordinal);

        #endregion

        #region Public-Methods

        /// <summary>
        /// Signal for a run (status change or new events).
        /// </summary>
        /// <param name="runId">Run identifier.</param>
        /// <returns>Signal.</returns>
        public AsyncSignal For(string runId)
        {
            return _Runs.GetOrAdd(runId, _ => new AsyncSignal());
        }

        /// <summary>
        /// Wake waiters for a run.
        /// </summary>
        /// <param name="runId">Run identifier.</param>
        public void Notify(string runId)
        {
            if (_Runs.TryGetValue(runId, out AsyncSignal? signal)) signal.Signal();
        }

        /// <summary>
        /// Forget a finished run's signal after waking its waiters.
        /// </summary>
        /// <param name="runId">Run identifier.</param>
        public void Complete(string runId)
        {
            if (_Runs.TryRemove(runId, out AsyncSignal? signal)) signal.Signal();
        }

        #endregion
    }
}
