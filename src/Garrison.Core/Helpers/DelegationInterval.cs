namespace Garrison.Core.Helpers
{
    using System;

    /// <summary>
    /// A half-open UTC time interval used when merging child run lifetimes. Immutable and thread-safe.
    /// </summary>
    public class DelegationInterval
    {
        /// <summary>
        /// Inclusive start.
        /// </summary>
        public DateTime Start { get; }

        /// <summary>
        /// Exclusive end, never before Start.
        /// </summary>
        public DateTime End { get; }

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="start">Start.</param>
        /// <param name="end">End; an end before the start is raised to the start.</param>
        public DelegationInterval(DateTime start, DateTime end)
        {
            Start = start;
            End = end < start ? start : end;
        }
    }
}
