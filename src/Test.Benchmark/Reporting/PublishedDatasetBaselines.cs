namespace Garrison.Benchmark.Reporting
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Published or prior results for one dataset.
    /// </summary>
    public class PublishedDatasetBaselines
    {
        /// <summary>
        /// Dataset name, or * for any dataset.
        /// </summary>
        public string Dataset { get; set; } = String.Empty;

        /// <summary>
        /// Report kinds the entries apply to (empty means all).
        /// </summary>
        public List<string> Kinds { get; set; } = new List<string>();

        /// <summary>
        /// Why there is (or is not) a comparable published result.
        /// </summary>
        public string? Note { get; set; }

        /// <summary>
        /// Results.
        /// </summary>
        public List<PublishedResult> Results { get; set; } = new List<PublishedResult>();
    }
}
