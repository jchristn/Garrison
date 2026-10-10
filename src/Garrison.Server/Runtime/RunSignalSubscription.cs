namespace Garrison.Server.Runtime
{
    using System;
    using System.Threading;
    using System.Threading.Tasks;

    /// <summary>
    /// One waiter's hold on a run's signal. Dispose to release it. Not thread-safe; use from one waiter.
    /// </summary>
    public class RunSignalSubscription : IDisposable
    {
        #region Public-Members

        /// <summary>
        /// Run identifier.
        /// </summary>
        public string RunId { get; }

        /// <summary>
        /// Signal.
        /// </summary>
        public AsyncSignal Signal { get; }

        #endregion

        #region Private-Members

        private readonly RunSignals _Owner;
        private long _SeenVersion = 0;
        private bool _Disposed = false;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate. Use <see cref="RunSignals.Subscribe"/>.
        /// </summary>
        /// <param name="owner">Owner.</param>
        /// <param name="runId">Run identifier.</param>
        /// <param name="signal">Signal.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public RunSignalSubscription(RunSignals owner, string runId, AsyncSignal signal)
        {
            _Owner = owner ?? throw new ArgumentNullException(nameof(owner));
            RunId = runId ?? throw new ArgumentNullException(nameof(runId));
            Signal = signal ?? throw new ArgumentNullException(nameof(signal));
            _SeenVersion = signal.Version;
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Wait for a signal or the timeout. A signal that fired since the previous wait returned (or since the
        /// subscription was taken) returns at once, so a change made while the caller was reading is never slept through.
        /// </summary>
        /// <param name="timeoutMs">Timeout in milliseconds.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when signaled, false on timeout.</returns>
        public async Task<bool> WaitAsync(int timeoutMs, CancellationToken token = default)
        {
            long since = _SeenVersion;
            _SeenVersion = Signal.Version;
            if (_SeenVersion != since) return true;
            bool signaled = await Signal.WaitAsync(since, timeoutMs, token).ConfigureAwait(false);
            _SeenVersion = Signal.Version;
            return signaled;
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
            if (disposing) _Owner.Release(RunId);
            _Disposed = true;
        }

        #endregion
    }
}
