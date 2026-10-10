namespace Garrison.Server.Runtime
{
    using System;
    using System.Threading;
    using System.Threading.Tasks;

    /// <summary>
    /// Wakes every current waiter when signaled. Waiters that arrive after a signal wait for the next one, unless they
    /// pass the <see cref="Version"/> they last saw, in which case a signal they missed in between returns at once.
    /// Thread-safe.
    /// </summary>
    public class AsyncSignal
    {
        #region Public-Members

        /// <summary>
        /// Number of signals so far.
        /// </summary>
        public long Version
        {
            get
            {
                return Interlocked.Read(ref _Version);
            }
        }

        #endregion

        #region Private-Members

        private TaskCompletionSource<bool> _Current = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
        private readonly object _Lock = new object();
        private long _Version = 0;

        #endregion

        #region Public-Methods

        /// <summary>
        /// Wake all current waiters.
        /// </summary>
        public void Signal()
        {
            TaskCompletionSource<bool> previous;
            lock (_Lock)
            {
                previous = _Current;
                _Current = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
                Interlocked.Increment(ref _Version);
            }
            previous.TrySetResult(true);
        }

        /// <summary>
        /// Wait for the next signal or the timeout.
        /// </summary>
        /// <param name="timeoutMs">Timeout in milliseconds.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when signaled, false on timeout.</returns>
        public async Task<bool> WaitAsync(int timeoutMs, CancellationToken token = default)
        {
            Task waiter;
            lock (_Lock)
            {
                waiter = _Current.Task;
            }
            return await WaitForAsync(waiter, timeoutMs, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Wait for a signal after a version, or the timeout. Returns at once when the signal fired since that version.
        /// </summary>
        /// <param name="sinceVersion">The <see cref="Version"/> the caller last observed.</param>
        /// <param name="timeoutMs">Timeout in milliseconds.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when signaled, false on timeout.</returns>
        public async Task<bool> WaitAsync(long sinceVersion, int timeoutMs, CancellationToken token = default)
        {
            Task waiter;
            lock (_Lock)
            {
                if (Interlocked.Read(ref _Version) != sinceVersion) return true;
                waiter = _Current.Task;
            }
            return await WaitForAsync(waiter, timeoutMs, token).ConfigureAwait(false);
        }

        #endregion

        #region Private-Methods

        private static async Task<bool> WaitForAsync(Task waiter, int timeoutMs, CancellationToken token)
        {
            if (timeoutMs <= 0) return waiter.IsCompleted;
            try
            {
                await waiter.WaitAsync(TimeSpan.FromMilliseconds(timeoutMs), token).ConfigureAwait(false);
                return true;
            }
            catch (TimeoutException)
            {
                return false;
            }
        }

        #endregion
    }
}
