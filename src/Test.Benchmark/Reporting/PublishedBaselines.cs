namespace Garrison.Benchmark.Reporting
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// The committed benchmarks/baselines.json: published or prior results per dataset, shown next to every report.
    /// </summary>
    public class PublishedBaselines
    {
        /// <summary>
        /// Schema version. Currently 1.
        /// </summary>
        public int SchemaVersion { get; set; } = 1;

        /// <summary>
        /// Entries per dataset. Dataset "*" applies to every dataset of the listed report kinds.
        /// </summary>
        public List<PublishedDatasetBaselines> Datasets { get; set; } = new List<PublishedDatasetBaselines>();
    }
}
