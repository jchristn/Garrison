namespace Garrison.Core.Keepers
{
    using System;

    /// <summary>
    /// Result of scheduling a keeper's next timer wake (AA1.6).
    /// </summary>
    public class KeeperIntervalResult
    {
        #region Public-Members

        /// <summary>
        /// Interval in seconds to keep as the mandate's current interval (the base for the next backoff step). Not changed
        /// by a tick's requested next wake.
        /// </summary>
        public int IntervalSeconds { get; set; } = 0;

        /// <summary>
        /// Interval in seconds used for this wake before jitter: the requested next wake clamped to the revision bounds
        /// when the tick asked for one, otherwise <see cref="IntervalSeconds"/>.
        /// </summary>
        public int AppliedIntervalSeconds { get; set; } = 0;

        /// <summary>
        /// Random seconds added to the applied interval, from 0 up to the jitter percent of it.
        /// </summary>
        public int JitterSeconds { get; set; } = 0;

        /// <summary>
        /// Quiet ticks in a row after this tick.
        /// </summary>
        public int ConsecutiveQuietTicks { get; set; } = 0;

        /// <summary>
        /// When the next timer wake is due (UTC).
        /// </summary>
        public DateTime NextWakeUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public KeeperIntervalResult()
        {
        }

        #endregion
    }
}
