namespace Garrison.Server.Runtime
{
    using System;
    using System.Threading;
    using System.Threading.Tasks;

    /// <summary>
    /// Wakes every current waiter when signaled. Waiters that arrive after a signal wait for the next one. Thread-safe.
    /// </summary>
    public class AsyncSignal
    {
        #region Private-Members

        private TaskCompletionSource<bool> _Current = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
        private readonly object _Lock = new object();

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
            if (timeoutMs <= 0) return waiter.IsCompleted;
            Task completed = await Task.WhenAny(waiter, Task.Delay(timeoutMs, token)).ConfigureAwait(false);
            token.ThrowIfCancellationRequested();
            return completed == waiter;
        }

        #endregion
    }
}
