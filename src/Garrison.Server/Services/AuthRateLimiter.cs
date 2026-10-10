namespace Garrison.Server.Services
{
    using System;
    using System.Collections.Concurrent;
    using System.Collections.Generic;

    /// <summary>
    /// Fixed-window rate limiter for authentication routes, keyed by source IP. Per replica. Thread-safe.
    /// </summary>
    public class AuthRateLimiter
    {
        #region Private-Members

        private readonly ConcurrentDictionary<string, int[]> _Windows = new ConcurrentDictionary<string, int[]>(StringComparer.Ordinal);
        private readonly Func<int> _LimitPerMinute;
        private long _CurrentMinute = 0;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="limitPerMinute">Callback returning the current limit, so settings changes apply live.</param>
        /// <exception cref="ArgumentNullException">Thrown when limitPerMinute is null.</exception>
        public AuthRateLimiter(Func<int> limitPerMinute)
        {
            _LimitPerMinute = limitPerMinute ?? throw new ArgumentNullException(nameof(limitPerMinute));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Count an attempt. Returns false when the caller exceeded the limit for the current minute.
        /// </summary>
        /// <param name="key">Caller key, normally the source IP.</param>
        /// <returns>True when allowed.</returns>
        public bool TryAcquire(string? key)
        {
            string k = String.IsNullOrEmpty(key) ? "unknown" : key;
            long minute = DateTime.UtcNow.Ticks / TimeSpan.TicksPerMinute;
            if (minute != System.Threading.Interlocked.Read(ref _CurrentMinute))
            {
                System.Threading.Interlocked.Exchange(ref _CurrentMinute, minute);
                _Windows.Clear();
            }
            int[] counter = _Windows.GetOrAdd(k, _ => new int[1]);
            int count = System.Threading.Interlocked.Increment(ref counter[0]);
            return count <= _LimitPerMinute();
        }

        #endregion
    }
}
