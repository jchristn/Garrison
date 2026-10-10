namespace Garrison.Core.Responses
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// One series of gap-filled buckets.
    /// </summary>
    public class RunAnalyticsSeries
    {
        /// <summary>
        /// Series key: "all" without grouping, the agent ID when grouped by agent, or the harness type when grouped
        /// by harness.
        /// </summary>
        public string Key { get; set; } = String.Empty;

        /// <summary>
        /// Display label: "All runs", the agent name, or the harness type.
        /// </summary>
        public string Label { get; set; } = String.Empty;

        /// <summary>
        /// Buckets in ascending time order, one per interval in the range, including empty ones.
        /// </summary>
        public List<RunAnalyticsBucket> Buckets { get; set; } = new List<RunAnalyticsBucket>();
    }
}
