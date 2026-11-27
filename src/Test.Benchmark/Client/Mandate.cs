namespace Garrison.Benchmark.Client
{
    using System;

    /// <summary>
    /// The fields of a keeper mandate the harness reads.
    /// </summary>
    public class Mandate
    {
        /// <summary>
        /// Identifier (mdt_).
        /// </summary>
        public string Id { get; set; } = String.Empty;

        /// <summary>
        /// Name, unique in the tenant.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// Draft, Active, Paused, Frozen, CapReached, or Retired.
        /// </summary>
        public string Status { get; set; } = String.Empty;

        /// <summary>
        /// When the next tick is due, or null.
        /// </summary>
        public DateTime? NextWakeUtc { get; set; } = null;

        /// <summary>
        /// The tick in progress, or null.
        /// </summary>
        public string? ActiveTickId { get; set; } = null;

        /// <summary>
        /// Ticks recorded so far.
        /// </summary>
        public int TickCount { get; set; } = 0;
    }
}
