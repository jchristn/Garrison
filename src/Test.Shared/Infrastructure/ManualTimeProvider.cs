namespace Test.Shared.Infrastructure
{
    using System;
    using System.Threading;

    /// <summary>
    /// Clock that only moves when a test advances it, for simulating pauses deterministically. Only
    /// <see cref="GetUtcNow"/> is overridden; timers still run on the system clock. Thread-safe.
    /// </summary>
    public class ManualTimeProvider : TimeProvider
    {
        #region Private-Members

        private long _Ticks;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate at a start time.
        /// </summary>
        /// <param name="startUtc">Start time; converted to UTC.</param>
        public ManualTimeProvider(DateTime startUtc)
        {
            _Ticks = startUtc.ToUniversalTime().Ticks;
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public override DateTimeOffset GetUtcNow()
        {
            return new DateTimeOffset(Interlocked.Read(ref _Ticks), TimeSpan.Zero);
        }

        /// <summary>
        /// Current time as a UTC <see cref="DateTime"/>.
        /// </summary>
        /// <returns>Now.</returns>
        public DateTime UtcNow()
        {
            return new DateTime(Interlocked.Read(ref _Ticks), DateTimeKind.Utc);
        }

        /// <summary>
        /// Move the clock forward.
        /// </summary>
        /// <param name="amount">Amount; negative values move it back.</param>
        public void Advance(TimeSpan amount)
        {
            Interlocked.Add(ref _Ticks, amount.Ticks);
        }

        #endregion
    }
}
