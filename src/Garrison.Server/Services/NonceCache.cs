namespace Garrison.Server.Services
{
    using System;
    using System.Collections.Concurrent;
    using System.Collections.Generic;

    /// <summary>
    /// Remembers signed-request nonces for a replay window. Per replica (Phase 10 moves this to the database). Thread-safe.
    /// </summary>
    public class NonceCache
    {
        #region Public-Members

        /// <summary>
        /// Replay window in seconds. Minimum 10, maximum 86400, default 600.
        /// </summary>
        public int WindowSeconds
        {
            get
            {
                return _WindowSeconds;
            }
            set
            {
                _WindowSeconds = Math.Clamp(value, 10, 86400);
            }
        }

        #endregion

        #region Private-Members

        private readonly ConcurrentDictionary<string, DateTime> _Seen = new ConcurrentDictionary<string, DateTime>(StringComparer.Ordinal);
        private int _WindowSeconds = 600;
        private DateTime _LastSweepUtc = DateTime.UtcNow;

        #endregion

        #region Public-Methods

        /// <summary>
        /// Record a nonce. Returns false when it was already seen inside the window.
        /// </summary>
        /// <param name="key">Nonce key (access key plus nonce).</param>
        /// <returns>True when the nonce is fresh.</returns>
        public bool TryUse(string key)
        {
            if (String.IsNullOrEmpty(key)) return false;
            DateTime now = DateTime.UtcNow;
            Sweep(now);
            return _Seen.TryAdd(key, now);
        }

        #endregion

        #region Private-Methods

        private void Sweep(DateTime now)
        {
            if ((now - _LastSweepUtc).TotalSeconds < 30) return;
            _LastSweepUtc = now;
            List<string> expired = new List<string>();
            foreach (KeyValuePair<string, DateTime> entry in _Seen)
            {
                if ((now - entry.Value).TotalSeconds > _WindowSeconds) expired.Add(entry.Key);
            }
            foreach (string key in expired) _Seen.TryRemove(key, out DateTime _);
        }

        #endregion
    }
}
