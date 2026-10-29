namespace Garrison.Core.Models
{
    /// <summary>
    /// One finished run summarized by capability hints (AD4.5).
    /// </summary>
    public class CapabilityRunSample
    {
        /// <summary>
        /// Time from start to completion, in milliseconds. Zero or more.
        /// </summary>
        public long DurationMs { get; set; } = 0;

        /// <summary>
        /// Recorded cost in US dollars, or null when the run recorded none.
        /// </summary>
        public double? CostUsd { get; set; } = null;
    }
}
