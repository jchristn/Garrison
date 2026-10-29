namespace Garrison.Sdk.Models
{
    using System;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Cost and latency hints for a capability, summarized by the server from finished runs over a bounded window. When
    /// too few runs finished, the status is Unknown and every value is null; a hint is never reported as zero for lack of
    /// data. Not thread-safe.
    /// </summary>
    public class CapabilityHints
    {
        #region Public-Members

        /// <summary>
        /// Whether the values are backed by enough runs. Default Unknown.
        /// </summary>
        public CapabilityHintStatusEnum Status { get; set; } = CapabilityHintStatusEnum.Unknown;

        /// <summary>
        /// Finished runs the hints summarize. Zero or more; negative values are stored as zero.
        /// </summary>
        public int SampleSize
        {
            get
            {
                return _SampleSize;
            }
            set
            {
                _SampleSize = Math.Max(0, value);
            }
        }

        /// <summary>
        /// Median run duration in milliseconds, from start to completion, or null when unknown.
        /// </summary>
        public long? MedianDurationMs { get; set; } = null;

        /// <summary>
        /// 90th percentile run duration in milliseconds, or null when unknown.
        /// </summary>
        public long? P90DurationMs { get; set; } = null;

        /// <summary>
        /// Mean cost in US dollars of the runs that recorded a cost, or null when unknown or when no run recorded one.
        /// </summary>
        public double? MeanCostUsd { get; set; } = null;

        /// <summary>
        /// Length of the window the hints cover, in days.
        /// </summary>
        public int WindowDays { get; set; } = 0;

        /// <summary>
        /// When the hints were last computed (UTC), or null when never.
        /// </summary>
        public DateTime? ComputedUtc { get; set; } = null;

        #endregion

        #region Private-Members

        private int _SampleSize = 0;

        #endregion
    }
}
