namespace Garrison.Core.Keepers
{
    using System;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// Computes a keeper's next timer wake after a tick (AA1.6, AA-014). Pure apart from the injected random source:
    /// <list type="bullet">
    /// <item>Fixed mode always uses the revision's minimum interval.</item>
    /// <item>Backoff mode multiplies the current interval by the backoff factor after a Quiet tick (up to the maximum),
    /// keeps it after Acted and Unreported, and returns to the minimum after Attention, Escalated, Failed, and Skipped.</item>
    /// <item>A requested next wake replaces the interval for this wake only, clamped to the revision's bounds.</item>
    /// <item>Jitter is applied last: 0 to the jitter percent of the applied interval is added.</item>
    /// </list>
    /// Thread-safe when the random source is.
    /// </summary>
    public class KeeperIntervalCalculator
    {
        #region Public-Members

        /// <summary>
        /// Jitter percent used when a revision sets none. Minimum 0, maximum 50, default 10 (Autonomy.DefaultJitterPercent).
        /// </summary>
        public int DefaultJitterPercent
        {
            get
            {
                return _DefaultJitterPercent;
            }
            set
            {
                _DefaultJitterPercent = Math.Clamp(value, 0, 50);
            }
        }

        #endregion

        #region Private-Members

        private readonly Func<double> _Random;
        private int _DefaultJitterPercent = 10;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate with the shared random source.
        /// </summary>
        public KeeperIntervalCalculator() : this(() => System.Random.Shared.NextDouble())
        {
        }

        /// <summary>
        /// Instantiate with a random source (for tests).
        /// </summary>
        /// <param name="random">Returns a value in [0, 1).</param>
        /// <exception cref="ArgumentNullException">Thrown when random is null.</exception>
        public KeeperIntervalCalculator(Func<double> random)
        {
            _Random = random ?? throw new ArgumentNullException(nameof(random));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Compute the schedule after a tick.
        /// </summary>
        /// <param name="revision">Revision the mandate runs under.</param>
        /// <param name="currentIntervalSeconds">Mandate's current interval; 0 or less means not set (the minimum is used).</param>
        /// <param name="consecutiveQuietTicks">Quiet ticks in a row before this tick.</param>
        /// <param name="outcome">Tick outcome.</param>
        /// <param name="requestedNextWakeSeconds">Next wake the tick asked for, or null.</param>
        /// <param name="nowUtc">Current time (UTC).</param>
        /// <returns>Result.</returns>
        /// <exception cref="ArgumentNullException">Thrown when revision is null.</exception>
        public KeeperIntervalResult Next(MandateRevision revision, int currentIntervalSeconds, int consecutiveQuietTicks, TickOutcomeEnum outcome, int? requestedNextWakeSeconds, DateTime nowUtc)
        {
            if (revision == null) throw new ArgumentNullException(nameof(revision));
            int minimum = revision.MinIntervalSeconds;
            int maximum = Math.Max(minimum, revision.MaxIntervalSeconds);
            int current = currentIntervalSeconds > 0 ? Math.Clamp(currentIntervalSeconds, minimum, maximum) : minimum;

            int interval;
            if (revision.WakeMode == WakeModeEnum.Fixed)
            {
                interval = minimum;
            }
            else
            {
                switch (outcome)
                {
                    case TickOutcomeEnum.Quiet:
                        double grown = Math.Ceiling(current * revision.BackoffFactor);
                        interval = grown >= maximum ? maximum : Math.Max(minimum, (int)grown);
                        break;
                    case TickOutcomeEnum.Acted:
                    case TickOutcomeEnum.Unreported:
                        interval = current;
                        break;
                    default:
                        interval = minimum;
                        break;
                }
            }

            int applied = requestedNextWakeSeconds.HasValue ? Math.Clamp(requestedNextWakeSeconds.Value, minimum, maximum) : interval;
            return Schedule(revision, interval, applied, outcome == TickOutcomeEnum.Quiet ? consecutiveQuietTicks + 1 : 0, nowUtc);
        }

        /// <summary>
        /// Compute the first schedule of a mandate that starts (or restarts) under a revision: the minimum interval, no
        /// quiet ticks, and the first wake at a given time without jitter.
        /// </summary>
        /// <param name="revision">Revision.</param>
        /// <param name="firstWakeUtc">When the first tick should start.</param>
        /// <returns>Result.</returns>
        /// <exception cref="ArgumentNullException">Thrown when revision is null.</exception>
        public KeeperIntervalResult Start(MandateRevision revision, DateTime firstWakeUtc)
        {
            if (revision == null) throw new ArgumentNullException(nameof(revision));
            KeeperIntervalResult result = new KeeperIntervalResult();
            result.IntervalSeconds = revision.MinIntervalSeconds;
            result.AppliedIntervalSeconds = 0;
            result.JitterSeconds = 0;
            result.ConsecutiveQuietTicks = 0;
            result.NextWakeUtc = firstWakeUtc;
            return result;
        }

        #endregion

        #region Private-Methods

        private KeeperIntervalResult Schedule(MandateRevision revision, int interval, int applied, int quiet, DateTime nowUtc)
        {
            int percent = revision.JitterPercent ?? _DefaultJitterPercent;
            double sample = Math.Clamp(_Random(), 0.0, 1.0);
            int jitter = percent <= 0 ? 0 : (int)Math.Floor(applied * (percent / 100.0) * sample);
            KeeperIntervalResult result = new KeeperIntervalResult();
            result.IntervalSeconds = interval;
            result.AppliedIntervalSeconds = applied;
            result.JitterSeconds = jitter;
            result.ConsecutiveQuietTicks = quiet;
            result.NextWakeUtc = nowUtc.AddSeconds(applied + jitter);
            return result;
        }

        #endregion
    }
}
