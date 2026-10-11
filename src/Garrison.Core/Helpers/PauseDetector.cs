namespace Garrison.Core.Helpers
{
    using System;
    using System.Threading;

    /// <summary>
    /// Detects that a loop was paused (the host slept, the container or VM was frozen, the wall clock jumped forward, or
    /// a very long garbage collection ran) by comparing the wall-clock time since the previous observation with the
    /// time the loop expected to take. Used by the control plane's maintenance loop and by the worker's heartbeat loop
    /// (P3.16). Time comes from an injectable <see cref="TimeProvider"/>, so tests can simulate a pause
    /// deterministically. Thread-safe.
    /// </summary>
    public class PauseDetector
    {
        #region Public-Members

        /// <summary>
        /// Clock used for every observation. Never null.
        /// </summary>
        public TimeProvider Clock
        {
            get
            {
                return _Clock;
            }
        }

        /// <summary>
        /// Current UTC time from <see cref="Clock"/>.
        /// </summary>
        public DateTime UtcNow
        {
            get
            {
                return _Clock.GetUtcNow().UtcDateTime;
            }
        }

        /// <summary>
        /// Time of the previous observation, or null before the first.
        /// </summary>
        public DateTime? LastObservedUtc
        {
            get
            {
                long ticks = Interlocked.Read(ref _LastTicks);
                return ticks == 0 ? null : new DateTime(ticks, DateTimeKind.Utc);
            }
        }

        /// <summary>
        /// Time the most recent pause ended (the observation that detected it), or null when no pause was detected.
        /// </summary>
        public DateTime? LastResumedUtc
        {
            get
            {
                long ticks = Interlocked.Read(ref _ResumedTicks);
                return ticks == 0 ? null : new DateTime(ticks, DateTimeKind.Utc);
            }
        }

        /// <summary>
        /// Length of the most recent pause (the gap minus the expected interval), or zero when no pause was detected.
        /// </summary>
        public TimeSpan LastPause
        {
            get
            {
                return TimeSpan.FromTicks(Interlocked.Read(ref _PauseTicks));
            }
        }

        /// <summary>
        /// Pauses detected since this detector was created.
        /// </summary>
        public long PausesDetected
        {
            get
            {
                return Interlocked.Read(ref _Pauses);
            }
        }

        #endregion

        #region Private-Members

        private readonly TimeProvider _Clock;
        private long _LastTicks = 0;
        private long _ResumedTicks = 0;
        private long _PauseTicks = 0;
        private long _Pauses = 0;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate with the system clock.
        /// </summary>
        public PauseDetector() : this(TimeProvider.System)
        {
        }

        /// <summary>
        /// Instantiate with a clock.
        /// </summary>
        /// <param name="clock">Clock.</param>
        /// <exception cref="ArgumentNullException">Thrown when clock is null.</exception>
        public PauseDetector(TimeProvider clock)
        {
            _Clock = clock ?? throw new ArgumentNullException(nameof(clock));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Record an observation now and report whether the loop was paused since the previous one. A pause is a gap
        /// longer than <paramref name="expectedIntervalMs"/> plus <paramref name="graceMs"/>. The first observation
        /// never reports a pause.
        /// </summary>
        /// <param name="expectedIntervalMs">Time the loop expected to pass since the previous observation, in
        /// milliseconds (its sleep interval, or 0 between steps of one pass). Negative values are treated as 0.</param>
        /// <param name="graceMs">Extra time tolerated before the gap counts as a pause, in milliseconds. Negative values
        /// are treated as 0.</param>
        /// <returns>The paused time (the gap minus the expected interval) when a pause was detected, otherwise
        /// <see cref="TimeSpan.Zero"/>.</returns>
        public TimeSpan Observe(int expectedIntervalMs, int graceMs)
        {
            DateTime now = UtcNow;
            long previous = Interlocked.Exchange(ref _LastTicks, now.Ticks);
            if (previous == 0) return TimeSpan.Zero;

            TimeSpan gap = now - new DateTime(previous, DateTimeKind.Utc);
            TimeSpan expected = TimeSpan.FromMilliseconds(Math.Max(0, expectedIntervalMs));
            TimeSpan grace = TimeSpan.FromMilliseconds(Math.Max(0, graceMs));
            if (gap <= expected + grace) return TimeSpan.Zero;

            TimeSpan paused = gap - expected;
            Interlocked.Exchange(ref _ResumedTicks, now.Ticks);
            Interlocked.Exchange(ref _PauseTicks, paused.Ticks);
            Interlocked.Increment(ref _Pauses);
            return paused;
        }

        /// <summary>
        /// Record an observation now without checking for a pause. Call it at the end of work whose own duration should
        /// not count toward the next gap.
        /// </summary>
        public void Touch()
        {
            Interlocked.Exchange(ref _LastTicks, UtcNow.Ticks);
        }

        #endregion
    }
}
