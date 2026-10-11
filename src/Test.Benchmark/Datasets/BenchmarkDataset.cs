namespace Garrison.Benchmark.Datasets
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// A dataset in the neutral format documented in benchmarks/datasets/SCHEMA.md: corpora of manifest items and the probes that exercise them.
    /// </summary>
    public class BenchmarkDataset
    {
        /// <summary>
        /// Dataset name, lowercase letters, digits, and hyphens; used in report file names.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// Description.
        /// </summary>
        public string? Description { get; set; }

        /// <summary>
        /// Schema version of this file. Currently 1.
        /// </summary>
        public int SchemaVersion { get; set; } = 1;

        /// <summary>
        /// Tier: live, synthetic, public, or local.
        /// </summary>
        public string? Tier { get; set; }

        /// <summary>
        /// For live data, the date the snapshot was frozen (yyyy-MM-dd).
        /// </summary>
        public string? SnapshotDate { get; set; }

        /// <summary>
        /// Where the data came from.
        /// </summary>
        public string? Source { get; set; }

        /// <summary>
        /// Corpora; each one is provisioned as its own workspace (tenant).
        /// </summary>
        public List<BenchmarkCorpus> Corpora { get; set; } = new List<BenchmarkCorpus>();
    }
}
